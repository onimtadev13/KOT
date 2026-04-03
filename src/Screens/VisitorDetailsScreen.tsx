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
} from 'react-native';
import { Ionicons } from '@react-native-vector-icons/ionicons';
import { useAppStore } from '../Store/store';
import { DrawerActions, useNavigation, useFocusEffect } from '@react-navigation/native';
import colors from '../themes/colors';

// ─────────────────────────────────────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────────────────────────────────────
type OrderEntry = { id: string; name: string };

// ─────────────────────────────────────────────────────────────────────────────
// VisitorDetailsScreen
// ─────────────────────────────────────────────────────────────────────────────
export default function VisitorDetailsScreen({
  navigation,
}: {
  navigation: any;
}) {
  const nav    = useNavigation<any>();
  const device = useAppStore(state => state.device);
  const session = useAppStore(state => state.session);
  const setOrderContext = useAppStore(state => state.setOrderContext);

  const [visitorName, setVisitorName] = useState('');
  const [orderList,   setOrderList]   = useState<OrderEntry[]>([]);
  const [focused,     setFocused]     = useState(false);
  const inputRef = useRef<TextInput>(null);

  function handleAddToOrder() {
    const trimmed = visitorName.trim();
    if (!trimmed) return;
    setOrderList(prev => [
      ...prev,
      { id: Date.now().toString(), name: trimmed },
    ]);
    setVisitorName('');
    inputRef.current?.focus();
    console.log('[VISITOR] Added:', trimmed);
  }

  function handleRemove(id: string) {
    setOrderList(prev => prev.filter(e => e.id !== id));
  }

  // ── Confirm → set order context using the first visitor name ──────────────
  function handleConfirm() {
    if (orderList.length === 0) return;
    setOrderContext({
      type: 'visitor',
      visitorName: orderList[0].name,
    });
    console.log('[VISITOR] Order context set:', orderList[0].name, '+ others');
    navigation.navigate('Menu');
  }

  return (
    <View style={S.flex}>
      <StatusBar barStyle="light-content" backgroundColor={colors.visitorDetails.purpleDeep} />

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
          <Text style={S.navTitle}>Visitor Order</Text>
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

      {/* ── Greet strip (commented out in original — kept commented) ── */}
      {/* <View style={S.greetStrip}>
        <View style={S.greetAvatar}>
          <Ionicons name="walk" size={20} color={colors.white} />
        </View>
        <View style={S.greetText}>
          <Text style={S.greetTitle}>Visitor Order</Text>
          <Text style={S.greetSub}>
            Logged by {session?.Emp_Name ?? 'Staff'} · Unit{' '}
            {device?.Device_Id ?? '—'}
          </Text>
        </View>
        {orderList.length > 0 && (
          <View style={S.countBadge}>
            <Text style={S.countBadgeText}>{orderList.length}</Text>
          </View>
        )}
      </View> */}

      {/* ── Fixed input section ── */}
      <View style={S.inputSection}>
        <View style={S.card}>
          <View style={S.cardHeader}>
            <View style={S.cardHeaderIcon}>
              <Ionicons name="person-add-outline" size={15} color={colors.visitorDetails.blue} />
            </View>
            <Text style={S.cardTitle}>Add Visitor</Text>
          </View>

          <Text style={S.fieldLabel}>VISITOR NAME</Text>

          <View style={[S.inputWrap, focused && S.inputWrapFocused]}>
            <Ionicons
              name="person-outline"
              size={18}
              color={focused ? colors.visitorDetails.blue : colors.visitorDetails.textLight}
              style={S.inputIcon}
            />
            <TextInput
              ref={inputRef}
              style={S.input}
              value={visitorName}
              onChangeText={setVisitorName}
              placeholder="Enter visitor name…"
              placeholderTextColor={colors.visitorDetails.textLight}
              autoCapitalize="words"
              returnKeyType="done"
              blurOnSubmit={false}
              onSubmitEditing={handleAddToOrder}
              onFocus={() => setFocused(true)}
              onBlur={() => setFocused(false)}
            />
            {visitorName.length > 0 && (
              <TouchableOpacity
                onPress={() => setVisitorName('')}
                style={S.clearBtn}
              >
                <Ionicons name="close-circle" size={18} color={colors.visitorDetails.textLight} />
              </TouchableOpacity>
            )}
          </View>

          <TouchableOpacity
            style={[S.addBtn, !visitorName.trim() && S.addBtnDisabled]}
            onPress={handleAddToOrder}
            disabled={!visitorName.trim()}
            activeOpacity={0.85}
          >
            <Ionicons
              name="add-circle-outline"
              size={20}
              color={visitorName.trim() ? colors.white : colors.visitorDetails.addBtnIconDisabled}
            />
            <Text style={[S.addBtnText, !visitorName.trim() && S.addBtnTextDisabled]}>
              Add to Order
            </Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* ── Order list ── */}
      <View style={S.listSection}>
        {orderList.length === 0 ? (
          <View style={S.emptyWrap}>
            <View style={S.emptyIconWrap}>
              <Ionicons name="people-outline" size={30} color={colors.visitorDetails.textLight} />
            </View>
            <Text style={S.emptyTitle}>No visitors added yet</Text>
            <Text style={S.emptySub}>Type a name above and tap Add to Order</Text>
          </View>
        ) : (
          <>
            <View style={S.listHeader}>
              <Text style={S.listHeaderTitle}>Order List</Text>
              <View style={S.listBadge}>
                <Text style={S.listBadgeText}>
                  {orderList.length} visitor{orderList.length > 1 ? 's' : ''}
                </Text>
              </View>
            </View>

            <FlatList
              data={orderList}
              keyExtractor={item => item.id}
              style={S.flatList}
              keyboardShouldPersistTaps="always"
              showsVerticalScrollIndicator={false}
              ItemSeparatorComponent={() => <View style={S.itemDivider} />}
              renderItem={({ item, index }) => (
                <View style={S.orderItem}>
                  <View style={S.orderItemAvatar}>
                    <Text style={S.orderItemAvatarText}>
                      {item.name.charAt(0).toUpperCase()}
                    </Text>
                  </View>
                  <View style={S.orderItemInfo}>
                    <Text style={S.orderItemName}>{item.name}</Text>
                    <Text style={S.orderItemSub}>Visitor #{index + 1}</Text>
                  </View>
                  <TouchableOpacity
                    style={S.removeBtn}
                    onPress={() => handleRemove(item.id)}
                    activeOpacity={0.7}
                  >
                    <Ionicons name="trash-outline" size={16} color={colors.visitorDetails.removeIcon} />
                  </TouchableOpacity>
                </View>
              )}
            />

            {/* Confirm → sets context → goes to Menu */}
            <TouchableOpacity
              style={S.confirmBtn}
              onPress={handleConfirm}
              activeOpacity={0.85}
            >
              <Ionicons name="checkmark-circle-outline" size={20} color={colors.white} />
              <Text style={S.confirmBtnText}>
                Confirm · {orderList.length} visitor{orderList.length > 1 ? 's' : ''} → Menu
              </Text>
            </TouchableOpacity>
          </>
        )}
      </View>
    </View>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Styles
// ─────────────────────────────────────────────────────────────────────────────
const S = StyleSheet.create({
  flex: { flex: 1, backgroundColor: colors.visitorDetails.bg },

  // ── Nav bar ──
  navBar: {
    backgroundColor:   colors.visitorDetails.purpleDeep,
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
  navSub: {
    fontSize:      9,
    color:         colors.overlay.muted65,
    letterSpacing: 1.5,
    marginTop:     1,
  },

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

  // ── Greet strip (commented out — kept for future use) ────────────────────
  greetStrip: {
    backgroundColor:   colors.visitorDetails.orange,
    marginHorizontal:  14,
    marginTop:         14,
    marginBottom:      4,
    borderRadius:      16,
    paddingHorizontal: 16,
    paddingVertical:   14,
    flexDirection:     'row',
    alignItems:        'center',
    gap:               12,
  },
  greetAvatar: {
    width:           40,
    height:          40,
    borderRadius:    20,
    backgroundColor: colors.visitorDetails.greetAvatarBg,
    alignItems:      'center',
    justifyContent:  'center',
    borderWidth:     1.5,
    borderColor:     colors.visitorDetails.greetAvatarBorder,
  },
  greetText:  { flex: 1 },
  greetTitle: { fontSize: 15, fontWeight: '800', color: colors.white },
  greetSub:   { fontSize: 11, color: colors.visitorDetails.greetSubText, marginTop: 2 },
  countBadge: {
    width:           28,
    height:          28,
    borderRadius:    14,
    backgroundColor: colors.visitorDetails.countBadgeBg,
    alignItems:      'center',
    justifyContent:  'center',
    borderWidth:     1.5,
    borderColor:     colors.visitorDetails.countBadgeBorder,
  },
  countBadgeText: { fontSize: 13, fontWeight: '800', color: colors.white },

  // ── Input section ──
  inputSection: { paddingHorizontal: 14, paddingTop: 14 },
  card: {
    backgroundColor: colors.visitorDetails.card,
    borderRadius:    20,
    borderWidth:     1,
    borderColor:     colors.visitorDetails.border,
    padding:         18,
    shadowColor:     colors.visitorDetails.shadowCard,
    shadowOffset:    { width: 0, height: 2 },
    shadowOpacity:   0.07,
    shadowRadius:    10,
    elevation:       3,
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
    backgroundColor: colors.visitorDetails.blueSoft,
    alignItems:      'center',
    justifyContent:  'center',
  },
  cardTitle: { fontSize: 15, fontWeight: '700', color: colors.visitorDetails.textDark, flex: 1 },

  fieldLabel: {
    fontSize:      10,
    fontWeight:    '700',
    color:         colors.visitorDetails.textLight,
    letterSpacing: 1.5,
    marginBottom:  10,
  },

  // ── Input ──
  inputWrap: {
    flexDirection:     'row',
    alignItems:        'center',
    backgroundColor:   colors.visitorDetails.inputBg,
    borderRadius:      14,
    borderWidth:       1.5,
    borderColor:       colors.visitorDetails.border,
    paddingHorizontal: 14,
    marginBottom:      14,
  },
  inputWrapFocused: {
    borderColor:     colors.visitorDetails.blue,
    backgroundColor: colors.visitorDetails.inputFocusedBg,
  },
  inputIcon: { marginRight: 10 },
  input:     { flex: 1, fontSize: 16, color: colors.visitorDetails.textDark, paddingVertical: 14 },
  clearBtn:  { padding: 4 },

  // ── Add button ──
  addBtn: {
    backgroundColor: colors.visitorDetails.blue,
    borderRadius:    14,
    height:          52,
    flexDirection:   'row',
    alignItems:      'center',
    justifyContent:  'center',
    gap:             8,
    shadowColor:     colors.visitorDetails.blue,
    shadowOffset:    { width: 0, height: 4 },
    shadowOpacity:   0.3,
    shadowRadius:    10,
    elevation:       6,
  },
  addBtnDisabled: {
    backgroundColor: colors.visitorDetails.addBtnDisabledBg,
    shadowOpacity:   0,
    elevation:       0,
  },
  addBtnText:         { fontSize: 16, fontWeight: '700', color: colors.white, letterSpacing: 0.3 },
  addBtnTextDisabled: { color: colors.visitorDetails.addBtnTextDisabled },

  // ── List section ──
  listSection: { flex: 1, paddingHorizontal: 14, paddingTop: 14 },
  listHeader: {
    flexDirection: 'row',
    alignItems:    'center',
    marginBottom:  10,
    gap:           10,
  },
  listHeaderTitle: { fontSize: 15, fontWeight: '700', color: colors.visitorDetails.textDark, flex: 1 },
  listBadge: {
    backgroundColor:   colors.visitorDetails.blueSoft,
    borderRadius:      20,
    paddingHorizontal: 10,
    paddingVertical:   4,
  },
  listBadgeText: { fontSize: 11, fontWeight: '700', color: colors.visitorDetails.blue },
  flatList:      { flex: 1 },
  itemDivider:   { height: 1, backgroundColor: colors.visitorDetails.border },

  // ── Order item ──
  orderItem: {
    flexDirection:     'row',
    alignItems:        'center',
    gap:               12,
    paddingVertical:   12,
    paddingHorizontal: 16,
    backgroundColor:   colors.visitorDetails.card,
    borderWidth:       1,
    borderColor:       colors.visitorDetails.border,
    borderRadius:      14,
    marginBottom:      8,
  },
  orderItemAvatar: {
    width:           40,
    height:          40,
    borderRadius:    20,
    backgroundColor: colors.visitorDetails.blueSoft,
    alignItems:      'center',
    justifyContent:  'center',
    borderWidth:     1,
    borderColor:     colors.visitorDetails.avatarBorder,
  },
  orderItemAvatarText: { fontSize: 17, fontWeight: '800', color: colors.visitorDetails.blue },
  orderItemInfo:       { flex: 1 },
  orderItemName:       { fontSize: 15, fontWeight: '600', color: colors.visitorDetails.textDark },
  orderItemSub:        { fontSize: 11, color: colors.visitorDetails.textLight, marginTop: 2 },

  // ── Remove button ──
  removeBtn: {
    width:           34,
    height:          34,
    borderRadius:    10,
    backgroundColor: colors.visitorDetails.removeBtnBg,
    alignItems:      'center',
    justifyContent:  'center',
    borderWidth:     1,
    borderColor:     colors.visitorDetails.removeBtnBorder,
  },

  // ── Empty state ──
  emptyWrap: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 8 },
  emptyIconWrap: {
    width:           64,
    height:          64,
    borderRadius:    32,
    backgroundColor: colors.visitorDetails.emptyIconBg,
    alignItems:      'center',
    justifyContent:  'center',
    marginBottom:    4,
  },
  emptyTitle: { fontSize: 15, fontWeight: '600', color: colors.visitorDetails.textMid },
  emptySub:   { fontSize: 12, color: colors.visitorDetails.textLight, textAlign: 'center' },

  // ── Confirm button ──
  confirmBtn: {
    backgroundColor: colors.visitorDetails.blue,
    borderRadius:    16,
    height:          54,
    flexDirection:   'row',
    alignItems:      'center',
    justifyContent:  'center',
    gap:             10,
    shadowColor:     colors.visitorDetails.blue,
    shadowOffset:    { width: 0, height: 5 },
    shadowOpacity:   0.3,
    shadowRadius:    12,
    elevation:       7,
    marginTop:       10,
    marginBottom:    24,
  },
  confirmBtnText: { fontSize: 15, fontWeight: '700', color: colors.white, letterSpacing: 0.3 },
});