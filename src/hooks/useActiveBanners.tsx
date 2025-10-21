import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';

export interface BannerStyling {
  gradientFrom: string;
  gradientTo: string;
  icon: string;
  animation: 'pulse' | 'bounce' | 'none';
  textColor: string;
  decorations?: 'snowflakes' | 'hearts' | 'flowers' | 'eggs' | 'pumpkins' | 'leaves';
}

export interface PromotionDetails {
  type?: string;
  percentage?: number;
  products?: string[];
}

export interface ActiveBanner {
  id: string;
  occasion_type_id: string;
  occasion_code: string;
  occasion_name: string;
  title: string;
  message: string;
  priority: number;
  styling: BannerStyling;
  target_products: string[];
  promotion_details: PromotionDetails;
}

/**
 * Hook to fetch and manage active occasion banners
 * Automatically detects current date, weekends, and recurring events
 */
export function useActiveBanners() {
  const [currentBanner, setCurrentBanner] = useState<ActiveBanner | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadActiveBanner();

    const interval = setInterval(() => {
      loadActiveBanner();
    }, 5 * 60 * 1000);

    return () => clearInterval(interval);
  }, []);

  const loadActiveBanner = async () => {
    try {
      setLoading(true);
      setError(null);

      const { data, error: queryError } = await supabase
        .rpc('get_active_banners', { check_date: new Date().toISOString() });

      if (queryError) {
        if (queryError.code === 'PGRST202' || queryError.code === '42883') {
          setCurrentBanner(null);
          return;
        }
        throw queryError;
      }

      const banners = data || [];
      setCurrentBanner(banners.length > 0 ? banners[0] : null);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Unknown error';
      console.error('[Banners] Failed to load:', message);
      setError(message);
      setCurrentBanner(null);
    } finally {
      setLoading(false);
    }
  };

  const trackInteraction = async (bannerId: string, interactionType: 'view' | 'click' | 'dismiss') => {
    try {
      const { data: { user } } = await supabase.auth.getUser();

      if (!user) return;

      await supabase.from('banner_interactions').insert({
        banner_id: bannerId,
        user_id: user.id,
        interaction_type: interactionType,
        timestamp: new Date().toISOString(),
      });
    } catch (err) {
      console.warn('[Banners] Failed to track interaction:', err);
    }
  };

  return {
    currentBanner,
    loading,
    error,
    trackInteraction,
    refresh: loadActiveBanner,
  };
}
