import { useEffect, useState } from 'react'
import { config } from '../config'

export default function Intro({ onOpen }) {
  const [state, setState] = useState(() => (window.location.hash ? 'gone' : 'idle'))

  useEffect(() => {
    if (state === 'gone' && window.location.hash) {
      onOpen()
      const target = document.getElementById(window.location.hash.slice(1))
      requestAnimationFrame(() => target?.scrollIntoView({ behavior: 'instant' }))
    }
  }, [])

  useEffect(() => {
    document.documentElement.classList.toggle('locked', state === 'idle')
  }, [state])

  const open = () => {
    if (state !== 'idle') return
    setState('opening')
    onOpen(true)
    setTimeout(() => setState('gone'), 1400)
  }

  if (state === 'gone') return null

  return (
    <div className={`intro ${state === 'opening' ? 'intro--open' : ''}`} onClick={open}
      onKeyDown={(e) => (e.key === 'Enter' || e.key === ' ') && open()}
      role="button" tabIndex={0} aria-label="Davetiyeyi aç">
      <div className="intro__inner">
        <p className="kicker kicker--light">Bir davetiyeniz var</p>
        <svg className="intro__ring" viewBox="0 0 120 80" aria-hidden="true">
          <circle cx="46" cy="40" r="26" />
          <circle cx="74" cy="40" r="26" />
        </svg>
        <p className="intro__names">
          {config.groom.first} <em>&amp;</em> {config.bride.first}
        </p>
        <span className="intro__btn">Aç</span>
      </div>
    </div>
  )
}
