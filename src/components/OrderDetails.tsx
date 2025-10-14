import { useState, useEffect } from 'react';
import { ArrowLeft, CheckCircle, XCircle, Package, Clock, PlayCircle, Edit, Trash2, Copy, FileEdit, Plus, Truck, ChevronDown, ChevronUp } from 'lucide-react';
import { supabase, Order, OrderItem, OrderHistory } from '../lib/supabase';
import { useConfirm } from '../hooks/useConfirm';
import { formatPriceDisplay } from '../lib/priceCalculations';

interface OrderDetailsProps {
  orderId: string;
  userRole: string;
  userId: string;
  onBack: () => void;
  onEdit?: () => void;
  onOrderSent?: () => void;
  onUseAsTemplate?: (orderId: string) => void;
  onAddProducts?: () => void;
}

export default function OrderDetails({ orderId, userRole, userId, onBack, onEdit, onOrderSent, onUseAsTemplate, onAddProducts }: OrderDetailsProps) {
  const { confirm, ConfirmComponent } = useConfirm();
  const [order, setOrder] = useState<Order | null>(null);
  const [items, setItems] = useState<OrderItem[]>([]);
  const [history, setHistory] = useState<OrderHistory[]>([]);
  const [loading, setLoading] = useState(true);
  const [historyExpanded, setHistoryExpanded] = useState(false);
  const [editingItemId, setEditingItemId] = useState<string | null>(null);
  const [editingQuantity, setEditingQuantity] = useState<string>('');

  useEffect(() => {
    loadOrderDetails();
  }, [orderId]);

  const loadOrderDetails = async () => {
    setLoading(true);
    console.log('🔵 OrderDetails - Loading order:', orderId);
    try {
      const { data: orderData, error: orderError } = await supabase
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
            address
          )
        `)
        .eq('id', orderId)
        .single();

      if (orderError) {
        console.error('❌ OrderDetails - order error:', orderError);
        throw orderError;
      }
      console.log('✅ OrderDetails - Order loaded:', orderData);
      setOrder(orderData);

      const { data: itemsData, error: itemsError } = await supabase
        .from('order_items')
        .select(`
          *,
          product:product_id (
            name,
            code,
            image_url,
            description,
            average_weight,
            unit
          )
        `)
        .eq('order_id', orderId);

      if (itemsError) {
        console.error('❌ OrderDetails - items error:', itemsError);
        throw itemsError;
      }
      console.log('✅ OrderDetails - loaded items:', itemsData?.length || 0, 'items');

      const itemsWithProducts = (itemsData || []).map(item => ({
        ...item,
        products: item.product
      }));
      console.log('📦 OrderDetails - Setting items:', itemsWithProducts.length);
      setItems(itemsWithProducts);

      const { data: historyData, error: historyError } = await supabase
        .from('order_history')
        .select(`
          *,
          users:performed_by (
            full_name,
            email,
            role
          )
        `)
        .eq('order_id', orderId)
        .order('created_at', { ascending: false });

      if (historyError) throw historyError;
      setHistory(historyData || []);
    } catch (error) {
      console.error('Error loading order details:', error);
    } finally {
      setLoading(false);
    }
  };

  const confirmOrder = async (fully: boolean) => {
    if (!order) return;

    try {
      const newStatus = fully ? 'confirmed' : 'partially_confirmed';

      const { error: updateError } = await supabase
        .from('orders')
        .update({
          status: newStatus,
          confirmed_at: new Date().toISOString(),
        })
        .eq('id', orderId);

      if (updateError) throw updateError;

      await supabase.from('order_history').insert({
        order_id: orderId,
        action: fully ? 'confirmed' : 'partially_confirmed',
        performed_by: userId,
        details: {},
      });

      alert(fully ? 'Zamówienie potwierdzone!' : 'Zamówienie częściowo potwierdzone');

      if (onOrderSent) {
        onOrderSent();
      } else {
        loadOrderDetails();
      }
    } catch (error) {
      console.error('Error confirming order:', error);
      alert('Błąd podczas potwierdzania zamówienia');
    }
  };

  const sendOrder = async () => {
    if (!order) return;
    const confirmed = await confirm({
      title: 'Wysłać zamówienie?',
      message: 'Zamówienie zostanie wysłane do hurtowni. Nie będzie można go później edytować.',
      confirmText: 'Wyślij',
      cancelText: 'Anuluj',
      variant: 'info'
    });
    if (!confirmed) return;

    try {
      const { error: updateError } = await supabase
        .from('orders')
        .update({
          status: 'sent',
          sent_at: new Date().toISOString(),
        })
        .eq('id', orderId);

      if (updateError) throw updateError;

      await supabase.from('order_history').insert({
        order_id: orderId,
        action: 'sent',
        performed_by: userId,
        details: {},
      });

      const successMessage = document.createElement('div');
      successMessage.className = 'fixed inset-0 flex items-center justify-center z-50 bg-black/50 animate-fade-in';
      successMessage.innerHTML = `
        <div class="bg-white rounded-2xl p-8 shadow-2xl max-w-md mx-4 animate-scale-in">
          <div class="text-center">
            <div class="w-20 h-20 bg-gradient-to-r from-green-500 to-emerald-600 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg class="w-10 h-10 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="3" d="M5 13l4 4L19 7"></path>
              </svg>
            </div>
            <h3 class="text-2xl font-bold text-gray-800 mb-2">Sukces!</h3>
            <p class="text-gray-600 text-lg">Zamówienie zostało wysłane do hurtowni</p>
          </div>
        </div>
      `;
      document.body.appendChild(successMessage);

      setTimeout(() => {
        successMessage.remove();
        if (onOrderSent) {
          onOrderSent();
        } else {
          onBack();
        }
      }, 2000);
    } catch (error) {
      console.error('Error sending order:', error);
      alert('Błąd podczas wysyłania zamówienia');
    }
  };

  const startProgress = async () => {
    if (!order) return;
    const confirmed = await confirm({
      title: 'Rozpocząć realizację?',
      message: 'Zamówienie zostanie oznaczone jako "W trakcie realizacji". Będziesz mógł śledzić postępy.',
      confirmText: 'Rozpocznij',
      cancelText: 'Anuluj',
      variant: 'info'
    });
    if (!confirmed) return;

    try {
      const { error: updateError } = await supabase
        .from('orders')
        .update({
          status: 'in_progress',
          in_progress_at: new Date().toISOString(),
        })
        .eq('id', orderId);

      if (updateError) throw updateError;

      await supabase.from('order_history').insert({
        order_id: orderId,
        action: 'in_progress',
        performed_by: userId,
        details: {},
      });

      alert('Zamówienie w realizacji!');

      if (onOrderSent) {
        onOrderSent();
      } else {
        loadOrderDetails();
      }
    } catch (error) {
      console.error('Error starting order progress:', error);
      alert('Błąd podczas rozpoczynania realizacji');
    }
  };

  const rejectOrder = async () => {
    if (!order) return;
    const confirmed = await confirm({
      title: 'Odrzucić zamówienie?',
      message: 'Zamówienie zostanie oznaczone jako odrzucone. Użytkownik zostanie powiadomiony.',
      confirmText: 'Odrzuć',
      cancelText: 'Anuluj',
      variant: 'danger'
    });
    if (!confirmed) return;

    try {
      const { error: updateError } = await supabase
        .from('orders')
        .update({ status: 'rejected' })
        .eq('id', orderId);

      if (updateError) throw updateError;

      await supabase.from('order_history').insert({
        order_id: orderId,
        action: 'rejected',
        performed_by: userId,
        details: {},
      });

      alert('Zamówienie odrzucone');

      if (onOrderSent) {
        onOrderSent();
      } else {
        loadOrderDetails();
      }
    } catch (error) {
      console.error('Error rejecting order:', error);
      alert('Błąd podczas odrzucania zamówienia');
    }
  };

  const deleteOrder = async () => {
    if (!order || (order.status !== 'draft' && order.status !== 'notatnik')) return;
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
        .eq('id', order.id);

      if (error) throw error;
      alert('Zamówienie zostało usunięte');
      onBack();
    } catch (error) {
      console.error('Error deleting order:', error);
      alert('Błąd podczas usuwania zamówienia');
    }
  };

  const useAsTemplate = () => {
    if (!order || !onUseAsTemplate) return;
    onUseAsTemplate(order.id);
  };

  const convertToDraft = async () => {
    if (!order || order.status !== 'notatnik') return;
    const confirmed = await confirm({
      title: 'Przekształcić w szkic?',
      message: 'Zamówienie zostanie przekształcone w szkic i będzie można je edytować. Zostaniesz przeniesiony do edycji.',
      confirmText: 'Przekształć',
      cancelText: 'Anuluj',
      variant: 'warning'
    });
    if (!confirmed) return;

    try {
      const { error: updateError } = await supabase
        .from('orders')
        .update({ status: 'draft' })
        .eq('id', orderId);

      if (updateError) throw updateError;

      await supabase.from('order_history').insert({
        order_id: orderId,
        action: 'converted_to_draft',
        performed_by: userId,
        details: { from_status: 'notatnik' },
      });

      // Verify the update succeeded
      const { data: verifyData } = await supabase
        .from('orders')
        .select('status')
        .eq('id', orderId)
        .single();

      if (verifyData?.status !== 'draft') {
        throw new Error('Status zamówienia nie został zaktualizowany');
      }

      if (onEdit) {
        onEdit();
      }
    } catch (error) {
      console.error('Error converting to draft:', error);
      alert('Błąd podczas przekształcania zamówienia');
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

  if (!order) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-500">Zamówienie nie zostało znalezione</p>
        <button onClick={onBack} className="mt-4 text-amber-600 hover:underline">
          Powrót do listy
        </button>
      </div>
    );
  }

  const deleteOrderItem = async (itemId: string) => {
    const confirmed = await confirm({
      title: 'Usunąć pozycję?',
      message: 'Ta pozycja zostanie trwale usunięta z zamówienia.',
      confirmText: 'Usuń',
      cancelText: 'Anuluj',
      variant: 'danger'
    });
    if (!confirmed) return;

    try {
      const { error } = await supabase
        .from('order_items')
        .delete()
        .eq('id', itemId);

      if (error) throw error;

      await loadOrderDetails();
    } catch (error) {
      console.error('Error deleting order item:', error);
      alert('Błąd podczas usuwania pozycji');
    }
  };

  const startEditingItem = (item: OrderItem) => {
    setEditingItemId(item.id);
    setEditingQuantity(item.quantity.toString());
  };

  const cancelEditingItem = () => {
    setEditingItemId(null);
    setEditingQuantity('');
  };

  const saveItemQuantity = async (item: OrderItem) => {
    const newQuantity = parseFloat(editingQuantity);
    if (isNaN(newQuantity) || newQuantity <= 0) {
      alert('Podaj prawidłową ilość');
      return;
    }

    try {
      const newTotalPrice = newQuantity * item.unit_price;

      const { error } = await supabase
        .from('order_items')
        .update({
          quantity: newQuantity,
          total_price: newTotalPrice
        })
        .eq('id', item.id);

      if (error) throw error;

      await supabase.from('order_history').insert({
        order_id: orderId,
        action: 'modified_quantity',
        performed_by: userId,
        details: {
          product_name: item.products?.name,
          old_quantity: item.quantity,
          new_quantity: newQuantity,
          unit: item.unit
        },
      });

      setEditingItemId(null);
      setEditingQuantity('');
      await loadOrderDetails();
    } catch (error) {
      console.error('Error updating item quantity:', error);
      alert('Błąd podczas aktualizacji ilości');
    }
  };

  const canEdit = (userRole === 'store_manager' || userRole === 'salesperson') && order.status === 'draft';
  const canDelete = (userRole === 'store_manager' || userRole === 'salesperson') && (order.status === 'draft' || order.status === 'notatnik');
  const canUseAsTemplate = (userRole === 'store_manager' || userRole === 'salesperson') && order.status !== 'notatnik';
  const canSend = (userRole === 'store_manager' || userRole === 'salesperson') && order.status === 'draft';
  const canConvertToDraft = (userRole === 'store_manager' || userRole === 'salesperson') && order.status === 'notatnik';
  const canAddMore = (userRole === 'store_manager' || userRole === 'salesperson') && order.status === 'notatnik';
  const canDeleteItems = (userRole === 'store_manager' || userRole === 'salesperson') && order.status === 'notatnik';
  const canEditItems = (userRole === 'store_manager' || userRole === 'salesperson') && order.status === 'notatnik';
  const canStartProgress = (userRole === 'operator' || userRole === 'admin') && order.status === 'sent';
  const canConfirm = (userRole === 'operator' || userRole === 'admin') &&
                     (order.status === 'in_progress' || order.status === 'pending_confirmation');

  return (
    <>
      <ConfirmComponent />
      <div className="min-h-screen bg-gray-50 pb-20">
      <div className="bg-gradient-to-r from-amber-500 to-orange-600 text-white p-4">
        <div className="flex items-center gap-3 mb-3">
          <button
            onClick={onBack}
            className="flex items-center justify-center gap-2 bg-white/20 hover:bg-white/30 rounded-lg px-4 py-3 transition-all active:scale-95 min-w-[100px]"
          >
            <ArrowLeft className="w-5 h-5" />
            <span className="font-medium">Powrót</span>
          </button>
          <h2 className="text-xl font-bold flex-1">{order.order_number}</h2>
          {canDelete && (
            <button
              onClick={deleteOrder}
              className="flex items-center justify-center bg-red-500/90 hover:bg-red-600 rounded-lg p-3 transition-all active:scale-95"
              title="Usuń zamówienie"
            >
              <Trash2 className="w-5 h-5" />
            </button>
          )}
        </div>
      </div>

      <div className="p-3 space-y-3">
        <div className="bg-white rounded-lg shadow p-3">
          <div className="space-y-3">
            <div className="grid grid-cols-2 gap-2 text-xs">
              <div>
                <span className="text-gray-500">Status:</span>
                <span className="ml-1 font-medium">{order.status}</span>
              </div>
              <div className="col-span-2">
                <span className="text-gray-500">Utworzono:</span>
                <span className="ml-1 font-medium">{formatDate(order.created_at)}</span>
              </div>
              <div className="col-span-2">
                <span className="text-gray-500">Ostatnia modyfikacja:</span>
                <span className="ml-1 font-medium">{formatDate(order.updated_at)}</span>
              </div>
              {order.sent_at && (
                <div className="col-span-2">
                  <span className="text-gray-500">Wysłano:</span>
                  <span className="ml-1 font-medium">{formatDate(order.sent_at)}</span>
                </div>
              )}
              {(order as any).in_progress_at && (
                <div className="col-span-2">
                  <span className="text-gray-500">W realizacji:</span>
                  <span className="ml-1 font-medium">{formatDate((order as any).in_progress_at)}</span>
                </div>
              )}
              {order.confirmed_at && (
                <div className="col-span-2">
                  <span className="text-gray-500">Potwierdzono:</span>
                  <span className="ml-1 font-medium">{formatDate(order.confirmed_at)}</span>
                </div>
              )}
              {order.delivery_date && (
                <div className="col-span-2">
                  <span className="text-gray-500">Dostawa:</span>
                  <span className="ml-1 font-medium">{order.delivery_date}</span>
                </div>
              )}
              {order.requires_confirmation && (
                <div className="col-span-2">
                  <span className="px-2 py-1 bg-yellow-100 text-yellow-800 rounded text-xs">Wymaga potwierdzenia</span>
                </div>
              )}
            </div>

            <div className="border-t border-gray-200 pt-3">
              <h4 className="font-semibold text-xs text-gray-700 mb-2">Uczestnicy realizacji:</h4>
              <div className="space-y-2">
                {order.creator && (
                  <div className="flex items-start gap-2 text-xs">
                    <span className="text-2xl">📝</span>
                    <div>
                      <div className="font-medium text-gray-700">
                        {order.status === 'draft' ? 'Utworzył zamówienie' : 'Złożył zamówienie'}
                      </div>
                      <div className="text-blue-600 font-medium">{order.creator.full_name}</div>
                      <div className="text-gray-500">
                        {order.creator.role === 'store_manager' ? 'Ekspedient' :
                         order.creator.role === 'salesperson' ? 'Handlowiec' :
                         order.creator.role === 'operator' ? 'Operator' :
                         order.creator.role}
                      </div>
                    </div>
                  </div>
                )}

                {history.filter(h => h.action.toLowerCase().includes('wysłano')).map(h => h.users).filter(Boolean)[0] && (
                  <div className="flex items-start gap-2 text-xs">
                    <span className="text-2xl">📤</span>
                    <div>
                      <div className="font-medium text-gray-700">Wysłał do realizacji</div>
                      <div className="text-blue-600 font-medium">
                        {history.filter(h => h.action.toLowerCase().includes('wysłano')).map(h => h.users).filter(Boolean)[0]?.full_name}
                      </div>
                      <div className="text-gray-500">
                        {history.filter(h => h.action.toLowerCase().includes('wysłano')).map(h => h.users).filter(Boolean)[0]?.role === 'store_manager' ? 'Ekspedient' :
                         history.filter(h => h.action.toLowerCase().includes('wysłano')).map(h => h.users).filter(Boolean)[0]?.role === 'salesperson' ? 'Handlowiec' :
                         history.filter(h => h.action.toLowerCase().includes('wysłano')).map(h => h.users).filter(Boolean)[0]?.role === 'operator' ? 'Operator' :
                         history.filter(h => h.action.toLowerCase().includes('wysłano')).map(h => h.users).filter(Boolean)[0]?.role}
                      </div>
                    </div>
                  </div>
                )}

                {history.filter(h => h.action.toLowerCase().includes('potwierdz')).map(h => h.users).filter(Boolean)[0] && (
                  <div className="flex items-start gap-2 text-xs">
                    <span className="text-2xl">✅</span>
                    <div>
                      <div className="font-medium text-gray-700">Potwierdził realizację</div>
                      <div className="text-green-600 font-medium">
                        {history.filter(h => h.action.toLowerCase().includes('potwierdz')).map(h => h.users).filter(Boolean)[0]?.full_name}
                      </div>
                      <div className="text-gray-500">
                        {history.filter(h => h.action.toLowerCase().includes('potwierdz')).map(h => h.users).filter(Boolean)[0]?.role === 'operator' ? 'Operator hurtowni' :
                         history.filter(h => h.action.toLowerCase().includes('potwierdz')).map(h => h.users).filter(Boolean)[0]?.role === 'admin' ? 'Administrator' :
                         history.filter(h => h.action.toLowerCase().includes('potwierdz')).map(h => h.users).filter(Boolean)[0]?.role}
                      </div>
                    </div>
                  </div>
                )}

                {history.filter(h => h.action.toLowerCase().includes('odrzuc')).map(h => h.users).filter(Boolean)[0] && (
                  <div className="flex items-start gap-2 text-xs">
                    <span className="text-2xl">❌</span>
                    <div>
                      <div className="font-medium text-gray-700">Odrzucił zamówienie</div>
                      <div className="text-red-600 font-medium">
                        {history.filter(h => h.action.toLowerCase().includes('odrzuc')).map(h => h.users).filter(Boolean)[0]?.full_name}
                      </div>
                      <div className="text-gray-500">
                        {history.filter(h => h.action.toLowerCase().includes('odrzuc')).map(h => h.users).filter(Boolean)[0]?.role === 'operator' ? 'Operator hurtowni' :
                         history.filter(h => h.action.toLowerCase().includes('odrzuc')).map(h => h.users).filter(Boolean)[0]?.role === 'admin' ? 'Administrator' :
                         history.filter(h => h.action.toLowerCase().includes('odrzuc')).map(h => h.users).filter(Boolean)[0]?.role}
                      </div>
                    </div>
                  </div>
                )}

                {history.filter(h => h.action === 'modified_draft').length > 0 && (
                  <div className="mt-3 pt-2 border-t border-gray-200">
                    <h5 className="font-semibold text-xs text-gray-700 mb-2">Modyfikacje szkicu:</h5>
                    <div className="space-y-2">
                      {history.filter(h => h.action === 'modified_draft').map((mod, index) => (
                        <div key={index} className="flex items-start gap-2 text-xs">
                          <span className="text-lg">✏️</span>
                          <div>
                            <div className="text-gray-600">
                              <span className="font-medium text-blue-600">{mod.users?.full_name}</span>
                              <span className="mx-1">•</span>
                              <span className="text-gray-500">{formatDate(mod.created_at)}</span>
                            </div>
                            <div className="text-gray-500 text-xs">
                              {mod.users?.role === 'store_manager' ? 'Ekspedient' :
                               mod.users?.role === 'salesperson' ? 'Handlowiec' :
                               mod.users?.role}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-3">
          <h3 className="font-semibold text-base mb-2">Produkty ({items.length})</h3>
          {items.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <p className="text-sm">Brak produktów w zamówieniu</p>
            </div>
          ) : (
            <div className="space-y-1">
              {items.map((item) => (
                <div key={item.id} className="flex items-center justify-between p-2 bg-gray-50 rounded hover:bg-gray-100 transition">
                  <div className="flex-1 min-w-0 mr-2">
                    <div className="flex items-center gap-2">
                      <span className={`w-5 h-5 rounded-full flex items-center justify-center text-xs flex-shrink-0 ${
                        item.status === 'confirmed' ? 'bg-green-500 text-white' :
                        item.status === 'partially_confirmed' ? 'bg-yellow-500 text-white' :
                        item.status === 'rejected' ? 'bg-red-500 text-white' :
                        'bg-gray-300 text-gray-600'
                      }`}>
                        {item.status === 'confirmed' ? '✓' :
                         item.status === 'partially_confirmed' ? '~' :
                         item.status === 'rejected' ? '✗' :
                         '○'}
                      </span>
                      <span className="font-medium text-gray-800 truncate text-[15px]">{item.products?.name || 'Produkt'}</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-3 text-gray-600 flex-shrink-0">
                    {editingItemId === item.id ? (
                      <>
                        <input
                          type="number"
                          step="0.01"
                          value={editingQuantity}
                          onChange={(e) => setEditingQuantity(e.target.value)}
                          className="w-20 px-2 py-1 border border-blue-500 rounded text-[15px] font-medium text-center"
                          autoFocus
                        />
                        <span className="text-[15px]">{item.unit}</span>
                        <button
                          onClick={() => saveItemQuantity(item)}
                          className="p-1 text-green-600 hover:bg-green-50 rounded transition"
                          title="Zapisz"
                        >
                          <CheckCircle className="w-4 h-4" />
                        </button>
                        <button
                          onClick={cancelEditingItem}
                          className="p-1 text-gray-600 hover:bg-gray-200 rounded transition"
                          title="Anuluj"
                        >
                          <XCircle className="w-4 h-4" />
                        </button>
                      </>
                    ) : (
                      <>
                        <span className="font-medium text-[15px]">{item.quantity} {item.unit}</span>
                        {order.source_type && ['price_list', 'copy'].includes(order.source_type) && (
                          <>
                            <span className="text-gray-400 text-[15px]">×</span>
                            <span className="text-[15px]">{item.unit_price.toFixed(2)}</span>
                            <span className="font-bold text-amber-600 min-w-[60px] text-right text-[15px]">{item.total_price.toFixed(2)} PLN</span>
                          </>
                        )}
                        {canEditItems && (
                          <button
                            onClick={() => startEditingItem(item)}
                            className="p-1 text-blue-600 hover:bg-blue-50 rounded transition"
                            title="Edytuj ilość"
                          >
                            <Edit className="w-4 h-4" />
                          </button>
                        )}
                        {canDeleteItems && (
                          <button
                            onClick={() => deleteOrderItem(item.id)}
                            className="p-1 text-red-500 hover:bg-red-50 rounded transition"
                            title="Usuń pozycję"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        )}
                      </>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
          {order.source_type && ['price_list', 'copy'].includes(order.source_type) && (
            <div className="mt-2 pt-2 border-t border-gray-200">
              <div className="flex justify-between items-center text-sm">
                <span className="font-semibold text-gray-700">Razem:</span>
                <div className="text-right">
                  <span className="font-bold text-lg text-amber-600">{formatPriceDisplay(order.total_amount)} PLN</span>
                </div>
              </div>
            </div>
          )}
        </div>

        {(canAddMore || canConvertToDraft) && (
          <div className="bg-white rounded-lg shadow p-3 space-y-3">
            {canConvertToDraft && (
              <div className="bg-blue-600 text-white p-3 rounded-lg text-sm">
                <p className="font-medium">Przekształć w szkic aby móc wysłać zamówienie</p>
                <p className="text-xs mt-1 opacity-90">Po kliknięciu "Dalej" zamówienie zostanie przekształcone w szkic i będzie można je edytować oraz wysłać do hurtowni.</p>
              </div>
            )}
            <div className="grid grid-cols-2 gap-2">
              {canAddMore && (
                <button
                  onClick={onAddProducts || onBack}
                  className="py-3 bg-gradient-to-r from-green-500 to-emerald-600 text-white rounded-lg font-medium hover:from-green-600 hover:to-emerald-700 transition flex items-center justify-center gap-2 shadow"
                >
                  <Plus className="w-5 h-5" />
                  Dodaj asortyment
                </button>
              )}
              {canConvertToDraft && (
                <button
                  onClick={convertToDraft}
                  className="py-3 bg-gradient-to-r from-teal-500 to-cyan-600 text-white rounded-lg font-medium hover:from-teal-600 hover:to-cyan-700 transition flex items-center justify-center gap-2 shadow"
                >
                  <FileEdit className="w-5 h-5" />
                  Dalej
                </button>
              )}
            </div>
          </div>
        )}

        {canEdit && onEdit && (
          <div className="bg-white rounded-lg shadow p-3">
            <div className="grid grid-cols-2 gap-2">
              <button
                onClick={onEdit}
                className="py-3 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition flex items-center justify-center gap-2 shadow"
              >
                <Edit className="w-5 h-5" />
                Edytuj zamówienie
              </button>
              <button
                onClick={sendOrder}
                className="py-3 bg-gradient-to-r from-amber-500 to-orange-600 text-white rounded-lg font-medium hover:from-amber-600 hover:to-orange-700 transition flex items-center justify-center gap-2 shadow"
              >
                <Truck className="w-5 h-5" />
                Zamów w hurtowni
              </button>
            </div>
          </div>
        )}

        {canUseAsTemplate && onUseAsTemplate && order.status !== 'draft' && (
          <div className="bg-white rounded-lg shadow p-3">
            <button
              onClick={useAsTemplate}
              className="w-full py-3 bg-gradient-to-r from-green-500 to-emerald-600 text-white rounded-lg font-medium hover:from-green-600 hover:to-emerald-700 transition flex items-center justify-center gap-2 shadow"
            >
              <Copy className="w-5 h-5" />
              Użyj jako szablon
            </button>
          </div>
        )}

        {canStartProgress && (
          <div className="bg-white rounded-lg shadow p-3">
            <button
              onClick={startProgress}
              className="w-full py-3 bg-gradient-to-r from-blue-500 to-blue-600 text-white rounded-lg font-medium hover:from-blue-600 hover:to-blue-700 transition flex items-center justify-center gap-2 shadow"
            >
              <PlayCircle className="w-5 h-5" />
              Rozpocznij realizację
            </button>
          </div>
        )}

        {canConfirm && (
          <div className="bg-white rounded-lg shadow p-3">
            <div className="grid grid-cols-3 gap-2">
              <button
                onClick={() => confirmOrder(true)}
                className="py-2 bg-green-600 text-white rounded font-medium hover:bg-green-700 transition flex items-center justify-center gap-1 text-sm"
              >
                <CheckCircle className="w-4 h-4" />
                <span>Potwierdź</span>
              </button>
              <button
                onClick={() => confirmOrder(false)}
                className="py-2 bg-amber-600 text-white rounded font-medium hover:bg-amber-700 transition flex items-center justify-center gap-1 text-sm"
              >
                <Clock className="w-4 h-4" />
                <span>Częściowo</span>
              </button>
              <button
                onClick={rejectOrder}
                className="py-2 bg-red-600 text-white rounded font-medium hover:bg-red-700 transition flex items-center justify-center gap-1 text-sm"
              >
                <XCircle className="w-4 h-4" />
                <span>Odrzuć</span>
              </button>
            </div>
          </div>
        )}

        {history.length > 0 && (
          <div className="bg-white rounded-lg shadow">
            <button
              onClick={() => setHistoryExpanded(!historyExpanded)}
              className="w-full p-3 flex items-center justify-between hover:bg-gray-50 transition"
            >
              <h3 className="font-semibold text-sm">Historia ({history.length})</h3>
              {historyExpanded ? (
                <ChevronUp className="w-4 h-4 text-gray-600" />
              ) : (
                <ChevronDown className="w-4 h-4 text-gray-600" />
              )}
            </button>
            {historyExpanded && (
              <div className="px-3 pb-3 space-y-2 border-t border-gray-100">
                {history.map((entry) => (
                  <div key={entry.id} className="p-2 bg-gray-50 rounded text-xs">
                    <div className="flex items-start gap-2">
                      <Package className="w-3 h-3 text-gray-500 flex-shrink-0 mt-0.5" />
                      <div className="flex-1 min-w-0">
                        <div className="flex flex-col gap-1 mb-1">
                          <span className="font-medium text-gray-800">{entry.action}</span>
                          {entry.details && typeof entry.details === 'object' && (
                            <div className="text-gray-600">
                              {(entry.details as any).product_name && (
                                <div>Produkt: {(entry.details as any).product_name}</div>
                              )}
                              {(entry.details as any).old_quantity !== undefined && (
                                <div>
                                  {(entry.details as any).old_quantity} {(entry.details as any).unit} → {(entry.details as any).new_quantity} {(entry.details as any).unit}
                                </div>
                              )}
                              {(entry.details as any).quantity !== undefined && (entry.details as any).old_quantity === undefined && (
                                <div>
                                  Ilość: {(entry.details as any).quantity} {(entry.details as any).unit}
                                </div>
                              )}
                            </div>
                          )}
                          <span className="text-gray-400">{formatDate(entry.created_at)}</span>
                        </div>
                        {entry.users && (
                          <div className="flex items-center gap-1 text-blue-600">
                            <span className="font-medium">{entry.users.full_name}</span>
                            <span className="text-gray-400">({entry.users.role === 'store_manager' ? 'Ekspedient' : entry.users.role === 'salesperson' ? 'Handlowiec' : entry.users.role === 'operator' ? 'Operator' : entry.users.role})</span>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
    </>
  );
}
