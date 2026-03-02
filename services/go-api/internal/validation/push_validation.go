// Package validation provides request validation for poofMQ API.
package validation

import (
	"fmt"
	"strings"

	poofmqv1 "github.com/tortolero-ruben/poofmq/gen/go/poofmq"
)

// ValidatePushRequest validates a PushMessageRequest.
func ValidatePushRequest(req *poofmqv1.PushMessageRequest) error {
	if req == nil {
		return fmt.Errorf("request cannot be nil")
	}

	// Validate queue_id
	if strings.TrimSpace(req.GetQueueId()) == "" {
		return fmt.Errorf("queue_id is required")
	}

	// Validate envelope
	envelope := req.GetEnvelope()
	if envelope == nil {
		return fmt.Errorf("envelope is required")
	}

	// Validate event_type
	if strings.TrimSpace(envelope.GetEventType()) == "" {
		return fmt.Errorf("envelope.event_type is required and must be non-empty")
	}

	// Validate payload exists
	if envelope.GetPayload() == nil {
		return fmt.Errorf("envelope.payload is required")
	}

	// Validate TTL if specified (must be at least 1 second if set)
	// Note: 0 is not valid - use nil to get the default TTL
	if req.TtlSeconds != nil && req.GetTtlSeconds() <= 0 {
		return fmt.Errorf("ttl_seconds must be at least 1 second when specified")
	}

	return nil
}

// ValidatePopRequest validates a PopMessageRequest.
func ValidatePopRequest(req *poofmqv1.PopMessageRequest) error {
	if req == nil {
		return fmt.Errorf("request cannot be nil")
	}

	// Validate queue_id
	if strings.TrimSpace(req.GetQueueId()) == "" {
		return fmt.Errorf("queue_id is required")
	}

	// Validate visibility_timeout_seconds if specified
	if req.VisibilityTimeoutSeconds != nil && req.GetVisibilityTimeoutSeconds() < 0 {
		return fmt.Errorf("visibility_timeout_seconds must be non-negative when specified")
	}

	// Validate wait_timeout_seconds if specified
	if req.WaitTimeoutSeconds != nil && req.GetWaitTimeoutSeconds() < 0 {
		return fmt.Errorf("wait_timeout_seconds must be non-negative when specified")
	}

	return nil
}
