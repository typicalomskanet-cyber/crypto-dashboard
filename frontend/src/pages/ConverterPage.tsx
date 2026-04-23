import { useState } from 'react'
import axios from 'axios'
import { api, type ConvertResponse } from '../api/client'
import { formatNumber } from '../utils/format'

const POPULAR_COINS = [
  'bitcoin',
  'ethereum',
  'solana',
  'binancecoin',
  'ripple',
  'cardano',
  'dogecoin',
  'tron',
]
const FIAT = ['usd', 'eur', 'rub', 'gbp', 'jpy', 'btc', 'eth']

export default function ConverterPage() {
  const [from, setFrom] = useState('bitcoin')
  const [to, setTo] = useState('usd')
  const [amount, setAmount] = useState('1')
  const [result, setResult] = useState<ConvertResponse | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const convert = async () => {
    try {
      setLoading(true)
      setError(null)
      const resp = await api.get<ConvertResponse>('/convert', {
        params: { from, to, amount },
      })
      setResult(resp.data)
    } catch (err) {
      if (axios.isAxiosError(err) && err.response) {
        const detail = err.response.data?.detail
        setError(typeof detail === 'string' ? detail : `HTTP ${err.response.status}`)
      } else if (err instanceof Error) {
        setError(err.message)
      } else {
        setError('Ошибка конвертации')
      }
    } finally {
      setLoading(false)
    }
  }

  return (
    <div>
      <h1 className="page-title">Конвертер</h1>
      <p className="page-subtitle">
        Быстрый пересчёт между криптой и фиатом (курсы CoinGecko).
      </p>

      <div className="card" style={{ maxWidth: 560 }}>
        <div className="form-row" style={{ marginBottom: 16 }}>
          <input
            type="number"
            step="any"
            min="0"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            style={{ flex: 1, minWidth: 120 }}
          />
          <select value={from} onChange={(e) => setFrom(e.target.value)}>
            {POPULAR_COINS.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>
          <span style={{ color: 'var(--text-muted)' }}>→</span>
          <select value={to} onChange={(e) => setTo(e.target.value)}>
            {FIAT.map((f) => (
              <option key={f} value={f}>
                {f.toUpperCase()}
              </option>
            ))}
          </select>
          <button className="btn" onClick={convert} disabled={loading}>
            {loading ? 'Считаю…' : 'Конвертировать'}
          </button>
        </div>

        {error && <div className="error" style={{ padding: 0 }}>{error}</div>}

        {result && !error && (
          <div className="stat" style={{ marginTop: 8 }}>
            <span className="stat-label">Результат</span>
            <span className="big-number">
              {formatNumber(result.result, { maximumFractionDigits: 8 })}{' '}
              {result.to.toUpperCase()}
            </span>
            <span style={{ color: 'var(--text-muted)' }}>
              1 {result.from.toUpperCase()} ={' '}
              {formatNumber(result.rate, { maximumFractionDigits: 8 })}{' '}
              {result.to.toUpperCase()}
            </span>
          </div>
        )}
      </div>
    </div>
  )
}
