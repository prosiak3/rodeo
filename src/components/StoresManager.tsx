import { useState, useEffect } from 'react';
import { ShoppingBag, MapPin, Phone, CheckCircle, XCircle, Grid3x3, List, Mail, Plus, X, Save } from 'lucide-react';
import { supabase } from '../lib/supabase';

interface Store {
  id: string;
  name: string;
  code: string;
  address: string | null;
  phone: string | null;
  email_addresses: string[] | null;
  active: boolean;
  created_at: string;
}

export default function StoresManager() {
  const [stores, setStores] = useState<Store[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [viewMode, setViewMode] = useState<'list' | 'grid'>('list');
  const [editingStoreId, setEditingStoreId] = useState<string | null>(null);
  const [editedEmails, setEditedEmails] = useState<string[]>([]);
  const [newEmail, setNewEmail] = useState('');

  useEffect(() => {
    loadStores();
  }, []);

  const loadStores = async () => {
    try {
      const { data, error } = await supabase
        .from('stores')
        .select('*')
        .order('name', { ascending: true });

      if (error) throw error;
      setStores(data || []);
    } catch (error) {
      console.error('Error loading stores:', error);
    } finally {
      setLoading(false);
    }
  };

  const toggleActive = async (id: string, currentStatus: boolean) => {
    try {
      const { error } = await supabase
        .from('stores')
        .update({ active: !currentStatus })
        .eq('id', id);

      if (error) throw error;
      loadStores();
    } catch (error) {
      console.error('Error toggling store status:', error);
      alert('Wystąpił błąd podczas zmiany statusu sklepu');
    }
  };

  const startEditingEmails = (store: Store) => {
    setEditingStoreId(store.id);
    setEditedEmails(store.email_addresses || []);
    setNewEmail('');
  };

  const addEmail = () => {
    const email = newEmail.trim();
    if (!email) return;

    const emailRegex = /^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$/;
    if (!emailRegex.test(email)) {
      alert('Niepoprawny format adresu email');
      return;
    }

    if (editedEmails.includes(email)) {
      alert('Ten adres email już istnieje');
      return;
    }

    setEditedEmails([...editedEmails, email]);
    setNewEmail('');
  };

  const removeEmail = (emailToRemove: string) => {
    setEditedEmails(editedEmails.filter(e => e !== emailToRemove));
  };

  const saveEmails = async (storeId: string) => {
    try {
      const { error } = await supabase
        .from('stores')
        .update({ email_addresses: editedEmails })
        .eq('id', storeId);

      if (error) throw error;

      setEditingStoreId(null);
      setEditedEmails([]);
      setNewEmail('');
      loadStores();
      alert('Adresy email zostały zaktualizowane');
    } catch (error) {
      console.error('Error updating emails:', error);
      alert('Wystąpił błąd podczas zapisywania adresów email');
    }
  };

  const cancelEditingEmails = () => {
    setEditingStoreId(null);
    setEditedEmails([]);
    setNewEmail('');
  };

  const filteredStores = stores.filter(store =>
    store.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    store.code.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (store.address && store.address.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  const activeStores = filteredStores.filter(s => s.active);
  const inactiveStores = filteredStores.filter(s => !s.active);

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
        <div>
          <h2 className="text-2xl font-bold text-gray-800">Sklepy w sieci</h2>
          <p className="text-sm text-gray-600 mt-1">
            Zarządzaj sklepami i ich statusem
          </p>
        </div>
        <div className="text-right">
          <div className="text-2xl font-bold text-amber-600">{activeStores.length}</div>
          <div className="text-xs text-gray-600">Aktywnych sklepów</div>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow p-4 space-y-4">
        <div className="flex items-center gap-4">
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Szukaj sklepu po nazwie, kodzie lub adresie..."
            className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent"
          />
          <div className="flex gap-2">
            <button
              onClick={() => setViewMode('list')}
              className={`p-2 rounded-lg transition ${
                viewMode === 'list'
                  ? 'bg-amber-100 text-amber-600'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
              title="Widok listy"
            >
              <List className="w-5 h-5" />
            </button>
            <button
              onClick={() => setViewMode('grid')}
              className={`p-2 rounded-lg transition ${
                viewMode === 'grid'
                  ? 'bg-amber-100 text-amber-600'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
              title="Widok siatki"
            >
              <Grid3x3 className="w-5 h-5" />
            </button>
          </div>
        </div>
      </div>

      {activeStores.length > 0 && (
        <div>
          <h3 className="text-lg font-semibold text-gray-800 mb-3 flex items-center gap-2">
            <CheckCircle className="w-5 h-5 text-green-600" />
            Aktywne sklepy ({activeStores.length})
          </h3>

          {viewMode === 'grid' ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {activeStores.map((store) => (
                <div
                  key={store.id}
                  className="bg-white rounded-xl shadow-lg p-5 hover:shadow-xl transition"
                >
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
                        <ShoppingBag className="w-6 h-6 text-green-600" />
                      </div>
                      <div>
                        <h4 className="font-bold text-gray-800">{store.name}</h4>
                        <p className="text-sm text-gray-500">{store.code}</p>
                      </div>
                    </div>
                    <button
                      onClick={() => toggleActive(store.id, store.active)}
                      className="p-2 bg-red-100 text-red-600 rounded-lg hover:bg-red-200 transition"
                      title="Dezaktywuj sklep"
                    >
                      <XCircle className="w-5 h-5" />
                    </button>
                  </div>

                  {store.address && (
                    <div className="flex items-start gap-2 mb-2">
                      <MapPin className="w-4 h-4 text-gray-400 mt-0.5 flex-shrink-0" />
                      <p className="text-sm text-gray-600">{store.address}</p>
                    </div>
                  )}

                  {store.phone && (
                    <div className="flex items-center gap-2">
                      <Phone className="w-4 h-4 text-gray-400 flex-shrink-0" />
                      <p className="text-sm text-gray-600">{store.phone}</p>
                    </div>
                  )}
                </div>
              ))}
            </div>
          ) : (
            <div className="bg-white rounded-lg shadow overflow-hidden">
              <table className="w-full">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Sklep
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Kod
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Adres
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Telefon
                    </th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Akcje
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {activeStores.map((store) => (
                    <tr key={store.id} className="hover:bg-gray-50 transition">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
                            <ShoppingBag className="w-5 h-5 text-green-600" />
                          </div>
                          <span className="font-semibold text-gray-800">{store.name}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                        {store.code}
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-600">
                        {store.address ? (
                          <div className="flex items-start gap-2">
                            <MapPin className="w-4 h-4 text-gray-400 mt-0.5 flex-shrink-0" />
                            <span>{store.address}</span>
                          </div>
                        ) : (
                          <span className="text-gray-400">-</span>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                        {store.phone ? (
                          <div className="flex items-center gap-2">
                            <Phone className="w-4 h-4 text-gray-400" />
                            <span>{store.phone}</span>
                          </div>
                        ) : (
                          <span className="text-gray-400">-</span>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right">
                        <button
                          onClick={() => toggleActive(store.id, store.active)}
                          className="inline-flex items-center gap-2 px-3 py-2 bg-red-100 text-red-600 rounded-lg hover:bg-red-200 transition text-sm"
                          title="Dezaktywuj sklep"
                        >
                          <XCircle className="w-4 h-4" />
                          Dezaktywuj
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {inactiveStores.length > 0 && (
        <div>
          <h3 className="text-lg font-semibold text-gray-800 mb-3 flex items-center gap-2">
            <XCircle className="w-5 h-5 text-gray-400" />
            Nieaktywne sklepy ({inactiveStores.length})
          </h3>

          {viewMode === 'grid' ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {inactiveStores.map((store) => (
                <div
                  key={store.id}
                  className="bg-white rounded-xl shadow-lg p-5 opacity-60 hover:opacity-100 transition"
                >
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 bg-gray-100 rounded-lg flex items-center justify-center">
                        <ShoppingBag className="w-6 h-6 text-gray-400" />
                      </div>
                      <div>
                        <h4 className="font-bold text-gray-800">{store.name}</h4>
                        <p className="text-sm text-gray-500">{store.code}</p>
                      </div>
                    </div>
                    <button
                      onClick={() => toggleActive(store.id, store.active)}
                      className="p-2 bg-green-100 text-green-600 rounded-lg hover:bg-green-200 transition"
                      title="Aktywuj sklep"
                    >
                      <CheckCircle className="w-5 h-5" />
                    </button>
                  </div>

                  {store.address && (
                    <div className="flex items-start gap-2 mb-2">
                      <MapPin className="w-4 h-4 text-gray-400 mt-0.5 flex-shrink-0" />
                      <p className="text-sm text-gray-600">{store.address}</p>
                    </div>
                  )}

                  {store.phone && (
                    <div className="flex items-center gap-2">
                      <Phone className="w-4 h-4 text-gray-400 flex-shrink-0" />
                      <p className="text-sm text-gray-600">{store.phone}</p>
                    </div>
                  )}
                </div>
              ))}
            </div>
          ) : (
            <div className="bg-white rounded-lg shadow overflow-hidden opacity-60">
              <table className="w-full">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Sklep
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Kod
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Adres
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Telefon
                    </th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Akcje
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {inactiveStores.map((store) => (
                    <tr key={store.id} className="hover:bg-gray-50 transition">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 bg-gray-100 rounded-lg flex items-center justify-center">
                            <ShoppingBag className="w-5 h-5 text-gray-400" />
                          </div>
                          <span className="font-semibold text-gray-800">{store.name}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                        {store.code}
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-600">
                        {store.address ? (
                          <div className="flex items-start gap-2">
                            <MapPin className="w-4 h-4 text-gray-400 mt-0.5 flex-shrink-0" />
                            <span>{store.address}</span>
                          </div>
                        ) : (
                          <span className="text-gray-400">-</span>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                        {store.phone ? (
                          <div className="flex items-center gap-2">
                            <Phone className="w-4 h-4 text-gray-400" />
                            <span>{store.phone}</span>
                          </div>
                        ) : (
                          <span className="text-gray-400">-</span>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right">
                        <button
                          onClick={() => toggleActive(store.id, store.active)}
                          className="inline-flex items-center gap-2 px-3 py-2 bg-green-100 text-green-600 rounded-lg hover:bg-green-200 transition text-sm"
                          title="Aktywuj sklep"
                        >
                          <CheckCircle className="w-4 h-4" />
                          Aktywuj
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {filteredStores.length === 0 && (
        <div className="bg-white rounded-xl shadow-lg p-8 text-center">
          <ShoppingBag className="w-16 h-16 text-gray-300 mx-auto mb-4" />
          <h3 className="text-xl font-semibold text-gray-700 mb-2">Nie znaleziono sklepów</h3>
          <p className="text-gray-500">Spróbuj zmienić kryteria wyszukiwania</p>
        </div>
      )}

      <div className="bg-amber-50 rounded-lg p-4 text-sm text-amber-800 border border-amber-200">
        <p className="font-semibold mb-1">ℹ️ Informacje o sklepach</p>
        <ul className="list-disc list-inside space-y-1">
          <li>Wszystkie sklepy zostały dodane z realnymi lokalizacjami w Polsce</li>
          <li>Możesz aktywować lub dezaktywować sklepy według potrzeb</li>
          <li>Nieaktywne sklepy nie mogą składać zamówień</li>
          <li>Dane kontaktowe są dostępne dla wszystkich użytkowników</li>
        </ul>
      </div>
    </div>
  );
}
