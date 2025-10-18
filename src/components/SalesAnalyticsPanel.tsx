import { useState } from 'react';
import { supabase } from '../lib/supabase';
import { TrendingUp, Store, LogOut, Package } from 'lucide-react';
import TopProductsPanel from './TopProductsPanel';
import StoreAnalyticsPanel from './StoreAnalyticsPanel';

export default function SalesAnalyticsPanel() {
  const [activeTab, setActiveTab] = useState<'products' | 'stores'>('stores');

  const handleLogout = async () => {
    await supabase.auth.signOut();
    window.location.reload();
  };

  const renderTabs = () => (
    <div className="flex gap-2 border-b border-gray-200 mb-6">
      <button
        onClick={() => setActiveTab('stores')}
        className={`flex items-center gap-2 px-4 py-2 font-medium transition-colors ${
          activeTab === 'stores'
            ? 'text-blue-600 border-b-2 border-blue-600'
            : 'text-gray-600 hover:text-gray-900'
        }`}
      >
        <Store className="w-5 h-5" />
        Analiza Placówek
      </button>
      <button
        onClick={() => setActiveTab('products')}
        className={`flex items-center gap-2 px-4 py-2 font-medium transition-colors ${
          activeTab === 'products'
            ? 'text-blue-600 border-b-2 border-blue-600'
            : 'text-gray-600 hover:text-gray-900'
        }`}
      >
        <TrendingUp className="w-5 h-5" />
        Top Produkty
      </button>
    </div>
  );

  if (activeTab === 'products') {
    return (
      <div className="min-h-screen bg-gray-50 p-6">
        <div className="max-w-7xl mx-auto space-y-6">
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
                  <Package className="w-8 h-8 text-blue-600" />
                  Panel Sprzedażowy
                </h1>
                <p className="text-gray-600 mt-1">Analiza sprzedaży, zamówień i produktów</p>
              </div>
              <button
                onClick={handleLogout}
                className="flex items-center gap-2 px-6 py-3 bg-red-600 text-white rounded-lg hover:bg-red-700 transition text-base"
              >
                <LogOut className="w-5 h-5" />
                Wyloguj
              </button>
            </div>
            {renderTabs()}
          </div>
          <TopProductsPanel />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
                <Package className="w-8 h-8 text-blue-600" />
                Panel Sprzedażowy
              </h1>
              <p className="text-gray-600 mt-1">Analiza sprzedaży, zamówień i produktów</p>
            </div>
            <button
              onClick={handleLogout}
              className="flex items-center gap-2 px-6 py-3 bg-red-600 text-white rounded-lg hover:bg-red-700 transition text-base"
            >
              <LogOut className="w-5 h-5" />
              Wyloguj
            </button>
          </div>
          {renderTabs()}
        </div>
        <StoreAnalyticsPanel />
      </div>
    </div>
  );
}
