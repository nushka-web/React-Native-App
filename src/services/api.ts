const API_BASE_URL = 'http://localhost:4000';

// An error that also carries the HTTP status, so screens can tell "login expired" (401)
// apart from other failures. It is still a normal Error with a readable message.
export class ApiError extends Error {
    status: number;

    constructor(message: string, status: number) {
        super(message);
        this.name = 'ApiError';
        this.status = status;
    }
}

// Called when the server rejects a request that carried a login token (HTTP 401),
// which means the login has expired. The home screen sets this to send the
// student back to the login screen.
let unauthorizedHandler: (() => void) | null = null;

export function setUnauthorizedHandler(handler: (() => void) | null) {
    unauthorizedHandler = handler;
}

function sentLoginToken(headers: RequestInit['headers']): boolean {
    if (!headers || Array.isArray(headers) || typeof (headers as Headers).get === 'function') {
        return false;
    }
    return !!(headers as Record<string, string>).Authorization;
}

// Default timeout (ms) for every API call. Prevents the UI from hanging
// forever when the backend is unreachable (e.g. localhost on a real device).
// 30s gives the backend enough time for heavy operations like registration.
const REQUEST_TIMEOUT_MS = 30_000;

export async function apiRequest<T>(
    endpoint: string,
    options: RequestInit = {},
): Promise<T> {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);

    try {
        const response = await fetch(`${API_BASE_URL}${endpoint}`, {
            ...options,
            signal: controller.signal,
            headers: {
                'Content-Type': 'application/json',
                ...options.headers,
            },
        });

        const data = await response.json();

        if (!response.ok) {
            // A wrong password on the login screen is also a 401, but it carries no token,
            // so only requests that sent a token count as an expired login.
            if (response.status === 401 && sentLoginToken(options.headers) && unauthorizedHandler) {
                unauthorizedHandler();
            }
            throw new ApiError(data.message || 'Something went wrong', response.status);
        }

        return data;
    } catch (error) {
        console.error(`API Error [${endpoint}]:`, error);

        if (error instanceof Error) {
            throw error;
        }

        throw new Error('Something went wrong while connecting to the server');
    } finally {
        clearTimeout(timer);
    }
}

export { API_BASE_URL };