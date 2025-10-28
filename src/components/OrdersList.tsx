import { useState, useEffect } from 'react';
import { Package, Clock, CheckCircle, XCircle, AlertCircle, ChevronRight, PlayCircle, FileText, Send, Trash2, Edit3, ArrowUpDown, CheckSquare, Square } from 'lucide-react';
import { supabase, Order, OrderStatus } from '../lib/supabase';
import { useConfirm } from '../hooks/useConfirm';
import BulkActionBar, { useBulkSelection } from './BulkActionBar';

interface OrdersListProps {
  storeId?: string;
  userRole: string;
  onSelectOrder: (orderId: string) => void;
  showLimitedFilters?: boolean;
  initialFilter?: OrderStatus | 'all';
}

const statusConfig: Record<OrderStatus, { label: string; color: string; icon: any; bgColor: string; hoverColor: string }> = {
  draft: { label: 'Koszyk', color: 'text-amber-700', icon: Edit3, bgColor: 'bg-amber-100', hoverColor: 'hover:text-amber-700 hover:bg-amber-200' },
  notatnik: { label: 'Notatnik', color: 'text-teal-700', icon: FileText, bgColor: 'bg-teal-100', hoverColor: 'hover:text-teal-700 hover:bg-teal-200' },
  sent: { label: 'Wysłane', color: 'text-blue-700', icon: Send, bgColor: 'bg-blue-100', hoverColor: 'hover:text-blue-700 hover:bg-blue-200' },
  in_progress: { label: 'W realizacji', color: 'text-violet-700', icon: PlayCircle, bgColor: 'bg-violet-100', hoverColor: 'hover:text-violet-700 hover:bg-violet-200' },
  pending_confirmation: { label: 'Oczekuje', color: 'text-yellow-700', icon: AlertCircle, bgColor: 'bg-yellow-100', hoverColor: 'hover:text-yellow-700 hover:bg-yellow-200' },
  confirmed: { label: 'Potwierdzone', color: 'text-green-700', icon: CheckCircle, bgColor: 'bg-green-100', hoverColor: 'hover:text-green-700 hover:bg-green-200' },
  partially_confirmed: { label: 'Częściowo', color: 'text-orange-700', icon: AlertCircle, bgColor: 'bg-orange-100', hoverColor: 'hover:text-orange-700 hover:bg-orange-200' },
  rejected: { label: 'Odrzucone', color: 'text-red-700', icon: XCircle, bgColor: 'bg-red-100', hoverColor: 'hover:text-red-700 hover:bg-red-200' },
  archived: { label: 'Archiwum', color: 'text-gray-700', icon: Package, bgColor: 'bg-gray-100', hoverColor: 'hover:text-gray-700 hover:bg-gray-200' },
};

export default function OrdersList({ storeId, userRole, onSelectOrder, showLimitedFilters = false, initialFilter }: OrdersListProps) {
  const { confirm, ConfirmComponent } = useConfirm();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<OrderStatus | 'all'>(
    initialFilter || (showLimitedFilters ? 'notatnik' : (userRole === 'admin' || userRole === 'warehouse' ? 'all' : 'draft'))
  );
  const [sortAscending, setSortAscending] = useState(false);
  const [initialFilterSet, setInitialFilterSet] = useState(false);
  const [showDeleteIcons, setShowDeleteIcons] = useState(false);

  // Bulk selection
  const {
    selectedIds,
    selectedCount,
    isSelected,
    toggleSelect,
    toggleSelectAll,
    clearSelection,
    isAllSelected,
    isSomeSelected,
  } = useBulkSelection(orders);

  useEffect(() => {
    loadUserPreferences();
    if (showLimitedFilters && !initialFilterSet) {
      setDefaultFilter();
    }
  }, [showLimitedFilters, initialFilterSet]);

  const loadUserPreferences = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (user) {
      const { data } = await supabase
        .from('users')
        .select('show_delete_icons')
        .eq('id', user.id)
        .single();

      if (data?.show_delete_icons !== null && data?.show_delete_icons !== undefined) {
        setShowDeleteIcons(data.show_delete_icons);
      }
    }
  };

  useEffect(() => {
    if (initialFilter) {
      setFilter(initialFilter);
    }
  }, [initialFilter]);

  useEffect(() => {
    loadOrders();
  }, [storeId, filter, sortAscending]);

  const setDefaultFilter = async () => {
    try {
      let query = supabase
        .from('orders')
        .select('id', { count: 'exact', head: true })
        .eq('status', 'notatnik');

      if (storeId && userRole === 'store_manager') {
        query = query.eq('store_id', storeId);
      }

      const { count } = await query;

      if (count && count > 0) {
        setFilter('notatnik');
      } else {
        setFilter('draft');
      }
    } catch (error) {
      console.error('Error checking notatnik orders:', error);
      setFilter('draft');
    } finally {
      setInitialFilterSet(true);
    }
  };

  const loadOrders = async () => {
    setLoading(true);
    try {
      if (userRole === 'salesperson') {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) {
          setOrders([]);
          setLoading(false);
          return;
        }

        const { data: assignedStores, error: storesError } = await supabase
          .from('salesperson_stores')
          .select('store_id')
          .eq('salesperson_id', user.id);

        if (storesError) throw storesError;

        const storeIds = (assignedStores || []).map(s => s.store_id);

        if (storeIds.length === 0) {
          setOrders([]);
          setLoading(false);
          return;
        }

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
          .in('store_id', storeIds)
          .order('created_at', { ascending: sortAscending });

        if (filter !== 'all') {
          query = query.eq('status', filter);
        }

        const { data, error } = await query;

        if (error) throw error;
        setOrders(data || []);
      } else {
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
      }
    } catch (error) {
      console.error('Error loading orders:', error);
    } finally {
      setLoading(false);
    }
  };

  const deleteOrder = async (orderId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    const confirmed = await confirm({
      title: 'Usunąć zamówienie?',
      message: 'Ta operacja jest nieodwracalna. Wszystkie dane zamówienia zostaną trwale usunięte.',
      confirmText: 'Usuń',
      cancelText: 'Anuluj',
      variant: 'danger'
    });
    if (!confirmed) return;

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

  // Bulk operations
  const handleBulkDelete = async () => {
    try {
      const { error } = await supabase
        .from('orders')
        .delete()
        .in('id', Array.from(selectedIds));

      if (error) throw error;

      clearSelection();
      loadOrders();
    } catch (error) {
      console.error('Error bulk deleting orders:', error);
      alert('Błąd podczas usuwania zamówień');
    }
  };

  const handleBulkStatusChange = async (newStatus: string) => {
    try {
      const { error } = await supabase
        .from('orders')
        .update({ status: newStatus })
        .in('id', Array.from(selectedIds));

      if (error) throw error;

      clearSelection();
      loadOrders();
    } catch (error) {
      console.error('Error bulk status change:', error);
      alert('Błąd podczas zmiany statusu');
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

  const getDateGroup = (dateString: string): string => {
    const orderDate = new Date(dateString);
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);

    const isToday = orderDate.toDateString() === today.toDateString();
    const isYesterday = orderDate.toDateString() === yesterday.toDateString();

    if (isToday) return 'Dzisiaj';
    if (isYesterday) return 'Wczoraj';

    const startOfWeek = new Date(today);
    startOfWeek.setDate(today.getDate() - today.getDay() + 1);
    startOfWeek.setHours(0, 0, 0, 0);

    const startOfLastWeek = new Date(startOfWeek);
    startOfLastWeek.setDate(startOfLastWeek.getDate() - 7);

    if (orderDate >= startOfWeek) return 'Ten tydzień';
    if (orderDate >= startOfLastWeek) return 'Zeszły tydzień';

    const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);
    if (orderDate >= startOfMonth) return 'Ten miesiąc';

    return 'Starsze';
  };

  const groupOrders = (orders: Order[]) => {
    if (!['sent', 'in_progress', 'pending_confirmation', 'confirmed', 'partially_confirmed'].includes(filter as string) && filter !== 'all') {
      return { ungrouped: orders };
    }

    const grouped: Record<string, Order[]> = {};
    const groupOrder = ['Dzisiaj', 'Wczoraj', 'Ten tydzień', 'Zeszły tydzień', 'Ten miesiąc', 'Starsze'];

    orders.forEach(order => {
      const shouldGroup = ['sent', 'in_progress', 'pending_confirmation', 'confirmed', 'partially_confirmed'].includes(order.status);

      if (shouldGroup) {
        const group = getDateGroup(order.created_at);
        if (!grouped[group]) grouped[group] = [];
        grouped[group].push(order);
      } else {
        if (!grouped['ungrouped']) grouped['ungrouped'] = [];
        grouped['ungrouped'].push(order);
      }
    });

    const sorted: Record<string, Order[]> = {};
    groupOrder.forEach(group => {
      if (grouped[group]) sorted[group] = grouped[group];
    });
    if (grouped['ungrouped']) sorted['ungrouped'] = grouped['ungrouped'];

    return sorted;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-amber-600"></div>
      </div>
    );
  }

  return (
    <>
      <ConfirmComponent />

      {/* Bulk Action Bar */}
      {selectedCount > 0 && (
        <BulkActionBar
          selectedCount={selectedCount}
          onDelete={handleBulkDelete}
          onChangeStatus={handleBulkStatusChange}
          onCancel={clearSelection}
          statusOptions={[
            { value: 'sent', label: 'Wysłane', color: '#1d4ed8' },
            { value: 'confirmed', label: 'Potwierdzone', color: '#15803d' },
            { value: 'rejected', label: 'Odrzucone', color: '#b91c1c' },
            { value: 'archived', label: 'Archiwum', color: '#4b5563' },
          ]}
          deleteLabel="Usuń zaznaczone"
        />
      )}

      <div className="space-y-4">
      <div className="flex items-center justify-between gap-3">
        {/* Select All Checkbox */}
        {orders.length > 0 && (
          <button
            onClick={toggleSelectAll}
            className="p-2 hover:bg-gray-100 rounded-lg transition"
            aria-label={isAllSelected ? 'Odznacz wszystkie' : 'Zaznacz wszystkie'}
          >
            {isAllSelected ? (
              <CheckSquare className="w-5 h-5 text-amber-600" />
            ) : isSomeSelected ? (
              <CheckSquare className="w-5 h-5 text-amber-400" />
            ) : (
              <Square className="w-5 h-5 text-gray-400" />
            )}
          </button>
        )}

        <div className={showLimitedFilters ? "flex gap-3 flex-1" : "flex gap-2 overflow-x-auto pb-2 flex-1"}>
          {showLimitedFilters ? (
            <>
              {(['notatnik', 'draft', 'sent'] as const).map((status) => {
                const config = statusConfig[status];
                const Icon = config.icon;
                return (
                  <button
                    key={status}
                    onClick={() => setFilter(status)}
                    className={`flex-1 px-3 py-2 rounded-lg font-medium transition-all duration-200 flex items-center justify-center gap-2 text-sm ${
                      filter === status
                        ? `${config.bgColor} ${config.color} ring-2 ring-offset-1 ${config.bgColor.replace('bg-', 'ring-')}`
                        : `bg-white text-gray-600 border border-gray-300 ${config.hoverColor}`
                    }`}
                  >
                    <Icon className="w-4 h-4" />
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
          className="w-12 h-12 rounded-lg bg-white border border-gray-300 hover:bg-gray-50 transition flex items-center justify-center"
          title={sortAscending ? "Od najstarszych" : "Od najnowszych"}
        >
          <ArrowUpDown className="w-5 h-5" />
        </button>
      </div>

      {orders.length === 0 ? (
        <div className="bg-white rounded-xl shadow p-12 text-center">
          <Package className="w-16 h-16 text-gray-300 mx-auto mb-4" />
          <p className="text-gray-500 text-lg">Brak zamówień</p>
        </div>
      ) : (
        <div className="space-y-6">
          {Object.entries(groupOrders(orders)).map(([groupName, groupedOrders]) => (
            <div key={groupName}>
              {groupName !== 'ungrouped' && (
                <h3 className="text-lg font-bold text-gray-700 mb-3 px-1">{groupName}</h3>
              )}
              <div className="space-y-3">
                {groupedOrders.map((order) => {
            const config = statusConfig[order.status];
            const Icon = config.icon;

            return (
              <div
                key={order.id}
                className="bg-white rounded-xl shadow-lg p-5 hover:shadow-xl transition cursor-pointer relative"
              >
                {/* Checkbox */}
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    toggleSelect(order.id);
                  }}
                  className="absolute top-3 left-3 p-1 hover:bg-gray-100 rounded z-10"
                  aria-label={isSelected(order.id) ? 'Odznacz' : 'Zaznacz'}
                >
                  {isSelected(order.id) ? (
                    <CheckSquare className="w-5 h-5 text-amber-600" />
                  ) : (
                    <Square className="w-5 h-5 text-gray-400" />
                  )}
                </button>

                <div
                  onClick={() => onSelectOrder(order.id)}
                  className="pl-8"
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
                    {(order.status === 'draft' || order.status === 'notatnik') && (userRole === 'store_manager' || userRole === 'salesperson') && showDeleteIcons && (
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
              </div>
            );
          })}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
    </>
  );
}
