import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import { Package, TrendingUp, DollarSign, ShoppingCart, Filter, ArrowUpDown } from 'lucide-react';

interface ProductStats {
  product_id: string;
  product_name: string;
  product_index: string;
  product_category: string;
  total_quantity: number;
  total_value: number;
  order_count: number;
  avg_quantity_per_order: number;
  stores: string[];
  users: string[];
}

type SortField = 'name' | 'category' | 'quantity' | 'value' | 'orders';
type SortDirection = 'asc' | 'desc';

export default function TopProductsPanel() {
  const [products, setProducts] = useState<ProductStats[]>([]);
  const [loading, setLoading] = useState(true);
  const [timeFilter, setTimeFilter] = useState<'week' | 'month' | 'quarter' | 'year' | 'all'>('month');
  const [storeFilter, setStoreFilter] = useState<string>('all');
  const [userFilter, setUserFilter] = useState<string>('all');
  const [stores, setStores] = useState<Array<{ id: string; name: string }>>([]);
  const [users, setUsers] = useState<Array<{ id: string; name: string }>>([]);
  const [limit, setLimit] = useState(20);
  const [sortField, setSortField] = useState<SortField>('quantity');
  const [sortDirection, setSortDirection] = useState<SortDirection>('desc');

  useEffect(() => {
    loadFilters();
  }, []);

  useEffect(() => {
    loadProductStats();
  }, [timeFilter, storeFilter, userFilter, limit]);

  useEffect(() => {
    applySorting();
  }, [sortField, sortDirection]);

  const loadFilters = async () => {
    const { data: storesData } = await supabase
      .from('stores')
      .select('id, name')
      .order('name');

    const { data: usersData } = await supabase
      .from('users')
      .select('id, full_name')
      .eq('active', true)
      .order('full_name');

    if (storesData) setStores(storesData);
    if (usersData) setUsers(usersData.map(u => ({ id: u.id, name: u.full_name })));
  };

  const loadProductStats = async () => {
    setLoading(true);
    try {
      const cutoffDate = getDateCutoff(timeFilter);

      let ordersQuery = supabase
        .from('orders')
        .select(`
          id,
          created_by,
          store_id,
          users!orders_created_by_fkey (
            full_name,
            store_id
          )
        `)
        .in('status', ['sent', 'confirmed', 'partially_confirmed'])
        .gte('created_at', cutoffDate);

      if (storeFilter !== 'all') {
        ordersQuery = ordersQuery.eq('store_id', storeFilter);
      }

      if (userFilter !== 'all') {
        ordersQuery = ordersQuery.eq('created_by', userFilter);
      }

      const { data: orders, error: ordersError } = await ordersQuery;

      if (ordersError) {
        console.error('[TopProducts] Orders query error:', ordersError);
        throw ordersError;
      }

      if (!orders || orders.length === 0) {
        console.log('[TopProducts] No orders found for filters');
        setProducts([]);
        return;
      }

      console.log('[TopProducts] Found', orders.length, 'orders');

      const orderIds = orders.map(o => o.id);

      const { data: orderItems, error: itemsError } = await supabase
        .from('order_items')
        .select(`
          order_id,
          product_id,
          quantity,
          unit_price,
          products (name, index, display_category)
        `)
        .in('order_id', orderIds);

      if (itemsError) {
        console.error('[TopProducts] Order items query error:', itemsError);
        throw itemsError;
      }

      console.log('[TopProducts] Found', orderItems?.length || 0, 'order items');

      const productMap = new Map<string, {
        product_id: string;
        product_name: string;
        product_index: string;
        product_category: string;
        total_quantity: number;
        total_value: number;
        order_ids: Set<string>;
        store_ids: Set<string>;
        user_ids: Set<string>;
      }>();

      orderItems?.forEach(item => {
        const order = orders.find(o => o.id === item.order_id);
        if (!order) return;

        const existing = productMap.get(item.product_id) || {
          product_id: item.product_id,
          product_name: (item.products as any)?.name || 'Unknown',
          product_index: (item.products as any)?.index || '',
          product_category: (item.products as any)?.display_category || 'Inne',
          total_quantity: 0,
          total_value: 0,
          order_ids: new Set<string>(),
          store_ids: new Set<string>(),
          user_ids: new Set<string>(),
        };

        existing.total_quantity += item.quantity;
        existing.total_value += item.quantity * item.unit_price;
        existing.order_ids.add(item.order_id);
        if (order.store_id) {
          existing.store_ids.add(order.store_id);
        }
        existing.user_ids.add(order.created_by);

        productMap.set(item.product_id, existing);
      });

      const storeNamesMap = new Map<string, string>();
      const { data: allStores } = await supabase
        .from('stores')
        .select('id, name');
      allStores?.forEach(s => storeNamesMap.set(s.id, s.name));

      const userNamesMap = new Map<string, string>();
      const { data: allUsers } = await supabase
        .from('users')
        .select('id, full_name');
      allUsers?.forEach(u => userNamesMap.set(u.id, u.full_name));

      const statsArray: ProductStats[] = Array.from(productMap.values())
        .map(item => ({
          product_id: item.product_id,
          product_name: item.product_name,
          product_index: item.product_index,
          product_category: item.product_category,
          total_quantity: item.total_quantity,
          total_value: item.total_value,
          order_count: item.order_ids.size,
          avg_quantity_per_order: item.total_quantity / item.order_ids.size,
          stores: Array.from(item.store_ids)
            .map(id => storeNamesMap.get(id) || 'Unknown')
            .filter((v, i, a) => a.indexOf(v) === i),
          users: Array.from(item.user_ids)
            .map(id => userNamesMap.get(id) || 'Unknown')
            .filter((v, i, a) => a.indexOf(v) === i),
        }))
        .slice(0, limit);

      setProducts(statsArray);
      applySorting(statsArray);
    } catch (error) {
      console.error('Error loading product stats:', error);
      setProducts([]);
    } finally {
      setLoading(false);
    }
  };

  const applySorting = (dataToSort?: ProductStats[]) => {
    const data = dataToSort || [...products];

    const sorted = data.sort((a, b) => {
      let comparison = 0;

      switch (sortField) {
        case 'name':
          comparison = a.product_name.localeCompare(b.product_name, 'pl');
          break;
        case 'category':
          comparison = (a.product_category || '').localeCompare(b.product_category || '', 'pl');
          break;
        case 'quantity':
          comparison = a.total_quantity - b.total_quantity;
          break;
        case 'value':
          comparison = a.total_value - b.total_value;
          break;
        case 'orders':
          comparison = a.order_count - b.order_count;
          break;
      }

      return sortDirection === 'asc' ? comparison : -comparison;
    });

    if (!dataToSort) {
      setProducts(sorted);
    }
  };

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection(field === 'name' || field === 'category' ? 'asc' : 'desc');
    }
  };

  const getDateCutoff = (period: string): string => {
    const date = new Date();
    switch (period) {
      case 'week':
        date.setDate(date.getDate() - 7);
        break;
      case 'month':
        date.setMonth(date.getMonth() - 1);
        break;
      case 'quarter':
        date.setMonth(date.getMonth() - 3);
        break;
      case 'year':
        date.setFullYear(date.getFullYear() - 1);
        break;
      case 'all':
        date.setFullYear(2000);
        break;
    }
    return date.toISOString();
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pl-PL', {
      style: 'currency',
      currency: 'PLN',
    }).format(value);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  const getSortLabel = (field: SortField) => {
    switch (field) {
      case 'name': return 'Nazwa';
      case 'category': return 'Kategoria';
      case 'quantity': return 'Ilość';
      case 'value': return 'Wartość';
      case 'orders': return 'Liczba zamówień';
    }
  };

  return (
    <div className="space-y-6 p-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-gray-800 dark:text-white">Najczęściej zamawiane produkty</h2>
      </div>

      <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-3 border border-blue-200 dark:border-blue-800">
        <div className="flex items-center gap-2 text-sm text-blue-900 dark:text-blue-200">
          <ArrowUpDown className="w-4 h-4" />
          <span className="font-medium">Sortowanie:</span>
          <span className="font-semibold">{getSortLabel(sortField)}</span>
          <span>({sortDirection === 'asc' ? 'Rosnąco ↑' : 'Malejąco ↓'})</span>
        </div>
      </div>

      <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-4">
        <div className="flex items-center gap-2 mb-4">
          <Filter className="w-5 h-5 text-gray-500" />
          <h3 className="font-semibold text-gray-800 dark:text-white">Filtry</h3>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Okres
            </label>
            <select
              value={timeFilter}
              onChange={(e) => setTimeFilter(e.target.value as any)}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
            >
              <option value="week">Ostatni tydzień</option>
              <option value="month">Ostatni miesiąc</option>
              <option value="quarter">Ostatni kwartał</option>
              <option value="year">Ostatni rok</option>
              <option value="all">Cały czas</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Sklep
            </label>
            <select
              value={storeFilter}
              onChange={(e) => setStoreFilter(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
            >
              <option value="all">Wszystkie</option>
              {stores.map(store => (
                <option key={store.id} value={store.id}>{store.name}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Użytkownik
            </label>
            <select
              value={userFilter}
              onChange={(e) => setUserFilter(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
            >
              <option value="all">Wszyscy</option>
              {users.map(user => (
                <option key={user.id} value={user.id}>{user.name}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Limit
            </label>
            <select
              value={limit}
              onChange={(e) => setLimit(Number(e.target.value))}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
            >
              <option value="10">Top 10</option>
              <option value="20">Top 20</option>
              <option value="50">Top 50</option>
              <option value="100">Top 100</option>
            </select>
          </div>
        </div>
      </div>

      {products.length === 0 ? (
        <div className="text-center py-12 text-gray-500 dark:text-gray-400 bg-white dark:bg-gray-800 rounded-lg shadow">
          Brak danych dla wybranych kryteriów
        </div>
      ) : (
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 dark:bg-gray-900">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">#</th>
                  <th
                    className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-800"
                    onClick={() => handleSort('name')}
                  >
                    <div className="flex items-center gap-2">
                      Produkt
                      <ArrowUpDown className="w-3 h-3" />
                      {sortField === 'name' && (
                        <span className="text-blue-500">{sortDirection === 'asc' ? '↑' : '↓'}</span>
                      )}
                    </div>
                  </th>
                  <th
                    className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-800"
                    onClick={() => handleSort('category')}
                  >
                    <div className="flex items-center gap-2">
                      Kategoria
                      <ArrowUpDown className="w-3 h-3" />
                      {sortField === 'category' && (
                        <span className="text-blue-500">{sortDirection === 'asc' ? '↑' : '↓'}</span>
                      )}
                    </div>
                  </th>
                  <th
                    className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-800"
                    onClick={() => handleSort('quantity')}
                  >
                    <div className="flex items-center gap-2">
                      Całkowita ilość
                      <ArrowUpDown className="w-3 h-3" />
                      {sortField === 'quantity' && (
                        <span className="text-blue-500">{sortDirection === 'asc' ? '↑' : '↓'}</span>
                      )}
                    </div>
                  </th>
                  <th
                    className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-800"
                    onClick={() => handleSort('value')}
                  >
                    <div className="flex items-center gap-2">
                      Wartość
                      <ArrowUpDown className="w-3 h-3" />
                      {sortField === 'value' && (
                        <span className="text-blue-500">{sortDirection === 'asc' ? '↑' : '↓'}</span>
                      )}
                    </div>
                  </th>
                  <th
                    className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-800"
                    onClick={() => handleSort('orders')}
                  >
                    <div className="flex items-center gap-2">
                      Zamówienia
                      <ArrowUpDown className="w-3 h-3" />
                      {sortField === 'orders' && (
                        <span className="text-blue-500">{sortDirection === 'asc' ? '↑' : '↓'}</span>
                      )}
                    </div>
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Śr. ilość</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Sklepy</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                {products.map((product, index) => (
                  <tr key={product.product_id} className="hover:bg-gray-50 dark:hover:bg-gray-700">
                    <td className="px-6 py-4 text-sm">
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-gray-900 dark:text-white">{index + 1}</span>
                        {index === 0 && <TrendingUp className="w-4 h-4 text-green-500" />}
                      </div>
                    </td>
                    <td className="px-6 py-4 text-sm">
                      <div>
                        <div className="font-medium text-gray-900 dark:text-white">{product.product_name}</div>
                        <div className="text-xs text-gray-600 dark:text-gray-400">#{product.product_index}</div>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-sm">
                      <span className="px-2 py-1 bg-orange-100 dark:bg-orange-900 text-orange-800 dark:text-orange-200 rounded-full text-xs">
                        {product.product_category || 'Inne'}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-sm">
                      <div className="flex items-center gap-2 text-gray-900 dark:text-white">
                        <Package className="w-4 h-4 text-blue-500" />
                        <span className="font-semibold">{product.total_quantity.toFixed(2)} kg</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-sm">
                      <div className="flex items-center gap-2 text-gray-900 dark:text-white">
                        <DollarSign className="w-4 h-4 text-green-500" />
                        <span className="font-semibold">{formatCurrency(product.total_value)}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-sm">
                      <div className="flex items-center gap-2 text-gray-900 dark:text-white">
                        <ShoppingCart className="w-4 h-4 text-red-500" />
                        <span>{product.order_count}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-600 dark:text-gray-400">
                      {product.avg_quantity_per_order.toFixed(2)} kg
                    </td>
                    <td className="px-6 py-4 text-sm">
                      <div className="flex flex-wrap gap-1">
                        {product.stores.slice(0, 3).map((store, i) => (
                          <span
                            key={i}
                            className="px-2 py-1 bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200 rounded-full text-xs"
                          >
                            {store}
                          </span>
                        ))}
                        {product.stores.length > 3 && (
                          <span className="px-2 py-1 bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-200 rounded-full text-xs">
                            +{product.stores.length - 3}
                          </span>
                        )}
                      </div>
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
}
