import { API_BASE_URL, apiRequest } from './api';

// Backend: /api/study-material and /api/practice-questions (main backend, same data the website uses).
//   GET /syllabus?board=&standard=&stream=                       -> subjects, units and chapters
//   GET /chapter?board=&standard=&stream=&unit=&chapter=&subjectCode=&subjectName=[&type=]

export type EducationKind = 'study-material' | 'practice-questions';
export type PracticeType = 'theoretical' | 'competency';

export interface StudentScope {
    board: string;
    standard: string;
    stream: string;
}

export interface SyllabusChapter {
    chapter_number: number | string;
    chapter_name: string;
}

export interface SyllabusUnit {
    unit_number: number | string;
    unit_name: string;
    chapters?: SyllabusChapter[];
}

export interface SyllabusSubject {
    _id?: string;
    subject_code?: string;
    subject_name: string;
    units?: SyllabusUnit[];
}

// The student's board, class and stream come from their saved profile (set at registration).
export async function fetchStudentScope(token: string): Promise<StudentScope> {
    const result = await apiRequest<{
        user?: { board?: string; classStandard?: string | number; stream?: string };
    }>('/api/auth/profile', {
        headers: { Authorization: `Bearer ${token}` },
    });
    return {
        board: (result.user?.board || '').trim(),
        standard: String(result.user?.classStandard || '').trim(),
        stream: (result.user?.stream || '').trim(),
    };
}

// Classes without a stream (for example Class 9 and 10) use "general", which matches
// syllabus records that have no stream.
const streamParam = (scope: StudentScope) => scope.stream.trim().toLowerCase() || 'general';

const baseQuery = (scope: StudentScope) =>
    `board=${encodeURIComponent(scope.board)}&standard=${encodeURIComponent(scope.standard)}&stream=${encodeURIComponent(
        streamParam(scope),
    )}`;

export async function fetchSyllabus(kind: EducationKind, scope: StudentScope): Promise<SyllabusSubject[]> {
    const result = await apiRequest<{ success: boolean; data?: SyllabusSubject[] }>(
        `/api/${kind}/syllabus?${baseQuery(scope)}`,
    );
    return Array.isArray(result.data) ? result.data : [];
}

export interface ChapterRequest {
    scope: StudentScope;
    subject: SyllabusSubject;
    unitNumber: number | string;
    chapterNumber: number | string;
    type?: PracticeType;
}

export async function fetchChapter<T>(kind: EducationKind, request: ChapterRequest): Promise<T> {
    let query = `${baseQuery(request.scope)}&unit=${encodeURIComponent(String(request.unitNumber))}&chapter=${encodeURIComponent(
        String(request.chapterNumber),
    )}`;
    if (request.subject.subject_code) {
        query += `&subjectCode=${encodeURIComponent(request.subject.subject_code)}`;
    }
    if (request.subject.subject_name) {
        query += `&subjectName=${encodeURIComponent(request.subject.subject_name)}`;
    }
    if (kind === 'practice-questions') {
        query += `&type=${request.type || 'theoretical'}`;
    }
    const result = await apiRequest<{ success: boolean; data?: T }>(`/api/${kind}/chapter?${query}`);
    if (!result.data) {
        throw new Error('This chapter is not available yet.');
    }
    return result.data;
}

// Images in study material are served by the backend under /study-material-assets.
export function assetUrl(source: string): string {
    const trimmed = source.trim();
    if (/^https?:\/\//i.test(trimmed) || trimmed.startsWith('data:')) {
        return trimmed;
    }
    return `${API_BASE_URL}/study-material-assets/${trimmed.replace(/\\/g, '/').replace(/^\/+/, '')}`;
}