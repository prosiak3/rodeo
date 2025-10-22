import { useState, useEffect } from 'react';
import { Link2, Store, Users, Tag, Save, X, AlertCircle, Plus, Trash2 } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';

interface PriceList {
  id: string;
  name: string;
  description: string | null;
  is_active: boolean;
}

interface StoreType {
  id: string;
  name: string;
  code: string;
}

interface StoreGroup {
  id: string;
  name: string;
  description: string | null;
}

interface Assignment {
  id: string;
  price_list_id: string;
  price_list_name: string;
  store_id: string | null;
  store_name: string | null;
  store_group_id: string | null;
  store_group_name: string | null;
  priority: 'admin' | 'warehouse';
  assigned_by: string;
  created_at: string;
}

export default function PriceListAssignments() {
  const { user } = useAuth();
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [priceLists, setPriceLists] = useState<PriceList[]>([]);
  const [stores, setStores] = useState<StoreType[]>([]);
  const [storeGroups, setStoreGroups] = useState<StoreGroup[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({
    price_list_id: '',
    target_type: 'store' as 'store' | 'group',
    store_id: '',
    store_group_id: '',
    priority: 'warehouse' as 'admin' | 'warehouse',
  });
  const [selectedStores, setSelectedStores] = useState<string[]>([]);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [assignmentsRes, priceListsRes, storesRes, groupsRes] = await Promise.all([
        supabase
          .from('price_list_assignments')
          .select(`
            id,
            price_list_id,
            store_id,
            store_group_id,
            priority,
            assigned_by,
            created_at,
            price_lists (name),
            stores (name),
            store_groups (name)
          `)
          .order('created_at', { ascending: false }),
        supabase
          .from('price_lists')
          .select('id, name, description, is_active')
          .eq('is_active', true)
          .order('name'),
        supabase
          .from('stores')
          .select('id, name, code')
          .eq('active', true)
          .order('name'),
        supabase
          .from('store_groups')
          .select('id, name, description')
          .eq('active', true)
          .order('name'),
      ]);

      if (assignmentsRes.error) throw assignmentsRes.error;
      if (priceListsRes.error) throw priceListsRes.error;
      if (storesRes.error) throw storesRes.error;
      if (groupsRes.error) throw groupsRes.error;

      const formattedAssignments = (assignmentsRes.data || []).map((a: any) => ({
        id: a.id,
        price_list_id: a.price_list_id,
        price_list_name: a.price_lists?.name || 'Nieznany',
        store_id: a.store_id,
        store_name: a.stores?.name || null,
        store_group_id: a.store_group_id,
        store_group_name: a.store_groups?.name || null,
        priority: a.priority,
        assigned_by: a.assigned_by,
        created_at: a.created_at,
      }));

      setAssignments(formattedAssignments);
      setPriceLists(priceListsRes.data || []);
      setStores(storesRes.data || []);
      setStoreGroups(groupsRes.data || []);
    } catch (error) {
      console.error('Error loading data:', error);
      alert('Błąd podczas wczytywania danych');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.price_list_id) {
      alert('Wybierz cennik');
      return;
    }

    try {
      if (formData.target_type === 'store' && selectedStores.length > 0) {
        const insertData = selectedStores.map(storeId => ({
          price_list_id: formData.price_list_id,
          store_id: storeId,
          store_group_id: null,
          priority: formData.priority,
          assigned_by: user?.id,
        }));

        const { error } = await supabase
          .from('price_list_assignments')
          .insert(insertData);

        if (error) throw error;
      } else if (formData.target_type === 'group' && formData.store_group_id) {
        const { error } = await supabase
          .from('price_list_assignments')
          .insert({
            price_list_id: formData.price_list_id,
            store_id: null,
            store_group_id: formData.store_group_id,
            priority: formData.priority,
            assigned_by: user?.id,
          });

        if (error) throw error;
      } else {
        alert('Wybierz sklepy lub grupę sklepów');
        return;
      }

      alert('Cennik został przypisany');
      setShowForm(false);
      setFormData({
        price_list_id: '',
        target_type: 'store',
        store_id: '',
        store_group_id: '',
        priority: 'warehouse',
      });
      setSelectedStores([]);
      loadData();
    } catch (error) {
      console.error('Error assigning price list:', error);
      alert('Błąd podczas przypisywania cennika');
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Czy na pewno chcesz usunąć to przypisanie?')) return;

    try {
      const { error } = await supabase
        .from('price_list_assignments')
        .delete()
        .eq('id', id);

      if (error) throw error;
      alert('Przypisanie zostało usunięte');
      loadData();
    } catch (error) {
      console.error('Error deleting assignment:', error);
      alert('Błąd podczas usuwania przypisania');
    }
  };

  const toggleStoreSelection = (storeId: string) => {
    setSelectedStores(prev =>
      prev.includes(storeId)
        ? prev.filter(id => id !== storeId)
        : [...prev, storeId]
    );
  };

  const getPriorityLabel = (priority: string) => {
    switch (priority) {
      case 'admin': return 'Administrator';
      case 'warehouse': return 'Hurtownia';
      default: return priority;
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'admin': return 'bg-purple-100 text-purple-700';
      case 'warehouse': return 'bg-blue-100 text-blue-700';
      default: return 'bg-gray-100 text-gray-700';
    }
  };

  const canManagePriority = (priority: string) => {
    if (user?.role === 'admin') return true;
    if (user?.role === 'warehouse' && priority !== 'admin') return true;
    return false;
  };

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
          <Link2 className="w-8 h-8 text-amber-600" />
          <div>
            <h2 className="text-2xl font-bold text-gray-800">Przypisywanie cenników</h2>
            <p className="text-sm text-gray-600">Zarządzaj przypisaniem cenników do sklepów i grup</p>
          </div>
        </div>
        <button
          onClick={() => setShowForm(true)}
          className="px-4 py-2 bg-amber-600 text-white rounded-lg font-medium hover:bg-amber-700 transition flex items-center gap-2"
        >
          <Plus className="w-5 h-5" />
          Przypisz cennik
        </button>
      </div>

      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <div className="flex items-start gap-3">
          <AlertCircle className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
          <div className="text-sm text-blue-800">
            <p className="font-semibold mb-2">Priorytety cenników:</p>
            <ol className="list-decimal list-inside space-y-1 ml-2">
              <li><strong>Administrator</strong> - najwyższy priorytet, może nadpisywać wszystkie inne cenniki</li>
              <li><strong>Hurtownia</strong> - standardowy priorytet</li>
            </ol>
            <p className="mt-3">
              <strong>Zasada nadpisywania:</strong> Indywidualne przypisanie do sklepu zawsze ma pierwszeństwo przed przypisaniem grupowym.
            </p>
          </div>
        </div>
      </div>

      {showForm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-hidden flex flex-col">
            <div className="flex items-center justify-between p-6 border-b border-gray-200">
              <div className="flex items-center gap-3">
                <Link2 className="w-6 h-6 text-amber-600" />
                <h3 className="text-xl font-bold text-gray-800">Przypisz cennik</h3>
              </div>
              <button
                onClick={() => {
                  setShowForm(false);
                  setSelectedStores([]);
                }}
                className="p-2 hover:bg-gray-100 rounded-lg transition"
              >
                <X className="w-6 h-6" />
              </button>
            </div>
            <form onSubmit={handleSubmit} className="p-6 overflow-y-auto flex-1">
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Cennik <span className="text-red-500">*</span>
                  </label>
                  <select
                    value={formData.price_list_id}
                    onChange={(e) => setFormData({ ...formData, price_list_id: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:border-amber-500 focus:outline-none"
                    required
                  >
                    <option value="">Wybierz cennik</option>
                    {priceLists.map(pl => (
                      <option key={pl.id} value={pl.id}>{pl.name}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Priorytet <span className="text-red-500">*</span>
                  </label>
                  <select
                    value={formData.priority}
                    onChange={(e) => setFormData({ ...formData, priority: e.target.value as any })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:border-amber-500 focus:outline-none"
                    required
                  >
                    {user?.role === 'admin' && <option value="admin">Administrator</option>}
                    {(user?.role === 'admin' || user?.role === 'warehouse') && (
                      <option value="warehouse">Hurtownia</option>
                    )}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Przypisz do
                  </label>
                  <div className="flex gap-4">
                    <label className="flex items-center">
                      <input
                        type="radio"
                        checked={formData.target_type === 'store'}
                        onChange={() => setFormData({ ...formData, target_type: 'store' })}
                        className="mr-2"
                      />
                      Wybranych sklepów
                    </label>
                    <label className="flex items-center">
                      <input
                        type="radio"
                        checked={formData.target_type === 'group'}
                        onChange={() => setFormData({ ...formData, target_type: 'group' })}
                        className="mr-2"
                      />
                      Grupy sklepów
                    </label>
                  </div>
                </div>

                {formData.target_type === 'store' ? (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Wybierz sklepy <span className="text-red-500">*</span>
                    </label>
                    <div className="border border-gray-300 rounded-lg max-h-64 overflow-y-auto">
                      {stores.map(store => (
                        <label
                          key={store.id}
                          className="flex items-center p-3 hover:bg-gray-50 cursor-pointer border-b border-gray-100 last:border-b-0"
                        >
                          <input
                            type="checkbox"
                            checked={selectedStores.includes(store.id)}
                            onChange={() => toggleStoreSelection(store.id)}
                            className="mr-3"
                          />
                          <div>
                            <div className="font-medium text-gray-800">{store.name}</div>
                            <div className="text-xs text-gray-500">Kod: {store.code}</div>
                          </div>
                        </label>
                      ))}
                    </div>
                    {selectedStores.length > 0 && (
                      <p className="text-sm text-gray-600 mt-2">
                        Wybrano: {selectedStores.length} {selectedStores.length === 1 ? 'sklep' : 'sklepów'}
                      </p>
                    )}
                  </div>
                ) : (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Grupa sklepów <span className="text-red-500">*</span>
                    </label>
                    <select
                      value={formData.store_group_id}
                      onChange={(e) => setFormData({ ...formData, store_group_id: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:border-amber-500 focus:outline-none"
                      required
                    >
                      <option value="">Wybierz grupę</option>
                      {storeGroups.map(group => (
                        <option key={group.id} value={group.id}>
                          {group.name}
                          {group.description && ` - ${group.description}`}
                        </option>
                      ))}
                    </select>
                  </div>
                )}

                <div className="flex gap-3 pt-4">
                  <button
                    type="submit"
                    className="flex-1 px-4 py-2 bg-amber-600 text-white rounded-lg font-medium hover:bg-amber-700 transition flex items-center justify-center gap-2"
                  >
                    <Save className="w-5 h-5" />
                    Zapisz przypisanie
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setShowForm(false);
                      setSelectedStores([]);
                    }}
                    className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg font-medium hover:bg-gray-300 transition"
                  >
                    Anuluj
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}

      <div className="bg-white rounded-xl shadow-md overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b-2 border-gray-200 bg-gray-50">
                <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">Cennik</th>
                <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">Przypisany do</th>
                <th className="text-center py-3 px-4 text-sm font-semibold text-gray-700">Typ</th>
                <th className="text-center py-3 px-4 text-sm font-semibold text-gray-700">Priorytet</th>
                <th className="text-center py-3 px-4 text-sm font-semibold text-gray-700">Data utworzenia</th>
                <th className="text-center py-3 px-4 text-sm font-semibold text-gray-700">Akcje</th>
              </tr>
            </thead>
            <tbody>
              {assignments.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-8 text-center text-gray-500">
                    Brak przypisanych cenników
                  </td>
                </tr>
              ) : (
                assignments.map((assignment) => (
                  <tr key={assignment.id} className="border-b border-gray-100 hover:bg-gray-50">
                    <td className="py-3 px-4 text-sm font-medium text-gray-800">
                      {assignment.price_list_name}
                    </td>
                    <td className="py-3 px-4 text-sm text-gray-700">
                      {assignment.store_name || assignment.store_group_name}
                    </td>
                    <td className="py-3 px-4 text-center">
                      {assignment.store_id ? (
                        <span className="inline-flex items-center gap-1 px-2 py-1 bg-green-100 text-green-700 rounded text-xs font-medium">
                          <Store className="w-3 h-3" />
                          Sklep
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 px-2 py-1 bg-blue-100 text-blue-700 rounded text-xs font-medium">
                          <Users className="w-3 h-3" />
                          Grupa
                        </span>
                      )}
                    </td>
                    <td className="py-3 px-4 text-center">
                      <span className={`inline-flex items-center gap-1 px-2 py-1 rounded text-xs font-medium ${getPriorityColor(assignment.priority)}`}>
                        <Tag className="w-3 h-3" />
                        {getPriorityLabel(assignment.priority)}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-sm text-gray-600 text-center">
                      {new Date(assignment.created_at).toLocaleDateString('pl-PL')}
                    </td>
                    <td className="py-3 px-4 text-center">
                      {canManagePriority(assignment.priority) && (
                        <button
                          onClick={() => handleDelete(assignment.id)}
                          className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition"
                          title="Usuń przypisanie"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
