import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  FlatList,
  StatusBar,
  Platform,
} from 'react-native';
import { Ionicons } from '@react-native-vector-icons/ionicons';
import {
  loadRunDate,
  loadPitPastOrders,
  loadPitDeptOrders,
  PitPastOrderItem,
  PitDeptOrderItem,
} from '../Api/api';
import colors from '../themes/colors';
import LottieView from 'lottie-react-native';

const C = colors.pitCustomer;

type OrderRow = PitPastOrderItem & PitDeptOrderItem;

// ─── Colour palette for labelled fields ──────────────────────────────────────
const FIELD_COLORS = {
  receipt:  { icon: C.purpleDeep,           label: C.purpleDeep,           value: '#1A1035' },
  barcode:  { icon: '#5B7FA6',              label: '#5B7FA6',              value: '#2C3E55' },
  product:  { icon: C.amber,                label: '#B8730A',              value: '#3D2700' },
  qty:      { icon: '#16A67D',              label: '#16A67D',              value: '#0A3D2D' },
  steward:  { icon: '#8B72BE',              label: '#8B72BE',              value: '#2D1F50' },
  operator: { icon: '#2897C5',              label: '#2897C5',              value: '#0B3248' },
  date:     { icon: '#708090',              label: '#708090',              value: '#2C3440' },
};

function fmt(val: string | number | null | undefined): string {
  if (val === null || val === undefined || val === '') return '—';
  const n = Number(val);
  if (isNaN(n)) return String(val);
  return n.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

// ─── Labelled field component ─────────────────────────────────────────────────
function LabeledField({
  icon,
  label,
  value,
  valueStyle,
  scheme,
}: {
  icon: string;
  label: string;
  value: string | number;
  valueStyle?: object;
  scheme: { icon: string; label: string; value: string };
}) {
  return (
    <View style={S.labeledField}>
      <View style={S.labelRow}>
        <Ionicons name={icon as any} size={12} color={scheme.icon} />
        <Text style={[S.fieldLabel, { color: scheme.label }]}>{label}</Text>
      </View>
      <Text style={[S.fieldValue, { color: scheme.value }, valueStyle]} numberOfLines={2}>
        {value === null || value === undefined || value === '' ? '—' : String(value)}
      </Text>
    </View>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
export default function PitsPastOrdersResultsScreen({
  navigation,
  route,
}: {
  navigation: any;
  route: any;
}) {
  const { MID, MName, tblCode, deptCode, deptName, dateMode, date } = route.params as {
    MID: string;
    MName: string;
    tblCode: string;
    deptCode: string;
    deptName: string;
    dateMode: 'TODAY' | 'DATE';
    date: string;
  };

  const isAll = deptCode === 'ALL';

  const [orders, setOrders] = useState<OrderRow[]>([]);
  const [runDate, setRunDate] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  async function fetchOrders() {
    setLoading(true);
    setError(null);
    try {
      const rd = await loadRunDate();
      if (!rd) throw new Error('Could not retrieve run date from server.');
      setRunDate(rd);
      let data: OrderRow[];
      if (isAll) {
        data = (await loadPitPastOrders(MID, 'ALL', rd)) as OrderRow[];
      } else {
        data = (await loadPitDeptOrders(MID, deptCode, rd)) as OrderRow[];
      }
      setOrders(data);
    } catch (e: any) {
      setError(e?.message ?? 'Failed to load past orders.');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchOrders();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const totalAmount = orders.reduce((sum, row) => {
    const a = Number(row.Amount ?? row.Amt ?? row.Total ?? 0);
    return sum + (isNaN(a) ? 0 : a);
  }, 0);

  const totalQty = orders.reduce((sum, row) => {
    const q = Number(row.Qty ?? row.Quantity ?? 0);
    return sum + (isNaN(q) ? 0 : q);
  }, 0);

  // ── Row card ──────────────────────────────────────────────────────────────
  function renderItem({ item, index }: { item: OrderRow; index: number }) {
    const receiptNo = item.Receipt_No ?? '—';
    const prodCode  = item.Prod_Code  ?? '—';
    const prodName  = item.Prod_Name  ?? '—';
    const qty       = item.Qty        ?? '—';
    const amount    = item.Amount ?? item.Amt ?? item.Total ?? '—';
    const steward   = item.Steward    ?? '—';
    const loginBy   = item.LoginBy    ?? '—';
    const trDate    = item.Tr_Date    ?? '—';

    // Cycle through accent colours so adjacent cards are visually distinct
    const ACCENT_COLORS = ['#3D013C', '#0369A1', '#0F766E', '#B45309', '#B91C1C'];
    const accentColor = ACCENT_COLORS[index % ACCENT_COLORS.length];

    return (
      <View style={[S.orderCard, { borderBottomColor: accentColor, borderBottomWidth: 4 }]}>
        <View style={S.orderBody}>

          {/* ── Header: index badge + amount ── */}
          <View style={S.cardHeader}>
            <View style={S.indexBadge}>
              <Text style={S.indexBadgeText}>#{index + 1}</Text>
            </View>
            <View style={S.amountBlock}>
              <Text style={S.amountLabel}>AMOUNT</Text>
              <Text style={S.amountValue}>{fmt(amount)}</Text>
            </View>
          </View>

          {/* ── Divider ── */}
          <View style={S.divider} />

          {/* ── Receipt & Code row ── */}
          <View style={S.twoColRow}>
            <LabeledField
              icon="receipt-outline"
              label="Receipt No"
              value={receiptNo}
              scheme={FIELD_COLORS.receipt}
              valueStyle={S.valueHighlight}
            />
            <LabeledField
              icon="barcode-outline"
              label="Code"
              value={prodCode}
              scheme={FIELD_COLORS.barcode}
            />
          </View>

          {/* ── Product name full width ── */}
          <View style={S.fullField}>
            <View style={S.labelRow}>
              <Ionicons name="pricetag-outline" size={12} color={FIELD_COLORS.product.icon} />
              <Text style={[S.fieldLabel, { color: FIELD_COLORS.product.label }]}>Product Name</Text>
            </View>
            <Text style={[S.fieldValue, S.prodNameValue, { color: FIELD_COLORS.product.value }]} numberOfLines={3}>
              {prodName}
            </Text>
          </View>

          {/* ── Qty row ── */}
          <View style={S.twoColRow}>
            <LabeledField
              icon="layers-outline"
              label="Qty"
              value={String(qty)}
              scheme={FIELD_COLORS.qty}
              valueStyle={S.valueHighlight}
            />
            {/* spacer col */}
            <View style={{ flex: 1 }} />
          </View>

          {/* ── Divider ── */}
          <View style={S.divider} />

          {/* ── Steward & Operator ── */}
          <View style={S.twoColRow}>
            <LabeledField
              icon="person-outline"
              label="Steward"
              value={steward}
              scheme={FIELD_COLORS.steward}
            />
            <LabeledField
              icon="shield-checkmark-outline"
              label="Operator"
              value={loginBy}
              scheme={FIELD_COLORS.operator}
            />
          </View>

          {/* ── Date Time full width ── */}
          <View style={S.fullField}>
            <View style={S.labelRow}>
              <Ionicons name="time-outline" size={12} color={FIELD_COLORS.date.icon} />
              <Text style={[S.fieldLabel, { color: FIELD_COLORS.date.label }]}>Date & Time</Text>
            </View>
            <Text style={[S.fieldValue, S.dateValue, { color: FIELD_COLORS.date.value }]}>{trDate}</Text>
          </View>

        </View>
      </View>
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
          onPress={() => navigation.goBack()}
          activeOpacity={0.75}
        >
          <Ionicons name="arrow-back-outline" size={22} color={colors.white} />
        </TouchableOpacity>

        <View style={S.navTitleWrap}>
          <Text style={S.navTitle} numberOfLines={1}>{deptName}</Text>
          <Text style={S.navSub} numberOfLines={1}>{MName}</Text>
        </View>

        {runDate ? (
          <View style={S.docChip}>
            <View style={S.docChipIconRow}>
              <Ionicons name="calendar-outline" size={10} color={colors.docChip.labelText} />
              <Text style={S.docChipLabel}>Run Date</Text>
            </View>
            <Text style={S.docChipValue} numberOfLines={1}>{runDate}</Text>
          </View>
        ) : (
          <View style={{ width: 80 }} />
        )}
      </View>

      {/* ── Member strip ── */}
      <View style={S.memberStrip}>
        <View style={S.memberStripLeft}>
          <View style={S.memberInitialBadge}>
            <Text style={S.memberInitialText}>{MName.charAt(0).toUpperCase()}</Text>
          </View>
          <View style={{ flexShrink: 1 }}>
            <Text style={S.memberStripName} numberOfLines={1}>{MName}</Text>
            <View style={S.memberStripIdRow}>
              <Ionicons name="card-outline" size={10} color={C.amber} />
              <Text style={S.memberStripId}>ID: {MID}</Text>
              <Text style={S.memberStripSep}>·</Text>
              <Ionicons name="today-outline" size={10} color={C.amber} />
              <Text style={S.memberStripId}>{date}</Text>
            </View>
          </View>
        </View>
        <View style={S.tableBadge}>
          <Ionicons name="easel-outline" size={10} color={C.purpleDeep} />
          <Text style={S.tableBadgeText}>{tblCode}</Text>
        </View>
      </View>

      {/* ── API badge ── */}
      <View style={S.apiBadgeRow}>
        <View style={[S.apiBadge, { backgroundColor: isAll ? (C.stat?.currentDrop ?? C.purpleDeep) + '18' : C.amber + '18' }]}>
          <Ionicons
            name={isAll ? 'layers-outline' : 'grid-outline'}
            size={11}
            color={isAll ? (C.stat?.currentDrop ?? C.purpleDeep) : C.amber}
          />
          <Text style={[S.apiBadgeText, { color: isAll ? (C.stat?.currentDrop ?? C.purpleDeep) : C.amber }]}>
            {isAll ? 'All Departments' : deptName}
          </Text>
        </View>
      </View>

      {/* ── Summary bar ── */}
      {!loading && !error && orders.length > 0 && (
        <View style={S.summaryBar}>
          <View style={S.summaryItem}>
            <Text style={S.summaryLabel}>ITEMS</Text>
            <Text style={S.summaryValue}>{orders.length}</Text>
          </View>
          <View style={S.summaryDivider} />
          <View style={S.summaryItem}>
            <Text style={S.summaryLabel}>TOTAL QTY</Text>
            <Text style={S.summaryValue}>{totalQty}</Text>
          </View>
          <View style={S.summaryDivider} />
          <View style={S.summaryItem}>
            <Text style={S.summaryLabel}>TOTAL AMT</Text>
            <Text style={[S.summaryValue, { color: C.purpleDeep }]}>{fmt(totalAmount)}</Text>
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
          <Text style={S.emptyTitle}>No orders found</Text>
          <Text style={S.emptySub}>No past orders for {deptName} on this run date.</Text>
        </View>
      ) : (
        <FlatList
          data={orders}
          keyExtractor={(_, i) => String(i)}
          renderItem={renderItem}
          contentContainerStyle={S.list}
          showsVerticalScrollIndicator={false}
        />
      )}
    </View>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Styles
// ─────────────────────────────────────────────────────────────────────────────
const S = StyleSheet.create({
  flex: { flex: 1, backgroundColor: '#ECEEF4' }, // slightly blue-grey page bg so white cards pop

  // ── Nav ──────────────────────────────────────────────────────────────────
  navBar: {
    backgroundColor: C.purpleDeep,
    paddingTop: Platform.OS === 'ios' ? 52 : 32,
    paddingBottom: 14,
    paddingHorizontal: 12,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  iconBtn: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: colors.overlay.white15,
    alignItems: 'center',
    justifyContent: 'center',
  },
  navTitleWrap: { flex: 1, alignItems: 'center' },
  navTitle: { fontSize: 18, fontWeight: '800', color: colors.white, letterSpacing: 1 },
  navSub: { fontSize: 10, fontWeight: '500', color: colors.overlay.muted65, letterSpacing: 0.5, marginTop: 1 },

  docChip: {
    backgroundColor: colors.docChip.bg,
    borderRadius: 12,
    paddingHorizontal: 10,
    paddingVertical: 7,
    alignItems: 'center',
    minWidth: 80,
  },
  docChipIconRow: { flexDirection: 'row', alignItems: 'center', gap: 3, marginBottom: 2 },
  docChipLabel: { fontSize: 8, color: colors.docChip.labelText, fontWeight: '700', letterSpacing: 0.8, textTransform: 'uppercase' },
  docChipValue: { fontSize: 11, color: colors.docChip.valueText, fontWeight: '900', letterSpacing: -0.3 },

  // ── Member strip ──────────────────────────────────────────────────────────
  memberStrip: {
    backgroundColor: '#FFFFFF',
    marginHorizontal: 14,
    marginTop: 14,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: C.border,
    paddingHorizontal: 14,
    paddingVertical: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    shadowColor: '#1A1035',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.10,
    shadowRadius: 10,
    elevation: 5,
  },
  memberStripLeft: { flexDirection: 'row', alignItems: 'center', gap: 10, flex: 1 },
  memberInitialBadge: {
    width: 40, height: 40, borderRadius: 20,
    backgroundColor: C.amber,
    alignItems: 'center', justifyContent: 'center', flexShrink: 0,
  },
  memberInitialText: { fontSize: 18, fontWeight: '900', color: colors.white },
  memberStripName: { fontSize: 14, fontWeight: '700', color: C.textDark },
  memberStripIdRow: { flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 2, flexWrap: 'wrap' },
  memberStripId: { fontSize: 11, fontWeight: '600', color: C.amber },
  memberStripSep: { fontSize: 11, color: C.textLight },
  tableBadge: {
    flexDirection: 'row', alignItems: 'center', gap: 4,
    backgroundColor: C.tableBadgeBg,
    paddingHorizontal: 8, paddingVertical: 4,
    borderRadius: 20, borderWidth: 1, borderColor: C.tableBadgeBorder,
  },
  tableBadgeText: { fontSize: 11, fontWeight: '700', color: C.tableBadgeText },

  apiBadgeRow: { paddingHorizontal: 14, marginTop: 10 },
  apiBadge: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    alignSelf: 'flex-start', paddingHorizontal: 10, paddingVertical: 5, borderRadius: 20,
  },
  apiBadgeText: { fontSize: 11, fontWeight: '700' },

  // ── Summary bar ───────────────────────────────────────────────────────────
  summaryBar: {
    backgroundColor: '#FFFFFF',
    marginHorizontal: 14,
    marginTop: 10,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: C.border,
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    shadowColor: '#1A1035',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.10,
    shadowRadius: 10,
    elevation: 5,
  },
  summaryItem: { flex: 1, alignItems: 'center' },
  summaryDivider: { width: 1, height: 32, backgroundColor: C.border },
  summaryLabel: { fontSize: 9, fontWeight: '700', color: C.textLight, letterSpacing: 1, textTransform: 'uppercase', marginBottom: 3 },
  summaryValue: { fontSize: 16, fontWeight: '900', color: C.textDark, letterSpacing: -0.5 },

  list: { paddingHorizontal: 14, paddingTop: 14, paddingBottom: 32, gap: 12 },

  // ── Order card ────────────────────────────────────────────────────────────
  orderCard: {
    backgroundColor: '#FFF8F0',
    borderRadius: 18,
    borderWidth: 1,
    borderColor: 'rgba(100, 80, 200, 0.12)',
    overflow: 'hidden',
    shadowColor: '#3B1F8C',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.14,
    shadowRadius: 14,
    elevation: 7,
  },
  orderBody: { paddingHorizontal: 16, paddingVertical: 14, gap: 10 },

  // Card header: index badge + amount block
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  indexBadge: {
    backgroundColor: C.purpleDeep + '15',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: C.purpleDeep + '30',
  },
  indexBadgeText: { fontSize: 13, fontWeight: '800', color: C.purpleDeep },

  amountBlock: { alignItems: 'flex-end' },
  amountLabel: { fontSize: 10, fontWeight: '700', color: C.textLight, letterSpacing: 1, textTransform: 'uppercase', marginBottom: 2 },
  amountValue: { fontSize: 22, fontWeight: '900', color: C.purpleDeep, letterSpacing: -0.8 },

  divider: { height: 1, backgroundColor: '#EDE9F7' }, // light purple divider inside card

  // Two-column row
  twoColRow: { flexDirection: 'row', gap: 12 },

  // Full-width field
  fullField: { gap: 4 },

  // Labeled field
  labeledField: { flex: 1, gap: 4 },
  labelRow: { flexDirection: 'row', alignItems: 'center', gap: 5 },
  fieldLabel: {
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 0.6,
    textTransform: 'uppercase',
    // color injected inline per field
  },
  fieldValue: {
    fontSize: 15,
    fontWeight: '700',
    letterSpacing: -0.2,
    lineHeight: 21,
    // color injected inline per field
  },

  // Variants
  valueHighlight: { fontSize: 16, fontWeight: '800' },
  prodNameValue: { fontSize: 16, fontWeight: '700', lineHeight: 23 },
  dateValue: { fontSize: 14, fontWeight: '600' },

  // ── Empty / error states ──────────────────────────────────────────────────
  centerWrap: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 12 },
  emptyIconWrap: {
    width: 64, height: 64, borderRadius: 32,
    backgroundColor: '#F3F4F6',
    alignItems: 'center', justifyContent: 'center', marginBottom: 4,
  },
  emptyTitle: { fontSize: 15, fontWeight: '600', color: C.textMid },
  emptySub: { fontSize: 12, color: C.textLight, textAlign: 'center', paddingHorizontal: 32 },
  retryBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    backgroundColor: C.purpleDeep,
    paddingHorizontal: 20, paddingVertical: 10,
    borderRadius: 20, marginTop: 4,
  },
  retryBtnText: { fontSize: 13, fontWeight: '700', color: colors.white },
});