import { useState } from 'react'
import { useSite } from '../site'
import Section from './Section'
import { t, tx } from '../i18n'

// Sıkça sorulanlar: dokununca cevabı açılan cam kartlar
export default function Faq() {
  const config = useSite()
  const [open, setOpen] = useState(0)
  const items = (config.faq || []).filter((f) => f.q).map((f) => ({ q: tx(f, 'q'), a: tx(f, 'a') }))
  if (!items.length) return null
  return (
    <Section id="sss" className="faq">
      <p className="kicker">{t('Merak edilenler', 'Good to know')}</p>
      <h2 className="heading">{t(<>Sıkça <em>sorulanlar</em></>, <>Frequently <em>asked</em></>)}</h2>
      <div className="faq__list">
        {items.map((f, i) => (
          <div key={i} className={`faq__item ${open === i ? 'is-open' : ''}`}>
            <button type="button" className="faq__q" aria-expanded={open === i} onClick={() => setOpen(open === i ? -1 : i)}>
              <span>{f.q}</span>
              <i aria-hidden="true" />
            </button>
            <div className="faq__a"><div><p>{f.a}</p></div></div>
          </div>
        ))}
      </div>
    </Section>
  )
}
