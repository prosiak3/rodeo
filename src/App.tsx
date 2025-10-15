import { useState, useEffect } from 'react';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { ThemeProvider } from './contexts/ThemeContext';
import LoginScreen from './components/LoginScreen';
import HomeScreen from './components/HomeScreen';
import VoiceOrderScreen from './components/VoiceOrderScreen';
import ManualOrderScreen from './components/ManualOrderScreen';
import CopyOrderScreen from './components/CopyOrderScreen';
import PriceListOrderScreen from './components/PriceListOrderScreen';
import PriceListOrderListMode from './components/PriceListOrderListMode';
import AutoOrderScreen from './components/AutoOrderScreen';
import OrdersList from './components/OrdersList';
import OrderDetails from './components/OrderDetails';
import EditDraftOrderScreen from './components/EditDraftOrderScreen';
import ProfileScreen from './components/ProfileScreen';
import AdminPanel from './components/AdminPanel';
import PriceList from './components/PriceList';
import DriverScreen from './components/DriverScreen';
import BottomNav from './components/BottomNav';
import Header from './components/Header';
import { supabase, OrderStatus } from './lib/supabase';
import { Grid3x3, List } from 'lucide-react';

function AppContent() {
  const { session, user, loading, signIn, signOut } = useAuth();
  const [activeTab, setActiveTab] = useState<'home' | 'new-order' | 'orders' | 'prices' | 'profile' | 'admin'>('home');
  const [selectedOrderId, setSelectedOrderId] = useState<string | null>(null);
  const [editingOrderId, setEditingOrderId] = useState<string | null>(null);
  const [orderRefreshKey, setOrderRefreshKey] = useState(0);
  const [orderMode, setOrderMode] = useState<'voice' | 'manual' | 'copy' | 'pricelist' | 'auto' | null>(null);
  const [templateOrderId, setTemplateOrderId] = useState<string | null>(null);
  const [addingToNotebookOrderId, setAddingToNotebookOrderId] = useState<string | null>(null);
  const [ordersListFilter, setOrdersListFilter] = useState<OrderStatus | 'all' | null>(null);
  const [aiPreloaded, setAiPreloaded] = useState(false);

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
          onProfileClick={() => setActiveTab('profile')}
          showProfile={activeTab !== 'profile'}
        />
        <div className="flex-1 overflow-y-auto pt-20 pb-16">
          {activeTab === 'home' && <DriverScreen userId={user.id} />}
          {activeTab === 'profile' && <ProfileScreen user={user} onSignOut={signOut} />}
        </div>
        <BottomNav activeTab={activeTab} onTabChange={(tab) => {
          setActiveTab(tab);
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
          onProfileClick={() => setActiveTab('profile')}
          showProfile={activeTab !== 'profile'}
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
          setActiveTab(tab);
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
          onProfileClick={() => setActiveTab('profile')}
          showProfile={activeTab !== 'profile'}
        />
        <div className="flex-1 overflow-y-auto pt-20 pb-16">
          {activeTab === 'home' && (
            <HomeScreen
              onNavigate={setActiveTab}
              onVoiceOrder={() => {
                setActiveTab('new-order');
                setOrderMode('voice');
              }}
              userRole={user.role}
            />
          )}
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
                  setActiveTab('orders');
                } : undefined}
              />
            </div>
          )}
          {activeTab === 'profile' && <ProfileScreen user={user} onSignOut={signOut} />}
        </div>
        <BottomNav activeTab={activeTab} onTabChange={(tab) => {
          setActiveTab(tab);
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
      <Header
        title={header.title}
        subtitle={header.subtitle}
        onProfileClick={() => setActiveTab('profile')}
        showProfile={activeTab !== 'profile'}
      />
      <div className="flex-1 overflow-y-auto pt-20 pb-16">
        {activeTab === 'home' && (
          <HomeScreen
            onNavigate={setActiveTab}
            onVoiceOrder={() => {
              setActiveTab('new-order');
              setOrderMode('voice');
            }}
            userRole={user.role}
          />
        )}

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
                setActiveTab('orders');
              } : undefined}
            />
          </div>
        )}

        {activeTab === 'profile' && <ProfileScreen user={user} onSignOut={signOut} />}
      </div>

      <BottomNav activeTab={activeTab} onTabChange={(tab) => {
        setActiveTab(tab);
        if (tab !== 'prices') {
          setAddingToNotebookOrderId(null);
        }
        if (tab === 'orders') {
          setOrdersListFilter(null);
        }
      }} />
    </div>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <ThemeProvider>
        <AppContent />
      </ThemeProvider>
    </AuthProvider>
  );
}
