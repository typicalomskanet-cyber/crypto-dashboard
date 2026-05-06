import type { Product } from "./types";

/** Real Yandex Market affiliate URL provided by the user — used as the
 *  default partner link for products that don't have a more specific one. */
export const DEFAULT_AFFILIATE_URL = "https://market.yandex.ru/cc/9NW947";

const u = (id: string) => `https://images.unsplash.com/${id}?auto=format&fit=crop&w=720&q=80`;

/**
 * Hand-picked Unsplash product photo IDs grouped by category. Reused across
 * multiple products in the same category; the seed product index drives the
 * rotation so cards look consistent on every render.
 */
const PHOTO_BY_CATEGORY: Record<string, string[]> = {
  electronics: [
    "photo-1511707171634-5f897ff02aa9", // iphone
    "photo-1606813907291-d86efa9b94db", // headphones
    "photo-1593642632559-0c6d3fc62b89", // laptop
    "photo-1603899122634-f086ca5f5ddd", // smart watch
    "photo-1572569511254-d8f925fe2cbb", // tablet
    "photo-1546435770-a3e426bf472b", // headphones2
    "photo-1546054454-aa26e2b734c7", // keyboard
    "photo-1517336714731-489689fd1ca8", // workspace
  ],
  appliances: [
    "photo-1556909114-f6e7ad7d3136", // mixer
    "photo-1585238342024-78d387f4a707", // kettle
    "photo-1574269909862-7e1d70bb8078", // microwave
    "photo-1558618666-fcd25c85cd64", // washing machine
    "photo-1571175443880-49e1d25b2bc5", // toaster
    "photo-1581275288578-bff6580eb24a", // vacuum
  ],
  fashion: [
    "photo-1539008835657-9e8e9680c956", // jacket
    "photo-1542272604-787c3835535d", // jeans
    "photo-1556905055-8f358a7a47b2", // sneakers
    "photo-1591047139829-d91aecb6caea", // dress
    "photo-1593030103066-0093718efeb9", // sweater
    "photo-1521572163474-6864f9cf17ab", // tshirt
    "photo-1551028719-00167b16eac5", // boots
  ],
  home: [
    "photo-1555041469-a586c61ea9bc", // sofa
    "photo-1493663284031-b7e3aefcae8e", // chair
    "photo-1567538096630-e0c55bd6374c", // lamp
    "photo-1505691938895-1758d7feb511", // bedside
    "photo-1524758631624-e2822e304c36", // shelf
    "photo-1513694203232-719a280e022f", // pillow
  ],
  beauty: [
    "photo-1596462502278-27bfdc403348", // makeup
    "photo-1571781926291-c477ebfd024b", // perfume
    "photo-1588405748880-12d1d2a59d75", // skincare
    "photo-1522335789203-aaa2f7ac3a91", // lipstick
    "photo-1503236823255-94609f598e71", // brush
  ],
  sport: [
    "photo-1517649763962-0c623066013b", // dumbbells
    "photo-1571902943202-507ec2618e8f", // running
    "photo-1517466787929-bc90951d0974", // yoga mat
    "photo-1599058917765-a780eda07a3e", // tennis
    "photo-1571019613454-1cb2f99b2d8b", // gym
  ],
  kids: [
    "photo-1566576912321-d58ddd7a6088", // teddy bear
    "photo-1518791841217-8f162f1e1131", // baby
    "photo-1503454537195-1dcabb73ffb9", // legos
    "photo-1596461404969-9ae70f2830c1", // toys
    "photo-1574266965598-733971091cab", // crib
  ],
  auto: [
    "photo-1503376780353-7e6692767b70", // car
    "photo-1542362567-b07e54358753", // tools
    "photo-1492144534655-ae79c964c9d7", // tires
    "photo-1556800572-1b8aedf82dba", // dashcam
  ],
  books: [
    "photo-1512820790803-83ca734da794", // book
    "photo-1495446815901-a7297e633e8d", // book stack
    "photo-1544947950-fa07a98d237f", // open book
    "photo-1516979187457-637abb4f9353", // shelf
  ],
  pets: [
    "photo-1583337130417-3346a1be7dee", // cat food
    "photo-1601758228041-f3b2795255f1", // dog
    "photo-1574144611937-0df059b5ef3e", // cat
    "photo-1571566882372-1598d88abd90", // pet bowl
  ],
  groceries: [
    "photo-1542838132-92c53300491e", // groceries
    "photo-1506617420156-8e4536971650", // veggies
    "photo-1567306226416-28f0efdc88ce", // bottles
    "photo-1490818387583-1baba5e638af", // fruit
  ],
  toys: [
    "photo-1606092195730-5d7b9af1efc5", // boardgame
    "photo-1611996575749-79a3a250f948", // chess
    "photo-1584286595398-a59e47a7395d", // lego
    "photo-1606107557195-0e29a4b5b4aa", // puzzle
  ],
};

interface Seed {
  title: string;
  brand: string;
  description: string;
  categoryId: string;
  price: number;
  oldPrice?: number;
  rating: number;
  reviewCount: number;
  badges?: Product["badges"];
  specs?: Product["specs"];
  partnerUrl?: string;
  partner?: Product["partner"];
  stock?: string;
}

const RAW: Seed[] = [
  // === ELECTRONICS ===
  {
    title: "Смартфон Apple iPhone 15 Pro 256 ГБ Titanium",
    brand: "Apple",
    description:
      "Флагман с титановым корпусом, чипом A17 Pro и системой камер Pro с 48 МП основным сенсором.",
    categoryId: "electronics", price: 119990, oldPrice: 134990,
    rating: 4.9, reviewCount: 4218,
    badges: ["bestseller", "freeShip"],
    specs: [
      { name: "Диагональ", value: "6.1\"" },
      { name: "Память", value: "256 ГБ" },
      { name: "Процессор", value: "Apple A17 Pro" },
      { name: "Камера", value: "48 + 12 + 12 МП" },
    ],
    partnerUrl: "https://market.yandex.ru/cc/9NW947",
    partner: "yandex",
    stock: "На складе",
  },
  {
    title: "Ноутбук ASUS Vivobook 16X OLED Ryzen 7 16/512 ГБ",
    brand: "ASUS",
    description: "Ноутбук с матовым OLED-экраном 16 дюймов, 8-ядерным Ryzen 7 и 512 ГБ NVMe SSD.",
    categoryId: "electronics", price: 79990, oldPrice: 95990,
    rating: 4.7, reviewCount: 942,
    badges: ["express"],
  },
  {
    title: "Беспроводные наушники Sony WH-1000XM5",
    brand: "Sony",
    description: "Премиум-наушники с активным шумоподавлением, 30 ч автономности и адаптивным звуком.",
    categoryId: "electronics", price: 32990, oldPrice: 39990,
    rating: 4.8, reviewCount: 2780, badges: ["bestseller"],
  },
  {
    title: "Телевизор Samsung QLED 55\" 4K Smart TV",
    brand: "Samsung",
    description: "QLED-телевизор 55\" с поддержкой HDR10+, Tizen OS и квантовым процессором 4K.",
    categoryId: "electronics", price: 89990, rating: 4.6, reviewCount: 537,
  },
  {
    title: "Планшет Xiaomi Pad 6 8/256 ГБ",
    brand: "Xiaomi",
    description: "Планшет 11\" 144 Гц, Snapdragon 870, 4 динамика Dolby Atmos и батарея 8840 мАч.",
    categoryId: "electronics", price: 32990, oldPrice: 39990,
    rating: 4.7, reviewCount: 1198, badges: ["new"],
  },
  {
    title: "Умные часы Apple Watch Series 9 GPS 41mm",
    brand: "Apple",
    description: "Часы с чипом S9, ярче-всегда дисплеем 2000 нит и жестом Double Tap.",
    categoryId: "electronics", price: 39990, rating: 4.8, reviewCount: 1502,
  },
  {
    title: "Игровая приставка Sony PlayStation 5 Slim Disc",
    brand: "Sony",
    description: "Тонкая ревизия PS5 со съёмным дисководом и SSD 1 ТБ.",
    categoryId: "electronics", price: 54990, oldPrice: 59990,
    rating: 4.9, reviewCount: 3420, badges: ["bestseller", "freeShip"],
  },
  {
    title: "Колонка JBL Charge 5 Bluetooth",
    brand: "JBL",
    description: "Портативная колонка IP67 с автономностью до 20 часов и функцией PowerBank.",
    categoryId: "electronics", price: 12990, oldPrice: 16990,
    rating: 4.7, reviewCount: 2210,
  },

  // === APPLIANCES ===
  {
    title: "Робот-пылесос Roborock S8 Pro Ultra",
    brand: "Roborock",
    description: "Флагман со станцией самоочистки, лидаром и влажной уборкой с подогревом воды.",
    categoryId: "appliances", price: 109990, oldPrice: 129990,
    rating: 4.8, reviewCount: 856, badges: ["bestseller"],
  },
  {
    title: "Кофемашина De'Longhi Magnifica Evo",
    brand: "De'Longhi",
    description: "Автоматическая кофемашина с капучинатором и кофемолкой из закалённой стали.",
    categoryId: "appliances", price: 64990, rating: 4.7, reviewCount: 423,
  },
  {
    title: "Стиральная машина LG F2T3HS6S 7 кг",
    brand: "LG",
    description: "Стиральная машина с инверторным двигателем, паром Steam и 7 кг загрузки.",
    categoryId: "appliances", price: 39990, oldPrice: 47990, rating: 4.6, reviewCount: 612,
  },
  {
    title: "Холодильник Bosch KGN39VW25R",
    brand: "Bosch",
    description: "Двухкамерный холодильник No Frost с инверторным компрессором.",
    categoryId: "appliances", price: 64990, rating: 4.7, reviewCount: 244,
  },
  {
    title: "Микроволновая печь Samsung MS23K3614",
    brand: "Samsung",
    description: "СВЧ 23 л с керамическим покрытием и 6 уровнями мощности.",
    categoryId: "appliances", price: 8990, oldPrice: 11990, rating: 4.5, reviewCount: 388,
  },
  {
    title: "Электрочайник Tefal KO851",
    brand: "Tefal",
    description: "Чайник 1.7 л со скрытой спиралью и подсветкой колбы.",
    categoryId: "appliances", price: 3490, rating: 4.6, reviewCount: 511,
  },

  // === FASHION ===
  {
    title: "Кроссовки Nike Air Max 270",
    brand: "Nike",
    description: "Лёгкие кроссовки с подушкой Air Max 270 и сетчатым верхом для бега и города.",
    categoryId: "fashion", price: 11990, oldPrice: 14990, rating: 4.7, reviewCount: 1820,
    badges: ["bestseller"],
  },
  {
    title: "Зимняя куртка Columbia Powder Lite Hooded",
    brand: "Columbia",
    description: "Утеплённая куртка с технологией Omni-Heat и водоотталкивающим покрытием.",
    categoryId: "fashion", price: 14990, oldPrice: 18990, rating: 4.8, reviewCount: 612,
  },
  {
    title: "Джинсы Levi's 511 Slim Fit",
    brand: "Levi's", description: "Слим-джинсы с эластаном и фирменной кожаной нашивкой.",
    categoryId: "fashion", price: 7490, rating: 4.5, reviewCount: 740,
  },
  {
    title: "Платье H&M миди-длины с принтом",
    brand: "H&M", description: "Лёгкое летнее платье из вискозы с цветочным принтом.",
    categoryId: "fashion", price: 3290, oldPrice: 4290, rating: 4.4, reviewCount: 240,
  },
  {
    title: "Свитер Tommy Hilfiger из мериноса",
    brand: "Tommy Hilfiger",
    description: "Тонкий мужской свитер из 100% мериносовой шерсти.",
    categoryId: "fashion", price: 12990, rating: 4.6, reviewCount: 188, badges: ["new"],
  },
  {
    title: "Кеды Converse Chuck Taylor All Star",
    brand: "Converse", description: "Классические высокие кеды из плотного канваса.",
    categoryId: "fashion", price: 7490, rating: 4.7, reviewCount: 3120,
  },
  {
    title: "Ботинки Timberland 6-Inch Premium",
    brand: "Timberland", description: "Зимние водоотталкивающие ботинки из премиальной нубуковой кожи.",
    categoryId: "fashion", price: 19990, oldPrice: 24990, rating: 4.8, reviewCount: 472,
  },

  // === HOME ===
  {
    title: "Диван угловой IKEA Friheten",
    brand: "IKEA", description: "Раскладной угловой диван с ящиком для хранения, тёмно-серая обивка.",
    categoryId: "home", price: 49990, oldPrice: 59990, rating: 4.6, reviewCount: 1822,
    badges: ["bestseller"],
  },
  {
    title: "Кресло компьютерное Hoff Magnus",
    brand: "Hoff", description: "Эргономичное офисное кресло с поясничной поддержкой и сетчатой спинкой.",
    categoryId: "home", price: 14990, rating: 4.5, reviewCount: 612,
  },
  {
    title: "Настольная лампа Xiaomi Mi LED",
    brand: "Xiaomi", description: "Лампа с регулировкой цветовой температуры и приложением Mi Home.",
    categoryId: "home", price: 3490, oldPrice: 4490, rating: 4.7, reviewCount: 980,
  },
  {
    title: "Стеллаж IKEA Kallax 4×4 белый",
    brand: "IKEA", description: "Универсальный стеллаж 16 ячеек, ставится горизонтально или вертикально.",
    categoryId: "home", price: 12990, rating: 4.7, reviewCount: 2105,
  },
  {
    title: "Подушка ортопедическая Askona Mediflex",
    brand: "Askona", description: "Подушка с эффектом памяти для здорового сна.",
    categoryId: "home", price: 4990, rating: 4.6, reviewCount: 312,
  },
  {
    title: "Прикроватная тумба Hoff Lillian",
    brand: "Hoff", description: "Тумба из ЛДСП с двумя ящиками, сборка за 15 минут.",
    categoryId: "home", price: 5990, oldPrice: 7990, rating: 4.4, reviewCount: 188,
  },

  // === BEAUTY ===
  {
    title: "Парфюм Dior Sauvage EDT 100 ml",
    brand: "Dior", description: "Древесно-пряный аромат с нотами бергамота и амбры.",
    categoryId: "beauty", price: 11990, oldPrice: 14990, rating: 4.9, reviewCount: 2120,
    badges: ["bestseller"],
  },
  {
    title: "Палетка теней Urban Decay Naked3",
    brand: "Urban Decay", description: "12 розово-нейтральных оттенков теней высокой пигментации.",
    categoryId: "beauty", price: 5990, rating: 4.7, reviewCount: 488,
  },
  {
    title: "Сыворотка для лица The Ordinary Niacinamide",
    brand: "The Ordinary", description: "Сыворотка с ниацинамидом 10% и цинком 1% для проблемной кожи.",
    categoryId: "beauty", price: 990, rating: 4.6, reviewCount: 1622, badges: ["bestseller"],
  },
  {
    title: "Помада MAC Matte Lipstick Ruby Woo",
    brand: "MAC", description: "Культовая красная матовая помада с холодным подтоном.",
    categoryId: "beauty", price: 2490, rating: 4.8, reviewCount: 980,
  },
  {
    title: "Щётка Tangle Teezer The Original",
    brand: "Tangle Teezer", description: "Щётка для распутывания волос без вырывания.",
    categoryId: "beauty", price: 1490, rating: 4.7, reviewCount: 612,
  },

  // === SPORT ===
  {
    title: "Гантели разборные Iron King 2×20 кг",
    brand: "Iron King", description: "Разборные гантели с обрезиненными дисками, грифом 35 см и стопорами.",
    categoryId: "sport", price: 8990, oldPrice: 11990, rating: 4.7, reviewCount: 312,
  },
  {
    title: "Кроссовки Adidas Ultraboost 22",
    brand: "Adidas", description: "Беговые кроссовки с амортизацией Boost и адаптивным верхом Primeknit.",
    categoryId: "sport", price: 16990, oldPrice: 19990, rating: 4.8, reviewCount: 1488,
  },
  {
    title: "Коврик для йоги Lululemon Reversible 5 мм",
    brand: "Lululemon", description: "Двусторонний нескользящий коврик из натурального каучука.",
    categoryId: "sport", price: 7490, rating: 4.7, reviewCount: 248,
  },
  {
    title: "Ракетка теннисная Wilson Pro Staff 97",
    brand: "Wilson", description: "Профессиональная ракетка модели Roger Federer, 315 г.",
    categoryId: "sport", price: 21990, rating: 4.8, reviewCount: 92,
  },
  {
    title: "Велотренажёр Body Sculpture BC-6750",
    brand: "Body Sculpture", description: "Магнитный велотренажёр с 8 уровнями нагрузки и LCD-дисплеем.",
    categoryId: "sport", price: 18990, oldPrice: 22990, rating: 4.5, reviewCount: 188,
  },

  // === KIDS ===
  {
    title: "Конструктор LEGO Technic 42154 Ford GT",
    brand: "LEGO", description: "1466 деталей. Спорткар с поршневым двигателем V8 и 7-ступенчатой коробкой.",
    categoryId: "kids", price: 14990, oldPrice: 17990, rating: 4.9, reviewCount: 822,
    badges: ["bestseller"],
  },
  {
    title: "Плюшевый медведь Steiff Classic 35 см",
    brand: "Steiff", description: "Премиальная мягкая игрушка из натурального мохера.",
    categoryId: "kids", price: 12990, rating: 4.8, reviewCount: 92,
  },
  {
    title: "Самокат городской Razor A5 Lux",
    brand: "Razor", description: "Складной самокат с большими колёсами 200 мм для подростков и взрослых.",
    categoryId: "kids", price: 9990, oldPrice: 12990, rating: 4.7, reviewCount: 612,
  },
  {
    title: "Кроватка детская IKEA Sundvik",
    brand: "IKEA", description: "Регулируемая кроватка из массива бука, переделывается в подростковую.",
    categoryId: "kids", price: 14990, rating: 4.8, reviewCount: 248,
  },
  {
    title: "Развивающий коврик Tiny Love Magical Tales",
    brand: "Tiny Love", description: "Музыкальный коврик с 5 подвесными игрушками и зеркальцем.",
    categoryId: "kids", price: 7490, oldPrice: 8990, rating: 4.7, reviewCount: 312,
  },

  // === AUTO ===
  {
    title: "Видеорегистратор 70mai A800S 4K",
    brand: "70mai", description: "Регистратор с 4K-съёмкой, GPS, ADAS и Wi-Fi.",
    categoryId: "auto", price: 15990, oldPrice: 19990, rating: 4.7, reviewCount: 612,
  },
  {
    title: "Шины Pirelli P Zero 245/40 R18",
    brand: "Pirelli", description: "Летние шины премиум-класса с асимметричным рисунком.",
    categoryId: "auto", price: 21990, rating: 4.9, reviewCount: 188,
  },
  {
    title: "Набор инструментов Stanley 99 предметов",
    brand: "Stanley", description: "Набор торцевых головок, ключей и бит в кейсе.",
    categoryId: "auto", price: 8990, rating: 4.7, reviewCount: 422,
  },
  {
    title: "Автомобильный пылесос Baseus A2",
    brand: "Baseus", description: "Беспроводной пылесос для авто, 15 кПа, 30 минут работы.",
    categoryId: "auto", price: 4990, oldPrice: 6490, rating: 4.5, reviewCount: 988,
  },

  // === BOOKS ===
  {
    title: "Гарри Поттер. Полное собрание (7 книг)",
    brand: "Махаон", description: "Подарочное издание всех 7 книг в твёрдом переплёте.",
    categoryId: "books", price: 6990, oldPrice: 8990, rating: 4.9, reviewCount: 4220,
    badges: ["bestseller"],
  },
  {
    title: "Атлас тела человека для детей",
    brand: "Манн, Иванов и Фербер", description: "Большая иллюстрированная энциклопедия для детей 6-12 лет.",
    categoryId: "books", price: 1490, rating: 4.8, reviewCount: 612,
  },
  {
    title: "Хаски и его учитель белых снегов. Том 1",
    brand: "Истари Комикс", description: "Первый том культовой китайской новеллы Жоубао Бучи Жоу.",
    categoryId: "books", price: 1290, rating: 4.7, reviewCount: 188,
  },
  {
    title: "Думай медленно... решай быстро",
    brand: "АСТ", description: "Бестселлер Даниэля Канемана о двух системах мышления.",
    categoryId: "books", price: 990, rating: 4.8, reviewCount: 2418,
  },

  // === PETS ===
  {
    title: "Корм для кошек Royal Canin 4 кг",
    brand: "Royal Canin", description: "Полнорационный сухой корм для взрослых кошек.",
    categoryId: "pets", price: 3490, oldPrice: 3990, rating: 4.7, reviewCount: 1822,
    badges: ["bestseller"],
  },
  {
    title: "Лежак для собак Trixie Donut 60 см",
    brand: "Trixie", description: "Мягкий круглый лежак с приподнятыми бортиками.",
    categoryId: "pets", price: 2490, rating: 4.6, reviewCount: 412,
  },
  {
    title: "Когтеточка с домиком Yami-Yami",
    brand: "Yami-Yami", description: "Многоуровневая когтеточка с лежанками и игрушкой.",
    categoryId: "pets", price: 4490, oldPrice: 5990, rating: 4.7, reviewCount: 188,
  },
  {
    title: "Шлейка для собак Ruffwear Front Range",
    brand: "Ruffwear", description: "Эргономичная шлейка с двумя точками крепления поводка.",
    categoryId: "pets", price: 5990, rating: 4.8, reviewCount: 248,
  },

  // === GROCERIES ===
  {
    title: "Кофе в зёрнах Lavazza Qualità Oro 1 кг",
    brand: "Lavazza", description: "Арабика 100% средней обжарки с фруктовыми нотами.",
    categoryId: "groceries", price: 2490, rating: 4.8, reviewCount: 1820, badges: ["bestseller"],
  },
  {
    title: "Шоколад Lindt Excellence 70% 100 г (×5 шт)",
    brand: "Lindt", description: "Тёмный швейцарский шоколад из бельгийского какао.",
    categoryId: "groceries", price: 1490, oldPrice: 1990, rating: 4.9, reviewCount: 612,
  },
  {
    title: "Оливковое масло Borges Extra Virgin 1 л",
    brand: "Borges", description: "Масло первого холодного отжима из испанских оливок.",
    categoryId: "groceries", price: 990, rating: 4.7, reviewCount: 422,
  },
  {
    title: "Мёд цветочный 500 г стекло",
    brand: "Алтай", description: "Натуральный мёд с алтайских пасек, без пастеризации.",
    categoryId: "groceries", price: 690, rating: 4.6, reviewCount: 188,
  },

  // === TOYS ===
  {
    title: "Настольная игра Catan / Колонизаторы",
    brand: "Hobby World", description: "Классическая стратегия для 3-4 игроков, 60-90 минут.",
    categoryId: "toys", price: 4490, rating: 4.9, reviewCount: 2120, badges: ["bestseller"],
  },
  {
    title: "Шахматы деревянные турнирные 50 см",
    brand: "Орлов", description: "Полный комплект с фигурами Стаунтон №6 и доской.",
    categoryId: "toys", price: 3490, rating: 4.8, reviewCount: 312,
  },
  {
    title: "Конструктор LEGO Star Wars Sokol Tysjacheletija",
    brand: "LEGO", description: "Большой набор «Тысячелетний сокол», 1351 деталь.",
    categoryId: "toys", price: 12990, oldPrice: 15990, rating: 4.9, reviewCount: 612,
  },
  {
    title: "Пазл Ravensburger 1500 деталей",
    brand: "Ravensburger", description: "Пазл с панорамным горным пейзажем, 80×60 см.",
    categoryId: "toys", price: 2490, rating: 4.7, reviewCount: 188,
  },
];

let _idCounter = 1;
const photoFor = (categoryId: string, idx: number): string[] => {
  const pool = PHOTO_BY_CATEGORY[categoryId] ?? PHOTO_BY_CATEGORY.electronics;
  // Cycle through pool so neighboring products in a category use different shots.
  return [
    u(pool[idx % pool.length]),
    u(pool[(idx + 1) % pool.length]),
    u(pool[(idx + 2) % pool.length]),
  ];
};

export const PRODUCTS: Product[] = RAW.map(s => {
  // Build per-category index for image rotation.
  const sameCat = RAW.filter(r => r.categoryId === s.categoryId);
  const localIdx = sameCat.indexOf(s);
  const id = `p-${_idCounter++}`;
  return {
    id,
    title: s.title,
    brand: s.brand,
    description: s.description,
    categoryId: s.categoryId,
    price: s.price,
    oldPrice: s.oldPrice,
    rating: s.rating,
    reviewCount: s.reviewCount,
    images: photoFor(s.categoryId, localIdx),
    badges: s.badges,
    specs: s.specs,
    partnerUrl: s.partnerUrl ?? DEFAULT_AFFILIATE_URL,
    partner: s.partner ?? "yandex",
    stock: s.stock ?? "В наличии",
  };
});

export const PRODUCT_BY_ID = new Map(PRODUCTS.map(p => [p.id, p]));

export function productsByCategory(catId: string): Product[] {
  return PRODUCTS.filter(p => p.categoryId === catId);
}

export function searchProducts(query: string): Product[] {
  const q = query.trim().toLowerCase();
  if (!q) return [];
  return PRODUCTS.filter(p =>
    p.title.toLowerCase().includes(q) ||
    p.brand.toLowerCase().includes(q) ||
    p.description.toLowerCase().includes(q),
  );
}
