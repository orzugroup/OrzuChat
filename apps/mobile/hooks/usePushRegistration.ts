import { isRunningInExpoGo } from 'expo';
import { router } from 'expo-router';
import { useEffect, useState } from 'react';
import { Platform } from 'react-native';

import { api } from '@/lib/api';
import { useAuth } from '@/providers/AuthProvider';

function canUseRemotePush(): boolean {
  if (Platform.OS === 'web') return false;
  if (isRunningInExpoGo()) return false;
  return true;
}

export function usePushRegistration() {
  const { session } = useAuth();

  useEffect(() => {
    if (!session || !canUseRemotePush()) return;
    let token: string | null = null;
    let cancelled = false;
    let responseSub: { remove: () => void } | null = null;

    (async () => {
      try {
        const Notifications = await import('expo-notifications');
        Notifications.setNotificationHandler({
          handleNotification: async () => ({
            shouldShowAlert: true,
            shouldPlaySound: true,
            shouldSetBadge: true,
            shouldShowBanner: true,
            shouldShowList: true,
          }),
        });
        const Device = await import('expo-device');
        if (!Device.isDevice) return;
        const existing = await Notifications.getPermissionsAsync();
        let status = existing.status;
        if (status !== 'granted') {
          const asked = await Notifications.requestPermissionsAsync();
          status = asked.status;
        }
        if (status !== 'granted' || cancelled) return;
        const expoToken = await Notifications.getExpoPushTokenAsync();
        token = expoToken.data;
        await api.registerDevice(token, Platform.OS);

        responseSub = Notifications.addNotificationResponseReceivedListener((response) => {
          const data = response.notification.request.content.data as {
            type?: string;
            call_id?: string;
          };
          if (data.type === 'incoming_call' && data.call_id) {
            router.push(`/(app)/call/${data.call_id}`);
          }
        });
        if (cancelled) responseSub.remove();
      } catch {
        // Push needs an EAS development/APK build. Chat still works without it.
      }
    })();

    return () => {
      cancelled = true;
      responseSub?.remove();
      if (token) {
        void api.removeDevice(token).catch(() => undefined);
      }
    };
  }, [session]);
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
