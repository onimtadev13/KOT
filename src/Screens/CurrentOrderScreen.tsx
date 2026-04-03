import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  StatusBar,
  Platform,
  ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@react-native-vector-icons/ionicons';
import { useAppStore, OrderItem } from '../Store/store';
import { DrawerActions, useNavigation } from '@react-navigation/native';
import { loadManagers, submitOrder, submitKot, submitKotCheck, deviceCheck, printKot, loadKotItems, KotItemResult, deleteKotItem } from '../Api/api';
import colors from '../themes/colors';

import OrderModal        from '../Components/OrderModal';
import KotModal          from '../Components/KotModal';
import PrintSuccessModal from '../Components/PrintSuccessModal';
import MessageBox        from '../Components/MessageBox';

const C = colors.currentOrder;

// ─────────────────────────────────────────────────────────────────────────────
// Format number with thousand separators and 2 decimal places
// ─────────────────────────────────────────────────────────────────────────────
function fmtApi(val: string | number | null | undefined): string {
  if (val === null || val === undefined || val === '') return '';
  const n = Number(val);
  if (isNaN(n)) return String(val);
  return n.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

export default function CurrentOrderScreen({ navigation }: { navigation: any }) {
  const nav          = useNavigation<any>();
  const device       = useAppStore(state => state.device);
  const session      = useAppStore(state => state.session);
  const orderContext = useAppStore(state => state.orderContext);
  const orderItems   = useAppStore(state => state.orderItems);
  const orderTotal   = useAppStore(state => state.orderTotal);

  const [approved,            setApproved]           = useState(false);
  const [orderModal,          setOrderModal]          = useState(false);
  const [butlerEnabled,       setButlerEnabled]       = useState(false);
  const [kotModal,            setKotModal]            = useState(false);
  const [kotReqBy,            setKotReqBy]            = useState('');
  const [kotPaymentType,      setKotPaymentType]      = useState('');
  const [kotDeliveryType,     setKotDeliveryType]     = useState('');
  const [kotSending,          setKotSending]          = useState(false);
  const [paid,                setPaid]                = useState(false);
  const [showManagerApproval, setShowManagerApproval] = useState(false);
  const [managers,            setManagers]            = useState<{ label: string; value: string }[]>([]);
  const [managersLoading,     setManagersLoading]     = useState(false);
  const [orderResponse,       setOrderResponse]       = useState<any>(null);
  const [orderResponseModal,  setOrderResponseModal]  = useState(false);
  const [orderLoading,        setOrderLoading]        = useState(false);
  const [printSuccessModal,   setPrintSuccessModal]   = useState(false);
  const [kotItems,            setKotItems]            = useState<KotItemResult[]>([]);
  const [kotItemsLoading,     setKotItemsLoading]     = useState(false);
  const [deletingId,          setDeletingId]          = useState<number | null>(null);

  // ── MessageBox state ───────────────────────────────────────────────────────
  const [deleteBox,         setDeleteBox]         = useState(false);
  const [pendingDeleteItem, setPendingDeleteItem] = useState<KotItemResult | null>(null);

  const total = orderTotal();
  const ctx   = orderContext;

  function formatPrice(n: number): string {
    return `LKR ${n.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  }

  function fmt(val: string | number | null | undefined): string {
    if (val === null || val === undefined || val === '') return '—';
    const n = Number(val);
    if (isNaN(n)) return String(val);
    return n.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  }

  // ── Order context derived values ───────────────────────────────────────────
  const guestName = (() => {
    if (ctx.type === 'guest')           return ctx.guestName   ?? '—';
    if (ctx.type === 'visitor')         return ctx.visitorName ?? '—';
    if (ctx.type === 'executive_staff') return ctx.staffName   ?? '—';
    if (ctx.type === 'pits')            return ctx.memberName  ?? '—';
    return null;
  })();

  const guestId = (() => {
    if (ctx.type === 'guest')           return ctx.guestId   ?? '—';
    if (ctx.type === 'executive_staff') return ctx.staffCode ?? '—';
    if (ctx.type === 'pits')            return ctx.memberId  ?? '—';
    return null;
  })();

  const guestIdLabel = (() => {
    if (ctx.type === 'guest')           return 'Guest ID';
    if (ctx.type === 'executive_staff') return 'Staff Code';
    if (ctx.type === 'pits')            return 'Member ID';
    return '';
  })();

  const guestNameLabel = (() => {
    if (ctx.type === 'guest')           return 'Guest Name';
    if (ctx.type === 'visitor')         return 'Visitor Name';
    if (ctx.type === 'executive_staff') return 'Staff Name';
    if (ctx.type === 'pits')            return 'Member Name';
    return 'Name';
  })();

  const guestAccent = (() => {
    if (ctx.type === 'pits')            return C.guest.pits.accent;
    if (ctx.type === 'executive_staff') return C.guest.staff.accent;
    if (ctx.type === 'visitor')         return C.guest.visitor.accent;
    return C.guest.guest.accent;
  })();

  const guestBg = (() => {
    if (ctx.type === 'pits')            return C.guest.pits.bg;
    if (ctx.type === 'executive_staff') return C.guest.staff.bg;
    if (ctx.type === 'visitor')         return C.guest.visitor.bg;
    return C.guest.guest.bg;
  })();

  const guestIcon = (() => {
    if (ctx.type === 'pits')            return 'card-outline';
    if (ctx.type === 'executive_staff') return 'briefcase-outline';
    if (ctx.type === 'visitor')         return 'walk-outline';
    return 'person-circle-outline';
  })();

  const unit     = String(device?.Device_Id ?? '—');
  const operator = session?.Emp_Name    ?? '—';
  const steward  = session?.StewardName ?? '—';
  const table    = ctx.tableCode        ?? '—';
  const drop     = fmt((ctx as any).currentDrop);
  const points   = fmt((ctx as any).points);
  const avgBet   = fmt((ctx as any).avgBet);

  // ── Row 1: Unit, Operator, Steward (33% each)
  // ── Row 2: Table, Current Drop, Points (33% each)
  // ── Row 3: Avg Bet, Approve (50% each — Approve is rendered separately)
  const detailFields = [
    { label: 'Unit',         value: unit,     icon: 'location-outline',      color: C.detail.unit,     w: '33.33%' },
    { label: 'Operator',     value: operator, icon: 'key-outline',           color: C.detail.operator, w: '33.33%' },
    { label: 'Steward',      value: steward,  icon: 'people-outline',        color: C.detail.steward,  w: '33.33%' },
    { label: 'Table',        value: table,    icon: 'easel-outline',         color: C.detail.table,    w: '33.33%' },
    { label: 'Current Drop', value: drop,     icon: 'trending-down-outline', color: C.detail.drop,     w: '33.33%' },
    { label: 'Points',       value: points,   icon: 'star-outline',          color: C.detail.points,   w: '33.33%' },
    { label: 'Avg Bet',      value: avgBet,   icon: 'bar-chart-outline',     color: C.detail.avgBet,   w: '50%'    },
  ];

  // ── KOT derived ────────────────────────────────────────────────────────────
  const kotMemberName = (() => {
    if (ctx.type === 'guest')           return ctx.guestName   ?? '—';
    if (ctx.type === 'visitor')         return ctx.visitorName ?? '—';
    if (ctx.type === 'executive_staff') return ctx.staffName   ?? '—';
    if (ctx.type === 'pits')            return ctx.memberName  ?? '—';
    return '—';
  })();

  const kotMemberId = (() => {
    if (ctx.type === 'guest')           return ctx.guestId   ?? null;
    if (ctx.type === 'executive_staff') return ctx.staffCode ?? null;
    if (ctx.type === 'pits')            return ctx.memberId  ?? null;
    return null;
  })();

  // ── KOT items — reload whenever a new item is added ───────────────────────
  useEffect(() => {
    fetchKotItems();
  }, [orderItems.length]); // eslint-disable-line react-hooks/exhaustive-deps

  async function fetchKotItems() {
    if (!device?.Device_Id || !device?.Doc_No) return;
    setKotItemsLoading(true);
    try {
      const results = await loadKotItems(
        device.Device_Id,
        device.Doc_No,
        device.UniqueId ?? '',
      );
      setKotItems(results);
    } catch (e) {
      console.error('[KOT ITEMS] Fetch failed:', e);
    } finally {
      setKotItemsLoading(false);
    }
  }

  // ── Load managers when KOT modal opens ────────────────────────────────────
  useEffect(() => {
    if (!kotModal) return;

    async function fetchManagers() {
      setManagersLoading(true);
      try {
        const results = await loadManagers(
          device?.Device_Id ?? 0,
          device?.Doc_No    ?? '',
          session?.Emp_Name ?? '',
        );
        setManagers([
          { label: 'Select a Manager', value: '' },
          ...results.map(m => ({ label: m.Managernames, value: m.Managernames })),
        ]);
      } catch (e) {
        console.error('[MANAGERS] Failed to load:', e);
        setManagers([{ label: 'Select a Manager', value: '' }]);
      } finally {
        setManagersLoading(false);
      }
    }

    fetchManagers();
  }, [kotModal]); // eslint-disable-line react-hooks/exhaustive-deps

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

    const result = await submitOrder({
      docNo:       device?.Doc_No       ?? '',
      steward:     session?.StewardName ?? '',
      mid,
      deviceId:    device?.Device_Id    ?? 0,
      loginUser:   session?.Emp_Name    ?? '',
      tableName:   ctx.tableCode        ?? '',
      mName,
      currentDrop: fmtApi((ctx as any).currentDrop),
      points:      fmtApi((ctx as any).points),
      avgBet:      fmtApi((ctx as any).avgBet),
      totalDrop:   (ctx as any).totalDrop ?? '',
      butler:      butlerEnabled,
    });

    console.log('[ORDER] Submit response:', JSON.stringify(result, null, 2));

    if (!result.success || !result.data?.strRturnRes) {
      console.warn('[ORDER] Submit failed, skipping print.');
      return;
    }

    const row = result.data?.CommonResult?.Table?.[0];
    if (!row) {
      console.warn('[ORDER] No table row in response, skipping print.');
      return;
    }

    const printResult = await printKot({
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
    });

    if (printResult.strRturnRes === true) {
      console.log('[ORDER] Print succeeded. Re-checking device...');
      const deviceResult = await deviceCheck(device?.UniqueId ?? '');
      console.log('[DEVICE RECHECK] Result:', JSON.stringify(deviceResult, null, 2));
      setPrintSuccessModal(true);
    } else {
      console.warn('[ORDER] Print response was not true, skipping device recheck.');
    }
  }

  function handlePaid() {
    setOrderModal(false);
    setKotReqBy('');
    setKotPaymentType('');
    setKotDeliveryType('');
    setPaid(false);
    setKotSending(false);
    setShowManagerApproval(false);
    setTimeout(() => setKotModal(true), 300);
  }

  async function handleKotSend() {
    if (!kotReqBy) return;
    if (kotSending) return;
    setKotSending(true);

    try {
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

      const checkResult = await submitKotCheck({
        paymentType:  kotPaymentType,
        deliveryType: kotDeliveryType,
        deviceId:     device?.Device_Id ?? 0,
        docNo:        device?.Doc_No    ?? '',
      });

      console.log('[KOT CHECK] approved:', checkResult.approved);

      if (!checkResult.approved) {
        setPaid(false);
        setShowManagerApproval(true);
        console.log('[KOT] Manager approval required — stopping.');
        return;
      }

      setPaid(true);
      setShowManagerApproval(false);
      console.log('[KOT] paid = true — proceeding to submit.');
      setKotModal(false);

      const result = await submitKot({
        docNo:        device?.Doc_No       ?? '',
        loginUser:    session?.Emp_Name    ?? '',
        mid,
        deviceId:     device?.Device_Id    ?? 0,
        tableName:    ctx.tableCode        ?? '',
        mName,
        paymentType:  kotPaymentType,
        currentDrop:  fmtApi((ctx as any).currentDrop),
        points:       fmtApi((ctx as any).points),
        avgBet:       fmtApi((ctx as any).avgBet),
        deliveryType: kotDeliveryType,
        butler:       butlerEnabled,
      });

      console.log('[KOT] Submit result:', JSON.stringify(result, null, 2));

      if (result.success && result.strRturnRes === true) {
        setPrintSuccessModal(true);
      }
    } finally {
      setKotSending(false);
    }
  }

  // ── Delete KOT item — show MessageBox instead of Alert ────────────────────
  function handleDeleteItem(item: KotItemResult) {
    setPendingDeleteItem(item);
    setDeleteBox(true);
  }

  async function confirmDeleteItem() {
    if (!pendingDeleteItem) return;
    setDeleteBox(false);
    setDeletingId(pendingDeleteItem.Id_No);
    try {
      const result = await deleteKotItem({
        prodCode: pendingDeleteItem.Prod_Code,
        unitNo:   device?.Device_Id ?? 0,
        docNo:    device?.Doc_No    ?? '',
        idNo:     pendingDeleteItem.Id_No,
        mac:      device?.UniqueId  ?? '',
      });
      console.log('[DELETE KOT ITEM] Result:', JSON.stringify(result, null, 2));
      setKotItems(result.refreshedItems);
    } finally {
      setDeletingId(null);
      setPendingDeleteItem(null);
    }
  }

  // ── Detail cell ────────────────────────────────────────────────────────────
  function DetailCell({
    icon,
    color,
    label,
    value,
    width,
  }: {
    icon: string;
    color: string;
    label: string;
    value: string;
    width?: string;
  }) {
    return (
      <View style={[S.detailCell, { width: (width ?? '50%') as any }]}>
        <View style={[S.detailIcon, { backgroundColor: color + '22' }]}>
          <Ionicons name={icon as any} size={18} color={color} />
        </View>
        <View style={S.detailTextStack}>
          <Text style={S.detailLabel}>{label}</Text>
          <Text style={[S.detailValue, { color }]} numberOfLines={1} adjustsFontSizeToFit>
            {value}
          </Text>
        </View>
      </View>
    );
  }

  // ── Render ─────────────────────────────────────────────────────────────────
  return (
    <View style={S.flex}>
      <StatusBar barStyle="light-content" backgroundColor={C.purpleDeep} />

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
          <Text style={S.navTitle}>Current Order</Text>
          <Text style={S.navSub}>KITCHEN ORDER TICKET</Text>
        </View>

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

      <ScrollView style={S.scroll} contentContainerStyle={S.scrollContent} showsVerticalScrollIndicator={false}>

        {/* ── Identity + Order Details card ── */}
        {!!ctx.type && (
          <View style={[S.combinedCard, { borderLeftColor: guestAccent }]}>
            <View style={[S.guestBody, { borderBottomWidth: 1, borderBottomColor: guestAccent + '33' }]}>
              <View style={S.guestNameCol}>
                <Text style={S.guestFieldLabel}>{guestNameLabel}</Text>
                <View style={S.guestNameRow}>
                  <Ionicons name="person-outline" size={17} color={guestAccent} />
                  <Text style={[S.guestName, { color: guestAccent }]} numberOfLines={2} adjustsFontSizeToFit>
                    {guestName}
                  </Text>
                </View>
              </View>
              {!!guestId && (
                <>
                  <View style={S.guestDivider} />
                  <View style={S.guestIdCol}>
                    <Text style={S.guestFieldLabel}>{guestIdLabel}</Text>
                    <View style={[S.guestIdChip, { backgroundColor: guestBg, borderColor: guestAccent + '55' }]}>
                      <Ionicons name="card-outline" size={13} color={guestAccent} />
                      <Text style={[S.guestIdText, { color: guestAccent }]}>{guestId}</Text>
                    </View>
                  </View>
                </>
              )}
            </View>

            <View style={S.detailsGrid}>
              {detailFields.map((f, i) => (
                <DetailCell
                  key={i}
                  icon={f.icon}
                  color={f.color}
                  label={f.label}
                  value={f.value}
                  width={f.w}
                />
              ))}

              {/* ── Approve cell — paired with Avg Bet at 50% ── */}
              <View style={[S.detailCell, { width: '50%' }]}>
                <View style={[S.detailIcon, { backgroundColor: approved ? C.approveOnBg : C.approveOffBg }]}>
                  <Ionicons
                    name={approved ? 'checkmark-circle' : 'radio-button-off-outline'}
                    size={20}
                    color={approved ? C.green : C.approveOffText}
                  />
                </View>
                <View style={S.detailTextStack}>
                  <Text style={S.detailLabel}>Approve</Text>
                  <TouchableOpacity onPress={() => setApproved(p => !p)} activeOpacity={0.75}>
                    <View style={[S.approveToggle, approved && S.approveToggleOn]}>
                      <Text style={[S.approveToggleText, approved && S.approveToggleTextOn]}>
                        {approved ? 'Yes' : 'Not Selected'}
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
              <Ionicons name="receipt-outline" size={16} color={C.purple} />
            </View>
            <Text style={S.sectionTitle}>Order Items</Text>
            <View style={S.itemCountBadge}>
              <Text style={S.itemCountText}>
                {kotItems.length} item{kotItems.length !== 1 ? 's' : ''}
              </Text>
            </View>
          </View>

          {kotItemsLoading ? (
            <View style={S.emptyItems}>
              <ActivityIndicator size="small" color={C.purple} />
              <Text style={S.emptyItemsText}>Loading items…</Text>
            </View>
          ) : kotItems.length === 0 ? (
            <View style={S.emptyItems}>
              <Ionicons name="cart-outline" size={28} color={C.textLight} />
              <Text style={S.emptyItemsText}>No items added yet</Text>
            </View>
          ) : (
            <View style={S.table}>
              {/* ── Table header ── */}
              <View style={[S.tableRow, S.tableHeaderRow]}>
                <Text style={[S.tableHeaderCell, S.colProduct]}>Product</Text>
                <Text style={[S.tableHeaderCell, S.colPrice]}>Price</Text>
                <Text style={[S.tableHeaderCell, S.colQty]}>Qty</Text>
                <Text style={[S.tableHeaderCell, S.colAmount]}>Amount</Text>
                <View style={S.colAction} />
              </View>

              {/* ── Table rows ── */}
              {kotItems.map((item: KotItemResult, idx: number) => {
                const isLast   = idx === kotItems.length - 1;
                const deleting = deletingId === item.Id_No;
                return (
                  <View key={item.Prod_Code + idx} style={[S.tableRow, !isLast && S.tableRowDivider]}>
                    <Text style={[S.tableCell, S.colProduct, S.prodNameCell]} numberOfLines={2}>
                      {item.Prod_Name}
                    </Text>
                    <Text style={[S.tableCell, S.colPrice]}>
                      {Number(item.Selling_Price).toLocaleString()}
                    </Text>
                    <Text style={[S.tableCell, S.colQty, { textAlign: 'center' }]}>
                      {item.Qty}
                    </Text>
                    <Text style={[S.tableCell, S.colAmount, S.amountCell]}>
                      {Number(item.Amount ?? item.Selling_Price * item.Qty).toLocaleString()}
                    </Text>
                    <TouchableOpacity
                      style={[S.colAction, S.deleteBtn]}
                      onPress={() => handleDeleteItem(item)}
                      disabled={deleting}
                      activeOpacity={0.75}
                    >
                      {deleting
                        ? <ActivityIndicator size="small" color="#EF4444" />
                        : <Ionicons name="trash-outline" size={14} color="#EF4444" />
                      }
                    </TouchableOpacity>
                  </View>
                );
              })}

              <View style={S.totalRow}>
                <Text style={S.totalLabel}>Total Amount</Text>
                <Text style={S.totalValue}>
                  {formatPrice(kotItems.reduce((sum, i) => sum + Number(i.Amount ?? i.Selling_Price * i.Qty), 0))}
                </Text>
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
          <Ionicons name="arrow-forward-circle" size={20} color={colors.white} />
        </TouchableOpacity>
      </View>

      {/* ── Modals ── */}
      <OrderModal
        visible={orderModal}
        total={total}
        butlerEnabled={butlerEnabled}
        onClose={() => setOrderModal(false)}
        onOrder={handleOrder}
        onPaid={handlePaid}
        onButlerChange={setButlerEnabled}
      />
      <KotModal
        visible={kotModal}
        total={total}
        memberName={kotMemberName}
        memberId={kotMemberId}
        guestId={(ctx as any).guestId}
        tableCode={ctx.tableCode}
        pitName={(ctx as any).pitName}
        managers={managers}
        managersLoading={managersLoading}
        kotReqBy={kotReqBy}
        kotPaymentType={kotPaymentType}
        kotDeliveryType={kotDeliveryType}
        kotSending={kotSending}
        onClose={() => setKotModal(false)}
        onReqByChange={setKotReqBy}
        onPaymentType={setKotPaymentType}
        onDeliveryType={setKotDeliveryType}
        onSend={handleKotSend}
      />
      <PrintSuccessModal
        visible={printSuccessModal}
        onDone={() => {
          setPrintSuccessModal(false);
          nav.navigate('Login');
        }}
      />

      {/* ── Delete confirmation MessageBox ── */}
      <MessageBox
        visible={deleteBox}
        variant="danger"
        title="Remove Item"
        message={
          pendingDeleteItem
            ? `Remove "${pendingDeleteItem.Prod_Name}" from the order?`
            : 'Are you sure you want to remove this item?'
        }
        buttons={[
          {
            label:   'Cancel',
            style:   'ghost',
            onPress: () => {
              setDeleteBox(false);
              setPendingDeleteItem(null);
            },
          },
          {
            label:   'Remove',
            style:   'destructive',
            onPress: confirmDeleteItem,
          },
        ]}
        onDismiss={() => {
          setDeleteBox(false);
          setPendingDeleteItem(null);
        }}
      />
    </View>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Styles — all colours from colors.currentOrder (C) or colors.*
// ─────────────────────────────────────────────────────────────────────────────
const S = StyleSheet.create({
  flex: { flex: 1, backgroundColor: C.bg },

  // ── Nav bar ────────────────────────────────────────────────────────────────
  navBar: {
    backgroundColor:   C.purpleDeep,
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
  navTitle: { fontSize: 18, fontWeight: '800', color: colors.white, letterSpacing: 0.8 },
  navSub:   { fontSize: 9,  fontWeight: '600', color: colors.overlay.muted65, letterSpacing: 2, marginTop: 2 },

  // ── Doc chip ───────────────────────────────────────────────────────────────
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

  // ── Scroll ─────────────────────────────────────────────────────────────────
  scroll:        { flex: 1 },
  scrollContent: { padding: 14, paddingBottom: 24 },

  // ── Combined guest card ────────────────────────────────────────────────────
  combinedCard: {
    backgroundColor: C.cardBg,
    borderRadius:    18,
    borderWidth:     1,
    borderColor:     C.border,
    borderLeftWidth: 4,
    marginBottom:    14,
    overflow:        'hidden',
    shadowColor:     colors.shadow.card,
    shadowOffset:    { width: 0, height: 2 },
    shadowOpacity:   0.08,
    shadowRadius:    10,
    elevation:       3,
  },
  guestBand:      { flexDirection: 'row', alignItems: 'center', gap: 10, paddingHorizontal: 14, paddingVertical: 10 },
  guestBandIcon:  { width: 34, height: 34, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
  guestTypeLabel: { fontSize: 10, fontWeight: '800', letterSpacing: 1.8 },
  guestBody:      { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingTop: 2, paddingBottom: 18, gap: 14 },
  guestNameCol:   { flex: 1 },
  guestIdCol:     { alignItems: 'flex-end' },
  guestFieldLabel:{ fontSize: 10, fontWeight: '700', color: C.textLight, letterSpacing: 0.5, textTransform: 'uppercase', marginBottom: 6 },
  guestNameRow:   { flexDirection: 'row', alignItems: 'center', gap: 7 },
  guestName:      { fontSize: 18, fontWeight: '900', letterSpacing: -0.3, flex: 1 },
  guestDivider:   { width: 1, height: 46, backgroundColor: C.border },
  guestIdChip:    { flexDirection: 'row', alignItems: 'center', gap: 5, paddingHorizontal: 12, paddingVertical: 7, borderRadius: 20, borderWidth: 1 },
  guestIdText:    { fontSize: 14, fontWeight: '800', letterSpacing: 0.1 },

  // ── Section card ───────────────────────────────────────────────────────────
  section: {
    backgroundColor: colors.card,
    borderRadius:    18,
    borderWidth:     1,
    borderColor:     C.border,
    marginBottom:    14,
    overflow:        'hidden',
    shadowColor:     colors.shadow.card,
    shadowOffset:    { width: 0, height: 2 },
    shadowOpacity:   0.07,
    shadowRadius:    10,
    elevation:       3,
  },
  sectionHeader: {
    flexDirection:     'row',
    alignItems:        'center',
    gap:               10,
    paddingHorizontal: 16,
    paddingTop:        14,
    paddingBottom:     12,
    borderBottomWidth: 1,
    borderBottomColor: C.border,
  },
  sectionIconWrap: { width: 28, height: 28, borderRadius: 8, backgroundColor: C.purpleSoft, alignItems: 'center', justifyContent: 'center' },
  sectionTitle:    { fontSize: 14, fontWeight: '800', color: C.textDark, flex: 1, letterSpacing: 0.2 },
  itemCountBadge:  { backgroundColor: C.purpleSoft, borderRadius: 20, paddingHorizontal: 10, paddingVertical: 3 },
  itemCountText:   { fontSize: 11, fontWeight: '700', color: C.purple },

  // ── Detail grid ────────────────────────────────────────────────────────────
  detailsGrid: { flexDirection: 'row', flexWrap: 'wrap', paddingHorizontal: 10, paddingVertical: 4 },
  detailCell: {
    flexDirection:     'row',
    alignItems:        'center',
    gap:               8,
    paddingHorizontal: 6,
    paddingVertical:   6,
  },
  detailIcon:      { width: 30, height: 30, borderRadius: 10, alignItems: 'center', justifyContent: 'center', flexShrink: 0 },
  detailTextStack: { flex: 1, gap: 2 },
  detailLabel:     { fontSize: 9, fontWeight: '800', color: '#1F2937', letterSpacing: 0.5, textTransform: 'uppercase' },
  detailValue:     { fontSize: 15, fontWeight: '900', letterSpacing: -0.2 },

  approveToggle:       { paddingHorizontal: 10, paddingVertical: 3, borderRadius: 20, backgroundColor: '#F3F4F6', borderWidth: 1, borderColor: C.border, alignSelf: 'flex-start' },
  approveToggleOn:     { backgroundColor: C.approveOnBg, borderColor: C.approveOnBorder },
  approveToggleText:   { fontSize: 11, fontWeight: '700', color: C.textMid },
  approveToggleTextOn: { color: C.green },

  // ── Table ──────────────────────────────────────────────────────────────────
  table:          {},
  tableRow:       { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 14, paddingVertical: 10 },
  tableHeaderRow: { backgroundColor: C.tableHeaderBg, borderBottomWidth: 1, borderBottomColor: C.border },
  tableRowDivider:{ borderBottomWidth: 1, borderBottomColor: C.tableRowDivider },
  tableHeaderCell:{ fontSize: 10, fontWeight: '800', color: C.textMid, letterSpacing: 1, textTransform: 'uppercase' },
  tableCell:      { fontSize: 13, color: C.textDark, fontWeight: '500' },
  colProduct:     { flex: 2.5 },
  colPrice:       { flex: 1.5, textAlign: 'right' },
  colQty:         { flex: 1.5, textAlign: 'center' },
  colAmount:      { flex: 1.5, textAlign: 'right' },
  colAction:      { width: 32, alignItems: 'center', justifyContent: 'center' },
  prodNameCell:   { fontSize: 13, fontWeight: '700', lineHeight: 18, color: C.textDark },
  amountCell:     { fontSize: 13, fontWeight: '800', color: C.purple, paddingRight: 7 },
  deleteBtn: {
    width:           28,
    height:          28,
    borderRadius:    8,
    backgroundColor: '#FEF2F2',
    borderWidth:     1,
    borderColor:     '#FECACA',
    alignItems:      'center',
    justifyContent:  'center',
  },
  totalRow:       { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 14, paddingVertical: 14, borderTopWidth: 1.5, borderTopColor: C.border, backgroundColor: C.totalRowBg },
  totalLabel:     { fontSize: 14, fontWeight: '800', color: C.textDark, letterSpacing: 0.2 },
  totalValue:     { fontSize: 17, fontWeight: '900', color: C.purple },
  emptyItems:     { alignItems: 'center', justifyContent: 'center', gap: 8, paddingVertical: 32 },
  emptyItemsText: { fontSize: 14, color: C.textLight, fontWeight: '600' },

  // ── Footer ─────────────────────────────────────────────────────────────────
  footer: {
    backgroundColor:   colors.card,
    borderTopWidth:    1,
    borderTopColor:    C.border,
    paddingHorizontal: 16,
    paddingTop:        12,
    paddingBottom:     Platform.OS === 'ios' ? 32 : 16,
    flexDirection:     'row',
    alignItems:        'center',
    gap:               12,
  },
  footerTotal:      { flex: 1 },
  footerTotalLabel: { fontSize: 10, fontWeight: '800', color: C.textLight, letterSpacing: 1.5 },
  footerTotalValue: { fontSize: 20, fontWeight: '900', color: C.purpleDeep, letterSpacing: -0.5 },
  goBtn: {
    backgroundColor:   C.purpleDeep,
    borderRadius:      14,
    height:            52,
    flexDirection:     'row',
    alignItems:        'center',
    justifyContent:    'center',
    gap:               8,
    paddingHorizontal: 24,
    shadowColor:       C.purpleDeep,
    shadowOffset:      { width: 0, height: 4 },
    shadowOpacity:     0.35,
    shadowRadius:      10,
    elevation:         7,
  },
  goBtnDisabled: { backgroundColor: C.goBtnDisabled, shadowOpacity: 0, elevation: 0 },
  goBtnText:     { fontSize: 15, fontWeight: '800', color: colors.white, letterSpacing: 0.5 },

  // ── Kept for modal compatibility ────────────────────────────────────────────
  modalOverlay:       { flex: 1, backgroundColor: colors.overlay.black50, justifyContent: 'flex-end' },
  modalCard:          { backgroundColor: colors.white, borderTopLeftRadius: 28, borderTopRightRadius: 28, paddingBottom: Platform.OS === 'ios' ? 40 : 24, shadowColor: '#000', shadowOffset: { width: 0, height: -4 }, shadowOpacity: 0.15, shadowRadius: 16, elevation: 20 },
  modalHeader:        { flexDirection: 'row', alignItems: 'center', gap: 12, paddingHorizontal: 20, paddingTop: 20, paddingBottom: 16, borderBottomWidth: 1, borderBottomColor: C.border },
  modalHeaderIconWrap:{ width: 36, height: 36, borderRadius: 10, backgroundColor: C.purpleSoft, alignItems: 'center', justifyContent: 'center' },
  modalTitle:         { fontSize: 18, fontWeight: '800', color: C.textDark, flex: 1 },
  modalCloseBtn:      { width: 32, height: 32, borderRadius: 16, backgroundColor: '#F3F4F6', alignItems: 'center', justifyContent: 'center' },
  modalTotalRow:      { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 20, paddingVertical: 16 },
  modalTotalLabel:    { fontSize: 14, fontWeight: '600', color: C.textMid },
  modalTotalValue:    { fontSize: 20, fontWeight: '900', color: C.purpleDeep },
  modalDivider:       { height: 1, backgroundColor: C.border, marginHorizontal: 20 },
  modalBtnRow:        { flexDirection: 'row', gap: 12, paddingHorizontal: 20, paddingVertical: 20 },
  modalBtn:           { flex: 1, height: 56, borderRadius: 16, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, shadowOffset: { width: 0, height: 3 }, shadowOpacity: 0.3, shadowRadius: 8, elevation: 5 },
  btnOrder:           { backgroundColor: C.purpleDeep, shadowColor: C.purpleDeep },
  btnPaid:            { backgroundColor: C.green,      shadowColor: C.green },
  modalBtnText:       { fontSize: 16, fontWeight: '800', color: colors.white, letterSpacing: 0.5 },
  butlerRow:          { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 20, paddingVertical: 18 },
  butlerLeft:         { flexDirection: 'row', alignItems: 'center', gap: 14, flex: 1 },
  butlerIconWrap:     { width: 40, height: 40, borderRadius: 12, backgroundColor: C.purpleSoft, alignItems: 'center', justifyContent: 'center' },
  butlerLabel:        { fontSize: 14, fontWeight: '800', color: C.textDark, letterSpacing: 1.5 },
  butlerSub:          { fontSize: 11, color: C.textLight, fontWeight: '500', marginTop: 2 },
});