import Constants from 'expo-constants';
import { router } from 'expo-router';
import { useCallback, useEffect, useRef, useState, useSyncExternalStore } from 'react';
import { Platform } from 'react-native';

import { api } from '@/lib/api';
import { errorMessage } from '@/lib/alert';
import { currentLocale } from '@/lib/i18n';
import { pullConversationMessages } from '@/lib/syncChat';
import {
  ACTION_DECLINE,
  configureNotifications,
  getPushState,
  pushSupported,
  setPushState,
  subscribePushState,
  type PushData,
  type PushState,
} from '@/lib/notifications';
import { useAuth } from '@/providers/AuthProvider';
import { useCall } from '@/providers/CallProvider';

/** EAS project id — `getExpoPushTokenAsync` needs it explicitly in release builds. */
function projectId(): string | undefined {
  const extra = Constants.expoConfig?.extra as { eas?: { projectId?: string } } | undefined;
  return extra?.eas?.projectId ?? Constants.easConfig?.projectId ?? undefined;
}

/**
 * Registers the Expo push token for the signed-in user and routes notification taps:
 *  - message → opens the chat
 *  - incoming call → shows the in-app incoming call screen (or declines)
 */
export function usePushRegistration() {
  const { session } = useAuth();
  const { openIncomingFromPush } = useCall();
  // Keyed on the user id only: a token refresh hands us a new `session` object
  // every hour, and re-running the effect used to unregister the device token
  // milliseconds after registering it again.
  const userId = session?.user.id;
  const incomingRef = useRef(openIncomingFromPush);
  incomingRef.current = openIncomingFromPush;

  useEffect(() => {
    if (!userId) return;
    if (!pushSupported()) {
      setPushState({ stage: 'unsupported', error: null });
      return;
    }
    let token: string | null = null;
    let cancelled = false;
    let responseSub: { remove: () => void } | null = null;
    let receivedSub: { remove: () => void } | null = null;
    let tokenSub: { remove: () => void } | null = null;

    const handleResponse = (data: PushData, actionIdentifier: string) => {
      if (data.type === 'message' && data.conversation_id) {
        router.push({ pathname: '/(app)/chat/[id]', params: { id: data.conversation_id } });
        return;
      }
      if (data.type === 'room_call' && data.conversation_id) {
        // Group calls have no ringing state: land in the room, the banner offers "join".
        router.push({ pathname: '/(app)/chat/[id]', params: { id: data.conversation_id } });
        return;
      }
      if (data.type === 'incoming_call' && data.call_id) {
        void incomingRef.current(data, actionIdentifier === ACTION_DECLINE ? 'decline' : 'open');
      }
    };

    (async () => {
      setPushState({ stage: 'working', error: null });
      try {
        const Notifications = await configureNotifications();
        if (!Notifications) {
          setPushState({ stage: 'unsupported' });
          return;
        }
        const Device = await import('expo-device');
        if (!Device.isDevice) {
          setPushState({ stage: 'unsupported', error: 'emulator' });
          return;
        }

        const existing = await Notifications.getPermissionsAsync();
        let status = existing.status;
        if (status !== 'granted') {
          const asked = await Notifications.requestPermissionsAsync();
          status = asked.status;
        }
        setPushState({ permission: status === 'granted' ? 'granted' : status === 'denied' ? 'denied' : 'undetermined' });
        if (status !== 'granted') {
          setPushState({ stage: 'failed', error: 'permission' });
          return;
        }
        if (cancelled) return;

        // Taps are wired up before the token call: without FCM credentials the
        // token throws, and a device that cannot register should still be able
        // to open a chat from a notification once credentials are fixed.
        responseSub = Notifications.addNotificationResponseReceivedListener((response) => {
          const data = (response.notification.request.content.data ?? {}) as PushData;
          handleResponse(data, response.actionIdentifier);
        });

        // App in background but JS still alive: open the in-app incoming screen
        // so the looping ringtone takes over from the notification sound.
        receivedSub = Notifications.addNotificationReceivedListener((notification) => {
          const data = (notification.request.content.data ?? {}) as PushData;
          if (data.type === 'incoming_call' && data.call_id) {
            void incomingRef.current(data, 'open');
          }
          if (data.type === 'message' && data.conversation_id && userId) {
            void pullConversationMessages(userId, data.conversation_id);
          }
        });

        // Cold start from a notification tap.
        const last = Notifications.getLastNotificationResponse();
        if (last) {
          handleResponse((last.notification.request.content.data ?? {}) as PushData, last.actionIdentifier);
          Notifications.clearLastNotificationResponse();
        }
        if (cancelled) {
          responseSub.remove();
          receivedSub?.remove();
          return;
        }

        const register = async (value: string) => {
          token = value;
          await api.registerDevice(value, Platform.OS, currentLocale());
          if (!cancelled) setPushState({ stage: 'ready', token: value, error: null });
        };

        const expoToken = await Notifications.getExpoPushTokenAsync({ projectId: projectId() });
        await register(expoToken.data);

        // Expo rotates the token after a reinstall or an FCM refresh.
        tokenSub = Notifications.addPushTokenListener((next) => {
          if (next.data && next.data !== token) void register(next.data).catch(() => undefined);
        });
      } catch (error) {
        if (!cancelled) setPushState({ stage: 'failed', error: errorMessage(error, 'unknown') });
      }
    })();

    return () => {
      cancelled = true;
      responseSub?.remove();
      receivedSub?.remove();
      tokenSub?.remove();
      // Keep the row in `devices`. Unregistering here ran when Android killed
      // the activity (user swiped the app away) and the phone went silent
      // until the next open — the opposite of WhatsApp-style background push.
    };
  }, [userId]);
}

/** Live push registration state for the Settings → Notifications screen. */
export function usePushState(): PushState {
  return useSyncExternalStore(subscribePushState, getPushState, getPushState);
}

/** Retries registration after the user fixes permissions in system settings. */
export function useRetryPushRegistration(): () => Promise<void> {
  return useCallback(async () => {
    setPushState({ stage: 'working', error: null });
    try {
      const Notifications = await configureNotifications();
      if (!Notifications) {
        setPushState({ stage: 'unsupported' });
        return;
      }
      const asked = await Notifications.requestPermissionsAsync();
      setPushState({ permission: asked.status === 'granted' ? 'granted' : 'denied' });
      if (asked.status !== 'granted') {
        setPushState({ stage: 'failed', error: 'permission' });
        return;
      }
      const expoToken = await Notifications.getExpoPushTokenAsync({ projectId: projectId() });
      await api.registerDevice(expoToken.data, Platform.OS, currentLocale());
      setPushState({ stage: 'ready', token: expoToken.data, error: null });
    } catch (error) {
      setPushState({ stage: 'failed', error: errorMessage(error, 'unknown') });
    }
  }, []);
}

export function useOnlineMap(userIds: string[]) {
  const [online, setOnline] = useState<Record<string, boolean>>({});
  const key = userIds.slice().sort().join(',');

  useEffect(() => {
    if (!key) {
      setOnline({});
      return;
    }
    let cancelled = false;
    const load = () => {
      void api
        .presence(key.split(','))
        .then((result) => {
          if (!cancelled) setOnline(result.online);
        })
        .catch(() => undefined);
    };
    load();
    const interval = setInterval(load, 20000);
    return () => {
      cancelled = true;
      clearInterval(interval);
    };
  }, [key]);

  return online;
}
