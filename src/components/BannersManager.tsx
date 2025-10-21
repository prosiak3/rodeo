import { useState, useEffect } from 'react';
import { Plus, Edit2, Trash2, Eye, EyeOff, Calendar } from 'lucide-react';
import { supabase } from '../lib/supabase';

interface OccasionType {
  id: string;
  code: string;
  name: string;
  description: string;
  category: string;
  is_recurring: boolean;
}

interface Banner {
  id: string;
  occasion_type_id: string;
  occasion_name: string;
  title: string;
  message: string;
  start_date: string;
  end_date: string;
  enabled: boolean;
  priority: number;
}

export default function BannersManager() {
  const [banners, setBanners] = useState<Banner[]>([]);
  const [occasionTypes, setOccasionTypes] = useState<OccasionType[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      const [bannersResult, typesResult] = await Promise.all([
        supabase
          .from('occasion_banners')
          .select(`
            *,
            occasion_types!inner(name)
          `)
          .order('priority', { ascending: false }),
        supabase
          .from('occasion_types')
          .select('*')
          .order('category', { ascending: true }),
      ]);

      if (bannersResult.data) {
        setBanners(bannersResult.data.map(b => ({
          ...b,
          occasion_name: b.occasion_types.name
        })));
      }

      if (typesResult.data) {
        setOccasionTypes(typesResult.data);
      }
    } catch (error) {
      console.error('Error loading banners:', error);
    } finally {
      setLoading(false);
    }
  };

  const toggleBannerEnabled = async (bannerId: string, currentState: boolean) => {
    try {
      const { error } = await supabase
        .from('occasion_banners')
        .update({ enabled: !currentState })
        .eq('id', bannerId);

      if (error) throw error;

      await loadData();
    } catch (error) {
      console.error('Error toggling banner:', error);
      alert('Nie udało się zmienić statusu baneru');
    }
  };

  const deleteBanner = async (bannerId: string) => {
    if (!confirm('Czy na pewno chcesz usunąć ten baner?')) return;

    try {
      const { error } = await supabase
        .from('occasion_banners')
        .delete()
        .eq('id', bannerId);

      if (error) throw error;

      await loadData();
    } catch (error) {
      console.error('Error deleting banner:', error);
      alert('Nie udało się usunąć baneru');
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('pl-PL', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-amber-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-gray-800">Banery Okolicznościowe</h2>
        <button
          onClick={() => setShowForm(!showForm)}
          className="flex items-center gap-2 px-4 py-2 bg-amber-500 text-white rounded-lg hover:bg-amber-600 transition"
        >
          <Plus className="w-5 h-5" />
          Nowy Baner
        </button>
      </div>

      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <h3 className="font-semibold text-blue-900 mb-2">ℹ️ Jak działają banery?</h3>
        <ul className="text-sm text-blue-800 space-y-1">
          <li>• Banery wyświetlają się automatycznie na podstawie dat i reguł powtarzania</li>
          <li>• Promocje weekendowe (czwartek-niedziela) włączają się automatycznie</li>
          <li>• Możesz tworzyć banery na święta, pory roku i niestandardowe okazje</li>
          <li>• Priorytet określa kolejność wyświetlania (wyższy = ważniejszy)</li>
          <li>• Banery rotują się co 10 sekund jeśli jest ich wiele aktywnych</li>
        </ul>
      </div>

      {/* Dostępne typy okazji */}
      <div className="bg-white rounded-lg shadow p-6">
        <h3 className="font-semibold text-lg mb-4">Dostępne Typy Okazji</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
          {occasionTypes.map((type) => (
            <div
              key={type.id}
              className="border border-gray-200 rounded-lg p-3 hover:border-amber-500 transition"
            >
              <div className="font-semibold text-gray-800">{type.name}</div>
              <div className="text-sm text-gray-600">{type.description}</div>
              <div className="flex items-center gap-2 mt-2">
                <span className={`text-xs px-2 py-1 rounded ${
                  type.category === 'holiday' ? 'bg-red-100 text-red-800' :
                  type.category === 'seasonal' ? 'bg-green-100 text-green-800' :
                  type.category === 'weekly' ? 'bg-blue-100 text-blue-800' :
                  'bg-purple-100 text-purple-800'
                }`}>
                  {type.category}
                </span>
                {type.is_recurring && (
                  <span className="text-xs px-2 py-1 rounded bg-orange-100 text-orange-800">
                    Powtarzalne
                  </span>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Lista aktywnych banerów */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200">
          <h3 className="font-semibold text-lg">Aktywne Banery ({banners.length})</h3>
        </div>

        {banners.length === 0 ? (
          <div className="p-8 text-center text-gray-500">
            Brak banerów. Utwórz pierwszy baner, aby rozpocząć.
          </div>
        ) : (
          <div className="divide-y divide-gray-200">
            {banners.map((banner) => (
              <div key={banner.id} className="p-6 hover:bg-gray-50 transition">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <h4 className="font-semibold text-lg">{banner.title}</h4>
                      <span className="text-xs px-2 py-1 rounded bg-gray-100 text-gray-700">
                        {banner.occasion_name}
                      </span>
                      <span className="text-xs px-2 py-1 rounded bg-amber-100 text-amber-800">
                        Priorytet: {banner.priority}
                      </span>
                    </div>

                    <p className="text-gray-600 mb-3">{banner.message}</p>

                    <div className="flex items-center gap-4 text-sm text-gray-500">
                      <div className="flex items-center gap-1">
                        <Calendar className="w-4 h-4" />
                        {formatDate(banner.start_date)} - {formatDate(banner.end_date)}
                      </div>
                      <div className={`flex items-center gap-1 ${
                        banner.enabled ? 'text-green-600' : 'text-red-600'
                      }`}>
                        {banner.enabled ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
                        {banner.enabled ? 'Aktywny' : 'Nieaktywny'}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 ml-4">
                    <button
                      onClick={() => toggleBannerEnabled(banner.id, banner.enabled)}
                      className={`p-2 rounded-lg transition ${
                        banner.enabled
                          ? 'bg-green-100 text-green-700 hover:bg-green-200'
                          : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                      }`}
                      title={banner.enabled ? 'Wyłącz' : 'Włącz'}
                    >
                      {banner.enabled ? <Eye className="w-5 h-5" /> : <EyeOff className="w-5 h-5" />}
                    </button>

                    <button
                      className="p-2 bg-blue-100 text-blue-700 rounded-lg hover:bg-blue-200 transition"
                      title="Edytuj"
                    >
                      <Edit2 className="w-5 h-5" />
                    </button>

                    <button
                      onClick={() => deleteBanner(banner.id)}
                      className="p-2 bg-red-100 text-red-700 rounded-lg hover:bg-red-200 transition"
                      title="Usuń"
                    >
                      <Trash2 className="w-5 h-5" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {showForm && (
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="font-semibold text-lg mb-4">Tworzenie nowego baneru</h3>
          <p className="text-gray-600 mb-4">
            Funkcja tworzenia banerów będzie dostępna wkrótce. W międzyczasie możesz włączać/wyłączać istniejące banery.
          </p>
          <button
            onClick={() => setShowForm(false)}
            className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300"
          >
            Zamknij
          </button>
        </div>
      )}
    </div>
  );
}
