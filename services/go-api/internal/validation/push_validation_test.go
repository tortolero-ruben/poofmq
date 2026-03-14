package validation

import (
	"strings"
	"testing"

	poofmqv1 "github.com/rubybear-lgtm/poofmq/gen/go/poofmq"
	"google.golang.org/protobuf/types/known/structpb"
)

func TestValidatePushRequest(t *testing.T) {
	t.Parallel()

	payload := mustPayload(t)

	tests := []struct {
		name            string
		request         *poofmqv1.PushMessageRequest
		wantErrorSubstr string
	}{
		{
			name: "valid request without ttl",
			request: &poofmqv1.PushMessageRequest{
				QueueId: "queue-1",
				Envelope: &poofmqv1.PayloadEnvelope{
					EventType: "user.created",
					Payload:   payload,
				},
			},
		},
		{
			name: "valid request with ttl",
			request: &poofmqv1.PushMessageRequest{
				QueueId: "queue-2",
				Envelope: &poofmqv1.PayloadEnvelope{
					EventType: "order.placed",
					Payload:   payload,
				},
				TtlSeconds: int32Pointer(30),
			},
		},
		{
			name:            "nil request",
			request:         nil,
			wantErrorSubstr: "request cannot be nil",
		},
		{
			name: "blank queue id",
			request: &poofmqv1.PushMessageRequest{
				QueueId: "   ",
				Envelope: &poofmqv1.PayloadEnvelope{
					EventType: "user.created",
					Payload:   payload,
				},
			},
			wantErrorSubstr: "queue_id is required",
		},
		{
			name: "missing envelope",
			request: &poofmqv1.PushMessageRequest{
				QueueId:  "queue-3",
				Envelope: nil,
			},
			wantErrorSubstr: "envelope is required",
		},
		{
			name: "blank event type",
			request: &poofmqv1.PushMessageRequest{
				QueueId: "queue-4",
				Envelope: &poofmqv1.PayloadEnvelope{
					EventType: "   ",
					Payload:   payload,
				},
			},
			wantErrorSubstr: "envelope.event_type is required",
		},
		{
			name: "missing payload",
			request: &poofmqv1.PushMessageRequest{
				QueueId: "queue-5",
				Envelope: &poofmqv1.PayloadEnvelope{
					EventType: "user.created",
					Payload:   nil,
				},
			},
			wantErrorSubstr: "envelope.payload is required",
		},
		{
			name: "ttl equals zero",
			request: &poofmqv1.PushMessageRequest{
				QueueId: "queue-6",
				Envelope: &poofmqv1.PayloadEnvelope{
					EventType: "user.created",
					Payload:   payload,
				},
				TtlSeconds: int32Pointer(0),
			},
			wantErrorSubstr: "ttl_seconds must be at least 1 second",
		},
		{
			name: "ttl is negative",
			request: &poofmqv1.PushMessageRequest{
				QueueId: "queue-7",
				Envelope: &poofmqv1.PayloadEnvelope{
					EventType: "user.created",
					Payload:   payload,
				},
				TtlSeconds: int32Pointer(-5),
			},
			wantErrorSubstr: "ttl_seconds must be at least 1 second",
		},
	}

	for _, testCase := range tests {
		testCase := testCase
		t.Run(testCase.name, func(t *testing.T) {
			t.Parallel()

			err := ValidatePushRequest(testCase.request)

			if testCase.wantErrorSubstr == "" {
				if err != nil {
					t.Fatalf("ValidatePushRequest() unexpected error: %v", err)
				}
				return
			}

			if err == nil {
				t.Fatalf("ValidatePushRequest() expected error containing %q, got nil", testCase.wantErrorSubstr)
			}

			if !strings.Contains(err.Error(), testCase.wantErrorSubstr) {
				t.Fatalf("ValidatePushRequest() error = %q, expected to contain %q", err.Error(), testCase.wantErrorSubstr)
			}
		})
	}
}

func TestValidatePopRequest(t *testing.T) {
	t.Parallel()

	tests := []struct {
		name            string
		request         *poofmqv1.PopMessageRequest
		wantErrorSubstr string
	}{
		{
			name: "valid request without options",
			request: &poofmqv1.PopMessageRequest{
				QueueId: "queue-1",
			},
		},
		{
			name: "valid request with zero values",
			request: &poofmqv1.PopMessageRequest{
				QueueId:                  "queue-2",
				VisibilityTimeoutSeconds: int32Pointer(0),
				WaitTimeoutSeconds:       int32Pointer(0),
			},
		},
		{
			name:            "nil request",
			request:         nil,
			wantErrorSubstr: "request cannot be nil",
		},
		{
			name: "blank queue id",
			request: &poofmqv1.PopMessageRequest{
				QueueId: " ",
			},
			wantErrorSubstr: "queue_id is required",
		},
		{
			name: "negative visibility timeout",
			request: &poofmqv1.PopMessageRequest{
				QueueId:                  "queue-3",
				VisibilityTimeoutSeconds: int32Pointer(-1),
			},
			wantErrorSubstr: "visibility_timeout_seconds must be non-negative",
		},
		{
			name: "negative wait timeout",
			request: &poofmqv1.PopMessageRequest{
				QueueId:            "queue-4",
				WaitTimeoutSeconds: int32Pointer(-2),
			},
			wantErrorSubstr: "wait_timeout_seconds must be non-negative",
		},
	}

	for _, testCase := range tests {
		testCase := testCase
		t.Run(testCase.name, func(t *testing.T) {
			t.Parallel()

			err := ValidatePopRequest(testCase.request)

			if testCase.wantErrorSubstr == "" {
				if err != nil {
					t.Fatalf("ValidatePopRequest() unexpected error: %v", err)
				}
				return
			}

			if err == nil {
				t.Fatalf("ValidatePopRequest() expected error containing %q, got nil", testCase.wantErrorSubstr)
			}

			if !strings.Contains(err.Error(), testCase.wantErrorSubstr) {
				t.Fatalf("ValidatePopRequest() error = %q, expected to contain %q", err.Error(), testCase.wantErrorSubstr)
			}
		})
	}
}

func int32Pointer(value int32) *int32 {
	return &value
}

func mustPayload(t *testing.T) *structpb.Struct {
	t.Helper()

	payload, err := structpb.NewStruct(map[string]any{
		"id":   "123",
		"type": "test",
	})
	if err != nil {
		t.Fatalf("failed to create payload struct: %v", err)
	}

	return payload
}
