package main

import (
	"context"
	"encoding/json"
	"log"
	"net"
	"net/http"
	"os"
	"strconv"
	"strings"
	"time"

	"github.com/grpc-ecosystem/grpc-gateway/v2/runtime"
	"github.com/redis/go-redis/v9"
	poofmqv1 "github.com/rubybear-lgtm/poofmq/gen/go/poofmq"
	"github.com/rubybear-lgtm/poofmq/services/go-api/internal/config"
	"github.com/rubybear-lgtm/poofmq/services/go-api/internal/metrics"
	"github.com/rubybear-lgtm/poofmq/services/go-api/internal/queue"
	"github.com/rubybear-lgtm/poofmq/services/go-api/internal/service"
	"google.golang.org/grpc"
	"google.golang.org/grpc/credentials/insecure"
)

type health struct {
	Status    string `json:"status"`
	Redis     string `json:"redis"`
	Postgres  string `json:"postgres"`
	Timestamp string `json:"timestamp"`
}

func main() {
	cfg := config.Load()

	// Initialize Redis client
	rdb := redis.NewClient(&redis.Options{
		Addr:     cfg.RedisAddress(),
		Password: cfg.RedisPassword,
		DB:       0,
	})
	defer rdb.Close()

	// Test Redis connection
	ctx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
	if err := rdb.Ping(ctx).Err(); err != nil {
		log.Printf("warning: failed to connect to Redis at %s: %v", cfg.RedisAddress(), err)
	}
	cancel()

	// Initialize queue client with Redis
	queueClient := queue.NewClient(rdb)

	// Create gRPC server
	grpcServer := grpc.NewServer()
	queueService := service.NewQueueServiceServer(queueClient)
	poofmqv1.RegisterQueueServiceServer(grpcServer, queueService)

	// Start gRPC server on separate port
	grpcPort := envOrDefault("GO_API_GRPC_PORT", "9090")
	grpcListener, err := net.Listen("tcp", ":"+grpcPort)
	if err != nil {
		log.Fatalf("failed to listen for gRPC: %v", err)
	}

	go func() {
		log.Printf("gRPC server starting on :%s (pid=%d)", grpcPort, os.Getpid())
		if err := grpcServer.Serve(grpcListener); err != nil {
			log.Fatalf("gRPC server error: %v", err)
		}
	}()

	// Create gRPC-Gateway mux
	ctx = context.Background()
	gwMux := runtime.NewServeMux()

	// Register gRPC-Gateway handlers
	opts := []grpc.DialOption{grpc.WithTransportCredentials(insecure.NewCredentials())}
	err = poofmqv1.RegisterQueueServiceHandlerFromEndpoint(ctx, gwMux, "localhost:"+grpcPort, opts)
	if err != nil {
		log.Fatalf("failed to register gateway: %v", err)
	}

	// Create HTTP mux for additional endpoints
	httpMux := http.NewServeMux()

	// Health endpoint
	httpMux.HandleFunc("/health", func(writer http.ResponseWriter, request *http.Request) {
		redisStatus := "up"
		ctx, cancel := context.WithTimeout(context.Background(), 2*time.Second)
		if err := rdb.Ping(ctx).Err(); err != nil {
			redisStatus = "down"
		}
		cancel()

		postgresStatus := "up"
		if !canConnect(cfg.PostgresAddress(), 2*time.Second) {
			postgresStatus = "down"
		}

		response := health{
			Status:    "ok",
			Redis:     redisStatus,
			Postgres:  postgresStatus,
			Timestamp: time.Now().UTC().Format(time.RFC3339),
		}

		writer.Header().Set("Content-Type", "application/json")
		if err := json.NewEncoder(writer).Encode(response); err != nil {
			writer.WriteHeader(http.StatusInternalServerError)
		}
	})

	// Root endpoint
	httpMux.HandleFunc("/", func(writer http.ResponseWriter, request *http.Request) {
		writer.WriteHeader(http.StatusOK)
		_, _ = writer.Write([]byte("poofmq go api"))
	})

	// Metrics endpoint
	httpMux.HandleFunc("/metrics", func(writer http.ResponseWriter, request *http.Request) {
		snapshot := metrics.SnapshotMetrics()

		ctx, cancel := context.WithTimeout(request.Context(), 2*time.Second)
		defer cancel()

		redisMemoryBytes := redisUsedMemoryBytes(ctx, rdb)

		payload := map[string]any{
			"push_total":          snapshot.PushTotal,
			"push_errors_total":   snapshot.PushErrorsTotal,
			"pop_total":           snapshot.PopTotal,
			"pop_errors_total":    snapshot.PopErrorsTotal,
			"avg_push_latency_ms": snapshot.AvgPushLatency,
			"avg_pop_latency_ms":  snapshot.AvgPopLatency,
			"redis_memory_bytes":  redisMemoryBytes,
		}

		writer.Header().Set("Content-Type", "application/json")
		if err := json.NewEncoder(writer).Encode(payload); err != nil {
			writer.WriteHeader(http.StatusInternalServerError)
		}
	})

	// Combine handlers - gRPC-Gateway handles /v1/* paths, httpMux handles others
	handler := http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		// Route gRPC-Gateway paths
		if strings.HasPrefix(r.URL.Path, "/v1/") {
			gwMux.ServeHTTP(w, r)
			return
		}
		httpMux.ServeHTTP(w, r)
	})

	// Start HTTP server with gateway
	server := &http.Server{
		Addr:              ":" + cfg.HTTPPort,
		Handler:           handler,
		ReadHeaderTimeout: 3 * time.Second,
	}

	log.Printf("HTTP/Gateway server starting on :%s (pid=%d)", cfg.HTTPPort, os.Getpid())
	if err := server.ListenAndServe(); err != nil && err != http.ErrServerClosed {
		log.Fatalf("server error: %v", err)
	}
}

func canConnect(address string, timeout time.Duration) bool {
	conn, err := net.DialTimeout("tcp", address, timeout)
	if err != nil {
		return false
	}

	if err := conn.Close(); err != nil {
		return false
	}

	return true
}

func envOrDefault(key string, fallback string) string {
	value := os.Getenv(key)
	if value == "" {
		return fallback
	}

	return value
}

func redisUsedMemoryBytes(ctx context.Context, rdb *redis.Client) int64 {
	info, err := rdb.Info(ctx, "memory").Result()
	if err != nil {
		return 0
	}

	return parseRedisUsedMemory(info)
}

func parseRedisUsedMemory(info string) int64 {
	for _, line := range strings.Split(info, "\n") {
		if !strings.HasPrefix(line, "used_memory:") {
			continue
		}

		value := strings.TrimSpace(strings.TrimPrefix(line, "used_memory:"))
		parsed, parseErr := strconv.ParseInt(value, 10, 64)
		if parseErr != nil {
			return 0
		}

		return parsed
	}

	return 0
}
