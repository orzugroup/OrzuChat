import { LinearGradient } from 'expo-linear-gradient';
import { Image, StyleSheet, Text, View } from 'react-native';

import { colors, gradients } from '@/lib/theme';

const logo = require('../assets/images/logo.png');

type Props = {
  size?: number;
  /** Show the "OrzuChat" wordmark next to the mark. */
  withName?: boolean;
  nameSize?: number;
};

/** App logo inside a brand-gradient ring. */
export function BrandLogo({ size = 40, withName = false, nameSize }: Props) {
  const ring = Math.max(2, Math.round(size * 0.06));
  return (
    <View style={styles.row}>
      <LinearGradient
        colors={[...gradients.brand]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={{ width: size, height: size, borderRadius: size / 2, padding: ring }}
      >
        <Image
          source={logo}
          style={{ width: size - ring * 2, height: size - ring * 2, borderRadius: (size - ring * 2) / 2 }}
          resizeMode="cover"
        />
      </LinearGradient>
      {withName ? (
        <Text style={[styles.name, { fontSize: nameSize ?? Math.round(size * 0.55) }]}>
          Orzu<Text style={styles.nameAccent}>Chat</Text>
        </Text>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  name: { color: colors.text, fontWeight: '800', letterSpacing: 0.2 },
  nameAccent: { color: colors.accentCyan },
});
