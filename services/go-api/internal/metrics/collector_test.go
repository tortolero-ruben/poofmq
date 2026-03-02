package metrics

import (
	"testing"
	"time"
)

func TestCollectorSnapshot(t *testing.T) {
	collector := NewCollector()

	collector.RecordPush(20*time.Millisecond, false)
	collector.RecordPush(40*time.Millisecond, true)
	collector.RecordPop(10*time.Millisecond, false)

	snapshot := collector.Snapshot()

	if snapshot.PushTotal != 2 {
		t.Fatalf("PushTotal = %d, want 2", snapshot.PushTotal)
	}

	if snapshot.PushErrorsTotal != 1 {
		t.Fatalf("PushErrorsTotal = %d, want 1", snapshot.PushErrorsTotal)
	}

	if snapshot.PopTotal != 1 {
		t.Fatalf("PopTotal = %d, want 1", snapshot.PopTotal)
	}

	if snapshot.PopErrorsTotal != 0 {
		t.Fatalf("PopErrorsTotal = %d, want 0", snapshot.PopErrorsTotal)
	}

	if snapshot.AvgPushLatency != 30 {
		t.Fatalf("AvgPushLatency = %v, want 30", snapshot.AvgPushLatency)
	}

	if snapshot.AvgPopLatency != 10 {
		t.Fatalf("AvgPopLatency = %v, want 10", snapshot.AvgPopLatency)
	}
}
