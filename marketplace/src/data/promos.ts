export interface PromoCode {
  id: string;
  code: string;
  /** Discount percentage, 1–100 (display-only — no real checkout). */
  percent: number;
  description: string;
  /** ISO date when the promo expires (inclusive). Empty = no expiry. */
  expiresAt?: string;
  /** Show on the top promo strip. */
  featured: boolean;
  active: boolean;
}

export const DEFAULT_PROMOS: PromoCode[] = [
  {
    id: "promo-welcome",
    code: "WELCOME10",
    percent: 10,
    description: "Скидка 10% на первый заказ от партнёров",
    featured: true,
    active: true,
  },
  {
    id: "promo-spring",
    code: "SPRING25",
    percent: 25,
    description: "Весенние скидки до 25% на электронику",
    featured: false,
    active: true,
  },
  {
    id: "promo-yantach",
    code: "YANTACH",
    percent: 15,
    description: "Промокод на скидку 15% по подборке Yantach",
    featured: false,
    active: true,
  },
];
