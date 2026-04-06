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
  loadMenuCategories,
  loadMenuItems,
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
  catCode: string;
  catName: string;
}

interface SearchSection {
  type:  'cat' | 'item';
  title: string;
  data:  any[];
}

// ─────────────────────────────────────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────────────────────────────────────
function getCatIcon(name: string): string {
  const n = name.toLowerCase();
  if (n.includes('biriyani'))                          return 'flame-outline';
  if (n.includes('buffet'))                            return 'restaurant-outline';
  if (n.includes('chicken'))                           return 'nutrition-outline';
  if (n.includes('curry'))                             return 'color-palette-outline';
  if (n.includes('dessert') || n.includes('sweet'))    return 'ice-cream-outline';
  if (n.includes('bread'))                             return 'pizza-outline';
  if (n.includes('seafood') || n.includes('fish'))     return 'fish-outline';
  if (n.includes('soup'))                              return 'cafe-outline';
  if (n.includes('veg'))                               return 'leaf-outline';
  if (n.includes('drink')   || n.includes('beverage')) return 'wine-outline';
  return 'grid-outline';
}

const CAT_COLORS = colors.menuCategories.catColors;

// ─────────────────────────────────────────────────────────────────────────────
// MenuCategoriesScreen
// Receives: route.params.deptCode, route.params.deptName
// ─────────────────────────────────────────────────────────────────────────────
export default function MenuCategoriesScreen({
  navigation,
  route,
}: {
  navigation: any;
  route: any;
}) {
  const nav = useNavigation<any>();
  const { deptCode, deptName } = route.params as {
    deptCode: string;
    deptName: string;
  };

  const device = useAppStore(state => state.device);

  const orderItemCount  = useAppStore(state => state.orderItemCount);

const itemCount = orderItemCount();

  // ── Data ──
  const [categories, setCategories] = useState<MenuCategoryResult[]>([]);
  const [allItems,   setAllItems]   = useState<EnrichedItem[]>([]);

  // ── UI state ──
  const [loading,        setLoading]        = useState(true);
  const [indexing,       setIndexing]       = useState(false);
  const [error,          setError]          = useState<string | null>(null);
  const [query,          setQuery]          = useState('');
  const [searchSections, setSearchSections] = useState<SearchSection[]>([]);
  const [isSearching,    setIsSearching]    = useState(false);

  // ─────────────────────────────────────────────────────────────────────────
  // 1. Load categories (fast, shown immediately)
  // ─────────────────────────────────────────────────────────────────────────
  useEffect(() => {
    fetchCategories();
  }, [deptCode]); // eslint-disable-line react-hooks/exhaustive-deps

  async function fetchCategories() {
    setLoading(true);
    setError(null);
    setQuery('');
    setIsSearching(false);
    try {
      const unitNo = String(device?.Device_Id ?? '');
      const docNo  = device?.Doc_No           ?? '';
      const mac    = device?.UniqueId          ?? '';
      const result = await loadMenuCategories(deptCode, unitNo, docNo, mac);
      result.sort((a, b) => a.Id_No - b.Id_No);
      setCategories(result);
      indexItems(result);
    } catch {
      setError('Failed to load categories.');
    } finally {
      setLoading(false);
    }
  }

  // ─────────────────────────────────────────────────────────────────────────
  // 2. Background: load ALL items for every category (for search)
  // ─────────────────────────────────────────────────────────────────────────
  async function indexItems(cats: MenuCategoryResult[]) {
    setIndexing(true);
    try {
      const unitNo = String(device?.Device_Id ?? '');
      const docNo  = device?.Doc_No           ?? '';
      const mac    = device?.UniqueId          ?? '';

      const items: EnrichedItem[] = [];

      await Promise.all(
        cats.map(async cat => {
          try {
            const catItems = await loadMenuItems(deptCode, cat.Cat_Code, unitNo, docNo, mac);
            items.push(
              ...catItems.map(i => ({
                ...i,
                catCode: cat.Cat_Code,
                catName: cat.Cat_Name,
              })),
            );
          } catch { /* skip failed category */ }
        }),
      );

      setAllItems(items);
    } finally {
      setIndexing(false);
    }
  }

  // ─────────────────────────────────────────────────────────────────────────
  // 3. Search logic
  // ─────────────────────────────────────────────────────────────────────────
  useEffect(() => {
    const q = query.trim().toLowerCase();

    if (!q) {
      setIsSearching(false);
      setSearchSections([]);
      return;
    }

    setIsSearching(true);

    const matchedCats = categories.filter(c =>
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
    if (matchedCats.length)  sections.push({ type: 'cat',  title: `Categories (${matchedCats.length})`, data: matchedCats  });
    if (matchedItems.length) sections.push({ type: 'item', title: `Items (${matchedItems.length})`,      data: matchedItems });

    setSearchSections(sections);
  }, [query, categories, allItems]);

  // ─────────────────────────────────────────────────────────────────────────
  // Renderers
  // ─────────────────────────────────────────────────────────────────────────

  // ── Normal category card ──────────────────────────────────────────────────
  function renderCategory({ item, index }: { item: MenuCategoryResult; index: number }) {
    const { color, bg } = CAT_COLORS[index % CAT_COLORS.length];
    const icon = getCatIcon(item.Cat_Name);

    return (
      <TouchableOpacity
        style={S.card}
        activeOpacity={0.82}
        onPress={() => navigation.navigate('MenuItems', {
          deptCode,
          catCode: item.Cat_Code,
          catName: item.Cat_Name,
        })}
      >
        <View style={[S.cardAccent, { backgroundColor: color }]} />
        <View style={[S.cardIconWrap, { backgroundColor: bg }]}>
          <Ionicons name={icon as any} size={22} color={color} />
        </View>
        <View style={S.cardInfo}>
          <Text style={S.cardName}>{item.Cat_Name}</Text>
        </View>
        <View style={[S.cardArrow, { backgroundColor: bg }]}>
          <Ionicons name="chevron-forward" size={14} color={color} />
        </View>
      </TouchableOpacity>
    );
  }

  // ── Search result row ─────────────────────────────────────────────────────
  function renderSearchRow({ item, section }: { item: any; section: SearchSection }) {
    const idx = section.data.indexOf(item);
    const { color, bg } = CAT_COLORS[idx % CAT_COLORS.length];

    // ── Category result ──
    if (section.type === 'cat') {
      const cat: MenuCategoryResult = item;
      return (
        <TouchableOpacity
          style={S.card}
          activeOpacity={0.82}
          onPress={() => navigation.navigate('MenuItems', {
            deptCode,
            catCode: cat.Cat_Code,
            catName: cat.Cat_Name,
          })}
        >
          <View style={[S.cardAccent, { backgroundColor: color }]} />
          <View style={[S.cardIconWrap, { backgroundColor: bg }]}>
            <Ionicons name={getCatIcon(cat.Cat_Name) as any} size={22} color={color} />
          </View>
          <View style={S.cardInfo}>
            <Text style={S.cardName}>{cat.Cat_Name}</Text>
            <Text style={S.cardSub}>Category</Text>
          </View>
          <View style={[S.cardArrow, { backgroundColor: bg }]}>
            <Ionicons name="chevron-forward" size={14} color={color} />
          </View>
        </TouchableOpacity>
      );
    }

    // ── Item result ──
    if (section.type === 'item') {
      const prod: EnrichedItem = item;
      const soldOut  = prod.isSoldOut === 'T';
      const hasImage = !!prod.ImagePath?.trim();

      return (
        <View style={[S.card, soldOut && S.cardSoldOut]}>
          <View style={[S.cardAccent, { backgroundColor: soldOut ? colors.menuCategories.soldOutAccent : color }]} />

          {hasImage ? (
            <Image source={{ uri: prod.ImagePath }} style={S.thumb} resizeMode="cover" />
          ) : (
            <View style={[S.thumb, S.thumbFallback]}>
              <Ionicons name="restaurant-outline" size={20} color={colors.menuCategories.thumbFallbackIcon} />
            </View>
          )}

          <View style={S.cardInfo}>
            <Text style={S.cardName} numberOfLines={1}>{prod.Prod_Name}</Text>
            <Text style={S.cardSub}  numberOfLines={1}>{prod.catName}</Text>

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
              {prod.isOffer === 'T' && (
                <View style={[S.badge, { backgroundColor: colors.badge.offer.bg }]}>
                  <Text style={[S.badgeText, { color: colors.badge.offer.text }]}>🏷 Offer</Text>
                </View>
              )}
              {soldOut && (
                <View style={[S.badge, { backgroundColor: colors.menuCategories.soldOutBadgeBg }]}>
                  <Text style={[S.badgeText, { color: colors.menuCategories.soldOutBadgeText }]}>Sold Out</Text>
                </View>
              )}
            </View>
          </View>
        </View>
      );
    }

    return null;
  }

  // ─────────────────────────────────────────────────────────────────────────
  // Render
  // ─────────────────────────────────────────────────────────────────────────
  return (
    <View style={S.flex}>
      <StatusBar barStyle="light-content" backgroundColor={colors.menuCategories.purpleDeep} />

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
          <Text style={S.navTitle} numberOfLines={1}>{deptName}</Text>
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

      {/* ── Search bar ── */}
      {!loading && !error && (
        <View style={S.searchWrap}>
          <View style={S.searchBox}>
            <Ionicons name="search-outline" size={17} color={colors.menuCategories.textLight} style={{ marginRight: 8 }} />
            <TextInput
              style={S.searchInput}
              value={query}
              onChangeText={setQuery}
              placeholder="Search categories or items…"
              placeholderTextColor={colors.menuCategories.textLight}
              returnKeyType="search"
              autoCapitalize="none"
            />
            {indexing && !query && (
              <ActivityIndicator size="small" color={colors.menuCategories.textLight} style={{ marginLeft: 4 }} />
            )}
            {query.length > 0 && (
              <TouchableOpacity
                onPress={() => setQuery('')}
                hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
              >
                <Ionicons name="close-circle" size={18} color={colors.menuCategories.textLight} />
              </TouchableOpacity>
            )}
          </View>
          {indexing && query.length > 0 && (
            <Text style={S.indexingHint}>Still loading items for full results…</Text>
          )}
        </View>
      )}

      {/* ── Content ── */}
      {loading ? (
        <View style={S.centerWrap}>
                {/* <ActivityIndicator size="large" color={colors.menuCategories.purple} />
                <Text style={S.loadingText}>Loading categories…</Text> */}
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
            <Ionicons name="cloud-offline-outline" size={32} color={colors.menuCategories.textLight} />
          </View>
          <Text style={S.emptyTitle}>Could not load categories</Text>
          <Text style={S.emptySub}>{error}</Text>
        </View>

      ) : isSearching ? (
        searchSections.length === 0 ? (
          <View style={S.centerWrap}>
            <View style={S.emptyIconWrap}>
              <Ionicons name="search-outline" size={32} color={colors.menuCategories.textLight} />
            </View>
            <Text style={S.emptyTitle}>No results</Text>
            <Text style={S.emptySub}>Nothing matched "{query}"</Text>
          </View>
        ) : (
          <SectionList
            sections={searchSections}
            keyExtractor={(item, index) =>
              item.Prod_Code ?? item.Cat_Code ?? String(index)
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

      ) : categories.length === 0 ? (
        <View style={S.centerWrap}>
          <View style={S.emptyIconWrap}>
            <Ionicons name="restaurant-outline" size={32} color={colors.menuCategories.textLight} />
          </View>
          <Text style={S.emptyTitle}>No categories found</Text>
          <Text style={S.emptySub}>No categories available in {deptName}</Text>
        </View>

      ) : (
        <FlatList
          data={categories}
          keyExtractor={item => item.Cat_Code}
          renderItem={renderCategory}
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
  flex: { flex: 1, backgroundColor: colors.menuCategories.bg },

  // ── Nav bar ──
  navBar: {
    backgroundColor:   colors.menuCategories.purpleDeep,
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
    backgroundColor:   colors.menuCategories.card,
    borderRadius:      13,
    borderWidth:       1.5,
    borderColor:       colors.menuCategories.border,
    paddingHorizontal: 14,
    shadowColor:       colors.menuCategories.shadowCard,
    shadowOffset:      { width: 0, height: 1 },
    shadowOpacity:     0.06,
    shadowRadius:      6,
    elevation:         2,
  },
  searchInput: {
    flex:            1,
    fontSize:        14,
    color:           colors.menuCategories.textDark,
    paddingVertical: 12,
  },
  indexingHint: {
    fontSize:   11,
    color:      colors.menuCategories.textLight,
    marginTop:  6,
    marginLeft: 4,
    fontStyle:  'italic',
  },

  // ── Section header ──
  sectionHeader:     { paddingHorizontal: 4, paddingVertical: 8, marginBottom: 2 },
  sectionHeaderText: {
    fontSize:      12,
    fontWeight:    '700',
    color:         colors.menuCategories.purple,
    letterSpacing: 0.5,
    textTransform: 'uppercase',
  },

  // ── List ──
  list: { paddingHorizontal: 14, paddingTop: 14, paddingBottom: 32, gap: 10 },

  // ── Card ──
  card: {
    backgroundColor: colors.menuCategories.card,
    borderRadius:    16,
    borderWidth:     1,
    borderColor:     colors.menuCategories.border,
    flexDirection:   'row',
    alignItems:      'center',
    overflow:        'hidden',
    shadowColor:     colors.menuCategories.shadowCard,
    shadowOffset:    { width: 0, height: 2 },
    shadowOpacity:   0.07,
    shadowRadius:    8,
    elevation:       3,
  },
  cardSoldOut:  { opacity: 0.55 },
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
    color:         colors.menuCategories.textDark,
    letterSpacing: -0.1,
  },
  cardSub:  { fontSize: 11, color: colors.menuCategories.textMid, marginTop: 3 },
  cardArrow: {
    width:          28,
    height:         28,
    borderRadius:   14,
    alignItems:     'center',
    justifyContent: 'center',
    marginRight:    14,
  },

  // ── Thumbnail ──
  thumb: {
    width:          52,
    height:         52,
    borderRadius:   10,
    marginLeft:     12,
    marginVertical: 12,
  },
  thumbFallback: {
    backgroundColor: colors.menuCategories.thumbFallbackBg,
    alignItems:      'center',
    justifyContent:  'center',
  },

  // ── Badges ──
  badgeRow:  { flexDirection: 'row', flexWrap: 'wrap', gap: 4, marginTop: 4 },
  badge:     { paddingHorizontal: 7, paddingVertical: 2, borderRadius: 20 },
  badgeText: { fontSize: 9, fontWeight: '700' },

  // ── Center states ──
  centerWrap:  { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 12 },
  loadingText: { fontSize: 14, color: colors.menuCategories.textMid, fontWeight: '500' },
  emptyIconWrap: {
    width:           64,
    height:          64,
    borderRadius:    32,
    backgroundColor: colors.menuCategories.emptyIconBg,
    alignItems:      'center',
    justifyContent:  'center',
    marginBottom:    4,
  },
  emptyTitle: { fontSize: 15, fontWeight: '600', color: colors.menuCategories.textMid },
  emptySub:   { fontSize: 12, color: colors.menuCategories.textLight, textAlign: 'center' },
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