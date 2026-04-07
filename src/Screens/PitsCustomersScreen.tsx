import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  FlatList,
  StatusBar,
  Platform,
  Image,
} from 'react-native';
import { Ionicons } from '@react-native-vector-icons/ionicons';
import { useAppStore } from '../Store/store';
import { loadPitCustomers, PitCustomerResult } from '../Api/api';
import { DrawerActions, useNavigation, useFocusEffect } from '@react-navigation/native';
import colors from '../themes/colors';
import LottieView from 'lottie-react-native';
import ImagePreviewModal from '../Components/ImagePreviewModal';

// ─────────────────────────────────────────────────────────────────────────────
// PitsCustomersScreen
// Receives: route.params.tblCode (string)
// API returns: { MID, MName, MemImage2 (base64 PNG) }
// ─────────────────────────────────────────────────────────────────────────────
export default function PitsCustomersScreen({
  navigation,
  route,
}: {
  navigation: any;
  route: any;
}) {
  const nav          = useNavigation<any>();
  const { tblCode } = route.params as { tblCode: string };
  const device = useAppStore(state => state.device);
  const orderItemCount  = useAppStore(state => state.orderItemCount);

const itemCount = orderItemCount();

  const [customers, setCustomers] = useState<PitCustomerResult[]>([]);
  const [loading,   setLoading]   = useState(true);
  const [error,     setError]     = useState<string | null>(null);

  const [previewImage,  setPreviewImage]  = useState<string>('');
const [previewVisible, setPreviewVisible] = useState(false);

  useEffect(() => {
    fetchCustomers();
  }, [tblCode]); // eslint-disable-line react-hooks/exhaustive-deps

  async function fetchCustomers() {
    setLoading(true);
    setError(null);
    try {
      const result = await loadPitCustomers(tblCode);
      setCustomers(result);
    } catch (e: any) {
      setError('Failed to load customer details.');
    } finally {
      setLoading(false);
    }
  }

  function handleAddOrder(customer: PitCustomerResult) {
    navigation.navigate('PitsCustomerDetails', {
      MID:     customer.MID,
      MName:   customer.MName,
      tblCode: tblCode,
    });
  }

  // ── Avatar — base64 image or fallback initial ───────────────────────────────
  function Avatar({ customer }: { customer: PitCustomerResult }) {
  const initial  = (customer.MName ?? '?').charAt(0).toUpperCase();
  const hasImage = !!customer.MemImage2 && customer.MemImage2.trim() !== '';

  if (hasImage) {
    return (
      <TouchableOpacity
        onPress={() => {
          setPreviewImage(customer.MemImage2!);
          setPreviewVisible(true);
        }}
        activeOpacity={0.85}
      >
        <Image
          source={{ uri: `data:image/png;base64,${customer.MemImage2}` }}
          style={S.avatar}
        />
      </TouchableOpacity>
    );
  }

  return (
    <View style={[S.avatar, S.avatarFallback]}>
      <Text style={S.avatarInitial}>{initial}</Text>
    </View>
  );
}

  // ── Customer card ───────────────────────────────────────────────────────────
  function renderCustomer({ item }: { item: PitCustomerResult }) {
    return (
      <View style={S.customerCard}>
        {/* Left amber accent */}
        <View style={S.cardAccent} />

        {/* Avatar */}
        <View style={S.avatarWrap}>
          <Avatar customer={item} />
        </View>

        {/* Info */}
        <View style={S.cardInfo}>
          <Text style={S.custName} numberOfLines={2}>{item.MName ?? 'Unknown'}</Text>
          <View style={S.idChip}>
            <Ionicons name="card-outline" size={10} color={colors.pitsCustomers.amber} />
            <Text style={S.idChipText}>{item.MID ?? '—'}</Text>
          </View>
        </View>

        {/* Plus button */}
        <TouchableOpacity
          style={S.plusBtn}
          onPress={() => handleAddOrder(item)}
          activeOpacity={0.8}
        >
          <Ionicons name="add" size={22} color={colors.white} />
        </TouchableOpacity>
      </View>
    );
  }

  // ── Render ──────────────────────────────────────────────────────────────────
  return (
    <View style={S.flex}>
      <StatusBar barStyle="light-content" backgroundColor={colors.pitsCustomers.purpleDeep} />

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
          <Text style={S.navTitle}>{tblCode}</Text>
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

      {/* ── Content ── */}
      {loading ? (
        <View style={S.centerWrap}>
          {/* <ActivityIndicator size="large" color={colors.pitsCustomers.amber} />
          <Text style={S.loadingText}>Loading customers…</Text> */}
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
            <Ionicons name="cloud-offline-outline" size={32} color={colors.pitsCustomers.textLight} />
          </View>
          <Text style={S.emptyTitle}>Could not load customers</Text>
          <Text style={S.emptySub}>{error}</Text>
          <TouchableOpacity style={S.retryBtn} onPress={fetchCustomers} activeOpacity={0.8}>
            <Ionicons name="refresh-outline" size={15} color={colors.white} />
            <Text style={S.retryBtnText}>Retry</Text>
          </TouchableOpacity>
        </View>
      ) : customers.length === 0 ? (
        <View style={S.centerWrap}>
          <View style={S.emptyIconWrap}>
            <Ionicons name="people-outline" size={32} color={colors.pitsCustomers.textLight} />
          </View>
          <Text style={S.emptyTitle}>No customers found</Text>
          <Text style={S.emptySub}>No customers assigned to {tblCode}</Text>
          <TouchableOpacity style={S.retryBtn} onPress={fetchCustomers} activeOpacity={0.8}>
            <Ionicons name="refresh-outline" size={15} color={colors.white} />
            <Text style={S.retryBtnText}>Refresh</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <FlatList
          data={customers}
          keyExtractor={(item, index) => item.MID ?? String(index)}
          renderItem={renderCustomer}
          contentContainerStyle={S.list}
          showsVerticalScrollIndicator={false}
        />
      )}

      <ImagePreviewModal
        visible={previewVisible}
        base64={previewImage}
        onClose={() => setPreviewVisible(false)}
      />
    </View>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Styles
// ─────────────────────────────────────────────────────────────────────────────
const S = StyleSheet.create({
  flex: { flex: 1, backgroundColor: colors.pitsCustomers.bg },

  // ── Nav bar ──
  navBar: {
    backgroundColor:   colors.pitsCustomers.purpleDeep,
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

  // ── Table strip (commented out in original — kept commented) ──────────────
  tableStrip: {
    backgroundColor:  colors.pitsCustomers.orange,
    marginHorizontal: 14,
    marginTop:        14,
    marginBottom:     4,
    borderRadius:     16,
    paddingHorizontal: 16,
    paddingVertical:  14,
    flexDirection:    'row',
    alignItems:       'center',
    gap:              10,
  },
  tableStripBadge: {
    flexDirection:     'row',
    alignItems:        'center',
    gap:               6,
    backgroundColor:   colors.overlay.white20,
    paddingHorizontal: 12,
    paddingVertical:   6,
    borderRadius:      20,
    borderWidth:       1.5,
    borderColor:       colors.pitsCustomers.stripBadgeBorder,
  },
  tableStripBadgeText: { fontSize: 13, fontWeight: '800', color: colors.white },
  tableStripSub: {
    fontSize:   12,
    color:      colors.pitsCustomers.stripSubText,
    fontWeight: '500',
    flex:       1,
  },
  refreshBtn: {
    width:           32,
    height:          32,
    borderRadius:    16,
    backgroundColor: colors.overlay.white20,
    alignItems:      'center',
    justifyContent:  'center',
  },

  // ── List ──
  list: { paddingHorizontal: 14, paddingTop: 14, paddingBottom: 32, gap: 10 },

  // ── Customer card ──
  customerCard: {
    backgroundColor: colors.pitsCustomers.card,
    borderRadius:    16,
    borderWidth:     1,
    borderColor:     colors.pitsCustomers.border,
    flexDirection:   'row',
    alignItems:      'center',
    overflow:        'hidden',
    shadowColor:     colors.pitsCustomers.shadowCard,
    shadowOffset:    { width: 0, height: 2 },
    shadowOpacity:   0.07,
    shadowRadius:    8,
    elevation:       3,
  },
  cardAccent: { width: 4, alignSelf: 'stretch', backgroundColor: colors.pitsCustomers.amber },

  // ── Avatar ──
  avatarWrap: { marginLeft: 14, marginVertical: 14 },
  avatar: {
    width:        100,
    height:       100,
    borderRadius: 50,
    borderWidth:  2.5,
    borderColor:  colors.pitsCustomers.avatarBorder,
  },
  avatarFallback: {
    backgroundColor: colors.pitsCustomers.amber,
    alignItems:      'center',
    justifyContent:  'center',
  },
  avatarInitial: { fontSize: 22, fontWeight: '800', color: colors.white },

  // ── Info ──
  cardInfo: { flex: 1, paddingHorizontal: 14, paddingVertical: 14 },
  custName: {
    fontSize:     14,
    fontWeight:   '700',
    color:        colors.pitsCustomers.textDark,
    marginBottom: 6,
    lineHeight:   20,
  },
  idChip: {
    flexDirection:     'row',
    alignItems:        'center',
    gap:               4,
    backgroundColor:   colors.pitsCustomers.idChipBg,
    alignSelf:         'flex-start',
    paddingHorizontal: 8,
    paddingVertical:   3,
    borderRadius:      20,
    borderWidth:       1,
    borderColor:       colors.pitsCustomers.idChipBorder,
  },
  idChipText: {
    fontSize:      11,
    fontWeight:    '700',
    color:         colors.pitsCustomers.amber,
    letterSpacing: 0.3,
  },

  // ── Plus button ──
  plusBtn: {
    width:         40,
    height:        40,
    borderRadius:  20,
    backgroundColor: colors.pitsCustomers.purpleDeep,
    alignItems:    'center',
    justifyContent:'center',
    marginRight:   14,
    shadowColor:   colors.pitsCustomers.purpleDeep,
    shadowOffset:  { width: 0, height: 3 },
    shadowOpacity: 0.3,
    shadowRadius:  6,
    elevation:     4,
  },

  // ── Center states ──
  centerWrap:  { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 12 },
  loadingText: { fontSize: 14, color: colors.pitsCustomers.textMid, fontWeight: '500' },
  emptyIconWrap: {
    width:           64,
    height:          64,
    borderRadius:    32,
    backgroundColor: colors.pitsCustomers.emptyIconBg,
    alignItems:      'center',
    justifyContent:  'center',
    marginBottom:    4,
  },
  emptyTitle: { fontSize: 15, fontWeight: '600', color: colors.pitsCustomers.textMid },
  emptySub:   { fontSize: 12, color: colors.pitsCustomers.textLight, textAlign: 'center' },
  retryBtn: {
    flexDirection:     'row',
    alignItems:        'center',
    gap:               6,
    backgroundColor:   colors.pitsCustomers.purpleDeep,
    paddingHorizontal: 20,
    paddingVertical:   10,
    borderRadius:      20,
    marginTop:         4,
  },
  retryBtnText: { fontSize: 13, fontWeight: '700', color: colors.white },
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