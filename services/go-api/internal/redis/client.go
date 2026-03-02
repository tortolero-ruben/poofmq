package redis

import (
	"context"
	"fmt"

	"github.com/redis/go-redis/v9"
	"github.com/tortolero-ruben/poofmq/services/go-api/internal/config"
)

// Client wraps the Redis client with queue-specific operations.
type Client struct {
	rdb *redis.Client
}

// NewClient creates a new Redis client from configuration.
func NewClient(cfg config.Config) (*Client, error) {
	rdb := redis.NewClient(&redis.Options{
		Addr:     cfg.RedisAddress(),
		Password: cfg.RedisPassword,
		DB:       0,
	})

	// Test connection
	ctx := context.Background()
	if err := rdb.Ping(ctx).Err(); err != nil {
		return nil, fmt.Errorf("failed to connect to Redis: %w", err)
	}

	return &Client{rdb: rdb}, nil
}

// Close closes the Redis connection.
func (c *Client) Close() error {
	return c.rdb.Close()
}

// QueueKey returns the Redis key for a queue.
func QueueKey(queueID string) string {
	return fmt.Sprintf("poofmq:queue:%s", queueID)
}

// MessageKey returns the Redis key for a message's data.
func MessageKey(messageID string) string {
	return fmt.Sprintf("poofmq:message:%s", messageID)
}
