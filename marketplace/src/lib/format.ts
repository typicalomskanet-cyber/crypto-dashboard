/** Format price as "12 990 ₽". */
export function formatPrice(value: number): string {
  return new Intl.NumberFormat("ru-RU").format(Math.round(value)) + " ₽";
}

export function discountPct(price: number, oldPrice?: number): number {
  if (!oldPrice || oldPrice <= price) return 0;
  return Math.round(((oldPrice - price) / oldPrice) * 100);
}
