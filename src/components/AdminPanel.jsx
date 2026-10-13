import { useEffect, useRef, useState } from 'react'
import { THEMES, themeColors } from '../site'
import { shrink, uploadBlob } from '../images'
import { changeCredentials } from '../admin'
import { useGuests, GuestList, Tables, Gate, QrCodes, Songs } from './GuestAdmin'
import { Overview, Guide } from './AdminExtras'
import { statusOf } from '../guests'

// Panel menüsü: gruplar ve her bölümün simgesi, kısa açıklaması
const MENU = [
  ['Misafirler', [
    ['ozet', 'Özet', '📊', 'Katılım durumu ve grafikler'],
    ['davetli', 'Davetliler', '👥', 'Ekle, davet gönder, düzenle'],
    ['masa', 'Masalar', '🪑', 'Oturma planı ve kartlar'],
    ['kapi', 'Kapı girişi', '🚪', 'Düğün günü giriş kontrolü'],
    ['sarki', 'Şarkı istekleri', '🎵', 'DJ listesi'],
  ]],
  ['Davetiye içeriği', [
    ['genel', 'İsimler & tarih', '💍', 'Gelin, damat, tarih, metinler'],
    ['foto', 'Fotoğraflar', '🖼️', 'Kapak ve kapanış'],
    ['hikaye', 'Hikâyemiz', '📖', 'Fotoğraflı hikâye kartları'],
    ['program', 'Program', '🕖', 'Günün akışı'],
    ['mekan', 'Mekân', '📍', 'Adres ve konum'],
    ['altin', 'Altın / IBAN', '💰', 'Hesap bilgileri'],
    ['sss', 'Sorular', '❓', 'Sıkça sorulanlar'],
    ['muzik', 'Müzik', '🎶', 'Arka plan şarkısı'],
  ]],
  ['Görünüm', [
    ['tema', 'Renkler', '🎨', 'Hazır temalar, kendi renklerin'],
    ['bolum', 'Bölümler', '🧩', 'Göster ya da gizle'],
  ]],
  ['Araçlar', [
    ['yardim', 'Nasıl kullanılır?', '📘', 'Adım adım düğün takvimi'],
    ['qr', 'QR & dev ekran', '📱', 'QR kodlar, düğün gecesi ekranı'],
    ['hesap', 'Hesap', '🔐', 'Kullanıcı adı ve şifre'],
  ]],
]
const ITEMS = MENU.flatMap(([, items]) => items)
// Bu bölümlerdeki değişiklikler anında kaydedilir (Kaydet butonu gerekmez)
const LIVE = ['yardim', 'ozet', 'davetli', 'masa', 'kapi', 'sarki', 'qr', 'hesap']
const wide = () => window.matchMedia('(min-width: 900px)').matches
const EVENT_TYPES = ['Düğün', 'Nişan', 'Kına', 'Söz', 'Nikâh']
const COLOR_FIELDS = [
  ['ink', 'Ana renk (koyu)'], ['paper', 'Arka plan'], ['ivory', 'İkincil arka plan'],
  ['champagne', 'Vurgu rengi'], ['champagneHi', 'Açık vurgu'],
]

// "2026-11-21T19:00:00+03:00" ↔ tarih + saat
const datePart = (iso) => (iso || '').slice(0, 10)
const timePart = (iso) => (iso || '').slice(11, 16)
const toIso = (date, time) => `${date}T${time || '00:00'}:00+03:00`
function nextDay(date) {
  const d = new Date(`${date}T12:00:00Z`)
  d.setUTCDate(d.getUTCDate() + 1)
  return d.toISOString().slice(0, 10)
}

export default function AdminPanel({ site, onChange, onSave, onCancel, onLogout, onClose, adminKey, dirty, saving, notify }) {
  const [isWide, setWide] = useState(wide)
  const [tab, setTab] = useState(() => (wide() ? 'ozet' : null))
  const [min, setMin] = useState(false)
  const guests = useGuests(adminKey, notify)
  const body = useRef(null)

  useEffect(() => {
    const mq = window.matchMedia('(min-width: 900px)')
    const on = () => { setWide(mq.matches); if (mq.matches) setTab((t) => t || 'ozet') }
    mq.addEventListener('change', on)
    return () => mq.removeEventListener('change', on)
  }, [])

  const open = (id) => {
    setTab(id)
    body.current?.scrollTo(0, 0)
  }

  // Menüde gösterilen küçük uyarı sayıları
  const list = guests.guests || []
  const badges = {
    davetli: list.filter((g) => statusOf(g) === 'wait').length && `${list.filter((g) => statusOf(g) === 'wait').length} cevap yok`,
    masa: list.filter((g) => !g.table && statusOf(g) !== 'no').length && `${list.filter((g) => !g.table && statusOf(g) !== 'no').length} masasız`,
    sarki: list.filter((g) => g.rsvp?.song).length || '',
  }
  const current = ITEMS.find(([id]) => id === tab)

  const set = (patch) => onChange({ ...site, ...patch })
  const setIn = (key, patch) => onChange({ ...site, [key]: { ...site[key], ...patch } })

  const setDate = (date, start = timePart(site.start), end = timePart(site.end)) => {
    if (!date) return
    const endDate = end && start && end <= start ? nextDay(date) : date
    onChange({ ...site, start: toIso(date, start), end: toIso(endDate, end || start) })
  }

  if (min) {
    return (
      <div className="admin-mini">
        <span>Önizleme {dirty && <em>· kaydedilmemiş değişiklik var</em>}</span>
        <button type="button" onClick={() => setMin(false)}>Panele dön</button>
      </div>
    )
  }

  return (
    <aside className={`ap ${tab ? 'ap--section' : 'ap--home'}`} role="dialog" aria-label="Yönetim paneli">
      <nav className="ap__side">
        <header className="ap__brand">
          <div>
            <strong>Yönetim paneli</strong>
            <span>{site.groom.first} & {site.bride.first}</span>
          </div>
          {!isWide && (
            <div className="ap__actions">
              <button type="button" className="ap__icon" onClick={() => setMin(true)} title="Siteyi gör" aria-label="Siteyi gör">👁</button>
              <button type="button" className="ap__icon" onClick={onClose} aria-label="Paneli kapat">×</button>
            </div>
          )}
        </header>
        {tab !== 'yardim' && (
          <button type="button" className="ap__help" onClick={() => open('yardim')}>
            <span aria-hidden="true">📘</span>
            <span><b>Nasıl kullanılır?</b><small>Adım adım: davetten düğün gününe</small></span>
            <em aria-hidden="true">›</em>
          </button>
        )}
        {MENU.map(([group, items]) => (
          <section key={group} className="ap__group">
            <h3>{group}</h3>
            <div className="ap__items">
              {items.map(([id, label, icon, hint]) => (
                <button key={id} type="button" className={`ap__item ${tab === id ? 'is-active' : ''}`} onClick={() => open(id)}>
                  <span className="ap__ico" aria-hidden="true">{icon}</span>
                  <span className="ap__txt"><b>{label}</b><small>{hint}</small></span>
                  {badges[id] ? <em className="ap__badge">{badges[id]}</em> : null}
                </button>
              ))}
            </div>
          </section>
        ))}
        <button type="button" className="ap__logout" onClick={onLogout}>Yönetici modundan çık</button>
      </nav>

      <div className="ap__main">
        {current && (
          <header className="ap__head">
            {!isWide && <button type="button" className="ap__back" onClick={() => setTab(null)}>‹ Menü</button>}
            <div className="ap__title">
              <strong><span aria-hidden="true">{current[2]}</span> {current[1]}</strong>
              <span>{tab === 'yardim' ? 'Davetten düğün gününe adım adım' : LIVE.includes(tab) ? 'Değişiklikler anında kaydedilir ✓' : 'Değişiklikleri bitirince alttan Kaydet\'e bas'}</span>
            </div>
            <div className="ap__actions">
              <button type="button" className="ap__icon" onClick={() => setMin(true)} title="Siteyi gör" aria-label="Siteyi gör">👁</button>
              <button type="button" className="ap__icon" onClick={onClose} aria-label="Paneli kapat">×</button>
            </div>
          </header>
        )}
      <div className="ap__body" ref={body}>
        <div className="ap__content">
        {tab === 'yardim' && <Guide onOpen={open} />}
        {tab === 'ozet' && <Overview store={guests} site={site} onOpen={open} adminKey={adminKey} />}
        {tab === 'davetli' && <GuestList store={guests} site={site} notify={notify} />}
        {tab === 'masa' && <Tables store={guests} notify={notify} site={site} />}
        {tab === 'kapi' && <Gate store={guests} />}
        {tab === 'sarki' && <Songs store={guests} notify={notify} />}
        {tab === 'qr' && <QrCodes />}
        {tab === 'genel' && (
          <>
            <Group title="Damat">
              <Field label="Adı" value={site.groom.first} onChange={(v) => setIn('groom', { first: v })} />
              <Field label="Soyadı" value={site.groom.last} onChange={(v) => setIn('groom', { last: v })} />
            </Group>
            <Group title="Gelin">
              <Field label="Adı" value={site.bride.first} onChange={(v) => setIn('bride', { first: v })} />
              <Field label="Soyadı" value={site.bride.last} onChange={(v) => setIn('bride', { last: v })} />
            </Group>
            <Group title="Etkinlik">
              <label className="afield">
                <span>Tür</span>
                <select value={site.eventType} onChange={(e) => set({ eventType: e.target.value })}>
                  {EVENT_TYPES.map((t) => <option key={t}>{t}</option>)}
                </select>
              </label>
              <Field label="Tarih" type="date" value={datePart(site.start)} onChange={(v) => setDate(v)} />
              <div className="afield-row">
                <Field label="Başlangıç" type="time" value={timePart(site.start)}
                  onChange={(v) => setDate(datePart(site.start), v)} />
                <Field label="Bitiş" type="time" value={timePart(site.end)}
                  onChange={(v) => setDate(datePart(site.start), timePart(site.start), v)} />
              </div>
            </Group>
            <Group title="Metinler">
              <Field label="Davet metni" textarea value={site.inviteText} onChange={(v) => set({ inviteText: v })} />
              <En><Field label="Davet metni (İngilizce)" textarea value={site.inviteTextEn || ''} onChange={(v) => set({ inviteTextEn: v })} /></En>
              <Field label="Etiket (hashtag)" value={site.hashtag} onChange={(v) => set({ hashtag: v })} />
              <Field label="Katılım bildirimi son tarihi" value={site.rsvpDeadline} onChange={(v) => set({ rsvpDeadline: v })}
                hint='Ör. "1 Kasım". Boş bırakılırsa tarih yazılmaz.' />
            </Group>
          </>
        )}

        {tab === 'tema' && (
          <>
            <Group title="Hazır temalar">
              <div className="themes">
                {Object.entries(THEMES).map(([id, t]) => (
                  <button key={id} type="button"
                    className={`theme ${site.theme === id && !hasCustom(site) ? 'is-active' : ''}`}
                    onClick={() => set({ theme: id, customTheme: {} })}>
                    <span className="theme__sw">
                      {[t.ink, t.ivory, t.champagne, t.champagneHi].map((c) => <i key={c} style={{ background: c }} />)}
                    </span>
                    {t.label}
                  </button>
                ))}
              </div>
            </Group>
            <Group title="Kendi renklerin">
              {COLOR_FIELDS.map(([k, label]) => (
                <label key={k} className="acolor">
                  <input type="color" value={themeColors(site)[k]}
                    onChange={(e) => set({ customTheme: { ...(site.customTheme || {}), [k]: e.target.value } })} />
                  <span>{label}</span>
                  <code>{themeColors(site)[k]}</code>
                </label>
              ))}
              {hasCustom(site) && (
                <button type="button" className="alink" onClick={() => set({ customTheme: {} })}>Özel renkleri sıfırla</button>
              )}
            </Group>
          </>
        )}

        {tab === 'foto' && (
          <>
            <Group title="Kapak fotoğrafı" hint="Sayfanın en üstünde tam ekran görünür">
              <PhotoField value={site.heroPhoto} adminKey={adminKey} notify={notify} max={2000}
                onChange={(url) => set({ heroPhoto: url })} />
            </Group>
            <Group title="Kapanış fotoğrafı" hint="Sayfanın en altında görünür">
              <PhotoField value={site.outroPhoto} adminKey={adminKey} notify={notify} max={2000}
                onChange={(url) => set({ outroPhoto: url })} />
            </Group>
            <p className="ahint">Hikâye kartlarının fotoğrafları "Hikâye" sekmesinde.</p>
          </>
        )}

        {tab === 'hikaye' && (
          <ListEditor items={site.story} onChange={(story) => set({ story })}
            blank={{ no: '', title: 'Yeni bölüm', text: '', photo: '', pos: '50% 50%' }}
            addLabel="+ Hikâye kartı ekle"
            render={(item, update) => (
              <>
                <Field label="Başlık" value={item.title} onChange={(v) => update({ title: v })} />
                <Field label="Açıklama" textarea value={item.text} onChange={(v) => update({ text: v })} />
                <En>
                  <Field label="Başlık (İngilizce)" value={item.titleEn || ''} onChange={(v) => update({ titleEn: v })} />
                  <Field label="Açıklama (İngilizce)" textarea value={item.textEn || ''} onChange={(v) => update({ textEn: v })} />
                </En>
                <PhotoField value={item.photo} adminKey={adminKey} notify={notify} onChange={(url) => update({ photo: url })} />
              </>
            )} />
        )}

        {tab === 'program' && (
          <ListEditor items={site.program} onChange={(program) => set({ program })}
            blank={{ time: '22:00', title: 'Yeni', note: '' }}
            addLabel="+ Program maddesi ekle"
            render={(item, update) => (
              <>
                <div className="afield-row">
                  <Field label="Saat" type="time" value={item.time} onChange={(v) => update({ time: v })} />
                  <Field label="Başlık" value={item.title} onChange={(v) => update({ title: v })} />
                </div>
                <Field label="Not" value={item.note} onChange={(v) => update({ note: v })} />
                <En>
                  <Field label="Başlık (İngilizce)" value={item.titleEn || ''} onChange={(v) => update({ titleEn: v })} />
                  <Field label="Not (İngilizce)" value={item.noteEn || ''} onChange={(v) => update({ noteEn: v })} />
                </En>
              </>
            )} />
        )}

        {tab === 'sss' && (
          <ListEditor items={site.faq} onChange={(faq) => set({ faq })}
            blank={{ q: 'Yeni soru?', a: '' }}
            addLabel="+ Soru ekle"
            render={(item, update) => (
              <>
                <Field label="Soru" value={item.q} onChange={(v) => update({ q: v })} />
                <Field label="Cevap" textarea value={item.a} onChange={(v) => update({ a: v })} />
                <En>
                  <Field label="Soru (İngilizce)" value={item.qEn || ''} onChange={(v) => update({ qEn: v })} />
                  <Field label="Cevap (İngilizce)" textarea value={item.aEn || ''} onChange={(v) => update({ aEn: v })} />
                </En>
              </>
            )} />
        )}

        {tab === 'mekan' && (
          <Group title="Mekân">
            <Field label="Mekân adı" value={site.venue.name} onChange={(v) => setIn('venue', { name: v })} />
            <Field label="Adres" value={site.venue.address} onChange={(v) => setIn('venue', { address: v })} />
            <Field label="Haritada aranacak ifade" value={site.venue.mapsQuery}
              onChange={(v) => setIn('venue', { mapsQuery: v })}
              hint="Google Haritalar'da mekânı doğru bulan arama metni" />
            <div className="afield-row">
              <Field label="Enlem" value={String(site.venue.lat ?? '')} onChange={(v) => setIn('venue', { lat: v.replace(',', '.') })} />
              <Field label="Boylam" value={String(site.venue.lon ?? '')} onChange={(v) => setIn('venue', { lon: v.replace(',', '.') })} />
            </div>
            <p className="ahint">Enlem/boylam, düğüne 15 gün kala gösterilen hava tahmini içindir. Google Haritalar'da mekâna basılı tutunca görünen sayılar.</p>
          </Group>
        )}

        {tab === 'altin' && (
          <Group title="IBAN bilgileri">
            <Field label="Alıcı adı" value={site.gift.holder} onChange={(v) => setIn('gift', { holder: v })} />
            <Field label="Banka" value={site.gift.bank} onChange={(v) => setIn('gift', { bank: v })} />
            <Field label="IBAN" value={site.gift.iban} onChange={(v) => setIn('gift', { iban: formatIban(v) })} />
          </Group>
        )}

        {tab === 'muzik' && (
          <Group title="Arka plan müziği" hint="Davetiye açılınca çalar. MP3 veya M4A, en fazla 25 MB.">
            {site.music ? <audio className="aaudio" controls src={site.music} /> : <p className="ahint">Müzik kapalı.</p>}
            <FileButton accept="audio/*" label={site.music ? 'Müziği değiştir' : 'Müzik yükle'} adminKey={adminKey}
              notify={notify} onUploaded={(url) => set({ music: url })} folder="muzik" />
            {site.music && <button type="button" className="alink alink--danger" onClick={() => set({ music: '' })}>Müziği kaldır</button>}
          </Group>
        )}

        {tab === 'bolum' && (
          <Group title="Görünen bölümler">
            {[['story', 'Hikâyemiz'], ['program', 'Günün programı'], ['rsvp', 'Katılım bildirimi (LCV)'], ['faq', 'Sıkça sorulanlar'], ['gold', 'Altın köşesi / IBAN'], ['wishes', 'İyi dilekler'], ['memories', 'Anı Duvarı']].map(([k, label]) => (
              <label key={k} className="atoggle">
                <input type="checkbox" checked={site.sections[k] !== false}
                  onChange={(e) => setIn('sections', { [k]: e.target.checked })} />
                <span>{label}</span>
              </label>
            ))}
          </Group>
        )}
        {tab === 'hesap' && <Account adminKey={adminKey} notify={notify} />}
        </div>
      </div>
      </div>

      {dirty && (
        <footer className="ap__save">
          <span>Kaydedilmemiş değişiklik var</span>
          <button type="button" className="abtn abtn--ghost" disabled={saving} onClick={onCancel}>Vazgeç</button>
          <button type="button" className="abtn" disabled={saving} onClick={onSave}>{saving ? 'Kaydediliyor…' : 'Kaydet'}</button>
        </footer>
      )}
    </aside>
  )
}

function Account({ adminKey, notify }) {
  const [username, setUsername] = useState('')
  const [currentPassword, setCurrent] = useState('')
  const [newPassword, setNew] = useState('')
  const [again, setAgain] = useState('')
  const [busy, setBusy] = useState(false)

  const submit = async (e) => {
    e.preventDefault()
    if (newPassword !== again) return notify('Yeni şifreler aynı değil')
    setBusy(true)
    try {
      await changeCredentials(adminKey, { username, currentPassword, newPassword })
      notify('Giriş bilgileri güncellendi ✓')
      setCurrent(''); setNew(''); setAgain('')
    } catch (err) {
      notify(err.message)
    } finally {
      setBusy(false)
    }
  }

  return (
    <form onSubmit={submit}>
      <Group title="Giriş bilgilerini değiştir" hint="Yönetici girişinde kullanılan kullanıcı adı ve şifre. Herkes aynı hesabı kullanır.">
        <Field label="Kullanıcı adı" value={username} onChange={setUsername} />
        <Field label="Mevcut şifre" type="password" value={currentPassword} onChange={setCurrent} />
        <Field label="Yeni şifre (en az 8 karakter)" type="password" value={newPassword} onChange={setNew} />
        <Field label="Yeni şifre (tekrar)" type="password" value={again} onChange={setAgain} />
        <button type="submit" className="abtn abtn--block" disabled={busy || !username || !currentPassword || newPassword.length < 8}>
          {busy ? 'Kaydediliyor…' : 'Giriş bilgilerini kaydet'}
        </button>
      </Group>
    </form>
  )
}

const hasCustom = (site) => Object.keys(site.customTheme || {}).length > 0

function formatIban(v) {
  return v.toUpperCase().replace(/[^A-Z0-9]/g, '').replace(/(.{4})/g, '$1 ').trim()
}

// İngilizce alanlar: yabancı misafirler için isteğe bağlı, boşsa Türkçesi görünür
function En({ children }) {
  return (
    <details className="aen">
      <summary>🇬🇧 İngilizce <small>(isteğe bağlı)</small></summary>
      {children}
    </details>
  )
}

function Group({ title, hint, children }) {
  return (
    <section className="agroup">
      <h4>{title}</h4>
      {hint && <p className="ahint">{hint}</p>}
      {children}
    </section>
  )
}

function Field({ label, value, onChange, type = 'text', textarea, hint }) {
  return (
    <label className="afield">
      <span>{label}</span>
      {textarea ? (
        <textarea rows={4} value={value || ''} onChange={(e) => onChange(e.target.value)} />
      ) : (
        <input type={type} value={value || ''} onChange={(e) => onChange(e.target.value)} />
      )}
      {hint && <small>{hint}</small>}
    </label>
  )
}

function FileButton({ accept, label, adminKey, notify, onUploaded, folder, max }) {
  const input = useRef(null)
  const [progress, setProgress] = useState(null)

  const pick = async (e) => {
    const file = e.target.files?.[0]
    e.target.value = ''
    if (!file) return
    setProgress(0)
    try {
      const blob = file.type.startsWith('image/') ? (await shrink(file, max)).blob : file
      const url = await uploadBlob(folder, blob, { adminKey, onProgress: setProgress })
      onUploaded(url)
      notify('Yüklendi. Kaydetmeyi unutma ✓')
    } catch (err) {
      notify(err.message || 'Yüklenemedi')
    } finally {
      setProgress(null)
    }
  }

  return (
    <>
      <input ref={input} type="file" accept={accept} hidden onChange={pick} />
      <button type="button" className="abtn abtn--ghost abtn--block" disabled={progress !== null}
        onClick={() => input.current?.click()}>
        {progress !== null ? `Yükleniyor… %${Math.round(progress)}` : label}
      </button>
    </>
  )
}

function PhotoField({ value, onChange, adminKey, notify, max = 1600 }) {
  return (
    <div className="aphoto">
      {value ? <img src={value} alt="" /> : <div className="aphoto__empty">Fotoğraf yok</div>}
      <FileButton accept="image/*" label={value ? 'Fotoğrafı değiştir' : 'Fotoğraf yükle'} adminKey={adminKey}
        notify={notify} onUploaded={onChange} folder="site" max={max} />
    </div>
  )
}

function ListEditor({ items = [], onChange, render, blank, addLabel }) {
  const update = (i, patch) => onChange(items.map((it, j) => (j === i ? { ...it, ...patch } : it)))
  const move = (i, d) => {
    const next = [...items]
    const j = i + d
    if (j < 0 || j >= next.length) return
    ;[next[i], next[j]] = [next[j], next[i]]
    onChange(next)
  }
  const remove = (i) => {
    if (window.confirm('Bu öğe silinsin mi?')) onChange(items.filter((_, j) => j !== i))
  }
  return (
    <>
      {items.map((item, i) => (
        <section key={i} className="agroup agroup--item">
          <div className="aitem__bar">
            <strong>{i + 1}.</strong>
            <div>
              <button type="button" onClick={() => move(i, -1)} disabled={i === 0} aria-label="Yukarı">↑</button>
              <button type="button" onClick={() => move(i, 1)} disabled={i === items.length - 1} aria-label="Aşağı">↓</button>
              <button type="button" className="danger" onClick={() => remove(i)} aria-label="Sil">Sil</button>
            </div>
          </div>
          {render(item, (patch) => update(i, patch))}
        </section>
      ))}
      <button type="button" className="abtn abtn--ghost abtn--block" onClick={() => onChange([...items, { ...blank }])}>{addLabel}</button>
    </>
  )
}
