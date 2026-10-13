import { useEffect, useState } from 'react'
import { createPortal } from 'react-dom'
import { statusOf } from '../guests'
import { formatDate } from '../date'
import { defaults } from '../config'

const byTable = (a, b) => a.localeCompare(b, 'tr', { numeric: true })
const people = (g) => (statusOf(g) === 'yes' ? g.rsvp.count : g.seats)

// ---------- Özet: grafiklerle katılım durumu ----------
export function Overview({ store, site, onOpen, adminKey }) {
  const { guests } = store
  const usage = useUsage(adminKey)
  if (!guests) return <p className="ahint">Yükleniyor…</p>
  if (!guests.length) return <><Checklist site={site} guests={guests} onOpen={onOpen} /><p className="ahint">Henüz davetli yok. "Davetliler" bölümünden ekleyince özet burada görünür.</p><Storage usage={usage} /></>

  const yes = guests.filter((g) => statusOf(g) === 'yes')
  const no = guests.filter((g) => statusOf(g) === 'no')
  const wait = guests.filter((g) => statusOf(g) === 'wait')
  const coming = yes.reduce((n, g) => n + g.rsvp.count, 0)
  const invited = guests.reduce((n, g) => n + g.seats, 0)
  const seated = guests.filter((g) => g.table && statusOf(g) !== 'no').reduce((n, g) => n + people(g), 0)
  const expected = guests.filter((g) => statusOf(g) !== 'no').reduce((n, g) => n + people(g), 0)
  const entered = guests.filter((g) => g.checkedIn).length
  const answered = yes.length + no.length
  const days = Math.ceil((new Date(site.start).getTime() - Date.now()) / 86400000)

  const sides = [['damat', 'Damat tarafı'], ['gelin', 'Gelin tarafı'], ['', 'Ortak']].map(([k, label]) => ({
    label, n: yes.filter((g) => (g.side || '') === k).reduce((s, g) => s + g.rsvp.count, 0),
  }))
  const maxSide = Math.max(1, ...sides.map((s) => s.n))

  // Gün gün gelen cevaplar (birikimli)
  const answers = guests.filter((g) => g.rsvp?.at).map((g) => g.rsvp.at).sort((a, b) => a - b)
  const tables = new Set(guests.filter((g) => g.table).map((g) => g.table)).size

  return (
    <div className="ov">
      <Checklist site={site} guests={guests} onOpen={onOpen} />
      <div className="ov__hero">
        <Donut parts={[[yes.length, 'var(--ov-yes)'], [no.length, 'var(--ov-no)'], [wait.length, 'var(--ov-wait)']]}>
          <b>{Math.round((answered / guests.length) * 100)}%</b>
          <small>cevap verdi</small>
        </Donut>
        <ul className="ov__legend">
          <li><i style={{ background: 'var(--ov-yes)' }} />Geliyor <b>{yes.length}</b></li>
          <li><i style={{ background: 'var(--ov-no)' }} />Gelmiyor <b>{no.length}</b></li>
          <li><i style={{ background: 'var(--ov-wait)' }} />Cevap yok <b>{wait.length}</b></li>
        </ul>
      </div>

      <div className="ov__cards">
        <div><b>{coming}</b><span>kişi geliyor</span><small>{invited} kişi davetli</small></div>
        <div><b>{expected}</b><span>kişi bekleniyor</span><small>cevap vermeyenler dahil</small></div>
        <div><b>{seated}</b><span>kişi masada</span><small>{tables} masa · {Math.max(0, expected - seated)} kişi bekliyor</small></div>
        <div><b>{days > 0 ? days : '🎉'}</b><span>{days > 0 ? 'gün kaldı' : 'büyük gün!'}</span><small>{formatDate(site.start).day} {formatDate(site.start).monthName}</small></div>
      </div>

      <section className="agroup">
        <h4>Gelenler hangi taraftan?</h4>
        {sides.map((s) => (
          <div key={s.label} className="ov__bar">
            <span>{s.label}</span>
            <div><i style={{ width: `${(s.n / maxSide) * 100}%` }} /></div>
            <b>{s.n}</b>
          </div>
        ))}
      </section>

      {answers.length > 1 && answers[answers.length - 1] - answers[0] > 86400000 && (
        <section className="agroup">
          <h4>Cevapların gelişi</h4>
          <Spark times={answers} />
        </section>
      )}

      <Storage usage={usage} />

      {entered > 0 && (
        <section className="agroup">
          <h4>Kapıdan giriş</h4>
          <div className="ov__bar ov__bar--wide">
            <div><i style={{ width: `${(entered / Math.max(1, yes.length)) * 100}%` }} /></div>
            <b>{entered}/{yes.length}</b>
          </div>
        </section>
      )}
    </div>
  )
}

// Düğüne hazırlık: eksik kalan ya da kontrol edilmesi gereken şeyler
function Checklist({ site, guests, onOpen }) {
  const same = (a, b) => JSON.stringify(a) === JSON.stringify(b)
  const unsent = guests.filter((g) => !g.sentAt && g.source !== 'site').length
  const unseated = guests.filter((g) => statusOf(g) === 'yes' && !g.table).length
  const items = [
    [!/0000 0000/.test(site.gift.iban) && site.gift.bank !== 'Banka Adı', 'IBAN ve banka adını yaz', 'Altın köşesinde şu an örnek numara görünüyor', 'altin'],
    [guests.length > 0, 'Davetlileri ekle', 'Excel listesini yapıştırarak hepsini birden ekleyebilirsin', 'davetli'],
    [guests.length > 0 && unsent === 0, unsent ? `${unsent} davetliye davet gönder` : 'Davetleri gönder', '"Sırayla gönder" ile WhatsApp\'tan tek tek hızlıca', 'davetli'],
    [!same(site.faq, defaults.faq), 'Sıkça sorulanları kontrol et', 'Çocuk ve kıyafet cevapları örnek olarak yazıldı', 'sss'],
    [!same(site.program, defaults.program), 'Programı kontrol et', 'Saatler ve başlıklar sizin düğününüze uysun', 'program'],
    [Boolean(site.rsvpDeadline), 'Katılım için son tarih yaz', 'İsteğe bağlı, ör. "1 Kasım"', 'genel'],
    [unseated === 0, unseated ? `${unseated} gelen misafiri masaya yerleştir` : 'Masaları yerleştir', '"Otomatik oturt" ile tek dokunuşta', 'masa'],
  ]
  const done = items.filter(([ok]) => ok).length
  if (done === items.length) return null
  return (
    <section className="agroup chk">
      <h4>Hazırlık listesi · {done}/{items.length}</h4>
      <div className="chk__bar"><i style={{ width: `${(done / items.length) * 100}%` }} /></div>
      <ul>
        {items.map(([ok, title, hint, tab]) => (
          <li key={title} className={ok ? 'is-done' : ''}>
            <button type="button" onClick={() => onOpen?.(tab)} disabled={ok}>
              <span className="chk__box" aria-hidden="true">{ok ? '✓' : ''}</span>
              <span><b>{title}</b>{!ok && <small>{hint}</small>}</span>
              {!ok && <em aria-hidden="true">›</em>}
            </button>
          </li>
        ))}
      </ul>
    </section>
  )
}

const LIMIT = 1024 * 1024 * 1024
const mb = (n) => (n >= 1024 * 1024 * 1024 ? `${(n / 1024 / 1024 / 1024).toFixed(2)} GB` : n < 10 * 1024 * 1024 ? `${(n / 1024 / 1024).toFixed(1)} MB` : `${Math.round(n / 1024 / 1024)} MB`)

function Storage({ usage }) {
  if (!usage) return null
  return (
    <section className="agroup">
      <h4>Depolama</h4>
      <div className="ov__bar ov__bar--wide">
        <div><i style={{ width: `${Math.min(100, (usage.total / LIMIT) * 100)}%`, background: usage.total > LIMIT * 0.8 ? '#d9897a' : undefined }} /></div>
        <b>{mb(usage.total)}</b>
      </div>
      <p className="ahint">
        Ücretsiz alan yaklaşık {mb(LIMIT)}. Anı Duvarı: {mb(usage.memories)}{usage.videos ? ` (${usage.videos} video)` : ''} · Site dosyaları: {mb(usage.site)}.
        {usage.total > LIMIT * 0.8 && ' Alan dolmak üzere: fotoğrafları indirip eski videoları silebilirsin.'}
      </p>
    </section>
  )
}

function useUsage(adminKey) {
  const [usage, setUsage] = useState(null)
  useEffect(() => {
    if (!adminKey) return
    fetch('/api/admin', { headers: { 'x-admin-key': adminKey } })
      .then((r) => (r.ok ? r.json() : null)).then(setUsage).catch(() => {})
  }, [adminKey])
  return usage
}

function Donut({ parts, children }) {
  const total = parts.reduce((n, [v]) => n + v, 0) || 1
  const C = 2 * Math.PI * 42
  let offset = 0
  return (
    <div className="ov__donut">
      <svg viewBox="0 0 100 100">
        <circle cx="50" cy="50" r="42" className="ov__track" />
        {parts.map(([v, color], i) => {
          const len = (v / total) * C
          const el = <circle key={i} cx="50" cy="50" r="42" stroke={color} strokeDasharray={`${len} ${C - len}`} strokeDashoffset={-offset} className="ov__seg" />
          offset += len
          return el
        })}
      </svg>
      <div>{children}</div>
    </div>
  )
}

function Spark({ times }) {
  const start = times[0]
  const end = Math.max(times[times.length - 1], start + 86400000)
  const pts = times.map((t, i) => [((t - start) / (end - start)) * 280 + 10, 90 - ((i + 1) / times.length) * 75])
  const line = pts.map((p, i) => `${i ? 'L' : 'M'}${p[0].toFixed(1)} ${p[1].toFixed(1)}`).join(' ')
  const day = (t) => new Date(t).toLocaleDateString('tr-TR', { day: 'numeric', month: 'short', timeZone: 'Europe/Istanbul' })
  return (
    <div className="ov__spark">
      <svg viewBox="0 0 300 100" preserveAspectRatio="none">
        <path d={`${line} L${pts[pts.length - 1][0]} 92 L10 92 Z`} className="ov__area" />
        <path d={line} className="ov__line" />
      </svg>
      <div><span>{day(start)}</span><span>{times.length} cevap</span><span>{day(times[times.length - 1])}</span></div>
    </div>
  )
}

// ---------- Yazdırılabilir masa ve isim kartları ----------
export function PrintButtons({ guests, site }) {
  const [mode, setMode] = useState(null)
  useEffect(() => {
    if (!mode) return undefined
    const done = () => setMode(null)
    window.addEventListener('afterprint', done)
    const t = setTimeout(() => window.print(), 300)
    return () => { clearTimeout(t); window.removeEventListener('afterprint', done) }
  }, [mode])
  const list = (guests || []).filter((g) => g.table && statusOf(g) !== 'no')
  if (!list.length) return null
  return (
    <div className="tprint">
      <span>🖨️ Yazdır:</span>
      <button type="button" onClick={() => setMode('tables')}>Masa kartları</button>
      <button type="button" onClick={() => setMode('names')}>İsim kartları</button>
      {mode && createPortal(<PrintSheet mode={mode} list={list} site={site} />, document.body)}
    </div>
  )
}

function PrintSheet({ mode, list, site }) {
  const couple = `${site.groom.first} & ${site.bride.first}`
  const d = formatDate(site.start)
  const groups = {}
  for (const g of list) (groups[g.table] ||= []).push(g)
  const names = Object.keys(groups).sort(byTable)
  return (
    <div className={`print-sheet print-sheet--${mode}`}>
      {mode === 'tables'
        ? names.map((t) => (
          <article key={t} className="pcard pcard--table">
            <small>{couple}</small>
            <span className="pcard__label">Masa</span>
            <b className="pcard__no">{t}</b>
            <ul>{groups[t].map((g) => <li key={g.id}>{g.name}{people(g) > 1 ? ` (${people(g)})` : ''}</li>)}</ul>
            <small>{d.day}.{d.month}.{d.year}</small>
          </article>
        ))
        : list.sort((a, b) => byTable(a.table, b.table) || a.name.localeCompare(b.name, 'tr')).map((g) => (
          <article key={g.id} className="pcard pcard--name">
            {/* katlanınca masanın iki yanından da okunsun diye üst yarı ters basılır */}
            {[true, false].map((flip) => (
              <div key={String(flip)} className={flip ? 'pcard__half is-flip' : 'pcard__half'}>
                <b className="pcard__guest">{g.name}</b>
                <span className="pcard__seat">Masa {g.table}</span>
                <small>{couple} · {d.day}.{d.month}.{d.year}</small>
              </div>
            ))}
            <span className="pcard__fold" />
          </article>
        ))}
    </div>
  )
}
