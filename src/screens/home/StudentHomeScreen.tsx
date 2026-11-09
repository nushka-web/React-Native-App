import { memo, useCallback, useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  FlatList,
  Image,
  Linking,
  Modal,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import { SafeAreaView } from 'react-native-safe-area-context';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';

import type { RootStackParamList } from '../../navigation/AppNavigator';
import EducationView from './EducationView';
import MyAIView from './MyAIView';
import GenerateView from './GenerateView';
import arthumWordmark from '../../assets/images/arthum-wordmark.png';
import { setUnauthorizedHandler } from '../../services/api';
import {
  subscribeToNotifications,
  unsubscribeFromNotifications,
} from '../../services/notificationService';
import { clearSession, getSession } from '../../services/session';
import ReportsView from './reports/ReportsView';
import ConversionView from './conversion/ConversionView';
import AboutUsView from './about/AboutUsView';
import {
  fetchNewsPage,
  fetchNewsSubscription,
  reactToNews,
  reactionsAvailable,
  toggleNewsSubscription,
  type NewsItem,
} from '../../services/newsApi';

type Props = NativeStackScreenProps<RootStackParamList, 'StudentHome'>;

type Reaction = { liked: boolean; disliked: boolean; subscribed: boolean };
const NO_REACTION: Reaction = { liked: false, disliked: false, subscribed: false };

const PAGE_SIZE = 10;

// Which page is showing in the content area.
type View_ =
  | { name: 'home' }
  | { name: 'news' }
  | { name: 'profile' }
  | { name: 'education' }
  | { name: 'myai' }
  | { name: 'generate' }
  | { name: 'reports' }
  | { name: 'conversion' }
  | { name: 'about' }
  | { name: 'soon'; title: string };

// ── Content of the home page ──────────────────────────────────────────────────

const CAN_DO_TILES = [
  { icon: '📚', title: 'Smart Study Notes', desc: 'AI notes, summaries, key points' },
  { icon: '📝', title: 'Practice & Quizzes', desc: 'MCQs, worksheets, mock tests' },
  { icon: '🎯', title: 'Exam Preparation', desc: 'Revision plans, important topics' },
  { icon: '📊', title: 'Track Progress', desc: 'Scores, performance, weak areas' },
  { icon: '🤖', title: 'AI Study Assistant', desc: 'Ask doubts, get instant explanations' },
  { icon: '📅', title: 'Study Planner', desc: 'Organize subjects and study goals' },
];

type MenuEntry =
  | { kind: 'item'; label: string; sub?: string; target: View_ | 'logout' }
  | { kind: 'divider' };

const MENU: MenuEntry[] = [
  { kind: 'item', label: 'Home', target: { name: 'home' } },
  { kind: 'item', label: 'Education', sub: 'Study Material · Practice Questions · Study Abroad', target: { name: 'education' } },
  { kind: 'item', label: 'Generate', target: { name: 'generate' } },
  { kind: 'item', label: 'Conversion', sub: 'Text · Image · Audio · Video · Universal', target: { name: 'conversion' } },
  { kind: 'item', label: 'Tools', sub: 'Only the tools your role can use', target: { name: 'soon', title: 'Tools' } },
  { kind: 'item', label: 'Pricing', target: { name: 'soon', title: 'Pricing' } },
  { kind: 'item', label: 'Reports', sub: 'Balance Report · Balance History · Transaction History', target: { name: 'reports' } },
  { kind: 'item', label: 'News', target: { name: 'news' } },
  { kind: 'item', label: 'About Us', target: { name: 'about' } },
  { kind: 'divider' },
  { kind: 'item', label: 'My AI', target: { name: 'myai' } },
  { kind: 'item', label: 'Profile', target: { name: 'profile' } },
  { kind: 'item', label: 'Log out', target: 'logout' },
];

// ── News card ─────────────────────────────────────────────────────────────────

type CardProps = {
  item: NewsItem;
  reaction: Reaction;
  onLike: (item: NewsItem) => void;
  onDislike: (item: NewsItem) => void;
  onSubscribe: (item: NewsItem) => void;
  onAskExpert: () => void;
};

const NewsCard = memo(function NewsCard({
  item,
  reaction,
  onLike,
  onDislike,
  onSubscribe,
  onAskExpert,
}: CardProps) {
  const [expanded, setExpanded] = useState(false);
  const [imageFailed, setImageFailed] = useState(false);

  const openArticle = () => {
    if (!item.url) {
      return;
    }
    Linking.openURL(item.url).catch(() => {
      Alert.alert('Unable to open', 'This article could not be opened.');
    });
  };

  const dateText = item.publishedAt ? new Date(item.publishedAt).toLocaleDateString() : '';
  const likes = item.likes ?? 0;
  const dislikes = item.dislikes ?? 0;

  return (
    <View style={styles.card}>
      <View style={styles.imageWrap}>
        {item.urlToImage && !imageFailed ? (
          <Image
            source={{ uri: item.urlToImage }}
            style={styles.image}
            resizeMode="cover"
            onError={() => setImageFailed(true)}
          />
        ) : (
          <View style={styles.imageFallback}>
            <Text style={styles.imageFallbackText}>📰</Text>
          </View>
        )}
        {!!item.sourceName && (
          <View style={styles.sourceChip}>
            <Text style={styles.sourceChipText} numberOfLines={1}>
              {item.sourceName}
            </Text>
          </View>
        )}
      </View>

      <View style={styles.cardBody}>
        <Pressable onPress={openArticle} accessibilityRole="link">
          <Text style={styles.cardTitle}>{item.title}</Text>
        </Pressable>

        {!!item.description && <Text style={styles.cardDescription}>{item.description}</Text>}

        <View style={styles.metaRow}>
          <Text style={styles.dateText}>{dateText}</Text>
          <Pressable
            style={styles.insightButton}
            onPress={() => setExpanded(prev => !prev)}
            accessibilityRole="button">
            <Text style={styles.insightButtonText}>{expanded ? 'Hide insight' : 'View insight'}</Text>
          </Pressable>
        </View>

        {expanded && (
          <View style={styles.insightBox}>
            <Text style={styles.insightHeading}>Impact analysis</Text>
            <Text style={styles.insightText}>
              {item.impactDescription || 'No impact description available.'}
            </Text>
            <Text style={[styles.insightHeading, { marginTop: 12 }]}>Quick actions</Text>
            <Text style={styles.insightText}>{item.quickActions || 'No quick actions available.'}</Text>
          </View>
        )}

        <View style={styles.actionsRow}>
          {!reaction.disliked && (
            <Pressable
              style={[styles.actionBtn, reaction.liked && styles.actionBtnActive]}
              onPress={() => onLike(item)}
              accessibilityRole="button">
              <Text style={[styles.actionText, reaction.liked && styles.actionTextActive]}>
                👍 Like{likes > 0 ? ` (${likes})` : ''}
              </Text>
            </Pressable>
          )}
          {!reaction.liked && (
            <Pressable
              style={[styles.actionBtn, reaction.disliked && styles.actionBtnActive]}
              onPress={() => onDislike(item)}
              accessibilityRole="button">
              <Text style={[styles.actionText, reaction.disliked && styles.actionTextActive]}>
                👎 Dislike{dislikes > 0 ? ` (${dislikes})` : ''}
              </Text>
            </Pressable>
          )}
          <Pressable
            style={[styles.actionBtn, reaction.subscribed && styles.actionBtnActive]}
            onPress={() => onSubscribe(item)}
            accessibilityRole="button">
            <Text style={[styles.actionText, reaction.subscribed && styles.actionTextActive]}>
              {reaction.subscribed ? '🔕 Unsubscribe' : '🔔 Subscribe'}
            </Text>
          </Pressable>
          <Pressable style={[styles.actionBtn, styles.actionBtnPrimary]} onPress={onAskExpert} accessibilityRole="button">
            <Text style={[styles.actionText, styles.actionTextPrimary]}>🧠 Ask expert</Text>
          </Pressable>
        </View>
      </View>
    </View>
  );
});

// ── Screen ────────────────────────────────────────────────────────────────────

// There is no "am I subscribed?" call in notificationService, so the last known
// state is kept here while the app is open. After a restart it starts as off.
let notificationsKnownOn = false;

function StudentHomeScreen({ navigation }: Props) {
  const user = getSession().user;
  const userId = user?.id ?? '';
  const initial = (user?.name || user?.email || 'S').trim().charAt(0).toUpperCase();
  const firstName = (user?.name || '').trim().split(' ')[0] || 'there';
  const planText = (user?.userType || 'free').replace(/^./, c => c.toUpperCase());

  const [view, setView] = useState<View_>({ name: 'home' });
  const [menuOpen, setMenuOpen] = useState(false);

  const [items, setItems] = useState<NewsItem[]>([]);
  const [page, setPage] = useState(0);
  const [hasMore, setHasMore] = useState(true);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [notifOn, setNotifOn] = useState(notificationsKnownOn);
  const [notifBusy, setNotifBusy] = useState(false);
  const [notifMessage, setNotifMessage] = useState('');
  const [error, setError] = useState('');
  const [reactions, setReactions] = useState<Record<string, Reaction>>({});

  const busy = useRef(false);
  const reactionBusy = useRef<Set<string>>(new Set());
  const subscriptionLookupOff = useRef(false);

  // ── Navigation helpers ──
  const goTo = useCallback((target: View_) => {
    setMenuOpen(false);
    setView(target);
  }, []);

  const soon = useCallback((title: string) => goTo({ name: 'soon', title }), [goTo]);

  const handleLogout = useCallback(() => {
    setMenuOpen(false);
    clearSession();
    navigation.reset({ index: 0, routes: [{ name: 'Welcome' }] });
  }, [navigation]);

  // When the server says the login has expired, send the student back to the login screen.
  const sessionExpiredShown = useRef(false);
  useEffect(() => {
    setUnauthorizedHandler(() => {
      if (sessionExpiredShown.current) {
        return;
      }
      sessionExpiredShown.current = true;
      setMenuOpen(false);
      clearSession();
      Alert.alert(
        'Session expired',
        'Your login has expired. Please log in again to continue.',
        [{ text: 'Log in', onPress: () => navigation.reset({ index: 0, routes: [{ name: 'Login' }] }) }],
        { cancelable: false },
      );
    });
    return () => setUnauthorizedHandler(null);
  }, [navigation]);

  const onMenuItem = (target: View_ | 'logout') => {
    if (target === 'logout') {
      handleLogout();
    } else {
      goTo(target);
    }
  };

  // Which bottom tab is highlighted.
  const activeTab =
    view.name === 'home'
      ? 'home'
      : view.name === 'education'
        ? 'education'
        : view.name === 'generate'
          ? 'generate'
          : view.name === 'myai'
            ? 'myai'
            : 'more';

  // ── News loading ──
  const loadSubscriptions = useCallback(
    async (list: NewsItem[]) => {
      if (!userId) {
        return;
      }
      for (const item of list) {
        if (subscriptionLookupOff.current) {
          break;
        }
        try {
          const subscribed = await fetchNewsSubscription(userId, item._id);
          setReactions(prev => ({
            ...prev,
            [item._id]: { ...(prev[item._id] ?? NO_REACTION), subscribed },
          }));
        } catch (_e) {
          subscriptionLookupOff.current = true;
        }
      }
    },
    [userId],
  );

  const loadPage = useCallback(
    async (nextPage: number, mode: 'initial' | 'more' | 'refresh') => {
      if (busy.current) {
        return;
      }
      busy.current = true;
      if (mode === 'more') {
        setLoadingMore(true);
      } else if (mode === 'refresh') {
        setRefreshing(true);
      } else {
        setLoading(true);
      }
      setError('');

      try {
        const response = await fetchNewsPage(nextPage, PAGE_SIZE);
        const fresh = response.data ?? [];

        setItems(prev => {
          if (mode === 'more') {
            const seen = new Set(prev.map(i => i._id));
            return [...prev, ...fresh.filter(i => !seen.has(i._id))];
          }
          return fresh;
        });
        setPage(nextPage);
        setHasMore(response.hasMore ?? fresh.length === PAGE_SIZE);
        loadSubscriptions(fresh);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Unable to load the news right now.');
      } finally {
        busy.current = false;
        setLoading(false);
        setLoadingMore(false);
        setRefreshing(false);
      }
    },
    [loadSubscriptions],
  );

  useEffect(() => {
    loadPage(1, 'initial');
  }, [loadPage]);

  const handleEndReached = () => {
    if (hasMore && !busy.current && !error && items.length > 0) {
      loadPage(page + 1, 'more');
    }
  };

  const handleRefresh = () => {
    subscriptionLookupOff.current = false;
    loadPage(1, 'refresh');
  };

  // ── Reactions ──
  const handleReact = useCallback(
    async (item: NewsItem, kind: 'like' | 'dislike') => {
      if (!reactionsAvailable) {
        Alert.alert('Coming soon', 'Likes and dislikes will be available soon.');
        return;
      }
      if (!userId || reactionBusy.current.has(item._id)) {
        return;
      }
      reactionBusy.current.add(item._id);
      try {
        const result = await reactToNews(item._id, kind, userId);
        setItems(prev =>
          prev.map(i => (i._id === item._id ? { ...i, likes: result.likes, dislikes: result.dislikes } : i)),
        );
        setReactions(prev => ({
          ...prev,
          [item._id]: {
            ...(prev[item._id] ?? NO_REACTION),
            liked: result.userLiked,
            disliked: result.userDisliked,
          },
        }));
      } catch (_e) {
        Alert.alert('Something went wrong', 'Could not save your reaction. Please try again.');
      } finally {
        reactionBusy.current.delete(item._id);
      }
    },
    [userId],
  );

  const handleSubscribe = useCallback(
    async (item: NewsItem) => {
      if (!userId || reactionBusy.current.has(`sub-${item._id}`)) {
        return;
      }
      reactionBusy.current.add(`sub-${item._id}`);
      try {
        const subscribed = await toggleNewsSubscription(userId, item._id);
        setReactions(prev => ({
          ...prev,
          [item._id]: { ...(prev[item._id] ?? NO_REACTION), subscribed },
        }));
      } catch (_e) {
        Alert.alert('Something went wrong', 'Could not update your subscription. Please try again.');
      } finally {
        reactionBusy.current.delete(`sub-${item._id}`);
      }
    },
    [userId],
  );

  const handleLike = useCallback((item: NewsItem) => handleReact(item, 'like'), [handleReact]);
  const handleDislike = useCallback((item: NewsItem) => handleReact(item, 'dislike'), [handleReact]);
  const handleAskExpert = useCallback(() => {
    Alert.alert('Coming soon', 'Ask expert will be available soon.');
  }, []);

  const renderCard = (item: NewsItem) => (
    <NewsCard
      key={item._id}
      item={item}
      reaction={reactions[item._id] ?? NO_REACTION}
      onLike={handleLike}
      onDislike={handleDislike}
      onSubscribe={handleSubscribe}
      onAskExpert={handleAskExpert}
    />
  );

  // ── Pieces of the pages ──
  const newsStatus = () => {
    if (loading) {
      return (
        <View style={styles.centerBox}>
          <ActivityIndicator size="large" color="#5566EB" />
          <Text style={styles.centerText}>Loading news...</Text>
        </View>
      );
    }
    if (error) {
      return (
        <View style={styles.centerBox}>
          <Text style={styles.centerTitle}>Couldn't load the news</Text>
          <Text style={styles.centerText}>{error}</Text>
          <Pressable style={styles.retryButton} onPress={() => loadPage(1, 'initial')} accessibilityRole="button">
            <Text style={styles.retryText}>Try again</Text>
          </Pressable>
        </View>
      );
    }
    return (
      <View style={styles.centerBox}>
        <Text style={styles.centerTitle}>No news yet</Text>
        <Text style={styles.centerText}>Pull down to refresh.</Text>
      </View>
    );
  };

  const handleToggleNotifications = async () => {
    if (notifBusy) {
      return;
    }
    setNotifBusy(true);
    setNotifMessage('');
    try {
      if (notifOn) {
        const response = await unsubscribeFromNotifications();
        const next = response.isSubscribed ?? false;
        notificationsKnownOn = next;
        setNotifOn(next);
        setNotifMessage(response.message || 'Notifications turned off.');
      } else {
        const response = await subscribeToNotifications();
        const next = response.isSubscribed ?? true;
        notificationsKnownOn = next;
        setNotifOn(next);
        setNotifMessage(response.message || 'Notifications turned on.');
      }
    } catch (err) {
      setNotifMessage(err instanceof Error ? err.message : 'Could not update notifications. Please try again.');
    } finally {
      setNotifBusy(false);
    }
  };

  const renderHome = () => (
    <ScrollView
      contentContainerStyle={styles.homeContent}
      showsVerticalScrollIndicator={false}
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} tintColor="#5566EB" colors={['#5566EB']} />
      }>
      <View style={styles.greetingRow}>
        <View style={styles.greetingText}>
          <Text style={styles.greeting}>Hi, {firstName}</Text>
          <Text style={styles.greetingSub}>
            {user?.category || 'Student'} · {planText} plan
          </Text>
        </View>
        <Pressable
          style={[styles.bellButton, notifOn && styles.bellButtonOn]}
          onPress={handleToggleNotifications}
          disabled={notifBusy}
          accessibilityRole="button"
          accessibilityLabel={notifOn ? 'Turn notifications off' : 'Turn notifications on'}>
          {notifBusy ? (
            <ActivityIndicator size="small" color="#5566EB" />
          ) : (
            <>
              <Text style={[styles.bellIcon, !notifOn && styles.bellIconOff]}>🔔</Text>
              {notifOn && <View style={styles.bellDot} />}
            </>
          )}
        </Pressable>
      </View>
      {!!notifMessage && <Text style={styles.notifMessage}>{notifMessage}</Text>}

      <LinearGradient colors={['#4452D6', '#7C8CFF']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={styles.banner}>
        <Text style={styles.bannerEyebrow}>Today in Arthum AI</Text>
        <Text style={styles.bannerTitle}>Generate revision notes and practice questions</Text>
        <Pressable style={styles.bannerButton} onPress={() => goTo({ name: 'generate' })} accessibilityRole="button">
          <Text style={styles.bannerButtonText}>Start generating</Text>
        </Pressable>
      </LinearGradient>

      <Text style={styles.sectionLabel}>WHAT ARTHUM AI CAN DO</Text>
      <View style={styles.tileGrid}>
        {CAN_DO_TILES.map(tile => (
          <View key={tile.title} style={styles.tile}>
            <LinearGradient
              colors={['#4452D6', '#7C8CFF']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.tileIcon}>
              <Text style={styles.tileIconText}>{tile.icon}</Text>
            </LinearGradient>
            <Text style={styles.tileTitle}>{tile.title}</Text>
            <Text style={styles.tileDesc}>{tile.desc}</Text>
          </View>
        ))}
      </View>

      <View style={styles.sectionRow}>
        <Text style={styles.sectionHeading}>Recent News Highlights</Text>
        <Pressable onPress={() => goTo({ name: 'news' })} hitSlop={8} accessibilityRole="button">
          <Text style={styles.seeAll}>See all</Text>
        </Pressable>
      </View>

      {items.length === 0 ? newsStatus() : items.slice(0, 2).map(renderCard)}
    </ScrollView>
  );

  const renderNews = () => (
    <FlatList
      data={items}
      keyExtractor={item => item._id}
      renderItem={({ item }) => renderCard(item)}
      ListHeaderComponent={
        <View style={styles.newsHeader}>
          <Pressable onPress={() => goTo({ name: 'home' })} hitSlop={8} accessibilityRole="button">
            <Text style={styles.backLink}>‹ Home</Text>
          </Pressable>
          <View style={styles.badge}>
            <Text style={styles.badgeText}>Latest News</Text>
          </View>
          <Text style={styles.heading}>Recent News Highlights</Text>
          <Text style={styles.subtitle}>
            Curated headlines with quick-impact summaries and actions tailored for you.
          </Text>
        </View>
      }
      ListEmptyComponent={newsStatus}
      ListFooterComponent={
        loadingMore ? (
          <ActivityIndicator style={styles.footerLoader} color="#5566EB" />
        ) : !hasMore && items.length > 0 ? (
          <Text style={styles.endText}>You're all caught up</Text>
        ) : (
          <View style={{ height: 8 }} />
        )
      }
      onEndReached={handleEndReached}
      onEndReachedThreshold={0.6}
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} tintColor="#5566EB" colors={['#5566EB']} />
      }
      contentContainerStyle={styles.listContent}
      showsVerticalScrollIndicator={false}
      initialNumToRender={4}
      windowSize={7}
      removeClippedSubviews
    />
  );

  const renderProfile = () => (
    <ScrollView contentContainerStyle={styles.profileWrap}>
      <View style={styles.profileCard}>
        <View style={styles.profileAvatar}>
          <Text style={styles.profileAvatarText}>{initial}</Text>
        </View>
        <Text style={styles.profileName}>{user?.name || 'Student'}</Text>
        <Text style={styles.profileEmail}>{user?.email}</Text>

        <View style={styles.profileRows}>
          <ProfileRow label="Role" value={user?.category || 'Student'} />
          <ProfileRow label="Account type" value={user?.accountType || '-'} />
          <ProfileRow label="Plan" value={user?.userType || '-'} />
          <ProfileRow label="Email" value={user?.verified ? 'Verified' : 'Not verified'} />
        </View>

        <Pressable style={styles.logoutButton} onPress={handleLogout} accessibilityRole="button">
          <Text style={styles.logoutText}>Log out</Text>
        </Pressable>
      </View>
    </ScrollView>
  );

  const renderSoon = (title: string) => (
    <View style={styles.soonWrap}>
      <View style={styles.soonCard}>
        <Text style={styles.soonEmoji}>🚧</Text>
        <Text style={styles.soonTitle}>{title}</Text>
        <Text style={styles.soonText}>This section is coming soon to the app.</Text>
        <Pressable style={styles.retryButton} onPress={() => goTo({ name: 'home' })} accessibilityRole="button">
          <Text style={styles.retryText}>Back to Home</Text>
        </Pressable>
      </View>
    </View>
  );

  return (
    <SafeAreaView style={styles.screen} edges={['top', 'bottom']}>
      {/* Top bar */}
      <View style={styles.topBar}>
        <Pressable
          style={styles.menuButton}
          onPress={() => setMenuOpen(true)}
          accessibilityRole="button"
          accessibilityLabel="Open menu">
          <View style={styles.menuLine} />
          <View style={styles.menuLine} />
          <View style={styles.menuLine} />
        </Pressable>
        <Image source={arthumWordmark} style={styles.wordmark} resizeMode="contain" />
        <Pressable
          style={styles.avatar}
          onPress={() => goTo({ name: 'profile' })}
          accessibilityRole="button"
          accessibilityLabel="Open profile">
          <Text style={styles.avatarText}>{initial}</Text>
        </Pressable>
      </View>

      {/* Content */}
      <View style={{ flex: 1 }}>
        {view.name === 'home' && renderHome()}
        {view.name === 'news' && renderNews()}
        {view.name === 'profile' && renderProfile()}
        {view.name === 'education' && <EducationView token={getSession().token ?? ''} />}
        {view.name === 'myai' && <MyAIView userEmail={user?.email ?? ''} token={getSession().token ?? ''} />}
        {view.name === 'generate' && <GenerateView />}
        {view.name === 'reports' && <ReportsView onBuyCredits={() => soon('Pricing')} />}
        {view.name === 'conversion' && <ConversionView />}
        {view.name === 'about' && <AboutUsView />}
        {view.name === 'soon' && renderSoon(view.title)}
      </View>

      {/* Bottom navigation */}
      <View style={styles.bottomBar}>
        <BottomTab icon="🏠" label="Home" active={activeTab === 'home'} onPress={() => goTo({ name: 'home' })} />
        <BottomTab icon="🎓" label="Education" active={activeTab === 'education'} onPress={() => goTo({ name: 'education' })} />
        <BottomTab icon="✨" label="Generate" active={activeTab === 'generate'} onPress={() => goTo({ name: 'generate' })} />
        <BottomTab icon="🤖" label="My AI" active={activeTab === 'myai'} onPress={() => goTo({ name: 'myai' })} />
        <BottomTab icon="☰" label="More" active={activeTab === 'more'} onPress={() => setMenuOpen(true)} />
      </View>

      {/* Menu */}
      <Modal visible={menuOpen} animationType="slide" onRequestClose={() => setMenuOpen(false)}>
        <SafeAreaView style={styles.menuScreen} edges={['top', 'bottom']}>
          <View style={styles.menuTop}>
            <Image source={arthumWordmark} style={styles.wordmark} resizeMode="contain" />
            <Pressable
              style={styles.menuClose}
              onPress={() => setMenuOpen(false)}
              accessibilityRole="button"
              accessibilityLabel="Close menu">
              <Text style={styles.menuCloseText}>✕</Text>
            </Pressable>
          </View>
          <ScrollView contentContainerStyle={styles.menuList} showsVerticalScrollIndicator={false}>
            {MENU.map((entry, index) => {
              if (entry.kind === 'divider') {
                return <View key={`d-${index}`} style={styles.menuDivider} />;
              }
              const isHome = entry.label === 'Home' && view.name === 'home';
              const isLogout = entry.target === 'logout';
              return (
                <Pressable
                  key={entry.label}
                  style={[styles.menuItem, isHome && styles.menuItemActive]}
                  onPress={() => onMenuItem(entry.target)}
                  accessibilityRole="button">
                  <Text style={[styles.menuLabel, isHome && styles.menuLabelActive, isLogout && styles.menuLabelDanger]}>
                    {entry.label}
                  </Text>
                  {!!entry.sub && <Text style={styles.menuSub}>{entry.sub}</Text>}
                </Pressable>
              );
            })}
          </ScrollView>
        </SafeAreaView>
      </Modal>
    </SafeAreaView>
  );
}

function BottomTab({
  icon,
  label,
  active,
  onPress,
}: {
  icon: string;
  label: string;
  active: boolean;
  onPress: () => void;
}) {
  return (
    <Pressable style={styles.tab} onPress={onPress} accessibilityRole="button" accessibilityState={{ selected: active }}>
      <Text style={[styles.tabIcon, !active && styles.tabInactive]}>{icon}</Text>
      <Text style={[styles.tabLabel, active && styles.tabLabelActive]}>{label}</Text>
    </Pressable>
  );
}

function ProfileRow({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.profileRow}>
      <Text style={styles.profileRowLabel}>{label}</Text>
      <Text style={styles.profileRowValue}>{value}</Text>
    </View>
  );
}

export default StudentHomeScreen;

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: '#F5F6FF' },

  // Top bar
  topBar: {
    height: 62,
    paddingHorizontal: 14,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E6F2',
  },
  menuButton: {
    width: 44,
    height: 44,
    borderRadius: 12,
    backgroundColor: '#F5F6FF',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
  },
  menuLine: { width: 20, height: 2.5, borderRadius: 2, backgroundColor: '#16142F' },
  wordmark: { width: 140, height: 26 },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#5566EB',
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: { color: '#FFFFFF', fontSize: 16, fontWeight: '700' },

  // Home
  homeContent: { paddingHorizontal: 16, paddingTop: 20, paddingBottom: 24 },
  greetingRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 12 },
  greetingText: { flex: 1 },
  bellButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E1E3F4',
    alignItems: 'center',
    justifyContent: 'center',
  },
  bellButtonOn: { backgroundColor: '#EEF0FF', borderColor: '#5566EB' },
  bellIcon: { fontSize: 20 },
  bellIconOff: { opacity: 0.45 },
  bellDot: {
    position: 'absolute',
    top: 8,
    right: 9,
    width: 11,
    height: 11,
    borderRadius: 6,
    backgroundColor: '#22C55E',
    borderWidth: 2,
    borderColor: '#EEF0FF',
  },
  notifMessage: { marginTop: 8, fontSize: 12, color: '#726C8E' },
  greeting: { fontSize: 22, fontWeight: '800', color: '#16142F' },
  greetingSub: { marginTop: 2, fontSize: 13, color: '#726C8E' },
  banner: { marginTop: 16, borderRadius: 22, padding: 22 },
  bannerEyebrow: { fontSize: 12, fontWeight: '600', color: 'rgba(255,255,255,0.85)' },
  bannerTitle: { marginTop: 6, fontSize: 20, fontWeight: '800', lineHeight: 25, color: '#FFFFFF' },
  bannerButton: {
    alignSelf: 'flex-start',
    marginTop: 16,
    height: 44,
    paddingHorizontal: 22,
    borderRadius: 22,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  bannerButtonText: { color: '#4452D6', fontSize: 14, fontWeight: '700' },

  sectionLabel: { marginTop: 24, marginBottom: 12, fontSize: 11, fontWeight: '800', letterSpacing: 1.5, color: '#3B6BF0' },
  tileGrid: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between', rowGap: 12 },
  tile: {
    width: '48.5%',
    backgroundColor: '#FFFFFF',
    borderRadius: 18,
    borderWidth: 1,
    borderColor: '#E5E6F2',
    padding: 14,
  },
  tileIcon: { width: 38, height: 38, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  tileIconText: { fontSize: 19 },
  tileTitle: { marginTop: 10, fontSize: 14, fontWeight: '700', color: '#16142F' },
  tileDesc: { marginTop: 2, fontSize: 12, color: '#726C8E' },

  sectionRow: {
    marginTop: 26,
    marginBottom: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  sectionHeading: { fontSize: 16, fontWeight: '800', color: '#16142F' },
  seeAll: { fontSize: 13, fontWeight: '700', color: '#5566EB' },

  // News page
  newsHeader: { alignItems: 'center', paddingTop: 14, paddingBottom: 18, paddingHorizontal: 6 },
  backLink: { alignSelf: 'flex-start', fontSize: 15, fontWeight: '700', color: '#5566EB', marginBottom: 12 },
  listContent: { paddingHorizontal: 16, paddingBottom: 16 },
  badge: { backgroundColor: '#DDE3FF', borderRadius: 14, paddingHorizontal: 14, paddingVertical: 5, marginBottom: 12 },
  badgeText: { fontSize: 12, fontWeight: '700', color: '#4B57C8' },
  heading: { fontSize: 24, fontWeight: '800', color: '#16142F', textAlign: 'center' },
  subtitle: { marginTop: 8, fontSize: 14, lineHeight: 21, color: '#726C8E', textAlign: 'center' },

  // News card
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    marginBottom: 18,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: '#ECEDF8',
    elevation: 2,
    shadowColor: '#4F5BD5',
    shadowOpacity: 0.1,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 6 },
  },
  imageWrap: { height: 190, backgroundColor: '#E9EBFA' },
  image: { width: '100%', height: '100%' },
  imageFallback: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  imageFallbackText: { fontSize: 42 },
  sourceChip: {
    position: 'absolute',
    left: 12,
    bottom: 12,
    maxWidth: '75%',
    backgroundColor: 'rgba(22,20,47,0.72)',
    borderRadius: 12,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  sourceChipText: { color: '#FFFFFF', fontSize: 11, fontWeight: '600' },
  cardBody: { padding: 16 },
  cardTitle: { fontSize: 16, lineHeight: 23, fontWeight: '700', color: '#1E3A9F' },
  cardDescription: { marginTop: 8, fontSize: 14, lineHeight: 21, color: '#3D3A57' },
  metaRow: { marginTop: 14, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  dateText: { fontSize: 12, color: '#726C8E' },
  insightButton: { backgroundColor: '#1E88F7', borderRadius: 16, paddingHorizontal: 16, paddingVertical: 8 },
  insightButtonText: { color: '#FFFFFF', fontSize: 12, fontWeight: '700' },
  insightBox: { marginTop: 14, backgroundColor: '#F5F6FF', borderRadius: 14, padding: 14 },
  insightHeading: { fontSize: 13, fontWeight: '700', color: '#16142F', marginBottom: 4 },
  insightText: { fontSize: 13, lineHeight: 20, color: '#3D3A57' },
  actionsRow: {
    marginTop: 16,
    paddingTop: 14,
    borderTopWidth: 1,
    borderTopColor: '#ECEDF8',
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  actionBtn: {
    paddingHorizontal: 12,
    height: 36,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: '#DADCF0',
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  actionBtnActive: { backgroundColor: '#ECEEFF', borderColor: '#5566EB' },
  actionBtnPrimary: { backgroundColor: '#5566EB', borderColor: '#5566EB' },
  actionText: { fontSize: 12, fontWeight: '600', color: '#3D3A57' },
  actionTextActive: { color: '#3F4BC4' },
  actionTextPrimary: { color: '#FFFFFF' },

  footerLoader: { marginVertical: 18 },
  endText: { textAlign: 'center', color: '#9A96AD', fontSize: 13, marginVertical: 18 },

  centerBox: { alignItems: 'center', paddingVertical: 36, paddingHorizontal: 20 },
  centerTitle: { fontSize: 16, fontWeight: '700', color: '#16142F', marginBottom: 6 },
  centerText: { fontSize: 14, color: '#726C8E', textAlign: 'center', marginTop: 8 },
  retryButton: { marginTop: 16, backgroundColor: '#5566EB', borderRadius: 14, paddingHorizontal: 22, paddingVertical: 11 },
  retryText: { color: '#FFFFFF', fontWeight: '700', fontSize: 14 },

  // Coming soon
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

  // Education tabs
  eduHeader: { paddingHorizontal: 16, paddingTop: 18, paddingBottom: 6 },
  eduTitle: { fontSize: 22, fontWeight: '800', color: '#16142F' },
  eduTabsScroll: { flexGrow: 0 },
  eduTabs: { paddingHorizontal: 16, paddingVertical: 12, gap: 10 },
  eduTab: {
    height: 40,
    paddingHorizontal: 18,
    borderRadius: 20,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#DADCF0',
    alignItems: 'center',
    justifyContent: 'center',
  },
  eduTabOn: { backgroundColor: '#5566EB', borderColor: '#5566EB' },
  eduTabText: { fontSize: 13, fontWeight: '700', color: '#3D3A57' },
  eduTabTextOn: { color: '#FFFFFF' },

  // Profile
  profileWrap: { padding: 18 },
  profileCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 22,
    padding: 24,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#ECEDF8',
  },
  profileAvatar: {
    width: 84,
    height: 84,
    borderRadius: 42,
    backgroundColor: '#5566EB',
    alignItems: 'center',
    justifyContent: 'center',
  },
  profileAvatarText: { color: '#FFFFFF', fontSize: 34, fontWeight: '700' },
  profileName: { marginTop: 14, fontSize: 20, fontWeight: '800', color: '#16142F' },
  profileEmail: { marginTop: 4, fontSize: 14, color: '#726C8E' },
  profileRows: { alignSelf: 'stretch', marginTop: 22, borderTopWidth: 1, borderTopColor: '#ECEDF8' },
  profileRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: '#ECEDF8',
  },
  profileRowLabel: { fontSize: 13, color: '#726C8E' },
  profileRowValue: { fontSize: 14, fontWeight: '600', color: '#16142F' },
  logoutButton: {
    alignSelf: 'stretch',
    marginTop: 22,
    height: 50,
    borderRadius: 14,
    borderWidth: 1.5,
    borderColor: '#F5C2C7',
    alignItems: 'center',
    justifyContent: 'center',
  },
  logoutText: { color: '#D14B5A', fontSize: 15, fontWeight: '700' },

  // Bottom bar
  bottomBar: {
    height: 66,
    flexDirection: 'row',
    backgroundColor: '#FFFFFF',
    borderTopWidth: 1,
    borderTopColor: '#E5E6F2',
  },
  tab: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  tabIcon: { fontSize: 20 },
  tabInactive: { opacity: 0.45 },
  tabLabel: { marginTop: 2, fontSize: 11, fontWeight: '600', color: '#9A96AD' },
  tabLabelActive: { color: '#5566EB', fontWeight: '700' },

  // Menu
  menuScreen: { flex: 1, backgroundColor: '#FFFFFF' },
  menuTop: {
    height: 62,
    paddingHorizontal: 20,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  menuClose: {
    width: 44,
    height: 44,
    borderRadius: 12,
    backgroundColor: '#F5F6FF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  menuCloseText: { fontSize: 18, color: '#16142F' },
  menuList: { paddingHorizontal: 20, paddingBottom: 24 },
  menuItem: { paddingVertical: 13, paddingHorizontal: 12, borderRadius: 12 },
  menuItemActive: { backgroundColor: '#ECEEFF' },
  menuLabel: { fontSize: 15, fontWeight: '700', color: '#16142F' },
  menuLabelActive: { color: '#3F4BC4' },
  menuLabelDanger: { color: '#D14B5A' },
  menuSub: { marginTop: 4, fontSize: 13, lineHeight: 20, color: '#726C8E' },
  menuDivider: { height: 1, backgroundColor: '#E5E6F2', marginVertical: 10 },
});