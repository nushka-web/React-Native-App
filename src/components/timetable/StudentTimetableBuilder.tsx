import { useState, type ComponentProps, type ReactNode } from 'react';
import {
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';

import PrimaryButton from '../common/PrimaryButton';

// Weekly schedule builder for students. This is the same layout as the
// "Student Schedule" step of the registration screen (day tabs, Add Activity
// sheet, activity cards). The registration screen itself is not touched.

export type ActivityType = 'Class' | 'Tuition' | 'Sports' | 'Self Study' | 'Other';

export type TimetableActivity = {
  id: string;
  day: string;
  activityType: ActivityType;
  title: string;
  optionalSubjects?: string[];
  organization?: string;
  notes?: string;
};

const TIMETABLE_DAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const ACTIVITY_TYPES: ActivityType[] = ['Class', 'Tuition', 'Sports', 'Self Study', 'Other'];

function getTypeBadgeStyle(type: string) {
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

function getTypeBadgeTextStyle(type: string) {
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

function Field({
  label,
  required,
  children,
}: {
  label: string;
  required?: boolean;
  children: ReactNode;
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

function Input(props: ComponentProps<typeof TextInput>) {
  return <TextInput style={s.input} placeholderTextColor="#9A96AD" {...props} />;
}

type Props = {
  value: TimetableActivity[];
  onChange: (next: TimetableActivity[]) => void;
};

function StudentTimetableBuilder({ value, onChange }: Props) {
  const [selectedDay, setSelectedDay] = useState('Mon');
  const [showAddActivity, setShowAddActivity] = useState(false);
  const [selectedActivityType, setSelectedActivityType] = useState<ActivityType>('Class');

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

  const selectedDayActivities = value.filter(item => item.day === selectedDay);

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
    setActivityError('');
  };

  const handleAddOptionalSubject = () => {
    const trimmed = currentOptionalSubject.trim();
    if (!trimmed) {
      return;
    }
    if (optionalSubjects.some(x => x.toLowerCase() === trimmed.toLowerCase())) {
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
      const pending = currentOptionalSubject.trim();
      if (
        pending &&
        !allOptional.some(x => x.toLowerCase() === pending.toLowerCase()) &&
        pending.toLowerCase() !== title.toLowerCase()
      ) {
        allOptional.push(pending);
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
    } else {
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

    onChange([...value, newActivity]);
    setShowAddActivity(false);
    resetActivityForm();
  };

  const handleDeleteActivity = (id: string) => {
    onChange(value.filter(item => item.id !== id));
  };

  return (
    <>
      {/* Day selector */}
  <ScrollView
    horizontal
    showsHorizontalScrollIndicator={false}
    contentContainerStyle={s.dayTabsContent}
    style={s.dayTabsScroll}
    bounces={false}
    keyboardShouldPersistTaps="handled"
  >
    {TIMETABLE_DAYS.map(day => {
      const isActive = selectedDay === day;
      const hasActivities = value.some(item =>
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
              {ACTIVITY_TYPES.map(type => {
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

          {/* Dynamic Fields per Activity Type */}
          {selectedActivityType === 'Class' && (
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

          {selectedActivityType === 'Tuition' && (
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

          {selectedActivityType === 'Sports' && (
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

          {selectedActivityType === 'Self Study' && (
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

          {selectedActivityType === 'Other' && (
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
    </>
  );
}

export default StudentTimetableBuilder;

const s = StyleSheet.create({
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
  activityCountText: { fontSize: 12, color: '#9A96AD', marginTop: 2, flexShrink: 1 },
  activityList: { gap: 10 },
  activityMetaLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: '#726C8E',
  },
  activityMetaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  activityMetaValue: {
    fontSize: 12,
    color: '#16142F',
    flex: 1,
  },
  activityNotes: {
    fontSize: 12,
    color: '#726C8E',
    lineHeight: 16,
  },
  activityTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: '#16142F',
  },
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
  addActivityScrollContent: { paddingBottom: 8, gap: 14 },
  addActivitySheet: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 22,
    borderTopRightRadius: 22,
    paddingTop: 12,
    paddingHorizontal: 20,
    paddingBottom: 28,
    maxHeight: '88%',
  },
  addActivitySubtitle: { fontSize: 12, color: '#726C8E', marginTop: 2 },
  addActivityText: { fontSize: 12, fontWeight: '700', color: '#FFFFFF' },
  addActivityTitle: { fontSize: 18, fontWeight: '700', color: '#16142F' },
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
  addOptionalInputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 4,
  },
  badgeClass: { backgroundColor: '#ECEEFF' },
  badgeClassText: { color: '#4F5BD5' },
  badgeOther: { backgroundColor: '#F1F2F6' },
  badgeOtherText: { color: '#59627F' },
  badgeSelfStudy: { backgroundColor: '#F3E8FF' },
  badgeSelfStudyText: { color: '#7E22CE' },
  badgeSports: { backgroundColor: '#E0F2FE' },
  badgeSportsText: { color: '#0284C7' },
  badgeTuition: { backgroundColor: '#E8F0FE' },
  badgeTuitionText: { color: '#2563EB' },
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
  dayTabsContent: { paddingHorizontal: 4, gap: 8 },
  dayTabsScroll: { marginHorizontal: -4, marginBottom: 18 },
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
  emptyScheduleCard: {
    borderRadius: 18,
    borderWidth: 1,
    borderColor: '#E5E6F2',
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 22,
    paddingVertical: 26,
    alignItems: 'center',
  },
  emptyText: {
    fontSize: 12,
    lineHeight: 18,
    color: '#726C8E',
    textAlign: 'center',
    marginTop: 5,
    maxWidth: 290,
    flexShrink: 1,
  },
  emptyTitle: { fontSize: 15, fontWeight: '700', color: '#16142F', textAlign: 'center' },
  field: { gap: 6 },
  handle: { width: 36, height: 4, borderRadius: 2, backgroundColor: '#E5E6F2', alignSelf: 'center', marginBottom: 16 },
  input: { height: 52, borderRadius: 14, borderWidth: 1, borderColor: '#E5E6F2', backgroundColor: '#FBFBFF', paddingHorizontal: 14, fontSize: 15, color: '#16142F' },
  label: { fontSize: 13, fontWeight: '600', color: '#16142F' },
  modalKeyboardAvoid: { flex: 1, justifyContent: 'flex-end' },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(22,20,47,0.45)', justifyContent: 'flex-end' },
  noOptionalText: { fontSize: 12, color: '#9A96AD', fontStyle: 'italic' },
  notesInput: { height: 72, paddingTop: 14, paddingBottom: 12 },
  optionalBadgesWrap: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
  },
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
  optionalList: { gap: 6 },
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
  optionalSubHeading: { fontSize: 13, fontWeight: '600', color: '#16142F' },
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
  optionalSubjectsCardLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: '#726C8E',
  },
  optionalSubjectsCardWrap: {
    gap: 6,
  },
  optionalSubjectsSection: { gap: 8 },
  req: { color: '#E05E5E' },
  selectedDayTitle: { fontSize: 18, fontWeight: '700', color: '#16142F' },
  sheetHeaderRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 16, gap: 10 },
  sheetHeaderTextWrap: { flex: 1, minWidth: 0 },
  timetableError: { fontSize: 12, color: '#E05E5E', marginTop: 8, flexShrink: 1 },
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
  typeSelectorContainer: { marginHorizontal: -4 },
  typeSelectorScroll: { paddingHorizontal: 4, gap: 8 },
  typeSelectorWrap: { gap: 8 },
});