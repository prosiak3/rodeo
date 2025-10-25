import { WifiOff, Wifi, RefreshCw, Cloud, CloudOff } from 'lucide-react';
import { useOfflineSync } from '../hooks/useOfflineSync';
import { useAuth } from '../contexts/AuthContext';

/**
 * OfflineIndicator - Wskaźnik stanu offline/online
 *
 * Funkcjonalność:
 * - Pokazuje czy aplikacja jest online/offline
 * - Wyświetla ilość nie-zsynchronizowanych items
 * - Przycisk do manualnej synchronizacji
 * - Animowany status syncing
 *
 * Użycie:
 * <OfflineIndicator />
 */

export default function OfflineIndicator() {
  const { user } = useAuth();
  const { isOnline, unsyncedCount, isSyncing, syncNow, lastSyncTime } = useOfflineSync(user?.id);

  // Nie pokazuj jeśli wszystko ok i online
  if (isOnline && unsyncedCount === 0 && !isSyncing) {
    return null;
  }

  const getStatusColor = () => {
    if (!isOnline) return 'bg-red-500';
    if (isSyncing) return 'bg-yellow-500';
    if (unsyncedCount > 0) return 'bg-orange-500';
    return 'bg-green-500';
  };

  const getStatusText = () => {
    if (!isOnline) return 'Tryb offline';
    if (isSyncing) return 'Synchronizacja...';
    if (unsyncedCount > 0) return `${unsyncedCount} do synchronizacji`;
    return 'Zsynchronizowane';
  };

  const getIcon = () => {
    if (!isOnline) return <CloudOff className="w-4 h-4" />;
    if (isSyncing) return <RefreshCw className="w-4 h-4 animate-spin" />;
    if (unsyncedCount > 0) return <Cloud className="w-4 h-4" />;
    return <Wifi className="w-4 h-4" />;
  };

  return (
    <div className="fixed top-20 right-4 z-50 animate-slide-in-right">
      <div
        className={`${getStatusColor()} text-white rounded-lg shadow-lg p-3 flex items-center gap-3 max-w-xs`}
        role="status"
        aria-live="polite"
      >
        <div className="flex-shrink-0">{getIcon()}</div>

        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium">{getStatusText()}</p>
          {lastSyncTime && isOnline && (
            <p className="text-xs opacity-90 mt-0.5">
              Ostatnia sync: {lastSyncTime.toLocaleTimeString('pl-PL')}
            </p>
          )}
        </div>

        {isOnline && unsyncedCount > 0 && !isSyncing && (
          <button
            onClick={syncNow}
            className="flex-shrink-0 px-3 py-1 bg-white bg-opacity-20 hover:bg-opacity-30 rounded text-xs font-medium transition-all"
            aria-label="Synchronizuj teraz"
          >
            Sync
          </button>
        )}
      </div>

      {/* Offline warning message */}
      {!isOnline && (
        <div className="mt-2 bg-gray-800 text-white rounded-lg shadow-lg p-3 text-xs">
          <p className="font-medium mb-1">📴 Pracujesz offline</p>
          <p className="opacity-80">
            Twoje zmiany zostaną zapisane lokalnie i zsynchronizowane po powrocie online.
          </p>
        </div>
      )}
    </div>
  );
}

/**
 * OfflineStatusBadge - Mała ikona statusu (do użycia w header)
 */
export function OfflineStatusBadge() {
  const { user } = useAuth();
  const { isOnline, unsyncedCount } = useOfflineSync(user?.id);

  if (isOnline && unsyncedCount === 0) {
    return null;
  }

  return (
    <div className="relative">
      {isOnline ? (
        <Cloud className="w-5 h-5 text-orange-500" />
      ) : (
        <WifiOff className="w-5 h-5 text-red-500" />
      )}
      {unsyncedCount > 0 && (
        <span className="absolute -top-1 -right-1 w-4 h-4 bg-orange-500 text-white text-xs rounded-full flex items-center justify-center">
          {unsyncedCount > 9 ? '9+' : unsyncedCount}
        </span>
      )}
    </div>
  );
}
