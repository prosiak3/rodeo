import { useState, useEffect } from 'react';
import { Percent, Calendar, Package, TrendingDown, Trash2, AlertCircle, CheckCircle, Plus, Copy, CheckSquare, Square, X } from 'lucide-react';
import { supabase } from '../lib/supabase';

interface PromotionStats {
  total_promotions: number;
  active_promotions: number;
  expired_promotions: number;
  products_with_promo: number;
  stores_affected: number;
}

interface PromotionDetail {
  id: string;
  product_id: string;
  product_name: string;
  product_code: string;
  store_id: string | null;
  store_name: string | null;
  group_id: string | null;
  group_name: string | null;
  base_price: number;
  your_price: number | null;
  promo_price: number;
  discount_percent: number;
  valid_from: string;
  valid_to: string | null;
  is_active: boolean;
  promo_10_plus_1: boolean;
}

interface Product {
  id: string;
  name: string;
  code: string;
  base_price: number;
}

interface Store {
  id: string;
  name: string;
  code: string;
}

interface StoreGroup {
  id: string;
  name: string;
  store_count: number;
}

export default function PromotionsOverview() {
  const [stats, setStats] = useState<PromotionStats | null>(null);
  const [promotions, setPromotions] = useState<PromotionDetail[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'active' | 'expired'>('active');
  const [deleting, setDeleting] = useState(false);
  const [selectedPromotions, setSelectedPromotions] = useState<Set<string>>(new Set());
  const [showNewPromoModal, setShowNewPromoModal] = useState(false);
  const [showDuplicateModal, setShowDuplicateModal] = useState(false);
  const [duplicateSource, setDuplicateSource] = useState<PromotionDetail | null>(null);

  const [products, setProducts] = useState<Product[]>([]);
  const [stores, setStores] = useState<Store[]>([]);
  const [groups, setGroups] = useState<StoreGroup[]>([]);

  const [newPromo, setNewPromo] = useState({
    assignmentType: 'store' as 'store' | 'group' | 'all',
    product_id: '',
    store_id: '',
    group_id: '',
    discount_type: 'percentage' as 'percentage' | 'fixed',
    discount_value: 10,
    enable_10_plus_1: false,
    valid_from: new Date().toISOString().split('T')[0],
    valid_to: '',
  });

  useEffect(() => {
    loadData();
    loadSelectionData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      await Promise.all([loadStats(), loadPromotions()]);
    } catch (error) {
      console.error('Error loading promotions data:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadSelectionData = async () => {
    try {
      const [productsData, storesData, groupsData] = await Promise.all([
        supabase.from('products').select('id, name, code, base_price').eq('active', true).order('name'),
        supabase.from('stores').select('id, name, code').eq('active', true).order('name'),
        supabase.from('store_groups').select('id, name').eq('active', true).order('name'),
      ]);

      if (productsData.data) setProducts(productsData.data);
      if (storesData.data) setStores(storesData.data);

      if (groupsData.data) {
        const groupsWithCounts = await Promise.all(
          groupsData.data.map(async (group) => {
            const { count } = await supabase
              .from('store_group_members')
              .select('*', { count: 'exact', head: true })
              .eq('group_id', group.id);
            return { ...group, store_count: count || 0 };
          })
        );
        setGroups(groupsWithCounts);
      }
    } catch (error) {
      console.error('Error loading selection data:', error);
    }
  };

  const loadStats = async () => {
    try {
      const { data: allPromos, error: allError } = await supabase
        .from('special_prices')
        .select('id, product_id, store_id, promo_price, valid_to')
        .not('promo_price', 'is', null);

      if (allError) throw allError;

      const now = new Date();
      const active = allPromos?.filter(p => !p.valid_to || new Date(p.valid_to) > now) || [];
      const expired = allPromos?.filter(p => p.valid_to && new Date(p.valid_to) <= now) || [];

      const uniqueProducts = new Set(allPromos?.map(p => p.product_id) || []);
      const uniqueStores = new Set(allPromos?.filter(p => p.store_id).map(p => p.store_id) || []);

      setStats({
        total_promotions: allPromos?.length || 0,
        active_promotions: active.length,
        expired_promotions: expired.length,
        products_with_promo: uniqueProducts.size,
        stores_affected: uniqueStores.size,
      });
    } catch (error) {
      console.error('Error loading stats:', error);
    }
  };

  const loadPromotions = async () => {
    try {
      const { data, error } = await supabase
        .from('special_prices')
        .select(`
          id,
          product_id,
          store_id,
          store_group_id,
          promo_price,
          your_price,
          valid_from,
          valid_to,
          products!inner(id, name, code, base_price, promo_10_plus_1),
          stores(name),
          store_groups(name)
        `)
        .not('promo_price', 'is', null)
        .order('valid_to', { ascending: false, nullsFirst: false });

      if (error) throw error;

      const now = new Date();
      const formatted: PromotionDetail[] = (data || []).map((p: any) => {
        const basePrice = p.products.base_price;
        const yourPrice = p.your_price || basePrice;
        const discountPercent = Math.round(((yourPrice - p.promo_price) / yourPrice) * 100);
        const isActive = !p.valid_to || new Date(p.valid_to) > now;

        return {
          id: p.id,
          product_id: p.product_id,
          product_name: p.products.name,
          product_code: p.products.code,
          store_id: p.store_id,
          store_name: p.stores?.name || null,
          group_id: p.store_group_id,
          group_name: p.store_groups?.name || null,
          base_price: basePrice,
          your_price: yourPrice,
          promo_price: p.promo_price,
          discount_percent: discountPercent,
          valid_from: p.valid_from,
          valid_to: p.valid_to,
          is_active: isActive,
          promo_10_plus_1: p.products.promo_10_plus_1 || false,
        };
      });

      setPromotions(formatted);
    } catch (error) {
      console.error('Error loading promotions:', error);
    }
  };

  const handleCreatePromotion = async () => {
    if (!newPromo.product_id) {
      alert('Wybierz produkt');
      return;
    }

    if (newPromo.assignmentType === 'store' && !newPromo.store_id) {
      alert('Wybierz sklep');
      return;
    }

    if (newPromo.assignmentType === 'group' && !newPromo.group_id) {
      alert('Wybierz grupę');
      return;
    }

    setDeleting(true);
    try {
      const product = products.find(p => p.id === newPromo.product_id);
      if (!product) throw new Error('Produkt nie znaleziony');

      let promoPrice: number;
      if (newPromo.discount_type === 'percentage') {
        promoPrice = product.base_price * (1 - newPromo.discount_value / 100);
      } else {
        promoPrice = newPromo.discount_value;
      }
      promoPrice = Math.round(promoPrice * 100) / 100;

      const inserts = [];
      const baseData = {
        product_id: newPromo.product_id,
        promo_price: promoPrice,
        your_price: null,
        valid_from: newPromo.valid_from || new Date().toISOString(),
        valid_to: newPromo.valid_to || null,
      };

      if (newPromo.assignmentType === 'store') {
        inserts.push({ ...baseData, store_id: newPromo.store_id, store_group_id: null });
      } else if (newPromo.assignmentType === 'group') {
        inserts.push({ ...baseData, store_id: null, store_group_id: newPromo.group_id });
      } else {
        stores.forEach(store => {
          inserts.push({ ...baseData, store_id: store.id, store_group_id: null });
        });
      }

      const { error: insertError } = await supabase.from('special_prices').insert(inserts);
      if (insertError) throw insertError;

      if (newPromo.enable_10_plus_1) {
        const { error: updateError } = await supabase
          .from('products')
          .update({ promo_10_plus_1: true })
          .eq('id', newPromo.product_id);
        if (updateError) throw updateError;
      }

      const count = newPromo.assignmentType === 'all' ? stores.length : 1;
      alert(`Utworzono ${count} ${count === 1 ? 'promocję' : 'promocji'}`);
      setShowNewPromoModal(false);
      setNewPromo({
        assignmentType: 'store',
        product_id: '',
        store_id: '',
        group_id: '',
        discount_type: 'percentage',
        discount_value: 10,
        enable_10_plus_1: false,
        valid_from: new Date().toISOString().split('T')[0],
        valid_to: '',
      });
      await loadData();
    } catch (error) {
      console.error('Error creating promotion:', error);
      alert('Błąd podczas tworzenia promocji');
    } finally {
      setDeleting(false);
    }
  };

  const handleDuplicatePromotion = async () => {
    if (!duplicateSource) return;

    setDeleting(true);
    try {
      const inserts = [];
      const baseData = {
        product_id: duplicateSource.product_id,
        promo_price: duplicateSource.promo_price,
        your_price: duplicateSource.your_price,
        valid_from: newPromo.valid_from || new Date().toISOString(),
        valid_to: newPromo.valid_to || null,
      };

      if (duplicateSource.group_id) {
        inserts.push({ ...baseData, store_id: null, store_group_id: duplicateSource.group_id });
      } else if (duplicateSource.store_id) {
        inserts.push({ ...baseData, store_id: duplicateSource.store_id, store_group_id: null });
      } else {
        stores.forEach(store => {
          inserts.push({ ...baseData, store_id: store.id, store_group_id: null });
        });
      }

      const { error } = await supabase.from('special_prices').insert(inserts);
      if (error) throw error;

      alert(`Promocja została zduplikowana`);
      setShowDuplicateModal(false);
      setDuplicateSource(null);
      await loadData();
    } catch (error) {
      console.error('Error duplicating promotion:', error);
      alert('Błąd podczas duplikowania promocji');
    } finally {
      setDeleting(false);
    }
  };

  const handleBulkDelete = async () => {
    if (selectedPromotions.size === 0) return;

    if (!confirm(`Czy na pewno chcesz usunąć ${selectedPromotions.size} ${selectedPromotions.size === 1 ? 'promocję' : 'promocji'}?`)) {
      return;
    }

    setDeleting(true);
    try {
      const { error } = await supabase
        .from('special_prices')
        .delete()
        .in('id', Array.from(selectedPromotions));

      if (error) throw error;

      alert('Promocje zostały usunięte');
      setSelectedPromotions(new Set());
      await loadData();
    } catch (error) {
      console.error('Error deleting promotions:', error);
      alert('Błąd podczas usuwania promocji');
    } finally {
      setDeleting(false);
    }
  };

  const handleBulkDeleteExpired = async () => {
    if (!confirm('Czy na pewno chcesz usunąć wszystkie wygasłe promocje? Ta operacja jest nieodwracalna.')) {
      return;
    }

    setDeleting(true);
    try {
      const now = new Date().toISOString();

      const { error } = await supabase
        .from('special_prices')
        .delete()
        .not('promo_price', 'is', null)
        .not('valid_to', 'is', null)
        .lt('valid_to', now);

      if (error) throw error;

      alert('Wygasłe promocje zostały usunięte');
      await loadData();
    } catch (error) {
      console.error('Error deleting expired promotions:', error);
      alert('Błąd podczas usuwania promocji');
    } finally {
      setDeleting(false);
    }
  };

  const handleDeletePromotion = async (id: string) => {
    if (!confirm('Czy na pewno chcesz usunąć tę promocję?')) {
      return;
    }

    try {
      const { error } = await supabase
        .from('special_prices')
        .delete()
        .eq('id', id);

      if (error) throw error;

      alert('Promocja została usunięta');
      await loadData();
    } catch (error) {
      console.error('Error deleting promotion:', error);
      alert('Błąd podczas usuwania promocji');
    }
  };

  const toggleSelection = (id: string) => {
    setSelectedPromotions(prev => {
      const newSet = new Set(prev);
      if (newSet.has(id)) {
        newSet.delete(id);
      } else {
        newSet.add(id);
      }
      return newSet;
    });
  };

  const toggleSelectAll = () => {
    if (selectedPromotions.size === filteredPromotions.length) {
      setSelectedPromotions(new Set());
    } else {
      setSelectedPromotions(new Set(filteredPromotions.map(p => p.id)));
    }
  };

  const openDuplicateModal = (promo: PromotionDetail) => {
    setDuplicateSource(promo);
    setNewPromo({
      ...newPromo,
      valid_from: new Date().toISOString().split('T')[0],
      valid_to: '',
    });
    setShowDuplicateModal(true);
  };

  const filteredPromotions = promotions.filter(p => {
    if (filter === 'active') return p.is_active;
    if (filter === 'expired') return !p.is_active;
    return true;
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
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Percent className="w-8 h-8 text-amber-600" />
          <h2 className="text-2xl font-bold text-gray-800">Przegląd Promocji</h2>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => setShowNewPromoModal(true)}
            className="px-4 py-2 bg-green-600 text-white rounded-lg font-medium hover:bg-green-700 transition flex items-center gap-2"
          >
            <Plus className="w-4 h-4" />
            Nowa promocja
          </button>
          {selectedPromotions.size > 0 && (
            <button
              onClick={handleBulkDelete}
              disabled={deleting}
              className="px-4 py-2 bg-red-600 text-white rounded-lg font-medium hover:bg-red-700 transition disabled:opacity-50 flex items-center gap-2"
            >
              <Trash2 className="w-4 h-4" />
              Usuń zaznaczone ({selectedPromotions.size})
            </button>
          )}
          {stats && stats.expired_promotions > 0 && (
            <button
              onClick={handleBulkDeleteExpired}
              disabled={deleting}
              className="px-4 py-2 bg-orange-600 text-white rounded-lg font-medium hover:bg-orange-700 transition disabled:opacity-50 flex items-center gap-2"
            >
              <Trash2 className="w-4 h-4" />
              Usuń wygasłe ({stats.expired_promotions})
            </button>
          )}
        </div>
      </div>

      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
          <div className="bg-white rounded-xl shadow p-6">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-blue-100 rounded-lg">
                <Package className="w-6 h-6 text-blue-600" />
              </div>
              <div>
                <p className="text-sm text-gray-600">Wszystkie promocje</p>
                <p className="text-2xl font-bold text-gray-800">{stats.total_promotions}</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow p-6">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-green-100 rounded-lg">
                <CheckCircle className="w-6 h-6 text-green-600" />
              </div>
              <div>
                <p className="text-sm text-gray-600">Aktywne</p>
                <p className="text-2xl font-bold text-green-600">{stats.active_promotions}</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow p-6">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-red-100 rounded-lg">
                <AlertCircle className="w-6 h-6 text-red-600" />
              </div>
              <div>
                <p className="text-sm text-gray-600">Wygasłe</p>
                <p className="text-2xl font-bold text-red-600">{stats.expired_promotions}</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow p-6">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-purple-100 rounded-lg">
                <Package className="w-6 h-6 text-purple-600" />
              </div>
              <div>
                <p className="text-sm text-gray-600">Produkty</p>
                <p className="text-2xl font-bold text-purple-600">{stats.products_with_promo}</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow p-6">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-orange-100 rounded-lg">
                <TrendingDown className="w-6 h-6 text-orange-600" />
              </div>
              <div>
                <p className="text-sm text-gray-600">Sklepy</p>
                <p className="text-2xl font-bold text-orange-600">{stats.stores_affected}</p>
              </div>
            </div>
          </div>
        </div>
      )}

      <div className="bg-white rounded-xl shadow">
        <div className="p-6 border-b border-gray-200">
          <div className="flex gap-2">
            <button
              onClick={() => setFilter('all')}
              className={`px-4 py-2 rounded-lg font-medium transition ${
                filter === 'all'
                  ? 'bg-amber-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              Wszystkie ({promotions.length})
            </button>
            <button
              onClick={() => setFilter('active')}
              className={`px-4 py-2 rounded-lg font-medium transition ${
                filter === 'active'
                  ? 'bg-green-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              Aktywne ({promotions.filter(p => p.is_active).length})
            </button>
            <button
              onClick={() => setFilter('expired')}
              className={`px-4 py-2 rounded-lg font-medium transition ${
                filter === 'expired'
                  ? 'bg-red-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              Wygasłe ({promotions.filter(p => !p.is_active).length})
            </button>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b-2 border-gray-200 bg-gray-50">
                <th className="text-center py-3 px-4 w-12">
                  <button
                    onClick={toggleSelectAll}
                    className="p-1 hover:bg-gray-200 rounded transition"
                  >
                    {selectedPromotions.size === filteredPromotions.length && filteredPromotions.length > 0 ? (
                      <CheckSquare className="w-5 h-5 text-amber-600" />
                    ) : (
                      <Square className="w-5 h-5 text-gray-400" />
                    )}
                  </button>
                </th>
                <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">Status</th>
                <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">Produkt</th>
                <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">Lokalizacja</th>
                <th className="text-right py-3 px-4 text-sm font-semibold text-gray-700">Cena oryginalna</th>
                <th className="text-right py-3 px-4 text-sm font-semibold text-gray-700">Cena promocyjna</th>
                <th className="text-center py-3 px-4 text-sm font-semibold text-gray-700">Rabat</th>
                <th className="text-center py-3 px-4 text-sm font-semibold text-gray-700">10+1</th>
                <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">Ważność</th>
                <th className="text-center py-3 px-4 text-sm font-semibold text-gray-700">Akcje</th>
              </tr>
            </thead>
            <tbody>
              {filteredPromotions.map((promo) => (
                <tr key={promo.id} className={`border-b border-gray-100 hover:bg-gray-50 ${!promo.is_active ? 'opacity-50' : ''} ${selectedPromotions.has(promo.id) ? 'bg-amber-50' : ''}`}>
                  <td className="py-3 px-4 text-center">
                    <button
                      onClick={() => toggleSelection(promo.id)}
                      className="p-1 hover:bg-gray-200 rounded transition"
                    >
                      {selectedPromotions.has(promo.id) ? (
                        <CheckSquare className="w-5 h-5 text-amber-600" />
                      ) : (
                        <Square className="w-5 h-5 text-gray-400" />
                      )}
                    </button>
                  </td>
                  <td className="py-3 px-4">
                    {promo.is_active ? (
                      <span className="inline-flex items-center gap-1 px-2 py-1 bg-green-100 text-green-700 rounded-full text-xs font-medium">
                        <CheckCircle className="w-3 h-3" />
                        Aktywna
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 px-2 py-1 bg-red-100 text-red-700 rounded-full text-xs font-medium">
                        <AlertCircle className="w-3 h-3" />
                        Wygasła
                      </span>
                    )}
                  </td>
                  <td className="py-3 px-4">
                    <div>
                      <div className="font-medium text-gray-800">{promo.product_name}</div>
                      <div className="text-xs text-gray-500">{promo.product_code}</div>
                    </div>
                  </td>
                  <td className="py-3 px-4 text-sm">
                    {promo.group_name ? (
                      <span className="text-purple-600 font-medium">Grupa: {promo.group_name}</span>
                    ) : promo.store_name ? (
                      <span className="text-blue-600">{promo.store_name}</span>
                    ) : (
                      <span className="text-gray-400">Wszystkie</span>
                    )}
                  </td>
                  <td className="py-3 px-4 text-sm text-right font-mono">
                    {promo.your_price.toFixed(2)} zł
                  </td>
                  <td className="py-3 px-4 text-sm text-right font-mono font-bold text-red-600">
                    {promo.promo_price.toFixed(2)} zł
                  </td>
                  <td className="py-3 px-4 text-center">
                    <span className="inline-block px-2 py-1 bg-red-100 text-red-700 rounded text-xs font-bold">
                      -{promo.discount_percent}%
                    </span>
                  </td>
                  <td className="py-3 px-4 text-center">
                    {promo.promo_10_plus_1 ? (
                      <span className="inline-block px-2 py-1 bg-orange-100 text-orange-700 rounded text-xs font-bold">
                        10+1
                      </span>
                    ) : (
                      <span className="text-gray-400">—</span>
                    )}
                  </td>
                  <td className="py-3 px-4 text-sm">
                    <div className="flex items-center gap-1 text-gray-600">
                      <Calendar className="w-4 h-4" />
                      <div>
                        <div>{new Date(promo.valid_from).toLocaleDateString('pl-PL')}</div>
                        {promo.valid_to && (
                          <div className="text-xs">do {new Date(promo.valid_to).toLocaleDateString('pl-PL')}</div>
                        )}
                      </div>
                    </div>
                  </td>
                  <td className="py-3 px-4">
                    <div className="flex items-center justify-center gap-2">
                      {!promo.is_active && (
                        <button
                          onClick={() => openDuplicateModal(promo)}
                          className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition"
                          title="Uruchom ponownie"
                        >
                          <Copy className="w-4 h-4" />
                        </button>
                      )}
                      <button
                        onClick={() => handleDeletePromotion(promo.id)}
                        className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition"
                        title="Usuń promocję"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {filteredPromotions.length === 0 && (
          <div className="text-center py-12 text-gray-500">
            <Percent className="w-12 h-12 mx-auto mb-3 opacity-30" />
            <p>Brak promocji do wyświetlenia</p>
          </div>
        )}
      </div>

      <div className="bg-amber-50 border border-amber-200 rounded-xl p-4">
        <h3 className="font-semibold text-amber-900 mb-2 flex items-center gap-2">
          <AlertCircle className="w-5 h-5" />
          Informacja
        </h3>
        <p className="text-sm text-amber-800">
          Ten panel pokazuje wszystkie promocje w systemie. Promocje aktywne są widoczne dla ekspediantów w cennikach.
          Możesz zarządzać promocjami przechodząc do zakładki <strong>"Ceny specjalne"</strong> w panelu administracyjnym.
        </p>
      </div>

      {showNewPromoModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-gray-200">
              <div className="flex items-center justify-between">
                <h3 className="text-xl font-bold text-gray-800">Nowa promocja</h3>
                <button
                  onClick={() => setShowNewPromoModal(false)}
                  className="text-gray-400 hover:text-gray-600 transition"
                >
                  <X className="w-6 h-6" />
                </button>
              </div>
            </div>

            <div className="p-6 space-y-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Produkt
                </label>
                <select
                  value={newPromo.product_id}
                  onChange={(e) => setNewPromo({ ...newPromo, product_id: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:border-amber-500 focus:outline-none"
                >
                  <option value="">-- Wybierz produkt --</option>
                  {products.map(p => (
                    <option key={p.id} value={p.id}>
                      {p.name} ({p.code}) - {p.base_price.toFixed(2)} zł
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Przypisz do
                </label>
                <div className="flex gap-4 mb-4">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="radio"
                      checked={newPromo.assignmentType === 'store'}
                      onChange={() => setNewPromo({ ...newPromo, assignmentType: 'store' })}
                      className="w-4 h-4 text-amber-600"
                    />
                    <span className="text-sm">Pojedynczy sklep</span>
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="radio"
                      checked={newPromo.assignmentType === 'group'}
                      onChange={() => setNewPromo({ ...newPromo, assignmentType: 'group' })}
                      className="w-4 h-4 text-amber-600"
                    />
                    <span className="text-sm">Grupa sklepów</span>
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="radio"
                      checked={newPromo.assignmentType === 'all'}
                      onChange={() => setNewPromo({ ...newPromo, assignmentType: 'all' })}
                      className="w-4 h-4 text-amber-600"
                    />
                    <span className="text-sm">Wszystkie ({stores.length})</span>
                  </label>
                </div>

                {newPromo.assignmentType === 'store' && (
                  <select
                    value={newPromo.store_id}
                    onChange={(e) => setNewPromo({ ...newPromo, store_id: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:border-amber-500 focus:outline-none"
                  >
                    <option value="">-- Wybierz sklep --</option>
                    {stores.map(s => (
                      <option key={s.id} value={s.id}>
                        {s.name} ({s.code})
                      </option>
                    ))}
                  </select>
                )}

                {newPromo.assignmentType === 'group' && (
                  <select
                    value={newPromo.group_id}
                    onChange={(e) => setNewPromo({ ...newPromo, group_id: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:border-amber-500 focus:outline-none"
                  >
                    <option value="">-- Wybierz grupę --</option>
                    {groups.map(g => (
                      <option key={g.id} value={g.id}>
                        {g.name} ({g.store_count} sklepów)
                      </option>
                    ))}
                  </select>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Typ rabatu
                </label>
                <div className="flex gap-4 mb-4">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="radio"
                      checked={newPromo.discount_type === 'percentage'}
                      onChange={() => setNewPromo({ ...newPromo, discount_type: 'percentage' })}
                      className="w-4 h-4 text-amber-600"
                    />
                    <span className="text-sm">Procent (%)</span>
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="radio"
                      checked={newPromo.discount_type === 'fixed'}
                      onChange={() => setNewPromo({ ...newPromo, discount_type: 'fixed' })}
                      className="w-4 h-4 text-amber-600"
                    />
                    <span className="text-sm">Cena stała (zł)</span>
                  </label>
                </div>

                <input
                  type="number"
                  value={newPromo.discount_value}
                  onChange={(e) => setNewPromo({ ...newPromo, discount_value: parseFloat(e.target.value) || 0 })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:border-amber-500 focus:outline-none"
                  step={newPromo.discount_type === 'percentage' ? '1' : '0.01'}
                  min="0"
                  max={newPromo.discount_type === 'percentage' ? '100' : undefined}
                />
              </div>

              <div>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={newPromo.enable_10_plus_1}
                    onChange={(e) => setNewPromo({ ...newPromo, enable_10_plus_1: e.target.checked })}
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
                    value={newPromo.valid_from}
                    onChange={(e) => setNewPromo({ ...newPromo, valid_from: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:border-amber-500 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Data zakończenia (opcjonalnie)
                  </label>
                  <input
                    type="date"
                    value={newPromo.valid_to}
                    onChange={(e) => setNewPromo({ ...newPromo, valid_to: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:border-amber-500 focus:outline-none"
                  />
                </div>
              </div>
            </div>

            <div className="p-6 border-t border-gray-200 flex justify-end gap-3">
              <button
                onClick={() => setShowNewPromoModal(false)}
                className="px-6 py-2 bg-gray-200 text-gray-700 rounded-lg font-medium hover:bg-gray-300 transition"
              >
                Anuluj
              </button>
              <button
                onClick={handleCreatePromotion}
                disabled={deleting}
                className="px-6 py-2 bg-green-600 text-white rounded-lg font-medium hover:bg-green-700 transition disabled:opacity-50"
              >
                {deleting ? 'Tworzenie...' : 'Utwórz promocję'}
              </button>
            </div>
          </div>
        </div>
      )}

      {showDuplicateModal && duplicateSource && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-2xl max-w-2xl w-full">
            <div className="p-6 border-b border-gray-200">
              <div className="flex items-center justify-between">
                <h3 className="text-xl font-bold text-gray-800">Uruchom promocję ponownie</h3>
                <button
                  onClick={() => setShowDuplicateModal(false)}
                  className="text-gray-400 hover:text-gray-600 transition"
                >
                  <X className="w-6 h-6" />
                </button>
              </div>
              <p className="text-sm text-gray-600 mt-2">
                {duplicateSource.product_name} - {duplicateSource.promo_price.toFixed(2)} zł ({duplicateSource.discount_percent}% rabatu)
              </p>
            </div>

            <div className="p-6 space-y-6">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Data rozpoczęcia
                  </label>
                  <input
                    type="date"
                    value={newPromo.valid_from}
                    onChange={(e) => setNewPromo({ ...newPromo, valid_from: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:border-amber-500 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Data zakończenia (opcjonalnie)
                  </label>
                  <input
                    type="date"
                    value={newPromo.valid_to}
                    onChange={(e) => setNewPromo({ ...newPromo, valid_to: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:border-amber-500 focus:outline-none"
                  />
                </div>
              </div>

              <div className="bg-blue-50 rounded-lg p-4">
                <h4 className="font-semibold text-blue-900 mb-2">Szczegóły promocji</h4>
                <ul className="text-sm text-blue-800 space-y-1">
                  <li>Produkt: {duplicateSource.product_name}</li>
                  <li>Lokalizacja: {duplicateSource.group_name || duplicateSource.store_name || 'Wszystkie sklepy'}</li>
                  <li>Rabat: {duplicateSource.discount_percent}%</li>
                  <li>Cena promocyjna: {duplicateSource.promo_price.toFixed(2)} zł</li>
                </ul>
              </div>
            </div>

            <div className="p-6 border-t border-gray-200 flex justify-end gap-3">
              <button
                onClick={() => setShowDuplicateModal(false)}
                className="px-6 py-2 bg-gray-200 text-gray-700 rounded-lg font-medium hover:bg-gray-300 transition"
              >
                Anuluj
              </button>
              <button
                onClick={handleDuplicatePromotion}
                disabled={deleting}
                className="px-6 py-2 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition disabled:opacity-50"
              >
                {deleting ? 'Uruchamianie...' : 'Uruchom promocję'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
