import { useState, useEffect } from 'react';
import {
  TrendingUp,
  TrendingDown,
  Minus,
  AlertTriangle,
  BarChart3,
  Calendar,
  Package,
  Store,
  Users,
  RefreshCw,
  Filter,
  ChevronDown,
  ChevronRight,
  Bell,
  BellOff,
  Sparkles,
  Activity,
} from 'lucide-react';
import { supabase } from '../lib/supabase';
import {
  getProductForecast,
  analyzeProductTrend,
  getCategoryForecast,
  analyzeCrossDimensionDemand,
  getDemandAlerts,
  acknowledgeAlert,
  generateDemandAlerts,
  detectSeasonalPatterns,
  ForecastData,
  TrendAnalysis,
  CategoryForecast,
  CrossDimensionAnalysis,
  DemandAlert,
} from '../lib/demandForecasting';
import { showSuccess, showError } from '../lib/alerts';

type ViewMode = 'products' | 'categories' | 'stores' | 'cross_dimension' | 'alerts';
type TimeRange = '7' | '14' | '30' | '60' | '90';

interface Product {
  id: string;
  name: string;
  category: string;
  code: string;
}

interface StoreData {
  id: string;
  name: string;
  code: string;
}

interface StoreGroup {
  id: string;
  name: string;
  store_count: number;
}

export default function DemandForecastPanel() {
  const [viewMode, setViewMode] = useState<ViewMode>('products');
  const [timeRange, setTimeRange] = useState<TimeRange>('30');
  const [loading, setLoading] = useState(false);

  const [products, setProducts] = useState<Product[]>([]);
  const [stores, setStores] = useState<StoreData[]>([]);
  const [storeGroups, setStoreGroups] = useState<StoreGroup[]>([]);
  const [categories, setCategories] = useState<string[]>([]);

  const [selectedProduct, setSelectedProduct] = useState<string>('');
  const [selectedStore, setSelectedStore] = useState<string>('');
  const [selectedCategory, setSelectedCategory] = useState<string>('');
  const [selectedStoreGroup, setSelectedStoreGroup] = useState<string>('');

  const [productForecasts, setProductForecasts] = useState<ForecastData[]>([]);
  const [productTrend, setProductTrend] = useState<TrendAnalysis | null>(null);
  const [categoryForecasts, setCategoryForecasts] = useState<CategoryForecast[]>([]);
  const [crossDimensionData, setCrossDimensionData] = useState<CrossDimensionAnalysis[]>([]);
  const [alerts, setAlerts] = useState<DemandAlert[]>([]);
  const [seasonalPatterns, setSeasonalPatterns] = useState<any[]>([]);

  const [expandedForecast, setExpandedForecast] = useState<string | null>(null);
  const [showOnlyUnacknowledged, setShowOnlyUnacknowledged] = useState(true);
  const [generatingAlerts, setGeneratingAlerts] = useState(false);

  useEffect(() => {
    loadInitialData();
    loadAlerts();
  }, []);

  useEffect(() => {
    if (viewMode === 'products' && selectedProduct && selectedStore) {
      loadProductForecast();
    } else if (viewMode === 'categories' && selectedCategory && selectedStore) {
      loadCategoryForecast();
    } else if (viewMode === 'cross_dimension' && selectedProduct && selectedStoreGroup) {
      loadCrossDimensionAnalysis();
    }
  }, [viewMode, selectedProduct, selectedStore, selectedCategory, selectedStoreGroup, timeRange]);

  const loadInitialData = async () => {
    setLoading(true);
    try {
      const [productsData, storesData, groupsData] = await Promise.all([
        supabase.from('products').select('id, name, category, code').eq('active', true).order('name'),
        supabase.from('stores').select('id, name, code').eq('active', true).order('name'),
        supabase.from('store_groups').select('id, name').eq('active', true).order('name'),
      ]);

      if (productsData.data) {
        setProducts(productsData.data);
        const uniqueCategories = [...new Set(productsData.data.map((p) => p.category))];
        setCategories(uniqueCategories.sort());
      }

      if (storesData.data) setStores(storesData.data);

      if (groupsData.data) {
        const groupsWithCounts = await Promise.all(
          groupsData.data.map(async (group) => {
            const { count } = await supabase
              .from('store_group_members')
              .select('*', { count: 'exact', head: true })
              .eq('group_id', group.id);
            return { ...group, store_count: count || 0 };
          })
        );
        setStoreGroups(groupsWithCounts);
      }
    } catch (error) {
      console.error('[DemandForecast] Error loading initial data:', error);
      showError('Błąd podczas ładowania danych');
    } finally {
      setLoading(false);
    }
  };

  const loadProductForecast = async () => {
    if (!selectedProduct || !selectedStore) return;

    setLoading(true);
    try {
      const daysBack = parseInt(timeRange) * 2;
      const forecastDays = parseInt(timeRange);

      const [forecasts, trend, patterns] = await Promise.all([
        getProductForecast(selectedProduct, selectedStore, daysBack, forecastDays),
        analyzeProductTrend(selectedProduct, selectedStore, daysBack),
        detectSeasonalPatterns('product', selectedProduct, daysBack),
      ]);

      setProductForecasts(forecasts);
      setProductTrend(trend);
      setSeasonalPatterns(patterns);
    } catch (error) {
      console.error('[DemandForecast] Error loading product forecast:', error);
      showError('Błąd podczas ładowania prognozy produktu');
    } finally {
      setLoading(false);
    }
  };

  const loadCategoryForecast = async () => {
    if (!selectedCategory || !selectedStore) return;

    setLoading(true);
    try {
      const daysBack = parseInt(timeRange) * 2;
      const forecastDays = parseInt(timeRange);

      const forecasts = await getCategoryForecast(
        selectedCategory,
        selectedStore,
        daysBack,
        forecastDays
      );

      setCategoryForecasts(forecasts);
    } catch (error) {
      console.error('[DemandForecast] Error loading category forecast:', error);
      showError('Błąd podczas ładowania prognozy kategorii');
    } finally {
      setLoading(false);
    }
  };

  const loadCrossDimensionAnalysis = async () => {
    if (!selectedProduct || !selectedStoreGroup) return;

    setLoading(true);
    try {
      const daysBack = parseInt(timeRange) * 2;
      const data = await analyzeCrossDimensionDemand(selectedProduct, selectedStoreGroup, daysBack);
      setCrossDimensionData(data);
    } catch (error) {
      console.error('[DemandForecast] Error loading cross-dimension analysis:', error);
      showError('Błąd podczas ładowania analizy wielowymiarowej');
    } finally {
      setLoading(false);
    }
  };

  const loadAlerts = async () => {
    try {
      const data = await getDemandAlerts(!showOnlyUnacknowledged, 100);
      setAlerts(data);
    } catch (error) {
      console.error('[DemandForecast] Error loading alerts:', error);
    }
  };

  const handleGenerateAlerts = async () => {
    setGeneratingAlerts(true);
    try {
      await generateDemandAlerts();
      await loadAlerts();
      showSuccess('Alerty zostały wygenerowane');
    } catch (error) {
      console.error('[DemandForecast] Error generating alerts:', error);
      showError('Błąd podczas generowania alertów');
    } finally {
      setGeneratingAlerts(false);
    }
  };

  const handleAcknowledgeAlert = async (alertId: string) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const success = await acknowledgeAlert(alertId, user.id);
      if (success) {
        showSuccess('Alert potwierdzony');
        await loadAlerts();
      }
    } catch (error) {
      console.error('[DemandForecast] Error acknowledging alert:', error);
      showError('Błąd podczas potwierdzania alertu');
    }
  };

  const getTrendIcon = (direction: string) => {
    switch (direction) {
      case 'increasing':
        return <TrendingUp className="w-5 h-5 text-green-500" />;
      case 'decreasing':
        return <TrendingDown className="w-5 h-5 text-red-500" />;
      default:
        return <Minus className="w-5 h-5 text-gray-500" />;
    }
  };

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'critical':
        return 'bg-red-100 text-red-800 border-red-300';
      case 'high':
        return 'bg-orange-100 text-orange-800 border-orange-300';
      case 'medium':
        return 'bg-yellow-100 text-yellow-800 border-yellow-300';
      default:
        return 'bg-blue-100 text-blue-800 border-blue-300';
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('pl-PL', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    });
  };

  const renderProductView = () => (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Produkt</label>
          <select
            value={selectedProduct}
            onChange={(e) => setSelectedProduct(e.target.value)}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
          >
            <option value="">Wybierz produkt...</option>
            {products.map((product) => (
              <option key={product.id} value={product.id}>
                {product.name} ({product.code})
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Sklep</label>
          <select
            value={selectedStore}
            onChange={(e) => setSelectedStore(e.target.value)}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
          >
            <option value="">Wybierz sklep...</option>
            {stores.map((store) => (
              <option key={store.id} value={store.id}>
                {store.name} ({store.code})
              </option>
            ))}
          </select>
        </div>
      </div>

      {productTrend && (
        <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-lg p-6">
          <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
            <Activity className="w-5 h-5" />
            Analiza Trendu
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="flex items-center gap-3">
              {getTrendIcon(productTrend.trend_direction)}
              <div>
                <p className="text-sm text-gray-600">Kierunek trendu</p>
                <p className="text-lg font-bold text-gray-900">
                  {productTrend.trend_direction === 'increasing'
                    ? 'Wzrostowy'
                    : productTrend.trend_direction === 'decreasing'
                    ? 'Spadkowy'
                    : 'Stabilny'}
                </p>
              </div>
            </div>
            <div>
              <p className="text-sm text-gray-600">Siła trendu</p>
              <p className="text-lg font-bold text-gray-900">
                {(productTrend.trend_strength * 100).toFixed(1)}%
              </p>
            </div>
            <div>
              <p className="text-sm text-gray-600">Zmiana tygodniowa</p>
              <p className="text-lg font-bold text-gray-900">
                {productTrend.avg_change_per_week > 0 ? '+' : ''}
                {productTrend.avg_change_per_week.toFixed(2)}
              </p>
            </div>
          </div>
        </div>
      )}

      {productForecasts.length > 0 && (
        <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
          <div className="px-6 py-4 bg-gradient-to-r from-blue-500 to-indigo-600">
            <h3 className="text-lg font-semibold text-white flex items-center gap-2">
              <BarChart3 className="w-5 h-5" />
              Prognoza Popytu - Kolejne {timeRange} dni
            </h3>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Data
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Przewidywana ilość
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Przedział ufności
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Wizualizacja
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {productForecasts.slice(0, 14).map((forecast, index) => (
                  <tr key={index} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {formatDate(forecast.forecast_date)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="text-lg font-bold text-blue-600">
                        {forecast.predicted_quantity.toFixed(2)}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                      {forecast.confidence_lower.toFixed(2)} -{' '}
                      {forecast.confidence_upper.toFixed(2)}
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        <div className="flex-1 bg-gray-200 rounded-full h-2 overflow-hidden">
                          <div
                            className="bg-blue-500 h-full rounded-full"
                            style={{
                              width: `${Math.min(
                                100,
                                (forecast.predicted_quantity / Math.max(...productForecasts.map((f) => f.predicted_quantity))) * 100
                              )}%`,
                            }}
                          />
                        </div>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {seasonalPatterns.length > 0 && (
        <div className="bg-white border border-gray-200 rounded-lg p-6">
          <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
            <Calendar className="w-5 h-5" />
            Wzorce Sezonowe
          </h3>
          <div className="grid grid-cols-7 gap-2">
            {['Niedz', 'Pon', 'Wt', 'Śr', 'Czw', 'Pt', 'Sob'].map((day, index) => {
              const pattern = seasonalPatterns.find((p) => p.day_of_week === index);
              const multiplier = pattern?.avg_multiplier || 1.0;
              const isHigh = multiplier > 1.2;
              const isLow = multiplier < 0.8;

              return (
                <div
                  key={index}
                  className={`p-3 rounded-lg text-center ${
                    isHigh
                      ? 'bg-green-100 border border-green-300'
                      : isLow
                      ? 'bg-red-100 border border-red-300'
                      : 'bg-gray-100 border border-gray-300'
                  }`}
                >
                  <p className="text-xs font-medium text-gray-700">{day}</p>
                  <p className="text-lg font-bold mt-1">{(multiplier * 100).toFixed(0)}%</p>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );

  const renderCategoryView = () => (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Kategoria</label>
          <select
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
          >
            <option value="">Wybierz kategorię...</option>
            {categories.map((category) => (
              <option key={category} value={category}>
                {category}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Sklep</label>
          <select
            value={selectedStore}
            onChange={(e) => setSelectedStore(e.target.value)}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
          >
            <option value="">Wybierz sklep...</option>
            {stores.map((store) => (
              <option key={store.id} value={store.id}>
                {store.name} ({store.code})
              </option>
            ))}
          </select>
        </div>
      </div>

      {categoryForecasts.length > 0 && (
        <div className="space-y-4">
          <div className="bg-gradient-to-r from-purple-50 to-pink-50 border border-purple-200 rounded-lg p-6">
            <h3 className="text-lg font-semibold text-gray-800 mb-4">
              Prognoza dla kategorii: {selectedCategory}
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <p className="text-sm text-gray-600 mb-1">Średnia przewidywana ilość/dzień</p>
                <p className="text-3xl font-bold text-purple-600">
                  {(
                    categoryForecasts.reduce((sum, f) => sum + f.predicted_quantity, 0) /
                    categoryForecasts.length
                  ).toFixed(2)}
                </p>
              </div>
              <div>
                <p className="text-sm text-gray-600 mb-1">Średnia przewidywana wartość/dzień</p>
                <p className="text-3xl font-bold text-purple-600">
                  {(
                    categoryForecasts.reduce((sum, f) => sum + f.predicted_value, 0) /
                    categoryForecasts.length
                  ).toFixed(2)}{' '}
                  zł
                </p>
              </div>
            </div>
          </div>

          {categoryForecasts[0]?.top_products && categoryForecasts[0].top_products.length > 0 && (
            <div className="bg-white border border-gray-200 rounded-lg p-6">
              <h4 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
                <Package className="w-5 h-5" />
                Top 5 Produktów w Kategorii
              </h4>
              <div className="space-y-3">
                {categoryForecasts[0].top_products.map((product: any, index: number) => (
                  <div
                    key={product.product_id}
                    className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
                  >
                    <div className="flex items-center gap-3">
                      <span className="flex items-center justify-center w-8 h-8 bg-purple-500 text-white rounded-full font-bold">
                        {index + 1}
                      </span>
                      <span className="font-medium text-gray-900">{product.product_name}</span>
                    </div>
                    <span className="text-lg font-bold text-purple-600">
                      {product.total_quantity.toFixed(2)}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );

  const renderCrossDimensionView = () => (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Produkt</label>
          <select
            value={selectedProduct}
            onChange={(e) => setSelectedProduct(e.target.value)}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
          >
            <option value="">Wybierz produkt...</option>
            {products.map((product) => (
              <option key={product.id} value={product.id}>
                {product.name} ({product.code})
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Grupa Sklepów</label>
          <select
            value={selectedStoreGroup}
            onChange={(e) => setSelectedStoreGroup(e.target.value)}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
          >
            <option value="">Wybierz grupę sklepów...</option>
            {storeGroups.map((group) => (
              <option key={group.id} value={group.id}>
                {group.name} ({group.store_count} sklepów)
              </option>
            ))}
          </select>
        </div>
      </div>

      {crossDimensionData.length > 0 && (
        <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
          <div className="px-6 py-4 bg-gradient-to-r from-green-500 to-teal-600">
            <h3 className="text-lg font-semibold text-white flex items-center gap-2">
              <Users className="w-5 h-5" />
              Analiza Wielowymiarowa - Produkt × Grupa Sklepów
            </h3>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Sklep
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Śr. ilość
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Trend
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Ostatnie zam.
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Przewidywane kolejne
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {crossDimensionData.map((item) => (
                  <tr key={item.store_id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center gap-2">
                        <Store className="w-4 h-4 text-gray-400" />
                        <span className="font-medium text-gray-900">{item.store_name}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="text-lg font-bold text-gray-900">
                        {item.avg_quantity.toFixed(2)}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center gap-2">
                        {getTrendIcon(item.trend_direction)}
                        <span className="text-sm text-gray-600">{item.trend_direction}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                      {item.last_order_days_ago} dni temu
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                      za ~{item.predicted_next_order_days} dni
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );

  const renderAlertsView = () => (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <button
            onClick={() => {
              setShowOnlyUnacknowledged(!showOnlyUnacknowledged);
              loadAlerts();
            }}
            className={`px-4 py-2 rounded-lg font-medium transition-colors ${
              showOnlyUnacknowledged
                ? 'bg-blue-500 text-white'
                : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
            }`}
          >
            {showOnlyUnacknowledged ? 'Tylko niepotwierdzone' : 'Wszystkie alerty'}
          </button>
        </div>

        <button
          onClick={handleGenerateAlerts}
          disabled={generatingAlerts}
          className="flex items-center gap-2 px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 disabled:opacity-50"
        >
          {generatingAlerts ? (
            <RefreshCw className="w-5 h-5 animate-spin" />
          ) : (
            <Sparkles className="w-5 h-5" />
          )}
          Generuj nowe alerty
        </button>
      </div>

      {alerts.length === 0 ? (
        <div className="bg-gray-50 border border-gray-200 rounded-lg p-12 text-center">
          <Bell className="w-16 h-16 text-gray-300 mx-auto mb-4" />
          <p className="text-lg text-gray-600">Brak alertów do wyświetlenia</p>
        </div>
      ) : (
        <div className="space-y-4">
          {alerts.map((alert) => (
            <div
              key={alert.id}
              className={`border rounded-lg p-6 ${getSeverityColor(alert.severity)} ${
                alert.acknowledged ? 'opacity-60' : ''
              }`}
            >
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <AlertTriangle className="w-5 h-5" />
                    <h4 className="text-lg font-semibold">{alert.message}</h4>
                  </div>

                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-4 text-sm">
                    <div>
                      <p className="font-medium">Typ:</p>
                      <p>{alert.alert_type}</p>
                    </div>
                    <div>
                      <p className="font-medium">Priorytet:</p>
                      <p className="uppercase font-bold">{alert.severity}</p>
                    </div>
                    <div>
                      <p className="font-medium">Wymiar:</p>
                      <p>{alert.dimension_type}</p>
                    </div>
                    <div>
                      <p className="font-medium">Data:</p>
                      <p>{formatDate(alert.created_at)}</p>
                    </div>
                  </div>

                  {alert.details && Object.keys(alert.details).length > 0 && (
                    <button
                      onClick={() =>
                        setExpandedForecast(expandedForecast === alert.id ? null : alert.id)
                      }
                      className="mt-4 flex items-center gap-2 text-sm font-medium hover:underline"
                    >
                      {expandedForecast === alert.id ? (
                        <ChevronDown className="w-4 h-4" />
                      ) : (
                        <ChevronRight className="w-4 h-4" />
                      )}
                      Szczegóły
                    </button>
                  )}

                  {expandedForecast === alert.id && alert.details && (
                    <div className="mt-4 p-4 bg-white bg-opacity-50 rounded-lg">
                      <pre className="text-xs overflow-x-auto">
                        {JSON.stringify(alert.details, null, 2)}
                      </pre>
                    </div>
                  )}
                </div>

                {!alert.acknowledged && (
                  <button
                    onClick={() => handleAcknowledgeAlert(alert.id)}
                    className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 font-medium text-sm whitespace-nowrap"
                  >
                    <BellOff className="w-4 h-4" />
                    Potwierdź
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );

  return (
    <div className="max-w-7xl mx-auto p-6 space-y-6">
      <div className="bg-gradient-to-r from-blue-600 to-indigo-700 text-white rounded-lg p-8 shadow-lg">
        <div className="flex items-center gap-4 mb-4">
          <Sparkles className="w-10 h-10" />
          <div>
            <h1 className="text-3xl font-bold">AI Demand Forecasting</h1>
            <p className="text-blue-100 mt-1">
              Wielowymiarowa analiza i prognozowanie popytu z wykorzystaniem sztucznej inteligencji
            </p>
          </div>
        </div>
      </div>

      <div className="bg-white border border-gray-200 rounded-lg p-6">
        <div className="flex flex-wrap items-center gap-4 mb-6">
          <div className="flex items-center gap-2">
            <Filter className="w-5 h-5 text-gray-600" />
            <span className="font-medium text-gray-700">Widok:</span>
          </div>

          <div className="flex gap-2">
            {[
              { value: 'products', label: 'Produkty', icon: Package },
              { value: 'categories', label: 'Kategorie', icon: BarChart3 },
              { value: 'cross_dimension', label: 'Analiza wielowymiarowa', icon: Users },
              { value: 'alerts', label: 'Alerty', icon: Bell },
            ].map(({ value, label, icon: Icon }) => (
              <button
                key={value}
                onClick={() => setViewMode(value as ViewMode)}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-colors ${
                  viewMode === value
                    ? 'bg-blue-500 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                <Icon className="w-4 h-4" />
                {label}
              </button>
            ))}
          </div>
        </div>

        {viewMode !== 'alerts' && (
          <div className="flex items-center gap-4 mb-6">
            <span className="font-medium text-gray-700">Okres analizy:</span>
            <div className="flex gap-2">
              {[
                { value: '7', label: '7 dni' },
                { value: '14', label: '14 dni' },
                { value: '30', label: '30 dni' },
                { value: '60', label: '60 dni' },
                { value: '90', label: '90 dni' },
              ].map(({ value, label }) => (
                <button
                  key={value}
                  onClick={() => setTimeRange(value as TimeRange)}
                  className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                    timeRange === value
                      ? 'bg-green-500 text-white'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  {label}
                </button>
              ))}
            </div>
          </div>
        )}

        {loading && (
          <div className="flex items-center justify-center py-12">
            <RefreshCw className="w-8 h-8 animate-spin text-blue-500" />
            <span className="ml-3 text-lg text-gray-600">Ładowanie prognozy...</span>
          </div>
        )}

        {!loading && (
          <>
            {viewMode === 'products' && renderProductView()}
            {viewMode === 'categories' && renderCategoryView()}
            {viewMode === 'cross_dimension' && renderCrossDimensionView()}
            {viewMode === 'alerts' && renderAlertsView()}
          </>
        )}
      </div>
    </div>
  );
}
