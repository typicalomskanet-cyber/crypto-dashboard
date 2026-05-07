import { useEffect, useRef, useState, type ReactNode } from "react";
import { useCatalog } from "../lib/catalog";
import { hashPassword, verifyPassword, isLegacyPasswordHash } from "../lib/crypto";
import { ProductsTab } from "./ProductsTab";
import { CategoriesTab } from "./CategoriesTab";
import { BannersTab } from "./BannersTab";
import { NewsTab } from "./NewsTab";
import { PromosTab } from "./PromosTab";
import { SettingsTab } from "./SettingsTab";
import { AnalyticsTab } from "./AnalyticsTab";
import { ImportExportTab } from "./ImportExportTab";

const TABS = [
  { id: "products", label: "Товары", icon: "📦" },
  { id: "categories", label: "Категории", icon: "🗂️" },
  { id: "banners", label: "Баннеры", icon: "🖼️" },
  { id: "news", label: "Новости", icon: "📰" },
  { id: "promos", label: "Промокоды", icon: "🎁" },
  { id: "analytics", label: "Аналитика", icon: "📊" },
  { id: "settings", label: "Настройки", icon: "⚙️" },
  { id: "io", label: "Импорт / Экспорт", icon: "🔁" },
] as const;

const SESSION_KEY = "yantach.admin.session.v2";
const IDLE_LIMIT_MS = 60 * 60 * 1000; // 60 minutes

function readSession(): boolean {
  try {
    const raw = sessionStorage.getItem(SESSION_KEY);
    if (!raw) return false;
    const { ts } = JSON.parse(raw) as { ts: number };
    if (Date.now() - ts > IDLE_LIMIT_MS) {
      sessionStorage.removeItem(SESSION_KEY);
      return false;
    }
    return true;
  } catch {
    return false;
  }
}
function writeSession() {
  try { sessionStorage.setItem(SESSION_KEY, JSON.stringify({ ts: Date.now() })); } catch { /* noop */ }
}
function clearSession() {
  try { sessionStorage.removeItem(SESSION_KEY); } catch { /* noop */ }
}

export function AdminApp({ tab }: { tab?: string }) {
  const { settings, products, news, updateSettings } = useCatalog();
  const [unlocked, setUnlocked] = useState<boolean>(() => readSession());
  const [pwd, setPwd] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const idleTimer = useRef<number | null>(null);

  const activeTab = tab && TABS.some(t => t.id === tab) ? tab : "products";

  useEffect(() => {
    document.title = `Админка — ${settings.siteName}`;
  }, [settings.siteName]);

  // Auto-logout after IDLE_LIMIT_MS of no user activity.
  useEffect(() => {
    if (!unlocked) return;
    function bump() {
      writeSession();
      if (idleTimer.current) window.clearTimeout(idleTimer.current);
      idleTimer.current = window.setTimeout(() => {
        clearSession();
        setUnlocked(false);
      }, IDLE_LIMIT_MS);
    }
    bump();
    const events = ["mousemove", "keydown", "click", "touchstart", "scroll"] as const;
    events.forEach(e => window.addEventListener(e, bump, { passive: true }));
    return () => {
      events.forEach(e => window.removeEventListener(e, bump));
      if (idleTimer.current) window.clearTimeout(idleTimer.current);
    };
  }, [unlocked]);

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    try {
      const ok = await verifyPassword(pwd, settings.adminPassword);
      if (!ok) {
        setError("Неверный пароль");
        return;
      }
      // Migrate legacy plaintext password to PBKDF2 on first successful login.
      if (isLegacyPasswordHash(settings.adminPassword)) {
        const upgraded = await hashPassword(pwd);
        updateSettings({ adminPassword: upgraded });
      }
      writeSession();
      setUnlocked(true);
      setError(null);
    } catch {
      setError("Ошибка входа");
    } finally {
      setBusy(false);
    }
  }

  if (!unlocked) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-paper p-4">
        <form
          onSubmit={handleLogin}
          className="w-full max-w-[360px] space-y-3 rounded-2xl border border-line bg-white p-6 shadow-lg"
        >
          <div className="text-center">
            <div className="mb-1 text-3xl">🔐</div>
            <h1 className="text-[18px] font-extrabold">Админ-панель</h1>
            <p className="mt-1 text-[12px] text-ink-2">{settings.siteName}</p>
          </div>
          <input
            type="password"
            autoFocus
            value={pwd}
            onChange={e => setPwd(e.target.value)}
            placeholder="Пароль"
            className="h-11 w-full rounded-xl border border-line bg-paper px-3 text-[15px] outline-none focus:border-brand focus:bg-white focus:ring-2 focus:ring-brand-light"
          />
          {error && <div className="text-[12px] text-discount">{error}</div>}
          <button
            type="submit"
            disabled={busy}
            className="flex h-11 w-full items-center justify-center rounded-xl bg-brand font-semibold text-white hover:bg-brand-dark disabled:opacity-60"
          >
            {busy ? "Проверяем…" : "Войти"}
          </button>
          <a
            href="#/"
            className="block text-center text-[12px] text-ink-2 hover:text-brand"
          >
            ← На сайт
          </a>
          <p className="text-center text-[11px] text-ink-2">
            Пароль по умолчанию: <code>admin</code> · смените в «Настройках»
          </p>
        </form>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen flex-col bg-paper">
      <header className="border-b border-line bg-white">
        <div className="mx-auto flex max-w-[1480px] items-center gap-3 px-4 py-3">
          <a href="#/" className="text-[15px] font-extrabold">
            ← {settings.siteName}
          </a>
          <span className="rounded-full bg-brand-light px-2 py-0.5 text-[11px] font-bold text-brand">
            ADMIN
          </span>
          <div className="ml-auto hidden gap-3 text-[12px] text-ink-2 md:flex">
            <span><b className="text-ink">{products.length}</b> товаров</span>
            <span><b className="text-ink">{news.length}</b> новостей</span>
          </div>
          <button
            onClick={() => {
              clearSession();
              setUnlocked(false);
              setPwd("");
            }}
            className="rounded-lg bg-paper px-3 py-1.5 text-[12px] font-semibold text-ink-2 hover:text-discount"
          >
            Выйти
          </button>
        </div>
      </header>

      <div className="mx-auto flex w-full max-w-[1480px] flex-1 flex-col gap-4 p-3 md:flex-row md:p-4">
        <nav className="md:w-[220px] md:shrink-0">
          <ul className="flex gap-1 overflow-x-auto rounded-2xl border border-line bg-white p-1 md:flex-col">
            {TABS.map(t => (
              <li key={t.id}>
                <a
                  href={`#/admin/${t.id}`}
                  className={`flex shrink-0 items-center gap-2 rounded-xl px-3 py-2 text-[13px] font-medium ${
                    activeTab === t.id
                      ? "bg-brand text-white"
                      : "text-ink-2 hover:bg-paper hover:text-ink"
                  }`}
                >
                  <span>{t.icon}</span>
                  <span>{t.label}</span>
                </a>
              </li>
            ))}
          </ul>
        </nav>

        <main className="min-w-0 flex-1 rounded-2xl border border-line bg-white p-4 md:p-5">
          {activeTab === "products" && <ProductsTab />}
          {activeTab === "categories" && <CategoriesTab />}
          {activeTab === "banners" && <BannersTab />}
          {activeTab === "news" && <NewsTab />}
          {activeTab === "promos" && <PromosTab />}
          {activeTab === "analytics" && <AnalyticsTab />}
          {activeTab === "settings" && <SettingsTab />}
          {activeTab === "io" && <ImportExportTab />}
        </main>
      </div>
    </div>
  );
}

/** Common form field. */
export function Field({
  label,
  hint,
  children,
}: {
  label: string;
  hint?: string;
  children: ReactNode;
}) {
  return (
    <label className="block">
      <div className="mb-1 flex items-baseline justify-between">
        <span className="text-[12px] font-semibold uppercase tracking-wide text-ink-2">
          {label}
        </span>
        {hint && <span className="text-[11px] text-ink-2">{hint}</span>}
      </div>
      {children}
    </label>
  );
}

export const inputCls =
  "h-10 w-full rounded-lg border border-line bg-paper px-3 text-[14px] outline-none focus:border-brand focus:bg-white focus:ring-2 focus:ring-brand-light";

export const textareaCls = inputCls.replace("h-10", "min-h-[120px] py-2");
