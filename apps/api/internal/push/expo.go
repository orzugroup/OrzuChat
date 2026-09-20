package push

import (
	"bytes"
	"encoding/json"
	"fmt"
	"io"
	"log"
	"net/http"
	"strings"
	"time"
)

// Message is one Expo push request. See https://docs.expo.dev/push-notifications/sending-notifications/
type Message struct {
	To         string         `json:"to"`
	Title      string         `json:"title"`
	Body       string         `json:"body"`
	Sound      string         `json:"sound,omitempty"`
	Priority   string         `json:"priority,omitempty"`
	ChannelID  string         `json:"channelId,omitempty"`
	CategoryID string         `json:"categoryId,omitempty"`
	TTL               int            `json:"ttl,omitempty"`
	Badge             *int           `json:"badge,omitempty"`
	InterruptionLevel string         `json:"interruptionLevel,omitempty"`
	ContentAvailable  bool           `json:"_contentAvailable,omitempty"`
	MutableContent    bool           `json:"mutableContent,omitempty"`
	Data              map[string]any `json:"data,omitempty"`
}

const (
	ChannelMessages      = "messages"
	ChannelCalls         = "calls_v2"
	CategoryIncomingCall = "incoming_call"
)

// ticket is one entry of the Expo response, in the same order as the request.
type ticket struct {
	Status  string `json:"status"`
	Message string `json:"message"`
	Details struct {
		Error string `json:"error"`
	} `json:"details"`
}

// SendExpo delivers the batch and returns the tokens Expo rejected as dead
// ("DeviceNotRegistered"), so the caller can drop them from the database.
// Other per-message failures — most importantly "InvalidCredentials", which is
// what a project without FCM credentials gets — are logged: the HTTP call
// succeeds even when every single push is refused, so silence here looks
// exactly like a working setup.
func SendExpo(messages []Message) ([]string, error) {
	if len(messages) == 0 {
		return nil, nil
	}

	var dead []string
	// Expo accepts up to 100 messages per request.
	for start := 0; start < len(messages); start += 100 {
		end := start + 100
		if end > len(messages) {
			end = len(messages)
		}
		batch := messages[start:end]
		tickets, err := sendBatch(batch)
		if err != nil {
			tickets, err = sendBatch(batch)
			if err != nil {
				return dead, err
			}
		}
		ok, fail := 0, 0
		for i, item := range tickets {
			if item.Status == "ok" {
				ok++
				continue
			}
			fail++
			if i >= len(batch) {
				continue
			}
			log.Printf("expo push rejected (%s): %s", item.Details.Error, item.Message)
			if item.Details.Error == "DeviceNotRegistered" {
				dead = append(dead, batch[i].To)
			}
		}
		log.Printf("expo push batch: %d ok, %d failed", ok, fail)
	}
	return dead, nil
}

func sendBatch(messages []Message) ([]ticket, error) {
	payload, err := json.Marshal(messages)
	if err != nil {
		return nil, err
	}

	client := &http.Client{Timeout: 10 * time.Second}
	req, err := http.NewRequest(http.MethodPost, "https://exp.host/--/api/v2/push/send", bytes.NewReader(payload))
	if err != nil {
		return nil, err
	}
	req.Header.Set("Content-Type", "application/json")
	req.Header.Set("Accept", "application/json")

	resp, err := client.Do(req)
	if err != nil {
		return nil, err
	}
	defer resp.Body.Close()
	if resp.StatusCode >= 300 {
		body, _ := io.ReadAll(io.LimitReader(resp.Body, 2048))
		return nil, fmt.Errorf("expo push status %d: %s", resp.StatusCode, strings.TrimSpace(string(body)))
	}

	var parsed struct {
		Data   []ticket `json:"data"`
		Errors []struct {
			Message string `json:"message"`
		} `json:"errors"`
	}
	if err := json.NewDecoder(resp.Body).Decode(&parsed); err != nil {
		return nil, err
	}
	for _, item := range parsed.Errors {
		log.Printf("expo push error: %s", item.Message)
	}
	return parsed.Data, nil
}
