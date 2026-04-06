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
import { useAppStore } from '../Store/store';
import { loadPitOrder, PitOrderResult } from '../Api/api';
import { DrawerActions, useNavigation, useFocusEffect } from '@react-navigation/native';
import colors from '../themes/colors';
import LottieView from 'lottie-react-native';

// ─────────────────────────────────────────────────────────────────────────────
// PitsTablesScreen
// Receives: route.params.pitName (string)
// API returns: [{ TblCode: "BAC 01" }, ...]
// ─────────────────────────────────────────────────────────────────────────────
export default function PitsTablesScreen({
  navigation,
  route,
}: {
  navigation: any;
  route: any;
}) {
  const nav          = useNavigation<any>();
  const { pitName } = route.params as { pitName: string };
  const device = useAppStore(state => state.device);
  const orderItemCount  = useAppStore(state => state.orderItemCount);

const itemCount = orderItemCount();

  const [tables,  setTables]  = useState<PitOrderResult[]>([]);
  const [loading, setLoading] = useState(true);
  const [error,   setError]   = useState<string | null>(null);

  useEffect(() => {
    fetchTables();
  }, [pitName]); // eslint-disable-line react-hooks/exhaustive-deps

  async function fetchTables() {
    setLoading(true);
    setError(null);
    try {
      const result = await loadPitOrder(pitName);
      setTables(result);
    } catch (e: any) {
      setError('Failed to load tables for this pit.');
    } finally {
      setLoading(false);
    }
  }

  // ── Table card ──────────────────────────────────────────────────────────────
  function renderTable({ item }: { item: PitOrderResult }) {
    return (
      <TouchableOpacity
        style={S.tableCard}
        onPress={() => navigation.navigate('PitsCustomers', { tblCode: item.TblCode })}
        activeOpacity={0.82}
      >
        {/* Left amber accent */}
        <View style={S.tableAccent} />

        {/* Icon */}
        <View style={S.tableIconWrap}>
          <Ionicons name="easel-outline" size={22} color={colors.pitsTables.amber} />
        </View>

        {/* Name */}
        <View style={S.tableInfo}>
          <Text style={S.tableName}>{item.TblCode}</Text>
        </View>

        {/* Arrow */}
        <View style={S.arrowWrap}>
          <Ionicons name="chevron-forward" size={14} color={colors.pitsTables.amber} />
        </View>
      </TouchableOpacity>
    );
  }

  return (
    <View style={S.flex}>
      <StatusBar barStyle="light-content" backgroundColor={colors.pitsTables.purpleDeep} />

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
          <Text style={S.navTitle}>Pit {pitName}</Text>
          <Text style={S.navSub}>Kitchen Order Ticket</Text>
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

      {/* ── Content ── */}
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
            <Ionicons name="cloud-offline-outline" size={32} color={colors.pitsTables.textLight} />
          </View>
          <Text style={S.emptyTitle}>Could not load tables</Text>
          <Text style={S.emptySub}>{error}</Text>
        </View>
      ) : tables.length === 0 ? (
        <View style={S.centerWrap}>
          <View style={S.emptyIconWrap}>
            <Ionicons name="easel-outline" size={32} color={colors.pitsTables.textLight} />
          </View>
          <Text style={S.emptyTitle}>No tables found</Text>
          <Text style={S.emptySub}>Pit {pitName} has no tables</Text>
        </View>
      ) : (
        <FlatList
          data={tables}
          keyExtractor={(item, index) => item.TblCode ?? String(index)}
          renderItem={renderTable}
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
  flex: { flex: 1, backgroundColor: colors.pitsTables.bg },

  // ── Nav bar ──
  navBar: {
    backgroundColor:   colors.pitsTables.purpleDeep,
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
  navSub:   { fontSize: 9,  color: colors.overlay.muted65, letterSpacing: 1.5, marginTop: 1 },

  // ── Doc chip — matches ExecutiveStaffScreen ───────────────────────────────
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

  // ── List ──
  list: { paddingHorizontal: 14, paddingTop: 14, paddingBottom: 32, gap: 10 },

  // ── Table card ──
  tableCard: {
    backgroundColor: colors.pitsTables.card,
    borderRadius:    16,
    borderWidth:     1,
    borderColor:     colors.pitsTables.border,
    flexDirection:   'row',
    alignItems:      'center',
    overflow:        'hidden',
    shadowColor:     colors.pitsTables.shadowCard,
    shadowOffset:    { width: 0, height: 2 },
    shadowOpacity:   0.07,
    shadowRadius:    8,
    elevation:       3,
  },
  tableAccent:   { width: 4, alignSelf: 'stretch', backgroundColor: colors.pitsTables.amber },
  tableIconWrap: {
    width:          48,
    height:         48,
    borderRadius:   13,
    backgroundColor: colors.pitsTables.amberSoft,
    alignItems:     'center',
    justifyContent: 'center',
    marginLeft:     14,
    marginVertical: 14,
  },
  tableInfo: { flex: 1, paddingHorizontal: 14, paddingVertical: 14 },
  tableName: { fontSize: 15, fontWeight: '700', color: colors.pitsTables.textDark },
  arrowWrap: {
    width:          28,
    height:         28,
    borderRadius:   14,
    backgroundColor: colors.pitsTables.amberSoft,
    alignItems:     'center',
    justifyContent: 'center',
    marginRight:    14,
  },

  // ── Center states ──
  centerWrap:  { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 12 },
  loadingText: { fontSize: 14, color: colors.pitsTables.textMid, fontWeight: '500' },
  emptyIconWrap: {
    width:           64,
    height:          64,
    borderRadius:    32,
    backgroundColor: colors.pitsTables.emptyIconBg,
    alignItems:      'center',
    justifyContent:  'center',
    marginBottom:    4,
  },
  emptyTitle: { fontSize: 15, fontWeight: '600', color: colors.pitsTables.textMid },
  emptySub:   { fontSize: 12, color: colors.pitsTables.textLight, textAlign: 'center' },
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