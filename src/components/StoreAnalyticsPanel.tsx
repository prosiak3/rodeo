import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import {
  Store, Calendar, TrendingUp, Package, DollarSign,
  ChevronDown, ChevronRight, Filter, BarChart3
} from 'lucide-react';

interface StoreData {
  id: string;
  name: string;
  address: string;
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

  const [timeFilter, setTimeFilter] = useState<'week' | 'month' | 'quarter' | 'year' | 'all'>('month');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [topLimit, setTopLimit] = useState<10 | 20 | 50 | 100>(20);

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
      .select('id, name, address')
      .eq('active', true)
      .order('name');

    if (!error && data) {
      setStores(data);
      if (data.length > 0) {
        setSelectedStore(data[0].id);
      }
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
      ]);
    } catch (error) {
      console.error('Failed to load store data:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadOrders = async () => {
    const cutoffDate = getDateCutoff(timeFilter);

    let query = supabase
      .from('orders')
      .select('id, order_number, status, created_at, source_type')
      .eq('store_id', selectedStore)
      .gte('created_at', cutoffDate)
      .order('created_at', { ascending: false });

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
            .select('quantity, special_price, your_price, products(name, price)')
            .eq('order_id', order.id);

          const totalItems = items?.reduce((sum, item) => sum + item.quantity, 0) || 0;
          const totalValue = items?.reduce((sum, item) => {
            const product = item.products as any;
            const price = item.special_price || item.your_price || product?.price || 0;
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
    const cutoffDate = getDateCutoff(timeFilter);

    let ordersQuery = supabase
      .from('orders')
      .select('id')
      .eq('store_id', selectedStore)
      .in('status', ['sent', 'confirmed', 'partially_confirmed'])
      .gte('created_at', cutoffDate);

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
        special_price,
        your_price,
        products (
          name,
          product_index,
          price,
          category
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
      const price = item.special_price || item.your_price || product.price || 0;
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
          product_index: product.product_index || '',
          total_quantity: item.quantity,
          total_value: value,
          order_count: 1,
          category: product.category || 'Inne',
        });
      }
    });

    const sorted = Array.from(productMap.values())
      .sort((a, b) => b.total_quantity - a.total_quantity)
      .slice(0, topLimit);

    setTopProducts(sorted);
  };

  const loadTimeStats = async () => {
    const cutoffDate = getDateCutoff(timeFilter);

    let ordersQuery = supabase
      .from('orders')
      .select('id, created_at')
      .eq('store_id', selectedStore)
      .in('status', ['sent', 'confirmed', 'partially_confirmed'])
      .gte('created_at', cutoffDate);

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
        special_price,
        your_price,
        products (
          price,
          category
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
        const price = item.special_price || item.your_price || product?.price || 0;
        periodData.value += item.quantity * price;

        const category = product?.category || 'Inne';
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
        special_price,
        your_price,
        products (
          name,
          product_index,
          price,
          unit
        )
      `)
      .eq('order_id', orderId);

    if (data) {
      setOrderItems(prev => ({ ...prev, [orderId]: data }));
      setExpandedOrder(orderId);
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

  return (
    <div className="space-y-6">
      {/* Store Selector */}
      <div className="bg-white rounded-lg shadow p-6">
        <div className="flex items-center gap-4 mb-4">
          <Store className="w-6 h-6 text-blue-600" />
          <h2 className="text-xl font-bold text-gray-900">Analiza Placówki</h2>
        </div>

        <select
          value={selectedStore}
          onChange={(e) => setSelectedStore(e.target.value)}
          className="w-full px-4 py-3 border border-gray-300 rounded-lg text-lg focus:ring-2 focus:ring-blue-500"
        >
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

          <div className="flex gap-2 items-center">
            <label className="text-sm font-medium text-gray-700">Okres:</label>
            <select
              value={timeFilter}
              onChange={(e) => setTimeFilter(e.target.value as any)}
              className="px-3 py-2 border border-gray-300 rounded-lg text-sm"
            >
              <option value="week">Ostatni tydzień</option>
              <option value="month">Ostatni miesiąc</option>
              <option value="quarter">Ostatni kwartał</option>
              <option value="year">Ostatni rok</option>
              <option value="all">Wszystko</option>
            </select>
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
                          const price = item.special_price || item.your_price || item.products?.price || 0;
                          const value = item.quantity * price;
                          return (
                            <tr key={idx} className="border-b border-gray-200">
                              <td className="py-2 px-2 text-sm font-mono text-gray-700">
                                {item.products?.product_index}
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
    </div>
  );
}

function getDateCutoff(filter: 'week' | 'month' | 'quarter' | 'year' | 'all'): string {
  const now = new Date();
  switch (filter) {
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
    case 'all':
      return new Date('2020-01-01').toISOString();
  }
}
