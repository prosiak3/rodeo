import { useState, useEffect } from 'react';
import { Package, Save, X, Plus, Edit2, Trash2, Search, DollarSign } from 'lucide-react';
import { supabase } from '../lib/supabase';

interface PriceList {
  id: string;
  name: string;
  description: string | null;
}

interface Product {
  id: string;
  name: string;
  code: string;
  display_category: string;
  unit: string;
}

interface PriceListItem {
  id: string;
  product_id: string;
  product_name: string;
  product_code: string;
  product_category: string;
  product_unit: string;
  price: number;
}

interface PriceListProductsManagerProps {
  priceListId: string;
  onBack: () => void;
}

export default function PriceListProductsManager({ priceListId, onBack }: PriceListProductsManagerProps) {
  const [priceList, setPriceList] = useState<PriceList | null>(null);
  const [items, setItems] = useState<PriceListItem[]>([]);
  const [allProducts, setAllProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editPrice, setEditPrice] = useState<string>('');
  const [showAddForm, setShowAddForm] = useState(false);
  const [selectedProducts, setSelectedProducts] = useState<string[]>([]);
  const [defaultPrice, setDefaultPrice] = useState<string>('');
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('all');

  useEffect(() => {
    loadData();
  }, [priceListId]);

  const loadData = async () => {
    try {
      const [priceListRes, itemsRes, productsRes] = await Promise.all([
        supabase
          .from('price_lists')
          .select('id, name, description')
          .eq('id', priceListId)
          .single(),
        supabase
          .from('price_list_items')
          .select(`
            id,
            product_id,
            price,
            products (name, code, display_category, unit)
          `)
          .eq('price_list_id', priceListId)
          .order('products(display_category)', { ascending: true })
          .order('products(name)', { ascending: true }),
        supabase
          .from('products')
          .select('id, name, code, display_category, unit')
          .eq('active', true)
          .order('display_category')
          .order('name'),
      ]);

      if (priceListRes.error) throw priceListRes.error;
      if (itemsRes.error) throw itemsRes.error;
      if (productsRes.error) throw productsRes.error;

      setPriceList(priceListRes.data);

      const formattedItems = (itemsRes.data || []).map((item: any) => ({
        id: item.id,
        product_id: item.product_id,
        product_name: item.products?.name || 'Nieznany',
        product_code: item.products?.code || '',
        product_category: item.products?.display_category || '',
        product_unit: item.products?.unit || 'kg',
        price: item.price,
      }));

      setItems(formattedItems);
      setAllProducts(productsRes.data || []);
    } catch (error) {
      console.error('Error loading data:', error);
      alert('Błąd podczas wczytywania danych');
    } finally {
      setLoading(false);
    }
  };

  const handleEditPrice = (itemId: string, currentPrice: number) => {
    setEditingId(itemId);
    setEditPrice(currentPrice.toString());
  };

  const handleSavePrice = async (itemId: string) => {
    const price = parseFloat(editPrice);
    if (isNaN(price) || price < 0) {
      alert('Wprowadź prawidłową cenę');
      return;
    }

    try {
      const { error } = await supabase
        .from('price_list_items')
        .update({ price })
        .eq('id', itemId);

      if (error) throw error;

      setEditingId(null);
      setEditPrice('');
      loadData();
    } catch (error) {
      console.error('Error updating price:', error);
      alert('Błąd podczas aktualizacji ceny');
    }
  };

  const handleCancelEdit = () => {
    setEditingId(null);
    setEditPrice('');
  };

  const handleDeleteItem = async (itemId: string) => {
    if (!confirm('Czy na pewno chcesz usunąć ten produkt z cennika?')) return;

    try {
      const { error } = await supabase
        .from('price_list_items')
        .delete()
        .eq('id', itemId);

      if (error) throw error;
      loadData();
    } catch (error) {
      console.error('Error deleting item:', error);
      alert('Błąd podczas usuwania produktu');
    }
  };

  const handleAddProducts = async () => {
    if (selectedProducts.length === 0) {
      alert('Wybierz co najmniej jeden produkt');
      return;
    }

    const price = defaultPrice ? parseFloat(defaultPrice) : null;
    if (defaultPrice && (price === null || isNaN(price) || price < 0)) {
      alert('Wprowadź prawidłową cenę domyślną');
      return;
    }

    try {
      const basePriceListId = await getBasePriceListId();

      const insertData = await Promise.all(
        selectedProducts.map(async (productId) => {
          let productPrice = price;

          if (!productPrice) {
            const { data } = await supabase
              .from('price_list_items')
              .select('price')
              .eq('price_list_id', basePriceListId)
              .eq('product_id', productId)
              .single();

            productPrice = data?.price || 0;
          }

          return {
            price_list_id: priceListId,
            product_id: productId,
            price: productPrice,
          };
        })
      );

      const { error } = await supabase
        .from('price_list_items')
        .upsert(insertData, { onConflict: 'price_list_id,product_id' });

      if (error) throw error;

      alert('Produkty zostały dodane do cennika');
      setShowAddForm(false);
      setSelectedProducts([]);
      setDefaultPrice('');
      loadData();
    } catch (error) {
      console.error('Error adding products:', error);
      alert('Błąd podczas dodawania produktów');
    }
  };

  const getBasePriceListId = async (): Promise<string> => {
    const { data } = await supabase
      .from('price_lists')
      .select('id')
      .eq('name', 'Cennik Bazowy')
      .single();

    return data?.id || '';
  };

  const toggleProductSelection = (productId: string) => {
    setSelectedProducts(prev =>
      prev.includes(productId)
        ? prev.filter(id => id !== productId)
        : [...prev, productId]
    );
  };

  const availableProducts = allProducts.filter(
    p => !items.some(item => item.product_id === p.id)
  );

  const categories = ['all', ...Array.from(new Set(items.map(i => i.product_category)))];

  const filteredItems = items.filter(item => {
    const matchesSearch = item.product_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         item.product_code.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = categoryFilter === 'all' || item.product_category === categoryFilter;
    return matchesSearch && matchesCategory;
  });

  const filteredAvailableProducts = availableProducts.filter(p =>
    p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    p.code.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-amber-600"></div>
      </div>
    );
  }

  if (!priceList) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-600">Nie znaleziono cennika</p>
        <button onClick={onBack} className="mt-4 px-4 py-2 bg-gray-200 rounded-lg">
          Powrót
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <button
            onClick={onBack}
            className="mb-2 text-amber-600 hover:text-amber-700 font-medium"
          >
            ← Powrót do cenników
          </button>
          <h2 className="text-2xl font-bold text-gray-800">{priceList.name}</h2>
          {priceList.description && (
            <p className="text-sm text-gray-600">{priceList.description}</p>
          )}
          <p className="text-sm text-gray-500 mt-1">
            Produktów w cenniku: {items.length}
          </p>
        </div>
        <button
          onClick={() => setShowAddForm(true)}
          className="px-4 py-2 bg-green-600 text-white rounded-lg font-medium hover:bg-green-700 transition flex items-center gap-2"
        >
          <Plus className="w-5 h-5" />
          Dodaj produkty
        </button>
      </div>

      {showAddForm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-hidden flex flex-col">
            <div className="flex items-center justify-between p-6 border-b border-gray-200">
              <div className="flex items-center gap-3">
                <Plus className="w-6 h-6 text-green-600" />
                <h3 className="text-xl font-bold text-gray-800">Dodaj produkty do cennika</h3>
              </div>
              <button
                onClick={() => {
                  setShowAddForm(false);
                  setSelectedProducts([]);
                  setDefaultPrice('');
                }}
                className="p-2 hover:bg-gray-100 rounded-lg transition"
              >
                <X className="w-6 h-6" />
              </button>
            </div>
            <div className="p-6 overflow-y-auto flex-1">
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Cena domyślna (opcjonalnie)
                  </label>
                  <input
                    type="number"
                    value={defaultPrice}
                    onChange={(e) => setDefaultPrice(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:border-amber-500 focus:outline-none"
                    placeholder="Pozostaw puste aby użyć ceny z cennika bazowego"
                    step="0.01"
                    min="0"
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    Jeśli pozostawisz puste, produkty zostaną dodane z cenami z cennika bazowego
                  </p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Wybierz produkty do dodania
                  </label>
                  <input
                    type="text"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:border-amber-500 focus:outline-none mb-3"
                    placeholder="Szukaj produktu..."
                  />
                  <div className="border border-gray-300 rounded-lg max-h-96 overflow-y-auto">
                    {filteredAvailableProducts.length === 0 ? (
                      <p className="p-4 text-center text-gray-500">
                        {availableProducts.length === 0
                          ? 'Wszystkie produkty są już w cenniku'
                          : 'Brak produktów pasujących do wyszukiwania'}
                      </p>
                    ) : (
                      filteredAvailableProducts.map(product => (
                        <label
                          key={product.id}
                          className="flex items-center p-3 hover:bg-gray-50 cursor-pointer border-b border-gray-100 last:border-b-0"
                        >
                          <input
                            type="checkbox"
                            checked={selectedProducts.includes(product.id)}
                            onChange={() => toggleProductSelection(product.id)}
                            className="mr-3"
                          />
                          <div className="flex-1">
                            <div className="flex items-center gap-2">
                              <span className="font-medium text-gray-800">{product.name}</span>
                              <span className="text-xs text-gray-500">({product.code})</span>
                            </div>
                            <div className="text-xs text-gray-500">
                              {product.display_category} • {product.unit}
                            </div>
                          </div>
                        </label>
                      ))
                    )}
                  </div>
                  {selectedProducts.length > 0 && (
                    <p className="text-sm text-gray-600 mt-2">
                      Wybrano: {selectedProducts.length} {selectedProducts.length === 1 ? 'produkt' : 'produktów'}
                    </p>
                  )}
                </div>

                <div className="flex gap-3 pt-4">
                  <button
                    onClick={handleAddProducts}
                    className="flex-1 px-4 py-2 bg-green-600 text-white rounded-lg font-medium hover:bg-green-700 transition"
                    disabled={selectedProducts.length === 0}
                  >
                    Dodaj produkty
                  </button>
                  <button
                    onClick={() => {
                      setShowAddForm(false);
                      setSelectedProducts([]);
                      setDefaultPrice('');
                    }}
                    className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg font-medium hover:bg-gray-300 transition"
                  >
                    Anuluj
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      <div className="bg-white rounded-xl shadow-md p-4">
        <div className="flex gap-4 mb-4">
          <div className="flex-1">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:border-amber-500 focus:outline-none"
                placeholder="Szukaj produktu..."
              />
            </div>
          </div>
          <select
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:border-amber-500 focus:outline-none"
          >
            <option value="all">Wszystkie kategorie</option>
            {categories.filter(c => c !== 'all').map(cat => (
              <option key={cat} value={cat}>{cat}</option>
            ))}
          </select>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b-2 border-gray-200 bg-gray-50">
                <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">Kod</th>
                <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">Nazwa</th>
                <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">Kategoria</th>
                <th className="text-right py-3 px-4 text-sm font-semibold text-gray-700">Cena</th>
                <th className="text-center py-3 px-4 text-sm font-semibold text-gray-700">Akcje</th>
              </tr>
            </thead>
            <tbody>
              {filteredItems.length === 0 ? (
                <tr>
                  <td colSpan={5} className="py-8 text-center text-gray-500">
                    Brak produktów w cenniku
                  </td>
                </tr>
              ) : (
                filteredItems.map(item => (
                  <tr key={item.id} className="border-b border-gray-100 hover:bg-gray-50">
                    <td className="py-3 px-4 text-sm font-mono">{item.product_code}</td>
                    <td className="py-3 px-4 text-sm font-medium">{item.product_name}</td>
                    <td className="py-3 px-4 text-sm text-gray-600">{item.product_category}</td>
                    <td className="py-3 px-4 text-right">
                      {editingId === item.id ? (
                        <div className="flex items-center justify-end gap-2">
                          <input
                            type="number"
                            value={editPrice}
                            onChange={(e) => setEditPrice(e.target.value)}
                            onKeyDown={(e) => {
                              if (e.key === 'Enter') {
                                handleSavePrice(item.id);
                              } else if (e.key === 'Escape') {
                                handleCancelEdit();
                              }
                            }}
                            className="w-24 px-2 py-1 border border-gray-300 rounded text-right"
                            step="0.01"
                            min="0"
                            autoFocus
                          />
                          <span className="text-sm text-gray-600">/ 1{item.product_unit}</span>
                        </div>
                      ) : (
                        <span
                          onClick={() => handleEditPrice(item.id, item.price)}
                          className="text-sm font-medium cursor-pointer hover:text-amber-600 hover:underline transition"
                          title="Kliknij aby edytować cenę"
                        >
                          {item.price.toFixed(2)} zł / 1{item.product_unit}
                        </span>
                      )}
                    </td>
                    <td className="py-3 px-4 text-center">
                      {editingId === item.id ? (
                        <div className="flex items-center justify-center gap-2">
                          <button
                            onClick={() => handleSavePrice(item.id)}
                            className="p-2 text-green-600 hover:bg-green-50 rounded-lg transition"
                            title="Zapisz (Enter)"
                          >
                            <Save className="w-4 h-4" />
                          </button>
                          <button
                            onClick={handleCancelEdit}
                            className="p-2 text-gray-600 hover:bg-gray-100 rounded-lg transition"
                            title="Anuluj (Esc)"
                          >
                            <X className="w-4 h-4" />
                          </button>
                        </div>
                      ) : (
                        <div className="flex items-center justify-center gap-2">
                          <button
                            onClick={() => handleDeleteItem(item.id)}
                            className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition"
                            title="Usuń z cennika"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
