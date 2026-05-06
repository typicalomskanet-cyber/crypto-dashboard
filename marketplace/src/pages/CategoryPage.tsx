import { useMemo, useState } from "react";
import { useCategories, useProductsByCategory } from "../lib/catalog";
import { ProductGrid } from "../components/ProductGrid";
import { buildHref, type ShopCtx } from "../App";

type Sort = "popular" | "price-asc" | "price-desc" | "rating" | "discount";

export function CategoryPage({ id, ctx }: { id: string; ctx: ShopCtx }) {
  const CATEGORIES = useCategories();
  const cat = CATEGORIES.find(c => c.id === id);
  const inCategory = useProductsByCategory(id);
  const [sort, setSort] = useState<Sort>("popular");
  const [minPrice, setMinPrice] = useState("");
  const [maxPrice, setMaxPrice] = useState("");
  const [minRating, setMinRating] = useState(0);
  const [onlyDiscount, setOnlyDiscount] = useState(false);

  const products = useMemo(() => {
    let list = inCategory;

    const min = parseInt(minPrice, 10);
    const max = parseInt(maxPrice, 10);
    if (!Number.isNaN(min)) list = list.filter(p => p.price >= min);
    if (!Number.isNaN(max)) list = list.filter(p => p.price <= max);
    if (minRating > 0) list = list.filter(p => p.rating >= minRating);
    if (onlyDiscount) list = list.filter(p => !!p.oldPrice);

    switch (sort) {
      case "price-asc":
        list = list.slice().sort((a, b) => a.price - b.price); break;
      case "price-desc":
        list = list.slice().sort((a, b) => b.price - a.price); break;
      case "rating":
        list = list.slice().sort((a, b) => b.rating - a.rating); break;
      case "discount":
        list = list.slice().sort(
          (a, b) =>
            ((b.oldPrice ?? b.price) - b.price) / (b.oldPrice ?? b.price) -
            ((a.oldPrice ?? a.price) - a.price) / (a.oldPrice ?? a.price),
        ); break;
      default: // "popular"
        list = list.slice().sort((a, b) => b.reviewCount - a.reviewCount);
    }
    return list;
  }, [inCategory, sort, minPrice, maxPrice, minRating, onlyDiscount]);

  if (!cat) {
    return <div className="mx-auto max-w-[1320px] p-6">Категория не найдена</div>;
  }

  return (
    <div className="mx-auto max-w-[1320px] px-3 py-4 md:px-4 md:py-6">
      <Breadcrumbs items={[{ label: "Главная", href: buildHref({ name: "home" }) }, { label: cat.name }]} />

      <header
        className="mt-2 flex items-center gap-3 rounded-2xl px-4 py-4 md:px-6 md:py-5"
        style={{ background: cat.tint }}
      >
        <span className="text-4xl md:text-5xl">{cat.icon}</span>
        <div>
          <h1 className="text-[22px] font-extrabold md:text-[28px]">{cat.name}</h1>
          {cat.tagline && <div className="text-[13px] text-ink-2">{cat.tagline}</div>}
        </div>
      </header>

      <div className="mt-4 grid gap-4 lg:grid-cols-[260px_1fr]">
        {/* Filters */}
        <aside className="self-start rounded-2xl border border-line bg-white p-4">
          <h3 className="mb-3 text-[14px] font-bold">Фильтры</h3>

          <FilterBlock label="Цена, ₽">
            <div className="flex gap-2">
              <input
                type="number"
                placeholder="от"
                value={minPrice}
                onChange={e => setMinPrice(e.target.value)}
                className="h-9 w-1/2 rounded-lg border border-line px-2 text-sm outline-none focus:border-brand"
              />
              <input
                type="number"
                placeholder="до"
                value={maxPrice}
                onChange={e => setMaxPrice(e.target.value)}
                className="h-9 w-1/2 rounded-lg border border-line px-2 text-sm outline-none focus:border-brand"
              />
            </div>
          </FilterBlock>

          <FilterBlock label="Минимальный рейтинг">
            <div className="flex gap-1">
              {[0, 4, 4.5, 4.8].map(r => (
                <button
                  key={r}
                  onClick={() => setMinRating(r)}
                  className={`flex-1 rounded-lg border px-2 py-1.5 text-xs ${
                    minRating === r
                      ? "border-brand bg-brand-light text-brand"
                      : "border-line bg-paper text-ink-2 hover:text-ink"
                  }`}
                >
                  {r === 0 ? "Любой" : `от ${r}★`}
                </button>
              ))}
            </div>
          </FilterBlock>

          <FilterBlock label="Акции">
            <label className="flex items-center gap-2 text-sm">
              <input
                type="checkbox"
                checked={onlyDiscount}
                onChange={e => setOnlyDiscount(e.target.checked)}
                className="h-4 w-4 accent-brand"
              />
              Только со скидкой
            </label>
          </FilterBlock>

          <FilterBlock label="Другие категории">
            <div className="flex flex-wrap gap-1.5">
              {CATEGORIES.filter(c => c.id !== id).slice(0, 8).map(c => (
                <a
                  key={c.id}
                  href={buildHref({ name: "category", id: c.id })}
                  className="rounded-full border border-line bg-paper px-2.5 py-1 text-xs text-ink-2 hover:border-brand hover:text-brand"
                >
                  {c.icon} {c.name}
                </a>
              ))}
            </div>
          </FilterBlock>
        </aside>

        {/* Results */}
        <div>
          <div className="mb-3 flex items-center justify-between gap-2">
            <div className="text-sm text-ink-2">
              Найдено {products.length} {decl(products.length)}
            </div>
            <select
              value={sort}
              onChange={e => setSort(e.target.value as Sort)}
              className="h-10 rounded-xl border border-line bg-white px-3 text-sm outline-none focus:border-brand"
            >
              <option value="popular">Сначала популярные</option>
              <option value="price-asc">Сначала дешёвые</option>
              <option value="price-desc">Сначала дорогие</option>
              <option value="rating">По рейтингу</option>
              <option value="discount">По размеру скидки</option>
            </select>
          </div>
          <ProductGrid products={products} ctx={ctx} showPartnerButton />
        </div>
      </div>
    </div>
  );
}

function Breadcrumbs({ items }: { items: { label: string; href?: string }[] }) {
  return (
    <nav className="mb-3 flex flex-wrap items-center gap-1 text-[12px] text-ink-2">
      {items.map((b, i) => (
        <span key={i} className="flex items-center gap-1">
          {b.href ? (
            <a href={b.href} className="hover:text-brand">{b.label}</a>
          ) : (
            <span className="text-ink">{b.label}</span>
          )}
          {i < items.length - 1 && <span className="opacity-50">/</span>}
        </span>
      ))}
    </nav>
  );
}

function FilterBlock(props: { label: string; children: React.ReactNode }) {
  return (
    <div className="mb-4">
      <div className="mb-1.5 text-[12px] font-semibold uppercase tracking-wide text-ink-2">
        {props.label}
      </div>
      {props.children}
    </div>
  );
}

function decl(n: number) {
  const n10 = n % 10, n100 = n % 100;
  if (n10 === 1 && n100 !== 11) return "товар";
  if (n10 >= 2 && n10 <= 4 && (n100 < 12 || n100 > 14)) return "товара";
  return "товаров";
}
