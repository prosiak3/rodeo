import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  console.error('Supabase URL:', supabaseUrl);
  console.error('Supabase Key exists:', !!supabaseAnonKey);
  throw new Error('Missing Supabase environment variables. Check .env file.');
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

export type UserRole = 'store_manager' | 'salesperson' | 'operator' | 'admin';

export type OrderStatus =
  | 'draft'
  | 'notatnik'
  | 'sent'
  | 'in_progress'
  | 'pending_confirmation'
  | 'confirmed'
  | 'partially_confirmed'
  | 'rejected'
  | 'archived';

export type OrderSourceType = 'price_list' | 'manual' | 'voice' | 'copy' | 'auto';

export interface Store {
  id: string;
  name: string;
  code: string;
  address?: string;
  phone?: string;
  active: boolean;
  created_at: string;
  updated_at: string;
}

export interface User {
  id: string;
  email: string;
  full_name: string;
  role: UserRole;
  store_id?: string;
  active: boolean;
  created_at: string;
  updated_at: string;
  show_all_order_filters?: boolean;
  auto_order_analysis_days?: number;
  show_sort_buttons?: boolean;
}

export interface Product {
  id: string;
  name: string;
  code: string;
  category: string;
  unit: string;
  base_price: number;
  image_url?: string;
  description?: string;
  active: boolean;
  created_at: string;
  updated_at: string;
  index?: string;
  average_weight?: number;
}

export interface SpecialPrice {
  id: string;
  store_id: string;
  product_id: string;
  special_price: number;
  valid_from: string;
  valid_to?: string;
  created_at: string;
}

export interface Order {
  id: string;
  order_number: string;
  store_id: string;
  created_by: string;
  status: OrderStatus;
  requires_confirmation: boolean;
  total_amount: number;
  voice_transcript?: string;
  notes?: string;
  sent_at?: string;
  confirmed_at?: string;
  delivery_date?: string;
  created_at: string;
  updated_at: string;
  source_type?: OrderSourceType;
  creator?: {
    full_name: string;
    email: string;
    role: UserRole;
  };
  store?: {
    name: string;
    code: string;
  };
}

export interface OrderItem {
  id: string;
  order_id: string;
  product_id: string;
  quantity: number;
  unit: string;
  unit_price: number;
  total_price: number;
  confirmed_quantity?: number;
  status: 'pending' | 'confirmed' | 'partially_confirmed' | 'rejected';
  created_at: string;
  products?: Product;
  is_estimated?: boolean;
}

export interface OrderHistory {
  id: string;
  order_id: string;
  action: string;
  performed_by: string;
  details?: any;
  created_at: string;
  users?: {
    full_name: string;
    email: string;
    role: UserRole;
  };
}
