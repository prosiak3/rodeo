import { useState, useEffect } from 'react';
import { Settings, Save, Users, Filter, Mail, Send, Plus, X } from 'lucide-react';
import { supabase } from '../lib/supabase';

interface SystemSettingsProps {
  userId: string;
}

interface GlobalSettings {
  default_order_mode: 'quantity' | 'list';
  default_show_all_filters: boolean;
  default_allow_collaboration: boolean;
  wholesale_emails: string[];
}

export default function SystemSettings({ userId }: SystemSettingsProps) {
  const [settings, setSettings] = useState<GlobalSettings>({
    default_order_mode: 'quantity',
    default_show_all_filters: false,
    default_allow_collaboration: true,
    wholesale_emails: [],
  });
  const [newEmail, setNewEmail] = useState('');
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
          wholesale_emails: data.wholesale_emails || [],
        });
      }
    } catch (error) {
      console.error('Error loading settings:', error);
    } finally {
      setLoading(false);
    }
  };

  const saveSettings = async () => {
    // Waliduj wszystkie adresy email
    for (const email of settings.wholesale_emails) {
      if (!isValidEmail(email)) {
        alert(`Nieprawidłowy adres email: ${email}`);
        return;
      }
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

  const addEmail = () => {
    const email = newEmail.trim();
    if (!email) return;

    if (!isValidEmail(email)) {
      alert('Niepoprawny format adresu email');
      return;
    }

    if (settings.wholesale_emails.includes(email)) {
      alert('Ten adres email już istnieje na liście');
      return;
    }

    setSettings({
      ...settings,
      wholesale_emails: [...settings.wholesale_emails, email],
    });
    setNewEmail('');
  };

  const removeEmail = (emailToRemove: string) => {
    setSettings({
      ...settings,
      wholesale_emails: settings.wholesale_emails.filter(e => e !== emailToRemove),
    });
  };

  const testEmailConfiguration = async () => {
    if (settings.wholesale_emails.length === 0) {
      alert('Najpierw dodaj przynajmniej jeden adres email hurtowni');
      return;
    }

    setTestingEmail(true);
    try {
      // Call the edge function to send test email
      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/send-order-email`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`,
          },
          body: JSON.stringify({
            test: true,
            to: settings.wholesale_emails,
            subject: '🧪 Test konfiguracji email - System Rodeo',
            message: 'To jest testowa wiadomość z systemu Rodeo. Jeśli widzisz tę wiadomość, konfiguracja email działa prawidłowo!',
          }),
        }
      );

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || 'Błąd podczas wysyłania emaila');
      }

      alert(`✅ Email testowy został wysłany na ${settings.wholesale_emails.length} adres${settings.wholesale_emails.length === 1 ? '' : settings.wholesale_emails.length < 5 ? 'y' : 'ów'}:\n\n${settings.wholesale_emails.join('\n')}\n\nSprawdź skrzynki pocztowe (również foldery spam).`);
    } catch (error) {
      console.error('Error testing email:', error);
      alert(`❌ Błąd podczas wysyłania emaila testowego:\n\n${error instanceof Error ? error.message : 'Nieznany błąd'}\n\nUpewnij się że klucz API Resend jest skonfigurowany w ustawieniach Supabase Edge Functions.`);
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
          <div className="bg-gray-50 rounded-lg p-4">
            <div className="flex items-center gap-2 mb-3">
              <Mail className="w-5 h-5 text-amber-600" />
              <h3 className="font-semibold text-lg">Adresy Email Hurtowni</h3>
            </div>
            <p className="text-sm text-gray-600 mb-3">
              Adresy email, na które będą wysyłane wszystkie zamówienia ze sklepów:
            </p>
            <div className="space-y-3">
              <div className="flex gap-2">
                <input
                  type="email"
                  value={newEmail}
                  onChange={(e) => setNewEmail(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && addEmail()}
                  placeholder="nowy@email.com"
                  className="flex-1 p-3 border-2 border-gray-300 rounded-lg focus:border-amber-500 focus:outline-none"
                />
                <button
                  onClick={addEmail}
                  className="px-4 py-3 bg-amber-600 text-white rounded-lg font-medium hover:bg-amber-700 transition flex items-center gap-2"
                >
                  <Plus className="w-4 h-4" />
                  Dodaj
                </button>
              </div>

              {settings.wholesale_emails.length > 0 && (
                <div className="space-y-2">
                  <p className="text-sm font-medium text-gray-700">
                    Lista adresów ({settings.wholesale_emails.length}):
                  </p>
                  {settings.wholesale_emails.map((email, index) => (
                    <div
                      key={index}
                      className="flex items-center justify-between bg-white p-3 rounded-lg border-2 border-gray-200"
                    >
                      <div className="flex items-center gap-2">
                        <Mail className="w-4 h-4 text-gray-400" />
                        <span className="text-sm text-gray-700">{email}</span>
                      </div>
                      <button
                        onClick={() => removeEmail(email)}
                        className="p-1.5 text-red-600 hover:bg-red-50 rounded transition"
                        title="Usuń adres"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  ))}
                </div>
              )}

              {settings.wholesale_emails.length === 0 && (
                <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg text-center">
                  <p className="text-sm text-yellow-800">
                    Brak adresów email. Dodaj przynajmniej jeden adres powyżej.
                  </p>
                </div>
              )}

              <button
                onClick={testEmailConfiguration}
                disabled={testingEmail || settings.wholesale_emails.length === 0}
                className="w-full py-2 bg-blue-50 border-2 border-blue-200 text-blue-700 rounded-lg font-medium hover:bg-blue-100 transition flex items-center justify-center gap-2 disabled:opacity-50"
              >
                <Send className="w-4 h-4" />
                {testingEmail ? 'Testowanie...' : `Testuj wysyłkę (${settings.wholesale_emails.length} ${settings.wholesale_emails.length === 1 ? 'adres' : settings.wholesale_emails.length < 5 ? 'adresy' : 'adresów'})`}
              </button>
              <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
                <p className="text-sm text-blue-800">
                  <strong>Info:</strong> Wszystkie zamówienia będą automatycznie wysyłane na te adresy email po zmianie statusu na "Wysłane".
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
