import AsyncStorage from '@react-native-async-storage/async-storage';

// Keeps the logged-in user. The login is also saved on the phone, so the student
// stays logged in after the app is closed, until they log out or the login expires.

export type SessionUser = {
    id: string;
    name: string;
    email: string;
    mobile?: string;
    verified?: boolean;
    category?: string;
    userType?: string;
    accountType?: string;
};

type Session = {
    token: string | null;
    user: SessionUser | null;
};

const STORAGE_KEY = 'arthum.session';

let session: Session = { token: null, user: null };

export function setSession(token: string, user: SessionUser | null) {
    session = { token, user };
    AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(session)).catch(() => {});
}

export function getSession(): Session {
    return session;
}

export function clearSession() {
    session = { token: null, user: null };
    AsyncStorage.removeItem(STORAGE_KEY).catch(() => {});
}

// Called once when the app starts, before the first screen is shown.
export async function loadSession(): Promise<Session> {
    try {
        const raw = await AsyncStorage.getItem(STORAGE_KEY);
        if (raw) {
            const saved = JSON.parse(raw) as Session;
            if (saved?.token) {
                session = { token: saved.token, user: saved.user ?? null };
            }
        }
    } catch (_e) {
        // If the saved login cannot be read, the student simply logs in again.
    }
    return session;
}