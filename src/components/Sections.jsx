import { useSite } from '../site'
import { formatDate, googleCalendarUrl, downloadICS } from '../date'
import { useCountdown } from '../hooks'
import Section from './Section'
import { SplitText } from '../fx'
import { useNow, phaseOf, currentStep } from '../live'
import { makeStoryImage } from '../story'
import Weather from './Weather'
import { useState } from 'react'

const calendarEvent = (config) => ({
  title: `${config.groom.first} & ${config.bride.first} · ${config.eventType}`,
  start: config.start,
  end: config.end,
  location: `${config.venue.name}, ${config.venue.address}`,
  details: 'Sizi de aramızda görmek istiyoruz 🤍',
})

export function Invite({ guestName }) {
  const config = useSite()
  return (
    <Section id="davet" className="invite">
      <p className="kicker">Sevgili {guestName || 'misafirimiz'}</p>
      <p className="invite__text">
        <SplitText text={config.inviteText} by="word" />
      </p>
      <svg className="ornament" viewBox="0 0 240 24" aria-hidden="true">
        <path d="M0 12h96M144 12h96" />
        <path d="M120 3c-4-5-12-2-12 4 0 6 12 12 12 14 0-2 12-8 12-14 0-6-8-9-12-4Z" />
      </svg>
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

const WEEKDAYS = ['Pt', 'Sa', 'Ça', 'Pe', 'Cu', 'Ct', 'Pz']

// Düğünün olduğu ayın küçük takvimi; o gün kalple işaretli
function Calendar({ d }) {
  const year = Number(d.year)
  const month = Number(d.month)
  const day = Number(d.day)
  const offset = (new Date(Date.UTC(year, month - 1, 1)).getUTCDay() + 6) % 7
  const days = new Date(Date.UTC(year, month, 0)).getUTCDate()
  return (
    <div className="cal">
      <p className="cal__head">{d.monthName} {d.year}</p>
      <div className="cal__grid">
        {WEEKDAYS.map((w) => <span key={w} className="cal__wd">{w}</span>)}
        {Array.from({ length: offset }, (_, i) => <span key={`e${i}`} />)}
        {Array.from({ length: days }, (_, i) => (
          <span key={i} className={i + 1 === day ? 'cal__day is-day' : 'cal__day'} style={{ '--i': i }}>
            {i + 1 === day && (
              <svg viewBox="0 0 32 30" aria-hidden="true"><path d="M16 28S2 19.5 2 10.2A7.2 7.2 0 0 1 16 7a7.2 7.2 0 0 1 14 3.2C30 19.5 16 28 16 28Z" /></svg>
            )}
            <b>{i + 1}</b>
          </span>
        ))}
      </div>
    </div>
  )
}

export function When() {
  const config = useSite()
  const event = calendarEvent(config)
  const d = formatDate(config.start)
  const c = useCountdown(config.start)
  const phase = phaseOf(config, useNow(10000))
  const units = [['Gün', c.days], ['Saat', c.hours], ['Dakika', c.minutes], ['Saniye', c.seconds]]
  return (
    <Section id="tarih" className="when">
      <p className="kicker">Kaydedin</p>
      <h2 className="heading">Büyük <em>gün</em></h2>
      <Calendar d={d} />
      <p className="when__line">{d.weekday} · Saat {d.time}</p>
      {phase !== 'after' && <Weather config={config} />}

      {phase === 'after' ? (
        <div className="when__after">
          <p className="when__done">Bizimle olduğunuz için teşekkürler 🤍</p>
          <p className="when__note">O geceden fotoğraflarınız varsa Anı Duvarı'na eklemeyi unutmayın.</p>
          <a className="btn btn--solid" href="#anilar">Anı Duvarı'na git</a>
        </div>
      ) : phase === 'live' || c.done ? (
        <p className="when__done">Düğün şu an devam ediyor! 🎉 Yolda mısınız?</p>
      ) : (
        <div className="countdown">
          {units.map(([label, value]) => (
            <div key={label}>
              <span className="countdown__num"><b key={value}>{String(value).padStart(2, '0')}</b></span>
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
  const config = useSite()
  const now = currentStep(config, useNow())
  return (
    <Section id="program" className="program">
      <p className="kicker">{now >= 0 ? <><span className="live-dot" /> Canlı akış</> : 'Akış'}</p>
      <h2 className="heading">Günün <em>programı</em></h2>
      <ol className="schedule">
        {config.program.map((item, i) => (
          <li key={item.time} style={{ '--i': i }} className={i === now ? 'is-now' : i < now ? 'is-past' : ''}>
            <span className="schedule__time">{item.time}</span>
            <div>
              {i === now && <span className="schedule__now">Şu an</span>}
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
  const config = useSite()
  const q = encodeURIComponent(config.venue.mapsQuery)
  return (
    <Section id="konum" className="venue">
      <span className="pin" aria-hidden="true">
        <svg viewBox="0 0 24 24"><path d="M12 22s7-6.2 7-12a7 7 0 1 0-14 0c0 5.8 7 12 7 12Z" /><circle cx="12" cy="10" r="2.6" /></svg>
      </span>
      <p className="kicker">Mekân</p>
      <h2 className="heading">{config.venue.name}</h2>
      <p className="venue__address">{config.venue.address}</p>
      <div className="map">
        <span className="map__chip"><b /> {config.venue.name}</span>
        <iframe title="Konum" src={`https://maps.google.com/maps?q=${q}&z=15&output=embed`}
          loading="lazy" referrerPolicy="no-referrer-when-downgrade" />
      </div>
      <div className="btn-row">
        <a className="btn btn--solid" href={`https://www.google.com/maps/search/?api=1&query=${q}`}
          target="_blank" rel="noreferrer">Yol Tarifi Al</a>
        <a className="btn btn--line" href={`https://waze.com/ul?q=${q}&navigate=yes`} target="_blank" rel="noreferrer">Waze</a>
        <button className="btn btn--line" type="button"
          onClick={() => onCopy(`${config.venue.name}, ${config.venue.address}`, 'Adres kopyalandı 📍')}>
          Adresi Kopyala
        </button>
      </div>
    </Section>
  )
}

export function Outro({ onCopy, onAdmin, isAdmin, notify }) {
  const config = useSite()
  const url = window.location.origin
  const message = `${config.groom.first} & ${config.bride.first} evleniyor! 💍 Düğün davetiyemiz:`

  const share = async () => {
    if (navigator.share) {
      try {
        await navigator.share({ title: `${config.groom.first} & ${config.bride.first}`, text: message, url })
      } catch {
        // paylaşım penceresi kapatıldı
      }
    } else {
      onCopy(url, 'Davetiye linki kopyalandı 🔗')
    }
  }

  const [making, setMaking] = useState(false)
  // Hikâye görseli: telefonda paylaşım menüsü açılır, olmazsa indirilir
  const story = async () => {
    if (making) return
    setMaking(true)
    try {
      const blob = await makeStoryImage(config)
      const file = new File([blob], 'davetiye-hikaye.jpg', { type: 'image/jpeg' })
      if (navigator.canShare?.({ files: [file] })) {
        try { await navigator.share({ files: [file], title: `${config.groom.first} & ${config.bride.first}` }) } catch { /* vazgeçildi */ }
      } else {
        const a = document.createElement('a')
        a.href = URL.createObjectURL(blob)
        a.download = 'davetiye-hikaye.jpg'
        a.click()
        setTimeout(() => URL.revokeObjectURL(a.href), 4000)
        notify?.('Hikâye görseli indirildi 📸')
      }
    } finally {
      setMaking(false)
    }
  }

  return (
    <footer id="son" className="outro">
      <div className="outro__content">
        <p className="outro__text">Gelmeniz bizim için<br /><em>en büyük hediye</em></p>
        <p className="outro__small">(Ama altın da fena olmaz 😇)</p>
        <div className="outro__arch">
          <img src={config.outroPhoto} alt="" loading="lazy" />
        </div>
        <p className="outro__mono">{config.groom.first} <em>&amp;</em> {config.bride.first}</p>
        <div className="share">
          <span className="share__label">Davetiyeyi paylaş</span>
          <div className="share__icons">
            <a className="share__icon" target="_blank" rel="noreferrer" aria-label="WhatsApp'ta paylaş"
              href={`https://api.whatsapp.com/send?text=${encodeURIComponent(`${message} ${url}`)}`}>
              <svg viewBox="0 0 24 24" aria-hidden="true"><path fill="currentColor" d="M12 2a10 10 0 0 0-8.6 15.1L2 22l5-1.3A10 10 0 1 0 12 2Zm0 18.2a8.2 8.2 0 0 1-4.2-1.2l-.3-.2-3 .8.8-2.9-.2-.3A8.2 8.2 0 1 1 12 20.2Zm4.5-6.1c-.2-.1-1.5-.7-1.7-.8-.2-.1-.4-.1-.6.1l-.8 1c-.1.2-.3.2-.5.1a6.7 6.7 0 0 1-3.3-2.9c-.3-.4.3-.4.8-1.3.1-.2 0-.3 0-.4l-.8-1.8c-.2-.5-.4-.4-.6-.4h-.5a1 1 0 0 0-.7.3 3 3 0 0 0-.9 2.2 5.2 5.2 0 0 0 1.1 2.7 11.8 11.8 0 0 0 4.5 4c1.7.7 2.3.8 3.2.6.5-.1 1.5-.6 1.7-1.2.2-.6.2-1.1.2-1.2-.1-.1-.3-.2-.6-.3Z"/></svg>
            </a>
            <button type="button" className="share__icon" aria-label="Linki kopyala"
              onClick={() => onCopy(url, 'Davetiye linki kopyalandı 🔗')}>
              <svg viewBox="0 0 24 24" aria-hidden="true"><path fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" d="M10 14a4.5 4.5 0 0 0 6.4 0l3-3a4.5 4.5 0 0 0-6.4-6.4l-1.2 1.2M14 10a4.5 4.5 0 0 0-6.4 0l-3 3a4.5 4.5 0 0 0 6.4 6.4l1.2-1.2"/></svg>
            </button>
            <button type="button" className="share__icon" aria-label="Paylaş" onClick={share}>
              <svg viewBox="0 0 24 24" aria-hidden="true"><path fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" d="M12 3v12M7.5 7.5 12 3l4.5 4.5M5 13v6a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2v-6"/></svg>
            </button>
          </div>
          <button type="button" className="story-btn" onClick={story} disabled={making}>
            <svg viewBox="0 0 24 24" aria-hidden="true"><rect x="3" y="3" width="18" height="18" rx="5" fill="none" stroke="currentColor" strokeWidth="1.6" /><circle cx="12" cy="12" r="4" fill="none" stroke="currentColor" strokeWidth="1.6" /><circle cx="17.3" cy="6.7" r="1.1" fill="currentColor" /></svg>
            {making ? 'Hazırlanıyor…' : 'Hikâyende paylaş'}
          </button>
        </div>
      </div>
      {!isAdmin && (
        <button type="button" className="outro__admin" onClick={onAdmin}>Yönetici girişi</button>
      )}
    </footer>
  )
}
