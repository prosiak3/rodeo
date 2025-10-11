import { useState, useEffect } from 'react';
import { ArrowLeft, CheckCircle, XCircle, Package, Clock, PlayCircle, Edit, Trash2, Copy } from 'lucide-react';
import { supabase, Order, OrderItem, OrderHistory } from '../lib/supabase';

interface OrderDetailsProps {
  orderId: string;
  userRole: string;
  userId: string;
  onBack: () => void;
  onEdit?: () => void;
  onOrderSent?: () => void;
  onUseAsTemplate?: (orderId: string) => void;
}

export default function OrderDetails({ orderId, userRole, userId, onBack, onEdit, onOrderSent, onUseAsTemplate }: OrderDetailsProps) {
  const [order, setOrder] = useState<Order | null>(null);
  const [items, setItems] = useState<OrderItem[]>([]);
  const [history, setHistory] = useState<OrderHistory[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadOrderDetails();
  }, [orderId]);

  const loadOrderDetails = async () => {
    setLoading(true);
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

      if (orderError) throw orderError;
      setOrder(orderData);

      const { data: itemsData, error: itemsError } = await supabase
        .from('order_items')
        .select(`
          *,
          product:product_id (
            name,
            code,
            image_url,
            description
          )
        `)
        .eq('order_id', orderId);

      if (itemsError) {
        console.error('OrderDetails - items error:', itemsError);
        throw itemsError;
      }
      console.log('OrderDetails - loaded items:', itemsData);

      const itemsWithProducts = (itemsData || []).map(item => ({
        ...item,
        products: item.product
      }));
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
      loadOrderDetails();
    } catch (error) {
      console.error('Error confirming order:', error);
      alert('Błąd podczas potwierdzania zamówienia');
    }
  };

  const sendOrder = async () => {
    if (!order) return;
    if (!confirm('Czy na pewno chcesz wysłać to zamówienie?')) return;

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

      alert('Zamówienie zostało wysłane do hurtowni!');
      if (onOrderSent) {
        onOrderSent();
      } else {
        onBack();
      }
    } catch (error) {
      console.error('Error sending order:', error);
      alert('Błąd podczas wysyłania zamówienia');
    }
  };

  const startProgress = async () => {
    if (!order) return;
    if (!confirm('Czy na pewno chcesz rozpocząć realizację tego zamówienia?')) return;

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
      loadOrderDetails();
    } catch (error) {
      console.error('Error starting order progress:', error);
      alert('Błąd podczas rozpoczynania realizacji');
    }
  };

  const rejectOrder = async () => {
    if (!order) return;
    if (!confirm('Czy na pewno chcesz odrzucić to zamówienie?')) return;

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
      loadOrderDetails();
    } catch (error) {
      console.error('Error rejecting order:', error);
      alert('Błąd podczas odrzucania zamówienia');
    }
  };

  const deleteOrder = async () => {
    if (!order || order.status !== 'draft') return;
    if (!confirm('Czy na pewno chcesz usunąć to zamówienie?')) return;

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

  const canEdit = (userRole === 'store_manager' || userRole === 'salesperson') && order.status === 'draft';
  const canDelete = (userRole === 'store_manager' || userRole === 'salesperson') && order.status === 'draft';
  const canUseAsTemplate = (userRole === 'store_manager' || userRole === 'salesperson');
  const canSend = (userRole === 'store_manager' || userRole === 'salesperson') && order.status === 'draft';
  const canStartProgress = (userRole === 'operator' || userRole === 'admin') && order.status === 'sent';
  const canConfirm = (userRole === 'operator' || userRole === 'admin') &&
                     (order.status === 'in_progress' || order.status === 'pending_confirmation');

  return (
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
                        {order.creator.role === 'store_manager' ? 'Kierownik sklepu' :
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
                        {history.filter(h => h.action.toLowerCase().includes('wysłano')).map(h => h.users).filter(Boolean)[0]?.role === 'store_manager' ? 'Kierownik sklepu' :
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
                              {mod.users?.role === 'store_manager' ? 'Kierownik sklepu' :
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
                <div key={item.id} className="flex items-center justify-between p-2 bg-gray-50 rounded hover:bg-gray-100 transition text-sm">
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
                      <span className="font-medium text-gray-800 truncate">{item.products?.name || 'Produkt'}</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-3 text-xs text-gray-600 flex-shrink-0">
                    <span className="font-medium">{item.quantity} {item.unit}</span>
                    <span className="text-gray-400">×</span>
                    <span>{item.unit_price.toFixed(2)}</span>
                    <span className="font-bold text-amber-600 min-w-[60px] text-right">{item.total_price.toFixed(2)} PLN</span>
                  </div>
                </div>
              ))}
            </div>
          )}
          <div className="mt-2 pt-2 border-t border-gray-200 flex justify-between items-center text-sm">
            <span className="font-semibold text-gray-700">Razem:</span>
            <span className="font-bold text-lg text-amber-600">{order.total_amount.toFixed(2)} PLN</span>
          </div>
        </div>

        {canEdit && onEdit && (
          <div className="bg-white rounded-lg shadow p-3 space-y-2">
            <button
              onClick={onEdit}
              className="w-full py-3 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition flex items-center justify-center gap-2 shadow"
            >
              <Edit className="w-5 h-5" />
              Edytuj zamówienie
            </button>
            <button
              onClick={sendOrder}
              className="w-full py-3 bg-gradient-to-r from-amber-500 to-orange-600 text-white rounded-lg font-medium hover:from-amber-600 hover:to-orange-700 transition flex items-center justify-center gap-2 shadow"
            >
              <Package className="w-5 h-5" />
              Zamów w hurtowni
            </button>
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
          <div className="bg-white rounded-lg shadow p-3">
            <h3 className="font-semibold text-sm mb-2">Historia ({history.length})</h3>
            <div className="space-y-1">
              {history.map((entry) => (
                <div key={entry.id} className="p-2 bg-gray-50 rounded text-xs">
                  <div className="flex items-start gap-2">
                    <Package className="w-3 h-3 text-gray-500 flex-shrink-0 mt-0.5" />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="font-medium text-gray-800">{entry.action}</span>
                        <span className="text-gray-400">{formatDate(entry.created_at)}</span>
                      </div>
                      {entry.users && (
                        <div className="flex items-center gap-1 text-blue-600">
                          <span className="font-medium">{entry.users.full_name}</span>
                          <span className="text-gray-400">({entry.users.role})</span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
