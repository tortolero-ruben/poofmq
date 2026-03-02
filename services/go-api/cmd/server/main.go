package main

import (
	"encoding/json"
	"log"
	"net"
	"net/http"
	"os"
	"time"

	"github.com/tortolero-ruben/poofmq/services/go-api/internal/config"
)

type health struct {
	Status    string `json:"status"`
	Redis     string `json:"redis"`
	Postgres  string `json:"postgres"`
	Timestamp string `json:"timestamp"`
}

func main() {
	cfg := config.Load()

	mux := http.NewServeMux()
	mux.HandleFunc("/health", func(writer http.ResponseWriter, request *http.Request) {
		redisStatus := "up"
		if !canConnect(cfg.RedisAddress(), 2*time.Second) {
			redisStatus = "down"
		}

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

	mux.HandleFunc("/", func(writer http.ResponseWriter, request *http.Request) {
		writer.WriteHeader(http.StatusOK)
		_, _ = writer.Write([]byte("poofmq go api"))
	})

	server := &http.Server{
		Addr:              ":" + cfg.HTTPPort,
		Handler:           mux,
		ReadHeaderTimeout: 3 * time.Second,
	}

	log.Printf("go-api starting on :%s (pid=%d)", cfg.HTTPPort, os.Getpid())
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
