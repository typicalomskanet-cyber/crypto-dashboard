import { useState } from "react";
import { useCatalog } from "../lib/catalog";
import { formatPrice } from "../lib/format";
import { buildHref, type ShopCtx } from "../App";

const PARTNER_LABEL: Record<string, string> = {
  yandex: "Яндекс.Маркет",
  ozon: "Ozon",
  wildberries: "Wildberries",
  ali: "AliExpress",
  other: "Партнёр",
};

export function CartPage({ ctx }: { ctx: ShopCtx }) {
  const { productById, trackClick } = useCatalog();
  const [popupBlocked, setPopupBlocked] = useState(false);
  const items = ctx.cart
    .map(c => ({ c, p: productById.get(c.productId) }))
    .filter((row): row is { c: typeof row.c; p: NonNullable<typeof row.p> } => !!row.p);

  // Open one tab per unique partner URL in the cart so the user lands on the
  // correct affiliate page for every distinct product link they're checking out.
  const checkoutLinks = Array.from(
    new Map(items.map(({ p }) => [p.partnerUrl, p])).values(),
  );

  function handleCheckout() {
    setPopupBlocked(false);
    let blocked = 0;
    for (const p of checkoutLinks) {
      trackClick(p.id);
      const win = window.open(p.partnerUrl, "_blank", "noopener,noreferrer");
      if (!win) blocked++;
    }
    if (blocked > 0) setPopupBlocked(true);
  }

  const total = items.reduce((sum, { c, p }) => sum + c.qty * p.price, 0);
  const oldTotal = items.reduce(
    (sum, { c, p }) => sum + c.qty * (p.oldPrice ?? p.price),
    0,
  );

  if (items.length === 0) {
    return (
      <div className="mx-auto max-w-[800px] px-4 py-10">
        <div className="rounded-2xl border border-line bg-white p-10 text-center">
          <div className="mb-3 text-5xl">🛒</div>
          <div className="text-lg font-bold">Корзина пуста</div>
          <div className="mt-1 text-sm text-ink-2">
            Добавьте товары из каталога — потом одной кнопкой перейдёте к покупке.
          </div>
          <a
            href={buildHref({ name: "home" })}
            className="mt-5 inline-flex h-11 items-center rounded-xl bg-brand px-5 font-semibold text-white hover:bg-brand-dark"
          >
            В каталог
          </a>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-[1320px] px-3 py-4 md:px-4 md:py-6">
      <h1 className="mb-4 text-[22px] font-extrabold md:text-[28px]">
        Корзина <span className="text-ink-2">· {items.length}</span>
      </h1>

      <div className="grid gap-4 lg:grid-cols-[1fr_360px]">
        <div className="space-y-3">
          {items.map(({ c, p }) => (
            <div
              key={p.id}
              className="flex gap-3 rounded-2xl border border-line bg-white p-3 md:p-4"
            >
              <a
                href={buildHref({ name: "product", id: p.id })}
                className="block aspect-square w-24 shrink-0 overflow-hidden rounded-lg bg-paper md:w-32"
              >
                <img src={p.images[0]} alt="" className="h-full w-full object-cover" />
              </a>
              <div className="flex min-w-0 flex-1 flex-col">
                <a
                  href={buildHref({ name: "product", id: p.id })}
                  className="clamp-2 text-[14px] font-medium hover:text-brand"
                >
                  {p.title}
                </a>
                <div className="mt-1 text-[12px] text-ink-2">{p.brand}</div>

                <div className="mt-auto flex flex-wrap items-center gap-3 pt-2">
                  <Stepper
                    qty={c.qty}
                    onPlus={() => ctx.setQty(p.id, c.qty + 1)}
                    onMinus={() => ctx.setQty(p.id, c.qty - 1)}
                  />
                  <button
                    onClick={() => ctx.removeFromCart(p.id)}
                    className="text-[12px] text-ink-2 hover:text-discount"
                  >
                    Удалить
                  </button>
                  <div className="ml-auto text-right">
                    <div className="text-[16px] font-extrabold">
                      {formatPrice(p.price * c.qty)}
                    </div>
                    {p.oldPrice && (
                      <div className="text-[11px] text-ink-2 line-through">
                        {formatPrice(p.oldPrice * c.qty)}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>

        <aside className="self-start rounded-2xl border border-line bg-white p-4 lg:sticky lg:top-24">
          <h3 className="mb-3 text-base font-bold">Итого</h3>
          <Row label={`Товары · ${items.reduce((a, x) => a + x.c.qty, 0)} шт`}>
            {formatPrice(total)}
          </Row>
          {oldTotal > total && (
            <Row label="Скидка">
              <span className="text-discount">−{formatPrice(oldTotal - total)}</span>
            </Row>
          )}
          <div className="my-3 border-t border-line" />
          <Row label="К оплате" big>
            {formatPrice(total)}
          </Row>

          <button
            type="button"
            onClick={handleCheckout}
            className="mt-4 flex h-12 w-full items-center justify-center gap-2 rounded-xl bg-accent font-bold text-ink hover:bg-accent-dark"
          >
            Оформить заказ
            <span className="rounded-md bg-ink/10 px-1.5 py-0.5 text-[11px] font-bold">
              {checkoutLinks.length} {checkoutLinks.length === 1 ? "ссылка" : "ссыл."}
            </span>
          </button>

          <p className="mt-2 text-[11px] leading-relaxed text-ink-2">
            При нажатии откроется {checkoutLinks.length === 1 ? "вкладка" : `${checkoutLinks.length} вкладок`} с сайтами партнёров — там завершите покупку.
          </p>

          {popupBlocked && (
            <div className="mt-3 rounded-lg bg-discount/10 p-2 text-[12px] text-discount">
              Браузер заблокировал часть всплывающих окон. Разрешите всплывающие окна для этого сайта или открывайте партнёров вручную из списка ниже.
            </div>
          )}

          {checkoutLinks.length > 1 && (
            <div className="mt-3 space-y-1.5">
              <div className="text-[11px] font-semibold uppercase tracking-wide text-ink-2">
                Ссылки на партнёров
              </div>
              {checkoutLinks.map(p => (
                <a
                  key={p.partnerUrl}
                  href={p.partnerUrl}
                  target="_blank"
                  rel="noopener noreferrer sponsored"
                  onClick={() => trackClick(p.id)}
                  className="flex items-center gap-2 rounded-lg border border-line bg-paper px-2 py-1.5 text-[12px] hover:border-brand hover:bg-brand-light"
                >
                  <img src={p.images[0]} alt="" className="h-7 w-7 shrink-0 rounded object-cover" />
                  <span className="clamp-1 flex-1">{p.title}</span>
                  <span className="shrink-0 text-[10px] text-ink-2">{PARTNER_LABEL[p.partner]} ↗</span>
                </a>
              ))}
            </div>
          )}

          <button
            onClick={ctx.clearCart}
            className="mt-3 flex h-10 w-full items-center justify-center text-sm text-ink-2 hover:text-discount"
          >
            Очистить корзину
          </button>
        </aside>
      </div>
    </div>
  );
}

function Stepper(props: { qty: number; onPlus(): void; onMinus(): void }) {
  return (
    <div className="flex h-9 items-center rounded-lg border border-line bg-white">
      <button
        onClick={props.onMinus}
        className="flex h-full w-9 items-center justify-center text-lg text-ink-2 hover:text-ink"
        aria-label="Меньше"
      >
        −
      </button>
      <span className="w-8 text-center text-sm font-semibold">{props.qty}</span>
      <button
        onClick={props.onPlus}
        className="flex h-full w-9 items-center justify-center text-lg text-ink-2 hover:text-ink"
        aria-label="Больше"
      >
        +
      </button>
    </div>
  );
}

function Row({
  label,
  children,
  big,
}: {
  label: string;
  children: React.ReactNode;
  big?: boolean;
}) {
  return (
    <div className={`flex items-baseline justify-between ${big ? "text-[18px] font-extrabold" : "text-[14px]"}`}>
      <span className={big ? "text-ink" : "text-ink-2"}>{label}</span>
      <span>{children}</span>
    </div>
  );
}
