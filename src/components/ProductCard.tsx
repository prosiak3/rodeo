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
  };
  onSelect?: () => void;
  children?: React.ReactNode;
  priceLayout?: 'horizontal' | 'vertical';
}

export default function ProductCard({ product, onSelect, children, priceLayout = 'horizontal' }: ProductCardProps) {
  const hasPromo = product.promo_price && product.promo_price > 0;
  const finalPrice = product.promo_price || product.your_price || product.base_price;

  return (
    <div
      onClick={onSelect}
      className={`bg-white rounded-lg shadow p-4 transition ${hasPromo ? 'bg-yellow-50' : ''} ${
        onSelect ? 'cursor-pointer hover:shadow-lg' : ''
      }`}
    >
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <div className="flex items-baseline gap-2">
            <h4 className="font-semibold text-gray-800">{product.name}</h4>
            <span className="text-xs text-gray-500">{product.code}</span>
          </div>
          {product.description && (
            <p className="text-xs text-gray-600 mt-1">{product.description}</p>
          )}
          <div className="flex gap-3 mt-1 text-xs text-gray-500">
            <span>Min: {product.min_quantity} {product.unit}</span>
            <span>Krok: {product.quantity_step} {product.unit}</span>
          </div>
          {product.tags && product.tags.length > 0 && (
            <div className="flex gap-1 mt-2 flex-wrap">
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
        </div>
        {priceLayout === 'horizontal' ? (
          <div className="flex flex-col items-end gap-2 flex-shrink-0 ml-3">
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-2">
                <span className="text-[10px] text-gray-500 uppercase">N:</span>
                <span
                  className={`text-sm font-semibold ${
                    product.your_price || product.promo_price ? 'line-through text-gray-400' : 'text-amber-600'
                  }`}
                >
                  {product.base_price.toFixed(2)}
                </span>
              </div>
              {product.your_price && product.your_price > 0 && (
                <div className="flex items-center gap-2">
                  <span className="text-[10px] text-blue-600 uppercase font-medium">T:</span>
                  <span className={`text-sm font-semibold ${product.promo_price ? 'line-through text-gray-400' : 'text-blue-600'}`}>
                    {product.your_price.toFixed(2)}
                  </span>
                </div>
              )}
              {product.promo_price && product.promo_price > 0 && (
                <div className="flex items-center gap-2 animate-pulse">
                  <span className="text-[10px] text-red-600 uppercase font-bold">S:</span>
                  <span className="text-base font-bold text-red-600">{product.promo_price.toFixed(2)}</span>
                </div>
              )}
            </div>
            <span className="text-xs text-gray-500">PLN/{product.unit}</span>
          </div>
        ) : (
          <div className="flex flex-col items-end gap-1 flex-shrink-0 ml-3">
            <div className="flex items-baseline gap-1">
              <span className="text-[10px] text-gray-400 uppercase">Normalna</span>
              <span
                className={`text-sm ${
                  product.your_price || product.promo_price ? 'line-through text-gray-400' : 'font-bold text-amber-600'
                }`}
              >
                {product.base_price.toFixed(2)}
              </span>
            </div>
            {product.your_price && product.your_price > 0 && (
              <div className="flex items-baseline gap-1">
                <span className="text-[10px] text-blue-600 uppercase font-medium">Twoja</span>
                <span className={`text-sm ${product.promo_price ? 'line-through text-gray-400' : 'font-bold text-blue-600'}`}>
                  {product.your_price.toFixed(2)}
                </span>
              </div>
            )}
            {product.promo_price && product.promo_price > 0 && (
              <div className="flex items-baseline gap-1 animate-pulse">
                <span className="text-[10px] text-red-600 uppercase font-bold">Specjalna</span>
                <span className="text-base font-bold text-red-600">{product.promo_price.toFixed(2)}</span>
              </div>
            )}
            <span className="text-xs text-gray-500">PLN/{product.unit}</span>
          </div>
        )}
      </div>

      {product.index && (
        <div className="mt-3 flex flex-col gap-1">
          <svg className="w-full h-16" viewBox="0 0 300 70" preserveAspectRatio="xMinYMin meet">
            {product.index.split('').map((digit, i) => {
              const barWidth = i % 2 === 0 ? 6 : 10;
              const x = i * 22;
              return (
                <g key={i}>
                  <rect x={x} y="5" width={barWidth} height="50" fill="#000" />
                </g>
              );
            })}
          </svg>
          <span className="font-mono text-sm text-gray-800 text-center tracking-wider">{product.index}</span>
        </div>
      )}

      {children && <div className="mt-3">{children}</div>}
    </div>
  );
}
