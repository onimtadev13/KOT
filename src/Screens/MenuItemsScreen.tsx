import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  FlatList,
  StatusBar,
  Platform,
  TextInput,
  Image,
} from 'react-native';
import { Ionicons } from '@react-native-vector-icons/ionicons';
import { useAppStore } from '../Store/store';
import { loadMenuItems, MenuItemResult, submitKotItem } from '../Api/api';
import { DrawerActions, useNavigation } from '@react-navigation/native';
import { useAppBack } from '../Hooks/useAppBack';
import colors from '../themes/colors';
import AddToOrderModal from '../Components/AddToOrderModal';
import LottieView from 'lottie-react-native';
import MessageBox from '../Components/MessageBox';

export default function MenuItemsScreen({
  navigation,
  route,
}: {
  navigation: any;
  route: any;
}) {
  const nav = useNavigation<any>();
  const { deptCode, catCode, catName } = route.params as {
    deptCode: string;
    catCode:  string;
    catName:  string;
  };

  useAppBack();

  const device       = useAppStore(state => state.device);
  const session      = useAppStore(state => state.session);
  const orderContext = useAppStore(state => state.orderContext);
  const addOrderItem = useAppStore(state => state.addOrderItem);

  const [allProducts,     setAllProducts]     = useState<MenuItemResult[]>([]);
  const [filtered,        setFiltered]        = useState<MenuItemResult[]>([]);
  const [query,           setQuery]           = useState('');
  const [loading,         setLoading]         = useState(true);
  const [error,           setError]           = useState<string | null>(null);
  const [selectedItem,    setSelectedItem]    = useState<MenuItemResult | null>(null);
  const [qtyModalVisible, setQtyModalVisible] = useState(false);
  const [qty,             setQty]             = useState('1');
  const [orderSending,    setOrderSending]    = useState(false);

  const [msgBox, setMsgBox] = useState<{
  visible: boolean;
  variant: 'danger' | 'warning' | 'info';
  title: string;
  message: string;
}>({ visible: false, variant: 'info', title: '', message: '' });

function showMsg(variant: 'danger' | 'warning' | 'info', title: string, message: string) {
  setMsgBox({ visible: true, variant, title, message });
}

  useEffect(() => {
    fetchProducts();
  }, [catCode]); // eslint-disable-line react-hooks/exhaustive-deps

  async function fetchProducts() {
    setLoading(true);
    setError(null);
    setQuery('');
    try {
      const unitNo = String(device?.Device_Id ?? '');
      const docNo  = device?.Doc_No  ?? '';
      const mac    = device?.UniqueId ?? '';
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

  // ── Add to local store only (no API call) ─────────────────────────────────
  function handleAdd() {
    if (!selectedItem) return;
    const quantity = Math.max(1, parseInt(qty) || 1);
    addOrderItem({
      Prod_Code:     selectedItem.Prod_Code,
      Prod_Name:     selectedItem.Prod_Name,
      Dept_Code:     deptCode,
      Dept_Name:     '',
      Cat_Code:      catCode,
      Cat_Name:      catName,
      Selling_Price: selectedItem.Selling_Price ?? 0,
      Qty:           quantity,
      GuestID:       orderContext.guestId,
      GuestName:     orderContext.guestName,
      PitName:       orderContext.pitName,
      TableCode:     orderContext.tableCode,
      StaffCode:     orderContext.staffCode,
      StaffName:     orderContext.staffName,
    });
    console.log('[MENU ITEMS] Added to order:', selectedItem.Prod_Name, 'x', quantity);
    setQtyModalVisible(false);
  }

  // ── Order — calls iid 7, adds to store, navigates ─────────────────────────
  async function handleOrder() {
    if (!selectedItem) return;
    if (orderSending) return;

    const quantity = Math.max(1, parseInt(qty) || 1);

    setOrderSending(true);
    try {
      const result = await submitKotItem({
        prodCode:      selectedItem.Prod_Code,
        prodName:      selectedItem.Prod_Name,
        sellingPrice:  selectedItem.Selling_Price  ?? 0,
        purchasePrice: selectedItem.Purchase_Price ?? 0,
        docNo:         device?.Doc_No    ?? '',
        unitNo:        device?.Device_Id ?? 0,
        loginUser:     session?.Emp_Name ?? '',
        qty:           quantity,
        tableNo:       orderContext.tableCode ?? '',
        kotId:         selectedItem.KOT_ID,
        botId:         selectedItem.BOT_ID,
      });

      console.log('[MENU ITEMS] submitKotItem result:', JSON.stringify(result, null, 2));

      if (!result.success) {
        showMsg('warning', 'Error', 'Failed to submit order item. Please try again.');
  return;
      }

      addOrderItem({
        Prod_Code:     selectedItem.Prod_Code,
        Prod_Name:     selectedItem.Prod_Name,
        Dept_Code:     deptCode,
        Dept_Name:     '',
        Cat_Code:      catCode,
        Cat_Name:      catName,
        Selling_Price: selectedItem.Selling_Price ?? 0,
        Qty:           quantity,
        GuestID:       orderContext.guestId,
        GuestName:     orderContext.guestName,
        PitName:       orderContext.pitName,
        TableCode:     orderContext.tableCode,
        StaffCode:     orderContext.staffCode,
        StaffName:     orderContext.staffName,
      });

      setQtyModalVisible(false);
      navigation.navigate('CurrentOrder');

    } finally {
      setOrderSending(false);
    }
  }

  // ── Product image ──────────────────────────────────────────────────────────
  function ProductImage({ item }: { item: MenuItemResult }) {
    const hasImage = !!item.ImagePath && item.ImagePath.trim() !== '';
    if (hasImage)
      return (
        <Image source={{ uri: item.ImagePath }} style={S.prodImage} resizeMode="cover" />
      );
    return (
      <View style={[S.prodImage, S.prodImageFallback]}>
        <Ionicons name="restaurant-outline" size={26} color={colors.border} />
      </View>
    );
  }

  // ── Badges ─────────────────────────────────────────────────────────────────
  function Badges({ item }: { item: MenuItemResult }) {
    const has = item.isBestSeller === 'T' || item.Popular === 'T' || item.isOffer === 'T';
    if (!has) return null;
    return (
      <View style={S.badgeRow}>
        {item.isBestSeller === 'T' && (
          <View style={[S.badge, { backgroundColor: colors.badge.bestSeller.bg }]}>
            <Ionicons name="star" size={9} color={colors.badge.bestSeller.text} />
            <Text style={[S.badgeText, { color: colors.badge.bestSeller.text }]}>Best Seller</Text>
          </View>
        )}
        {item.Popular === 'T' && (
          <View style={[S.badge, { backgroundColor: colors.badge.popular.bg }]}>
            <Ionicons name="flame" size={9} color={colors.badge.popular.text} />
            <Text style={[S.badgeText, { color: colors.badge.popular.text }]}>Popular</Text>
          </View>
        )}
        {item.isOffer === 'T' && (
          <View style={[S.badge, { backgroundColor: colors.badge.offer.bg }]}>
            <Ionicons name="pricetag" size={9} color={colors.badge.offer.text} />
            <Text style={[S.badgeText, { color: colors.badge.offer.text }]}>Offer</Text>
          </View>
        )}
      </View>
    );
  }

  // ── Product card ───────────────────────────────────────────────────────────
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
            <Text style={[S.prodName, soldOut && S.prodNameSoldOut]} numberOfLines={2}>
              {item.Prod_Name}
            </Text>
            <Badges item={item} />
          </View>
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
          <Text style={S.navTitle} numberOfLines={1}>{catName}</Text>
          <Text style={S.navSub}>Kitchen Order Ticket</Text>
        </View>

        {/* ── Doc chip — matches ExecutiveStaffScreen ── */}
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
      {!loading && !error && allProducts.length > 0 && (
        <View style={S.searchWrap}>
          <View style={S.searchBox}>
            <Ionicons name="search-outline" size={17} color={colors.muted} style={{ marginRight: 8 }} />
            <TextInput
              style={S.searchInput}
              value={query}
              onChangeText={handleSearch}
              placeholder="Search items…"
              placeholderTextColor={colors.muted}
              returnKeyType="search"
              autoCapitalize="none"
            />
            {query.length > 0 && (
              <TouchableOpacity onPress={handleClear} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
                <Ionicons name="close-circle" size={18} color={colors.muted} />
              </TouchableOpacity>
            )}
          </View>
        </View>
      )}

      {/* ── States ── */}
      {loading ? (
        <View style={S.centerWrap}>
          {/* <ActivityIndicator size="large" color={colors.primary} />
          <Text style={S.loadingText}>Loading products…</Text> */}
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
          <Text style={S.emptyTitle}>Could not load products</Text>
          <Text style={S.emptySub}>{error}</Text>
          <TouchableOpacity style={S.retryBtn} onPress={fetchProducts} activeOpacity={0.8}>
            <Ionicons name="refresh-outline" size={15} color={colors.white} />
            <Text style={S.retryBtnText}>Retry</Text>
          </TouchableOpacity>
        </View>
      ) : filtered.length === 0 ? (
        <View style={S.centerWrap}>
          <View style={S.emptyIconWrap}>
            <Ionicons name={query ? 'search-outline' : 'restaurant-outline'} size={32} color={colors.muted} />
          </View>
          <Text style={S.emptyTitle}>{query ? 'No results' : 'No products found'}</Text>
          <Text style={S.emptySub}>
            {query ? `Nothing matched "${query}"` : `No items in ${catName}`}
          </Text>
          {query ? (
            <TouchableOpacity style={S.retryBtn} onPress={handleClear} activeOpacity={0.8}>
              <Ionicons name="close-outline" size={15} color={colors.white} />
              <Text style={S.retryBtnText}>Clear</Text>
            </TouchableOpacity>
          ) : (
            <TouchableOpacity style={S.retryBtn} onPress={fetchProducts} activeOpacity={0.8}>
              <Ionicons name="refresh-outline" size={15} color={colors.white} />
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

      {/* ── Modal — now lives in Components/AddToOrderModal ── */}
      <AddToOrderModal
        visible={qtyModalVisible}
        itemName={selectedItem?.Prod_Name ?? ''}
        qty={qty}
        orderSending={orderSending}
        onQtyChange={setQty}
        onAdd={handleAdd}
        onOrder={handleOrder}
        onReturn={() => setQtyModalVisible(false)}
        onCancel={() => setQtyModalVisible(false)}
      />

      {/* ── Error MessageBox ── */}
      <MessageBox
        visible={msgBox.visible}
        variant={msgBox.variant}
        title={msgBox.title}
        message={msgBox.message}
        buttons={[
          {
            label: 'OK',
            style: 'destructive',
            onPress: () => setMsgBox(p => ({ ...p, visible: false })),
          },
        ]}
        onDismiss={() => setMsgBox(p => ({ ...p, visible: false }))}
      />
    </View>
  );
}

const S = StyleSheet.create({
  flex: { flex: 1, backgroundColor: colors.background },

  // ── Nav bar ────────────────────────────────────────────────────────────────
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

  // ── Doc chip — matches ExecutiveStaffScreen ────────────────────────────────
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

  // ── Search ─────────────────────────────────────────────────────────────────
  searchWrap: { paddingHorizontal: 14, paddingTop: 12, paddingBottom: 2 },
  searchBox: {
    flexDirection:     'row',
    alignItems:        'center',
    backgroundColor:   colors.card,
    borderRadius:      13,
    borderWidth:       1.5,
    borderColor:       colors.border,
    paddingHorizontal: 14,
    elevation:         2,
    shadowColor:       colors.shadow.card,
    shadowOffset:      { width: 0, height: 1 },
    shadowOpacity:     0.06,
    shadowRadius:      6,
  },
  searchInput: { flex: 1, fontSize: 14, color: colors.text.dark, paddingVertical: 12 },

  // ── List ───────────────────────────────────────────────────────────────────
  list: { paddingHorizontal: 14, paddingTop: 14, paddingBottom: 32, gap: 10 },

  // ── Product card ───────────────────────────────────────────────────────────
  card: {
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
  cardSoldOut:      { opacity: 0.55 },
  cardAccent:       { width: 4, alignSelf: 'stretch', backgroundColor: colors.primary },
  cardAccentSoldOut:{ backgroundColor: colors.border },
  prodImage: {
    width:         68,
    height:        68,
    borderRadius:  12,
    marginLeft:    12,
    marginVertical:12,
  },
  prodImageFallback: {
    backgroundColor: colors.background,
    alignItems:      'center',
    justifyContent:  'center',
  },
  cardInfo:        { flex: 1, paddingHorizontal: 12, paddingVertical: 12 },
  prodName:        { fontSize: 14, fontWeight: '700', color: colors.text.dark, lineHeight: 20, marginBottom: 4 },
  prodNameSoldOut: { color: colors.muted },
  badgeRow:        { flexDirection: 'row', flexWrap: 'wrap', gap: 4, marginBottom: 2 },
  badge: {
    flexDirection:     'row',
    alignItems:        'center',
    gap:               3,
    paddingHorizontal: 7,
    paddingVertical:   2,
    borderRadius:      20,
  },
  badgeText: { fontSize: 9, fontWeight: '700', letterSpacing: 0.2 },

  // ── Centre states ──────────────────────────────────────────────────────────
  centerWrap:   { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 12 },
  loadingText:  { fontSize: 14, color: colors.text.mid, fontWeight: '500' },
  emptyIconWrap:{
    width:           64,
    height:          64,
    borderRadius:    32,
    backgroundColor: colors.background,
    alignItems:      'center',
    justifyContent:  'center',
    marginBottom:    4,
  },
  emptyTitle:   { fontSize: 15, fontWeight: '600', color: colors.text.mid },
  emptySub:     { fontSize: 12, color: colors.muted, textAlign: 'center' },
  retryBtn: {
    flexDirection:     'row',
    alignItems:        'center',
    gap:               6,
    backgroundColor:   colors.primary,
    paddingHorizontal: 20,
    paddingVertical:   10,
    borderRadius:      20,
    marginTop:         4,
  },
  retryBtnText: { fontSize: 13, fontWeight: '700', color: colors.white },
});