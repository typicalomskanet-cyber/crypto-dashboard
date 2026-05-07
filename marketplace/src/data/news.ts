export interface NewsArticle {
  id: string;
  /** URL slug used in /#/news/{slug} */
  slug: string;
  title: string;
  /** ISO date string (YYYY-MM-DD) */
  date: string;
  /** Tagline shown in list previews */
  excerpt: string;
  /** Cover image URL */
  cover: string;
  /** Article body — paragraphs separated by blank lines */
  body: string;
  /** Optional tag, e.g. "Скидки", "Новинки" */
  tag?: string;
  /** Hidden articles aren't shown to users but stay editable in admin. */
  published: boolean;
}

export const DEFAULT_NEWS: NewsArticle[] = [
  {
    id: "n-1",
    slug: "open-yantach",
    title: "Yantach Shop открылся!",
    date: "2026-04-20",
    excerpt:
      "Запускаем каталог из тысяч товаров с переходом к покупке у крупнейших партнёров — Я.Маркет, Ozon, Wildberries, AliExpress.",
    cover:
      "https://images.unsplash.com/photo-1607082348824-0a96f2a4b9da?auto=format&fit=crop&w=1280&q=80",
    body:
      "Здравствуйте! Сегодня мы официально запускаем Yantach Shop — удобный каталог, который собирает в одном месте лучшие предложения от проверенных партнёров.\n\nВ каталоге уже более шестидесяти товаров в двенадцати категориях: электроника, бытовая техника, одежда, дом и сад, красота, спорт, детям, авто, книги, зоо, продукты, игры и хобби.\n\nДля покупки вы перейдёте на сайт партнёра — Я.Маркет, Ozon или Wildberries. Условия доставки и оплаты определяет партнёр.",
    tag: "Открытие",
    published: true,
  },
  {
    id: "n-2",
    slug: "spring-sale-2026",
    title: "Весенняя распродажа: скидки до 50%",
    date: "2026-04-22",
    excerpt:
      "Тысячи товаров со скидками — от смартфонов до настольных игр. Условия — у партнёров, переход в один клик.",
    cover:
      "https://images.unsplash.com/photo-1607083206869-4c7672e72a8a?auto=format&fit=crop&w=1280&q=80",
    body:
      "В разделах «Электроника», «Дом и сад» и «Красота» появились акционные цены. Берите смартфоны, аромадиффузоры и кастрюли по сниженным ценам — все ссылки ведут напрямую на партнёрские страницы.\n\nЛучшее время — это сейчас: некоторые позиции уже разлетаются.",
    tag: "Скидки",
    published: true,
  },
  {
    id: "n-3",
    slug: "how-to-install-pwa",
    title: "Как установить Yantach Shop на телефон",
    date: "2026-04-25",
    excerpt:
      "Поставьте магазин как приложение и открывайте его одним тапом. Работает на Android и iOS.",
    cover:
      "https://images.unsplash.com/photo-1512941937669-90a1b58e7e9c?auto=format&fit=crop&w=1280&q=80",
    body:
      "Android (Chrome): откройте сайт, нажмите меню «три точки» в правом верхнем углу и выберите «Установить приложение».\n\niPhone (Safari): откройте сайт, нажмите кнопку «Поделиться» и выберите «На экран Домой».\n\nПосле этого Yantach Shop появится среди ваших приложений и будет открываться в полноэкранном режиме без адресной строки.",
    tag: "Гайд",
    published: true,
  },
];
