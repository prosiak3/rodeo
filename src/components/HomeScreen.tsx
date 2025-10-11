interface HomeScreenProps {
  onNavigate?: (tab: 'new-order' | 'orders' | 'admin') => void;
  userRole?: string;
}

export default function HomeScreen({ onNavigate, userRole }: HomeScreenProps) {

  return (
    <div className="min-h-screen bg-gray-50 pb-20">
      <div className="bg-gradient-to-r from-amber-500 to-orange-600 text-white p-4">
        <div className="flex items-center gap-3 mb-2">
          <span className="text-4xl">🐃</span>
          <h2 className="text-xl font-bold">RODEO</h2>
        </div>
        <p className="text-white font-semibold">Weź byka za rogi</p>
        <p className="text-amber-100 mt-1 text-sm">System zamówień mięsno-wędliniarskich</p>
      </div>

      <div className="p-6 space-y-6">
        <div className="bg-white rounded-xl shadow-lg p-6">
          <h3 className="font-semibold text-lg mb-4">Szybkie akcje</h3>
          <div className="space-y-3">
            <button
              onClick={() => onNavigate?.('new-order')}
              className="w-full p-4 bg-gradient-to-r from-amber-500 to-orange-600 text-white rounded-lg font-medium hover:from-amber-600 hover:to-orange-700 transition shadow cursor-pointer"
            >
              Nowe zamówienie
            </button>
            <button
              onClick={() => onNavigate?.('orders')}
              className="w-full p-4 bg-white border-2 border-gray-200 text-gray-700 rounded-lg font-medium hover:bg-gray-50 transition cursor-pointer"
            >
              Pokaż aktualne zamówienia
            </button>
            {userRole === 'admin' && (
              <button
                onClick={() => onNavigate?.('admin')}
                className="w-full p-4 bg-gradient-to-r from-blue-500 to-blue-600 text-white rounded-lg font-medium hover:from-blue-600 hover:to-blue-700 transition shadow cursor-pointer"
              >
                Panel administracyjny
              </button>
            )}
          </div>
        </div>

        <div className="bg-blue-50 border border-blue-200 rounded-xl p-6">
          <h3 className="font-semibold text-blue-900 mb-2">Jak korzystać z aplikacji?</h3>
          <ul className="space-y-2 text-sm text-blue-800">
            <li>1. Kliknij &quot;Nowe&quot; w menu dolnym</li>
            <li>2. Naciśnij przycisk mikrofonu</li>
            <li>3. Dyktuj zamówienie głosowo</li>
            <li>4. Sprawdź i wyślij zamówienie</li>
          </ul>
        </div>
      </div>
    </div>
  );
}
