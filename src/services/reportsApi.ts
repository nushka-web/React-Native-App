import { apiRequest } from './api';
import { getSession } from './session';

// Backend: src/routes/reports.js, mounted at /api/reports (login required).
//   GET /api/reports/balance              -> current balance and the latest transaction
//   GET /api/reports/balance-history      -> past 12 months, paged (page, limit)
//   GET /api/reports/transaction-history  -> past 12 months, paged, with optional
//                                            type=credit|debit and functionality=<text>

export type TransactionRow = {
    transaction_id?: number;
    transaction_date?: string;
    transaction_time?: string;
    transaction_datetime?: string;
    credit?: number;
    debit?: number;
    balance?: number;
    functionality?: string;
    modified_by?: string;
};

export type Pagination = {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
};

export interface BalanceReportResponse {
    success: boolean;
    message?: string;
    data?: {
        user: { name?: string; email?: string; balance?: number };
        transaction: TransactionRow | null;
    };
}

export interface BalanceHistoryResponse {
    success: boolean;
    message?: string;
    data?: {
        user: { name?: string; email?: string; currentBalance?: number };
        rows: TransactionRow[];
        pagination: Pagination;
    };
}

export interface TransactionHistoryResponse {
    success: boolean;
    message?: string;
    data?: {
        user: { name?: string; email?: string; currentBalance?: number };
        summary: { totalCredit: number; totalDebit: number; txCount: number };
        rows: TransactionRow[];
        pagination: Pagination;
    };
}

function authHeaders(): Record<string, string> {
    const token = getSession().token ?? '';
    return { Authorization: `Bearer ${token}` };
}

export function fetchBalanceReport() {
    return apiRequest<BalanceReportResponse>('/api/reports/balance', {
        method: 'GET',
        headers: authHeaders(),
    });
}

export function fetchBalanceHistory(page = 1, limit = 10) {
    return apiRequest<BalanceHistoryResponse>(
        `/api/reports/balance-history?page=${page}&limit=${limit}`,
        { method: 'GET', headers: authHeaders() },
    );
}

export function fetchTransactionHistory(options: {
    page?: number;
    limit?: number;
    type?: 'credit' | 'debit';
    functionality?: string;
}) {
    const params = [`page=${options.page ?? 1}`, `limit=${options.limit ?? 10}`];
    if (options.type) {
        params.push(`type=${options.type}`);
    }
    if (options.functionality) {
        params.push(`functionality=${encodeURIComponent(options.functionality)}`);
    }
    return apiRequest<TransactionHistoryResponse>(`/api/reports/transaction-history?${params.join('&')}`, {
        method: 'GET',
        headers: authHeaders(),
    });
}