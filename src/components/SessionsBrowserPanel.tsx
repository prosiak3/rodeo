import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import { Monitor, Smartphone, Tablet, Chrome, Filter, ChevronDown, ChevronUp, MousePointer, Hand, Power, X, Trash2, CheckSquare, Square } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';

interface Session {
  id: string;
  user_id: string;
  user_name: string;
  user_role: string;
  store_name: string;
  session_start: string;
  session_end: string | null;
  device_type: string | null;
  os_name: string | null;
  os_version: string | null;
  browser_name: string | null;
  browser_version: string | null;
  device_vendor: string | null;
  device_model: string | null;
  is_pwa: boolean | null;
  screen_resolution: string | null;
  interaction_type: string | null;
  event_count: number;
  ip_address: string | null;
  disconnected_by: string | null;
  disconnect_reason: string | null;
  can_reconnect: boolean | null;
}

interface FilterOptions {
  deviceType: string;
  osName: string;
  browserName: string;
  isPWA: string;
  userRole: string;
  sessionStatus: string;
}

interface GroupedSessions {
  [key: string]: Session[];
}

export default function SessionsBrowserPanel() {
  const { user } = useAuth();
  const [sessions, setSessions] = useState<Session[]>([]);
  const [filteredSessions, setFilteredSessions] = useState<Session[]>([]);
  const [loading, setLoading] = useState(true);
  const [groupBy, setGroupBy] = useState<'none' | 'device' | 'os' | 'browser' | 'pwa' | 'role'>('none');
  const [expandedGroups, setExpandedGroups] = useState<Set<string>>(new Set());
  const [selectedSessions, setSelectedSessions] = useState<Set<string>>(new Set());
  const [filters, setFilters] = useState<FilterOptions>({
    deviceType: 'all',
    osName: 'all',
    browserName: 'all',
    isPWA: 'all',
    userRole: 'all',
    sessionStatus: 'all'
  });

  useEffect(() => {
    loadSessions(true);

    // Auto-refresh every 15 seconds
    const intervalId = setInterval(() => {
      loadSessions(false); // Don't show loading spinner on auto-refresh
    }, 15000);

    // Cleanup interval on unmount
    return () => clearInterval(intervalId);
  }, []);

  useEffect(() => {
    applyFilters();
  }, [sessions, filters]);

  const loadSessions = async (showLoading = true) => {
    if (showLoading) {
      setLoading(true);
    }
    try {
      const { data, error } = await supabase
        .from('user_sessions')
        .select(`
          *,
          users!user_sessions_user_id_fkey (
            full_name,
            role,
            store_id
          )
        `)
        .order('session_start', { ascending: false })
        .limit(500);

      if (error) {
        console.error('Error loading sessions:', error);
        throw error;
      }

      if (!data || data.length === 0) {
        console.log('No sessions found');
        setSessions([]);
        return;
      }

      const storeIds = [...new Set(data.map((s: any) => s.users?.store_id).filter(Boolean))];

      const storesMap: Record<string, string> = {};
      if (storeIds.length > 0) {
        const { data: storesData } = await supabase
          .from('stores')
          .select('id, name')
          .in('id', storeIds);

        if (storesData) {
          storesData.forEach(store => {
            storesMap[store.id] = store.name;
          });
        }
      }

      const formattedSessions: Session[] = data.map((session: any) => ({
        id: session.id,
        user_id: session.user_id,
        user_name: session.users?.full_name || 'Unknown User',
        user_role: session.users?.role || 'Unknown',
        store_name: session.users?.store_id ? (storesMap[session.users.store_id] || 'N/A') : 'N/A',
        session_start: session.session_start,
        session_end: session.session_end,
        device_type: session.device_type,
        os_name: session.os_name,
        os_version: session.os_version,
        browser_name: session.browser_name,
        browser_version: session.browser_version,
        device_vendor: session.device_vendor,
        device_model: session.device_model,
        is_pwa: session.is_pwa,
        screen_resolution: session.screen_resolution,
        interaction_type: session.interaction_type,
        event_count: 0,
        ip_address: session.ip_address,
        disconnected_by: session.disconnected_by,
        disconnect_reason: session.disconnect_reason,
        can_reconnect: session.can_reconnect
      }));

      console.log('Loaded sessions:', formattedSessions.length);
      setSessions(formattedSessions);
    } catch (error) {
      console.error('Error loading sessions:', error);
      setSessions([]);
    } finally {
      if (showLoading) {
        setLoading(false);
      }
    }
  };


  const disconnectSession = async (sessionId: string, reason: string = 'Ręczne rozłączenie przez administratora') => {
    if (!user?.id) return;

    try {
      const { data, error } = await supabase.rpc('disconnect_session', {
        p_session_id: sessionId,
        p_admin_user_id: user.id,
        p_reason: reason
      });

      if (error) throw error;

      alert('Sesja została rozłączona');
      loadSessions();
    } catch (error) {
      console.error('Error disconnecting session:', error);
      alert('Błąd podczas rozłączania sesji: ' + (error as Error).message);
    }
  };

  const killSession = async (sessionId: string) => {
    if (!user?.id) return;

    if (!confirm('Czy na pewno chcesz ZABIĆ tę sesję? Użytkownik nie będzie mógł do niej powrócić.')) {
      return;
    }

    try {
      const { data, error } = await supabase.rpc('kill_session', {
        p_session_id: sessionId,
        p_admin_user_id: user.id
      });

      if (error) throw error;

      alert('Sesja została zabita');
      loadSessions();
    } catch (error) {
      console.error('Error killing session:', error);
      alert('Błąd podczas zabijania sesji: ' + (error as Error).message);
    }
  };

  const disconnectMultipleSessions = async () => {
    if (!user?.id || selectedSessions.size === 0) return;

    const reason = prompt('Podaj powód rozłączenia sesji:', 'Masowe rozłączenie przez administratora');
    if (!reason) return;

    try {
      const { data, error } = await supabase.rpc('disconnect_multiple_sessions', {
        p_session_ids: Array.from(selectedSessions),
        p_admin_user_id: user.id,
        p_reason: reason
      });

      if (error) throw error;

      alert(`Rozłączono ${data} sesji`);
      setSelectedSessions(new Set());
      loadSessions();
    } catch (error) {
      console.error('Error disconnecting multiple sessions:', error);
      alert('Błąd podczas rozłączania sesji: ' + (error as Error).message);
    }
  };

  const toggleSessionSelection = (sessionId: string) => {
    const newSelection = new Set(selectedSessions);
    if (newSelection.has(sessionId)) {
      newSelection.delete(sessionId);
    } else {
      newSelection.add(sessionId);
    }
    setSelectedSessions(newSelection);
  };

  const toggleSelectAll = () => {
    if (selectedSessions.size === filteredSessions.length) {
      setSelectedSessions(new Set());
    } else {
      setSelectedSessions(new Set(filteredSessions.map(s => s.id)));
    }
  };

  const applyFilters = () => {
    let filtered = [...sessions];

    if (filters.deviceType !== 'all') {
      filtered = filtered.filter(s => s.device_type === filters.deviceType);
    }
    if (filters.osName !== 'all') {
      filtered = filtered.filter(s => s.os_name === filters.osName);
    }
    if (filters.browserName !== 'all') {
      filtered = filtered.filter(s => s.browser_name === filters.browserName);
    }
    if (filters.isPWA !== 'all') {
      const isPWA = filters.isPWA === 'true';
      filtered = filtered.filter(s => s.is_pwa === isPWA);
    }
    if (filters.userRole !== 'all') {
      filtered = filtered.filter(s => s.user_role === filters.userRole);
    }
    if (filters.sessionStatus !== 'all') {
      const now = new Date();
      const thirtyMinutesAgo = new Date(now.getTime() - 30 * 60 * 1000);

      if (filters.sessionStatus === 'active') {
        filtered = filtered.filter(s => !s.session_end);
      } else if (filters.sessionStatus === 'inactive') {
        filtered = filtered.filter(s => s.session_end && new Date(s.session_end) < thirtyMinutesAgo);
      } else if (filters.sessionStatus === 'reconnectable') {
        filtered = filtered.filter(s => s.session_end && s.can_reconnect !== false && new Date(s.session_end) >= thirtyMinutesAgo);
      } else if (filters.sessionStatus === 'disconnected') {
        filtered = filtered.filter(s => s.disconnected_by !== null);
      } else if (filters.sessionStatus === 'killed') {
        filtered = filtered.filter(s => s.can_reconnect === false);
      }
    }

    setFilteredSessions(filtered);
  };

  const getGroupedSessions = (): GroupedSessions => {
    if (groupBy === 'none') return { 'All Sessions': filteredSessions };

    const grouped: GroupedSessions = {};

    filteredSessions.forEach(session => {
      let key = 'Unknown';

      switch (groupBy) {
        case 'device':
          key = session.device_type || 'Unknown';
          break;
        case 'os':
          key = session.os_name ? `${session.os_name} ${session.os_version || ''}`.trim() : 'Unknown';
          break;
        case 'browser':
          key = session.browser_name ? `${session.browser_name} ${session.browser_version || ''}`.trim() : 'Unknown';
          break;
        case 'pwa':
          key = session.is_pwa ? 'PWA' : 'Browser';
          break;
        case 'role':
          key = session.user_role || 'Unknown';
          break;
      }

      if (!grouped[key]) grouped[key] = [];
      grouped[key].push(session);
    });

    return grouped;
  };

  const toggleGroup = (groupName: string) => {
    const newExpanded = new Set(expandedGroups);
    if (newExpanded.has(groupName)) {
      newExpanded.delete(groupName);
    } else {
      newExpanded.add(groupName);
    }
    setExpandedGroups(newExpanded);
  };

  const getDeviceIcon = (deviceType: string | null) => {
    switch (deviceType?.toLowerCase()) {
      case 'mobile':
        return <Smartphone className="w-4 h-4" />;
      case 'tablet':
        return <Tablet className="w-4 h-4" />;
      case 'desktop':
        return <Monitor className="w-4 h-4" />;
      default:
        return <Monitor className="w-4 h-4" />;
    }
  };

  const getSessionStatus = (session: Session) => {
    const now = new Date();
    const thirtyMinutesAgo = new Date(now.getTime() - 30 * 60 * 1000);

    if (session.can_reconnect === false) {
      return {
        label: 'Zabita',
        color: 'bg-red-100 dark:bg-red-900 text-red-800 dark:text-red-200',
        icon: <X className="w-3 h-3" />
      };
    }

    if (session.disconnected_by) {
      return {
        label: 'Rozłączona',
        color: 'bg-orange-100 dark:bg-orange-900 text-orange-800 dark:text-orange-200',
        icon: <Power className="w-3 h-3" />
      };
    }

    if (!session.session_end) {
      return {
        label: 'Aktywna',
        color: 'bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-200',
        icon: <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
      };
    }

    const endDate = new Date(session.session_end);
    if (endDate >= thirtyMinutesAgo) {
      return {
        label: 'Możliwy powrót',
        color: 'bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200',
        icon: <div className="w-2 h-2 bg-blue-500 rounded-full" />
      };
    }

    return {
      label: 'Zakończona',
      color: 'bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-200',
      icon: <div className="w-2 h-2 bg-gray-500 rounded-full" />
    };
  };

  const formatDate = (date: string) => {
    return new Date(date).toLocaleString('pl-PL', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const formatDuration = (startDate: string, endDate: string | null) => {
    if (!endDate) {
      const now = new Date();
      const start = new Date(startDate);
      const durationMs = now.getTime() - start.getTime();
      return formatDurationMs(durationMs) + ' (aktywna)';
    }

    const start = new Date(startDate);
    const end = new Date(endDate);
    const durationMs = end.getTime() - start.getTime();
    return formatDurationMs(durationMs);
  };

  const formatDurationMs = (ms: number) => {
    const seconds = Math.floor(ms / 1000);
    const minutes = Math.floor(seconds / 60);
    const hours = Math.floor(minutes / 60);

    if (hours > 0) {
      return `${hours}h ${minutes % 60}m`;
    } else if (minutes > 0) {
      return `${minutes}m ${seconds % 60}s`;
    } else {
      return `${seconds}s`;
    }
  };

  const uniqueDeviceTypes = Array.from(new Set(sessions.map(s => s.device_type).filter(Boolean)));
  const uniqueOSNames = Array.from(new Set(sessions.map(s => s.os_name).filter(Boolean)));
  const uniqueBrowserNames = Array.from(new Set(sessions.map(s => s.browser_name).filter(Boolean)));
  const uniqueRoles = Array.from(new Set(sessions.map(s => s.user_role).filter(Boolean)));

  const groupedSessions = getGroupedSessions();

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  const calculateStats = () => {
    const stats = {
      byDevice: { mobile: 0, tablet: 0, desktop: 0 },
      byOS: {} as Record<string, number>,
      byBrowser: {} as Record<string, number>,
      byInteraction: { touch: 0, mouse: 0, mixed: 0, unknown: 0 },
      pwaVsBrowser: { pwa: 0, browser: 0 },
      avgDuration: 0,
      activeSessions: 0,
    };

    let totalDuration = 0;
    let sessionsWithDuration = 0;
    const thirtyMinutesAgo = new Date(Date.now() - 30 * 60 * 1000);

    filteredSessions.forEach(session => {
      if (session.device_type) {
        stats.byDevice[session.device_type as keyof typeof stats.byDevice] =
          (stats.byDevice[session.device_type as keyof typeof stats.byDevice] || 0) + 1;
      }

      if (session.os_name) {
        stats.byOS[session.os_name] = (stats.byOS[session.os_name] || 0) + 1;
      }

      if (session.browser_name) {
        stats.byBrowser[session.browser_name] = (stats.byBrowser[session.browser_name] || 0) + 1;
      }

      if (session.interaction_type) {
        stats.byInteraction[session.interaction_type as keyof typeof stats.byInteraction] =
          (stats.byInteraction[session.interaction_type as keyof typeof stats.byInteraction] || 0) + 1;
      } else {
        stats.byInteraction.unknown++;
      }

      if (session.is_pwa) {
        stats.pwaVsBrowser.pwa++;
      } else {
        stats.pwaVsBrowser.browser++;
      }

      if (session.session_end) {
        const start = new Date(session.session_start);
        const end = new Date(session.session_end);
        totalDuration += end.getTime() - start.getTime();
        sessionsWithDuration++;
      } else {
        const sessionStart = new Date(session.session_start);
        if (sessionStart > thirtyMinutesAgo) {
          stats.activeSessions++;
        }
      }
    });

    if (sessionsWithDuration > 0) {
      stats.avgDuration = totalDuration / sessionsWithDuration;
    }

    return stats;
  };

  const stats = calculateStats();

  return (
    <div className="space-y-6 p-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-gray-800 dark:text-white">Przeglądarka sesji</h2>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-4">
          <h3 className="text-sm font-medium text-gray-600 dark:text-gray-400 mb-3">Urządzenia</h3>
          <div className="space-y-2">
            {Object.entries(stats.byDevice).map(([device, count]) => (
              <div key={device} className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  {getDeviceIcon(device)}
                  <span className="text-sm text-gray-800 dark:text-white capitalize">{device}</span>
                </div>
                <span className="text-sm font-semibold text-gray-900 dark:text-white">{count}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-4">
          <h3 className="text-sm font-medium text-gray-600 dark:text-gray-400 mb-3">Systemy operacyjne</h3>
          <div className="space-y-2">
            {Object.entries(stats.byOS).slice(0, 5).map(([os, count]) => (
              <div key={os} className="flex items-center justify-between">
                <span className="text-sm text-gray-800 dark:text-white">{os}</span>
                <span className="text-sm font-semibold text-gray-900 dark:text-white">{count}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-4">
          <h3 className="text-sm font-medium text-gray-600 dark:text-gray-400 mb-3">Typ interakcji</h3>
          <div className="space-y-2">
            {stats.byInteraction.mouse > 0 && (
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <MousePointer className="w-4 h-4 text-purple-500" />
                  <span className="text-sm text-gray-800 dark:text-white">Mysz</span>
                </div>
                <span className="text-sm font-semibold text-gray-900 dark:text-white">{stats.byInteraction.mouse}</span>
              </div>
            )}
            {stats.byInteraction.touch > 0 && (
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Hand className="w-4 h-4 text-blue-500" />
                  <span className="text-sm text-gray-800 dark:text-white">Dotyk</span>
                </div>
                <span className="text-sm font-semibold text-gray-900 dark:text-white">{stats.byInteraction.touch}</span>
              </div>
            )}
            {stats.byInteraction.mixed > 0 && (
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-800 dark:text-white">Mieszane</span>
                <span className="text-sm font-semibold text-gray-900 dark:text-white">{stats.byInteraction.mixed}</span>
              </div>
            )}
            {stats.byInteraction.unknown > 0 && (
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600 dark:text-gray-400">Nieznane</span>
                <span className="text-sm font-semibold text-gray-600 dark:text-gray-400">{stats.byInteraction.unknown}</span>
              </div>
            )}
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-4">
          <h3 className="text-sm font-medium text-gray-600 dark:text-gray-400 mb-3">Czas sesji</h3>
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-800 dark:text-white">Średni czas</span>
              <span className="text-sm font-semibold text-blue-600 dark:text-blue-400">
                {stats.avgDuration > 0 ? formatDurationMs(stats.avgDuration) : 'N/A'}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-800 dark:text-white">Aktywne sesje</span>
              <span className="text-sm font-semibold text-green-600 dark:text-green-400">{stats.activeSessions}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-800 dark:text-white">Zakończone</span>
              <span className="text-sm font-semibold text-gray-600 dark:text-gray-400">
                {filteredSessions.length - stats.activeSessions}
              </span>
            </div>
          </div>
          <div className="mt-3 pt-3 border-t border-gray-200 dark:border-gray-700">
            <div className="text-xs text-gray-600 dark:text-gray-400">
              PWA: {stats.pwaVsBrowser.pwa} | Browser: {stats.pwaVsBrowser.browser}
            </div>
          </div>
        </div>
      </div>

      <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-4">
        <div className="flex items-center gap-2 mb-4">
          <Filter className="w-5 h-5 text-gray-500" />
          <h3 className="font-semibold text-gray-800 dark:text-white">Filtry</h3>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Typ urządzenia
            </label>
            <select
              value={filters.deviceType}
              onChange={(e) => setFilters({ ...filters, deviceType: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
            >
              <option value="all">Wszystkie</option>
              {uniqueDeviceTypes.map(type => (
                <option key={type} value={type}>{type}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              System operacyjny
            </label>
            <select
              value={filters.osName}
              onChange={(e) => setFilters({ ...filters, osName: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
            >
              <option value="all">Wszystkie</option>
              {uniqueOSNames.map(os => (
                <option key={os} value={os}>{os}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Przeglądarka
            </label>
            <select
              value={filters.browserName}
              onChange={(e) => setFilters({ ...filters, browserName: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
            >
              <option value="all">Wszystkie</option>
              {uniqueBrowserNames.map(browser => (
                <option key={browser} value={browser}>{browser}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Tryb PWA
            </label>
            <select
              value={filters.isPWA}
              onChange={(e) => setFilters({ ...filters, isPWA: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
            >
              <option value="all">Wszystkie</option>
              <option value="true">PWA</option>
              <option value="false">Przeglądarka</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Rola użytkownika
            </label>
            <select
              value={filters.userRole}
              onChange={(e) => setFilters({ ...filters, userRole: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
            >
              <option value="all">Wszystkie</option>
              {uniqueRoles.map(role => (
                <option key={role} value={role}>{role}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Status sesji
            </label>
            <select
              value={filters.sessionStatus}
              onChange={(e) => setFilters({ ...filters, sessionStatus: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
            >
              <option value="all">Wszystkie</option>
              <option value="active">Aktywne</option>
              <option value="reconnectable">Rozłączone (możliwy powrót)</option>
              <option value="inactive">Nieaktywne</option>
              <option value="disconnected">Ręcznie rozłączone</option>
              <option value="killed">Zabite (bez powrotu)</option>
            </select>
          </div>
        </div>

        {selectedSessions.size > 0 && (
          <div className="mt-4 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-blue-900 dark:text-blue-100">
                Zaznaczono: {selectedSessions.size} {selectedSessions.size === 1 ? 'sesję' : 'sesji'}
              </span>
              <button
                onClick={disconnectMultipleSessions}
                className="px-4 py-2 bg-orange-500 text-white rounded-lg hover:bg-orange-600 transition-colors flex items-center gap-2"
              >
                <Power className="w-4 h-4" />
                Rozłącz zaznaczone
              </button>
            </div>
          </div>
        )}

        <div className="mt-4">
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            Grupuj według
          </label>
          <select
            value={groupBy}
            onChange={(e) => setGroupBy(e.target.value as any)}
            className="w-full md:w-64 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
          >
            <option value="none">Bez grupowania</option>
            <option value="device">Typ urządzenia</option>
            <option value="os">System operacyjny</option>
            <option value="browser">Przeglądarka</option>
            <option value="pwa">PWA / Przeglądarka</option>
            <option value="role">Rola użytkownika</option>
          </select>
        </div>
      </div>

      {Object.entries(groupedSessions).map(([groupName, groupSessions]) => (
        <div key={groupName} className="bg-white dark:bg-gray-800 rounded-lg shadow">
          {groupBy !== 'none' && (
            <div
              className="p-4 border-b border-gray-200 dark:border-gray-700 flex items-center justify-between cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-700"
              onClick={() => toggleGroup(groupName)}
            >
              <div className="flex items-center gap-3">
                <h3 className="text-lg font-semibold text-gray-800 dark:text-white">{groupName}</h3>
                <span className="px-3 py-1 bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200 rounded-full text-sm font-medium">
                  {groupSessions.length} sesji
                </span>
              </div>
              {expandedGroups.has(groupName) ? (
                <ChevronUp className="w-5 h-5 text-gray-500" />
              ) : (
                <ChevronDown className="w-5 h-5 text-gray-500" />
              )}
            </div>
          )}

          {(groupBy === 'none' || expandedGroups.has(groupName)) && (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 dark:bg-gray-900">
                  <tr>
                    <th className="px-4 py-3 text-left w-12">
                      <input
                        type="checkbox"
                        checked={selectedSessions.size === groupSessions.length && groupSessions.length > 0}
                        onChange={toggleSelectAll}
                        className="rounded border-gray-300 dark:border-gray-600 cursor-pointer"
                        title="Zaznacz wszystkie"
                      />
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                      Użytkownik
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                      IP Address
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                      Urządzenie
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                      System / Przeglądarka
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                      Status
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                      Czas trwania
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                      Rozpoczęcie
                    </th>
                    <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                      Akcje
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                  {groupSessions.map((session) => {
                    const status = getSessionStatus(session);
                    const isSelected = selectedSessions.has(session.id);

                    return (
                      <tr
                        key={session.id}
                        className={`hover:bg-gray-50 dark:hover:bg-gray-700 ${isSelected ? 'bg-blue-50 dark:bg-blue-900/20' : ''}`}
                      >
                        <td className="px-4 py-4">
                          <input
                            type="checkbox"
                            checked={isSelected}
                            onChange={() => toggleSessionSelection(session.id)}
                            className="rounded border-gray-300 dark:border-gray-600 cursor-pointer"
                          />
                        </td>
                        <td className="px-6 py-4 text-sm">
                          <div>
                            <div className="font-medium text-gray-900 dark:text-white">{session.user_name}</div>
                            <div className="text-xs text-gray-600 dark:text-gray-400">{session.user_role}</div>
                          </div>
                        </td>
                        <td className="px-6 py-4 text-sm">
                          <div className="font-mono text-xs text-gray-700 dark:text-gray-300">
                            {session.ip_address || <span className="text-gray-400">N/A</span>}
                          </div>
                        </td>
                        <td className="px-6 py-4 text-sm">
                          <div className="flex items-center gap-2 text-gray-900 dark:text-white">
                            {getDeviceIcon(session.device_type)}
                            <div>
                              <div className="font-medium">{session.device_type || 'Unknown'}</div>
                              {session.is_pwa && (
                                <span className="text-xs px-1.5 py-0.5 bg-green-100 dark:bg-green-900 text-green-700 dark:text-green-300 rounded">PWA</span>
                              )}
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-900 dark:text-white">
                          <div className="space-y-1">
                            <div className="flex items-center gap-1">
                              <span className="text-gray-600 dark:text-gray-400 text-xs">OS:</span>
                              <span>{session.os_name || 'Unknown'} {session.os_version}</span>
                            </div>
                            <div className="flex items-center gap-1">
                              <Chrome className="w-3 h-3 text-gray-400" />
                              <span className="text-xs">{session.browser_name || 'Unknown'} {session.browser_version}</span>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 text-sm">
                          <div className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium ${status.color}`}>
                            {status.icon}
                            <span>{status.label}</span>
                          </div>
                          {session.disconnect_reason && (
                            <div className="text-xs text-gray-500 dark:text-gray-400 mt-1" title={session.disconnect_reason}>
                              {session.disconnect_reason.substring(0, 30)}...
                            </div>
                          )}
                        </td>
                        <td className="px-6 py-4 text-sm">
                          <div className="text-gray-900 dark:text-white font-medium">
                            {formatDuration(session.session_start, session.session_end)}
                          </div>
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-600 dark:text-gray-400">
                          {formatDate(session.session_start)}
                        </td>
                        <td className="px-6 py-4 text-sm">
                          <div className="flex items-center justify-center gap-2">
                            {!session.session_end && (
                              <>
                                <button
                                  onClick={() => disconnectSession(session.id)}
                                  className="p-1.5 text-orange-600 hover:bg-orange-50 dark:hover:bg-orange-900/20 rounded transition-colors"
                                  title="Rozłącz sesję"
                                >
                                  <Power className="w-4 h-4" />
                                </button>
                                <button
                                  onClick={() => killSession(session.id)}
                                  className="p-1.5 text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded transition-colors"
                                  title="Zabij sesję"
                                >
                                  <Trash2 className="w-4 h-4" />
                                </button>
                              </>
                            )}
                            {session.session_end && session.can_reconnect !== false && (
                              <span className="text-xs text-gray-400">Zakończona</span>
                            )}
                            {session.can_reconnect === false && (
                              <span className="text-xs text-red-500 font-medium">Zabita</span>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      ))}

      {filteredSessions.length === 0 && (
        <div className="text-center py-12 text-gray-500 dark:text-gray-400 bg-white dark:bg-gray-800 rounded-lg shadow">
          Brak sesji spełniających wybrane kryteria
        </div>
      )}
    </div>
  );
}
