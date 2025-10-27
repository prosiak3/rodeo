import { useState, useEffect } from 'react';
import { Package, ShoppingBag, DollarSign, Settings, UserCog, Brain, Tag, Percent, UserCheck, Mail, Bell, HelpCircle, Menu, X } from 'lucide-react';
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
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

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

  const handleTabChange = (tab: TabType) => {
    setActiveTab(tab);
    setMobileMenuOpen(false);
  };

  const categoryLabels = {
    main: 'Główne',
    management: 'Zarządzanie',
    system: 'System'
  };

  return (
    <div className="min-h-screen bg-gray-50 pb-20">
      {/* Desktop Navigation - Grouped */}
      <div className="hidden lg:block border-b border-gray-200 bg-white sticky top-0 z-10 shadow-sm">
        <div className="px-4">
          <div className="grid grid-cols-3 gap-4 py-2">
            {/* Main Section */}
            <div className="border-r border-gray-200 pr-4">
              <h3 className="text-xs font-semibold text-gray-500 uppercase mb-2 px-2">
                {categoryLabels.main}
              </h3>
              <div className="space-y-1">
                {menuItems.filter(item => item.category === 'main').map(item => (
                  <button
                    key={item.id}
                    onClick={() => handleTabChange(item.id)}
                    className={`w-full flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition ${
                      activeTab === item.id
                        ? 'bg-amber-50 text-amber-700 border border-amber-200'
                        : 'text-gray-600 hover:bg-gray-50 hover:text-gray-800'
                    }`}
                  >
                    <item.icon className="w-4 h-4 flex-shrink-0" />
                    <span className="truncate">{item.label}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Management Section */}
            <div className="border-r border-gray-200 pr-4">
              <h3 className="text-xs font-semibold text-gray-500 uppercase mb-2 px-2">
                {categoryLabels.management}
              </h3>
              <div className="space-y-1">
                {menuItems.filter(item => item.category === 'management').map(item => (
                  <button
                    key={item.id}
                    onClick={() => handleTabChange(item.id)}
                    className={`w-full flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition ${
                      activeTab === item.id
                        ? 'bg-amber-50 text-amber-700 border border-amber-200'
                        : 'text-gray-600 hover:bg-gray-50 hover:text-gray-800'
                    }`}
                  >
                    <item.icon className="w-4 h-4 flex-shrink-0" />
                    <span className="truncate">{item.label}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* System Section */}
            <div>
              <h3 className="text-xs font-semibold text-gray-500 uppercase mb-2 px-2">
                {categoryLabels.system}
              </h3>
              <div className="space-y-1">
                {menuItems.filter(item => item.category === 'system').map(item => (
                  <button
                    key={item.id}
                    onClick={() => handleTabChange(item.id)}
                    className={`w-full flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition ${
                      activeTab === item.id
                        ? 'bg-amber-50 text-amber-700 border border-amber-200'
                        : 'text-gray-600 hover:bg-gray-50 hover:text-gray-800'
                    }`}
                  >
                    <item.icon className="w-4 h-4 flex-shrink-0" />
                    <span className="truncate">{item.label}</span>
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Mobile/Tablet Navigation */}
      <div className="lg:hidden border-b border-gray-200 bg-white sticky top-0 z-10 shadow-sm">
        <div className="flex items-center justify-between px-4 py-3">
          <div className="flex items-center gap-3">
            {menuItems.find(item => item.id === activeTab) && (
              <>
                {(() => {
                  const ActiveIcon = menuItems.find(item => item.id === activeTab)!.icon;
                  return <ActiveIcon className="w-5 h-5 text-amber-600" />;
                })()}
                <span className="font-semibold text-gray-800">
                  {menuItems.find(item => item.id === activeTab)?.label}
                </span>
              </>
            )}
          </div>
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="p-2 rounded-lg hover:bg-gray-100 transition"
          >
            {mobileMenuOpen ? (
              <X className="w-6 h-6 text-gray-600" />
            ) : (
              <Menu className="w-6 h-6 text-gray-600" />
            )}
          </button>
        </div>

        {/* Mobile Menu Dropdown */}
        {mobileMenuOpen && (
          <div className="absolute top-full left-0 right-0 bg-white border-b border-gray-200 shadow-lg max-h-[80vh] overflow-y-auto">
            <div className="p-4 space-y-4">
              {['main', 'management', 'system'].map(category => (
                <div key={category}>
                  <h3 className="text-xs font-semibold text-gray-500 uppercase mb-2">
                    {categoryLabels[category as keyof typeof categoryLabels]}
                  </h3>
                  <div className="space-y-1">
                    {menuItems.filter(item => item.category === category).map(item => (
                      <button
                        key={item.id}
                        onClick={() => handleTabChange(item.id)}
                        className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition ${
                          activeTab === item.id
                            ? 'bg-amber-50 text-amber-700 border border-amber-200'
                            : 'text-gray-600 hover:bg-gray-50 hover:text-gray-800'
                        }`}
                      >
                        <item.icon className="w-5 h-5 flex-shrink-0" />
                        <span>{item.label}</span>
                      </button>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
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
        {activeTab === 'help_tooltips' && <HelpTooltipsManager />}
        {activeTab === 'settings' && <SystemSettings userId={userId} />}
      </div>
    </div>
  );
}
