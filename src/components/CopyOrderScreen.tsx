import { useState, useEffect } from 'react';
import { Copy, FileText, ChevronRight, Package } from 'lucide-react';
import { supabase } from '../lib/supabase';

interface Order {
  id: string;
  order_number: string;
  created_at: string;
  total_amount: number;
  status: string;
}

interface OrderItem {
  product_id: string;
  product_name: string;
  quantity_ordered: number;
  unit: string;
  price_per_unit: number;
}

interface CopyOrderScreenProps {
  storeId: string;
  userId: string;
  onOrderSent: () => void;
  onCancel: () => void;
  preselectedOrderId?: string;
}

export default function CopyOrderScreen({ storeId, userId, onOrderSent, onCancel, preselectedOrderId }: CopyOrderScreenProps) {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [orderItems, setOrderItems] = useState<OrderItem[]>([]);
  const [loadingItems, setLoadingItems] = useState(false);
  const [sending, setSending] = useState(false);
  const [notes, setNotes] = useState('');

  useEffect(() => {
    loadCompletedOrders();
  }, [storeId]);

  useEffect(() => {
    if (preselectedOrderId && orders.length > 0 && !selectedOrder) {
      const order = orders.find(o => o.id === preselectedOrderId);
      if (order) {
        selectOrder(order);
      }
    }
  }, [preselectedOrderId, orders, selectedOrder]);

  const loadCompletedOrders = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('orders')
        .select('id, order_number, created_at, total_amount, status')
        .eq('store_id', storeId)
        .in('status', ['sent', 'in_progress', 'confirmed', 'partially_confirmed'])
        .order('created_at', { ascending: false })
        .limit(50);

      if (error) throw error;
      setOrders(data || []);
    } catch (error) {
      console.error('Error loading orders:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadOrderItems = async (orderId: string) => {
    setLoadingItems(true);
    try {
      const { data, error } = await supabase
        .from('order_items')
        .select(`
          product_id,
          quantity,
          unit,
          unit_price,
          products:product_id (
            name
          )
        `)
        .eq('order_id', orderId);

      if (error) throw error;

      const items = data?.map(item => ({
        product_id: item.product_id,
        product_name: (item.products as any)?.name || 'Nieznany produkt',
        quantity_ordered: item.quantity,
        unit: item.unit,
        price_per_unit: item.unit_price
      })) || [];

      setOrderItems(items);
    } catch (error) {
      console.error('Error loading order items:', error);
    } finally {
      setLoadingItems(false);
    }
  };

  const selectOrder = (order: Order) => {
    setSelectedOrder(order);
    loadOrderItems(order.id);
  };

  const updateQuantity = (productId: string, quantity: number) => {
    if (quantity <= 0) {
      removeItem(productId);
      return;
    }
    setOrderItems(orderItems.map(item =>
      item.product_id === productId
        ? { ...item, quantity_ordered: quantity }
        : item
    ));
  };

  const removeItem = (productId: string) => {
    setOrderItems(orderItems.filter(item => item.product_id !== productId));
  };

  const calculateTotal = () => {
    return orderItems.reduce((sum, item) => sum + (item.quantity_ordered * item.price_per_unit), 0);
  };

  const createDraftOrder = async () => {
    if (orderItems.length === 0) {
      alert('Zamówienie musi zawierać przynajmniej jeden produkt');
      return;
    }

    setSending(true);
    try {
      const orderNumber = `DRAFT-${Date.now()}`;
      const totalAmount = calculateTotal();

      const { data: order, error: orderError } = await supabase
        .from('orders')
        .insert({
          order_number: orderNumber,
          store_id: storeId,
          created_by: userId,
          status: 'draft',
          requires_confirmation: false,
          total_amount: totalAmount,
          notes: notes || null
        })
        .select()
        .single();

      if (orderError) throw orderError;

      const orderItemsData = orderItems.map(item => ({
        order_id: order.id,
        product_id: item.product_id,
        quantity: item.quantity_ordered,
        unit: item.unit,
        unit_price: item.price_per_unit,
        total_price: item.quantity_ordered * item.price_per_unit
      }));

      const { error: itemsError } = await supabase
        .from('order_items')
        .insert(orderItemsData);

      if (itemsError) throw itemsError;

      onOrderSent();
    } catch (error) {
      console.error('Error creating draft order:', error);
      alert('Błąd podczas tworzenia szkicu zamówienia');
    } finally {
      setSending(false);
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return new Intl.DateTimeFormat('pl-PL', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    }).format(date);
  };

  if (!selectedOrder) {
    return (
      <div className="min-h-screen bg-gray-50 pb-20">
        <div className="bg-gradient-to-r from-amber-500 to-orange-600 text-white p-4">
          <h2 className="text-xl font-bold">Kopiuj zamówienie</h2>
          <p className="text-amber-100 text-sm mt-1">Wybierz wysłane zamówienie do sklonowania</p>
        </div>

        <div className="p-6">
          {loading ? (
            <div className="flex items-center justify-center h-64">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-amber-600"></div>
            </div>
          ) : orders.length === 0 ? (
            <div className="bg-white rounded-xl shadow p-12 text-center">
              <Package className="w-16 h-16 text-gray-300 mx-auto mb-4" />
              <p className="text-gray-500 text-lg">Brak wysłanych zamówień</p>
              <p className="text-gray-400 text-sm mt-2">Wyślij przynajmniej jedno zamówienie</p>
            </div>
          ) : (
            <div className="space-y-3">
              {orders.map((order) => (
                <div
                  key={order.id}
                  onClick={() => selectOrder(order)}
                  className="bg-white rounded-xl shadow-lg p-5 hover:shadow-xl transition cursor-pointer"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <p className="font-bold text-lg text-gray-800">{order.order_number}</p>
                      <p className="text-sm text-gray-600">
                        Data: {formatDate(order.created_at)}
                      </p>
                      <p className="text-lg font-semibold text-amber-600 mt-1">
                        {order.total_amount.toFixed(2)} PLN
                      </p>
                    </div>
                    <ChevronRight className="w-6 h-6 text-gray-400" />
                  </div>
                </div>
              ))}
            </div>
          )}

          <button
            onClick={onCancel}
            className="mt-6 w-full p-4 bg-white border-2 border-gray-300 text-gray-700 rounded-lg font-medium hover:bg-gray-50 transition"
          >
            Anuluj
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 pb-20">
      <div className="bg-gradient-to-r from-amber-500 to-orange-600 text-white p-4">
        <h2 className="text-xl font-bold">Skopiuj do szkicu</h2>
        <p className="text-amber-100 text-sm mt-1">
          Kopiowanie z: {selectedOrder.order_number}
        </p>
      </div>

      <div className="p-6 space-y-6">
        {loadingItems ? (
          <div className="flex items-center justify-center h-64">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-amber-600"></div>
          </div>
        ) : (
          <>
            <div className="bg-white rounded-xl shadow-lg p-6">
              <h3 className="font-semibold text-lg mb-4">Pozycje zamówienia</h3>
              <div className="space-y-3">
                {orderItems.map((item) => (
                  <div key={item.product_id} className="bg-gray-50 rounded-lg p-4">
                    <div className="flex items-start justify-between mb-2">
                      <div className="flex-1">
                        <p className="font-semibold text-gray-800">{item.product_name}</p>
                        <p className="text-sm text-gray-600">
                          {item.price_per_unit.toFixed(2)} PLN/{item.unit}
                        </p>
                      </div>
                      <button
                        onClick={() => removeItem(item.product_id)}
                        className="text-red-500 hover:text-red-700 p-1"
                      >
                        <Trash2 className="w-5 h-5" />
                      </button>
                    </div>
                    <div className="flex items-center gap-3">
                      <button
                        onClick={() => updateQuantity(item.product_id, item.quantity_ordered - 1)}
                        className="w-8 h-8 bg-gray-200 rounded-lg hover:bg-gray-300 flex items-center justify-center font-bold"
                      >
                        -
                      </button>
                      <input
                        type="number"
                        value={item.quantity_ordered}
                        onChange={(e) => updateQuantity(item.product_id, parseFloat(e.target.value) || 0)}
                        className="w-20 p-2 text-center border border-gray-300 rounded-lg"
                        min="0"
                        step="0.1"
                      />
                      <button
                        onClick={() => updateQuantity(item.product_id, item.quantity_ordered + 1)}
                        className="w-8 h-8 bg-gray-200 rounded-lg hover:bg-gray-300 flex items-center justify-center font-bold"
                      >
                        +
                      </button>
                      <span className="text-sm text-gray-600">{item.unit}</span>
                      <span className="ml-auto font-bold text-gray-800">
                        {(item.quantity_ordered * item.price_per_unit).toFixed(2)} PLN
                      </span>
                    </div>
                  </div>
                ))}
              </div>

              <div className="mt-4 pt-4 border-t border-gray-200">
                <div className="flex justify-between items-center">
                  <span className="font-semibold text-lg">Suma:</span>
                  <span className="font-bold text-xl text-amber-600">
                    {calculateTotal().toFixed(2)} PLN
                  </span>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-xl shadow-lg p-6">
              <h3 className="font-semibold text-lg mb-4">Uwagi (opcjonalnie)</h3>
              <textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Dodaj uwagi do zamówienia..."
                className="w-full p-3 border-2 border-gray-300 rounded-lg focus:border-amber-500 focus:outline-none h-24 resize-none"
              />
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => setSelectedOrder(null)}
                className="flex-1 p-4 bg-white border-2 border-gray-300 text-gray-700 rounded-lg font-medium hover:bg-gray-50 transition"
              >
                Wstecz
              </button>
              <button
                onClick={createDraftOrder}
                disabled={sending || orderItems.length === 0}
                className="flex-1 p-4 bg-gradient-to-r from-amber-500 to-orange-600 text-white rounded-lg font-medium hover:from-amber-600 hover:to-orange-700 transition shadow flex items-center justify-center gap-2 disabled:opacity-50"
              >
                {sending ? (
                  <>Tworzenie...</>
                ) : (
                  <>
                    <FileText className="w-5 h-5" />
                    Zapisz jako szkic
                  </>
                )}
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
