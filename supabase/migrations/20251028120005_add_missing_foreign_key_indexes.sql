/*
  # Dodanie brakujących indeksów dla foreign keys

  1. Problem
    - Wiele tabel ma foreign keys bez indeksów
    - To powoduje słabą wydajność zapytań JOIN
    
  2. Rozwiązanie
    - Dodaj indeksy dla wszystkich foreign keys
    - Poprawi to wydajność zapytań i integralność referencyjna
*/

-- auto_order_feedback
CREATE INDEX IF NOT EXISTS idx_auto_order_feedback_product_id 
  ON auto_order_feedback(product_id);

-- auto_order_logs
CREATE INDEX IF NOT EXISTS idx_auto_order_logs_triggered_by 
  ON auto_order_logs(triggered_by);

-- campaign_conversions
CREATE INDEX IF NOT EXISTS idx_campaign_conversions_interaction_id 
  ON campaign_conversions(interaction_id);

-- occasion_banners
CREATE INDEX IF NOT EXISTS idx_occasion_banners_created_by 
  ON occasion_banners(created_by);
CREATE INDEX IF NOT EXISTS idx_occasion_banners_occasion_type_id 
  ON occasion_banners(occasion_type_id);

-- order_history
CREATE INDEX IF NOT EXISTS idx_order_history_order_id 
  ON order_history(order_id);
CREATE INDEX IF NOT EXISTS idx_order_history_performed_by 
  ON order_history(performed_by);

-- order_items
CREATE INDEX IF NOT EXISTS idx_order_items_product_id 
  ON order_items(product_id);

-- orders
CREATE INDEX IF NOT EXISTS idx_orders_created_by 
  ON orders(created_by);

-- path_cluster_members
CREATE INDEX IF NOT EXISTS idx_path_cluster_members_path_id 
  ON path_cluster_members(path_id);

-- price_list_assignments
CREATE INDEX IF NOT EXISTS idx_price_list_assignments_assigned_by 
  ON price_list_assignments(assigned_by);

-- price_lists
CREATE INDEX IF NOT EXISTS idx_price_lists_created_by 
  ON price_lists(created_by);

-- product_order_stats
CREATE INDEX IF NOT EXISTS idx_product_order_stats_product_id 
  ON product_order_stats(product_id);

-- products
CREATE INDEX IF NOT EXISTS idx_products_price_list_id 
  ON products(price_list_id);

-- profanity_logs
CREATE INDEX IF NOT EXISTS idx_profanity_logs_store_id 
  ON profanity_logs(store_id);

-- salesperson_store_assignments
CREATE INDEX IF NOT EXISTS idx_salesperson_store_assignments_assigned_by 
  ON salesperson_store_assignments(assigned_by);

-- salesperson_stores
CREATE INDEX IF NOT EXISTS idx_salesperson_stores_store_id 
  ON salesperson_stores(store_id);

-- special_prices
CREATE INDEX IF NOT EXISTS idx_special_prices_product_id 
  ON special_prices(product_id);

-- store_group_members
CREATE INDEX IF NOT EXISTS idx_store_group_members_added_by 
  ON store_group_members(added_by);

-- store_groups
CREATE INDEX IF NOT EXISTS idx_store_groups_created_by 
  ON store_groups(created_by);

-- system_announcements
CREATE INDEX IF NOT EXISTS idx_system_announcements_created_by 
  ON system_announcements(created_by);

-- user_session_gaps
CREATE INDEX IF NOT EXISTS idx_user_session_gaps_next_session_id 
  ON user_session_gaps(next_session_id);
CREATE INDEX IF NOT EXISTS idx_user_session_gaps_previous_session_id 
  ON user_session_gaps(previous_session_id);

-- voice_learning_corrections
CREATE INDEX IF NOT EXISTS idx_voice_learning_corrections_selected_product_id 
  ON voice_learning_corrections(selected_product_id);
CREATE INDEX IF NOT EXISTS idx_voice_learning_corrections_user_id 
  ON voice_learning_corrections(user_id);