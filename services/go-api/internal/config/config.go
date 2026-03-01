package config

import (
	"fmt"
	"os"
)

// Config contains runtime settings for the Go API process.
type Config struct {
	HTTPPort         string
	LogLevel         string
	AllowOrigin      string
	RedisHost        string
	RedisPort        string
	RedisPassword    string
	RedisQueue       string
	PostgresHost     string
	PostgresPort     string
	PostgresDB       string
	PostgresUser     string
	PostgresPassword string
}

// Load creates a Config from environment variables with local-safe defaults.
func Load() Config {
	return Config{
		HTTPPort:         envOrDefault("GO_API_HTTP_PORT", "8080"),
		LogLevel:         envOrDefault("GO_API_LOG_LEVEL", "debug"),
		AllowOrigin:      envOrDefault("GO_API_ALLOW_ORIGIN", "http://localhost:8000"),
		RedisHost:        envOrDefault("REDIS_HOST", "redis"),
		RedisPort:        envOrDefault("REDIS_PORT", "6379"),
		RedisPassword:    os.Getenv("REDIS_PASSWORD"),
		RedisQueue:       envOrDefault("REDIS_QUEUE", "poofmq:default"),
		PostgresHost:     envOrDefault("DB_HOST", "postgres"),
		PostgresPort:     envOrDefault("DB_PORT", "5432"),
		PostgresDB:       envOrDefault("DB_DATABASE", "poofmq"),
		PostgresUser:     envOrDefault("DB_USERNAME", "poofmq"),
		PostgresPassword: envOrDefault("DB_PASSWORD", "poofmq"),
	}
}

func (c Config) RedisAddress() string {
	return fmt.Sprintf("%s:%s", c.RedisHost, c.RedisPort)
}

func (c Config) PostgresAddress() string {
	return fmt.Sprintf("%s:%s", c.PostgresHost, c.PostgresPort)
}

func envOrDefault(key string, fallback string) string {
	value := os.Getenv(key)
	if value == "" {
		return fallback
	}

	return value
}
