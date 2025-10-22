import { useState, useEffect } from 'react';
import { Percent, Calendar, Package, TrendingDown, Trash2, AlertCircle, CheckCircle } from 'lucide-react';
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
  product_name: string;
  product_code: string;
  store_name: string | null;
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

export default function PromotionsOverview() {
  const [stats, setStats] = useState<PromotionStats | null>(null);
  const [promotions, setPromotions] = useState<PromotionDetail[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'active' | 'expired'>('active');
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    loadData();
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
          product_name: p.products.name,
          product_code: p.products.code,
          store_name: p.stores?.name || null,
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
        {stats && stats.expired_promotions > 0 && (
          <button
            onClick={handleBulkDeleteExpired}
            disabled={deleting}
            className="px-4 py-2 bg-red-600 text-white rounded-lg font-medium hover:bg-red-700 transition disabled:opacity-50 flex items-center gap-2"
          >
            <Trash2 className="w-4 h-4" />
            Usuń wygasłe ({stats.expired_promotions})
          </button>
        )}
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
                <tr key={promo.id} className={`border-b border-gray-100 hover:bg-gray-50 ${!promo.is_active ? 'opacity-50' : ''}`}>
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
                  <td className="py-3 px-4 text-center">
                    <button
                      onClick={() => handleDeletePromotion(promo.id)}
                      className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition"
                      title="Usuń promocję"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
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
          Możesz zarządzać promocjami przechodząc do zakładki <strong>"Promo"</strong> w panelu administracyjnym.
        </p>
      </div>
    </div>
  );
}
