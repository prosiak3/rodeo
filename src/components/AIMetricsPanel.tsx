import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import { embeddingsManager, ProductEmbedding } from '../lib/embeddingsManager';
import { Activity, TrendingUp, AlertCircle, Clock, CheckCircle, XCircle, Database, Download, Upload, Trash2, Edit2, Save, X, MessageSquare } from 'lucide-react';
import VoiceLearningPanel from './VoiceLearningPanel';

interface AIMetric {
  id: string;
  metric_type: string;
  operation_name: string;
  duration_ms: number;
  input_size: number;
  output_size: number;
  success: boolean;
  error_message?: string;
  metadata?: any;
  created_at: string;
}

interface ModelPerformance {
  model_name: string;
  total_operations: number;
  successful_operations: number;
  average_duration_ms: number;
  last_updated: string;
}

interface MetricsSummary {
  totalOperations: number;
  successRate: number;
  avgDuration: number;
  recentErrors: number;
}

export default function AIMetricsPanel() {
  const [metrics, setMetrics] = useState<AIMetric[]>([]);
  const [modelPerformance, setModelPerformance] = useState<ModelPerformance[]>([]);
  const [summary, setSummary] = useState<MetricsSummary>({
    totalOperations: 0,
    successRate: 0,
    avgDuration: 0,
    recentErrors: 0
  });
  const [loading, setLoading] = useState(true);
  const [timeRange, setTimeRange] = useState<'1h' | '24h' | '7d' | '30d'>('24h');
  const [activeTab, setActiveTab] = useState<'metrics' | 'cache' | 'learning'>('metrics');
  const [cacheData, setCacheData] = useState<ProductEmbedding[]>([]);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editedEmbedding, setEditedEmbedding] = useState<ProductEmbedding | null>(null);

  useEffect(() => {
    if (activeTab === 'metrics') {
      loadMetrics();
    } else {
      loadCache();
    }
  }, [timeRange, activeTab]);

  const loadMetrics = async () => {
    setLoading(true);
    try {
      const now = new Date();
      let startDate = new Date();

      switch (timeRange) {
        case '1h':
          startDate.setHours(now.getHours() - 1);
          break;
        case '24h':
          startDate.setDate(now.getDate() - 1);
          break;
        case '7d':
          startDate.setDate(now.getDate() - 7);
          break;
        case '30d':
          startDate.setDate(now.getDate() - 30);
          break;
      }

      const { data: metricsData, error: metricsError } = await supabase
        .from('ai_metrics')
        .select('*')
        .gte('created_at', startDate.toISOString())
        .order('created_at', { ascending: false })
        .limit(100);

      if (metricsError) throw metricsError;

      const { data: performanceData, error: performanceError } = await supabase
        .from('ai_model_performance')
        .select('*');

      if (performanceError) throw performanceError;

      setMetrics(metricsData || []);
      setModelPerformance(performanceData || []);

      if (metricsData && metricsData.length > 0) {
        const total = metricsData.length;
        const successful = metricsData.filter(m => m.success).length;
        const avgDur = metricsData.reduce((sum, m) => sum + m.duration_ms, 0) / total;
        const errors = metricsData.filter(m => !m.success).length;

        setSummary({
          totalOperations: total,
          successRate: (successful / total) * 100,
          avgDuration: avgDur,
          recentErrors: errors
        });
      }
    } catch (error) {
      console.error('Error loading metrics:', error);
    } finally {
      setLoading(false);
    }
  };

  const getMetricTypeIcon = (type: string) => {
    switch (type) {
      case 'embedding_generation':
        return <Activity className="w-4 h-4" />;
      case 'similarity_search':
        return <TrendingUp className="w-4 h-4" />;
      case 'clustering_operation':
        return <Activity className="w-4 h-4" />;
      default:
        return <Activity className="w-4 h-4" />;
    }
  };

  const formatDuration = (ms: number) => {
    if (ms < 1000) return `${ms}ms`;
    return `${(ms / 1000).toFixed(2)}s`;
  };

  const formatDate = (date: string) => {
    return new Date(date).toLocaleString('pl-PL', {
      day: '2-digit',
      month: '2-digit',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const loadCache = async () => {
    setLoading(true);
    try {
      const embeddings = await embeddingsManager.getAllCachedEmbeddings();
      setCacheData(embeddings);
    } catch (error) {
      console.error('Error loading cache:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleExportCache = async () => {
    try {
      const jsonData = await embeddingsManager.exportCache();
      const blob = new Blob([jsonData], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `ai-cache-${new Date().toISOString().split('T')[0]}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Error exporting cache:', error);
      alert('Błąd podczas eksportu pamięci podręcznej');
    }
  };

  const handleImportCache = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    try {
      const text = await file.text();
      const result = await embeddingsManager.importCache(text);
      alert(`Import zakończony!\nZaimportowano: ${result.success}\nBłędy: ${result.failed}`);
      await loadCache();
    } catch (error) {
      console.error('Error importing cache:', error);
      alert('Błąd podczas importu: nieprawidłowy format pliku');
    }
  };

  const handleClearCache = async () => {
    if (!confirm('Czy na pewno chcesz wyczyścić całą pamięć podręczną AI?')) return;

    try {
      await embeddingsManager.clearCache();
      await loadCache();
      alert('Pamięć podręczna została wyczyszczona');
    } catch (error) {
      console.error('Error clearing cache:', error);
      alert('Błąd podczas czyszczenia pamięci podręcznej');
    }
  };

  const handleEditEmbedding = (embedding: ProductEmbedding) => {
    setEditingId(embedding.productId);
    setEditedEmbedding({ ...embedding });
  };

  const handleSaveEmbedding = async () => {
    if (!editedEmbedding) return;

    try {
      await embeddingsManager.updateCachedEmbedding(editedEmbedding);
      await loadCache();
      setEditingId(null);
      setEditedEmbedding(null);
    } catch (error) {
      console.error('Error saving embedding:', error);
      alert('Błąd podczas zapisywania');
    }
  };

  const handleCancelEdit = () => {
    setEditingId(null);
    setEditedEmbedding(null);
  };

  const handleDeleteEmbedding = async (productId: string) => {
    if (!confirm('Czy na pewno chcesz usunąć ten embedding?')) return;

    try {
      await embeddingsManager.deleteCachedEmbedding(productId);
      await loadCache();
    } catch (error) {
      console.error('Error deleting embedding:', error);
      alert('Błąd podczas usuwania');
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6 p-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-gray-800 dark:text-white">Metryki AI</h2>
        <div className="flex gap-2">
          {activeTab === 'metrics' && (['1h', '24h', '7d', '30d'] as const).map((range) => (
            <button
              key={range}
              onClick={() => setTimeRange(range)}
              className={`px-3 py-1 rounded-lg text-sm font-medium transition-colors ${
                timeRange === range
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
              }`}
            >
              {range === '1h' ? '1 godz' : range === '24h' ? '24 godz' : range === '7d' ? '7 dni' : '30 dni'}
            </button>
          ))}
        </div>
      </div>

      <div className="flex gap-2 border-b border-gray-200 dark:border-gray-700">
        <button
          onClick={() => setActiveTab('metrics')}
          className={`flex items-center gap-2 px-4 py-2 font-medium transition-colors ${
            activeTab === 'metrics'
              ? 'text-blue-600 dark:text-blue-400 border-b-2 border-blue-600 dark:border-blue-400'
              : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
          }`}
        >
          <Activity className="w-5 h-5" />
          Metryki
        </button>
        <button
          onClick={() => setActiveTab('learning')}
          className={`flex items-center gap-2 px-4 py-2 font-medium transition-colors ${
            activeTab === 'learning'
              ? 'text-blue-600 dark:text-blue-400 border-b-2 border-blue-600 dark:border-blue-400'
              : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
          }`}
        >
          <MessageSquare className="w-5 h-5" />
          Nauka głosowa
        </button>
        <button
          onClick={() => setActiveTab('cache')}
          className={`flex items-center gap-2 px-4 py-2 font-medium transition-colors ${
            activeTab === 'cache'
              ? 'text-blue-600 dark:text-blue-400 border-b-2 border-blue-600 dark:border-blue-400'
              : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
          }`}
        >
          <Database className="w-5 h-5" />
          Pamięć podręczna
        </button>
      </div>

      {activeTab === 'metrics' ? (
        <>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">Operacje</p>
              <p className="text-3xl font-bold text-gray-900 dark:text-white">{summary.totalOperations}</p>
            </div>
            <Activity className="w-8 h-8 text-blue-600" />
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">Sukces</p>
              <p className="text-3xl font-bold text-green-600">{summary.successRate.toFixed(1)}%</p>
            </div>
            <CheckCircle className="w-8 h-8 text-green-600" />
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">Średni czas</p>
              <p className="text-3xl font-bold text-gray-900 dark:text-white">{formatDuration(summary.avgDuration)}</p>
            </div>
            <Clock className="w-8 h-8 text-blue-600" />
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">Błędy</p>
              <p className="text-3xl font-bold text-red-600">{summary.recentErrors}</p>
            </div>
            <XCircle className="w-8 h-8 text-red-600" />
          </div>
        </div>
      </div>

      {modelPerformance.length > 0 && (
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow">
          <div className="p-6 border-b border-gray-200 dark:border-gray-700">
            <h3 className="text-lg font-semibold text-gray-800 dark:text-white">Wydajność modelu</h3>
          </div>
          <div className="p-6 space-y-4">
            {modelPerformance.map((model) => (
              <div key={model.model_name} className="border border-gray-200 dark:border-gray-700 rounded-lg p-4">
                <div className="flex items-center justify-between mb-2">
                  <h4 className="font-medium text-gray-900 dark:text-white">{model.model_name}</h4>
                  <span className="text-sm text-gray-600 dark:text-gray-400">
                    {formatDate(model.last_updated)}
                  </span>
                </div>
                <div className="grid grid-cols-3 gap-4 text-sm">
                  <div>
                    <p className="text-gray-600 dark:text-gray-400">Operacje</p>
                    <p className="font-semibold text-gray-900 dark:text-white">{model.total_operations}</p>
                  </div>
                  <div>
                    <p className="text-gray-600 dark:text-gray-400">Sukces</p>
                    <p className="font-semibold text-green-600">
                      {((model.successful_operations / model.total_operations) * 100).toFixed(1)}%
                    </p>
                  </div>
                  <div>
                    <p className="text-gray-600 dark:text-gray-400">Śr. czas</p>
                    <p className="font-semibold text-gray-900 dark:text-white">
                      {formatDuration(Number(model.average_duration_ms))}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="bg-white dark:bg-gray-800 rounded-lg shadow">
        <div className="p-6 border-b border-gray-200 dark:border-gray-700">
          <h3 className="text-lg font-semibold text-gray-800 dark:text-white">Ostatnie operacje</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 dark:bg-gray-900">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Typ
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Operacja
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Czas
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Wejście
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Wyjście
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Data
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
              {metrics.map((metric) => (
                <tr key={metric.id} className="hover:bg-gray-50 dark:hover:bg-gray-700">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center gap-2 text-gray-900 dark:text-white">
                      {getMetricTypeIcon(metric.metric_type)}
                      <span className="text-sm">{metric.metric_type}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                    {metric.operation_name}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                    {formatDuration(metric.duration_ms)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600 dark:text-gray-400">
                    {metric.input_size}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600 dark:text-gray-400">
                    {metric.output_size}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    {metric.success ? (
                      <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-200">
                        <CheckCircle className="w-3 h-3" />
                        Sukces
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium bg-red-100 dark:bg-red-900 text-red-800 dark:text-red-200">
                        <AlertCircle className="w-3 h-3" />
                        Błąd
                      </span>
                    )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600 dark:text-gray-400">
                    {formatDate(metric.created_at)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {metrics.length === 0 && (
            <div className="text-center py-12 text-gray-500 dark:text-gray-400">
              Brak danych dla wybranego okresu
            </div>
          )}
        </div>
      </div>
      </>
      ) : activeTab === 'learning' ? (
        <VoiceLearningPanel />
      ) : (
        <div className="space-y-4">
          <div className="flex gap-3">
            <button
              onClick={handleExportCache}
              className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
            >
              <Download className="w-5 h-5" />
              Eksportuj cache
            </button>
            <label className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition cursor-pointer">
              <Upload className="w-5 h-5" />
              Importuj cache
              <input
                type="file"
                accept=".json"
                onChange={handleImportCache}
                className="hidden"
              />
            </label>
            <button
              onClick={handleClearCache}
              className="flex items-center gap-2 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition"
            >
              <Trash2 className="w-5 h-5" />
              Wyczyść cache
            </button>
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-lg shadow">
            <div className="p-6 border-b border-gray-200 dark:border-gray-700">
              <h3 className="text-lg font-semibold text-gray-800 dark:text-white">
                Pamięć podręczna AI ({cacheData.length} embeddingów)
              </h3>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 dark:bg-gray-900">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      Produkt
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      Index
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      Wymiary
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      Akcje
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                  {cacheData.map((embedding) => (
                    <tr key={embedding.productId} className="hover:bg-gray-50 dark:hover:bg-gray-700">
                      <td className="px-6 py-4 text-sm text-gray-900 dark:text-white">
                        {editingId === embedding.productId ? (
                          <input
                            type="text"
                            value={editedEmbedding?.name || ''}
                            onChange={(e) => setEditedEmbedding({ ...editedEmbedding!, name: e.target.value })}
                            className="w-full px-2 py-1 border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                          />
                        ) : (
                          embedding.name
                        )}
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-600 dark:text-gray-400">
                        {editingId === embedding.productId ? (
                          <input
                            type="text"
                            value={editedEmbedding?.index || ''}
                            onChange={(e) => setEditedEmbedding({ ...editedEmbedding!, index: e.target.value })}
                            className="w-full px-2 py-1 border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                          />
                        ) : (
                          embedding.index
                        )}
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-600 dark:text-gray-400">
                        {embedding.embedding.length}D
                      </td>
                      <td className="px-6 py-4">
                        {editingId === embedding.productId ? (
                          <div className="flex gap-2">
                            <button
                              onClick={handleSaveEmbedding}
                              className="text-green-600 hover:text-green-700"
                            >
                              <Save className="w-5 h-5" />
                            </button>
                            <button
                              onClick={handleCancelEdit}
                              className="text-gray-600 hover:text-gray-700"
                            >
                              <X className="w-5 h-5" />
                            </button>
                          </div>
                        ) : (
                          <div className="flex gap-2">
                            <button
                              onClick={() => handleEditEmbedding(embedding)}
                              className="text-blue-600 hover:text-blue-700"
                            >
                              <Edit2 className="w-5 h-5" />
                            </button>
                            <button
                              onClick={() => handleDeleteEmbedding(embedding.productId)}
                              className="text-red-600 hover:text-red-700"
                            >
                              <Trash2 className="w-5 h-5" />
                            </button>
                          </div>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {cacheData.length === 0 && (
                <div className="text-center py-12 text-gray-500 dark:text-gray-400">
                  Pamięć podręczna jest pusta
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
