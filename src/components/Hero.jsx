import { useSite } from '../site'
import { formatDate } from '../date'
import { Particles, Floral } from '../fx'

export default function Hero() {
  const config = useSite()
  const d = formatDate(config.start)
  return (
    <header className="hero">
      <Particles kind="petal" count={14} />
      <Floral className="hero__fl hero__fl--l" />
      <Floral className="hero__fl hero__fl--r" />

      <div className="hero__inner">
        <p className="kicker hero__kicker">Evleniyoruz</p>
        <h1 className="hero__names">
          <span className="hero__name">
            <span className="script">{config.groom.first}</span>
            <small>{config.groom.last}</small>
          </span>
          <em>&amp;</em>
          <span className="hero__name">
            <span className="script">{config.bride.first}</span>
            <small>{config.bride.last}</small>
          </span>
        </h1>

        <div className="hero__oval">
          <img src={config.heroPhoto} alt={`${config.groom.first} ve ${config.bride.first}`} />
        </div>

        <p className="hero__date">
          <span>{d.weekday}</span>
          <b>{d.day}</b>
          <span>{d.monthName} {d.year}</span>
        </p>
        <p className="hero__venue">{config.venue.name} · Saat {d.time}</p>
      </div>

      <a href="#davet" className="hero__scroll" aria-label="Aşağı kaydır">
        <i />
      </a>
    </header>
  )
}
