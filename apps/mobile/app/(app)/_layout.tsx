import { Redirect, Stack } from 'expo-router';
import { useEffect } from 'react';

import { IncomingCallOverlay } from '@/components/IncomingCallModal';
import { UpdateBanner } from '@/components/UpdateBanner';
import { useAppBadge } from '@/hooks/useAppBadge';
import { usePresenceHeartbeat } from '@/hooks/usePresenceHeartbeat';
import { usePushRegistration } from '@/hooks/usePushRegistration';
import { setAppSwitcherProtection, useScreenProtection } from '@/hooks/useScreenProtection';
import { t } from '@/lib/i18n';
import { useAuth } from '@/providers/AuthProvider';
import { useTheme } from '@/providers/ThemeProvider';

export const unstable_settings = {
  initialRouteName: '(tabs)',
};

export default function AppLayout() {
  const { session, screenProtection } = useAuth();
  const { colors } = useTheme();
  usePresenceHeartbeat();
  usePushRegistration();
  useAppBadge();

  // App-wide (not per-screen) so there is no unprotected frame during navigation
  // transitions, and chat previews / calls / dialogs are all covered by one FLAG_SECURE window.
  useScreenProtection(screenProtection, 'orzuchat-app');

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
        <Stack.Screen name="chat/[id]" options={{ title: t('common.chat') }} />
        <Stack.Screen name="profile/[id]" options={{ title: t('tabs.profile') }} />
        <Stack.Screen name="incoming" options={{ headerShown: false, animation: 'none' }} />
        <Stack.Screen name="call/[id]" options={{ title: t('call.title'), headerShown: false, gestureEnabled: false }} />
        <Stack.Screen name="new-chat" options={{ title: t('newChat.title') }} />
        <Stack.Screen name="new-room" options={{ title: t('rooms.create') }} />
        <Stack.Screen name="room/[id]/index" options={{ title: t('rooms.info') }} />
        <Stack.Screen name="room/[id]/add" options={{ title: t('rooms.addMembers') }} />
        <Stack.Screen name="room-call/[id]" options={{ title: t('rooms.call'), headerShown: false, gestureEnabled: false }} />
        <Stack.Screen name="add-contact" options={{ title: t('contacts.addByPhone') }} />
        <Stack.Screen name="favorites" options={{ title: t('favorites.title') }} />
        <Stack.Screen name="settings" options={{ headerShown: false }} />
      </Stack>
      <UpdateBanner />
      <IncomingCallOverlay />
    </>
  );
}
