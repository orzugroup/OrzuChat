package config

import (
	"os"
	"strconv"
	"strings"
)

type Config struct {
	Port               string
	SupabaseURL        string
	SupabaseAnonKey    string
	SupabaseServiceKey string
	LiveKitURL         string
	LiveKitAPIKey      string
	LiveKitAPISecret   string
	RedisURL           string
	AllowedOrigins     []string
	CallRingTimeoutSec int
}

func Load() Config {
	return Config{
		Port:               env("PORT", "8080"),
		SupabaseURL:        strings.TrimRight(mustEnv("SUPABASE_URL"), "/"),
		SupabaseAnonKey:    mustEnv("SUPABASE_ANON_KEY"),
		SupabaseServiceKey: env("SUPABASE_SERVICE_ROLE_KEY", ""),
		LiveKitURL:         mustEnv("LIVEKIT_URL"),
		LiveKitAPIKey:      mustEnv("LIVEKIT_API_KEY"),
		LiveKitAPISecret:   mustEnv("LIVEKIT_API_SECRET"),
		RedisURL:           env("REDIS_URL", "redis://redis:6379"),
		AllowedOrigins:     splitCSV(env("ALLOWED_ORIGINS", "*")),
		CallRingTimeoutSec: envInt("CALL_RING_TIMEOUT_SEC", 45),
	}
}

func env(key, fallback string) string {
	if value := strings.TrimSpace(os.Getenv(key)); value != "" {
		return value
	}
	return fallback
}

func mustEnv(key string) string {
	value := strings.TrimSpace(os.Getenv(key))
	if value == "" {
		panic("missing required env: " + key)
	}
	return value
}

func envInt(key string, fallback int) int {
	raw := strings.TrimSpace(os.Getenv(key))
	if raw == "" {
		return fallback
	}
	value, err := strconv.Atoi(raw)
	if err != nil {
		return fallback
	}
	return value
}

func splitCSV(raw string) []string {
	parts := strings.Split(raw, ",")
	out := make([]string, 0, len(parts))
	for _, part := range parts {
		if trimmed := strings.TrimSpace(part); trimmed != "" {
			out = append(out, trimmed)
		}
	}
	if len(out) == 0 {
		return []string{"*"}
	}
	return out
}
