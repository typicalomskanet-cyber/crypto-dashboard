import { CATEGORIES } from "../data/categories";
import { buildHref } from "../App";

export function Footer() {
  return (
    <footer className="mt-16 border-t border-line bg-white">
      <div className="mx-auto grid max-w-[1320px] grid-cols-1 gap-8 px-4 py-10 md:grid-cols-4">
        <div>
          <div className="mb-3 text-[15px] font-extrabold text-ink">Yantach Shop</div>
          <p className="text-[13px] leading-relaxed text-ink-2">
            Каталог товаров с переходом к покупке у проверенных партнёров —
            Яндекс.Маркет, Ozon, Wildberries и др. Цены актуальны на момент
            публикации, фактическая стоимость показывается на сайте партнёра.
          </p>
        </div>

        <div>
          <div className="mb-3 text-[13px] font-semibold uppercase tracking-wide text-ink-2">
            Категории
          </div>
          <ul className="space-y-2 text-[14px]">
            {CATEGORIES.slice(0, 6).map(c => (
              <li key={c.id}>
                <a
                  href={buildHref({ name: "category", id: c.id })}
                  className="hover:text-brand"
                >
                  {c.icon} {c.name}
                </a>
              </li>
            ))}
          </ul>
        </div>

        <div>
          <div className="mb-3 text-[13px] font-semibold uppercase tracking-wide text-ink-2">
            Покупателям
          </div>
          <ul className="space-y-2 text-[14px]">
            <li>Доставка и оплата</li>
            <li>Гарантия и возврат</li>
            <li>Программа лояльности</li>
            <li>Бонусы и скидки</li>
          </ul>
        </div>

        <div>
          <div className="mb-3 text-[13px] font-semibold uppercase tracking-wide text-ink-2">
            О компании
          </div>
          <ul className="space-y-2 text-[14px]">
            <li>О Yantach Shop</li>
            <li>Партнёрская программа</li>
            <li>Контакты</li>
            <li>Договор-оферта</li>
          </ul>
        </div>
      </div>

      <div className="border-t border-line">
        <div className="mx-auto flex max-w-[1320px] flex-col items-start justify-between gap-2 px-4 py-4 text-[12px] text-ink-2 sm:flex-row sm:items-center">
          <div>© {new Date().getFullYear()} Yantach Shop · Все права защищены</div>
          <div>
            При переходе к покупке вы попадаете на сайт партнёра. Условия покупки
            определяются партнёром.
          </div>
        </div>
      </div>
    </footer>
  );
}
