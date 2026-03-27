import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  StatusBar,
  Platform,
  TextInput,
  ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@react-native-vector-icons/ionicons';
import { useAppStore } from '../Store/store';
import { DrawerActions, useNavigation, useFocusEffect } from '@react-navigation/native';

// ─────────────────────────────────────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────────────────────────────────────
type SearchMode = 'id' | 'name';

type MemberResult = {
  id: string;
  name: string;
  phone: string;
  memberSince: string;
  visits: number;
};

// ─────────────────────────────────────────────────────────────────────────────
// GuestDetailsScreen
// ─────────────────────────────────────────────────────────────────────────────
export default function GuestDetailsScreen({
  navigation,
}: {
  navigation: any;
}) {
   const nav          = useNavigation<any>();
  const device = useAppStore(state => state.device);
  const session = useAppStore(state => state.session);
  const setOrderContext = useAppStore(state => state.setOrderContext);

  const [searchMode, setSearchMode] = useState<SearchMode>('id');
  const [searchQuery, setSearchQuery] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const [searchDone, setSearchDone] = useState(false);
  const [member, setMember] = useState<MemberResult | null>(null);

  async function handleSearch() {
    if (!searchQuery.trim()) return;
    setIsSearching(true);
    setSearchDone(false);
    setMember(null);
    try {
      // TODO: replace with real API call (iid:2 search)
      await new Promise(r => setTimeout(r, 900));
      if (searchQuery.toLowerCase() === 'notfound') {
        setMember(null);
      } else {
        setMember({
          id: 'M-10042',
          name: 'Kawmini Perera',
          phone: '+94 77 123 4567',
          memberSince: 'Jan 2023',
          visits: 24,
        });
      }
    } catch (e) {
      setMember(null);
    } finally {
      setIsSearching(false);
      setSearchDone(true);
    }
  }

  function handleClearSearch() {
    setSearchQuery('');
    setMember(null);
    setSearchDone(false);
  }

  function handleSwitchMode(mode: SearchMode) {
    setSearchMode(mode);
    handleClearSearch();
  }

  // ── Select member → set order context → navigate to Menu ─────────────────
  function handleSelectMember(m: MemberResult) {
    setOrderContext({
      type: 'guest',
      guestId: m.id,
      guestName: m.name,
    });
    console.log('[GUEST] Order context set:', m.name, m.id);
    navigation.navigate('Menu');
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
          <Text style={S.navTitle}>Guest Order</Text>
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

      {/* ── Orange strip ── */}
      {/* <View style={S.greetStrip}>
        <View style={S.greetAvatar}>
          <Ionicons name="person" size={20} color={WHITE} />
        </View>
        <View style={S.greetText}>
          <Text style={S.greetTitle}>Guest Order</Text>
          <Text style={S.greetSub}>
            Logged by {session?.Emp_Name ?? 'Staff'} · Unit{' '}
            {device?.Device_Id ?? '—'}
          </Text>
        </View>
      </View> */}

      <ScrollView
        style={S.scroll}
        contentContainerStyle={S.scrollContent}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        {/* ── Search card ── */}
        <View style={S.card}>
          <View style={S.cardHeader}>
            <View style={S.cardHeaderIcon}>
              <Ionicons name="search" size={15} color={PURPLE} />
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
                color={searchMode === 'id' ? WHITE : TEXT_MID}
              />
              <Text
                style={[
                  S.toggleText,
                  searchMode === 'id' && S.toggleTextActive,
                ]}
              >
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
                color={searchMode === 'name' ? WHITE : TEXT_MID}
              />
              <Text
                style={[
                  S.toggleText,
                  searchMode === 'name' && S.toggleTextActive,
                ]}
              >
                Name
              </Text>
            </TouchableOpacity>
          </View>

          {/* Search row */}
          <View style={S.searchRow}>
            <View style={S.searchInputWrap}>
              <Ionicons
                name={
                  searchMode === 'id' ? 'barcode-outline' : 'search-outline'
                }
                size={18}
                color={TEXT_LIGHT}
                style={S.searchIcon}
              />
              <TextInput
                style={S.searchInput}
                value={searchQuery}
                onChangeText={setSearchQuery}
                placeholder={
                  searchMode === 'id'
                    ? 'Enter member ID…'
                    : 'Enter member name…'
                }
                placeholderTextColor={TEXT_LIGHT}
                autoCapitalize={searchMode === 'name' ? 'words' : 'none'}
                returnKeyType="search"
                onSubmitEditing={handleSearch}
              />
              {searchQuery.length > 0 && (
                <TouchableOpacity
                  onPress={handleClearSearch}
                  style={S.clearBtn}
                >
                  <Ionicons name="close-circle" size={18} color={TEXT_LIGHT} />
                </TouchableOpacity>
              )}
            </View>
            <TouchableOpacity
              style={[
                S.searchBtn,
                (!searchQuery.trim() || isSearching) && S.searchBtnDisabled,
              ]}
              onPress={handleSearch}
              disabled={!searchQuery.trim() || isSearching}
              activeOpacity={0.85}
            >
              {isSearching ? (
                <ActivityIndicator size="small" color={WHITE} />
              ) : (
                <Ionicons name="search" size={18} color={WHITE} />
              )}
            </TouchableOpacity>
          </View>

          {/* Hint */}
          {!searchDone && !isSearching && (
            <View style={S.hintRow}>
              <Ionicons
                name="information-circle-outline"
                size={14}
                color={TEXT_LIGHT}
              />
              <Text style={S.hintText}>
                {searchMode === 'id'
                  ? 'Enter the member ID'
                  : 'Enter full or partial name to search'}
              </Text>
            </View>
          )}

          {/* Not found */}
          {searchDone && !member && (
            <View style={S.emptyWrap}>
              <View style={S.emptyIconWrap}>
                <Ionicons
                  name="person-remove-outline"
                  size={30}
                  color={TEXT_LIGHT}
                />
              </View>
              <Text style={S.emptyTitle}>No member found</Text>
              <Text style={S.emptySub}>
                Try a different {searchMode === 'id' ? 'ID' : 'name'}
              </Text>
            </View>
          )}

          {/* Member result */}
          {member && (
            <View style={S.memberCard}>
              <View style={S.memberTop}>
                <View style={S.memberAvatar}>
                  <Text style={S.memberAvatarText}>
                    {member.name.charAt(0).toUpperCase()}
                  </Text>
                </View>
                <View style={S.memberInfo}>
                  <View style={S.memberNameRow}>
                    <Text style={S.memberName}>{member.name}</Text>
                    <View style={S.statusBadge}>
                      <View style={S.statusDot} />
                      <Text style={S.statusText}>Active</Text>
                    </View>
                  </View>
                  <Text style={S.memberId}>ID: {member.id}</Text>
                </View>
              </View>
              <View style={S.memberDivider} />
              <View style={S.memberMetaRow}>
                <View style={S.memberMeta}>
                  <Ionicons name="call-outline" size={13} color="#7C3AED" />
                  <Text style={S.memberMetaText}>{member.phone}</Text>
                </View>
                <View style={S.memberMeta}>
                  <Ionicons name="calendar-outline" size={13} color="#7C3AED" />
                  <Text style={S.memberMetaText}>
                    Since {member.memberSince}
                  </Text>
                </View>
                <View style={S.memberMeta}>
                  <Ionicons
                    name="restaurant-outline"
                    size={13}
                    color="#7C3AED"
                  />
                  <Text style={S.memberMetaText}>{member.visits} visits</Text>
                </View>
              </View>

              {/* Select member → sets context → goes to Menu */}
              <TouchableOpacity
                style={S.selectBtn}
                onPress={() => handleSelectMember(member)}
                activeOpacity={0.85}
              >
                <Text style={S.selectBtnText}>Select Member & Continue</Text>
                <Ionicons name="arrow-forward" size={16} color={PURPLE} />
              </TouchableOpacity>
            </View>
          )}
        </View>
      </ScrollView>
    </View>
  );
}

const PURPLE_DEEP = '#3B0F8C';
const PURPLE = '#6C1FC9';
const PURPLE_SOFT = '#F3EEFF';
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
  greetSub: { fontSize: 11, color: 'rgba(255,255,255,0.7)', marginTop: 2 },
  scroll: { flex: 1 },
  scrollContent: { padding: 14, paddingBottom: 48 },
  card: {
    backgroundColor: CARD,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: BORDER,
    padding: 18,
    shadowColor: '#9CA3AF',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.07,
    shadowRadius: 10,
    elevation: 3,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 16,
  },
  cardHeaderIcon: {
    width: 30,
    height: 30,
    borderRadius: 9,
    backgroundColor: PURPLE_SOFT,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cardTitle: { fontSize: 15, fontWeight: '700', color: TEXT_DARK },
  toggleRow: {
    flexDirection: 'row',
    backgroundColor: '#F3F4F6',
    borderRadius: 12,
    padding: 3,
    marginBottom: 14,
    gap: 3,
  },
  toggleBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 9,
    borderRadius: 10,
  },
  toggleBtnActive: { backgroundColor: PURPLE },
  toggleText: { fontSize: 13, fontWeight: '600', color: TEXT_MID },
  toggleTextActive: { color: WHITE },
  searchRow: { flexDirection: 'row', gap: 10, marginBottom: 10 },
  searchInputWrap: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F9FAFB',
    borderRadius: 13,
    borderWidth: 1.5,
    borderColor: BORDER,
    paddingHorizontal: 12,
  },
  searchIcon: { marginRight: 8 },
  searchInput: { flex: 1, fontSize: 15, color: TEXT_DARK, paddingVertical: 13 },
  clearBtn: { padding: 4 },
  searchBtn: {
    width: 50,
    height: 50,
    borderRadius: 13,
    backgroundColor: PURPLE,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: PURPLE,
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 5,
  },
  searchBtnDisabled: {
    backgroundColor: '#C4B5FD',
    shadowOpacity: 0,
    elevation: 0,
  },
  hintRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 2,
  },
  hintText: { fontSize: 12, color: TEXT_LIGHT, lineHeight: 18, flex: 1 },
  emptyWrap: { alignItems: 'center', paddingVertical: 24, gap: 6 },
  emptyIconWrap: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#F3F4F6',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 4,
  },
  emptyTitle: { fontSize: 15, fontWeight: '600', color: TEXT_MID },
  emptySub: { fontSize: 12, color: TEXT_LIGHT },
  memberCard: {
    backgroundColor: PURPLE_SOFT,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#E9D8FD',
    padding: 16,
    marginTop: 6,
  },
  memberTop: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  memberAvatar: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: PURPLE,
    alignItems: 'center',
    justifyContent: 'center',
  },
  memberAvatarText: { fontSize: 22, fontWeight: '800', color: WHITE },
  memberInfo: { flex: 1 },
  memberNameRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  memberName: { fontSize: 16, fontWeight: '700', color: '#3B0F8C', flex: 1 },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#F0FDF4',
    borderRadius: 20,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderWidth: 1,
    borderColor: '#BBF7D0',
  },
  statusDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#22C55E',
  },
  statusText: { fontSize: 11, fontWeight: '600', color: '#15803D' },
  memberId: { fontSize: 12, color: '#7C3AED', marginTop: 3, fontWeight: '500' },
  memberDivider: { height: 1, backgroundColor: '#E9D8FD', marginVertical: 12 },
  memberMetaRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 14,
  },
  memberMeta: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  memberMetaText: { fontSize: 11, color: '#7C3AED', fontWeight: '500' },
  selectBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: WHITE,
    borderRadius: 12,
    paddingVertical: 12,
    borderWidth: 1.5,
    borderColor: '#E9D8FD',
  },
  selectBtnText: { fontSize: 14, fontWeight: '700', color: PURPLE },
  conBtn: {
    width: 36, height: 36, borderRadius: 10,
    backgroundColor: 'rgba(255,255,255,0.15)',
    alignItems: 'center', justifyContent: 'center',
  },
});
