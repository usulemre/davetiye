// Fotoğrafı tarayıcının açabileceği bir görsele çevir
async function decode(file) {
  if ('createImageBitmap' in window) {
    try {
      return await createImageBitmap(file, { imageOrientation: 'from-image' })
    } catch {
      // eski Safari seçenekleri desteklemiyor ya da format açılamadı, <img> ile dene
    }
  }
  const url = URL.createObjectURL(file)
  try {
    const img = new Image()
    img.src = url
    await img.decode()
    return img
  } finally {
    URL.revokeObjectURL(url)
  }
}

// Fotoğrafı yüklemeden önce küçült (hızlı yükleme + az depolama)
export async function shrink(file, max = 1600) {
  let source
  try {
    source = await decode(file)
  } catch {
    // Tarayıcı açamadı (ör. HEIC). JPEG/PNG/WebP ise olduğu gibi yükle
    if (/^image\/(jpeg|png|webp)$/.test(file.type)) return { blob: file, width: 0, height: 0 }
    const err = new Error('Bu fotoğraf formatı desteklenmiyor. Ekran görüntüsü alıp onu yüklemeyi deneyin 🙏')
    err.step = 'decode'
    throw err
  }
  const sw = source.width || source.naturalWidth
  const sh = source.height || source.naturalHeight
  const scale = Math.min(1, max / Math.max(sw, sh))
  const w = Math.round(sw * scale)
  const h = Math.round(sh * scale)
  const canvas = document.createElement('canvas')
  canvas.width = w
  canvas.height = h
  canvas.getContext('2d').drawImage(source, 0, 0, w, h)
  const blob = await new Promise((r) => canvas.toBlob(r, 'image/jpeg', 0.84))
  if (!blob) return { blob: file, width: sw, height: sh }
  return { blob, width: w, height: h }
}

// Dosyayı Vercel Blob'a yükle ve adresini döndür
export async function uploadBlob(folder, blob, { adminKey, onProgress } = {}) {
  const { upload } = await import('@vercel/blob/client')
  const type = blob.type || 'image/jpeg'
  const sub = type.split('/')[1] || 'bin'
  const ext = sub === 'jpeg' ? 'jpg' : sub === 'mpeg' ? 'mp3' : sub === 'x-m4a' || sub === 'mp4' ? 'm4a' : sub
  const result = await upload(`${folder}/${Date.now()}.${ext}`, blob, {
    access: 'public',
    handleUploadUrl: '/api/upload',
    contentType: type,
    clientPayload: adminKey ? JSON.stringify({ adminKey }) : undefined,
    onUploadProgress: onProgress ? ({ percentage }) => onProgress(percentage) : undefined,
  })
  return result.url
}
