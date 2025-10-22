import { useState, useEffect } from 'react';
import { Package, ShoppingBag, DollarSign, Settings, UserCog, Brain, Tag, Percent, UserCheck } from 'lucide-react';
import OrdersList from './OrdersList';
import PriceListManager from './PriceListManager';
import StoresAndGroupsManager from './StoresAndGroupsManager';
import ProductManager from './ProductManager';
import SystemSettings from './SystemSettings';
import UsersManager from './UsersManager';
import AILearningPanel from './AILearningPanel';
import BannersManager from './BannersManager';
import SpecialPricesManager from './SpecialPricesManager';
import SalespersonAssignments from './SalespersonAssignments';
import { supabase } from '../lib/supabase';

interface AdminPanelProps {
  userId: string;
  userRole: string;
  onSelectOrder: (orderId: string) => void;
}

export default function AdminPanel({ userId, userRole, onSelectOrder }: AdminPanelProps) {
  const [activeTab, setActiveTab] = useState<'orders' | 'stores' | 'products' | 'pricelists' | 'specialprices' | 'users' | 'salesperson_assignments' | 'ai' | 'banners' | 'settings'>('orders');
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

  const getTabTitle = () => {
    switch (activeTab) {
      case 'orders': return 'Zamówienia';
      case 'stores': return 'Sklepy i grupy';
      case 'products': return 'Produkty';
      case 'pricelists': return 'Cenniki';
      case 'specialprices': return 'Ceny specjalne';
      case 'users': return 'Użytkownicy';
      case 'salesperson_assignments': return 'Przypisania handlowców';
      case 'ai': return 'Panel AI';
      case 'banners': return 'Banery';
      case 'settings': return 'Ustawienia';
      default: return 'Panel Administracyjny';
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 pb-20">
      <div className="bg-gradient-to-r from-amber-500 to-orange-600 text-white p-4">
        <div className="flex items-center gap-3">
          <span className="text-4xl">🐃</span>
          <div>
            <h2 className="text-xl font-bold">{getTabTitle()}</h2>
            <p className="text-amber-100 text-sm">Zarządzanie systemem RODEO</p>
          </div>
        </div>
      </div>

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
            Sklepy i grupy
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
            onClick={() => setActiveTab('specialprices')}
            className={`flex items-center gap-2 px-6 py-4 font-medium transition ${
              activeTab === 'specialprices'
                ? 'text-amber-600 border-b-2 border-amber-600'
                : 'text-gray-600 hover:text-gray-800'
            }`}
          >
            <Percent className="w-5 h-5" />
            Ceny specjalne
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

        {activeTab === 'specialprices' && <SpecialPricesManager />}

        {activeTab === 'users' && <UsersManager />}

        {activeTab === 'salesperson_assignments' && <SalespersonAssignments />}

        {activeTab === 'ai' && storeId && <AILearningPanel storeId={storeId} />}

        {activeTab === 'banners' && <BannersManager />}

        {activeTab === 'settings' && <SystemSettings userId={userId} />}
      </div>
    </div>
  );
}
