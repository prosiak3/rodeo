import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { processRecentSessions, clusterPaths, UserPath, PathCluster } from '../lib/pathClustering';
import { BarChart3, TrendingUp, Users, Clock, Activity, RefreshCw, Filter, Download, LogOut, Brain, Award, Monitor, Bell, Store } from 'lucide-react';
import AIMetricsPanel from './AIMetricsPanel';
import LoginRankingsPanel from './LoginRankingsPanel';
import SessionsBrowserPanel from './SessionsBrowserPanel';
import TopProductsPanel from './TopProductsPanel';
import PushAnalyticsPanel from './PushAnalyticsPanel';
import StoreAnalyticsPanel from './StoreAnalyticsPanel';

interface AnalyticsSummary {
  totalUsers: number;
  activeUsersToday: number;
  activeUsersWeek: number;
  totalSessions: number;
  averageSessionDuration: string;
  totalEvents: number;
  topEvents: Array<{ event_type: string; count: number }>;
}


export default function AnalyticsPanel() {
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(false);
  const [summary, setSummary] = useState<AnalyticsSummary | null>(null);
  const [topPaths, setTopPaths] = useState<UserPath[]>([]);
  const [clusters, setClusters] = useState<PathCluster[]>([]);
  const [timeFilter, setTimeFilter] = useState<'today' | 'week' | 'month' | 'all'>('week');
  const [roleFilter, setRoleFilter] = useState<string>('all');
  const [activeTab, setActiveTab] = useState<'analytics' | 'ai-metrics' | 'rankings' | 'sessions' | 'products' | 'stores' | 'push'>('analytics');

  useEffect(() => {
    loadAnalytics();
  }, [timeFilter, roleFilter]);

  const loadAnalytics = async () => {
    setLoading(true);
    try {
      await Promise.all([
        loadSummary(),
        loadTopPaths(),
        loadClusters(),
      ]);
    } catch (error) {
      console.error('Failed to load analytics:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadSummary = async () => {
    const cutoffDate = getDateCutoff(timeFilter);

    // Total unique users
    const { count: totalUsers } = await supabase
      .from('users')
      .select('*', { count: 'exact', head: true })
      .neq('role', 'analyst');

    // Active users today
    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);
    const { data: activeToday } = await supabase
      .from('user_sessions')
      .select('user_id')
      .gte('session_start', todayStart.toISOString());

    // Active users this week
    const weekStart = new Date();
    weekStart.setDate(weekStart.getDate() - 7);
    const { data: activeWeek } = await supabase
      .from('user_sessions')
      .select('user_id')
      .gte('session_start', weekStart.toISOString());

    // Total sessions in time period
    const { count: totalSessions } = await supabase
      .from('user_sessions')
      .select('*', { count: 'exact', head: true })
      .gte('session_start', cutoffDate);

    // Average session duration
    const { data: sessions } = await supabase
      .from('user_sessions')
      .select('session_start, session_end')
      .gte('session_start', cutoffDate)
      .not('session_end', 'is', null);

    let avgDurationMs = 0;
    if (sessions && sessions.length > 0) {
      const durations = sessions.map(s =>
        new Date(s.session_end!).getTime() - new Date(s.session_start).getTime()
      );
      avgDurationMs = durations.reduce((a, b) => a + b, 0) / durations.length;
    }

    // Total events
    const { count: totalEvents } = await supabase
      .from('user_events')
      .select('*', { count: 'exact', head: true })
      .gte('timestamp', cutoffDate);

    // Top events
    const { data: eventCounts } = await supabase
      .from('user_events')
      .select('event_type')
      .gte('timestamp', cutoffDate);

    const eventMap = new Map<string, number>();
    eventCounts?.forEach(e => {
      eventMap.set(e.event_type, (eventMap.get(e.event_type) || 0) + 1);
    });

    const topEvents = Array.from(eventMap.entries())
      .map(([event_type, count]) => ({ event_type, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 5);

    setSummary({
      totalUsers: totalUsers || 0,
      activeUsersToday: new Set(activeToday?.map(u => u.user_id)).size,
      activeUsersWeek: new Set(activeWeek?.map(u => u.user_id)).size,
      totalSessions: totalSessions || 0,
      averageSessionDuration: formatDuration(avgDurationMs),
      totalEvents: totalEvents || 0,
      topEvents,
    });
  };

  const loadTopPaths = async () => {
    const { data, error } = await supabase
      .from('user_paths')
      .select('*')
      .order('occurrence_count', { ascending: false })
      .limit(10);

    if (!error && data) {
      setTopPaths(data);
    }
  };

  const loadClusters = async () => {
    const { data, error } = await supabase
      .from('path_clusters')
      .select('*')
      .order('total_occurrences', { ascending: false });

    if (!error && data) {
      setClusters(data);
    }
  };


  const handleProcessSessions = async () => {
    setProcessing(true);
    try {
      await processRecentSessions(24);
      await loadAnalytics();
    } catch (error) {
      console.error('Failed to process sessions:', error);
    } finally {
      setProcessing(false);
    }
  };

  const handleRecluster = async () => {
    setProcessing(true);
    try {
      await clusterPaths(70);
      await loadClusters();
    } catch (error) {
      console.error('Failed to recluster paths:', error);
    } finally {
      setProcessing(false);
    }
  };

  const exportData = async () => {
    const data = {
      summary,
      topPaths,
      clusters,
      exportedAt: new Date().toISOString(),
    };

    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `analytics-export-${new Date().toISOString().split('T')[0]}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    window.location.reload();
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  const renderTabs = () => (
    <div className="flex gap-2 border-b border-gray-200 mb-6">
      <button
        onClick={() => setActiveTab('analytics')}
        className={`flex items-center gap-2 px-4 py-2 font-medium transition-colors ${
          activeTab === 'analytics'
            ? 'text-blue-600 border-b-2 border-blue-600'
            : 'text-gray-600 hover:text-gray-900'
        }`}
      >
        <Activity className="w-5 h-5" />
        Analityka
      </button>
      <button
        onClick={() => setActiveTab('rankings')}
        className={`flex items-center gap-2 px-4 py-2 font-medium transition-colors ${
          activeTab === 'rankings'
            ? 'text-blue-600 border-b-2 border-blue-600'
            : 'text-gray-600 hover:text-gray-900'
        }`}
      >
        <Award className="w-5 h-5" />
        Rankingi
      </button>
      <button
        onClick={() => setActiveTab('sessions')}
        className={`flex items-center gap-2 px-4 py-2 font-medium transition-colors ${
          activeTab === 'sessions'
            ? 'text-blue-600 border-b-2 border-blue-600'
            : 'text-gray-600 hover:text-gray-900'
        }`}
      >
        <Monitor className="w-5 h-5" />
        Sesje
      </button>
      <button
        onClick={() => setActiveTab('products')}
        className={`flex items-center gap-2 px-4 py-2 font-medium transition-colors ${
          activeTab === 'products'
            ? 'text-blue-600 border-b-2 border-blue-600'
            : 'text-gray-600 hover:text-gray-900'
        }`}
      >
        <TrendingUp className="w-5 h-5" />
        Produkty
      </button>
      <button
        onClick={() => setActiveTab('stores')}
        className={`flex items-center gap-2 px-4 py-2 font-medium transition-colors ${
          activeTab === 'stores'
            ? 'text-blue-600 border-b-2 border-blue-600'
            : 'text-gray-600 hover:text-gray-900'
        }`}
      >
        <Store className="w-5 h-5" />
        Placówki
      </button>
      <button
        onClick={() => setActiveTab('ai-metrics')}
        className={`flex items-center gap-2 px-4 py-2 font-medium transition-colors ${
          activeTab === 'ai-metrics'
            ? 'text-blue-600 border-b-2 border-blue-600'
            : 'text-gray-600 hover:text-gray-900'
        }`}
      >
        <Brain className="w-5 h-5" />
        Metryki AI
      </button>
      <button
        onClick={() => setActiveTab('push')}
        className={`flex items-center gap-2 px-4 py-2 font-medium transition-colors ${
          activeTab === 'push'
            ? 'text-blue-600 border-b-2 border-blue-600'
            : 'text-gray-600 hover:text-gray-900'
        }`}
      >
        <Bell className="w-5 h-5" />
        Push Notifications
      </button>
    </div>
  );

  if (activeTab === 'ai-metrics') {
    return (
      <div className="min-h-screen bg-gray-50 p-6">
        <div className="max-w-7xl mx-auto space-y-6">
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h1 className="text-3xl font-bold text-gray-900">Panel Analityczny</h1>
                <p className="text-gray-600 mt-1">Analiza zachowań użytkowników systemu RODEO</p>
              </div>
              <button
                onClick={handleLogout}
                className="flex items-center gap-2 px-6 py-3 bg-red-600 text-white rounded-lg hover:bg-red-700 transition text-base"
              >
                <LogOut className="w-5 h-5" />
                Wyloguj
              </button>
            </div>
            {renderTabs()}
          </div>
          <AIMetricsPanel />
        </div>
      </div>
    );
  }

  if (activeTab === 'rankings') {
    return (
      <div className="min-h-screen bg-gray-50 p-6">
        <div className="max-w-7xl mx-auto space-y-6">
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h1 className="text-3xl font-bold text-gray-900">Panel Analityczny</h1>
                <p className="text-gray-600 mt-1">Analiza zachowań użytkowników systemu RODEO</p>
              </div>
              <button
                onClick={handleLogout}
                className="flex items-center gap-2 px-6 py-3 bg-red-600 text-white rounded-lg hover:bg-red-700 transition text-base"
              >
                <LogOut className="w-5 h-5" />
                Wyloguj
              </button>
            </div>
            {renderTabs()}
          </div>
          <LoginRankingsPanel />
        </div>
      </div>
    );
  }

  if (activeTab === 'sessions') {
    return (
      <div className="min-h-screen bg-gray-50 p-6">
        <div className="max-w-7xl mx-auto space-y-6">
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h1 className="text-3xl font-bold text-gray-900">Panel Analityczny</h1>
                <p className="text-gray-600 mt-1">Analiza zachowań użytkowników systemu RODEO</p>
              </div>
              <button
                onClick={handleLogout}
                className="flex items-center gap-2 px-6 py-3 bg-red-600 text-white rounded-lg hover:bg-red-700 transition text-base"
              >
                <LogOut className="w-5 h-5" />
                Wyloguj
              </button>
            </div>
            {renderTabs()}
          </div>
          <SessionsBrowserPanel />
        </div>
      </div>
    );
  }

  if (activeTab === 'push') {
    return (
      <div className="min-h-screen bg-gray-50 p-6">
        <div className="max-w-7xl mx-auto space-y-6">
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h2 className="text-2xl font-bold text-gray-800">Analityka Push Notifications</h2>
                <p className="text-gray-600">Śledź skuteczność powiadomień push w czasie rzeczywistym</p>
              </div>
              <button
                onClick={() => window.location.reload()}
                className="flex items-center gap-2 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition"
              >
                <LogOut className="w-5 h-5" />
                Wyloguj
              </button>
            </div>
            {renderTabs()}
          </div>
          <PushAnalyticsPanel />
        </div>
      </div>
    );
  }

  if (activeTab === 'products') {
    return (
      <div className="min-h-screen bg-gray-50 p-6">
        <div className="max-w-7xl mx-auto space-y-6">
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h1 className="text-3xl font-bold text-gray-900">Panel Analityczny</h1>
                <p className="text-gray-600 mt-1">Analiza zachowań użytkowników systemu RODEO</p>
              </div>
              <button
                onClick={handleLogout}
                className="flex items-center gap-2 px-6 py-3 bg-red-600 text-white rounded-lg hover:bg-red-700 transition text-base"
              >
                <LogOut className="w-5 h-5" />
                Wyloguj
              </button>
            </div>
            {renderTabs()}
          </div>
          <TopProductsPanel />
        </div>
      </div>
    );
  }

  if (activeTab === 'stores') {
    return (
      <div className="min-h-screen bg-gray-50 p-6">
        <div className="max-w-7xl mx-auto space-y-6">
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h1 className="text-3xl font-bold text-gray-900">Panel Analityczny</h1>
                <p className="text-gray-600 mt-1">Szczegółowa analiza zamówień dla wybranej placówki</p>
              </div>
              <button
                onClick={handleLogout}
                className="flex items-center gap-2 px-6 py-3 bg-red-600 text-white rounded-lg hover:bg-red-700 transition text-base"
              >
                <LogOut className="w-5 h-5" />
                Wyloguj
              </button>
            </div>
            {renderTabs()}
          </div>
          <StoreAnalyticsPanel />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Panel Analityczny</h1>
            <p className="text-gray-600 mt-1">Analiza zachowań użytkowników systemu RODEO</p>
          </div>
            <button
              onClick={handleLogout}
              className="flex items-center gap-2 px-6 py-3 bg-red-600 text-white rounded-lg hover:bg-red-700 transition text-base"
            >
              <LogOut className="w-5 h-5" />
              Wyloguj
            </button>
          </div>

          {renderTabs()}

          <div className="flex gap-3">
            <button
              onClick={handleProcessSessions}
              disabled={processing}
              className="flex items-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition disabled:opacity-50 text-base"
            >
              <RefreshCw className={`w-5 h-5 ${processing ? 'animate-spin' : ''}`} />
              Przetwórz sesje
            </button>
            <button
              onClick={handleRecluster}
              disabled={processing}
              className="flex items-center gap-2 px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition disabled:opacity-50 text-base"
            >
              <Activity className="w-5 h-5" />
              Przegrupuj ścieżki
            </button>
            <button
              onClick={exportData}
              className="flex items-center gap-2 px-6 py-3 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition text-base"
            >
              <Download className="w-5 h-5" />
              Eksportuj
            </button>
          </div>
        </div>

        {/* Filters */}
        <div className="bg-white rounded-lg shadow p-4 flex gap-4 items-center">
          <Filter className="w-5 h-5 text-gray-500" />
          <div className="flex gap-2">
            <label className="text-sm font-medium text-gray-700">Okres:</label>
            <select
              value={timeFilter}
              onChange={(e) => setTimeFilter(e.target.value as any)}
              className="text-sm border border-gray-300 rounded px-3 py-2"
            >
              <option value="today">Dzisiaj</option>
              <option value="week">Ostatni tydzień</option>
              <option value="month">Ostatni miesiąc</option>
              <option value="all">Wszystko</option>
            </select>
          </div>
          <div className="flex gap-2">
            <label className="text-sm font-medium text-gray-700">Rola:</label>
            <select
              value={roleFilter}
              onChange={(e) => setRoleFilter(e.target.value)}
              className="text-sm border border-gray-300 rounded px-3 py-2"
            >
              <option value="all">Wszystkie</option>
              <option value="store_manager">Kierownicy sklepów</option>
              <option value="salesperson">Handlowcy</option>
              <option value="operator">Operatorzy</option>
              <option value="admin">Administratorzy</option>
            </select>
          </div>
        </div>

        {/* KPI Cards */}
        {summary && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-white rounded-lg shadow p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Użytkownicy</p>
                  <p className="text-3xl font-bold text-gray-900 mt-2">{summary.totalUsers}</p>
                </div>
                <Users className="w-12 h-12 text-blue-500" />
              </div>
              <p className="text-xs text-gray-500 mt-4">
                Aktywni dziś: {summary.activeUsersToday} | Tydzień: {summary.activeUsersWeek}
              </p>
            </div>

            <div className="bg-white rounded-lg shadow p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Sesje</p>
                  <p className="text-3xl font-bold text-gray-900 mt-2">{summary.totalSessions}</p>
                </div>
                <Activity className="w-12 h-12 text-green-500" />
              </div>
              <p className="text-xs text-gray-500 mt-4">W wybranym okresie</p>
            </div>

            <div className="bg-white rounded-lg shadow p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Średni czas sesji</p>
                  <p className="text-3xl font-bold text-gray-900 mt-2">{summary.averageSessionDuration}</p>
                </div>
                <Clock className="w-12 h-12 text-amber-500" />
              </div>
              <p className="text-xs text-gray-500 mt-4">Czas spędzony w aplikacji</p>
            </div>

            <div className="bg-white rounded-lg shadow p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Zdarzenia</p>
                  <p className="text-3xl font-bold text-gray-900 mt-2">{summary.totalEvents}</p>
                </div>
                <TrendingUp className="w-12 h-12 text-purple-500" />
              </div>
              <p className="text-xs text-gray-500 mt-4">Wszystkie interakcje</p>
            </div>
          </div>
        )}

        {/* Top Events */}
        {summary && summary.topEvents.length > 0 && (
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
              <BarChart3 className="w-6 h-6" />
              Najpopularniejsze akcje
            </h2>
            <div className="space-y-3">
              {summary.topEvents.map((event, idx) => (
                <div key={idx} className="flex items-center gap-4">
                  <div className="w-32 text-sm font-medium text-gray-700">{event.event_type}</div>
                  <div className="flex-1 bg-gray-200 rounded-full h-8">
                    <div
                      className="bg-blue-600 h-8 rounded-full flex items-center justify-end px-3"
                      style={{ width: `${(event.count / summary.topEvents[0].count) * 100}%` }}
                    >
                      <span className="text-white text-sm font-medium">{event.count}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Path Clusters */}
        {clusters.length > 0 && (
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-xl font-bold text-gray-900 mb-4">Grupy ścieżek użytkowników</h2>
            <div className="space-y-4">
              {clusters.map((cluster) => (
                <div key={cluster.id} className="border border-gray-200 rounded-lg p-4">
                  <div className="flex items-start justify-between mb-3">
                    <div>
                      <h3 className="font-semibold text-base text-gray-900">{cluster.cluster_name}</h3>
                      <p className="text-sm text-gray-600 mt-1 font-mono">
                        {cluster.path_pattern.join(' → ')}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-2xl font-bold text-blue-600">{cluster.total_occurrences}</p>
                      <p className="text-xs text-gray-500">wystąpień</p>
                    </div>
                  </div>
                  <div className="grid grid-cols-3 gap-4 text-sm">
                    <div>
                      <p className="text-gray-600">Ścieżek w grupie</p>
                      <p className="font-semibold text-gray-900">{cluster.paths_count}</p>
                    </div>
                    <div>
                      <p className="text-gray-600">Skuteczność</p>
                      <p className="font-semibold text-green-600">{cluster.average_success_rate.toFixed(1)}%</p>
                    </div>
                    <div>
                      <p className="text-gray-600">Średni czas</p>
                      <p className="font-semibold text-gray-900">{formatInterval(cluster.average_duration)}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Top Paths */}
        {topPaths.length > 0 && (
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-xl font-bold text-gray-900 mb-4">Najczęstsze ścieżki nawigacji</h2>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-gray-200">
                    <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">Ścieżka</th>
                    <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">Wystąpienia</th>
                    <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">Skuteczność</th>
                    <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">Średni czas</th>
                    <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">Ostatnie</th>
                  </tr>
                </thead>
                <tbody>
                  {topPaths.map((path) => (
                    <tr key={path.id} className="border-b border-gray-100 hover:bg-gray-50">
                      <td className="py-3 px-4 text-sm font-mono text-gray-900">
                        {path.path_sequence.join(' → ')}
                      </td>
                      <td className="py-3 px-4 text-sm font-semibold text-gray-900">{path.occurrence_count}</td>
                      <td className="py-3 px-4 text-sm">
                        <span className={`px-2 py-1 rounded ${
                          path.success_rate >= 80 ? 'bg-green-100 text-green-800' :
                          path.success_rate >= 50 ? 'bg-yellow-100 text-yellow-800' :
                          'bg-red-100 text-red-800'
                        }`}>
                          {path.success_rate.toFixed(0)}%
                        </span>
                      </td>
                      <td className="py-3 px-4 text-sm text-gray-700">{formatInterval(path.average_duration)}</td>
                      <td className="py-3 px-4 text-sm text-gray-500">
                        {new Date(path.last_occurred).toLocaleString('pl-PL')}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

      </div>
    </div>
  );
}

function getDateCutoff(filter: 'today' | 'week' | 'month' | 'all'): string {
  const now = new Date();
  switch (filter) {
    case 'today':
      now.setHours(0, 0, 0, 0);
      return now.toISOString();
    case 'week':
      now.setDate(now.getDate() - 7);
      return now.toISOString();
    case 'month':
      now.setDate(now.getDate() - 30);
      return now.toISOString();
    case 'all':
      return new Date('2020-01-01').toISOString();
  }
}

function formatDuration(ms: number): string {
  const minutes = Math.floor(ms / 60000);
  const seconds = Math.floor((ms % 60000) / 1000);
  return `${minutes}m ${seconds}s`;
}

function formatInterval(interval: string): string {
  const parts = interval.split(' ');
  if (parts.length < 2) return interval;

  const value = parseFloat(parts[0]);
  const unit = parts[1];

  if (unit.startsWith('millisecond')) {
    const seconds = Math.floor(value / 1000);
    if (seconds < 60) return `${seconds}s`;
    const minutes = Math.floor(seconds / 60);
    return `${minutes}m ${seconds % 60}s`;
  } else if (unit.startsWith('second')) {
    if (value < 60) return `${Math.floor(value)}s`;
    const minutes = Math.floor(value / 60);
    return `${minutes}m ${Math.floor(value % 60)}s`;
  } else if (unit.startsWith('minute')) {
    return `${Math.floor(value)}m`;
  } else if (unit.startsWith('hour')) {
    return `${value.toFixed(1)}h`;
  }

  return interval;
}
