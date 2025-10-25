import { useState, useEffect } from 'react';
import { Users, Plus, Trash2, Mail, Shield, Building, Eye, EyeOff, Edit2, X, MapPin, Phone, ExternalLink } from 'lucide-react';
import { supabase } from '../lib/supabase';
import StoreEmailManager from './StoreEmailManager';

interface Store {
  id: string;
  name: string;
  code: string;
  address?: string | null;
  phone?: string | null;
  email_addresses?: string[] | null;
  latitude?: number | null;
  longitude?: number | null;
  active?: boolean;
}

interface UserData {
  id: string;
  email: string;
  full_name: string;
  role: string;
  store_id: string | null;
  active: boolean;
  profile_picture_url?: string | null;
  store?: Store;
}

const roleLabels: Record<string, string> = {
  admin: 'Administrator',
  store_manager: 'Ekspedient',
  salesperson: 'Handlowiec',
  operator: 'Hurtownia',
  driver: 'Kierowca',
  analyst: 'Analityk',
};

export default function UsersManager() {
  const [users, setUsers] = useState<UserData[]>([]);
  const [stores, setStores] = useState<Store[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [creating, setCreating] = useState(false);
  const [editingUser, setEditingUser] = useState<UserData | null>(null);
  const [updating, setUpdating] = useState(false);
  const [selectedStore, setSelectedStore] = useState<Store | null>(null);

  const [newUser, setNewUser] = useState({
    email: '',
    password: '',
    full_name: '',
    role: 'store_manager' as string,
    store_id: '',
  });

  const [editUser, setEditUser] = useState({
    full_name: '',
    role: '',
    store_id: '',
  });

  const [showPassword, setShowPassword] = useState(false);

  useEffect(() => {
    loadData();
  }, []);

  const openStoreDetails = async (storeId: string) => {
    try {
      const { data, error } = await supabase
        .from('stores')
        .select('*')
        .eq('id', storeId)
        .single();

      if (error) throw error;
      setSelectedStore(data);
    } catch (error) {
      console.error('Error loading store details:', error);
      alert('Błąd podczas ładowania szczegółów sklepu');
    }
  };

  const loadData = async () => {
    setLoading(true);
    try {
      const { data: usersData, error: usersError } = await supabase
        .from('users')
        .select(`
          *,
          profile_picture_url,
          store:store_id (
            id,
            name,
            code,
            address,
            phone,
            email_addresses,
            latitude,
            longitude,
            active
          )
        `)
        .order('created_at', { ascending: false });

      if (usersError) throw usersError;
      setUsers(usersData || []);

      const { data: storesData, error: storesError } = await supabase
        .from('stores')
        .select('*')
        .order('name');

      if (storesError) throw storesError;
      setStores(storesData || []);
    } catch (error) {
      console.error('Error loading data:', error);
      alert('Błąd podczas ładowania danych');
    } finally {
      setLoading(false);
    }
  };

  const createUser = async () => {
    if (!newUser.email || !newUser.password || !newUser.full_name || !newUser.role) {
      alert('Wypełnij wszystkie wymagane pola');
      return;
    }

    if ((newUser.role === 'store_manager') && !newUser.store_id) {
      alert('Ekspedient musi być przypisany do sklepu');
      return;
    }

    setCreating(true);
    try {
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: newUser.email,
        password: newUser.password,
        options: {
          data: {
            full_name: newUser.full_name,
          },
        },
      });

      if (authError) throw authError;
      if (!authData.user) throw new Error('Nie udało się utworzyć użytkownika');

      const { error: userError } = await supabase
        .from('users')
        .insert({
          id: authData.user.id,
          email: newUser.email,
          full_name: newUser.full_name,
          role: newUser.role,
          store_id: newUser.store_id || null,
          active: true,
        });

      if (userError) throw userError;

      alert('Użytkownik utworzony pomyślnie!');
      setShowCreateForm(false);
      setNewUser({
        email: '',
        password: '',
        full_name: '',
        role: 'store_manager',
        store_id: '',
      });
      loadData();
    } catch (error: any) {
      console.error('Error creating user:', error);
      alert(`Błąd podczas tworzenia użytkownika: ${error.message}`);
    } finally {
      setCreating(false);
    }
  };

  const toggleUserActive = async (userId: string, currentActive: boolean) => {
    try {
      const { error } = await supabase
        .from('users')
        .update({ active: !currentActive })
        .eq('id', userId);

      if (error) throw error;
      loadData();
    } catch (error) {
      console.error('Error toggling user active:', error);
      alert('Błąd podczas zmiany statusu użytkownika');
    }
  };

  const deleteUser = async (userId: string) => {
    if (!confirm('Czy na pewno chcesz usunąć tego użytkownika?')) return;

    try {
      const { error } = await supabase
        .from('users')
        .delete()
        .eq('id', userId);

      if (error) throw error;
      alert('Użytkownik usunięty');
      loadData();
    } catch (error) {
      console.error('Error deleting user:', error);
      alert('Błąd podczas usuwania użytkownika');
    }
  };

  const openEditModal = (user: UserData) => {
    setEditingUser(user);
    setEditUser({
      full_name: user.full_name,
      role: user.role,
      store_id: user.store_id || '',
    });
  };

  const closeEditModal = () => {
    setEditingUser(null);
    setEditUser({
      full_name: '',
      role: '',
      store_id: '',
    });
  };

  const updateUser = async () => {
    if (!editingUser) return;

    if (!editUser.full_name || !editUser.role) {
      alert('Wypełnij wszystkie wymagane pola');
      return;
    }

    if (editUser.role === 'store_manager' && !editUser.store_id) {
      alert('Ekspedient musi być przypisany do sklepu');
      return;
    }

    setUpdating(true);
    try {
      const { error } = await supabase
        .from('users')
        .update({
          full_name: editUser.full_name,
          role: editUser.role,
          store_id: editUser.role === 'store_manager' ? editUser.store_id : null,
        })
        .eq('id', editingUser.id);

      if (error) throw error;

      alert('Użytkownik zaktualizowany pomyślnie!');
      closeEditModal();
      loadData();
    } catch (error: any) {
      console.error('Error updating user:', error);
      alert(`Błąd podczas aktualizacji użytkownika: ${error.message}`);
    } finally {
      setUpdating(false);
    }
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
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-gray-800">Zarządzanie użytkownikami</h2>
        <button
          onClick={() => setShowCreateForm(!showCreateForm)}
          className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-amber-500 to-orange-600 text-white rounded-lg font-medium hover:from-amber-600 hover:to-orange-700 transition shadow"
        >
          <Plus className="w-5 h-5" />
          Dodaj użytkownika
        </button>
      </div>

      {showCreateForm && (
        <div className="bg-white rounded-xl shadow-lg p-6 border-2 border-amber-200">
          <h3 className="text-xl font-bold text-gray-800 mb-4">Nowy użytkownik</h3>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Imię i nazwisko *
              </label>
              <input
                type="text"
                value={newUser.full_name}
                onChange={(e) => setNewUser({ ...newUser, full_name: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent"
                placeholder="Jan Kowalski"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Email *
              </label>
              <input
                type="email"
                value={newUser.email}
                onChange={(e) => setNewUser({ ...newUser, email: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent"
                placeholder="jan.kowalski@example.com"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Hasło *
              </label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={newUser.password}
                  onChange={(e) => setNewUser({ ...newUser, password: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent pr-10"
                  placeholder="••••••••"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700"
                >
                  {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Rola *
              </label>
              <select
                value={newUser.role}
                onChange={(e) => setNewUser({ ...newUser, role: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent"
              >
                <option value="store_manager">Ekspedient</option>
                <option value="salesperson">Handlowiec</option>
                <option value="operator">Hurtownia</option>
                <option value="driver">Kierowca</option>
                <option value="admin">Administrator</option>
                <option value="analyst">Analityk</option>
              </select>
            </div>

            {newUser.role === 'store_manager' && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Sklep *
                </label>
                <select
                  value={newUser.store_id}
                  onChange={(e) => setNewUser({ ...newUser, store_id: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent"
                >
                  <option value="">Wybierz sklep</option>
                  {stores.map((store) => (
                    <option key={store.id} value={store.id}>
                      {store.name} ({store.code})
                    </option>
                  ))}
                </select>
              </div>
            )}

            <div className="flex gap-3 pt-2">
              <button
                onClick={createUser}
                disabled={creating}
                className="flex-1 py-2 bg-gradient-to-r from-amber-500 to-orange-600 text-white rounded-lg font-medium hover:from-amber-600 hover:to-orange-700 transition disabled:opacity-50"
              >
                {creating ? 'Tworzenie...' : 'Utwórz użytkownika'}
              </button>
              <button
                onClick={() => setShowCreateForm(false)}
                className="px-6 py-2 bg-gray-200 text-gray-700 rounded-lg font-medium hover:bg-gray-300 transition"
              >
                Anuluj
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="bg-white rounded-xl shadow-lg overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Użytkownik
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Email
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Rola
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Sklep
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Akcje
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {users.map((user) => (
                <tr key={user.id} className={user.active ? '' : 'bg-gray-50 opacity-60'}>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <div className="flex-shrink-0 h-10 w-10 rounded-full overflow-hidden">
                        {user.profile_picture_url ? (
                          <img
                            src={user.profile_picture_url}
                            alt={user.full_name}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <div className="w-full h-full bg-gradient-to-r from-amber-500 to-orange-600 flex items-center justify-center">
                            <span className="text-white font-bold text-sm">
                              {user.full_name.charAt(0).toUpperCase()}
                            </span>
                          </div>
                        )}
                      </div>
                      <div className="ml-4">
                        <div className="text-sm font-medium text-gray-900">{user.full_name}</div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center gap-2">
                      <Mail className="w-4 h-4 text-gray-400" />
                      <span className="text-sm text-gray-900">{user.email}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center gap-2">
                      <Shield className="w-4 h-4 text-gray-400" />
                      <span className="text-sm text-gray-900">{roleLabels[user.role] || user.role}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    {user.store ? (
                      <button
                        onClick={() => openStoreDetails(user.store!.id)}
                        className="flex items-center gap-2 hover:bg-amber-50 px-2 py-1 rounded transition group"
                        title="Kliknij aby zobaczyć szczegóły sklepu"
                      >
                        <Building className="w-4 h-4 text-gray-400 group-hover:text-amber-600" />
                        <span className="text-sm text-gray-900 group-hover:text-amber-600 font-medium">{user.store.name}</span>
                        <ExternalLink className="w-3 h-3 text-gray-400 group-hover:text-amber-600 opacity-0 group-hover:opacity-100 transition" />
                      </button>
                    ) : (
                      <span className="text-sm text-gray-400">-</span>
                    )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span
                      className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                        user.active
                          ? 'bg-green-100 text-green-800'
                          : 'bg-red-100 text-red-800'
                      }`}
                    >
                      {user.active ? 'Aktywny' : 'Nieaktywny'}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    <div className="flex items-center justify-end gap-2">
                      <button
                        onClick={() => openEditModal(user)}
                        className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition"
                        title="Edytuj użytkownika"
                      >
                        <Edit2 className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => toggleUserActive(user.id, user.active)}
                        className={`px-3 py-1 rounded-lg font-medium transition ${
                          user.active
                            ? 'bg-yellow-100 text-yellow-700 hover:bg-yellow-200'
                            : 'bg-green-100 text-green-700 hover:bg-green-200'
                        }`}
                      >
                        {user.active ? 'Dezaktywuj' : 'Aktywuj'}
                      </button>
                      <button
                        onClick={() => deleteUser(user.id)}
                        className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition"
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
      </div>

      {users.length === 0 && (
        <div className="text-center py-12 bg-white rounded-xl shadow">
          <Users className="w-16 h-16 text-gray-300 mx-auto mb-4" />
          <p className="text-gray-500 text-lg">Brak użytkowników w systemie</p>
        </div>
      )}

      {editingUser && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-2xl max-w-2xl w-full">
            <div className="p-6 border-b border-gray-200">
              <div className="flex items-center justify-between">
                <h3 className="text-xl font-bold text-gray-800">
                  Edytuj użytkownika
                </h3>
                <button
                  onClick={closeEditModal}
                  className="text-gray-400 hover:text-gray-600 transition"
                >
                  <X className="w-6 h-6" />
                </button>
              </div>
              <p className="text-sm text-gray-600 mt-2">{editingUser.email}</p>
            </div>

            <div className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Imię i nazwisko *
                </label>
                <input
                  type="text"
                  value={editUser.full_name}
                  onChange={(e) => setEditUser({ ...editUser, full_name: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:border-amber-500 focus:outline-none"
                  placeholder="Jan Kowalski"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Rola *
                </label>
                <select
                  value={editUser.role}
                  onChange={(e) => setEditUser({ ...editUser, role: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:border-amber-500 focus:outline-none"
                >
                  <option value="store_manager">Ekspedient</option>
                  <option value="salesperson">Handlowiec</option>
                  <option value="operator">Hurtownia</option>
                  <option value="driver">Kierowca</option>
                  <option value="admin">Administrator</option>
                  <option value="analyst">Analityk</option>
                </select>
              </div>

              {editUser.role === 'store_manager' && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Sklep *
                  </label>
                  <select
                    value={editUser.store_id}
                    onChange={(e) => setEditUser({ ...editUser, store_id: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:border-amber-500 focus:outline-none"
                  >
                    <option value="">Wybierz sklep</option>
                    {stores.map((store) => (
                      <option key={store.id} value={store.id}>
                        {store.name} ({store.code})
                      </option>
                    ))}
                  </select>
                </div>
              )}

              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <p className="text-sm text-blue-800">
                  <strong>Uwaga:</strong> Zmiana roli lub sklepu może wpłynąć na uprawnienia użytkownika w systemie.
                </p>
              </div>
            </div>

            <div className="p-6 border-t border-gray-200 flex justify-end gap-3">
              <button
                onClick={closeEditModal}
                className="px-6 py-2 bg-gray-200 text-gray-700 rounded-lg font-medium hover:bg-gray-300 transition"
              >
                Anuluj
              </button>
              <button
                onClick={updateUser}
                disabled={updating}
                className="px-6 py-2 bg-gradient-to-r from-amber-500 to-orange-600 text-white rounded-lg font-medium hover:from-amber-600 hover:to-orange-700 transition disabled:opacity-50"
              >
                {updating ? 'Zapisywanie...' : 'Zapisz zmiany'}
              </button>
            </div>
          </div>
        </div>
      )}

      {selectedStore && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-gradient-to-r from-amber-500 to-orange-600 text-white p-6 rounded-t-2xl flex justify-between items-center">
              <div>
                <h2 className="text-2xl font-bold">{selectedStore.name}</h2>
                <p className="text-amber-100 mt-1">Kod: {selectedStore.code}</p>
              </div>
              <button
                onClick={() => setSelectedStore(null)}
                className="p-2 hover:bg-white/20 rounded-lg transition"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            <div className="p-6 space-y-6">
              <div className="flex items-center gap-3">
                <div className={`px-3 py-1 rounded-full text-sm font-semibold ${
                  selectedStore.active
                    ? 'bg-green-100 text-green-700'
                    : 'bg-red-100 text-red-700'
                }`}>
                  {selectedStore.active ? 'Aktywny' : 'Nieaktywny'}
                </div>
              </div>

              {selectedStore.address && (
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                  <div className="flex items-start gap-3">
                    <MapPin className="w-5 h-5 text-blue-600 mt-0.5 flex-shrink-0" />
                    <div>
                      <h3 className="font-semibold text-gray-800 mb-1">Adres</h3>
                      <p className="text-gray-700">{selectedStore.address}</p>
                      {selectedStore.latitude && selectedStore.longitude && (
                        <p className="text-sm text-gray-500 mt-1">
                          GPS: {selectedStore.latitude}, {selectedStore.longitude}
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              )}

              {selectedStore.phone && (
                <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                  <div className="flex items-center gap-3">
                    <Phone className="w-5 h-5 text-green-600 flex-shrink-0" />
                    <div>
                      <h3 className="font-semibold text-gray-800 mb-1">Telefon</h3>
                      <a
                        href={`tel:${selectedStore.phone}`}
                        className="text-green-700 hover:text-green-800 font-medium"
                      >
                        {selectedStore.phone}
                      </a>
                    </div>
                  </div>
                </div>
              )}

              <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
                <div className="flex items-start gap-3">
                  <Mail className="w-5 h-5 text-amber-600 mt-0.5 flex-shrink-0" />
                  <div className="flex-1">
                    <h3 className="font-semibold text-gray-800 mb-3">Adresy Email</h3>
                    <StoreEmailManager
                      storeId={selectedStore.id}
                      storeName={selectedStore.name}
                      emailAddresses={selectedStore.email_addresses}
                      onUpdate={() => {
                        openStoreDetails(selectedStore.id);
                        loadData();
                      }}
                    />
                  </div>
                </div>
              </div>
            </div>

            <div className="p-6 border-t border-gray-200 bg-gray-50 rounded-b-2xl flex justify-end">
              <button
                onClick={() => setSelectedStore(null)}
                className="px-6 py-2 bg-gradient-to-r from-amber-500 to-orange-600 text-white rounded-lg font-medium hover:from-amber-600 hover:to-orange-700 transition"
              >
                Zamknij
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
