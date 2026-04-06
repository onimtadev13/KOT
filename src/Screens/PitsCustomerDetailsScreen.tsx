import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  StatusBar,
  Platform,
  Image,
  Animated,
} from 'react-native';
import { Ionicons } from '@react-native-vector-icons/ionicons';
import { useAppStore } from '../Store/store';
import {
  loadPitGuestDetails,
  loadPitDropDetails,
  loadPitMemberTables, 
  loadPitMemberSlots, 
  loadPitMemberPoints,   
  loadPitMemberDrop,    
  PitGuestDetailResult,
  PitDropDetailResult,
  PitMemberTableResult,   
  PitMemberSlotResult, 
  PitMemberPointsResult, 
  PitMemberDropResult,  
} from '../Api/api';
import { DrawerActions, useNavigation } from '@react-navigation/native';
import colors from '../themes/colors';
import LottieView from 'lottie-react-native';

const C = colors.pitCustomer;

type ActionBtn = {
  key:   string;
  label: string;
  icon:  string;
  color: string;
  bg:    string;
};

const ACTION_BUTTONS: ActionBtn[] = colors.pitCustomer.actions;

function fmt(val: string | number | null | undefined): string {
  if (val === null || val === undefined || val === '') return '—';
  const n = Number(val);
  if (isNaN(n)) return String(val);
  return n.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

const TABLE_COLS: {
  key:     string;
  label:   string;
  flex?:   number;
  color?:  string;
  format?: (val: any) => string;
}[] = [
  {
    key:    'Pit_Name',
    label:  'Pit',
    flex:   0.6,
  },
  {
    key:    'TBL_Code',
    label:  'Table',
    flex:   0.8,
  },
  {
    key:    'MDrop',
    label:  'Drop',
    flex:   1,
    color:  C.stat.currentDrop,           // reuse your green stat colour
    format: (val) => fmt(val),
  },
  {
    key:    'Tr_Date_show',               // human-readable date — skip raw ISO + 'ff'
    label:  'Date / Time',
    flex:   1.6,
  },
];


// ── Slot columns — update keys once you see the real API response fields ──
const SLOT_COLS: {
  key:     string;
  label:   string;
  flex?:   number;
  color?:  string;
  format?: (val: any) => string;
}[] = [
  { key: 'Pit_Name', label: 'Machine',   flex: 0.9 },
  { key: 'TBL_Code', label: 'Type',      flex: 0.8 },
  { key: 'MDrop',    label: 'Drop',      flex: 1,   color: C.stat.slotDrop, format: (val) => fmt(val) },
  { key: 'TotDrop',  label: 'Total',     flex: 1,   color: C.stat.avgBet,   format: (val) => fmt(val) },
  { key: 'FF',       label: 'Date',      flex: 0.9 },
];

// ── Points columns — update keys once you see the real API response fields ──
const POINTS_COLS: {
  key:     string;
  label:   string;
  flex?:   number;
  color?:  string;
  format?: (val: any) => string;
}[] = [
  { key: 'Pit_Name',    label: 'Pit',        flex: 0.6 },
  { key: 'TBL_Code',    label: 'Table',      flex: 0.8 },
  { key: 'MDrop',       label: 'Points',     flex: 1,   color: C.stat.points, format: (val) => fmt(val) },
  { key: 'Tr_Date_show',label: 'Date / Time',flex: 1.6 },
];

// ── Drop columns — update keys once you see the real API response fields ──
const DROP_COLS: {
  key:     string;
  label:   string;
  flex?:   number;
  color?:  string;
  format?: (val: any) => string;
}[] = [
  { key: 'Pit_Name',     label: 'Pit',        flex: 0.6 },
  { key: 'TBL_Code',     label: 'Table',      flex: 0.8 },
  { key: 'MDrop',        label: 'Drop',       flex: 1,   color: C.stat.actualDrop, format: (val) => fmt(val) },
  { key: 'Tr_Date_show', label: 'Date / Time',flex: 1.6 },
];


export default function PitsCustomerDetailsScreen({
  navigation,
  route,
}: {
  navigation: any;
  route: any;
}) {
  const nav = useNavigation<any>();
  const { MID, MName, tblCode } = route.params as {
    MID:     string;
    MName:   string;
    tblCode: string;
  };

  const device          = useAppStore(state => state.device);
  const setOrderContext = useAppStore(state => state.setOrderContext);
  const clearOrder      = useAppStore(state => state.clearOrder);
  const orderItemCount  = useAppStore(state => state.orderItemCount);

  const itemCount = orderItemCount();
  const mac       = device?.UniqueId ?? '';

  const [guest,   setGuest]   = useState<PitGuestDetailResult | null>(null);
  const [drop,    setDrop]    = useState<PitDropDetailResult  | null>(null);
  const [loading, setLoading] = useState(true);
  const [error,   setError]   = useState<string | null>(null);

  const [memberTables,        setMemberTables]        = useState<PitMemberTableResult[]>([]);
  const [memberTablesLoading, setMemberTablesLoading] = useState(false);
  const [memberTablesError,   setMemberTablesError]   = useState<string | null>(null);
  const [showMemberTables,    setShowMemberTables]    = useState(false);

  const [memberSlots,        setMemberSlots]        = useState<PitMemberSlotResult[]>([]);
const [memberSlotsLoading, setMemberSlotsLoading] = useState(false);
const [memberSlotsError,   setMemberSlotsError]   = useState<string | null>(null);
const [showMemberSlots,    setShowMemberSlots]    = useState(false);

const [memberPoints,        setMemberPoints]        = useState<PitMemberPointsResult[]>([]);
const [memberPointsLoading, setMemberPointsLoading] = useState(false);
const [memberPointsError,   setMemberPointsError]   = useState<string | null>(null);
const [showMemberPoints,    setShowMemberPoints]    = useState(false);


const [memberDrop,        setMemberDrop]        = useState<PitMemberDropResult[]>([]);
const [memberDropLoading, setMemberDropLoading] = useState(false);
const [memberDropError,   setMemberDropError]   = useState<string | null>(null);
const [showMemberDrop,    setShowMemberDrop]    = useState(false);

  const bounceAnim = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(bounceAnim, { toValue: 1.35, duration: 600, useNativeDriver: true }),
        Animated.timing(bounceAnim, { toValue: 1,    duration: 600, useNativeDriver: true }),
      ]),
    );
    loop.start();
    return () => loop.stop();
  }, [bounceAnim]);

  useEffect(() => {
    clearOrder();
    fetchAll();
  }, [MID]); // eslint-disable-line react-hooks/exhaustive-deps

  async function fetchAll() {
    setLoading(true);
    setError(null);
    try {
      const [guestData, dropData] = await Promise.all([
        loadPitGuestDetails(MID),
        loadPitDropDetails(MID, mac),
      ]);
      setGuest(guestData);
      setDrop(dropData);
    } catch (e: any) {
      setError('Failed to load customer details.');
    } finally {
      setLoading(false);
    }
  }

function handleAction(key: string) {
    console.log('[PIT CUSTOMER] Action:', key, 'MID:', MID);
    switch (key) {
      case 'PAST_ORDERS':
        navigation.navigate('PitsPastOrders', {
          MID,
          MName: guest?.MName ?? MName,
          tblCode,
        });
        break;

      case 'TABLE':
        fetchMemberTables();
        break;

        case 'SLOT':
  fetchMemberSlots();
  break;

  case 'POINTS':
  fetchMemberPoints();
  break;

  case 'DROP':
  fetchMemberDrop();
  break;

      default:
        break;
    }
  }

  async function fetchMemberTables() {
    setShowMemberTables(true);
    setMemberTablesLoading(true);
    setMemberTablesError(null);
    try {
      const rows = await loadPitMemberTables(MID);
      setMemberTables(rows);
    } catch {
      setMemberTablesError('Failed to load table data.');
    } finally {
      setMemberTablesLoading(false);
    }
  }

  async function fetchMemberSlots() {
  setShowMemberSlots(true);
  setMemberSlotsLoading(true);
  setMemberSlotsError(null);
  try {
    const rows = await loadPitMemberSlots(MID);
    setMemberSlots(rows);
  } catch {
    setMemberSlotsError('Failed to load slot data.');
  } finally {
    setMemberSlotsLoading(false);
  }
}

async function fetchMemberPoints() {
  setShowMemberPoints(true);
  setMemberPointsLoading(true);
  setMemberPointsError(null);
  try {
    const rows = await loadPitMemberPoints(MID);
    setMemberPoints(rows);
  } catch {
    setMemberPointsError('Failed to load points data.');
  } finally {
    setMemberPointsLoading(false);
  }
}

async function fetchMemberDrop() {
  setShowMemberDrop(true);
  setMemberDropLoading(true);
  setMemberDropError(null);
  try {
    const rows = await loadPitMemberDrop(MID);
    setMemberDrop(rows);
  } catch {
    setMemberDropError('Failed to load drop data.');
  } finally {
    setMemberDropLoading(false);
  }
}

  function handlePlus() {
    setOrderContext({
      type:        'pits',
      memberId:    MID,
      memberName:  guest?.MName ?? MName,
      tableCode:   tblCode,
      pitName:     tblCode,
      currentDrop: drop?.CurrentDrop ?? null,
      points:      drop?.Coupon      ?? null,
      avgBet:      drop?.AvgBet      ?? null,
    });
    console.log('[PIT CUSTOMER] Order context set for MID:', MID);
    navigation.navigate('Menu');
  }

  const displayName  = guest?.MName     ?? MName ?? '?';
  const displayImage = guest?.MemImage2 ?? '';
  const initial      = displayName.charAt(0).toUpperCase();
  const hasImage     = displayImage.trim() !== '';
  const rating       = guest?.GuestRating ?? '';

  function Avatar() {
    if (hasImage) {
      return (
        <Image
          source={{ uri: `data:image/png;base64,${displayImage}` }}
          style={S.avatarImg}
          resizeMode="cover"
        />
      );
    }
    return (
      <View style={[S.avatarImg, S.avatarFallback]}>
        <Text style={S.avatarInitial}>{initial}</Text>
      </View>
    );
  }

  function StatRow({
    label, value, icon, color, isLast = false,
  }: {
    label: string; value: string; icon: string; color: string; isLast?: boolean;
  }) {
    return (
      <>
        <View style={S.statRow}>
          <View style={S.statRowLeft}>
            <View style={[S.statRowIcon, { backgroundColor: color + '18' }]}>
              <Ionicons name={icon as any} size={13} color={color} />
            </View>
            <Text style={S.statRowLabel}>{label}</Text>
          </View>
          <Text style={[S.statRowValue, { color }]}>{value}</Text>
        </View>
        {!isLast && <View style={S.statDivider} />}
      </>
    );
  }

  // ── All buttons including the Add Order synthetic button ──────────────────
  // Build a combined list: all ACTION_BUTTONS + the Add Order entry at the end
  const ADD_ORDER_KEY = '__ADD_ORDER__';
  const allButtons: (ActionBtn | { key: string; label: string; icon: string; color: string; bg: string; isAddOrder: boolean })[] = [
    ...ACTION_BUTTONS,
    {
      key:        ADD_ORDER_KEY,
      label:      'Add Order',
      icon:       'add-circle-outline',
      color:      colors.white,
      bg:         C.purpleDeep,
      isAddOrder: true,
    },
  ];

  function ActionButton({ btn }: { btn: typeof allButtons[number] }) {
    const isAddOrder = (btn as any).isAddOrder === true;
    return (
      <TouchableOpacity
        style={[S.actionBtn, isAddOrder && S.actionBtnAddOrder]}
        onPress={() => isAddOrder ? handlePlus() : handleAction(btn.key)}
        activeOpacity={0.82}
      >
        <View style={[S.actionIconWrap, { backgroundColor: isAddOrder ? colors.overlay.white20 : btn.bg }]}>
          <Ionicons name={btn.icon as any} size={22} color={btn.color} />
        </View>
        <Text style={[S.actionLabel, isAddOrder && S.actionLabelAddOrder]}>
          {btn.label}
        </Text>
        <View style={[S.actionArrow, { backgroundColor: isAddOrder ? colors.overlay.white20 : btn.bg }]}>
          <Ionicons name="chevron-forward" size={11} color={btn.color} />
        </View>
      </TouchableOpacity>
    );
  }

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
          <Text style={S.navTitle} numberOfLines={1}>{tblCode}</Text>
          <Text style={S.navSub}>KITCHEN ORDER TICKET</Text>
        </View>

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
            <Ionicons name="cloud-offline-outline" size={32} color={C.textLight} />
          </View>
          <Text style={S.emptyTitle}>Could not load details</Text>
          <Text style={S.emptySub}>{error}</Text>
          <TouchableOpacity style={S.retryBtn} onPress={fetchAll} activeOpacity={0.8}>
            <Ionicons name="refresh-outline" size={15} color={colors.white} />
            <Text style={S.retryBtnText}>Retry</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <ScrollView
          style={S.scroll}
          contentContainerStyle={S.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          {/* ── Combined profile + stats card ── */}
          <View style={S.profileCard}>

            <View style={S.profileBand} />

            <View style={S.profileTopRow}>
              <View style={S.avatarBorder}>
                <Avatar />
              </View>

              <View style={S.profileLeft}>
                <Text style={S.profileName} numberOfLines={2}>{displayName}</Text>
                <View style={S.memberIdChip}>
                  <Ionicons name="card-outline" size={11} color={C.amber} />
                  <Text style={S.memberIdText}>ID: {MID}</Text>
                </View>
              </View>

              <View style={S.profileRight}>
                <View style={S.tableBadge}>
                  <Ionicons name="easel-outline" size={11} color={C.purpleDeep} />
                  <Text style={S.tableBadgeText}>{tblCode}</Text>
                </View>

                {!!rating && (
                  <Animated.View style={[S.ratingBadge, { transform: [{ scale: bounceAnim }] }]}>
                    <Ionicons name="star" size={11} color={colors.white} />
                    <Text style={S.ratingBadgeText}>{rating}</Text>
                  </Animated.View>
                )}
              </View>
            </View>

            <View style={S.cardInnerDivider} />

            <View style={S.statsSection}>
              <StatRow
                label="Current Drop (Table)"
                value={fmt(drop?.CurrentDrop)}
                icon="easel-outline"
                color={C.stat.currentDrop}
              />
              <StatRow
                label="Points"
                value={fmt(drop?.Coupon)}
                icon="pricetag-outline"
                color={C.stat.points}
              />
              <StatRow
                label="Avg Bet"
                value={fmt(drop?.AvgBet)}
                icon="trending-up-outline"
                color={C.stat.avgBet}
              />
              <StatRow
                label="Actual Drop"
                value={fmt(drop?.Actual_Drop)}
                icon="arrow-down-circle-outline"
                color={C.stat.actualDrop}
                isLast
              />
            </View>
          </View>

          {/* ── Action buttons + Add Order in same grid ── */}
          <Text style={S.sectionTitle}>Actions</Text>
          <View style={S.actionsGrid}>
            {allButtons.map(btn => (
              <View key={btn.key} style={S.actionBtnWrap}>
                <ActionButton btn={btn} />
              </View>
            ))}
          </View>

          {/* ── Member Tables result ── */}
          {showMemberTables && (
            <View style={S.tableSection}>

              {/* Section header */}
              <View style={S.tableSectionHeader}>
                <View style={S.tableSectionIconWrap}>
                  <Ionicons name="easel-outline" size={15} color={C.purpleDeep} />
                </View>
                <Text style={S.tableSectionTitle}>Table Details</Text>
                <TouchableOpacity
                  onPress={() => setShowMemberTables(false)}
                  style={S.tableSectionClose}
                  activeOpacity={0.75}
                >
                  <Ionicons name="close" size={16} color={C.textMid} />
                </TouchableOpacity>
              </View>

              {memberTablesLoading ? (
                <View style={S.tableStateWrap}>
                  <LottieView
                    source={require('../../assets/animations/Loading_Animation.json')}
                    autoPlay
                    loop
                    style={{ width: 80, height: 80 }}
                  />
                </View>

              ) : memberTablesError ? (
                <View style={S.tableStateWrap}>
                  <Ionicons name="cloud-offline-outline" size={28} color={C.textLight} />
                  <Text style={S.tableStateText}>{memberTablesError}</Text>
                  <TouchableOpacity style={S.tableRetryBtn} onPress={fetchMemberTables} activeOpacity={0.8}>
                    <Ionicons name="refresh-outline" size={14} color={colors.white} />
                    <Text style={S.tableRetryText}>Retry</Text>
                  </TouchableOpacity>
                </View>

              ) : memberTables.length === 0 ? (
                <View style={S.tableStateWrap}>
                  <Ionicons name="grid-outline" size={28} color={C.textLight} />
                  <Text style={S.tableStateText}>No table data found</Text>
                </View>

              ) : (
  <View style={S.dataTable}>
    {/* Fixed header */}
    <View style={[S.dataRow, S.dataHeaderRow]}>
      {TABLE_COLS.map(col => (
        <Text key={col.key} style={[S.dataCell, S.dataHeaderCell, col.flex ? { flex: col.flex } : {}]} numberOfLines={1}>
          {col.label}
        </Text>
      ))}
    </View>

    {/* Data rows */}
    {memberTables.map((row, rowIdx) => (
      <View
        key={rowIdx}
        style={[S.dataRow, rowIdx % 2 === 1 && S.dataRowAlt, rowIdx === memberTables.length - 1 && S.dataRowLast]}
      >
        {TABLE_COLS.map(col => (
          <Text
            key={col.key}
            style={[S.dataCell, col.flex ? { flex: col.flex } : {}, col.color ? { color: col.color } : {}]}
            numberOfLines={2}
          >
            {col.format
              ? col.format(row[col.key])
              : (row[col.key] === null || row[col.key] === undefined || row[col.key] === '' ? '—' : String(row[col.key]))}
          </Text>
        ))}
      </View>
    ))}
  </View>
)}
              
            </View>
          )}

          {/* ── Member Slots result ── */}
{showMemberSlots && (
  <View style={S.tableSection}>

    <View style={S.tableSectionHeader}>
      <View style={S.tableSectionIconWrap}>
        <Ionicons name="game-controller-outline" size={15} color={C.purpleDeep} />
      </View>
      <Text style={S.tableSectionTitle}>Slot Details</Text>
      <TouchableOpacity
        onPress={() => setShowMemberSlots(false)}
        style={S.tableSectionClose}
        activeOpacity={0.75}
      >
        <Ionicons name="close" size={16} color={C.textMid} />
      </TouchableOpacity>
    </View>

    {memberSlotsLoading ? (
      <View style={S.tableStateWrap}>
        <LottieView
          source={require('../../assets/animations/Loading_Animation.json')}
          autoPlay
          loop
          style={{ width: 80, height: 80 }}
        />
      </View>

    ) : memberSlotsError ? (
      <View style={S.tableStateWrap}>
        <Ionicons name="cloud-offline-outline" size={28} color={C.textLight} />
        <Text style={S.tableStateText}>{memberSlotsError}</Text>
        <TouchableOpacity style={S.tableRetryBtn} onPress={fetchMemberSlots} activeOpacity={0.8}>
          <Ionicons name="refresh-outline" size={14} color={colors.white} />
          <Text style={S.tableRetryText}>Retry</Text>
        </TouchableOpacity>
      </View>

    ) : memberSlots.length === 0 ? (
      <View style={S.tableStateWrap}>
        <Ionicons name="game-controller-outline" size={28} color={C.textLight} />
        <Text style={S.tableStateText}>No slot data found</Text>
      </View>

    ) : (
      <View style={S.dataTable}>
        <View style={[S.dataRow, S.dataHeaderRow]}>
          {SLOT_COLS.map(col => (
            <Text
              key={col.key}
              style={[S.dataCell, S.dataHeaderCell, col.flex ? { flex: col.flex } : {}]}
              numberOfLines={1}
            >
              {col.label}
            </Text>
          ))}
        </View>

        {memberSlots.map((row, rowIdx) => (
          <View
            key={rowIdx}
            style={[S.dataRow, rowIdx % 2 === 1 && S.dataRowAlt, rowIdx === memberSlots.length - 1 && S.dataRowLast]}
          >
            {SLOT_COLS.map(col => (
              <Text
                key={col.key}
                style={[S.dataCell, col.flex ? { flex: col.flex } : {}, col.color ? { color: col.color } : {}]}
                numberOfLines={2}
              >
                {col.format
                  ? col.format(row[col.key])
                  : (row[col.key] === null || row[col.key] === undefined || row[col.key] === '' ? '—' : String(row[col.key]))}
              </Text>
            ))}
          </View>
        ))}
      </View>
    )}

  </View>
)}


{/* ── Member Points result ── */}
{showMemberPoints && (
  <View style={S.tableSection}>

    <View style={S.tableSectionHeader}>
      <View style={S.tableSectionIconWrap}>
        <Ionicons name="star-outline" size={15} color={C.purpleDeep} />
      </View>
      <Text style={S.tableSectionTitle}>Points Details</Text>
      <TouchableOpacity
        onPress={() => setShowMemberPoints(false)}
        style={S.tableSectionClose}
        activeOpacity={0.75}
      >
        <Ionicons name="close" size={16} color={C.textMid} />
      </TouchableOpacity>
    </View>

    {memberPointsLoading ? (
      <View style={S.tableStateWrap}>
        <LottieView
          source={require('../../assets/animations/Loading_Animation.json')}
          autoPlay
          loop
          style={{ width: 80, height: 80 }}
        />
      </View>

    ) : memberPointsError ? (
      <View style={S.tableStateWrap}>
        <Ionicons name="cloud-offline-outline" size={28} color={C.textLight} />
        <Text style={S.tableStateText}>{memberPointsError}</Text>
        <TouchableOpacity style={S.tableRetryBtn} onPress={fetchMemberPoints} activeOpacity={0.8}>
          <Ionicons name="refresh-outline" size={14} color={colors.white} />
          <Text style={S.tableRetryText}>Retry</Text>
        </TouchableOpacity>
      </View>

    ) : memberPoints.length === 0 ? (
      <View style={S.tableStateWrap}>
        <Ionicons name="star-outline" size={28} color={C.textLight} />
        <Text style={S.tableStateText}>No points data found</Text>
      </View>

    ) : (
      <View style={S.dataTable}>
        <View style={[S.dataRow, S.dataHeaderRow]}>
          {POINTS_COLS.map(col => (
            <Text
              key={col.key}
              style={[S.dataCell, S.dataHeaderCell, col.flex ? { flex: col.flex } : {}]}
              numberOfLines={1}
            >
              {col.label}
            </Text>
          ))}
        </View>

        {memberPoints.map((row, rowIdx) => (
          <View
            key={rowIdx}
            style={[S.dataRow, rowIdx % 2 === 1 && S.dataRowAlt, rowIdx === memberPoints.length - 1 && S.dataRowLast]}
          >
            {POINTS_COLS.map(col => (
              <Text
                key={col.key}
                style={[S.dataCell, col.flex ? { flex: col.flex } : {}, col.color ? { color: col.color } : {}]}
                numberOfLines={2}
              >
                {col.format
                  ? col.format(row[col.key])
                  : (row[col.key] === null || row[col.key] === undefined || row[col.key] === '' ? '—' : String(row[col.key]))}
              </Text>
            ))}
          </View>
        ))}
      </View>
    )}

  </View>
)}


{/* ── Member Drop result ── */}
{showMemberDrop && (
  <View style={S.tableSection}>

    <View style={S.tableSectionHeader}>
      <View style={S.tableSectionIconWrap}>
        <Ionicons name="trending-down-outline" size={15} color={C.purpleDeep} />
      </View>
      <Text style={S.tableSectionTitle}>Drop Details</Text>
      <TouchableOpacity
        onPress={() => setShowMemberDrop(false)}
        style={S.tableSectionClose}
        activeOpacity={0.75}
      >
        <Ionicons name="close" size={16} color={C.textMid} />
      </TouchableOpacity>
    </View>

    {memberDropLoading ? (
      <View style={S.tableStateWrap}>
        <LottieView
          source={require('../../assets/animations/Loading_Animation.json')}
          autoPlay
          loop
          style={{ width: 80, height: 80 }}
        />
      </View>

    ) : memberDropError ? (
      <View style={S.tableStateWrap}>
        <Ionicons name="cloud-offline-outline" size={28} color={C.textLight} />
        <Text style={S.tableStateText}>{memberDropError}</Text>
        <TouchableOpacity style={S.tableRetryBtn} onPress={fetchMemberDrop} activeOpacity={0.8}>
          <Ionicons name="refresh-outline" size={14} color={colors.white} />
          <Text style={S.tableRetryText}>Retry</Text>
        </TouchableOpacity>
      </View>

    ) : memberDrop.length === 0 ? (
      <View style={S.tableStateWrap}>
        <Ionicons name="trending-down-outline" size={28} color={C.textLight} />
        <Text style={S.tableStateText}>No drop data found</Text>
      </View>

    ) : (
      <View style={S.dataTable}>
        <View style={[S.dataRow, S.dataHeaderRow]}>
          {DROP_COLS.map(col => (
            <Text
              key={col.key}
              style={[S.dataCell, S.dataHeaderCell, col.flex ? { flex: col.flex } : {}]}
              numberOfLines={1}
            >
              {col.label}
            </Text>
          ))}
        </View>

        {memberDrop.map((row, rowIdx) => (
          <View
            key={rowIdx}
            style={[S.dataRow, rowIdx % 2 === 1 && S.dataRowAlt, rowIdx === memberDrop.length - 1 && S.dataRowLast]}
          >
            {DROP_COLS.map(col => (
              <Text
                key={col.key}
                style={[S.dataCell, col.flex ? { flex: col.flex } : {}, col.color ? { color: col.color } : {}]}
                numberOfLines={2}
              >
                {col.format
                  ? col.format(row[col.key])
                  : (row[col.key] === null || row[col.key] === undefined || row[col.key] === '' ? '—' : String(row[col.key]))}
              </Text>
            ))}
          </View>
        ))}
      </View>
    )}

  </View>
)}

        </ScrollView>
      )}
    </View>
  );
}

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
  navTitle: { fontSize: 18, fontWeight: '800', color: colors.white, letterSpacing: 1 },
  navSub:   { fontSize: 9, fontWeight: '600', color: colors.overlay.muted65, letterSpacing: 1.5, marginTop: 1 },

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
  scrollContent: { paddingBottom: 36 },

  // ── Profile card ───────────────────────────────────────────────────────────
  profileCard: {
    backgroundColor:  C.card,
    marginHorizontal: 14,
    marginTop:        14,
    borderRadius:     20,
    borderWidth:      1,
    borderColor:      C.border,
    overflow:         'hidden',
    shadowColor:      colors.shadow.card,
    shadowOffset:     { width: 0, height: 2 },
    shadowOpacity:    0.08,
    shadowRadius:     10,
    elevation:        4,
  },
  profileBand: {
    width:           '100%',
    height:          56,
    backgroundColor: C.purpleDeep,
  },
  profileTopRow: {
    flexDirection:     'row',
    alignItems:        'flex-start',
    paddingHorizontal: 16,
    paddingBottom:     16,
    marginTop:         -28,
    gap:               12,
  },
  avatarBorder: {
    width:         72,
    height:        72,
    borderRadius:  36,
    borderWidth:   3,
    borderColor:   colors.white,
    overflow:      'hidden',
    flexShrink:    0,
    shadowColor:   C.purpleDeep,
    shadowOffset:  { width: 0, height: 3 },
    shadowOpacity: 0.22,
    shadowRadius:  6,
    elevation:     5,
  },
  avatarImg:      { width: '100%', height: '100%' },
  avatarFallback: { backgroundColor: C.amber, alignItems: 'center', justifyContent: 'center' },
  avatarInitial:  { fontSize: 28, fontWeight: '900', color: colors.white },

  profileLeft: { flex: 1, marginTop: 30 },
  profileName: {
    fontSize:      15,
    fontWeight:    '800',
    color:         C.textDark,
    lineHeight:    20,
    marginBottom:  6,
    letterSpacing: 0.1,
  },
  memberIdChip: {
    flexDirection:     'row',
    alignItems:        'center',
    gap:               4,
    backgroundColor:   C.memberIdBg,
    alignSelf:         'flex-start',
    paddingHorizontal: 8,
    paddingVertical:   3,
    borderRadius:      20,
    borderWidth:       1,
    borderColor:       C.memberIdBorder,
  },
  memberIdText: { fontSize: 11, fontWeight: '700', color: C.memberIdText },

  profileRight: { alignItems: 'flex-end', gap: 8, marginTop: 30, paddingVertical: 10 },
  tableBadge: {
    flexDirection:     'row',
    alignItems:        'center',
    gap:               4,
    backgroundColor:   C.tableBadgeBg,
    paddingHorizontal: 8,
    paddingVertical:   4,
    borderRadius:      20,
    borderWidth:       1,
    borderColor:       C.tableBadgeBorder,
  },
  tableBadgeText: { fontSize: 11, fontWeight: '700', color: C.tableBadgeText },
  ratingBadge: {
    flexDirection:     'row',
    alignItems:        'center',
    gap:               4,
    backgroundColor:   C.ratingBg,
    paddingHorizontal: 10,
    paddingVertical:   5,
    borderRadius:      20,
    shadowColor:       C.ratingShadow,
    shadowOffset:      { width: 0, height: 2 },
    shadowOpacity:     0.4,
    shadowRadius:      6,
    elevation:         4,
  },
  ratingBadgeText: { fontSize: 11, fontWeight: '900', color: colors.white, letterSpacing: 0.5 },

  cardInnerDivider: { height: 1, backgroundColor: C.border, marginHorizontal: 16, marginBottom: 4 },

  statsSection: { paddingBottom: 4 },
  statRow: {
    flexDirection:     'row',
    alignItems:        'center',
    justifyContent:    'space-between',
    paddingHorizontal: 16,
    paddingVertical:   4,
  },
  statRowLeft:  { flexDirection: 'row', alignItems: 'center', gap: 10, flex: 1 },
  statRowIcon:  { width: 28, height: 28, borderRadius: 7, alignItems: 'center', justifyContent: 'center' },
  statRowLabel: { fontSize: 15, fontWeight: '800', color: C.textDark },
  statRowValue: { fontSize: 16, fontWeight: '800', letterSpacing: -0.3 },
  statDivider:  { height: 1, backgroundColor: C.border, marginLeft: 54 },

  // ── Section title ──────────────────────────────────────────────────────────
  sectionTitle: {
    fontSize:         11,
    fontWeight:       '700',
    color:            C.textMid,
    letterSpacing:    1.5,
    textTransform:    'uppercase',
    marginTop:        20,
    marginBottom:     10,
    marginHorizontal: 18,
  },

  // ── Actions grid — 3 equal columns, fixed height per card ─────────────────
  actionsGrid: {
    flexDirection:    'row',
    flexWrap:         'wrap',
    marginHorizontal: 14,
    marginBottom:     24,
    gap:              10,
  },

  // Each wrapper is exactly 1/3 of the row minus gaps: (100% - 2×10) / 3
  actionBtnWrap: {
    width:  '30%',
    flexGrow: 1,
  },

  actionBtn: {
    backgroundColor: C.card,
    borderRadius:    14,
    borderWidth:     1,
    borderColor:     C.border,
    padding:         14,
    height:          110,           // fixed height — all cards identical
    alignItems:      'flex-start',
    justifyContent:  'space-between',
    shadowColor:     colors.shadow.card,
    shadowOffset:    { width: 0, height: 1 },
    shadowOpacity:   0.07,
    shadowRadius:    6,
    elevation:       2,
    position:        'relative',
  },

  // Add Order card — same size, purple background
  actionBtnAddOrder: {
    backgroundColor: C.purpleDeep,
    borderColor:     C.purpleDeep,
    shadowColor:     C.purpleDeep,
    shadowOpacity:   0.35,
    elevation:       6,
  },

  actionIconWrap: {
    width:          46,
    height:         46,
    borderRadius:   13,
    alignItems:     'center',
    justifyContent: 'center',
  },
  actionLabel: {
    fontSize:      13,
    fontWeight:    '700',
    color:         C.textDark,
    letterSpacing: -0.1,
    marginTop:     2,
  },
  actionLabelAddOrder: {
    color: colors.white,
  },
  actionArrow: {
    position:      'absolute',
    top:           10,
    right:         10,
    width:         22,
    height:        22,
    borderRadius:  11,
    alignItems:    'center',
    justifyContent:'center',
  },

  // ── Centre states ──────────────────────────────────────────────────────────
  centerWrap:    { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 12 },
  loadingText:   { fontSize: 14, color: C.textMid, fontWeight: '500' },
  emptyIconWrap: {
    width:           64,
    height:          64,
    borderRadius:    32,
    backgroundColor: C.bg,
    alignItems:      'center',
    justifyContent:  'center',
    marginBottom:    4,
  },
  emptyTitle:   { fontSize: 15, fontWeight: '600', color: C.textMid },
  emptySub:     { fontSize: 12, color: C.textLight, textAlign: 'center' },
  retryBtn: {
    flexDirection:     'row',
    alignItems:        'center',
    gap:               6,
    backgroundColor:   C.purpleDeep,
    paddingHorizontal: 20,
    paddingVertical:   10,
    borderRadius:      20,
    marginTop:         4,
  },
  retryBtnText: { fontSize: 13, fontWeight: '700', color: colors.white },

  // ── Nav cart ───────────────────────────────────────────────────────────────
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
  // ── Member Tables section ──────────────────────────────────────────────────
  tableSection: {
    marginHorizontal: 14,
    marginTop:        16,
    marginBottom:     8,
    backgroundColor:  C.card,
    borderRadius:     16,
    borderWidth:      1,
    borderColor:      C.border,
    overflow:         'hidden',
    shadowColor:      colors.shadow.card,
    shadowOffset:     { width: 0, height: 2 },
    shadowOpacity:    0.07,
    shadowRadius:     8,
    elevation:        3,
  },
  tableSectionHeader: {
    flexDirection:     'row',
    alignItems:        'center',
    gap:               10,
    paddingHorizontal: 14,
    paddingVertical:   12,
    borderBottomWidth: 1,
    borderBottomColor: C.border,
  },
  tableSectionIconWrap: {
    width:           28,
    height:          28,
    borderRadius:    8,
    backgroundColor: C.memberIdBg,
    alignItems:      'center',
    justifyContent:  'center',
  },
  tableSectionTitle: {
    flex:          1,
    fontSize:      13,
    fontWeight:    '800',
    color:         C.textDark,
    letterSpacing: 0.2,
  },
  tableSectionClose: {
    width:           26,
    height:          26,
    borderRadius:    13,
    backgroundColor: C.border,
    alignItems:      'center',
    justifyContent:  'center',
  },
  tableStateWrap: {
    alignItems:     'center',
    justifyContent: 'center',
    gap:            8,
    paddingVertical: 28,
  },
  tableStateText: { fontSize: 13, color: C.textLight, fontWeight: '500' },
  tableRetryBtn: {
    flexDirection:     'row',
    alignItems:        'center',
    gap:               6,
    backgroundColor:   C.purpleDeep,
    paddingHorizontal: 14,
    paddingVertical:   7,
    borderRadius:      20,
    marginTop:         4,
  },
  tableRetryText: { fontSize: 12, fontWeight: '700', color: colors.white },

  // ── Data table ─────────────────────────────────────────────────────────────
  dataTable:    { width: '100%' },
  dataHeaderRow:{ backgroundColor: C.purpleDeep },
  dataRow: {
    flexDirection:  'row',
    borderBottomWidth: 1,
    borderBottomColor: C.border,
  },
  dataRowAlt:  { backgroundColor: C.memberIdBg },
  dataRowLast: { borderBottomWidth: 0 },
  dataCell: {
    flex:              1,
    fontSize:          11,
    color:             C.textDark,
    fontWeight:        '500',
    paddingHorizontal: 10,
    paddingVertical:   9,
    borderRightWidth:  1,
    borderRightColor:  C.border,
  },
  dataHeaderCell: {
    color:      colors.white,
    fontWeight: '800',
    fontSize:   10,
    letterSpacing: 0.3,
  },
});