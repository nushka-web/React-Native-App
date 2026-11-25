import { apiRequest } from './api';
import { getSession } from './session';

// Backend: src/routes/publicGenerate.route.js, mounted at /api/public-generate.
//   POST /signup  { email, password, confirmPassword } -> { token, expiresIn, message }
//   POST /        { input, attribution? }  (Bearer token required) -> { output }
//   POST /visit   { attribution }          records a landing-page arrival
//
// The token from /signup is a restricted "try-ai" token: valid for this route only,
// for 2 hours. It must NOT be stored as the normal login session, because every other
// API rejects it. It is kept in memory here and cleared when the app closes.

export type Attribution = Partial<
    Record<'utm_source' | 'utm_medium' | 'utm_campaign' | 'utm_content' | 'utm_term', string>
>;

export interface SignupResponse {
    success: boolean;
    token?: string;
    expiresIn?: number;
    message?: string;
}

export interface TryAiResponse {
    success: boolean;
    output?: string;
    message?: string;
}

export const MAX_PROMPT_LENGTH = 3000;

let tryAiToken: string | null = null;
let tryAiTokenExpiresAt = 0;

export function hasTryAiAccess(): boolean {
    if (tryAiToken && Date.now() < tryAiTokenExpiresAt) {
        return true;
    }
    tryAiToken = null;
    return !!getSession().token;
}

export function clearTryAiToken() {
    tryAiToken = null;
    tryAiTokenExpiresAt = 0;
}

function currentToken(): string {
    if (tryAiToken && Date.now() < tryAiTokenExpiresAt) {
        return tryAiToken;
    }
    return getSession().token ?? '';
}

export async function signupForTryAi(email: string, password: string, confirmPassword: string) {
    const response = await apiRequest<SignupResponse>('/api/public-generate/signup', {
        method: 'POST',
        body: JSON.stringify({ email: email.trim().toLowerCase(), password, confirmPassword }),
    });
    if (response.token) {
        tryAiToken = response.token;
        // Expire a little early so a request never starts with a token about to lapse.
        tryAiTokenExpiresAt = Date.now() + ((response.expiresIn ?? 7200) - 60) * 1000;
    }
    return response;
}

export function generateTryAi(input: string, attribution: Attribution) {
    return apiRequest<TryAiResponse>('/api/public-generate', {
        method: 'POST',
        headers: { Authorization: `Bearer ${currentToken()}` },
        body: JSON.stringify({ input: input.trim(), attribution }),
    });
}

// Fire and forget: counts a visit from a social link. Never blocks or shows errors.
export function recordTryAiVisit(attribution: Attribution) {
    if (Object.keys(attribution).length === 0) {
        return;
    }
    apiRequest('/api/public-generate/visit', {
        method: 'POST',
        body: JSON.stringify({ attribution }),
    }).catch(() => undefined);
}