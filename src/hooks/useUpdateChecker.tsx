import { useEffect, useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { VersionManager } from '../lib/versionManager';

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
