import { useState, useEffect, useRef } from 'react';
import { Search, Tag, LayoutGrid, AlignJustify, ArrowUpAZ, ArrowDownZA, ArrowUp, ArrowDown, ArrowLeft, Plus } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useTheme } from '../contexts/ThemeContext';

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
  promo_10_plus_1?: boolean;
}

type SortOption = 'name-asc' | 'name-desc' | 'price-asc' | 'price-desc';

type PriceLayout = 'horizontal' | 'vertical';

interface PriceListProps {
  notebookOrderId?: string | null;
  onBackToOrder?: () => void;
}

export default function PriceList({ notebookOrderId, onBackToOrder }: PriceListProps = {}) {
  const { colors } = useTheme();
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [sortBy, setSortBy] = useState<SortOption>('name-asc');
  const [priceLayout, setPriceLayout] = useState<PriceLayout>('horizontal');
  const [swipedProduct, setSwipedProduct] = useState<string | null>(null);
  const [touchStart, setTouchStart] = useState<number | null>(null);
  const [touchCurrent, setTouchCurrent] = useState<number | null>(null);
  const [isDragging, setIsDragging] = useState(false);

  const mouseStateRef = useRef({
    isDragging: false,
    startX: 0,
    currentX: 0,
    productId: null as string | null
  });
  const [notebookItems, setNotebookItems] = useState<string[]>([]);
  const [storeId, setStoreId] = useState<string>('');
  const [userId, setUserId] = useState<string>('');
  const [showDescription, setShowDescription] = useState<boolean>(true);
  const [showIndex, setShowIndex] = useState<boolean>(true);
  const [notebookMode, setNotebookMode] = useState<'single' | 'multiple'>('multiple');
  const [showSortIcons, setShowSortIcons] = useState<boolean>(true);
  const [showPriceLayoutToggle, setShowPriceLayoutToggle] = useState<boolean>(true);
  const [showSortButtons, setShowSortButtons] = useState<boolean>(false);
  const [showGroupButtons, setShowGroupButtons] = useState<boolean>(false);
  const [currentSessionNotebookId, setCurrentSessionNotebookId] = useState<string | null>(notebookOrderId || null);

  useEffect(() => {
    loadProducts();
  }, []);

  useEffect(() => {
    if (notebookOrderId) {
      console.log('Setting notebook order ID:', notebookOrderId);
      setCurrentSessionNotebookId(notebookOrderId);
      loadNotebookItems(notebookOrderId);
    }
  }, [notebookOrderId]);

  const loadNotebookItems = async (orderId: string) => {
    try {
      console.log('🔵 Loading notebook items for order:', orderId);
      const { data: orderItems, error } = await supabase
        .from('order_items')
        .select('product_id')
        .eq('order_id', orderId);

      if (error) {
        console.error('❌ Error loading notebook items:', error);
        return;
      }

      console.log('✅ Loaded notebook items:', orderItems);
      if (orderItems && orderItems.length > 0) {
        const productIds = orderItems.map(item => item.product_id);
        console.log('📝 Setting notebook items:', productIds.length, 'items');
        setNotebookItems(productIds);
      } else {
        console.log('⚠️ No items found for this order');
        setNotebookItems([]);
      }
    } catch (error) {
      console.error('💥 Exception loading notebook items:', error);
    }
  };

  useEffect(() => {
    const handleGlobalMouseMove = (e: MouseEvent) => {
      if (isDragging && touchStart !== null && swipedProduct !== null) {
        e.stopPropagation();
        setTouchCurrent(e.clientX);
      }
    };

    const handleGlobalMouseUp = (e: MouseEvent) => {
      if (isDragging) {
        e.stopPropagation();
        setIsDragging(false);
        setTouchStart(null);
        setTouchCurrent(null);
        setSwipedProduct(null);
      }
    };

    if (isDragging) {
      document.addEventListener('mousemove', handleGlobalMouseMove, { capture: true });
      document.addEventListener('mouseup', handleGlobalMouseUp, { capture: true });
    }

    return () => {
      document.removeEventListener('mousemove', handleGlobalMouseMove, { capture: true });
      document.removeEventListener('mouseup', handleGlobalMouseUp, { capture: true });
    };
  }, [isDragging, touchStart, swipedProduct]);

  const loadProducts = async () => {
    setLoading(true);
    try {
      const { data: authData } = await supabase.auth.getUser();
      if (!authData.user) throw new Error('Not authenticated');
      setUserId(authData.user.id);

      const { data: userData } = await supabase
        .from('users')
        .select('store_id, show_product_description, show_product_index, notebook_mode, show_sort_icons, show_price_layout_toggle, show_sort_buttons, show_group_buttons')
        .eq('id', authData.user.id)
        .single();

      if (userData?.store_id) {
        setStoreId(userData.store_id);
      }
      setShowDescription(userData?.show_product_description ?? true);
      setShowIndex(userData?.show_product_index ?? true);
      setNotebookMode((userData as any)?.notebook_mode || 'multiple');
      setShowSortIcons((userData as any)?.show_sort_icons ?? true);
      setShowPriceLayoutToggle((userData as any)?.show_price_layout_toggle ?? true);
      setShowSortButtons((userData as any)?.show_sort_buttons ?? false);
      setShowGroupButtons((userData as any)?.show_group_buttons ?? false);

      const { data, error } = await supabase
        .from('products')
        .select(`
          id, code, name, display_category, original_category, unit, base_price, description, index, min_quantity, quantity_step, tags, promo_10_plus_1,
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

      if ((userData as any)?.notebook_mode === 'multiple' && userData?.store_id && authData.user?.id && !notebookOrderId) {
        const { data: existingOrder } = await supabase
          .from('orders')
          .select('id')
          .eq('store_id', userData.store_id)
          .eq('created_by', authData.user.id)
          .eq('status', 'notatnik')
          .order('created_at', { ascending: false })
          .limit(1)
          .maybeSingle();

        if (existingOrder) {
          setCurrentSessionNotebookId(existingOrder.id);
          console.log('Loaded existing notebook order:', existingOrder.id);
        }
      }
    } catch (error) {
      console.error('Error loading products:', error);
    } finally {
      setLoading(false);
    }
  };

  const categories = ['all', 'Drób', 'Indyk', 'Mięso', 'Wołowina'];

  console.log('🔍 FILTERING - notebookItems:', notebookItems.length, 'products:', products.length);

  const filteredProducts = products.filter(product => {
    const matchesSearch = product.name.toLowerCase().includes(search.toLowerCase()) ||
                         (product.index && product.index.toLowerCase().includes(search.toLowerCase()));
    const matchesCategory = selectedCategory === 'all' || product.category === selectedCategory;
    const notInNotebook = !notebookItems.includes(product.id);
    return matchesSearch && matchesCategory && notInNotebook;
  });

  console.log('✅ FILTERED RESULT:', filteredProducts.length, 'products');

  const promoProducts = filteredProducts.filter(p =>
    (p.promo_price && p.promo_price < (p.your_price || p.base_price)) || p.promo_10_plus_1
  );

  const regularProducts = filteredProducts.filter(p =>
    !((p.promo_price && p.promo_price < (p.your_price || p.base_price)) || p.promo_10_plus_1)
  );

  const sortProducts = (products: Product[]) => {
    return [...products].sort((a, b) => {
      if (selectedCategory === 'all') {
        const categoryOrder = ['Drób', 'Indyk', 'Mięso', 'Wołowina'];
        const categoryCompare = categoryOrder.indexOf(a.category) - categoryOrder.indexOf(b.category);
        if (categoryCompare !== 0) return categoryCompare;
      }

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
  };

  const sortedPromoProducts = sortProducts(promoProducts);
  const sortedRegularProducts = sortProducts(regularProducts);

  const groupedProducts: { [key: string]: Product[] } = {};

  if (sortedPromoProducts.length > 0) {
    groupedProducts['🔥 PROMOCJE'] = sortedPromoProducts;
  }

  if (selectedCategory === 'all') {
    sortedRegularProducts.forEach(product => {
      const category = product.category || 'Inne';
      if (!groupedProducts[category]) {
        groupedProducts[category] = [];
      }
      groupedProducts[category].push(product);
    });
  } else {
    if (sortedRegularProducts.length > 0) {
      groupedProducts[selectedCategory] = sortedRegularProducts;
    }
  }

  const handleTouchStart = (e: React.TouchEvent, productId: string) => {
    const touch = e.touches[0];
    console.log('📱 SWIPE START:', touch.clientX);
    setTouchStart(touch.clientX);
    setTouchCurrent(touch.clientX);
    setSwipedProduct(productId);
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (touchStart === null || swipedProduct === null) {
      return;
    }
    e.preventDefault();
    const touch = e.touches[0];
    console.log('📱 SWIPE MOVE:', touch.clientX, 'distance:', touch.clientX - touchStart);
    setTouchCurrent(touch.clientX);
  };

  const handleTouchEnd = async (product: Product) => {
    console.log('📱 SWIPE END:', { touchStart, touchCurrent });
    if (touchStart === null || touchCurrent === null) {
      setTouchStart(null);
      setTouchCurrent(null);
      setSwipedProduct(null);
      return;
    }

    const swipeDistance = touchCurrent - touchStart;
    const screenWidth = window.innerWidth;
    const swipeThreshold = screenWidth * 0.5;

    console.log('📱 SWIPE RESULT:', { swipeDistance, screenWidth, swipeThreshold, willAdd: swipeDistance > swipeThreshold });

    if (swipeDistance > swipeThreshold) {
      console.log('📱 ADDING TO NOTEBOOK via swipe:', product.name);
      await addToNotebook(product);
    }

    setTouchStart(null);
    setTouchCurrent(null);
    setSwipedProduct(null);
  };

  const handleMouseDown = (e: React.MouseEvent, productId: string) => {
    mouseStateRef.current = {
      isDragging: true,
      startX: e.clientX,
      currentX: e.clientX,
      productId
    };
    setSwipedProduct(productId);
    setTouchStart(e.clientX);
    setTouchCurrent(e.clientX);
  };

  useEffect(() => {
    const handleDocumentMouseMove = (e: MouseEvent) => {
      if (!mouseStateRef.current.isDragging) {
        return;
      }
      e.preventDefault();
      mouseStateRef.current.currentX = e.clientX;
      setTouchCurrent(e.clientX);
    };

    const handleDocumentMouseUp = async () => {
      if (!mouseStateRef.current.isDragging) return;

      const { startX, currentX, productId } = mouseStateRef.current;
      mouseStateRef.current.isDragging = false;

      const swipeDistance = currentX - startX;
      const screenWidth = window.innerWidth;
      const swipeThreshold = screenWidth * 0.5;

      if (swipeDistance > swipeThreshold && productId) {
        const product = products.find(p => p.id === productId);
        if (product) {
          await addToNotebook(product);
        }
      }

      setTouchStart(null);
      setTouchCurrent(null);
      setSwipedProduct(null);
    };

    document.addEventListener('mousemove', handleDocumentMouseMove);
    document.addEventListener('mouseup', handleDocumentMouseUp);

    return () => {
      document.removeEventListener('mousemove', handleDocumentMouseMove);
      document.removeEventListener('mouseup', handleDocumentMouseUp);
    };
  }, [products]);

  const addToNotebook = async (product: Product) => {
    console.log('📝 ADD TO NOTEBOOK:', product.name, 'Current items:', notebookItems.length);

    if (!storeId || !userId) {
      return;
    }

    if (notebookItems.includes(product.id)) {
      console.log('⚠️ Product already in notebookItems, skipping');
      return;
    }

    try {
      let orderId: string | undefined;

      // If we're adding to an existing notebook order
      if (currentSessionNotebookId) {
        orderId = currentSessionNotebookId;

        // Check if product already exists in this order
        const { data: existingItem } = await supabase
          .from('order_items')
          .select('id')
          .eq('order_id', orderId)
          .eq('product_id', product.id)
          .maybeSingle();

        if (existingItem) {
          console.log('✅ Product already exists in order, reloading items');
          await loadNotebookItems(orderId);
          return;
        }
      } else if (notebookMode === 'multiple') {
        const { data: existingOrder } = await supabase
          .from('orders')
          .select('id')
          .eq('store_id', storeId)
          .eq('created_by', userId)
          .eq('status', 'notatnik')
          .order('created_at', { ascending: false })
          .limit(1)
          .maybeSingle();

        if (existingOrder) {
          orderId = existingOrder.id;
          setCurrentSessionNotebookId(orderId);
        }
      } else {
        const { data: existingOrder } = await supabase
          .from('orders')
          .select('id')
          .eq('store_id', storeId)
          .eq('created_by', userId)
          .eq('status', 'notatnik')
          .maybeSingle();

        orderId = existingOrder?.id;

        if (orderId) {
          const { data: existingItem } = await supabase
            .from('order_items')
            .select('id')
            .eq('order_id', orderId)
            .eq('product_id', product.id)
            .maybeSingle();

          if (existingItem) {
            console.log('✅ Product already exists in single mode order, reloading items');
            await loadNotebookItems(orderId);
            return;
          }
        }
      }

      if (!orderId) {
        const orderNumber = `NOT-${Date.now()}`;
        const { data: newOrder, error: orderError } = await supabase
          .from('orders')
          .insert({
            order_number: orderNumber,
            store_id: storeId,
            created_by: userId,
            status: 'notatnik',
            total_amount: 0,
          })
          .select()
          .single();

        if (orderError) throw orderError;
        orderId = newOrder.id;

        if (notebookMode === 'multiple') {
          setCurrentSessionNotebookId(orderId);
        }
      }

      const { error: itemError } = await supabase
        .from('order_items')
        .insert({
          order_id: orderId,
          product_id: product.id,
          quantity: 0,
          unit: product.unit,
          unit_price: product.base_price,
          total_price: 0,
          status: 'pending',
        });

      if (itemError) throw itemError;

      console.log('✅ Successfully added to order, reloading notebook items');
      await loadNotebookItems(orderId);
    } catch (error) {
      console.error('❌ Error adding to notebook:', error);
    }
  };

  const getSwipeTransform = (productId: string) => {
    if (swipedProduct !== productId || touchStart === null || touchCurrent === null) {
      return 0;
    }
    const distance = touchCurrent - touchStart;
    return distance > 0 ? distance : 0;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2" style={{ borderColor: colors.primary }}></div>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {notebookOrderId && onBackToOrder && (
        <div className="bg-gradient-to-r from-green-500 to-emerald-600 rounded-lg shadow-lg p-3 sticky top-0 z-30 mb-3">
          <button
            onClick={onBackToOrder}
            className="w-full flex items-center justify-center gap-2 text-white font-medium hover:opacity-90 transition"
          >
            <ArrowLeft className="w-5 h-5" />
            Powrót do zamówienia notatnikowego
          </button>
        </div>
      )}
      <div className={`bg-white rounded-lg shadow p-3 sticky z-20 ${notebookOrderId ? 'top-[60px]' : 'top-0'}`}>
        <div className="flex items-center gap-2 mb-2">
          <Search className="w-4 h-4 text-gray-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Szukaj produktu..."
            className="flex-1 px-2 py-1 text-sm border border-gray-300 rounded focus:ring-1 focus:border-transparent"
            style={{ '--tw-ring-color': colors.ring } as React.CSSProperties}
          />
        </div>

        {showGroupButtons && (
          <div className="mb-2 flex gap-1 overflow-x-auto pb-1">
            {categories.map((cat) => (
              <button
                key={cat}
                onClick={() => setSelectedCategory(cat)}
                className="px-3 py-1.5 rounded-full text-xs font-medium whitespace-nowrap transition bg-gray-100 text-gray-700 hover:bg-gray-200"
                style={selectedCategory === cat ? { backgroundColor: colors.primary, color: 'white' } : {}}
              >
                {cat === 'all' ? 'Wszystkie' : cat}
              </button>
            ))}
          </div>
        )}

        <div className="flex gap-2 items-center justify-between">
          {showSortIcons && showSortButtons && (
            <div className="flex gap-1">
              <button
                onClick={() => setSortBy('name-asc')}
                className="p-1.5 rounded transition bg-gray-100 text-gray-600 hover:bg-gray-200"
                style={sortBy === 'name-asc' ? { backgroundColor: colors.primary, color: 'white' } : {}}
                title="Nazwa A-Z"
              >
                <ArrowUpAZ className="w-4 h-4" />
              </button>
              <button
                onClick={() => setSortBy('name-desc')}
                className="p-1.5 rounded transition bg-gray-100 text-gray-600 hover:bg-gray-200"
                style={sortBy === 'name-desc' ? { backgroundColor: colors.primary, color: 'white' } : {}}
                title="Nazwa Z-A"
              >
                <ArrowDownZA className="w-4 h-4" />
              </button>
              <button
                onClick={() => setSortBy('price-asc')}
                className="p-1.5 rounded transition flex items-center gap-1 bg-gray-100 text-gray-600 hover:bg-gray-200"
                style={sortBy === 'price-asc' ? { backgroundColor: colors.primary, color: 'white' } : {}}
                title="Cena rosnąco"
              >
                <ArrowUp className="w-3 h-3" />
              </button>
              <button
                onClick={() => setSortBy('price-desc')}
                className="p-1.5 rounded transition flex items-center gap-1 bg-gray-100 text-gray-600 hover:bg-gray-200"
                style={sortBy === 'price-desc' ? { backgroundColor: colors.primary, color: 'white' } : {}}
                title="Cena malejąco"
              >
                <ArrowDown className="w-3 h-3" />
              </button>
            </div>
          )}

          {showPriceLayoutToggle && (
            <div className="flex gap-1">
              <button
                onClick={() => setPriceLayout('horizontal')}
                className="p-1.5 rounded transition bg-gray-100 text-gray-600 hover:bg-gray-200"
                style={priceLayout === 'horizontal' ? { backgroundColor: colors.primary, color: 'white' } : {}}
                title="Układ poziomy"
              >
                <AlignJustify className="w-4 h-4" />
              </button>
              <button
                onClick={() => setPriceLayout('vertical')}
                className="p-1.5 rounded transition bg-gray-100 text-gray-600 hover:bg-gray-200"
                style={priceLayout === 'vertical' ? { backgroundColor: colors.primary, color: 'white' } : {}}
                title="Układ pionowy"
              >
                <LayoutGrid className="w-4 h-4" />
              </button>
            </div>
          )}
        </div>
      </div>

      {filteredProducts.length === 0 ? (
        <div className="bg-white rounded-lg shadow p-8 text-center">
          <Tag className="w-12 h-12 text-gray-300 mx-auto mb-3" />
          <p className="text-gray-500">Nie znaleziono produktów</p>
        </div>
      ) : (
        <div className="space-y-3">
          {Object.entries(groupedProducts).map(([category, categoryProducts]) => (
            <div key={category}>
              {selectedCategory === 'all' && (
                <div
                  className={`px-4 py-2.5 mb-2 rounded-lg shadow-md ${
                    category === '🔥 PROMOCJE'
                      ? 'bg-gradient-to-r from-red-500 to-orange-500 animate-pulse'
                      : ''
                  }`}
                  style={category !== '🔥 PROMOCJE' ? { background: colors.gradient } : {}}
                >
                  <h3 className="text-white font-bold text-base">{category}</h3>
                </div>
              )}
              <div className="bg-white rounded-lg shadow divide-y divide-gray-100">
                {categoryProducts.map((product) => {
              const hasPromo = product.promo_price && product.promo_price > 0;
              const hasDiscountPromo = hasPromo && product.promo_price! < (product.your_price || product.base_price);
              const discountPercent = hasDiscountPromo
                ? Math.round(((product.your_price || product.base_price) - product.promo_price!) / (product.your_price || product.base_price) * 100)
                : 0;
              const is10Plus1 = product.promo_10_plus_1;
              const hasAnyPromo = hasDiscountPromo || is10Plus1;
              const isInNotebook = notebookItems.includes(product.id);
              const swipeOffset = getSwipeTransform(product.id);
              const isPriceZero = product.base_price === 0 && (!product.your_price || product.your_price === 0) && (!product.promo_price || product.promo_price === 0);
              const isDisabled = isPriceZero || isInNotebook;
              return (
                <div
                  key={product.id}
                  className={`relative overflow-hidden ${isInNotebook ? 'bg-green-50' : hasAnyPromo ? 'bg-gradient-to-r from-red-50 to-orange-50 border-2 border-red-400' : ''} ${isDisabled ? 'opacity-60 cursor-not-allowed' : 'cursor-grab active:cursor-grabbing'}`}
                  style={{ touchAction: isDisabled ? 'auto' : 'none' }}
                  onTouchStart={isDisabled ? undefined : (e) => handleTouchStart(e, product.id)}
                  onTouchMove={isDisabled ? undefined : handleTouchMove}
                  onTouchEnd={isDisabled ? undefined : () => handleTouchEnd(product)}
                  onMouseDown={isDisabled ? undefined : (e) => handleMouseDown(e, product.id)}
                >
                    <div
                      className={`px-3 py-2 pr-14 ${isDisabled ? '' : 'hover:bg-gray-50'} transition`}
                      style={{
                        transform: isDisabled ? 'none' : `translateX(${swipeOffset}px)`,
                        transition: swipeOffset === 0 ? 'transform 0.3s ease-out' : 'none'
                      }}
                    >
                    <div className="flex items-center gap-2">
                      <div className="flex-1 min-w-0 mr-2">
                        <div className="flex items-baseline gap-2">
                          {showIndex && product.index && (
                            <span className="flex-shrink-0 w-7 h-7 bg-amber-100 text-amber-700 rounded-full flex items-center justify-center text-xs font-bold">
                              {product.index}
                            </span>
                          )}
                          <span className="font-medium text-sm text-gray-800 truncate">
                            {product.name}
                          </span>
                          <span className="text-xs text-gray-500 flex-shrink-0">({product.unit})</span>
                          {isInNotebook && (
                            <span className="text-[10px] bg-green-600 text-white px-1.5 py-0.5 rounded font-medium">W NOTATNIKU</span>
                          )}
                          {hasDiscountPromo && (
                            <span className="text-[10px] bg-red-600 text-white px-1.5 py-0.5 rounded font-bold animate-pulse">-{discountPercent}%</span>
                          )}
                          {is10Plus1 && (
                            <span className="text-[10px] bg-orange-600 text-white px-1.5 py-0.5 rounded font-bold">10+1 GRATIS</span>
                          )}
                        </div>
                        {showDescription && product.description && (
                          <p className="text-xs text-gray-600 truncate ml-9">{product.description}</p>
                        )}
                      </div>
                      {priceLayout === 'horizontal' ? (
                        <div className="flex items-center gap-2 flex-shrink-0" style={{ marginRight: '-60px' }}>
                          {product.promo_price && product.promo_price > 0 && product.promo_price < (product.your_price || product.base_price) ? (
                            <>
                              <span className="text-xs line-through text-gray-400">
                                {(product.your_price || product.base_price).toFixed(2)}
                              </span>
                              <span className="text-base font-bold text-red-600 animate-pulse">
                                {product.promo_price.toFixed(2)}
                              </span>
                            </>
                          ) : (
                            <span className="text-sm font-bold" style={{ color: colors.text }}>
                              {(product.your_price || product.base_price).toFixed(2)}
                            </span>
                          )}
                        </div>
                      ) : (
                        <div className="flex flex-col items-end gap-1 flex-shrink-0" style={{ marginRight: '-60px' }}>
                          {product.promo_price && product.promo_price > 0 && product.promo_price < (product.your_price || product.base_price) ? (
                            <>
                              <span className="text-sm line-through text-gray-400">
                                {(product.your_price || product.base_price).toFixed(2)}
                              </span>
                              <span className="text-base font-bold text-red-600 animate-pulse">
                                {product.promo_price.toFixed(2)}
                              </span>
                            </>
                          ) : (
                            <span className="text-base font-bold" style={{ color: colors.text }}>
                              {(product.your_price || product.base_price).toFixed(2)}
                            </span>
                          )}
                        </div>
                      )}
                    </div>
                    </div>
                  </div>
                );
              })}
              </div>
            </div>
          ))}
        </div>
      )}

      <div className="rounded-lg p-3 text-xs border" style={{ backgroundColor: colors.bgLight, color: colors.text, borderColor: colors.border }}>
        <p className="font-semibold mb-1">📋 Informacja o cenniku</p>
        <p>Ceny podane w cenniku są cenami bazowymi. Rzeczywiste ceny mogą różnić się w zależności od sklepu i specjalnych promocji.</p>
      </div>
    </div>
  );
}
