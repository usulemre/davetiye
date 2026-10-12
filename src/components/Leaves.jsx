import { useMemo } from 'react'

const SHAPES = ['🍃', '🌿', '✿', '❀']

export default function Leaves({ count = 16 }) {
  const leaves = useMemo(
    () =>
      Array.from({ length: count }).map((_, i) => ({
        id: i,
        left: Math.random() * 100,
        delay: Math.random() * 14,
        duration: 12 + Math.random() * 12,
        size: 10 + Math.random() * 12,
        drift: (Math.random() - 0.5) * 160,
        shape: SHAPES[i % SHAPES.length],
      })),
    [count]
  )
  return (
    <div className="leaves" aria-hidden="true">
      {leaves.map((l) => (
        <span key={l.id} style={{
          left: `${l.left}%`, fontSize: l.size, animationDelay: `${l.delay}s`,
          animationDuration: `${l.duration}s`, '--drift': `${l.drift}px`,
        }}>{l.shape}</span>
      ))}
    </div>
  )
}
