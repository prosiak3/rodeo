import { useState, useEffect } from 'react';
import { Package, Clock, CheckCircle, XCircle, AlertCircle, ChevronRight, PlayCircle, FileText, Send } from 'lucide-react';
import { supabase, Order, OrderStatus } from '../lib/supabase';

interface OrdersListProps {
  storeId?: string;
  userRole: string;
  onSelectOrder: (orderId: string) => void;
}

const statusConfig: Record<OrderStatus, { label: string; color: string; icon: any; bgColor: string }> = {
  draft: { label: 'Szkic', color: 'text-gray-700', icon: FileText, bgColor: 'bg-gray-100' },
  sent: { label: 'Wysłane', color: 'text-blue-700', icon: Send, bgColor: 'bg-blue-100' },
  in_progress: { label: 'W realizacji', color: 'text-purple-700', icon: PlayCircle, bgColor: 'bg-purple-100' },
  pending_confirmation: { label: 'Oczekuje', color: 'text-yellow-700', icon: AlertCircle, bgColor: 'bg-yellow-100' },
  confirmed: { label: 'Potwierdzone', color: 'text-green-700', icon: CheckCircle, bgColor: 'bg-green-100' },
  partially_confirmed: { label: 'Częściowo', color: 'text-orange-700', icon: AlertCircle, bgColor: 'bg-orange-100' },
  rejected: { label: 'Odrzucone', color: 'text-red-700', icon: XCircle, bgColor: 'bg-red-100' },
  archived: { label: 'Archiwum', color: 'text-gray-700', icon: Package, bgColor: 'bg-gray-100' },
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
            code,
            address,
            phone
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
          className={`px-3 py-2 rounded-lg font-medium whitespace-nowrap transition ${
            filter === 'all'
              ? 'bg-amber-600 text-white'
              : 'bg-white text-gray-700 border border-gray-300'
          }`}
          title="Wszystkie"
        >
          Wszystkie
        </button>
        {Object.entries(statusConfig).map(([status, config]) => {
          const Icon = config.icon;
          return (
            <button
              key={status}
              onClick={() => setFilter(status as OrderStatus)}
              className={`p-2 rounded-lg transition flex items-center justify-center ${
                filter === status
                  ? 'bg-amber-600 text-white'
                  : 'bg-white text-gray-700 border border-gray-300 hover:bg-gray-50'
              }`}
              title={config.label}
            >
              <Icon className="w-5 h-5" />
            </button>
          );
        })}
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
                      <div
                        className={`p-2 rounded-full ${config.bgColor} ${config.color} relative group cursor-help`}
                        title={config.label}
                      >
                        <Icon className="w-4 h-4" />
                        <span className="absolute left-1/2 -translate-x-1/2 bottom-full mb-2 px-2 py-1 bg-gray-900 text-white text-xs rounded whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
                          {config.label}
                        </span>
                      </div>
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
                      <div className="text-sm text-gray-600 mb-1 space-y-1">
                        <p className="font-medium">🏪 {order.store.name}</p>
                        {(order.store as any).address && (
                          <p className="text-xs pl-5">📍 {(order.store as any).address}</p>
                        )}
                        {(order.store as any).phone && (
                          <a
                            href={`tel:${(order.store as any).phone}`}
                            className="text-xs pl-5 text-blue-600 hover:text-blue-800 hover:underline flex items-center gap-1 w-fit"
                            onClick={(e) => e.stopPropagation()}
                          >
                            📞 {(order.store as any).phone}
                          </a>
                        )}
                      </div>
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
