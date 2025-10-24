import { Home, Plus, Package, Tag, Settings } from 'lucide-react';
import { useTheme } from '../contexts/ThemeContext';

interface BottomNavProps {
  activeTab: 'home' | 'new-order' | 'orders' | 'prices' | 'profile' | 'admin';
  onTabChange: (tab: 'home' | 'new-order' | 'orders' | 'prices' | 'profile' | 'admin') => void;
  userRole?: string;
}

export default function BottomNav({ activeTab, onTabChange, userRole }: BottomNavProps) {
  const { colors } = useTheme();

  if (userRole === 'admin' || userRole === 'operator') {
    return (
      <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 shadow-lg z-40">
        <div className="flex justify-around items-center h-16 sm:h-20">
          <button
            onClick={() => onTabChange('home')}
            className="flex flex-col items-center justify-center flex-1 h-full transition text-gray-600 px-1"
            style={activeTab === 'home' ? { color: colors.primary } : {}}
          >
            <Settings className="w-5 h-5 sm:w-7 sm:h-7" />
            <span className="text-xs sm:text-sm mt-0.5 sm:mt-1">Panel</span>
          </button>
        </div>
      </div>
    );
  }

  if (userRole === 'salesperson') {
    return (
      <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 shadow-lg z-40">
        <div className="flex justify-around items-center h-16 sm:h-20">
          <button
            onClick={() => onTabChange('home')}
            className="flex flex-col items-center justify-center flex-1 h-full transition text-gray-600 px-1"
            style={activeTab === 'home' ? { color: colors.primary } : {}}
          >
            <Home className="w-5 h-5 sm:w-7 sm:h-7" />
            <span className="text-xs sm:text-sm mt-0.5 sm:mt-1">Główna</span>
          </button>

          <button
            onClick={() => onTabChange('orders')}
            className="flex flex-col items-center justify-center flex-1 h-full transition text-gray-600 px-1"
            style={activeTab === 'orders' ? { color: colors.primary } : {}}
          >
            <Package className="w-5 h-5 sm:w-7 sm:h-7" />
            <span className="text-xs sm:text-sm mt-0.5 sm:mt-1 truncate">Zamówienia</span>
          </button>

          <button
            onClick={() => onTabChange('prices')}
            className="flex flex-col items-center justify-center flex-1 h-full transition text-gray-600 px-1"
            style={activeTab === 'prices' ? { color: colors.primary } : {}}
          >
            <Tag className="w-5 h-5 sm:w-7 sm:h-7" />
            <span className="text-xs sm:text-sm mt-0.5 sm:mt-1">Cennik</span>
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 shadow-lg z-40">
      <div className="flex justify-around items-center h-16 sm:h-20">
        <button
          onClick={() => onTabChange('home')}
          className="flex flex-col items-center justify-center flex-1 h-full transition text-gray-600 px-1"
          style={activeTab === 'home' ? { color: colors.primary } : {}}
        >
          <Home className="w-5 h-5 sm:w-7 sm:h-7" />
          <span className="text-xs sm:text-sm mt-0.5 sm:mt-1">Główna</span>
        </button>

        <button
          onClick={() => onTabChange('new-order')}
          className="flex flex-col items-center justify-center flex-1 h-full transition text-gray-600 px-1"
          style={activeTab === 'new-order' ? { color: colors.primary } : {}}
        >
          <Plus className="w-5 h-5 sm:w-7 sm:h-7" />
          <span className="text-xs sm:text-sm mt-0.5 sm:mt-1">Nowe</span>
        </button>

        <button
          onClick={() => onTabChange('orders')}
          className="flex flex-col items-center justify-center flex-1 h-full transition text-gray-600 px-1"
          style={activeTab === 'orders' ? { color: colors.primary } : {}}
        >
          <Package className="w-5 h-5 sm:w-7 sm:h-7" />
          <span className="text-xs sm:text-sm mt-0.5 sm:mt-1 truncate">Zamówienia</span>
        </button>

        <button
          onClick={() => onTabChange('prices')}
          className="flex flex-col items-center justify-center flex-1 h-full transition text-gray-600 px-1"
          style={activeTab === 'prices' ? { color: colors.primary } : {}}
        >
          <Tag className="w-5 h-5 sm:w-7 sm:h-7" />
          <span className="text-xs sm:text-sm mt-0.5 sm:mt-1">Cennik</span>
        </button>
      </div>
    </div>
  );
}
