import { useEffect, useState } from 'react'
import { formatDate } from './date'

// Saniyede ya da yarım dakikada bir güncellenen "şimdi"
export function useNow(ms = 30000) {
  const [now, setNow] = useState(() => Date.now())
  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), ms)
    return () => clearInterval(id)
  }, [ms])
  return now
}

const sameDay = (a, b) => {
  const x = formatDate(new Date(a).toISOString())
  const y = formatDate(new Date(b).toISOString())
  return x.day === y.day && x.month === y.month && x.year === y.year
}

// before: henüz değil, today: bugün ama başlamadı, live: devam ediyor, after: bitti
export function phaseOf(config, now) {
  const start = new Date(config.start).getTime()
  const end = new Date(config.end).getTime()
  if (now >= start && now <= end) return 'live'
  if (now > end) return 'after'
  return sameDay(now, start) ? 'today' : 'before'
}

// Programdaki her saatin gerçek zamanı (gece yarısını geçenler ertesi güne)
function programTimes(config) {
  const d = formatDate(config.start)
  let prev = -1
  let extra = 0
  return config.program.map((item) => {
    const [h, m] = String(item.time).split(':').map(Number)
    const mins = (h || 0) * 60 + (m || 0)
    if (mins < prev) extra += 86400000
    prev = mins
    return new Date(`${d.year}-${d.month}-${d.day}T${String(h || 0).padStart(2, '0')}:${String(m || 0).padStart(2, '0')}:00+03:00`).getTime() + extra
  })
}

// Düğün sürerken programda şu an hangi adımdayız
export function currentStep(config, now) {
  if (phaseOf(config, now) !== 'live') return -1
  const times = programTimes(config)
  let idx = -1
  times.forEach((t, i) => { if (now >= t) idx = i })
  return idx
}
