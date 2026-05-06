export interface Banner {
  id: string;
  /** Big headline (1-2 lines) */
  title: string;
  /** Optional secondary line under the title */
  subtitle?: string;
  /** Small badge above the title */
  pill?: string;
  /** Primary CTA — uses an internal hash route or external URL */
  ctaText: string;
  ctaHref: string;
  /** Background gradient (CSS) */
  bg: string;
  /** Optional decorative emoji shown large on the right */
  emoji?: string;
}

export const DEFAULT_BANNERS: Banner[] = [
  {
    id: "b-1",
    pill: "⚡ Мегараспродажа",
    title: "Yantach Shop — умные покупки каждый день",
    subtitle: "Скидки до 50%, миллионы товаров с доставкой по России",
    ctaText: "Перейти в каталог",
    ctaHref: "#/c/electronics",
    bg: "linear-gradient(135deg, #0050e0 0%, #1d8bff 60%, #36a8ff 100%)",
    emoji: "🛍️",
  },
  {
    id: "b-2",
    pill: "📱 Электроника",
    title: "Смартфоны, ноутбуки и аудио",
    subtitle: "Бестселлеры этого месяца — с гарантией от партнёров",
    ctaText: "Смотреть подборку",
    ctaHref: "#/c/electronics",
    bg: "linear-gradient(135deg, #6e0bd0 0%, #b033ff 100%)",
    emoji: "📱",
  },
  {
    id: "b-3",
    pill: "🏠 Дом и сад",
    title: "Уют — за пару кликов",
    subtitle: "Мебель, текстиль, освещение, всё для кухни",
    ctaText: "Открыть категорию",
    ctaHref: "#/c/home",
    bg: "linear-gradient(135deg, #ff7e1b 0%, #ffb800 100%)",
    emoji: "🛋️",
  },
  {
    id: "b-4",
    pill: "💄 Красота и уход",
    title: "Лучшие бренды по приятным ценам",
    subtitle: "Ароматы, макияж, уход за кожей и волосами",
    ctaText: "К красоте",
    ctaHref: "#/c/beauty",
    bg: "linear-gradient(135deg, #ff3a8b 0%, #ff7eb6 100%)",
    emoji: "💄",
  },
];
