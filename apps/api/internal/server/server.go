package server

import (
	"context"
	"encoding/json"
	"errors"
	"log"
	"net/http"
	"strings"
	"time"

	"github.com/go-chi/chi/v5"
	"github.com/go-chi/chi/v5/middleware"
	"github.com/go-chi/cors"
	"github.com/google/uuid"
	"github.com/orzuchat/api/internal/config"
	"github.com/orzuchat/api/internal/livekitutil"
	"github.com/orzuchat/api/internal/push"
	"github.com/orzuchat/api/internal/store"
	"github.com/redis/go-redis/v9"
)

type API struct {
	cfg   config.Config
	db    *store.Client
	redis *redis.Client
}

type contextKey string

const userIDKey contextKey = "userID"

func New(cfg config.Config, db *store.Client, rdb *redis.Client) http.Handler {
	api := &API{cfg: cfg, db: db, redis: rdb}
	r := chi.NewRouter()
	r.Use(middleware.RequestID)
	r.Use(middleware.RealIP)
	r.Use(middleware.Recoverer)
	r.Use(middleware.Timeout(20 * time.Second))
	r.Use(cors.Handler(cors.Options{
		AllowedOrigins:   cfg.AllowedOrigins,
		AllowedMethods:   []string{"GET", "POST", "PATCH", "DELETE", "OPTIONS"},
		AllowedHeaders:   []string{"Accept", "Authorization", "Content-Type"},
		AllowCredentials: false,
	}))

	r.Get("/health", func(w http.ResponseWriter, _ *http.Request) {
		writeJSON(w, http.StatusOK, map[string]string{"status": "ok"})
	})

	r.Route("/v1", func(r chi.Router) {
		r.Use(api.auth)
		r.Post("/devices", api.registerDevice)
		r.Delete("/devices", api.removeDevice)
		r.Post("/presence/heartbeat", api.heartbeat)
		r.Get("/presence", api.presence)
		r.Post("/calls", api.startCall)
		r.Get("/calls/{id}", api.getCall)
		r.Post("/calls/{id}/accept", api.acceptCall)
		r.Post("/calls/{id}/reject", api.rejectCall)
		r.Post("/calls/{id}/hangup", api.hangupCall)
	})

	return r
}

func (a *API) auth(next http.Handler) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		header := r.Header.Get("Authorization")
		if !strings.HasPrefix(strings.ToLower(header), "bearer ") {
			writeErr(w, http.StatusUnauthorized, "unauthorized")
			return
		}
		token := strings.TrimSpace(header[7:])
		user, err := a.db.AuthUser(token)
		if err != nil {
			writeErr(w, http.StatusUnauthorized, "unauthorized")
			return
		}
		ctx := context.WithValue(r.Context(), userIDKey, user.ID)
		next.ServeHTTP(w, r.WithContext(ctx))
	})
}

func currentUserID(r *http.Request) string {
	value, _ := r.Context().Value(userIDKey).(string)
	return value
}

func bearerToken(r *http.Request) string {
	header := r.Header.Get("Authorization")
	if !strings.HasPrefix(strings.ToLower(header), "bearer ") {
		return ""
	}
	return strings.TrimSpace(header[7:])
}

func (a *API) storeFor(r *http.Request) *store.Client {
	return a.db.WithUserToken(bearerToken(r))
}

type deviceBody struct {
	Token    string `json:"token"`
	Platform string `json:"platform"`
}

func (a *API) registerDevice(w http.ResponseWriter, r *http.Request) {
	var body deviceBody
	if err := json.NewDecoder(r.Body).Decode(&body); err != nil || strings.TrimSpace(body.Token) == "" {
		writeErr(w, http.StatusBadRequest, "invalid body")
		return
	}
	if err := a.storeFor(r).UpsertDevice(currentUserID(r), body.Token, body.Platform); err != nil {
		writeErr(w, http.StatusBadGateway, err.Error())
		return
	}
	writeJSON(w, http.StatusOK, map[string]bool{"ok": true})
}

func (a *API) removeDevice(w http.ResponseWriter, r *http.Request) {
	var body deviceBody
	if err := json.NewDecoder(r.Body).Decode(&body); err != nil || strings.TrimSpace(body.Token) == "" {
		writeErr(w, http.StatusBadRequest, "invalid body")
		return
	}
	if err := a.storeFor(r).DeleteDevice(currentUserID(r), body.Token); err != nil {
		writeErr(w, http.StatusBadGateway, err.Error())
		return
	}
	writeJSON(w, http.StatusOK, map[string]bool{"ok": true})
}

func (a *API) heartbeat(w http.ResponseWriter, r *http.Request) {
	userID := currentUserID(r)
	if err := a.redis.Set(r.Context(), "presence:"+userID, time.Now().UTC().Format(time.RFC3339), 45*time.Second).Err(); err != nil {
		writeErr(w, http.StatusBadGateway, err.Error())
		return
	}
	_ = a.storeFor(r).TouchLastSeen(userID)
	writeJSON(w, http.StatusOK, map[string]bool{"ok": true})
}

func (a *API) presence(w http.ResponseWriter, r *http.Request) {
	ids := strings.Split(r.URL.Query().Get("user_ids"), ",")
	online := map[string]bool{}
	for _, raw := range ids {
		id := strings.TrimSpace(raw)
		if id == "" {
			continue
		}
		exists, err := a.redis.Exists(r.Context(), "presence:"+id).Result()
		if err != nil {
			writeErr(w, http.StatusBadGateway, err.Error())
			return
		}
		online[id] = exists == 1
	}
	writeJSON(w, http.StatusOK, map[string]any{"online": online})
}

type startCallBody struct {
	CalleeID       string  `json:"callee_id"`
	Kind           string  `json:"kind"`
	ConversationID *string `json:"conversation_id"`
}

type callResponse struct {
	Call       store.Call `json:"call"`
	Token      string     `json:"token"`
	LiveKitURL string     `json:"livekit_url"`
}

func (a *API) startCall(w http.ResponseWriter, r *http.Request) {
	var body startCallBody
	if err := json.NewDecoder(r.Body).Decode(&body); err != nil {
		writeErr(w, http.StatusBadRequest, "invalid body")
		return
	}
	if body.Kind != "audio" && body.Kind != "video" {
		writeJSON(w, http.StatusBadRequest, map[string]string{"error": "kind must be audio or video"})
		return
	}
	if body.ConversationID != nil && strings.TrimSpace(*body.ConversationID) == "" {
		body.ConversationID = nil
	}
	callerID := currentUserID(r)
	if body.CalleeID == "" || body.CalleeID == callerID {
		writeErr(w, http.StatusBadRequest, "invalid callee")
		return
	}

	db := a.storeFor(r)
	if _, err := db.Profile(body.CalleeID); err != nil {
		writeErr(w, http.StatusNotFound, "callee not found")
		return
	}

	busy, err := a.userBusy(r.Context(), db, body.CalleeID)
	if err != nil {
		writeErr(w, http.StatusBadGateway, err.Error())
		return
	}
	if busy {
		writeJSON(w, http.StatusConflict, map[string]string{"error": "busy"})
		return
	}

	selfBusy, err := a.userBusy(r.Context(), db, callerID)
	if err != nil {
		writeErr(w, http.StatusBadGateway, err.Error())
		return
	}
	if selfBusy {
		writeJSON(w, http.StatusConflict, map[string]string{"error": "already_in_call"})
		return
	}

	room := "call_" + uuid.NewString()
	call, err := db.InsertCall(store.Call{
		ID:             uuid.NewString(),
		ConversationID: body.ConversationID,
		CallerID:       callerID,
		CalleeID:       body.CalleeID,
		Kind:           body.Kind,
		Status:         "ringing",
		RoomName:       room,
	})
	if err != nil {
		writeErr(w, http.StatusBadGateway, err.Error())
		return
	}

	_ = a.redis.Set(r.Context(), "call:user:"+callerID, call.ID, 2*time.Minute).Err()
	_ = a.redis.Set(r.Context(), "call:user:"+body.CalleeID, call.ID, 2*time.Minute).Err()

	caller, err := db.Profile(callerID)
	if err != nil {
		writeErr(w, http.StatusBadGateway, err.Error())
		return
	}
	token, err := livekitutil.JoinToken(a.cfg.LiveKitAPIKey, a.cfg.LiveKitAPISecret, room, callerID, caller.DisplayName, body.Kind == "video")
	if err != nil {
		writeErr(w, http.StatusInternalServerError, err.Error())
		return
	}

	go a.notifyIncoming(*call, *caller)
	go a.missIfUnanswered(call.ID, bearerToken(r))

	writeJSON(w, http.StatusCreated, callResponse{Call: *call, Token: token, LiveKitURL: a.cfg.LiveKitURL})
}

func (a *API) getCall(w http.ResponseWriter, r *http.Request) {
	db := a.storeFor(r)
	call, err := a.participantCall(r, db)
	if err != nil {
		writeCallErr(w, err)
		return
	}
	userID := currentUserID(r)
	profile, err := db.Profile(userID)
	if err != nil {
		writeErr(w, http.StatusBadGateway, err.Error())
		return
	}
	token, err := livekitutil.JoinToken(a.cfg.LiveKitAPIKey, a.cfg.LiveKitAPISecret, call.RoomName, userID, profile.DisplayName, call.Kind == "video")
	if err != nil {
		writeErr(w, http.StatusInternalServerError, err.Error())
		return
	}
	writeJSON(w, http.StatusOK, callResponse{Call: *call, Token: token, LiveKitURL: a.cfg.LiveKitURL})
}

func (a *API) acceptCall(w http.ResponseWriter, r *http.Request) {
	db := a.storeFor(r)
	call, err := a.participantCall(r, db)
	if err != nil {
		writeCallErr(w, err)
		return
	}
	userID := currentUserID(r)
	if call.CalleeID != userID {
		writeErr(w, http.StatusForbidden, "forbidden")
		return
	}
	if call.Status != "ringing" {
		writeErr(w, http.StatusConflict, "call is not ringing")
		return
	}
	now := time.Now().UTC().Format(time.RFC3339Nano)
	updated, err := db.UpdateCall(call.ID, map[string]any{"status": "accepted", "started_at": now})
	if err != nil {
		writeErr(w, http.StatusBadGateway, err.Error())
		return
	}
	_ = a.redis.Expire(r.Context(), "call:user:"+call.CallerID, 2*time.Hour).Err()
	_ = a.redis.Expire(r.Context(), "call:user:"+call.CalleeID, 2*time.Hour).Err()
	profile, err := db.Profile(userID)
	if err != nil {
		writeErr(w, http.StatusBadGateway, err.Error())
		return
	}
	token, err := livekitutil.JoinToken(a.cfg.LiveKitAPIKey, a.cfg.LiveKitAPISecret, call.RoomName, userID, profile.DisplayName, call.Kind == "video")
	if err != nil {
		writeErr(w, http.StatusInternalServerError, err.Error())
		return
	}
	writeJSON(w, http.StatusOK, callResponse{Call: *updated, Token: token, LiveKitURL: a.cfg.LiveKitURL})
}

func (a *API) rejectCall(w http.ResponseWriter, r *http.Request) {
	db := a.storeFor(r)
	call, err := a.participantCall(r, db)
	if err != nil {
		writeCallErr(w, err)
		return
	}
	if call.CalleeID != currentUserID(r) {
		writeErr(w, http.StatusForbidden, "forbidden")
		return
	}
	updated, err := a.endCall(r.Context(), db, call, "rejected")
	if err != nil {
		writeErr(w, http.StatusBadGateway, err.Error())
		return
	}
	writeJSON(w, http.StatusOK, map[string]any{"call": updated})
}

func (a *API) hangupCall(w http.ResponseWriter, r *http.Request) {
	db := a.storeFor(r)
	call, err := a.participantCall(r, db)
	if err != nil {
		writeCallErr(w, err)
		return
	}
	status := "ended"
	if call.Status == "ringing" && call.CallerID == currentUserID(r) {
		status = "missed"
	}
	updated, err := a.endCall(r.Context(), db, call, status)
	if err != nil {
		writeErr(w, http.StatusBadGateway, err.Error())
		return
	}
	writeJSON(w, http.StatusOK, map[string]any{"call": updated})
}

func (a *API) participantCall(r *http.Request, db *store.Client) (*store.Call, error) {
	call, err := db.CallByID(chi.URLParam(r, "id"))
	if err != nil {
		return nil, err
	}
	userID := currentUserID(r)
	if call.CallerID != userID && call.CalleeID != userID {
		return nil, errForbidden
	}
	return call, nil
}

func (a *API) userBusy(ctx context.Context, db *store.Client, userID string) (bool, error) {
	exists, err := a.redis.Exists(ctx, "call:user:"+userID).Result()
	if err != nil {
		return false, err
	}
	if exists == 1 {
		return true, nil
	}
	active, err := db.ActiveCallForUser(userID)
	if err != nil {
		return false, err
	}
	return active != nil, nil
}

func (a *API) endCall(ctx context.Context, db *store.Client, call *store.Call, status string) (*store.Call, error) {
	if call.Status == "ended" || call.Status == "rejected" || call.Status == "missed" || call.Status == "busy" {
		return call, nil
	}
	now := time.Now().UTC().Format(time.RFC3339Nano)
	updated, err := db.UpdateCall(call.ID, map[string]any{"status": status, "ended_at": now})
	if err != nil {
		return nil, err
	}
	_ = a.redis.Del(ctx, "call:user:"+call.CallerID, "call:user:"+call.CalleeID).Err()
	return updated, nil
}

func (a *API) notifyIncoming(call store.Call, caller store.Profile) {
	if !a.db.Privileged() {
		return
	}
	devices, err := a.db.DevicesForUser(call.CalleeID)
	if err != nil {
		log.Printf("devices lookup failed: %v", err)
		return
	}
	messages := make([]push.Message, 0, len(devices))
	title := caller.DisplayName
	if title == "" {
		title = caller.Username
	}
	body := "Входящий аудиозвонок"
	if call.Kind == "video" {
		body = "Входящий видеозвонок"
	}
	for _, device := range devices {
		messages = append(messages, push.Message{
			To:    device.ExpoPushToken,
			Title: title,
			Body:  body,
			Sound: "default",
			Data: map[string]any{
				"type":    "incoming_call",
				"call_id": call.ID,
				"kind":    call.Kind,
			},
		})
	}
	if err := push.SendExpo(messages); err != nil {
		log.Printf("expo push failed: %v", err)
	}
}

func (a *API) missIfUnanswered(callID, userToken string) {
	timer := time.NewTimer(time.Duration(a.cfg.CallRingTimeoutSec) * time.Second)
	defer timer.Stop()
	<-timer.C
	db := a.db.WithUserToken(userToken)
	call, err := db.CallByID(callID)
	if err != nil || call.Status != "ringing" {
		return
	}
	if _, err := a.endCall(context.Background(), db, call, "missed"); err != nil {
		log.Printf("miss timeout failed: %v", err)
	}
}

var errForbidden = errors.New("forbidden")

func writeCallErr(w http.ResponseWriter, err error) {
	if errors.Is(err, errForbidden) {
		writeErr(w, http.StatusForbidden, "forbidden")
		return
	}
	if strings.Contains(err.Error(), "not found") {
		writeErr(w, http.StatusNotFound, "not found")
		return
	}
	writeErr(w, http.StatusBadGateway, err.Error())
}

func writeErr(w http.ResponseWriter, status int, message string) {
	writeJSON(w, status, map[string]string{"error": message})
}

func writeJSON(w http.ResponseWriter, status int, body any) {
	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(status)
	_ = json.NewEncoder(w).Encode(body)
}
