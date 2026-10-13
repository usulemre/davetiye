import { useRef, useState } from 'react'
import { useSite } from '../site'
import Section from './Section'
import { t, tx } from '../i18n'

const EVENT_EN = { 'Düğün': 'The wedding', 'Nişan': 'The engagement', 'Kına': 'Henna night', 'Söz': 'The promise', 'Nikâh': 'The ceremony' }

export default function Story() {
  const config = useSite()
  const track = useRef(null)
  const [active, setActive] = useState(0)
  const total = config.story.length + 1

  const onScroll = () => {
    const el = track.current
    const card = el.firstElementChild
    if (!card) return
    setActive(Math.round(el.scrollLeft / (card.offsetWidth + 18)))
  }

  const go = (i) => {
    const el = track.current
    el.children[i]?.scrollIntoView({ behavior: 'smooth', inline: 'start', block: 'nearest' })
  }

  return (
    <Section id="hikaye" className="story">
      <div className="story__head">
        <div>
          <p className="kicker">{t('Hikâyemiz', 'Our story')}</p>
          <h2 className="heading">{t(<>Buraya <em>nasıl</em> geldik?</>, <>How did we <em>get here</em>?</>)}</h2>
        </div>
        <span className="story__count">{String(active + 1).padStart(2, '0')} / {String(total).padStart(2, '0')}</span>
      </div>

      <div className="story__track" ref={track} onScroll={onScroll}>
        {config.story.map((s, i) => (
          <article key={i} className={`chapter ${i === active ? 'is-active' : ''}`}>
            <img src={s.photo} alt={tx(s, 'title')} loading="lazy" style={{ objectPosition: s.pos }} />
            <div className="chapter__shade" />
            <div className="chapter__body">
              <span className="chapter__no">{String(i + 1).padStart(2, '0')}</span>
              <h3>{tx(s, 'title')}</h3>
              <p>{tx(s, 'text')}</p>
            </div>
          </article>
        ))}
        <article className={`chapter chapter--next ${active === total - 1 ? 'is-active' : ''}`}>
          <div className="chapter__body">
            <span className="chapter__no">{String(total).padStart(2, '0')}</span>
            <h3>{t(config.eventType, EVENT_EN[config.eventType] || 'The wedding')}</h3>
            <p>{t(<>Hikâyenin en güzel bölümü. Bu sefer kadroda <strong>sen de varsın.</strong></>, <>The best chapter of the story. This time <strong>you are in it too.</strong></>)}</p>
            <a href="#tarih" className="chapter__cta">{t('Tarihi gör →', 'See the date →')}</a>
          </div>
        </article>
      </div>

      <div className="story__dots">
        {Array.from({ length: total }).map((_, i) => (
          <button key={i} type="button" aria-label={`${t('Bölüm', 'Chapter')} ${i + 1}`}
            className={i === active ? 'is-active' : ''} onClick={() => go(i)} />
        ))}
      </div>
    </Section>
  )
}
