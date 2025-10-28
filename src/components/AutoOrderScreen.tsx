import { useState, useEffect } from 'react';
import { Sparkles, RefreshCw, Plus, Trash2, Save, AlertCircle, Loader2, TrendingUp, TrendingDown, Minus } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { showSuccess, showError } from '../lib/alerts';

interface AutoOrderProduct {
  product_id: string;
  name: string;
  code: string;
  category: string;
  unit: string;
  base_price: number;
  index?: string;
  average_weight?: number;
  suggested_quantity: number;
  last_ordered_days_ago: number;
  avg_cycle_days: number;
  trend: 'increasing' | 'stable' | 'decreasing' | 'unknown';
  priority: 'urgent' | 'high' | 'medium' | 'low';
  confidence: number;
  total_orders_count: number;
}

interface AutoOrderSuggestion {
  store_id: string;
  products: AutoOrderProduct[];
  metadata: {
    generated_at: string;
    based_on_orders_count: number;
    analysis_period_days: number;
    products_count: number;
    algorithm_version: string;
  };
  cached?: boolean;
  cache_generated_at?: string;
  generation_time_ms?: number;
  error?: string;
  message?: string;
  orders_analyzed?: number;
}

interface AutoOrderScreenProps {
  storeId: string;
  userId: string;
  onOrderSent: () => void;
  onCancel: () => void;
}

export default function AutoOrderScreen({ storeId, userId, onOrderSent, onCancel }: AutoOrderScreenProps) {
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [suggestion, setSuggestion] = useState<AutoOrderSuggestion | null>(null);
  const [orderItems, setOrderItems] = useState<Map<string, number>>(new Map());
  const [notes, setNotes] = useState('');
  const [sending, setSending] = useState(false);
  const [showAddProduct, setShowAddProduct] = useState(false);
  const [availableProducts, setAvailableProducts] = useState<any[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [showDeleteIcons, setShowDeleteIcons] = useState(false);

  useEffect(() => {
    loadUserPreferences();
    loadSuggestion();
    loadAvailableProducts();
  }, [storeId]);

  const loadUserPreferences = async () => {
    const { data } = await supabase
      .from('users')
      .select('show_delete_icons')
      .eq('id', userId)
      .single();

    if (data?.show_delete_icons !== null && data?.show_delete_icons !== undefined) {
      setShowDeleteIcons(data.show_delete_icons);
    }
  };

  useEffect(() => {
    if (suggestion?.products) {
      const items = new Map<string, number>();
      suggestion.products.forEach(p => {
        // Zaokrąglij wszystkie ilości do pełnych liczb
        items.set(p.product_id, Math.ceil(p.suggested_quantity));
      });
      setOrderItems(items);
    }
  }, [suggestion]);

  const loadSuggestion = async () => {
    setLoading(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        showError('Sesja wygasła');
        return;
      }

      const apiUrl = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/auto-order-suggestion/${storeId}`;

      const response = await fetch(apiUrl, {
        headers: {
          'Authorization': `Bearer ${session.access_token}`,
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error('Nie udało się pobrać propozycji');
      }

      const data = await response.json();
      setSuggestion(data);

      if (data.error === 'insufficient_data') {
        showError(data.message || 'Zbyt mało danych historycznych');
      }
    } catch (error) {
      console.error('Error loading suggestion:', error);
      showError('Błąd podczas ładowania propozycji');
    } finally {
      setLoading(false);
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        showError('Sesja wygasła');
        return;
      }

      const apiUrl = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/auto-order-suggestion/${storeId}`;

      const response = await fetch(apiUrl, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${session.access_token}`,
          'Content-Type': 'application/json',
        },
      });

      const data = await response.json();

      if (response.status === 429) {
        showError(data.message || 'Osiągnięto limit odświeżeń');
        return;
      }

      if (!response.ok) {
        throw new Error(data.error || 'Nie udało się wygenerować propozycji');
      }

      setSuggestion(data);
      showSuccess('Propozycja zaktualizowana!');
    } catch (error) {
      console.error('Error refreshing suggestion:', error);
      showError('Błąd podczas odświeżania propozycji');
    } finally {
      setRefreshing(false);
    }
  };

  const loadAvailableProducts = async () => {
    try {
      const { data, error } = await supabase
        .from('products')
        .select('*')
        .eq('active', true)
        .order('name');

      if (error) throw error;
      setAvailableProducts(data || []);
    } catch (error) {
      console.error('Error loading products:', error);
    }
  };

  const updateQuantity = (productId: string, newQuantity: number) => {
    const newItems = new Map(orderItems);
    // Zaokrąglij do pełnych liczb
    const roundedQuantity = Math.ceil(newQuantity);
    if (roundedQuantity <= 0) {
      newItems.delete(productId);
    } else {
      newItems.set(productId, roundedQuantity);
    }
    setOrderItems(newItems);
  };

  const removeProduct = (productId: string) => {
    const newItems = new Map(orderItems);
    newItems.delete(productId);
    setOrderItems(newItems);
  };

  const addManualProduct = (product: any) => {
    const newItems = new Map(orderItems);
    newItems.set(product.id, 1);
    setOrderItems(newItems);
    setShowAddProduct(false);
    setSearchQuery('');
  };

  const handleSendOrder = async (asDraft = false) => {
    if (orderItems.size === 0) {
      showError('Dodaj przynajmniej jeden produkt');
      return;
    }

    setSending(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Brak autoryzacji');

      const orderNumber = `AO-${Date.now()}`;

      const { data: order, error: orderError } = await supabase
        .from('orders')
        .insert({
          order_number: orderNumber,
          store_id: storeId,
          created_by: userId,
          status: asDraft ? 'draft' : 'sent',
          requires_confirmation: false,
          total_amount: 0,
          notes: notes || 'Wygenerowane automatycznie',
          source_type: 'auto',
          sent_at: asDraft ? null : new Date().toISOString(),
        })
        .select()
        .single();

      if (orderError) throw orderError;

      const itemsToInsert = [];
      for (const [productId, quantity] of orderItems.entries()) {
        const product = suggestion?.products.find(p => p.product_id === productId) ||
                       availableProducts.find(p => p.id === productId);

        if (product) {
          const unitPrice = product.base_price || 0;
          itemsToInsert.push({
            order_id: order.id,
            product_id: productId,
            quantity: quantity,
            unit: product.unit,
            unit_price: unitPrice,
            total_price: quantity * unitPrice,
            status: 'pending',
          });
        }
      }

      const { error: itemsError } = await supabase
        .from('order_items')
        .insert(itemsToInsert);

      if (itemsError) throw itemsError;

      const totalAmount = itemsToInsert.reduce((sum, item) => sum + item.total_price, 0);

      await supabase
        .from('orders')
        .update({ total_amount: totalAmount })
        .eq('id', order.id);

      showSuccess(asDraft ? 'Zapisano do koszyka' : 'Zamówienie wysłane!');
      onOrderSent();
    } catch (error) {
      console.error('Error sending order:', error);
      showError('Błąd podczas wysyłania zamówienia');
    } finally {
      setSending(false);
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'urgent': return 'text-red-600 bg-red-50 border-red-200';
      case 'high': return 'text-orange-600 bg-orange-50 border-orange-200';
      case 'medium': return 'text-yellow-600 bg-yellow-50 border-yellow-200';
      case 'low': return 'text-green-600 bg-green-50 border-green-200';
      default: return 'text-gray-600 bg-gray-50 border-gray-200';
    }
  };

  const getPriorityLabel = (priority: string) => {
    switch (priority) {
      case 'urgent': return 'Pilne';
      case 'high': return 'Wysoki';
      case 'medium': return 'Średni';
      case 'low': return 'Niski';
      default: return '';
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center">
          <Loader2 className="w-12 h-12 text-amber-600 animate-spin mx-auto mb-4" />
          <p className="text-gray-600">Ładowanie propozycji zamówienia...</p>
        </div>
      </div>
    );
  }

  if (suggestion?.error === 'insufficient_data') {
    return (
      <div className="p-6">
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6 text-center">
          <AlertCircle className="w-12 h-12 text-yellow-600 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-yellow-900 mb-2">Zbyt mało danych</h3>
          <p className="text-yellow-800 mb-4">
            {suggestion.message || 'Potrzeba minimum 5 historycznych zamówień do wygenerowania propozycji'}
          </p>
          <p className="text-sm text-yellow-700 mb-4">
            Przeanalizowano: {suggestion.orders_analyzed || 0} zamówień
          </p>
          <button
            onClick={onCancel}
            className="bg-yellow-600 text-white px-6 py-2 rounded-lg hover:bg-yellow-700"
          >
            Wróć
          </button>
        </div>
      </div>
    );
  }

  const groupedProducts = suggestion?.products.reduce((acc, product) => {
    const category = product.category || 'Inne';
    if (!acc[category]) acc[category] = [];
    acc[category].push(product);
    return acc;
  }, {} as Record<string, AutoOrderProduct[]>) || {};

  const filteredAvailableProducts = availableProducts.filter(p =>
    !orderItems.has(p.id) &&
    (searchQuery ? p.name.toLowerCase().includes(searchQuery.toLowerCase()) : true)
  );

  const totalAmount = Array.from(orderItems.entries()).reduce((sum, [productId, quantity]) => {
    const product = suggestion?.products.find(p => p.product_id === productId) ||
                   availableProducts.find(p => p.id === productId);
    return sum + (quantity * (product?.base_price || 0));
  }, 0);

  return (
    <div className="flex flex-col h-full bg-gray-50">
      <div className="bg-gradient-to-r from-amber-500 to-orange-600 text-white p-4 shadow-lg">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2">
            <Sparkles className="w-6 h-6" />
            <h2 className="text-xl font-bold">Auto Zamówienie</h2>
          </div>
          <button
            onClick={handleRefresh}
            disabled={refreshing}
            className="flex items-center gap-2 bg-white/20 hover:bg-white/30 px-3 py-1.5 rounded-lg transition disabled:opacity-50"
          >
            <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} />
            <span className="text-sm">Generuj ponownie</span>
          </button>
        </div>
        <div className="text-sm opacity-90 space-y-1">
          <div className="flex items-center gap-2">
            {suggestion?.cached ? (
              <>
                <span className="px-2 py-0.5 bg-white/20 rounded text-xs font-medium">CACHE</span>
                <span>z {new Date(suggestion.cache_generated_at!).toLocaleString('pl-PL')}</span>
              </>
            ) : (
              <>
                <span className="px-2 py-0.5 bg-green-400/30 rounded text-xs font-medium">ŚWIEŻE</span>
                <span>Świeżo wygenerowana propozycja</span>
              </>
            )}
          </div>
          <p className="font-medium">
            📊 Okres analizy: {
              suggestion?.metadata.analysis_period_days === 90 ? '90 dni (3 miesiące)' :
              suggestion?.metadata.analysis_period_days === 180 ? '180 dni (6 miesięcy)' :
              suggestion?.metadata.analysis_period_days === 270 ? '270 dni (9 miesięcy)' :
              suggestion?.metadata.analysis_period_days === 365 ? '365 dni (1 rok)' :
              `${suggestion?.metadata.analysis_period_days || 180} dni`
            }
          </p>
          <p>
            Przeanalizowano {suggestion?.metadata.based_on_orders_count || 0} {
              ((suggestion?.metadata.based_on_orders_count || 0) === 1) ? 'zamówienie' :
              ((suggestion?.metadata.based_on_orders_count || 0) >= 2 && (suggestion?.metadata.based_on_orders_count || 0) <= 4) ? 'zamówienia' :
              'zamówień'
            }
          </p>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-4 pb-32">
        {Object.entries(groupedProducts).map(([category, products]) => (
          <div key={category} className="mb-6">
            <h3 className="font-semibold text-lg text-gray-800 mb-3 flex items-center gap-2">
              <span className="w-1 h-6 bg-amber-500 rounded"></span>
              {category}
            </h3>
            <div className="space-y-3">
              {products.map(product => {
                const quantity = orderItems.get(product.product_id) || 0;
                if (quantity === 0) return null;

                return (
                  <div key={product.product_id} className={`bg-white rounded-lg p-3 shadow-sm border-l-4 ${getPriorityColor(product.priority)}`}>
                    <div className="flex items-center justify-between gap-3">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <h4 className="font-medium text-gray-900 text-sm truncate">{product.name}</h4>
                          {product.trend === 'increasing' && (
                            <TrendingUp className="w-3 h-3 text-green-600 flex-shrink-0" />
                          )}
                          {product.trend === 'decreasing' && (
                            <TrendingDown className="w-3 h-3 text-red-600 flex-shrink-0" />
                          )}
                        </div>
                      </div>
                      <div className="flex items-center gap-3 flex-shrink-0">
                        <div className="flex items-center gap-1 bg-gray-100 rounded-lg">
                          <button
                            onClick={() => updateQuantity(product.product_id, Math.max(1, Math.ceil(quantity) - 1))}
                            className="p-1.5 hover:bg-gray-200 rounded-l-lg"
                          >
                            <Minus className="w-3 h-3" />
                          </button>
                          <input
                            type="number"
                            value={Math.ceil(quantity)}
                            onChange={(e) => updateQuantity(product.product_id, Math.ceil(parseFloat(e.target.value) || 0))}
                            className="w-12 text-center text-sm bg-transparent border-none focus:outline-none"
                            step="1"
                          />
                          <span className="text-xs text-gray-600 pr-1">{product.unit}</span>
                          <button
                            onClick={() => updateQuantity(product.product_id, Math.ceil(quantity) + 1)}
                            className="p-1.5 hover:bg-gray-200 rounded-r-lg"
                          >
                            <Plus className="w-3 h-3" />
                          </button>
                        </div>
                        <span className="text-xs text-gray-700 w-16 text-right">
                          {(Math.ceil(quantity) * product.base_price).toFixed(2)} zł
                        </span>
                        {showDeleteIcons && (
                          <button
                            onClick={() => removeProduct(product.product_id)}
                            className="p-1.5 text-red-600 hover:bg-red-50 rounded-lg"
                          >
                            <Trash2 className="w-3 h-3" />
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        ))}

        <button
          onClick={() => setShowAddProduct(true)}
          className="w-full p-4 border-2 border-dashed border-gray-300 rounded-lg text-gray-600 hover:border-amber-500 hover:text-amber-600 transition flex items-center justify-center gap-2"
        >
          <Plus className="w-5 h-5" />
          Dodaj produkt ręcznie
        </button>

        <div className="mt-6">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Notatki (opcjonalnie)
          </label>
          <textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-amber-500"
            rows={3}
            placeholder="Dodatkowe informacje..."
          />
        </div>
      </div>

      <div className="fixed bottom-16 left-0 right-0 bg-white border-t border-gray-200 p-4 shadow-lg">
        <div className="flex items-center justify-between mb-3">
          <span className="text-lg font-semibold text-gray-800">Razem:</span>
          <span className="text-2xl font-bold text-amber-600">{totalAmount.toFixed(2)} zł</span>
        </div>
        <div className="flex gap-2">
          <button
            onClick={onCancel}
            className="flex-1 px-4 py-2.5 border-2 border-gray-300 rounded-lg text-gray-700 font-medium hover:bg-gray-50 transition"
          >
            Anuluj
          </button>
          <button
            onClick={() => handleSendOrder(true)}
            disabled={sending || orderItems.size === 0}
            className="flex-1 px-4 py-5 bg-gradient-to-r from-amber-500 to-orange-600 text-white rounded-lg font-semibold hover:from-amber-600 hover:to-orange-700 transition shadow-lg active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            <Save className="w-5 h-5" />
            Dodaj do koszyka
          </button>
        </div>
      </div>

      {showAddProduct && (
        <div className="fixed inset-0 bg-black/50 flex items-end justify-center z-50">
          <div className="bg-white rounded-t-2xl w-full max-h-[80vh] flex flex-col">
            <div className="p-4 border-b">
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-lg font-semibold">Dodaj produkt</h3>
                <button
                  onClick={() => {
                    setShowAddProduct(false);
                    setSearchQuery('');
                  }}
                  className="text-gray-500 hover:text-gray-700"
                >
                  ✕
                </button>
              </div>
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Szukaj produktu..."
                className="w-full p-2 border border-gray-300 rounded-lg"
              />
            </div>
            <div className="flex-1 overflow-y-auto p-4">
              {filteredAvailableProducts.map(product => (
                <button
                  key={product.id}
                  onClick={() => addManualProduct(product)}
                  className="w-full p-3 text-left border border-gray-200 rounded-lg hover:bg-gray-50 mb-2"
                >
                  <p className="font-medium">{product.name}</p>
                  <p className="text-sm text-gray-600">{product.unit} • {product.base_price} zł</p>
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {refreshing && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-8 text-center max-w-sm">
            <Loader2 className="w-16 h-16 text-amber-600 animate-spin mx-auto mb-4" />
            <h3 className="text-lg font-semibold mb-2">Generowanie propozycji</h3>
            <p className="text-gray-600 text-sm">Analizuję historię zamówień...</p>
            <p className="text-gray-500 text-xs mt-2">To może potrwać 5-10 sekund</p>
          </div>
        </div>
      )}
    </div>
  );
}
