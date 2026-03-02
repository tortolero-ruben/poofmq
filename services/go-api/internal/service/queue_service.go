// Package service provides gRPC service implementations for poofMQ.
package service

import (
	"context"
	"errors"
	"time"

	poofmqv1 "github.com/tortolero-ruben/poofmq/gen/go/poofmq"
	"github.com/tortolero-ruben/poofmq/services/go-api/internal/queue"
	"github.com/tortolero-ruben/poofmq/services/go-api/internal/validation"
	"google.golang.org/grpc/codes"
	"google.golang.org/grpc/status"
	"google.golang.org/protobuf/types/known/structpb"
	"google.golang.org/protobuf/types/known/timestamppb"
)

// QueueServiceServer implements the poofMQ QueueService gRPC interface.
type QueueServiceServer struct {
	poofmqv1.UnimplementedQueueServiceServer
	queueClient *queue.Client
}

// NewQueueServiceServer creates a new QueueServiceServer instance.
func NewQueueServiceServer(queueClient *queue.Client) *QueueServiceServer {
	return &QueueServiceServer{
		queueClient: queueClient,
	}
}

// Push handles the PushMessage gRPC call to enqueue a message.
func (s *QueueServiceServer) Push(ctx context.Context, req *poofmqv1.PushMessageRequest) (*poofmqv1.PushMessageResponse, error) {
	// Validate the request
	if err := validation.ValidatePushRequest(req); err != nil {
		return nil, status.Errorf(codes.InvalidArgument, "invalid request: %v", err)
	}

	// Extract envelope
	envelope := req.GetEnvelope()

	// Convert protobuf struct to map for storage
	var payload map[string]any
	if envelope.GetPayload() != nil {
		payload = envelope.GetPayload().AsMap()
	}

	// Prepare push options
	opts := queue.PushOptions{
		TTLSeconds:  req.TtlSeconds,
		AvailableAt: time.Now().UTC(),
	}
	if req.GetAvailableAt() != nil {
		opts.AvailableAt = req.GetAvailableAt().AsTime()
	}

	// Push to queue
	msg, err := s.queueClient.Push(ctx, req.GetQueueId(), envelope.GetEventType(), payload, opts)
	if err != nil {
		return nil, status.Errorf(codes.Internal, "failed to push message: %v", err)
	}

	return &poofmqv1.PushMessageResponse{
		MessageId: msg.ID,
		QueuedAt:  timestamppb.New(msg.QueuedAt),
		ExpiresAt: timestamppb.New(msg.ExpiresAt),
	}, nil
}

// Pop handles the PopMessage gRPC call to dequeue a message atomically.
// This implements one-and-done semantics - each message is delivered exactly once.
func (s *QueueServiceServer) Pop(ctx context.Context, req *poofmqv1.PopMessageRequest) (*poofmqv1.PopMessageResponse, error) {
	// Validate the request
	if err := validation.ValidatePopRequest(req); err != nil {
		return nil, status.Errorf(codes.InvalidArgument, "invalid request: %v", err)
	}

	// Prepare pop options
	opts := queue.PopOptions{
		VisibilityTimeoutSeconds: int(req.GetVisibilityTimeoutSeconds()),
		WaitTimeoutSeconds:       int(req.GetWaitTimeoutSeconds()),
		ConsumerID:               req.GetConsumerId(),
	}

	// Pop from queue atomically
	msg, err := s.queueClient.Pop(ctx, req.GetQueueId(), opts)
	if err != nil {
		if errors.Is(err, queue.ErrQueueEmpty) {
			// Empty queue is not an error - return nil message
			return &poofmqv1.PopMessageResponse{
				Message: nil,
			}, nil
		}
		return nil, status.Errorf(codes.Internal, "failed to pop message: %v", err)
	}

	// Convert payload to protobuf struct
	var payloadStruct *structpb.Struct
	if msg.Payload != nil {
		payloadStruct, err = structpb.NewStruct(msg.Payload)
		if err != nil {
			return nil, status.Errorf(codes.Internal, "failed to convert payload: %v", err)
		}
	}

	// Convert message to protobuf response
	return &poofmqv1.PopMessageResponse{
		Message: &poofmqv1.QueueMessage{
			MessageId: msg.ID,
			QueueId:   msg.QueueID,
			Envelope: &poofmqv1.PayloadEnvelope{
				EventType: msg.EventType,
				Payload:   payloadStruct,
				Metadata:  msg.Metadata,
			},
			QueuedAt:      timestamppb.New(msg.QueuedAt),
			VisibleAt:     timestamppb.New(msg.VisibleAt),
			ExpiresAt:     timestamppb.New(msg.ExpiresAt),
			ReceiptHandle: msg.ReceiptHandle,
		},
	}, nil
}
