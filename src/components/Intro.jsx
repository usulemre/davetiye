import { Suspense, lazy, useEffect, useMemo, useState } from 'react'
import { useSite, themeColors } from '../site'
import { isLoginPath } from '../admin'
import { formatDate } from '../date'
import { isLite } from '../perf'

const rand = (a, b) => a + Math.random() * (b - a)
const Envelope3D = lazy(() => import('./Envelope3D'))

function hasWebGL() {
  try {
    const c = document.createElement('canvas')
    return Boolean(c.getContext('webgl2') || c.getContext('webgl'))
  } catch {
    return false
  }
}

export default function Intro({ onOpen, guestName }) {
  const config = useSite()
  const d = formatDate(config.start)
  const [state, setState] = useState(() => (window.location.hash || isLoginPath() ? 'gone' : 'idle'))
  // 3D zarf: 'wait' yükleniyor, 'on' hazır, 'off' desteklenmiyor (eski zarf gösterilir)
  const [three, setThree] = useState(() => (hasWebGL() && !isLite() ? 'wait' : 'off'))
  useEffect(() => {
    if (three !== 'wait') return undefined
    const t = setTimeout(() => setThree((v) => (v === 'wait' ? 'off' : v)), 5000)
    return () => clearTimeout(t)
  }, [three])

  // Arka planda yavaşça parlayan altın tozları ve mühür kırılınca saçılan kıvılcımlar
  const dust = useMemo(() => Array.from({ length: 26 }, () => ({
    left: `${rand(0, 100)}%`, top: `${rand(0, 100)}%`,
    size: `${rand(1.5, 3.5)}px`, delay: `${rand(0, 6)}s`, dur: `${rand(4, 8)}s`,
  })), [])
  const sparks = useMemo(() => Array.from({ length: 16 }, (_, i) => ({
    a: `${i * 22.5 + rand(-8, 8)}deg`, dist: `${rand(60, 120)}px`, size: `${rand(3, 6)}px`,
  })), [])

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
    navigator.vibrate?.(25)
    setState('opening')
    onOpen(true)
    const is3d = three === 'on'
    setTimeout(() => setState('leaving'), is3d ? 3000 : 2300)
    setTimeout(() => setState('gone'), is3d ? 4400 : 3400)
  }

  if (state === 'gone') return null

  return (
    <div className={`intro intro--${state} ${three === 'on' ? 'intro--3d' : ''}`} onClick={open}
      onKeyDown={(e) => (e.key === 'Enter' || e.key === ' ') && open()}
      role="button" tabIndex={0} aria-label="Davetiyeyi aç">
      <div className="intro__dust" aria-hidden="true">
        {dust.map((s, i) => (
          <i key={i} style={{ left: s.left, top: s.top, width: s.size, height: s.size, animationDelay: s.delay, animationDuration: s.dur }} />
        ))}
      </div>

      <p className="kicker kicker--light intro__kicker">
        {guestName ? <>Sevgili {guestName},<br />bir davetiyeniz var</> : 'Bir davetiyeniz var'}
      </p>

      {three !== 'off' && (
        <Suspense fallback={null}>
          <Envelope3D opening={state !== 'idle'} colors={themeColors(config)} initials={config.initials}
            card={{ kicker: config.eventType, groom: `${config.groom.first} ${config.groom.last}`, bride: `${config.bride.first} ${config.bride.last}`, date: `${d.day} · ${d.month} · ${d.year}` }}
            onReady={() => setThree('on')} onFail={() => setThree('off')} />
        </Suspense>
      )}

      <div className={`env ${three === 'off' ? '' : 'env--hidden'}`}>
        <div className="env__glow" />
        <div className="env__float">
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
          <div className="env__flap">
            <div className="env__flap-front" />
            <div className="env__flap-back" />
          </div>
          <span className="env__seal">
            <span className="env__seal-half env__seal-half--l"><b>Aç</b></span>
            <span className="env__seal-half env__seal-half--r"><b>Aç</b></span>
            <span className="env__sparks" aria-hidden="true">
              {sparks.map((s, i) => (
                <i key={i} style={{ '--a': s.a, '--d': s.dist, width: s.size, height: s.size }} />
              ))}
            </span>
          </span>
        </div>
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
