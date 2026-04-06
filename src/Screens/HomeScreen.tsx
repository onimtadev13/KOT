import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  StatusBar,
  Platform,
} from 'react-native';
import { DrawerActions, useNavigation, useFocusEffect } from '@react-navigation/native';
import { Ionicons } from '@react-native-vector-icons/ionicons';
import { useAppStore } from '../Store/store';
import colors from '../themes/colors';
import { loadButtonVisibility } from '../Api/api';
// Add these imports at the top
import { BackHandler } from 'react-native';
import MessageBox from '../Components/MessageBox'; // adjust path as needed

// ─────────────────────────────────────────────────────────────────────────────
// Button definitions
// ─────────────────────────────────────────────────────────────────────────────
type OrderButton = {
  key:   string;
  label: string;
  icon:  string;
  color: string;
  bg:    string;
};

const ORDER_BUTTONS: OrderButton[] = [
  { key: 'GUEST',           label: 'Guest',          icon: 'person-outline',     color: colors.buttons.guest.color,          bg: colors.buttons.guest.bg          },
  { key: 'VISITOR',         label: 'Visitor',         icon: 'walk-outline',       color: colors.buttons.visitor.color,        bg: colors.buttons.visitor.bg        },
  { key: 'EXECUTIVE_STAFF', label: 'Executive Staff', icon: 'briefcase-outline',  color: colors.buttons.executiveStaff.color, bg: colors.buttons.executiveStaff.bg },
  { key: 'PITS',            label: 'Pits',            icon: 'grid-outline',       color: colors.buttons.pits.color,           bg: colors.buttons.pits.bg           },
  { key: 'TABLES',          label: 'Tables',          icon: 'restaurant-outline', color: colors.buttons.tables.color,         bg: colors.buttons.tables.bg         },
  { key: 'QR_SCAN',         label: 'QR Scan',         icon: 'qr-code-outline',    color: colors.buttons.qrScan.color,         bg: colors.buttons.qrScan.bg         },
  { key: 'VIP',             label: 'VIP',             icon: 'star-outline',       color: colors.buttons.vip.color,            bg: colors.buttons.vip.bg            },
];

export default function HomeScreen({ navigation }: { navigation: any }) {
  const nav            = useNavigation<any>();
  const session        = useAppStore(state => state.session);
  const device         = useAppStore(state => state.device);
  const clearSession   = useAppStore(state => state.clearSession);
  const orderItemCount = useAppStore(state => state.orderItemCount);

  const empName   = session?.Emp_Name ?? 'User';
  const itemCount = orderItemCount();

  // Visibility map — keyed by button key, value = isActive from API
  const [buttonVisible, setButtonVisible] = useState<Record<string, boolean>>({});

  // Re-fetch every time the screen comes into focus
  useFocusEffect(
    useCallback(() => {
      loadButtonVisibility(
        device?.Device_Id ?? 0,
        device?.Doc_No   ?? '',
        device?.UniqueId ?? '',
      ).then(map => {
        if (Object.keys(map).length > 0) {
          setButtonVisible(map);
        }
      });
    }, [device]),
  );

  function handleLogout() {
    clearSession();
    navigation.replace('Login');
  }

  function handleOrderButton(key: string) {
    switch (key) {
      case 'GUEST':           navigation.navigate('GuestDetails');   break;
      case 'VISITOR':         navigation.navigate('VisitorDetails'); break;
      case 'EXECUTIVE_STAFF': navigation.navigate('ExecutiveStaff'); break;
      case 'PITS':            navigation.navigate('PitsDetails');    break;
      case 'TABLES':          navigation.navigate('Tables');         break;
      default: break;
    }
  }

  // Only render buttons that are active per API
  const visibleButtons = ORDER_BUTTONS.filter(btn => buttonVisible[btn.key] ?? false);

  return (
    <View style={S.flex}>
      <StatusBar barStyle="light-content" backgroundColor={colors.primary} />

      {/* ── Header ── */}
      <View style={S.header}>

        {/* Top row */}
        <View style={S.headerRow}>
          <TouchableOpacity
            style={S.iconBtn}
            onPress={() => nav.dispatch(DrawerActions.openDrawer())}
            activeOpacity={0.75}
          >
            <Ionicons name="menu-outline" size={22} color={colors.white} />
          </TouchableOpacity>

          <View style={S.headerTitleWrap}>
            <Text style={S.headerTitle}>KOT</Text>
            <Text style={S.headerSub}>Kitchen Order Ticket</Text>
          </View>

          <View style={S.headerActions}>
            <TouchableOpacity style={S.iconBtn} onPress={() => navigation.navigate('CurrentOrder')}>
              <Ionicons name="cart-outline" size={20} color={colors.white} />
            </TouchableOpacity>
            <TouchableOpacity style={S.iconBtn} onPress={handleLogout}>
              <Ionicons name="log-out-outline" size={20} color={colors.white} />
            </TouchableOpacity>
          </View>
        </View>

        {/* Greeting row */}
        <View style={S.greetRow}>
          <View style={S.greetAvatar}>
            <Text style={S.greetAvatarText}>{empName.charAt(0).toUpperCase()}</Text>
          </View>

          <View style={S.greetInfo}>
            <Text style={S.greetName}>Hello, {empName}</Text>
            <Text style={S.greetRole}>{session?.TabLocation ?? 'Kitchen Staff'}</Text>
          </View>

          {device?.Doc_No ? (
            <View style={S.docChip}>
              <View style={S.docChipIconRow}>
                <Ionicons name="document-text-outline" size={11} color={colors.docChip.labelText} />
                <Text style={S.docChipLabel}>Doc No</Text>
              </View>
              <Text style={S.docChipValue}>{device.Doc_No}</Text>
            </View>
          ) : null}
        </View>
      </View>

      {/* ── Scrollable grid ── */}
      <ScrollView
        style={S.scroll}
        contentContainerStyle={S.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <View style={S.grid}>
          {visibleButtons.map((btn, index) => {
            const isLast    = index === visibleButtons.length - 1;
            const isOdd     = visibleButtons.length % 2 !== 0;
            const fullWidth = isLast && isOdd;

            return (
              <TouchableOpacity
                key={btn.key}
                style={[S.gridCard, fullWidth && S.gridCardFull]}
                onPress={() => handleOrderButton(btn.key)}
                activeOpacity={0.82}
              >
                <View style={[S.cardIconWrap, { backgroundColor: btn.bg }]}>
                  <Ionicons name={btn.icon as any} size={26} color={btn.color} />
                </View>

                <Text style={[S.cardLabel, fullWidth && S.cardLabelFull]}>
                  {btn.label}
                </Text>

                <View style={[S.cardArrow, { backgroundColor: btn.bg }]}>
                  <Ionicons name="chevron-forward" size={12} color={btn.color} />
                </View>
              </TouchableOpacity>
            );
          })}
        </View>
      </ScrollView>
    </View>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Styles
// ─────────────────────────────────────────────────────────────────────────────
const S = StyleSheet.create({
  flex: { flex: 1, backgroundColor: colors.background },

  header: {
    backgroundColor:         colors.primary,
    paddingTop:              Platform.OS === 'ios' ? 56 : 36,
    paddingBottom:           24,
    paddingHorizontal:       20,
    borderBottomLeftRadius:  28,
    borderBottomRightRadius: 28,
  },

  headerRow: {
    flexDirection: 'row',
    alignItems:    'center',
    marginBottom:  18,
    gap:           10,
  },
  headerTitleWrap: { flex: 1 },
  headerTitle: {
    fontSize:      22,
    fontWeight:    '800',
    color:         colors.white,
    letterSpacing: 2,
  },
  headerSub: {
    fontSize:      10,
    color:         colors.overlay.muted70,
    letterSpacing: 1,
    marginTop:     1,
  },
  headerActions: { flexDirection: 'row', alignItems: 'center', gap: 8 },

  iconBtn: {
    width:           36,
    height:          36,
    borderRadius:    10,
    backgroundColor: colors.overlay.white15,
    alignItems:      'center',
    justifyContent:  'center',
  },

  greetRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },

  greetAvatar: {
    width:           44,
    height:          44,
    borderRadius:    22,
    backgroundColor: colors.overlay.gold15,
    alignItems:      'center',
    justifyContent:  'center',
    borderWidth:     2,
    borderColor:     colors.overlay.gold45,
  },
  greetAvatarText: { fontSize: 18, fontWeight: '800', color: colors.gold },

  greetInfo: { flex: 1 },
  greetName: { fontSize: 15, fontWeight: '700', color: colors.white, letterSpacing: 0.1 },
  greetRole: { fontSize: 11, color: colors.overlay.muted65, marginTop: 2 },

  docChip: {
    backgroundColor:   colors.docChip.bg,
    borderRadius:      14,
    paddingHorizontal: 14,
    paddingVertical:   9,
    alignItems:        'center',
    minWidth:          88,
    shadowColor:       '#000000',
    shadowOffset:      { width: 0, height: 3 },
    shadowOpacity:     0.35,
    shadowRadius:      6,
    elevation:         5,
  },
  docChipIconRow: {
    flexDirection: 'row',
    alignItems:    'center',
    gap:           4,
    marginBottom:  3,
  },
  docChipLabel: {
    fontSize:      9,
    color:         colors.docChip.labelText,
    fontWeight:    '700',
    letterSpacing: 0.9,
    textTransform: 'uppercase',
  },
  docChipValue: {
    fontSize:      19,
    color:         colors.docChip.valueText,
    fontWeight:    '900',
    letterSpacing: -0.4,
    lineHeight:    22,
  },

  scroll:        { flex: 1 },
  scrollContent: { paddingBottom: 32 },

  grid: {
    flexDirection:    'row',
    flexWrap:         'wrap',
    paddingHorizontal: 16,
    paddingTop:       16,
    gap:              12,
  },

  gridCard: {
    width:           '47%',
    backgroundColor: colors.card,
    borderRadius:    16,
    borderWidth:     1,
    borderColor:     colors.border,
    padding:         16,
    alignItems:      'flex-start',
    shadowColor:     colors.shadow.card,
    shadowOffset:    { width: 0, height: 2 },
    shadowOpacity:   0.07,
    shadowRadius:    8,
    elevation:       3,
    position:        'relative',
  },
  gridCardFull: {
    width:         '100%',
    flexDirection: 'row',
    alignItems:    'center',
    gap:           16,
  },

  cardIconWrap: {
    width:          52,
    height:         52,
    borderRadius:   14,
    alignItems:     'center',
    justifyContent: 'center',
    marginBottom:   12,
  },
  cardLabel: {
    fontSize:      18,
    fontWeight:    '700',
    color:         colors.text.dark,
    letterSpacing: -0.2,
  },
  cardLabelFull: { flex: 1 },

  cardArrow: {
    position:       'absolute',
    top:            12,
    right:          12,
    width:          22,
    height:         22,
    borderRadius:   11,
    alignItems:     'center',
    justifyContent: 'center',
  },
});