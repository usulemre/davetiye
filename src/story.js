import { formatDate } from './date'
import { themeColors } from './site'
import { t } from './i18n'

const loadImage = (src) => new Promise((resolve) => {
  const img = new Image()
  img.crossOrigin = 'anonymous'
  img.onload = () => resolve(img)
  img.onerror = () => resolve(null)
  img.src = src
})

// Instagram/WhatsApp hikâyesi için 1080x1920 davetiye görseli
export async function makeStoryImage(config) {
  const W = 1080
  const H = 1920
  const c = document.createElement('canvas')
  c.width = W
  c.height = H
  const x = c.getContext('2d')
  const col = themeColors(config)
  const d = formatDate(config.start)
  await document.fonts?.ready

  // inci zemin ve ışık lekeleri
  x.fillStyle = col.paper
  x.fillRect(0, 0, W, H)
  const blob = (cx, cy, r, color) => {
    const g = x.createRadialGradient(cx, cy, 0, cx, cy, r)
    g.addColorStop(0, color)
    g.addColorStop(1, 'rgba(255,255,255,0)')
    x.fillStyle = g
    x.fillRect(0, 0, W, H)
  }
  blob(120, 180, 700, col.champagneHi)
  blob(1000, 760, 600, '#e9e4f4')
  blob(80, 1500, 650, '#f6e3de')
  blob(1000, 1800, 600, '#e1ecf2')

  x.textAlign = 'center'
  x.textBaseline = 'middle'
  const spaced = (t, y, font, color) => {
    x.font = font
    x.fillStyle = color
    x.fillText(t.toLocaleUpperCase('tr').split('').join(String.fromCharCode(8202)), W / 2, y)
  }

  spaced(t('Düğünümüze davetlisiniz', 'You are invited to our wedding'), 150, '600 30px Manrope, sans-serif', col.champagne)

  // fotoğraf: cam çerçeveli kemer
  const photo = await loadImage(config.heroPhoto)
  const fx = 200
  const fy = 230
  const fw = 680
  const fh = 820
  const arch = (pad) => {
    const r = fw / 2 + pad
    x.beginPath()
    x.moveTo(fx - pad, fy + r)
    x.arc(fx + fw / 2, fy + r - pad, r, Math.PI, 0)
    x.lineTo(fx + fw + pad, fy + fh + pad - 40)
    x.quadraticCurveTo(fx + fw + pad, fy + fh + pad, fx + fw + pad - 40, fy + fh + pad)
    x.lineTo(fx - pad + 40, fy + fh + pad)
    x.quadraticCurveTo(fx - pad, fy + fh + pad, fx - pad, fy + fh + pad - 40)
    x.closePath()
  }
  x.save()
  x.shadowColor = 'rgba(60,40,30,.25)'
  x.shadowBlur = 60
  x.shadowOffsetY = 30
  arch(18)
  x.fillStyle = 'rgba(255,255,255,.85)'
  x.fill()
  x.restore()
  if (photo) {
    x.save()
    arch(0)
    x.clip()
    const s = Math.max(fw / photo.width, fh / photo.height)
    x.drawImage(photo, fx + (fw - photo.width * s) / 2, fy + (fh - photo.height * s) / 2, photo.width * s, photo.height * s)
    x.restore()
  }

  // iki altın alyans
  x.lineWidth = 9
  x.strokeStyle = col.champagne
  x.beginPath(); x.arc(W / 2 - 26, 1135, 42, 0, Math.PI * 2); x.stroke()
  x.beginPath(); x.arc(W / 2 + 26, 1135, 42, 0, Math.PI * 2); x.stroke()

  x.fillStyle = col.ink
  x.font = 'italic 300 104px "Cormorant Garamond", serif'
  x.fillText(config.groom.first, W / 2, 1270)
  spaced(config.groom.last, 1345, '600 28px Manrope, sans-serif', col.ink)
  x.fillStyle = col.champagne
  x.font = 'italic 400 64px "Cormorant Garamond", serif'
  x.fillText('&', W / 2, 1420)
  x.fillStyle = col.ink
  x.font = 'italic 300 104px "Cormorant Garamond", serif'
  x.fillText(config.bride.first, W / 2, 1500)
  spaced(config.bride.last, 1575, '600 28px Manrope, sans-serif', col.ink)

  // tarih şeridi
  x.strokeStyle = col.champagne
  x.lineWidth = 2
  x.beginPath(); x.moveTo(200, 1660); x.lineTo(880, 1660); x.stroke()
  x.fillStyle = col.ink
  x.font = '500 52px "Cormorant Garamond", serif'
  x.fillText(`${d.day} ${d.monthName} ${d.year} · ${d.weekday}`, W / 2, 1720)
  x.font = 'italic 400 40px "Cormorant Garamond", serif'
  x.globalAlpha = 0.75
  x.fillText(`${config.venue.name} · ${t('Saat', 'at')} ${d.time}`, W / 2, 1782)
  x.globalAlpha = 1
  spaced(window.location.host, 1860, '600 24px Manrope, sans-serif', col.champagne)

  return new Promise((resolve) => c.toBlob(resolve, 'image/jpeg', 0.92))
}
