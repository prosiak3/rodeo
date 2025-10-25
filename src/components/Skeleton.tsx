/**
 * Skeleton - Uniwersalny komponent placeholder podczas ładowania
 *
 * Funkcjonalność:
 * - Animowany efekt "shimmer" (migotanie)
 * - Różne warianty: text, circle, rectangular
 * - Konfigurowalna szerokość i wysokość
 * - Responsywne (dopasowuje się do kontenera)
 *
 * Użycie:
 * <Skeleton variant="text" width="200px" />
 * <Skeleton variant="circle" width="40px" height="40px" />
 * <Skeleton variant="rectangular" width="100%" height="120px" />
 */

interface SkeletonProps {
  variant?: 'text' | 'circle' | 'rectangular';
  width?: string;
  height?: string;
  className?: string;
  count?: number; // Ile skeletonów wyrenderować
}

export default function Skeleton({
  variant = 'text',
  width = '100%',
  height,
  className = '',
  count = 1,
}: SkeletonProps) {
  // Domyślne wysokości dla różnych wariantów
  const defaultHeight = {
    text: '1rem',
    circle: '3rem',
    rectangular: '8rem',
  };

  const finalHeight = height || defaultHeight[variant];

  // Style bazowe
  const baseStyles = 'bg-gradient-to-r from-gray-200 via-gray-100 to-gray-200 animate-pulse';

  // Style dla różnych wariantów
  const variantStyles = {
    text: 'rounded',
    circle: 'rounded-full',
    rectangular: 'rounded-lg',
  };

  const skeletonElement = (
    <div
      className={`${baseStyles} ${variantStyles[variant]} ${className}`}
      style={{
        width,
        height: finalHeight,
      }}
      aria-busy="true"
      aria-live="polite"
    />
  );

  // Jeśli count > 1, renderuj wiele skeletonów
  if (count > 1) {
    return (
      <div className="space-y-2">
        {Array.from({ length: count }).map((_, index) => (
          <div key={index}>{skeletonElement}</div>
        ))}
      </div>
    );
  }

  return skeletonElement;
}

/**
 * SkeletonCard - Gotowy skeleton dla karty produktu
 */
export function SkeletonCard() {
  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
      <Skeleton variant="rectangular" height="120px" className="mb-3" />
      <Skeleton variant="text" width="80%" className="mb-2" />
      <Skeleton variant="text" width="60%" className="mb-3" />
      <div className="flex gap-2">
        <Skeleton variant="rectangular" width="80px" height="32px" />
        <Skeleton variant="rectangular" width="80px" height="32px" />
      </div>
    </div>
  );
}

/**
 * SkeletonList - Gotowy skeleton dla listy
 */
export function SkeletonList({ items = 5 }: { items?: number }) {
  return (
    <div className="space-y-3">
      {Array.from({ length: items }).map((_, index) => (
        <div key={index} className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
          <div className="flex items-center gap-3">
            <Skeleton variant="circle" width="48px" height="48px" />
            <div className="flex-1">
              <Skeleton variant="text" width="70%" className="mb-2" />
              <Skeleton variant="text" width="40%" />
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

/**
 * SkeletonTable - Gotowy skeleton dla tabeli
 */
export function SkeletonTable({ rows = 5, columns = 4 }: { rows?: number; columns?: number }) {
  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
      {/* Header */}
      <div className="border-b border-gray-200 p-4 bg-gray-50">
        <div className="flex gap-4">
          {Array.from({ length: columns }).map((_, index) => (
            <Skeleton key={index} variant="text" width="100px" />
          ))}
        </div>
      </div>

      {/* Rows */}
      {Array.from({ length: rows }).map((_, rowIndex) => (
        <div key={rowIndex} className="border-b border-gray-100 p-4 last:border-0">
          <div className="flex gap-4">
            {Array.from({ length: columns }).map((_, colIndex) => (
              <Skeleton key={colIndex} variant="text" width="100px" />
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}
