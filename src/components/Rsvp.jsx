import { useEffect, useState } from 'react'
import { useSite } from '../site'
import { sendRsvp, rememberCode, guestLink } from '../guests'
import Section from './Section'
import Qr from './Qr'
import Confetti from './Confetti'
import TableMap from './TableMap'
import { t } from '../i18n'

// Katılım bildirimi (LCV): kişiye özel linkle gelen misafir adıyla karşılanır
export default function Rsvp({ guest, onGuest, notify }) {
  const config = useSite()
  const [editing, setEditing] = useState(!guest?.rsvp)
  const [status, setStatus] = useState(guest?.rsvp?.status || '')
  const [count, setCount] = useState(guest?.rsvp?.count || 1)
  const [name, setName] = useState('')
  const [note, setNote] = useState(guest?.rsvp?.note || '')
  const [song, setSong] = useState(guest?.rsvp?.song || '')
  const [busy, setBusy] = useState(false)
  const [burst, setBurst] = useState(0)
  const max = guest?.seats || 10

  // Misafir bilgisi sonradan yüklenirse formu ona göre doldur
  useEffect(() => {
    setEditing(!guest?.rsvp)
    setStatus(guest?.rsvp?.status || '')
    setCount(guest?.rsvp?.count || Math.min(guest?.seats || 1, 2))
    setNote(guest?.rsvp?.note || '')
    setSong(guest?.rsvp?.song || '')
  }, [guest?.id])

  const submit = async (e) => {
    e.preventDefault()
    if (!status) return notify(t('Lütfen gelip gelemeyeceğinizi seçin', 'Please choose whether you can come'))
    setBusy(true)
    try {
      const next = await sendRsvp({ g: guest?.id, name, status, count, note, song })
      rememberCode(next.id)
      onGuest(next)
      setEditing(false)
      if (status === 'yes') setBurst((b) => b + 1)
      notify(status === 'yes' ? t('Harika! Sizi bekliyoruz 💐', 'Wonderful! We can\'t wait to see you 💐') : t('Bildiriminiz alındı, teşekkürler 🤍', 'Got it, thank you 🤍'))
    } catch (err) {
      notify(err.message)
    } finally {
      setBusy(false)
    }
  }

  const yes = guest?.rsvp?.status === 'yes'

  return (
    <Section id="lcv" className="rsvp">
      <Confetti burst={burst} />
      <p className="kicker">{t('Lütfen bildirin', 'Kindly reply')}</p>
      <h2 className="heading">{t(<>Katılım <em>durumu</em></>, <>Will you <em>join us</em>?</>)}</h2>
      <p className="rsvp__lead">
        {guest ? <>{t('Sevgili', 'Dear')} <b>{guest.name}</b>, </> : null}
        {config.rsvpDeadline
          ? t(<>hazırlıklarımızı planlayabilmemiz için <b>{config.rsvpDeadline}</b> tarihine kadar bildirmenizi rica ederiz.</>, <>to help us plan, please let us know by <b>{config.rsvpDeadline}</b>.</>)
          : t(<>hazırlıklarımızı planlayabilmemiz için katılım durumunuzu bildirmenizi rica ederiz.</>, <>to help us plan, please let us know if you can join us.</>)}
      </p>

      {guest?.rsvp && !editing ? (
        <div className="rsvp__done">
          <span className="rsvp__icon" aria-hidden="true">{yes ? '💐' : '🤍'}</span>
          <p className="rsvp__title">{yes ? t('Sizi bekliyoruz!', 'See you there!') : t('Yokluğunuzu hissedeceğiz', 'We will miss you')}</p>
          <p className="rsvp__sub">
            {yes ? t(`${guest.rsvp.count} kişi olarak katılacağınızı bildirdiniz.`, `You're coming as ${guest.rsvp.count} ${guest.rsvp.count > 1 ? 'people' : 'person'}.`) : t('Katılamayacağınızı bildirdiniz. Dualarınız yeter.', 'You let us know you can\'t make it. Your good wishes are enough.')}
          </p>
          {yes && guest.rsvp.song && <p className="rsvp__songdone">🎵 {t('Şarkı isteğiniz DJ\'e iletildi:', 'Your song request went to the DJ:')} <b>{guest.rsvp.song}</b></p>}

          {yes && (
            <div className="ticket">
              <div className="ticket__info">
                <span className="ticket__label">{t('Giriş kartınız', 'Your entry card')}</span>
                <strong>{guest.name}</strong>
                <span>{guest.rsvp.count} {t('kişi', guest.rsvp.count > 1 ? 'guests' : 'guest')}{guest.table ? '' : t(' · Masa bilgisi yakında', ' · Table coming soon')}</span>
                {guest.table && <span className="ticket__table">{t('Masa', 'Table')} <b>{guest.table}</b></span>}
              </div>
              <Qr className="ticket__qr" text={guestLink(guest.id)} size={116} alt={t('Giriş QR kodu', 'Entry QR code')} />
              <p className="ticket__hint">{t('Girişte bu kodu görevliye gösterebilirsiniz', 'Show this code at the entrance')}</p>
            </div>
          )}
          {yes && <TableMap tables={guest.tables} mine={guest.table} />}

          <button type="button" className="btn btn--line" onClick={() => setEditing(true)}>{t('Cevabımı değiştir', 'Change my answer')}</button>
        </div>
      ) : (
        <form className="rsvp__form" onSubmit={submit}>
          {!guest && (
            <label className="rsvp__field">
              <span>{t('Adınız soyadınız', 'Your full name')}</span>
              <input value={name} onChange={(e) => setName(e.target.value)} maxLength={80} autoComplete="name" required />
            </label>
          )}

          <div className="rsvp__choices" role="radiogroup" aria-label={t('Katılım durumu', 'Attendance')}>
            <button type="button" role="radio" aria-checked={status === 'yes'}
              className={`rsvp__choice ${status === 'yes' ? 'is-on' : ''}`} onClick={() => setStatus('yes')}>
              <svg viewBox="0 0 32 30" aria-hidden="true"><path d="M16 28S2 19.5 2 10.2A7.2 7.2 0 0 1 16 7a7.2 7.2 0 0 1 14 3.2C30 19.5 16 28 16 28Z" /></svg>
              <b>{t('Geliyorum', 'I\'ll be there')}</b>
              <small>{t('Seve seve!', 'With pleasure!')}</small>
            </button>
            <button type="button" role="radio" aria-checked={status === 'no'}
              className={`rsvp__choice ${status === 'no' ? 'is-on' : ''}`} onClick={() => setStatus('no')}>
              <svg viewBox="0 0 32 30" aria-hidden="true"><path d="M16 28S2 19.5 2 10.2A7.2 7.2 0 0 1 16 7a7.2 7.2 0 0 1 14 3.2C30 19.5 16 28 16 28Z" /><path d="M17 8l-3 7 4 2-3 8" /></svg>
              <b>{t('Gelemiyorum', 'Can\'t make it')}</b>
              <small>{t('Maalesef', 'Sadly')}</small>
            </button>
          </div>

          {status === 'yes' && (
            <div className="rsvp__count">
              <span>{t('Kaç kişi geleceksiniz?', 'How many of you?')}</span>
              <div className="stepper">
                <button type="button" aria-label={t('Azalt', 'Fewer')} disabled={count <= 1} onClick={() => setCount((c) => Math.max(1, c - 1))}>−</button>
                <b>{count}</b>
                <button type="button" aria-label={t('Artır', 'More')} disabled={count >= max} onClick={() => setCount((c) => Math.min(max, c + 1))}>+</button>
              </div>
              {guest && guest.seats > 1 && <small>{t(`Davetiniz ${guest.seats} kişiliktir`, `Your invitation is for ${guest.seats}`)}</small>}
            </div>
          )}

          {status === 'yes' && (
            <label className="rsvp__field rsvp__song">
              <span>🎵 {t('DJ\'e şarkı isteğin', 'Song request for the DJ')} <i>{t('(isteğe bağlı)', '(optional)')}</i></span>
              <input value={song} onChange={(e) => setSong(e.target.value)} maxLength={120}
                placeholder={t('Ör. Tarkan – Kuzu Kuzu', 'e.g. Ed Sheeran – Perfect')} />
            </label>
          )}

          <label className="rsvp__field">
            <span>{t('Bize bir notunuz var mı?', 'A note for us?')} <i>{t('(isteğe bağlı)', '(optional)')}</i></span>
            <textarea rows={2} value={note} onChange={(e) => setNote(e.target.value)} maxLength={300} />
          </label>

          <button type="submit" className="btn btn--solid rsvp__send" disabled={busy || !status}>
            {busy ? t('Gönderiliyor…', 'Sending…') : t('Gönder', 'Send')}
          </button>
          {guest?.rsvp && (
            <button type="button" className="alink rsvp__cancel" onClick={() => setEditing(false)}>{t('Vazgeç', 'Cancel')}</button>
          )}
        </form>
      )}
    </Section>
  )
}
