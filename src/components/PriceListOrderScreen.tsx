import { useState, useEffect } from 'react';
import { Search, ShoppingCart, Plus, Minus, Trash2, Save, ArrowLeft, LayoutGrid, AlignJustify } from 'lucide-react';
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
}

interface PriceListOrderScreenProps {
  storeId: string;
  userId: string;
  onOrderSent: () => void;
  onCancel: () => void;
}

export default function PriceListOrderScreen({ storeId, userId, onOrderSent, onCancel }: PriceListOrderScreenProps) {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [orderItems, setOrderItems] = useState<OrderItem[]>([]);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [quantity, setQuantity] = useState<string>('');
  const [sending, setSending] = useState(false);
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
          *,
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

  const selectProduct = (product: Product) => {
    setSelectedProduct(product);
    setQuantity(product.min_quantity.toString());
  };

  const adjustQuantity = (delta: number) => {
    if (!selectedProduct) return;
    const currentQty = parseFloat(quantity) || selectedProduct.min_quantity;
    const newQty = Math.max(selectedProduct.min_quantity, currentQty + delta);
    setQuantity(newQty.toString());
  };

  const addToOrder = () => {
    if (!selectedProduct || !quantity) return;

    const qty = parseFloat(quantity);
    if (isNaN(qty) || qty <= 0) {
      alert('Podaj prawidłową ilość');
      return;
    }

    if (qty < selectedProduct.min_quantity) {
      alert(`Minimalna ilość zamówienia: ${selectedProduct.min_quantity} ${selectedProduct.unit}`);
      return;
    }

    const remainder = (qty - selectedProduct.min_quantity) % selectedProduct.quantity_step;
    if (remainder !== 0) {
      alert(`Ilość musi być wielokrotnością ${selectedProduct.quantity_step} ${selectedProduct.unit} (od minimalnej ilości ${selectedProduct.min_quantity})`);
      return;
    }

    const totalPrice = qty * selectedProduct.final_price;

    const existingItemIndex = orderItems.findIndex(item => item.productId === selectedProduct.id);

    if (existingItemIndex >= 0) {
      const updated = [...orderItems];
      updated[existingItemIndex].quantity += qty;
      updated[existingItemIndex].totalPrice = updated[existingItemIndex].quantity * updated[existingItemIndex].unitPrice;
      setOrderItems(updated);
    } else {
      setOrderItems([...orderItems, {
        productId: selectedProduct.id,
        productName: selectedProduct.name,
        productIndex: selectedProduct.index,
        quantity: qty,
        unit: selectedProduct.unit,
        unitPrice: selectedProduct.final_price,
        totalPrice,
      }]);
    }

    setSelectedProduct(null);
    setQuantity('');
  };

  const updateQuantity = (index: number, newQuantity: number) => {
    if (newQuantity <= 0) {
      removeItem(index);
      return;
    }
    const updated = [...orderItems];
    updated[index].quantity = newQuantity;
    updated[index].totalPrice = newQuantity * updated[index].unitPrice;
    setOrderItems(updated);
  };

  const removeItem = (index: number) => {
    setOrderItems(orderItems.filter((_, i) => i !== index));
  };

  const sendOrder = async () => {
    if (orderItems.length === 0) {
      alert('Dodaj produkty do zamówienia');
      return;
    }

    setSending(true);
    try {
      const totalAmount = orderItems.reduce((sum, item) => sum + item.totalPrice, 0);
      const orderNumber = `RO-${Date.now()}`;

      const { data: order, error: orderError } = await supabase
        .from('orders')
        .insert({
          order_number: orderNumber,
          store_id: storeId,
          created_by: userId,
          status: 'draft',
          requires_confirmation: false,
          total_amount: totalAmount,
          notes: 'Zamówienie utworzone z cennika - tryb ilości',
        })
        .select()
        .single();

      if (orderError) throw orderError;

      const { error: itemsError } = await supabase
        .from('order_items')
        .insert(
          orderItems.map(item => ({
            order_id: order.id,
            product_id: item.productId,
            quantity: item.quantity,
            unit: item.unit,
            unit_price: item.unitPrice,
            total_price: item.totalPrice,
            status: 'pending',
          }))
        );

      if (itemsError) throw itemsError;

      await supabase.from('order_history').insert({
        order_id: order.id,
        action: 'created',
        performed_by: userId,
        details: {
          items_count: orderItems.length,
          source: 'price_list_quantity_mode',
        },
      });

      alert('Zamówienie zapisane jako szkic!');
      onOrderSent();
    } catch (error) {
      console.error('Error sending order:', error);
      alert('Błąd podczas wysyłania zamówienia');
    } finally {
      setSending(false);
    }
  };

  const totalAmount = orderItems.reduce((sum, item) => sum + item.totalPrice, 0);

  if (selectedProduct) {
    return (
      <div className="min-h-screen bg-gray-50 pb-20">
        <div className="bg-gradient-to-r from-amber-500 to-orange-600 text-white p-4">
          <button
            onClick={() => setSelectedProduct(null)}
            className="flex items-center gap-2 text-white mb-4 hover:text-amber-100 transition"
          >
            <ArrowLeft className="w-5 h-5" />
            Wróć do cennika
          </button>
          <h2 className="text-xl font-bold">Dodaj produkt</h2>
          <p className="text-amber-100 text-sm mt-1">Wprowadź ilość produktu</p>
        </div>

        <div className="p-6 space-y-6">
          <div className="bg-white rounded-xl shadow-lg p-6">
            <h3 className="font-semibold text-lg mb-4">{selectedProduct.name}</h3>
            <div className="space-y-3">
              <div>
                <p className="text-sm text-gray-600">Kategoria</p>
                <p className="font-medium">{selectedProduct.category}</p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Cena jednostkowa</p>
                <p className="font-bold text-amber-600 text-xl">
                  {selectedProduct.base_price.toFixed(2)} PLN/{selectedProduct.unit}
                </p>
              </div>
              {selectedProduct.index && (
                <div>
                  <p className="text-sm text-gray-600 mb-2">Kod produktu</p>
                  <div className="flex flex-col gap-2">
                    <svg className="w-full h-20" viewBox="0 0 300 80" preserveAspectRatio="xMinYMin meet">
                      {selectedProduct.index.split('').map((digit, i) => {
                        const barWidth = i % 2 === 0 ? 7 : 12;
                        const x = i * 24;
                        return (
                          <g key={i}>
                            <rect
                              x={x}
                              y="8"
                              width={barWidth}
                              height="55"
                              fill="#000"
                            />
                          </g>
                        );
                      })}
                    </svg>
                    <span className="font-mono text-base text-center tracking-wider">{selectedProduct.index}</span>
                  </div>
                </div>
              )}
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-lg p-6">
            <label className="block mb-2 font-medium">Ilość ({selectedProduct.unit})</label>
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 mb-4 text-sm">
              <p className="text-blue-800">
                <span className="font-medium">Minimalna ilość:</span> {selectedProduct.min_quantity} {selectedProduct.unit}
              </p>
              <p className="text-blue-800">
                <span className="font-medium">Krok zamówienia:</span> {selectedProduct.quantity_step} {selectedProduct.unit}
              </p>
            </div>
            <div className="flex items-center gap-3">
              <button
                onClick={() => adjustQuantity(-selectedProduct.quantity_step)}
                className="p-4 bg-gray-200 hover:bg-gray-300 rounded-lg transition"
                type="button"
              >
                <Minus className="w-6 h-6" />
              </button>
              <input
                type="number"
                value={quantity}
                onChange={(e) => setQuantity(e.target.value)}
                placeholder="Wprowadź ilość"
                step={selectedProduct.quantity_step}
                min={selectedProduct.min_quantity}
                className="flex-1 p-4 text-xl text-center border-2 border-gray-300 rounded-lg focus:border-amber-500 focus:outline-none"
                autoFocus
              />
              <button
                onClick={() => adjustQuantity(selectedProduct.quantity_step)}
                className="p-4 bg-gray-200 hover:bg-gray-300 rounded-lg transition"
                type="button"
              >
                <Plus className="w-6 h-6" />
              </button>
            </div>
            {quantity && parseFloat(quantity) > 0 && (
              <div className="mt-4 p-3 bg-amber-50 rounded-lg">
                <p className="text-sm text-gray-600">Wartość pozycji</p>
                <p className="text-xl font-bold text-amber-600">
                  {(parseFloat(quantity) * selectedProduct.base_price).toFixed(2)} PLN
                </p>
              </div>
            )}
          </div>

          <button
            onClick={addToOrder}
            disabled={!quantity || parseFloat(quantity) <= 0}
            className="w-full py-4 bg-gradient-to-r from-amber-500 to-orange-600 text-white rounded-xl font-medium hover:from-amber-600 hover:to-orange-700 transition flex items-center justify-center gap-2 shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Plus className="w-5 h-5" />
            Dodaj do zamówienia
          </button>
        </div>
      </div>
    );
  }

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
        <button
          onClick={onCancel}
          className="flex items-center gap-2 text-white mb-4 hover:text-amber-100 transition"
        >
          <ArrowLeft className="w-5 h-5" />
          Wróć
        </button>
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-xl font-bold">Zamówienie z cennika</h2>
            <p className="text-amber-100 text-sm mt-1">Wybierz produkty i wprowadź ilości</p>
          </div>
          {orderItems.length > 0 && (
            <div className="bg-white/20 rounded-lg px-3 py-2 text-right">
              <p className="text-xs text-amber-100">Koszyk</p>
              <p className="font-bold text-lg">{orderItems.length}</p>
            </div>
          )}
        </div>
      </div>

      <div className="p-3 space-y-3 max-w-2xl mx-auto">
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
            <div className="space-y-2 mb-4">
              {orderItems.map((item, index) => (
                <div key={index} className="flex items-center gap-2 p-2 bg-gray-50 rounded-lg overflow-hidden">
                  <div className="flex-1 min-w-0 overflow-hidden">
                    <p className="font-medium text-sm truncate">{item.productName}</p>
                    <p className="text-xs text-gray-600 truncate">
                      {item.quantity} {item.unit} × {item.unitPrice.toFixed(2)} PLN
                    </p>
                  </div>
                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => updateQuantity(index, item.quantity - 1)}
                      className="p-1 bg-gray-200 hover:bg-gray-300 rounded transition"
                    >
                      <Minus className="w-4 h-4" />
                    </button>
                    <span className="font-medium text-sm px-2">{item.quantity}</span>
                    <button
                      onClick={() => updateQuantity(index, item.quantity + 1)}
                      className="p-1 bg-gray-200 hover:bg-gray-300 rounded transition"
                    >
                      <Plus className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => removeItem(index)}
                      className="p-1 bg-red-100 hover:bg-red-200 text-red-600 rounded transition ml-1"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
            <button
              onClick={sendOrder}
              disabled={sending}
              className="w-full py-3 bg-gradient-to-r from-amber-500 to-orange-600 text-white rounded-lg font-medium hover:from-amber-600 hover:to-orange-700 transition flex items-center justify-center gap-2 shadow disabled:opacity-50"
            >
              <Save className="w-5 h-5" />
              {sending ? 'Zapisywanie...' : 'Zapisz jako szkic'}
            </button>
          </div>
        )}

        <div className="bg-white rounded-lg shadow p-3 sticky top-0 z-10">
          <div className="flex items-center gap-2 mb-3">
            <Search className="w-4 h-4 text-gray-400 flex-shrink-0" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Szukaj produktu..."
              className="flex-1 px-2 py-1 text-sm border border-gray-300 rounded focus:ring-1 focus:ring-amber-500 focus:border-transparent"
            />
          </div>

          <div className="flex gap-2 items-center justify-between">
            <div className="flex gap-2 items-center text-xs flex-1 min-w-0">
              <span className="text-gray-600 flex-shrink-0">Sortuj:</span>
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as SortOption)}
                className="flex-1 px-2 py-1 border border-gray-300 rounded text-xs focus:ring-1 focus:ring-amber-500 focus:border-transparent"
              >
                <option value="name-asc">Nazwa A-Z</option>
                <option value="name-desc">Nazwa Z-A</option>
                <option value="price-asc">Cena rosnąco</option>
                <option value="price-desc">Cena malejąco</option>
              </select>
            </div>

            <div className="flex gap-1 border border-gray-300 rounded overflow-hidden flex-shrink-0">
              <button
                onClick={() => setPriceLayout('horizontal')}
                className={`p-1.5 transition ${
                  priceLayout === 'horizontal'
                    ? 'bg-amber-600 text-white'
                    : 'bg-white text-gray-600 hover:bg-gray-100'
                }`}
                title="Układ poziomy"
              >
                <AlignJustify className="w-4 h-4" />
              </button>
              <button
                onClick={() => setPriceLayout('vertical')}
                className={`p-1.5 transition ${
                  priceLayout === 'vertical'
                    ? 'bg-amber-600 text-white'
                    : 'bg-white text-gray-600 hover:bg-gray-100'
                }`}
                title="Układ pionowy"
              >
                <LayoutGrid className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>

        {filteredProducts.length === 0 ? (
          <div className="bg-white rounded-lg shadow p-8 text-center">
            <p className="text-gray-500">Nie znaleziono produktów</p>
          </div>
        ) : (
          <div className="space-y-2">
            {Object.entries(groupedProducts).map(([category, categoryProducts]) => (
              <div key={category} className="bg-white rounded-lg shadow">
                <div className="bg-amber-50 px-3 py-2 border-b border-amber-100">
                  <h3 className="font-semibold text-sm text-amber-900">{category}</h3>
                </div>
                <div className="divide-y divide-gray-100">
                  {categoryProducts.map((product) => (
                    <div key={product.id} className="p-2">
                      <ProductCard product={product} onSelect={() => selectProduct(product)} priceLayout={priceLayout} />
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
