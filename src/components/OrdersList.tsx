import { useState, useEffect } from 'react';
import { Package, Clock, CheckCircle, XCircle, AlertCircle, ChevronRight } from 'lucide-react';
import { supabase, Order, OrderStatus } from '../lib/supabase';

interface OrdersListProps {
  storeId?: string;
  userRole: string;
  onSelectOrder: (orderId: string) => void;
}

const statusConfig: Record<OrderStatus, { label: string; color: string; icon: any }> = {
  draft: { label: 'Szkic', color: 'gray', icon: Clock },
  sent: { label: 'Wysłane', color: 'blue', icon: Package },
  pending_confirmation: { label: 'Oczekuje', color: 'yellow', icon: AlertCircle },
  confirmed: { label: 'Potwierdzone', color: 'green', icon: CheckCircle },
  partially_confirmed: { label: 'Częściowo potwierdzone', color: 'orange', icon: AlertCircle },
  rejected: { label: 'Odrzucone', color: 'red', icon: XCircle },
  archived: { label: 'Archiwum', color: 'gray', icon: Package },
};

export default function OrdersList({ storeId, userRole, onSelectOrder }: OrdersListProps) {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<OrderStatus | 'all'>('all');

  useEffect(() => {
    loadOrders();
  }, [storeId, filter]);

  const loadOrders = async () => {
    setLoading(true);
    try {
      let query = supabase
        .from('orders')
        .select(`
          *,
          creator:created_by (
            full_name,
            email,
            role
          ),
          store:store_id (
            name,
            code
          )
        `)
        .order('created_at', { ascending: false });

      if (storeId && userRole === 'store_manager') {
        query = query.eq('store_id', storeId);
      }

      if (filter !== 'all') {
        query = query.eq('status', filter);
      }

      const { data, error } = await query;

      if (error) throw error;
      setOrders(data || []);
    } catch (error) {
      console.error('Error loading orders:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return new Intl.DateTimeFormat('pl-PL', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    }).format(date);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-amber-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex gap-2 overflow-x-auto pb-2">
        <button
          onClick={() => setFilter('all')}
          className={`px-4 py-2 rounded-lg font-medium whitespace-nowrap transition ${
            filter === 'all'
              ? 'bg-amber-600 text-white'
              : 'bg-white text-gray-700 border border-gray-300'
          }`}
        >
          Wszystkie
        </button>
        {Object.entries(statusConfig).map(([status, config]) => (
          <button
            key={status}
            onClick={() => setFilter(status as OrderStatus)}
            className={`px-4 py-2 rounded-lg font-medium whitespace-nowrap transition ${
              filter === status
                ? 'bg-amber-600 text-white'
                : 'bg-white text-gray-700 border border-gray-300'
            }`}
          >
            {config.label}
          </button>
        ))}
      </div>

      {orders.length === 0 ? (
        <div className="bg-white rounded-xl shadow p-12 text-center">
          <Package className="w-16 h-16 text-gray-300 mx-auto mb-4" />
          <p className="text-gray-500 text-lg">Brak zamówień</p>
        </div>
      ) : (
        <div className="space-y-3">
          {orders.map((order) => {
            const config = statusConfig[order.status];
            const Icon = config.icon;

            return (
              <div
                key={order.id}
                onClick={() => onSelectOrder(order.id)}
                className="bg-white rounded-xl shadow-lg p-5 hover:shadow-xl transition cursor-pointer"
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <span className="font-bold text-lg text-gray-800">{order.order_number}</span>
                      <span
                        className={`px-3 py-1 rounded-full text-xs font-medium flex items-center gap-1 bg-${config.color}-100 text-${config.color}-700`}
                      >
                        <Icon className="w-3 h-3" />
                        {config.label}
                      </span>
                    </div>
                    <p className="text-sm text-gray-600 mb-1">
                      Utworzono: {formatDate(order.created_at)}
                    </p>
                    {order.creator && (
                      <p className="text-sm text-blue-600 mb-1">
                        👤 {order.creator.full_name}
                      </p>
                    )}
                    {order.store && (
                      <p className="text-sm text-gray-600 mb-1">
                        🏪 {order.store.name}
                      </p>
                    )}
                    {order.sent_at && (
                      <p className="text-sm text-gray-600">Wysłano: {formatDate(order.sent_at)}</p>
                    )}
                    {order.total_amount > 0 && (
                      <p className="text-lg font-semibold text-gray-800 mt-2">
                        {order.total_amount.toFixed(2)} PLN
                      </p>
                    )}
                  </div>
                  <ChevronRight className="w-6 h-6 text-gray-400" />
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
