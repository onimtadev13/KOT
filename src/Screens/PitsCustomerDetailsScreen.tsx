import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  StatusBar,
  Platform,
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
import { DrawerActions, useNavigation } from '@react-navigation/native';
import colors from '../themes/colors';
import LottieView from 'lottie-react-native';

// ─────────────────────────────────────────────────────────────────────────────
// Shorthand alias
// ─────────────────────────────────────────────────────────────────────────────
const C = colors.pitCustomer;

// ─────────────────────────────────────────────────────────────────────────────
// Action buttons config — sourced from colors
// ─────────────────────────────────────────────────────────────────────────────
type ActionBtn = {
  key:   string;
  label: string;
  icon:  string;
  color: string;
  bg:    string;
};

const ACTION_BUTTONS: ActionBtn[] = colors.pitCustomer.actions;

// ─────────────────────────────────────────────────────────────────────────────
// Format number
// ─────────────────────────────────────────────────────────────────────────────
function fmt(val: string | number | null | undefined): string {
  if (val === null || val === undefined || val === '') return '—';
  const n = Number(val);
  if (isNaN(n)) return String(val);
  return n.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
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
  const nav = useNavigation<any>();
  const { MID, MName, tblCode } = route.params as {
    MID:     string;
    MName:   string;
    tblCode: string;
  };

  const device          = useAppStore(state => state.device);
  const setOrderContext = useAppStore(state => state.setOrderContext);
  const clearOrder      = useAppStore(state => state.clearOrder);
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
 
  switch (key) {
    case 'PAST_ORDERS':
      navigation.navigate('PitsPastOrders', {
        MID,
        MName: guest?.MName ?? MName,
        tblCode,
      });
      break;
 
    // Add more cases here as you build those screens:
    // case 'SUMMARY':      navigation.navigate('PitsSummary',     { MID, MName, tblCode }); break;
    // case 'TABLE':        navigation.navigate('PitsTable',       { MID, MName, tblCode }); break;
    // case 'SLOT':         navigation.navigate('PitsSlot',        { MID, MName, tblCode }); break;
    // case 'POINTS':       navigation.navigate('PitsPoints',      { MID, MName, tblCode }); break;
    // case 'DROP':         navigation.navigate('PitsDrop',        { MID, MName, tblCode }); break;
    // case 'PAST_DETAILS': navigation.navigate('PitsPastDetails', { MID, MName, tblCode }); break;
 
    default:
      break;
  }
}
 

  // ── "Add Order" — set full context then go to Menu ────────────────────────
  function handlePlus() {
    setOrderContext({
      type:        'pits',
      memberId:    MID,
      memberName:  guest?.MName ?? MName,
      tableCode:   tblCode,
      pitName:     tblCode,
      currentDrop: drop?.CurrentDrop ?? null,
      points:      drop?.Coupon      ?? null,
      avgBet:      drop?.AvgBet      ?? null,
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
      <StatusBar barStyle="light-content" backgroundColor={C.purpleDeep} />

      {/* ── Nav bar ── */}
      <View style={S.navBar}>
        <TouchableOpacity
          style={S.iconBtn}
          onPress={() => nav.dispatch(DrawerActions.openDrawer())}
          activeOpacity={0.75}
        >
          <Ionicons name="menu-outline" size={22} color={colors.white} />
        </TouchableOpacity>

        <View style={S.navTitleWrap}>
          <Text style={S.navTitle} numberOfLines={1}>{tblCode}</Text>
          <Text style={S.navSub}>KITCHEN ORDER TICKET</Text>
        </View>

        {/* ── Doc chip — matches ExecutiveStaffScreen ── */}
        {device?.Doc_No ? (
          <View style={S.docChip}>
            <View style={S.docChipIconRow}>
              <Ionicons name="document-text-outline" size={10} color={colors.docChip.labelText} />
              <Text style={S.docChipLabel}>Doc No</Text>
            </View>
            <Text style={S.docChipValue}>{device.Doc_No}</Text>
          </View>
        ) : (
          <View style={{ width: 72 }} />
        )}
      </View>

      {/* ── Content ── */}
      {loading ? (
        <View style={S.centerWrap}>
          {/* <ActivityIndicator size="large" color={C.amber} />
          <Text style={S.loadingText}>Loading customer details…</Text> */}
          <LottieView
            source={require('../../assets/animations/Loading_Animation.json')}
            autoPlay
            loop
            style={{ width: 120, height: 120 }}
          />

        </View>
      ) : error ? (
        <View style={S.centerWrap}>
          <View style={S.emptyIconWrap}>
            <Ionicons name="cloud-offline-outline" size={32} color={C.textLight} />
          </View>
          <Text style={S.emptyTitle}>Could not load details</Text>
          <Text style={S.emptySub}>{error}</Text>
          <TouchableOpacity style={S.retryBtn} onPress={fetchAll} activeOpacity={0.8}>
            <Ionicons name="refresh-outline" size={15} color={colors.white} />
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

            <View style={S.profileBand} />

            <View style={S.profileTopRow}>
              <View style={S.avatarBorder}>
                <Avatar />
              </View>

              <View style={S.profileLeft}>
                <Text style={S.profileName} numberOfLines={2}>{displayName}</Text>
                <View style={S.memberIdChip}>
                  <Ionicons name="card-outline" size={11} color={C.amber} />
                  <Text style={S.memberIdText}>ID: {MID}</Text>
                </View>
              </View>

              <View style={S.profileRight}>
                <View style={S.tableBadge}>
                  <Ionicons name="easel-outline" size={11} color={C.purpleDeep} />
                  <Text style={S.tableBadgeText}>{tblCode}</Text>
                </View>

                {!!rating && (
                  <Animated.View style={[S.ratingBadge, { transform: [{ scale: bounceAnim }] }]}>
                    <Ionicons name="star" size={11} color={colors.white} />
                    <Text style={S.ratingBadgeText}>{rating}</Text>
                  </Animated.View>
                )}
              </View>
            </View>

            <View style={S.cardInnerDivider} />

            <View style={S.statsSection}>
              <StatRow
                label="Current Drop (Table)"
                value={fmt(drop?.CurrentDrop)}
                icon="easel-outline"
                color={C.stat.currentDrop}
              />
              <StatRow
                label="Current Drop (Slot)"
                value={fmt(drop?.Current_Drop_Slot ?? null)}
                icon="grid-outline"
                color={C.stat.slotDrop}
              />
              <StatRow
                label="Points"
                value={fmt(drop?.Coupon)}
                icon="pricetag-outline"
                color={C.stat.points}
              />
              <StatRow
                label="Avg Bet"
                value={fmt(drop?.AvgBet)}
                icon="trending-up-outline"
                color={C.stat.avgBet}
              />
              <StatRow
                label="Actual Drop"
                value={fmt(drop?.Actual_Drop)}
                icon="arrow-down-circle-outline"
                color={C.stat.actualDrop}
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
                <View key={btn.key} style={[S.actionBtnWrap, fullWidth && S.actionBtnWrapFull]}>
                  <ActionButton btn={btn} />
                </View>
              );
            })}
          </View>

          {/* ── Add Order button ── */}
          <TouchableOpacity style={S.addOrderBtn} onPress={handlePlus} activeOpacity={0.85}>
            <View style={S.addOrderIconWrap}>
              <Ionicons name="add" size={22} color={colors.white} />
            </View>
            <Text style={S.addOrderLabel}>Add Order</Text>
          </TouchableOpacity>

        </ScrollView>
      )}
    </View>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Styles — all colours from colors.pitCustomer (C) or colors.*
// ─────────────────────────────────────────────────────────────────────────────
const S = StyleSheet.create({
  flex: { flex: 1, backgroundColor: C.bg },

  // ── Nav bar ────────────────────────────────────────────────────────────────
  navBar: {
    backgroundColor:   C.purpleDeep,
    paddingTop:        Platform.OS === 'ios' ? 52 : 32,
    paddingBottom:     14,
    paddingHorizontal: 12,
    flexDirection:     'row',
    alignItems:        'center',
    gap:               8,
  },
  iconBtn: {
    width:           36,
    height:          36,
    borderRadius:    10,
    backgroundColor: colors.overlay.white15,
    alignItems:      'center',
    justifyContent:  'center',
  },
  navTitleWrap: { flex: 1, alignItems: 'center' },
  navTitle: { fontSize: 18, fontWeight: '800', color: colors.white, letterSpacing: 1 },
  navSub:   { fontSize: 9,  fontWeight: '600', color: colors.overlay.muted65, letterSpacing: 1.5, marginTop: 1 },

  // ── Doc chip — matches ExecutiveStaffScreen ────────────────────────────────
  docChip: {
    backgroundColor:   colors.docChip.bg,
    borderRadius:      12,
    paddingHorizontal: 10,
    paddingVertical:    7,
    alignItems:        'center',
    minWidth:          72,
  },
  docChipIconRow: { flexDirection: 'row', alignItems: 'center', gap: 3, marginBottom: 2 },
  docChipLabel: {
    fontSize:      8,
    color:         colors.docChip.labelText,
    fontWeight:    '700',
    letterSpacing: 0.8,
    textTransform: 'uppercase',
  },
  docChipValue: {
    fontSize:      15,
    color:         colors.docChip.valueText,
    fontWeight:    '900',
    letterSpacing: -0.3,
  },

  // ── Scroll ─────────────────────────────────────────────────────────────────
  scroll:        { flex: 1 },
  scrollContent: { paddingBottom: 36 },

  // ── Profile card ───────────────────────────────────────────────────────────
  profileCard: {
    backgroundColor:  C.card,
    marginHorizontal: 14,
    marginTop:        14,
    borderRadius:     20,
    borderWidth:      1,
    borderColor:      C.border,
    overflow:         'hidden',
    shadowColor:      colors.shadow.card,
    shadowOffset:     { width: 0, height: 2 },
    shadowOpacity:    0.08,
    shadowRadius:     10,
    elevation:        4,
  },
  profileBand: {
    width:           '100%',
    height:          56,
    backgroundColor: C.purpleDeep,
  },
  profileTopRow: {
    flexDirection:     'row',
    alignItems:        'flex-start',
    paddingHorizontal: 16,
    paddingBottom:     16,
    marginTop:         -28,
    gap:               12,
  },
  avatarBorder: {
    width:        72,
    height:       72,
    borderRadius: 36,
    borderWidth:  3,
    borderColor:  colors.white,
    overflow:     'hidden',
    flexShrink:   0,
    shadowColor:  C.purpleDeep,
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity:0.22,
    shadowRadius: 6,
    elevation:    5,
  },
  avatarImg:      { width: '100%', height: '100%' },
  avatarFallback: { backgroundColor: C.amber, alignItems: 'center', justifyContent: 'center' },
  avatarInitial:  { fontSize: 28, fontWeight: '900', color: colors.white },

  profileLeft: { flex: 1, marginTop: 30 },
  profileName: {
    fontSize:     15,
    fontWeight:   '800',
    color:        C.textDark,
    lineHeight:   20,
    marginBottom: 6,
    letterSpacing:0.1,
  },
  memberIdChip: {
    flexDirection:     'row',
    alignItems:        'center',
    gap:               4,
    backgroundColor:   C.memberIdBg,
    alignSelf:         'flex-start',
    paddingHorizontal: 8,
    paddingVertical:   3,
    borderRadius:      20,
    borderWidth:       1,
    borderColor:       C.memberIdBorder,
  },
  memberIdText: { fontSize: 11, fontWeight: '700', color: C.memberIdText },

  profileRight: { alignItems: 'flex-end', gap: 8, marginTop: 30, paddingVertical: 10 },
  tableBadge: {
    flexDirection:     'row',
    alignItems:        'center',
    gap:               4,
    backgroundColor:   C.tableBadgeBg,
    paddingHorizontal: 8,
    paddingVertical:   4,
    borderRadius:      20,
    borderWidth:       1,
    borderColor:       C.tableBadgeBorder,
  },
  tableBadgeText: { fontSize: 11, fontWeight: '700', color: C.tableBadgeText },
  ratingBadge: {
    flexDirection:     'row',
    alignItems:        'center',
    gap:               4,
    backgroundColor:   C.ratingBg,
    paddingHorizontal: 10,
    paddingVertical:   5,
    borderRadius:      20,
    shadowColor:       C.ratingShadow,
    shadowOffset:      { width: 0, height: 2 },
    shadowOpacity:     0.4,
    shadowRadius:      6,
    elevation:         4,
  },
  ratingBadgeText: { fontSize: 11, fontWeight: '900', color: colors.white, letterSpacing: 0.5 },

  cardInnerDivider: { height: 1, backgroundColor: C.border, marginHorizontal: 16, marginBottom: 4 },

  statsSection: { paddingBottom: 4 },
  statRow: {
    flexDirection:  'row',
    alignItems:     'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical:   12,
  },
  statRowLeft:  { flexDirection: 'row', alignItems: 'center', gap: 10, flex: 1 },
  statRowIcon:  { width: 28, height: 28, borderRadius: 7, alignItems: 'center', justifyContent: 'center' },
  statRowLabel: { fontSize: 15, fontWeight: '800', color: C.textDark },
  statRowValue: { fontSize: 16, fontWeight: '800', letterSpacing: -0.3 },
  statDivider:  { height: 1, backgroundColor: C.border, marginLeft: 54 },

  // ── Section title ──────────────────────────────────────────────────────────
  sectionTitle: {
    fontSize:        11,
    fontWeight:      '700',
    color:           C.textMid,
    letterSpacing:   1.5,
    textTransform:   'uppercase',
    marginTop:       20,
    marginBottom:    10,
    marginHorizontal:18,
  },

  // ── Actions grid ───────────────────────────────────────────────────────────
  actionsGrid:       { flexDirection: 'row', flexWrap: 'wrap', marginHorizontal: 14, gap: 10 },
  actionBtnWrap:     { width: '47%' },
  actionBtnWrapFull: { width: '100%' },
  actionBtn: {
    backgroundColor: C.card,
    borderRadius:    14,
    borderWidth:     1,
    borderColor:     C.border,
    padding:         14,
    alignItems:      'flex-start',
    shadowColor:     colors.shadow.card,
    shadowOffset:    { width: 0, height: 1 },
    shadowOpacity:   0.07,
    shadowRadius:    6,
    elevation:       2,
    position:        'relative',
  },
  actionIconWrap: {
    width:         46,
    height:        46,
    borderRadius:  13,
    alignItems:    'center',
    justifyContent:'center',
    marginBottom:  10,
  },
  actionLabel: { fontSize: 15, fontWeight: '700', color: C.textDark, letterSpacing: -0.1 },
  actionArrow: {
    position:      'absolute',
    top:           10,
    right:         10,
    width:         22,
    height:        22,
    borderRadius:  11,
    alignItems:    'center',
    justifyContent:'center',
  },

  // ── Add Order button ───────────────────────────────────────────────────────
  addOrderBtn: {
    flexDirection:     'row',
    alignItems:        'center',
    justifyContent:    'center',
    gap:               10,
    backgroundColor:   C.purpleDeep,
    marginHorizontal:  14,
    marginTop:         20,
    borderRadius:      16,
    paddingVertical:   16,
    shadowColor:       C.purpleDeep,
    shadowOffset:      { width: 0, height: 4 },
    shadowOpacity:     0.35,
    shadowRadius:      10,
    elevation:         6,
  },
  addOrderIconWrap: {
    width:           32,
    height:          32,
    borderRadius:    16,
    backgroundColor: colors.overlay.white20,
    alignItems:      'center',
    justifyContent:  'center',
  },
  addOrderLabel: { fontSize: 16, fontWeight: '800', color: colors.white, letterSpacing: 0.5 },

  // ── Centre states ──────────────────────────────────────────────────────────
  centerWrap:   { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 12 },
  loadingText:  { fontSize: 14, color: C.textMid, fontWeight: '500' },
  emptyIconWrap:{
    width:           64,
    height:          64,
    borderRadius:    32,
    backgroundColor: C.bg,
    alignItems:      'center',
    justifyContent:  'center',
    marginBottom:    4,
  },
  emptyTitle:   { fontSize: 15, fontWeight: '600', color: C.textMid },
  emptySub:     { fontSize: 12, color: C.textLight, textAlign: 'center' },
  retryBtn: {
    flexDirection:     'row',
    alignItems:        'center',
    gap:               6,
    backgroundColor:   C.purpleDeep,
    paddingHorizontal: 20,
    paddingVertical:   10,
    borderRadius:      20,
    marginTop:         4,
  },
  retryBtnText: { fontSize: 13, fontWeight: '700', color: colors.white },
});