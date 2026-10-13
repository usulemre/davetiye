import { useEffect, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import { t } from '../i18n'

// Anı Duvarı fotoğraflarını tam ekran gösterir; parmakla kaydırma, ok tuşları, Esc
export default function Lightbox({ posts, index, onClose, onIndex }) {
  const [dx, setDx] = useState(0)
  const start = useRef(null)
  const post = posts[index]

  useEffect(() => {
    const key = (e) => {
      if (e.key === 'Escape') onClose()
      if (e.key === 'ArrowRight') onIndex(Math.min(posts.length - 1, index + 1))
      if (e.key === 'ArrowLeft') onIndex(Math.max(0, index - 1))
    }
    window.addEventListener('keydown', key)
    document.documentElement.classList.add('locked')
    return () => {
      window.removeEventListener('keydown', key)
      document.documentElement.classList.remove('locked')
    }
  }, [index, posts.length])

  if (!post) return null
  const go = (d) => onIndex(Math.min(posts.length - 1, Math.max(0, index + d)))

  const down = (e) => { start.current = e.clientX }
  const move = (e) => { if (start.current != null) setDx(e.clientX - start.current) }
  const up = () => {
    if (dx < -60) go(1)
    else if (dx > 60) go(-1)
    start.current = null
    setDx(0)
  }

  return createPortal(
    <div className="lb" role="dialog" aria-label={t('Fotoğraf', 'Photo')} onClick={(e) => e.target === e.currentTarget && onClose()}>
      <button type="button" className="lb__close" onClick={onClose} aria-label={t('Kapat', 'Close')}>×</button>
      <span className="lb__count">{index + 1} / {posts.length}</span>
      {index > 0 && <button type="button" className="lb__nav lb__nav--l" onClick={() => go(-1)} aria-label={t('Önceki', 'Previous')}>‹</button>}
      {index < posts.length - 1 && <button type="button" className="lb__nav lb__nav--r" onClick={() => go(1)} aria-label={t('Sonraki', 'Next')}>›</button>}
      <div className="lb__stage" onPointerDown={down} onPointerMove={move} onPointerUp={up} onPointerCancel={up}>
        {post.type === 'video' ? (
          <video key={post.id} src={post.url} poster={post.poster || undefined} controls autoPlay playsInline />
        ) : (
          <img key={post.id} src={post.url} alt={post.caption || ''} draggable="false"
            style={{ transform: `translateX(${dx}px) rotate(${dx / 40}deg)`, transition: start.current == null ? 'transform .3s ease' : 'none' }} />
        )}
      </div>
      <div className="lb__cap">
        <strong>{post.name}</strong>
        {post.caption && <p>{post.caption}</p>}
        <span>♥ {post.likes} · 💬 {post.comments.length}</span>
      </div>
    </div>,
    document.body,
  )
}
