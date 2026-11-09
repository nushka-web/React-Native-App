import { Platform } from 'react-native';

import { apiRequest } from './api';

export interface LoginRequest {
    email: string;
    password: string;
}

export interface LoginResponse {
    success: boolean;
    message: string;
    toastMessage?: string;
    token?: string;
    user?: {
        id: string;
        name: string;
        email: string;
        mobile?: string;
        verified: boolean;
        category: string;
        userType: string;
        accountType: string;
        status: string;
        tokens: number;
        balance: number;
    };
}

export function loginUser(data: LoginRequest) {
    return apiRequest<LoginResponse>('/api/auth/login', {
        method: 'POST',
        body: JSON.stringify(data),
    });
}

// ── Registration ──────────────────────────────────────────────────────────────
// Endpoint: POST /api/auth/register (confirmed in the backend: src/routes/auth.js).
//
// RegisterScreen sends its own field names. The backend expects different names
// and formats, so buildRegisterBody() translates the screen payload into the
// backend contract. All translation lives here; the screens stay unchanged.

export interface RegisterResponse {
    success: boolean;
    message: string;
    toastMessage?: string;
    token?: string;
    user?: {
        id: string;
        email: string;
        name: string;
        verified: boolean;
        companyCode?: number | string;
    };
    // Returned for Educational Institute registrations (used for the optional file upload).
    companyCode?: number | string;
    educationalInstituteProfile?: {
        companyCode?: number | string;
    };
}

type TimetableItem = {
    day?: string;
    activityType?: string;
    title?: string;
    optionalSubjects?: string[];
    organization?: string;
    notes?: string;
};

type AcademicRecordItem = {
    examName?: string;
    subject?: string;
    totalMarks?: string;
    obtainedMarks?: string;
    grade?: string;
    semester?: string;
    examDate?: string;
    digilockerUrl?: string;
};

const DAY_KEYS: Record<string, string> = {
    Mon: 'monday',
    Tue: 'tuesday',
    Wed: 'wednesday',
    Thu: 'thursday',
    Fri: 'friday',
    Sat: 'saturday',
    Sun: 'sunday',
};

// The backend stores a weekly grid with slot1..slot15 per day.
const MAX_SLOTS_PER_DAY = 15;

function text(value: unknown): string {
    return typeof value === 'string' ? value.trim() : '';
}

function orUndefined(value: string): string | undefined {
    return value === '' ? undefined : value;
}

// A list of non-empty strings (used for the teacher checkboxes and chips).
function stringList(value: unknown): string[] {
    if (!Array.isArray(value)) {
        return [];
    }
    return value
        .map(v => text(v))
        .filter(v => v !== '');
}

// Backend expects exactly 10 digits: no "+91", spaces or dashes.
function tenDigits(value: unknown): string {
    let v = text(value);
    if (v.startsWith('+91')) {
        v = v.slice(3);
    }
    return v.replace(/\D/g, '');
}

// The screen stores dates as mm/dd/yyyy; the backend stores real dates.
function toIsoDate(value: unknown): string | undefined {
    const v = text(value);
    if (!v) {
        return undefined;
    }
    const parts = v.split('/');
    if (parts.length !== 3) {
        return v;
    }
    const [month, day, year] = parts;
    return `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`;
}

function toNumber(value: unknown): number | undefined {
    const v = text(value);
    if (v === '') {
        return undefined;
    }
    const n = Number(v);
    return Number.isNaN(n) ? undefined : n;
}

// "teacher" -> "Teacher". The backend role list is case-sensitive.
function mapRole(value: unknown): string {
    const v = text(value);
    return v ? v.charAt(0).toUpperCase() + v.slice(1) : '';
}

// "Free - Basic Features" -> "free", "Premium - All Features" -> "paid"
function mapSubscription(value: unknown): string {
    const v = text(value).toLowerCase();
    if (v.startsWith('free')) {
        return 'free';
    }
    if (v.startsWith('premium') || v.startsWith('paid')) {
        return 'paid';
    }
    return v;
}

// The backend stores accountType as private | company | ngo only.
// "Business Account" has no exact match, so it maps to "Company" for now.
// This needs a decision from the backend owner.
function mapAccountCategory(value: unknown): string {
    const v = text(value).toLowerCase();
    if (v.startsWith('private')) {
        return 'Private';
    }
    if (v.startsWith('business') || v.startsWith('company')) {
        return 'Company';
    }
    if (v.startsWith('ngo')) {
        return 'NGO';
    }
    return text(value);
}

function describeActivity(item: TimetableItem): string {
    const parts = [`${text(item.activityType)}: ${text(item.title)}`];
    if (item.optionalSubjects && item.optionalSubjects.length > 0) {
        parts.push(`Optional: ${item.optionalSubjects.join(', ')}`);
    }
    if (text(item.organization)) {
        parts.push(`@ ${text(item.organization)}`);
    }
    if (text(item.notes)) {
        parts.push(`Notes: ${text(item.notes)}`);
    }
    return parts.join(' | ');
}

// Screen timetable: a flat list of activities (day, type, title, notes...).
// Backend timetable: one weekly grid of text slots per day. Every activity is
// written into the next free slot of its day as readable text.
function buildTimetable(items: unknown): Record<string, unknown> | undefined {
    if (!Array.isArray(items) || items.length === 0) {
        return undefined;
    }

    const grid: Record<string, Record<string, string>> = {};
    const counts: Record<string, number> = {};

    (items as TimetableItem[]).forEach(item => {
        const dayKey = DAY_KEYS[text(item.day)];
        if (!dayKey) {
            return;
        }
        const used = counts[dayKey] ?? 0;
        if (used >= MAX_SLOTS_PER_DAY) {
            console.warn(`Timetable: more than ${MAX_SLOTS_PER_DAY} activities on ${dayKey}; extra ignored.`);
            return;
        }
        counts[dayKey] = used + 1;
        grid[dayKey] = grid[dayKey] ?? {};
        grid[dayKey][`slot${used + 1}`] = describeActivity(item);
    });

    if (Object.keys(grid).length === 0) {
        return undefined;
    }

    return { timetableType: 'class', ...grid };
}

function buildExams(records: unknown): Record<string, unknown>[] | undefined {
    if (!Array.isArray(records) || records.length === 0) {
        return undefined;
    }
    return (records as AcademicRecordItem[]).map(r => ({
        examName: orUndefined(text(r.examName)),
        subject: orUndefined(text(r.subject)),
        totalMarks: toNumber(r.totalMarks),
        obtainedMarks: toNumber(r.obtainedMarks),
        grade: orUndefined(text(r.grade)),
        semester: orUndefined(text(r.semester)),
        examDate: toIsoDate(r.examDate),
        digilockerLink: orUndefined(text(r.digilockerUrl)),
    }));
}

// Teacher timetable: the screen already builds the backend format
// { "CLASS-MON": { lectures: ["8-A, Mathematics"] } }, so it is only cleaned here.
function buildTeacherTimetable(value: unknown): Record<string, { lectures: string[] }> | undefined {
    if (!value || typeof value !== 'object' || Array.isArray(value)) {
        return undefined;
    }
    const result: Record<string, { lectures: string[] }> = {};
    Object.entries(value as Record<string, { lectures?: unknown }>).forEach(([key, entry]) => {
        const lectures = stringList(entry?.lectures);
        if (lectures.length > 0) {
            result[key] = { lectures };
        }
    });
    return Object.keys(result).length > 0 ? result : undefined;
}

// Teacher steps 3 to 7. Sent only when the role is Teacher.
function buildTeacherFields(p: Record<string, unknown>): Record<string, unknown> {
    return {
        // Step 3: Teacher Profile
        teacherType: stringList(p.teacherType),
        teachingMode: stringList(p.teachingMode),
        teachingLanguages: stringList(p.teachingLanguages),

        // Step 4: Location & Institution
        teacherState: text(p.teacherState),
        teacherCity: orUndefined(text(p.teacherCity)),
        institutions: stringList(p.institutions),
        boardsTeach: stringList(p.boardsTeach),

        // Step 5: Teaching Levels
        educationLevels: stringList(p.educationLevels),
        classesTeach: stringList(p.classesTeach),

        // Step 6: Subjects
        subjectsTeach: stringList(p.subjectsTeach),

        // Step 7: Teacher Timetable
        teacherTimetable: buildTeacherTimetable(p.teacherTimetable),
    };
}

// Employee steps 3 and 4. Sent only when the role is Employee.
function buildEmployeeFields(p: Record<string, unknown>): Record<string, unknown> {
    return {
        // Step 3: Education Details
        educationLevel: text(p.educationLevel),
        educationDegree: text(p.educationDegree),
        experience: text(p.experience),
        industry: text(p.industry),
        employeeRole: text(p.employeeRole),
        careerTarget: orUndefined(text(p.careerTarget)),

        // Step 4: Work Details
        dayToDayTasks: orUndefined(text(p.dayToDayTasks)),
        useGenerativeAI: p.useGenerativeAI === true,
        howCanWeHelp: orUndefined(text(p.howCanWeHelp)),
    };
}

// Company account with the Educational Institute role (3 steps).
function buildInstituteFields(p: Record<string, unknown>): Record<string, unknown> {
    return {
        isCompanyAccount: true,
        accountType: 'company',
        companyAccountRole: 'Educational Institute',
        isEducationalInstitute: true,
        companyName: text(p.instituteName) || text(p.companyName),

        instituteName: text(p.instituteName),
        instituteAddress: text(p.instituteAddress),
        instituteEmail: text(p.email).toLowerCase(),
        institutePassword: typeof p.password === 'string' ? p.password : '',
        instituteContact: tenDigits(p.mobile),
        academicLevels: stringList(p.academicLevels),
        stream: orUndefined(text(p.stream)),
        sports: orUndefined(text(p.sports)),
        noOfStudents: orUndefined(text(p.noOfStudents)),
        noOfTeachers: orUndefined(text(p.noOfTeachers)),
        modeOfEducation: text(p.modeOfEducation),

        // The institute pages have no Generative AI question, but the backend requires an
        // answer for institutes. The website sends "No" by default, so the app does the same.
        useGenerativeAI: false,
        useGenerativeAIModels: [],
    };
}

// Company account steps 3 to 5. Sent only for the Company flow.
// companyAccountRole is left blank on purpose: the backend treats "Educational Institute"
// as a separate institute registration that needs institute-only fields.
function buildCompanyFields(p: Record<string, unknown>): Record<string, unknown> {
    const usesAI = p.useGenerativeAI === true;
    return {
        isCompanyAccount: true,
        accountType: 'company',
        companyAccountRole: '',
        companyName: text(p.companyName),

        // Step 3
        companyWebsite: orUndefined(text(p.companyWebsite)),
        companyRole: text(p.companyJobRole),

        // Step 4
        companyIndustry: text(p.companyIndustry),
        companyHeadCount: text(p.companyHeadCount),

        // Step 5
        useGenerativeAI: usesAI,
        useGenerativeAIModels: usesAI ? stringList(p.useGenerativeAIModels) : [],
        howCanWeHelp: usesAI ? orUndefined(text(p.howCanWeHelp)) : undefined,
        dayToDayTasks: usesAI ? orUndefined(text(p.dayToDayTasks)) : undefined,
    };
}

export function buildRegisterBody(p: Record<string, unknown>): Record<string, unknown> {
    const role = mapRole(p.role);
    const isTeacher = role === 'Teacher';

    const common = {
        // Step 1
        name: text(p.fullName),
        email: text(p.email).toLowerCase(),
        mobile: tenDigits(p.mobile),
        password: typeof p.password === 'string' ? p.password : '',
        referralCode: orUndefined(text(p.referral)),
        couponCode: orUndefined(text(p.coupon)),
        role,
        termsAccepted: p.agreedToTerms === true,
        createdVia: Platform.OS === 'ios' ? 'ios' : 'android',

        // Step 2
        subscriptionType: mapSubscription(p.subscriptionType),
        accountCategory: mapAccountCategory(p.accountCategory),
    };

    if (p.isCompanyAccount === true && p.companyAccountRole === 'Educational Institute') {
        return {
            ...common,
            name: text(p.instituteName) || text(p.companyName),
            role: 'Corporate',
            ...buildInstituteFields(p),
        };
    }

    if (p.isCompanyAccount === true) {
        // The backend names the account after the company and files it under "Corporate".
        return {
            ...common,
            name: text(p.personalName),
            role: 'Corporate',
            ...buildCompanyFields(p),
        };
    }

    if (isTeacher) {
        return { ...common, ...buildTeacherFields(p) };
    }

    if (role === 'Employee') {
        return { ...common, ...buildEmployeeFields(p) };
    }

    return {
        ...common,

        // Step 3
        board: text(p.board),
        classStandard: text(p.educationClass),
        stream: text(p.stream),
        medium: text(p.medium),
        targetExams: stringList(p.targetExams),
        schoolName: text(p.schoolName),
        city: text(p.city),
        state: text(p.state),
        dateOfBirth: toIsoDate(p.dateOfBirth),

        // Step 4
        parentName: orUndefined(text(p.parentName)),
        parentMobile: orUndefined(tenDigits(p.parentMobile)),
        parentEmail: orUndefined(text(p.parentEmail).toLowerCase()),
        relationship: orUndefined(text(p.parentRelationship)),

        // Step 5
        timetable: buildTimetable(p.timetable),

        // Step 6
        exams: buildExams(p.academicRecords),

        // Step 7
        academicPattern: text(p.academicPattern),
        termsCompleted: p.termsCompleted,
        semestersCompleted: p.semestersCompleted,
        annualProgress: orUndefined(text(p.annualProgress)),
        learningSources: Array.isArray(p.learningSources) ? p.learningSources : [],
        otherLearningSource: orUndefined(text(p.otherLearningSource)),
        primaryLearningSource: orUndefined(text(p.primaryLearningSource)),
    };
}

export function registerUser(payload: Record<string, unknown>) {
    return apiRequest<RegisterResponse>('/api/auth/register', {
        method: 'POST',
        body: JSON.stringify(buildRegisterBody(payload)),
    });
}

// ── Educational Institute: bulk teacher / student list ───────────────────────
// POST /api/institute-upload/register/teachers | students  (multipart: file, companyCode, email)
// Called after registration succeeds, using the companyCode returned by the backend.

export type InstituteUploadKind = 'teachers' | 'students';

export function uploadInstituteFile(
    kind: InstituteUploadKind,
    file: { uri: string; name: string; type?: string },
    companyCode: number | string,
    email: string,
) {
    const form = new FormData();
    form.append('file', {
        uri: file.uri,
        name: file.name,
        type: file.type || 'application/octet-stream',
    } as unknown as Blob);
    form.append('companyCode', String(companyCode));
    form.append('email', text(email).toLowerCase());

    return apiRequest<BasicResponse>(`/api/institute-upload/register/${kind}`, {
        method: 'POST',
        body: form,
        headers: { 'Content-Type': 'multipart/form-data' },
    });
}

// ── Email verification ────────────────────────────────────────────────────────
// POST /api/auth/resend-verification  { email }

export interface BasicResponse {
    success: boolean;
    message: string;
    toastMessage?: string;
}

export function resendVerificationEmail(email: string) {
    return apiRequest<BasicResponse>('/api/auth/resend-verification', {
        method: 'POST',
        body: JSON.stringify({ email }),
    });
}

// ── Email availability ────────────────────────────────────────────────────────
// GET /api/auth/check-email?email=...  ->  { success, exists }

export interface CheckEmailResponse {
    success: boolean;
    exists?: boolean;
    message?: string;
    toastMessage?: string;
}

export function checkEmailExists(email: string) {
    return apiRequest<CheckEmailResponse>(`/api/auth/check-email?email=${encodeURIComponent(email)}`);
}