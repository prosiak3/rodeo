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
  const [banners, setBanners] = useState<ActiveBanner[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currentBannerIndex, setCurrentBannerIndex] = useState(0);

  useEffect(() => {
    loadActiveBanners();

    // Reload banners every 5 minutes to catch new ones
    const interval = setInterval(() => {
      loadActiveBanners();
    }, 5 * 60 * 1000);

    return () => clearInterval(interval);
  }, []);

  // Rotate banners every 10 seconds if multiple exist
  useEffect(() => {
    if (banners.length <= 1) return;

    const rotationInterval = setInterval(() => {
      setCurrentBannerIndex((prev) => (prev + 1) % banners.length);
    }, 10000);

    return () => clearInterval(rotationInterval);
  }, [banners.length]);

  const loadActiveBanners = async () => {
    try {
      setLoading(true);
      setError(null);

      const { data, error: queryError } = await supabase
        .rpc('get_active_banners', { check_date: new Date().toISOString() });

      if (queryError) {
        // If function doesn't exist, silently fail
        if (queryError.code === 'PGRST202' || queryError.code === '42883') {
          setBanners([]);
          return;
        }
        throw queryError;
      }

      setBanners(data || []);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Unknown error';
      console.error('[Banners] Failed to load:', message);
      setError(message);
      setBanners([]);
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
      // Silently fail - tracking is optional
      console.warn('[Banners] Failed to track interaction:', err);
    }
  };

  const currentBanner = banners.length > 0 ? banners[currentBannerIndex] : null;

  return {
    banners,
    currentBanner,
    loading,
    error,
    trackInteraction,
    refresh: loadActiveBanners,
  };
}
