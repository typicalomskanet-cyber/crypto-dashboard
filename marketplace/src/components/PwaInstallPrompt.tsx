import { useEffect, useState } from "react";

const DISMISS_KEY = "yantach.installPrompt.dismissedAt";
const COOLDOWN_MS = 14 * 24 * 60 * 60 * 1000; // 14 days

interface BeforeInstallPromptEvent extends Event {
  prompt(): Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
}

/** Lightweight bottom banner offering "Install app" using the PWA install API. */
export function PwaInstallPrompt() {
  const [evt, setEvt] = useState<BeforeInstallPromptEvent | null>(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    let dismissedAt = 0;
    try {
      dismissedAt = Number(localStorage.getItem(DISMISS_KEY) ?? 0);
    } catch {
      /* ignore */
    }
    if (Date.now() - dismissedAt < COOLDOWN_MS) return;

    const handler = (e: Event) => {
      e.preventDefault();
      setEvt(e as BeforeInstallPromptEvent);
      setVisible(true);
    };
    window.addEventListener("beforeinstallprompt", handler as EventListener);
    return () => window.removeEventListener("beforeinstallprompt", handler as EventListener);
  }, []);

  if (!visible || !evt) return null;

  function dismiss() {
    try {
      localStorage.setItem(DISMISS_KEY, String(Date.now()));
    } catch {
      /* ignore */
    }
    setVisible(false);
  }

  async function install() {
    if (!evt) return;
    try {
      await evt.prompt();
      await evt.userChoice;
    } catch {
      /* ignore */
    }
    dismiss();
  }

  return (
    <div className="pointer-events-none fixed inset-x-0 bottom-0 z-40 flex justify-center px-3 pb-3">
      <div className="pointer-events-auto flex w-full max-w-[520px] items-center gap-3 rounded-2xl border border-line bg-white p-3 shadow-2xl">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-brand-light text-xl">
          📱
        </div>
        <div className="min-w-0 flex-1">
          <div className="text-[13px] font-bold leading-tight">Установить Yantach Shop</div>
          <div className="clamp-1 text-[11px] text-ink-2">Открывается как приложение, работает без интернета</div>
        </div>
        <button
          type="button"
          onClick={install}
          className="flex h-9 shrink-0 items-center rounded-lg bg-brand px-3 text-[12px] font-bold text-white hover:bg-brand-dark"
        >
          Установить
        </button>
        <button
          type="button"
          onClick={dismiss}
          className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg text-[18px] text-ink-2 hover:bg-paper"
          aria-label="Скрыть"
        >
          ×
        </button>
      </div>
    </div>
  );
}
