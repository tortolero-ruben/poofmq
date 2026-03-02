// Package queue provides Redis-backed queue operations for poofMQ.
package queue

import (
	"context"
	"encoding/json"
	"errors"
	"fmt"
	"time"

	"github.com/google/uuid"
	"github.com/redis/go-redis/v9"
)

var (
	ErrQueueEmpty     = errors.New("queue is empty")
	ErrInvalidMessage = errors.New("invalid message format")
	ErrTTLTooLow      = errors.New("TTL is below minimum allowed value")
	ErrTTLTooHigh     = errors.New("TTL exceeds maximum allowed value")
)

// TTL constants for queue messages
const (
	DefaultTTLSeconds = 86400  // 24 hours default
	MaxTTLSeconds     = 604800 // 7 days maximum
	MinTTLSeconds     = 1      // 1 second minimum
	QueueKeyBufferTTL = 3600   // 1 hour buffer added to queue key TTL
)

// atomicPopScript is a Lua script that atomically pops a message from a queue.
// This provides atomic at-most-once delivery semantics: the message is removed
// atomically and at most one consumer can receive it. If a consumer fails after
// popping, the message is permanently lost (no ack/nack or redelivery mechanism).
// The script returns nil if the queue is empty, otherwise returns the message data.
var atomicPopScript = redis.NewScript(`
	local queueKey = KEYS[1]
	local messageData = redis.call('RPOP', queueKey)
	if messageData then
		return messageData
	end
	return nil
`)

// Message represents a queue message with metadata.
type Message struct {
	ID            string            `json:"id"`
	QueueID       string            `json:"queue_id"`
	EventType     string            `json:"event_type"`
	Payload       map[string]any    `json:"payload"`
	Metadata      map[string]string `json:"metadata,omitempty"`
	QueuedAt      time.Time         `json:"queued_at"`
	VisibleAt     time.Time         `json:"visible_at"`
	ExpiresAt     time.Time         `json:"expires_at"`
	ReceiptHandle string            `json:"receipt_handle,omitempty"`
	TTLSeconds    int               `json:"ttl_seconds,omitempty"`
}

// PushOptions configures the push operation.
type PushOptions struct {
	// TTLSeconds is optional; if nil, the default TTL is applied.
	// If set, the value is validated against TTLPolicy (min/max bounds).
	// Note: 0 is not valid and will be rejected (use nil for default).
	TTLSeconds  *int32
	AvailableAt time.Time
}

// PopOptions configures the pop operation.
// Note: Currently, only VisibilityTimeoutSeconds is used to affect delivery
// semantics in Pop. WaitTimeoutSeconds and ConsumerID are reserved for future
// use and have no effect on message delivery at this time.
type PopOptions struct {
	VisibilityTimeoutSeconds int
	// Deprecated: WaitTimeoutSeconds is currently ignored by Pop and does not
	// affect message delivery behavior. It is reserved for future use.
	WaitTimeoutSeconds int
	// Deprecated: ConsumerID is currently only used for non-delivery-related
	// metadata and does not affect which messages are delivered to a consumer.
	// It is reserved for future use with consumer-specific semantics.
	ConsumerID string
}

// TTLPolicy defines the TTL constraints for queue messages.
type TTLPolicy struct {
	DefaultTTLSeconds int
	MaxTTLSeconds     int
	MinTTLSeconds     int
}

// DefaultTTLPolicy returns the default TTL policy configuration.
func DefaultTTLPolicy() TTLPolicy {
	return TTLPolicy{
		DefaultTTLSeconds: DefaultTTLSeconds,
		MaxTTLSeconds:     MaxTTLSeconds,
		MinTTLSeconds:     MinTTLSeconds,
	}
}

// Validate checks if the requested TTL is within policy bounds.
// Returns the effective TTL to use (default if not specified) or an error.
func (p TTLPolicy) Validate(requestedTTL *int32) (int, error) {
	var ttl int
	if requestedTTL == nil {
		ttl = p.DefaultTTLSeconds
	} else {
		ttl = int(*requestedTTL)
	}

	if ttl < p.MinTTLSeconds {
		return 0, fmt.Errorf("%w: minimum is %d seconds, got %d", ErrTTLTooLow, p.MinTTLSeconds, ttl)
	}

	if ttl > p.MaxTTLSeconds {
		return 0, fmt.Errorf("%w: maximum is %d seconds, got %d", ErrTTLTooHigh, p.MaxTTLSeconds, ttl)
	}

	return ttl, nil
}

// Client provides queue operations backed by Redis.
type Client struct {
	redis     *redis.Client
	ttlPolicy TTLPolicy
}

// NewClient creates a new queue client with default TTL policy.
func NewClient(rdb *redis.Client) *Client {
	return &Client{
		redis:     rdb,
		ttlPolicy: DefaultTTLPolicy(),
	}
}

// NewClientWithPolicy creates a new queue client with custom TTL policy.
func NewClientWithPolicy(rdb *redis.Client, policy TTLPolicy) *Client {
	return &Client{
		redis:     rdb,
		ttlPolicy: policy,
	}
}

// Push adds a message to the queue with enforced TTL policy.
// Returns an error if TTL validation fails or Redis operation fails.
// The queue key always has an EXPIRE set to prevent key leakage.
func (c *Client) Push(ctx context.Context, queueID string, eventType string, payload map[string]any, opts PushOptions) (*Message, error) {
	// Validate TTL against policy - this is the critical enforcement point
	ttl, err := c.ttlPolicy.Validate(opts.TTLSeconds)
	if err != nil {
		return nil, fmt.Errorf("TTL validation failed: %w", err)
	}

	now := time.Now().UTC()
	messageID := uuid.New().String()

	availableAt := opts.AvailableAt
	if availableAt.IsZero() {
		availableAt = now
	}

	msg := &Message{
		ID:         messageID,
		QueueID:    queueID,
		EventType:  eventType,
		Payload:    payload,
		QueuedAt:   now,
		VisibleAt:  availableAt,
		ExpiresAt:  now.Add(time.Duration(ttl) * time.Second),
		TTLSeconds: ttl,
	}

	data, err := json.Marshal(msg)
	if err != nil {
		return nil, fmt.Errorf("failed to marshal message: %w", err)
	}

	queueKey := c.queueKey(queueID)
	queueKeyTTL := time.Duration(ttl+QueueKeyBufferTTL) * time.Second

	// Use TxPipelined so both operations run in a single MULTI/EXEC transaction.
	// This guarantees TTL is ALWAYS set on every write operation.
	_, err = c.redis.TxPipelined(ctx, func(pipe redis.Pipeliner) error {
		// Push to the queue (LPUSH for FIFO semantics when combined with RPOP)
		if err := pipe.LPush(ctx, queueKey, data).Err(); err != nil {
			return fmt.Errorf("failed to push message to queue: %w", err)
		}

		// CRITICAL: Always enforce EXPIRE on the queue key
		// This is the core TTL enforcement - no write can happen without expiry
		if err := pipe.Expire(ctx, queueKey, queueKeyTTL).Err(); err != nil {
			return fmt.Errorf("failed to set TTL on queue: %w", err)
		}

		return nil
	})

	if err != nil {
		return nil, err
	}

	return msg, nil
}

// Pop atomically retrieves and removes a message from the queue.
// This implements at-most-once delivery semantics using a Redis Lua script for atomicity:
// each enqueued message will be popped by at most one consumer, but messages can be lost
// if a consumer crashes after popping and before completing processing.
func (c *Client) Pop(ctx context.Context, queueID string, opts PopOptions) (*Message, error) {
	queueKey := c.queueKey(queueID)

	// Use iterative loop with bounded attempts to avoid stack overflow
	const maxAttempts = 100
	for attempt := 0; attempt < maxAttempts; attempt++ {
		// Execute atomic pop using Lua script
		// This ensures atomic delivery: the message is removed atomically
		// and only one consumer can receive it
		result, err := atomicPopScript.Run(ctx, c.redis, []string{queueKey}).Result()
		if err != nil {
			if errors.Is(err, redis.Nil) {
				return nil, ErrQueueEmpty
			}
			return nil, fmt.Errorf("failed to pop message: %w", err)
		}

		// Empty queue - return nil message (not an error)
		if result == nil {
			return nil, ErrQueueEmpty
		}

		// Deserialize message
		msgData, ok := result.(string)
		if !ok {
			return nil, ErrInvalidMessage
		}

		var msg Message
		if err := json.Unmarshal([]byte(msgData), &msg); err != nil {
			return nil, ErrInvalidMessage
		}

		now := time.Now().UTC()

		// Check if message has expired
		if now.After(msg.ExpiresAt) {
			// Message expired, discard and try to pop another one iteratively
			continue
		}

		// Check if message is visible
		if now.Before(msg.VisibleAt) {
			// Message not yet visible, re-push to queue for later processing
			// with TTL enforcement maintained
			if err := c.repushWithTTL(ctx, queueKey, &msg); err != nil {
				return nil, fmt.Errorf("failed to re-push invisible message: %w", err)
			}
			// Behave like an empty queue until the message becomes visible
			return nil, ErrQueueEmpty
		}

		// Generate receipt handle for this pop operation
		msg.ReceiptHandle = uuid.New().String()

		// Store receipt handle for visibility timeout tracking if specified
		if opts.VisibilityTimeoutSeconds > 0 {
			if err := c.redis.Set(ctx, c.receiptKey(queueID, msg.ReceiptHandle), msg.ID, time.Duration(opts.VisibilityTimeoutSeconds)*time.Second).Err(); err != nil {
				return nil, fmt.Errorf("failed to store receipt handle: %w", err)
			}
		}

		return &msg, nil
	}

	return nil, fmt.Errorf("exceeded maximum pop attempts (%d), queue may be in an inconsistent state", maxAttempts)
}

// repushWithTTL re-pushes a message to the queue while maintaining TTL enforcement.
// This ensures all writes to Redis have proper expiry set.
func (c *Client) repushWithTTL(ctx context.Context, queueKey string, msg *Message) error {
	data, err := json.Marshal(msg)
	if err != nil {
		return fmt.Errorf("failed to marshal message: %w", err)
	}

	// Calculate remaining TTL from the message's ExpiresAt
	remainingTTL := time.Until(msg.ExpiresAt)
	if remainingTTL <= 0 {
		// Message already expired, don't re-push
		return nil
	}

	// Add buffer to queue key TTL to ensure messages don't expire before processing.
	// QueueKeyBufferTTL is defined in seconds, so convert it to a time.Duration.
	buffer := time.Duration(QueueKeyBufferTTL) * time.Second
	queueKeyTTL := remainingTTL + buffer

	// Use TxPipelined so both operations run in a single MULTI/EXEC transaction.
	_, err = c.redis.TxPipelined(ctx, func(pipe redis.Pipeliner) error {
		if err := pipe.LPush(ctx, queueKey, data).Err(); err != nil {
			return fmt.Errorf("failed to re-push message: %w", err)
		}

		// CRITICAL: Always enforce EXPIRE on re-push operations
		if err := pipe.Expire(ctx, queueKey, queueKeyTTL).Err(); err != nil {
			return fmt.Errorf("failed to set TTL on queue: %w", err)
		}

		return nil
	})

	return err
}

// Size returns the number of messages in the queue.
func (c *Client) Size(ctx context.Context, queueID string) (int64, error) {
	result, err := c.redis.LLen(ctx, c.queueKey(queueID)).Result()
	if err != nil {
		return 0, fmt.Errorf("failed to get queue size: %w", err)
	}
	return result, nil
}

// Clear removes all messages from the queue.
func (c *Client) Clear(ctx context.Context, queueID string) error {
	return c.redis.Del(ctx, c.queueKey(queueID)).Err()
}

// DeleteReceipt removes a receipt handle (for ack/nack operations).
func (c *Client) DeleteReceipt(ctx context.Context, queueID, receiptHandle string) error {
	return c.redis.Del(ctx, c.receiptKey(queueID, receiptHandle)).Err()
}

func (c *Client) queueKey(queueID string) string {
	return fmt.Sprintf("poofmq:queue:%s", queueID)
}

func (c *Client) receiptKey(queueID, receiptHandle string) string {
	return fmt.Sprintf("poofmq:receipt:%s:%s", queueID, receiptHandle)
}
