import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { Bell, TrendingUp, MousePointer, X, Eye, Clock, BarChart3, Calendar } from 'lucide-react';

interface PushStats {
  total_sent: number;
  total_delivered: number;
  total_clicked: number;
  total_dismissed: number;
  total_closed: number;
  ctr_percentage: number;
  avg_time_to_click_seconds: number;
}

interface PushTypeStats extends PushStats {
  notification_type: string;
}

interface PushNotificationDetail {
  id: string;
  notification_type: string;
  title: string;
  body: string;
  priority: string;
  sent_at: string;
  delivered_count: number;
  clicked_count: number;
  dismissed_count: number;
  closed_count: number;
  ctr_percentage: number;
  avg_time_to_click_seconds: number;
}

export default function PushAnalyticsPanel() {
  const [overallStats, setOverallStats] = useState<PushStats | null>(null);
  const [typeStats, setTypeStats] = useState<PushTypeStats[]>([]);
  const [recentNotifications, setRecentNotifications] = useState<PushNotificationDetail[]>([]);
  const [loading, setLoading] = useState(true);
  const [timeRange, setTimeRange] = useState<'day' | 'week' | 'month' | 'all'>('week');

  useEffect(() => {
    loadAnalytics();
  }, [timeRange]);

  const loadAnalytics = async () => {
    setLoading(true);
    try {
      const dateFilter = getDateFilter();

      const { data: overall } = await supabase
        .from('push_notification_type_stats')
        .select('*');

      if (overall && overall.length > 0) {
        const totalStats = overall.reduce((acc, stat) => ({
          total_sent: acc.total_sent + (stat.total_sent || 0),
          total_delivered: acc.total_delivered + (stat.total_delivered || 0),
          total_clicked: acc.total_clicked + (stat.total_clicked || 0),
          total_dismissed: acc.total_dismissed + (stat.total_dismissed || 0),
          total_closed: acc.total_closed + (stat.total_closed || 0),
          ctr_percentage: 0,
          avg_time_to_click_seconds: 0,
        }), {
          total_sent: 0,
          total_delivered: 0,
          total_clicked: 0,
          total_dismissed: 0,
          total_closed: 0,
          ctr_percentage: 0,
          avg_time_to_click_seconds: 0,
        });

        totalStats.ctr_percentage = totalStats.total_delivered > 0
          ? Math.round((totalStats.total_clicked / totalStats.total_delivered) * 100 * 100) / 100
          : 0;

        setOverallStats(totalStats);
      }

      const { data: byType } = await supabase
        .from('push_notification_type_stats')
        .select('*')
        .order('ctr_percentage', { ascending: false });

      if (byType) {
        setTypeStats(byType);
      }

      let query = supabase
        .from('push_notification_stats')
        .select('*')
        .order('sent_at', { ascending: false })
        .limit(50);

      if (dateFilter) {
        query = query.gte('sent_at', dateFilter);
      }

      const { data: recent } = await query;
      if (recent) {
        setRecentNotifications(recent);
      }
    } catch (error) {
      console.error('Error loading push analytics:', error);
    } finally {
      setLoading(false);
    }
  };

  const getDateFilter = () => {
    const now = new Date();
    switch (timeRange) {
      case 'day':
        return new Date(now.setDate(now.getDate() - 1)).toISOString();
      case 'week':
        return new Date(now.setDate(now.getDate() - 7)).toISOString();
      case 'month':
        return new Date(now.setMonth(now.getMonth() - 1)).toISOString();
      default:
        return null;
    }
  };

  const formatTime = (seconds: number | null) => {
    if (!seconds) return 'N/A';
    if (seconds < 60) return `${Math.round(seconds)}s`;
    if (seconds < 3600) return `${Math.round(seconds / 60)}min`;
    return `${Math.round(seconds / 3600)}h`;
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleString('pl-PL', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const getNotificationTypeLabel = (type: string) => {
    const labels: Record<string, string> = {
      'order_confirmed': 'Zamówienie potwierdzone',
      'order_rejected': 'Zamówienie odrzucone',
      'order_partial': 'Zamówienie częściowe',
      'delivery_scheduled': 'Dostawa zaplanowana',
      'delivery_today': 'Dostawa dzisiaj',
      'price_update': 'Aktualizacja cen',
      'system_notification': 'Powiadomienie systemowe',
    };
    return labels[type] || type;
  };

  const getPriorityBadge = (priority: string) => {
    const styles = {
      low: 'bg-gray-100 text-gray-700',
      normal: 'bg-blue-100 text-blue-700',
      high: 'bg-orange-100 text-orange-700',
      urgent: 'bg-red-100 text-red-700',
    };
    return styles[priority as keyof typeof styles] || styles.normal;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-amber-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-2xl font-bold text-gray-800">Analityka Push Notifications</h2>
        <div className="flex gap-2">
          {(['day', 'week', 'month', 'all'] as const).map((range) => (
            <button
              key={range}
              onClick={() => setTimeRange(range)}
              className={`px-3 py-1 rounded-lg text-sm font-medium transition ${
                timeRange === range
                  ? 'bg-amber-600 text-white'
                  : 'bg-white text-gray-700 hover:bg-gray-100'
              }`}
            >
              {range === 'day' && 'Dzień'}
              {range === 'week' && 'Tydzień'}
              {range === 'month' && 'Miesiąc'}
              {range === 'all' && 'Wszystkie'}
            </button>
          ))}
        </div>
      </div>

      {overallStats && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-white rounded-xl shadow p-6">
            <div className="flex items-center gap-3 mb-2">
              <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                <Bell className="w-5 h-5 text-blue-600" />
              </div>
              <div>
                <p className="text-sm text-gray-600">Wysłane</p>
                <p className="text-2xl font-bold text-gray-800">{overallStats.total_sent}</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow p-6">
            <div className="flex items-center gap-3 mb-2">
              <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
                <Eye className="w-5 h-5 text-green-600" />
              </div>
              <div>
                <p className="text-sm text-gray-600">Dostarczone</p>
                <p className="text-2xl font-bold text-gray-800">{overallStats.total_delivered}</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow p-6">
            <div className="flex items-center gap-3 mb-2">
              <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center">
                <MousePointer className="w-5 h-5 text-purple-600" />
              </div>
              <div>
                <p className="text-sm text-gray-600">Kliknięte</p>
                <p className="text-2xl font-bold text-gray-800">{overallStats.total_clicked}</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow p-6">
            <div className="flex items-center gap-3 mb-2">
              <div className="w-10 h-10 bg-amber-100 rounded-lg flex items-center justify-center">
                <TrendingUp className="w-5 h-5 text-amber-600" />
              </div>
              <div>
                <p className="text-sm text-gray-600">CTR</p>
                <p className="text-2xl font-bold text-gray-800">{overallStats.ctr_percentage}%</p>
              </div>
            </div>
          </div>
        </div>
      )}

      <div className="bg-white rounded-xl shadow p-6">
        <div className="flex items-center gap-2 mb-4">
          <BarChart3 className="w-5 h-5 text-amber-600" />
          <h3 className="text-lg font-semibold text-gray-800">Ranking typów powiadomień</h3>
        </div>

        <div className="space-y-3">
          {typeStats.map((stat, index) => (
            <div key={stat.notification_type} className="border-l-4 border-amber-500 bg-gray-50 p-4 rounded-r-lg">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-3">
                  <span className="text-lg font-bold text-gray-400">#{index + 1}</span>
                  <h4 className="font-semibold text-gray-800">{getNotificationTypeLabel(stat.notification_type)}</h4>
                </div>
                <div className="flex items-center gap-4">
                  <div className="text-right">
                    <p className="text-2xl font-bold text-amber-600">{stat.ctr_percentage}%</p>
                    <p className="text-xs text-gray-600">CTR</p>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-5 gap-4 text-sm">
                <div>
                  <p className="text-gray-600">Wysłane</p>
                  <p className="font-semibold text-gray-800">{stat.total_sent}</p>
                </div>
                <div>
                  <p className="text-gray-600">Dostarczone</p>
                  <p className="font-semibold text-gray-800">{stat.total_delivered}</p>
                </div>
                <div>
                  <p className="text-gray-600">Kliknięte</p>
                  <p className="font-semibold text-green-600">{stat.total_clicked}</p>
                </div>
                <div>
                  <p className="text-gray-600">Odrzucone</p>
                  <p className="font-semibold text-orange-600">{stat.total_dismissed}</p>
                </div>
                <div>
                  <p className="text-gray-600">Śr. czas</p>
                  <p className="font-semibold text-gray-800">{formatTime(stat.avg_time_to_click_seconds)}</p>
                </div>
              </div>
            </div>
          ))}

          {typeStats.length === 0 && (
            <p className="text-gray-600 text-center py-8">Brak danych o powiadomieniach</p>
          )}
        </div>
      </div>

      <div className="bg-white rounded-xl shadow p-6">
        <div className="flex items-center gap-2 mb-4">
          <Calendar className="w-5 h-5 text-amber-600" />
          <h3 className="text-lg font-semibold text-gray-800">Ostatnie powiadomienia</h3>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-200">
                <th className="text-left py-3 px-4 text-sm font-semibold text-gray-600">Data</th>
                <th className="text-left py-3 px-4 text-sm font-semibold text-gray-600">Typ</th>
                <th className="text-left py-3 px-4 text-sm font-semibold text-gray-600">Tytuł</th>
                <th className="text-center py-3 px-4 text-sm font-semibold text-gray-600">Priorytet</th>
                <th className="text-center py-3 px-4 text-sm font-semibold text-gray-600">Dostarczone</th>
                <th className="text-center py-3 px-4 text-sm font-semibold text-gray-600">Kliknięte</th>
                <th className="text-center py-3 px-4 text-sm font-semibold text-gray-600">CTR</th>
                <th className="text-center py-3 px-4 text-sm font-semibold text-gray-600">Śr. czas</th>
              </tr>
            </thead>
            <tbody>
              {recentNotifications.map((notif) => (
                <tr key={notif.id} className="border-b border-gray-100 hover:bg-gray-50">
                  <td className="py-3 px-4 text-sm text-gray-800">{formatDate(notif.sent_at)}</td>
                  <td className="py-3 px-4 text-sm text-gray-600">{getNotificationTypeLabel(notif.notification_type)}</td>
                  <td className="py-3 px-4 text-sm text-gray-800 max-w-xs truncate">{notif.title}</td>
                  <td className="py-3 px-4 text-center">
                    <span className={`px-2 py-1 rounded text-xs font-medium ${getPriorityBadge(notif.priority)}`}>
                      {notif.priority}
                    </span>
                  </td>
                  <td className="py-3 px-4 text-center text-sm font-semibold text-gray-800">{notif.delivered_count}</td>
                  <td className="py-3 px-4 text-center text-sm font-semibold text-green-600">{notif.clicked_count}</td>
                  <td className="py-3 px-4 text-center text-sm font-bold text-amber-600">{notif.ctr_percentage}%</td>
                  <td className="py-3 px-4 text-center text-sm text-gray-600">{formatTime(notif.avg_time_to_click_seconds)}</td>
                </tr>
              ))}
            </tbody>
          </table>

          {recentNotifications.length === 0 && (
            <p className="text-gray-600 text-center py-8">Brak ostatnich powiadomień</p>
          )}
        </div>
      </div>
    </div>
  );
}
