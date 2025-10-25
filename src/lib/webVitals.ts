/**
 * webVitals.ts - Core Web Vitals monitoring
 *
 * Metryki:
 * - LCP (Largest Contentful Paint) - ładowanie
 * - FID (First Input Delay) - interaktywność
 * - CLS (Cumulative Layout Shift) - stabilność wizualna
 * - FCP (First Contentful Paint) - pierwsza zawartość
 * - TTFB (Time to First Byte) - odpowiedź serwera
 *
 * Dane są wysyłane do Supabase analytics
 */

import type { Metric } from 'web-vitals';
import { supabase } from './supabase';

interface WebVitalMetric {
  name: string;
  value: number;
  rating: 'good' | 'needs-improvement' | 'poor';
  delta: number;
  id: string;
  navigationType: string;
}

/**
 * Wysyłanie metryki do analytics
 */
async function sendToAnalytics(metric: WebVitalMetric, userId?: string) {
  try {
    // Log do konsoli w development
    if (import.meta.env.DEV) {
      console.log('📊 Web Vital:', metric.name, metric.value, metric.rating);
    }

    // Zapisz do Supabase jeśli user jest zalogowany
    if (userId) {
      await supabase.from('web_vitals_metrics').insert({
        user_id: userId,
        metric_name: metric.name,
        metric_value: metric.value,
        rating: metric.rating,
        delta: metric.delta,
        navigation_type: metric.navigationType,
      });
    }

    // Możesz też wysłać do external analytics (Google Analytics, etc.)
    // if (window.gtag) {
    //   window.gtag('event', metric.name, {
    //     value: Math.round(metric.name === 'CLS' ? metric.value * 1000 : metric.value),
    //     metric_id: metric.id,
    //     metric_value: metric.value,
    //     metric_delta: metric.delta,
    //   });
    // }
  } catch (error) {
    console.error('Error sending web vital:', error);
  }
}

/**
 * Oblicz rating dla metryki
 */
function getRating(name: string, value: number): 'good' | 'needs-improvement' | 'poor' {
  // Thresholds według Google Web Vitals
  const thresholds: Record<string, [number, number]> = {
    LCP: [2500, 4000],
    FID: [100, 300],
    CLS: [0.1, 0.25],
    FCP: [1800, 3000],
    TTFB: [800, 1800],
    INP: [200, 500], // Interaction to Next Paint (new metric)
  };

  const [good, poor] = thresholds[name] || [0, 0];

  if (value <= good) return 'good';
  if (value <= poor) return 'needs-improvement';
  return 'poor';
}

/**
 * Handler dla web vitals
 */
function handleWebVital(metric: Metric, userId?: string) {
  const webVital: WebVitalMetric = {
    name: metric.name,
    value: metric.value,
    rating: getRating(metric.name, metric.value),
    delta: metric.delta,
    id: metric.id,
    navigationType: metric.navigationType || 'navigate',
  };

  sendToAnalytics(webVital, userId);
}

/**
 * Inicjalizuj monitoring Web Vitals
 */
export async function initWebVitals(userId?: string) {
  try {
    // Dynamically import web-vitals (code splitting)
    const { onCLS, onFID, onFCP, onLCP, onTTFB, onINP } = await import('web-vitals');

    // Monitor all core web vitals
    onCLS((metric) => handleWebVital(metric, userId));
    onFID((metric) => handleWebVital(metric, userId));
    onFCP((metric) => handleWebVital(metric, userId));
    onLCP((metric) => handleWebVital(metric, userId));
    onTTFB((metric) => handleWebVital(metric, userId));
    onINP((metric) => handleWebVital(metric, userId));

    console.log('✅ Web Vitals monitoring initialized');
  } catch (error) {
    console.error('Failed to initialize Web Vitals:', error);
  }
}

/**
 * Pobierz Web Vitals metrics z Supabase
 */
export async function getWebVitalsMetrics(userId?: string, limit = 100) {
  try {
    let query = supabase
      .from('web_vitals_metrics')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(limit);

    if (userId) {
      query = query.eq('user_id', userId);
    }

    const { data, error } = await query;

    if (error) throw error;

    return data;
  } catch (error) {
    console.error('Error fetching web vitals metrics:', error);
    return [];
  }
}

/**
 * Agregowane statystyki Web Vitals
 */
export async function getWebVitalsStats(metricName: string, days = 7) {
  try {
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    const { data, error } = await supabase
      .from('web_vitals_metrics')
      .select('metric_value, rating, created_at')
      .eq('metric_name', metricName)
      .gte('created_at', startDate.toISOString());

    if (error) throw error;

    // Calculate statistics
    const values = data.map((m) => m.metric_value);
    const avg = values.reduce((a, b) => a + b, 0) / values.length;
    const p75 = values.sort((a, b) => a - b)[Math.floor(values.length * 0.75)];
    const p95 = values.sort((a, b) => a - b)[Math.floor(values.length * 0.95)];

    const ratingCounts = data.reduce(
      (acc, m) => {
        acc[m.rating]++;
        return acc;
      },
      { good: 0, 'needs-improvement': 0, poor: 0 }
    );

    return {
      metricName,
      count: data.length,
      average: Math.round(avg),
      p75: Math.round(p75),
      p95: Math.round(p95),
      ratings: ratingCounts,
    };
  } catch (error) {
    console.error('Error getting web vitals stats:', error);
    return null;
  }
}
