import { create } from 'zustand';
import AsyncStorage from '@react-native-async-storage/async-storage';

// ─────────────────────────────────────────────────────────────────────────────
// Primitive types — mirrors API response shapes
// ─────────────────────────────────────────────────────────────────────────────

export interface UserSession {
  Emp_Name:    string;   // e.g. "IT"
  Sec_Lvl:     number;   // e.g. 22
  TabLocation: string;   // e.g. "IT Logged To - Unit 99"
  StewardName: string;   // e.g. ""
}

export interface DeviceInfo {
  Device_Id: number;   // e.g. 99
  Doc_No:    string;   // e.g. "3287938"
  UniqueId:  string;   // e.g. "4ee18dacf6e7a740"
}

// ── Department (iid:3) ────────────────────────────────────────────────────────
export interface Department {
  Dept_Code: string;
  Dept_Name: string;
  Id_No:     number;
  ImageID:   number;
}

// ── Pit (iid:4, con:2) ────────────────────────────────────────────────────────
export interface Pit {
  Pit_Name: string;
}

// ── Executive Staff (iid:14) ──────────────────────────────────────────────────
export interface ExecStaff {
  Id_No:      number;
  Staff_Code: string;
  Staff_Name: string;
}

// ── Current Order item ────────────────────────────────────────────────────────
// Built locally when user adds items from MenuItemsScreen
export interface OrderItem {
  Prod_Code:     string;
  Prod_Name:     string;
  Dept_Code:     string;
  Dept_Name:     string;
  Cat_Code:      string;
  Cat_Name:      string;
  Selling_Price: number;
  Qty:           number;
  // Optional guest / pit / table context
  GuestID?:      string;
  GuestName?:    string;
  PitName?:      string;
  TableCode?:    string;
  StaffCode?:    string;
  StaffName?:    string;
}

/// ── Order context — who is the current order for ──────────────────────────────

export interface OrderContext {
  type:         'guest' | 'visitor' | 'executive_staff' | 'pits' | null;
  guestId?:     string;
  guestName?:   string;
  visitorName?: string;
  staffCode?:   string;
  staffName?:   string;
  staffIdNo?:   number;
  pitName?:     string;
  tableCode?:   string;
  memberId?:    string;
  memberName?:  string;
  // ── NEW ──
  currentDrop?: string | number | null;
  points?:      string | number | null;
  avgBet?:      string | number | null;
}

// ─────────────────────────────────────────────────────────────────────────────
// Store interface
// ─────────────────────────────────────────────────────────────────────────────
export interface AppStore {

  // ── Auth / Device ──────────────────────────────────────────────────────────
  isLoggedIn:  boolean;
  session:     UserSession | null;
  device:      DeviceInfo  | null;

  setLoginData:    (session: UserSession, device: DeviceInfo) => Promise<void>;
  clearSession:    () => Promise<void>;
  loadFromStorage: () => Promise<void>;

  // ── Departments cache ──────────────────────────────────────────────────────
  // Loaded once from iid:3 — reused across MenuScreen, MenuCategoriesScreen
  departments:     Department[];
  setDepartments:  (depts: Department[]) => void;
  clearDepartments:() => void;

  // ── Pits cache ─────────────────────────────────────────────────────────────
  // Loaded once from iid:4, con:2 — reused in PitsDetailsScreen
  pits:     Pit[];
  setPits:  (pits: Pit[]) => void;
  clearPits:() => void;

  // ── Executive Staff cache ──────────────────────────────────────────────────
  // Loaded from iid:14 — reused in ExecutiveStaffScreen
  execStaff:     ExecStaff[];
  setExecStaff:  (staff: ExecStaff[]) => void;
  clearExecStaff:() => void;

  // ── Current order ──────────────────────────────────────────────────────────
  // The order being built — items added from MenuItemsScreen
  orderContext:     OrderContext;
  orderItems:       OrderItem[];
  setOrderContext:  (ctx: OrderContext) => void;
  clearOrderContext:() => void;
  addOrderItem:     (item: OrderItem) => void;
  removeOrderItem:  (prodCode: string) => void;
  updateOrderQty:   (prodCode: string, qty: number) => void;
  clearOrderItems:  () => void;
  clearOrder:       () => void;  // clears both context + items

  // ── Derived helpers ────────────────────────────────────────────────────────
  orderTotal:    () => number;
  orderItemCount:() => number;
}

// ─────────────────────────────────────────────────────────────────────────────
// AsyncStorage keys
// ─────────────────────────────────────────────────────────────────────────────
const KEYS = {
  SESSION:     'KOT_SESSION',
  DEVICE:      'KOT_DEVICE',
  DEPARTMENTS: 'KOT_DEPARTMENTS',
} as const;

// ─────────────────────────────────────────────────────────────────────────────
// Default order context
// ─────────────────────────────────────────────────────────────────────────────
const DEFAULT_CONTEXT: OrderContext = { type: null };

// ─────────────────────────────────────────────────────────────────────────────
// Store
// ─────────────────────────────────────────────────────────────────────────────
export const useAppStore = create<AppStore>((set, get) => ({

  // ── Auth / Device ──────────────────────────────────────────────────────────
  isLoggedIn: false,
  session:    null,
  device:     null,

  setLoginData: async (session, device) => {
    try {
      await AsyncStorage.setItem(KEYS.SESSION, JSON.stringify(session));
      await AsyncStorage.setItem(KEYS.DEVICE,  JSON.stringify(device));
    } catch (e) {
      console.warn('[STORE] Failed to persist login data:', e);
    }
    set({ isLoggedIn: true, session, device });
    console.log('[STORE] Login data saved:', { session, device });
  },

  clearSession: async () => {
    try {
      await AsyncStorage.removeItem(KEYS.SESSION);
    } catch (e) {
      console.warn('[STORE] Failed to clear session:', e);
    }
    // Clear session + runtime caches, but keep device so Unit number persists
    set({
      isLoggedIn:   false,
      session:      null,
      execStaff:    [],
      orderContext: DEFAULT_CONTEXT,
      orderItems:   [],
      // departments + pits kept — they're device-level, not user-level
    });
    console.log('[STORE] Session cleared. Device info kept.');
  },

  loadFromStorage: async () => {
    try {
      const [sessionStr, deviceStr, deptsStr] = await Promise.all([
        AsyncStorage.getItem(KEYS.SESSION),
        AsyncStorage.getItem(KEYS.DEVICE),
        AsyncStorage.getItem(KEYS.DEPARTMENTS),
      ]);

      const session     = sessionStr ? JSON.parse(sessionStr) as UserSession   : null;
      const device      = deviceStr  ? JSON.parse(deviceStr)  as DeviceInfo    : null;
      const departments = deptsStr   ? JSON.parse(deptsStr)   as Department[]  : [];

      if (device) {
        set({ device });
        console.log('[STORE] Device restored. Unit:', device.Device_Id, 'Doc:', device.Doc_No);
      }
      if (departments.length > 0) {
        set({ departments });
        console.log('[STORE] Departments restored:', departments.length);
      }
      if (session && device) {
        set({ isLoggedIn: true, session });
        console.log('[STORE] Session restored. Emp:', session.Emp_Name);
      } else {
        console.log('[STORE] No active session found.');
      }
    } catch (e) {
      console.warn('[STORE] Failed to load from storage:', e);
    }
  },

  // ── Departments ────────────────────────────────────────────────────────────
  departments: [],

  setDepartments: async (depts) => {
    set({ departments: depts });
    try {
      await AsyncStorage.setItem(KEYS.DEPARTMENTS, JSON.stringify(depts));
    } catch (e) {
      console.warn('[STORE] Failed to persist departments:', e);
    }
    console.log('[STORE] Departments cached:', depts.length);
  },

  clearDepartments: () => {
    set({ departments: [] });
    AsyncStorage.removeItem(KEYS.DEPARTMENTS).catch(() => {});
  },

  // ── Pits ───────────────────────────────────────────────────────────────────
  // Not persisted — loaded fresh each time PitsDetailsScreen mounts
  pits: [],

  setPits: (pits) => {
    const valid = pits.filter(p => p.Pit_Name.trim() !== '');
    set({ pits: valid });
    console.log('[STORE] Pits cached:', valid.length);
  },

  clearPits: () => set({ pits: [] }),

  // ── Executive Staff ────────────────────────────────────────────────────────
  // Not persisted — loaded fresh each visit to ExecutiveStaffScreen
  execStaff: [],

  setExecStaff: (staff) => {
    set({ execStaff: staff });
    console.log('[STORE] Exec staff cached:', staff.length);
  },

  clearExecStaff: () => set({ execStaff: [] }),

  // ── Current order context ──────────────────────────────────────────────────
  orderContext: DEFAULT_CONTEXT,

  setOrderContext: (ctx) => {
    set({ orderContext: ctx });
    console.log('[STORE] Order context set:', ctx.type, ctx);
  },

  clearOrderContext: () => set({ orderContext: DEFAULT_CONTEXT }),

  // ── Current order items ────────────────────────────────────────────────────
  orderItems: [],

  addOrderItem: (item) => {
    const existing = get().orderItems.find(i => i.Prod_Code === item.Prod_Code);
    if (existing) {
      // Increment qty if already in order
      set(state => ({
        orderItems: state.orderItems.map(i =>
          i.Prod_Code === item.Prod_Code
            ? { ...i, Qty: i.Qty + item.Qty }
            : i
        ),
      }));
      console.log('[STORE] Order item qty updated:', item.Prod_Name);
    } else {
      set(state => ({ orderItems: [...state.orderItems, item] }));
      console.log('[STORE] Order item added:', item.Prod_Name, 'x', item.Qty);
    }
  },

  removeOrderItem: (prodCode) => {
    set(state => ({
      orderItems: state.orderItems.filter(i => i.Prod_Code !== prodCode),
    }));
    console.log('[STORE] Order item removed:', prodCode);
  },

  updateOrderQty: (prodCode, qty) => {
    if (qty <= 0) {
      get().removeOrderItem(prodCode);
      return;
    }
    set(state => ({
      orderItems: state.orderItems.map(i =>
        i.Prod_Code === prodCode ? { ...i, Qty: qty } : i
      ),
    }));
  },

  clearOrderItems: () => {
    set({ orderItems: [] });
    console.log('[STORE] Order items cleared.');
  },

  clearOrder: () => {
    set({ orderContext: DEFAULT_CONTEXT, orderItems: [] });
    console.log('[STORE] Order cleared (context + items).');
  },

  // ── Derived ────────────────────────────────────────────────────────────────
  orderTotal: () =>
    get().orderItems.reduce((sum, i) => sum + i.Selling_Price * i.Qty, 0),

  orderItemCount: () =>
    get().orderItems.reduce((sum, i) => sum + i.Qty, 0),

}));