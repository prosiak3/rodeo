import { useState, useEffect } from 'react';
import { Search, Tag, LayoutGrid, AlignJustify } from 'lucide-react';
import { supabase } from '../lib/supabase';

interface Product {
  id: string;
  code: string;
  name: string;
  category: string;
  original_category?: string;
  unit: string;
  base_price: number;
  description: string;
  index?: string;
  min_quantity: number;
  quantity_step: number;
  your_price?: number;
  promo_price?: number;
  tags?: string[];
  final_price?: number;
}

type SortOption = 'name-asc' | 'name-desc' | 'price-asc' | 'price-desc';

type PriceLayout = 'horizontal' | 'vertical';

export default function PriceList() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [sortBy, setSortBy] = useState<SortOption>('name-asc');
  const [priceLayout, setPriceLayout] = useState<PriceLayout>('horizontal');

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
          id, code, name, display_category, original_category, unit, base_price, description, index, min_quantity, quantity_step, tags,
          special_prices!left (
            your_price,
            promo_price
          )
        `)
        .eq('active', true)
        .eq('special_prices.store_id', userData?.store_id || '00000000-0000-0000-0000-000000000000');

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

  const filteredProducts = products.filter(product => {
    const matchesSearch = product.name.toLowerCase().includes(search.toLowerCase()) ||
                         (product.index && product.index.toLowerCase().includes(search.toLowerCase()));
    return matchesSearch;
  });

  const sortedProducts = [...filteredProducts].sort((a, b) => {
    switch (sortBy) {
      case 'name-asc':
        return a.name.localeCompare(b.name);
      case 'name-desc':
        return b.name.localeCompare(a.name);
      case 'price-asc':
        return (a.final_price || a.base_price) - (b.final_price || b.base_price);
      case 'price-desc':
        return (b.final_price || b.base_price) - (a.final_price || a.base_price);
      default:
        return 0;
    }
  });

  const groupedProducts = sortedProducts.reduce((acc, product) => {
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


        <div className="flex gap-2 items-center justify-between">
          <div className="flex gap-2 items-center text-xs flex-1">
            <span className="text-gray-600">Sortuj:</span>
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

          <div className="flex gap-1 border border-gray-300 rounded overflow-hidden">
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
                        </div>
                        {product.description && (
                          <p className="text-xs text-gray-600 truncate">{product.description}</p>
                        )}
                        <div className="flex gap-3 mt-1 text-xs text-gray-500">
                          <span>Min: {product.min_quantity} {product.unit}</span>
                          <span>Krok: {product.quantity_step} {product.unit}</span>
                        </div>
                      </div>
                      {priceLayout === 'horizontal' ? (
                        <div className="flex items-center gap-3 flex-shrink-0">
                          <div className="flex items-center gap-2">
                            <span className="text-[10px] text-gray-500 uppercase">N:</span>
                            <span className={`text-sm font-semibold ${product.your_price || product.promo_price ? 'line-through text-gray-400' : 'text-amber-600'}`}>
                              {product.base_price.toFixed(2)}
                            </span>
                          </div>
                          {product.your_price && product.your_price > 0 && (
                            <div className="flex items-center gap-2">
                              <span className="text-[10px] text-blue-600 uppercase font-medium">T:</span>
                              <span className={`text-sm font-semibold ${product.promo_price ? 'line-through text-gray-400' : 'text-blue-600'}`}>
                                {product.your_price.toFixed(2)}
                              </span>
                            </div>
                          )}
                          {product.promo_price && product.promo_price > 0 && (
                            <div className="flex items-center gap-2 animate-pulse">
                              <span className="text-[10px] text-red-600 uppercase font-bold">S:</span>
                              <span className="text-base font-bold text-red-600">
                                {product.promo_price.toFixed(2)}
                              </span>
                            </div>
                          )}
                          <span className="text-xs text-gray-500 ml-1">PLN/{product.unit}</span>
                        </div>
                      ) : (
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
                      )}
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
