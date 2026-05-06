import type { Product } from "../data/types";
import { useCatalog } from "../lib/catalog";
import { discountPct, formatPrice } from "../lib/format";
import { buildHref } from "../App";

interface Props {
  product: Product;
  isFavorite: boolean;
  onToggleFavorite(id: string): void;
  onAddToCart(id: string): void;
  /** Show the affiliate "Купить у партнёра" button at the bottom of the card.
   *  Always rendered as the primary visible CTA on the home/category grid. */
  showPartnerButton?: boolean;
}

const PARTNER_LABEL: Record<Product["partner"], string> = {
  yandex: "Купить на Яндекс.Маркет",
  ozon: "Купить на Ozon",
  wildberries: "Купить на WB",
  ali: "Купить на AliExpress",
  other: "Купить",
};

export function ProductCard(props: Props) {
  const { product: p, isFavorite, onToggleFavorite, onAddToCart, showPartnerButton } = props;
  const { trackClick } = useCatalog();
  const off = discountPct(p.price, p.oldPrice);

  return (
    <article className="group relative flex flex-col overflow-hidden rounded-2xl border border-line bg-white transition hover:shadow-lg">
      {off > 0 && (
        <span className="absolute left-2 top-2 z-10 rounded-md bg-discount px-1.5 py-0.5 text-[11px] font-bold text-white">
          −{off}%
        </span>
      )}

      <button
        type="button"
        onClick={e => {
          e.preventDefault();
          onToggleFavorite(p.id);
        }}
        className="absolute right-2 top-2 z-10 flex h-9 w-9 items-center justify-center rounded-full bg-white/90 shadow-sm transition hover:bg-white"
        aria-label={isFavorite ? "Удалить из избранного" : "В избранное"}
      >
        <svg width="20" height="20" viewBox="0 0 24 24">
          <path
            d="M12 21s-7-4.35-7-10a4.5 4.5 0 018-2.8A4.5 4.5 0 0119 11c0 5.65-7 10-7 10z"
            fill={isFavorite ? "var(--color-discount)" : "none"}
            stroke={isFavorite ? "var(--color-discount)" : "#6a6f80"}
            strokeWidth="1.6"
            strokeLinejoin="round"
          />
        </svg>
      </button>

      <a
        href={buildHref({ name: "product", id: p.id })}
        className="block aspect-square overflow-hidden bg-paper"
      >
        <img
          src={p.images[0]}
          alt={p.title}
          loading="lazy"
          className="h-full w-full object-cover transition duration-500 group-hover:scale-105"
        />
      </a>

      <div className="flex flex-1 flex-col gap-2 p-3">
        <div className="flex items-baseline gap-2">
          <span className="text-[20px] font-extrabold leading-none">
            {formatPrice(p.price)}
          </span>
          {p.oldPrice && (
            <span className="text-[12px] text-ink-2 line-through">
              {formatPrice(p.oldPrice)}
            </span>
          )}
        </div>

        <a
          href={buildHref({ name: "product", id: p.id })}
          className="clamp-2 text-[13px] leading-snug hover:text-brand"
        >
          {p.title}
        </a>

        <div className="flex items-center gap-2 text-[12px] text-ink-2">
          <span className="flex items-center gap-0.5 text-accent-dark">
            <Star /> <span className="font-semibold text-ink">{p.rating.toFixed(1)}</span>
          </span>
          <span>· {p.reviewCount} отзыв{declRev(p.reviewCount)}</span>
        </div>

        {p.badges && p.badges.length > 0 && (
          <div className="flex flex-wrap gap-1">
            {p.badges.includes("freeShip") && <Tag>🚚 Бесплатная доставка</Tag>}
            {p.badges.includes("express") && <Tag>⚡ Экспресс</Tag>}
            {p.badges.includes("bestseller") && <Tag>🔥 Хит продаж</Tag>}
            {p.badges.includes("new") && <Tag>✨ Новинка</Tag>}
          </div>
        )}

        <div className="mt-auto flex flex-col gap-1.5 pt-1">
          {showPartnerButton && (
            <a
              href={p.partnerUrl}
              target="_blank"
              rel="noopener noreferrer sponsored"
              onClick={() => trackClick(p.id)}
              className="flex h-10 items-center justify-center gap-1.5 rounded-xl bg-accent text-[13px] font-semibold text-ink transition hover:bg-accent-dark"
            >
              {PARTNER_LABEL[p.partner]}
              <ExtIcon />
            </a>
          )}
          <button
            type="button"
            onClick={() => onAddToCart(p.id)}
            className="flex h-10 items-center justify-center rounded-xl border border-brand bg-white text-[13px] font-semibold text-brand transition hover:bg-brand-light"
          >
            В корзину
          </button>
        </div>
      </div>
    </article>
  );
}

function Tag({ children }: { children: React.ReactNode }) {
  return (
    <span className="rounded-md bg-paper px-1.5 py-0.5 text-[10px] text-ink-2">
      {children}
    </span>
  );
}
function Star() {
  return (
    <svg width="12" height="12" viewBox="0 0 16 16" fill="currentColor">
      <path d="M8 1.5l1.95 4.27L14.5 6.5l-3.5 3.05.95 4.95L8 11.95l-3.95 2.55.95-4.95L1.5 6.5l4.55-.73L8 1.5z" />
    </svg>
  );
}
function ExtIcon() {
  return (
    <svg width="12" height="12" viewBox="0 0 16 16" fill="none" aria-hidden="true">
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

function declRev(n: number): string {
  const n10 = n % 10;
  const n100 = n % 100;
  if (n10 === 1 && n100 !== 11) return "";
  if (n10 >= 2 && n10 <= 4 && (n100 < 12 || n100 > 14)) return "а";
  return "ов";
}
