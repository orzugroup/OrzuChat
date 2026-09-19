import { SymbolView } from 'expo-symbols';
import { Tabs } from 'expo-router';
import { StyleSheet, View } from 'react-native';

import { BrandLogo } from '@/components/BrandLogo';
import { colors } from '@/lib/theme';

export default function TabsLayout() {
  return (
    <Tabs
      screenOptions={{
        headerStyle: { backgroundColor: colors.surface },
        headerShadowVisible: false,
        headerTintColor: colors.text,
        headerTitleStyle: { fontWeight: '700' },
        tabBarStyle: { backgroundColor: colors.surface, borderTopColor: colors.border },
        tabBarActiveTintColor: colors.accentCyan,
        tabBarInactiveTintColor: colors.muted,
        tabBarLabelStyle: { fontWeight: '600' },
        sceneStyle: { backgroundColor: colors.bg },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: 'Чаты',
          headerTitle: () => (
            <View style={styles.brand}>
              <BrandLogo size={30} withName nameSize={20} />
            </View>
          ),
          tabBarIcon: ({ color }) => (
            <SymbolView name={{ ios: 'bubble.left.and.bubble.right.fill', android: 'chat', web: 'chat' }} tintColor={color} size={24} />
          ),
        }}
      />
      <Tabs.Screen
        name="contacts"
        options={{
          title: 'Контакты',
          tabBarIcon: ({ color }) => (
            <SymbolView name={{ ios: 'person.2.fill', android: 'group', web: 'group' }} tintColor={color} size={24} />
          ),
        }}
      />
      <Tabs.Screen
        name="settings"
        options={{
          title: 'Профиль',
          tabBarIcon: ({ color }) => (
            <SymbolView name={{ ios: 'person.crop.circle.fill', android: 'person', web: 'person' }} tintColor={color} size={24} />
          ),
        }}
      />
    </Tabs>
  );
}

const styles = StyleSheet.create({
  brand: { paddingVertical: 2 },
});
