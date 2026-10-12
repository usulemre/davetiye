import { useEffect, useState } from 'react'
import { useSite } from '../site'
import { isLoginPath } from '../admin'
import { formatDate } from '../date'

export default function Intro({ onOpen }) {
  const config = useSite()
  const d = formatDate(config.start)
  const [state, setState] = useState(() => (window.location.hash || isLoginPath() ? 'gone' : 'idle'))

  useEffect(() => {
    if (state === 'gone' && window.location.hash) {
      onOpen()
      const target = document.getElementById(window.location.hash.slice(1))
      requestAnimationFrame(() => target?.scrollIntoView({ behavior: 'instant' }))
    }
  }, [])

  useEffect(() => {
    document.documentElement.classList.toggle('locked', state === 'idle' || state === 'opening')
  }, [state])

  const open = () => {
    if (state !== 'idle') return
    setState('opening')
    onOpen(true)
    setTimeout(() => setState('leaving'), 1900)
    setTimeout(() => setState('gone'), 2900)
  }

  if (state === 'gone') return null

  return (
    <div className={`intro intro--${state}`} onClick={open}
      onKeyDown={(e) => (e.key === 'Enter' || e.key === ' ') && open()}
      role="button" tabIndex={0} aria-label="Davetiyeyi aç">
      <p className="kicker kicker--light intro__kicker">Bir davetiyeniz var</p>

      <div className="env">
        <div className="env__back" />
        <div className="env__card">
          <span className="env__card-kicker">{config.eventType}</span>
          <p className="env__card-names">
            <span>{config.groom.first} {config.groom.last}</span>
            <em>&amp;</em>
            <span>{config.bride.first} {config.bride.last}</span>
          </p>
          <span className="env__card-date">{d.day} · {d.month} · {d.year}</span>
        </div>
        <div className="env__pocket" />
        <div className="env__flap" />
        <span className="env__seal">
          <span>Aç</span>
        </span>
      </div>

      <p className="intro__names">
        <span>{config.groom.first} {config.groom.last}</span>
        <em>&amp;</em>
        <span>{config.bride.first} {config.bride.last}</span>
      </p>
      <p className="intro__hint">Mührü kırmak için dokunun</p>
    </div>
  )
}
