import { useEffect, useMemo, useState, useCallback, lazy, Suspense } from 'react'
import './App.css'

const CityScene = lazy(() => import('./three/CityScene'))
const MiningRoom3D = lazy(() => import('./three/MiningRoom'))
const AmbientBg3D = lazy(() => import('./three/AmbientBg'))

/* ═══════════════════════════════════════════
   TYPES
   ═══════════════════════════════════════════ */
type Tab = 'dashboard' | 'wallet' | 'trade' | 'futures' | 'mining' | 'city' | 'exchange' | 'news'
type Source = 'coingecko' | 'binance' | 'coinmarketcap'
type OrderType = 'limit_buy' | 'limit_sell'

interface AssetMeta {
  symbol: string; name: string; coingeckoId: string
  binanceSymbol: string; cmcId: string; color: string; seedPrice: number
}
interface SourceQuote { price: number; change24h: number; marketCap?: number; volume24h?: number }
interface AssetState extends AssetMeta {
  price: number; change24h: number; marketCap?: number; volume24h?: number
  source: Source | 'mixed'; sourceQuotes: Partial<Record<Source, SourceQuote>>
}
interface Candle { time: number; open: number; high: number; low: number; close: number; volume: number }
interface OBLevel { price: number; amount: number; total: number }
interface FuturesPos {
  id: string; symbol: string; side: 'long' | 'short'; entryPrice: number
  amount: number; leverage: number; margin: number; liqPrice: number; openTime: number
}
interface LimitOrder {
  id: string; symbol: string; type: OrderType; price: number
  amount: number; total: number; status: 'open' | 'filled' | 'cancelled'; createdAt: number
}
interface NewsItem {
  id: string; title: string; source: string; time: number
  sentiment: 'bullish' | 'bearish' | 'neutral'; impact: 'low' | 'medium' | 'high'
  category: string; symbol: string
}
interface Miner { 
  id: string; 
  name: string; 
  cost: number; 
  power: number; 
  icon: string; 
  color: string; 
  rarity: 'common' | 'rare' | 'epic' | 'legendary';
  coin: 'BTC' | 'ETH' | 'SOL' | 'MULTI';
  durability?: number; // 0-100, wear and tear
}
interface RackSlot { 
  id: string; 
  minerId: string | null; 
  nftMinerId?: string;
  durability: number; // 0-100
  overclockEnd?: number; // timestamp
}

interface NftListing {
  id: string;
  nftId: string;
  seller: string;
  price: number;
}
interface Rack { id: string; slots: RackSlot[] }
interface NFTMiner { id: string; name: string; power: number; icon: string; color: string; rarity: 'rare' | 'epic' | 'legendary'; perk: string; perkDesc: string }
interface SeasonEvent { id: string; name: string; icon: string; type: 'bull' | 'bear' | 'halving' | 'blackswan'; priceMultiplier: number; miningMultiplier: number; desc: string; duration: number }
// ActiveSeason handled inline
interface Achievement { id: string; name: string; icon: string; desc: string; check: (state: AchState) => boolean }
interface AchState { balance: number; portVal: number; totalPow: number; trades: number; city: Record<string, number>; nftCount: number; exchangeOpen: boolean }
interface Trade { symbol: string; amount: number; price: number; type: 'buy' | 'sell'; ts: number }
interface Exchange {
  name: string; listedTokens: string[]; tradingFee: number
  totalVolume: number; totalFees: number; level: number
}

/* ═══════════════════════════════════════════
   CONSTANTS
   ═══════════════════════════════════════════ */
const API_CG = 'https://api.coingecko.com/api/v3'
const API_BN = 'https://api.binance.com/api/v3'

const ASSETS: AssetMeta[] = [
  { symbol: 'BTC', name: 'Bitcoin', coingeckoId: 'bitcoin', binanceSymbol: 'BTCUSDT', cmcId: '1', color: '#f7931a', seedPrice: 105000 },
  { symbol: 'ETH', name: 'Ethereum', coingeckoId: 'ethereum', binanceSymbol: 'ETHUSDT', cmcId: '1027', color: '#627eea', seedPrice: 2550 },
  { symbol: 'SOL', name: 'Solana', coingeckoId: 'solana', binanceSymbol: 'SOLUSDT', cmcId: '5426', color: '#9945ff', seedPrice: 175 },
  { symbol: 'ADA', name: 'Cardano', coingeckoId: 'cardano', binanceSymbol: 'ADAUSDT', cmcId: '2010', color: '#0033ad', seedPrice: 0.78 },
  { symbol: 'DOGE', name: 'Dogecoin', coingeckoId: 'dogecoin', binanceSymbol: 'DOGEUSDT', cmcId: '74', color: '#c2a633', seedPrice: 0.22 },
  { symbol: 'AVAX', name: 'Avalanche', coingeckoId: 'avalanche-2', binanceSymbol: 'AVAXUSDT', cmcId: '5805', color: '#e84142', seedPrice: 24.5 },
  { symbol: 'LINK', name: 'Chainlink', coingeckoId: 'chainlink', binanceSymbol: 'LINKUSDT', cmcId: '1975', color: '#2a5ada', seedPrice: 18.2 },
  { symbol: 'DOT', name: 'Polkadot', coingeckoId: 'polkadot', binanceSymbol: 'DOTUSDT', cmcId: '6636', color: '#e6007a', seedPrice: 7.8 },
  { symbol: 'MATIC', name: 'Polygon', coingeckoId: 'matic-network', binanceSymbol: 'MATICUSDT', cmcId: '3890', color: '#8247e5', seedPrice: 0.85 },
  { symbol: 'UNI', name: 'Uniswap', coingeckoId: 'uniswap', binanceSymbol: 'UNIUSDT', cmcId: '7083', color: '#ff007a', seedPrice: 12.5 },
  { symbol: 'ATOM', name: 'Cosmos', coingeckoId: 'cosmos', binanceSymbol: 'ATOMUSDT', cmcId: '3794', color: '#2e3148', seedPrice: 9.2 },
  { symbol: 'XRP', name: 'Ripple', coingeckoId: 'ripple', binanceSymbol: 'XRPUSDT', cmcId: '52', color: '#00aae4', seedPrice: 0.62 },
]

const MINERS: Miner[] = [
  // BTC-ориентированные (ASIC)
  { id: 'asic1', name: 'Antminer S9', cost: 500, power: 4, icon: '⚡', color: '#f59e0b', rarity: 'common', coin: 'BTC' },
  { id: 'asic2', name: 'Antminer S19', cost: 2000, power: 12, icon: '⚡', color: '#fbbf24', rarity: 'common', coin: 'BTC' },
  { id: 'asic3', name: 'Antminer S21', cost: 5000, power: 28, icon: '💎', color: '#a855f7', rarity: 'common', coin: 'BTC' },
  { id: 'asic4', name: 'Antminer S23', cost: 12000, power: 75, icon: '⚙️', color: '#ffaa00', rarity: 'rare', coin: 'BTC' },
  { id: 'asic6', name: 'MicroBT M66S', cost: 110000, power: 500, icon: '⚡', color: '#ffdd00', rarity: 'legendary', coin: 'BTC' },

  // ETH / GPU-ориентированные
  { id: 'gpu1', name: 'GTX 1060', cost: 100, power: 2, icon: '🎮', color: '#22c55e', rarity: 'common', coin: 'ETH' },
  { id: 'gpu2', name: 'RTX 3060', cost: 300, power: 5, icon: '🎮', color: '#3b82f6', rarity: 'common', coin: 'ETH' },
  { id: 'gpu3', name: 'RTX 4090', cost: 1500, power: 18, icon: '🚀', color: '#ef4444', rarity: 'common', coin: 'ETH' },
  { id: 'gpu4', name: 'RTX 5080', cost: 8500, power: 52, icon: '🖥️', color: '#00ff88', rarity: 'rare', coin: 'ETH' },
  { id: 'gpu5', name: 'Aorus RTX 5090', cost: 25000, power: 120, icon: '🔥', color: '#ff3366', rarity: 'epic', coin: 'ETH' },
  { id: 'gpu6', name: 'NVIDIA H100', cost: 85000, power: 380, icon: '🚀', color: '#00ddff', rarity: 'legendary', coin: 'ETH' },

  // Универсальные / Multi-coin
  { id: 'asic5', name: 'Bitmain T21', cost: 32000, power: 160, icon: '🧊', color: '#4488ff', rarity: 'epic', coin: 'MULTI' },
  { id: 'gpu7', name: 'AMD RX 7900 XTX', cost: 1800, power: 22, icon: '🖥️', color: '#e60012', rarity: 'common', coin: 'MULTI' },
]

const NFT_MINERS: NFTMiner[] = [
  { id: 'nft-oc4090', name: 'Overclocked 4090', power: 32, icon: '🔥', color: '#ff6b6b', rarity: 'rare', perk: 'overclock', perkDesc: '+15% power to all GPUs in same rack' },
  { id: 'nft-quantum', name: 'Quantum ASIC', power: 60, icon: '🧊', color: '#00d4ff', rarity: 'epic', perk: 'quantum', perkDesc: 'Ignores 1 halving level' },
  { id: 'nft-solar', name: 'Solar Miner', power: 40, icon: '☀️', color: '#ffd700', rarity: 'epic', perk: 'solar', perkDesc: 'Free electricity: +$2/sec passive' },
  { id: 'nft-alien', name: 'Alien Technology', power: 100, icon: '👽', color: '#7b2dff', rarity: 'legendary', perk: 'alien', perkDesc: 'x2 mining reward globally' },
  { id: 'nft-satoshi', name: "Satoshi's Rig", power: 150, icon: '👤', color: '#ff00ff', rarity: 'legendary', perk: 'satoshi', perkDesc: '+50% to ALL hash power' },
  { id: 'nft-cryo', name: 'CryoCooled S21', power: 45, icon: '❄️', color: '#88ddff', rarity: 'rare', perk: 'cryo', perkDesc: 'Removes temperature penalty' },
]

const SEASON_EVENTS: SeasonEvent[] = [
  { id: 'bull', name: 'Bull Run', icon: '🐂', type: 'bull', priceMultiplier: 1.3, miningMultiplier: 0.8, desc: 'Prices surge! Mining difficulty increases.', duration: 120000 },
  { id: 'bear', name: 'Bear Market', icon: '🐻', type: 'bear', priceMultiplier: 0.7, miningMultiplier: 1.5, desc: 'Prices drop. Mining becomes more profitable.', duration: 120000 },
  { id: 'halving', name: 'BTC Halving', icon: '⏳', type: 'halving', priceMultiplier: 1.15, miningMultiplier: 0.5, desc: 'Mining rewards cut in half. Price pumps.', duration: 90000 },
  { id: 'blackswan-ftx', name: 'Exchange Collapse', icon: '💀', type: 'blackswan', priceMultiplier: 0.5, miningMultiplier: 1.0, desc: 'Major exchange collapses! Panic selling.', duration: 60000 },
  { id: 'blackswan-etf', name: 'ETF Approved', icon: '🏛️', type: 'blackswan', priceMultiplier: 1.5, miningMultiplier: 1.0, desc: 'Spot BTC ETF approved! Institutions buy.', duration: 60000 },
  { id: 'blackswan-ban', name: 'Mining Ban', icon: '🚫', type: 'blackswan', priceMultiplier: 0.85, miningMultiplier: 0.3, desc: 'China bans mining again! Hash rate drops.', duration: 60000 },
]

const ACHIEVEMENTS: Achievement[] = [
  { id: 'first100', name: 'First $100', icon: '💵', desc: 'Earn $100 total portfolio', check: s => s.portVal >= 100 },
  { id: 'first1k', name: 'Thousandaire', icon: '💰', desc: 'Reach $1,000 portfolio', check: s => s.portVal >= 1000 },
  { id: 'first10k', name: 'Crypto Whale', icon: '🐋', desc: 'Reach $10,000 portfolio', check: s => s.portVal >= 10000 },
  { id: 'first100k', name: 'Diamond Hands', icon: '💎', desc: 'Reach $100,000 portfolio', check: s => s.portVal >= 100000 },
  { id: 'miner5', name: 'Mining Starter', icon: '⛏️', desc: 'Have 5+ mining power', check: s => s.totalPow >= 5 },
  { id: 'miner50', name: 'Hash Lord', icon: '🏆', desc: 'Have 50+ mining power', check: s => s.totalPow >= 50 },
  { id: 'trader10', name: 'Active Trader', icon: '📈', desc: 'Complete 10 trades', check: s => s.trades >= 10 },
  { id: 'nft1', name: 'NFT Collector', icon: '🎨', desc: 'Own 1 NFT miner', check: s => s.nftCount >= 1 },
  { id: 'nft3', name: 'NFT Hoarder', icon: '🖼️', desc: 'Own 3 NFT miners', check: s => s.nftCount >= 3 },
  { id: 'city3', name: 'City Builder', icon: '🏙️', desc: 'Build 3 city buildings', check: s => Object.values(s.city).filter(v => v > 0).length >= 3 },
  { id: 'exchange', name: 'CEO', icon: '🏢', desc: 'Open your own exchange', check: s => s.exchangeOpen },
]

const BUILDINGS = [
  { id: 'bank', name: 'Crypto Bank', icon: '🏦', desc: 'Generates passive USDT every second', baseCost: 1000, color: '#eab308', effectStr: '+$1/sec' },
  { id: 'farm', name: 'Mining HQ', icon: '🏭', desc: 'Boosts total Hash Power globally', baseCost: 2000, color: '#3b82f6', effectStr: '+5% Hash Power' },
  { id: 'hospital', name: 'Bitcoin Hospital', icon: '🏥', desc: 'Optimizes supply, making miners cheaper', baseCost: 1500, color: '#ef4444', effectStr: '-5% Miner Cost' },
  { id: 'academy', name: 'Web3 Academy', icon: '🎓', desc: 'Researches cooling, making racks cheaper', baseCost: 1200, color: '#10b981', effectStr: '-10% Rack Cost' },
  { id: 'hub', name: 'Trading Hub', icon: '🛒', desc: 'Boosts your Exchange trading volume', baseCost: 3000, color: '#8b5cf6', effectStr: '+10% Exchange Vol' },
  { id: 'park', name: 'Satoshi Park', icon: '⛲', desc: 'Attracts crypto enthusiasts. Passive BTC', baseCost: 5000, color: '#22c55e', effectStr: '+0.00000001 BTC/s' }
]

// Лутбоксы
const LOOT_BOXES = [
  { 
    id: 'common_box', 
    name: 'Common Box', 
    icon: '📦', 
    price: 250, 
    color: '#6b7280',
    description: 'Содержит обычных майнеров',
    odds: { common: 0.85, rare: 0.15, epic: 0, legendary: 0 }
  },
  { 
    id: 'rare_box', 
    name: 'Rare Box', 
    icon: '🎁', 
    price: 850, 
    color: '#3b82f6',
    description: 'Высокий шанс на редких майнеров',
    odds: { common: 0.45, rare: 0.45, epic: 0.1, legendary: 0 }
  },
  { 
    id: 'epic_box', 
    name: 'Epic Box', 
    icon: '💎', 
    price: 2400, 
    color: '#a855f7',
    description: 'Шанс на эпических майнеров',
    odds: { common: 0.25, rare: 0.45, epic: 0.25, legendary: 0.05 }
  },
  { 
    id: 'legendary_box', 
    name: 'Legendary Box', 
    icon: '👑', 
    price: 6500, 
    color: '#fbbf24',
    description: 'Высокий шанс на легендарных майнеров',
    odds: { common: 0.1, rare: 0.3, epic: 0.4, legendary: 0.2 }
  }
]

const NEWS_TEMPLATES: { tpl: string; sentiment: NewsItem['sentiment']; impact: NewsItem['impact']; cat: string }[] = [
  { tpl: '{SYM} breaks above ${PRICE} as institutional demand surges', sentiment: 'bullish', impact: 'high', cat: 'Market' },
  { tpl: '{SYM} faces resistance at ${PRICE} — analysts warn of correction', sentiment: 'bearish', impact: 'medium', cat: 'Market' },
  { tpl: 'Ethereum gas fees spike amid DeFi activity surge', sentiment: 'neutral', impact: 'medium', cat: 'Tech' },
  { tpl: 'SEC delays decision on spot {SYM} ETF application', sentiment: 'bearish', impact: 'high', cat: 'Regulation' },
  { tpl: 'Federal Reserve holds rates steady — crypto markets rally', sentiment: 'bullish', impact: 'high', cat: 'Macro' },
  { tpl: 'Major whale accumulates {SYM} — on-chain data shows large transfer', sentiment: 'bullish', impact: 'medium', cat: 'On-Chain' },
  { tpl: '{SYM} network sees record daily active addresses', sentiment: 'bullish', impact: 'medium', cat: 'Tech' },
  { tpl: 'China tightens crypto regulations — markets react', sentiment: 'bearish', impact: 'high', cat: 'Regulation' },
  { tpl: 'BlackRock increases {SYM} holdings via spot ETF', sentiment: 'bullish', impact: 'high', cat: 'Institutional' },
  { tpl: '{SYM} volatility index hits 30-day low — breakout expected', sentiment: 'neutral', impact: 'low', cat: 'Market' },
  { tpl: 'Treasury Secretary signals favorable crypto policy', sentiment: 'bullish', impact: 'medium', cat: 'Macro' },
  { tpl: 'Tether mints 1B USDT — stablecoin supply reaches ATH', sentiment: 'neutral', impact: 'low', cat: 'On-Chain' },
  { tpl: '{SYM} flash crash triggered by large sell order on Binance', sentiment: 'bearish', impact: 'high', cat: 'Market' },
  { tpl: 'MicroStrategy adds {SYM} to treasury reserves', sentiment: 'bullish', impact: 'medium', cat: 'Institutional' },
  { tpl: 'EU MiCA regulation goes into effect — exchanges comply', sentiment: 'neutral', impact: 'medium', cat: 'Regulation' },
  { tpl: '{SYM} Layer-2 TVL surpasses $10B milestone', sentiment: 'bullish', impact: 'medium', cat: 'DeFi' },
  { tpl: 'Bitcoin mining difficulty reaches new all-time high', sentiment: 'neutral', impact: 'low', cat: 'Mining' },
  { tpl: 'JP Morgan upgrades {SYM} price target to ${PRICE}', sentiment: 'bullish', impact: 'high', cat: 'Institutional' },
  { tpl: 'Hackers exploit {SYM} bridge — $50M lost', sentiment: 'bearish', impact: 'high', cat: 'Security' },
  { tpl: 'CPI data comes in below expectations — risk assets rally', sentiment: 'bullish', impact: 'medium', cat: 'Macro' },
]

const INIT: AssetState[] = ASSETS.map(a => ({
  ...a, price: a.seedPrice, change24h: 0, source: 'mixed' as const, sourceQuotes: {},
}))

// Trading fees
const TRADING_FEE = 0.001 // 0.1%
const MARKET_SLIPPAGE = 0.002 // 0.2% base slippage for market orders

/* ═══════════════════════════════════════════
   UTILITIES
   ═══════════════════════════════════════════ */
const fmt = (v: number, d = 2) => new Intl.NumberFormat('en-US', { minimumFractionDigits: d, maximumFractionDigits: d }).format(v)
const fmtC = (v: number) => v >= 1 ? v.toFixed(4) : v >= 0.01 ? v.toFixed(6) : v.toFixed(8)
const fmtK = (v: number) => new Intl.NumberFormat('en-US', { notation: 'compact', maximumFractionDigits: 2 }).format(v)
const pct = (v: number) => `${v >= 0 ? '+' : ''}${v.toFixed(2)}%`
const clamp = (v: number, lo: number, hi: number) => Math.min(hi, Math.max(lo, v))
const rand = () => Math.random()
const gaussRand = () => { let u = 0, v = 0; while (!u) u = rand(); while (!v) v = rand(); return Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * v) }

async function fetchJ<T>(url: string, opts?: RequestInit, ms = 8000): Promise<T> {
  const c = new AbortController(); const t = setTimeout(() => c.abort(), ms)
  try { const r = await fetch(url, { ...opts, signal: c.signal }); if (!r.ok) throw new Error(`${r.status}`); return r.json() as Promise<T> }
  finally { clearTimeout(t) }
}

/* ═══════════════════════════════════════════
   DATA GENERATORS
   ═══════════════════════════════════════════ */
function genCandles(base: number, n: number, intMs: number, vol = 0.008): Candle[] {
  const out: Candle[] = []
  let p = base * (0.96 + rand() * 0.04)
  let v = vol
  const now = Date.now()
  for (let i = 0; i < n; i++) {
    const time = now - (n - i) * intMs
    v = clamp(v * 0.94 + vol * 0.06 + Math.abs(gaussRand()) * vol * 0.15, vol * 0.3, vol * 4)
    const o = p
    const drift = (base - p) * 0.0005
    const move = p * v * gaussRand() + drift
    const jump = rand() < 0.03 ? p * 0.015 * (rand() > 0.5 ? 1 : -1) : 0
    const c = o + move + jump
    const h = Math.max(o, c) + Math.abs(p * v * rand() * 0.6)
    const l = Math.min(o, c) - Math.abs(p * v * rand() * 0.6)
    const volume = (Math.abs(move) / p) * 5e6 * (0.4 + rand())
    out.push({ time, open: o, high: h, low: l, close: c, volume })
    p = c
  }
  return out
}

function ema(data: number[], period: number): number[] {
  const k = 2 / (period + 1); const r = [data[0]]
  for (let i = 1; i < data.length; i++) r.push(data[i] * k + r[i - 1] * (1 - k))
  return r
}

function genOrderBook(mid: number): { bids: OBLevel[]; asks: OBLevel[] } {
  const bids: OBLevel[] = []; const asks: OBLevel[] = []
  const spread = mid * 0.0002
  let cb = 0, ca = 0
  for (let i = 0; i < 15; i++) {
    const bp = mid - spread / 2 - i * mid * 0.00015 * (1 + rand() * 0.5)
    const ap = mid + spread / 2 + i * mid * 0.00015 * (1 + rand() * 0.5)
    const ba = (0.1 + rand() * 3) * (1 + i * 0.15) * (rand() > 0.85 ? 3 : 1)
    const aa = (0.1 + rand() * 3) * (1 + i * 0.15) * (rand() > 0.85 ? 3 : 1)
    cb += ba; ca += aa
    bids.push({ price: bp, amount: ba, total: cb })
    asks.push({ price: ap, amount: aa, total: ca })
  }
  return { bids, asks }
}

function genNews(assets: AssetState[]): NewsItem {
  const a = assets[Math.floor(rand() * assets.length)]
  const t = NEWS_TEMPLATES[Math.floor(rand() * NEWS_TEMPLATES.length)]
  const title = t.tpl.replace('{SYM}', a.symbol).replace('${PRICE}', fmt(a.price, a.price < 1 ? 4 : 0))
  const sources = ['CoinDesk', 'The Block', 'Decrypt', 'Bloomberg Crypto', 'DL News', 'Blockworks']
  return {
    id: `${Date.now()}-${rand()}`, title, source: sources[Math.floor(rand() * sources.length)],
    time: Date.now(), sentiment: t.sentiment, impact: t.impact, category: t.cat, symbol: a.symbol,
  }
}

/* ═══════════════════════════════════════════
   API FETCHERS
   ═══════════════════════════════════════════ */
async function fetchCG() {
  const ids = ASSETS.map(a => a.coingeckoId).join(',')
  const rows = await fetchJ<any[]>(`${API_CG}/coins/markets?vs_currency=usd&ids=${ids}&price_change_percentage=24h`)
  const m: Record<string, SourceQuote> = {}
  for (const r of rows) {
    const a = ASSETS.find(x => x.coingeckoId === r.id); if (!a) continue
    m[a.symbol] = { price: +r.current_price, change24h: +r.price_change_percentage_24h, marketCap: +r.market_cap, volume24h: +r.total_volume }
  }
  return m
}

async function fetchBN() {
  const r = await Promise.allSettled(ASSETS.map(async a => {
    const d = await fetchJ<any>(`${API_BN}/ticker/24hr?symbol=${a.binanceSymbol}`)
    return [a.symbol, { price: +d.lastPrice, change24h: +d.priceChangePercent, volume24h: +d.quoteVolume }] as const
  }))
  const m: Record<string, SourceQuote> = {}
  r.forEach(x => { if (x.status === 'fulfilled') { const [s, q] = x.value; m[s] = q } })
  return m
}

async function fetchBNCandles(sym: string) {
  const rows = await fetchJ<any[]>(`${API_BN}/klines?symbol=${sym}&interval=15m&limit=96`)
  return rows.map(r => ({ time: +r[0], open: +r[1], high: +r[2], low: +r[3], close: +r[4], volume: +r[5] }))
}

/* ═══════════════════════════════════════════
   TRADINGVIEW CHART
   ═══════════════════════════════════════════ */
function TVChart({ candles, symbol }: { candles: Candle[]; symbol: string }) {
  const [hover, setHover] = useState<number | null>(null)
  const W = 900, H = 420, PL = 8, PR = 72, PT = 16, PB = 56
  const cW = W - PL - PR, cH = H - PT - PB, volH = 60

  if (candles.length < 2) return <div className="tv-chart tv-empty"><span>Loading chart data...</span></div>

  const prices = candles.flatMap(c => [c.high, c.low])
  const pMin = Math.min(...prices), pMax = Math.max(...prices)
  const pRange = pMax - pMin || 1
  const vMax = Math.max(...candles.map(c => c.volume))
  const barW = Math.max(2, (cW / candles.length) * 0.7)
  const gap = cW / candles.length

  const yP = (p: number) => PT + (1 - (p - pMin) / pRange) * (cH - volH)
  const xC = (i: number) => PL + i * gap + gap / 2

  const closes = candles.map(c => c.close)
  const ema7 = ema(closes, 7)
  const ema25 = ema(closes, 25)

  const emaPath = (data: number[]) => data.map((v, i) => `${i === 0 ? 'M' : 'L'} ${xC(i).toFixed(1)} ${yP(v).toFixed(1)}`).join(' ')

  const gridLines = 6
  const gridStep = pRange / gridLines

  const last = candles[candles.length - 1]
  const hi = hover !== null ? candles[hover] : null

  return (
    <div className="tv-chart">
      <div className="tv-header">
        <span className="tv-sym">{symbol}/USDT</span>
        <span className="tv-tf">15m</span>
        <span className={last.close >= last.open ? 'tv-up' : 'tv-dn'}>{fmt(last.close, last.close < 1 ? 6 : 2)}</span>
        <span className={last.close >= last.open ? 'tv-up' : 'tv-dn'}>{pct(((last.close - candles[0].open) / candles[0].open) * 100)}</span>
        <span className="tv-ema-label"><i style={{ background: '#f5c542' }} />EMA 7</span>
        <span className="tv-ema-label"><i style={{ background: '#42a5f5' }} />EMA 25</span>
      </div>
      <svg viewBox={`0 0 ${W} ${H}`} className="tv-svg"
        onMouseMove={e => {
          const rect = e.currentTarget.getBoundingClientRect()
          const mx = ((e.clientX - rect.left) / rect.width) * W
          const idx = Math.round((mx - PL - gap / 2) / gap)
          setHover(clamp(idx, 0, candles.length - 1))
        }}
        onMouseLeave={() => setHover(null)}
      >
        <rect x={0} y={0} width={W} height={H} fill="#131722" rx={8} />
        {Array.from({ length: gridLines + 1 }, (_, i) => {
          const p = pMin + i * gridStep
          const y = yP(p)
          return (
            <g key={`grid-${i}`}>
              <line x1={PL} x2={W - PR} y1={y} y2={y} stroke="#1e222d" strokeWidth={1} />
              <text x={W - PR + 6} y={y + 4} fill="#787b86" fontSize={11} fontFamily="monospace">{fmt(p, p < 1 ? 4 : 0)}</text>
            </g>
          )
        })}
        {candles.filter((_, i) => i % Math.ceil(candles.length / 8) === 0).map((c, i) => {
          const idx = candles.indexOf(c)
          const d = new Date(c.time)
          return <text key={`t${i}`} x={xC(idx)} y={H - 8} fill="#787b86" fontSize={10} textAnchor="middle" fontFamily="monospace">{`${d.getHours().toString().padStart(2, '0')}:${d.getMinutes().toString().padStart(2, '0')}`}</text>
        })}
        {candles.map((c, i) => {
          const bh = (c.volume / vMax) * volH
          return <rect key={`v${i}`} x={xC(i) - barW / 2} y={H - PB - bh} width={barW} height={bh} fill={c.close >= c.open ? 'rgba(38,166,154,0.25)' : 'rgba(239,83,80,0.25)'} rx={1} />
        })}
        {candles.map((c, i) => {
          const up = c.close >= c.open
          const bodyTop = yP(Math.max(c.open, c.close))
          const bodyBot = yP(Math.min(c.open, c.close))
          const bodyH = Math.max(1, bodyBot - bodyTop)
          const cx = xC(i)
          return (
            <g key={`c${i}`}>
              <line x1={cx} x2={cx} y1={yP(c.high)} y2={yP(c.low)} stroke={up ? '#26a69a' : '#ef5350'} strokeWidth={1.5} />
              <rect x={cx - barW / 2} y={bodyTop} width={barW} height={bodyH} fill={up ? '#26a69a' : '#ef5350'} rx={1} />
            </g>
          )
        })}
        <path d={emaPath(ema7)} fill="none" stroke="#f5c542" strokeWidth={1.5} opacity={0.8} />
        <path d={emaPath(ema25)} fill="none" stroke="#42a5f5" strokeWidth={1.5} opacity={0.8} />
        <line x1={PL} x2={W - PR} y1={yP(last.close)} y2={yP(last.close)} stroke={last.close >= last.open ? '#26a69a' : '#ef5350'} strokeWidth={1} strokeDasharray="4 3" opacity={0.7} />
        <rect x={W - PR} y={yP(last.close) - 10} width={PR - 4} height={20} fill={last.close >= last.open ? '#26a69a' : '#ef5350'} rx={3} />
        <text x={W - PR + 6} y={yP(last.close) + 4} fill="#fff" fontSize={11} fontFamily="monospace">{fmt(last.close, last.close < 1 ? 4 : 0)}</text>
        {hi && hover !== null && (
          <g>
            <line x1={xC(hover)} x2={xC(hover)} y1={PT} y2={H - PB} stroke="#787b86" strokeWidth={0.5} strokeDasharray="3 3" />
            <line x1={PL} x2={W - PR} y1={yP(hi.close)} y2={yP(hi.close)} stroke="#787b86" strokeWidth={0.5} strokeDasharray="3 3" />
            <rect x={W - PR} y={yP(hi.close) - 10} width={PR - 4} height={20} fill="#2962ff" rx={3} />
            <text x={W - PR + 6} y={yP(hi.close) + 4} fill="#fff" fontSize={11} fontFamily="monospace">{fmt(hi.close, hi.close < 1 ? 4 : 0)}</text>
          </g>
        )}
      </svg>
      {hi && (
        <div className="tv-ohlcv">
          <span>O <b style={{ color: hi.close >= hi.open ? '#26a69a' : '#ef5350' }}>{fmt(hi.open, hi.open < 1 ? 6 : 2)}</b></span>
          <span>H <b style={{ color: '#26a69a' }}>{fmt(hi.high, hi.high < 1 ? 6 : 2)}</b></span>
          <span>L <b style={{ color: '#ef5350' }}>{fmt(hi.low, hi.low < 1 ? 6 : 2)}</b></span>
          <span>C <b style={{ color: hi.close >= hi.open ? '#26a69a' : '#ef5350' }}>{fmt(hi.close, hi.close < 1 ? 6 : 2)}</b></span>
          <span>Vol <b>{fmtK(hi.volume)}</b></span>
        </div>
      )}
    </div>
  )
}

/* ═══════════════════════════════════════════
   ORDER BOOK
   ═══════════════════════════════════════════ */
function OrderBook({ bids, asks, mid }: { bids: OBLevel[]; asks: OBLevel[]; mid: number }) {
  const maxT = Math.max(bids[0]?.total ?? 0, asks[asks.length - 1]?.total ?? 0)
  return (
    <div className="ob">
      <div className="ob-header">
        <span>Order Book</span>
        <span className="ob-spread">Spread: {fmt(mid * 0.0002, mid < 1 ? 6 : 2)} ({(0.02).toFixed(3)}%)</span>
      </div>
      <div className="ob-cols">
        <span>Price</span><span>Amount</span><span>Total</span>
      </div>
      <div className="ob-asks">
        {[...asks].reverse().slice(0, 12).map((a, i) => (
          <div key={`a${i}`} className="ob-row ob-ask">
            <div className="ob-bar" style={{ width: `${(a.total / maxT) * 100}%`, background: 'rgba(239,83,80,0.15)' }} />
            <span className="ob-price ob-ask-price">{fmt(a.price, a.price < 1 ? 6 : 2)}</span>
            <span className="ob-amt">{a.amount.toFixed(4)}</span>
            <span className="ob-total">{a.total.toFixed(4)}</span>
          </div>
        ))}
      </div>
      <div className="ob-mid">
        <span className="ob-mid-price">{fmt(mid, mid < 1 ? 6 : 2)}</span>
        <span className="ob-mid-label">Mid Price</span>
      </div>
      <div className="ob-bids">
        {bids.slice(0, 12).map((b, i) => (
          <div key={`b${i}`} className="ob-row ob-bid">
            <div className="ob-bar" style={{ width: `${(b.total / maxT) * 100}%`, background: 'rgba(38,166,154,0.15)' }} />
            <span className="ob-price ob-bid-price">{fmt(b.price, b.price < 1 ? 6 : 2)}</span>
            <span className="ob-amt">{b.amount.toFixed(4)}</span>
            <span className="ob-total">{b.total.toFixed(4)}</span>
          </div>
        ))}
      </div>
    </div>
  )
}

/* ═══════════════════════════════════════════
   MAIN APP
   ═══════════════════════════════════════════ */
function App() {
  const [tab, setTab] = useState<Tab>('city')
  const [balance, setBalance] = useState(280)
  const [assets, setAssets] = useState<AssetState[]>(INIT)
  const [sym, setSym] = useState('BTC')
  const [holdings, setHoldings] = useState<Record<string, number>>({})
  const [trades, setTrades] = useState<Trade[]>([])
  const [tradeAmt, setTradeAmt] = useState(0.01)
  const [tradeSide, setTradeSide] = useState<'buy' | 'sell'>('buy')
  const [candleMap, setCandleMap] = useState<Record<string, Candle[]>>({})
  const [ob, setOB] = useState<{ bids: OBLevel[]; asks: OBLevel[] }>({ bids: [], asks: [] })
  const [fPos, setFPos] = useState<FuturesPos[]>([])
  const [lev, setLev] = useState(10)
  const [fAmt, setFAmt] = useState(0.001)
  const [orders, setOrders] = useState<LimitOrder[]>([])
  const [orderType, setOrderType] = useState<OrderType>('limit_buy')
  const [orderPrice, setOrderPrice] = useState(0)
  const [orderAmt, setOrderAmt] = useState(0.01)
  const [news, setNews] = useState<NewsItem[]>([])
  const [lastSync, setLastSync] = useState('—')
  const [srcState, setSrcState] = useState<Record<Source, boolean>>({ coingecko: false, binance: false, coinmarketcap: false })
  const [exchange, setExchange] = useState<Exchange | null>(null)
  const [showExchangeModal, setShowExchangeModal] = useState(false)
  const [exchangeName, setExchangeName] = useState('')

  // Mining Room State
  const [racks, setRacks] = useState<Rack[]>([
    { id: 'rack-1', slots: [
      { id: 'slot-1-1', minerId: null, durability: 100 }, 
      { id: 'slot-1-2', minerId: null, durability: 100 },
      { id: 'slot-1-3', minerId: null, durability: 100 }, 
      { id: 'slot-1-4', minerId: null, durability: 100 },
    ]}
  ])

  // Mining Mode
  const [miningMode, setMiningMode] = useState<'BTC' | 'ETH' | 'SOL'>('BTC')

  // City State
  const [city, setCity] = useState<Record<string, number>>({})
  
  // Seasons & NFT & Achievements
  const [season, setSeason] = useState<{ event: SeasonEvent; startedAt: number; endsAt: number } | null>(null)
  const [nftInventory, setNftInventory] = useState<string[]>([])
  const [unlockedAchs, setUnlockedAchs] = useState<string[]>([])
  const [seasonLog, setSeasonLog] = useState<string[]>([])
  const [nftMarket, setNftMarket] = useState<NftListing[]>([])
  // Draft prices entered by the user when listing NFTs for sale; submitted
  // explicitly via the "Выставить" button so partial keystrokes don't list.
  const [nftSellDraft, setNftSellDraft] = useState<Record<string, string>>({})

  // === Сохранение и загрузка прогресса ===
  const saveGame = useCallback(() => {
    const saveData = {
      balance,
      holdings,
      racks,
      city,
      nftInventory,
      unlockedAchs,
      exchange,
      seasonLog: [],
      timestamp: Date.now()
    }
    localStorage.setItem('cryptominer_save', JSON.stringify(saveData))
    setSeasonLog(prev => [`💾 Игра сохранена`, ...prev].slice(0, 20))
  }, [balance, holdings, racks, city, nftInventory, unlockedAchs, exchange])

  const loadGame = useCallback(() => {
    const saved = localStorage.getItem('cryptominer_save')
    if (!saved) return false

    try {
      const data = JSON.parse(saved)
      
      if (data.balance !== undefined) setBalance(data.balance)
      if (data.holdings) setHoldings(data.holdings)
      if (data.racks) setRacks(data.racks)
      if (data.city) setCity(data.city)
      if (data.nftInventory) setNftInventory(data.nftInventory)
      if (data.unlockedAchs) setUnlockedAchs(data.unlockedAchs)
      if (data.exchange) setExchange(data.exchange)
      if (data.seasonLog) setSeasonLog(data.seasonLog)
      
      setSeasonLog(prev => [`📂 Игра загружена (${new Date(data.timestamp).toLocaleTimeString()})`, ...prev].slice(0, 20))
      return true
    } catch (e) {
      console.error('Ошибка загрузки сохранения:', e)
      return false
    }
  }, [])

  // Автосохранение при изменении важных данных
  useEffect(() => {
    const timer = setTimeout(() => {
      if (balance > 500 || Object.keys(holdings).length > 0 || racks.length > 1) {
        const saveData = {
          balance, holdings, racks, city, nftInventory, unlockedAchs, exchange, seasonLog, timestamp: Date.now()
        }
        localStorage.setItem('cryptominer_save', JSON.stringify(saveData))
      }
    }, 3000)
    return () => clearTimeout(timer)
  }, [balance, holdings, racks, city, nftInventory, unlockedAchs, exchange, seasonLog])

  // Загрузка при старте
  useEffect(() => {
    const hasSave = localStorage.getItem('cryptominer_save')
    if (hasSave) {
      loadGame()
    }
  }, []) // eslint-disable-line react-hooks/exhaustive-deps


  const sel = useMemo(() => assets.find(a => a.symbol === sym) ?? assets[0], [assets, sym])
  const portVal = useMemo(() => balance + Object.entries(holdings).reduce((s, [k, v]) => {
    const a = assets.find(x => x.symbol === k); return s + (a ? a.price * v : 0)
  }, 0), [assets, balance, holdings])
  
  // City Effects
  const minerDiscount = Math.max(0.1, 1 - (city.hospital || 0) * 0.05)
  const rackDiscount = Math.max(0.1, 1 - (city.academy || 0) * 0.1)
  const hashMultiplier = 1 + (city.farm || 0) * 0.05
  const exchVolMultiplier = 1 + (city.hub || 0) * 0.1
  
  // Mining calculations
  const basePow = useMemo(() => racks.reduce((s, r) => s + r.slots.reduce((ss, slot) => {
    const m = MINERS.find(x => x.id === slot.minerId)
    return ss + (m?.power ?? 0)
  }, 0), 0), [racks])
  
  // NFT perks
  const installedNfts = useMemo(() => racks.flatMap(r => r.slots.filter(s => s.nftMinerId).map(s => NFT_MINERS.find(n => n.id === s.nftMinerId)!)).filter(Boolean), [racks])
  const hasAlien = installedNfts.some(n => n.perk === 'alien')
  const hasSatoshi = installedNfts.some(n => n.perk === 'satoshi')
  const hasSolar = installedNfts.some(n => n.perk === 'solar')
  const nftPowerBonus = (hasAlien ? 2 : 1) * (hasSatoshi ? 1.5 : 1)
  const solarPassive = hasSolar ? 2 : 0
  
  // Season modifiers
  const seasonMiningMul = season ? season.event.miningMultiplier : 1
  const seasonPriceMul = season ? season.event.priceMultiplier : 1

  // Бонус от специализации майнеров
  const gpuPower = useMemo(() => racks.reduce((s, r) => s + r.slots.reduce((ss, slot) => {
    const m = MINERS.find(x => x.id === slot.minerId)
    return ss + (m && (m.coin === 'ETH' || m.coin === 'MULTI') ? m.power : 0)
  }, 0), 0), [racks])

  const asicPower = useMemo(() => racks.reduce((s, r) => s + r.slots.reduce((ss, slot) => {
    const m = MINERS.find(x => x.id === slot.minerId)
    return ss + (m && m.coin === 'BTC' ? m.power : 0)
  }, 0), 0), [racks])

  let modeMultiplier = 1
  if (miningMode === 'ETH') modeMultiplier = 1 + (gpuPower / (basePow || 1)) * 0.4
  if (miningMode === 'BTC') modeMultiplier = 1 + (asicPower / (basePow || 1)) * 0.5

  const totalPow = useMemo(() => {
    return racks.reduce((total, rack) => {
      return total + rack.slots.reduce((sum, slot) => {
        if (!slot.minerId) return sum
        const miner = MINERS.find(m => m.id === slot.minerId)
        if (!miner) return sum

        let power = miner.power

        // Износ
        const durability = slot.durability ?? 100
        power *= (durability / 100)

        // Overclock
        if (slot.overclockEnd && Date.now() < slot.overclockEnd) {
          power *= 1.3
        }

        return sum + power
      }, 0)
    }, 0) * hashMultiplier * nftPowerBonus * seasonMiningMul * modeMultiplier
  }, [racks, hashMultiplier, nftPowerBonus, seasonMiningMul, modeMultiplier])
  const selCandles = useMemo(() => candleMap[sym] ?? genCandles(sel.price, 80, 900000), [candleMap, sym, sel.price])
  const canOpenExchange = portVal >= 10000 && !exchange


  const walletRows = useMemo(() => assets.map(asset => {
    const amount = holdings[asset.symbol] ?? 0
    const reserved = orders.filter(o => o.status === 'open' && o.symbol === asset.symbol && o.type === 'limit_sell').reduce((sum, o) => sum + o.amount, 0)
    const available = Math.max(0, amount - reserved)
    return { ...asset, amount, reserved, available, value: amount * asset.price }
  }).filter(row => row.amount > 0 || row.reserved > 0 || ['ETH', 'SOL'].includes(row.symbol)), [assets, holdings, orders])

  const reservedUsd = useMemo(() => orders.filter(o => o.status === 'open' && o.type === 'limit_buy').reduce((sum, o) => sum + o.total, 0), [orders])
  const currentCoinPrice = assets.find(a => a.symbol === miningMode)?.price ?? 0
  const miningIncomeDayUsd = (totalPow * 1.5e-8) * 86400 * currentCoinPrice

  // Fetch live prices
  useEffect(() => {
    let off = false
    async function tick() {
      const [cg, bn] = await Promise.all([fetchCG().catch(() => ({})), fetchBN().catch(() => ({}))])
      if (off) return
      const cgQ = cg as Record<string, SourceQuote>
      const bnQ = bn as Record<string, SourceQuote>
      setAssets(prev => prev.map(a => {
        const qCG = cgQ[a.symbol], qBN = bnQ[a.symbol]
        const price = qCG?.price ?? qBN?.price ?? a.price
        const change24h = qCG?.change24h ?? qBN?.change24h ?? a.change24h
        return {
          ...a, price, change24h,
          marketCap: qCG?.marketCap ?? a.marketCap,
          volume24h: qCG?.volume24h ?? qBN?.volume24h ?? a.volume24h,
          source: qCG ? 'coingecko' : qBN ? 'binance' : 'mixed',
          sourceQuotes: { coingecko: qCG ?? a.sourceQuotes.coingecko, binance: qBN ?? a.sourceQuotes.binance },
        }
      }))
      setSrcState({ coingecko: Object.keys(cgQ).length > 0, binance: Object.keys(bnQ).length > 0, coinmarketcap: false })
      setLastSync(new Date().toLocaleTimeString('ru-RU'))
    }
    tick(); const iv = setInterval(tick, 30000)
    return () => { off = true; clearInterval(iv) }
  }, [])

  // Fetch Binance candles
  useEffect(() => {
    let off = false
    async function load() {
      const meta = ASSETS.find(a => a.symbol === sym)
      if (!meta) return
      try {
        const data = await fetchBNCandles(meta.binanceSymbol)
        if (!off) setCandleMap(prev => ({ ...prev, [sym]: data }))
      } catch {
        if (!off) setCandleMap(prev => ({ ...prev, [sym]: genCandles(assets.find(a => a.symbol === sym)?.price ?? meta.seedPrice, 80, 900000) }))
      }
    }
    load(); const iv = setInterval(load, 60000)
    return () => { off = true; clearInterval(iv) }
  }, [sym, assets])

  // Generate order book
  useEffect(() => {
    const iv = setInterval(() => setOB(genOrderBook(sel.price)), 2000)
    setOB(genOrderBook(sel.price))
    return () => clearInterval(iv)
  }, [sel.price])

  // Generate news
  useEffect(() => {
    const init = Array.from({ length: 8 }, () => ({ ...genNews(assets), time: Date.now() - Math.floor(rand() * 3600000) }))
    setNews(init.sort((a, b) => b.time - a.time))
    const iv = setInterval(() => {
      setNews(prev => [genNews(assets), ...prev].slice(0, 30))
    }, 25000 + rand() * 20000)
    return () => clearInterval(iv)
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // Mining & City Passive Income + Wear System
  useEffect(() => {
    const rps = totalPow * 1.5e-8
    const passiveUsd = (city.bank || 0) * 1.0 + solarPassive
    const passiveBtc = (city.park || 0) * 1e-8
    
    // Wear system: decrease durability every 30 seconds
    const wearInterval = setInterval(() => {
      setRacks(prev => prev.map(rack => ({
        ...rack,
        slots: rack.slots.map(slot => {
          if (!slot.minerId) return slot
          const currentDurability = slot.durability ?? 100
          const newDurability = Math.max(0, currentDurability - (1 + Math.random() * 2))
          return { ...slot, durability: newDurability }
        })
      })))
    }, 30000)

    if (rps <= 0 && passiveUsd <= 0 && passiveBtc <= 0) {
      return () => clearInterval(wearInterval)
    }
    
    const incomeInterval = setInterval(() => {
      if (rps > 0) {
        setHoldings(p => ({ ...p, [miningMode]: (p[miningMode] ?? 0) + rps }))
      }
      if (passiveBtc > 0 && miningMode === 'BTC') {
        setHoldings(p => ({ ...p, BTC: (p.BTC ?? 0) + passiveBtc }))
      }
      if (passiveUsd > 0) setBalance(b => b + passiveUsd)
    }, 1000)
    
    return () => {
      clearInterval(wearInterval)
      clearInterval(incomeInterval)
    }
  }, [totalPow, city.bank, city.park, solarPassive, miningMode])

  // Season Events — auto cycle
  useEffect(() => {
    const iv = setInterval(() => {
      setSeason(prev => {
        if (prev && Date.now() < prev.endsAt) return prev // active
        if (prev && Date.now() >= prev.endsAt) {
          setSeasonLog(l => [`${prev.event.icon} ${prev.event.name} ended`, ...l].slice(0, 20))
          return null // ended
        }
        // Random chance to start new event
        if (rand() < 0.15) {
          const ev = SEASON_EVENTS[Math.floor(rand() * SEASON_EVENTS.length)]
          const now = Date.now()
          setSeasonLog(l => [`${ev.icon} ${ev.name} started!`, ...l].slice(0, 20))
          return { event: ev, startedAt: now, endsAt: now + ev.duration }
        }
        return null
      })
    }, 15000)
    return () => clearInterval(iv)
  }, [])

  // NFT Drop — random chance every 30s when mining
  useEffect(() => {
    if (totalPow <= 0) return
    const iv = setInterval(() => {
      const dropChance = 0.05 + totalPow * 0.001 // Higher power = better chance
      if (rand() < dropChance) {
        // Weight by rarity
        const roll = rand()
        let pool: NFTMiner[]
        if (roll < 0.05) pool = NFT_MINERS.filter(n => n.rarity === 'legendary')
        else if (roll < 0.25) pool = NFT_MINERS.filter(n => n.rarity === 'epic')
        else pool = NFT_MINERS.filter(n => n.rarity === 'rare')
        
        const nft = pool[Math.floor(rand() * pool.length)]
        setNftInventory(prev => [...prev, nft.id])
        setSeasonLog(l => [`🎉 NFT DROP: ${nft.icon} ${nft.name} (${nft.rarity})!`, ...l].slice(0, 20))
      }
    }, 30000)
    return () => clearInterval(iv)
  }, [totalPow])

  // Achievement checker
  useEffect(() => {
    const iv = setInterval(() => {
      const achState: AchState = {
        balance, portVal, totalPow, trades: trades.length,
        city, nftCount: nftInventory.length, exchangeOpen: !!exchange,
      }
      ACHIEVEMENTS.forEach(a => {
        if (!unlockedAchs.includes(a.id) && a.check(achState)) {
          setUnlockedAchs(prev => [...prev, a.id])
          setSeasonLog(l => [`🏆 Achievement: ${a.icon} ${a.name}!`, ...l].slice(0, 20))
        }
      })
    }, 5000)
    return () => clearInterval(iv)
  }, [balance, portVal, totalPow, trades, city, nftInventory, exchange, unlockedAchs])

  // Futures PnL check — liquidation
  useEffect(() => {
    if (!fPos.length) return
    const iv = setInterval(() => {
      setFPos(prev => {
        const surviving: FuturesPos[] = []
        for (const pos of prev) {
          const a = assets.find(x => x.symbol === pos.symbol)
          if (!a) { surviving.push(pos); continue }
          // Margin was already debited when the position was opened, so liquidation
          // simply forfeits it — no second deduction here.
          if (pos.side === 'long' && a.price <= pos.liqPrice) { continue }
          if (pos.side === 'short' && a.price >= pos.liqPrice) { continue }
          surviving.push(pos)
        }
        return surviving
      })
    }, 3000)
    return () => clearInterval(iv)
  }, [fPos, assets])

  // Check limit orders
  useEffect(() => {
    const iv = setInterval(() => {
      setOrders(prev => prev.map(order => {
        if (order.status !== 'open') return order
        const a = assets.find(x => x.symbol === order.symbol)
        if (!a) return order
        if (order.type === 'limit_buy' && a.price <= order.price) {
          setHoldings(p => ({ ...p, [order.symbol]: (p[order.symbol] ?? 0) + order.amount }))
          setTrades(t => [{ symbol: order.symbol, amount: order.amount, price: order.price, type: 'buy' as const, ts: Date.now() }, ...t].slice(0, 30))
          return { ...order, status: 'filled' }
        }
        if (order.type === 'limit_sell' && a.price >= order.price) {
          setBalance(b => b + order.total)
          setTrades(t => [{ symbol: order.symbol, amount: order.amount, price: order.price, type: 'sell' as const, ts: Date.now() }, ...t].slice(0, 30))
          return { ...order, status: 'filled' }
        }
        return order
      }))
    }, 2000)
    return () => clearInterval(iv)
  }, [assets])

  // Exchange fees
  useEffect(() => {
    if (!exchange) return
    const iv = setInterval(() => {
      const fee = exchange.totalVolume * exchange.tradingFee * 0.001 * exchVolMultiplier
      if (fee > 0) {
        setBalance(b => b + fee)
        setExchange(e => e ? { ...e, totalFees: e.totalFees + fee } : null)
      }
    }, 10000)
    return () => clearInterval(iv)
  }, [exchange, exchVolMultiplier])

  const tradeCost = tradeAmt * sel.price
  const owned = holdings[sel.symbol] ?? 0

  const execTrade = useCallback(() => {
    if (tradeAmt <= 0) return

    const fee = tradeCost * TRADING_FEE
    let effectivePrice = sel.price

    // Market order slippage
    if (tradeAmt > 10) {
      const slippage = Math.min(MARKET_SLIPPAGE * (tradeAmt / 50), 0.01)
      effectivePrice = tradeSide === 'buy' 
        ? sel.price * (1 + slippage) 
        : sel.price * (1 - slippage)
    }

    const effectiveCost = tradeAmt * effectivePrice
    const totalCostWithFee = effectiveCost + fee

    if (tradeSide === 'buy') {
      if (totalCostWithFee > balance) return
      setBalance(b => b - totalCostWithFee)
      setHoldings(p => ({ ...p, [sel.symbol]: (p[sel.symbol] ?? 0) + tradeAmt }))
    } else {
      if (owned < tradeAmt) return
      const received = effectiveCost - fee
      setBalance(b => b + received)
      setHoldings(p => ({ ...p, [sel.symbol]: Math.max(0, (p[sel.symbol] ?? 0) - tradeAmt) }))
    }

    setTrades(p => [{
      symbol: sel.symbol,
      amount: tradeAmt,
      price: effectivePrice,
      type: tradeSide,
      ts: Date.now(),
      fee: fee
    }, ...p].slice(0, 30))
  }, [tradeAmt, tradeSide, tradeCost, balance, owned, sel.symbol, sel.price])

  const placeOrder = useCallback(() => {
    if (orderAmt <= 0 || orderPrice <= 0) return
    const total = orderAmt * orderPrice
    if (orderType === 'limit_buy') {
      if (total > balance) return
      setBalance(b => b - total)
    } else {
      if ((holdings[sel.symbol] ?? 0) < orderAmt) return
      setHoldings(p => ({ ...p, [sel.symbol]: (p[sel.symbol] ?? 0) - orderAmt }))
    }
    setOrders(p => [{ id: `${Date.now()}`, symbol: sel.symbol, type: orderType, price: orderPrice, amount: orderAmt, total, status: 'open', createdAt: Date.now() }, ...p])
  }, [orderType, orderPrice, orderAmt, balance, holdings, sel.symbol])

  const cancelOrder = useCallback((id: string) => {
    const order = orders.find(o => o.id === id)
    if (!order || order.status !== 'open') return
    if (order.type === 'limit_buy') setBalance(b => b + order.total)
    else setHoldings(p => ({ ...p, [order.symbol]: (p[order.symbol] ?? 0) + order.amount }))
    setOrders(p => p.map(o => o.id === id ? { ...o, status: 'cancelled' } : o))
  }, [orders])

  const openFutures = useCallback((side: 'long' | 'short') => {
    const margin = fAmt * sel.price
    if (margin > balance) return
    const liqDist = 1 / lev * 0.9
    const liqPrice = side === 'long' ? sel.price * (1 - liqDist) : sel.price * (1 + liqDist)
    setBalance(b => b - margin)
    setFPos(p => [...p, { id: `${Date.now()}`, symbol: sel.symbol, side, entryPrice: sel.price, amount: fAmt, leverage: lev, margin, liqPrice, openTime: Date.now() }])
  }, [fAmt, sel, lev, balance])

  const closeFutures = useCallback((id: string) => {
    const pos = fPos.find(p => p.id === id)
    if (!pos) return
    const a = assets.find(x => x.symbol === pos.symbol)
    if (!a) return
    const pnl = pos.side === 'long' ? (a.price - pos.entryPrice) * pos.amount : (pos.entryPrice - a.price) * pos.amount
    setBalance(b => b + pos.margin + pnl * pos.leverage)
    setFPos(p => p.filter(x => x.id !== id))
  }, [fPos, assets])

  // Mining specific functions
  const buyMiner = useCallback((m: Miner) => {
    const cost = Math.floor(m.cost * minerDiscount)
    if (balance < cost) return
    let foundRackIdx = -1, foundSlotIdx = -1
    for (let ri = 0; ri < racks.length; ri++) {
      const si = racks[ri].slots.findIndex(s => s.minerId === null)
      if (si !== -1) { foundRackIdx = ri; foundSlotIdx = si; break }
    }
    if (foundRackIdx === -1) return
    setBalance(b => b - cost)
    setRacks(p => p.map((r, ri) => {
      if (ri !== foundRackIdx) return r
      return { ...r, slots: r.slots.map((s, si) => si === foundSlotIdx ? { ...s, minerId: m.id } : s) }
    }))
  }, [balance, racks, minerDiscount])

  const sellMiner = useCallback((rackId: string, slotId: string) => {
    const rack = racks.find(r => r.id === rackId)
    const slot = rack?.slots.find(s => s.id === slotId)
    if (!slot || !slot.minerId) return
    const miner = MINERS.find(m => m.id === slot.minerId)
    if (!miner) return
    const refund = Math.floor((miner.cost * minerDiscount) * 0.7)
    setBalance(b => b + refund)
    setRacks(p => p.map(r => r.id === rackId ? { ...r, slots: r.slots.map(s => s.id === slotId ? { ...s, minerId: null } : s) } : r))
  }, [racks, minerDiscount])

  const buyRack = useCallback(() => {
    const cost = Math.floor(250 * (racks.length + 1) * rackDiscount)
    if (balance < cost || racks.length >= 6) return
    setBalance(b => b - cost)
    const newRid = `rack-${Date.now()}`
    setRacks(p => [...p, {
      id: newRid,
      slots: [
        { id: `${newRid}-1`, minerId: null, durability: 100 }, 
        { id: `${newRid}-2`, minerId: null, durability: 100 }, 
        { id: `${newRid}-3`, minerId: null, durability: 100 }, 
        { id: `${newRid}-4`, minerId: null, durability: 100 }
      ]
    }])
  }, [racks, balance, rackDiscount])

  const sellRack = useCallback((rackId: string) => {
    const rack = racks.find(r => r.id === rackId)
    if (!rack || rack.slots.some(s => s.minerId !== null) || racks.length <= 1) return
    const refund = Math.floor(250 * racks.length * rackDiscount * 0.5)
    setBalance(b => b + refund)
    setRacks(p => p.filter(r => r.id !== rackId))
  }, [racks, rackDiscount])

  // Вывод BTC с фермы на баланс
  const withdrawMining = useCallback(() => {
    const coin = miningMode
    const amount = holdings[coin] ?? 0
    if (amount <= 0) return
    
    const price = assets.find(a => a.symbol === coin)?.price ?? 0
    const usdValue = amount * price
    
    // Обновляем balance и сразу сохраняем
    setBalance(prevBalance => {
      const newBalance = prevBalance + usdValue
      const newHoldings = { ...holdings, [coin]: 0 }
      
      const saveData = { 
        balance: newBalance, 
        holdings: newHoldings, 
        racks, 
        city, 
        nftInventory, 
        unlockedAchs, 
        exchange, 
        seasonLog: [], 
        timestamp: Date.now() 
      }
      localStorage.setItem('cryptominer_save', JSON.stringify(saveData))
      
      return newBalance
    })
    
    setHoldings(p => ({ ...p, [coin]: 0 }))
    
    setSeasonLog(prev => [`💰 Выведено $${fmt(usdValue)} (${fmtC(amount)} ${coin})`, ...prev].slice(0, 20))
  }, [holdings, miningMode, assets, racks, city, nftInventory, unlockedAchs, exchange])

  // Открытие лутбокса
  const openLootBox = useCallback((box: typeof LOOT_BOXES[0]) => {
    if (balance < box.price) return
    
    setBalance(b => b - box.price)
    
    const roll = Math.random()
    let selectedRarity: 'common' | 'rare' | 'epic' | 'legendary' = 'common'
    
    if (roll < box.odds.legendary) selectedRarity = 'legendary'
    else if (roll < box.odds.legendary + box.odds.epic) selectedRarity = 'epic'
    else if (roll < box.odds.legendary + box.odds.epic + box.odds.rare) selectedRarity = 'rare'
    
    // Находим майнеров нужной редкости
    const possibleMiners = MINERS.filter(m => m.rarity === selectedRarity)
    if (possibleMiners.length === 0) {
      // Fallback на common
      const commonMiners = MINERS.filter(m => m.rarity === 'common')
      const miner = commonMiners[Math.floor(Math.random() * commonMiners.length)]
      buyMiner(miner)
      setSeasonLog(prev => [`${box.icon} Открыт ${box.name} → ${miner.icon} ${miner.name}`, ...prev].slice(0, 20))
      return
    }
    
    const miner = possibleMiners[Math.floor(Math.random() * possibleMiners.length)]
    
    // Пытаемся установить
    let foundRackIdx = -1, foundSlotIdx = -1
    for (let ri = 0; ri < racks.length; ri++) {
      const si = racks[ri].slots.findIndex(s => s.minerId === null)
      if (si !== -1) { foundRackIdx = ri; foundSlotIdx = si; break }
    }
    
    if (foundRackIdx !== -1) {
      setRacks(p => p.map((r, ri) => {
        if (ri !== foundRackIdx) return r
        return { ...r, slots: r.slots.map((s, si) => si === foundSlotIdx ? { ...s, minerId: miner.id } : s) }
      }))
    }
    
    setSeasonLog(prev => [`${box.icon} Открыт ${box.name} → ${miner.icon} ${miner.name} (${miner.rarity})`, ...prev].slice(0, 20))
  }, [balance, racks, buyMiner])

  // Install NFT miner into a slot
  const installNft = useCallback((nftId: string, rackId: string, slotId: string) => {
    const rack = racks.find(r => r.id === rackId)
    const slot = rack?.slots.find(s => s.id === slotId)
    if (!slot || slot.minerId || slot.nftMinerId) return
    // Remove from inventory
    const idx = nftInventory.indexOf(nftId)
    if (idx === -1) return
    setNftInventory(p => { const a = [...p]; a.splice(idx, 1); return a })
    setRacks(p => p.map(r => r.id === rackId ? { ...r, slots: r.slots.map(s => s.id === slotId ? { ...s, nftMinerId: nftId } : s) } : r))
  }, [racks, nftInventory])

  const uninstallNft = useCallback((rackId: string, slotId: string) => {
    const rack = racks.find(r => r.id === rackId)
    const slot = rack?.slots.find(s => s.id === slotId)
    if (!slot || !slot.nftMinerId) return
    const nftId = slot.nftMinerId
    setNftInventory(p => [...p, nftId])
    setRacks(p => p.map(r => r.id === rackId ? { ...r, slots: r.slots.map(s => s.id === slotId ? { ...s, nftMinerId: undefined } : s) } : r))
  }, [racks])

  // Overclock майнера (рискованный буст)
  const overclockMiner = useCallback((rackId: string, slotId: string) => {
    const rack = racks.find(r => r.id === rackId)
    const slot = rack?.slots.find(s => s.id === slotId)
    if (!slot || !slot.minerId) return

    const cost = 150
    if (balance < cost) return

    setBalance(b => b - cost)

    // 65% шанс успеха, 35% шанс поломки
    if (Math.random() < 0.65) {
      const overclockEnd = Date.now() + 3 * 60 * 1000 // +30% мощности на 3 минуты
      setRacks(p => p.map(r => r.id === rackId ? {
        ...r,
        slots: r.slots.map(s => s.id === slotId ? { ...s, overclockEnd } : s)
      } : r))
      setSeasonLog(prev => [`⚡ Overclock успешен! +30% мощности на 3 минуты`, ...prev].slice(0, 20))
    } else {
      // Поломка
      setRacks(p => p.map(r => r.id === rackId ? {
        ...r,
        slots: r.slots.map(s => s.id === slotId ? { ...s, minerId: null } : s)
      } : r))
      setSeasonLog(prev => [`💥 Overclock провалился! Майнер сломан`, ...prev].slice(0, 20))
    }
  }, [balance, racks])

  // Починка сломанного рига
  const repairMiner = useCallback((rackId: string, slotId: string) => {
    const rack = racks.find(r => r.id === rackId)
    const slot = rack?.slots.find(s => s.id === slotId)
    if (!slot || slot.minerId) return

    const cost = 80
    if (balance < cost) return

    setBalance(b => b - cost)

    const cheapMiners = MINERS.filter(m => m.cost < 500)
    const miner = cheapMiners[Math.floor(Math.random() * cheapMiners.length)]

    setRacks(p => p.map(r => r.id === rackId ? {
      ...r,
      slots: r.slots.map(s => s.id === slotId ? { ...s, minerId: miner.id, durability: 100 } : s)
    } : r))

    setSeasonLog(prev => [`🔧 Починили риг! Получили ${miner.name}`, ...prev].slice(0, 20))
  }, [balance, racks])

  // NFT Market functions
  const listNftForSale = useCallback((nftId: string, price: number) => {
    if (!nftInventory.includes(nftId) || price <= 0) return
    
    setNftMarket(prev => [...prev, {
      id: `market-${Date.now()}`,
      nftId,
      seller: 'You',
      price
    }])
    setNftInventory(prev => {
      const next = [...prev]
      const idx = next.indexOf(nftId)
      if (idx !== -1) next.splice(idx, 1)
      return next
    })
    setSeasonLog(prev => [`🏷️ Выставлен на продажу: ${NFT_MINERS.find(n => n.id === nftId)?.name} за $${price}`, ...prev].slice(0, 15))
  }, [nftInventory])

  const buyNftFromMarket = useCallback((marketId: string) => {
    const listing = nftMarket.find(l => l.id === marketId)
    if (!listing || balance < listing.price) return
    
    setBalance(b => b - listing.price)
    setNftInventory(prev => [...prev, listing.nftId])
    setNftMarket(prev => prev.filter(l => l.id !== marketId))
    setSeasonLog(prev => [`🎉 Куплен NFT: ${NFT_MINERS.find(n => n.id === listing.nftId)?.name}`, ...prev].slice(0, 15))
  }, [nftMarket, balance])

  // City Functions
  const upgradeBuilding = useCallback((bId: string, cost: number) => {
    if (balance < cost) return
    setBalance(b => b - cost)
    setCity(p => ({ ...p, [bId]: (p[bId] || 0) + 1 }))
  }, [balance])

  const openExchange = useCallback(() => {
    if (portVal < 10000 || exchange) return
    setBalance(b => b - 5000)
    setExchange({ name: exchangeName || 'My Crypto Exchange', listedTokens: ['BTC', 'ETH', 'SOL'], tradingFee: 0.1, totalVolume: 0, totalFees: 0, level: 1 })
    setShowExchangeModal(false); setExchangeName('')
  }, [portVal, exchange, exchangeName])

  const listToken = useCallback((symbol: string) => {
    if (!exchange || exchange.listedTokens.includes(symbol) || balance < 500) return
    setBalance(b => b - 500)
    setExchange(e => e ? { ...e, listedTokens: [...e.listedTokens, symbol] } : null)
  }, [exchange, balance])

  const levPresets = [1, 3, 5, 10, 25, 50, 75, 100, 125]
  const openOrders = orders.filter(o => o.status === 'open')
  const filledOrders = orders.filter(o => o.status === 'filled')

  return (
    <div className="app">
      <Suspense fallback={null}>
        <AmbientBg3D />
      </Suspense>
      {/* HEADER */}
      <header className="hdr">
        <div className="hdr-logo"><span className="hdr-icon">₿</span><h1>CryptoMiner</h1></div>
        <div className="hdr-stats">
          <div className="hdr-stat"><span className="hdr-lbl">Баланс</span><span className="hdr-val">${fmt(balance)}</span></div>
          <div className="hdr-stat"><span className="hdr-lbl">Портфель</span><span className="hdr-val">${fmt(portVal)}</span></div>
          <div className="hdr-stat hide-mobile"><span className="hdr-lbl">Синхронизация</span><span className="hdr-val">{lastSync}</span></div>
        </div>
      </header>

      {/* SEASON BANNER */}
      {season && (
        <div className={`season-banner season-${season.event.type}`}>
          <span className="season-icon">{season.event.icon}</span>
          <div className="season-info">
            <b>{season.event.name}</b>
            <span>{season.event.desc}</span>
          </div>
          <div className="season-timers">
            <span>Mining: {season.event.miningMultiplier > 1 ? '↑' : '↓'}{((season.event.miningMultiplier - 1) * 100).toFixed(0)}%</span>
            <span>Prices: {season.event.priceMultiplier > 1 ? '↑' : '↓'}{((season.event.priceMultiplier - 1) * 100).toFixed(0)}%</span>
            <span className="season-timer">{Math.max(0, Math.ceil((season.endsAt - Date.now()) / 1000))}s left</span>
          </div>
        </div>
      )}
      
      {/* MAIN */}
      <div className="app-body">
        <nav className="nav">
          {([['city', '🏙️ Город'], ['mining', '🕹️ Майнинг'], ['wallet', '👛 Кошелёк'], ['trade', '📈 Спот'], ['futures', '⚡ Фьючерсы'], ['exchange', '🏢 Биржа'], ['news', '📰 Новости']] as [Tab, string][]).map(([id, lbl]) => (
            <button key={id} className={`nav-btn ${tab === id ? 'active' : ''}`} onClick={() => setTab(id)}>
              <span className="nav-icon">{lbl.split(' ')[0]}</span>
              <span className="nav-lbl-text">{lbl.split(' ')[1]}</span>
            </button>
          ))}
        </nav>

        <main className="main-content">
          <div className="src-bar">
            <span className={`src-badge ${srcState.coingecko ? 'ok' : 'warn'}`}>CoinGecko {srcState.coingecko ? '●' : '○'}</span>
            <span className={`src-badge ${srcState.binance ? 'ok' : 'warn'}`}>Binance {srcState.binance ? '●' : '○'}</span>
          </div>

          {/* CITY */}
          {tab === 'city' && (
            <div className="city-view">
              <div className="city-header">
                <h2>🏙️ Биткоин-Город (3D)</h2>
                <p>Вы начинаете с <b>$500</b>. Строите инфраструктуру, собираете NFT-майнеры и переживаете рыночные циклы.</p>
                <p style={{ opacity: 0.7, fontSize: 12 }}>Кликните по площадке в 3D-городе или по карточке здания ниже, чтобы построить или улучшить. Зажмите ЛКМ / тач — поверните камеру, колесо / щипок — зум.</p>
              </div>

              <Suspense fallback={<div style={{ height: 360, display: 'grid', placeItems: 'center', color: '#7a8cd0' }}>Loading 3D city…</div>}>
                <CityScene
                  city={city}
                  balance={balance}
                  onUpgrade={upgradeBuilding}
                  exchangeOpen={!!exchange}
                />
              </Suspense>

              {/* NFT INVENTORY */}
              <div className="nft-section">
                <h3>🎨 NFT Miner Inventory ({nftInventory.length})</h3>
                {nftInventory.length > 0 ? (
                  <div className="nft-grid">
                    {nftInventory.map((nid, i) => {
                      const nft = NFT_MINERS.find(n => n.id === nid)
                      if (!nft) return null
                      return (
                        <div key={`${nid}-${i}`} className={`nft-card nft-${nft.rarity}`} style={{ '--nft-glow': nft.color } as React.CSSProperties}>
                          <div className="nft-icon">{nft.icon}</div>
                          <h4>{nft.name}</h4>
                          <span className={`nft-rarity ${nft.rarity}`}>{nft.rarity}</span>
                          <p className="nft-power">⚡ {nft.power} power</p>
                          <p className="nft-perk">{nft.perkDesc}</p>
                          <button className="nft-install" onClick={() => {
                            const emptySlot = racks.flatMap(r => r.slots.map(s => ({ rackId: r.id, slot: s }))).find(x => !x.slot.minerId && !x.slot.nftMinerId)
                            if (emptySlot) installNft(nid, emptySlot.rackId, emptySlot.slot.id)
                          }}>Install in Farm</button>
                        </div>
                      )
                    })}
                  </div>
                ) : (
                  <p className="empty">No NFT miners yet. Keep mining — they drop randomly! Higher power = better drop rate.</p>
                )}
              </div>

              {/* ACHIEVEMENTS */}
              <div className="ach-section">
                <h3>🏆 Achievements ({unlockedAchs.length}/{ACHIEVEMENTS.length})</h3>
                <div className="ach-grid">
                  {ACHIEVEMENTS.map(a => {
                    const unlocked = unlockedAchs.includes(a.id)
                    return (
                      <div key={a.id} className={`ach-card ${unlocked ? 'unlocked' : 'locked'}`}>
                        <span className="ach-icon">{a.icon}</span>
                        <div>
                          <h4>{a.name}</h4>
                          <p>{a.desc}</p>
                        </div>
                        {unlocked && <span className="ach-check">✓</span>}
                      </div>
                    )
                  })}
                </div>
              </div>

              {/* EVENT LOG */}
              <div className="event-log">
                <h3>📜 Event Log</h3>
                <div className="event-log-list">
                  {seasonLog.length > 0 ? seasonLog.map((msg, i) => <div key={i} className="event-log-item">{msg}</div>) : <p className="empty">No events yet. Play to see events here.</p>}
                </div>
              </div>

              {/* NFT MARKET */}
              <div className="nft-market-section">
                <h3>🛒 NFT Market (Аукцион)</h3>
                {nftMarket.length > 0 ? (
                  <div className="nft-market-grid">
                    {nftMarket.map(listing => {
                      const nft = NFT_MINERS.find(n => n.id === listing.nftId)
                      if (!nft) return null
                      return (
                        <div key={listing.id} className="nft-market-card">
                          <div className="nft-icon">{nft.icon}</div>
                          <h4>{nft.name}</h4>
                          <span className={`nft-rarity ${nft.rarity}`}>{nft.rarity}</span>
                          <p className="nft-power">⚡ {nft.power} power</p>
                          <p className="nft-price">Цена: ${listing.price}</p>
                          <button 
                            className="nft-buy-btn" 
                            onClick={() => buyNftFromMarket(listing.id)}
                            disabled={balance < listing.price}
                          >
                            Купить
                          </button>
                        </div>
                      )
                    })}
                  </div>
                ) : (
                  <p className="empty">На рынке пока нет NFT-майнеров</p>
                )}
                
                <div className="nft-sell-section">
                  <h4>Выставить NFT на продажу</h4>
                  <div className="nft-inventory-list">
                    {nftInventory.map((nftId, idx) => {
                      const nft = NFT_MINERS.find(n => n.id === nftId)
                      if (!nft) return null
                      const draftKey = `${nftId}-${idx}`
                      const draft = nftSellDraft[draftKey] ?? ''
                      const price = parseInt(draft) || 0
                      const submit = () => {
                        if (price <= 0) return
                        listNftForSale(nftId, price)
                        setNftSellDraft(prev => {
                          const next = { ...prev }
                          delete next[draftKey]
                          return next
                        })
                      }
                      return (
                        <div key={draftKey} className="nft-sell-item">
                          <span>{nft.icon} {nft.name}</span>
                          <input
                            type="number"
                            placeholder="Цена"
                            value={draft}
                            onChange={(e) =>
                              setNftSellDraft(prev => ({ ...prev, [draftKey]: e.target.value }))
                            }
                            onKeyDown={(e) => {
                              if (e.key === 'Enter') submit()
                            }}
                          />
                          <button
                            className="nft-sell-submit"
                            disabled={price <= 0}
                            onClick={submit}
                          >
                            Выставить
                          </button>
                        </div>
                      )
                    })}
                  </div>
                </div>
              </div>

              {/* BUILDINGS */}
              <h3 className="city-section-title">🏗️ City Buildings</h3>
              <div className="city-grid">
                {BUILDINGS.map(b => {
                  const lvl = city[b.id] || 0
                  const cost = Math.floor(b.baseCost * Math.pow(1.5, lvl))
                  return (
                    <div key={b.id} className="city-card" style={{ '--glow': b.color } as React.CSSProperties}>
                      <div className="city-card-head">
                        <div className="city-card-icon" style={{ color: b.color }}>{b.icon}</div>
                        <div className="city-card-lvl">LVL {lvl}</div>
                      </div>
                      <h3>{b.name}</h3>
                      <p className="city-desc">{b.desc}</p>
                      <div className="city-effect">Effect: <b>{b.effectStr} per level</b><br/>Current: <span>{lvl > 0 ? `Active (Lv.${lvl})` : 'None'}</span></div>
                      <button className="city-upgrade" disabled={balance < cost} onClick={() => upgradeBuilding(b.id, cost)}>
                        {balance >= cost ? `Upgrade $${fmt(cost, 0)}` : `Need $${fmt(cost, 0)}`}
                      </button>
                    </div>
                  )
                })}
              </div>
            </div>
          )}

          {/* WALLET */}
          {tab === 'wallet' && (
            <div className="wallet-view">
              <div className="wallet-top">
                <div className="wallet-stat"><span className="wallet-stat-label">Spot Value</span><strong>${fmt(walletRows.reduce((s, r) => s + r.value, 0))}</strong></div>
                <div className="wallet-stat"><span className="wallet-stat-label">Reserved (Buy Orders)</span><strong>${fmt(reservedUsd)}</strong></div>
                <div className="wallet-stat"><span className="wallet-stat-label">Assets Held</span><strong>{walletRows.length}</strong></div>
              </div>
              <div className="wallet-table">
                <div className="wallet-head"><span>Coin</span><span>Total</span><span>Available</span><span className="hide-mobile">Reserved</span><span>Value</span></div>
                {walletRows.map(r => (
                  <button key={r.symbol} className="wallet-row" onClick={() => { setSym(r.symbol); setTab('trade') }}>
                    <span className="wallet-coin"><i className="wallet-coin-icon" style={{ background: r.color }}>{r.symbol[0]}</i><span><b>{r.symbol}</b><small className="hide-mobile">{r.name}</small></span></span>
                    <span>{fmtC(r.amount)}</span><span className="wallet-available">{fmtC(r.available)}</span><span className="wallet-reserved hide-mobile">{fmtC(r.reserved)}</span><span>${fmt(r.value, r.value < 1 ? 4 : 2)}</span>
                  </button>
                ))}
                {!walletRows.length && <p className="empty">No coins in wallet yet.</p>}
              </div>
              <div className="wallet-boxes">
                <div className="wallet-box">
                  <h3>Open Sell Reservations</h3>
                  {orders.filter(o => o.status === 'open' && o.type === 'limit_sell').slice(0, 8).map(o => (
                    <div key={o.id} className="wallet-order-row"><span>{o.symbol}</span><span>{fmtC(o.amount)}</span><span>@ ${fmt(o.price, o.price < 1 ? 6 : 2)}</span></div>
                  ))}
                  {!orders.some(o => o.status === 'open' && o.type === 'limit_sell') && <p className="empty mini-empty">No reserved sell orders</p>}
                </div>
              </div>
            </div>
          )}

          {/* MINING */}
          {tab === 'mining' && (
            <div className="mining-view mining-roller">
              <Suspense fallback={<div style={{ height: 280, display: 'grid', placeItems: 'center', color: '#7a8cd0' }}>Loading 3D mining room…</div>}>
                <MiningRoom3D
                  racks={racks}
                  miners={MINERS}
                  miningMode={miningMode}
                  totalPow={totalPow}
                />
              </Suspense>
              <div className="min-stats min-stats-roller">
                <div className="min-card"><h3>Базовая мощность</h3><p>{basePow.toFixed(1)}</p></div>
                <div className="min-card"><h3>Эффективная мощность</h3><p className="up">{totalPow.toFixed(1)} <small>(x{(hashMultiplier * nftPowerBonus * seasonMiningMul * modeMultiplier).toFixed(2)})</small></p></div>
                <div className="min-card"><h3>Доход в день</h3><p>${fmt(miningIncomeDayUsd)}</p></div>
                {seasonPriceMul !== 1 && <div className="min-card"><h3>Цены сезона</h3><p className={seasonPriceMul > 1 ? 'up' : 'dn'}>x{seasonPriceMul.toFixed(2)}</p></div>}
              </div>

              {/* Переключатель режима майнинга */}
              <div className="mining-mode-selector">
                <h3>Режим майнинга</h3>
                <div className="mode-buttons">
                  <button 
                    className={`mode-btn ${miningMode === 'BTC' ? 'active' : ''}`} 
                    onClick={() => setMiningMode('BTC')}
                  >
                    ₿ BTC
                  </button>
                  <button 
                    className={`mode-btn ${miningMode === 'ETH' ? 'active' : ''}`} 
                    onClick={() => setMiningMode('ETH')}
                  >
                    Ξ ETH
                  </button>
                  <button 
                    className={`mode-btn ${miningMode === 'SOL' ? 'active' : ''}`} 
                    onClick={() => setMiningMode('SOL')}
                  >
                    ◎ SOL
                  </button>
                </div>
                <p className="mode-hint">
                  {miningMode === 'BTC' && 'ASIC-майнеры дают +50% бонус'}
                  {miningMode === 'ETH' && 'GPU-майнеры дают +40% бонус'}
                  {miningMode === 'SOL' && 'Универсальные майнеры эффективнее'}
                </p>
              </div>

              <div className="roller-layout-full">
                <div className="racks-area">
                  {racks.map(rack => {
                    const installed = rack.slots.filter(s => s.minerId !== null).length
                    const isEmpty = installed === 0
                    return (
                      <div key={rack.id} className={`rack-unit ${isEmpty && racks.length > 1 ? 'rack-empty' : ''}`}>
                        <div className="rack-header">
                          <h4>Шкаф</h4><span>{installed}/4 ригов</span>
                          {isEmpty && racks.length > 1 && (
                            <button className="rack-sell-btn" onClick={() => sellRack(rack.id)} title="Продать шкаф">Продать 50% (-${Math.floor(250 * racks.length * rackDiscount * 0.5)})</button>
                          )}
                        </div>
                        <div className="rack-body">
                          {rack.slots.map(slot => {
                            const miner = MINERS.find(m => m.id === slot.minerId) ?? null
                            const nftMiner = NFT_MINERS.find(n => n.id === slot.nftMinerId) ?? null
                            const device = nftMiner ?? miner
                            const isNft = !!nftMiner
                            return (
                              <div key={slot.id} className={`roller-slot ${device ? 'filled' : 'empty'} ${isNft ? `nft-slot nft-${nftMiner!.rarity}` : ''}`}>
                                <div className="roller-slot-floor" /><div className="roller-slot-bg" />
                                {device ? (
                                  <div className="roller-rig">
                                    <div className="roller-rig-top">
                                      <span className="roller-rig-icon">{device.icon}</span>
                                      <div className="roller-rig-fans"><div className="fan spinning"></div><div className="fan spinning"></div></div>
                                    </div>
                                    <span className="roller-rig-name">{device.name}{isNft && <small className={`nft-badge nft-${nftMiner!.rarity}`}> {nftMiner!.rarity}</small>}</span>
                                    <div className="roller-rig-bars">
                                      <span className="roller-bar power"><i style={{ width: `${Math.min(100, device.power * 2)}%` }} /></span>
                                      <span className="roller-bar temp"><i style={{ width: `${45 + (slot.id.charCodeAt(slot.id.length - 1) % 5) * 8}%` }} /></span>
                                      <span className="roller-bar durability"><i style={{ width: `${slot.durability ?? 100}%` }} /></span>
                                    </div>
                                     {isNft ? (
                                       <button className="roller-sell-rig nft-uninstall" onClick={() => uninstallNft(rack.id, slot.id)}>Uninstall NFT</button>
                                     ) : miner ? (
                                       <>
                                         <button className="roller-sell-rig" onClick={() => sellMiner(rack.id, slot.id)}>Sell (+${Math.floor(miner.cost * minerDiscount * 0.7)})</button>
                                         <button className="roller-overclock" onClick={() => overclockMiner(rack.id, slot.id)}>⚡ Overclock</button>
                                       </>
                                     ) : null}
                                    <div className="roller-rig-leds"><i className={`led ${isNft ? 'nft-led' : 'blink'}`}/><i className="led blink-fast"/><i className="led solid"/></div>
                                  </div>
                                ) : (
                                  <div className="roller-empty-content">
                                    <div className="roller-empty-label">Empty Slot</div>
                                    <button
                                      className="roller-repair"
                                      disabled={balance < 80}
                                      onClick={() => repairMiner(rack.id, slot.id)}
                                    >
                                      🔧 Repair ($80)
                                    </button>
                                  </div>
                                )}
                              </div>
                            )
                          })}
                        </div>
                      </div>
                    )
                  })}
                </div>

                <div className="roller-sidebar">
                  <div className="roller-panel">
                    <h3>Магазин оборудования</h3>
                    {minerDiscount < 1 && <p className="rack-panel-info up">Скидка города: -{((1 - minerDiscount) * 100).toFixed(0)}%</p>}
                    <div className="roller-shop-list">
                      {MINERS.map(m => {
                        const hasEmpty = racks.some(r => r.slots.some(s => s.minerId === null))
                        const cost = Math.floor(m.cost * minerDiscount)
                        return (
                    <div key={m.id} className={`roller-shop-item ${m.rarity}`}>
                      <div className="roller-shop-main"><span className="roller-shop-icon">{m.icon}</span><div><b>{m.name}</b><small>+{m.power} power</small></div></div>
                      <div className="roller-shop-side">
                        <span className="roller-shop-cost">${cost}</span>
                        <button className="eq-buy roller-buy" disabled={balance < cost || !hasEmpty} onClick={() => buyMiner(m)}>
                          {!hasEmpty ? 'Нет мест' : balance >= cost ? 'Купить' : 'Недостаточно'}
                        </button>
                      </div>
                    </div>
                        )
                      })}
                    </div>
                  </div>

                  {/* ЛУТБОКСЫ */}
                  <div className="roller-panel">
                    <h3>Лутбоксы</h3>
                    <div className="roller-shop-list">
                      {LOOT_BOXES.map(box => (
                        <div key={box.id} className="roller-shop-item lootbox-item" style={{ '--box-color': box.color } as React.CSSProperties}>
                          <div className="roller-shop-main">
                            <span className="roller-shop-icon">{box.icon}</span>
                            <div>
                              <b>{box.name}</b>
                              <small>{box.description}</small>
                            </div>
                          </div>
                          <div className="roller-shop-side">
                            <span className="roller-shop-cost">${box.price}</span>
                            <button 
                              className="eq-buy roller-buy lootbox-btn" 
                              disabled={balance < box.price}
                              onClick={() => openLootBox(box)}
                            >
                              Открыть
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* ПРОДАЖА МАЙНЕРОВ */}
                  <div className="roller-panel">
                    <h3>Мои риги (продажа)</h3>
                    {racks.some(r => r.slots.some(s => s.minerId)) ? (
                      <div className="roller-sell-list">
                        {racks.map(rack => 
                          rack.slots.filter(s => s.minerId).map(slot => {
                            const miner = MINERS.find(m => m.id === slot.minerId)
                            if (!miner) return null
                            const refund = Math.floor(miner.cost * minerDiscount * 0.7)
                            return (
                              <div key={slot.id} className="roller-sell-item">
                                <span>{miner.icon} {miner.name}</span>
                                <button className="roller-sell-btn" onClick={() => sellMiner(rack.id, slot.id)}>
                                  Продать (+${refund})
                                </button>
                              </div>
                            )
                          })
                        )}
                      </div>
                    ) : (
                      <p className="empty mini-empty">У вас пока нет установленных майнеров</p>
                    )}
                  </div>

                  <div className="roller-panel">
                    <h3>Шкафы ({racks.length}/6)</h3>
                    {rackDiscount < 1 && <p className="rack-panel-info up">Скидка города: -{((1 - rackDiscount) * 100).toFixed(0)}%</p>}
                    <button className="rack-buy-btn" disabled={balance < Math.floor(250 * (racks.length + 1) * rackDiscount) || racks.length >= 6} onClick={buyRack}>
                      {racks.length >= 6 ? 'МАКСИМУМ ШКАФОВ' : `Купить шкаф ($${Math.floor(250 * (racks.length + 1) * rackDiscount)})`}
                    </button>
                    {racks.length <= 1 && <p className="rack-note">Нельзя продать последний шкаф.</p>}
                  </div>

                  {/* УПРАВЛЕНИЕ И СОХРАНЕНИЕ */}
                  <div className="roller-panel">
                    <h3>Управление</h3>
                    
                    <div className="mining-withdraw">
                      <div className="withdraw-info">
                        <span>Накоплено {miningMode}</span>
                        <strong>{fmtC(holdings[miningMode] ?? 0)}</strong>
                      </div>
                      <button 
                        className="withdraw-btn" 
                        disabled={!holdings[miningMode] || holdings[miningMode] <= 0}
                        onClick={withdrawMining}
                      >
                        💰 Вывести на баланс
                      </button>
                    </div>

                    <div className="save-controls">
                      <button className="save-btn" onClick={saveGame}>
                        💾 Сохранить игру
                      </button>
                      <button 
                        className="reset-btn" 
                        onClick={() => {
                          if (confirm('Сбросить весь прогресс?')) {
                            localStorage.removeItem('cryptominer_save')
                            window.location.reload()
                          }
                        }}
                      >
                        🔄 Сбросить
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* SPOT TRADE */}
          {tab === 'trade' && (
            <div className="trade-view">
              <div className="trade-left hide-mobile"><OrderBook bids={ob.bids} asks={ob.asks} mid={sel.price} /></div>
              <div className="trade-right">
                <div className="trade-sel">
                  {assets.map(a => (
                    <button key={a.symbol} className={`ts-btn ${sym === a.symbol ? 'active' : ''}`} onClick={() => setSym(a.symbol)}>
                      <b>{a.symbol}</b><span>${fmt(a.price, a.price < 1 ? 4 : 2)}</span>
                    </button>
                  ))}
                </div>
                <div className="trade-form">
                  <div className="tf-price">
                    <h3>{sel.name}</h3><p className="tf-big">${fmt(sel.price, sel.price < 1 ? 6 : 2)}</p>
                    <p className={sel.change24h >= 0 ? 'up' : 'dn'}>{sel.change24h >= 0 ? '↑' : '↓'} {Math.abs(sel.change24h).toFixed(2)}%</p>
                  </div>
                  <div className="tf-sides">
                    <button className={`tf-side buy ${tradeSide === 'buy' ? 'active' : ''}`} onClick={() => setTradeSide('buy')}>Buy</button>
                    <button className={`tf-side sell ${tradeSide === 'sell' ? 'active' : ''}`} onClick={() => setTradeSide('sell')}>Sell</button>
                  </div>
                  <label className="tf-label">Amount ({sel.symbol})</label>
                  <input className="tf-input" type="number" value={tradeAmt} onChange={e => setTradeAmt(Math.max(0, +e.target.value || 0))} step="0.0001" min="0" />
                  <div className="tf-summary">
                    <p>Стоимость: <b>${fmt(tradeCost)}</b></p>
                    <p>Комиссия (0.1%): <b>${fmt(tradeCost * TRADING_FEE)}</b></p>
                    {tradeAmt > 10 && <p className="slippage-warning">⚠️ Slippage: ~{((tradeAmt / 50) * 0.2).toFixed(2)}%</p>}
                    <p>Баланс: <b>${fmt(balance)}</b></p>
                    <p>В кошельке: <b>{fmtC(owned)} {sel.symbol}</b></p>
                  </div>
                  <button className="tf-exec" onClick={execTrade}>{tradeSide === 'buy' ? 'BUY' : 'SELL'} {sel.symbol}</button>
                </div>
                <div className="limit-orders">
                  <h4>📋 Limit Orders</h4>
                  <div className="lo-form">
                    <div className="lo-type">
                      <button className={`lo-btn ${orderType === 'limit_buy' ? 'active' : ''}`} onClick={() => setOrderType('limit_buy')}>Buy Limit</button>
                      <button className={`lo-btn ${orderType === 'limit_sell' ? 'active' : ''}`} onClick={() => setOrderType('limit_sell')}>Sell Limit</button>
                    </div>
                    <label className="tf-label">Price (USDT)</label>
                    <input className="tf-input" type="number" value={orderPrice} onChange={e => setOrderPrice(Math.max(0, +e.target.value || 0))} step="0.01" min="0" placeholder={sel.price.toFixed(2)} />
                    <label className="tf-label">Amount ({sel.symbol})</label>
                    <input className="tf-input" type="number" value={orderAmt} onChange={e => setOrderAmt(Math.max(0, +e.target.value || 0))} step="0.0001" min="0" />
                    <div className="tf-summary"><p>Total: <b>${fmt(orderAmt * orderPrice)}</b></p><p>Available: <b>${fmt(balance)}</b> | <b>{fmtC(owned)} {sel.symbol}</b></p></div>
                    <button className="tf-exec" onClick={placeOrder}>Place {orderType === 'limit_buy' ? 'Buy' : 'Sell'} Order</button>
                  </div>
                  <div className="lo-list">
                    <h5>Open Orders ({openOrders.length})</h5>
                    {openOrders.map(o => (
                      <div key={o.id} className={`lo-item ${o.type}`}>
                        <div className="lo-info"><span className="lo-type-label">{o.type === 'limit_buy' ? '🟢 Buy' : '🔴 Sell'}</span><span className="lo-sym">{o.symbol}</span><span className="lo-amt">{fmtC(o.amount)}</span><span className="lo-price">@ ${fmt(o.price, o.price < 1 ? 6 : 2)}</span></div>
                        <button className="lo-cancel" onClick={() => cancelOrder(o.id)}>Cancel</button>
                      </div>
                    ))}
                    {!openOrders.length && <p className="empty">No open orders</p>}
                    <h5>Filled Orders ({filledOrders.length})</h5>
                    {filledOrders.slice(0, 10).map(o => (
                      <div key={o.id} className={`lo-item filled ${o.type}`}><span className="lo-type-label">{o.type === 'limit_buy' ? '🟢 Buy' : '🔴 Sell'}</span><span className="lo-sym">{o.symbol}</span><span className="lo-amt">{fmtC(o.amount)}</span><span className="lo-price">@ ${fmt(o.price, o.price < 1 ? 6 : 2)}</span><span className="lo-filled">✓ Filled</span></div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* FUTURES */}
          {tab === 'futures' && (
            <div className="futures-view">
              <TVChart candles={selCandles} symbol={sel.symbol} />
              <div className="fut-controls">
                <div className="fut-sel">
                  {assets.map(a => (
                    <button key={a.symbol} className={`ts-btn ${sym === a.symbol ? 'active' : ''}`} onClick={() => setSym(a.symbol)}><b>{a.symbol}</b><span>${fmt(a.price, a.price < 1 ? 4 : 2)}</span></button>
                  ))}
                </div>
                <div className="fut-lev">
                  <h4>Leverage: <span className="fut-lev-val">{lev}x</span></h4>
                  <input type="range" min={1} max={125} value={lev} onChange={e => setLev(+e.target.value)} className="fut-slider" />
                  <div className="fut-presets">
                    {levPresets.map(l => (
                      <button key={l} className={`fut-pre ${lev === l ? 'active' : ''}`} onClick={() => setLev(l)}>{l}x</button>
                    ))}
                  </div>
                </div>
                <div className="fut-entry">
                  <label className="tf-label">Amount ({sel.symbol})</label>
                  <input className="tf-input" type="number" value={fAmt} onChange={e => setFAmt(Math.max(0, +e.target.value || 0))} step="0.0001" min="0" />
                  <div className="fut-info">
                    <p>Margin: <b>${fmt(fAmt * sel.price)}</b></p>
                    <p>Liq. (Long): <b className="dn">${fmt(sel.price * (1 - 0.9 / lev), sel.price < 1 ? 6 : 2)}</b></p>
                    <p>Liq. (Short): <b className="up">${fmt(sel.price * (1 + 0.9 / lev), sel.price < 1 ? 6 : 2)}</b></p>
                  </div>
                  <div className="fut-btns">
                    <button className="fut-long" onClick={() => openFutures('long')}>📈 Long {lev}x</button>
                    <button className="fut-short" onClick={() => openFutures('short')}>📉 Short {lev}x</button>
                  </div>
                </div>
              </div>
              <div className="fut-positions">
                <h4>Open Positions ({fPos.length})</h4>
                {fPos.map(pos => {
                  const a = assets.find(x => x.symbol === pos.symbol)
                  const curPrice = a?.price ?? pos.entryPrice
                  const rawPnl = pos.side === 'long' ? (curPrice - pos.entryPrice) * pos.amount : (pos.entryPrice - curPrice) * pos.amount
                  const pnl = rawPnl * pos.leverage
                  const pnlPct = (pnl / pos.margin) * 100
                  return (
                    <div key={pos.id} className={`fut-pos ${pos.side}`}>
                      <div className="fut-pos-head"><span className="fut-pos-sym">{pos.symbol}/USDT</span><span className={`fut-pos-side ${pos.side}`}>{pos.side.toUpperCase()} {pos.leverage}x</span></div>
                      <div className="fut-pos-body">
                        <div><span className="fut-pos-lbl">Entry</span><span>${fmt(pos.entryPrice, pos.entryPrice < 1 ? 6 : 2)}</span></div>
                        <div><span className="fut-pos-lbl">Mark</span><span>${fmt(curPrice, curPrice < 1 ? 6 : 2)}</span></div>
                        <div><span className="fut-pos-lbl">Liq.</span><span className="dn">${fmt(pos.liqPrice, pos.liqPrice < 1 ? 6 : 2)}</span></div>
                        <div><span className="fut-pos-lbl">Margin</span><span>${fmt(pos.margin)}</span></div>
                        <div><span className="fut-pos-lbl">PnL</span><span className={pnl >= 0 ? 'up' : 'dn'}>{pnl >= 0 ? '+' : ''}${fmt(pnl)} ({pct(pnlPct)})</span></div>
                      </div>
                      <button className="fut-close" onClick={() => closeFutures(pos.id)}>Close Position</button>
                    </div>
                  )
                })}
                {!fPos.length && <p className="empty">No open positions</p>}
              </div>
            </div>
          )}

          {/* NEWS */}
          {tab === 'news' && (
            <div className="news-view">
              <h2>📰 Crypto News Feed</h2>
              <p className="news-sub">Live market-moving news affecting crypto prices</p>
              <div className="news-list">
                {news.map(n => (
                  <div key={n.id} className={`news-card ${n.impact}`}>
                    <div className="news-head">
                      <span className={`news-sent ${n.sentiment}`}>{n.sentiment === 'bullish' ? '🟢' : n.sentiment === 'bearish' ? '🔴' : '⚪'} {n.sentiment}</span>
                      <span className={`news-impact ${n.impact}`}>{n.impact}</span>
                      <span className="news-cat">{n.category}</span>
                    </div>
                    <h4 className="news-title">{n.title}</h4>
                    <div className="news-meta"><span className="news-src">{n.source}</span><span className="news-time">{new Date(n.time).toLocaleTimeString('ru-RU')}</span><span className="news-sym">{n.symbol}</span></div>
                  </div>
                ))}
              </div>
            </div>
          )}



          {/* EXCHANGE */}
          {tab === 'exchange' && (
            <div className="exchange-view">
              {!exchange ? (
                <div className="ex-locked">
                  <div className="ex-lock-icon">🔒</div>
                  <h2>Open Your Own Exchange</h2>
                  <p>Reach <b>$10,000</b> portfolio value to unlock</p>
                  <div className="ex-progress"><div className="ex-progress-bar" style={{ width: `${Math.min(100, (portVal / 10000) * 100)}%` }} /></div>
                  <p className="ex-progress-text">${fmt(portVal)} / $10,000 ({((portVal / 10000) * 100).toFixed(1)}%)</p>
                  {canOpenExchange && <button className="ex-open-btn" onClick={() => setShowExchangeModal(true)}>🏢 Open Exchange ($5,000)</button>}
                </div>
              ) : (
                <div className="ex-active">
                  <div className="ex-header"><h2>🏢 {exchange.name}</h2><span className="ex-level">Level {exchange.level}</span></div>
                  <div className="ex-stats">
                    <div className="ex-stat"><h3>Listed Tokens</h3><p>{exchange.listedTokens.length}</p></div>
                    <div className="ex-stat"><h3>Trading Fee</h3><p>{exchange.tradingFee}%</p></div>
                    <div className="ex-stat"><h3>Total Volume</h3><p>${fmtK(exchange.totalVolume)}</p></div>
                    <div className="ex-stat"><h3>Fees Earned</h3><p>${fmt(exchange.totalFees)}</p></div>
                  </div>
                  <div className="ex-listed">
                    <h3>Listed Tokens</h3>
                    <div className="ex-tokens">
                      {exchange.listedTokens.map(sym => {
                        const a = assets.find(x => x.symbol === sym)
                        return a ? <div key={sym} className="ex-token"><span className="ex-token-ico" style={{ background: a.color }}>{sym[0]}</span><span>{sym}</span><span className="ex-token-price">${fmt(a.price, a.price < 1 ? 4 : 2)}</span></div> : null
                      })}
                    </div>
                  </div>
                  <div className="ex-list-new">
                    <h3>List New Token ($500)</h3>
                    <div className="ex-list-grid">
                      {assets.filter(a => !exchange.listedTokens.includes(a.symbol)).map(a => (
                        <button key={a.symbol} className="ex-list-btn" disabled={balance < 500} onClick={() => listToken(a.symbol)}>
                          <span className="ex-token-ico" style={{ background: a.color }}>{a.symbol[0]}</span><span>{a.symbol}</span><span className="ex-list-cost">$500</span>
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}
        </main>
      </div>

      {/* Exchange Modal */}
      {showExchangeModal && (
        <div className="modal-overlay" onClick={() => setShowExchangeModal(false)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <h2>🏢 Open Your Exchange</h2>
            <p>Cost: <b>$5,000</b></p>
            <label className="tf-label">Exchange Name</label>
            <input className="tf-input" type="text" value={exchangeName} onChange={e => setExchangeName(e.target.value)} placeholder="My Crypto Exchange" />
            <div className="modal-btns">
              <button className="tf-exec" onClick={openExchange}>Open Exchange</button>
              <button className="modal-cancel" onClick={() => setShowExchangeModal(false)}>Cancel</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => navigator.serviceWorker.register('/sw.js').catch(() => undefined))
}

export default App
