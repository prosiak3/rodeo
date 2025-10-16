/**
 * Supabase Client Configuration and Type Definitions
 *
 * This module provides the configured Supabase client instance and all TypeScript
 * type definitions for the RODEO application data models.
 *
 * @module lib/supabase
 */

import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  console.error('Supabase URL:', supabaseUrl);
  console.error('Supabase Key exists:', !!supabaseAnonKey);
  throw new Error('Missing Supabase environment variables. Check .env file.');
}

/**
 * Supabase client instance configured with environment variables.
 * All database queries should use this singleton instance.
 *
 * @example
 * const { data, error } = await supabase
 *   .from('products')
 *   .select('*')
 *   .eq('active', true);
 */
export const supabase = createClient(supabaseUrl, supabaseAnonKey);

/**
 * User roles in the RODEO system.
 * Each role has different permissions enforced by RLS policies.
 *
 * - store_manager: Manages single store, can create and view own orders
 * - salesperson: Manages multiple stores, can view and assist with orders
 * - operator: Processes orders, can confirm/reject order items
 * - admin: Full system access, manages users, products, and settings
 * - driver: Views and manages deliveries for assigned routes
 * - analyst: Read-only access to analytics and reporting data
 */
export type UserRole = 'store_manager' | 'salesperson' | 'operator' | 'admin' | 'driver' | 'analyst';

/**
 * Order lifecycle statuses.
 *
 * Flow: draft → notatnik → sent → in_progress → confirmed → archived
 *                       ↓
 *                   rejected
 *
 * - draft: Order being created, not yet submitted
 * - notatnik: Notebook/scratch pad for collecting items
 * - sent: Order submitted and waiting for processing
 * - in_progress: Being prepared by warehouse
 * - pending_confirmation: Awaiting operator confirmation
 * - confirmed: All items confirmed and ready for delivery
 * - partially_confirmed: Some items confirmed, some rejected
 * - rejected: Order rejected by operator
 * - archived: Historical order, read-only
 */
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

/**
 * Order creation source types for analytics tracking.
 *
 * - price_list: Created from browsing price list
 * - manual: Manually entered by user
 * - voice: Created using voice recognition + AI
 * - copy: Copied from previous order
 * - auto: Auto-generated based on purchase history
 */
export type OrderSourceType = 'price_list' | 'manual' | 'voice' | 'copy' | 'auto';

/**
 * Store/Shop entity representing a customer location.
 */
export interface Store {
  /** Unique identifier (UUID) */
  id: string;
  /** Display name of the store */
  name: string;
  /** Unique store code (e.g., "SHOP001") */
  code: string;
  /** Physical address (optional) */
  address?: string;
  /** Contact phone number (optional) */
  phone?: string;
  /** Whether store is active and can place orders */
  active: boolean;
  /** Creation timestamp */
  created_at: string;
  /** Last update timestamp */
  updated_at: string;
}

/**
 * User entity with role-based permissions.
 * Linked to Supabase Auth users table.
 */
export interface User {
  /** Unique identifier (UUID), matches auth.users.id */
  id: string;
  /** User email address */
  email: string;
  /** Full name for display */
  full_name: string;
  /** User role determining permissions */
  role: UserRole;
  /** Associated store ID (for store_manager role) */
  store_id?: string;
  /** Whether user account is active */
  active: boolean;
  /** Account creation timestamp */
  created_at: string;
  /** Last update timestamp */
  updated_at: string;
  /** Show all order status filters (UI preference) */
  show_all_order_filters?: boolean;
  /** Days to analyze for auto-order suggestions (default: 30) */
  auto_order_analysis_days?: number;
  /** Show sort buttons in UI (preference) */
  show_sort_buttons?: boolean;
}

/**
 * Product entity representing a meat product in the catalog.
 */
export interface Product {
  /** Unique identifier (UUID) */
  id: string;
  /** Product display name */
  name: string;
  /** Internal product code */
  code: string;
  /** Product category for grouping */
  category: string;
  /** Unit of measurement (kg, szt, etc.) */
  unit: string;
  /** Base price in PLN */
  base_price: number;
  /** Product image URL (optional) */
  image_url?: string;
  /** Product description (optional) */
  description?: string;
  /** Whether product is available for ordering */
  active: boolean;
  /** Creation timestamp */
  created_at: string;
  /** Last update timestamp */
  updated_at: string;
  /** Product index/code for sorting (e.g., "1.01") */
  index?: string;
  /** Average weight for piece-sold products (kg) */
  average_weight?: number;
}

/**
 * Special pricing for specific store-product combinations.
 * Takes precedence over base_price when valid.
 */
export interface SpecialPrice {
  /** Unique identifier (UUID) */
  id: string;
  /** Store receiving special pricing */
  store_id: string;
  /** Product with special pricing */
  product_id: string;
  /** Special price in PLN (overrides base_price) */
  special_price: number;
  /** Start date of special pricing */
  valid_from: string;
  /** End date of special pricing (null = indefinite) */
  valid_to?: string;
  /** Creation timestamp */
  created_at: string;
}

/**
 * Order entity representing a store's purchase order.
 * Contains header information; items are in OrderItem table.
 */
export interface Order {
  /** Unique identifier (UUID) */
  id: string;
  /** Human-readable order number (e.g., "ORD-2024-001234") */
  order_number: string;
  /** Store placing the order */
  store_id: string;
  /** User who created the order */
  created_by: string;
  /** Current order status in lifecycle */
  status: OrderStatus;
  /** Whether order requires operator confirmation */
  requires_confirmation: boolean;
  /** Total order amount in PLN */
  total_amount: number;
  /** Voice recognition transcript (for voice orders) */
  voice_transcript?: string;
  /** Additional notes or comments */
  notes?: string;
  /** When order was submitted (status changed to 'sent') */
  sent_at?: string;
  /** When order was confirmed by operator */
  confirmed_at?: string;
  /** Requested delivery date */
  delivery_date?: string;
  /** Creation timestamp */
  created_at: string;
  /** Last update timestamp */
  updated_at: string;
  /** How the order was created (for analytics) */
  source_type?: OrderSourceType;
  /** Creator user info (from JOIN) */
  creator?: {
    full_name: string;
    email: string;
    role: UserRole;
  };
  /** Store info (from JOIN) */
  store?: {
    name: string;
    code: string;
  };
}

/**
 * Individual line item in an order.
 * Tracks product, quantity, pricing, and confirmation status.
 */
export interface OrderItem {
  /** Unique identifier (UUID) */
  id: string;
  /** Parent order ID */
  order_id: string;
  /** Product being ordered */
  product_id: string;
  /** Requested quantity */
  quantity: number;
  /** Unit of measurement */
  unit: string;
  /** Price per unit at time of order */
  unit_price: number;
  /** Total price (quantity * unit_price) */
  total_price: number;
  /** Confirmed quantity (may differ from requested) */
  confirmed_quantity?: number;
  /** Item confirmation status */
  status: 'pending' | 'confirmed' | 'partially_confirmed' | 'rejected';
  /** Creation timestamp */
  created_at: string;
  /** Product details (from JOIN) */
  products?: Product;
  /** Whether quantity is estimated (for piece-sold items) */
  is_estimated?: boolean;
}

/**
 * Audit log entry for order modifications.
 * Tracks who did what and when for compliance.
 */
export interface OrderHistory {
  /** Unique identifier (UUID) */
  id: string;
  /** Order being modified */
  order_id: string;
  /** Action performed (e.g., "status_changed", "item_added") */
  action: string;
  /** User who performed the action */
  performed_by: string;
  /** Additional action details (JSON) */
  details?: any;
  /** When action occurred */
  created_at: string;
  /** User info (from JOIN) */
  users?: {
    full_name: string;
    email: string;
    role: UserRole;
  };
}
