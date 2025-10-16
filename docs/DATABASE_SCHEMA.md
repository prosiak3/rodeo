# RODEO - Database Schema Documentation

## Overview

The RODEO database is built on PostgreSQL via Supabase and uses Row Level Security (RLS) to enforce permissions. The schema consists of core tables for orders, products, users, and stores, plus advanced features for analytics, AI voice recognition, and marketing campaigns.

**Total Tables**: 20+
**Total Migrations**: 89 files
**RLS**: Enabled on all tables with role-based policies

## Core Tables

### 1. stores

Represents customer stores/shops that place orders.

```sql
CREATE TABLE stores (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  code text UNIQUE NOT NULL,
  address text,
  phone text,
  active boolean DEFAULT true,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);
```

**Columns:**
- `id`: Unique identifier (UUID)
- `name`: Display name (e.g., "Sklep Mięsny U Jana")
- `code`: Unique business code (e.g., "SHOP001")
- `address`: Physical address
- `phone`: Contact phone number
- `active`: Whether store can place orders
- `created_at`: Record creation timestamp
- `updated_at`: Last modification timestamp

**Indexes:**
- `stores_code_idx` on `code` for fast lookup

**RLS Policies:**
- Store managers: Can view own store
- Salespeople: Can view assigned stores
- Operators/Admins: Can view all stores

---

### 2. users

Extended user profiles linked to Supabase Auth.

```sql
CREATE TABLE users (
  id uuid PRIMARY KEY REFERENCES auth.users(id),
  email text UNIQUE NOT NULL,
  full_name text NOT NULL,
  role text NOT NULL CHECK (role IN ('store_manager', 'salesperson', 'operator', 'admin', 'driver', 'analyst')),
  store_id uuid REFERENCES stores(id),
  active boolean DEFAULT true,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  -- User preferences
  show_all_order_filters boolean DEFAULT false,
  auto_order_analysis_days integer DEFAULT 30,
  show_sort_buttons boolean DEFAULT true,
  order_mode text DEFAULT 'grid',
  order_mode_layout text DEFAULT 'grid',
  theme_preference text DEFAULT 'light',
  enable_voice_orders boolean DEFAULT true,
  enable_manual_orders boolean DEFAULT true,
  enable_copy_orders boolean DEFAULT true,
  enable_pricelist_orders boolean DEFAULT true,
  price_list_display_mode text DEFAULT 'card',
  show_product_images boolean DEFAULT true,
  show_product_codes boolean DEFAULT false,
  show_product_categories boolean DEFAULT true,
  show_notatnik_button boolean DEFAULT true,
  notebook_mode_preference text DEFAULT 'standard',
  show_order_details_status_expanded boolean DEFAULT false,
  notebook_button_labels text DEFAULT 'icons_text',
  show_delete_icons boolean DEFAULT true
);
```

**Roles:**
- `store_manager`: Manages single store, creates orders
- `salesperson`: Manages multiple stores, assists with orders
- `operator`: Processes and confirms orders
- `admin`: Full system access
- `driver`: Manages deliveries
- `analyst`: Read-only analytics access

**Preferences:**
User preferences are stored as columns to avoid separate table joins. This improves query performance and simplifies RLS policies.

**RLS Policies:**
- Users can view/update own profile
- Admins can view/update all users
- Other roles have read-only access to basic user info

---

### 3. products

Meat and meat products catalog.

```sql
CREATE TABLE products (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  code text UNIQUE NOT NULL,
  category text NOT NULL,
  unit text NOT NULL,
  base_price decimal(10,2) NOT NULL CHECK (base_price >= 0),
  image_url text,
  description text,
  active boolean DEFAULT true,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  index text,  -- Product sorting index (e.g., "1.01")
  average_weight decimal(10,3),  -- For piece-sold items
  quantity_step decimal(10,3) DEFAULT 1.0,
  quantity_min decimal(10,3) DEFAULT 0.0,
  quantity_max decimal(10,3),
  display_category text,  -- Category for UI grouping
  promo_10_plus_1 boolean DEFAULT false,  -- 10+1 promotion flag
  promo_discount_percentage integer DEFAULT 0 CHECK (promo_discount_percentage >= 0 AND promo_discount_percentage <= 100)
);
```

**Columns:**
- `id`: Unique identifier
- `name`: Product name (e.g., "Schab wieprzowy")
- `code`: Internal product code
- `category`: Original category
- `unit`: Measurement unit (kg, szt, opak)
- `base_price`: Default price in PLN
- `index`: Sorting code for price lists
- `average_weight`: Weight for estimation (piece-sold items)
- `quantity_step`: Increment for ordering (e.g., 0.5 kg)
- `quantity_min/max`: Validation constraints
- `display_category`: UI-friendly category name
- `promo_10_plus_1`: Eligible for "buy 10 get 11" promotion
- `promo_discount_percentage`: Active discount (15%, 50%, etc.)

**Indexes:**
- `products_code_idx` on `code`
- `products_category_idx` on `category`
- `products_active_idx` on `active`
- `products_index_idx` on `index` (for sorting price lists)

**RLS Policies:**
- All authenticated users: Can read active products
- Admins: Can create/update/delete products

---

### 4. special_prices

Store-specific product pricing that overrides base_price.

```sql
CREATE TABLE special_prices (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  store_id uuid NOT NULL REFERENCES stores(id) ON DELETE CASCADE,
  product_id uuid NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  special_price decimal(10,2) NOT NULL CHECK (special_price >= 0),
  valid_from timestamptz NOT NULL DEFAULT now(),
  valid_to timestamptz,
  created_at timestamptz DEFAULT now(),
  UNIQUE(store_id, product_id, valid_from)
);
```

**Usage:**
When calculating order prices, system checks for active special_price:
1. If `valid_from <= now() AND (valid_to IS NULL OR valid_to >= now())`
2. Use `special_price` instead of `base_price`
3. Otherwise use `base_price`

**RLS Policies:**
- Store managers: Can view own store's special prices
- Salespeople: Can view assigned stores' special prices
- Operators/Admins: Full access

---

### 5. orders

Customer order headers.

```sql
CREATE TABLE orders (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  order_number text UNIQUE NOT NULL,
  store_id uuid NOT NULL REFERENCES stores(id),
  created_by uuid NOT NULL REFERENCES users(id),
  status text NOT NULL CHECK (status IN ('draft', 'notatnik', 'sent', 'in_progress', 'pending_confirmation', 'confirmed', 'partially_confirmed', 'rejected', 'archived')),
  requires_confirmation boolean DEFAULT false,
  total_amount decimal(10,2) NOT NULL DEFAULT 0,
  voice_transcript text,
  notes text,
  sent_at timestamptz,
  confirmed_at timestamptz,
  delivery_date date,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  source_type text CHECK (source_type IN ('price_list', 'manual', 'voice', 'copy', 'auto'))
);
```

**Status Lifecycle:**

```
draft → notatnik → sent → in_progress → confirmed → archived
                       ↓
                   rejected
```

**Status Descriptions:**
- `draft`: Being created, not submitted
- `notatnik`: Notebook/scratchpad for collecting items
- `sent`: Submitted and awaiting processing
- `in_progress`: Being prepared by warehouse
- `pending_confirmation`: Awaiting operator approval
- `confirmed`: All items confirmed
- `partially_confirmed`: Some items confirmed, some rejected
- `rejected`: Order declined by operator
- `archived`: Historical, read-only

**Source Types:**
- `price_list`: Created from browsing price list
- `manual`: Manually entered
- `voice`: Voice recognition + AI
- `copy`: Copied from previous order
- `auto`: Auto-generated from history

**Indexes:**
- `orders_order_number_idx` on `order_number` (unique)
- `orders_store_id_idx` on `store_id`
- `orders_created_by_idx` on `created_by`
- `orders_status_idx` on `status`
- `orders_sent_at_idx` on `sent_at`

**RLS Policies:**
- Store managers: Can view/create/update own store's orders
- Salespeople: Can view assigned stores' orders
- Operators: Can view/update all orders (for confirmation)
- Admins: Full access

---

### 6. order_items

Individual line items in orders.

```sql
CREATE TABLE order_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id uuid NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  product_id uuid NOT NULL REFERENCES products(id),
  quantity decimal(10,3) NOT NULL CHECK (quantity > 0),
  unit text NOT NULL,
  unit_price decimal(10,2) NOT NULL,
  total_price decimal(10,2) NOT NULL,
  confirmed_quantity decimal(10,3),
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'confirmed', 'partially_confirmed', 'rejected')),
  created_at timestamptz DEFAULT now(),
  is_estimated boolean DEFAULT false
);
```

**Price Calculation:**
```sql
-- Base calculation
total_price = quantity * unit_price

-- For 10+1 promotion
IF promo_10_plus_1 AND quantity >= 10 THEN
  -- Charge for quantity, deliver quantity + bonus
  total_price = quantity * unit_price + 0.01
END IF

-- For discount promotions
IF promo_discount_percentage > 0 THEN
  unit_price = base_price * (1 - promo_discount_percentage/100)
  total_price = quantity * unit_price
END IF
```

**Indexes:**
- `order_items_order_id_idx` on `order_id`
- `order_items_product_id_idx` on `product_id`

**RLS Policies:**
- Same as parent `orders` table
- Cascade delete when order is deleted

---

### 7. order_history

Audit log for order modifications.

```sql
CREATE TABLE order_history (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id uuid NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  action text NOT NULL,
  performed_by uuid NOT NULL REFERENCES users(id),
  details jsonb,
  created_at timestamptz DEFAULT now()
);
```

**Common Actions:**
- `created`: Order created
- `status_changed`: Status updated
- `item_added`: Item added to order
- `item_removed`: Item removed from order
- `item_quantity_changed`: Quantity modified
- `item_confirmed`: Item confirmed by operator
- `item_rejected`: Item rejected by operator
- `sent`: Order sent to warehouse
- `confirmed`: Order confirmed

**RLS Policies:**
- Read-only for all authenticated users (audit trail)
- Write access only through application logic

---

## Advanced Features Tables

### 8. salesperson_stores

Many-to-many relationship: salespeople managing multiple stores.

```sql
CREATE TABLE salesperson_stores (
  salesperson_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  store_id uuid NOT NULL REFERENCES stores(id) ON DELETE CASCADE,
  created_at timestamptz DEFAULT now(),
  PRIMARY KEY (salesperson_id, store_id)
);
```

---

### 9. tags

Product tagging system for flexible categorization.

```sql
CREATE TABLE tags (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text UNIQUE NOT NULL,
  color text DEFAULT '#gray',
  created_at timestamptz DEFAULT now()
);
```

---

### 10. product_tags

Many-to-many: products can have multiple tags.

```sql
CREATE TABLE product_tags (
  product_id uuid NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  tag_id uuid NOT NULL REFERENCES tags(id) ON DELETE CASCADE,
  created_at timestamptz DEFAULT now(),
  PRIMARY KEY (product_id, tag_id)
);
```

---

### 11. deliveries

Delivery tracking for drivers.

```sql
CREATE TABLE deliveries (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id uuid NOT NULL REFERENCES orders(id),
  driver_id uuid REFERENCES users(id),
  status text NOT NULL CHECK (status IN ('pending', 'in_transit', 'delivered', 'failed')),
  scheduled_date date NOT NULL,
  delivered_at timestamptz,
  notes text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);
```

---

### 12. system_settings

Global system configuration.

```sql
CREATE TABLE system_settings (
  key text PRIMARY KEY,
  value jsonb NOT NULL,
  description text,
  updated_at timestamptz DEFAULT now(),
  updated_by uuid REFERENCES users(id)
);
```

**Example Settings:**
```json
{
  "key": "order_auto_archive_days",
  "value": 90,
  "description": "Days after which confirmed orders are auto-archived"
}
```

---

## Analytics Tables

### 13. user_events

Individual user interaction events.

```sql
CREATE TABLE user_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES users(id),
  session_id uuid,
  event_type text NOT NULL,
  event_data jsonb,
  screen_name text,
  timestamp timestamptz DEFAULT now()
);
```

**Event Types:**
- `navigation`: Screen/page change
- `click`: Button/link click
- `form_submit`: Form submission
- `search`: Search query
- `product_action`: Product interaction
- `list_modification`: Cart/order modification
- `order_action`: Order status change

**Partitioning:**
Table is partitioned by month for better performance:
```sql
CREATE TABLE user_events_2024_10 PARTITION OF user_events
  FOR VALUES FROM ('2024-10-01') TO ('2024-11-01');
```

---

### 14. user_sessions

Grouped user activity sessions.

```sql
CREATE TABLE user_sessions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES users(id),
  session_start timestamptz NOT NULL DEFAULT now(),
  session_end timestamptz,
  event_count integer DEFAULT 0,
  screen_sequence text[],
  created_at timestamptz DEFAULT now()
);
```

**Automatic Updates:**
Trigger function `update_session_stats()` automatically updates:
- `session_end`: Last event timestamp
- `event_count`: Number of events
- `screen_sequence`: Array of visited screens

---

### 15. user_paths

Unique navigation paths with aggregated statistics.

```sql
CREATE TABLE user_paths (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  path_signature text UNIQUE NOT NULL,
  screen_sequence text[] NOT NULL,
  occurrence_count integer DEFAULT 1,
  success_rate decimal(5,2) DEFAULT 0,
  average_duration interval,
  last_occurrence timestamptz DEFAULT now(),
  created_at timestamptz DEFAULT now()
);
```

**Path Signature:**
Hash of screen sequence (e.g., MD5 of "home→new-order→voice→orders")

**Success Rate:**
Percentage of paths that end in conversion (order sent/confirmed)

---

### 16. path_clusters

Groups of similar navigation paths.

```sql
CREATE TABLE path_clusters (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  cluster_name text NOT NULL,
  representative_path text[] NOT NULL,
  member_count integer DEFAULT 0,
  similarity_threshold decimal(5,2) DEFAULT 70,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);
```

**Clustering Algorithm:**
Uses Longest Common Subsequence (LCS) similarity to group paths with 70%+ similarity.

---

### 17. path_cluster_members

Many-to-many: paths belonging to clusters.

```sql
CREATE TABLE path_cluster_members (
  cluster_id uuid NOT NULL REFERENCES path_clusters(id) ON DELETE CASCADE,
  path_id uuid NOT NULL REFERENCES user_paths(id) ON DELETE CASCADE,
  similarity_score decimal(5,2) NOT NULL,
  created_at timestamptz DEFAULT now(),
  PRIMARY KEY (cluster_id, path_id)
);
```

---

## AI Voice Recognition Tables

### 18. voice_recognition_logs

Logs of voice order attempts for AI improvement.

```sql
CREATE TABLE voice_recognition_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES users(id),
  transcript text NOT NULL,
  recognized_products jsonb,
  confidence_scores jsonb,
  successful boolean DEFAULT false,
  created_at timestamptz DEFAULT now()
);
```

**Used For:**
- Analyzing AI accuracy
- Identifying common recognition failures
- Training data for future models

---

### 19. product_phrase_mappings

Custom phrase-to-product mappings learned from user corrections.

```sql
CREATE TABLE product_phrase_mappings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  phrase text NOT NULL,
  product_id uuid NOT NULL REFERENCES products(id),
  confidence decimal(5,2) DEFAULT 100,
  usage_count integer DEFAULT 0,
  last_used timestamptz,
  created_at timestamptz DEFAULT now(),
  UNIQUE(phrase, product_id)
);
```

**Example:**
```
phrase: "kielasa" → product_id: "uuid-of-Kielbasa-Krakowska"
confidence: 95.0
usage_count: 47
```

---

## Marketing Campaign Tables

### 20. marketing_campaigns

Campaign definitions.

```sql
CREATE TABLE marketing_campaigns (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  campaign_name text NOT NULL,
  campaign_type text NOT NULL CHECK (campaign_type IN ('banner', 'email', 'push', 'in_app')),
  start_date timestamptz NOT NULL,
  end_date timestamptz,
  target_audience jsonb,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);
```

---

### 21. campaign_interactions

User interactions with campaigns.

```sql
CREATE TABLE campaign_interactions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  campaign_id uuid NOT NULL REFERENCES marketing_campaigns(id),
  user_id uuid NOT NULL REFERENCES users(id),
  interaction_type text NOT NULL CHECK (interaction_type IN ('view', 'click', 'dismiss')),
  interaction_data jsonb,
  timestamp timestamptz DEFAULT now()
);
```

---

### 22. campaign_conversions

Conversions attributed to campaigns.

```sql
CREATE TABLE campaign_conversions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  campaign_id uuid NOT NULL REFERENCES marketing_campaigns(id),
  user_id uuid NOT NULL REFERENCES users(id),
  order_id uuid NOT NULL REFERENCES orders(id),
  conversion_value decimal(10,2) NOT NULL,
  products_purchased jsonb,
  time_to_conversion interval,
  timestamp timestamptz DEFAULT now()
);
```

---

## Database Functions

### calculate_lcs_similarity(path1 text[], path2 text[])

Calculates similarity between two navigation paths using Longest Common Subsequence algorithm.

**Returns:** `decimal` (0-100)

**Usage:**
```sql
SELECT calculate_lcs_similarity(
  ARRAY['home', 'orders', 'details'],
  ARRAY['home', 'orders', 'edit']
);
-- Returns: 66.67
```

---

### cleanup_old_analytics_data()

Automatically deletes analytics data older than 90 days.

**Called By:** Daily cron job or manual trigger

```sql
SELECT cleanup_old_analytics_data();
```

---

### update_session_stats()

Trigger function that updates user_sessions statistics when new events are added.

**Automatically Called:** On INSERT to user_events

---

### get_campaign_performance(campaign_id uuid)

Returns aggregated campaign performance metrics.

**Returns:**
```json
{
  "views": 1234,
  "clicks": 456,
  "dismisses": 78,
  "conversions": 89,
  "ctr": 36.98,
  "conversion_rate": 19.52,
  "total_revenue": 45678.90,
  "avg_time_to_conversion": "2 hours 15 minutes"
}
```

---

## Indexes Strategy

### Performance-Critical Indexes

```sql
-- Orders
CREATE INDEX orders_store_status_idx ON orders(store_id, status);
CREATE INDEX orders_created_at_idx ON orders(created_at DESC);

-- Order Items
CREATE INDEX order_items_order_product_idx ON order_items(order_id, product_id);

-- Analytics
CREATE INDEX user_events_user_timestamp_idx ON user_events(user_id, timestamp DESC);
CREATE INDEX user_events_session_idx ON user_events(session_id);

-- Products
CREATE INDEX products_active_category_idx ON products(active, category) WHERE active = true;
```

---

## Row Level Security Policies

### Example: orders table

```sql
-- Store managers can view own store's orders
CREATE POLICY "Store managers view own orders"
  ON orders FOR SELECT
  TO authenticated
  USING (
    store_id IN (
      SELECT store_id FROM users WHERE id = auth.uid()
    )
  );

-- Operators can view all orders
CREATE POLICY "Operators view all orders"
  ON orders FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE id = auth.uid()
      AND role IN ('operator', 'admin')
    )
  );

-- Store managers can create orders for own store
CREATE POLICY "Store managers create orders"
  ON orders FOR INSERT
  TO authenticated
  WITH CHECK (
    store_id IN (
      SELECT store_id FROM users WHERE id = auth.uid()
    )
  );
```

---

## Data Retention

### Automatic Cleanup

- **Analytics data**: 90 days (configurable)
- **Archived orders**: Indefinite (for accounting)
- **Voice recognition logs**: 30 days
- **User sessions**: 90 days

### Manual Archive

Admins can manually archive orders via UI or SQL:

```sql
UPDATE orders
SET status = 'archived'
WHERE confirmed_at < now() - interval '6 months'
  AND status = 'confirmed';
```

---

## Migration Strategy

All schema changes are versioned migrations in `/supabase/migrations/`.

**Naming Convention:**
```
YYYYMMDDHHMMSS_descriptive_name.sql
```

**Best Practices:**
- Always use `IF NOT EXISTS` for safety
- Add detailed comments explaining the change
- Test migrations on staging first
- Never drop columns (deprecate instead)
- Keep migrations idempotent

---

## Backup & Recovery

### Automated Backups

Supabase provides:
- Daily full backups (retained 7 days)
- Point-in-time recovery (PITR) up to 7 days

### Manual Backup

```bash
pg_dump -h db.xxx.supabase.co -U postgres -d postgres > backup.sql
```

### Restore

```bash
psql -h db.xxx.supabase.co -U postgres -d postgres < backup.sql
```

---

**Last Updated**: 2025-10-16
**Schema Version**: 2.0
**Total Tables**: 22
**Total Migrations**: 89
