// Package testhelpers provides utilities for testing with Redis.
package testhelpers

import (
	"context"
	"fmt"
	"os"
	"testing"
	"time"

	"github.com/redis/go-redis/v9"
)

const (
	defaultRedisHost = "localhost"
	defaultRedisPort = "6379"
)

// RedisConfig holds Redis test configuration.
type RedisConfig struct {
	Host     string
	Port     string
	Password string
}

// LoadRedisConfig creates Redis config from environment or defaults.
func LoadRedisConfig() RedisConfig {
	return RedisConfig{
		Host:     envOrDefault("REDIS_HOST", defaultRedisHost),
		Port:     envOrDefault("REDIS_PORT", defaultRedisPort),
		Password: os.Getenv("REDIS_PASSWORD"),
	}
}

// Address returns the Redis address in host:port format.
func (c RedisConfig) Address() string {
	return fmt.Sprintf("%s:%s", c.Host, c.Port)
}

// NewRedisClient creates a new Redis client for testing.
func NewRedisClient(cfg RedisConfig) *redis.Client {
	return redis.NewClient(&redis.Options{
		Addr:         cfg.Address(),
		Password:     cfg.Password,
		DB:           0,
		DialTimeout:  5 * time.Second,
		ReadTimeout:  3 * time.Second,
		WriteTimeout: 3 * time.Second,
	})
}

// RedisTestSuite provides a complete Redis test setup with cleanup.
type RedisTestSuite struct {
	Client *redis.Client
	Config RedisConfig
	TB     *testing.T
}

// SetupRedis creates a Redis test suite with connection verification.
func SetupRedis(tb *testing.T) *RedisTestSuite {
	tb.Helper()

	cfg := LoadRedisConfig()
	client := NewRedisClient(cfg)

	ctx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
	defer cancel()

	if err := client.Ping(ctx).Err(); err != nil {
		_ = client.Close()
		tb.Skipf("Redis not available at %s: %v", cfg.Address(), err)
	}

	return &RedisTestSuite{
		Client: client,
		Config: cfg,
		TB:     tb,
	}
}

// Cleanup flushes the Redis database and closes the connection.
func (s *RedisTestSuite) Cleanup() {
	ctx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
	defer cancel()

	// Flush all keys in the test database
	if err := s.Client.FlushDB(ctx).Err(); err != nil {
		if s.TB != nil {
			s.TB.Logf("warning: failed to flush test database: %v", err)
		}
	}

	if err := s.Client.Close(); err != nil {
		if s.TB != nil {
			s.TB.Logf("warning: failed to close Redis client: %v", err)
		}
	}
}

// FlushQueue removes the primary Redis key for the given queue.
func (s *RedisTestSuite) FlushQueue(ctx context.Context, queueID string) error {
	key := fmt.Sprintf("poofmq:queue:%s", queueID)
	return s.Client.Del(ctx, key).Err()
}

// SkipIfNoRedis skips the test if Redis is not available.
func SkipIfNoRedis(tb *testing.T) {
	tb.Helper()

	cfg := LoadRedisConfig()
	client := NewRedisClient(cfg)

	ctx, cancel := context.WithTimeout(context.Background(), 2*time.Second)
	defer cancel()

	if err := client.Ping(ctx).Err(); err != nil {
		tb.Skipf("Redis not available at %s: %v", cfg.Address(), err)
	}
	client.Close()
}

// SetupBenchRedis creates a Redis test suite for benchmarks.
func SetupBenchRedis(b *testing.B) *RedisTestSuite {
	b.Helper()

	cfg := LoadRedisConfig()
	client := NewRedisClient(cfg)

	ctx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
	defer cancel()

	if err := client.Ping(ctx).Err(); err != nil {
		b.Fatalf("failed to connect to Redis at %s: %v", cfg.Address(), err)
	}

	return &RedisTestSuite{
		Client: client,
		Config: cfg,
		TB:     nil, // Not used for benchmarks
	}
}

func envOrDefault(key string, fallback string) string {
	value := os.Getenv(key)
	if value == "" {
		return fallback
	}
	return value
}
