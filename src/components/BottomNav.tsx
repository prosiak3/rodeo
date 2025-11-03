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
      <nav
        className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 shadow-lg z-40"
        style={{ paddingBottom: 'max(env(safe-area-inset-bottom), 8px)' }}
      >
        <div className="flex justify-around items-center px-2" style={{ minHeight: '64px' }}>
          <button
            onClick={() => onTabChange('home')}
            className="flex flex-col items-center justify-center flex-1 py-2 px-3 rounded-lg transition-all duration-200 active:scale-95 active:bg-gray-100"
            style={activeTab === 'home' ? { color: colors.primary } : { color: '#6b7280' }}
            aria-label="Panel administracyjny"
            aria-current={activeTab === 'home' ? 'page' : undefined}
          >
            <Settings className="w-7 h-7 mb-1" />
            <span className="text-xs font-medium">Panel</span>
          </button>
        </div>
      </nav>
    );
  }

  if (userRole === 'salesperson') {
    return (
      <nav
        className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 shadow-lg z-40"
        style={{ paddingBottom: 'max(env(safe-area-inset-bottom), 8px)' }}
      >
        <div className="flex justify-around items-center px-2" style={{ minHeight: '64px' }}>
          <button
            onClick={() => onTabChange('home')}
            className="flex flex-col items-center justify-center flex-1 py-2 px-3 rounded-lg transition-all duration-200 active:scale-95 active:bg-gray-100"
            style={activeTab === 'home' ? { color: colors.primary } : { color: '#6b7280' }}
            aria-label="Strona główna"
            aria-current={activeTab === 'home' ? 'page' : undefined}
          >
            <Home className="w-7 h-7 mb-1" />
            <span className="text-xs font-medium">Główna</span>
          </button>

          <button
            onClick={() => onTabChange('orders')}
            className="flex flex-col items-center justify-center flex-1 py-2 px-3 rounded-lg transition-all duration-200 active:scale-95 active:bg-gray-100"
            style={activeTab === 'orders' ? { color: colors.primary } : { color: '#6b7280' }}
            aria-label="Zamówienia"
            aria-current={activeTab === 'orders' ? 'page' : undefined}
          >
            <Package className="w-7 h-7 mb-1" />
            <span className="text-xs font-medium">Zamówienia</span>
          </button>

          <button
            onClick={() => onTabChange('prices')}
            className="flex flex-col items-center justify-center flex-1 py-2 px-3 rounded-lg transition-all duration-200 active:scale-95 active:bg-gray-100"
            style={activeTab === 'prices' ? { color: colors.primary } : { color: '#6b7280' }}
            aria-label="Cennik"
            aria-current={activeTab === 'prices' ? 'page' : undefined}
          >
            <Tag className="w-7 h-7 mb-1" />
            <span className="text-xs font-medium">Cennik</span>
          </button>
        </div>
      </nav>
    );
  }

  return (
    <nav
      className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 shadow-lg z-40"
      style={{ paddingBottom: 'max(env(safe-area-inset-bottom), 8px)' }}
    >
      <div className="flex justify-around items-center px-2" style={{ minHeight: '64px' }}>
        <button
          onClick={() => onTabChange('home')}
          className="flex flex-col items-center justify-center flex-1 py-2 px-3 rounded-lg transition-all duration-200 active:scale-95 active:bg-gray-100"
          style={activeTab === 'home' ? { color: colors.primary } : { color: '#6b7280' }}
          aria-label="Strona główna"
          aria-current={activeTab === 'home' ? 'page' : undefined}
        >
          <Home className="w-7 h-7 mb-1" />
          <span className="text-xs font-medium">Główna</span>
        </button>

        <button
          onClick={() => onTabChange('new-order')}
          className="flex flex-col items-center justify-center flex-1 py-2 px-3 rounded-lg transition-all duration-200 active:scale-95 active:bg-gray-100"
          style={activeTab === 'new-order' ? { color: colors.primary } : { color: '#6b7280' }}
          aria-label="Nowe zamówienie"
          aria-current={activeTab === 'new-order' ? 'page' : undefined}
        >
          <Plus className="w-7 h-7 mb-1" />
          <span className="text-xs font-medium">Nowe</span>
        </button>

        <button
          onClick={() => onTabChange('orders')}
          className="flex flex-col items-center justify-center flex-1 py-2 px-3 rounded-lg transition-all duration-200 active:scale-95 active:bg-gray-100"
          style={activeTab === 'orders' ? { color: colors.primary } : { color: '#6b7280' }}
          aria-label="Zamówienia"
          aria-current={activeTab === 'orders' ? 'page' : undefined}
        >
          <Package className="w-7 h-7 mb-1" />
          <span className="text-xs font-medium">Zamówienia</span>
        </button>

        <button
          onClick={() => onTabChange('prices')}
          className="flex flex-col items-center justify-center flex-1 py-2 px-3 rounded-lg transition-all duration-200 active:scale-95 active:bg-gray-100"
          style={activeTab === 'prices' ? { color: colors.primary } : { color: '#6b7280' }}
          aria-label="Cennik"
          aria-current={activeTab === 'prices' ? 'page' : undefined}
        >
          <Tag className="w-7 h-7 mb-1" />
          <span className="text-xs font-medium">Cennik</span>
        </button>
      </div>
    </nav>
  );
}
