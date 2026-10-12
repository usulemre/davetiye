import { handleUpload } from '@vercel/blob/client'
import { rateLimit } from './_lib.js'

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).end()
  try {
    const json = await handleUpload({
      body: req.body,
      request: req,
      onBeforeGenerateToken: async () => {
        if (!(await rateLimit(req, 'upload', 30, 3600))) {
          throw new Error('Çok fazla fotoğraf yüklendi, biraz sonra tekrar deneyin.')
        }
        return {
          allowedContentTypes: ['image/jpeg', 'image/png', 'image/webp'],
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
