import { useMemo } from 'react'
import { createPortal } from 'react-dom'

const rand = (a, b) => a + Math.random() * (b - a)

// "Geliyorum" denince ekrana yağan kalpler ve altın konfeti
export default function Confetti({ burst }) {
  const pieces = useMemo(() => Array.from({ length: 70 }, (_, i) => ({
    left: `${rand(0, 100)}%`,
    delay: `${rand(0, 0.6)}s`,
    dur: `${rand(2.2, 3.6)}s`,
    drift: `${rand(-90, 90)}px`,
    spin: `${rand(-720, 720)}deg`,
    size: rand(8, 15),
    kind: i % 3 === 0 ? 'heart' : i % 3 === 1 ? 'gold' : 'pearl',
  })), [burst])
  if (!burst) return null
  // bölüm kartları 3D döndüğü için ekrana sabit katman body'ye taşınır
  return createPortal(
    <div className="confetti" key={burst} aria-hidden="true">
      {pieces.map((p, i) => (
        <i key={i} className={`confetti__p confetti__p--${p.kind}`}
          style={{ left: p.left, width: p.size, height: p.kind === 'gold' ? p.size * 0.45 : p.size, animationDelay: p.delay, animationDuration: p.dur, '--drift': p.drift, '--spin': p.spin }}>
          {p.kind === 'heart' ? '♥' : null}
        </i>
      ))}
    </div>,
    document.body,
  )
}
