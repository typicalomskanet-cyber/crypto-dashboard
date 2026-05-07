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
  partner: PartnerKind;
  /** Optional extra partner links (multi-marketplace cross-listing). The
   *  primary `partnerUrl` is shown by default; secondary entries appear in
   *  a "Купить ещё на …" dropdown on the product card / detail page. */
  partnerLinks?: PartnerLink[];
  /** Stock indicator text shown on the detail page */
  stock?: string;
  /** Optional SEO overrides. If unset, defaults from `title` / `description`
   *  are used to build <meta> tags when this product page is open. */
  seoTitle?: string;
  seoDescription?: string;
  seoImage?: string;
  /** When false, the product is hidden from the storefront (still visible in
   *  admin). Defaults to true. */
  active?: boolean;
}

export type PartnerKind = "yandex" | "ozon" | "wildberries" | "ali" | "other";

export interface PartnerLink {
  partner: PartnerKind;
  url: string;
  /** Optional label override (e.g. "Маркет — Москва") */
  label?: string;
}

export interface Brand {
  id: string;
  name: string;
  /** Short tagline shown on the brand page header */
  tagline?: string;
  /** Brand logo URL (square recommended) */
  logo?: string;
  /** Long description (markdown-lite) */
  description?: string;
}

export interface Collection {
  id: string;
  /** Headline rendered on the home page block */
  title: string;
  /** Optional subtitle line */
  subtitle?: string;
  /** Ordered product ids */
  productIds: string[];
  /** When false, hidden from the storefront */
  active?: boolean;
  /** Sort order on the home page (smaller = higher) */
  order?: number;
}

export interface ThemePreset {
  id: string;
  name: string;
  brand: string;
  brandDark: string;
  brandLight: string;
  accent: string;
  discount: string;
  paper: string;
  ink: string;
}
