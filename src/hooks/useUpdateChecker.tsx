import { useEffect, useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { VersionManager } from '../lib/versionManager';

/**
 * Hook do automatycznego sprawdzania i instalowania aktualizacji przy starcie aplikacji.
 *
 * Funkcjonalność:
 * - Automatycznie sprawdza dostępność aktualizacji 2 sekundy po zalogowaniu
 * - Instaluje aktualizacje automatycznie jeśli użytkownik ma włączoną opcję auto_update
 * - Pomija aktualizację przy wolnym połączeniu (2G)
 * - Loguje wszystkie etapy procesu aktualizacji do bazy danych
 * - Używa Service Worker do bezpiecznej instalacji nowej wersji
 * - Automatycznie odświeża aplikację po zakończeniu aktualizacji
 *
 * Proces aktualizacji:
 * 1. Sprawdza preferencje użytkownika (auto_update_enabled)
 * 2. Pobiera informacje o najnowszej wersji z Supabase
 * 3. Weryfikuje typ połączenia (pomija przy 2G)
 * 4. Loguje rozpoczęcie aktualizacji
 * 5. Wywołuje Service Worker update
 * 6. Czeka na instalację i aktywację
 * 7. Odświeża aplikację
 *
 * @returns {Object} - Stan sprawdzania i wykrywania aktualizacji
 * @returns {boolean} isChecking - Czy obecnie trwa sprawdzanie
 * @returns {boolean} updateDetected - Czy wykryto dostępną aktualizację
 */
export function useUpdateChecker() {
  const { user } = useAuth();
  const [isChecking, setIsChecking] = useState(false);
  const [updateDetected, setUpdateDetected] = useState(false);

  useEffect(() => {
    if (!user) return;

    const checkAndUpdateOnStartup = async () => {
      setIsChecking(true);

      try {
        const preferences = await VersionManager.getUserPreferences(user.id);

        if (!preferences?.auto_update_enabled) {
          console.log('[UpdateChecker] Auto-update disabled by user');
          setIsChecking(false);
          return;
        }

        console.log('[UpdateChecker] Checking for updates on startup...');
        const updateInfo = await VersionManager.checkForUpdates();

        if (!updateInfo || !updateInfo.has_update) {
          console.log('[UpdateChecker] No updates available');
          setIsChecking(false);
          return;
        }

        console.log('[UpdateChecker] Update found:', updateInfo.latest_version);

        const storedVersion = VersionManager.getStoredVersion();
        const currentVersion = VersionManager.getCurrentVersion();

        await VersionManager.logUpdate(user.id, {
          from_version: storedVersion || currentVersion,
          to_version: updateInfo.latest_version,
          update_type: 'auto_on_startup',
          update_status: 'started',
          postponed_count: 0,
          device_info: VersionManager.getDeviceInfo(),
          connection_type: VersionManager.getConnectionType(),
        });

        if (VersionManager.isSlowConnection()) {
          console.log('[UpdateChecker] Slow connection detected, deferring update');
          setIsChecking(false);
          return;
        }

        setUpdateDetected(true);

        await VersionManager.updateLogStatus(
          user.id,
          updateInfo.latest_version,
          'downloading'
        );

        if ('serviceWorker' in navigator && navigator.serviceWorker.controller) {
          console.log('[UpdateChecker] Triggering Service Worker update...');

          navigator.serviceWorker.controller.postMessage({
            type: 'CHECK_FOR_UPDATE',
          });

          const registration = await navigator.serviceWorker.getRegistration();

          if (registration) {
            await registration.update();

            const waitForActivation = () => {
              return new Promise<void>((resolve) => {
                const checkState = () => {
                  if (registration.waiting) {
                    console.log('[UpdateChecker] New version installed, activating...');

                    registration.waiting.postMessage({ type: 'SKIP_WAITING' });

                    navigator.serviceWorker.addEventListener('controllerchange', () => {
                      console.log('[UpdateChecker] Controller changed, reloading...');
                      resolve();
                    });
                  } else if (registration.installing) {
                    registration.installing.addEventListener('statechange', checkState);
                  } else {
                    setTimeout(checkState, 100);
                  }
                };
                checkState();

                setTimeout(() => resolve(), 30000);
              });
            };

            await waitForActivation();

            await VersionManager.updateLogStatus(
              user.id,
              updateInfo.latest_version,
              'completed'
            );

            VersionManager.setStoredVersion(
              updateInfo.latest_version,
              updateInfo.build_number
            );

            console.log('[UpdateChecker] Update successful, reloading application...');
            window.location.reload();
          }
        }
      } catch (error) {
        console.error('[UpdateChecker] Error during automatic update:', error);

        if (user) {
          await VersionManager.updateLogStatus(
            user.id,
            'unknown',
            'failed',
            error instanceof Error ? error.message : 'Unknown error'
          );
        }
      } finally {
        setIsChecking(false);
      }
    };

    const timeout = setTimeout(() => {
      checkAndUpdateOnStartup();
    }, 2000);

    return () => clearTimeout(timeout);
  }, [user]);

  return { isChecking, updateDetected };
}
