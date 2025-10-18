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
  const [activeTab, setActiveTab] = useState<'metrics' | 'cache' | 'learning' | 'failures'>('metrics');
  const [cacheData, setCacheData] = useState<ProductEmbedding[]>([]);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editedEmbedding, setEditedEmbedding] = useState<ProductEmbedding | null>(null);
  const [failedAttempts, setFailedAttempts] = useState<any[]>([]);
  const [expandedAttempts, setExpandedAttempts] = useState<Set<string>>(new Set());

  useEffect(() => {
    if (activeTab === 'metrics') {
      loadMetrics();
    } else if (activeTab === 'failures') {
      loadFailedAttempts();
    } else if (activeTab === 'cache') {
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

  const formatFullDate = (date: string) => {
    return new Date(date).toLocaleString('pl-PL', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit'
    });
  };

  const toggleAttemptDetails = (id: string) => {
    const newExpanded = new Set(expandedAttempts);
    if (newExpanded.has(id)) {
      newExpanded.delete(id);
    } else {
      newExpanded.add(id);
    }
    setExpandedAttempts(newExpanded);
  };

  const loadFailedAttempts = async () => {
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

      const { data, error } = await supabase
        .from('voice_recognition_attempts')
        .select(`
          *,
          user:users(full_name),
          initial_product:products!voice_recognition_attempts_initial_product_id_fkey(name),
          final_product:products!voice_recognition_attempts_final_product_id_fkey(name)
        `)
        .or('confidence_score.eq.0,was_corrected.eq.true')
        .gte('timestamp', startDate.toISOString())
        .order('timestamp', { ascending: false })
        .limit(100);

      if (error) throw error;
      setFailedAttempts(data || []);
    } catch (error) {
      console.error('Error loading failed attempts:', error);
      setFailedAttempts([]);
    } finally {
      setLoading(false);
    }
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
          onClick={() => setActiveTab('failures')}
          className={`flex items-center gap-2 px-4 py-2 font-medium transition-colors ${
            activeTab === 'failures'
              ? 'text-blue-600 dark:text-blue-400 border-b-2 border-blue-600 dark:border-blue-400'
              : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
          }`}
        >
          <AlertCircle className="w-5 h-5" />
          Nierozpoznane próby
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

      {activeTab === 'failures' ? (
        <div className="space-y-4">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
            <h3 className="text-lg font-semibold text-gray-800 dark:text-white mb-4">
              Nierozpoznane próby i korekty użytkowników
            </h3>

            {failedAttempts.length === 0 ? (
              <div className="text-center py-12 text-gray-500 dark:text-gray-400">
                <AlertCircle className="w-12 h-12 mx-auto mb-3 opacity-50" />
                <p>Brak nierozpoznanych prób w wybranym okresie</p>
              </div>
            ) : (
              <div className="space-y-3">
                {failedAttempts.map((attempt) => {
                  const isExpanded = expandedAttempts.has(attempt.id);
                  return (
                    <div
                      key={attempt.id}
                      className="border border-gray-200 dark:border-gray-700 rounded-lg p-4 hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors"
                    >
                      <div className="flex items-start justify-between mb-2">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <span className={`px-2 py-1 rounded text-xs font-medium ${
                              attempt.confidence_score === 0
                                ? 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400'
                                : 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400'
                            }`}>
                              {attempt.confidence_score === 0 ? 'Nie rozpoznano' : 'Poprawiono'}
                            </span>
                            {attempt.user?.full_name && (
                              <span className="text-xs text-gray-500 dark:text-gray-400">
                                {attempt.user.full_name}
                              </span>
                            )}
                            <span className="text-xs text-gray-400 dark:text-gray-500">
                              {formatDate(attempt.timestamp)}
                            </span>
                          </div>

                        <div className="space-y-1">
                          <div className="flex items-start gap-2">
                            <span className="text-sm font-medium text-gray-600 dark:text-gray-400 min-w-[120px]">
                              Fraza oryginalna:
                            </span>
                            <span className="text-sm text-gray-900 dark:text-white font-mono bg-gray-100 dark:bg-gray-900 px-2 py-1 rounded">
                              "{attempt.original_phrase}"
                            </span>
                          </div>

                          {attempt.initial_product?.name && (
                            <div className="flex items-start gap-2">
                              <span className="text-sm font-medium text-gray-600 dark:text-gray-400 min-w-[120px]">
                                AI zasugerował:
                              </span>
                              <span className="text-sm text-gray-700 dark:text-gray-300">
                                {attempt.initial_product.name}
                                <span className="ml-2 text-xs text-gray-500">
                                  ({attempt.confidence_score}% pewności)
                                </span>
                              </span>
                            </div>
                          )}

                          {attempt.final_product?.name && (
                            <div className="flex items-start gap-2">
                              <span className="text-sm font-medium text-gray-600 dark:text-gray-400 min-w-[120px]">
                                Użytkownik wybrał:
                              </span>
                              <span className="text-sm text-green-700 dark:text-green-400 font-medium">
                                {attempt.final_product.name}
                              </span>
                            </div>
                          )}

                          {attempt.metadata?.method && (
                            <div className="flex items-start gap-2">
                              <span className="text-sm font-medium text-gray-600 dark:text-gray-400 min-w-[120px]">
                                Sposób wyboru:
                              </span>
                              <span className="text-sm text-gray-600 dark:text-gray-400">
                                {attempt.metadata.method === 'suggestion' && 'Z listy sugestii'}
                                {attempt.metadata.method === 'inline_search' && 'Przez wyszukiwanie'}
                                {attempt.metadata.method === 'product_browser' && 'Przez przeglądarkę produktów'}
                                {attempt.metadata.method === 'smart_match_failed' && 'Brak dopasowania'}
                              </span>
                            </div>
                          )}

                          {attempt.metadata?.reason && (
                            <div className="flex items-start gap-2">
                              <span className="text-sm font-medium text-gray-600 dark:text-gray-400 min-w-[120px]">
                                Przyczyna błędu:
                              </span>
                              <span className="text-sm text-red-600 dark:text-red-400">
                                {attempt.metadata.reason}
                              </span>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Przycisk rozwinięcia szczegółów */}
                    <button
                      onClick={() => toggleAttemptDetails(attempt.id)}
                      className="mt-3 px-3 py-1 text-xs bg-blue-50 hover:bg-blue-100 dark:bg-blue-900/30 dark:hover:bg-blue-900/50 text-blue-700 dark:text-blue-400 rounded-lg transition-colors"
                    >
                      {isExpanded ? '▼ Ukryj szczegóły' : '▶ Pokaż pełne szczegóły'}
                    </button>

                    {/* Rozwinięte szczegóły */}
                    {isExpanded && (
                          <div className="mt-4 p-4 bg-gray-50 dark:bg-gray-900 rounded-lg border border-gray-200 dark:border-gray-700">
                            <h4 className="font-semibold text-sm text-gray-800 dark:text-white mb-3">
                              Szczegółowe informacje diagnostyczne
                            </h4>

                            <div className="space-y-2 text-xs">
                              {/* ID próby */}
                              <div className="grid grid-cols-3 gap-2">
                                <span className="font-medium text-gray-600 dark:text-gray-400">ID próby:</span>
                                <span className="col-span-2 font-mono text-gray-900 dark:text-white">{attempt.id}</span>
                              </div>

                              {/* Dokładna data i godzina */}
                              <div className="grid grid-cols-3 gap-2">
                                <span className="font-medium text-gray-600 dark:text-gray-400">Data i godzina:</span>
                                <span className="col-span-2 text-gray-900 dark:text-white">{formatFullDate(attempt.timestamp)}</span>
                              </div>

                              {/* Użytkownik */}
                              <div className="grid grid-cols-3 gap-2">
                                <span className="font-medium text-gray-600 dark:text-gray-400">Użytkownik:</span>
                                <span className="col-span-2 text-gray-900 dark:text-white">
                                  {attempt.user?.full_name || 'Brak danych'} (ID: {attempt.user_id})
                                </span>
                              </div>

                              {/* Fraza rozpoznana */}
                              <div className="grid grid-cols-3 gap-2">
                                <span className="font-medium text-gray-600 dark:text-gray-400">Fraza rozpoznana:</span>
                                <span className="col-span-2 font-mono text-gray-900 dark:text-white bg-white dark:bg-gray-800 px-2 py-1 rounded">
                                  {attempt.recognized_phrase || attempt.original_phrase}
                                </span>
                              </div>

                              {/* Metadane - oryginalna fraza */}
                              {attempt.metadata?.original_text && (
                                <div className="grid grid-cols-3 gap-2">
                                  <span className="font-medium text-gray-600 dark:text-gray-400">Oryginalny tekst:</span>
                                  <span className="col-span-2 font-mono text-gray-900 dark:text-white bg-white dark:bg-gray-800 px-2 py-1 rounded">
                                    {attempt.metadata.original_text}
                                  </span>
                                </div>
                              )}

                              {/* Metadane - przetworzony tekst */}
                              {attempt.metadata?.processed_text && (
                                <div className="grid grid-cols-3 gap-2">
                                  <span className="font-medium text-gray-600 dark:text-gray-400">Tekst przetworzony:</span>
                                  <span className="col-span-2 font-mono text-gray-900 dark:text-white bg-white dark:bg-gray-800 px-2 py-1 rounded">
                                    {attempt.metadata.processed_text}
                                  </span>
                                </div>
                              )}

                              {/* Metoda dopasowania */}
                              <div className="grid grid-cols-3 gap-2">
                                <span className="font-medium text-gray-600 dark:text-gray-400">Metoda:</span>
                                <span className="col-span-2 text-gray-900 dark:text-white">
                                  {attempt.metadata?.method || 'Brak danych'}
                                </span>
                              </div>

                              {/* Czy AI było dostępne */}
                              {attempt.metadata?.ai_available !== undefined && (
                                <div className="grid grid-cols-3 gap-2">
                                  <span className="font-medium text-gray-600 dark:text-gray-400">AI dostępne:</span>
                                  <span className="col-span-2">
                                    <span className={`px-2 py-0.5 rounded text-xs font-medium ${
                                      attempt.metadata.ai_available
                                        ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400'
                                        : 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400'
                                    }`}>
                                      {attempt.metadata.ai_available ? 'Tak' : 'Nie'}
                                    </span>
                                  </span>
                                </div>
                              )}

                              {/* Czy używano AI */}
                              {attempt.metadata?.ai_matched !== undefined && (
                                <div className="grid grid-cols-3 gap-2">
                                  <span className="font-medium text-gray-600 dark:text-gray-400">Użyto AI:</span>
                                  <span className="col-span-2">
                                    <span className={`px-2 py-0.5 rounded text-xs font-medium ${
                                      attempt.metadata.ai_matched
                                        ? 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400'
                                        : 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-400'
                                    }`}>
                                      {attempt.metadata.ai_matched ? 'Tak' : 'Nie'}
                                    </span>
                                  </span>
                                </div>
                              )}

                              {/* Confidence score */}
                              <div className="grid grid-cols-3 gap-2">
                                <span className="font-medium text-gray-600 dark:text-gray-400">Pewność AI:</span>
                                <span className="col-span-2 text-gray-900 dark:text-white">
                                  {attempt.confidence_score}%
                                  {attempt.confidence_score === 0 && (
                                    <span className="ml-2 text-red-600 dark:text-red-400">(brak dopasowania)</span>
                                  )}
                                </span>
                              </div>

                              {/* Czy była korekta */}
                              <div className="grid grid-cols-3 gap-2">
                                <span className="font-medium text-gray-600 dark:text-gray-400">Poprawiono:</span>
                                <span className="col-span-2">
                                  <span className={`px-2 py-0.5 rounded text-xs font-medium ${
                                    attempt.was_corrected
                                      ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400'
                                      : 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-400'
                                  }`}>
                                    {attempt.was_corrected ? 'Tak' : 'Nie'}
                                  </span>
                                </span>
                              </div>

                              {/* ID produktów */}
                              {attempt.initial_product_id && (
                                <div className="grid grid-cols-3 gap-2">
                                  <span className="font-medium text-gray-600 dark:text-gray-400">ID początkowego produktu:</span>
                                  <span className="col-span-2 font-mono text-gray-900 dark:text-white">{attempt.initial_product_id}</span>
                                </div>
                              )}

                              {attempt.final_product_id && (
                                <div className="grid grid-cols-3 gap-2">
                                  <span className="font-medium text-gray-600 dark:text-gray-400">ID finalnego produktu:</span>
                                  <span className="col-span-2 font-mono text-gray-900 dark:text-white">{attempt.final_product_id}</span>
                                </div>
                              )}

                              {/* Pełne metadane JSON */}
                              {attempt.metadata && (
                                <div className="mt-3 pt-3 border-t border-gray-200 dark:border-gray-700">
                                  <details>
                                    <summary className="cursor-pointer font-medium text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-white">
                                      Pełne metadane (JSON)
                                    </summary>
                                    <pre className="mt-2 p-2 bg-white dark:bg-gray-800 rounded text-[10px] overflow-x-auto">
                                      {JSON.stringify(attempt.metadata, null, 2)}
                                    </pre>
                                  </details>
                                </div>
                              )}
                            </div>
                          </div>
                    )}
                  </div>
                );
              })}
              </div>
            )}
          </div>
        </div>
      ) : activeTab === 'learning' ? (
        <VoiceLearningPanel />
      ) : activeTab === 'metrics' ? (
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
