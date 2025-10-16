import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { TrendingUp, Eye, MousePointer, XCircle, ShoppingCart, BarChart3, Clock } from 'lucide-react';

interface Campaign {
  id: string;
  campaign_name: string;
  campaign_type: string;
  promo_code: string | null;
  discount_percentage: number | null;
  start_date: string;
  end_date: string;
  active: boolean;
}

interface CampaignPerformance {
  campaign_name: string;
  campaign_type: string;
  total_views: number;
  total_clicks: number;
  total_dismissals: number;
  total_conversions: number;
  ctr: number;
  conversion_rate: number;
  total_revenue: number;
  avg_time_to_conversion: string | null;
}

interface InteractionDetail {
  user_name: string;
  user_role: string;
  interaction_type: string;
  timestamp: string;
  interaction_data: any;
}

export default function CampaignAnalytics() {
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [selectedCampaign, setSelectedCampaign] = useState<string | null>(null);
  const [performance, setPerformance] = useState<CampaignPerformance | null>(null);
  const [interactions, setInteractions] = useState<InteractionDetail[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadCampaigns();
  }, []);

  useEffect(() => {
    if (selectedCampaign) {
      loadCampaignPerformance(selectedCampaign);
      loadInteractionDetails(selectedCampaign);
    }
  }, [selectedCampaign]);

  const loadCampaigns = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('marketing_campaigns')
        .select('*')
        .order('created_at', { ascending: false });

      if (!error && data) {
        setCampaigns(data);
        if (data.length > 0 && !selectedCampaign) {
          setSelectedCampaign(data[0].id);
        }
      }
    } catch (error) {
      console.error('Failed to load campaigns:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadCampaignPerformance = async (campaignId: string) => {
    try {
      const { data, error } = await supabase.rpc('get_campaign_performance', {
        p_campaign_id: campaignId,
      });

      if (!error && data && data.length > 0) {
        setPerformance(data[0]);
      }
    } catch (error) {
      console.error('Failed to load campaign performance:', error);
    }
  };

  const loadInteractionDetails = async (campaignId: string) => {
    try {
      const { data, error } = await supabase
        .from('campaign_interactions')
        .select(`
          interaction_type,
          timestamp,
          interaction_data,
          users!inner(full_name, role)
        `)
        .eq('campaign_id', campaignId)
        .order('timestamp', { ascending: false })
        .limit(50);

      if (!error && data) {
        const formatted = data.map(item => ({
          user_name: (item.users as any).full_name,
          user_role: (item.users as any).role,
          interaction_type: item.interaction_type,
          timestamp: item.timestamp,
          interaction_data: item.interaction_data,
        }));
        setInteractions(formatted);
      }
    } catch (error) {
      console.error('Failed to load interaction details:', error);
    }
  };

  const formatTimeToConversion = (interval: string | null) => {
    if (!interval) return 'N/A';

    const match = interval.match(/(\d+):(\d+):(\d+)/);
    if (!match) return interval;

    const [_, hours, minutes, seconds] = match;
    if (parseInt(hours) > 0) return `${parseInt(hours)}h ${parseInt(minutes)}m`;
    if (parseInt(minutes) > 0) return `${parseInt(minutes)}m ${parseInt(seconds)}s`;
    return `${parseInt(seconds)}s`;
  };

  const getInteractionIcon = (type: string) => {
    switch (type) {
      case 'view': return <Eye className="w-5 h-5 text-blue-500" />;
      case 'click': return <MousePointer className="w-5 h-5 text-green-500" />;
      case 'dismiss': return <XCircle className="w-5 h-5 text-red-500" />;
      case 'convert': return <ShoppingCart className="w-5 h-5 text-purple-500" />;
      default: return <BarChart3 className="w-5 h-5 text-gray-500" />;
    }
  };

  const getInteractionLabel = (type: string) => {
    switch (type) {
      case 'view': return 'Wyświetlenie';
      case 'click': return 'Kliknięcie';
      case 'dismiss': return 'Odrzucenie';
      case 'convert': return 'Konwersja';
      default: return type;
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (campaigns.length === 0) {
    return (
      <div className="bg-white rounded-lg shadow p-8 text-center">
        <TrendingUp className="w-16 h-16 text-gray-300 mx-auto mb-4" />
        <h3 className="text-xl font-semibold text-gray-900 mb-2">Brak kampanii</h3>
        <p className="text-gray-600">Nie znaleziono żadnych kampanii marketingowych.</p>
      </div>
    );
  }

  const selectedCampaignData = campaigns.find(c => c.id === selectedCampaign);

  return (
    <div className="space-y-6">
      {/* Campaign Selector */}
      <div className="bg-white rounded-lg shadow p-6">
        <h2 className="text-xl font-bold text-gray-900 mb-4">Wybierz kampanię</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {campaigns.map(campaign => (
            <button
              key={campaign.id}
              onClick={() => setSelectedCampaign(campaign.id)}
              className={`p-4 rounded-lg border-2 transition text-left ${
                selectedCampaign === campaign.id
                  ? 'border-blue-500 bg-blue-50'
                  : 'border-gray-200 hover:border-gray-300'
              }`}
            >
              <div className="flex items-start justify-between mb-2">
                <h3 className="font-semibold text-gray-900">{campaign.campaign_name}</h3>
                {campaign.active && (
                  <span className="px-2 py-1 bg-green-100 text-green-800 text-xs rounded">Aktywna</span>
                )}
              </div>
              <p className="text-sm text-gray-600 mb-2">{campaign.campaign_type}</p>
              {campaign.promo_code && (
                <p className="text-sm font-mono bg-gray-100 px-2 py-1 rounded inline-block">
                  {campaign.promo_code}
                </p>
              )}
            </button>
          ))}
        </div>
      </div>

      {/* Performance Metrics */}
      {performance && selectedCampaignData && (
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-xl font-bold text-gray-900">{selectedCampaignData.campaign_name}</h2>
              <p className="text-sm text-gray-600 mt-1">
                {new Date(selectedCampaignData.start_date).toLocaleDateString('pl-PL')} - {new Date(selectedCampaignData.end_date).toLocaleDateString('pl-PL')}
              </p>
            </div>
            {selectedCampaignData.discount_percentage && (
              <div className="text-right">
                <p className="text-3xl font-bold text-green-600">{selectedCampaignData.discount_percentage}%</p>
                <p className="text-sm text-gray-600">zniżki</p>
              </div>
            )}
          </div>

          {/* KPI Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
            <div className="bg-blue-50 rounded-lg p-4">
              <div className="flex items-center justify-between mb-2">
                <Eye className="w-8 h-8 text-blue-500" />
                <span className="text-2xl font-bold text-gray-900">{performance.total_views}</span>
              </div>
              <p className="text-sm text-gray-600">Wyświetlenia</p>
            </div>

            <div className="bg-green-50 rounded-lg p-4">
              <div className="flex items-center justify-between mb-2">
                <MousePointer className="w-8 h-8 text-green-500" />
                <span className="text-2xl font-bold text-gray-900">{performance.total_clicks}</span>
              </div>
              <p className="text-sm text-gray-600">Kliknięcia</p>
              <p className="text-xs text-gray-500 mt-1">CTR: {performance.ctr.toFixed(2)}%</p>
            </div>

            <div className="bg-purple-50 rounded-lg p-4">
              <div className="flex items-center justify-between mb-2">
                <ShoppingCart className="w-8 h-8 text-purple-500" />
                <span className="text-2xl font-bold text-gray-900">{performance.total_conversions}</span>
              </div>
              <p className="text-sm text-gray-600">Konwersje</p>
              <p className="text-xs text-gray-500 mt-1">CR: {performance.conversion_rate.toFixed(2)}%</p>
            </div>

            <div className="bg-red-50 rounded-lg p-4">
              <div className="flex items-center justify-between mb-2">
                <XCircle className="w-8 h-8 text-red-500" />
                <span className="text-2xl font-bold text-gray-900">{performance.total_dismissals}</span>
              </div>
              <p className="text-sm text-gray-600">Odrzucenia</p>
              <p className="text-xs text-gray-500 mt-1">
                {performance.total_views > 0
                  ? ((performance.total_dismissals / performance.total_views) * 100).toFixed(1)
                  : '0'}% wyświetleń
              </p>
            </div>
          </div>

          {/* Revenue and Time Metrics */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="bg-gradient-to-r from-green-500 to-emerald-600 rounded-lg p-6 text-white">
              <p className="text-sm opacity-90 mb-2">Łączny przychód</p>
              <p className="text-4xl font-bold">{performance.total_revenue.toFixed(2)} zł</p>
              {performance.total_conversions > 0 && (
                <p className="text-sm opacity-90 mt-2">
                  Średnio: {(performance.total_revenue / performance.total_conversions).toFixed(2)} zł / konwersja
                </p>
              )}
            </div>

            <div className="bg-gradient-to-r from-blue-500 to-cyan-600 rounded-lg p-6 text-white">
              <div className="flex items-center gap-2 mb-2">
                <Clock className="w-5 h-5" />
                <p className="text-sm opacity-90">Średni czas do konwersji</p>
              </div>
              <p className="text-4xl font-bold">{formatTimeToConversion(performance.avg_time_to_conversion)}</p>
              <p className="text-sm opacity-90 mt-2">od kliknięcia do zamówienia</p>
            </div>
          </div>
        </div>
      )}

      {/* Interaction Details */}
      {interactions.length > 0 && (
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-xl font-bold text-gray-900 mb-4">Ostatnie interakcje ({interactions.length})</h2>
          <div className="space-y-3">
            {interactions.map((interaction, idx) => (
              <div key={idx} className="flex items-center gap-4 p-3 bg-gray-50 rounded-lg">
                <div className="flex-shrink-0">
                  {getInteractionIcon(interaction.interaction_type)}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <p className="font-semibold text-gray-900">{interaction.user_name}</p>
                    <span className="px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded">{interaction.user_role}</span>
                  </div>
                  <p className="text-sm text-gray-600">{getInteractionLabel(interaction.interaction_type)}</p>
                </div>
                <div className="text-right text-sm text-gray-500">
                  {new Date(interaction.timestamp).toLocaleString('pl-PL')}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
