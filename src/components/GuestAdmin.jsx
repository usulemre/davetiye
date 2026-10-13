import { Suspense, lazy, useEffect, useMemo, useState } from 'react'
import { guestsApi, guestLink, parseGuestLines, statusOf } from '../guests'
import { copyText } from '../hooks'
import { formatDate } from '../date'
import Qr from './Qr'
import { PrintButtons } from './AdminExtras'
import Safe from './Safe'

const Hall3D = lazy(() => import('./Hall3D'))

const SIDES = [['', 'Ortak'], ['damat', 'Damat tarafı'], ['gelin', 'Gelin tarafı']]
const STATUS = { yes: 'Geliyor', no: 'Gelmiyor', wait: 'Cevap yok' }
const clock = (ts) => new Date(ts).toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit', timeZone: 'Europe/Istanbul' })
const norm = (s) => String(s || '').toLocaleLowerCase('tr')
const byTable = (a, b) => a.localeCompare(b, 'tr', { numeric: true })

// Davetli listesi bütün sekmelerde ortak: bir kez yüklenir, değişiklikler anında kaydedilir
export function useGuests(adminKey, notify) {
  const api = useMemo(() => guestsApi(adminKey), [adminKey])
  const [guests, setGuests] = useState(null)

  const load = () => api.list().then(setGuests).catch((err) => { notify(err.message); setGuests([]) })
  useEffect(() => { load() }, [api])

  const run = async (fn, message) => {
    try {
      const out = await fn()
      if (message) notify(message)
      return out
    } catch (err) {
      notify(err.message)
      return null
    }
  }

  return {
    guests,
    reload: load,
    add: (list) => run(async () => {
      const created = await api.add(list)
      setGuests((g) => [...(g || []), ...created])
      return created
    }),
    update: (patch, message) => run(async () => {
      const next = await api.update(patch)
      setGuests((g) => g.map((x) => (x.id === next.id ? next : x)))
      return next
    }, message),
    remove: (id) => run(async () => {
      await api.remove(id)
      setGuests((g) => g.filter((x) => x.id !== id))
    }, 'Silindi'),
  }
}

function summary(guests) {
  const s = { invited: guests.length, seats: 0, yes: 0, yesPeople: 0, no: 0, wait: 0, inPeople: 0, inCount: 0 }
  for (const g of guests) {
    s.seats += g.seats
    const st = statusOf(g)
    s[st] += 1
    if (st === 'yes') s.yesPeople += g.rsvp.count
    if (g.checkedIn) {
      s.inCount += 1
      s.inPeople += st === 'yes' ? g.rsvp.count : g.seats
    }
  }
  return s
}

function whatsappText(site, g, reminder) {
  const d = formatDate(site.start)
  const couple = `${site.groom.first} & ${site.bride.first}`
  if (reminder) {
    return `Merhaba ${g.name} 🤍\n\n${couple} düğününe katılıp katılamayacağınızı henüz öğrenemedik. Aşağıdaki linkten birkaç saniyede bildirebilirsiniz:\n\n${guestLink(g.id)}`
  }
  return `Merhaba ${g.name} 🤍\n\n${couple} olarak ${d.day} ${d.monthName} ${d.year} ${d.weekday} günü ${site.venue.name}'da evleniyoruz ve sizi de aramızda görmek istiyoruz 💍\n\nDavetiyeniz ve katılım bildirimi için:\n${guestLink(g.id)}`
}

// wa.me kısa linki yönlendirirken emojileri bozuyor (🤍 → �); doğrudan api.whatsapp.com kullanılır
export const waUrl = (phone, text) => `https://api.whatsapp.com/send?${phone ? `phone=${phone}&` : ''}text=${encodeURIComponent(text)}`

function downloadCsv(guests) {
  const head = ['Ad Soyad', 'Telefon', 'Taraf', 'Davet (kişi)', 'Durum', 'Gelecek kişi', 'Masa', 'Not', 'Şarkı isteği', 'Giriş', 'Kişiye özel link']
  const rows = guests.map((g) => [
    g.name, g.phone, SIDES.find(([k]) => k === g.side)?.[1] || '', g.seats, STATUS[statusOf(g)],
    g.rsvp?.count ?? '', g.table, g.rsvp?.note || '', g.rsvp?.song || '', g.checkedIn ? clock(g.checkedIn) : '', guestLink(g.id),
  ])
  const csv = [head, ...rows].map((r) => r.map((v) => `"${String(v ?? '').replace(/"/g, '""')}"`).join(';')).join('\r\n')
  const a = document.createElement('a')
  a.href = URL.createObjectURL(new Blob(['﻿' + csv], { type: 'text/csv;charset=utf-8' }))
  a.download = 'davetliler.csv'
  a.click()
  URL.revokeObjectURL(a.href)
}

function Stats({ s, gate }) {
  const items = gate
    ? [['Giren kişi', s.inPeople], ['Beklenen kişi', s.yesPeople], ['Giren davet', `${s.inCount}/${s.yes}`]]
    : [['Davet', s.invited], ['Gelecek kişi', s.yesPeople], ['Gelmiyor', s.no], ['Cevap yok', s.wait]]
  return (
    <div className="gstats">
      {items.map(([label, value]) => (
        <div key={label}><b>{value}</b><span>{label}</span></div>
      ))}
    </div>
  )
}

function StatusChip({ g }) {
  const st = statusOf(g)
  return (
    <span className={`gchip gchip--${st}`}>
      {st === 'yes' ? `✓ ${g.rsvp.count} kişi geliyor` : st === 'no' ? '✗ Gelmiyor' : '⏳ Cevap yok'}
    </span>
  )
}

// ---------- Davetliler ----------
export function GuestList({ store, site, notify }) {
  const { guests } = store
  const [filter, setFilter] = useState('all')
  const [q, setQ] = useState('')
  const [open, setOpen] = useState(null)
  const [bulk, setBulk] = useState(false)
  const [adding, setAdding] = useState(false)
  const [sending, setSending] = useState(null)

  if (!guests) return <p className="ahint">Yükleniyor…</p>
  const toInvite = guests.filter((g) => !g.sentAt && g.source !== 'site')
  const toRemind = guests.filter((g) => g.sentAt && statusOf(g) === 'wait')
  const s = summary(guests)
  const shown = guests
    .filter((g) => filter === 'all' || statusOf(g) === filter)
    .filter((g) => !q || norm(g.name).includes(norm(q)) || g.phone.includes(q.replace(/\D/g, '') || '§'))

  return (
    <>
      <p className="ahint">Bu sekmedeki değişiklikler anında kaydedilir. Her davetlinin kişiye özel linki olur: misafir linki açınca adıyla karşılanır, tek dokunuşla katılımını bildirir.</p>
      <Stats s={s} />

      {adding || !guests.length ? (
        <AddGuest store={store} notify={notify} bulk={bulk} setBulk={setBulk} onClose={guests.length ? () => setAdding(false) : null} />
      ) : (
        <button type="button" className="abtn abtn--block gadd__open" onClick={() => setAdding(true)}>+ Davetli ekle</button>
      )}

      {(toInvite.length > 0 || toRemind.length > 0) && !sending && (
        <div className="gsendbar">
          {toInvite.length > 0 && <button type="button" className="abtn" onClick={() => setSending('invite')}>📨 Sırayla davet gönder ({toInvite.length})</button>}
          {toRemind.length > 0 && <button type="button" className="abtn abtn--ghost" onClick={() => setSending('remind')}>🔔 Cevap vermeyenlere hatırlat ({toRemind.length})</button>}
        </div>
      )}
      {sending && (
        <SendFlow key={sending} list={sending === 'invite' ? toInvite : toRemind} reminder={sending === 'remind'}
          site={site} store={store} onClose={() => setSending(null)} />
      )}

      <div className="gtools">
        <input className="gsearch" placeholder="İsim ya da telefon ara" value={q} onChange={(e) => setQ(e.target.value)} />
        <div className="gfilters">
          {[['all', `Hepsi ${s.invited}`], ['yes', `Geliyor ${s.yes}`], ['no', `Gelmiyor ${s.no}`], ['wait', `Cevap yok ${s.wait}`]].map(([k, label]) => (
            <button key={k} type="button" className={filter === k ? 'is-active' : ''} onClick={() => setFilter(k)}>{label}</button>
          ))}
        </div>
      </div>

      {shown.length === 0 && <p className="ahint">{guests.length ? 'Eşleşen davetli yok.' : 'Henüz davetli eklenmedi.'}</p>}
      <ul className="glist">
        {shown.map((g) => (
          <li key={g.id} className="gitem">
            <button type="button" className="gitem__main" onClick={() => setOpen(open === g.id ? null : g.id)}>
              <span className="gitem__name">{g.name}</span>
              <span className="gitem__meta">
                {g.seats} kişilik{g.table && ` · Masa ${g.table}`}{g.side && ` · ${g.side === 'damat' ? 'Damat' : 'Gelin'}`}{g.source === 'site' && ' · Siteden'}
              </span>
              <StatusChip g={g} />
              {g.rsvp?.note && <span className="gitem__note">“{g.rsvp.note}”</span>}
              {g.rsvp?.song && <span className="gitem__note">🎵 {g.rsvp.song}</span>}
            </button>
            <div className="gitem__acts">
              <a className="gbtn gbtn--wa" target="_blank" rel="noreferrer"
                href={waUrl(g.phone, whatsappText(site, g, statusOf(g) === 'wait' && g.sentAt))}
                onClick={() => !g.sentAt && store.update({ id: g.id, sentAt: true })}>
                {statusOf(g) === 'wait' && g.sentAt ? 'Hatırlat' : 'WhatsApp'}
              </a>
              <button type="button" className="gbtn"
                onClick={async () => notify((await copyText(guestLink(g.id))) ? 'Kişiye özel link kopyalandı 🔗' : 'Kopyalanamadı')}>
                Link
              </button>
            </div>
            {open === g.id && <EditGuest g={g} store={store} onDone={() => setOpen(null)} />}
          </li>
        ))}
      </ul>

      {guests.length > 0 && (
        <button type="button" className="abtn abtn--ghost abtn--block" onClick={() => downloadCsv(guests)}>
          Listeyi Excel olarak indir
        </button>
      )}
    </>
  )
}

// Davetleri sırayla gönderme: her davetli için tek dokunuşla WhatsApp, sonra sıradaki
function SendFlow({ list, reminder, site, store, onClose }) {
  const [queue] = useState(list)
  const [i, setI] = useState(0)
  const [sent, setSent] = useState(0)
  const g = queue[i]

  if (!g) {
    return (
      <section className="agroup gsend gsend--done">
        <p className="gsend__big">🎉</p>
        <h4>{sent} {reminder ? 'hatırlatma' : 'davet'} gönderildi</h4>
        <p className="ahint">Cevap verenler listede kendiliğinden "Geliyor" ya da "Gelmiyor" olarak görünecek.</p>
        <button type="button" className="abtn abtn--block" onClick={onClose}>Tamam</button>
      </section>
    )
  }

  const text = whatsappText(site, g, reminder)
  const next = () => setI((n) => n + 1)
  return (
    <section className="agroup gsend">
      <div className="gsend__top">
        <h4>{reminder ? 'Hatırlatma' : 'Davet'} gönderiliyor · {i + 1}/{queue.length}</h4>
        <button type="button" className="admin__icon" onClick={onClose} aria-label="Kapat">×</button>
      </div>
      <div className="gsend__bar"><i style={{ width: `${(i / queue.length) * 100}%` }} /></div>
      <p className="gsend__name">{g.name}</p>
      <p className="gsend__phone">{g.phone ? `+${g.phone}` : 'Telefon yok: WhatsApp açılınca kişiyi kendin seçeceksin'}</p>
      <pre className="gsend__msg">{text}</pre>
      <a className="abtn abtn--block gsend__wa" href={waUrl(g.phone, text)} target="_blank" rel="noreferrer"
        onClick={() => {
          if (!g.sentAt) store.update({ id: g.id, sentAt: true })
          setSent((n) => n + 1)
          setTimeout(next, 400)
        }}>
        WhatsApp'ta gönder →
      </a>
      <div className="gsend__row">
        <button type="button" className="alink" disabled={i === 0} onClick={() => setI((n) => Math.max(0, n - 1))}>‹ Önceki</button>
        <button type="button" className="alink" onClick={next}>Bunu atla ›</button>
      </div>
      <p className="ahint">WhatsApp'ta mesajı gönderip bu sayfaya geri dön; sıradaki kişi hazır olacak.</p>
    </section>
  )
}

function AddGuest({ store, notify, bulk, setBulk, onClose }) {
  const blank = { name: '', phone: '', seats: 2, side: '', table: '' }
  const [g, setG] = useState(blank)
  const [text, setText] = useState('')
  const [busy, setBusy] = useState(false)
  const parsed = bulk ? parseGuestLines(text) : []
  const canPick = typeof navigator !== 'undefined' && 'contacts' in navigator && 'select' in (navigator.contacts || {})

  // Telefon rehberinden seç (Android Chrome); seçilenler toplu listeye yazılır, kontrol edip eklersin
  const pick = async () => {
    try {
      const list = await navigator.contacts.select(['name', 'tel'], { multiple: true })
      const lines = list.map((c) => [c.name?.[0], c.tel?.[0]].filter(Boolean).join(', ')).filter(Boolean)
      if (!lines.length) return
      setBulk(true)
      setText((t) => [t.trim(), ...lines].filter(Boolean).join('\n'))
      notify(`${lines.length} kişi listeye yazıldı, kişi sayılarını kontrol edip ekle`)
    } catch {
      // rehber penceresi kapatıldı
    }
  }

  const submit = async (e) => {
    e.preventDefault()
    setBusy(true)
    const created = await store.add(bulk ? parsed : [g])
    setBusy(false)
    if (!created) return
    notify(`${created.length} davetli eklendi ✓`)
    if (bulk) setText('')
    else setG({ ...blank, side: g.side })
    if (bulk) onClose?.()
  }

  return (
    <form className="agroup gadd" onSubmit={submit}>
      <div className="gadd__head">
        <h4>Davetli ekle</h4>
        <button type="button" className="alink" onClick={() => setBulk(!bulk)}>{bulk ? 'Tek tek ekle' : 'Toplu ekle (Excel / liste)'}</button>
        {canPick && <button type="button" className="alink" onClick={pick}>📇 Rehberden seç</button>}
        {onClose && <button type="button" className="admin__icon gadd__x" onClick={onClose} aria-label="Kapat">×</button>}
      </div>
      {bulk ? (
        <>
          <p className="ahint">Her satıra bir davetli yazın ya da Excel'den sütunları kopyalayıp yapıştırın: <b>Ad Soyad, Telefon, Kişi sayısı, Masa</b>. Sadece ad da yeterli.</p>
          <textarea className="gbulk" rows={6} value={text} onChange={(e) => setText(e.target.value)}
            placeholder={'Ayşe Yılmaz, 0532 111 22 33, 2\nMehmet Demir, 0555 444 55 66, 4, 3\nZeynep Kaya'} />
          <button type="submit" className="abtn abtn--block" disabled={busy || !parsed.length}>
            {busy ? 'Ekleniyor…' : `${parsed.length} davetliyi ekle`}
          </button>
        </>
      ) : (
        <>
          <div className="afield-row">
            <label className="afield"><span>Ad Soyad</span><input value={g.name} onChange={(e) => setG({ ...g, name: e.target.value })} required /></label>
            <label className="afield"><span>Telefon</span><input type="tel" inputMode="tel" placeholder="05xx" value={g.phone} onChange={(e) => setG({ ...g, phone: e.target.value })} /></label>
          </div>
          <div className="afield-row afield-row--3">
            <label className="afield"><span>Kişi</span><input type="number" min="1" max="20" value={g.seats} onChange={(e) => setG({ ...g, seats: e.target.value })} /></label>
            <label className="afield"><span>Masa</span><input value={g.table} onChange={(e) => setG({ ...g, table: e.target.value })} /></label>
            <label className="afield"><span>Taraf</span>
              <select value={g.side} onChange={(e) => setG({ ...g, side: e.target.value })}>
                {SIDES.map(([k, l]) => <option key={k} value={k}>{l}</option>)}
              </select>
            </label>
          </div>
          <button type="submit" className="abtn abtn--block" disabled={busy || !g.name.trim()}>{busy ? 'Ekleniyor…' : '+ Ekle'}</button>
        </>
      )}
    </form>
  )
}

function EditGuest({ g, store, onDone }) {
  const [d, setD] = useState({ name: g.name, phone: g.phone, seats: g.seats, table: g.table, side: g.side })
  const save = async () => { if (await store.update({ id: g.id, ...d }, 'Kaydedildi ✓')) onDone() }
  const setRsvp = (status) => store.update({ id: g.id, rsvp: status ? { status, count: g.rsvp?.count || g.seats, note: g.rsvp?.note, song: g.rsvp?.song } : null }, 'Durum güncellendi ✓')
  return (
    <div className="gedit">
      <div className="afield-row">
        <label className="afield"><span>Ad Soyad</span><input value={d.name} onChange={(e) => setD({ ...d, name: e.target.value })} /></label>
        <label className="afield"><span>Telefon</span><input type="tel" value={d.phone} onChange={(e) => setD({ ...d, phone: e.target.value })} /></label>
      </div>
      <div className="afield-row afield-row--3">
        <label className="afield"><span>Kişi</span><input type="number" min="1" max="20" value={d.seats} onChange={(e) => setD({ ...d, seats: e.target.value })} /></label>
        <label className="afield"><span>Masa</span><input value={d.table} onChange={(e) => setD({ ...d, table: e.target.value })} /></label>
        <label className="afield"><span>Taraf</span>
          <select value={d.side} onChange={(e) => setD({ ...d, side: e.target.value })}>
            {SIDES.map(([k, l]) => <option key={k} value={k}>{l}</option>)}
          </select>
        </label>
      </div>
      <p className="ahint">Telefonla cevap verdiyse durumunu buradan işaretleyebilirsin:</p>
      <div className="gfilters">
        <button type="button" className={statusOf(g) === 'yes' ? 'is-active' : ''} onClick={() => setRsvp('yes')}>Geliyor</button>
        <button type="button" className={statusOf(g) === 'no' ? 'is-active' : ''} onClick={() => setRsvp('no')}>Gelmiyor</button>
        <button type="button" className={statusOf(g) === 'wait' ? 'is-active' : ''} onClick={() => setRsvp(null)}>Cevap yok</button>
      </div>
      <div className="gedit__foot">
        <button type="button" className="alink alink--danger"
          onClick={() => window.confirm(`${g.name} listeden silinsin mi?`) && store.remove(g.id)}>Davetliyi sil</button>
        <button type="button" className="abtn" onClick={save}>Kaydet</button>
      </div>
    </div>
  )
}

// ---------- Masa planı ----------
const CHAIRS = 10
const PALETTE = ['#d8a39d', '#a3b29a', '#c9a46c', '#a99bc4', '#8fb3c9', '#d4a5bf', '#b9a58f']
const headcount = (g) => (statusOf(g) === 'yes' ? g.rsvp.count : g.seats)
const total = (list) => list.reduce((n, g) => n + headcount(g), 0)
const initial = (name) => name.trim().charAt(0).toLocaleUpperCase('tr')

const SIDE_ORDER = ['damat', 'gelin', '']
const SIDE_NAME = { damat: 'Damat tarafı', gelin: 'Gelin tarafı', '': 'Ortak' }

// Masa çoğunlukla hangi taraftan oluşuyor (boşsa null)
function tableSide(list) {
  const n = {}
  for (const g of list) n[g.side || ''] = (n[g.side || ''] || 0) + headcount(g)
  const best = Object.entries(n).sort((a, b) => b[1] - a[1])[0]
  return best ? best[0] : null
}

// Masasız misafirleri taraflarına göre grupla, aileleri bölmeden boş yerlere dağıt
function autoPlan(groups, tableNames) {
  const names = [...tableNames]
  const load = {}
  const side = {}
  for (const t of names) {
    load[t] = total(groups[t] || [])
    side[t] = tableSide(groups[t] || [])
  }
  let next = Math.max(0, ...names.map(Number).filter(Number.isFinite)) + 1
  const moves = []
  for (const sd of SIDE_ORDER) {
    const list = (groups[''] || []).filter((g) => (g.side || '') === sd).sort((a, b) => headcount(b) - headcount(a))
    for (const g of list) {
      const h = headcount(g)
      const fits = (t) => load[t] + h <= CHAIRS
      let t = names.find((t) => (side[t] === sd || side[t] === null) && fits(t))
      if (!t && sd === '') t = names.find(fits)
      if (!t) {
        t = String(next++)
        names.push(t)
        load[t] = 0
        side[t] = null
      }
      load[t] += h
      if (side[t] === null) side[t] = sd
      moves.push([g, t])
    }
  }
  return moves
}

export function Tables({ store, notify, site }) {
  const { guests } = store
  const [sel, setSel] = useState(null)
  const [extra, setExtra] = useState([])
  const [real, setReal] = useState(true)
  const [busy, setBusy] = useState(false)
  if (!guests) return <p className="ahint">Yükleniyor…</p>

  const active = guests.filter((g) => statusOf(g) !== 'no')
  const groups = {}
  for (const g of active) (groups[g.table || ''] ||= []).push(g)
  const names = [...new Set([...Object.keys(groups).filter(Boolean), ...extra])].sort(byTable)
  const free = groups[''] || []
  const nextTable = String(Math.max(0, ...names.map(Number).filter(Number.isFinite)) + 1)
  const move = (g, table) => store.update({ id: g.id, table }, table ? `${g.name} → Masa ${table}` : `${g.name} masadan kaldırıldı`)
  const addTable = () => { setExtra((x) => [...x, nextTable]); setSel(nextTable) }

  if (!active.length) return <p className="ahint">Henüz davetli yok. "Davetliler" sekmesinden ekleyebilirsin.</p>

  const selList = sel ? groups[sel] || [] : []

  const autoSeat = async () => {
    const moves = autoPlan(groups, names)
    const opened = new Set(moves.map(([, t]) => t).filter((t) => !names.includes(t))).size
    const msg = `${moves.length} misafir (${total(moves.map(([g]) => g))} kişi) damat ve gelin tarafına göre masalara yerleştirilecek` +
      `${opened ? `, ${opened} yeni masa açılacak` : ''}. Aileler bölünmez. Devam edilsin mi?`
    if (!window.confirm(msg)) return
    setBusy(true)
    let ok = 0
    for (const [g, t] of moves) if (await store.update({ id: g.id, table: t })) ok++
    setBusy(false)
    setExtra([])
    notify(`${ok} misafir masalara yerleştirildi ✓ İstediğin gibi düzeltebilirsin`)
  }

  return (
    <div className="tplanwrap">
      <div className="tsum">
        <span><b>{names.length}</b> masa</span>
        <span><b>{total(active) - total(free)}</b> kişi yerleşti</span>
        <span className={free.length ? 'is-warn' : 'is-ok'}>{free.length ? <><b>{total(free)}</b> kişi bekliyor</> : '✓ Herkes yerleşti'}</span>
      </div>
      {site && <PrintButtons guests={guests} site={site} />}

      <div className="tbar">
        {free.length > 0 && (
          <button type="button" className="tauto" disabled={busy} onClick={autoSeat}>
            <span aria-hidden="true">✨</span>{busy ? 'Yerleştiriliyor…' : 'Otomatik oturt'}
          </button>
        )}
        <div className="tview" role="group" aria-label="Görünüm">
          <button type="button" className={real ? 'is-on' : ''} onClick={() => setReal(true)}>3D</button>
          <button type="button" className={real ? '' : 'is-on'} onClick={() => setReal(false)}>Plan</button>
        </div>
      </div>

      {real ? (
        <div className="hallwrap">
          <Safe name="salon3d" fallback={<div className="hall hall--loading">3D salon bu cihazda açılamadı. Sağ üstten "Plan" görünümünü kullanabilirsin.</div>}>
          <Suspense fallback={<div className="hall hall--loading">3D salon hazırlanıyor…</div>}>
            <Hall3D selected={sel} onSelect={setSel} tables={names.map((t) => ({
              name: t,
              people: total(groups[t] || []),
              seats: (groups[t] || []).flatMap((g, gi) => Array.from({ length: headcount(g) }, (_, k) => ({
                color: PALETTE[gi % PALETTE.length], initial: k === 0 ? initial(g.name) : '',
              }))),
            }))} />
          </Suspense>
          </Safe>
          <p className="hall__hint">Parmağınla çevir, iki parmakla yakınlaştır, masaya dokunarak seç</p>
          <button type="button" className="hall__new" onClick={addTable}>+ Yeni masa</button>
        </div>
      ) : (
      <div className="tplan">
        <div className="tplan__stage">Sahne · Dans pisti</div>
        <div className="tplan__floor">
          {names.map((t) => (
            <button key={t} type="button" className={`ttable ${sel === t ? 'is-sel' : ''}`} onClick={() => setSel(sel === t ? null : t)}>
              <span className="ttable__shadow" aria-hidden="true" />
              <RoundTable no={t} list={groups[t] || []} />
              <span className="ttable__no"><small>Masa</small>{t}</span>
              <span className={`ttable__side ${total(groups[t] || []) > CHAIRS ? 'is-over' : ''}`}>
                {groups[t]?.length > 0 && `${SIDE_NAME[tableSide(groups[t])]} · `}{total(groups[t] || [])}/{CHAIRS}
              </span>
            </button>
          ))}
          <button type="button" className="ttable ttable--new" onClick={addTable}>
            <span>+</span>
            <small>Yeni masa</small>
          </button>
        </div>
      </div>
      )}

      {sel && (
        <section className="tdetail" key={sel}>
          <header>
            <div>
              <span className="tdetail__kicker">Seçili masa</span>
              <strong>Masa {sel}</strong>
            </div>
            <span className={`tdetail__pill ${total(selList) > CHAIRS ? 'is-over' : ''}`}>{total(selList)} / {CHAIRS}</span>
            <button type="button" className="admin__icon" onClick={() => setSel(null)} aria-label="Kapat">×</button>
          </header>
          {selList.length === 0 && <p className="tdetail__empty">Masa boş. Aşağıdaki misafirlere dokunarak bu masaya oturt.</p>}
          <ul>
            {selList.map((g, i) => (
              <li key={g.id}>
                <i className="tavatar" style={{ background: PALETTE[i % PALETTE.length] }}>{initial(g.name)}</i>
                <Person g={g} />
                <TablePick g={g} names={names} next={nextTable} onPick={move} label="Taşı" />
              </li>
            ))}
          </ul>
        </section>
      )}

      {free.length > 0 && (
        <section className="tfree">
          <h4>{sel ? `Masa ${sel}'e eklemek için dokun` : 'Masası belli olmayanlar'}</h4>
          {sel ? (
            <div className="tchips">
              {free.map((g) => (
                <button key={g.id} type="button" className="tchip" onClick={() => move(g, sel)}>
                  <i className="tavatar">{initial(g.name)}</i>
                  {g.name}
                  <small>{headcount(g)}</small>
                </button>
              ))}
            </div>
          ) : (
            <ul>
              {free.map((g) => (
                <li key={g.id}>
                  <i className="tavatar">{initial(g.name)}</i>
                  <Person g={g} />
                  <TablePick g={g} names={names} next={nextTable} onPick={move} label="Masa seç" />
                </li>
              ))}
            </ul>
          )}
        </section>
      )}
      {!sel && <p className="ahint tplan__tip">İpucu: Bir masaya dokun, sonra misafirlere dokunarak o masaya oturt.</p>}
    </div>
  )
}

// Yuvarlak masa (üstten görünüm): örtülü masa, masaya dönük sandalyeler, dolu yerlerde tabak ve kadeh
function RoundTable({ no, list }) {
  const seats = list.flatMap((g, gi) => Array.from({ length: headcount(g) }, (_, k) => ({ g, gi, first: k === 0 })))
  const chairs = Math.max(CHAIRS, seats.length)
  const at = (i, r) => {
    const a = (i / chairs) * Math.PI * 2 - Math.PI / 2
    return [70 + Math.cos(a) * r, 70 + Math.sin(a) * r, (a * 180) / Math.PI - 90]
  }
  return (
    <svg className="tround" viewBox="0 0 140 140" aria-label={`Masa ${no}, ${seats.length} kişi`}>
      {Array.from({ length: chairs }, (_, i) => {
        const [x, y, deg] = at(i, 53)
        const s = seats[i]
        return (
          <g key={i} className={`tchair ${s ? 'is-on' : ''} ${i >= CHAIRS ? 'is-over' : ''}`} style={{ '--i': i }}>
            <g transform={`translate(${x} ${y}) rotate(${deg})`}>
              <rect className="tchair__back" x="-8.5" y="5" width="17" height="4.5" rx="2.2" />
              <rect className="tchair__seat" x="-7.5" y="-7" width="15" height="13" rx="4"
                style={s ? { fill: PALETTE[s.gi % PALETTE.length] } : undefined} />
            </g>
            {s?.first && <text x={x} y={y + 3.2}>{initial(s.g.name)}</text>}
          </g>
        )
      })}
      <circle cx="70" cy="70" r="42" className="tround__drape" />
      <circle cx="70" cy="70" r="40" className="tround__top" />
      <circle cx="70" cy="70" r="36.5" className="tround__hem" />
      {seats.slice(0, chairs).map((_, i) => {
        const [x, y] = at(i, 31)
        const [gx, gy] = at(i + 0.32, 29)
        return (
          <g key={`p${i}`} className="tplate" style={{ '--i': i }}>
            <circle cx={x} cy={y} r="4.6" />
            <circle cx={x} cy={y} r="2.8" className="tplate__in" />
            <circle cx={gx} cy={gy} r="1.5" className="tplate__glass" />
          </g>
        )
      })}
      <g className="tround__flower" transform="translate(70 58)">
        <ellipse cx="-9" cy="6" rx="7" ry="3" transform="rotate(-25 -9 6)" className="leaf" />
        <ellipse cx="9" cy="6" rx="7" ry="3" transform="rotate(25 9 6)" className="leaf" />
        {[0, 72, 144, 216, 288].map((a) => <ellipse key={a} cx="0" cy="-5" rx="4" ry="6" transform={`rotate(${a})`} className="petal" />)}
        <circle r="2.8" className="heart" />
      </g>
    </svg>
  )
}

function Person({ g }) {
  const st = statusOf(g)
  return (
    <span className="tperson">
      <b>{g.name}</b>
      <small className={st === 'yes' ? 'is-yes' : ''}>{st === 'yes' ? `✓ ${g.rsvp.count} kişi geliyor` : `Cevap yok · ${g.seats} kişilik`}</small>
    </span>
  )
}

function TablePick({ g, names, next, onPick, label }) {
  return (
    <select className="tpick" aria-label={`${g.name} masası`} value=""
      onChange={(e) => onPick(g, e.target.value === '-' ? '' : e.target.value)}>
      <option value="" disabled>{label}</option>
      {names.filter((t) => t !== g.table).map((t) => <option key={t} value={t}>Masa {t}</option>)}
      {!names.includes(next) && <option value={next}>+ Yeni masa ({next})</option>}
      {g.table && <option value="-">Masadan kaldır</option>}
    </select>
  )
}

// ---------- Kapı girişi ----------
export function Gate({ store }) {
  const { guests } = store
  const [q, setQ] = useState('')
  if (!guests) return <p className="ahint">Yükleniyor…</p>
  const order = { yes: 0, wait: 1, no: 2 }
  const shown = guests
    .filter((g) => !q || norm(g.name).includes(norm(q)) || norm(g.table) === norm(q))
    .sort((a, b) => order[statusOf(a)] - order[statusOf(b)] || a.name.localeCompare(b.name, 'tr'))

  return (
    <>
      <p className="ahint">Misafir telefonundaki giriş kartını gösterdiğinde QR kodu kendi telefonunun kamerasıyla okut: açılan sayfanın altında "Girişi onayla" çıkar. Ya da buradan isimle ara.</p>
      <Stats s={summary(guests)} gate />
      <input className="gsearch gsearch--big" placeholder="Misafir adı ya da masa no" value={q} onChange={(e) => setQ(e.target.value)} />
      <ul className="glist">
        {shown.map((g) => (
          <li key={g.id} className={`ggate ${g.checkedIn ? 'is-in' : ''}`}>
            <span className="ggate__who">
              <b>{g.name}</b>
              <small>{statusOf(g) === 'yes' ? `${g.rsvp.count} kişi` : STATUS[statusOf(g)]}{g.table && ` · Masa ${g.table}`}</small>
            </span>
            <button type="button" onClick={() => store.update({ id: g.id, checkedIn: !g.checkedIn }, g.checkedIn ? 'Giriş geri alındı' : `${g.name} giriş yaptı ✓`)}>
              {g.checkedIn ? `✓ ${clock(g.checkedIn)}` : 'Giriş'}
            </button>
          </li>
        ))}
      </ul>
    </>
  )
}

// ---------- QR kodlar ----------
// DJ'e iletilecek şarkı istekleri
export function Songs({ store, notify }) {
  const { guests } = store
  if (!guests) return <p className="ahint">Yükleniyor…</p>
  const list = guests.filter((g) => g.rsvp?.status === 'yes' && g.rsvp.song).sort((a, b) => (a.rsvp.at || 0) - (b.rsvp.at || 0))
  if (!list.length) return <p className="ahint">Henüz şarkı isteği yok. Misafirler "Geliyorum" derken DJ'e şarkı isteyebiliyor.</p>
  const text = list.map((g, i) => `${i + 1}. ${g.rsvp.song} (${g.name})`).join('\n')
  const copy = async () => {
    try { await navigator.clipboard.writeText(text); notify('Liste kopyalandı, DJ\'e gönderebilirsin 🎵') } catch { notify('Kopyalanamadı') }
  }
  return (
    <>
      <div className="songs__bar">
        <p className="ahint">{list.length} şarkı isteği</p>
        <button type="button" className="abtn" onClick={copy}>Listeyi kopyala</button>
        <a className="abtn abtn--ghost" href={waUrl('', `Düğün şarkı istekleri 🎵\n${text}`)} target="_blank" rel="noreferrer">WhatsApp'la gönder</a>
      </div>
      <ol className="songs">
        {list.map((g) => (
          <li key={g.id}>
            <strong>{g.rsvp.song}</strong>
            <span>{g.name}</span>
          </li>
        ))}
      </ol>
    </>
  )
}

export function QrCodes() {
  const origin = window.location.origin
  const codes = [
    ['Masa kartı · Anı Duvarı', 'Masalara koyun: misafirler okutup fotoğraf paylaşsın', `${origin}/#anilar`, 'ani-duvari-qr.png'],
    ['Davetiye', 'Basılı davetiyeye ya da karşılama panosuna koyabilirsiniz', `${origin}/`, 'davetiye-qr.png'],
    ['Katılım bildirimi', 'Okutan misafir doğrudan katılım formuna gelir', `${origin}/#lcv`, 'katilim-qr.png'],
  ]
  const screen = `${origin}/?ekran`
  return (
    <>
      <section className="agroup gscreen">
        <h4>Düğün gecesi dev ekran</h4>
        <p className="ahint">Salondaki projeksiyona ya da TV'ye bağlı bilgisayarda aç. Misafirlerin Anı Duvarı'na eklediği fotoğraflar slayt olarak döner, yeni gelenler otomatik eklenir. Yanında "fotoğrafını ekle" QR kodu durur.</p>
        <a className="abtn" href={screen} target="_blank" rel="noreferrer">Ekran modunu aç ↗</a>
      </section>
      <p className="ahint">Kodları indirip yazdırabilirsin. Telefon kamerasıyla okutunca ilgili sayfa açılır.</p>
      {codes.map(([title, hint, url, file]) => (
        <section key={url} className="agroup gqr">
          <Qr text={url} size={150} />
          <div>
            <h4>{title}</h4>
            <p className="ahint">{hint}</p>
            <QrDownload url={url} file={file} />
          </div>
        </section>
      ))}
    </>
  )
}

function QrDownload({ url, file }) {
  const download = async () => {
    const { default: QRCode } = await import('qrcode')
    const a = document.createElement('a')
    a.href = await QRCode.toDataURL(url, { width: 1200, margin: 2, color: { dark: '#4b3a3a', light: '#ffffff' } })
    a.download = file
    a.click()
  }
  return <button type="button" className="abtn abtn--ghost" onClick={download}>İndir</button>
}
