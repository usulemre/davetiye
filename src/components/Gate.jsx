import { useEffect, useState } from 'react'
import { config } from '../config'

export default function Gate({ onOpen }) {
  const [opening, setOpening] = useState(false)
  const [gone, setGone] = useState(false)

  const open = () => {
    if (opening) return
    setOpening(true)
    onOpen()
    setTimeout(() => setGone(true), 1900)
  }

  // Doğrudan bir bölüme gelen linklerde (örn. /#konum) kapıyı atla
  useEffect(() => {
    if (window.location.hash) {
      setOpening(true)
      setGone(true)
      onOpen()
      const target = document.getElementById(window.location.hash.slice(1))
      requestAnimationFrame(() => target?.scrollIntoView())
    }
  }, [])

  useEffect(() => {
    document.documentElement.classList.toggle('locked', !opening)
  }, [opening])

  if (gone) return null

  return (
    <div className={`gate ${opening ? 'gate--open' : ''}`} onClick={open} role="button" tabIndex={0}
      onKeyDown={(e) => (e.key === 'Enter' || e.key === ' ') && open()} aria-label="Davetiyeyi aç">
      <div className="gate__door gate__door--l"><Vines /></div>
      <div className="gate__door gate__door--r"><Vines flip /></div>
      <div className="gate__content">
        <p className="eyebrow eyebrow--light">Bahçemize davetlisiniz</p>
        <div className="gate__monogram">
          <span>{config.initials[0]}</span>
          <em>&amp;</em>
          <span>{config.initials[1]}</span>
        </div>
        <p className="gate__names">{config.groom.first} &amp; {config.bride.first}</p>
        <button className="btn btn--gold" type="button">Kapıyı Arala</button>
        <p className="gate__hint">dokun ve içeri gir</p>
      </div>
    </div>
  )
}

function Vines({ flip }) {
  return (
    <svg className="vines" viewBox="0 0 200 800" preserveAspectRatio="xMidYMid slice"
      style={flip ? { transform: 'scaleX(-1)' } : undefined} aria-hidden="true">
      <path d="M190 0 C 120 120, 200 220, 140 330 S 180 560, 120 660 S 160 760, 150 800"
        fill="none" stroke="#D9B46A" strokeOpacity=".35" strokeWidth="1.2" />
      {Array.from({ length: 14 }).map((_, i) => {
        const y = 30 + i * 56
        const x = 150 + Math.sin(i * 1.3) * 32
        const r = i % 2 ? -35 : 210
        return (
          <g key={i} transform={`translate(${x} ${y}) rotate(${r})`}>
            <path d="M0 0 C 14 -10, 34 -8, 44 0 C 34 8, 14 10, 0 0 Z" fill="#2F5A45" fillOpacity=".75" />
            <path d="M0 0 L 40 0" stroke="#D9B46A" strokeOpacity=".3" strokeWidth=".6" />
          </g>
        )
      })}
    </svg>
  )
}
