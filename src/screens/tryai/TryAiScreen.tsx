import { useEffect, useRef, useState, type ComponentRef } from 'react';
import {
  ActivityIndicator,
  Keyboard,
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';

import type { RootStackParamList } from '../../navigation/AppNavigator';
import PrimaryButton from '../../components/common/PrimaryButton';
import { ApiError } from '../../services/api';
import {
  clearTryAiToken,
  generateTryAi,
  hasTryAiAccess,
  MAX_PROMPT_LENGTH,
  recordTryAiVisit,
  signupForTryAi,
  type Attribution,
} from '../../services/tryAiApi';

type Props = NativeStackScreenProps<RootStackParamList, 'TryAi'>;

const EXAMPLES = [
  'Help me write a professional email',
  'Explain artificial intelligence simply',
  'Give me ideas for a small business',
  'Plan a healthy weekly meal menu',
];

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const PASSWORD_REGEX = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[^A-Za-z\d]).{8,}$/;

function errorMessage(error: unknown): string {
  return error instanceof Error && error.message ? error.message : 'Something went wrong. Please try again.';
}

function TryAiScreen({ navigation, route }: Props) {
  const params = route.params;
  const attribution: Attribution = {};
  (['utm_source', 'utm_medium', 'utm_campaign', 'utm_content', 'utm_term'] as const).forEach(key => {
    const value = params?.[key];
    if (typeof value === 'string' && value) {
      attribution[key] = value;
    }
  });

  const [prompt, setPrompt] = useState((params?.input ?? '').slice(0, MAX_PROMPT_LENGTH));
  const [generating, setGenerating] = useState(false);
  const [error, setError] = useState('');
  const [answer, setAnswer] = useState('');
  const [notice, setNotice] = useState('');

  // Signup sheet
  const [sheetOpen, setSheetOpen] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [signingUp, setSigningUp] = useState(false);
  const [fieldErrors, setFieldErrors] = useState<{ email?: string; password?: string; confirm?: string }>({});
  const [sheetError, setSheetError] = useState('');
  const [accountExists, setAccountExists] = useState(false);

  // Keyboard space for the main page (the keyboard is drawn over the app on newer Android).
  const scrollRef = useRef<ComponentRef<typeof ScrollView>>(null);
  const [keyboardHeight, setKeyboardHeight] = useState(0);

  useEffect(() => {
    const showEvent = Platform.OS === 'ios' ? 'keyboardWillShow' : 'keyboardDidShow';
    const hideEvent = Platform.OS === 'ios' ? 'keyboardWillHide' : 'keyboardDidHide';
    const showSub = Keyboard.addListener(showEvent, e => setKeyboardHeight(e.endCoordinates.height));
    const hideSub = Keyboard.addListener(hideEvent, () => setKeyboardHeight(0));
    return () => {
      showSub.remove();
      hideSub.remove();
    };
  }, []);

  // Count the arrival from a social link (only when the link carries campaign tags).
  useEffect(() => {
    recordTryAiVisit(attribution);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const runGenerate = async (text: string) => {
    setGenerating(true);
    setError('');
    setAnswer('');
    try {
      const response = await generateTryAi(text, attribution);
      setAnswer(response.output ?? '');
    } catch (err) {
      if (err instanceof ApiError && err.status === 401) {
        // The short-lived sign-up token has expired: ask them to sign in again.
        clearTryAiToken();
        setSheetError('Your session expired. Create an account or log in to continue.');
        setSheetOpen(true);
      } else {
        setError(errorMessage(err));
      }
    } finally {
      setGenerating(false);
    }
  };

  const handleGenerate = () => {
    if (generating || !prompt.trim()) {
      return;
    }
    Keyboard.dismiss();
    if (!hasTryAiAccess()) {
      setSheetError('');
      setSheetOpen(true);
      return;
    }
    runGenerate(prompt);
  };

  const validateSheet = () => {
    const errors: { email?: string; password?: string; confirm?: string } = {};
    if (!EMAIL_REGEX.test(email.trim())) {
      errors.email = 'Enter a valid email address.';
    }
    if (!PASSWORD_REGEX.test(password)) {
      errors.password = 'Use at least 8 characters, with uppercase, lowercase, a number and a symbol.';
    }
    if (password !== confirm) {
      errors.confirm = 'Passwords do not match.';
    }
    setFieldErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSignup = async () => {
    if (signingUp || !validateSheet()) {
      return;
    }
    setSigningUp(true);
    setSheetError('');
    setAccountExists(false);
    try {
      const response = await signupForTryAi(email, password, confirm);
      setSheetOpen(false);
      setNotice(response.message ?? 'Account created. Check your email to verify it.');
      setPassword('');
      setConfirm('');
      runGenerate(prompt);
    } catch (err) {
      if (err instanceof ApiError && err.status === 409) {
        setAccountExists(true);
      }
      setSheetError(errorMessage(err));
    } finally {
      setSigningUp(false);
    }
  };

  const goToLogin = () => {
    setSheetOpen(false);
    navigation.navigate('Login');
  };

  const canGenerate = prompt.trim().length > 0 && !generating;

  return (
    <SafeAreaView style={s.safe}>
      <ScrollView
        ref={scrollRef}
        contentContainerStyle={[s.content, keyboardHeight > 0 && { paddingBottom: keyboardHeight + 24 }]}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}>
        <Text style={s.eyebrow}>ARTHUM AI · FREE PREVIEW</Text>
        <Text style={s.headline}>Ask anything. Explore ideas.</Text>
        <Text style={s.subline}>
          Write, learn, brainstorm, plan, and solve everyday problems with AI. Create a quick account to generate your
          answer.
        </Text>

        <View style={s.card}>
          <View style={s.iconBox}>
            <Text style={s.iconText}>✦</Text>
          </View>
          <Text style={s.cardTitle}>What can I help you with?</Text>
          <Text style={s.cardSub}>Type your own prompt or choose an example to get started.</Text>

          <View style={s.chips}>
            {EXAMPLES.map(example => (
              <Pressable key={example} style={s.chip} onPress={() => setPrompt(example)} accessibilityRole="button">
                <Text style={s.chipText}>{example}</Text>
              </Pressable>
            ))}
          </View>

          <View style={s.divider} />

          <Text style={s.promptLabel}>Your prompt</Text>
          <TextInput
            style={s.promptInput}
            value={prompt}
            onChangeText={text => setPrompt(text.slice(0, MAX_PROMPT_LENGTH))}
            onFocus={() => setTimeout(() => scrollRef.current?.scrollToEnd({ animated: true }), 250)}
            placeholder="Ask a question, request an explanation, or describe what you'd like to create..."
            placeholderTextColor="#9A96AD"
            multiline
            textAlignVertical="top"
          />

          <View style={s.footerRow}>
            <Text style={s.counter}>
              {prompt.length}/{MAX_PROMPT_LENGTH}
            </Text>
            <Pressable
              style={[s.generateButton, !canGenerate && s.generateDisabled]}
              onPress={handleGenerate}
              disabled={!canGenerate}
              accessibilityRole="button">
              {generating ? <ActivityIndicator size="small" color="#FFFFFF" /> : <Text style={s.generateText}>Generate ✦</Text>}
            </Pressable>
          </View>
        </View>

        {!!error && <Text style={s.errorText}>{error}</Text>}

        {(!!answer || !!notice) && (
          <View style={s.answerCard}>
            {!!notice && <Text style={s.notice}>{notice}</Text>}
            {!!answer && (
              <>
                <Text style={s.answerLabel}>ANSWER</Text>
                <Text style={s.answerText} selectable>
                  {answer}
                </Text>
                <Pressable
                  style={s.againButton}
                  onPress={() => {
                    setAnswer('');
                    setPrompt('');
                  }}
                  accessibilityRole="button">
                  <Text style={s.againText}>Ask something else</Text>
                </Pressable>
              </>
            )}
          </View>
        )}

        <Text style={s.disclaimer}>
          AI can make mistakes. Verify important information. Your prompts and responses are saved to your Arthum AI
          account.
        </Text>
      </ScrollView>

      {/* Create account sheet */}
      <Modal visible={sheetOpen} transparent animationType="fade" onRequestClose={() => setSheetOpen(false)}>
        <KeyboardAvoidingView style={s.backdrop} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
          <View style={s.sheet}>
            <ScrollView keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
              <View style={s.sheetTop}>
                <Text style={s.sheetTitle}>Create your Arthum AI account</Text>
                <Pressable onPress={() => setSheetOpen(false)} accessibilityRole="button" accessibilityLabel="Close">
                  <Text style={s.sheetClose}>✕</Text>
                </Pressable>
              </View>
              <Text style={s.sheetSub}>
                Sign up to get your answer. Already registered?{' '}
                <Text style={s.link} onPress={goToLogin}>
                  Log in
                </Text>
              </Text>

              <Text style={s.fieldLabel}>Email</Text>
              <TextInput
                style={s.field}
                value={email}
                onChangeText={setEmail}
                keyboardType="email-address"
                autoCapitalize="none"
                autoCorrect={false}
                textContentType="emailAddress"
              />
              {!!fieldErrors.email && <Text style={s.fieldError}>{fieldErrors.email}</Text>}

              <Text style={s.fieldLabel}>Password</Text>
              <TextInput style={s.field} value={password} onChangeText={setPassword} secureTextEntry autoCapitalize="none" textContentType="newPassword" />
              {!!fieldErrors.password && <Text style={s.fieldError}>{fieldErrors.password}</Text>}

              <Text style={s.fieldLabel}>Confirm password</Text>
              <TextInput style={s.field} value={confirm} onChangeText={setConfirm} secureTextEntry autoCapitalize="none" textContentType="newPassword" />
              {!!fieldErrors.confirm && <Text style={s.fieldError}>{fieldErrors.confirm}</Text>}

              <Text style={s.hint}>Use uppercase and lowercase letters, a number, and a symbol.</Text>

              {!!sheetError && <Text style={s.fieldError}>{sheetError}</Text>}
              {accountExists && (
                <Pressable style={s.loginLinkButton} onPress={goToLogin} accessibilityRole="button">
                  <Text style={s.loginLinkText}>Go to Log in</Text>
                </Pressable>
              )}

              <PrimaryButton
                title={signingUp ? 'Creating account...' : 'Create account & generate ✦'}
                onPress={handleSignup}
                disabled={signingUp}
              />
            </ScrollView>
          </View>
        </KeyboardAvoidingView>
      </Modal>
    </SafeAreaView>
  );
}

export default TryAiScreen;

const s = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#F5F6FF' },
  content: { paddingHorizontal: 16, paddingTop: 24, paddingBottom: 32 },
  eyebrow: { textAlign: 'center', fontSize: 11, fontWeight: '800', letterSpacing: 1.5, color: '#4452D6' },
  headline: { marginTop: 12, textAlign: 'center', fontSize: 30, lineHeight: 36, fontWeight: '800', color: '#16142F' },
  subline: { marginTop: 12, marginBottom: 20, textAlign: 'center', fontSize: 14, lineHeight: 21, color: '#726C8E' },

  card: { padding: 18, borderRadius: 22, backgroundColor: '#FFFFFF', borderWidth: 1, borderColor: '#E8E9F6' },
  iconBox: { alignSelf: 'center', width: 52, height: 52, borderRadius: 16, backgroundColor: '#EEF0FF', alignItems: 'center', justifyContent: 'center' },
  iconText: { fontSize: 24, color: '#5566EB' },
  cardTitle: { marginTop: 14, textAlign: 'center', fontSize: 19, fontWeight: '800', color: '#16142F' },
  cardSub: { marginTop: 6, marginBottom: 16, textAlign: 'center', fontSize: 12, color: '#726C8E' },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  chip: { width: '48%', flexGrow: 1, minHeight: 52, paddingHorizontal: 12, paddingVertical: 10, borderRadius: 12, backgroundColor: '#F5F6FF', borderWidth: 1, borderColor: '#E1E3F4', justifyContent: 'center' },
  chipText: { fontSize: 12, color: '#2A2745', lineHeight: 17 },
  divider: { height: 1, backgroundColor: '#ECEDF8', marginVertical: 18 },
  promptLabel: { fontSize: 13, fontWeight: '700', color: '#16142F', marginBottom: 8 },
  promptInput: { minHeight: 110, padding: 12, borderRadius: 14, borderWidth: 1, borderColor: '#E1E3F4', backgroundColor: '#F7F8FF', fontSize: 14, color: '#16142F' },
  footerRow: { marginTop: 14, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  counter: { fontSize: 12, color: '#726C8E' },
  generateButton: { height: 44, minWidth: 130, paddingHorizontal: 20, borderRadius: 14, backgroundColor: '#5566EB', alignItems: 'center', justifyContent: 'center' },
  generateDisabled: { backgroundColor: '#B6BCF2' },
  generateText: { fontSize: 14, fontWeight: '700', color: '#FFFFFF' },

  errorText: { marginTop: 12, fontSize: 13, color: '#D93025', textAlign: 'center' },
  answerCard: { marginTop: 16, padding: 16, borderRadius: 18, backgroundColor: '#FFFFFF', borderWidth: 1, borderColor: '#E8E9F6' },
  notice: { marginBottom: 10, padding: 10, borderRadius: 10, backgroundColor: '#F2FAF5', fontSize: 12, lineHeight: 18, color: '#2A2745' },
  answerLabel: { fontSize: 11, fontWeight: '800', letterSpacing: 0.8, color: '#4452D6', marginBottom: 8 },
  answerText: { fontSize: 14, lineHeight: 22, color: '#16142F' },
  againButton: { alignSelf: 'flex-start', marginTop: 14, height: 40, paddingHorizontal: 16, borderRadius: 12, backgroundColor: '#EEF0FF', alignItems: 'center', justifyContent: 'center' },
  againText: { fontSize: 13, fontWeight: '700', color: '#4452D6' },
  disclaimer: { marginTop: 20, textAlign: 'center', fontSize: 11, lineHeight: 16, color: '#726C8E' },

  backdrop: { flex: 1, backgroundColor: 'rgba(22,20,47,0.55)', justifyContent: 'center', padding: 16 },
  sheet: { maxHeight: '92%', padding: 20, borderRadius: 22, backgroundColor: '#FFFFFF' },
  sheetTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', gap: 12 },
  sheetTitle: { flex: 1, fontSize: 20, lineHeight: 26, fontWeight: '800', color: '#16142F' },
  sheetClose: { fontSize: 18, color: '#726C8E', padding: 4 },
  sheetSub: { marginTop: 8, marginBottom: 14, fontSize: 13, lineHeight: 19, color: '#726C8E' },
  link: { color: '#4452D6', fontWeight: '700', textDecorationLine: 'underline' },
  fieldLabel: { marginTop: 10, marginBottom: 6, fontSize: 13, fontWeight: '700', color: '#16142F' },
  field: { height: 48, paddingHorizontal: 12, borderRadius: 12, borderWidth: 1, borderColor: '#E1E3F4', backgroundColor: '#FAFAFF', fontSize: 15, color: '#16142F' },
  fieldError: { marginTop: 6, fontSize: 12, lineHeight: 17, color: '#D93025' },
  hint: { marginTop: 10, marginBottom: 14, fontSize: 11, lineHeight: 16, color: '#726C8E' },
  loginLinkButton: { alignSelf: 'flex-start', marginTop: 8, marginBottom: 12, height: 38, paddingHorizontal: 16, borderRadius: 12, backgroundColor: '#EEF0FF', alignItems: 'center', justifyContent: 'center' },
  loginLinkText: { fontSize: 13, fontWeight: '700', color: '#4452D6' },
});