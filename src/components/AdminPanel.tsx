import { useState, useEffect } from 'react';
import { Package, ShoppingBag, DollarSign, Settings, UserCog, Brain, Tag, Percent, UserCheck, Mail, Bell, TrendingUp, Map, Monitor, ChevronDown, BarChart3, Megaphone } from 'lucide-react';
import OrdersList from './OrdersList';
import PriceListManager from './PriceListManager';
import StoresAndGroupsManager from './StoresAndGroupsManager';
import ProductManager from './ProductManager';
import SystemSettings from './SystemSettings';
import UsersManager from './UsersManager';
import AILearningPanel from './AILearningPanel';
import BannersManager from './BannersManager';
import PromotionsAndPrices from './PromotionsAndPrices';
import SalespersonAssignments from './SalespersonAssignments';
import EmailLogsPanel from './EmailLogsPanel';
import AnnouncementsManager from './AnnouncementsManager';
import DemandForecastPanel from './DemandForecastPanel';
import RoadmapManager from './RoadmapManager';
import SessionsBrowserPanel from './SessionsBrowserPanel';
import { supabase } from '../lib/supabase';

interface AdminPanelProps {
  userId: string;
  userRole: string;
  onSelectOrder: (orderId: string) => void;
}

type MainCategory = 'operations' | 'catalog' | 'analytics' | 'communication' | 'system';
type SubTab = 'orders' | 'stores' | 'products' | 'pricelists' | 'promotions' | 'users' | 'salesperson_assignments' | 'ai' | 'banners' | 'announcements' | 'email_logs' | 'demand_forecast' | 'roadmap' | 'sessions' | 'settings';

export default function AdminPanel({ userId, userRole, onSelectOrder }: AdminPanelProps) {
  const [activeCategory, setActiveCategory] = useState<MainCategory>('operations');
  const [activeTab, setActiveTab] = useState<SubTab>('orders');
  const [storeId, setStoreId] = useState<string>('');

  useEffect(() => {
    const loadStoreId = async () => {
      const { data } = await supabase
        .from('users')
        .select('store_id')
        .eq('id', userId)
        .single();

      if (data?.store_id) {
        setStoreId(data.store_id);
      }
    };
    loadStoreId();
  }, [userId]);

  const handleTabChange = (category: MainCategory, tab: SubTab) => {
    setActiveCategory(category);
    setActiveTab(tab);
  };

  return (
    <div className="min-h-screen bg-gray-50 pb-20">
      <div className="border-b border-gray-200 bg-white">
        <div className="flex overflow-x-auto border-b border-gray-100">
          <button
            onClick={() => setActiveCategory('operations')}
            className={`flex items-center gap-2 px-6 py-3 font-semibold transition ${
              activeCategory === 'operations'
                ? 'text-amber-600 bg-amber-50'
                : 'text-gray-600 hover:text-gray-800 hover:bg-gray-50'
            }`}
          >
            <Package className="w-5 h-5" />
            Operacje
          </button>
          <button
            onClick={() => setActiveCategory('catalog')}
            className={`flex items-center gap-2 px-6 py-3 font-semibold transition ${
              activeCategory === 'catalog'
                ? 'text-amber-600 bg-amber-50'
                : 'text-gray-600 hover:text-gray-800 hover:bg-gray-50'
            }`}
          >
            <DollarSign className="w-5 h-5" />
            Katalog i ceny
          </button>
          <button
            onClick={() => setActiveCategory('analytics')}
            className={`flex items-center gap-2 px-6 py-3 font-semibold transition ${
              activeCategory === 'analytics'
                ? 'text-amber-600 bg-amber-50'
                : 'text-gray-600 hover:text-gray-800 hover:bg-gray-50'
            }`}
          >
            <BarChart3 className="w-5 h-5" />
            Analityka i AI
          </button>
          <button
            onClick={() => setActiveCategory('communication')}
            className={`flex items-center gap-2 px-6 py-3 font-semibold transition ${
              activeCategory === 'communication'
                ? 'text-amber-600 bg-amber-50'
                : 'text-gray-600 hover:text-gray-800 hover:bg-gray-50'
            }`}
          >
            <Megaphone className="w-5 h-5" />
            Komunikacja
          </button>
          <button
            onClick={() => setActiveCategory('system')}
            className={`flex items-center gap-2 px-6 py-3 font-semibold transition ${
              activeCategory === 'system'
                ? 'text-amber-600 bg-amber-50'
                : 'text-gray-600 hover:text-gray-800 hover:bg-gray-50'
            }`}
          >
            <Settings className="w-5 h-5" />
            System
          </button>
        </div>

        <div className="flex overflow-x-auto bg-gray-50">
          {activeCategory === 'operations' && (
            <>
              <button
                onClick={() => handleTabChange('operations', 'orders')}
                className={`flex items-center gap-2 px-4 py-3 font-medium transition whitespace-nowrap ${
                  activeTab === 'orders'
                    ? 'text-amber-600 border-b-2 border-amber-600 bg-white'
                    : 'text-gray-600 hover:text-gray-800'
                }`}
              >
                <Package className="w-4 h-4" />
                Zamówienia
              </button>
              <button
                onClick={() => handleTabChange('operations', 'stores')}
                className={`flex items-center gap-2 px-4 py-3 font-medium transition whitespace-nowrap ${
                  activeTab === 'stores'
                    ? 'text-amber-600 border-b-2 border-amber-600 bg-white'
                    : 'text-gray-600 hover:text-gray-800'
                }`}
              >
                <ShoppingBag className="w-4 h-4" />
                Sklepy i grupy
              </button>
              <button
                onClick={() => handleTabChange('operations', 'users')}
                className={`flex items-center gap-2 px-4 py-3 font-medium transition whitespace-nowrap ${
                  activeTab === 'users'
                    ? 'text-amber-600 border-b-2 border-amber-600 bg-white'
                    : 'text-gray-600 hover:text-gray-800'
                }`}
              >
                <UserCog className="w-4 h-4" />
                Użytkownicy
              </button>
              <button
                onClick={() => handleTabChange('operations', 'salesperson_assignments')}
                className={`flex items-center gap-2 px-4 py-3 font-medium transition whitespace-nowrap ${
                  activeTab === 'salesperson_assignments'
                    ? 'text-amber-600 border-b-2 border-amber-600 bg-white'
                    : 'text-gray-600 hover:text-gray-800'
                }`}
              >
                <UserCheck className="w-4 h-4" />
                Przypisania handlowców
              </button>
            </>
          )}

          {activeCategory === 'catalog' && (
            <>
              <button
                onClick={() => handleTabChange('catalog', 'products')}
                className={`flex items-center gap-2 px-4 py-3 font-medium transition whitespace-nowrap ${
                  activeTab === 'products'
                    ? 'text-amber-600 border-b-2 border-amber-600 bg-white'
                    : 'text-gray-600 hover:text-gray-800'
                }`}
              >
                <Package className="w-4 h-4" />
                Produkty
              </button>
              <button
                onClick={() => handleTabChange('catalog', 'pricelists')}
                className={`flex items-center gap-2 px-4 py-3 font-medium transition whitespace-nowrap ${
                  activeTab === 'pricelists'
                    ? 'text-amber-600 border-b-2 border-amber-600 bg-white'
                    : 'text-gray-600 hover:text-gray-800'
                }`}
              >
                <DollarSign className="w-4 h-4" />
                Cenniki
              </button>
              <button
                onClick={() => handleTabChange('catalog', 'promotions')}
                className={`flex items-center gap-2 px-4 py-3 font-medium transition whitespace-nowrap ${
                  activeTab === 'promotions'
                    ? 'text-amber-600 border-b-2 border-amber-600 bg-white'
                    : 'text-gray-600 hover:text-gray-800'
                }`}
              >
                <Percent className="w-4 h-4" />
                Promocje i ceny specjalne
              </button>
            </>
          )}

          {activeCategory === 'analytics' && (
            <>
              <button
                onClick={() => handleTabChange('analytics', 'ai')}
                className={`flex items-center gap-2 px-4 py-3 font-medium transition whitespace-nowrap ${
                  activeTab === 'ai'
                    ? 'text-amber-600 border-b-2 border-amber-600 bg-white'
                    : 'text-gray-600 hover:text-gray-800'
                }`}
              >
                <Brain className="w-4 h-4" />
                Uczenie AI
              </button>
              <button
                onClick={() => handleTabChange('analytics', 'demand_forecast')}
                className={`flex items-center gap-2 px-4 py-3 font-medium transition whitespace-nowrap ${
                  activeTab === 'demand_forecast'
                    ? 'text-amber-600 border-b-2 border-amber-600 bg-white'
                    : 'text-gray-600 hover:text-gray-800'
                }`}
              >
                <TrendingUp className="w-4 h-4" />
                Prognoza popytu
              </button>
              <button
                onClick={() => handleTabChange('analytics', 'sessions')}
                className={`flex items-center gap-2 px-4 py-3 font-medium transition whitespace-nowrap ${
                  activeTab === 'sessions'
                    ? 'text-amber-600 border-b-2 border-amber-600 bg-white'
                    : 'text-gray-600 hover:text-gray-800'
                }`}
              >
                <Monitor className="w-4 h-4" />
                Sesje użytkowników
              </button>
            </>
          )}

          {activeCategory === 'communication' && (
            <>
              <button
                onClick={() => handleTabChange('communication', 'email_logs')}
                className={`flex items-center gap-2 px-4 py-3 font-medium transition whitespace-nowrap ${
                  activeTab === 'email_logs'
                    ? 'text-amber-600 border-b-2 border-amber-600 bg-white'
                    : 'text-gray-600 hover:text-gray-800'
                }`}
              >
                <Mail className="w-4 h-4" />
                Logi emaili
              </button>
              <button
                onClick={() => handleTabChange('communication', 'banners')}
                className={`flex items-center gap-2 px-4 py-3 font-medium transition whitespace-nowrap ${
                  activeTab === 'banners'
                    ? 'text-amber-600 border-b-2 border-amber-600 bg-white'
                    : 'text-gray-600 hover:text-gray-800'
                }`}
              >
                <Tag className="w-4 h-4" />
                Banery okolicznościowe
              </button>
              <button
                onClick={() => handleTabChange('communication', 'announcements')}
                className={`flex items-center gap-2 px-4 py-3 font-medium transition whitespace-nowrap ${
                  activeTab === 'announcements'
                    ? 'text-amber-600 border-b-2 border-amber-600 bg-white'
                    : 'text-gray-600 hover:text-gray-800'
                }`}
              >
                <Bell className="w-4 h-4" />
                Ogłoszenia systemowe
              </button>
            </>
          )}

          {activeCategory === 'system' && (
            <>
              <button
                onClick={() => handleTabChange('system', 'roadmap')}
                className={`flex items-center gap-2 px-4 py-3 font-medium transition whitespace-nowrap ${
                  activeTab === 'roadmap'
                    ? 'text-amber-600 border-b-2 border-amber-600 bg-white'
                    : 'text-gray-600 hover:text-gray-800'
                }`}
              >
                <Map className="w-4 h-4" />
                Roadmapa rozwoju
              </button>
              <button
                onClick={() => handleTabChange('system', 'settings')}
                className={`flex items-center gap-2 px-4 py-3 font-medium transition whitespace-nowrap ${
                  activeTab === 'settings'
                    ? 'text-amber-600 border-b-2 border-amber-600 bg-white'
                    : 'text-gray-600 hover:text-gray-800'
                }`}
              >
                <Settings className="w-4 h-4" />
                Ustawienia systemu
              </button>
            </>
          )}
        </div>
      </div>

      <div className="p-6">
        {activeTab === 'orders' && (
          <OrdersList userRole={userRole} onSelectOrder={onSelectOrder} />
        )}

        {activeTab === 'stores' && (
          <StoresAndGroupsManager />
        )}

        {activeTab === 'products' && <ProductManager />}

        {activeTab === 'pricelists' && <PriceListManager />}

        {activeTab === 'promotions' && <PromotionsAndPrices />}

        {activeTab === 'users' && <UsersManager />}

        {activeTab === 'salesperson_assignments' && <SalespersonAssignments />}

        {activeTab === 'ai' && storeId && <AILearningPanel storeId={storeId} />}

        {activeTab === 'banners' && <BannersManager />}

        {activeTab === 'email_logs' && <EmailLogsPanel />}

        {activeTab === 'announcements' && <AnnouncementsManager />}

        {activeTab === 'demand_forecast' && <DemandForecastPanel />}

        {activeTab === 'roadmap' && <RoadmapManager isAdmin={userRole === 'admin'} />}

        {activeTab === 'sessions' && <SessionsBrowserPanel />}

        {activeTab === 'settings' && <SystemSettings userId={userId} />}
      </div>
    </div>
  );
}
