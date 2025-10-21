/**
 * StoreGroupsManager - Zarządzanie grupami sklepów
 *
 * Umożliwia tworzenie i zarządzanie grupami sklepów (regionalne, tematyczne).
 * Sklepy mogą należeć do wielu grup jednocześnie.
 *
 * Funkcjonalności:
 * - Tworzenie nowych grup z nazwą, opisem i kolorem
 * - Edycja istniejących grup
 * - Przypisywanie/usuwanie sklepów do/z grup
 * - Aktywacja/dezaktywacja grup
 * - Wyszukiwanie grup
 *
 * Tabele bazy danych:
 * - store_groups - definicje grup
 * - store_group_assignments - przypisania sklepów do grup
 */

import { useState, useEffect } from 'react';
import { Users, Plus, Edit2, Trash2, Save, X, Search, Store, CheckSquare, Square } from 'lucide-react';
import { supabase } from '../lib/supabase';

interface StoreGroup {
  id: string;
  name: string;
  description: string | null;
  color: string;
  active: boolean;
  store_count?: number;
}

interface Store {
  id: string;
  name: string;
  code: string;
  active: boolean;
}

interface GroupMember {
  id: string;
  group_id: string;
  store_id: string;
  store?: Store;
}

export default function StoreGroupsManager() {
  const [groups, setGroups] = useState<StoreGroup[]>([]);
  const [stores, setStores] = useState<Store[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [editingGroup, setEditingGroup] = useState<string | null>(null);
  const [editForm, setEditForm] = useState({
    name: '',
    description: '',
    color: '#3B82F6',
  });
  const [showNewGroupForm, setShowNewGroupForm] = useState(false);
  const [selectedGroupForMembers, setSelectedGroupForMembers] = useState<string | null>(null);
  const [groupMembers, setGroupMembers] = useState<GroupMember[]>([]);
  const [availableStores, setAvailableStores] = useState<Store[]>([]);
  const [selectedStores, setSelectedStores] = useState<Set<string>>(new Set());

  useEffect(() => {
    loadGroups();
    loadStores();
  }, []);

  useEffect(() => {
    if (selectedGroupForMembers) {
      loadGroupMembers(selectedGroupForMembers);
    }
  }, [selectedGroupForMembers]);

  const loadGroups = async () => {
    setLoading(true);
    try {
      const { data: groupsData, error: groupsError } = await supabase
        .from('store_groups')
        .select('*')
        .order('name', { ascending: true });

      if (groupsError) throw groupsError;

      const groupsWithCounts = await Promise.all(
        (groupsData || []).map(async (group) => {
          const { count } = await supabase
            .from('store_group_members')
            .select('*', { count: 'exact', head: true })
            .eq('group_id', group.id);

          return {
            ...group,
            store_count: count || 0,
          };
        })
      );

      setGroups(groupsWithCounts);
    } catch (error) {
      console.error('Error loading groups:', error);
      alert('Błąd podczas ładowania grup');
    } finally {
      setLoading(false);
    }
  };

  const loadStores = async () => {
    try {
      const { data, error } = await supabase
        .from('stores')
        .select('id, name, code, active')
        .eq('active', true)
        .order('name', { ascending: true });

      if (error) throw error;
      setStores(data || []);
    } catch (error) {
      console.error('Error loading stores:', error);
    }
  };

  const loadGroupMembers = async (groupId: string) => {
    try {
      const { data, error } = await supabase
        .from('store_group_members')
        .select(`
          id,
          group_id,
          store_id,
          stores (
            id,
            name,
            code,
            active
          )
        `)
        .eq('group_id', groupId);

      if (error) throw error;

      const members = (data || []).map((m: any) => ({
        id: m.id,
        group_id: m.group_id,
        store_id: m.store_id,
        store: m.stores,
      }));

      setGroupMembers(members);

      const memberStoreIds = new Set(members.map((m) => m.store_id));
      const available = stores.filter((s) => !memberStoreIds.has(s.id));
      setAvailableStores(available);
    } catch (error) {
      console.error('Error loading group members:', error);
    }
  };

  const startNewGroup = () => {
    setEditForm({
      name: '',
      description: '',
      color: '#3B82F6',
    });
    setShowNewGroupForm(true);
    setEditingGroup(null);
  };

  const startEdit = (group: StoreGroup) => {
    setEditForm({
      name: group.name,
      description: group.description || '',
      color: group.color,
    });
    setEditingGroup(group.id);
    setShowNewGroupForm(false);
  };

  const cancelEdit = () => {
    setEditingGroup(null);
    setShowNewGroupForm(false);
    setEditForm({
      name: '',
      description: '',
      color: '#3B82F6',
    });
  };

  const saveGroup = async () => {
    if (!editForm.name.trim()) {
      alert('Nazwa grupy jest wymagana');
      return;
    }

    try {
      if (editingGroup) {
        const { error } = await supabase
          .from('store_groups')
          .update({
            name: editForm.name,
            description: editForm.description || null,
            color: editForm.color,
          })
          .eq('id', editingGroup);

        if (error) throw error;
        alert('Grupa zaktualizowana pomyślnie!');
      } else {
        const { data: userData } = await supabase.auth.getUser();

        const { error } = await supabase
          .from('store_groups')
          .insert({
            name: editForm.name,
            description: editForm.description || null,
            color: editForm.color,
            created_by: userData.user?.id,
          });

        if (error) throw error;
        alert('Grupa utworzona pomyślnie!');
      }

      cancelEdit();
      loadGroups();
    } catch (error: any) {
      console.error('Error saving group:', error);
      if (error.code === '23505') {
        alert('Grupa o tej nazwie już istnieje');
      } else {
        alert('Błąd podczas zapisywania grupy');
      }
    }
  };

  const deleteGroup = async (id: string, name: string) => {
    if (!confirm(`Czy na pewno chcesz usunąć grupę "${name}"?\n\nWszystkie przypisania sklepów i ceny specjalne dla tej grupy zostaną usunięte.`)) {
      return;
    }

    try {
      const { error } = await supabase
        .from('store_groups')
        .delete()
        .eq('id', id);

      if (error) throw error;
      alert('Grupa usunięta pomyślnie');
      loadGroups();
    } catch (error) {
      console.error('Error deleting group:', error);
      alert('Błąd podczas usuwania grupy');
    }
  };

  const toggleGroupActive = async (id: string, currentStatus: boolean) => {
    try {
      const { error } = await supabase
        .from('store_groups')
        .update({ active: !currentStatus })
        .eq('id', id);

      if (error) throw error;
      loadGroups();
    } catch (error) {
      console.error('Error toggling group status:', error);
      alert('Błąd podczas zmiany statusu grupy');
    }
  };

  const openMembersManager = (groupId: string) => {
    setSelectedGroupForMembers(groupId);
    setSelectedStores(new Set());
  };

  const closeMembersManager = () => {
    setSelectedGroupForMembers(null);
    setGroupMembers([]);
    setAvailableStores([]);
    setSelectedStores(new Set());
  };

  const toggleStoreSelection = (storeId: string) => {
    setSelectedStores((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(storeId)) {
        newSet.delete(storeId);
      } else {
        newSet.add(storeId);
      }
      return newSet;
    });
  };

  const addStoresToGroup = async () => {
    if (selectedStores.size === 0 || !selectedGroupForMembers) return;

    try {
      const { data: userData } = await supabase.auth.getUser();

      const inserts = Array.from(selectedStores).map((storeId) => ({
        group_id: selectedGroupForMembers,
        store_id: storeId,
        added_by: userData.user?.id,
      }));

      const { error } = await supabase
        .from('store_group_members')
        .insert(inserts);

      if (error) throw error;

      alert(`Dodano ${selectedStores.size} sklepów do grupy`);
      setSelectedStores(new Set());
      loadGroupMembers(selectedGroupForMembers);
      loadGroups();
    } catch (error) {
      console.error('Error adding stores to group:', error);
      alert('Błąd podczas dodawania sklepów do grupy');
    }
  };

  const removeStoreFromGroup = async (memberId: string, storeName: string) => {
    if (!confirm(`Czy na pewno chcesz usunąć sklep "${storeName}" z tej grupy?`)) {
      return;
    }

    try {
      const { error } = await supabase
        .from('store_group_members')
        .delete()
        .eq('id', memberId);

      if (error) throw error;

      if (selectedGroupForMembers) {
        loadGroupMembers(selectedGroupForMembers);
        loadGroups();
      }
    } catch (error) {
      console.error('Error removing store from group:', error);
      alert('Błąd podczas usuwania sklepu z grupy');
    }
  };

  const filteredGroups = groups.filter((group) =>
    group.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (group.description && group.description.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  const selectedGroup = groups.find((g) => g.id === selectedGroupForMembers);

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
          <Users className="w-8 h-8 text-amber-600" />
          <h2 className="text-2xl font-bold text-gray-800">Grupy sklepów</h2>
        </div>
        <button
          onClick={startNewGroup}
          className="px-4 py-2 bg-green-600 text-white rounded-lg font-medium hover:bg-green-700 transition flex items-center gap-2"
        >
          <Plus className="w-4 h-4" />
          Nowa grupa
        </button>
      </div>

      {(showNewGroupForm || editingGroup) && (
        <div className="bg-white rounded-xl shadow-lg p-6 border-2 border-amber-200">
          <h3 className="text-lg font-semibold mb-4">
            {editingGroup ? 'Edytuj grupę' : 'Nowa grupa sklepów'}
          </h3>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Nazwa grupy *
              </label>
              <input
                type="text"
                value={editForm.name}
                onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:border-amber-500 focus:outline-none"
                placeholder="np. Sklepy Premium, Region Warszawa"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Opis
              </label>
              <textarea
                value={editForm.description}
                onChange={(e) => setEditForm({ ...editForm, description: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:border-amber-500 focus:outline-none"
                rows={3}
                placeholder="Opcjonalny opis grupy"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Kolor
              </label>
              <div className="flex items-center gap-3">
                <input
                  type="color"
                  value={editForm.color}
                  onChange={(e) => setEditForm({ ...editForm, color: e.target.value })}
                  className="w-16 h-10 border border-gray-300 rounded cursor-pointer"
                />
                <span className="text-sm text-gray-600">{editForm.color}</span>
              </div>
            </div>
            <div className="flex gap-3">
              <button
                onClick={saveGroup}
                className="px-4 py-2 bg-green-600 text-white rounded-lg font-medium hover:bg-green-700 transition flex items-center gap-2"
              >
                <Save className="w-4 h-4" />
                Zapisz
              </button>
              <button
                onClick={cancelEdit}
                className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg font-medium hover:bg-gray-300 transition flex items-center gap-2"
              >
                <X className="w-4 h-4" />
                Anuluj
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="bg-white rounded-xl shadow p-6">
        <div className="mb-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Szukaj grupy..."
              className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:border-amber-500 focus:outline-none"
            />
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b-2 border-gray-200">
                <th className="text-left py-3 px-2 text-sm font-semibold text-gray-700">Nazwa</th>
                <th className="text-left py-3 px-2 text-sm font-semibold text-gray-700">Opis</th>
                <th className="text-center py-3 px-2 text-sm font-semibold text-gray-700">Kolor</th>
                <th className="text-center py-3 px-2 text-sm font-semibold text-gray-700">Sklepy</th>
                <th className="text-center py-3 px-2 text-sm font-semibold text-gray-700">Status</th>
                <th className="text-center py-3 px-2 text-sm font-semibold text-gray-700">Akcje</th>
              </tr>
            </thead>
            <tbody>
              {filteredGroups.map((group) => (
                <tr key={group.id} className="border-b border-gray-100 hover:bg-gray-50">
                  <td className="py-3 px-2">
                    <div className="font-medium text-gray-800">{group.name}</div>
                  </td>
                  <td className="py-3 px-2">
                    <div className="text-sm text-gray-600">{group.description || '—'}</div>
                  </td>
                  <td className="py-3 px-2 text-center">
                    <div className="flex items-center justify-center gap-2">
                      <div
                        className="w-8 h-8 rounded-full border-2 border-gray-300"
                        style={{ backgroundColor: group.color }}
                      />
                    </div>
                  </td>
                  <td className="py-3 px-2 text-center">
                    <button
                      onClick={() => openMembersManager(group.id)}
                      className="px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-sm font-medium hover:bg-blue-200 transition flex items-center gap-1 mx-auto"
                    >
                      <Store className="w-3 h-3" />
                      {group.store_count || 0}
                    </button>
                  </td>
                  <td className="py-3 px-2 text-center">
                    <button
                      onClick={() => toggleGroupActive(group.id, group.active)}
                      className={`px-3 py-1 rounded-full text-xs font-medium transition ${
                        group.active
                          ? 'bg-green-100 text-green-700 hover:bg-green-200'
                          : 'bg-red-100 text-red-700 hover:bg-red-200'
                      }`}
                    >
                      {group.active ? 'Aktywna' : 'Nieaktywna'}
                    </button>
                  </td>
                  <td className="py-3 px-2 text-center">
                    <div className="flex items-center justify-center gap-2">
                      <button
                        onClick={() => startEdit(group)}
                        className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition"
                        title="Edytuj"
                      >
                        <Edit2 className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => deleteGroup(group.id, group.name)}
                        className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition"
                        title="Usuń"
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

        {filteredGroups.length === 0 && (
          <div className="text-center py-8 text-gray-500">
            Nie znaleziono grup
          </div>
        )}
      </div>

      {selectedGroupForMembers && selectedGroup && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-hidden flex flex-col">
            <div className="p-6 border-b border-gray-200">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-xl font-bold text-gray-800">
                    Sklepy w grupie: {selectedGroup.name}
                  </h3>
                  <p className="text-sm text-gray-600 mt-1">
                    {groupMembers.length} {groupMembers.length === 1 ? 'sklep' : 'sklepów'} w grupie
                  </p>
                </div>
                <button
                  onClick={closeMembersManager}
                  className="text-gray-400 hover:text-gray-600 transition"
                >
                  <X className="w-6 h-6" />
                </button>
              </div>
            </div>

            <div className="flex-1 overflow-y-auto p-6 space-y-6">
              <div>
                <h4 className="font-semibold text-gray-800 mb-3">Obecne sklepy w grupie</h4>
                {groupMembers.length > 0 ? (
                  <div className="space-y-2">
                    {groupMembers.map((member) => (
                      <div
                        key={member.id}
                        className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
                      >
                        <div>
                          <div className="font-medium text-gray-800">{member.store?.name}</div>
                          <div className="text-sm text-gray-500">{member.store?.code}</div>
                        </div>
                        <button
                          onClick={() => removeStoreFromGroup(member.id, member.store?.name || '')}
                          className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition"
                          title="Usuń z grupy"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8 text-gray-500 bg-gray-50 rounded-lg">
                    Brak sklepów w tej grupie
                  </div>
                )}
              </div>

              <div>
                <h4 className="font-semibold text-gray-800 mb-3">Dodaj sklepy do grupy</h4>
                {selectedStores.size > 0 && (
                  <div className="mb-3 flex items-center justify-between p-3 bg-amber-50 border border-amber-200 rounded-lg">
                    <span className="text-sm font-medium text-amber-900">
                      Zaznaczono: {selectedStores.size} {selectedStores.size === 1 ? 'sklep' : 'sklepów'}
                    </span>
                    <button
                      onClick={addStoresToGroup}
                      className="px-4 py-2 bg-green-600 text-white rounded-lg font-medium hover:bg-green-700 transition text-sm"
                    >
                      Dodaj do grupy
                    </button>
                  </div>
                )}
                {availableStores.length > 0 ? (
                  <div className="space-y-2 max-h-64 overflow-y-auto">
                    {availableStores.map((store) => (
                      <div
                        key={store.id}
                        onClick={() => toggleStoreSelection(store.id)}
                        className={`flex items-center gap-3 p-3 rounded-lg cursor-pointer transition ${
                          selectedStores.has(store.id)
                            ? 'bg-amber-100 border-2 border-amber-400'
                            : 'bg-gray-50 hover:bg-gray-100'
                        }`}
                      >
                        {selectedStores.has(store.id) ? (
                          <CheckSquare className="w-5 h-5 text-amber-600" />
                        ) : (
                          <Square className="w-5 h-5 text-gray-400" />
                        )}
                        <div className="flex-1">
                          <div className="font-medium text-gray-800">{store.name}</div>
                          <div className="text-sm text-gray-500">{store.code}</div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8 text-gray-500 bg-gray-50 rounded-lg">
                    Wszystkie sklepy są już w tej grupie
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
        <h3 className="font-semibold text-blue-900 mb-2">Informacje o grupach</h3>
        <ul className="space-y-1 text-sm text-blue-800">
          <li>• Grupy pozwalają organizować sklepy w logiczne zbiory</li>
          <li>• Jeden sklep może należeć do wielu grup jednocześnie</li>
          <li>• Ceny i promocje można przypisywać do całych grup naraz</li>
          <li>• Usuniecie grupy nie usuwa sklepów, tylko przypisania</li>
        </ul>
      </div>
    </div>
  );
}
