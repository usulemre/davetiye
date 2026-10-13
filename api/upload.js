import { handleUpload } from '@vercel/blob/client'
import { rateLimit, rateLimitReached, isAdminToken, storageUsage, STORAGE_LIMIT, VIDEO_STOP, PHOTO_STOP } from './_lib.js'

const IMAGES = ['image/jpeg', 'image/png', 'image/webp']
const VIDEOS = ['video/mp4', 'video/quicktime', 'video/webm']
const AUDIO = ['audio/mpeg', 'audio/mp3', 'audio/mp4', 'audio/x-m4a', 'audio/aac', 'audio/m4a']

async function adminFromPayload(payload) {
  try {
    return await isAdminToken(JSON.parse(payload || '{}').adminKey)
  } catch {
    return false
  }
}

// Misafir yüklemeye başlamadan önce sorar: şu an fotoğraf/video yükleyebilir miyim?
// (yükleme kütüphanesi sunucu uyarısını misafire göstermediği için)
async function guestBlocked(req, video) {
  if (await rateLimitReached(req, 'upload', 30)) return 'Çok fazla fotoğraf yüklendi, biraz sonra tekrar deneyin.'
  if (video && (await rateLimitReached(req, 'upload-video', 8))) return 'Bir saatte en fazla 8 video paylaşılabilir, biraz sonra tekrar deneyin.'
  const used = (await storageUsage().catch(() => ({ total: 0 }))).total / STORAGE_LIMIT
  if (video && used > VIDEO_STOP) return 'Depolama alanı dolmak üzere, şu an video yüklenemiyor. Fotoğraf paylaşabilirsiniz 📸'
  if (used > PHOTO_STOP) return 'Depolama alanı doldu, şu an yükleme yapılamıyor.'
  return ''
}

export default async function handler(req, res) {
  if (req.method === 'GET') {
    const error = await guestBlocked(req, req.query?.kind === 'video').catch(() => '')
    return res.status(200).json(error ? { error } : { ok: true })
  }
  if (req.method !== 'POST') return res.status(405).end()
  try {
    const json = await handleUpload({
      body: req.body,
      request: req,
      onBeforeGenerateToken: async (pathname, clientPayload) => {
        // Yönetici: site fotoğrafları ve müzik yükleyebilir
        if (await adminFromPayload(clientPayload)) {
          return { allowedContentTypes: [...IMAGES, ...AUDIO], maximumSizeInBytes: 25 * 1024 * 1024, addRandomSuffix: true }
        }
        if (!(await rateLimit(req, 'upload', 30, 3600))) {
          throw new Error('Çok fazla fotoğraf yüklendi, biraz sonra tekrar deneyin.')
        }
        // Misafir: fotoğraf (15 MB) ya da kısa video (60 MB)
        const video = /\.(mp4|mov|webm)$/i.test(pathname)
        if (video && !(await rateLimit(req, 'upload-video', 8, 3600))) {
          throw new Error('Bir saatte en fazla 8 video paylaşılabilir, biraz sonra tekrar deneyin.')
        }
        // Depolama dolmak üzereyse önce videolar, en son fotoğraflar durdurulur
        const used = (await storageUsage().catch(() => ({ total: 0 }))).total / STORAGE_LIMIT
        if (video && used > VIDEO_STOP) throw new Error('Depolama alanı dolmak üzere, şu an video yüklenemiyor. Fotoğraf paylaşabilirsiniz 📸')
        if (used > PHOTO_STOP) throw new Error('Depolama alanı doldu, şu an yükleme yapılamıyor.')
        return {
          allowedContentTypes: video ? VIDEOS : IMAGES,
          maximumSizeInBytes: (video ? 60 : 15) * 1024 * 1024,
          addRandomSuffix: true,
        }
      },
      onUploadCompleted: async () => {},
    })
    return res.status(200).json(json)
  } catch (err) {
    return res.status(400).json({ error: err.message })
  }
}
