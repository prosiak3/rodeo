import { useState } from 'react';
import { Package, Users, ShoppingBag, DollarSign, Settings, UserCog } from 'lucide-react';
import OrdersList from './OrdersList';
import PriceListManager from './PriceListManager';
import StoresManager from './StoresManager';
import PriceList from './PriceList';
import ProductManager from './ProductManager';
import SystemSettings from './SystemSettings';
import UsersManager from './UsersManager';

interface AdminPanelProps {
  userId: string;
  userRole: string;
  onSelectOrder: (orderId: string) => void;
}

export default function AdminPanel({ userId, userRole, onSelectOrder }: AdminPanelProps) {
  const [activeTab, setActiveTab] = useState<'orders' | 'stores' | 'products' | 'pricelists' | 'users' | 'settings'>('orders');

  return (
    <div className="min-h-screen bg-gray-50 pb-20">
      <div className="bg-gradient-to-r from-amber-500 to-orange-600 text-white p-4">
        <div className="flex items-center gap-3 mb-2">
          <span className="text-4xl">🐃</span>
          <h2 className="text-xl font-bold">Panel Administracyjny</h2>
        </div>
        <p className="text-white font-semibold">Weź byka za rogi</p>
        <p className="text-amber-100 mt-1 text-sm">Zarządzanie systemem RODEO</p>
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
            <Users className="w-5 h-5" />
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

        {activeTab === 'stores' && <StoresManager />}

        {activeTab === 'products' && <ProductManager />}

        {activeTab === 'pricelists' && <PriceListManager />}

        {activeTab === 'users' && <UsersManager />}

        {activeTab === 'settings' && <SystemSettings userId={userId} />}
      </div>
    </div>
  );
}
