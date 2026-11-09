import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  Image,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';

import {
  assetUrl,
  fetchChapter,
  fetchStudentScope,
  fetchSyllabus,
  type EducationKind,
  type PracticeType,
  type StudentScope,
  type SyllabusChapter,
  type SyllabusSubject,
  type SyllabusUnit,
} from '../../services/educationApi';

type Props = { token: string };

type Tab = 'study-material' | 'practice-questions' | 'study-abroad';

const TABS: { key: Tab; label: string }[] = [
  { key: 'study-material', label: 'Study Material' },
  { key: 'practice-questions', label: 'Practice Questions' },
  { key: 'study-abroad', label: 'Study Abroad' },
];

// ── Helpers ───────────────────────────────────────────────────────────────────

const text = (value: unknown): string => {
  if (typeof value === 'string') {
    return value;
  }
  if (typeof value === 'number' || typeof value === 'boolean') {
    return String(value);
  }
  return '';
};

const itemsOf = (value: unknown): string[] =>
  Array.isArray(value)
    ? value
        .map(item => {
          if (typeof item === 'string') {
            return item;
          }
          if (item && typeof item === 'object') {
            const record = item as Record<string, unknown>;
            return text(record.text || record.content || record.title || record.description);
          }
          return text(item);
        })
        .filter(Boolean)
    : [];

const scopeLine = (scope: StudentScope) =>
  [scope.standard ? `Class ${scope.standard}` : '', scope.board, scope.stream].filter(Boolean).join(' · ');

// ── Study material content ────────────────────────────────────────────────────

type Block = string | Record<string, any>;

function BlockView({ block, index }: { block: Block; index: number }) {
  if (typeof block === 'string') {
    return <Text style={styles.paragraph}>{block}</Text>;
  }
  const type = String(block.type || 'paragraph')
    .toLowerCase()
    .replace(/[_\s]+/g, '-');
  const body = text(block.text || block.content || block.description);

  if (type === 'heading' || type === 'subheading') {
    return <Text style={styles.inlineHeading}>{text(block.title || block.heading || block.subheading) || body}</Text>;
  }
  if (type === 'paragraph' || type === 'text') {
    return body ? <Text style={styles.paragraph}>{body}</Text> : null;
  }
  if (['bullet', 'bullets', 'list', 'bullet-list', 'unordered-list'].includes(type)) {
    const values = itemsOf(block.items || block.content);
    return (
      <View style={styles.listWrap}>
        {values.map((item, i) => (
          <View key={i} style={styles.listRow}>
            <Text style={styles.listMark}>•</Text>
            <Text style={styles.listText}>{item}</Text>
          </View>
        ))}
      </View>
    );
  }
  if (type === 'ordered-list' || type === 'steps') {
    const values = itemsOf(block.items || block.steps || block.content);
    return (
      <View style={styles.listWrap}>
        {values.map((item, i) => (
          <View key={i} style={styles.listRow}>
            <Text style={styles.listMark}>{i + 1}.</Text>
            <Text style={styles.listText}>{item}</Text>
          </View>
        ))}
      </View>
    );
  }
  if (type === 'formula' || type === 'equation') {
    const expression = text(block.expression || block.formula || block.equation || body);
    return (
      <View style={styles.formulaBox}>
        {!!text(block.title || block.heading) && <Text style={styles.formulaTitle}>{text(block.title || block.heading)}</Text>}
        <Text style={styles.formulaText}>{expression}</Text>
        {!!text(block.description) && <Text style={styles.formulaDesc}>{text(block.description)}</Text>}
      </View>
    );
  }
  if (type === 'table') {
    const headers = Array.isArray(block.headers) ? block.headers : [];
    const rows: unknown[][] = Array.isArray(block.rows) ? block.rows : [];
    const cell = (v: unknown) => (v === null || v === undefined ? '' : typeof v === 'string' ? v : JSON.stringify(v));
    return (
      <View style={{ marginTop: 10 }}>
        {!!text(block.title) && <Text style={styles.inlineHeading}>{text(block.title)}</Text>}
        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
          <View style={styles.table}>
            {headers.length > 0 && (
              <View style={[styles.tableRow, styles.tableHead]}>
                {headers.map((h: unknown, i: number) => (
                  <Text key={i} style={[styles.tableCell, styles.tableHeadText]}>
                    {cell(h)}
                  </Text>
                ))}
              </View>
            )}
            {rows.map((row, r) => (
              <View key={r} style={styles.tableRow}>
                {(Array.isArray(row) ? row : []).map((c, i) => (
                  <Text key={i} style={styles.tableCell}>
                    {cell(c)}
                  </Text>
                ))}
              </View>
            ))}
          </View>
        </ScrollView>
      </View>
    );
  }
  if (['note', 'warning', 'definition'].includes(type)) {
    return (
      <View style={[styles.callout, type === 'warning' && styles.calloutWarning]}>
        <Text style={styles.calloutTitle}>{text(block.title || block.term) || type.toUpperCase()}</Text>
        <Text style={styles.calloutText}>{body || text(block.definition)}</Text>
      </View>
    );
  }
  if (type === 'example' || type === 'worked-example') {
    const steps = itemsOf(block.steps);
    return (
      <View style={styles.exampleCard}>
        <Text style={styles.exampleTitle}>{text(block.title) || `Worked Example ${index + 1}`}</Text>
        {!!text(block.problem || block.question) && (
          <Text style={styles.paragraph}>
            <Text style={styles.bold}>Question: </Text>
            {text(block.problem || block.question)}
          </Text>
        )}
        {steps.map((step, i) => (
          <View key={i} style={styles.listRow}>
            <Text style={styles.listMark}>{i + 1}.</Text>
            <Text style={styles.listText}>{step}</Text>
          </View>
        ))}
        {!!text(block.solution || block.explanation) && (
          <Text style={styles.paragraph}>
            <Text style={styles.bold}>Solution: </Text>
            {text(block.solution || block.explanation)}
          </Text>
        )}
      </View>
    );
  }
  if (type === 'image' || type === 'diagram') {
    const source = text(block.src || block.path || block.url || block.image).trim();
    const caption = text(block.caption || block.description || block.title);
    if (!source) {
      return (
        <View style={styles.callout}>
          <Text style={styles.calloutTitle}>{text(block.title) || 'Diagram'}</Text>
          <Text style={styles.calloutText}>{text(block.caption || block.alt) || 'Diagram not available.'}</Text>
        </View>
      );
    }
    return (
      <View style={styles.figure}>
        <Image source={{ uri: assetUrl(source) }} style={styles.figureImage} resizeMode="contain" />
        {!!caption && <Text style={styles.caption}>{caption}</Text>}
      </View>
    );
  }
  return body ? <Text style={styles.paragraph}>{body}</Text> : null;
}

function SectionView({ section, index, level = 1 }: { section: Record<string, any>; index: number; level?: number }) {
  const title = text(section.title || section.heading || section.name) || `Section ${index + 1}`;
  const raw: Block[] = Array.isArray(section.content)
    ? section.content
    : Array.isArray(section.blocks)
      ? section.blocks
      : section.content
        ? [section.content]
        : [];
  const subsections: Record<string, any>[] = Array.isArray(section.subsections)
    ? section.subsections
    : Array.isArray(section.sub_sections)
      ? section.sub_sections
      : [];
  return (
    <View style={level === 1 ? styles.section : styles.subSection}>
      <Text style={level === 1 ? styles.sectionTitle : styles.subSectionTitle}>{title}</Text>
      {raw.map((block, i) => (
        <BlockView key={i} block={block} index={i} />
      ))}
      {subsections.map((child, i) => (
        <SectionView key={i} section={child} index={i} level={level + 1} />
      ))}
    </View>
  );
}

function chapterSections(chapter: Record<string, any>): Record<string, any>[] {
  if (Array.isArray(chapter.sections)) {
    return chapter.sections;
  }
  const content = chapter.content ?? chapter.contents;
  if (Array.isArray(content)) {
    return [{ title: 'Chapter Content', content }];
  }
  if (content && typeof content === 'object') {
    return [{ title: 'Chapter Content', content: [content] }];
  }
  return [];
}

// ── Practice questions content ────────────────────────────────────────────────

type Question = {
  id?: string;
  questionNumber?: number | string;
  question?: string;
  topic?: string;
  questionType?: string;
  competency?: string;
  skillTested?: string;
  marks?: number | string;
  options?: string[];
  answer?: string;
  explanation?: string;
  reasoning?: string;
  rubric?: { fullMarks?: string; partialMarks?: string };
};

function QuestionCard({ question, index }: { question: Question; index: number }) {
  const [showAnswer, setShowAnswer] = useState(false);
  const number = question.questionNumber || index + 1;
  const chips = [
    question.topic,
    question.questionType,
    question.competency,
    question.skillTested,
    question.marks ? `${question.marks} mark${Number(question.marks) === 1 ? '' : 's'}` : '',
  ].filter(Boolean) as string[];
  const hasAnswer = !!(question.answer || question.explanation || question.reasoning || question.rubric);

  return (
    <View style={styles.qCard}>
      <View style={styles.qHeading}>
        <View style={styles.qNumber}>
          <Text style={styles.qNumberText}>{number}</Text>
        </View>
        <Text style={styles.qText}>{question.question}</Text>
      </View>
      {chips.length > 0 && (
        <View style={styles.chipRow}>
          {chips.map((chip, i) => (
            <View key={`${chip}-${i}`} style={styles.qChip}>
              <Text style={styles.qChipText}>{chip}</Text>
            </View>
          ))}
        </View>
      )}
      {!!question.options?.length && (
        <View style={{ marginTop: 10 }}>
          {question.options.map((option, i) => (
            <View key={i} style={styles.optionRow}>
              <Text style={styles.optionLetter}>{String.fromCharCode(65 + i)}.</Text>
              <Text style={styles.optionText}>{option}</Text>
            </View>
          ))}
        </View>
      )}
      {hasAnswer && (
        <Pressable style={styles.answerToggle} onPress={() => setShowAnswer(prev => !prev)} accessibilityRole="button">
          <Text style={styles.answerToggleText}>{showAnswer ? 'Hide answer' : 'Show answer'}</Text>
        </Pressable>
      )}
      {showAnswer && (
        <View>
          {!!question.answer && (
            <View style={[styles.answerBlock, styles.answerMain]}>
              <Text style={styles.answerHeading}>Answer</Text>
              <Text style={styles.answerText}>{question.answer}</Text>
            </View>
          )}
          {!!question.explanation && (
            <View style={styles.answerBlock}>
              <Text style={styles.answerHeading}>Explanation</Text>
              <Text style={styles.answerText}>{question.explanation}</Text>
            </View>
          )}
          {!!question.reasoning && (
            <View style={styles.answerBlock}>
              <Text style={styles.answerHeading}>Reasoning</Text>
              <Text style={styles.answerText}>{question.reasoning}</Text>
            </View>
          )}
          {!!(question.rubric?.fullMarks || question.rubric?.partialMarks) && (
            <View style={styles.answerBlock}>
              <Text style={styles.answerHeading}>Marking rubric</Text>
              {!!question.rubric?.fullMarks && (
                <Text style={styles.answerText}>
                  <Text style={styles.bold}>Full marks: </Text>
                  {question.rubric.fullMarks}
                </Text>
              )}
              {!!question.rubric?.partialMarks && (
                <Text style={styles.answerText}>
                  <Text style={styles.bold}>Partial marks: </Text>
                  {question.rubric.partialMarks}
                </Text>
              )}
            </View>
          )}
        </View>
      )}
    </View>
  );
}

// ── Chapter reader (study material or questions) ─────────────────────────────

type OpenChapter = { subject: SyllabusSubject; unit: SyllabusUnit; chapter: SyllabusChapter };

function ChapterReader({
  kind,
  scope,
  open,
  onBack,
}: {
  kind: EducationKind;
  scope: StudentScope;
  open: OpenChapter;
  onBack: () => void;
}) {
  const [practiceType, setPracticeType] = useState<PracticeType>('theoretical');
  const [data, setData] = useState<Record<string, any> | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const load = useCallback(async () => {
    setLoading(true);
    setError('');
    setData(null);
    try {
      setData(
        await fetchChapter<Record<string, any>>(kind, {
          scope,
          subject: open.subject,
          unitNumber: open.unit.unit_number,
          chapterNumber: open.chapter.chapter_number,
          type: practiceType,
        }),
      );
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not load this chapter.');
    } finally {
      setLoading(false);
    }
  }, [kind, scope, open, practiceType]);

  useEffect(() => {
    load();
  }, [load]);

  const meta = (data?.metadata || data?.meta || {}) as Record<string, any>;
  const title =
    text(meta.chapterName || data?.title || data?.chapter_name) || open.chapter.chapter_name || 'Chapter';
  const questions: Question[] = Array.isArray(data?.questions) ? data.questions : [];

  return (
    <ScrollView contentContainerStyle={styles.readerContent} showsVerticalScrollIndicator={false}>
      <Pressable onPress={onBack} hitSlop={8} accessibilityRole="button">
        <Text style={styles.backLink}>‹ Back</Text>
      </Pressable>
      <Text style={styles.readerSubject}>
        {open.subject.subject_name} · Unit {open.unit.unit_number}
      </Text>
      <Text style={styles.readerTitle}>
        Chapter {open.chapter.chapter_number}: {title}
      </Text>

      {kind === 'practice-questions' && (
        <View style={styles.segment}>
          {(['theoretical', 'competency'] as PracticeType[]).map(option => {
            const on = option === practiceType;
            return (
              <Pressable
                key={option}
                style={[styles.segmentItem, on && styles.segmentItemOn]}
                onPress={() => setPracticeType(option)}
                accessibilityRole="button"
                accessibilityState={{ selected: on }}>
                <Text style={[styles.segmentText, on && styles.segmentTextOn]}>
                  {option === 'theoretical' ? 'Theoretical' : 'Competency-Based'}
                </Text>
              </Pressable>
            );
          })}
        </View>
      )}

      {loading ? (
        <View style={styles.centerBox}>
          <ActivityIndicator size="large" color="#5566EB" />
          <Text style={styles.centerText}>Loading...</Text>
        </View>
      ) : error ? (
        <View style={styles.centerBox}>
          <Text style={styles.centerTitle}>Not available yet</Text>
          <Text style={styles.centerText}>
            {kind === 'study-material'
              ? 'Study material for this chapter is not available yet.'
              : 'Questions for this chapter are not available yet.'}
          </Text>
          <Pressable style={styles.retryButton} onPress={load} accessibilityRole="button">
            <Text style={styles.retryText}>Try again</Text>
          </Pressable>
        </View>
      ) : kind === 'practice-questions' ? (
        questions.length === 0 ? (
          <View style={styles.centerBox}>
            <Text style={styles.centerText}>No questions are available in this set.</Text>
          </View>
        ) : (
          <>
            <Text style={styles.countText}>{questions.length} questions</Text>
            {questions.map((question, i) => (
              <QuestionCard key={question.id || `${question.questionNumber || i}-${i}`} question={question} index={i} />
            ))}
          </>
        )
      ) : (
        chapterSections(data || {}).map((section, i) => <SectionView key={i} section={section} index={i} />)
      )}
    </ScrollView>
  );
}

// ── Subjects, units and chapters ──────────────────────────────────────────────

function SubjectBrowser({ kind, scope }: { kind: EducationKind; scope: StudentScope }) {
  const [subjects, setSubjects] = useState<SyllabusSubject[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');
  const [subject, setSubject] = useState<SyllabusSubject | null>(null);
  const [openUnit, setOpenUnit] = useState<string | null>(null);
  const [reading, setReading] = useState<OpenChapter | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const list = await fetchSyllabus(kind, scope);
      setSubjects([...list].sort((a, b) => a.subject_name.localeCompare(b.subject_name)));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not load the subjects.');
    } finally {
      setLoading(false);
    }
  }, [kind, scope]);

  useEffect(() => {
    load();
  }, [load]);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return q ? subjects.filter(s => s.subject_name.toLowerCase().includes(q)) : subjects;
  }, [subjects, search]);

  if (reading) {
    return <ChapterReader kind={kind} scope={scope} open={reading} onBack={() => setReading(null)} />;
  }

  if (subject) {
    return (
      <ScrollView contentContainerStyle={styles.readerContent} showsVerticalScrollIndicator={false}>
        <Pressable onPress={() => setSubject(null)} hitSlop={8} accessibilityRole="button">
          <Text style={styles.backLink}>‹ Back to subjects</Text>
        </Pressable>
        <Text style={styles.readerTitle}>{subject.subject_name}</Text>
        <Text style={styles.readerSubject}>{scopeLine(scope)}</Text>
        <View style={{ marginTop: 14 }}>
          {(subject.units || []).map(unit => {
            const key = String(unit.unit_number);
            const isOpen = openUnit === key;
            return (
              <View key={key} style={styles.unitCard}>
                <Pressable
                  style={styles.unitHeader}
                  onPress={() => setOpenUnit(isOpen ? null : key)}
                  accessibilityRole="button"
                  accessibilityState={{ expanded: isOpen }}>
                  <Text style={styles.unitTitle}>
                    Unit {unit.unit_number}: {unit.unit_name}
                  </Text>
                  <Text style={styles.chevron}>{isOpen ? '⌃' : '⌄'}</Text>
                </Pressable>
                {isOpen &&
                  (unit.chapters || []).map(chapter => (
                    <Pressable
                      key={String(chapter.chapter_number)}
                      style={styles.chapterRow}
                      onPress={() => setReading({ subject, unit, chapter })}
                      accessibilityRole="button">
                      <Text style={styles.chapterText}>
                        Chapter {chapter.chapter_number}: {chapter.chapter_name}
                      </Text>
                      <Text style={styles.chevron}>›</Text>
                    </Pressable>
                  ))}
              </View>
            );
          })}
        </View>
      </ScrollView>
    );
  }

  return (
    <View style={{ flex: 1 }}>
      <View style={styles.listTop}>
        <View style={styles.infoRow}>
          {[scope.standard ? `Class ${scope.standard}` : '', scope.board, scope.stream].filter(Boolean).map(chip => (
            <View key={chip} style={styles.infoChip}>
              <Text style={styles.infoChipText}>{chip}</Text>
            </View>
          ))}
        </View>
        <View style={styles.searchBox}>
          <TextInput
            style={styles.searchInput}
            value={search}
            onChangeText={setSearch}
            placeholder="Search your subject here"
            placeholderTextColor="#9A96AD"
            autoCapitalize="none"
            autoCorrect={false}
          />
        </View>
      </View>

      {loading ? (
        <View style={styles.centerBox}>
          <ActivityIndicator size="large" color="#5566EB" />
        </View>
      ) : error ? (
        <View style={styles.centerBox}>
          <Text style={styles.centerTitle}>Couldn't load the subjects</Text>
          <Text style={styles.centerText}>{error}</Text>
          <Pressable style={styles.retryButton} onPress={load} accessibilityRole="button">
            <Text style={styles.retryText}>Try again</Text>
          </Pressable>
        </View>
      ) : (
        <FlatList
          data={filtered}
          keyExtractor={(s, i) => s._id || s.subject_code || String(i)}
          contentContainerStyle={styles.subjectList}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
          ListEmptyComponent={
            <View style={styles.centerBox}>
              <Text style={styles.centerTitle}>{search ? 'No subjects found' : 'No subjects yet'}</Text>
              <Text style={styles.centerText}>
                {search
                  ? `Nothing matches "${search}".`
                  : `There is no syllabus available for ${scopeLine(scope) || 'your class'} yet.`}
              </Text>
            </View>
          }
          renderItem={({ item, index }) => (
            <Pressable
              style={styles.subjectCard}
              onPress={() => {
                setOpenUnit(null);
                setSubject(item);
              }}
              accessibilityRole="button">
              <Text style={styles.subjectText}>
                {index + 1}. {item.subject_name}
              </Text>
              <Text style={styles.chevron}>›</Text>
            </Pressable>
          )}
        />
      )}
    </View>
  );
}

// ── Education ─────────────────────────────────────────────────────────────────

export default function EducationView({ token }: Props) {
  const [tab, setTab] = useState<Tab>('study-material');
  const [scope, setScope] = useState<StudentScope | null>(null);
  const [scopeError, setScopeError] = useState('');

  const loadScope = useCallback(async () => {
    setScopeError('');
    try {
      const result = await fetchStudentScope(token);
      setScope(result);
    } catch (err) {
      setScopeError(err instanceof Error ? err.message : 'Could not load your profile.');
    }
  }, [token]);

  useEffect(() => {
    loadScope();
  }, [loadScope]);

  const renderBody = () => {
    if (tab === 'study-abroad') {
      return (
        <View style={styles.soonWrap}>
          <View style={styles.soonCard}>
            <Text style={styles.soonEmoji}>🚧</Text>
            <Text style={styles.soonTitle}>Study Abroad</Text>
            <Text style={styles.soonText}>This section is coming soon to the app.</Text>
          </View>
        </View>
      );
    }
    if (scopeError) {
      return (
        <View style={styles.centerBox}>
          <Text style={styles.centerTitle}>Couldn't load your profile</Text>
          <Text style={styles.centerText}>{scopeError}</Text>
          <Pressable style={styles.retryButton} onPress={loadScope} accessibilityRole="button">
            <Text style={styles.retryText}>Try again</Text>
          </Pressable>
        </View>
      );
    }
    if (!scope) {
      return (
        <View style={styles.centerBox}>
          <ActivityIndicator size="large" color="#5566EB" />
        </View>
      );
    }
    if (!scope.board || !scope.standard) {
      return (
        <View style={styles.centerBox}>
          <Text style={styles.centerTitle}>Add your class and board</Text>
          <Text style={styles.centerText}>
            Your class or board is missing from your profile, so the subjects cannot be shown yet.
          </Text>
        </View>
      );
    }
    // A new key restarts the browser when the tab changes.
    return <SubjectBrowser key={tab} kind={tab} scope={scope} />;
  };

  return (
    <View style={{ flex: 1 }}>
      <View style={styles.header}>
        <Text style={styles.title}>Education</Text>
      </View>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={styles.tabsScroll}
        contentContainerStyle={styles.tabs}>
        {TABS.map(item => {
          const on = item.key === tab;
          return (
            <Pressable
              key={item.key}
              style={[styles.tab, on && styles.tabOn]}
              onPress={() => setTab(item.key)}
              accessibilityRole="tab"
              accessibilityState={{ selected: on }}>
              <Text style={[styles.tabText, on && styles.tabTextOn]}>{item.label}</Text>
            </Pressable>
          );
        })}
      </ScrollView>
      <View style={{ flex: 1 }}>{renderBody()}</View>
    </View>
  );
}

const styles = StyleSheet.create({
  header: { paddingHorizontal: 16, paddingTop: 18 },
  title: { fontSize: 22, fontWeight: '800', color: '#16142F' },
  tabsScroll: { flexGrow: 0 },
  tabs: { paddingHorizontal: 16, paddingVertical: 12, gap: 10 },
  tab: {
    height: 40,
    paddingHorizontal: 18,
    borderRadius: 20,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#DADCF0',
    alignItems: 'center',
    justifyContent: 'center',
  },
  tabOn: { backgroundColor: '#5566EB', borderColor: '#5566EB' },
  tabText: { fontSize: 13, fontWeight: '700', color: '#3D3A57' },
  tabTextOn: { color: '#FFFFFF' },

  listTop: { paddingHorizontal: 16 },
  infoRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  infoChip: {
    backgroundColor: '#EEF0FF',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#D9DCFA',
    paddingHorizontal: 12,
    paddingVertical: 5,
  },
  infoChipText: { fontSize: 12, fontWeight: '700', color: '#3F4BC4' },
  searchBox: {
    marginTop: 12,
    marginBottom: 12,
    height: 46,
    borderRadius: 14,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E5E6F2',
    paddingHorizontal: 14,
    justifyContent: 'center',
  },
  searchInput: { fontSize: 14, color: '#16142F', paddingVertical: 0 },

  subjectList: { paddingHorizontal: 16, paddingBottom: 24 },
  subjectCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#E5E6F2',
    paddingVertical: 17,
    paddingHorizontal: 16,
    marginBottom: 10,
  },
  subjectText: { flex: 1, fontSize: 15, fontWeight: '700', color: '#16142F', paddingRight: 8 },
  chevron: { fontSize: 18, color: '#726C8E' },

  unitCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#E5E6F2',
    marginBottom: 10,
    overflow: 'hidden',
  },
  unitHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 16,
    paddingHorizontal: 16,
  },
  unitTitle: { flex: 1, fontSize: 14, fontWeight: '700', color: '#16142F', paddingRight: 8 },
  chapterRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderTopWidth: 1,
    borderTopColor: '#ECEDF8',
    backgroundColor: '#FBFBFF',
  },
  chapterText: { flex: 1, fontSize: 13.5, color: '#3D3A57', paddingRight: 8 },

  readerContent: { paddingHorizontal: 16, paddingTop: 6, paddingBottom: 32 },
  backLink: { fontSize: 15, fontWeight: '700', color: '#5566EB', marginBottom: 12 },
  readerSubject: { fontSize: 12.5, color: '#726C8E', marginTop: 4 },
  readerTitle: { fontSize: 20, fontWeight: '800', color: '#16142F', lineHeight: 26 },
  countText: { marginTop: 14, fontSize: 12.5, color: '#726C8E' },

  segment: {
    marginTop: 14,
    flexDirection: 'row',
    backgroundColor: '#ECEEFF',
    borderRadius: 14,
    padding: 4,
  },
  segmentItem: { flex: 1, height: 38, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
  segmentItemOn: { backgroundColor: '#5566EB' },
  segmentText: { fontSize: 13, fontWeight: '700', color: '#3F4BC4' },
  segmentTextOn: { color: '#FFFFFF' },

  // Study material blocks
  section: { marginTop: 22 },
  sectionTitle: { fontSize: 18, fontWeight: '800', color: '#16142F', marginBottom: 6 },
  subSection: { marginTop: 14, paddingLeft: 10, borderLeftWidth: 2, borderLeftColor: '#DDE3FF' },
  subSectionTitle: { fontSize: 15, fontWeight: '800', color: '#3F4BC4', marginBottom: 4 },
  inlineHeading: { marginTop: 12, fontSize: 15, fontWeight: '800', color: '#16142F' },
  paragraph: { marginTop: 8, fontSize: 14.5, lineHeight: 23, color: '#2E2B47' },
  bold: { fontWeight: '800', color: '#16142F' },
  listWrap: { marginTop: 6 },
  listRow: { flexDirection: 'row', marginTop: 6, paddingRight: 8 },
  listMark: { width: 22, fontSize: 14.5, color: '#5566EB', fontWeight: '700' },
  listText: { flex: 1, fontSize: 14.5, lineHeight: 22, color: '#2E2B47' },
  formulaBox: {
    marginTop: 10,
    backgroundColor: '#F3F4FF',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#DDE3FF',
    padding: 14,
  },
  formulaTitle: { fontSize: 12.5, fontWeight: '800', color: '#3F4BC4', marginBottom: 4 },
  formulaText: { fontSize: 15, fontWeight: '700', color: '#16142F', fontFamily: 'monospace' },
  formulaDesc: { marginTop: 6, fontSize: 13, color: '#726C8E' },
  table: { borderWidth: 1, borderColor: '#E5E6F2', borderRadius: 10, overflow: 'hidden', marginTop: 6 },
  tableRow: { flexDirection: 'row' },
  tableHead: { backgroundColor: '#ECEEFF' },
  tableCell: {
    minWidth: 110,
    maxWidth: 220,
    padding: 10,
    fontSize: 13,
    color: '#2E2B47',
    borderRightWidth: 1,
    borderBottomWidth: 1,
    borderColor: '#E5E6F2',
  },
  tableHeadText: { fontWeight: '800', color: '#16142F' },
  callout: {
    marginTop: 10,
    backgroundColor: '#EEF4FF',
    borderLeftWidth: 4,
    borderLeftColor: '#5566EB',
    borderRadius: 10,
    padding: 12,
  },
  calloutWarning: { backgroundColor: '#FFF6E5', borderLeftColor: '#E29A0D' },
  calloutTitle: { fontSize: 12.5, fontWeight: '800', color: '#16142F' },
  calloutText: { marginTop: 4, fontSize: 14, lineHeight: 21, color: '#2E2B47' },
  exampleCard: {
    marginTop: 12,
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#E5E6F2',
    padding: 14,
  },
  exampleTitle: { fontSize: 15, fontWeight: '800', color: '#16142F' },
  figure: { marginTop: 12, alignItems: 'center' },
  figureImage: { width: '100%', height: 220, backgroundColor: '#FFFFFF', borderRadius: 12 },
  caption: { marginTop: 6, fontSize: 12.5, color: '#726C8E', textAlign: 'center' },

  // Practice questions
  qCard: {
    marginTop: 14,
    backgroundColor: '#FFFFFF',
    borderRadius: 18,
    borderWidth: 1,
    borderColor: '#E5E6F2',
    padding: 16,
  },
  qHeading: { flexDirection: 'row', gap: 12 },
  qNumber: {
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: '#5566EB',
    alignItems: 'center',
    justifyContent: 'center',
  },
  qNumberText: { color: '#FFFFFF', fontSize: 13, fontWeight: '800' },
  qText: { flex: 1, fontSize: 15, lineHeight: 22, fontWeight: '700', color: '#16142F' },
  chipRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginTop: 10 },
  qChip: { backgroundColor: '#F1F2FA', borderRadius: 10, paddingHorizontal: 9, paddingVertical: 3 },
  qChipText: { fontSize: 11, color: '#726C8E' },
  optionRow: { flexDirection: 'row', marginTop: 6 },
  optionLetter: { width: 24, fontSize: 14, fontWeight: '800', color: '#5566EB' },
  optionText: { flex: 1, fontSize: 14, lineHeight: 21, color: '#2E2B47' },
  answerToggle: {
    marginTop: 14,
    height: 38,
    borderRadius: 19,
    borderWidth: 1,
    borderColor: '#5566EB',
    alignItems: 'center',
    justifyContent: 'center',
  },
  answerToggleText: { fontSize: 13, fontWeight: '700', color: '#3F4BC4' },
  answerBlock: { marginTop: 10, backgroundColor: '#F5F6FF', borderRadius: 12, padding: 12 },
  answerMain: { backgroundColor: '#ECFDF5' },
  answerHeading: { fontSize: 12.5, fontWeight: '800', color: '#16142F', marginBottom: 4 },
  answerText: { fontSize: 14, lineHeight: 21, color: '#2E2B47' },

  // States
  centerBox: { alignItems: 'center', paddingVertical: 40, paddingHorizontal: 24 },
  centerTitle: { fontSize: 16, fontWeight: '700', color: '#16142F', marginBottom: 6, textAlign: 'center' },
  centerText: { fontSize: 14, color: '#726C8E', textAlign: 'center', marginTop: 8, lineHeight: 21 },
  retryButton: { marginTop: 16, backgroundColor: '#5566EB', borderRadius: 14, paddingHorizontal: 22, paddingVertical: 11 },
  retryText: { color: '#FFFFFF', fontWeight: '700', fontSize: 14 },
  soonWrap: { flex: 1, padding: 18, justifyContent: 'center' },
  soonCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 22,
    padding: 28,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#ECEDF8',
  },
  soonEmoji: { fontSize: 40 },
  soonTitle: { marginTop: 12, fontSize: 20, fontWeight: '800', color: '#16142F' },
  soonText: { marginTop: 6, fontSize: 14, color: '#726C8E', textAlign: 'center' },
});