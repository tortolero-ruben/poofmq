package config

import "testing"

func TestRedisAddress(t *testing.T) {
	t.Parallel()

	cfg := Config{
		RedisHost: "localhost",
		RedisPort: "6379",
	}

	if cfg.RedisAddress() != "localhost:6379" {
		t.Fatalf("expected localhost:6379, got %s", cfg.RedisAddress())
	}
}

func TestPostgresAddress(t *testing.T) {
	t.Parallel()

	cfg := Config{
		PostgresHost: "postgres",
		PostgresPort: "5432",
	}

	if cfg.PostgresAddress() != "postgres:5432" {
		t.Fatalf("expected postgres:5432, got %s", cfg.PostgresAddress())
	}
}
