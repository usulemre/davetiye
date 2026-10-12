import { useCallback, useEffect, useRef, useState } from 'react'
import { copyText } from './hooks'
import Intro from './components/Intro'
import Hero from './components/Hero'
import Story from './components/Story'
import Gold from './components/Gold'
import { Invite, When, Program, Venue, Outro } from './components/Sections'

export default function App() {
  const [opened, setOpened] = useState(false)
  const [toast, setToast] = useState(null)
  const [docked, setDocked] = useState(false)
  const timer = useRef()

  useEffect(() => {
    const onScroll = () => setDocked(window.scrollY > window.innerHeight * 0.6)
    onScroll()
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  const handleCopy = useCallback(async (text, message) => {
    const ok = await copyText(text)
    setToast(ok ? message : 'Kopyalanamadı, elle seçip kopyalayabilirsiniz')
    clearTimeout(timer.current)
    timer.current = setTimeout(() => setToast(null), 2600)
  }, [])

  return (
    <>
      <Intro onOpen={() => setOpened(true)} />
      <main className={`page ${opened ? 'page--opened' : ''}`}>
        <Hero />
        <Invite />
        <Story />
        <When />
        <Program />
        <Venue onCopy={handleCopy} />
        <Gold onCopy={handleCopy} />
        <Outro />
      </main>
      <nav className={`dock ${docked ? 'dock--show' : ''}`}>
        <a href="#hikaye">Hikâye</a>
        <a href="#tarih">Tarih</a>
        <a href="#konum">Konum</a>
        <a href="#altin" className="dock__gold">Altın</a>
      </nav>
      <div className={`toast ${toast ? 'toast--show' : ''}`} role="status">{toast}</div>
    </>
  )
}
