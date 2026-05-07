import { useMemo, useState } from "react";
import { useCatalog } from "../lib/catalog";
import type { Product } from "../data/types";
import { Field, inputCls, textareaCls } from "./AdminApp";
import { ImageInput } from "./ImageInput";
import { formatPrice } from "../lib/format";

const PARTNERS: Product["partner"][] = ["yandex", "ozon", "wildberries", "ali", "other"];
const PARTNER_LABEL: Record<Product["partner"], string> = {
  yandex: "Яндекс.Маркет",
  ozon: "Ozon",
  wildberries: "Wildberries",
  ali: "AliExpress",
  other: "Другой",
};
const ALL_BADGES: NonNullable<Product["badges"]>[number][] = [
  "bestseller",
  "new",
  "express",
  "freeShip",
];
const BADGE_LABEL: Record<string, string> = {
  bestseller: "🔥 Хит",
  new: "✨ Новинка",
  express: "⚡ Экспресс",
  freeShip: "🚚 Бесплатная",
};

export function ProductsTab() {
  const { products, categories, addProduct, updateProduct, removeProduct, duplicateProduct, settings } = useCatalog();
  const [q, setQ] = useState("");
  const [editing, setEditing] = useState<Product | null>(null);

  const filtered = useMemo(() => {
    const needle = q.trim().toLowerCase();
    if (!needle) return products;
    return products.filter(
      p =>
        p.title.toLowerCase().includes(needle) ||
        p.brand.toLowerCase().includes(needle) ||
        p.id.toLowerCase().includes(needle),
    );
  }, [products, q]);

  function handleNew() {
    const id = `p-${Date.now()}`;
    setEditing({
      id,
      title: "",
      brand: "",
      description: "",
      categoryId: categories[0]?.id ?? "",
      price: 0,
      rating: 5,
      reviewCount: 0,
      images: [""],
      badges: [],
      specs: [],
      partnerUrl: settings.defaultAffiliateUrl,
      partner: "yandex",
      stock: "В наличии",
    });
  }

  return (
    <div>
      <div className="mb-4 flex flex-wrap items-center gap-2">
        <h1 className="text-[20px] font-extrabold">Товары</h1>
        <span className="text-[12px] text-ink-2">всего: {products.length}</span>
        <div className="ml-auto flex gap-2">
          <input
            value={q}
            onChange={e => setQ(e.target.value)}
            placeholder="Поиск по названию / бренду"
            className="h-10 w-56 rounded-lg border border-line bg-paper px-3 text-[14px] outline-none focus:border-brand focus:bg-white"
          />
          <button
            onClick={handleNew}
            className="flex h-10 items-center rounded-lg bg-brand px-4 text-[13px] font-semibold text-white hover:bg-brand-dark"
          >
            + Добавить товар
          </button>
        </div>
      </div>

      <div className="overflow-x-auto rounded-xl border border-line">
        <table className="w-full min-w-[920px] text-[13px]">
          <thead className="bg-paper text-left text-[11px] uppercase tracking-wide text-ink-2">
            <tr>
              <th className="p-2">Фото</th>
              <th className="p-2">Название · бренд</th>
              <th className="p-2">Категория</th>
              <th className="p-2 text-right">Цена</th>
              <th className="p-2">Рейтинг</th>
              <th className="p-2">Партнёр</th>
              <th className="p-2 text-right">Действия</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map(p => (
              <tr key={p.id} className="border-t border-line align-top">
                <td className="p-2">
                  <div className="h-12 w-12 overflow-hidden rounded-md bg-paper">
                    {p.images[0] && (
                      <img src={p.images[0]} alt="" className="h-full w-full object-cover" />
                    )}
                  </div>
                </td>
                <td className="p-2">
                  <div className="font-semibold leading-tight">{p.title}</div>
                  <div className="text-[11px] text-ink-2">{p.brand} · {p.id}</div>
                </td>
                <td className="p-2 text-[12px]">
                  {categories.find(c => c.id === p.categoryId)?.name ?? p.categoryId}
                </td>
                <td className="p-2 text-right font-semibold">
                  {formatPrice(p.price)}
                  {p.oldPrice && (
                    <div className="text-[11px] text-ink-2 line-through">
                      {formatPrice(p.oldPrice)}
                    </div>
                  )}
                </td>
                <td className="p-2">★ {p.rating.toFixed(1)} <span className="text-[11px] text-ink-2">({p.reviewCount})</span></td>
                <td className="p-2 text-[12px]">{PARTNER_LABEL[p.partner]}</td>
                <td className="p-2 text-right">
                  <div className="inline-flex gap-1">
                    <button
                      onClick={() => setEditing(p)}
                      className="rounded-md bg-paper px-2 py-1 text-[12px] font-semibold hover:bg-brand-light hover:text-brand"
                    >
                      Изм.
                    </button>
                    <button
                      onClick={() => duplicateProduct(p.id)}
                      className="rounded-md bg-paper px-2 py-1 text-[12px] hover:bg-brand-light hover:text-brand"
                    >
                      Копия
                    </button>
                    <button
                      onClick={() => {
                        if (confirm(`Удалить «${p.title}»?`)) removeProduct(p.id);
                      }}
                      className="rounded-md bg-paper px-2 py-1 text-[12px] hover:bg-discount/10 hover:text-discount"
                    >
                      Удал.
                    </button>
                  </div>
                </td>
              </tr>
            ))}
            {filtered.length === 0 && (
              <tr>
                <td colSpan={7} className="p-6 text-center text-ink-2">
                  Ничего не найдено
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {editing && (
        <ProductEditor
          product={editing}
          isNew={!products.some(p => p.id === editing.id)}
          onClose={() => setEditing(null)}
          onSave={p => {
            if (products.some(x => x.id === p.id)) {
              updateProduct(p.id, p);
            } else {
              addProduct(p);
            }
            setEditing(null);
          }}
        />
      )}
    </div>
  );
}

function ProductEditor({
  product,
  isNew,
  onClose,
  onSave,
}: {
  product: Product;
  isNew: boolean;
  onClose(): void;
  onSave(p: Product): void;
}) {
  const { categories } = useCatalog();
  const [draft, setDraft] = useState<Product>(product);

  function update<K extends keyof Product>(key: K, value: Product[K]) {
    setDraft(d => ({ ...d, [key]: value }));
  }

  function toggleBadge(b: NonNullable<Product["badges"]>[number]) {
    const cur = draft.badges ?? [];
    update("badges", cur.includes(b) ? cur.filter(x => x !== b) : [...cur, b]);
  }

  return (
    <div className="fixed inset-0 z-40 flex items-start justify-center overflow-y-auto bg-ink/60 p-4 md:p-8">
      <div className="w-full max-w-[860px] rounded-2xl bg-white p-5 md:p-6">
        <div className="mb-4 flex items-center gap-3">
          <h2 className="text-[18px] font-extrabold">
            {isNew ? "Новый товар" : `Редактирование · ${product.title || product.id}`}
          </h2>
          <button onClick={onClose} className="ml-auto text-ink-2 hover:text-discount">
            ✕
          </button>
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          <Field label="ID товара" hint="используется в URL">
            <input
              value={draft.id}
              onChange={e => update("id", e.target.value)}
              className={inputCls}
              disabled={!isNew}
            />
          </Field>
          <Field label="Категория">
            <select
              value={draft.categoryId}
              onChange={e => update("categoryId", e.target.value)}
              className={inputCls}
            >
              {categories.map(c => (
                <option key={c.id} value={c.id}>
                  {c.icon} {c.name}
                </option>
              ))}
            </select>
          </Field>

          <Field label="Название">
            <input
              value={draft.title}
              onChange={e => update("title", e.target.value)}
              className={inputCls}
            />
          </Field>
          <Field label="Бренд">
            <input
              value={draft.brand}
              onChange={e => update("brand", e.target.value)}
              className={inputCls}
            />
          </Field>

          <Field label="Цена, ₽">
            <input
              type="number"
              value={draft.price}
              onChange={e => update("price", Number(e.target.value))}
              className={inputCls}
            />
          </Field>
          <Field label="Старая цена, ₽" hint="опционально, для скидки">
            <input
              type="number"
              value={draft.oldPrice ?? ""}
              onChange={e =>
                update("oldPrice", e.target.value ? Number(e.target.value) : undefined)
              }
              className={inputCls}
            />
          </Field>

          <Field label="Рейтинг (0..5)">
            <input
              type="number"
              step="0.1"
              min="0"
              max="5"
              value={draft.rating}
              onChange={e => update("rating", Number(e.target.value))}
              className={inputCls}
            />
          </Field>
          <Field label="Кол-во отзывов">
            <input
              type="number"
              value={draft.reviewCount}
              onChange={e => update("reviewCount", Number(e.target.value))}
              className={inputCls}
            />
          </Field>

          <Field label="Партнёр">
            <select
              value={draft.partner}
              onChange={e => update("partner", e.target.value as Product["partner"])}
              className={inputCls}
            >
              {PARTNERS.map(p => (
                <option key={p} value={p}>{PARTNER_LABEL[p]}</option>
              ))}
            </select>
          </Field>
          <Field label="Партнёрская ссылка" hint="ваша affiliate-ссылка">
            <input
              value={draft.partnerUrl}
              onChange={e => update("partnerUrl", e.target.value)}
              className={inputCls}
            />
          </Field>

          <Field label="Наличие">
            <input
              value={draft.stock ?? ""}
              onChange={e => update("stock", e.target.value)}
              className={inputCls}
              placeholder="В наличии · Под заказ · Мало"
            />
          </Field>
          <div />

          <div className="md:col-span-2">
            <Field label="Описание">
              <textarea
                value={draft.description}
                onChange={e => update("description", e.target.value)}
                className={textareaCls}
              />
            </Field>
          </div>

          <div className="md:col-span-2">
            <Field label="Бейджи">
              <div className="flex flex-wrap gap-2">
                {ALL_BADGES.map(b => {
                  const on = (draft.badges ?? []).includes(b);
                  return (
                    <button
                      key={b}
                      type="button"
                      onClick={() => toggleBadge(b)}
                      className={`rounded-full border px-3 py-1 text-[12px] ${
                        on
                          ? "border-brand bg-brand-light text-brand"
                          : "border-line bg-paper text-ink-2 hover:text-ink"
                      }`}
                    >
                      {BADGE_LABEL[b]}
                    </button>
                  );
                })}
              </div>
            </Field>
          </div>

          <div className="md:col-span-2">
            <Field label="Изображения" hint="загрузите файл или вставьте URL">
              <div className="space-y-2">
                {draft.images.map((src, i) => (
                  <ImageInput
                    key={i}
                    value={src}
                    onChange={url => {
                      const next = draft.images.slice();
                      next[i] = url;
                      update("images", next);
                    }}
                  />
                ))}
                <button
                  type="button"
                  onClick={() => update("images", [...draft.images, ""])}
                  className="rounded-lg bg-paper px-3 py-1.5 text-[12px] text-ink-2 hover:text-brand"
                >
                  + Добавить картинку
                </button>
              </div>
            </Field>
          </div>

          <div className="md:col-span-2">
            <Field label="Характеристики">
              <div className="space-y-2">
                {(draft.specs ?? []).map((s, i) => (
                  <div key={i} className="grid grid-cols-[1fr_2fr_auto] gap-2">
                    <input
                      value={s.name}
                      onChange={e => {
                        const next = (draft.specs ?? []).slice();
                        next[i] = { ...next[i], name: e.target.value };
                        update("specs", next);
                      }}
                      placeholder="Параметр"
                      className={inputCls}
                    />
                    <input
                      value={s.value}
                      onChange={e => {
                        const next = (draft.specs ?? []).slice();
                        next[i] = { ...next[i], value: e.target.value };
                        update("specs", next);
                      }}
                      placeholder="Значение"
                      className={inputCls}
                    />
                    <button
                      type="button"
                      onClick={() => {
                        update("specs", (draft.specs ?? []).filter((_, j) => j !== i));
                      }}
                      className="rounded-lg bg-paper px-3 text-[12px] text-ink-2 hover:text-discount"
                    >
                      ✕
                    </button>
                  </div>
                ))}
                <button
                  type="button"
                  onClick={() =>
                    update("specs", [...(draft.specs ?? []), { name: "", value: "" }])
                  }
                  className="rounded-lg bg-paper px-3 py-1.5 text-[12px] text-ink-2 hover:text-brand"
                >
                  + Добавить характеристику
                </button>
              </div>
            </Field>
          </div>
        </div>

        <div className="mt-5 flex justify-end gap-2">
          <button
            onClick={onClose}
            className="rounded-lg bg-paper px-4 py-2 text-[13px] font-semibold text-ink-2 hover:text-ink"
          >
            Отмена
          </button>
          <button
            onClick={() => {
              if (!draft.title.trim()) {
                alert("Заполните название");
                return;
              }
              onSave({
                ...draft,
                images: draft.images.filter(s => s.trim()),
                specs: (draft.specs ?? []).filter(s => s.name.trim() || s.value.trim()),
              });
            }}
            className="rounded-lg bg-brand px-5 py-2 text-[13px] font-semibold text-white hover:bg-brand-dark"
          >
            {isNew ? "Создать" : "Сохранить"}
          </button>
        </div>
      </div>
    </div>
  );
}
