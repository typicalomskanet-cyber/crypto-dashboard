import { useState } from "react";
import { useCatalog } from "../lib/catalog";
import type { Category } from "../data/types";
import { Field, inputCls } from "./AdminApp";

export function CategoriesTab() {
  const { categories, addCategory, updateCategory, removeCategory, products } = useCatalog();
  const [editing, setEditing] = useState<Category | null>(null);

  function handleNew() {
    setEditing({
      id: `c-${Date.now()}`,
      name: "",
      icon: "🆕",
      tagline: "",
      tint: "#e6efff",
    });
  }

  return (
    <div>
      <div className="mb-4 flex flex-wrap items-center gap-2">
        <h1 className="text-[20px] font-extrabold">Категории</h1>
        <span className="text-[12px] text-ink-2">всего: {categories.length}</span>
        <button
          onClick={handleNew}
          className="ml-auto flex h-10 items-center rounded-lg bg-brand px-4 text-[13px] font-semibold text-white hover:bg-brand-dark"
        >
          + Добавить категорию
        </button>
      </div>

      <div className="grid gap-3 md:grid-cols-2">
        {categories.map(c => {
          const count = products.filter(p => p.categoryId === c.id).length;
          return (
            <div
              key={c.id}
              className="flex items-center gap-3 rounded-xl border border-line bg-white p-3"
            >
              <span
                className="flex h-12 w-12 items-center justify-center rounded-xl text-2xl"
                style={{ background: c.tint }}
              >
                {c.icon}
              </span>
              <div className="min-w-0 flex-1">
                <div className="font-semibold">{c.name}</div>
                <div className="text-[12px] text-ink-2">
                  {c.id} · {count} товаров {c.tagline ? `· ${c.tagline}` : ""}
                </div>
              </div>
              <div className="flex gap-1">
                <button
                  onClick={() => setEditing(c)}
                  className="rounded-md bg-paper px-3 py-1.5 text-[12px] font-semibold hover:bg-brand-light hover:text-brand"
                >
                  Изм.
                </button>
                <button
                  onClick={() => {
                    if (count > 0) {
                      alert(`Нельзя удалить — в категории ${count} товаров. Сначала перенесите их в другую категорию.`);
                      return;
                    }
                    if (confirm(`Удалить «${c.name}»?`)) removeCategory(c.id);
                  }}
                  className="rounded-md bg-paper px-3 py-1.5 text-[12px] hover:bg-discount/10 hover:text-discount"
                >
                  Удал.
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {editing && (
        <Editor
          category={editing}
          isNew={!categories.some(c => c.id === editing.id)}
          onClose={() => setEditing(null)}
          onSave={c => {
            if (categories.some(x => x.id === c.id)) {
              updateCategory(c.id, c);
            } else {
              addCategory(c);
            }
            setEditing(null);
          }}
        />
      )}
    </div>
  );
}

function Editor({
  category,
  isNew,
  onClose,
  onSave,
}: {
  category: Category;
  isNew: boolean;
  onClose(): void;
  onSave(c: Category): void;
}) {
  const [draft, setDraft] = useState(category);

  return (
    <div className="fixed inset-0 z-40 flex items-start justify-center overflow-y-auto bg-ink/60 p-4 md:p-8">
      <div className="w-full max-w-[520px] rounded-2xl bg-white p-5">
        <div className="mb-4 flex items-center">
          <h2 className="text-[18px] font-extrabold">
            {isNew ? "Новая категория" : `Редактирование · ${category.name}`}
          </h2>
          <button onClick={onClose} className="ml-auto text-ink-2 hover:text-discount">✕</button>
        </div>

        <div className="grid gap-3">
          <Field label="ID">
            <input
              value={draft.id}
              onChange={e => setDraft({ ...draft, id: e.target.value })}
              disabled={!isNew}
              className={inputCls}
            />
          </Field>
          <Field label="Название">
            <input
              value={draft.name}
              onChange={e => setDraft({ ...draft, name: e.target.value })}
              className={inputCls}
            />
          </Field>
          <Field label="Иконка (эмодзи)">
            <input
              value={draft.icon}
              onChange={e => setDraft({ ...draft, icon: e.target.value })}
              className={inputCls}
            />
          </Field>
          <Field label="Подзаголовок">
            <input
              value={draft.tagline ?? ""}
              onChange={e => setDraft({ ...draft, tagline: e.target.value })}
              className={inputCls}
            />
          </Field>
          <Field label="Цвет фона (HEX или CSS)">
            <div className="flex items-center gap-2">
              <input
                type="color"
                value={
                  draft.tint.match(/^#[0-9a-f]{6}$/i)
                    ? draft.tint
                    : "#e6efff"
                }
                onChange={e => setDraft({ ...draft, tint: e.target.value })}
                className="h-10 w-12 cursor-pointer rounded-lg border border-line"
              />
              <input
                value={draft.tint}
                onChange={e => setDraft({ ...draft, tint: e.target.value })}
                className={inputCls}
              />
            </div>
          </Field>
        </div>

        <div className="mt-5 flex justify-end gap-2">
          <button onClick={onClose} className="rounded-lg bg-paper px-4 py-2 text-[13px] font-semibold text-ink-2">
            Отмена
          </button>
          <button
            onClick={() => {
              if (!draft.name.trim()) {
                alert("Заполните название");
                return;
              }
              onSave(draft);
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
