import { useMemo } from "react";
import { CATEGORIES } from "../data/categories";
import { PRODUCTS } from "../data/products";
import { ProductGrid } from "../components/ProductGrid";
import { buildHref, type ShopCtx } from "../App";
import { discountPct } from "../lib/format";

export function HomePage({ ctx }: { ctx: ShopCtx }) {
  const bestsellers = useMemo(
    () =>
      [...PRODUCTS]
        .filter(p => p.badges?.includes("bestseller"))
        .sort((a, b) => b.reviewCount - a.reviewCount)
        .slice(0, 10),
    [],
  );

  const deals = useMemo(
    () =>
      [...PRODUCTS]
        .filter(p => p.oldPrice)
        .sort((a, b) => discountPct(b.price, b.oldPrice) - discountPct(a.price, a.oldPrice))
        .slice(0, 10),
    [],
  );

  const newArrivals = useMemo(
    () => PRODUCTS.filter(p => p.badges?.includes("new")).slice(0, 8),
    [],
  );

  return (
    <div className="mx-auto max-w-[1320px] px-3 py-4 md:px-4 md:py-6">
      <Hero />

      {/* Category tiles */}
      <section className="mt-5">
        <h2 className="mb-3 text-[18px] font-extrabold md:text-[22px]">Категории</h2>
        <div className="grid grid-cols-3 gap-2 sm:grid-cols-4 md:grid-cols-6 lg:grid-cols-8">
          {CATEGORIES.map(c => (
            <a
              key={c.id}
              href={buildHref({ name: "category", id: c.id })}
              className="group flex flex-col items-center gap-1.5 rounded-2xl bg-white p-3 text-center transition hover:-translate-y-0.5 hover:shadow-md"
            >
              <span
                className="flex h-14 w-14 items-center justify-center rounded-xl text-3xl"
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

      <Section title="Все товары">
        <ProductGrid products={PRODUCTS} ctx={ctx} showPartnerButton />
      </Section>
    </div>
  );
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

function Hero() {
  return (
    <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-brand to-[#1d8bff] px-5 py-7 text-white md:px-10 md:py-12">
      <div className="relative z-10 max-w-[640px]">
        <div className="mb-2 inline-flex items-center gap-1.5 rounded-full bg-white/15 px-3 py-1 text-[12px] font-medium backdrop-blur">
          ⚡ Скидки до 50% уже сейчас
        </div>
        <h1 className="text-[26px] font-extrabold leading-tight md:text-[40px]">
          Yantach Shop —<br />
          умные покупки каждый день
        </h1>
        <p className="mt-2 text-[14px] text-white/85 md:text-[16px]">
          Электроника, одежда, дом, красота, авто и не только. Кнопка{" "}
          <span className="font-semibold">«Купить»</span> ведёт прямо к товару у
          партнёра.
        </p>
      </div>
      {/* Decorative blobs */}
      <div className="pointer-events-none absolute -right-10 -top-10 h-56 w-56 rounded-full bg-white/10 blur-2xl" />
      <div className="pointer-events-none absolute -bottom-16 right-20 h-44 w-44 rounded-full bg-accent/30 blur-2xl" />
    </div>
  );
}
