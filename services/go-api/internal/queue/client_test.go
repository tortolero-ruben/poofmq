package queue

import (
	"context"
	"encoding/json"
	"errors"
	"testing"
	"time"

	"github.com/tortolero-ruben/poofmq/services/go-api/internal/testhelpers"
)

func TestClient_PushPop(t *testing.T) {

	suite := testhelpers.SetupRedis(t)
	t.Cleanup(suite.Cleanup)

	client := NewClient(suite.Client)
	ctx := context.Background()

	tests := []struct {
		name      string
		queueID   string
		eventType string
		payload   map[string]any
		opts      PushOptions
		wantErr   bool
	}{
		{
			name:      "basic push",
			queueID:   "test-queue-1",
			eventType: "user.created",
			payload:   map[string]any{"user_id": "123", "email": "test@example.com"},
			opts:      PushOptions{},
			wantErr:   false,
		},
		{
			name:      "push with TTL",
			queueID:   "test-queue-2",
			eventType: "order.placed",
			payload:   map[string]any{"order_id": "456"},
			opts:      PushOptions{TTLSeconds: ptrInt32(3600)},
			wantErr:   false,
		},
		{
			name:      "push with delayed visibility",
			queueID:   "test-queue-3",
			eventType: "task.scheduled",
			payload:   map[string]any{"task_id": "789"},
			opts:      PushOptions{AvailableAt: time.Now().Add(-1 * time.Second)},
			wantErr:   false,
		},
		{
			name:      "push with metadata",
			queueID:   "test-queue-4",
			eventType: "event.with.metadata",
			payload:   map[string]any{"data": "value", "nested": map[string]any{"key": "value"}},
			opts:      PushOptions{},
			wantErr:   false,
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			// Push message
			msg, err := client.Push(ctx, tt.queueID, tt.eventType, tt.payload, tt.opts)
			if (err != nil) != tt.wantErr {
				t.Fatalf("Push() error = %v, wantErr %v", err, tt.wantErr)
			}
			if tt.wantErr {
				return
			}

			// Verify message fields
			if msg.ID == "" {
				t.Error("message ID should not be empty")
			}
			if msg.QueueID != tt.queueID {
				t.Errorf("queue ID = %q, want %q", msg.QueueID, tt.queueID)
			}
			if msg.EventType != tt.eventType {
				t.Errorf("event type = %q, want %q", msg.EventType, tt.eventType)
			}
			if msg.QueuedAt.IsZero() {
				t.Error("queued at should not be zero")
			}

			// Pop message
			poppedMsg, err := client.Pop(ctx, tt.queueID, PopOptions{})
			if err != nil {
				t.Fatalf("Pop() error = %v", err)
			}

			// Verify popped message matches
			if poppedMsg.ID != msg.ID {
				t.Errorf("popped message ID = %q, want %q", poppedMsg.ID, msg.ID)
			}
			if poppedMsg.EventType != tt.eventType {
				t.Errorf("popped event type = %q, want %q", poppedMsg.EventType, tt.eventType)
			}

			// Verify queue is empty
			size, err := client.Size(ctx, tt.queueID)
			if err != nil {
				t.Fatalf("Size() error = %v", err)
			}
			if size != 0 {
				t.Errorf("queue size = %d, want 0", size)
			}
		})
	}
}

func TestClient_PopEmptyQueue(t *testing.T) {

	suite := testhelpers.SetupRedis(t)
	t.Cleanup(suite.Cleanup)

	client := NewClient(suite.Client)
	ctx := context.Background()

	_, err := client.Pop(ctx, "non-existent-queue", PopOptions{})
	if err != ErrQueueEmpty {
		t.Errorf("Pop() error = %v, want %v", err, ErrQueueEmpty)
	}
}

func TestClient_PopDelayedMessage(t *testing.T) {

	suite := testhelpers.SetupRedis(t)
	t.Cleanup(suite.Cleanup)

	client := NewClient(suite.Client)
	ctx := context.Background()

	queueID := "delayed-queue"

	// Push message with future visibility
	_, err := client.Push(ctx, queueID, "delayed.event", map[string]any{"data": "test"}, PushOptions{
		AvailableAt: time.Now().Add(10 * time.Second),
	})
	if err != nil {
		t.Fatalf("Push() error = %v", err)
	}

	// Pop should return empty because message is not yet visible
	_, err = client.Pop(ctx, queueID, PopOptions{})
	if err != ErrQueueEmpty {
		t.Errorf("Pop() error = %v, want %v", err, ErrQueueEmpty)
	}
}

func TestClient_PopWithVisibilityTimeout(t *testing.T) {

	suite := testhelpers.SetupRedis(t)
	t.Cleanup(suite.Cleanup)

	client := NewClient(suite.Client)
	ctx := context.Background()

	queueID := "visibility-timeout-queue"

	// Push message
	_, err := client.Push(ctx, queueID, "test.event", map[string]any{"data": "test"}, PushOptions{})
	if err != nil {
		t.Fatalf("Push() error = %v", err)
	}

	// Pop with visibility timeout
	msg, err := client.Pop(ctx, queueID, PopOptions{
		VisibilityTimeoutSeconds: 30,
		ConsumerID:               "consumer-1",
	})
	if err != nil {
		t.Fatalf("Pop() error = %v", err)
	}

	if msg.ReceiptHandle == "" {
		t.Error("receipt handle should be set when visibility timeout is specified")
	}
}

func TestClient_Size(t *testing.T) {

	suite := testhelpers.SetupRedis(t)
	t.Cleanup(suite.Cleanup)

	client := NewClient(suite.Client)
	ctx := context.Background()

	queueID := "size-test-queue"

	// Initially empty
	size, err := client.Size(ctx, queueID)
	if err != nil {
		t.Fatalf("Size() error = %v", err)
	}
	if size != 0 {
		t.Errorf("initial size = %d, want 0", size)
	}

	// Push 3 messages
	for i := 0; i < 3; i++ {
		_, err := client.Push(ctx, queueID, "test.event", map[string]any{"index": i}, PushOptions{})
		if err != nil {
			t.Fatalf("Push() error = %v", err)
		}
	}

	size, err = client.Size(ctx, queueID)
	if err != nil {
		t.Fatalf("Size() error = %v", err)
	}
	if size != 3 {
		t.Errorf("size after push = %d, want 3", size)
	}

	// Pop 1 message
	_, err = client.Pop(ctx, queueID, PopOptions{})
	if err != nil {
		t.Fatalf("Pop() error = %v", err)
	}

	size, err = client.Size(ctx, queueID)
	if err != nil {
		t.Fatalf("Size() error = %v", err)
	}
	if size != 2 {
		t.Errorf("size after pop = %d, want 2", size)
	}
}

func TestClient_Clear(t *testing.T) {

	suite := testhelpers.SetupRedis(t)
	t.Cleanup(suite.Cleanup)

	client := NewClient(suite.Client)
	ctx := context.Background()

	queueID := "clear-test-queue"

	// Push messages
	for i := 0; i < 5; i++ {
		_, err := client.Push(ctx, queueID, "test.event", map[string]any{"index": i}, PushOptions{})
		if err != nil {
			t.Fatalf("Push() error = %v", err)
		}
	}

	// Clear queue
	if err := client.Clear(ctx, queueID); err != nil {
		t.Fatalf("Clear() error = %v", err)
	}

	// Verify empty
	size, err := client.Size(ctx, queueID)
	if err != nil {
		t.Fatalf("Size() error = %v", err)
	}
	if size != 0 {
		t.Errorf("size after clear = %d, want 0", size)
	}
}

func TestClient_FIFOOrder(t *testing.T) {

	suite := testhelpers.SetupRedis(t)
	t.Cleanup(suite.Cleanup)

	client := NewClient(suite.Client)
	ctx := context.Background()

	queueID := "fifo-test-queue"

	// Push messages in order
	expectedOrder := []string{"first", "second", "third"}
	for _, val := range expectedOrder {
		_, err := client.Push(ctx, queueID, "ordered.event", map[string]any{"value": val}, PushOptions{})
		if err != nil {
			t.Fatalf("Push() error = %v", err)
		}
	}

	// Pop and verify FIFO order
	for _, expected := range expectedOrder {
		msg, err := client.Pop(ctx, queueID, PopOptions{})
		if err != nil {
			t.Fatalf("Pop() error = %v", err)
		}
		if msg.Payload["value"] != expected {
			t.Errorf("got %v, want %v", msg.Payload["value"], expected)
		}
	}
}

func TestClient_ConcurrentOperations(t *testing.T) {

	suite := testhelpers.SetupRedis(t)
	t.Cleanup(suite.Cleanup)

	client := NewClient(suite.Client)
	ctx := context.Background()

	queueID := "concurrent-test-queue"
	numMessages := 100

	// Push messages concurrently
	done := make(chan bool, numMessages)
	for i := 0; i < numMessages; i++ {
		go func(idx int) {
			_, err := client.Push(ctx, queueID, "concurrent.event", map[string]any{"index": idx}, PushOptions{})
			if err != nil {
				t.Errorf("concurrent push error: %v", err)
			}
			done <- true
		}(i)
	}

	// Wait for all pushes
	for i := 0; i < numMessages; i++ {
		<-done
	}

	// Verify size
	size, err := client.Size(ctx, queueID)
	if err != nil {
		t.Fatalf("Size() error = %v", err)
	}
	if size != int64(numMessages) {
		t.Errorf("size = %d, want %d", size, numMessages)
	}

	// Pop all messages
	poppedCount := 0
	for {
		_, err := client.Pop(ctx, queueID, PopOptions{})
		if err == ErrQueueEmpty {
			break
		}
		if err != nil {
			t.Fatalf("Pop() error = %v", err)
		}
		poppedCount++
	}

	if poppedCount != numMessages {
		t.Errorf("popped %d messages, want %d", poppedCount, numMessages)
	}
}

func TestClient_TTLPolicy(t *testing.T) {

	suite := testhelpers.SetupRedis(t)
	t.Cleanup(suite.Cleanup)

	t.Run("default TTL applied when not specified", func(t *testing.T) {
		client := NewClient(suite.Client)
		ctx := context.Background()

		msg, err := client.Push(ctx, "ttl-test-1", "test.event", map[string]any{}, PushOptions{})
		if err != nil {
			t.Fatalf("Push() error = %v", err)
		}

		expectedExpiry := msg.QueuedAt.Add(time.Duration(DefaultTTLSeconds) * time.Second)
		if !msg.ExpiresAt.Equal(expectedExpiry) {
			t.Errorf("expires at = %v, want %v", msg.ExpiresAt, expectedExpiry)
		}
	})

	t.Run("custom TTL applied when specified", func(t *testing.T) {
		client := NewClient(suite.Client)
		ctx := context.Background()

		customTTL := int32(3600)
		msg, err := client.Push(ctx, "ttl-test-2", "test.event", map[string]any{}, PushOptions{
			TTLSeconds: &customTTL,
		})
		if err != nil {
			t.Fatalf("Push() error = %v", err)
		}

		expectedExpiry := msg.QueuedAt.Add(time.Duration(customTTL) * time.Second)
		if !msg.ExpiresAt.Equal(expectedExpiry) {
			t.Errorf("expires at = %v, want %v", msg.ExpiresAt, expectedExpiry)
		}
	})

	t.Run("TTL policy validation", func(t *testing.T) {
		policy := DefaultTTLPolicy()

		// Test nil TTL returns default
		ttl, err := policy.Validate(nil)
		if err != nil {
			t.Errorf("Validate(nil) error = %v", err)
		}
		if ttl != DefaultTTLSeconds {
			t.Errorf("Validate(nil) = %d, want %d", ttl, DefaultTTLSeconds)
		}

		// Test valid TTL
		validTTL := int32(3600)
		ttl, err = policy.Validate(&validTTL)
		if err != nil {
			t.Errorf("Validate(%d) error = %v", validTTL, err)
		}
		if ttl != 3600 {
			t.Errorf("Validate(%d) = %d, want %d", validTTL, ttl, 3600)
		}

		// Test TTL below minimum
		lowTTL := int32(0)
		_, err = policy.Validate(&lowTTL)
		if err == nil {
			t.Error("Validate(0) should return error for TTL below minimum")
		}

		// Test TTL above maximum
		highTTL := int32(1000000)
		_, err = policy.Validate(&highTTL)
		if err == nil {
			t.Error("Validate(1000000) should return error for TTL above maximum")
		}
	})
}

func TestClient_ExpiredMessage(t *testing.T) {

	suite := testhelpers.SetupRedis(t)
	t.Cleanup(suite.Cleanup)

	client := NewClient(suite.Client)
	ctx := context.Background()

	queueID := "expired-test-queue"

	// Create a message that's already expired by manipulating the queue directly
	msg := &Message{
		ID:        "expired-msg",
		QueueID:   queueID,
		EventType: "expired.event",
		Payload:   map[string]any{"data": "test"},
		QueuedAt:  time.Now().UTC().Add(-2 * time.Hour),
		VisibleAt: time.Now().UTC().Add(-2 * time.Hour),
		ExpiresAt: time.Now().UTC().Add(-1 * time.Hour), // Expired 1 hour ago
	}

	data, _ := json.Marshal(msg)
	suite.Client.LPush(ctx, "poofmq:queue:"+queueID, data)

	// Pop should return empty because message has expired
	_, err := client.Pop(ctx, queueID, PopOptions{})
	if err != ErrQueueEmpty {
		t.Errorf("Pop() error = %v, want %v", err, ErrQueueEmpty)
	}
}

func TestClient_TTLAlwaysEnforcedOnPush(t *testing.T) {

	suite := testhelpers.SetupRedis(t)
	t.Cleanup(suite.Cleanup)

	client := NewClient(suite.Client)
	ctx := context.Background()

	tests := []struct {
		name       string
		queueID    string
		ttlSeconds *int32
		wantMinTTL time.Duration // minimum expected TTL on the key
		wantMaxTTL time.Duration // maximum expected TTL on the key
	}{
		{
			name:       "default TTL enforced",
			queueID:    "ttl-default",
			ttlSeconds: nil,
			wantMinTTL: time.Duration(DefaultTTLSeconds) * time.Second,
			wantMaxTTL: time.Duration(DefaultTTLSeconds+QueueKeyBufferTTL+10) * time.Second, // +10 for timing slack
		},
		{
			name:       "custom TTL enforced",
			queueID:    "ttl-custom",
			ttlSeconds: ptrInt32(3600),
			wantMinTTL: 3600 * time.Second,
			wantMaxTTL: (3600 + QueueKeyBufferTTL + 10) * time.Second,
		},
		{
			name:       "minimum TTL enforced",
			queueID:    "ttl-min",
			ttlSeconds: ptrInt32(1),
			wantMinTTL: 1 * time.Second,
			wantMaxTTL: (1 + QueueKeyBufferTTL + 10) * time.Second,
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			_, err := client.Push(ctx, tt.queueID, "test.event", map[string]any{"data": "test"}, PushOptions{
				TTLSeconds: tt.ttlSeconds,
			})
			if err != nil {
				t.Fatalf("Push() error = %v", err)
			}

			// Verify TTL is set on the queue key
			queueKey := "poofmq:queue:" + tt.queueID
			ttl, err := suite.Client.TTL(ctx, queueKey).Result()
			if err != nil {
				t.Fatalf("TTL() error = %v", err)
			}

			// TTL should be positive (not -1 = no expiry, not -2 = key doesn't exist)
			if ttl < 0 {
				t.Errorf("TTL on queue key = %v, expected positive value (key must have expiry set)", ttl)
			}

			// TTL should be within expected range
			if ttl < tt.wantMinTTL {
				t.Errorf("TTL = %v, want at least %v", ttl, tt.wantMinTTL)
			}
			if ttl > tt.wantMaxTTL {
				t.Errorf("TTL = %v, want at most %v", ttl, tt.wantMaxTTL)
			}
		})
	}
}

func TestClient_TTLTooLow(t *testing.T) {

	suite := testhelpers.SetupRedis(t)
	t.Cleanup(suite.Cleanup)

	client := NewClient(suite.Client)
	ctx := context.Background()

	// TTL of 0 should be rejected
	_, err := client.Push(ctx, "ttl-too-low", "test.event", map[string]any{}, PushOptions{
		TTLSeconds: ptrInt32(0),
	})
	if err == nil {
		t.Error("Push() with TTL=0 should return error")
	}

	// Verify error wraps ErrTTLTooLow
	if !errors.Is(err, ErrTTLTooLow) {
		t.Errorf("error should wrap ErrTTLTooLow, got: %v", err)
	}
}

func TestClient_TTLTooHigh(t *testing.T) {

	suite := testhelpers.SetupRedis(t)
	t.Cleanup(suite.Cleanup)

	client := NewClient(suite.Client)
	ctx := context.Background()

	// TTL exceeding max should be rejected
	_, err := client.Push(ctx, "ttl-too-high", "test.event", map[string]any{}, PushOptions{
		TTLSeconds: ptrInt32(1000000), // 1M seconds, way above 7 day max
	})
	if err == nil {
		t.Error("Push() with TTL above max should return error")
	}

	// Verify error wraps ErrTTLTooHigh
	if !errors.Is(err, ErrTTLTooHigh) {
		t.Errorf("error should wrap ErrTTLTooHigh, got: %v", err)
	}
}

func TestClient_CustomTTLPolicy(t *testing.T) {

	suite := testhelpers.SetupRedis(t)
	t.Cleanup(suite.Cleanup)

	// Create client with custom policy
	customPolicy := TTLPolicy{
		DefaultTTLSeconds: 1800, // 30 minutes
		MaxTTLSeconds:     3600, // 1 hour max
		MinTTLSeconds:     10,   // 10 seconds min
	}
	client := NewClientWithPolicy(suite.Client, customPolicy)
	ctx := context.Background()

	t.Run("custom default applied", func(t *testing.T) {
		msg, err := client.Push(ctx, "custom-default", "test.event", map[string]any{}, PushOptions{})
		if err != nil {
			t.Fatalf("Push() error = %v", err)
		}

		expectedExpiry := msg.QueuedAt.Add(1800 * time.Second)
		if !msg.ExpiresAt.Equal(expectedExpiry) {
			t.Errorf("expires at = %v, want %v", msg.ExpiresAt, expectedExpiry)
		}
	})

	t.Run("TTL below custom minimum rejected", func(t *testing.T) {
		_, err := client.Push(ctx, "custom-min", "test.event", map[string]any{}, PushOptions{
			TTLSeconds: ptrInt32(5), // Below 10 second minimum
		})
		if err == nil {
			t.Error("Push() with TTL below custom minimum should return error")
		}
	})

	t.Run("TTL above custom maximum rejected", func(t *testing.T) {
		_, err := client.Push(ctx, "custom-max", "test.event", map[string]any{}, PushOptions{
			TTLSeconds: ptrInt32(7200), // Above 1 hour maximum
		})
		if err == nil {
			t.Error("Push() with TTL above custom maximum should return error")
		}
	})
}

// Helper functions

func ptrInt32(v int32) *int32 {
	return &v
}
