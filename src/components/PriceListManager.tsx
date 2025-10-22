import { useState, useEffect } from 'react';
import { Plus, Edit2, Trash2, CheckCircle, XCircle, Calendar, Link2, Package, Clock } from 'lucide-react';
import { supabase } from '../lib/supabase';
import PriceListAssignments from './PriceListAssignments';
import PriceListProductsManager from './PriceListProductsManager';
import PriceListHistory from './PriceListHistory';

interface PriceList {
  id: string;
  name: string;
  description: string | null;
  is_active: boolean;
  valid_from: string;
  valid_to: string | null;
  created_at: string;
}

export default function PriceListManager() {
  const [priceLists, setPriceLists] = useState<PriceList[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [showAssignments, setShowAssignments] = useState(false);
  const [selectedPriceListId, setSelectedPriceListId] = useState<string | null>(null);
  const [showHistory, setShowHistory] = useState(false);
  const [historyPriceListId, setHistoryPriceListId] = useState<string | null>(null);
  const [historyPriceListName, setHistoryPriceListName] = useState<string>('');
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    valid_from: new Date().toISOString().split('T')[0],
    valid_to: '',
  });

  useEffect(() => {
    loadPriceLists();
  }, []);

  const loadPriceLists = async () => {
    try {
      const { data, error } = await supabase
        .from('price_lists')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setPriceLists(data || []);
    } catch (error) {
      console.error('Error loading price lists:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      if (editingId) {
        const { error } = await supabase
          .from('price_lists')
          .update({
            name: formData.name,
            description: formData.description || null,
            valid_from: formData.valid_from,
            valid_to: formData.valid_to || null,
          })
          .eq('id', editingId);

        if (error) throw error;
      } else {
        const { error } = await supabase
          .from('price_lists')
          .insert({
            name: formData.name,
            description: formData.description || null,
            valid_from: formData.valid_from,
            valid_to: formData.valid_to || null,
            is_active: false,
          });

        if (error) throw error;
      }

      setFormData({ name: '', description: '', valid_from: new Date().toISOString().split('T')[0], valid_to: '' });
      setShowForm(false);
      setEditingId(null);
      loadPriceLists();
    } catch (error) {
      console.error('Error saving price list:', error);
      alert('Wystąpił błąd podczas zapisywania cennika');
    }
  };

  const handleEdit = (priceList: PriceList) => {
    setFormData({
      name: priceList.name,
      description: priceList.description || '',
      valid_from: priceList.valid_from.split('T')[0],
      valid_to: priceList.valid_to ? priceList.valid_to.split('T')[0] : '',
    });
    setEditingId(priceList.id);
    setShowForm(true);
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Czy na pewno chcesz usunąć ten cennik?')) return;

    try {
      const { error } = await supabase
        .from('price_lists')
        .delete()
        .eq('id', id);

      if (error) throw error;
      loadPriceLists();
    } catch (error) {
      console.error('Error deleting price list:', error);
      alert('Wystąpił błąd podczas usuwania cennika');
    }
  };

  const toggleActive = async (id: string, currentStatus: boolean) => {
    try {
      const { error } = await supabase
        .from('price_lists')
        .update({ is_active: !currentStatus })
        .eq('id', id);

      if (error) throw error;
      loadPriceLists();
    } catch (error) {
      console.error('Error toggling active status:', error);
      alert('Wystąpił błąd podczas zmiany statusu cennika');
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('pl-PL');
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-amber-600"></div>
      </div>
    );
  }

  if (selectedPriceListId) {
    return (
      <PriceListProductsManager
        priceListId={selectedPriceListId}
        onBack={() => setSelectedPriceListId(null)}
      />
    );
  }

  if (showHistory && historyPriceListId) {
    return (
      <div className="space-y-6">
        <button
          onClick={() => {
            setShowHistory(false);
            setHistoryPriceListId(null);
            setHistoryPriceListName('');
          }}
          className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg font-medium hover:bg-gray-300 transition"
        >
          ← Powrót do cenników
        </button>
        <PriceListHistory
          priceListId={historyPriceListId}
          priceListName={historyPriceListName}
          onClose={() => {
            setShowHistory(false);
            setHistoryPriceListId(null);
            setHistoryPriceListName('');
          }}
        />
      </div>
    );
  }

  if (showAssignments) {
    return (
      <div className="space-y-6">
        <button
          onClick={() => setShowAssignments(false)}
          className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg font-medium hover:bg-gray-300 transition"
        >
          ← Powrót do cenników
        </button>
        <PriceListAssignments />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-800">Zarządzanie Cennikami</h2>
          <p className="text-sm text-gray-600 mt-1">
            Aktywny może być tylko jeden cennik jednocześnie
          </p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => setShowAssignments(true)}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition flex items-center gap-2"
          >
            <Link2 className="w-5 h-5" />
            Przypisania cenników
          </button>
          <button
            onClick={() => {
              setShowForm(!showForm);
              setEditingId(null);
              setFormData({ name: '', description: '', valid_from: new Date().toISOString().split('T')[0], valid_to: '' });
            }}
            className="px-4 py-2 bg-amber-600 text-white rounded-lg font-medium hover:bg-amber-700 transition flex items-center gap-2"
          >
            <Plus className="w-5 h-5" />
            Nowy cennik
          </button>
        </div>
      </div>

      {showForm && (
        <div className="bg-white rounded-xl shadow-lg p-6">
          <h3 className="text-lg font-semibold mb-4">
            {editingId ? 'Edytuj cennik' : 'Nowy cennik'}
          </h3>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Nazwa cennika
              </label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent"
                placeholder="np. Cennik Zimowy 2024"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Opis (opcjonalny)
              </label>
              <textarea
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent"
                placeholder="Dodatkowe informacje o cenniku"
                rows={3}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Obowiązuje od
                </label>
                <input
                  type="date"
                  value={formData.valid_from}
                  onChange={(e) => setFormData({ ...formData, valid_from: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Obowiązuje do (opcjonalnie)
                </label>
                <input
                  type="date"
                  value={formData.valid_to}
                  onChange={(e) => setFormData({ ...formData, valid_to: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent"
                />
              </div>
            </div>

            <div className="flex gap-3">
              <button
                type="submit"
                className="flex-1 px-4 py-2 bg-amber-600 text-white rounded-lg font-medium hover:bg-amber-700 transition"
              >
                {editingId ? 'Zapisz zmiany' : 'Utwórz cennik'}
              </button>
              <button
                type="button"
                onClick={() => {
                  setShowForm(false);
                  setEditingId(null);
                }}
                className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg font-medium hover:bg-gray-300 transition"
              >
                Anuluj
              </button>
            </div>
          </form>
        </div>
      )}

      {priceLists.length === 0 ? (
        <div className="bg-white rounded-xl shadow-lg p-8 text-center">
          <Calendar className="w-16 h-16 text-gray-300 mx-auto mb-4" />
          <h3 className="text-xl font-semibold text-gray-700 mb-2">Brak cenników</h3>
          <p className="text-gray-500">Utwórz pierwszy cennik, aby rozpocząć</p>
        </div>
      ) : (
        <div className="space-y-4">
          {priceLists.map((priceList) => (
            <div
              key={priceList.id}
              className={`bg-white rounded-xl shadow-lg p-6 transition ${
                priceList.is_active ? 'ring-2 ring-green-500' : ''
              }`}
            >
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <h3 className="text-xl font-bold text-gray-800">{priceList.name}</h3>
                    {priceList.is_active && (
                      <span className="px-3 py-1 bg-green-100 text-green-800 text-xs font-semibold rounded-full flex items-center gap-1">
                        <CheckCircle className="w-3 h-3" />
                        AKTYWNY
                      </span>
                    )}
                  </div>

                  {priceList.description && (
                    <p className="text-gray-600 mb-3">{priceList.description}</p>
                  )}

                  <div className="flex flex-wrap gap-4 text-sm text-gray-600">
                    <div className="flex items-center gap-1">
                      <Calendar className="w-4 h-4" />
                      <span>Od: {formatDate(priceList.valid_from)}</span>
                    </div>
                    {priceList.valid_to && (
                      <div className="flex items-center gap-1">
                        <Calendar className="w-4 h-4" />
                        <span>Do: {formatDate(priceList.valid_to)}</span>
                      </div>
                    )}
                  </div>
                </div>

                <div className="flex gap-2">
                  <button
                    onClick={() => {
                      setHistoryPriceListId(priceList.id);
                      setHistoryPriceListName(priceList.name);
                      setShowHistory(true);
                    }}
                    className="px-3 py-2 bg-purple-100 text-purple-600 rounded-lg hover:bg-purple-200 transition flex items-center gap-2 font-medium"
                    title="Zobacz historię zmian"
                  >
                    <Clock className="w-5 h-5" />
                    <span className="hidden sm:inline">Historia</span>
                  </button>
                  <button
                    onClick={() => setSelectedPriceListId(priceList.id)}
                    className="px-4 py-2 bg-amber-600 text-white rounded-lg hover:bg-amber-700 transition flex items-center gap-2 font-medium"
                    title="Zarządzaj produktami i cenami"
                  >
                    <Package className="w-5 h-5" />
                    <span>Edytuj ceny</span>
                  </button>
                  <button
                    onClick={() => toggleActive(priceList.id, priceList.is_active)}
                    className={`p-2 rounded-lg transition ${
                      priceList.is_active
                        ? 'bg-red-100 text-red-600 hover:bg-red-200'
                        : 'bg-green-100 text-green-600 hover:bg-green-200'
                    }`}
                    title={priceList.is_active ? 'Dezaktywuj' : 'Aktywuj'}
                  >
                    {priceList.is_active ? (
                      <XCircle className="w-5 h-5" />
                    ) : (
                      <CheckCircle className="w-5 h-5" />
                    )}
                  </button>
                  <button
                    onClick={() => handleEdit(priceList)}
                    className="p-2 bg-blue-100 text-blue-600 rounded-lg hover:bg-blue-200 transition"
                    title="Edytuj"
                  >
                    <Edit2 className="w-5 h-5" />
                  </button>
                  <button
                    onClick={() => handleDelete(priceList.id)}
                    className="p-2 bg-red-100 text-red-600 rounded-lg hover:bg-red-200 transition"
                    title="Usuń"
                    disabled={priceList.is_active}
                  >
                    <Trash2 className="w-5 h-5" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      <div className="bg-amber-50 rounded-lg p-4 text-sm text-amber-800 border border-amber-200">
        <p className="font-semibold mb-1">ℹ️ Informacje o zarządzaniu cennikami</p>
        <ul className="list-disc list-inside space-y-1">
          <li>Tylko jeden cennik może być aktywny jednocześnie</li>
          <li>Aktywacja nowego cennika automatycznie dezaktywuje poprzedni</li>
          <li>Nie można usunąć aktywnego cennika</li>
          <li>Produkty mogą być przypisane do konkretnych cenników</li>
          <li><strong>Historia</strong> - każda zmiana w cenniku jest automatycznie rejestrowana</li>
        </ul>
      </div>

    </div>
  );
}
