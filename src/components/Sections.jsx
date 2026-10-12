import { config } from '../config'
import { formatDate, googleCalendarUrl, downloadICS } from '../date'
import { useCountdown } from '../hooks'
import Section from './Section'

const event = {
  title: `${config.groom.first} & ${config.bride.first} · ${config.eventType}`,
  start: config.start,
  end: config.end,
  location: `${config.venue.name}, ${config.venue.address}`,
  details: 'Sizi de aramızda görmek istiyoruz 🤍',
}

export function Invite() {
  return (
    <Section id="davet" className="invite">
      <p className="kicker">Sevgili misafirimiz</p>
      <p className="invite__text">
        Bir akvaryumun önünde başlayan hikâyemiz, şimdi en güzel bölümüne geliyor.
        Hayatımızı birleştirdiğimiz bu özel günde <em>sizi de yanımızda</em> görmek
        en büyük mutluluğumuz olacak.
      </p>
      <div className="invite__families">
        <div>
          <span className="invite__name">{config.groom.first} {config.groom.last}</span>
        </div>
        <span className="invite__amp">&amp;</span>
        <div>
          <span className="invite__name">{config.bride.first} {config.bride.last}</span>
        </div>
      </div>
    </Section>
  )
}

export function When() {
  const d = formatDate(config.start)
  const c = useCountdown(config.start)
  const units = [['Gün', c.days], ['Saat', c.hours], ['Dakika', c.minutes], ['Saniye', c.seconds]]
  return (
    <Section id="tarih" className="when">
      <p className="kicker">Kaydedin</p>
      <div className="bigdate">
        <span>{d.day}</span><i>/</i><span>{d.month}</span><i>/</i><span>{d.year.slice(2)}</span>
      </div>
      <p className="when__line">{d.weekday} · Saat {d.time}</p>

      {c.done ? (
        <p className="when__done">Bugün o gün! 🎉 Yolda mısınız?</p>
      ) : (
        <div className="countdown">
          {units.map(([label, value]) => (
            <div key={label}>
              <span className="countdown__num">{String(value).padStart(2, '0')}</span>
              <span className="countdown__label">{label}</span>
            </div>
          ))}
        </div>
      )}

      <div className="btn-row">
        <a className="btn btn--solid" href={googleCalendarUrl(event)} target="_blank" rel="noreferrer">
          Google Takvim
        </a>
        <button className="btn btn--line" type="button" onClick={() => downloadICS(event)}>
          iPhone / Outlook
        </button>
      </div>
    </Section>
  )
}

export function Program() {
  return (
    <Section id="program" className="program">
      <p className="kicker">Akış</p>
      <h2 className="heading">Günün <em>programı</em></h2>
      <ol className="schedule">
        {config.program.map((item) => (
          <li key={item.time}>
            <span className="schedule__time">{item.time}</span>
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
      <p className="kicker">Mekân</p>
      <h2 className="heading">{config.venue.name}</h2>
      <p className="venue__address">{config.venue.address}</p>
      <div className="map">
        <iframe title="Konum" src={`https://maps.google.com/maps?q=${q}&z=15&output=embed`}
          loading="lazy" referrerPolicy="no-referrer-when-downgrade" />
      </div>
      <div className="btn-row">
        <a className="btn btn--solid" href={`https://www.google.com/maps/search/?api=1&query=${q}`}
          target="_blank" rel="noreferrer">Yol Tarifi Al</a>
        <button className="btn btn--line" type="button"
          onClick={() => onCopy(`${config.venue.name}, ${config.venue.address}`, 'Adres kopyalandı 📍')}>
          Adresi Kopyala
        </button>
      </div>
    </Section>
  )
}

export function Outro() {
  return (
    <footer id="son" className="outro">
      <img className="outro__bg" src={config.outroPhoto} alt="" loading="lazy" />
      <div className="outro__shade" />
      <div className="outro__content">
        <p className="outro__text">Gelmeniz bizim için<br /><em>en büyük hediye.</em></p>
        <p className="outro__small">(Ama altın da fena olmaz 😇)</p>
        <p className="outro__mono">{config.initials[0]}<em>&amp;</em>{config.initials[1]}</p>
      </div>
    </footer>
  )
}
