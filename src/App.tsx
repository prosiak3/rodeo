import { useState } from 'react';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import LoginScreen from './components/LoginScreen';
import HomeScreen from './components/HomeScreen';
import VoiceOrderScreen from './components/VoiceOrderScreen';
import ManualOrderScreen from './components/ManualOrderScreen';
import CopyOrderScreen from './components/CopyOrderScreen';
import PriceListOrderScreen from './components/PriceListOrderScreen';
import PriceListOrderListMode from './components/PriceListOrderListMode';
import OrdersList from './components/OrdersList';
import OrderDetails from './components/OrderDetails';
import EditDraftOrderScreen from './components/EditDraftOrderScreen';
import ProfileScreen from './components/ProfileScreen';
import AdminPanel from './components/AdminPanel';
import PriceList from './components/PriceList';
import DriverScreen from './components/DriverScreen';
import BottomNav from './components/BottomNav';
import { supabase } from './lib/supabase';

function AppContent() {
  const { session, user, loading, signIn, signOut } = useAuth();
  const [activeTab, setActiveTab] = useState<'home' | 'new-order' | 'orders' | 'prices' | 'profile'>('home');
  const [selectedOrderId, setSelectedOrderId] = useState<string | null>(null);
  const [editingOrderId, setEditingOrderId] = useState<string | null>(null);
  const [orderRefreshKey, setOrderRefreshKey] = useState(0);
  const [orderMode, setOrderMode] = useState<'voice' | 'manual' | 'copy' | 'pricelist' | null>(null);
  const [templateOrderId, setTemplateOrderId] = useState<string | null>(null);

  const createTestUsers = async () => {
    const testUsers = [
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
        email: 'kierowca@hurtownia.pl',
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
        }}
        onOrderSent={() => {
          setSelectedOrderId(null);
          setActiveTab('orders');
        }}
        onUseAsTemplate={(orderId) => {
          setTemplateOrderId(orderId);
          setOrderMode('copy');
          setSelectedOrderId(null);
          setActiveTab('new-order');
        }}
      />
    );
  }

  if (user.role === 'driver') {
    return (
      <>
        <div className="pb-16">
          {activeTab === 'home' && (
            <DriverScreen userId={user.id} />
          )}

          {activeTab === 'profile' && (
            <ProfileScreen user={user} onSignOut={signOut} />
          )}
        </div>
        <BottomNav activeTab={activeTab} onTabChange={setActiveTab} userRole={user.role} />
      </>
    );
  }

  if (user.role === 'admin' || user.role === 'operator') {
    return (
      <>
        <div className="pb-16">
          {activeTab === 'home' && (
            <AdminPanel
              userId={user.id}
              userRole={user.role}
              onSelectOrder={setSelectedOrderId}
            />
          )}

          {activeTab === 'profile' && (
            <ProfileScreen user={user} onSignOut={signOut} />
          )}
        </div>
        <BottomNav activeTab={activeTab} onTabChange={setActiveTab} userRole={user.role} />
      </>
    );
  }

  if (user.role === 'salesperson') {
    return (
      <>
        <div className="pb-16">
          {activeTab === 'home' && <HomeScreen onNavigate={setActiveTab} />}

          {activeTab === 'orders' && (
            <div className="min-h-screen bg-gray-50 pb-20">
              <div className="bg-gradient-to-r from-amber-500 to-orange-600 text-white p-6">
                <div className="flex items-center gap-3">
                  <span className="text-4xl">🐃</span>
                  <h2 className="text-2xl font-bold">Zamówienia</h2>
                </div>
                <p className="text-amber-100 text-sm mt-1">Wszystkie zamówienia sklepów</p>
              </div>
              <div className="p-6">
                <OrdersList
                  userRole={user.role}
                  onSelectOrder={setSelectedOrderId}
                />
              </div>
            </div>
          )}

          {activeTab === 'prices' && (
            <div className="min-h-screen bg-gray-50 pb-20">
              <div className="bg-gradient-to-r from-amber-500 to-orange-600 text-white p-6">
                <div className="flex items-center gap-3 mb-2">
                  <span className="text-4xl">🐃</span>
                  <h2 className="text-2xl font-bold">Cennik</h2>
                </div>
                <p className="text-white font-semibold">Weź byka za rogi</p>
                <p className="text-amber-100 mt-1 text-sm">Aktualny cennik produktów</p>
              </div>
              <div className="p-3">
                <PriceList />
              </div>
            </div>
          )}

          {activeTab === 'profile' && (
            <ProfileScreen user={user} onSignOut={signOut} />
          )}
        </div>
        <BottomNav activeTab={activeTab} onTabChange={setActiveTab} userRole={user.role} />
      </>
    );
  }

  return (
    <>
      <div className="pb-16">
        {activeTab === 'home' && <HomeScreen onNavigate={setActiveTab} />}

        {activeTab === 'new-order' && user.store_id && (
          <>
            {orderMode === null && (
              <div className="min-h-screen bg-gray-50 pb-20">
                <div className="bg-gradient-to-r from-amber-500 to-orange-600 text-white p-6">
                  <h2 className="text-2xl font-bold">Nowe zamówienie</h2>
                  <p className="text-amber-100 text-sm mt-1">Wybierz sposób utworzenia zamówienia</p>
                </div>

                <div className="p-6 space-y-4">
                  <button
                    onClick={() => setOrderMode('voice')}
                    className="w-full p-6 bg-white rounded-xl shadow-lg hover:shadow-xl transition text-left"
                  >
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center">
                        <span className="text-2xl">🎤</span>
                      </div>
                      <div>
                        <h3 className="font-bold text-lg text-gray-800">Zamówienie głosowe</h3>
                        <p className="text-sm text-gray-600">Dyktuj zamówienie przez mikrofon</p>
                      </div>
                    </div>
                  </button>

                  <button
                    onClick={() => setOrderMode('manual')}
                    className="w-full p-6 bg-white rounded-xl shadow-lg hover:shadow-xl transition text-left"
                  >
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 bg-green-100 rounded-xl flex items-center justify-center">
                        <span className="text-2xl">✏️</span>
                      </div>
                      <div>
                        <h3 className="font-bold text-lg text-gray-800">Wprowadź ręcznie</h3>
                        <p className="text-sm text-gray-600">Dodaj produkty z listy</p>
                      </div>
                    </div>
                  </button>

                  <button
                    onClick={() => setOrderMode('pricelist')}
                    className="w-full p-6 bg-white rounded-xl shadow-lg hover:shadow-xl transition text-left"
                  >
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 bg-purple-100 rounded-xl flex items-center justify-center">
                        <span className="text-2xl">📋</span>
                      </div>
                      <div>
                        <h3 className="font-bold text-lg text-gray-800">Z cennika</h3>
                        <p className="text-sm text-gray-600">Wybierz produkty z listy cenowej</p>
                      </div>
                    </div>
                  </button>

                  <button
                    onClick={() => setOrderMode('copy')}
                    className="w-full p-6 bg-white rounded-xl shadow-lg hover:shadow-xl transition text-left"
                  >
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 bg-amber-100 rounded-xl flex items-center justify-center">
                        <span className="text-2xl">🔄</span>
                      </div>
                      <div>
                        <h3 className="font-bold text-lg text-gray-800">Kopiuj zamówienie</h3>
                        <p className="text-sm text-gray-600">Wykorzystaj wcześniejsze zamówienie</p>
                      </div>
                    </div>
                  </button>
                </div>
              </div>
            )}

            {orderMode === 'voice' && (
              <VoiceOrderScreen
                storeId={user.store_id}
                userId={user.id}
                onOrderSent={() => {
                  setOrderMode(null);
                  setActiveTab('orders');
                }}
              />
            )}

            {orderMode === 'manual' && (
              <ManualOrderScreen
                storeId={user.store_id}
                userId={user.id}
                onOrderSent={() => {
                  setOrderMode(null);
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
                    setActiveTab('orders');
                  }}
                  onCancel={() => setOrderMode(null)}
                />
              ) : (
                <PriceListOrderScreen
                  storeId={user.store_id}
                  userId={user.id}
                  onOrderSent={() => {
                    setOrderMode(null);
                    setActiveTab('orders');
                  }}
                  onCancel={() => setOrderMode(null)}
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
                  setActiveTab('orders');
                }}
                onCancel={() => {
                  setOrderMode(null);
                  setTemplateOrderId(null);
                }}
                preselectedOrderId={templateOrderId || undefined}
              />
            )}
          </>
        )}

        {activeTab === 'orders' && (
          <div className="min-h-screen bg-gray-50 pb-20">
            <div className="bg-gradient-to-r from-amber-500 to-orange-600 text-white p-6">
              <div className="flex items-center gap-3">
                <span className="text-4xl">🐃</span>
                <h2 className="text-2xl font-bold">Moje zamówienia</h2>
              </div>
            </div>
            <div className="p-6">
              <OrdersList
                storeId={user.store_id}
                userRole={user.role}
                onSelectOrder={setSelectedOrderId}
                showLimitedFilters={!user.show_all_order_filters}
              />
            </div>
          </div>
        )}

        {activeTab === 'prices' && (
          <div className="min-h-screen bg-gray-50 pb-20">
            <div className="bg-gradient-to-r from-amber-500 to-orange-600 text-white p-6">
              <div className="flex items-center gap-3 mb-2">
                <span className="text-4xl">🐃</span>
                <h2 className="text-2xl font-bold">Cennik</h2>
              </div>
              <p className="text-white font-semibold">Weź byka za rogi</p>
              <p className="text-amber-100 mt-1 text-sm">Aktualny cennik produktów</p>
            </div>
            <div className="p-3">
              <PriceList />
            </div>
          </div>
        )}

        {activeTab === 'profile' && (
          <ProfileScreen user={user} onSignOut={signOut} />
        )}
      </div>

      <BottomNav activeTab={activeTab} onTabChange={setActiveTab} />
    </>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
}
