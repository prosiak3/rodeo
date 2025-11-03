import { useState, useEffect } from 'react';
import { X, Download, Clock, AlertCircle, Sparkles } from 'lucide-react';
import { UpdateCheckResult } from '../lib/versionManager';
import Modal from './Modal';

/**
 * Komponent powiadomienia o dostępnej aktualizacji aplikacji.
 *
 * Funkcjonalność:
 * - Wyświetla modal z informacjami o nowej wersji
 * - Pokazuje changelog z nowościami
 * - Obsługuje aktualizacje krytyczne (automatyczny countdown 30s)
 * - Umożliwia odłożenie aktualizacji (1h lub 24h)
 * - Wymusza instalację dla aktualizacji krytycznych
 * - Informuje o limicie odrzuceń (3 razy)
 *
 * Typy aktualizacji:
 * - Normalna: może być odłożona lub odrzucona
 * - Krytyczna: automatyczna instalacja po 30s countdown
 *
 * @param {UpdateNotificationProps} props - Właściwości komponentu
 */
interface UpdateNotificationProps {
  updateInfo: UpdateCheckResult;
  onAccept: () => void;
  onPostpone: (duration: number) => void;
  onDismiss: () => void;
}

export default function UpdateNotification({
  updateInfo,
  onAccept,
  onPostpone,
  onDismiss,
}: UpdateNotificationProps) {
  const [countdown, setCountdown] = useState(30);
  const [showDetails, setShowDetails] = useState(false);

  useEffect(() => {
    if (updateInfo.is_critical) {
      const timer = setInterval(() => {
        setCountdown((prev) => {
          if (prev <= 1) {
            clearInterval(timer);
            onAccept();
            return 0;
          }
          return prev - 1;
        });
      }, 1000);

      return () => clearInterval(timer);
    }
  }, [updateInfo.is_critical, onAccept]);

  const handlePostponeOneHour = () => {
    onPostpone(60 * 60 * 1000);
  };

  const handlePostponeTomorrow = () => {
    onPostpone(24 * 60 * 60 * 1000);
  };

  return (
    <Modal isOpen={true} onClose={updateInfo.is_critical ? () => {} : onDismiss}>
      <div className="bg-white dark:bg-slate-800 rounded-lg shadow-xl max-w-md w-full mx-4">
        <div className="p-6">
          <div className="flex items-start justify-between mb-4">
            <div className="flex items-center gap-3">
              {updateInfo.is_critical ? (
                <div className="p-2 bg-red-100 dark:bg-red-900/30 rounded-full">
                  <AlertCircle className="w-6 h-6 text-red-600 dark:text-red-400" />
                </div>
              ) : (
                <div className="p-2 bg-blue-100 dark:bg-blue-900/30 rounded-full">
                  <Sparkles className="w-6 h-6 text-blue-600 dark:text-blue-400" />
                </div>
              )}
              <div>
                <h3 className="text-lg font-semibold text-slate-900 dark:text-white">
                  {updateInfo.is_critical ? 'Wymagana Aktualizacja' : 'Dostępna Nowa Wersja'}
                </h3>
                <p className="text-sm text-slate-600 dark:text-slate-400">
                  Wersja {updateInfo.latest_version}
                </p>
              </div>
            </div>
            {!updateInfo.is_critical && (
              <button
                onClick={onDismiss}
                className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-300"
              >
                <X className="w-5 h-5" />
              </button>
            )}
          </div>

          {updateInfo.is_critical && (
            <div className="mb-4 p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
              <p className="text-sm text-red-800 dark:text-red-200">
                Ta aktualizacja zawiera krytyczne poprawki bezpieczeństwa i musi zostać zainstalowana.
              </p>
              <p className="text-xs text-red-700 dark:text-red-300 mt-2">
                Automatyczna instalacja za: <strong>{countdown}s</strong>
              </p>
            </div>
          )}

          <div className="mb-4">
            <p className="text-sm text-slate-600 dark:text-slate-400 mb-3">
              {updateInfo.is_critical
                ? 'Nowa wersja zawiera ważne poprawki i ulepszenia.'
                : 'Zainstaluj najnowszą wersję, aby korzystać z nowych funkcji i ulepszeń.'}
            </p>

            {updateInfo.changelog && updateInfo.changelog.length > 0 && (
              <div className="mb-4">
                <button
                  onClick={() => setShowDetails(!showDetails)}
                  className="text-sm text-amber-600 dark:text-amber-400 hover:underline flex items-center gap-1"
                >
                  {showDetails ? 'Ukryj szczegóły' : 'Pokaż co nowego'}
                  <span className="text-xs">{showDetails ? '▲' : '▼'}</span>
                </button>

                {showDetails && (
                  <div className="mt-3 space-y-2 text-sm">
                    {updateInfo.changelog.map((section, idx) => (
                      <div key={idx}>
                        <h4 className="font-semibold text-slate-900 dark:text-white mb-1">
                          {section.category}
                        </h4>
                        <ul className="list-disc list-inside space-y-1 text-slate-600 dark:text-slate-400">
                          {section.items.map((item, itemIdx) => (
                            <li key={itemIdx}>{item}</li>
                          ))}
                        </ul>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>

          <div className="flex flex-col gap-2">
            <button
              onClick={onAccept}
              className="w-full py-3 px-4 bg-amber-600 hover:bg-amber-700 text-white rounded-lg font-medium flex items-center justify-center gap-2 transition-colors"
            >
              <Download className="w-5 h-5" />
              {updateInfo.is_critical ? 'Zainstaluj Teraz' : 'Zaktualizuj Teraz'}
            </button>

            {!updateInfo.is_critical && (
              <>
                <button
                  onClick={handlePostponeOneHour}
                  className="w-full py-2.5 px-4 bg-slate-100 hover:bg-slate-200 dark:bg-slate-700 dark:hover:bg-slate-600 text-slate-700 dark:text-slate-200 rounded-lg font-medium flex items-center justify-center gap-2 transition-colors"
                >
                  <Clock className="w-4 h-4" />
                  Przypomnij za godzinę
                </button>

                <button
                  onClick={handlePostponeTomorrow}
                  className="w-full py-2.5 px-4 bg-slate-100 hover:bg-slate-200 dark:bg-slate-700 dark:hover:bg-slate-600 text-slate-700 dark:text-slate-200 rounded-lg font-medium transition-colors"
                >
                  Przypomnij jutro
                </button>
              </>
            )}
          </div>

          {!updateInfo.is_critical && (
            <p className="text-xs text-slate-500 dark:text-slate-400 text-center mt-4">
              Po trzech odrzuceniach aktualizacja zostanie zainstalowana automatycznie
            </p>
          )}
        </div>
      </div>
    </Modal>
  );
}
