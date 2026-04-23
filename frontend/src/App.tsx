import { NavLink, Route, Routes } from 'react-router-dom'
import { useEffect, useState } from 'react'
import { api, type FearGreedResponse } from './api/client'
import MarketsPage from './pages/MarketsPage'
import CoinDetailPage from './pages/CoinDetailPage'
import BalancePage from './pages/BalancePage'
import ConverterPage from './pages/ConverterPage'
import NewsPage from './pages/NewsPage'
import FearGreedBadge from './components/FearGreedBadge'
import './app.css'

function App() {
  const [fng, setFng] = useState<FearGreedResponse | null>(null)

  useEffect(() => {
    api
      .get<FearGreedResponse>('/fear-greed', { params: { limit: 1 } })
      .then((r) => setFng(r.data))
      .catch(() => setFng(null))
  }, [])

  return (
    <div className="app">
      <header className="topbar">
        <div className="brand">
          <span className="brand-mark">◈</span>
          <span className="brand-title">Crypto Dashboard</span>
        </div>
        <nav className="nav">
          <NavLink to="/" end>
            Рынок
          </NavLink>
          <NavLink to="/balance">Баланс</NavLink>
          <NavLink to="/converter">Конвертер</NavLink>
          <NavLink to="/news">Новости</NavLink>
        </nav>
        <div className="topbar-right">
          {fng && fng.data[0] && <FearGreedBadge point={fng.data[0]} />}
        </div>
      </header>

      <main className="main">
        <Routes>
          <Route path="/" element={<MarketsPage />} />
          <Route path="/coins/:coinId" element={<CoinDetailPage />} />
          <Route path="/balance" element={<BalancePage />} />
          <Route path="/converter" element={<ConverterPage />} />
          <Route path="/news" element={<NewsPage />} />
        </Routes>
      </main>

      <footer className="footer">
        <span>
          Данные: CoinGecko, alternative.me, CryptoPanic, Binance. Обновляется каждые
          60 секунд.
        </span>
      </footer>
    </div>
  )
}

export default App
