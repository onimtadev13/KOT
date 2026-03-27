import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  StatusBar,
  Platform,
  ActivityIndicator,
  Image,
  Animated,
} from 'react-native';
import { Ionicons } from '@react-native-vector-icons/ionicons';
import { useAppStore } from '../Store/store';
import {
  loadPitGuestDetails,
  loadPitDropDetails,
  PitGuestDetailResult,
  PitDropDetailResult,
} from '../Api/api';
import { DrawerActions, useNavigation, useFocusEffect } from '@react-navigation/native';

// ─────────────────────────────────────────────────────────────────────────────
// Action buttons config
// ─────────────────────────────────────────────────────────────────────────────
type ActionBtn = {
  key:   string;
  label: string;
  icon:  string;
  color: string;
  bg:    string;
};

const ACTION_BUTTONS: ActionBtn[] = [
  { key: 'SUMMARY',      label: 'Summary',      icon: 'bar-chart-outline',     color: '#6C1FC9', bg: '#F3EEFF' },
  { key: 'PAST_ORDERS',  label: 'Past Orders',  icon: 'time-outline',          color: '#0369A1', bg: '#E0F2FE' },
  { key: 'TABLE',        label: 'Table',        icon: 'easel-outline',         color: '#0F766E', bg: '#CCFBF1' },
  { key: 'SLOT',         label: 'Slot',         icon: 'grid-outline',          color: '#B45309', bg: '#FEF3C7' },
  { key: 'POINTS',       label: 'Points',       icon: 'star-outline',          color: '#B91C1C', bg: '#FEE2E2' },
  { key: 'DROP',         label: 'Drop',         icon: 'trending-down-outline', color: '#1D4ED8', bg: '#DBEAFE' },
  { key: 'PAST_DETAILS', label: 'Past Details', icon: 'document-text-outline', color: '#7C3AED', bg: '#EDE9FE' },
];

// ─────────────────────────────────────────────────────────────────────────────
// Format number
// ─────────────────────────────────────────────────────────────────────────────
function fmt(val: string | number | null | undefined): string {
  if (val === null || val === undefined || val === '') return '—';
  const n = Number(val);
  if (isNaN(n)) return String(val);
  return n.toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 2 });
}

// ─────────────────────────────────────────────────────────────────────────────
// PitsCustomerDetailsScreen
// ─────────────────────────────────────────────────────────────────────────────
export default function PitsCustomerDetailsScreen({
  navigation,
  route,
}: {
  navigation: any;
  route: any;
}) {
   const nav          = useNavigation<any>();
  const { MID, MName, tblCode } = route.params as {
    MID:     string;
    MName:   string;
    tblCode: string;
  };

  const device          = useAppStore(state => state.device);
  const setOrderContext = useAppStore(state => state.setOrderContext);  // ← wired
  const clearOrder      = useAppStore(state => state.clearOrder);       // ← reset on new customer
  const mac             = device?.UniqueId ?? '';

  const [guest,   setGuest]   = useState<PitGuestDetailResult | null>(null);
  const [drop,    setDrop]    = useState<PitDropDetailResult  | null>(null);
  const [loading, setLoading] = useState(true);
  const [error,   setError]   = useState<string | null>(null);

  // ── Bounce animation for rating ───────────────────────────────────────────
  const bounceAnim = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(bounceAnim, { toValue: 1.35, duration: 600, useNativeDriver: true }),
        Animated.timing(bounceAnim, { toValue: 1,    duration: 600, useNativeDriver: true }),
      ]),
    );
    loop.start();
    return () => loop.stop();
  }, [bounceAnim]);

  useEffect(() => {
    // New customer → reset any previous order
    clearOrder();
    fetchAll();
  }, [MID]); // eslint-disable-line react-hooks/exhaustive-deps

  async function fetchAll() {
    setLoading(true);
    setError(null);
    try {
      const [guestData, dropData] = await Promise.all([
        loadPitGuestDetails(MID),
        loadPitDropDetails(MID, mac),
      ]);
      setGuest(guestData);
      setDrop(dropData);
    } catch (e: any) {
      setError('Failed to load customer details.');
    } finally {
      setLoading(false);
    }
  }

  function handleAction(key: string) {
    console.log('[PIT CUSTOMER] Action:', key, 'MID:', MID);
  }

  // ── "Add Order" — set full context then go to Menu ────────────────────────
  function handlePlus() {
    // Populate orderContext so CurrentOrderScreen can display everything
    setOrderContext({
      type:        'pits',
      memberId:    MID,
      memberName:  guest?.MName ?? MName,
      tableCode:   tblCode,
      pitName:     tblCode,   // keep pitName in sync if used elsewhere
      // Gaming stats — pulled straight from the drop API result
      currentDrop: drop?.CurrentDrop   ?? null,
      points:      drop?.Coupon        ?? null,
      avgBet:      drop?.AvgBet        ?? null,
    });

    console.log('[PIT CUSTOMER] Order context set for MID:', MID);
    navigation.navigate('Menu');
  }

  // ── Derived values ────────────────────────────────────────────────────────
  const displayName  = guest?.MName     ?? MName ?? '?';
  const displayImage = guest?.MemImage2 ?? '';
  const initial      = displayName.charAt(0).toUpperCase();
  const hasImage     = displayImage.trim() !== '';
  const rating       = guest?.GuestRating ?? '';

  // ── Avatar ────────────────────────────────────────────────────────────────
  function Avatar() {
    if (hasImage) {
      return (
        <Image
          source={{ uri: `data:image/png;base64,${displayImage}` }}
          style={S.avatarImg}
          resizeMode="cover"
        />
      );
    }
    return (
      <View style={[S.avatarImg, S.avatarFallback]}>
        <Text style={S.avatarInitial}>{initial}</Text>
      </View>
    );
  }

  // ── Stat row inside profile card ──────────────────────────────────────────
  function StatRow({
    label, value, icon, color, isLast = false,
  }: {
    label: string; value: string; icon: string; color: string; isLast?: boolean;
  }) {
    return (
      <>
        <View style={S.statRow}>
          <View style={S.statRowLeft}>
            <View style={[S.statRowIcon, { backgroundColor: color + '18' }]}>
              <Ionicons name={icon as any} size={13} color={color} />
            </View>
            <Text style={S.statRowLabel}>{label}</Text>
          </View>
          <Text style={[S.statRowValue, { color }]}>{value}</Text>
        </View>
        {!isLast && <View style={S.statDivider} />}
      </>
    );
  }

  // ── Action button ─────────────────────────────────────────────────────────
  function ActionButton({ btn }: { btn: ActionBtn }) {
    return (
      <TouchableOpacity
        style={S.actionBtn}
        onPress={() => handleAction(btn.key)}
        activeOpacity={0.82}
      >
        <View style={[S.actionIconWrap, { backgroundColor: btn.bg }]}>
          <Ionicons name={btn.icon as any} size={22} color={btn.color} />
        </View>
        <Text style={S.actionLabel}>{btn.label}</Text>
        <View style={[S.actionArrow, { backgroundColor: btn.bg }]}>
          <Ionicons name="chevron-forward" size={11} color={btn.color} />
        </View>
      </TouchableOpacity>
    );
  }

  // ── Render ────────────────────────────────────────────────────────────────
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
          <Text style={S.navTitle} numberOfLines={1}>{tblCode}</Text>
          <Text style={S.navSub}>KITCHEN ORDER TICKET</Text>
        </View>
        {device?.Doc_No ? (
          <View style={S.docChip}>
            <Text style={S.docChipText}>#{device.Doc_No}</Text>
          </View>
        ) : (
          <View style={{ width: 60 }} />
        )}
      </View>

      {/* ── Content ── */}
      {loading ? (
        <View style={S.centerWrap}>
          <ActivityIndicator size="large" color={AMBER} />
          <Text style={S.loadingText}>Loading customer details…</Text>
        </View>
      ) : error ? (
        <View style={S.centerWrap}>
          <View style={S.emptyIconWrap}>
            <Ionicons name="cloud-offline-outline" size={32} color={TEXT_LIGHT} />
          </View>
          <Text style={S.emptyTitle}>Could not load details</Text>
          <Text style={S.emptySub}>{error}</Text>
          <TouchableOpacity style={S.retryBtn} onPress={fetchAll} activeOpacity={0.8}>
            <Ionicons name="refresh-outline" size={15} color={WHITE} />
            <Text style={S.retryBtnText}>Retry</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <ScrollView
          style={S.scroll}
          contentContainerStyle={S.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          {/* ── Combined profile + stats card ── */}
          <View style={S.profileCard}>

            {/* Purple header band */}
            <View style={S.profileBand} />

            {/* ── Top section: avatar · name/id · table/rating ── */}
            <View style={S.profileTopRow}>

              {/* Avatar */}
              <View style={S.avatarBorder}>
                <Avatar />
              </View>

              {/* Name + ID */}
              <View style={S.profileLeft}>
                <Text style={S.profileName} numberOfLines={2}>{displayName}</Text>
                <View style={S.memberIdChip}>
                  <Ionicons name="card-outline" size={11} color={AMBER} />
                  <Text style={S.memberIdText}>ID: {MID}</Text>
                </View>
              </View>

              {/* Table + Rating */}
              <View style={S.profileRight}>
                <View style={S.tableBadge}>
                  <Ionicons name="easel-outline" size={11} color={PURPLE_DEEP} />
                  <Text style={S.tableBadgeText}>{tblCode}</Text>
                </View>

                {!!rating && (
                  <Animated.View
                    style={[S.ratingBadge, { transform: [{ scale: bounceAnim }] }]}
                  >
                    <Ionicons name="star" size={11} color={WHITE} />
                    <Text style={S.ratingBadgeText}>{rating}</Text>
                  </Animated.View>
                )}
              </View>
            </View>

            {/* Divider */}
            <View style={S.cardInnerDivider} />

            {/* Stats */}
            <View style={S.statsSection}>
              <StatRow
                label="Current Drop (Table)"
                value={fmt(drop?.CurrentDrop)}
                icon="easel-outline"
                color="#0369A1"
              />
              <StatRow
                label="Current Drop (Slot)"
                value={fmt(drop?.Current_Drop_Slot ?? null)}
                icon="grid-outline"
                color="#B45309"
              />
              <StatRow
                label="Points"
                value={fmt(drop?.Coupon)}
                icon="pricetag-outline"
                color="#B91C1C"
              />
              <StatRow
                label="Avg Bet"
                value={fmt(drop?.AvgBet)}
                icon="trending-up-outline"
                color="#0F766E"
              />
              <StatRow
                label="Actual Drop"
                value={fmt(drop?.Actual_Drop)}
                icon="arrow-down-circle-outline"
                color="#1D4ED8"
                isLast
              />
            </View>
          </View>

          {/* ── Action buttons ── */}
          <Text style={S.sectionTitle}>Actions</Text>
          <View style={S.actionsGrid}>
            {ACTION_BUTTONS.map((btn, index) => {
              const isLast    = index === ACTION_BUTTONS.length - 1;
              const isOdd     = ACTION_BUTTONS.length % 2 !== 0;
              const fullWidth = isLast && isOdd;
              return (
                <View
                  key={btn.key}
                  style={[S.actionBtnWrap, fullWidth && S.actionBtnWrapFull]}
                >
                  <ActionButton btn={btn} />
                </View>
              );
            })}
          </View>

          {/* ── Add Order button ── */}
          <TouchableOpacity
            style={S.addOrderBtn}
            onPress={handlePlus}
            activeOpacity={0.85}
          >
            <View style={S.addOrderIconWrap}>
              <Ionicons name="add" size={22} color={WHITE} />
            </View>
            <Text style={S.addOrderLabel}>Add Order</Text>
          </TouchableOpacity>

        </ScrollView>
      )}
    </View>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Tokens
// ─────────────────────────────────────────────────────────────────────────────
const PURPLE_DEEP = '#3B0F8C';
const PURPLE      = '#6C1FC9';
const AMBER       = '#B45309';
const WHITE       = '#FFFFFF';
const BG          = '#F5F6FA';
const CARD        = '#FFFFFF';
const BORDER      = '#EDF0F4';
const TEXT_DARK   = '#1A1D2E';
const TEXT_MID    = '#6B7280';
const TEXT_LIGHT  = '#B0B8C1';

// ─────────────────────────────────────────────────────────────────────────────
// Styles
// ─────────────────────────────────────────────────────────────────────────────
const S = StyleSheet.create({
  flex: { flex: 1, backgroundColor: BG },

  // ── Nav bar ──
  navBar: {
    backgroundColor: PURPLE_DEEP,
    paddingTop: Platform.OS === 'ios' ? 52 : 32,
    paddingBottom: 14,
    paddingHorizontal: 12,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  navIconBtn: {
    width: 36, height: 36, borderRadius: 10,
    backgroundColor: 'rgba(255,255,255,0.12)',
    alignItems: 'center', justifyContent: 'center',
  },
  navTitleWrap: { flex: 1, alignItems: 'center' },
  navTitle: { fontSize: 18, fontWeight: '800', color: WHITE, letterSpacing: 1 },
  navSub:   { fontSize: 9,  fontWeight: '600', color: 'rgba(255,255,255,0.55)', letterSpacing: 1.5, marginTop: 1 },
  docChip: {
    backgroundColor: 'rgba(255,255,255,0.18)', borderRadius: 20,
    paddingHorizontal: 10, paddingVertical: 5,
    borderWidth: 1, borderColor: 'rgba(255,255,255,0.28)',
  },
  docChipText: { fontSize: 11, color: WHITE, fontWeight: '600' },

  // ── Scroll ──
  scroll: { flex: 1 },
  scrollContent: { paddingBottom: 36 },

  // ── Combined profile + stats card ──
  profileCard: {
    backgroundColor: CARD,
    marginHorizontal: 14, marginTop: 14,
    borderRadius: 20,
    borderWidth: 1, borderColor: BORDER,
    overflow: 'hidden',
    shadowColor: '#9CA3AF',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08, shadowRadius: 10, elevation: 4,
  },
  profileBand: {
    width: '100%', height: 56,
    backgroundColor: PURPLE_DEEP,
  },
  profileTopRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    paddingHorizontal: 16,
    paddingBottom: 16,
    marginTop: -28,
    gap: 12,
  },
  avatarBorder: {
    width: 72, height: 72, borderRadius: 36,
    borderWidth: 3, borderColor: WHITE,
    overflow: 'hidden', flexShrink: 0,
    shadowColor: PURPLE_DEEP,
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.22, shadowRadius: 6, elevation: 5,
  },
  avatarImg:      { width: '100%', height: '100%' },
  avatarFallback: { backgroundColor: AMBER, alignItems: 'center', justifyContent: 'center' },
  avatarInitial:  { fontSize: 28, fontWeight: '900', color: WHITE },

  profileLeft: { flex: 1, marginTop: 30 },
  profileName: {
    fontSize: 15, fontWeight: '800',
    color: TEXT_DARK, lineHeight: 20,
    marginBottom: 6, letterSpacing: 0.1,
  },
  memberIdChip: {
    flexDirection: 'row', alignItems: 'center', gap: 4,
    backgroundColor: '#FEF3C7',
    alignSelf: 'flex-start',
    paddingHorizontal: 8, paddingVertical: 3,
    borderRadius: 20, borderWidth: 1, borderColor: '#FDE68A',
  },
  memberIdText: { fontSize: 11, fontWeight: '700', color: AMBER },

  profileRight: { alignItems: 'flex-end', gap: 8, marginTop: 30, paddingVertical: 10 },
  tableBadge: {
    flexDirection: 'row', alignItems: 'center', gap: 4,
    backgroundColor: '#EDE9FE',
    paddingHorizontal: 8, paddingVertical: 4,
    borderRadius: 20, borderWidth: 1, borderColor: '#DDD6FE',
  },
  tableBadgeText: { fontSize: 11, fontWeight: '700', color: PURPLE_DEEP },
  ratingBadge: {
    flexDirection: 'row', alignItems: 'center', gap: 4,
    backgroundColor: '#DC2626',
    paddingHorizontal: 10, paddingVertical: 5,
    borderRadius: 20,
    shadowColor: '#DC2626',
    shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.4, shadowRadius: 6, elevation: 4,
  },
  ratingBadgeText: { fontSize: 11, fontWeight: '900', color: WHITE, letterSpacing: 0.5 },

  cardInnerDivider: {
    height: 1, backgroundColor: BORDER, marginHorizontal: 16, marginBottom: 4,
  },

  statsSection: { paddingBottom: 4 },
  statRow: {
    flexDirection: 'row', alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16, paddingVertical: 12,
  },
  statRowLeft: { flexDirection: 'row', alignItems: 'center', gap: 10, flex: 1 },
  statRowIcon: {
    width: 28, height: 28, borderRadius: 7,
    alignItems: 'center', justifyContent: 'center',
  },
  statRowLabel: { fontSize: 13, fontWeight: '500', color: TEXT_DARK },
  statRowValue: { fontSize: 14, fontWeight: '800', letterSpacing: -0.3 },
  statDivider:  { height: 1, backgroundColor: BORDER, marginLeft: 54 },

  // ── Section title ──
  sectionTitle: {
    fontSize: 11, fontWeight: '700', color: TEXT_MID,
    letterSpacing: 1.5, textTransform: 'uppercase',
    marginTop: 20, marginBottom: 10, marginHorizontal: 18,
  },

  // ── Actions grid ──
  actionsGrid: {
    flexDirection: 'row', flexWrap: 'wrap',
    marginHorizontal: 14, gap: 10,
  },
  actionBtnWrap:     { width: '47%' },
  actionBtnWrapFull: { width: '100%' },
  actionBtn: {
    backgroundColor: CARD,
    borderRadius: 14,
    borderWidth: 1, borderColor: BORDER,
    padding: 14,
    alignItems: 'flex-start',
    shadowColor: '#9CA3AF',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.07, shadowRadius: 6, elevation: 2,
    position: 'relative',
  },
  actionIconWrap: {
    width: 46, height: 46, borderRadius: 13,
    alignItems: 'center', justifyContent: 'center', marginBottom: 10,
  },
  actionLabel: { fontSize: 13, fontWeight: '700', color: TEXT_DARK, letterSpacing: -0.1 },
  actionArrow: {
    position: 'absolute', top: 10, right: 10,
    width: 22, height: 22, borderRadius: 11,
    alignItems: 'center', justifyContent: 'center',
  },

  // ── Add Order button ──
  addOrderBtn: {
    flexDirection: 'row', alignItems: 'center',
    justifyContent: 'center', gap: 10,
    backgroundColor: PURPLE_DEEP,
    marginHorizontal: 14, marginTop: 20,
    borderRadius: 16, paddingVertical: 16,
    shadowColor: PURPLE_DEEP,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.35, shadowRadius: 10, elevation: 6,
  },
  addOrderIconWrap: {
    width: 32, height: 32, borderRadius: 16,
    backgroundColor: 'rgba(255,255,255,0.2)',
    alignItems: 'center', justifyContent: 'center',
  },
  addOrderLabel: { fontSize: 16, fontWeight: '800', color: WHITE, letterSpacing: 0.5 },

  // ── Center states ──
  centerWrap: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 12 },
  loadingText: { fontSize: 14, color: TEXT_MID, fontWeight: '500' },
  emptyIconWrap: {
    width: 64, height: 64, borderRadius: 32,
    backgroundColor: '#F3F4F6',
    alignItems: 'center', justifyContent: 'center', marginBottom: 4,
  },
  emptyTitle: { fontSize: 15, fontWeight: '600', color: TEXT_MID },
  emptySub:   { fontSize: 12, color: TEXT_LIGHT, textAlign: 'center' },
  retryBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    backgroundColor: PURPLE_DEEP,
    paddingHorizontal: 20, paddingVertical: 10,
    borderRadius: 20, marginTop: 4,
  },
  retryBtnText: { fontSize: 13, fontWeight: '700', color: WHITE },
  iconBtn: {
    width: 36, height: 36, borderRadius: 10,
    backgroundColor: 'rgba(255,255,255,0.15)',
    alignItems: 'center', justifyContent: 'center',
  },

});