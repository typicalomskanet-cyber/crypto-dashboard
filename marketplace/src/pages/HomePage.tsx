import { useEffect, useMemo, useRef, useState } from "react";
import { useCatalog, useCategories, useNews, useProducts } from "../lib/catalog";
import { useRecentlyViewed } from "../lib/preferences";
import { ProductGrid } from "../components/ProductGrid";
import { buildHref, type ShopCtx } from "../App";
import { discountPct, formatDate } from "../lib/format";

export function HomePage({ ctx }: { ctx: ShopCtx }) {
  const PRODUCTS = useProducts();
  const CATEGORIES = useCategories();
  const news = useNews().slice(0, 3);
  const { banners, productById } = useCatalog();
  const recent = useRecentlyViewed();
  const recentlyViewed = useMemo(
    () => recent.ids.map(id => productById.get(id)).filter((p): p is NonNullable<typeof p> => !!p),
    [recent.ids, productById],
  );

  const bestsellers = useMemo(
    () =>
      [...PRODUCTS]
        .filter(p => p.badges?.includes("bestseller"))
        .sort((a, b) => b.reviewCount - a.reviewCount)
        .slice(0, 10),
    [PRODUCTS],
  );

  const deals = useMemo(
    () =>
      [...PRODUCTS]
        .filter(p => p.oldPrice)
        .sort((a, b) => discountPct(b.price, b.oldPrice) - discountPct(a.price, a.oldPrice))
        .slice(0, 10),
    [PRODUCTS],
  );

  const newArrivals = useMemo(
    () => PRODUCTS.filter(p => p.badges?.includes("new")).slice(0, 8),
    [PRODUCTS],
  );

  return (
    <div className="mx-auto max-w-[1320px] px-3 py-4 md:px-4 md:py-6">
      <HeroCarousel />

      {/* Category tiles */}
      <section className="mt-6">
        <h2 className="mb-3 text-[18px] font-extrabold md:text-[22px]">Категории</h2>
        <div className="grid grid-cols-3 gap-2 sm:grid-cols-4 md:grid-cols-6 lg:grid-cols-8">
          {CATEGORIES.map(c => (
            <a
              key={c.id}
              href={buildHref({ name: "category", id: c.id })}
              className="group flex flex-col items-center gap-1.5 rounded-2xl bg-white p-3 text-center transition hover:-translate-y-0.5 hover:shadow-md"
            >
              <span
                className="flex h-14 w-14 items-center justify-center rounded-xl text-3xl transition group-hover:scale-110"
                style={{ background: c.tint }}
              >
                {c.icon}
              </span>
              <span className="text-[12px] font-medium text-ink group-hover:text-brand">
                {c.name}
              </span>
            </a>
          ))}
        </div>
      </section>

      <Section title="🔥 Хиты продаж" subtitle="Что покупают чаще всего">
        <ProductGrid products={bestsellers} ctx={ctx} showPartnerButton />
      </Section>

      <Section title="💰 Лучшие скидки" subtitle="Только сегодня — до −30%">
        <ProductGrid products={deals} ctx={ctx} showPartnerButton />
      </Section>

      {newArrivals.length > 0 && (
        <Section title="✨ Новинки">
          <ProductGrid products={newArrivals} ctx={ctx} showPartnerButton />
        </Section>
      )}

      {recentlyViewed.length > 0 && (
        <section className="mt-10">
          <div className="mb-3 flex items-baseline justify-between">
            <div className="flex items-baseline gap-3">
              <h2 className="text-[18px] font-extrabold md:text-[22px]">👀 Вы недавно смотрели</h2>
              <span className="text-[13px] text-ink-2">{recentlyViewed.length} {recentlyViewed.length === 1 ? "товар" : "товаров"}</span>
            </div>
            <button
              type="button"
              onClick={recent.clear}
              className="text-sm text-ink-2 hover:text-discount"
            >
              Очистить
            </button>
          </div>
          <ProductGrid products={recentlyViewed} ctx={ctx} showPartnerButton />
        </section>
      )}

      {news.length > 0 && (
        <section className="mt-10">
          <div className="mb-3 flex items-baseline justify-between">
            <div className="flex items-baseline gap-3">
              <h2 className="text-[18px] font-extrabold md:text-[22px]">📰 Свежие новости</h2>
              <span className="text-[13px] text-ink-2">Подборки и гайды</span>
            </div>
            <a
              href={buildHref({ name: "news" })}
              className="text-sm font-semibold text-brand hover:text-brand-dark"
            >
              Все новости →
            </a>
          </div>
          <div className="grid gap-3 md:grid-cols-3">
            {news.map(n => (
              <a
                key={n.id}
                href={buildHref({ name: "newsArticle", slug: n.slug })}
                className="group flex flex-col overflow-hidden rounded-2xl border border-line bg-white transition hover:-translate-y-0.5 hover:shadow-lg"
              >
                <div className="aspect-[16/9] overflow-hidden bg-paper">
                  <img
                    src={n.cover}
                    alt={n.title}
                    loading="lazy"
                    className="h-full w-full object-cover transition duration-500 group-hover:scale-105"
                  />
                </div>
                <div className="flex flex-1 flex-col gap-1.5 p-3">
                  <div className="flex items-center gap-2 text-[11px] text-ink-2">
                    {n.tag && (
                      <span className="rounded-full bg-brand-light px-2 py-0.5 font-semibold text-brand">
                        {n.tag}
                      </span>
                    )}
                    <time dateTime={n.date}>{formatDate(n.date)}</time>
                  </div>
                  <h3 className="clamp-2 text-[15px] font-bold leading-snug group-hover:text-brand">
                    {n.title}
                  </h3>
                  <p className="clamp-2 text-[12px] text-ink-2">{n.excerpt}</p>
                </div>
              </a>
            ))}
          </div>
        </section>
      )}

      <Section title="Все товары">
        <ProductGrid products={PRODUCTS} ctx={ctx} showPartnerButton />
      </Section>
    </div>
  );

  function HeroCarousel() {
    const [idx, setIdx] = useState(0);
    const timerRef = useRef<number | null>(null);

    useEffect(() => {
      if (banners.length <= 1) return;
      timerRef.current = window.setInterval(() => {
        setIdx(i => (i + 1) % banners.length);
      }, 6500);
      return () => {
        if (timerRef.current) window.clearInterval(timerRef.current);
      };
    }, []);

    if (banners.length === 0) return null;
    const b = banners[idx];

    return (
      <div className="relative overflow-hidden rounded-3xl">
        <div
          className="relative flex min-h-[260px] flex-col justify-center px-5 py-7 text-white md:min-h-[320px] md:px-12 md:py-12"
          style={{ background: b.bg }}
          key={b.id}
        >
          <div className="relative z-10 max-w-[640px] animate-fade-in">
            {b.pill && (
              <div className="mb-2 inline-flex items-center gap-1.5 rounded-full bg-white/15 px-3 py-1 text-[12px] font-medium backdrop-blur">
                {b.pill}
              </div>
            )}
            <h1 className="text-[26px] font-extrabold leading-tight drop-shadow-sm md:text-[40px]">
              {b.title}
            </h1>
            {b.subtitle && (
              <p className="mt-2 text-[14px] text-white/85 md:text-[16px]">{b.subtitle}</p>
            )}
            <a
              href={b.ctaHref}
              className="mt-5 inline-flex h-11 items-center rounded-xl bg-white px-5 text-[14px] font-bold text-ink transition hover:bg-accent md:h-12 md:px-6"
            >
              {b.ctaText} →
            </a>
          </div>

          {b.emoji && (
            <div className="pointer-events-none absolute right-4 top-1/2 hidden -translate-y-1/2 select-none text-[180px] opacity-25 sm:block md:right-12 md:text-[220px]">
              {b.emoji}
            </div>
          )}
          <div className="pointer-events-none absolute -right-12 -top-12 h-56 w-56 rounded-full bg-white/10 blur-2xl" />
          <div className="pointer-events-none absolute -bottom-16 right-20 h-44 w-44 rounded-full bg-white/15 blur-2xl" />
        </div>

        {banners.length > 1 && (
          <>
            <button
              onClick={() => setIdx(i => (i - 1 + banners.length) % banners.length)}
              className="absolute left-2 top-1/2 hidden h-10 w-10 -translate-y-1/2 items-center justify-center rounded-full bg-white/85 text-ink shadow-md transition hover:bg-white md:flex"
              aria-label="Предыдущий баннер"
            >
              ‹
            </button>
            <button
              onClick={() => setIdx(i => (i + 1) % banners.length)}
              className="absolute right-2 top-1/2 hidden h-10 w-10 -translate-y-1/2 items-center justify-center rounded-full bg-white/85 text-ink shadow-md transition hover:bg-white md:flex"
              aria-label="Следующий баннер"
            >
              ›
            </button>
            <div className="absolute bottom-3 left-1/2 flex -translate-x-1/2 gap-1.5">
              {banners.map((_, i) => (
                <button
                  key={i}
                  onClick={() => setIdx(i)}
                  className={`h-1.5 rounded-full transition-all ${
                    i === idx ? "w-7 bg-white" : "w-1.5 bg-white/50 hover:bg-white/80"
                  }`}
                  aria-label={`Баннер ${i + 1}`}
                />
              ))}
            </div>
          </>
        )}
      </div>
    );
  }
}

function Section({
  title,
  subtitle,
  children,
}: {
  title: string;
  subtitle?: string;
  children: React.ReactNode;
}) {
  return (
    <section className="mt-8">
      <div className="mb-3 flex items-baseline gap-3">
        <h2 className="text-[18px] font-extrabold md:text-[22px]">{title}</h2>
        {subtitle && <span className="text-[13px] text-ink-2">{subtitle}</span>}
      </div>
      {children}
    </section>
  );
}
