import { useCallback, useRef, useState } from 'react'
import { config } from './config'
import { copyText } from './hooks'
import Gate from './components/Gate'
import Leaves from './components/Leaves'
import Hero from './components/Hero'
import Gold from './components/Gold'
import Section from './components/Section'
import { Invite, When, Program, Venue, Sprig } from './components/Details'

export default function App() {
  const [opened, setOpened] = useState(false)
  const [toast, setToast] = useState(null)
  const timer = useRef()

  const handleCopy = useCallback(async (text, message) => {
    const ok = await copyText(text)
    setToast(ok ? message : 'Kopyalanamadı, elle seçip kopyalayabilirsiniz')
    clearTimeout(timer.current)
    timer.current = setTimeout(() => setToast(null), 2600)
  }, [])

  return (
    <>
      <Gate onOpen={() => setOpened(true)} />
      <Leaves />
      <main className={`page ${opened ? 'page--opened' : ''}`}>
        <Hero />
        <Invite />
        <When />
        <Program />
        <Venue onCopy={handleCopy} />
        <Gold onCopy={handleCopy} />
        <Section className="outro">
          <Sprig />
          <p className="outro__text">Gelmeniz bizim için en büyük hediye.<br />
            <span>(Ama altın da fena olmaz 😇)</span></p>
          <p className="outro__mono">{config.initials[0]} <em>&amp;</em> {config.initials[1]}</p>
          <p className="eyebrow">{config.venue.name} · Ankara</p>
        </Section>
      </main>
      <nav className="dock">
        <a href="#tarih">Tarih</a>
        <a href="#program">Program</a>
        <a href="#konum">Konum</a>
        <a href="#altin" className="dock__gold">Altın 🪙</a>
      </nav>
      <div className={`toast ${toast ? 'toast--show' : ''}`} role="status">{toast}</div>
    </>
  )
}
