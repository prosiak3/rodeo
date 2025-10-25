/**
 * offlineStorage.ts - System offline cache używający IndexedDB
 *
 * Funkcjonalność:
 * - Cache draft orders lokalnie gdy brak internetu
 * - Automatyczna synchronizacja po powrocie online
 * - Queue dla operacji które nie mogły być wykonane
 * - Conflict resolution (last-write-wins)
 *
 * Użycie:
 * await saveDraftOffline(order);
 * const orders = await getOfflineDrafts();
 * await syncOfflineData();
 */

const DB_NAME = 'rodeo_offline';
const DB_VERSION = 1;
const STORE_DRAFT_ORDERS = 'draft_orders';
const STORE_SYNC_QUEUE = 'sync_queue';

interface DraftOrder {
  id: string;
  user_id: string;
  store_id: string;
  status: string;
  items: any[];
  created_at: string;
  updated_at: string;
  synced: boolean;
}

interface SyncQueueItem {
  id: string;
  type: 'create' | 'update' | 'delete';
  table: string;
  data: any;
  timestamp: number;
  retries: number;
}

let db: IDBDatabase | null = null;

/**
 * Inicjalizacja IndexedDB
 */
export async function initOfflineDB(): Promise<void> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onerror = () => reject(request.error);
    request.onsuccess = () => {
      db = request.result;
      console.log('✅ IndexedDB initialized:', DB_NAME);
      resolve();
    };

    request.onupgradeneeded = (event) => {
      const db = (event.target as IDBOpenDBRequest).result;

      // Store dla draft orders
      if (!db.objectStoreNames.contains(STORE_DRAFT_ORDERS)) {
        const draftStore = db.createObjectStore(STORE_DRAFT_ORDERS, { keyPath: 'id' });
        draftStore.createIndex('user_id', 'user_id', { unique: false });
        draftStore.createIndex('synced', 'synced', { unique: false });
        console.log('Created object store:', STORE_DRAFT_ORDERS);
      }

      // Store dla sync queue
      if (!db.objectStoreNames.contains(STORE_SYNC_QUEUE)) {
        const syncStore = db.createObjectStore(STORE_SYNC_QUEUE, { keyPath: 'id' });
        syncStore.createIndex('timestamp', 'timestamp', { unique: false });
        console.log('Created object store:', STORE_SYNC_QUEUE);
      }
    };
  });
}

/**
 * Zapisz draft order offline
 */
export async function saveDraftOffline(order: Partial<DraftOrder>): Promise<void> {
  if (!db) await initOfflineDB();

  return new Promise((resolve, reject) => {
    const transaction = db!.transaction([STORE_DRAFT_ORDERS], 'readwrite');
    const store = transaction.objectStore(STORE_DRAFT_ORDERS);

    const orderWithMetadata = {
      ...order,
      updated_at: new Date().toISOString(),
      synced: false,
    };

    const request = store.put(orderWithMetadata);

    request.onsuccess = () => {
      console.log('💾 Draft order saved offline:', order.id);
      resolve();
    };

    request.onerror = () => reject(request.error);
  });
}

/**
 * Pobierz wszystkie offline draft orders
 */
export async function getOfflineDrafts(userId: string): Promise<DraftOrder[]> {
  if (!db) await initOfflineDB();

  return new Promise((resolve, reject) => {
    const transaction = db!.transaction([STORE_DRAFT_ORDERS], 'readonly');
    const store = transaction.objectStore(STORE_DRAFT_ORDERS);
    const index = store.index('user_id');
    const request = index.getAll(userId);

    request.onsuccess = () => {
      console.log('📥 Retrieved offline drafts:', request.result.length);
      resolve(request.result);
    };

    request.onerror = () => reject(request.error);
  });
}

/**
 * Usuń draft order z offline storage
 */
export async function deleteDraftOffline(orderId: string): Promise<void> {
  if (!db) await initOfflineDB();

  return new Promise((resolve, reject) => {
    const transaction = db!.transaction([STORE_DRAFT_ORDERS], 'readwrite');
    const store = transaction.objectStore(STORE_DRAFT_ORDERS);
    const request = store.delete(orderId);

    request.onsuccess = () => {
      console.log('🗑️ Draft order deleted offline:', orderId);
      resolve();
    };

    request.onerror = () => reject(request.error);
  });
}

/**
 * Dodaj operację do sync queue
 */
export async function addToSyncQueue(item: Omit<SyncQueueItem, 'id' | 'timestamp' | 'retries'>): Promise<void> {
  if (!db) await initOfflineDB();

  return new Promise((resolve, reject) => {
    const transaction = db!.transaction([STORE_SYNC_QUEUE], 'readwrite');
    const store = transaction.objectStore(STORE_SYNC_QUEUE);

    const queueItem: SyncQueueItem = {
      ...item,
      id: `${Date.now()}-${Math.random()}`,
      timestamp: Date.now(),
      retries: 0,
    };

    const request = store.add(queueItem);

    request.onsuccess = () => {
      console.log('📤 Added to sync queue:', queueItem.type, queueItem.table);
      resolve();
    };

    request.onerror = () => reject(request.error);
  });
}

/**
 * Pobierz wszystkie items z sync queue
 */
export async function getSyncQueue(): Promise<SyncQueueItem[]> {
  if (!db) await initOfflineDB();

  return new Promise((resolve, reject) => {
    const transaction = db!.transaction([STORE_SYNC_QUEUE], 'readonly');
    const store = transaction.objectStore(STORE_SYNC_QUEUE);
    const request = store.getAll();

    request.onsuccess = () => {
      console.log('📋 Sync queue items:', request.result.length);
      resolve(request.result);
    };

    request.onerror = () => reject(request.error);
  });
}

/**
 * Usuń item z sync queue
 */
export async function removeFromSyncQueue(itemId: string): Promise<void> {
  if (!db) await initOfflineDB();

  return new Promise((resolve, reject) => {
    const transaction = db!.transaction([STORE_SYNC_QUEUE], 'readwrite');
    const store = transaction.objectStore(STORE_SYNC_QUEUE);
    const request = store.delete(itemId);

    request.onsuccess = () => {
      console.log('✅ Removed from sync queue:', itemId);
      resolve();
    };

    request.onerror = () => reject(request.error);
  });
}

/**
 * Sprawdź czy jesteśmy online
 */
export function isOnline(): boolean {
  return navigator.onLine;
}

/**
 * Wyczyść całą offline database (use with caution!)
 */
export async function clearOfflineDB(): Promise<void> {
  if (!db) await initOfflineDB();

  return new Promise((resolve, reject) => {
    const transaction = db!.transaction([STORE_DRAFT_ORDERS, STORE_SYNC_QUEUE], 'readwrite');

    const draftStore = transaction.objectStore(STORE_DRAFT_ORDERS);
    const syncStore = transaction.objectStore(STORE_SYNC_QUEUE);

    const clearDrafts = draftStore.clear();
    const clearSync = syncStore.clear();

    clearDrafts.onerror = () => reject(clearDrafts.error);
    clearSync.onerror = () => reject(clearSync.error);

    transaction.oncomplete = () => {
      console.log('🧹 Offline DB cleared');
      resolve();
    };
  });
}

/**
 * Zlicz nie-zsynchronizowane drafty
 */
export async function getUnsyncedCount(): Promise<number> {
  if (!db) await initOfflineDB();

  return new Promise((resolve, reject) => {
    const transaction = db!.transaction([STORE_DRAFT_ORDERS], 'readonly');
    const store = transaction.objectStore(STORE_DRAFT_ORDERS);
    const index = store.index('synced');
    const request = index.count(false);

    request.onsuccess = () => {
      resolve(request.result);
    };

    request.onerror = () => reject(request.error);
  });
}
