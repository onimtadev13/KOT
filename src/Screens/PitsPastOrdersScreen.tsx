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
  TextInput,
} from 'react-native';
import { Ionicons } from '@react-native-vector-icons/ionicons';
import { useAppStore } from '../Store/store';
import { loadDepartments, DepartmentResult } from '../Api/api';
import colors from '../themes/colors';
import LottieView from 'lottie-react-native';
import DateTimePicker from '@react-native-community/datetimepicker';
import { DrawerActions, useNavigation } from '@react-navigation/native';

// ─────────────────────────────────────────────────────────────────────────────
// Dept colour palette + icon helper — mirrors MenuScreen exactly
// ─────────────────────────────────────────────────────────────────────────────
const DEPT_COLORS = [
  { color: colors.menu.deptColors[0].color, bg: colors.menu.deptColors[0].bg },
  { color: colors.menu.deptColors[1].color, bg: colors.menu.deptColors[1].bg },
  { color: colors.menu.deptColors[2].color, bg: colors.menu.deptColors[2].bg },
  { color: colors.menu.deptColors[3].color, bg: colors.menu.deptColors[3].bg },
  { color: colors.menu.deptColors[4].color, bg: colors.menu.deptColors[4].bg },
  { color: colors.menu.deptColors[5].color, bg: colors.menu.deptColors[5].bg },
  { color: colors.menu.deptColors[6].color, bg: colors.menu.deptColors[6].bg },
];

function getDeptIcon(name: string): string {
  const n = name.toLowerCase();
  if (n.includes('beverage') || n.includes('drink'))   return 'cafe-outline';
  if (n.includes('liquor')   || n.includes('bar'))     return 'wine-outline';
  if (n.includes('tobacco'))                           return 'flame-outline';
  if (n.includes('pastry')   || n.includes('dessert')) return 'ice-cream-outline';
  if (n.includes('indian'))                            return 'leaf-outline';
  if (n.includes('kitchen')  || n.includes('main'))   return 'restaurant-outline';
  return 'grid-outline';
}

// ─────────────────────────────────────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────────────────────────────────────
type DateMode = 'TODAY' | 'DATE';

// ─────────────────────────────────────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────────────────────────────────────
function todayStr(): string {
  const d = new Date();
  return `${d.getDate().toString().padStart(2, '0')}/${(d.getMonth() + 1)
    .toString()
    .padStart(2, '0')}/${d.getFullYear()}`;
}

// ─────────────────────────────────────────────────────────────────────────────
// Colour alias (module-level so StyleSheet can use it)
// ─────────────────────────────────────────────────────────────────────────────
const C = colors.pitCustomer;

// ─────────────────────────────────────────────────────────────────────────────
// "All" pseudo-department
// ─────────────────────────────────────────────────────────────────────────────
const ALL_DEPT: DepartmentResult = {
  Dept_Code: 'ALL',
  Dept_Name: 'All',
  Id_No:     -1,
  ImageID:   -1,
};

// ─────────────────────────────────────────────────────────────────────────────
// PitsPastOrdersScreen
// ─────────────────────────────────────────────────────────────────────────────
export default function PitsPastOrdersScreen({
  navigation,
  route,
}: {
  navigation: any;
  route: any;
}) {
  const { MID, MName, tblCode } = route.params as {
    MID:     string;
    MName:   string;
    tblCode: string;
  };

  const device   = useAppStore(state => state.device);
  const unitNo   = device?.Device_Id ?? 0;
  const docNo    = device?.Doc_No    ?? '';
  const uniqueId = device?.UniqueId  ?? '';

  // ── State ──────────────────────────────────────────────────────────────────
  const [departments,  setDepartments]  = useState<DepartmentResult[]>([]);
  const nav = useNavigation<any>();

  const [dateMode,       setDateMode]       = useState<DateMode>('TODAY');
  const [selectedDate,   setSelectedDate]   = useState<string>(todayStr());
  const [pickerDate,     setPickerDate]     = useState<Date>(new Date());
  const [showPicker,     setShowPicker]     = useState(false);
  const [loading,        setLoading]        = useState(true);
  const [error,          setError]          = useState<string | null>(null);

  const orderItemCount  = useAppStore(state => state.orderItemCount);

const itemCount = orderItemCount();

  // ── Toggle slide animation ─────────────────────────────────────────────────
  const toggleSlide = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.spring(toggleSlide, {
      toValue:         dateMode === 'TODAY' ? 0 : 1,
      useNativeDriver: false,
      friction:        8,
      tension:         60,
    }).start();
  }, [dateMode]);

  const toggleLeft = toggleSlide.interpolate({
    inputRange:  [0, 1],
    outputRange: ['2%', '50%'],
  });

  // ── Load departments on mount ──────────────────────────────────────────────
  useEffect(() => { fetchDepartments(); }, []);

  async function fetchDepartments() {
    setLoading(true);
    setError(null);
    try {
      const data = await loadDepartments(unitNo, docNo, uniqueId);
      data.sort((a, b) => a.Id_No - b.Id_No);
      setDepartments(data);
    } catch {
      setError('Failed to load departments.');
    } finally {
      setLoading(false);
    }
  }

  // ── Navigate to results screen on dept tap ────────────────────────────────
  function handleDeptPress(dept: DepartmentResult) {
    navigation.navigate('PitsPastOrdersResults', {
      MID,
      MName,
      tblCode,
      deptCode: dept.Dept_Code,
      deptName: dept.Dept_Name,
      dateMode,
      date: dateMode === 'TODAY' ? todayStr() : selectedDate,
    });
  }

  // ── List data: "All" pinned first ─────────────────────────────────────────
  const listData: DepartmentResult[] = [ALL_DEPT, ...departments];

  // ─────────────────────────────────────────────────────────────────────────
  // Sub-components
  // ─────────────────────────────────────────────────────────────────────────

  function DateToggle() {
    return (
      <View style={S.toggleOuter}>
        <Animated.View style={[S.togglePill, { left: toggleLeft }]} />
        <TouchableOpacity
          style={S.toggleOption}
          onPress={() => setDateMode('TODAY')}
          activeOpacity={0.85}
        >
          <Ionicons
            name="today-outline"
            size={14}
            color={dateMode === 'TODAY' ? colors.white : C.textMid}
          />
          <Text style={[S.toggleLabel, dateMode === 'TODAY' && S.toggleLabelActive]}>
            Today
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={S.toggleOption}
          onPress={() => setDateMode('DATE')}
          activeOpacity={0.85}
        >
          <Ionicons
            name="calendar-outline"
            size={14}
            color={dateMode === 'DATE' ? colors.white : C.textMid}
          />
          <Text style={[S.toggleLabel, dateMode === 'DATE' && S.toggleLabelActive]}>
            Date
          </Text>
        </TouchableOpacity>
      </View>
    );
  }

function DateInput() {
    if (dateMode !== 'DATE') return null;
    return (
      <View>
        <TouchableOpacity
          style={S.dateInputWrap}
          onPress={() => setShowPicker(true)}
          activeOpacity={0.8}
        >
          <Ionicons name="calendar-outline" size={15} color={C.amber} style={{ marginRight: 8 }} />
          <Text style={[S.dateInput, { paddingVertical: 9 }]}>{selectedDate}</Text>
          <Ionicons name="chevron-down-outline" size={15} color={C.textLight} />
        </TouchableOpacity>

        {showPicker && (
          <DateTimePicker
            value={pickerDate}
            mode="date"
            display={Platform.OS === 'ios' ? 'spinner' : 'default'}
            onChange={(event, date) => {
              setShowPicker(Platform.OS === 'ios');
              if (event.type === 'dismissed') { setShowPicker(false); return; }
              if (date) {
                setPickerDate(date);
                const d = date.getDate().toString().padStart(2, '0');
                const m = (date.getMonth() + 1).toString().padStart(2, '0');
                const y = date.getFullYear();
                setSelectedDate(`${d}/${m}/${y}`);
              }
            }}
          />
        )}
      </View>
    );
  }

  // ── Full-width dept card — pixel-perfect match to MenuScreen ──────────────
  function renderDept({ item, index }: { item: DepartmentResult; index: number }) {
    const { color, bg } = DEPT_COLORS[index % DEPT_COLORS.length];
    const icon          = item.Dept_Code === 'ALL' ? 'layers-outline' : getDeptIcon(item.Dept_Name);

    return (
      <TouchableOpacity
        style={S.card}
        activeOpacity={0.82}
        onPress={() => handleDeptPress(item)}
      >
        <View style={[S.cardAccent, { backgroundColor: color }]} />
        <View style={[S.cardIconWrap, { backgroundColor: bg }]}>
          <Ionicons name={icon as any} size={22} color={color} />
        </View>
        <View style={S.cardInfo}>
          <Text style={S.cardName}>{item.Dept_Name}</Text>
        </View>
        <View style={[S.cardArrow, { backgroundColor: bg }]}>
          <Ionicons name="chevron-forward" size={14} color={color} />
        </View>
      </TouchableOpacity>
    );
  }

  // ─────────────────────────────────────────────────────────────────────────
  // Render
  // ─────────────────────────────────────────────────────────────────────────
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
          <Text style={S.navTitle} numberOfLines={1}>Past Orders</Text>
          <Text style={S.navSub} numberOfLines={1}>{MName}</Text>
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

      {/* ── Member strip ── */}
      <View style={S.memberStrip}>
        <View style={S.memberStripLeft}>
          <View style={S.memberInitialBadge}>
            <Text style={S.memberInitialText}>{MName.charAt(0).toUpperCase()}</Text>
          </View>
          <View>
            <Text style={S.memberStripName} numberOfLines={1}>{MName}</Text>
            <View style={S.memberStripIdRow}>
              <Ionicons name="card-outline" size={10} color={C.amber} />
              <Text style={S.memberStripId}>ID: {MID}</Text>
            </View>
          </View>
        </View>
        <View style={S.tableBadge}>
          <Ionicons name="easel-outline" size={10} color={C.purpleDeep} />
          <Text style={S.tableBadgeText}>{tblCode}</Text>
        </View>
      </View>

      {/* ── Date toggle + date input ── */}
      <View style={S.filtersCard}>
        <DateToggle />
        <DateInput />
      </View>

      {/* ── Dept list ── */}
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
          <Text style={S.emptyTitle}>Could not load</Text>
          <Text style={S.emptySub}>{error}</Text>
          <TouchableOpacity style={S.retryBtn} onPress={fetchDepartments} activeOpacity={0.8}>
            <Ionicons name="refresh-outline" size={14} color={colors.white} />
            <Text style={S.retryBtnText}>Retry</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <FlatList
          data={listData}
          keyExtractor={d => d.Dept_Code}
          renderItem={renderDept}
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
  navSub:   { fontSize: 10, fontWeight: '500', color: colors.overlay.muted65, letterSpacing: 0.5, marginTop: 1 },

  // ── Doc chip ───────────────────────────────────────────────────────────────
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

  // ── Member strip ───────────────────────────────────────────────────────────
  memberStrip: {
    backgroundColor:   C.card,
    marginHorizontal:  14,
    marginTop:         14,
    borderRadius:      16,
    borderWidth:       1,
    borderColor:       C.border,
    paddingHorizontal: 14,
    paddingVertical:   12,
    flexDirection:     'row',
    alignItems:        'center',
    justifyContent:    'space-between',
    shadowColor:       colors.shadow.card,
    shadowOffset:      { width: 0, height: 2 },
    shadowOpacity:     0.07,
    shadowRadius:      8,
    elevation:         3,
  },
  memberStripLeft:    { flexDirection: 'row', alignItems: 'center', gap: 10, flex: 1 },
  memberInitialBadge: {
    width:           40,
    height:          40,
    borderRadius:    20,
    backgroundColor: C.amber,
    alignItems:      'center',
    justifyContent:  'center',
  },
  memberInitialText: { fontSize: 18, fontWeight: '900', color: colors.white },
  memberStripName:   { fontSize: 14, fontWeight: '700', color: C.textDark, maxWidth: 180 },
  memberStripIdRow:  { flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 2 },
  memberStripId:     { fontSize: 11, fontWeight: '600', color: C.amber },
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

  // ── Filters card ───────────────────────────────────────────────────────────
  filtersCard: {
    backgroundColor:   C.card,
    marginHorizontal:  14,
    marginTop:         12,
    borderRadius:      16,
    borderWidth:       1,
    borderColor:       C.border,
    paddingHorizontal: 12,
    paddingVertical:   12,
    gap:               10,
    shadowColor:       colors.shadow.card,
    shadowOffset:      { width: 0, height: 2 },
    shadowOpacity:     0.07,
    shadowRadius:      8,
    elevation:         3,
  },

  // ── Toggle ─────────────────────────────────────────────────────────────────
  toggleOuter: {
    flexDirection:   'row',
    backgroundColor: '#F3F4F6',
    borderRadius:    12,
    padding:         3,
    position:        'relative',
    height:          42,
    alignItems:      'center',
  },
  togglePill: {
    position:        'absolute',
    width:           '48%',
    height:          36,
    borderRadius:    10,
    backgroundColor: C.purpleDeep,
    shadowColor:     C.purpleDeep,
    shadowOffset:    { width: 0, height: 2 },
    shadowOpacity:   0.35,
    shadowRadius:    6,
    elevation:       4,
  },
  toggleOption: {
    flex:           1,
    flexDirection:  'row',
    alignItems:     'center',
    justifyContent: 'center',
    gap:            6,
    height:         36,
    borderRadius:   10,
    zIndex:         1,
  },
  toggleLabel:       { fontSize: 13, fontWeight: '700', color: C.textMid },
  toggleLabelActive: { color: colors.white },

  // ── Date input ─────────────────────────────────────────────────────────────
  dateInputWrap: {
    flexDirection:     'row',
    alignItems:        'center',
    backgroundColor:   '#F9FAFB',
    borderRadius:      12,
    borderWidth:       1,
    borderColor:       C.border,
    paddingHorizontal: 12,
    paddingVertical:   9,
  },
 dateInput: {
    flex:       1,
    fontSize:   14,
    fontWeight: '600',
    color:      C.textDark,
  },

  // ── Dept list ──────────────────────────────────────────────────────────────
  list: { paddingHorizontal: 14, paddingTop: 14, paddingBottom: 32, gap: 10 },

  // ── Dept card — exact copy of MenuScreen card style ────────────────────────
  card: {
    backgroundColor: C.card,
    borderRadius:    16,
    borderWidth:     1,
    borderColor:     C.border,
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
  cardIconWrap: {
    width:          48,
    height:         48,
    borderRadius:   13,
    alignItems:     'center',
    justifyContent: 'center',
    marginLeft:     14,
    marginVertical: 14,
  },
  cardInfo: { flex: 1, paddingHorizontal: 14, paddingVertical: 12 },
  cardName: {
    fontSize:      15,
    fontWeight:    '700',
    color:         C.textDark,
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

  // ── States ─────────────────────────────────────────────────────────────────
  centerWrap: {
    flex:           1,
    alignItems:     'center',
    justifyContent: 'center',
    gap:            12,
  },
  emptyIconWrap: {
    width:           64,
    height:          64,
    borderRadius:    32,
    backgroundColor: '#F3F4F6',
    alignItems:      'center',
    justifyContent:  'center',
    marginBottom:    4,
  },
  emptyTitle: { fontSize: 15, fontWeight: '600', color: C.textMid },
  emptySub:   { fontSize: 12, color: C.textLight, textAlign: 'center' },
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