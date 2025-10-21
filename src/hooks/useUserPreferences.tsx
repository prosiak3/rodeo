import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';

/**
 * User preferences with sensible defaults
 */
interface UserPreferences {
  show_delete_icons: boolean;
  order_details_status_expanded: boolean;
  show_notebook_button_labels: boolean;
  show_sort_buttons: boolean;
  auto_logout_enabled: boolean;
  ui_theme: string | null;
}

/**
 * Default values for all user preferences
 */
const DEFAULT_PREFERENCES: UserPreferences = {
  show_delete_icons: false,
  order_details_status_expanded: true,
  show_notebook_button_labels: true,
  show_sort_buttons: true,
  auto_logout_enabled: true,
  ui_theme: null,
};

/**
 * Safely query user preferences with fallback to defaults
 * This hook handles missing columns gracefully
 */
export function useUserPreferences(userId: string | undefined, fields?: (keyof UserPreferences)[]) {
  const [preferences, setPreferences] = useState<Partial<UserPreferences>>(DEFAULT_PREFERENCES);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!userId) {
      setLoading(false);
      return;
    }

    const loadPreferences = async () => {
      try {
        setLoading(true);
        setError(null);

        // If specific fields requested, only query those. Otherwise query all.
        const selectFields = fields?.join(', ') || '*';

        const { data, error: queryError } = await supabase
          .from('users')
          .select(selectFields)
          .eq('id', userId)
          .maybeSingle();

        if (queryError) {
          // Check if it's a column not found error
          if (queryError.code === '42703' || queryError.message.includes('column')) {
            console.warn('[UserPreferences] Some preference columns may be missing:', queryError.message);
            // Return defaults for missing columns
            setPreferences(DEFAULT_PREFERENCES);
          } else {
            throw queryError;
          }
        } else if (data) {
          // Merge fetched data with defaults to handle any missing fields
          const mergedData: Partial<UserPreferences> = { ...DEFAULT_PREFERENCES };
          Object.keys(data).forEach(key => {
            if (key in DEFAULT_PREFERENCES) {
              mergedData[key as keyof UserPreferences] = data[key];
            }
          });
          setPreferences(mergedData);
        }
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Unknown error';
        console.error('[UserPreferences] Failed to load:', message);
        setError(message);
        // Fall back to defaults on error
        setPreferences(DEFAULT_PREFERENCES);
      } finally {
        setLoading(false);
      }
    };

    loadPreferences();
  }, [userId, fields?.join(',')]);

  return { preferences, loading, error };
}

/**
 * Safely get a single user preference value
 * Returns the default if the query fails or column doesn't exist
 */
export async function getUserPreference<K extends keyof UserPreferences>(
  userId: string,
  field: K
): Promise<UserPreferences[K]> {
  try {
    const { data, error } = await supabase
      .from('users')
      .select(field as string)
      .eq('id', userId)
      .maybeSingle();

    if (error) {
      // Return default on error (likely column doesn't exist)
      if (error.code === '42703' || error.message.includes('column')) {
        console.warn(`[UserPreferences] Column '${String(field)}' not found, using default`);
      }
      return DEFAULT_PREFERENCES[field];
    }

    return (data as any)?.[field] ?? DEFAULT_PREFERENCES[field];
  } catch (err) {
    console.error('[UserPreferences] Error:', err);
    return DEFAULT_PREFERENCES[field];
  }
}

/**
 * Safely update user preference
 */
export async function updateUserPreference<K extends keyof UserPreferences>(
  userId: string,
  field: K,
  value: UserPreferences[K]
): Promise<{ success: boolean; error?: string }> {
  try {
    const { error } = await supabase
      .from('users')
      .update({ [field]: value })
      .eq('id', userId);

    if (error) {
      console.error('[UserPreferences] Update failed:', error);
      return { success: false, error: error.message };
    }

    return { success: true };
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    console.error('[UserPreferences] Exception:', message);
    return { success: false, error: message };
  }
}
