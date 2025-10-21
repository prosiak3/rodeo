import { useState, useEffect } from 'react';
import { DollarSign, Store, Search, Save, X, Percent, Tag as TagIcon, CheckSquare, Square, Trash2 } from 'lucide-react';
import { supabase } from '../lib/supabase';

interface Store {
  id: string;
  name: string;
  code: string;
  active: boolean;
}

interface Product {
  id: string;
  name: string;
  code: string;
  display_category: string;
  unit: string;
  base_price: number;
}

interface SpecialPrice {
  id?: string;
  store_id: string;
  product_id: string;
  your_price: number | null;
  promo_price: number | null;
  valid_from: string;
  valid_to: string | null;
  promo_10_plus_1: boolean;
}

export default function SpecialPricesManager() {
  const [stores, setStores] = useState<Store[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [selectedStore, setSelectedStore] = useState<string>('');
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(true);
  const [prices, setPrices] = useState<Record<string, SpecialPrice>>({});
  const [editingProduct, setEditingProduct] = useState<string | null>(null);
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [selectedProducts, setSelectedProducts] = useState<Set<string>>(new Set());
  const [showBulkPromoModal, setShowBulkPromoModal] = useState(false);
  const [bulkPromoConfig, setBulkPromoConfig] = useState({
    type: 'percentage' as 'percentage' | 'fixed',
    value: 10,
    enable10Plus1: false,
    validFrom: new Date().toISOString().split('T')[0],
    validTo: '',
  });
  const [bulkOperationLoading, setBulkOperationLoading] = useState(false);

  useEffect(() => {
    loadStores();
    loadProducts();
  }, []);

  useEffect(() => {
    if (selectedStore) {
      loadPricesForStore(selectedStore);
    }
  }, [selectedStore]);

  const loadStores = async () => {
    try {
      const { data, error } = await supabase
        .from('stores')
        .select('id, name, code, active')
        .eq('active', true)
        .order('name', { ascending: true });

      if (error) throw error;
      setStores(data || []);
      if (data && data.length > 0) {
        setSelectedStore(data[0].id);
      }
    } catch (error) {
      console.error('Error loading stores:', error);
    }
  };

  const loadProducts = async () => {
    try {
      const { data, error } = await supabase
        .from('products')
        .select('id, name, code, display_category, unit, base_price')
        .eq('active', true)
        .order('display_category', { ascending: true })
        .order('name', { ascending: true });

      if (error) throw error;
      setProducts(data || []);
    } catch (error) {
      console.error('Error loading products:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadPricesForStore = async (storeId: string) => {
    try {
      const { data, error } = await supabase
        .from('special_prices')
        .select('*')
        .eq('store_id', storeId);

      if (error) throw error;

      const pricesMap: Record<string, SpecialPrice> = {};
      (data || []).forEach((price: any) => {
        pricesMap[price.product_id] = price;
      });
      setPrices(pricesMap);
    } catch (error) {
      console.error('Error loading prices:', error);
    }
  };

  const startEdit = (productId: string) => {
    setEditingProduct(productId);
  };

  const cancelEdit = () => {
    setEditingProduct(null);
  };

  const savePrice = async (productId: string) => {
    if (!selectedStore) return;

    try {
      const priceData = prices[productId];

      if (priceData && priceData.id) {
        // Update existing price
        const { error } = await supabase
          .from('special_prices')
          .update({
            your_price: priceData.your_price,
            promo_price: priceData.promo_price,
            promo_10_plus_1: priceData.promo_10_plus_1,
            valid_from: priceData.valid_from,
            valid_to: priceData.valid_to,
          })
          .eq('id', priceData.id);

        if (error) throw error;
      } else if (priceData) {
        // Insert new price
        const { error } = await supabase
          .from('special_prices')
          .insert({
            store_id: selectedStore,
            product_id: productId,
            your_price: priceData.your_price,
            promo_price: priceData.promo_price,
            promo_10_plus_1: priceData.promo_10_plus_1,
            valid_from: priceData.valid_from || new Date().toISOString(),
            valid_to: priceData.valid_to,
          });

        if (error) throw error;
      }

      alert('Cena zapisana pomyślnie!');
      setEditingProduct(null);
      loadPricesForStore(selectedStore);
    } catch (error) {
      console.error('Error saving price:', error);
      alert('Błąd podczas zapisywania ceny');
    }
  };

  const updatePrice = (productId: string, field: keyof SpecialPrice, value: any) => {
    setPrices(prev => ({
      ...prev,
      [productId]: {
        ...prev[productId],
        store_id: selectedStore,
        product_id: productId,
        [field]: value,
      } as SpecialPrice,
    }));
  };

  const toggleProductSelection = (productId: string) => {
    setSelectedProducts(prev => {
      const newSet = new Set(prev);
      if (newSet.has(productId)) {
        newSet.delete(productId);
      } else {
        newSet.add(productId);
      }
      return newSet;
    });
  };

  const toggleSelectAll = () => {
    if (selectedProducts.size === filteredProducts.length) {
      setSelectedProducts(new Set());
    } else {
      setSelectedProducts(new Set(filteredProducts.map(p => p.id)));
    }
  };

  const handleBulkSetPromo = async () => {
    if (!selectedStore || selectedProducts.size === 0) return;

    setBulkOperationLoading(true);
    try {
      const updates = [];
      const inserts = [];

      for (const productId of selectedProducts) {
        const product = products.find(p => p.id === productId);
        if (!product) continue;

        const existingPrice = prices[productId];
        const basePrice = existingPrice?.your_price || product.base_price;

        let promoPrice: number;
        if (bulkPromoConfig.type === 'percentage') {
          promoPrice = basePrice * (1 - bulkPromoConfig.value / 100);
        } else {
          promoPrice = bulkPromoConfig.value;
        }

        promoPrice = Math.round(promoPrice * 100) / 100;

        const priceData = {
          store_id: selectedStore,
          product_id: productId,
          your_price: existingPrice?.your_price || null,
          promo_price: promoPrice,
          promo_10_plus_1: bulkPromoConfig.enable10Plus1,
          valid_from: bulkPromoConfig.validFrom || new Date().toISOString(),
          valid_to: bulkPromoConfig.validTo || null,
        };

        if (existingPrice?.id) {
          updates.push({
            id: existingPrice.id,
            ...priceData,
          });
        } else {
          inserts.push(priceData);
        }
      }

      if (updates.length > 0) {
        for (const update of updates) {
          const { error } = await supabase
            .from('special_prices')
            .update({
              your_price: update.your_price,
              promo_price: update.promo_price,
              promo_10_plus_1: update.promo_10_plus_1,
              valid_from: update.valid_from,
              valid_to: update.valid_to,
            })
            .eq('id', update.id);

          if (error) throw error;
        }
      }

      if (inserts.length > 0) {
        const { error } = await supabase
          .from('special_prices')
          .insert(inserts);

        if (error) throw error;
      }

      alert(`Pomyślnie ustawiono promocje dla ${selectedProducts.size} produktów`);
      setShowBulkPromoModal(false);
      setSelectedProducts(new Set());
      loadPricesForStore(selectedStore);
    } catch (error) {
      console.error('Error setting bulk promotions:', error);
      alert('Błąd podczas ustawiania promocji');
    } finally {
      setBulkOperationLoading(false);
    }
  };

  const handleBulkCancelPromo = async () => {
    if (!selectedStore || selectedProducts.size === 0) return;

    if (!confirm(`Czy na pewno chcesz anulować promocje dla ${selectedProducts.size} produktów?`)) {
      return;
    }

    setBulkOperationLoading(true);
    try {
      const priceIdsToUpdate = [];
      const productIdsToUpdate = [];

      for (const productId of selectedProducts) {
        const existingPrice = prices[productId];
        if (existingPrice?.id) {
          priceIdsToUpdate.push(existingPrice.id);
        }
        productIdsToUpdate.push(productId);
      }

      if (priceIdsToUpdate.length > 0) {
        const { error: priceError } = await supabase
          .from('special_prices')
          .update({
            promo_price: null,
            valid_to: new Date().toISOString(),
          })
          .in('id', priceIdsToUpdate);

        if (priceError) throw priceError;
      }

      if (productIdsToUpdate.length > 0) {
        const { error: productError } = await supabase
          .from('products')
          .update({
            promo_10_plus_1: false,
          })
          .in('id', productIdsToUpdate);

        if (productError) throw productError;
      }

      alert(`Pomyślnie anulowano promocje dla ${selectedProducts.size} produktów`);
      setSelectedProducts(new Set());
      loadPricesForStore(selectedStore);
    } catch (error) {
      console.error('Error canceling bulk promotions:', error);
      alert('Błąd podczas anulowania promocji');
    } finally {
      setBulkOperationLoading(false);
    }
  };

  const categories = ['all', ...Array.from(new Set(products.map(p => p.display_category)))].filter(Boolean);

  const filteredProducts = products.filter(product => {
    const matchesSearch = product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         product.code.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = categoryFilter === 'all' || product.display_category === categoryFilter;
    return matchesSearch && matchesCategory;
  });

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-amber-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <DollarSign className="w-8 h-8 text-amber-600" />
          <h2 className="text-2xl font-bold text-gray-800">Zarządzanie cenami specjalnymi</h2>
        </div>
      </div>

      {selectedProducts.size > 0 && (
        <div className="bg-amber-50 border border-amber-200 rounded-xl p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <CheckSquare className="w-5 h-5 text-amber-600" />
              <span className="font-semibold text-amber-900">
                Zaznaczono: {selectedProducts.size} {selectedProducts.size === 1 ? 'produkt' : 'produktów'}
              </span>
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => setShowBulkPromoModal(true)}
                disabled={bulkOperationLoading}
                className="px-4 py-2 bg-green-600 text-white rounded-lg font-medium hover:bg-green-700 transition disabled:opacity-50 flex items-center gap-2"
              >
                <Percent className="w-4 h-4" />
                Ustaw promocję
              </button>
              <button
                onClick={handleBulkCancelPromo}
                disabled={bulkOperationLoading}
                className="px-4 py-2 bg-red-600 text-white rounded-lg font-medium hover:bg-red-700 transition disabled:opacity-50 flex items-center gap-2"
              >
                <Trash2 className="w-4 h-4" />
                Anuluj promocję
              </button>
              <button
                onClick={() => setSelectedProducts(new Set())}
                className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg font-medium hover:bg-gray-300 transition"
              >
                Wyczyść zaznaczenie
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="bg-white rounded-xl shadow p-6">
        <div className="space-y-4 mb-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Wybierz sklep
            </label>
            <select
              value={selectedStore}
              onChange={(e) => setSelectedStore(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:border-amber-500 focus:outline-none"
            >
              {stores.map(store => (
                <option key={store.id} value={store.id}>
                  {store.name} ({store.code})
                </option>
              ))}
            </select>
          </div>

          <input
            type="text"
            placeholder="Szukaj produktu..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full p-3 border border-gray-300 rounded-lg focus:border-amber-500 focus:outline-none"
          />

          <div className="flex gap-2 flex-wrap">
            {categories.map(cat => (
              <button
                key={cat}
                onClick={() => setCategoryFilter(cat)}
                className={`px-4 py-2 rounded-lg font-medium transition ${
                  categoryFilter === cat
                    ? 'bg-amber-600 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                {cat === 'all' ? 'Wszystkie' : cat}
              </button>
            ))}
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b-2 border-gray-200">
                <th className="text-center py-3 px-2 text-sm font-semibold text-gray-700 w-12">
                  <button
                    onClick={toggleSelectAll}
                    className="p-1 hover:bg-gray-100 rounded transition"
                    title={selectedProducts.size === filteredProducts.length ? 'Odznacz wszystkie' : 'Zaznacz wszystkie'}
                  >
                    {selectedProducts.size === filteredProducts.length ? (
                      <CheckSquare className="w-5 h-5 text-amber-600" />
                    ) : (
                      <Square className="w-5 h-5 text-gray-400" />
                    )}
                  </button>
                </th>
                <th className="text-left py-3 px-2 text-sm font-semibold text-gray-700">Kod</th>
                <th className="text-left py-3 px-2 text-sm font-semibold text-gray-700">Nazwa produktu</th>
                <th className="text-right py-3 px-2 text-sm font-semibold text-gray-700">Cena bazowa</th>
                <th className="text-right py-3 px-2 text-sm font-semibold text-gray-700">Cena sklepu</th>
                <th className="text-right py-3 px-2 text-sm font-semibold text-gray-700">Cena promocyjna</th>
                <th className="text-center py-3 px-2 text-sm font-semibold text-gray-700">10+1</th>
                <th className="text-center py-3 px-2 text-sm font-semibold text-gray-700">Akcje</th>
              </tr>
            </thead>
            <tbody>
              {filteredProducts.map((product) => {
                const price = prices[product.id];
                const isEditing = editingProduct === product.id;
                const hasDiscount = price?.promo_price && price.promo_price < (price.your_price || product.base_price);
                const discountPercent = hasDiscount
                  ? Math.round(((price.your_price || product.base_price) - price.promo_price!) / (price.your_price || product.base_price) * 100)
                  : 0;

                return (
                  <tr key={product.id} className={`border-b border-gray-100 hover:bg-gray-50 ${selectedProducts.has(product.id) ? 'bg-amber-50' : ''}`}>
                    <td className="py-3 px-2 text-center">
                      <button
                        onClick={() => toggleProductSelection(product.id)}
                        className="p-1 hover:bg-gray-100 rounded transition"
                      >
                        {selectedProducts.has(product.id) ? (
                          <CheckSquare className="w-5 h-5 text-amber-600" />
                        ) : (
                          <Square className="w-5 h-5 text-gray-400" />
                        )}
                      </button>
                    </td>
                    <td className="py-3 px-2 text-sm font-mono">{product.code}</td>
                    <td className="py-3 px-2 text-sm">
                      <div>
                        <div className="font-medium">{product.name}</div>
                        <div className="text-xs text-gray-500">{product.display_category}</div>
                      </div>
                    </td>
                    <td className="py-3 px-2 text-sm text-right">
                      {product.base_price.toFixed(2)} / {product.unit}
                    </td>
                    <td className="py-3 px-2 text-sm text-right">
                      {isEditing ? (
                        <input
                          type="number"
                          value={price?.your_price || ''}
                          onChange={(e) => updatePrice(product.id, 'your_price', parseFloat(e.target.value) || null)}
                          className="w-24 p-1 border border-gray-300 rounded text-right"
                          step="0.01"
                          placeholder={product.base_price.toFixed(2)}
                        />
                      ) : (
                        <span className={price?.your_price ? 'font-semibold text-blue-600' : 'text-gray-400'}>
                          {price?.your_price ? price.your_price.toFixed(2) : '—'}
                        </span>
                      )}
                    </td>
                    <td className="py-3 px-2 text-sm text-right">
                      {isEditing ? (
                        <div className="flex flex-col gap-1">
                          <input
                            type="number"
                            value={price?.promo_price || ''}
                            onChange={(e) => updatePrice(product.id, 'promo_price', parseFloat(e.target.value) || null)}
                            className="w-24 p-1 border border-gray-300 rounded text-right"
                            step="0.01"
                            placeholder="Brak"
                          />
                        </div>
                      ) : (
                        <div className="flex flex-col items-end">
                          {price?.promo_price ? (
                            <>
                              <span className="font-semibold text-red-600">
                                {price.promo_price.toFixed(2)}
                              </span>
                              {hasDiscount && (
                                <span className="text-xs bg-red-100 text-red-700 px-2 py-0.5 rounded font-medium">
                                  -{discountPercent}%
                                </span>
                              )}
                            </>
                          ) : (
                            <span className="text-gray-400">—</span>
                          )}
                        </div>
                      )}
                    </td>
                    <td className="py-3 px-2 text-center">
                      {isEditing ? (
                        <input
                          type="checkbox"
                          checked={price?.promo_10_plus_1 || false}
                          onChange={(e) => updatePrice(product.id, 'promo_10_plus_1', e.target.checked)}
                          className="w-5 h-5 text-orange-600 border-gray-300 rounded focus:ring-orange-500"
                        />
                      ) : (
                        price?.promo_10_plus_1 ? (
                          <span className="text-xs bg-orange-100 text-orange-700 px-2 py-1 rounded font-medium">
                            10+1
                          </span>
                        ) : (
                          <span className="text-gray-400">—</span>
                        )
                      )}
                    </td>
                    <td className="py-3 px-2 text-center">
                      {isEditing ? (
                        <div className="flex items-center justify-center gap-2">
                          <button
                            onClick={() => savePrice(product.id)}
                            className="p-2 text-green-600 hover:bg-green-50 rounded-lg transition"
                            title="Zapisz"
                          >
                            <Save className="w-4 h-4" />
                          </button>
                          <button
                            onClick={cancelEdit}
                            className="p-2 text-gray-600 hover:bg-gray-100 rounded-lg transition"
                            title="Anuluj"
                          >
                            <X className="w-4 h-4" />
                          </button>
                        </div>
                      ) : (
                        <button
                          onClick={() => startEdit(product.id)}
                          className="p-2 text-amber-600 hover:bg-amber-50 rounded-lg transition"
                          title="Edytuj ceny"
                        >
                          <DollarSign className="w-4 h-4" />
                        </button>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {filteredProducts.length === 0 && (
          <div className="text-center py-8 text-gray-500">
            Nie znaleziono produktów
          </div>
        )}
      </div>

      <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
        <h3 className="font-semibold text-blue-900 mb-2">Informacje o cenach</h3>
        <ul className="space-y-1 text-sm text-blue-800">
          <li>• <strong>Cena bazowa</strong> - podstawowa cena produktu widoczna dla wszystkich</li>
          <li>• <strong>Cena sklepu</strong> - indywidualna cena negocjowana dla tego sklepu (jeśli nie ustawiona, używana jest cena bazowa)</li>
          <li>• <strong>Cena promocyjna</strong> - najniższa cena, pokazywana z rabatem procentowym</li>
          <li>• <strong>10+1</strong> - przy zamówieniu 10 sztuk, jedenasta gratis</li>
        </ul>
      </div>

      {showBulkPromoModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-gray-200">
              <div className="flex items-center justify-between">
                <h3 className="text-xl font-bold text-gray-800">Ustawianie promocji grupowej</h3>
                <button
                  onClick={() => setShowBulkPromoModal(false)}
                  className="text-gray-400 hover:text-gray-600 transition"
                >
                  <X className="w-6 h-6" />
                </button>
              </div>
              <p className="text-sm text-gray-600 mt-2">
                Ustaw promocję dla {selectedProducts.size} zaznaczonych produktów
              </p>
            </div>

            <div className="p-6 space-y-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Typ promocji
                </label>
                <div className="flex gap-4">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="radio"
                      checked={bulkPromoConfig.type === 'percentage'}
                      onChange={() => setBulkPromoConfig(prev => ({ ...prev, type: 'percentage' }))}
                      className="w-4 h-4 text-amber-600"
                    />
                    <span className="text-sm">Rabat procentowy</span>
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="radio"
                      checked={bulkPromoConfig.type === 'fixed'}
                      onChange={() => setBulkPromoConfig(prev => ({ ...prev, type: 'fixed' }))}
                      className="w-4 h-4 text-amber-600"
                    />
                    <span className="text-sm">Cena stała</span>
                  </label>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  {bulkPromoConfig.type === 'percentage' ? 'Wartość rabatu (%)' : 'Cena promocyjna (PLN)'}
                </label>
                <input
                  type="number"
                  value={bulkPromoConfig.value}
                  onChange={(e) => setBulkPromoConfig(prev => ({ ...prev, value: parseFloat(e.target.value) || 0 }))}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:border-amber-500 focus:outline-none"
                  step={bulkPromoConfig.type === 'percentage' ? '1' : '0.01'}
                  min="0"
                  max={bulkPromoConfig.type === 'percentage' ? '100' : undefined}
                />
              </div>

              <div>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={bulkPromoConfig.enable10Plus1}
                    onChange={(e) => setBulkPromoConfig(prev => ({ ...prev, enable10Plus1: e.target.checked }))}
                    className="w-5 h-5 text-orange-600 border-gray-300 rounded focus:ring-orange-500"
                  />
                  <span className="text-sm font-medium text-gray-700">Włącz promocję 10+1</span>
                </label>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Data rozpoczęcia
                  </label>
                  <input
                    type="date"
                    value={bulkPromoConfig.validFrom}
                    onChange={(e) => setBulkPromoConfig(prev => ({ ...prev, validFrom: e.target.value }))}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:border-amber-500 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Data zakończenia (opcjonalnie)
                  </label>
                  <input
                    type="date"
                    value={bulkPromoConfig.validTo}
                    onChange={(e) => setBulkPromoConfig(prev => ({ ...prev, validTo: e.target.value }))}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:border-amber-500 focus:outline-none"
                  />
                </div>
              </div>

              <div className="bg-gray-50 rounded-lg p-4">
                <h4 className="font-semibold text-gray-800 mb-2">Podgląd</h4>
                <div className="text-sm text-gray-600 space-y-1">
                  <p>
                    <strong>Typ:</strong>{' '}
                    {bulkPromoConfig.type === 'percentage'
                      ? `Rabat ${bulkPromoConfig.value}%`
                      : `Cena stała ${bulkPromoConfig.value.toFixed(2)} PLN`}
                  </p>
                  <p><strong>Promocja 10+1:</strong> {bulkPromoConfig.enable10Plus1 ? 'Tak' : 'Nie'}</p>
                  <p><strong>Produktów:</strong> {selectedProducts.size}</p>
                </div>
              </div>
            </div>

            <div className="p-6 border-t border-gray-200 flex justify-end gap-3">
              <button
                onClick={() => setShowBulkPromoModal(false)}
                className="px-6 py-2 bg-gray-200 text-gray-700 rounded-lg font-medium hover:bg-gray-300 transition"
              >
                Anuluj
              </button>
              <button
                onClick={handleBulkSetPromo}
                disabled={bulkOperationLoading}
                className="px-6 py-2 bg-green-600 text-white rounded-lg font-medium hover:bg-green-700 transition disabled:opacity-50"
              >
                {bulkOperationLoading ? 'Zapisywanie...' : 'Ustaw promocję'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
