import { useState } from 'react';
import { UpdateNotification } from './components/UpdateNotification';
import { useAppUpdate } from './hooks/useAppUpdate';

export default function App() {
  const { updateAvailable, applyUpdate, dismissUpdate } = useAppUpdate();
  const [count, setCount] = useState(0);

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center p-4">
      {updateAvailable && (
        <UpdateNotification
          onUpdate={applyUpdate}
          onDismiss={dismissUpdate}
        />
      )}

      <div className="max-w-2xl w-full bg-white rounded-lg shadow-lg p-8">
        <div className="flex items-center gap-4 mb-8">
          <img src="/rodeo.png" alt="RODEO" className="w-16 h-16" />
          <div>
            <h1 className="text-3xl font-bold text-gray-800">RODEO</h1>
            <p className="text-gray-600">System Zamówień</p>
          </div>
        </div>

        <div className="space-y-4">
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <h2 className="text-lg font-semibold text-blue-900 mb-2">
              Aplikacja z auto-aktualizacją
            </h2>
            <p className="text-blue-700 text-sm">
              Gdy dostępna będzie nowa wersja, zobaczysz powiadomienie u góry ekranu.
            </p>
          </div>

          <div className="bg-white border border-gray-200 rounded-lg p-6">
            <h3 className="text-lg font-semibold mb-4">Test licznika</h3>
            <div className="flex items-center gap-4">
              <button
                onClick={() => setCount(count - 1)}
                className="px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition"
              >
                -
              </button>
              <span className="text-3xl font-bold text-gray-800 min-w-[60px] text-center">
                {count}
              </span>
              <button
                onClick={() => setCount(count + 1)}
                className="px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 transition"
              >
                +
              </button>
            </div>
          </div>

          <div className="text-center text-sm text-gray-500">
            <p>Wersja: 1.0.0</p>
            <p className="mt-1">Auto-aktualizacja aktywna ✓</p>
          </div>
        </div>
      </div>
    </div>
  );
}
