import { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import {
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'
import { api, type ChartData } from '../api/client'
import { formatCompact, formatCurrency, formatPercent } from '../utils/format'

type CoinDetail = {
  id: string
  symbol: string
  name: string
  image: { large: string }
  market_data: {
    current_price: Record<string, number>
    market_cap: Record<string, number>
    total_volume: Record<string, number>
    high_24h: Record<string, number>
    low_24h: Record<string, number>
    price_change_percentage_24h?: number
    price_change_percentage_7d?: number
    price_change_percentage_30d?: number
  }
  description?: { en?: string }
}

const RANGES: { label: string; days: string }[] = [
  { label: '24ч', days: '1' },
  { label: '7д', days: '7' },
  { label: '30д', days: '30' },
  { label: '90д', days: '90' },
  { label: '1г', days: '365' },
  { label: 'Макс', days: 'max' },
]

export default function CoinDetailPage() {
  const { coinId } = useParams<{ coinId: string }>()
  const [detail, setDetail] = useState<CoinDetail | null>(null)
  const [chart, setChart] = useState<ChartData | null>(null)
  const [days, setDays] = useState('7')
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!coinId) return
    api
      .get<CoinDetail>(`/coins/${coinId}`)
      .then((r) => {
        setDetail(r.data)
        setError(null)
      })
      .catch((e) =>
        setError(e instanceof Error ? e.message : 'Ошибка загрузки'),
      )
  }, [coinId])

  useEffect(() => {
    if (!coinId) return
    api
      .get<ChartData>(`/coins/${coinId}/chart`, {
        params: { vs_currency: 'usd', days },
      })
      .then((r) => setChart(r.data))
      .catch(() => setChart(null))
  }, [coinId, days])

  if (!coinId) return null

  if (error) {
    return (
      <div>
        <Link to="/" className="btn btn-ghost">
          ← Назад
        </Link>
        <div className="error">{error}</div>
      </div>
    )
  }

  if (!detail) return <div className="loading">Загрузка…</div>

  const price = detail.market_data.current_price.usd
  const change24h = detail.market_data.price_change_percentage_24h ?? 0

  const chartPoints =
    chart?.prices.map(([timestamp, value]) => ({
      time: timestamp,
      value,
    })) ?? []

  return (
    <div>
      <Link to="/" className="btn btn-ghost" style={{ marginBottom: 16 }}>
        ← Назад к рынку
      </Link>

      <div
        className="card"
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 16,
          marginBottom: 20,
          flexWrap: 'wrap',
        }}
      >
        <img src={detail.image.large} alt="" width={48} height={48} />
        <div style={{ flex: 1 }}>
          <h1 className="page-title" style={{ margin: 0 }}>
            {detail.name}{' '}
            <span
              className="symbol"
              style={{ color: 'var(--text-muted)', fontWeight: 400 }}
            >
              {detail.symbol.toUpperCase()}
            </span>
          </h1>
        </div>
        <div style={{ textAlign: 'right' }}>
          <div className="big-number">{formatCurrency(price)}</div>
          <div className={change24h >= 0 ? 'positive' : 'negative'}>
            {formatPercent(change24h)} за 24 часа
          </div>
        </div>
      </div>

      <div className="card" style={{ marginBottom: 20 }}>
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: 16,
            flexWrap: 'wrap',
            gap: 10,
          }}
        >
          <h2 style={{ margin: 0, fontSize: '1.1rem' }}>График цены</h2>
          <div className="range-picker">
            {RANGES.map((r) => (
              <button
                key={r.days}
                className={r.days === days ? 'active' : ''}
                onClick={() => setDays(r.days)}
              >
                {r.label}
              </button>
            ))}
          </div>
        </div>
        <div style={{ width: '100%', height: 360 }}>
          <ResponsiveContainer>
            <LineChart data={chartPoints}>
              <CartesianGrid strokeDasharray="3 3" stroke="#232a4f" />
              <XAxis
                dataKey="time"
                type="number"
                scale="time"
                domain={['dataMin', 'dataMax']}
                tickFormatter={(v: number) =>
                  new Date(v).toLocaleDateString('ru-RU', {
                    month: 'short',
                    day: 'numeric',
                  })
                }
                stroke="#8b93b8"
                minTickGap={40}
              />
              <YAxis
                stroke="#8b93b8"
                tickFormatter={(v: number) => formatCompact(v)}
                domain={['auto', 'auto']}
                width={70}
              />
              <Tooltip
                contentStyle={{
                  background: '#121832',
                  border: '1px solid #232a4f',
                  borderRadius: 8,
                }}
                labelFormatter={(label) =>
                  new Date(Number(label)).toLocaleString('ru-RU')
                }
                formatter={(value) => [
                  formatCurrency(Number(value)),
                  'Цена',
                ]}
              />
              <Line
                type="monotone"
                dataKey="value"
                stroke="#818cf8"
                strokeWidth={2}
                dot={false}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="grid cols-3">
        <div className="card stat">
          <span className="stat-label">Market cap</span>
          <span className="stat-value">
            {formatCurrency(detail.market_data.market_cap.usd)}
          </span>
        </div>
        <div className="card stat">
          <span className="stat-label">24h volume</span>
          <span className="stat-value">
            {formatCurrency(detail.market_data.total_volume.usd)}
          </span>
        </div>
        <div className="card stat">
          <span className="stat-label">24h high / low</span>
          <span className="stat-value">
            {formatCurrency(detail.market_data.high_24h.usd)} /{' '}
            {formatCurrency(detail.market_data.low_24h.usd)}
          </span>
        </div>
      </div>
    </div>
  )
}
