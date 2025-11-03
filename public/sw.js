// Service Worker for RODEO - Push Notifications, Analytics & Auto-Update
const APP_VERSION = '1.0.0';
const BUILD_NUMBER = 1;
const CACHE_NAME = `rodeo-v${BUILD_NUMBER}`;
const SUPABASE_URL = 'https://your-project.supabase.co'; // Will be replaced dynamically

// Check if we're in development mode
const isDevelopment = self.location.hostname === 'localhost' ||
                      self.location.hostname === '127.0.0.1' ||
                      self.location.hostname.includes('webcontainer');

// Update detection state
let updateAvailable = false;
let waitingWorker = null;

self.addEventListener('install', (event) => {
  console.log(`[SW] Installing version ${APP_VERSION} (build ${BUILD_NUMBER})...`);

  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      console.log('[SW] Cache opened');
      return cache.addAll([
        '/',
        '/index.html',
        '/manifest.json',
        '/icon-192.png',
        '/icon-512.png',
      ]).catch((err) => {
        console.warn('[SW] Cache addAll failed (non-critical):', err);
      });
    }).then(() => {
      console.log('[SW] Installation complete - waiting for activation');
    })
  );

  // Don't auto-activate, wait for user confirmation
  // self.skipWaiting() is called from message handler when user accepts update
});

self.addEventListener('activate', (event) => {
  console.log(`[SW] Activating version ${APP_VERSION}...`);
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      console.log('[SW] Cleaning old caches:', cacheNames);
      return Promise.all(
        cacheNames
          .filter((name) => name !== CACHE_NAME && name.startsWith('rodeo-'))
          .map((name) => {
            console.log('[SW] Deleting old cache:', name);
            return caches.delete(name);
          })
      );
    }).then(() => {
      console.log('[SW] Taking control of all clients');
      return self.clients.claim();
    }).then(() => {
      // Notify all clients about successful activation
      return self.clients.matchAll().then((clients) => {
        clients.forEach((client) => {
          client.postMessage({
            type: 'SW_ACTIVATED',
            version: APP_VERSION,
            buildNumber: BUILD_NUMBER,
          });
        });
      });
    })
  );
});

// Don't intercept fetch requests in development
self.addEventListener('fetch', (event) => {
  // In development, let all requests pass through
  if (isDevelopment) {
    return;
  }

  // In production, you can add caching strategies here if needed
});

// Track push notification delivery
self.addEventListener('push', async (event) => {
  console.log('[SW] Push notification received');

  const data = event.data ? event.data.json() : {};
  const notificationId = data.notificationId || crypto.randomUUID();

  const options = {
    body: data.body || 'Nowe powiadomienie z RODEO',
    icon: data.icon || '/rodeo.png',
    badge: '/rodeo.png',
    tag: notificationId,
    data: {
      url: data.url || '/',
      notificationId: notificationId,
      sentAt: data.sentAt || new Date().toISOString(),
      ...data,
    },
    actions: data.actions || [],
    requireInteraction: data.requireInteraction || false,
  };

  // Track delivery
  trackPushInteraction(notificationId, 'delivered', data.sentAt);

  event.waitUntil(
    self.registration.showNotification(data.title || 'RODEO', options)
  );
});

// Track push notification clicks
self.addEventListener('notificationclick', async (event) => {
  console.log('[SW] Notification clicked');

  const notification = event.notification;
  const notificationId = notification.data?.notificationId;
  const url = notification.data?.url || '/';
  const sentAt = notification.data?.sentAt;

  notification.close();

  // Track click
  if (notificationId) {
    trackPushInteraction(notificationId, 'clicked', sentAt);
  }

  // Open or focus the app
  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clientList) => {
      // Check if app is already open
      for (const client of clientList) {
        if (client.url.includes(self.location.origin) && 'focus' in client) {
          client.postMessage({
            type: 'NOTIFICATION_CLICKED',
            notificationId: notificationId,
            url: url,
            data: notification.data,
          });
          return client.focus();
        }
      }

      // Open new window with notification context
      if (clients.openWindow) {
        const targetUrl = `${self.location.origin}${url}?notification=${notificationId}`;
        return clients.openWindow(targetUrl);
      }
    })
  );
});

// Track notification close
self.addEventListener('notificationclose', async (event) => {
  console.log('[SW] Notification closed');

  const notification = event.notification;
  const notificationId = notification.data?.notificationId;
  const sentAt = notification.data?.sentAt;

  // Determine if it was dismissed or just closed
  // If user interacted recently, it's likely dismissed
  // Otherwise it's probably auto-closed by system
  const action = event.action ? 'dismissed' : 'closed';

  if (notificationId) {
    trackPushInteraction(notificationId, action, sentAt);
  }
});

// Function to track push interactions
async function trackPushInteraction(notificationId, actionType, sentAt) {
  if (!notificationId) return;

  const timeToAction = sentAt ?
    Math.floor((new Date().getTime() - new Date(sentAt).getTime()) / 1000) : null;

  const interactionData = {
    notification_id: notificationId,
    action_type: actionType,
    device_info: self.navigator.userAgent,
    browser_info: getBrowserInfo(),
    was_logged_in: false, // Will be updated by client if logged in
    time_to_action_seconds: timeToAction,
    timestamp: new Date().toISOString(),
  };

  try {
    // Try to get user_id from IndexedDB or other storage
    const userId = await getUserId();
    if (userId) {
      interactionData.user_id = userId;
      interactionData.was_logged_in = true;
    }

    // Queue the interaction for sending
    await queueInteraction(interactionData);

    // Try to send immediately
    await sendQueuedInteractions();
  } catch (error) {
    console.error('[SW] Failed to track interaction:', error);
  }
}

// Get browser info
function getBrowserInfo() {
  const ua = self.navigator.userAgent;
  if (ua.includes('Chrome')) return 'Chrome';
  if (ua.includes('Firefox')) return 'Firefox';
  if (ua.includes('Safari')) return 'Safari';
  if (ua.includes('Edge')) return 'Edge';
  return 'Unknown';
}

// Get userId from storage (if available)
async function getUserId() {
  try {
    // Try to get from IndexedDB or Cache API
    const cache = await caches.open('rodeo-user-data');
    const response = await cache.match('/user-id');
    if (response) {
      const data = await response.json();
      return data.userId;
    }
  } catch (error) {
    console.error('[SW] Failed to get userId:', error);
  }
  return null;
}

// Queue interaction in IndexedDB
async function queueInteraction(interactionData) {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open('rodeo-push-queue', 1);

    request.onupgradeneeded = (event) => {
      const db = event.target.result;
      if (!db.objectStoreNames.contains('interactions')) {
        db.createObjectStore('interactions', { keyPath: 'id', autoIncrement: true });
      }
    };

    request.onsuccess = (event) => {
      const db = event.target.result;
      const transaction = db.transaction(['interactions'], 'readwrite');
      const store = transaction.objectStore('interactions');
      store.add(interactionData);

      transaction.oncomplete = () => resolve();
      transaction.onerror = () => reject(transaction.error);
    };

    request.onerror = () => reject(request.error);
  });
}

// Send queued interactions to Supabase
async function sendQueuedInteractions() {
  try {
    const interactions = await getQueuedInteractions();
    if (interactions.length === 0) return;

    // Get Supabase anon key from cache or environment
    const supabaseKey = await getSupabaseKey();
    if (!supabaseKey) {
      console.warn('[SW] No Supabase key available, keeping interactions queued');
      return;
    }

    const response = await fetch(`${SUPABASE_URL}/rest/v1/push_notification_interactions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'apikey': supabaseKey,
        'Authorization': `Bearer ${supabaseKey}`,
      },
      body: JSON.stringify(interactions.map(i => i.data)),
    });

    if (response.ok) {
      console.log('[SW] Sent', interactions.length, 'interactions');
      await clearQueuedInteractions(interactions.map(i => i.id));
    } else {
      console.error('[SW] Failed to send interactions:', response.status);
    }
  } catch (error) {
    console.error('[SW] Error sending queued interactions:', error);
  }
}

// Get queued interactions
async function getQueuedInteractions() {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open('rodeo-push-queue', 1);

    request.onsuccess = (event) => {
      const db = event.target.result;
      const transaction = db.transaction(['interactions'], 'readonly');
      const store = transaction.objectStore('interactions');
      const getAllRequest = store.getAll();

      getAllRequest.onsuccess = () => resolve(getAllRequest.result.map((data, index) => ({
        id: index + 1,
        data
      })));
      getAllRequest.onerror = () => reject(getAllRequest.error);
    };

    request.onerror = () => resolve([]);
  });
}

// Clear sent interactions
async function clearQueuedInteractions(ids) {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open('rodeo-push-queue', 1);

    request.onsuccess = (event) => {
      const db = event.target.result;
      const transaction = db.transaction(['interactions'], 'readwrite');
      const store = transaction.objectStore('interactions');

      ids.forEach(id => store.delete(id));

      transaction.oncomplete = () => resolve();
      transaction.onerror = () => reject(transaction.error);
    };

    request.onerror = () => reject(request.error);
  });
}

// Get Supabase key from cache
async function getSupabaseKey() {
  try {
    const cache = await caches.open('rodeo-config');
    const response = await cache.match('/supabase-key');
    if (response) {
      const data = await response.json();
      return data.key;
    }
  } catch (error) {
    console.error('[SW] Failed to get Supabase key:', error);
  }
  return null;
}

// Periodic sync to send queued interactions
self.addEventListener('sync', (event) => {
  if (event.tag === 'sync-push-interactions') {
    event.waitUntil(sendQueuedInteractions());
  }
});

// Message handler for communication with app
self.addEventListener('message', (event) => {
  if (event.data.type === 'CLEAR_AI_CACHE') {
    // Handle AI cache clearing if needed
    event.ports[0].postMessage({ success: true });
  }

  if (event.data.type === 'UPDATE_USER_ID') {
    // Store user ID for tracking
    caches.open('rodeo-user-data').then(cache => {
      cache.put('/user-id', new Response(JSON.stringify({ userId: event.data.userId })));
    });
  }

  if (event.data.type === 'UPDATE_SUPABASE_KEY') {
    // Store Supabase key for API calls
    caches.open('rodeo-config').then(cache => {
      cache.put('/supabase-key', new Response(JSON.stringify({ key: event.data.key })));
    });
  }

  if (event.data.type === 'SYNC_PUSH_QUEUE') {
    sendQueuedInteractions();
  }

  // Handle update confirmation from user
  if (event.data.type === 'SKIP_WAITING') {
    console.log('[SW] User accepted update, activating new version');
    self.skipWaiting();
  }

  // Check current version
  if (event.data.type === 'GET_VERSION') {
    event.ports[0].postMessage({
      type: 'VERSION_INFO',
      version: APP_VERSION,
      buildNumber: BUILD_NUMBER,
    });
  }

  // Force update check
  if (event.data.type === 'CHECK_FOR_UPDATE') {
    self.registration.update().then(() => {
      console.log('[SW] Manual update check completed');
    }).catch((err) => {
      console.error('[SW] Manual update check failed:', err);
    });
  }
});
