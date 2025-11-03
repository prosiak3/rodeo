import { useEffect, useState, useCallback, useRef } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { VersionManager, UpdateCheckResult } from '../lib/versionManager';

const CHECK_INTERVAL = 15 * 60 * 1000; // 15 minutes

export function usePeriodicUpdateCheck() {
  const { user } = useAuth();
  const [availableUpdate, setAvailableUpdate] = useState<UpdateCheckResult | null>(null);
  const [isChecking, setIsChecking] = useState(false);
  const lastCheckRef = useRef<number>(0);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  const checkForUpdate = useCallback(async () => {
    if (!user) return;

    const now = Date.now();
    if (now - lastCheckRef.current < 60000) {
      return;
    }

    lastCheckRef.current = now;

    try {
      const preferences = await VersionManager.getUserPreferences(user.id);

      if (!preferences?.periodic_check_enabled) {
        console.log('[PeriodicUpdateCheck] Periodic checks disabled by user');
        return;
      }

      if (preferences.postponed_version && !VersionManager.isPostponeExpired(preferences.postponed_until)) {
        console.log('[PeriodicUpdateCheck] Update postponed until:', preferences.postponed_until);
        return;
      }

      setIsChecking(true);
      console.log('[PeriodicUpdateCheck] Checking for updates...');

      const updateInfo = await VersionManager.checkForUpdates();

      if (updateInfo && updateInfo.has_update) {
        console.log('[PeriodicUpdateCheck] Update available:', updateInfo.latest_version);

        const shouldForce = VersionManager.shouldForceUpdate(
          preferences.postpone_count,
          updateInfo.is_critical
        );

        if (shouldForce) {
          console.log('[PeriodicUpdateCheck] Forcing update (critical or too many postpones)');
          updateInfo.is_critical = true;
        }

        setAvailableUpdate(updateInfo);

        VersionManager.updateLastCheckTime(user.id);
      } else {
        console.log('[PeriodicUpdateCheck] No updates available');
        setAvailableUpdate(null);
      }
    } catch (error) {
      console.error('[PeriodicUpdateCheck] Error checking for updates:', error);
    } finally {
      setIsChecking(false);
    }
  }, [user]);

  const dismissUpdate = useCallback(() => {
    setAvailableUpdate(null);
  }, []);

  const postponeUpdate = useCallback(async (duration: number) => {
    if (!user || !availableUpdate) return;

    const success = await VersionManager.postponeUpdate(
      user.id,
      availableUpdate.latest_version,
      duration
    );

    if (success) {
      console.log('[PeriodicUpdateCheck] Update postponed for', duration / 1000 / 60, 'minutes');
      setAvailableUpdate(null);
    }
  }, [user, availableUpdate]);

  const acceptUpdate = useCallback(async () => {
    if (!user || !availableUpdate) return;

    try {
      console.log('[PeriodicUpdateCheck] User accepted update');

      await VersionManager.logUpdate(user.id, {
        from_version: VersionManager.getCurrentVersion(),
        to_version: availableUpdate.latest_version,
        update_type: 'user_accepted',
        update_status: 'started',
        postponed_count: 0,
        device_info: VersionManager.getDeviceInfo(),
        connection_type: VersionManager.getConnectionType(),
      });

      setAvailableUpdate(null);

      return true;
    } catch (error) {
      console.error('[PeriodicUpdateCheck] Error accepting update:', error);
      return false;
    }
  }, [user, availableUpdate]);

  useEffect(() => {
    if (!user) {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
      return;
    }

    const initialCheck = setTimeout(() => {
      checkForUpdate();
    }, 5000);

    intervalRef.current = setInterval(() => {
      checkForUpdate();
    }, CHECK_INTERVAL);

    console.log('[PeriodicUpdateCheck] Started periodic checks every', CHECK_INTERVAL / 1000 / 60, 'minutes');

    return () => {
      clearTimeout(initialCheck);
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    };
  }, [user, checkForUpdate]);

  useEffect(() => {
    const handleVisibilityChange = () => {
      if (!document.hidden && user) {
        const timeSinceLastCheck = Date.now() - lastCheckRef.current;
        if (timeSinceLastCheck > CHECK_INTERVAL) {
          console.log('[PeriodicUpdateCheck] App became visible, checking for updates...');
          checkForUpdate();
        }
      }
    };

    const handleOnline = () => {
      if (user) {
        console.log('[PeriodicUpdateCheck] Connection restored, checking for updates...');
        setTimeout(() => checkForUpdate(), 1000);
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    window.addEventListener('online', handleOnline);

    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('online', handleOnline);
    };
  }, [user, checkForUpdate]);

  return {
    availableUpdate,
    isChecking,
    dismissUpdate,
    postponeUpdate,
    acceptUpdate,
    checkForUpdate,
  };
}
