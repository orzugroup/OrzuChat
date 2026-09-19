package main

import (
	"log"
	"net/http"

	"github.com/orzuchat/api/internal/config"
	"github.com/orzuchat/api/internal/server"
	"github.com/orzuchat/api/internal/store"
	"github.com/redis/go-redis/v9"
)

func main() {
	cfg := config.Load()
	db := store.New(cfg.SupabaseURL, cfg.SupabaseAnonKey, cfg.SupabaseServiceKey)

	opt, err := redis.ParseURL(cfg.RedisURL)
	if err != nil {
		log.Fatalf("redis url: %v", err)
	}
	rdb := redis.NewClient(opt)

	handler := server.New(cfg, db, rdb)
	log.Printf("orzu-chat-api listening on :%s", cfg.Port)
	if err := http.ListenAndServe(":"+cfg.Port, handler); err != nil {
		log.Fatal(err)
	}
}
