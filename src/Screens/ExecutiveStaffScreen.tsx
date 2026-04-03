import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  FlatList,
  StatusBar,
  Platform,
  TextInput,
} from 'react-native';
import { Ionicons } from '@react-native-vector-icons/ionicons';
import { useAppStore } from '../Store/store';
import { loadExecStaff, ExecStaffResult } from '../Api/api';
import { DrawerActions, useNavigation } from '@react-navigation/native';
import colors from '../themes/colors';
// Add this import at the top
import LottieView from 'lottie-react-native';

// ─────────────────────────────────────────────────────────────────────────────
// Accent palette — sourced from colors
// ─────────────────────────────────────────────────────────────────────────────
const ACCENTS = [
  { color: colors.primary,              bg: colors.buttons.guest.bg          },
  { color: colors.accent,               bg: colors.buttons.visitor.bg        },
  { color: colors.goldDark,             bg: colors.buttons.executiveStaff.bg },
  { color: colors.primaryDeep,          bg: colors.buttons.pits.bg           },
  { color: colors.primary,              bg: colors.buttons.tables.bg         },
  { color: colors.primaryDeep,          bg: colors.buttons.qrScan.bg         },
  { color: colors.goldDark,             bg: colors.buttons.vip.bg            },
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
      <View style={[S.avatar, { backgroundColor: bg, borderColor: color + '55' }]}>
        <Text style={[S.avatarText, { color }]}>{initials}</Text>
      </View>
      <View style={S.cardInfo}>
        <Text style={S.cardName} numberOfLines={1}>{item.Staff_Name}</Text>
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
  const nav            = useNavigation<any>();
  const device         = useAppStore(state => state.device);
  const storedStaff    = useAppStore(state => state.execStaff);
  const setStoreStaff  = useAppStore(state => state.setExecStaff);
  const setOrderContext = useAppStore(state => state.setOrderContext);

  const [allStaff, setAllStaff] = useState<ExecStaffResult[]>(storedStaff);
  const [filtered, setFiltered] = useState<ExecStaffResult[]>(storedStaff);
  const [query,    setQuery]    = useState('');
  const [loading,  setLoading]  = useState(storedStaff.length === 0);
  const [error,    setError]    = useState<string | null>(null);

  useEffect(() => {
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
        device?.Doc_No   ?? '',
        device?.UniqueId ?? '',
      );
      setAllStaff(list);
      setFiltered(list);
      setQuery('');
      setStoreStaff(list);
    } catch {
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
    setOrderContext({
      type:      'executive_staff',
      staffCode: item.Staff_Code,
      staffName: item.Staff_Name,
      staffIdNo: item.Id_No,
    });
    console.log('[EXEC STAFF] Order context set:', item.Staff_Name);
    navigation.navigate('Menu');
  }

  return (
    <View style={S.flex}>
      <StatusBar barStyle="light-content" backgroundColor={colors.primary} />

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
          <Text style={S.navTitle}>Executive Staff</Text>
          <Text style={S.navSub}>Kitchen Order Ticket</Text>
        </View>

        {/* Doc chip — matches GuestDetailsScreen */}
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

      {/* ── Search bar ── */}
      {!loading && !error && allStaff.length > 0 && (
        <View style={S.searchWrap}>
          <View style={S.searchBox}>
            <Ionicons
              name="search-outline"
              size={17}
              color={colors.muted}
              style={{ marginRight: 8 }}
            />
            <TextInput
              style={S.searchInput}
              value={query}
              onChangeText={handleSearch}
              placeholder="Search by name or code…"
              placeholderTextColor={colors.muted}
              autoCapitalize="characters"
              returnKeyType="search"
            />
            {query.length > 0 && (
              <TouchableOpacity
                onPress={handleClear}
                hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
              >
                <Ionicons name="close-circle" size={18} color={colors.muted} />
              </TouchableOpacity>
            )}
          </View>
        </View>
      )}

      {/* ── States ── */}
      {loading ? (
        <View style={S.centreWrap}>
    <LottieView
      source={require('../../assets/animations/Loading_Animation.json')}
      autoPlay
      loop
      style={{ width: 120, height: 120 }}
    />
  </View>

      ) : error ? (
        <View style={S.centreWrap}>
          <View style={S.emptyIconWrap}>
            <Ionicons name="cloud-offline-outline" size={32} color={colors.muted} />
          </View>
          <Text style={S.emptyTitle}>Could not load</Text>
          <Text style={S.emptySub}>{error}</Text>
          <TouchableOpacity style={S.retryBtn} onPress={fetchStaff} activeOpacity={0.8}>
            <Ionicons name="refresh-outline" size={16} color={colors.white} />
            <Text style={S.retryText}>Retry</Text>
          </TouchableOpacity>
        </View>

      ) : filtered.length === 0 ? (
        <View style={S.centreWrap}>
          <View style={S.emptyIconWrap}>
            <Ionicons name="people-outline" size={32} color={colors.muted} />
          </View>
          <Text style={S.emptyTitle}>{query ? 'No results' : 'No staff found'}</Text>
          <Text style={S.emptySub}>
            {query ? `Nothing matched "${query}"` : 'No records for this unit'}
          </Text>
          {!!query && (
            <TouchableOpacity style={S.retryBtn} onPress={handleClear} activeOpacity={0.8}>
              <Ionicons name="close-outline" size={16} color={colors.white} />
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

// ─────────────────────────────────────────────────────────────────────────────
// Styles
// ─────────────────────────────────────────────────────────────────────────────
const S = StyleSheet.create({
  flex: { flex: 1, backgroundColor: colors.background },

  // ── Nav bar ────────────────────────────────────────────────────────────────
  navBar: {
    backgroundColor:   colors.primary,
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

  // ── Doc chip — dark bg, gold text, matches GuestDetailsScreen ─────────────
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

  // ── Search ─────────────────────────────────────────────────────────────────
  searchWrap: { paddingHorizontal: 14, paddingTop: 12, paddingBottom: 2 },
  searchBox: {
    flexDirection:     'row',
    alignItems:        'center',
    backgroundColor:   colors.card,
    borderRadius:      13,
    borderWidth:       1.5,
    borderColor:       colors.border,
    paddingHorizontal: 14,
    elevation:         2,
    shadowColor:       colors.shadow.card,
    shadowOffset:      { width: 0, height: 1 },
    shadowOpacity:     0.06,
    shadowRadius:      6,
  },
  searchInput: { flex: 1, fontSize: 14, color: colors.text.dark, paddingVertical: 12 },

  // ── List ───────────────────────────────────────────────────────────────────
  list: { paddingHorizontal: 14, paddingTop: 12, paddingBottom: 32, gap: 10 },

  // ── Staff card ─────────────────────────────────────────────────────────────
  card: {
    backgroundColor: colors.card,
    borderRadius:    16,
    borderWidth:     1,
    borderColor:     colors.border,
    flexDirection:   'row',
    alignItems:      'center',
    overflow:        'hidden',
    shadowColor:     colors.shadow.card,
    shadowOffset:    { width: 0, height: 2 },
    shadowOpacity:   0.07,
    shadowRadius:    8,
    elevation:       3,
  },
  cardAccent: { width: 4, alignSelf: 'stretch' },
  avatar: {
    width:         46,
    height:        46,
    borderRadius:  23,
    alignItems:    'center',
    justifyContent:'center',
    marginLeft:    14,
    marginVertical:14,
    borderWidth:   1.5,
  },
  avatarText: { fontSize: 16, fontWeight: '800' },
  cardInfo:   { flex: 1, paddingHorizontal: 12, paddingVertical: 14 },
  cardName: {
    fontSize:      15,
    fontWeight:    '700',
    color:         colors.text.dark,
    letterSpacing: -0.1,
  },
  cardArrow: {
    width:          28,
    height:         28,
    borderRadius:   14,
    alignItems:     'center',
    justifyContent: 'center',
    marginRight:    14,
  },

  // ── Centre states ──────────────────────────────────────────────────────────
  centreWrap: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 10 },
  loadingText: { fontSize: 14, color: colors.text.muted, fontWeight: '500' },
  emptyIconWrap: {
    width:           64,
    height:          64,
    borderRadius:    32,
    backgroundColor: colors.background,
    alignItems:      'center',
    justifyContent:  'center',
    marginBottom:    4,
  },
  emptyTitle: { fontSize: 15, fontWeight: '600', color: colors.text.muted },
  emptySub:   { fontSize: 12, color: colors.muted, textAlign: 'center' },
  retryBtn: {
    flexDirection:     'row',
    alignItems:        'center',
    gap:               8,
    backgroundColor:   colors.primary,
    borderRadius:      12,
    paddingHorizontal: 20,
    paddingVertical:   11,
    marginTop:         6,
  },
  retryText: { fontSize: 14, fontWeight: '700', color: colors.white },
});