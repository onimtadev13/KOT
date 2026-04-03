import { APIURL, PRINT_URL } from '../Data/data';

// ─────────────────────────────────────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────────────────────────────────────

export type LoginStatus =
  | 'success'
  | 'wrong_password'
  | 'device_not_found'
  | 'error';

export interface LoginResult {
  status: LoginStatus;
  message: string;
  data?: {
    Emp_Name: string;
    Sec_Lvl: number;
    TabLocation: string | null;
    StewardName: string;
    Device_Id: number;
    Doc_No: string;     
  };
}

export interface DeviceCheckResult {
  isRegistered: boolean;
  message: string;
  Device_Id: number;
  Doc_No: string;      
}

// ─────────────────────────────────────────────────────────────────────────────
// Helper — base POST
// ─────────────────────────────────────────────────────────────────────────────
async function callAPI(iid: string, parameters: any[]): Promise<any> {
  const url = APIURL;

  const body = {
    HasReturnData: 'T',
    Parameters: [
      {
        Para_Data: iid,
        Para_Direction: 'Input',
        Para_Lenth: 10,
        Para_Name: '@Iid',
        Para_Type: 'int',
      },
      ...parameters,
    ],
    SpName: 'sp_Android_Common_API',
    con: '1',
  };

  console.log('[API] POST', url);
  console.log('[API] Body:', JSON.stringify(body, null, 2));

  const response = await fetch(url, {
    method: 'POST',
    headers: {
      'content-type': 'application/json',
      'cache-control': 'no-cache',
    },
    body: JSON.stringify(body),
  });

  console.log('[API] HTTP Status:', response.status);

  if (!response.ok) {
    throw new Error(`Server error: ${response.status}`);
  }

  const text = await response.text();
  console.log('[API] Raw response:', text);

  try {
    return JSON.parse(text);
  } catch {
    throw new Error(`Invalid JSON: ${text}`);
  }
}

function getTable(data: any): any {
  return data?.CommonResult?.Table?.[0] ?? null;
}

// ─────────────────────────────────────────────────────────────────────────────
// 1. Device Check  (iid: 2)
//    Response: { CheckDeviceID: "T", Device_Id: 99, Doc_No: "3287120" }
// ─────────────────────────────────────────────────────────────────────────────
export async function deviceCheck(uniqueId: string): Promise<DeviceCheckResult> {
  try {
    console.log('[DEVICE CHECK] UniqueId:', uniqueId);

    const data = await callAPI('2', [
      {
        Para_Data: uniqueId,
        Para_Direction: 'Input',
        Para_Lenth: 100,
        Para_Name: '@Text1',
        Para_Type: 'VARCHAR',
      },
    ]);

    console.log('[DEVICE CHECK] Response:', JSON.stringify(data, null, 2));

    const row = getTable(data);
    const isRegistered = data?.strRturnRes === true && row?.CheckDeviceID === 'T';

    return {
      isRegistered,
      message:   row?.CheckDeviceID ?? '',
      Device_Id: row?.Device_Id     ?? 0,
      Doc_No:    row?.Doc_No        ?? '',  
    };
  } catch (error: any) {
    console.error('[DEVICE CHECK] Error:', error);
    return {
      isRegistered: false,
      message:   error?.message ?? 'Connection failed',
      Device_Id: 0,
      Doc_No:    '',
    };
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// 2. Login (iid: 1)  →  Device Check (iid: 2)
// ─────────────────────────────────────────────────────────────────────────────
export async function login(
  password: string,
  uniqueId: string,
): Promise<LoginResult> {
  try {

    // Login ────────────────────────────────────────────
    console.log('[LOGIN] Step 1 — Login API...');

    const loginData = await callAPI('1', [
      {
        Para_Data: password,
        Para_Direction: 'Input',
        Para_Lenth: 100,
        Para_Name: '@Text2',
        Para_Type: 'VARCHAR',
      },
      {
        Para_Data: uniqueId,
        Para_Direction: 'Input',
        Para_Lenth: 100,
        Para_Name: '@Text3',
        Para_Type: 'VARCHAR',
      },
    ]);

    console.log('[LOGIN] Response:', JSON.stringify(loginData, null, 2));

    const loginRow = getTable(loginData);
    const loginSuccess = loginData?.strRturnRes === true && loginRow?.ReturnMSG === 'T';

    if (!loginSuccess) {
      console.log('[LOGIN] Wrong password.');
      return {
        status: 'wrong_password',
        message: 'Incorrect passcode. Please try again.',
      };
    }

    console.log('[LOGIN] Login OK. Step 2 — Device check...');

    // Device check ─────────────────────────────────────
    const deviceResult = await deviceCheck(uniqueId);

    if (!deviceResult.isRegistered) {
      console.log('[LOGIN] Device not registered. Blocking.');
      return {
        status: 'device_not_found',
        message: 'This device is not registered. Contact your administrator.',
      };
    }

    console.log('[LOGIN] Device OK. Unit:', deviceResult.Device_Id, 'Doc:', deviceResult.Doc_No);

    return {
      status: 'success',
      message: 'Login successful',
      data: {
        Emp_Name:    loginRow?.Emp_Name    ?? '',
        Sec_Lvl:     loginRow?.Sec_Lvl     ?? 0,
        TabLocation: loginRow?.TabLocation ?? null,
        StewardName: loginRow?.StewardName ?? '',
        Device_Id:   deviceResult.Device_Id,
        Doc_No:      deviceResult.Doc_No,   
      },
    };

  } catch (error: any) {
    console.error('[LOGIN] Error:', error);
    return {
      status: 'error',
      message: error?.message ?? 'Connection failed. Check your network.',
    };
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// 3. Load Departments  (iid: 3)
//    Returns: Dept_Code, Dept_Name, Id_No, ImageID
//    Text1 = Unit No, Text2 = Doc No, Text3 = UniqueId
// ─────────────────────────────────────────────────────────────────────────────
export interface DepartmentResult {
  Dept_Code: string;
  Dept_Name: string;
  Id_No:     number;
  ImageID:   number;
}

export async function loadDepartments(
  unitNo:   number,
  docNo:    string,
  uniqueId: string,
): Promise<DepartmentResult[]> {
  try {
    console.log('[DEPARTMENTS] Loading — Unit:', unitNo, 'Doc:', docNo);

    const data = await callAPI('3', [
      { Para_Data: String(unitNo), Para_Direction: 'Input', Para_Lenth: 100, Para_Name: '@Text1', Para_Type: 'VARCHAR' },
      { Para_Data: docNo,          Para_Direction: 'Input', Para_Lenth: 100, Para_Name: '@Text2', Para_Type: 'VARCHAR' },
      { Para_Data: uniqueId,       Para_Direction: 'Input', Para_Lenth: 100, Para_Name: '@Text3', Para_Type: 'VARCHAR' },
    ]);

    console.log('[DEPARTMENTS] Response:', JSON.stringify(data, null, 2));

    const table: DepartmentResult[] = data?.CommonResult?.Table ?? [];
    console.log('[DEPARTMENTS] Loaded:', table.length, 'departments');
    return table;
  } catch (error: any) {
    console.error('[DEPARTMENTS] Error:', error);
    return [];
  }
}


// ─────────────────────────────────────────────────────────────────────────────
// Load Executive Staff  (iid: 14)
//    Text1 = Unit No, Text2 = Doc No, Text3 = Mac (UniqueId)
// ─────────────────────────────────────────────────────────────────────────────
export interface ExecStaffResult {
  Id_No:      number;
  Staff_Code: string;
  Staff_Name: string;
}

export async function loadExecStaff(
  unitNo:   number,
  docNo:    string,
  uniqueId: string,
): Promise<ExecStaffResult[]> {
  try {
    console.log('[EXEC STAFF] Loading — Unit:', unitNo, 'Doc:', docNo);

    const data = await callAPI('14', [
      { Para_Data: String(unitNo), Para_Direction: 'Input', Para_Lenth: 100, Para_Name: '@Text1', Para_Type: 'VARCHAR' },
      { Para_Data: docNo,          Para_Direction: 'Input', Para_Lenth: 100, Para_Name: '@Text2', Para_Type: 'VARCHAR' },
      { Para_Data: uniqueId,       Para_Direction: 'Input', Para_Lenth: 100, Para_Name: '@Text3', Para_Type: 'VARCHAR' },
    ]);

    console.log('[EXEC STAFF] Response:', JSON.stringify(data, null, 2));

    const table: ExecStaffResult[] = data?.CommonResult?.Table ?? [];
    console.log('[EXEC STAFF] Loaded:', table.length, 'records');
    return table;
  } catch (error: any) {
    console.error('[EXEC STAFF] Error:', error);
    return [];
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// 4. Load Products by Department  (iid: 115)
//    Returns: Prod_Code, Prod_Name, Dept_Name, Selling_Price, etc.
//    Text1 = Dept_Code (location/dept)
// ─────────────────────────────────────────────────────────────────────────────
export interface MenuItemResult {
  Prod_Code:    string;
  Prod_Name:    string;
  Dept_Name:    string;
  Selling_Price: number;
  More_Descrip: string;
  ImagePath:    string;
  isBestSeller: string;
  isOffer:      string;
  isSoldOut:    string;
  Popular:      string;
}

export async function loadProducts(deptCode: string): Promise<MenuItemResult[]> {
  try {
    console.log('[PRODUCTS] Loading dept:', deptCode);

    const data = await callAPI('115', [
      { Para_Data: deptCode, Para_Direction: 'Input', Para_Lenth: 100, Para_Name: '@Text1', Para_Type: 'VARCHAR' },
    ]);

    console.log('[PRODUCTS] Response:', JSON.stringify(data, null, 2));

    const table: MenuItemResult[] = data?.CommonResult?.Table ?? [];
    console.log('[PRODUCTS] Loaded:', table.length, 'items');
    return table;
  } catch (error: any) {
    console.error('[PRODUCTS] Error:', error);
    return [];
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// 5. Load Pits  (iid: 4, con: 2)
// ─────────────────────────────────────────────────────────────────────────────
export interface PitResult {
  Pit_Name: string;  // only field returned by API
}

export async function loadPits(): Promise<PitResult[]> {
  try {
    console.log('[PITS] Loading pits...');

    const url = APIURL;
    const body = {
      HasReturnData: 'T',
      Parameters: [
        {
          Para_Data:      '4',
          Para_Direction: 'Input',
          Para_Lenth:     10,
          Para_Name:      '@Iid',
          Para_Type:      'int',
        },
      ],
      SpName: 'sp_Android_Common_API',
      con:    '2',                        
    };

    console.log('[PITS] POST', url);
    console.log('[PITS] Body:', JSON.stringify(body, null, 2));

    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'content-type':  'application/json',
        'cache-control': 'no-cache',
      },
      body: JSON.stringify(body),
    });

    console.log('[PITS] HTTP Status:', response.status);

    if (!response.ok) throw new Error(`Server error: ${response.status}`);

    const text = await response.text();
    console.log('[PITS] Raw response:', text);

    const data = JSON.parse(text);
    const table: PitResult[] = data?.CommonResult?.Table ?? [];
    console.log('[PITS] Loaded:', table.length, 'pits');
    return table;

  } catch (error: any) {
    console.error('[PITS] Error:', error);
    return [];
  }
}


// ─────────────────────────────────────────────────────────────────────────────
// 6. Load Pit Order  (iid: 5, con: 2)
//    Text1 = Pit_Name
// ─────────────────────────────────────────────────────────────────────────────
export interface PitOrderResult {
  // Add fields here as you discover them from the API response
  [key: string]: any;
}

export async function loadPitOrder(pitName: string): Promise<PitOrderResult[]> {
  try {
    console.log('[PIT ORDER] Loading for pit:', pitName);

    const url = APIURL;
    const body = {
      HasReturnData: 'T',
      Parameters: [
        {
          Para_Data:      '5',
          Para_Direction: 'Input',
          Para_Lenth:     10,
          Para_Name:      '@Iid',
          Para_Type:      'int',
        },
        {
          Para_Data:      pitName,
          Para_Direction: 'Input',
          Para_Lenth:     100,
          Para_Name:      '@Text1',
          Para_Type:      'VARCHAR',
        },
      ],
      SpName: 'sp_Android_Common_API',
      con:    '2',
    };

    console.log('[PIT ORDER] POST', url);
    console.log('[PIT ORDER] Body:', JSON.stringify(body, null, 2));

    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'content-type':  'application/json',
        'cache-control': 'no-cache',
      },
      body: JSON.stringify(body),
    });

    console.log('[PIT ORDER] HTTP Status:', response.status);

    if (!response.ok) throw new Error(`Server error: ${response.status}`);

    const text = await response.text();
    console.log('[PIT ORDER] Raw response:', text);

    const data = JSON.parse(text);
    const table: PitOrderResult[] = data?.CommonResult?.Table ?? [];
    console.log('[PIT ORDER] Loaded:', table.length, 'records');
    return table;

  } catch (error: any) {
    console.error('[PIT ORDER] Error:', error);
    return [];
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// 7. Load Pit Customer Details  (iid: 6, con: 2)
//    Text1 = TblCode
// ─────────────────────────────────────────────────────────────────────────────
export interface PitCustomerResult {
  MID:        string;
  MName:      string;
  MemImage2:  string;
}

export async function loadPitCustomers(tblCode: string): Promise<PitCustomerResult[]> {
  try {
    console.log('[PIT CUSTOMERS] Loading for table:', tblCode);

    const url  = APIURL;
    const body = {
      HasReturnData: 'T',
      Parameters: [
        {
          Para_Data:      '6',
          Para_Direction: 'Input',
          Para_Lenth:     10,
          Para_Name:      '@Iid',
          Para_Type:      'int',
        },
        {
          Para_Data:      tblCode,
          Para_Direction: 'Input',
          Para_Lenth:     100,
          Para_Name:      '@Text1',
          Para_Type:      'VARCHAR',
        },
      ],
      SpName: 'sp_Android_Common_API',
      con:    '2',
    };

    console.log('[PIT CUSTOMERS] POST', url);
    console.log('[PIT CUSTOMERS] Body:', JSON.stringify(body, null, 2));

    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'content-type':  'application/json',
        'cache-control': 'no-cache',
      },
      body: JSON.stringify(body),
    });

    console.log('[PIT CUSTOMERS] HTTP Status:', response.status);
    if (!response.ok) throw new Error(`Server error: ${response.status}`);

    const text = await response.text();
    console.log('[PIT CUSTOMERS] Raw response:', text);

    const data = JSON.parse(text);
    const table: PitCustomerResult[] = data?.CommonResult?.Table ?? [];
    console.log('[PIT CUSTOMERS] Loaded:', table.length, 'customers');
    return table;

  } catch (error: any) {
    console.error('[PIT CUSTOMERS] Error:', error);
    return [];
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// Load Menu Categories by Department  (iid: 4, con: 1)
//    Text1 = DeptCode, Text2 = Unit, Text3 = DocNo, Text4 = Mac (UniqueId)
// ─────────────────────────────────────────────────────────────────────────────
export interface MenuCategoryResult {
  Dept_Code: string;
  Cat_Code:  string;
  Cat_Name:  string;
  Id_No:     number;
  ImageID:   number;
}

export async function loadMenuCategories(
  deptCode: string,
  unitNo:   string,
  docNo:    string,
  mac:      string,
): Promise<MenuCategoryResult[]> {
  try {
    console.log('[MENU CATEGORIES] Loading — Dept:', deptCode, 'Unit:', unitNo);

    const url  = APIURL;
    const body = {
      HasReturnData: 'T',
      Parameters: [
        { Para_Data: '4',      Para_Direction: 'Input', Para_Lenth: 10,  Para_Name: '@Iid',   Para_Type: 'int'     },
        { Para_Data: deptCode, Para_Direction: 'Input', Para_Lenth: 100, Para_Name: '@Text1',  Para_Type: 'VARCHAR' },
        { Para_Data: unitNo,   Para_Direction: 'Input', Para_Lenth: 100, Para_Name: '@Text2',  Para_Type: 'VARCHAR' },
        { Para_Data: docNo,    Para_Direction: 'Input', Para_Lenth: 100, Para_Name: '@Text3',  Para_Type: 'VARCHAR' },
        { Para_Data: mac,      Para_Direction: 'Input', Para_Lenth: 100, Para_Name: '@Text4',  Para_Type: 'VARCHAR' },
      ],
      SpName: 'sp_Android_Common_API',
      con:    '1',
    };

    console.log('[MENU CATEGORIES] Body:', JSON.stringify(body, null, 2));

    const response = await fetch(url, {
      method: 'POST',
      headers: { 'content-type': 'application/json', 'cache-control': 'no-cache' },
      body: JSON.stringify(body),
    });

    if (!response.ok) throw new Error(`Server error: ${response.status}`);

    const text = await response.text();
    console.log('[MENU CATEGORIES] Raw response:', text);

    const data = JSON.parse(text);
    const table: MenuCategoryResult[] = data?.CommonResult?.Table ?? [];
    console.log('[MENU CATEGORIES] Loaded:', table.length, 'categories');
    return table;

  } catch (error: any) {
    console.error('[MENU CATEGORIES] Error:', error);
    return [];
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// Load Products by Category  (iid: 5, con: 1)
//    Text1=DeptCode, Text2=CatCode, Text3=Unit, Text4=DocNo, Text5=Mac
// ─────────────────────────────────────────────────────────────────────────────
export interface MenuItemResult {
  Prod_Code:     string;
  Prod_Name:     string;
  Selling_Price: number;
  More_Descrip:  string;
  ImagePath:     string;
  isBestSeller:  string;
  isOffer:       string;
  isSoldOut:     string;
  Popular:       string;
  [key: string]: any;
}

export async function loadMenuItems(
  deptCode: string,
  catCode:  string,
  unitNo:   string,
  docNo:    string,
  mac:      string,
): Promise<MenuItemResult[]> {
  try {
    console.log('[PRODUCTS] Loading — Dept:', deptCode, 'Cat:', catCode);

    const url  = APIURL;
    const body = {
      HasReturnData: 'T',
      Parameters: [
        { Para_Data: '5',      Para_Direction: 'Input', Para_Lenth: 10,  Para_Name: '@Iid',   Para_Type: 'int'     },
        { Para_Data: deptCode, Para_Direction: 'Input', Para_Lenth: 100, Para_Name: '@Text1',  Para_Type: 'VARCHAR' },
        { Para_Data: catCode,  Para_Direction: 'Input', Para_Lenth: 100, Para_Name: '@Text2',  Para_Type: 'VARCHAR' },
        { Para_Data: unitNo,   Para_Direction: 'Input', Para_Lenth: 100, Para_Name: '@Text3',  Para_Type: 'VARCHAR' },
        { Para_Data: docNo,    Para_Direction: 'Input', Para_Lenth: 100, Para_Name: '@Text4',  Para_Type: 'VARCHAR' },
        { Para_Data: mac,      Para_Direction: 'Input', Para_Lenth: 100, Para_Name: '@Text5',  Para_Type: 'VARCHAR' },
      ],
      SpName: 'sp_Android_Common_API',
      con:    '1',
    };

    console.log('[PRODUCTS] Body:', JSON.stringify(body, null, 2));

    const response = await fetch(url, {
      method: 'POST',
      headers: { 'content-type': 'application/json', 'cache-control': 'no-cache' },
      body: JSON.stringify(body),
    });

    if (!response.ok) throw new Error(`Server error: ${response.status}`);

    const text = await response.text();
    console.log('[PRODUCTS] Raw response:', text);

    const data = JSON.parse(text);
    const table: MenuItemResult[] = data?.CommonResult?.Table ?? [];
    console.log('[PRODUCTS] Loaded:', table.length, 'products');
    return table;

  } catch (error: any) {
    console.error('[PRODUCTS] Error:', error);
    return [];
  }
}

 
// ─────────────────────────────────────────────────────────────────────────────
// Load Past Orders  (iid: 16)
//    Text1 = "ALL"
//    Text2 = Mac (UniqueId)
//    Text3 = DocNo
// ─────────────────────────────────────────────────────────────────────────────

export interface PastOrderResult {
  // Primary fields returned by sp_Android_Common_API (iid=16)
  Receipt_No: string;       // e.g. "00654820"
  GuestID:    string;       // e.g. "11864"
  GuestName:  string;       // e.g. "MR. C REDDY OBULA REDDY"
  Steward:    string;       // e.g. "RAVINDU"
  LoginBy:    string;       // operator / login user — e.g. "RAVINDU"
  Tr_Date:    string;       // e.g. "24/03/2026  2:45PM"
  TBL_No:     string;       // e.g. "BAC 07"

  // Legacy / alias fallbacks (keep for safety if stored response differs)
  Receipt?:    string | number;
  Recpt_No?:   string | number;
  ReceiptNo?:  string | number;
  Guest_ID?:   string | number;
  Guest_Name?: string;
  StewardName?: string;
  Login_By?:   string;
  Operator?:   string;
  Date_Time?:  string;
  Trans_Date?: string;
  DateTime?:   string;
  Table_No?:   string;
  TableNo?:    string;

  [key: string]: any;
}

// ─────────────────────────────────────────────────────────────────────────────
// loadPastOrders
// ─────────────────────────────────────────────────────────────────────────────
export async function loadPastOrders(
  uniqueId: string,
  docNo:    string,
): Promise<PastOrderResult[]> {
  try {
    console.log('[PAST ORDERS] Loading — Doc:', docNo);

    const data = await callAPI('16', [
      { Para_Data: 'ALL',    Para_Direction: 'Input', Para_Lenth: 100, Para_Name: '@Text1', Para_Type: 'VARCHAR' },
      { Para_Data: uniqueId, Para_Direction: 'Input', Para_Lenth: 100, Para_Name: '@Text2', Para_Type: 'VARCHAR' },
      { Para_Data: docNo,    Para_Direction: 'Input', Para_Lenth: 100, Para_Name: '@Text3', Para_Type: 'VARCHAR' },
    ]);

    console.log('[PAST ORDERS] Raw response:', JSON.stringify(data, null, 2));

    const table: PastOrderResult[] = data?.CommonResult?.Table ?? [];
    console.log('[PAST ORDERS] Loaded:', table.length, 'orders');

    return table;
  } catch (error: any) {
    console.error('[PAST ORDERS] Error:', error);
    return [];
  }
}


// ─────────────────────────────────────────────────────────────────────────────
// Load Pit Guest Details  (iid: 1, con: 2)
//    Text1 = MemberId, Text2 = "1", Text3 = "100"
// ─────────────────────────────────────────────────────────────────────────────
export interface PitGuestDetailResult {
  MID:          string;
  MName:        string;
  GuestRating:  string;
  MemImage2:    string;
  [key: string]: any;
}

export async function loadPitGuestDetails(memberId: string): Promise<PitGuestDetailResult | null> {
  try {
    console.log('[PIT GUEST DETAILS] Loading for member:', memberId);
    const url  = APIURL;
    const body = {
      HasReturnData: 'T',
      Parameters: [
        { Para_Data: '1',       Para_Direction: 'Input', Para_Lenth: 10,  Para_Name: '@Iid',   Para_Type: 'int'     },
        { Para_Data: memberId,  Para_Direction: 'Input', Para_Lenth: 100, Para_Name: '@Text1',  Para_Type: 'VARCHAR' },
        { Para_Data: '1',       Para_Direction: 'Input', Para_Lenth: 100, Para_Name: '@Text2',  Para_Type: 'VARCHAR' },
        { Para_Data: '100',     Para_Direction: 'Input', Para_Lenth: 100, Para_Name: '@Text3',  Para_Type: 'VARCHAR' },
      ],
      SpName: 'sp_Android_Common_API',
      con:    '2',
    };
    const response = await fetch(url, {
      method: 'POST',
      headers: { 'content-type': 'application/json', 'cache-control': 'no-cache' },
      body: JSON.stringify(body),
    });
    if (!response.ok) throw new Error(`Server error: ${response.status}`);
    const text = await response.text();
    console.log('[PIT GUEST DETAILS] Raw response:', text);
    const data  = JSON.parse(text);
    const table = data?.CommonResult?.Table ?? [];
    return table[0] ?? null;
  } catch (error: any) {
    console.error('[PIT GUEST DETAILS] Error:', error);
    return null;
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// Load Pit Drop Details  (iid: 2, con: 2)
//    Text1 = MemberId, Text2 = "1", Text3 = Mac
// ─────────────────────────────────────────────────────────────────────────────
export interface PitDropDetailResult {
  AvgBet:        string | number;
  TotalPoints:   string | number;
  CurrentDrop:   string | number;
  CurrentPoints: string | number;
  Coupon:        string | number;
  Actual_Drop:   string | number;
  BallysCoins:   string | number;
  Rating:        string;
  MKT:           string | null;
  [key: string]: any;
}

export async function loadPitDropDetails(
  memberId: string,
  mac:      string,
): Promise<PitDropDetailResult | null> {
  try {
    console.log('[PIT DROP DETAILS] Loading for member:', memberId);
    const url  = APIURL;
    const body = {
      HasReturnData: 'T',
      Parameters: [
        { Para_Data: '2',      Para_Direction: 'Input', Para_Lenth: 10,  Para_Name: '@Iid',   Para_Type: 'int'     },
        { Para_Data: memberId, Para_Direction: 'Input', Para_Lenth: 100, Para_Name: '@Text1',  Para_Type: 'VARCHAR' },
        { Para_Data: '1',      Para_Direction: 'Input', Para_Lenth: 100, Para_Name: '@Text2',  Para_Type: 'VARCHAR' },
        { Para_Data: mac,      Para_Direction: 'Input', Para_Lenth: 100, Para_Name: '@Text3',  Para_Type: 'VARCHAR' },
      ],
      SpName: 'sp_Android_Common_API',
      con:    '2',
    };
    const response = await fetch(url, {
      method: 'POST',
      headers: { 'content-type': 'application/json', 'cache-control': 'no-cache' },
      body: JSON.stringify(body),
    });
    if (!response.ok) throw new Error(`Server error: ${response.status}`);
    const text = await response.text();
    console.log('[PIT DROP DETAILS] Raw response:', text);
    const data  = JSON.parse(text);
    const table = data?.CommonResult?.Table ?? [];
    return table[0] ?? null;
  } catch (error: any) {
    console.error('[PIT DROP DETAILS] Error:', error);
    return null;
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// Load Managers  (iid: 32)
//    Text1 = DeviceId, Text2 = DocNo, Text3 = LoginUser (Emp_Name)
// ─────────────────────────────────────────────────────────────────────────────
export interface ManagerResult {
 Managernames: string;
}

export async function loadManagers(
  deviceId:  number,
  docNo:     string,
  loginUser: string,
): Promise<ManagerResult[]> {
  try {
    console.log('[MANAGERS] Loading — Device:', deviceId, 'Doc:', docNo);

    const data = await callAPI('33', [
      { Para_Data: String(deviceId), Para_Direction: 'Input', Para_Lenth: 100, Para_Name: '@Text1', Para_Type: 'VARCHAR' },
      { Para_Data: docNo,            Para_Direction: 'Input', Para_Lenth: 100, Para_Name: '@Text2', Para_Type: 'VARCHAR' },
      { Para_Data: loginUser,        Para_Direction: 'Input', Para_Lenth: 100, Para_Name: '@Text3', Para_Type: 'VARCHAR' },
    ]);    console.log('[MANAGERS] Response:', JSON.stringify(data, null, 2)); 

    const table: ManagerResult[] = data?.CommonResult?.Table ?? []
    console.log('[MANAGERS] Loaded:', table.length, 'managers');
    if (table.length > 0) {
  console.log('[MANAGERS] Available fields:', Object.keys(table[0]));
  console.log('[MANAGERS] First row:', JSON.stringify(table[0]));
}
    return table;
  } catch (error: any) {
    console.error('[MANAGERS] Error:', error);
    return [];
  }
}


// ─────────────────────────────────────────────────────────────────────────────
// Submit Order  (iid: 13)
// ─────────────────────────────────────────────────────────────────────────────
export interface SubmitOrderResult {
  [key: string]: any;
}

export async function submitOrder(params: {
  docNo:        string;
  steward:      string;
  mid:          string;
  deviceId:     number;
  loginUser:    string;
  tableName:    string;
  mName:        string;
  currentDrop:  string | number;
  points:       string | number;
  avgBet:       string | number;
  totalDrop:    string | number;
  butler:       boolean;
}): Promise<{ success: boolean; data: any }> {
  try {
    console.log('[SUBMIT ORDER] Submitting...', params);

    const data = await callAPI('13', [
      { Para_Data: params.docNo,                    Para_Direction: 'Input', Para_Lenth: 100, Para_Name: '@Text1',  Para_Type: 'VARCHAR' },
      { Para_Data: params.steward,                  Para_Direction: 'Input', Para_Lenth: 100, Para_Name: '@Text2',  Para_Type: 'VARCHAR' },
      { Para_Data: params.mid,                      Para_Direction: 'Input', Para_Lenth: 100, Para_Name: '@Text3',  Para_Type: 'VARCHAR' },
      { Para_Data: String(params.deviceId),         Para_Direction: 'Input', Para_Lenth: 100, Para_Name: '@Text4',  Para_Type: 'VARCHAR' },
      { Para_Data: params.loginUser,                Para_Direction: 'Input', Para_Lenth: 100, Para_Name: '@Text5',  Para_Type: 'VARCHAR' },
      { Para_Data: params.tableName,                Para_Direction: 'Input', Para_Lenth: 100, Para_Name: '@Text6',  Para_Type: 'VARCHAR' },
      { Para_Data: 'DAY',                           Para_Direction: 'Input', Para_Lenth: 100, Para_Name: '@Text7',  Para_Type: 'VARCHAR' },
      { Para_Data: params.mName,                    Para_Direction: 'Input', Para_Lenth: 100, Para_Name: '@Text8',  Para_Type: 'VARCHAR' },
      { Para_Data: 'XXXX',                          Para_Direction: 'Input', Para_Lenth: 100, Para_Name: '@Text9',  Para_Type: 'VARCHAR' },
      { Para_Data: '',                              Para_Direction: 'Input', Para_Lenth: 100, Para_Name: '@Text10', Para_Type: 'VARCHAR' },
      { Para_Data: '',                              Para_Direction: 'Input', Para_Lenth: 100, Para_Name: '@Text11', Para_Type: 'VARCHAR' },
      { Para_Data: '',                              Para_Direction: 'Input', Para_Lenth: 100, Para_Name: '@Text12', Para_Type: 'VARCHAR' },
      { Para_Data: '',                              Para_Direction: 'Input', Para_Lenth: 100, Para_Name: '@Text13', Para_Type: 'VARCHAR' },
      { Para_Data: String(params.currentDrop),      Para_Direction: 'Input', Para_Lenth: 100, Para_Name: '@Text14', Para_Type: 'VARCHAR' },
      { Para_Data: String(params.points),           Para_Direction: 'Input', Para_Lenth: 100, Para_Name: '@Text15', Para_Type: 'VARCHAR' },
      { Para_Data: String(params.avgBet),           Para_Direction: 'Input', Para_Lenth: 100, Para_Name: '@Text16', Para_Type: 'VARCHAR' },
      { Para_Data: '0',                              Para_Direction: 'Input', Para_Lenth: 100, Para_Name: '@Text17', Para_Type: 'VARCHAR' },
      { Para_Data: '',                              Para_Direction: 'Input', Para_Lenth: 100, Para_Name: '@Text18', Para_Type: 'VARCHAR' },
      { Para_Data: String(params.totalDrop),        Para_Direction: 'Input', Para_Lenth: 100, Para_Name: '@Text19', Para_Type: 'VARCHAR' },
      { Para_Data: params.butler ? 'T' : 'F',      Para_Direction: 'Input', Para_Lenth: 100, Para_Name: '@Text20', Para_Type: 'VARCHAR' },
    ]);

    console.log('[SUBMIT ORDER] Response:', JSON.stringify(data, null, 2));
    return { success: true, data };

  } catch (error: any) {
    console.error('[SUBMIT ORDER] Error:', error);
    return { success: false, data: error?.message ?? 'Unknown error' };
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// Print KOT
// ─────────────────────────────────────────────────────────────────────────────
export interface PrintKotParams {
  Loca:             string;
  Oni_ApprovedBy:   string;
  Oni_Customer:     string;
  Oni_CustomerName: string;
  Oni_Operator:     string;
  Oni_PintNo:       string;
  Oni_Room:         string;
  Oni_Status:       string;
  PrintBillReceipt: string;
  Unit:             string;
  con:              string;
  strDulicateType:  number;
  strT_Date:        string;
  strT_Time:        string;
}

export interface PrintKotResult {
  success:    boolean;
  strRturnRes?: boolean;
  raw?:        string;
}

export async function printKot(payload: PrintKotParams): Promise<PrintKotResult> {
  try {
    console.log('[PRINT] Payload:', JSON.stringify(payload, null, 2));

    const response = await fetch(PRINT_URL, {
      method: 'POST',
      headers: {
        'content-type':  'application/json',
        'cache-control': 'no-cache',
      },
      body: JSON.stringify(payload),
    });

    console.log('[PRINT] HTTP Status:', response.status);

    const text = await response.text();
    console.log('[PRINT] Raw response:', text);

    try {
      const json = JSON.parse(text);
      console.log('[PRINT] Parsed response:', JSON.stringify(json, null, 2));
      return { success: true, strRturnRes: json?.strRturnRes, raw: text };
    } catch {
      console.log('[PRINT] Response is not JSON:', text);
      return { success: true, raw: text };
    }

  } catch (error: any) {
    console.error('[PRINT] Error:', error?.message ?? error);
    return { success: false };
  }
}


// ─────────────────────────────────────────────────────────────────────────────
// Load Tables  (iid: 1515, con: 2)
// ─────────────────────────────────────────────────────────────────────────────
export interface TableResult {
  TblCode: string;
}

export interface FloorResult {
  Loca: string;
}

export interface LoadTablesResponse {
  floors: FloorResult[];
  tablesByFloor: TableResult[][];
}

export async function loadTables(): Promise<LoadTablesResponse> {
  try {
    console.log('[TABLES] Loading tables...');

    const url  = APIURL;
    const body = {
      HasReturnData: 'T',
      Parameters: [
        {
          Para_Data:      '1515',
          Para_Direction: 'Input',
          Para_Lenth:     10,
          Para_Name:      '@Iid',
          Para_Type:      'int',
        },
      ],
      SpName: 'sp_Android_Common_API',
      con:    '2',
    };

    const response = await fetch(url, {
      method: 'POST',
      headers: { 'content-type': 'application/json', 'cache-control': 'no-cache' },
      body: JSON.stringify(body),
    });

    if (!response.ok) throw new Error(`Server error: ${response.status}`);

    const text = await response.text();
    const data = JSON.parse(text);

    const floors: FloorResult[]     = data?.CommonResult?.Table  ?? [];
    const tablesByFloor: TableResult[][] = floors.map((_: any, i: number) => {
      const key = i === 0 ? 'Table1' : `Table${i + 1}`;
      return data?.CommonResult?.[key] ?? [];
    });

    console.log('[TABLES] Floors:', floors.map((f: FloorResult) => f.Loca));
    tablesByFloor.forEach((tables, i) =>
      console.log(`[TABLES] ${floors[i]?.Loca}: ${tables.length} tables`),
    );

    return { floors, tablesByFloor };

  } catch (error: any) {
    console.error('[TABLES] Error:', error);
    return { floors: [], tablesByFloor: [] };
  }
}

export async function searchGuests(
  query: string,
  mode:  'id' | 'name',
): Promise<GuestSearchResult[]> {
  try {
    const url  = APIURL;
    const body = {
      HasReturnData: 'T',
      Parameters: [
        { Para_Data: '103',                          Para_Direction: 'Input', Para_Lenth: 10,  Para_Name: '@Iid',   Para_Type: 'int'     },
        { Para_Data: query,                          Para_Direction: 'Input', Para_Lenth: 100, Para_Name: '@Text1', Para_Type: 'VARCHAR' },
        { Para_Data: '1',                            Para_Direction: 'Input', Para_Lenth: 100, Para_Name: '@Text2', Para_Type: 'VARCHAR' },
        { Para_Data: '100',                          Para_Direction: 'Input', Para_Lenth: 100, Para_Name: '@Text3', Para_Type: 'VARCHAR' },
        { Para_Data: mode === 'id' ? 'Id' : 'Name', Para_Direction: 'Input', Para_Lenth: 100, Para_Name: '@Text4', Para_Type: 'VARCHAR' },
      ],
      SpName: 'sp_Android_Common_API',
      con:    '2',   // ← was '1' via callAPI
    };

    const response = await fetch(url, {
      method: 'POST',
      headers: { 'content-type': 'application/json', 'cache-control': 'no-cache' },
      body: JSON.stringify(body),
    });

    if (!response.ok) throw new Error(`Server error: ${response.status}`);

    const text = await response.text();
    console.log('[GUEST SEARCH] Raw response:', text);

    const data = JSON.parse(text);
    return data?.CommonResult?.Table ?? [];
  } catch (error: any) {
    console.error('[GUEST SEARCH] Error:', error);
    return [];
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// Submit KOT Check  (iid: 2930)
// Call this BEFORE submitKot (iid: 1314)
// text1 = Free | Paid
// text2 = In House | Gate Pass
// text3 = Unit (Device_Id)
// text4 = DocNo
// ─────────────────────────────────────────────────────────────────────────────
export interface SubmitKotCheckResult {
  success:     boolean;
  approved:    boolean;   // true when strRturnRes === true
  data?:       any;
}

export async function submitKotCheck(params: {
  paymentType:  string;   // text1 — 'Free' | 'Paid'
  deliveryType: string;   // text2 — 'In House' | 'Gate Pass'
  deviceId:     number;   // text3 — Unit
  docNo:        string;   // text4
}): Promise<SubmitKotCheckResult> {
  try {
    console.log('[KOT CHECK] Submitting...', params);

    const data = await callAPI('2930', [
      { Para_Data: params.paymentType,      Para_Direction: 'Input', Para_Lenth: 100, Para_Name: '@Text1', Para_Type: 'VARCHAR' }, // Free | Paid
      { Para_Data: params.deliveryType,     Para_Direction: 'Input', Para_Lenth: 100, Para_Name: '@Text2', Para_Type: 'VARCHAR' }, // In House | Gate Pass
      { Para_Data: String(params.deviceId), Para_Direction: 'Input', Para_Lenth: 100, Para_Name: '@Text3', Para_Type: 'VARCHAR' }, // Unit
      { Para_Data: params.docNo,            Para_Direction: 'Input', Para_Lenth: 100, Para_Name: '@Text4', Para_Type: 'VARCHAR' }, // DocNo
    ]);

    console.log('[KOT CHECK] Response:', JSON.stringify(data, null, 2));

    const approved = data?.strRturnRes === true;
    return { success: true, approved, data };

  } catch (error: any) {
    console.error('[KOT CHECK] Error:', error);
    return { success: false, approved: false, data: error?.message ?? 'Unknown error' };
  }
}

// function formatKotNumber(val: string | number): string {
//   const n = Number(val);
//   if (isNaN(n)) return String(val); // pass through if not a number
 
//   // Format with up to 2 decimal places, then strip trailing .00
//   const formatted = n.toLocaleString('en-US', {
//     minimumFractionDigits: 2,
//     maximumFractionDigits: 2,
//   });
 
//   // Remove .00 suffix only — keep .40, .50, etc.
//   return formatted.endsWith('.00') ? formatted.slice(0, -3) : formatted;
// }
 

 
// ─────────────────────────────────────────────────────────────────────────────
// Submit KOT  (iid: 1314)
// ─────────────────────────────────────────────────────────────────────────────
export interface SubmitKotResult {
  success:      boolean;
  data?:        any;
  strRturnRes?: boolean;
}
 
export async function submitKot(params: {
  docNo:        string;
  loginUser:    string;
  mid:          string;
  deviceId:     number;
  tableName:    string;
  mName:        string;
  paymentType:  string;        // 'Free' | 'Paid'
  currentDrop:  string | number;
  points:       string | number;
  avgBet:       string | number;
  deliveryType: string;        // 'In House' | 'Gate Pass'
  butler:       boolean;
}): Promise<SubmitKotResult> {
  try {
    console.log('[SUBMIT KOT] Submitting...', params);
 
    const data = await callAPI('1314', [
      { Para_Data: params.docNo,                        Para_Direction: 'Input', Para_Lenth: 100, Para_Name: '@Text1',  Para_Type: 'VARCHAR' }, // DocNo
      { Para_Data: params.loginUser,                    Para_Direction: 'Input', Para_Lenth: 100, Para_Name: '@Text2',  Para_Type: 'VARCHAR' }, // LoginUser
      { Para_Data: params.mid,                          Para_Direction: 'Input', Para_Lenth: 100, Para_Name: '@Text3',  Para_Type: 'VARCHAR' }, // MID
      { Para_Data: String(params.deviceId),             Para_Direction: 'Input', Para_Lenth: 100, Para_Name: '@Text4',  Para_Type: 'VARCHAR' }, // Unit
      { Para_Data: params.loginUser,                    Para_Direction: 'Input', Para_Lenth: 100, Para_Name: '@Text5',  Para_Type: 'VARCHAR' }, // LoginUser (repeated)
      { Para_Data: params.tableName,                    Para_Direction: 'Input', Para_Lenth: 100, Para_Name: '@Text6',  Para_Type: 'VARCHAR' }, // Table Name
      { Para_Data: 'DAY',                               Para_Direction: 'Input', Para_Lenth: 100, Para_Name: '@Text7',  Para_Type: 'VARCHAR' }, // "DAY"
      { Para_Data: params.mName,                        Para_Direction: 'Input', Para_Lenth: 100, Para_Name: '@Text8',  Para_Type: 'VARCHAR' }, // MName
      { Para_Data: 'XXXX',                              Para_Direction: 'Input', Para_Lenth: 100, Para_Name: '@Text9',  Para_Type: 'VARCHAR' }, // "XXXX"
      { Para_Data: 'GP',                                Para_Direction: 'Input', Para_Lenth: 100, Para_Name: '@Text10', Para_Type: 'VARCHAR' }, // "GP"
      { Para_Data: '',                                  Para_Direction: 'Input', Para_Lenth: 100, Para_Name: '@Text11', Para_Type: 'VARCHAR' }, // ""
      { Para_Data: '',                                  Para_Direction: 'Input', Para_Lenth: 100, Para_Name: '@Text12', Para_Type: 'VARCHAR' }, // ""
      { Para_Data: params.paymentType,                  Para_Direction: 'Input', Para_Lenth: 100, Para_Name: '@Text13', Para_Type: 'VARCHAR' }, // Free | Paid
      { Para_Data: params.currentDrop, Para_Direction: 'Input', Para_Lenth: 100, Para_Name: '@Text14', Para_Type: 'VARCHAR' }, // DropCurrent  e.g. "50,000"
      { Para_Data: params.points,      Para_Direction: 'Input', Para_Lenth: 100, Para_Name: '@Text15', Para_Type: 'VARCHAR' }, // Points       e.g. "685"
      { Para_Data: params.avgBet,      Para_Direction: 'Input', Para_Lenth: 100, Para_Name: '@Text16', Para_Type: 'VARCHAR' }, // AvgBet       e.g. "49,561.40"
      { Para_Data: '0',                                 Para_Direction: 'Input', Para_Lenth: 100, Para_Name: '@Text17', Para_Type: 'VARCHAR' }, // "0"
      { Para_Data: params.deliveryType,                 Para_Direction: 'Input', Para_Lenth: 100, Para_Name: '@Text18', Para_Type: 'VARCHAR' }, // In House | Gate Pass
      { Para_Data: '',                                  Para_Direction: 'Input', Para_Lenth: 100, Para_Name: '@Text19', Para_Type: 'VARCHAR' }, // ""
      { Para_Data: params.butler ? 'T' : 'F',          Para_Direction: 'Input', Para_Lenth: 100, Para_Name: '@Text20', Para_Type: 'VARCHAR' }, // Butler T | F
    ]);
 
    console.log('[SUBMIT KOT] Response:', JSON.stringify(data, null, 2));
    return { success: true, data, strRturnRes: data?.strRturnRes };
 
  } catch (error: any) {
    console.error('[SUBMIT KOT] Error:', error);
    return { success: false, data: error?.message ?? 'Unknown error' };
  }
}


// ─────────────────────────────────────────────────────────────────────────────
// Submit KOT Item  (iid: 7)

export interface SubmitKotItemResult {
  success:      boolean;
  strRturnRes?: boolean;
  data?:        any;
}
export async function submitKotItem(params: {
  prodCode:      string;
  prodName:      string;
  sellingPrice:  number;
  purchasePrice: number;
  docNo:         string;
  unitNo:        number;
  loginUser:     string;
  qty:           number;
  tableNo:       string;
  kotId:         boolean;
  botId:         boolean;
}): Promise<SubmitKotItemResult> {
  try {
    console.log('[SUBMIT KOT ITEM] Submitting...', params);

    const lineTotal = params.qty * params.sellingPrice;

    const data = await callAPI('7', [
      { Para_Data: params.prodCode,              Para_Direction: 'Input', Para_Lenth: 100, Para_Name: '@Text1',  Para_Type: 'VARCHAR' }, // Prod_Code
      { Para_Data: params.prodName,              Para_Direction: 'Input', Para_Lenth: 100, Para_Name: '@Text2',  Para_Type: 'VARCHAR' }, // Prod_Name
      { Para_Data: String(params.sellingPrice),  Para_Direction: 'Input', Para_Lenth: 100, Para_Name: '@Text3',  Para_Type: 'VARCHAR' }, // Selling_Price
      { Para_Data: String(params.purchasePrice), Para_Direction: 'Input', Para_Lenth: 100, Para_Name: '@Text4',  Para_Type: 'VARCHAR' }, // Purchase_Price
      { Para_Data: params.docNo,                 Para_Direction: 'Input', Para_Lenth: 100, Para_Name: '@Text5',  Para_Type: 'VARCHAR' }, // Doc_No
      { Para_Data: '',                           Para_Direction: 'Input', Para_Lenth: 100, Para_Name: '@Text6',  Para_Type: 'VARCHAR' }, // ""
      { Para_Data: '',                           Para_Direction: 'Input', Para_Lenth: 100, Para_Name: '@Text7',  Para_Type: 'VARCHAR' }, // ""
      { Para_Data: String(params.unitNo),        Para_Direction: 'Input', Para_Lenth: 100, Para_Name: '@Text8',  Para_Type: 'VARCHAR' }, // Unit (Device_Id)
      { Para_Data: params.loginUser,             Para_Direction: 'Input', Para_Lenth: 100, Para_Name: '@Text9',  Para_Type: 'VARCHAR' }, // LoginUser
      { Para_Data: String(params.qty),           Para_Direction: 'Input', Para_Lenth: 100, Para_Name: '@Text10', Para_Type: 'VARCHAR' }, // Qty
      { Para_Data: params.tableNo,               Para_Direction: 'Input', Para_Lenth: 100, Para_Name: '@Text11', Para_Type: 'VARCHAR' }, // Table_No
      { Para_Data: String(params.kotId),         Para_Direction: 'Input', Para_Lenth: 100, Para_Name: '@Text12', Para_Type: 'VARCHAR' }, // KOT_Id → "true" / "false"
      { Para_Data: String(params.botId),         Para_Direction: 'Input', Para_Lenth: 100, Para_Name: '@Text13', Para_Type: 'VARCHAR' }, // BOT_Id → "true" / "false"
      { Para_Data: String(lineTotal),            Para_Direction: 'Input', Para_Lenth: 100, Para_Name: '@Text14', Para_Type: 'VARCHAR' }, // Qty * Selling_Price
      { Para_Data: '001',                        Para_Direction: 'Input', Para_Lenth: 100, Para_Name: '@Text15', Para_Type: 'VARCHAR' }, // "001"
    ]);

    console.log('[SUBMIT KOT ITEM] Response:', JSON.stringify(data, null, 2));
    return { success: true, data, strRturnRes: data?.strRturnRes };

  } catch (error: any) {
    console.error('[SUBMIT KOT ITEM] Error:', error);
    return { success: false, data: error?.message ?? 'Unknown error' };
  }
}


// ─────────────────────────────────────────────────────────────────────────────
// Load KOT Items  (iid: 8)
//    Text1 = Unit No (Device_Id)
//    Text2 = Doc No
//    Text3 = Mac Address (UniqueId)
// ─────────────────────────────────────────────────────────────────────────────
export interface KotItemResult {
  Prod_Code:     string;
  Prod_Name:     string;
  Selling_Price: number;
  Qty:           number;
  Amount:        number;
  [key: string]: any;
}

export async function loadKotItems(
  unitNo:   number,
  docNo:    string,
  mac:      string,
): Promise<KotItemResult[]> {
  try {
    console.log('[KOT ITEMS] Loading — Unit:', unitNo, 'Doc:', docNo);

    const data = await callAPI('8', [
      { Para_Data: String(unitNo), Para_Direction: 'Input', Para_Lenth: 100, Para_Name: '@Text1', Para_Type: 'VARCHAR' },
      { Para_Data: docNo,          Para_Direction: 'Input', Para_Lenth: 100, Para_Name: '@Text2', Para_Type: 'VARCHAR' },
      { Para_Data: mac,            Para_Direction: 'Input', Para_Lenth: 100, Para_Name: '@Text3', Para_Type: 'VARCHAR' },
    ]);

    console.log('[KOT ITEMS] Response:', JSON.stringify(data, null, 2));

    const table: KotItemResult[] = data?.CommonResult?.Table ?? [];
    console.log('[KOT ITEMS] Loaded:', table.length, 'items');
    return table;

  } catch (error: any) {
    console.error('[KOT ITEMS] Error:', error);
    return [];
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// Delete KOT Item  (iid: 9)
//    Text1 = Prod_Code
//    Text2 = Unit (Device_Id)
//    Text3 = Id_No
//    Text4 = MacAddress (UniqueId)
// ─────────────────────────────────────────────────────────────────────────────
export interface DeleteKotItemResult {
  success:      boolean;
  strRturnRes?: boolean;
  data?:        any;
}

export async function deleteKotItem(params: {
  prodCode: string;
  unitNo:   number;
  docNo:    string;
  idNo:     number;
  mac:      string;
}): Promise<DeleteKotItemResult & { refreshedItems: KotItemResult[] }> {
  try {
    console.log('[DELETE KOT ITEM] Deleting...', params);

    // Send Id_No as float string — matches how the DB stores it (e.g. "798784.0")
    const idNoStr = Number.isInteger(params.idNo)
      ? `${params.idNo}.0`
      : String(params.idNo);

    // ── Step 1: Delete (iid 9, con 1, Id_No as float) ─────────────────────
    const deleteData = await callAPI('9', [
      { Para_Data: params.prodCode,       Para_Direction: 'Input', Para_Lenth: 100, Para_Name: '@Text1', Para_Type: 'VARCHAR' },
      { Para_Data: String(params.unitNo), Para_Direction: 'Input', Para_Lenth: 100, Para_Name: '@Text2', Para_Type: 'VARCHAR' },
      { Para_Data: idNoStr,               Para_Direction: 'Input', Para_Lenth: 100, Para_Name: '@Text3', Para_Type: 'VARCHAR' },
      { Para_Data: params.mac,            Para_Direction: 'Input', Para_Lenth: 100, Para_Name: '@Text4', Para_Type: 'VARCHAR' },
    ]);

    console.log('[DELETE KOT ITEM] Delete response:', JSON.stringify(deleteData, null, 2));

    // ── Step 2: Reload items (iid 8, con 1) — source of truth ─────────────
    const refreshData = await callAPI('8', [
      { Para_Data: String(params.unitNo), Para_Direction: 'Input', Para_Lenth: 100, Para_Name: '@Text1', Para_Type: 'VARCHAR' },
      { Para_Data: params.docNo,          Para_Direction: 'Input', Para_Lenth: 100, Para_Name: '@Text2', Para_Type: 'VARCHAR' },
      { Para_Data: params.mac,            Para_Direction: 'Input', Para_Lenth: 100, Para_Name: '@Text3', Para_Type: 'VARCHAR' },
    ]);

    console.log('[DELETE KOT ITEM] Refresh response:', JSON.stringify(refreshData, null, 2));

    const refreshedItems: KotItemResult[] = refreshData?.CommonResult?.Table ?? [];

    return {
      success:        true,
      strRturnRes:    deleteData?.strRturnRes,
      data:           deleteData,
      refreshedItems,
    };

  } catch (error: any) {
    console.error('[DELETE KOT ITEM] Error:', error);
    return { success: false, data: error?.message ?? 'Unknown error', refreshedItems: [] };
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// Load Button Visibility  (iid: 47)
//    Text1 = Unit No (Device_Id), Text2 = Doc No, Text3 = UniqueId
//    Returns a map of button key → isActive
//    Note: API returns "QR SCAN" (space) — normalised to "QR_SCAN" (underscore)
// ─────────────────────────────────────────────────────────────────────────────
export interface ButtonVisibilityResult {
  Button_Name: string;
  isActive:    boolean;
}

export async function loadButtonVisibility(
  unitNo:   number,
  docNo:    string,
  uniqueId: string,
): Promise<Record<string, boolean>> {
  try {
    console.log('[BUTTON VISIBILITY] Loading — Unit:', unitNo, 'Doc:', docNo);

    const data = await callAPI('47', [
      { Para_Data: String(unitNo), Para_Direction: 'Input', Para_Lenth: 100, Para_Name: '@Text1', Para_Type: 'VARCHAR' },
      { Para_Data: docNo,          Para_Direction: 'Input', Para_Lenth: 100, Para_Name: '@Text2', Para_Type: 'VARCHAR' },
      { Para_Data: uniqueId,       Para_Direction: 'Input', Para_Lenth: 100, Para_Name: '@Text3', Para_Type: 'VARCHAR' },
    ]);

    console.log('[BUTTON VISIBILITY] Response:', JSON.stringify(data, null, 2));

    const table: ButtonVisibilityResult[] = data?.CommonResult?.Table ?? [];

    // Normalise key: replace spaces with underscores so "QR SCAN" → "QR_SCAN"
    const map: Record<string, boolean> = {};
    table.forEach(row => {
      const key = row.Button_Name.replace(/\s+/g, '_');
      map[key]  = row.isActive;
    });

    console.log('[BUTTON VISIBILITY] Parsed map:', map);
    return map;

  } catch (error: any) {
    console.error('[BUTTON VISIBILITY] Error:', error);
    return {};
  }
}


// ─────────────────────────────────────────────────────────────────────────────
// Load Run Date  (iid: 2323, con: 2)
//    IMPORTANT: must use raw fetch — callAPI always sends con: '1'
// ─────────────────────────────────────────────────────────────────────────────
export async function loadRunDate(): Promise<string | null> {
  try {
    console.log('[RUN DATE] Loading...');

    const url  = APIURL;
    const body = {
      HasReturnData: 'T',
      Parameters: [
        {
          Para_Data:      '2323',
          Para_Direction: 'Input',
          Para_Lenth:     10,
          Para_Name:      '@Iid',
          Para_Type:      'int',
        },
      ],
      SpName: 'sp_Android_Common_API',
      con:    '2',          // ← must stay '2' — do NOT use callAPI() here
    };

    const response = await fetch(url, {
      method:  'POST',
      headers: { 'content-type': 'application/json', 'cache-control': 'no-cache' },
      body:    JSON.stringify(body),
    });

    if (!response.ok) throw new Error(`Server error: ${response.status}`);

    const text = await response.text();
    console.log('[RUN DATE] Raw response:', text);

    const data  = JSON.parse(text);
    const table = data?.CommonResult?.Table ?? [];
    const row   = table[0] ?? null;
    if (!row) return null;

    const raw = String(
      row.RunDate  ?? row.Run_Date ?? row.Rundate ??
      row.run_date ?? Object.values(row)[0] ?? ''
    );

    if (!raw) return null;

    // Strip time portion: "2026-04-02T00:00:00" → "2026-04-02"
    const dateOnly = raw.split('T')[0];
    console.log('[RUN DATE] Raw:', raw, '→ dateOnly:', dateOnly);
    return dateOnly;

  } catch (error: any) {
    console.error('[RUN DATE] Error:', error);
    return null;
  }
}


// ─────────────────────────────────────────────────────────────────────────────
// Load Pit Past Orders  (iid: 2401, con: 1)
//    Text1 = MID
//    Text2 = dept code or "ALL"
//    Text3 = RunDate (YYYY-MM-DD — stripped by loadRunDate)
// ─────────────────────────────────────────────────────────────────────────────
export interface PitPastOrderItem {
  Receipt_No?:  string;
  Prod_Code?:   string;
  Prod_Name?:   string;
  Dept_Name?:   string;
  Qty?:         string | number;
  Amount?:      string | number;
  Tr_Date?:     string;
  Steward?:     string;
  [key: string]: any;
}

export async function loadPitPastOrders(
  mid:     string,
  dept:    string,
  runDate: string,
): Promise<PitPastOrderItem[]> {
  try {
    console.log('[PIT PAST ORDERS] MID:', mid, 'Dept:', dept, 'RunDate:', runDate);

    const url  = APIURL;
    const body = {
      HasReturnData: 'T',
      Parameters: [
        { Para_Data: '2401',   Para_Direction: 'Input', Para_Lenth: 10,  Para_Name: '@Iid',   Para_Type: 'int'     },
        { Para_Data: mid,      Para_Direction: 'Input', Para_Lenth: 100, Para_Name: '@Text1',  Para_Type: 'VARCHAR' },
        { Para_Data: dept,     Para_Direction: 'Input', Para_Lenth: 100, Para_Name: '@Text2',  Para_Type: 'VARCHAR' },
        { Para_Data: runDate,  Para_Direction: 'Input', Para_Lenth: 100, Para_Name: '@Text3',  Para_Type: 'VARCHAR' },
      ],
      SpName: 'sp_Android_Common_API',
      con:    '1',
    };

    const response = await fetch(url, {
      method:  'POST',
      headers: { 'content-type': 'application/json', 'cache-control': 'no-cache' },
      body:    JSON.stringify(body),
    });

    if (!response.ok) throw new Error(`Server error: ${response.status}`);

    const text = await response.text();
    console.log('[PIT PAST ORDERS] Raw response:', text);

    const data  = JSON.parse(text);
    const table: PitPastOrderItem[] = data?.CommonResult?.Table ?? [];
    console.log('[PIT PAST ORDERS] Loaded:', table.length, 'records');

    if (table.length > 0) {
      console.log('[PIT PAST ORDERS] Fields:', Object.keys(table[0]));
      console.log('[PIT PAST ORDERS] First row:', JSON.stringify(table[0]));
    }

    return table;

  } catch (error: any) {
    console.error('[PIT PAST ORDERS] Error:', error);
    return [];
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// Load Pit Past Orders by Department  (iid: 1501, con: 1)
//    Text1 = MID
//    Text2 = DeptCode   (specific dept — NOT "ALL")
//    Text3 = RunDate    (YYYY-MM-DD from iid 2323)
// ─────────────────────────────────────────────────────────────────────────────
export interface PitDeptOrderItem {
  Receipt_No?:  string;
  Prod_Code?:   string;
  Prod_Name?:   string;
  Dept_Name?:   string;
  Qty?:         string | number;
  Amount?:      string | number;
  Tr_Date?:     string;
  Steward?:     string;
  [key: string]: any;
}

export async function loadPitDeptOrders(
  mid:      string,
  deptCode: string,
  runDate:  string,
): Promise<PitDeptOrderItem[]> {
  try {
    console.log('[PIT DEPT ORDERS] MID:', mid, 'Dept:', deptCode, 'RunDate:', runDate);

    const url  = APIURL;
    const body = {
      HasReturnData: 'T',
      Parameters: [
        { Para_Data: '1501',    Para_Direction: 'Input', Para_Lenth: 10,  Para_Name: '@Iid',   Para_Type: 'int'     },
        { Para_Data: mid,       Para_Direction: 'Input', Para_Lenth: 100, Para_Name: '@Text1',  Para_Type: 'VARCHAR' },
        { Para_Data: deptCode,  Para_Direction: 'Input', Para_Lenth: 100, Para_Name: '@Text2',  Para_Type: 'VARCHAR' },
        { Para_Data: runDate,   Para_Direction: 'Input', Para_Lenth: 100, Para_Name: '@Text3',  Para_Type: 'VARCHAR' },
      ],
      SpName: 'sp_Android_Common_API',
      con:    '1',
    };

    const response = await fetch(url, {
      method:  'POST',
      headers: { 'content-type': 'application/json', 'cache-control': 'no-cache' },
      body:    JSON.stringify(body),
    });

    if (!response.ok) throw new Error(`Server error: ${response.status}`);

    const text = await response.text();
    console.log('[PIT DEPT ORDERS] Raw response:', text);

    const data  = JSON.parse(text);
    const table: PitDeptOrderItem[] = data?.CommonResult?.Table ?? [];
    console.log('[PIT DEPT ORDERS] Loaded:', table.length, 'records');

    if (table.length > 0) {
      console.log('[PIT DEPT ORDERS] Fields:', Object.keys(table[0]));
      console.log('[PIT DEPT ORDERS] First row:', JSON.stringify(table[0]));
    }

    return table;

  } catch (error: any) {
    console.error('[PIT DEPT ORDERS] Error:', error);
    return [];
  }
}