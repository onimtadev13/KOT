import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  FlatList,
  StatusBar,
  Platform,
  Animated,
} from 'react-native';
import { Ionicons } from '@react-native-vector-icons/ionicons';
import { useAppStore } from '../Store/store';
import { loadPastOrders, PastOrderResult } from '../Api/api';
import { DrawerActions, useNavigation } from '@react-navigation/native';
import colors from '../themes/colors';
import LottieView from 'lottie-react-native';

const C = colors.pastOrders;

// ─────────────────────────────────────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────────────────────────────────────
function safeStr(val: any): string {
  if (val === null || val === undefined || val === '') return '—';
  return String(val);
}

// ─────────────────────────────────────────────────────────────────────────────
// Field cell
// ─────────────────────────────────────────────────────────────────────────────
function Field({
  icon,
  label,
  value,
  scheme,
}: {
  icon: string;
  label: string;
  value: string;
  scheme: { icon: string; iconBg: string; label: string; value: string };
}) {
  return (
    <View style={S.field}>
      <View style={[S.fieldIconWrap, { backgroundColor: scheme.iconBg }]}>
        <Ionicons name={icon as any} size={17} color={scheme.icon} />
      </View>
      <View style={S.fieldText}>
        <Text style={[S.fieldLabel, { color: scheme.label }]}>{label}</Text>
        <Text style={[S.fieldValue, { color: scheme.value }]}>
          {value}
        </Text>
      </View>
    </View>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Order card
// ─────────────────────────────────────────────────────────────────────────────
function OrderCard({
  item,
  index,
  onView,
}: {
  item: PastOrderResult;
  index: number;
  onView: (item: PastOrderResult) => void;
}) {
  const slideAnim = useRef(new Animated.Value(24)).current;
  const fadeAnim  = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 300,
        delay: Math.min(index * 40, 480),
        useNativeDriver: true,
      }),
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 300,
        delay: Math.min(index * 40, 480),
        useNativeDriver: true,
      }),
    ]).start();
  }, []);

  const receipt  = safeStr(item.Receipt_No  ?? item.Receipt   ?? item.Recpt_No);
  const guestId  = safeStr(item.GuestID     ?? item.Guest_ID);
  const steward  = safeStr(item.Steward     ?? item.StewardName);
  const operator = safeStr(item.LoginBy     ?? item.Login_By  ?? item.Operator);
  const dateTime = safeStr(item.Tr_Date     ?? item.Date_Time ?? item.Trans_Date);
  const table    = safeStr(item.TBL_No      ?? item.Table_No);

  return (
    <Animated.View style={{ opacity: fadeAnim, transform: [{ translateY: slideAnim }] }}>
      <View style={S.card}>

        {/* Left accent stripe */}
        <View style={S.cardAccent} />

        <View style={S.cardBody}>

          {/* ── Card header ── */}
          <View style={S.cardHead}>
            <View style={S.headLeft}>
              {/* Index badge */}
              <View style={S.indexBadge}>
                <Text style={S.indexBadgeText}>#{index + 1}</Text>
              </View>

              {/* Table pill */}
              {table !== '—' && (
                <View style={S.tablePill}>
                  <Ionicons name="easel-outline" size={10} color={C.teal} />
                  <Text style={S.tablePillText}>{table}</Text>
                </View>
              )}
            </View>

            {/* VIEW button */}
            <TouchableOpacity
              style={S.viewBtn}
              onPress={() => onView(item)}
              activeOpacity={0.8}
            >
              <Ionicons name="eye-outline" size={13} color={colors.white} />
              <Text style={S.viewBtnText}>VIEW</Text>
            </TouchableOpacity>
          </View>

          {/* ── Divider ── */}
          <View style={S.divider} />

          {/* ── Fields: two columns (top) ── */}
          <View style={S.fieldsRow}>
            <View style={S.col}>
              <Field
                icon="receipt-outline"
                label="Receipt No"
                value={receipt}
                scheme={C.fields.receipt}
              />
              <Field
                icon="people-outline"
                label="Steward"
                value={steward}
                scheme={C.fields.steward}
              />
            </View>

            <View style={S.col}>
              <Field
                icon="person-circle-outline"
                label="Guest ID"
                value={guestId}
                scheme={C.fields.guestId}
              />
              <Field
                icon="shield-checkmark-outline"
                label="Operator"
                value={operator}
                scheme={C.fields.operator}
              />
            </View>
          </View>

          {/* ── Date & Time — full width ── */}
          <View style={S.dateTimeRow}>
            <View style={[S.fieldIconWrap, { backgroundColor: C.fields.dateTime.iconBg }]}>
              <Ionicons name="time-outline" size={17} color={C.fields.dateTime.icon} />
            </View>
            <View style={S.fieldText}>
              <Text style={[S.fieldLabel, { color: C.fields.dateTime.label }]}>Date & Time</Text>
              <Text style={[S.fieldValue, S.dateTimeValue, { color: C.fields.dateTime.value }]}>
                {dateTime}
              </Text>
            </View>
          </View>
        </View>
      </View>
    </Animated.View>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// PastOrdersScreen
// ─────────────────────────────────────────────────────────────────────────────
export default function PastOrdersScreen({ navigation }: { navigation: any }) {
  const nav    = useNavigation<any>();
  const device = useAppStore(state => state.device);

  const orderItemCount  = useAppStore(state => state.orderItemCount);

const itemCount = orderItemCount();

  const [orders,  setOrders]  = useState<PastOrderResult[]>([]);
  const [loading, setLoading] = useState(true);
  const [error,   setError]   = useState<string | null>(null);

  useEffect(() => {
    fetchOrders();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  async function fetchOrders() {
    setLoading(true);
    setError(null);
    try {
      const uniqueId = device?.UniqueId ?? '';
      const docNo    = device?.Doc_No   ?? '';
      const result   = await loadPastOrders(uniqueId, docNo);
      setOrders(result);
    } catch {
      setError('Failed to load past orders.');
    } finally {
      setLoading(false);
    }
  }

  function handleView(order: PastOrderResult) {
    console.log('[PAST ORDERS] View:', JSON.stringify(order, null, 2));
    // TODO: navigate to order detail screen
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
          <Text style={S.navTitle}>Past Orders</Text>
            <Text style={S.navSub}>KITCHEN ORDER TICKET</Text>
        </View>

        {/* Cart icon */}
        <View style={S.navActions}>
          <TouchableOpacity
            style={S.iconBtn}
            onPress={() => navigation.navigate('CurrentOrder')}
            activeOpacity={0.75}
          >
            <Ionicons name="cart-outline" size={20} color={colors.white} />
            {itemCount > 0 && (
              <View style={S.cartBadge}>
                <Text style={S.cartBadgeText}>
                  {itemCount > 99 ? '99+' : String(itemCount)}
                </Text>
              </View>
            )}
          </TouchableOpacity>
        </View>

        {/* Doc chip — matches GuestDetailsScreen / ExecutiveStaffScreen */}
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

      {/* ── Info / count bar ── */}
      {!loading && !error && orders.length > 0 && (
        <View style={S.infoBar}>
          <View style={S.infoBarLeft}>
            <Ionicons name="checkmark-circle" size={14} color={C.green} />
            <Text style={S.infoBarText}>
              <Text style={S.infoBarBold}>{orders.length}</Text>
              {` record${orders.length !== 1 ? 's' : ''} found`}
            </Text>
          </View>
          <View style={S.countPill}>
            <Text style={S.countPillText}>{orders.length}</Text>
          </View>
        </View>
      )}

      {/* ── Body ── */}
      {loading ? (
        <View style={S.centerWrap}>
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
          <Text style={S.emptyTitle}>Could not load orders</Text>
          <Text style={S.emptySub}>{error}</Text>
          <TouchableOpacity style={S.retryBtn} onPress={fetchOrders} activeOpacity={0.8}>
            <Ionicons name="refresh-outline" size={14} color={colors.white} />
            <Text style={S.retryBtnText}>Retry</Text>
          </TouchableOpacity>
        </View>
      ) : orders.length === 0 ? (
        <View style={S.centerWrap}>
          <View style={S.emptyIconWrap}>
            <Ionicons name="receipt-outline" size={32} color={C.textLight} />
          </View>
          <Text style={S.emptyTitle}>No past orders</Text>
          <Text style={S.emptySub}>Nothing found for this document</Text>
        </View>
      ) : (
        <FlatList
          data={orders}
          keyExtractor={(item, i) => String(item.Receipt_No ?? item.Receipt ?? i)}
          renderItem={({ item, index }) => (
            <OrderCard item={item} index={index} onView={handleView} />
          )}
          contentContainerStyle={S.list}
          showsVerticalScrollIndicator={false}
          initialNumToRender={12}
          maxToRenderPerBatch={12}
          windowSize={8}
        />
      )}
    </View>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Styles
// ─────────────────────────────────────────────────────────────────────────────
const S = StyleSheet.create({
  flex: { flex: 1, backgroundColor: C.bg },

  // ── Nav bar ──────────────────────────────────────────────────────────────
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
  navTitle: {
    fontSize:      18,
    fontWeight:    '800',
    color:         colors.white,
    letterSpacing: 1,
  },
  navSub: {
    fontSize:      9,
    color:         colors.overlay.muted65,
    letterSpacing: 1.5,
    marginTop:     1,
  },

  // ── Doc chip ─────────────────────────────────────────────────────────────
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

  // ── Info bar ─────────────────────────────────────────────────────────────
  infoBar: {
    flexDirection:     'row',
    alignItems:        'center',
    justifyContent:    'space-between',
    backgroundColor:   C.greenSoft,
    paddingHorizontal: 16,
    paddingVertical:   9,
    borderBottomWidth: 1,
    borderBottomColor: '#BBF7D0',
  },
  infoBarLeft: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  infoBarText: { fontSize: 12, color: '#14532D', fontWeight: '500' },
  infoBarBold: { fontWeight: '800' },
  countPill: {
    minWidth:          32,
    height:            26,
    borderRadius:      13,
    backgroundColor:   C.purpleDeep,
    alignItems:        'center',
    justifyContent:    'center',
    paddingHorizontal: 10,
  },
  countPillText: { fontSize: 12, fontWeight: '800', color: colors.white },

  // ── List ──────────────────────────────────────────────────────────────────
  list: { paddingHorizontal: 14, paddingTop: 14, paddingBottom: 36, gap: 12 },

  // ── Order card ────────────────────────────────────────────────────────────
  card: {
    backgroundColor: C.card,
    borderRadius:    18,
    borderWidth:     1,
    borderColor:     C.border,
    flexDirection:   'row',
    overflow:        'hidden',
    shadowColor:     C.shadowCard,
    shadowOffset:    { width: 0, height: 6 },
    shadowOpacity:   0.13,
    shadowRadius:    14,
    elevation:       7,
  },
  cardAccent: { width: 5, backgroundColor: C.purpleDeep },
  cardBody:   { flex: 1, paddingHorizontal: 14, paddingVertical: 12, gap: 10 },

  // Card header
  cardHead: {
    flexDirection:  'row',
    alignItems:     'center',
    justifyContent: 'space-between',
  },
  headLeft: { flexDirection: 'row', alignItems: 'center', gap: 8 },

  indexBadge: {
    backgroundColor: C.purpleSoft,
    paddingHorizontal: 10,
    paddingVertical:    4,
    borderRadius:      20,
    borderWidth:       1,
    borderColor:       C.purpleBorder,
  },
  indexBadgeText: { fontSize: 16, fontWeight: '800', color: C.purpleDeep },

  tablePill: {
    flexDirection:     'row',
    alignItems:        'center',
    gap:               5,
    backgroundColor:   C.tealSoft,
    paddingHorizontal: 10,
    paddingVertical:   5,
    borderRadius:      20,
    borderWidth:       1,
    borderColor:       '#99F6E4',
  },
  tablePillText: { fontSize: 14, fontWeight: '700', color: C.teal },

  // VIEW button — matches app's action button style
  viewBtn: {
    flexDirection:     'row',
    alignItems:        'center',
    gap:               5,
    backgroundColor:   C.purpleDeep,
    borderRadius:      10,
    paddingHorizontal: 16,
    paddingVertical:    9,
    shadowColor:       C.purpleDeep,
    shadowOffset:      { width: 0, height: 3 },
    shadowOpacity:     0.30,
    shadowRadius:      6,
    elevation:         5,
  },
  viewBtnText: { fontSize: 14, fontWeight: '800', color: colors.white, letterSpacing: 1 },

  // Divider
  divider: { height: 1, backgroundColor: '#EDE9F7' },

  // ── Two-column fields ─────────────────────────────────────────────────────
  fieldsRow: { flexDirection: 'row', gap: 10 },
  col:       { flex: 1, gap: 2 },

  // ── Full-width date row ───────────────────────────────────────────────────
  dateTimeRow: {
    flexDirection:     'row',
    alignItems:        'center',
    gap:               8,
    paddingVertical:   8,
    // backgroundColor:   '#FFF8F0',
    borderRadius:      10,
    paddingHorizontal: 8,
  },

  // ── Field cell ────────────────────────────────────────────────────────────
  field: {
    flexDirection:   'row',
    alignItems:      'center',
    gap:             8,
    paddingVertical: 7,
  },
  fieldIconWrap: {
    width:          34,
    height:         34,
    borderRadius:   10,
    alignItems:     'center',
    justifyContent: 'center',
    flexShrink:     0,
  },
  fieldText: { flex: 1 },
  fieldLabel: {
    fontSize:      13,
    fontWeight:    '700',
    letterSpacing: 0.5,
    textTransform: 'uppercase',
    marginBottom:  4,
  },
  fieldValue: {
    fontSize:   18,
    fontWeight: '700',
    lineHeight: 24,
  },
  dateTimeValue: {
    fontSize:   18,
    fontWeight: '700',
    lineHeight: 24,
  },

  // ── Empty / error / loading states ────────────────────────────────────────
  centerWrap: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 12 },
  emptyIconWrap: {
    width:           64,
    height:          64,
    borderRadius:    32,
    backgroundColor: C.emptyIconBg,
    alignItems:      'center',
    justifyContent:  'center',
    marginBottom:    4,
  },
  emptyTitle: { fontSize: 15, fontWeight: '600', color: C.textMid },
  emptySub:   { fontSize: 12, color: C.textLight, textAlign: 'center', paddingHorizontal: 32 },
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
  navActions: { position: 'relative' },

  cartBadge: {
    position:          'absolute',
    top:               -4,
    right:             -4,
    minWidth:          16,
    height:            16,
    borderRadius:      8,
    backgroundColor:   colors.gold,
    alignItems:        'center',
    justifyContent:    'center',
    paddingHorizontal: 3,
  },
  cartBadgeText: {
    fontSize:   9,
    fontWeight: '800',
    color:      colors.primary,
    lineHeight: 12,
  },
});