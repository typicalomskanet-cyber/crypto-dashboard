import { useState } from "react";
import { useCatalog } from "../lib/catalog";
import type { NewsArticle } from "../data/news";
import { Field, inputCls, textareaCls } from "./AdminApp";
import { formatDate } from "../lib/format";

export function NewsTab() {
  const { news, addNews, updateNews, removeNews } = useCatalog();
  const [editing, setEditing] = useState<NewsArticle | null>(null);

  function handleNew() {
    const id = `n-${Date.now()}`;
    setEditing({
      id,
      slug: `news-${Date.now()}`,
      title: "",
      date: new Date().toISOString().slice(0, 10),
      excerpt: "",
      cover: "",
      body: "",
      tag: "",
      published: true,
    });
  }

  const sorted = [...news].sort((a, b) => (a.date < b.date ? 1 : -1));

  return (
    <div>
      <div className="mb-4 flex flex-wrap items-center gap-2">
        <h1 className="text-[20px] font-extrabold">Новости</h1>
        <span className="text-[12px] text-ink-2">всего: {news.length}</span>
        <button
          onClick={handleNew}
          className="ml-auto flex h-10 items-center rounded-lg bg-brand px-4 text-[13px] font-semibold text-white hover:bg-brand-dark"
        >
          + Новая статья
        </button>
      </div>

      <div className="space-y-3">
        {sorted.map(n => (
          <div
            key={n.id}
            className="flex items-start gap-3 rounded-xl border border-line bg-white p-3"
          >
            <div className="aspect-[4/3] w-28 shrink-0 overflow-hidden rounded-lg bg-paper">
              {n.cover && <img src={n.cover} alt="" className="h-full w-full object-cover" />}
            </div>
            <div className="min-w-0 flex-1">
              <div className="flex flex-wrap items-center gap-2">
                <span className="font-semibold">{n.title || "(без названия)"}</span>
                {!n.published && (
                  <span className="rounded-full bg-discount/10 px-2 py-0.5 text-[11px] font-semibold text-discount">
                    Черновик
                  </span>
                )}
                {n.tag && (
                  <span className="rounded-full bg-brand-light px-2 py-0.5 text-[11px] font-semibold text-brand">
                    {n.tag}
                  </span>
                )}
              </div>
              <div className="text-[12px] text-ink-2">
                {formatDate(n.date)} · /#/news/{n.slug}
              </div>
              <p className="clamp-2 mt-1 text-[12px] text-ink-2">{n.excerpt}</p>
            </div>
            <div className="flex flex-col gap-1">
              <button
                onClick={() => setEditing(n)}
                className="rounded-md bg-paper px-3 py-1.5 text-[12px] font-semibold hover:bg-brand-light hover:text-brand"
              >
                Изм.
              </button>
              <button
                onClick={() => updateNews(n.id, { published: !n.published })}
                className="rounded-md bg-paper px-3 py-1.5 text-[12px] hover:bg-brand-light hover:text-brand"
              >
                {n.published ? "Скрыть" : "Опубл."}
              </button>
              <button
                onClick={() => {
                  if (confirm(`Удалить «${n.title}»?`)) removeNews(n.id);
                }}
                className="rounded-md bg-paper px-3 py-1.5 text-[12px] hover:bg-discount/10 hover:text-discount"
              >
                Удал.
              </button>
            </div>
          </div>
        ))}
        {sorted.length === 0 && (
          <div className="rounded-xl border border-dashed border-line p-6 text-center text-ink-2">
            Пока нет ни одной статьи. Нажмите «Новая статья», чтобы создать.
          </div>
        )}
      </div>

      {editing && (
        <Editor
          article={editing}
          isNew={!news.some(n => n.id === editing.id)}
          onClose={() => setEditing(null)}
          onSave={n => {
            if (news.some(x => x.id === n.id)) {
              updateNews(n.id, n);
            } else {
              addNews(n);
            }
            setEditing(null);
          }}
        />
      )}
    </div>
  );
}

function Editor({
  article,
  isNew,
  onClose,
  onSave,
}: {
  article: NewsArticle;
  isNew: boolean;
  onClose(): void;
  onSave(n: NewsArticle): void;
}) {
  const [draft, setDraft] = useState(article);

  return (
    <div className="fixed inset-0 z-40 flex items-start justify-center overflow-y-auto bg-ink/60 p-4 md:p-8">
      <div className="w-full max-w-[760px] rounded-2xl bg-white p-5">
        <div className="mb-4 flex items-center">
          <h2 className="text-[18px] font-extrabold">
            {isNew ? "Новая статья" : `Редактирование · ${article.title || article.id}`}
          </h2>
          <button onClick={onClose} className="ml-auto text-ink-2 hover:text-discount">✕</button>
        </div>

        <div className="grid gap-3 md:grid-cols-2">
          <Field label="ID"><input value={draft.id} disabled={!isNew} onChange={e => setDraft({ ...draft, id: e.target.value })} className={inputCls} /></Field>
          <Field label="Slug (для URL)" hint="latin, без пробелов">
            <input value={draft.slug} onChange={e => setDraft({ ...draft, slug: e.target.value })} className={inputCls} />
          </Field>
          <div className="md:col-span-2">
            <Field label="Заголовок"><input value={draft.title} onChange={e => setDraft({ ...draft, title: e.target.value })} className={inputCls} /></Field>
          </div>
          <Field label="Дата"><input type="date" value={draft.date} onChange={e => setDraft({ ...draft, date: e.target.value })} className={inputCls} /></Field>
          <Field label="Тег (метка)"><input value={draft.tag ?? ""} onChange={e => setDraft({ ...draft, tag: e.target.value })} className={inputCls} placeholder="Скидки, Новинки, Гайд" /></Field>
          <div className="md:col-span-2">
            <Field label="Обложка (URL)"><input value={draft.cover} onChange={e => setDraft({ ...draft, cover: e.target.value })} className={inputCls} placeholder="https://..." /></Field>
          </div>
          <div className="md:col-span-2">
            <Field label="Превью (excerpt)" hint="1–2 предложения для списка">
              <textarea value={draft.excerpt} onChange={e => setDraft({ ...draft, excerpt: e.target.value })} className={textareaCls} />
            </Field>
          </div>
          <div className="md:col-span-2">
            <Field label="Текст статьи" hint="абзацы разделяйте пустой строкой">
              <textarea value={draft.body} onChange={e => setDraft({ ...draft, body: e.target.value })} className={textareaCls + " min-h-[260px]"} />
            </Field>
          </div>
          <div className="md:col-span-2">
            <label className="flex items-center gap-2 text-[13px]">
              <input
                type="checkbox"
                checked={draft.published}
                onChange={e => setDraft({ ...draft, published: e.target.checked })}
                className="h-4 w-4 accent-brand"
              />
              Опубликовать (виден на сайте)
            </label>
          </div>
        </div>

        <div className="mt-5 flex justify-end gap-2">
          <button onClick={onClose} className="rounded-lg bg-paper px-4 py-2 text-[13px] font-semibold text-ink-2">Отмена</button>
          <button
            onClick={() => {
              if (!draft.title.trim()) { alert("Заполните заголовок"); return; }
              if (!draft.slug.trim()) { alert("Заполните slug"); return; }
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
