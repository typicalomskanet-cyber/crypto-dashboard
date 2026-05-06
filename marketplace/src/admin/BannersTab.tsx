import { useState } from "react";
import { useCatalog } from "../lib/catalog";
import type { Banner } from "../data/banners";
import { Field, inputCls, textareaCls } from "./AdminApp";

export function BannersTab() {
  const { banners, addBanner, updateBanner, removeBanner } = useCatalog();
  const [editing, setEditing] = useState<Banner | null>(null);

  function handleNew() {
    setEditing({
      id: `b-${Date.now()}`,
      title: "",
      subtitle: "",
      pill: "",
      ctaText: "Перейти",
      ctaHref: "#/",
      bg: "linear-gradient(135deg, #0050e0 0%, #1d8bff 100%)",
      emoji: "✨",
    });
  }

  return (
    <div>
      <div className="mb-4 flex flex-wrap items-center gap-2">
        <h1 className="text-[20px] font-extrabold">Баннеры главной</h1>
        <span className="text-[12px] text-ink-2">всего: {banners.length}</span>
        <button
          onClick={handleNew}
          className="ml-auto flex h-10 items-center rounded-lg bg-brand px-4 text-[13px] font-semibold text-white hover:bg-brand-dark"
        >
          + Добавить баннер
        </button>
      </div>

      <div className="space-y-3">
        {banners.map(b => (
          <div key={b.id} className="overflow-hidden rounded-2xl border border-line bg-white">
            <div
              className="flex min-h-[120px] items-center px-5 py-4 text-white"
              style={{ background: b.bg }}
            >
              <div className="flex-1">
                {b.pill && (
                  <div className="mb-1 inline-flex rounded-full bg-white/20 px-2 py-0.5 text-[11px] font-medium">
                    {b.pill}
                  </div>
                )}
                <div className="text-[18px] font-extrabold leading-tight">{b.title}</div>
                {b.subtitle && (
                  <div className="text-[13px] text-white/85">{b.subtitle}</div>
                )}
              </div>
              {b.emoji && <div className="select-none text-4xl opacity-50">{b.emoji}</div>}
            </div>
            <div className="flex items-center gap-2 border-t border-line p-2">
              <span className="text-[12px] text-ink-2 truncate">CTA: {b.ctaText} → {b.ctaHref}</span>
              <div className="ml-auto flex gap-1">
                <button
                  onClick={() => setEditing(b)}
                  className="rounded-md bg-paper px-3 py-1.5 text-[12px] font-semibold hover:bg-brand-light hover:text-brand"
                >
                  Изм.
                </button>
                <button
                  onClick={() => {
                    if (confirm(`Удалить «${b.title}»?`)) removeBanner(b.id);
                  }}
                  className="rounded-md bg-paper px-3 py-1.5 text-[12px] hover:bg-discount/10 hover:text-discount"
                >
                  Удал.
                </button>
              </div>
            </div>
          </div>
        ))}
        {banners.length === 0 && (
          <div className="rounded-xl border border-dashed border-line p-6 text-center text-ink-2">
            Нет баннеров. Главная страница покажется без hero-карусели.
          </div>
        )}
      </div>

      {editing && (
        <Editor
          banner={editing}
          isNew={!banners.some(b => b.id === editing.id)}
          onClose={() => setEditing(null)}
          onSave={b => {
            if (banners.some(x => x.id === b.id)) {
              updateBanner(b.id, b);
            } else {
              addBanner(b);
            }
            setEditing(null);
          }}
        />
      )}
    </div>
  );
}

function Editor({
  banner,
  isNew,
  onClose,
  onSave,
}: {
  banner: Banner;
  isNew: boolean;
  onClose(): void;
  onSave(b: Banner): void;
}) {
  const [draft, setDraft] = useState(banner);

  return (
    <div className="fixed inset-0 z-40 flex items-start justify-center overflow-y-auto bg-ink/60 p-4 md:p-8">
      <div className="w-full max-w-[640px] rounded-2xl bg-white p-5">
        <div className="mb-4 flex items-center">
          <h2 className="text-[18px] font-extrabold">
            {isNew ? "Новый баннер" : `Редактирование · ${banner.title}`}
          </h2>
          <button onClick={onClose} className="ml-auto text-ink-2 hover:text-discount">✕</button>
        </div>

        <div className="mb-4 overflow-hidden rounded-xl">
          <div
            className="min-h-[120px] px-5 py-4 text-white"
            style={{ background: draft.bg }}
          >
            {draft.pill && (
              <div className="mb-1 inline-flex rounded-full bg-white/20 px-2 py-0.5 text-[11px]">
                {draft.pill}
              </div>
            )}
            <div className="text-[20px] font-extrabold">{draft.title || "Заголовок"}</div>
            {draft.subtitle && <div className="text-[13px] text-white/85">{draft.subtitle}</div>}
          </div>
        </div>

        <div className="grid gap-3 md:grid-cols-2">
          <Field label="ID"><input value={draft.id} disabled={!isNew} onChange={e => setDraft({ ...draft, id: e.target.value })} className={inputCls} /></Field>
          <Field label="Эмодзи (фоновый)"><input value={draft.emoji ?? ""} onChange={e => setDraft({ ...draft, emoji: e.target.value })} className={inputCls} /></Field>
          <Field label="Pill (мини-плашка)"><input value={draft.pill ?? ""} onChange={e => setDraft({ ...draft, pill: e.target.value })} className={inputCls} /></Field>
          <Field label="Текст кнопки"><input value={draft.ctaText} onChange={e => setDraft({ ...draft, ctaText: e.target.value })} className={inputCls} /></Field>
          <div className="md:col-span-2">
            <Field label="Заголовок"><input value={draft.title} onChange={e => setDraft({ ...draft, title: e.target.value })} className={inputCls} /></Field>
          </div>
          <div className="md:col-span-2">
            <Field label="Подзаголовок"><input value={draft.subtitle ?? ""} onChange={e => setDraft({ ...draft, subtitle: e.target.value })} className={inputCls} /></Field>
          </div>
          <div className="md:col-span-2">
            <Field label="Ссылка кнопки" hint="например #/c/electronics или https://..."><input value={draft.ctaHref} onChange={e => setDraft({ ...draft, ctaHref: e.target.value })} className={inputCls} /></Field>
          </div>
          <div className="md:col-span-2">
            <Field label="Фон (CSS gradient или цвет)" hint="например linear-gradient(...)">
              <textarea value={draft.bg} onChange={e => setDraft({ ...draft, bg: e.target.value })} className={textareaCls} />
            </Field>
          </div>
        </div>

        <div className="mt-5 flex justify-end gap-2">
          <button onClick={onClose} className="rounded-lg bg-paper px-4 py-2 text-[13px] font-semibold text-ink-2">Отмена</button>
          <button
            onClick={() => {
              if (!draft.title.trim()) { alert("Заполните заголовок"); return; }
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
