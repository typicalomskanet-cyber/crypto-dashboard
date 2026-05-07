import { useMemo } from "react";
import { useCatalog } from "../lib/catalog";
import { useCompare } from "../lib/preferences";
import { discountPct, formatPrice } from "../lib/format";
import { buildHref, type ShopCtx } from "../App";

const PARTNER_LABEL: Record<string, string> = {
  yandex: "Яндекс.Маркет",
  ozon: "Ozon",
  wildberries: "Wildberries",
  ali: "AliExpress",
  other: "Партнёр",
};

export function ComparePage({ ctx: _ctx }: { ctx: ShopCtx }) {
  void _ctx;
  const { productById, trackClick } = useCatalog();
  const { ids, remove, clear } = useCompare();

  const items = useMemo(
    () => ids.map(id => productById.get(id)).filter((p): p is NonNullable<typeof p> => !!p),
    [ids, productById],
  );

  if (items.length === 0) {
    return (
      <div className="mx-auto max-w-[720px] px-4 py-12 text-center">
        <div className="text-[64px] leading-none">⚖️</div>
        <h1 className="mt-3 text-[26px] font-extrabold">Сравнение пусто</h1>
        <p className="mt-2 text-ink-2">
          Откройте карточку товара и нажмите «В сравнение», чтобы добавить сюда до 4 товаров.
        </p>
        <a
          href={buildHref({ name: "home" })}
          className="mt-6 inline-flex h-11 items-center rounded-xl bg-brand px-5 font-semibold text-white hover:bg-brand-dark"
        >
          На главную
        </a>
      </div>
    );
  }

  // Build the row labels from union of all spec names + a few synthetic rows.
  const specNames = Array.from(
    new Set(items.flatMap(p => p.specs?.map(s => s.name) ?? [])),
  );

  return (
    <div className="mx-auto max-w-[1320px] px-3 py-4 md:px-4 md:py-6">
      <div className="mb-4 flex items-end justify-between gap-3">
        <h1 className="text-[22px] font-extrabold md:text-[28px]">Сравнение товаров</h1>
        <button
          type="button"
          onClick={clear}
          className="rounded-lg border border-line bg-white px-3 py-1.5 text-[12px] text-ink-2 hover:border-discount hover:text-discount"
        >
          Очистить
        </button>
      </div>

      <div className="overflow-x-auto rounded-2xl border border-line bg-white">
        <table className="w-full min-w-[640px] text-[13px]">
          <thead>
            <tr>
              <th className="w-40 bg-paper px-3 py-3 text-left font-semibold text-ink-2"></th>
              {items.map(p => (
                <th key={p.id} className="border-l border-line p-3 align-top">
                  <div className="relative">
                    <button
                      type="button"
                      onClick={() => remove(p.id)}
                      className="absolute right-0 top-0 flex h-6 w-6 items-center justify-center rounded-full bg-paper text-ink-2 hover:bg-discount hover:text-white"
                      aria-label="Убрать из сравнения"
                    >
                      ×
                    </button>
                    <a href={buildHref({ name: "product", id: p.id })}>
                      <img
                        src={p.images[0]}
                        alt=""
                        loading="lazy"
                        className="mx-auto h-32 w-32 rounded-xl object-cover"
                      />
                      <div className="clamp-2 mt-2 text-left text-[13px] font-semibold hover:text-brand">
                        {p.title}
                      </div>
                    </a>
                    <div className="mt-1 text-[11px] text-ink-2">{p.brand}</div>
                  </div>
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-line">
            <CompareRow label="Цена">
              {items.map(p => {
                const off = discountPct(p.price, p.oldPrice);
                return (
                  <td key={p.id} className="border-l border-line px-3 py-3 align-top">
                    <div className="text-[18px] font-extrabold leading-tight">{formatPrice(p.price)}</div>
                    {p.oldPrice && (
                      <div className="text-[11px] text-ink-2 line-through">{formatPrice(p.oldPrice)}</div>
                    )}
                    {off > 0 && (
                      <div className="mt-0.5 inline-flex rounded bg-discount/10 px-1.5 py-0.5 text-[10px] font-bold text-discount">
                        −{off}%
                      </div>
                    )}
                  </td>
                );
              })}
            </CompareRow>

            <CompareRow label="Рейтинг">
              {items.map(p => (
                <td key={p.id} className="border-l border-line px-3 py-3 align-top">
                  <div className="flex items-center gap-1 text-accent-dark">
                    ★ <span className="font-semibold text-ink">{p.rating.toFixed(1)}</span>
                  </div>
                  <div className="text-[11px] text-ink-2">{p.reviewCount} отзывов</div>
                </td>
              ))}
            </CompareRow>

            <CompareRow label="Партнёр">
              {items.map(p => (
                <td key={p.id} className="border-l border-line px-3 py-3 align-top">
                  {PARTNER_LABEL[p.partner] ?? "Партнёр"}
                </td>
              ))}
            </CompareRow>

            <CompareRow label="Наличие">
              {items.map(p => (
                <td key={p.id} className="border-l border-line px-3 py-3 align-top text-ink-2">
                  {p.stock}
                </td>
              ))}
            </CompareRow>

            {specNames.map(name => (
              <CompareRow key={name} label={name}>
                {items.map(p => {
                  const v = p.specs?.find(s => s.name === name)?.value;
                  return (
                    <td key={p.id} className="border-l border-line px-3 py-3 align-top">
                      {v ?? <span className="text-ink-2">—</span>}
                    </td>
                  );
                })}
              </CompareRow>
            ))}

            <CompareRow label="">
              {items.map(p => (
                <td key={p.id} className="border-l border-line px-3 py-3 align-top">
                  <a
                    href={p.partnerUrl}
                    target="_blank"
                    rel="noopener noreferrer sponsored"
                    onClick={() => trackClick(p.id)}
                    className="flex h-10 items-center justify-center gap-1.5 rounded-xl bg-accent text-[13px] font-bold text-ink hover:bg-accent-dark"
                  >
                    Купить
                  </a>
                </td>
              ))}
            </CompareRow>
          </tbody>
        </table>
      </div>
    </div>
  );
}

function CompareRow({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <tr>
      <td className="bg-paper px-3 py-3 align-top text-[12px] font-semibold uppercase tracking-wide text-ink-2">
        {label}
      </td>
      {children}
    </tr>
  );
}
