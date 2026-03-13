export interface User {
  id: string;
  username: string;
  role: 'user' | 'admin' | 'superadmin';
  created_at: string;
  parent_id?: string | null;
  bank_account?: string | null;
}

export interface Distributor {
  id: string;
  user_id: string;
  domain: string;
  site_name: string;
  logo_url: string | null;
  primary_color: string;
  secondary_color: string;
  is_active: boolean;
  created_at: string;
  username?: string;
  bank_name: string | null;
  account_number: string | null;
  account_holder: string | null;
  slot_price: number;
  extension_price: number;
  cost_price: number;
}

export interface Settlement {
  distributorId: string;
  siteName: string;
  username: string;
  bankName: string | null;
  accountNumber: string | null;
  accountHolder: string | null;
  slotPrice: number;
  costPrice: number;
  userCount: number;
  totalSlotCount: number;
  totalSalesAmount: number;
  costToHQ: number;
  settlementAmount: number;
  isPaid: boolean;
  paidAt: string | null;
  paidAmount: number;
}

export interface Slot {
  id: string;
  user_id: string;
  girl_name: string;
  shop_name: string | null;
  target_room: string;
  kakao_id: string;
  is_active: boolean;
  expires_at: string;
  created_at: string;
  username?: string;
  distributor_name?: string;
}

// 가게명 프리셋
export const SHOP_NAMES = ['도파민', '유앤미', '달토', '퍼펙트', '엘리트'];
