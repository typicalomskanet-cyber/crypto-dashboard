import { useNews } from "../lib/catalog";
import { buildHref } from "../App";
import { formatDate } from "../lib/format";

export function NewsListPage() {
  const articles = useNews();

  return (
    <div className="mx-auto max-w-[1320px] px-3 py-4 md:px-4 md:py-8">
      <header className="mb-6">
        <div className="text-[12px] font-semibold uppercase tracking-wide text-ink-2">
          📰 Блог Yantach Shop
        </div>
        <h1 className="mt-1 text-[26px] font-extrabold md:text-[36px]">
          Новости и обновления
        </h1>
        <p className="mt-1 max-w-[640px] text-[14px] text-ink-2">
          Свежие подборки, акции от партнёров и гайды — обо всём, что помогает
          тебе покупать выгоднее.
        </p>
      </header>

      {articles.length === 0 ? (
        <div className="rounded-2xl border border-line bg-white p-8 text-center text-ink-2">
          Пока нет ни одной публикации.
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {articles.map(n => (
            <a
              key={n.id}
              href={buildHref({ name: "newsArticle", slug: n.slug })}
              className="group flex flex-col overflow-hidden rounded-2xl border border-line bg-white transition hover:-translate-y-0.5 hover:shadow-lg"
            >
              <div className="aspect-[16/9] overflow-hidden bg-paper">
                <img
                  src={n.cover}
                  alt={n.title}
                  loading="lazy"
                  className="h-full w-full object-cover transition duration-500 group-hover:scale-105"
                />
              </div>
              <div className="flex flex-1 flex-col gap-2 p-4">
                <div className="flex items-center gap-2 text-[12px] text-ink-2">
                  {n.tag && (
                    <span className="rounded-full bg-brand-light px-2 py-0.5 text-[11px] font-semibold text-brand">
                      {n.tag}
                    </span>
                  )}
                  <time dateTime={n.date}>{formatDate(n.date)}</time>
                </div>
                <h2 className="text-[17px] font-extrabold leading-snug group-hover:text-brand">
                  {n.title}
                </h2>
                <p className="clamp-3 text-[13px] leading-relaxed text-ink-2">
                  {n.excerpt}
                </p>
                <span className="mt-auto inline-flex items-center gap-1 text-[13px] font-semibold text-brand">
                  Читать дальше →
                </span>
              </div>
            </a>
          ))}
        </div>
      )}
    </div>
  );
}
