import { useState } from 'react';
import { Plus, Edit, Trash2, Save, X, FileText, Code, Bug, Zap, Shield, Calendar, ChevronDown, ChevronUp } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { showAlert } from '../lib/alerts';

interface ChangelogEntry {
  id: string;
  version: string;
  title: string;
  description: string;
  category: 'feature' | 'improvement' | 'bugfix' | 'breaking' | 'security';
  file_references: string[];
  release_date: string;
  order_index: number;
  created_at: string;
  updated_at: string;
}

interface ChangelogPanelProps {
  entries: ChangelogEntry[];
  isAdmin: boolean;
  onUpdate: () => void;
}

export default function ChangelogPanel({ entries, isAdmin, onUpdate }: ChangelogPanelProps) {
  const [editingEntry, setEditingEntry] = useState<string | null>(null);
  const [addingNew, setAddingNew] = useState(false);
  const [expandedVersions, setExpandedVersions] = useState<Set<string>>(new Set());
  const [form, setForm] = useState({
    version: '',
    title: '',
    description: '',
    category: 'feature' as const,
    file_references: [] as string[],
    release_date: new Date().toISOString().split('T')[0]
  });
  const [fileRefInput, setFileRefInput] = useState('');

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'feature': return Zap;
      case 'improvement': return TrendingUp;
      case 'bugfix': return Bug;
      case 'breaking': return AlertCircle;
      case 'security': return Shield;
      default: return FileText;
    }
  };

  const getCategoryColor = (category: string) => {
    switch (category) {
      case 'feature': return 'text-blue-600 bg-blue-50 border-blue-200';
      case 'improvement': return 'text-green-600 bg-green-50 border-green-200';
      case 'bugfix': return 'text-amber-600 bg-amber-50 border-amber-200';
      case 'breaking': return 'text-red-600 bg-red-50 border-red-200';
      case 'security': return 'text-purple-600 bg-purple-50 border-purple-200';
      default: return 'text-gray-600 bg-gray-50 border-gray-200';
    }
  };

  const getCategoryLabel = (category: string) => {
    switch (category) {
      case 'feature': return 'Nowa funkcja';
      case 'improvement': return 'Ulepszenie';
      case 'bugfix': return 'Naprawa';
      case 'breaking': return 'Breaking Change';
      case 'security': return 'Bezpieczeństwo';
      default: return category;
    }
  };

  const toggleVersion = (version: string) => {
    const newExpanded = new Set(expandedVersions);
    if (newExpanded.has(version)) {
      newExpanded.delete(version);
    } else {
      newExpanded.add(version);
    }
    setExpandedVersions(newExpanded);
  };

  const startEdit = (entry: ChangelogEntry) => {
    setForm({
      version: entry.version,
      title: entry.title,
      description: entry.description,
      category: entry.category,
      file_references: entry.file_references || [],
      release_date: entry.release_date.split('T')[0]
    });
    setEditingEntry(entry.id);
    setAddingNew(false);
  };

  const startAddNew = () => {
    setForm({
      version: '',
      title: '',
      description: '',
      category: 'feature',
      file_references: [],
      release_date: new Date().toISOString().split('T')[0]
    });
    setFileRefInput('');
    setAddingNew(true);
    setEditingEntry(null);
  };

  const cancelEdit = () => {
    setEditingEntry(null);
    setAddingNew(false);
    setFileRefInput('');
  };

  const addFileRef = () => {
    if (fileRefInput.trim() && !form.file_references.includes(fileRefInput.trim())) {
      setForm({ ...form, file_references: [...form.file_references, fileRefInput.trim()] });
      setFileRefInput('');
    }
  };

  const removeFileRef = (ref: string) => {
    setForm({ ...form, file_references: form.file_references.filter(r => r !== ref) });
  };

  const saveEntry = async () => {
    if (!form.version || !form.title || !form.description) {
      showAlert('Wypełnij wszystkie wymagane pola', 'error');
      return;
    }

    try {
      if (editingEntry) {
        const { error } = await supabase
          .from('changelog_entries')
          .update({
            version: form.version,
            title: form.title,
            description: form.description,
            category: form.category,
            file_references: form.file_references,
            release_date: form.release_date,
            updated_at: new Date().toISOString()
          })
          .eq('id', editingEntry);

        if (error) throw error;
        showAlert('Wpis zaktualizowany!', 'success');
      } else {
        const { error } = await supabase
          .from('changelog_entries')
          .insert([{
            version: form.version,
            title: form.title,
            description: form.description,
            category: form.category,
            file_references: form.file_references,
            release_date: form.release_date,
            order_index: 0
          }]);

        if (error) throw error;
        showAlert('Wpis dodany!', 'success');
      }

      cancelEdit();
      onUpdate();
    } catch (error) {
      console.error('Error saving changelog entry:', error);
      showAlert('Błąd podczas zapisywania wpisu', 'error');
    }
  };

  const deleteEntry = async (id: string) => {
    if (!confirm('Czy na pewno chcesz usunąć ten wpis?')) return;

    try {
      const { error } = await supabase
        .from('changelog_entries')
        .delete()
        .eq('id', id);

      if (error) throw error;
      showAlert('Wpis usunięty!', 'success');
      onUpdate();
    } catch (error) {
      console.error('Error deleting changelog entry:', error);
      showAlert('Błąd podczas usuwania wpisu', 'error');
    }
  };

  // Group entries by version
  const groupedEntries = entries.reduce((acc, entry) => {
    if (!acc[entry.version]) {
      acc[entry.version] = [];
    }
    acc[entry.version].push(entry);
    return acc;
  }, {} as Record<string, ChangelogEntry[]>);

  const versions = Object.keys(groupedEntries).sort((a, b) => {
    const aNum = a.split('.').map(Number);
    const bNum = b.split('.').map(Number);
    for (let i = 0; i < Math.max(aNum.length, bNum.length); i++) {
      if ((aNum[i] || 0) !== (bNum[i] || 0)) {
        return (bNum[i] || 0) - (aNum[i] || 0);
      }
    }
    return 0;
  });

  return (
    <div className="space-y-4">
      {isAdmin && (
        <div className="flex justify-between items-center">
          <h3 className="text-lg font-semibold">Zarządzaj Changelogiem</h3>
          {!addingNew && !editingEntry && (
            <button
              onClick={startAddNew}
              className="flex items-center gap-2 px-4 py-2 bg-amber-600 text-white rounded-lg hover:bg-amber-700 transition"
            >
              <Plus className="w-4 h-4" />
              Dodaj wpis
            </button>
          )}
        </div>
      )}

      {(addingNew || editingEntry) && (
        <div className="bg-white border-2 border-amber-500 rounded-lg p-4 space-y-3">
          <h4 className="font-semibold">{editingEntry ? 'Edytuj wpis' : 'Nowy wpis'}</h4>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium mb-1">Wersja *</label>
              <input
                type="text"
                value={form.version}
                onChange={(e) => setForm({ ...form, version: e.target.value })}
                placeholder="np. 1.5.0"
                className="w-full px-3 py-2 border rounded-lg"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Data wydania *</label>
              <input
                type="date"
                value={form.release_date}
                onChange={(e) => setForm({ ...form, release_date: e.target.value })}
                className="w-full px-3 py-2 border rounded-lg"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">Kategoria *</label>
            <select
              value={form.category}
              onChange={(e) => setForm({ ...form, category: e.target.value as any })}
              className="w-full px-3 py-2 border rounded-lg"
            >
              <option value="feature">Nowa funkcja</option>
              <option value="improvement">Ulepszenie</option>
              <option value="bugfix">Naprawa</option>
              <option value="breaking">Breaking Change</option>
              <option value="security">Bezpieczeństwo</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">Tytuł *</label>
            <input
              type="text"
              value={form.title}
              onChange={(e) => setForm({ ...form, title: e.target.value })}
              placeholder="Krótki opis zmiany"
              className="w-full px-3 py-2 border rounded-lg"
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">Opis *</label>
            <textarea
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
              placeholder="Szczegółowy opis wprowadzonej zmiany"
              rows={3}
              className="w-full px-3 py-2 border rounded-lg"
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">Odnośniki do kodu</label>
            <div className="flex gap-2 mb-2">
              <input
                type="text"
                value={fileRefInput}
                onChange={(e) => setFileRefInput(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addFileRef())}
                placeholder="np. src/components/PriceList.tsx:544"
                className="flex-1 px-3 py-2 border rounded-lg text-sm"
              />
              <button
                onClick={addFileRef}
                className="px-4 py-2 bg-gray-200 hover:bg-gray-300 rounded-lg transition"
              >
                Dodaj
              </button>
            </div>
            {form.file_references.length > 0 && (
              <div className="flex flex-wrap gap-2">
                {form.file_references.map((ref, idx) => (
                  <div key={idx} className="flex items-center gap-1 bg-gray-100 px-2 py-1 rounded text-sm">
                    <Code className="w-3 h-3" />
                    <span className="font-mono text-xs">{ref}</span>
                    <button
                      onClick={() => removeFileRef(ref)}
                      className="text-red-600 hover:text-red-700 ml-1"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="flex gap-2">
            <button
              onClick={saveEntry}
              className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition"
            >
              <Save className="w-4 h-4" />
              Zapisz
            </button>
            <button
              onClick={cancelEdit}
              className="flex items-center gap-2 px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition"
            >
              <X className="w-4 h-4" />
              Anuluj
            </button>
          </div>
        </div>
      )}

      <div className="space-y-4">
        {versions.map(version => {
          const versionEntries = groupedEntries[version];
          const isExpanded = expandedVersions.has(version);
          const latestDate = versionEntries.reduce((latest, entry) => {
            return new Date(entry.release_date) > new Date(latest) ? entry.release_date : latest;
          }, versionEntries[0].release_date);

          return (
            <div key={version} className="bg-white rounded-lg shadow border">
              <button
                onClick={() => toggleVersion(version)}
                className="w-full px-4 py-3 flex items-center justify-between hover:bg-gray-50 transition"
              >
                <div className="flex items-center gap-3">
                  <div className="flex items-center gap-2">
                    <FileText className="w-5 h-5 text-amber-600" />
                    <span className="text-lg font-bold">v{version}</span>
                  </div>
                  <span className="flex items-center gap-1 text-sm text-gray-600">
                    <Calendar className="w-4 h-4" />
                    {new Date(latestDate).toLocaleDateString('pl-PL')}
                  </span>
                  <span className="text-sm text-gray-500">
                    {versionEntries.length} {versionEntries.length === 1 ? 'zmiana' : 'zmiany'}
                  </span>
                </div>
                {isExpanded ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
              </button>

              {isExpanded && (
                <div className="border-t">
                  <ol className="divide-y">
                    {versionEntries.map((entry, idx) => {
                      const CategoryIcon = getCategoryIcon(entry.category);

                      return (
                        <li key={entry.id} className="p-4 hover:bg-gray-50 transition">
                          <div className="flex items-start gap-3">
                            <span className="flex-shrink-0 font-bold text-gray-400 text-sm mt-1">
                              {idx + 1}.
                            </span>
                            <div className="flex-1 space-y-2">
                              <div className="flex items-start justify-between gap-3">
                                <div className="flex-1">
                                  <div className="flex items-center gap-2 mb-1">
                                    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-medium border ${getCategoryColor(entry.category)}`}>
                                      <CategoryIcon className="w-3 h-3" />
                                      {getCategoryLabel(entry.category)}
                                    </span>
                                    <h4 className="font-semibold text-gray-900">{entry.title}</h4>
                                  </div>
                                  <p className="text-gray-700 text-sm mb-2">{entry.description}</p>

                                  {entry.file_references && entry.file_references.length > 0 && (
                                    <div className="mt-2">
                                      <div className="text-xs text-gray-600 mb-1 font-medium">Odnośniki do kodu:</div>
                                      <div className="flex flex-wrap gap-1">
                                        {entry.file_references.map((ref, refIdx) => (
                                          <code key={refIdx} className="inline-flex items-center gap-1 px-2 py-0.5 bg-gray-100 text-gray-700 rounded text-xs font-mono">
                                            <Code className="w-3 h-3" />
                                            {ref}
                                          </code>
                                        ))}
                                      </div>
                                    </div>
                                  )}
                                </div>

                                {isAdmin && editingEntry !== entry.id && (
                                  <div className="flex gap-1 flex-shrink-0">
                                    <button
                                      onClick={() => startEdit(entry)}
                                      className="p-1.5 text-blue-600 hover:bg-blue-50 rounded transition"
                                    >
                                      <Edit className="w-4 h-4" />
                                    </button>
                                    <button
                                      onClick={() => deleteEntry(entry.id)}
                                      className="p-1.5 text-red-600 hover:bg-red-50 rounded transition"
                                    >
                                      <Trash2 className="w-4 h-4" />
                                    </button>
                                  </div>
                                )}
                              </div>
                            </div>
                          </div>
                        </li>
                      );
                    })}
                  </ol>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {versions.length === 0 && (
        <div className="text-center py-12 text-gray-500 bg-white rounded-lg border">
          <FileText className="w-12 h-12 mx-auto mb-3 opacity-50" />
          <p>Brak wpisów w changelogu</p>
          {isAdmin && (
            <p className="text-sm mt-2">Dodaj pierwszy wpis, aby rozpocząć dokumentację zmian</p>
          )}
        </div>
      )}
    </div>
  );
}

// Missing imports
import { TrendingUp, AlertCircle } from 'lucide-react';
