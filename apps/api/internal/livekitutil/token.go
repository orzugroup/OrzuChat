package livekitutil

import (
	"time"

	"github.com/livekit/protocol/auth"
)

func JoinToken(apiKey, apiSecret, room, identity, name string, _ bool) (string, error) {
	canPublish := true
	canSubscribe := true
	canPublishData := true
	token := auth.NewAccessToken(apiKey, apiSecret)
	token.SetVideoGrant(&auth.VideoGrant{
		RoomJoin:       true,
		Room:           room,
		CanPublish:     &canPublish,
		CanSubscribe:   &canSubscribe,
		CanPublishData: &canPublishData,
	}).
		SetIdentity(identity).
		SetName(name).
		SetValidFor(2 * time.Hour)
	return token.ToJWT()
}
