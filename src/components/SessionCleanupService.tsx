import { useEffect } from 'react';
import { closeInactiveSessions } from '../lib/sessionCleanup';

/**
 * Background service that automatically closes inactive sessions every 5 minutes
 * This runs silently in the background without user interaction
 */
export default function SessionCleanupService() {
  useEffect(() => {
    // Run cleanup immediately on mount
    const runCleanup = async () => {
      try {
        const result = await closeInactiveSessions();
        if (result.success) {
          console.log('[SessionCleanup] Successfully closed inactive sessions');
        } else {
          console.warn('[SessionCleanup] Failed:', result.error);
        }
      } catch (error) {
        console.error('[SessionCleanup] Error:', error);
      }
    };

    // Run cleanup immediately
    runCleanup();

    // Set up interval to run every 5 minutes (300000ms)
    const intervalId = setInterval(() => {
      runCleanup();
    }, 300000); // 5 minutes

    // Cleanup interval on unmount
    return () => {
      clearInterval(intervalId);
    };
  }, []);

  // This component renders nothing
  return null;
}
