import { useEffect, useState } from 'react';
import { Image, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';

import type { RootStackParamList } from '../../navigation/AppNavigator';
import arthumWordmark from '../../assets/images/arthum-wordmark.png';
import PrimaryButton from '../../components/common/PrimaryButton';
import { resendVerificationEmail } from '../../services/authApi';

type Props = NativeStackScreenProps<RootStackParamList, 'EmailVerification'>;

const RESEND_COOLDOWN_SECONDS = 30;

function EmailVerificationScreen({ navigation, route }: Props) {
  const { email } = route.params;

  const [resending, setResending] = useState(false);
  const [cooldown, setCooldown] = useState(0);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    if (cooldown <= 0) {
      return;
    }
    const timer = setTimeout(() => setCooldown(c => c - 1), 1000);
    return () => clearTimeout(timer);
  }, [cooldown]);

  const handleResend = async () => {
    if (resending || cooldown > 0) {
      return;
    }
    setMessage('');
    setError('');
    setResending(true);
    try {
      const response = await resendVerificationEmail(email);
      setMessage(response.toastMessage || response.message || 'Verification email sent.');
      setCooldown(RESEND_COOLDOWN_SECONDS);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not resend the email. Please try again.');
    } finally {
      setResending(false);
    }
  };

  const resendDisabled = resending || cooldown > 0;

  return (
    <SafeAreaView style={s.safe}>
      <ScrollView contentContainerStyle={s.scroll} showsVerticalScrollIndicator={false}>
        <View style={s.wordmarkRow}>
          <Image source={arthumWordmark} resizeMode="contain" style={s.wordmark} accessibilityLabel="Arthum AI" />
        </View>

        <View style={s.header}>
          <Text style={s.title}>Verify your email</Text>
          <Text style={s.subtitle}>
            We sent a verification link to
          </Text>
          <Text style={s.email}>{email}</Text>
          <Text style={s.subtitle}>
            Open the link in that email, then come back here to sign in. The link expires after a while, so verify soon.
          </Text>
        </View>

        {!!message && <Text style={s.success}>{message}</Text>}
        {!!error && <Text style={s.error}>{error}</Text>}

        <PrimaryButton title="Go to Login" onPress={() => navigation.navigate('Login')} />

        <Pressable
          style={[s.resendButton, resendDisabled && s.resendButtonDisabled]}
          onPress={handleResend}
          disabled={resendDisabled}
          accessibilityRole="button"
        >
          <Text style={s.resendText}>
            {resending
              ? 'Sending...'
              : cooldown > 0
                ? `Resend email in ${cooldown}s`
                : 'Resend verification email'}
          </Text>
        </Pressable>
      </ScrollView>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#F5F6FF' },
  scroll: { paddingHorizontal: 22, paddingBottom: 40 },
  wordmarkRow: { alignItems: 'center', marginTop: 18, marginBottom: 18 },
  wordmark: { height: 42, width: 200 },
  header: { marginTop: 14, marginBottom: 26 },
  title: { fontSize: 24, fontWeight: '700', color: '#16142F', marginBottom: 10 },
  subtitle: { fontSize: 14, color: '#726C8E', lineHeight: 21 },
  email: { fontSize: 15, fontWeight: '700', color: '#16142F', marginVertical: 6 },
  success: { fontSize: 13, color: '#2E8B57', marginBottom: 12, flexShrink: 1 },
  error: { fontSize: 12, color: '#E05E5E', marginBottom: 12, flexShrink: 1 },
  resendButton: {
    height: 52,
    marginTop: 12,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#D7DBFF',
    backgroundColor: '#F0F2FF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  resendButtonDisabled: { opacity: 0.6 },
  resendText: { fontSize: 14, fontWeight: '600', color: '#59627F' },
});

export default EmailVerificationScreen;