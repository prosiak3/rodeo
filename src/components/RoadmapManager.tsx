import { useState, useEffect } from 'react';
import { CheckCircle, Clock, Calendar, AlertCircle, ChevronDown, ChevronUp, Edit, Plus, Trash2, Save, X, Target, TrendingUp } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { showAlert } from '../lib/alerts';

interface RoadmapFeature {
  id: string;
  stage_id: string;
  title: string;
  description: string;
  status: 'completed' | 'in_progress' | 'planned' | 'future';
  priority: 'high' | 'medium' | 'low';
  order_index: number;
  completed_at: string | null;
  created_at: string;
  updated_at: string;
}

interface RoadmapStage {
  id: string;
  name: string;
  description: string;
  order_index: number;
  status: 'completed' | 'in_progress' | 'planned';
  completion_percentage: number;
  created_at: string;
  updated_at: string;
  features?: RoadmapFeature[];
}

interface RoadmapManagerProps {
  isAdmin: boolean;
}

export default function RoadmapManager({ isAdmin }: RoadmapManagerProps) {
  const [stages, setStages] = useState<RoadmapStage[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedStages, setExpandedStages] = useState<Set<string>>(new Set());
  const [editingStage, setEditingStage] = useState<string | null>(null);
  const [editingFeature, setEditingFeature] = useState<string | null>(null);
  const [stageForm, setStageForm] = useState({ name: '', description: '', status: 'planned' as const });
  const [featureForm, setFeatureForm] = useState({
    stage_id: '',
    title: '',
    description: '',
    status: 'planned' as const,
    priority: 'medium' as const
  });

  useEffect(() => {
    loadRoadmap();
  }, []);

  const loadRoadmap = async () => {
    setLoading(true);
    try {
      const { data: stagesData, error: stagesError } = await supabase
        .from('roadmap_stages')
        .select('*')
        .order('order_index');

      if (stagesError) throw stagesError;

      const { data: featuresData, error: featuresError } = await supabase
        .from('roadmap_features')
        .select('*')
        .order('order_index');

      if (featuresError) throw featuresError;

      const stagesWithFeatures = (stagesData || []).map(stage => ({
        ...stage,
        features: (featuresData || []).filter(f => f.stage_id === stage.id)
      }));

      setStages(stagesWithFeatures);
      setExpandedStages(new Set(stagesWithFeatures.filter(s => s.status === 'in_progress').map(s => s.id)));
    } catch (error) {
      console.error('Error loading roadmap:', error);
      showAlert('Błąd wczytywania roadmapy', 'error');
    } finally {
      setLoading(false);
    }
  };

  const toggleStage = (stageId: string) => {
    const newExpanded = new Set(expandedStages);
    if (newExpanded.has(stageId)) {
      newExpanded.delete(stageId);
    } else {
      newExpanded.add(stageId);
    }
    setExpandedStages(newExpanded);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed': return 'text-green-600 bg-green-50 border-green-200';
      case 'in_progress': return 'text-blue-600 bg-blue-50 border-blue-200';
      case 'planned': return 'text-amber-600 bg-amber-50 border-amber-200';
      case 'future': return 'text-gray-600 bg-gray-50 border-gray-200';
      default: return 'text-gray-600 bg-gray-50 border-gray-200';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed': return CheckCircle;
      case 'in_progress': return Clock;
      case 'planned': return Calendar;
      case 'future': return Target;
      default: return AlertCircle;
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'completed': return 'Ukończone';
      case 'in_progress': return 'W trakcie';
      case 'planned': return 'Zaplanowane';
      case 'future': return 'Przyszłość';
      default: return status;
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high': return 'text-red-600 bg-red-50';
      case 'medium': return 'text-amber-600 bg-amber-50';
      case 'low': return 'text-green-600 bg-green-50';
      default: return 'text-gray-600 bg-gray-50';
    }
  };

  const getPriorityLabel = (priority: string) => {
    switch (priority) {
      case 'high': return 'Wysoki';
      case 'medium': return 'Średni';
      case 'low': return 'Niski';
      default: return priority;
    }
  };

  const updateStageCompletion = async (stageId: string) => {
    const stage = stages.find(s => s.id === stageId);
    if (!stage || !stage.features) return;

    const totalFeatures = stage.features.length;
    if (totalFeatures === 0) return;

    const completedFeatures = stage.features.filter(f => f.status === 'completed').length;
    const percentage = Math.round((completedFeatures / totalFeatures) * 100);

    let status: 'completed' | 'in_progress' | 'planned' = 'planned';
    if (percentage === 100) status = 'completed';
    else if (percentage > 0) status = 'in_progress';

    await supabase
      .from('roadmap_stages')
      .update({ completion_percentage: percentage, status, updated_at: new Date().toISOString() })
      .eq('id', stageId);

    loadRoadmap();
  };

  const deleteFeature = async (featureId: string, stageId: string) => {
    if (!confirm('Czy na pewno chcesz usunąć tę funkcję?')) return;

    try {
      const { error } = await supabase
        .from('roadmap_features')
        .delete()
        .eq('id', featureId);

      if (error) throw error;
      showAlert('Funkcja usunięta', 'success');
      await updateStageCompletion(stageId);
    } catch (error) {
      console.error('Error deleting feature:', error);
      showAlert('Błąd usuwania funkcji', 'error');
    }
  };

  const saveFeature = async () => {
    if (!featureForm.title || !featureForm.stage_id) {
      showAlert('Wypełnij wszystkie wymagane pola', 'error');
      return;
    }

    try {
      if (editingFeature) {
        const updateData: any = {
          title: featureForm.title,
          description: featureForm.description,
          status: featureForm.status,
          priority: featureForm.priority,
          updated_at: new Date().toISOString()
        };

        if (featureForm.status === 'completed') {
          updateData.completed_at = new Date().toISOString();
        }

        const { error } = await supabase
          .from('roadmap_features')
          .update(updateData)
          .eq('id', editingFeature);

        if (error) throw error;
        showAlert('Funkcja zaktualizowana', 'success');
        await updateStageCompletion(featureForm.stage_id);
      } else {
        const stage = stages.find(s => s.id === featureForm.stage_id);
        const maxOrder = stage?.features?.reduce((max, f) => Math.max(max, f.order_index), 0) || 0;

        const { error } = await supabase
          .from('roadmap_features')
          .insert({
            stage_id: featureForm.stage_id,
            title: featureForm.title,
            description: featureForm.description,
            status: featureForm.status,
            priority: featureForm.priority,
            order_index: maxOrder + 1
          });

        if (error) throw error;
        showAlert('Funkcja dodana', 'success');
        await updateStageCompletion(featureForm.stage_id);
      }

      setEditingFeature(null);
      setFeatureForm({ stage_id: '', title: '', description: '', status: 'planned', priority: 'medium' });
    } catch (error) {
      console.error('Error saving feature:', error);
      showAlert('Błąd zapisywania funkcji', 'error');
    }
  };

  const startEditFeature = (feature: RoadmapFeature) => {
    setFeatureForm({
      stage_id: feature.stage_id,
      title: feature.title,
      description: feature.description || '',
      status: feature.status,
      priority: feature.priority
    });
    setEditingFeature(feature.id);
  };

  const startAddFeature = (stageId: string) => {
    setFeatureForm({
      stage_id: stageId,
      title: '',
      description: '',
      status: 'planned',
      priority: 'medium'
    });
    setEditingFeature('new');
  };

  const cancelFeatureEdit = () => {
    setEditingFeature(null);
    setFeatureForm({ stage_id: '', title: '', description: '', status: 'planned', priority: 'medium' });
  };

  const overallProgress = stages.length > 0
    ? Math.round(stages.reduce((sum, stage) => sum + stage.completion_percentage, 0) / stages.length)
    : 0;

  const completedStages = stages.filter(s => s.status === 'completed').length;
  const inProgressStages = stages.filter(s => s.status === 'in_progress').length;
  const totalFeatures = stages.reduce((sum, stage) => sum + (stage.features?.length || 0), 0);
  const completedFeatures = stages.reduce((sum, stage) =>
    sum + (stage.features?.filter(f => f.status === 'completed').length || 0), 0
  );

  if (loading) {
    return <div className="p-8 text-center">Wczytywanie roadmapy...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="bg-gradient-to-r from-blue-500 to-purple-600 rounded-xl shadow-lg p-8 text-white">
        <div className="flex items-center gap-3 mb-4">
          <TrendingUp className="w-8 h-8" />
          <h2 className="text-3xl font-bold">Roadmapa Rozwoju Systemu</h2>
        </div>
        <p className="text-blue-100 mb-6">
          Interaktywna wizualizacja postępu wdrażania kolejnych etapów systemu zamówień
        </p>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="bg-white bg-opacity-20 rounded-lg p-4 backdrop-blur-sm">
            <div className="text-4xl font-bold mb-1">{overallProgress}%</div>
            <div className="text-sm text-blue-100">Ogólny postęp</div>
          </div>
          <div className="bg-white bg-opacity-20 rounded-lg p-4 backdrop-blur-sm">
            <div className="text-4xl font-bold mb-1">{completedStages}/{stages.length}</div>
            <div className="text-sm text-blue-100">Etapy ukończone</div>
          </div>
          <div className="bg-white bg-opacity-20 rounded-lg p-4 backdrop-blur-sm">
            <div className="text-4xl font-bold mb-1">{inProgressStages}</div>
            <div className="text-sm text-blue-100">Etapy w trakcie</div>
          </div>
          <div className="bg-white bg-opacity-20 rounded-lg p-4 backdrop-blur-sm">
            <div className="text-4xl font-bold mb-1">{completedFeatures}/{totalFeatures}</div>
            <div className="text-sm text-blue-100">Funkcje wdrożone</div>
          </div>
        </div>
      </div>

      <div className="space-y-4">
        {stages.map((stage) => {
          const StatusIcon = getStatusIcon(stage.status);
          const isExpanded = expandedStages.has(stage.id);

          return (
            <div key={stage.id} className="bg-white rounded-xl shadow-lg overflow-hidden">
              <button
                onClick={() => toggleStage(stage.id)}
                className="w-full p-6 flex items-center justify-between hover:bg-gray-50 transition"
              >
                <div className="flex items-center gap-4 flex-1">
                  <div className={`p-3 rounded-lg ${getStatusColor(stage.status)}`}>
                    <StatusIcon className="w-6 h-6" />
                  </div>
                  <div className="text-left flex-1">
                    <h3 className="text-xl font-bold text-gray-800 mb-1">{stage.name}</h3>
                    {stage.description && (
                      <p className="text-sm text-gray-600">{stage.description}</p>
                    )}
                    <div className="flex items-center gap-4 mt-2">
                      <span className={`px-3 py-1 rounded-full text-xs font-semibold ${getStatusColor(stage.status)}`}>
                        {getStatusLabel(stage.status)}
                      </span>
                      <div className="flex items-center gap-2">
                        <div className="w-32 h-2 bg-gray-200 rounded-full overflow-hidden">
                          <div
                            className="h-full bg-gradient-to-r from-green-500 to-blue-500 transition-all duration-500"
                            style={{ width: `${stage.completion_percentage}%` }}
                          />
                        </div>
                        <span className="text-sm font-semibold text-gray-700">{stage.completion_percentage}%</span>
                      </div>
                      <span className="text-sm text-gray-500">
                        {stage.features?.length || 0} funkcji
                      </span>
                    </div>
                  </div>
                </div>
                {isExpanded ? (
                  <ChevronUp className="w-6 h-6 text-gray-400" />
                ) : (
                  <ChevronDown className="w-6 h-6 text-gray-400" />
                )}
              </button>

              {isExpanded && (
                <div className="border-t border-gray-200 p-6 bg-gray-50">
                  {isAdmin && (
                    <button
                      onClick={() => startAddFeature(stage.id)}
                      className="mb-4 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition flex items-center gap-2"
                    >
                      <Plus className="w-4 h-4" />
                      Dodaj funkcję
                    </button>
                  )}

                  {editingFeature === 'new' && featureForm.stage_id === stage.id && (
                    <div className="mb-4 p-4 bg-white rounded-lg border-2 border-blue-500">
                      <h4 className="font-semibold text-gray-800 mb-3">Nowa funkcja</h4>
                      <div className="space-y-3">
                        <input
                          type="text"
                          value={featureForm.title}
                          onChange={(e) => setFeatureForm({ ...featureForm, title: e.target.value })}
                          placeholder="Tytuł funkcji"
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                        />
                        <textarea
                          value={featureForm.description}
                          onChange={(e) => setFeatureForm({ ...featureForm, description: e.target.value })}
                          placeholder="Opis funkcji"
                          rows={3}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                        />
                        <div className="grid grid-cols-2 gap-3">
                          <select
                            value={featureForm.status}
                            onChange={(e) => setFeatureForm({ ...featureForm, status: e.target.value as any })}
                            className="px-3 py-2 border border-gray-300 rounded-lg"
                          >
                            <option value="planned">Zaplanowane</option>
                            <option value="in_progress">W trakcie</option>
                            <option value="completed">Ukończone</option>
                            <option value="future">Przyszłość</option>
                          </select>
                          <select
                            value={featureForm.priority}
                            onChange={(e) => setFeatureForm({ ...featureForm, priority: e.target.value as any })}
                            className="px-3 py-2 border border-gray-300 rounded-lg"
                          >
                            <option value="high">Wysoki priorytet</option>
                            <option value="medium">Średni priorytet</option>
                            <option value="low">Niski priorytet</option>
                          </select>
                        </div>
                        <div className="flex gap-2">
                          <button
                            onClick={saveFeature}
                            className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition flex items-center gap-2"
                          >
                            <Save className="w-4 h-4" />
                            Zapisz
                          </button>
                          <button
                            onClick={cancelFeatureEdit}
                            className="px-4 py-2 bg-gray-300 text-gray-700 rounded-lg hover:bg-gray-400 transition flex items-center gap-2"
                          >
                            <X className="w-4 h-4" />
                            Anuluj
                          </button>
                        </div>
                      </div>
                    </div>
                  )}

                  <div className="space-y-2">
                    {stage.features && stage.features.length > 0 ? (
                      stage.features.map((feature) => {
                        const FeatureStatusIcon = getStatusIcon(feature.status);
                        const isEditing = editingFeature === feature.id;

                        if (isEditing) {
                          return (
                            <div key={feature.id} className="p-4 bg-white rounded-lg border-2 border-blue-500">
                              <h4 className="font-semibold text-gray-800 mb-3">Edytuj funkcję</h4>
                              <div className="space-y-3">
                                <input
                                  type="text"
                                  value={featureForm.title}
                                  onChange={(e) => setFeatureForm({ ...featureForm, title: e.target.value })}
                                  placeholder="Tytuł funkcji"
                                  className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                                />
                                <textarea
                                  value={featureForm.description}
                                  onChange={(e) => setFeatureForm({ ...featureForm, description: e.target.value })}
                                  placeholder="Opis funkcji"
                                  rows={3}
                                  className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                                />
                                <div className="grid grid-cols-2 gap-3">
                                  <select
                                    value={featureForm.status}
                                    onChange={(e) => setFeatureForm({ ...featureForm, status: e.target.value as any })}
                                    className="px-3 py-2 border border-gray-300 rounded-lg"
                                  >
                                    <option value="planned">Zaplanowane</option>
                                    <option value="in_progress">W trakcie</option>
                                    <option value="completed">Ukończone</option>
                                    <option value="future">Przyszłość</option>
                                  </select>
                                  <select
                                    value={featureForm.priority}
                                    onChange={(e) => setFeatureForm({ ...featureForm, priority: e.target.value as any })}
                                    className="px-3 py-2 border border-gray-300 rounded-lg"
                                  >
                                    <option value="high">Wysoki priorytet</option>
                                    <option value="medium">Średni priorytet</option>
                                    <option value="low">Niski priorytet</option>
                                  </select>
                                </div>
                                <div className="flex gap-2">
                                  <button
                                    onClick={saveFeature}
                                    className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition flex items-center gap-2"
                                  >
                                    <Save className="w-4 h-4" />
                                    Zapisz
                                  </button>
                                  <button
                                    onClick={cancelFeatureEdit}
                                    className="px-4 py-2 bg-gray-300 text-gray-700 rounded-lg hover:bg-gray-400 transition flex items-center gap-2"
                                  >
                                    <X className="w-4 h-4" />
                                    Anuluj
                                  </button>
                                </div>
                              </div>
                            </div>
                          );
                        }

                        return (
                          <div
                            key={feature.id}
                            className="p-4 bg-white rounded-lg border border-gray-200 hover:border-gray-300 transition"
                          >
                            <div className="flex items-start justify-between gap-3">
                              <div className="flex items-start gap-3 flex-1">
                                <FeatureStatusIcon className={`w-5 h-5 flex-shrink-0 mt-0.5 ${
                                  feature.status === 'completed' ? 'text-green-600' :
                                  feature.status === 'in_progress' ? 'text-blue-600' :
                                  feature.status === 'planned' ? 'text-amber-600' :
                                  'text-gray-400'
                                }`} />
                                <div className="flex-1">
                                  <h4 className="font-semibold text-gray-800 mb-1">{feature.title}</h4>
                                  {feature.description && (
                                    <p className="text-sm text-gray-600 mb-2">{feature.description}</p>
                                  )}
                                  <div className="flex flex-wrap gap-2">
                                    <span className={`px-2 py-1 rounded text-xs font-semibold ${getStatusColor(feature.status)} border`}>
                                      {getStatusLabel(feature.status)}
                                    </span>
                                    <span className={`px-2 py-1 rounded text-xs font-semibold ${getPriorityColor(feature.priority)}`}>
                                      {getPriorityLabel(feature.priority)}
                                    </span>
                                    {feature.completed_at && (
                                      <span className="px-2 py-1 rounded text-xs text-gray-600 bg-gray-100">
                                        Ukończono: {new Date(feature.completed_at).toLocaleDateString('pl-PL')}
                                      </span>
                                    )}
                                  </div>
                                </div>
                              </div>
                              {isAdmin && (
                                <div className="flex gap-2">
                                  <button
                                    onClick={() => startEditFeature(feature)}
                                    className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition"
                                  >
                                    <Edit className="w-4 h-4" />
                                  </button>
                                  <button
                                    onClick={() => deleteFeature(feature.id, stage.id)}
                                    className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition"
                                  >
                                    <Trash2 className="w-4 h-4" />
                                  </button>
                                </div>
                              )}
                            </div>
                          </div>
                        );
                      })
                    ) : (
                      <div className="text-center py-8 text-gray-500">
                        Brak funkcji w tym etapie
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
