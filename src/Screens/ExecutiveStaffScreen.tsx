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
  TextInput,
} from 'react-native';
import { Ionicons } from '@react-native-vector-icons/ionicons';
import { useAppStore } from '../Store/store';
import { loadExecStaff, ExecStaffResult } from '../Api/api';
import {
  DrawerActions,
  useNavigation,
  useFocusEffect,
} from '@react-navigation/native';

// ─────────────────────────────────────────────────────────────────────────────
// Accent palette
// ─────────────────────────────────────────────────────────────────────────────
const ACCENTS = [
  { color: '#6C1FC9', bg: '#F3EEFF' },
  { color: '#0369A1', bg: '#E0F2FE' },
  { color: '#0F766E', bg: '#CCFBF1' },
  { color: '#B45309', bg: '#FEF3C7' },
  { color: '#B91C1C', bg: '#FEE2E2' },
  { color: '#1D4ED8', bg: '#DBEAFE' },
  { color: '#7C3AED', bg: '#EDE9FE' },
];

// ─────────────────────────────────────────────────────────────────────────────
// Staff card
// ─────────────────────────────────────────────────────────────────────────────
function StaffCard({
  item,
  index,
  onPress,
}: {
  item: ExecStaffResult;
  index: number;
  onPress: (item: ExecStaffResult) => void;
}) {
  const { color, bg } = ACCENTS[index % ACCENTS.length];
  const initials = item.Staff_Name.split(/[\s(]+/)
    .filter(Boolean)
    .slice(0, 2)
    .map(w => w.charAt(0).toUpperCase())
    .join('');

  return (
    <TouchableOpacity
      style={S.card}
      activeOpacity={0.82}
      onPress={() => onPress(item)}
    >
      <View style={[S.cardAccent, { backgroundColor: color }]} />
      <View
        style={[S.avatar, { backgroundColor: bg, borderColor: color + '55' }]}
      >
        <Text style={[S.avatarText, { color }]}>{initials}</Text>
      </View>
      <View style={S.cardInfo}>
        <Text style={S.cardName} numberOfLines={1}>
          {item.Staff_Name}
        </Text>
      </View>
      <View style={[S.cardArrow, { backgroundColor: bg }]}>
        <Ionicons name="chevron-forward" size={14} color={color} />
      </View>
    </TouchableOpacity>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// ExecutiveStaffScreen
// ─────────────────────────────────────────────────────────────────────────────
export default function ExecutiveStaffScreen({
  navigation,
}: {
  navigation: any;
}) {
   const nav          = useNavigation<any>();
  const device = useAppStore(state => state.device);

  // ── Store: staff cache + order context ───────────────────────────────────
  const storedStaff = useAppStore(state => state.execStaff);
  const setStoreStaff = useAppStore(state => state.setExecStaff);
  const setOrderContext = useAppStore(state => state.setOrderContext);

  const [allStaff, setAllStaff] = useState<ExecStaffResult[]>(storedStaff);
  const [filtered, setFiltered] = useState<ExecStaffResult[]>(storedStaff);
  const [query, setQuery] = useState('');
  const [loading, setLoading] = useState(storedStaff.length === 0);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // If already cached in store, skip API call
    if (storedStaff.length > 0) {
      setAllStaff(storedStaff);
      setFiltered(storedStaff);
      setLoading(false);
      return;
    }
    fetchStaff();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  async function fetchStaff() {
    setLoading(true);
    setError(null);
    try {
      const list = await loadExecStaff(
        device?.Device_Id ?? 0,
        device?.Doc_No ?? '',
        device?.UniqueId ?? '',
      );
      setAllStaff(list);
      setFiltered(list);
      setQuery('');
      setStoreStaff(list); // ← save to store
    } catch (e: any) {
      setError('Failed to load executive staff.');
    } finally {
      setLoading(false);
    }
  }

  function handleSearch(text: string) {
    setQuery(text);
    const q = text.trim().toLowerCase();
    setFiltered(
      q
        ? allStaff.filter(
            s =>
              s.Staff_Name.toLowerCase().includes(q) ||
              s.Staff_Code.toLowerCase().includes(q),
          )
        : allStaff,
    );
  }

  function handleClear() {
    setQuery('');
    setFiltered(allStaff);
  }

  function handleStaffPress(item: ExecStaffResult) {
    // ← set order context in store
    setOrderContext({
      type: 'executive_staff',
      staffCode: item.Staff_Code,
      staffName: item.Staff_Name,
      staffIdNo: item.Id_No,
    });
    console.log('[EXEC STAFF] Order context set:', item.Staff_Name);
    navigation.navigate('Menu');
  }

  return (
    <View style={S.flex}>
      <StatusBar barStyle="light-content" backgroundColor={PURPLE_DEEP} />

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
          <Text style={S.navTitle}>Executive Staff</Text>
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

      {!loading && !error && allStaff.length > 0 && (
        <View style={S.searchWrap}>
          <View style={S.searchBox}>
            <Ionicons
              name="search-outline"
              size={17}
              color={TEXT_LIGHT}
              style={{ marginRight: 8 }}
            />
            <TextInput
              style={S.searchInput}
              value={query}
              onChangeText={handleSearch}
              placeholder="Search by name or code…"
              placeholderTextColor={TEXT_LIGHT}
              autoCapitalize="characters"
              returnKeyType="search"
            />
            {query.length > 0 && (
              <TouchableOpacity
                onPress={handleClear}
                hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
              >
                <Ionicons name="close-circle" size={18} color={TEXT_LIGHT} />
              </TouchableOpacity>
            )}
          </View>
        </View>
      )}

      {loading ? (
        <View style={S.centreWrap}>
          <ActivityIndicator size="large" color={PURPLE} />
          <Text style={S.loadingText}>Loading staff list…</Text>
        </View>
      ) : error ? (
        <View style={S.centreWrap}>
          <View style={S.emptyIconWrap}>
            <Ionicons
              name="cloud-offline-outline"
              size={32}
              color={TEXT_LIGHT}
            />
          </View>
          <Text style={S.emptyTitle}>Could not load</Text>
          <Text style={S.emptySub}>{error}</Text>
          <TouchableOpacity
            style={S.retryBtn}
            onPress={fetchStaff}
            activeOpacity={0.8}
          >
            <Ionicons name="refresh-outline" size={16} color={WHITE} />
            <Text style={S.retryText}>Retry</Text>
          </TouchableOpacity>
        </View>
      ) : filtered.length === 0 ? (
        <View style={S.centreWrap}>
          <View style={S.emptyIconWrap}>
            <Ionicons name="people-outline" size={32} color={TEXT_LIGHT} />
          </View>
          <Text style={S.emptyTitle}>
            {query ? 'No results' : 'No staff found'}
          </Text>
          <Text style={S.emptySub}>
            {query ? `Nothing matched "${query}"` : 'No records for this unit'}
          </Text>
          {!!query && (
            <TouchableOpacity
              style={S.retryBtn}
              onPress={handleClear}
              activeOpacity={0.8}
            >
              <Ionicons name="close-outline" size={16} color={WHITE} />
              <Text style={S.retryText}>Clear search</Text>
            </TouchableOpacity>
          )}
        </View>
      ) : (
        <FlatList
          data={filtered}
          keyExtractor={item => String(item.Id_No)}
          renderItem={({ item, index }) => (
            <StaffCard item={item} index={index} onPress={handleStaffPress} />
          )}
          contentContainerStyle={S.list}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        />
      )}
    </View>
  );
}

const PURPLE_DEEP = '#3B0F8C';
const PURPLE = '#6C1FC9';
const WHITE = '#FFFFFF';
const BG = '#F5F6FA';
const CARD = '#FFFFFF';
const BORDER = '#EDF0F4';
const TEXT_DARK = '#1A1D2E';
const TEXT_MID = '#6B7280';
const TEXT_LIGHT = '#B0B8C1';

const S = StyleSheet.create({
  flex: { flex: 1, backgroundColor: BG },
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
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: 'rgba(255,255,255,0.12)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  navTitleWrap: { flex: 1, alignItems: 'center' },
  navTitle: { fontSize: 18, fontWeight: '800', color: WHITE, letterSpacing: 1 },
  navSub: {
    fontSize: 9,
    color: 'rgba(255,255,255,0.5)',
    letterSpacing: 1.5,
    marginTop: 1,
  },
  docChip: {
    backgroundColor: 'rgba(255,255,255,0.18)',
    borderRadius: 20,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.28)',
  },
  docChipText: { fontSize: 11, color: WHITE, fontWeight: '600' },
  searchWrap: { paddingHorizontal: 14, paddingTop: 12, paddingBottom: 2 },
  searchBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: CARD,
    borderRadius: 13,
    borderWidth: 1.5,
    borderColor: BORDER,
    paddingHorizontal: 14,
    elevation: 2,
    shadowColor: '#9CA3AF',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 6,
  },
  searchInput: { flex: 1, fontSize: 14, color: TEXT_DARK, paddingVertical: 12 },
  list: { paddingHorizontal: 14, paddingTop: 12, paddingBottom: 32, gap: 10 },
  card: {
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
  cardAccent: { width: 4, alignSelf: 'stretch' },
  avatar: {
    width: 46,
    height: 46,
    borderRadius: 23,
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 14,
    marginVertical: 14,
    borderWidth: 1.5,
  },
  avatarText: { fontSize: 16, fontWeight: '800' },
  cardInfo: { flex: 1, paddingHorizontal: 12, paddingVertical: 14 },
  cardName: {
    fontSize: 15,
    fontWeight: '700',
    color: TEXT_DARK,
    letterSpacing: -0.1,
  },
  cardArrow: {
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 14,
  },
  centreWrap: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
  },
  loadingText: { fontSize: 14, color: TEXT_MID, fontWeight: '500' },
  emptyIconWrap: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: '#F3F4F6',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 4,
  },
  emptyTitle: { fontSize: 15, fontWeight: '600', color: TEXT_MID },
  emptySub: { fontSize: 12, color: TEXT_LIGHT, textAlign: 'center' },
  retryBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: PURPLE,
    borderRadius: 12,
    paddingHorizontal: 20,
    paddingVertical: 11,
    marginTop: 6,
  },
  retryText: { fontSize: 14, fontWeight: '700', color: WHITE },
  iconBtn: {
    width: 36, height: 36, borderRadius: 10,
    backgroundColor: 'rgba(255,255,255,0.15)',
    alignItems: 'center', justifyContent: 'center',
  },

});
