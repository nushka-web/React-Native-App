import { apiRequest } from './api';

// ── News feed ─────────────────────────────────────────────────────────────────
// GET /api/news?page=1&limit=10  (backend: src/news/controller.js)

export interface NewsItem {
    _id: string;
    title: string;
    description?: string;
    sourceName?: string;
    url?: string;
    urlToImage?: string;
    publishedAt?: string;
    impactDescription?: string;
    quickActions?: string;
    likes?: number;
    dislikes?: number;
}

export interface NewsPageResponse {
    success: boolean;
    message?: string;
    data: NewsItem[];
    page?: number;
    limit?: number;
    total?: number;
    hasMore?: boolean;
}

export function fetchNewsPage(page: number, limit = 10) {
    return apiRequest<NewsPageResponse>(`/api/news?page=${page}&limit=${limit}`);
}

// ── Like and Dislike ──────────────────────────────────────────────────────────
// On the website these go to the separate "batch job" server
// (NEXT_PUBLIC_BATCHJOB_URL): POST /api/news/:id/like and /dislike  { userId }.
//
// Put that server's address here, for example 'https://batch.example.com'.
// While it is empty, Like and Dislike show a "coming soon" message instead.
export const BATCHJOB_BASE_URL = '';

export const reactionsAvailable = BATCHJOB_BASE_URL.length > 0;

export interface ReactionResult {
    likes: number;
    dislikes: number;
    userLiked: boolean;
    userDisliked: boolean;
}

export async function reactToNews(
    newsId: string,
    kind: 'like' | 'dislike',
    userId: string,
): Promise<ReactionResult> {
    const response = await fetch(`${BATCHJOB_BASE_URL}/api/news/${newsId}/${kind}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId }),
    });
    const json = await response.json();
    if (!response.ok || !json.success) {
        throw new Error(json.message || 'Could not update your reaction.');
    }
    return json.data as ReactionResult;
}

// ── Subscribe to a news item ──────────────────────────────────────────────────
// Same routes the website calls on the main backend:
// GET  /api/users/:userId/subscription/:newsId
// POST /api/users/:userId/subscription/:newsId/toggle

interface SubscriptionResponse {
    success: boolean;
    data: { subscribed: 'Yes' | 'No' };
}

export async function fetchNewsSubscription(userId: string, newsId: string): Promise<boolean> {
    const result = await apiRequest<SubscriptionResponse>(`/api/users/${userId}/subscription/${newsId}`);
    return result.data?.subscribed === 'Yes';
}

export async function toggleNewsSubscription(userId: string, newsId: string): Promise<boolean> {
    const result = await apiRequest<SubscriptionResponse>(
        `/api/users/${userId}/subscription/${newsId}/toggle`,
        { method: 'POST' },
    );
    return result.data?.subscribed === 'Yes';
}