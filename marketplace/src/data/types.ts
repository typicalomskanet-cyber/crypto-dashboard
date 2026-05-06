export interface Category {
  id: string;
  /** Russian display name */
  name: string;
  /** Emoji or icon char (renders in tile + sidebar) */
  icon: string;
  /** Optional 2-3 word tagline shown on the home block */
  tagline?: string;
  /** Background tint for the category tile */
  tint: string;
}

export interface Product {
  id: string;
  /** Product card title (Russian) */
  title: string;
  /** Brand label printed under the title */
  brand: string;
  /** Description shown on the detail page (1-3 sentences) */
  description: string;
  /** Category id */
  categoryId: string;
  /** List price in RUB */
  price: number;
  /** Optional original price; if set, card shows a strike-through and discount */
  oldPrice?: number;
  /** 0..5; cards always show 1 decimal */
  rating: number;
  /** Number of reviews */
  reviewCount: number;
  /** Product images. First entry is used as the card thumbnail. */
  images: string[];
  /** Free-shipping marker / express badge */
  badges?: ("express" | "bestseller" | "new" | "freeShip")[];
  /** Free-form spec table for the detail page */
  specs?: { name: string; value: string }[];
  /** External partner URL — clicking "Купить" redirects here. */
  partnerUrl: string;
  /** Partner that the redirect leads to (for label on the button) */
  partner: "yandex" | "ozon" | "wildberries" | "ali" | "other";
  /** Stock indicator text shown on the detail page */
  stock?: string;
}
