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
      className={`bg-white rounded-lg shadow p-3 transition ${hasPromo ? 'bg-yellow-50' : ''} ${
        onSelect ? 'cursor-pointer hover:shadow-lg' : ''
      }`}
    >
      <div className="flex flex-col gap-2">
        <div className="flex items-start justify-between gap-2">
          <div className="flex-1 min-w-0">
            <h4 className="font-semibold text-gray-800 text-sm">{product.name}</h4>
            <span className="text-xs text-gray-500">{product.code}</span>
          </div>
        {priceLayout === 'horizontal' ? (
          <div className="flex items-center gap-2 flex-shrink-0">
            {!product.your_price && !product.promo_price && (
              <div className="flex items-center gap-1">
                <span className="text-base font-bold text-amber-600">
                  {product.base_price.toFixed(2)}
                </span>
                <span className="text-xs text-gray-500">PLN/{product.unit}</span>
              </div>
            )}
            {(product.your_price || product.promo_price) && (
              <>
                <div className="flex flex-col items-end">
                  <span className="text-[9px] text-gray-400 uppercase leading-none">Norm.</span>
                  <span className="text-xs line-through text-gray-400">
                    {product.base_price.toFixed(2)}
                  </span>
                </div>
                {product.your_price && product.your_price > 0 && (
                  <div className="flex flex-col items-end">
                    <span className="text-[9px] text-blue-600 uppercase font-medium leading-none">Twoja</span>
                    <span className={`text-sm font-bold ${product.promo_price ? 'line-through text-gray-400' : 'text-blue-600'}`}>
                      {product.your_price.toFixed(2)}
                    </span>
                  </div>
                )}
                {product.promo_price && product.promo_price > 0 && (
                  <div className="flex flex-col items-end animate-pulse">
                    <span className="text-[9px] text-red-600 uppercase font-bold leading-none">Specj.</span>
                    <span className="text-base font-bold text-red-600">
                      {product.promo_price.toFixed(2)}
                    </span>
                  </div>
                )}
                <span className="text-xs text-gray-500">PLN/{product.unit}</span>
              </>
            )}
          </div>
        ) : (
          <div className="flex flex-col items-end gap-1 flex-shrink-0">
            {!product.your_price && !product.promo_price && (
              <div className="flex items-baseline gap-1">
                <span className="text-base font-bold text-amber-600">
                  {product.base_price.toFixed(2)}
                </span>
                <span className="text-xs text-gray-500">PLN/{product.unit}</span>
              </div>
            )}
            {(product.your_price || product.promo_price) && (
              <>
                <div className="flex items-baseline gap-1">
                  <span className="text-[10px] text-gray-400 uppercase">Normalna</span>
                  <span className="text-sm line-through text-gray-400">
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
                    <span className="text-base font-bold text-red-600">
                      {product.promo_price.toFixed(2)}
                    </span>
                  </div>
                )}
                <span className="text-xs text-gray-500">PLN/{product.unit}</span>
              </>
            )}
          </div>
        )}
      </div>

        </div>

        {product.description && (
          <p className="text-xs text-gray-600">{product.description}</p>
        )}

        <div className="flex gap-3 text-xs text-gray-500">
          <span>Min: {product.min_quantity} {product.unit}</span>
          <span>Krok: {product.quantity_step} {product.unit}</span>
        </div>

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
