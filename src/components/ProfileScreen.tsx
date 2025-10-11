import { useState } from 'react';
import { User as UserIcon, Mail, Building, Shield, LogOut, Settings, Filter, Users, Eye, EyeOff, Palette, Mic, ListOrdered, Copy, Edit, Plus, Grid3x3, List } from 'lucide-react';
import { User, supabase } from '../lib/supabase';
import { useTheme, Theme } from '../contexts/ThemeContext';
import { showAlert } from '../lib/alerts';

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
  const { theme, setTheme } = useTheme();
  const [showAllFilters, setShowAllFilters] = useState<boolean>(user.show_all_order_filters || false);
  const [allowCollaboration, setAllowCollaboration] = useState<boolean>((user as any).allow_collaborative_editing ?? true);
  const [showDescription, setShowDescription] = useState<boolean>((user as any).show_product_description ?? true);
  const [showIndex, setShowIndex] = useState<boolean>((user as any).show_product_index ?? true);
  const [notebookMode, setNotebookMode] = useState<'single' | 'multiple'>((user as any).notebook_mode || 'multiple');
  const [showSortIcons, setShowSortIcons] = useState<boolean>((user as any).show_sort_icons ?? true);
  const [showPriceLayoutToggle, setShowPriceLayoutToggle] = useState<boolean>((user as any).show_price_layout_toggle ?? true);
  const [enableVoiceOrders, setEnableVoiceOrders] = useState<boolean>((user as any).enable_voice_orders ?? true);
  const [enablePricelistOrders, setEnablePricelistOrders] = useState<boolean>((user as any).enable_pricelist_orders ?? true);
  const [enableCopyOrders, setEnableCopyOrders] = useState<boolean>((user as any).enable_copy_orders ?? true);
  const [enableManualOrders, setEnableManualOrders] = useState<boolean>((user as any).enable_manual_orders ?? true);
  const [orderModeLayout, setOrderModeLayout] = useState<'list' | 'grid'>((user as any).order_mode_layout || 'list');
  const [saving, setSaving] = useState(false);

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
      showAlert('Ustawienia zapisane!', 'success');
    } catch (error) {
      console.error('Error updating filter settings:', error);
      showAlert('Błąd podczas zapisywania ustawień', 'error');
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
      showAlert('Ustawienia zapisane!', 'success');
    } catch (error) {
      console.error('Error updating collaboration settings:', error);
      showAlert('Błąd podczas zapisywania ustawień', 'error');
    } finally {
      setSaving(false);
    }
  };

  const handleDisplayToggle = async (field: 'show_product_description' | 'show_product_index' | 'show_sort_icons' | 'show_price_layout_toggle') => {
    setSaving(true);
    try {
      let currentValue: boolean;
      if (field === 'show_product_description') currentValue = showDescription;
      else if (field === 'show_product_index') currentValue = showIndex;
      else if (field === 'show_sort_icons') currentValue = showSortIcons;
      else currentValue = showPriceLayoutToggle;

      const newValue = !currentValue;
      const { error } = await supabase
        .from('users')
        .update({ [field]: newValue })
        .eq('id', user.id);

      if (error) throw error;

      if (field === 'show_product_description') {
        setShowDescription(newValue);
      } else if (field === 'show_product_index') {
        setShowIndex(newValue);
      } else if (field === 'show_sort_icons') {
        setShowSortIcons(newValue);
      } else {
        setShowPriceLayoutToggle(newValue);
      }

      showAlert('Ustawienia zapisane!', 'success');
      setTimeout(() => {
        window.location.reload();
      }, 2000);
    } catch (error) {
      console.error('Error updating display settings:', error);
      showAlert('Błąd podczas zapisywania ustawień', 'error');
    } finally {
      setSaving(false);
    }
  };

  const handleNotebookModeChange = async (mode: 'single' | 'multiple') => {
    setSaving(true);
    try {
      const { error } = await supabase
        .from('users')
        .update({ notebook_mode: mode })
        .eq('id', user.id);

      if (error) throw error;
      setNotebookMode(mode);
      showAlert('Ustawienia zapisane!', 'success');
    } catch (error) {
      console.error('Error updating notebook mode:', error);
      showAlert('Błąd podczas zapisywania ustawień', 'error');
    } finally {
      setSaving(false);
    }
  };

  const handleOrderModeToggle = async (field: 'enable_voice_orders' | 'enable_pricelist_orders' | 'enable_copy_orders' | 'enable_manual_orders') => {
    setSaving(true);
    try {
      let currentValue: boolean;
      if (field === 'enable_voice_orders') currentValue = enableVoiceOrders;
      else if (field === 'enable_pricelist_orders') currentValue = enablePricelistOrders;
      else if (field === 'enable_copy_orders') currentValue = enableCopyOrders;
      else currentValue = enableManualOrders;

      const newValue = !currentValue;
      const { error } = await supabase
        .from('users')
        .update({ [field]: newValue })
        .eq('id', user.id);

      if (error) throw error;

      if (field === 'enable_voice_orders') {
        setEnableVoiceOrders(newValue);
      } else if (field === 'enable_pricelist_orders') {
        setEnablePricelistOrders(newValue);
      } else if (field === 'enable_copy_orders') {
        setEnableCopyOrders(newValue);
      } else {
        setEnableManualOrders(newValue);
      }

      showAlert('Ustawienia zapisane!', 'success');
      setTimeout(() => {
        window.location.reload();
      }, 1500);
    } catch (error) {
      console.error('Error updating order mode settings:', error);
      showAlert('Błąd podczas zapisywania ustawień', 'error');
    } finally {
      setSaving(false);
    }
  };

  const handleOrderModeLayoutChange = async (layout: 'list' | 'grid') => {
    setSaving(true);
    try {
      const { error } = await supabase
        .from('users')
        .update({ order_mode_layout: layout })
        .eq('id', user.id);

      if (error) throw error;
      setOrderModeLayout(layout);
      showAlert('Ustawienia zapisane!', 'success');
      setTimeout(() => {
        window.location.reload();
      }, 1500);
    } catch (error) {
      console.error('Error updating order mode layout:', error);
      showAlert('Błąd podczas zapisywania ustawień', 'error');
    } finally {
      setSaving(false);
    }
  };

  const themeNames: Record<Theme, string> = {
    amber: 'Bursztynowy',
    blue: 'Niebieski',
    green: 'Zielony',
    red: 'Czerwony',
    purple: 'Fioletowy',
  };

  return (
    <div className="bg-gray-50">
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
            <Palette className="w-5 h-5 text-amber-600" />
            <h3 className="font-semibold text-lg">Motyw kolorystyczny</h3>
          </div>
          <p className="text-sm text-gray-600 mb-3">Wybierz swój ulubiony motyw:</p>
          <div className="grid grid-cols-2 gap-3">
            {(['amber', 'blue', 'green', 'red', 'purple'] as Theme[]).map((themeOption) => (
              <button
                key={themeOption}
                onClick={() => setTheme(themeOption)}
                className={`p-4 rounded-lg border-2 transition text-left ${
                  theme === themeOption
                    ? 'border-gray-800 bg-gray-50'
                    : 'border-gray-200 hover:border-gray-300'
                }`}
              >
                <div className="flex items-center gap-3">
                  <div
                    className={`w-8 h-8 rounded-full ${
                      themeOption === 'amber' ? 'bg-amber-500' :
                      themeOption === 'blue' ? 'bg-blue-500' :
                      themeOption === 'green' ? 'bg-green-500' :
                      themeOption === 'red' ? 'bg-red-500' :
                      'bg-purple-500'
                    }`}
                  />
                  <span className="font-medium text-gray-800">{themeNames[themeOption]}</span>
                </div>
              </button>
            ))}
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-lg p-6">
          <div className="flex items-center gap-2 mb-4">
            <Plus className="w-5 h-5 text-amber-600" />
            <h3 className="font-semibold text-lg">Tryby składania zamówień</h3>
          </div>
          <p className="text-sm text-gray-600 mb-4">Włącz lub wyłącz poszczególne sposoby składania zamówień:</p>
          <div className="space-y-3">
            <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
              <div className="flex items-center gap-3">
                <Mic className="w-5 h-5 text-amber-600" />
                <div>
                  <div className="font-semibold text-gray-800">Zamówienia głosowe</div>
                  <div className="text-sm text-gray-600">Składaj zamówienia za pomocą głosu</div>
                </div>
              </div>
              <button
                onClick={() => handleOrderModeToggle('enable_voice_orders')}
                disabled={saving}
                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                  enableVoiceOrders ? 'bg-amber-600' : 'bg-gray-300'
                }`}
              >
                <span
                  className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                    enableVoiceOrders ? 'translate-x-6' : 'translate-x-1'
                  }`}
                />
              </button>
            </div>
            <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
              <div className="flex items-center gap-3">
                <ListOrdered className="w-5 h-5 text-amber-600" />
                <div>
                  <div className="font-semibold text-gray-800">Zamówienia z cennika</div>
                  <div className="text-sm text-gray-600">Składaj zamówienia wybierając z cennika</div>
                </div>
              </div>
              <button
                onClick={() => handleOrderModeToggle('enable_pricelist_orders')}
                disabled={saving}
                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                  enablePricelistOrders ? 'bg-amber-600' : 'bg-gray-300'
                }`}
              >
                <span
                  className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                    enablePricelistOrders ? 'translate-x-6' : 'translate-x-1'
                  }`}
                />
              </button>
            </div>
            <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
              <div className="flex items-center gap-3">
                <Copy className="w-5 h-5 text-amber-600" />
                <div>
                  <div className="font-semibold text-gray-800">Kopiuj zamówienie</div>
                  <div className="text-sm text-gray-600">Twórz nowe zamówienia na bazie poprzednich</div>
                </div>
              </div>
              <button
                onClick={() => handleOrderModeToggle('enable_copy_orders')}
                disabled={saving}
                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                  enableCopyOrders ? 'bg-amber-600' : 'bg-gray-300'
                }`}
              >
                <span
                  className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                    enableCopyOrders ? 'translate-x-6' : 'translate-x-1'
                  }`}
                />
              </button>
            </div>
            <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
              <div className="flex items-center gap-3">
                <Edit className="w-5 h-5 text-amber-600" />
                <div>
                  <div className="font-semibold text-gray-800">Zamówienia ręczne</div>
                  <div className="text-sm text-gray-600">Wprowadzaj zamówienia ręcznie</div>
                </div>
              </div>
              <button
                onClick={() => handleOrderModeToggle('enable_manual_orders')}
                disabled={saving}
                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                  enableManualOrders ? 'bg-amber-600' : 'bg-gray-300'
                }`}
              >
                <span
                  className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                    enableManualOrders ? 'translate-x-6' : 'translate-x-1'
                  }`}
                />
              </button>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-lg p-6">
          <div className="flex items-center gap-2 mb-4">
            <Settings className="w-5 h-5 text-amber-600" />
            <h3 className="font-semibold text-lg">Układ przycisków zamówień</h3>
          </div>
          <div className="space-y-3">
            <p className="text-sm text-gray-600 mb-3">Jak wyświetlać przyciski w karcie &quot;Nowe zamówienie&quot;?</p>
            <button
              onClick={() => handleOrderModeLayoutChange('list')}
              disabled={saving}
              className={`w-full p-4 rounded-lg border-2 transition text-left ${
                orderModeLayout === 'list'
                  ? 'border-amber-500 bg-amber-50'
                  : 'border-gray-200 hover:border-gray-300'
              }`}
            >
              <div className="flex items-center gap-3">
                <List className="w-5 h-5 text-amber-600" />
                <div>
                  <div className="font-semibold text-gray-800 mb-1">Lista (domyślnie)</div>
                  <div className="text-sm text-gray-600">Przyciski ułożone jeden pod drugim</div>
                </div>
              </div>
            </button>
            <button
              onClick={() => handleOrderModeLayoutChange('grid')}
              disabled={saving}
              className={`w-full p-4 rounded-lg border-2 transition text-left ${
                orderModeLayout === 'grid'
                  ? 'border-amber-500 bg-amber-50'
                  : 'border-gray-200 hover:border-gray-300'
              }`}
            >
              <div className="flex items-center gap-3">
                <Grid3x3 className="w-5 h-5 text-amber-600" />
                <div>
                  <div className="font-semibold text-gray-800 mb-1">Siatka</div>
                  <div className="text-sm text-gray-600">Przyciski ułożone w siatce 2 kolumny</div>
                </div>
              </div>
            </button>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-lg p-6">
          <div className="flex items-center gap-2 mb-4">
            <Settings className="w-5 h-5 text-amber-600" />
            <h3 className="font-semibold text-lg">Tryb notatnika</h3>
          </div>
          <div className="space-y-3">
            <p className="text-sm text-gray-600 mb-3">Jak dodawać produkty do notatnika przez przesunięcie w prawo?</p>
            <button
              onClick={() => handleNotebookModeChange('multiple')}
              disabled={saving}
              className={`w-full p-4 rounded-lg border-2 transition text-left ${
                notebookMode === 'multiple'
                  ? 'border-amber-500 bg-amber-50'
                  : 'border-gray-200 hover:border-gray-300'
              }`}
            >
              <div className="font-semibold text-gray-800 mb-1">Twórz nowy notatnik za każdym razem</div>
              <div className="text-sm text-gray-600">Każde wejście w cennik tworzy nowy notatnik</div>
            </button>
            <button
              onClick={() => handleNotebookModeChange('single')}
              disabled={saving}
              className={`w-full p-4 rounded-lg border-2 transition text-left ${
                notebookMode === 'single'
                  ? 'border-amber-500 bg-amber-50'
                  : 'border-gray-200 hover:border-gray-300'
              }`}
            >
              <div className="font-semibold text-gray-800 mb-1">Dodawaj do jednego notatnika</div>
              <div className="text-sm text-gray-600">Wszystkie produkty trafiają do tego samego notatnika (bez duplikatów)</div>
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

        <div className="bg-white rounded-xl shadow-lg p-6">
          <div className="flex items-center gap-2 mb-4">
            <Eye className="w-5 h-5 text-amber-600" />
            <h3 className="font-semibold text-lg">Wyświetlanie w cenniku</h3>
          </div>
          <div className="space-y-4">
            <div>
              <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                <div>
                  <div className="font-semibold text-gray-800">Rozszerzony opis produktu</div>
                  <div className="text-sm text-gray-600">Pokazuj dodatkowy opis pod nazwą produktu</div>
                </div>
                <button
                  onClick={() => handleDisplayToggle('show_product_description')}
                  disabled={saving}
                  className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                    showDescription ? 'bg-amber-600' : 'bg-gray-300'
                  }`}
                >
                  <span
                    className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                      showDescription ? 'translate-x-6' : 'translate-x-1'
                    }`}
                  />
                </button>
              </div>
            </div>
            <div>
              <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                <div>
                  <div className="font-semibold text-gray-800">Numer indeksu produktu</div>
                  <div className="text-sm text-gray-600">Pokazuj 13-cyfrowy kod indeksu</div>
                </div>
                <button
                  onClick={() => handleDisplayToggle('show_product_index')}
                  disabled={saving}
                  className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                    showIndex ? 'bg-amber-600' : 'bg-gray-300'
                  }`}
                >
                  <span
                    className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                      showIndex ? 'translate-x-6' : 'translate-x-1'
                    }`}
                  />
                </button>
              </div>
            </div>
          </div>
        </div>

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
          <div className="flex items-center gap-2 mb-4">
            <Settings className="w-5 h-5 text-amber-600" />
            <h3 className="font-semibold text-lg">Ustawienia cennika</h3>
          </div>
          <div className="space-y-3">
            <div>
              <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                <div>
                  <div className="font-semibold text-gray-800">Ikony sortowania</div>
                  <div className="text-sm text-gray-600">Pokazuj opcje sortowania w cenniku</div>
                </div>
                <button
                  onClick={() => handleDisplayToggle('show_sort_icons')}
                  disabled={saving}
                  className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                    showSortIcons ? 'bg-amber-600' : 'bg-gray-300'
                  }`}
                >
                  <span
                    className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                      showSortIcons ? 'translate-x-6' : 'translate-x-1'
                    }`}
                  />
                </button>
              </div>
            </div>
            <div>
              <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                <div>
                  <div className="font-semibold text-gray-800">Przełącznik widoku ceny</div>
                  <div className="text-sm text-gray-600">Pokazuj opcję zmiany układu cen</div>
                </div>
                <button
                  onClick={() => handleDisplayToggle('show_price_layout_toggle')}
                  disabled={saving}
                  className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                    showPriceLayoutToggle ? 'bg-amber-600' : 'bg-gray-300'
                  }`}
                >
                  <span
                    className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                      showPriceLayoutToggle ? 'translate-x-6' : 'translate-x-1'
                    }`}
                  />
                </button>
              </div>
            </div>
          </div>
        </div>

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
