import { useState, useEffect } from 'react';
import { ArrowLeft, Plus, Trash2, Save, Search } from 'lucide-react';
import { supabase, Product, OrderItem } from '../lib/supabase';

interface EditDraftOrderScreenProps {
  orderId: string;
  userId: string;
  onSave: () => void;
  onCancel: () => void;
}

export default function EditDraftOrderScreen({ orderId, userId, onSave, onCancel }: EditDraftOrderScreenProps) {
  const [products, setProducts] = useState<Product[]>([]);
  const [orderItems, setOrderItems] = useState<(OrderItem & { products?: Product })[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [orderNumber, setOrderNumber] = useState('');
  const [canEdit, setCanEdit] = useState(true);
  const [creatorId, setCreatorId] = useState<string | null>(null);

  useEffect(() => {
    loadData();
  }, [orderId]);

  const loadData = async () => {
    setLoading(true);
    try {
      const { data: orderData, error: orderError } = await supabase
        .from('orders')
        .select(`
          order_number,
          created_by,
          creator:created_by (
            allow_collaborative_editing
          )
        `)
        .eq('id', orderId)
        .single();

      if (orderError) throw orderError;
      setOrderNumber(orderData.order_number);
      setCreatorId(orderData.created_by);

      // Check if user can edit
      const isCreator = orderData.created_by === userId;
      const creatorAllowsCollab = orderData.creator?.allow_collaborative_editing ?? true;
      setCanEdit(isCreator || creatorAllowsCollab);

      if (!isCreator && !creatorAllowsCollab) {
        alert('Nie masz uprawnień do edycji tego zamówienia. Twórca wyłączył współdzielenie edycji.');
        onCancel();
        return;
      }

      const { data: productsData, error: productsError } = await supabase
        .from('products')
        .select('*')
        .eq('active', true)
        .order('name');

      if (productsError) throw productsError;
      setProducts(productsData || []);

      const { data: itemsData, error: itemsError } = await supabase
        .from('order_items')
        .select(`
          *,
          product:product_id (
            id,
            name,
            code,
            unit,
            base_price
          )
        `)
        .eq('order_id', orderId);

      if (itemsError) {
        console.error('EditDraft - items error:', itemsError);
        throw itemsError;
      }

      const itemsWithProducts = (itemsData || []).map(item => ({
        ...item,
        products: item.product
      }));
      setOrderItems(itemsWithProducts);
    } catch (error) {
      console.error('Error loading data:', error);
      alert('Błąd podczas ładowania danych');
    } finally {
      setLoading(false);
    }
  };

  const addProduct = (product: Product) => {
    const existingItem = orderItems.find(item => item.product_id === product.id);
    if (existingItem) {
      updateQuantity(existingItem.id, existingItem.quantity + 1);
    } else {
      const newItem: any = {
        id: `temp-${Date.now()}`,
        order_id: orderId,
        product_id: product.id,
        quantity: 1,
        unit: product.unit,
        unit_price: product.base_price,
        total_price: product.base_price,
        status: 'pending',
        products: product,
      };
      setOrderItems([...orderItems, newItem]);
    }
  };

  const updateQuantity = (itemId: string, newQuantity: number) => {
    if (newQuantity <= 0) {
      removeItem(itemId);
      return;
    }
    setOrderItems(orderItems.map(item => {
      if (item.id === itemId) {
        const totalPrice = item.unit_price * newQuantity;
        return { ...item, quantity: newQuantity, total_price: totalPrice };
      }
      return item;
    }));
  };

  const removeItem = (itemId: string) => {
    setOrderItems(orderItems.filter(item => item.id !== itemId));
  };

  const calculateTotal = () => {
    return orderItems.reduce((sum, item) => sum + item.total_price, 0);
  };

  const saveOrder = async () => {
    if (orderItems.length === 0) {
      alert('Dodaj przynajmniej jeden produkt do zamówienia');
      return;
    }

    setSaving(true);
    try {
      const existingItemIds = orderItems
        .filter(item => !item.id.startsWith('temp-'))
        .map(item => item.id);

      const { data: allItems } = await supabase
        .from('order_items')
        .select('id')
        .eq('order_id', orderId);

      const itemsToDelete = (allItems || [])
        .filter(item => !existingItemIds.includes(item.id))
        .map(item => item.id);

      if (itemsToDelete.length > 0) {
        const { error: deleteError } = await supabase
          .from('order_items')
          .delete()
          .in('id', itemsToDelete);

        if (deleteError) throw deleteError;
      }

      for (const item of orderItems) {
        if (item.id.startsWith('temp-')) {
          const { error: insertError } = await supabase
            .from('order_items')
            .insert({
              order_id: orderId,
              product_id: item.product_id,
              quantity: item.quantity,
              unit: item.unit,
              unit_price: item.unit_price,
              total_price: item.total_price,
              status: 'pending',
            });

          if (insertError) throw insertError;
        } else {
          const { error: updateError } = await supabase
            .from('order_items')
            .update({
              quantity: item.quantity,
              total_price: item.total_price,
            })
            .eq('id', item.id);

          if (updateError) throw updateError;
        }
      }

      const totalAmount = calculateTotal();
      const { error: orderUpdateError } = await supabase
        .from('orders')
        .update({ total_amount: totalAmount })
        .eq('id', orderId);

      if (orderUpdateError) throw orderUpdateError;

      // Log modification in order history (only if user is not the creator)
      if (creatorId && creatorId !== userId) {
        await supabase
          .from('order_history')
          .insert({
            order_id: orderId,
            action: 'modified_draft',
            performed_by: userId,
            details: { modified_at: new Date().toISOString() }
          });
      }

      alert('Zamówienie zapisane!');
      onSave();
    } catch (error) {
      console.error('Error saving order:', error);
      alert('Błąd podczas zapisywania zamówienia');
    } finally {
      setSaving(false);
    }
  };

  const filteredProducts = products.filter(product =>
    product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    product.code.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (product.index && product.index.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-amber-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 pb-20">
      <div className="bg-gradient-to-r from-amber-500 to-orange-600 text-white p-4">
        <button onClick={onCancel} className="flex items-center gap-2 mb-2 hover:opacity-80 transition">
          <ArrowLeft className="w-5 h-5" />
          <span>Anuluj</span>
        </button>
        <h2 className="text-xl font-bold">Edycja szkicu</h2>
        <p className="text-amber-100 text-sm">{orderNumber}</p>
      </div>

      <div className="p-4 space-y-4">
        {orderItems.length > 0 && (
          <div className="bg-white rounded-xl shadow-lg p-4">
            <h3 className="font-semibold text-lg mb-3">Produkty w zamówieniu ({orderItems.length})</h3>
            <div className="space-y-2">
              {orderItems.map((item) => (
                <div key={item.id} className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                  <div className="flex-1 min-w-0">
                    <div className="font-medium text-gray-800 truncate">{item.products?.name}</div>
                    <div className="text-sm text-gray-600">{item.unit_price.toFixed(2)} PLN/{item.unit}</div>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => updateQuantity(item.id, item.quantity - 1)}
                      className="w-8 h-8 bg-gray-200 rounded-lg font-bold hover:bg-gray-300 transition"
                    >
                      -
                    </button>
                    <input
                      type="number"
                      value={item.quantity}
                      onChange={(e) => updateQuantity(item.id, parseFloat(e.target.value) || 0)}
                      className="w-16 text-center border border-gray-300 rounded-lg py-1"
                      step="0.1"
                      min="0"
                    />
                    <button
                      onClick={() => updateQuantity(item.id, item.quantity + 1)}
                      className="w-8 h-8 bg-gray-200 rounded-lg font-bold hover:bg-gray-300 transition"
                    >
                      +
                    </button>
                    <button
                      onClick={() => removeItem(item.id)}
                      className="w-8 h-8 bg-red-100 text-red-600 rounded-lg hover:bg-red-200 transition flex items-center justify-center"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                  <div className="text-right min-w-[80px]">
                    <div className="font-bold text-amber-600">{item.total_price.toFixed(2)} PLN</div>
                  </div>
                </div>
              ))}
            </div>
            <div className="mt-4 pt-4 border-t border-gray-200 flex justify-between items-center">
              <span className="font-semibold text-lg">Razem:</span>
              <span className="font-bold text-2xl text-amber-600">{calculateTotal().toFixed(2)} PLN</span>
            </div>
          </div>
        )}

        <div className="bg-white rounded-xl shadow-lg p-4">
          <h3 className="font-semibold text-lg mb-3">Dodaj produkty</h3>
          <div className="relative mb-4">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
            <input
              type="text"
              placeholder="Szukaj produktu..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent"
            />
          </div>

          <div className="space-y-2 max-h-96 overflow-y-auto">
            {filteredProducts.map((product) => (
              <button
                key={product.id}
                onClick={() => addProduct(product)}
                className="w-full p-3 bg-gray-50 rounded-lg hover:bg-amber-50 transition text-left flex items-center justify-between group"
              >
                <div className="flex-1 min-w-0">
                  <div className="font-medium text-gray-800 truncate">{product.name}</div>
                  <div className="text-sm text-gray-600">{product.code}</div>
                </div>
                <div className="flex items-center gap-3">
                  <div className="text-right">
                    <div className="font-semibold text-amber-600">{product.base_price.toFixed(2)} PLN</div>
                    <div className="text-xs text-gray-500">za {product.unit}</div>
                  </div>
                  <Plus className="w-5 h-5 text-amber-600 group-hover:scale-110 transition-transform" />
                </div>
              </button>
            ))}
          </div>
        </div>

        <div className="flex gap-3">
          <button
            onClick={onCancel}
            className="flex-1 py-3 bg-gray-200 text-gray-700 rounded-xl font-medium hover:bg-gray-300 transition"
          >
            Anuluj
          </button>
          <button
            onClick={saveOrder}
            disabled={saving || orderItems.length === 0}
            className="flex-1 py-3 bg-gradient-to-r from-amber-500 to-orange-600 text-white rounded-xl font-medium hover:from-amber-600 hover:to-orange-700 transition flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Save className="w-5 h-5" />
            {saving ? 'Zapisywanie...' : 'Zapisz zmiany'}
          </button>
        </div>
      </div>
    </div>
  );
}
