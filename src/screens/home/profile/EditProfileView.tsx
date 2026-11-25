
import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
    ActivityIndicator,
    Alert,
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
    Pressable,
    View,
} from 'react-native';

import type { SessionUser } from '../../../services/session';
import { setSession, getSession } from '../../../services/session';
import {
    fetchProfile,
    updateProfile,
    changePassword,
    profileToFormState,
    buildStudentPayload,
    buildTeacherPayload,
    buildEmployeePayload,
    backendTimetableToUi,
    teacherBackendToUiTimetable,
    getLoadedTeacherTimetableCategories,
    backendExamToUi,
    createEmptyRoleTimetable,
    type BackendStudentTimetable,
    type FrontendTimetable,
    type FrontendTimetableCategory,
    type FrontendTimetableDay,
    type FrontendTimeSlot,
    type FrontendExamRecord,
} from '../../../services/profileApi';
import { ApiError } from '../../../services/api';

// ─── Types ────────────────────────────────────────────────────────────────────

type Role = 'student' | 'teacher' | 'employee';

type Props = {
    user: SessionUser | null;
    onBack: () => void;
};

type FieldConfig = {
    key: string;
    label: string;
    placeholder?: string;
    multiline?: boolean;
    options?: string[];
    multiSelect?: boolean;
    secureText?: boolean;
};

// ─── Constants ────────────────────────────────────────────────────────────────

const TIMETABLE_CATEGORIES: FrontendTimetableCategory[] = [
    'CLASS',
    'HOBBY',
    'SPORTS',
    'SELF STUDY',
];

const TIMETABLE_DAYS: FrontendTimetableDay[] = [
    'MON',
    'TUE',
    'WED',
    'THU',
    'FRI',
    'SAT',
    'SUN',
];

const ROLE_STEPS: Record<Role, string[]> = {
    student: [
        'Basic Info',
        'Student Details',
        'Parent Details',
        'Timetable',
        'Exam Records',
        'Portion Details',
        'Security',
    ],
    teacher: [
        'Basic Info',
        'Teacher Profile',
        'Location & Boards',
        'Levels, Classes & Subjects',
        'Teacher Timetable',
        'Security',
    ],
    employee: [
        'Basic Info',
        'Employee Details',
        'Security',
    ],
};

const STUDENT_FIELDS: Record<number, FieldConfig[]> = {
    1: [
        {
            key: 'board',
            label: 'Board',
            options: ['CBSE', 'ICSE', 'ISC', 'State Board'],
        },
        {
            key: 'classStandard',
            label: 'Class',
            options: Array.from({ length: 12 }, (_, i) => `Class ${i + 1}`),
        },
        {
            key: 'medium',
            label: 'Medium',
            options: ['English', 'Hindi', 'Regional Language'],
        },
        { key: 'schoolName', label: 'School Name' },
        { key: 'city', label: 'City' },
        { key: 'state', label: 'State' },
        {
            key: 'dateOfBirth',
            label: 'Date of Birth',
            placeholder: 'DD/MM/YYYY',
        },
    ],
    2: [
        { key: 'parentName', label: 'Parent / Guardian Name' },
        { key: 'parentMobile', label: 'Parent Mobile Number' },
        { key: 'parentEmail', label: 'Parent Email' },
        {
            key: 'relationship',
            label: 'Relationship',
            options: ['Father', 'Mother', 'Guardian', 'Other'],
        },
    ],
    5: [
        {
            key: 'academicPattern',
            label: 'Academic Pattern',
            options: ['Term', 'Semester', 'Annual'],
        },
        {
            key: 'termsCompleted',
            label: 'Completed Terms',
            options: ['0', '1', '2', '3'],
        },
        {
            key: 'semestersCompleted',
            label: 'Completed Semesters',
            options: ['0', '1', '2'],
        },
        {
            key: 'annualProgress',
            label: 'Annual Progress',
            options: [
                'Just Started',
                'Mid Year',
                'Almost Complete',
                'Completed',
            ],
        },
        {
            key: 'learningSources',
            label: 'Learning Sources',
            options: [
                'School',
                'Private Coaching',
                'Online Coaching',
                'Self Study',
                'Other',
            ],
            multiSelect: true,
        },
        { key: 'otherLearningSource', label: 'Other Learning Source' },
        {
            key: 'primaryLearningSource',
            label: 'Primary Learning Source',
        },
    ],
};

const TARGET_EXAMS = [
    'JEE Main', 'JEE Advanced', 'BITSAT', 'VITEEE', 'SRMJEEE', 'MET',
    'COMEDK UGET', 'MHT CET', 'WBJEE', 'KCET', 'AP EAPCET', 'TG EAPCET',
    'KEAM', 'GUJCET', 'OJEE', 'NEET UG', 'CUET UG', 'CLAT UG', 'AILET',
    'SLAT', 'UCEED', 'NID DAT', 'NIFT', 'NATA', 'JEE Main B.Arch',
    'JEE Main B.Planning', 'IPMAT Indore', 'IPMAT Rohtak', 'JIPMAT',
    'NCHM JEE', 'NDA NA', 'SAT', 'ACT', 'Other',
];

const TARGET_DEGREES = [
    'Engineering', 'Medicine', 'Dental', 'Ayurveda',
    'Homeopathy', 'Unani', 'Veterinary', 'Nursing',
    'Pharmacy', 'Architecture', 'Planning', 'Law',
    'BBA', 'B.Com', 'Economics', 'Finance', 'Accounting',
    'Management', 'BCA', 'Computer Science', 'Data Science',
    'AI', 'Cyber Security', 'IT', 'Mathematics', 'Statistics',
    'Physics', 'Chemistry', 'Biotechnology', 'Microbiology',
    'Environmental Science', 'Agriculture', 'Forestry',
    'Food Technology', 'Nutrition', 'Psychology', 'Sociology',
    'Political Science', 'History', 'Geography',
    'English Literature', 'Journalism', 'Media',
    'Hotel Management', 'Hospitality / Tourism', 'Fashion',
    'Interior Design', 'Graphic Design', 'Animation',
    'Fine Arts', 'Performing Arts', 'Education',
    'Physical Education', 'Social Work', 'Aviation',
    'Marine Engineering', 'Merchant Navy', 'Defence Studies',
    'Paramedical', 'Occupational Therapy', 'Physiotherapy',
    'Optometry', 'Radiology', 'Other',
];

const TEACHER_FIELDS: Record<number, FieldConfig[]> = {
    1: [
        {
            key: 'teacherType',
            label: 'Teacher Type',
            options: [
                'School Teacher',
                'College Teacher',
                'Coaching Class Teacher',
                'Private Tutor',
            ],
        },
        {
            key: 'teachingMode',
            label: 'Teaching Mode',
            options: ['Online', 'Offline', 'Both'],
        },
        {
            key: 'teachingLanguages',
            label: 'Teaching Languages',
            options: [
                'English', 'Hindi', 'Marathi', 'Gujarati',
                'Tamil', 'Telugu', 'Kannada', 'Malayalam',
                'Bengali', 'Punjabi', 'Odia', 'Urdu',
            ],
            multiSelect: true,
        },
    ],
    2: [
        { key: 'teacherState', label: 'State' },
        { key: 'teacherCity', label: 'City' },
        { key: 'pincode', label: 'Pincode' },
        { key: 'institutions', label: 'Institutions (comma-separated)' },
        {
            key: 'boardsTeach',
            label: 'Boards You Teach',
            options: ['CBSE', 'ICSE', 'ISC', 'State Board'],
            multiSelect: true,
        },
    ],
    3: [
        {
            key: 'educationLevels',
            label: 'Education Levels',
            options: [
                'KG', 'Primary', 'Secondary', 'Higher Secondary',
                'Under Graduation', 'Post Graduation', 'Others',
            ],
            multiSelect: true,
        },
        { key: 'otherLevelDetail', label: 'Other Education Level' },
        { key: 'classesTeach', label: 'Classes You Teach (comma-separated)' },
        { key: 'subjectsTeach', label: 'Subjects You Teach (comma-separated)' },
    ],
};

const EMPLOYEE_FIELDS: FieldConfig[] = [
    {
        key: 'educationLevel',
        label: 'Education Level',
        options: [
            'High School', "Bachelor's Degree", "Master's Degree",
            'PhD', 'Diploma', 'Certificate',
        ],
    },
    {
        key: 'educationDegree',
        label: 'Education Degree',
        options: [
            'Arts', 'Commerce', 'Science', 'Engineering',
            'Doctor', 'MBA', 'Chartered Accountant',
            'Company Secretary', 'CFA', 'IAS', 'IPS', 'Other',
        ],
    },
    {
        key: 'experience',
        label: 'Experience',
        options: ['0-2 years', '2-5 years', '5-10 years', '10+ years'],
    },
    {
        key: 'industry',
        label: 'Industry',
        options: [
            'Diet', 'Manufacturing', 'Chemical',
            'Information technology', 'BPO', 'Automobile',
            'Telecom', 'Other',
        ],
    },
    {
        key: 'employeeRole',
        label: 'Employee Role',
        options: [
            'Training', 'Clerk', 'Officer',
            'Manager', 'Director', 'Other',
        ],
    },
    {
        key: 'dayToDayTasks',
        label: 'Day-to-Day Tasks',
        multiline: true,
    },
    {
        key: 'useGenerativeAI',
        label: 'Do you use Generative AI?',
        options: ['Yes', 'No'],
    },
    {
        key: 'howCanWeHelp',
        label: 'How Can We Help?',
        multiline: true,
    },
];

const PASSWORD_REGEX = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[^A-Za-z\d]).{8,}$/;

// ─── Helpers ──────────────────────────────────────────────────────────────────

function normalizeRole(user: SessionUser | null): Role {
    const value = user?.category?.trim().toLowerCase();
    if (value === 'teacher') return 'teacher';
    if (value === 'employee') return 'employee';
    return 'student';
}

function friendlyError(error: unknown): string {
    if (error instanceof ApiError) {
        return error.message || 'Server error. Please try again.';
    }
    if (error instanceof Error) {
        if (error.message.includes('Network') || error.message.includes('fetch')) {
            return 'Cannot connect to server. Check your connection.';
        }
        if (error.message.includes('aborted') || error.message.includes('timeout')) {
            return 'Request timed out. Please try again.';
        }
        return error.message;
    }
    return 'Something went wrong. Please try again.';
}

function newExamRecord(): FrontendExamRecord {
    return {
        examName: '',
        subject: '',
        totalMarks: '',
        obtainedMarks: '',
        grade: '',
        semester: '',
        examDate: '',
        digilockerUrl: '',
    };
}

// ─── Component ────────────────────────────────────────────────────────────────

export default function EditProfileView({ user, onBack }: Props) {
    const role = useMemo(() => normalizeRole(user), [user]);
    const steps = ROLE_STEPS[role];

    const [currentStep, setCurrentStep] = useState(0);

    // ── Loading / saving states ──────────────────────────────────────────────
    const [isLoadingProfile, setIsLoadingProfile] = useState(true);
    const [isSaving, setIsSaving] = useState(false);
    const isSubmittingRef = useRef(false); // prevents double-tap

    // ── Form state ───────────────────────────────────────────────────────────
    const [form, setForm] = useState<Record<string, string>>({
        name: user?.name ?? '',
        email: user?.email ?? '',
        mobile: user?.mobile ?? '',
    });

    // ── Student timetable ────────────────────────────────────────────────────
    const [timetable, setTimetable] = useState<FrontendTimetable>(
        createEmptyRoleTimetable,
    );
    const [timetableModified, setTimetableModified] = useState(false);
    const loadedTeacherCategoriesRef = useRef<FrontendTimetableCategory[]>([]);
    const [selectedCategory, setSelectedCategory] =
        useState<FrontendTimetableCategory>('CLASS');
    const [selectedDay, setSelectedDay] =
        useState<FrontendTimetableDay>('MON');

    // ── Exam records ─────────────────────────────────────────────────────────
    const [exams, setExams] = useState<FrontendExamRecord[]>([]);
    const [examsModified, setExamsModified] = useState(false);
    const [editingExamIndex, setEditingExamIndex] = useState<number | null>(null);
    const [examDraft, setExamDraft] = useState<FrontendExamRecord>(newExamRecord());

    // ── Derived ──────────────────────────────────────────────────────────────
    const selectedClass = Number(
        form.classStandard?.replace(/^Class\s*/i, '') || 0,
    );

    // ── Load profile on mount ────────────────────────────────────────────────
    useEffect(() => {
        let cancelled = false;

        async function load() {
            try {
                const profileData = await fetchProfile();
                if (cancelled) return;

                // Populate form from backend
                const populated = profileToFormState(profileData);
                setForm(populated);

                // Student timetable
                if (role === 'student' && profileData.user?.timetable) {
                    setTimetable(backendTimetableToUi(profileData.user.timetable));
                }

                // Teacher timetable
                if (role === 'teacher' && Array.isArray(profileData.roleProfile?.teacherTimetable)) {
                    loadedTeacherCategoriesRef.current = getLoadedTeacherTimetableCategories(
                        profileData.roleProfile.teacherTimetable,
                    );
                    setTimetable(
                        teacherBackendToUiTimetable(
                            profileData.roleProfile.teacherTimetable,
                        ),
                    );
                }

                // Exam records
                if (role === 'student' && Array.isArray(profileData.user?.exams)) {
                    setExams(profileData.user!.exams!.map(backendExamToUi));
                }
            } catch (error) {
                if (cancelled) return;
                // Non-fatal: form pre-filled from session, user can still edit
                console.warn('[EditProfile] Could not load profile:', error instanceof Error ? error.message : error);
            } finally {
                if (!cancelled) setIsLoadingProfile(false);
            }
        }

        load();
        return () => { cancelled = true; };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    // ── Form helpers ─────────────────────────────────────────────────────────
    const updateField = (key: string, value: string) => {
        setForm(previous => ({ ...previous, [key]: value }));
    };

    const updateClass = (value: string) => {
        const classNumber = Number(value.replace(/^Class\s*/i, ''));
        setForm(previous => ({
            ...previous,
            classStandard: value,
            stream: classNumber >= 11 ? previous.stream ?? '' : '',
            targetExams: classNumber >= 9 ? previous.targetExams ?? '' : '',
        }));
    };

    const toggleMultiSelect = (key: string, option: string) => {
        setForm(previous => {
            const currentValues = previous[key]
                ? previous[key].split('|').filter(Boolean)
                : [];
            const updatedValues = currentValues.includes(option)
                ? currentValues.filter(value => value !== option)
                : [...currentValues, option];
            return { ...previous, [key]: updatedValues.join('|') };
        });
    };

    // ── Timetable helpers (student) ──────────────────────────────────────────
    const updateTimetableSlot = (
        slotId: string,
        field: keyof Omit<FrontendTimeSlot, 'id'>,
        value: string,
    ) => {
        setTimetableModified(true);
        setTimetable(previous => {
            const updated = { ...previous };
            const slots = [...updated[selectedCategory][selectedDay]];
            updated[selectedCategory] = {
                ...updated[selectedCategory],
                [selectedDay]: slots.map(slot =>
                    slot.id === slotId ? { ...slot, [field]: value } : slot,
                ),
            };
            return updated;
        });
    };

    const addTimetableSlot = () => {
        const currentSlots = timetable[selectedCategory][selectedDay];
        if (currentSlots.length >= 15) {
            Alert.alert(
                'Limit reached',
                'You can add a maximum of 15 slots for each day and activity.',
            );
            return;
        }
        const newSlot: FrontendTimeSlot = {
            id: `${Date.now()}-${Math.random()}`,
            title: '',
            startTime: '',
            endTime: '',
        };
        setTimetableModified(true);
        setTimetable(previous => ({
            ...previous,
            [selectedCategory]: {
                ...previous[selectedCategory],
                [selectedDay]: [
                    ...previous[selectedCategory][selectedDay],
                    newSlot,
                ],
            },
        }));
    };

    const removeTimetableSlot = (slotId: string) => {
        setTimetableModified(true);
        setTimetable(previous => ({
            ...previous,
            [selectedCategory]: {
                ...previous[selectedCategory],
                [selectedDay]: previous[selectedCategory][selectedDay]
                    .filter(slot => slot.id !== slotId),
            },
        }));
    };

    // ── Exam helpers ─────────────────────────────────────────────────────────
    const startAddExam = () => {
        setExamDraft(newExamRecord());
        setEditingExamIndex(exams.length); // "append" sentinel
    };

    const startEditExam = (index: number) => {
        setExamDraft({ ...exams[index] });
        setEditingExamIndex(index);
    };

    const cancelExamEdit = () => {
        setEditingExamIndex(null);
        setExamDraft(newExamRecord());
    };

    const saveExamDraft = () => {
        if (!examDraft.examName.trim() && !examDraft.subject.trim()) {
            Alert.alert('Required', 'Please enter at least an exam name or subject.');
            return;
        }
        setExamsModified(true);
        setExams(prev => {
            const updated = [...prev];
            if (editingExamIndex === null || editingExamIndex >= prev.length) {
                updated.push({ ...examDraft });
            } else {
                updated[editingExamIndex] = { ...examDraft };
            }
            return updated;
        });
        setEditingExamIndex(null);
        setExamDraft(newExamRecord());
    };

    const removeExam = (index: number) => {
        Alert.alert(
            'Remove exam',
            'Remove this exam record?',
            [
                { text: 'Cancel', style: 'cancel' },
                {
                    text: 'Remove',
                    style: 'destructive',
                    onPress: () => {
                        setExamsModified(true);
                        setExams(prev => prev.filter((_, i) => i !== index));
                    },
                },
            ],
        );
    };

    // ── Validation ───────────────────────────────────────────────────────────
    const validateCurrentStep = (): boolean => {
        if (currentStep === 0 && !form.name?.trim()) {
            Alert.alert('Required field', 'Please enter your full name.');
            return false;
        }

        if (role === 'student' && currentStep === 2) {
            if (!form.parentName?.trim()) {
                Alert.alert('Required field', 'Please enter the parent or guardian name.');
                return false;
            }
            if (!form.parentMobile?.trim()) {
                Alert.alert('Required field', 'Please enter the parent mobile number.');
                return false;
            }
            if (!/^[0-9]{10}$/.test(form.parentMobile.trim())) {
                Alert.alert('Invalid mobile number', 'Please enter a valid 10-digit mobile number.');
                return false;
            }
            if (
                form.parentEmail?.trim() &&
                !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.parentEmail.trim())
            ) {
                Alert.alert('Invalid email', 'Please enter a valid parent email address.');
                return false;
            }
            if (!form.relationship) {
                Alert.alert('Required field', 'Please select the relationship.');
                return false;
            }
        }

        if (
            (role === 'student' && currentStep === 3) ||
            (role === 'teacher' && currentStep === 4)
        ) {
            const slots = timetable[selectedCategory][selectedDay];
            if (slots.some(slot => !slot.title.trim() || !slot.startTime.trim() || !slot.endTime.trim())) {
                Alert.alert(
                    'Incomplete timetable',
                    'Please complete the activity name, start time and end time for every slot.',
                );
                return false;
            }
        }

        if (steps[currentStep] === 'Security') {
            const { newPassword, confirmPassword, currentPassword } = form;
            if (newPassword || confirmPassword || currentPassword) {
                if (!currentPassword) {
                    Alert.alert('Required field', 'Enter your current password.');
                    return false;
                }
                if (!PASSWORD_REGEX.test(newPassword ?? '')) {
                    Alert.alert(
                        'Weak password',
                        'New password must be at least 8 characters with one uppercase letter, one lowercase letter, one number, and one special character.',
                    );
                    return false;
                }
                if (newPassword !== confirmPassword) {
                    Alert.alert('Password mismatch', 'The passwords do not match.');
                    return false;
                }
            }
        }

        return true;
    };

    // ── API save ─────────────────────────────────────────────────────────────
    const handleFinish = async () => {
        if (!validateCurrentStep()) return;
        if (isSubmittingRef.current) return;
        isSubmittingRef.current = true;
        setIsSaving(true);

        try {
            // 1. Change password if fields are filled
            const { newPassword, confirmPassword, currentPassword } = form;
            if (currentPassword && newPassword && confirmPassword) {
                try {
                    const pwResult = await changePassword({
                        currentPassword,
                        newPassword,
                        confirmPassword,
                    });
                    if (!pwResult.success) {
                        throw new Error(pwResult.message || 'Password change failed.');
                    }
                } catch (pwError) {
                    // Surface password-specific errors separately
                    Alert.alert('Password Change Failed', friendlyError(pwError));
                    return; // Don't proceed with profile save if password change failed
                }
            }

            // 2. Build role-specific profile payload
            let payload: Record<string, unknown>;
            if (role === 'student') {
                payload = buildStudentPayload(
                    form,
                    timetable,
                    exams,
                    timetableModified,
                    examsModified,
                );
            } else if (role === 'teacher') {
                payload = buildTeacherPayload(
                    form,
                    timetable,
                    timetableModified,
                    loadedTeacherCategoriesRef.current,
                );
            } else {
                payload = buildEmployeePayload(form);
            }

            // 3. Submit profile update
            const result = await updateProfile(payload);
            if (!result.success) {
                throw new Error(result.message || 'Profile update failed.');
            }

            // 4. Update session with latest basic user info
            const { token } = getSession();
            if (token) {
                const updatedUser = result.user;
                if (updatedUser) {
                    setSession(token, {
                        id: updatedUser.id ?? updatedUser._id ?? user?.id ?? '',
                        name: updatedUser.name ?? user?.name ?? '',
                        email: updatedUser.email ?? user?.email ?? '',
                        mobile: updatedUser.mobile ?? user?.mobile ?? '',
                        verified: updatedUser.verified ?? user?.verified,
                        category: updatedUser.category ?? user?.category,
                        userType: updatedUser.userType ?? user?.userType,
                        accountType: updatedUser.accountType ?? user?.accountType,
                    });
                }
            }

            // 5. Clear password fields (never persist passwords) and sync timetable state
            setForm(prev => ({
                ...prev,
                currentPassword: '',
                newPassword: '',
                confirmPassword: '',
            }));
            if (role === 'teacher' && Array.isArray(payload.teacherTimetable)) {
                loadedTeacherCategoriesRef.current = getLoadedTeacherTimetableCategories(
                    payload.teacherTimetable as BackendStudentTimetable[],
                );
            }
            setTimetableModified(false);
            setExamsModified(false);

            Alert.alert(
                'Profile Updated',
                'Your profile has been saved successfully.',
                [{ text: 'OK', onPress: onBack }],
            );
        } catch (error) {
            Alert.alert('Update Failed', friendlyError(error));
        } finally {
            setIsSaving(false);
            isSubmittingRef.current = false;
        }
    };

    const handleNext = () => {
        if (!validateCurrentStep()) return;
        if (currentStep < steps.length - 1) {
            setCurrentStep(step => step + 1);
        } else {
            void handleFinish();
        }
    };

    // ── Render helpers ───────────────────────────────────────────────────────
    const renderInput = (
        field: FieldConfig,
        value: string | undefined,
    ) => {
        const selectedValues = field.multiSelect
            ? (value ?? '').split('|').filter(Boolean)
            : [];

        return (
            <View key={field.key} style={styles.field}>
                <Text style={styles.label}>{field.label}</Text>

                {field.options ? (
                    <View style={styles.options}>
                        {field.options.map(option => {
                            const selected = field.multiSelect
                                ? selectedValues.includes(option)
                                : value === option;

                            return (
                                <Pressable
                                    key={option}
                                    onPress={() => {
                                        if (field.multiSelect) {
                                            toggleMultiSelect(field.key, option);
                                        } else {
                                            updateField(field.key, option);
                                        }
                                    }}
                                    style={[
                                        styles.option,
                                        selected && styles.optionSelected,
                                    ]}
                                >
                                    <Text
                                        style={[
                                            styles.optionText,
                                            selected && styles.optionTextSelected,
                                        ]}
                                    >
                                        {field.multiSelect && selected ? '✓ ' : ''}
                                        {option}
                                    </Text>
                                </Pressable>
                            );
                        })}
                    </View>
                ) : (
                    <TextInput
                        value={value ?? ''}
                        onChangeText={text => updateField(field.key, text)}
                        placeholder={
                            field.placeholder ??
                            `Enter ${field.label.toLowerCase()}`
                        }
                        placeholderTextColor="#9CA3AF"
                        multiline={field.multiline}
                        textAlignVertical={field.multiline ? 'top' : 'center'}
                        secureTextEntry={field.secureText}
                        keyboardType={
                            field.key.toLowerCase().includes('mobile') ||
                                field.key === 'pincode'
                                ? 'number-pad'
                                : 'default'
                        }
                        style={[
                            styles.input,
                            field.multiline && styles.multilineInput,
                            (field.key === 'email' || field.key === 'mobile') &&
                            styles.readOnlyInput,
                        ]}
                        editable={
                            field.key !== 'email' &&
                            field.key !== 'mobile'
                        }
                    />
                )}
            </View>
        );
    };

    const renderBasicInfo = () => (
        <>
            <View style={styles.avatar}>
                <Text style={styles.avatarText}>
                    {(form.name || 'U').charAt(0).toUpperCase()}
                </Text>
            </View>

            <Text style={styles.avatarHint}>
                Profile photo upload will be added in the next stage.
            </Text>

            {renderInput(
                { key: 'name', label: 'Full Name' },
                form.name,
            )}

            {renderInput(
                { key: 'email', label: 'Email Address' },
                form.email,
            )}

            {renderInput(
                { key: 'mobile', label: 'Mobile Number' },
                form.mobile,
            )}

            <View style={styles.field}>
                <Text style={styles.label}>Account Role</Text>
                <Text style={styles.readOnlyValue}>
                    {role.charAt(0).toUpperCase() + role.slice(1)}
                </Text>
            </View>
        </>
    );

    const renderSecurity = () => (
        <>
            {renderInput(
                { key: 'currentPassword', label: 'Current Password', secureText: true },
                form.currentPassword,
            )}
            {renderInput(
                { key: 'newPassword', label: 'New Password', secureText: true },
                form.newPassword,
            )}
            {renderInput(
                { key: 'confirmPassword', label: 'Confirm New Password', secureText: true },
                form.confirmPassword,
            )}
            <Text style={styles.helperText}>
                Leave these fields empty if you do not want to change your password.
            </Text>
            <Text style={styles.helperText}>
                Password must be at least 8 characters with an uppercase letter, lowercase letter, number and special character.
            </Text>
        </>
    );

    const renderStudentDetails = () => (
        <>
            {renderInput(STUDENT_FIELDS[1][0], form.board)}

            <View style={styles.field}>
                <Text style={styles.label}>Class</Text>
                <View style={styles.options}>
                    {Array.from(
                        { length: 12 },
                        (_, i) => `Class ${i + 1}`,
                    ).map(option => (
                        <Pressable
                            key={option}
                            onPress={() => updateClass(option)}
                            style={[
                                styles.option,
                                form.classStandard === option &&
                                styles.optionSelected,
                            ]}
                        >
                            <Text
                                style={[
                                    styles.optionText,
                                    form.classStandard === option &&
                                    styles.optionTextSelected,
                                ]}
                            >
                                {option.replace('Class ', '')}
                            </Text>
                        </Pressable>
                    ))}
                </View>
            </View>

            {renderInput(STUDENT_FIELDS[1][2], form.medium)}
            {renderInput(STUDENT_FIELDS[1][3], form.schoolName)}
            {renderInput(STUDENT_FIELDS[1][4], form.city)}
            {renderInput(STUDENT_FIELDS[1][5], form.state)}
            {renderInput(STUDENT_FIELDS[1][6], form.dateOfBirth)}

            {selectedClass >= 11 && (
                <View style={styles.field}>
                    <Text style={styles.label}>Stream</Text>
                    <View style={styles.options}>
                        {['Arts', 'Commerce', 'Science'].map(option => (
                            <Pressable
                                key={option}
                                onPress={() => updateField('stream', option)}
                                style={[
                                    styles.option,
                                    form.stream === option &&
                                    styles.optionSelected,
                                ]}
                            >
                                <Text
                                    style={[
                                        styles.optionText,
                                        form.stream === option &&
                                        styles.optionTextSelected,
                                    ]}
                                >
                                    {option}
                                </Text>
                            </Pressable>
                        ))}
                    </View>
                </View>
            )}

            {selectedClass >= 9 && selectedClass <= 12 && (
                <>
                    {renderInput(
                        {
                            key: 'targetExams',
                            label: 'Target Exams',
                            options: TARGET_EXAMS,
                            multiSelect: true,
                        },
                        form.targetExams,
                    )}
                    {renderInput(
                        {
                            key: 'targetDegree',
                            label: 'Target Degree',
                            options: TARGET_DEGREES,
                        },
                        form.targetDegree,
                    )}
                </>
            )}
        </>
    );

    const renderTimetable = () => {
        const slots = timetable[selectedCategory][selectedDay];

        return (
            <>
                <Text style={styles.timetableDescription}>
                    Select an activity type and day, then add your time slots.
                </Text>

                <Text style={styles.label}>Activity Type</Text>

                <View style={styles.options}>
                    {TIMETABLE_CATEGORIES.map(category => (
                        <Pressable
                            key={category}
                            onPress={() => setSelectedCategory(category)}
                            style={[
                                styles.option,
                                selectedCategory === category &&
                                styles.optionSelected,
                            ]}
                        >
                            <Text
                                style={[
                                    styles.optionText,
                                    selectedCategory === category &&
                                    styles.optionTextSelected,
                                ]}
                            >
                                {category}
                            </Text>
                        </Pressable>
                    ))}
                </View>

                <Text style={[styles.label, styles.timetableLabel]}>
                    Select Day
                </Text>

                <View style={styles.options}>
                    {TIMETABLE_DAYS.map(day => {
                        const hasSlots =
                            timetable[selectedCategory][day].length > 0;

                        return (
                            <Pressable
                                key={day}
                                onPress={() => setSelectedDay(day)}
                                style={[
                                    styles.dayOption,
                                    selectedDay === day &&
                                    styles.optionSelected,
                                ]}
                            >
                                <Text
                                    style={[
                                        styles.optionText,
                                        selectedDay === day &&
                                        styles.optionTextSelected,
                                    ]}
                                >
                                    {day}
                                    {hasSlots ? ' •' : ''}
                                </Text>
                            </Pressable>
                        );
                    })}
                </View>

                <View style={styles.timetableHeader}>
                    <View>
                        <Text style={styles.timetableTitle}>
                            {selectedCategory} · {selectedDay}
                        </Text>
                        <Text style={styles.timetableCount}>
                            {slots.length} of 15 slots added
                        </Text>
                    </View>

                    <Pressable
                        onPress={addTimetableSlot}
                        style={styles.addSlotButton}
                    >
                        <Text style={styles.addSlotText}>+ Add Slot</Text>
                    </Pressable>
                </View>

                {slots.length === 0 && (
                    <View style={styles.emptyTimetable}>
                        <Text style={styles.emptyTimetableTitle}>
                            No slots added
                        </Text>
                        <Text style={styles.emptyTimetableText}>
                            Add your first activity for {selectedDay}.
                        </Text>
                    </View>
                )}

                {slots.map((slot, index) => (
                    <View key={slot.id} style={styles.slotCard}>
                        <View style={styles.slotHeader}>
                            <Text style={styles.slotNumber}>
                                Slot {index + 1}
                            </Text>
                            <Pressable
                                onPress={() => removeTimetableSlot(slot.id)}
                            >
                                <Text style={styles.removeSlotText}>
                                    Remove
                                </Text>
                            </Pressable>
                        </View>

                        <Text style={styles.slotLabel}>
                            Activity / Subject
                        </Text>
                        <TextInput
                            value={slot.title}
                            onChangeText={value =>
                                updateTimetableSlot(slot.id, 'title', value)
                            }
                            placeholder="e.g. Mathematics"
                            placeholderTextColor="#9CA3AF"
                            style={styles.input}
                        />

                        <View style={styles.timeRow}>
                            <View style={styles.timeColumn}>
                                <Text style={styles.slotLabel}>Start Time</Text>
                                <TextInput
                                    value={slot.startTime}
                                    onChangeText={value =>
                                        updateTimetableSlot(
                                            slot.id,
                                            'startTime',
                                            value,
                                        )
                                    }
                                    placeholder="09:00 AM"
                                    placeholderTextColor="#9CA3AF"
                                    style={styles.input}
                                />
                            </View>

                            <View style={styles.timeColumn}>
                                <Text style={styles.slotLabel}>End Time</Text>
                                <TextInput
                                    value={slot.endTime}
                                    onChangeText={value =>
                                        updateTimetableSlot(
                                            slot.id,
                                            'endTime',
                                            value,
                                        )
                                    }
                                    placeholder="10:00 AM"
                                    placeholderTextColor="#9CA3AF"
                                    style={styles.input}
                                />
                            </View>
                        </View>
                    </View>
                ))}
            </>
        );
    };

    // Teacher timetable uses the same slot-based inline UI as student
    const renderTeacherTimetable = () => {
        const slots = timetable[selectedCategory][selectedDay];

        return (
            <>
                <Text style={styles.timetableDescription}>
                    Add your teaching activities by type and day. These are saved to your teacher profile.
                </Text>

                <Text style={styles.label}>Activity Type</Text>
                <View style={styles.options}>
                    {TIMETABLE_CATEGORIES.map(category => (
                        <Pressable
                            key={category}
                            onPress={() => setSelectedCategory(category)}
                            style={[
                                styles.option,
                                selectedCategory === category && styles.optionSelected,
                            ]}
                        >
                            <Text style={[styles.optionText, selectedCategory === category && styles.optionTextSelected]}>
                                {category}
                            </Text>
                        </Pressable>
                    ))}
                </View>

                <Text style={[styles.label, styles.timetableLabel]}>Select Day</Text>
                <View style={styles.options}>
                    {TIMETABLE_DAYS.map(day => {
                        const hasSlots = timetable[selectedCategory][day].length > 0;
                        return (
                            <Pressable
                                key={day}
                                onPress={() => setSelectedDay(day)}
                                style={[
                                    styles.dayOption,
                                    selectedDay === day && styles.optionSelected,
                                ]}
                            >
                                <Text style={[styles.optionText, selectedDay === day && styles.optionTextSelected]}>
                                    {day}{hasSlots ? ' •' : ''}
                                </Text>
                            </Pressable>
                        );
                    })}
                </View>

                <View style={styles.timetableHeader}>
                    <View>
                        <Text style={styles.timetableTitle}>{selectedCategory} · {selectedDay}</Text>
                        <Text style={styles.timetableCount}>{slots.length} of 15 slots added</Text>
                    </View>
                    <Pressable
                        onPress={addTimetableSlot}
                        style={styles.addSlotButton}
                    >
                        <Text style={styles.addSlotText}>+ Add Slot</Text>
                    </Pressable>
                </View>

                {slots.length === 0 && (
                    <View style={styles.emptyTimetable}>
                        <Text style={styles.emptyTimetableTitle}>No slots added</Text>
                        <Text style={styles.emptyTimetableText}>Add your first activity for {selectedDay}.</Text>
                    </View>
                )}

                {slots.map((slot, index) => (
                    <View key={slot.id} style={styles.slotCard}>
                        <View style={styles.slotHeader}>
                            <Text style={styles.slotNumber}>Slot {index + 1}</Text>
                            <Pressable onPress={() => removeTimetableSlot(slot.id)}>
                                <Text style={styles.removeSlotText}>Remove</Text>
                            </Pressable>
                        </View>
                        <Text style={styles.slotLabel}>Subject / Activity</Text>
                        <TextInput
                            value={slot.title}
                            onChangeText={v => updateTimetableSlot(slot.id, 'title', v)}
                            placeholder="e.g. Mathematics"
                            placeholderTextColor="#9CA3AF"
                            style={styles.input}
                        />
                        <View style={styles.timeRow}>
                            <View style={styles.timeColumn}>
                                <Text style={styles.slotLabel}>Start Time</Text>
                                <TextInput
                                    value={slot.startTime}
                                    onChangeText={v => updateTimetableSlot(slot.id, 'startTime', v)}
                                    placeholder="09:00 AM"
                                    placeholderTextColor="#9CA3AF"
                                    style={styles.input}
                                />
                            </View>
                            <View style={styles.timeColumn}>
                                <Text style={styles.slotLabel}>End Time</Text>
                                <TextInput
                                    value={slot.endTime}
                                    onChangeText={v => updateTimetableSlot(slot.id, 'endTime', v)}
                                    placeholder="10:00 AM"
                                    placeholderTextColor="#9CA3AF"
                                    style={styles.input}
                                />
                            </View>
                        </View>
                    </View>
                ))}
            </>
        );
    };

    // ── Exam records UI ──────────────────────────────────────────────────────
    const renderExamRecords = () => {
        // If a draft is being edited, show the edit form
        if (editingExamIndex !== null) {
            return (
                <View>
                    <Text style={styles.examEditHeading}>
                        {editingExamIndex >= exams.length ? 'Add Exam Record' : 'Edit Exam Record'}
                    </Text>

                    {(
                        [
                            { key: 'examName', label: 'Exam Name', placeholder: 'e.g. CBSE Board Exam' },
                            { key: 'subject', label: 'Subject', placeholder: 'e.g. Mathematics' },
                            { key: 'totalMarks', label: 'Total Marks', placeholder: '100' },
                            { key: 'obtainedMarks', label: 'Obtained Marks', placeholder: '85' },
                            { key: 'grade', label: 'Grade', placeholder: 'A+' },
                            { key: 'semester', label: 'Semester', placeholder: '1' },
                            { key: 'examDate', label: 'Exam Date', placeholder: 'DD/MM/YYYY' },
                            { key: 'digilockerUrl', label: 'DigiLocker URL (optional)', placeholder: 'https://...' },
                        ] as Array<{ key: keyof FrontendExamRecord; label: string; placeholder: string }>
                    ).map(({ key, label, placeholder }) => (
                        <View key={key} style={styles.field}>
                            <Text style={styles.label}>{label}</Text>
                            <TextInput
                                value={examDraft[key] as string}
                                onChangeText={text =>
                                    setExamDraft(prev => ({ ...prev, [key]: text }))
                                }
                                placeholder={placeholder}
                                placeholderTextColor="#9CA3AF"
                                keyboardType={
                                    key === 'totalMarks' || key === 'obtainedMarks'
                                        ? 'number-pad'
                                        : 'default'
                                }
                                style={styles.input}
                            />
                        </View>
                    ))}

                    <View style={styles.examEditActions}>
                        <Pressable
                            onPress={cancelExamEdit}
                            style={styles.secondaryButton}
                        >
                            <Text style={styles.secondaryButtonText}>Cancel</Text>
                        </Pressable>
                        <Pressable
                            onPress={saveExamDraft}
                            style={styles.primaryButton}
                        >
                            <Text style={styles.primaryButtonText}>Save Exam</Text>
                        </Pressable>
                    </View>
                </View>
            );
        }

        return (
            <>
                {exams.length === 0 && (
                    <View style={styles.emptyTimetable}>
                        <Text style={styles.emptyTimetableTitle}>No exam records</Text>
                        <Text style={styles.emptyTimetableText}>
                            Add your exam results, marks and grades.
                        </Text>
                    </View>
                )}

                {exams.map((exam, index) => (
                    <View key={exam._id ?? `exam-${index}`} style={styles.examCard}>
                        <View style={styles.examCardHeader}>
                            <Text style={styles.examName} numberOfLines={1}>
                                {exam.examName || exam.subject || 'Exam Record'}
                            </Text>
                            <View style={styles.examActions}>
                                <Pressable
                                    onPress={() => startEditExam(index)}
                                    style={styles.examEditBtn}
                                >
                                    <Text style={styles.examEditText}>Edit</Text>
                                </Pressable>
                                <Pressable
                                    onPress={() => removeExam(index)}
                                    style={styles.examRemoveBtn}
                                >
                                    <Text style={styles.examRemoveText}>Remove</Text>
                                </Pressable>
                            </View>
                        </View>
                        {!!exam.subject && (
                            <Text style={styles.examDetail}>Subject: {exam.subject}</Text>
                        )}
                        {(!!exam.obtainedMarks || !!exam.totalMarks) && (
                            <Text style={styles.examDetail}>
                                Marks: {exam.obtainedMarks}/{exam.totalMarks}
                                {exam.grade ? `  ·  Grade: ${exam.grade}` : ''}
                            </Text>
                        )}
                        {!!exam.examDate && (
                            <Text style={styles.examDetail}>Date: {exam.examDate}</Text>
                        )}
                    </View>
                ))}

                <Pressable
                    onPress={startAddExam}
                    style={styles.addExamButton}
                >
                    <Text style={styles.addSlotText}>+ Add Exam Record</Text>
                </Pressable>
            </>
        );
    };

    const renderPortionDetails = () => {
        const pattern = form.academicPattern?.toLowerCase();
        const fields = STUDENT_FIELDS[5];

        return fields
            .filter(field => {
                // Show termsCompleted only for Term pattern
                if (field.key === 'termsCompleted') return pattern === 'term';
                // Show semestersCompleted only for Semester pattern
                if (field.key === 'semestersCompleted') return pattern === 'semester';
                // Show annualProgress only for Annual pattern
                if (field.key === 'annualProgress') return pattern === 'annual';
                return true;
            })
            .map(field => renderInput(field, form[field.key]));
    };

    const renderStepContent = () => {
        if (currentStep === 0) return renderBasicInfo();
        if (steps[currentStep] === 'Security') return renderSecurity();

        if (role === 'student') {
            if (currentStep === 1) return renderStudentDetails();
            if (currentStep === 2) return STUDENT_FIELDS[2].map(field => renderInput(field, form[field.key]));
            if (currentStep === 3) return renderTimetable();
            if (currentStep === 4) return renderExamRecords();
            if (currentStep === 5) return renderPortionDetails();
        }

        if (role === 'teacher') {
            if (currentStep >= 1 && currentStep <= 3) {
                return (TEACHER_FIELDS[currentStep] ?? []).map(field =>
                    renderInput(field, form[field.key]),
                );
            }
            if (currentStep === 4) return renderTeacherTimetable();
        }

        if (role === 'employee' && currentStep === 1) {
            return EMPLOYEE_FIELDS.map(field =>
                renderInput(field, form[field.key]),
            );
        }

        return null;
    };

    // ── Loading skeleton ─────────────────────────────────────────────────────
    if (isLoadingProfile) {
        return (
            <View style={styles.container}>
                <View style={styles.header}>
                    <Pressable onPress={onBack} style={styles.backButton}>
                        <Text style={styles.backText}>‹  Back</Text>
                    </Pressable>
                    <Text style={styles.heading}>Edit Profile</Text>
                </View>
                <View style={styles.loadingCenter}>
                    <ActivityIndicator size="large" color="#596BD0" />
                    <Text style={styles.loadingText}>Loading your profile…</Text>
                </View>
            </View>
        );
    }

    // ── Main render ──────────────────────────────────────────────────────────
    return (
        <View style={styles.container}>
            <View style={styles.header}>
                <Pressable onPress={onBack} style={styles.backButton}>
                    <Text style={styles.backText}>‹  Back</Text>
                </Pressable>
                <Text style={styles.heading}>Edit Profile</Text>
                <Text style={styles.subtitle}>
                    Update your personal and account information
                </Text>
            </View>

            <ScrollView
                showsVerticalScrollIndicator={false}
                contentContainerStyle={styles.scrollContent}
            >
                <View style={styles.stepCard}>
                    <Text style={styles.stepCount}>
                        STEP {currentStep + 1} OF {steps.length}
                    </Text>

                    <View style={styles.progressTrack}>
                        <View
                            style={[
                                styles.progressFill,
                                {
                                    width: `${((currentStep + 1) / steps.length) * 100}%`,
                                },
                            ]}
                        />
                    </View>

                    <ScrollView
                        horizontal
                        showsHorizontalScrollIndicator={false}
                        contentContainerStyle={styles.stepList}
                    >
                        {steps.map((step, index) => (
                            <View
                                key={step}
                                style={[
                                    styles.stepPill,
                                    index === currentStep && styles.activeStepPill,
                                    index < currentStep && styles.completedStepPill,
                                ]}
                            >
                                <Text
                                    style={[
                                        styles.stepPillText,
                                        index <= currentStep && styles.activeStepText,
                                    ]}
                                >
                                    {index + 1}. {step}
                                </Text>
                            </View>
                        ))}
                    </ScrollView>
                </View>

                <View style={styles.formCard}>
                    <Text style={styles.sectionTitle}>
                        {steps[currentStep]}
                    </Text>
                    <Text style={styles.sectionSubtitle}>
                        {currentStep === 0
                            ? 'Your basic account information'
                            : 'Provide the relevant details below'}
                    </Text>

                    {renderStepContent()}
                </View>

                <View style={styles.navigation}>
                    <Pressable
                        onPress={() => {
                            if (currentStep === 0) {
                                onBack();
                            } else {
                                setCurrentStep(step => step - 1);
                            }
                        }}
                        style={styles.secondaryButton}
                        disabled={isSaving}
                    >
                        <Text style={styles.secondaryButtonText}>
                            {currentStep === 0 ? 'Cancel' : 'Previous'}
                        </Text>
                    </Pressable>

                    <Pressable
                        onPress={handleNext}
                        style={[
                            styles.primaryButton,
                            isSaving && styles.buttonDisabled,
                        ]}
                        disabled={isSaving}
                    >
                        {isSaving ? (
                            <ActivityIndicator size="small" color="#FFFFFF" />
                        ) : (
                            <Text style={styles.primaryButtonText}>
                                {currentStep === steps.length - 1 ? 'Finish' : 'Continue'}
                            </Text>
                        )}
                    </Pressable>
                </View>
            </ScrollView>
        </View>
    );
}

// ─── Styles (original styles preserved; new styles appended) ─────────────────

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#F5F6FF',
    },
    header: {
        paddingHorizontal: 20,
        paddingTop: 12,
        paddingBottom: 18,
    },
    backButton: {
        alignSelf: 'flex-start',
        paddingVertical: 8,
        marginBottom: 10,
    },
    backText: {
        color: '#5365C5',
        fontSize: 15,
        fontWeight: '600',
    },
    heading: {
        color: '#172554',
        fontSize: 25,
        fontWeight: '700',
    },
    subtitle: {
        color: '#737B91',
        fontSize: 13,
        marginTop: 5,
    },
    scrollContent: {
        paddingHorizontal: 16,
        paddingBottom: 32,
    },
    stepCard: {
        backgroundColor: '#FFFFFF',
        borderRadius: 18,
        padding: 16,
        marginBottom: 14,
        borderWidth: 1,
        borderColor: '#E8EAF5',
    },
    stepCount: {
        color: '#6573C8',
        fontSize: 11,
        fontWeight: '700',
        letterSpacing: 1,
    },
    progressTrack: {
        height: 5,
        backgroundColor: '#E9EAF4',
        borderRadius: 5,
        marginTop: 10,
        marginBottom: 15,
        overflow: 'hidden',
    },
    progressFill: {
        height: '100%',
        backgroundColor: '#6573D5',
        borderRadius: 5,
    },
    stepList: {
        gap: 8,
        paddingRight: 8,
    },
    stepPill: {
        paddingHorizontal: 12,
        paddingVertical: 9,
        borderRadius: 20,
        backgroundColor: '#F1F2F8',
    },
    activeStepPill: {
        backgroundColor: '#596BD0',
    },
    completedStepPill: {
        backgroundColor: '#E5E9FF',
    },
    stepPillText: {
        color: '#697086',
        fontSize: 11,
        fontWeight: '600',
    },
    activeStepText: {
        color: '#FFFFFF',
    },
    formCard: {
        backgroundColor: '#FFFFFF',
        borderRadius: 18,
        padding: 18,
        borderWidth: 1,
        borderColor: '#E8EAF5',
    },
    sectionTitle: {
        color: '#172554',
        fontSize: 19,
        fontWeight: '700',
    },
    sectionSubtitle: {
        color: '#858B9C',
        fontSize: 12,
        marginTop: 5,
        marginBottom: 20,
    },
    field: {
        marginBottom: 18,
    },
    label: {
        color: '#30384D',
        fontSize: 13,
        fontWeight: '600',
        marginBottom: 8,
    },
    input: {
        minHeight: 48,
        borderWidth: 1,
        borderColor: '#E1E4EF',
        borderRadius: 11,
        paddingHorizontal: 13,
        color: '#20283B',
        backgroundColor: '#FCFCFE',
        fontSize: 14,
    },
    readOnlyInput: {
        backgroundColor: '#F5F6FA',
        color: '#737B91',
    },
    multilineInput: {
        minHeight: 100,
        paddingTop: 12,
    },
    options: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 8,
    },
    option: {
        borderWidth: 1,
        borderColor: '#E1E4EF',
        backgroundColor: '#FFFFFF',
        borderRadius: 20,
        paddingHorizontal: 12,
        paddingVertical: 9,
    },
    optionSelected: {
        borderColor: '#6573D5',
        backgroundColor: '#EEF0FF',
    },
    optionText: {
        color: '#626B80',
        fontSize: 12,
    },
    optionTextSelected: {
        color: '#5365C5',
        fontWeight: '700',
    },
    avatar: {
        width: 76,
        height: 76,
        borderRadius: 38,
        backgroundColor: '#E9ECFF',
        alignItems: 'center',
        justifyContent: 'center',
        alignSelf: 'center',
        marginBottom: 8,
    },
    avatarText: {
        color: '#5365C5',
        fontSize: 30,
        fontWeight: '700',
    },
    avatarHint: {
        textAlign: 'center',
        color: '#858B9C',
        fontSize: 11,
        marginBottom: 22,
    },
    readOnlyValue: {
        color: '#737B91',
        backgroundColor: '#F5F6FA',
        borderRadius: 10,
        padding: 14,
        overflow: 'hidden',
    },
    helperText: {
        color: '#858B9C',
        fontSize: 11,
        marginTop: 4,
        marginBottom: 4,
    },
    timetableDescription: {
        color: '#737B91',
        fontSize: 12,
        lineHeight: 19,
        marginBottom: 18,
    },
    timetableLabel: {
        marginTop: 20,
    },
    dayOption: {
        borderWidth: 1,
        borderColor: '#E1E4EF',
        backgroundColor: '#FFFFFF',
        borderRadius: 12,
        paddingHorizontal: 12,
        paddingVertical: 10,
    },
    timetableHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginTop: 24,
        marginBottom: 14,
    },
    timetableTitle: {
        color: '#172554',
        fontSize: 14,
        fontWeight: '700',
    },
    timetableCount: {
        color: '#858B9C',
        fontSize: 11,
        marginTop: 4,
    },
    addSlotButton: {
        backgroundColor: '#596BD0',
        borderRadius: 9,
        paddingHorizontal: 12,
        paddingVertical: 10,
    },
    addSlotText: {
        color: '#FFFFFF',
        fontSize: 12,
        fontWeight: '700',
    },
    emptyTimetable: {
        padding: 22,
        borderRadius: 12,
        backgroundColor: '#F7F8FC',
        alignItems: 'center',
        marginTop: 6,
        marginBottom: 12,
    },
    emptyTimetableTitle: {
        color: '#30384D',
        fontWeight: '600',
        fontSize: 13,
    },
    emptyTimetableText: {
        color: '#858B9C',
        fontSize: 11,
        marginTop: 5,
    },
    slotCard: {
        borderWidth: 1,
        borderColor: '#E5E7F0',
        backgroundColor: '#FCFCFE',
        borderRadius: 13,
        padding: 13,
        marginBottom: 12,
    },
    slotHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginBottom: 14,
    },
    slotNumber: {
        color: '#5365C5',
        fontSize: 12,
        fontWeight: '700',
    },
    removeSlotText: {
        color: '#D14F5B',
        fontSize: 12,
        fontWeight: '600',
    },
    slotLabel: {
        color: '#30384D',
        fontSize: 11,
        fontWeight: '600',
        marginBottom: 7,
    },
    timeRow: {
        flexDirection: 'row',
        gap: 10,
        marginTop: 14,
    },
    timeColumn: {
        flex: 1,
    },
    navigation: {
        flexDirection: 'row',
        gap: 12,
        marginTop: 16,
    },
    secondaryButton: {
        flex: 1,
        minHeight: 48,
        borderRadius: 12,
        borderWidth: 1,
        borderColor: '#D9DDEC',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: '#FFFFFF',
    },
    secondaryButtonText: {
        color: '#596176',
        fontWeight: '600',
    },
    primaryButton: {
        flex: 1,
        minHeight: 48,
        borderRadius: 12,
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: '#596BD0',
    },
    primaryButtonText: {
        color: '#FFFFFF',
        fontWeight: '700',
    },
    buttonDisabled: {
        opacity: 0.6,
    },
    // ── Loading ──────────────────────────────────────────────────────────────
    loadingCenter: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
        gap: 16,
    },
    loadingText: {
        color: '#737B91',
        fontSize: 14,
    },
    // ── Exam records ─────────────────────────────────────────────────────────
    examCard: {
        borderWidth: 1,
        borderColor: '#E5E7F0',
        backgroundColor: '#FCFCFE',
        borderRadius: 13,
        padding: 14,
        marginBottom: 12,
    },
    examCardHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginBottom: 6,
    },
    examName: {
        color: '#172554',
        fontWeight: '700',
        fontSize: 14,
        flex: 1,
        marginRight: 8,
    },
    examActions: {
        flexDirection: 'row',
        gap: 8,
    },
    examEditBtn: {
        paddingHorizontal: 10,
        paddingVertical: 5,
        borderRadius: 7,
        backgroundColor: '#EEF0FF',
    },
    examEditText: {
        color: '#5365C5',
        fontSize: 12,
        fontWeight: '600',
    },
    examRemoveBtn: {
        paddingHorizontal: 10,
        paddingVertical: 5,
        borderRadius: 7,
        backgroundColor: '#FEE9EB',
    },
    examRemoveText: {
        color: '#D14F5B',
        fontSize: 12,
        fontWeight: '600',
    },
    examDetail: {
        color: '#737B91',
        fontSize: 12,
        marginTop: 2,
    },
    addExamButton: {
        backgroundColor: '#596BD0',
        borderRadius: 9,
        paddingHorizontal: 14,
        paddingVertical: 11,
        alignSelf: 'flex-start',
        marginTop: 8,
    },
    examEditHeading: {
        color: '#172554',
        fontSize: 15,
        fontWeight: '700',
        marginBottom: 18,
    },
    examEditActions: {
        flexDirection: 'row',
        gap: 12,
        marginTop: 8,
    },
});
