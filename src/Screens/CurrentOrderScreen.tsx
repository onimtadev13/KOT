import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  StatusBar,
  Platform,
  Modal,
  Switch,
  Alert,
  Dimensions,
} from 'react-native';
import { Picker } from '@react-native-picker/picker';
import { Ionicons } from '@react-native-vector-icons/ionicons';
import { useAppStore, OrderItem } from '../Store/store';
import { DrawerActions, useNavigation } from '@react-navigation/native';
import { loadManagers, ManagerResult, submitOrder, deviceCheck } from '../Api/api';

const SCREEN_HEIGHT = Dimensions.get('window').height;

// const MANAGERS = [
//   { label: 'Select a Manager', value: '' },
//   { label: 'Manager — Ruwan Silva', value: 'ruwan' },
//   { label: 'Manager — Amali Fernando', value: 'amali' },
//   { label: 'Manager — Thilak Bandara', value: 'thilak' },
//   { label: 'Manager — Nimal Perera', value: 'nimal' },
// ];

const ORDER_TYPES = ['Free', 'In House', 'Paid', 'Gate Pass'];

export default function CurrentOrderScreen({
  navigation,
}: {
  navigation: any;
}) {
  const nav = useNavigation<any>();
  const device = useAppStore(state => state.device);
  const session = useAppStore(state => state.session);
  const orderContext = useAppStore(state => state.orderContext);
  const orderItems = useAppStore(state => state.orderItems);
  const orderTotal = useAppStore(state => state.orderTotal);
  const removeOrderItem = useAppStore(state => state.removeOrderItem);
  const updateOrderQty = useAppStore(state => state.updateOrderQty);

  const [approved, setApproved] = useState(false);
  const [orderModal, setOrderModal] = useState(false);
  const [butlerEnabled, setButlerEnabled] = useState(false);

  const [kotModal, setKotModal] = useState(false);
  const [kotReqBy, setKotReqBy] = useState('');
  const [kotOrderTypes, setKotOrderTypes] = useState<string[]>([]);

  const [managers,        setManagers]        = useState<{ label: string; value: string }[]>([]);
const [managersLoading, setManagersLoading] = useState(false);

const [orderResponse, setOrderResponse] = useState<any>(null);
const [orderResponseModal, setOrderResponseModal] = useState(false);
const [orderLoading, setOrderLoading] = useState(false);



  const total = orderTotal();
  const ctx = orderContext;

  function formatPrice(n: number): string {
    return `LKR ${n.toLocaleString('en-US', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    })}`;
  }

  function fmt(val: string | number | null | undefined): string {
    if (val === null || val === undefined || val === '') return '—';
    const n = Number(val);
    if (isNaN(n)) return String(val);
    return n.toLocaleString('en-US', {
      minimumFractionDigits: 0,
      maximumFractionDigits: 2,
    });
  }

  // ── Order context derived values ───────────────────────────────────────────
  const guestName = (() => {
    if (ctx.type === 'guest') return ctx.guestName ?? '—';
    if (ctx.type === 'visitor') return ctx.visitorName ?? '—';
    if (ctx.type === 'executive_staff') return ctx.staffName ?? '—';
    if (ctx.type === 'pits') return ctx.memberName ?? '—';
    return null;
  })();

  const guestId = (() => {
    if (ctx.type === 'guest') return ctx.guestId ?? '—';
    if (ctx.type === 'executive_staff') return ctx.staffCode ?? '—';
    if (ctx.type === 'pits') return ctx.memberId ?? '—';
    return null;
  })();

  const guestIdLabel = (() => {
    if (ctx.type === 'guest') return 'Guest ID';
    if (ctx.type === 'executive_staff') return 'Staff Code';
    if (ctx.type === 'pits') return 'Member ID';
    return '';
  })();

  const guestNameLabel = (() => {
    if (ctx.type === 'guest') return 'Guest Name';
    if (ctx.type === 'visitor') return 'Visitor Name';
    if (ctx.type === 'executive_staff') return 'Staff Name';
    if (ctx.type === 'pits') return 'Member Name';
    return 'Name';
  })();

  const guestAccent = (() => {
    if (ctx.type === 'pits') return '#0c0d0c';
    if (ctx.type === 'executive_staff') return '#0F766E';
    if (ctx.type === 'visitor') return '#0369A1';
    return PURPLE;
  })();

  const guestBg = (() => {
    if (ctx.type === 'pits') return '#FEF3C7';
    if (ctx.type === 'executive_staff') return '#CCFBF1';
    if (ctx.type === 'visitor') return '#E0F2FE';
    return PURPLE_SOFT;
  })();

  const guestTypeLabel = (() => {
    if (ctx.type === 'pits') return 'PIT MEMBER';
    if (ctx.type === 'guest') return 'GUEST';
    if (ctx.type === 'visitor') return 'VISITOR';
    if (ctx.type === 'executive_staff') return 'EXECUTIVE STAFF';
    return '';
  })();

  const guestIcon = (() => {
    if (ctx.type === 'pits') return 'card-outline';
    if (ctx.type === 'executive_staff') return 'briefcase-outline';
    if (ctx.type === 'visitor') return 'walk-outline';
    return 'person-circle-outline';
  })();

  const unit = String(device?.Device_Id ?? '—');
  const operator = session?.Emp_Name ?? '—';
  const steward = session?.StewardName ?? '—';
  const table = ctx.tableCode ?? '—';
  const drop = fmt((ctx as any).currentDrop);
  const points = fmt((ctx as any).points);
  const avgBet = fmt((ctx as any).avgBet);

  const detailFields = [
    { label: 'Unit', value: unit, icon: 'location-outline', color: '#6C1FC9' },
    {
      label: 'Operator',
      value: operator,
      icon: 'key-outline',
      color: '#0F766E',
    },
    {
      label: 'Steward',
      value: steward,
      icon: 'people-outline',
      color: '#B45309',
    },
    { label: 'Table', value: table, icon: 'easel-outline', color: '#1D4ED8' },
    {
      label: 'Current Drop',
      value: drop,
      icon: 'trending-down-outline',
      color: '#B91C1C',
    },
    { label: 'Points', value: points, icon: 'star-outline', color: '#92400E' },
    {
      label: 'Avg Bet',
      value: avgBet,
      icon: 'bar-chart-outline',
      color: '#0369A1',
    },
  ];

  // ── KOT derived ────────────────────────────────────────────────────────────
  const kotMemberInitial = (() => {
    const name =
      ctx.type === 'guest'
        ? ctx.guestName
        : ctx.type === 'visitor'
        ? ctx.visitorName
        : ctx.type === 'executive_staff'
        ? ctx.staffName
        : ctx.type === 'pits'
        ? ctx.memberName
        : '';
    return name ? name.charAt(0).toUpperCase() : '?';
  })();

  const kotMemberName = (() => {
    if (ctx.type === 'guest') return ctx.guestName ?? '—';
    if (ctx.type === 'visitor') return ctx.visitorName ?? '—';
    if (ctx.type === 'executive_staff') return ctx.staffName ?? '—';
    if (ctx.type === 'pits') return ctx.memberName ?? '—';
    return '—';
  })();

  const kotMemberId = (() => {
    if (ctx.type === 'guest') return ctx.guestId ?? null;
    if (ctx.type === 'executive_staff') return ctx.staffCode ?? null;
    if (ctx.type === 'pits') return ctx.memberId ?? null;
    return null;
  })();

  useEffect(() => {
  if (!kotModal) return;   // only fetch when modal opens

  async function fetchManagers() {
    setManagersLoading(true);
    try {
      const deviceId  = device?.Device_Id  ?? 0;
      const docNo     = device?.Doc_No     ?? '';
      const loginUser = session?.Emp_Name  ?? '';

      const results = await loadManagers(deviceId, docNo, loginUser);

      const formatted = [
        { label: 'Select a Manager', value: '' },
        ...results.map(m => ({
      label: m.Managernames,
    value: m.Managernames,
        })),
      ];
      setManagers(formatted);
    } catch (e) {
      console.error('[MANAGERS] Failed to load:', e);
      setManagers([{ label: 'Select a Manager', value: '' }]);
    } finally {
      setManagersLoading(false);
    }
  }

  fetchManagers();
}, [kotModal]);   

  // ── Handlers ───────────────────────────────────────────────────────────────
  function handleGoToOrder() {
    if (orderItems.length === 0) return;
    setOrderModal(true);
  }

async function handleOrder() {
  setOrderModal(false);

  const mid = (() => {
    if (ctx.type === 'guest')           return ctx.guestId   ?? '';
    if (ctx.type === 'executive_staff') return ctx.staffCode ?? '';
    if (ctx.type === 'pits')            return ctx.memberId  ?? '';
    return '';
  })();

  const mName = (() => {
    if (ctx.type === 'guest')           return ctx.guestName   ?? '';
    if (ctx.type === 'visitor')         return ctx.visitorName ?? '';
    if (ctx.type === 'executive_staff') return ctx.staffName   ?? '';
    if (ctx.type === 'pits')            return ctx.memberName  ?? '';
    return '';
  })();

  // ── Step 1: Submit order ───────────────────────────────────────────────────
  const result = await submitOrder({
    docNo:       device?.Doc_No       ?? '',
    steward:     session?.StewardName ?? '',
    mid,
    deviceId:    device?.Device_Id    ?? 0,
    loginUser:   session?.Emp_Name    ?? '',
    tableName:   ctx.tableCode        ?? '',
    mName,
    currentDrop: (ctx as any).currentDrop ?? '',
    points:      (ctx as any).points      ?? '',
    avgBet:      (ctx as any).avgBet      ?? '',
    totalDrop:   (ctx as any).totalDrop   ?? '',
    butler:      butlerEnabled,
  });

  console.log('[ORDER] Submit response:', JSON.stringify(result, null, 2));

  if (!result.success || !result.data?.strRturnRes) {
    console.warn('[ORDER] Submit failed, skipping print.');
    return;
  }

  // ── Step 2: Print KOT ─────────────────────────────────────────────────────
  const row = result.data?.CommonResult?.Table?.[0];
  if (!row) {
    console.warn('[ORDER] No table row in response, skipping print.');
    return;
  }

  const printPayload = {
    Loca:             '01',
    Oni_ApprovedBy:   row.ShiftID          ?? 'DAY',
    Oni_Customer:     row.GuestID          ?? mid,
    Oni_CustomerName: row.GuestName        ?? mName,
    Oni_Operator:     row.LoginBy          ?? session?.Emp_Name ?? '',
    Oni_PintNo:       row.Pit_Name         ?? 'XXXX',
    Oni_Room:         row.GuestID          ?? mid,
    Oni_Status:       'T',
    PrintBillReceipt: row.ReturnReceip     ?? '',
    Unit:             String(device?.Device_Id ?? '99'),
    con:              '1',
    strDulicateType:  1,
    strT_Date:        row.BillDate         ?? '',
    strT_Time:        row.BillTime?.trim() ?? '',
  };

  console.log('[PRINT] Payload:', JSON.stringify(printPayload, null, 2));

  try {
    const printResponse = await fetch('http://192.168.0.123:5555/api/Print/Kot', {
      method: 'POST',
      headers: {
        'content-type':  'application/json',
        'cache-control': 'no-cache',
      },
      body: JSON.stringify(printPayload),
    });

    console.log('[PRINT] HTTP Status:', printResponse.status);

    const printText = await printResponse.text();
    console.log('[PRINT] Raw response:', printText);

    let printJson: any = null;
    try {
      printJson = JSON.parse(printText);
      console.log('[PRINT] Parsed response:', JSON.stringify(printJson, null, 2));
    } catch {
      console.log('[PRINT] Response is not JSON:', printText);
    }

    // ── Step 3: Re-check device if print succeeded ─────────────────────────
    if (printJson?.strRturnRes === true) {
      console.log('[ORDER] Print succeeded. Re-checking device...');
      const deviceResult = await deviceCheck(device?.UniqueId ?? '');
      console.log('[DEVICE RECHECK] Result:', JSON.stringify(deviceResult, null, 2));

      Alert.alert(
        'Print Done',
        'Order has been printed successfully.',
        [
          {
            text: 'OK',
            onPress: () => nav.navigate('Login'),
          },
        ],
        { cancelable: false },
      );
    } else {
      console.warn('[ORDER] Print response was not true, skipping device recheck.');
    }

  } catch (printError: any) {
    console.error('[PRINT] Error:', printError?.message ?? printError);
  }
}
  function handlePaid() {
    setOrderModal(false);
    setKotReqBy('');
    setKotOrderTypes([]);
    // Small delay so the first modal fully closes before KOT opens
    setTimeout(() => setKotModal(true), 300);
  }

  function toggleOrderType(type: string) {
    setKotOrderTypes(prev =>
      prev.includes(type) ? prev.filter(t => t !== type) : [...prev, type],
    );
  }

  function handleKotSend() {
    if (!kotReqBy) {
      Alert.alert('Required', 'Please select a Manager for Req By.');
      return;
    }
    console.log('[KOT] Send —', {
      member: kotMemberName,
      memberId: kotMemberId,
      reqBy: kotReqBy,
      orderTypes: kotOrderTypes,
      total,
    });
    setKotModal(false);
    // TODO: call your KOT submit API here
  }

  // ── Detail cell ────────────────────────────────────────────────────────────
  function DetailCell({
    icon,
    color,
    label,
    value,
  }: {
    icon: string;
    color: string;
    label: string;
    value: string;
  }) {
    return (
      <View style={S.detailCell}>
        <View style={[S.detailIcon, { backgroundColor: color + '18' }]}>
          <Ionicons name={icon as any} size={14} color={color} />
        </View>
        <View style={S.detailTextStack}>
          <Text style={S.detailLabel}>{label}</Text>
          <Text style={[S.detailValue, { color }]} numberOfLines={1}>
            {value}
          </Text>
        </View>
      </View>
    );
  }

  // ── Render ─────────────────────────────────────────────────────────────────
  return (
    <View style={S.flex}>
      <StatusBar barStyle="light-content" backgroundColor={PURPLE_DEEP} />

      {/* ── Nav bar ── */}
      <View style={S.navBar}>
        <TouchableOpacity
          style={S.iconBtn}
          onPress={() => nav.dispatch(DrawerActions.openDrawer())}
          activeOpacity={0.75}
        >
          <Ionicons name="menu-outline" size={22} color="#fff" />
        </TouchableOpacity>
        <View style={S.navTitleWrap}>
          <Text style={S.navTitle}>Current Order</Text>
          <Text style={S.navSub}>KITCHEN ORDER TICKET</Text>
        </View>
        {device?.Doc_No ? (
          <View style={S.docChip}>
            <Text style={S.docChipText}>#{device.Doc_No}</Text>
          </View>
        ) : (
          <View style={{ width: 60 }} />
        )}
      </View>

      <ScrollView
        style={S.scroll}
        contentContainerStyle={S.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* ── Identity + Order Details card ── */}
        {!!ctx.type && (
          <View style={[S.combinedCard, { borderLeftColor: guestAccent }]}>
            <View
              style={[S.guestBand, { backgroundColor: guestAccent + '14' }]}
            >
              <View style={[S.guestBandIcon, { backgroundColor: guestBg }]}>
                <Ionicons
                  name={guestIcon as any}
                  size={18}
                  color={guestAccent}
                />
              </View>
              <Text style={[S.guestTypeLabel, { color: guestAccent }]}>
                {guestTypeLabel}
              </Text>
            </View>

            <View
              style={[
                S.guestBody,
                { borderBottomWidth: 1, borderBottomColor: guestAccent + '33' },
              ]}
            >
              <View style={S.guestNameCol}>
                <Text style={S.guestFieldLabel}>{guestNameLabel}</Text>
                <View style={S.guestNameRow}>
                  <Ionicons
                    name="person-outline"
                    size={17}
                    color={guestAccent}
                  />
                  <Text
                    style={[S.guestName, { color: guestAccent }]}
                    numberOfLines={1}
                    adjustsFontSizeToFit
                  >
                    {guestName}
                  </Text>
                </View>
              </View>
              {!!guestId && (
                <>
                  <View style={S.guestDivider} />
                  <View style={S.guestIdCol}>
                    <Text style={S.guestFieldLabel}>{guestIdLabel}</Text>
                    <View
                      style={[
                        S.guestIdChip,
                        {
                          backgroundColor: guestBg,
                          borderColor: guestAccent + '55',
                        },
                      ]}
                    >
                      <Ionicons
                        name="card-outline"
                        size={13}
                        color={guestAccent}
                      />
                      <Text style={[S.guestIdText, { color: guestAccent }]}>
                        {guestId}
                      </Text>
                    </View>
                  </View>
                </>
              )}
            </View>

            <View
              style={[
                S.sectionHeader,
                { borderBottomColor: guestAccent + '33', paddingTop: 12 },
              ]}
            >
              <View
                style={[
                  S.sectionIconWrap,
                  { backgroundColor: guestAccent + '18' },
                ]}
              >
                <Ionicons
                  name="information-circle-outline"
                  size={16}
                  color={guestAccent}
                />
              </View>
              <Text style={[S.sectionTitle, { color: guestAccent }]}>
                Order Details
              </Text>
            </View>

            <View style={S.detailsGrid}>
              {detailFields.map((f, i) => (
                <DetailCell
                  key={i}
                  icon={f.icon}
                  color={f.color}
                  label={f.label}
                  value={f.value}
                />
              ))}
              <View style={S.detailCell}>
                <View
                  style={[
                    S.detailIcon,
                    { backgroundColor: approved ? '#DCFCE7' : '#F3F4F6' },
                  ]}
                >
                  <Ionicons
                    name={
                      approved ? 'checkmark-circle' : 'radio-button-off-outline'
                    }
                    size={14}
                    color={approved ? GREEN : TEXT_LIGHT}
                  />
                </View>
                <View style={S.detailTextStack}>
                  <Text style={S.detailLabel}>Approve</Text>
                  <TouchableOpacity
                    onPress={() => setApproved(p => !p)}
                    activeOpacity={0.75}
                  >
                    <View
                      style={[S.approveToggle, approved && S.approveToggleOn]}
                    >
                      <Text
                        style={[
                          S.approveToggleText,
                          approved && S.approveToggleTextOn,
                        ]}
                      >
                        {approved ? 'Yes' : 'No'}
                      </Text>
                    </View>
                  </TouchableOpacity>
                </View>
              </View>
            </View>
          </View>
        )}

        {/* ── Order Items table ── */}
        <View style={S.section}>
          <View style={S.sectionHeader}>
            <View style={S.sectionIconWrap}>
              <Ionicons name="receipt-outline" size={16} color={PURPLE} />
            </View>
            <Text style={S.sectionTitle}>Order Items</Text>
            <View style={S.itemCountBadge}>
              <Text style={S.itemCountText}>
                {orderItems.length} item{orderItems.length !== 1 ? 's' : ''}
              </Text>
            </View>
          </View>

          {orderItems.length === 0 ? (
            <View style={S.emptyItems}>
              <Ionicons name="cart-outline" size={28} color={TEXT_LIGHT} />
              <Text style={S.emptyItemsText}>No items added yet</Text>
            </View>
          ) : (
            <View style={S.table}>
              <View style={[S.tableRow, S.tableHeaderRow]}>
                <Text style={[S.tableHeaderCell, S.colProduct]}>Product</Text>
                <Text style={[S.tableHeaderCell, S.colPrice]}>Price</Text>
                <Text style={[S.tableHeaderCell, S.colQty]}>Qty</Text>
                <Text style={[S.tableHeaderCell, S.colAmount]}>Amount</Text>
                <View style={S.colAction} />
              </View>

              {orderItems.map((item: OrderItem, idx: number) => {
                const amount = item.Selling_Price * item.Qty;
                const isLast = idx === orderItems.length - 1;
                return (
                  <View
                    key={item.Prod_Code + idx}
                    style={[S.tableRow, !isLast && S.tableRowDivider]}
                  >
                    <Text
                      style={[S.tableCell, S.colProduct, S.prodNameCell]}
                      numberOfLines={2}
                    >
                      {item.Prod_Name}
                    </Text>
                    <Text style={[S.tableCell, S.colPrice]}>
                      {item.Selling_Price.toLocaleString()}
                    </Text>
                    <View style={[S.colQty, S.qtyCell]}>
                      <TouchableOpacity
                        style={S.qtyBtn}
                        onPress={() =>
                          updateOrderQty(item.Prod_Code, item.Qty - 1)
                        }
                      >
                        <Ionicons name="remove" size={12} color={PURPLE} />
                      </TouchableOpacity>
                      <Text style={S.qtyValue}>{item.Qty}</Text>
                      <TouchableOpacity
                        style={S.qtyBtn}
                        onPress={() =>
                          updateOrderQty(item.Prod_Code, item.Qty + 1)
                        }
                      >
                        <Ionicons name="add" size={12} color={PURPLE} />
                      </TouchableOpacity>
                    </View>
                    <Text style={[S.tableCell, S.colAmount, S.amountCell]}>
                      {amount.toLocaleString()}
                    </Text>
                    <TouchableOpacity
                      style={[S.colAction, S.deleteBtn]}
                      onPress={() => removeOrderItem(item.Prod_Code)}
                    >
                      <Ionicons
                        name="trash-outline"
                        size={14}
                        color="#EF4444"
                      />
                    </TouchableOpacity>
                  </View>
                );
              })}

              <View style={S.totalRow}>
                <Text style={S.totalLabel}>Total Amount</Text>
                <Text style={S.totalValue}>{formatPrice(total)}</Text>
              </View>
            </View>
          )}
        </View>
      </ScrollView>

      {/* ── Footer ── */}
      <View style={S.footer}>
        <View style={S.footerTotal}>
          <Text style={S.footerTotalLabel}>TOTAL</Text>
          <Text style={S.footerTotalValue}>{formatPrice(total)}</Text>
        </View>
        <TouchableOpacity
          style={[S.goBtn, orderItems.length === 0 && S.goBtnDisabled]}
          onPress={handleGoToOrder}
          disabled={orderItems.length === 0}
          activeOpacity={0.85}
        >
          <Text style={S.goBtnText}>Go To Order</Text>
          <Ionicons name="arrow-forward-circle" size={20} color={WHITE} />
        </TouchableOpacity>
      </View>

      {/* ══════════════════════════════════════════════════════════════════
          ORDER MODAL
      ══════════════════════════════════════════════════════════════════ */}
      <Modal
        visible={orderModal}
        transparent
        animationType="slide"
        onRequestClose={() => setOrderModal(false)}
      >
        <View style={S.modalOverlay}>
          <View style={S.modalCard}>
            <View style={S.modalHeader}>
              <View style={S.modalHeaderIconWrap}>
                <Ionicons name="receipt-outline" size={20} color={PURPLE} />
              </View>
              <Text style={S.modalTitle}>Order</Text>
              <TouchableOpacity
                style={S.modalCloseBtn}
                onPress={() => setOrderModal(false)}
                activeOpacity={0.7}
              >
                <Ionicons name="close" size={20} color={TEXT_MID} />
              </TouchableOpacity>
            </View>

            <View style={S.modalTotalRow}>
              <Text style={S.modalTotalLabel}>Total Amount</Text>
              <Text style={S.modalTotalValue}>{formatPrice(total)}</Text>
            </View>

            <View style={S.modalDivider} />

            <View style={S.modalBtnRow}>
              <TouchableOpacity
                style={[S.modalBtn, S.btnOrder]}
                onPress={handleOrder}
                activeOpacity={0.85}
              >
                <Ionicons
                  name="checkmark-circle-outline"
                  size={22}
                  color={WHITE}
                />
                <Text style={S.modalBtnText}>Order</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[S.modalBtn, S.btnPaid]}
                onPress={handlePaid}
                activeOpacity={0.85}
              >
                <Ionicons name="cash-outline" size={22} color={WHITE} />
                <Text style={S.modalBtnText}>Paid</Text>
              </TouchableOpacity>
            </View>

            <View style={S.modalDivider} />

            <View style={S.butlerRow}>
              <View style={S.butlerLeft}>
                <View style={S.butlerIconWrap}>
                  <Ionicons
                    name="person-circle-outline"
                    size={20}
                    color={butlerEnabled ? PURPLE : TEXT_LIGHT}
                  />
                </View>
                <View>
                  <Text style={S.butlerLabel}>BUTLER</Text>
                  <Text style={S.butlerSub}>
                    {butlerEnabled
                      ? 'Butler service enabled'
                      : 'Butler service disabled'}
                  </Text>
                </View>
              </View>
              <Switch
                value={butlerEnabled}
                onValueChange={setButlerEnabled}
                trackColor={{ false: '#E5E7EB', true: PURPLE_SOFT }}
                thumbColor={butlerEnabled ? PURPLE : '#D1D5DB'}
                ios_backgroundColor="#E5E7EB"
              />
            </View>
          </View>
        </View>
      </Modal>

      {/* ══════════════════════════════════════════════════════════════════
          KOT MODAL — full-height bottom sheet
          Fix: sheet uses a hard pixel height from SCREEN_HEIGHT so it
          never collapses regardless of content size or flex behaviour.
      ══════════════════════════════════════════════════════════════════ */}
      <Modal
        visible={kotModal}
        transparent
        animationType="slide"
        statusBarTranslucent
        onRequestClose={() => setKotModal(false)}
      >
        <View style={K.overlay}>
          {/* Tap-outside-to-close backdrop */}
          <TouchableOpacity
            style={StyleSheet.absoluteFillObject}
            activeOpacity={1}
            onPress={() => setKotModal(false)}
          />

          {/* Sheet — fixed pixel height, always fills 92% of screen */}
          <View style={K.sheet}>
            {/* Purple header */}
            <View style={K.header}>
              <View>
                <Text style={K.headerTitle}>KOT</Text>
                <Text style={K.headerSub}>In House / Gate Pass</Text>
              </View>
              <TouchableOpacity
                style={K.closeBtn}
                onPress={() => setKotModal(false)}
                activeOpacity={0.75}
              >
                <Ionicons name="close" size={22} color="#fff" />
              </TouchableOpacity>
            </View>

            {/* Scrollable body — fills all remaining sheet height */}
            <ScrollView
              style={K.scrollArea}
              contentContainerStyle={K.scrollContent}
              showsVerticalScrollIndicator={false}
              keyboardShouldPersistTaps="handled"
              bounces={false}
            >
              {/* Total */}
              <View style={K.totalBlock}>
                <Text style={K.totalLabel}>Total Amount</Text>
                <Text style={K.totalValue}>{formatPrice(total)}</Text>
              </View>

              <View style={K.divider} />

              {/* Member card */}
              <View>
                <Text style={K.sectionLabel}>Member Details</Text>
                <View style={K.memberCard}>
                  <View style={K.memberTop}>
                    <View style={K.memberAvatar}>
                      <Text style={K.memberAvatarText}>{kotMemberInitial}</Text>
                    </View>
                    <View style={K.memberInfo}>
                      <View style={K.memberNameRow}>
                        <Text
                          style={K.memberName}
                          numberOfLines={1}
                          adjustsFontSizeToFit
                        >
                          {kotMemberName}
                        </Text>
                        <View style={K.statusBadge}>
                          <View style={K.statusDot} />
                          <Text style={K.statusText}>Active</Text>
                        </View>
                      </View>
                      {!!kotMemberId && (
                        <View style={K.memberIdChip}>
                          <Ionicons
                            name="card-outline"
                            size={13}
                            color={PURPLE}
                          />
                          <Text style={K.memberIdText}>{kotMemberId}</Text>
                        </View>
                      )}
                    </View>
                  </View>

                  <View style={K.memberMetaRow}>
                    {!!ctx.guestId && (
                      <View style={K.memberMeta}>
                        <Ionicons
                          name="card-outline"
                          size={14}
                          color="#7C3AED"
                        />
                        <Text style={K.memberMetaText}>{ctx.guestId}</Text>
                      </View>
                    )}
                    {!!ctx.tableCode && (
                      <View style={K.memberMeta}>
                        <Ionicons
                          name="easel-outline"
                          size={14}
                          color="#7C3AED"
                        />
                        <Text style={K.memberMetaText}>
                          Table {ctx.tableCode}
                        </Text>
                      </View>
                    )}
                    {!!ctx.pitName && (
                      <View style={K.memberMeta}>
                        <Ionicons
                          name="location-outline"
                          size={14}
                          color="#7C3AED"
                        />
                        <Text style={K.memberMetaText}>Pit {ctx.pitName}</Text>
                      </View>
                    )}
                  </View>
                </View>
              </View>

              <View style={K.divider} />

            
              {/* Req By */}
<View>
  <View style={K.fieldLabelRow}>
    <Text style={K.fieldLabel}>Req By</Text>
    <View style={K.reqBadge}>
      <Text style={K.reqBadgeText}>Required</Text>
    </View>
  </View>

  {managersLoading ? (
    <View style={[K.pickerWrap, { justifyContent: 'center', alignItems: 'center', height: 54 }]}>
      <Text style={{ color: TEXT_LIGHT, fontSize: 13, fontWeight: '600' }}>
        Loading managers…
      </Text>
    </View>
  ) : (
    <View style={[K.pickerWrap, !kotReqBy && K.pickerWrapEmpty]}>
      <Picker
        selectedValue={kotReqBy}
        onValueChange={val => setKotReqBy(val)}
        style={K.picker}
        dropdownIconColor="#6B7280"
      >
        {managers.map(m => (
          <Picker.Item
            key={m.value}
            label={m.label}
            value={m.value}
            color={m.value === '' ? TEXT_LIGHT : TEXT_DARK}
          />
        ))}
      </Picker>
    </View>
  )}
</View>

              <View style={K.divider} />

              {/* Order type checkboxes 2×2 */}
              <View>
                <Text style={K.sectionLabel}>Order Type</Text>
                <View style={K.checkGrid}>
                  {ORDER_TYPES.map(type => {
                    const checked = kotOrderTypes.includes(type);
                    return (
                      <TouchableOpacity
                        key={type}
                        style={[K.checkTile, checked && K.checkTileOn]}
                        onPress={() => toggleOrderType(type)}
                        activeOpacity={0.8}
                      >
                        <View style={[K.checkBox, checked && K.checkBoxOn]}>
                          {checked && (
                            <Ionicons name="checkmark" size={15} color="#fff" />
                          )}
                        </View>
                        <Text style={[K.checkLabel, checked && K.checkLabelOn]}>
                          {type}
                        </Text>
                      </TouchableOpacity>
                    );
                  })}
                </View>
              </View>

              {/* Send / Cancel */}
              <View style={K.actionRow}>
                <TouchableOpacity
                  style={[K.btnSend, !kotReqBy && K.btnSendDisabled]}
                  onPress={handleKotSend}
                  activeOpacity={0.85}
                >
                  <Ionicons
                    name="checkmark-circle-outline"
                    size={22}
                    color="#fff"
                  />
                  <Text style={K.btnSendText}>Send</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={K.btnCancel}
                  onPress={() => setKotModal(false)}
                  activeOpacity={0.85}
                >
                  <Text style={K.btnCancelText}>Cancel</Text>
                </TouchableOpacity>
              </View>
            </ScrollView>
          </View>
        </View>
      </Modal>
    </View>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Tokens
// ─────────────────────────────────────────────────────────────────────────────
const PURPLE_DEEP = '#3B0F8C';
const PURPLE = '#6C1FC9';
const PURPLE_SOFT = '#F3EEFF';
const GREEN = '#16A34A';
const WHITE = '#FFFFFF';
const BG = '#F5F6FA';
const CARD = '#FFFFFF';
const BORDER = '#EDF0F4';
const TEXT_DARK = '#1A1D2E';
const TEXT_MID = '#292b2f';
const TEXT_LIGHT = '#B0B8C1';

// ─────────────────────────────────────────────────────────────────────────────
// Main screen styles
// ─────────────────────────────────────────────────────────────────────────────
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
  iconBtn: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: 'rgba(255,255,255,0.15)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  navTitleWrap: { flex: 1, alignItems: 'center' },
  navTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: WHITE,
    letterSpacing: 0.8,
  },
  navSub: {
    fontSize: 9,
    fontWeight: '600',
    color: 'rgba(255,255,255,0.55)',
    letterSpacing: 2,
    marginTop: 2,
  },
  docChip: {
    backgroundColor: 'rgba(255,255,255,0.18)',
    borderRadius: 20,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.28)',
  },
  docChipText: { fontSize: 11, fontWeight: '700', color: WHITE },
  scroll: { flex: 1 },
  scrollContent: { padding: 14, paddingBottom: 24 },
  combinedCard: {
    backgroundColor: '#FEF9EE',
    borderRadius: 18,
    borderWidth: 1,
    borderColor: BORDER,
    borderLeftWidth: 4,
    marginBottom: 14,
    overflow: 'hidden',
    shadowColor: '#9CA3AF',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 10,
    elevation: 3,
  },
  guestBand: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingHorizontal: 14,
    paddingVertical: 10,
  },
  guestBandIcon: {
    width: 34,
    height: 34,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  guestTypeLabel: { fontSize: 10, fontWeight: '800', letterSpacing: 1.8 },
  guestBody: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingTop: 2,
    paddingBottom: 18,
    gap: 14,
  },
  guestNameCol: { flex: 1 },
  guestIdCol: { alignItems: 'flex-end' },
  guestFieldLabel: {
    fontSize: 10,
    fontWeight: '700',
    color: TEXT_LIGHT,
    letterSpacing: 0.5,
    textTransform: 'uppercase',
    marginBottom: 6,
  },
  guestNameRow: { flexDirection: 'row', alignItems: 'center', gap: 7 },
  guestName: { fontSize: 18, fontWeight: '900', letterSpacing: -0.3, flex: 1 },
  guestDivider: { width: 1, height: 46, backgroundColor: BORDER },
  guestIdChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 20,
    borderWidth: 1,
  },
  guestIdText: { fontSize: 14, fontWeight: '800', letterSpacing: 0.1 },
  section: {
    backgroundColor: CARD,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: BORDER,
    marginBottom: 14,
    overflow: 'hidden',
    shadowColor: '#9CA3AF',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.07,
    shadowRadius: 10,
    elevation: 3,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingHorizontal: 16,
    paddingTop: 14,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: BORDER,
  },
  sectionIconWrap: {
    width: 28,
    height: 28,
    borderRadius: 8,
    backgroundColor: PURPLE_SOFT,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: '800',
    color: TEXT_DARK,
    flex: 1,
    letterSpacing: 0.2,
  },
  itemCountBadge: {
    backgroundColor: PURPLE_SOFT,
    borderRadius: 20,
    paddingHorizontal: 10,
    paddingVertical: 3,
  },
  itemCountText: { fontSize: 11, fontWeight: '700', color: PURPLE },
  detailsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  detailCell: {
    width: '50%',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingHorizontal: 6,
    paddingVertical: 10,
  },
  detailIcon: {
    width: 32,
    height: 32,
    borderRadius: 9,
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  detailTextStack: { flex: 1, gap: 2 },
  detailLabel: {
    fontSize: 10,
    fontWeight: '700',
    color: TEXT_LIGHT,
    letterSpacing: 0.5,
    textTransform: 'uppercase',
  },
  detailValue: { fontSize: 13, fontWeight: '800', letterSpacing: -0.1 },
  approveToggle: {
    paddingHorizontal: 12,
    paddingVertical: 3,
    borderRadius: 20,
    backgroundColor: '#F3F4F6',
    borderWidth: 1,
    borderColor: BORDER,
    alignSelf: 'flex-start',
  },
  approveToggleOn: { backgroundColor: '#DCFCE7', borderColor: '#BBF7D0' },
  approveToggleText: { fontSize: 12, fontWeight: '700', color: TEXT_MID },
  approveToggleTextOn: { color: GREEN },
  table: {},
  tableRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingVertical: 10,
  },
  tableHeaderRow: {
    backgroundColor: '#F8F9FC',
    borderBottomWidth: 1,
    borderBottomColor: BORDER,
  },
  tableRowDivider: { borderBottomWidth: 1, borderBottomColor: '#F3F4F6' },
  tableHeaderCell: {
    fontSize: 10,
    fontWeight: '800',
    color: TEXT_MID,
    letterSpacing: 1,
    textTransform: 'uppercase',
  },
  tableCell: { fontSize: 13, color: TEXT_DARK, fontWeight: '500' },
  colProduct: { flex: 2.5 },
  colPrice: { flex: 1.5, textAlign: 'right' },
  colQty: { flex: 1.5, alignItems: 'center', justifyContent: 'center' },
  colAmount: { flex: 1.5, textAlign: 'right' },
  colAction: { width: 32, alignItems: 'center', justifyContent: 'center' },
  prodNameCell: {
    fontSize: 13,
    fontWeight: '700',
    lineHeight: 18,
    color: TEXT_DARK,
  },
  amountCell: { fontSize: 13, fontWeight: '800', color: PURPLE },
  qtyCell: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  qtyBtn: {
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: PURPLE_SOFT,
    alignItems: 'center',
    justifyContent: 'center',
  },
  qtyValue: {
    fontSize: 13,
    fontWeight: '800',
    color: TEXT_DARK,
    minWidth: 20,
    textAlign: 'center',
  },
  deleteBtn: {
    width: 28,
    height: 28,
    borderRadius: 8,
    backgroundColor: '#FEF2F2',
    borderWidth: 1,
    borderColor: '#FECACA',
    alignItems: 'center',
    justifyContent: 'center',
  },
  totalRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 14,
    paddingVertical: 14,
    borderTopWidth: 1.5,
    borderTopColor: BORDER,
    backgroundColor: '#FAFBFF',
  },
  totalLabel: {
    fontSize: 14,
    fontWeight: '800',
    color: TEXT_DARK,
    letterSpacing: 0.2,
  },
  totalValue: { fontSize: 17, fontWeight: '900', color: PURPLE },
  emptyItems: {
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 32,
  },
  emptyItemsText: { fontSize: 14, color: TEXT_LIGHT, fontWeight: '600' },
  footer: {
    backgroundColor: CARD,
    borderTopWidth: 1,
    borderTopColor: BORDER,
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: Platform.OS === 'ios' ? 32 : 16,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  footerTotal: { flex: 1 },
  footerTotalLabel: {
    fontSize: 10,
    fontWeight: '800',
    color: TEXT_LIGHT,
    letterSpacing: 1.5,
  },
  footerTotalValue: {
    fontSize: 20,
    fontWeight: '900',
    color: PURPLE_DEEP,
    letterSpacing: -0.5,
  },
  goBtn: {
    backgroundColor: PURPLE_DEEP,
    borderRadius: 14,
    height: 52,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingHorizontal: 24,
    shadowColor: PURPLE_DEEP,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.35,
    shadowRadius: 10,
    elevation: 7,
  },
  goBtnDisabled: { backgroundColor: '#C4CCDA', shadowOpacity: 0, elevation: 0 },
  goBtnText: {
    fontSize: 15,
    fontWeight: '800',
    color: WHITE,
    letterSpacing: 0.5,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  modalCard: {
    backgroundColor: WHITE,
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    paddingBottom: Platform.OS === 'ios' ? 40 : 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.15,
    shadowRadius: 16,
    elevation: 20,
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: BORDER,
  },
  modalHeaderIconWrap: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: PURPLE_SOFT,
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalTitle: { fontSize: 18, fontWeight: '800', color: TEXT_DARK, flex: 1 },
  modalCloseBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#F3F4F6',
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalTotalRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
  },
  modalTotalLabel: { fontSize: 14, fontWeight: '600', color: TEXT_MID },
  modalTotalValue: { fontSize: 20, fontWeight: '900', color: PURPLE_DEEP },
  modalDivider: { height: 1, backgroundColor: BORDER, marginHorizontal: 20 },
  modalBtnRow: {
    flexDirection: 'row',
    gap: 12,
    paddingHorizontal: 20,
    paddingVertical: 20,
  },
  modalBtn: {
    flex: 1,
    height: 56,
    borderRadius: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 5,
  },
  btnOrder: { backgroundColor: PURPLE_DEEP, shadowColor: PURPLE_DEEP },
  btnPaid: { backgroundColor: '#16A34A', shadowColor: '#16A34A' },
  modalBtnText: {
    fontSize: 16,
    fontWeight: '800',
    color: WHITE,
    letterSpacing: 0.5,
  },
  butlerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 18,
  },
  butlerLeft: { flexDirection: 'row', alignItems: 'center', gap: 14, flex: 1 },
  butlerIconWrap: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: PURPLE_SOFT,
    alignItems: 'center',
    justifyContent: 'center',
  },
  butlerLabel: {
    fontSize: 14,
    fontWeight: '800',
    color: TEXT_DARK,
    letterSpacing: 1.5,
  },
  butlerSub: {
    fontSize: 11,
    color: TEXT_LIGHT,
    fontWeight: '500',
    marginTop: 2,
  },
});

// ─────────────────────────────────────────────────────────────────────────────
// KOT modal styles
// THE FIX: K.sheet uses a hard pixel height (SCREEN_HEIGHT * 0.92) instead of
// maxHeight / flex so the sheet is always fully rendered on screen.
// ─────────────────────────────────────────────────────────────────────────────
const K = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.55)',
    justifyContent: 'flex-end',
  },
  sheet: {
    height: SCREEN_HEIGHT * 0.92, // <-- hard pixel height, always visible
    backgroundColor: WHITE,
    borderTopLeftRadius: 26,
    borderTopRightRadius: 26,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -6 },
    shadowOpacity: 0.2,
    shadowRadius: 20,
    elevation: 30,
  },
  header: {
    backgroundColor: PURPLE_DEEP,
    paddingHorizontal: 22,
    paddingTop: 22,
    paddingBottom: 18,
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    flexShrink: 0,
  },
  headerTitle: {
    fontSize: 30,
    fontWeight: '900',
    color: WHITE,
    letterSpacing: 2,
  },
  headerSub: {
    fontSize: 15,
    fontWeight: '500',
    color: 'rgba(255,255,255,0.65)',
    marginTop: 4,
  },
  closeBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(255,255,255,0.18)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  scrollArea: { flex: 1 },
  scrollContent: {
    paddingHorizontal: 18,
    paddingTop: 18,
    paddingBottom: Platform.OS === 'ios' ? 48 : 28,
    gap: 16,
  },
  totalBlock: {
    backgroundColor: PURPLE_SOFT,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#E2D3FF',
    paddingHorizontal: 18,
    paddingVertical: 14,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  totalLabel: { fontSize: 16, fontWeight: '600', color: TEXT_MID },
  totalValue: { fontSize: 28, fontWeight: '900', color: PURPLE_DEEP },
  divider: { height: 1, backgroundColor: BORDER },
  sectionLabel: {
    fontSize: 12,
    fontWeight: '800',
    color: TEXT_LIGHT,
    letterSpacing: 1.5,
    textTransform: 'uppercase',
    marginBottom: 10,
  },
  memberCard: {
    backgroundColor: PURPLE_SOFT,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#E9D8FD',
    padding: 16,
  },
  memberTop: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    paddingBottom: 14,
    borderBottomWidth: 1,
    borderBottomColor: '#E9D8FD',
    marginBottom: 14,
  },
  memberAvatar: {
    width: 54,
    height: 54,
    borderRadius: 27,
    backgroundColor: PURPLE,
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  memberAvatarText: { fontSize: 24, fontWeight: '900', color: WHITE },
  memberInfo: { flex: 1, gap: 6 },
  memberNameRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  memberName: {
    fontSize: 20,
    fontWeight: '900',
    color: PURPLE_DEEP,
    flex: 1,
    letterSpacing: -0.3,
  },
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
  statusText: { fontSize: 11, fontWeight: '700', color: '#15803D' },
  memberIdChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: WHITE,
    borderWidth: 1,
    borderColor: '#C4B5FD',
    borderRadius: 20,
    paddingHorizontal: 12,
    paddingVertical: 5,
    alignSelf: 'flex-start',
  },
  memberIdText: { fontSize: 14, fontWeight: '800', color: PURPLE },
  memberMetaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: 14,
  },
  memberMeta: { flexDirection: 'row', alignItems: 'center', gap: 5 },
  memberMetaText: { fontSize: 13, fontWeight: '600', color: '#7C3AED' },
  fieldLabelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 8,
  },
  fieldLabel: { fontSize: 16, fontWeight: '700', color: TEXT_DARK },
  reqBadge: {
    backgroundColor: '#FEE2E2',
    borderRadius: 6,
    paddingHorizontal: 8,
    paddingVertical: 2,
  },
  reqBadgeText: { fontSize: 12, fontWeight: '700', color: '#B91C1C' },
  pickerWrap: {
    borderWidth: 1.5,
    borderColor: '#D1D5DB',
    borderRadius: 12,
    overflow: 'hidden',
    backgroundColor: WHITE,
  },
  pickerWrapEmpty: { borderColor: '#F87171' },
  picker: { height: 54, color: TEXT_DARK },
  checkGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  checkTile: {
    width: '48%',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    borderWidth: 1.5,
    borderColor: '#E5E7EB',
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 16,
    backgroundColor: WHITE,
  },
  checkTileOn: { borderColor: PURPLE, backgroundColor: PURPLE_SOFT },
  checkBox: {
    width: 26,
    height: 26,
    borderRadius: 7,
    borderWidth: 2,
    borderColor: '#D1D5DB',
    backgroundColor: WHITE,
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  checkBoxOn: { backgroundColor: PURPLE, borderColor: PURPLE },
  checkLabel: { fontSize: 17, fontWeight: '700', color: TEXT_DARK },
  checkLabelOn: { color: PURPLE_DEEP },
  actionRow: { flexDirection: 'row', gap: 12 },
  btnSend: {
    flex: 1,
    height: 58,
    backgroundColor: PURPLE_DEEP,
    borderRadius: 14,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    shadowColor: PURPLE_DEEP,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.35,
    shadowRadius: 10,
    elevation: 7,
  },
  btnSendDisabled: {
    backgroundColor: '#C4CCDA',
    shadowOpacity: 0,
    elevation: 0,
  },
  btnSendText: {
    fontSize: 18,
    fontWeight: '800',
    color: WHITE,
    letterSpacing: 0.5,
  },
  btnCancel: {
    flex: 1,
    height: 58,
    backgroundColor: WHITE,
    borderRadius: 14,
    borderWidth: 1.5,
    borderColor: '#D1D5DB',
    alignItems: 'center',
    justifyContent: 'center',
  },
  btnCancelText: { fontSize: 18, fontWeight: '700', color: TEXT_MID },
});
