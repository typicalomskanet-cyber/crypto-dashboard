type Props = {
  data: number[]
  width?: number
  height?: number
  positive?: boolean
}

export default function Sparkline({
  data,
  width = 120,
  height = 36,
  positive,
}: Props) {
  if (!data || data.length < 2) return null
  const min = Math.min(...data)
  const max = Math.max(...data)
  const range = max - min || 1
  const step = width / (data.length - 1)
  const points = data
    .map((v, i) => {
      const x = i * step
      const y = height - ((v - min) / range) * height
      return `${x.toFixed(2)},${y.toFixed(2)}`
    })
    .join(' ')

  const trendUp = positive ?? data[data.length - 1] >= data[0]
  const stroke = trendUp ? 'var(--positive)' : 'var(--negative)'

  return (
    <svg width={width} height={height} aria-hidden="true">
      <polyline
        fill="none"
        stroke={stroke}
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
        points={points}
      />
    </svg>
  )
}
