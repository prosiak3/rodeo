import { useEffect, useState } from 'react';

interface VersionInfo {
  version: string;
  buildTime: number;
}

export function useAppUpdate() {
  const [updateAvailable, setUpdateAvailable] = useState(false);
  const [currentVersion, setCurrentVersion] = useState<VersionInfo | null>(null);

  const checkForUpdates = async () => {
    try {
      if (!navigator.serviceWorker.controller) {
        console.log('[Update] No service worker controller yet');
        return;
      }

      const messageChannel = new MessageChannel();

      const versionPromise = new Promise<VersionInfo>((resolve, reject) => {
        messageChannel.port1.onmessage = (event) => {
          if (event.data.type === 'VERSION_INFO') {
            resolve(event.data.version);
          } else if (event.data.type === 'VERSION_ERROR') {
            reject(new Error(event.data.error));
          }
        };

        setTimeout(() => reject(new Error('Timeout')), 5000);
      });

      navigator.serviceWorker.controller.postMessage(
        { type: 'CHECK_VERSION' },
        [messageChannel.port2]
      );

      const serverVersion = await versionPromise;
      console.log('[Update] Server version:', serverVersion);

      if (!currentVersion) {
        console.log('[Update] Setting initial version');
        setCurrentVersion(serverVersion);
        localStorage.setItem('app_version', JSON.stringify(serverVersion));
        return;
      }

      if (serverVersion.buildTime > currentVersion.buildTime) {
        console.log('[Update] New version available!');
        setUpdateAvailable(true);
      } else {
        console.log('[Update] App is up to date');
      }
    } catch (error) {
      console.error('[Update] Error checking for updates:', error);
    }
  };

  const applyUpdate = () => {
    console.log('[Update] Applying update...');

    if (navigator.serviceWorker.controller) {
      navigator.serviceWorker.controller.postMessage({ type: 'SKIP_WAITING' });
    }

    navigator.serviceWorker.getRegistration().then((registration) => {
      if (registration?.waiting) {
        registration.waiting.postMessage({ type: 'SKIP_WAITING' });
      }
    });

    setTimeout(() => {
      window.location.reload();
    }, 100);
  };

  const dismissUpdate = () => {
    setUpdateAvailable(false);
  };

  useEffect(() => {
    const storedVersion = localStorage.getItem('app_version');
    if (storedVersion) {
      try {
        setCurrentVersion(JSON.parse(storedVersion));
      } catch (error) {
        console.error('[Update] Error parsing stored version:', error);
      }
    }
  }, []);

  useEffect(() => {
    const interval = setInterval(() => {
      checkForUpdates();
    }, 5 * 60 * 1000);

    checkForUpdates();

    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        checkForUpdates();
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      clearInterval(interval);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [currentVersion]);

  return {
    updateAvailable,
    applyUpdate,
    dismissUpdate,
    checkForUpdates,
  };
}
