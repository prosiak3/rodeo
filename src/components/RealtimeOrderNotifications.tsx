import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import { CheckCircle, XCircle, Clock, AlertCircle, Bell } from 'lucide-react';

/**
 * RealtimeOrderNotifications - Komponent do powiadomień real-time o zmianach zamówień
 *
 * Funkcjonalność:
 * - Nasłuchuje zmian w tabeli orders przez Supabase Realtime
 * - Wyświetla toast notifications przy zmianie statusu zamówienia
 * - Automatycznie znika po 5 sekundach
 * - Różne ikony i kolory dla różnych statusów
 * - Dźwięk powiadomienia (opcjonalnie)
 *
 * Używane tylko dla użytkowników którzy składają zamówienia (store_manager)
 */

interface Notification {
  id: string;
  message: string;
  type: 'success' | 'error' | 'info' | 'warning';
  timestamp: number;
}

export default function RealtimeOrderNotifications() {
  const { user } = useAuth();
  const [notifications, setNotifications] = useState<Notification[]>([]);

  useEffect(() => {
    if (!user?.id) return;

    // Nasłuchuj zmian w zamówieniach użytkownika
    const channel = supabase
      .channel('order_status_changes')
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'orders',
          filter: `created_by=eq.${user.id}`,
        },
        (payload) => {
          console.log('🔔 Order status changed:', payload);

          const newStatus = payload.new.status;
          const oldStatus = payload.old?.status;
          const orderNumber = payload.new.order_number;

          // Nie pokazuj powiadomienia jeśli status się nie zmienił
          if (newStatus === oldStatus) return;

          // Mapowanie statusów na wiadomości i typy
          const statusMessages: Record<string, { message: string; type: Notification['type'] }> = {
            confirmed: {
              message: `Zamówienie ${orderNumber} zostało potwierdzone ✓`,
              type: 'success',
            },
            partially_confirmed: {
              message: `Zamówienie ${orderNumber} zostało częściowo potwierdzone`,
              type: 'warning',
            },
            rejected: {
              message: `Zamówienie ${orderNumber} zostało odrzucone`,
              type: 'error',
            },
            in_progress: {
              message: `Zamówienie ${orderNumber} jest w realizacji`,
              type: 'info',
            },
            pending_confirmation: {
              message: `Zamówienie ${orderNumber} oczekuje na potwierdzenie`,
              type: 'info',
            },
          };

          const notification = statusMessages[newStatus];

          if (notification) {
            const newNotification: Notification = {
              id: `${Date.now()}-${Math.random()}`,
              message: notification.message,
              type: notification.type,
              timestamp: Date.now(),
            };

            setNotifications((prev) => [...prev, newNotification]);

            // Opcjonalnie: odtwórz dźwięk
            playNotificationSound(notification.type);

            // Usuń powiadomienie po 5 sekundach
            setTimeout(() => {
              setNotifications((prev) => prev.filter((n) => n.id !== newNotification.id));
            }, 5000);
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user?.id]);

  const playNotificationSound = (type: Notification['type']) => {
    // Prosty beep używając Web Audio API
    try {
      const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
      const oscillator = audioContext.createOscillator();
      const gainNode = audioContext.createGain();

      oscillator.connect(gainNode);
      gainNode.connect(audioContext.destination);

      // Różne częstotliwości dla różnych typów
      const frequencies: Record<Notification['type'], number> = {
        success: 800,
        error: 400,
        warning: 600,
        info: 700,
      };

      oscillator.frequency.value = frequencies[type];
      oscillator.type = 'sine';

      gainNode.gain.setValueAtTime(0.3, audioContext.currentTime);
      gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.3);

      oscillator.start(audioContext.currentTime);
      oscillator.stop(audioContext.currentTime + 0.3);
    } catch (error) {
      console.error('Error playing notification sound:', error);
    }
  };

  const getIcon = (type: Notification['type']) => {
    const icons = {
      success: <CheckCircle className="w-5 h-5" />,
      error: <XCircle className="w-5 h-5" />,
      warning: <AlertCircle className="w-5 h-5" />,
      info: <Clock className="w-5 h-5" />,
    };
    return icons[type];
  };

  const getColors = (type: Notification['type']) => {
    const colors = {
      success: 'bg-green-50 border-green-200 text-green-800',
      error: 'bg-red-50 border-red-200 text-red-800',
      warning: 'bg-yellow-50 border-yellow-200 text-yellow-800',
      info: 'bg-blue-50 border-blue-200 text-blue-800',
    };
    return colors[type];
  };

  if (notifications.length === 0) return null;

  return (
    <div className="fixed top-4 right-4 z-50 flex flex-col gap-2 max-w-sm">
      {notifications.map((notification) => (
        <div
          key={notification.id}
          className={`flex items-start gap-3 p-4 rounded-lg border shadow-lg animate-slide-in-right ${getColors(
            notification.type
          )}`}
          role="alert"
          aria-live="polite"
        >
          <div className="flex-shrink-0 mt-0.5">{getIcon(notification.type)}</div>
          <div className="flex-1">
            <p className="text-sm font-medium">{notification.message}</p>
          </div>
          <button
            onClick={() =>
              setNotifications((prev) => prev.filter((n) => n.id !== notification.id))
            }
            className="flex-shrink-0 text-gray-400 hover:text-gray-600"
            aria-label="Zamknij powiadomienie"
          >
            ×
          </button>
        </div>
      ))}
    </div>
  );
}

/**
 * Dodaj do index.css:
 *
 * @keyframes slide-in-right {
 *   from {
 *     transform: translateX(100%);
 *     opacity: 0;
 *   }
 *   to {
 *     transform: translateX(0);
 *     opacity: 1;
 *   }
 * }
 *
 * .animate-slide-in-right {
 *   animation: slide-in-right 0.3s ease-out;
 * }
 */
