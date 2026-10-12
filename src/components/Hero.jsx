import { useSite } from '../site'
import { formatDate } from '../date'
import { SplitText, Particles, SpinBadge } from '../fx'

export default function Hero() {
  const config = useSite()
  const d = formatDate(config.start)
  return (
    <header className="hero">
      <div className="hero__media">
        <img src={config.heroPhoto} alt={`${config.groom.first} ve ${config.bride.first}`} />
      </div>
      <div className="hero__shade" />
      <Particles kind="dust" count={22} />
      <div className="hero__top">
        <span>{config.initials[0]}&amp;{config.initials[1]}</span>
        <span>{d.day}.{d.month}.{d.year}</span>
      </div>
      <div className="hero__content">
        <p className="kicker kicker--light">{config.eventType} Davetiyesi</p>
        <h1 className="hero__names">
          <span><SplitText text={config.groom.first} /><small>{config.groom.last}</small></span>
          <em>&amp;</em>
          <span><SplitText text={config.bride.first} start={config.groom.first.length + 3} /><small>{config.bride.last}</small></span>
        </h1>
        <p className="hero__meta">
          <span>{d.day} {d.monthName} {d.year}</span>
          <i />
          <span>{config.venue.name}</span>
        </p>
      </div>
      <SpinBadge href="#tarih" text={`TARİHİ KAYDET ✦ ${d.day}.${d.month}.${d.year} ✦ `} center="♥" />
      <a href="#davet" className="hero__scroll" aria-label="Aşağı kaydır">
        <span>Kaydır</span><i />
      </a>
    </header>
  )
}
