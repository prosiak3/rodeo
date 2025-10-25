import { Trash2, Check, X, AlertCircle } from 'lucide-react';
import { useState } from 'react';
import { useTheme } from '../contexts/ThemeContext';

/**
 * BulkActionBar - Pasek akcji dla bulk operations
 *
 * Funkcjonalność:
 * - Pokazuje ilość zaznaczonych items
 * - Przyciski dla bulk actions (delete, status change, etc.)
 * - Confirmation dialog
 * - Animowane wejście/wyjście
 *
 * Użycie:
 * <BulkActionBar
 *   selectedCount={5}
 *   onDelete={() => handleBulkDelete()}
 *   onChangeStatus={(status) => handleBulkStatusChange(status)}
 *   onCancel={() => clearSelection()}
 * />
 */

interface BulkActionBarProps {
  selectedCount: number;
  onDelete?: () => Promise<void> | void;
  onChangeStatus?: (status: string) => Promise<void> | void;
  onCancel: () => void;
  statusOptions?: Array<{ value: string; label: string; color?: string }>;
  deleteLabel?: string;
  confirmDelete?: boolean;
  position?: 'top' | 'bottom';
}

export default function BulkActionBar({
  selectedCount,
  onDelete,
  onChangeStatus,
  onCancel,
  statusOptions,
  deleteLabel = 'Usuń',
  confirmDelete = true,
  position = 'bottom',
}: BulkActionBarProps) {
  const { colors } = useTheme();
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [showStatusMenu, setShowStatusMenu] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);

  if (selectedCount === 0) return null;

  const handleDelete = async () => {
    if (confirmDelete && !showDeleteConfirm) {
      setShowDeleteConfirm(true);
      return;
    }

    if (onDelete) {
      setIsProcessing(true);
      try {
        await onDelete();
        setShowDeleteConfirm(false);
      } catch (error) {
        console.error('Bulk delete error:', error);
      } finally {
        setIsProcessing(false);
      }
    }
  };

  const handleStatusChange = async (status: string) => {
    if (onChangeStatus) {
      setIsProcessing(true);
      try {
        await onChangeStatus(status);
        setShowStatusMenu(false);
      } catch (error) {
        console.error('Bulk status change error:', error);
      } finally {
        setIsProcessing(false);
      }
    }
  };

  const positionClasses = position === 'top'
    ? 'top-20 animate-slide-in-down'
    : 'bottom-16 sm:bottom-20 animate-slide-in-up';

  return (
    <>
      <div
        className={`fixed left-0 right-0 ${positionClasses} z-50 px-4`}
        role="toolbar"
        aria-label="Bulk actions"
      >
        <div
          className="max-w-2xl mx-auto bg-white rounded-lg shadow-2xl border-2 p-3 sm:p-4"
          style={{ borderColor: colors.primary }}
        >
          {/* Header */}
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <div
                className="w-8 h-8 rounded-full flex items-center justify-center text-white text-sm font-bold"
                style={{ backgroundColor: colors.primary }}
              >
                {selectedCount}
              </div>
              <span className="text-sm sm:text-base font-medium text-gray-700">
                {selectedCount === 1 ? '1 element' : `${selectedCount} elementów`} zaznaczonych
              </span>
            </div>

            <button
              onClick={onCancel}
              className="p-1 hover:bg-gray-100 rounded transition"
              aria-label="Anuluj zaznaczenie"
              disabled={isProcessing}
            >
              <X className="w-5 h-5 text-gray-500" />
            </button>
          </div>

          {/* Delete Confirmation */}
          {showDeleteConfirm ? (
            <div className="bg-red-50 border border-red-200 rounded-lg p-3 mb-3">
              <div className="flex items-start gap-2 mb-3">
                <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
                <div className="flex-1">
                  <p className="text-sm font-medium text-red-900">
                    Czy na pewno chcesz usunąć {selectedCount} {selectedCount === 1 ? 'element' : 'elementy'}?
                  </p>
                  <p className="text-xs text-red-700 mt-1">
                    Ta operacja jest nieodwracalna.
                  </p>
                </div>
              </div>
              <div className="flex gap-2">
                <button
                  onClick={handleDelete}
                  disabled={isProcessing}
                  className="flex-1 bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition disabled:opacity-50"
                >
                  {isProcessing ? 'Usuwanie...' : 'Tak, usuń'}
                </button>
                <button
                  onClick={() => setShowDeleteConfirm(false)}
                  disabled={isProcessing}
                  className="flex-1 bg-gray-200 hover:bg-gray-300 text-gray-700 px-4 py-2 rounded-lg text-sm font-medium transition disabled:opacity-50"
                >
                  Anuluj
                </button>
              </div>
            </div>
          ) : (
            /* Action Buttons */
            <div className="flex gap-2">
              {onDelete && (
                <button
                  onClick={handleDelete}
                  disabled={isProcessing}
                  className="flex items-center gap-2 px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg text-sm font-medium transition disabled:opacity-50"
                  aria-label={`${deleteLabel} ${selectedCount} elementów`}
                >
                  <Trash2 className="w-4 h-4" />
                  <span className="hidden sm:inline">{deleteLabel}</span>
                </button>
              )}

              {onChangeStatus && statusOptions && statusOptions.length > 0 && (
                <div className="relative flex-1">
                  <button
                    onClick={() => setShowStatusMenu(!showStatusMenu)}
                    disabled={isProcessing}
                    className="w-full flex items-center justify-center gap-2 px-4 py-2 hover:bg-gray-100 border border-gray-300 rounded-lg text-sm font-medium transition disabled:opacity-50"
                    style={{ color: colors.primary }}
                    aria-label="Zmień status"
                    aria-expanded={showStatusMenu}
                  >
                    <Check className="w-4 h-4" />
                    <span>Zmień status</span>
                  </button>

                  {showStatusMenu && (
                    <div className="absolute bottom-full left-0 right-0 mb-2 bg-white rounded-lg shadow-xl border border-gray-200 py-2 z-10">
                      {statusOptions.map((option) => (
                        <button
                          key={option.value}
                          onClick={() => handleStatusChange(option.value)}
                          disabled={isProcessing}
                          className="w-full text-left px-4 py-2 hover:bg-gray-50 text-sm transition disabled:opacity-50"
                          style={option.color ? { color: option.color } : {}}
                        >
                          {option.label}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black bg-opacity-20 z-40"
        onClick={onCancel}
        aria-hidden="true"
      />
    </>
  );
}

/**
 * Hook do zarządzania bulk selection
 */
export function useBulkSelection<T extends { id: string }>(items: T[]) {
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

  const toggleSelect = (id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  const toggleSelectAll = () => {
    if (selectedIds.size === items.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(items.map((item) => item.id)));
    }
  };

  const clearSelection = () => {
    setSelectedIds(new Set());
  };

  const isSelected = (id: string) => selectedIds.has(id);

  const selectedItems = items.filter((item) => selectedIds.has(item.id));

  return {
    selectedIds,
    selectedItems,
    selectedCount: selectedIds.size,
    isSelected,
    toggleSelect,
    toggleSelectAll,
    clearSelection,
    isAllSelected: selectedIds.size === items.length && items.length > 0,
    isSomeSelected: selectedIds.size > 0 && selectedIds.size < items.length,
  };
}
