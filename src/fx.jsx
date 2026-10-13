import { useEffect, useMemo, useRef, useState } from 'react'

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

// Aşağı kaydırırken köşedeki düğmeler gizlenir (altındaki içeriği kapatmasın), yukarı kaydırınca geri gelir
export function useTucked() {
  const [tucked, setTucked] = useState(false)
  useEffect(() => {
    let last = window.scrollY
    const onScroll = () => {
      const y = window.scrollY
      if (Math.abs(y - last) < 8) return
      setTucked(y > window.innerHeight * 0.8 && y > last)
      last = y
    }
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])
  return tucked
}

// Bölüm kartları ekrana girerken arkaya yatık, aşağıdan doğrulup yerine oturur.
// Kaydırmaya bağlı olduğu için parmak durunca hareket de durur.
export function useScroll3D() {
  useEffect(() => {
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return undefined
    let frame = 0
    const update = () => {
      frame = 0
      const vh = window.innerHeight
      for (const el of document.querySelectorAll('.section')) {
        const r = el.getBoundingClientRect()
        if (r.bottom < -50 || r.top > vh + 50) continue
        // 0: tam yerinde, 1: ekranın altından yeni giriyor
        const p = Math.min(1, Math.max(0, (r.top - vh * 0.62) / (vh * 0.38)))
        const e = p * p
        // Yerine oturan kartta 3D tamamen kalkar: Safari aksi hâlde yazıları
        // ilk (küçük, eğik) hâlinden kalma bulanık bir resim olarak gösteriyor
        if (e < 0.0005) {
          if (!el.classList.contains('is-flat')) {
            el.classList.add('is-flat')
            for (const k of ['--srx', '--sty', '--ssc', '--sop']) el.style.removeProperty(k)
          }
          continue
        }
        el.classList.remove('is-flat')
        el.style.setProperty('--srx', `${(e * 26).toFixed(2)}deg`)
        el.style.setProperty('--sty', `${(e * 90).toFixed(1)}px`)
        el.style.setProperty('--ssc', (1 - e * 0.1).toFixed(3))
        el.style.setProperty('--sop', (1 - e * 0.85).toFixed(3))
      }
    }
    const onScroll = () => { if (!frame) frame = requestAnimationFrame(update) }
    update()
    window.addEventListener('scroll', onScroll, { passive: true })
    window.addEventListener('resize', onScroll)
    const again = setInterval(onScroll, 1000)
    return () => {
      window.removeEventListener('scroll', onScroll)
      window.removeEventListener('resize', onScroll)
      clearInterval(again)
      cancelAnimationFrame(frame)
    }
  }, [])
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
