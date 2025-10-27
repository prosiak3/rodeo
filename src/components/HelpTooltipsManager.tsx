import { useState, useEffect } from 'react';
import { HelpCircle, Plus, Edit2, Trash2, Eye, EyeOff, Search, Save, X, BarChart3, FileDown, FileUp } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { showAlert } from '../lib/alerts';
import { useConfirm } from '../hooks/useConfirm';
import HelpTooltip from './HelpTooltip';

interface HelpContent {
  id: string;
  tooltip_id: string;
  title: string | null;
  content: string;
  component_name: string;
  category: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

interface TooltipStats {
  tooltip_id: string;
  total_views: number;
  unique_users: number;
  last_viewed: string;
}

export default function HelpTooltipsManager() {
  const { confirm, ConfirmComponent } = useConfirm();
  const [tooltips, setTooltips] = useState<HelpContent[]>([]);
  const [stats, setStats] = useState<Map<string, TooltipStats>>(new Map());
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [showInactive, setShowInactive] = useState(false);
  const [editingTooltip, setEditingTooltip] = useState<HelpContent | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [showStats, setShowStats] = useState(false);
  const [formData, setFormData] = useState({
    tooltip_id: '',
    title: '',
    content: '',
    component_name: '',
    category: 'general',
    is_active: true,
  });

  const categories = [
    { value: 'all', label: 'Wszystkie' },
    { value: 'orders', label: 'Zamówienia' },
    { value: 'products', label: 'Produkty' },
    { value: 'promotions', label: 'Promocje' },
    { value: 'settings', label: 'Ustawienia' },
    { value: 'analytics', label: 'Analityka' },
    { value: 'general', label: 'Ogólne' },
  ];

  useEffect(() => {
    loadTooltips();
    loadStats();
  }, []);

  const loadTooltips = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('help_content')
        .select('*')
        .order('component_name', { ascending: true })
        .order('tooltip_id', { ascending: true });

      if (error) throw error;

      setTooltips(data || []);
    } catch (error) {
      console.error('Error loading tooltips:', error);
      showAlert('Błąd podczas wczytywania podpowiedzi');
    } finally {
      setLoading(false);
    }
  };

  const loadStats = async () => {
    try {
      const { data, error } = await supabase
        .from('help_tooltip_views')
        .select('tooltip_id, view_count, user_id, last_viewed_at');

      if (error) throw error;

      const statsMap = new Map<string, TooltipStats>();

      (data || []).forEach(view => {
        const existing = statsMap.get(view.tooltip_id);
        if (existing) {
          existing.total_views += view.view_count;
          existing.unique_users += 1;
          if (new Date(view.last_viewed_at) > new Date(existing.last_viewed)) {
            existing.last_viewed = view.last_viewed_at;
          }
        } else {
          statsMap.set(view.tooltip_id, {
            tooltip_id: view.tooltip_id,
            total_views: view.view_count,
            unique_users: 1,
            last_viewed: view.last_viewed_at,
          });
        }
      });

      setStats(statsMap);
    } catch (error) {
      console.error('Error loading stats:', error);
    }
  };

  const handleSave = async () => {
    if (!formData.tooltip_id || !formData.content || !formData.component_name) {
      showAlert('Wypełnij wszystkie wymagane pola');
      return;
    }

    try {
      if (editingTooltip) {
        const { error } = await supabase
          .from('help_content')
          .update({
            title: formData.title || null,
            content: formData.content,
            component_name: formData.component_name,
            category: formData.category,
            is_active: formData.is_active,
          })
          .eq('id', editingTooltip.id);

        if (error) throw error;
        showAlert('Podpowiedź została zaktualizowana');
      } else {
        const { error } = await supabase
          .from('help_content')
          .insert([formData]);

        if (error) throw error;
        showAlert('Podpowiedź została dodana');
      }

      loadTooltips();
      handleCancel();
    } catch (error: any) {
      console.error('Error saving tooltip:', error);
      if (error.code === '23505') {
        showAlert('Podpowiedź o tym ID już istnieje');
      } else {
        showAlert('Błąd podczas zapisywania');
      }
    }
  };

  const handleEdit = (tooltip: HelpContent) => {
    setEditingTooltip(tooltip);
    setFormData({
      tooltip_id: tooltip.tooltip_id,
      title: tooltip.title || '',
      content: tooltip.content,
      component_name: tooltip.component_name,
      category: tooltip.category,
      is_active: tooltip.is_active,
    });
    setShowForm(true);
  };

  const handleDelete = async (tooltip: HelpContent) => {
    const confirmed = await confirm(
      `Czy na pewno chcesz usunąć podpowiedź "${tooltip.tooltip_id}"? Spowoduje to również usunięcie wszystkich statystyk.`,
      'Usuń podpowiedź'
    );

    if (!confirmed) return;

    try {
      const { error } = await supabase
        .from('help_content')
        .delete()
        .eq('id', tooltip.id);

      if (error) throw error;

      showAlert('Podpowiedź została usunięta');
      loadTooltips();
      loadStats();
    } catch (error) {
      console.error('Error deleting tooltip:', error);
      showAlert('Błąd podczas usuwania');
    }
  };

  const toggleActive = async (tooltip: HelpContent) => {
    try {
      const { error } = await supabase
        .from('help_content')
        .update({ is_active: !tooltip.is_active })
        .eq('id', tooltip.id);

      if (error) throw error;

      loadTooltips();
    } catch (error) {
      console.error('Error toggling active:', error);
      showAlert('Błąd podczas zmiany statusu');
    }
  };

  const handleCancel = () => {
    setShowForm(false);
    setEditingTooltip(null);
    setFormData({
      tooltip_id: '',
      title: '',
      content: '',
      component_name: '',
      category: 'general',
      is_active: true,
    });
  };

  const handleExport = () => {
    const dataStr = JSON.stringify(tooltips, null, 2);
    const dataBlob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(dataBlob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `help-tooltips-${new Date().toISOString().split('T')[0]}.json`;
    link.click();
    URL.revokeObjectURL(url);
  };

  const handleImport = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    try {
      const text = await file.text();
      const importedTooltips = JSON.parse(text);

      const confirmed = await confirm(
        `Czy chcesz zaimportować ${importedTooltips.length} podpowiedzi? Istniejące podpowiedzi z tymi samymi ID zostaną zaktualizowane.`,
        'Import podpowiedzi'
      );

      if (!confirmed) return;

      for (const tooltip of importedTooltips) {
        const { id, created_at, updated_at, ...data } = tooltip;

        const { error } = await supabase
          .from('help_content')
          .upsert(data, { onConflict: 'tooltip_id' });

        if (error) throw error;
      }

      showAlert('Podpowiedzi zostały zaimportowane');
      loadTooltips();
    } catch (error) {
      console.error('Error importing tooltips:', error);
      showAlert('Błąd podczas importu');
    }
  };

  const filteredTooltips = tooltips.filter(tooltip => {
    const matchesSearch =
      tooltip.tooltip_id.toLowerCase().includes(searchTerm.toLowerCase()) ||
      tooltip.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      tooltip.content.toLowerCase().includes(searchTerm.toLowerCase()) ||
      tooltip.component_name.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesCategory = selectedCategory === 'all' || tooltip.category === selectedCategory;
    const matchesActive = showInactive || tooltip.is_active;

    return matchesSearch && matchesCategory && matchesActive;
  });

  return (
    <div className="space-y-6">
      <ConfirmComponent />

      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <HelpCircle className="w-6 h-6 text-gray-600" />
          <h2 className="text-2xl font-bold text-gray-800">Zarządzanie podpowiedziami</h2>
          <HelpTooltip
            tooltipId="help-tooltips-manager-info"
            content="Tutaj możesz zarządzać wszystkimi podpowiedziami w systemie. Podpowiedzi pomagają użytkownikom zrozumieć funkcje aplikacji."
          />
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => setShowStats(!showStats)}
            className="flex items-center gap-2 px-4 py-2 bg-blue-50 text-blue-700 rounded-lg hover:bg-blue-100 transition"
          >
            <BarChart3 className="w-4 h-4" />
            {showStats ? 'Ukryj' : 'Pokaż'} statystyki
          </button>
          <button
            onClick={handleExport}
            className="flex items-center gap-2 px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition"
          >
            <FileDown className="w-4 h-4" />
            Eksportuj
          </button>
          <label className="flex items-center gap-2 px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition cursor-pointer">
            <FileUp className="w-4 h-4" />
            Importuj
            <input
              type="file"
              accept=".json"
              onChange={handleImport}
              className="hidden"
            />
          </label>
          <button
            onClick={() => setShowForm(true)}
            className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-amber-500 to-orange-600 text-white rounded-lg hover:from-amber-600 hover:to-orange-700 transition"
          >
            <Plus className="w-4 h-4" />
            Dodaj podpowiedź
          </button>
        </div>
      </div>

      {showStats && (
        <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
          <h3 className="font-semibold text-lg mb-4">Statystyki użycia</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-blue-50 rounded-lg p-4">
              <div className="text-sm text-blue-600 font-medium">Łącznie podpowiedzi</div>
              <div className="text-3xl font-bold text-blue-900">{tooltips.length}</div>
            </div>
            <div className="bg-green-50 rounded-lg p-4">
              <div className="text-sm text-green-600 font-medium">Aktywne</div>
              <div className="text-3xl font-bold text-green-900">
                {tooltips.filter(t => t.is_active).length}
              </div>
            </div>
            <div className="bg-purple-50 rounded-lg p-4">
              <div className="text-sm text-purple-600 font-medium">Łączne wyświetlenia</div>
              <div className="text-3xl font-bold text-purple-900">
                {Array.from(stats.values()).reduce((sum, s) => sum + s.total_views, 0)}
              </div>
            </div>
          </div>
        </div>
      )}

      <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
        <div className="flex flex-col md:flex-row gap-4 mb-6">
          <div className="flex-1">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="text"
                placeholder="Szukaj po ID, tytule, treści lub komponencie..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent"
              />
            </div>
          </div>
          <select
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent"
          >
            {categories.map(cat => (
              <option key={cat.value} value={cat.value}>{cat.label}</option>
            ))}
          </select>
          <button
            onClick={() => setShowInactive(!showInactive)}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg transition ${
              showInactive
                ? 'bg-amber-100 text-amber-700'
                : 'bg-gray-100 text-gray-700'
            }`}
          >
            {showInactive ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
            {showInactive ? 'Wszystkie' : 'Tylko aktywne'}
          </button>
        </div>

        {loading ? (
          <div className="text-center py-12 text-gray-500">Ładowanie...</div>
        ) : filteredTooltips.length === 0 ? (
          <div className="text-center py-12 text-gray-500">
            Nie znaleziono podpowiedzi
          </div>
        ) : (
          <div className="space-y-3">
            {filteredTooltips.map(tooltip => {
              const tooltipStats = stats.get(tooltip.tooltip_id);
              return (
                <div
                  key={tooltip.id}
                  className={`border rounded-lg p-4 ${
                    tooltip.is_active
                      ? 'border-gray-200 bg-white'
                      : 'border-gray-300 bg-gray-50 opacity-60'
                  }`}
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <code className="px-2 py-1 bg-gray-100 text-gray-800 text-sm rounded font-mono">
                          {tooltip.tooltip_id}
                        </code>
                        <span className="px-2 py-1 bg-blue-100 text-blue-700 text-xs rounded">
                          {categories.find(c => c.value === tooltip.category)?.label || tooltip.category}
                        </span>
                        <span className="text-sm text-gray-500">
                          {tooltip.component_name}
                        </span>
                      </div>
                      {tooltip.title && (
                        <h4 className="font-semibold text-gray-800 mb-1">{tooltip.title}</h4>
                      )}
                      <p className="text-sm text-gray-600 line-clamp-2">{tooltip.content}</p>
                      {tooltipStats && showStats && (
                        <div className="flex gap-4 mt-2 text-xs text-gray-500">
                          <span>👁️ {tooltipStats.total_views} wyświetleń</span>
                          <span>👥 {tooltipStats.unique_users} użytkowników</span>
                          <span>🕐 Ostatnio: {new Date(tooltipStats.last_viewed).toLocaleDateString()}</span>
                        </div>
                      )}
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => toggleActive(tooltip)}
                        className={`p-2 rounded-lg transition ${
                          tooltip.is_active
                            ? 'bg-green-100 text-green-700 hover:bg-green-200'
                            : 'bg-gray-200 text-gray-500 hover:bg-gray-300'
                        }`}
                        title={tooltip.is_active ? 'Dezaktywuj' : 'Aktywuj'}
                      >
                        {tooltip.is_active ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
                      </button>
                      <button
                        onClick={() => handleEdit(tooltip)}
                        className="p-2 bg-blue-100 text-blue-700 rounded-lg hover:bg-blue-200 transition"
                        title="Edytuj"
                      >
                        <Edit2 className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleDelete(tooltip)}
                        className="p-2 bg-red-100 text-red-700 rounded-lg hover:bg-red-200 transition"
                        title="Usuń"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {showForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black bg-opacity-50">
          <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between p-6 border-b border-gray-200 sticky top-0 bg-white">
              <h3 className="text-xl font-bold text-gray-800">
                {editingTooltip ? 'Edytuj podpowiedź' : 'Nowa podpowiedź'}
              </h3>
              <button
                onClick={handleCancel}
                className="text-gray-400 hover:text-gray-600 transition"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            <div className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  ID podpowiedzi <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={formData.tooltip_id}
                  onChange={(e) => setFormData({ ...formData, tooltip_id: e.target.value })}
                  disabled={!!editingTooltip}
                  placeholder="np. voice-order-mic-button"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent disabled:bg-gray-100"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Tytuł (opcjonalnie)
                </label>
                <input
                  type="text"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  placeholder="np. Zamówienie głosowe"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Treść <span className="text-red-500">*</span>
                </label>
                <textarea
                  value={formData.content}
                  onChange={(e) => setFormData({ ...formData, content: e.target.value })}
                  placeholder="Opis funkcji..."
                  rows={4}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent resize-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Komponent <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={formData.component_name}
                    onChange={(e) => setFormData({ ...formData, component_name: e.target.value })}
                    placeholder="np. VoiceOrderScreen"
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Kategoria <span className="text-red-500">*</span>
                  </label>
                  <select
                    value={formData.category}
                    onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent"
                  >
                    {categories.filter(c => c.value !== 'all').map(cat => (
                      <option key={cat.value} value={cat.value}>{cat.label}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="is_active"
                  checked={formData.is_active}
                  onChange={(e) => setFormData({ ...formData, is_active: e.target.checked })}
                  className="w-4 h-4 text-amber-600 border-gray-300 rounded focus:ring-amber-500"
                />
                <label htmlFor="is_active" className="text-sm text-gray-700">
                  Aktywna (widoczna dla użytkowników)
                </label>
              </div>
            </div>

            <div className="flex gap-3 p-6 border-t border-gray-200">
              <button
                onClick={handleCancel}
                className="flex-1 px-6 py-3 bg-gray-100 text-gray-700 rounded-xl font-medium hover:bg-gray-200 transition"
              >
                Anuluj
              </button>
              <button
                onClick={handleSave}
                className="flex-1 px-6 py-3 bg-gradient-to-r from-amber-500 to-orange-600 text-white rounded-xl font-medium hover:from-amber-600 hover:to-orange-700 transition flex items-center justify-center gap-2"
              >
                <Save className="w-4 h-4" />
                Zapisz
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
