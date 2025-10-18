import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import {
  Store, Calendar, TrendingUp, Package, DollarSign,
  ChevronDown, ChevronRight, Filter, BarChart3, Map
} from 'lucide-react';
import StoresMap from './StoresMap';

interface StoreData {
  id: string;
  name: string;
  address: string;
  latitude: number | null;
  longitude: number | null;
}

interface OrderSummary {
  id: string;
  order_number: string;
  status: string;
  created_at: string;
  total_items: number;
  total_value: number;
  source_type: string;
}

interface ProductStats {
  product_id: string;
  product_name: string;
  product_index: string;
  total_quantity: number;
  total_value: number;
  order_count: number;
  category: string;
}

interface TimeStats {
  period: string;
  order_count: number;
  total_value: number;
  top_category: string;
}

export default function StoreAnalyticsPanel() {
  const [stores, setStores] = useState<StoreData[]>([]);
  const [selectedStore, setSelectedStore] = useState<string>('');
  const [loading, setLoading] = useState(true);
  const [orders, setOrders] = useState<OrderSummary[]>([]);
  const [topProducts, setTopProducts] = useState<ProductStats[]>([]);
  const [timeStats, setTimeStats] = useState<TimeStats[]>([]);
  const [expandedOrder, setExpandedOrder] = useState<string | null>(null);
  const [orderItems, setOrderItems] = useState<Record<string, any[]>>({});
  const [showMap, setShowMap] = useState(true);

  const [timeFilter, setTimeFilter] = useState<'week' | 'month' | 'quarter' | 'year' | 'all' | '30' | '90' | '180' | '270' | '365' | 'custom'>('30');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [topLimit, setTopLimit] = useState<10 | 20 | 50 | 100>(20);
  const [seasonalData, setSeasonalData] = useState<any[]>([]);
  const [customDateFrom, setCustomDateFrom] = useState<string>('');
  const [customDateTo, setCustomDateTo] = useState<string>('');

  useEffect(() => {
    loadStores();
  }, []);

  useEffect(() => {
    if (selectedStore) {
      loadStoreData();
    }
  }, [selectedStore, timeFilter, statusFilter, topLimit]);

  const loadStores = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('stores')
      .select('id, name, address, latitude, longitude')
      .eq('active', true)
      .order('name');

    if (!error && data) {
      setStores(data);
    }
    setLoading(false);
  };

  const loadStoreData = async () => {
    setLoading(true);
    try {
      await Promise.all([
        loadOrders(),
        loadTopProducts(),
        loadTimeStats(),
        loadSeasonalData(),
      ]);
    } catch (error) {
      console.error('Failed to load store data:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadOrders = async () => {
    const cutoffDate = getDateCutoff(timeFilter, customDateFrom);

    let query = supabase
      .from('orders')
      .select(`
        id,
        order_number,
        status,
        created_at,
        sent_at,
        source_type,
        created_by_user:users!created_by(full_name, email)
      `)
      .eq('store_id', selectedStore)
      .gte('created_at', cutoffDate)
      .order('created_at', { ascending: false });

    if (timeFilter === 'custom' && customDateTo) {
      query = query.lte('created_at', new Date(customDateTo + 'T23:59:59').toISOString());
    }

    if (statusFilter !== 'all') {
      query = query.eq('status', statusFilter);
    } else {
      query = query.in('status', ['sent', 'confirmed', 'partially_confirmed']);
    }

    const { data: ordersData, error } = await query;

    if (!error && ordersData) {
      const ordersWithStats = await Promise.all(
        ordersData.map(async (order) => {
          const { data: items } = await supabase
            .from('order_items')
            .select('quantity, unit_price, total_price, products(name, base_price)')
            .eq('order_id', order.id);

          const totalItems = items?.reduce((sum, item) => sum + item.quantity, 0) || 0;
          const totalValue = items?.reduce((sum, item) => {
            const product = item.products as any;
            const price = item.unit_price > 0 ? item.unit_price : (product?.base_price || 0);
            return sum + (item.quantity * price);
          }, 0) || 0;

          return {
            ...order,
            total_items: totalItems,
            total_value: totalValue,
          };
        })
      );

      setOrders(ordersWithStats);
    }
  };

  const loadTopProducts = async () => {
    const cutoffDate = getDateCutoff(timeFilter, customDateFrom);

    let ordersQuery = supabase
      .from('orders')
      .select('id')
      .eq('store_id', selectedStore)
      .in('status', ['sent', 'confirmed', 'partially_confirmed'])
      .gte('created_at', cutoffDate);

    if (timeFilter === 'custom' && customDateTo) {
      ordersQuery = ordersQuery.lte('created_at', new Date(customDateTo + 'T23:59:59').toISOString());
    }

    if (statusFilter !== 'all') {
      ordersQuery = ordersQuery.eq('status', statusFilter);
    }

    const { data: ordersData } = await ordersQuery;

    if (!ordersData || ordersData.length === 0) {
      setTopProducts([]);
      return;
    }

    const orderIds = ordersData.map(o => o.id);

    const { data: items } = await supabase
      .from('order_items')
      .select(`
        product_id,
        quantity,
        unit_price,
        products (
          name,
          index,
          base_price,
          display_category,
          original_category
        )
      `)
      .in('order_id', orderIds);

    if (!items) {
      setTopProducts([]);
      return;
    }

    const productMap = new Map<string, ProductStats>();

    items.forEach(item => {
      const product = item.products as any;
      if (!product) return;

      const key = item.product_id;
      const price = item.unit_price > 0 ? item.unit_price : (product.base_price || 0);
      const value = item.quantity * price;

      if (productMap.has(key)) {
        const existing = productMap.get(key)!;
        existing.total_quantity += item.quantity;
        existing.total_value += value;
        existing.order_count += 1;
      } else {
        productMap.set(key, {
          product_id: item.product_id,
          product_name: product.name,
          product_index: product.index || '',
          total_quantity: item.quantity,
          total_value: value,
          order_count: 1,
          category: product.display_category || product.original_category || 'Inne',
        });
      }
    });

    const sorted = Array.from(productMap.values())
      .sort((a, b) => b.total_quantity - a.total_quantity)
      .slice(0, topLimit);

    setTopProducts(sorted);
  };

  const loadTimeStats = async () => {
    const cutoffDate = getDateCutoff(timeFilter, customDateFrom);

    let ordersQuery = supabase
      .from('orders')
      .select('id, created_at')
      .eq('store_id', selectedStore)
      .in('status', ['sent', 'confirmed', 'partially_confirmed'])
      .gte('created_at', cutoffDate);

    if (timeFilter === 'custom' && customDateTo) {
      ordersQuery = ordersQuery.lte('created_at', new Date(customDateTo + 'T23:59:59').toISOString());
    }

    if (statusFilter !== 'all') {
      ordersQuery = ordersQuery.eq('status', statusFilter);
    }

    const { data: ordersData } = await ordersQuery;

    if (!ordersData || ordersData.length === 0) {
      setTimeStats([]);
      return;
    }

    const orderIds = ordersData.map(o => o.id);

    const { data: items } = await supabase
      .from('order_items')
      .select(`
        order_id,
        quantity,
        unit_price,
        products (
          base_price,
          display_category,
          original_category
        )
      `)
      .in('order_id', orderIds);

    const periodMap = new Map<string, {
      count: number;
      value: number;
      categories: Map<string, number>
    }>();

    ordersData.forEach(order => {
      const date = new Date(order.created_at);
      const period = getPeriodKey(date, timeFilter);

      if (!periodMap.has(period)) {
        periodMap.set(period, {
          count: 0,
          value: 0,
          categories: new Map()
        });
      }

      const periodData = periodMap.get(period)!;
      periodData.count += 1;

      const orderItems = items?.filter(i => i.order_id === order.id) || [];
      orderItems.forEach(item => {
        const product = item.products as any;
        const price = item.unit_price > 0 ? item.unit_price : (product?.base_price || 0);
        periodData.value += item.quantity * price;

        const category = product?.display_category || product?.original_category || 'Inne';
        periodData.categories.set(
          category,
          (periodData.categories.get(category) || 0) + item.quantity
        );
      });
    });

    const stats: TimeStats[] = Array.from(periodMap.entries()).map(([period, data]) => {
      const topCategory = Array.from(data.categories.entries())
        .sort((a, b) => b[1] - a[1])[0];

      return {
        period,
        order_count: data.count,
        total_value: data.value,
        top_category: topCategory ? topCategory[0] : 'Brak',
      };
    }).sort((a, b) => a.period.localeCompare(b.period));

    setTimeStats(stats);
  };

  const loadOrderItems = async (orderId: string) => {
    if (orderItems[orderId]) {
      setExpandedOrder(expandedOrder === orderId ? null : orderId);
      return;
    }

    const { data } = await supabase
      .from('order_items')
      .select(`
        quantity,
        unit_price,
        products (
          name,
          index,
          base_price,
          unit
        )
      `)
      .eq('order_id', orderId);

    if (data) {
      setOrderItems(prev => ({ ...prev, [orderId]: data }));
      setExpandedOrder(orderId);
    }
  };

  const loadSeasonalData = async () => {
    const { data: monthlyData } = await supabase.rpc('get_seasonal_trends', {
      p_store_id: selectedStore,
      p_months: 12
    });

    if (monthlyData) {
      setSeasonalData(monthlyData);
    }
  };

  const getPeriodKey = (date: Date, filter: string): string => {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');

    switch (filter) {
      case 'week':
      case 'month':
        return `${year}-${month}-${day}`;
      case 'quarter':
      case 'year':
        return `${year}-${month}`;
      case 'all':
        return `${year}`;
      default:
        return `${year}-${month}`;
    }
  };

  if (loading && stores.length === 0) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  const storesWithCoordinates = stores.filter(s => s.latitude && s.longitude).map(s => ({
    id: s.id,
    name: s.name,
    address: s.address,
    latitude: s.latitude!,
    longitude: s.longitude!,
  }));

  return (
    <div className="space-y-6">
      {/* Store Selector with Map Toggle */}
      <div className="bg-white rounded-lg shadow p-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-4">
            <Store className="w-6 h-6 text-blue-600" />
            <h2 className="text-xl font-bold text-gray-900">Analiza Placówki</h2>
          </div>
          <button
            onClick={() => setShowMap(!showMap)}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition ${
              showMap
                ? 'bg-blue-600 text-white hover:bg-blue-700'
                : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
            }`}
          >
            <Map className="w-5 h-5" />
            {showMap ? 'Ukryj mapę' : 'Pokaż mapę'}
          </button>
        </div>

        {showMap && storesWithCoordinates.length > 0 && (
          <div className="mb-6">
            <StoresMap
              stores={storesWithCoordinates}
              selectedStoreId={selectedStore}
              onStoreSelect={setSelectedStore}
            />
          </div>
        )}

        <select
          value={selectedStore}
          onChange={(e) => setSelectedStore(e.target.value)}
          className="w-full px-4 py-3 border border-gray-300 rounded-lg text-lg focus:ring-2 focus:ring-blue-500"
        >
          <option value="">-- Wybierz placówkę do analizy --</option>
          {stores.map(store => (
            <option key={store.id} value={store.id}>
              {store.name} - {store.address}
            </option>
          ))}
        </select>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-lg shadow p-4">
        <div className="flex flex-wrap gap-4 items-center">
          <Filter className="w-5 h-5 text-gray-500" />

          <div className="flex gap-2 items-center flex-wrap">
            <label className="text-sm font-medium text-gray-700">Okres:</label>
            <select
              value={timeFilter}
              onChange={(e) => setTimeFilter(e.target.value as any)}
              className="px-3 py-2 border border-gray-300 rounded-lg text-sm"
            >
              <option value="30">Ostatnie 30 dni</option>
              <option value="90">Ostatnie 90 dni</option>
              <option value="180">Ostatnie 180 dni</option>
              <option value="270">Ostatnie 270 dni</option>
              <option value="365">Ostatnie 365 dni</option>
              <option value="week">Ostatni tydzień</option>
              <option value="month">Ostatni miesiąc</option>
              <option value="quarter">Ostatni kwartał</option>
              <option value="year">Ostatni rok</option>
              <option value="all">Wszystko</option>
              <option value="custom">Zakres dat (niestandardowy)</option>
            </select>

            {timeFilter === 'custom' && (
              <div className="flex gap-2 items-center">
                <label className="text-sm text-gray-600">Od:</label>
                <input
                  type="date"
                  value={customDateFrom}
                  onChange={(e) => setCustomDateFrom(e.target.value)}
                  className="px-3 py-2 border border-gray-300 rounded-lg text-sm"
                />
                <label className="text-sm text-gray-600">Do:</label>
                <input
                  type="date"
                  value={customDateTo}
                  onChange={(e) => setCustomDateTo(e.target.value)}
                  className="px-3 py-2 border border-gray-300 rounded-lg text-sm"
                />
                <button
                  onClick={() => loadStoreData()}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700"
                >
                  Zastosuj
                </button>
              </div>
            )}
          </div>

          <div className="flex gap-2 items-center">
            <label className="text-sm font-medium text-gray-700">Status:</label>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-lg text-sm"
            >
              <option value="all">Wszystkie</option>
              <option value="sent">Wysłane</option>
              <option value="confirmed">Potwierdzone</option>
              <option value="partially_confirmed">Częściowo potwierdzone</option>
            </select>
          </div>

          <div className="flex gap-2 items-center">
            <label className="text-sm font-medium text-gray-700">Top produktów:</label>
            <select
              value={topLimit}
              onChange={(e) => setTopLimit(Number(e.target.value) as any)}
              className="px-3 py-2 border border-gray-300 rounded-lg text-sm"
            >
              <option value="10">Top 10</option>
              <option value="20">Top 20</option>
              <option value="50">Top 50</option>
              <option value="100">Top 100</option>
            </select>
          </div>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Zamówienia</p>
              <p className="text-3xl font-bold text-gray-900 mt-2">{orders.length}</p>
            </div>
            <Package className="w-10 h-10 text-blue-500" />
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Produktów</p>
              <p className="text-3xl font-bold text-gray-900 mt-2">{topProducts.length}</p>
            </div>
            <TrendingUp className="w-10 h-10 text-green-500" />
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Wartość całkowita</p>
              <p className="text-3xl font-bold text-gray-900 mt-2">
                {orders.reduce((sum, o) => sum + o.total_value, 0).toFixed(2)} zł
              </p>
            </div>
            <DollarSign className="w-10 h-10 text-amber-500" />
          </div>
        </div>
      </div>

      {/* Top Products */}
      <div className="bg-white rounded-lg shadow p-6">
        <div className="flex items-center gap-3 mb-4">
          <BarChart3 className="w-6 h-6 text-blue-600" />
          <h3 className="text-xl font-bold text-gray-900">
            Top {topLimit} Najczęściej Zamawianych Produktów
          </h3>
        </div>

        {topProducts.length === 0 ? (
          <p className="text-gray-500 text-center py-8">Brak danych dla wybranych filtrów</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-200">
                  <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">#</th>
                  <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">Indeks</th>
                  <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">Produkt</th>
                  <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">Kategoria</th>
                  <th className="text-right py-3 px-4 text-sm font-semibold text-gray-700">Ilość</th>
                  <th className="text-right py-3 px-4 text-sm font-semibold text-gray-700">Wartość</th>
                  <th className="text-right py-3 px-4 text-sm font-semibold text-gray-700">Zamówienia</th>
                </tr>
              </thead>
              <tbody>
                {topProducts.map((product, idx) => (
                  <tr key={product.product_id} className="border-b border-gray-100 hover:bg-gray-50">
                    <td className="py-3 px-4 text-sm font-bold text-gray-900">{idx + 1}</td>
                    <td className="py-3 px-4 text-sm font-mono text-gray-700">{product.product_index}</td>
                    <td className="py-3 px-4 text-sm text-gray-900">{product.product_name}</td>
                    <td className="py-3 px-4 text-sm text-gray-600">{product.category}</td>
                    <td className="py-3 px-4 text-sm text-right font-semibold text-gray-900">
                      {product.total_quantity}
                    </td>
                    <td className="py-3 px-4 text-sm text-right font-semibold text-green-600">
                      {product.total_value.toFixed(2)} zł
                    </td>
                    <td className="py-3 px-4 text-sm text-right text-gray-700">
                      {product.order_count}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Time Analysis */}
      {timeStats.length > 0 && (
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center gap-3 mb-4">
            <Calendar className="w-6 h-6 text-blue-600" />
            <h3 className="text-xl font-bold text-gray-900">Analiza Czasowa Zamówień</h3>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-200">
                  <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">Okres</th>
                  <th className="text-right py-3 px-4 text-sm font-semibold text-gray-700">Zamówienia</th>
                  <th className="text-right py-3 px-4 text-sm font-semibold text-gray-700">Wartość</th>
                  <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">Top Kategoria</th>
                </tr>
              </thead>
              <tbody>
                {timeStats.map((stat, idx) => (
                  <tr key={idx} className="border-b border-gray-100 hover:bg-gray-50">
                    <td className="py-3 px-4 text-sm font-mono text-gray-900">{stat.period}</td>
                    <td className="py-3 px-4 text-sm text-right font-semibold text-gray-900">
                      {stat.order_count}
                    </td>
                    <td className="py-3 px-4 text-sm text-right font-semibold text-green-600">
                      {stat.total_value.toFixed(2)} zł
                    </td>
                    <td className="py-3 px-4 text-sm text-gray-700">{stat.top_category}</td>
                  </tr>
                ))}
              </tbody>
            </table>

            {/* Visual Timeline Chart */}
            <div className="mt-8">
              <h4 className="text-lg font-semibold text-gray-900 mb-4">Wizualizacja zamówień w czasie</h4>
              <div className="space-y-3">
                {timeStats.map((stat, idx) => {
                  const maxValue = Math.max(...timeStats.map(s => s.total_value));
                  const widthPercent = (stat.total_value / maxValue) * 100;

                  return (
                    <div key={idx} className="flex items-center gap-3">
                      <div className="w-24 text-sm font-mono text-gray-700 text-right">
                        {stat.period}
                      </div>
                      <div className="flex-1 bg-gray-100 rounded-full h-8 relative overflow-hidden">
                        <div
                          className="bg-gradient-to-r from-blue-500 to-blue-600 h-full rounded-full transition-all duration-500 flex items-center justify-end pr-3"
                          style={{ width: `${widthPercent}%` }}
                        >
                          <span className="text-white text-xs font-semibold">
                            {stat.order_count} zamówień
                          </span>
                        </div>
                      </div>
                      <div className="w-32 text-sm font-semibold text-gray-900 text-right">
                        {stat.total_value.toFixed(2)} zł
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Orders List */}
      <div className="bg-white rounded-lg shadow p-6">
        <div className="flex items-center gap-3 mb-4">
          <Package className="w-6 h-6 text-blue-600" />
          <h3 className="text-xl font-bold text-gray-900">Wszystkie Zamówienia</h3>
        </div>

        {orders.length === 0 ? (
          <p className="text-gray-500 text-center py-8">Brak zamówień dla wybranych filtrów</p>
        ) : (
          <div className="space-y-2">
            {orders.map(order => (
              <div key={order.id} className="border border-gray-200 rounded-lg">
                <button
                  onClick={() => loadOrderItems(order.id)}
                  className="w-full flex items-center justify-between p-4 hover:bg-gray-50 transition"
                >
                  <div className="flex items-center gap-4">
                    {expandedOrder === order.id ? (
                      <ChevronDown className="w-5 h-5 text-gray-500" />
                    ) : (
                      <ChevronRight className="w-5 h-5 text-gray-500" />
                    )}
                    <div className="text-left">
                      <p className="font-mono font-semibold text-gray-900">{order.order_number}</p>
                      <p className="text-sm text-gray-600">
                        {new Date(order.created_at).toLocaleString('pl-PL')}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-6">
                    <div className="text-right">
                      <p className="text-sm text-gray-600">Produktów: {order.total_items}</p>
                      <p className="text-sm font-semibold text-green-600">
                        {order.total_value.toFixed(2)} zł
                      </p>
                    </div>
                    <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                      order.status === 'confirmed' ? 'bg-green-100 text-green-800' :
                      order.status === 'sent' ? 'bg-blue-100 text-blue-800' :
                      'bg-yellow-100 text-yellow-800'
                    }`}>
                      {order.status === 'confirmed' ? 'Potwierdzone' :
                       order.status === 'sent' ? 'Wysłane' : 'Częściowo potwierdzone'}
                    </span>
                  </div>
                </button>

                {expandedOrder === order.id && orderItems[order.id] && (
                  <div className="border-t border-gray-200 p-4 bg-gray-50">
                    <div className="mb-4 grid grid-cols-2 gap-4 text-sm">
                      <div>
                        <span className="font-semibold text-gray-700">Utworzone przez:</span>
                        <p className="text-gray-900 mt-1">
                          {order.created_by_user?.full_name || 'Nieznany użytkownik'}
                        </p>
                        <p className="text-gray-600 text-xs">
                          {order.created_by_user?.email || ''}
                        </p>
                      </div>
                      <div>
                        <span className="font-semibold text-gray-700">Wysłane:</span>
                        <p className="text-gray-900 mt-1">
                          {order.sent_at ? new Date(order.sent_at).toLocaleString('pl-PL') : 'Nie wysłano'}
                        </p>
                      </div>
                    </div>
                    <table className="w-full">
                      <thead>
                        <tr className="border-b border-gray-300">
                          <th className="text-left py-2 px-2 text-sm font-semibold text-gray-700">Indeks</th>
                          <th className="text-left py-2 px-2 text-sm font-semibold text-gray-700">Produkt</th>
                          <th className="text-right py-2 px-2 text-sm font-semibold text-gray-700">Ilość</th>
                          <th className="text-right py-2 px-2 text-sm font-semibold text-gray-700">Cena</th>
                          <th className="text-right py-2 px-2 text-sm font-semibold text-gray-700">Wartość</th>
                        </tr>
                      </thead>
                      <tbody>
                        {orderItems[order.id].map((item, idx) => {
                          const price = item.unit_price > 0 ? item.unit_price : (item.products?.base_price || 0);
                          const value = item.quantity * price;
                          return (
                            <tr key={idx} className="border-b border-gray-200">
                              <td className="py-2 px-2 text-sm font-mono text-gray-700">
                                {item.products?.index}
                              </td>
                              <td className="py-2 px-2 text-sm text-gray-900">
                                {item.products?.name}
                              </td>
                              <td className="py-2 px-2 text-sm text-right text-gray-900">
                                {item.quantity} {item.products?.unit || 'szt'}
                              </td>
                              <td className="py-2 px-2 text-sm text-right text-gray-700">
                                {price.toFixed(2)} zł
                              </td>
                              <td className="py-2 px-2 text-sm text-right font-semibold text-gray-900">
                                {value.toFixed(2)} zł
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Seasonal Trends Analysis */}
      {selectedStore && seasonalData.length > 0 && (
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center gap-3 mb-4">
            <TrendingUp className="w-6 h-6 text-blue-600" />
            <h3 className="text-xl font-bold text-gray-900">Analiza Sezonowości Produktów (12 miesięcy)</h3>
          </div>

          <p className="text-sm text-gray-600 mb-6">
            Analiza pokazuje trendy w zamawianych kategoriach produktów w ciągu roku.
            Pomaga zidentyfikować wzorce jak np. więcej mięsa latem (grillowanie) czy więcej wędlin przed świętami.
          </p>

          {(() => {
            const monthNames = ['Sty', 'Lut', 'Mar', 'Kwi', 'Maj', 'Cze', 'Lip', 'Sie', 'Wrz', 'Paź', 'Lis', 'Gru'];
            const categories = [...new Set(seasonalData.map(d => d.category))];
            const colors = {
              'Mięso': 'bg-red-500',
              'Drób': 'bg-yellow-500',
              'Wołowina': 'bg-orange-500',
              'Indyk': 'bg-amber-600',
              'Inne': 'bg-gray-500'
            };

            const monthlyTotals = new Map();
            seasonalData.forEach(item => {
              const current = monthlyTotals.get(item.month) || 0;
              monthlyTotals.set(item.month, current + parseFloat(item.total_quantity));
            });

            const maxTotal = Math.max(...Array.from(monthlyTotals.values()));

            return (
              <div className="space-y-6">
                {/* Stacked Bar Chart */}
                <div className="space-y-2">
                  {Array.from({ length: 12 }, (_, i) => i + 1).map(month => {
                    const monthData = seasonalData.filter(d => d.month === month);
                    const total = monthlyTotals.get(month) || 0;
                    const heightPercent = (total / maxTotal) * 100;

                    return (
                      <div key={month} className="flex items-center gap-3">
                        <div className="w-16 text-sm font-semibold text-gray-700 text-right">
                          {monthNames[month - 1]}
                        </div>
                        <div className="flex-1 h-12 bg-gray-100 rounded-lg overflow-hidden flex relative">
                          {monthData.map((item, idx) => {
                            const percent = (parseFloat(item.total_quantity) / total) * 100;
                            const color = colors[item.category as keyof typeof colors] || colors['Inne'];

                            return (
                              <div
                                key={idx}
                                className={`${color} h-full flex items-center justify-center text-white text-xs font-semibold transition-all duration-300 hover:opacity-80`}
                                style={{ width: `${percent}%` }}
                                title={`${item.category}: ${parseFloat(item.total_quantity).toFixed(0)} kg`}
                              >
                                {percent > 15 && item.category}
                              </div>
                            );
                          })}
                        </div>
                        <div className="w-24 text-sm text-gray-900 text-right">
                          {total.toFixed(0)} kg
                        </div>
                      </div>
                    );
                  })}
                </div>

                {/* Legend */}
                <div className="flex flex-wrap gap-4 justify-center pt-4 border-t">
                  {categories.map(category => (
                    <div key={category} className="flex items-center gap-2">
                      <div className={`w-4 h-4 rounded ${colors[category as keyof typeof colors] || colors['Inne']}`}></div>
                      <span className="text-sm text-gray-700">{category}</span>
                    </div>
                  ))}
                </div>

                {/* Insights */}
                <div className="mt-6 p-4 bg-blue-50 rounded-lg">
                  <h4 className="font-semibold text-blue-900 mb-2">💡 Wnioski z analizy:</h4>
                  <ul className="text-sm text-blue-800 space-y-1">
                    <li>• Szczyt zamówień: {monthNames[Array.from(monthlyTotals.entries()).sort((a, b) => b[1] - a[1])[0][0] - 1]} ({Array.from(monthlyTotals.entries()).sort((a, b) => b[1] - a[1])[0][1].toFixed(0)} kg)</li>
                    <li>• Najniższy okres: {monthNames[Array.from(monthlyTotals.entries()).sort((a, b) => a[1] - b[1])[0][0] - 1]} ({Array.from(monthlyTotals.entries()).sort((a, b) => a[1] - b[1])[0][1].toFixed(0)} kg)</li>
                    <li>• Dane te mogą być wykorzystane do automatycznego sugerowania zamówień w systemie AI</li>
                  </ul>
                </div>
              </div>
            );
          })()}
        </div>
      )}
    </div>
  );
}

function getDateCutoff(filter: 'week' | 'month' | 'quarter' | 'year' | 'all' | '30' | '90' | '180' | '270' | '365' | 'custom', customFrom?: string): string {
  const now = new Date();
  switch (filter) {
    case '30':
      now.setDate(now.getDate() - 30);
      return now.toISOString();
    case '90':
      now.setDate(now.getDate() - 90);
      return now.toISOString();
    case '180':
      now.setDate(now.getDate() - 180);
      return now.toISOString();
    case '270':
      now.setDate(now.getDate() - 270);
      return now.toISOString();
    case '365':
      now.setDate(now.getDate() - 365);
      return now.toISOString();
    case 'week':
      now.setDate(now.getDate() - 7);
      return now.toISOString();
    case 'month':
      now.setDate(now.getDate() - 30);
      return now.toISOString();
    case 'quarter':
      now.setMonth(now.getMonth() - 3);
      return now.toISOString();
    case 'year':
      now.setFullYear(now.getFullYear() - 1);
      return now.toISOString();
    case 'custom':
      return customFrom ? new Date(customFrom).toISOString() : new Date('2020-01-01').toISOString();
    case 'all':
      return new Date('2020-01-01').toISOString();
  }
}
