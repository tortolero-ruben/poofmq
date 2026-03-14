package queue

import (
	"context"
	"fmt"
	"testing"
	"time"

	"github.com/rubybear-lgtm/poofmq/services/go-api/internal/testhelpers"
)

// BenchmarkPush measures the latency of push operations.
func BenchmarkPush(b *testing.B) {
	suite := testhelpers.SetupBenchRedis(b)
	defer suite.Cleanup()

	client := NewClient(suite.Client)
	ctx := context.Background()
	queueID := "bench-push-queue"

	b.ResetTimer()
	for i := 0; i < b.N; i++ {
		_, err := client.Push(ctx, queueID, "bench.event", map[string]any{
			"index":     i,
			"timestamp": time.Now().UnixNano(),
			"data":      fmt.Sprintf("benchmark-data-%d", i),
		}, PushOptions{})
		if err != nil {
			b.Fatalf("Push() error: %v", err)
		}
	}
	b.StopTimer()

	// Report queue size
	size, _ := client.Size(ctx, queueID)
	b.ReportMetric(float64(size), "messages")
}

// BenchmarkPop measures the latency of pop operations.
func BenchmarkPop(b *testing.B) {
	suite := testhelpers.SetupBenchRedis(b)
	defer suite.Cleanup()

	client := NewClient(suite.Client)
	ctx := context.Background()
	queueID := "bench-pop-queue"

	// Pre-populate queue with messages
	for i := 0; i < b.N; i++ {
		_, err := client.Push(ctx, queueID, "bench.event", map[string]any{"index": i}, PushOptions{})
		if err != nil {
			b.Fatalf("Push() error: %v", err)
		}
	}

	b.ResetTimer()
	for i := 0; i < b.N; i++ {
		_, err := client.Pop(ctx, queueID, PopOptions{})
		if err != nil {
			b.Fatalf("Pop() error: %v", err)
		}
	}
}

// BenchmarkPushPopRoundTrip measures the full push-pop cycle latency.
func BenchmarkPushPopRoundTrip(b *testing.B) {
	suite := testhelpers.SetupBenchRedis(b)
	defer suite.Cleanup()

	client := NewClient(suite.Client)
	ctx := context.Background()
	queueID := "bench-roundtrip-queue"

	b.ResetTimer()
	for i := 0; i < b.N; i++ {
		_, err := client.Push(ctx, queueID, "bench.event", map[string]any{"index": i}, PushOptions{})
		if err != nil {
			b.Fatalf("Push() error: %v", err)
		}

		_, err = client.Pop(ctx, queueID, PopOptions{})
		if err != nil {
			b.Fatalf("Pop() error: %v", err)
		}
	}
}

// BenchmarkPushParallel measures concurrent push performance.
func BenchmarkPushParallel(b *testing.B) {
	suite := testhelpers.SetupBenchRedis(b)
	defer suite.Cleanup()

	client := NewClient(suite.Client)
	ctx := context.Background()
	queueID := "bench-parallel-push-queue"

	b.ResetTimer()
	b.RunParallel(func(pb *testing.PB) {
		i := 0
		for pb.Next() {
			_, err := client.Push(ctx, queueID, "bench.event", map[string]any{
				"index": i,
				"data":  fmt.Sprintf("parallel-data-%d", i),
			}, PushOptions{})
			if err != nil {
				b.Fatalf("Push() error: %v", err)
			}
			i++
		}
	})
}

// BenchmarkPopParallel measures concurrent pop performance.
func BenchmarkPopParallel(b *testing.B) {
	suite := testhelpers.SetupBenchRedis(b)
	defer suite.Cleanup()

	client := NewClient(suite.Client)
	ctx := context.Background()
	queueID := "bench-parallel-pop-queue"

	// Pre-populate with enough messages for parallel consumption
	numMessages := b.N * 10
	for i := 0; i < numMessages; i++ {
		_, err := client.Push(ctx, queueID, "bench.event", map[string]any{"index": i}, PushOptions{})
		if err != nil {
			b.Fatalf("Push() error: %v", err)
		}
	}

	b.ResetTimer()
	b.RunParallel(func(pb *testing.PB) {
		for pb.Next() {
			_, err := client.Pop(ctx, queueID, PopOptions{})
			if err != nil && err != ErrQueueEmpty {
				b.Fatalf("Pop() error: %v", err)
			}
		}
	})
}

// BenchmarkPushWithLargePayload measures push latency with larger payloads.
func BenchmarkPushWithLargePayload(b *testing.B) {
	suite := testhelpers.SetupBenchRedis(b)
	defer suite.Cleanup()

	client := NewClient(suite.Client)
	ctx := context.Background()
	queueID := "bench-large-payload-queue"

	// Create a large payload (approximately 10KB)
	largePayload := make(map[string]any)
	for i := 0; i < 100; i++ {
		largePayload[fmt.Sprintf("field_%d", i)] = fmt.Sprintf("value_%d_%s", i, string(make([]byte, 50)))
	}

	b.ResetTimer()
	for i := 0; i < b.N; i++ {
		_, err := client.Push(ctx, queueID, "bench.large.event", largePayload, PushOptions{})
		if err != nil {
			b.Fatalf("Push() error: %v", err)
		}
	}
}

// BenchmarkSize measures queue size operation latency.
func BenchmarkSize(b *testing.B) {
	suite := testhelpers.SetupBenchRedis(b)
	defer suite.Cleanup()

	client := NewClient(suite.Client)
	ctx := context.Background()
	queueID := "bench-size-queue"

	// Pre-populate with messages
	for i := 0; i < 1000; i++ {
		_, err := client.Push(ctx, queueID, "bench.event", map[string]any{"index": i}, PushOptions{})
		if err != nil {
			b.Fatalf("Push() error: %v", err)
		}
	}

	b.ResetTimer()
	for i := 0; i < b.N; i++ {
		_, err := client.Size(ctx, queueID)
		if err != nil {
			b.Fatalf("Size() error: %v", err)
		}
	}
}

// BenchmarkPushWithVisibilityTimeout measures push with visibility timeout.
func BenchmarkPushWithVisibilityTimeout(b *testing.B) {
	suite := testhelpers.SetupBenchRedis(b)
	defer suite.Cleanup()

	client := NewClient(suite.Client)
	ctx := context.Background()
	queueID := "bench-vtimeout-queue"

	// Pre-populate queue
	for i := 0; i < b.N; i++ {
		_, err := client.Push(ctx, queueID, "bench.event", map[string]any{"index": i}, PushOptions{})
		if err != nil {
			b.Fatalf("Push() error: %v", err)
		}
	}

	b.ResetTimer()
	for i := 0; i < b.N; i++ {
		_, err := client.Pop(ctx, queueID, PopOptions{
			VisibilityTimeoutSeconds: 30,
			ConsumerID:               fmt.Sprintf("consumer-%d", i),
		})
		if err != nil {
			b.Fatalf("Pop() error: %v", err)
		}
	}
}

// BenchmarkPushWithTTL measures push with custom TTL.
func BenchmarkPushWithTTL(b *testing.B) {
	suite := testhelpers.SetupBenchRedis(b)
	defer suite.Cleanup()

	client := NewClient(suite.Client)
	ctx := context.Background()
	queueID := "bench-ttl-queue"

	ttl := int32(3600)

	b.ResetTimer()
	for i := 0; i < b.N; i++ {
		_, err := client.Push(ctx, queueID, "bench.event", map[string]any{"index": i}, PushOptions{
			TTLSeconds: &ttl,
		})
		if err != nil {
			b.Fatalf("Push() error: %v", err)
		}
	}
}

// BenchmarkMixedWorkload simulates a realistic mix of operations.
func BenchmarkMixedWorkload(b *testing.B) {
	suite := testhelpers.SetupBenchRedis(b)
	defer suite.Cleanup()

	client := NewClient(suite.Client)
	ctx := context.Background()
	queueID := "bench-mixed-queue"

	b.ResetTimer()
	for i := 0; i < b.N; i++ {
		switch i % 10 {
		case 0, 1, 2, 3, 4, 5, 6, 7:
			// 80% push operations
			_, err := client.Push(ctx, queueID, "bench.event", map[string]any{"index": i}, PushOptions{})
			if err != nil {
				b.Fatalf("Push() error: %v", err)
			}
		case 8:
			// 10% pop operations
			_, err := client.Pop(ctx, queueID, PopOptions{})
			if err != nil && err != ErrQueueEmpty {
				b.Fatalf("Pop() error: %v", err)
			}
		case 9:
			// 10% size operations
			_, err := client.Size(ctx, queueID)
			if err != nil {
				b.Fatalf("Size() error: %v", err)
			}
		}
	}
}
