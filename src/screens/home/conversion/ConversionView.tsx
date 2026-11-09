import { useState } from 'react';
import { Alert, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';

// Conversion section. Mirrors the website's Conversion menu:
// pick what you are converting FROM (Text / Image / Audio / Video),
// then what you want TO (Text / Image / Audio / Video) = 16 conversions.

type Kind = 'Text' | 'Image' | 'Audio' | 'Video';

const KINDS: { kind: Kind; icon: string; hint: string }[] = [
  { kind: 'Text', icon: '📝', hint: 'Write or paste text' },
  { kind: 'Image', icon: '🖼️', hint: 'Upload a picture' },
  { kind: 'Audio', icon: '🎧', hint: 'Upload a recording' },
  { kind: 'Video', icon: '🎬', hint: 'Upload a video' },
];

const iconOf = (kind: Kind) => KINDS.find(k => k.kind === kind)?.icon ?? '';

type Pair = { from: Kind; to: Kind };

// ── Selection screen ─────────────────────────────────────────────────────────

function KindTile({ kind, selected, onPress }: { kind: Kind; selected: boolean; onPress: () => void }) {
  return (
    <Pressable
      style={[s.tile, selected && s.tileOn]}
      onPress={onPress}
      accessibilityRole="button"
      accessibilityState={{ selected }}>
      <Text style={s.tileIcon}>{iconOf(kind)}</Text>
      <Text style={[s.tileText, selected && s.tileTextOn]}>{kind}</Text>
    </Pressable>
  );
}

function Picker({ onPick }: { onPick: (pair: Pair) => void }) {
  const [from, setFrom] = useState<Kind | null>(null);

  return (
    <ScrollView contentContainerStyle={s.content} showsVerticalScrollIndicator={false}>
      <Text style={s.heading}>Conversion</Text>
      <Text style={s.sub}>Turn one kind of content into another.</Text>

      <Text style={s.label}>1. CONVERT FROM</Text>
      <View style={s.grid}>
        {KINDS.map(k => (
          <KindTile key={k.kind} kind={k.kind} selected={from === k.kind} onPress={() => setFrom(k.kind)} />
        ))}
      </View>

      {from && (
        <>
          <Text style={s.label}>2. CONVERT TO</Text>
          <View style={s.list}>
            {KINDS.map(k => (
              <Pressable
                key={k.kind}
                style={s.row}
                onPress={() => onPick({ from, to: k.kind })}
                accessibilityRole="button"
                accessibilityLabel={`${from} to ${k.kind}`}>
                <Text style={s.rowIcon}>{k.icon}</Text>
                <Text style={s.rowText}>
                  {from}-{k.kind}
                </Text>
                <Text style={s.chevron}>›</Text>
              </Pressable>
            ))}
          </View>
        </>
      )}
    </ScrollView>
  );
}

// ── One conversion ───────────────────────────────────────────────────────────

function ConvertScreen({ pair, onBack }: { pair: Pair; onBack: () => void }) {
  const [text, setText] = useState('');
  const fromText = pair.from === 'Text';

  const convert = () => {
    // TODO: call the conversion backend here once its routes are known.
    Alert.alert('Not connected yet', `${pair.from}-${pair.to} conversion is not connected to the backend yet.`);
  };

  return (
    <ScrollView contentContainerStyle={s.content} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
      <Pressable onPress={onBack} style={s.back} accessibilityRole="button" accessibilityLabel="Back">
        <Text style={s.backText}>‹ All conversions</Text>
      </Pressable>

      <Text style={s.heading}>
        {iconOf(pair.from)} {pair.from} → {iconOf(pair.to)} {pair.to}
      </Text>
      <Text style={s.sub}>
        Convert {pair.from.toLowerCase()} into {pair.to.toLowerCase()}.
      </Text>

      <Text style={s.label}>INPUT</Text>
      {fromText ? (
        <TextInput
          style={s.textArea}
          value={text}
          onChangeText={setText}
          placeholder="Type or paste your text here..."
          placeholderTextColor="#9A96AD"
          multiline
          textAlignVertical="top"
        />
      ) : (
        <View style={s.upload}>
          <Text style={s.uploadIcon}>{iconOf(pair.from)}</Text>
          <Text style={s.uploadTitle}>Choose a {pair.from.toLowerCase()} file</Text>
          <Text style={s.uploadText}>File picking will be added with the backend connection.</Text>
        </View>
      )}

      <Pressable
        style={[s.convertButton, fromText && !text.trim() && s.convertOff]}
        onPress={convert}
        disabled={fromText && !text.trim()}
        accessibilityRole="button">
        <Text style={s.convertText}>Convert</Text>
      </Pressable>
    </ScrollView>
  );
}

// ── Conversion view ──────────────────────────────────────────────────────────

function ConversionView() {
  const [pair, setPair] = useState<Pair | null>(null);

  return pair ? <ConvertScreen pair={pair} onBack={() => setPair(null)} /> : <Picker onPick={setPair} />;
}

export default ConversionView;

const s = StyleSheet.create({
  content: { paddingHorizontal: 16, paddingTop: 18, paddingBottom: 40 },
  heading: { fontSize: 22, fontWeight: '800', color: '#16142F' },
  sub: { marginTop: 4, marginBottom: 18, fontSize: 13, lineHeight: 19, color: '#726C8E' },
  label: { fontSize: 11, fontWeight: '800', letterSpacing: 0.8, color: '#4452D6', marginBottom: 10, marginTop: 4 },

  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 12, marginBottom: 18 },
  tile: { width: '47.5%', paddingVertical: 18, borderRadius: 16, backgroundColor: '#FFFFFF', borderWidth: 1, borderColor: '#E5E6F2', alignItems: 'center' },
  tileOn: { backgroundColor: '#EEF0FF', borderColor: '#5566EB' },
  tileIcon: { fontSize: 28 },
  tileText: { marginTop: 6, fontSize: 14, fontWeight: '700', color: '#3D3A57' },
  tileTextOn: { color: '#4452D6' },

  list: { borderRadius: 16, backgroundColor: '#FFFFFF', borderWidth: 1, borderColor: '#E5E6F2', overflow: 'hidden' },
  row: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, height: 54, borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: '#E5E6F2' },
  rowIcon: { fontSize: 20, marginRight: 12 },
  rowText: { flex: 1, fontSize: 15, fontWeight: '600', color: '#16142F' },
  chevron: { fontSize: 22, color: '#9A96AD' },

  back: { alignSelf: 'flex-start', paddingVertical: 6, marginBottom: 8 },
  backText: { fontSize: 14, fontWeight: '700', color: '#4452D6' },

  textArea: { minHeight: 160, padding: 14, borderRadius: 14, borderWidth: 1, borderColor: '#E1E3F4', backgroundColor: '#FFFFFF', fontSize: 14, color: '#16142F' },
  upload: { alignItems: 'center', padding: 28, borderRadius: 16, borderWidth: 1.5, borderStyle: 'dashed', borderColor: '#C9CDF5', backgroundColor: '#FFFFFF' },
  uploadIcon: { fontSize: 36 },
  uploadTitle: { marginTop: 8, fontSize: 15, fontWeight: '800', color: '#16142F' },
  uploadText: { marginTop: 4, fontSize: 12, color: '#726C8E', textAlign: 'center' },

  convertButton: { marginTop: 18, height: 48, borderRadius: 16, backgroundColor: '#5566EB', alignItems: 'center', justifyContent: 'center' },
  convertOff: { opacity: 0.45 },
  convertText: { fontSize: 15, fontWeight: '700', color: '#FFFFFF' },
});