import { Home, Plus, Package, User, Tag } from 'lucide-react';

interface BottomNavProps {
  activeTab: 'home' | 'new-order' | 'orders' | 'prices' | 'profile';
  onTabChange: (tab: 'home' | 'new-order' | 'orders' | 'prices' | 'profile') => void;
}

export default function BottomNav({ activeTab, onTabChange }: BottomNavProps) {
  return (
    <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 shadow-lg">
      <div className="flex justify-around items-center h-16">
        <button
          onClick={() => onTabChange('home')}
          className={`flex flex-col items-center justify-center flex-1 h-full transition ${
            activeTab === 'home' ? 'text-amber-600' : 'text-gray-600'
          }`}
        >
          <Home className="w-6 h-6" />
          <span className="text-xs mt-1">Główna</span>
        </button>

        <button
          onClick={() => onTabChange('new-order')}
          className={`flex flex-col items-center justify-center flex-1 h-full transition ${
            activeTab === 'new-order' ? 'text-amber-600' : 'text-gray-600'
          }`}
        >
          <Plus className="w-6 h-6" />
          <span className="text-xs mt-1">Nowe</span>
        </button>

        <button
          onClick={() => onTabChange('orders')}
          className={`flex flex-col items-center justify-center flex-1 h-full transition ${
            activeTab === 'orders' ? 'text-amber-600' : 'text-gray-600'
          }`}
        >
          <Package className="w-6 h-6" />
          <span className="text-xs mt-1">Zamówienia</span>
        </button>

        <button
          onClick={() => onTabChange('prices')}
          className={`flex flex-col items-center justify-center flex-1 h-full transition ${
            activeTab === 'prices' ? 'text-amber-600' : 'text-gray-600'
          }`}
        >
          <Tag className="w-5 h-5" />
          <span className="text-xs mt-1">Cennik</span>
        </button>

        <button
          onClick={() => onTabChange('profile')}
          className={`flex flex-col items-center justify-center flex-1 h-full transition ${
            activeTab === 'profile' ? 'text-amber-600' : 'text-gray-600'
          }`}
        >
          <User className="w-6 h-6" />
          <span className="text-xs mt-1">Profil</span>
        </button>
      </div>
    </div>
  );
}
