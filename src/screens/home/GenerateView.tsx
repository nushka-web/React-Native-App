import { useEffect, useRef, useState, type ComponentRef } from 'react';
import {
  ActivityIndicator,
  Keyboard,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';

import PrimaryButton from '../../components/common/PrimaryButton';
import StudentTimetableBuilder, {
  type TimetableActivity,
} from '../../components/timetable/StudentTimetableBuilder';
import {
  buildContextTimetable,
  fetchGenerateContext,
  generateContent,
  saveGenerateContext,
  type StudentContext,
} from '../../services/generateApi';

const BOARD_OPTIONS = ['CBSE', 'ICSE', 'ISC', 'State Board'];
const CLASS_OPTIONS = Array.from({ length: 12 }, (_, index) => String(index + 1));
const STREAM_OPTIONS = ['Arts', 'Commerce', 'Science'];
const TEST_TYPES = ['Semester', 'Unit Test', 'Practice', 'Final Exam'];
const QUESTION_TYPES = ['MCQ', 'Long Answer'];

type Details = { board: string; standard: string; stream: string; careerGoals: string };

type Stage = 'loading' | 'details' | 'generate';

// ── Small pieces ──────────────────────────────────────────────────────────────

function Chips({
  options,
  value,
  onSelect,
  label = (o: string) => o,
}: {
  options: string[];
  value: string;
  onSelect: (v: string) => void;
  label?: (o: string) => string;
}) {
  return (
    <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.chipRow}>
      {options.map(option => {
        const on = option === value;
        return (
          <Pressable
            key={option}
            style={[styles.chip, on && styles.chipOn]}
            onPress={() => onSelect(option)}
            accessibilityRole="button"
            accessibilityState={{ selected: on }}>
            <Text style={[styles.chipText, on && styles.chipTextOn]}>{label(option)}</Text>
          </Pressable>
        );
      })}
    </ScrollView>
  );
}

function Label({ text, required }: { text: string; required?: boolean }) {
  return (
    <Text style={styles.label}>
      {text}
      {required && <Text style={styles.req}> *</Text>}
    </Text>
  );
}

// ── Screen ────────────────────────────────────────────────────────────────────

function GenerateView() {
  const [stage, setStage] = useState<Stage>('loading');
  const [details, setDetails] = useState<Details>({ board: '', standard: '', stream: '', careerGoals: '' });
  const [timetable, setTimetable] = useState<TimetableActivity[]>([]);
  const [detailsError, setDetailsError] = useState('');
  const [saving, setSaving] = useState(false);

  // Generate page
  const [subject, setSubject] = useState('All');
  const [chapter, setChapter] = useState('All');
  const [contentMode, setContentMode] = useState<'study' | 'test'>('study');
  const [testType, setTestType] = useState('Semester');
  const [openBook, setOpenBook] = useState(false);
  const [questionTypes, setQuestionTypes] = useState<string[]>(['MCQ']);
  const [instructions, setInstructions] = useState('');
  const [generating, setGenerating] = useState(false);
  const [generateError, setGenerateError] = useState('');
  const [output, setOutput] = useState('');
  const [outputOpen, setOutputOpen] = useState(false);

  const isSenior = details.standard === '11' || details.standard === '12';

  // Keyboard handling: on newer Android versions the keyboard is drawn over the app
  // instead of resizing it, so the page adds its own bottom space and scrolls the
  // field being edited into view. The Platform check keeps the same code working on iOS.
  const scrollRef = useRef<ComponentRef<typeof ScrollView>>(null);
  const careerGoalsY = useRef(0);
  const [keyboardHeight, setKeyboardHeight] = useState(0);

  useEffect(() => {
    const showEvent = Platform.OS === 'ios' ? 'keyboardWillShow' : 'keyboardDidShow';
    const hideEvent = Platform.OS === 'ios' ? 'keyboardWillHide' : 'keyboardDidHide';
    const showSub = Keyboard.addListener(showEvent, e => setKeyboardHeight(e.endCoordinates.height));
    const hideSub = Keyboard.addListener(hideEvent, () => setKeyboardHeight(0));
    return () => {
      showSub.remove();
      hideSub.remove();
    };
  }, []);

  const contentStyle = [styles.content, keyboardHeight > 0 && { paddingBottom: keyboardHeight + 24 }];

  const scrollToEndSoon = () => {
    setTimeout(() => scrollRef.current?.scrollToEnd({ animated: true }), 250);
  };
  const scrollToCareerGoalsSoon = () => {
    setTimeout(() => scrollRef.current?.scrollTo({ y: Math.max(0, careerGoalsY.current - 12), animated: true }), 250);
  };

  // On entry: if the student already has board and class (from registration or an
  // earlier visit), go straight to the Generate page.
  useEffect(() => {
    let cancelled = false;
    fetchGenerateContext()
      .then(response => {
        if (cancelled) {
          return;
        }
        const ctx = response.context ?? {};
        const standard = String(ctx.standard ?? '').replace(/^class\s*/i, '');
        setDetails({
          board: ctx.board ?? '',
          standard,
          stream: ctx.stream ?? '',
          careerGoals: ctx.careerGoals ?? '',
        });
        setStage(ctx.board && standard ? 'generate' : 'details');
      })
      .catch(() => {
        if (!cancelled) {
          setStage('details');
        }
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const buildContext = (): StudentContext => ({
    board: details.board,
    standard: details.standard,
    stream: details.stream,
    careerGoals: details.careerGoals.trim(),
    timetable: buildContextTimetable(timetable),
  });

  const validateDetails = (): string => {
    if (!details.standard) {
      return 'Please select your class.';
    }
    if (!details.board) {
      return 'Please select your board.';
    }
    if (isSenior && !details.stream) {
      return 'Please select a stream for Class 11 or 12.';
    }
    if (!details.careerGoals.trim()) {
      return 'Please enter your career goals.';
    }
    return '';
  };

  const handleSaveAndContinue = async () => {
    const problem = validateDetails();
    if (problem) {
      setDetailsError(problem);
      return;
    }
    setDetailsError('');
    setSaving(true);
    try {
      await saveGenerateContext(buildContext());
      setStage('generate');
    } catch (err) {
      setDetailsError(err instanceof Error ? err.message : 'Could not save your details. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  // "Skip for now" still needs class and board: the backend cannot generate without them.
  const handleSkip = () => {
    if (!details.standard || !details.board) {
      setDetailsError('Class and board are needed to generate content. Please select them first.');
      return;
    }
    setDetailsError('');
    setStage('generate');
  };

  const toggleQuestionType = (type: string) => {
    setQuestionTypes(prev => (prev.includes(type) ? prev.filter(t => t !== type) : [...prev, type]));
  };

  const handleGenerate = async () => {
    if (generating) {
      return;
    }
    if (contentMode === 'test' && questionTypes.length === 0) {
      setGenerateError('Select at least one question type.');
      return;
    }
    setGenerateError('');
    setGenerating(true);
    try {
      const response = await generateContent(buildContext(), {
        subject: subject.trim() || 'All',
        chapter: chapter.trim() || 'All',
        contentMode,
        additionalInstructions: instructions.trim() || undefined,
        ...(contentMode === 'test' ? { testType, openBook, questionTypes } : {}),
      });
      setOutput(response.output ?? '');
      setOutputOpen(true);
    } catch (err) {
      setGenerateError(err instanceof Error ? err.message : 'Could not generate content. Please try again.');
    } finally {
      setGenerating(false);
    }
  };

  // ── Loading ──
  if (stage === 'loading') {
    return (
      <View style={styles.centerBox}>
        <ActivityIndicator size="large" color="#5566EB" />
        <Text style={styles.centerText}>Loading...</Text>
      </View>
    );
  }

  // ── Step A: Tell us about yourself ──
  if (stage === 'details') {
    return (
      <View style={styles.flex1}>
        <ScrollView ref={scrollRef} contentContainerStyle={contentStyle} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
          <Text style={styles.pageTitle}>Tell us about yourself</Text>
          <Text style={styles.pageSub}>This helps personalise content from your syllabus.</Text>

          <View style={styles.block}>
            <Label text="Current Standard / Class" required />
            <Chips options={CLASS_OPTIONS} value={details.standard} onSelect={v => setDetails(d => ({ ...d, standard: v, stream: v === '11' || v === '12' ? d.stream : '' }))} label={o => `Class ${o}`} />
          </View>

          <View style={styles.block}>
            <Label text="Board" required />
            <Chips options={BOARD_OPTIONS} value={details.board} onSelect={v => setDetails(d => ({ ...d, board: v }))} />
          </View>

          {isSenior && (
            <View style={styles.block}>
              <Label text="Stream" required />
              <Chips options={STREAM_OPTIONS} value={details.stream} onSelect={v => setDetails(d => ({ ...d, stream: v }))} />
            </View>
          )}

          <View style={styles.block} onLayout={e => { careerGoalsY.current = e.nativeEvent.layout.y; }}>
            <Label text="Career Goals" required />
            <TextInput
              style={[styles.input, styles.multiline]}
              value={details.careerGoals}
              onFocus={scrollToCareerGoalsSoon}
              onChangeText={v => setDetails(d => ({ ...d, careerGoals: v }))}
              placeholder="e.g. Engineer, Doctor, Civil Services"
              placeholderTextColor="#9A96AD"
              multiline
              textAlignVertical="top"
            />
          </View>

          <Text style={styles.sectionHeading}>Your Timetable</Text>
          <Text style={styles.pageSub}>Plan your weekly routine. You can skip this and add it later.</Text>

          <StudentTimetableBuilder value={timetable} onChange={setTimetable} />

          {!!detailsError && <Text style={styles.error}>{detailsError}</Text>}

          <View style={styles.actions}>
            <Pressable style={styles.skipButton} onPress={handleSkip} disabled={saving} accessibilityRole="button">
              <Text style={styles.skipText}>Skip for now</Text>
            </Pressable>
            <View style={styles.flex1}>
              <PrimaryButton title={saving ? 'Saving...' : 'Save & Continue'} onPress={handleSaveAndContinue} disabled={saving} />
            </View>
          </View>
        </ScrollView>
      </View>
    );
  }

  // ── Step B: Generate ──
  const slotCount = Object.values(buildContextTimetable(timetable)).reduce((n, e) => n + e.lectures.length, 0);

  return (
    <View style={styles.flex1}>
      <ScrollView ref={scrollRef} contentContainerStyle={contentStyle} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
        <Text style={styles.pageTitle}>Generate</Text>
        <Text style={styles.pageSub}>Choose your subject and content type, and let AI create it from your syllabus.</Text>

        <View style={styles.summaryCard}>
          <View style={styles.flex1}>
            <Text style={styles.summaryText} numberOfLines={2}>
              Class {details.standard} · {details.board}
              {details.stream ? ` · ${details.stream}` : ''}
            </Text>
            {slotCount > 0 && <Text style={styles.summaryMeta}>{slotCount} timetable {slotCount === 1 ? 'slot' : 'slots'}</Text>}
          </View>
          <Pressable style={styles.updateButton} onPress={() => setStage('details')} accessibilityRole="button">
            <Text style={styles.updateText}>Update my details</Text>
          </Pressable>
        </View>

        <View style={styles.card}>
          <Text style={styles.cardHeading}>PARAMETERS</Text>

          <View style={styles.block}>
            <Label text="Subject" />
            <TextInput style={styles.input} value={subject} onChangeText={setSubject} placeholder="All" placeholderTextColor="#9A96AD" />
          </View>
          <View style={styles.block}>
            <Label text="Chapter" />
            <TextInput style={styles.input} value={chapter} onChangeText={setChapter} placeholder="All" placeholderTextColor="#9A96AD" />
          </View>

          <View style={styles.block}>
            <Label text="Content Type" />
            <View style={styles.modeRow}>
              <Pressable style={[styles.modeCard, contentMode === 'study' && styles.modeCardOn]} onPress={() => setContentMode('study')} accessibilityRole="button">
                <Text style={styles.modeIcon}>📚</Text>
                <Text style={[styles.modeTitle, contentMode === 'study' && styles.modeTitleOn]}>Study Material</Text>
                <Text style={styles.modeDesc}>Comprehensive notes and explanations</Text>
              </Pressable>
              <Pressable style={[styles.modeCard, contentMode === 'test' && styles.modeCardOn]} onPress={() => setContentMode('test')} accessibilityRole="button">
                <Text style={styles.modeIcon}>📝</Text>
                <Text style={[styles.modeTitle, contentMode === 'test' && styles.modeTitleOn]}>Test</Text>
                <Text style={styles.modeDesc}>Questions and assessments</Text>
              </Pressable>
            </View>
          </View>

          {contentMode === 'test' && (
            <View style={styles.testBox}>
              <Label text="Test Type" />
              <Chips options={TEST_TYPES} value={testType} onSelect={setTestType} />

              <View style={styles.switchRow}>
                <Pressable style={[styles.check, openBook && styles.checkOn]} onPress={() => setOpenBook(v => !v)} accessibilityRole="checkbox" accessibilityState={{ checked: openBook }}>
                  {openBook && <Text style={styles.checkMark}>✓</Text>}
                </Pressable>
                <Text style={styles.switchText}>Open book (students may refer to notes or textbooks)</Text>
              </View>

              <Label text="Question Types" />
              <View style={styles.modeRow}>
                {QUESTION_TYPES.map(type => {
                  const on = questionTypes.includes(type);
                  return (
                    <Pressable key={type} style={[styles.qType, on && styles.qTypeOn]} onPress={() => toggleQuestionType(type)} accessibilityRole="checkbox" accessibilityState={{ checked: on }}>
                      <Text style={[styles.qTypeText, on && styles.qTypeTextOn]}>{on ? '✓ ' : ''}{type}</Text>
                    </Pressable>
                  );
                })}
              </View>
            </View>
          )}

          <View style={styles.block}>
            <Label text="Additional Instructions (optional)" />
            <TextInput
              style={[styles.input, styles.multiline]}
              value={instructions}
              onFocus={scrollToEndSoon}
              onChangeText={setInstructions}
              placeholder={'Add any extra instructions or context here...\ne.g. "Focus on derivations" or "Include diagrams"'}
              placeholderTextColor="#9A96AD"
              multiline
              textAlignVertical="top"
            />
          </View>

          {!!generateError && <Text style={styles.error}>{generateError}</Text>}

          <PrimaryButton title={generating ? 'Generating... this can take a minute' : 'Generate'} onPress={handleGenerate} disabled={generating} />
        </View>
      </ScrollView>

      {/* Result */}
      <Modal visible={outputOpen} animationType="slide" onRequestClose={() => setOutputOpen(false)}>
        <View style={styles.resultScreen}>
          <View style={styles.resultTop}>
            <Text style={styles.resultTitle}>{contentMode === 'test' ? 'Your Test' : 'Your Study Material'}</Text>
            <Pressable style={styles.resultClose} onPress={() => setOutputOpen(false)} accessibilityRole="button" accessibilityLabel="Close">
              <Text style={styles.resultCloseText}>✕</Text>
            </Pressable>
          </View>
          <ScrollView contentContainerStyle={styles.resultBody}>
            <Text style={styles.resultText} selectable>{output || 'No content was returned.'}</Text>
          </ScrollView>
        </View>
      </Modal>
    </View>
  );
}

export default GenerateView;

const styles = StyleSheet.create({
  flex1: { flex: 1 },
  content: { paddingHorizontal: 16, paddingTop: 18, paddingBottom: 32 },
  pageTitle: { fontSize: 22, fontWeight: '800', color: '#16142F' },
  pageSub: { marginTop: 4, marginBottom: 16, fontSize: 13, color: '#726C8E', lineHeight: 19 },
  sectionHeading: { marginTop: 8, fontSize: 17, fontWeight: '700', color: '#16142F' },
  block: { marginBottom: 16 },
  label: { fontSize: 13, fontWeight: '600', color: '#16142F', marginBottom: 8 },
  req: { color: '#E05E5E' },
  input: {
    minHeight: 50,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#E1E3F4',
    backgroundColor: '#FAFAFF',
    paddingHorizontal: 14,
    fontSize: 15,
    color: '#16142F',
  },
  multiline: { minHeight: 96, paddingTop: 12 },
  chipRow: { gap: 8, paddingRight: 8 },
  chip: {
    paddingHorizontal: 14,
    height: 38,
    borderRadius: 19,
    borderWidth: 1,
    borderColor: '#D7DBFF',
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  chipOn: { backgroundColor: '#5566EB', borderColor: '#5566EB' },
  chipText: { fontSize: 13, fontWeight: '600', color: '#59627F' },
  chipTextOn: { color: '#FFFFFF' },
  error: { fontSize: 12, color: '#E05E5E', marginTop: 8, marginBottom: 8 },
  actions: { flexDirection: 'row', alignItems: 'center', gap: 10, marginTop: 20 },
  skipButton: {
    height: 52,
    paddingHorizontal: 18,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#D7DBFF',
    backgroundColor: '#F0F2FF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  skipText: { fontSize: 14, fontWeight: '600', color: '#59627F' },

  summaryCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    padding: 14,
    marginBottom: 14,
    borderRadius: 16,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E5E6F2',
  },
  summaryText: { fontSize: 14, fontWeight: '700', color: '#16142F' },
  summaryMeta: { marginTop: 2, fontSize: 12, color: '#726C8E' },
  updateButton: { paddingHorizontal: 12, height: 36, borderRadius: 12, backgroundColor: '#F0F2FF', alignItems: 'center', justifyContent: 'center' },
  updateText: { fontSize: 12, fontWeight: '700', color: '#4452D6' },

  card: { padding: 16, borderRadius: 20, backgroundColor: '#FFFFFF', borderWidth: 1, borderColor: '#E5E6F2' },
  cardHeading: { fontSize: 12, fontWeight: '800', color: '#59627F', letterSpacing: 0.6, marginBottom: 14 },
  modeRow: { flexDirection: 'row', gap: 10 },
  modeCard: { flex: 1, padding: 12, borderRadius: 14, borderWidth: 1, borderColor: '#E1E3F4', backgroundColor: '#FAFAFF' },
  modeCardOn: { borderColor: '#5566EB', backgroundColor: '#EEF0FF' },
  modeIcon: { fontSize: 22 },
  modeTitle: { marginTop: 6, fontSize: 14, fontWeight: '700', color: '#16142F' },
  modeTitleOn: { color: '#4452D6' },
  modeDesc: { marginTop: 2, fontSize: 11, color: '#726C8E', lineHeight: 15 },
  testBox: { padding: 12, marginBottom: 16, borderRadius: 14, backgroundColor: '#F3F4FF', gap: 10 },
  switchRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  switchText: { flex: 1, fontSize: 12, color: '#59627F' },
  check: { width: 22, height: 22, borderRadius: 6, borderWidth: 1.5, borderColor: '#B9BEE8', alignItems: 'center', justifyContent: 'center', backgroundColor: '#FFFFFF' },
  checkOn: { backgroundColor: '#5566EB', borderColor: '#5566EB' },
  checkMark: { color: '#FFFFFF', fontSize: 14, fontWeight: '800' },
  qType: { flex: 1, height: 44, borderRadius: 12, borderWidth: 1, borderColor: '#D7DBFF', backgroundColor: '#FFFFFF', alignItems: 'center', justifyContent: 'center' },
  qTypeOn: { backgroundColor: '#EEF0FF', borderColor: '#5566EB' },
  qTypeText: { fontSize: 13, fontWeight: '600', color: '#59627F' },
  qTypeTextOn: { color: '#4452D6' },

  centerBox: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 24 },
  centerText: { marginTop: 10, fontSize: 14, color: '#726C8E' },

  resultScreen: { flex: 1, backgroundColor: '#F5F6FF', paddingTop: 44 },
  resultTop: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingBottom: 12 },
  resultTitle: { fontSize: 18, fontWeight: '800', color: '#16142F' },
  resultClose: { width: 40, height: 40, borderRadius: 20, backgroundColor: '#FFFFFF', alignItems: 'center', justifyContent: 'center' },
  resultCloseText: { fontSize: 16, color: '#16142F' },
  resultBody: { padding: 16, paddingBottom: 40 },
  resultText: { fontSize: 14, lineHeight: 22, color: '#16142F' },
});