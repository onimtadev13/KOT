import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  StatusBar,
  Platform,
  Animated,
  ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@react-native-vector-icons/ionicons';
import { useAppStore } from '../Store/store';
import { DrawerActions, useNavigation } from '@react-navigation/native';
import { loadButtonVisibility } from '../Api/api';

// ─────────────────────────────────────────────────────────────────────────────
// Button definitions
// ─────────────────────────────────────────────────────────────────────────────
type ButtonConfig = {
  key:   string;
  label: string;
  icon:  string;
  color: string;
  bg:    string;
  desc:  string;
};

const ALL_BUTTONS: ButtonConfig[] = [
  { key: 'GUEST',           label: 'Guest',           icon: 'person-outline',     color: '#6C1FC9', bg: '#F3EEFF', desc: 'Create orders for registered club members'    },
  { key: 'VISITOR',         label: 'Visitor',         icon: 'walk-outline',       color: '#0369A1', bg: '#E0F2FE', desc: 'Orders for walk-in visitors without membership' },
  { key: 'EXECUTIVE_STAFF', label: 'Executive Staff', icon: 'briefcase-outline',  color: '#0F766E', bg: '#CCFBF1', desc: 'Staff meal orders for executive personnel'      },
  { key: 'PITS',            label: 'Pits',            icon: 'grid-outline',       color: '#B45309', bg: '#FEF3C7', desc: 'Pit-side food and beverage orders'              },
  { key: 'TABLES',          label: 'Tables',          icon: 'restaurant-outline', color: '#B91C1C', bg: '#FEE2E2', desc: 'Dine-in table service orders'                   },
  { key: 'QR_SCAN',         label: 'QR Scan',         icon: 'qr-code-outline',    color: '#1D4ED8', bg: '#DBEAFE', desc: 'Scan member QR code to create an order'        },
  { key: 'VIP',             label: 'VIP',             icon: 'star-outline',       color: '#92400E', bg: '#FDE68A', desc: 'High-priority VIP guest service orders'         },
];

// ─────────────────────────────────────────────────────────────────────────────
// Animated row — read-only
// ─────────────────────────────────────────────────────────────────────────────
function ButtonRow({
  config,
  enabled,
  delay,
}: {
  config:  ButtonConfig;
  enabled: boolean;
  delay:   number;
}) {
  const fadeAnim  = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(18)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim,  { toValue: 1, duration: 340, delay, useNativeDriver: true }),
      Animated.timing(slideAnim, { toValue: 0, duration: 340, delay, useNativeDriver: true }),
    ]).start();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <Animated.View style={{ opacity: fadeAnim, transform: [{ translateY: slideAnim }] }}>
      <View style={[S.row, !enabled && S.rowDisabled]}>

        <View style={[S.rowIconWrap, { backgroundColor: enabled ? config.bg : '#F3F4F6' }]}>
          <Ionicons
            name={config.icon as any}
            size={22}
            color={enabled ? config.color : '#C4CCDA'}
          />
        </View>

        <View style={S.rowText}>
          <Text style={[S.rowLabel, !enabled && S.rowLabelOff]}>{config.label}</Text>
          <Text style={[S.rowDesc,  !enabled && S.rowDescOff]} numberOfLines={1}>
            {config.desc}
          </Text>
        </View>

        <View style={[S.statusChip, enabled ? S.statusChipOn : S.statusChipOff]}>
          <View style={[S.statusDot, enabled ? S.statusDotOn : S.statusDotOff]} />
          <Text style={[S.statusText, enabled ? S.statusTextOn : S.statusTextOff]}>
            {enabled ? 'ON' : 'OFF'}
          </Text>
        </View>

      </View>
    </Animated.View>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// SettingsScreen
// ─────────────────────────────────────────────────────────────────────────────
export default function SettingsScreen({ navigation }: { navigation: any }) {
  const device = useAppStore(state => state.device);
  const nav    = useNavigation<any>();

  const [visible, setVisible] = useState<Record<string, boolean>>({});
  const [loading, setLoading] = useState(true);
  const [error,   setError]   = useState<string | null>(null);

  useEffect(() => { fetchVisibility(); }, []);

  async function fetchVisibility() {
    setLoading(true);
    setError(null);
    try {
      const map = await loadButtonVisibility(
        device?.Device_Id ?? 0,
        device?.Doc_No   ?? '',
        device?.UniqueId ?? '',
      );
      setVisible(map);
    } catch {
      setError('Failed to load button settings.');
    } finally {
      setLoading(false);
    }
  }

  const enabledCount = ALL_BUTTONS.filter(b => visible[b.key]).length;

  return (
    <View style={S.flex}>
      <StatusBar barStyle="light-content" backgroundColor={PURPLE_DEEP} />

      {/* ── Nav bar ── */}
      <View style={S.navBar}>
        <TouchableOpacity
          style={S.iconBtn}
          onPress={() => nav.dispatch(DrawerActions.openDrawer())}
          activeOpacity={0.75}
        >
          <Ionicons name="menu-outline" size={22} color="#fff" />
        </TouchableOpacity>

        <View style={S.navTitleWrap}>
          <Text style={S.navTitle}>Settings</Text>
          <Text style={S.navSub}>Kitchen Order Ticket</Text>
        </View>

        {device?.Doc_No ? (
          <View style={S.docChip}>
            <Text style={S.docChipText}>#{device.Doc_No}</Text>
          </View>
        ) : (
          <View style={{ width: 60 }} />
        )}
      </View>

      {/* ── States ── */}
      {loading ? (
        <View style={S.centreWrap}>
          <ActivityIndicator size="large" color={PURPLE} />
          <Text style={S.loadingText}>Loading settings…</Text>
        </View>

      ) : error ? (
        <View style={S.centreWrap}>
          <View style={S.emptyIconWrap}>
            <Ionicons name="cloud-offline-outline" size={32} color="#9CA3AF" />
          </View>
          <Text style={S.emptyTitle}>Could not load</Text>
          <Text style={S.emptySub}>{error}</Text>
          <TouchableOpacity style={S.retryBtn} onPress={fetchVisibility} activeOpacity={0.8}>
            <Ionicons name="refresh-outline" size={16} color="#fff" />
            <Text style={S.retryText}>Retry</Text>
          </TouchableOpacity>
        </View>

      ) : (
        <ScrollView
          style={S.scroll}
          contentContainerStyle={S.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          {/* ── Section header ── */}
          <View style={S.sectionHeader}>
            <View style={S.sectionHeaderLeft}>
              <View style={S.sectionIconWrap}>
                <Ionicons name="apps-outline" size={18} color={PURPLE} />
              </View>
              <View>
                <Text style={S.sectionTitle}>Home Screen Buttons</Text>
                <Text style={S.sectionSub}>
                  {enabledCount} of {ALL_BUTTONS.length} buttons active
                </Text>
              </View>
            </View>

            <TouchableOpacity style={S.refreshBtn} onPress={fetchVisibility} activeOpacity={0.8}>
              <Ionicons name="refresh-outline" size={13} color={PURPLE} />
              <Text style={S.refreshText}>Refresh</Text>
            </TouchableOpacity>
          </View>

          {/* ── Progress bar ── */}
          <View style={S.progressTrack}>
            <View
              style={[
                S.progressBar,
                { width: `${(enabledCount / ALL_BUTTONS.length) * 100}%` as any },
              ]}
            />
          </View>

          {/* ── Button rows ── */}
          <View style={S.card}>
            {ALL_BUTTONS.map((btn, idx) => (
              <React.Fragment key={btn.key}>
                <ButtonRow
                  config={btn}
                  enabled={visible[btn.key] ?? false}
                  delay={idx * 40}
                />
                {idx < ALL_BUTTONS.length - 1 && <View style={S.rowDivider} />}
              </React.Fragment>
            ))}
          </View>

          {/* ── Info note ── */}
          <View style={S.infoBox}>
            <Ionicons name="information-circle-outline" size={16} color={PURPLE} style={{ marginTop: 1 }} />
            <Text style={S.infoText}>
              Button visibility is controlled by your system administrator. Contact admin to enable or disable buttons.
            </Text>
          </View>

        </ScrollView>
      )}
    </View>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Tokens
// ─────────────────────────────────────────────────────────────────────────────
const PURPLE_DEEP = '#3D013C';
const PURPLE      = '#6C1FC9';
const WHITE       = '#FFFFFF';
const BG          = '#F5F6FA';
const CARD        = '#FFFFFF';
const BORDER      = '#EDF0F4';
const TEXT_DARK   = '#1A1D2E';
const TEXT_MID    = '#6B7280';
const TEXT_LIGHT  = '#B0B8C1';

const S = StyleSheet.create({
  flex: { flex: 1, backgroundColor: BG },

  navBar: {
    backgroundColor:   PURPLE_DEEP,
    paddingTop:        Platform.OS === 'ios' ? 52 : 32,
    paddingBottom:     14,
    paddingHorizontal: 12,
    flexDirection:     'row',
    alignItems:        'center',
    gap:               8,
  },
  iconBtn: {
    width: 36, height: 36, borderRadius: 10,
    backgroundColor: 'rgba(255,255,255,0.15)',
    alignItems: 'center', justifyContent: 'center',
  },
  navTitleWrap: { flex: 1, alignItems: 'center' },
  navTitle: { fontSize: 18, fontWeight: '800', color: WHITE, letterSpacing: 1 },
  navSub:   { fontSize: 9, color: 'rgba(255,255,255,0.5)', letterSpacing: 1.5, marginTop: 1 },
  docChip: {
    backgroundColor: 'rgba(255,255,255,0.18)', borderRadius: 20,
    paddingHorizontal: 10, paddingVertical: 5,
    borderWidth: 1, borderColor: 'rgba(255,255,255,0.28)',
  },
  docChipText: { fontSize: 11, color: WHITE, fontWeight: '600' },

  centreWrap: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 10 },
  loadingText: { fontSize: 14, color: TEXT_MID, fontWeight: '500', marginTop: 8 },
  emptyIconWrap: {
    width: 64, height: 64, borderRadius: 32,
    backgroundColor: BG,
    alignItems: 'center', justifyContent: 'center', marginBottom: 4,
  },
  emptyTitle: { fontSize: 15, fontWeight: '600', color: TEXT_MID },
  emptySub:   { fontSize: 12, color: '#9CA3AF', textAlign: 'center' },
  retryBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 8,
    backgroundColor: PURPLE, borderRadius: 12,
    paddingHorizontal: 20, paddingVertical: 11, marginTop: 6,
  },
  retryText: { fontSize: 14, fontWeight: '700', color: WHITE },

  scroll:        { flex: 1 },
  scrollContent: { paddingHorizontal: 16, paddingTop: 20, paddingBottom: 32 },

  sectionHeader: {
    flexDirection: 'row', alignItems: 'center',
    justifyContent: 'space-between', marginBottom: 10,
  },
  sectionHeaderLeft: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  sectionIconWrap: {
    width: 34, height: 34, borderRadius: 10,
    backgroundColor: '#EDE9FE',
    alignItems: 'center', justifyContent: 'center',
  },
  sectionTitle: { fontSize: 14, fontWeight: '700', color: TEXT_DARK },
  sectionSub:   { fontSize: 11, color: TEXT_MID, marginTop: 1 },

  refreshBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 5,
    backgroundColor: '#EDE9FE', borderRadius: 20,
    paddingHorizontal: 12, paddingVertical: 7,
    borderWidth: 1, borderColor: '#DDD6FE',
  },
  refreshText: { fontSize: 12, fontWeight: '700', color: PURPLE },

  progressTrack: {
    height: 5, backgroundColor: '#E5E7EB',
    borderRadius: 99, marginBottom: 16, overflow: 'hidden',
  },
  progressBar: { height: 5, backgroundColor: PURPLE, borderRadius: 99 },

  card: {
    backgroundColor: CARD,
    borderRadius:    20,
    borderWidth:     1,
    borderColor:     BORDER,
    overflow:        'hidden',
    shadowColor:     '#9CA3AF',
    shadowOffset:    { width: 0, height: 2 },
    shadowOpacity:   0.07,
    shadowRadius:    10,
    elevation:       3,
    marginBottom:    16,
  },

  row: {
    flexDirection: 'row', alignItems: 'center',
    paddingHorizontal: 16, paddingVertical: 14, gap: 14,
  },
  rowDisabled:  { backgroundColor: '#FAFAFA' },
  rowIconWrap: {
    width: 46, height: 46, borderRadius: 13,
    alignItems: 'center', justifyContent: 'center',
  },
  rowText:      { flex: 1 },
  rowLabel:     { fontSize: 14, fontWeight: '600', color: TEXT_DARK, letterSpacing: -0.1 },
  rowLabelOff:  { color: TEXT_LIGHT },
  rowDesc:      { fontSize: 11, color: TEXT_MID, marginTop: 2, lineHeight: 16 },
  rowDescOff:   { color: '#D1D5DB' },
  rowDivider:   { height: 1, backgroundColor: BORDER, marginLeft: 76 },

  statusChip: {
    flexDirection: 'row', alignItems: 'center', gap: 4,
    borderRadius: 20, paddingHorizontal: 8, paddingVertical: 4, borderWidth: 1,
  },
  statusChipOn:  { backgroundColor: '#F0FDF4', borderColor: '#BBF7D0' },
  statusChipOff: { backgroundColor: '#F9FAFB', borderColor: '#E5E7EB' },
  statusDot:    { width: 5, height: 5, borderRadius: 3 },
  statusDotOn:  { backgroundColor: '#22C55E' },
  statusDotOff: { backgroundColor: '#D1D5DB' },
  statusText:   { fontSize: 10, fontWeight: '700', letterSpacing: 0.5 },
  statusTextOn:  { color: '#15803D' },
  statusTextOff: { color: TEXT_LIGHT },

  infoBox: {
    flexDirection: 'row', alignItems: 'flex-start', gap: 10,
    backgroundColor: '#EDE9FE', borderRadius: 14,
    paddingHorizontal: 14, paddingVertical: 12,
    borderWidth: 1, borderColor: '#DDD6FE',
  },
  infoText: { flex: 1, fontSize: 12, color: '#5B21B6', lineHeight: 18, fontWeight: '500' },
});