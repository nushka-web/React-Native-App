import { useState } from 'react';
import { Alert, Linking, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';

// About Us section. Mirrors the website's About Us menu:
//   Legal       -> layout still in progress (placeholder)
//   Contact Us  -> "Get in Touch" card

type Page = 'menu' | 'legal' | 'contact';

const CONTACT = {
  name: 'Pina Jignesh Doshi',
  company: 'Pina Systems',
  address: '006, Aarnath Apt, Sarvodaya Nagar,\nJain Temple Rd, Mulund West,\nMumbai, Maharashtra 400080',
  phone: '+91 9321288789',
  email: 'pinasystems@yahoo.com',
};

function open(url: string) {
  Linking.openURL(url).catch(() => Alert.alert('Unable to open', 'No app on this device can open this link.'));
}

// ── Menu ─────────────────────────────────────────────────────────────────────

function MenuRow({ icon, label, sub, onPress }: { icon: string; label: string; sub: string; onPress: () => void }) {
  return (
    <Pressable style={s.menuRow} onPress={onPress} accessibilityRole="button" accessibilityLabel={label}>
      <View style={s.menuIcon}>
        <Text style={s.menuIconText}>{icon}</Text>
      </View>
      <View style={{ flex: 1 }}>
        <Text style={s.menuLabel}>{label}</Text>
        <Text style={s.menuSub}>{sub}</Text>
      </View>
      <Text style={s.chevron}>›</Text>
    </Pressable>
  );
}

function Menu({ onPick }: { onPick: (page: Page) => void }) {
  return (
    <ScrollView contentContainerStyle={s.light} showsVerticalScrollIndicator={false}>
      <Text style={s.heading}>About Us</Text>
      <Text style={s.sub}>Know more about Arthum and how to reach us.</Text>
      <View style={s.menuList}>
        <MenuRow icon="📄" label="Legal" sub="Terms, privacy and policies" onPress={() => onPick('legal')} />
        <MenuRow icon="✉️" label="Contact Us" sub="Business, support and product queries" onPress={() => onPick('contact')} />
      </View>
    </ScrollView>
  );
}

// ── Legal (in progress) ──────────────────────────────────────────────────────

function Legal({ onBack }: { onBack: () => void }) {
  return (
    <ScrollView contentContainerStyle={s.light} showsVerticalScrollIndicator={false}>
      <Pressable onPress={onBack} style={s.back} accessibilityRole="button" accessibilityLabel="Back">
        <Text style={s.backText}>‹ About Us</Text>
      </Pressable>
      <Text style={s.heading}>Legal</Text>
      <View style={s.progressCard}>
        <Text style={s.progressEmoji}>🚧</Text>
        <Text style={s.progressTitle}>Layout in progress</Text>
        <Text style={s.progressText}>The legal pages are being prepared and will appear here soon.</Text>
      </View>
    </ScrollView>
  );
}

// ── Contact Us ───────────────────────────────────────────────────────────────

function InfoRow({ label, value, onPress, link }: { label: string; value: string; onPress?: () => void; link?: boolean }) {
  const content = (
    <>
      <Text style={s.rowLabel}>{label}</Text>
      <Text style={[s.rowValue, link && s.rowLink]}>{value}</Text>
    </>
  );
  return onPress ? (
    <Pressable style={s.infoRow} onPress={onPress} accessibilityRole="link" accessibilityLabel={`${label}: ${value}`}>
      {content}
    </Pressable>
  ) : (
    <View style={s.infoRow}>{content}</View>
  );
}

function Contact({ onBack }: { onBack: () => void }) {
  return (
    <ScrollView contentContainerStyle={s.light} showsVerticalScrollIndicator={false}>
      <Pressable onPress={onBack} style={s.back} accessibilityRole="button" accessibilityLabel="Back">
        <Text style={s.backText}>‹ About Us</Text>
      </Pressable>

      <View style={s.card}>
        {/* TODO: swap for the Arthum "A" icon image once it is added to assets */}
        <View style={s.logo}>
          <Text style={s.logoText}>A</Text>
        </View>
        <Text style={s.eyebrow}>CONTACT US</Text>
        <Text style={s.title}>Get in Touch</Text>
        <Text style={s.lead}>For business, support, or product related queries, please contact us using the details below.</Text>

        <InfoRow label="Name" value={CONTACT.name} />
        <InfoRow label="Company" value={CONTACT.company} />
        <InfoRow label="Address" value={CONTACT.address} />
        <InfoRow label="Phone" value={CONTACT.phone} link onPress={() => open(`tel:${CONTACT.phone.replace(/\s/g, '')}`)} />
        <InfoRow label="Email" value={CONTACT.email} link onPress={() => open(`mailto:${CONTACT.email}`)} />
      </View>
    </ScrollView>
  );
}

// ── About Us view ────────────────────────────────────────────────────────────

function AboutUsView() {
  const [page, setPage] = useState<Page>('menu');

  if (page === 'legal') {
    return <Legal onBack={() => setPage('menu')} />;
  }
  if (page === 'contact') {
    return <Contact onBack={() => setPage('menu')} />;
  }
  return <Menu onPick={setPage} />;
}

export default AboutUsView;

const s = StyleSheet.create({
  light: { paddingHorizontal: 16, paddingTop: 18, paddingBottom: 40 },
  heading: { fontSize: 22, fontWeight: '800', color: '#16142F' },
  sub: { marginTop: 4, marginBottom: 18, fontSize: 13, lineHeight: 19, color: '#726C8E' },

  menuList: { borderRadius: 16, backgroundColor: '#FFFFFF', borderWidth: 1, borderColor: '#E5E6F2', overflow: 'hidden' },
  menuRow: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 14, borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: '#E5E6F2' },
  menuIcon: { width: 40, height: 40, borderRadius: 12, backgroundColor: '#EEF0FF', alignItems: 'center', justifyContent: 'center', marginRight: 12 },
  menuIconText: { fontSize: 18 },
  menuLabel: { fontSize: 15, fontWeight: '700', color: '#16142F' },
  menuSub: { marginTop: 2, fontSize: 12, color: '#726C8E' },
  chevron: { fontSize: 22, color: '#9A96AD' },

  back: { alignSelf: 'flex-start', paddingVertical: 6, marginBottom: 8 },
  backText: { fontSize: 14, fontWeight: '700', color: '#4452D6' },

  progressCard: { marginTop: 18, alignItems: 'center', padding: 28, borderRadius: 16, borderWidth: 1.5, borderStyle: 'dashed', borderColor: '#C9CDF5', backgroundColor: '#FFFFFF' },
  progressEmoji: { fontSize: 34 },
  progressTitle: { marginTop: 8, fontSize: 16, fontWeight: '800', color: '#16142F' },
  progressText: { marginTop: 4, fontSize: 13, lineHeight: 19, color: '#726C8E', textAlign: 'center' },

  card: { padding: 20, borderRadius: 24, backgroundColor: '#0E1526', borderWidth: 1, borderColor: '#222B45' },
  logo: { width: 56, height: 56, borderRadius: 16, backgroundColor: '#1E2447', alignItems: 'center', justifyContent: 'center' },
  logoText: { fontSize: 28, fontWeight: '900', color: '#6C63FF' },
  eyebrow: { marginTop: 18, fontSize: 11, fontWeight: '800', letterSpacing: 1.2, color: '#3B6BFF' },
  title: { marginTop: 6, fontSize: 32, fontWeight: '800', color: '#FFFFFF' },
  lead: { marginTop: 10, marginBottom: 20, fontSize: 13, lineHeight: 21, color: '#98A2BC' },

  infoRow: { flexDirection: 'row', paddingHorizontal: 14, paddingVertical: 16, marginBottom: 10, borderRadius: 14, backgroundColor: '#1A2238', borderWidth: 1, borderColor: '#2A3350' },
  rowLabel: { width: 88, fontSize: 11, color: '#98A2BC' },
  rowValue: { flex: 1, fontSize: 13, lineHeight: 21, fontWeight: '600', color: '#FFFFFF' },
  rowLink: { color: '#3B6BFF' },
});