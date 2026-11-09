import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  FlatList,
  Linking,
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import LinearGradient from 'react-native-linear-gradient';

import {
  ARTHUM_TEMPLATES,
  addUserWidget,
  builderUrl,
  deleteAgent,
  fetchAgents,
  fetchAllWidgets,
  fetchStudyContent,
  fetchUserWidgetNames,
  removeUserWidget,
  runStudyOnce,
  studyContentAvailable,
  studyPdfUrl,
  type AgentSummary,
  type DbWidget,
  type StudyContentType,
  type StudyDoc,
} from '../../services/myAiApi';

type Props = {
  userEmail: string;
  token: string;
};

type Section = 'content' | 'mywidgets' | 'agents' | 'library';

const SECTIONS: { key: Section; label: string }[] = [
  { key: 'content', label: 'Ready Content' },
  { key: 'mywidgets', label: 'My Widgets' },
  { key: 'agents', label: 'Agents' },
  { key: 'library', label: 'Widgets Library' },
];

const CONTENT_META: Record<StudyContentType, { label: string; color: string; bg: string }> = {
  chapter_summary: { label: 'Chapter Summary', color: '#4338ca', bg: '#eef2ff' },
  mcq_test: { label: 'MCQ Test', color: '#059669', bg: '#ecfdf5' },
  short_notes: { label: 'Short Notes', color: '#d97706', bg: '#fffbeb' },
  practice_questions: { label: 'Practice Questions', color: '#9d174d', bg: '#fdf2f8' },
};

const openLink = (url: string) => {
  Linking.openURL(url).catch(() => {
    Alert.alert('Unable to open', 'This link could not be opened.');
  });
};

// ── Small shared pieces ───────────────────────────────────────────────────────

function GradientButton({
  title,
  onPress,
  disabled,
  style,
}: {
  title: string;
  onPress: () => void;
  disabled?: boolean;
  style?: object;
}) {
  return (
    <Pressable onPress={onPress} disabled={disabled} accessibilityRole="button" style={[{ opacity: disabled ? 0.6 : 1 }, style]}>
      <LinearGradient colors={['#4452D6', '#7C8CFF']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={styles.gradientButton}>
        <Text style={styles.gradientButtonText}>{title}</Text>
      </LinearGradient>
    </Pressable>
  );
}

function EmptyCard({
  title,
  text,
  action,
  onAction,
}: {
  title: string;
  text: string;
  action?: string;
  onAction?: () => void;
}) {
  return (
    <View style={styles.emptyCard}>
      <View style={styles.emptyIcon} />
      <Text style={styles.emptyTitle}>{title}</Text>
      <Text style={styles.emptyText}>{text}</Text>
      {!!action && !!onAction && (
        <GradientButton title={action} onPress={onAction} style={{ alignSelf: 'stretch', marginTop: 16 }} />
      )}
    </View>
  );
}

function ErrorCard({ message, onRetry }: { message: string; onRetry: () => void }) {
  return (
    <View style={styles.errorCard}>
      <Text style={styles.errorText}>{message}</Text>
      <Pressable style={styles.errorRetry} onPress={onRetry} accessibilityRole="button">
        <Text style={styles.errorRetryText}>Retry</Text>
      </Pressable>
    </View>
  );
}

// ── Ready Content ─────────────────────────────────────────────────────────────

function ReadyContent({ userEmail }: { userEmail: string }) {
  const [docs, setDocs] = useState<StudyDoc[]>([]);
  const [loading, setLoading] = useState(studyContentAvailable);
  const [error, setError] = useState('');
  const [generating, setGenerating] = useState(false);
  const [notice, setNotice] = useState('');

  const load = useCallback(async () => {
    if (!studyContentAvailable) {
      return;
    }
    setLoading(true);
    setError('');
    try {
      setDocs(await fetchStudyContent(userEmail));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch');
    } finally {
      setLoading(false);
    }
  }, [userEmail]);

  useEffect(() => {
    load();
  }, [load]);

  const handleGenerate = async () => {
    setGenerating(true);
    setNotice('');
    try {
      await runStudyOnce(userEmail);
      setNotice('Content job queued. It will appear here shortly.');
      setTimeout(load, 6000);
    } catch (err) {
      setNotice(err instanceof Error ? err.message : 'Could not start the job.');
    } finally {
      setGenerating(false);
    }
  };

  return (
    <ScrollView contentContainerStyle={styles.sectionContent} showsVerticalScrollIndicator={false}>
      <View style={styles.eyebrowChip}>
        <Text style={styles.eyebrowChipText}>PERPLEXITY SONAR-PRO · DAILY AI CONTENT</Text>
      </View>
      <Text style={styles.sectionTitle}>Ready Content</Text>
      <Text style={styles.sectionSub}>
        AI-generated study material personalised to your syllabus and timetable. Download each piece as a PDF.
      </Text>

      <GradientButton
        title={generating ? 'Generating...' : 'Generate Now'}
        onPress={handleGenerate}
        disabled={generating || !studyContentAvailable}
        style={{ marginTop: 14 }}
      />
      {!!notice && <Text style={styles.noticeText}>{notice}</Text>}

      <View style={{ marginTop: 6 }}>
        {!studyContentAvailable ? (
          <EmptyCard
            title="Not available yet"
            text="Ready Content will appear here once the content service is connected."
          />
        ) : loading ? (
          <View style={styles.centerBox}>
            <ActivityIndicator size="large" color="#5566EB" />
          </View>
        ) : error ? (
          <ErrorCard message={error} onRetry={load} />
        ) : docs.length === 0 ? (
          <EmptyCard
            title="No content yet"
            text='Tap "Generate Now" to get your first AI-generated study material.'
          />
        ) : (
          docs.map(doc => {
            const meta = CONTENT_META[doc.contentType] ?? CONTENT_META.chapter_summary;
            const title = doc.title || doc.chapterName || doc.subjectName || 'Study content';
            const sub = [doc.subjectName, doc.unitName, new Date(doc.createdAt).toLocaleDateString()]
              .filter(Boolean)
              .join(' · ');
            return (
              <View key={doc._id} style={styles.card}>
                <View style={[styles.typeChip, { backgroundColor: meta.bg }]}>
                  <Text style={[styles.typeChipText, { color: meta.color }]}>{meta.label}</Text>
                </View>
                <Text style={styles.cardTitle}>{title}</Text>
                <Text style={styles.cardSub}>{sub}</Text>
                <Pressable
                  style={styles.outlineButton}
                  onPress={() => openLink(studyPdfUrl(doc._id))}
                  accessibilityRole="button">
                  <Text style={styles.outlineButtonText}>Download PDF</Text>
                </Pressable>
              </View>
            );
          })
        )}
      </View>
    </ScrollView>
  );
}

// ── My Widgets ────────────────────────────────────────────────────────────────

function WidgetIcon({ name, size = 44 }: { name: string; size?: number }) {
  return (
    <View style={[styles.widgetIcon, { width: size, height: size, borderRadius: size * 0.3 }]}>
      <Text style={[styles.widgetIconText, { fontSize: size * 0.42 }]}>{name.charAt(0).toUpperCase()}</Text>
    </View>
  );
}

function MyWidgets({
  loading,
  error,
  owned,
  onRemove,
  onBrowse,
  onRetry,
}: {
  loading: boolean;
  error: string;
  owned: DbWidget[];
  onRemove: (name: string) => void;
  onBrowse: () => void;
  onRetry: () => void;
}) {
  return (
    <ScrollView contentContainerStyle={styles.sectionContent} showsVerticalScrollIndicator={false}>
      <Text style={styles.sectionTitle}>My Widgets</Text>
      <Text style={styles.sectionSub}>Your personal collection. Tap a widget to launch it.</Text>
      <GradientButton title="+ Browse Library" onPress={onBrowse} style={{ marginTop: 14 }} />

      <View style={{ marginTop: 18 }}>
        {loading ? (
          <View style={styles.centerBox}>
            <ActivityIndicator size="large" color="#5566EB" />
          </View>
        ) : error ? (
          <ErrorCard message={error} onRetry={onRetry} />
        ) : owned.length === 0 ? (
          <EmptyCard
            title="No widgets yet"
            text="Head to the Widgets Library to find and add widgets."
            action="Browse Widgets Library"
            onAction={onBrowse}
          />
        ) : (
          <View style={styles.widgetGrid}>
            {owned.map(widget => (
              <Pressable
                key={widget.widgetName}
                style={styles.widgetTile}
                onPress={() => Alert.alert('Coming soon', 'Launching widgets will be available in the app soon.')}
                accessibilityRole="button">
                <Pressable
                  style={styles.widgetRemove}
                  onPress={() =>
                    Alert.alert('Remove widget', `Remove "${widget.widgetName}" from My Widgets?`, [
                      { text: 'Cancel', style: 'cancel' },
                      { text: 'Remove', style: 'destructive', onPress: () => onRemove(widget.widgetName) },
                    ])
                  }
                  hitSlop={8}
                  accessibilityLabel={`Remove ${widget.widgetName}`}>
                  <Text style={styles.widgetRemoveText}>✕</Text>
                </Pressable>
                <WidgetIcon name={widget.widgetName} />
                <Text style={styles.widgetName} numberOfLines={2}>
                  {widget.widgetName}
                </Text>
              </Pressable>
            ))}
          </View>
        )}
      </View>
    </ScrollView>
  );
}

// ── Agents ────────────────────────────────────────────────────────────────────

function Agents({ token }: { token: string }) {
  const [agents, setAgents] = useState<AgentSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [deletingId, setDeletingId] = useState('');

  const load = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      setAgents(await fetchAgents(token));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not load your agents.');
    } finally {
      setLoading(false);
    }
  }, [token]);

  useEffect(() => {
    load();
  }, [load]);

  const confirmDelete = (agent: AgentSummary) => {
    Alert.alert('Delete agent', `Delete "${agent.name}"? This cannot be undone.`, [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: async () => {
          setDeletingId(agent._id);
          try {
            await deleteAgent(token, agent._id);
            setAgents(current => current.filter(a => a._id !== agent._id));
          } catch (err) {
            Alert.alert('Could not delete', err instanceof Error ? err.message : 'Please try again.');
          } finally {
            setDeletingId('');
          }
        },
      },
    ]);
  };

  return (
    <ScrollView contentContainerStyle={styles.sectionContent} showsVerticalScrollIndicator={false}>
      <Text style={styles.kicker}>ARTHUM AGENT BUILDER</Text>
      <Text style={styles.sectionTitle}>AI Agents</Text>
      <Text style={styles.sectionSub}>Build agents with AI, from a template or on a canvas.</Text>

      <GradientButton title="+ Create Agent" onPress={() => openLink(builderUrl())} style={{ marginTop: 14 }} />

      <View style={[styles.card, styles.buildRow]}>
        <View style={{ flex: 1 }}>
          <Text style={styles.cardTitleSmall}>Build with AI</Text>
          <Text style={styles.cardSub}>Describe what you want, then edit it before publishing.</Text>
        </View>
        <Pressable style={styles.smallOutline} onPress={() => openLink(builderUrl())} accessibilityRole="button">
          <Text style={styles.smallOutlineText}>Open builder</Text>
        </Pressable>
      </View>

      <View style={styles.rowBetween}>
        <Text style={styles.subHeading}>My Agents</Text>
        <Pressable onPress={load} hitSlop={8} accessibilityRole="button">
          <Text style={styles.linkText}>Refresh</Text>
        </Pressable>
      </View>

      <View style={{ marginTop: 10 }}>
        {loading ? (
          <View style={styles.centerBox}>
            <ActivityIndicator color="#5566EB" />
          </View>
        ) : error ? (
          <ErrorCard message={error} onRetry={load} />
        ) : agents.length === 0 ? (
          <View style={styles.dashedCard}>
            <Text style={styles.emptyTitle}>No custom agents yet</Text>
            <Text style={styles.emptyText}>Start from a blank canvas, describe one with AI, or use a template below.</Text>
            <Pressable style={styles.solidButton} onPress={() => openLink(builderUrl())} accessibilityRole="button">
              <Text style={styles.solidButtonText}>Create your first agent</Text>
            </Pressable>
          </View>
        ) : (
          agents.map(agent => (
            <View key={agent._id} style={[styles.card, { marginTop: 0, marginBottom: 12 }]}>
              <View style={styles.agentTop}>
                <View style={styles.statusChip}>
                  <Text style={styles.statusChipText}>{agent.status || 'draft'}</Text>
                </View>
                <Text style={styles.cardSub}>v{agent.version || 1}</Text>
              </View>
              <Text style={styles.cardTitle}>{agent.name}</Text>
              <Text style={styles.cardSub}>{agent.description || 'Custom Arthum AI agent.'}</Text>
              <Text style={[styles.cardSub, { marginTop: 6 }]}>
                {agent.updatedAt
                  ? `Updated ${new Date(agent.updatedAt).toLocaleDateString()}`
                  : 'Not published yet'}
              </Text>
              <View style={styles.agentActions}>
                <Pressable
                  style={styles.smallOutline}
                  onPress={() => openLink(builderUrl({ agentId: agent._id }))}
                  accessibilityRole="button">
                  <Text style={styles.smallOutlineText}>Edit</Text>
                </Pressable>
                <Pressable
                  style={styles.dangerLink}
                  onPress={() => confirmDelete(agent)}
                  disabled={deletingId === agent._id}
                  accessibilityRole="button">
                  <Text style={styles.dangerLinkText}>{deletingId === agent._id ? 'Deleting...' : 'Delete'}</Text>
                </Pressable>
              </View>
            </View>
          ))
        )}
      </View>

      <Text style={[styles.subHeading, { marginTop: 18 }]}>Arthum Templates</Text>
      {ARTHUM_TEMPLATES.map(template => (
        <View key={template.id} style={styles.card}>
          <View style={styles.templateTop}>
            <WidgetIcon name={template.name} size={40} />
            <View style={{ flex: 1 }}>
              <Text style={styles.kickerSmall}>BUILT BY ARTHUM</Text>
              <Text style={styles.cardTitleSmall}>{template.name}</Text>
            </View>
          </View>
          <Text style={[styles.cardSub, { marginTop: 10 }]}>{template.description}</Text>
          <Pressable
            style={styles.templateButton}
            onPress={() => openLink(builderUrl({ template: template.id }))}
            accessibilityRole="button">
            <Text style={styles.templateButtonText}>Use template</Text>
          </Pressable>
        </View>
      ))}
    </ScrollView>
  );
}

// ── Widgets Library ───────────────────────────────────────────────────────────

function Library({
  loading,
  error,
  widgets,
  ownedNames,
  onAdd,
  onRetry,
}: {
  loading: boolean;
  error: string;
  widgets: DbWidget[];
  ownedNames: string[];
  onAdd: (name: string) => Promise<void>;
  onRetry: () => void;
}) {
  const [search, setSearch] = useState('');
  const [preview, setPreview] = useState<DbWidget | null>(null);
  const [adding, setAdding] = useState(false);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return q ? widgets.filter(w => w.widgetName.toLowerCase().includes(q)) : widgets;
  }, [widgets, search]);

  const countText =
    filtered.length === widgets.length
      ? `${widgets.length} widgets available`
      : `${filtered.length} of ${widgets.length} widgets`;

  const handleAdd = async () => {
    if (!preview || adding) {
      return;
    }
    setAdding(true);
    try {
      await onAdd(preview.widgetName);
      setPreview(null);
    } finally {
      setAdding(false);
    }
  };

  const previewOwned = !!preview && ownedNames.includes(preview.widgetName);

  return (
    <View style={{ flex: 1 }}>
      <View style={styles.libraryTop}>
        <Text style={styles.sectionTitle}>Widgets Library</Text>
        <Text style={styles.sectionSub}>Browse all widgets. Tap one to preview and add it.</Text>
        <View style={styles.searchBox}>
          <TextInput
            style={styles.searchInput}
            value={search}
            onChangeText={setSearch}
            placeholder="Search widgets by name..."
            placeholderTextColor="#9A96AD"
            autoCapitalize="none"
            autoCorrect={false}
            returnKeyType="search"
          />
          {!!search && (
            <Pressable onPress={() => setSearch('')} hitSlop={8} accessibilityLabel="Clear search">
              <Text style={styles.searchClear}>✕</Text>
            </Pressable>
          )}
        </View>
        {!loading && !error && <Text style={styles.countText}>{countText}</Text>}
      </View>

      {loading ? (
        <View style={styles.centerBox}>
          <ActivityIndicator size="large" color="#5566EB" />
        </View>
      ) : error ? (
        <View style={{ paddingHorizontal: 16 }}>
          <ErrorCard message={error} onRetry={onRetry} />
        </View>
      ) : (
        <FlatList
          data={filtered}
          keyExtractor={w => w._id || w.widgetName}
          numColumns={2}
          columnWrapperStyle={styles.libraryRow}
          contentContainerStyle={styles.libraryList}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
          initialNumToRender={10}
          ListEmptyComponent={
            widgets.length === 0 ? (
              <EmptyCard
                title="No widgets available yet"
                text="The server has no widgets to show right now. Pull the data in, then tap Retry."
                action="Retry"
                onAction={onRetry}
              />
            ) : (
              <View style={styles.centerBox}>
                <Text style={styles.emptyTitle}>No widgets found</Text>
                <Text style={styles.emptyText}>Nothing matches "{search}".</Text>
              </View>
            )
          }
          renderItem={({ item }) => {
            const owned = ownedNames.includes(item.widgetName);
            return (
              <Pressable
                style={[styles.libraryTile, owned && styles.libraryTileOwned]}
                onPress={() => setPreview(item)}
                accessibilityRole="button">
                <WidgetIcon name={item.widgetName} />
                <Text style={styles.widgetName} numberOfLines={2}>
                  {item.widgetName}
                </Text>
                {!!item.visitCategory && (
                  <View style={styles.categoryChip}>
                    <Text style={styles.categoryChipText} numberOfLines={1}>
                      {item.visitCategory}
                    </Text>
                  </View>
                )}
                {owned && <Text style={styles.addedBadge}>✓ Added</Text>}
              </Pressable>
            );
          }}
        />
      )}

      <Modal visible={!!preview} transparent animationType="fade" onRequestClose={() => setPreview(null)}>
        <Pressable style={styles.modalOverlay} onPress={() => setPreview(null)}>
          <Pressable style={styles.modalCard} onPress={() => {}}>
            {!!preview && (
              <>
                <WidgetIcon name={preview.widgetName} size={60} />
                <Text style={styles.modalName}>{preview.widgetName}</Text>
                {!!preview.visitCategory && (
                  <View style={[styles.categoryChip, { marginTop: 8 }]}>
                    <Text style={styles.categoryChipText}>{preview.visitCategory}</Text>
                  </View>
                )}
                {!!preview.description && <Text style={styles.modalDesc}>{preview.description}</Text>}
                <View style={styles.modalActions}>
                  <Pressable style={styles.modalCancel} onPress={() => setPreview(null)} accessibilityRole="button">
                    <Text style={styles.modalCancelText}>Cancel</Text>
                  </Pressable>
                  <Pressable
                    style={[styles.modalAdd, (previewOwned || adding) && styles.modalAddDisabled]}
                    onPress={handleAdd}
                    disabled={previewOwned || adding}
                    accessibilityRole="button">
                    <Text style={styles.modalAddText}>
                      {previewOwned ? '✓ Added' : adding ? 'Adding...' : '+ Add to My Widgets'}
                    </Text>
                  </Pressable>
                </View>
              </>
            )}
          </Pressable>
        </Pressable>
      </Modal>
    </View>
  );
}

// ── My AI ─────────────────────────────────────────────────────────────────────

export default function MyAIView({ userEmail, token }: Props) {
  const [section, setSection] = useState<Section>('content');

  const [allWidgets, setAllWidgets] = useState<DbWidget[]>([]);
  const [ownedNames, setOwnedNames] = useState<string[]>([]);
  const [widgetsLoading, setWidgetsLoading] = useState(true);
  const [widgetsError, setWidgetsError] = useState('');

  const loadWidgets = useCallback(async () => {
    setWidgetsLoading(true);
    setWidgetsError('');
    try {
      const [all, mine] = await Promise.all([fetchAllWidgets(token), fetchUserWidgetNames(userEmail)]);
      setAllWidgets(all);
      setOwnedNames(mine);
    } catch (err) {
      setWidgetsError(err instanceof Error ? err.message : 'Could not load widgets.');
    } finally {
      setWidgetsLoading(false);
    }
  }, [userEmail, token]);

  useEffect(() => {
    loadWidgets();
  }, [loadWidgets]);

  const handleAdd = useCallback(
    async (name: string) => {
      setOwnedNames(prev => (prev.includes(name) ? prev : [...prev, name]));
      try {
        await addUserWidget(userEmail, name);
      } catch (_e) {
        setOwnedNames(prev => prev.filter(n => n !== name));
        Alert.alert('Something went wrong', 'Could not add the widget. Please try again.');
      }
    },
    [userEmail],
  );

  const handleRemove = useCallback(
    async (name: string) => {
      setOwnedNames(prev => prev.filter(n => n !== name));
      try {
        await removeUserWidget(userEmail, name);
      } catch (_e) {
        setOwnedNames(prev => (prev.includes(name) ? prev : [...prev, name]));
        Alert.alert('Something went wrong', 'Could not remove the widget. Please try again.');
      }
    },
    [userEmail],
  );

  const ownedWidgets = useMemo(
    () =>
      ownedNames
        .map(name => allWidgets.find(w => w.widgetName === name))
        .filter((w): w is DbWidget => !!w),
    [ownedNames, allWidgets],
  );

  return (
    <View style={{ flex: 1 }}>
      <View style={styles.header}>
        <Text style={styles.title}>My AI</Text>
      </View>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={styles.tabsScroll}
        contentContainerStyle={styles.tabs}>
        {SECTIONS.map(item => {
          const on = item.key === section;
          return (
            <Pressable
              key={item.key}
              style={[styles.tab, on && styles.tabOn]}
              onPress={() => setSection(item.key)}
              accessibilityRole="tab"
              accessibilityState={{ selected: on }}>
              <Text style={[styles.tabText, on && styles.tabTextOn]}>{item.label}</Text>
            </Pressable>
          );
        })}
      </ScrollView>

      <View style={{ flex: 1 }}>
        {section === 'content' && <ReadyContent userEmail={userEmail} />}
        {section === 'mywidgets' && (
          <MyWidgets
            loading={widgetsLoading}
            error={widgetsError}
            owned={ownedWidgets}
            onRemove={handleRemove}
            onBrowse={() => setSection('library')}
            onRetry={loadWidgets}
          />
        )}
        {section === 'agents' && <Agents token={token} />}
        {section === 'library' && (
          <Library
            loading={widgetsLoading}
            error={widgetsError}
            widgets={allWidgets}
            ownedNames={ownedNames}
            onAdd={handleAdd}
            onRetry={loadWidgets}
          />
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  header: { paddingHorizontal: 16, paddingTop: 18 },
  title: { fontSize: 22, fontWeight: '800', color: '#16142F' },
  tabsScroll: { flexGrow: 0 },
  tabs: { paddingHorizontal: 16, paddingVertical: 12, gap: 10 },
  tab: {
    height: 38,
    paddingHorizontal: 16,
    borderRadius: 19,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#DADCF0',
    alignItems: 'center',
    justifyContent: 'center',
  },
  tabOn: { backgroundColor: '#5566EB', borderColor: '#5566EB' },
  tabText: { fontSize: 13, fontWeight: '700', color: '#3D3A57' },
  tabTextOn: { color: '#FFFFFF' },

  sectionContent: { paddingHorizontal: 16, paddingTop: 6, paddingBottom: 24 },
  sectionTitle: { fontSize: 20, fontWeight: '800', color: '#16142F' },
  sectionSub: { marginTop: 4, fontSize: 13, lineHeight: 20, color: '#726C8E' },
  subHeading: { fontSize: 16, fontWeight: '800', color: '#16142F' },
  linkText: { fontSize: 13, fontWeight: '700', color: '#5566EB' },
  rowBetween: { marginTop: 22, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  kicker: { fontSize: 10.5, fontWeight: '800', letterSpacing: 1, color: '#4B57C8' },
  kickerSmall: { fontSize: 10, fontWeight: '800', letterSpacing: 0.8, color: '#5B4BD8' },

  eyebrowChip: {
    alignSelf: 'flex-start',
    backgroundColor: '#E7EAFF',
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 6,
    marginBottom: 10,
  },
  eyebrowChipText: { fontSize: 10.5, fontWeight: '800', letterSpacing: 0.6, color: '#4B57C8' },

  gradientButton: { height: 46, borderRadius: 23, alignItems: 'center', justifyContent: 'center' },
  gradientButtonText: { color: '#FFFFFF', fontSize: 14, fontWeight: '700' },
  noticeText: { marginTop: 10, fontSize: 13, color: '#4B57C8', textAlign: 'center' },

  card: {
    marginTop: 12,
    backgroundColor: '#FFFFFF',
    borderRadius: 18,
    borderWidth: 1,
    borderColor: '#E5E6F2',
    padding: 16,
  },
  cardTitle: { marginTop: 10, fontSize: 15, fontWeight: '700', color: '#16142F' },
  cardTitleSmall: { fontSize: 15, fontWeight: '700', color: '#16142F' },
  cardSub: { marginTop: 4, fontSize: 12.5, lineHeight: 19, color: '#726C8E' },
  typeChip: { alignSelf: 'flex-start', borderRadius: 11, paddingHorizontal: 10, paddingVertical: 4 },
  typeChipText: { fontSize: 11, fontWeight: '700' },
  outlineButton: {
    marginTop: 12,
    height: 38,
    borderRadius: 19,
    borderWidth: 1,
    borderColor: '#5566EB',
    alignItems: 'center',
    justifyContent: 'center',
  },
  outlineButtonText: { fontSize: 13, fontWeight: '700', color: '#3F4BC4' },

  centerBox: { alignItems: 'center', paddingVertical: 34, paddingHorizontal: 20 },

  emptyCard: {
    alignItems: 'center',
    borderWidth: 1.5,
    borderStyle: 'dashed',
    borderColor: '#D3D6EE',
    borderRadius: 20,
    backgroundColor: '#FBFBFF',
    paddingVertical: 26,
    paddingHorizontal: 18,
    marginTop: 12,
  },
  emptyIcon: { width: 56, height: 56, borderRadius: 16, backgroundColor: '#ECEEFF' },
  emptyTitle: { marginTop: 14, fontSize: 16, fontWeight: '800', color: '#16142F', textAlign: 'center' },
  emptyText: { marginTop: 6, fontSize: 13, lineHeight: 20, color: '#726C8E', textAlign: 'center' },

  dashedCard: {
    alignItems: 'center',
    borderWidth: 1.5,
    borderStyle: 'dashed',
    borderColor: '#D3D6EE',
    borderRadius: 20,
    backgroundColor: '#FBFBFF',
    padding: 20,
  },
  solidButton: {
    marginTop: 14,
    height: 40,
    paddingHorizontal: 22,
    borderRadius: 20,
    backgroundColor: '#5566EB',
    alignItems: 'center',
    justifyContent: 'center',
  },
  solidButtonText: { color: '#FFFFFF', fontSize: 13, fontWeight: '700' },

  errorCard: {
    marginTop: 12,
    backgroundColor: '#FCE9EE',
    borderWidth: 1,
    borderColor: '#F5C2C7',
    borderRadius: 16,
    padding: 14,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  errorText: { flex: 1, fontSize: 13, color: '#B42335' },
  errorRetry: { backgroundColor: '#FFFFFF', borderRadius: 10, paddingHorizontal: 14, paddingVertical: 8 },
  errorRetryText: { fontSize: 13, fontWeight: '700', color: '#16142F' },

  // Widgets
  widgetGrid: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between', rowGap: 12 },
  widgetTile: {
    width: '48.5%',
    backgroundColor: '#FFFFFF',
    borderRadius: 18,
    borderWidth: 1,
    borderColor: '#E5E6F2',
    paddingVertical: 18,
    paddingHorizontal: 10,
    alignItems: 'center',
  },
  widgetRemove: {
    position: 'absolute',
    top: 8,
    right: 8,
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#F1F2FA',
    alignItems: 'center',
    justifyContent: 'center',
  },
  widgetRemoveText: { fontSize: 11, color: '#726C8E' },
  widgetIcon: { backgroundColor: '#ECEEFF', alignItems: 'center', justifyContent: 'center' },
  widgetIconText: { fontWeight: '800', color: '#4452D6' },
  widgetName: { marginTop: 8, fontSize: 13, fontWeight: '700', color: '#16142F', textAlign: 'center' },

  // Agents
  buildRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  smallOutline: {
    height: 36,
    paddingHorizontal: 14,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: '#DADCF0',
    alignItems: 'center',
    justifyContent: 'center',
  },
  smallOutlineText: { fontSize: 12, fontWeight: '700', color: '#16142F' },
  agentTop: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  statusChip: { backgroundColor: '#ECEEFF', borderRadius: 10, paddingHorizontal: 10, paddingVertical: 3 },
  statusChipText: { fontSize: 11, fontWeight: '700', color: '#3F4BC4', textTransform: 'capitalize' },
  agentActions: { marginTop: 12, flexDirection: 'row', alignItems: 'center', gap: 14 },
  dangerLink: { paddingVertical: 8 },
  dangerLinkText: { fontSize: 13, fontWeight: '700', color: '#D14B5A' },
  templateTop: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  templateButton: {
    marginTop: 12,
    height: 38,
    borderRadius: 19,
    backgroundColor: '#F1F2FA',
    alignItems: 'center',
    justifyContent: 'center',
  },
  templateButtonText: { fontSize: 13, fontWeight: '700', color: '#16142F' },

  // Library
  libraryTop: { paddingHorizontal: 16, paddingTop: 6 },
  searchBox: {
    marginTop: 14,
    height: 46,
    borderRadius: 14,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E5E6F2',
    paddingHorizontal: 14,
    flexDirection: 'row',
    alignItems: 'center',
  },
  searchInput: { flex: 1, fontSize: 14, color: '#16142F', paddingVertical: 0 },
  searchClear: { fontSize: 14, color: '#726C8E', paddingLeft: 8 },
  countText: { marginTop: 12, marginBottom: 8, fontSize: 12, color: '#726C8E' },
  libraryList: { paddingHorizontal: 16, paddingBottom: 24 },
  libraryRow: { justifyContent: 'space-between', marginBottom: 12 },
  libraryTile: {
    width: '48.5%',
    backgroundColor: '#FFFFFF',
    borderRadius: 18,
    borderWidth: 1,
    borderColor: '#E5E6F2',
    paddingVertical: 16,
    paddingHorizontal: 10,
    alignItems: 'center',
  },
  libraryTileOwned: { borderColor: '#5566EB' },
  categoryChip: {
    marginTop: 6,
    alignSelf: 'center',
    maxWidth: '100%',
    backgroundColor: '#F1F2FA',
    borderRadius: 10,
    paddingHorizontal: 9,
    paddingVertical: 2,
  },
  categoryChipText: { fontSize: 11, color: '#726C8E' },
  addedBadge: { marginTop: 6, fontSize: 11, fontWeight: '700', color: '#3F4BC4' },

  // Preview popup
  modalOverlay: { flex: 1, backgroundColor: 'rgba(22,20,47,0.5)', alignItems: 'center', justifyContent: 'center', padding: 24 },
  modalCard: { width: '100%', backgroundColor: '#FFFFFF', borderRadius: 22, padding: 22, alignItems: 'center' },
  modalName: { marginTop: 12, fontSize: 18, fontWeight: '800', color: '#16142F', textAlign: 'center' },
  modalDesc: { marginTop: 12, fontSize: 13, lineHeight: 20, color: '#3D3A57', textAlign: 'center' },
  modalActions: { marginTop: 20, alignSelf: 'stretch', flexDirection: 'row', gap: 10 },
  modalCancel: {
    flex: 1,
    height: 46,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#DADCF0',
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalCancelText: { fontSize: 14, fontWeight: '700', color: '#16142F' },
  modalAdd: { flex: 2, height: 46, borderRadius: 14, backgroundColor: '#5566EB', alignItems: 'center', justifyContent: 'center' },
  modalAddDisabled: { backgroundColor: '#B9BEE8' },
  modalAddText: { fontSize: 14, fontWeight: '700', color: '#FFFFFF' },
});