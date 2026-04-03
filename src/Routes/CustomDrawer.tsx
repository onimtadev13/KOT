import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Platform,
  Image,
} from 'react-native';
import { DrawerContentScrollView } from '@react-navigation/drawer';
import { Ionicons } from '@react-native-vector-icons/ionicons';
import { useAppStore } from '../Store/store';

// ─────────────────────────────────────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────────────────────────────────────
type DrawerItem = {
  key: string;
  label: string;
  icon: string;
  // screen name in RootStackParamList — undefined means not built yet
  screen?: string;
  badge?: string;
  badgeColor?: string;
};

type DrawerSection = {
  title: string;
  items: DrawerItem[];
};

// ─────────────────────────────────────────────────────────────────────────────
// Menu config
// Each screen value must match exactly the name in RootStackParamList
// ─────────────────────────────────────────────────────────────────────────────
const SECTIONS: DrawerSection[] = [
  {
    title: 'Orders',
    items: [
      { key: 'Guest',              label: 'Guest',                      icon: 'person-outline',          screen: 'Home'   },
      { key: 'Menu',               label: 'Menu',                       icon: 'book-outline',            screen: 'Menu'           },
      { key: 'CurrentOrder',       label: 'Current Order',              icon: 'receipt-outline',         screen: undefined        },
      { key: 'PastOrders',         label: 'Past Orders',                icon: 'time-outline',            screen: 'PastOrders'    },
      { key: 'ExecStaffPastOrder', label: 'Executive Staff Past Order', icon: 'briefcase-outline',       screen: undefined        },
    ],
  },
  {
    title: 'Management',
    items: [
      { key: 'Tables',    label: 'Tables',     icon: 'grid-outline',         screen: 'Tables' },
      { key: 'Steward',   label: 'Steward',    icon: 'people-outline',       screen: undefined },
      { key: 'Pits',      label: 'Pits',       icon: 'layers-outline',       screen: 'PitsDetails' },
      { key: 'Reprint',   label: 'Reprint',    icon: 'print-outline',        screen: undefined },
      { key: 'IssueNote', label: 'Issue Note', icon: 'alert-circle-outline', screen: undefined },
    ],
  },
  {
    title: 'General',
    items: [
      { key: 'Settings', label: 'Settings', icon: 'settings-outline', screen: 'Settings' },
    ],
  },
];

// ─────────────────────────────────────────────────────────────────────────────
// Single menu row
// ─────────────────────────────────────────────────────────────────────────────
function DrawerRow({
  item,
  onPress,
  isLast,
}: {
  item: DrawerItem;
  onPress: () => void;
  isLast: boolean;
}) {
  return (
    <>
      <TouchableOpacity style={S.row} onPress={onPress} activeOpacity={0.7}>
        <View style={S.rowIconWrap}>
          <Ionicons name={item.icon as any} size={20} color={ICON_COLOR} />
        </View>
        <Text style={S.rowLabel}>{item.label}</Text>
        {item.badge ? (
          <View style={[S.badge, { backgroundColor: item.badgeColor ?? PURPLE }]}>
            <Text style={S.badgeText}>{item.badge}</Text>
          </View>
        ) : (
          <Ionicons name="chevron-forward" size={16} color="#D1D5DB" />
        )}
      </TouchableOpacity>
      {!isLast && <View style={S.rowDivider} />}
    </>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// CustomDrawer
// ─────────────────────────────────────────────────────────────────────────────
export default function CustomDrawer(props: any) {
  const session      = useAppStore(state => state.session);
  const clearSession = useAppStore(state => state.clearSession);

  const empName = session?.Emp_Name    ?? 'User';
  const tabLoc  = session?.TabLocation ?? 'Kitchen Staff';

  function handleNav(item: DrawerItem) {
  props.navigation.closeDrawer();
  if (!item.screen) return;

  setTimeout(() => {
    // Navigate inside the App stack
    props.navigation.navigate('App', {
      screen: item.screen,
    });
  }, 100);
}

  function handleLogout() {
    clearSession();
    props.navigation.closeDrawer();
    props.navigation.replace('Login');
  }

  return (
    <View style={S.root}>

      {/* ── Purple header ── */}
      <View style={S.header}>
        <View style={S.avatarWrap}>
          <Image
            source={require('../../assets/icons/bellagio_logo.jpg')}
            style={S.logoImage}
            resizeMode="contain"
          />
        </View>
        <View style={S.headerInfo}>
          <Text style={S.headerName}>{empName}</Text>
          <Text style={S.headerRole}>{tabLoc}</Text>
        </View>
      </View>

      {/* ── Scrollable menu body ── */}
      <DrawerContentScrollView
        {...props}
        contentContainerStyle={S.scrollBody}
        showsVerticalScrollIndicator={false}
      >
        {SECTIONS.map((section, si) => (
          <View key={section.title} style={[S.section, si > 0 && S.sectionGap]}>
            <Text style={S.sectionTitle}>{section.title}</Text>
            <View style={S.sectionCard}>
              {section.items.map((item, idx) => (
                <DrawerRow
                  key={item.key}
                  item={item}
                  onPress={() => handleNav(item)}
                  isLast={idx === section.items.length - 1}
                />
              ))}
            </View>
          </View>
        ))}

        <Text style={S.version}>KOT System · v2.0</Text>
      </DrawerContentScrollView>

      {/* ── Logout pinned at bottom ── */}
      <View style={S.logoutWrap}>
        <View style={S.logoutDivider} />
        <TouchableOpacity style={S.logoutBtn} onPress={handleLogout} activeOpacity={0.8}>
          <View style={S.logoutIconWrap}>
            <Ionicons name="log-out-outline" size={20} color="#EF4444" />
          </View>
          <Text style={S.logoutLabel}>Logout</Text>
        </TouchableOpacity>
      </View>

    </View>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Tokens
// ─────────────────────────────────────────────────────────────────────────────
const PURPLE     = '#3D013C';
const WHITE      = '#FFFFFF';
const BG         = '#F5F6FA';
const CARD       = '#FFFFFF';
const BORDER     = '#EDF0F4';
const TEXT_DARK  = '#1A1D2E';
const TEXT_MID   = '#6B7280';
const ICON_COLOR = '#64748B';

const S = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: BG,
  },

  // ── Header ──
  header: {
    backgroundColor: PURPLE,
    paddingTop: Platform.OS === 'ios' ? 60 : 44,
    paddingBottom: 24,
    paddingHorizontal: 20,
    borderBottomRightRadius: 28,
  },
  avatarWrap: {
    alignSelf: 'flex-start',
    marginBottom: 14,
  },
  logoImage: {
    width: 120,
    height: 56,
    borderRadius: 10,
  },
  headerInfo: {
    marginBottom: 4,
  },
  headerName: {
    fontSize: 20,
    fontWeight: '800',
    color: WHITE,
    letterSpacing: 0.2,
  },
  headerRole: {
    fontSize: 12,
    color: 'rgba(255,255,255,0.65)',
    marginTop: 3,
    lineHeight: 16,
  },

  // ── Scroll body ──
  scrollBody: {
    paddingHorizontal: 16,
    paddingTop: 20,
    paddingBottom: 16,
  },

  // ── Section ──
  section: {},
  sectionGap: { marginTop: 20 },
  sectionTitle: {
    fontSize: 11,
    fontWeight: '700',
    color: TEXT_MID,
    letterSpacing: 1.5,
    textTransform: 'uppercase',
    marginBottom: 8,
    paddingLeft: 4,
  },
  sectionCard: {
    backgroundColor: CARD,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: BORDER,
    overflow: 'hidden',
    shadowColor: '#9CA3AF',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.07,
    shadowRadius: 8,
    elevation: 2,
  },

  // ── Row ──
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 14,
    gap: 14,
  },
  rowIconWrap: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: '#F3F4F6',
    alignItems: 'center',
    justifyContent: 'center',
  },
  rowLabel: {
    flex: 1,
    fontSize: 15,
    fontWeight: '500',
    color: TEXT_DARK,
    letterSpacing: 0.1,
  },
  rowDivider: {
    height: 1,
    backgroundColor: BORDER,
    marginLeft: 66,
  },

  // Badge
  badge: {
    borderRadius: 20,
    paddingHorizontal: 8,
    paddingVertical: 3,
  },
  badgeText: {
    fontSize: 11,
    fontWeight: '700',
    color: WHITE,
  },

  // ── Version ──
  version: {
    textAlign: 'center',
    fontSize: 11,
    color: '#C4CCDA',
    letterSpacing: 0.5,
    marginTop: 24,
    marginBottom: 4,
  },

  // ── Logout ──
  logoutWrap: {
    backgroundColor: CARD,
    paddingBottom: Platform.OS === 'ios' ? 32 : 16,
  },
  logoutDivider: {
    height: 1,
    backgroundColor: BORDER,
  },
  logoutBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    paddingHorizontal: 20,
    paddingVertical: 16,
  },
  logoutIconWrap: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: '#FEE2E2',
    alignItems: 'center',
    justifyContent: 'center',
  },
  logoutLabel: {
    fontSize: 15,
    fontWeight: '600',
    color: '#EF4444',
    letterSpacing: 0.1,
  },
});