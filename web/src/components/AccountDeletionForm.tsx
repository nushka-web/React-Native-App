'use client';

import { useState, useRef, FormEvent } from 'react';
import { requestAccountDeletion, ApiError } from '@/lib/api';

const SUPPORT_EMAIL = 'pinaarthumai@gmail.com';
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

type FormState =
  | { status: 'idle' }
  | { status: 'submitting' }
  | { status: 'success'; email: string }
  | { status: 'error'; message: string };

function ArrowRightIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true">
      <path d="M3 8h10M9 4l4 4-4 4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
  );
}

function CheckCircleIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 20 20" fill="none" aria-hidden="true">
      <circle cx="10" cy="10" r="9" stroke="#16a34a" strokeWidth="1.5"/>
      <path d="M6 10l3 3 5-6" stroke="#16a34a" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
  );
}

function EyeIcon({ open }: { open: boolean }) {
  return open ? (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
      <circle cx="12" cy="12" r="3" stroke="currentColor" strokeWidth="1.5"/>
    </svg>
  ) : (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
      <line x1="1" y1="1" x2="23" y2="23" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
    </svg>
  );
}

function SpinnerIcon() {
  return (
    <svg className="animate-spin" width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/>
    </svg>
  );
}

export default function AccountDeletionForm() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [emailError, setEmailError] = useState('');
  const [passwordError, setPasswordError] = useState('');
  const [formState, setFormState] = useState<FormState>({ status: 'idle' });
  const passwordRef = useRef<HTMLInputElement>(null);

  const validateEmail = (value: string): string => {
    if (!value.trim()) return 'Email address is required.';
    if (!EMAIL_REGEX.test(value.trim())) return 'Please enter a valid email address.';
    return '';
  };

  const validatePassword = (value: string): string => {
    if (!value) return 'Password is required.';
    return '';
  };

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    if (formState.status === 'submitting') return;

    const eErr = validateEmail(email);
    const pErr = validatePassword(password);
    setEmailError(eErr);
    setPasswordError(pErr);
    if (eErr || pErr) return;

    setFormState({ status: 'submitting' });

    try {
      await requestAccountDeletion(email, password);
      const submittedEmail = email.trim().toLowerCase();
      setPassword('');
      setShowPassword(false);
      setFormState({ status: 'success', email: submittedEmail });
    } catch (err) {
      setPassword('');
      setShowPassword(false);
      const message =
        err instanceof ApiError
          ? err.message
          : err instanceof Error && err.name === 'TimeoutError'
            ? 'The request timed out. Please check your connection and try again.'
            : err instanceof TypeError
              ? 'Unable to connect to the server. Please check your internet connection and try again.'
              : 'Something went wrong. Please try again.';
      setFormState({ status: 'error', message });
    }
  };

  const isSubmitting = formState.status === 'submitting';
  const isSuccess = formState.status === 'success';

  return (
    <div className="min-h-screen flex flex-col" style={{ backgroundColor: '#F5F6FF' }}>
      {/* ── Header ── */}
      <header
        className="w-full px-6 py-4 flex items-center"
        style={{ backgroundColor: '#16142F' }}
      >
        <div className="flex items-center gap-2.5">
          {/* Purple dot accent */}
          <div
            className="w-7 h-7 rounded-full flex items-center justify-center flex-shrink-0"
            style={{ backgroundColor: '#5566EB' }}
            aria-hidden="true"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
              <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-1 14H9V8h2v8zm4 0h-2V8h2v8z" fill="white" opacity="0.9"/>
            </svg>
          </div>
          <span className="text-white font-bold text-lg tracking-tight select-none">
            Arthum AI
          </span>
        </div>
      </header>

      {/* ── Main content ── */}
      <main className="flex-1 flex items-start justify-center px-4 py-10 sm:py-16">
        <div className="w-full max-w-lg">
          {/* ── White card ── */}
          <div
            className="rounded-2xl bg-white border p-6 sm:p-8 shadow-sm"
            style={{ borderColor: '#E5E6F2' }}
          >
            <h1
              className="text-2xl font-extrabold mb-2"
              style={{ color: '#16142F' }}
            >
              Request Account Deletion
            </h1>

            {/* ── Success state ── */}
            {isSuccess && formState.status === 'success' ? (
              <div
                className="mt-4 rounded-xl p-4 border"
                style={{
                  backgroundColor: '#EAF7F0',
                  borderColor: '#BFE5CF',
                }}
                role="status"
                aria-live="polite"
              >
                <div className="flex items-center gap-2 mb-1">
                  <CheckCircleIcon />
                  <p className="font-bold text-base" style={{ color: '#1F6B45' }}>
                    Your account deletion request has been submitted.
                  </p>
                </div>
                <p className="text-sm mt-2" style={{ color: '#2E5E45', lineHeight: '1.6' }}>
                  Please check your registered email address ({formState.email}) and follow the
                  instructions to confirm your request.
                </p>
                <p
                  className="text-xs mt-3 p-3 rounded-lg"
                  style={{
                    color: '#374151',
                    backgroundColor: '#F0FDF4',
                    lineHeight: '1.6',
                  }}
                >
                  <strong>Note:</strong> Submitting this form does not immediately delete your
                  account. You must follow the email confirmation process to complete the
                  deletion.
                </p>
              </div>
            ) : (
              <>
                {/* ── Description ── */}
                <p
                  className="text-sm mb-6 mt-1"
                  style={{ color: '#475569', lineHeight: '1.7' }}
                >
                  Enter the email address and password associated with your Arthum AI account
                  to request deletion.
                </p>

                {/* ── General error ── */}
                {formState.status === 'error' && (
                  <div
                    className="mb-5 rounded-xl p-4 border text-sm"
                    style={{
                      backgroundColor: '#FEF2F2',
                      borderColor: '#FECACA',
                      color: '#B91C1C',
                      lineHeight: '1.6',
                    }}
                    role="alert"
                  >
                    {formState.message}
                  </div>
                )}

                {/* ── Form ── */}
                <form onSubmit={handleSubmit} noValidate>
                  {/* Email field */}
                  <div className="mb-5">
                    <label
                      htmlFor="email"
                      className="block mb-1.5 text-sm font-semibold"
                      style={{ color: '#16142F' }}
                    >
                      Registered Email Address{' '}
                      <span className="text-red-500" aria-hidden="true">*</span>
                    </label>
                    <input
                      id="email"
                      type="email"
                      autoComplete="email"
                      required
                      disabled={isSubmitting}
                      value={email}
                      onChange={e => {
                        setEmail(e.target.value);
                        if (emailError) setEmailError('');
                        if (formState.status === 'error') setFormState({ status: 'idle' });
                      }}
                      onBlur={() => setEmailError(validateEmail(email))}
                      placeholder="you@example.com"
                      aria-describedby={emailError ? 'email-error' : undefined}
                      aria-invalid={!!emailError}
                      className="w-full h-12 px-4 rounded-xl text-sm outline-none transition-colors disabled:opacity-60"
                      style={{
                        border: `1px solid ${emailError ? '#E05E5E' : '#CBD5E1'}`,
                        backgroundColor: '#F8FAFC',
                        color: '#16142F',
                      }}
                    />
                    {emailError && (
                      <p
                        id="email-error"
                        className="mt-1.5 text-xs"
                        style={{ color: '#E05E5E' }}
                        role="alert"
                      >
                        {emailError}
                      </p>
                    )}
                  </div>

                  {/* Password field */}
                  <div className="mb-6">
                    <label
                      htmlFor="password"
                      className="block mb-1.5 text-sm font-semibold"
                      style={{ color: '#16142F' }}
                    >
                      Account Password{' '}
                      <span className="text-red-500" aria-hidden="true">*</span>
                    </label>
                    <div
                      className="flex items-center h-12 rounded-xl px-4 transition-colors"
                      style={{
                        border: `1px solid ${passwordError ? '#E05E5E' : '#CBD5E1'}`,
                        backgroundColor: '#F8FAFC',
                      }}
                    >
                      <input
                        ref={passwordRef}
                        id="password"
                        type={showPassword ? 'text' : 'password'}
                        autoComplete="current-password"
                        required
                        disabled={isSubmitting}
                        value={password}
                        onChange={e => {
                          setPassword(e.target.value);
                          if (passwordError) setPasswordError('');
                          if (formState.status === 'error') setFormState({ status: 'idle' });
                        }}
                        onBlur={() => setPasswordError(validatePassword(password))}
                        placeholder="Enter your password"
                        aria-describedby={passwordError ? 'password-error' : undefined}
                        aria-invalid={!!passwordError}
                        className="flex-1 bg-transparent text-sm outline-none disabled:opacity-60"
                        style={{ color: '#16142F' }}
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(v => !v)}
                        className="ml-2 flex-shrink-0 p-1 rounded"
                        style={{ color: '#64748B' }}
                        aria-label={showPassword ? 'Hide password' : 'Show password'}
                      >
                        <EyeIcon open={showPassword} />
                      </button>
                    </div>
                    {passwordError && (
                      <p
                        id="password-error"
                        className="mt-1.5 text-xs"
                        style={{ color: '#E05E5E' }}
                        role="alert"
                      >
                        {passwordError}
                      </p>
                    )}
                  </div>

                  {/* Submit button */}
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="w-full h-12 rounded-xl text-white text-sm font-bold flex items-center justify-center gap-2 transition-opacity disabled:opacity-60"
                    style={{ backgroundColor: '#2563EB' }}
                    aria-busy={isSubmitting}
                  >
                    {isSubmitting ? (
                      <>
                        <SpinnerIcon />
                        <span>Sending request…</span>
                      </>
                    ) : (
                      <>
                        <span>Request Account Deletion</span>
                        <ArrowRightIcon />
                      </>
                    )}
                  </button>
                </form>
              </>
            )}

            {/* ── Divider ── */}
            <hr className="my-6" style={{ borderColor: '#E5E6F2' }} />

            {/* ── What happens next? ── */}
            <div
              className="rounded-xl p-4 border"
              style={{ backgroundColor: '#F8FAFC', borderColor: '#E2E8F0' }}
            >
              <h2
                className="text-sm font-bold mb-3"
                style={{ color: '#16142F' }}
              >
                What happens next?
              </h2>
              <ol className="space-y-2.5">
                {[
                  {
                    step: '1',
                    text: 'We send you an email with instructions to confirm your deletion request.',
                  },
                  {
                    step: '2',
                    text: 'Reply from your registered email address to confirm you made this request.',
                  },
                  {
                    step: '3',
                    text: 'After identity verification, your account will be deactivated and scheduled for permanent deletion.',
                  },
                  {
                    step: '4',
                    text: 'Your account and all associated data will be permanently deleted.',
                  },
                  {
                    step: '5',
                    text: 'Associated data is retained for 180 days after deletion, except where applicable legal requirements mandate a different retention period.',
                  },
                ].map(({ step, text }) => (
                  <li key={step} className="flex gap-3 items-start">
                    <span
                      className="flex-shrink-0 w-5 h-5 rounded-full text-xs font-bold flex items-center justify-center mt-0.5"
                      style={{ backgroundColor: '#EEF2FF', color: '#4452D6' }}
                      aria-hidden="true"
                    >
                      {step}
                    </span>
                    <p className="text-xs" style={{ color: '#475569', lineHeight: '1.6' }}>
                      {text}
                    </p>
                  </li>
                ))}
              </ol>
            </div>
          </div>

          {/* ── Footer links ── */}
          <div className="mt-6 text-center space-y-2">
            <p className="text-xs" style={{ color: '#64748B' }}>
              <a
                href="/privacy"
                className="underline hover:text-blue-600 transition-colors"
                style={{ color: '#4452D6' }}
              >
                Privacy Policy
              </a>
              {' · '}
              <a
                href={`mailto:${SUPPORT_EMAIL}`}
                className="underline hover:text-blue-600 transition-colors"
                style={{ color: '#4452D6' }}
              >
                Contact Support
              </a>
            </p>
            <p className="text-xs" style={{ color: '#94A3B8', lineHeight: '1.5' }}>
              You can also request account deletion from your{' '}
              <strong style={{ color: '#64748B' }}>Profile</strong> inside the Arthum AI app.
            </p>
          </div>
        </div>
      </main>
    </div>
  );
}
