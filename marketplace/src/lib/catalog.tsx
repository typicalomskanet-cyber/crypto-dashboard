import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { CATEGORIES as SEED_CATEGORIES } from "../data/categories";
import { PRODUCTS as SEED_PRODUCTS, DEFAULT_AFFILIATE_URL } from "../data/products";
import { DEFAULT_BANNERS, type Banner } from "../data/banners";
import { DEFAULT_NEWS, type NewsArticle } from "../data/news";
import { DEFAULT_PROMOS, type PromoCode } from "../data/promos";
import type { Category, Product } from "../data/types";

export interface SiteSettings {
  siteName: string;
  defaultAffiliateUrl: string;
  /** Salted-hash-free admin gate; matches input verbatim. Local only. */
  adminPassword: string;
  /** POST endpoint that accepts a multipart "file" upload and returns
   *  `{ ok, url }`. Empty value disables the in-admin upload button. */
  uploadEndpoint: string;
  /** Secret token sent as X-Upload-Token header. Must match server-side. */
  uploadToken: string;
}

const DEFAULT_SETTINGS: SiteSettings = {
  siteName: "Yantach Shop",
  defaultAffiliateUrl: DEFAULT_AFFILIATE_URL,
  adminPassword: "admin",
  uploadEndpoint: "http://a1262430.xsph.ru/upload.php",
  uploadToken: "a764bd68c87dde34f8fccd239ca9d677",
};

export interface CatalogState {
  products: Product[];
  categories: Category[];
  banners: Banner[];
  news: NewsArticle[];
  promos: PromoCode[];
  settings: SiteSettings;
  /** Map productId → click count on the affiliate "Buy" button. */
  clicks: Record<string, number>;
}

interface CatalogActions {
  // Product CRUD
  addProduct(p: Product): void;
  updateProduct(id: string, patch: Partial<Product>): void;
  removeProduct(id: string): void;
  duplicateProduct(id: string): void;
  // Category CRUD
  addCategory(c: Category): void;
  updateCategory(id: string, patch: Partial<Category>): void;
  removeCategory(id: string): void;
  // Banners
  addBanner(b: Banner): void;
  updateBanner(id: string, patch: Partial<Banner>): void;
  removeBanner(id: string): void;
  // News
  addNews(n: NewsArticle): void;
  updateNews(id: string, patch: Partial<NewsArticle>): void;
  removeNews(id: string): void;
  // Promos
  addPromo(p: PromoCode): void;
  updatePromo(id: string, patch: Partial<PromoCode>): void;
  removePromo(id: string): void;
  // Settings
  updateSettings(patch: Partial<SiteSettings>): void;
  // Analytics
  trackClick(productId: string): void;
  // Import / export / reset
  exportJson(): string;
  importJson(raw: string): { ok: true } | { ok: false; error: string };
  resetToSeed(): void;
}

interface CatalogIndex {
  productById: Map<string, Product>;
  categoryById: Map<string, Category>;
}

type Ctx = CatalogState & CatalogActions & CatalogIndex;

const STORAGE_KEY = "yantach.catalog.v1";
const CLICKS_KEY = "yantach.clicks.v1";

const CatalogCtx = createContext<Ctx | null>(null);

function loadInitial(): CatalogState {
  if (typeof window === "undefined") {
    return {
      products: SEED_PRODUCTS,
      categories: SEED_CATEGORIES,
      banners: DEFAULT_BANNERS,
      news: DEFAULT_NEWS,
      promos: DEFAULT_PROMOS,
      settings: DEFAULT_SETTINGS,
      clicks: {},
    };
  }
  let products = SEED_PRODUCTS;
  let categories = SEED_CATEGORIES;
  let banners = DEFAULT_BANNERS;
  let news = DEFAULT_NEWS;
  let promos = DEFAULT_PROMOS;
  let settings = DEFAULT_SETTINGS;

  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw) as Partial<CatalogState>;
      if (Array.isArray(parsed.products)) products = parsed.products as Product[];
      if (Array.isArray(parsed.categories)) categories = parsed.categories as Category[];
      if (Array.isArray(parsed.banners)) banners = parsed.banners as Banner[];
      if (Array.isArray(parsed.news)) news = parsed.news as NewsArticle[];
      if (Array.isArray(parsed.promos)) promos = parsed.promos as PromoCode[];
      if (parsed.settings) settings = { ...DEFAULT_SETTINGS, ...parsed.settings };
    }
  } catch {
    /* fall through to seed defaults */
  }

  let clicks: Record<string, number> = {};
  try {
    const raw = window.localStorage.getItem(CLICKS_KEY);
    if (raw) clicks = JSON.parse(raw) as Record<string, number>;
  } catch { /* ignore */ }

  return { products, categories, banners, news, promos, settings, clicks };
}

function persist(state: CatalogState) {
  try {
    window.localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify({
        products: state.products,
        categories: state.categories,
        banners: state.banners,
        news: state.news,
        promos: state.promos,
        settings: state.settings,
      }),
    );
    window.localStorage.setItem(CLICKS_KEY, JSON.stringify(state.clicks));
  } catch {
    /* quota exceeded — ignore */
  }
}

export function CatalogProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<CatalogState>(loadInitial);

  useEffect(() => {
    persist(state);
  }, [state]);

  const addProduct = useCallback((p: Product) => {
    setState(s => ({ ...s, products: [p, ...s.products] }));
  }, []);
  const updateProduct = useCallback((id: string, patch: Partial<Product>) => {
    setState(s => ({
      ...s,
      products: s.products.map(p => (p.id === id ? { ...p, ...patch } : p)),
    }));
  }, []);
  const removeProduct = useCallback((id: string) => {
    setState(s => ({ ...s, products: s.products.filter(p => p.id !== id) }));
  }, []);
  const duplicateProduct = useCallback((id: string) => {
    setState(s => {
      const idx = s.products.findIndex(p => p.id === id);
      if (idx < 0) return s;
      const orig = s.products[idx];
      const clone: Product = { ...orig, id: `p-${Date.now()}`, title: `${orig.title} (копия)` };
      const next = s.products.slice();
      next.splice(idx + 1, 0, clone);
      return { ...s, products: next };
    });
  }, []);

  const addCategory = useCallback((c: Category) => {
    setState(s => ({ ...s, categories: [...s.categories, c] }));
  }, []);
  const updateCategory = useCallback((id: string, patch: Partial<Category>) => {
    setState(s => ({
      ...s,
      categories: s.categories.map(c => (c.id === id ? { ...c, ...patch } : c)),
    }));
  }, []);
  const removeCategory = useCallback((id: string) => {
    setState(s => ({
      ...s,
      categories: s.categories.filter(c => c.id !== id),
      // Re-home products from the deleted category to "etc" if no fallback exists.
      products: s.products.map(p =>
        p.categoryId === id
          ? { ...p, categoryId: s.categories[0]?.id ?? "etc" }
          : p,
      ),
    }));
  }, []);

  const addBanner = useCallback((b: Banner) => {
    setState(s => ({ ...s, banners: [...s.banners, b] }));
  }, []);
  const updateBanner = useCallback((id: string, patch: Partial<Banner>) => {
    setState(s => ({
      ...s,
      banners: s.banners.map(b => (b.id === id ? { ...b, ...patch } : b)),
    }));
  }, []);
  const removeBanner = useCallback((id: string) => {
    setState(s => ({ ...s, banners: s.banners.filter(b => b.id !== id) }));
  }, []);

  const addNews = useCallback((n: NewsArticle) => {
    setState(s => ({ ...s, news: [n, ...s.news] }));
  }, []);
  const updateNews = useCallback((id: string, patch: Partial<NewsArticle>) => {
    setState(s => ({
      ...s,
      news: s.news.map(n => (n.id === id ? { ...n, ...patch } : n)),
    }));
  }, []);
  const removeNews = useCallback((id: string) => {
    setState(s => ({ ...s, news: s.news.filter(n => n.id !== id) }));
  }, []);

  const addPromo = useCallback((p: PromoCode) => {
    setState(s => ({ ...s, promos: [p, ...s.promos] }));
  }, []);
  const updatePromo = useCallback((id: string, patch: Partial<PromoCode>) => {
    setState(s => ({
      ...s,
      promos: s.promos.map(p => (p.id === id ? { ...p, ...patch } : p)),
    }));
  }, []);
  const removePromo = useCallback((id: string) => {
    setState(s => ({ ...s, promos: s.promos.filter(p => p.id !== id) }));
  }, []);

  const updateSettings = useCallback((patch: Partial<SiteSettings>) => {
    setState(s => ({ ...s, settings: { ...s.settings, ...patch } }));
  }, []);

  const trackClick = useCallback((productId: string) => {
    setState(s => ({
      ...s,
      clicks: { ...s.clicks, [productId]: (s.clicks[productId] ?? 0) + 1 },
    }));
  }, []);

  const exportJson = useCallback((): string => {
    return JSON.stringify(
      {
        version: 1,
        exportedAt: new Date().toISOString(),
        products: state.products,
        categories: state.categories,
        banners: state.banners,
        news: state.news,
        promos: state.promos,
        settings: state.settings,
        clicks: state.clicks,
      },
      null,
      2,
    );
  }, [state]);

  const importJson = useCallback((raw: string): { ok: true } | { ok: false; error: string } => {
    try {
      const parsed = JSON.parse(raw) as Partial<CatalogState>;
      const products = Array.isArray(parsed.products) ? (parsed.products as Product[]) : null;
      const categories = Array.isArray(parsed.categories) ? (parsed.categories as Category[]) : null;
      const banners = Array.isArray(parsed.banners) ? (parsed.banners as Banner[]) : null;
      const news = Array.isArray(parsed.news) ? (parsed.news as NewsArticle[]) : null;
      const promos = Array.isArray(parsed.promos) ? (parsed.promos as PromoCode[]) : null;
      if (!products || !categories) {
        return { ok: false, error: "В файле нет полей products или categories" };
      }
      setState(s => ({
        products,
        categories,
        banners: banners ?? s.banners,
        news: news ?? s.news,
        promos: promos ?? s.promos,
        settings: parsed.settings ? { ...DEFAULT_SETTINGS, ...parsed.settings } : s.settings,
        clicks: parsed.clicks && typeof parsed.clicks === "object" ? (parsed.clicks as Record<string, number>) : s.clicks,
      }));
      return { ok: true };
    } catch (e) {
      return { ok: false, error: (e as Error).message };
    }
  }, []);

  const resetToSeed = useCallback(() => {
    setState({
      products: SEED_PRODUCTS,
      categories: SEED_CATEGORIES,
      banners: DEFAULT_BANNERS,
      news: DEFAULT_NEWS,
      promos: DEFAULT_PROMOS,
      settings: DEFAULT_SETTINGS,
      clicks: {},
    });
  }, []);

  const productById = useMemo(
    () => new Map(state.products.map(p => [p.id, p])),
    [state.products],
  );
  const categoryById = useMemo(
    () => new Map(state.categories.map(c => [c.id, c])),
    [state.categories],
  );

  const value: Ctx = {
    ...state,
    addProduct,
    updateProduct,
    removeProduct,
    duplicateProduct,
    addCategory,
    updateCategory,
    removeCategory,
    addBanner,
    updateBanner,
    removeBanner,
    addNews,
    updateNews,
    removeNews,
    addPromo,
    updatePromo,
    removePromo,
    updateSettings,
    trackClick,
    exportJson,
    importJson,
    resetToSeed,
    productById,
    categoryById,
  };

  return <CatalogCtx.Provider value={value}>{children}</CatalogCtx.Provider>;
}

export function useCatalog(): Ctx {
  const ctx = useContext(CatalogCtx);
  if (!ctx) throw new Error("useCatalog must be used within CatalogProvider");
  return ctx;
}

export function useProducts(): Product[] {
  return useCatalog().products;
}

export function useCategories(): Category[] {
  return useCatalog().categories;
}

export function useProductsByCategory(catId: string): Product[] {
  const { products } = useCatalog();
  return useMemo(() => products.filter(p => p.categoryId === catId), [products, catId]);
}

export function useNews(includeDrafts = false): NewsArticle[] {
  const { news } = useCatalog();
  return useMemo(
    () =>
      [...news]
        .filter(n => includeDrafts || n.published)
        .sort((a, b) => (a.date < b.date ? 1 : -1)),
    [news, includeDrafts],
  );
}

export function useNewsBySlug(slug: string): NewsArticle | undefined {
  const { news } = useCatalog();
  return useMemo(() => news.find(n => n.slug === slug), [news, slug]);
}

export function useSearchProducts(q: string): Product[] {
  const { products } = useCatalog();
  return useMemo(() => {
    const needle = q.trim().toLowerCase();
    if (!needle) return [];
    return products.filter(p =>
      p.title.toLowerCase().includes(needle) ||
      p.brand.toLowerCase().includes(needle) ||
      p.description.toLowerCase().includes(needle),
    );
  }, [products, q]);
}
