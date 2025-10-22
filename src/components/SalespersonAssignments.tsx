import { useState, useEffect } from 'react';
import { UserCheck, Store, Users, Save, X, Plus, Trash2, AlertCircle } from 'lucide-react';
import { supabase } from '../lib/supabase';

interface Salesperson {
  id: string;
  name: string;
  email: string;
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
  store_count: number;
}

interface Assignment {
  id: string;
  salesperson_id: string;
  salesperson_name: string;
  salesperson_email: string;
  store_id: string;
  store_name: string;
  store_code: string;
  created_at: string;
}

export default function SalespersonAssignments() {
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [salespeople, setSalespeople] = useState<Salesperson[]>([]);
  const [stores, setStores] = useState<StoreType[]>([]);
  const [storeGroups, setStoreGroups] = useState<StoreGroup[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({
    salesperson_id: '',
    assign_type: 'stores' as 'stores' | 'group',
    store_group_id: '',
  });
  const [selectedStores, setSelectedStores] = useState<string[]>([]);
  const [filterSalesperson, setFilterSalesperson] = useState<string>('all');

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [assignmentsRes, salespeopleRes, storesRes, groupsRes] = await Promise.all([
        supabase
          .from('salesperson_store_assignments')
          .select(`
            id,
            salesperson_id,
            store_id,
            created_at,
            users (name, email),
            stores (name, code)
          `)
          .order('created_at', { ascending: false }),
        supabase
          .from('users')
          .select('id, name, email')
          .eq('role', 'salesperson')
          .order('name'),
        supabase
          .from('stores')
          .select('id, name, code')
          .eq('active', true)
          .order('name'),
        supabase.rpc('get_store_groups_with_counts'),
      ]);

      if (assignmentsRes.error) throw assignmentsRes.error;
      if (salespeopleRes.error) throw salespeopleRes.error;
      if (storesRes.error) throw storesRes.error;

      const formattedAssignments = (assignmentsRes.data || []).map((a: any) => ({
        id: a.id,
        salesperson_id: a.salesperson_id,
        salesperson_name: a.users?.name || 'Nieznany',
        salesperson_email: a.users?.email || '',
        store_id: a.store_id,
        store_name: a.stores?.name || 'Nieznany',
        store_code: a.stores?.code || '',
        created_at: a.created_at,
      }));

      setAssignments(formattedAssignments);
      setSalespeople(salespeopleRes.data || []);
      setStores(storesRes.data || []);

      if (!groupsRes.error && groupsRes.data) {
        setStoreGroups(groupsRes.data);
      }
    } catch (error) {
      console.error('Error loading data:', error);

      const [assignmentsRes, salespeopleRes, storesRes, groupsAltRes] = await Promise.all([
        supabase
          .from('salesperson_store_assignments')
          .select(`
            id,
            salesperson_id,
            store_id,
            created_at,
            users (name, email),
            stores (name, code)
          `)
          .order('created_at', { ascending: false }),
        supabase
          .from('users')
          .select('id, name, email')
          .eq('role', 'salesperson')
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

      const formattedAssignments = (assignmentsRes.data || []).map((a: any) => ({
        id: a.id,
        salesperson_id: a.salesperson_id,
        salesperson_name: a.users?.name || 'Nieznany',
        salesperson_email: a.users?.email || '',
        store_id: a.store_id,
        store_name: a.stores?.name || 'Nieznany',
        store_code: a.stores?.code || '',
        created_at: a.created_at,
      }));

      setAssignments(formattedAssignments);
      setSalespeople(salespeopleRes.data || []);
      setStores(storesRes.data || []);

      if (groupsAltRes.data) {
        const groupsWithCounts = groupsAltRes.data.map((g: any) => ({
          ...g,
          store_count: 0
        }));
        setStoreGroups(groupsWithCounts);
      }
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.salesperson_id) {
      alert('Wybierz handlowca');
      return;
    }

    try {
      let storesToAssign: string[] = [];

      if (formData.assign_type === 'stores') {
        storesToAssign = selectedStores;
      } else if (formData.assign_type === 'group' && formData.store_group_id) {
        const { data: groupMembers, error } = await supabase
          .from('store_group_members')
          .select('store_id')
          .eq('group_id', formData.store_group_id);

        if (error) throw error;
        storesToAssign = groupMembers.map((m: any) => m.store_id);
      }

      if (storesToAssign.length === 0) {
        alert('Wybierz sklepy lub grupę sklepów');
        return;
      }

      const insertData = storesToAssign.map(storeId => ({
        salesperson_id: formData.salesperson_id,
        store_id: storeId,
      }));

      const { error } = await supabase
        .from('salesperson_store_assignments')
        .upsert(insertData, { onConflict: 'salesperson_id,store_id' });

      if (error) throw error;

      alert('Handlowiec został przypisany do sklepów');
      setShowForm(false);
      setFormData({
        salesperson_id: '',
        assign_type: 'stores',
        store_group_id: '',
      });
      setSelectedStores([]);
      loadData();
    } catch (error) {
      console.error('Error assigning salesperson:', error);
      alert('Błąd podczas przypisywania handlowca');
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Czy na pewno chcesz usunąć to przypisanie?')) return;

    try {
      const { error } = await supabase
        .from('salesperson_store_assignments')
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

  const handleDeleteBulk = async (salespersonId: string) => {
    if (!confirm('Czy na pewno chcesz usunąć wszystkie przypisania tego handlowca?')) return;

    try {
      const { error } = await supabase
        .from('salesperson_store_assignments')
        .delete()
        .eq('salesperson_id', salespersonId);

      if (error) throw error;
      alert('Wszystkie przypisania zostały usunięte');
      loadData();
    } catch (error) {
      console.error('Error deleting assignments:', error);
      alert('Błąd podczas usuwania przypisań');
    }
  };

  const toggleStoreSelection = (storeId: string) => {
    setSelectedStores(prev =>
      prev.includes(storeId)
        ? prev.filter(id => id !== storeId)
        : [...prev, storeId]
    );
  };

  const filteredAssignments = filterSalesperson === 'all'
    ? assignments
    : assignments.filter(a => a.salesperson_id === filterSalesperson);

  const assignmentsBySalesperson = salespeople.map(sp => ({
    ...sp,
    stores: assignments.filter(a => a.salesperson_id === sp.id),
  }));

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
          <UserCheck className="w-8 h-8 text-amber-600" />
          <div>
            <h2 className="text-2xl font-bold text-gray-800">Przypisania handlowców</h2>
            <p className="text-sm text-gray-600">Zarządzaj przypisaniem sklepów do handlowców</p>
          </div>
        </div>
        <button
          onClick={() => setShowForm(true)}
          className="px-4 py-2 bg-amber-600 text-white rounded-lg font-medium hover:bg-amber-700 transition flex items-center gap-2"
        >
          <Plus className="w-5 h-5" />
          Przypisz sklepy
        </button>
      </div>

      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <div className="flex items-start gap-3">
          <AlertCircle className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
          <div className="text-sm text-blue-800">
            <p className="font-semibold mb-2">Informacja o przypisaniach:</p>
            <ul className="list-disc list-inside space-y-1 ml-2">
              <li>Handlowiec może mieć przypisanych wiele sklepów</li>
              <li>Sklep może być przypisany do wielu handlowców</li>
              <li>Handlowiec może modyfikować tylko zamówienia ze swoich przypisanych sklepów</li>
              <li>Można przypisywać sklepy pojedynczo lub całą grupą</li>
            </ul>
          </div>
        </div>
      </div>

      {showForm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-hidden flex flex-col">
            <div className="flex items-center justify-between p-6 border-b border-gray-200">
              <div className="flex items-center gap-3">
                <UserCheck className="w-6 h-6 text-amber-600" />
                <h3 className="text-xl font-bold text-gray-800">Przypisz sklepy do handlowca</h3>
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
                    Handlowiec <span className="text-red-500">*</span>
                  </label>
                  <select
                    value={formData.salesperson_id}
                    onChange={(e) => setFormData({ ...formData, salesperson_id: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:border-amber-500 focus:outline-none"
                    required
                  >
                    <option value="">Wybierz handlowca</option>
                    {salespeople.map(sp => (
                      <option key={sp.id} value={sp.id}>
                        {sp.name} ({sp.email})
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Przypisz
                  </label>
                  <div className="flex gap-4">
                    <label className="flex items-center">
                      <input
                        type="radio"
                        checked={formData.assign_type === 'stores'}
                        onChange={() => setFormData({ ...formData, assign_type: 'stores' })}
                        className="mr-2"
                      />
                      Wybrane sklepy
                    </label>
                    <label className="flex items-center">
                      <input
                        type="radio"
                        checked={formData.assign_type === 'group'}
                        onChange={() => setFormData({ ...formData, assign_type: 'group' })}
                        className="mr-2"
                      />
                      Całą grupę sklepów
                    </label>
                  </div>
                </div>

                {formData.assign_type === 'stores' ? (
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
                      required={formData.assign_type === 'group'}
                    >
                      <option value="">Wybierz grupę</option>
                      {storeGroups.map(group => (
                        <option key={group.id} value={group.id}>
                          {group.name}
                          {group.store_count > 0 && ` (${group.store_count} sklepów)`}
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
        <div className="p-4 border-b border-gray-200 bg-gray-50">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Filtruj po handlowcu:
          </label>
          <select
            value={filterSalesperson}
            onChange={(e) => setFilterSalesperson(e.target.value)}
            className="w-full md:w-64 px-3 py-2 border border-gray-300 rounded-lg focus:border-amber-500 focus:outline-none"
          >
            <option value="all">Wszyscy handlowcy</option>
            {salespeople.map(sp => (
              <option key={sp.id} value={sp.id}>{sp.name}</option>
            ))}
          </select>
        </div>

        <div className="p-6">
          {assignmentsBySalesperson.map((sp) => (
            <div key={sp.id} className="mb-6 last:mb-0">
              <div className="flex items-center justify-between mb-3 pb-2 border-b-2 border-gray-200">
                <div>
                  <h3 className="text-lg font-bold text-gray-800">{sp.name}</h3>
                  <p className="text-sm text-gray-600">{sp.email}</p>
                </div>
                <div className="flex items-center gap-2">
                  <span className="px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-sm font-medium">
                    {sp.stores.length} {sp.stores.length === 1 ? 'sklep' : 'sklepów'}
                  </span>
                  {sp.stores.length > 0 && (
                    <button
                      onClick={() => handleDeleteBulk(sp.id)}
                      className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition"
                      title="Usuń wszystkie przypisania"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  )}
                </div>
              </div>

              {sp.stores.length === 0 ? (
                <p className="text-sm text-gray-500 italic py-2">Brak przypisanych sklepów</p>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2">
                  {sp.stores.map((assignment) => (
                    <div
                      key={assignment.id}
                      className="flex items-center justify-between p-3 bg-gray-50 rounded-lg border border-gray-200"
                    >
                      <div className="flex items-center gap-2 flex-1">
                        <Store className="w-4 h-4 text-gray-400" />
                        <div>
                          <div className="text-sm font-medium text-gray-800">{assignment.store_name}</div>
                          <div className="text-xs text-gray-500">Kod: {assignment.store_code}</div>
                        </div>
                      </div>
                      <button
                        onClick={() => handleDelete(assignment.id)}
                        className="p-1 text-red-600 hover:bg-red-50 rounded transition"
                        title="Usuń przypisanie"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          ))}

          {salespeople.length === 0 && (
            <div className="text-center py-8 text-gray-500">
              Brak handlowców w systemie
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
