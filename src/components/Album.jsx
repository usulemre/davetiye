import { useEffect, useRef, useState } from 'react'
import { useSite } from '../site'
import { formatDate } from '../date'
import { t, tx } from '../i18n'
import Section from './Section'
import Lightbox from './Lightbox'

// Sayfaları 3D çevrilen albüm. Her yaprağın önünde fotoğraf, arkasında bir sonraki
// fotoğrafın notu var: bilgisayarda çift sayfa (solda not, sağda fotoğraf), telefonda tek sayfa.
export default function Album() {
  const config = useSite()
  const [memories, setMemories] = useState([])
  const [page, setPage] = useState(0)
  const [view, setView] = useState(-1)
  const touch = useRef(null)
  const d = formatDate(config.start)

  // İstenirse Anı Duvarı'nın en beğenilen fotoğrafları da albüme girer
  useEffect(() => {
    if (!config.albumMemories) return
    fetch('/api/posts').then((r) => r.json()).then((data) => {
      const top = (data.posts || []).filter((p) => p.type !== 'video' && p.url)
        .sort((a, b) => b.likes - a.likes).slice(0, 12)
      setMemories(top.map((p) => ({ photo: p.url, caption: p.caption || `📸 ${p.name}`, by: p.name })))
    }).catch(() => {})
  }, [config.albumMemories])

  const own = (config.album || []).filter((a) => a.photo)
  const base = own.length ? own : [
    ...config.story.filter((s) => s.photo).map((s) => ({ photo: s.photo, caption: s.title, captionEn: s.titleEn, text: s.text, textEn: s.textEn })),
    { photo: config.heroPhoto, caption: '' },
    { photo: config.outroPhoto, caption: '' },
  ]
  const photos = [...base, ...memories]
  if (!photos.length) return null

  // Yapraklar: 0 kapak, 1..n fotoğraflar, son yaprak arka kapak
  const leaves = photos.length + 2
  const go = (n) => setPage((p) => Math.max(0, Math.min(leaves - 1, p + n)))
  const caption = (p) => (p ? tx(p, 'caption') : '')

  const onTouchStart = (e) => { touch.current = e.touches[0].clientX }
  const onTouchEnd = (e) => {
    if (touch.current == null) return
    const dx = e.changedTouches[0].clientX - touch.current
    if (dx < -40) go(1)
    else if (dx > 40) go(-1)
    touch.current = null
  }

  const front = (i) => {
    if (i === 0) {
      return (
        <div className="album__cover">
          <span className="album__cover-kicker">{t('Albümümüz', 'Our album')}</span>
          <span className="album__cover-names">{config.groom.first}<em>&amp;</em>{config.bride.first}</span>
          <span className="album__cover-date">{d.day} · {d.month} · {d.year}</span>
          <span className="album__cover-hint">{t('Açmak için dokunun', 'Tap to open')}</span>
        </div>
      )
    }
    if (i === leaves - 1) {
      return (
        <div className="album__end">
          <span>{t('Hikâyemiz devam ediyor…', 'Our story continues…')}</span>
          <b>{config.initials[0]}&amp;{config.initials[1]}</b>
          <button type="button" className="album__again" onClick={(e) => { e.stopPropagation(); setPage(0) }}>{t('Baştan izle ↺', 'Start over ↺')}</button>
        </div>
      )
    }
    const p = photos[i - 1]
    const near = Math.abs(i - page) <= 2
    return (
      <figure className="album__photo">
        {near && <img src={p.photo} alt={caption(p)} draggable="false" />}
        {caption(p) && <figcaption>{caption(p)}</figcaption>}
        <button type="button" className="album__zoom" aria-label={t('Büyüt', 'Enlarge')}
          onClick={(e) => { e.stopPropagation(); setView(i - 1) }}>⤢</button>
      </figure>
    )
  }

  // Arka yüz: bilgisayarda sol sayfa olur, bir sonraki fotoğrafın notunu taşır
  const back = (i) => {
    const next = photos[i]
    if (i === 0) {
      return (
        <div className="album__note album__note--first">
          <p>{t('Bu sayfalarda birlikte biriktirdiğimiz anılar var.', 'These pages hold the memories we have gathered together.')}</p>
          <p className="album__sign">{config.groom.first} &amp; {config.bride.first}</p>
        </div>
      )
    }
    return (
      <div className="album__note">
        <span className="album__no">{String(i + 1).padStart(2, '0')}</span>
        {next ? (
          <>
            <p className="album__note-title">{caption(next)}</p>
            {tx(next, 'text') && <p>{tx(next, 'text')}</p>}
          </>
        ) : <p className="album__note-title">{t('Son', 'The end')}</p>}
        <span className="album__orn" aria-hidden="true">❦</span>
      </div>
    )
  }

  return (
    <Section id="album" className="album">
      <p className="kicker">{t('Anılarımız', 'Memories')}</p>
      <h2 className="heading">{t(<>Sayfa sayfa <em>biz</em></>, <>Us, <em>page by page</em></>)}</h2>

      <div className={`album__stage ${page > 0 ? 'is-open' : ''}`} onTouchStart={onTouchStart} onTouchEnd={onTouchEnd}>
        <div className="album__book">
          {Array.from({ length: leaves }, (_, i) => {
            const flipped = i < page
            return (
              <div key={i} className={`album__leaf ${flipped ? 'is-flipped' : ''} ${i === 0 ? 'album__leaf--cover' : ''} ${i === leaves - 1 ? 'album__leaf--last' : ''}`}
                style={{ zIndex: flipped ? i + 1 : leaves - i }}
                onClick={() => (flipped ? go(-1) : go(1))}>
                <div className="album__face album__face--front">{front(i)}</div>
                <div className="album__face album__face--back">{back(i)}</div>
              </div>
            )
          })}
        </div>
      </div>

      <div className="album__nav">
        <button type="button" onClick={() => go(-1)} disabled={page === 0} aria-label={t('Önceki sayfa', 'Previous page')}>‹</button>
        <span>{page === 0 ? t('Kapak', 'Cover') : page >= leaves - 1 ? t('Son', 'End') : `${page} / ${photos.length}`}</span>
        <button type="button" onClick={() => go(1)} disabled={page >= leaves - 1} aria-label={t('Sonraki sayfa', 'Next page')}>›</button>
      </div>

      {view >= 0 && (
        <Lightbox posts={photos.map((p, k) => ({ id: `a${k}`, url: p.photo, name: caption(p) || `${config.groom.first} & ${config.bride.first}`, caption: tx(p, 'text'), likes: null, comments: [] }))}
          index={view} onIndex={setView} onClose={() => setView(-1)} />
      )}
    </Section>
  )
}
