import { useEffect, useState } from 'react'
import axios from 'axios'
import { api, type NewsItem, type FearGreedResponse } from '../api/client'
import { timeAgo } from '../utils/format'

export default function NewsPage() {
  const [news, setNews] = useState<NewsItem[]>([])
  const [fng, setFng] = useState<FearGreedResponse | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let cancelled = false
    Promise.all([
      api.get<{ items: NewsItem[] }>('/news').catch((err) => {
        if (!cancelled) {
          if (axios.isAxiosError(err) && err.response) {
            setError(
              `Новости сейчас недоступны (HTTP ${err.response.status}). Попробуй позже.`,
            )
          } else {
            setError('Новости сейчас недоступны. Попробуй позже.')
          }
        }
        return { data: { items: [] } }
      }),
      api
        .get<FearGreedResponse>('/fear-greed', { params: { limit: 30 } })
        .catch(() => ({ data: null as FearGreedResponse | null })),
    ]).then(([n, f]) => {
      if (cancelled) return
      setNews(n.data.items)
      setFng(f.data)
      setLoading(false)
    })
    return () => {
      cancelled = true
    }
  }, [])

  return (
    <div>
      <h1 className="page-title">Новости и настроения</h1>
      <p className="page-subtitle">
        Заголовки крипторынка и индекс страха и жадности.
      </p>

      {fng && fng.data && fng.data.length > 0 && (
        <div className="grid cols-3" style={{ marginBottom: 20 }}>
          <div className="card stat">
            <span className="stat-label">Fear &amp; Greed сегодня</span>
            <span className="big-number">{fng.data[0].value}</span>
            <span>{fng.data[0].value_classification}</span>
          </div>
          <div className="card stat">
            <span className="stat-label">Вчера</span>
            <span className="stat-value">
              {fng.data[1]?.value ?? '—'}{' '}
              <span style={{ color: 'var(--text-muted)', fontSize: '0.8rem' }}>
                {fng.data[1]?.value_classification ?? ''}
              </span>
            </span>
          </div>
          <div className="card stat">
            <span className="stat-label">Неделю назад</span>
            <span className="stat-value">
              {fng.data[6]?.value ?? '—'}{' '}
              <span style={{ color: 'var(--text-muted)', fontSize: '0.8rem' }}>
                {fng.data[6]?.value_classification ?? ''}
              </span>
            </span>
          </div>
        </div>
      )}

      {loading && <div className="loading">Загрузка новостей…</div>}
      {error && <div className="error">{error}</div>}

      {!loading && news.length > 0 && (
        <div className="card">
          {news.map((item) => (
            <article key={item.id} className="news-item">
              <h3 className="title">
                <a href={item.url} target="_blank" rel="noreferrer">
                  {item.title}
                </a>
              </h3>
              <div className="meta">
                {item.source && <span>{item.source}</span>}
                <span>{timeAgo(item.published_at)}</span>
                {item.currencies.length > 0 && (
                  <span className="badge-row">
                    {item.currencies.slice(0, 4).map((c) => (
                      <span key={c} className="badge">
                        {c}
                      </span>
                    ))}
                  </span>
                )}
              </div>
            </article>
          ))}
        </div>
      )}
    </div>
  )
}
