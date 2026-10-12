import { config } from '../config'
import { formatDate, googleCalendarUrl, downloadICS } from '../date'
import { useCountdown } from '../hooks'
import Section from './Section'

const event = {
  title: `${config.groom.first} & ${config.bride.first} · ${config.eventType}`,
  start: config.start,
  end: config.end,
  location: `${config.venue.name}, ${config.venue.address}`,
  details: 'Sizi de aramızda görmek istiyoruz 💚',
}

export function Invite() {
  return (
    <Section id="davet" className="invite">
      <Sprig />
      <p className="lead">
        Hayatımızın en güzel hikâyesine yeni bir sayfa açıyoruz.
        Bu mutlu günümüzde sizi de yanımızda görmek, sevincimizi sizinle
        paylaşmak istiyoruz.
      </p>
      <p className="signature">{config.groom.first} &amp; {config.bride.first}</p>
    </Section>
  )
}

export function When() {
  const d = formatDate(config.start)
  const c = useCountdown(config.start)
  const units = [
    ['Gün', c.days], ['Saat', c.hours], ['Dakika', c.minutes], ['Saniye', c.seconds],
  ]
  return (
    <Section id="tarih" className="when">
      <p className="eyebrow">Ne zaman?</p>
      <div className="date-card">
        <span className="date-card__weekday">{d.weekday}</span>
        <span className="date-card__day">{d.day}</span>
        <span className="date-card__month">{d.monthName} {d.year}</span>
        <span className="date-card__time">Saat {d.time}</span>
      </div>

      {c.done ? (
        <p className="countdown-done">Bugün o gün! 🎉 Yolda mısınız?</p>
      ) : (
        <div className="countdown">
          {units.map(([label, value]) => (
            <div key={label} className="countdown__cell">
              <span className="countdown__num">{String(value).padStart(2, '0')}</span>
              <span className="countdown__label">{label}</span>
            </div>
          ))}
        </div>
      )}

      <div className="btn-row">
        <a className="btn btn--dark" href={googleCalendarUrl(event)} target="_blank" rel="noreferrer">
          Google Takvim'e Ekle
        </a>
        <button className="btn btn--ghost" type="button" onClick={() => downloadICS(event)}>
          iPhone / Outlook
        </button>
      </div>
    </Section>
  )
}

export function Program() {
  return (
    <Section id="program" className="program">
      <p className="eyebrow">Akış</p>
      <h2 className="title">Günün Programı</h2>
      <ol className="timeline">
        {config.program.map((item) => (
          <li key={item.time} className="timeline__item">
            <span className="timeline__time">{item.time}</span>
            <span className="timeline__dot" />
            <div>
              <h3>{item.title}</h3>
              <p>{item.note}</p>
            </div>
          </li>
        ))}
      </ol>
    </Section>
  )
}

export function Venue({ onCopy }) {
  const q = encodeURIComponent(config.venue.mapsQuery)
  return (
    <Section id="konum" className="venue">
      <p className="eyebrow">Nerede?</p>
      <h2 className="title">{config.venue.name}</h2>
      <p className="venue__address">{config.venue.address}</p>
      <div className="map">
        <iframe
          title="Konum"
          src={`https://maps.google.com/maps?q=${q}&z=15&output=embed`}
          loading="lazy"
          referrerPolicy="no-referrer-when-downgrade"
        />
      </div>
      <div className="btn-row">
        <a className="btn btn--dark" href={`https://www.google.com/maps/search/?api=1&query=${q}`}
          target="_blank" rel="noreferrer">
          Yol Tarifi Al
        </a>
        <button className="btn btn--ghost" type="button"
          onClick={() => onCopy(`${config.venue.name}, ${config.venue.address}`, 'Adres kopyalandı 📍')}>
          Adresi Kopyala
        </button>
      </div>
    </Section>
  )
}

export function Sprig() {
  return (
    <svg className="sprig" viewBox="0 0 160 40" aria-hidden="true">
      <path d="M10 20 H150" stroke="currentColor" strokeWidth=".8" />
      {[30, 50, 70, 90, 110, 130].map((x, i) => (
        <path key={x} d={i % 2 ? `M${x} 20 q 8 -12 18 -10 q -6 10 -18 10z` : `M${x} 20 q 8 12 18 10 q -6 -10 -18 -10z`}
          fill="currentColor" opacity=".7" />
      ))}
      <circle cx="80" cy="20" r="3" fill="#D9B46A" />
    </svg>
  )
}
