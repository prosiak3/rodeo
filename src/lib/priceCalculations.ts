export interface PriceCalculation {
  totalPrice: number;
  effectiveQuantity: number;
}

export function calculateItemPrice(
  quantity: number,
  unitPrice: number
): PriceCalculation {
  return {
    totalPrice: quantity * unitPrice,
    effectiveQuantity: quantity
  };
}

export function formatPriceDisplay(price: number): string {
  return price.toFixed(2);
}
