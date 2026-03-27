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
  Image,
} from 'react-native';
import { Ionicons } from '@react-native-vector-icons/ionicons';
import { useAppStore } from '../Store/store';
import { loadPitCustomers, PitCustomerResult } from '../Api/api';
import { DrawerActions, useNavigation, useFocusEffect } from '@react-navigation/native';

// ─────────────────────────────────────────────────────────────────────────────
// PitsCustomersScreen
// Receives: route.params.tblCode (string)
// API returns: { MID, MName, MemImage2 (base64 PNG) }
// ─────────────────────────────────────────────────────────────────────────────
export default function PitsCustomersScreen({
  navigation,
  route,
}: {
  navigation: any;
  route: any;
}) {
   const nav          = useNavigation<any>();
  const { tblCode } = route.params as { tblCode: string };
  const device = useAppStore(state => state.device);

  const [customers, setCustomers] = useState<PitCustomerResult[]>([]);
  const [loading,   setLoading]   = useState(true);
  const [error,     setError]     = useState<string | null>(null);

  useEffect(() => {
    fetchCustomers();
  }, [tblCode]); // eslint-disable-line react-hooks/exhaustive-deps

  async function fetchCustomers() {
    setLoading(true);
    setError(null);
    try {
      const result = await loadPitCustomers(tblCode);
      setCustomers(result);
    } catch (e: any) {
      setError('Failed to load customer details.');
    } finally {
      setLoading(false);
    }
  }

  function handleAddOrder(customer: PitCustomerResult) {
  navigation.navigate('PitsCustomerDetails', {
    MID:     customer.MID,
    MName:   customer.MName,
    tblCode: tblCode,
  });
}

  // ── Avatar — base64 image or fallback initial ───────────────────────────────
  function Avatar({ customer }: { customer: PitCustomerResult }) {
    const initial  = (customer.MName ?? '?').charAt(0).toUpperCase();
    const hasImage = !!customer.MemImage2 && customer.MemImage2.trim() !== '';

    if (hasImage) {
      return (
        <Image
          source={{ uri: `data:image/png;base64,${customer.MemImage2}` }}
          style={S.avatar}
        />
      );
    }

    return (
      <View style={[S.avatar, S.avatarFallback]}>
        <Text style={S.avatarInitial}>{initial}</Text>
      </View>
    );
  }

  // ── Customer card ───────────────────────────────────────────────────────────
  function renderCustomer({ item }: { item: PitCustomerResult }) {
    return (
      <View style={S.customerCard}>
        {/* Left amber accent */}
        <View style={S.cardAccent} />

        {/* Avatar */}
        <View style={S.avatarWrap}>
          <Avatar customer={item} />
        </View>

        {/* Info */}
        <View style={S.cardInfo}>
          <Text style={S.custName} numberOfLines={2}>{item.MName ?? 'Unknown'}</Text>
          <View style={S.idChip}>
            <Ionicons name="card-outline" size={10} color={AMBER} />
            <Text style={S.idChipText}>{item.MID ?? '—'}</Text>
          </View>
        </View>

        {/* Plus button */}
        <TouchableOpacity
          style={S.plusBtn}
          onPress={() => handleAddOrder(item)}
          activeOpacity={0.8}
        >
          <Ionicons name="add" size={22} color={WHITE} />
        </TouchableOpacity>
      </View>
    );
  }

  // ── Render ──────────────────────────────────────────────────────────────────
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
          <Text style={S.navTitle}>{tblCode}</Text>
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

      {/* ── Table strip ── */}
      {/* <View style={S.tableStrip}>
        <View style={S.tableStripBadge}>
          <Ionicons name="easel-outline" size={14} color={WHITE} />
          <Text style={S.tableStripBadgeText}>{tblCode}</Text>
        </View>
        <Text style={S.tableStripSub}>
          {loading
            ? 'Loading customers…'
            : error
            ? 'Could not load'
            : `${customers.length} customer${customers.length !== 1 ? 's' : ''}`}
        </Text>
        {!loading && !error && (
          <TouchableOpacity onPress={fetchCustomers} style={S.refreshBtn}>
            <Ionicons name="refresh-outline" size={16} color={WHITE} />
          </TouchableOpacity>
        )}
      </View> */}

      {/* ── Content ── */}
      {loading ? (
        <View style={S.centerWrap}>
          <ActivityIndicator size="large" color={AMBER} />
          <Text style={S.loadingText}>Loading customers…</Text>
        </View>
      ) : error ? (
        <View style={S.centerWrap}>
          <View style={S.emptyIconWrap}>
            <Ionicons name="cloud-offline-outline" size={32} color={TEXT_LIGHT} />
          </View>
          <Text style={S.emptyTitle}>Could not load customers</Text>
          <Text style={S.emptySub}>{error}</Text>
          <TouchableOpacity style={S.retryBtn} onPress={fetchCustomers} activeOpacity={0.8}>
            <Ionicons name="refresh-outline" size={15} color={WHITE} />
            <Text style={S.retryBtnText}>Retry</Text>
          </TouchableOpacity>
        </View>
      ) : customers.length === 0 ? (
        <View style={S.centerWrap}>
          <View style={S.emptyIconWrap}>
            <Ionicons name="people-outline" size={32} color={TEXT_LIGHT} />
          </View>
          <Text style={S.emptyTitle}>No customers found</Text>
          <Text style={S.emptySub}>No customers assigned to {tblCode}</Text>
          <TouchableOpacity style={S.retryBtn} onPress={fetchCustomers} activeOpacity={0.8}>
            <Ionicons name="refresh-outline" size={15} color={WHITE} />
            <Text style={S.retryBtnText}>Refresh</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <FlatList
          data={customers}
          keyExtractor={(item, index) => item.MID ?? String(index)}
          renderItem={renderCustomer}
          contentContainerStyle={S.list}
          showsVerticalScrollIndicator={false}
        />
      )}
    </View>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Tokens
// ─────────────────────────────────────────────────────────────────────────────
const PURPLE_DEEP = '#3B0F8C';
const AMBER       = '#B45309';
const ORANGE      = '#F5830A';
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
  navSub:   { fontSize: 9, color: 'rgba(255,255,255,0.5)', letterSpacing: 1.5, marginTop: 1 },
  docChip: {
    backgroundColor: 'rgba(255,255,255,0.18)', borderRadius: 20,
    paddingHorizontal: 10, paddingVertical: 5,
    borderWidth: 1, borderColor: 'rgba(255,255,255,0.28)',
  },
  docChipText: { fontSize: 11, color: WHITE, fontWeight: '600' },

  // ── Table strip ──
  tableStrip: {
    backgroundColor: ORANGE,
    marginHorizontal: 14, marginTop: 14, marginBottom: 4,
    borderRadius: 16, paddingHorizontal: 16, paddingVertical: 14,
    flexDirection: 'row', alignItems: 'center', gap: 10,
  },
  tableStripBadge: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    backgroundColor: 'rgba(255,255,255,0.22)',
    paddingHorizontal: 12, paddingVertical: 6,
    borderRadius: 20, borderWidth: 1.5,
    borderColor: 'rgba(255,255,255,0.35)',
  },
  tableStripBadgeText: { fontSize: 13, fontWeight: '800', color: WHITE },
  tableStripSub: {
    fontSize: 12, color: 'rgba(255,255,255,0.85)',
    fontWeight: '500', flex: 1,
  },
  refreshBtn: {
    width: 32, height: 32, borderRadius: 16,
    backgroundColor: 'rgba(255,255,255,0.2)',
    alignItems: 'center', justifyContent: 'center',
  },

  // ── List ──
  list: { paddingHorizontal: 14, paddingTop: 14, paddingBottom: 32, gap: 10 },

  // ── Customer card ──
  customerCard: {
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
  cardAccent: { width: 4, alignSelf: 'stretch', backgroundColor: AMBER },

  // ── Avatar ──
  avatarWrap: { marginLeft: 14, marginVertical: 14 },
  avatar: {
    width: 100, height: 100, borderRadius: 50,
    borderWidth: 2.5, borderColor: '#FEF3C7',
  },
  avatarFallback: {
    backgroundColor: AMBER,
    alignItems: 'center', justifyContent: 'center',
  },
  avatarInitial: {
    fontSize: 22, fontWeight: '800', color: WHITE,
  },

  // ── Info ──
  cardInfo: { flex: 1, paddingHorizontal: 14, paddingVertical: 14 },
  custName: {
    fontSize: 14, fontWeight: '700',
    color: TEXT_DARK, marginBottom: 6, lineHeight: 20,
  },
  idChip: {
    flexDirection: 'row', alignItems: 'center', gap: 4,
    backgroundColor: '#FEF3C7',
    alignSelf: 'flex-start',
    paddingHorizontal: 8, paddingVertical: 3,
    borderRadius: 20, borderWidth: 1, borderColor: '#FDE68A',
  },
  idChipText: {
    fontSize: 11, fontWeight: '700',
    color: AMBER, letterSpacing: 0.3,
  },

  // ── Plus button ──
  plusBtn: {
    width: 40, height: 40, borderRadius: 20,
    backgroundColor: PURPLE_DEEP,
    alignItems: 'center', justifyContent: 'center',
    marginRight: 14,
    shadowColor: PURPLE_DEEP,
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.3,
    shadowRadius: 6,
    elevation: 4,
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