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
  Switch,
} from 'react-native';
import { Ionicons } from '@react-native-vector-icons/ionicons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useAppStore } from '../Store/store';
import { DrawerActions, useNavigation, useFocusEffect } from '@react-navigation/native';


// ─────────────────────────────────────────────────────────────────────────────
// Storage key
// ─────────────────────────────────────────────────────────────────────────────
const SETTINGS_KEY = '@kot_visible_buttons';

// ─────────────────────────────────────────────────────────────────────────────
// Button definitions — mirrors HomeScreen ORDER_BUTTONS
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
  {
    key:   'GUEST',
    label: 'Guest',
    icon:  'person-outline',
    color: '#6C1FC9',
    bg:    '#F3EEFF',
    desc:  'Create orders for registered club members',
  },
  {
    key:   'VISITOR',
    label: 'Visitor',
    icon:  'walk-outline',
    color: '#0369A1',
    bg:    '#E0F2FE',
    desc:  'Orders for walk-in visitors without membership',
  },
  {
    key:   'EXECUTIVE_STAFF',
    label: 'Executive Staff',
    icon:  'briefcase-outline',
    color: '#0F766E',
    bg:    '#CCFBF1',
    desc:  'Staff meal orders for executive personnel',
  },
  {
    key:   'PITS',
    label: 'Pits',
    icon:  'grid-outline',
    color: '#B45309',
    bg:    '#FEF3C7',
    desc:  'Pit-side food and beverage orders',
  },
  {
    key:   'TABLES',
    label: 'Tables',
    icon:  'restaurant-outline',
    color: '#B91C1C',
    bg:    '#FEE2E2',
    desc:  'Dine-in table service orders',
  },
  {
    key:   'QR_SCAN',
    label: 'QR Scan',
    icon:  'qr-code-outline',
    color: '#1D4ED8',
    bg:    '#DBEAFE',
    desc:  'Scan member QR code to create an order',
  },
  {
    key:   'VIP',
    label: 'VIP',
    icon:  'star-outline',
    color: '#92400E',
    bg:    '#FDE68A',
    desc:  'High-priority VIP guest service orders',
  },
];

// Default — all enabled
const DEFAULT_VISIBLE: Record<string, boolean> = Object.fromEntries(
  ALL_BUTTONS.map(b => [b.key, true]),
);

// ─────────────────────────────────────────────────────────────────────────────
// Animated row
// ─────────────────────────────────────────────────────────────────────────────
function ButtonRow({
  config,
  enabled,
  onToggle,
  delay,
}: {
  config:   ButtonConfig;
  enabled:  boolean;
  onToggle: (key: string) => void;
  delay:    number;
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
      <TouchableOpacity
        style={[S.row, !enabled && S.rowDisabled]}
        onPress={() => onToggle(config.key)}
        activeOpacity={0.75}
      >
        {/* Icon block */}
        <View style={[S.rowIconWrap, { backgroundColor: enabled ? config.bg : '#F3F4F6' }]}>
          <Ionicons
            name={config.icon as any}
            size={22}
            color={enabled ? config.color : '#C4CCDA'}
          />
        </View>

        {/* Text */}
        <View style={S.rowText}>
          <Text style={[S.rowLabel, !enabled && S.rowLabelOff]}>{config.label}</Text>
          <Text style={[S.rowDesc,  !enabled && S.rowDescOff]}  numberOfLines={1}>
            {config.desc}
          </Text>
        </View>

        {/* Status chip + toggle */}
        <View style={S.rowRight}>
          <View style={[S.statusChip, enabled ? S.statusChipOn : S.statusChipOff]}>
            <View style={[S.statusDot, enabled ? S.statusDotOn : S.statusDotOff]} />
            <Text style={[S.statusText, enabled ? S.statusTextOn : S.statusTextOff]}>
              {enabled ? 'ON' : 'OFF'}
            </Text>
          </View>
          <Switch
            value={enabled}
            onValueChange={() => onToggle(config.key)}
            trackColor={{ false: '#E5E7EB', true: config.color + '55' }}
            thumbColor={enabled ? config.color : '#D1D5DB'}
            ios_backgroundColor="#E5E7EB"
          />
        </View>
      </TouchableOpacity>
    </Animated.View>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// SettingsScreen
// ─────────────────────────────────────────────────────────────────────────────
export default function SettingsScreen({ navigation }: { navigation: any }) {
  const device  = useAppStore(state => state.device);
   const nav          = useNavigation<any>();
  const session = useAppStore(state => state.session);

  const [visible,  setVisible]  = useState<Record<string, boolean>>(DEFAULT_VISIBLE);
  const [saved,    setSaved]    = useState(false);
  const savedFade = useRef(new Animated.Value(0)).current;

  // ── Load persisted settings ────────────────────────────────────────────────
  useEffect(() => {
    AsyncStorage.getItem(SETTINGS_KEY).then(raw => {
      if (raw) {
        try { setVisible(JSON.parse(raw)); } catch {}
      }
    });
  }, []);

  // ── Toggle ─────────────────────────────────────────────────────────────────
  function handleToggle(key: string) {
    setVisible(prev => {
      const next = { ...prev, [key]: !prev[key] };
      // Prevent disabling all buttons
      const anyOn = Object.values(next).some(Boolean);
      if (!anyOn) return prev;
      return next;
    });
    setSaved(false);
  }

  // ── Select all / none ──────────────────────────────────────────────────────
  function selectAll() {
    setVisible(Object.fromEntries(ALL_BUTTONS.map(b => [b.key, true])));
    setSaved(false);
  }

  // ── Save ───────────────────────────────────────────────────────────────────
  async function handleSave() {
    await AsyncStorage.setItem(SETTINGS_KEY, JSON.stringify(visible));
    setSaved(true);
    // Flash feedback
    Animated.sequence([
      Animated.timing(savedFade, { toValue: 1, duration: 200, useNativeDriver: true }),
      Animated.delay(1200),
      Animated.timing(savedFade, { toValue: 0, duration: 300, useNativeDriver: true }),
    ]).start();
  }

  const enabledCount = Object.values(visible).filter(Boolean).length;

  return (
    <View style={S.flex}>
      <StatusBar barStyle="light-content" backgroundColor={PURPLE_DEEP} />

      {/* ── Nav bar ── */}
      <View style={S.navBar}>
        {/* <TouchableOpacity
          style={S.navIconBtn}
          onPress={() => navigation.goBack()}
          activeOpacity={0.75}
        >
          <Ionicons name="arrow-back" size={20} color="#fff" />
        </TouchableOpacity> */}
         {/* Hamburger */}
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

      <ScrollView
        style={S.scroll}
        contentContainerStyle={S.scrollContent}
        showsVerticalScrollIndicator={false}
      >

        {/* ── Section header ── */}
        <View style={S.sectionHeader}>
          {/* Left: icon + title */}
          <View style={S.sectionHeaderLeft}>
            <View style={S.sectionIconWrap}>
              <Ionicons name="apps-outline" size={18} color={PURPLE} />
            </View>
            <View>
              <Text style={S.sectionTitle}>Home Screen Buttons</Text>
              <Text style={S.sectionSub}>
                {enabledCount} of {ALL_BUTTONS.length} buttons visible
              </Text>
            </View>
          </View>

          {/* Right: Select All pill */}
          <TouchableOpacity style={S.selectAllBtn} onPress={selectAll} activeOpacity={0.8}>
            <Ionicons name="checkmark-done-outline" size={13} color={PURPLE} />
            <Text style={S.selectAllText}>All</Text>
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
                enabled={visible[btn.key] ?? true}
                onToggle={handleToggle}
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
            Disabled buttons will appear grayed-out on the Home screen and cannot be tapped until re-enabled here.
          </Text>
        </View>

      </ScrollView>

      {/* ── Save bar ── */}
      <View style={S.saveBar}>
        {/* Saved toast */}
        <Animated.View style={[S.savedToast, { opacity: savedFade }]}>
          <Ionicons name="checkmark-circle" size={15} color="#22C55E" />
          <Text style={S.savedToastText}>Settings saved</Text>
        </Animated.View>

        <TouchableOpacity
          style={[S.saveBtn, saved && S.saveBtnDone]}
          onPress={handleSave}
          activeOpacity={0.85}
        >
          <Ionicons
            name={saved ? 'checkmark-circle-outline' : 'save-outline'}
            size={18}
            color={WHITE}
          />
          <Text style={S.saveBtnText}>{saved ? 'Saved' : 'Save Changes'}</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Tokens
// ─────────────────────────────────────────────────────────────────────────────
const PURPLE_DEEP = '#3B0F8C';
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

  // ── Nav bar ──
  navBar: {
    backgroundColor:   PURPLE_DEEP,
    paddingTop:        Platform.OS === 'ios' ? 52 : 32,
    paddingBottom:     14,
    paddingHorizontal: 12,
    flexDirection:     'row',
    alignItems:        'center',
    gap:               8,
  },
  navIconBtn: {
    width: 36, height: 36, borderRadius: 10,
    backgroundColor: 'rgba(255,255,255,0.12)',
    alignItems: 'center', justifyContent: 'center',
  },
  navTitleWrap: { flex: 1, alignItems: 'center' },
  navTitle: { fontSize: 18, fontWeight: '800', color: WHITE, letterSpacing: 1 },
  navSub:   { fontSize: 9,  color: 'rgba(255,255,255,0.5)', letterSpacing: 1.5, marginTop: 1 },
  docChip: {
    backgroundColor: 'rgba(255,255,255,0.18)', borderRadius: 20,
    paddingHorizontal: 10, paddingVertical: 5,
    borderWidth: 1, borderColor: 'rgba(255,255,255,0.28)',
  },
  docChipText: { fontSize: 11, color: WHITE, fontWeight: '600' },

  // ── Scroll ──
  scroll:        { flex: 1 },
  scrollContent: { paddingHorizontal: 16, paddingTop: 20, paddingBottom: 32 },

  // ── Section header ──
  sectionHeader: {
    flexDirection:  'row',
    alignItems:     'center',
    justifyContent: 'space-between',
    marginBottom:   10,
  },
  sectionHeaderLeft: {
    flexDirection: 'row',
    alignItems:    'center',
    gap:           10,
  },
  sectionIconWrap: {
    width: 34, height: 34, borderRadius: 10,
    backgroundColor: '#EDE9FE',
    alignItems: 'center', justifyContent: 'center',
  },
  sectionTitle: { fontSize: 14, fontWeight: '700', color: TEXT_DARK },
  sectionSub:   { fontSize: 11, color: TEXT_MID, marginTop: 1 },

  selectAllBtn: {
    flexDirection:    'row',
    alignItems:       'center',
    gap:              5,
    backgroundColor:  '#EDE9FE',
    borderRadius:     20,
    paddingHorizontal:12,
    paddingVertical:  7,
    borderWidth:      1,
    borderColor:      '#DDD6FE',
  },
  selectAllText: { fontSize: 12, fontWeight: '700', color: PURPLE },

  // ── Progress bar ──
  progressTrack: {
    height:        5,
    backgroundColor: '#E5E7EB',
    borderRadius:  99,
    marginBottom:  16,
    overflow:      'hidden',
  },
  progressBar: {
    height:        5,
    backgroundColor: PURPLE,
    borderRadius:  99,
  },

  // ── Card wrapper ──
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

  // ── Row ──
  row: {
    flexDirection:     'row',
    alignItems:        'center',
    paddingHorizontal: 16,
    paddingVertical:   14,
    gap:               14,
  },
  rowDisabled: {
    backgroundColor: '#FAFAFA',
  },
  rowIconWrap: {
    width:          46,
    height:         46,
    borderRadius:   13,
    alignItems:     'center',
    justifyContent: 'center',
  },
  rowText: { flex: 1 },
  rowLabel: {
    fontSize:   14,
    fontWeight: '600',
    color:      TEXT_DARK,
    letterSpacing: -0.1,
  },
  rowLabelOff: { color: TEXT_LIGHT },
  rowDesc: {
    fontSize:  11,
    color:     TEXT_MID,
    marginTop: 2,
    lineHeight:16,
  },
  rowDescOff: { color: '#D1D5DB' },
  rowRight: {
    flexDirection: 'row',
    alignItems:    'center',
    gap:           8,
  },
  rowDivider: {
    height:          1,
    backgroundColor: BORDER,
    marginLeft:      76,
  },

  // ── Status chip ──
  statusChip: {
    flexDirection:    'row',
    alignItems:       'center',
    gap:              4,
    borderRadius:     20,
    paddingHorizontal:7,
    paddingVertical:  3,
    borderWidth:      1,
  },
  statusChipOn:  { backgroundColor: '#F0FDF4', borderColor: '#BBF7D0' },
  statusChipOff: { backgroundColor: '#F9FAFB', borderColor: '#E5E7EB' },
  statusDot: {
    width:        5,
    height:       5,
    borderRadius: 3,
  },
  statusDotOn:  { backgroundColor: '#22C55E' },
  statusDotOff: { backgroundColor: '#D1D5DB' },
  statusText: { fontSize: 10, fontWeight: '700', letterSpacing: 0.5 },
  statusTextOn:  { color: '#15803D' },
  statusTextOff: { color: TEXT_LIGHT },

  // ── Info box ──
  infoBox: {
    flexDirection:     'row',
    alignItems:        'flex-start',
    gap:               10,
    backgroundColor:   '#EDE9FE',
    borderRadius:      14,
    paddingHorizontal: 14,
    paddingVertical:   12,
    borderWidth:       1,
    borderColor:       '#DDD6FE',
  },
  infoText: {
    flex:       1,
    fontSize:   12,
    color:      '#5B21B6',
    lineHeight: 18,
    fontWeight: '500',
  },

  // ── Save bar ──
  saveBar: {
    backgroundColor:   CARD,
    paddingHorizontal: 16,
    paddingTop:        12,
    paddingBottom:     Platform.OS === 'ios' ? 32 : 16,
    borderTopWidth:    1,
    borderTopColor:    BORDER,
    flexDirection:     'row',
    alignItems:        'center',
    justifyContent:    'space-between',
    gap:               12,
  },
  savedToast: {
    flexDirection: 'row',
    alignItems:    'center',
    gap:           6,
  },
  savedToastText: {
    fontSize:   13,
    fontWeight: '600',
    color:      '#15803D',
  },
  saveBtn: {
    flex:             1,
    flexDirection:    'row',
    alignItems:       'center',
    justifyContent:   'center',
    gap:              8,
    backgroundColor:  PURPLE,
    borderRadius:     14,
    paddingVertical:  14,
    shadowColor:      PURPLE,
    shadowOffset:     { width: 0, height: 4 },
    shadowOpacity:    0.3,
    shadowRadius:     10,
    elevation:        5,
  },
  saveBtnDone: {
    backgroundColor: '#16A34A',
    shadowColor:     '#16A34A',
  },
  saveBtnText: {
    fontSize:   15,
    fontWeight: '700',
    color:      WHITE,
    letterSpacing: 0.2,
  },
  iconBtn: {
    width: 36, height: 36, borderRadius: 10,
    backgroundColor: 'rgba(255,255,255,0.15)',
    alignItems: 'center', justifyContent: 'center',
  },
});