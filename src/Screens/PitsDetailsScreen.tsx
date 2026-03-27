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
import { loadPits, PitResult } from '../Api/api';
import { DrawerActions, useNavigation, useFocusEffect } from '@react-navigation/native';


// ─────────────────────────────────────────────────────────────────────────────
// PitsDetailsScreen
// ─────────────────────────────────────────────────────────────────────────────
export default function PitsDetailsScreen({ navigation }: { navigation: any }) {
   const nav          = useNavigation<any>();
  const device = useAppStore(state => state.device);

  // ── Store: pits cache ─────────────────────────────────────────────────────
  const storedPits = useAppStore(state => state.pits);
  const setStorePits = useAppStore(state => state.setPits);

  const [pits, setPits] = useState<PitResult[]>(storedPits);
  const [loading, setLoading] = useState(storedPits.length === 0);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // If already cached in store, skip API call
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
      const valid = result.filter(p => p.Pit_Name.trim() !== '');
      setPits(valid);
      setStorePits(valid); // ← save to store
    } catch (e: any) {
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
          <Ionicons name="grid" size={22} color={AMBER} />
        </View>
        <View style={S.pitInfo}>
          <Text style={S.pitName}>
            {item.Pit_Name ? `Pit ${item.Pit_Name}` : `Pit ${index + 1}`}
          </Text>
          <Text style={S.pitSub}>Tap to view tables</Text>
        </View>
        <View style={S.arrowWrap}>
          <Ionicons name="chevron-forward" size={14} color={AMBER} />
        </View>
      </TouchableOpacity>
    );
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
          <Text style={S.navTitle}>Pits</Text>
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

      {/* Orange strip */}
      {/* <View style={S.greetStrip}>
        <View style={S.greetAvatar}>
          <Ionicons name="grid" size={20} color={WHITE} />
        </View>
        <View style={S.greetText}>
          <Text style={S.greetTitle}>Select a Pit</Text>
          <Text style={S.greetSub}>
            {loading
              ? 'Loading…'
              : `${pits.length} pit${pits.length !== 1 ? 's' : ''} available`}
          </Text>
        </View>
      </View> */}

      {loading ? (
        <View style={S.centerWrap}>
          <ActivityIndicator size="large" color={AMBER} />
          <Text style={S.loadingText}>Loading pits…</Text>
        </View>
      ) : error ? (
        <View style={S.centerWrap}>
          <View style={S.emptyIconWrap}>
            <Ionicons
              name="cloud-offline-outline"
              size={32}
              color={TEXT_LIGHT}
            />
          </View>
          <Text style={S.emptyTitle}>Could not load pits</Text>
          <Text style={S.emptySub}>{error}</Text>
        </View>
      ) : pits.length === 0 ? (
        <View style={S.centerWrap}>
          <View style={S.emptyIconWrap}>
            <Ionicons name="grid-outline" size={32} color={TEXT_LIGHT} />
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

const PURPLE_DEEP = '#3B0F8C';
const AMBER = '#B45309';
const ORANGE = '#F5830A';
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
  greetStrip: {
    backgroundColor: ORANGE,
    marginHorizontal: 14,
    marginTop: 14,
    marginBottom: 4,
    borderRadius: 16,
    paddingHorizontal: 16,
    paddingVertical: 14,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  greetAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.25)',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1.5,
    borderColor: 'rgba(255,255,255,0.35)',
  },
  greetText: { flex: 1 },
  greetTitle: { fontSize: 15, fontWeight: '800', color: WHITE },
  greetSub: { fontSize: 11, color: 'rgba(255,255,255,0.75)', marginTop: 2 },
  list: { paddingHorizontal: 14, paddingTop: 14, paddingBottom: 32, gap: 10 },
  pitCard: {
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
  pitAccent: { width: 4, alignSelf: 'stretch', backgroundColor: AMBER },
  pitIconWrap: {
    width: 48,
    height: 48,
    borderRadius: 13,
    backgroundColor: '#FEF3C7',
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 14,
    marginVertical: 14,
  },
  pitInfo: { flex: 1, paddingHorizontal: 14, paddingVertical: 14 },
  pitName: {
    fontSize: 15,
    fontWeight: '700',
    color: TEXT_DARK,
    marginBottom: 3,
  },
  pitSub: { fontSize: 11, color: TEXT_LIGHT, fontWeight: '500' },
  arrowWrap: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#FEF3C7',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 14,
  },
  centerWrap: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
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
  iconBtn: {
    width: 36, height: 36, borderRadius: 10,
    backgroundColor: 'rgba(255,255,255,0.15)',
    alignItems: 'center', justifyContent: 'center',
  },

});
