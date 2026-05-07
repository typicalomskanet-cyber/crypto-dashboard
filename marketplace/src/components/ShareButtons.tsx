import { useState } from "react";
import type { Product } from "../data/types";

interface Props {
  product: Product;
}

/** Native Share API + per-platform share links. */
export function ShareButtons({ product }: Props) {
  const [copied, setCopied] = useState(false);
  const url = typeof window !== "undefined"
    ? `${window.location.origin}${window.location.pathname}#/p/${product.id}`
    : "";
  const text = `${product.title} — ${product.brand}`;

  function copy() {
    if (!navigator.clipboard) return;
    navigator.clipboard.writeText(url).then(
      () => {
        setCopied(true);
        setTimeout(() => setCopied(false), 1600);
      },
      () => {},
    );
  }

  async function nativeShare() {
    try {
      if (navigator.share) {
        await navigator.share({ title: product.title, text, url });
      } else {
        copy();
      }
    } catch {
      /* user cancelled */
    }
  }

  const enc = encodeURIComponent;
  const tg = `https://t.me/share/url?url=${enc(url)}&text=${enc(text)}`;
  const wa = `https://wa.me/?text=${enc(text + " " + url)}`;
  const vk = `https://vk.com/share.php?url=${enc(url)}&title=${enc(product.title)}`;

  return (
    <div className="rounded-2xl border border-line bg-white p-4">
      <div className="mb-2 text-[12px] font-semibold uppercase tracking-wide text-ink-2">
        Поделиться
      </div>
      <div className="flex flex-wrap gap-1.5">
        <ShareBtn href={tg} label="Telegram" bg="#229ED9" />
        <ShareBtn href={wa} label="WhatsApp" bg="#25D366" />
        <ShareBtn href={vk} label="ВКонтакте" bg="#0077FF" />
        <button
          type="button"
          onClick={copy}
          className="flex h-9 items-center gap-1.5 rounded-lg border border-line bg-white px-3 text-[12px] font-semibold text-ink hover:border-brand hover:text-brand"
        >
          {copied ? "✓ Скопировано" : "🔗 Копировать"}
        </button>
        {typeof navigator !== "undefined" && "share" in navigator && (
          <button
            type="button"
            onClick={nativeShare}
            className="flex h-9 items-center gap-1.5 rounded-lg border border-line bg-white px-3 text-[12px] font-semibold text-ink hover:border-brand hover:text-brand"
          >
            ↗ Ещё
          </button>
        )}
      </div>
    </div>
  );
}

function ShareBtn({ href, label, bg }: { href: string; label: string; bg: string }) {
  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      className="flex h-9 items-center rounded-lg px-3 text-[12px] font-semibold text-white transition hover:opacity-90"
      style={{ background: bg }}
    >
      {label}
    </a>
  );
}
