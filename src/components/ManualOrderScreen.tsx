import { useState, useEffect } from 'react';
import { Plus, Trash2, Send, Search } from 'lucide-react';
import { supabase } from '../lib/supabase';

interface Product {
  id: string;
  name: string;
  unit: string;
  price_per_unit: number;
  description: string;
  barcode?: string;
}

interface OrderItem {
  product_id: string;
  product_name: string;
  quantity: number;
  unit: string;
  price_per_unit: number;
  total_price: number;
}

interface ManualOrderScreenProps {
  storeId: string;
  userId: string;
  onOrderSent: () => void;
  onCancel: () => void;
}

export default function ManualOrderScreen({ storeId, userId, onOrderSent, onCancel }: ManualOrderScreenProps) {
  const [products, setProducts] = useState<Product[]>([]);
  const [filteredProducts, setFilteredProducts] = useState<Product[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [orderItems, setOrderItems] = useState<OrderItem[]>([]);
  const [notes, setNotes] = useState('');
  const [sending, setSending] = useState(false);
  const [showProductList, setShowProductList] = useState(false);

  useEffect(() => {
    loadProducts();
  }, []);

  useEffect(() => {
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      const filtered = products.filter(p =>
        p.name.toLowerCase().includes(query) ||
        (p.description || '').toLowerCase().includes(query) ||
        (p.barcode || '').toLowerCase().includes(query)
      );
      setFilteredProducts(filtered);
    } else {
      setFilteredProducts(products);
    }
  }, [searchQuery, products]);

  const loadProducts = async () => {
    try {
      const { data: productsData, error: productsError } = await supabase
        .from('products')
        .select('id, name, unit, base_price, description, barcode')
        .eq('active', true)
        .order('name');

      if (productsError) throw productsError;

      const { data: specialPricesData, error: specialPricesError } = await supabase
        .from('special_prices')
        .select('product_id, your_price, promo_price')
        .eq('store_id', storeId);

      if (specialPricesError) throw specialPricesError;

      const specialPricesMap = new Map(
        (specialPricesData || []).map(sp => [
          sp.product_id,
          sp.promo_price || sp.your_price || null
        ])
      );

      const productsWithPrices = (productsData || []).map(p => ({
        id: p.id,
        name: p.name,
        unit: p.unit,
        description: p.description || '',
        barcode: p.barcode || '',
        price_per_unit: specialPricesMap.get(p.id) || p.base_price || 0
      }));

      setProducts(productsWithPrices);
      setFilteredProducts(productsWithPrices);
    } catch (error) {
      console.error('Error loading products:', error);
    }
  };

  const addProduct = (product: Product) => {
    const existing = orderItems.find(item => item.product_id === product.id);
    if (existing) {
      setOrderItems(orderItems.map(item =>
        item.product_id === product.id
          ? {
              ...item,
              quantity: item.quantity + 1,
              total_price: (item.quantity + 1) * item.price_per_unit
            }
          : item
      ));
    } else {
      setOrderItems([
        ...orderItems,
        {
          product_id: product.id,
          product_name: product.name,
          quantity: 1,
          unit: product.unit,
          price_per_unit: product.price_per_unit,
          total_price: product.price_per_unit
        }
      ]);
    }
    setSearchQuery('');
    setShowProductList(false);
  };

  const updateQuantity = (productId: string, quantity: number) => {
    if (quantity <= 0) {
      removeItem(productId);
      return;
    }
    setOrderItems(orderItems.map(item =>
      item.product_id === productId
        ? {
            ...item,
            quantity,
            total_price: quantity * item.price_per_unit
          }
        : item
    ));
  };

  const removeItem = (productId: string) => {
    setOrderItems(orderItems.filter(item => item.product_id !== productId));
  };

  const calculateTotal = () => {
    return orderItems.reduce((sum, item) => sum + item.total_price, 0);
  };

  const sendOrder = async () => {
    if (orderItems.length === 0) {
      alert('Dodaj przynajmniej jeden produkt do zamówienia');
      return;
    }

    setSending(true);
    try {
      const orderNumber = `ORD-${Date.now()}`;
      const totalAmount = calculateTotal();

      const { data: order, error: orderError } = await supabase
        .from('orders')
        .insert({
          order_number: orderNumber,
          store_id: storeId,
          created_by: userId,
          status: 'sent',
          requires_confirmation: false,
          total_amount: totalAmount,
          notes: notes || null,
          sent_at: new Date().toISOString()
        })
        .select()
        .single();

      if (orderError) throw orderError;

      const orderItemsData = orderItems.map(item => ({
        order_id: order.id,
        product_id: item.product_id,
        quantity_ordered: item.quantity,
        unit: item.unit,
        price_per_unit: item.price_per_unit,
        total_price: item.total_price
      }));

      const { error: itemsError } = await supabase
        .from('order_items')
        .insert(orderItemsData);

      if (itemsError) throw itemsError;

      onOrderSent();
    } catch (error) {
      console.error('Error sending order:', error);
      alert('Błąd podczas wysyłania zamówienia');
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 pb-20">
      <div className="bg-gradient-to-r from-amber-500 to-orange-600 text-white p-4">
        <h2 className="text-xl font-bold">Nowe zamówienie</h2>
        <p className="text-amber-100 text-sm mt-1">Wprowadź zamówienie ręcznie</p>
      </div>

      <div className="p-6 space-y-6">
        <div className="bg-white rounded-xl shadow-lg p-6">
          <h3 className="font-semibold text-lg mb-4">Wyszukaj produkty</h3>
          <div className="relative">
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                setShowProductList(true);
              }}
              onFocus={() => setShowProductList(true)}
              placeholder="Szukaj po nazwie, kodzie kreskowym lub opisie..."
              className="w-full p-3 pr-10 border-2 border-gray-300 rounded-lg focus:border-amber-500 focus:outline-none"
            />
            <Search className="absolute right-3 top-3 w-5 h-5 text-gray-400" />
          </div>

          {showProductList && filteredProducts.length > 0 && (
            <div className="mt-2 max-h-64 overflow-y-auto border border-gray-200 rounded-lg">
              {filteredProducts.map((product) => (
                <div
                  key={product.id}
                  onClick={() => addProduct(product)}
                  className="p-3 hover:bg-amber-50 cursor-pointer border-b border-gray-100 last:border-b-0"
                >
                  <p className="font-semibold text-gray-800">{product.name}</p>
                  <p className="text-sm text-gray-600">{product.barcode}</p>
                  <p className="text-sm text-amber-600 font-medium">
                    {(product.price_per_unit || 0).toFixed(2)} / 1{product.unit}
                  </p>
                </div>
              ))}
            </div>
          )}
        </div>

        {orderItems.length > 0 && (
          <div className="bg-white rounded-xl shadow-lg p-6">
            <h3 className="font-semibold text-lg mb-4">Pozycje zamówienia</h3>
            <div className="space-y-3">
              {orderItems.map((item) => (
                <div key={item.product_id} className="bg-gray-50 rounded-lg p-4">
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex-1">
                      <p className="font-semibold text-gray-800">{item.product_name}</p>
                      <p className="text-sm text-gray-600">
                        {(item.price_per_unit || 0).toFixed(2)} / 1{item.unit}
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
                      onClick={() => updateQuantity(item.product_id, item.quantity - 1)}
                      className="w-8 h-8 bg-gray-200 rounded-lg hover:bg-gray-300 flex items-center justify-center font-bold"
                    >
                      -
                    </button>
                    <input
                      type="number"
                      value={item.quantity}
                      onChange={(e) => updateQuantity(item.product_id, parseFloat(e.target.value) || 0)}
                      className="w-20 p-2 text-center border border-gray-300 rounded-lg"
                      min="0"
                      step="0.1"
                    />
                    <button
                      onClick={() => updateQuantity(item.product_id, item.quantity + 1)}
                      className="w-8 h-8 bg-gray-200 rounded-lg hover:bg-gray-300 flex items-center justify-center font-bold"
                    >
                      +
                    </button>
                    <span className="text-sm text-gray-600">{item.unit}</span>
                    <span className="ml-auto font-bold text-gray-800">
                      {(item.total_price || 0).toFixed(2)} PLN
                    </span>
                  </div>
                </div>
              ))}
            </div>

            <div className="mt-4 pt-4 border-t border-gray-200">
              <div className="flex justify-between items-center">
                <span className="font-semibold text-lg">Suma:</span>
                <span className="font-bold text-xl text-amber-600">
                  {(calculateTotal() || 0).toFixed(2)} PLN
                </span>
              </div>
            </div>
          </div>
        )}

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
            onClick={onCancel}
            className="flex-1 p-4 bg-white border-2 border-gray-300 text-gray-700 rounded-lg font-medium hover:bg-gray-50 transition"
          >
            Anuluj
          </button>
          <button
            onClick={sendOrder}
            disabled={sending || orderItems.length === 0}
            className="flex-1 p-4 bg-gradient-to-r from-amber-500 to-orange-600 text-white rounded-lg font-medium hover:from-amber-600 hover:to-orange-700 transition shadow flex items-center justify-center gap-2 disabled:opacity-50"
          >
            {sending ? (
              <>Wysyłanie...</>
            ) : (
              <>
                <Send className="w-5 h-5" />
                Wyślij zamówienie
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
