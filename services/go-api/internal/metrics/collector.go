package metrics

import (
	"sync/atomic"
	"time"
)

// Snapshot represents a point-in-time metrics payload.
type Snapshot struct {
	PushTotal       int64   `json:"push_total"`
	PushErrorsTotal int64   `json:"push_errors_total"`
	PopTotal        int64   `json:"pop_total"`
	PopErrorsTotal  int64   `json:"pop_errors_total"`
	AvgPushLatency  float64 `json:"avg_push_latency_ms"`
	AvgPopLatency   float64 `json:"avg_pop_latency_ms"`
}

// Collector stores in-process request and latency counters.
type Collector struct {
	pushTotal             atomic.Int64
	pushErrorsTotal       atomic.Int64
	popTotal              atomic.Int64
	popErrorsTotal        atomic.Int64
	pushLatencyTotalNanos atomic.Int64
	popLatencyTotalNanos  atomic.Int64
}

// NewCollector creates a new metrics collector.
func NewCollector() *Collector {
	return &Collector{}
}

// RecordPush captures push call duration and error state.
func (c *Collector) RecordPush(duration time.Duration, isError bool) {
	c.pushTotal.Add(1)
	c.pushLatencyTotalNanos.Add(duration.Nanoseconds())
	if isError {
		c.pushErrorsTotal.Add(1)
	}
}

// RecordPop captures pop call duration and error state.
func (c *Collector) RecordPop(duration time.Duration, isError bool) {
	c.popTotal.Add(1)
	c.popLatencyTotalNanos.Add(duration.Nanoseconds())
	if isError {
		c.popErrorsTotal.Add(1)
	}
}

// Snapshot returns the current metrics snapshot.
func (c *Collector) Snapshot() Snapshot {
	pushTotal := c.pushTotal.Load()
	popTotal := c.popTotal.Load()

	return Snapshot{
		PushTotal:       pushTotal,
		PushErrorsTotal: c.pushErrorsTotal.Load(),
		PopTotal:        popTotal,
		PopErrorsTotal:  c.popErrorsTotal.Load(),
		AvgPushLatency:  averageMilliseconds(c.pushLatencyTotalNanos.Load(), pushTotal),
		AvgPopLatency:   averageMilliseconds(c.popLatencyTotalNanos.Load(), popTotal),
	}
}

func averageMilliseconds(totalNanos int64, count int64) float64 {
	if count <= 0 {
		return 0
	}

	return float64(totalNanos) / float64(count) / float64(time.Millisecond)
}

var defaultCollector = NewCollector()

// RecordPush captures push metrics in the default collector.
func RecordPush(duration time.Duration, isError bool) {
	defaultCollector.RecordPush(duration, isError)
}

// RecordPop captures pop metrics in the default collector.
func RecordPop(duration time.Duration, isError bool) {
	defaultCollector.RecordPop(duration, isError)
}

// SnapshotMetrics returns current values from the default collector.
func SnapshotMetrics() Snapshot {
	return defaultCollector.Snapshot()
}
