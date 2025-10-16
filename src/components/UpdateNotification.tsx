import { useEffect, useState } from 'react';
import { RefreshCw, X } from 'lucide-react';

interface UpdateNotificationProps {
  onUpdate: () => void;
  onDismiss: () => void;
}

export function UpdateNotification({ onUpdate, onDismiss }: UpdateNotificationProps) {
  const [isVisible, setIsVisible] = useState(true);

  useEffect(() => {
    setIsVisible(true);
  }, []);

  const handleUpdate = () => {
    setIsVisible(false);
    setTimeout(onUpdate, 300);
  };

  const handleDismiss = () => {
    setIsVisible(false);
    setTimeout(onDismiss, 300);
  };

  return (
    <div
      className={`fixed top-4 left-1/2 -translate-x-1/2 z-50 transition-all duration-300 ${
        isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 -translate-y-4'
      }`}
    >
      <div className="bg-gradient-to-r from-blue-500 to-blue-600 text-white rounded-lg shadow-xl p-4 flex items-center gap-4 min-w-[320px] max-w-md">
        <div className="bg-white/20 rounded-full p-2">
          <RefreshCw className="w-5 h-5" />
        </div>

        <div className="flex-1">
          <p className="font-semibold text-sm">Dostępna nowa wersja</p>
          <p className="text-xs text-blue-50 mt-0.5">
            Aktualizacja poprawi działanie aplikacji
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handleUpdate}
            className="bg-white text-blue-600 hover:bg-blue-50 px-4 py-2 rounded-md text-sm font-medium transition-colors"
          >
            Odśwież
          </button>

          <button
            onClick={handleDismiss}
            className="text-white/80 hover:text-white p-1 transition-colors"
            aria-label="Zamknij"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
      </div>
    </div>
  );
}
