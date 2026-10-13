import { useCallback, useEffect, useRef, useState } from 'react'
import Section from './Section'
import Lightbox from './Lightbox'
import { useSite } from '../site'
import { shrink, uploadBlob, videoInfo } from '../images'
import { t, getLang } from '../i18n'

const NAME_KEY = 'davetiye:name'
const LIKES_KEY = 'davetiye:likes'
function timeAgo(ts) {
  const rtf = new Intl.RelativeTimeFormat(getLang(), { numeric: 'auto' })
  const s = Math.round((ts - Date.now()) / 1000)
  if (s > -60) return t('az önce', 'just now')
  const steps = [[60, 'minute'], [3600, 'hour'], [86400, 'day'], [604800, 'week']]
  let unit = 'minute', div = 60
  for (const [d, u] of steps) if (-s >= d) { unit = u; div = d }
  return rtf.format(Math.round(s / div), unit)
}

function report(step, err, file) {
  fetch('/api/log', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ step, message: err?.message || String(err), file: file ? `${file.type} ${file.size}` : '' }),
  }).catch(() => {})
}

async function api(path, options = {}) {
  const res = await fetch(path, {
    ...options,
    headers: { 'Content-Type': 'application/json', ...(options.headers || {}) },
  })
  const data = await res.json().catch(() => ({}))
  if (!res.ok) throw new Error(data.error || t('Bir şeyler ters gitti', 'Something went wrong'))
  return data
}

export default function Memories({ notify, admin }) {
  const [zipping, setZipping] = useState(null)
  const [view, setView] = useState(-1)
  const config = useSite()
  const [posts, setPosts] = useState(null)
  const [error, setError] = useState(null)
  const [name, setName] = useState(() => localStorage.getItem(NAME_KEY) || '')
  const [liked, setLiked] = useState(() => new Set(JSON.parse(localStorage.getItem(LIKES_KEY) || '[]')))
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
      setError(t('Anılar yüklenemedi', 'Could not load memories'))
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
      {view >= 0 && posts?.[view] && <Lightbox posts={posts} index={view} onIndex={setView} onClose={() => setView(-1)} />}
      <p className="kicker">{t('Anı Duvarı', 'Memory Wall')}</p>
      <h2 className="heading">{t(<>O gece, <em>sizin gözünüzden</em></>, <>That night, <em>through your eyes</em></>)}</h2>
      <p className="memories__lead">
        {t('Çektiğiniz kareleri buraya bırakın, birbirinizinkini beğenin, altına yorum yazın. Gelinle damadın en sevdiği anıları buradan seçeceğiz 📸', 'Drop your photos and videos here, like and comment on each other\'s. The couple will pick their favourite memories from here 📸')}
      </p>
      <span className="memories__tag">{config.hashtag}</span>

      <Composer name={name} onName={saveName} notify={notify}
        onPosted={(p) => mutate((ps) => [p, ...(ps || [])])} />

      {admin && posts?.length > 0 && (
        <button type="button" className="memories__zip" disabled={Boolean(zipping)} onClick={async () => {
          const { downloadAllPhotos } = await import('../zip')
          setZipping('0')
          try {
            const wishes = await fetch('/api/wishes').then((r) => r.json()).then((d) => d.wishes || []).catch(() => [])
            await downloadAllPhotos(posts, (n, t) => setZipping(`${n}/${t}`), wishes)
            notify('Fotoğraflar indirildi 📦')
          } catch {
            notify('İndirilemedi, tekrar deneyin')
          } finally {
            setZipping(null)
          }
        }}>
          📦 {zipping ? `Hazırlanıyor… ${zipping}` : `Tüm fotoğrafları ve dilekleri indir (${posts.length})`}
        </button>
      )}

      {error && <p className="memories__error">{error}</p>}

      {posts === null ? (
        <p className="memories__empty">{t('Yükleniyor…', 'Loading…')}</p>
      ) : posts.length === 0 ? (
        <div className="memories__empty">
          <span>✨</span>
          <p>{t(<>Henüz kimse paylaşmadı.<br />İlk kareyi sen paylaş!</>, <>Nobody has shared yet.<br />Be the first!</>)}</p>
        </div>
      ) : (
        <div className="feed">
          {posts.map((post) => (
            <PostCard key={post.id} post={post} onOpen={() => setView(posts.indexOf(post))} liked={liked.has(post.id)} name={name} onName={saveName}
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
  const nameInput = useRef(null)
  const [file, setFile] = useState(null)
  const [preview, setPreview] = useState(null)
  const [caption, setCaption] = useState('')
  const [busy, setBusy] = useState(false)
  const [progress, setProgress] = useState(0)

  const pick = (e) => {
    const f = e.target.files?.[0]
    if (!f) return
    const isVideo = f.type.startsWith('video/')
    if (!isVideo && !f.type.startsWith('image/')) return notify(t('Fotoğraf ya da video seçebilirsin', 'Please choose a photo or video'))
    if (isVideo && f.size > 60 * 1024 * 1024) return notify(t('Video en fazla 60 MB olabilir. Biraz kısaltıp tekrar dene 🙏', 'Videos can be up to 60 MB. Please trim it and try again 🙏'))
    setFile(f)
    setPreview(URL.createObjectURL(f))
    if (!name.trim()) setTimeout(() => nameInput.current?.focus(), 50)
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
    if (!name.trim()) {
      nameInput.current?.focus()
      return notify(t('Önce adını yaz 🙂', 'Please add your name first 🙂'))
    }
    setBusy(true)
    try {
      const check = await fetch(`/api/upload?kind=${file.type.startsWith('video/') ? 'video' : 'photo'}`).then((r) => r.json()).catch(() => ({}))
      if (check.error) {
        const err = new Error(check.error)
        err.step = 'limit'
        throw err
      }
      let body
      if (file.type.startsWith('video/')) {
        const info = await videoInfo(file).catch(() => null)
        if (info && info.duration > 61) {
          const err = new Error(t('Video en fazla 1 dakika olabilir. Kısaltıp tekrar dene 🙏', 'Videos can be up to 1 minute. Please trim it and try again 🙏'))
          err.step = 'video'
          throw err
        }
        // önce video (reddedilirse boşta kapak karesi kalmasın), sonra kapak karesi
        const url = await uploadBlob('anilar', file, { onProgress: setProgress })
        const poster = info?.poster ? await uploadBlob('anilar', info.poster).catch(() => '') : ''
        body = { url, name, caption, type: 'video', poster, width: info?.width || 0, height: info?.height || 0 }
      } else {
        const { blob, width, height } = await shrink(file)
        const url = await uploadBlob('anilar', blob, { onProgress: setProgress })
        body = { url, name, caption, width, height }
      }
      const { id } = await api('/api/posts', { method: 'POST', body: JSON.stringify(body) })
      onPosted({ ...body, id, likes: 0, comments: [], createdAt: Date.now() })
      notify(t('Paylaşıldı! 🎉', 'Shared! 🎉'))
      reset()
    } catch (err) {
      if (err.step !== 'limit') report(err.step || 'upload', err, file)
      // sunucunun anlaşılır uyarıları (depolama dolu, saatlik video sınırı) olduğu gibi gösterilir
      const known = /Depolama|video|saat|yükleme/i.test(err?.message || '')
      notify(err.step || known ? err.message.replace(/^.*?(Depolama|Bir saatte)/, '$1') : t('Yüklenemedi, internetini kontrol edip tekrar dene', 'Upload failed, please check your connection and try again'))
    } finally {
      setBusy(false)
    }
  }

  return (
    <form className="composer" onSubmit={submit}>
      <input ref={input} type="file" accept="image/*,video/*" hidden onChange={pick} />
      {preview ? (
        <div className="composer__preview">
          {file?.type.startsWith('video/')
            ? <video src={preview} muted playsInline controls />
            : <img src={preview} alt={t('Seçilen fotoğraf', 'Selected photo')} />}
          {!busy && <button type="button" className="composer__remove" onClick={reset} aria-label={t('Fotoğrafı kaldır', 'Remove')}>×</button>}
          {busy && <div className="composer__progress"><span style={{ width: `${progress}%` }} /></div>}
        </div>
      ) : (
        <button type="button" className="composer__drop" onClick={() => input.current?.click()}>
          <svg viewBox="0 0 24 24" aria-hidden="true"><path fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" d="M3 8.5A2.5 2.5 0 0 1 5.5 6h1.8l1.4-2h6.6l1.4 2h1.8A2.5 2.5 0 0 1 21 8.5v9a2.5 2.5 0 0 1-2.5 2.5h-13A2.5 2.5 0 0 1 3 17.5Z M12 16.5a3.5 3.5 0 1 0 0-7 3.5 3.5 0 0 0 0 7Z"/></svg>
          <span>{t('Fotoğraf ya da video ekle', 'Add a photo or video')}</span>
        </button>
      )}
      <div className="composer__fields">
        <input ref={nameInput} className="field" placeholder={t('Adın', 'Your name')} value={name} maxLength={40}
          onChange={(e) => onName(e.target.value)} />
        <input className="field" placeholder={t('Bir not bırak (isteğe bağlı)', 'Add a note (optional)')} value={caption} maxLength={300}
          onChange={(e) => setCaption(e.target.value)} />
      </div>
      <button className="btn btn--solid composer__submit" type="submit" disabled={busy}>
        {busy ? `${t('Yükleniyor…', 'Uploading…')} %${Math.round(progress)}` : file ? t('Paylaş →', 'Share →') : t('Fotoğraf / video seç', 'Choose photo / video')}
      </button>
    </form>
  )
}

function PostCard({ post, onOpen, liked, name, onName, admin, notify, onLike, onComment, onDelete, onDeleteComment }) {
  const [burst, setBurst] = useState(false)
  const [open, setOpen] = useState(false)
  const [text, setText] = useState('')
  const [sending, setSending] = useState(false)
  const lastTap = useRef(0)

  const single = useRef(0)
  // tek dokunuş büyük açar, çift dokunuş beğenir
  const onImageTap = () => {
    const now = Date.now()
    clearTimeout(single.current)
    if (now - lastTap.current < 300) {
      if (!liked) onLike()
      setBurst(true)
      setTimeout(() => setBurst(false), 800)
      lastTap.current = 0
      return
    }
    lastTap.current = now
    single.current = setTimeout(() => onOpen?.(), 320)
  }

  const send = async (e) => {
    e.preventDefault()
    if (!text.trim()) return
    if (!name.trim()) {
      const n = window.prompt(t('Yorum için adın?', 'Your name for the comment?'))
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

      {post.type === 'video' ? (
        <div className="post__media post__media--video" style={{ aspectRatio: ratio }}>
          <video src={post.url} poster={post.poster || undefined} controls playsInline preload="none" />
        </div>
      ) : (
      <div className="post__media" style={{ aspectRatio: ratio }} onClick={onImageTap}>
        <img src={post.url} alt={post.caption || `${post.name}`} loading="lazy" />
        {burst && <span className="post__burst">♥</span>}
      </div>
      )}

      <div className="post__actions">
        <button type="button" className={`post__like ${liked ? 'is-liked' : ''}`} onClick={onLike}
          aria-label={liked ? t('Beğeniyi geri al', 'Unlike') : t('Beğen', 'Like')}>
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
          {t(`${post.comments.length} yorumun tümünü gör`, `View all ${post.comments.length} comments`)}
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
        <input placeholder={t('Yorum yaz…', 'Add a comment…')} value={text} maxLength={300} onChange={(e) => setText(e.target.value)} />
        <button type="submit" disabled={sending || !text.trim()}>{t('Gönder', 'Post')}</button>
      </form>
    </article>
  )
}
