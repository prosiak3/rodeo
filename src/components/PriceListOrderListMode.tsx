import { useState, useEffect } from 'react';
import { Search, ShoppingCart, Plus, Trash2, Save, ArrowLeft, Check } from 'lucide-react';
import { supabase } from '../lib/supabase';
import ProductCard from './ProductCard';

interface Product {
  id: string;
  code: string;
  name: string;
  category: string;
  unit: string;
  base_price: number;
  description: string;
  index?: string;
  min_quantity: number;
  quantity_step: number;
  your_price?: number;
  promo_price?: number;
  final_price: number;
}

interface OrderItem {
  productId: string;
  productName: string;
  productIndex?: string;
  quantity: number;
  unit: string;
  unitPrice: number;
  totalPrice: number;
  minQuantity: number;
  quantityStep: number;
}

interface PriceListOrderListModeProps {
  storeId: string;
  userId: string;
  onOrderSaved: () => void;
  onCancel: () => void;
}

export default function PriceListOrderListMode({ storeId, userId, onOrderSaved, onCancel }: PriceListOrderListModeProps) {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [orderItems, setOrderItems] = useState<OrderItem[]>([]);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    loadProducts();
  }, []);

  const loadProducts = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('products')
        .select(`
          id, code, name, display_category, original_category, unit, base_price, description, index, min_quantity, quantity_step, tags,
          special_prices!left (
            your_price,
            promo_price
          )
        `)
        .eq('active', true)
        .eq('special_prices.store_id', storeId)
        .order('display_category', { ascending: true })
        .order('name', { ascending: true });

      if (error) throw error;

      const productsWithPrices = (data || []).map(p => {
        const yourPrice = (p as any).special_prices?.[0]?.your_price;
        const promoPrice = (p as any).special_prices?.[0]?.promo_price;
        const finalPrice = promoPrice || yourPrice || p.base_price;

        return {
          ...p,
          category: (p as any).display_category,
          your_price: yourPrice,
          promo_price: promoPrice,
          final_price: finalPrice,
        };
      });

      setProducts(productsWithPrices);
    } catch (error) {
      console.error('Error loading products:', error);
    } finally {
      setLoading(false);
    }
  };

  const categories = ['all', ...Array.from(new Set(products.map(p => p.category)))];

  const filteredProducts = products.filter(product => {
    const matchesSearch = product.name.toLowerCase().includes(search.toLowerCase()) ||
                         product.code.toLowerCase().includes(search.toLowerCase());
    const matchesCategory = selectedCategory === 'all' || product.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  const groupedProducts = filteredProducts.reduce((acc, product) => {
    if (!acc[product.category]) {
      acc[product.category] = [];
    }
    acc[product.category].push(product);
    return acc;
  }, {} as Record<string, Product[]>);

  const addToList = (product: Product) => {
    const existingItem = orderItems.find(item => item.productId === product.id);
    if (existingItem) {
      alert('Ten produkt jest już na liście');
      return;
    }

    setOrderItems([...orderItems, {
      productId: product.id,
      productName: product.name,
      productIndex: product.index,
      quantity: product.min_quantity,
      unit: product.unit,
      unitPrice: product.final_price,
      totalPrice: product.min_quantity * product.final_price,
      minQuantity: product.min_quantity,
      quantityStep: product.quantity_step,
    }]);
  };

  const removeFromList = (productId: string) => {
    setOrderItems(orderItems.filter(item => item.productId !== productId));
  };

  const updateQuantity = (productId: string, quantity: number) => {
    setOrderItems(orderItems.map(item => {
      if (item.productId === productId) {
        const newQuantity = Math.max(item.minQuantity, quantity);
        return {
          ...item,
          quantity: newQuantity,
          totalPrice: newQuantity * item.unitPrice,
        };
      }
      return item;
    }));
  };

  const adjustQuantity = (productId: string, delta: number) => {
    const item = orderItems.find(i => i.productId === productId);
    if (!item) return;

    const newQuantity = Math.max(item.minQuantity, item.quantity + delta);
    updateQuantity(productId, newQuantity);
  };

  const saveAsDraft = async () => {
    if (orderItems.length === 0) {
      alert('Dodaj przynajmniej jeden produkt');
      return;
    }

    setSaving(true);
    try {
      const orderNumber = `RO-${new Date().getFullYear()}-${String(Date.now()).slice(-6)}`;
      const totalAmount = orderItems.reduce((sum, item) => sum + item.totalPrice, 0);

      const { data: order, error: orderError } = await supabase
        .from('orders')
        .insert({
          order_number: orderNumber,
          store_id: storeId,
          created_by: userId,
          status: 'draft',
          requires_confirmation: false,
          total_amount: totalAmount,
          notes: 'Zamówienie z cennika - tryb lista',
        })
        .select()
        .single();

      if (orderError) throw orderError;

      const items = orderItems.map(item => ({
        order_id: order.id,
        product_id: item.productId,
        quantity: item.quantity,
        unit: item.unit,
        unit_price: item.unitPrice,
        total_price: item.totalPrice,
        status: 'pending',
      }));

      const { error: itemsError } = await supabase
        .from('order_items')
        .insert(items);

      if (itemsError) throw itemsError;

      await supabase.from('order_history').insert({
        order_id: order.id,
        action: 'created',
        performed_by: userId,
        details: { items_count: orderItems.length, source: 'price_list_list_mode' },
      });

      alert('Zamówienie zapisane jako szkic!');
      onOrderSaved();
    } catch (error) {
      console.error('Error saving draft:', error);
      alert('Błąd podczas zapisywania szkicu');
    } finally {
      setSaving(false);
    }
  };

  const totalAmount = orderItems.reduce((sum, item) => sum + item.totalPrice, 0);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-amber-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-gradient-to-r from-amber-500 to-orange-600 text-white p-4 sticky top-0 z-10">
        <button onClick={onCancel} className="flex items-center gap-2 mb-2 text-white">
          <ArrowLeft className="w-5 h-5" />
          <span>Anuluj</span>
        </button>
        <h2 className="text-xl font-bold">Buduj zamówienie z cennika</h2>
        <div className="flex items-center gap-2 mt-2">
          <ShoppingCart className="w-5 h-5" />
          <span className="text-amber-100">Wybrano: {orderItems.length}</span>
        </div>
      </div>

      <div className="flex gap-4 p-4">
        <div className="flex-1 space-y-4">
        <div className="bg-white rounded-lg shadow-lg p-4">
          <div className="relative mb-3">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
            <input
              type="text"
              placeholder="Szukaj produktu..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-10 pr-4 py-3 border-2 border-gray-200 rounded-lg focus:border-amber-500 focus:outline-none"
            />
          </div>

          <div className="flex gap-2 overflow-x-auto pb-2">
            {categories.map(cat => (
              <button
                key={cat}
                onClick={() => setSelectedCategory(cat)}
                className={`px-4 py-2 rounded-lg font-medium whitespace-nowrap transition ${
                  selectedCategory === cat
                    ? 'bg-amber-600 text-white'
                    : 'bg-gray-100 text-gray-700'
                }`}
              >
                {cat === 'all' ? 'Wszystkie' : cat}
              </button>
            ))}
          </div>
        </div>

        {Object.entries(groupedProducts).map(([category, items]) => (
          <div key={category} className="space-y-2">
            <h3 className="font-bold text-gray-700 px-2">{category}</h3>
            {items.map((product) => {
              const isAdded = orderItems.some(item => item.productId === product.id);
              return (
                <div key={product.id} className={`relative ${isAdded ? 'opacity-50' : ''}`}>
                  <ProductCard product={product}>
                    <button
                      onClick={() => addToList(product)}
                      disabled={isAdded}
                      className={`w-full py-2 rounded-lg font-medium transition flex items-center justify-center gap-2 ${
                        isAdded
                          ? 'bg-green-100 text-green-600 cursor-not-allowed'
                          : 'bg-amber-600 text-white hover:bg-amber-700'
                      }`}
                    >
                      {isAdded ? <Check className="w-5 h-5" /> : <Plus className="w-5 h-5" />}
                      {isAdded ? 'Dodano' : 'Dodaj do listy'}
                    </button>
                  </ProductCard>
                </div>
              );
            })}
          </div>
        ))}

        {filteredProducts.length === 0 && (
          <div className="text-center py-12 text-gray-500">
            Nie znaleziono produktów
          </div>
        )}
        </div>

        {orderItems.length > 0 && (
          <div className="w-96 space-y-3 sticky top-24 h-fit">
            <div className="bg-white rounded-lg shadow-lg p-4">
              <h3 className="font-semibold text-gray-800 mb-3">Lista produktów</h3>
              <div className="space-y-3 max-h-[calc(100vh-300px)] overflow-y-auto">
                {orderItems.map((item) => (
                  <div key={item.productId} className="bg-gray-50 rounded-lg p-3 space-y-2">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <h4 className="font-medium text-sm text-gray-800">{item.productName}</h4>
                        <p className="text-xs text-gray-600">
                          {item.unitPrice.toFixed(2)} PLN/{item.unit}
                        </p>
                        <p className="text-xs text-gray-500">
                          Min: {item.minQuantity} • Krok: {item.quantityStep}
                        </p>
                      </div>
                      <button
                        onClick={() => removeFromList(item.productId)}
                        className="p-1 text-red-600 hover:bg-red-100 rounded transition"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>

                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => adjustQuantity(item.productId, -item.quantityStep)}
                        className="p-2 bg-gray-200 hover:bg-gray-300 rounded transition"
                      >
                        <Plus className="w-4 h-4 rotate-45" />
                      </button>
                      <input
                        type="number"
                        value={item.quantity}
                        onChange={(e) => updateQuantity(item.productId, parseFloat(e.target.value) || item.minQuantity)}
                        className="flex-1 p-2 text-center border-2 border-gray-300 rounded focus:border-amber-500 focus:outline-none"
                        step={item.quantityStep}
                        min={item.minQuantity}
                      />
                      <button
                        onClick={() => adjustQuantity(item.productId, item.quantityStep)}
                        className="p-2 bg-gray-200 hover:bg-gray-300 rounded transition"
                      >
                        <Plus className="w-4 h-4" />
                      </button>
                    </div>

                    <div className="text-center p-2 bg-amber-50 rounded">
                      <span className="text-sm font-bold text-amber-600">
                        {item.totalPrice.toFixed(2)} PLN
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="bg-white rounded-lg shadow-lg p-4">
              <div className="flex justify-between items-center mb-3">
                <span className="font-semibold text-gray-700">Suma:</span>
                <span className="text-xl font-bold text-amber-600">{totalAmount.toFixed(2)} PLN</span>
              </div>
              <button
                onClick={saveAsDraft}
                disabled={saving}
                className="w-full py-3 bg-gradient-to-r from-amber-500 to-orange-600 text-white rounded-lg font-medium hover:from-amber-600 hover:to-orange-700 transition disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {saving ? (
                  <>
                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                    Zapisywanie...
                  </>
                ) : (
                  <>
                    <Save className="w-5 h-5" />
                    Zapisz jako szkic
                  </>
                )}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
