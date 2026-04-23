import type { FearGreedPoint } from '../api/client'

type Props = { point: FearGreedPoint }

function colorFor(value: number): string {
  if (value < 25) return '#ef4444'
  if (value < 45) return '#f97316'
  if (value < 55) return '#f59e0b'
  if (value < 75) return '#84cc16'
  return '#22c55e'
}

export default function FearGreedBadge({ point }: Props) {
  const value = Number(point.value)
  const color = colorFor(value)
  return (
    <div className="fng-badge" title={`Fear & Greed Index: ${point.value_classification}`}>
      <span className="dot" style={{ background: color }} />
      <span>
        F&amp;G: <strong>{point.value}</strong> · {point.value_classification}
      </span>
    </div>
  )
}
