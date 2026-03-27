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
  TextInput,
  Image,
  Modal,
} from 'react-native';
import { Ionicons } from '@react-native-vector-icons/ionicons';
import { useAppStore } from '../Store/store';
import { loadMenuItems, MenuItemResult } from '../Api/api';
import { DrawerActions, useNavigation, useFocusEffect } from '@react-navigation/native';
import { useAppBack } from '../Hooks/useAppBack';

export default function MenuItemsScreen({
  navigation,
  route,
}: {
  navigation: any;
  route: any;
}) {
   const nav          = useNavigation<any>();
  const { deptCode, catCode, catName } = route.params as {
    deptCode: string;
    catCode: string;
    catName: string;
  };

  useAppBack();

  const device = useAppStore(state => state.device);

  // ── Store: order context + addOrderItem ───────────────────────────────────
  const orderContext = useAppStore(state => state.orderContext);
  const addOrderItem = useAppStore(state => state.addOrderItem);

  const [allProducts, setAllProducts] = useState<MenuItemResult[]>([]);
  const [filtered, setFiltered] = useState<MenuItemResult[]>([]);
  const [query, setQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedItem, setSelectedItem] = useState<MenuItemResult | null>(null);
  const [qtyModalVisible, setQtyModalVisible] = useState(false);
  const [qty, setQty] = useState('1');

  useEffect(() => {
    fetchProducts();
  }, [catCode]); // eslint-disable-line react-hooks/exhaustive-deps

  async function fetchProducts() {
    setLoading(true);
    setError(null);
    setQuery('');
    try {
      const unitNo = String(device?.Device_Id ?? '');
      const docNo = device?.Doc_No ?? '';
      const mac = device?.UniqueId ?? '';
      const result = await loadMenuItems(deptCode, catCode, unitNo, docNo, mac);
      setAllProducts(result);
      setFiltered(result);
    } catch {
      setError('Failed to load products.');
    } finally {
      setLoading(false);
    }
  }

  function handleSearch(text: string) {
    setQuery(text);
    const q = text.trim().toLowerCase();
    setFiltered(
      q
        ? allProducts.filter(p => p.Prod_Name.toLowerCase().includes(q))
        : allProducts,
    );
  }

  function handleClear() {
    setQuery('');
    setFiltered(allProducts);
  }

  // ── Add item to store order ────────────────────────────────────────────────
  function handleAdd() {
    if (!selectedItem) return;
    const quantity = Math.max(1, parseInt(qty) || 1);

    addOrderItem({
      Prod_Code: selectedItem.Prod_Code,
      Prod_Name: selectedItem.Prod_Name,
      Dept_Code: deptCode,
      Dept_Name: '',
      Cat_Code: catCode,
      Cat_Name: catName,
      Selling_Price: selectedItem.Selling_Price ?? 0,
      Qty: quantity,
      // Attach order context — who is ordering
      GuestID: orderContext.guestId,
      GuestName: orderContext.guestName,
      PitName: orderContext.pitName,
      TableCode: orderContext.tableCode,
      StaffCode: orderContext.staffCode,
      StaffName: orderContext.staffName,
    });

    console.log(
      '[MENU ITEMS] Added to order:',
      selectedItem.Prod_Name,
      'x',
      quantity,
    );
    setQtyModalVisible(false);
  }

  // ── Order immediately (add + navigate to CurrentOrder) ────────────────────
  function handleOrder() {
    handleAdd();
    navigation.navigate('CurrentOrder');
  }

  // ── Product image ──────────────────────────────────────────────────────────
  function ProductImage({ item }: { item: MenuItemResult }) {
    const hasImage = !!item.ImagePath && item.ImagePath.trim() !== '';
    if (hasImage)
      return (
        <Image
          source={{ uri: item.ImagePath }}
          style={S.prodImage}
          resizeMode="cover"
        />
      );
    return (
      <View style={[S.prodImage, S.prodImageFallback]}>
        <Ionicons name="restaurant-outline" size={26} color="#D1D5DB" />
      </View>
    );
  }

  // ── Badges ──────────────────────────────────────────────────────────────────
  function Badges({ item }: { item: MenuItemResult }) {
    const has =
      item.isBestSeller === 'T' || item.Popular === 'T' || item.isOffer === 'T';
    if (!has) return null;
    return (
      <View style={S.badgeRow}>
        {item.isBestSeller === 'T' && (
          <View style={[S.badge, S.badgeBest]}>
            <Ionicons name="star" size={9} color="#92400E" />
            <Text style={[S.badgeText, { color: '#92400E' }]}>Best Seller</Text>
          </View>
        )}
        {item.Popular === 'T' && (
          <View style={[S.badge, S.badgePop]}>
            <Ionicons name="flame" size={9} color="#B91C1C" />
            <Text style={[S.badgeText, { color: '#B91C1C' }]}>Popular</Text>
          </View>
        )}
        {item.isOffer === 'T' && (
          <View style={[S.badge, S.badgeOffer]}>
            <Ionicons name="pricetag" size={9} color="#0F766E" />
            <Text style={[S.badgeText, { color: '#0F766E' }]}>Offer</Text>
          </View>
        )}
      </View>
    );
  }

  // ── Product card ────────────────────────────────────────────────────────────
  function renderProduct({ item }: { item: MenuItemResult }) {
    const soldOut = item.isSoldOut === 'T';
    return (
      <TouchableOpacity
        activeOpacity={0.85}
        onPress={() => {
          if (soldOut) return;
          setSelectedItem(item);
          setQty('1');
          setQtyModalVisible(true);
        }}
      >
        <View style={[S.card, soldOut && S.cardSoldOut]}>
          <View style={[S.cardAccent, soldOut && S.cardAccentSoldOut]} />
          <ProductImage item={item} />
          <View style={S.cardInfo}>
            <Text
              style={[S.prodName, soldOut && S.prodNameSoldOut]}
              numberOfLines={2}
            >
              {item.Prod_Name}
            </Text>
            <Badges item={item} />
          </View>
        </View>
      </TouchableOpacity>
    );
  }

  // ── Context label shown in modal ───────────────────────────────────────────
  function getContextLabel(): string {
    if (!orderContext.type) return '';
    if (orderContext.type === 'guest')
      return `Guest: ${orderContext.guestName ?? orderContext.guestId}`;
    if (orderContext.type === 'visitor')
      return `Visitor: ${orderContext.visitorName}`;
    if (orderContext.type === 'executive_staff')
      return `Staff: ${orderContext.staffName}`;
    if (orderContext.type === 'pits')
      return `Pit ${orderContext.pitName} · ${orderContext.tableCode}`;
    return '';
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
          <Text style={S.navTitle} numberOfLines={1}>
            {catName}
          </Text>
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

      {!loading && !error && allProducts.length > 0 && (
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
              onChangeText={handleSearch}
              placeholder="Search items…"
              placeholderTextColor={TEXT_LIGHT}
              returnKeyType="search"
              autoCapitalize="none"
            />
            {query.length > 0 && (
              <TouchableOpacity
                onPress={handleClear}
                hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
              >
                <Ionicons name="close-circle" size={18} color={TEXT_LIGHT} />
              </TouchableOpacity>
            )}
          </View>
        </View>
      )}

      {loading ? (
        <View style={S.centerWrap}>
          <ActivityIndicator size="large" color={PURPLE} />
          <Text style={S.loadingText}>Loading products…</Text>
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
          <Text style={S.emptyTitle}>Could not load products</Text>
          <Text style={S.emptySub}>{error}</Text>
          <TouchableOpacity
            style={S.retryBtn}
            onPress={fetchProducts}
            activeOpacity={0.8}
          >
            <Ionicons name="refresh-outline" size={15} color={WHITE} />
            <Text style={S.retryBtnText}>Retry</Text>
          </TouchableOpacity>
        </View>
      ) : filtered.length === 0 ? (
        <View style={S.centerWrap}>
          <View style={S.emptyIconWrap}>
            <Ionicons
              name={query ? 'search-outline' : 'restaurant-outline'}
              size={32}
              color={TEXT_LIGHT}
            />
          </View>
          <Text style={S.emptyTitle}>
            {query ? 'No results' : 'No products found'}
          </Text>
          <Text style={S.emptySub}>
            {query ? `Nothing matched "${query}"` : `No items in ${catName}`}
          </Text>
          {query ? (
            <TouchableOpacity
              style={S.retryBtn}
              onPress={handleClear}
              activeOpacity={0.8}
            >
              <Ionicons name="close-outline" size={15} color={WHITE} />
              <Text style={S.retryBtnText}>Clear</Text>
            </TouchableOpacity>
          ) : (
            <TouchableOpacity
              style={S.retryBtn}
              onPress={fetchProducts}
              activeOpacity={0.8}
            >
              <Ionicons name="refresh-outline" size={15} color={WHITE} />
              <Text style={S.retryBtnText}>Refresh</Text>
            </TouchableOpacity>
          )}
        </View>
      ) : (
        <FlatList
          data={filtered}
          keyExtractor={(item, index) => item.Prod_Code ?? String(index)}
          renderItem={renderProduct}
          contentContainerStyle={S.list}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        />
      )}

      {/* ── Qty Modal ── */}
      <Modal
        visible={qtyModalVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setQtyModalVisible(false)}
      >
        <View style={S.modalOverlay}>
          <View style={S.modalCard}>
            <Text style={S.modalTitle}>Add to Order</Text>

            {/* Who is ordering — from context */}
            {/* {!!orderContext.type && (
              <View style={S.contextBadge}>
                <Ionicons name="person-outline" size={12} color={PURPLE} />
                <Text style={S.contextBadgeText}>{getContextLabel()}</Text>
              </View>
            )} */}
            <Text style={S.modalSub}>Add Qty to Order</Text>

            <Text style={S.modalItemName}>{selectedItem?.Prod_Name}</Text>

            <TextInput
              style={S.qtyInput}
              value={qty}
              onChangeText={setQty}
              keyboardType="numeric"
              placeholder="Enter quantity"
              placeholderTextColor="#9CA3AF"
            />

            <View style={S.modalBtnRow}>
              <TouchableOpacity
                style={[S.modalBtn, S.btnAdd]}
                onPress={handleAdd}
              >
                <Text style={S.modalBtnText}>Add</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[S.modalBtn, S.btnOrder]}
                onPress={handleOrder}
              >
                <Text style={S.modalBtnText}>Order</Text>
              </TouchableOpacity>
              <TouchableOpacity style={[S.modalBtn, S.btnReturn]}>
                <Text style={S.modalBtnText}>Return</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[S.modalBtn, S.btnCancel]}
                onPress={() => setQtyModalVisible(false)}
              >
                <Text style={S.modalBtnText}>Cancel</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
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
  cardSoldOut: { opacity: 0.55 },
  cardAccent: { width: 4, alignSelf: 'stretch', backgroundColor: PURPLE },
  cardAccentSoldOut: { backgroundColor: '#D1D5DB' },
  prodImage: {
    width: 68,
    height: 68,
    borderRadius: 12,
    marginLeft: 12,
    marginVertical: 12,
  },
  prodImageFallback: {
    backgroundColor: '#F3F4F6',
    alignItems: 'center',
    justifyContent: 'center',
  },
  cardInfo: { flex: 1, paddingHorizontal: 12, paddingVertical: 12 },
  prodName: {
    fontSize: 14,
    fontWeight: '700',
    color: TEXT_DARK,
    lineHeight: 20,
    marginBottom: 4,
  },
  prodNameSoldOut: { color: TEXT_LIGHT },
  badgeRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 4, marginBottom: 2 },
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    paddingHorizontal: 7,
    paddingVertical: 2,
    borderRadius: 20,
  },
  badgeText: { fontSize: 9, fontWeight: '700', letterSpacing: 0.2 },
  badgeBest: { backgroundColor: '#FEF3C7' },
  badgePop: { backgroundColor: '#FEE2E2' },
  badgeOffer: { backgroundColor: '#CCFBF1' },
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
  retryBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: PURPLE_DEEP,
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 20,
    marginTop: 4,
  },
  retryBtnText: { fontSize: 13, fontWeight: '700', color: WHITE },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.4)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalCard: {
    width: '85%',
    backgroundColor: WHITE,
    borderRadius: 18,
    padding: 18,
    shadowColor: '#000',
    shadowOpacity: 0.2,
    shadowRadius: 10,
    elevation: 10,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: TEXT_DARK,
    textAlign: 'center',
    marginBottom: 8,
  },
  contextBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#F3EEFF',
    borderRadius: 20,
    paddingHorizontal: 12,
    paddingVertical: 5,
    alignSelf: 'center',
    marginBottom: 10,
    borderWidth: 1,
    borderColor: '#E9D8FD',
  },
  contextBadgeText: { fontSize: 12, fontWeight: '600', color: PURPLE },
  modalSub: {
  fontSize: 12,
  color: TEXT_MID,
  textAlign: 'center',
  marginBottom: 10,
},

  modalItemName: {
    fontSize: 13,
    fontWeight: '600',
    color: TEXT_DARK,
    textAlign: 'center',
    marginBottom: 12,
  },
  qtyInput: {
    borderWidth: 1.5,
    borderColor: BORDER,
    borderRadius: 12,
    paddingVertical: 10,
    paddingHorizontal: 12,
    fontSize: 16,
    textAlign: 'center',
    marginBottom: 16,
    color: TEXT_DARK,
  },
  modalBtnRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    gap: 8,
  },
  modalBtn: {
    flex: 1,
    minWidth: '45%',
    paddingVertical: 10,
    borderRadius: 12,
    alignItems: 'center',
  },
  modalBtnText: { color: WHITE, fontWeight: '700', fontSize: 13 },
  btnAdd: { backgroundColor: PURPLE },
  btnOrder: { backgroundColor: '#16A34A' },
  btnReturn: { backgroundColor: '#EA580C' },
  btnCancel: { backgroundColor: '#6B7280' },
  iconBtn: {
    width: 36, height: 36, borderRadius: 10,
    backgroundColor: 'rgba(255,255,255,0.15)',
    alignItems: 'center', justifyContent: 'center',
  },
});
