import { apiRequest } from './api';

// Backend: src/routes/accountDeletion.routes.js, mounted at /api/account-deletion.
// ASSUMPTION: POST /api/account-deletion/request with { email }. This is the public
// "Request Account Deletion" form: it emails the user instructions and does NOT delete
// the account by itself. Confirm the path and body against accountDeletion.routes.js.

export interface AccountDeletionResponse {
    success: boolean;
    message?: string;
    toastMessage?: string;
}

export function requestAccountDeletion(email: string) {
    return apiRequest<AccountDeletionResponse>('/api/account-deletion/request', {
        method: 'POST',
        body: JSON.stringify({ email: email.trim().toLowerCase() }),
    });
}