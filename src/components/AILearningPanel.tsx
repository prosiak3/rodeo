import { useState, useEffect } from 'react';
import { Brain, TrendingUp, MessageSquare, Calendar, BarChart3, RefreshCw } from 'lucide-react';
import { supabase } from '../lib/supabase';

interface AILearningPanelProps {
  storeId: string;
}

interface LearningCorrection {
  id: string;
  spoken_phrase: string;
  selected_product_name: string;
  selected_product_index: string;
  user_name: string;
  created_at: string;
}

interface PhraseMapping {
  id: string;
  spoken_phrase: string;
  mapped_phrase: string;
  confidence: number;
  usage_count: number;
  created_from_corrections: number;
  created_at: string;
  last_used_at: string | null;
}

interface Stats {
  total_corrections: number;
  unique_phrases: number;
  total_mappings: number;
  avg_confidence: number;
}

export default function AILearningPanel({ storeId }: AILearningPanelProps) {
  const [corrections, setCorrections] = useState<LearningCorrection[]>([]);
  const [mappings, setMappings] = useState<PhraseMapping[]>([]);
  const [stats, setStats] = useState<Stats>({
    total_corrections: 0,
    unique_phrases: 0,
    total_mappings: 0,
    avg_confidence: 0,
  });
  const [loading, setLoading] = useState(true);
  const [analyzing, setAnalyzing] = useState(false);
  const [activeView, setActiveView] = useState<'corrections' | 'mappings'>('corrections');

  useEffect(() => {
    loadData();
  }, [storeId]);

  const loadData = async () => {
    setLoading(true);
    try {
      await Promise.all([loadCorrections(), loadMappings(), loadStats()]);
    } catch (error) {
      console.error('Failed to load AI learning data:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadCorrections = async () => {
    const { data, error } = await supabase
      .from('voice_learning_corrections')
      .select(`
        id,
        spoken_phrase,
        created_at,
        selected_product:products(name, index),
        user:users(name)
      `)
      .eq('store_id', storeId)
      .order('created_at', { ascending: false })
      .limit(100);

    if (error) throw error;

    const formatted = data?.map(item => ({
      id: item.id,
      spoken_phrase: item.spoken_phrase,
      selected_product_name: (item.selected_product as any)?.name || 'Nieznany',
      selected_product_index: (item.selected_product as any)?.index || '',
      user_name: (item.user as any)?.name || 'Nieznany',
      created_at: item.created_at,
    })) || [];

    setCorrections(formatted);
  };

  const loadMappings = async () => {
    const { data, error } = await supabase
      .from('voice_phrase_mappings')
      .select('*')
      .eq('store_id', storeId)
      .order('confidence', { ascending: false });

    if (error) throw error;
    setMappings(data || []);
  };

  const loadStats = async () => {
    const { data: correctionsData } = await supabase
      .from('voice_learning_corrections')
      .select('spoken_phrase')
      .eq('store_id', storeId);

    const { data: mappingsData } = await supabase
      .from('voice_phrase_mappings')
      .select('confidence')
      .eq('store_id', storeId);

    const uniquePhrases = new Set(correctionsData?.map(c => c.spoken_phrase.toLowerCase()) || []).size;
    const avgConfidence = mappingsData && mappingsData.length > 0
      ? mappingsData.reduce((sum, m) => sum + Number(m.confidence), 0) / mappingsData.length
      : 0;

    setStats({
      total_corrections: correctionsData?.length || 0,
      unique_phrases: uniquePhrases,
      total_mappings: mappingsData?.length || 0,
      avg_confidence: avgConfidence,
    });
  };

  const analyzeMappings = async () => {
    setAnalyzing(true);
    try {
      const { data, error } = await supabase.rpc('analyze_and_create_phrase_mappings', {
        p_store_id: storeId,
        min_occurrences: 2,
      });

      if (error) throw error;

      alert(`Analiza zakończona! Utworzono/zaktualizowano ${data} mapowań fraz.`);
      await loadData();
    } catch (error) {
      console.error('Failed to analyze mappings:', error);
      alert('Błąd podczas analizy mapowań');
    } finally {
      setAnalyzing(false);
    }
  };

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleString('pl-PL', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  if (loading) {
    return (
      <div className="p-8 text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
        <p className="mt-4 text-gray-600">Ładowanie danych AI...</p>
      </div>
    );
  }

  return (
    <div className="p-4 max-w-7xl mx-auto">
      <div className="mb-6">
        <div className="flex items-center gap-3 mb-4">
          <Brain className="w-8 h-8 text-blue-600" />
          <div>
            <h2 className="text-2xl font-bold text-gray-800">System Uczenia AI</h2>
            <p className="text-gray-600">Analiza nauki systemu rozpoznawania głosu</p>
          </div>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          <div className="bg-white p-4 rounded-lg shadow border-l-4 border-blue-500">
            <div className="flex items-center gap-2 text-blue-600 mb-2">
              <MessageSquare className="w-5 h-5" />
              <span className="text-sm font-medium">Korekty</span>
            </div>
            <div className="text-2xl font-bold">{stats.total_corrections}</div>
            <div className="text-xs text-gray-500 mt-1">Wszystkich korekt</div>
          </div>

          <div className="bg-white p-4 rounded-lg shadow border-l-4 border-green-500">
            <div className="flex items-center gap-2 text-green-600 mb-2">
              <TrendingUp className="w-5 h-5" />
              <span className="text-sm font-medium">Unikalne frazy</span>
            </div>
            <div className="text-2xl font-bold">{stats.unique_phrases}</div>
            <div className="text-xs text-gray-500 mt-1">Różnych fraz</div>
          </div>

          <div className="bg-white p-4 rounded-lg shadow border-l-4 border-purple-500">
            <div className="flex items-center gap-2 text-purple-600 mb-2">
              <BarChart3 className="w-5 h-5" />
              <span className="text-sm font-medium">Mapowania</span>
            </div>
            <div className="text-2xl font-bold">{stats.total_mappings}</div>
            <div className="text-xs text-gray-500 mt-1">Automatycznych mapowań</div>
          </div>

          <div className="bg-white p-4 rounded-lg shadow border-l-4 border-amber-500">
            <div className="flex items-center gap-2 text-amber-600 mb-2">
              <Calendar className="w-5 h-5" />
              <span className="text-sm font-medium">Pewność</span>
            </div>
            <div className="text-2xl font-bold">{stats.avg_confidence.toFixed(0)}%</div>
            <div className="text-xs text-gray-500 mt-1">Średnia pewność</div>
          </div>
        </div>

        <div className="flex gap-2 mb-4">
          <button
            onClick={() => setActiveView('corrections')}
            className={`flex-1 py-2 px-4 rounded-lg font-medium transition ${
              activeView === 'corrections'
                ? 'bg-blue-600 text-white'
                : 'bg-white text-gray-700 border border-gray-300 hover:bg-gray-50'
            }`}
          >
            Historia Korekt
          </button>
          <button
            onClick={() => setActiveView('mappings')}
            className={`flex-1 py-2 px-4 rounded-lg font-medium transition ${
              activeView === 'mappings'
                ? 'bg-blue-600 text-white'
                : 'bg-white text-gray-700 border border-gray-300 hover:bg-gray-50'
            }`}
          >
            Automatyczne Mapowania
          </button>
          <button
            onClick={analyzeMappings}
            disabled={analyzing}
            className="py-2 px-4 bg-green-600 hover:bg-green-700 disabled:bg-gray-400 text-white rounded-lg font-medium transition flex items-center gap-2"
          >
            <RefreshCw className={`w-4 h-4 ${analyzing ? 'animate-spin' : ''}`} />
            {analyzing ? 'Analizuję...' : 'Analizuj teraz'}
          </button>
        </div>
      </div>

      {activeView === 'corrections' && (
        <div className="bg-white rounded-lg shadow">
          <div className="p-4 border-b border-gray-200">
            <h3 className="font-semibold text-gray-800">Historia Korekt Użytkowników</h3>
            <p className="text-sm text-gray-600">Ostatnie 100 korekt dokonanych przez użytkowników</p>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Data</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Powiedziane</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Wybrano</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Indeks</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Użytkownik</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {corrections.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="px-4 py-8 text-center text-gray-500">
                      Brak danych o korektach
                    </td>
                  </tr>
                ) : (
                  corrections.map((correction) => (
                    <tr key={correction.id} className="hover:bg-gray-50">
                      <td className="px-4 py-3 text-sm text-gray-600">
                        {formatDate(correction.created_at)}
                      </td>
                      <td className="px-4 py-3 text-sm">
                        <span className="font-medium text-orange-600">{correction.spoken_phrase}</span>
                      </td>
                      <td className="px-4 py-3 text-sm">
                        <span className="font-medium text-green-600">{correction.selected_product_name}</span>
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-600">
                        {correction.selected_product_index}
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-600">
                        {correction.user_name}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {activeView === 'mappings' && (
        <div className="bg-white rounded-lg shadow">
          <div className="p-4 border-b border-gray-200">
            <h3 className="font-semibold text-gray-800">Automatyczne Mapowania Fraz</h3>
            <p className="text-sm text-gray-600">System automatycznie tworzy mapowania na podstawie wzorców w korektach</p>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Fraza głosowa</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Mapowana na</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Pewność</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Użycia</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Z korekt</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Ostatnie użycie</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {mappings.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-4 py-8 text-center text-gray-500">
                      Brak automatycznych mapowań. Kliknij "Analizuj teraz" aby utworzyć mapowania na podstawie historii korekt.
                    </td>
                  </tr>
                ) : (
                  mappings.map((mapping) => (
                    <tr key={mapping.id} className="hover:bg-gray-50">
                      <td className="px-4 py-3 text-sm">
                        <span className="font-medium text-orange-600">{mapping.spoken_phrase}</span>
                      </td>
                      <td className="px-4 py-3 text-sm">
                        <span className="font-medium text-green-600">{mapping.mapped_phrase}</span>
                      </td>
                      <td className="px-4 py-3 text-sm">
                        <div className="flex items-center gap-2">
                          <div className="flex-1 bg-gray-200 rounded-full h-2 max-w-[100px]">
                            <div
                              className="bg-blue-600 h-2 rounded-full"
                              style={{ width: `${mapping.confidence}%` }}
                            ></div>
                          </div>
                          <span className="text-gray-700 font-medium">{mapping.confidence.toFixed(0)}%</span>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-600">
                        {mapping.usage_count}
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-600">
                        {mapping.created_from_corrections}
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-600">
                        {mapping.last_used_at ? formatDate(mapping.last_used_at) : 'Nigdy'}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
