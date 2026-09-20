import { ImageResponse } from 'next/og';

export const OG_SIZE = { width: 1200, height: 630 };
export const OG_CONTENT_TYPE = 'image/png';

/**
 * Social card rendered with next/og. Deliberately Latin-only: the default
 * Satori font set does not cover Cyrillic, so the Russian pages share the same
 * wordmark-led card rather than rendering tofu boxes.
 */
export function renderOgImage() {
  return new ImageResponse(
    (
      <div
        style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between',
          backgroundColor: '#0A1120',
          padding: '72px 80px',
          position: 'relative',
          fontFamily: 'sans-serif',
        }}
      >
        <div
          style={{
            position: 'absolute',
            top: -260,
            left: -160,
            width: 760,
            height: 760,
            borderRadius: 9999,
            background: 'radial-gradient(circle, rgba(13,87,232,0.55) 0%, rgba(13,87,232,0) 70%)',
            display: 'flex',
          }}
        />
        <div
          style={{
            position: 'absolute',
            bottom: -340,
            right: -220,
            width: 760,
            height: 760,
            borderRadius: 9999,
            background: 'radial-gradient(circle, rgba(0,214,154,0.30) 0%, rgba(0,214,154,0) 70%)',
            display: 'flex',
          }}
        />
        <div
          style={{
            position: 'absolute',
            top: 210,
            right: -60,
            width: 620,
            height: 620,
            borderRadius: 9999,
            background: 'radial-gradient(circle, rgba(18,194,247,0.35) 0%, rgba(18,194,247,0) 70%)',
            display: 'flex',
          }}
        />

        <div style={{ display: 'flex', alignItems: 'center', gap: 22 }}>
          <div
            style={{
              width: 76,
              height: 76,
              borderRadius: 24,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              background: 'linear-gradient(100deg, #0D57E8 0%, #12C2F7 55%, #00D69A 100%)',
            }}
          >
            <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="#FFFFFF" strokeWidth="1.8">
              <rect x="4" y="10" width="16" height="10" rx="3" />
              <path d="M8 10V7a4 4 0 1 1 8 0v3" />
            </svg>
          </div>
          <div style={{ display: 'flex', fontSize: 44, fontWeight: 700, color: '#FFFFFF' }}>OrzuChat</div>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column' }}>
          <div
            style={{
              display: 'flex',
              fontSize: 70,
              fontWeight: 700,
              lineHeight: 1.05,
              color: '#FFFFFF',
              letterSpacing: -2,
              maxWidth: 1040,
            }}
          >
            Private messaging, end to end
          </div>
          <div
            style={{
              display: 'flex',
              marginTop: 26,
              fontSize: 34,
              color: '#8A9BBD',
              maxWidth: 900,
              lineHeight: 1.35,
            }}
          >
            Encrypted chats, Rooms and video calls. Keys never leave your phone.
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', gap: 14 }}>
            {['End-to-end encrypted', 'No ads', '10 languages'].map((chip) => (
              <div
                key={chip}
                style={{
                  display: 'flex',
                  padding: '12px 24px',
                  borderRadius: 9999,
                  border: '1px solid rgba(18,194,247,0.35)',
                  backgroundColor: 'rgba(18,194,247,0.10)',
                  color: '#12C2F7',
                  fontSize: 24,
                  fontWeight: 600,
                }}
              >
                {chip}
              </div>
            ))}
          </div>
          <div style={{ display: 'flex', fontSize: 26, color: '#8A9BBD' }}>orzuchat.com</div>
        </div>
      </div>
    ),
    OG_SIZE,
  );
}
