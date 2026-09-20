package server

import (
	"context"
	"crypto/subtle"
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

	// Database → API webhooks (pg_net). Protected by a shared secret, not user JWTs.
	r.Route("/internal", func(r chi.Router) {
		r.Use(api.internalAuth)
		r.Post("/notify-message", api.notifyMessage)
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
		r.Post("/rooms/{id}/call", api.joinRoomCall)
		r.Post("/rooms/{id}/call/leave", api.leaveRoomCall)
		r.Post("/notify-message", api.notifyMessageFromUser)
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

func (a *API) internalAuth(next http.Handler) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		secret := strings.TrimSpace(a.cfg.InternalWebhookSecret)
		provided := strings.TrimSpace(r.Header.Get("X-Internal-Secret"))
		if secret == "" || provided == "" || subtle.ConstantTimeCompare([]byte(secret), []byte(provided)) != 1 {
			writeErr(w, http.StatusUnauthorized, "unauthorized")
			return
		}
		next.ServeHTTP(w, r)
	})
}

type notifyMessageBody struct {
	MessageID      string `json:"message_id"`
	ConversationID string `json:"conversation_id"`
	SenderID       string `json:"sender_id"`
	Type           string `json:"type"`
	// Sending device — skip it so the phone that just sent does not notify itself.
	// Other devices of the same account still get the push (WhatsApp multi-device).
	ExcludeToken string `json:"exclude_token"`
}

// notifyMessage fans a new message out to every other member's devices.
// Message bodies are never included: they are end-to-end encrypted and the
// push only carries the type so the phone can show "Photo" / "New message".
func (a *API) notifyMessage(w http.ResponseWriter, r *http.Request) {
	var body notifyMessageBody
	if err := json.NewDecoder(r.Body).Decode(&body); err != nil || body.ConversationID == "" || body.SenderID == "" {
		writeErr(w, http.StatusBadRequest, "invalid body")
		return
	}
	if !a.db.Privileged() {
		writeErr(w, http.StatusServiceUnavailable, "service key not configured")
		return
	}
	// Respond immediately; the fan-out happens in the background.
	writeJSON(w, http.StatusAccepted, map[string]bool{"ok": true})
	go a.fanOutMessage(body)
}

// notifyMessageFromUser is the client backup for the database webhook: the
// sender's phone tells the API a message was saved so other devices can be
// woken even when pg_net / app_settings were never configured.
func (a *API) notifyMessageFromUser(w http.ResponseWriter, r *http.Request) {
	var body notifyMessageBody
	if err := json.NewDecoder(r.Body).Decode(&body); err != nil || body.ConversationID == "" {
		writeErr(w, http.StatusBadRequest, "invalid body")
		return
	}
	if !a.db.Privileged() {
		writeErr(w, http.StatusServiceUnavailable, "service key not configured")
		return
	}
	userID := currentUserID(r)
	body.SenderID = userID
	members, err := a.db.ConversationMemberIDs(body.ConversationID)
	if err != nil {
		writeErr(w, http.StatusBadGateway, err.Error())
		return
	}
	allowed := false
	for _, id := range members {
		if id == userID {
			allowed = true
			break
		}
	}
	if !allowed {
		writeErr(w, http.StatusForbidden, "not a member")
		return
	}
	writeJSON(w, http.StatusAccepted, map[string]bool{"ok": true})
	go a.fanOutMessage(body)
}

func (a *API) fanOutMessage(body notifyMessageBody) {
	if a.alreadyPushed("msg", body.MessageID) {
		return
	}
	members, err := a.db.ConversationMemberIDs(body.ConversationID)
	if err != nil {
		log.Printf("members lookup failed: %v", err)
		return
	}
	if len(members) == 0 {
		log.Printf("push skip: no members conversation=%s", body.ConversationID)
		return
	}
	devices, err := a.db.DevicesForUsers(members)
	if err != nil {
		log.Printf("devices lookup failed: %v", err)
		return
	}
	if body.ExcludeToken != "" {
		filtered := devices[:0]
		for _, device := range devices {
			if device.ExpoPushToken != body.ExcludeToken {
				filtered = append(filtered, device)
			}
		}
		devices = filtered
	}
	if len(devices) == 0 {
		log.Printf("push skip: 0 devices members=%d conversation=%s", len(members), body.ConversationID)
		return
	}
	sender, err := a.db.Profile(body.SenderID)
	if err != nil {
		log.Printf("sender lookup failed: %v", err)
		return
	}
	title := sender.DisplayName
	if title == "" {
		title = sender.Username
	}
	kind := body.Type
	if kind == "" {
		kind = "text"
	}
	messages := make([]push.Message, 0, len(devices))
	badge := 1
	for _, device := range devices {
		messages = append(messages, push.Message{
			To:                device.ExpoPushToken,
			Title:             title,
			Body:              push.Text(device.Locale, kind),
			Sound:             "default",
			Priority:          "high",
			ChannelID:         push.ChannelMessages,
			TTL:               60 * 60 * 24,
			Badge:             &badge,
			InterruptionLevel: "time-sensitive",
			ContentAvailable:  true,
			MutableContent:    true,
			Data: map[string]any{
				"type":            "message",
				"conversation_id": body.ConversationID,
				"message_id":      body.MessageID,
				"sender_id":       body.SenderID,
			},
		})
	}
	a.sendPush(messages, devices)
}

// sendPush delivers a batch and drops the tokens Expo reported as dead, so a
// reinstalled phone does not keep a stale row that silently swallows pushes.
func (a *API) sendPush(messages []push.Message, devices []store.Device) {
	dead, err := push.SendExpo(messages)
	if err != nil {
		log.Printf("expo push failed: %v", err)
	}
	if len(dead) == 0 {
		return
	}
	owner := make(map[string]string, len(devices))
	for _, device := range devices {
		owner[device.ExpoPushToken] = device.UserID
	}
	for _, token := range dead {
		if userID := owner[token]; userID != "" {
			if err := a.db.DeleteDevice(userID, token); err != nil {
				log.Printf("stale device cleanup failed: %v", err)
			}
		}
	}
}

func (a *API) alreadyPushed(kind, id string) bool {
	if id == "" || a.redis == nil {
		return false
	}
	ok, err := a.redis.SetNX(context.Background(), "push:"+kind+":"+id, "1", time.Minute).Result()
	if err != nil {
		return false
	}
	return !ok
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
	Locale   string `json:"locale"`
}

func (a *API) registerDevice(w http.ResponseWriter, r *http.Request) {
	var body deviceBody
	if err := json.NewDecoder(r.Body).Decode(&body); err != nil || strings.TrimSpace(body.Token) == "" {
		writeErr(w, http.StatusBadRequest, "invalid body")
		return
	}
	if err := a.storeFor(r).UpsertDevice(currentUserID(r), body.Token, body.Platform, body.Locale); err != nil {
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
	if err := livekitutil.EnsureRoom(a.cfg.LiveKitURL, a.cfg.LiveKitAPIKey, a.cfg.LiveKitAPISecret, room, 2); err != nil {
		log.Printf("livekit create room: %v", err)
	}
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

type roomCallBody struct {
	Kind string `json:"kind"`
}

type roomCallResponse struct {
	Call       store.RoomCall `json:"call"`
	Token      string         `json:"token"`
	LiveKitURL string         `json:"livekit_url"`
}

// joinRoomCall joins the call running in a room, starting it if there is none.
// Unlike 1:1 calls nobody "rings": members see the live call and step in.
func (a *API) joinRoomCall(w http.ResponseWriter, r *http.Request) {
	conversationID := chi.URLParam(r, "id")
	if _, err := uuid.Parse(conversationID); err != nil {
		writeErr(w, http.StatusBadRequest, "invalid room")
		return
	}
	var body roomCallBody
	_ = json.NewDecoder(r.Body).Decode(&body)
	if body.Kind != "audio" && body.Kind != "video" {
		body.Kind = "audio"
	}

	userID := currentUserID(r)
	db := a.storeFor(r)
	member, err := db.IsConversationMember(conversationID, userID)
	if err != nil {
		writeErr(w, http.StatusBadGateway, err.Error())
		return
	}
	if !member {
		writeErr(w, http.StatusForbidden, "forbidden")
		return
	}

	call, err := db.LiveRoomCall(conversationID)
	if err != nil {
		writeErr(w, http.StatusBadGateway, err.Error())
		return
	}
	started := false
	if call == nil {
		roomName := "room_" + conversationID
		if err := livekitutil.EnsureRoom(a.cfg.LiveKitURL, a.cfg.LiveKitAPIKey, a.cfg.LiveKitAPISecret, roomName, 16); err != nil {
			log.Printf("livekit create room: %v", err)
		}
		call, err = db.InsertRoomCall(store.RoomCall{
			ConversationID: conversationID,
			StartedBy:      userID,
			Kind:           body.Kind,
			Status:         "live",
			RoomName:       roomName,
		})
		if err != nil {
			// Someone else started the same call a moment ago (unique index on live calls).
			call, err = db.LiveRoomCall(conversationID)
			if err != nil || call == nil {
				writeErr(w, http.StatusBadGateway, "could not start the call")
				return
			}
		} else {
			started = true
		}
	}

	profile, err := db.Profile(userID)
	if err != nil {
		writeErr(w, http.StatusBadGateway, err.Error())
		return
	}
	token, err := livekitutil.JoinToken(a.cfg.LiveKitAPIKey, a.cfg.LiveKitAPISecret, call.RoomName, userID, profile.DisplayName, true)
	if err != nil {
		writeErr(w, http.StatusInternalServerError, err.Error())
		return
	}

	if started {
		go a.notifyRoomCall(conversationID, *call, *profile)
	}
	writeJSON(w, http.StatusOK, roomCallResponse{Call: *call, Token: token, LiveKitURL: a.cfg.LiveKitURL})
}

// leaveRoomCall ends the room call once the last participant is gone. The client
// reports how many people are still in the LiveKit room.
func (a *API) leaveRoomCall(w http.ResponseWriter, r *http.Request) {
	conversationID := chi.URLParam(r, "id")
	var body struct {
		Remaining int `json:"remaining"`
	}
	_ = json.NewDecoder(r.Body).Decode(&body)

	db := a.storeFor(r)
	member, err := db.IsConversationMember(conversationID, currentUserID(r))
	if err != nil || !member {
		writeErr(w, http.StatusForbidden, "forbidden")
		return
	}
	if body.Remaining > 0 {
		writeJSON(w, http.StatusOK, map[string]bool{"ok": true})
		return
	}
	call, err := db.LiveRoomCall(conversationID)
	if err == nil && call != nil {
		_ = db.EndRoomCall(call.ID)
	}
	writeJSON(w, http.StatusOK, map[string]bool{"ok": true})
}

func (a *API) notifyRoomCall(conversationID string, call store.RoomCall, starter store.Profile) {
	if !a.db.Privileged() {
		return
	}
	members, err := a.db.ConversationMemberIDs(conversationID)
	if err != nil {
		return
	}
	recipients := make([]string, 0, len(members))
	for _, id := range members {
		if id != call.StartedBy {
			recipients = append(recipients, id)
		}
	}
	devices, err := a.db.DevicesForUsers(recipients)
	if err != nil || len(devices) == 0 {
		return
	}
	title, _ := a.db.ConversationTitle(conversationID)
	if title == "" {
		title = starter.DisplayName
	}
	textKey := "room_call_audio"
	if call.Kind == "video" {
		textKey = "room_call_video"
	}
	messages := make([]push.Message, 0, len(devices))
	for _, device := range devices {
		messages = append(messages, push.Message{
			To:        device.ExpoPushToken,
			Title:     title,
			Body:      push.Text(device.Locale, textKey),
			Sound:     "ringtone.wav",
			Priority:  "high",
			ChannelID: push.ChannelCalls,
			TTL:       60 * 10,
			Data: map[string]any{
				"type":            "room_call",
				"conversation_id": conversationID,
				"room_call_id":    call.ID,
				"kind":            call.Kind,
			},
		})
	}
	a.sendPush(messages, devices)
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
	if active == nil {
		return false, nil
	}
	// Self-heal calls that were never closed (client crash, API restart before the
	// ring timer fired, lost network on hangup). Otherwise the user stays "busy" forever.
	if a.isStaleCall(active) {
		status := "missed"
		if active.Status == "accepted" {
			status = "ended"
		}
		if _, err := a.endCall(ctx, db, active, status); err != nil {
			log.Printf("stale call %s cleanup failed: %v", active.ID, err)
			return true, nil
		}
		return false, nil
	}
	return true, nil
}

// isStaleCall reports whether a ringing/accepted call has clearly outlived its lifetime.
func (a *API) isStaleCall(call *store.Call) bool {
	const acceptedMaxAge = 4 * time.Hour
	ringMaxAge := time.Duration(a.cfg.CallRingTimeoutSec)*time.Second + 30*time.Second

	switch call.Status {
	case "ringing":
		created, err := time.Parse(time.RFC3339Nano, call.CreatedAt)
		if err != nil {
			return true
		}
		return time.Since(created) > ringMaxAge
	case "accepted":
		ref := call.CreatedAt
		if call.StartedAt != nil && *call.StartedAt != "" {
			ref = *call.StartedAt
		}
		started, err := time.Parse(time.RFC3339Nano, ref)
		if err != nil {
			return true
		}
		return time.Since(started) > acceptedMaxAge
	default:
		return false
	}
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
	if len(devices) == 0 {
		log.Printf("incoming call push skipped: no devices for callee %s", call.CalleeID)
		return
	}
	messages := make([]push.Message, 0, len(devices))
	title := caller.DisplayName
	if title == "" {
		title = caller.Username
	}
	textKey := "incoming_audio"
	if call.Kind == "video" {
		textKey = "incoming_video"
	}
	for _, device := range devices {
		messages = append(messages, push.Message{
			To:                device.ExpoPushToken,
			Title:             title,
			Body:              push.Text(device.Locale, textKey),
			Sound:             "ringtone.wav",
			Priority:          "high",
			ChannelID:         push.ChannelCalls,
			CategoryID:        push.CategoryIncomingCall,
			InterruptionLevel: "time-sensitive",
			ContentAvailable:  true,
			// A ring that is not delivered within the ring window is useless.
			TTL: a.cfg.CallRingTimeoutSec,
			Data: map[string]any{
				"type":      "incoming_call",
				"call_id":   call.ID,
				"kind":      call.Kind,
				"caller_id": call.CallerID,
				"title":     title,
				"body":      push.Text(device.Locale, textKey),
			},
		})
	}
	a.sendPush(messages, devices)
}

// notifyMissed tells the callee about a call they did not pick up.
func (a *API) notifyMissed(call store.Call) {
	if !a.db.Privileged() {
		return
	}
	devices, err := a.db.DevicesForUser(call.CalleeID)
	if err != nil || len(devices) == 0 {
		return
	}
	caller, err := a.db.Profile(call.CallerID)
	if err != nil {
		return
	}
	title := caller.DisplayName
	if title == "" {
		title = caller.Username
	}
	textKey := "missed_audio"
	if call.Kind == "video" {
		textKey = "missed_video"
	}
	messages := make([]push.Message, 0, len(devices))
	for _, device := range devices {
		messages = append(messages, push.Message{
			To:        device.ExpoPushToken,
			Title:     title,
			Body:      push.Text(device.Locale, textKey),
			Sound:     "default",
			ChannelID: push.ChannelMessages,
			Data: map[string]any{
				"type":      "call_ended",
				"call_id":   call.ID,
				"kind":      call.Kind,
				"caller_id": call.CallerID,
			},
		})
	}
	a.sendPush(messages, devices)
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
		return
	}
	a.notifyMissed(*call)
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
