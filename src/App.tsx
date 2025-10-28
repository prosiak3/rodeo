import { useState, useEffect, lazy, Suspense } from 'react';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { ThemeProvider, useTheme } from './contexts/ThemeContext';
import { FontSizeProvider } from './contexts/FontSizeContext';
import LoginScreen from './components/LoginScreen';
import HomeScreen from './components/HomeScreen';
import BottomNav from './components/BottomNav';
import Header from './components/Header';
import SessionCleanupService from './components/SessionCleanupService';
import UserNotifications from './components/UserNotifications';
import RealtimeOrderNotifications from './components/RealtimeOrderNotifications';
import OfflineIndicator from './components/OfflineIndicator';
import { SkeletonList } from './components/Skeleton';
import { supabase, OrderStatus } from './lib/supabase';
import { useUserTracking, closeCurrentSession } from './hooks/useUserTracking';
import { useAutoLogout, saveUserLocation } from './hooks/useAutoLogout';
import useKeyboardShortcuts from './hooks/useKeyboardShortcuts';
import { Grid3x3, List } from 'lucide-react';
import OrdersList from './components/OrdersList';
import OrderDetails from './components/OrderDetails';

// Lazy load heavy components for better performance
const StylesDemo = lazy(() => import('./components/StylesDemo'));
const VoiceOrderScreen = lazy(() => import('./components/VoiceOrderScreen'));
const ManualOrderScreen = lazy(() => import('./components/ManualOrderScreen'));
const CopyOrderScreen = lazy(() => import('./components/CopyOrderScreen'));
const PriceListOrderScreen = lazy(() => import('./components/PriceListOrderScreen'));
const PriceListOrderListMode = lazy(() => import('./components/PriceListOrderListMode'));
const AutoOrderScreen = lazy(() => import('./components/AutoOrderScreen'));
const EditDraftOrderScreen = lazy(() => import('./components/EditDraftOrderScreen'));
const ProfileScreen = lazy(() => import('./components/ProfileScreen'));
const AdminPanel = lazy(() => import('./components/AdminPanel'));
const AnalyticsPanel = lazy(() => import('./components/AnalyticsPanel'));
const SalesAnalyticsPanel = lazy(() => import('./components/SalesAnalyticsPanel'));
const PriceList = lazy(() => import('./components/PriceList'));
const DriverScreen = lazy(() => import('./components/DriverScreen'));

function AppContent() {
  const { session, user, loading, signIn, signOut, savedLocation } = useAuth();
  const { uiTheme } = useTheme();
  const [showStylesDemo, setShowStylesDemo] = useState(() => {
    return window.location.hash === '#styles-demo';
  });
  const [activeTab, setActiveTab] = useState<'home' | 'new-order' | 'orders' | 'prices' | 'profile' | 'admin'>('home');
  const [previousTab, setPreviousTab] = useState<'home' | 'new-order' | 'orders' | 'prices' | 'profile' | 'admin'>('home');
  const [autoLogoutTimeout, setAutoLogoutTimeout] = useState(15);
  const [locationRestored, setLocationRestored] = useState(false);

  const handleTabChange = (newTab: typeof activeTab) => {
    if (newTab !== 'profile') {
      setPreviousTab(activeTab);
    }
    setActiveTab(newTab);
  };

  const getHomeScreenComponent = () => {
    return HomeScreen;
  };
  const [selectedOrderId, setSelectedOrderId] = useState<string | null>(null);
  const [editingOrderId, setEditingOrderId] = useState<string | null>(null);
  const [orderRefreshKey, setOrderRefreshKey] = useState(0);
  const [orderMode, setOrderMode] = useState<'voice' | 'manual' | 'copy' | 'pricelist' | 'auto' | null>(null);
  const [templateOrderId, setTemplateOrderId] = useState<string | null>(null);
  const [addingToNotebookOrderId, setAddingToNotebookOrderId] = useState<string | null>(null);
  const [ordersListFilter, setOrdersListFilter] = useState<OrderStatus | 'all' | null>(null);
  const [aiPreloaded, setAiPreloaded] = useState(false);
  const [analystView, setAnalystView] = useState<'behavior' | 'sales'>('behavior');

  // Initialize user tracking
  useUserTracking(
    user?.id || null,
    editingOrderId ? 'edit-draft' :
    selectedOrderId ? 'order-details' :
    activeTab === 'new-order' && orderMode ? orderMode :
    activeTab
  );

  // Keyboard shortcuts (tylko dla zalogowanych użytkowników)
  useKeyboardShortcuts(
    {
      'h': () => {
        if (session) setActiveTab('home');
      },
      'n': () => {
        if (session) setActiveTab('new-order');
      },
      'o': () => {
        if (session) setActiveTab('orders');
      },
      'c': () => {
        if (session) setActiveTab('prices');
      },
      'p': () => {
        if (session) setActiveTab('profile');
      },
      'a': () => {
        if (session && (user?.role === 'admin' || user?.role === 'analyst')) {
          setActiveTab('admin');
        }
      },
    },
    { enabled: !!session }
  );

  // Load auto-logout timeout from system settings
  useEffect(() => {
    if (!user) return;

    const loadAutoLogoutSettings = async () => {
      try {
        const { data } = await supabase
          .from('system_settings')
          .select('session_timeout_minutes')
          .single();

        if (data?.session_timeout_minutes) {
          console.log('🟢 App: Załadowano timeout auto-logout:', data.session_timeout_minutes, 'minut');
          setAutoLogoutTimeout(data.session_timeout_minutes);
        }
      } catch (error) {
        console.error('Error loading auto-logout settings:', error);
      }
    };

    loadAutoLogoutSettings();

    // Subscribe to changes
    const channel = supabase
      .channel('system_settings_changes_app')
      .on('postgres_changes',
        { event: '*', schema: 'public', table: 'system_settings' },
        (payload) => {
          console.log('🟢 App: Wykryto zmianę ustawień auto-logout');
          loadAutoLogoutSettings();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user]);

  // Auto-logout with location saving
  useAutoLogout({
    timeoutMinutes: autoLogoutTimeout,
    enabled: !!(session && user && (user as any).auto_logout_enabled !== false),
    onBeforeLogout: async () => {
      console.log('[Auto-Logout] Saving location before logout...');
      if (user) {
        await saveUserLocation(user.id, {
          activeTab,
          orderMode,
          selectedOrderId,
          editingOrderId,
        });
      }
      // Close the session in tracking
      await closeCurrentSession();
    },
    onLogout: async () => {
      console.log('[Auto-Logout] Executing logout...');
      await signOut();
    },
  });

  // Restore saved location after login (only once)
  useEffect(() => {
    if (savedLocation && !selectedOrderId && !editingOrderId && !locationRestored) {
      console.log('[App] Restoring saved location (one time only):', savedLocation);

      if (savedLocation.activeTab) {
        setActiveTab(savedLocation.activeTab);
      }

      if (savedLocation.orderMode) {
        setOrderMode(savedLocation.orderMode);
      }

      if (savedLocation.selectedOrderId) {
        setSelectedOrderId(savedLocation.selectedOrderId);
      }

      if (savedLocation.editingOrderId) {
        setEditingOrderId(savedLocation.editingOrderId);
      }

      setLocationRestored(true);
    }
  }, [savedLocation, locationRestored, selectedOrderId, editingOrderId]);

  // Reset location restored flag when user changes
  useEffect(() => {
    if (!user) {
      setLocationRestored(false);
    }
  }, [user]);

  // Save location periodically while user is active
  useEffect(() => {
    if (!user) return;

    const saveInterval = setInterval(() => {
      saveUserLocation(user.id, {
        activeTab,
        orderMode,
        selectedOrderId,
        editingOrderId,
      });
    }, 30000); // Save every 30 seconds

    return () => clearInterval(saveInterval);
  }, [user, activeTab, orderMode, selectedOrderId, editingOrderId]);

  useEffect(() => {
    if (session && user && !aiPreloaded) {
      const preloadAI = async () => {
        try {
          console.log('[AI Preload] Starting background initialization...');

          if (typeof window === 'undefined') {
            console.log('[AI Preload] Not in browser environment, skipping');
            setAiPreloaded(false);
            return;
          }

          // Dynamiczny import z obsługą błędów
          const { embeddingsManager } = await import('./lib/embeddingsManager');

          console.log('[AI Preload] Initializing AI model...');
          await embeddingsManager.initialize();
          console.log('[AI Preload] Model loaded successfully');

          // Załaduj produkty
          console.log('[AI Preload] Loading products...');
          const { data: products, error: productsError } = await supabase
            .from('products')
            .select('id, name, index, base_price')
            .eq('active', true);

          if (productsError) {
            console.error('[AI Preload] Failed to load products:', productsError);
            setAiPreloaded(false);
            return;
          }

          if (products && products.length > 0) {
            console.log('[AI Preload] Generating embeddings for', products.length, 'products...');
            await embeddingsManager.generateProductEmbeddings(products);
            console.log('[AI Preload] All embeddings ready!');
          }

          setAiPreloaded(true);
          console.log('[AI Preload] ✅ Complete!');
        } catch (error) {
          console.error('[AI Preload] ❌ Failed:', error);
          // Nie blokuj aplikacji - AI jest opcjonalne
          setAiPreloaded(false);
        }
      };

      // Opóźnij inicjalizację, żeby nie blokować UI
      const timer = setTimeout(() => {
        preloadAI().catch(err => {
          console.error('[AI Preload] Unhandled error:', err);
        });
      }, 3000);

      return () => clearTimeout(timer);
    }
  }, [session, user, aiPreloaded]);

  const createTestUsers = async () => {
    const testUsers = [
      {
        email: 'admin@rodeo.pl',
        password: 'test123',
        full_name: 'Administrator Systemu',
        role: 'admin',
        store_code: null,
      },
      {
        email: 'kierownik@sklep.pl',
        password: 'test123',
        full_name: 'Jan Kowalski',
        role: 'store_manager',
        store_code: 'SHOP001',
      },
      {
        email: 'handlowiec@hurtownia.pl',
        password: 'test123',
        full_name: 'Anna Nowak',
        role: 'salesperson',
        store_code: null,
      },
      {
        email: 'operator@hurtownia.pl',
        password: 'test123',
        full_name: 'Piotr Wiśniewski',
        role: 'operator',
        store_code: null,
      },
      {
        email: 'kierowca@rodeo.pl',
        password: 'test123',
        full_name: 'Marek Nowicki',
        role: 'driver',
        store_code: null,
      },
      {
        email: 'analyse@sklep.pl',
        password: 'test123',
        full_name: 'Analityk Systemu',
        role: 'analyst',
        store_code: null,
      },
    ];

    for (const testUser of testUsers) {
      try {
        const { data: authData, error: authError } = await supabase.auth.signUp({
          email: testUser.email,
          password: testUser.password,
          options: {
            emailRedirectTo: undefined,
            data: {
              full_name: testUser.full_name,
            },
          },
        });

        if (authError) {
          if (authError.message.includes('already registered')) {
            console.log(`User ${testUser.email} already exists`);
            continue;
          }
          throw authError;
        }

        if (authData.user) {
          let storeId = null;

          if (testUser.store_code) {
            const { data: storeData } = await supabase
              .from('stores')
              .select('id')
              .eq('code', testUser.store_code)
              .single();

            if (storeData) {
              storeId = storeData.id;
            }
          }

          const { error: userError } = await supabase
            .from('users')
            .insert({
              id: authData.user.id,
              email: testUser.email,
              full_name: testUser.full_name,
              role: testUser.role,
              store_id: storeId,
              active: true,
            });

          if (userError && !userError.message.includes('duplicate')) {
            console.error(`Error creating user profile for ${testUser.email}:`, userError);
          }

          if (testUser.role === 'salesperson') {
            const { data: stores } = await supabase
              .from('stores')
              .select('id')
              .in('code', ['SHOP001', 'SHOP002']);

            if (stores) {
              for (const store of stores) {
                await supabase
                  .from('salesperson_stores')
                  .insert({
                    salesperson_id: authData.user.id,
                    store_id: store.id,
                  });
              }
            }
          }
        }
      } catch (error) {
        console.error(`Error creating user ${testUser.email}:`, error);
      }
    }
  };

  useEffect(() => {
    const handleHashChange = () => {
      setShowStylesDemo(window.location.hash === '#styles-demo');
    };

    window.addEventListener('hashchange', handleHashChange);
    return () => window.removeEventListener('hashchange', handleHashChange);
  }, []);

  if (showStylesDemo) {
    return <StylesDemo />;
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-amber-600"></div>
      </div>
    );
  }

  if (!session || !user) {
    return <LoginScreen onLogin={signIn} onCreateTestUsers={createTestUsers} />;
  }

  if (editingOrderId) {
    return (
      <EditDraftOrderScreen
        orderId={editingOrderId}
        userId={user.id}
        onSave={() => {
          setEditingOrderId(null);
          setSelectedOrderId(editingOrderId);
          setOrderRefreshKey(prev => prev + 1);
        }}
        onCancel={() => {
          setEditingOrderId(null);
          setSelectedOrderId(editingOrderId);
        }}
      />
    );
  }

  if (selectedOrderId) {
    return (
      <OrderDetails
        key={`order-${selectedOrderId}-${orderRefreshKey}`}
        orderId={selectedOrderId}
        userRole={user.role}
        userId={user.id}
        onBack={() => setSelectedOrderId(null)}
        onEdit={() => {
          setEditingOrderId(selectedOrderId);
          setSelectedOrderId(null);
          setOrderRefreshKey(prev => prev + 1);
        }}
        onOrderSent={() => {
          setSelectedOrderId(null);
          setOrdersListFilter('sent');
          setActiveTab('orders');
          setOrderRefreshKey(prev => prev + 1);
        }}
        onUseAsTemplate={(orderId) => {
          setTemplateOrderId(orderId);
          setOrderMode('copy');
          setSelectedOrderId(null);
          setActiveTab('new-order');
        }}
        onAddProducts={() => {
          setAddingToNotebookOrderId(selectedOrderId);
          setSelectedOrderId(null);
          setActiveTab('prices');
        }}
      />
    );
  }

  if (user.role === 'analyst') {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="bg-white shadow-sm border-b border-gray-200">
          <div className="max-w-7xl mx-auto px-6 py-4">
            <div className="flex items-center justify-between">
              <h1 className="text-2xl font-bold text-gray-900">System Analityczny RODEO</h1>
              <div className="flex gap-2 bg-gray-100 rounded-lg p-1">
                <button
                  onClick={() => setAnalystView('behavior')}
                  className={`px-4 py-2 rounded-lg font-medium transition ${
                    analystView === 'behavior'
                      ? 'bg-white text-blue-600 shadow-sm'
                      : 'text-gray-600 hover:text-gray-900'
                  }`}
                >
                  Analiza Użytkowników
                </button>
                <button
                  onClick={() => setAnalystView('sales')}
                  className={`px-4 py-2 rounded-lg font-medium transition ${
                    analystView === 'sales'
                      ? 'bg-white text-blue-600 shadow-sm'
                      : 'text-gray-600 hover:text-gray-900'
                  }`}
                >
                  Analiza Sprzedaży
                </button>
              </div>
            </div>
          </div>
        </div>
        {analystView === 'behavior' ? <AnalyticsPanel /> : <SalesAnalyticsPanel />}
      </div>
    );
  }

  if (user.role === 'driver') {
    const getHeaderForTab = () => {
      if (activeTab === 'profile') return { title: 'Profil', subtitle: '' };
      return { title: 'RODEO', subtitle: 'Kierowca' };
    };
    const header = getHeaderForTab();

    return (
      <div className="fixed inset-0 flex flex-col bg-gray-50">
        <Header
          title={header.title}
          subtitle={header.subtitle}
          onProfileClick={() => handleTabChange('profile')}
          showProfile={activeTab !== 'profile'}
          showBack={activeTab === 'profile'}
          onBackClick={() => setActiveTab(previousTab)}
          onLogoutClick={signOut}
        />
        <div className="flex-1 overflow-y-auto pt-20 pb-16">
          {activeTab === 'home' && <DriverScreen userId={user.id} />}
          {activeTab === 'profile' && <ProfileScreen user={user} onSignOut={signOut} />}
        </div>
        <BottomNav activeTab={activeTab} onTabChange={(tab) => {
          handleTabChange(tab);
          if (tab === 'orders') {
            setOrdersListFilter(null);
          }
        }} userRole={user.role} />
      </div>
    );
  }

  if (user.role === 'admin' || user.role === 'operator') {
    const getHeaderForTab = () => {
      if (activeTab === 'profile') return { title: 'Profil', subtitle: '' };
      return { title: 'Panel Administracyjny', subtitle: user.role === 'admin' ? 'Administrator' : 'Operator' };
    };
    const header = getHeaderForTab();

    return (
      <div className="fixed inset-0 flex flex-col bg-gray-50">
        <Header
          title={header.title}
          subtitle={header.subtitle}
          onProfileClick={() => handleTabChange('profile')}
          showProfile={activeTab !== 'profile'}
          showBack={activeTab === 'profile'}
          onBackClick={() => setActiveTab(previousTab)}
          onLogoutClick={signOut}
        />
        <div className="flex-1 overflow-y-auto pt-20 pb-16">
          {activeTab === 'home' && (
            <AdminPanel
              userId={user.id}
              userRole={user.role}
              onSelectOrder={setSelectedOrderId}
            />
          )}
          {activeTab === 'profile' && <ProfileScreen user={user} onSignOut={signOut} />}
        </div>
        <BottomNav activeTab={activeTab} onTabChange={(tab) => {
          handleTabChange(tab);
          if (tab === 'orders') {
            setOrdersListFilter(null);
          }
        }} userRole={user.role} />
      </div>
    );
  }

  if (user.role === 'salesperson') {
    const getHeaderForTab = () => {
      switch (activeTab) {
        case 'home':
          return { title: 'RODEO', subtitle: 'Weź byka za rogi' };
        case 'orders':
          return { title: 'Zamówienia', subtitle: 'Wszystkie zamówienia sklepów' };
        case 'prices':
          return { title: 'Cennik', subtitle: 'Aktualny cennik produktów' };
        case 'profile':
          return { title: 'Profil', subtitle: '' };
        default:
          return { title: 'RODEO', subtitle: '' };
      }
    };

    const header = getHeaderForTab();

    return (
      <div className="fixed inset-0 flex flex-col bg-gray-50">
        <Header
          title={header.title}
          subtitle={header.subtitle}
          onProfileClick={() => handleTabChange('profile')}
          showProfile={activeTab !== 'profile'}
          showBack={activeTab === 'profile'}
          onBackClick={() => setActiveTab(previousTab)}
          onLogoutClick={signOut}
        />
        <div className="flex-1 overflow-y-auto pt-20 pb-16">
          {activeTab === 'home' && (() => {
            const HomeScreenComponent = getHomeScreenComponent();
            return (
              <HomeScreenComponent
                onNavigate={handleTabChange}
                onVoiceOrder={() => {
                  handleTabChange('new-order');
                  setOrderMode('voice');
                }}
                userRole={user.role}
              />
            );
          })()}
          {activeTab === 'orders' && (
            <div className="p-6">
              <OrdersList
                key={`orders-list-${orderRefreshKey}`}
                userRole={user.role}
                onSelectOrder={setSelectedOrderId}
                initialFilter={ordersListFilter || undefined}
              />
            </div>
          )}
          {activeTab === 'prices' && (
            <div className="p-3">
              <PriceList
                notebookOrderId={addingToNotebookOrderId}
                onBackToOrder={addingToNotebookOrderId ? () => {
                  setSelectedOrderId(addingToNotebookOrderId);
                  setAddingToNotebookOrderId(null);
                  handleTabChange('orders');
                } : undefined}
              />
            </div>
          )}
          {activeTab === 'profile' && <ProfileScreen user={user} onSignOut={signOut} />}
        </div>
        <BottomNav activeTab={activeTab} onTabChange={(tab) => {
          handleTabChange(tab);
          if (tab !== 'prices') {
            setAddingToNotebookOrderId(null);
          }
          if (tab === 'orders') {
            setOrdersListFilter(null);
          }
        }} userRole={user.role} />
      </div>
    );
  }

  const getHeaderForTab = () => {
    switch (activeTab) {
      case 'home':
        return { title: 'RODEO', subtitle: 'Weź byka za rogi' };
      case 'new-order':
        return { title: 'Nowe zamówienie', subtitle: orderMode ? '' : 'Wybierz sposób utworzenia zamówienia' };
      case 'orders':
        return { title: 'Moje zamówienia', subtitle: '' };
      case 'prices':
        return { title: 'Cennik', subtitle: 'Aktualny cennik produktów' };
      case 'admin':
        return { title: 'Panel Administracyjny', subtitle: '' };
      case 'profile':
        return { title: 'Profil', subtitle: '' };
      default:
        return { title: 'RODEO', subtitle: '' };
    }
  };

  const header = getHeaderForTab();

  return (
    <div className="fixed inset-0 flex flex-col bg-gray-50">
      {/* Background service: automatically closes inactive sessions every 5 minutes */}
      <SessionCleanupService />

      {/* User notifications for system announcements */}
      <UserNotifications />

      {/* Real-time order status notifications */}
      <RealtimeOrderNotifications />

      {/* Offline indicator and sync status */}
      <OfflineIndicator />

      <Header
        title={header.title}
        subtitle={header.subtitle}
        onProfileClick={() => handleTabChange('profile')}
        showProfile={activeTab !== 'profile'}
        showBack={activeTab === 'profile'}
        onBackClick={() => setActiveTab(previousTab)}
        onLogoutClick={signOut}
        userName={user.full_name}
        userEmail={user.email}
        userProfilePicture={(user as any).profile_picture_url}
      />
      <div className="flex-1 overflow-y-auto pt-[70px] sm:pt-20 pb-14 sm:pb-20">
        <Suspense fallback={<div className="p-6"><SkeletonList items={5} /></div>}>
        {activeTab === 'home' && (() => {
          const HomeScreenComponent = getHomeScreenComponent();
          return (
            <HomeScreenComponent
              onNavigate={handleTabChange}
              onVoiceOrder={() => {
                handleTabChange('new-order');
                setOrderMode('voice');
              }}
              userRole={user.role}
            />
          );
        })()}

        {activeTab === 'admin' && user.role === 'admin' && (
          <AdminPanel
            userId={user.id}
            userRole={user.role}
            onSelectOrder={setSelectedOrderId}
          />
        )}

        {activeTab === 'new-order' && user.store_id && (
          <>
            {orderMode === null && (
              <>
                <div className="flex justify-end p-4 pb-0">
                  <button
                    onClick={async () => {
                      const newLayout = (user as any).order_mode_layout === 'grid' ? 'list' : 'grid';
                      await supabase
                        .from('users')
                        .update({ order_mode_layout: newLayout })
                        .eq('id', user.id);
                      window.location.reload();
                    }}
                    className="flex items-center gap-2 px-3 py-2 bg-white rounded-lg shadow hover:shadow-md transition text-sm"
                  >
                    {(user as any).order_mode_layout === 'grid' ? (
                      <>
                        <List className="w-4 h-4" />
                        <span>Lista</span>
                      </>
                    ) : (
                      <>
                        <Grid3x3 className="w-4 h-4" />
                        <span>Siatka</span>
                      </>
                    )}
                  </button>
                </div>
                <div className={`p-6 pt-3 ${(user as any).order_mode_layout === 'grid' ? 'grid grid-cols-2 gap-3' : 'space-y-3'}`}>
                {((user as any).enable_voice_orders ?? true) && (
                  <button
                    onClick={() => setOrderMode('voice')}
                    className={`w-full bg-white rounded-lg shadow hover:shadow-lg transition text-left ${
                      (user as any).order_mode_layout === 'grid' ? 'p-4' : 'p-3'
                    }`}
                  >
                    <div className={`flex gap-3 ${
                      (user as any).order_mode_layout === 'grid' ? 'flex-col items-center text-center' : 'items-center'
                    }`}>
                      <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center flex-shrink-0">
                        <span className="text-xl">🎤</span>
                      </div>
                      <div>
                        <h3 className="font-semibold text-base text-gray-800">Zamówienie głosowe</h3>
                        <p className="text-xs text-gray-600">Dyktuj zamówienie przez mikrofon</p>
                      </div>
                    </div>
                  </button>
                )}

                {((user as any).enable_pricelist_orders ?? true) && (
                  <button
                    onClick={() => {
                      setOrderMode(null);
                      setActiveTab('prices');
                    }}
                    className={`w-full bg-white rounded-lg shadow hover:shadow-lg transition text-left ${
                      (user as any).order_mode_layout === 'grid' ? 'p-4' : 'p-3'
                    }`}
                  >
                    <div className={`flex gap-3 ${
                      (user as any).order_mode_layout === 'grid' ? 'flex-col items-center text-center' : 'items-center'
                    }`}>
                      <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center flex-shrink-0">
                        <span className="text-xl">📋</span>
                      </div>
                      <div>
                        <h3 className="font-semibold text-base text-gray-800">Z cennika</h3>
                        <p className="text-xs text-gray-600">Przejdź do cennika</p>
                      </div>
                    </div>
                  </button>
                )}

                {((user as any).enable_copy_orders ?? true) && (
                  <button
                    onClick={() => setOrderMode('copy')}
                    className={`w-full bg-white rounded-lg shadow hover:shadow-lg transition text-left ${
                      (user as any).order_mode_layout === 'grid' ? 'p-4' : 'p-3'
                    }`}
                  >
                    <div className={`flex gap-3 ${
                      (user as any).order_mode_layout === 'grid' ? 'flex-col items-center text-center' : 'items-center'
                    }`}>
                      <div className="w-10 h-10 bg-amber-100 rounded-lg flex items-center justify-center flex-shrink-0">
                        <span className="text-xl">🔄</span>
                      </div>
                      <div>
                        <h3 className="font-semibold text-base text-gray-800">Kopiuj zamówienie</h3>
                        <p className="text-xs text-gray-600">Wykorzystaj wcześniejsze zamówienie</p>
                      </div>
                    </div>
                  </button>
                )}

                {((user as any).enable_manual_orders ?? true) && (
                  <button
                    onClick={() => setOrderMode('manual')}
                    className={`w-full bg-white rounded-lg shadow hover:shadow-lg transition text-left ${
                      (user as any).order_mode_layout === 'grid' ? 'p-4' : 'p-3'
                    }`}
                  >
                    <div className={`flex gap-3 ${
                      (user as any).order_mode_layout === 'grid' ? 'flex-col items-center text-center' : 'items-center'
                    }`}>
                      <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center flex-shrink-0">
                        <span className="text-xl">✏️</span>
                      </div>
                      <div>
                        <h3 className="font-semibold text-base text-gray-800">Wprowadź ręcznie</h3>
                        <p className="text-xs text-gray-600">Dodaj produkty z listy</p>
                      </div>
                    </div>
                  </button>
                )}

                <button
                  onClick={() => setOrderMode('auto')}
                  className={`w-full bg-gradient-to-r from-amber-500 to-orange-600 text-white rounded-lg shadow-lg hover:shadow-xl transition text-left ${
                    (user as any).order_mode_layout === 'grid' ? 'p-4' : 'p-3'
                  }`}
                >
                  <div className={`flex gap-3 ${
                    (user as any).order_mode_layout === 'grid' ? 'flex-col items-center text-center' : 'items-center'
                  }`}>
                    <div className="w-10 h-10 bg-white/20 rounded-lg flex items-center justify-center flex-shrink-0">
                      <span className="text-xl">✨</span>
                    </div>
                    <div>
                      <h3 className="font-semibold text-base">Auto zamówienie</h3>
                      <p className="text-xs opacity-90">Wygenerowane na podstawie historii</p>
                    </div>
                  </div>
                </button>
              </div>
              </>
            )}

            {orderMode === 'voice' && (
              <VoiceOrderScreen
                storeId={user.store_id}
                userId={user.id}
                onDraftCreated={(orderId) => {
                  setOrderMode(null);
                  setEditingOrderId(orderId);
                }}
              />
            )}

            {orderMode === 'manual' && (
              <ManualOrderScreen
                storeId={user.store_id}
                userId={user.id}
                onOrderSent={() => {
                  setOrderMode(null);
                  setOrderRefreshKey(prev => prev + 1);
                  setOrdersListFilter('draft');
                  setActiveTab('orders');
                }}
                onCancel={() => setOrderMode(null)}
              />
            )}

            {orderMode === 'pricelist' && (
              (user as any).order_mode === 'list' ? (
                <PriceListOrderListMode
                  storeId={user.store_id}
                  userId={user.id}
                  onOrderSaved={() => {
                    setOrderMode(null);
                    setOrderRefreshKey(prev => prev + 1);
                    setOrdersListFilter('draft');
                    setActiveTab('orders');
                  }}
                  onCancel={() => {
                    setOrderMode(null);
                    setActiveTab('prices');
                  }}
                />
              ) : (
                <PriceListOrderScreen
                  storeId={user.store_id}
                  userId={user.id}
                  onOrderSent={() => {
                    setOrderMode(null);
                    setOrderRefreshKey(prev => prev + 1);
                    setOrdersListFilter('draft');
                    setActiveTab('orders');
                  }}
                  onCancel={() => {
                    setOrderMode(null);
                    setActiveTab('prices');
                  }}
                />
              )
            )}

            {orderMode === 'copy' && (
              <CopyOrderScreen
                storeId={user.store_id}
                userId={user.id}
                onOrderSent={() => {
                  setOrderMode(null);
                  setTemplateOrderId(null);
                  setOrderRefreshKey(prev => prev + 1);
                  setOrdersListFilter('draft');
                  setActiveTab('orders');
                }}
                onCancel={() => {
                  setOrderMode(null);
                  setTemplateOrderId(null);
                }}
                preselectedOrderId={templateOrderId || undefined}
              />
            )}

            {orderMode === 'auto' && (
              <AutoOrderScreen
                storeId={user.store_id}
                userId={user.id}
                onOrderSent={() => {
                  setOrderMode(null);
                  setOrderRefreshKey(prev => prev + 1);
                  setOrdersListFilter('draft');
                  setActiveTab('orders');
                }}
                onCancel={() => setOrderMode(null)}
              />
            )}
          </>
        )}

        {activeTab === 'orders' && (
          <div className="p-6">
            <OrdersList
              key={`orders-list-${orderRefreshKey}`}
              storeId={user.store_id}
              userRole={user.role}
              onSelectOrder={setSelectedOrderId}
              showLimitedFilters={!user.show_all_order_filters}
              initialFilter={ordersListFilter || undefined}
            />
          </div>
        )}

        {activeTab === 'prices' && (
          <div className="p-3">
            <PriceList
              notebookOrderId={addingToNotebookOrderId}
              onBackToOrder={addingToNotebookOrderId ? () => {
                setSelectedOrderId(addingToNotebookOrderId);
                setAddingToNotebookOrderId(null);
                handleTabChange('orders');
              } : undefined}
            />
          </div>
        )}

        {activeTab === 'profile' && <ProfileScreen user={user} onSignOut={signOut} />}
        </Suspense>
      </div>

      <BottomNav activeTab={activeTab} onTabChange={(tab) => {
        handleTabChange(tab);
        if (tab !== 'prices') {
          setAddingToNotebookOrderId(null);
        }
        if (tab === 'orders') {
          setOrdersListFilter(null);
        }
      }} userRole={user.role} />
    </div>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <ThemeProvider>
        <FontSizeProvider>
          <AppContent />
        </FontSizeProvider>
      </ThemeProvider>
    </AuthProvider>
  );
}
