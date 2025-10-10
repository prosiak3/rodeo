import { useState, useEffect } from 'react';
import { Search, ShoppingCart, Plus, Minus, Trash2, Save, ArrowLeft, Check, LayoutGrid, AlignJustify, ArrowUpAZ, ArrowDownAZ, ArrowUp, ArrowDown } from 'lucide-react';
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

type SortOption = 'name-asc' | 'name-desc' | 'price-asc' | 'price-desc';
type PriceLayout = 'horizontal' | 'vertical';

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
  const [sortBy, setSortBy] = useState<SortOption>('name-asc');
  const [priceLayout, setPriceLayout] = useState<PriceLayout>('horizontal');

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

  let filteredProducts = products.filter(product => {
    const matchesSearch = product.name.toLowerCase().includes(search.toLowerCase()) ||
                         product.code.toLowerCase().includes(search.toLowerCase());
    const matchesCategory = selectedCategory === 'all' || product.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  filteredProducts.sort((a, b) => {
    switch (sortBy) {
      case 'name-asc':
        return a.name.localeCompare(b.name);
      case 'name-desc':
        return b.name.localeCompare(a.name);
      case 'price-asc':
        return a.final_price - b.final_price;
      case 'price-desc':
        return b.final_price - a.final_price;
      default:
        return 0;
    }
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
    <div className="min-h-screen bg-gray-50 pb-20">
      <div className="bg-gradient-to-r from-amber-500 to-orange-600 text-white p-4">
        <button onClick={onCancel} className="flex items-center gap-2 mb-2 text-white hover:text-amber-100 transition">
          <ArrowLeft className="w-5 h-5" />
          <span>Wróć</span>
        </button>
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-xl font-bold">Buduj zamówienie z cennika</h2>
            <p className="text-amber-100 text-sm mt-1">Dodaj produkty do listy</p>
          </div>
          {orderItems.length > 0 && (
            <div className="bg-white/20 rounded-lg px-3 py-2 text-right">
              <p className="text-xs text-amber-100">Produkty</p>
              <p className="font-bold text-lg">{orderItems.length}</p>
            </div>
          )}
        </div>
      </div>

      <div className="p-3 space-y-3">
        {orderItems.length > 0 && (
          <div className="bg-white rounded-lg shadow-lg p-4">
            <div className="flex items-center justify-between mb-3">
              <h3 className="font-semibold text-lg flex items-center gap-2">
                <ShoppingCart className="w-5 h-5" />
                Twoje zamówienie
              </h3>
              <div className="text-right">
                <p className="text-xs text-gray-500">Wartość</p>
                <p className="font-bold text-amber-600 text-lg">{totalAmount.toFixed(2)} PLN</p>
              </div>
            </div>
            <div className="space-y-2 mb-4 max-h-[400px] overflow-y-auto">
              {orderItems.map((item) => (
                <div key={item.productId} className="flex items-center gap-2 p-2 bg-gray-50 rounded-lg">
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-sm truncate">{item.productName}</p>
                    <p className="text-xs text-gray-600">
                      {item.unitPrice.toFixed(2)} PLN/{item.unit}
                    </p>
                  </div>
                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => adjustQuantity(item.productId, -item.quantityStep)}
                      className="p-1 bg-gray-200 hover:bg-gray-300 rounded transition"
                    >
                      <Minus className="w-4 h-4" />
                    </button>
                    <input
                      type="number"
                      value={item.quantity}
                      onChange={(e) => updateQuantity(item.productId, parseFloat(e.target.value) || item.minQuantity)}
                      className="w-16 p-1 text-center text-sm border border-gray-300 rounded focus:border-amber-500 focus:outline-none"
                      step={item.quantityStep}
                      min={item.minQuantity}
                    />
                    <button
                      onClick={() => adjustQuantity(item.productId, item.quantityStep)}
                      className="p-1 bg-gray-200 hover:bg-gray-300 rounded transition"
                    >
                      <Plus className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => removeFromList(item.productId)}
                      className="p-1 bg-red-100 hover:bg-red-200 text-red-600 rounded transition ml-1"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
            <button
              onClick={saveAsDraft}
              disabled={saving}
              className="w-full py-3 bg-gradient-to-r from-amber-500 to-orange-600 text-white rounded-lg font-medium hover:from-amber-600 hover:to-orange-700 transition disabled:opacity-50 flex items-center justify-center gap-2 shadow"
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
        )}

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

          <div className="flex gap-2 items-center justify-between">
            <div className="flex gap-1 border-2 border-gray-200 rounded-lg overflow-hidden flex-shrink-0">
              <button
                onClick={() => setSortBy('name-asc')}
                className={`p-2 transition-all duration-200 ${
                  sortBy === 'name-asc'
                    ? 'bg-amber-600 text-white'
                    : 'bg-white text-gray-600 hover:bg-gray-100'
                }`}
                title="Nazwa A-Z"
              >
                <ArrowUpAZ className="w-5 h-5" />
              </button>
              <button
                onClick={() => setSortBy('name-desc')}
                className={`p-2 transition-all duration-200 ${
                  sortBy === 'name-desc'
                    ? 'bg-amber-600 text-white'
                    : 'bg-white text-gray-600 hover:bg-gray-100'
                }`}
                title="Nazwa Z-A"
              >
                <ArrowDownAZ className="w-5 h-5" />
              </button>
              <button
                onClick={() => setSortBy('price-asc')}
                className={`p-2 transition-all duration-200 ${
                  sortBy === 'price-asc'
                    ? 'bg-amber-600 text-white'
                    : 'bg-white text-gray-600 hover:bg-gray-100'
                }`}
                title="Cena rosnąco"
              >
                <ArrowUp className="w-5 h-5" />
              </button>
              <button
                onClick={() => setSortBy('price-desc')}
                className={`p-2 transition-all duration-200 ${
                  sortBy === 'price-desc'
                    ? 'bg-amber-600 text-white'
                    : 'bg-white text-gray-600 hover:bg-gray-100'
                }`}
                title="Cena malejąco"
              >
                <ArrowDown className="w-5 h-5" />
              </button>
            </div>

            <div className="flex gap-1 border-2 border-gray-200 rounded-lg overflow-hidden flex-shrink-0">
              <button
                onClick={() => setPriceLayout('horizontal')}
                className={`p-2 transition-all duration-200 ${
                  priceLayout === 'horizontal'
                    ? 'bg-amber-600 text-white'
                    : 'bg-white text-gray-600 hover:bg-gray-100'
                }`}
                title="Układ poziomy"
              >
                <AlignJustify className="w-5 h-5" />
              </button>
              <button
                onClick={() => setPriceLayout('vertical')}
                className={`p-2 transition-all duration-200 ${
                  priceLayout === 'vertical'
                    ? 'bg-amber-600 text-white'
                    : 'bg-white text-gray-600 hover:bg-gray-100'
                }`}
                title="Układ pionowy"
              >
                <LayoutGrid className="w-5 h-5" />
              </button>
            </div>
          </div>
        </div>

        {Object.entries(groupedProducts).map(([category, items]) => (
          <div key={category} className="space-y-2">
            <h3 className="font-bold text-gray-700 px-2">{category}</h3>
            {items.map((product) => {
              const isAdded = orderItems.some(item => item.productId === product.id);
              return (
                <div key={product.id} className={`relative ${isAdded ? 'opacity-50' : ''}`}>
                  <ProductCard product={product} priceLayout={priceLayout}>
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
    </div>
  );
}
