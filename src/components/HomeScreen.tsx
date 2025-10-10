import { useState, useEffect } from 'react';
import { TrendingUp, Package, Clock, CheckCircle } from 'lucide-react';
import { supabase } from '../lib/supabase';

interface Stats {
  todayOrders: number;
  pendingOrders: number;
  confirmedOrders: number;
  totalValue: number;
}

interface RecentOrder {
  id: string;
  order_number: string;
  status: string;
  total_amount: number;
  created_at: string;
  confirmed_at: string | null;
}

interface HomeScreenProps {
  onNavigate?: (tab: 'new-order' | 'orders') => void;
}

export default function HomeScreen({ onNavigate }: HomeScreenProps) {
  const [stats, setStats] = useState<Stats>({
    todayOrders: 0,
    pendingOrders: 0,
    confirmedOrders: 0,
    totalValue: 0,
  });
  const [recentConfirmed, setRecentConfirmed] = useState<RecentOrder[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadStats();
    loadRecentConfirmed();
  }, []);

  const loadStats = async () => {
    setLoading(true);
    try {
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const todayISO = today.toISOString();

      const { data: allOrders, error: ordersError } = await supabase
        .from('orders')
        .select('*')
        .gte('created_at', todayISO);

      if (ordersError) throw ordersError;

      const todayOrders = allOrders?.length || 0;
      const pendingOrders = allOrders?.filter(o =>
        o.status === 'sent' ||
        o.status === 'pending_confirmation'
      ).length || 0;
      const confirmedOrders = allOrders?.filter(o =>
        o.status === 'confirmed' ||
        o.status === 'partially_confirmed'
      ).length || 0;
      const totalValue = allOrders?.reduce((sum, o) =>
        sum + Number(o.total_amount || 0), 0
      ) || 0;

      setStats({
        todayOrders,
        pendingOrders,
        confirmedOrders,
        totalValue,
      });
    } catch (error) {
      console.error('Error loading stats:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadRecentConfirmed = async () => {
    try {
      const { data, error } = await supabase
        .from('orders')
        .select('id, order_number, status, total_amount, created_at, confirmed_at')
        .in('status', ['confirmed', 'partially_confirmed'])
        .order('confirmed_at', { ascending: false })
        .limit(5);

      if (error) throw error;
      setRecentConfirmed(data || []);
    } catch (error) {
      console.error('Error loading recent confirmed orders:', error);
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return new Intl.DateTimeFormat('pl-PL', {
      day: '2-digit',
      month: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
    }).format(date);
  };

  return (
    <div className="min-h-screen bg-gray-50 pb-20">
      <div className="bg-gradient-to-r from-amber-500 to-orange-600 text-white p-6">
        <div className="flex items-center gap-3 mb-2">
          <span className="text-4xl">🐃</span>
          <h2 className="text-2xl font-bold">RODEO</h2>
        </div>
        <p className="text-white font-semibold">Weź byka za rogi</p>
        <p className="text-amber-100 mt-1 text-sm">System zamówień mięsno-wędliniarskich</p>
      </div>

      <div className="p-6 space-y-6">
        <div className="bg-white rounded-xl shadow-lg p-6">
          <h3 className="font-semibold text-lg mb-4">Szybkie akcje</h3>
          <div className="space-y-3">
            <button
              onClick={() => onNavigate?.('new-order')}
              className="w-full p-4 bg-gradient-to-r from-amber-500 to-orange-600 text-white rounded-lg font-medium hover:from-amber-600 hover:to-orange-700 transition shadow cursor-pointer"
            >
              Nowe zamówienie głosowe
            </button>
            <button
              onClick={() => onNavigate?.('orders')}
              className="w-full p-4 bg-white border-2 border-gray-200 text-gray-700 rounded-lg font-medium hover:bg-gray-50 transition cursor-pointer"
            >
              Zobacz wszystkie zamówienia
            </button>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="bg-white rounded-xl shadow-lg p-6">
            <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center mb-3">
              <Package className="w-6 h-6 text-blue-600" />
            </div>
            <p className="text-2xl font-bold text-gray-800">
              {loading ? '...' : stats.todayOrders}
            </p>
            <p className="text-sm text-gray-600">Zamówienia dzisiaj</p>
          </div>

          <div className="bg-white rounded-xl shadow-lg p-6">
            <div className="w-12 h-12 bg-yellow-100 rounded-xl flex items-center justify-center mb-3">
              <Clock className="w-6 h-6 text-yellow-600" />
            </div>
            <p className="text-2xl font-bold text-gray-800">
              {loading ? '...' : stats.pendingOrders}
            </p>
            <p className="text-sm text-gray-600">Oczekujące</p>
          </div>

          <div className="bg-white rounded-xl shadow-lg p-6">
            <div className="w-12 h-12 bg-green-100 rounded-xl flex items-center justify-center mb-3">
              <CheckCircle className="w-6 h-6 text-green-600" />
            </div>
            <p className="text-2xl font-bold text-gray-800">
              {loading ? '...' : stats.confirmedOrders}
            </p>
            <p className="text-sm text-gray-600">Potwierdzone</p>
          </div>

          <div className="bg-white rounded-xl shadow-lg p-6">
            <div className="w-12 h-12 bg-amber-100 rounded-xl flex items-center justify-center mb-3">
              <TrendingUp className="w-6 h-6 text-amber-600" />
            </div>
            <p className="text-2xl font-bold text-gray-800">
              {loading ? '...' : `${stats.totalValue.toFixed(2)} PLN`}
            </p>
            <p className="text-sm text-gray-600">Wartość</p>
          </div>
        </div>

        {recentConfirmed.length > 0 && (
          <div className="bg-white rounded-xl shadow-lg p-6">
            <h3 className="font-semibold text-lg mb-4 flex items-center gap-2">
              <CheckCircle className="w-5 h-5 text-green-600" />
              Ostatnio potwierdzone
            </h3>
            <div className="space-y-2">
              {recentConfirmed.map((order) => (
                <div
                  key={order.id}
                  className="p-3 bg-green-50 border border-green-200 rounded-lg hover:bg-green-100 transition"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <p className="font-semibold text-gray-800 text-sm">{order.order_number}</p>
                      <p className="text-xs text-gray-600">
                        {order.confirmed_at ? formatDate(order.confirmed_at) : formatDate(order.created_at)}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="font-bold text-green-700">{Number(order.total_amount).toFixed(2)} PLN</p>
                      <p className="text-xs text-green-600">
                        {order.status === 'confirmed' ? '✓ Potwierdzone' : '~ Częściowo'}
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        <div className="bg-blue-50 border border-blue-200 rounded-xl p-6">
          <h3 className="font-semibold text-blue-900 mb-2">Jak korzystać z aplikacji?</h3>
          <ul className="space-y-2 text-sm text-blue-800">
            <li>1. Kliknij &quot;Nowe&quot; w menu dolnym</li>
            <li>2. Naciśnij przycisk mikrofonu</li>
            <li>3. Dyktuj zamówienie głosowo</li>
            <li>4. Sprawdź i wyślij zamówienie</li>
          </ul>
        </div>
      </div>
    </div>
  );
}
