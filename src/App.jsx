import { useCallback, useEffect, useRef, useState } from 'react'
import { copyText } from './hooks'
import Intro from './components/Intro'
import Music from './components/Music'
import Hero from './components/Hero'
import Story from './components/Story'
import Gold from './components/Gold'
import Memories from './components/Memories'
import { Invite, When, Program, Venue, Outro } from './components/Sections'

export default function App() {
  const [opened, setOpened] = useState(false)
  const [toast, setToast] = useState(null)
  const [docked, setDocked] = useState(false)
  const timer = useRef()
  const music = useRef(null)

  useEffect(() => {
    const onScroll = () => setDocked(window.scrollY > window.innerHeight * 0.6)
    onScroll()
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  const notify = useCallback((message) => {
    setToast(message)
    clearTimeout(timer.current)
    timer.current = setTimeout(() => setToast(null), 2600)
  }, [])

  const handleCopy = useCallback(async (text, message) => {
    const ok = await copyText(text)
    notify(ok ? message : 'Kopyalanamadı, elle seçip kopyalayabilirsiniz')
  }, [notify])

  return (
    <>
      <Intro onOpen={(fromTap) => { setOpened(true); if (fromTap) music.current?.play() }} />
      <Music ref={music} />
      <main className={`page ${opened ? 'page--opened' : ''}`}>
        <Hero />
        <Invite />
        <Story />
        <When />
        <Program />
        <Venue onCopy={handleCopy} />
        <Gold onCopy={handleCopy} />
        <Memories notify={notify} />
        <Outro onCopy={handleCopy} />
      </main>
      <nav className={`dock ${docked ? 'dock--show' : ''}`}>
        <a href="#tarih">Tarih</a>
        <a href="#konum">Konum</a>
        <a href="#anilar">Anılar</a>
        <a href="#altin" className="dock__gold">Altın</a>
      </nav>
      <div className={`toast ${toast ? 'toast--show' : ''}`} role="status">{toast}</div>
    </>
  )
}
