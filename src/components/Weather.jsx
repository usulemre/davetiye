import { useEffect, useState } from 'react'
import { formatDate } from '../date'
import { t } from '../i18n'

const CODES = () => [
  [[0], '☀️', t('Açık', 'Clear')], [[1, 2], '🌤️', t('Parçalı bulutlu', 'Partly cloudy')], [[3], '☁️', t('Bulutlu', 'Cloudy')], [[45, 48], '🌫️', t('Sisli', 'Foggy')],
  [[51, 53, 55, 56, 57], '🌦️', t('Çiseleme', 'Drizzle')], [[61, 63, 65, 66, 67, 80, 81, 82], '🌧️', t('Yağmurlu', 'Rainy')],
  [[71, 73, 75, 77, 85, 86], '❄️', t('Karlı', 'Snowy')], [[95, 96, 99], '⛈️', t('Gök gürültülü', 'Thunderstorms')],
]
const describe = (code) => CODES().find(([list]) => list.includes(code)) || [[], '🌡️', t('Değişken', 'Changeable')]

// Düğüne 15 gün kala o akşamın hava tahmini (Open-Meteo, anahtarsız)
export default function Weather({ config }) {
  const [w, setW] = useState(null)
  const start = new Date(config.start).getTime()
  const days = (start - Date.now()) / 86400000
  const { lat, lon } = config.venue || {}

  useEffect(() => {
    if (!(days > -0.5 && days < 15) || !Number.isFinite(Number(lat)) || !Number.isFinite(Number(lon))) return
    const d = formatDate(config.start)
    const day = `${d.year}-${d.month}-${d.day}`
    const hour = Number(d.time.slice(0, 2))
    const url = `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&hourly=temperature_2m,precipitation_probability,weather_code&timezone=Europe%2FIstanbul&start_date=${day}&end_date=${day}`
    fetch(url)
      .then((r) => (r.ok ? r.json() : null))
      .then((data) => {
        const h = data?.hourly
        if (!h?.time?.length) return
        const i = Math.min(hour, h.time.length - 1)
        const late = Math.min(hour + 4, h.time.length - 1)
        setW({ temp: Math.round(h.temperature_2m[i]), night: Math.round(h.temperature_2m[late]), rain: h.precipitation_probability?.[i] ?? 0, code: h.weather_code[i] })
      })
      .catch(() => {})
  }, [config.start, lat, lon])

  if (!w) return null
  const [, icon, label] = describe(w.code)
  const tips = []
  if (w.night < 10) tips.push(t('Gece soğuk olacak, kalın bir mont almayı unutmayın 🧥', 'It will be cold at night, bring a warm coat 🧥'))
  else if (w.night < 18) tips.push(t('Akşam serin olabilir, yanınıza bir ceket alın 🧣', 'The evening may be cool, bring a jacket 🧣'))
  else tips.push(t('Hava güzel görünüyor, dansa hazır olun 💃', 'Looks lovely, get ready to dance 💃'))
  if (w.rain >= 50) tips.push(t('Yağmur ihtimali yüksek, şemsiyenizi de alın ☂️', 'Rain is likely, bring an umbrella ☂️'))
  return (
    <div className="weather">
      <span className="weather__icon" aria-hidden="true">{icon}</span>
      <div>
        <span className="weather__label">{t('Düğün akşamı hava tahmini', 'Forecast for the evening')}</span>
        <strong>{w.temp}° · {label}</strong>
        <small>{t('Gece', 'Night')} {w.night}°{w.rain ? t(` · yağış ihtimali %${w.rain}`, ` · ${w.rain}% chance of rain`) : ''}</small>
        <p>{tips.join(' ')}</p>
      </div>
    </div>
  )
}
