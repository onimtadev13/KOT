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
   const nav          = useNavigation<any>();
  const device = useAppStore(state => state.device);
  const session = useAppStore(state => state.session);
  const setOrderContext = useAppStore(state => state.setOrderContext);

  const [visitorName, setVisitorName] = useState('');
  const [orderList, setOrderList] = useState<OrderEntry[]>([]);
  const [focused, setFocused] = useState(false);
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
          <Text style={S.navTitle}>Visitor Order</Text>
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
          <Ionicons name="walk" size={20} color={WHITE} />
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
              <Ionicons name="person-add-outline" size={15} color={BLUE} />
            </View>
            <Text style={S.cardTitle}>Add Visitor</Text>
          </View>

          <Text style={S.fieldLabel}>VISITOR NAME</Text>

          <View style={[S.inputWrap, focused && S.inputWrapFocused]}>
            <Ionicons
              name="person-outline"
              size={18}
              color={focused ? BLUE : TEXT_LIGHT}
              style={S.inputIcon}
            />
            <TextInput
              ref={inputRef}
              style={S.input}
              value={visitorName}
              onChangeText={setVisitorName}
              placeholder="Enter visitor name…"
              placeholderTextColor={TEXT_LIGHT}
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
                <Ionicons name="close-circle" size={18} color={TEXT_LIGHT} />
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
              color={visitorName.trim() ? WHITE : 'rgba(255,255,255,0.5)'}
            />
            <Text
              style={[
                S.addBtnText,
                !visitorName.trim() && S.addBtnTextDisabled,
              ]}
            >
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
              <Ionicons name="people-outline" size={30} color={TEXT_LIGHT} />
            </View>
            <Text style={S.emptyTitle}>No visitors added yet</Text>
            <Text style={S.emptySub}>
              Type a name above and tap Add to Order
            </Text>
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
                    <Ionicons name="trash-outline" size={16} color="#EF4444" />
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
              <Ionicons
                name="checkmark-circle-outline"
                size={20}
                color={WHITE}
              />
              <Text style={S.confirmBtnText}>
                Confirm · {orderList.length} visitor
                {orderList.length > 1 ? 's' : ''} → Menu
              </Text>
            </TouchableOpacity>
          </>
        )}
      </View>
    </View>
  );
}

const PURPLE_DEEP = '#3B0F8C';
const BLUE = '#0369A1';
const BLUE_SOFT = '#E0F2FE';
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
  countBadge: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: 'rgba(255,255,255,0.25)',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1.5,
    borderColor: 'rgba(255,255,255,0.4)',
  },
  countBadgeText: { fontSize: 13, fontWeight: '800', color: WHITE },
  inputSection: { paddingHorizontal: 14, paddingTop: 14 },
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
    backgroundColor: BLUE_SOFT,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cardTitle: { fontSize: 15, fontWeight: '700', color: TEXT_DARK, flex: 1 },
  fieldLabel: {
    fontSize: 10,
    fontWeight: '700',
    color: TEXT_LIGHT,
    letterSpacing: 1.5,
    marginBottom: 10,
  },
  inputWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F9FAFB',
    borderRadius: 14,
    borderWidth: 1.5,
    borderColor: BORDER,
    paddingHorizontal: 14,
    marginBottom: 14,
  },
  inputWrapFocused: { borderColor: BLUE, backgroundColor: '#F0F9FF' },
  inputIcon: { marginRight: 10 },
  input: { flex: 1, fontSize: 16, color: TEXT_DARK, paddingVertical: 14 },
  clearBtn: { padding: 4 },
  addBtn: {
    backgroundColor: BLUE,
    borderRadius: 14,
    height: 52,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    shadowColor: BLUE,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 10,
    elevation: 6,
  },
  addBtnDisabled: {
    backgroundColor: '#BAE6FD',
    shadowOpacity: 0,
    elevation: 0,
  },
  addBtnText: {
    fontSize: 16,
    fontWeight: '700',
    color: WHITE,
    letterSpacing: 0.3,
  },
  addBtnTextDisabled: { color: 'rgba(255,255,255,0.6)' },
  listSection: { flex: 1, paddingHorizontal: 14, paddingTop: 14 },
  listHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
    gap: 10,
  },
  listHeaderTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: TEXT_DARK,
    flex: 1,
  },
  listBadge: {
    backgroundColor: BLUE_SOFT,
    borderRadius: 20,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  listBadgeText: { fontSize: 11, fontWeight: '700', color: BLUE },
  flatList: { flex: 1 },
  itemDivider: { height: 1, backgroundColor: BORDER },
  orderItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 12,
    paddingHorizontal: 16,
    backgroundColor: CARD,
    borderWidth: 1,
    borderColor: BORDER,
    borderRadius: 14,
    marginBottom: 8,
  },
  orderItemAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: BLUE_SOFT,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#BAE6FD',
  },
  orderItemAvatarText: { fontSize: 17, fontWeight: '800', color: BLUE },
  orderItemInfo: { flex: 1 },
  orderItemName: { fontSize: 15, fontWeight: '600', color: TEXT_DARK },
  orderItemSub: { fontSize: 11, color: TEXT_LIGHT, marginTop: 2 },
  removeBtn: {
    width: 34,
    height: 34,
    borderRadius: 10,
    backgroundColor: '#FEF2F2',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#FECACA',
  },
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
  confirmBtn: {
    backgroundColor: BLUE,
    borderRadius: 16,
    height: 54,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    shadowColor: BLUE,
    shadowOffset: { width: 0, height: 5 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 7,
    marginTop: 10,
    marginBottom: 24,
  },
  confirmBtnText: {
    fontSize: 15,
    fontWeight: '700',
    color: WHITE,
    letterSpacing: 0.3,
  },
  iconBtn: {
    width: 36, height: 36, borderRadius: 10,
    backgroundColor: 'rgba(255,255,255,0.15)',
    alignItems: 'center', justifyContent: 'center',
  },
});
