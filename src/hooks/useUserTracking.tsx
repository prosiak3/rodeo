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
const SESSION_TIMEOUT = 30 * 60 * 1000; // 30 minutes

export function useUserTracking(userId: string | null, currentScreen: string) {
  const previousScreenRef = useRef<string>('');
  const screenStartTimeRef = useRef<Date>(new Date());
  const isTrackingEnabledRef = useRef(true);

  // Initialize or resume session
  const initializeSession = useCallback(async () => {
    if (!userId) return;

    const now = Date.now();
    const timeSinceLastActivity = now - lastActivityTime;

    // Check if we need to create a new session (timeout or no session)
    if (!currentSession || timeSinceLastActivity > SESSION_TIMEOUT) {
      const sessionId = crypto.randomUUID();

      try {
        const { error } = await supabase
          .from('user_sessions')
          .insert({
            id: sessionId,
            user_id: userId,
            session_start: new Date().toISOString(),
            device_type: getDeviceType(),
            user_agent: navigator.userAgent,
          });

        if (!error) {
          currentSession = {
            sessionId,
            userId,
            sessionStart: new Date(),
          };
        }
      } catch (err) {
        console.error('[Tracking] Failed to initialize session:', err);
      }
    }

    lastActivityTime = now;
  }, [userId]);

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

  // Track product actions (add, remove, update quantity)
  const trackProductAction = useCallback((
    action: 'add_to_list' | 'remove_from_list' | 'update_quantity' | 'view_details',
    productId: string,
    productName: string,
    data?: Record<string, any>
  ) => {
    trackEvent({
      eventType: action,
      eventCategory: 'product',
      screenName: currentScreen,
      previousScreen: previousScreenRef.current,
      eventData: {
        action,
        product_id: productId,
        product_name: productName,
        timestamp: new Date().toISOString(),
        ...data,
      },
    });
  }, [currentScreen, trackEvent]);

  // Track cart/list modifications
  const trackListModification = useCallback((
    listType: 'order' | 'notebook' | 'draft',
    action: 'add_item' | 'remove_item' | 'update_item' | 'clear_list',
    itemDetails: {
      productId: string;
      productName: string;
      quantity?: number;
      previousQuantity?: number;
    }
  ) => {
    trackEvent({
      eventType: action,
      eventCategory: 'list_modification',
      screenName: currentScreen,
      previousScreen: previousScreenRef.current,
      eventData: {
        list_type: listType,
        action,
        product_id: itemDetails.productId,
        product_name: itemDetails.productName,
        quantity: itemDetails.quantity,
        previous_quantity: itemDetails.previousQuantity,
        timestamp: new Date().toISOString(),
      },
    });
  }, [currentScreen, trackEvent]);

  // Track search and filter actions
  const trackSearch = useCallback((
    searchTerm: string,
    resultsCount: number,
    filters?: Record<string, any>
  ) => {
    trackEvent({
      eventType: 'search',
      eventCategory: 'interaction',
      screenName: currentScreen,
      previousScreen: previousScreenRef.current,
      eventData: {
        search_term: searchTerm,
        results_count: resultsCount,
        filters,
        timestamp: new Date().toISOString(),
      },
    });
  }, [currentScreen, trackEvent]);

  // Track campaign/promotion interactions
  const trackCampaignInteraction = useCallback(async (
    campaignId: string,
    campaignName: string,
    interactionType: 'view' | 'click' | 'dismiss' | 'convert',
    additionalData?: Record<string, any>
  ) => {
    if (!userId || !currentSession) return;

    try {
      await supabase.from('campaign_interactions').insert({
        campaign_id: campaignId,
        user_id: userId,
        session_id: currentSession.sessionId,
        interaction_type: interactionType,
        interaction_data: {
          campaign_name: campaignName,
          screen: currentScreen,
          timestamp: new Date().toISOString(),
          ...additionalData,
        },
        timestamp: new Date().toISOString(),
      });

      // Also track as regular event for path analysis
      trackEvent({
        eventType: `campaign_${interactionType}`,
        eventCategory: 'campaign',
        screenName: currentScreen,
        previousScreen: previousScreenRef.current,
        eventData: {
          campaign_id: campaignId,
          campaign_name: campaignName,
          interaction_type: interactionType,
          ...additionalData,
        },
      });
    } catch (error) {
      console.error('[Tracking] Failed to track campaign interaction:', error);
    }
  }, [userId, currentScreen, currentSession, trackEvent]);

  // Track campaign conversion
  const trackCampaignConversion = useCallback(async (
    campaignId: string,
    orderId: string,
    conversionValue: number,
    productsFromCampaign: Array<{ productId: string; productName: string; quantity: number }>
  ) => {
    if (!userId) return;

    try {
      // Use the database function to track conversion with time calculation
      await supabase.rpc('track_campaign_conversion', {
        p_campaign_id: campaignId,
        p_user_id: userId,
        p_order_id: orderId,
        p_conversion_value: conversionValue,
        p_products: productsFromCampaign,
      });

      console.log('[Tracking] Campaign conversion tracked:', campaignId);
    } catch (error) {
      console.error('[Tracking] Failed to track campaign conversion:', error);
    }
  }, [userId]);

  return {
    trackClick,
    trackFormSubmit,
    trackOrderAction,
    trackProductAction,
    trackListModification,
    trackSearch,
    trackCampaignInteraction,
    trackCampaignConversion,
    trackEvent,
  };
}

// Helper function to determine device type
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
