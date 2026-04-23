import axios from 'axios'

const baseURL = import.meta.env.VITE_API_URL ?? '/api'

export const api = axios.create({
  baseURL,
  timeout: 20000,
})

export type Coin = {
  id: string
  symbol: string
  name: string
  image: string
  current_price: number
  market_cap: number
  market_cap_rank: number | null
  total_volume: number
  high_24h: number | null
  low_24h: number | null
  price_change_percentage_1h_in_currency?: number | null
  price_change_percentage_24h_in_currency?: number | null
  price_change_percentage_7d_in_currency?: number | null
  sparkline_in_7d?: { price: number[] }
}

export type ChartData = {
  prices: [number, number][]
  market_caps: [number, number][]
  total_volumes: [number, number][]
}

export type FearGreedPoint = {
  value: string
  value_classification: string
  timestamp: string
  time_until_update?: string
}

export type FearGreedResponse = {
  name: string
  data: FearGreedPoint[]
  metadata?: Record<string, unknown>
}

export type NewsItem = {
  id: number | string
  title: string
  url: string
  published_at: string
  source: string | null
  domain: string | null
  currencies: string[]
}

export type ConvertResponse = {
  from: string
  to: string
  amount: number
  rate: number
  result: number
}

export type BalanceEntry = {
  asset: string
  free: number
  locked: number
  total: number
  usd_value: number | null
}

export type BalanceResponse = {
  balances: BalanceEntry[]
  total_usd: number
  account_type?: string
  can_trade?: boolean
}
