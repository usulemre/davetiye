import { forwardRef, useEffect, useImperativeHandle, useRef, useState } from 'react'
import { useSite } from '../site'

const Music = forwardRef(function Music(_, ref) {
  const config = useSite()
  const audio = useRef(null)
  const [playing, setPlaying] = useState(false)
  const [available, setAvailable] = useState(true)
  const userPaused = useRef(false)
  const [tucked, setTucked] = useState(false)

  // Aşağı kaydırırken düğme gizlenir (altındaki içeriği kapatmasın), yukarı kaydırınca geri gelir
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

  const play = () => {
    const el = audio.current
    if (!el || !el.paused) return
    el.volume = 0
    el.play().then(() => {
      setPlaying(true)
      // Sesi yumuşakça aç
      let v = 0
      const id = setInterval(() => {
        v = Math.min(0.6, v + 0.04)
        el.volume = v
        if (v >= 0.6) clearInterval(id)
      }, 120)
    }).catch(() => setPlaying(false))
  }

  useImperativeHandle(ref, () => ({ play }))

  // Tarayıcı ilk denemede izin vermezse (iPhone, uygulama içi tarayıcılar),
  // sayfadaki ilk dokunuşta müziği başlat
  useEffect(() => {
    const onGesture = () => {
      if (!userPaused.current) play()
    }
    const events = ['click', 'touchend', 'keydown']
    events.forEach((e) => window.addEventListener(e, onGesture, { passive: true }))
    return () => events.forEach((e) => window.removeEventListener(e, onGesture))
  }, [])

  const toggle = () => {
    if (playing) {
      userPaused.current = true
      audio.current.pause()
      setPlaying(false)
    } else {
      userPaused.current = false
      play()
    }
  }

  if (!config.music || !available) return null


  return (
    <>
      <audio ref={audio} src={config.music} loop preload="auto" onError={() => setAvailable(false)} />
      <button type="button" className={`music ${playing ? 'music--on' : ''} ${tucked ? 'music--tucked' : ''}`}
        onClick={(e) => { e.stopPropagation(); toggle() }}
        onTouchEnd={(e) => e.stopPropagation()}
        aria-label={playing ? 'Müziği kapat' : 'Müziği aç'}>
        <span /><span /><span /><span />
      </button>
    </>
  )
})

export default Music
