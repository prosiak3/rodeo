import { useState, useEffect } from 'react';
import { Settings, Save, Users, Filter, Mail, Send } from 'lucide-react';
import { supabase } from '../lib/supabase';

interface SystemSettingsProps {
  userId: string;
}

interface GlobalSettings {
  default_order_mode: 'quantity' | 'list';
  default_show_all_filters: boolean;
  default_allow_collaboration: boolean;
  wholesale_email: string;
}

export default function SystemSettings({ userId }: SystemSettingsProps) {
  const [settings, setSettings] = useState<GlobalSettings>({
    default_order_mode: 'quantity',
    default_show_all_filters: false,
    default_allow_collaboration: true,
    wholesale_email: '',
  });
  const [testingEmail, setTestingEmail] = useState(false);
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('system_settings')
        .select('*')
        .single();

      if (error && error.code !== 'PGRST116') {
        throw error;
      }

      if (data) {
        setSettings({
          default_order_mode: data.default_order_mode || 'quantity',
          default_show_all_filters: data.default_show_all_filters || false,
          default_allow_collaboration: data.default_allow_collaboration ?? true,
          wholesale_email: data.wholesale_email || '',
        });
      }
    } catch (error) {
      console.error('Error loading settings:', error);
    } finally {
      setLoading(false);
    }
  };

  const saveSettings = async () => {
    if (settings.wholesale_email && !isValidEmail(settings.wholesale_email)) {
      alert('Podaj prawidłowy adres email hurtowni');
      return;
    }

    setSaving(true);
    try {
      const { data: existing } = await supabase
        .from('system_settings')
        .select('id')
        .single();

      if (existing) {
        const { error } = await supabase
          .from('system_settings')
          .update(settings)
          .eq('id', existing.id);

        if (error) throw error;
      } else {
        const { error } = await supabase
          .from('system_settings')
          .insert([settings]);

        if (error) throw error;
      }

      alert('Ustawienia systemowe zapisane!');
    } catch (error) {
      console.error('Error saving settings:', error);
      alert('Błąd podczas zapisywania ustawień');
    } finally {
      setSaving(false);
    }
  };

  const isValidEmail = (email: string): boolean => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  const testEmailConfiguration = async () => {
    if (!settings.wholesale_email) {
      alert('Najpierw zapisz adres email hurtowni');
      return;
    }

    if (!isValidEmail(settings.wholesale_email)) {
      alert('Podaj prawidłowy adres email');
      return;
    }

    setTestingEmail(true);
    try {
      alert(`Funkcja testowa wysyłki emaila zostanie dodana po skonfigurowaniu klucza API Resend.\n\nAdres docelowy: ${settings.wholesale_email}`);
    } catch (error) {
      console.error('Error testing email:', error);
      alert('Błąd podczas testowania emaila');
    } finally {
      setTestingEmail(false);
    }
  };

  const applyToAllUsers = async () => {
    if (!confirm('Czy na pewno chcesz zastosować te ustawienia do wszystkich użytkowników? To nadpisze ich indywidualne preferencje.')) {
      return;
    }

    setSaving(true);
    try {
      const { error } = await supabase
        .from('users')
        .update({
          order_mode: settings.default_order_mode,
          show_all_order_filters: settings.default_show_all_filters,
          allow_collaborative_editing: settings.default_allow_collaboration,
        })
        .neq('id', '00000000-0000-0000-0000-000000000000');

      if (error) throw error;

      alert('Ustawienia zostały zastosowane do wszystkich użytkowników!');
    } catch (error) {
      console.error('Error applying settings:', error);
      alert('Błąd podczas stosowania ustawień');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-amber-600"></div>
      </div>
    );
  }

  console.log('[SystemSettings] Rendering with settings:', settings);
  console.log('[SystemSettings] wholesale_email:', settings.wholesale_email);

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="bg-white rounded-xl shadow-lg p-6">
        <div className="flex items-center gap-3 mb-6">
          <Settings className="w-6 h-6 text-amber-600" />
          <h2 className="text-2xl font-bold text-gray-800">Ustawienia systemowe</h2>
        </div>
        <p className="text-sm text-gray-600 mb-6">
          Te ustawienia będą domyślnymi wartościami dla nowych użytkowników. Możesz również zastosować je do wszystkich istniejących użytkowników.
        </p>

        <div className="space-y-6">
          <div className="bg-gray-50 rounded-lg p-4" style={{ border: '3px solid red' }}>
            <div className="flex items-center gap-2 mb-3">
              <Mail className="w-5 h-5 text-amber-600" />
              <h3 className="font-semibold text-lg">Email hurtowni</h3>
            </div>
            <p className="text-sm text-gray-600 mb-3">
              Adres email, na który będą wysyłane wszystkie zamówienia ze sklepów:
            </p>
            <div className="space-y-3">
              <input
                type="email"
                value={settings.wholesale_email}
                onChange={(e) => setSettings({ ...settings, wholesale_email: e.target.value })}
                placeholder="hurtownia@example.com"
                className="w-full p-3 border-2 border-gray-300 rounded-lg focus:border-amber-500 focus:outline-none"
              />
              <button
                onClick={testEmailConfiguration}
                disabled={testingEmail || !settings.wholesale_email}
                className="w-full py-2 bg-blue-50 border-2 border-blue-200 text-blue-700 rounded-lg font-medium hover:bg-blue-100 transition flex items-center justify-center gap-2 disabled:opacity-50"
              >
                <Send className="w-4 h-4" />
                {testingEmail ? 'Testowanie...' : 'Testuj konfigurację email'}
              </button>
              <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
                <p className="text-sm text-blue-800">
                  <strong>Info:</strong> Wszystkie zamówienia będą automatycznie wysyłane na ten adres email po zmianie statusu na "Wysłane".
                </p>
              </div>
            </div>
          </div>

          <div className="bg-gray-50 rounded-lg p-4">
            <div className="flex items-center gap-2 mb-3">
              <Settings className="w-5 h-5 text-amber-600" />
              <h3 className="font-semibold text-lg">Tryb zamawiania z cennika</h3>
            </div>
            <p className="text-sm text-gray-600 mb-3">Domyślny sposób składania zamówień:</p>
            <div className="space-y-2">
              <button
                onClick={() => setSettings({ ...settings, default_order_mode: 'quantity' })}
                className={`w-full p-3 rounded-lg border-2 transition text-left ${
                  settings.default_order_mode === 'quantity'
                    ? 'border-amber-500 bg-amber-50'
                    : 'border-gray-200 hover:border-gray-300'
                }`}
              >
                <div className="font-semibold text-gray-800">Z cennika ilości</div>
                <div className="text-sm text-gray-600">Dodajesz produkt z ilością od razu i wysyłasz</div>
              </button>
              <button
                onClick={() => setSettings({ ...settings, default_order_mode: 'list' })}
                className={`w-full p-3 rounded-lg border-2 transition text-left ${
                  settings.default_order_mode === 'list'
                    ? 'border-amber-500 bg-amber-50'
                    : 'border-gray-200 hover:border-gray-300'
                }`}
              >
                <div className="font-semibold text-gray-800">Z cennika lista</div>
                <div className="text-sm text-gray-600">Budujesz listę produktów, potem podajesz ilości i zapisujesz jako szkic</div>
              </button>
            </div>
          </div>

          <div className="bg-gray-50 rounded-lg p-4">
            <div className="flex items-center gap-2 mb-3">
              <Filter className="w-5 h-5 text-amber-600" />
              <h3 className="font-semibold text-lg">Filtry zamówień</h3>
            </div>
            <p className="text-sm text-gray-600 mb-3">Domyślny widok filtrów dla kierowników:</p>
            <div className="space-y-2">
              <button
                onClick={() => setSettings({ ...settings, default_show_all_filters: false })}
                className={`w-full p-3 rounded-lg border-2 transition text-left ${
                  !settings.default_show_all_filters
                    ? 'border-amber-500 bg-amber-50'
                    : 'border-gray-200 hover:border-gray-300'
                }`}
              >
                <div className="font-semibold text-gray-800">Uproszczony widok</div>
                <div className="text-sm text-gray-600">Pokazuj tylko filtry: Szkice i Wysłane</div>
              </button>
              <button
                onClick={() => setSettings({ ...settings, default_show_all_filters: true })}
                className={`w-full p-3 rounded-lg border-2 transition text-left ${
                  settings.default_show_all_filters
                    ? 'border-amber-500 bg-amber-50'
                    : 'border-gray-200 hover:border-gray-300'
                }`}
              >
                <div className="font-semibold text-gray-800">Wszystkie filtry</div>
                <div className="text-sm text-gray-600">Pokazuj wszystkie statusy zamówień</div>
              </button>
            </div>
          </div>

          <div className="bg-gray-50 rounded-lg p-4">
            <div className="flex items-center gap-2 mb-3">
              <Users className="w-5 h-5 text-amber-600" />
              <h3 className="font-semibold text-lg">Współdzielenie edycji szkiców</h3>
            </div>
            <p className="text-sm text-gray-600 mb-3">Domyślne ustawienie współpracy przy edycji zamówień:</p>
            <div className="space-y-2">
              <button
                onClick={() => setSettings({ ...settings, default_allow_collaboration: true })}
                className={`w-full p-3 rounded-lg border-2 transition text-left ${
                  settings.default_allow_collaboration
                    ? 'border-amber-500 bg-amber-50'
                    : 'border-gray-200 hover:border-gray-300'
                }`}
              >
                <div className="font-semibold text-gray-800">✅ Włączone</div>
                <div className="text-sm text-gray-600">Użytkownicy mogą domyślnie edytować szkice kolegów z tego samego sklepu</div>
              </button>
              <button
                onClick={() => setSettings({ ...settings, default_allow_collaboration: false })}
                className={`w-full p-3 rounded-lg border-2 transition text-left ${
                  !settings.default_allow_collaboration
                    ? 'border-amber-500 bg-amber-50'
                    : 'border-gray-200 hover:border-gray-300'
                }`}
              >
                <div className="font-semibold text-gray-800">❌ Wyłączone</div>
                <div className="text-sm text-gray-600">Tylko twórca może edytować swoje szkice (zwiększa prywatność)</div>
              </button>
            </div>
          </div>
        </div>

        <div className="mt-6 space-y-3">
          <button
            onClick={saveSettings}
            disabled={saving}
            className="w-full py-3 bg-gradient-to-r from-amber-500 to-orange-600 text-white rounded-lg font-medium hover:from-amber-600 hover:to-orange-700 transition flex items-center justify-center gap-2 shadow-lg disabled:opacity-50"
          >
            <Save className="w-5 h-5" />
            {saving ? 'Zapisywanie...' : 'Zapisz ustawienia domyślne'}
          </button>

          <button
            onClick={applyToAllUsers}
            disabled={saving}
            className="w-full py-3 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition flex items-center justify-center gap-2 shadow disabled:opacity-50"
          >
            <Users className="w-5 h-5" />
            {saving ? 'Stosowanie...' : 'Zastosuj do wszystkich użytkowników'}
          </button>
        </div>

        <div className="mt-4 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
          <p className="text-sm text-yellow-800">
            <strong>Uwaga:</strong> Przycisk "Zastosuj do wszystkich użytkowników" nadpisze indywidualne preferencje wszystkich użytkowników w systemie.
          </p>
        </div>
      </div>
    </div>
  );
}
