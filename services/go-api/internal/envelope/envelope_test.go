package envelope

import (
	"encoding/json"
	"testing"
	"time"
)

func TestEncryptionModeString(t *testing.T) {
	t.Parallel()

	tests := []struct {
		mode     EncryptionMode
		expected string
	}{
		{EncryptionModeUnspecified, "UNSPECIFIED"},
		{EncryptionModeUnencrypted, "UNENCRYPTED"},
		{EncryptionModeEdgeEncrypted, "EDGE_ENCRYPTED"},
		{EncryptionModeClientEncrypted, "CLIENT_ENCRYPTED"},
		{EncryptionMode(999), "UNKNOWN"},
	}

	for _, tt := range tests {
		t.Run(tt.expected, func(t *testing.T) {
			t.Parallel()
			if got := tt.mode.String(); got != tt.expected {
				t.Errorf("EncryptionMode.String() = %v, want %v", got, tt.expected)
			}
		})
	}
}

func TestEncryptionModeFromString(t *testing.T) {
	t.Parallel()

	tests := []struct {
		input       string
		expected    EncryptionMode
		expectError bool
	}{
		{"UNSPECIFIED", EncryptionModeUnspecified, false},
		{"ENCRYPTION_MODE_UNSPECIFIED", EncryptionModeUnspecified, false},
		{"UNENCRYPTED", EncryptionModeUnencrypted, false},
		{"ENCRYPTION_MODE_UNENCRYPTED", EncryptionModeUnencrypted, false},
		{"EDGE_ENCRYPTED", EncryptionModeEdgeEncrypted, false},
		{"ENCRYPTION_MODE_EDGE_ENCRYPTED", EncryptionModeEdgeEncrypted, false},
		{"CLIENT_ENCRYPTED", EncryptionModeClientEncrypted, false},
		{"ENCRYPTION_MODE_CLIENT_ENCRYPTED", EncryptionModeClientEncrypted, false},
		{"INVALID", EncryptionModeUnspecified, true},
	}

	for _, tt := range tests {
		t.Run(tt.input, func(t *testing.T) {
			t.Parallel()
			got, err := EncryptionModeFromString(tt.input)
			if tt.expectError {
				if err == nil {
					t.Error("expected error, got nil")
				}
			} else {
				if err != nil {
					t.Errorf("unexpected error: %v", err)
				}
				if got != tt.expected {
					t.Errorf("EncryptionModeFromString() = %v, want %v", got, tt.expected)
				}
			}
		})
	}
}

func TestNewEnvelope(t *testing.T) {
	t.Parallel()

	eventType := "user.created"
	payload := Payload{"user_id": "123", "email": "test@example.com"}

	env := NewEnvelope(eventType, payload)

	if env.EventType != eventType {
		t.Errorf("EventType = %v, want %v", env.EventType, eventType)
	}
	if env.Payload == nil {
		t.Error("Payload should not be nil")
	}
	if env.Metadata == nil {
		t.Error("Metadata should be initialized")
	}
}

func TestNewEnvelopeWithMetadata(t *testing.T) {
	t.Parallel()

	eventType := "order.placed"
	payload := Payload{"order_id": "ord-123"}
	metadata := Metadata{"source": "checkout", "version": "1.0"}

	env := NewEnvelopeWithMetadata(eventType, payload, metadata)

	if env.EventType != eventType {
		t.Errorf("EventType = %v, want %v", env.EventType, eventType)
	}
	if env.Metadata["source"] != "checkout" {
		t.Errorf("Metadata[source] = %v, want checkout", env.Metadata["source"])
	}
	if env.Metadata["version"] != "1.0" {
		t.Errorf("Metadata[version] = %v, want 1.0", env.Metadata["version"])
	}
}

func TestEnvelopeValidate(t *testing.T) {
	t.Parallel()

	t.Run("valid envelope", func(t *testing.T) {
		t.Parallel()
		env := NewEnvelope("test.event", Payload{"key": "value"})
		if err := env.Validate(); err != nil {
			t.Errorf("unexpected error: %v", err)
		}
	})

	t.Run("missing event type", func(t *testing.T) {
		t.Parallel()
		env := NewEnvelope("", Payload{"key": "value"})
		if err := env.Validate(); err != ErrMissingEventType {
			t.Errorf("expected ErrMissingEventType, got %v", err)
		}
	})

	t.Run("missing payload", func(t *testing.T) {
		t.Parallel()
		env := &Envelope{EventType: "test.event", Payload: nil}
		if err := env.Validate(); err != ErrMissingPayload {
			t.Errorf("expected ErrMissingPayload, got %v", err)
		}
	})

	t.Run("unencrypted with encrypted fields", func(t *testing.T) {
		t.Parallel()
		env := NewEnvelope("test.event", Payload{"key": "value"})
		env.EncryptionMode = EncryptionModeUnencrypted
		env.EncryptedPayload = []byte("encrypted")
		if err := env.Validate(); err != ErrEncryptionConflict {
			t.Errorf("expected ErrEncryptionConflict, got %v", err)
		}
	})

	t.Run("client encrypted without encrypted payload", func(t *testing.T) {
		t.Parallel()
		env := NewEnvelope("test.event", Payload{"key": "value"})
		env.EncryptionMode = EncryptionModeClientEncrypted
		env.EncryptionAlgorithm = "AES-256-GCM"
		if err := env.Validate(); err == nil {
			t.Error("expected error for missing encrypted_payload")
		}
	})

	t.Run("client encrypted without algorithm", func(t *testing.T) {
		t.Parallel()
		env := NewEnvelope("test.event", Payload{"key": "value"})
		env.EncryptionMode = EncryptionModeClientEncrypted
		env.EncryptedPayload = []byte("encrypted")
		if err := env.Validate(); err == nil {
			t.Error("expected error for missing encryption_algorithm")
		}
	})

	t.Run("client encrypted valid", func(t *testing.T) {
		t.Parallel()
		env := NewEnvelope("test.event", Payload{})
		env.EncryptionMode = EncryptionModeClientEncrypted
		env.EncryptedPayload = []byte("encrypted")
		env.EncryptionAlgorithm = "AES-256-GCM"
		if err := env.Validate(); err != nil {
			t.Errorf("unexpected error: %v", err)
		}
	})
}

func TestEnvelopeWithMetadata(t *testing.T) {
	t.Parallel()

	env := NewEnvelope("test.event", Payload{}).
		WithMetadata("key1", "value1").
		WithMetadata("key2", "value2")

	if env.Metadata["key1"] != "value1" {
		t.Errorf("Metadata[key1] = %v, want value1", env.Metadata["key1"])
	}
	if env.Metadata["key2"] != "value2" {
		t.Errorf("Metadata[key2] = %v, want value2", env.Metadata["key2"])
	}
}

func TestEnvelopeWithMetadataNilMap(t *testing.T) {
	t.Parallel()

	env := &Envelope{
		EventType: "test.event",
		Payload:   Payload{},
		Metadata:  nil,
	}
	env.WithMetadata("key", "value")

	if env.Metadata == nil {
		t.Error("Metadata should be initialized")
	}
	if env.Metadata["key"] != "value" {
		t.Errorf("Metadata[key] = %v, want value", env.Metadata["key"])
	}
}

func TestEnvelopeWithEncryption(t *testing.T) {
	t.Parallel()

	env := NewEnvelope("test.event", Payload{}).
		WithEncryption(EncryptionModeEdgeEncrypted)

	if env.EncryptionMode != EncryptionModeEdgeEncrypted {
		t.Errorf("EncryptionMode = %v, want %v", env.EncryptionMode, EncryptionModeEdgeEncrypted)
	}
}

func TestEnvelopeWithEncryptionKeyID(t *testing.T) {
	t.Parallel()

	env := NewEnvelope("test.event", Payload{}).
		WithEncryptionKeyID("key-123")

	if env.EncryptionKeyID != "key-123" {
		t.Errorf("EncryptionKeyID = %v, want key-123", env.EncryptionKeyID)
	}
}

func TestEnvelopeToJSON(t *testing.T) {
	t.Parallel()

	env := NewEnvelope("user.created", Payload{
		"user_id": "123",
		"email":   "test@example.com",
	})
	env.WithMetadata("source", "api")

	data, err := env.ToJSON()
	if err != nil {
		t.Fatalf("unexpected error: %v", err)
	}

	// Verify it's valid JSON
	var parsed map[string]any
	if err := json.Unmarshal(data, &parsed); err != nil {
		t.Fatalf("failed to parse JSON: %v", err)
	}

	if parsed["event_type"] != "user.created" {
		t.Errorf("event_type = %v, want user.created", parsed["event_type"])
	}
}

func TestEnvelopeToJSONInvalidEnvelope(t *testing.T) {
	t.Parallel()

	env := &Envelope{
		EventType: "", // Invalid: empty event type
		Payload:   Payload{},
	}

	_, err := env.ToJSON()
	if err == nil {
		t.Error("expected error for invalid envelope")
	}
}

func TestFromJSON(t *testing.T) {
	t.Parallel()

	jsonData := `{
		"event_type": "user.created",
		"payload": {"user_id": "123", "email": "test@example.com"},
		"metadata": {"source": "api"},
		"encryption_mode": 0
	}`

	env, err := FromJSON([]byte(jsonData))
	if err != nil {
		t.Fatalf("unexpected error: %v", err)
	}

	if env.EventType != "user.created" {
		t.Errorf("EventType = %v, want user.created", env.EventType)
	}
	if env.Payload["user_id"] != "123" {
		t.Errorf("Payload[user_id] = %v, want 123", env.Payload["user_id"])
	}
	if env.Metadata["source"] != "api" {
		t.Errorf("Metadata[source] = %v, want api", env.Metadata["source"])
	}
}

func TestFromJSONWithNilMetadata(t *testing.T) {
	t.Parallel()

	jsonData := `{
		"event_type": "test.event",
		"payload": {"key": "value"}
	}`

	env, err := FromJSON([]byte(jsonData))
	if err != nil {
		t.Fatalf("unexpected error: %v", err)
	}

	if env.Metadata == nil {
		t.Error("Metadata should be initialized to empty map")
	}
}

func TestFromJSONInvalid(t *testing.T) {
	t.Parallel()

	_, err := FromJSON([]byte("invalid json"))
	if err == nil {
		t.Error("expected error for invalid JSON")
	}
}

func TestGenerateMessageID(t *testing.T) {
	t.Parallel()

	id1 := GenerateMessageID()
	id2 := GenerateMessageID()

	if id1 == "" {
		t.Error("message ID should not be empty")
	}
	if id1 == id2 {
		t.Error("message IDs should be unique")
	}
	if len(id1) != 36 { // UUID format: xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx
		t.Errorf("message ID length = %d, want 36", len(id1))
	}
}

func TestNewMessage(t *testing.T) {
	t.Parallel()

	env := NewEnvelope("test.event", Payload{"key": "value"})
	ttl := 30 * time.Minute

	msg := NewMessage("queue-123", env, ttl)

	if msg.ID == "" {
		t.Error("message ID should be generated")
	}
	if msg.QueueID != "queue-123" {
		t.Errorf("QueueID = %v, want queue-123", msg.QueueID)
	}
	if msg.Envelope != env {
		t.Error("Envelope should be set")
	}
	if msg.QueuedAt.IsZero() {
		t.Error("QueuedAt should be set")
	}
	if msg.ExpiresAt.Sub(msg.QueuedAt) != ttl {
		t.Errorf("TTL = %v, want %v", msg.ExpiresAt.Sub(msg.QueuedAt), ttl)
	}
}

func TestNewMessageWithID(t *testing.T) {
	t.Parallel()

	env := NewEnvelope("test.event", Payload{"key": "value"})
	now := time.Now().UTC()
	visibleAt := now.Add(5 * time.Minute)
	expiresAt := now.Add(30 * time.Minute)

	msg := NewMessageWithID("msg-123", "queue-456", env, now, visibleAt, expiresAt)

	if msg.ID != "msg-123" {
		t.Errorf("ID = %v, want msg-123", msg.ID)
	}
	if msg.QueueID != "queue-456" {
		t.Errorf("QueueID = %v, want queue-456", msg.QueueID)
	}
	if msg.ReceiptHandle == "" {
		t.Error("ReceiptHandle should be generated")
	}
}

func TestMessageToJSON(t *testing.T) {
	t.Parallel()

	env := NewEnvelope("test.event", Payload{"key": "value"})
	msg := NewMessage("queue-123", env, 30*time.Minute)

	data, err := msg.ToJSON()
	if err != nil {
		t.Fatalf("unexpected error: %v", err)
	}

	var parsed map[string]any
	if err := json.Unmarshal(data, &parsed); err != nil {
		t.Fatalf("failed to parse JSON: %v", err)
	}

	if parsed["queue_id"] != "queue-123" {
		t.Errorf("queue_id = %v, want queue-123", parsed["queue_id"])
	}
}

func TestMessageFromJSON(t *testing.T) {
	t.Parallel()

	now := time.Now().UTC().Format(time.RFC3339Nano)
	visibleAt := time.Now().Add(5 * time.Minute).UTC().Format(time.RFC3339Nano)
	expiresAt := time.Now().Add(30 * time.Minute).UTC().Format(time.RFC3339Nano)

	jsonData := `{
		"id": "msg-123",
		"queue_id": "queue-456",
		"envelope": {
			"event_type": "test.event",
			"payload": {"key": "value"}
		},
		"queued_at": "` + now + `",
		"visible_at": "` + visibleAt + `",
		"expires_at": "` + expiresAt + `",
		"receipt_handle": "receipt-789"
	}`

	msg, err := MessageFromJSON([]byte(jsonData))
	if err != nil {
		t.Fatalf("unexpected error: %v", err)
	}

	if msg.ID != "msg-123" {
		t.Errorf("ID = %v, want msg-123", msg.ID)
	}
	if msg.QueueID != "queue-456" {
		t.Errorf("QueueID = %v, want queue-456", msg.QueueID)
	}
	if msg.Envelope.EventType != "test.event" {
		t.Errorf("Envelope.EventType = %v, want test.event", msg.Envelope.EventType)
	}
}

func TestMessageFromJSONInvalid(t *testing.T) {
	t.Parallel()

	_, err := MessageFromJSON([]byte("invalid json"))
	if err == nil {
		t.Error("expected error for invalid JSON")
	}
}

func TestMessageFromJSONInvalidEnvelope(t *testing.T) {
	t.Parallel()

	now := time.Now().UTC().Format(time.RFC3339Nano)
	expiresAt := time.Now().Add(30 * time.Minute).UTC().Format(time.RFC3339Nano)

	jsonData := `{
		"id": "msg-123",
		"queue_id": "queue-456",
		"envelope": {
			"event_type": "",
			"payload": {}
		},
		"queued_at": "` + now + `",
		"visible_at": "` + now + `",
		"expires_at": "` + expiresAt + `"
	}`

	_, err := MessageFromJSON([]byte(jsonData))
	if err == nil {
		t.Error("expected error for invalid message envelope")
	}
}

func TestMessageIsExpired(t *testing.T) {
	t.Parallel()

	env := NewEnvelope("test.event", Payload{})

	t.Run("not expired", func(t *testing.T) {
		t.Parallel()
		msg := NewMessage("queue-123", env, 30*time.Minute)
		if msg.IsExpired() {
			t.Error("message should not be expired")
		}
	})

	t.Run("expired", func(t *testing.T) {
		t.Parallel()
		msg := &Message{
			ID:        "msg-123",
			ExpiresAt: time.Now().UTC().Add(-1 * time.Hour),
		}
		if !msg.IsExpired() {
			t.Error("message should be expired")
		}
	})
}

func TestMessageIsVisible(t *testing.T) {
	t.Parallel()

	env := NewEnvelope("test.event", Payload{})

	t.Run("visible now", func(t *testing.T) {
		t.Parallel()
		msg := NewMessage("queue-123", env, 30*time.Minute)
		if !msg.IsVisible() {
			t.Error("message should be visible")
		}
	})

	t.Run("not yet visible", func(t *testing.T) {
		t.Parallel()
		msg := &Message{
			ID:        "msg-123",
			VisibleAt: time.Now().UTC().Add(5 * time.Minute),
		}
		if msg.IsVisible() {
			t.Error("message should not be visible yet")
		}
	})

	t.Run("visible in past", func(t *testing.T) {
		t.Parallel()
		msg := &Message{
			ID:        "msg-123",
			VisibleAt: time.Now().UTC().Add(-5 * time.Minute),
		}
		if !msg.IsVisible() {
			t.Error("message should be visible")
		}
	})
}

func TestEnvelopeRoundTrip(t *testing.T) {
	t.Parallel()

	original := NewEnvelope("user.created", Payload{
		"user_id": float64(123), // JSON numbers are float64
		"email":   "test@example.com",
		"active":  true,
	})
	original.WithMetadata("source", "api").
		WithMetadata("version", "1.0").
		WithEncryption(EncryptionModeEdgeEncrypted).
		WithEncryptionKeyID("key-123")

	data, err := original.ToJSON()
	if err != nil {
		t.Fatalf("failed to marshal: %v", err)
	}

	parsed, err := FromJSON(data)
	if err != nil {
		t.Fatalf("failed to unmarshal: %v", err)
	}

	if parsed.EventType != original.EventType {
		t.Errorf("EventType = %v, want %v", parsed.EventType, original.EventType)
	}
	if parsed.Metadata["source"] != original.Metadata["source"] {
		t.Errorf("Metadata[source] = %v, want %v", parsed.Metadata["source"], original.Metadata["source"])
	}
	if parsed.EncryptionMode != original.EncryptionMode {
		t.Errorf("EncryptionMode = %v, want %v", parsed.EncryptionMode, original.EncryptionMode)
	}
	if parsed.EncryptionKeyID != original.EncryptionKeyID {
		t.Errorf("EncryptionKeyID = %v, want %v", parsed.EncryptionKeyID, original.EncryptionKeyID)
	}
}

func TestMessageRoundTrip(t *testing.T) {
	t.Parallel()

	env := NewEnvelope("order.placed", Payload{
		"order_id": "ord-123",
		"items":    float64(5),
	})
	original := NewMessage("queue-orders", env, 1*time.Hour)

	data, err := original.ToJSON()
	if err != nil {
		t.Fatalf("failed to marshal: %v", err)
	}

	parsed, err := MessageFromJSON(data)
	if err != nil {
		t.Fatalf("failed to unmarshal: %v", err)
	}

	if parsed.ID != original.ID {
		t.Errorf("ID = %v, want %v", parsed.ID, original.ID)
	}
	if parsed.QueueID != original.QueueID {
		t.Errorf("QueueID = %v, want %v", parsed.QueueID, original.QueueID)
	}
	if parsed.Envelope.EventType != original.Envelope.EventType {
		t.Errorf("Envelope.EventType = %v, want %v", parsed.Envelope.EventType, original.Envelope.EventType)
	}
}

func TestPayloadWithNestedObjects(t *testing.T) {
	t.Parallel()

	env := NewEnvelope("complex.event", Payload{
		"user": map[string]any{
			"id":    float64(123),
			"name":  "Test User",
			"roles": []any{"admin", "user"},
		},
		"metadata": map[string]any{
			"source": "api",
			"tags":   []any{"tag1", "tag2"},
		},
	})

	data, err := env.ToJSON()
	if err != nil {
		t.Fatalf("failed to marshal: %v", err)
	}

	parsed, err := FromJSON(data)
	if err != nil {
		t.Fatalf("failed to unmarshal: %v", err)
	}

	user, ok := parsed.Payload["user"].(map[string]any)
	if !ok {
		t.Fatal("user should be a map")
	}
	if user["name"] != "Test User" {
		t.Errorf("user.name = %v, want Test User", user["name"])
	}

	roles, ok := user["roles"].([]any)
	if !ok {
		t.Fatal("roles should be an array")
	}
	if len(roles) != 2 {
		t.Errorf("roles length = %d, want 2", len(roles))
	}
}

func TestEncryptionFieldsSerialization(t *testing.T) {
	t.Parallel()

	env := NewEnvelope("encrypted.event", Payload{})
	env.EncryptionMode = EncryptionModeClientEncrypted
	env.EncryptionKeyID = "kms-key-123"
	env.EncryptionAlgorithm = "AES-256-GCM"
	env.EncryptedPayload = []byte("encrypted-data-here")
	env.EncryptedDataKey = []byte("encrypted-dek")
	env.EncryptionIV = []byte("initialization-vector")
	env.EncryptionAuthTag = []byte("auth-tag")

	data, err := env.ToJSON()
	if err != nil {
		t.Fatalf("failed to marshal: %v", err)
	}

	parsed, err := FromJSON(data)
	if err != nil {
		t.Fatalf("failed to unmarshal: %v", err)
	}

	if parsed.EncryptionMode != EncryptionModeClientEncrypted {
		t.Errorf("EncryptionMode = %v, want CLIENT_ENCRYPTED", parsed.EncryptionMode)
	}
	if string(parsed.EncryptedPayload) != "encrypted-data-here" {
		t.Errorf("EncryptedPayload = %v, want encrypted-data-here", string(parsed.EncryptedPayload))
	}
	if string(parsed.EncryptionIV) != "initialization-vector" {
		t.Errorf("EncryptionIV = %v, want initialization-vector", string(parsed.EncryptionIV))
	}
}
