import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  StatusBar,
  Platform,
} from 'react-native';
import { DrawerActions, useNavigation, useFocusEffect } from '@react-navigation/native';
import { Ionicons } from '@react-native-vector-icons/ionicons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useAppStore } from '../Store/store';

// ─────────────────────────────────────────────────────────────────────────────
// Must match SettingsScreen SETTINGS_KEY exactly
// ─────────────────────────────────────────────────────────────────────────────
const SETTINGS_KEY = '@kot_visible_buttons';

type OrderButton = {
  key:   string;
  label: string;
  icon:  string;
  color: string;
  bg:    string;
};

const ORDER_BUTTONS: OrderButton[] = [
  { key: 'GUEST',           label: 'Guest',          icon: 'person-outline',     color: '#6C1FC9', bg: '#F3EEFF' },
  { key: 'VISITOR',         label: 'Visitor',         icon: 'walk-outline',       color: '#0369A1', bg: '#E0F2FE' },
  { key: 'EXECUTIVE_STAFF', label: 'Executive Staff', icon: 'briefcase-outline',  color: '#0F766E', bg: '#CCFBF1' },
  { key: 'PITS',            label: 'Pits',            icon: 'grid-outline',       color: '#B45309', bg: '#FEF3C7' },
  { key: 'TABLES',          label: 'Tables',          icon: 'restaurant-outline', color: '#B91C1C', bg: '#FEE2E2' },
  { key: 'QR_SCAN',         label: 'QR Scan',         icon: 'qr-code-outline',    color: '#1D4ED8', bg: '#DBEAFE' },
  { key: 'VIP',             label: 'VIP',             icon: 'star-outline',       color: '#92400E', bg: '#FDE68A' },
];

// Default — all enabled (matches SettingsScreen default)
const DEFAULT_VISIBLE: Record<string, boolean> = Object.fromEntries(
  ORDER_BUTTONS.map(b => [b.key, true]),
);

export default function HomeScreen({ navigation }: { navigation: any }) {
  const nav          = useNavigation<any>();
  const session      = useAppStore(state => state.session);
  const device       = useAppStore(state => state.device);
  const clearSession = useAppStore(state => state.clearSession);
  const orderItemCount = useAppStore(state => state.orderItemCount);

  const empName  = session?.Emp_Name ?? 'User';
  const itemCount = orderItemCount();

  const [buttonVisible, setButtonVisible] = useState<Record<string, boolean>>(DEFAULT_VISIBLE);

  // ── Reload visibility every time this screen comes into focus ──────────────
  // This ensures settings changes are reflected immediately on return
  useFocusEffect(
    useCallback(() => {
      AsyncStorage.getItem(SETTINGS_KEY).then(raw => {
        if (raw) {
          try { setButtonVisible(JSON.parse(raw)); } catch {}
        }
      });
    }, []),
  );

  function handleLogout() {
    clearSession();
    navigation.replace('Login');
  }

  function handleOrderButton(key: string) {
    switch (key) {
      case 'GUEST':           navigation.navigate('GuestDetails');   break;
      case 'VISITOR':         navigation.navigate('VisitorDetails'); break;
      case 'EXECUTIVE_STAFF': navigation.navigate('ExecutiveStaff'); break;
      case 'PITS':            navigation.navigate('PitsDetails');    break;
      // case 'TABLES':       navigation.navigate('TablesDetails');  break;
      // case 'QR_SCAN':      navigation.navigate('QRScanDetails');  break;
      // case 'VIP':          navigation.navigate('VIPDetails');     break;
      default: break;
    }
  }

  return (
    <View style={S.flex}>
      <StatusBar barStyle="light-content" backgroundColor={PURPLE} />

      {/* ── Purple header ── */}
      <View style={S.header}>
        <View style={S.headerRow}>

          {/* Hamburger */}
          <TouchableOpacity
            style={S.iconBtn}
            onPress={() => nav.dispatch(DrawerActions.openDrawer())}
            activeOpacity={0.75}
          >
            <Ionicons name="menu-outline" size={22} color="#fff" />
          </TouchableOpacity>

          {/* Title */}
          <View style={S.headerTitleWrap}>
            <Text style={S.headerTitle}>KOT</Text>
            <Text style={S.headerSub}>Kitchen Order Ticket</Text>
          </View>

          {/* Right actions */}
          <View style={S.headerActions}>         
            <TouchableOpacity style={S.iconBtn}>
              <Ionicons name="notifications-outline" size={20} color="#fff" />
            </TouchableOpacity>
            <TouchableOpacity style={S.iconBtn} onPress={handleLogout}>
              <Ionicons name="log-out-outline" size={20} color="#fff" />
            </TouchableOpacity>
          </View>
        </View>

        {/* Greeting row */}
        <View style={S.greetRow}>
          <View style={S.greetAvatar}>
            <Text style={S.greetAvatarText}>{empName.charAt(0).toUpperCase()}</Text>
          </View>
          <View style={S.greetInfo}>
            <Text style={S.greetName}>Hello, {empName}</Text>
            <Text style={S.greetRole}>{session?.TabLocation ?? 'Kitchen Staff'}</Text>
          </View>
          {device?.Doc_No ? (
            <View style={S.docChip}>
              <View style={S.docChipIconRow}>
                <Ionicons name="document-text-outline" size={11} color={ORANGE} />
                <Text style={S.docChipLabel}>Doc No</Text>
              </View>
              <Text style={S.docChipValue}>{device.Doc_No}</Text>
            </View>
          ) : null}
        </View>
      </View>

      <ScrollView
        style={S.scroll}
        contentContainerStyle={S.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <View style={S.grid}>
          {ORDER_BUTTONS.map((btn, index) => {
            const isEnabled = buttonVisible[btn.key] ?? true;
            const isLast    = index === ORDER_BUTTONS.length - 1;
            const isOdd     = ORDER_BUTTONS.length % 2 !== 0;
            const fullWidth = isLast && isOdd;

            return (
              <TouchableOpacity
                key={btn.key}
                style={[
                  S.gridCard,
                  fullWidth && S.gridCardFull,
                  !isEnabled && S.gridCardDisabled,
                ]}
                onPress={() => isEnabled && handleOrderButton(btn.key)}
                activeOpacity={isEnabled ? 0.82 : 1}
              >
                {/* Disabled overlay badge */}
                {!isEnabled && (
                  <View style={S.disabledBadge}>
                    <Ionicons name="ban-outline" size={10} color="#9CA3AF" />
                    <Text style={S.disabledBadgeText}>OFF</Text>
                  </View>
                )}

                <View style={[S.cardIconWrap, { backgroundColor: isEnabled ? btn.bg : '#F3F4F6' }]}>
                  <Ionicons
                    name={btn.icon as any}
                    size={26}
                    color={isEnabled ? btn.color : '#C4CCDA'}
                  />
                </View>

                <Text style={[
                  S.cardLabel,
                  fullWidth && { flex: 1 },
                  !isEnabled && S.cardLabelDisabled,
                ]}>
                  {btn.label}
                </Text>

                <View style={[
                  S.cardArrow,
                  { backgroundColor: isEnabled ? btn.bg : '#F3F4F6' },
                ]}>
                  <Ionicons
                    name="chevron-forward"
                    size={12}
                    color={isEnabled ? btn.color : '#C4CCDA'}
                  />
                </View>
              </TouchableOpacity>
            );
          })}
        </View>
      </ScrollView>
    </View>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Tokens
// ─────────────────────────────────────────────────────────────────────────────
const PURPLE = '#6C1FC9';
const ORANGE = '#F5830A';
const WHITE  = '#FFFFFF';
const BG     = '#F5F6FA';
const CARD   = '#FFFFFF';
const BORDER = '#EDF0F4';
const TEXT_DARK = '#1A1D2E';

const S = StyleSheet.create({
  flex: { flex: 1, backgroundColor: BG },

  // ── Header ──
  header: {
    backgroundColor:       PURPLE,
    paddingTop:            Platform.OS === 'ios' ? 56 : 36,
    paddingBottom:         24,
    paddingHorizontal:     20,
    borderBottomLeftRadius:  28,
    borderBottomRightRadius: 28,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems:    'center',
    marginBottom:  18,
    gap:           10,
  },
  headerTitleWrap: { flex: 1 },
  headerTitle: { fontSize: 22, fontWeight: '800', color: WHITE, letterSpacing: 2 },
  headerSub:   { fontSize: 10, color: 'rgba(255,255,255,0.6)', letterSpacing: 1, marginTop: 1 },
  headerActions: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  iconBtn: {
    width: 36, height: 36, borderRadius: 10,
    backgroundColor: 'rgba(255,255,255,0.15)',
    alignItems: 'center', justifyContent: 'center',
  },
  badge: {
    position: 'absolute', top: -4, right: -4,
    minWidth: 16, height: 16, borderRadius: 8,
    backgroundColor: ORANGE,
    alignItems: 'center', justifyContent: 'center',
    paddingHorizontal: 3,
    borderWidth: 1.5, borderColor: PURPLE,
  },
  badgeText: { fontSize: 9, fontWeight: '800', color: WHITE },

  greetRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  greetAvatar: {
    width: 44, height: 44, borderRadius: 22,
    backgroundColor: 'rgba(255,255,255,0.2)',
    alignItems: 'center', justifyContent: 'center',
    borderWidth: 2, borderColor: 'rgba(255,255,255,0.3)',
  },
  greetAvatarText: { fontSize: 18, fontWeight: '800', color: WHITE },
  greetInfo: { flex: 1 },
  greetName: { fontSize: 15, fontWeight: '700', color: WHITE, letterSpacing: 0.1 },
  greetRole: { fontSize: 11, color: 'rgba(255,255,255,0.6)', marginTop: 2 },
  docChip: {
    backgroundColor: '#FFF3E6', borderRadius: 12,
    paddingHorizontal: 12, paddingVertical: 8,
    alignItems: 'center',
    borderWidth: 1.5, borderColor: ORANGE,
    minWidth: 84,
    shadowColor: ORANGE, shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25, shadowRadius: 6, elevation: 4,
  },
  docChipIconRow: { flexDirection: 'row', alignItems: 'center', gap: 3, marginBottom: 2 },
  docChipLabel:  { fontSize: 9, color: ORANGE, fontWeight: '700', letterSpacing: 0.8, textTransform: 'uppercase' },
  docChipValue:  { fontSize: 15, color: '#B45309', fontWeight: '800', letterSpacing: -0.3 },

  scroll:        { flex: 1 },
  scrollContent: { paddingBottom: 32 },

  // ── Grid ──
  grid: {
    flexDirection: 'row', flexWrap: 'wrap',
    paddingHorizontal: 16, paddingTop: 16, gap: 12,
  },
  gridCard: {
    width:           '47%',
    backgroundColor: CARD,
    borderRadius:    16,
    borderWidth:     1,
    borderColor:     BORDER,
    padding:         16,
    alignItems:      'flex-start',
    shadowColor:     '#9CA3AF',
    shadowOffset:    { width: 0, height: 2 },
    shadowOpacity:   0.08,
    shadowRadius:    8,
    elevation:       3,
    position:        'relative',
  },
  gridCardFull: {
    width:         '100%',
    flexDirection: 'row',
    alignItems:    'center',
    gap:           16,
  },
  gridCardDisabled: {
    backgroundColor: '#FAFAFA',
    borderColor:     '#EBEBEB',
    shadowOpacity:   0,
    elevation:       0,
    opacity:         0.7,
  },

  cardIconWrap: {
    width: 52, height: 52, borderRadius: 14,
    alignItems: 'center', justifyContent: 'center',
    marginBottom: 12,
  },
  cardLabel: {
    fontSize: 14, fontWeight: '700', color: TEXT_DARK, letterSpacing: -0.2,
  },
  cardLabelDisabled: { color: '#C4CCDA' },
  cardArrow: {
    position: 'absolute', top: 12, right: 12,
    width: 22, height: 22, borderRadius: 11,
    alignItems: 'center', justifyContent: 'center',
  },

  // Disabled "OFF" badge in top-left
  disabledBadge: {
    position:         'absolute',
    top:              10,
    left:             10,
    flexDirection:    'row',
    alignItems:       'center',
    gap:              3,
    backgroundColor:  '#F3F4F6',
    borderRadius:     20,
    paddingHorizontal:6,
    paddingVertical:  2,
    borderWidth:      1,
    borderColor:      '#E5E7EB',
    zIndex:           1,
  },
  disabledBadgeText: { fontSize: 9, fontWeight: '700', color: '#9CA3AF', letterSpacing: 0.5 },
});