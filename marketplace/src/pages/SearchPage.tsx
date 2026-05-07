import { useSearchProducts } from "../lib/catalog";
import { ProductGrid } from "../components/ProductGrid";
import type { ShopCtx } from "../App";

export function SearchPage({ q, ctx }: { q: string; ctx: ShopCtx }) {
  const results = useSearchProducts(q);
  return (
    <div className="mx-auto max-w-[1320px] px-3 py-4 md:px-4 md:py-6">
      <h1 className="mb-1 text-[20px] font-extrabold md:text-[24px]">
        Результаты поиска
      </h1>
      <div className="mb-4 text-sm text-ink-2">
        По запросу «<span className="text-ink">{q}</span>» найдено {results.length}
      </div>
      <ProductGrid products={results} ctx={ctx} showPartnerButton />
    </div>
  );
}
