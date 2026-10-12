import { useEffect, useMemo, useRef } from 'react'

const rand = (a, b) => a + Math.random() * (b - a)

// Metni harf ya da kelime parçalarına böler; her parça --i ile sırayla canlanır
export function SplitText({ text = '', by = 'char', start = 0 }) {
  if (by === 'word') {
    return text.split(/(\s+)/).map((w, i) =>
      /^\s+$/.test(w) ? w : <span key={i} className="sw" style={{ '--i': start + i / 2 }}>{w}</span>
    )
  }
  // Harfler kelime kelime gruplanır ki satır sadece kelime aralarından kırılsın
  let n = start
  return text.split(' ').map((word, w) => (
    <span key={w}>
      {w > 0 && ' '}
      <span className="sword">
        {[...word].map((ch, i) => <span key={i} className="sc" style={{ '--i': n++ }}>{ch}</span>)}
      </span>
    </span>
  ))
}

// Arka planda süzülen parçacıklar: altın tozu, düşen altın ya da yükselen kalpler
export function Particles({ kind = 'dust', count = 18 }) {
  const items = useMemo(() => Array.from({ length: count }, () => ({
    left: `${rand(0, 100)}%`,
    top: `${rand(0, 100)}%`,
    size: rand({ coin: 10, heart: 9, petal: 9 }[kind] ?? 2, { coin: 18, heart: 16, petal: 16 }[kind] ?? 4),
    delay: `${rand(-12, 0)}s`,
    dur: `${rand(kind === 'dust' ? 5 : 9, kind === 'dust' ? 9 : 16)}s`,
    drift: `${rand(-40, 40)}px`,
  })), [kind, count])

  return (
    <div className={`particles particles--${kind}`} aria-hidden="true">
      {items.map((p, i) => (
        <i key={i} style={{
          left: p.left, top: kind === 'dust' ? p.top : undefined,
          width: p.size, height: p.size,
          animationDelay: p.delay, animationDuration: p.dur, '--drift': p.drift,
        }}>{kind === 'heart' ? '♥' : null}</i>
      ))}
    </div>
  )
}

// Kaydırmaya bağlı efektler: üstteki ilerleme çizgisi ve kapak fotoğrafındaki derinlik
export function useScrollFx(bar) {
  useEffect(() => {
    const root = document.documentElement
    let frame = 0
    const update = () => {
      frame = 0
      const y = window.scrollY
      const max = root.scrollHeight - window.innerHeight
      if (bar.current) bar.current.style.transform = `scaleX(${max > 0 ? Math.min(1, y / max) : 0})`
      if (y < window.innerHeight * 1.3) root.style.setProperty('--sy', y.toFixed(1))
    }
    const onScroll = () => { if (!frame) frame = requestAnimationFrame(update) }
    update()
    window.addEventListener('scroll', onScroll, { passive: true })
    window.addEventListener('resize', onScroll)
    return () => {
      window.removeEventListener('scroll', onScroll)
      window.removeEventListener('resize', onScroll)
      cancelAnimationFrame(frame)
    }
  }, [bar])
}

// Parmak/fare hareketine göre hafif 3D eğilme
export function useTilt(max = 10) {
  const ref = useRef(null)
  useEffect(() => {
    const el = ref.current
    if (!el) return
    const move = (e) => {
      const r = el.getBoundingClientRect()
      const x = (e.clientX - r.left) / r.width - 0.5
      const y = (e.clientY - r.top) / r.height - 0.5
      el.style.setProperty('--rx', `${(-y * max).toFixed(2)}deg`)
      el.style.setProperty('--ry', `${(x * max).toFixed(2)}deg`)
      el.style.setProperty('--gx', `${((x + 0.5) * 100).toFixed(1)}%`)
      el.style.setProperty('--gy', `${((y + 0.5) * 100).toFixed(1)}%`)
    }
    const leave = () => {
      el.style.setProperty('--rx', '0deg')
      el.style.setProperty('--ry', '0deg')
    }
    el.addEventListener('pointermove', move)
    el.addEventListener('pointerleave', leave)
    el.addEventListener('pointerup', leave)
    return () => {
      el.removeEventListener('pointermove', move)
      el.removeEventListener('pointerleave', leave)
      el.removeEventListener('pointerup', leave)
    }
  }, [max])
  return ref
}


// El çizimi görünümlü çiçek dalı (köşe süsü)
const LEAVES = [[34, 22, 28], [62, 44, 55], [80, 74, 30], [98, 104, 70], [112, 140, 38], [138, 172, 80], [166, 194, 50]]
const BUDS = [[22, 34, -150], [88, 58, -130], [126, 118, -120], [156, 160, -110]]
const FLOWERS = [[52, 30, 13], [104, 88, 11], [146, 190, 14]]

export function Floral({ className = '' }) {
  return (
    <svg className={`floral ${className}`} viewBox="0 0 220 220" aria-hidden="true">
      <path className="floral__stem" d="M2 2C40 18 70 40 86 72s24 70 46 100 52 40 86 46" />
      {BUDS.map(([x, y, a], i) => (
        <path key={`b${i}`} className="floral__twig" d={`M${x} ${y}q-6 -10 -16 -14`} transform={`rotate(${a + 150} ${x} ${y})`} />
      ))}
      {LEAVES.map(([x, y, a], i) => (
        <path key={`l${i}`} className="floral__leaf" style={{ '--i': i }}
          d="M0 0C6-9 20-10 28 0 20 10 6 9 0 0Z" transform={`translate(${x} ${y}) rotate(${a})`} />
      ))}
      {FLOWERS.map(([x, y, r], i) => (
        <g key={`f${i}`} className="floral__flower" style={{ '--i': i }} transform={`translate(${x} ${y})`}>
          {[0, 72, 144, 216, 288].map((a) => (
            <ellipse key={a} cx="0" cy={-r * 0.55} rx={r * 0.42} ry={r * 0.62} transform={`rotate(${a})`} />
          ))}
          <circle r={r * 0.26} className="floral__heart" />
        </g>
      ))}
    </svg>
  )
}
