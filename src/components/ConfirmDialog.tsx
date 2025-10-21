import { AlertTriangle, CheckCircle, Info, XCircle } from 'lucide-react';

interface ConfirmDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  variant?: 'danger' | 'warning' | 'info' | 'success';
}

export default function ConfirmDialog({
  isOpen,
  onClose,
  onConfirm,
  title,
  message,
  confirmText = 'Potwierdź',
  cancelText = 'Anuluj',
  variant = 'warning'
}: ConfirmDialogProps) {

  if (!isOpen) return null;

  const handleConfirm = () => {
    onConfirm();
    onClose();
  };

  const variantStyles = {
    danger: {
      icon: XCircle,
      iconColor: 'text-red-500',
      buttonBg: 'bg-red-500 hover:bg-red-600',
      accentColor: 'border-red-500'
    },
    warning: {
      icon: AlertTriangle,
      iconColor: 'text-yellow-500',
      buttonBg: 'bg-yellow-500 hover:bg-yellow-600',
      accentColor: 'border-yellow-500'
    },
    info: {
      icon: Info,
      iconColor: 'text-blue-500',
      buttonBg: 'bg-blue-500 hover:bg-blue-600',
      accentColor: 'border-blue-500'
    },
    success: {
      icon: CheckCircle,
      iconColor: 'text-green-500',
      buttonBg: 'bg-green-500 hover:bg-green-600',
      accentColor: 'border-green-500'
    }
  };

  const style = variantStyles[variant];
  const Icon = style.icon;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black bg-opacity-50 backdrop-blur-sm">
      <div
        className={`w-full max-w-md bg-white rounded-2xl shadow-2xl border-t-4 ${style.accentColor} overflow-hidden animate-[scale-in_0.2s_ease-out]`}
      >
        <div className="p-6">
          <div className="flex items-start gap-4">
            <div className={`flex-shrink-0 ${style.iconColor}`}>
              <Icon size={32} />
            </div>
            <div className="flex-1">
              <h3 className="text-xl font-bold mb-2 text-gray-900">
                {title}
              </h3>
              <p className="text-sm leading-relaxed text-gray-700">
                {message}
              </p>
            </div>
          </div>
        </div>

        <div className="flex gap-3 p-4 border-t border-gray-200">
          <button
            onClick={onClose}
            className="flex-1 px-6 py-4 rounded-lg font-medium transition-all hover:scale-105 active:scale-95 bg-gray-100 hover:bg-gray-200 text-gray-900 text-base"
          >
            {cancelText}
          </button>
          <button
            onClick={handleConfirm}
            className={`flex-1 px-6 py-4 rounded-lg font-medium text-white transition-all hover:scale-105 active:scale-95 text-base ${style.buttonBg}`}
          >
            {confirmText}
          </button>
        </div>
      </div>
    </div>
  );
}
