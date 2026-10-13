import { locale } from './i18n'

const tz = 'Europe/Istanbul'

export function formatDate(iso) {
  const date = new Date(iso)
  const part = (opts) => new Intl.DateTimeFormat(locale(), { timeZone: tz, ...opts }).format(date)
  return {
    day: part({ day: '2-digit' }),
    month: part({ month: '2-digit' }),
    monthName: part({ month: 'long' }),
    year: part({ year: 'numeric' }),
    weekday: part({ weekday: 'long' }),
    time: part({ hour: '2-digit', minute: '2-digit' }),
  }
}

const toICS = (iso) => new Date(iso).toISOString().replace(/[-:]/g, '').replace(/\.\d{3}/, '')

export function googleCalendarUrl({ title, start, end, location, details }) {
  const p = new URLSearchParams({
    action: 'TEMPLATE', text: title, dates: `${toICS(start)}/${toICS(end)}`, location, details,
  })
  return `https://calendar.google.com/calendar/render?${p}`
}

export function downloadICS({ title, start, end, location, details }) {
  const ics = [
    'BEGIN:VCALENDAR', 'VERSION:2.0', 'PRODID:-//davetiye//TR', 'BEGIN:VEVENT',
    `UID:${toICS(start)}@davetiye`, `DTSTAMP:${toICS(new Date().toISOString())}`,
    `DTSTART:${toICS(start)}`, `DTEND:${toICS(end)}`,
    `SUMMARY:${title}`, `LOCATION:${location}`, `DESCRIPTION:${details}`,
    'END:VEVENT', 'END:VCALENDAR',
  ].join('\r\n')
  const url = URL.createObjectURL(new Blob([ics], { type: 'text/calendar;charset=utf-8' }))
  const a = Object.assign(document.createElement('a'), { href: url, download: 'davetiye.ics' })
  a.click()
  URL.revokeObjectURL(url)
}
