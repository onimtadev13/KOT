import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  FlatList,
  StatusBar,
  Platform,
  ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@react-native-vector-icons/ionicons';
import { useAppStore } from '../Store/store';
import { loadPitOrder, PitOrderResult } from '../Api/api';
import { DrawerActions, useNavigation, useFocusEffect } from '@react-navigation/native';

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

  // ── Table card — same structure as PitsDetailsScreen pit card ──────────────
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
          <Ionicons name="easel-outline" size={22} color={AMBER} />
        </View>

        {/* Name */}
        <View style={S.tableInfo}>
          <Text style={S.tableName}>{item.TblCode}</Text>
        </View>

        {/* Arrow */}
        <View style={S.arrowWrap}>
          <Ionicons name="chevron-forward" size={14} color={AMBER} />
        </View>
      </TouchableOpacity>
    );
  }

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
          <Text style={S.navTitle}>Pit {pitName}</Text>
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

      {/* ── Content ── */}
      {loading ? (
        <View style={S.centerWrap}>
          <ActivityIndicator size="large" color={AMBER} />
          <Text style={S.loadingText}>Loading tables…</Text>
        </View>
      ) : error ? (
        <View style={S.centerWrap}>
          <View style={S.emptyIconWrap}>
            <Ionicons name="cloud-offline-outline" size={32} color={TEXT_LIGHT} />
          </View>
          <Text style={S.emptyTitle}>Could not load tables</Text>
          <Text style={S.emptySub}>{error}</Text>
        </View>
      ) : tables.length === 0 ? (
        <View style={S.centerWrap}>
          <View style={S.emptyIconWrap}>
            <Ionicons name="easel-outline" size={32} color={TEXT_LIGHT} />
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
// Tokens — identical to PitsDetailsScreen
// ─────────────────────────────────────────────────────────────────────────────
const PURPLE_DEEP = '#3B0F8C';
const AMBER       = '#B45309';
const WHITE       = '#FFFFFF';
const BG          = '#F5F6FA';
const CARD        = '#FFFFFF';
const BORDER      = '#EDF0F4';
const TEXT_DARK   = '#1A1D2E';
const TEXT_MID    = '#6B7280';
const TEXT_LIGHT  = '#B0B8C1';

// ─────────────────────────────────────────────────────────────────────────────
// Styles — mirrors PitsDetailsScreen exactly
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
  navSub:   { fontSize: 9, color: 'rgba(255,255,255,0.5)', letterSpacing: 1.5, marginTop: 1 },
  docChip: {
    backgroundColor: 'rgba(255,255,255,0.18)', borderRadius: 20,
    paddingHorizontal: 10, paddingVertical: 5,
    borderWidth: 1, borderColor: 'rgba(255,255,255,0.28)',
  },
  docChipText: { fontSize: 11, color: WHITE, fontWeight: '600' },

  // ── List ──
  list: { paddingHorizontal: 14, paddingTop: 14, paddingBottom: 32, gap: 10 },

  // ── Table card ──
  tableCard: {
    backgroundColor: CARD,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: BORDER,
    flexDirection: 'row',
    alignItems: 'center',
    overflow: 'hidden',
    shadowColor: '#9CA3AF',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.07,
    shadowRadius: 8,
    elevation: 3,
  },
  tableAccent: { width: 4, alignSelf: 'stretch', backgroundColor: AMBER },
  tableIconWrap: {
    width: 48, height: 48, borderRadius: 13,
    backgroundColor: '#FEF3C7',
    alignItems: 'center', justifyContent: 'center',
    marginLeft: 14, marginVertical: 14,
  },
  tableInfo: { flex: 1, paddingHorizontal: 14, paddingVertical: 14 },
  tableName: { fontSize: 15, fontWeight: '700', color: TEXT_DARK },
  arrowWrap: {
    width: 28, height: 28, borderRadius: 14,
    backgroundColor: '#FEF3C7',
    alignItems: 'center', justifyContent: 'center',
    marginRight: 14,
  },

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
  iconBtn: {
    width: 36, height: 36, borderRadius: 10,
    backgroundColor: 'rgba(255,255,255,0.15)',
    alignItems: 'center', justifyContent: 'center',
  },
});