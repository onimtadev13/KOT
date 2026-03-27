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
  { color: '#6C1FC9', bg: '#F3EEFF' },
  { color: '#0369A1', bg: '#E0F2FE' },
  { color: '#0F766E', bg: '#CCFBF1' },
  { color: '#B45309', bg: '#FEF3C7' },
  { color: '#B91C1C', bg: '#FEE2E2' },
  { color: '#1D4ED8', bg: '#DBEAFE' },
  { color: '#7C3AED', bg: '#EDE9FE' },
];

// ─────────────────────────────────────────────────────────────────────────────
// MenuScreen
// ─────────────────────────────────────────────────────────────────────────────
export default function MenuScreen({ navigation }: { navigation: any }) {
   const nav          = useNavigation<any>();
  const device = useAppStore(state => state.device);

  // ── Store: department cache ───────────────────────────────────────────────
  const storedDepts = useAppStore(state => state.departments);
  const setStoreDepts = useAppStore(state => state.setDepartments);

  const [departments, setDepartments] =
    useState<DepartmentResult[]>(storedDepts);
  const [allCategories, setAllCategories] = useState<MenuCategoryResult[]>([]);
  const [allItems, setAllItems] = useState<EnrichedItem[]>([]);
  const [loading, setLoading] = useState(storedDepts.length === 0);
  const [indexing, setIndexing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [query, setQuery] = useState('');
  const [searchSections, setSearchSections] = useState<SearchSection[]>([]);
  const [isSearching, setIsSearching] = useState(false);

  useEffect(() => {
    // If already cached in store, skip API call entirely
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
      const unitNo = device?.Device_Id ?? 0;
      const docNo = device?.Doc_No ?? '';
      const uniqueId = device?.UniqueId ?? '';
      const depts = await loadDepartments(unitNo, docNo, uniqueId);
      depts.sort((a, b) => a.Id_No - b.Id_No);
      setDepartments(depts);
      setStoreDepts(depts); // ← save to store + AsyncStorage
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
      const docNo = device?.Doc_No ?? '';
      const mac = device?.UniqueId ?? '';
      const cats: MenuCategoryResult[] = [];
      const items: EnrichedItem[] = [];

      await Promise.all(
        depts.map(async dept => {
          try {
            const deptCats = await loadMenuCategories(
              dept.Dept_Code,
              unitNo,
              docNo,
              mac,
            );
            cats.push(...deptCats);
            await Promise.all(
              deptCats.map(async cat => {
                try {
                  const catItems = await loadMenuItems(
                    dept.Dept_Code,
                    cat.Cat_Code,
                    unitNo,
                    docNo,
                    mac,
                  );
                  items.push(
                    ...catItems.map(i => ({
                      ...i,
                      deptCode: dept.Dept_Code,
                      deptName: dept.Dept_Name,
                      catCode: cat.Cat_Code,
                      catName: cat.Cat_Name,
                    })),
                  );
                } catch {
                  /* skip */
                }
              }),
            );
          } catch {
            /* skip */
          }
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
      sections.push({
        type: 'dept',
        title: `Departments (${matchedDepts.length})`,
        data: matchedDepts,
      });
    if (matchedCats.length)
      sections.push({
        type: 'cat',
        title: `Categories (${matchedCats.length})`,
        data: matchedCats,
      });
    if (matchedItems.length)
      sections.push({
        type: 'item',
        title: `Items (${matchedItems.length})`,
        data: matchedItems,
      });
    setSearchSections(sections);
  }, [query, departments, allCategories, allItems]);

  function renderDept({
    item,
    index,
  }: {
    item: DepartmentResult;
    index: number;
  }) {
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

  function renderSearchRow({
    item,
    section,
  }: {
    item: any;
    section: SearchSection;
  }) {
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
            <Ionicons
              name={getDeptIcon(dept.Dept_Name) as any}
              size={22}
              color={color}
            />
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
              catCode: cat.Cat_Code,
              catName: cat.Cat_Name,
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
      const soldOut = prod.isSoldOut === 'T';
      const hasImage = !!prod.ImagePath?.trim();
      return (
        <View style={[S.card, soldOut && { opacity: 0.55 }]}>
          <View
            style={[
              S.cardAccent,
              { backgroundColor: soldOut ? '#D1D5DB' : color },
            ]}
          />
          {hasImage ? (
            <Image
              source={{ uri: prod.ImagePath }}
              style={S.thumb}
              resizeMode="cover"
            />
          ) : (
            <View style={[S.thumb, S.thumbFallback]}>
              <Ionicons name="restaurant-outline" size={20} color="#D1D5DB" />
            </View>
          )}
          <View style={S.cardInfo}>
            <Text style={S.cardName} numberOfLines={1}>
              {prod.Prod_Name}
            </Text>
            <Text style={S.cardSub} numberOfLines={1}>
              {prod.deptName} › {prod.catName}
            </Text>
            <View style={S.badgeRow}>
              {prod.isBestSeller === 'T' && (
                <View style={[S.badge, { backgroundColor: '#FEF3C7' }]}>
                  <Text style={[S.badgeText, { color: '#92400E' }]}>
                    ★ Best Seller
                  </Text>
                </View>
              )}
              {prod.Popular === 'T' && (
                <View style={[S.badge, { backgroundColor: '#FEE2E2' }]}>
                  <Text style={[S.badgeText, { color: '#B91C1C' }]}>
                    🔥 Popular
                  </Text>
                </View>
              )}
              {soldOut && (
                <View style={[S.badge, { backgroundColor: '#F3F4F6' }]}>
                  <Text style={[S.badgeText, { color: '#9CA3AF' }]}>
                    Sold Out
                  </Text>
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
          <Text style={S.navTitle}>Menu</Text>
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

      {!loading && !error && (
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
              onChangeText={setQuery}
              placeholder="Search departments, categories, items…"
              placeholderTextColor={TEXT_LIGHT}
              returnKeyType="search"
              autoCapitalize="none"
            />
            {indexing && !query && (
              <ActivityIndicator
                size="small"
                color={TEXT_LIGHT}
                style={{ marginLeft: 4 }}
              />
            )}
            {query.length > 0 && (
              <TouchableOpacity
                onPress={() => setQuery('')}
                hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
              >
                <Ionicons name="close-circle" size={18} color={TEXT_LIGHT} />
              </TouchableOpacity>
            )}
          </View>
          {indexing && query.length > 0 && (
            <Text style={S.indexingHint}>
              Still loading all items for full results…
            </Text>
          )}
        </View>
      )}

      {loading ? (
        <View style={S.loadingWrap}>
          <ActivityIndicator size="large" color={PURPLE} />
          <Text style={S.loadingText}>Loading departments…</Text>
        </View>
      ) : error ? (
        <View style={S.emptyWrap}>
          <View style={S.emptyIconWrap}>
            <Ionicons
              name="cloud-offline-outline"
              size={32}
              color={TEXT_LIGHT}
            />
          </View>
          <Text style={S.emptyTitle}>Could not load</Text>
          <Text style={S.emptySub}>{error}</Text>
        </View>
      ) : isSearching ? (
        searchSections.length === 0 ? (
          <View style={S.emptyWrap}>
            <View style={S.emptyIconWrap}>
              <Ionicons name="search-outline" size={32} color={TEXT_LIGHT} />
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
            <Ionicons name="restaurant-outline" size={32} color={TEXT_LIGHT} />
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
  indexingHint: {
    fontSize: 11,
    color: TEXT_LIGHT,
    marginTop: 6,
    marginLeft: 4,
    fontStyle: 'italic',
  },
  sectionHeader: { paddingHorizontal: 4, paddingVertical: 8, marginBottom: 2 },
  sectionHeaderText: {
    fontSize: 12,
    fontWeight: '700',
    color: PURPLE,
    letterSpacing: 0.5,
    textTransform: 'uppercase',
  },
  list: { paddingHorizontal: 14, paddingTop: 14, paddingBottom: 32, gap: 10 },
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
  cardIconWrap: {
    width: 48,
    height: 48,
    borderRadius: 13,
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 14,
    marginVertical: 14,
  },
  cardInfo: { flex: 1, paddingHorizontal: 14, paddingVertical: 12 },
  cardName: {
    fontSize: 15,
    fontWeight: '700',
    color: TEXT_DARK,
    letterSpacing: -0.1,
  },
  cardSub: { fontSize: 11, color: TEXT_MID, marginTop: 3 },
  cardArrow: {
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 14,
  },
  thumb: {
    width: 52,
    height: 52,
    borderRadius: 10,
    marginLeft: 12,
    marginVertical: 12,
  },
  thumbFallback: {
    backgroundColor: '#F3F4F6',
    alignItems: 'center',
    justifyContent: 'center',
  },
  badgeRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 4, marginTop: 4 },
  badge: { paddingHorizontal: 7, paddingVertical: 2, borderRadius: 20 },
  badgeText: { fontSize: 9, fontWeight: '700' },
  loadingWrap: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
  },
  loadingText: { fontSize: 14, color: TEXT_MID, fontWeight: '500' },
  emptyWrap: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
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
