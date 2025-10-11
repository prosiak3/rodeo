import { useState, useEffect } from 'react';
import { Package, Clock, CheckCircle, XCircle, AlertCircle, ChevronRight, PlayCircle, FileText, Send, Trash2, Edit3, ArrowUpDown } from 'lucide-react';
import { supabase, Order, OrderStatus } from '../lib/supabase';

interface OrdersListProps {
  storeId?: string;
  userRole: string;
  onSelectOrder: (orderId: string) => void;
  showLimitedFilters?: boolean;
}

const statusConfig: Record<OrderStatus, { label: string; color: string; icon: any; bgColor: string; hoverColor: string }> = {
  draft: { label: 'Szkic', color: 'text-amber-700', icon: Edit3, bgColor: 'bg-amber-100', hoverColor: 'hover:text-amber-700 hover:bg-amber-200' },
  sent: { label: 'Wysłane', color: 'text-blue-700', icon: Send, bgColor: 'bg-blue-100', hoverColor: 'hover:text-blue-700 hover:bg-blue-200' },
  in_progress: { label: 'W realizacji', color: 'text-purple-700', icon: PlayCircle, bgColor: 'bg-purple-100', hoverColor: 'hover:text-purple-700 hover:bg-purple-200' },
  pending_confirmation: { label: 'Oczekuje', color: 'text-yellow-700', icon: AlertCircle, bgColor: 'bg-yellow-100', hoverColor: 'hover:text-yellow-700 hover:bg-yellow-200' },
  confirmed: { label: 'Potwierdzone', color: 'text-green-700', icon: CheckCircle, bgColor: 'bg-green-100', hoverColor: 'hover:text-green-700 hover:bg-green-200' },
  partially_confirmed: { label: 'Częściowo', color: 'text-orange-700', icon: AlertCircle, bgColor: 'bg-orange-100', hoverColor: 'hover:text-orange-700 hover:bg-orange-200' },
  rejected: { label: 'Odrzucone', color: 'text-red-700', icon: XCircle, bgColor: 'bg-red-100', hoverColor: 'hover:text-red-700 hover:bg-red-200' },
  archived: { label: 'Archiwum', color: 'text-gray-700', icon: Package, bgColor: 'bg-gray-100', hoverColor: 'hover:text-gray-700 hover:bg-gray-200' },
};

export default function OrdersList({ storeId, userRole, onSelectOrder, showLimitedFilters = false }: OrdersListProps) {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<OrderStatus | 'all'>(showLimitedFilters ? 'draft' : 'all');
  const [sortAscending, setSortAscending] = useState(false);

  useEffect(() => {
    loadOrders();
  }, [storeId, filter, sortAscending]);

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
          )
        `)
        .order('created_at', { ascending: sortAscending });

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

  const deleteOrder = async (orderId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!confirm('Czy na pewno chcesz usunąć to zamówienie?')) return;

    try {
      const { error } = await supabase
        .from('orders')
        .delete()
        .eq('id', orderId);

      if (error) throw error;
      loadOrders();
    } catch (error) {
      console.error('Error deleting order:', error);
      alert('Błąd podczas usuwania zamówienia');
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
      <div className="flex items-center justify-between gap-3">
        <div className={showLimitedFilters ? "flex gap-3 flex-1" : "flex gap-2 overflow-x-auto pb-2 flex-1"}>
          {showLimitedFilters ? (
            <>
              {(['draft', 'sent'] as const).map((status) => {
                const config = statusConfig[status];
                const Icon = config.icon;
                return (
                  <button
                    key={status}
                    onClick={() => setFilter(status)}
                    className={`flex-1 px-4 py-3 rounded-lg font-medium transition-all duration-200 flex items-center justify-center gap-2 ${
                      filter === status
                        ? `${config.bgColor} ${config.color} ring-2 ring-offset-1 ${config.bgColor.replace('bg-', 'ring-')}`
                        : `bg-white text-gray-600 border border-gray-300 ${config.hoverColor}`
                    }`}
                  >
                    <Icon className="w-5 h-5" />
                    <span>{config.label}</span>
                  </button>
                );
              })}
            </>
          ) : (
            <>
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
                    className={`p-2 rounded-lg transition-all duration-200 flex items-center justify-center ${
                      filter === status
                        ? `${config.bgColor} ${config.color} ring-2 ring-offset-1 ${config.bgColor.replace('bg-', 'ring-')}`
                        : `bg-white text-gray-600 border border-gray-300 ${config.hoverColor}`
                    }`}
                    title={config.label}
                  >
                    <Icon className="w-5 h-5" />
                  </button>
                );
              })}
            </>
          )}
        </div>
        <button
          onClick={() => setSortAscending(!sortAscending)}
          className="px-4 py-3 rounded-lg bg-white border border-gray-300 hover:bg-gray-50 transition flex items-center gap-2 whitespace-nowrap"
          title={sortAscending ? "Od najstarszych" : "Od najnowszych"}
        >
          <ArrowUpDown className="w-5 h-5" />
          <span className="hidden sm:inline">{sortAscending ? "Najstarsze" : "Najnowsze"}</span>
        </button>
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
                    {order.sent_at && (
                      <p className="text-sm text-gray-600">Wysłano: {formatDate(order.sent_at)}</p>
                    )}
                    {order.total_amount > 0 && (
                      <p className="text-lg font-semibold text-gray-800 mt-2">
                        {order.total_amount.toFixed(2)} PLN
                      </p>
                    )}
                  </div>
                  <div className="flex items-center gap-2">
                    {order.status === 'draft' && (userRole === 'store_manager' || userRole === 'salesperson') && (
                      <button
                        onClick={(e) => deleteOrder(order.id, e)}
                        className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition"
                        title="Usuń zamówienie"
                      >
                        <Trash2 className="w-5 h-5" />
                      </button>
                    )}
                    <ChevronRight className="w-6 h-6 text-gray-400" />
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
