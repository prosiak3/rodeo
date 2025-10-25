import { useEffect, useRef, useCallback } from 'react';
import { supabase } from '../lib/supabase';

interface TrackingEvent {
  eventType: string;
  eventCategory: string;
  screenName: string;
  previousScreen?: string;
  eventData?: Record<string, any>;
}

interface SessionInfo {
  sessionId: string;
  userId: string;
  sessionStart: Date;
}

// Queue for batching events
let eventQueue: Array<TrackingEvent & { timestamp: Date }> = [];
let flushTimeout: NodeJS.Timeout | null = null;
const BATCH_SIZE = 20;
const FLUSH_INTERVAL = 5000; // 5 seconds

// Session management
let currentSession: SessionInfo | null = null;
let lastActivityTime = Date.now();
const SESSION_TIMEOUT = 15 * 60 * 1000; // 15 minutes - matches auto-logout
let interactionType: 'touch' | 'mouse' | 'mixed' | null = null;

export function useUserTracking(userId: string | null, currentScreen: string) {
  const previousScreenRef = useRef<string>('');
  const screenStartTimeRef = useRef<Date>(new Date());
  const isTrackingEnabledRef = useRef(true);

  // Detect interaction type
  const detectInteractionType = useCallback(() => {
    const updateInteractionType = (type: 'touch' | 'mouse') => {
      if (!interactionType) {
        interactionType = type;
      } else if (interactionType !== type) {
        interactionType = 'mixed';
      }

      if (currentSession) {
        supabase
          .from('user_sessions')
          .update({ interaction_type: interactionType })
          .eq('id', currentSession.sessionId)
          .then(() => {});
      }
    };

    const handleTouch = () => updateInteractionType('touch');
    const handleMouse = () => updateInteractionType('mouse');

    window.addEventListener('touchstart', handleTouch, { once: true, passive: true });
    window.addEventListener('mousedown', handleMouse, { once: true });

    return () => {
      window.removeEventListener('touchstart', handleTouch);
      window.removeEventListener('mousedown', handleMouse);
    };
  }, []);

  // Initialize or resume session
  const initializeSession = useCallback(async () => {
    if (!userId) return;

    const now = Date.now();
    const timeSinceLastActivity = now - lastActivityTime;

    // Check if we need to create a new session (timeout or no session)
    if (!currentSession || timeSinceLastActivity > SESSION_TIMEOUT) {
      const sessionId = crypto.randomUUID();
      interactionType = null;

      try {
        const ua = navigator.userAgent;
        const deviceInfo = parseUserAgent(ua);

        // Get IP address (best effort - może być null jeśli blokowane)
        let ipAddress: string | null = null;
        try {
          const ipResponse = await fetch('https://api.ipify.org?format=json', { signal: AbortSignal.timeout(2000) });
          const ipData = await ipResponse.json();
          ipAddress = ipData.ip || null;
        } catch (ipError) {
          console.debug('[Tracking] Could not fetch IP address');
        }

        const { error } = await supabase
          .from('user_sessions')
          .insert({
            id: sessionId,
            user_id: userId,
            session_start: new Date().toISOString(),
            device_type: getDeviceType(),
            os_name: deviceInfo.os_name,
            os_version: deviceInfo.os_version,
            browser_name: deviceInfo.browser_name,
            browser_version: deviceInfo.browser_version,
            device_vendor: deviceInfo.device_vendor,
            device_model: deviceInfo.device_model,
            is_pwa: isPWA(),
            screen_resolution: getScreenResolution(),
            user_agent: ua,
            ip_address: ipAddress,
          });

        if (!error) {
          currentSession = {
            sessionId,
            userId,
            sessionStart: new Date(),
          };

          detectInteractionType();
        }
      } catch (err) {
        console.error('[Tracking] Failed to initialize session:', err);
      }
    }

    lastActivityTime = now;
  }, [userId, detectInteractionType]);

  // Flush events to database
  const flushEvents = useCallback(async () => {
    if (eventQueue.length === 0 || !currentSession) return;

    const eventsToSend = [...eventQueue];
    const session = currentSession; // Capture for closure
    eventQueue = [];

    try {
      const events = eventsToSend.map(event => ({
        user_id: session.userId,
        session_id: session.sessionId,
        event_type: event.eventType,
        event_category: event.eventCategory,
        screen_name: event.screenName,
        previous_screen: event.previousScreen || null,
        timestamp: event.timestamp.toISOString(),
        event_data: event.eventData || {},
      }));

      await supabase.from('user_events').insert(events);
    } catch (err) {
      console.error('[Tracking] Failed to flush events:', err);
      // Re-add events to queue on failure
      eventQueue = [...eventsToSend, ...eventQueue];
    }
  }, []);

  // Track an event
  const trackEvent = useCallback((event: TrackingEvent) => {
    if (!isTrackingEnabledRef.current || !currentSession) return;

    eventQueue.push({
      ...event,
      timestamp: new Date(),
    });

    lastActivityTime = Date.now();

    // Flush if batch size reached
    if (eventQueue.length >= BATCH_SIZE) {
      if (flushTimeout) {
        clearTimeout(flushTimeout);
        flushTimeout = null;
      }
      flushEvents();
    } else if (!flushTimeout) {
      // Schedule flush
      flushTimeout = setTimeout(() => {
        flushEvents();
        flushTimeout = null;
      }, FLUSH_INTERVAL);
    }
  }, [flushEvents]);

  // Track navigation between screens
  useEffect(() => {
    if (!userId || !currentScreen) return;

    // Initialize session on mount or user change
    initializeSession();

    // Track screen time for previous screen
    if (previousScreenRef.current && previousScreenRef.current !== currentScreen) {
      const timeSpent = Date.now() - screenStartTimeRef.current.getTime();

      // Only track if user spent at least 2 seconds on the screen
      if (timeSpent >= 2000) {
        trackEvent({
          eventType: 'screen_time',
          eventCategory: 'navigation',
          screenName: previousScreenRef.current,
          eventData: {
            duration_ms: timeSpent,
            next_screen: currentScreen,
          },
        });
      }
    }

    // Track navigation to new screen
    if (previousScreenRef.current !== currentScreen) {
      trackEvent({
        eventType: 'navigation',
        eventCategory: 'navigation',
        screenName: currentScreen,
        previousScreen: previousScreenRef.current || 'initial',
        eventData: {
          timestamp: new Date().toISOString(),
        },
      });

      previousScreenRef.current = currentScreen;
      screenStartTimeRef.current = new Date();
    }
  }, [userId, currentScreen, initializeSession, trackEvent]);

  // Flush events on unmount and periodically check for session timeout
  useEffect(() => {
    const intervalId = setInterval(() => {
      const timeSinceLastActivity = Date.now() - lastActivityTime;

      if (timeSinceLastActivity > SESSION_TIMEOUT && currentSession) {
        // End session
        supabase
          .from('user_sessions')
          .update({ session_end: new Date().toISOString() })
          .eq('id', currentSession.sessionId)
          .then(() => {
            currentSession = null;
          });
      }
    }, 60000); // Check every minute

    return () => {
      clearInterval(intervalId);
      flushEvents();

      if (flushTimeout) {
        clearTimeout(flushTimeout);
      }
    };
  }, [flushEvents]);

  // Track clicks
  const trackClick = useCallback((element: string, data?: Record<string, any>) => {
    trackEvent({
      eventType: 'click',
      eventCategory: 'interaction',
      screenName: currentScreen,
      previousScreen: previousScreenRef.current,
      eventData: {
        element,
        ...data,
      },
    });
  }, [currentScreen, trackEvent]);

  // Track form submissions
  const trackFormSubmit = useCallback((formName: string, data?: Record<string, any>) => {
    trackEvent({
      eventType: 'form_submit',
      eventCategory: 'interaction',
      screenName: currentScreen,
      previousScreen: previousScreenRef.current,
      eventData: {
        form: formName,
        ...data,
      },
    });
  }, [currentScreen, trackEvent]);

  // Track order actions
  const trackOrderAction = useCallback((action: string, orderId?: string, data?: Record<string, any>) => {
    trackEvent({
      eventType: action,
      eventCategory: 'order',
      screenName: currentScreen,
      previousScreen: previousScreenRef.current,
      eventData: {
        action,
        order_id: orderId,
        ...data,
      },
    });
  }, [currentScreen, trackEvent]);

  return {
    trackClick,
    trackFormSubmit,
    trackOrderAction,
    trackEvent,
  };
}

// Export function to close current session (e.g., on logout)
export async function closeCurrentSession() {
  if (currentSession) {
    try {
      await supabase
        .from('user_sessions')
        .update({ session_end: new Date().toISOString() })
        .eq('id', currentSession.sessionId);

      console.log('[Tracking] Session closed:', currentSession.sessionId);
      currentSession = null;
    } catch (error) {
      console.error('[Tracking] Failed to close session:', error);
    }
  }
}

function getDeviceType(): string {
  const ua = navigator.userAgent;
  if (/(tablet|ipad|playbook|silk)|(android(?!.*mobi))/i.test(ua)) {
    return 'tablet';
  }
  if (/Mobile|Android|iP(hone|od)|IEMobile|BlackBerry|Kindle|Silk-Accelerated|(hpw|web)OS|Opera M(obi|ini)/.test(ua)) {
    return 'mobile';
  }
  return 'desktop';
}

function parseUserAgent(ua: string) {
  const result = {
    os_name: 'Unknown',
    os_version: '',
    browser_name: 'Unknown',
    browser_version: '',
    device_vendor: '',
    device_model: '',
  };

  if (/Windows NT 10/i.test(ua)) {
    result.os_name = 'Windows';
    result.os_version = '10';
  } else if (/Windows NT 6.3/i.test(ua)) {
    result.os_name = 'Windows';
    result.os_version = '8.1';
  } else if (/Windows NT 6.2/i.test(ua)) {
    result.os_name = 'Windows';
    result.os_version = '8';
  } else if (/Windows NT 6.1/i.test(ua)) {
    result.os_name = 'Windows';
    result.os_version = '7';
  } else if (/Mac OS X (\d+[._]\d+)/i.test(ua)) {
    result.os_name = 'macOS';
    const match = ua.match(/Mac OS X (\d+[._]\d+)/i);
    if (match) result.os_version = match[1].replace('_', '.');
  } else if (/Android (\d+(\.\d+)?)/i.test(ua)) {
    result.os_name = 'Android';
    const match = ua.match(/Android (\d+(\.\d+)?)/i);
    if (match) result.os_version = match[1];
  } else if (/iPhone OS (\d+[._]\d+)/i.test(ua)) {
    result.os_name = 'iOS';
    const match = ua.match(/iPhone OS (\d+[._]\d+)/i);
    if (match) result.os_version = match[1].replace('_', '.');
  } else if (/iPad.*OS (\d+[._]\d+)/i.test(ua)) {
    result.os_name = 'iPadOS';
    const match = ua.match(/OS (\d+[._]\d+)/i);
    if (match) result.os_version = match[1].replace('_', '.');
  } else if (/Linux/i.test(ua)) {
    result.os_name = 'Linux';
  }

  if (/Edg\/(\d+)/i.test(ua)) {
    result.browser_name = 'Edge';
    const match = ua.match(/Edg\/(\d+)/i);
    if (match) result.browser_version = match[1];
  } else if (/Chrome\/(\d+)/i.test(ua) && !/Edg/i.test(ua)) {
    result.browser_name = 'Chrome';
    const match = ua.match(/Chrome\/(\d+)/i);
    if (match) result.browser_version = match[1];
  } else if (/Safari\/(\d+)/i.test(ua) && !/Chrome/i.test(ua)) {
    result.browser_name = 'Safari';
    const match = ua.match(/Version\/(\d+)/i);
    if (match) result.browser_version = match[1];
  } else if (/Firefox\/(\d+)/i.test(ua)) {
    result.browser_name = 'Firefox';
    const match = ua.match(/Firefox\/(\d+)/i);
    if (match) result.browser_version = match[1];
  } else if (/OPR\/(\d+)/i.test(ua) || /Opera\/(\d+)/i.test(ua)) {
    result.browser_name = 'Opera';
    const match = ua.match(/(?:OPR|Opera)\/(\d+)/i);
    if (match) result.browser_version = match[1];
  }

  if (/iPhone/i.test(ua)) {
    result.device_vendor = 'Apple';
    result.device_model = 'iPhone';
  } else if (/iPad/i.test(ua)) {
    result.device_vendor = 'Apple';
    result.device_model = 'iPad';
  } else if (/Macintosh/i.test(ua)) {
    result.device_vendor = 'Apple';
    result.device_model = 'Mac';
  } else if (/Samsung/i.test(ua)) {
    result.device_vendor = 'Samsung';
    const match = ua.match(/SM-[A-Z0-9]+/i);
    if (match) result.device_model = match[0];
  } else if (/Huawei/i.test(ua)) {
    result.device_vendor = 'Huawei';
  } else if (/Xiaomi/i.test(ua)) {
    result.device_vendor = 'Xiaomi';
  }

  return result;
}

function isPWA(): boolean {
  return window.matchMedia('(display-mode: standalone)').matches ||
    (window.navigator as any).standalone === true ||
    document.referrer.includes('android-app://');
}

function getScreenResolution(): string {
  return `${window.screen.width}x${window.screen.height}`;
}
