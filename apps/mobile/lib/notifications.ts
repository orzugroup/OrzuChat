import { isRunningInExpoGo } from 'expo';
import { AppState, Platform } from 'react-native';

import { t } from '@/lib/i18n';
import { RINGTONES, callChannelId, restoreRingtone } from '@/lib/ringtones';

type NotificationsModule = typeof import('expo-notifications');

export const CHANNEL_MESSAGES = 'messages';
/** New id so existing installs pick up the long ringtone (Android never updates a channel's sound). */
export const CHANNEL_CALLS = 'calls_v2';
export const CATEGORY_INCOMING_CALL = 'incoming_call';
export const ACTION_ANSWER = 'answer';
export const ACTION_DECLINE = 'decline';

export type PushData = {
  type?: 'message' | 'incoming_call' | 'call_ended' | 'room_call';
  conversation_id?: string;
  message_id?: string;
  call_id?: string;
  room_call_id?: string;
  kind?: 'audio' | 'video';
  sender_id?: string;
  caller_id?: string;
};

export function isTestIncomingCall(callId?: string, callerId?: string): boolean {
  return Boolean(callId?.startsWith('test-') || callerId === 'script');
}

let activeConversationId: string | null = null;

/** The chat currently on screen — pushes for it are silenced while the app is in the foreground. */
export function setActiveConversation(id: string | null): void {
  activeConversationId = id;
}

export function getActiveConversation(): string | null {
  return activeConversationId;
}

/** Launcher badge (iOS always; Android on launchers that honor notification badges). */
export async function setAppBadge(count: number): Promise<void> {
  const Notifications = await loadNotifications();
  if (!Notifications) return;
  try {
    await Notifications.setBadgeCountAsync(Math.max(0, Math.floor(count)));
  } catch {
    // web / denied
  }
}

const recentlyNotified = new Set<string>();

function markNotified(messageId: string): void {
  recentlyNotified.add(messageId);
  setTimeout(() => recentlyNotified.delete(messageId), 20000);
}

function alreadyNotified(messageId?: string): boolean {
  return Boolean(messageId && recentlyNotified.has(messageId));
}

/**
 * Immediate local shade (trigger: null). Do not mark the message id before
 * the handler runs — that hid the banner on Android.
 */
async function scheduleLocal(input: {
  identifier: string;
  title: string;
  body: string;
  badge?: number;
  data: PushData;
}): Promise<boolean> {
  const Notifications = await configureNotifications();
  if (!Notifications) return false;
  try {
    const permission = await Notifications.getPermissionsAsync();
    if (permission.status !== 'granted') {
      const asked = await Notifications.requestPermissionsAsync();
      if (asked.status !== 'granted') return false;
    }
    await Notifications.scheduleNotificationAsync({
      identifier: input.identifier,
      content: {
        title: input.title,
        body: input.body,
        sound: 'default',
        badge: input.badge,
        data: input.data,
        ...(Platform.OS === 'android' ? { channelId: CHANNEL_MESSAGES } : {}),
      },
      trigger: null,
    });
    return true;
  } catch {
    return false;
  }
}

/** Status-bar + shade notification for a new chat message (and Android icon dot). */
export async function presentIncomingMessage(input: {
  conversationId: string;
  messageId?: string;
  senderId?: string;
  title: string;
  body: string;
  badge: number;
}): Promise<void> {
  if (input.conversationId === activeConversationId) return;
  if (alreadyNotified(input.messageId)) return;
  await scheduleLocal({
    identifier: `msg:${input.conversationId}`,
    title: input.title,
    body: input.body,
    badge: Math.max(1, input.badge),
    data: {
      type: 'message',
      conversation_id: input.conversationId,
      message_id: input.messageId,
      sender_id: input.senderId,
    },
  });
}

/** Settings → Notifications: prove the shade/channel path without FCM. */
export async function presentTestNotification(): Promise<boolean> {
  return scheduleLocal({
    identifier: `test:${Date.now()}`,
    title: t('notif.testTitle'),
    body: t('notif.testBody'),
    badge: 1,
    data: { type: 'message' },
  });
}

/** Permission + Android channels at boot, the way OrzuGo calls `initNotifications`. */
export async function initNotifications(): Promise<void> {
  await configureNotifications();
  const Notifications = await loadNotifications();
  if (!Notifications) return;
  try {
    const existing = await Notifications.getPermissionsAsync();
    if (existing.status !== 'granted') {
      await Notifications.requestPermissionsAsync();
    }
  } catch {
    // web / denied
  }
}

function deviceNotificationsSupported(): boolean {
  return Platform.OS === 'ios' || Platform.OS === 'android';
}

export function pushSupported(): boolean {
  if (!deviceNotificationsSupported()) return false;
  if (isRunningInExpoGo()) return false;
  return true;
}

/**
 * Registration is a long chain (permission → FCM/APNs token → Expo token → API)
 * and every step can fail silently on a real device. The result is kept here so
 * Settings → Notifications can tell the user which step broke.
 */
export type PushState = {
  stage: 'idle' | 'working' | 'ready' | 'failed' | 'unsupported';
  permission: 'unknown' | 'granted' | 'denied' | 'undetermined';
  token: string | null;
  error: string | null;
};

let pushState: PushState = {
  stage: pushSupported() ? 'idle' : 'unsupported',
  permission: 'unknown',
  token: null,
  error: null,
};

const pushListeners = new Set<() => void>();

export function getPushState(): PushState {
  return pushState;
}

export function setPushState(patch: Partial<PushState>): void {
  pushState = { ...pushState, ...patch };
  for (const listener of pushListeners) listener();
}

export function subscribePushState(listener: () => void): () => void {
  pushListeners.add(listener);
  return () => {
    pushListeners.delete(listener);
  };
}

let modulePromise: Promise<NotificationsModule | null> | null = null;

/** Lazily loads expo-notifications. Local shade alerts work in Expo Go; FCM does not. */
export function loadNotifications(): Promise<NotificationsModule | null> {
  if (!deviceNotificationsSupported()) return Promise.resolve(null);
  if (!modulePromise) {
    modulePromise = import('expo-notifications').catch(() => null);
  }
  return modulePromise;
}

let configured = false;

/** Handler, Android channels and the incoming-call action category. Safe to call repeatedly. */
export async function configureNotifications(): Promise<NotificationsModule | null> {
  const Notifications = await loadNotifications();
  if (!Notifications || configured) return Notifications;
  configured = true;

  Notifications.setNotificationHandler({
    handleNotification: async (notification) => {
      const data = (notification.request.content.data ?? {}) as PushData;
      const foreground = AppState.currentState === 'active';
      const messageId = data.message_id;
      // Only hide a duplicate FCM after the shade already showed, or the chat
      // / incoming overlay that is already on screen. Never pre-mark.
      const silenced =
        alreadyNotified(messageId) ||
        (foreground && data.type === 'message' && data.conversation_id === activeConversationId) ||
        (foreground && (data.type === 'incoming_call' || data.type === 'call_ended'));
      if (data.type === 'message' && messageId && !silenced) markNotified(messageId);
      return {
        shouldShowAlert: !silenced,
        shouldShowBanner: !silenced,
        shouldShowList: !silenced,
        shouldPlaySound: !silenced,
        shouldSetBadge: true,
      };
    },
  });

  if (Platform.OS === 'android') {
    await Notifications.setNotificationChannelAsync(CHANNEL_MESSAGES, {
      name: t('notif.messagesChannel'),
      importance: Notifications.AndroidImportance.HIGH,
      sound: 'default',
      vibrationPattern: [0, 200, 100, 200],
      lockscreenVisibility: Notifications.AndroidNotificationVisibility.PRIVATE,
      enableVibrate: true,
      showBadge: true,
    }).catch(() => undefined);
    await restoreRingtone();
    const callChannel = {
      name: t('notif.callsChannel'),
      importance: Notifications.AndroidImportance.MAX,
      vibrationPattern: [0, 800, 400, 800, 400, 800, 400, 800],
      lockscreenVisibility: Notifications.AndroidNotificationVisibility.PUBLIC,
      bypassDnd: true,
      enableVibrate: true,
      enableLights: true,
      showBadge: false,
    };
    await Notifications.setNotificationChannelAsync(CHANNEL_CALLS, {
      ...callChannel,
      sound: 'ringtone.wav',
    }).catch(() => undefined);
    for (const item of RINGTONES) {
      await Notifications.setNotificationChannelAsync(callChannelId(item.id), {
        ...callChannel,
        sound: item.file,
      }).catch(() => undefined);
    }
  }

  await Notifications.setNotificationCategoryAsync(CATEGORY_INCOMING_CALL, [
    {
      identifier: ACTION_ANSWER,
      buttonTitle: t('call.answer'),
      options: { opensAppToForeground: true },
    },
    {
      identifier: ACTION_DECLINE,
      buttonTitle: t('call.decline'),
      options: { opensAppToForeground: true, isDestructive: true },
    },
  ]).catch(() => undefined);

  return Notifications;
}

/** Removes delivered notifications for a chat once the user opens it. */
export async function clearConversationNotifications(conversationId: string): Promise<void> {
  const Notifications = await loadNotifications();
  if (!Notifications) return;
  try {
    const presented = await Notifications.getPresentedNotificationsAsync();
    await Promise.all(
      presented
        .filter((item) => (item.request.content.data as PushData | undefined)?.conversation_id === conversationId)
        .map((item) => Notifications.dismissNotificationAsync(item.request.identifier)),
    );
  } catch {
    // not critical
  }
}

/** Removes the ringing notification when a call ends or is answered elsewhere. */
export async function clearCallNotifications(callId?: string): Promise<void> {
  const Notifications = await loadNotifications();
  if (!Notifications) return;
  try {
    const presented = await Notifications.getPresentedNotificationsAsync();
    await Promise.all(
      presented
        .filter((item) => {
          const data = item.request.content.data as PushData | undefined;
          return data?.type === 'incoming_call' && (!callId || data.call_id === callId);
        })
        .map((item) => Notifications.dismissNotificationAsync(item.request.identifier)),
    );
  } catch {
    // not critical
  }
}
