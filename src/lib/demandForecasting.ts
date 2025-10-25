import { supabase } from './supabase';

export interface ForecastData {
  forecast_date: string;
  predicted_quantity: number;
  predicted_value: number;
  confidence_lower: number;
  confidence_upper: number;
  confidence_level: number;
  trend_direction: 'increasing' | 'stable' | 'decreasing';
  seasonality_factor: number;
  anomaly_score: number;
}

export interface DemandPattern {
  pattern_type: 'weekly' | 'monthly' | 'seasonal' | 'event_based' | 'promotion_impact' | 'holiday_effect';
  dimension_type: 'product' | 'category' | 'store' | 'store_group';
  dimension_id: string;
  pattern_data: any;
  strength: number;
  detected_at: string;
}

export interface TrendAnalysis {
  trend_direction: 'increasing' | 'stable' | 'decreasing';
  trend_strength: number;
  avg_change_per_week: number;
}

export interface CategoryForecast {
  forecast_date: string;
  category: string;
  predicted_quantity: number;
  predicted_value: number;
  top_products: Array<{
    product_id: string;
    product_name: string;
    total_quantity: number;
  }>;
}

export interface CrossDimensionAnalysis {
  store_id: string;
  store_name: string;
  avg_quantity: number;
  trend_direction: string;
  last_order_days_ago: number;
  predicted_next_order_days: number;
}

export interface DemandAlert {
  id: string;
  alert_type: 'spike' | 'drop' | 'anomaly' | 'trend_change' | 'seasonality_shift';
  severity: 'low' | 'medium' | 'high' | 'critical';
  dimension_type: string;
  dimension_id: string;
  message: string;
  details: any;
  acknowledged: boolean;
  created_at: string;
}

export async function getProductForecast(
  productId: string,
  storeId: string,
  daysBack: number = 90,
  forecastDays: number = 30
): Promise<ForecastData[]> {
  const { data, error } = await supabase.rpc('calculate_moving_average_forecast', {
    p_product_id: productId,
    p_store_id: storeId,
    p_days_back: daysBack,
    p_window_size: 7,
    p_forecast_days: forecastDays,
  });

  if (error) {
    console.error('[DemandForecasting] Error fetching product forecast:', error);
    throw error;
  }

  return (data || []).map((row: any) => ({
    forecast_date: row.forecast_date,
    predicted_quantity: parseFloat(row.predicted_quantity) || 0,
    predicted_value: 0,
    confidence_lower: parseFloat(row.confidence_lower) || 0,
    confidence_upper: parseFloat(row.confidence_upper) || 0,
    confidence_level: 0.95,
    trend_direction: 'stable',
    seasonality_factor: 1.0,
    anomaly_score: 0,
  }));
}

export async function analyzeProductTrend(
  productId: string,
  storeId: string,
  daysBack: number = 90
): Promise<TrendAnalysis | null> {
  const { data, error } = await supabase.rpc('analyze_product_trend', {
    p_product_id: productId,
    p_store_id: storeId,
    p_days_back: daysBack,
  });

  if (error) {
    console.error('[DemandForecasting] Error analyzing trend:', error);
    return null;
  }

  if (!data || data.length === 0) return null;

  const row = data[0];
  return {
    trend_direction: row.trend_direction,
    trend_strength: parseFloat(row.trend_strength) || 0,
    avg_change_per_week: parseFloat(row.avg_change_per_week) || 0,
  };
}

export async function detectSeasonalPatterns(
  dimensionType: 'product' | 'category' | 'store' | 'store_group',
  dimensionId: string,
  daysBack: number = 180
): Promise<any[]> {
  const { data, error } = await supabase.rpc('detect_seasonal_patterns', {
    p_dimension_type: dimensionType,
    p_dimension_id: dimensionId,
    p_days_back: daysBack,
  });

  if (error) {
    console.error('[DemandForecasting] Error detecting patterns:', error);
    return [];
  }

  return data || [];
}

export async function getCategoryForecast(
  category: string,
  storeId: string,
  daysBack: number = 90,
  forecastDays: number = 30
): Promise<CategoryForecast[]> {
  const { data, error } = await supabase.rpc('forecast_category_demand', {
    p_category: category,
    p_store_id: storeId,
    p_days_back: daysBack,
    p_forecast_days: forecastDays,
  });

  if (error) {
    console.error('[DemandForecasting] Error fetching category forecast:', error);
    throw error;
  }

  return (data || []).map((row: any) => ({
    forecast_date: row.forecast_date,
    category: row.category,
    predicted_quantity: parseFloat(row.predicted_quantity) || 0,
    predicted_value: parseFloat(row.predicted_value) || 0,
    top_products: row.top_products || [],
  }));
}

export async function analyzeCrossDimensionDemand(
  productId: string,
  storeGroupId: string,
  daysBack: number = 90
): Promise<CrossDimensionAnalysis[]> {
  const { data, error } = await supabase.rpc('analyze_cross_dimension_demand', {
    p_product_id: productId,
    p_store_group_id: storeGroupId,
    p_days_back: daysBack,
  });

  if (error) {
    console.error('[DemandForecasting] Error analyzing cross-dimension:', error);
    return [];
  }

  return (data || []).map((row: any) => ({
    store_id: row.store_id,
    store_name: row.store_name,
    avg_quantity: parseFloat(row.avg_quantity) || 0,
    trend_direction: row.trend_direction,
    last_order_days_ago: parseInt(row.last_order_days_ago) || 0,
    predicted_next_order_days: parseInt(row.predicted_next_order_days) || 30,
  }));
}

export async function getDemandAlerts(
  acknowledged: boolean = false,
  limit: number = 50
): Promise<DemandAlert[]> {
  let query = supabase
    .from('demand_alerts')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(limit);

  if (!acknowledged) {
    query = query.eq('acknowledged', false);
  }

  const { data, error } = await query;

  if (error) {
    console.error('[DemandForecasting] Error fetching alerts:', error);
    return [];
  }

  return data || [];
}

export async function acknowledgeAlert(alertId: string, userId: string): Promise<boolean> {
  const { error } = await supabase
    .from('demand_alerts')
    .update({
      acknowledged: true,
      acknowledged_by: userId,
      acknowledged_at: new Date().toISOString(),
    })
    .eq('id', alertId);

  if (error) {
    console.error('[DemandForecasting] Error acknowledging alert:', error);
    return false;
  }

  return true;
}

export async function generateDemandAlerts(): Promise<void> {
  const { error } = await supabase.rpc('generate_demand_alerts');

  if (error) {
    console.error('[DemandForecasting] Error generating alerts:', error);
    throw error;
  }
}

export async function getStoredForecasts(
  dimensionType: 'product' | 'category' | 'store' | 'store_group',
  dimensionId: string,
  fromDate?: string,
  toDate?: string
): Promise<ForecastData[]> {
  let query = supabase
    .from('demand_forecasts')
    .select('*')
    .eq('dimension_type', dimensionType)
    .eq('dimension_id', dimensionId)
    .order('forecast_date', { ascending: true });

  if (fromDate) {
    query = query.gte('forecast_date', fromDate);
  }

  if (toDate) {
    query = query.lte('forecast_date', toDate);
  }

  const { data, error } = await query;

  if (error) {
    console.error('[DemandForecasting] Error fetching stored forecasts:', error);
    return [];
  }

  return (data || []).map((row: any) => ({
    forecast_date: row.forecast_date,
    predicted_quantity: parseFloat(row.predicted_quantity) || 0,
    predicted_value: parseFloat(row.predicted_value) || 0,
    confidence_lower: parseFloat(row.confidence_lower) || 0,
    confidence_upper: parseFloat(row.confidence_upper) || 0,
    confidence_level: parseFloat(row.confidence_level) || 0.95,
    trend_direction: row.trend_direction || 'stable',
    seasonality_factor: parseFloat(row.seasonality_factor) || 1.0,
    anomaly_score: parseFloat(row.anomaly_score) || 0,
  }));
}

export async function saveForecast(
  modelId: string,
  forecast: Partial<ForecastData> & {
    dimension_type: string;
    dimension_id: string;
    forecast_date: string;
  }
): Promise<boolean> {
  const { error } = await supabase.from('demand_forecasts').insert({
    model_id: modelId,
    forecast_date: forecast.forecast_date,
    dimension_type: forecast.dimension_type,
    dimension_id: forecast.dimension_id,
    predicted_quantity: forecast.predicted_quantity || 0,
    predicted_value: forecast.predicted_value || 0,
    confidence_lower: forecast.confidence_lower,
    confidence_upper: forecast.confidence_upper,
    confidence_level: forecast.confidence_level || 0.95,
    seasonality_factor: forecast.seasonality_factor || 1.0,
    trend_direction: forecast.trend_direction || 'stable',
    anomaly_score: forecast.anomaly_score || 0,
  });

  if (error) {
    console.error('[DemandForecasting] Error saving forecast:', error);
    return false;
  }

  return true;
}

export function calculateAccuracy(predicted: number, actual: number): {
  error: number;
  errorPercentage: number;
  accuracy: number;
} {
  const error = actual - predicted;
  const errorPercentage = actual !== 0 ? Math.abs(error / actual) * 100 : 0;
  const accuracy = Math.max(0, 100 - errorPercentage);

  return {
    error,
    errorPercentage,
    accuracy,
  };
}

export function aggregateByPeriod(
  data: Array<{ date: string; value: number }>,
  period: 'day' | 'week' | 'month'
): Array<{ period: string; value: number; count: number }> {
  const aggregated = new Map<string, { value: number; count: number }>();

  data.forEach((item) => {
    const date = new Date(item.date);
    let key: string;

    switch (period) {
      case 'week':
        const weekStart = new Date(date);
        weekStart.setDate(date.getDate() - date.getDay());
        key = weekStart.toISOString().split('T')[0];
        break;
      case 'month':
        key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
        break;
      default:
        key = date.toISOString().split('T')[0];
    }

    const existing = aggregated.get(key) || { value: 0, count: 0 };
    aggregated.set(key, {
      value: existing.value + item.value,
      count: existing.count + 1,
    });
  });

  return Array.from(aggregated.entries())
    .map(([period, data]) => ({
      period,
      value: data.value,
      count: data.count,
    }))
    .sort((a, b) => a.period.localeCompare(b.period));
}

export function detectAnomalies(
  data: number[],
  threshold: number = 2.0
): { indices: number[]; scores: number[] } {
  if (data.length < 3) return { indices: [], scores: [] };

  const mean = data.reduce((sum, val) => sum + val, 0) / data.length;
  const variance =
    data.reduce((sum, val) => sum + Math.pow(val - mean, 2), 0) / data.length;
  const stdDev = Math.sqrt(variance);

  const anomalies: number[] = [];
  const scores: number[] = [];

  data.forEach((value, index) => {
    const zScore = stdDev !== 0 ? Math.abs((value - mean) / stdDev) : 0;
    if (zScore > threshold) {
      anomalies.push(index);
      scores.push(zScore);
    }
  });

  return { indices: anomalies, scores };
}

export function calculateSeasonalIndex(
  data: Array<{ period: number; value: number }>
): Map<number, number> {
  const periodAverages = new Map<number, { sum: number; count: number }>();

  data.forEach(({ period, value }) => {
    const existing = periodAverages.get(period) || { sum: 0, count: 0 };
    periodAverages.set(period, {
      sum: existing.sum + value,
      count: existing.count + 1,
    });
  });

  const overallAverage =
    data.reduce((sum, item) => sum + item.value, 0) / data.length;

  const seasonalIndices = new Map<number, number>();
  periodAverages.forEach((stats, period) => {
    const periodAverage = stats.sum / stats.count;
    const index = overallAverage !== 0 ? periodAverage / overallAverage : 1.0;
    seasonalIndices.set(period, index);
  });

  return seasonalIndices;
}

export function applyMovingAverage(data: number[], windowSize: number = 7): number[] {
  if (data.length < windowSize) return data;

  const result: number[] = [];

  for (let i = 0; i < data.length; i++) {
    const start = Math.max(0, i - Math.floor(windowSize / 2));
    const end = Math.min(data.length, i + Math.ceil(windowSize / 2));
    const window = data.slice(start, end);
    const average = window.reduce((sum, val) => sum + val, 0) / window.length;
    result.push(average);
  }

  return result;
}

export function exponentialSmoothing(
  data: number[],
  alpha: number = 0.3
): number[] {
  if (data.length === 0) return [];

  const smoothed: number[] = [data[0]];

  for (let i = 1; i < data.length; i++) {
    const value = alpha * data[i] + (1 - alpha) * smoothed[i - 1];
    smoothed.push(value);
  }

  return smoothed;
}
