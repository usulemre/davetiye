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
  const [wishes, setWishes] = useState([])
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
        const [res, wres] = await Promise.all([fetch('/api/posts'), fetch('/api/wishes').catch(() => null)])
        const data = await res.json()
        const wdata = wres?.ok ? await wres.json() : { wishes: [] }
        if (stop) return
        setWishes(wdata.wishes || [])
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
    if (i >= 0) setIndex(Math.floor(index / posts.length) * posts.length + i)
  }, [fresh, posts])

  useEffect(() => {
    if (!posts?.length && !wishes.length) return undefined
    const cur = posts?.length ? posts[index % posts.length] : null
    const id = setTimeout(() => {
      setFresh(null)
      setIndex((i) => i + 1)
    }, cur?.type === 'video' && index % 3 !== 2 ? SLIDE * 2.5 : SLIDE)
    return () => clearTimeout(id)
  }, [index, posts, wishes.length])

  // Sıradaki fotoğrafı önceden yükle
  useEffect(() => {
    const nextPost = posts?.length > 1 ? posts[(index + 1) % posts.length] : null
    if (nextPost && nextPost.type !== 'video') new Image().src = nextPost.url
  }, [index, posts])

  const goFull = () => {
    document.documentElement.requestFullscreen?.().then(() => setFull(true)).catch(() => {})
  }

  const post = posts?.length ? posts[index % posts.length] : null
  // her iki fotoğraftan sonra bir dilek; fotoğraf yoksa sadece dilekler döner
  const wishTurn = wishes.length > 0 && (!posts?.length || (index % 3 === 2 && !fresh))
  const wish = wishTurn ? wishes[Math.floor(index / 3) % wishes.length] : null

  return (
    <div className={`screen ${full ? 'screen--full' : ''}`}>
      <div className="screen__stage">
        {wish ? (
          <figure key={`w${wish.id}${index}`} className="screen__slide screen__wish">
            <span aria-hidden="true">{wish.emoji}</span>
            <blockquote>{wish.text}</blockquote>
            <figcaption>— {wish.name}</figcaption>
          </figure>
        ) : post ? (
          <figure key={post.id} className="screen__slide">
            {(post.type !== 'video' || post.poster) && <img className="screen__blur" src={post.type === 'video' ? post.poster : post.url} alt="" aria-hidden="true" />}
            {post.type === 'video'
              ? <video className="screen__img screen__vid" src={post.url} autoPlay muted loop playsInline />
              : <img className="screen__img" src={post.url} alt={post.caption || `${post.name} paylaştı`} />}
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
        <p className="screen__call screen__call--en">Scan · share your photo · see it here</p>
        {posts?.length > 0 && <p className="screen__count">{posts.length} anı paylaşıldı · {index % posts.length + 1}/{posts.length}</p>}
      </aside>

      {!full && document.documentElement.requestFullscreen && (
        <button type="button" className="screen__fs" onClick={goFull}>Tam ekran</button>
      )}
    </div>
  )
}
