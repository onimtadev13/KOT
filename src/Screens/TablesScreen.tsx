import React, { useEffect, useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  StatusBar,
  Platform,
  TouchableOpacity,
  RefreshControl,
  FlatList,
} from 'react-native';
import { Ionicons } from '@react-native-vector-icons/ionicons';
import { useNavigation, DrawerActions } from '@react-navigation/native';
import { loadTables, FloorResult, TableResult } from '../Api/api';
import { useAppStore } from '../Store/store';
import colors from '../themes/colors';
import LottieView from 'lottie-react-native';

const FLOOR_ICONS = ['business-outline', 'layers-outline', 'briefcase-outline'] as const;

export default function TablesScreen() {
  const nav    = useNavigation<any>();
  const device = useAppStore(state => state.device);
  const orderItemCount  = useAppStore(state => state.orderItemCount);

const itemCount = orderItemCount();

  const [floors,        setFloors]        = useState<FloorResult[]>([]);
  const [tablesByFloor, setTablesByFloor] = useState<TableResult[][]>([]);
  const [loading,       setLoading]       = useState(true);
  const [refreshing,    setRefreshing]    = useState(false);
  const [error,         setError]         = useState<string | null>(null);
  const [selectedTable, setSelectedTable] = useState<string | null>(null);
  const [activeFloor,   setActiveFloor]   = useState(0);

  async function fetchData() {
    setError(null);
    try {
      const result = await loadTables();
      setFloors(result.floors);
      setTablesByFloor(result.tablesByFloor);
    } catch (e: any) {
      setError(e?.message ?? 'Failed to load tables');
    }
  }

  useEffect(() => {
    setLoading(true);
    fetchData().finally(() => setLoading(false));
  }, []);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await fetchData();
    setRefreshing(false);
  }, []);

  const currentTables = tablesByFloor[activeFloor] ?? [];
  const accentColor   = colors.tables.floorColors[activeFloor] ?? colors.tables.purple;

  const renderTable = ({ item }: { item: TableResult }) => {
    const isActive = item.TblCode === selectedTable;
    return (
      <TouchableOpacity
        style={[
          S.tableBtn,
          { borderColor: accentColor + '55' },
          isActive && { backgroundColor: accentColor, borderColor: accentColor },
        ]}
        activeOpacity={0.75}
        onPress={() => {
          setSelectedTable(item.TblCode);
          console.log('[TABLE SELECTED]', item.TblCode);
          // TODO: navigate with item.TblCode
        }}
      >
        <Ionicons
          name="easel-outline"
          size={13}
          color={isActive ? colors.white : accentColor}
        />
        <Text
          style={[S.tableBtnText, { color: isActive ? colors.white : colors.tables.textDark }]}
          numberOfLines={2}
        >
          {item.TblCode}
        </Text>
      </TouchableOpacity>
    );
  };

  return (
    <View style={S.flex}>
      <StatusBar barStyle="light-content" backgroundColor={colors.tables.purpleDeep} />

      {/* ── Nav bar ── */}
      <View style={S.navBar}>
        <TouchableOpacity
          style={S.iconBtn}
          onPress={() => nav.dispatch(DrawerActions.openDrawer())}
          activeOpacity={0.75}
        >
          <Ionicons name="menu-outline" size={24} color={colors.white} />
        </TouchableOpacity>

        <View style={S.navTitleWrap}>
          <Text style={S.navTitle}>Tables</Text>
          <Text style={S.navSub}>SELECT A TABLE</Text>
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

      {/* ── Body ── */}
      {loading ? (
        <View style={S.center}>
          <LottieView
      source={require('../../assets/animations/Loading_Animation.json')}
      autoPlay
      loop
      style={{ width: 120, height: 120 }}
    />
        </View>
      ) : error ? (
        <View style={S.center}>
          <Ionicons name="cloud-offline-outline" size={48} color={colors.tables.textLight} />
          <Text style={S.errorText}>{error}</Text>
          <TouchableOpacity
            style={S.retryBtn}
            onPress={() => { setLoading(true); fetchData().finally(() => setLoading(false)); }}
          >
            <Text style={S.retryText}>Retry</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <View style={S.flex}>

          {/* ── Floor header row ── */}
          <View style={S.headerRow}>
            {floors.map((floor, idx) => {
              const isActive = idx === activeFloor;
              const color    = colors.tables.floorColors[idx] ?? colors.tables.purpleDeep;
              return (
                <TouchableOpacity
                  key={floor.Loca}
                  style={[
                    S.headerCell,
                    { backgroundColor: isActive ? color : colors.tables.floorInactiveBg },
                    idx < floors.length - 1 && S.headerCellBorder,
                  ]}
                  activeOpacity={0.82}
                  onPress={() => {
                    setActiveFloor(idx);
                    setSelectedTable(null);
                  }}
                >
                  <View style={[
                    S.headerIconWrap,
                    { backgroundColor: isActive ? colors.tables.headerIconActiveBg : colors.tables.headerIconInactiveBg },
                  ]}>
                    <Ionicons
                      name={FLOOR_ICONS[idx] ?? 'grid-outline'}
                      size={18}
                      color={isActive ? colors.white : colors.tables.headerIconInactiveColor}
                    />
                  </View>
                  <Text style={S.headerTitle}>{floor.Loca}</Text>
                  {isActive && <View style={S.activeBar} />}
                </TouchableOpacity>
              );
            })}
          </View>

          {/* ── Tables grid for selected floor ── */}
          <FlatList
            data={currentTables}
            keyExtractor={(item, i) => item.TblCode ?? String(i)}
            renderItem={renderTable}
            numColumns={3}
            contentContainerStyle={S.gridContent}
            showsVerticalScrollIndicator={false}
            refreshControl={
              <RefreshControl
                refreshing={refreshing}
                onRefresh={onRefresh}
                colors={[colors.tables.purple]}
                tintColor={colors.tables.purple}
              />
            }
            ListEmptyComponent={
              <View style={S.empty}>
                <Ionicons name="grid-outline" size={40} color={colors.tables.textLight} />
                <Text style={S.emptyText}>No tables for this floor</Text>
              </View>
            }
            columnWrapperStyle={S.columnWrapper}
          />

        </View>
      )}
    </View>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Styles
// ─────────────────────────────────────────────────────────────────────────────
const S = StyleSheet.create({
  flex: { flex: 1, backgroundColor: colors.tables.bg },

  // ── Nav ──
  navBar: {
    backgroundColor:   colors.tables.purpleDeep,
    paddingTop:        Platform.OS === 'ios' ? 52 : 32,
    paddingBottom:     16,
    paddingHorizontal: 12,
    flexDirection:     'row',
    alignItems:        'center',
    gap:               8,
  },
  iconBtn: {
    width:           40,
    height:          40,
    borderRadius:    12,
    backgroundColor: colors.overlay.white15,
    alignItems:      'center',
    justifyContent:  'center',
  },
  navTitleWrap: { flex: 1, alignItems: 'center' },
  navTitle: { fontSize: 20, fontWeight: '800', color: colors.white, letterSpacing: 0.8 },
  navSub: {
    fontSize:      10,
    fontWeight:    '600',
    color:         colors.overlay.muted65,
    letterSpacing: 2,
    marginTop:     2,
  },

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

  // ── States ──
  center:      { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 14 },
  loadingText: { fontSize: 16, color: colors.tables.textLight, fontWeight: '600' },
  errorText: {
    fontSize:          16,
    color:             colors.tables.errorText,
    fontWeight:        '600',
    textAlign:         'center',
    paddingHorizontal: 32,
  },
  retryBtn: {
    backgroundColor:   colors.tables.purple,
    borderRadius:      12,
    paddingHorizontal: 28,
    paddingVertical:   12,
  },
  retryText: { fontSize: 15, fontWeight: '700', color: colors.white },

  // ── Floor header row ──
  headerRow: {
    flexDirection: 'row',
    shadowColor:   colors.tables.headerShadow,
    shadowOffset:  { width: 0, height: 2 },
    shadowOpacity: 0.10,
    shadowRadius:  6,
    elevation:     5,
  },
  headerCell: {
    flex:            1,
    alignItems:      'center',
    justifyContent:  'center',
    gap:             6,
    paddingVertical: 16,
    paddingHorizontal: 8,
    overflow:        'hidden',
  },
  headerCellBorder: {
    borderRightWidth: 1,
    borderRightColor: colors.tables.headerCellDivider,
  },
  headerIconWrap: {
    width:          36,
    height:         36,
    borderRadius:   10,
    alignItems:     'center',
    justifyContent: 'center',
  },
  headerTitle: {
    fontSize:      13,
    fontWeight:    '800',
    color:         colors.tables.headerTitleColor,
    textAlign:     'center',
    letterSpacing: 0.3,
  },
  activeBar: {
    position:            'absolute',
    bottom:              0,
    left:                0,
    right:               0,
    height:              3,
    backgroundColor:     colors.tables.activeBarColor,
    borderTopLeftRadius: 3,
    borderTopRightRadius: 3,
  },

  // ── Table grid ──
  gridContent:   { padding: 12, paddingBottom: 30 },
  columnWrapper: { gap: 10, marginBottom: 10 },
  tableBtn: {
    flex:              1,
    flexDirection:     'row',
    alignItems:        'center',
    gap:               6,
    borderWidth:       1.5,
    borderRadius:      10,
    paddingHorizontal: 10,
    paddingVertical:   9,
    backgroundColor:   colors.tables.tableBtnBg,
    shadowColor:       colors.tables.tableBtnShadow,
    shadowOffset:      { width: 0, height: 1 },
    shadowOpacity:     0.06,
    shadowRadius:      4,
    elevation:         2,
  },
  tableBtnText: {
    fontSize:   13,
    fontWeight: '700',
    flex:       1,
    lineHeight: 18,
  },

  // ── Empty ──
  empty:     { alignItems: 'center', justifyContent: 'center', paddingTop: 80, gap: 12 },
  emptyText: { fontSize: 15, color: colors.tables.textLight, fontWeight: '600' },
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