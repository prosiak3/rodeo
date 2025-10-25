import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import { X, Bell, AlertCircle, Info, Megaphone, Settings, Bug, Wrench } from 'lucide-react';

interface Announcement {
  id: string;
  title: string;
  message: string;
  announcement_type: 'feature' | 'update' | 'bugfix' | 'warning' | 'info' | 'maintenance';
  priority: 'low' | 'medium' | 'high' | 'critical';
  created_at: string;
}

const typeConfig = {
  feature: { icon: Megaphone, color: 'bg-blue-50 border-blue-200', textColor: 'text-blue-900', iconColor: 'text-blue-600' },
  update: { icon: Settings, color: 'bg-green-50 border-green-200', textColor: 'text-green-900', iconColor: 'text-green-600' },
  bugfix: { icon: Bug, color: 'bg-purple-50 border-purple-200', textColor: 'text-purple-900', iconColor: 'text-purple-600' },
  warning: { icon: AlertCircle, color: 'bg-yellow-50 border-yellow-200', textColor: 'text-yellow-900', iconColor: 'text-yellow-600' },
  info: { icon: Info, color: 'bg-gray-50 border-gray-200', textColor: 'text-gray-900', iconColor: 'text-gray-600' },
  maintenance: { icon: Wrench, color: 'bg-orange-50 border-orange-200', textColor: 'text-orange-900', iconColor: 'text-orange-600' },
};

export default function UserNotifications() {
  const { user } = useAuth();
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [show, setShow] = useState(false);

  useEffect(() => {
    if (!user?.id) return;

    loadUnseenAnnouncements();
  }, [user?.id]);

  const loadUnseenAnnouncements = async () => {
    if (!user?.id) return;

    try {
      const { data: viewedIds } = await supabase
        .from('user_announcement_views')
        .select('announcement_id')
        .eq('user_id', user.id);

      const viewedSet = new Set((viewedIds || []).map(v => v.announcement_id));

      const { data: allAnnouncements, error } = await supabase
        .from('system_announcements')
        .select('id, title, message, announcement_type, priority, created_at')
        .eq('is_active', true)
        .lte('active_from', new Date().toISOString())
        .or(`active_until.is.null,active_until.gte.${new Date().toISOString()}`)
        .order('priority', { ascending: false })
        .order('created_at', { ascending: false });

      if (error) throw error;

      const unseenAnnouncements = (allAnnouncements || []).filter(
        announcement => !viewedSet.has(announcement.id)
      );

      if (unseenAnnouncements.length > 0) {
        setAnnouncements(unseenAnnouncements);
        setShow(true);
      }
    } catch (error) {
      console.error('Error loading announcements:', error);
    }
  };

  const markAsViewed = async (announcementId: string) => {
    if (!user?.id) return;

    try {
      await supabase
        .from('user_announcement_views')
        .insert({
          user_id: user.id,
          announcement_id: announcementId,
        });
    } catch (error) {
      console.error('Error marking announcement as viewed:', error);
    }
  };

  const handleClose = async () => {
    if (announcements[currentIndex]) {
      await markAsViewed(announcements[currentIndex].id);
    }

    if (currentIndex < announcements.length - 1) {
      setCurrentIndex(currentIndex + 1);
    } else {
      setShow(false);
      setCurrentIndex(0);
      setAnnouncements([]);
    }
  };

  if (!show || announcements.length === 0) {
    return null;
  }

  const current = announcements[currentIndex];
  const config = typeConfig[current.announcement_type];
  const Icon = config.icon;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 p-4">
      <div
        className={`${config.color} border-2 rounded-lg shadow-2xl max-w-lg w-full p-6 animate-in fade-in slide-in-from-top-4 duration-300`}
      >
        <div className="flex items-start gap-4">
          <div className={`p-3 rounded-full ${config.color} border ${config.iconColor}`}>
            <Icon className="w-6 h-6" />
          </div>

          <div className="flex-1">
            <div className="flex items-start justify-between mb-3">
              <div>
                <h3 className={`text-xl font-bold ${config.textColor} mb-1`}>
                  {current.title}
                </h3>
                <p className="text-xs text-gray-600">
                  {new Date(current.created_at).toLocaleDateString('pl-PL', {
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric',
                  })}
                </p>
              </div>
            </div>

            <p className={`${config.textColor} text-base leading-relaxed mb-4`}>
              {current.message}
            </p>

            <div className="flex items-center justify-between">
              <div className="text-sm text-gray-600">
                {currentIndex + 1} z {announcements.length} powiadomień
              </div>
              <button
                onClick={handleClose}
                className="px-6 py-2 bg-amber-600 text-white font-semibold rounded-lg hover:bg-amber-700 transition-colors focus:outline-none focus:ring-2 focus:ring-amber-500 focus:ring-offset-2"
              >
                OK
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
