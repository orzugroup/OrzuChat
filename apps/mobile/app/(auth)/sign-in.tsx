import { LinearGradient } from 'expo-linear-gradient';
import { useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { AppIcon } from '@/components/AppIcon';
import { BrandLogo } from '@/components/BrandLogo';
import { toE164Hint } from '@/lib/phone';
import { supabase } from '@/lib/supabase';
import { colors, gradients } from '@/lib/theme';
import { useAuth } from '@/providers/AuthProvider';

export default function SignInScreen() {
  const { configured } = useAuth();
  const insets = useSafeAreaInsets();
  const [phone, setPhone] = useState('');
  const [otp, setOtp] = useState('');
  const [sent, setSent] = useState(false);
  const [busy, setBusy] = useState(false);

  const normalized = toE164Hint(phone);

  const sendCode = async () => {
    if (!normalized || normalized.length < 8) {
      Alert.alert('Телефон', 'Введите номер с кодом страны, например +992...');
      return;
    }
    setBusy(true);
    const { error } = await supabase.auth.signInWithOtp({ phone: normalized });
    setBusy(false);
    if (error) {
      Alert.alert('SMS', error.message);
      return;
    }
    setSent(true);
  };

  const verify = async () => {
    if (otp.trim().length < 4) {
      Alert.alert('Код', 'Введите код из SMS');
      return;
    }
    setBusy(true);
    const { error } = await supabase.auth.verifyOtp({
      phone: normalized,
      token: otp.trim(),
      type: 'sms',
    });
    setBusy(false);
    if (error) Alert.alert('Код', error.message);
  };

  return (
    <KeyboardAvoidingView style={styles.screen} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <ScrollView
        contentContainerStyle={[styles.content, { paddingTop: insets.top + 48, paddingBottom: insets.bottom + 24 }]}
        keyboardShouldPersistTaps="handled"
      >
        <LinearGradient
          colors={[...gradients.brandSoft, 'transparent']}
          start={{ x: 0.5, y: 0 }}
          end={{ x: 0.5, y: 1 }}
          style={styles.glow}
        />
        <View style={styles.hero}>
          <BrandLogo size={104} />
          <Text style={styles.brand}>
            Orzu<Text style={styles.brandAccent}>Chat</Text>
          </Text>
          <Text style={styles.lead}>Личные сообщения и звонки со сквозным шифрованием</Text>
        </View>

        <View style={styles.card}>
          <Text style={styles.cardTitle}>{sent ? 'Код из SMS' : 'Вход по номеру телефона'}</Text>
          {!configured ? (
            <Text style={styles.warn}>
              Задайте EXPO_PUBLIC_SUPABASE_URL и EXPO_PUBLIC_SUPABASE_ANON_KEY в apps/mobile/.env
            </Text>
          ) : null}

          <View style={styles.inputWrap}>
            <AppIcon ios="phone.fill" android="call" color={colors.muted} size={18} />
            <TextInput
              value={phone}
              onChangeText={setPhone}
              keyboardType="phone-pad"
              placeholder="+992 900 000 000"
              placeholderTextColor={colors.muted}
              style={styles.input}
              editable={!busy && !sent}
              autoComplete="tel"
            />
          </View>

          {sent ? (
            <View style={styles.inputWrap}>
              <AppIcon ios="lock.fill" android="lock" color={colors.muted} size={18} />
              <TextInput
                value={otp}
                onChangeText={setOtp}
                keyboardType="number-pad"
                placeholder="Код подтверждения"
                placeholderTextColor={colors.muted}
                style={styles.input}
                editable={!busy}
                autoComplete="one-time-code"
                autoFocus
              />
            </View>
          ) : null}

          <Pressable
            style={({ pressed }) => [styles.primary, pressed && styles.primaryPressed]}
            onPress={() => void (sent ? verify() : sendCode())}
            disabled={busy}
          >
            <LinearGradient colors={[...gradients.brand]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={styles.primaryInner}>
              {busy ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <Text style={styles.primaryText}>{sent ? 'Подтвердить' : 'Получить код'}</Text>
              )}
            </LinearGradient>
          </Pressable>

          {sent ? (
            <Pressable
              onPress={() => {
                setSent(false);
                setOtp('');
              }}
            >
              <Text style={styles.link}>Изменить номер</Text>
            </Pressable>
          ) : null}
        </View>

        <View style={styles.footer}>
          <AppIcon ios="lock.shield.fill" android="shield" color={colors.accentAlt} size={16} />
          <Text style={styles.footerText}>Ключи шифрования создаются на вашем устройстве и никуда не отправляются.</Text>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.bg },
  content: { flexGrow: 1, paddingHorizontal: 20, justifyContent: 'center' },
  glow: { position: 'absolute', top: 0, left: 0, right: 0, height: 360, opacity: 0.55, pointerEvents: 'none' },
  hero: { alignItems: 'center', marginBottom: 28, gap: 12 },
  brand: { color: colors.text, fontSize: 34, fontWeight: '800', letterSpacing: 0.3 },
  brandAccent: { color: colors.accentCyan },
  lead: { color: colors.muted, textAlign: 'center', fontSize: 15, lineHeight: 21, paddingHorizontal: 16 },
  card: {
    width: '100%',
    maxWidth: 460,
    alignSelf: 'center',
    backgroundColor: colors.card,
    borderRadius: 20,
    padding: 20,
    gap: 12,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.border,
  },
  cardTitle: { color: colors.text, fontSize: 18, fontWeight: '700', marginBottom: 4 },
  warn: { color: colors.danger, textAlign: 'center' },
  inputWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    backgroundColor: colors.surfaceAlt,
    borderRadius: 14,
    paddingHorizontal: 14,
  },
  input: { flex: 1, color: colors.text, paddingVertical: 14, fontSize: 17 },
  primary: { borderRadius: 14, overflow: 'hidden', marginTop: 4 },
  primaryPressed: { opacity: 0.85 },
  primaryInner: { paddingVertical: 15, alignItems: 'center', justifyContent: 'center' },
  primaryText: { color: '#fff', fontWeight: '800', fontSize: 16 },
  link: { color: colors.accentCyan, textAlign: 'center', marginTop: 8, fontSize: 15, fontWeight: '600' },
  footer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 24,
    paddingHorizontal: 8,
    width: '100%',
    maxWidth: 460,
    alignSelf: 'center',
  },
  footerText: { color: colors.muted, fontSize: 12, flex: 1, lineHeight: 17 },
});
