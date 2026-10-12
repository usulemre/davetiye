import { useRef, useState } from 'react'
import { config } from '../config'
import Section from './Section'

export default function Story() {
  const track = useRef(null)
  const [active, setActive] = useState(0)
  const total = config.story.length + 1

  const onScroll = () => {
    const el = track.current
    const card = el.firstElementChild
    if (!card) return
    setActive(Math.round(el.scrollLeft / (card.offsetWidth + 14)))
  }

  const go = (i) => {
    const el = track.current
    el.children[i]?.scrollIntoView({ behavior: 'smooth', inline: 'start', block: 'nearest' })
  }

  return (
    <Section id="hikaye" className="story">
      <div className="story__head">
        <div>
          <p className="kicker">Hikâyemiz</p>
          <h2 className="heading">Buraya <em>nasıl</em> geldik?</h2>
        </div>
        <span className="story__count">{String(active + 1).padStart(2, '0')} / {String(total).padStart(2, '0')}</span>
      </div>

      <div className="story__track" ref={track} onScroll={onScroll}>
        {config.story.map((s) => (
          <article key={s.no} className="chapter">
            <img src={s.photo} alt={s.title} loading="lazy" style={{ objectPosition: s.pos }} />
            <div className="chapter__shade" />
            <div className="chapter__body">
              <span className="chapter__no">{s.no}</span>
              <h3>{s.title}</h3>
              <p>{s.text}</p>
            </div>
          </article>
        ))}
        <article className="chapter chapter--next">
          <div className="chapter__body">
            <span className="chapter__no">0{total}</span>
            <h3>Düğün</h3>
            <p>Hikâyenin en güzel bölümü. Bu sefer kadroda <strong>sen de varsın.</strong></p>
            <a href="#tarih" className="chapter__cta">Tarihi gör →</a>
          </div>
        </article>
      </div>

      <div className="story__dots">
        {Array.from({ length: total }).map((_, i) => (
          <button key={i} type="button" aria-label={`Bölüm ${i + 1}`}
            className={i === active ? 'is-active' : ''} onClick={() => go(i)} />
        ))}
      </div>
    </Section>
  )
}
