import { forwardRef, useImperativeHandle, useRef, useState } from 'react'
import { config } from '../config'

const Music = forwardRef(function Music(_, ref) {
  const audio = useRef(null)
  const [playing, setPlaying] = useState(false)
  const [available, setAvailable] = useState(true)

  const play = () => {
    const el = audio.current
    if (!el) return
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

  const toggle = () => {
    if (playing) {
      audio.current.pause()
      setPlaying(false)
    } else {
      play()
    }
  }

  if (!config.music || !available) return null

  return (
    <>
      <audio ref={audio} src={config.music} loop preload="auto" onError={() => setAvailable(false)} />
      <button type="button" className={`music ${playing ? 'music--on' : ''}`} onClick={toggle}
        aria-label={playing ? 'Müziği kapat' : 'Müziği aç'}>
        <span /><span /><span /><span />
      </button>
    </>
  )
})

export default Music
