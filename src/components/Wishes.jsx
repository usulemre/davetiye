import { useEffect, useState } from 'react'
import Section from './Section'

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
    if (!name.trim() || text.trim().length < 2) return notify('Adını ve dileğini yazar mısın? 🙂')
    setBusy(true)
    try {
      const res = await fetch('/api/wishes', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ name, text, emoji }) })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Gönderilemedi')
      localStorage.setItem(NAME_KEY, name.trim())
      setWishes((w) => [{ ...data.wish, fresh: true }, ...(w || [])])
      setText('')
      notify('Dileğin gelinle damada ulaştı 🤍')
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
      <p className="kicker">Dilek kutusu</p>
      <h2 className="heading">İyi <em>dilekleriniz</em></h2>
      <p className="wishes__lead">Bize bir iki satır bırakın; hepsini saklayacak, yıllar sonra yeniden okuyacağız.</p>

      <form className="wishes__form" onSubmit={send}>
        <div className="wishes__emojis" role="radiogroup" aria-label="Simge">
          {EMOJIS.map((em) => (
            <button key={em} type="button" role="radio" aria-checked={emoji === em}
              className={emoji === em ? 'is-on' : ''} onClick={() => setEmoji(em)}>{em}</button>
          ))}
        </div>
        <textarea className="field" rows={3} maxLength={240} value={text} onChange={(e) => setText(e.target.value)}
          placeholder="Bir ömür boyu mutluluklar…" />
        <div className="wishes__row">
          <input className="field" placeholder="Adın" maxLength={40} value={name} onChange={(e) => setName(e.target.value)} />
          <button type="submit" className="btn btn--solid" disabled={busy}>{busy ? 'Gönderiliyor…' : 'Gönder'}</button>
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
              {admin && <button type="button" className="wish__del" onClick={() => remove(w)} aria-label="Dileği sil">×</button>}
            </figure>
          ))}
        </div>
      )}
      {wishes?.length > shown && (
        <button type="button" className="btn btn--line wishes__more" onClick={() => setShown((n) => n + PAGE)}>Daha fazla dilek</button>
      )}
    </Section>
  )
}
