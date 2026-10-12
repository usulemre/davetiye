import { useCallback, useEffect, useRef, useState } from 'react'
import Section from './Section'

const HASHTAG = '#İsmetTuğçeyeDaldı'
const NAME_KEY = 'davetiye:name'
const LIKES_KEY = 'davetiye:likes'
const ADMIN_KEY = 'davetiye:admin'

function getAdminKey() {
  const fromUrl = new URLSearchParams(window.location.search).get('admin')
  if (fromUrl) localStorage.setItem(ADMIN_KEY, fromUrl)
  return localStorage.getItem(ADMIN_KEY)
}

const rtf = new Intl.RelativeTimeFormat('tr', { numeric: 'auto' })
function timeAgo(ts) {
  const s = Math.round((ts - Date.now()) / 1000)
  if (s > -60) return 'az önce'
  const steps = [[60, 'minute'], [3600, 'hour'], [86400, 'day'], [604800, 'week']]
  let unit = 'minute', div = 60
  for (const [d, u] of steps) if (-s >= d) { unit = u; div = d }
  return rtf.format(Math.round(s / div), unit)
}

// Fotoğrafı yüklemeden önce küçült (hızlı yükleme + az depolama)
async function shrink(file, max = 1600) {
  const bitmap = await createImageBitmap(file, { imageOrientation: 'from-image' })
  const scale = Math.min(1, max / Math.max(bitmap.width, bitmap.height))
  const w = Math.round(bitmap.width * scale)
  const h = Math.round(bitmap.height * scale)
  const canvas = document.createElement('canvas')
  canvas.width = w
  canvas.height = h
  canvas.getContext('2d').drawImage(bitmap, 0, 0, w, h)
  const blob = await new Promise((r) => canvas.toBlob(r, 'image/jpeg', 0.84))
  return { blob, width: w, height: h }
}

async function api(path, options = {}) {
  const res = await fetch(path, {
    ...options,
    headers: { 'Content-Type': 'application/json', ...(options.headers || {}) },
  })
  const data = await res.json().catch(() => ({}))
  if (!res.ok) throw new Error(data.error || 'Bir şeyler ters gitti')
  return data
}

export default function Memories({ notify }) {
  const [posts, setPosts] = useState(null)
  const [error, setError] = useState(null)
  const [name, setName] = useState(() => localStorage.getItem(NAME_KEY) || '')
  const [liked, setLiked] = useState(() => new Set(JSON.parse(localStorage.getItem(LIKES_KEY) || '[]')))
  const [admin] = useState(getAdminKey)
  // Yerel bir değişiklik (beğeni, yorum…) olduysa, ondan önce başlamış yenilemeyi yok say
  const version = useRef(0)
  const mutate = (fn) => {
    version.current += 1
    setPosts(fn)
  }

  const load = useCallback(async () => {
    const started = version.current
    try {
      const { posts } = await api('/api/posts')
      if (started !== version.current) return
      setPosts(posts)
      setError(null)
    } catch {
      setError('Anılar yüklenemedi')
      setPosts((p) => p || [])
    }
  }, [])

  useEffect(() => {
    load()
    // Canlı his: ekrandayken 8 saniyede bir yenile
    const id = setInterval(() => { if (!document.hidden) load() }, 8000)
    const onVisible = () => { if (!document.hidden) load() }
    document.addEventListener('visibilitychange', onVisible)
    return () => {
      clearInterval(id)
      document.removeEventListener('visibilitychange', onVisible)
    }
  }, [load])

  const saveName = (n) => {
    setName(n)
    localStorage.setItem(NAME_KEY, n)
  }

  const toggleLike = async (post) => {
    const isLiked = liked.has(post.id)
    const next = new Set(liked)
    isLiked ? next.delete(post.id) : next.add(post.id)
    setLiked(next)
    localStorage.setItem(LIKES_KEY, JSON.stringify([...next]))
    mutate((ps) => ps.map((p) => (p.id === post.id ? { ...p, likes: Math.max(0, p.likes + (isLiked ? -1 : 1)) } : p)))
    try {
      const { likes } = await api('/api/like', { method: 'POST', body: JSON.stringify({ id: post.id, liked: !isLiked }) })
      mutate((ps) => ps.map((p) => (p.id === post.id ? { ...p, likes } : p)))
    } catch (e) {
      notify(e.message)
    }
  }

  const addComment = async (post, text) => {
    const { comment } = await api('/api/comment', {
      method: 'POST', body: JSON.stringify({ id: post.id, name, text }),
    })
    mutate((ps) => ps.map((p) => (p.id === post.id ? { ...p, comments: [...p.comments, comment] } : p)))
  }

  const removePost = async (post) => {
    if (!window.confirm('Bu paylaşım silinsin mi?')) return
    await api(`/api/posts?id=${post.id}`, { method: 'DELETE', headers: { 'x-admin-key': admin } })
    mutate((ps) => ps.filter((p) => p.id !== post.id))
  }

  const removeComment = async (post, c) => {
    await api(`/api/comment?post=${post.id}&id=${c.id}`, { method: 'DELETE', headers: { 'x-admin-key': admin } })
    mutate((ps) => ps.map((p) => (p.id === post.id ? { ...p, comments: p.comments.filter((x) => x.id !== c.id) } : p)))
  }

  return (
    <Section id="anilar" className="memories">
      <p className="kicker">Anı Duvarı</p>
      <h2 className="heading">O gece, <em>sizin gözünüzden</em></h2>
      <p className="memories__lead">
        Çektiğiniz kareleri buraya bırakın, birbirinizinkini beğenin, altına yorum yazın.
        Gelinle damadın en sevdiği anıları buradan seçeceğiz 📸
      </p>
      <span className="memories__tag">{HASHTAG}</span>

      <Composer name={name} onName={saveName} notify={notify}
        onPosted={(p) => mutate((ps) => [p, ...(ps || [])])} />

      {error && <p className="memories__error">{error}</p>}

      {posts === null ? (
        <p className="memories__empty">Yükleniyor…</p>
      ) : posts.length === 0 ? (
        <div className="memories__empty">
          <span>✨</span>
          <p>Henüz kimse paylaşmadı.<br />İlk kareyi sen paylaş!</p>
        </div>
      ) : (
        <div className="feed">
          {posts.map((post) => (
            <PostCard key={post.id} post={post} liked={liked.has(post.id)} name={name} onName={saveName}
              admin={admin} notify={notify}
              onLike={() => toggleLike(post)}
              onComment={(text) => addComment(post, text)}
              onDelete={() => removePost(post).catch((e) => notify(e.message))}
              onDeleteComment={(c) => removeComment(post, c).catch((e) => notify(e.message))} />
          ))}
        </div>
      )}
    </Section>
  )
}

function Composer({ name, onName, onPosted, notify }) {
  const input = useRef(null)
  const [file, setFile] = useState(null)
  const [preview, setPreview] = useState(null)
  const [caption, setCaption] = useState('')
  const [busy, setBusy] = useState(false)
  const [progress, setProgress] = useState(0)

  const pick = (e) => {
    const f = e.target.files?.[0]
    if (!f) return
    if (!f.type.startsWith('image/')) return notify('Sadece fotoğraf yükleyebilirsiniz')
    setFile(f)
    setPreview(URL.createObjectURL(f))
  }

  const reset = () => {
    setFile(null)
    setPreview(null)
    setCaption('')
    setProgress(0)
    if (input.current) input.current.value = ''
  }

  const submit = async (e) => {
    e.preventDefault()
    if (!file) return input.current?.click()
    if (!name.trim()) return notify('Önce adını yaz 🙂')
    setBusy(true)
    try {
      const [{ blob, width, height }, { upload }] = await Promise.all([shrink(file), import('@vercel/blob/client')])
      const uploaded = await upload(`anilar/${Date.now()}.jpg`, blob, {
        access: 'public',
        handleUploadUrl: '/api/upload',
        contentType: 'image/jpeg',
        onUploadProgress: ({ percentage }) => setProgress(percentage),
      })
      const body = { url: uploaded.url, name, caption, width, height }
      const { id } = await api('/api/posts', { method: 'POST', body: JSON.stringify(body) })
      onPosted({ ...body, id, likes: 0, comments: [], createdAt: Date.now() })
      notify('Paylaşıldı! 🎉')
      reset()
    } catch (err) {
      notify(err.message || 'Yüklenemedi, tekrar deneyin')
    } finally {
      setBusy(false)
    }
  }

  return (
    <form className="composer" onSubmit={submit}>
      <input ref={input} type="file" accept="image/*" hidden onChange={pick} />
      {preview ? (
        <div className="composer__preview">
          <img src={preview} alt="Seçilen fotoğraf" />
          {!busy && <button type="button" className="composer__remove" onClick={reset} aria-label="Fotoğrafı kaldır">×</button>}
          {busy && <div className="composer__progress"><span style={{ width: `${progress}%` }} /></div>}
        </div>
      ) : (
        <button type="button" className="composer__drop" onClick={() => input.current?.click()}>
          <svg viewBox="0 0 24 24" aria-hidden="true"><path fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" d="M3 8.5A2.5 2.5 0 0 1 5.5 6h1.8l1.4-2h6.6l1.4 2h1.8A2.5 2.5 0 0 1 21 8.5v9a2.5 2.5 0 0 1-2.5 2.5h-13A2.5 2.5 0 0 1 3 17.5Z M12 16.5a3.5 3.5 0 1 0 0-7 3.5 3.5 0 0 0 0 7Z"/></svg>
          <span>Fotoğraf ekle</span>
        </button>
      )}
      <div className="composer__fields">
        <input className="field" placeholder="Adın" value={name} maxLength={40}
          onChange={(e) => onName(e.target.value)} />
        <input className="field" placeholder="Bir not bırak (isteğe bağlı)" value={caption} maxLength={300}
          onChange={(e) => setCaption(e.target.value)} />
      </div>
      <button className="btn btn--solid composer__submit" type="submit" disabled={busy}>
        {busy ? `Yükleniyor… %${Math.round(progress)}` : file ? 'Paylaş' : 'Fotoğraf seç'}
      </button>
    </form>
  )
}

function PostCard({ post, liked, name, onName, admin, notify, onLike, onComment, onDelete, onDeleteComment }) {
  const [burst, setBurst] = useState(false)
  const [open, setOpen] = useState(false)
  const [text, setText] = useState('')
  const [sending, setSending] = useState(false)
  const lastTap = useRef(0)

  const onImageTap = () => {
    const now = Date.now()
    if (now - lastTap.current < 300) {
      if (!liked) onLike()
      setBurst(true)
      setTimeout(() => setBurst(false), 800)
    }
    lastTap.current = now
  }

  const send = async (e) => {
    e.preventDefault()
    if (!text.trim()) return
    if (!name.trim()) {
      const n = window.prompt('Yorum için adın?')
      if (!n?.trim()) return
      onName(n.trim())
    }
    setSending(true)
    try {
      await onComment(text)
      setText('')
      setOpen(true)
    } catch (err) {
      notify(err.message)
    } finally {
      setSending(false)
    }
  }

  const shown = open ? post.comments : post.comments.slice(-2)
  const ratio = post.width && post.height ? Math.min(Math.max(post.width / post.height, 0.8), 1.25) : 1

  return (
    <article className="post">
      <header className="post__head">
        <span className="post__avatar">{post.name.charAt(0).toLocaleUpperCase('tr')}</span>
        <div>
          <strong>{post.name}</strong>
          <time>{timeAgo(post.createdAt)}</time>
        </div>
        {admin && <button type="button" className="post__delete" onClick={onDelete}>Sil</button>}
      </header>

      <div className="post__media" style={{ aspectRatio: ratio }} onClick={onImageTap}>
        <img src={post.url} alt={post.caption || `${post.name} paylaşımı`} loading="lazy" />
        {burst && <span className="post__burst">♥</span>}
      </div>

      <div className="post__actions">
        <button type="button" className={`post__like ${liked ? 'is-liked' : ''}`} onClick={onLike}
          aria-label={liked ? 'Beğeniyi geri al' : 'Beğen'}>
          <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 20.5s-7.5-4.6-9.3-9.3C1.4 7.8 3.6 4.5 7 4.5c2 0 3.6 1.1 5 3 1.4-1.9 3-3 5-3 3.4 0 5.6 3.3 4.3 6.7-1.8 4.7-9.3 9.3-9.3 9.3Z"/></svg>
          <span>{post.likes}</span>
        </button>
        <button type="button" className="post__cbtn" onClick={() => setOpen((o) => !o)} aria-label="Yorumlar">
          <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 12a8 8 0 1 1 3.4 6.5L3.5 20l1.2-3.6A7.9 7.9 0 0 1 4 12Z"/></svg>
          <span>{post.comments.length}</span>
        </button>
      </div>

      {post.caption && <p className="post__caption"><strong>{post.name}</strong> {post.caption}</p>}

      {post.comments.length > 2 && !open && (
        <button type="button" className="post__more" onClick={() => setOpen(true)}>
          {post.comments.length} yorumun tümünü gör
        </button>
      )}
      <ul className="post__comments">
        {shown.map((c) => (
          <li key={c.id}>
            <strong>{c.name}</strong> {c.text}
            {admin && <button type="button" onClick={() => onDeleteComment(c)} aria-label="Yorumu sil">×</button>}
          </li>
        ))}
      </ul>

      <form className="post__form" onSubmit={send}>
        <input placeholder="Yorum yaz…" value={text} maxLength={300} onChange={(e) => setText(e.target.value)} />
        <button type="submit" disabled={sending || !text.trim()}>Gönder</button>
      </form>
    </article>
  )
}
