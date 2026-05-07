import { useState } from "react";
import { useCatalog } from "../lib/catalog";
import { hashPassword, isLegacyPasswordHash } from "../lib/crypto";
import { Field, inputCls } from "./AdminApp";

export function SettingsTab() {
  const { settings, updateSettings, resetToSeed } = useCatalog();
  // Password field works with a separate plain text buffer that's hashed on
  // save — so the form never round-trips the raw hash and admins can type a
  // new password without seeing the encoded form.
  const [draft, setDraft] = useState({
    siteName: settings.siteName,
    defaultAffiliateUrl: settings.defaultAffiliateUrl,
    uploadEndpoint: settings.uploadEndpoint,
    uploadToken: settings.uploadToken,
  });
  const [newPassword, setNewPassword] = useState("");
  const [saved, setSaved] = useState(false);
  const [busy, setBusy] = useState(false);

  return (
    <div className="max-w-[640px]">
      <h1 className="mb-4 text-[20px] font-extrabold">Настройки</h1>

      <div className="space-y-4">
        <Field label="Название магазина" hint="отображается в шапке и футере">
          <input
            value={draft.siteName}
            onChange={e => setDraft({ ...draft, siteName: e.target.value })}
            className={inputCls}
          />
        </Field>

        <Field
          label="Партнёрская ссылка по умолчанию"
          hint="используется как дефолт для новых товаров"
        >
          <input
            value={draft.defaultAffiliateUrl}
            onChange={e => setDraft({ ...draft, defaultAffiliateUrl: e.target.value })}
            className={inputCls}
            placeholder="https://market.yandex.ru/cc/XXXX"
          />
        </Field>

        <Field
          label="Новый пароль администратора"
          hint={
            isLegacyPasswordHash(settings.adminPassword)
              ? "пароль хранится в открытом виде — задайте новый, он будет захеширован (PBKDF2)"
              : "оставьте пустым чтобы не менять. Хранится как PBKDF2-хеш."
          }
        >
          <input
            type="password"
            autoComplete="new-password"
            value={newPassword}
            onChange={e => setNewPassword(e.target.value)}
            className={inputCls}
            placeholder="••••••••"
          />
        </Field>

        <div className="rounded-xl border border-line bg-paper p-4">
          <h3 className="mb-3 text-[14px] font-bold">📁 Загрузка изображений на хостинг</h3>
          <div className="space-y-3">
            <Field
              label="URL upload.php"
              hint="endpoint на твоём хостинге, который принимает файл и возвращает URL"
            >
              <input
                value={draft.uploadEndpoint}
                onChange={e => setDraft({ ...draft, uploadEndpoint: e.target.value })}
                className={inputCls}
                placeholder="https://yourdomain.com/upload.php"
              />
            </Field>
            <Field
              label="Секретный токен"
              hint="должен совпадать с UPLOAD_TOKEN в upload.php"
            >
              <input
                value={draft.uploadToken}
                onChange={e => setDraft({ ...draft, uploadToken: e.target.value })}
                className={inputCls + " font-mono text-[12px]"}
              />
            </Field>
            <p className="text-[11px] leading-relaxed text-ink-2">
              Если оставить URL пустым — кнопка «Загрузить» в полях изображений просто не будет показываться (можно вводить только URL вручную).
            </p>
          </div>
        </div>

        <div className="flex flex-wrap gap-2 pt-2">
          <button
            disabled={busy}
            onClick={async () => {
              setBusy(true);
              try {
                const patch: Partial<typeof settings> = { ...draft };
                if (newPassword.trim().length > 0) {
                  patch.adminPassword = await hashPassword(newPassword);
                }
                updateSettings(patch);
                setNewPassword("");
                setSaved(true);
                setTimeout(() => setSaved(false), 2000);
              } finally {
                setBusy(false);
              }
            }}
            className="rounded-lg bg-brand px-5 py-2 text-[13px] font-semibold text-white hover:bg-brand-dark disabled:opacity-60"
          >
            {busy ? "Сохраняем…" : "Сохранить"}
          </button>
          {saved && <span className="self-center text-[12px] text-brand">Сохранено ✓</span>}
        </div>
      </div>

      <div className="mt-10 rounded-xl border border-discount/30 bg-discount/5 p-4">
        <h3 className="text-[14px] font-bold text-discount">Опасная зона</h3>
        <p className="mt-1 text-[12px] text-ink-2">
          Сбросить весь каталог (товары, категории, баннеры, новости, настройки)
          к стандартному содержимому. Действие нельзя отменить.
        </p>
        <button
          onClick={() => {
            if (confirm("Сбросить ВСЁ к заводским значениям? Все ваши правки будут потеряны.")) {
              resetToSeed();
              setDraft({
                siteName: "Yantach Shop",
                defaultAffiliateUrl: "https://market.yandex.ru/cc/9NW947",
                uploadEndpoint: "http://a1262430.xsph.ru/upload.php",
                uploadToken: "a764bd68c87dde34f8fccd239ca9d677",
              });
              setNewPassword("");
            }
          }}
          className="mt-3 rounded-lg bg-discount px-4 py-2 text-[13px] font-semibold text-white hover:bg-discount/90"
        >
          Сбросить к умолчаниям
        </button>
      </div>
    </div>
  );
}
