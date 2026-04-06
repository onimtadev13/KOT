import React, { useState, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  FlatList,
  StatusBar,
  Platform,
  TextInput,
  ActivityIndicator,
  Image,
  Keyboard,
  TouchableWithoutFeedback,
} from 'react-native';
import { Ionicons } from '@react-native-vector-icons/ionicons';
import { useAppStore } from '../Store/store';
import { DrawerActions, useNavigation } from '@react-navigation/native';
import colors from '../themes/colors';
import { searchGuests, GuestSearchResult } from '../Api/api';

// ─────────────────────────────────────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────────────────────────────────────
type SearchMode = 'id' | 'name';

// ─────────────────────────────────────────────────────────────────────────────
// Avatar
// ─────────────────────────────────────────────────────────────────────────────
function Avatar({ guest }: { guest: GuestSearchResult }) {
  const initial  = (guest.MName ?? '?').charAt(0).toUpperCase();
  const hasImage = !!guest.MemImage2 && guest.MemImage2.trim() !== '';

  if (hasImage) {
    return (
      <Image
        source={{ uri: `data:image/png;base64,${guest.MemImage2}` }}
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

// ─────────────────────────────────────────────────────────────────────────────
// Screen
// ─────────────────────────────────────────────────────────────────────────────
export default function GuestDetailsScreen({
  navigation,
}: {
  navigation: any;
}) {
  const nav             = useNavigation<any>();
  const device          = useAppStore(state => state.device);
  const setOrderContext = useAppStore(state => state.setOrderContext);
  const orderItemCount  = useAppStore(state => state.orderItemCount);

  const itemCount = orderItemCount();

  const [searchMode,  setSearchMode]  = useState<SearchMode>('id');
  const [searchQuery, setSearchQuery] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const [searchDone,  setSearchDone]  = useState(false);
  const [results,     setResults]     = useState<GuestSearchResult[]>([]);

  const inputRef = useRef<TextInput>(null);

  // ── Search ─────────────────────────────────────────────────────────────────
  async function handleSearch() {
    if (!searchQuery.trim()) return;
    Keyboard.dismiss();
    setIsSearching(true);
    setSearchDone(false);
    setResults([]);
    try {
      const data = await searchGuests(searchQuery.trim(), searchMode);
      setResults(data);
    } catch (e) {
      console.error('[GUEST SCREEN] Search error:', e);
      setResults([]);
    } finally {
      setIsSearching(false);
      setSearchDone(true);
    }
  }

  function handleClear() {
    setSearchQuery('');
    setResults([]);
    setSearchDone(false);
  }

  function handleSwitchMode(mode: SearchMode) {
    setSearchMode(mode);
    handleClear();
  }

  function handleSelect(guest: GuestSearchResult) {
    setOrderContext({ type: 'guest', guestId: guest.MID, guestName: guest.MName });
    navigation.navigate('PitsCustomerDetails', {
      MID:     guest.MID,
      MName:   guest.MName,
      tblCode: 'GUEST',
    });
  }

  // ── Guest card ─────────────────────────────────────────────────────────────
  function renderGuest({ item }: { item: GuestSearchResult }) {
    return (
      <View style={S.guestCard}>
        <View style={S.cardAccent} />

        <View style={S.avatarWrap}>
          <Avatar guest={item} />
        </View>

        <View style={S.cardInfo}>
          <Text style={S.guestName} numberOfLines={2}>{item.MName ?? 'Unknown'}</Text>
          <View style={S.idChip}>
            <Ionicons name="card-outline" size={10} color={colors.goldDark} />
            <Text style={S.idChipText}>{item.MID ?? '—'}</Text>
          </View>
        </View>

        <TouchableOpacity
          style={S.plusBtn}
          onPress={() => handleSelect(item)}
          activeOpacity={0.8}
        >
          <Ionicons name="add" size={22} color={colors.white} />
        </TouchableOpacity>
      </View>
    );
  }

  // ── Render ─────────────────────────────────────────────────────────────────
  return (
    // Tapping anywhere outside the input dismisses the keyboard
    <TouchableWithoutFeedback onPress={Keyboard.dismiss} accessible={false}>
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
            <Text style={S.navTitle}>Guest Order</Text>
            <Text style={S.navSub}>Kitchen Order Ticket</Text>
          </View>

          {/* ── Cart icon (matches HomeScreen) ── */}
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

        {/* ── Search card ── */}
        <View style={S.searchCard}>

          <View style={S.cardHeader}>
            <View style={S.cardHeaderIcon}>
              <Ionicons name="search" size={15} color={colors.primary} />
            </View>
            <Text style={S.cardTitle}>Search Member</Text>
          </View>

          {/* Toggle */}
          <View style={S.toggleRow}>
            <TouchableOpacity
              style={[S.toggleBtn, searchMode === 'id' && S.toggleBtnActive]}
              onPress={() => handleSwitchMode('id')}
              activeOpacity={0.8}
            >
              <Ionicons
                name="card-outline"
                size={14}
                color={searchMode === 'id' ? colors.white : colors.text.muted}
              />
              <Text style={[S.toggleText, searchMode === 'id' && S.toggleTextActive]}>
                Member ID
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[S.toggleBtn, searchMode === 'name' && S.toggleBtnActive]}
              onPress={() => handleSwitchMode('name')}
              activeOpacity={0.8}
            >
              <Ionicons
                name="person-outline"
                size={14}
                color={searchMode === 'name' ? colors.white : colors.text.muted}
              />
              <Text style={[S.toggleText, searchMode === 'name' && S.toggleTextActive]}>
                Name
              </Text>
            </TouchableOpacity>
          </View>

          {/* Search input */}
          <View style={S.searchRow}>
            <View style={S.searchInputWrap}>
              <Ionicons
                name={searchMode === 'id' ? 'barcode-outline' : 'search-outline'}
                size={18}
                color={colors.muted}
                style={S.searchIcon}
              />
              <TextInput
                ref={inputRef}
                style={S.searchInput}
                value={searchQuery}
                onChangeText={setSearchQuery}
                placeholder={searchMode === 'id' ? 'Enter member ID…' : 'Enter member name…'}
                placeholderTextColor={colors.muted}
                keyboardType={searchMode === 'id' ? 'number-pad' : 'default'}
                autoCapitalize={searchMode === 'name' ? 'words' : 'none'}
                returnKeyType="search"
                onSubmitEditing={handleSearch}
              />
              {searchQuery.length > 0 && (
                <TouchableOpacity onPress={handleClear} style={S.clearBtn}>
                  <Ionicons name="close-circle" size={18} color={colors.muted} />
                </TouchableOpacity>
              )}
            </View>

            <TouchableOpacity
              style={[S.searchBtn, (!searchQuery.trim() || isSearching) && S.searchBtnDisabled]}
              onPress={handleSearch}
              disabled={!searchQuery.trim() || isSearching}
              activeOpacity={0.85}
            >
              {isSearching
                ? <ActivityIndicator size="small" color={colors.white} />
                : <Ionicons name="search" size={18} color={colors.white} />
              }
            </TouchableOpacity>
          </View>

          {/* Hint */}
          {!searchDone && !isSearching && (
            <View style={S.hintRow}>
              <Ionicons name="information-circle-outline" size={14} color={colors.muted} />
              <Text style={S.hintText}>
                {searchMode === 'id'
                  ? 'Enter the member ID to search'
                  : 'Enter full or partial name to search'}
              </Text>
            </View>
          )}
        </View>

        {/* ── Results / states ── */}
        {isSearching ? (
          <View style={S.centerWrap}>
            <ActivityIndicator size="large" color={colors.gold} />
            <Text style={S.loadingText}>Searching members…</Text>
          </View>
        ) : searchDone && results.length === 0 ? (
          <View style={S.centerWrap}>
            <View style={S.emptyIconWrap}>
              <Ionicons name="person-remove-outline" size={32} color={colors.muted} />
            </View>
            <Text style={S.emptyTitle}>No member found</Text>
            <Text style={S.emptySub}>
              Try a different {searchMode === 'id' ? 'ID' : 'name'}
            </Text>
          </View>
        ) : results.length > 0 ? (
          <FlatList
            data={results}
            keyExtractor={(item, i) => item.MID ?? String(i)}
            renderItem={renderGuest}
            contentContainerStyle={S.list}
            showsVerticalScrollIndicator={false}
            // Dismiss keyboard when the list is scrolled
            keyboardShouldPersistTaps="handled"
            onScrollBeginDrag={Keyboard.dismiss}
          />
        ) : null}
      </View>
    </TouchableWithoutFeedback>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Styles
// ─────────────────────────────────────────────────────────────────────────────
const S = StyleSheet.create({
  flex: { flex: 1, backgroundColor: colors.background },

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
  navSub:   { fontSize: 9, color: colors.overlay.muted65, letterSpacing: 1.5, marginTop: 1 },

  navActions: { position: 'relative' },

  cartBadge: {
    position:        'absolute',
    top:             -4,
    right:           -4,
    minWidth:        16,
    height:          16,
    borderRadius:    8,
    backgroundColor: colors.gold,
    alignItems:      'center',
    justifyContent:  'center',
    paddingHorizontal: 3,
  },
  cartBadgeText: {
    fontSize:   9,
    fontWeight: '800',
    color:      colors.primary,
    lineHeight: 12,
  },

  docChip: {
    backgroundColor:   colors.docChip.bg,
    borderRadius:      12,
    paddingHorizontal: 10,
    paddingVertical:    7,
    alignItems:        'center',
    minWidth:          72,
  },
  docChipIconRow: { flexDirection: 'row', alignItems: 'center', gap: 3, marginBottom: 2 },
  docChipLabel:   { fontSize: 8, color: colors.docChip.labelText, fontWeight: '700', letterSpacing: 0.8, textTransform: 'uppercase' },
  docChipValue:   { fontSize: 15, color: colors.docChip.valueText, fontWeight: '900', letterSpacing: -0.3 },

  searchCard: {
    backgroundColor:   colors.card,
    marginHorizontal:  14,
    marginTop:         14,
    borderRadius:      20,
    borderWidth:       1,
    borderColor:       colors.border,
    padding:           18,
    shadowColor:       colors.shadow.card,
    shadowOffset:      { width: 0, height: 2 },
    shadowOpacity:     0.07,
    shadowRadius:      10,
    elevation:         3,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems:    'center',
    gap:           10,
    marginBottom:  16,
  },
  cardHeaderIcon: {
    width:           30,
    height:          30,
    borderRadius:    9,
    backgroundColor: colors.overlay.gold15,
    alignItems:      'center',
    justifyContent:  'center',
  },
  cardTitle: { fontSize: 15, fontWeight: '700', color: colors.text.dark },

  toggleRow: {
    flexDirection:   'row',
    backgroundColor: colors.background,
    borderRadius:    12,
    padding:         3,
    marginBottom:    14,
    gap:             3,
  },
  toggleBtn: {
    flex:            1,
    flexDirection:   'row',
    alignItems:      'center',
    justifyContent:  'center',
    gap:             6,
    paddingVertical: 9,
    borderRadius:    10,
  },
  toggleBtnActive:  { backgroundColor: colors.primary },
  toggleText:       { fontSize: 13, fontWeight: '600', color: colors.text.muted },
  toggleTextActive: { color: colors.white },

  searchRow:       { flexDirection: 'row', gap: 10, marginBottom: 10 },
  searchInputWrap: {
    flex:              1,
    flexDirection:     'row',
    alignItems:        'center',
    backgroundColor:   colors.background,
    borderRadius:      13,
    borderWidth:       1.5,
    borderColor:       colors.border,
    paddingHorizontal: 12,
  },
  searchIcon:  { marginRight: 8 },
  searchInput: { flex: 1, fontSize: 15, color: colors.text.dark, paddingVertical: 13 },
  clearBtn:    { padding: 4 },

  searchBtn: {
    width:           50,
    height:          50,
    borderRadius:    13,
    backgroundColor: colors.primary,
    alignItems:      'center',
    justifyContent:  'center',
    shadowColor:     colors.primary,
    shadowOffset:    { width: 0, height: 3 },
    shadowOpacity:   0.3,
    shadowRadius:    8,
    elevation:       5,
  },
  searchBtnDisabled: {
    backgroundColor: colors.disabled.iconWrapBg,
    shadowOpacity:   0,
    elevation:       0,
  },

  hintRow: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 2 },
  hintText: { fontSize: 12, color: colors.muted, lineHeight: 18, flex: 1 },

  list: { paddingHorizontal: 14, paddingTop: 14, paddingBottom: 32, gap: 10 },

  guestCard: {
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
  cardAccent: { width: 4, alignSelf: 'stretch', backgroundColor: colors.primary },

  avatarWrap: { marginLeft: 14, marginVertical: 14 },
  avatar: {
    width:        100,
    height:       100,
    borderRadius: 50,
    borderWidth:  2.5,
    borderColor:  colors.overlay.gold30,
  },
  avatarFallback: {
    backgroundColor: colors.primary,
    alignItems:      'center',
    justifyContent:  'center',
  },
  avatarInitial: { fontSize: 26, fontWeight: '800', color: colors.gold },

  cardInfo:  { flex: 1, paddingHorizontal: 14, paddingVertical: 14 },
  guestName: { fontSize: 14, fontWeight: '700', color: colors.text.dark, marginBottom: 6, lineHeight: 20 },
  idChip: {
    flexDirection:     'row',
    alignItems:        'center',
    gap:               4,
    backgroundColor:   colors.overlay.gold15,
    alignSelf:         'flex-start',
    paddingHorizontal: 8,
    paddingVertical:   3,
    borderRadius:      20,
  },
  idChipText: { fontSize: 11, fontWeight: '700', color: colors.goldDark, letterSpacing: 0.3 },

  plusBtn: {
    width:           40,
    height:          40,
    borderRadius:    20,
    backgroundColor: colors.primary,
    alignItems:      'center',
    justifyContent:  'center',
    marginRight:     14,
    shadowColor:     colors.primary,
    shadowOffset:    { width: 0, height: 3 },
    shadowOpacity:   0.3,
    shadowRadius:    6,
    elevation:       4,
  },

  centerWrap:    { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 12 },
  loadingText:   { fontSize: 14, color: colors.text.muted, fontWeight: '500' },
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
});