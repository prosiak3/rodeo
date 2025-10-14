import { Product } from './supabase';

export interface PriceCalculation {
  totalPrice: number;
  isEstimated: boolean;
  effectiveQuantity: number;
}

export function calculateItemPrice(
  product: Product,
  quantity: number,
  unitPrice: number
): PriceCalculation {
  if (product.unit === 'szt' && product.average_weight && product.average_weight > 0) {
    const effectiveKg = quantity * product.average_weight;
    return {
      totalPrice: effectiveKg * unitPrice,
      isEstimated: true,
      effectiveQuantity: effectiveKg
    };
  }

  return {
    totalPrice: quantity * unitPrice,
    isEstimated: false,
    effectiveQuantity: quantity
  };
}

export function formatPriceDisplay(price: number, isEstimated: boolean): string {
  const formatted = price.toFixed(2);
  return isEstimated ? `~${formatted}` : formatted;
}

export function getEstimationTooltip(product: Product, quantity: number): string | null {
  if (product.unit === 'szt' && product.average_weight) {
    return `Orientacyjnie: ${quantity} szt × ${product.average_weight} kg (śr. waga) × ${product.base_price.toFixed(2)} PLN/kg. Dokładna kwota pojawi się na fakturze.`;
  }
  return null;
}
