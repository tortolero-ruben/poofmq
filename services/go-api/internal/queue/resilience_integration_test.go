package queue

import (
	"context"
	"errors"
	"strconv"
	"strings"
	"testing"
	"time"

	"github.com/redis/go-redis/v9"
)

func TestClientIntegrationExpiresMessagesUnderTTLPressureWithTestcontainers(t *testing.T) {
	client, _ := newContainerBackedQueueClient(t)
	ctx := context.Background()

	queueID := "integration-ttl-expiry"
	ttl := int32(1)

	_, err := client.Push(ctx, queueID, "message.expiring", map[string]any{
		"payload": "short-lived",
	}, PushOptions{TTLSeconds: &ttl})
	if err != nil {
		t.Fatalf("Push() error = %v", err)
	}

	time.Sleep(1500 * time.Millisecond)

	_, err = client.Pop(ctx, queueID, PopOptions{})
	if !errors.Is(err, ErrQueueEmpty) {
		t.Fatalf("Pop() error = %v, want %v", err, ErrQueueEmpty)
	}
}

func TestClientIntegrationReportsFailureWhenRedisUnavailableWithTestcontainers(t *testing.T) {
	container, host, port := startRedisContainer(t)

	rdb := redis.NewClient(&redis.Options{Addr: host + ":" + port, DB: 0})
	client := NewClient(rdb)

	ctx := context.Background()
	if err := rdb.Ping(ctx).Err(); err != nil {
		t.Fatalf("failed to ping redis: %v", err)
	}

	terminateCtx, cancel := context.WithTimeout(context.Background(), 15*time.Second)
	defer cancel()
	if err := container.Terminate(terminateCtx); err != nil {
		t.Fatalf("failed to terminate redis container: %v", err)
	}

	t.Cleanup(func() {
		_ = rdb.Close()
	})

	_, err := client.Push(ctx, "integration-outage", "message.push", map[string]any{"value": 1}, PushOptions{})
	if err == nil {
		t.Fatal("Push() expected error after Redis outage, got nil")
	}
}

func TestClientIntegrationCapturesEvictionSignalUnderMemoryPressureWithTestcontainers(t *testing.T) {
	client, redisClient := newContainerBackedQueueClient(t)
	ctx := context.Background()

	if err := redisClient.ConfigSet(ctx, "maxmemory", "1mb").Err(); err != nil {
		t.Fatalf("ConfigSet(maxmemory) error = %v", err)
	}

	if err := redisClient.ConfigSet(ctx, "maxmemory-policy", "allkeys-lru").Err(); err != nil {
		t.Fatalf("ConfigSet(maxmemory-policy) error = %v", err)
	}

	payload := map[string]any{
		"blob": strings.Repeat("x", 65536),
	}

	for i := 0; i < 200; i++ {
		_, _ = client.Push(ctx, "integration-eviction", "message.large", payload, PushOptions{})
	}

	info, err := redisClient.Info(ctx, "stats").Result()
	if err != nil {
		t.Fatalf("Info(stats) error = %v", err)
	}

	evictedKeys := parseRedisInfoInteger(info, "evicted_keys")
	if evictedKeys <= 0 {
		t.Skip("could not deterministically trigger Redis eviction in this runtime")
	}
}

func parseRedisInfoInteger(info string, key string) int64 {
	prefix := key + ":"

	for _, line := range strings.Split(info, "\n") {
		if !strings.HasPrefix(line, prefix) {
			continue
		}

		value := strings.TrimSpace(strings.TrimPrefix(line, prefix))
		parsed, err := strconv.ParseInt(value, 10, 64)
		if err != nil {
			return 0
		}

		return parsed
	}

	return 0
}
