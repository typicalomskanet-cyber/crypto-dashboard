import { useEffect, useState } from "react";
import { useCatalog } from "../lib/catalog";

const DISMISS_KEY = "yantach.promoStrip.dismissed.v1";

/** Top-of-page strip that surfaces the most prominent active promo code. */
export function PromoStrip() {
  const { promos } = useCatalog();
  const [dismissed, setDismissed] = useState(false);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    try {
      setDismissed(localStorage.getItem(DISMISS_KEY) === "1");
    } catch {
      /* ignore */
    }
  }, []);

  const featured = promos.find(p => p.featured && p.active) ?? promos.find(p => p.active);
  if (!featured || dismissed) return null;

  function copy() {
    if (!featured) return;
    navigator.clipboard?.writeText(featured.code).catch(() => {});
    setCopied(true);
    setTimeout(() => setCopied(false), 1600);
  }

  function close() {
    try {
      localStorage.setItem(DISMISS_KEY, "1");
    } catch {
      /* ignore */
    }
    setDismissed(true);
  }

  return (
    <div
      className="relative w-full text-white"
      style={{ background: "linear-gradient(90deg, #ff3a3a 0%, #d62b8c 50%, #6b2bd6 100%)" }}
      role="region"
      aria-label="Промокод"
    >
      <div className="mx-auto flex max-w-[1320px] items-center gap-2 px-3 py-2 text-[12px] md:gap-4 md:text-[13px]">
        <span className="text-base md:text-lg">🎁</span>
        <span className="hidden md:inline font-semibold">Промокод:</span>
        <button
          type="button"
          onClick={copy}
          className="flex items-center gap-1.5 rounded-md bg-white/15 px-2 py-1 font-mono text-[12px] font-bold tracking-wider backdrop-blur transition hover:bg-white/25"
          aria-label={`Копировать промокод ${featured.code}`}
        >
          {featured.code}
          <span className="hidden text-[10px] opacity-80 sm:inline">{copied ? "скопировано" : "копир."}</span>
        </button>
        <span className="clamp-1 flex-1">
          {featured.description}
        </span>
        <button
          type="button"
          onClick={close}
          className="ml-auto flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-white/15 text-[14px] leading-none transition hover:bg-white/25"
          aria-label="Закрыть"
        >
          ×
        </button>
      </div>
    </div>
  );
}
