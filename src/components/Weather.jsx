import { useEffect, useState } from 'react'
import { formatDate } from '../date'

const CODES = [
  [[0], '☀️', 'Açık'], [[1, 2], '🌤️', 'Parçalı bulutlu'], [[3], '☁️', 'Bulutlu'], [[45, 48], '🌫️', 'Sisli'],
  [[51, 53, 55, 56, 57], '🌦️', 'Çiseleme'], [[61, 63, 65, 66, 67, 80, 81, 82], '🌧️', 'Yağmurlu'],
  [[71, 73, 75, 77, 85, 86], '❄️', 'Karlı'], [[95, 96, 99], '⛈️', 'Gök gürültülü'],
]
const describe = (code) => CODES.find(([list]) => list.includes(code)) || [[], '🌡️', 'Değişken']

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
  if (w.night < 10) tips.push('Gece soğuk olacak, kalın bir mont almayı unutmayın 🧥')
  else if (w.night < 18) tips.push('Akşam serin olabilir, yanınıza bir ceket alın 🧣')
  else tips.push('Hava güzel görünüyor, dansa hazır olun 💃')
  if (w.rain >= 50) tips.push('Yağmur ihtimali yüksek, şemsiyenizi de alın ☂️')
  return (
    <div className="weather">
      <span className="weather__icon" aria-hidden="true">{icon}</span>
      <div>
        <span className="weather__label">Düğün akşamı hava tahmini</span>
        <strong>{w.temp}° · {label}</strong>
        <small>Gece {w.night}°{w.rain ? ` · yağış ihtimali %${w.rain}` : ''}</small>
        <p>{tips.join(' ')}</p>
      </div>
    </div>
  )
}
