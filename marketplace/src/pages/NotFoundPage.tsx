import { useCategories } from "../lib/catalog";
import { buildHref } from "../App";

export function NotFoundPage() {
  const cats = useCategories().slice(0, 6);
  return (
    <div className="mx-auto max-w-[720px] px-4 py-12 text-center">
      <div className="text-[80px] leading-none">🛒</div>
      <h1 className="mt-3 text-[28px] font-extrabold md:text-[36px]">Страница не найдена</h1>
      <p className="mt-2 text-ink-2">
        Возможно, ссылка устарела или вы перешли по неверному адресу.
      </p>
      <div className="mt-6 flex flex-wrap items-center justify-center gap-2">
        <a
          href={buildHref({ name: "home" })}
          className="flex h-11 items-center rounded-xl bg-brand px-5 font-semibold text-white hover:bg-brand-dark"
        >
          На главную
        </a>
        <a
          href={buildHref({ name: "favorites" })}
          className="flex h-11 items-center rounded-xl border border-line bg-white px-5 font-semibold text-ink-2 hover:text-ink"
        >
          Избранное
        </a>
      </div>
      {cats.length > 0 && (
        <div className="mt-10">
          <div className="mb-3 text-[12px] font-semibold uppercase tracking-wide text-ink-2">
            Популярные категории
          </div>
          <div className="flex flex-wrap justify-center gap-2">
            {cats.map(c => (
              <a
                key={c.id}
                href={buildHref({ name: "category", id: c.id })}
                className="flex items-center gap-2 rounded-xl border border-line bg-white px-3 py-2 text-sm hover:border-brand hover:bg-brand-light"
              >
                <span className="text-lg">{c.icon}</span>
                {c.name}
              </a>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
