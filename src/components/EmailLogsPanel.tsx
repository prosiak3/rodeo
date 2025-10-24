import { useState, useEffect } from 'react';
import { Mail, RefreshCw, CheckCircle, XCircle, Clock, Search, Calendar } from 'lucide-react';
import { supabase } from '../lib/supabase';

interface EmailLog {
  id: string;
  order_id: string;
  recipient_email: string;
  subject: string;
  status: 'pending' | 'sent' | 'failed';
  sent_at: string | null;
  error_message: string | null;
  retry_count: number;
  created_at: string;
  order?: {
    order_number: string;
    store?: {
      name: string;
      code: string;
    };
  };
}

export default function EmailLogsPanel() {
  const [logs, setLogs] = useState<EmailLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'sent' | 'failed' | 'pending'>('all');
  const [dateFilter, setDateFilter] = useState<'all' | 'today' | 'week' | 'month'>('all');

  useEffect(() => {
    loadLogs();
  }, []);

  const loadLogs = async () => {
    setLoading(true);
    try {
      let query = supabase
        .from('email_notifications')
        .select(`
          *,
          order:order_id (
            order_number,
            store:store_id (
              name,
              code
            )
          )
        `)
        .order('created_at', { ascending: false })
        .limit(100);

      const { data, error } = await query;

      if (error) throw error;
      setLogs(data || []);
    } catch (error) {
      console.error('Error loading email logs:', error);
      alert('Błąd podczas ładowania logów emaili');
    } finally {
      setLoading(false);
    }
  };

  const retryEmail = async (orderId: string) => {
    if (!confirm('Czy na pewno chcesz ponownie wysłać email dla tego zamówienia?')) {
      return;
    }

    try {
      const { data, error } = await supabase.functions.invoke('send-order-email', {
        body: { orderId }
      });

      if (error) throw error;

      alert('Email został ponownie wysłany!');
      loadLogs();
    } catch (error) {
      console.error('Error retrying email:', error);
      alert('Błąd podczas ponownego wysyłania emaila');
    }
  };

  const getFilteredLogs = () => {
    let filtered = logs;

    if (statusFilter !== 'all') {
      filtered = filtered.filter(log => log.status === statusFilter);
    }

    if (dateFilter !== 'all') {
      const now = new Date();
      const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
      const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
      const monthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

      filtered = filtered.filter(log => {
        const logDate = new Date(log.created_at);
        if (dateFilter === 'today') {
          return logDate >= today;
        } else if (dateFilter === 'week') {
          return logDate >= weekAgo;
        } else if (dateFilter === 'month') {
          return logDate >= monthAgo;
        }
        return true;
      });
    }

    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(log =>
        log.order?.order_number.toLowerCase().includes(query) ||
        log.recipient_email.toLowerCase().includes(query) ||
        log.order?.store?.name.toLowerCase().includes(query) ||
        log.subject.toLowerCase().includes(query)
      );
    }

    return filtered;
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString('pl-PL', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const filteredLogs = getFilteredLogs();

  const stats = {
    total: logs.length,
    sent: logs.filter(l => l.status === 'sent').length,
    failed: logs.filter(l => l.status === 'failed').length,
    pending: logs.filter(l => l.status === 'pending').length,
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-amber-600"></div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      <div className="bg-white rounded-xl shadow-lg p-6">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <Mail className="w-6 h-6 text-amber-600" />
            <h2 className="text-2xl font-bold text-gray-800">Logi wysłanych emaili</h2>
          </div>
          <button
            onClick={loadLogs}
            className="flex items-center gap-2 px-4 py-2 bg-amber-600 text-white rounded-lg hover:bg-amber-700 transition"
          >
            <RefreshCw className="w-4 h-4" />
            Odśwież
          </button>
        </div>

        <div className="grid grid-cols-4 gap-4 mb-6">
          <div className="bg-blue-50 rounded-lg p-4">
            <div className="flex items-center gap-2 mb-2">
              <Mail className="w-5 h-5 text-blue-600" />
              <span className="text-sm text-blue-600 font-medium">Wszystkie</span>
            </div>
            <div className="text-2xl font-bold text-blue-700">{stats.total}</div>
          </div>
          <div className="bg-green-50 rounded-lg p-4">
            <div className="flex items-center gap-2 mb-2">
              <CheckCircle className="w-5 h-5 text-green-600" />
              <span className="text-sm text-green-600 font-medium">Wysłane</span>
            </div>
            <div className="text-2xl font-bold text-green-700">{stats.sent}</div>
          </div>
          <div className="bg-red-50 rounded-lg p-4">
            <div className="flex items-center gap-2 mb-2">
              <XCircle className="w-5 h-5 text-red-600" />
              <span className="text-sm text-red-600 font-medium">Błędy</span>
            </div>
            <div className="text-2xl font-bold text-red-700">{stats.failed}</div>
          </div>
          <div className="bg-yellow-50 rounded-lg p-4">
            <div className="flex items-center gap-2 mb-2">
              <Clock className="w-5 h-5 text-yellow-600" />
              <span className="text-sm text-yellow-600 font-medium">Oczekujące</span>
            </div>
            <div className="text-2xl font-bold text-yellow-700">{stats.pending}</div>
          </div>
        </div>

        <div className="flex gap-3 mb-6">
          <div className="flex-1 relative">
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Szukaj po numerze zamówienia, sklepie, emailu..."
              className="w-full p-3 pr-10 border-2 border-gray-300 rounded-lg focus:border-amber-500 focus:outline-none"
            />
            <Search className="absolute right-3 top-3 w-5 h-5 text-gray-400" />
          </div>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value as any)}
            className="p-3 border-2 border-gray-300 rounded-lg focus:border-amber-500 focus:outline-none"
          >
            <option value="all">Wszystkie statusy</option>
            <option value="sent">Wysłane</option>
            <option value="failed">Błędy</option>
            <option value="pending">Oczekujące</option>
          </select>
          <select
            value={dateFilter}
            onChange={(e) => setDateFilter(e.target.value as any)}
            className="p-3 border-2 border-gray-300 rounded-lg focus:border-amber-500 focus:outline-none"
          >
            <option value="all">Cały okres</option>
            <option value="today">Dzisiaj</option>
            <option value="week">Ostatnie 7 dni</option>
            <option value="month">Ostatnie 30 dni</option>
          </select>
        </div>

        {filteredLogs.length === 0 ? (
          <div className="text-center py-12 text-gray-500">
            <Mail className="w-16 h-16 mx-auto mb-4 text-gray-300" />
            <p className="text-lg font-medium">Brak logów emaili</p>
            <p className="text-sm mt-2">Nie znaleziono żadnych rekordów wysyłki emaili</p>
          </div>
        ) : (
          <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600">Data</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600">Zamówienie</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600">Sklep</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600">Odbiorca</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600">Status</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600">Próby</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600">Akcje</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {filteredLogs.map((log) => (
                  <tr key={log.id} className="hover:bg-gray-50 transition">
                    <td className="px-4 py-3 text-sm text-gray-600">
                      {formatDate(log.sent_at || log.created_at)}
                    </td>
                    <td className="px-4 py-3">
                      <div className="font-medium text-gray-900">
                        {log.order?.order_number || 'N/A'}
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <div className="text-sm text-gray-600">
                        {log.order?.store?.name || 'N/A'}
                      </div>
                      <div className="text-xs text-gray-500">
                        {log.order?.store?.code || ''}
                      </div>
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-600">
                      {log.recipient_email}
                    </td>
                    <td className="px-4 py-3">
                      {log.status === 'sent' && (
                        <span className="inline-flex items-center gap-1 px-2 py-1 bg-green-100 text-green-800 rounded-full text-xs font-medium">
                          <CheckCircle className="w-3 h-3" />
                          Wysłane
                        </span>
                      )}
                      {log.status === 'failed' && (
                        <span className="inline-flex items-center gap-1 px-2 py-1 bg-red-100 text-red-800 rounded-full text-xs font-medium">
                          <XCircle className="w-3 h-3" />
                          Błąd
                        </span>
                      )}
                      {log.status === 'pending' && (
                        <span className="inline-flex items-center gap-1 px-2 py-1 bg-yellow-100 text-yellow-800 rounded-full text-xs font-medium">
                          <Clock className="w-3 h-3" />
                          Oczekuje
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-600">
                      {log.retry_count}
                    </td>
                    <td className="px-4 py-3">
                      {log.status === 'failed' && (
                        <button
                          onClick={() => retryEmail(log.order_id)}
                          className="inline-flex items-center gap-1 px-3 py-1 bg-blue-600 text-white rounded hover:bg-blue-700 transition text-xs"
                        >
                          <RefreshCw className="w-3 h-3" />
                          Ponów
                        </button>
                      )}
                      {log.error_message && (
                        <div className="mt-1 text-xs text-red-600">
                          {log.error_message}
                        </div>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
