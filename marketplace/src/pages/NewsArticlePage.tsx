import { useNews, useNewsBySlug } from "../lib/catalog";
import { buildHref } from "../App";
import { formatDate } from "../lib/format";

export function NewsArticlePage({ slug }: { slug: string }) {
  const article = useNewsBySlug(slug);
  const all = useNews();
  const others = all.filter(n => n.slug !== slug).slice(0, 3);

  if (!article) {
    return (
      <div className="mx-auto max-w-[800px] px-4 py-10">
        <div className="rounded-2xl bg-white p-10 text-center">
          <div className="mb-3 text-5xl">🤔</div>
          <div className="text-lg font-bold">Статья не найдена</div>
          <div className="mt-2 text-sm text-ink-2">
            Возможно, она была удалена или ещё не опубликована.
          </div>
          <a
            href={buildHref({ name: "news" })}
            className="mt-5 inline-flex h-11 items-center rounded-xl bg-brand px-5 font-semibold text-white hover:bg-brand-dark"
          >
            Все новости
          </a>
        </div>
      </div>
    );
  }

  const paragraphs = article.body.split(/\n{2,}/g);

  return (
    <div className="mx-auto max-w-[820px] px-3 py-4 md:px-4 md:py-8">
      <nav className="mb-3 flex flex-wrap items-center gap-1 text-[12px] text-ink-2">
        <a href={buildHref({ name: "home" })} className="hover:text-brand">Главная</a>
        <span className="opacity-50">/</span>
        <a href={buildHref({ name: "news" })} className="hover:text-brand">Новости</a>
        <span className="opacity-50">/</span>
        <span className="clamp-1 max-w-[60vw] text-ink">{article.title}</span>
      </nav>

      <article className="overflow-hidden rounded-2xl border border-line bg-white">
        <div className="aspect-[16/8] w-full overflow-hidden bg-paper">
          <img
            src={article.cover}
            alt={article.title}
            className="h-full w-full object-cover"
          />
        </div>
        <div className="p-5 md:p-8">
          <div className="mb-2 flex items-center gap-2 text-[12px] text-ink-2">
            {article.tag && (
              <span className="rounded-full bg-brand-light px-2 py-0.5 text-[11px] font-semibold text-brand">
                {article.tag}
              </span>
            )}
            <time dateTime={article.date}>{formatDate(article.date)}</time>
          </div>
          <h1 className="text-[24px] font-extrabold leading-tight md:text-[32px]">
            {article.title}
          </h1>
          <div className="mt-4 space-y-4 text-[15px] leading-relaxed text-ink">
            {paragraphs.map((p, i) => (
              <p key={i}>{p}</p>
            ))}
          </div>
        </div>
      </article>

      {others.length > 0 && (
        <section className="mt-10">
          <h2 className="mb-3 text-[18px] font-extrabold md:text-[22px]">
            Другие новости
          </h2>
          <div className="grid gap-3 md:grid-cols-3">
            {others.map(o => (
              <a
                key={o.id}
                href={buildHref({ name: "newsArticle", slug: o.slug })}
                className="group flex gap-3 rounded-2xl border border-line bg-white p-3 transition hover:shadow-md"
              >
                <div className="aspect-square w-20 shrink-0 overflow-hidden rounded-lg bg-paper">
                  <img src={o.cover} alt="" className="h-full w-full object-cover" />
                </div>
                <div className="flex flex-col">
                  <div className="text-[11px] text-ink-2">{formatDate(o.date)}</div>
                  <div className="clamp-2 text-[13px] font-semibold leading-snug group-hover:text-brand">
                    {o.title}
                  </div>
                </div>
              </a>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
