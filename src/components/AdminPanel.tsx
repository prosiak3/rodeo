import { useState, useEffect } from 'react';
import { Package, ShoppingBag, DollarSign, Settings, UserCog, Brain, Tag, Percent, UserCheck, Mail, Bell, TrendingUp } from 'lucide-react';
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
import { supabase } from '../lib/supabase';

interface AdminPanelProps {
  userId: string;
  userRole: string;
  onSelectOrder: (orderId: string) => void;
}

export default function AdminPanel({ userId, userRole, onSelectOrder }: AdminPanelProps) {
  const [activeTab, setActiveTab] = useState<'orders' | 'stores' | 'products' | 'pricelists' | 'promotions' | 'users' | 'salesperson_assignments' | 'ai' | 'banners' | 'announcements' | 'email_logs' | 'demand_forecast' | 'settings'>('orders');
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

  return (
    <div className="min-h-screen bg-gray-50 pb-20">
      <div className="border-b border-gray-200 bg-white">
        <div className="flex overflow-x-auto">
          <button
            onClick={() => setActiveTab('orders')}
            className={`flex items-center gap-2 px-6 py-4 font-medium transition ${
              activeTab === 'orders'
                ? 'text-amber-600 border-b-2 border-amber-600'
                : 'text-gray-600 hover:text-gray-800'
            }`}
          >
            <Package className="w-5 h-5" />
            Zamówienia
          </button>
          <button
            onClick={() => setActiveTab('stores')}
            className={`flex items-center gap-2 px-6 py-4 font-medium transition ${
              activeTab === 'stores'
                ? 'text-amber-600 border-b-2 border-amber-600'
                : 'text-gray-600 hover:text-gray-800'
            }`}
          >
            <ShoppingBag className="w-5 h-5" />
            Sklepy
          </button>
          <button
            onClick={() => setActiveTab('products')}
            className={`flex items-center gap-2 px-6 py-4 font-medium transition ${
              activeTab === 'products'
                ? 'text-amber-600 border-b-2 border-amber-600'
                : 'text-gray-600 hover:text-gray-800'
            }`}
          >
            <Package className="w-5 h-5" />
            Produkty
          </button>
          <button
            onClick={() => setActiveTab('pricelists')}
            className={`flex items-center gap-2 px-6 py-4 font-medium transition ${
              activeTab === 'pricelists'
                ? 'text-amber-600 border-b-2 border-amber-600'
                : 'text-gray-600 hover:text-gray-800'
            }`}
          >
            <DollarSign className="w-5 h-5" />
            Cenniki
          </button>
          <button
            onClick={() => setActiveTab('promotions')}
            className={`flex items-center gap-2 px-6 py-4 font-medium transition ${
              activeTab === 'promotions'
                ? 'text-amber-600 border-b-2 border-amber-600'
                : 'text-gray-600 hover:text-gray-800'
            }`}
          >
            <Percent className="w-5 h-5" />
            Promocje i ceny
          </button>
          <button
            onClick={() => setActiveTab('users')}
            className={`flex items-center gap-2 px-6 py-4 font-medium transition ${
              activeTab === 'users'
                ? 'text-amber-600 border-b-2 border-amber-600'
                : 'text-gray-600 hover:text-gray-800'
            }`}
          >
            <UserCog className="w-5 h-5" />
            Użytkownicy
          </button>
          <button
            onClick={() => setActiveTab('salesperson_assignments')}
            className={`flex items-center gap-2 px-6 py-4 font-medium transition ${
              activeTab === 'salesperson_assignments'
                ? 'text-amber-600 border-b-2 border-amber-600'
                : 'text-gray-600 hover:text-gray-800'
            }`}
          >
            <UserCheck className="w-5 h-5" />
            Handlowcy
          </button>
          <button
            onClick={() => setActiveTab('ai')}
            className={`flex items-center gap-2 px-6 py-4 font-medium transition ${
              activeTab === 'ai'
                ? 'text-amber-600 border-b-2 border-amber-600'
                : 'text-gray-600 hover:text-gray-800'
            }`}
          >
            <Brain className="w-5 h-5" />
            AI
          </button>
          <button
            onClick={() => setActiveTab('banners')}
            className={`flex items-center gap-2 px-6 py-4 font-medium transition ${
              activeTab === 'banners'
                ? 'text-amber-600 border-b-2 border-amber-600'
                : 'text-gray-600 hover:text-gray-800'
            }`}
          >
            <Tag className="w-5 h-5" />
            Banery
          </button>
          <button
            onClick={() => setActiveTab('email_logs')}
            className={`flex items-center gap-2 px-6 py-4 font-medium transition ${
              activeTab === 'email_logs'
                ? 'text-amber-600 border-b-2 border-amber-600'
                : 'text-gray-600 hover:text-gray-800'
            }`}
          >
            <Mail className="w-5 h-5" />
            Logi emaili
          </button>
          <button
            onClick={() => setActiveTab('announcements')}
            className={`flex items-center gap-2 px-6 py-4 font-medium transition ${
              activeTab === 'announcements'
                ? 'text-amber-600 border-b-2 border-amber-600'
                : 'text-gray-600 hover:text-gray-800'
            }`}
          >
            <Bell className="w-5 h-5" />
            Ogłoszenia
          </button>
          <button
            onClick={() => setActiveTab('demand_forecast')}
            className={`flex items-center gap-2 px-6 py-4 font-medium transition ${
              activeTab === 'demand_forecast'
                ? 'text-amber-600 border-b-2 border-amber-600'
                : 'text-gray-600 hover:text-gray-800'
            }`}
          >
            <TrendingUp className="w-5 h-5" />
            Prognoza Popytu
          </button>
          <button
            onClick={() => setActiveTab('settings')}
            className={`flex items-center gap-2 px-6 py-4 font-medium transition ${
              activeTab === 'settings'
                ? 'text-amber-600 border-b-2 border-amber-600'
                : 'text-gray-600 hover:text-gray-800'
            }`}
          >
            <Settings className="w-5 h-5" />
            Ustawienia
          </button>
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

        {activeTab === 'settings' && <SystemSettings userId={userId} />}
      </div>
    </div>
  );
}
