import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import { AlertTriangle, TrendingUp, Users, MessageSquare, Activity } from 'lucide-react';

interface ProblemProduct {
  product_id: string;
  product_name: string;
  product_index: string;
  category: string;
  total_attempts: number;
  corrections_count: number;
  correction_rate_percent: number;
  avg_confidence: number;
  unique_users: number;
  last_attempt: string;
}

interface PhraseMapping {
  phrase: string;
  product_id: string;
  product_name: string;
  product_index: string;
  usage_count: number;
  unique_users: number;
  avg_confidence: number;
  has_corrections: boolean;
  correction_count: number;
  last_used: string;
}

interface PhraseConflict {
  phrase: string;
  distinct_products: number;
  total_uses: number;
  unique_users: number;
  product_mappings: Array<{
    product_id: string;
    product_name: string;
    product_index: string;
    usage_count: number;
    user_count: number;
  }>;
}

export default function VoiceLearningPanel() {
  const [problemProducts, setProblemProducts] = useState<ProblemProduct[]>([]);
  const [phraseMappings, setPhraseMappings] = useState<PhraseMapping[]>([]);
  const [phraseConflicts, setPhraseConflicts] = useState<PhraseConflict[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'problems' | 'mappings' | 'conflicts'>('problems');

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      const [problemsData, mappingsData, conflictsData] = await Promise.all([
        supabase.from('problem_products_view').select('*').limit(50),
        supabase.from('phrase_mapping_view').select('*').limit(100),
        supabase.from('phrase_conflicts_view').select('*').limit(50)
      ]);

      if (problemsData.data) setProblemProducts(problemsData.data);
      if (mappingsData.data) setPhraseMappings(mappingsData.data);
      if (conflictsData.data) setPhraseConflicts(conflictsData.data);
    } catch (error) {
      console.error('Error loading voice learning data:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (date: string) => {
    return new Date(date).toLocaleDateString('pl-PL', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    });
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
        <h2 className="text-2xl font-bold text-gray-800 dark:text-white">Nauka głosowa AI</h2>
      </div>

      <div className="flex gap-2 border-b border-gray-200 dark:border-gray-700">
        <button
          onClick={() => setActiveTab('problems')}
          className={`flex items-center gap-2 px-4 py-2 font-medium transition-colors ${
            activeTab === 'problems'
              ? 'text-blue-600 dark:text-blue-400 border-b-2 border-blue-600 dark:border-blue-400'
              : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
          }`}
        >
          <AlertTriangle className="w-5 h-5" />
          Produkty problemowe
        </button>
        <button
          onClick={() => setActiveTab('mappings')}
          className={`flex items-center gap-2 px-4 py-2 font-medium transition-colors ${
            activeTab === 'mappings'
              ? 'text-blue-600 dark:text-blue-400 border-b-2 border-blue-600 dark:border-blue-400'
              : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
          }`}
        >
          <MessageSquare className="w-5 h-5" />
          Mapowanie fraz
        </button>
        <button
          onClick={() => setActiveTab('conflicts')}
          className={`flex items-center gap-2 px-4 py-2 font-medium transition-colors ${
            activeTab === 'conflicts'
              ? 'text-blue-600 dark:text-blue-400 border-b-2 border-blue-600 dark:border-blue-400'
              : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
          }`}
        >
          <Activity className="w-5 h-5" />
          Konflikty fraz
        </button>
      </div>

      {activeTab === 'problems' && (
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow">
          <div className="p-6 border-b border-gray-200 dark:border-gray-700">
            <h3 className="text-lg font-semibold text-gray-800 dark:text-white">
              Produkty z największą liczbą poprawek
            </h3>
            <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
              Produkty, które użytkownicy najczęściej poprawiają po rozpoznaniu głosowym
            </p>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 dark:bg-gray-900">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                    Produkt
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                    Kategoria
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                    Próby
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                    Poprawki
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                    % Błędów
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                    Śr. pewność
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                    Użytkownicy
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                {problemProducts.map((product) => (
                  <tr key={product.product_id} className="hover:bg-gray-50 dark:hover:bg-gray-700">
                    <td className="px-6 py-4 text-sm">
                      <div>
                        <div className="font-medium text-gray-900 dark:text-white">{product.product_name}</div>
                        <div className="text-xs text-gray-600 dark:text-gray-400">{product.product_index}</div>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-600 dark:text-gray-400">
                      {product.category}
                    </td>
                    <td className="px-6 py-4 text-sm font-medium text-gray-900 dark:text-white">
                      {product.total_attempts}
                    </td>
                    <td className="px-6 py-4 text-sm">
                      <span className="px-2 py-1 bg-red-100 dark:bg-red-900 text-red-800 dark:text-red-200 rounded-full font-medium">
                        {product.corrections_count}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-sm">
                      <div className="flex items-center gap-2">
                        <div className="flex-1 bg-gray-200 dark:bg-gray-700 rounded-full h-2 max-w-[100px]">
                          <div
                            className="bg-red-600 h-2 rounded-full"
                            style={{ width: `${Math.min(product.correction_rate_percent, 100)}%` }}
                          />
                        </div>
                        <span className="font-medium text-red-600">{product.correction_rate_percent}%</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-600 dark:text-gray-400">
                      {product.avg_confidence ? `${product.avg_confidence.toFixed(1)}%` : '-'}
                    </td>
                    <td className="px-6 py-4 text-sm">
                      <div className="flex items-center gap-1 text-gray-600 dark:text-gray-400">
                        <Users className="w-4 h-4" />
                        {product.unique_users}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {problemProducts.length === 0 && (
              <div className="text-center py-12 text-gray-500 dark:text-gray-400">
                Brak danych o produktach problemowych
              </div>
            )}
          </div>
        </div>
      )}

      {activeTab === 'mappings' && (
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow">
          <div className="p-6 border-b border-gray-200 dark:border-gray-700">
            <h3 className="text-lg font-semibold text-gray-800 dark:text-white">
              Mapowanie fraz na produkty
            </h3>
            <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
              Jakie frazy użytkownicy wypowiadają dla poszczególnych produktów
            </p>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 dark:bg-gray-900">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                    Fraza głosowa
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                    Produkt
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                    Użycia
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                    Użytkownicy
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                    Śr. pewność
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                    Poprawki
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                {phraseMappings.map((mapping, idx) => (
                  <tr key={idx} className="hover:bg-gray-50 dark:hover:bg-gray-700">
                    <td className="px-6 py-4 text-sm">
                      <span className="px-3 py-1 bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200 rounded-lg font-mono">
                        "{mapping.phrase}"
                      </span>
                    </td>
                    <td className="px-6 py-4 text-sm">
                      <div>
                        <div className="font-medium text-gray-900 dark:text-white">{mapping.product_name}</div>
                        <div className="text-xs text-gray-600 dark:text-gray-400">{mapping.product_index}</div>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-sm">
                      <div className="flex items-center gap-1 font-semibold text-blue-600">
                        <TrendingUp className="w-4 h-4" />
                        {mapping.usage_count}
                      </div>
                    </td>
                    <td className="px-6 py-4 text-sm">
                      <div className="flex items-center gap-1 text-gray-600 dark:text-gray-400">
                        <Users className="w-4 h-4" />
                        {mapping.unique_users}
                      </div>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-600 dark:text-gray-400">
                      {mapping.avg_confidence ? `${mapping.avg_confidence}%` : '-'}
                    </td>
                    <td className="px-6 py-4 text-sm">
                      {mapping.has_corrections ? (
                        <span className="px-2 py-1 bg-yellow-100 dark:bg-yellow-900 text-yellow-800 dark:text-yellow-200 rounded-full text-xs">
                          {mapping.correction_count} poprawek
                        </span>
                      ) : (
                        <span className="px-2 py-1 bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-200 rounded-full text-xs">
                          Brak poprawek
                        </span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {phraseMappings.length === 0 && (
              <div className="text-center py-12 text-gray-500 dark:text-gray-400">
                Brak danych o mapowaniu fraz
              </div>
            )}
          </div>
        </div>
      )}

      {activeTab === 'conflicts' && (
        <div className="space-y-4">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
            <h3 className="text-lg font-semibold text-gray-800 dark:text-white mb-2">
              Konflikty w rozpoznawaniu fraz
            </h3>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Frazy, które różni użytkownicy przypisują do różnych produktów
            </p>
          </div>

          {phraseConflicts.map((conflict, idx) => (
            <div key={idx} className="bg-white dark:bg-gray-800 rounded-lg shadow">
              <div className="p-6 border-b border-gray-200 dark:border-gray-700">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <span className="px-4 py-2 bg-purple-100 dark:bg-purple-900 text-purple-800 dark:text-purple-200 rounded-lg font-mono text-lg">
                      "{conflict.phrase}"
                    </span>
                    <div className="flex flex-col">
                      <span className="text-sm text-gray-600 dark:text-gray-400">
                        {conflict.total_uses} użyć • {conflict.unique_users} użytkowników
                      </span>
                      <span className="text-xs text-red-600 dark:text-red-400 font-medium">
                        {conflict.distinct_products} różnych produktów
                      </span>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 px-3 py-1 bg-red-100 dark:bg-red-900 text-red-800 dark:text-red-200 rounded-full">
                    <AlertTriangle className="w-4 h-4" />
                    Konflikt
                  </div>
                </div>
              </div>
              <div className="p-6">
                <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
                  Przypisane produkty:
                </h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {conflict.product_mappings.map((mapping, mapIdx) => (
                    <div
                      key={mapIdx}
                      className="flex items-center justify-between p-4 border border-gray-200 dark:border-gray-700 rounded-lg"
                    >
                      <div>
                        <div className="font-medium text-gray-900 dark:text-white">{mapping.product_name}</div>
                        <div className="text-xs text-gray-600 dark:text-gray-400">{mapping.product_index}</div>
                      </div>
                      <div className="text-right">
                        <div className="text-sm font-semibold text-blue-600">{mapping.usage_count}x</div>
                        <div className="text-xs text-gray-600 dark:text-gray-400">
                          {mapping.user_count} {mapping.user_count === 1 ? 'osoba' : 'osoby'}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          ))}

          {phraseConflicts.length === 0 && (
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-12 text-center">
              <div className="text-gray-500 dark:text-gray-400">
                Brak konfliktów w rozpoznawaniu fraz
              </div>
              <div className="text-sm text-gray-400 dark:text-gray-500 mt-2">
                Wszystkie frazy są jednoznacznie przypisane do produktów
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
