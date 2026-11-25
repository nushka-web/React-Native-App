import { useState } from 'react';
import { Linking, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';

import { requestAccountDeletion } from '../../services/accountDeletionApi';

// "Request Account Deletion" page, opened from Profile > Delete Account.
// Mirrors the website page: the user confirms their registered email, we send them
// instructions. Submitting does NOT delete or disable the account.

const SUPPORT_EMAIL = 'pinaarthumai@gmail.com';
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

type Props = {
  initialEmail?: string;
  onBack: () => void;
};

function AccountDeletionView({ initialEmail = '', onBack }: Props) {
  const [email, setEmail] = useState(initialEmail);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [sentTo, setSentTo] = useState('');

  const handleSubmit = async () => {
    if (submitting) {
      return;
    }
    const value = email.trim();
    if (!EMAIL_REGEX.test(value)) {
      setError('Please enter a valid email address.');
      return;
    }
    setError('');
    setSubmitting(true);
    try {
      await requestAccountDeletion(value);
      setSentTo(value.toLowerCase());
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not send the request. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <ScrollView contentContainerStyle={s.content} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
      <Pressable onPress={onBack} style={s.back} accessibilityRole="button" accessibilityLabel="Back to profile">
        <Text style={s.backText}>‹ Profile</Text>
      </Pressable>

      <View style={s.card}>
        <Text style={s.title}>Request Account Deletion</Text>

        {sentTo ? (
          <View style={s.sentBox} accessibilityLiveRegion="polite">
            <Text style={s.sentTitle}>Request received</Text>
            <Text style={s.sentText}>
              We have emailed instructions to {sentTo}. Your account has not been deleted or disabled yet.
            </Text>
          </View>
        ) : (
          <>
            <Text style={s.lead}>
              Enter the email address associated with your Arthum AI account. We will email you instructions to
              confirm whether you requested deletion.
            </Text>

            <Text style={s.label}>Registered email address</Text>
            <TextInput
              style={[s.input, !!error && s.inputError]}
              value={email}
              onChangeText={text => {
                setEmail(text);
                if (error) {
                  setError('');
                }
              }}
              placeholder="you@example.com"
              placeholderTextColor="#9AA3B5"
              keyboardType="email-address"
              autoCapitalize="none"
              autoCorrect={false}
              editable={!submitting}
              accessibilityLabel="Registered email address"
            />
            {!!error && (
              <Text style={s.error} accessibilityRole="alert">
                {error}
              </Text>
            )}

            <Pressable
              style={[s.submit, submitting && s.submitDisabled]}
              onPress={handleSubmit}
              disabled={submitting}
              accessibilityRole="button">
              <Text style={s.submitText}>{submitting ? 'Sending...' : 'Request Account Deletion'}</Text>
            </Pressable>
          </>
        )}

        <View style={s.info}>
          <Text style={s.infoTitle}>What happens next?</Text>
          <Text style={s.infoText}>
            Reply from your registered email address to{' '}
            <Text style={s.link} onPress={() => Linking.openURL(`mailto:${SUPPORT_EMAIL}`)}>
              {SUPPORT_EMAIL}
            </Text>{' '}
            confirming whether you made this request. Submitting this form does not delete or disable your account.
          </Text>
          <Text style={s.infoText}>
            When your account is deleted after verification and processing, access ends permanently. Associated data
            is retained for 180 days after deletion, except where legal requirements apply.
          </Text>
        </View>
      </View>
    </ScrollView>
  );
}

export default AccountDeletionView;

const s = StyleSheet.create({
  content: { paddingHorizontal: 16, paddingTop: 14, paddingBottom: 40 },
  back: { alignSelf: 'flex-start', paddingVertical: 6, marginBottom: 6 },
  backText: { fontSize: 14, fontWeight: '700', color: '#4452D6' },

  card: { padding: 20, borderRadius: 20, backgroundColor: '#FFFFFF', borderWidth: 1, borderColor: '#E5E6F2' },
  title: { fontSize: 22, fontWeight: '800', color: '#16142F' },
  lead: { marginTop: 10, marginBottom: 18, fontSize: 14, lineHeight: 22, color: '#475569' },

  label: { marginBottom: 8, fontSize: 14, fontWeight: '700', color: '#16142F' },
  input: { height: 50, paddingHorizontal: 14, borderRadius: 10, borderWidth: 1, borderColor: '#CBD5E1', backgroundColor: '#F8FAFC', fontSize: 14, color: '#16142F' },
  inputError: { borderColor: '#E05E5E' },
  error: { marginTop: 8, fontSize: 12, color: '#E05E5E' },

  submit: { marginTop: 16, height: 50, borderRadius: 10, backgroundColor: '#2563EB', alignItems: 'center', justifyContent: 'center' },
  submitDisabled: { opacity: 0.6 },
  submitText: { fontSize: 15, fontWeight: '700', color: '#FFFFFF' },

  sentBox: { marginTop: 14, marginBottom: 4, padding: 14, borderRadius: 12, backgroundColor: '#EAF7F0', borderWidth: 1, borderColor: '#BFE5CF' },
  sentTitle: { fontSize: 15, fontWeight: '800', color: '#1F6B45' },
  sentText: { marginTop: 4, fontSize: 13, lineHeight: 20, color: '#2E5E45' },

  info: { marginTop: 20, padding: 14, borderRadius: 12, borderWidth: 1, borderColor: '#E2E8F0', backgroundColor: '#F8FAFC' },
  infoTitle: { marginBottom: 8, fontSize: 14, fontWeight: '700', color: '#16142F' },
  infoText: { marginBottom: 8, fontSize: 12.5, lineHeight: 19, color: '#475569' },
  link: { color: '#2563EB' },
});