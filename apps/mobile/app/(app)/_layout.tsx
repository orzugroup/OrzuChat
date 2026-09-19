import { Redirect, Stack } from 'expo-router';
import { useEffect } from 'react';

import { IncomingCallModal } from '@/components/IncomingCallModal';
import { usePresenceHeartbeat } from '@/hooks/usePresenceHeartbeat';
import { usePushRegistration } from '@/hooks/usePushRegistration';
import { setAppSwitcherProtection } from '@/hooks/useScreenProtection';
import { colors } from '@/lib/theme';
import { useAuth } from '@/providers/AuthProvider';

export const unstable_settings = {
  initialRouteName: '(tabs)',
};

export default function AppLayout() {
  const { session, screenProtection } = useAuth();
  usePresenceHeartbeat();
  usePushRegistration();

  useEffect(() => {
    void setAppSwitcherProtection(screenProtection);
  }, [screenProtection]);

  if (!session) {
    return <Redirect href="/(auth)/sign-in" />;
  }

  return (
    <>
      <Stack
        screenOptions={{
          headerStyle: { backgroundColor: colors.surface },
          headerShadowVisible: false,
          headerTintColor: colors.text,
          headerTitleStyle: { fontWeight: '700' },
          headerBackButtonDisplayMode: 'minimal',
          contentStyle: { backgroundColor: colors.bg },
        }}
      >
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
        <Stack.Screen name="chat/[id]" options={{ title: 'Чат' }} />
        <Stack.Screen name="profile/[id]" options={{ title: 'Профиль' }} />
        <Stack.Screen name="call/[id]" options={{ title: 'Звонок', headerShown: false, gestureEnabled: false }} />
        <Stack.Screen name="new-chat" options={{ title: 'Новый чат' }} />
      </Stack>
      <IncomingCallModal />
    </>
  );
}
