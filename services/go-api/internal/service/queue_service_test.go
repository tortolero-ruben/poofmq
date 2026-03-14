package service

import (
	"context"
	"testing"
	"time"

	poofmqv1 "github.com/rubybear-lgtm/poofmq/gen/go/poofmq"
	"github.com/rubybear-lgtm/poofmq/services/go-api/internal/queue"
	"github.com/rubybear-lgtm/poofmq/services/go-api/internal/testhelpers"
	"google.golang.org/grpc/codes"
	"google.golang.org/grpc/status"
	"google.golang.org/protobuf/types/known/structpb"
	"google.golang.org/protobuf/types/known/timestamppb"
)

func TestQueueServiceServer_Push(t *testing.T) {

	suite := testhelpers.SetupRedis(t)
	t.Cleanup(suite.Cleanup)

	queueClient := queue.NewClient(suite.Client)
	server := NewQueueServiceServer(queueClient)
	ctx := context.Background()

	tests := []struct {
		name       string
		req        *poofmqv1.PushMessageRequest
		wantCode   codes.Code
		wantErrMsg string
	}{
		{
			name: "valid push request",
			req: &poofmqv1.PushMessageRequest{
				QueueId: "test-queue-1",
				Envelope: &poofmqv1.PayloadEnvelope{
					EventType: "user.created",
					Payload:   mustNewStruct(t, map[string]any{"user_id": "123"}),
				},
			},
			wantCode: codes.OK,
		},
		{
			name: "valid push with TTL",
			req: &poofmqv1.PushMessageRequest{
				QueueId: "test-queue-2",
				Envelope: &poofmqv1.PayloadEnvelope{
					EventType: "order.placed",
					Payload:   mustNewStruct(t, map[string]any{"order_id": "456"}),
				},
				TtlSeconds: int32Ptr(3600),
			},
			wantCode: codes.OK,
		},
		{
			name: "valid push with available_at",
			req: &poofmqv1.PushMessageRequest{
				QueueId: "test-queue-3",
				Envelope: &poofmqv1.PayloadEnvelope{
					EventType: "task.scheduled",
					Payload:   mustNewStruct(t, map[string]any{"task_id": "789"}),
				},
				AvailableAt: timestamppb.Now(),
			},
			wantCode: codes.OK,
		},
		{
			name: "missing queue_id",
			req: &poofmqv1.PushMessageRequest{
				QueueId: "",
				Envelope: &poofmqv1.PayloadEnvelope{
					EventType: "user.created",
					Payload:   mustNewStruct(t, map[string]any{"user_id": "123"}),
				},
			},
			wantCode:   codes.InvalidArgument,
			wantErrMsg: "queue_id is required",
		},
		{
			name: "missing envelope",
			req: &poofmqv1.PushMessageRequest{
				QueueId:  "test-queue-4",
				Envelope: nil,
			},
			wantCode:   codes.InvalidArgument,
			wantErrMsg: "envelope is required",
		},
		{
			name: "missing event_type",
			req: &poofmqv1.PushMessageRequest{
				QueueId: "test-queue-5",
				Envelope: &poofmqv1.PayloadEnvelope{
					EventType: "",
					Payload:   mustNewStruct(t, map[string]any{"user_id": "123"}),
				},
			},
			wantCode:   codes.InvalidArgument,
			wantErrMsg: "envelope.event_type is required",
		},
		{
			name: "missing payload",
			req: &poofmqv1.PushMessageRequest{
				QueueId: "test-queue-6",
				Envelope: &poofmqv1.PayloadEnvelope{
					EventType: "user.created",
					Payload:   nil,
				},
			},
			wantCode:   codes.InvalidArgument,
			wantErrMsg: "envelope.payload is required",
		},
		{
			name: "negative TTL",
			req: &poofmqv1.PushMessageRequest{
				QueueId: "test-queue-7",
				Envelope: &poofmqv1.PayloadEnvelope{
					EventType: "user.created",
					Payload:   mustNewStruct(t, map[string]any{"user_id": "123"}),
				},
				TtlSeconds: int32Ptr(-1),
			},
			wantCode:   codes.InvalidArgument,
			wantErrMsg: "ttl_seconds must be at least 1 second",
		},
		{
			name:       "nil request",
			req:        nil,
			wantCode:   codes.InvalidArgument,
			wantErrMsg: "request cannot be nil",
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			resp, err := server.Push(ctx, tt.req)

			if tt.wantCode == codes.OK {
				if err != nil {
					t.Fatalf("Push() unexpected error: %v", err)
				}
				if resp.GetMessageId() == "" {
					t.Error("message_id should not be empty")
				}
				if resp.GetQueuedAt() == nil {
					t.Error("queued_at should not be nil")
				}
				if resp.GetExpiresAt() == nil {
					t.Error("expires_at should not be nil")
				}
			} else {
				if err == nil {
					t.Fatalf("Push() expected error with code %v, got nil", tt.wantCode)
				}
				st, ok := status.FromError(err)
				if !ok {
					t.Fatalf("Push() expected gRPC status error, got %T", err)
				}
				if st.Code() != tt.wantCode {
					t.Errorf("Push() code = %v, want %v", st.Code(), tt.wantCode)
				}
				if tt.wantErrMsg != "" && !containsString(st.Message(), tt.wantErrMsg) {
					t.Errorf("Push() message = %q, want to contain %q", st.Message(), tt.wantErrMsg)
				}
			}
		})
	}
}

func TestQueueServiceServer_Push_ResponseFields(t *testing.T) {

	suite := testhelpers.SetupRedis(t)
	t.Cleanup(suite.Cleanup)

	queueClient := queue.NewClient(suite.Client)
	server := NewQueueServiceServer(queueClient)
	ctx := context.Background()

	req := &poofmqv1.PushMessageRequest{
		QueueId: "response-test-queue",
		Envelope: &poofmqv1.PayloadEnvelope{
			EventType: "test.event",
			Payload:   mustNewStruct(t, map[string]any{"key": "value"}),
		},
		TtlSeconds: int32Ptr(1800), // 30 minutes
	}

	resp, err := server.Push(ctx, req)
	if err != nil {
		t.Fatalf("Push() unexpected error: %v", err)
	}

	// Verify message ID is not empty (UUID format)
	if resp.GetMessageId() == "" {
		t.Error("message_id should not be empty")
	}

	// Verify timestamps are set
	if resp.GetQueuedAt() == nil {
		t.Error("queued_at should be set")
	}
	if resp.GetExpiresAt() == nil {
		t.Error("expires_at should be set")
	}

	// Verify expires_at is after queued_at
	queuedAt := resp.GetQueuedAt().AsTime()
	expiresAt := resp.GetExpiresAt().AsTime()
	if !expiresAt.After(queuedAt) {
		t.Error("expires_at should be after queued_at")
	}
}

func TestQueueServiceServer_Push_DefaultTTL(t *testing.T) {

	suite := testhelpers.SetupRedis(t)
	t.Cleanup(suite.Cleanup)

	queueClient := queue.NewClient(suite.Client)
	server := NewQueueServiceServer(queueClient)
	ctx := context.Background()

	// Request without TTL specified
	req := &poofmqv1.PushMessageRequest{
		QueueId: "default-ttl-queue",
		Envelope: &poofmqv1.PayloadEnvelope{
			EventType: "test.event",
			Payload:   mustNewStruct(t, map[string]any{"key": "value"}),
		},
	}

	resp, err := server.Push(ctx, req)
	if err != nil {
		t.Fatalf("Push() unexpected error: %v", err)
	}

	// Default TTL should be 24 hours
	queuedAt := resp.GetQueuedAt().AsTime()
	expiresAt := resp.GetExpiresAt().AsTime()
	actualTTL := expiresAt.Sub(queuedAt)

	expectedTTL := 24 * time.Hour
	tolerance := time.Second // Allow small tolerance for test execution time

	diff := actualTTL - expectedTTL
	if diff < -tolerance || diff > tolerance {
		t.Errorf("TTL = %v, want %v (within %v)", actualTTL, expectedTTL, tolerance)
	}
}

func TestQueueServiceServer_PushPopRoundTrip(t *testing.T) {

	suite := testhelpers.SetupRedis(t)
	t.Cleanup(suite.Cleanup)

	queueClient := queue.NewClient(suite.Client)
	server := NewQueueServiceServer(queueClient)
	ctx := context.Background()

	queueID := "round-trip-queue"

	// Push a message
	pushReq := &poofmqv1.PushMessageRequest{
		QueueId: queueID,
		Envelope: &poofmqv1.PayloadEnvelope{
			EventType: "test.event",
			Payload:   mustNewStruct(t, map[string]any{"key": "value"}),
		},
		TtlSeconds: int32Ptr(3600),
	}

	pushResp, err := server.Push(ctx, pushReq)
	if err != nil {
		t.Fatalf("Push() unexpected error: %v", err)
	}

	if pushResp.GetMessageId() == "" {
		t.Error("message_id should not be empty")
	}

	// Pop the message
	popReq := &poofmqv1.PopMessageRequest{
		QueueId: queueID,
	}

	popResp, err := server.Pop(ctx, popReq)
	if err != nil {
		t.Fatalf("Pop() unexpected error: %v", err)
	}

	if popResp.GetMessage() == nil {
		t.Fatal("Pop() should return a message")
	}

	// Verify the popped message matches
	if popResp.GetMessage().GetMessageId() != pushResp.GetMessageId() {
		t.Errorf("message_id = %q, want %q", popResp.GetMessage().GetMessageId(), pushResp.GetMessageId())
	}
	if popResp.GetMessage().GetQueueId() != queueID {
		t.Errorf("queue_id = %q, want %q", popResp.GetMessage().GetQueueId(), queueID)
	}
	if popResp.GetMessage().GetEnvelope().GetEventType() != "test.event" {
		t.Errorf("event_type = %q, want test.event", popResp.GetMessage().GetEnvelope().GetEventType())
	}

	// Second pop should return nil (empty queue)
	popResp2, err := server.Pop(ctx, popReq)
	if err != nil {
		t.Fatalf("Pop() second call unexpected error: %v", err)
	}
	if popResp2.GetMessage() != nil {
		t.Error("second Pop() should return nil message (empty queue)")
	}
}

func TestQueueServiceServer_Pop(t *testing.T) {

	suite := testhelpers.SetupRedis(t)
	t.Cleanup(suite.Cleanup)

	queueClient := queue.NewClient(suite.Client)
	server := NewQueueServiceServer(queueClient)
	ctx := context.Background()

	tests := []struct {
		name       string
		req        *poofmqv1.PopMessageRequest
		wantCode   codes.Code
		wantErrMsg string
	}{
		{
			name: "valid pop request",
			req: &poofmqv1.PopMessageRequest{
				QueueId: "pop-test-queue-1",
			},
			wantCode: codes.OK,
		},
		{
			name: "valid pop with visibility timeout",
			req: &poofmqv1.PopMessageRequest{
				QueueId:                  "pop-test-queue-2",
				VisibilityTimeoutSeconds: int32Ptr(30),
			},
			wantCode: codes.OK,
		},
		{
			name: "missing queue_id",
			req: &poofmqv1.PopMessageRequest{
				QueueId: "",
			},
			wantCode:   codes.InvalidArgument,
			wantErrMsg: "queue_id is required",
		},
		{
			name: "negative visibility timeout",
			req: &poofmqv1.PopMessageRequest{
				QueueId:                  "pop-test-queue-3",
				VisibilityTimeoutSeconds: int32Ptr(-1),
			},
			wantCode:   codes.InvalidArgument,
			wantErrMsg: "visibility_timeout_seconds must be non-negative",
		},
		{
			name: "negative wait timeout",
			req: &poofmqv1.PopMessageRequest{
				QueueId:            "pop-test-queue-4",
				WaitTimeoutSeconds: int32Ptr(-1),
			},
			wantCode:   codes.InvalidArgument,
			wantErrMsg: "wait_timeout_seconds must be non-negative",
		},
		{
			name:       "nil request",
			req:        nil,
			wantCode:   codes.InvalidArgument,
			wantErrMsg: "request cannot be nil",
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			_, err := server.Pop(ctx, tt.req)

			if tt.wantCode == codes.OK {
				if err != nil {
					t.Fatalf("Pop() unexpected error: %v", err)
				}
				// Empty queue returns nil message, which is valid
			} else {
				if err == nil {
					t.Fatalf("Pop() expected error with code %v, got nil", tt.wantCode)
				}
				st, ok := status.FromError(err)
				if !ok {
					t.Fatalf("Pop() expected gRPC status error, got %T", err)
				}
				if st.Code() != tt.wantCode {
					t.Errorf("Pop() code = %v, want %v", st.Code(), tt.wantCode)
				}
				if tt.wantErrMsg != "" && !containsString(st.Message(), tt.wantErrMsg) {
					t.Errorf("Pop() message = %q, want to contain %q", st.Message(), tt.wantErrMsg)
				}
			}
		})
	}
}

func TestQueueServiceServer_PopEmptyQueue(t *testing.T) {

	suite := testhelpers.SetupRedis(t)
	t.Cleanup(suite.Cleanup)

	queueClient := queue.NewClient(suite.Client)
	server := NewQueueServiceServer(queueClient)
	ctx := context.Background()

	// Pop from empty queue
	popReq := &poofmqv1.PopMessageRequest{
		QueueId: "empty-queue-test",
	}

	popResp, err := server.Pop(ctx, popReq)
	if err != nil {
		t.Fatalf("Pop() unexpected error: %v", err)
	}

	// Empty queue should return nil message (not an error)
	if popResp.GetMessage() != nil {
		t.Error("Pop() on empty queue should return nil message")
	}
}

// Helper functions

func mustNewStruct(t *testing.T, m map[string]any) *structpb.Struct {
	t.Helper()
	s, err := structpb.NewStruct(m)
	if err != nil {
		t.Fatalf("failed to create struct: %v", err)
	}
	return s
}

func int32Ptr(v int32) *int32 {
	return &v
}

func containsString(s, substr string) bool {
	return len(s) >= len(substr) && (s == substr || len(substr) == 0 ||
		(len(s) > 0 && len(substr) > 0 && findSubstring(s, substr)))
}

func findSubstring(s, substr string) bool {
	for i := 0; i <= len(s)-len(substr); i++ {
		if s[i:i+len(substr)] == substr {
			return true
		}
	}
	return false
}
