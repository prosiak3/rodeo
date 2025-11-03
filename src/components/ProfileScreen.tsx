import { useState } from 'react';
import { User as UserIcon, Mail, Building, Shield, LogOut, Settings, Filter, Users, Eye, EyeOff, Palette, Mic, ListOrdered, Copy, Edit, Plus, Grid3x3, List, Sparkles, Trash2, ChevronDown, Clock, Home, ShoppingBag, Wand2, Type, Camera, Upload, Smartphone, Tablet, Monitor, Phone, Save, X } from 'lucide-react';
import { User, supabase, FontSize } from '../lib/supabase';
import { useTheme, Theme } from '../contexts/ThemeContext';
import { ThemeStyle, THEME_CONFIGS } from '../types/themes';
import { showAlert } from '../lib/alerts';
import { useFontSize } from '../contexts/FontSizeContext';
import { useDeviceType } from '../hooks/useDeviceType';

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
  const { theme, setTheme, uiTheme, setUiTheme } = useTheme();
  const { fontSize, setFontSize } = useFontSize();
  const deviceType = useDeviceType();
  const [showAllFilters, setShowAllFilters] = useState<boolean>(user.show_all_order_filters || false);
  const [allowCollaboration, setAllowCollaboration] = useState<boolean>((user as any).allow_collaborative_editing ?? true);
  const [showDescription, setShowDescription] = useState<boolean>((user as any).show_product_description ?? true);
  const [showIndex, setShowIndex] = useState<boolean>((user as any).show_product_index ?? true);
  const [notebookMode, setNotebookMode] = useState<'single' | 'multiple'>((user as any).notebook_mode || 'multiple');
  const [showSortIcons, setShowSortIcons] = useState<boolean>((user as any).show_sort_icons ?? true);
  const [showPriceLayoutToggle, setShowPriceLayoutToggle] = useState<boolean>((user as any).show_price_layout_toggle ?? true);
  const [showSortButtons, setShowSortButtons] = useState<boolean>(user.show_sort_buttons ?? false);
  const [showGroupButtons, setShowGroupButtons] = useState<boolean>((user as any).show_group_buttons ?? false);
  const [enableVoiceOrders, setEnableVoiceOrders] = useState<boolean>((user as any).enable_voice_orders ?? true);
  const [enablePricelistOrders, setEnablePricelistOrders] = useState<boolean>((user as any).enable_pricelist_orders ?? true);
  const [enableCopyOrders, setEnableCopyOrders] = useState<boolean>((user as any).enable_copy_orders ?? true);
  const [enableManualOrders, setEnableManualOrders] = useState<boolean>((user as any).enable_manual_orders ?? true);
  const [orderModeLayout, setOrderModeLayout] = useState<'list' | 'grid'>((user as any).order_mode_layout || 'list');
  const [autoOrderAnalysisDays, setAutoOrderAnalysisDays] = useState<number>((user as any).auto_order_analysis_days || 180);
  const [orderDetailsStatusExpanded, setOrderDetailsStatusExpanded] = useState<boolean>((user as any).order_details_status_expanded ?? false);
  const [showNotebookButtonLabels, setShowNotebookButtonLabels] = useState<boolean>((user as any).show_notebook_button_labels ?? false);
  const [showDeleteIcons, setShowDeleteIcons] = useState<boolean>((user as any).show_delete_icons ?? false);
  const [showVoiceInEditDraft, setShowVoiceInEditDraft] = useState<boolean>((user as any).show_voice_in_edit_draft ?? true);
  const [showNotebookToast, setShowNotebookToast] = useState<boolean>((user as any).show_notebook_toast ?? true);
  const [afterAutoLogout, setAfterAutoLogout] = useState<string>((user as any).after_auto_logout_return_to || 'last_location');
  const [saving, setSaving] = useState(false);
  const [profilePicture, setProfilePicture] = useState<string>((user as any).profile_picture_url || '');
  const [customUrl, setCustomUrl] = useState<string>('');
  const [showUrlInput, setShowUrlInput] = useState(false);
  const [phone, setPhone] = useState<string>(user.phone || '');
  const [contactEmail, setContactEmail] = useState<string>(user.contact_email || '');

  const saveDevicePreference = async (field: string, value: any) => {
    try {
      const { data: currentData } = await supabase
        .from('users')
        .select('device_preferences')
        .eq('id', user.id)
        .maybeSingle();

      const currentPrefs = currentData?.device_preferences || {};
      const devicePrefs = currentPrefs[deviceType] || {};

      const updatedPrefs = {
        ...currentPrefs,
        [deviceType]: {
          ...devicePrefs,
          [field]: value,
        },
      };

      const { error } = await supabase
        .from('users')
        .update({ device_preferences: updatedPrefs })
        .eq('id', user.id);

      if (error) throw error;
      return true;
    } catch (error) {
      console.error('Error saving device preference:', error);
      return false;
    }
  };

  const handleSaveContactInfo = async () => {
    setSaving(true);
    try {
      const { error } = await supabase
        .from('users')
        .update({
          phone: phone || null,
          contact_email: contactEmail || null
        })
        .eq('id', user.id);

      if (error) throw error;
      showAlert('Dane kontaktowe zapisane!', 'success');
    } catch (error) {
      console.error('Error updating contact info:', error);
      showAlert('Błąd podczas zapisywania danych', 'error');
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

  const handleDisplayToggle = async (field: 'show_product_description' | 'show_product_index' | 'show_sort_icons' | 'show_price_layout_toggle' | 'show_sort_buttons' | 'show_group_buttons') => {
    setSaving(true);
    try {
      let currentValue: boolean;
      if (field === 'show_product_description') currentValue = showDescription;
      else if (field === 'show_product_index') currentValue = showIndex;
      else if (field === 'show_sort_icons') currentValue = showSortIcons;
      else if (field === 'show_price_layout_toggle') currentValue = showPriceLayoutToggle;
      else if (field === 'show_sort_buttons') currentValue = showSortButtons;
      else currentValue = showGroupButtons;

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
      } else if (field === 'show_price_layout_toggle') {
        setShowPriceLayoutToggle(newValue);
      } else if (field === 'show_sort_buttons') {
        setShowSortButtons(newValue);
      } else if (field === 'show_group_buttons') {
        setShowGroupButtons(newValue);
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
      const success = await saveDevicePreference('order_mode_layout', layout);
      if (!success) throw new Error('Failed to save');

      setOrderModeLayout(layout);
      showAlert(`Ustawienia zapisane dla urządzenia: ${deviceNames[deviceType]}!`, 'success');
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

  const handleAutoOrderAnalysisDaysChange = async (days: number) => {
    setSaving(true);
    try {
      const { error } = await supabase
        .from('users')
        .update({ auto_order_analysis_days: days })
        .eq('id', user.id);

      if (error) throw error;
      setAutoOrderAnalysisDays(days);

      if (user.store_id) {
        await supabase
          .from('auto_order_suggestions')
          .delete()
          .eq('store_id', user.store_id);
      }

      showAlert('Ustawienia zapisane! Cache automatycznych zamówień został wyczyszczony.', 'success');
    } catch (error) {
      console.error('Error updating auto order analysis period:', error);
      showAlert('Błąd podczas zapisywania ustawień', 'error');
    } finally {
      setSaving(false);
    }
  };

  const handleOrderDetailsStatusExpandedToggle = async () => {
    setSaving(true);
    try {
      const newValue = !orderDetailsStatusExpanded;
      const { error } = await supabase
        .from('users')
        .update({ order_details_status_expanded: newValue })
        .eq('id', user.id);

      if (error) throw error;
      setOrderDetailsStatusExpanded(newValue);
      showAlert('Ustawienia zapisane!', 'success');
    } catch (error) {
      console.error('Error updating order details settings:', error);
      showAlert('Błąd podczas zapisywania ustawień', 'error');
    } finally {
      setSaving(false);
    }
  };

  const handleNotebookButtonLabelsToggle = async () => {
    setSaving(true);
    try {
      const newValue = !showNotebookButtonLabels;
      const { error } = await supabase
        .from('users')
        .update({ show_notebook_button_labels: newValue })
        .eq('id', user.id);

      if (error) throw error;
      setShowNotebookButtonLabels(newValue);
      showAlert('Ustawienia zapisane!', 'success');
    } catch (error) {
      console.error('Error updating notebook button labels settings:', error);
      showAlert('Błąd podczas zapisywania ustawień', 'error');
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteIconsToggle = async () => {
    setSaving(true);
    try {
      const newValue = !showDeleteIcons;
      const { error } = await supabase
        .from('users')
        .update({ show_delete_icons: newValue })
        .eq('id', user.id);

      if (error) throw error;
      setShowDeleteIcons(newValue);
      showAlert('Ustawienia zapisane!', 'success');
    } catch (error) {
      console.error('Error updating delete icons settings:', error);
      showAlert('Błąd podczas zapisywania ustawień', 'error');
    } finally {
      setSaving(false);
    }
  };

  const handleVoiceInEditDraftToggle = async () => {
    setSaving(true);
    try {
      const newValue = !showVoiceInEditDraft;
      const { error } = await supabase
        .from('users')
        .update({ show_voice_in_edit_draft: newValue })
        .eq('id', user.id);

      if (error) throw error;
      setShowVoiceInEditDraft(newValue);
      showAlert('Ustawienia zapisane!', 'success');
    } catch (error) {
      console.error('Error updating voice in edit draft settings:', error);
      showAlert('Błąd podczas zapisywania ustawień', 'error');
    } finally {
      setSaving(false);
    }
  };

  const handleShowNotebookToastToggle = async () => {
    setSaving(true);
    try {
      const newValue = !showNotebookToast;
      const { error } = await supabase
        .from('users')
        .update({ show_notebook_toast: newValue })
        .eq('id', user.id);

      if (error) throw error;
      setShowNotebookToast(newValue);
      showAlert('Ustawienia zapisane!', 'success');
    } catch (error) {
      console.error('Error updating notebook toast settings:', error);
      showAlert('Błąd podczas zapisywania ustawień', 'error');
    } finally {
      setSaving(false);
    }
  };

  const handleAfterAutoLogoutChange = async (value: string) => {
    setSaving(true);
    try {
      const { error } = await supabase
        .from('users')
        .update({ after_auto_logout_return_to: value })
        .eq('id', user.id);

      if (error) throw error;
      setAfterAutoLogout(value);
      showAlert('Ustawienia zapisane!', 'success');
    } catch (error) {
      console.error('Error updating auto-logout settings:', error);
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

  const handleUiThemeChange = async (newTheme: ThemeStyle | null) => {
    if (confirm(newTheme
      ? `Czy na pewno chcesz zmienić styl interfejsu na "${THEME_CONFIGS[newTheme].name}"? Aplikacja zostanie przeładowana.`
      : 'Czy na pewno chcesz wrócić do domyślnego stylu interfejsu? Aplikacja zostanie przeładowana.'
    )) {
      setSaving(true);
      await setUiTheme(newTheme);
    }
  };

  const handleFontSizeChange = async (size: FontSize) => {
    setSaving(true);
    try {
      await setFontSize(size);
      showAlert('Rozmiar interfejsu został zmieniony!', 'success');
    } catch (error) {
      console.error('Error updating font size:', error);
      showAlert('Błąd podczas zapisywania rozmiaru', 'error');
    } finally {
      setSaving(false);
    }
  };

  const handleClearAICache = async () => {
    if (!confirm('Czy na pewno chcesz wyczyścić pamięć podręczną AI? Model zostanie ponownie pobrany przy następnym użyciu.')) {
      return;
    }

    setSaving(true);
    try {
      const { embeddingsManager } = await import('../lib/embeddingsManager');
      await embeddingsManager.clearCache();

      if ('serviceWorker' in navigator && navigator.serviceWorker.controller) {
        const messageChannel = new MessageChannel();
        messageChannel.port1.onmessage = (event) => {
          if (event.data.success) {
            showAlert('Pamięć podręczna AI została wyczyszczona', 'success');
          }
        };
        navigator.serviceWorker.controller.postMessage(
          { type: 'CLEAR_AI_CACHE' },
          [messageChannel.port2]
        );
      } else {
        showAlert('Pamięć podręczna AI została wyczyszczona', 'success');
      }
    } catch (error) {
      console.error('Error clearing AI cache:', error);
      showAlert('Błąd podczas czyszczenia pamięci podręcznej', 'error');
    } finally {
      setSaving(false);
    }
  };

  const handleProfilePictureUpdate = async (url: string) => {
    setSaving(true);
    try {
      const { error } = await supabase
        .from('users')
        .update({ profile_picture_url: url })
        .eq('id', user.id);

      if (error) throw error;
      setProfilePicture(url);
      setShowUrlInput(false);
      setCustomUrl('');
      showAlert('Zdjęcie profilowe zostało zaktualizowane!', 'success');
      window.location.reload();
    } catch (error) {
      console.error('Error updating profile picture:', error);
      showAlert('Błąd podczas aktualizacji zdjęcia', 'error');
    } finally {
      setSaving(false);
    }
  };

  const deviceIcons = {
    mobile: Smartphone,
    tablet: Tablet,
    desktop: Monitor,
  };

  const deviceNames = {
    mobile: 'Telefon',
    tablet: 'Tablet',
    desktop: 'Komputer',
  };

  const DeviceIcon = deviceIcons[deviceType];

  return (
    <div className="bg-gray-50">
      <div className="p-6 space-y-6">
        <div className="bg-gradient-to-r from-blue-50 to-cyan-50 border-2 border-blue-200 rounded-xl p-4 shadow-sm">
          <div className="flex items-start gap-3">
            <DeviceIcon className="w-6 h-6 text-blue-600 mt-0.5 flex-shrink-0" />
            <div className="flex-1">
              <h3 className="font-semibold text-blue-900 mb-1">
                Ustawienia dla urządzenia: {deviceNames[deviceType]}
              </h3>
              <p className="text-sm text-blue-700">
                Twoje preferencje są zapisywane osobno dla każdego typu urządzenia.
                Możesz mieć inne ustawienia na telefonie, tablecie i komputerze -
                będą automatycznie przełączane gdy zmienisz urządzenie.
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-lg p-6">
          <div className="flex items-center gap-4 mb-6">
            <div className="relative">
              <div className="w-20 h-20 bg-gradient-to-br from-amber-500 to-orange-600 rounded-full flex items-center justify-center overflow-hidden">
                {profilePicture ? (
                  <img src={profilePicture} alt="Profil" className="w-full h-full object-cover" />
                ) : (
                  <UserIcon className="w-10 h-10 text-white" />
                )}
              </div>
              <button
                onClick={() => setShowUrlInput(!showUrlInput)}
                className="absolute -bottom-1 -right-1 w-8 h-8 bg-amber-500 hover:bg-amber-600 text-white rounded-full flex items-center justify-center transition shadow-lg"
                title="Zmień zdjęcie"
              >
                <Camera className="w-4 h-4" />
              </button>
            </div>
            <div className="flex-1">
              <h3 className="text-xl font-bold text-gray-800">{user.full_name}</h3>
              <p className="text-sm text-gray-600">{roleLabels[user.role] || user.role}</p>
            </div>
          </div>

          {showUrlInput && (
            <div className="mb-6 p-4 bg-amber-50 border-2 border-amber-200 rounded-lg">
              <div className="flex items-center gap-2 mb-3">
                <Upload className="w-5 h-5 text-amber-600" />
                <h4 className="font-semibold text-gray-800">Zmień zdjęcie profilowe</h4>
              </div>
              <p className="text-sm text-gray-600 mb-3">
                Wklej URL do swojego zdjęcia (np. z Gravatar, LinkedIn lub innego serwisu):
              </p>
              <div className="space-y-2">
                <input
                  type="url"
                  value={customUrl}
                  onChange={(e) => setCustomUrl(e.target.value)}
                  placeholder="https://example.com/moje-zdjecie.jpg"
                  className="w-full p-3 border-2 border-gray-300 rounded-lg focus:border-amber-500 focus:outline-none"
                />
                <div className="flex gap-2">
                  <button
                    onClick={() => customUrl && handleProfilePictureUpdate(customUrl)}
                    disabled={!customUrl || saving}
                    className="flex-1 py-2 bg-amber-500 hover:bg-amber-600 text-white rounded-lg font-medium transition disabled:opacity-50"
                  >
                    {saving ? 'Zapisywanie...' : 'Zapisz zdjęcie'}
                  </button>
                  <button
                    onClick={() => {
                      setShowUrlInput(false);
                      setCustomUrl('');
                    }}
                    className="px-4 py-2 bg-gray-200 hover:bg-gray-300 text-gray-700 rounded-lg font-medium transition"
                  >
                    Anuluj
                  </button>
                </div>
              </div>
              <div className="mt-3 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                <p className="text-xs text-blue-800">
                  <strong>Wskazówka:</strong> Możesz użyć darmowych avatarów z{' '}
                  <a href="https://gravatar.com" target="_blank" rel="noopener noreferrer" className="underline">
                    Gravatar.com
                  </a>
                  {' '}lub wkleić link do swojego zdjęcia z mediów społecznościowych.
                </p>
              </div>
            </div>
          )}

          <div className="space-y-4">
            <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
              <Mail className="w-5 h-5 text-gray-600" />
              <div>
                <p className="text-xs text-gray-600">Email (logowanie)</p>
                <p className="font-medium text-gray-800">{user.email}</p>
              </div>
            </div>

            <div className="border-t border-gray-200 my-4"></div>

            <div className="mb-3">
              <h4 className="font-semibold text-sm text-gray-700 mb-3">Dane kontaktowe</h4>
            </div>

            <div className="space-y-3">
              <div>
                <label className="block text-xs text-gray-600 mb-1">Telefon kontaktowy</label>
                <input
                  type="tel"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="np. +48 123 456 789"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-amber-500"
                />
              </div>
              <div>
                <label className="block text-xs text-gray-600 mb-1">Email kontaktowy (w zamówieniach)</label>
                <input
                  type="email"
                  value={contactEmail}
                  onChange={(e) => setContactEmail(e.target.value)}
                  placeholder="np. kontakt@example.com"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-amber-500"
                />
              </div>
              <button
                onClick={handleSaveContactInfo}
                disabled={saving}
                className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-amber-500 text-white rounded-lg hover:bg-amber-600 transition disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <Save className="w-4 h-4" />
                {saving ? 'Zapisywanie...' : 'Zapisz dane kontaktowe'}
              </button>
            </div>

            <div className="border-t border-gray-200 my-4"></div>

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
            <Type className="w-5 h-5 text-amber-600" />
            <h3 className="font-semibold text-lg">Wielkość interfejsu</h3>
          </div>
          <p className="text-sm text-gray-600 mb-4">
            Wybierz rozmiar czcionki dostosowany do Twoich potrzeb. Zmiana zostanie zastosowana natychmiast.
          </p>
          <div className="grid grid-cols-2 gap-3">
            <button
              onClick={() => handleFontSizeChange('small')}
              disabled={saving}
              className={`p-4 rounded-lg border-2 transition text-left ${
                fontSize === 'small'
                  ? 'border-amber-500 bg-amber-50'
                  : 'border-gray-200 hover:border-gray-300'
              } disabled:opacity-50`}
            >
              <div className="font-semibold text-gray-800 mb-1 text-sm">Mały</div>
              <div className="text-xs text-gray-600">14px - Kompaktowy</div>
              <div className="text-xs text-gray-500 mt-2">Przykładowy tekst</div>
            </button>
            <button
              onClick={() => handleFontSizeChange('medium')}
              disabled={saving}
              className={`p-4 rounded-lg border-2 transition text-left ${
                fontSize === 'medium'
                  ? 'border-amber-500 bg-amber-50'
                  : 'border-gray-200 hover:border-gray-300'
              } disabled:opacity-50`}
            >
              <div className="font-semibold text-gray-800 mb-1 text-base">Średni</div>
              <div className="text-sm text-gray-600">16px - Standardowy</div>
              <div className="text-sm text-gray-500 mt-2">Przykładowy tekst</div>
            </button>
            <button
              onClick={() => handleFontSizeChange('large')}
              disabled={saving}
              className={`p-4 rounded-lg border-2 transition text-left ${
                fontSize === 'large'
                  ? 'border-amber-500 bg-amber-50'
                  : 'border-gray-200 hover:border-gray-300'
              } disabled:opacity-50`}
            >
              <div className="font-semibold text-gray-800 mb-1 text-lg">Duży</div>
              <div className="text-base text-gray-600">18px - Wygodny</div>
              <div className="text-base text-gray-500 mt-2">Przykładowy tekst</div>
            </button>
            <button
              onClick={() => handleFontSizeChange('extra-large')}
              disabled={saving}
              className={`p-4 rounded-lg border-2 transition text-left ${
                fontSize === 'extra-large'
                  ? 'border-amber-500 bg-amber-50'
                  : 'border-gray-200 hover:border-gray-300'
              } disabled:opacity-50`}
            >
              <div className="font-semibold text-gray-800 mb-1 text-xl">Bardzo duży</div>
              <div className="text-lg text-gray-600">20px - Maksymalny</div>
              <div className="text-lg text-gray-500 mt-2">Przykładowy tekst</div>
            </button>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-lg p-6">
          <div className="flex items-center gap-2 mb-4">
            <Sparkles className="w-5 h-5 text-amber-600" />
            <h3 className="font-semibold text-lg">Automatyczne zamówienia</h3>
          </div>
          <p className="text-sm text-gray-600 mb-4">
            Wybierz okres analizy historii zamówień dla generowania automatycznych propozycji:
          </p>
          <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
            <p className="text-sm text-blue-800">
              💡 Po zmianie okresu analizy, cache automatycznych zamówień zostanie wyczyszczony.
              Następne otwarcie "Auto Zamówienia" wygeneruje świeżą propozycję z nowym okresem.
            </p>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <button
              onClick={() => handleAutoOrderAnalysisDaysChange(7)}
              disabled={saving}
              className={`p-4 rounded-lg border-2 transition text-left ${
                autoOrderAnalysisDays === 7
                  ? 'border-amber-500 bg-amber-50'
                  : 'border-gray-200 hover:border-gray-300'
              }`}
            >
              <div className="font-semibold text-gray-800 mb-1">7 dni</div>
              <div className="text-sm text-gray-600">1 tydzień</div>
              <div className="text-xs text-gray-500 mt-1">Bardzo krótki okres</div>
            </button>
            <button
              onClick={() => handleAutoOrderAnalysisDaysChange(14)}
              disabled={saving}
              className={`p-4 rounded-lg border-2 transition text-left ${
                autoOrderAnalysisDays === 14
                  ? 'border-amber-500 bg-amber-50'
                  : 'border-gray-200 hover:border-gray-300'
              }`}
            >
              <div className="font-semibold text-gray-800 mb-1">14 dni</div>
              <div className="text-sm text-gray-600">2 tygodnie</div>
              <div className="text-xs text-gray-500 mt-1">Krótki okres</div>
            </button>
            <button
              onClick={() => handleAutoOrderAnalysisDaysChange(90)}
              disabled={saving}
              className={`p-4 rounded-lg border-2 transition text-left ${
                autoOrderAnalysisDays === 90
                  ? 'border-amber-500 bg-amber-50'
                  : 'border-gray-200 hover:border-gray-300'
              }`}
            >
              <div className="font-semibold text-gray-800 mb-1">90 dni</div>
              <div className="text-sm text-gray-600">3 miesiące</div>
              <div className="text-xs text-gray-500 mt-1">Szybka reakcja na zmiany</div>
            </button>
            <button
              onClick={() => handleAutoOrderAnalysisDaysChange(180)}
              disabled={saving}
              className={`p-4 rounded-lg border-2 transition text-left ${
                autoOrderAnalysisDays === 180
                  ? 'border-amber-500 bg-amber-50'
                  : 'border-gray-200 hover:border-gray-300'
              }`}
            >
              <div className="font-semibold text-gray-800 mb-1">180 dni</div>
              <div className="text-sm text-gray-600">6 miesięcy (domyślnie)</div>
              <div className="text-xs text-gray-500 mt-1">Zrównoważony okres</div>
            </button>
            <button
              onClick={() => handleAutoOrderAnalysisDaysChange(270)}
              disabled={saving}
              className={`p-4 rounded-lg border-2 transition text-left ${
                autoOrderAnalysisDays === 270
                  ? 'border-amber-500 bg-amber-50'
                  : 'border-gray-200 hover:border-gray-300'
              }`}
            >
              <div className="font-semibold text-gray-800 mb-1">270 dni</div>
              <div className="text-sm text-gray-600">9 miesięcy</div>
              <div className="text-xs text-gray-500 mt-1">Więcej danych historycznych</div>
            </button>
            <button
              onClick={() => handleAutoOrderAnalysisDaysChange(365)}
              disabled={saving}
              className={`p-4 rounded-lg border-2 transition text-left ${
                autoOrderAnalysisDays === 365
                  ? 'border-amber-500 bg-amber-50'
                  : 'border-gray-200 hover:border-gray-300'
              }`}
            >
              <div className="font-semibold text-gray-800 mb-1">365 dni</div>
              <div className="text-sm text-gray-600">1 rok</div>
              <div className="text-xs text-gray-500 mt-1">Pełny cykl roczny</div>
            </button>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-lg p-6">
          <div className="flex items-center gap-2 mb-4">
            <Clock className="w-5 h-5 text-amber-600" />
            <h3 className="font-semibold text-lg">Automatyczne wylogowanie</h3>
          </div>
          <p className="text-sm text-gray-600 mb-4">
            Po 15 minutach bezczynności zostaniesz automatycznie wylogowany. Wybierz gdzie chcesz wrócić po ponownym zalogowaniu:
          </p>
          <div className="space-y-3">
            <button
              onClick={() => handleAfterAutoLogoutChange('last_location')}
              disabled={saving}
              className={`w-full p-4 rounded-lg border-2 transition text-left ${
                afterAutoLogout === 'last_location'
                  ? 'border-amber-500 bg-amber-50'
                  : 'border-gray-200 hover:border-gray-300'
              }`}
            >
              <div className="flex items-center gap-3 mb-2">
                <Clock className="w-5 h-5 text-amber-600" />
                <div className="font-semibold text-gray-800">Wróć gdzie byłem (domyślnie)</div>
              </div>
              <div className="text-sm text-gray-600">Aplikacja zapamięta gdzie skończyłeś i wróci Cię tam po zalogowaniu</div>
            </button>
            <button
              onClick={() => handleAfterAutoLogoutChange('home')}
              disabled={saving}
              className={`w-full p-4 rounded-lg border-2 transition text-left ${
                afterAutoLogout === 'home'
                  ? 'border-amber-500 bg-amber-50'
                  : 'border-gray-200 hover:border-gray-300'
              }`}
            >
              <div className="flex items-center gap-3 mb-2">
                <Home className="w-5 h-5 text-amber-600" />
                <div className="font-semibold text-gray-800">Strona główna</div>
              </div>
              <div className="text-sm text-gray-600">Po zalogowaniu przejdź do ekranu głównego</div>
            </button>
            <button
              onClick={() => handleAfterAutoLogoutChange('orders')}
              disabled={saving}
              className={`w-full p-4 rounded-lg border-2 transition text-left ${
                afterAutoLogout === 'orders'
                  ? 'border-amber-500 bg-amber-50'
                  : 'border-gray-200 hover:border-gray-300'
              }`}
            >
              <div className="flex items-center gap-3 mb-2">
                <ShoppingBag className="w-5 h-5 text-amber-600" />
                <div className="font-semibold text-gray-800">Moje zamówienia</div>
              </div>
              <div className="text-sm text-gray-600">Po zalogowaniu przejdź do listy zamówień</div>
            </button>
            <button
              onClick={() => handleAfterAutoLogoutChange('prices')}
              disabled={saving}
              className={`w-full p-4 rounded-lg border-2 transition text-left ${
                afterAutoLogout === 'prices'
                  ? 'border-amber-500 bg-amber-50'
                  : 'border-gray-200 hover:border-gray-300'
              }`}
            >
              <div className="flex items-center gap-3 mb-2">
                <List className="w-5 h-5 text-amber-600" />
                <div className="font-semibold text-gray-800">Cennik</div>
              </div>
              <div className="text-sm text-gray-600">Po zalogowaniu przejdź do cennika produktów</div>
            </button>
          </div>
          <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
            <p className="text-sm text-blue-800">
              ℹ️ Zamówienia głosowe w trakcie tworzenia będą automatycznie zapisane do koszyka przed wylogowaniem
            </p>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-lg p-6">
          <div className="flex items-center gap-2 mb-4">
            <Wand2 className="w-5 h-5 text-amber-600" />
            <h3 className="font-semibold text-lg">Styl interfejsu</h3>
          </div>
          <p className="text-sm text-gray-600 mb-3">
            Wybierz styl wizualny aplikacji. Dostępnych jest 7 różnych stylów:
          </p>
          {uiTheme && (
            <div className="mb-4 p-3 bg-green-50 border border-green-200 rounded-lg">
              <div className="flex items-center justify-between">
                <div>
                  <div className="font-semibold text-green-800">Aktywny: {THEME_CONFIGS[uiTheme].name}</div>
                  <div className="text-sm text-green-600">{THEME_CONFIGS[uiTheme].description}</div>
                </div>
                <button
                  onClick={() => handleUiThemeChange(null)}
                  disabled={saving}
                  className="text-sm text-green-700 hover:text-green-900 underline disabled:opacity-50"
                >
                  Przywróć domyślny
                </button>
              </div>
            </div>
          )}
          <div className="grid grid-cols-1 gap-3">
            {(Object.entries(THEME_CONFIGS) as [ThemeStyle, typeof THEME_CONFIGS[ThemeStyle]][]).map(([key, config]) => (
              <button
                key={key}
                onClick={() => handleUiThemeChange(key)}
                disabled={saving || uiTheme === key}
                className={`p-4 rounded-lg border-2 transition text-left ${
                  uiTheme === key
                    ? 'border-green-500 bg-green-50 cursor-default'
                    : 'border-gray-200 hover:border-amber-400 hover:bg-amber-50'
                } disabled:opacity-50`}
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1">
                    <div className="font-semibold text-gray-800 mb-1">{config.name}</div>
                    <div className="text-sm text-gray-600 mb-2">{config.description}</div>
                    <div className="flex gap-1 flex-wrap">
                      {config.characteristics.map((char) => (
                        <span key={char} className="text-xs bg-gray-100 text-gray-600 px-2 py-1 rounded">
                          {char}
                        </span>
                      ))}
                    </div>
                  </div>
                  <div className="flex gap-1 flex-shrink-0">
                    <div className="w-6 h-6 rounded-full border border-gray-300" style={{ backgroundColor: config.primaryColor }}></div>
                    <div className="w-6 h-6 rounded-full border border-gray-300" style={{ backgroundColor: config.secondaryColor }}></div>
                  </div>
                </div>
              </button>
            ))}
          </div>
          <div className="mt-4">
            <a
              href="#styles-demo"
              className="block text-center text-sm text-blue-600 hover:text-blue-800 underline font-medium"
            >
              🎨 Zobacz podgląd wszystkich stylów w demo
            </a>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-lg p-6">
          <div className="flex items-center gap-2 mb-4">
            <Palette className="w-5 h-5 text-amber-600" />
            <h3 className="font-semibold text-lg">Motyw kolorystyczny</h3>
          </div>
          <p className="text-sm text-gray-600 mb-3">Wybierz swój ulubiony kolor akcentu:</p>
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
            <Settings className="w-5 h-5 text-amber-600" />
            <h3 className="font-semibold text-lg">Przyciski sortowania</h3>
          </div>
          <p className="text-sm text-gray-600 mb-3">Pokaż przyciski sortowania w cenniku:</p>
          <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
            <div className="flex items-center gap-3">
              <ListOrdered className="w-5 h-5 text-amber-600" />
              <div>
                <div className="font-semibold text-gray-800">Sortowanie produktów</div>
                <div className="text-sm text-gray-600">Wyświetlaj przyciski sortowania alfabetycznego i cenowego</div>
              </div>
            </div>
            <button
              onClick={() => handleDisplayToggle('show_sort_buttons')}
              disabled={saving}
              className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                showSortButtons ? 'bg-amber-600' : 'bg-gray-300'
              }`}
            >
              <span
                className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                  showSortButtons ? 'translate-x-6' : 'translate-x-1'
                }`}
              />
            </button>
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
            <Eye className="w-5 h-5 text-amber-600" />
            <h3 className="font-semibold text-lg">Szczegóły zamówienia</h3>
          </div>
          <p className="text-sm text-gray-600 mb-3">Domyślny stan sekcji &quot;Status i uczestnicy&quot; w szczegółach zamówienia:</p>
          <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
            <div className="flex items-center gap-3">
              <ChevronDown className="w-5 h-5 text-amber-600" />
              <div>
                <div className="font-semibold text-gray-800">Rozwiń statusy i uczestników</div>
                <div className="text-sm text-gray-600">Sekcja będzie domyślnie rozwinięta</div>
              </div>
            </div>
            <button
              onClick={handleOrderDetailsStatusExpandedToggle}
              disabled={saving}
              className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                orderDetailsStatusExpanded ? 'bg-amber-600' : 'bg-gray-300'
              }`}
            >
              <span
                className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                  orderDetailsStatusExpanded ? 'translate-x-6' : 'translate-x-1'
                }`}
              />
            </button>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-lg p-6">
          <div className="flex items-center gap-2 mb-4">
            <Edit className="w-5 h-5 text-amber-600" />
            <h3 className="font-semibold text-lg">Przyciski w notatniku</h3>
          </div>
          <div className="space-y-3">
            <p className="text-sm text-gray-600 mb-3">Dostosuj wyświetlanie przycisków w zamówieniu notatnikowym:</p>
            <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
              <div className="flex items-center gap-3">
                <Plus className="w-5 h-5 text-amber-600" />
                <div>
                  <div className="font-semibold text-gray-800">Opisy przycisków</div>
                  <div className="text-sm text-gray-600">Wyświetlaj teksty "Dodaj" i "Dalej" obok ikon</div>
                </div>
              </div>
              <button
                onClick={handleNotebookButtonLabelsToggle}
                disabled={saving}
                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                  showNotebookButtonLabels ? 'bg-amber-600' : 'bg-gray-300'
                }`}
              >
                <span
                  className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                    showNotebookButtonLabels ? 'translate-x-6' : 'translate-x-1'
                  }`}
                />
              </button>
            </div>
            <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
              <div className="flex items-center gap-3">
                <Trash2 className="w-5 h-5 text-amber-600" />
                <div>
                  <div className="font-semibold text-gray-800">Ikony kosza</div>
                  <div className="text-sm text-gray-600">Pokaż ikony kosza przy pozycjach (zamiast długiego przytrzymania)</div>
                </div>
              </div>
              <button
                onClick={handleDeleteIconsToggle}
                disabled={saving}
                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                  showDeleteIcons ? 'bg-amber-600' : 'bg-gray-300'
                }`}
              >
                <span
                  className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                    showDeleteIcons ? 'translate-x-6' : 'translate-x-1'
                  }`}
                />
              </button>
            </div>
            <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
              <div className="flex items-center gap-3">
                <Mic className="w-5 h-5 text-amber-600" />
                <div>
                  <div className="font-semibold text-gray-800">Dodawanie głosem w edycji</div>
                  <div className="text-sm text-gray-600">Wyświetlaj sekcję &quot;Dodaj głosem&quot; w edycji koszyka zamówienia</div>
                </div>
              </div>
              <button
                onClick={handleVoiceInEditDraftToggle}
                disabled={saving}
                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                  showVoiceInEditDraft ? 'bg-amber-600' : 'bg-gray-300'
                }`}
              >
                <span
                  className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                    showVoiceInEditDraft ? 'translate-x-6' : 'translate-x-1'
                  }`}
                />
              </button>
            </div>
            <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
              <div className="flex items-center gap-3">
                <Bell className="w-5 h-5 text-amber-600" />
                <div>
                  <div className="font-semibold text-gray-800">Komunikat dodawania</div>
                  <div className="text-sm text-gray-600">Wyświetlaj komunikat &quot;Dodano do notatnika&quot; przy dodawaniu produktów</div>
                </div>
              </div>
              <button
                onClick={handleShowNotebookToastToggle}
                disabled={saving}
                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                  showNotebookToast ? 'bg-amber-600' : 'bg-gray-300'
                }`}
              >
                <span
                  className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                    showNotebookToast ? 'translate-x-6' : 'translate-x-1'
                  }`}
                />
              </button>
            </div>
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
              <p className="text-sm text-gray-600 mb-3">Czy inni użytkownicy z Twojego sklepu mogą edytować Twój koszyk zamówień?</p>
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
                <div className="text-sm text-gray-600">Inni kierownicy i handlowcy z Twojego sklepu mogą edytować Twój koszyk</div>
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
                <div className="text-sm text-gray-600">Tylko Ty możesz edytować swój koszyk zamówień</div>
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
                <div className="text-sm text-gray-600">Pokazuj tylko filtry: Koszyk i Wysłane</div>
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
            <div>
              <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                <div>
                  <div className="font-semibold text-gray-800">Przyciski grupowania towarów</div>
                  <div className="text-sm text-gray-600">Pokazuj przyciski filtrowania po kategoriach</div>
                </div>
                <button
                  onClick={() => handleDisplayToggle('show_group_buttons')}
                  disabled={saving}
                  className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                    showGroupButtons ? 'bg-amber-600' : 'bg-gray-300'
                  }`}
                >
                  <span
                    className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                      showGroupButtons ? 'translate-x-6' : 'translate-x-1'
                    }`}
                  />
                </button>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-lg p-6">
          <div className="flex items-center gap-2 mb-4">
            <Sparkles className="w-5 h-5 text-amber-600" />
            <h3 className="font-semibold text-lg">Inteligentne dopasowywanie AI</h3>
          </div>
          <p className="text-sm text-gray-600 mb-4">
            Aplikacja używa lokalnego modelu AI do inteligentnego dopasowywania nazw produktów podczas dyktowania zamówień.
          </p>
          <button
            onClick={handleClearAICache}
            disabled={saving}
            className="w-full py-3 bg-blue-50 border-2 border-blue-200 text-blue-700 rounded-lg font-medium hover:bg-blue-100 transition flex items-center justify-center gap-2 disabled:opacity-50"
          >
            <Trash2 className="w-5 h-5" />
            Wyczyść pamięć podręczną AI
          </button>
          <p className="text-xs text-gray-500 mt-2">
            Użyj tej opcji jeśli AI nie działa prawidłowo. Model zostanie ponownie pobrany (~25-50MB).
          </p>
        </div>

        <div className="bg-white rounded-xl shadow-lg p-6">
          <h3 className="font-semibold text-lg mb-4">Informacje o aplikacji</h3>
          <div className="space-y-2 text-sm text-gray-600">
            <p>Wersja: 1.0.0 (Prototyp)</p>
            <p>RODEO - System Zamówień Mięsno-Wędliniarskich</p>
            <p className="text-xs text-gray-500 mt-4">
              Aplikacja umożliwia składanie i zarządzanie zamówieniami za pomocą poleceń głosowych z wykorzystaniem lokalnego AI.
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
