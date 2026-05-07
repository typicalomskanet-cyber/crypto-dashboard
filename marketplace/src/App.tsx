import { Suspense, lazy, useEffect, useMemo, useState } from "react";
import { Header } from "./components/Header";
import { Footer } from "./components/Footer";
import { HomePage } from "./pages/HomePage";
import { CategoryPage } from "./pages/CategoryPage";
import { ProductPage } from "./pages/ProductPage";
import { CartPage } from "./pages/CartPage";
import { FavoritesPage } from "./pages/FavoritesPage";
import { SearchPage } from "./pages/SearchPage";
import { NewsListPage } from "./pages/NewsListPage";
import { NewsArticlePage } from "./pages/NewsArticlePage";
import { NotFoundPage } from "./pages/NotFoundPage";
import { PwaInstallPrompt } from "./components/PwaInstallPrompt";
import { PromoStrip } from "./components/PromoStrip";
import { CompareBar } from "./components/CompareBar";
import { useLocalState } from "./lib/storage";

const AdminApp = lazy(() =>
  import("./admin/AdminApp").then(m => ({ default: m.AdminApp })),
);

/** A simple hash-based route shape; keeps SPA & PWA-static-host friendly. */
export type Route =
  | { name: "home" }
  | { name: "category"; id: string }
  | { name: "product"; id: string }
  | { name: "search"; q: string }
  | { name: "cart" }
  | { name: "favorites" }
  | { name: "news" }
  | { name: "newsArticle"; slug: string }
  | { name: "admin"; tab?: string }
  | { name: "compare" }
  | { name: "notFound" };

function parseHash(hash: string): Route {
  const h = hash.replace(/^#/, "");
  if (!h || h === "/") return { name: "home" };
  const parts = h.split("/").filter(Boolean);
  if (parts[0] === "c" && parts[1]) return { name: "category", id: parts[1] };
  if (parts[0] === "p" && parts[1]) return { name: "product", id: parts[1] };
  if (parts[0] === "search") {
    return { name: "search", q: decodeURIComponent(parts.slice(1).join("/")) };
  }
  if (parts[0] === "cart") return { name: "cart" };
  if (parts[0] === "favorites") return { name: "favorites" };
  if (parts[0] === "news") {
    return parts[1]
      ? { name: "newsArticle", slug: decodeURIComponent(parts[1]) }
      : { name: "news" };
  }
  if (parts[0] === "admin") return { name: "admin", tab: parts[1] };
  if (parts[0] === "compare") return { name: "compare" };
  return { name: "notFound" };
}

export function buildHref(r: Route): string {
  switch (r.name) {
    case "home": return "#/";
    case "category": return `#/c/${r.id}`;
    case "product": return `#/p/${r.id}`;
    case "search": return `#/search/${encodeURIComponent(r.q)}`;
    case "cart": return "#/cart";
    case "favorites": return "#/favorites";
    case "news": return "#/news";
    case "newsArticle": return `#/news/${encodeURIComponent(r.slug)}`;
    case "admin": return r.tab ? `#/admin/${r.tab}` : "#/admin";
    case "compare": return "#/compare";
    case "notFound": return "#/404";
  }
}

export function navigate(r: Route) {
  window.location.hash = buildHref(r).slice(1);
  window.scrollTo({ top: 0, behavior: "instant" as ScrollBehavior });
}

export interface CartItem {
  productId: string;
  qty: number;
}

export function App() {
  const [route, setRoute] = useState<Route>(() => parseHash(window.location.hash));
  const [cart, setCart] = useLocalState<CartItem[]>("yantach.cart", []);
  const [favorites, setFavorites] = useLocalState<string[]>("yantach.fav", []);

  useEffect(() => {
    const onHash = () => setRoute(parseHash(window.location.hash));
    window.addEventListener("hashchange", onHash);
    return () => window.removeEventListener("hashchange", onHash);
  }, []);

  const cartCount = useMemo(() => cart.reduce((a, c) => a + c.qty, 0), [cart]);

  const ctx = {
    cart,
    favorites,
    cartCount,
    addToCart(productId: string, qty = 1) {
      setCart(prev => {
        const i = prev.findIndex(c => c.productId === productId);
        if (i < 0) return [...prev, { productId, qty }];
        const next = prev.slice();
        next[i] = { ...next[i], qty: next[i].qty + qty };
        return next;
      });
    },
    setQty(productId: string, qty: number) {
      setCart(prev =>
        qty <= 0
          ? prev.filter(c => c.productId !== productId)
          : prev.map(c => (c.productId === productId ? { ...c, qty } : c)),
      );
    },
    removeFromCart(productId: string) {
      setCart(prev => prev.filter(c => c.productId !== productId));
    },
    clearCart() {
      setCart([]);
    },
    toggleFavorite(productId: string) {
      setFavorites(prev =>
        prev.includes(productId)
          ? prev.filter(id => id !== productId)
          : [...prev, productId],
      );
    },
    isFavorite(productId: string) {
      return favorites.includes(productId);
    },
  };

  // Admin owns its own chrome (header/sidebar) — render the storefront chrome
  // only on customer-facing routes.
  if (route.name === "admin") {
    return (
      <Suspense
        fallback={
          <div className="flex min-h-screen items-center justify-center text-ink-2">
            Загрузка админки…
          </div>
        }
      >
        <AdminApp tab={route.tab} />
      </Suspense>
    );
  }

  return (
    <div className="flex min-h-full flex-col">
      <PromoStrip />
      <Header
        cartCount={cartCount}
        favoriteCount={favorites.length}
        currentRoute={route}
      />

      <main className="flex-1">
        {route.name === "home" && <HomePage ctx={ctx} />}
        {route.name === "category" && <CategoryPage id={route.id} ctx={ctx} />}
        {route.name === "product" && <ProductPage id={route.id} ctx={ctx} />}
        {route.name === "search" && <SearchPage q={route.q} ctx={ctx} />}
        {route.name === "cart" && <CartPage ctx={ctx} />}
        {route.name === "favorites" && <FavoritesPage ctx={ctx} />}
        {route.name === "news" && <NewsListPage />}
        {route.name === "newsArticle" && <NewsArticlePage slug={route.slug} />}
        {route.name === "compare" && <ComparePageLazy ctx={ctx} />}
        {route.name === "notFound" && <NotFoundPage />}
      </main>

      <Footer />
      <CompareBar />
      <PwaInstallPrompt />
    </div>
  );
}

const ComparePage = lazy(() =>
  import("./pages/ComparePage").then(m => ({ default: m.ComparePage })),
);
function ComparePageLazy({ ctx }: { ctx: ShopCtx }) {
  return (
    <Suspense fallback={<div className="mx-auto max-w-[1320px] p-6 text-ink-2">Загрузка…</div>}>
      <ComparePage ctx={ctx} />
    </Suspense>
  );
}

/** Shared shopping context passed down to every page as a prop. */
export interface ShopCtx {
  cart: CartItem[];
  favorites: string[];
  cartCount: number;
  addToCart(productId: string, qty?: number): void;
  setQty(productId: string, qty: number): void;
  removeFromCart(productId: string): void;
  clearCart(): void;
  toggleFavorite(productId: string): void;
  isFavorite(productId: string): boolean;
}
