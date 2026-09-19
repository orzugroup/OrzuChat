# OrzuChat

Мобильный мессенджер: 1:1 чат, голос/фото/видео/файлы, аудио- и видеозвонки внутри приложения.

Стек: Expo, Supabase, Go API, LiveKit на Hetzner.

## Структура

- `apps/mobile` — Expo (React Native)
- `apps/api` — Go: LiveKit-токены, сигнализация звонка, push, presence
- `supabase/migrations` — схема, RLS, Storage
- `infra/hetzner` — Docker Compose: LiveKit, API, Redis, Caddy

Не используйте проект Supabase `orzuai` / OrzuX. Создайте отдельный проект OrzuChat.

## 1. Supabase

```bash
npx supabase login
npx supabase link --project-ref YOUR_ORZUCHAT_REF
npx supabase db push
```

В Dashboard:

- Authentication → Providers: Email, Google, Phone
- Google: Client ID / Secret из Google Cloud, redirect `https://YOUR_PROJECT.supabase.co/auth/v1/callback`
- Phone: SMS-провайдер (Twilio и т.п.)
- Redirect URLs: `orzuchat://`, `exp://`, `http://localhost:8081`

## 2. Мобильное приложение

```bash
cd apps/mobile
copy .env.example .env
# заполните URL и anon key
npx expo start
```

Звонки LiveKit **не работают в Expo Go**. Нужна development-сборка:

```bash
npm i -g eas-cli
cd apps/mobile
eas login
eas build --profile development --platform android
```

## 3. Hetzner

На VPS:

```bash
cd infra/hetzner
cp .env.example .env
# LIVEKIT_URL=wss://rtc.YOUR_DOMAIN
docker compose up -d --build
```

Откройте 80/443, 7880/7881 и UDP 50000-50100 (на проде лучше 50000-60000).

## Auth

- Email + пароль
- Google OAuth (браузерный flow)
- Телефон: SMS OTP

## Звонки

Клиент → Go `/v1/calls` → LiveKit room + push callee → accept → оба в комнате.

Найденный Docker FreeSWITCH (`OrzuX/apps/freeswitch`) — SIP на городские номера. В v1 не подключён.
