import { useState, useEffect } from 'react';
import { Edit2, Save, X, Package, Tag, AlertTriangle, Trash2, Plus, Power, PowerOff } from 'lucide-react';
import { supabase } from '../lib/supabase';
import TagsManager from './TagsManager';

interface Product {
  id: string;
  name: string;
  code: string;
  display_category: string;
  original_category: string;
  unit: string;
  base_price: number;
  min_quantity: number;
  quantity_step: number;
  active: boolean;
  description?: string;
  index?: string;
}

export default function ProductManager() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editData, setEditData] = useState<Partial<Product>>({});
  const [filter, setFilter] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [showTagsManager, setShowTagsManager] = useState(false);
  const [showDuplicates, setShowDuplicates] = useState(false);
  const [duplicates, setDuplicates] = useState<{name: string; products: Product[]}[]>([]);
  const [activeFilter, setActiveFilter] = useState<'all' | 'active' | 'inactive'>('all');
  const [showAddForm, setShowAddForm] = useState(false);
  const [newProduct, setNewProduct] = useState({
    code: '',
    name: '',
    display_category: 'Drób',
    original_category: 'Drób',
    unit: 'kg',
    base_price: 0,
    min_quantity: 1,
    quantity_step: 1,
    description: '',
    index: '',
    active: true
  });

  useEffect(() => {
    loadProducts();
  }, []);

  const loadProducts = async () => {
    try {
      const { data, error } = await supabase
        .from('products')
        .select('id, name, code, display_category, original_category, unit, base_price, min_quantity, quantity_step, active, description, index')
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

  const findDuplicates = () => {
    const nameGroups = products.reduce((acc, product) => {
      if (!acc[product.name]) {
        acc[product.name] = [];
      }
      acc[product.name].push(product);
      return acc;
    }, {} as Record<string, Product[]>);

    const dupes = Object.entries(nameGroups)
      .filter(([_, prods]) => prods.length > 1)
      .map(([name, prods]) => ({ name, products: prods }))
      .sort((a, b) => b.products.length - a.products.length);

    setDuplicates(dupes);
    setShowDuplicates(true);
  };

  const deleteProduct = async (productId: string) => {
    if (!confirm('Czy na pewno chcesz usunąć ten produkt? Może to wpłynąć na istniejące zamówienia.')) return;

    try {
      const { error } = await supabase
        .from('products')
        .delete()
        .eq('id', productId);

      if (error) throw error;

      alert('Produkt został usunięty');
      loadProducts();
      findDuplicates();
    } catch (error) {
      console.error('Error deleting product:', error);
      alert('Błąd podczas usuwania produktu. Produkt może być używany w zamówieniach.');
    }
  };

  const startEdit = (product: Product) => {
    setEditingId(product.id);
    setEditData({
      min_quantity: product.min_quantity,
      quantity_step: product.quantity_step,
      base_price: product.base_price,
    });
  };

  const cancelEdit = () => {
    setEditingId(null);
    setEditData({});
  };

  const saveEdit = async (productId: string) => {
    try {
      const { error: productError } = await supabase
        .from('products')
        .update({
          min_quantity: editData.min_quantity,
          quantity_step: editData.quantity_step,
          base_price: editData.base_price,
        })
        .eq('id', productId);

      if (productError) throw productError;

      const { data: basePriceList } = await supabase
        .from('price_lists')
        .select('id')
        .eq('name', 'Cennik Bazowy')
        .single();

      if (basePriceList && editData.base_price !== undefined) {
        const { error: priceListError } = await supabase
          .from('price_list_items')
          .upsert({
            price_list_id: basePriceList.id,
            product_id: productId,
            price: editData.base_price,
          }, {
            onConflict: 'price_list_id,product_id'
          });

        if (priceListError) throw priceListError;
      }

      alert('Produkt zaktualizowany!');
      setEditingId(null);
      setEditData({});
      loadProducts();
    } catch (error) {
      console.error('Error updating product:', error);
      alert('Błąd podczas aktualizacji produktu');
    }
  };

  const toggleActive = async (productId: string, currentStatus: boolean) => {
    try {
      const { error } = await supabase
        .from('products')
        .update({ active: !currentStatus })
        .eq('id', productId);

      if (error) throw error;

      alert(`Produkt ${!currentStatus ? 'aktywowany' : 'dezaktywowany'}!`);
      loadProducts();
    } catch (error) {
      console.error('Error toggling product status:', error);
      alert('Błąd podczas zmiany statusu produktu');
    }
  };

  const addNewProduct = async () => {
    if (!newProduct.code || !newProduct.name) {
      alert('Wypełnij wymagane pola: Kod i Nazwa produktu');
      return;
    }

    try {
      const { data: insertedProduct, error } = await supabase
        .from('products')
        .insert({
          code: newProduct.code,
          name: newProduct.name,
          display_category: newProduct.display_category,
          original_category: newProduct.original_category,
          unit: newProduct.unit,
          base_price: newProduct.base_price,
          min_quantity: newProduct.min_quantity,
          quantity_step: newProduct.quantity_step,
          description: newProduct.description || null,
          index: newProduct.index || null,
          active: newProduct.active
        })
        .select()
        .single();

      if (error) {
        if (error.code === '23505') {
          alert('Produkt o takim kodzie już istnieje!');
        } else {
          throw error;
        }
        return;
      }

      const { data: basePriceList } = await supabase
        .from('price_lists')
        .select('id')
        .eq('name', 'Cennik Bazowy')
        .single();

      if (basePriceList && insertedProduct) {
        await supabase
          .from('price_list_items')
          .insert({
            price_list_id: basePriceList.id,
            product_id: insertedProduct.id,
            price: newProduct.base_price,
          });
      }

      alert('Produkt dodany pomyślnie!');
      setShowAddForm(false);
      setNewProduct({
        code: '',
        name: '',
        display_category: 'Drób',
        original_category: 'Drób',
        unit: 'kg',
        base_price: 0,
        min_quantity: 1,
        quantity_step: 1,
        description: '',
        index: '',
        active: true
      });
      loadProducts();
    } catch (error) {
      console.error('Error adding product:', error);
      alert('Błąd podczas dodawania produktu');
    }
  };

  const categories = ['all', ...Array.from(new Set(products.map(p => p.display_category)))].filter(Boolean);

  const filteredProducts = products.filter(product => {
    const matchesSearch = product.name.toLowerCase().includes(filter.toLowerCase()) ||
                         product.code.toLowerCase().includes(filter.toLowerCase()) ||
                         (product.description && product.description.toLowerCase().includes(filter.toLowerCase()));
    const matchesCategory = categoryFilter === 'all' || product.display_category === categoryFilter;
    const matchesActiveFilter = activeFilter === 'all' ||
                               (activeFilter === 'active' && product.active) ||
                               (activeFilter === 'inactive' && !product.active);
    return matchesSearch && matchesCategory && matchesActiveFilter;
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
          <Package className="w-8 h-8 text-amber-600" />
          <h2 className="text-2xl font-bold text-gray-800">Zarządzanie produktami</h2>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => setShowAddForm(true)}
            className="px-4 py-2 bg-green-600 text-white rounded-lg font-medium hover:bg-green-700 transition flex items-center gap-2"
          >
            <Plus className="w-5 h-5" />
            Dodaj produkt
          </button>
          <button
            onClick={findDuplicates}
            className="px-4 py-2 bg-orange-600 text-white rounded-lg font-medium hover:bg-orange-700 transition flex items-center gap-2"
          >
            <AlertTriangle className="w-5 h-5" />
            Znajdź duplikaty
          </button>
          <button
            onClick={() => setShowTagsManager(true)}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition flex items-center gap-2"
          >
            <Tag className="w-5 h-5" />
            Zarządzaj tagami
          </button>
        </div>
      </div>

      {showAddForm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-hidden flex flex-col">
            <div className="flex items-center justify-between p-6 border-b border-gray-200">
              <div className="flex items-center gap-3">
                <Plus className="w-6 h-6 text-green-600" />
                <h3 className="text-xl font-bold text-gray-800">Dodaj nowy produkt</h3>
              </div>
              <button
                onClick={() => setShowAddForm(false)}
                className="p-2 hover:bg-gray-100 rounded-lg transition"
              >
                <X className="w-6 h-6" />
              </button>
            </div>
            <div className="p-6 overflow-y-auto flex-1">
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Kod produktu <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      value={newProduct.code}
                      onChange={(e) => setNewProduct({ ...newProduct, code: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:border-amber-500 focus:outline-none"
                      placeholder="np. P001"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Indeks (kod kreskowy)
                    </label>
                    <input
                      type="text"
                      value={newProduct.index}
                      onChange={(e) => setNewProduct({ ...newProduct, index: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:border-amber-500 focus:outline-none"
                      placeholder="np. 5901234567890"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Nazwa produktu <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={newProduct.name}
                    onChange={(e) => setNewProduct({ ...newProduct, name: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:border-amber-500 focus:outline-none"
                    placeholder="np. Filet z kurczaka"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Opis produktu
                  </label>
                  <textarea
                    value={newProduct.description}
                    onChange={(e) => setNewProduct({ ...newProduct, description: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:border-amber-500 focus:outline-none"
                    placeholder="Opcjonalny opis produktu"
                    rows={3}
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Kategoria oryginalna
                    </label>
                    <select
                      value={newProduct.original_category}
                      onChange={(e) => setNewProduct({ ...newProduct, original_category: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:border-amber-500 focus:outline-none"
                    >
                      <option value="Drób">Drób</option>
                      <option value="Indyk">Indyk</option>
                      <option value="Mięso">Mięso</option>
                      <option value="Wołowina">Wołowina</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Kategoria wyświetlana
                    </label>
                    <select
                      value={newProduct.display_category}
                      onChange={(e) => setNewProduct({ ...newProduct, display_category: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:border-amber-500 focus:outline-none"
                    >
                      <option value="Drób">Drób</option>
                      <option value="Indyk">Indyk</option>
                      <option value="Mięso">Mięso</option>
                      <option value="Wołowina">Wołowina</option>
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Jednostka
                    </label>
                    <select
                      value={newProduct.unit}
                      onChange={(e) => setNewProduct({ ...newProduct, unit: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:border-amber-500 focus:outline-none"
                    >
                      <option value="kg">kg</option>
                      <option value="szt">szt</option>
                      <option value="opak">opak</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Cena bazowa (PLN)
                    </label>
                    <input
                      type="number"
                      value={newProduct.base_price}
                      onChange={(e) => setNewProduct({ ...newProduct, base_price: parseFloat(e.target.value) })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:border-amber-500 focus:outline-none"
                      step="0.01"
                      min="0"
                    />
                  </div>
                  <div className="flex items-center pt-6">
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={newProduct.active}
                        onChange={(e) => setNewProduct({ ...newProduct, active: e.target.checked })}
                        className="w-5 h-5 text-green-600 border-gray-300 rounded focus:ring-green-500"
                      />
                      <span className="text-sm font-medium text-gray-700">Produkt aktywny</span>
                    </label>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Minimalna ilość
                    </label>
                    <input
                      type="number"
                      value={newProduct.min_quantity}
                      onChange={(e) => setNewProduct({ ...newProduct, min_quantity: parseInt(e.target.value) })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:border-amber-500 focus:outline-none"
                      step="1"
                      min="1"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Krok zamówienia
                    </label>
                    <input
                      type="number"
                      value={newProduct.quantity_step}
                      onChange={(e) => setNewProduct({ ...newProduct, quantity_step: parseInt(e.target.value) })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:border-amber-500 focus:outline-none"
                      step="1"
                      min="1"
                    />
                  </div>
                </div>
              </div>
            </div>
            <div className="p-6 border-t border-gray-200 flex gap-3">
              <button
                onClick={addNewProduct}
                className="flex-1 px-4 py-3 bg-green-600 text-white rounded-lg font-semibold hover:bg-green-700 transition"
              >
                Dodaj produkt
              </button>
              <button
                onClick={() => setShowAddForm(false)}
                className="px-4 py-3 bg-gray-200 text-gray-700 rounded-lg font-semibold hover:bg-gray-300 transition"
              >
                Anuluj
              </button>
            </div>
          </div>
        </div>
      )}

      {showTagsManager && (
        <TagsManager onClose={() => setShowTagsManager(false)} />
      )}

      {showDuplicates && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-2xl max-w-4xl w-full max-h-[80vh] overflow-hidden flex flex-col">
            <div className="flex items-center justify-between p-6 border-b border-gray-200">
              <div className="flex items-center gap-3">
                <AlertTriangle className="w-6 h-6 text-orange-600" />
                <h3 className="text-xl font-bold text-gray-800">Znalezione duplikaty ({duplicates.length})</h3>
              </div>
              <button
                onClick={() => setShowDuplicates(false)}
                className="p-2 hover:bg-gray-100 rounded-lg transition"
              >
                <X className="w-6 h-6" />
              </button>
            </div>
            <div className="p-6 overflow-y-auto flex-1">
              {duplicates.length === 0 ? (
                <div className="text-center py-12">
                  <Package className="w-16 h-16 text-green-500 mx-auto mb-4" />
                  <p className="text-gray-600 text-lg">Nie znaleziono duplikatów!</p>
                </div>
              ) : (
                <div className="space-y-6">
                  {duplicates.map((dup, idx) => (
                    <div key={idx} className="bg-gray-50 rounded-lg p-4">
                      <h4 className="font-bold text-lg mb-3 text-gray-800">{dup.name} ({dup.products.length} kopii)</h4>
                      <div className="space-y-2">
                        {dup.products.map((product) => (
                          <div key={product.id} className="bg-white rounded-lg p-3 flex items-center justify-between">
                            <div className="flex-1">
                              <div className="flex items-center gap-3">
                                <span className="font-mono text-sm bg-gray-100 px-2 py-1 rounded">{product.code}</span>
                                <span className="text-gray-600">{product.display_category}</span>
                                <span className="font-medium">{product.base_price.toFixed(2)} / 1{product.unit}</span>
                              </div>
                            </div>
                            <button
                              onClick={() => deleteProduct(product.id)}
                              className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition"
                              title="Usuń ten wariant"
                            >
                              <Trash2 className="w-5 h-5" />
                            </button>
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      <div className="bg-white rounded-xl shadow p-6">
        <div className="space-y-4 mb-6">
          <input
            type="text"
            placeholder="Szukaj produktu..."
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
            className="w-full p-3 border border-gray-300 rounded-lg focus:border-amber-500 focus:outline-none"
          />

          <div className="space-y-2">
            <div className="flex gap-2 flex-wrap">
              <button
                onClick={() => setActiveFilter('all')}
                className={`px-4 py-2 rounded-lg font-medium transition flex items-center gap-2 ${
                  activeFilter === 'all'
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                <Package className="w-4 h-4" />
                Wszystkie ({products.length})
              </button>
              <button
                onClick={() => setActiveFilter('active')}
                className={`px-4 py-2 rounded-lg font-medium transition flex items-center gap-2 ${
                  activeFilter === 'active'
                    ? 'bg-green-600 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                <Power className="w-4 h-4" />
                Aktywne ({products.filter(p => p.active).length})
              </button>
              <button
                onClick={() => setActiveFilter('inactive')}
                className={`px-4 py-2 rounded-lg font-medium transition flex items-center gap-2 ${
                  activeFilter === 'inactive'
                    ? 'bg-red-600 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                <PowerOff className="w-4 h-4" />
                Nieaktywne ({products.filter(p => !p.active).length})
              </button>
            </div>

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
        </div>

        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b-2 border-gray-200">
                <th className="text-center py-3 px-2 text-sm font-semibold text-gray-700">Status</th>
                <th className="text-left py-3 px-2 text-sm font-semibold text-gray-700">Kod</th>
                <th className="text-left py-3 px-2 text-sm font-semibold text-gray-700">Nazwa</th>
                <th className="text-left py-3 px-2 text-sm font-semibold text-gray-700">Kategoria</th>
                <th className="text-right py-3 px-2 text-sm font-semibold text-gray-700">Cena</th>
                <th className="text-right py-3 px-2 text-sm font-semibold text-gray-700">Min. ilość</th>
                <th className="text-right py-3 px-2 text-sm font-semibold text-gray-700">Krok</th>
                <th className="text-center py-3 px-2 text-sm font-semibold text-gray-700">Akcje</th>
              </tr>
            </thead>
            <tbody>
              {filteredProducts.map((product) => (
                <tr key={product.id} className={`border-b border-gray-100 hover:bg-gray-50 ${!product.active ? 'opacity-50 bg-gray-50 line-through' : ''}`}>
                  <td className="py-3 px-2 text-center">
                    <button
                      onClick={() => toggleActive(product.id, product.active)}
                      className={`p-2 rounded-lg transition ${
                        product.active
                          ? 'bg-green-100 text-green-600 hover:bg-green-200'
                          : 'bg-red-100 text-red-600 hover:bg-red-200'
                      }`}
                      title={product.active ? 'Dezaktywuj produkt' : 'Aktywuj produkt'}
                    >
                      {product.active ? <Power className="w-4 h-4" /> : <PowerOff className="w-4 h-4" />}
                    </button>
                  </td>
                  <td className="py-3 px-2 text-sm font-mono">{product.code}</td>
                  <td className="py-3 px-2 text-sm">{product.name}</td>
                  <td className="py-3 px-2 text-sm text-gray-600">
                    <div className="flex flex-col">
                      <span className="font-medium">{product.display_category}</span>
                      {product.original_category !== product.display_category && (
                        <span className="text-xs text-gray-400">({product.original_category})</span>
                      )}
                    </div>
                  </td>
                  <td className="py-3 px-2 text-sm text-right">
                    {editingId === product.id ? (
                      <input
                        type="number"
                        value={editData.base_price || ''}
                        onChange={(e) => setEditData({ ...editData, base_price: parseFloat(e.target.value) })}
                        className="w-20 p-1 border border-gray-300 rounded text-right"
                        step="0.01"
                      />
                    ) : (
                      <span>{product.base_price.toFixed(2)} / 1{product.unit}</span>
                    )}
                  </td>
                  <td className="py-3 px-2 text-sm text-right">
                    {editingId === product.id ? (
                      <input
                        type="number"
                        value={editData.min_quantity || ''}
                        onChange={(e) => setEditData({ ...editData, min_quantity: parseFloat(e.target.value) })}
                        className="w-16 p-1 border border-gray-300 rounded text-right"
                        step="1"
                        min="1"
                      />
                    ) : (
                      <span>{product.min_quantity} {product.unit}</span>
                    )}
                  </td>
                  <td className="py-3 px-2 text-sm text-right">
                    {editingId === product.id ? (
                      <input
                        type="number"
                        value={editData.quantity_step || ''}
                        onChange={(e) => setEditData({ ...editData, quantity_step: parseFloat(e.target.value) })}
                        className="w-16 p-1 border border-gray-300 rounded text-right"
                        step="1"
                        min="1"
                      />
                    ) : (
                      <span>{product.quantity_step} {product.unit}</span>
                    )}
                  </td>
                  <td className="py-3 px-2 text-center">
                    {editingId === product.id ? (
                      <div className="flex items-center justify-center gap-2">
                        <button
                          onClick={() => saveEdit(product.id)}
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
                        onClick={() => startEdit(product)}
                        className="p-2 text-amber-600 hover:bg-amber-50 rounded-lg transition"
                        title="Edytuj"
                      >
                        <Edit2 className="w-4 h-4" />
                      </button>
                    )}
                  </td>
                </tr>
              ))}
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
        <h3 className="font-semibold text-blue-900 mb-2">Informacje</h3>
        <ul className="space-y-1 text-sm text-blue-800">
          <li>• <strong>Min. ilość</strong> - minimalna ilość zamówienia dla produktu</li>
          <li>• <strong>Krok</strong> - wartość, o którą można zwiększać ilość (np. 1kg, 5kg)</li>
          <li>• Zmiany są natychmiast widoczne w systemie zamawiania</li>
        </ul>
      </div>
    </div>
  );
}
