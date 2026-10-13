import { useEffect, useState } from 'react'
import Section from './Section'
import { t } from '../i18n'

const EMOJIS = ['🤍', '💐', '🥂', '💍', '✨', '🎉']
const NAME_KEY = 'davetiye:name'
const PAGE = 12

// İyi dilekler duvarı: kısa mesajlar, hafif eğik cam notlar
export default function Wishes({ notify, admin }) {
  const [wishes, setWishes] = useState(null)
  const [name, setName] = useState(() => localStorage.getItem(NAME_KEY) || '')
  const [text, setText] = useState('')
  const [emoji, setEmoji] = useState(EMOJIS[0])
  const [busy, setBusy] = useState(false)
  const [shown, setShown] = useState(PAGE)

  useEffect(() => {
    fetch('/api/wishes').then((r) => r.json()).then((d) => setWishes(d.wishes || [])).catch(() => setWishes([]))
  }, [])

  const send = async (e) => {
    e.preventDefault()
    if (!name.trim() || text.trim().length < 2) return notify(t('Adını ve dileğini yazar mısın? 🙂', 'Please add your name and wish 🙂'))
    setBusy(true)
    try {
      const res = await fetch('/api/wishes', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ name, text, emoji }) })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || t('Gönderilemedi', 'Could not send'))
      localStorage.setItem(NAME_KEY, name.trim())
      setWishes((w) => [{ ...data.wish, fresh: true }, ...(w || [])])
      setText('')
      notify(t('Dileğin gelinle damada ulaştı 🤍', 'Your wish reached the couple 🤍'))
    } catch (err) {
      notify(err.message)
    } finally {
      setBusy(false)
    }
  }

  const remove = async (w) => {
    if (!window.confirm('Bu dilek silinsin mi?')) return
    const res = await fetch(`/api/wishes?id=${w.id}`, { method: 'DELETE', headers: { 'x-admin-key': admin } })
    if (res.ok) setWishes((list) => list.filter((x) => x.id !== w.id))
    else notify('Silinemedi')
  }

  return (
    <Section id="dilekler" className="wishes">
      <p className="kicker">{t('Dilek kutusu', 'Wish box')}</p>
      <h2 className="heading">{t(<>İyi <em>dilekleriniz</em></>, <>Your <em>wishes</em></>)}</h2>
      <p className="wishes__lead">{t('Bize bir iki satır bırakın; hepsini saklayacak, yıllar sonra yeniden okuyacağız.', 'Leave us a line or two; we will keep them all and read them again years from now.')}</p>

      <form className="wishes__form" onSubmit={send}>
        <div className="wishes__emojis" role="radiogroup" aria-label={t('Simge', 'Icon')}>
          {EMOJIS.map((em) => (
            <button key={em} type="button" role="radio" aria-checked={emoji === em}
              className={emoji === em ? 'is-on' : ''} onClick={() => setEmoji(em)}>{em}</button>
          ))}
        </div>
        <textarea className="field" rows={3} maxLength={240} value={text} onChange={(e) => setText(e.target.value)}
          placeholder={t('Bir ömür boyu mutluluklar…', 'A lifetime of happiness…')} />
        <div className="wishes__row">
          <input className="field" placeholder={t('Adın', 'Your name')} maxLength={40} value={name} onChange={(e) => setName(e.target.value)} />
          <button type="submit" className="btn btn--solid" disabled={busy}>{busy ? t('Gönderiliyor…', 'Sending…') : t('Gönder', 'Send')}</button>
        </div>
        <small className="wishes__count">{text.length}/240</small>
      </form>

      {wishes?.length > 0 && (
        <div className="wishes__wall">
          {wishes.slice(0, shown).map((w, i) => (
            <figure key={w.id} className={`wish ${w.fresh ? 'wish--fresh' : ''}`} style={{ '--r': `${((i * 37) % 7) - 3}deg` }}>
              <span className="wish__emoji" aria-hidden="true">{w.emoji}</span>
              <blockquote>{w.text}</blockquote>
              <figcaption>— {w.name}</figcaption>
              {admin && <button type="button" className="wish__del" onClick={() => remove(w)} aria-label={t('Dileği sil', 'Delete wish')}>×</button>}
            </figure>
          ))}
        </div>
      )}
      {wishes?.length > shown && (
        <button type="button" className="btn btn--line wishes__more" onClick={() => setShown((n) => n + PAGE)}>{t('Daha fazla dilek', 'More wishes')}</button>
      )}
    </Section>
  )
}
