import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import { Bell, Plus, Edit2, Trash2, Eye, Calendar, AlertCircle, Info, Wrench, Bug, Megaphone, Settings } from 'lucide-react';

interface Announcement {
  id: string;
  title: string;
  message: string;
  announcement_type: 'feature' | 'update' | 'bugfix' | 'warning' | 'info' | 'maintenance';
  target_roles: string[] | null;
  priority: 'low' | 'medium' | 'high' | 'critical';
  created_at: string;
  created_by: string;
  active_from: string;
  active_until: string | null;
  is_active: boolean;
  view_count?: number;
}

const announcementTypes = [
  { value: 'feature', label: 'Nowa funkcja', icon: Megaphone, color: 'bg-blue-100 text-blue-800' },
  { value: 'update', label: 'Aktualizacja', icon: Settings, color: 'bg-green-100 text-green-800' },
  { value: 'bugfix', label: 'Naprawa błędu', icon: Bug, color: 'bg-purple-100 text-purple-800' },
  { value: 'warning', label: 'Ostrzeżenie', icon: AlertCircle, color: 'bg-yellow-100 text-yellow-800' },
  { value: 'info', label: 'Informacja', icon: Info, color: 'bg-gray-100 text-gray-800' },
  { value: 'maintenance', label: 'Konserwacja', icon: Wrench, color: 'bg-orange-100 text-orange-800' },
];

const priorityLevels = [
  { value: 'low', label: 'Niski', color: 'text-gray-600' },
  { value: 'medium', label: 'Średni', color: 'text-blue-600' },
  { value: 'high', label: 'Wysoki', color: 'text-orange-600' },
  { value: 'critical', label: 'Krytyczny', color: 'text-red-600' },
];

const roleOptions = [
  { value: 'admin', label: 'Administratorzy' },
  { value: 'salesperson', label: 'Sprzedawcy' },
  { value: 'driver', label: 'Kierowcy' },
  { value: 'analyst', label: 'Analitycy' },
  { value: 'warehouse', label: 'Magazyn' },
];

export default function AnnouncementsManager() {
  const { user } = useAuth();
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);

  const [formData, setFormData] = useState({
    title: '',
    message: '',
    announcement_type: 'info' as const,
    target_roles: [] as string[],
    priority: 'medium' as const,
    active_from: new Date().toISOString().slice(0, 16),
    active_until: '',
    is_active: true,
  });

  useEffect(() => {
    loadAnnouncements();
  }, []);

  const loadAnnouncements = async () => {
    try {
      const { data, error } = await supabase
        .from('system_announcements')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;

      const announcementsWithViews = await Promise.all(
        (data || []).map(async (announcement) => {
          const { count } = await supabase
            .from('user_announcement_views')
            .select('*', { count: 'exact', head: true })
            .eq('announcement_id', announcement.id);

          return { ...announcement, view_count: count || 0 };
        })
      );

      setAnnouncements(announcementsWithViews);
    } catch (error) {
      console.error('Error loading announcements:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      const payload = {
        ...formData,
        created_by: user?.id,
        target_roles: formData.target_roles.length > 0 ? formData.target_roles : null,
        active_until: formData.active_until || null,
      };

      if (editingId) {
        const { error } = await supabase
          .from('system_announcements')
          .update(payload)
          .eq('id', editingId);

        if (error) throw error;
      } else {
        const { error } = await supabase
          .from('system_announcements')
          .insert([payload]);

        if (error) throw error;
      }

      resetForm();
      loadAnnouncements();
    } catch (error) {
      console.error('Error saving announcement:', error);
      alert('Błąd zapisywania ogłoszenia');
    }
  };

  const handleEdit = (announcement: Announcement) => {
    setEditingId(announcement.id);
    setFormData({
      title: announcement.title,
      message: announcement.message,
      announcement_type: announcement.announcement_type,
      target_roles: announcement.target_roles || [],
      priority: announcement.priority,
      active_from: new Date(announcement.active_from).toISOString().slice(0, 16),
      active_until: announcement.active_until ? new Date(announcement.active_until).toISOString().slice(0, 16) : '',
      is_active: announcement.is_active,
    });
    setShowForm(true);
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Czy na pewno chcesz usunąć to ogłoszenie?')) return;

    try {
      const { error } = await supabase
        .from('system_announcements')
        .delete()
        .eq('id', id);

      if (error) throw error;
      loadAnnouncements();
    } catch (error) {
      console.error('Error deleting announcement:', error);
      alert('Błąd usuwania ogłoszenia');
    }
  };

  const toggleActive = async (id: string, currentStatus: boolean) => {
    try {
      const { error } = await supabase
        .from('system_announcements')
        .update({ is_active: !currentStatus })
        .eq('id', id);

      if (error) throw error;
      loadAnnouncements();
    } catch (error) {
      console.error('Error toggling announcement:', error);
    }
  };

  const resetForm = () => {
    setFormData({
      title: '',
      message: '',
      announcement_type: 'info',
      target_roles: [],
      priority: 'medium',
      active_from: new Date().toISOString().slice(0, 16),
      active_until: '',
      is_active: true,
    });
    setEditingId(null);
    setShowForm(false);
  };

  const getTypeConfig = (type: string) => {
    return announcementTypes.find(t => t.value === type) || announcementTypes[4];
  };

  const getPriorityConfig = (priority: string) => {
    return priorityLevels.find(p => p.value === priority) || priorityLevels[1];
  };

  if (loading) {
    return <div className="p-8 text-center">Ładowanie ogłoszeń...</div>;
  }

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <Bell className="w-8 h-8 text-amber-600" />
          <h1 className="text-2xl font-bold">Zarządzanie ogłoszeniami systemowymi</h1>
        </div>
        <button
          onClick={() => setShowForm(!showForm)}
          className="flex items-center gap-2 px-4 py-2 bg-amber-600 text-white rounded-lg hover:bg-amber-700 transition-colors"
        >
          <Plus className="w-5 h-5" />
          Nowe ogłoszenie
        </button>
      </div>

      {showForm && (
        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
          <h2 className="text-xl font-bold mb-4">
            {editingId ? 'Edytuj ogłoszenie' : 'Nowe ogłoszenie'}
          </h2>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-1">Tytuł</label>
              <input
                type="text"
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                className="w-full p-2 border rounded"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">Wiadomość</label>
              <textarea
                value={formData.message}
                onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                className="w-full p-2 border rounded"
                rows={4}
                required
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-1">Typ ogłoszenia</label>
                <select
                  value={formData.announcement_type}
                  onChange={(e) => setFormData({ ...formData, announcement_type: e.target.value as any })}
                  className="w-full p-2 border rounded"
                >
                  {announcementTypes.map(type => (
                    <option key={type.value} value={type.value}>{type.label}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">Priorytet</label>
                <select
                  value={formData.priority}
                  onChange={(e) => setFormData({ ...formData, priority: e.target.value as any })}
                  className="w-full p-2 border rounded"
                >
                  {priorityLevels.map(priority => (
                    <option key={priority.value} value={priority.value}>{priority.label}</option>
                  ))}
                </select>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">Role docelowe (puste = wszyscy)</label>
              <div className="grid grid-cols-3 gap-2">
                {roleOptions.map(role => (
                  <label key={role.value} className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      checked={formData.target_roles.includes(role.value)}
                      onChange={(e) => {
                        if (e.target.checked) {
                          setFormData({ ...formData, target_roles: [...formData.target_roles, role.value] });
                        } else {
                          setFormData({ ...formData, target_roles: formData.target_roles.filter(r => r !== role.value) });
                        }
                      }}
                    />
                    <span className="text-sm">{role.label}</span>
                  </label>
                ))}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-1">Aktywne od</label>
                <input
                  type="datetime-local"
                  value={formData.active_from}
                  onChange={(e) => setFormData({ ...formData, active_from: e.target.value })}
                  className="w-full p-2 border rounded"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">Aktywne do (opcjonalne)</label>
                <input
                  type="datetime-local"
                  value={formData.active_until}
                  onChange={(e) => setFormData({ ...formData, active_until: e.target.value })}
                  className="w-full p-2 border rounded"
                />
              </div>
            </div>

            <div>
              <label className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={formData.is_active}
                  onChange={(e) => setFormData({ ...formData, is_active: e.target.checked })}
                />
                <span className="text-sm font-medium">Aktywne</span>
              </label>
            </div>

            <div className="flex gap-2">
              <button
                type="submit"
                className="px-4 py-2 bg-amber-600 text-white rounded hover:bg-amber-700"
              >
                {editingId ? 'Zapisz zmiany' : 'Utwórz ogłoszenie'}
              </button>
              <button
                type="button"
                onClick={resetForm}
                className="px-4 py-2 bg-gray-200 text-gray-700 rounded hover:bg-gray-300"
              >
                Anuluj
              </button>
            </div>
          </form>
        </div>
      )}

      <div className="space-y-4">
        {announcements.length === 0 ? (
          <div className="bg-white rounded-lg shadow-md p-8 text-center text-gray-500">
            Brak ogłoszeń systemowych
          </div>
        ) : (
          announcements.map(announcement => {
            const typeConfig = getTypeConfig(announcement.announcement_type);
            const priorityConfig = getPriorityConfig(announcement.priority);
            const TypeIcon = typeConfig.icon;

            return (
              <div
                key={announcement.id}
                className={`bg-white rounded-lg shadow-md p-6 ${!announcement.is_active ? 'opacity-60' : ''}`}
              >
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-start gap-3 flex-1">
                    <div className={`p-2 rounded-lg ${typeConfig.color}`}>
                      <TypeIcon className="w-5 h-5" />
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <h3 className="text-lg font-bold">{announcement.title}</h3>
                        <span className={`text-xs font-semibold ${priorityConfig.color}`}>
                          {priorityConfig.label}
                        </span>
                      </div>
                      <p className="text-gray-700 mb-2">{announcement.message}</p>
                      <div className="flex flex-wrap gap-3 text-sm text-gray-600">
                        <div className="flex items-center gap-1">
                          <Calendar className="w-4 h-4" />
                          {new Date(announcement.active_from).toLocaleDateString('pl-PL')}
                        </div>
                        {announcement.active_until && (
                          <div className="flex items-center gap-1">
                            do {new Date(announcement.active_until).toLocaleDateString('pl-PL')}
                          </div>
                        )}
                        <div className="flex items-center gap-1">
                          <Eye className="w-4 h-4" />
                          {announcement.view_count} wyświetleń
                        </div>
                        {announcement.target_roles && (
                          <div className="text-blue-600">
                            Role: {announcement.target_roles.join(', ')}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 ml-4">
                    <button
                      onClick={() => toggleActive(announcement.id, announcement.is_active)}
                      className={`px-3 py-1 rounded text-sm ${
                        announcement.is_active
                          ? 'bg-green-100 text-green-700 hover:bg-green-200'
                          : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                      }`}
                    >
                      {announcement.is_active ? 'Aktywne' : 'Nieaktywne'}
                    </button>
                    <button
                      onClick={() => handleEdit(announcement)}
                      className="p-2 text-blue-600 hover:bg-blue-50 rounded"
                    >
                      <Edit2 className="w-5 h-5" />
                    </button>
                    <button
                      onClick={() => handleDelete(announcement.id)}
                      className="p-2 text-red-600 hover:bg-red-50 rounded"
                    >
                      <Trash2 className="w-5 h-5" />
                    </button>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
