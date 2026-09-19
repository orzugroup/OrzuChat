FROM golang:1.23-alpine AS build
WORKDIR /src
COPY go.mod ./
COPY . .
RUN go mod tidy && CGO_ENABLED=0 GOOS=linux go build -o /out/orzu-chat-api ./cmd/server

FROM alpine:3.21
RUN apk add --no-cache ca-certificates
WORKDIR /app
COPY --from=build /out/orzu-chat-api /usr/local/bin/orzu-chat-api
EXPOSE 8080
CMD ["orzu-chat-api"]
