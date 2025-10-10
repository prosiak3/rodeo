import { useState, useEffect } from 'react';
import { Search, Tag } from 'lucide-react';
import { supabase } from '../lib/supabase';

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
}

export default function PriceList() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');

  useEffect(() => {
    loadProducts();
  }, []);

  const loadProducts = async () => {
    setLoading(true);
    try {
      const { data: authData } = await supabase.auth.getUser();
      if (!authData.user) throw new Error('Not authenticated');

      const { data: userData } = await supabase
        .from('users')
        .select('store_id')
        .eq('id', authData.user.id)
        .single();

      const { data, error } = await supabase
        .from('products')
        .select(`
          id, code, name, category, unit, base_price, description, index, min_quantity, quantity_step,
          special_prices!left (
            your_price,
            promo_price
          )
        `)
        .eq('active', true)
        .eq('special_prices.store_id', userData?.store_id || '00000000-0000-0000-0000-000000000000')
        .order('category', { ascending: true })
        .order('name', { ascending: true });

      if (error) throw error;

      const productsWithPrices = (data || []).map(p => ({
        ...p,
        your_price: (p as any).special_prices?.[0]?.your_price,
        promo_price: (p as any).special_prices?.[0]?.promo_price,
      }));

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

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-amber-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <div className="bg-white rounded-lg shadow p-3 sticky top-0 z-10">
        <div className="flex items-center gap-2 mb-2">
          <Search className="w-4 h-4 text-gray-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Szukaj produktu..."
            className="flex-1 px-2 py-1 text-sm border border-gray-300 rounded focus:ring-1 focus:ring-amber-500 focus:border-transparent"
          />
        </div>

        <div className="flex gap-1 overflow-x-auto pb-1">
          {categories.map((category) => (
            <button
              key={category}
              onClick={() => setSelectedCategory(category)}
              className={`px-2 py-1 rounded text-xs font-medium whitespace-nowrap transition ${
                selectedCategory === category
                  ? 'bg-amber-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              {category === 'all' ? 'Wszystkie' : category}
            </button>
          ))}
        </div>
      </div>

      {filteredProducts.length === 0 ? (
        <div className="bg-white rounded-lg shadow p-8 text-center">
          <Tag className="w-12 h-12 text-gray-300 mx-auto mb-3" />
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
                {categoryProducts.map((product) => {
                  const hasPromo = product.promo_price && product.promo_price > 0;
                  return (
                  <div
                    key={product.id}
                    className={`px-3 py-2 hover:bg-gray-50 transition ${hasPromo ? 'bg-yellow-50' : ''}`}
                  >
                    <div className="flex items-center gap-2">
                      <div className="flex-1 min-w-0 mr-2">
                        <div className="flex items-baseline gap-2">
                          <span className="font-medium text-sm text-gray-800 truncate">
                            {product.name}
                          </span>
                          <span className="text-xs text-gray-500 flex-shrink-0">
                            {product.code}
                          </span>
                        </div>
                        {product.description && (
                          <p className="text-xs text-gray-600 truncate">{product.description}</p>
                        )}
                        <div className="flex gap-3 mt-1 text-xs text-gray-500">
                          <span>Min: {product.min_quantity} {product.unit}</span>
                          <span>Krok: {product.quantity_step} {product.unit}</span>
                        </div>
                      </div>
                      <div className="flex flex-col items-end gap-1 flex-shrink-0">
                        <div className="flex items-baseline gap-1">
                          <span className="text-[10px] text-gray-400 uppercase">Normalna</span>
                          <span className={`text-sm ${product.your_price || product.promo_price ? 'line-through text-gray-400' : 'font-bold text-amber-600'}`}>
                            {product.base_price.toFixed(2)}
                          </span>
                        </div>
                        {product.your_price && product.your_price > 0 && (
                          <div className="flex items-baseline gap-1">
                            <span className="text-[10px] text-blue-600 uppercase font-medium">Twoja</span>
                            <span className={`text-sm ${product.promo_price ? 'line-through text-gray-400' : 'font-bold text-blue-600'}`}>
                              {product.your_price.toFixed(2)}
                            </span>
                          </div>
                        )}
                        {product.promo_price && product.promo_price > 0 && (
                          <div className="flex items-baseline gap-1 animate-pulse">
                            <span className="text-[10px] text-red-600 uppercase font-bold">Specjalna</span>
                            <span className="text-base font-bold text-red-600">
                              {product.promo_price.toFixed(2)}
                            </span>
                          </div>
                        )}
                        <span className="text-xs text-gray-500">PLN/{product.unit}</span>
                      </div>
                    </div>
                    {product.index && (
                      <div className="mt-2 flex flex-col gap-1">
                        <svg className="w-full h-16" viewBox="0 0 300 70" preserveAspectRatio="xMinYMin meet">
                          {product.index.split('').map((digit, i) => {
                            const barWidth = i % 2 === 0 ? 6 : 10;
                            const x = i * 22;
                            return (
                              <g key={i}>
                                <rect
                                  x={x}
                                  y="5"
                                  width={barWidth}
                                  height="50"
                                  fill="#000"
                                />
                              </g>
                            );
                          })}
                        </svg>
                        <span className="font-mono text-sm text-gray-800 text-center tracking-wider">{product.index}</span>
                      </div>
                    )}
                  </div>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      )}

      <div className="bg-amber-50 rounded-lg p-3 text-xs text-amber-800 border border-amber-200">
        <p className="font-semibold mb-1">📋 Informacja o cenniku</p>
        <p>Ceny podane w cenniku są cenami bazowymi. Rzeczywiste ceny mogą różnić się w zależności od sklepu i specjalnych promocji.</p>
      </div>
    </div>
  );
}
