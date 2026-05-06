import { useEffect, useMemo, useRef, useState } from "react";
import { CATEGORIES } from "../data/categories";
import { searchProducts } from "../data/products";
import { buildHref, navigate, type Route } from "../App";
import { formatPrice } from "../lib/format";
import { Logo } from "./Logo";

interface HeaderProps {
  cartCount: number;
  favoriteCount: number;
  currentRoute: Route;
}

export function Header({ cartCount, favoriteCount, currentRoute }: HeaderProps) {
  const [search, setSearch] = useState("");
  const [showCats, setShowCats] = useState(false);
  const [showSuggest, setShowSuggest] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  // Sync search input with current route when on a search page (browser back).
  useEffect(() => {
    if (currentRoute.name === "search") setSearch(currentRoute.q);
  }, [currentRoute]);

  const suggestions = useMemo(
    () => (search.trim().length >= 2 ? searchProducts(search).slice(0, 6) : []),
    [search],
  );

  function submitSearch(e: React.FormEvent) {
    e.preventDefault();
    const q = search.trim();
    if (!q) return;
    setShowSuggest(false);
    navigate({ name: "search", q });
  }

  return (
    <header className="sticky top-0 z-30 border-b border-line bg-white shadow-[0_2px_10px_rgba(15,30,80,0.06)]">
      {/* Top bar */}
      <div className="mx-auto flex max-w-[1320px] items-center gap-3 px-4 py-3 lg:gap-5">
        <a
          href={buildHref({ name: "home" })}
          className="shrink-0"
          aria-label="Yantach Shop — на главную"
        >
          <Logo />
        </a>

        <button
          type="button"
          onClick={() => setShowCats(s => !s)}
          className="hidden h-11 shrink-0 items-center gap-2 rounded-xl bg-brand px-4 text-white transition hover:bg-brand-dark md:flex"
          aria-expanded={showCats}
        >
          <BurgerIcon />
          <span className="font-semibold">Каталог</span>
        </button>

        <form
          onSubmit={submitSearch}
          className="relative flex h-11 flex-1 items-center"
          role="search"
        >
          <input
            ref={inputRef}
            type="search"
            value={search}
            onChange={e => {
              setSearch(e.target.value);
              setShowSuggest(true);
            }}
            onFocus={() => setShowSuggest(true)}
            onBlur={() => setTimeout(() => setShowSuggest(false), 120)}
            placeholder="Поиск товаров и брендов"
            className="h-full w-full rounded-xl border border-line bg-paper pl-4 pr-24 text-[15px] outline-none transition focus:border-brand focus:bg-white focus:ring-2 focus:ring-brand-light"
            aria-label="Поиск"
          />
          <button
            type="submit"
            className="absolute right-1 top-1 flex h-9 items-center gap-2 rounded-lg bg-accent px-4 font-semibold text-ink transition hover:bg-accent-dark"
          >
            <SearchIcon />
            <span className="hidden sm:inline">Найти</span>
          </button>

          {showSuggest && suggestions.length > 0 && (
            <div className="absolute left-0 right-0 top-full mt-2 overflow-hidden rounded-xl border border-line bg-white shadow-xl">
              {suggestions.map(p => (
                <a
                  key={p.id}
                  href={buildHref({ name: "product", id: p.id })}
                  onMouseDown={e => e.preventDefault()}
                  className="flex items-center gap-3 px-4 py-2 hover:bg-paper"
                >
                  <img
                    src={p.images[0]}
                    alt=""
                    loading="lazy"
                    className="h-10 w-10 rounded object-cover"
                  />
                  <div className="min-w-0 flex-1">
                    <div className="clamp-1 text-sm">{p.title}</div>
                    <div className="text-xs text-ink-2">{p.brand}</div>
                  </div>
                  <div className="text-sm font-semibold">{formatPrice(p.price)}</div>
                </a>
              ))}
            </div>
          )}
        </form>

        <nav className="ml-auto hidden items-center gap-2 sm:flex">
          <NavBtn
            icon={<HeartIcon />}
            label="Избранное"
            badge={favoriteCount}
            href={buildHref({ name: "favorites" })}
          />
          <NavBtn
            icon={<CartIcon />}
            label="Корзина"
            badge={cartCount}
            href={buildHref({ name: "cart" })}
          />
        </nav>

        {/* Mobile-only icons (search button is always visible inside the form) */}
        <nav className="ml-auto flex items-center gap-1 sm:hidden">
          <a
            href={buildHref({ name: "favorites" })}
            className="relative flex h-11 w-11 items-center justify-center rounded-xl text-ink-2 hover:text-ink"
            aria-label="Избранное"
          >
            <HeartIcon />
            {favoriteCount > 0 && <Badge>{favoriteCount}</Badge>}
          </a>
          <a
            href={buildHref({ name: "cart" })}
            className="relative flex h-11 w-11 items-center justify-center rounded-xl text-ink-2 hover:text-ink"
            aria-label="Корзина"
          >
            <CartIcon />
            {cartCount > 0 && <Badge>{cartCount}</Badge>}
          </a>
        </nav>
      </div>

      {/* Category strip — desktop only */}
      <div className="hidden border-t border-line bg-white md:block">
        <div className="scroll-x mx-auto flex max-w-[1320px] items-center gap-1 overflow-x-auto px-4 py-2 text-[13px] text-ink-2">
          {CATEGORIES.slice(0, 9).map(c => (
            <a
              key={c.id}
              href={buildHref({ name: "category", id: c.id })}
              className="whitespace-nowrap rounded-lg px-3 py-1.5 hover:bg-paper hover:text-ink"
            >
              <span className="mr-1">{c.icon}</span>
              {c.name}
            </a>
          ))}
        </div>
      </div>

      {/* Mobile categories drawer */}
      {showCats && (
        <div className="border-t border-line bg-white md:hidden">
          <div className="grid grid-cols-2 gap-2 p-3">
            {CATEGORIES.map(c => (
              <a
                key={c.id}
                href={buildHref({ name: "category", id: c.id })}
                onClick={() => setShowCats(false)}
                className="flex items-center gap-2 rounded-xl border border-line bg-paper px-3 py-2.5 text-sm hover:border-brand hover:bg-brand-light"
              >
                <span className="text-xl">{c.icon}</span>
                <span className="font-medium">{c.name}</span>
              </a>
            ))}
          </div>
        </div>
      )}

      {/* Desktop mega-menu (toggle from "Каталог") */}
      {showCats && (
        <div className="hidden border-t border-line bg-white shadow-lg md:block">
          <div className="mx-auto grid max-w-[1320px] grid-cols-3 gap-3 px-4 py-4 lg:grid-cols-4">
            {CATEGORIES.map(c => (
              <a
                key={c.id}
                href={buildHref({ name: "category", id: c.id })}
                onClick={() => setShowCats(false)}
                className="flex items-center gap-3 rounded-xl border border-line bg-paper p-3 transition hover:border-brand hover:bg-brand-light"
              >
                <span
                  className="flex h-12 w-12 items-center justify-center rounded-xl text-2xl"
                  style={{ background: c.tint }}
                >
                  {c.icon}
                </span>
                <div className="min-w-0">
                  <div className="font-semibold">{c.name}</div>
                  <div className="clamp-1 text-xs text-ink-2">{c.tagline}</div>
                </div>
              </a>
            ))}
          </div>
        </div>
      )}

      {/* Bottom-tab nav for mobile (sticks to bottom of viewport, not header) */}
    </header>
  );
}

function NavBtn(props: {
  icon: React.ReactNode;
  label: string;
  badge?: number;
  href: string;
}) {
  return (
    <a
      href={props.href}
      className="relative flex h-11 items-center gap-2 rounded-xl px-3 text-sm text-ink-2 hover:bg-paper hover:text-ink"
    >
      <span className="relative">
        {props.icon}
        {!!props.badge && <Badge>{props.badge}</Badge>}
      </span>
      <span className="hidden lg:inline">{props.label}</span>
    </a>
  );
}

function Badge({ children }: { children: React.ReactNode }) {
  return (
    <span className="absolute -right-1.5 -top-1.5 flex h-[18px] min-w-[18px] items-center justify-center rounded-full bg-discount px-1 text-[10px] font-bold text-white">
      {children}
    </span>
  );
}

function BurgerIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
      <rect x="3" y="4" width="14" height="2" rx="1" fill="currentColor" />
      <rect x="3" y="9" width="14" height="2" rx="1" fill="currentColor" />
      <rect x="3" y="14" width="14" height="2" rx="1" fill="currentColor" />
    </svg>
  );
}
function SearchIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 20 20" fill="none">
      <circle cx="9" cy="9" r="6" stroke="currentColor" strokeWidth="2" />
      <path d="M14 14l4 4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
    </svg>
  );
}
function HeartIcon() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
      <path
        d="M12 21s-7-4.35-7-10a4.5 4.5 0 018-2.8A4.5 4.5 0 0119 11c0 5.65-7 10-7 10z"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinejoin="round"
      />
    </svg>
  );
}
function CartIcon() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
      <path
        d="M4 5h2.5l2.4 11.4a1 1 0 001 .8h7.4a1 1 0 001-.78L20 8H7"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <circle cx="9.5" cy="20" r="1.5" fill="currentColor" />
      <circle cx="17" cy="20" r="1.5" fill="currentColor" />
    </svg>
  );
}
