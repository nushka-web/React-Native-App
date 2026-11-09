import { apiRequest } from './api';
import { getSession } from './session';
import type { TimetableActivity } from '../components/timetable/StudentTimetableBuilder';

// Backend: src/routes/generate.js, mounted at /api/generate (Student and Teacher roles only).
//   GET  /api/generate/context   -> saved board, standard, stream, career goals
//   POST /api/generate/context   -> saves board, standard, stream and the timetable
//   POST /api/generate           -> generates study material or a test
//   GET  /api/generate/history   -> past generations

export type StudentContext = {
    board: string;
    standard: string;
    stream: string;
    careerGoals: string;
    // Shape expected by the backend: { "CLASS-MON": { lectures: ["..."] }, ... }
    timetable: Record<string, { lectures: string[] }>;
};

export type GenerateParams = {
    subject: string;
    chapter: string;
    contentMode: 'study' | 'test';
    additionalInstructions?: string;
    // Test only
    testType?: string;
    openBook?: boolean;
    questionTypes?: string[];
};

export interface GenerateContextResponse {
    success: boolean;
    role?: string;
    context?: {
        standard?: string;
        board?: string;
        stream?: string;
        careerGoals?: string;
    };
    message?: string;
}

export interface GenerateResponse {
    success: boolean;
    id?: string;
    output?: string;
    message?: string;
    usage?: { inputTokens: number; outputTokens: number; totalTokens: number };
}

function authHeaders(): Record<string, string> {
    const token = getSession().token ?? '';
    return { Authorization: `Bearer ${token}` };
}

export function fetchGenerateContext() {
    return apiRequest<GenerateContextResponse>('/api/generate/context', {
        method: 'GET',
        headers: authHeaders(),
    });
}

export function saveGenerateContext(context: StudentContext) {
    return apiRequest<GenerateContextResponse>('/api/generate/context', {
        method: 'POST',
        headers: authHeaders(),
        body: JSON.stringify({ context }),
    });
}

export function generateContent(studentContext: StudentContext, params: GenerateParams) {
    return apiRequest<GenerateResponse>('/api/generate', {
        method: 'POST',
        headers: authHeaders(),
        body: JSON.stringify({ studentContext, params }),
    });
}

// ── Timetable conversion ──────────────────────────────────────────────────────
// The screen keeps a flat list of activities. The backend wants one entry per
// type and day: { "CLASS-MON": { lectures: [text, ...] } }, at most 15 per entry.
//
// The backend folds Tuition, Coaching and Self Study into one stored type and a
// later entry for the same day replaces an earlier one. To avoid losing data,
// Tuition and Self Study for the same day are merged into one "SELF STUDY" entry
// here. "Other" has no backend type, so it is sent as "HOBBY".

const DAY_CODES: Record<string, string> = {
    Mon: 'MON',
    Tue: 'TUE',
    Wed: 'WED',
    Thu: 'THU',
    Fri: 'FRI',
    Sat: 'SAT',
    Sun: 'SUN',
};

const TYPE_CODES: Record<string, string> = {
    Class: 'CLASS',
    Tuition: 'SELF STUDY',
    'Self Study': 'SELF STUDY',
    Sports: 'SPORTS',
    Other: 'HOBBY',
};

const MAX_LECTURES = 15;

function describeActivity(item: TimetableActivity): string {
    const parts = [`${item.activityType}: ${item.title}`];
    if (item.optionalSubjects && item.optionalSubjects.length > 0) {
        parts.push(`Optional: ${item.optionalSubjects.join(', ')}`);
    }
    if (item.organization) {
        parts.push(`@ ${item.organization}`);
    }
    if (item.notes) {
        parts.push(`Notes: ${item.notes}`);
    }
    return parts.join(' | ');
}

export function buildContextTimetable(items: TimetableActivity[]): StudentContext['timetable'] {
    const result: StudentContext['timetable'] = {};
    items.forEach(item => {
        const day = DAY_CODES[item.day];
        const type = TYPE_CODES[item.activityType];
        if (!day || !type) {
            return;
        }
        const key = `${type}-${day}`;
        const entry = result[key] ?? { lectures: [] };
        if (entry.lectures.length < MAX_LECTURES) {
            entry.lectures.push(describeActivity(item));
        }
        result[key] = entry;
    });
    return result;
}