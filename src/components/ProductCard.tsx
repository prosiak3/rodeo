import { useRef } from 'react';

interface ProductCardProps {
  product: {
    id: string;
    name: string;
    code: string;
    description?: string;
    base_price: number;
    your_price?: number;
    promo_price?: number;
    final_price?: number;
    unit: string;
    min_quantity: number;
    quantity_step: number;
    index?: string;
    tags?: string[];
    promo_10_plus_1?: boolean;
  };
  onSelect?: () => void;
  children?: React.ReactNode;
  priceLayout?: 'horizontal' | 'vertical';
  positionNumber?: number;
}

export default function ProductCard({ product, onSelect, children, priceLayout = 'horizontal', positionNumber }: ProductCardProps) {
  const hasPromo = product.promo_price && product.promo_price > 0;
  const finalPrice = product.promo_price || product.your_price || product.base_price;
  const is10Plus1 = product.promo_10_plus_1;

  const touchStartY = useRef<number | null>(null);
  const touchStartTime = useRef<number>(0);

  const handleTouchStart = (e: React.TouchEvent) => {
    touchStartY.current = e.touches[0].clientY;
    touchStartTime.current = Date.now();
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    if (!onSelect || !touchStartY.current) return;

    const touchEndY = e.changedTouches[0].clientY;
    const deltaY = Math.abs(touchEndY - touchStartY.current);
    const deltaTime = Date.now() - touchStartTime.current;

    // Jeśli przesunięcie jest małe (<10px) i czas jest krótki (<300ms), to kliknięcie
    if (deltaY < 10 && deltaTime < 300) {
      onSelect();
    }

    touchStartY.current = null;
  };

  const handleClick = (e: React.MouseEvent) => {
    // Kliknięcie myszą (desktop)
    if (onSelect) {
      onSelect();
    }
  };

  return (
    <div
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
      onClick={handleClick}
      className={`bg-white rounded-lg shadow p-3 transition ${hasPromo || is10Plus1 ? 'bg-gradient-to-r from-red-50 to-orange-50 border-2 border-red-300' : ''} ${
        onSelect ? 'cursor-pointer hover:shadow-lg' : ''
      }`}
      style={{ touchAction: 'pan-y' }}
    >
      <div className="flex flex-col gap-2">
        <div className="flex items-start justify-between gap-2">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              {positionNumber && (
                <span className="flex-shrink-0 w-8 h-8 bg-amber-100 text-amber-700 rounded-full flex items-center justify-center text-xs font-bold">
                  {positionNumber}
                </span>
              )}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <h4 className="font-semibold text-gray-800 text-sm">{product.name}</h4>
                  {is10Plus1 && (
                    <span className="text-[10px] bg-orange-600 text-white px-1.5 py-0.5 rounded font-bold">10+1 GRATIS</span>
                  )}
                </div>
                <span className="text-xs text-gray-500">{product.code}</span>
              </div>
            </div>
          </div>
        {priceLayout === 'horizontal' ? (
          <div className="flex items-center gap-2 flex-shrink-0">
            {product.promo_price && product.promo_price > 0 && product.promo_price < (product.your_price || product.base_price) ? (
              <>
                <span className="text-xs line-through text-gray-400">
                  {(product.your_price || product.base_price).toFixed(2)}
                </span>
                <span className="text-base font-bold text-red-600 animate-pulse">
                  {product.promo_price.toFixed(2)}
                </span>
              </>
            ) : (
              <span className="text-base font-bold text-amber-600">
                {(product.your_price || product.base_price).toFixed(2)}
              </span>
            )}
          </div>
        ) : (
          <div className="flex flex-col items-end gap-1 flex-shrink-0">
            {product.promo_price && product.promo_price > 0 && product.promo_price < (product.your_price || product.base_price) ? (
              <>
                <span className="text-sm line-through text-gray-400">
                  {(product.your_price || product.base_price).toFixed(2)}
                </span>
                <span className="text-base font-bold text-red-600 animate-pulse">
                  {product.promo_price.toFixed(2)}
                </span>
              </>
            ) : (
              <span className="text-base font-bold text-amber-600">
                {(product.your_price || product.base_price).toFixed(2)}
              </span>
            )}
          </div>
        )}
      </div>

        </div>

        {product.description && (
          <p className="text-xs text-gray-600">{product.description}</p>
        )}

        {product.tags && product.tags.length > 0 && (
          <div className="flex gap-1 flex-wrap">
            {product.tags.map((tag) => (
              <span
                key={tag}
                className="px-2 py-0.5 bg-blue-50 text-blue-700 rounded text-[10px] font-medium"
              >
                #{tag}
              </span>
            ))}
          </div>
        )}

        {product.index && (
          <div className="flex flex-col gap-1">
            <svg className="w-full h-14" viewBox="0 0 300 60" preserveAspectRatio="xMinYMin meet">
              {product.index.split('').map((digit, i) => {
                const barWidth = i % 2 === 0 ? 6 : 10;
                const x = i * 22;
                return (
                  <g key={i}>
                    <rect x={x} y="5" width={barWidth} height="45" fill="#000" />
                  </g>
                );
              })}
            </svg>
            <span className="font-mono text-xs text-gray-600 text-center tracking-wider">{product.index}</span>
          </div>
        )}

      {children && <div className="mt-2">{children}</div>}
    </div>
  );
}
