import { useEffect, useState } from 'react';
import { Download, Loader2, CheckCircle, AlertCircle } from 'lucide-react';
import Modal from './Modal';

interface UpdateProgressModalProps {
  isVisible: boolean;
  version: string;
  onComplete?: () => void;
  onError?: (error: string) => void;
}

type UpdateStage = 'downloading' | 'installing' | 'activating' | 'completed' | 'error';

export default function UpdateProgressModal({
  isVisible,
  version,
  onComplete,
  onError,
}: UpdateProgressModalProps) {
  const [stage, setStage] = useState<UpdateStage>('downloading');
  const [progress, setProgress] = useState(0);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    if (!isVisible) return;

    const simulateUpdate = async () => {
      try {
        setStage('downloading');
        setProgress(0);

        for (let i = 0; i <= 100; i += 5) {
          setProgress(i);
          await new Promise((resolve) => setTimeout(resolve, 100));
        }

        setStage('installing');
        setProgress(0);

        await new Promise((resolve) => setTimeout(resolve, 1000));

        for (let i = 0; i <= 100; i += 10) {
          setProgress(i);
          await new Promise((resolve) => setTimeout(resolve, 80));
        }

        setStage('activating');
        setProgress(100);

        await new Promise((resolve) => setTimeout(resolve, 1000));

        if ('serviceWorker' in navigator && navigator.serviceWorker.controller) {
          navigator.serviceWorker.controller.postMessage({
            type: 'SKIP_WAITING',
          });

          navigator.serviceWorker.addEventListener('controllerchange', () => {
            setStage('completed');
            setTimeout(() => {
              if (onComplete) onComplete();
              window.location.reload();
            }, 1500);
          });

          setTimeout(() => {
            if (stage !== 'completed') {
              setStage('completed');
              if (onComplete) onComplete();
              window.location.reload();
            }
          }, 3000);
        } else {
          setStage('completed');
          setTimeout(() => {
            if (onComplete) onComplete();
            window.location.reload();
          }, 1500);
        }
      } catch (error) {
        const message = error instanceof Error ? error.message : 'Nieznany błąd';
        setErrorMessage(message);
        setStage('error');
        if (onError) onError(message);
      }
    };

    simulateUpdate();
  }, [isVisible, onComplete, onError, stage]);

  const getStageText = () => {
    switch (stage) {
      case 'downloading':
        return 'Pobieranie aktualizacji...';
      case 'installing':
        return 'Instalowanie...';
      case 'activating':
        return 'Aktywowanie nowej wersji...';
      case 'completed':
        return 'Aktualizacja ukończona!';
      case 'error':
        return 'Błąd aktualizacji';
      default:
        return 'Przygotowywanie...';
    }
  };

  const getStageIcon = () => {
    switch (stage) {
      case 'downloading':
        return <Download className="w-8 h-8 text-amber-600 dark:text-amber-400 animate-pulse" />;
      case 'installing':
      case 'activating':
        return <Loader2 className="w-8 h-8 text-amber-600 dark:text-amber-400 animate-spin" />;
      case 'completed':
        return <CheckCircle className="w-8 h-8 text-green-600 dark:text-green-400" />;
      case 'error':
        return <AlertCircle className="w-8 h-8 text-red-600 dark:text-red-400" />;
    }
  };

  if (!isVisible) return null;

  return (
    <Modal isOpen={isVisible} onClose={() => {}}>
      <div className="bg-white dark:bg-slate-800 rounded-lg shadow-xl max-w-md w-full mx-4 p-6">
        <div className="flex flex-col items-center">
          <div className="mb-4">{getStageIcon()}</div>

          <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-2">
            {getStageText()}
          </h3>

          {stage !== 'completed' && stage !== 'error' && (
            <>
              <p className="text-sm text-slate-600 dark:text-slate-400 mb-4 text-center">
                Aktualizacja do wersji {version}
              </p>

              <div className="w-full bg-slate-200 dark:bg-slate-700 rounded-full h-2 mb-4 overflow-hidden">
                <div
                  className="bg-amber-600 dark:bg-amber-500 h-full transition-all duration-300 ease-out"
                  style={{ width: `${progress}%` }}
                />
              </div>

              <p className="text-xs text-slate-500 dark:text-slate-400">
                {progress}% ukończone
              </p>
            </>
          )}

          {stage === 'completed' && (
            <div className="text-center">
              <p className="text-sm text-slate-600 dark:text-slate-400 mb-2">
                Wersja {version} została zainstalowana
              </p>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Aplikacja zostanie odświeżona...
              </p>
            </div>
          )}

          {stage === 'error' && (
            <div className="text-center">
              <p className="text-sm text-red-600 dark:text-red-400 mb-2">
                Wystąpił błąd podczas aktualizacji
              </p>
              {errorMessage && (
                <p className="text-xs text-slate-500 dark:text-slate-400 bg-slate-100 dark:bg-slate-700 p-2 rounded">
                  {errorMessage}
                </p>
              )}
              <button
                onClick={() => window.location.reload()}
                className="mt-4 px-4 py-2 bg-amber-600 hover:bg-amber-700 text-white rounded-lg text-sm font-medium"
              >
                Odśwież ręcznie
              </button>
            </div>
          )}

          {stage !== 'completed' && stage !== 'error' && (
            <p className="text-xs text-slate-400 dark:text-slate-500 mt-4 text-center">
              Nie zamykaj aplikacji podczas aktualizacji
            </p>
          )}
        </div>
      </div>
    </Modal>
  );
}
