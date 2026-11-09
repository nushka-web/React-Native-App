import { useEffect, useRef, useState } from 'react';
import {
  Alert,
  Image,
  Keyboard,
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import LinearGradient from 'react-native-linear-gradient';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import DateTimePicker, { DateTimePickerEvent } from '@react-native-community/datetimepicker';

import type { RootStackParamList } from '../../navigation/AppNavigator';
import arthumWordmark from '../../assets/images/arthum-wordmark.png';
import PrimaryButton from '../../components/common/PrimaryButton';
import { checkEmailExists, registerUser, uploadInstituteFile } from '../../services/authApi';

type Props = NativeStackScreenProps<RootStackParamList, 'Register'>;

type AccountType = 'Personal' | 'Company' | 'Affiliate';

const ACCOUNT_TYPES: AccountType[] = ['Personal', 'Company', 'Affiliate'];

const SUBSCRIPTION_TYPES = ['Free - Basic Features', 'Premium - All Features'];
const ACCOUNT_CATEGORIES = ['Private Account', 'Business Account', 'NGO / Non-Profit'];

const BOARD_OPTIONS = ['CBSE', 'ICSE', 'ISC', 'State Board'];
const CLASS_OPTIONS = Array.from({ length: 12 }, (_, index) => String(index + 1));
const STREAM_OPTIONS = ['Arts', 'Commerce', 'Science'];
const MEDIUM_OPTIONS = ['English', 'Hindi', 'Regional Language'];

// Same exams and values as the website registration page.
const TARGET_EXAMS: { value: string; label: string }[] = [
  { value: 'jee_main', label: 'JEE Main' },
  { value: 'jee_advanced', label: 'JEE Advanced' },
  { value: 'bitsat', label: 'BITSAT' },
  { value: 'viteee', label: 'VITEEE' },
  { value: 'srmjeee', label: 'SRMJEEE' },
  { value: 'met', label: 'MET (Manipal Entrance Test)' },
  { value: 'comedk_uget', label: 'COMEDK UGET' },
  { value: 'mht_cet', label: 'MHT CET' },
  { value: 'wbjee', label: 'WBJEE' },
  { value: 'kcet', label: 'KCET' },
  { value: 'ap_eapcet', label: 'AP EAPCET' },
  { value: 'tg_eapcet', label: 'TG EAPCET' },
  { value: 'keam', label: 'KEAM' },
  { value: 'gujcet', label: 'GUJCET' },
  { value: 'ojee', label: 'OJEE' },
  { value: 'neet_ug', label: 'NEET UG' },
  { value: 'cuet_ug', label: 'CUET UG' },
  { value: 'clat_ug', label: 'CLAT UG' },
  { value: 'ailet', label: 'AILET' },
  { value: 'slat', label: 'SLAT' },
  { value: 'uceed', label: 'UCEED' },
  { value: 'nid_dat', label: 'NID DAT' },
  { value: 'nift', label: 'NIFT Entrance Exam' },
  { value: 'nata', label: 'NATA' },
  { value: 'jee_main_barch', label: 'JEE Main Paper 2A (B.Arch)' },
  { value: 'jee_main_bplanning', label: 'JEE Main Paper 2B (B.Planning)' },
  { value: 'ipmat_indore', label: 'IPMAT (IIM Indore)' },
  { value: 'ipmat_rohtak', label: 'IPMAT (IIM Rohtak)' },
  { value: 'jipmat', label: 'JIPMAT' },
  { value: 'nchm_jee', label: 'NCHM JEE' },
  { value: 'nda_na', label: 'NDA & NA Examination' },
  { value: 'sat', label: 'SAT' },
  { value: 'act', label: 'ACT' },
  { value: 'other', label: 'Other' },
];
const TARGET_EXAM_CLASSES = ['9', '10', '11', '12'];
const PARENT_RELATIONSHIPS = ['Father', 'Mother', 'Guardian', 'Other'];

const TIMETABLE_DAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

// Same rules as the backend (src/routes/auth.js and the StudentProfile model),
// so mistakes are caught on the page where they happen.
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const PASSWORD_REGEX = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[^A-Za-z\d]).{8,}$/;
const PARENT_MOBILE_REGEX = /^[6-9]\d{9}$/;

const ACADEMIC_PATTERN_OPTIONS = ['Term', 'Semester', 'Annual'];
const TERMS_COMPLETED_OPTIONS = ['0', '1', '2', '3'];
const SEMESTERS_COMPLETED_OPTIONS = ['0', '1', '2'];
const ANNUAL_PROGRESS_OPTIONS = ['Just Started', 'Mid Year', 'Almost Complete', 'Completed'];

const LEARNING_SOURCES = [
  'School',
  'Private Coaching',
  'Online Coaching',
  'Self Study',
  'Other',
];

type ActivityType =
  | 'Class'
  | 'Tuition'
  | 'Sports'
  | 'Self Study'
  | 'Hobby'
  | 'Coaching'
  | 'Other';

const ACTIVITY_TYPES: ActivityType[] = [
  'Class',
  'Tuition',
  'Sports',
  'Self Study',
  'Other',
];

// Teacher timetable: same layout as the student schedule, without Sports and Self Study.
const TEACHER_ACTIVITY_TYPES: ActivityType[] = ['Class', 'Hobby', 'Coaching', 'Tuition'];
const TEACHER_TIMETABLE_DAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
const MAX_LECTURES_PER_DAY = 15; // the backend keeps only 15 lectures per type and day

// Company account (Educational Institute role) uses the website's 5-step company flow.
const COMPANY_STEP_LABELS = [
  'Basic Info',
  'Account Preferences',
  'Personal & Company Identity',
  'Company Details',
  'AI Usage',
];
const INSTITUTE_STEP_LABELS = ['Basic Info', 'Account Preferences', 'Institute Details'];
const INSTITUTE_ROLE_OPTIONS = ['Educational Institute'];
const INSTITUTE_ACADEMIC_LEVELS = ['Primary', 'Secondary', 'Higher', 'UG', 'PG'];
const INSTITUTE_MODES = ['Online', 'Offline', 'Hybrid'];
const COMPANY_INDUSTRIES = [
  'Technology', 'Finance', 'Healthcare', 'Education', 'Retail', 'Manufacturing', 'Media', 'Other',
];
const COMPANY_HEAD_COUNTS = ['1-10', '11-50', '51-200', '201-500', '501-1000', '1000+'];
const COMPANY_AI_MODELS = [
  'ChatGPT', 'Google Gemini', 'Azure OpenAI', 'Oracle Cloud', 'Perplexity',
  'Meta (LLaMA)', 'Amazon Bedrock', 'DeepSeek', 'Other',
];

const EMPLOYEE_STEP_LABELS = ['Basic Info', 'Account Preferences', 'Education Details', 'Work Details'];

// Same options as the website. The website shows one name but saves another for
// Education Level, so the screen keeps the label and the backend gets the value.
const EMP_EDUCATION_LEVELS: { label: string; value: string }[] = [
  { label: 'SSC', value: 'High School' },
  { label: 'HSC', value: "Bachelor's Degree" },
  { label: 'Graduate', value: "Master's Degree" },
  { label: 'Post Graduate', value: 'PhD' },
  { label: 'Diploma', value: 'Diploma' },
  { label: 'Doctorate', value: 'Certificate' },
];
const EMP_DEGREES = [
  'Arts', 'Commerce', 'Science', 'Engineering', 'Doctor', 'MBA',
  'Chartered Accountant', 'Company Secretary', 'CFA', 'IAS', 'IPS', 'Other',
];
const EMP_EXPERIENCE = ['0-2 years', '2-5 years', '5-10 years', '10+ years'];
const EMP_INDUSTRIES = [
  'Diet', 'Manufacturing', 'Chemical', 'Information technology', 'BPO', 'Automobile', 'Telecom', 'Other',
];
const EMP_ROLES = ['training', 'Clerk', 'Officer', 'Manager', 'Director', 'Other'];
const EMP_CAREER_TARGETS = [
  'Doctor', 'Engineer', 'Teacher', 'Lawyer', 'Accountant', 'Architect', 'Nurse', 'Pharmacist',
  'Dentist', 'Psychologist', 'Data Scientist', 'Software Developer', 'Designer', 'Consultant', 'Other',
];
const EMP_TEXT_LIMIT = 1000;

const TEACHER_STEP_LABELS = [
  'Basic Info',
  'Account Preferences',
  'Teacher Profile',
  'Location & Institution',
  'Teaching Levels',
  'Subjects',
  'Teacher Timetable',
];
const STUDENT_STEP_LABELS = [
  'Basic Info',
  'Account Preferences',
  'Education Details',
  'Parents Information',
  'Student Schedule',
  'Academic Records',
  'Portion Details',
];

const TEACHER_TYPES = ['School Teacher', 'College Teacher', 'Coaching Class Teacher', 'Private Tutor'];
const TEACHING_MODES = ['Online', 'Offline', 'Both'];
const TEACHING_LANGUAGES = [
  'English', 'Hindi', 'Marathi', 'Gujarati', 'Tamil', 'Telugu',
  'Kannada', 'Malayalam', 'Bengali', 'Punjabi', 'Odia', 'Urdu',
];
const TEACHER_BOARDS = ['CBSE', 'ICSE', 'ISC', 'State Board'];
const TEACHER_EDUCATION_LEVELS = [
  'KG', 'Primary', 'Secondary', 'Higher Secondary', 'Under Graduation', 'Post Graduation', 'Others',
];
const POPULAR_SUBJECTS = [
  'Mathematics', 'Science', 'English', 'Physics', 'Chemistry', 'History',
  'Geography', 'Computer', 'Coding', 'Music', 'Art', 'Economics',
];
const INDIAN_STATES = [
  'Andhra Pradesh', 'Arunachal Pradesh', 'Assam', 'Bihar', 'Chhattisgarh', 'Goa', 'Gujarat',
  'Haryana', 'Himachal Pradesh', 'Jharkhand', 'Karnataka', 'Kerala', 'Madhya Pradesh',
  'Maharashtra', 'Manipur', 'Meghalaya', 'Mizoram', 'Nagaland', 'Odisha', 'Punjab',
  'Rajasthan', 'Sikkim', 'Tamil Nadu', 'Telangana', 'Tripura', 'Uttar Pradesh', 'Uttarakhand',
  'West Bengal', 'Andaman and Nicobar Islands', 'Chandigarh', 'Dadra and Nagar Haveli and Daman and Diu',
  'Delhi', 'Jammu and Kashmir', 'Ladakh', 'Lakshadweep', 'Puducherry',
];

const toggleInList = (list: string[], value: string) =>
  list.includes(value) ? list.filter(x => x !== value) : [...list, value];

type TimetableActivity = {
  id: string;
  day: string;
  activityType: ActivityType;
  title: string;
  optionalSubjects?: string[];
  organization?: string;
  notes?: string;
};

type AcademicRecord = {
  id: string;
  examName: string;
  subject: string;
  totalMarks: string;
  obtainedMarks: string;
  grade: string;
  semester: string;
  examDate: string;
  digilockerUrl: string;
  showDatePicker: boolean;
};

const ROLES = [
  'Employee',
  'Teacher',
  'Student',
  'Other',
];

function UserIcon() {
  return (
    <View style={ic.outer}>
      <View style={ic.head} />
      <View style={ic.shoulder} />
    </View>
  );
}

function CameraIcon() {
  return (
    <View style={ic.camBody}>
      <View style={ic.camLens} />
    </View>
  );
}

function CheckboxTick({ checked }: { checked: boolean }) {
  return (
    <View style={[ic.checkBox, checked && ic.checkBoxOn]}>
      {checked && <View style={ic.checkMark} />}
    </View>
  );
}

function ChevronDown() {
  return (
    <View style={ic.chevron}>
      <View style={ic.chevL} />
      <View style={ic.chevR} />
    </View>
  );
}

const ic = StyleSheet.create({
  outer: { alignItems: 'center' },
  head: { width: 24, height: 24, borderRadius: 12, backgroundColor: '#8895F0', marginBottom: 4 },
  shoulder: { width: 36, height: 16, borderTopLeftRadius: 18, borderTopRightRadius: 18, backgroundColor: '#8895F0' },
  camBody: { width: 14, height: 10, borderRadius: 3, backgroundColor: '#FFFFFF', alignItems: 'center', justifyContent: 'center' },
  camLens: { width: 6, height: 6, borderRadius: 3, backgroundColor: '#5566EB' },
  checkBox: { width: 18, height: 18, borderRadius: 5, borderWidth: 1.5, borderColor: '#C8CCFF', backgroundColor: '#FFFFFF', alignItems: 'center', justifyContent: 'center', flexShrink: 0 },
  checkBoxOn: { backgroundColor: '#5566EB', borderColor: '#5566EB' },
  checkMark: { width: 9, height: 6, borderLeftWidth: 2, borderBottomWidth: 2, borderColor: '#FFFFFF', marginTop: -2, transform: [{ rotate: '-45deg' }] },
  chevron: { width: 14, height: 14, flexDirection: 'row', alignItems: 'flex-end', marginRight: 4 },
  chevL: { width: 7, height: 2, backgroundColor: '#9A96AD', borderRadius: 1, transform: [{ rotate: '45deg' }], marginRight: -2 },
  chevR: { width: 7, height: 2, backgroundColor: '#9A96AD', borderRadius: 1, transform: [{ rotate: '-45deg' }] },
});


function StepIndicator({ step, labels }: { step: number; labels: string[] }) {
  const steps = labels;

  const completedWidth = `${((step - 1) / (steps.length - 1)) * 100}%`;

  return (
    <View style={s.stepperWrap}>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={s.stepScrollContent}
        style={s.stepScroll}
        bounces={false}
      >
        <View style={[s.stepTimeline, { width: steps.length * 110 }]}>
          {/* One continuous track behind all seven steps */}
          <View style={s.stepTrack}>
            <LinearGradient
              colors={['#4F5BD5', '#6A82FB']}
              style={[s.stepTrackFill, { width: completedWidth }]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
            />
          </View>

          {steps.map((label, index) => {
            const stepNumber = index + 1;
            const completed = stepNumber < step;
            const active = stepNumber === step;

            return (
              <View key={label} style={s.stepItem}>
                {completed ? (
                  <LinearGradient
                    colors={['#4F5BD5', '#6A82FB']}
                    style={s.stepCircle}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 1 }}
                  >
                    <Text style={s.stepCheck}>✓</Text>
                  </LinearGradient>
                ) : active ? (
                  <LinearGradient
                    colors={['#4F5BD5', '#6A82FB']}
                    style={s.stepCircle}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 1 }}
                  >
                    <Text style={s.stepNumOn}>{stepNumber}</Text>
                  </LinearGradient>
                ) : (
                  <View style={[s.stepCircle, s.stepCircleOff]}>
                    <Text style={s.stepNumOff}>{stepNumber}</Text>
                  </View>
                )}
                <Text style={[s.stepLabel, active && s.stepLabelOn]} numberOfLines={2}>
                  {label}
                </Text>
              </View>
            );
          })}
        </View>
      </ScrollView>
    </View>
  );
}

function SocialBtn({ letter, color, label, name }: { letter: string; color: string; label: string; name: string }) {
  return (
    <TouchableOpacity style={s.socialBtn} activeOpacity={0.8} accessibilityLabel={label}>
      <View style={[s.socialCircle, { backgroundColor: color }]}>
        <Text style={s.socialLetter}>{letter}</Text>
      </View>
      <Text style={s.socialBtnText}>{name}</Text>
    </TouchableOpacity>
  );
}

function getTypeBadgeStyle(type: ActivityType) {
  switch (type) {
    case 'Class':
      return s.badgeClass;
    case 'Tuition':
    case 'Coaching':
      return s.badgeTuition;
    case 'Sports':
      return s.badgeSports;
    case 'Self Study':
      return s.badgeSelfStudy;
    case 'Other':
    default:
      return s.badgeOther;
  }
}

function getTypeBadgeTextStyle(type: ActivityType) {
  switch (type) {
    case 'Class':
      return s.badgeClassText;
    case 'Tuition':
    case 'Coaching':
      return s.badgeTuitionText;
    case 'Sports':
      return s.badgeSportsText;
    case 'Self Study':
      return s.badgeSelfStudyText;
    case 'Other':
    default:
      return s.badgeOtherText;
  }
}

// ─── Helper: day abbreviation → full name ─────────────────────────────────────

function dayFullName(abbr: string): string {
  const map: Record<string, string> = {
    Mon: 'Monday',
    Tue: 'Tuesday',
    Wed: 'Wednesday',
    Thu: 'Thursday',
    Fri: 'Friday',
    Sat: 'Saturday',
    Sun: 'Sunday',
  };
  return map[abbr] ?? abbr;
}

// ─── Field & Input helpers ────────────────────────────────────────────────────

function Field({
  label,
  required,
  children,
}: {
  label: string;
  required?: boolean;
  children: React.ReactNode;
}) {
  return (
    <View style={s.field}>
      <Text style={s.label}>
        {label}
        {required && <Text style={s.req}> *</Text>}
      </Text>
      {children}
    </View>
  );
}

function Input(props: React.ComponentProps<typeof TextInput>) {
  return <TextInput style={s.input} placeholderTextColor="#9A96AD" {...props} />;
}

function PasswordInput({
  value,
  onChangeText,
  placeholder,
}: {
  value: string;
  onChangeText: (v: string) => void;
  placeholder: string;
}) {
  const [show, setShow] = useState(false);
  return (
    <View style={s.inputRow}>
      <TextInput
        style={s.inputFlex}
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor="#9A96AD"
        secureTextEntry={!show}
        textContentType="newPassword"
        autoCapitalize="none"
        autoCorrect={false}
      />
      <Pressable style={s.showHide} onPress={() => setShow(v => !v)}>
        <Text style={s.showHideText}>{show ? 'Hide' : 'Show'}</Text>
      </Pressable>
    </View>
  );
}

function RoleSelector({
  value,
  onSelect,
}: {
  value: string;
  onSelect: (v: string) => void;
}) {
  const [open, setOpen] = useState(false);
  return (
    <>
      <Pressable
        style={s.inputRow}
        onPress={() => setOpen(true)}
        accessibilityRole="button"
      >
        <Text style={[s.roleText, !value && s.rolePlaceholder]}>
          {value || 'Select Role'}
        </Text>
        <ChevronDown />
      </Pressable>
      <Modal
        visible={open}
        transparent
        animationType="slide"
        onRequestClose={() => setOpen(false)}
      >
        <Pressable style={s.overlay} onPress={() => setOpen(false)}>
          <Pressable style={s.sheet} onPress={() => {}}>
            <View style={s.handle} />
            <Text style={s.sheetTitle}>Select Role</Text>
            {ROLES.map(r => (
              <Pressable
                key={r}
                style={[s.sheetItem, value === r && s.sheetItemOn]}
                onPress={() => {
                  onSelect(r);
                  setOpen(false);
                }}
              >
                <Text style={[s.sheetItemText, value === r && s.sheetItemTextOn]}>
                  {r}
                </Text>
                {value === r && <View style={s.sheetDot} />}
              </Pressable>
            ))}
          </Pressable>
        </Pressable>
      </Modal>
    </>
  );
}

function PreferenceDropdown({
  label,
  value,
  options,
  placeholder,
  onSelect,
}: {
  label: string;
  value: string;
  options: string[];
  placeholder: string;
  onSelect: (v: string) => void;
}) {
  const [open, setOpen] = useState(false);
  return (
    <View style={s.field}>
      <Text style={s.label}>{label}</Text>
      <Pressable
        style={s.preferenceDropdown}
        onPress={() => setOpen(true)}
        accessibilityRole="button"
      >
        <Text
          style={[
            s.preferenceDropdownText,
            !value && s.preferenceDropdownPlaceholder,
          ]}
          numberOfLines={1}
        >
          {value || placeholder}
        </Text>
        <ChevronDown />
      </Pressable>
      <Modal
        visible={open}
        transparent
        animationType="slide"
        onRequestClose={() => setOpen(false)}
      >
        <Pressable style={s.overlay} onPress={() => setOpen(false)}>
          <Pressable style={s.sheet} onPress={() => {}}>
            <View style={s.handle} />
            <Text style={s.sheetTitle}>{label}</Text>
            <ScrollView keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
              {options.map(opt => (
                <Pressable
                  key={opt}
                  style={[s.sheetItem, value === opt && s.sheetItemOn]}
                  onPress={() => {
                    onSelect(opt);
                    setOpen(false);
                  }}
                >
                  <Text style={[s.sheetItemText, value === opt && s.sheetItemTextOn]}>
                    {opt}
                  </Text>
                  {value === opt && <View style={s.sheetDot} />}
                </Pressable>
              ))}
            </ScrollView>
          </Pressable>
        </Pressable>
      </Modal>
    </View>
  );
}

function MultiSelectDropdown({
  label,
  options,
  selected,
  placeholder,
  addMorePlaceholder,
  onToggle,
}: {
  label: string;
  options: { value: string; label: string }[];
  selected: string[];
  placeholder: string;
  addMorePlaceholder: string;
  onToggle: (value: string) => void;
}) {
  const [open, setOpen] = useState(false);
  return (
    <View style={s.field}>
      <Text style={s.label}>{label}</Text>

      {selected.length > 0 && (
        <View style={[s.tChipWrap, { marginBottom: 10 }]}>
          {selected.map(value => {
            const option = options.find(o => o.value === value);
            const text = option ? option.label : value;
            return (
              <Pressable
                key={value}
                style={[s.tChip, s.tChipOn]}
                onPress={() => onToggle(value)}
                accessibilityRole="button"
                accessibilityLabel={`Remove ${text}`}
              >
                <Text style={[s.tChipText, s.tChipTextOn]}>{text}  ×</Text>
              </Pressable>
            );
          })}
        </View>
      )}

      <Pressable
        style={s.preferenceDropdown}
        onPress={() => setOpen(true)}
        accessibilityRole="button"
      >
        <Text style={[s.preferenceDropdownText, s.preferenceDropdownPlaceholder]} numberOfLines={1}>
          {selected.length > 0 ? addMorePlaceholder : placeholder}
        </Text>
        <ChevronDown />
      </Pressable>

      <Modal
        visible={open}
        transparent
        animationType="slide"
        onRequestClose={() => setOpen(false)}
      >
        <Pressable style={s.overlay} onPress={() => setOpen(false)}>
          <Pressable style={s.sheet} onPress={() => {}}>
            <View style={s.handle} />
            <Text style={s.sheetTitle}>{label}</Text>
            <ScrollView keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
              {options.map(opt => {
                const on = selected.includes(opt.value);
                return (
                  <Pressable
                    key={opt.value}
                    style={[s.sheetItem, on && s.sheetItemOn]}
                    onPress={() => onToggle(opt.value)}
                    accessibilityRole="checkbox"
                    accessibilityState={{ checked: on }}
                  >
                    <Text style={[s.sheetItemText, on && s.sheetItemTextOn]}>{opt.label}</Text>
                    {on && <View style={s.sheetDot} />}
                  </Pressable>
                );
              })}
            </ScrollView>
            <Pressable style={s.multiDoneButton} onPress={() => setOpen(false)} accessibilityRole="button">
              <Text style={s.multiDoneText}>Done</Text>
            </Pressable>
          </Pressable>
        </Pressable>
      </Modal>
    </View>
  );
}

// ─── Main RegisterScreen ──────────────────────────────────────────────────────

function RegisterScreen({ navigation }: Props) {
  const [accountType, setAccountType] = useState<AccountType>('Personal');
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [countryCode, setCountryCode] = useState('+91');
  const [mobile, setMobile] = useState('');
  const [mobileError, setMobileError] = useState('');
  const [hasAttemptedNext, setHasAttemptedNext] = useState(false);
  const [password, setPassword] = useState('');
  const [referral, setReferral] = useState('');
  const [coupon, setCoupon] = useState('');
  const [role, setRole] = useState('');
  const [agreed, setAgreed] = useState(false);
  const [step, setStep] = useState(1);
  const [subscriptionType, setSubscriptionType] = useState('');
  const [accountCategory, setAccountCategory] = useState('');
  const [board, setBoard] = useState('');
  const [educationClass, setEducationClass] = useState('');
  const [stream, setStream] = useState('');
  const [medium, setMedium] = useState('');
  const [targetExams, setTargetExams] = useState<string[]>([]);
  const [schoolName, setSchoolName] = useState('');
  const [city, setCity] = useState('');
  const [stateName, setStateName] = useState('');
  const [dateOfBirth, setDateOfBirth] = useState('');
  const [educationError, setEducationError] = useState('');
  const [showDatePicker, setShowDatePicker] = useState(false);

  // Step 4 - Parent Information
  const [parentName, setParentName] = useState('');
  const [parentMobile, setParentMobile] = useState('');
  const [parentEmail, setParentEmail] = useState('');
  const [parentRelationship, setParentRelationship] = useState('Father');

  // Step 5 - Student Schedule
  const [selectedDay, setSelectedDay] = useState('Mon');
  const [timetable, setTimetable] = useState<TimetableActivity[]>([]);
  const [showAddActivity, setShowAddActivity] = useState(false);
  const [selectedActivityType, setSelectedActivityType] = useState<ActivityType>('Class');

  // Dedicated independent state for every field
  const [classCoreSubject, setClassCoreSubject] = useState('');
  const [classNotes, setClassNotes] = useState('');
  const [optionalSubjects, setOptionalSubjects] = useState<string[]>([]);
  const [currentOptionalSubject, setCurrentOptionalSubject] = useState('');

  const [tuitionSubject, setTuitionSubject] = useState('');
  const [tuitionInstitute, setTuitionInstitute] = useState('');
  const [tuitionNotes, setTuitionNotes] = useState('');

  const [sportsActivity, setSportsActivity] = useState('');
  const [sportsNotes, setSportsNotes] = useState('');

  const [selfStudyTopic, setSelfStudyTopic] = useState('');
  const [selfStudyNotes, setSelfStudyNotes] = useState('');

  const [otherActivityName, setOtherActivityName] = useState('');
  const [otherNotes, setOtherNotes] = useState('');

  const [activityError, setActivityError] = useState('');

  // Step 6 - Academic Records
  const [academicRecords, setAcademicRecords] = useState<AcademicRecord[]>([]);
  const [academicError, setAcademicError] = useState('');

  const makeEmptyRecord = (): AcademicRecord => ({
    id: `rec-${Date.now()}-${Math.random()}`,
    examName: '',
    subject: '',
    totalMarks: '',
    obtainedMarks: '',
    grade: '',
    semester: '',
    examDate: '',
    digilockerUrl: '',
    showDatePicker: false,
  });

  const handleAddRecord = () => {
    setAcademicError('');
    setAcademicRecords(prev => [...prev, makeEmptyRecord()]);
  };

  const handleDeleteRecord = (id: string) => {
    setAcademicError('');
    setAcademicRecords(prev => prev.filter(r => r.id !== id));
  };

  const handleRecordChange = (id: string, field: keyof AcademicRecord, value: string | boolean) => {
    setAcademicRecords(prev =>
      prev.map(r => (r.id === id ? { ...r, [field]: value } : r)),
    );
  };

  const handleAcademicNext = () => {
    setAcademicError('');
    const invalid = academicRecords.find(
      r => !r.examName.trim() || !r.subject.trim() || !r.totalMarks.trim() || !r.obtainedMarks.trim() || !r.examDate,
    );
    if (invalid) {
      setAcademicError('Please fill in Exam Name, Subject, Total Marks, Obtained Marks and Exam Date for each record.');
      return;
    }
    const badMarks = academicRecords.find(r => {
      const total = Number(r.totalMarks);
      const obtained = Number(r.obtainedMarks);
      return Number.isNaN(total) || Number.isNaN(obtained) || total <= 0 || obtained < 0 || obtained > total;
    });
    if (badMarks) {
      setAcademicError('Marks must be numbers, and obtained marks cannot be more than total marks.');
      return;
    }
    console.log('Registration Step 6:', { academicRecords });
    setStep(7);
  };

  // ── Teacher flow ───────────────────────────────────────────────────────────
  const [companyName, setCompanyName] = useState('');
  const [companyRole, setCompanyRole] = useState('');

  // Company accounts have their own flow, so the personal roles are ignored for them.
  const isCompany = accountType === 'Company';
  // Educational Institute has its own 3 steps; any other company uses the 5-step company flow.
  const isInstitute = isCompany && companyRole === 'Educational Institute';
  const isCompanyFlow = isCompany && !isInstitute;

  // Keeps the focused field visible above the keyboard (company and institute pages only).
  // Typed loosely: newer React Native versions change the ScrollView ref type.
  const mainScrollRef = useRef<any>(null);
  const mainScrollY = useRef(0);
  const keyboardAssist = useRef(false);
  keyboardAssist.current = isCompany;
  const [keyboardHeight, setKeyboardHeight] = useState(0);

  useEffect(() => {
    const showSub = Keyboard.addListener('keyboardDidShow', e => {
      if (!keyboardAssist.current) {
        return;
      }
      setKeyboardHeight(e.endCoordinates.height);
      const keyboardTop = e.endCoordinates.screenY;
      setTimeout(() => {
        const focused = (TextInput as any).State?.currentlyFocusedInput?.();
        if (!focused || !mainScrollRef.current) {
          return;
        }
        focused.measure((_x: number, _y: number, _w: number, height: number, _pageX: number, pageY: number) => {
          const overflow = pageY + height + 24 - keyboardTop;
          if (overflow > 0) {
            mainScrollRef.current?.scrollTo({ y: mainScrollY.current + overflow, animated: true });
          }
        });
      }, 150);
    });
    const hideSub = Keyboard.addListener('keyboardDidHide', () => setKeyboardHeight(0));
    return () => {
      showSub.remove();
      hideSub.remove();
    };
  }, []);
  const isTeacher = !isCompany && role === 'Teacher';
  const isEmployee = !isCompany && role === 'Employee';
  const timetableDays = isTeacher ? TEACHER_TIMETABLE_DAYS : TIMETABLE_DAYS;
  const activityTypes = isTeacher ? TEACHER_ACTIVITY_TYPES : ACTIVITY_TYPES;

  const [teacherTypes, setTeacherTypes] = useState<string[]>([]);
  const [teachingMode, setTeachingMode] = useState<string[]>([]);
  const [teachingLanguages, setTeachingLanguages] = useState<string[]>([]);
  const [teacherStep3Attempted, setTeacherStep3Attempted] = useState(false);

  const [teacherState, setTeacherState] = useState('');
  const [teacherCity, setTeacherCity] = useState('');
  const [institutions, setInstitutions] = useState<string[]>([]);
  const [institutionInput, setInstitutionInput] = useState('');
  const [boardsTeach, setBoardsTeach] = useState<string[]>([]);
  const [teacherStep4Attempted, setTeacherStep4Attempted] = useState(false);

  const [educationLevels, setEducationLevels] = useState<string[]>([]);
  const [classesTeach, setClassesTeach] = useState<string[]>([]);

  const [subjectsTeach, setSubjectsTeach] = useState<string[]>([]);
  const [subjectInput, setSubjectInput] = useState('');
  const [subjectError, setSubjectError] = useState('');

  const [teacherDivision, setTeacherDivision] = useState('');
  const [teacherSubject, setTeacherSubject] = useState('');

  const handleRoleSelect = (value: string) => {
    if (value !== role) {
      // Different roles use different timetables, so never carry one over.
      setTimetable([]);
      setSelectedDay('Mon');
    }
    setRole(value);
  };

  const handleTeachingModeToggle = (mode: string) => {
    if (mode === 'Both') {
      setTeachingMode(teachingMode.includes('Both') ? [] : ['Both']);
      return;
    }
    const next = toggleInList(teachingMode.filter(m => m !== 'Both'), mode);
    // Online + Offline together is the same thing as Both.
    setTeachingMode(next.includes('Online') && next.includes('Offline') ? ['Both'] : next);
  };

  const teacherStep3Errors = {
    types: teacherTypes.length === 0 ? 'Please select at least one type of teacher.' : '',
    mode: teachingMode.length === 0 ? 'Please select a mode of teaching.' : '',
    languages: teachingLanguages.length === 0 ? 'Please select at least one language.' : '',
  };
  const teacherStep3Invalid = !!(teacherStep3Errors.types || teacherStep3Errors.mode || teacherStep3Errors.languages);

  const handleTeacherStep3Next = () => {
    setTeacherStep3Attempted(true);
    if (teacherStep3Invalid) {
      return;
    }
    setStep(4);
  };

  const teacherStateError = !teacherState ? 'Please select your state.' : '';

  const handleAddInstitution = () => {
    const name = institutionInput.trim();
    if (!name) {
      return;
    }
    if (!institutions.some(i => i.toLowerCase() === name.toLowerCase())) {
      setInstitutions(prev => [...prev, name]);
    }
    setInstitutionInput('');
  };

  const handleTeacherStep4Next = () => {
    setTeacherStep4Attempted(true);
    if (teacherStateError) {
      return;
    }
    // A typed institution that was never added with + should not be lost.
    const pending = institutionInput.trim();
    if (pending && !institutions.some(i => i.toLowerCase() === pending.toLowerCase())) {
      setInstitutions(prev => [...prev, pending]);
    }
    setInstitutionInput('');
    setStep(5);
  };

  const handleAddSubject = (raw?: string) => {
    const name = (raw ?? subjectInput).trim();
    if (!name) {
      return;
    }
    if (subjectsTeach.some(x => x.toLowerCase() === name.toLowerCase())) {
      setSubjectError('This subject has already been added.');
      return;
    }
    setSubjectsTeach(prev => [...prev, name]);
    setSubjectInput('');
    setSubjectError('');
  };

  const handleTogglePopularSubject = (name: string) => {
    const existing = subjectsTeach.find(x => x.toLowerCase() === name.toLowerCase());
    if (existing) {
      setSubjectsTeach(prev => prev.filter(x => x !== existing));
      setSubjectError('');
    } else {
      handleAddSubject(name);
    }
  };

  const handleTeacherFinish = async () => {
    setSubmitError('');
    setSubmitting(true);

    // Backend format: { "CLASS-MON": { lectures: ["8-A, Mathematics", ...] } }
    const teacherTimetable: Record<string, { lectures: string[] }> = {};
    timetable.forEach(item => {
      const key = `${item.activityType.toUpperCase()}-${item.day.toUpperCase()}`;
      if (!teacherTimetable[key]) {
        teacherTimetable[key] = { lectures: [] };
      }
      teacherTimetable[key].lectures.push(item.title);
    });

    const payload: Record<string, unknown> = {
      // Step 1
      accountType,
      fullName,
      email,
      countryCode,
      mobile,
      password,
      referral,
      coupon,
      role,
      agreedToTerms: agreed,
      // Step 2
      subscriptionType,
      accountCategory,
      // Step 3
      teacherType: teacherTypes,
      teachingMode,
      teachingLanguages,
      // Step 4
      teacherState,
      teacherCity: teacherCity.trim(),
      institutions,
      boardsTeach,
      // Step 5
      educationLevels,
      classesTeach,
      // Step 6
      subjectsTeach,
      // Step 7
      teacherTimetable,
    };

    try {
      await registerUser(payload);
      navigation.replace('EmailVerification', { email: email.trim().toLowerCase() });
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Registration failed. Please try again.';
      setSubmitError(message);
    } finally {
      setSubmitting(false);
    }
  };

  // ── Employee flow ──────────────────────────────────────────────────────────
  const [empEducationLevel, setEmpEducationLevel] = useState('');
  const [empDegree, setEmpDegree] = useState('');
  const [empExperience, setEmpExperience] = useState('');
  const [empIndustry, setEmpIndustry] = useState('');
  const [empRole, setEmpRole] = useState('');
  const [empCareerTarget, setEmpCareerTarget] = useState('');
  const [empStep3Attempted, setEmpStep3Attempted] = useState(false);

  const [empTasks, setEmpTasks] = useState('');
  const [empUseAI, setEmpUseAI] = useState<boolean | null>(null);
  const [empHelp, setEmpHelp] = useState('');
  const [empStep4Attempted, setEmpStep4Attempted] = useState(false);

  const empStep3Errors = {
    level: !empEducationLevel ? 'Please select your education level.' : '',
    degree: !empDegree ? 'Please select your education degree.' : '',
    experience: !empExperience ? 'Please select your experience.' : '',
    industry: !empIndustry ? 'Please select your industry.' : '',
    role: !empRole ? 'Please select your role.' : '',
  };
  const empStep3Invalid = Object.values(empStep3Errors).some(Boolean);
  const empAIError = empUseAI === null ? 'Please answer the Generative AI question.' : '';

  const handleEmployeeStep3Next = () => {
    setEmpStep3Attempted(true);
    if (empStep3Invalid) {
      return;
    }
    setStep(4);
  };

  const handleEmployeeFinish = async () => {
    setEmpStep4Attempted(true);
    if (empAIError) {
      return;
    }

    setSubmitError('');
    setSubmitting(true);

    const levelOption = EMP_EDUCATION_LEVELS.find(o => o.label === empEducationLevel);

    const payload: Record<string, unknown> = {
      // Step 1
      accountType,
      fullName,
      email,
      countryCode,
      mobile,
      password,
      referral,
      coupon,
      role,
      agreedToTerms: agreed,
      // Step 2
      subscriptionType,
      accountCategory,
      // Step 3
      educationLevel: levelOption ? levelOption.value : empEducationLevel,
      educationDegree: empDegree,
      experience: empExperience,
      industry: empIndustry,
      employeeRole: empRole,
      careerTarget: empCareerTarget,
      // Step 4
      dayToDayTasks: empTasks.trim(),
      useGenerativeAI: empUseAI === true,
      howCanWeHelp: empHelp.trim(),
    };

    try {
      await registerUser(payload);
      navigation.replace('EmailVerification', { email: email.trim().toLowerCase() });
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Registration failed. Please try again.';
      setSubmitError(message);
    } finally {
      setSubmitting(false);
    }
  };

  // ── Educational Institute flow (3 steps) ──────────────────────────────────
  const [instName, setInstName] = useState('');
  const [instAddress, setInstAddress] = useState('');
  const [instLevels, setInstLevels] = useState<string[]>([]);
  const [instStream, setInstStream] = useState('');
  const [instSports, setInstSports] = useState('');
  const [instStudents, setInstStudents] = useState('');
  const [instTeachers, setInstTeachers] = useState('');
  const [instMode, setInstMode] = useState('');
  const [instStep3Attempted, setInstStep3Attempted] = useState(false);

  // Upload Details (optional): a teacher or student Excel/CSV list, uploaded after registration.
  const [instUploadType, setInstUploadType] = useState<'teachers' | 'students' | null>(null);
  const [instUploadFile, setInstUploadFile] = useState<{ uri: string; name: string; type?: string } | null>(null);
  const [instUploadError, setInstUploadError] = useState('');

  const handleInstUploadType = (type: 'teachers' | 'students') => {
    setInstUploadType(type);
    setInstUploadFile(null);
    setInstUploadError('');
  };

  const handlePickInstituteFile = async () => {
    setInstUploadError('');
    // Loaded only when needed, so the app still runs if the picker package is not installed yet.
    let picker: any = null;
    try {
      picker = require('@react-native-documents/picker');
    } catch (_e) {
      picker = null;
    }
    if (!picker || typeof picker.pick !== 'function') {
      setInstUploadError('File picker is not installed yet. Please install it and rebuild the app.');
      return;
    }
    try {
      const results = await picker.pick({
        type: [picker.types.xlsx, picker.types.xls, picker.types.csv],
      });
      const file = Array.isArray(results) ? results[0] : results;
      if (file && file.uri) {
        setInstUploadFile({ uri: file.uri, name: file.name || 'upload', type: file.type || undefined });
      }
    } catch (err: any) {
      const cancelled =
        typeof picker.isErrorWithCode === 'function' &&
        picker.isErrorWithCode(err) &&
        err.code === picker.errorCodes?.OPERATION_CANCELED;
      if (!cancelled) {
        setInstUploadError('Could not open the file. Please try again.');
      }
    }
  };

  const instErrors = {
    name: !instName.trim() ? 'Please enter the name of the institute.' : '',
    address: !instAddress.trim() ? 'Please enter the address.' : '',
    levels: instLevels.length === 0 ? 'Please select at least one academic level.' : '',
    mode: !instMode ? 'Please select the mode of education.' : '',
  };
  const instInvalid = Object.values(instErrors).some(Boolean);

  const handleInstituteFinish = async () => {
    setInstStep3Attempted(true);
    if (instInvalid) {
      return;
    }

    setSubmitError('');
    setSubmitting(true);

    const payload: Record<string, unknown> = {
      // Step 1
      isCompanyAccount: true,
      accountType,
      companyName: companyName.trim(),
      companyAccountRole: companyRole,
      email,
      countryCode,
      mobile,
      password,
      referral,
      coupon,
      agreedToTerms: agreed,
      // Step 2
      subscriptionType,
      accountCategory,
      // Step 3
      instituteName: instName.trim(),
      instituteAddress: instAddress.trim(),
      academicLevels: instLevels,
      stream: instStream.trim(),
      sports: instSports.trim(),
      noOfStudents: instStudents,
      noOfTeachers: instTeachers,
      modeOfEducation: instMode,
    };

    try {
      const registered = await registerUser(payload);

      // Optional bulk list: sent after the account exists, using the institute code from the backend.
      if (instUploadFile && instUploadType) {
        const companyCode =
          registered?.companyCode ??
          registered?.user?.companyCode ??
          registered?.educationalInstituteProfile?.companyCode;
        let uploadFailed = false;
        if (companyCode) {
          try {
            await uploadInstituteFile(instUploadType, instUploadFile, companyCode, email);
          } catch (_e) {
            uploadFailed = true;
          }
        } else {
          uploadFailed = true;
        }
        if (uploadFailed) {
          Alert.alert(
            'Registration completed',
            'Your account was created, but the file could not be uploaded. You can upload it again later.',
          );
        }
      }

      navigation.replace('EmailVerification', { email: email.trim().toLowerCase() });
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Registration failed. Please try again.';
      setSubmitError(message);
    } finally {
      setSubmitting(false);
    }
  };

  // ── Company flow (5 steps) ─────────────────────────────────────────────────
  const [companyPersonalName, setCompanyPersonalName] = useState('');
  const [companyWebsite, setCompanyWebsite] = useState('');
  const [companyJobRole, setCompanyJobRole] = useState('');
  const [companyStep3Attempted, setCompanyStep3Attempted] = useState(false);

  const [companyIndustry, setCompanyIndustry] = useState('');
  const [companyHeadCount, setCompanyHeadCount] = useState('');
  const [companyStep4Attempted, setCompanyStep4Attempted] = useState(false);

  const [companyUseAI, setCompanyUseAI] = useState<boolean | null>(null);
  const [companyAIModels, setCompanyAIModels] = useState<string[]>([]);
  const [companyAIReason, setCompanyAIReason] = useState('');
  const [companyHelp, setCompanyHelp] = useState('');
  const [companyStep5Attempted, setCompanyStep5Attempted] = useState(false);

  const companyStep3Errors = {
    name: companyPersonalName.trim().length < 3 ? 'Please enter your name (at least 3 characters).' : '',
    role: !companyJobRole.trim() ? 'Please enter your role in the company.' : '',
  };
  const companyStep3Invalid = !!(companyStep3Errors.name || companyStep3Errors.role);

  const companyStep4Errors = {
    industry: !companyIndustry ? 'Please select the company industry.' : '',
    headCount: !companyHeadCount ? 'Please select the company head count.' : '',
  };
  const companyStep4Invalid = !!(companyStep4Errors.industry || companyStep4Errors.headCount);

  const companyAIAnswerError = companyUseAI === null ? 'Please answer the Generative AI question.' : '';
  const companyAIError =
    companyUseAI === true && companyAIModels.length === 0 ? 'Please select at least one model.' : '';

  const handleCompanyStep3Next = () => {
    setCompanyStep3Attempted(true);
    if (companyStep3Invalid) {
      return;
    }
    setStep(4);
  };

  const handleCompanyStep4Next = () => {
    setCompanyStep4Attempted(true);
    if (companyStep4Invalid) {
      return;
    }
    setStep(5);
  };

  const handleCompanyFinish = async () => {
    setCompanyStep5Attempted(true);
    if (companyAIAnswerError || companyAIError) {
      return;
    }

    setSubmitError('');
    setSubmitting(true);

    const payload: Record<string, unknown> = {
      // Step 1
      isCompanyAccount: true,
      accountType,
      companyName: companyName.trim(),
      email,
      countryCode,
      mobile,
      password,
      referral,
      coupon,
      agreedToTerms: agreed,
      // Step 2
      subscriptionType,
      accountCategory,
      // Step 3
      personalName: companyPersonalName.trim(),
      companyWebsite: companyWebsite.trim(),
      companyJobRole: companyJobRole.trim(),
      // Step 4
      companyIndustry,
      companyHeadCount,
      // Step 5
      useGenerativeAI: companyUseAI === true,
      useGenerativeAIModels: companyUseAI === true ? companyAIModels : [],
      howCanWeHelp: companyUseAI === true ? companyAIReason.trim() : '',
      dayToDayTasks: companyUseAI === true ? companyHelp.trim() : '',
    };

    try {
      await registerUser(payload);
      navigation.replace('EmailVerification', { email: email.trim().toLowerCase() });
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Registration failed. Please try again.';
      setSubmitError(message);
    } finally {
      setSubmitting(false);
    }
  };

  // ── Step 7 state ──────────────────────────────────────────────────────────
  const [academicPattern, setAcademicPattern] = useState('');
  const [learningSources, setLearningSources] = useState<string[]>([]);
  const [showPatternSheet, setShowPatternSheet] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState('');
  const [patternError, setPatternError] = useState('');
  const [termsCompleted, setTermsCompleted] = useState('');
  const [semestersCompleted, setSemestersCompleted] = useState('');
  const [annualProgress, setAnnualProgress] = useState('');
  const [otherLearningSource, setOtherLearningSource] = useState('');
  const [primaryLearningSource, setPrimaryLearningSource] = useState('');
  const [sourcesError, setSourcesError] = useState('');

  const toggleLearningSource = (source: string) => {
    const next = learningSources.includes(source)
      ? learningSources.filter(x => x !== source)
      : [...learningSources, source];
    setLearningSources(next);
    setSourcesError('');
    if (next.length <= 1 || !next.includes(primaryLearningSource)) {
      setPrimaryLearningSource('');
    }
    if (!next.includes('Other')) {
      setOtherLearningSource('');
    }
  };

  const handleFinishRegistration = async () => {
    if (!academicPattern) {
      setPatternError('Please select an academic pattern.');
      return;
    }
    if (academicPattern === 'Term' && termsCompleted === '') {
      setPatternError('Please select the number of terms completed.');
      return;
    }
    if (academicPattern === 'Semester' && semestersCompleted === '') {
      setPatternError('Please select the number of semesters completed.');
      return;
    }
    if (academicPattern === 'Annual' && !annualProgress) {
      setPatternError('Please select your annual syllabus progress.');
      return;
    }
    if (learningSources.length === 0) {
      setSourcesError('Please select at least one learning source.');
      return;
    }
    if (learningSources.includes('Other') && !otherLearningSource.trim()) {
      setSourcesError('Please specify the other learning source.');
      return;
    }
    if (learningSources.length > 1 && !primaryLearningSource) {
      setSourcesError('Please select which learning source is ahead.');
      return;
    }
    setPatternError('');
    setSourcesError('');
    setSubmitError('');
    setSubmitting(true);

    const payload: Record<string, unknown> = {
      // Step 1
      accountType,
      fullName,
      email,
      countryCode,
      mobile,
      password,
      referral,
      coupon,
      role,
      agreedToTerms: agreed,
      // Step 2
      subscriptionType,
      accountCategory,
      // Step 3
      board,
      educationClass,
      stream,
      medium,
      targetExams: TARGET_EXAM_CLASSES.includes(educationClass) ? targetExams : [],
      schoolName,
      city,
      state: stateName,
      dateOfBirth,
      // Step 4
      parentName,
      parentMobile,
      parentEmail,
      parentRelationship,
      // Step 5
      timetable,
      // Step 6
      academicRecords: academicRecords.map(({ showDatePicker: _sdp, ...rest }) => rest),
      // Step 7
      academicPattern,
      learningSources,
      termsCompleted: academicPattern === 'Term' ? Number(termsCompleted) : undefined,
      semestersCompleted: academicPattern === 'Semester' ? Number(semestersCompleted) : undefined,
      annualProgress: academicPattern === 'Annual' ? annualProgress : undefined,
      otherLearningSource: learningSources.includes('Other') ? otherLearningSource.trim() : undefined,
      primaryLearningSource: learningSources.length > 1 ? primaryLearningSource : undefined,
    };

    try {
      await registerUser(payload);
      // Registration succeeded: ask the user to verify their email before logging in.
      navigation.replace('EmailVerification', { email: email.trim().toLowerCase() });
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Registration failed. Please try again.';
      setSubmitError(message);
    } finally {
      setSubmitting(false);
    }
  };

  const handleMobileChange = (text: string) => {
    let cleaned = text.trim();
    if (cleaned.startsWith('+91')) {
      cleaned = cleaned.slice(3);
    }
    const digitsOnly = cleaned.replace(/\D/g, '');
    setMobile(digitsOnly);
    if (digitsOnly.length === 10) {
      setMobileError('');
    } else if (hasAttemptedNext) {
      setMobileError('Please enter a valid 10-digit mobile number.');
    }
  };

  const [checkingEmail, setCheckingEmail] = useState(false);
  const [emailTakenError, setEmailTakenError] = useState('');

  const getStep1Errors = () => {
    const e: Record<string, string> = {};
    if (accountType === 'Affiliate') {
      e.accountType = 'Only Personal and Company accounts are available right now.';
    }
    if (isCompany) {
      if (!companyName.trim()) {
        e.companyName = 'Please enter the company or institute name.';
      } else if (companyName.trim().length < 3) {
        e.companyName = 'Please enter a valid name (at least 3 characters).';
      }
    } else if (!fullName.trim()) {
      e.fullName = 'Please enter your full name.';
    }
    if (!email.trim()) {
      e.email = 'Please enter your email address.';
    } else if (!EMAIL_REGEX.test(email.trim())) {
      e.email = 'Please enter a valid email address.';
    }
    if (!password) {
      e.password = 'Please enter a password.';
    } else if (!PASSWORD_REGEX.test(password)) {
      e.password =
        'Password must be at least 8 characters and include an uppercase letter, a lowercase letter, a number and a special character.';
    }
    if (!isCompany) {
      if (!role) {
        e.role = 'Please select a role.';
      } else if (role !== 'Student' && role !== 'Teacher' && role !== 'Employee') {
        e.role = 'Only Student, Teacher and Employee registration is available right now.';
      }
    }
    if (referral.trim() && !/^[A-Za-z0-9]+$/.test(referral.trim())) {
      e.referral = 'Referral code can contain only letters and numbers.';
    }
    if (!agreed) {
      e.terms = 'Please accept the Terms & Conditions to continue.';
    }
    return e;
  };

  const step1Errors: Record<string, string> = hasAttemptedNext ? getStep1Errors() : {};

  const handleNextStep = async () => {
    setHasAttemptedNext(true);

    const errors = getStep1Errors();
    const digitsOnly = mobile.replace(/\D/g, '');
    const mobileInvalid = digitsOnly.length !== 10;

    setMobileError(mobileInvalid ? 'Please enter a valid 10-digit mobile number.' : '');

    if (mobileInvalid || Object.keys(errors).length > 0) {
      return;
    }

    // Catch an already-registered email now instead of at the last step.
    setCheckingEmail(true);
    try {
      const result = await checkEmailExists(email.trim().toLowerCase());
      if (result.exists) {
        setEmailTakenError('This email is already registered. Please log in instead.');
        return;
      }
    } catch {
      // Network or server problem: don't block the user. The backend checks again on submit.
    } finally {
      setCheckingEmail(false);
    }

    setStep(2);
  };

  // Step 2
  const [prefError, setPrefError] = useState('');

  // Step 4
  const [parentAttempted, setParentAttempted] = useState(false);
  const parentMobileError =
    parentAttempted && parentMobile && !PARENT_MOBILE_REGEX.test(parentMobile)
      ? 'Enter a valid 10-digit mobile number starting with 6, 7, 8 or 9.'
      : '';
  const parentEmailError =
    parentAttempted && parentEmail.trim() && !EMAIL_REGEX.test(parentEmail.trim())
      ? 'Please enter a valid email address.'
      : '';

  const handleParentNext = () => {
    setParentAttempted(true);
    if (
      (parentMobile && !PARENT_MOBILE_REGEX.test(parentMobile)) ||
      (parentEmail.trim() && !EMAIL_REGEX.test(parentEmail.trim()))
    ) {
      return;
    }
    setStep(5);
  };

  const handleParentSkip = () => {
    setParentName('');
    setParentMobile('');
    setParentEmail('');
    setParentAttempted(false);
    setStep(5);
  };

  const isSeniorClass = educationClass === '11' || educationClass === '12';

  const handleClassChange = (value: string) => {
    setEducationClass(value);
    setEducationError('');

    if (value !== '11' && value !== '12') {
      setStream('');
    }
    if (!TARGET_EXAM_CLASSES.includes(value)) {
      setTargetExams([]);
    }
  };

  const handleEducationNext = () => {
    if (!board) {
      setEducationError('Please select a board.');
      return;
    }

    if (!educationClass) {
      setEducationError('Please select a class.');
      return;
    }

    if (isSeniorClass && !stream) {
      setEducationError('Please select a stream for Class 11 or 12.');
      return;
    }

    setEducationError('');
    console.log('Registration Step 3:', {
      board,
      class: educationClass,
      stream: isSeniorClass ? stream : '',
      medium,
      schoolName,
      city,
      state: stateName,
      dateOfBirth,
    });
    setStep(4);
  };

  // Step 5 helpers
  const selectedDayActivities = timetable.filter(
    item => item.day === selectedDay || item.id.startsWith(`${selectedDay}-`),
  );

  const resetActivityForm = () => {
    setSelectedActivityType('Class');
    setClassCoreSubject('');
    setClassNotes('');
    setOptionalSubjects([]);
    setCurrentOptionalSubject('');
    setTuitionSubject('');
    setTuitionInstitute('');
    setTuitionNotes('');
    setSportsActivity('');
    setSportsNotes('');
    setSelfStudyTopic('');
    setSelfStudyNotes('');
    setOtherActivityName('');
    setOtherNotes('');
    setTeacherDivision('');
    setTeacherSubject('');
    setActivityError('');
  };

  const handleAddOptionalSubject = () => {
    const trimmed = currentOptionalSubject.trim();
    if (!trimmed) {
      return;
    }
    if (optionalSubjects.some(s => s.toLowerCase() === trimmed.toLowerCase())) {
      setActivityError('This optional subject has already been added.');
      return;
    }
    if (trimmed.toLowerCase() === classCoreSubject.trim().toLowerCase()) {
      setActivityError('Optional subject cannot be the same as the core subject.');
      return;
    }
    setOptionalSubjects(prev => [...prev, trimmed]);
    setCurrentOptionalSubject('');
    setActivityError('');
  };

  const handleRemoveOptionalSubject = (indexToRemove: number) => {
    setOptionalSubjects(prev => prev.filter((_, idx) => idx !== indexToRemove));
  };

  const handleAddActivity = () => {
    if (isTeacher) {
      const subject = teacherSubject.trim();
      const division = teacherDivision.trim();
      const isHobby = selectedActivityType === 'Hobby';
      if (!isHobby && !division) {
        setActivityError('Please enter the class and division, for example 8-A.');
        return;
      }
      if (!subject) {
        setActivityError(isHobby ? 'Please enter the hobby or activity.' : 'Please enter the subject.');
        return;
      }
      const sameSlot = timetable.filter(
        item => item.day === selectedDay && item.activityType === selectedActivityType,
      ).length;
      if (sameSlot >= MAX_LECTURES_PER_DAY) {
        setActivityError(`You can add up to ${MAX_LECTURES_PER_DAY} lectures of one type per day.`);
        return;
      }
      setTimetable(current => [
        ...current,
        {
          id: `${selectedDay}-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
          day: selectedDay,
          activityType: selectedActivityType,
          title: isHobby ? subject : `${division}, ${subject}`,
        },
      ]);
      setShowAddActivity(false);
      resetActivityForm();
      return;
    }

    let title = '';
    let notes = '';
    let organization: string | undefined;
    let optSubjects: string[] | undefined;

    if (selectedActivityType === 'Class') {
      title = classCoreSubject.trim();
      if (!title) {
        setActivityError('Please enter the core subject.');
        return;
      }
      notes = classNotes.trim();
      const allOptional = [...optionalSubjects];
      const trimmedCurrentOpt = currentOptionalSubject.trim();
      if (
        trimmedCurrentOpt &&
        !allOptional.some(s => s.toLowerCase() === trimmedCurrentOpt.toLowerCase()) &&
        trimmedCurrentOpt.toLowerCase() !== title.toLowerCase()
      ) {
        allOptional.push(trimmedCurrentOpt);
      }
      if (allOptional.length > 0) {
        optSubjects = allOptional;
      }
    } else if (selectedActivityType === 'Tuition') {
      title = tuitionSubject.trim();
      if (!title) {
        setActivityError('Please enter the subject.');
        return;
      }
      notes = tuitionNotes.trim();
      if (tuitionInstitute.trim()) {
        organization = tuitionInstitute.trim();
      }
    } else if (selectedActivityType === 'Sports') {
      title = sportsActivity.trim();
      if (!title) {
        setActivityError('Please enter the sport or activity.');
        return;
      }
      notes = sportsNotes.trim();
    } else if (selectedActivityType === 'Self Study') {
      title = selfStudyTopic.trim();
      if (!title) {
        setActivityError('Please enter the subject or topic.');
        return;
      }
      notes = selfStudyNotes.trim();
    } else if (selectedActivityType === 'Other') {
      title = otherActivityName.trim();
      if (!title) {
        setActivityError('Please enter the activity name.');
        return;
      }
      notes = otherNotes.trim();
    }

    const newActivity: TimetableActivity = {
      id: `${selectedDay}-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
      day: selectedDay,
      activityType: selectedActivityType,
      title,
      ...(optSubjects ? { optionalSubjects: optSubjects } : {}),
      ...(organization ? { organization } : {}),
      ...(notes ? { notes } : {}),
    };

    setTimetable(current => [...current, newActivity]);
    setShowAddActivity(false);
    resetActivityForm();
  };

  const handleDeleteActivity = (id: string) => {
    setTimetable(current => current.filter(item => item.id !== id));
  };

  const handleTimetableNext = () => {
    console.log('Registration Step 5:', { timetable });
    setStep(6);
  };

  return (
    <SafeAreaView style={s.safe}>
      <KeyboardAvoidingView style={s.flex1} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <ScrollView
          ref={mainScrollRef}
          onScroll={e => {
            mainScrollY.current = e.nativeEvent.contentOffset.y;
          }}
          scrollEventThrottle={16}
          contentContainerStyle={[s.scroll, isCompany && keyboardHeight > 0 && { paddingBottom: keyboardHeight + 24 }]}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >

          {/* Wordmark */}
          <View style={s.wordmarkRow}>
            <Image source={arthumWordmark} resizeMode="contain" style={s.wordmark} accessibilityLabel="Arthum AI" />
          </View>

          {/* Step Indicator */}
          <StepIndicator step={step} labels={isInstitute ? INSTITUTE_STEP_LABELS : isCompany ? COMPANY_STEP_LABELS : isEmployee ? EMPLOYEE_STEP_LABELS : isTeacher ? TEACHER_STEP_LABELS : STUDENT_STEP_LABELS} />

          {step === 1 ? (
            <>
              {/* Page Heading */}
              <Text style={s.heading}>Create your account</Text>
              <Text style={s.subheading}>Fill in your details to get started</Text>

              {/* Profile Image Upload */}
              <View style={s.avatarSection}>
                <Pressable style={s.avatarWrap} accessibilityLabel="Upload profile image" accessibilityRole="button">
                  <View style={s.avatarCircle}>
                    <UserIcon />
                  </View>
                  <View style={s.camBadge}>
                    <CameraIcon />
                  </View>
                </Pressable>
                <Text style={s.avatarLabel}>Profile Image</Text>
                <Text style={s.avatarHint}>Tap to upload or change</Text>
              </View>

              {/* Account Type Segmented Control */}
              <View style={s.segment}>
                {ACCOUNT_TYPES.map(type => {
                  const active = accountType === type;
                  return (
                    <Pressable
                      key={type}
                      style={[s.segBtn, active && s.segBtnActive]}
                      onPress={() => setAccountType(type)}
                      accessibilityRole="radio"
                      accessibilityState={{ selected: active }}
                    >
                      {active ? (
                        <LinearGradient colors={['#4F5BD5', '#6A82FB']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={s.segGrad}>
                          <Text style={s.segTextOn}>{type}</Text>
                        </LinearGradient>
                      ) : (
                        <Text style={s.segText}>{type}</Text>
                      )}
                    </Pressable>
                  );
                })}
              </View>

              {!!step1Errors.accountType && (
                <Text style={[s.errorText, { marginTop: 8 }]}>{step1Errors.accountType}</Text>
              )}

              {/* Form Fields */}
              <View style={s.form}>
                {isCompany ? (
                  <>
                    <PreferenceDropdown
                      label="Role"
                      value={companyRole}
                      options={INSTITUTE_ROLE_OPTIONS}
                      placeholder="Select role (optional)"
                      onSelect={setCompanyRole}
                    />

                    <Field label="Company / Institute Name" required>
                      <Input value={companyName} onChangeText={setCompanyName} placeholder="Enter company or institute name" autoCapitalize="words" autoCorrect={false} />
                      {!!step1Errors.companyName && <Text style={s.errorText}>{step1Errors.companyName}</Text>}
                    </Field>
                  </>
                ) : (
                  <Field label="Full Name" required>
                    <Input value={fullName} onChangeText={setFullName} placeholder="Enter your full name" autoCapitalize="words" autoCorrect={false} textContentType="name" />
                    {!!step1Errors.fullName && <Text style={s.errorText}>{step1Errors.fullName}</Text>}
                  </Field>
                )}

                <Field label="Email Address" required>
                  <Input value={email} onChangeText={v => { setEmail(v); setEmailTakenError(''); }} placeholder="your.email@example.com" keyboardType="email-address" autoCapitalize="none" autoCorrect={false} textContentType="emailAddress" />
                  {!!(step1Errors.email || emailTakenError) && (
                    <Text style={s.errorText}>{step1Errors.email || emailTakenError}</Text>
                  )}
                </Field>

                <Field label="Mobile Number" required>
                  <View style={s.phoneRow}>
                    <TextInput style={s.ccInput} value={countryCode} onChangeText={setCountryCode} placeholder="+91" placeholderTextColor="#9A96AD" keyboardType="phone-pad" maxLength={5} accessibilityLabel="Country code" />
                    <TextInput style={s.mobileInput} value={mobile} onChangeText={handleMobileChange} placeholder="Mobile number" placeholderTextColor="#9A96AD" keyboardType="phone-pad" textContentType="telephoneNumber" accessibilityLabel="Mobile number" />
                  </View>
                  {!!mobileError && (
                    <Text style={s.errorText}>{mobileError}</Text>
                  )}
                </Field>

                <Field label="Password" required>
                  <PasswordInput value={password} onChangeText={setPassword} placeholder="At least 8 characters" />
                  {!!step1Errors.password && <Text style={s.errorText}>{step1Errors.password}</Text>}
                </Field>

                <Field label="Referral Code">
                  <Input value={referral} onChangeText={setReferral} placeholder="Enter referral code (optional)" autoCapitalize="none" autoCorrect={false} />
                  {!!step1Errors.referral && <Text style={s.errorText}>{step1Errors.referral}</Text>}
                </Field>

                <Field label="Coupon Code">
                  <Input value={coupon} onChangeText={setCoupon} placeholder="Enter coupon code (optional)" autoCapitalize="none" autoCorrect={false} />
                </Field>

                {!isCompany && (
                  <Field label="Select Role / Category" required>
                    <RoleSelector value={role} onSelect={handleRoleSelect} />
                    {!!step1Errors.role && <Text style={s.errorText}>{step1Errors.role}</Text>}
                  </Field>
                )}
              </View>

              {/* Terms */}
              <Pressable style={s.termsRow} onPress={() => setAgreed(v => !v)} accessibilityRole="checkbox" accessibilityState={{ checked: agreed }}>
                <CheckboxTick checked={agreed} />
                <Text style={s.termsText}>
                  {'I agree to '}
                  <Text style={s.termsLink}>Terms &amp; Conditions</Text>
                  {' and '}
                  <Text style={s.termsLink}>Privacy Policy</Text>
                </Text>
              </Pressable>

              {!!step1Errors.terms && (
                <Text style={[s.errorText, { marginTop: 8 }]}>{step1Errors.terms}</Text>
              )}

              {/* Next Step */}
              <View style={s.nextWrap}>
                {hasAttemptedNext && (Object.keys(step1Errors).length > 0 || !!mobileError || !!emailTakenError) && (
                  <Text style={[s.errorText, { marginBottom: 8 }]}>
                    Please fix the highlighted fields to continue.
                  </Text>
                )}
                <PrimaryButton
                  title={checkingEmail ? 'Checking...' : 'Next Step'}
                  onPress={handleNextStep}
                  disabled={checkingEmail}
                />
              </View>

              {/* Divider */}
              <View style={s.divRow}>
                <View style={s.divLine} />
                <Text style={s.divText}>OR SIGN UP WITH</Text>
                <View style={s.divLine} />
              </View>

              {/* Social Buttons */}
              <View style={s.socialRow}>
                <SocialBtn letter="G" color="#4285F4" label="Sign up with Google" name="Google" />
                <SocialBtn letter="f" color="#1877F2" label="Sign up with Facebook" name="Facebook" />
              </View>

              {/* Login Link */}
              <View style={s.loginRow}>
                <Text style={s.loginText}>Already have an account?</Text>
                <Pressable style={s.loginBtn} onPress={() => navigation.navigate('Login')} hitSlop={8}>
                  <Text style={s.loginLink}>Login</Text>
                </Pressable>
              </View>

            </>
          ) : step === 2 ? (
            <>
              <View style={s.page2Container}>
                <View style={s.pageHeader}>
                  <Text style={s.pageTitle}>Account Preferences</Text>
                </View>

                <PreferenceDropdown label="Subscription Type *" value={subscriptionType} options={SUBSCRIPTION_TYPES} placeholder="Select Subscription Type" onSelect={v => { setSubscriptionType(v); setPrefError(''); }} />
                <PreferenceDropdown label="Account Category *" value={accountCategory} options={ACCOUNT_CATEGORIES} placeholder="Select Account Category" onSelect={v => { setAccountCategory(v); setPrefError(''); }} />

                <View style={s.infoBox}>
                  <View style={s.infoIcon}><Text style={s.infoIconText}>i</Text></View>
                  <View style={s.infoContent}>
                    <Text style={s.infoTitle}>Premium Benefits:</Text>
                    <Text style={s.infoText}>Unlock advanced features, priority support, and exclusive content.</Text>
                  </View>
                </View>

                {!!prefError && <Text style={[s.errorText, { marginBottom: 8 }]}>{prefError}</Text>}
                <PrimaryButton
                  title="Next Step"
                  onPress={() => {
                    if (!subscriptionType) { setPrefError('Please select a subscription type.'); return; }
                    if (!accountCategory) { setPrefError('Please select an account category.'); return; }
                    setPrefError('');
                    if (isInstitute && !instName.trim()) {
                      setInstName(companyName.trim());
                    }
                    setStep(3);
                  }}
                />
              </View>
            </>
          ) : isInstitute && step === 3 ? (
            <>
              <View style={s.page3Container}>
                <View style={s.pageHeader}>
                  <Text style={s.pageTitle}>Educational Institute Details</Text>
                </View>

                <View style={s.instBlock}>
                  <Field label="Name of Institute" required>
                    <Input value={instName} onChangeText={setInstName} placeholder="Enter institute name" autoCapitalize="words" autoCorrect={false} />
                    {instStep3Attempted && !!instErrors.name && <Text style={s.errorText}>{instErrors.name}</Text>}
                  </Field>
                </View>

                <View style={s.instBlock}>
                  <Text style={s.label}>Address <Text style={s.req}>*</Text></Text>
                  <TextInput
                    style={[s.empTextArea, { minHeight: 100 }]}
                    value={instAddress}
                    onChangeText={setInstAddress}
                    placeholder="Enter full address"
                    placeholderTextColor="#9A96AD"
                    multiline
                    textAlignVertical="top"
                  />
                  {instStep3Attempted && !!instErrors.address && <Text style={s.errorText}>{instErrors.address}</Text>}
                </View>

                <Text style={s.instSectionTitle}>Academic Level <Text style={s.req}>*</Text></Text>
                <View style={s.instLevelGrid}>
                  {INSTITUTE_ACADEMIC_LEVELS.map(level => {
                    const on = instLevels.includes(level);
                    return (
                      <Pressable
                        key={level}
                        style={[s.instLevelItem, on && s.instLevelItemOn]}
                        onPress={() => setInstLevels(prev => toggleInList(prev, level))}
                        accessibilityRole="checkbox"
                        accessibilityState={{ checked: on }}
                      >
                        <CheckboxTick checked={on} />
                        <Text style={[s.tCheckText, on && s.instLevelTextOn]}>{level}</Text>
                      </Pressable>
                    );
                  })}
                </View>
                {instStep3Attempted && !!instErrors.levels && <Text style={s.errorText}>{instErrors.levels}</Text>}

                <View style={[s.instBlock, s.instAfterLevels]}>
                  <Field label="Stream">
                    <Input value={instStream} onChangeText={setInstStream} placeholder="e.g. Science, Commerce, Arts" autoCapitalize="words" autoCorrect={false} />
                  </Field>
                </View>

                <View style={s.instBlock}>
                  <Field label="Sports">
                    <Input value={instSports} onChangeText={setInstSports} placeholder="Sports facilities" autoCapitalize="sentences" />
                  </Field>
                </View>

                <View style={[s.instBlock, { flexDirection: 'row', gap: 16 }]}>
                  <View style={{ flex: 1 }}>
                    <Field label="No. of Students">
                      <Input value={instStudents} onChangeText={v => setInstStudents(v.replace(/\D/g, ''))} placeholder="Number of students" keyboardType="number-pad" />
                    </Field>
                  </View>
                  <View style={{ flex: 1 }}>
                    <Field label="No. of Teachers">
                      <Input value={instTeachers} onChangeText={v => setInstTeachers(v.replace(/\D/g, ''))} placeholder="Number of teachers" keyboardType="number-pad" />
                    </Field>
                  </View>
                </View>

                <View style={s.instBlock}>
                  <PreferenceDropdown
                    label="Mode of Education *"
                    value={instMode}
                    options={INSTITUTE_MODES}
                    placeholder="Select mode"
                    onSelect={setInstMode}
                  />
                  {instStep3Attempted && !!instErrors.mode && <Text style={s.errorText}>{instErrors.mode}</Text>}
                </View>

                <View style={s.instBlock}>
                  <Text style={s.label}>Upload Details</Text>
                  <View style={s.instToggleRow}>
                    {([
                      { label: 'Teacher Details', value: 'teachers' },
                      { label: 'Student Details', value: 'students' },
                    ] as const).map(option => {
                      const on = instUploadType === option.value;
                      return (
                        <Pressable
                          key={option.value}
                          style={[s.instToggle, on && s.instToggleOn]}
                          onPress={() => handleInstUploadType(option.value)}
                          accessibilityRole="button"
                          accessibilityState={{ selected: on }}
                        >
                          <Text style={[s.instToggleText, on && s.instToggleTextOn]}>{option.label}</Text>
                        </Pressable>
                      );
                    })}
                  </View>

                  {instUploadType && (
                    <View style={{ marginTop: 16 }}>
                      <Text style={s.label}>
                        Upload {instUploadType === 'teachers' ? 'Teacher' : 'Student'} Excel
                      </Text>
                      <Pressable style={s.instFileButton} onPress={handlePickInstituteFile} accessibilityRole="button">
                        <Text style={[s.instFileText, !instUploadFile && s.instFilePlaceholder]} numberOfLines={1}>
                          {instUploadFile ? instUploadFile.name : 'Choose Excel / CSV file'}
                        </Text>
                      </Pressable>
                      {!!instUploadFile && (
                        <Pressable onPress={() => setInstUploadFile(null)} accessibilityRole="button" hitSlop={8}>
                          <Text style={s.instFileRemove}>Remove file</Text>
                        </Pressable>
                      )}
                      {!!instUploadError && <Text style={s.errorText}>{instUploadError}</Text>}
                    </View>
                  )}
                </View>

                {instStep3Attempted && instInvalid && (
                  <Text style={s.educationError}>Please fill all required institute details to continue.</Text>
                )}
                {!!submitError && <Text style={s.portionSubmitError}>{submitError}</Text>}

                <View style={s.educationActions}>
                  <Pressable
                    style={s.previousButton}
                    onPress={() => {
                      if (!submitting) {
                        setStep(2);
                      }
                    }}
                    accessibilityRole="button"
                    disabled={submitting}
                  >
                    <Text style={s.previousButtonText}>Previous</Text>
                  </Pressable>
                  <View style={s.nextButtonFlex}>
                    <PrimaryButton
                      title={submitting ? 'Creating Account...' : 'Finish Registration'}
                      onPress={handleInstituteFinish}
                      disabled={submitting}
                    />
                  </View>
                </View>
              </View>
            </>
          ) : isCompanyFlow && step === 3 ? (
            <>
              <View style={s.page3Container}>
                <View style={s.pageHeader}>
                  <Text style={s.pageTitle}>Personal & Company Identity</Text>
                </View>

                <Field label="Personal Name" required>
                  <Input value={companyPersonalName} onChangeText={setCompanyPersonalName} placeholder="Enter your name" autoCapitalize="words" autoCorrect={false} />
                  {companyStep3Attempted && !!companyStep3Errors.name && <Text style={s.errorText}>{companyStep3Errors.name}</Text>}
                </Field>

                <Field label="Company Website">
                  <Input value={companyWebsite} onChangeText={setCompanyWebsite} placeholder="https://example.com" autoCapitalize="none" autoCorrect={false} keyboardType="url" />
                </Field>

                <Field label="Your Role (Founder, HR, CTO)" required>
                  <Input value={companyJobRole} onChangeText={setCompanyJobRole} placeholder="Your role in the company" autoCapitalize="words" autoCorrect={false} />
                  {companyStep3Attempted && !!companyStep3Errors.role && <Text style={s.errorText}>{companyStep3Errors.role}</Text>}
                </Field>

                {companyStep3Attempted && companyStep3Invalid && (
                  <Text style={s.educationError}>Please fill all required details to continue.</Text>
                )}

                <View style={s.educationActions}>
                  <Pressable style={s.previousButton} onPress={() => setStep(2)} accessibilityRole="button">
                    <Text style={s.previousButtonText}>Previous</Text>
                  </Pressable>
                  <View style={s.nextButtonFlex}>
                    <PrimaryButton title="Next Step" onPress={handleCompanyStep3Next} />
                  </View>
                </View>
              </View>
            </>
          ) : isCompanyFlow && step === 4 ? (
            <>
              <View style={s.page3Container}>
                <View style={s.pageHeader}>
                  <Text style={s.pageTitle}>Company Details</Text>
                </View>

                <PreferenceDropdown
                  label="Company Industry *"
                  value={companyIndustry}
                  options={COMPANY_INDUSTRIES}
                  placeholder="Select Industry"
                  onSelect={setCompanyIndustry}
                />
                {companyStep4Attempted && !!companyStep4Errors.industry && (
                  <Text style={s.errorText}>{companyStep4Errors.industry}</Text>
                )}

                <PreferenceDropdown
                  label="Company Head Count *"
                  value={companyHeadCount}
                  options={COMPANY_HEAD_COUNTS}
                  placeholder="Select Head Count"
                  onSelect={setCompanyHeadCount}
                />
                {companyStep4Attempted && !!companyStep4Errors.headCount && (
                  <Text style={s.errorText}>{companyStep4Errors.headCount}</Text>
                )}

                {companyStep4Attempted && companyStep4Invalid && (
                  <Text style={s.educationError}>Please fill all required details to continue.</Text>
                )}

                <View style={s.educationActions}>
                  <Pressable style={s.previousButton} onPress={() => setStep(3)} accessibilityRole="button">
                    <Text style={s.previousButtonText}>Previous</Text>
                  </Pressable>
                  <View style={s.nextButtonFlex}>
                    <PrimaryButton title="Next Step" onPress={handleCompanyStep4Next} />
                  </View>
                </View>
              </View>
            </>
          ) : isCompanyFlow && step === 5 ? (
            <>
              <View style={s.page3Container}>
                <View style={s.pageHeader}>
                  <Text style={s.pageTitle}>AI Usage</Text>
                </View>

                <Text style={s.label}>Do you use Generative AI? <Text style={s.req}>*</Text></Text>
                <View style={s.empRadioRow}>
                  {[
                    { label: 'Yes', value: true },
                    { label: 'No', value: false },
                  ].map(option => {
                    const on = companyUseAI === option.value;
                    return (
                      <Pressable
                        key={option.label}
                        style={s.empRadioItem}
                        onPress={() => setCompanyUseAI(option.value)}
                        accessibilityRole="radio"
                        accessibilityState={{ selected: on }}
                      >
                        <View style={[s.empRadioOuter, on && s.empRadioOuterOn]}>
                          {on && <View style={s.empRadioInner} />}
                        </View>
                        <Text style={s.tCheckText}>{option.label}</Text>
                      </Pressable>
                    );
                  })}
                </View>

                {companyStep5Attempted && !!companyAIAnswerError && (
                  <Text style={s.errorText}>{companyAIAnswerError}</Text>
                )}

                {companyUseAI === true && (
                  <>
                    <Text style={[s.tSectionTitle, s.tSectionGap]}>Which models do you use? <Text style={s.req}>*</Text></Text>
                    {COMPANY_AI_MODELS.map(model => (
                      <Pressable
                        key={model}
                        style={s.tCheckRow}
                        onPress={() => setCompanyAIModels(prev => toggleInList(prev, model))}
                        accessibilityRole="checkbox"
                        accessibilityState={{ checked: companyAIModels.includes(model) }}
                      >
                        <CheckboxTick checked={companyAIModels.includes(model)} />
                        <Text style={s.tCheckText}>{model}</Text>
                      </Pressable>
                    ))}
                    {companyStep5Attempted && !!companyAIError && <Text style={s.errorText}>{companyAIError}</Text>}

                    <Text style={[s.label, s.tSectionGap]}>Why are you using Generative AI?</Text>
                    <TextInput
                      style={s.empTextArea}
                      value={companyAIReason}
                      onChangeText={setCompanyAIReason}
                      placeholder="Tell us about your use case"
                      placeholderTextColor="#9A96AD"
                      multiline
                      maxLength={EMP_TEXT_LIMIT}
                      textAlignVertical="top"
                    />
                    <Text style={s.empCounter}>{companyAIReason.length}/{EMP_TEXT_LIMIT}</Text>

                    <Text style={[s.label, s.tSectionGap]}>How can we help you?</Text>
                    <TextInput
                      style={s.empTextArea}
                      value={companyHelp}
                      onChangeText={setCompanyHelp}
                      placeholder="Tell us how we can support you better"
                      placeholderTextColor="#9A96AD"
                      multiline
                      maxLength={EMP_TEXT_LIMIT}
                      textAlignVertical="top"
                    />
                    <Text style={s.empCounter}>{companyHelp.length}/{EMP_TEXT_LIMIT}</Text>
                  </>
                )}

                {!!submitError && <Text style={s.portionSubmitError}>{submitError}</Text>}

                <View style={s.educationActions}>
                  <Pressable
                    style={s.previousButton}
                    onPress={() => {
                      if (!submitting) {
                        setStep(4);
                      }
                    }}
                    accessibilityRole="button"
                    disabled={submitting}
                  >
                    <Text style={s.previousButtonText}>Previous</Text>
                  </Pressable>
                  <View style={s.nextButtonFlex}>
                    <PrimaryButton
                      title={submitting ? 'Creating Account...' : 'Finish Registration'}
                      onPress={handleCompanyFinish}
                      disabled={submitting}
                    />
                  </View>
                </View>
              </View>
            </>
          ) : isEmployee && step === 3 ? (
            <>
              <View style={s.page3Container}>
                <View style={s.pageHeader}>
                  <Text style={s.pageTitle}>Education Details</Text>
                </View>

                <PreferenceDropdown
                  label="Education Level *"
                  value={empEducationLevel}
                  options={EMP_EDUCATION_LEVELS.map(o => o.label)}
                  placeholder="Education Level"
                  onSelect={setEmpEducationLevel}
                />
                {empStep3Attempted && !!empStep3Errors.level && (
                  <Text style={s.errorText}>{empStep3Errors.level}</Text>
                )}

                <PreferenceDropdown
                  label="Education Degree *"
                  value={empDegree}
                  options={EMP_DEGREES}
                  placeholder="Education Degree"
                  onSelect={setEmpDegree}
                />
                {empStep3Attempted && !!empStep3Errors.degree && (
                  <Text style={s.errorText}>{empStep3Errors.degree}</Text>
                )}

                <PreferenceDropdown
                  label="Experience *"
                  value={empExperience}
                  options={EMP_EXPERIENCE}
                  placeholder="Experience"
                  onSelect={setEmpExperience}
                />
                {empStep3Attempted && !!empStep3Errors.experience && (
                  <Text style={s.errorText}>{empStep3Errors.experience}</Text>
                )}

                <PreferenceDropdown
                  label="Industry *"
                  value={empIndustry}
                  options={EMP_INDUSTRIES}
                  placeholder="Industry"
                  onSelect={setEmpIndustry}
                />
                {empStep3Attempted && !!empStep3Errors.industry && (
                  <Text style={s.errorText}>{empStep3Errors.industry}</Text>
                )}

                <PreferenceDropdown
                  label="Role *"
                  value={empRole}
                  options={EMP_ROLES}
                  placeholder="Role"
                  onSelect={setEmpRole}
                />
                {empStep3Attempted && !!empStep3Errors.role && (
                  <Text style={s.errorText}>{empStep3Errors.role}</Text>
                )}

                <PreferenceDropdown
                  label="Career Target"
                  value={empCareerTarget}
                  options={EMP_CAREER_TARGETS}
                  placeholder="Select Career Target (optional)"
                  onSelect={setEmpCareerTarget}
                />

                {empStep3Attempted && empStep3Invalid && (
                  <Text style={s.educationError}>Please fill all required details to continue.</Text>
                )}

                <View style={s.educationActions}>
                  <Pressable style={s.previousButton} onPress={() => setStep(2)} accessibilityRole="button">
                    <Text style={s.previousButtonText}>Previous</Text>
                  </Pressable>
                  <View style={s.nextButtonFlex}>
                    <PrimaryButton title="Next Step" onPress={handleEmployeeStep3Next} />
                  </View>
                </View>
              </View>
            </>
          ) : isEmployee && step === 4 ? (
            <>
              <View style={s.page3Container}>
                <View style={s.pageHeader}>
                  <Text style={s.pageTitle}>Work Details</Text>
                </View>

                <Text style={s.label}>Your Day-to-Day Tasks</Text>
                <TextInput
                  style={s.empTextArea}
                  value={empTasks}
                  onChangeText={setEmpTasks}
                  placeholder="Briefly describe what you do on a daily basis"
                  placeholderTextColor="#9A96AD"
                  multiline
                  maxLength={EMP_TEXT_LIMIT}
                  textAlignVertical="top"
                />
                <Text style={s.empCounter}>{empTasks.length}/{EMP_TEXT_LIMIT}</Text>

                <Text style={[s.label, s.tSectionGap]}>Use of Generative AI <Text style={s.req}>*</Text></Text>
                <View style={s.empRadioRow}>
                  {[
                    { label: 'Yes', value: true },
                    { label: 'No', value: false },
                  ].map(option => {
                    const on = empUseAI === option.value;
                    return (
                      <Pressable
                        key={option.label}
                        style={s.empRadioItem}
                        onPress={() => setEmpUseAI(option.value)}
                        accessibilityRole="radio"
                        accessibilityState={{ selected: on }}
                      >
                        <View style={[s.empRadioOuter, on && s.empRadioOuterOn]}>
                          {on && <View style={s.empRadioInner} />}
                        </View>
                        <Text style={s.tCheckText}>{option.label}</Text>
                      </Pressable>
                    );
                  })}
                </View>
                {empStep4Attempted && !!empAIError && <Text style={s.errorText}>{empAIError}</Text>}

                <Text style={[s.label, s.tSectionGap]}>How Can We Help You?</Text>
                <TextInput
                  style={s.empTextArea}
                  value={empHelp}
                  onChangeText={setEmpHelp}
                  placeholder="Tell us how we can support you better"
                  placeholderTextColor="#9A96AD"
                  multiline
                  maxLength={EMP_TEXT_LIMIT}
                  textAlignVertical="top"
                />
                <Text style={s.empCounter}>{empHelp.length}/{EMP_TEXT_LIMIT}</Text>

                <View style={s.educationInfoBox}>
                  <View style={s.educationInfoIcon}>
                    <Text style={s.educationInfoIconText}>i</Text>
                  </View>
                  <Text style={s.educationInfoText}>
                    Task descriptions are optional, but answering the Generative AI question is required.
                  </Text>
                </View>

                {!!submitError && <Text style={s.portionSubmitError}>{submitError}</Text>}

                <View style={s.educationActions}>
                  <Pressable
                    style={s.previousButton}
                    onPress={() => {
                      if (!submitting) {
                        setStep(3);
                      }
                    }}
                    accessibilityRole="button"
                    disabled={submitting}
                  >
                    <Text style={s.previousButtonText}>Previous</Text>
                  </Pressable>
                  <View style={s.nextButtonFlex}>
                    <PrimaryButton
                      title={submitting ? 'Creating Account...' : 'Finish Registration'}
                      onPress={handleEmployeeFinish}
                      disabled={submitting}
                    />
                  </View>
                </View>
              </View>
            </>
          ) : isTeacher && step === 3 ? (
            <>
              <View style={s.page3Container}>
                <View style={s.pageHeader}>
                  <Text style={s.pageTitle}>Teacher Profile</Text>
                </View>

                <Text style={s.tSectionTitle}>Type of Teacher <Text style={s.req}>*</Text></Text>
                {TEACHER_TYPES.map(type => (
                  <Pressable
                    key={type}
                    style={s.tCheckRow}
                    onPress={() => setTeacherTypes(prev => toggleInList(prev, type))}
                    accessibilityRole="checkbox"
                    accessibilityState={{ checked: teacherTypes.includes(type) }}
                  >
                    <CheckboxTick checked={teacherTypes.includes(type)} />
                    <Text style={s.tCheckText}>{type}</Text>
                  </Pressable>
                ))}
                {teacherStep3Attempted && !!teacherStep3Errors.types && (
                  <Text style={s.errorText}>{teacherStep3Errors.types}</Text>
                )}

                <Text style={[s.tSectionTitle, s.tSectionGap]}>Mode of Teaching <Text style={s.req}>*</Text></Text>
                {TEACHING_MODES.map(mode => (
                  <Pressable
                    key={mode}
                    style={s.tCheckRow}
                    onPress={() => handleTeachingModeToggle(mode)}
                    accessibilityRole="checkbox"
                    accessibilityState={{ checked: teachingMode.includes(mode) }}
                  >
                    <CheckboxTick checked={teachingMode.includes(mode)} />
                    <Text style={s.tCheckText}>{mode}</Text>
                  </Pressable>
                ))}
                {teacherStep3Attempted && !!teacherStep3Errors.mode && (
                  <Text style={s.errorText}>{teacherStep3Errors.mode}</Text>
                )}

                <Text style={[s.tSectionTitle, s.tSectionGap]}>Language of Teaching <Text style={s.req}>*</Text></Text>
                <View style={s.tChipWrap}>
                  {TEACHING_LANGUAGES.map(lang => {
                    const on = teachingLanguages.includes(lang);
                    return (
                      <Pressable
                        key={lang}
                        style={[s.tChip, on && s.tChipOn]}
                        onPress={() => setTeachingLanguages(prev => toggleInList(prev, lang))}
                        accessibilityRole="button"
                        accessibilityState={{ selected: on }}
                      >
                        <Text style={[s.tChipText, on && s.tChipTextOn]}>{lang}</Text>
                      </Pressable>
                    );
                  })}
                </View>
                {teacherStep3Attempted && !!teacherStep3Errors.languages && (
                  <Text style={s.errorText}>{teacherStep3Errors.languages}</Text>
                )}

                {teacherStep3Attempted && teacherStep3Invalid && (
                  <Text style={s.educationError}>Please fix the highlighted sections to continue.</Text>
                )}

                <View style={s.educationActions}>
                  <Pressable style={s.previousButton} onPress={() => setStep(2)} accessibilityRole="button">
                    <Text style={s.previousButtonText}>Previous</Text>
                  </Pressable>
                  <View style={s.nextButtonFlex}>
                    <PrimaryButton title="Next Step" onPress={handleTeacherStep3Next} />
                  </View>
                </View>
              </View>
            </>
          ) : isTeacher && step === 4 ? (
            <>
              <View style={s.page3Container}>
                <View style={s.pageHeader}>
                  <Text style={s.pageTitle}>Location & Institution</Text>
                </View>

                <PreferenceDropdown
                  label="Select State *"
                  value={teacherState}
                  options={INDIAN_STATES}
                  placeholder="Select State"
                  onSelect={setTeacherState}
                />
                {teacherStep4Attempted && !!teacherStateError && (
                  <Text style={[s.errorText, { marginBottom: 8 }]}>{teacherStateError}</Text>
                )}

                <Field label="City (Optional)">
                  <Input
                    value={teacherCity}
                    onChangeText={setTeacherCity}
                    placeholder="Enter city"
                    autoCapitalize="words"
                    autoCorrect={false}
                  />
                </Field>

                <View style={s.tSectionGap}>
                  <Text style={s.tSectionTitle}>Institution Name</Text>
                  <View style={s.addOptionalInputRow}>
                    <TextInput
                      style={s.addOptionalInput}
                      value={institutionInput}
                      onChangeText={setInstitutionInput}
                      placeholder="Institution"
                      placeholderTextColor="#9A96AD"
                      autoCapitalize="words"
                      returnKeyType="done"
                      onSubmitEditing={handleAddInstitution}
                    />
                    <Pressable
                      style={[s.addOptionalBtn, !institutionInput.trim() && s.addOptionalBtnDisabled]}
                      onPress={handleAddInstitution}
                      accessibilityRole="button"
                    >
                      <Text style={s.addOptionalBtnText}>+ Add</Text>
                    </Pressable>
                  </View>
                  {institutions.length > 0 && (
                    <View style={[s.tChipWrap, { marginTop: 10 }]}>
                      {institutions.map(name => (
                        <Pressable
                          key={name}
                          style={[s.tChip, s.tChipOn]}
                          onPress={() => setInstitutions(prev => prev.filter(x => x !== name))}
                          accessibilityRole="button"
                          accessibilityLabel={`Remove ${name}`}
                        >
                          <Text style={[s.tChipText, s.tChipTextOn]}>{name}  ×</Text>
                        </Pressable>
                      ))}
                    </View>
                  )}
                </View>

                <Text style={[s.tSectionTitle, s.tSectionGap]}>Board You Teach</Text>
                {TEACHER_BOARDS.map(b => (
                  <Pressable
                    key={b}
                    style={s.tCheckRow}
                    onPress={() => setBoardsTeach(prev => toggleInList(prev, b))}
                    accessibilityRole="checkbox"
                    accessibilityState={{ checked: boardsTeach.includes(b) }}
                  >
                    <CheckboxTick checked={boardsTeach.includes(b)} />
                    <Text style={s.tCheckText}>{b}</Text>
                  </Pressable>
                ))}

                {teacherStep4Attempted && !!teacherStateError && (
                  <Text style={s.educationError}>Please select your state to continue.</Text>
                )}

                <View style={s.educationActions}>
                  <Pressable style={s.previousButton} onPress={() => setStep(3)} accessibilityRole="button">
                    <Text style={s.previousButtonText}>Previous</Text>
                  </Pressable>
                  <View style={s.nextButtonFlex}>
                    <PrimaryButton title="Next Step" onPress={handleTeacherStep4Next} />
                  </View>
                </View>
              </View>
            </>
          ) : isTeacher && step === 5 ? (
            <>
              <View style={s.page3Container}>
                <View style={s.pageHeader}>
                  <Text style={s.pageTitle}>Teaching Levels</Text>
                </View>

                <Text style={s.tSectionTitle}>Education Level You Teach</Text>
                {TEACHER_EDUCATION_LEVELS.map(level => (
                  <Pressable
                    key={level}
                    style={s.tCheckRow}
                    onPress={() => setEducationLevels(prev => toggleInList(prev, level))}
                    accessibilityRole="checkbox"
                    accessibilityState={{ checked: educationLevels.includes(level) }}
                  >
                    <CheckboxTick checked={educationLevels.includes(level)} />
                    <Text style={s.tCheckText}>{level}</Text>
                  </Pressable>
                ))}

                <Text style={[s.tSectionTitle, s.tSectionGap]}>Classes / Standards</Text>
                <View style={s.tChipWrap}>
                  {CLASS_OPTIONS.map(c => {
                    const on = classesTeach.includes(c);
                    return (
                      <Pressable
                        key={c}
                        style={[s.tChip, on && s.tChipOn]}
                        onPress={() => setClassesTeach(prev => toggleInList(prev, c))}
                        accessibilityRole="button"
                        accessibilityState={{ selected: on }}
                      >
                        <Text style={[s.tChipText, on && s.tChipTextOn]}>{c}</Text>
                      </Pressable>
                    );
                  })}
                </View>

                <View style={s.educationActions}>
                  <Pressable style={s.previousButton} onPress={() => setStep(4)} accessibilityRole="button">
                    <Text style={s.previousButtonText}>Previous</Text>
                  </Pressable>
                  <Pressable
                    style={s.skipButton}
                    onPress={() => { setEducationLevels([]); setClassesTeach([]); setStep(6); }}
                    accessibilityRole="button"
                  >
                    <Text style={s.skipButtonText}>Skip for Now</Text>
                  </Pressable>
                  <View style={s.nextButtonFlex}>
                    <PrimaryButton title="Next Step" onPress={() => setStep(6)} />
                  </View>
                </View>
              </View>
            </>
          ) : isTeacher && step === 6 ? (
            <>
              <View style={s.page3Container}>
                <View style={s.pageHeader}>
                  <Text style={s.pageTitle}>Subjects</Text>
                </View>

                <Text style={s.tSectionTitle}>Subjects You Teach</Text>
                <Text style={[s.pageSubtitle, { marginBottom: 10 }]}>Type or select subjects from suggestions.</Text>
                <View style={s.addOptionalInputRow}>
                  <TextInput
                    style={s.addOptionalInput}
                    value={subjectInput}
                    onChangeText={v => { setSubjectInput(v); setSubjectError(''); }}
                    placeholder="Type subject name"
                    placeholderTextColor="#9A96AD"
                    autoCapitalize="words"
                    returnKeyType="done"
                    onSubmitEditing={() => handleAddSubject()}
                  />
                  <Pressable
                    style={[s.addOptionalBtn, !subjectInput.trim() && s.addOptionalBtnDisabled]}
                    onPress={() => handleAddSubject()}
                    accessibilityRole="button"
                  >
                    <Text style={s.addOptionalBtnText}>+ Add</Text>
                  </Pressable>
                </View>
                {!!subjectError && <Text style={s.errorText}>{subjectError}</Text>}

                <Text style={[s.tSectionTitle, s.tSectionGap]}>Popular Subjects:</Text>
                <View style={s.tChipWrap}>
                  {POPULAR_SUBJECTS.map(name => {
                    const on = subjectsTeach.some(x => x.toLowerCase() === name.toLowerCase());
                    return (
                      <Pressable
                        key={name}
                        style={[s.tChip, on && s.tChipOn]}
                        onPress={() => handleTogglePopularSubject(name)}
                        accessibilityRole="button"
                        accessibilityState={{ selected: on }}
                      >
                        <Text style={[s.tChipText, on && s.tChipTextOn]}>{name}</Text>
                      </Pressable>
                    );
                  })}
                </View>

                <Text style={[s.pageSubtitle, { marginTop: 14 }]}>
                  {subjectsTeach.length} {subjectsTeach.length === 1 ? 'subject' : 'subjects'} added
                </Text>
                {subjectsTeach.length > 0 && (
                  <View style={[s.tChipWrap, { marginTop: 8 }]}>
                    {subjectsTeach.map(name => (
                      <Pressable
                        key={name}
                        style={[s.tChip, s.tChipOn]}
                        onPress={() => setSubjectsTeach(prev => prev.filter(x => x !== name))}
                        accessibilityRole="button"
                        accessibilityLabel={`Remove ${name}`}
                      >
                        <Text style={[s.tChipText, s.tChipTextOn]}>{name}  ×</Text>
                      </Pressable>
                    ))}
                  </View>
                )}

                <View style={s.educationActions}>
                  <Pressable style={s.previousButton} onPress={() => setStep(5)} accessibilityRole="button">
                    <Text style={s.previousButtonText}>Previous</Text>
                  </Pressable>
                  <Pressable
                    style={s.skipButton}
                    onPress={() => { setSubjectsTeach([]); setSubjectInput(''); setSubjectError(''); setStep(7); }}
                    accessibilityRole="button"
                  >
                    <Text style={s.skipButtonText}>Skip for Now</Text>
                  </Pressable>
                  <View style={s.nextButtonFlex}>
                    <PrimaryButton
                      title="Next Step"
                      onPress={() => {
                        const pending = subjectInput.trim();
                        if (pending && !subjectsTeach.some(x => x.toLowerCase() === pending.toLowerCase())) {
                          setSubjectsTeach(prev => [...prev, pending]);
                        }
                        setSubjectInput('');
                        setStep(7);
                      }}
                    />
                  </View>
                </View>
              </View>
            </>
          ) : step === 3 ? (
            <>
              <View style={s.page3Container}>
                <View style={s.pageHeader}>
                  <Text style={s.pageTitle}>Education Details</Text>
                </View>

                <View style={s.educationGrid}>
                  <View style={s.educationColumn}>
                    <PreferenceDropdown
                      label="Board *"
                      value={board}
                      options={BOARD_OPTIONS}
                      placeholder="Select Board"
                      onSelect={(value) => {
                        setBoard(value);
                        setEducationError('');
                      }}
                    />
                  </View>

                  <View style={s.educationColumn}>
                    <PreferenceDropdown
                      label="Class / Standard *"
                      value={educationClass}
                      options={CLASS_OPTIONS}
                      placeholder="Select Class"
                      onSelect={handleClassChange}
                    />
                  </View>
                </View>

                {isSeniorClass ? (
                  <View style={s.educationGrid}>
                    <View style={s.educationColumn}>
                      <PreferenceDropdown
                        label="Stream *"
                        value={stream}
                        options={STREAM_OPTIONS}
                        placeholder="Select Stream"
                        onSelect={(value) => {
                          setStream(value);
                          setEducationError('');
                        }}
                      />
                    </View>

                    <View style={s.educationColumn}>
                      <PreferenceDropdown
                        label="Medium"
                        value={medium}
                        options={MEDIUM_OPTIONS}
                        placeholder="Select Medium"
                        onSelect={setMedium}
                      />
                    </View>
                  </View>
                ) : (
                  <View style={s.educationGrid}>
                    <View style={s.educationColumnFull}>
                      <PreferenceDropdown
                        label="Medium"
                        value={medium}
                        options={MEDIUM_OPTIONS}
                        placeholder="Select Medium"
                        onSelect={setMedium}
                      />
                    </View>
                  </View>
                )}

                {TARGET_EXAM_CLASSES.includes(educationClass) && (
                  <MultiSelectDropdown
                    label="Target Exam"
                    options={TARGET_EXAMS}
                    selected={targetExams}
                    placeholder="Select target exam(s)"
                    addMorePlaceholder="Add another target exam"
                    onToggle={value =>
                      setTargetExams(prev =>
                        prev.includes(value) ? prev.filter(x => x !== value) : [...prev, value],
                      )
                    }
                  />
                )}

                <Field label="School Name">
                  <Input
                    value={schoolName}
                    onChangeText={setSchoolName}
                    placeholder="Enter your school name"
                    autoCapitalize="words"
                    autoCorrect={false}
                  />
                </Field>

                <View style={s.educationGrid}>
                  <View style={s.educationColumn}>
                    <Field label="City">
                      <Input
                        value={city}
                        onChangeText={setCity}
                        placeholder="City"
                        autoCapitalize="words"
                        autoCorrect={false}
                      />
                    </Field>
                  </View>

                  <View style={s.educationColumn}>
                    <Field label="State">
                      <Input
                        value={stateName}
                        onChangeText={setStateName}
                        placeholder="State"
                        autoCapitalize="words"
                        autoCorrect={false}
                      />
                    </Field>
                  </View>
                </View>

                <Field label="Date of Birth">
                  <Pressable
                    style={s.dateInput}
                    onPress={() => setShowDatePicker(true)}
                  >
                    <Text
                      style={[
                        s.dateInputText,
                        !dateOfBirth && s.dateInputPlaceholder,
                      ]}
                    >
                      {dateOfBirth || 'mm/dd/yyyy'}
                    </Text>

                    <Text style={s.calendarIcon}>▣</Text>
                  </Pressable>

                  {showDatePicker && (
                    <DateTimePicker
                      value={
                        dateOfBirth
                          ? new Date(dateOfBirth)
                          : new Date(2008, 0, 1)
                      }
                      mode="date"
                      display="calendar"
                      maximumDate={new Date()}
                      onChange={(event, selectedDate) => {
                        setShowDatePicker(false);

                        if (event.type === 'set' && selectedDate) {
                          const month = String(
                            selectedDate.getMonth() + 1,
                          ).padStart(2, '0');

                          const day = String(
                            selectedDate.getDate(),
                          ).padStart(2, '0');

                          const year = selectedDate.getFullYear();

                          setDateOfBirth(`${month}/${day}/${year}`);
                        }
                      }}
                    />
                  )}
                </Field>

                <View style={s.educationInfoBox}>
                  <View style={s.educationInfoIcon}>
                    <Text style={s.educationInfoIconText}>i</Text>
                  </View>
                  <Text style={s.educationInfoText}>
                    Board and Class are required. You can add the remaining education details later.
                  </Text>
                </View>

                {!!educationError && <Text style={s.educationError}>{educationError}</Text>}

                <View style={s.educationActions}>
                  <Pressable style={s.previousButton} onPress={() => setStep(2)} accessibilityRole="button">
                    <Text style={s.previousButtonText}>Previous</Text>
                  </Pressable>
                  <View style={s.nextButtonFlex}>
                    <PrimaryButton title="Next Step" onPress={handleEducationNext} />
                  </View>
                </View>
              </View>
            </>
          ) : step === 4 ? (
            <>
              <View style={s.page4Container}>
                <View style={s.pageHeader}>
                  <Text style={s.pageTitle}>Parent Information</Text>
                </View>

                <Field label="Parent / Guardian Name">
                  <Input
                    value={parentName}
                    onChangeText={setParentName}
                    placeholder="Enter parent name (optional)"
                    autoCapitalize="words"
                    autoCorrect={false}
                  />
                </Field>

                <Field label="Parent Mobile Number">
                  <Input
                    value={parentMobile}
                    onChangeText={(value) => setParentMobile(value.replace(/\D/g, ''))}
                    placeholder="10-digit mobile number (optional)"
                    keyboardType="phone-pad"
                    maxLength={10}
                  />
                  {!!parentMobileError && <Text style={s.errorText}>{parentMobileError}</Text>}
                </Field>

                <Field label="Parent Email">
                  <Input
                    value={parentEmail}
                    onChangeText={setParentEmail}
                    placeholder="parent@example.com (optional)"
                    keyboardType="email-address"
                    autoCapitalize="none"
                    autoCorrect={false}
                  />
                  {!!parentEmailError && <Text style={s.errorText}>{parentEmailError}</Text>}
                </Field>

                <PreferenceDropdown
                  label="Relationship"
                  value={parentRelationship}
                  options={PARENT_RELATIONSHIPS}
                  placeholder="Select Relationship"
                  onSelect={setParentRelationship}
                />

                <View style={s.parentInfoBox}>
                  <View style={s.educationInfoIcon}>
                    <Text style={s.educationInfoIconText}>i</Text>
                  </View>
                  <Text style={s.educationInfoText}>
                    All fields on this page are optional. If you fill in a mobile number or email, it must be valid.
                  </Text>
                </View>

                <View style={s.parentActions}>
                  <Pressable
                    style={s.previousButton}
                    onPress={() => setStep(3)}
                    accessibilityRole="button"
                  >
                    <Text style={s.previousButtonText}>Previous</Text>
                  </Pressable>

                  <Pressable
                    style={s.skipButton}
                    onPress={handleParentSkip}
                    accessibilityRole="button"
                  >
                    <Text style={s.skipButtonText}>Skip for Now</Text>
                  </Pressable>

                  <View style={s.parentNextButton}>
                    <PrimaryButton
                      title="Next Step"
                      onPress={handleParentNext}
                    />
                  </View>
                </View>
              </View>
            </>
          ) : step === 5 || (isTeacher && step === 7) ? (
            <>
              {/* ── Student Schedule (step 5) / Teacher Timetable (step 7) ── */}
              <View style={s.page5Container}>
                <View style={s.pageHeader}>
                  <Text style={s.pageTitle}>{isTeacher ? 'Teacher Timetable' : 'Student Schedule'}</Text>
                  <Text style={s.pageSubtitle}>
                    {isTeacher ? 'Add the lectures you teach each day' : 'Plan your weekly routine'}
                  </Text>
                </View>

                {/* Day selector */}
                <ScrollView
                  horizontal
                  showsHorizontalScrollIndicator={false}
                  contentContainerStyle={s.dayTabsContent}
                  style={s.dayTabsScroll}
                  bounces={false}
                  keyboardShouldPersistTaps="handled"
                >
                  {timetableDays.map(day => {
                    const isActive = selectedDay === day;
                    const hasActivities = timetable.some(item =>
                      item.day === day || item.id.startsWith(`${day}-`),
                    );

                    return (
                      <Pressable
                        key={day}
                        style={[s.dayTab, isActive && s.dayTabActive]}
                        onPress={() => setSelectedDay(day)}
                        accessibilityRole="tab"
                        accessibilityState={{ selected: isActive }}
                      >
                        <Text style={[s.dayTabText, isActive && s.dayTabTextActive]}>
                          {day}
                        </Text>
                        {hasActivities && (
                          <View style={[s.dayDot, isActive && s.dayDotActive]} />
                        )}
                      </Pressable>
                    );
                  })}
                </ScrollView>

                {/* Day heading + Add Activity button */}
                <View style={s.dayHeadingRow}>
                  <View style={s.dayHeadingTextWrap}>
                    <Text style={s.selectedDayTitle}>
                      {dayFullName(selectedDay)}
                    </Text>
                    <Text style={s.activityCountText}>
                      {selectedDayActivities.length === 0
                        ? 'No activities added'
                        : `${selectedDayActivities.length} ${selectedDayActivities.length === 1 ? 'activity' : 'activities'}`}
                    </Text>
                  </View>

                  <Pressable
                    style={s.addActivityButton}
                    onPress={() => {
                      resetActivityForm();
                      setShowAddActivity(true);
                    }}
                    accessibilityRole="button"
                  >
                    <Text style={s.addActivityPlus}>+</Text>
                    <Text style={s.addActivityText}>Add Activity</Text>
                  </Pressable>
                </View>

                {/* Activity list or empty state */}
                {selectedDayActivities.length === 0 ? (
                  <View style={s.emptyScheduleCard}>
                    <View style={s.emptyCalendarIcon}>
                      <Text style={s.emptyCalendarText}>+</Text>
                    </View>
                    <Text style={s.emptyTitle}>No activities added</Text>
                    <Text style={s.emptyText}>
                      Add your first activity for this day to build your weekly routine.
                    </Text>
                    <Pressable
                      style={s.emptyAddButton}
                      onPress={() => {
                        resetActivityForm();
                        setShowAddActivity(true);
                      }}
                      accessibilityRole="button"
                    >
                      <Text style={s.emptyAddButtonText}>Add First Activity</Text>
                    </Pressable>
                  </View>
                ) : (
                  <View style={s.activityList}>
                    {selectedDayActivities.map(item => (
                      <View key={item.id} style={s.activityCard}>
                        <View style={s.activityCardHeader}>
                          <View style={[s.typeBadge, getTypeBadgeStyle(item.activityType)]}>
                            <Text style={[s.typeBadgeText, getTypeBadgeTextStyle(item.activityType)]}>
                              {item.activityType.toUpperCase()}
                            </Text>
                          </View>
                          <Pressable
                            style={s.deleteActivityBtn}
                            onPress={() => handleDeleteActivity(item.id)}
                            accessibilityRole="button"
                            accessibilityLabel={`Delete ${item.title}`}
                          >
                            <Text style={s.deleteActivityText}>×</Text>
                          </Pressable>
                        </View>

                        <Text style={s.activityTitle} numberOfLines={2}>
                          {item.title}
                        </Text>

                        {/* Tuition Institute */}
                        {item.activityType === 'Tuition' && !!item.organization && (
                          <View style={s.activityMetaRow}>
                            <Text style={s.activityMetaLabel}>Institute:</Text>
                            <Text style={s.activityMetaValue} numberOfLines={1}>
                              {item.organization}
                            </Text>
                          </View>
                        )}

                        {/* Class Optional Subjects */}
                        {item.activityType === 'Class' && !!item.optionalSubjects && item.optionalSubjects.length > 0 && (
                          <View style={s.optionalSubjectsCardWrap}>
                            <Text style={s.optionalSubjectsCardLabel}>Optional Subjects:</Text>
                            <View style={s.optionalBadgesWrap}>
                              {item.optionalSubjects.map((opt, i) => (
                                <View key={`${item.id}-opt-${i}-${opt}`} style={s.optionalSubjectPill}>
                                  <Text style={s.optionalSubjectPillText}>{opt}</Text>
                                </View>
                              ))}
                            </View>
                          </View>
                        )}

                        {/* Notes */}
                        {!!item.notes && (
                          <Text style={s.activityNotes} numberOfLines={3}>
                            {item.notes}
                          </Text>
                        )}
                      </View>
                    ))}
                  </View>
                )}

                {isTeacher && (
                  <View style={s.educationInfoBox}>
                    <View style={s.educationInfoIcon}>
                      <Text style={s.educationInfoIconText}>i</Text>
                    </View>
                    <Text style={s.educationInfoText}>
                      This step is optional. Add each lecture as class-division and subject, for example 8-A, Mathematics.
                    </Text>
                  </View>
                )}

                {isTeacher && !!submitError && (
                  <Text style={s.portionSubmitError}>{submitError}</Text>
                )}

                <View style={s.timetableActions}>
                  <Pressable
                    style={s.previousButton}
                    onPress={() => {
                      if (!submitting) {
                        setStep(isTeacher ? 6 : 4);
                      }
                    }}
                    accessibilityRole="button"
                    disabled={submitting}
                  >
                    <Text style={s.previousButtonText}>Previous</Text>
                  </Pressable>
                  <View style={s.nextButtonFlex}>
                    {isTeacher ? (
                      <PrimaryButton
                        title={submitting ? 'Creating Account...' : 'Finish Registration'}
                        onPress={handleTeacherFinish}
                        disabled={submitting}
                      />
                    ) : (
                      <PrimaryButton title="Next Step" onPress={handleTimetableNext} />
                    )}
                  </View>
                </View>
              </View>
            </>
          ) : step === 6 ? (
            <>
              {/* ── Step 6: Academic Records ── */}
              <View style={s.page6Container}>
                <View style={s.pageHeader}>
                  <Text style={s.pageTitle}>Academic Records</Text>
                  <Text style={s.pageSubtitle}>Add your exam results</Text>
                </View>

                {academicRecords.length === 0 ? (
                  <View style={s.emptyAcademicCard}>
                    <View style={s.emptyAcademicIcon}>
                      <Text style={s.emptyAcademicIconText}>📋</Text>
                    </View>
                    <Text style={s.emptyTitle}>No Exam Records Yet</Text>
                    <Text style={s.emptyText}>
                      Add your exam records or skip this step for now.
                    </Text>
                    <Pressable
                      style={s.emptyAddButton}
                      onPress={handleAddRecord}
                      accessibilityRole="button"
                    >
                      <Text style={s.emptyAddButtonText}>+ Add Exam Record</Text>
                    </Pressable>
                  </View>
                ) : (
                  <View style={s.recordsList}>
                    {academicRecords.map((rec, index) => (
                      <View key={rec.id} style={s.examCard}>
                        {/* Card header */}
                        <View style={s.examCardHeader}>
                          <Text style={s.examCardTitle} numberOfLines={1}>
                            Exam Record {index + 1}
                          </Text>
                          <Pressable
                            style={s.examDeleteBtn}
                            onPress={() => handleDeleteRecord(rec.id)}
                            accessibilityRole="button"
                            accessibilityLabel={`Delete exam record ${index + 1}`}
                          >
                            <Text style={s.examDeleteText}>✕</Text>
                          </Pressable>
                        </View>

                        {/* Fields */}
                        <View style={s.examFields}>
                          <Field label="Exam Name" required>
                            <Input
                              value={rec.examName}
                              onChangeText={v => { handleRecordChange(rec.id, 'examName', v); setAcademicError(''); }}
                              placeholder="e.g. Mid Term"
                              autoCapitalize="words"
                            />
                          </Field>

                          <Field label="Subject" required>
                            <Input
                              value={rec.subject}
                              onChangeText={v => { handleRecordChange(rec.id, 'subject', v); setAcademicError(''); }}
                              placeholder="e.g. Mathematics"
                              autoCapitalize="words"
                            />
                          </Field>

                          <Field label="Total Marks" required>
                            <Input
                              value={rec.totalMarks}
                              onChangeText={v => { handleRecordChange(rec.id, 'totalMarks', v); setAcademicError(''); }}
                              placeholder="e.g. 100"
                              keyboardType="numeric"
                            />
                          </Field>

                          <Field label="Obtained Marks" required>
                            <Input
                              value={rec.obtainedMarks}
                              onChangeText={v => { handleRecordChange(rec.id, 'obtainedMarks', v); setAcademicError(''); }}
                              placeholder="e.g. 85"
                              keyboardType="numeric"
                            />
                          </Field>

                          <Field label="Grade">
                            <Input
                              value={rec.grade}
                              onChangeText={v => handleRecordChange(rec.id, 'grade', v)}
                              placeholder="e.g. A+"
                              autoCapitalize="characters"
                            />
                          </Field>

                          <Field label="Semester">
                            <Input
                              value={rec.semester}
                              onChangeText={v => handleRecordChange(rec.id, 'semester', v)}
                              placeholder="e.g. 1st Semester"
                              autoCapitalize="words"
                            />
                          </Field>

                          <Field label="Exam Date" required>
                            <Pressable
                              style={s.dateInput}
                              onPress={() => handleRecordChange(rec.id, 'showDatePicker', true)}
                              accessibilityRole="button"
                            >
                              <Text
                                style={[
                                  s.dateInputText,
                                  !rec.examDate && s.dateInputPlaceholder,
                                ]}
                                numberOfLines={1}
                              >
                                {rec.examDate || 'mm/dd/yyyy'}
                              </Text>
                              <Text style={s.calendarIcon}>▣</Text>
                            </Pressable>
                            {rec.showDatePicker && (
                              <DateTimePicker
                                value={rec.examDate ? new Date(rec.examDate) : new Date()}
                                mode="date"
                                display="calendar"
                                maximumDate={new Date()}
                                onChange={(event, selectedDate) => {
                                  handleRecordChange(rec.id, 'showDatePicker', false);
                                  if (event.type === 'set' && selectedDate) {
                                    const month = String(selectedDate.getMonth() + 1).padStart(2, '0');
                                    const day = String(selectedDate.getDate()).padStart(2, '0');
                                    const year = selectedDate.getFullYear();
                                    handleRecordChange(rec.id, 'examDate', `${month}/${day}/${year}`);
                                    setAcademicError('');
                                  }
                                }}
                              />
                            )}
                          </Field>

                          <Field label="DigiLocker URL">
                            <Input
                              value={rec.digilockerUrl}
                              onChangeText={v => handleRecordChange(rec.id, 'digilockerUrl', v)}
                              placeholder="https://... (optional)"
                              autoCapitalize="none"
                              autoCorrect={false}
                              keyboardType="url"
                            />
                          </Field>
                        </View>
                      </View>
                    ))}

                    {/* Add another */}
                    <Pressable
                      style={s.addAnotherBtn}
                      onPress={handleAddRecord}
                      accessibilityRole="button"
                    >
                      <Text style={s.addAnotherText}>+ Add Another Exam Record</Text>
                    </Pressable>
                  </View>
                )}

                {/* Info box */}
                <View style={s.academicInfoBox}>
                  <View style={s.educationInfoIcon}>
                    <Text style={s.educationInfoIconText}>i</Text>
                  </View>
                  <Text style={s.educationInfoText}>
                    Exam details are optional. Backend will save each exam as a separate document.
                  </Text>
                </View>

                {!!academicError && (
                  <Text style={s.academicError}>{academicError}</Text>
                )}

                {/* Navigation */}
                <View style={s.academicActions}>
                  <Pressable
                    style={s.previousButton}
                    onPress={() => setStep(5)}
                    accessibilityRole="button"
                  >
                    <Text style={s.previousButtonText}>Previous</Text>
                  </Pressable>

                  <Pressable
                    style={s.skipButton}
                    onPress={() => {
                      console.log('Skipped Registration Step 6');
                      setStep(7);
                    }}
                    accessibilityRole="button"
                  >
                    <Text style={s.skipButtonText}>Skip for Now</Text>
                  </Pressable>

                  <View style={s.nextButtonFlex}>
                    <PrimaryButton title="Next Step" onPress={handleAcademicNext} />
                  </View>
                </View>
              </View>
            </>
          ) : step === 7 ? (
            <>
              {/* ── Step 7: Portion Details ── */}
              <View style={s.page7Container}>
                <View style={s.pageHeader}>
                  <Text style={s.pageTitle}>Portion Details</Text>
                  <Text style={s.pageSubtitle}>Set up your academic pattern and learning sources</Text>
                </View>

                {/* Academic Pattern section */}
                <View style={s.portionSection}>
                  <Text style={s.portionSectionTitle}>Academic Pattern</Text>
                  <Text style={s.portionSectionDesc}>
                    Select the academic pattern followed by your school or institution.
                  </Text>

                  <Field label="Academic Pattern" required>
                    <Pressable
                      style={s.preferenceDropdown}
                      onPress={() => { setShowPatternSheet(true); setPatternError(''); }}
                      accessibilityRole="button"
                    >
                      <Text
                        style={[
                          s.preferenceDropdownText,
                          !academicPattern && s.preferenceDropdownPlaceholder,
                        ]}
                        numberOfLines={1}
                      >
                        {academicPattern || 'Select Academic Pattern'}
                      </Text>
                      <ChevronDown />
                    </Pressable>
                    {!!patternError && (
                      <Text style={s.portionFieldError}>{patternError}</Text>
                    )}
                  </Field>

                  {academicPattern === 'Term' && (
                    <PreferenceDropdown
                      label="Terms Completed"
                      value={termsCompleted}
                      options={TERMS_COMPLETED_OPTIONS}
                      placeholder="Select terms completed"
                      onSelect={v => { setTermsCompleted(v); setPatternError(''); }}
                    />
                  )}
                  {academicPattern === 'Semester' && (
                    <PreferenceDropdown
                      label="Semesters Completed"
                      value={semestersCompleted}
                      options={SEMESTERS_COMPLETED_OPTIONS}
                      placeholder="Select semesters completed"
                      onSelect={v => { setSemestersCompleted(v); setPatternError(''); }}
                    />
                  )}
                  {academicPattern === 'Annual' && (
                    <PreferenceDropdown
                      label="Annual Syllabus Progress"
                      value={annualProgress}
                      options={ANNUAL_PROGRESS_OPTIONS}
                      placeholder="Select syllabus progress"
                      onSelect={v => { setAnnualProgress(v); setPatternError(''); }}
                    />
                  )}
                </View>

                {/* Learning Sources section */}
                <View style={s.portionSection}>
                  <Text style={s.portionSectionTitle}>Learning Sources</Text>
                  <Text style={s.portionSectionDesc}>
                    Select all the sources you currently use for learning.
                  </Text>

                  <View style={s.learningSourcesList}>
                    {LEARNING_SOURCES.map(source => {
                      const checked = learningSources.includes(source);
                      return (
                        <Pressable
                          key={source}
                          style={s.learningSourceRow}
                          onPress={() => toggleLearningSource(source)}
                          accessibilityRole="checkbox"
                          accessibilityState={{ checked }}
                        >
                          <View style={[s.lsCheckBox, checked && s.lsCheckBoxOn]}>
                            {checked && <View style={s.lsCheckMark} />}
                          </View>
                          <Text style={s.lsLabel} numberOfLines={1}>{source}</Text>
                        </Pressable>
                      );
                    })}
                  </View>

                  {learningSources.includes('Other') && (
                    <View style={s.portionExtra}>
                      <Field label="Other Learning Source" required>
                        <Input
                          value={otherLearningSource}
                          onChangeText={t => { setOtherLearningSource(t); setSourcesError(''); }}
                          placeholder="Specify the other source"
                        />
                      </Field>
                    </View>
                  )}

                  {learningSources.length > 1 && (
                    <View style={s.portionExtra}>
                      <PreferenceDropdown
                        label="Primary Learning Source"
                        value={primaryLearningSource}
                        options={LEARNING_SOURCES.filter(x => learningSources.includes(x))}
                        placeholder="Select the main source"
                        onSelect={v => { setPrimaryLearningSource(v); setSourcesError(''); }}
                      />
                    </View>
                  )}

                  {!!sourcesError && (
                    <Text style={s.portionFieldError}>{sourcesError}</Text>
                  )}
                </View>

                {!!submitError && (
                  <Text style={s.portionSubmitError}>{submitError}</Text>
                )}

                {/* Navigation */}
                <View style={s.portionActions}>
                  <Pressable
                    style={s.previousButton}
                    onPress={() => { if (!submitting) { setStep(6); } }}
                    accessibilityRole="button"
                    disabled={submitting}
                  >
                    <Text style={s.previousButtonText}>Previous</Text>
                  </Pressable>

                  <View style={s.nextButtonFlex}>
                    <PrimaryButton
                      title={submitting ? 'Creating Account...' : 'Finish Registration'}
                      onPress={handleFinishRegistration}
                      disabled={submitting}
                    />
                  </View>
                </View>
              </View>

              {/* Academic Pattern bottom sheet */}
              <Modal
                visible={showPatternSheet}
                transparent
                animationType="slide"
                onRequestClose={() => setShowPatternSheet(false)}
              >
                <Pressable style={s.overlay} onPress={() => setShowPatternSheet(false)}>
                  <View style={s.sheet}>
                    <View style={s.handle} />
                    <Text style={s.sheetTitle}>Academic Pattern</Text>
                    <ScrollView keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
                      {ACADEMIC_PATTERN_OPTIONS.map(opt => (
                        <Pressable
                          key={opt}
                          style={[s.sheetItem, academicPattern === opt && s.sheetItemOn]}
                          onPress={() => {
                            if (opt !== academicPattern) {
                              setTermsCompleted('');
                              setSemestersCompleted('');
                              setAnnualProgress('');
                            }
                            setAcademicPattern(opt);
                            setPatternError('');
                            setShowPatternSheet(false);
                          }}
                        >
                          <Text style={[s.sheetItemText, academicPattern === opt && s.sheetItemTextOn]}>
                            {opt}
                          </Text>
                          {academicPattern === opt && <View style={s.sheetDot} />}
                        </Pressable>
                      ))}
                    </ScrollView>
                  </View>
                </Pressable>
              </Modal>
            </>
          ) : null}
        </ScrollView>
      </KeyboardAvoidingView>

      {/* ── Add Activity Modal (outside ScrollView, inside SafeAreaView) ── */}
      <Modal
        visible={showAddActivity}
        transparent
        animationType="slide"
        onRequestClose={() => {
          setShowAddActivity(false);
          resetActivityForm();
        }}
      >
        <KeyboardAvoidingView
          style={s.modalKeyboardAvoid}
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        >
          <View style={s.modalOverlay}>
            <Pressable
              style={StyleSheet.absoluteFill}
              onPress={() => {
                setShowAddActivity(false);
                resetActivityForm();
              }}
            />
            <View style={s.addActivitySheet}>
              <View style={s.handle} />

              <View style={s.sheetHeaderRow}>
                <View style={s.sheetHeaderTextWrap}>
                  <Text style={s.addActivityTitle}>Add Activity</Text>
                  <Text style={s.addActivitySubtitle}>
                    {dayFullName(selectedDay)}
                  </Text>
                </View>
                <Pressable
                  style={s.closeButton}
                  onPress={() => {
                    setShowAddActivity(false);
                    resetActivityForm();
                  }}
                  accessibilityRole="button"
                >
                  <Text style={s.closeButtonText}>×</Text>
                </Pressable>
              </View>

              <ScrollView
                showsVerticalScrollIndicator={false}
                keyboardShouldPersistTaps="handled"
                contentContainerStyle={s.addActivityScrollContent}
                bounces={false}
              >
                {/* Activity Type Selector */}
                <View style={s.typeSelectorWrap}>
                  <Text style={s.label}>
                    Activity Type <Text style={s.req}>*</Text>
                  </Text>
                  <ScrollView
                    horizontal
                    showsHorizontalScrollIndicator={false}
                    contentContainerStyle={s.typeSelectorScroll}
                    style={s.typeSelectorContainer}
                    bounces={false}
                  >
                    {activityTypes.map(type => {
                      const isSelected = selectedActivityType === type;
                      return (
                        <Pressable
                          key={type}
                          style={[s.typeChip, isSelected && s.typeChipActive]}
                          onPress={() => {
                            setSelectedActivityType(type);
                            setActivityError('');
                          }}
                          accessibilityRole="button"
                          accessibilityState={{ selected: isSelected }}
                        >
                          <Text style={[s.typeChipText, isSelected && s.typeChipTextActive]}>
                            {type}
                          </Text>
                        </Pressable>
                      );
                    })}
                  </ScrollView>
                </View>

                {/* Teacher lecture fields */}
                {isTeacher && selectedActivityType !== 'Hobby' && (
                  <>
                    <Field label="Class - Division" required>
                      <Input
                        key="teacher-division"
                        value={teacherDivision}
                        onChangeText={value => {
                          setTeacherDivision(value);
                          setActivityError('');
                        }}
                        placeholder="e.g. 8-A"
                        autoCapitalize="characters"
                      />
                    </Field>
                    <Field label="Subject" required>
                      <Input
                        key="teacher-subject"
                        value={teacherSubject}
                        onChangeText={value => {
                          setTeacherSubject(value);
                          setActivityError('');
                        }}
                        placeholder="e.g. Mathematics"
                        autoCapitalize="words"
                      />
                    </Field>
                  </>
                )}

                {isTeacher && selectedActivityType === 'Hobby' && (
                  <Field label="Hobby / Activity" required>
                    <Input
                      key="teacher-hobby"
                      value={teacherSubject}
                      onChangeText={value => {
                        setTeacherSubject(value);
                        setActivityError('');
                      }}
                      placeholder="e.g. Music, Painting"
                      autoCapitalize="words"
                    />
                  </Field>
                )}

                {/* Dynamic Fields per Activity Type */}
                {!isTeacher && selectedActivityType === 'Class' && (
                  <>
                    <Field label="Core Subject" required>
                      <Input
                        key="class-core-subject"
                        value={classCoreSubject}
                        onChangeText={value => {
                          setClassCoreSubject(value);
                          setActivityError('');
                        }}
                        placeholder="e.g. Mathematics"
                        autoCapitalize="words"
                      />
                    </Field>

                    <View style={s.optionalSubjectsSection}>
                      <Text style={s.optionalSubHeading}>Optional Subjects</Text>
                      {optionalSubjects.length === 0 ? (
                        <Text style={s.noOptionalText}>No optional subjects added</Text>
                      ) : (
                        <View style={s.optionalList}>
                          {optionalSubjects.map((sub, idx) => (
                            <View key={`${sub}-${idx}`} style={s.optionalItemRow}>
                              <Text style={s.optionalItemText} numberOfLines={1}>
                                {sub}
                              </Text>
                              <Pressable
                                style={s.optionalRemoveBtn}
                                onPress={() => handleRemoveOptionalSubject(idx)}
                                accessibilityRole="button"
                                accessibilityLabel={`Remove ${sub}`}
                              >
                                <Text style={s.optionalRemoveText}>×</Text>
                              </Pressable>
                            </View>
                          ))}
                        </View>
                      )}

                      <View style={s.addOptionalInputRow}>
                        <TextInput
                          key="class-optional-sub-input"
                          style={s.addOptionalInput}
                          value={currentOptionalSubject}
                          onChangeText={val => {
                            setCurrentOptionalSubject(val);
                            setActivityError('');
                          }}
                          placeholder="e.g. Computer Science"
                          placeholderTextColor="#9A96AD"
                          autoCapitalize="words"
                          returnKeyType="done"
                          onSubmitEditing={handleAddOptionalSubject}
                        />
                        <Pressable
                          style={[
                            s.addOptionalBtn,
                            !currentOptionalSubject.trim() && s.addOptionalBtnDisabled,
                          ]}
                          onPress={handleAddOptionalSubject}
                          accessibilityRole="button"
                        >
                          <Text style={s.addOptionalBtnText}>+ Add</Text>
                        </Pressable>
                      </View>
                    </View>

                    <Field label="Notes">
                      <Input
                        key="class-notes"
                        value={classNotes}
                        onChangeText={setClassNotes}
                        placeholder="Any extra details (optional)"
                        multiline
                        textAlignVertical="top"
                        style={s.notesInput}
                      />
                    </Field>
                  </>
                )}

                {!isTeacher && selectedActivityType === 'Tuition' && (
                  <>
                    <Field label="Subject" required>
                      <Input
                        key="tuition-subject"
                        value={tuitionSubject}
                        onChangeText={value => {
                          setTuitionSubject(value);
                          setActivityError('');
                        }}
                        placeholder="e.g. Physics"
                        autoCapitalize="words"
                      />
                    </Field>

                    <Field label="Coaching / Institute">
                      <Input
                        key="tuition-institute"
                        value={tuitionInstitute}
                        onChangeText={setTuitionInstitute}
                        placeholder="e.g. Allen Career Institute (optional)"
                        autoCapitalize="words"
                      />
                    </Field>

                    <Field label="Notes">
                      <Input
                        key="tuition-notes"
                        value={tuitionNotes}
                        onChangeText={setTuitionNotes}
                        placeholder="Any extra details (optional)"
                        multiline
                        textAlignVertical="top"
                        style={s.notesInput}
                      />
                    </Field>
                  </>
                )}

                {!isTeacher && selectedActivityType === 'Sports' && (
                  <>
                    <Field label="Sport / Activity" required>
                      <Input
                        key="sports-activity"
                        value={sportsActivity}
                        onChangeText={value => {
                          setSportsActivity(value);
                          setActivityError('');
                        }}
                        placeholder="e.g. Cricket, Football, Gym"
                        autoCapitalize="words"
                      />
                    </Field>

                    <Field label="Notes">
                      <Input
                        key="sports-notes"
                        value={sportsNotes}
                        onChangeText={setSportsNotes}
                        placeholder="Any extra details (optional)"
                        multiline
                        textAlignVertical="top"
                        style={s.notesInput}
                      />
                    </Field>
                  </>
                )}

                {!isTeacher && selectedActivityType === 'Self Study' && (
                  <>
                    <Field label="Subject / Topic" required>
                      <Input
                        key="self-study-topic"
                        value={selfStudyTopic}
                        onChangeText={value => {
                          setSelfStudyTopic(value);
                          setActivityError('');
                        }}
                        placeholder="e.g. Mathematics Revision, DBMS"
                        autoCapitalize="words"
                      />
                    </Field>

                    <Field label="Notes">
                      <Input
                        key="self-study-notes"
                        value={selfStudyNotes}
                        onChangeText={setSelfStudyNotes}
                        placeholder="Any extra details (optional)"
                        multiline
                        textAlignVertical="top"
                        style={s.notesInput}
                      />
                    </Field>
                  </>
                )}

                {!isTeacher && selectedActivityType === 'Other' && (
                  <>
                    <Field label="Activity Name" required>
                      <Input
                        key="other-activity-name"
                        value={otherActivityName}
                        onChangeText={value => {
                          setOtherActivityName(value);
                          setActivityError('');
                        }}
                        placeholder="e.g. Music Practice, Coding"
                        autoCapitalize="words"
                      />
                    </Field>

                    <Field label="Notes">
                      <Input
                        key="other-notes"
                        value={otherNotes}
                        onChangeText={setOtherNotes}
                        placeholder="Any extra details (optional)"
                        multiline
                        textAlignVertical="top"
                        style={s.notesInput}
                      />
                    </Field>
                  </>
                )}

                {!!activityError && <Text style={s.timetableError}>{activityError}</Text>}

                <PrimaryButton title="Add Activity" onPress={handleAddActivity} />
              </ScrollView>
            </View>
          </View>
        </KeyboardAvoidingView>
      </Modal>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#F5F6FF' },
  flex1: { flex: 1 },
  scroll: { paddingHorizontal: 22, paddingBottom: 40 },


  wordmarkRow: { alignItems: 'center', marginTop: 18, marginBottom: 18 },
  wordmark: { height: 42, width: 200 },


  heading: { fontSize: 22, fontWeight: '700', color: '#16142F', marginTop: 16, letterSpacing: -0.3 },
  subheading: { fontSize: 14, color: '#726C8E', marginTop: 4, marginBottom: 18 },

  // ── Teacher flow styles ───────────────────────────────────────────────────────
  tSectionTitle: { fontSize: 14, fontWeight: '700', color: '#16142F', marginBottom: 8 },
  tSectionGap: { marginTop: 20 },
  tCheckRow: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 8 },
  tCheckText: { fontSize: 14, color: '#16142F' },
  tChipWrap: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  tChip: { paddingHorizontal: 14, height: 36, borderRadius: 18, backgroundColor: '#ECEEFF', alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: 'transparent' },
  tChipOn: { backgroundColor: '#5566EB', borderColor: '#5566EB' },
  tChipText: { fontSize: 13, fontWeight: '600', color: '#59627F' },
  tChipTextOn: { color: '#FFFFFF' },

  multiDoneButton: { marginTop: 12, height: 48, borderRadius: 14, backgroundColor: '#5566EB', alignItems: 'center', justifyContent: 'center' },
  multiDoneText: { fontSize: 15, fontWeight: '700', color: '#FFFFFF' },

  // Educational Institute: upload details
  instToggleRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 12, marginTop: 8 },
  instToggle: { paddingHorizontal: 18, height: 42, borderRadius: 21, backgroundColor: '#ECEEFF', alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: 'transparent' },
  instToggleOn: { backgroundColor: '#5566EB', borderColor: '#5566EB' },
  instToggleText: { fontSize: 13, fontWeight: '600', color: '#59627F' },
  instToggleTextOn: { color: '#FFFFFF' },
  instFileButton: { marginTop: 6, height: 52, borderRadius: 14, borderWidth: 1, borderColor: '#E5E6F2', backgroundColor: '#FBFBFF', justifyContent: 'center', paddingHorizontal: 14 },
  instFileText: { fontSize: 14, color: '#16142F' },
  instFilePlaceholder: { color: '#9A96AD' },
  instFileRemove: { marginTop: 8, fontSize: 13, fontWeight: '600', color: '#D14B5A' },

  // Educational Institute: roomy spacing between fields
  instBlock: { marginBottom: 22 },
  instAfterLevels: { marginTop: 22 },
  instSectionTitle: { fontSize: 14, fontWeight: '700', color: '#16142F', marginBottom: 12 },

  // Educational Institute: academic level grid (checkbox on the left, label next to it)
  instLevelGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  instLevelItem: { width: '48%', flexDirection: 'row', alignItems: 'center', justifyContent: 'flex-start', gap: 12, paddingVertical: 12, paddingHorizontal: 14, borderRadius: 14, borderWidth: 1, borderColor: '#E5E6F2', backgroundColor: '#FBFBFF' },
  instLevelItemOn: { borderColor: '#5566EB', backgroundColor: '#ECEEFF' },
  instLevelTextOn: { color: '#3F4BC4', fontWeight: '700' },

  // Employee flow styles
  empTextArea: { minHeight: 110, borderRadius: 14, borderWidth: 1, borderColor: '#E5E6F2', backgroundColor: '#FBFBFF', paddingHorizontal: 14, paddingVertical: 12, fontSize: 15, color: '#16142F', marginTop: 6 },
  empCounter: { alignSelf: 'flex-end', fontSize: 12, color: '#726C8E', marginTop: 4 },
  empRadioRow: { flexDirection: 'row', gap: 28, marginTop: 8 },
  empRadioItem: { flexDirection: 'row', alignItems: 'center', gap: 10, paddingVertical: 6 },
  empRadioOuter: { width: 22, height: 22, borderRadius: 11, borderWidth: 2, borderColor: '#B9BDE0', alignItems: 'center', justifyContent: 'center', backgroundColor: '#FFFFFF' },
  empRadioOuterOn: { borderColor: '#5566EB' },
  empRadioInner: { width: 10, height: 10, borderRadius: 5, backgroundColor: '#5566EB' },

  // Seven-step horizontal registration timeline
  stepperWrap: { marginBottom: 4 },
  stepScroll: { marginHorizontal: -22 },
  stepScrollContent: { paddingHorizontal: 0 },
  stepTimeline: { position: 'relative', flexDirection: 'row', width: 770, paddingBottom: 2 },
  stepTrack: { position: 'absolute', left: 55, right: 55, top: 14, height: 3, backgroundColor: '#E7E8F2', borderRadius: 2, overflow: 'hidden' },
  stepTrackFill: { height: '100%', borderRadius: 2 },
  stepItem: { width: 110, alignItems: 'center', zIndex: 1 },
  stepCircle: { width: 30, height: 30, borderRadius: 15, alignItems: 'center', justifyContent: 'center' },
  stepCircleOff: { backgroundColor: '#E5E6F2' },
  stepNumOn: { fontSize: 13, fontWeight: '700', color: '#FFFFFF' },
  stepNumOff: { fontSize: 13, fontWeight: '600', color: '#9A96AD' },
  stepCheck: { fontSize: 16, fontWeight: '800', color: '#FFFFFF', lineHeight: 18 },
  stepLabel: { width: 104, minHeight: 30, marginTop: 6, textAlign: 'center', fontSize: 10, lineHeight: 13, color: '#9A96AD', fontWeight: '500' },
  stepLabelOn: { color: '#5566EB', fontWeight: '700' },


  avatarSection: { alignItems: 'center', marginBottom: 20 },
  avatarWrap: { position: 'relative', marginBottom: 8 },
  avatarCircle: { width: 88, height: 88, borderRadius: 44, backgroundColor: '#ECEEFF', borderWidth: 2, borderColor: '#C8CCFF', alignItems: 'center', justifyContent: 'center', shadowColor: '#4F5BD5', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.15, shadowRadius: 10, elevation: 4 },
  camBadge: { position: 'absolute', bottom: 0, right: 0, width: 26, height: 26, borderRadius: 13, backgroundColor: '#5566EB', alignItems: 'center', justifyContent: 'center', borderWidth: 2, borderColor: '#F5F6FF' },
  avatarLabel: { fontSize: 13, fontWeight: '600', color: '#16142F' },
  avatarHint: { fontSize: 12, color: '#726C8E', marginTop: 2 },


  segment: { flexDirection: 'row', backgroundColor: '#ECEEFF', borderRadius: 12, padding: 4, marginBottom: 22 },
  segBtn: { flex: 1, height: 38, borderRadius: 9, alignItems: 'center', justifyContent: 'center', overflow: 'hidden' },
  segBtnActive: { shadowColor: '#4F5BD5', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.2, shadowRadius: 4, elevation: 3 },
  segGrad: { width: '100%', height: '100%', borderRadius: 9, alignItems: 'center', justifyContent: 'center' },
  segText: { fontSize: 13, fontWeight: '500', color: '#726C8E' },
  segTextOn: { fontSize: 13, fontWeight: '700', color: '#FFFFFF' },


  form: { gap: 14 },
  field: { gap: 6 },
  label: { fontSize: 13, fontWeight: '600', color: '#16142F' },
  req: { color: '#E05E5E' },


  input: { height: 52, borderRadius: 14, borderWidth: 1, borderColor: '#E5E6F2', backgroundColor: '#FBFBFF', paddingHorizontal: 14, fontSize: 15, color: '#16142F' },
  inputFocused: { borderColor: '#5566EB', backgroundColor: '#FFFFFF' },
  inputRow: { height: 52, borderRadius: 14, borderWidth: 1, borderColor: '#E5E6F2', backgroundColor: '#FBFBFF', flexDirection: 'row', alignItems: 'center', overflow: 'hidden', paddingHorizontal: 14 },
  inputFlex: { flex: 1, fontSize: 15, color: '#16142F', height: '100%' },
  roleText: { flex: 1, fontSize: 15, color: '#16142F', textAlignVertical: 'center' },
  rolePlaceholder: { color: '#9A96AD' },


  phoneRow: { flexDirection: 'row', gap: 8 },
  ccInput: { width: 68, height: 52, borderRadius: 14, borderWidth: 1, borderColor: '#E5E6F2', backgroundColor: '#FBFBFF', paddingHorizontal: 10, fontSize: 15, color: '#16142F', textAlign: 'center', flexShrink: 0 },
  mobileInput: { flex: 1, height: 52, borderRadius: 14, borderWidth: 1, borderColor: '#E5E6F2', backgroundColor: '#FBFBFF', paddingHorizontal: 14, fontSize: 15, color: '#16142F' },
  errorText: { fontSize: 12, color: '#E05E5E', marginTop: 2 },


  showHide: { paddingHorizontal: 12, height: '100%', alignItems: 'center', justifyContent: 'center' },
  showHideText: { fontSize: 13, fontWeight: '600', color: '#5566EB' },


  overlay: { flex: 1, backgroundColor: 'rgba(22,20,47,0.45)', justifyContent: 'flex-end' },
  sheet: { backgroundColor: '#FFFFFF', borderTopLeftRadius: 22, borderTopRightRadius: 22, paddingTop: 12, paddingHorizontal: 20, paddingBottom: 40, maxHeight: '65%' },
  handle: { width: 36, height: 4, borderRadius: 2, backgroundColor: '#E5E6F2', alignSelf: 'center', marginBottom: 16 },
  sheetTitle: { fontSize: 16, fontWeight: '700', color: '#16142F', marginBottom: 12 },
  sheetItem: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingVertical: 14, borderBottomWidth: 1, borderBottomColor: '#F0F1FA' },
  sheetItemOn: { borderBottomColor: '#E8EAFF' },
  sheetItemText: { fontSize: 15, color: '#16142F' },
  sheetItemTextOn: { color: '#5566EB', fontWeight: '600' },
  sheetDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: '#5566EB' },


  termsRow: { flexDirection: 'row', alignItems: 'flex-start', marginTop: 20, gap: 10 },
  termsText: { flex: 1, fontSize: 13, color: '#726C8E', lineHeight: 20 },
  termsLink: { color: '#5566EB', fontWeight: '600' },


  nextWrap: { marginTop: 22 },


  divRow: { flexDirection: 'row', alignItems: 'center', marginTop: 24, marginBottom: 14, gap: 10 },
  divLine: { flex: 1, height: 1, backgroundColor: '#E5E6F2' },
  divText: { fontSize: 11, fontWeight: '700', color: '#9A96AD', letterSpacing: 1 },


  socialRow: { flexDirection: 'row', gap: 12 },
  socialBtn: { flex: 1, height: 48, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', borderRadius: 12, borderWidth: 1.5, borderColor: '#E5E6F2', backgroundColor: '#FFFFFF', gap: 8 },
  socialBtnText: { fontSize: 14, fontWeight: '600', color: '#16142F' },
  socialCircle: { width: 22, height: 22, borderRadius: 11, alignItems: 'center', justifyContent: 'center' },
  socialLetter: { fontSize: 13, fontWeight: '800', color: '#FFFFFF' },


  page2Container: { paddingBottom: 40 },
  pageHeader: { marginTop: 14, marginBottom: 26 },
  pageTitle: { fontSize: 24, fontWeight: '700', color: '#16142F' },
  pageSubtitle: {
    fontSize: 13,
    color: '#726C8E',
    marginTop: 5,
    flexShrink: 1,
  },
  preferenceDropdown: { height: 52, borderRadius: 14, borderWidth: 1, borderColor: '#E5E6F2', backgroundColor: '#FBFBFF', paddingHorizontal: 14, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  preferenceDropdownText: { flex: 1, fontSize: 15, color: '#16142F' },
  preferenceDropdownPlaceholder: { color: '#9A96AD' },
  infoBox: { flexDirection: 'row', backgroundColor: '#F7F9FF', borderRadius: 12, padding: 16, marginTop: 4, marginBottom: 26 },
  infoIcon: { width: 20, height: 20, borderRadius: 10, backgroundColor: '#3B82F6', alignItems: 'center', justifyContent: 'center', marginRight: 12, marginTop: 1 },
  infoIconText: { color: '#FFFFFF', fontSize: 13, fontWeight: '700' },
  infoContent: { flex: 1 },
  infoTitle: { fontSize: 14, fontWeight: '700', color: '#16142F', marginBottom: 3 },
  infoText: { fontSize: 14, lineHeight: 20, color: '#4B5563' },

  page3Container: { paddingBottom: 40 },
  educationGrid: { flexDirection: 'row', gap: 12, marginBottom: 14 },
  educationColumn: { flex: 1, minWidth: 0 },
  educationColumnFull: { flex: 1 },
  educationInfoBox: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#FFF9E8', borderWidth: 1, borderColor: '#F3D98A', borderRadius: 12, paddingHorizontal: 12, paddingVertical: 12, marginTop: 12 },
  educationInfoIcon: { width: 16, height: 16, borderRadius: 8, backgroundColor: '#F59E0B', alignItems: 'center', justifyContent: 'center', marginRight: 10 },
  educationInfoIconText: { color: '#FFFFFF', fontSize: 10, fontWeight: '800' },
  educationInfoText: { flex: 1, fontSize: 12, lineHeight: 18, color: '#6B5A2A' },
  educationError: { fontSize: 12, color: '#E05E5E', marginTop: 8 },
  educationActions: { flexDirection: 'row', alignItems: 'center', gap: 10, marginTop: 18 },
  previousButton: { height: 52, paddingHorizontal: 18, borderRadius: 14, borderWidth: 1, borderColor: '#D7DBFF', backgroundColor: '#F0F2FF', alignItems: 'center', justifyContent: 'center' },
  previousButtonText: { fontSize: 13, fontWeight: '600', color: '#59627F' },
  nextButtonFlex: { flex: 1 },

  page4Container: { paddingBottom: 40 },
  parentInfoBox: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#FFF9E8', borderWidth: 1, borderColor: '#F3D98A', borderRadius: 12, paddingHorizontal: 12, paddingVertical: 12, marginTop: 6, marginBottom: 18 },
  parentActions: { flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 8 },
  skipButton: { height: 52, paddingHorizontal: 14, borderRadius: 14, borderWidth: 1, borderColor: '#D7DBFF', backgroundColor: '#F0F2FF', alignItems: 'center', justifyContent: 'center' },
  skipButtonText: { fontSize: 12, fontWeight: '600', color: '#59627F' },
  parentNextButton: { flex: 1 },

  // ── Step 5 styles ────────────────────────────────────────────────────────────
  page5Container: { paddingBottom: 40 },
  dayTabsScroll: { marginHorizontal: -4, marginBottom: 18 },
  dayTabsContent: { paddingHorizontal: 4, gap: 8 },
  dayTab: {
    minWidth: 54,
    height: 42,
    paddingHorizontal: 12,
    borderRadius: 12,
    backgroundColor: '#ECEEFF',
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  dayTabActive: { backgroundColor: '#5566EB' },
  dayTabText: { fontSize: 13, fontWeight: '600', color: '#726C8E' },
  dayTabTextActive: { color: '#FFFFFF', fontWeight: '700' },
  dayDot: {
    position: 'absolute',
    bottom: 5,
    width: 4,
    height: 4,
    borderRadius: 2,
    backgroundColor: '#5566EB',
  },
  dayDotActive: {
    backgroundColor: '#FFFFFF',
  },
  dayHeadingRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 14, gap: 10 },
  dayHeadingTextWrap: { flex: 1, minWidth: 0 },
  selectedDayTitle: { fontSize: 18, fontWeight: '700', color: '#16142F' },
  activityCountText: { fontSize: 12, color: '#9A96AD', marginTop: 2, flexShrink: 1 },
  addActivityButton: {
    minHeight: 42,
    paddingHorizontal: 12,
    borderRadius: 12,
    backgroundColor: '#5566EB',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 5,
    flexShrink: 0,
  },
  addActivityPlus: { fontSize: 19, lineHeight: 20, fontWeight: '500', color: '#FFFFFF' },
  addActivityText: { fontSize: 12, fontWeight: '700', color: '#FFFFFF' },
  emptyScheduleCard: {
    borderRadius: 18,
    borderWidth: 1,
    borderColor: '#E5E6F2',
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 22,
    paddingVertical: 26,
    alignItems: 'center',
  },
  emptyCalendarIcon: {
    width: 46,
    height: 46,
    borderRadius: 14,
    backgroundColor: '#ECEEFF',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  emptyCalendarText: { fontSize: 24, fontWeight: '400', color: '#5566EB' },
  emptyTitle: { fontSize: 15, fontWeight: '700', color: '#16142F', textAlign: 'center' },
  emptyText: {
    fontSize: 12,
    lineHeight: 18,
    color: '#726C8E',
    textAlign: 'center',
    marginTop: 5,
    maxWidth: 290,
    flexShrink: 1,
  },
  emptyAddButton: {
    height: 42,
    paddingHorizontal: 18,
    borderRadius: 12,
    backgroundColor: '#F0F2FF',
    borderWidth: 1,
    borderColor: '#D7DBFF',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 16,
  },
  emptyAddButtonText: { fontSize: 13, fontWeight: '700', color: '#5566EB' },
  activityList: { gap: 10 },
  activityCard: {
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#E5E6F2',
    backgroundColor: '#FFFFFF',
    padding: 14,
    gap: 8,
  },
  activityCardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  typeBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
    alignSelf: 'flex-start',
  },
  typeBadgeText: {
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  badgeClass: { backgroundColor: '#ECEEFF' },
  badgeClassText: { color: '#4F5BD5' },
  badgeTuition: { backgroundColor: '#E8F0FE' },
  badgeTuitionText: { color: '#2563EB' },
  badgeSports: { backgroundColor: '#E0F2FE' },
  badgeSportsText: { color: '#0284C7' },
  badgeSelfStudy: { backgroundColor: '#F3E8FF' },
  badgeSelfStudyText: { color: '#7E22CE' },
  badgeOther: { backgroundColor: '#F1F2F6' },
  badgeOtherText: { color: '#59627F' },
  activityTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: '#16142F',
  },
  activityMetaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  activityMetaLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: '#726C8E',
  },
  activityMetaValue: {
    fontSize: 12,
    color: '#16142F',
    flex: 1,
  },
  optionalSubjectsCardWrap: {
    gap: 6,
  },
  optionalSubjectsCardLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: '#726C8E',
  },
  optionalBadgesWrap: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
  },
  optionalSubjectPill: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
    backgroundColor: '#F0F2FF',
    borderWidth: 1,
    borderColor: '#E0E3FA',
  },
  optionalSubjectPillText: {
    fontSize: 11,
    fontWeight: '500',
    color: '#4F5BD5',
  },
  activityNotes: {
    fontSize: 12,
    color: '#726C8E',
    lineHeight: 16,
  },
  deleteActivityBtn: {
    width: 26,
    height: 26,
    borderRadius: 8,
    backgroundColor: '#F7F7FB',
    alignItems: 'center',
    justifyContent: 'center',
  },
  deleteActivityText: {
    fontSize: 18,
    lineHeight: 19,
    color: '#9A96AD',
  },
  timetableError: { fontSize: 12, color: '#E05E5E', marginTop: 8, flexShrink: 1 },
  timetableActions: { flexDirection: 'row', alignItems: 'center', gap: 10, marginTop: 18 },
  modalKeyboardAvoid: { flex: 1, justifyContent: 'flex-end' },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(22,20,47,0.45)', justifyContent: 'flex-end' },
  addActivitySheet: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 22,
    borderTopRightRadius: 22,
    paddingTop: 12,
    paddingHorizontal: 20,
    paddingBottom: 28,
    maxHeight: '88%',
  },
  sheetHeaderRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 16, gap: 10 },
  sheetHeaderTextWrap: { flex: 1, minWidth: 0 },
  addActivityTitle: { fontSize: 18, fontWeight: '700', color: '#16142F' },
  addActivitySubtitle: { fontSize: 12, color: '#726C8E', marginTop: 2 },
  closeButton: {
    width: 34,
    height: 34,
    borderRadius: 11,
    backgroundColor: '#F0F2FF',
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  closeButtonText: { fontSize: 22, lineHeight: 22, color: '#59627F' },
  addActivityScrollContent: { paddingBottom: 8, gap: 14 },
  typeSelectorWrap: { gap: 8 },
  typeSelectorContainer: { marginHorizontal: -4 },
  typeSelectorScroll: { paddingHorizontal: 4, gap: 8 },
  typeChip: {
    paddingHorizontal: 14,
    height: 38,
    borderRadius: 10,
    backgroundColor: '#ECEEFF',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'transparent',
  },
  typeChipActive: {
    backgroundColor: '#5566EB',
    borderColor: '#5566EB',
  },
  typeChipText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#726C8E',
  },
  typeChipTextActive: {
    color: '#FFFFFF',
    fontWeight: '700',
  },
  optionalSubjectsSection: { gap: 8 },
  optionalSubHeading: { fontSize: 13, fontWeight: '600', color: '#16142F' },
  noOptionalText: { fontSize: 12, color: '#9A96AD', fontStyle: 'italic' },
  optionalList: { gap: 6 },
  optionalItemRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 8,
    paddingHorizontal: 12,
    backgroundColor: '#F5F6FF',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#E5E6F2',
  },
  optionalItemText: { fontSize: 13, color: '#16142F', fontWeight: '500', flex: 1 },
  optionalRemoveBtn: {
    width: 22,
    height: 22,
    borderRadius: 6,
    backgroundColor: '#E7E9FB',
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 8,
  },
  optionalRemoveText: { fontSize: 15, lineHeight: 16, color: '#726C8E', fontWeight: '700' },
  addOptionalInputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 4,
  },
  addOptionalInput: {
    flex: 1,
    height: 44,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E5E6F2',
    backgroundColor: '#FBFBFF',
    paddingHorizontal: 12,
    fontSize: 14,
    color: '#16142F',
  },
  addOptionalBtn: {
    height: 44,
    paddingHorizontal: 14,
    borderRadius: 12,
    backgroundColor: '#ECEEFF',
    borderWidth: 1,
    borderColor: '#D7DBFF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  addOptionalBtnDisabled: {
    opacity: 0.5,
  },
  addOptionalBtnText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#5566EB',
  },
  notesInput: { height: 72, paddingTop: 14, paddingBottom: 12 },

  loginRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', marginTop: 20, paddingBottom: 8 },
  loginText: { fontSize: 15, color: '#726C8E' },
  loginBtn: { marginLeft: 4, paddingVertical: 2 },
  loginLink: { fontSize: 15, fontWeight: '700', color: '#5566EB' },

  dateInput: {
    height: 52,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#E5E6F2',
    backgroundColor: '#FBFBFF',
    paddingHorizontal: 14,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },

  dateInputText: {
    flex: 1,
    fontSize: 15,
    color: '#16142F',
  },

  dateInputPlaceholder: {
    color: '#9A96AD',
  },

  calendarIcon: {
    fontSize: 15,
    color: '#16142F',
    marginLeft: 10,
  },

  // ── Step 6 styles ────────────────────────────────────────────────────────────
  page6Container: { paddingBottom: 40 },
  recordsList: { gap: 16 },
  examCard: {
    borderRadius: 18,
    borderWidth: 1,
    borderColor: '#E5E6F2',
    backgroundColor: '#FFFFFF',
    overflow: 'hidden',
  },
  examCardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#F5F6FF',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E6F2',
  },
  examCardTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#5566EB',
    flex: 1,
    minWidth: 0,
  },
  examDeleteBtn: {
    width: 30,
    height: 30,
    borderRadius: 10,
    backgroundColor: '#FEE2E2',
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  examDeleteText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#E05E5E',
  },
  examFields: {
    padding: 16,
    gap: 14,
  },
  emptyAcademicCard: {
    borderRadius: 18,
    borderWidth: 1,
    borderColor: '#E5E6F2',
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 22,
    paddingVertical: 28,
    alignItems: 'center',
  },
  emptyAcademicIcon: {
    width: 52,
    height: 52,
    borderRadius: 16,
    backgroundColor: '#ECEEFF',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  emptyAcademicIconText: {
    fontSize: 24,
  },
  addAnotherBtn: {
    height: 52,
    borderRadius: 14,
    borderWidth: 1.5,
    borderColor: '#C8CCFF',
    backgroundColor: '#F5F6FF',
    alignItems: 'center',
    justifyContent: 'center',
    borderStyle: 'dashed',
  },
  addAnotherText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#5566EB',
  },
  academicInfoBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFF9E8',
    borderWidth: 1,
    borderColor: '#F3D98A',
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 12,
    marginTop: 16,
  },
  academicError: {
    fontSize: 12,
    color: '#E05E5E',
    marginTop: 10,
    flexShrink: 1,
  },
  academicActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 18,
  },

  // ── Step 7 styles ────────────────────────────────────────────────────────────
  page7Container: { paddingBottom: 40 },
  portionSection: {
    marginBottom: 26,
  },
  portionSectionTitle: {
    fontSize: 17,
    fontWeight: '700',
    color: '#16142F',
    marginBottom: 6,
  },
  portionSectionDesc: {
    fontSize: 13,
    color: '#726C8E',
    lineHeight: 19,
    marginBottom: 14,
    flexShrink: 1,
  },
  portionFieldError: {
    fontSize: 12,
    color: '#E05E5E',
    marginTop: 4,
    flexShrink: 1,
  },
  portionSubmitError: {
    fontSize: 12,
    color: '#E05E5E',
    marginTop: 8,
    marginBottom: 4,
    flexShrink: 1,
  },
  portionActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginTop: 10,
  },
  portionExtra: {
    marginTop: 14,
  },
  learningSourcesList: {
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#E5E6F2',
    backgroundColor: '#FFFFFF',
    overflow: 'hidden',
  },
  learningSourceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F1FA',
    gap: 12,
  },
  lsCheckBox: {
    width: 20,
    height: 20,
    borderRadius: 6,
    borderWidth: 1.5,
    borderColor: '#C8CCFF',
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  lsCheckBoxOn: {
    backgroundColor: '#5566EB',
    borderColor: '#5566EB',
  },
  lsCheckMark: {
    width: 10,
    height: 6,
    borderLeftWidth: 2,
    borderBottomWidth: 2,
    borderColor: '#FFFFFF',
    marginTop: -2,
    transform: [{ rotate: '-45deg' }],
  },
  lsLabel: {
    flex: 1,
    fontSize: 15,
    color: '#16142F',
    flexShrink: 1,
  },
});

export default RegisterScreen;