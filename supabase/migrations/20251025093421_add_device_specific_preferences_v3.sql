/*
  # Dodanie preferencji specyficznych dla urządzeń

  ## Zmiany
  
  1. Modyfikacje w tabeli `users`
    - Dodaje kolumnę `device_preferences` (jsonb) - przechowuje preferencje dla różnych typów urządzeń
    - Format: {
        "mobile": { ui_theme: "...", font_size_preference: "...", ... },
        "tablet": { ui_theme: "...", font_size_preference: "...", ... },
        "desktop": { ui_theme: "...", font_size_preference: "...", ... }
      }
  
  ## Uwagi
  - Każdy użytkownik może mieć różne ustawienia na różnych urządzeniach
  - System automatycznie wykrywa typ urządzenia i stosuje odpowiednie preferencje
  - Jeśli brak preferencji dla danego urządzenia, użyje domyślnych ustawień
  - Mobile domyślnie ma bardziej kompaktowy układ
*/

-- Dodaj kolumnę device_preferences jako JSONB
ALTER TABLE users 
ADD COLUMN IF NOT EXISTS device_preferences jsonb DEFAULT '{}'::jsonb;

-- Dodaj indeks dla lepszej wydajności zapytań
CREATE INDEX IF NOT EXISTS idx_users_device_preferences ON users USING gin(device_preferences);

-- Zmigruj istniejące preferencje do formatu z trzema typami urządzeń
DO $$
DECLARE
  user_record RECORD;
BEGIN
  FOR user_record IN SELECT id, ui_theme, font_size_preference, theme,
                            show_sort_buttons, show_delete_icons, show_notebook_button_labels,
                            show_group_buttons, show_price_layout_toggle, 
                            show_product_description, show_product_index, show_sort_icons,
                            notebook_mode, order_mode, order_mode_layout
                     FROM users
  LOOP
    UPDATE users
    SET device_preferences = jsonb_build_object(
      'desktop', jsonb_build_object(
        'ui_theme', COALESCE(user_record.ui_theme, 'colorful'),
        'font_size_preference', COALESCE(user_record.font_size_preference, 'medium'),
        'theme', COALESCE(user_record.theme, 'colorful'),
        'show_sort_buttons', COALESCE(user_record.show_sort_buttons, true),
        'show_delete_icons', COALESCE(user_record.show_delete_icons, true),
        'show_notebook_button_labels', COALESCE(user_record.show_notebook_button_labels, true),
        'show_group_buttons', COALESCE(user_record.show_group_buttons, true),
        'show_price_layout_toggle', COALESCE(user_record.show_price_layout_toggle, true),
        'show_product_description', COALESCE(user_record.show_product_description, true),
        'show_product_index', COALESCE(user_record.show_product_index, true),
        'show_sort_icons', COALESCE(user_record.show_sort_icons, true),
        'notebook_mode', COALESCE(user_record.notebook_mode, 'disabled'),
        'order_mode', COALESCE(user_record.order_mode, 'quantity'),
        'order_mode_layout', COALESCE(user_record.order_mode_layout, 'side-by-side')
      ),
      'mobile', jsonb_build_object(
        'ui_theme', COALESCE(user_record.ui_theme, 'colorful'),
        'font_size_preference', COALESCE(user_record.font_size_preference, 'medium'),
        'theme', COALESCE(user_record.theme, 'colorful'),
        'show_sort_buttons', COALESCE(user_record.show_sort_buttons, true),
        'show_delete_icons', COALESCE(user_record.show_delete_icons, true),
        'show_notebook_button_labels', false,
        'show_group_buttons', COALESCE(user_record.show_group_buttons, true),
        'show_price_layout_toggle', COALESCE(user_record.show_price_layout_toggle, true),
        'show_product_description', false,
        'show_product_index', COALESCE(user_record.show_product_index, true),
        'show_sort_icons', COALESCE(user_record.show_sort_icons, true),
        'notebook_mode', COALESCE(user_record.notebook_mode, 'disabled'),
        'order_mode', COALESCE(user_record.order_mode, 'quantity'),
        'order_mode_layout', 'stacked'
      ),
      'tablet', jsonb_build_object(
        'ui_theme', COALESCE(user_record.ui_theme, 'colorful'),
        'font_size_preference', COALESCE(user_record.font_size_preference, 'medium'),
        'theme', COALESCE(user_record.theme, 'colorful'),
        'show_sort_buttons', COALESCE(user_record.show_sort_buttons, true),
        'show_delete_icons', COALESCE(user_record.show_delete_icons, true),
        'show_notebook_button_labels', COALESCE(user_record.show_notebook_button_labels, true),
        'show_group_buttons', COALESCE(user_record.show_group_buttons, true),
        'show_price_layout_toggle', COALESCE(user_record.show_price_layout_toggle, true),
        'show_product_description', COALESCE(user_record.show_product_description, true),
        'show_product_index', COALESCE(user_record.show_product_index, true),
        'show_sort_icons', COALESCE(user_record.show_sort_icons, true),
        'notebook_mode', COALESCE(user_record.notebook_mode, 'disabled'),
        'order_mode', COALESCE(user_record.order_mode, 'quantity'),
        'order_mode_layout', COALESCE(user_record.order_mode_layout, 'side-by-side')
      )
    )
    WHERE id = user_record.id;
  END LOOP;
END $$;

-- Dodaj komentarz do kolumny
COMMENT ON COLUMN users.device_preferences IS 'Preferencje interfejsu specyficzne dla różnych typów urządzeń (mobile, tablet, desktop)';