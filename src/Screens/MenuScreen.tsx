import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  FlatList,
  SectionList,
  StatusBar,
  Platform,
  ActivityIndicator,
  TextInput,
  Image,
} from 'react-native';
import { Ionicons } from '@react-native-vector-icons/ionicons';
import { useAppStore } from '../Store/store';
import {
  loadDepartments,
  loadMenuCategories,
  loadMenuItems,
  DepartmentResult,
  MenuCategoryResult,
  MenuItemResult,
} from '../Api/api';
import { DrawerActions, useNavigation, useFocusEffect } from '@react-navigation/native';
import colors from '../themes/colors';
import LottieView from 'lottie-react-native';

// ─────────────────────────────────────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────────────────────────────────────
interface EnrichedItem extends MenuItemResult {
  deptCode: string;
  deptName: string;
  catCode: string;
  catName: string;
}

interface SearchSection {
  type: 'dept' | 'cat' | 'item';
  title: string;
  data: any[];
}

// ─────────────────────────────────────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────────────────────────────────────
function getDeptIcon(name: string): string {
  const n = name.toLowerCase();
  if (n.includes('beverage') || n.includes('drink')) return 'cafe-outline';
  if (n.includes('liquor') || n.includes('bar')) return 'wine-outline';
  if (n.includes('tobacco')) return 'flame-outline';
  if (n.includes('pastry') || n.includes('dessert')) return 'ice-cream-outline';
  if (n.includes('indian')) return 'leaf-outline';
  if (n.includes('kitchen') || n.includes('main')) return 'restaurant-outline';
  return 'grid-outline';
}

const DEPT_COLORS = [
  { color: colors.menu.deptColors[0].color, bg: colors.menu.deptColors[0].bg },
  { color: colors.menu.deptColors[1].color, bg: colors.menu.deptColors[1].bg },
  { color: colors.menu.deptColors[2].color, bg: colors.menu.deptColors[2].bg },
  { color: colors.menu.deptColors[3].color, bg: colors.menu.deptColors[3].bg },
  { color: colors.menu.deptColors[4].color, bg: colors.menu.deptColors[4].bg },
  { color: colors.menu.deptColors[5].color, bg: colors.menu.deptColors[5].bg },
  { color: colors.menu.deptColors[6].color, bg: colors.menu.deptColors[6].bg },
];

// ─────────────────────────────────────────────────────────────────────────────
// MenuScreen
// ─────────────────────────────────────────────────────────────────────────────
export default function MenuScreen({ navigation }: { navigation: any }) {
  const nav    = useNavigation<any>();
  const device = useAppStore(state => state.device);

  // ── Store: department cache ───────────────────────────────────────────────
  const storedDepts   = useAppStore(state => state.departments);
  const setStoreDepts = useAppStore(state => state.setDepartments);

  const [departments,   setDepartments]   = useState<DepartmentResult[]>(storedDepts);
  const [allCategories, setAllCategories] = useState<MenuCategoryResult[]>([]);
  const [allItems,      setAllItems]      = useState<EnrichedItem[]>([]);
  const [loading,       setLoading]       = useState(storedDepts.length === 0);
  const [indexing,      setIndexing]      = useState(false);
  const [error,         setError]         = useState<string | null>(null);
  const [query,         setQuery]         = useState('');
  const [searchSections, setSearchSections] = useState<SearchSection[]>([]);
  const [isSearching,   setIsSearching]   = useState(false);

  useEffect(() => {
    if (storedDepts.length > 0) {
      setDepartments(storedDepts);
      setLoading(false);
      indexAllData(storedDepts);
      return;
    }
    fetchDepts();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  async function fetchDepts() {
    setLoading(true);
    setError(null);
    try {
      const unitNo   = device?.Device_Id ?? 0;
      const docNo    = device?.Doc_No    ?? '';
      const uniqueId = device?.UniqueId  ?? '';
      const depts    = await loadDepartments(unitNo, docNo, uniqueId);
      depts.sort((a, b) => a.Id_No - b.Id_No);
      setDepartments(depts);
      setStoreDepts(depts);
      indexAllData(depts);
    } catch {
      setError('Failed to load departments.');
    } finally {
      setLoading(false);
    }
  }

  async function indexAllData(depts: DepartmentResult[]) {
    setIndexing(true);
    try {
      const unitNo = String(device?.Device_Id ?? '');
      const docNo  = device?.Doc_No  ?? '';
      const mac    = device?.UniqueId ?? '';
      const cats: MenuCategoryResult[] = [];
      const items: EnrichedItem[]      = [];

      await Promise.all(
        depts.map(async dept => {
          try {
            const deptCats = await loadMenuCategories(dept.Dept_Code, unitNo, docNo, mac);
            cats.push(...deptCats);
            await Promise.all(
              deptCats.map(async cat => {
                try {
                  const catItems = await loadMenuItems(
                    dept.Dept_Code, cat.Cat_Code, unitNo, docNo, mac,
                  );
                  items.push(
                    ...catItems.map(i => ({
                      ...i,
                      deptCode: dept.Dept_Code,
                      deptName: dept.Dept_Name,
                      catCode:  cat.Cat_Code,
                      catName:  cat.Cat_Name,
                    })),
                  );
                } catch { /* skip */ }
              }),
            );
          } catch { /* skip */ }
        }),
      );

      setAllCategories(cats);
      setAllItems(items);
    } finally {
      setIndexing(false);
    }
  }

  useEffect(() => {
    const q = query.trim().toLowerCase();
    if (!q) {
      setIsSearching(false);
      setSearchSections([]);
      return;
    }
    setIsSearching(true);

    const matchedDepts = departments.filter(d =>
      d.Dept_Name.toLowerCase().includes(q),
    );
    const matchedCats = allCategories.filter(c =>
      c.Cat_Name.toLowerCase().includes(q),
    );

    const seen = new Set<string>();
    const matchedItems = allItems.filter(i => {
      if (!i.Prod_Name.toLowerCase().includes(q)) return false;
      if (seen.has(i.Prod_Code)) return false;
      seen.add(i.Prod_Code);
      return true;
    });

    const sections: SearchSection[] = [];
    if (matchedDepts.length)
      sections.push({ type: 'dept', title: `Departments (${matchedDepts.length})`, data: matchedDepts });
    if (matchedCats.length)
      sections.push({ type: 'cat',  title: `Categories (${matchedCats.length})`,  data: matchedCats  });
    if (matchedItems.length)
      sections.push({ type: 'item', title: `Items (${matchedItems.length})`,       data: matchedItems });
    setSearchSections(sections);
  }, [query, departments, allCategories, allItems]);

  function renderDept({ item, index }: { item: DepartmentResult; index: number }) {
    const { color, bg } = DEPT_COLORS[index % DEPT_COLORS.length];
    const icon = getDeptIcon(item.Dept_Name);
    return (
      <TouchableOpacity
        style={S.card}
        activeOpacity={0.82}
        onPress={() =>
          navigation.navigate('MenuCategories', {
            deptCode: item.Dept_Code,
            deptName: item.Dept_Name,
          })
        }
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

  function renderSearchRow({ item, section }: { item: any; section: SearchSection }) {
    const idx = section.data.indexOf(item);
    const { color, bg } = DEPT_COLORS[idx % DEPT_COLORS.length];

    if (section.type === 'dept') {
      const dept: DepartmentResult = item;
      return (
        <TouchableOpacity
          style={S.card}
          activeOpacity={0.82}
          onPress={() =>
            navigation.navigate('MenuCategories', {
              deptCode: dept.Dept_Code,
              deptName: dept.Dept_Name,
            })
          }
        >
          <View style={[S.cardAccent, { backgroundColor: color }]} />
          <View style={[S.cardIconWrap, { backgroundColor: bg }]}>
            <Ionicons name={getDeptIcon(dept.Dept_Name) as any} size={22} color={color} />
          </View>
          <View style={S.cardInfo}>
            <Text style={S.cardName}>{dept.Dept_Name}</Text>
            <Text style={S.cardSub}>Department</Text>
          </View>
          <View style={[S.cardArrow, { backgroundColor: bg }]}>
            <Ionicons name="chevron-forward" size={14} color={color} />
          </View>
        </TouchableOpacity>
      );
    }

    if (section.type === 'cat') {
      const cat: MenuCategoryResult = item;
      const parent = departments.find(d => d.Dept_Code === cat.Dept_Code);
      return (
        <TouchableOpacity
          style={S.card}
          activeOpacity={0.82}
          onPress={() =>
            navigation.navigate('MenuItems', {
              deptCode: cat.Dept_Code,
              catCode:  cat.Cat_Code,
              catName:  cat.Cat_Name,
            })
          }
        >
          <View style={[S.cardAccent, { backgroundColor: color }]} />
          <View style={[S.cardIconWrap, { backgroundColor: bg }]}>
            <Ionicons name="grid-outline" size={22} color={color} />
          </View>
          <View style={S.cardInfo}>
            <Text style={S.cardName}>{cat.Cat_Name}</Text>
            {parent && <Text style={S.cardSub}>{parent.Dept_Name}</Text>}
          </View>
          <View style={[S.cardArrow, { backgroundColor: bg }]}>
            <Ionicons name="chevron-forward" size={14} color={color} />
          </View>
        </TouchableOpacity>
      );
    }

    if (section.type === 'item') {
      const prod: EnrichedItem = item;
      const soldOut  = prod.isSoldOut === 'T';
      const hasImage = !!prod.ImagePath?.trim();
      return (
        <View style={[S.card, soldOut && { opacity: 0.55 }]}>
          <View style={[S.cardAccent, { backgroundColor: soldOut ? colors.menu.soldOutAccent : color }]} />
          {hasImage ? (
            <Image source={{ uri: prod.ImagePath }} style={S.thumb} resizeMode="cover" />
          ) : (
            <View style={[S.thumb, S.thumbFallback]}>
              <Ionicons name="restaurant-outline" size={20} color={colors.menu.thumbFallbackIcon} />
            </View>
          )}
          <View style={S.cardInfo}>
            <Text style={S.cardName} numberOfLines={1}>{prod.Prod_Name}</Text>
            <Text style={S.cardSub}   numberOfLines={1}>{prod.deptName} › {prod.catName}</Text>
            <View style={S.badgeRow}>
              {prod.isBestSeller === 'T' && (
                <View style={[S.badge, { backgroundColor: colors.badge.bestSeller.bg }]}>
                  <Text style={[S.badgeText, { color: colors.badge.bestSeller.text }]}>★ Best Seller</Text>
                </View>
              )}
              {prod.Popular === 'T' && (
                <View style={[S.badge, { backgroundColor: colors.badge.popular.bg }]}>
                  <Text style={[S.badgeText, { color: colors.badge.popular.text }]}>🔥 Popular</Text>
                </View>
              )}
              {soldOut && (
                <View style={[S.badge, { backgroundColor: colors.menu.soldOutBadgeBg }]}>
                  <Text style={[S.badgeText, { color: colors.menu.soldOutBadgeText }]}>Sold Out</Text>
                </View>
              )}
            </View>
          </View>
        </View>
      );
    }
    return null;
  }

  return (
    <View style={S.flex}>
      <StatusBar barStyle="light-content" backgroundColor={colors.menu.purpleDeep} />

      {/* ── Nav bar ── */}
      <View style={S.navBar}>
        {/* Hamburger */}
        <TouchableOpacity
          style={S.iconBtn}
          onPress={() => nav.dispatch(DrawerActions.openDrawer())}
          activeOpacity={0.75}
        >
          <Ionicons name="menu-outline" size={22} color={colors.white} />
        </TouchableOpacity>

        <View style={S.navTitleWrap}>
          <Text style={S.navTitle}>Menu</Text>
          <Text style={S.navSub}>Kitchen Order Ticket</Text>
        </View>

        {/* Doc chip — matches ExecutiveStaffScreen */}
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
      {!loading && !error && (
        <View style={S.searchWrap}>
          <View style={S.searchBox}>
            <Ionicons
              name="search-outline"
              size={17}
              color={colors.menu.textLight}
              style={{ marginRight: 8 }}
            />
            <TextInput
              style={S.searchInput}
              value={query}
              onChangeText={setQuery}
              placeholder="Search departments, categories, items…"
              placeholderTextColor={colors.menu.textLight}
              returnKeyType="search"
              autoCapitalize="none"
            />
            {indexing && !query && (
              <ActivityIndicator size="small" color={colors.menu.textLight} style={{ marginLeft: 4 }} />
            )}
            {query.length > 0 && (
              <TouchableOpacity
                onPress={() => setQuery('')}
                hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
              >
                <Ionicons name="close-circle" size={18} color={colors.menu.textLight} />
              </TouchableOpacity>
            )}
          </View>
          {indexing && query.length > 0 && (
            <Text style={S.indexingHint}>Still loading all items for full results…</Text>
          )}
        </View>
      )}

      {/* ── States ── */}
      {loading ? (
        <View style={S.loadingWrap}>
              {/* <ActivityIndicator size="large" color={colors.menu.purple} />
              <Text style={S.loadingText}>Loading departments…</Text> */}
              <LottieView
                source={require('../../assets/animations/Loading_Animation.json')}
                autoPlay
                loop
                style={{ width: 120, height: 120 }}
              />
        </View>
      ) : error ? (
        <View style={S.emptyWrap}>
          <View style={S.emptyIconWrap}>
            <Ionicons name="cloud-offline-outline" size={32} color={colors.menu.textLight} />
          </View>
          <Text style={S.emptyTitle}>Could not load</Text>
          <Text style={S.emptySub}>{error}</Text>
        </View>
      ) : isSearching ? (
        searchSections.length === 0 ? (
          <View style={S.emptyWrap}>
            <View style={S.emptyIconWrap}>
              <Ionicons name="search-outline" size={32} color={colors.menu.textLight} />
            </View>
            <Text style={S.emptyTitle}>No results</Text>
            <Text style={S.emptySub}>Nothing matched "{query}"</Text>
          </View>
        ) : (
          <SectionList
            sections={searchSections}
            keyExtractor={(item, index) =>
              item.Prod_Code ?? item.Cat_Code ?? item.Dept_Code ?? String(index)
            }
            renderItem={renderSearchRow}
            renderSectionHeader={({ section }) => (
              <View style={S.sectionHeader}>
                <Text style={S.sectionHeaderText}>{section.title}</Text>
              </View>
            )}
            contentContainerStyle={S.list}
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="handled"
            stickySectionHeadersEnabled={false}
          />
        )
      ) : departments.length === 0 ? (
        <View style={S.emptyWrap}>
          <View style={S.emptyIconWrap}>
            <Ionicons name="restaurant-outline" size={32} color={colors.menu.textLight} />
          </View>
          <Text style={S.emptyTitle}>No departments found</Text>
          <Text style={S.emptySub}>Check your connection and try again</Text>
        </View>
      ) : (
        <FlatList
          data={departments}
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
  flex: { flex: 1, backgroundColor: colors.menu.bg },

  // ── Nav bar ──
  navBar: {
    backgroundColor:   colors.menu.purpleDeep,
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

  // ── Search ──
  searchWrap: { paddingHorizontal: 14, paddingTop: 12, paddingBottom: 2 },
  searchBox: {
    flexDirection:     'row',
    alignItems:        'center',
    backgroundColor:   colors.menu.card,
    borderRadius:      13,
    borderWidth:       1.5,
    borderColor:       colors.menu.border,
    paddingHorizontal: 14,
    elevation:         2,
    shadowColor:       colors.menu.shadowCard,
    shadowOffset:      { width: 0, height: 1 },
    shadowOpacity:     0.06,
    shadowRadius:      6,
  },
  searchInput: { flex: 1, fontSize: 14, color: colors.menu.textDark, paddingVertical: 12 },
  indexingHint: {
    fontSize:  11,
    color:     colors.menu.textLight,
    marginTop: 6,
    marginLeft: 4,
    fontStyle: 'italic',
  },

  // ── Section header ──
  sectionHeader:     { paddingHorizontal: 4, paddingVertical: 8, marginBottom: 2 },
  sectionHeaderText: {
    fontSize:      12,
    fontWeight:    '700',
    color:         colors.menu.purple,
    letterSpacing: 0.5,
    textTransform: 'uppercase',
  },

  // ── List ──
  list: { paddingHorizontal: 14, paddingTop: 14, paddingBottom: 32, gap: 10 },

  // ── Card ──
  card: {
    backgroundColor: colors.menu.card,
    borderRadius:    16,
    borderWidth:     1,
    borderColor:     colors.menu.border,
    flexDirection:   'row',
    alignItems:      'center',
    overflow:        'hidden',
    shadowColor:     colors.menu.shadowCard,
    shadowOffset:    { width: 0, height: 2 },
    shadowOpacity:   0.07,
    shadowRadius:    8,
    elevation:       3,
  },
  cardAccent:   { width: 4, alignSelf: 'stretch' },
  cardIconWrap: {
    width:          48,
    height:         48,
    borderRadius:   13,
    alignItems:     'center',
    justifyContent: 'center',
    marginLeft:     14,
    marginVertical: 14,
  },
  cardInfo:  { flex: 1, paddingHorizontal: 14, paddingVertical: 12 },
  cardName: {
    fontSize:      15,
    fontWeight:    '700',
    color:         colors.menu.textDark,
    letterSpacing: -0.1,
  },
  cardSub:  { fontSize: 11, color: colors.menu.textMid, marginTop: 3 },
  cardArrow: {
    width:          28,
    height:         28,
    borderRadius:   14,
    alignItems:     'center',
    justifyContent: 'center',
    marginRight:    14,
  },

  // ── Thumb ──
  thumb: {
    width:         52,
    height:        52,
    borderRadius:  10,
    marginLeft:    12,
    marginVertical: 12,
  },
  thumbFallback: {
    backgroundColor: colors.menu.thumbFallbackBg,
    alignItems:      'center',
    justifyContent:  'center',
  },

  // ── Badges ──
  badgeRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 4, marginTop: 4 },
  badge:    { paddingHorizontal: 7, paddingVertical: 2, borderRadius: 20 },
  badgeText: { fontSize: 9, fontWeight: '700' },

  // ── Loading / empty ──
  loadingWrap: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 12 },
  loadingText: { fontSize: 14, color: colors.menu.textMid, fontWeight: '500' },
  emptyWrap:   { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 8 },
  emptyIconWrap: {
    width:           64,
    height:          64,
    borderRadius:    32,
    backgroundColor: colors.menu.emptyIconBg,
    alignItems:      'center',
    justifyContent:  'center',
    marginBottom:    4,
  },
  emptyTitle: { fontSize: 15, fontWeight: '600', color: colors.menu.textMid },
  emptySub:   { fontSize: 12, color: colors.menu.textLight, textAlign: 'center' },
});