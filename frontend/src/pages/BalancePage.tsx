import { useEffect, useState } from 'react'
import { api, type BalanceResponse } from '../api/client'
import { formatCurrency, formatNumber } from '../utils/format'
import axios from 'axios'

export default function BalancePage() {
  const [data, setData] = useState<BalanceResponse | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const load = async () => {
    try {
      const resp = await api.get<BalanceResponse>('/exchange/balance')
      setData(resp.data)
      setError(null)
    } catch (err) {
      if (axios.isAxiosError(err) && err.response) {
        const detail = err.response.data?.detail
        setError(typeof detail === 'string' ? detail : `HTTP ${err.response.status}`)
      } else if (err instanceof Error) {
        setError(err.message)
      } else {
        setError('Ошибка загрузки баланса')
      }
    } finally {
      setLoading(false)
    }
  }

  const refresh = () => {
    setLoading(true)
    load()
  }

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    load()
  }, [])

  return (
    <div>
      <h1 className="page-title">Баланс Binance</h1>
      <p className="page-subtitle">
        Синхронизация спотового баланса по API-ключу. Нужны права только на чтение —
        опции Enable Trading и Enable Withdrawals включать не нужно.
      </p>

      <div className="form-row" style={{ marginBottom: 20 }}>
        <button className="btn" onClick={refresh} disabled={loading}>
          {loading ? 'Обновление…' : 'Обновить'}
        </button>
      </div>

      {error && (
        <div className="card" style={{ marginBottom: 20 }}>
          <div className="error" style={{ padding: 0, textAlign: 'left' }}>
            {error}
          </div>
          <p style={{ color: 'var(--text-muted)', marginTop: 12 }}>
            Задай <code>BINANCE_API_KEY</code> и <code>BINANCE_API_SECRET</code> в{' '}
            <code>backend/.env</code> и перезапусти backend.
          </p>
        </div>
      )}

      {!error && data && (
        <>
          <div className="grid cols-3" style={{ marginBottom: 20 }}>
            <div className="card stat">
              <span className="stat-label">Общая стоимость (USD)</span>
              <span className="stat-value">{formatCurrency(data.total_usd)}</span>
            </div>
            <div className="card stat">
              <span className="stat-label">Активов</span>
              <span className="stat-value">{data.balances.length}</span>
            </div>
            <div className="card stat">
              <span className="stat-label">Тип аккаунта</span>
              <span className="stat-value">{data.account_type ?? '—'}</span>
            </div>
          </div>

          <div className="card" style={{ padding: 0, overflowX: 'auto' }}>
            <table className="markets-table">
              <thead>
                <tr>
                  <th>Актив</th>
                  <th>Доступно</th>
                  <th>В ордерах</th>
                  <th>Всего</th>
                  <th>USD</th>
                </tr>
              </thead>
              <tbody>
                {data.balances.map((b) => (
                  <tr key={b.asset}>
                    <td>
                      <strong>{b.asset}</strong>
                    </td>
                    <td>{formatNumber(b.free, { maximumFractionDigits: 8 })}</td>
                    <td>{formatNumber(b.locked, { maximumFractionDigits: 8 })}</td>
                    <td>{formatNumber(b.total, { maximumFractionDigits: 8 })}</td>
                    <td>{formatCurrency(b.usd_value)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}
    </div>
  )
}
