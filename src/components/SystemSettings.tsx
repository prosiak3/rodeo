import { useState, useEffect } from 'react';
import { Settings, Save, Users, Filter, Mail, Send, Plus, X, Clock, Mic, Volume2, TrendingUp } from 'lucide-react';
import { supabase } from '../lib/supabase';

interface SystemSettingsProps {
  userId: string;
}

interface GlobalSettings {
  default_order_mode: 'quantity' | 'list';
  default_show_all_filters: boolean;
  default_allow_collaboration: boolean;
  wholesale_emails: string[];
  session_inactive_warning_minutes: number;
  session_inactive_disconnect_minutes: number;
  session_disconnect_kill_minutes: number;
  session_max_duration_minutes: number;
  session_settings_enabled: boolean;
  default_quantity_on_add: number;
  voice_order_inactivity_timeout: number;
  show_voice_transcript_realtime: boolean;
  voice_minimum_confidence_threshold: number;
  voice_ignore_low_confidence: boolean;
}

const TIME_OPTIONS = [
  { value: 1, label: '1 minuta' },
  { value: 5, label: '5 minut' },
  { value: 15, label: '15 minut' },
  { value: 30, label: '30 minut' },
  { value: 60, label: '1 godzina' },
  { value: 180, label: '3 godziny' },
  { value: 360, label: '6 godzin' },
  { value: 480, label: '8 godzin' },
  { value: 720, label: '12 godzin' },
];

const MAX_DURATION_OPTIONS = [
  { value: 20, label: '20 minut' },
  { value: 60, label: '1 godzina' },
  { value: 180, label: '3 godziny' },
  { value: 360, label: '6 godzin' },
  { value: 480, label: '8 godzin' },
  { value: 720, label: '12 godzin' },
  { value: 1440, label: '24 godziny' },
];

const VOICE_TIMEOUT_OPTIONS = [
  { value: 30, label: '30 sekund' },
  { value: 60, label: '1 minuta' },
  { value: 300, label: '5 minut' },
];

export default function SystemSettings({ userId }: SystemSettingsProps) {
  const [settings, setSettings] = useState<GlobalSettings>({
    default_order_mode: 'quantity',
    default_show_all_filters: false,
    default_allow_collaboration: true,
    wholesale_emails: [],
    session_inactive_warning_minutes: 5,
    session_inactive_disconnect_minutes: 15,
    session_disconnect_kill_minutes: 30,
    session_max_duration_minutes: 480,
    session_settings_enabled: true,
    default_quantity_on_add: 5,
    voice_order_inactivity_timeout: 30,
    show_voice_transcript_realtime: true,
    voice_minimum_confidence_threshold: 70,
    voice_ignore_low_confidence: false,
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
          session_inactive_warning_minutes: data.session_inactive_warning_minutes || 5,
          session_inactive_disconnect_minutes: data.session_inactive_disconnect_minutes || 15,
          session_disconnect_kill_minutes: data.session_disconnect_kill_minutes || 30,
          session_max_duration_minutes: data.session_max_duration_minutes || 480,
          session_settings_enabled: data.session_settings_enabled ?? true,
          default_quantity_on_add: data.default_quantity_on_add || 5,
          voice_order_inactivity_timeout: data.voice_order_inactivity_timeout || 30,
          show_voice_transcript_realtime: data.show_voice_transcript_realtime ?? true,
          voice_minimum_confidence_threshold: data.voice_minimum_confidence_threshold || 70,
          voice_ignore_low_confidence: data.voice_ignore_low_confidence || false,
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
              <Settings className="w-5 h-5 text-amber-600" />
              <h3 className="font-semibold text-lg">Domyślna ilość produktu</h3>
            </div>
            <p className="text-sm text-gray-600 mb-3">
              Domyślna ilość produktu przy dodawaniu z cennika (może być nadpisana dla pojedynczych produktów):
            </p>
            <select
              value={settings.default_quantity_on_add}
              onChange={(e) => setSettings({ ...settings, default_quantity_on_add: parseInt(e.target.value) })}
              className="w-full p-3 border-2 border-gray-300 rounded-lg focus:border-amber-500 focus:outline-none"
            >
              <option value={1}>1</option>
              <option value={3}>3</option>
              <option value={5}>5</option>
              <option value={7}>7</option>
              <option value={10}>10</option>
            </select>
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

          <div className="bg-gray-50 rounded-lg p-4">
            <div className="flex items-center gap-2 mb-3">
              <Settings className="w-5 h-5 text-amber-600" />
              <h3 className="font-semibold text-lg">Zamówienia głosowe</h3>
            </div>
            <p className="text-sm text-gray-600 mb-3">
              Czas bezczynności przed automatycznym zatrzymaniem nagrywania:
            </p>
            <select
              value={settings.voice_order_inactivity_timeout}
              onChange={(e) => setSettings({ ...settings, voice_order_inactivity_timeout: parseInt(e.target.value) })}
              className="w-full p-3 border-2 border-gray-300 rounded-lg focus:border-amber-500 focus:outline-none"
            >
              {VOICE_TIMEOUT_OPTIONS.map(option => (
                <option key={option.value} value={option.value}>{option.label}</option>
              ))}
            </select>
            <div className="mt-3 p-3 bg-blue-50 border border-blue-200 rounded-lg">
              <p className="text-xs text-blue-800">
                <strong>Info:</strong> Jeśli użytkownik nie powie nic przez wybrany czas podczas składania zamówienia głosowego,
                nagrywanie automatycznie się zatrzyma. Dłuższy czas może być wygodny dla wolniejszych użytkowników.
              </p>
            </div>
          </div>

          <div className="bg-gray-50 rounded-lg p-4">
            <div className="flex items-center gap-2 mb-3">
              <Mic className="w-5 h-5 text-amber-600" />
              <h3 className="font-semibold text-lg">Zaawansowane ustawienia rozpoznawania głosu</h3>
            </div>
            <p className="text-sm text-gray-600 mb-4">
              Kontrola nad tym jak system przetwarza i wyświetla rozpoznawanie mowy.
            </p>

            <div className="space-y-4">
              <div className="border-2 border-gray-200 rounded-lg p-4 bg-white">
                <label className="flex items-start gap-3 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={settings.show_voice_transcript_realtime}
                    onChange={(e) => setSettings({ ...settings, show_voice_transcript_realtime: e.target.checked })}
                    className="mt-1 w-4 h-4 text-amber-600"
                  />
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <Volume2 className="w-4 h-4 text-gray-600" />
                      <span className="text-sm font-semibold text-gray-800">Pokazuj transkrypcję na żywo</span>
                    </div>
                    <p className="text-xs text-gray-600 mt-1">
                      Wyświetlaj użytkownikom tekst rozpoznany w czasie rzeczywistym podczas składania zamówienia głosowego.
                      Wyłączenie upraszcza interfejs i zmniejsza rozproszenie.
                    </p>
                  </div>
                </label>
              </div>

              <div className="border-2 border-gray-200 rounded-lg p-4 bg-white">
                <label className="flex items-start gap-3 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={settings.voice_ignore_low_confidence}
                    onChange={(e) => setSettings({ ...settings, voice_ignore_low_confidence: e.target.checked })}
                    className="mt-1 w-4 h-4 text-amber-600"
                  />
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <TrendingUp className="w-4 h-4 text-gray-600" />
                      <span className="text-sm font-semibold text-gray-800">Ignoruj niską pewność rozpoznania</span>
                    </div>
                    <p className="text-xs text-gray-600 mt-1">
                      Całkowicie zignoruj rozpoznania poniżej progu pewności (nie pokazuj nawet jako sugestii).
                      Pomaga wyeliminować przypadkowy hałas z otoczenia.
                    </p>
                  </div>
                </label>
              </div>

              <div className="border-2 border-gray-200 rounded-lg p-4 bg-white">
                <div className="mb-3">
                  <div className="flex items-center justify-between mb-2">
                    <label className="text-sm font-semibold text-gray-800">
                      Minimalny próg pewności AI
                    </label>
                    <span className="text-lg font-bold text-amber-600">
                      {settings.voice_minimum_confidence_threshold}%
                    </span>
                  </div>
                  <p className="text-xs text-gray-600 mb-3">
                    Produkty z pewnością poniżej tego progu będą wymagały potwierdzenia lub zostaną zignorowane.
                  </p>
                  <input
                    type="range"
                    min="0"
                    max="100"
                    step="5"
                    value={settings.voice_minimum_confidence_threshold}
                    onChange={(e) => setSettings({ ...settings, voice_minimum_confidence_threshold: Number(e.target.value) })}
                    className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-amber-600"
                  />
                  <div className="flex justify-between text-xs text-gray-500 mt-1">
                    <span>0% (akceptuj wszystko)</span>
                    <span>50% (balans)</span>
                    <span>100% (tylko pewne)</span>
                  </div>
                </div>

                <div className="mt-4 p-3 bg-gradient-to-r from-gray-50 to-gray-100 rounded-lg border border-gray-200">
                  <div className="flex items-center gap-2 mb-2">
                    <div className="w-full bg-gray-200 rounded-full h-3 overflow-hidden">
                      <div
                        className={`h-full transition-all ${
                          settings.voice_minimum_confidence_threshold < 50 ? 'bg-red-500' :
                          settings.voice_minimum_confidence_threshold < 70 ? 'bg-yellow-500' :
                          settings.voice_minimum_confidence_threshold < 85 ? 'bg-green-500' :
                          'bg-blue-500'
                        }`}
                        style={{ width: `${settings.voice_minimum_confidence_threshold}%` }}
                      ></div>
                    </div>
                  </div>
                  <p className="text-xs text-gray-700">
                    <strong>Rekomendacja:</strong>
                    {settings.voice_minimum_confidence_threshold < 50 && ' Bardzo niski próg - system zaakceptuje prawie wszystkie rozpoznania, w tym hałas z otoczenia.'}
                    {settings.voice_minimum_confidence_threshold >= 50 && settings.voice_minimum_confidence_threshold < 70 && ' Niski próg - system będzie częściej prosić o potwierdzenie.'}
                    {settings.voice_minimum_confidence_threshold >= 70 && settings.voice_minimum_confidence_threshold < 85 && ' Optymalny próg - dobry balans między wygodą a dokładnością.'}
                    {settings.voice_minimum_confidence_threshold >= 85 && ' Wysoki próg - system zaakceptuje tylko bardzo pewne rozpoznania. Dobre gdy system jest już dobrze wytrenowany.'}
                  </p>
                </div>
              </div>
            </div>

            <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
              <p className="text-xs text-blue-800">
                <strong>Jak to działa:</strong><br/>
                1. Użytkownik dyktuje produkty<br/>
                2. System rozpoznaje mowę i dopasowuje produkty z % pewności<br/>
                3. Jeśli pewność {'≥'} {settings.voice_minimum_confidence_threshold}% → automatyczna akceptacja<br/>
                4. Jeśli pewność {'<'} {settings.voice_minimum_confidence_threshold}% → {settings.voice_ignore_low_confidence ? 'ignoruj' : 'pokaż jako sugestię'}<br/>
                5. Transkrypcja na żywo: {settings.show_voice_transcript_realtime ? 'widoczna' : 'ukryta'}
              </p>
            </div>
          </div>

          <div className="bg-gray-50 rounded-lg p-4">
            <div className="flex items-center gap-2 mb-3">
              <Clock className="w-5 h-5 text-amber-600" />
              <h3 className="font-semibold text-lg">Zarządzanie sesjami</h3>
            </div>

            <div className="mb-4">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={settings.session_settings_enabled}
                  onChange={(e) => setSettings({ ...settings, session_settings_enabled: e.target.checked })}
                  className="w-4 h-4 text-amber-600"
                />
                <span className="text-sm font-medium text-gray-700">Włącz automatyczne zarządzanie sesjami</span>
              </label>
            </div>

            {settings.session_settings_enabled && (
              <div className="space-y-4 mt-4 pl-6 border-l-2 border-amber-200">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Ostrzeżenie o nieaktywności
                  </label>
                  <select
                    value={settings.session_inactive_warning_minutes}
                    onChange={(e) => setSettings({ ...settings, session_inactive_warning_minutes: Number(e.target.value) })}
                    className="w-full p-2 border-2 border-gray-300 rounded-lg focus:border-amber-500 focus:outline-none"
                  >
                    {TIME_OPTIONS.map(option => (
                      <option key={option.value} value={option.value}>{option.label}</option>
                    ))}
                  </select>
                  <p className="text-xs text-gray-500 mt-1">Czas nieaktywności przed pokazaniem ostrzeżenia</p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Rozłączenie po nieaktywności
                  </label>
                  <select
                    value={settings.session_inactive_disconnect_minutes}
                    onChange={(e) => setSettings({ ...settings, session_inactive_disconnect_minutes: Number(e.target.value) })}
                    className="w-full p-2 border-2 border-gray-300 rounded-lg focus:border-amber-500 focus:outline-none"
                  >
                    {TIME_OPTIONS.map(option => (
                      <option key={option.value} value={option.value}>{option.label}</option>
                    ))}
                  </select>
                  <p className="text-xs text-gray-500 mt-1">Czas nieaktywności przed rozłączeniem sesji</p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Ostateczne zakończenie rozłączonej sesji
                  </label>
                  <select
                    value={settings.session_disconnect_kill_minutes}
                    onChange={(e) => setSettings({ ...settings, session_disconnect_kill_minutes: Number(e.target.value) })}
                    className="w-full p-2 border-2 border-gray-300 rounded-lg focus:border-amber-500 focus:outline-none"
                  >
                    {TIME_OPTIONS.map(option => (
                      <option key={option.value} value={option.value}>{option.label}</option>
                    ))}
                  </select>
                  <p className="text-xs text-gray-500 mt-1">Czas po rozłączeniu przed ostatecznym zabiciem sesji</p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Maksymalny czas sesji (nawet jeśli aktywna)
                  </label>
                  <select
                    value={settings.session_max_duration_minutes}
                    onChange={(e) => setSettings({ ...settings, session_max_duration_minutes: Number(e.target.value) })}
                    className="w-full p-2 border-2 border-gray-300 rounded-lg focus:border-amber-500 focus:outline-none"
                  >
                    {MAX_DURATION_OPTIONS.map(option => (
                      <option key={option.value} value={option.value}>{option.label}</option>
                    ))}
                  </select>
                  <p className="text-xs text-gray-500 mt-1">Maksymalny czas trwania sesji, nawet jeśli użytkownik jest aktywny</p>
                </div>

                <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
                  <p className="text-xs text-blue-800">
                    <strong>Schemat działania:</strong><br/>
                    1. Po {settings.session_inactive_warning_minutes} min nieaktywności → Ostrzeżenie<br/>
                    2. Po {settings.session_inactive_disconnect_minutes} min nieaktywności → Rozłączenie<br/>
                    3. Po {settings.session_disconnect_kill_minutes} min od rozłączenia → Usunięcie sesji<br/>
                    4. Po {settings.session_max_duration_minutes} min od startu → Wymuszenie końca sesji
                  </p>
                </div>
              </div>
            )}
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
