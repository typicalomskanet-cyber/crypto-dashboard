import { useCatalog } from "../lib/catalog";
import { useCompare } from "../lib/preferences";
import { buildHref } from "../App";

/** Floating "X products to compare" pill at the bottom-left when list non-empty. */
export function CompareBar() {
  const { productById } = useCatalog();
  const { ids, clear, limit } = useCompare();
  if (ids.length === 0) return null;

  const items = ids.map(id => productById.get(id)).filter((p): p is NonNullable<typeof p> => !!p);
  if (items.length === 0) return null;

  return (
    <div className="pointer-events-none fixed inset-x-0 bottom-3 z-30 flex justify-center px-3 md:bottom-4">
      <div className="pointer-events-auto flex items-center gap-2 rounded-2xl border border-line bg-white p-2 shadow-2xl">
        <div className="flex -space-x-2">
          {items.slice(0, 4).map(p => (
            <img
              key={p.id}
              src={p.images[0]}
              alt=""
              loading="lazy"
              className="h-8 w-8 rounded-lg border-2 border-white object-cover"
            />
          ))}
        </div>
        <div className="text-[12px] leading-tight">
          <div className="font-bold">{items.length} в сравнении</div>
          <div className="text-[11px] text-ink-2">Максимум {limit} товара</div>
        </div>
        <a
          href={buildHref({ name: "compare" })}
          className="ml-2 flex h-9 items-center rounded-lg bg-brand px-3 text-[12px] font-bold text-white hover:bg-brand-dark"
        >
          Сравнить
        </a>
        <button
          type="button"
          onClick={clear}
          className="flex h-9 w-9 items-center justify-center rounded-lg text-[16px] text-ink-2 hover:bg-paper hover:text-discount"
          aria-label="Очистить сравнение"
        >
          ×
        </button>
      </div>
    </div>
  );
}
