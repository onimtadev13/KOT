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
import { loadPits, PitResult } from '../Api/api';
import { DrawerActions, useNavigation } from '@react-navigation/native';
import colors from '../themes/colors';
import LottieView from 'lottie-react-native';

// ─────────────────────────────────────────────────────────────────────────────
// PitsDetailsScreen
// ─────────────────────────────────────────────────────────────────────────────
export default function PitsDetailsScreen({ navigation }: { navigation: any }) {
  const nav             = useNavigation<any>();
const device          = useAppStore(state => state.device);
const storedPits      = useAppStore(state => state.pits);
const setStorePits    = useAppStore(state => state.setPits);
const orderItemCount  = useAppStore(state => state.orderItemCount);

const itemCount = orderItemCount();

  const [pits,    setPits]    = useState<PitResult[]>(storedPits);
  const [loading, setLoading] = useState(storedPits.length === 0);
  const [error,   setError]   = useState<string | null>(null);

  useEffect(() => {
    if (storedPits.length > 0) {
      setPits(storedPits);
      setLoading(false);
      return;
    }
    fetchPits();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  async function fetchPits() {
    setLoading(true);
    setError(null);
    try {
      const result = await loadPits();
      const valid  = result.filter(p => p.Pit_Name.trim() !== '');
      setPits(valid);
      setStorePits(valid);
    } catch {
      setError('Failed to load pits.');
    } finally {
      setLoading(false);
    }
  }

  function handleSelectPit(pit: PitResult) {
    console.log('[PITS] Selected:', pit.Pit_Name);
    navigation.navigate('PitsTables', { pitName: pit.Pit_Name });
  }

  function renderPit({ item, index }: { item: PitResult; index: number }) {
    return (
      <TouchableOpacity
        style={S.pitCard}
        onPress={() => handleSelectPit(item)}
        activeOpacity={0.82}
      >
        <View style={S.pitAccent} />
        <View style={S.pitIconWrap}>
          <Ionicons name="grid" size={22} color={colors.goldDark} />
        </View>
        <View style={S.pitInfo}>
          <Text style={S.pitName}>
            {item.Pit_Name ? `Pit ${item.Pit_Name}` : `Pit ${index + 1}`}
          </Text>
          <Text style={S.pitSub}>Tap to view tables</Text>
        </View>
        <View style={S.arrowWrap}>
          <Ionicons name="chevron-forward" size={14} color={colors.goldDark} />
        </View>
      </TouchableOpacity>
    );
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
          <Text style={S.navTitle}>Pits</Text>
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

      {/* ── States ── */}
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
            <Ionicons name="cloud-offline-outline" size={32} color={colors.muted} />
          </View>
          <Text style={S.emptyTitle}>Could not load pits</Text>
          <Text style={S.emptySub}>{error}</Text>
          <TouchableOpacity style={S.retryBtn} onPress={fetchPits} activeOpacity={0.8}>
            <Ionicons name="refresh-outline" size={16} color={colors.white} />
            <Text style={S.retryText}>Retry</Text>
          </TouchableOpacity>
        </View>

      ) : pits.length === 0 ? (
        <View style={S.centerWrap}>
          <View style={S.emptyIconWrap}>
            <Ionicons name="grid-outline" size={32} color={colors.muted} />
          </View>
          <Text style={S.emptyTitle}>No pits found</Text>
          <Text style={S.emptySub}>Check your connection and try again</Text>
        </View>

      ) : (
        <FlatList
          data={pits}
          keyExtractor={(item, index) => item.Pit_Name || String(index)}
          renderItem={renderPit}
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
  flex: { flex: 1, backgroundColor: colors.background },

  // ── Nav bar ──────────────────────────────────────────────────────────────────
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

  // ── Doc chip ──────────────────────────────────────────────────────────────────
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

  // ── List ──────────────────────────────────────────────────────────────────────
  list: { paddingHorizontal: 14, paddingTop: 14, paddingBottom: 32, gap: 10 },

  // ── Pit card ──────────────────────────────────────────────────────────────────
  pitCard: {
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
  pitAccent: { width: 4, alignSelf: 'stretch', backgroundColor: colors.goldDark },
  pitIconWrap: {
    width:          48,
    height:         48,
    borderRadius:   13,
    backgroundColor:colors.buttons.executiveStaff.bg,
    alignItems:     'center',
    justifyContent: 'center',
    marginLeft:     14,
    marginVertical: 14,
  },
  pitInfo:  { flex: 1, paddingHorizontal: 14, paddingVertical: 14 },
  pitName: {
    fontSize:     15,
    fontWeight:   '700',
    color:        colors.text.dark,
    marginBottom: 3,
  },
  pitSub: { fontSize: 11, color: colors.muted, fontWeight: '500' },
  arrowWrap: {
    width:           28,
    height:          28,
    borderRadius:    14,
    backgroundColor: colors.buttons.executiveStaff.bg,
    alignItems:      'center',
    justifyContent:  'center',
    marginRight:     14,
  },

  // ── Centre states ─────────────────────────────────────────────────────────────
  centerWrap: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 12 },
  loadingText:  { fontSize: 14, color: colors.text.muted, fontWeight: '500' },
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