import { useState, useEffect } from 'react';
import { Tag, X, Plus, Check } from 'lucide-react';
import { supabase } from '../lib/supabase';

interface TagsManagerProps {
  onClose: () => void;
}

export default function TagsManager({ onClose }: TagsManagerProps) {
  const [products, setProducts] = useState<any[]>([]);
  const [selectedProducts, setSelectedProducts] = useState<Set<string>>(new Set());
  const [newTag, setNewTag] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [search, setSearch] = useState('');

  useEffect(() => {
    loadProducts();
  }, []);

  const loadProducts = async () => {
    try {
      const { data, error } = await supabase
        .from('products')
        .select('id, name, code, original_category, tags')
        .eq('active', true)
        .order('name');

      if (error) throw error;
      setProducts(data || []);
    } catch (error) {
      console.error('Error loading products:', error);
    } finally {
      setLoading(false);
    }
  };

  const toggleProduct = (productId: string) => {
    const newSelected = new Set(selectedProducts);
    if (newSelected.has(productId)) {
      newSelected.delete(productId);
    } else {
      newSelected.add(productId);
    }
    setSelectedProducts(newSelected);
  };

  const addTagToSelected = async () => {
    if (!newTag.trim() || selectedProducts.size === 0) {
      alert('Wybierz produkty i podaj tag');
      return;
    }

    setSaving(true);
    try {
      const selectedIds = Array.from(selectedProducts);

      for (const productId of selectedIds) {
        const product = products.find(p => p.id === productId);
        if (!product) continue;

        const existingTags = product.tags || [];
        if (existingTags.includes(newTag.trim())) continue;

        const updatedTags = [...existingTags, newTag.trim()];

        const { error } = await supabase
          .from('products')
          .update({ tags: updatedTags })
          .eq('id', productId);

        if (error) throw error;
      }

      alert(`Tag "${newTag}" dodany do ${selectedIds.length} produktów`);
      setNewTag('');
      setSelectedProducts(new Set());
      loadProducts();
    } catch (error) {
      console.error('Error adding tags:', error);
      alert('Błąd podczas dodawania tagów');
    } finally {
      setSaving(false);
    }
  };

  const clearTagsFromSelected = async () => {
    if (selectedProducts.size === 0) {
      alert('Wybierz produkty');
      return;
    }

    if (!confirm(`Czy na pewno usunąć wszystkie tagi z ${selectedProducts.size} produktów?`)) {
      return;
    }

    setSaving(true);
    try {
      const selectedIds = Array.from(selectedProducts);

      for (const productId of selectedIds) {
        const { error } = await supabase
          .from('products')
          .update({ tags: [] })
          .eq('id', productId);

        if (error) throw error;
      }

      alert(`Tagi usunięte z ${selectedIds.length} produktów`);
      setSelectedProducts(new Set());
      loadProducts();
    } catch (error) {
      console.error('Error clearing tags:', error);
      alert('Błąd podczas usuwania tagów');
    } finally {
      setSaving(false);
    }
  };

  const filteredProducts = products.filter(p =>
    p.name.toLowerCase().includes(search.toLowerCase()) ||
    p.code.toLowerCase().includes(search.toLowerCase())
  );

  if (loading) {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
        <div className="bg-white rounded-xl p-6">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-amber-600 mx-auto"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl max-w-4xl w-full max-h-[90vh] overflow-hidden flex flex-col">
        <div className="p-6 border-b bg-gradient-to-r from-amber-500 to-orange-600 text-white">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-3">
              <Tag className="w-6 h-6" />
              <h2 className="text-2xl font-bold">Zarządzanie tagami</h2>
            </div>
            <button
              onClick={onClose}
              className="p-2 hover:bg-white hover:bg-opacity-20 rounded-lg transition"
            >
              <X className="w-6 h-6" />
            </button>
          </div>
          <p className="text-amber-100 text-sm">
            Wybrano: {selectedProducts.size} {selectedProducts.size === 1 ? 'produkt' : 'produktów'}
          </p>
        </div>

        <div className="p-6 border-b space-y-4">
          <div className="flex gap-3">
            <input
              type="text"
              value={newTag}
              onChange={(e) => setNewTag(e.target.value)}
              placeholder="Nowy tag..."
              className="flex-1 px-4 py-2 border-2 border-gray-300 rounded-lg focus:border-amber-500 focus:outline-none"
            />
            <button
              onClick={addTagToSelected}
              disabled={saving || !newTag.trim() || selectedProducts.size === 0}
              className="px-6 py-2 bg-amber-600 text-white rounded-lg font-medium hover:bg-amber-700 transition disabled:opacity-50 flex items-center gap-2"
            >
              <Plus className="w-5 h-5" />
              Dodaj do zaznaczonych
            </button>
          </div>

          <button
            onClick={clearTagsFromSelected}
            disabled={saving || selectedProducts.size === 0}
            className="px-6 py-2 bg-red-600 text-white rounded-lg font-medium hover:bg-red-700 transition disabled:opacity-50 flex items-center gap-2"
          >
            <X className="w-5 h-5" />
            Wyczyść tagi w zaznaczonych
          </button>

          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Szukaj produktu..."
            className="w-full px-4 py-2 border-2 border-gray-300 rounded-lg focus:border-amber-500 focus:outline-none"
          />
        </div>

        <div className="flex-1 overflow-y-auto p-6">
          <div className="space-y-2">
            {filteredProducts.map((product) => {
              const isSelected = selectedProducts.has(product.id);
              return (
                <div
                  key={product.id}
                  onClick={() => toggleProduct(product.id)}
                  className={`p-4 rounded-lg border-2 cursor-pointer transition ${
                    isSelected
                      ? 'border-amber-500 bg-amber-50'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  <div className="flex items-start gap-3">
                    <div className={`w-6 h-6 rounded border-2 flex items-center justify-center flex-shrink-0 ${
                      isSelected ? 'bg-amber-600 border-amber-600' : 'border-gray-300'
                    }`}>
                      {isSelected && <Check className="w-4 h-4 text-white" />}
                    </div>
                    <div className="flex-1">
                      <div className="flex items-baseline gap-2">
                        <h3 className="font-semibold text-gray-800">{product.name}</h3>
                        <span className="text-xs text-gray-500">{product.code}</span>
                      </div>
                      <p className="text-sm text-gray-600">{product.original_category}</p>
                      {product.tags && product.tags.length > 0 && (
                        <div className="flex flex-wrap gap-1 mt-2">
                          {product.tags.map((tag: string) => (
                            <span
                              key={tag}
                              className="px-2 py-1 bg-blue-100 text-blue-700 rounded text-xs font-medium"
                            >
                              #{tag}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
