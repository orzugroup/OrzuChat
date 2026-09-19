import { Image, StyleSheet, Text, View } from 'react-native';

import { initials } from '@/lib/format';
import { colors } from '@/lib/theme';

type Props = {
  name: string;
  uri?: string | null;
  size?: number;
  online?: boolean;
};

export function Avatar({ name, uri, size = 48, online }: Props) {
  return (
    <View style={{ width: size, height: size }}>
      {uri ? (
        <Image source={{ uri }} style={[styles.image, { width: size, height: size, borderRadius: size / 2 }]} />
      ) : (
        <View
          style={[
            styles.fallback,
            { width: size, height: size, borderRadius: size / 2 },
          ]}
        >
          <Text style={[styles.initials, { fontSize: size * 0.36 }]}>{initials(name)}</Text>
        </View>
      )}
      {online ? <View style={[styles.dot, { width: size * 0.28, height: size * 0.28, borderRadius: size * 0.14 }]} /> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  image: { backgroundColor: colors.surfaceAlt },
  fallback: {
    backgroundColor: colors.accentMuted,
    alignItems: 'center',
    justifyContent: 'center',
  },
  initials: { color: colors.text, fontWeight: '700' },
  dot: {
    position: 'absolute',
    right: 0,
    bottom: 0,
    backgroundColor: colors.online,
    borderWidth: 2,
    borderColor: colors.bg,
  },
});
