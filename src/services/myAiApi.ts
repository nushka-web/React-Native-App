import { apiRequest } from './api';
import { BATCHJOB_BASE_URL } from './newsApi';

// ── Website (agent builder opens here) ────────────────────────────────────────
export const WEBSITE_URL = 'https://www.arthumai.com';

export function builderUrl(params?: { agentId?: string; template?: string }) {
    const query: string[] = [];
    if (params?.agentId) {
        query.push(`agentId=${encodeURIComponent(params.agentId)}`);
    }
    if (params?.template) {
        query.push(`template=${encodeURIComponent(params.template)}`);
    }
    return `${WEBSITE_URL}/myai/agents/builder${query.length ? `?${query.join('&')}` : ''}`;
}

// ── Widgets (main backend: /api/widgets) ──────────────────────────────────────

export interface DbWidget {
    _id: string;
    widgetName: string;
    visitCategory?: string;
    description?: string;
}

// The login token lets the backend hide widgets that are not allowed for the student's role.
export async function fetchAllWidgets(token?: string): Promise<DbWidget[]> {
    const data = await apiRequest<DbWidget[]>('/api/widgets/widgets?status=active', {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
    });
    return Array.isArray(data) ? data : [];
}

export async function fetchUserWidgetNames(userEmail: string): Promise<string[]> {
    const data = await apiRequest<Array<{ widgetName?: string } | string>>(
        `/api/widgets/userWidgets?userEmail=${encodeURIComponent(userEmail)}`,
    );
    return Array.isArray(data)
        ? data.map(w => (typeof w === 'string' ? w : w.widgetName || '')).filter(Boolean)
        : [];
}

export function addUserWidget(userEmail: string, widgetName: string) {
    return apiRequest<unknown>('/api/widgets/userWidgets', {
        method: 'POST',
        body: JSON.stringify({ userEmail, widgetName }),
    });
}

export function removeUserWidget(userEmail: string, widgetName: string) {
    return apiRequest<unknown>('/api/widgets/userWidgets', {
        method: 'DELETE',
        body: JSON.stringify({ userEmail, widgetName }),
    });
}

// ── Agents (main backend: /api/agent-builder, needs the login token) ──────────

export interface AgentSummary {
    _id: string;
    name: string;
    description?: string;
    status?: 'draft' | 'active' | 'paused' | 'error';
    version?: number;
    updatedAt?: string;
}

export async function fetchAgents(token: string): Promise<AgentSummary[]> {
    const result = await apiRequest<{ data?: AgentSummary[] }>('/api/agent-builder/agents', {
        headers: { Authorization: `Bearer ${token}` },
    });
    return Array.isArray(result.data) ? result.data : [];
}

export function deleteAgent(token: string, agentId: string) {
    return apiRequest<unknown>(`/api/agent-builder/agents/${agentId}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
    });
}

// Same templates as the website's Agents tab.
export const ARTHUM_TEMPLATES = [
    {
        id: 'jitsi-ai-meeting-assistant',
        name: 'Jitsi AI Meeting Assistant',
        description:
            'Join a Jitsi room as MyAI Assistant, listen for @ai chat messages, use optional transcription context, and reply with LLM Master preference fallback.',
    },
    {
        id: 'live-language-translator',
        name: 'Live Language Translator',
        description:
            'Transcribe microphone speech with the audio to text model from LLM Master, translate with text to text preference fallback, and speak the result with local Kokoro TTS.',
    },
    {
        id: 'social-media-manager',
        name: 'Social Media Manager',
        description: 'Research a topic, generate content, request approval, publish to Facebook, and log the result.',
    },
    {
        id: 'competitor-monitor',
        name: 'Competitor Monitor',
        description: 'Research competitors, analyse changes, create a concise report, and return the result.',
    },
    {
        id: 'research-assistant',
        name: 'Research Assistant',
        description: 'Search, analyse, summarise and return structured research from an input topic.',
    },
];

// ── Ready Content (batch job server, same address as Like and Dislike) ────────

export const studyContentAvailable = BATCHJOB_BASE_URL.length > 0;

export type StudyContentType = 'chapter_summary' | 'mcq_test' | 'short_notes' | 'practice_questions';

export interface StudyDoc {
    _id: string;
    subjectName?: string;
    unitName?: string;
    chapterName?: string;
    contentType: StudyContentType;
    title?: string;
    status: string;
    createdAt: string;
}

export async function fetchStudyContent(userEmail: string): Promise<StudyDoc[]> {
    const response = await fetch(
        `${BATCHJOB_BASE_URL}/api/study/content?userEmail=${encodeURIComponent(userEmail)}&limit=20`,
    );
    if (!response.ok) {
        throw new Error(`Server returned ${response.status}`);
    }
    const json = await response.json();
    return ((json.data || []) as StudyDoc[]).filter(d => d.status === 'completed');
}

export async function runStudyOnce(userEmail: string): Promise<void> {
    const response = await fetch(`${BATCHJOB_BASE_URL}/api/study/run-once`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userEmail }),
    });
    const json = await response.json().catch(() => ({}));
    if (!response.ok || !json.success) {
        throw new Error(json.message || `Server error (${response.status})`);
    }
}

// Opened in the phone's browser, which downloads or shows the PDF.
export const studyPdfUrl = (docId: string) => `${BATCHJOB_BASE_URL}/api/study/content/${docId}/pdf`;