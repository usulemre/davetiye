import { useEffect, useRef, useState } from 'react'
import { useSite } from '../site'
import { formatDate } from '../date'
import Qr from './Qr'

const SLIDE = 8000
const POLL = 15000

// Düğün gecesi projeksiyon ekranı: Anı Duvarı fotoğrafları slayt olarak döner,
// yeni gelen fotoğraf sıradaki slayt olur.
export default function Screen() {
  const config = useSite()
  const d = formatDate(config.start)
  const [posts, setPosts] = useState(null)
  const [index, setIndex] = useState(0)
  const [fresh, setFresh] = useState(null)
  const [full, setFull] = useState(false)
  const known = useRef(null)
  const link = `${window.location.origin}/#anilar`

  useEffect(() => {
    document.title = `${config.groom.first} & ${config.bride.first} · Anı Duvarı`
    let stop = false
    const load = async () => {
      try {
        const res = await fetch('/api/posts')
        const data = await res.json()
        if (stop) return
        const list = (data.posts || []).filter((p) => p.url)
        if (known.current) {
          const added = list.find((p) => !known.current.has(p.id))
          if (added) setFresh(added.id)
        }
        known.current = new Set(list.map((p) => p.id))
        setPosts(list)
      } catch {
        // bağlantı koparsa bir sonraki denemede toparlanır
      }
    }
    load()
    const id = setInterval(load, POLL)
    return () => { stop = true; clearInterval(id) }
  }, [])

  // Yeni fotoğraf gelince hemen onu göster
  useEffect(() => {
    if (!fresh || !posts) return
    const i = posts.findIndex((p) => p.id === fresh)
    if (i >= 0) setIndex(i)
  }, [fresh, posts])

  useEffect(() => {
    if (!posts?.length) return undefined
    const id = setTimeout(() => {
      setFresh(null)
      setIndex((i) => (i + 1) % posts.length)
    }, SLIDE)
    return () => clearTimeout(id)
  }, [index, posts])

  // Sıradaki fotoğrafı önceden yükle
  useEffect(() => {
    if (posts?.length > 1) new Image().src = posts[(index + 1) % posts.length].url
  }, [index, posts])

  const goFull = () => {
    document.documentElement.requestFullscreen?.().then(() => setFull(true)).catch(() => {})
  }

  const post = posts?.length ? posts[index % posts.length] : null

  return (
    <div className={`screen ${full ? 'screen--full' : ''}`}>
      <div className="screen__stage">
        {post ? (
          <figure key={post.id} className="screen__slide">
            <img className="screen__blur" src={post.url} alt="" aria-hidden="true" />
            <img className="screen__img" src={post.url} alt={post.caption || `${post.name} paylaştı`} />
            <figcaption className="screen__cap">
              {fresh === post.id && <span className="screen__new">Yeni ✨</span>}
              <strong>{post.name}</strong>
              {post.caption && <p>{post.caption}</p>}
              {post.likes > 0 && <span className="screen__likes">♥ {post.likes}</span>}
            </figcaption>
          </figure>
        ) : (
          <div className="screen__empty">
            <p>{posts ? 'İlk fotoğrafı sen paylaş!' : 'Yükleniyor…'}</p>
          </div>
        )}
      </div>

      <aside className="screen__side">
        <p className="screen__kicker">Anı Duvarı</p>
        <h1 className="screen__names">
          <span>{config.groom.first}</span>
          <em>&amp;</em>
          <span>{config.bride.first}</span>
        </h1>
        <p className="screen__date">{d.day} {d.monthName} {d.year}</p>
        <div className="screen__qr">
          <Qr text={link} size={220} alt="Anı Duvarı QR kodu" />
        </div>
        <p className="screen__call">Telefonunla okut,<br /><b>fotoğrafını ekle</b>,<br />burada görün! 📸</p>
        {posts?.length > 0 && <p className="screen__count">{posts.length} anı paylaşıldı · {index % posts.length + 1}/{posts.length}</p>}
      </aside>

      {!full && document.documentElement.requestFullscreen && (
        <button type="button" className="screen__fs" onClick={goFull}>Tam ekran</button>
      )}
    </div>
  )
}
