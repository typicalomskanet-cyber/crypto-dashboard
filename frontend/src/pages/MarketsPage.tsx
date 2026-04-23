import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { api, type Coin } from '../api/client'
import Sparkline from '../components/Sparkline'
import {
  formatCompact,
  formatCurrency,
  formatPercent,
} from '../utils/format'

const REFRESH_INTERVAL_MS = 60_000

export default function MarketsPage() {
  const [coins, setCoins] = useState<Coin[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [query, setQuery] = useState('')
  const [currency, setCurrency] = useState('usd')

  useEffect(() => {
    let cancelled = false

    async function load() {
      try {
        setError(null)
        const resp = await api.get<Coin[]>('/coins/markets', {
          params: { vs_currency: currency, per_page: 50 },
        })
        if (!cancelled) {
          setCoins(resp.data)
          setLoading(false)
        }
      } catch (err) {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : 'Не удалось загрузить данные')
          setLoading(false)
        }
      }
    }

    load()
    const interval = setInterval(load, REFRESH_INTERVAL_MS)
    return () => {
      cancelled = true
      clearInterval(interval)
    }
  }, [currency])

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase()
    if (!q) return coins
    return coins.filter(
      (c) =>
        c.name.toLowerCase().includes(q) ||
        c.symbol.toLowerCase().includes(q) ||
        c.id.toLowerCase().includes(q),
    )
  }, [coins, query])

  return (
    <div>
      <h1 className="page-title">Рынок криптовалют</h1>
      <p className="page-subtitle">
        Топ-50 монет по капитализации. Клик по монете — подробности и график.
      </p>

      <div className="card" style={{ marginBottom: 20 }}>
        <div className="form-row">
          <input
            type="text"
            placeholder="Поиск по названию или тикеру…"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            style={{ flex: 1, minWidth: 200 }}
          />
          <select value={currency} onChange={(e) => setCurrency(e.target.value)}>
            <option value="usd">USD</option>
            <option value="eur">EUR</option>
            <option value="rub">RUB</option>
            <option value="btc">BTC</option>
          </select>
        </div>
      </div>

      {loading && <div className="loading">Загрузка…</div>}
      {error && <div className="error">{error}</div>}

      {!loading && !error && (
        <div className="card" style={{ padding: 0, overflowX: 'auto' }}>
          <table className="markets-table">
            <thead>
              <tr>
                <th>#</th>
                <th>Монета</th>
                <th>Цена</th>
                <th>1ч</th>
                <th>24ч</th>
                <th>7д</th>
                <th>Кап.</th>
                <th>График (7д)</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((coin) => (
                <tr key={coin.id}>
                  <td style={{ color: 'var(--text-muted)' }}>{coin.market_cap_rank ?? '—'}</td>
                  <td>
                    <Link to={`/coins/${coin.id}`} className="coin-cell" style={{ color: 'inherit' }}>
                      <img src={coin.image} alt="" />
                      <span>{coin.name}</span>
                      <span className="symbol">{coin.symbol}</span>
                    </Link>
                  </td>
                  <td>{formatCurrency(coin.current_price, currency.toUpperCase())}</td>
                  <PercentCell value={coin.price_change_percentage_1h_in_currency} />
                  <PercentCell value={coin.price_change_percentage_24h_in_currency} />
                  <PercentCell value={coin.price_change_percentage_7d_in_currency} />
                  <td>{formatCompact(coin.market_cap)}</td>
                  <td>
                    {coin.sparkline_in_7d?.price ? (
                      <Sparkline data={coin.sparkline_in_7d.price} />
                    ) : (
                      '—'
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}

function PercentCell({ value }: { value: number | null | undefined }) {
  const cls =
    value === null || value === undefined
      ? ''
      : value >= 0
        ? 'positive'
        : 'negative'
  return <td className={cls}>{formatPercent(value)}</td>
}
