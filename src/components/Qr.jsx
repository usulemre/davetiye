import { useEffect, useState } from 'react'
import QRCode from 'qrcode'

// Verilen metnin QR kodu (resim olarak)
export default function Qr({ text, size = 220, dark = '#4b3a3a', className = '', alt = 'QR kod' }) {
  const [src, setSrc] = useState('')
  useEffect(() => {
    QRCode.toDataURL(text, { width: size * 2, margin: 1, color: { dark, light: '#ffffff' } })
      .then(setSrc)
      .catch(() => setSrc(''))
  }, [text, size, dark])
  return src ? <img className={className} src={src} width={size} height={size} alt={alt} /> : <span className={className} style={{ width: size, height: size }} />
}
