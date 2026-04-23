# Crypto Dashboard

Личный финансовый дашборд по крипте: рынок, графики, Fear & Greed Index,
новости, конвертер и синхронизация спотового баланса с Binance.

![stack](https://img.shields.io/badge/stack-React%20%2B%20FastAPI-6366f1)

## Возможности

- **Рынок** — топ-50 монет по капитализации, живые курсы, изменения за 1ч/24ч/7д, sparkline-графики. Данные CoinGecko.
- **Карточка монеты** — детальный график с диапазонами 24ч / 7д / 30д / 90д / 1г / max, статистика.
- **Баланс Binance** — спотовый портфель по read-only API-ключу, оценка в USD.
- **Конвертер** — быстрый пересчёт между криптой и фиатом.
- **Новости + Fear & Greed Index** — лента CryptoPanic и индекс настроений рынка (alternative.me).

## Стек

- **Frontend:** React 19 + TypeScript + Vite, Recharts, React Router, Axios.
- **Backend:** FastAPI, httpx, pydantic-settings.
- **Данные:** CoinGecko (без ключа), alternative.me (Fear & Greed), CryptoPanic (новости), Binance Spot API (ключи read-only).

## Структура репозитория

```
crypto-dashboard/
├── backend/           # FastAPI API-прокси к внешним источникам
│   ├── app/
│   └── requirements.txt
└── frontend/          # React SPA
    ├── src/
    └── package.json
```

## Запуск локально

Нужны Node.js 20+ и Python 3.11+.

### Backend

```bash
cd backend
python3 -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt

# (опционально) Binance — для страницы «Баланс»
cp .env.example .env
# заполни BINANCE_API_KEY и BINANCE_API_SECRET (read-only)

uvicorn app.main:app --reload --port 8000
```

API будет на `http://localhost:8000`, документация — `http://localhost:8000/docs`.

### Frontend

```bash
cd frontend
npm install
npm run dev
```

SPA откроется на `http://localhost:5173`. Vite проксирует `/api/*` на backend.

## Переменные окружения (backend)

| Переменная           | Назначение                                              |
|----------------------|---------------------------------------------------------|
| `BINANCE_API_KEY`    | API-ключ Binance (read-only достаточно)                 |
| `BINANCE_API_SECRET` | Секрет Binance                                          |

Без этих переменных страница «Баланс» показывает понятную ошибку — остальные
разделы работают без ключей.

## API

| Метод  | Путь                            | Описание                                        |
|--------|---------------------------------|-------------------------------------------------|
| `GET`  | `/health`                       | Проверка живости                                |
| `GET`  | `/coins/markets`                | Топ монет (vs_currency, per_page, page, ids)    |
| `GET`  | `/coins/search?query=`          | Поиск монет                                     |
| `GET`  | `/coins/{id}`                   | Подробности монеты                              |
| `GET`  | `/coins/{id}/chart`             | Исторический график (days: 1/7/30/90/365/max)   |
| `GET`  | `/fear-greed?limit=`            | Fear & Greed Index                              |
| `GET`  | `/news?currencies=`             | Лента CryptoPanic                               |
| `GET`  | `/convert?from=&to=&amount=`    | Конвертация курса                               |
| `GET`  | `/exchange/balance`             | Спотовый баланс Binance                         |

## Как получить API-ключи Binance

1. Binance → Profile → API Management → **Create API**.
2. Включи только **Enable Reading**. Trading и Withdrawals оставь выключенными.
3. Скопируй Key и Secret в `backend/.env`.

## Проверки

```bash
# frontend
cd frontend && npm run lint && npm run build

# backend
cd backend && .venv/bin/python -c "from app.main import app"
```
