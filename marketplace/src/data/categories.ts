import type { Category } from "./types";

export const CATEGORIES: Category[] = [
  { id: "electronics", name: "Электроника", icon: "📱", tagline: "Смартфоны, ноутбуки, аудио", tint: "#e3edff" },
  { id: "appliances", name: "Бытовая техника", icon: "🍳", tagline: "Для дома и кухни", tint: "#fff0e3" },
  { id: "fashion", name: "Одежда и обувь", icon: "👗", tagline: "Сезонные коллекции", tint: "#fde3f0" },
  { id: "home", name: "Дом и сад", icon: "🛋️", tagline: "Мебель, декор, хранение", tint: "#e3f0e8" },
  { id: "beauty", name: "Красота", icon: "💄", tagline: "Уход и косметика", tint: "#fcdbe6" },
  { id: "sport", name: "Спорт", icon: "🏋️", tagline: "Активный образ жизни", tint: "#e0f4ff" },
  { id: "kids", name: "Детские товары", icon: "🧸", tagline: "Игрушки и одежда", tint: "#fff7c2" },
  { id: "auto", name: "Авто", icon: "🚗", tagline: "Аксессуары и тюнинг", tint: "#e6e6e6" },
  { id: "books", name: "Книги", icon: "📚", tagline: "Художественная и детская", tint: "#f0e3ff" },
  { id: "pets", name: "Зоотовары", icon: "🐾", tagline: "Корм, аксессуары", tint: "#dbf2e0" },
  { id: "groceries", name: "Продукты", icon: "🛒", tagline: "С быстрой доставкой", tint: "#ffeacc" },
  { id: "toys", name: "Игры и хобби", icon: "🎲", tagline: "Настолки и моделизм", tint: "#dde5ff" },
];

export const CATEGORY_BY_ID = new Map(CATEGORIES.map(c => [c.id, c]));
