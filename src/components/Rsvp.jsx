import { useEffect, useState } from 'react'
import { useSite } from '../site'
import { sendRsvp, rememberCode, guestLink } from '../guests'
import Section from './Section'
import Qr from './Qr'

// Katılım bildirimi (LCV): kişiye özel linkle gelen misafir adıyla karşılanır
export default function Rsvp({ guest, onGuest, notify }) {
  const config = useSite()
  const [editing, setEditing] = useState(!guest?.rsvp)
  const [status, setStatus] = useState(guest?.rsvp?.status || '')
  const [count, setCount] = useState(guest?.rsvp?.count || 1)
  const [name, setName] = useState('')
  const [note, setNote] = useState(guest?.rsvp?.note || '')
  const [busy, setBusy] = useState(false)
  const max = guest?.seats || 10

  // Misafir bilgisi sonradan yüklenirse formu ona göre doldur
  useEffect(() => {
    setEditing(!guest?.rsvp)
    setStatus(guest?.rsvp?.status || '')
    setCount(guest?.rsvp?.count || Math.min(guest?.seats || 1, 2))
    setNote(guest?.rsvp?.note || '')
  }, [guest?.id])

  const submit = async (e) => {
    e.preventDefault()
    if (!status) return notify('Lütfen gelip gelemeyeceğinizi seçin')
    setBusy(true)
    try {
      const next = await sendRsvp({ g: guest?.id, name, status, count, note })
      rememberCode(next.id)
      onGuest(next)
      setEditing(false)
      notify(status === 'yes' ? 'Harika! Sizi bekliyoruz 💐' : 'Bildiriminiz alındı, teşekkürler 🤍')
    } catch (err) {
      notify(err.message)
    } finally {
      setBusy(false)
    }
  }

  const yes = guest?.rsvp?.status === 'yes'

  return (
    <Section id="lcv" className="rsvp">
      <p className="kicker">Lütfen bildirin</p>
      <h2 className="heading">Katılım <em>durumu</em></h2>
      <p className="rsvp__lead">
        {guest ? <>Sevgili <b>{guest.name}</b>, </> : null}
        {config.rsvpDeadline
          ? <>hazırlıklarımızı planlayabilmemiz için <b>{config.rsvpDeadline}</b> tarihine kadar bildirmenizi rica ederiz.</>
          : <>hazırlıklarımızı planlayabilmemiz için katılım durumunuzu bildirmenizi rica ederiz.</>}
      </p>

      {guest?.rsvp && !editing ? (
        <div className="rsvp__done">
          <span className="rsvp__icon" aria-hidden="true">{yes ? '💐' : '🤍'}</span>
          <p className="rsvp__title">{yes ? 'Sizi bekliyoruz!' : 'Yokluğunuzu hissedeceğiz'}</p>
          <p className="rsvp__sub">
            {yes ? `${guest.rsvp.count} kişi olarak katılacağınızı bildirdiniz.` : 'Katılamayacağınızı bildirdiniz. Dualarınız yeter.'}
          </p>

          {yes && (
            <div className="ticket">
              <div className="ticket__info">
                <span className="ticket__label">Giriş kartınız</span>
                <strong>{guest.name}</strong>
                <span>{guest.rsvp.count} kişi{guest.table ? '' : ' · Masa bilgisi yakında'}</span>
                {guest.table && <span className="ticket__table">Masa <b>{guest.table}</b></span>}
              </div>
              <Qr className="ticket__qr" text={guestLink(guest.id)} size={116} alt="Giriş QR kodu" />
              <p className="ticket__hint">Girişte bu kodu görevliye gösterebilirsiniz</p>
            </div>
          )}

          <button type="button" className="btn btn--line" onClick={() => setEditing(true)}>Cevabımı değiştir</button>
        </div>
      ) : (
        <form className="rsvp__form" onSubmit={submit}>
          {!guest && (
            <label className="rsvp__field">
              <span>Adınız soyadınız</span>
              <input value={name} onChange={(e) => setName(e.target.value)} maxLength={80} autoComplete="name" required />
            </label>
          )}

          <div className="rsvp__choices" role="radiogroup" aria-label="Katılım durumu">
            <button type="button" role="radio" aria-checked={status === 'yes'}
              className={`rsvp__choice ${status === 'yes' ? 'is-on' : ''}`} onClick={() => setStatus('yes')}>
              <svg viewBox="0 0 32 30" aria-hidden="true"><path d="M16 28S2 19.5 2 10.2A7.2 7.2 0 0 1 16 7a7.2 7.2 0 0 1 14 3.2C30 19.5 16 28 16 28Z" /></svg>
              <b>Geliyorum</b>
              <small>Seve seve!</small>
            </button>
            <button type="button" role="radio" aria-checked={status === 'no'}
              className={`rsvp__choice ${status === 'no' ? 'is-on' : ''}`} onClick={() => setStatus('no')}>
              <svg viewBox="0 0 32 30" aria-hidden="true"><path d="M16 28S2 19.5 2 10.2A7.2 7.2 0 0 1 16 7a7.2 7.2 0 0 1 14 3.2C30 19.5 16 28 16 28Z" /><path d="M17 8l-3 7 4 2-3 8" /></svg>
              <b>Gelemiyorum</b>
              <small>Maalesef</small>
            </button>
          </div>

          {status === 'yes' && (
            <div className="rsvp__count">
              <span>Kaç kişi geleceksiniz?</span>
              <div className="stepper">
                <button type="button" aria-label="Azalt" disabled={count <= 1} onClick={() => setCount((c) => Math.max(1, c - 1))}>−</button>
                <b>{count}</b>
                <button type="button" aria-label="Artır" disabled={count >= max} onClick={() => setCount((c) => Math.min(max, c + 1))}>+</button>
              </div>
              {guest && guest.seats > 1 && <small>Davetiniz {guest.seats} kişiliktir</small>}
            </div>
          )}

          <label className="rsvp__field">
            <span>Bize bir notunuz var mı? <i>(isteğe bağlı)</i></span>
            <textarea rows={2} value={note} onChange={(e) => setNote(e.target.value)} maxLength={300} />
          </label>

          <button type="submit" className="btn btn--solid rsvp__send" disabled={busy || !status}>
            {busy ? 'Gönderiliyor…' : 'Gönder'}
          </button>
          {guest?.rsvp && (
            <button type="button" className="alink rsvp__cancel" onClick={() => setEditing(false)}>Vazgeç</button>
          )}
        </form>
      )}
    </Section>
  )
}
