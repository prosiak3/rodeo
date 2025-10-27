import { useState, useEffect } from 'react';
import { Package, ShoppingBag, DollarSign, Settings, UserCog, Brain, Tag, Percent, UserCheck, Mail, Bell, HelpCircle, ChevronLeft, ChevronRight } from 'lucide-react';
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
import HelpTooltipsManager from './HelpTooltipsManager';
import { supabase } from '../lib/supabase';

interface AdminPanelProps {
  userId: string;
  userRole: string;
  onSelectOrder: (orderId: string) => void;
}

type TabType = 'orders' | 'stores' | 'products' | 'pricelists' | 'promotions' | 'users' | 'salesperson_assignments' | 'ai' | 'banners' | 'announcements' | 'email_logs' | 'help_tooltips' | 'settings';

interface MenuItem {
  id: TabType;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  category: 'main' | 'management' | 'system';
}

const menuItems: MenuItem[] = [
  { id: 'orders', label: 'Zamówienia', icon: Package, category: 'main' },
  { id: 'stores', label: 'Sklepy', icon: ShoppingBag, category: 'management' },
  { id: 'products', label: 'Produkty', icon: Package, category: 'management' },
  { id: 'pricelists', label: 'Cenniki', icon: DollarSign, category: 'management' },
  { id: 'promotions', label: 'Promocje', icon: Percent, category: 'management' },
  { id: 'users', label: 'Użytkownicy', icon: UserCog, category: 'management' },
  { id: 'salesperson_assignments', label: 'Handlowcy', icon: UserCheck, category: 'management' },
  { id: 'ai', label: 'AI', icon: Brain, category: 'system' },
  { id: 'banners', label: 'Banery', icon: Tag, category: 'system' },
  { id: 'announcements', label: 'Ogłoszenia', icon: Bell, category: 'system' },
  { id: 'email_logs', label: 'Logi emaili', icon: Mail, category: 'system' },
  { id: 'help_tooltips', label: 'Podpowiedzi', icon: HelpCircle, category: 'system' },
  { id: 'settings', label: 'Ustawienia', icon: Settings, category: 'system' },
];

export default function AdminPanel({ userId, userRole, onSelectOrder }: AdminPanelProps) {
  const [activeTab, setActiveTab] = useState<TabType>('orders');
  const [storeId, setStoreId] = useState<string>('');
  const [sidebarCollapsed, setSidebarCollapsed] = useState(() => {
    const saved = localStorage.getItem('adminSidebarCollapsed');
    return saved ? JSON.parse(saved) : false;
  });

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

  useEffect(() => {
    localStorage.setItem('adminSidebarCollapsed', JSON.stringify(sidebarCollapsed));
  }, [sidebarCollapsed]);

  const handleTabChange = (tab: TabType) => {
    setActiveTab(tab);
  };

  const toggleSidebar = () => {
    setSidebarCollapsed(!sidebarCollapsed);
  };

  const categoryLabels = {
    main: 'Główne',
    management: 'Zarządzanie',
    system: 'System'
  };

  return (
    <div className="flex min-h-screen bg-gray-50 pb-20">
      {/* Left Sidebar */}
      <div
        className={`fixed left-0 top-0 h-full bg-white border-r border-gray-200 shadow-lg transition-all duration-300 ease-in-out z-20 ${
          sidebarCollapsed ? 'w-16' : 'w-64'
        }`}
      >
        {/* Collapse/Expand Button */}
        <button
          onClick={toggleSidebar}
          className="absolute -right-3 top-6 bg-white border-2 border-gray-200 rounded-full p-1 shadow-md hover:bg-gray-50 transition z-30"
          title={sidebarCollapsed ? 'Rozwiń menu' : 'Zwiń menu'}
        >
          {sidebarCollapsed ? (
            <ChevronRight className="w-4 h-4 text-gray-600" />
          ) : (
            <ChevronLeft className="w-4 h-4 text-gray-600" />
          )}
        </button>

        {/* Sidebar Header */}
        <div className="p-4 border-b border-gray-200">
          {!sidebarCollapsed ? (
            <h2 className="font-bold text-xl text-gray-800">Panel Admina</h2>
          ) : (
            <div className="flex justify-center">
              <Settings className="w-6 h-6 text-amber-600" />
            </div>
          )}
        </div>

        {/* Sidebar Menu */}
        <div className="overflow-y-auto h-[calc(100vh-80px)] py-4">
          {['main', 'management', 'system'].map(category => (
            <div key={category} className="mb-6">
              {!sidebarCollapsed && (
                <h3 className="px-4 text-xs font-semibold text-gray-500 uppercase mb-2">
                  {categoryLabels[category as keyof typeof categoryLabels]}
                </h3>
              )}
              <div className="space-y-1 px-2">
                {menuItems.filter(item => item.category === category).map(item => (
                  <button
                    key={item.id}
                    onClick={() => handleTabChange(item.id)}
                    className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition group relative ${
                      activeTab === item.id
                        ? 'bg-gradient-to-r from-amber-500 to-orange-600 text-white shadow-md'
                        : 'text-gray-700 hover:bg-gray-100'
                    }`}
                    title={sidebarCollapsed ? item.label : undefined}
                  >
                    <item.icon className={`flex-shrink-0 ${sidebarCollapsed ? 'w-5 h-5' : 'w-4 h-4'}`} />
                    {!sidebarCollapsed && <span className="truncate">{item.label}</span>}

                    {/* Tooltip for collapsed state */}
                    {sidebarCollapsed && (
                      <div className="absolute left-full ml-2 px-2 py-1 bg-gray-800 text-white text-xs rounded opacity-0 invisible group-hover:opacity-100 group-hover:visible transition whitespace-nowrap z-50">
                        {item.label}
                      </div>
                    )}
                  </button>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Main Content Area */}
      <div
        className={`flex-1 transition-all duration-300 ease-in-out ${
          sidebarCollapsed ? 'ml-16' : 'ml-64'
        }`}
      >
        {/* Top Bar - Optional breadcrumb or title */}
        <div className="bg-white border-b border-gray-200 px-6 py-4 sticky top-0 z-10">
          <div className="flex items-center gap-3">
            {(() => {
              const currentItem = menuItems.find(item => item.id === activeTab);
              if (!currentItem) return null;
              const Icon = currentItem.icon;
              return (
                <>
                  <Icon className="w-6 h-6 text-amber-600" />
                  <h1 className="text-2xl font-bold text-gray-800">{currentItem.label}</h1>
                </>
              );
            })()}
          </div>
        </div>

        {/* Content */}
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

          {activeTab === 'help_tooltips' && <HelpTooltipsManager />}

          {activeTab === 'settings' && <SystemSettings userId={userId} />}
        </div>
      </div>
    </div>
  );
}
