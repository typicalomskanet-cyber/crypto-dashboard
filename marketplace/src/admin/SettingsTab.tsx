import { useState } from "react";
import { useCatalog } from "../lib/catalog";
import { Field, inputCls } from "./AdminApp";

export function SettingsTab() {
  const { settings, updateSettings, resetToSeed } = useCatalog();
  const [draft, setDraft] = useState(settings);
  const [saved, setSaved] = useState(false);

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
          label="Пароль администратора"
          hint="нужен для входа в /#/admin"
        >
          <input
            type="text"
            value={draft.adminPassword}
            onChange={e => setDraft({ ...draft, adminPassword: e.target.value })}
            className={inputCls}
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
            onClick={() => {
              updateSettings(draft);
              setSaved(true);
              setTimeout(() => setSaved(false), 2000);
            }}
            className="rounded-lg bg-brand px-5 py-2 text-[13px] font-semibold text-white hover:bg-brand-dark"
          >
            Сохранить
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
                adminPassword: "admin",
                uploadEndpoint: "http://a1262430.xsph.ru/upload.php",
                uploadToken: "a764bd68c87dde34f8fccd239ca9d677",
              });
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
