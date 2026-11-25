/**
 * profileApi.ts
 *
 * All profile-related API calls for the Edit Profile screen.
 * Uses the existing apiRequest() helper and session service.
 *
 * Endpoints:
 *   GET  /api/auth/profile              → fetch current profile
 *   PUT  /api/auth/profile              → update profile
 *   PUT  /api/auth/profile/change-password → change password
 */

import { apiRequest } from './api';
import { getSession } from './session';

// ─── Response shapes ─────────────────────────────────────────────────────────

export interface ProfileResponse {
    success: boolean;
    message?: string;
    user?: BackendUser;
    roleProfile?: BackendRoleProfile;
}

export interface UpdateProfileResponse {
    success: boolean;
    message?: string;
    user?: BackendUser;
}

export interface ChangePasswordResponse {
    success: boolean;
    message: string;
}

// Basic user fields returned by GET /api/auth/profile
export interface BackendUser {
    id?: string;
    _id?: string;
    name?: string;
    email?: string;
    mobile?: string;
    category?: string;
    userType?: string;
    accountType?: string;
    verified?: boolean;
    // Student-level fields that may live on the user document
    board?: string;
    classStandard?: string | number;
    stream?: string;
    medium?: string;
    schoolName?: string;
    city?: string;
    state?: string;
    dateOfBirth?: string;
    targetExams?: string | string[];
    targetDegree?: string;
    parentName?: string;
    parentMobile?: string;
    parentEmail?: string;
    relationship?: string;
    academicPattern?: string;
    termsCompleted?: string | number;
    semestersCompleted?: string | number;
    annualProgress?: string;
    learningSources?: string | string[];
    otherLearningSource?: string;
    primaryLearningSource?: string;
    timetable?: BackendStudentTimetable;
    exams?: BackendExamRecord[];
}

// Role-specific profile document (may be separate from user doc)
export interface BackendRoleProfile {
    // Teacher fields
    teacherType?: string | string[];
    teachingMode?: string | string[];
    teachingLanguages?: string | string[];
    teacherState?: string;
    teacherCity?: string;
    pincode?: string | number;
    institutions?: string | string[];
    boardsTeach?: string | string[];
    educationLevels?: string | string[];
    classesTeach?: string | string[];
    subjectsTeach?: string | string[];
    otherLevelDetail?: string;
    totalSubjects?: number;
    classesByLevel?: Record<string, unknown>;
    teacherTimetable?: BackendStudentTimetable[];
    // Employee fields
    educationLevel?: string;
    educationDegree?: string;
    experience?: string;
    industry?: string;
    employeeRole?: string;
    dayToDayTasks?: string;
    useGenerativeAI?: boolean;
    howCanWeHelp?: string;
    careerTarget?: string;
}

export interface BackendStudentTimetable {
    timetableType?: string;
    monday?: BackendDaySlots;
    tuesday?: BackendDaySlots;
    wednesday?: BackendDaySlots;
    thursday?: BackendDaySlots;
    friday?: BackendDaySlots;
    saturday?: BackendDaySlots;
    sunday?: BackendDaySlots;
}

export interface BackendDaySlots {
    slot1?: string;
    slot2?: string;
    slot3?: string;
    slot4?: string;
    slot5?: string;
    slot6?: string;
    slot7?: string;
    slot8?: string;
    slot9?: string;
    slot10?: string;
    slot11?: string;
    slot12?: string;
    slot13?: string;
    slot14?: string;
    slot15?: string;
}

export interface BackendExamRecord {
    _id?: string;
    examName?: string;
    subject?: string;
    totalMarks?: number;
    obtainedMarks?: number;
    grade?: string;
    semester?: string;
    examDate?: string;
    digilockerLink?: string;
    digilockerUrl?: string;
}

// ─── Token helper ─────────────────────────────────────────────────────────────

function authHeader(): Record<string, string> {
    const { token } = getSession();
    if (!token) {
        throw new Error('Not authenticated. Please log in again.');
    }
    return { Authorization: `Bearer ${token}` };
}

// ─── API calls ────────────────────────────────────────────────────────────────

export function fetchProfile(): Promise<ProfileResponse> {
    return apiRequest<ProfileResponse>('/api/auth/profile', {
        headers: authHeader(),
    });
}

export function updateProfile(payload: Record<string, unknown>): Promise<UpdateProfileResponse> {
    return apiRequest<UpdateProfileResponse>('/api/auth/profile', {
        method: 'PUT',
        headers: authHeader(),
        body: JSON.stringify(payload),
    });
}

export function changePassword(body: {
    currentPassword: string;
    newPassword: string;
    confirmPassword: string;
}): Promise<ChangePasswordResponse> {
    return apiRequest<ChangePasswordResponse>('/api/auth/profile/change-password', {
        method: 'PUT',
        headers: authHeader(),
        body: JSON.stringify(body),
    });
}

// ─── Data conversion helpers ──────────────────────────────────────────────────

function t(value: unknown): string {
    return typeof value === 'string' ? value.trim() : '';
}

/** Pipe-joined frontend string ↔ backend string array */
export function arrayToPipe(arr: string[]): string {
    return arr.filter(Boolean).join('|');
}

export function pipeToArray(pipe: string | string[] | undefined): string[] {
    if (Array.isArray(pipe)) return pipe.filter(Boolean);
    if (typeof pipe === 'string') return pipe.split('|').filter(Boolean);
    return [];
}

/** "Class 10" → "10"  |  "10" → "10"  |  number → string */
export function classStandardToBackend(uiValue: string): string {
    return uiValue.replace(/^Class\s*/i, '').trim();
}

/** "10" → "Class 10" */
export function classStandardToUi(backendValue: string | number | undefined): string {
    if (backendValue === undefined || backendValue === null || backendValue === '') return '';
    const str = String(backendValue).trim();
    if (!str) return '';
    // If it already has "Class" prefix, return as-is
    if (/^class\s/i.test(str)) return str;
    return `Class ${str}`;
}

/** Backend ISO date → "DD/MM/YYYY" for display */
export function isoToDisplay(iso: string | undefined): string {
    if (!iso) return '';
    // Try ISO format: 1990-01-15
    const m = iso.match(/^(\d{4})-(\d{2})-(\d{2})/);
    if (m) return `${m[3]}/${m[2]}/${m[1]}`;
    return iso;
}

/** "DD/MM/YYYY" → ISO "YYYY-MM-DD" */
export function displayToIso(display: string): string | undefined {
    const v = display.trim();
    if (!v) return undefined;
    const parts = v.split('/');
    if (parts.length === 3) {
        const [day, month, year] = parts;
        if (year && year.length === 4) {
            return `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`;
        }
    }
    return v;
}

// ─── Student timetable conversion ─────────────────────────────────────────────

/**
 * UI timetable format:
 *   Record<TimetableCategory, Record<TimetableDay, TimeSlot[]>>
 *   where TimetableCategory = 'CLASS' | 'HOBBY' | 'SPORTS' | 'SELF STUDY'
 *   and   TimetableDay      = 'MON' | 'TUE' | 'WED' | 'THU' | 'FRI' | 'SAT' | 'SUN'
 *   and   TimeSlot          = { id, title, startTime, endTime }
 *
 * Backend timetable format (from authApi.ts buildTimetable):
 *   { timetableType: 'class', monday: { slot1: "CLASS: Math | 09:00-10:00" }, ... }
 *
 * Each slot is a text string: "{category}: {title} | {startTime}-{endTime}"
 */

export type FrontendTimetableCategory = 'CLASS' | 'HOBBY' | 'SPORTS' | 'SELF STUDY';
export type FrontendTimetableDay = 'MON' | 'TUE' | 'WED' | 'THU' | 'FRI' | 'SAT' | 'SUN';
export type FrontendTimeSlot = { id: string; title: string; startTime: string; endTime: string };
export type FrontendTimetable = Record<FrontendTimetableCategory, Record<FrontendTimetableDay, FrontendTimeSlot[]>>;

const DAY_UI_TO_BACKEND: Record<FrontendTimetableDay, string> = {
    MON: 'monday',
    TUE: 'tuesday',
    WED: 'wednesday',
    THU: 'thursday',
    FRI: 'friday',
    SAT: 'saturday',
    SUN: 'sunday',
};

const DAY_BACKEND_TO_UI: Record<string, FrontendTimetableDay> = {
    monday: 'MON',
    tuesday: 'TUE',
    wednesday: 'WED',
    thursday: 'THU',
    friday: 'FRI',
    saturday: 'SAT',
    sunday: 'SUN',
};

const CATEGORY_UI_DAYS: FrontendTimetableDay[] = ['MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT', 'SUN'];
const CATEGORY_UI_CATS: FrontendTimetableCategory[] = ['CLASS', 'HOBBY', 'SPORTS', 'SELF STUDY'];

/** Build empty frontend timetable structure for one role */
export function createEmptyRoleTimetable(): FrontendTimetable {
    const cats = {} as FrontendTimetable;
    for (const cat of CATEGORY_UI_CATS) {
        const days = {} as Record<FrontendTimetableDay, FrontendTimeSlot[]>;
        for (const day of CATEGORY_UI_DAYS) {
            days[day] = [];
        }
        cats[cat] = days;
    }
    return cats;
}

/**
 * Convert frontend timetable → backend format for student.
 * Slot text: "{CATEGORY}: {title} | {startTime}-{endTime}"
 * Returns undefined if all slots are empty (safe: won't erase backend data).
 */
export function uiTimetableToBackend(uiTimetable: FrontendTimetable): BackendStudentTimetable | undefined {
    const grid: BackendStudentTimetable = {};
    let hasAny = false;

    for (const cat of CATEGORY_UI_CATS) {
        for (const day of CATEGORY_UI_DAYS) {
            const slots = uiTimetable[cat][day];
            if (slots.length === 0) continue;

            const backendDay = DAY_UI_TO_BACKEND[day] as keyof BackendStudentTimetable;
            if (!grid[backendDay]) {
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                (grid as any)[backendDay] = {};
            }
            const dayGrid = grid[backendDay] as BackendDaySlots;

            // Count existing slots for this day across categories
            const existingCount = Object.keys(dayGrid).length;
            slots.forEach((slot, i) => {
                const slotNum = existingCount + i + 1;
                if (slotNum > 15) return; // backend max
                const slotText = `${cat}: ${slot.title.trim()}${slot.startTime || slot.endTime ? ` | ${slot.startTime.trim()}-${slot.endTime.trim()}` : ''}`;
                (dayGrid as Record<string, string>)[`slot${slotNum}`] = slotText;
                hasAny = true;
            });
        }
    }

    if (!hasAny) return undefined;
    return { timetableType: 'class', ...grid };
}

/**
 * Convert backend timetable → frontend timetable structure.
 * Parses slot text: "{CATEGORY}: {title} | {startTime}-{endTime}"
 */
export function backendTimetableToUi(backend: BackendStudentTimetable | undefined): FrontendTimetable {
    const result = createEmptyRoleTimetable();
    if (!backend) return result;

    for (const [backendDayKey, daySlots] of Object.entries(backend)) {
        if (backendDayKey === 'timetableType' || !daySlots || typeof daySlots !== 'object') continue;
        const uiDay = DAY_BACKEND_TO_UI[backendDayKey];
        if (!uiDay) continue;

        for (const [, slotText] of Object.entries(daySlots as Record<string, string>)) {
            if (!slotText || typeof slotText !== 'string') continue;

            // Parse: "CATEGORY: title | startTime-endTime"
            let category: FrontendTimetableCategory = 'CLASS';
            let title = slotText;
            let startTime = '';
            let endTime = '';

            // Extract category prefix
            const catMatch = slotText.match(/^(CLASS|HOBBY|SPORTS|SELF STUDY):\s*(.*)/i);
            if (catMatch) {
                const rawCat = catMatch[1].toUpperCase();
                if (rawCat === 'CLASS' || rawCat === 'HOBBY' || rawCat === 'SPORTS' || rawCat === 'SELF STUDY') {
                    category = rawCat as FrontendTimetableCategory;
                }
                title = catMatch[2];
            }

            // Extract time range: "title | 09:00-10:00"
            const timeSep = title.lastIndexOf(' | ');
            if (timeSep !== -1) {
                const timePart = title.slice(timeSep + 3);
                title = title.slice(0, timeSep);
                const dashIdx = timePart.indexOf('-');
                if (dashIdx !== -1) {
                    startTime = timePart.slice(0, dashIdx).trim();
                    endTime = timePart.slice(dashIdx + 1).trim();
                }
            }

            const slots = result[category][uiDay];
            if (slots.length < 15) {
                slots.push({
                    id: `loaded-${backendDayKey}-${category}-${slots.length}-${Date.now()}`,
                    title: title.trim(),
                    startTime,
                    endTime,
                });
            }
        }
    }

    return result;
}

// ─── Teacher timetable conversion ─────────────────────────────────────────────
// Backend TeacherTimetable schema (models/teacherTimetable.js & profileController.js):
//   GET  returns array of docs: [{ timetableType: "class"|"hobby"|"sports"|"selfStudy", monday: { slot1..slot15 }, ... }]
//   PUT  expects array of entries (max 4, unique timetableType) passed to saveTimetable(TeacherTimetable, userId, entries).

const TEACHER_CAT_UI_TO_BACKEND: Record<FrontendTimetableCategory, 'class' | 'hobby' | 'sports' | 'selfStudy'> = {
    CLASS: 'class',
    HOBBY: 'hobby',
    SPORTS: 'sports',
    'SELF STUDY': 'selfStudy',
};

const TEACHER_CAT_BACKEND_TO_UI: Record<string, FrontendTimetableCategory> = {
    class: 'CLASS',
    hobby: 'HOBBY',
    sports: 'SPORTS',
    selfstudy: 'SELF STUDY',
    'self study': 'SELF STUDY',
};

/**
 * Extract the set of UI categories present in the loaded backend teacherTimetable array.
 */
export function getLoadedTeacherTimetableCategories(
    backend: BackendStudentTimetable[] | undefined,
): FrontendTimetableCategory[] {
    if (!Array.isArray(backend)) return [];
    const seen = new Set<FrontendTimetableCategory>();
    for (const doc of backend) {
        if (!doc || typeof doc !== 'object') continue;
        const rawType = typeof doc.timetableType === 'string' ? doc.timetableType.trim().toLowerCase() : '';
        const uiCat = TEACHER_CAT_BACKEND_TO_UI[rawType];
        if (uiCat) seen.add(uiCat);
    }
    return Array.from(seen);
}

/**
 * Convert FrontendTimetable → backend TeacherTimetable[] array:
 * [
 *   {
 *     timetableType: "class" | "hobby" | "sports" | "selfStudy",
 *     monday: { slot1: "Title | 09:00 AM-10:00 AM", ... },
 *     ...
 *     sunday: { ... }
 *   }
 * ]
 * Preserves all existing categories from `preservedCategories` even if their slots are currently empty,
 * so `saveTimetable`'s `deleteMany({ timetableType: { $nin: types } })` does not accidentally delete them.
 */
export function uiTimetableToTeacherBackend(
    uiTimetable: FrontendTimetable,
    preservedCategories: FrontendTimetableCategory[] = [],
): BackendStudentTimetable[] | undefined {
    const entries: BackendStudentTimetable[] = [];
    const preservedSet = new Set(preservedCategories);

    for (const cat of CATEGORY_UI_CATS) {
        let catHasSlots = false;
        const entry: BackendStudentTimetable = {
            timetableType: TEACHER_CAT_UI_TO_BACKEND[cat],
        };

        for (const day of CATEGORY_UI_DAYS) {
            const slots = uiTimetable[cat][day];
            const backendDay = DAY_UI_TO_BACKEND[day] as keyof BackendStudentTimetable;
            const daySlots: Record<string, string> = {};

            slots.slice(0, 15).forEach((slot, idx) => {
                const title = slot.title.trim();
                if (!title) return;
                const start = slot.startTime.trim();
                const end = slot.endTime.trim();
                const slotText = start || end ? `${title} | ${start}-${end}` : title;
                daySlots[`slot${idx + 1}`] = slotText;
                catHasSlots = true;
            });

            if (Object.keys(daySlots).length > 0) {
                (entry as Record<string, unknown>)[backendDay] = daySlots;
            }
        }

        if (catHasSlots || preservedSet.has(cat)) {
            entries.push(entry);
        }
    }

    return entries.length > 0 ? entries : undefined;
}

/**
 * Convert backend TeacherTimetable[] array → FrontendTimetable for EditProfileView UI.
 */
export function teacherBackendToUiTimetable(
    backend: BackendStudentTimetable[] | undefined,
): FrontendTimetable {
    const result = createEmptyRoleTimetable();
    if (!Array.isArray(backend)) return result;

    for (const doc of backend) {
        if (!doc || typeof doc !== 'object') continue;
        const rawType = typeof doc.timetableType === 'string' ? doc.timetableType.trim().toLowerCase() : '';
        const cat = TEACHER_CAT_BACKEND_TO_UI[rawType];
        if (!cat) continue;

        for (const [backendDayKey, daySlots] of Object.entries(doc)) {
            if (backendDayKey === 'timetableType' || !daySlots || typeof daySlots !== 'object') continue;
            const uiDay = DAY_BACKEND_TO_UI[backendDayKey];
            if (!uiDay) continue;

            // Process slots in numeric order slot1..slot15
            for (let i = 1; i <= 15; i++) {
                const rawSlot = (daySlots as Record<string, unknown>)[`slot${i}`];
                if (typeof rawSlot !== 'string' || !rawSlot.trim()) continue;
                if (result[cat][uiDay].length >= 15) break;

                let title = rawSlot.trim();
                let startTime = '';
                let endTime = '';

                // Strip optional category prefix if present (e.g. "CLASS: Math | 09:00-10:00")
                const catPrefix = title.match(/^(CLASS|HOBBY|SPORTS|SELF STUDY):\s*(.*)/i);
                if (catPrefix) {
                    title = catPrefix[2].trim();
                }

                // Extract "title | start-end" or "title (start-end)"
                const pipeSep = title.lastIndexOf(' | ');
                if (pipeSep !== -1) {
                    const timePart = title.slice(pipeSep + 3);
                    title = title.slice(0, pipeSep).trim();
                    const dashIdx = timePart.indexOf('-');
                    if (dashIdx !== -1) {
                        startTime = timePart.slice(0, dashIdx).trim();
                        endTime = timePart.slice(dashIdx + 1).trim();
                    }
                } else {
                    const parenMatch = title.match(/^(.*)\s+\(([^-]+)-([^)]+)\)$/);
                    if (parenMatch) {
                        title = parenMatch[1].trim();
                        startTime = parenMatch[2].trim();
                        endTime = parenMatch[3].trim();
                    }
                }

                result[cat][uiDay].push({
                    id: `loaded-teacher-${rawType}-${backendDayKey}-slot${i}-${Date.now()}`,
                    title,
                    startTime,
                    endTime,
                });
            }
        }
    }

    return result;
}

// ─── Exam record conversion ───────────────────────────────────────────────────

export interface FrontendExamRecord {
    _id?: string;       // preserve existing backend _id
    examName: string;
    subject: string;
    totalMarks: string;
    obtainedMarks: string;
    grade: string;
    semester: string;
    examDate: string;   // "DD/MM/YYYY" in UI
    digilockerUrl: string;
}

export function backendExamToUi(exam: BackendExamRecord): FrontendExamRecord {
    return {
        _id: exam._id,
        examName: t(exam.examName),
        subject: t(exam.subject),
        totalMarks: exam.totalMarks !== undefined ? String(exam.totalMarks) : '',
        obtainedMarks: exam.obtainedMarks !== undefined ? String(exam.obtainedMarks) : '',
        grade: t(exam.grade),
        semester: t(exam.semester),
        examDate: isoToDisplay(exam.examDate),
        digilockerUrl: t(exam.digilockerLink ?? exam.digilockerUrl),
    };
}

export function uiExamsToBackend(exams: FrontendExamRecord[]): Record<string, unknown>[] {
    return exams.map(e => ({
        ...(e._id ? { _id: e._id } : {}),
        examName: e.examName.trim() || undefined,
        subject: e.subject.trim() || undefined,
        totalMarks: e.totalMarks ? Number(e.totalMarks) : undefined,
        obtainedMarks: e.obtainedMarks ? Number(e.obtainedMarks) : undefined,
        grade: e.grade.trim() || undefined,
        semester: e.semester.trim() || undefined,
        examDate: displayToIso(e.examDate),
        digilockerLink: e.digilockerUrl.trim() || undefined,
    }));
}

// ─── Profile payload builders ─────────────────────────────────────────────────

function orUndefined(v: string): string | undefined {
    return v.trim() === '' ? undefined : v.trim();
}

function strList(pipe: string | undefined): string[] {
    return pipeToArray(pipe);
}

/**
 * Build the PUT /api/auth/profile body for a Student.
 * Never includes email, mobile, role, or category (backend rejects these as immutable).
 * Only includes timetable if hasUpdatedTimetable=true (prevents erasing existing data).
 */
export function buildStudentPayload(
    form: Record<string, string>,
    timetable: FrontendTimetable,
    exams: FrontendExamRecord[],
    hasUpdatedTimetable: boolean,
    hasUpdatedExams: boolean,
): Record<string, unknown> {
    const payload: Record<string, unknown> = {
        name: form.name?.trim() || undefined,

        // Student Details
        board: orUndefined(form.board ?? ''),
        classStandard: classStandardToBackend(form.classStandard ?? ''),
        medium: orUndefined(form.medium ?? ''),
        schoolName: orUndefined(form.schoolName ?? ''),
        city: orUndefined(form.city ?? ''),
        state: orUndefined(form.state ?? ''),
        dateOfBirth: displayToIso(form.dateOfBirth ?? ''),
        stream: orUndefined(form.stream ?? ''),
        targetExams: strList(form.targetExams),
        targetDegree: orUndefined(form.targetDegree ?? ''),

        // Parent Details
        parentName: orUndefined(form.parentName ?? ''),
        parentMobile: orUndefined(form.parentMobile ?? ''),
        parentEmail: orUndefined(form.parentEmail ?? ''),
        relationship: orUndefined(form.relationship ?? ''),

        // Portion / Academic Details
        academicPattern: orUndefined(form.academicPattern ?? ''),
        annualProgress: orUndefined(form.annualProgress ?? ''),
        learningSources: strList(form.learningSources),
        otherLearningSource: orUndefined(form.otherLearningSource ?? ''),
        primaryLearningSource: orUndefined(form.primaryLearningSource ?? ''),
    };

    // Progress field: only include the one matching academic pattern
    const pattern = (form.academicPattern ?? '').toLowerCase();
    if (pattern === 'term') {
        payload.termsCompleted = form.termsCompleted ?? undefined;
    } else if (pattern === 'semester') {
        payload.semestersCompleted = form.semestersCompleted ?? undefined;
    }
    // annual: use annualProgress (already set above)

    // Timetable: only send if user intentionally edited it
    if (hasUpdatedTimetable) {
        const backendTimetable = uiTimetableToBackend(timetable);
        if (backendTimetable) {
            payload.timetable = backendTimetable;
        }
    }

    // Exams: only send if user intentionally edited them
    if (hasUpdatedExams && exams.length > 0) {
        payload.exams = uiExamsToBackend(exams);
    }

    return payload;
}

/**
 * Build the PUT /api/auth/profile body for a Teacher.
 * Must always include the complete teacher profile to avoid backend defaults
 * overwriting omitted fields.
 */
export function buildTeacherPayload(
    form: Record<string, string>,
    timetable: FrontendTimetable,
    hasUpdatedTimetable: boolean,
    preservedTimetableCategories: FrontendTimetableCategory[] = [],
): Record<string, unknown> {
    const payload: Record<string, unknown> = {
        name: form.name?.trim() || undefined,

        // Teacher Profile step
        teacherType: orUndefined(form.teacherType ?? '') ? [form.teacherType!.trim()] : strList(form.teacherType),
        teachingMode: orUndefined(form.teachingMode ?? '') ? [form.teachingMode!.trim()] : strList(form.teachingMode),
        teachingLanguages: strList(form.teachingLanguages),

        // Location & Boards step
        teacherState: orUndefined(form.teacherState ?? ''),
        teacherCity: orUndefined(form.teacherCity ?? ''),
        pincode: orUndefined(form.pincode ?? ''),
        institutions: form.institutions?.trim()
            ? form.institutions.split(',').map(s => s.trim()).filter(Boolean)
            : [],
        boardsTeach: strList(form.boardsTeach),

        // Levels, Classes & Subjects step
        educationLevels: strList(form.educationLevels),
        otherLevelDetail: orUndefined(form.otherLevelDetail ?? ''),
        classesTeach: form.classesTeach?.trim()
            ? form.classesTeach.split(',').map(s => s.trim()).filter(Boolean)
            : [],
        subjectsTeach: form.subjectsTeach?.trim()
            ? form.subjectsTeach.split(',').map(s => s.trim()).filter(Boolean)
            : [],
    };

    // Single-value fields stored without pipe in form but backend may expect string
    if (form.teacherType && !form.teacherType.includes('|')) {
        payload.teacherType = [form.teacherType.trim()].filter(Boolean);
    } else {
        payload.teacherType = strList(form.teacherType);
    }
    if (form.teachingMode && !form.teachingMode.includes('|')) {
        payload.teachingMode = [form.teachingMode.trim()].filter(Boolean);
    } else {
        payload.teachingMode = strList(form.teachingMode);
    }

    if (hasUpdatedTimetable) {
        const backendTimetable = uiTimetableToTeacherBackend(
            timetable,
            preservedTimetableCategories,
        );
        if (backendTimetable) {
            payload.teacherTimetable = backendTimetable;
        }
    }

    return payload;
}

/**
 * Build the PUT /api/auth/profile body for an Employee.
 * Must always include complete employee profile.
 */
export function buildEmployeePayload(form: Record<string, string>): Record<string, unknown> {
    return {
        name: form.name?.trim() || undefined,
        educationLevel: orUndefined(form.educationLevel ?? ''),
        educationDegree: orUndefined(form.educationDegree ?? ''),
        experience: orUndefined(form.experience ?? ''),
        industry: orUndefined(form.industry ?? ''),
        employeeRole: orUndefined(form.employeeRole ?? ''),
        dayToDayTasks: orUndefined(form.dayToDayTasks ?? ''),
        useGenerativeAI: form.useGenerativeAI === 'Yes',
        howCanWeHelp: orUndefined(form.howCanWeHelp ?? ''),
        careerTarget: orUndefined(form.careerTarget ?? ''),
    };
}

// ─── Profile data → form state ────────────────────────────────────────────────

/**
 * Populate form fields from GET /api/auth/profile response.
 * Does NOT overwrite email, mobile, or role.
 */
export function profileToFormState(
    profileData: ProfileResponse,
): Record<string, string> {
    const user = profileData.user ?? {};
    const rp = profileData.roleProfile ?? {};

    // Determine role
    const categoryRaw = t(user.category);
    const catLower = categoryRaw.toLowerCase();
    const isTeacher = catLower === 'teacher';
    const isEmployee = catLower === 'employee';

    const form: Record<string, string> = {
        // Basic info (always present)
        name: t(user.name),
        email: t(user.email),
        mobile: t(user.mobile),
    };

    if (!isTeacher && !isEmployee) {
        // Student fields
        form.board = t(user.board);
        form.classStandard = classStandardToUi(user.classStandard);
        form.medium = t(user.medium);
        form.schoolName = t(user.schoolName);
        form.city = t(user.city);
        form.state = t(user.state);
        form.dateOfBirth = isoToDisplay(user.dateOfBirth);
        form.stream = t(user.stream);
        form.targetExams = arrayToPipe(
            Array.isArray(user.targetExams)
                ? user.targetExams
                : pipeToArray(user.targetExams as string | undefined),
        );
        form.targetDegree = t(user.targetDegree);

        form.parentName = t(user.parentName);
        form.parentMobile = t(user.parentMobile);
        form.parentEmail = t(user.parentEmail);
        form.relationship = t(user.relationship);

        form.academicPattern = t(user.academicPattern);
        form.termsCompleted = user.termsCompleted !== undefined ? String(user.termsCompleted) : '';
        form.semestersCompleted = user.semestersCompleted !== undefined ? String(user.semestersCompleted) : '';
        form.annualProgress = t(user.annualProgress);
        form.learningSources = arrayToPipe(
            Array.isArray(user.learningSources)
                ? user.learningSources
                : pipeToArray(user.learningSources as string | undefined),
        );
        form.otherLearningSource = t(user.otherLearningSource);
        form.primaryLearningSource = t(user.primaryLearningSource);
    } else if (isTeacher) {
        // Teacher fields from roleProfile
        const rArr = (v: string | string[] | undefined) =>
            Array.isArray(v) ? arrayToPipe(v) : t(v);

        form.teacherType = rArr(rp.teacherType as string | string[] | undefined);
        form.teachingMode = rArr(rp.teachingMode as string | string[] | undefined);
        form.teachingLanguages = rArr(rp.teachingLanguages as string | string[] | undefined);

        form.teacherState = t(rp.teacherState);
        form.teacherCity = t(rp.teacherCity);
        form.pincode = rp.pincode !== undefined ? String(rp.pincode) : '';
        form.institutions = Array.isArray(rp.institutions)
            ? (rp.institutions as string[]).join(', ')
            : t(rp.institutions as string | undefined);
        form.boardsTeach = rArr(rp.boardsTeach as string | string[] | undefined);

        form.educationLevels = rArr(rp.educationLevels as string | string[] | undefined);
        form.otherLevelDetail = t(rp.otherLevelDetail);
        form.classesTeach = Array.isArray(rp.classesTeach)
            ? (rp.classesTeach as string[]).join(', ')
            : t(rp.classesTeach as string | undefined);
        form.subjectsTeach = Array.isArray(rp.subjectsTeach)
            ? (rp.subjectsTeach as string[]).join(', ')
            : t(rp.subjectsTeach as string | undefined);
    } else if (isEmployee) {
        // Employee fields from roleProfile
        form.educationLevel = t(rp.educationLevel);
        form.educationDegree = t(rp.educationDegree);
        form.experience = t(rp.experience);
        form.industry = t(rp.industry);
        form.employeeRole = t(rp.employeeRole);
        form.dayToDayTasks = t(rp.dayToDayTasks);
        form.useGenerativeAI = rp.useGenerativeAI === true ? 'Yes' : rp.useGenerativeAI === false ? 'No' : '';
        form.howCanWeHelp = t(rp.howCanWeHelp);
        form.careerTarget = t(rp.careerTarget);
    }

    return form;
}
