import { useCallback, useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';

import {
  fetchBalanceHistory,
  fetchBalanceReport,
  fetchTransactionHistory,
  type Pagination,
  type TransactionRow,
} from '../../../services/reportsApi';

// Reports section: Balance Report, Balance History and Transaction History.
// The website shows these as wide tables; on a phone each row becomes a card.

const TABS = ['Balance Report', 'Balance History', 'Transaction History'] as const;
type Tab = (typeof TABS)[number];

type Props = {
  onBuyCredits: () => void;
};

const money = (value?: number | null) => (typeof value === 'number' ? value : 0).toFixed(2);

function errorMessage(error: unknown): string {
  return error instanceof Error && error.message ? error.message : 'Something went wrong. Please try again.';
}

// ── Shared pieces ────────────────────────────────────────────────────────────

function PageHeading({ emoji, title, subtitle }: { emoji: string; title: string; subtitle: string }) {
  return (
    <View style={s.heading}>
      <Text style={s.headingTitle}>
        {emoji} {title}
      </Text>
      <Text style={s.headingSub}>{subtitle}</Text>
    </View>
  );
}

function StatCard({
  label,
  value,
  valueStyle,
  flex = true,
}: {
  label: string;
  value: string;
  valueStyle?: object;
  flex?: boolean;
}) {
  return (
    <View style={[s.statCard, flex && s.flex1]}>
      <Text style={s.statLabel}>{label}</Text>
      <Text style={[s.statValue, valueStyle]} numberOfLines={1} adjustsFontSizeToFit>
        {value}
      </Text>
    </View>
  );
}

function BuyCreditsButton({ onPress }: { onPress: () => void }) {
  return (
    <Pressable style={s.buyButton} onPress={onPress} accessibilityRole="button">
      <Text style={s.buyButtonText}>💳 Buy Credits</Text>
    </Pressable>
  );
}

function EmptyState({ title, text }: { title: string; text: string }) {
  return (
    <View style={s.emptyCard}>
      <Text style={s.emptyIcon}>📭</Text>
      <Text style={s.emptyTitle}>{title}</Text>
      <Text style={s.emptyText}>{text}</Text>
    </View>
  );
}

function Problem({ text, onRetry }: { text: string; onRetry: () => void }) {
  return (
    <View style={s.problemBox}>
      <Text style={s.problemText}>{text}</Text>
      <Pressable style={s.retryButton} onPress={onRetry} accessibilityRole="button">
        <Text style={s.retryText}>Try again</Text>
      </Pressable>
    </View>
  );
}

function Loading() {
  return (
    <View style={s.loadingBox}>
      <ActivityIndicator size="large" color="#5566EB" />
    </View>
  );
}

function LoadMore({ pagination, loading, onPress }: { pagination: Pagination | null; loading: boolean; onPress: () => void }) {
  if (!pagination || pagination.page >= pagination.totalPages) {
    return null;
  }
  return (
    <Pressable style={s.loadMore} onPress={onPress} disabled={loading} accessibilityRole="button">
      {loading ? <ActivityIndicator size="small" color="#4452D6" /> : <Text style={s.loadMoreText}>Load more</Text>}
    </Pressable>
  );
}

// One transaction as a card. `mode` decides what is emphasised.
function TxnCard({ row, mode }: { row: TransactionRow; mode: 'balance' | 'transaction' }) {
  const credit = row.credit ?? 0;
  const debit = row.debit ?? 0;
  return (
    <View style={s.txnCard}>
      <View style={s.txnTop}>
        <Text style={s.txnId}>TXN #{row.transaction_id ?? '-'}</Text>
        <Text style={s.txnDate}>
          {row.transaction_date ?? ''} {row.transaction_time ?? ''}
        </Text>
      </View>

      {!!row.functionality && <Text style={s.txnDetails}>{row.functionality}</Text>}

      <View style={s.txnBottom}>
        {mode === 'transaction' && (
          <View style={s.txnAmounts}>
            {credit > 0 && <Text style={s.credit}>+{money(credit)}</Text>}
            {debit > 0 && <Text style={s.debit}>-{money(debit)}</Text>}
            {credit <= 0 && debit <= 0 && <Text style={s.txnMeta}>0.00</Text>}
          </View>
        )}
        <View style={s.txnBalanceWrap}>
          <Text style={s.txnMeta}>Balance</Text>
          <Text style={s.txnBalance}>{money(row.balance)}</Text>
        </View>
      </View>

      {mode === 'transaction' && !!row.modified_by && <Text style={s.txnMeta}>Modified by {row.modified_by}</Text>}
    </View>
  );
}

// ── 1. Balance Report ────────────────────────────────────────────────────────

function BalanceReport({ onBuyCredits }: Props) {
  const [status, setStatus] = useState<'loading' | 'ready' | 'error'>('loading');
  const [error, setError] = useState('');
  const [refreshing, setRefreshing] = useState(false);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [balance, setBalance] = useState(0);
  const [latest, setLatest] = useState<TransactionRow | null>(null);

  const load = useCallback(async (isRefresh = false) => {
    if (isRefresh) {
      setRefreshing(true);
    } else {
      setStatus('loading');
    }
    try {
      const response = await fetchBalanceReport();
      setName(response.data?.user.name ?? '');
      setEmail(response.data?.user.email ?? '');
      setBalance(response.data?.user.balance ?? 0);
      setLatest(response.data?.transaction ?? null);
      setStatus('ready');
    } catch (err) {
      setError(errorMessage(err));
      setStatus('error');
    } finally {
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  return (
    <ScrollView
      contentContainerStyle={s.content}
      showsVerticalScrollIndicator={false}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => load(true)} tintColor="#5566EB" colors={['#5566EB']} />}>
      <PageHeading emoji="💰" title="Balance Report" subtitle="Your current balance and the most recent transaction." />

      {status === 'loading' && <Loading />}
      {status === 'error' && <Problem text={error} onRetry={() => load()} />}
      {status === 'ready' && (
        <>
          <View style={s.statRow}>
            <StatCard label="CURRENT BALANCE" value={money(balance)} valueStyle={s.balanceValue} />
            <View style={[s.statCard, s.flex1]}>
              <Text style={s.statLabel}>ADD CREDITS</Text>
              <BuyCreditsButton onPress={onBuyCredits} />
            </View>
          </View>

          <View style={s.accountCard}>
            <Text style={s.statLabel}>ACCOUNT</Text>
            <Text style={s.accountName}>{name || '-'}</Text>
            <Text style={s.accountEmail}>{email}</Text>
          </View>

          <Text style={s.sectionLabel}>MOST RECENT TRANSACTION</Text>
          {latest ? (
            <TxnCard row={latest} mode="balance" />
          ) : (
            <EmptyState title="No transactions yet" text="Buy credits to see your first transaction here." />
          )}
        </>
      )}
    </ScrollView>
  );
}

// ── 2. Balance History ───────────────────────────────────────────────────────

function BalanceHistory({ onBuyCredits }: Props) {
  const [status, setStatus] = useState<'loading' | 'ready' | 'error'>('loading');
  const [error, setError] = useState('');
  const [refreshing, setRefreshing] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [balance, setBalance] = useState(0);
  const [rows, setRows] = useState<TransactionRow[]>([]);
  const [pagination, setPagination] = useState<Pagination | null>(null);

  const load = useCallback(async (isRefresh = false) => {
    if (isRefresh) {
      setRefreshing(true);
    } else {
      setStatus('loading');
    }
    try {
      const response = await fetchBalanceHistory(1);
      setBalance(response.data?.user.currentBalance ?? 0);
      setRows(response.data?.rows ?? []);
      setPagination(response.data?.pagination ?? null);
      setStatus('ready');
    } catch (err) {
      setError(errorMessage(err));
      setStatus('error');
    } finally {
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const loadMore = async () => {
    if (!pagination || loadingMore) {
      return;
    }
    setLoadingMore(true);
    try {
      const response = await fetchBalanceHistory(pagination.page + 1);
      setRows(prev => [...prev, ...(response.data?.rows ?? [])]);
      setPagination(response.data?.pagination ?? pagination);
    } catch (err) {
      setError(errorMessage(err));
    } finally {
      setLoadingMore(false);
    }
  };

  const total = pagination?.total ?? 0;

  return (
    <ScrollView
      contentContainerStyle={s.content}
      showsVerticalScrollIndicator={false}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => load(true)} tintColor="#5566EB" colors={['#5566EB']} />}>
      <PageHeading
        emoji="📊"
        title="Balance History"
        subtitle={`All balance records from the past 12 months — ${total} ${total === 1 ? 'entry' : 'entries'}.`}
      />

      {status === 'loading' && <Loading />}
      {status === 'error' && <Problem text={error} onRetry={() => load()} />}
      {status === 'ready' && (
        <>
          <View style={s.statRow}>
            <StatCard label="CURRENT BALANCE" value={money(balance)} valueStyle={s.balanceValue} />
            <StatCard label="TOTAL RECORDS (1 YR)" value={String(total)} />
          </View>
          <View style={s.buyRow}>
            <BuyCreditsButton onPress={onBuyCredits} />
          </View>

          {rows.length === 0 ? (
            <EmptyState title="No records found" text="No transactions in the past 12 months." />
          ) : (
            rows.map((row, index) => <TxnCard key={`${row.transaction_id ?? 'x'}-${index}`} row={row} mode="balance" />)
          )}
          <LoadMore pagination={pagination} loading={loadingMore} onPress={loadMore} />
        </>
      )}
    </ScrollView>
  );
}

// ── 3. Transaction History ───────────────────────────────────────────────────

type TypeFilter = 'all' | 'credit' | 'debit';

function TransactionHistory({ onBuyCredits }: Props) {
  const [status, setStatus] = useState<'loading' | 'ready' | 'error'>('loading');
  const [error, setError] = useState('');
  const [refreshing, setRefreshing] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [type, setType] = useState<TypeFilter>('all');
  const [filterText, setFilterText] = useState('');
  const [appliedText, setAppliedText] = useState('');
  const [balance, setBalance] = useState(0);
  const [summary, setSummary] = useState({ totalCredit: 0, totalDebit: 0, txCount: 0 });
  const [rows, setRows] = useState<TransactionRow[]>([]);
  const [pagination, setPagination] = useState<Pagination | null>(null);

  // Apply the text filter shortly after the student stops typing.
  useEffect(() => {
    const timer = setTimeout(() => setAppliedText(filterText.trim()), 450);
    return () => clearTimeout(timer);
  }, [filterText]);

  const query = useCallback(
    (page: number) =>
      fetchTransactionHistory({
        page,
        type: type === 'all' ? undefined : type,
        functionality: appliedText || undefined,
      }),
    [type, appliedText],
  );

  const load = useCallback(
    async (isRefresh = false) => {
      if (isRefresh) {
        setRefreshing(true);
      } else {
        setStatus('loading');
      }
      try {
        const response = await query(1);
        setBalance(response.data?.user.currentBalance ?? 0);
        setSummary(response.data?.summary ?? { totalCredit: 0, totalDebit: 0, txCount: 0 });
        setRows(response.data?.rows ?? []);
        setPagination(response.data?.pagination ?? null);
        setStatus('ready');
      } catch (err) {
        setError(errorMessage(err));
        setStatus('error');
      } finally {
        setRefreshing(false);
      }
    },
    [query],
  );

  useEffect(() => {
    load();
  }, [load]);

  const loadMore = async () => {
    if (!pagination || loadingMore) {
      return;
    }
    setLoadingMore(true);
    try {
      const response = await query(pagination.page + 1);
      setRows(prev => [...prev, ...(response.data?.rows ?? [])]);
      setPagination(response.data?.pagination ?? pagination);
    } catch (err) {
      setError(errorMessage(err));
    } finally {
      setLoadingMore(false);
    }
  };

  const total = pagination?.total ?? 0;

  return (
    <ScrollView
      contentContainerStyle={s.content}
      keyboardShouldPersistTaps="handled"
      showsVerticalScrollIndicator={false}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => load(true)} tintColor="#5566EB" colors={['#5566EB']} />}>
      <PageHeading
        emoji="🧾"
        title="Transaction History"
        subtitle={`All transactions from the past 12 months — ${total} ${total === 1 ? 'record' : 'records'}.`}
      />

      <View style={s.statRow}>
        <StatCard label="CURRENT BALANCE" value={money(balance)} valueStyle={s.balanceValue} />
        <StatCard label="TOTAL CREDITS (1 YR)" value={`+${money(summary.totalCredit)}`} valueStyle={s.credit} />
      </View>
      <View style={s.statRow}>
        <StatCard label="TOTAL DEBITS (1 YR)" value={`-${money(summary.totalDebit)}`} valueStyle={s.debit} />
        <StatCard label="TOTAL TRANSACTIONS" value={String(summary.txCount)} />
      </View>

      <View style={s.filterRow}>
        {(['all', 'credit', 'debit'] as TypeFilter[]).map(option => {
          const on = option === type;
          return (
            <Pressable key={option} style={[s.chip, on && s.chipOn]} onPress={() => setType(option)} accessibilityRole="button" accessibilityState={{ selected: on }}>
              <Text style={[s.chipText, on && s.chipTextOn]}>{option === 'all' ? 'All Types' : option === 'credit' ? 'Credit' : 'Debit'}</Text>
            </Pressable>
          );
        })}
      </View>
      <TextInput
        style={s.filterInput}
        value={filterText}
        onChangeText={setFilterText}
        placeholder="Filter by functionality..."
        placeholderTextColor="#9A96AD"
        autoCorrect={false}
        returnKeyType="search"
      />
      <View style={s.buyRow}>
        <BuyCreditsButton onPress={onBuyCredits} />
      </View>

      {status === 'loading' && <Loading />}
      {status === 'error' && <Problem text={error} onRetry={() => load()} />}
      {status === 'ready' && (
        <>
          {rows.length === 0 ? (
            <EmptyState title="No transactions found" text="Try changing your filters, or make your first transaction." />
          ) : (
            rows.map((row, index) => <TxnCard key={`${row.transaction_id ?? 'x'}-${index}`} row={row} mode="transaction" />)
          )}
          <LoadMore pagination={pagination} loading={loadingMore} onPress={loadMore} />
        </>
      )}
    </ScrollView>
  );
}

// ── Reports view ─────────────────────────────────────────────────────────────

function ReportsView({ onBuyCredits }: Props) {
  const [tab, setTab] = useState<Tab>('Balance Report');

  return (
    <View style={s.flex1}>
      <View style={s.header}>
        <Text style={s.title}>Reports</Text>
      </View>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={s.tabsScroll} contentContainerStyle={s.tabs}>
        {TABS.map(name => {
          const on = name === tab;
          return (
            <Pressable key={name} style={[s.tab, on && s.tabOn]} onPress={() => setTab(name)} accessibilityRole="tab" accessibilityState={{ selected: on }}>
              <Text style={[s.tabText, on && s.tabTextOn]}>{name}</Text>
            </Pressable>
          );
        })}
      </ScrollView>

      {tab === 'Balance Report' && <BalanceReport onBuyCredits={onBuyCredits} />}
      {tab === 'Balance History' && <BalanceHistory onBuyCredits={onBuyCredits} />}
      {tab === 'Transaction History' && <TransactionHistory onBuyCredits={onBuyCredits} />}
    </View>
  );
}

export default ReportsView;

const s = StyleSheet.create({
  flex1: { flex: 1 },
  header: { paddingHorizontal: 16, paddingTop: 18, paddingBottom: 6 },
  title: { fontSize: 22, fontWeight: '800', color: '#16142F' },
  tabsScroll: { flexGrow: 0 },
  tabs: { paddingHorizontal: 16, paddingVertical: 12, gap: 10 },
  tab: { height: 40, paddingHorizontal: 18, borderRadius: 20, backgroundColor: '#FFFFFF', borderWidth: 1, borderColor: '#DADCF0', alignItems: 'center', justifyContent: 'center' },
  tabOn: { backgroundColor: '#5566EB', borderColor: '#5566EB' },
  tabText: { fontSize: 13, fontWeight: '700', color: '#3D3A57' },
  tabTextOn: { color: '#FFFFFF' },

  content: { paddingHorizontal: 16, paddingTop: 4, paddingBottom: 40 },
  heading: { marginBottom: 14 },
  headingTitle: { fontSize: 20, fontWeight: '800', color: '#16142F' },
  headingSub: { marginTop: 4, fontSize: 13, lineHeight: 19, color: '#726C8E' },

  statRow: { flexDirection: 'row', gap: 12, marginBottom: 12 },
  statCard: { padding: 14, borderRadius: 16, backgroundColor: '#FFFFFF', borderWidth: 1, borderColor: '#E5E6F2', justifyContent: 'center' },
  statLabel: { fontSize: 10, fontWeight: '800', letterSpacing: 0.6, color: '#726C8E', marginBottom: 6 },
  statValue: { fontSize: 22, fontWeight: '800', color: '#16142F' },
  balanceValue: { color: '#4452D6' },
  accountCard: { padding: 14, marginBottom: 16, borderRadius: 16, backgroundColor: '#FFFFFF', borderWidth: 1, borderColor: '#E5E6F2' },
  accountName: { fontSize: 16, fontWeight: '800', color: '#16142F' },
  accountEmail: { marginTop: 2, fontSize: 13, color: '#726C8E' },
  sectionLabel: { fontSize: 11, fontWeight: '800', letterSpacing: 0.8, color: '#4452D6', marginBottom: 10 },

  buyButton: { height: 40, borderRadius: 20, backgroundColor: '#5566EB', alignItems: 'center', justifyContent: 'center', paddingHorizontal: 14 },
  buyButtonText: { fontSize: 13, fontWeight: '700', color: '#FFFFFF' },
  buyRow: { marginBottom: 14 },

  filterRow: { flexDirection: 'row', gap: 8, marginTop: 4, marginBottom: 10 },
  chip: { paddingHorizontal: 14, height: 36, borderRadius: 18, borderWidth: 1, borderColor: '#D7DBFF', backgroundColor: '#FFFFFF', alignItems: 'center', justifyContent: 'center' },
  chipOn: { backgroundColor: '#5566EB', borderColor: '#5566EB' },
  chipText: { fontSize: 13, fontWeight: '600', color: '#59627F' },
  chipTextOn: { color: '#FFFFFF' },
  filterInput: { height: 46, borderRadius: 14, borderWidth: 1, borderColor: '#E1E3F4', backgroundColor: '#FFFFFF', paddingHorizontal: 14, fontSize: 14, color: '#16142F', marginBottom: 12 },

  txnCard: { padding: 14, marginBottom: 10, borderRadius: 16, backgroundColor: '#FFFFFF', borderWidth: 1, borderColor: '#E5E6F2', gap: 6 },
  txnTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  txnId: { fontSize: 12, fontWeight: '800', color: '#4452D6' },
  txnDate: { fontSize: 12, color: '#726C8E' },
  txnDetails: { fontSize: 14, fontWeight: '600', color: '#16142F' },
  txnBottom: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-end', marginTop: 2 },
  txnAmounts: { gap: 2 },
  txnBalanceWrap: { alignItems: 'flex-end', marginLeft: 'auto' },
  txnBalance: { fontSize: 18, fontWeight: '800', color: '#16142F' },
  txnMeta: { fontSize: 12, color: '#726C8E' },
  credit: { fontSize: 16, fontWeight: '800', color: '#0F9D58' },
  debit: { fontSize: 16, fontWeight: '800', color: '#D93025' },

  emptyCard: { alignItems: 'center', padding: 32, borderRadius: 18, backgroundColor: '#FFFFFF', borderWidth: 1, borderColor: '#E5E6F2' },
  emptyIcon: { fontSize: 40 },
  emptyTitle: { marginTop: 10, fontSize: 16, fontWeight: '800', color: '#16142F' },
  emptyText: { marginTop: 4, fontSize: 13, color: '#726C8E', textAlign: 'center', lineHeight: 19 },

  loadingBox: { paddingVertical: 40, alignItems: 'center' },
  problemBox: { padding: 20, alignItems: 'center', borderRadius: 16, backgroundColor: '#FFFFFF', borderWidth: 1, borderColor: '#E5E6F2' },
  problemText: { fontSize: 14, color: '#726C8E', textAlign: 'center', lineHeight: 21 },
  retryButton: { marginTop: 12, height: 40, paddingHorizontal: 20, borderRadius: 14, backgroundColor: '#5566EB', alignItems: 'center', justifyContent: 'center' },
  retryText: { color: '#FFFFFF', fontSize: 14, fontWeight: '700' },
  loadMore: { height: 44, borderRadius: 14, backgroundColor: '#EEF0FF', alignItems: 'center', justifyContent: 'center', marginTop: 4 },
  loadMoreText: { fontSize: 14, fontWeight: '700', color: '#4452D6' },
});