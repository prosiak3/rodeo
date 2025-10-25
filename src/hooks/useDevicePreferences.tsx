import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { useDeviceType, DeviceType } from './useDeviceType';
import type { FontSize } from '../lib/supabase';

interface DevicePreferences {
  ui_theme: string;
  font_size_preference: FontSize;
  theme: string;
  show_sort_buttons: boolean;
  show_delete_icons: boolean;
  show_notebook_button_labels: boolean;
  show_group_buttons: boolean;
  show_price_layout_toggle: boolean;
  show_product_description: boolean;
  show_product_index: boolean;
  show_sort_icons: boolean;
  notebook_mode: string;
  order_mode: string;
  order_mode_layout: string;
}

const DEFAULT_PREFERENCES: Record<DeviceType, DevicePreferences> = {
  mobile: {
    ui_theme: 'colorful',
    font_size_preference: 'medium',
    theme: 'colorful',
    show_sort_buttons: true,
    show_delete_icons: true,
    show_notebook_button_labels: false,
    show_group_buttons: true,
    show_price_layout_toggle: true,
    show_product_description: false,
    show_product_index: true,
    show_sort_icons: true,
    notebook_mode: 'disabled',
    order_mode: 'quantity',
    order_mode_layout: 'stacked',
  },
  tablet: {
    ui_theme: 'colorful',
    font_size_preference: 'medium',
    theme: 'colorful',
    show_sort_buttons: true,
    show_delete_icons: true,
    show_notebook_button_labels: true,
    show_group_buttons: true,
    show_price_layout_toggle: true,
    show_product_description: true,
    show_product_index: true,
    show_sort_icons: true,
    notebook_mode: 'disabled',
    order_mode: 'quantity',
    order_mode_layout: 'side-by-side',
  },
  desktop: {
    ui_theme: 'colorful',
    font_size_preference: 'medium',
    theme: 'colorful',
    show_sort_buttons: true,
    show_delete_icons: true,
    show_notebook_button_labels: true,
    show_group_buttons: true,
    show_price_layout_toggle: true,
    show_product_description: true,
    show_product_index: true,
    show_sort_icons: true,
    notebook_mode: 'disabled',
    order_mode: 'quantity',
    order_mode_layout: 'side-by-side',
  },
};

export function useDevicePreferences(userId: string | undefined) {
  const deviceType = useDeviceType();
  const [preferences, setPreferences] = useState<DevicePreferences>(
    DEFAULT_PREFERENCES[deviceType]
  );
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!userId) {
      setLoading(false);
      return;
    }

    const loadPreferences = async () => {
      try {
        setLoading(true);

        const { data, error } = await supabase
          .from('users')
          .select('device_preferences')
          .eq('id', userId)
          .maybeSingle();

        if (error) throw error;

        if (data?.device_preferences) {
          const devicePrefs = data.device_preferences[deviceType];
          if (devicePrefs) {
            setPreferences({ ...DEFAULT_PREFERENCES[deviceType], ...devicePrefs });
          } else {
            setPreferences(DEFAULT_PREFERENCES[deviceType]);
          }
        } else {
          setPreferences(DEFAULT_PREFERENCES[deviceType]);
        }
      } catch (error) {
        console.error('Error loading device preferences:', error);
        setPreferences(DEFAULT_PREFERENCES[deviceType]);
      } finally {
        setLoading(false);
      }
    };

    loadPreferences();
  }, [userId, deviceType]);

  const updatePreference = async <K extends keyof DevicePreferences>(
    field: K,
    value: DevicePreferences[K]
  ) => {
    if (!userId) return;

    try {
      const { data: currentData } = await supabase
        .from('users')
        .select('device_preferences')
        .eq('id', userId)
        .maybeSingle();

      const currentPrefs = currentData?.device_preferences || {};
      const devicePrefs = currentPrefs[deviceType] || {};

      const updatedPrefs = {
        ...currentPrefs,
        [deviceType]: {
          ...devicePrefs,
          [field]: value,
        },
      };

      const { error } = await supabase
        .from('users')
        .update({ device_preferences: updatedPrefs })
        .eq('id', userId);

      if (error) throw error;

      setPreferences((prev) => ({ ...prev, [field]: value }));
    } catch (error) {
      console.error('Error updating device preference:', error);
    }
  };

  return { preferences, loading, updatePreference, deviceType };
}
