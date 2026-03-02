package main

import (
	"testing"
)

func TestParseRedisUsedMemory(t *testing.T) {
	info := "# Memory\nused_memory:7340032\nused_memory_human:7.00M\n"

	parsed := parseRedisUsedMemory(info)
	if parsed != 7340032 {
		t.Fatalf("parseRedisUsedMemory() = %d, want 7340032", parsed)
	}
}

func TestParseRedisUsedMemoryWithInvalidPayload(t *testing.T) {
	info := "# Memory\nused_memory:not-a-number\n"

	parsed := parseRedisUsedMemory(info)
	if parsed != 0 {
		t.Fatalf("parseRedisUsedMemory() = %d, want 0", parsed)
	}
}
