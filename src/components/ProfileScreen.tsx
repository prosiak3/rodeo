import { useState } from 'react';
import { User as UserIcon, Mail, Building, Shield, LogOut, Settings, Filter, Users } from 'lucide-react';
import { User, supabase } from '../lib/supabase';

interface ProfileScreenProps {
  user: User;
  onSignOut: () => void;
}

const roleLabels: Record<string, string> = {
  store_manager: 'Ekspedient',
  salesperson: 'Handlowiec',
  operator: 'Hurtownia',
  admin: 'Administrator',
  driver: 'Kierowca',
};

export default function ProfileScreen({ user, onSignOut }: ProfileScreenProps) {
  const [orderMode, setOrderMode] = useState<'quantity' | 'list'>((user as any).order_mode || 'quantity');
  const [showAllFilters, setShowAllFilters] = useState<boolean>(user.show_all_order_filters || false);
  const [allowCollaboration, setAllowCollaboration] = useState<boolean>((user as any).allow_collaborative_editing ?? true);
  const [saving, setSaving] = useState(false);

  const handleOrderModeChange = async (mode: 'quantity' | 'list') => {
    setSaving(true);
    try {
      const { error } = await supabase
        .from('users')
        .update({ order_mode: mode })
        .eq('id', user.id);

      if (error) throw error;
      setOrderMode(mode);
      alert('Ustawienia zapisane!');
    } catch (error) {
      console.error('Error updating order mode:', error);
      alert('Błąd podczas zapisywania ustań');
    } finally {
      setSaving(false);
    }
  };

  const handleShowAllFiltersToggle = async () => {
    setSaving(true);
    try {
      const newValue = !showAllFilters;
      const { error } = await supabase
        .from('users')
        .update({ show_all_order_filters: newValue })
        .eq('id', user.id);

      if (error) throw error;
      setShowAllFilters(newValue);
      alert('Ustawienia zapisane!');
    } catch (error) {
      console.error('Error updating filter settings:', error);
      alert('Błąd podczas zapisywania ustawień');
    } finally {
      setSaving(false);
    }
  };

  const handleCollaborationToggle = async () => {
    setSaving(true);
    try {
      const newValue = !allowCollaboration;
      const { error } = await supabase
        .from('users')
        .update({ allow_collaborative_editing: newValue })
        .eq('id', user.id);

      if (error) throw error;
      setAllowCollaboration(newValue);
      alert('Ustawienia zapisane!');
    } catch (error) {
      console.error('Error updating collaboration settings:', error);
      alert('Błąd podczas zapisywania ustawień');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 pb-20">
      <div className="bg-gradient-to-r from-amber-500 to-orange-600 text-white p-4">
        <div className="flex items-center gap-3">
          <span className="text-4xl">🐃</span>
          <div>
            <h2 className="text-xl font-bold">Profil użytkownika</h2>
            <p className="text-amber-100 text-sm">Weź byka za rogi</p>
          </div>
        </div>
      </div>

      <div className="p-6 space-y-6">
        <div className="bg-white rounded-xl shadow-lg p-6">
          <div className="flex items-center gap-4 mb-6">
            <div className="w-20 h-20 bg-gradient-to-br from-amber-500 to-orange-600 rounded-full flex items-center justify-center">
              <UserIcon className="w-10 h-10 text-white" />
            </div>
            <div>
              <h3 className="text-xl font-bold text-gray-800">{user.full_name}</h3>
              <p className="text-sm text-gray-600">{roleLabels[user.role] || user.role}</p>
            </div>
          </div>

          <div className="space-y-4">
            <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
              <Mail className="w-5 h-5 text-gray-600" />
              <div>
                <p className="text-xs text-gray-600">Email</p>
                <p className="font-medium text-gray-800">{user.email}</p>
              </div>
            </div>

            {user.store_id && (
              <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                <Building className="w-5 h-5 text-gray-600" />
                <div>
                  <p className="text-xs text-gray-600">Sklep</p>
                  <p className="font-medium text-gray-800">ID: {user.store_id}</p>
                </div>
              </div>
            )}

            <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
              <Shield className="w-5 h-5 text-gray-600" />
              <div>
                <p className="text-xs text-gray-600">Rola</p>
                <p className="font-medium text-gray-800">{roleLabels[user.role] || user.role}</p>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-lg p-6">
          <div className="flex items-center gap-2 mb-4">
            <Settings className="w-5 h-5 text-amber-600" />
            <h3 className="font-semibold text-lg">Ustawienia zamawiania</h3>
          </div>
          <div className="space-y-3">
            <p className="text-sm text-gray-600 mb-3">Wybierz sposób składania zamówień z cennika:</p>
            <button
              onClick={() => handleOrderModeChange('quantity')}
              disabled={saving}
              className={`w-full p-4 rounded-lg border-2 transition text-left ${
                orderMode === 'quantity'
                  ? 'border-amber-500 bg-amber-50'
                  : 'border-gray-200 hover:border-gray-300'
              }`}
            >
              <div className="font-semibold text-gray-800 mb-1">Z cennika ilości</div>
              <div className="text-sm text-gray-600">Dodajesz produkt z ilością od razu i wysyłasz</div>
            </button>
            <button
              onClick={() => handleOrderModeChange('list')}
              disabled={saving}
              className={`w-full p-4 rounded-lg border-2 transition text-left ${
                orderMode === 'list'
                  ? 'border-amber-500 bg-amber-50'
                  : 'border-gray-200 hover:border-gray-300'
              }`}
            >
              <div className="font-semibold text-gray-800 mb-1">Z cennika lista</div>
              <div className="text-sm text-gray-600">Budujesz listę produktów, potem podajesz ilości i zapisujesz jako szkic</div>
            </button>
          </div>
        </div>

        {(user.role === 'store_manager' || user.role === 'salesperson') && (
          <div className="bg-white rounded-xl shadow-lg p-6">
            <div className="flex items-center gap-2 mb-4">
              <Users className="w-5 h-5 text-amber-600" />
              <h3 className="font-semibold text-lg">Współdzielenie edycji</h3>
            </div>
            <div className="space-y-3">
              <p className="text-sm text-gray-600 mb-3">Czy inni użytkownicy z Twojego sklepu mogą edytować Twoje szkice zamówień?</p>
              <button
                onClick={handleCollaborationToggle}
                disabled={saving}
                className={`w-full p-4 rounded-lg border-2 transition text-left ${
                  allowCollaboration
                    ? 'border-amber-500 bg-amber-50'
                    : 'border-gray-200 hover:border-gray-300'
                }`}
              >
                <div className="font-semibold text-gray-800 mb-1">✅ Tak, pozwól innym edytować</div>
                <div className="text-sm text-gray-600">Inni kierownicy i handlowcy z Twojego sklepu mogą edytować Twoje szkice</div>
              </button>
              <button
                onClick={handleCollaborationToggle}
                disabled={saving}
                className={`w-full p-4 rounded-lg border-2 transition text-left ${
                  !allowCollaboration
                    ? 'border-amber-500 bg-amber-50'
                    : 'border-gray-200 hover:border-gray-300'
                }`}
              >
                <div className="font-semibold text-gray-800 mb-1">❌ Nie, tylko ja mogę edytować</div>
                <div className="text-sm text-gray-600">Tylko Ty możesz edytować swoje szkice zamówień</div>
              </button>
            </div>
          </div>
        )}

        {user.role === 'store_manager' && (
          <div className="bg-white rounded-xl shadow-lg p-6">
            <div className="flex items-center gap-2 mb-4">
              <Filter className="w-5 h-5 text-amber-600" />
              <h3 className="font-semibold text-lg">Filtry zamówień</h3>
            </div>
            <div className="space-y-3">
              <p className="text-sm text-gray-600 mb-3">Wybierz widok filtrów na karcie "Moje zamówienia":</p>
              <button
                onClick={handleShowAllFiltersToggle}
                disabled={saving}
                className={`w-full p-4 rounded-lg border-2 transition text-left ${
                  !showAllFilters
                    ? 'border-amber-500 bg-amber-50'
                    : 'border-gray-200 hover:border-gray-300'
                }`}
              >
                <div className="font-semibold text-gray-800 mb-1">Uproszczony widok</div>
                <div className="text-sm text-gray-600">Pokazuj tylko filtry: Szkice i Wysłane</div>
              </button>
              <button
                onClick={handleShowAllFiltersToggle}
                disabled={saving}
                className={`w-full p-4 rounded-lg border-2 transition text-left ${
                  showAllFilters
                    ? 'border-amber-500 bg-amber-50'
                    : 'border-gray-200 hover:border-gray-300'
                }`}
              >
                <div className="font-semibold text-gray-800 mb-1">Wszystkie filtry</div>
                <div className="text-sm text-gray-600">Pokazuj wszystkie statusy zamówień</div>
              </button>
            </div>
          </div>
        )}

        <div className="bg-white rounded-xl shadow-lg p-6">
          <h3 className="font-semibold text-lg mb-4">Informacje o aplikacji</h3>
          <div className="space-y-2 text-sm text-gray-600">
            <p>Wersja: 1.0.0 (Prototyp)</p>
            <p>RODEO - System Zamówień Mięsno-Wędliniarskich</p>
            <p className="text-xs text-gray-500 mt-4">
              Aplikacja umożliwia składanie i zarządzanie zamówieniami za pomocą poleceń głosowych.
            </p>
          </div>
        </div>

        <button
          onClick={async (e) => {
            e.preventDefault();
            console.log('Logout button clicked');
            try {
              await onSignOut();
              console.log('Logout successful');
            } catch (error) {
              console.error('Logout error:', error);
            }
          }}
          className="w-full py-4 bg-red-600 text-white rounded-xl font-medium hover:bg-red-700 active:bg-red-800 transition flex items-center justify-center gap-2 shadow-lg cursor-pointer"
        >
          <LogOut className="w-5 h-5" />
          Wyloguj się
        </button>
      </div>
    </div>
  );
}
