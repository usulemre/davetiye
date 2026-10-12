import { config } from '../config'
import { formatDate } from '../date'

export default function Hero() {
  const d = formatDate(config.start)
  return (
    <header className="hero">
      <div className="hero__arch">
        <p className="eyebrow">{config.eventType} Davetiyesi</p>
        <h1 className="hero__names">
          <span className="hero__name">{config.groom.first}</span>
          <span className="hero__amp">&amp;</span>
          <span className="hero__name">{config.bride.first}</span>
        </h1>
        <p className="hero__surnames">{config.groom.last} · {config.bride.last}</p>
        <div className="hero__date">
          <span>{d.day}</span>
          <i />
          <span>{d.monthName}</span>
          <i />
          <span>{d.year}</span>
        </div>
        <p className="hero__venue">{config.venue.name} · Ankara</p>
      </div>
      <a href="#davet" className="scroll-cue" aria-label="Aşağı kaydır"><span /></a>
    </header>
  )
}
