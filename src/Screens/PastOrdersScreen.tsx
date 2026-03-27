import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  FlatList,
  StatusBar,
  Platform,
  ActivityIndicator,
  Animated,
} from 'react-native';
import { Ionicons } from '@react-native-vector-icons/ionicons';
import { useAppStore } from '../Store/store';
import { loadPastOrders, PastOrderResult } from '../Api/api';
import { DrawerActions, useNavigation, useFocusEffect } from '@react-navigation/native';

// ─────────────────────────────────────────────────────────────────────────────
// PastOrdersScreen
// ─────────────────────────────────────────────────────────────────────────────
export default function PastOrdersScreen({ navigation }: { navigation: any }) {
  const device = useAppStore(state => state.device);
  const nav = useNavigation<any>();
  const [orders,  setOrders]  = useState<PastOrderResult[]>([]);
  const [loading, setLoading] = useState(true);
  const [error,   setError]   = useState<string | null>(null);

  useEffect(() => {
    async function fetchOrders() {
      setLoading(true);
      setError(null);
      try {
        const uniqueId = device?.UniqueId ?? '';
        const docNo    = device?.Doc_No   ?? '';
        const result   = await loadPastOrders(uniqueId, docNo);
        setOrders(result);
      } catch (e: any) {
        setError('Failed to load past orders.');
      } finally {
        setLoading(false);
      }
    }
    fetchOrders();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  function handleView(order: PastOrderResult) {
    console.log('[PAST ORDERS] View:', JSON.stringify(order, null, 2));
    // TODO: navigate to order detail screen
  }

  // ─────────────────────────────────────────────────────────────────────────
  // Single field cell used in both columns
  // ─────────────────────────────────────────────────────────────────────────
  function Field({
    icon,
    iconColor,
    iconBg,
    label,
    value,
    align = 'left',
  }: {
    icon: string;
    iconColor: string;
    iconBg: string;
    label: string;
    value: string;
    align?: 'left' | 'right';
  }) {
    return (
      <View style={[S.field, align === 'right' && S.fieldRight]}>
        <View style={[S.fieldIcon, { backgroundColor: iconBg }]}>
          <Ionicons name={icon as any} size={13} color={iconColor} />
        </View>
        <View style={align === 'right' ? S.fieldTextRight : S.fieldTextLeft}>
          <Text style={S.fieldLabel}>{label}</Text>
          <Text
            style={S.fieldValue}
            numberOfLines={1}
            ellipsizeMode="tail"
          >
            {value || '—'}
          </Text>
        </View>
      </View>
    );
  }

  // ─────────────────────────────────────────────────────────────────────────
  // Order card
  // ─────────────────────────────────────────────────────────────────────────
  function OrderCard({ item, index }: { item: PastOrderResult; index: number }) {
    const slideAnim = useRef(new Animated.Value(22)).current;
    const fadeAnim  = useRef(new Animated.Value(0)).current;

    useEffect(() => {
      Animated.parallel([
        Animated.timing(slideAnim, {
          toValue: 0, duration: 280,
          delay: Math.min(index * 35, 460),
          useNativeDriver: true,
        }),
        Animated.timing(fadeAnim, {
          toValue: 1, duration: 280,
          delay: Math.min(index * 35, 460),
          useNativeDriver: true,
        }),
      ]).start();
    }, []);

    // Real API fields
    const receipt  = String(item.Receipt_No  ?? item.Receipt   ?? item.Recpt_No  ?? '—');
    const guestId  = String(item.GuestID     ?? item.Guest_ID  ?? '—');
    const steward  = String(item.Steward     ?? item.StewardName ?? '—');
    const operator = String(item.LoginBy     ?? item.Login_By  ?? item.Operator  ?? '—');
    const dateTime = String(item.Tr_Date     ?? item.Date_Time ?? item.Trans_Date ?? '—');
    const table    = String(item.TBL_No      ?? item.Table_No  ?? '');

    return (
      <Animated.View style={{ opacity: fadeAnim, transform: [{ translateY: slideAnim }] }}>
        <View style={S.card}>

          {/* ── Card header ── */}
          <View style={S.cardHead}>
            <View style={S.headLeft}>
              <View style={S.numBubble}>
                <Text style={S.numText}>{index + 1}</Text>
              </View>
              {table ? (
                <View style={S.tablePill}>
                  <Ionicons name="grid-outline" size={10} color={TEAL} />
                  <Text style={S.tablePillText}>{table}</Text>
                </View>
              ) : null}
            </View>
            <TouchableOpacity
              style={S.viewBtn}
              onPress={() => handleView(item)}
              activeOpacity={0.78}
            >
              <Text style={S.viewBtnText}>VIEW</Text>
              <Ionicons name="chevron-forward" size={13} color={WHITE} />
            </TouchableOpacity>
          </View>

          {/* ── Two-column body ── */}
          <View style={S.body}>

            {/* LEFT column: Receipt · Steward · Date Time */}
            <View style={S.colLeft}>
              <Field
                icon="receipt-outline"
                iconColor={INDIGO}
                iconBg={INDIGO_BG}
                label="Receipt"
                value={receipt}
              />
              {/* <View style={S.colDivider} /> */}
              <Field
                icon="people-outline"
                iconColor={AMBER}
                iconBg={AMBER_BG}
                label="Steward"
                value={steward}
              />
              {/* <View style={S.colDivider} /> */}
              <Field
                icon="time-outline"
                iconColor={ROSE}
                iconBg={ROSE_BG}
                label="Date Time"
                value={dateTime}
              />
            </View>

            {/* Vertical separator */}
            {/* <View style={S.vSep} /> */}

            {/* RIGHT column: Guest ID · Operator */}
            <View style={S.colRight}>
              <Field
                icon="person-circle-outline"
                iconColor={TEAL}
                iconBg={TEAL_BG}
                label="Guest ID"
                value={guestId}
                align="right"
              />
              {/* <View style={S.colDivider} /> */}
              <Field
                icon="key-outline"
                iconColor={GREEN}
                iconBg={GREEN_BG}
                label="Operator"
                value={operator}
                align="right"
              />
            </View>

          </View>
        </View>
      </Animated.View>
    );
  }

  // ─────────────────────────────────────────────────────────────────────────
  // Root
  // ─────────────────────────────────────────────────────────────────────────
  return (
    <View style={S.root}>
      <StatusBar barStyle="light-content" backgroundColor={NAVY} />

      {/* ── Nav bar ── */}
      <View style={S.nav}>
        {/* <TouchableOpacity style={S.backBtn} onPress={() => navigation.goBack()} activeOpacity={0.75}>
          <Ionicons name="arrow-back" size={19} color={WHITE} />
        </TouchableOpacity> */}
         {/* Hamburger */}
          <TouchableOpacity
            style={S.iconBtn}
            onPress={() => nav.dispatch(DrawerActions.openDrawer())}
            activeOpacity={0.75}
          >
            <Ionicons name="menu-outline" size={22} color="#fff" />
          </TouchableOpacity>
        <View style={S.navMid}>
          <Text style={S.navTitle}>Past Orders</Text>
          {device?.Doc_No ? <Text style={S.navSub}>Doc # {device.Doc_No}</Text> : null}
        </View>
        {!loading && !error ? (
          <View style={S.countPill}>
            <Text style={S.countPillText}>{orders.length}</Text>
          </View>
        ) : (
          <View style={{ width: 48 }} />
        )}
      </View>

      {/* ── Info bar ── */}
      {!loading && !error && orders.length > 0 && (
        <View style={S.infoBar}>
          <Ionicons name="checkmark-circle" size={13} color={GREEN} />
          <Text style={S.infoBarText}>
            <Text style={S.infoBarBold}>{orders.length}</Text>
            {` record${orders.length !== 1 ? 's' : ''} found`}
          </Text>
        </View>
      )}

      {/* ── Content ── */}
      {loading ? (
        <View style={S.center}>
          <ActivityIndicator size="large" color={INDIGO} />
          <Text style={S.stateText}>Loading orders…</Text>
        </View>
      ) : error ? (
        <View style={S.center}>
          <View style={S.stateIconWrap}>
            <Ionicons name="cloud-offline-outline" size={28} color={MUTED} />
          </View>
          <Text style={S.stateTitle}>Could not load orders</Text>
          <Text style={S.stateSub}>{error}</Text>
        </View>
      ) : orders.length === 0 ? (
        <View style={S.center}>
          <View style={S.stateIconWrap}>
            <Ionicons name="receipt-outline" size={28} color={MUTED} />
          </View>
          <Text style={S.stateTitle}>No past orders</Text>
          <Text style={S.stateSub}>Nothing found for this document</Text>
        </View>
      ) : (
        <FlatList
          data={orders}
          keyExtractor={(item, i) => String(item.Receipt_No ?? item.Receipt ?? i)}
          renderItem={({ item, index }) => <OrderCard item={item} index={index} />}
          contentContainerStyle={S.list}
          showsVerticalScrollIndicator={false}
          initialNumToRender={12}
          maxToRenderPerBatch={12}
          windowSize={8}
        />
      )}
    </View>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Tokens
// ─────────────────────────────────────────────────────────────────────────────
const NAVY      = '#0D1B2A';
const INDIGO    = '#4F46E5';
const INDIGO_BG = '#EEF2FF';
const TEAL      = '#0D9488';
const TEAL_BG   = '#F0FDFA';
const AMBER     = '#D97706';
const AMBER_BG  = '#FFFBEB';
const GREEN     = '#16A34A';
const GREEN_BG  = '#F0FDF4';
const ROSE      = '#E11D48';
const ROSE_BG   = '#FFF1F2';
const WHITE     = '#FFFFFF';
const BG        = '#F1F5F9';
const BORDER    = '#E2E8F0';
const MUTED     = '#94A3B8';

// ─────────────────────────────────────────────────────────────────────────────
// Styles
// ─────────────────────────────────────────────────────────────────────────────
const S = StyleSheet.create({
  root: { flex: 1, backgroundColor: BG },

  // ── Nav ──
  nav: {
    backgroundColor: NAVY,
    paddingTop: Platform.OS === 'ios' ? 54 : 36,
    paddingBottom: 14,
    paddingHorizontal: 16,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  backBtn: {
    width: 38, height: 38, borderRadius: 11,
    backgroundColor: 'rgba(255,255,255,0.1)',
    alignItems: 'center', justifyContent: 'center',
  },
  navMid:   { flex: 1 },
  navTitle: { fontSize: 19, fontWeight: '800', color: WHITE, letterSpacing: 0.3 },
  navSub:   { fontSize: 11, color: 'rgba(255,255,255,0.4)', marginTop: 2, fontWeight: '500' },
  countPill: {
    minWidth: 48, height: 28, borderRadius: 14,
    backgroundColor: INDIGO,
    alignItems: 'center', justifyContent: 'center',
    paddingHorizontal: 10,
  },
  countPillText: { fontSize: 13, fontWeight: '800', color: WHITE },

  // ── Info bar ──
  infoBar: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    backgroundColor: '#F0FDF4',
    paddingHorizontal: 16, paddingVertical: 8,
    borderBottomWidth: 1, borderBottomColor: '#BBFBCA',
  },
  infoBarText: { fontSize: 12, color: '#166534', fontWeight: '500' },
  infoBarBold: { fontWeight: '800' },

  // ── List ──
  list: { padding: 12, gap: 10, paddingBottom: 44 },

  // ── Card ──
  card: {
    backgroundColor: WHITE,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: BORDER,
    overflow: 'hidden',
    shadowColor: '#64748B',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.07,
    shadowRadius: 8,
    elevation: 3,
  },

  // Card header
  cardHead: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 14,
    paddingVertical: 10,
    backgroundColor: '#F8FAFC',
    borderBottomWidth: 1,
    borderBottomColor: BORDER,
  },
  headLeft: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  numBubble: {
    width: 28, height: 28, borderRadius: 9,
    backgroundColor: INDIGO_BG,
    alignItems: 'center', justifyContent: 'center',
  },
  numText: { fontSize: 12, fontWeight: '800', color: INDIGO },
  tablePill: {
    flexDirection: 'row', alignItems: 'center', gap: 5,
    backgroundColor: TEAL_BG,
    borderRadius: 20, paddingHorizontal: 9, paddingVertical: 4,
    borderWidth: 1, borderColor: '#CCFBF1',
  },
  tablePillText: { fontSize: 11, fontWeight: '700', color: TEAL },

  // VIEW button
  viewBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 4,
    backgroundColor: INDIGO,
    borderRadius: 9,
    paddingHorizontal: 14, paddingVertical: 7,
    shadowColor: INDIGO,
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.35,
    shadowRadius: 6,
    elevation: 5,
  },
  viewBtnText: { fontSize: 12, fontWeight: '800', color: WHITE, letterSpacing: 1.2 },

  // ── Two-column body ──
  body: {
    flexDirection: 'row',
    paddingVertical: 6,
  },

  // Left column (Receipt · Steward · Date Time) — wider
  colLeft: {
    flex: 55,
    paddingHorizontal: 12,
    paddingVertical: 6,
  },

  // Vertical divider between columns
  vSep: {
    width: 1,
    backgroundColor: BORDER,
    marginVertical: 8,
  },

  // Right column (Guest ID · Operator) — narrower
  colRight: {
    flex: 45,
    paddingHorizontal: 12,
    paddingVertical: 6,
  },

  // Thin divider between fields within a column
  colDivider: {
    height: 1,
    backgroundColor: '#F1F5F9',
    marginVertical: 2,
  },

  // ── Field cell ──
  field: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingVertical: 7,
  },
  fieldRight: {
    flexDirection: 'row-reverse',
  },
  fieldIcon: {
    width: 28, height: 28, borderRadius: 8,
    alignItems: 'center', justifyContent: 'center',
    flexShrink: 0,
  },
  fieldTextLeft: {
    flex: 1,
    alignItems: 'flex-start',
  },
  fieldTextRight: {
    flex: 1,
    alignItems: 'flex-end',
  },
  fieldLabel: {
    fontSize: 10,
    fontWeight: '600',
    color: '#64748B',
    textTransform: 'uppercase',
    letterSpacing: 0.4,
    marginBottom: 2,
  },
  fieldValue: {
    fontSize: 13,
    fontWeight: '800',
    color: '#0F172A',
    letterSpacing: 0.1,
  },

  // ── Center states ──
  center:       { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 10 },
  stateText:    { fontSize: 14, color: MUTED, fontWeight: '600' },
  stateIconWrap: {
    width: 60, height: 60, borderRadius: 30,
    backgroundColor: '#F1F5F9',
    alignItems: 'center', justifyContent: 'center', marginBottom: 4,
  },
  stateTitle: { fontSize: 15, fontWeight: '700', color: '#475569' },
  stateSub:   { fontSize: 12, color: MUTED, textAlign: 'center' },

iconBtn: {
    width: 36, height: 36, borderRadius: 10,
    backgroundColor: 'rgba(255,255,255,0.15)',
    alignItems: 'center', justifyContent: 'center',
  },

});