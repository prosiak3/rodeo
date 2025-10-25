import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import {
  initOfflineDB,
  getOfflineDrafts,
  getSyncQueue,
  removeFromSyncQueue,
  saveDraftOffline,
  deleteDraftOffline,
  isOnline,
  getUnsyncedCount,
} from '../lib/offlineStorage';

/**
 * useOfflineSync - Hook do synchronizacji offline data
 *
 * Funkcjonalność:
 * - Automatyczna synchronizacja po powrocie online
 * - Pokazuje ilość nie-zsynchronizowanych items
 * - Obsługuje konflikty (last-write-wins)
 * - Retry logic dla failed syncs
 *
 * Użycie:
 * const { isOnline, unsyncedCount, syncNow } = useOfflineSync(userId);
 */

interface UseOfflineSyncReturn {
  isOnline: boolean;
  unsyncedCount: number;
  isSyncing: boolean;
  syncNow: () => Promise<void>;
  lastSyncTime: Date | null;
}

export function useOfflineSync(userId: string | undefined): UseOfflineSyncReturn {
  const [online, setOnline] = useState(isOnline());
  const [unsyncedCount, setUnsyncedCount] = useState(0);
  const [isSyncing, setIsSyncing] = useState(false);
  const [lastSyncTime, setLastSyncTime] = useState<Date | null>(null);

  useEffect(() => {
    // Inicjalizuj IndexedDB
    initOfflineDB().catch(console.error);

    // Nasłuchuj zmian stanu online/offline
    const handleOnline = () => {
      console.log('🌐 Online - starting sync...');
      setOnline(true);
      if (userId) {
        syncOfflineData(userId);
      }
    };

    const handleOffline = () => {
      console.log('📴 Offline mode activated');
      setOnline(false);
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    // Sprawdź unsynced count przy starcie
    if (userId) {
      updateUnsyncedCount();
    }

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, [userId]);

  const updateUnsyncedCount = async () => {
    try {
      const count = await getUnsyncedCount();
      setUnsyncedCount(count);
    } catch (error) {
      console.error('Error getting unsynced count:', error);
    }
  };

  const syncOfflineData = async (userId: string) => {
    if (!isOnline()) {
      console.log('⚠️ Cannot sync - offline');
      return;
    }

    setIsSyncing(true);

    try {
      // 1. Synchronizuj draft orders
      const drafts = await getOfflineDrafts(userId);
      console.log('📤 Syncing', drafts.length, 'offline drafts...');

      for (const draft of drafts) {
        if (!draft.synced) {
          try {
            // Sprawdź czy istnieje w bazie
            const { data: existingOrder } = await supabase
              .from('orders')
              .select('id, updated_at')
              .eq('id', draft.id)
              .single();

            if (existingOrder) {
              // Update (conflict resolution: newer wins)
              const localDate = new Date(draft.updated_at);
              const remoteDate = new Date(existingOrder.updated_at);

              if (localDate > remoteDate) {
                await supabase
                  .from('orders')
                  .update({
                    items: draft.items,
                    updated_at: draft.updated_at,
                  })
                  .eq('id', draft.id);

                console.log('✅ Updated order:', draft.id);
              } else {
                console.log('⏭️ Skipped (remote is newer):', draft.id);
              }
            } else {
              // Create new
              await supabase.from('orders').insert({
                id: draft.id,
                user_id: draft.user_id,
                store_id: draft.store_id,
                status: draft.status,
                items: draft.items,
              });

              console.log('✅ Created order:', draft.id);
            }

            // Oznacz jako zsynchronizowane
            await deleteDraftOffline(draft.id);
          } catch (error) {
            console.error('❌ Failed to sync order:', draft.id, error);
            // Kontynuuj z następnymi
          }
        }
      }

      // 2. Synchronizuj sync queue
      const queue = await getSyncQueue();
      console.log('📤 Processing sync queue:', queue.length, 'items');

      for (const item of queue) {
        try {
          if (item.type === 'create') {
            await supabase.from(item.table).insert(item.data);
          } else if (item.type === 'update') {
            await supabase.from(item.table).update(item.data).eq('id', item.data.id);
          } else if (item.type === 'delete') {
            await supabase.from(item.table).delete().eq('id', item.data.id);
          }

          await removeFromSyncQueue(item.id);
          console.log('✅ Synced queue item:', item.id);
        } catch (error) {
          console.error('❌ Failed to sync queue item:', item.id, error);
        }
      }

      setLastSyncTime(new Date());
      await updateUnsyncedCount();

      console.log('🎉 Sync completed successfully');
    } catch (error) {
      console.error('❌ Sync failed:', error);
    } finally {
      setIsSyncing(false);
    }
  };

  const syncNow = async () => {
    if (userId) {
      await syncOfflineData(userId);
    }
  };

  return {
    isOnline: online,
    unsyncedCount,
    isSyncing,
    syncNow,
    lastSyncTime,
  };
}

/**
 * Helper: Zapisz draft order (online lub offline)
 */
export async function saveDraftOrder(
  order: any,
  userId: string,
  storeId: string
): Promise<{ success: boolean; offline: boolean }> {
  if (isOnline()) {
    try {
      const { error } = await supabase.from('orders').upsert({
        id: order.id,
        user_id: userId,
        store_id: storeId,
        status: 'draft',
        items: order.items,
      });

      if (error) throw error;

      console.log('✅ Order saved online:', order.id);
      return { success: true, offline: false };
    } catch (error) {
      console.error('❌ Failed to save online, switching to offline:', error);
      await saveDraftOffline({
        id: order.id,
        user_id: userId,
        store_id: storeId,
        status: 'draft',
        items: order.items,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        synced: false,
      });

      return { success: true, offline: true };
    }
  } else {
    // Offline mode
    await saveDraftOffline({
      id: order.id,
      user_id: userId,
      store_id: storeId,
      status: 'draft',
      items: order.items,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      synced: false,
    });

    console.log('💾 Order saved offline:', order.id);
    return { success: true, offline: true };
  }
}
