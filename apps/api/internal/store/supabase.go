package store

import (
	"bytes"
	"encoding/json"
	"fmt"
	"io"
	"net/http"
	"net/url"
	"strings"
	"time"
)

type Client struct {
	baseURL    string
	anonKey    string
	serviceKey string
	userToken  string
	http       *http.Client
}

type User struct {
	ID    string  `json:"id"`
	Email *string `json:"email"`
	Phone *string `json:"phone"`
}

type Profile struct {
	ID          string  `json:"id"`
	Username    string  `json:"username"`
	DisplayName string  `json:"display_name"`
	AvatarURL   *string `json:"avatar_url"`
	Phone       *string `json:"phone"`
}

type Call struct {
	ID             string  `json:"id,omitempty"`
	ConversationID *string `json:"conversation_id,omitempty"`
	CallerID       string  `json:"caller_id"`
	CalleeID       string  `json:"callee_id"`
	Kind           string  `json:"kind"`
	Status         string  `json:"status"`
	RoomName       string  `json:"room_name"`
	StartedAt      *string `json:"started_at,omitempty"`
	EndedAt        *string `json:"ended_at,omitempty"`
	CreatedAt      string  `json:"created_at,omitempty"`
}

type Device struct {
	ID            string  `json:"id"`
	UserID        string  `json:"user_id"`
	ExpoPushToken string  `json:"expo_push_token"`
	Platform      *string `json:"platform"`
}

func New(baseURL, anonKey, serviceKey string) *Client {
	return &Client{
		baseURL:    strings.TrimRight(baseURL, "/"),
		anonKey:    anonKey,
		serviceKey: serviceKey,
		http:       &http.Client{Timeout: 12 * time.Second},
	}
}

func (c *Client) WithUserToken(token string) *Client {
	clone := *c
	clone.userToken = strings.TrimSpace(token)
	return &clone
}

func (c *Client) Privileged() bool {
	key := strings.TrimSpace(c.serviceKey)
	return key != "" && key != "replace-me"
}

func (c *Client) AuthUser(accessToken string) (*User, error) {
	req, err := http.NewRequest(http.MethodGet, c.baseURL+"/auth/v1/user", nil)
	if err != nil {
		return nil, err
	}
	req.Header.Set("Authorization", "Bearer "+accessToken)
	req.Header.Set("apikey", c.anonKey)
	var user User
	if err := c.decode(req, &user); err != nil {
		return nil, err
	}
	if user.ID == "" {
		return nil, fmt.Errorf("unauthorized")
	}
	return &user, nil
}

func (c *Client) Profile(id string) (*Profile, error) {
	rows, err := query[Profile](c, "/rest/v1/profiles?id=eq."+url.QueryEscape(id)+"&select=id,username,display_name,avatar_url,phone")
	if err != nil {
		return nil, err
	}
	if len(rows) == 0 {
		return nil, fmt.Errorf("profile not found")
	}
	return &rows[0], nil
}

func (c *Client) InsertCall(call Call) (*Call, error) {
	rows, err := mutate[[]Call](c, http.MethodPost, "/rest/v1/calls", call)
	if err != nil {
		return nil, err
	}
	if len(*rows) == 0 {
		return nil, fmt.Errorf("call insert failed")
	}
	return &(*rows)[0], nil
}

func (c *Client) CallByID(id string) (*Call, error) {
	rows, err := query[Call](c, "/rest/v1/calls?id=eq."+url.QueryEscape(id)+"&select=*")
	if err != nil {
		return nil, err
	}
	if len(rows) == 0 {
		return nil, fmt.Errorf("call not found")
	}
	return &rows[0], nil
}

func (c *Client) ActiveCallForUser(userID string) (*Call, error) {
	filter := url.Values{}
	filter.Set("or", fmt.Sprintf("(caller_id.eq.%s,callee_id.eq.%s)", userID, userID))
	filter.Set("status", "in.(ringing,accepted)")
	filter.Set("select", "*")
	filter.Set("order", "created_at.desc")
	filter.Set("limit", "1")
	rows, err := query[Call](c, "/rest/v1/calls?"+filter.Encode())
	if err != nil {
		return nil, err
	}
	if len(rows) == 0 {
		return nil, nil
	}
	return &rows[0], nil
}

func (c *Client) UpdateCall(id string, patch map[string]any) (*Call, error) {
	rows, err := mutate[[]Call](c, http.MethodPatch, "/rest/v1/calls?id=eq."+url.QueryEscape(id), patch)
	if err != nil {
		return nil, err
	}
	if len(*rows) == 0 {
		return nil, fmt.Errorf("call update failed")
	}
	return &(*rows)[0], nil
}

func (c *Client) TouchLastSeen(userID string) error {
	_, err := mutate[[]Profile](c, http.MethodPatch, "/rest/v1/profiles?id=eq."+url.QueryEscape(userID), map[string]any{
		"last_seen_at": time.Now().UTC().Format(time.RFC3339Nano),
	})
	return err
}

func (c *Client) UpsertDevice(userID, token, platform string) error {
	body := map[string]any{
		"user_id":         userID,
		"expo_push_token": token,
		"platform":        platform,
		"updated_at":      time.Now().UTC().Format(time.RFC3339Nano),
	}
	req, err := c.newService(http.MethodPost, "/rest/v1/devices?on_conflict=user_id,expo_push_token", body)
	if err != nil {
		return err
	}
	req.Header.Set("Prefer", "resolution=merge-duplicates,return=minimal")
	return c.decode(req, nil)
}

func (c *Client) DeleteDevice(userID, token string) error {
	path := "/rest/v1/devices?user_id=eq." + url.QueryEscape(userID) + "&expo_push_token=eq." + url.QueryEscape(token)
	req, err := c.newService(http.MethodDelete, path, nil)
	if err != nil {
		return err
	}
	return c.decode(req, nil)
}

func (c *Client) DevicesForUser(userID string) ([]Device, error) {
	return query[Device](c, "/rest/v1/devices?user_id=eq."+url.QueryEscape(userID)+"&select=id,user_id,expo_push_token,platform")
}

func query[T any](c *Client, path string) ([]T, error) {
	req, err := c.newService(http.MethodGet, path, nil)
	if err != nil {
		return nil, err
	}
	var rows []T
	if err := c.decode(req, &rows); err != nil {
		return nil, err
	}
	return rows, nil
}

func mutate[T any](c *Client, method, path string, body any) (*T, error) {
	req, err := c.newService(method, path, body)
	if err != nil {
		return nil, err
	}
	req.Header.Set("Prefer", "return=representation")
	var out T
	if err := c.decode(req, &out); err != nil {
		return nil, err
	}
	return &out, nil
}

func (c *Client) newService(method, path string, body any) (*http.Request, error) {
	var reader io.Reader
	if body != nil {
		payload, err := json.Marshal(body)
		if err != nil {
			return nil, err
		}
		reader = bytes.NewReader(payload)
	}
	req, err := http.NewRequest(method, c.baseURL+path, reader)
	if err != nil {
		return nil, err
	}
	req.Header.Set("apikey", c.anonKey)
	if c.Privileged() {
		req.Header.Set("apikey", c.serviceKey)
		req.Header.Set("Authorization", "Bearer "+c.serviceKey)
	} else if c.userToken != "" {
		req.Header.Set("Authorization", "Bearer "+c.userToken)
	} else {
		req.Header.Set("Authorization", "Bearer "+c.anonKey)
	}
	req.Header.Set("Content-Type", "application/json")
	return req, nil
}

func (c *Client) decode(req *http.Request, dest any) error {
	resp, err := c.http.Do(req)
	if err != nil {
		return err
	}
	defer resp.Body.Close()
	raw, err := io.ReadAll(resp.Body)
	if err != nil {
		return err
	}
	if resp.StatusCode >= 300 {
		return fmt.Errorf("supabase %s %s: %d %s", req.Method, req.URL.Path, resp.StatusCode, strings.TrimSpace(string(raw)))
	}
	if dest == nil || len(raw) == 0 {
		return nil
	}
	return json.Unmarshal(raw, dest)
}
