#!/usr/bin/env node
/**
 * Sends one Expo/FCM test notification and prints the ticket + receipt.
 *
 *   node scripts/test-push.mjs "ExponentPushToken[...]"
 *   node scripts/test-push.mjs "ExponentPushToken[...]" call
 *
 * Close the APK, then lock the screen, then run. The shade/ringtone proves FCM.
 * Tapping Answer will not start a real LiveKit call — this is only the push path.
 */

const token = process.argv[2]?.trim();
const kind = (process.argv[3] ?? 'message').trim().toLowerCase();

if (!token || !token.includes('ExponentPushToken')) {
  console.error(`Usage:
  node scripts/test-push.mjs "ExponentPushToken[xxxxxxxxxxxxxxxxxxxxxx]"
  node scripts/test-push.mjs "ExponentPushToken[xxxxxxxxxxxxxxxxxxxxxx]" call
`);
  process.exit(1);
}

const callId = `test-${Date.now()}`;
const payload =
  kind === 'call'
    ? {
        to: token,
        title: 'OrzuChat',
        body: 'Incoming video call',
        sound: 'ringtone.wav',
        channelId: 'calls_v2',
        categoryId: 'incoming_call',
        priority: 'high',
        interruptionLevel: 'time-sensitive',
        _contentAvailable: true,
        ttl: 45,
        data: {
          type: 'incoming_call',
          call_id: callId,
          kind: 'video',
          caller_id: 'script',
          title: 'OrzuChat',
          body: 'Incoming video call',
        },
      }
    : {
        to: token,
        title: 'OrzuChat FCM test',
        body: 'If you see this with the app closed, FCM works.',
        sound: 'default',
        channelId: 'messages',
        priority: 'high',
        ttl: 60,
        data: { type: 'message' },
      };

const send = await fetch('https://exp.host/--/api/v2/push/send', {
  method: 'POST',
  headers: { Accept: 'application/json', 'Content-Type': 'application/json' },
  body: JSON.stringify(payload),
});

const sent = await send.json();
const ticket = Array.isArray(sent.data) ? sent.data[0] : sent.data ?? sent;
console.log('ticket:', JSON.stringify(ticket, null, 2));

const ticketId = ticket.id;
if (!ticketId) {
  explain(ticket);
  process.exit(ticket.status === 'ok' ? 0 : 2);
}

await new Promise((r) => setTimeout(r, 2500));

const receipts = await fetch('https://exp.host/--/api/v2/push/getReceipts', {
  method: 'POST',
  headers: { Accept: 'application/json', 'Content-Type': 'application/json' },
  body: JSON.stringify({ ids: [ticketId] }),
});
const body = await receipts.json();
const receipt = body.data?.[ticketId] ?? body;
console.log('receipt:', JSON.stringify(receipt, null, 2));
explain(ticket.status === 'ok' ? receipt : ticket);

function explain(item) {
  const error = item?.details?.error || item?.error;
  if (item?.status === 'ok' && !error) {
    console.log(
      kind === 'call'
        ? '\nOK — tap the incoming notification on the phone. The full-screen Answer / Decline UI must open.'
        : '\nOK — Expo accepted the push. Close the APK: the shade must appear.',
    );
    return;
  }
  if (error === 'InvalidCredentials') {
    console.log('\nFAIL — no FCM V1 key in Expo. Upload the Firebase service-account JSON:');
    console.log('https://expo.dev/accounts/[you]/projects/orzuchat/credentials');
    return;
  }
  if (error === 'DeviceNotRegistered') {
    console.log('\nFAIL — token is dead. Open the APK once so it registers again.');
    return;
  }
  if (error === 'MismatchSenderId') {
    console.log('\nFAIL — Expo FCM key and google-services.json are from different Firebase projects.');
    return;
  }
  console.log('\nFAIL —', error || item?.message || 'unknown');
}
