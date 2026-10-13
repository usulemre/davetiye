import { Suspense, lazy } from 'react'
import { useSite, themeColors } from '../site'
import { formatDate } from '../date'
import { useTilt } from '../fx'
import { useNow, phaseOf } from '../live'
import { isLite } from '../perf'
import { t } from '../i18n'

const LITE = isLite()

const Rings3D = lazy(() => import('./Rings3D'))

export default function Hero({ opened }) {
  const config = useSite()
  const d = formatDate(config.start)
  const tilt = useTilt(12)
  const phase = phaseOf(config, useNow())
  const kicker = { today: t('Bugün evleniyoruz!', 'We\'re getting married today!'), live: t('Şu an evleniyoruz', 'We\'re getting married right now'), after: t('Evlendik!', 'Just married!') }[phase] || t('Evleniyoruz', 'We\'re getting married')
  return (
    <header className="hero">
      <div className="hero__stage">
        {LITE ? (
          <div className="rings-lite" aria-hidden="true"><i /><i /></div>
        ) : (
          <Suspense fallback={null}>
            <Rings3D gold={themeColors(config).champagne} play={opened} />
          </Suspense>
        )}
      </div>

      <div className="hero__inner">
        <p className="kicker hero__kicker">{kicker}</p>
        <h1 className="hero__names">
          <span className="hero__name">
            <span className="hero__first">{config.groom.first}</span>
            <small>{config.groom.last}</small>
          </span>
          <em>&amp;</em>
          <span className="hero__name">
            <span className="hero__first">{config.bride.first}</span>
            <small>{config.bride.last}</small>
          </span>
        </h1>

        <p className="hero__date glass">
          <span>{d.weekday}</span>
          <b>{d.day}</b>
          <span>{d.monthName} {d.year}</span>
        </p>
        <p className="hero__venue">{config.venue.name} · {t('Saat', 'at')} {d.time}</p>

        <div className="hero__frame" ref={tilt}>
          <img src={config.heroPhoto} alt={`${config.groom.first} ${t('ve', 'and')} ${config.bride.first}`} />
          <span className="hero__badge glass">{d.day}.{d.month}.{d.year}</span>
        </div>
      </div>

      <a href="#davet" className="hero__scroll" aria-label={t('Aşağı kaydır', 'Scroll down')}>
        <i />
      </a>
    </header>
  )
}
