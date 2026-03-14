package redis

import (
	"net"
	"strconv"
	"strings"
	"testing"

	"github.com/rubybear-lgtm/poofmq/services/go-api/internal/config"
)

func TestQueueKey(t *testing.T) {
	t.Parallel()

	queueID := "order-events"
	expected := "poofmq:queue:order-events"

	if actual := QueueKey(queueID); actual != expected {
		t.Fatalf("QueueKey() = %q, want %q", actual, expected)
	}
}

func TestMessageKey(t *testing.T) {
	t.Parallel()

	messageID := "msg-123"
	expected := "poofmq:message:msg-123"

	if actual := MessageKey(messageID); actual != expected {
		t.Fatalf("MessageKey() = %q, want %q", actual, expected)
	}
}

func TestNewClientReturnsErrorWhenRedisUnavailable(t *testing.T) {
	t.Parallel()

	cfg := config.Config{
		RedisHost: "127.0.0.1",
		RedisPort: closedLocalPort(t),
	}

	client, err := NewClient(cfg)
	if err == nil {
		if client != nil {
			_ = client.Close()
		}
		t.Fatal("NewClient() expected connection error, got nil")
	}

	if !strings.Contains(err.Error(), "failed to connect to Redis") {
		t.Fatalf("NewClient() error = %q, expected context about Redis connection failure", err.Error())
	}
}

func closedLocalPort(t *testing.T) string {
	t.Helper()

	listener, err := net.Listen("tcp", "127.0.0.1:0")
	if err != nil {
		t.Fatalf("failed to allocate local port: %v", err)
	}

	port := listener.Addr().(*net.TCPAddr).Port

	if err := listener.Close(); err != nil {
		t.Fatalf("failed to release local port: %v", err)
	}

	return strconv.Itoa(port)
}
