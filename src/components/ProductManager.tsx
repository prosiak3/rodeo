import { useState, useEffect } from 'react';
import { Edit2, Save, X, Package, Tag } from 'lucide-react';
import { supabase } from '../lib/supabase';
import TagsManager from './TagsManager';

interface Product {
  id: string;
  name: string;
  code: string;
  category: string;
  unit: string;
  base_price: number;
  min_quantity: number;
  quantity_step: number;
  active: boolean;
}

export default function ProductManager() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editData, setEditData] = useState<Partial<Product>>({});
  const [filter, setFilter] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [showTagsManager, setShowTagsManager] = useState(false);

  useEffect(() => {
    loadProducts();
  }, []);

  const loadProducts = async () => {
    try {
      const { data, error } = await supabase
        .from('products')
        .select('id, name, code, category, unit, base_price, min_quantity, quantity_step, active')
        .order('category', { ascending: true })
        .order('name', { ascending: true });

      if (error) throw error;
      setProducts(data || []);
    } catch (error) {
      console.error('Error loading products:', error);
    } finally {
      setLoading(false);
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
      const { error } = await supabase
        .from('products')
        .update({
          min_quantity: editData.min_quantity,
          quantity_step: editData.quantity_step,
          base_price: editData.base_price,
        })
        .eq('id', productId);

      if (error) throw error;

      alert('Produkt zaktualizowany!');
      setEditingId(null);
      setEditData({});
      loadProducts();
    } catch (error) {
      console.error('Error updating product:', error);
      alert('Błąd podczas aktualizacji produktu');
    }
  };

  const categories = ['all', ...Array.from(new Set(products.map(p => p.category)))];

  const filteredProducts = products.filter(product => {
    const matchesSearch = product.name.toLowerCase().includes(filter.toLowerCase()) ||
                         product.code.toLowerCase().includes(filter.toLowerCase());
    const matchesCategory = categoryFilter === 'all' || product.category === categoryFilter;
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
          <Package className="w-8 h-8 text-amber-600" />
          <h2 className="text-2xl font-bold text-gray-800">Zarządzanie produktami</h2>
        </div>
        <button
          onClick={() => setShowTagsManager(true)}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition flex items-center gap-2"
        >
          <Tag className="w-5 h-5" />
          Zarządzaj tagami
        </button>
      </div>

      {showTagsManager && (
        <TagsManager onClose={() => setShowTagsManager(false)} />
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
                <tr key={product.id} className="border-b border-gray-100 hover:bg-gray-50">
                  <td className="py-3 px-2 text-sm font-mono">{product.code}</td>
                  <td className="py-3 px-2 text-sm">{product.name}</td>
                  <td className="py-3 px-2 text-sm text-gray-600">{product.category}</td>
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
                      <span>{product.base_price.toFixed(2)} PLN/{product.unit}</span>
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
