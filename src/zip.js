// Anı Duvarı'ndaki bütün fotoğrafları tek ZIP dosyası olarak indirir
export async function downloadAllPhotos(posts, onProgress, wishes = []) {
  const { zipSync } = await import('fflate')
  const files = {}
  const lines = []
  const safe = (s) => String(s || '').replace(/[^\p{L}\p{N} _-]/gu, '').trim().slice(0, 30) || 'misafir'
  let done = 0
  // eskiden yeniye sıralı, numaralı dosya adları
  const list = [...posts].sort((a, b) => a.createdAt - b.createdAt)
  for (const [i, p] of list.entries()) {
    try {
      const res = await fetch(p.url)
      const buf = new Uint8Array(await res.arrayBuffer())
      const ext = (p.url.split('?')[0].match(/\.(jpe?g|png|webp|heic|gif|mp4|mov|webm)$/i)?.[1] || 'jpg').toLowerCase()
      const name = `${String(i + 1).padStart(3, '0')}-${safe(p.name)}.${ext}`
      files[name] = [buf, { level: 0 }]
      const date = new Date(p.createdAt).toLocaleString('tr-TR', { timeZone: 'Europe/Istanbul' })
      lines.push(`${name} · ${p.name} · ${date}${p.caption ? ` · "${p.caption}"` : ''} · ♥ ${p.likes || 0}`)
    } catch {
      lines.push(`(indirilemedi) ${p.url}`)
    }
    onProgress?.(++done, list.length)
  }
  files['fotograflar-listesi.txt'] = new TextEncoder().encode(lines.join('\r\n'))
  if (wishes.length) {
    const text = [...wishes].reverse().map((w) => {
      const date = new Date(w.createdAt).toLocaleString('tr-TR', { timeZone: 'Europe/Istanbul' })
      return `${w.emoji} ${w.text}\r\n   — ${w.name} · ${date}`
    }).join('\r\n\r\n')
    files['iyi-dilekler.txt'] = new TextEncoder().encode(text)
  }
  const zip = zipSync(files)
  const a = document.createElement('a')
  a.href = URL.createObjectURL(new Blob([zip], { type: 'application/zip' }))
  a.download = 'ani-duvari-fotograflar.zip'
  a.click()
  setTimeout(() => URL.revokeObjectURL(a.href), 10000)
}
