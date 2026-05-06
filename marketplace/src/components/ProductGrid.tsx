import type { Product } from "../data/types";
import type { ShopCtx } from "../App";
import { ProductCard } from "./ProductCard";

interface Props {
  products: Product[];
  ctx: ShopCtx;
  showPartnerButton?: boolean;
}

export function ProductGrid({ products, ctx, showPartnerButton }: Props) {
  if (products.length === 0) {
    return (
      <div className="rounded-2xl border border-line bg-white px-6 py-12 text-center text-ink-2">
        По вашему запросу ничего не найдено
      </div>
    );
  }
  return (
    <div className="grid grid-cols-2 gap-3 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
      {products.map(p => (
        <ProductCard
          key={p.id}
          product={p}
          isFavorite={ctx.isFavorite(p.id)}
          onToggleFavorite={ctx.toggleFavorite}
          onAddToCart={ctx.addToCart}
          showPartnerButton={showPartnerButton}
        />
      ))}
    </div>
  );
}
