import { useCatalog } from "../lib/catalog";
import { ProductGrid } from "../components/ProductGrid";
import { buildHref, type ShopCtx } from "../App";

export function FavoritesPage({ ctx }: { ctx: ShopCtx }) {
  const { productById } = useCatalog();
  const products = ctx.favorites
    .map(id => productById.get(id))
    .filter((p): p is NonNullable<typeof p> => !!p);

  return (
    <div className="mx-auto max-w-[1320px] px-3 py-4 md:px-4 md:py-6">
      <h1 className="mb-4 text-[22px] font-extrabold md:text-[28px]">
        Избранное <span className="text-ink-2">· {products.length}</span>
      </h1>
      {products.length === 0 ? (
        <div className="rounded-2xl border border-line bg-white p-10 text-center">
          <div className="mb-3 text-5xl">💝</div>
          <div className="text-lg font-bold">Здесь пока пусто</div>
          <div className="mt-1 text-sm text-ink-2">
            Нажмите ♥ на карточке товара, чтобы добавить в избранное.
          </div>
          <a
            href={buildHref({ name: "home" })}
            className="mt-5 inline-flex h-11 items-center rounded-xl bg-brand px-5 font-semibold text-white hover:bg-brand-dark"
          >
            В каталог
          </a>
        </div>
      ) : (
        <ProductGrid products={products} ctx={ctx} showPartnerButton />
      )}
    </div>
  );
}
