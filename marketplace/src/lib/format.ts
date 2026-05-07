/** Format price as "12 990 ₽". */
export function formatPrice(value: number): string {
  return new Intl.NumberFormat("ru-RU").format(Math.round(value)) + " ₽";
}

export function discountPct(price: number, oldPrice?: number): number {
  if (!oldPrice || oldPrice <= price) return 0;
  return Math.round(((oldPrice - price) / oldPrice) * 100);
}

const RU_DATE = new Intl.DateTimeFormat("ru-RU", {
  day: "numeric",
  month: "long",
  year: "numeric",
});

/** "2026-04-25" → "25 апреля 2026 г." */
export function formatDate(iso: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  return RU_DATE.format(d);
}
