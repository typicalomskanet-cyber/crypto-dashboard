import { useEffect, useMemo, useState } from "react";
import { useCatalog, useCategories, useProducts, useProductsByCategory } from "../lib/catalog";
import { useCompare, useRecentlyViewed } from "../lib/preferences";
import { discountPct, formatPrice } from "../lib/format";
import { buildHref, type ShopCtx } from "../App";
import { ProductGrid } from "../components/ProductGrid";
import { ShareButtons } from "../components/ShareButtons";

const PARTNER_LABEL: Record<string, string> = {
  yandex: "Купить на Яндекс.Маркет",
  ozon: "Купить на Ozon",
  wildberries: "Купить на Wildberries",
  ali: "Купить на AliExpress",
  other: "Купить у партнёра",
};

export function ProductPage({ id, ctx }: { id: string; ctx: ShopCtx }) {
  const PRODUCTS = useProducts();
  const CATEGORIES = useCategories();
  const { trackClick } = useCatalog();
  const recent = useRecentlyViewed();
  const compare = useCompare();
  const p = PRODUCTS.find(x => x.id === id);
  const inCategory = useProductsByCategory(p?.categoryId ?? "");
  const [imgIdx, setImgIdx] = useState(0);

  useEffect(() => {
    if (p) recent.track(p.id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [p?.id]);

  const related = useMemo(
    () => p
      ? inCategory.filter(r => r.id !== p.id).slice(0, 10)
      : PRODUCTS.slice(0, 10),
    [p, inCategory, PRODUCTS],
  );

  if (!p) {
    return (
      <div className="mx-auto max-w-[800px] px-4 py-8">
        <div className="rounded-2xl bg-white p-8 text-center text-ink-2">
          Товар не найден.
          <div className="mt-3">
            <a href={buildHref({ name: "home" })} className="text-brand">
              Вернуться на главную
            </a>
          </div>
        </div>
      </div>
    );
  }

  const cat = CATEGORIES.find(c => c.id === p.categoryId);
  const off = discountPct(p.price, p.oldPrice);
  const fav = ctx.isFavorite(p.id);

  return (
    <div className="mx-auto max-w-[1320px] px-3 py-4 md:px-4 md:py-6">
      <nav className="mb-3 flex flex-wrap items-center gap-1 text-[12px] text-ink-2">
        <a href={buildHref({ name: "home" })} className="hover:text-brand">Главная</a>
        <span className="opacity-50">/</span>
        {cat && (
          <>
            <a href={buildHref({ name: "category", id: cat.id })} className="hover:text-brand">
              {cat.name}
            </a>
            <span className="opacity-50">/</span>
          </>
        )}
        <span className="clamp-1 max-w-[60vw] text-ink">{p.title}</span>
      </nav>

      <div className="grid gap-6 lg:grid-cols-[1fr_460px]">
        {/* Gallery + content */}
        <div className="grid gap-4 md:grid-cols-[100px_1fr]">
          <div className="order-2 flex gap-2 overflow-x-auto md:order-1 md:flex-col">
            {p.images.map((src, i) => (
              <button
                key={i}
                onClick={() => setImgIdx(i)}
                className={`h-20 w-20 shrink-0 overflow-hidden rounded-lg border-2 ${
                  imgIdx === i ? "border-brand" : "border-line"
                }`}
                aria-label={`Фото ${i + 1}`}
              >
                <img src={src} alt="" className="h-full w-full object-cover" />
              </button>
            ))}
          </div>
          <div className="order-1 overflow-hidden rounded-2xl border border-line bg-white md:order-2">
            <div className="relative aspect-square">
              <img
                src={p.images[imgIdx]}
                alt={p.title}
                className="h-full w-full object-cover"
              />
              {off > 0 && (
                <span className="absolute left-3 top-3 rounded-md bg-discount px-2 py-1 text-xs font-bold text-white">
                  −{off}% скидка
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Sidebar with price + buy buttons */}
        <aside className="space-y-4">
          <div>
            <div className="text-[13px] font-semibold uppercase tracking-wide text-ink-2">
              {p.brand}
            </div>
            <h1 className="mt-1 text-[20px] font-extrabold leading-snug md:text-[24px]">
              {p.title}
            </h1>
            <div className="mt-2 flex items-center gap-2 text-sm">
              <span className="flex items-center gap-1 text-accent-dark">
                ★ <span className="font-semibold text-ink">{p.rating.toFixed(1)}</span>
              </span>
              <span className="text-ink-2">{p.reviewCount} отзывов</span>
              <span className="text-ink-2">·</span>
              <span className="rounded bg-paper px-2 py-0.5 text-xs text-ink-2">
                {p.stock}
              </span>
            </div>
          </div>

          {/* Price card */}
          <div className="rounded-2xl border border-line bg-white p-4 shadow-sm">
            <div className="flex items-baseline gap-3">
              <span className="text-[34px] font-black leading-none">{formatPrice(p.price)}</span>
              {p.oldPrice && (
                <span className="text-[16px] text-ink-2 line-through">
                  {formatPrice(p.oldPrice)}
                </span>
              )}
            </div>
            {p.oldPrice && (
              <div className="mt-1 text-[13px] text-discount">
                Экономия {formatPrice(p.oldPrice - p.price)}
              </div>
            )}

            {/* The primary "Buy on partner site" CTA — this is the button the
                user explicitly requested at the bottom of the product. */}
            <a
              href={p.partnerUrl}
              target="_blank"
              rel="noopener noreferrer sponsored"
              onClick={() => trackClick(p.id)}
              className="mt-4 flex h-12 w-full items-center justify-center gap-2 rounded-xl bg-accent text-base font-bold text-ink transition hover:bg-accent-dark"
            >
              {PARTNER_LABEL[p.partner] ?? "Купить"}
              <ExtIcon />
            </a>

            <button
              type="button"
              onClick={() => ctx.addToCart(p.id)}
              className="mt-2 flex h-12 w-full items-center justify-center rounded-xl border border-brand bg-white text-base font-semibold text-brand transition hover:bg-brand-light"
            >
              В корзину
            </button>

            <div className="mt-2 grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => ctx.toggleFavorite(p.id)}
                className="flex h-11 items-center justify-center gap-2 rounded-xl border border-line bg-white text-sm text-ink-2 transition hover:border-brand hover:text-brand"
              >
                <HeartIcon filled={fav} />
                {fav ? "В избранном" : "В избранное"}
              </button>
              <button
                type="button"
                onClick={() => compare.toggle(p.id)}
                className={`flex h-11 items-center justify-center gap-2 rounded-xl border text-sm transition ${
                  compare.has(p.id)
                    ? "border-brand bg-brand-light text-brand"
                    : "border-line bg-white text-ink-2 hover:border-brand hover:text-brand"
                }`}
              >
                ⚖️ {compare.has(p.id) ? "В сравнении" : "Сравнить"}
              </button>
            </div>
          </div>

          <ShareButtons product={p} />

          <div className="rounded-2xl border border-line bg-white p-4 text-[13px] text-ink-2">
            <div className="mb-1 font-semibold text-ink">🚚 Доставка</div>
            Условия доставки указаны на сайте партнёра. После нажатия «Купить»
            вы перейдёте на страницу товара у{" "}
            <span className="font-medium">
              {p.partner === "yandex" ? "Яндекс.Маркета" : "партнёра"}
            </span>.
          </div>
        </aside>
      </div>

      {/* Description + specs */}
      <section className="mt-8 grid gap-4 lg:grid-cols-2">
        <div className="rounded-2xl border border-line bg-white p-5">
          <h2 className="mb-2 text-lg font-bold">Описание</h2>
          <p className="text-[14px] leading-relaxed text-ink-2">{p.description}</p>
        </div>
        {p.specs && p.specs.length > 0 && (
          <div className="rounded-2xl border border-line bg-white p-5">
            <h2 className="mb-2 text-lg font-bold">Характеристики</h2>
            <dl className="divide-y divide-line">
              {p.specs.map(s => (
                <div key={s.name} className="grid grid-cols-2 gap-3 py-2 text-[13px]">
                  <dt className="text-ink-2">{s.name}</dt>
                  <dd className="font-medium">{s.value}</dd>
                </div>
              ))}
            </dl>
          </div>
        )}
      </section>

      {/* Related */}
      {related.length > 0 && (
        <section className="mt-10">
          <h2 className="mb-3 text-[18px] font-extrabold md:text-[22px]">Похожие товары</h2>
          <ProductGrid products={related} ctx={ctx} showPartnerButton />
        </section>
      )}

      {/* Bottom mobile sticky CTA — duplicates the main partner button so it's
          always reachable, mirroring how Ozon / WB show "В корзину" at bottom. */}
      <div className="sticky bottom-0 left-0 right-0 z-20 mt-10 -mx-3 border-t border-line bg-white p-3 md:hidden">
        <div className="flex items-center gap-3">
          <div className="min-w-0">
            <div className="text-[18px] font-extrabold leading-none">{formatPrice(p.price)}</div>
            {p.oldPrice && (
              <div className="text-[12px] text-ink-2 line-through">{formatPrice(p.oldPrice)}</div>
            )}
          </div>
          <a
            href={p.partnerUrl}
            target="_blank"
            rel="noopener noreferrer sponsored"
            onClick={() => trackClick(p.id)}
            className="flex h-11 flex-1 items-center justify-center gap-1.5 rounded-xl bg-accent text-sm font-bold text-ink"
          >
            {PARTNER_LABEL[p.partner] ?? "Купить"}
            <ExtIcon />
          </a>
        </div>
      </div>
    </div>
  );
}

function ExtIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 16 16" fill="none">
      <path
        d="M9 3h4v4M13 3l-7 7M6 5H3v8h8v-3"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}
function HeartIcon({ filled }: { filled: boolean }) {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24">
      <path
        d="M12 21s-7-4.35-7-10a4.5 4.5 0 018-2.8A4.5 4.5 0 0119 11c0 5.65-7 10-7 10z"
        fill={filled ? "var(--color-discount)" : "none"}
        stroke={filled ? "var(--color-discount)" : "currentColor"}
        strokeWidth="1.6"
      />
    </svg>
  );
}
