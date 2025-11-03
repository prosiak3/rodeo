import { X } from 'lucide-react';

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  message: string;
  type?: 'alert' | 'confirm';
  onConfirm?: () => void;
  confirmText?: string;
  cancelText?: string;
}

export default function Modal({
  isOpen,
  onClose,
  title,
  message,
  type = 'alert',
  onConfirm,
  confirmText = 'OK',
  cancelText = 'Anuluj'
}: ModalProps) {
  if (!isOpen) return null;

  const handleConfirm = () => {
    if (onConfirm) {
      onConfirm();
    }
    onClose();
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black bg-opacity-50 animate-fade-in"
      onClick={onClose}
      style={{ paddingBottom: 'max(env(safe-area-inset-bottom), 16px)' }}
    >
      <div
        className="bg-white rounded-t-3xl sm:rounded-2xl shadow-2xl max-w-md w-full animate-slide-in-right sm:animate-scale-in"
        onClick={(e) => e.stopPropagation()}
        style={{
          maxHeight: 'calc(100vh - env(safe-area-inset-top) - 16px)',
          WebkitTapHighlightColor: 'transparent',
        }}
      >
        <div className="flex items-center justify-between p-5 sm:p-6 border-b border-gray-200">
          <h3 className="text-xl font-bold text-gray-800">{title}</h3>
          <button
            onClick={onClose}
            className="w-10 h-10 flex items-center justify-center text-gray-400 hover:text-gray-600 active:bg-gray-100 rounded-full transition-all duration-200 active:scale-95"
            aria-label="Zamknij"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        <div className="p-5 sm:p-6 max-h-[60vh] overflow-y-auto">
          <p className="text-gray-700 leading-relaxed text-base">{message}</p>
        </div>

        <div className="flex gap-3 p-5 sm:p-6 border-t border-gray-200">
          {type === 'confirm' && (
            <button
              onClick={onClose}
              className="flex-1 px-6 py-4 bg-gray-100 text-gray-700 rounded-xl font-medium hover:bg-gray-200 active:bg-gray-300 active:scale-[0.98] transition-all duration-200"
              style={{ minHeight: '56px', WebkitTapHighlightColor: 'transparent' }}
            >
              {cancelText}
            </button>
          )}
          <button
            onClick={handleConfirm}
            className={`flex-1 px-6 py-4 rounded-xl font-medium transition-all duration-200 active:scale-[0.98] ${
              type === 'confirm'
                ? 'bg-gradient-to-r from-blue-600 to-blue-700 text-white hover:from-blue-700 hover:to-blue-800 shadow-lg'
                : 'bg-gradient-to-r from-blue-600 to-blue-700 text-white hover:from-blue-700 hover:to-blue-800 shadow-lg'
            }`}
            style={{ minHeight: '56px', WebkitTapHighlightColor: 'transparent' }}
          >
            {confirmText}
          </button>
        </div>
      </div>
    </div>
  );
}
