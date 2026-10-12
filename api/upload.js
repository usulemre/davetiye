import { handleUpload } from '@vercel/blob/client'
import { rateLimit, isAdminToken } from './_lib.js'

const IMAGES = ['image/jpeg', 'image/png', 'image/webp']
const AUDIO = ['audio/mpeg', 'audio/mp3', 'audio/mp4', 'audio/x-m4a', 'audio/aac', 'audio/m4a']

async function adminFromPayload(payload) {
  try {
    return await isAdminToken(JSON.parse(payload || '{}').adminKey)
  } catch {
    return false
  }
}

export default async function handler(req, res) {
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
        return {
          allowedContentTypes: IMAGES,
          maximumSizeInBytes: 15 * 1024 * 1024,
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
