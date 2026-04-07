import React, { useEffect } from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createDrawerNavigator } from '@react-navigation/drawer';

import LoginScreen from '../Screens/LoginScreen';
import HomeScreen from '../Screens/HomeScreen';
import GuestDetailsScreen from '../Screens/GuestDetailsScreen';
import VisitorDetailsScreen from '../Screens/VisitorDetailsScreen';
import MenuScreen from '../Screens/MenuScreen';
import ExecutiveStaffScreen from '../Screens/ExecutiveStaffScreen';
import PitsDetailsScreen from '../Screens/PitsDetailsScreen';
import PitsTablesScreen from '../Screens/PitsTablesScreen';
import PitsCustomerDetailsScreen from '../Screens/PitsCustomerDetailsScreen';
import MenuCategoriesScreen from '../Screens/MenuCategoriesScreen';
import MenuItemsScreen from '../Screens/MenuItemsScreen';
import PastOrdersScreen from '../Screens/PastOrdersScreen';
import CustomDrawer from './CustomDrawer';
import { useAppStore } from '../Store/store';
import PitsCustomersScreen from '../Screens/PitsCustomersScreen';
import SettingsScreen from '../Screens/SettingsScreen';
import CurrentOrderScreen         from '../Screens/CurrentOrderScreen';
import TablesScreen from '../Screens/TablesScreen';
import PitsPastOrdersScreen from '../Screens/PitsPastOrdersScreen';
import PitsPastOrdersResultsScreen from '../Screens/PitsPastOrdersResultsScreen';
import QRScanScreen from '../Screens/QRScanScreen';

// ─────────────────────────────────────────────────────────────────────────────
// Route param lists
//
// RootStackParamList  — screens reachable from anywhere in the app (push/pop)
// DrawerParamList     — top-level sections shown in the side drawer
//
// Rule of thumb:
//   • Drawer  → top-level sections (Home, Reports, Settings…)
//   • Stack   → detail screens opened from within a section
// ─────────────────────────────────────────────────────────────────────────────

export type RootStackParamList = {
  // ── Auth ──────────────────────────────────────────────
  Login: undefined;

  // ── Main app shell (contains the drawer) ──────────────
  Main: undefined;

  

  // ── Add more detail screens below as you build them ───
  // ExecutiveStaffDetails: undefined;
  // PitsDetails:           undefined;
  // TablesDetails:         undefined;
  // QRScanDetails:         undefined;
  // VIPDetails:            undefined;
};

export type DrawerParamList = {
  App: undefined;           // ← only one screen in the drawer now
};


export type AppStackParamList = {
  Home:                undefined;
  GuestDetails:        undefined;
  VisitorDetails:      undefined;
  ExecutiveStaff:      undefined;
  PitsDetails:         undefined;
  PitsTables:          { pitName: string };
  PitsCustomers:       { tblCode: string };
  PitsCustomerDetails: { MID: string; MName: string; tblCode: string };
  Menu:                undefined;
  MenuCategories:      { deptCode: string; deptName: string };
  MenuItems:           { deptCode: string; catCode: string; catName: string };
  CurrentOrder:        undefined;
  PastOrders:          undefined;
  Settings:            undefined;
  Tables: undefined;
  PitsPastOrders: { MID: string; MName: string; tblCode: string }; 
  PitsPastOrdersResults: undefined;
  QRScan: undefined;
};

// ─────────────────────────────────────────────────────────────────────────────
// Drawer navigator — top-level app sections
// ─────────────────────────────────────────────────────────────────────────────
const RootStack  = createNativeStackNavigator<RootStackParamList>();
const Drawer     = createDrawerNavigator<DrawerParamList>();
const AppStack   = createNativeStackNavigator<AppStackParamList>();

function AppStackNavigator() {
  return (
    <AppStack.Navigator screenOptions={{ headerShown: false, animation: 'slide_from_right' }}>
      <AppStack.Screen name="Home"                 component={HomeScreen} />
      <AppStack.Screen name="GuestDetails"         component={GuestDetailsScreen} />
      <AppStack.Screen name="VisitorDetails"       component={VisitorDetailsScreen} />
      <AppStack.Screen name="ExecutiveStaff"       component={ExecutiveStaffScreen} />
      <AppStack.Screen name="PitsDetails"          component={PitsDetailsScreen} />
      <AppStack.Screen name="PitsTables"           component={PitsTablesScreen} />
      <AppStack.Screen name="PitsCustomers"        component={PitsCustomersScreen} />
      <AppStack.Screen name="PitsCustomerDetails"  component={PitsCustomerDetailsScreen} />
      <AppStack.Screen name="Menu"                 component={MenuScreen} />
      <AppStack.Screen name="MenuCategories"       component={MenuCategoriesScreen} />
      <AppStack.Screen name="MenuItems"            component={MenuItemsScreen} />
      <AppStack.Screen name="CurrentOrder"         component={CurrentOrderScreen} />
      <AppStack.Screen name="PastOrders"           component={PastOrdersScreen} />
      <AppStack.Screen name="Settings"             component={SettingsScreen} />
      <AppStack.Screen name="Tables" component={TablesScreen} />
      <AppStack.Screen name="PitsPastOrders" component={PitsPastOrdersScreen} />
      <AppStack.Screen name="PitsPastOrdersResults" component={PitsPastOrdersResultsScreen} />
      <AppStack.Screen name="QRScan" component={QRScanScreen} />

    </AppStack.Navigator>
  );
}

function AppDrawer() {
  return (
    <Drawer.Navigator
      drawerContent={props => <CustomDrawer {...props} />}
      screenOptions={{
        headerShown: false,
        drawerType: 'front',
        drawerStyle: { width: 300, backgroundColor: 'transparent' },
        overlayColor: 'rgba(0,0,0,0.45)',
        swipeEdgeWidth: 60,
      }}
    >
      <Drawer.Screen name="App" component={AppStackNavigator} />
    </Drawer.Navigator>
  );
}



export default function MainStack() {
  const loadFromStorage = useAppStore(state => state.loadFromStorage);

  useEffect(() => {
    loadFromStorage();
  }, []);

  return (
    <RootStack.Navigator
      initialRouteName="Login"
      screenOptions={{ headerShown: false, animation: 'slide_from_right' }}
    >
      <RootStack.Screen name="Login" component={LoginScreen} options={{ animation: 'fade' }} />
      <RootStack.Screen name="Main"  component={AppDrawer}   options={{ animation: 'fade' }} />
    </RootStack.Navigator>
  );
}
