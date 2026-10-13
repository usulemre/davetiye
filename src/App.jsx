import { Suspense, lazy, useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { copyText } from './hooks'
import { SiteContext, mergeSite, applyTheme } from './site'
import { useScrollFx, useScroll3D, useTucked } from './fx'
import { getAdminKey, verifyAdmin, logout as endSession, isLoginPath } from './admin'
import Intro from './components/Intro'
import Music from './components/Music'
import Hero from './components/Hero'
import Orbs from './components/Orbs'
import Safe from './components/Safe'
import { t, getLang, setLang, serverMsg } from './i18n'
import Story from './components/Story'
import Gold from './components/Gold'
import Memories from './components/Memories'
import AdminPanel from './components/AdminPanel'
import Login from './components/Login'
import Rsvp from './components/Rsvp'
import Faq from './components/Faq'
import Wishes from './components/Wishes'
import GateBar from './components/GateBar'
import { myCode, linkCode, fetchGuest } from './guests'
import { Invite, When, Program, Venue, Outro } from './components/Sections'

const Screen = lazy(() => import('./components/Screen'))
const isScreen = new URLSearchParams(window.location.search).has('ekran')

// Kaydedilecek veriden türetilmiş alanları çıkar
const toSaved = ({ initials, ...rest }) => rest

export default function App() {
  const [saved, setSaved] = useState(null)
  const [draft, setDraft] = useState(null)
  const [admin, setAdmin] = useState(null)
  const [editing, setEditing] = useState(false)
  const [loginOpen, setLoginOpen] = useState(isLoginPath)
  const [saving, setSaving] = useState(false)
  const [opened, setOpened] = useState(false)
  const [toast, setToast] = useState(null)
  const [docked, setDocked] = useState(false)
  const [guest, setGuest] = useState(null)
  const [lang, setLangState] = useState(getLang)
  const switchLang = () => {
    const next = lang === 'en' ? 'tr' : 'en'
    setLang(next)
    setLangState(next)
  }
  const timer = useRef()
  const music = useRef(null)
  const bar = useRef(null)
  useScrollFx(bar)
  useScroll3D()
  const tucked = useTucked()

  // Kaydedilmiş site ayarlarını yükle
  useEffect(() => {
    const fallback = setTimeout(() => setSaved((s) => s ?? {}), 3000)
    fetch('/api/config')
      .then((r) => (r.ok ? r.json() : { config: {} }))
      .then((d) => setSaved(d.config || {}))
      .catch(() => setSaved({}))
      .finally(() => clearTimeout(fallback))
  }, [])

  // Kişiye özel linkle gelen misafir
  useEffect(() => {
    fetchGuest(myCode()).then(setGuest)
  }, [])

  // Yönetici anahtarı geçerliyse paneli aç
  useEffect(() => {
    const key = getAdminKey()
    verifyAdmin(key).then((ok) => setAdmin(ok ? key : null))
  }, [])

  const site = useMemo(() => mergeSite(draft ?? saved ?? {}), [draft, saved])
  useEffect(() => { if (saved) applyTheme(site) }, [site, saved])

  useEffect(() => {
    const onScroll = () => setDocked(window.scrollY > window.innerHeight * 0.6)
    onScroll()
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  const notify = useCallback((message) => {
    setToast(serverMsg(message))
    clearTimeout(timer.current)
    timer.current = setTimeout(() => setToast(null), 2600)
  }, [])

  const handleCopy = useCallback(async (text, message) => {
    const ok = await copyText(text)
    notify(ok ? message : t('Kopyalanamadı, elle seçip kopyalayabilirsiniz', 'Could not copy, please select and copy it manually'))
  }, [notify])

  const save = async () => {
    setSaving(true)
    try {
      const res = await fetch('/api/config', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', 'x-admin-key': admin },
        body: JSON.stringify(toSaved(draft)),
      })
      const data = await res.json().catch(() => ({}))
      if (!res.ok) throw new Error(data.error || 'Kaydedilemedi')
      setSaved(data.config)
      setDraft(null)
      notify('Kaydedildi! Artık herkes yeni hâlini görüyor ✓')
    } catch (err) {
      notify(err.message)
    } finally {
      setSaving(false)
    }
  }

  const cancel = () => {
    if (window.confirm('Kaydedilmemiş değişiklikler silinsin mi?')) setDraft(null)
  }

  const closePanel = () => {
    if (draft && !window.confirm('Kaydedilmemiş değişiklikler var. Yine de kapatılsın mı?')) return
    setDraft(null)
    setEditing(false)
  }

  const logout = () => {
    if (draft && !window.confirm('Kaydedilmemiş değişiklikler silinecek. Devam edilsin mi?')) return
    endSession(admin)
    setAdmin(null)
    setDraft(null)
    setEditing(false)
  }

  // Ayarlar yüklenene kadar varsayılan bilgilerin bir anlığına görünmesini engelle
  if (saved === null) return <div className="boot" />

  const show = site.sections

  // Düğün gecesi projeksiyon ekranı
  if (isScreen) {
    return (
      <SiteContext.Provider value={site}>
        <Safe name="ekran" fallback={<p className="ap-crash">Ekran açılamadı, sayfayı yenileyin.</p>}><Suspense fallback={<div className="boot" />}><Screen /></Suspense></Safe>
      </SiteContext.Provider>
    )
  }

  return (
    <SiteContext.Provider value={site}>
      <Safe name="zarf" onError={() => setOpened(true)}>
        <Intro guestName={guest?.name} onOpen={(fromTap) => { setOpened(true); if (fromTap) music.current?.play() }} />
      </Safe>
      <div className="progress" ref={bar} aria-hidden="true" />
      <Safe name="muzik"><Music key={site.music} ref={music} /></Safe>
      {!editing && (
        <button type="button" className={`lang ${tucked ? 'lang--tucked' : ''}`} onClick={switchLang} aria-label={lang === 'en' ? 'Türkçe' : 'English'}>
          <b className={lang === 'tr' ? 'is-on' : ''}>TR</b><i /><b className={lang === 'en' ? 'is-on' : ''}>EN</b>
        </button>
      )}
      <main className={`page ${opened ? 'page--opened' : ''}`}>
        <Orbs />
        <Safe name="kapak"><Hero opened={opened} /></Safe>
        <Safe name="davet"><Invite guestName={guest?.name} /></Safe>
        {show.story !== false && site.story?.length > 0 && <Safe name="hikaye"><Story /></Safe>}
        <div className="bento">
          <Safe name="tarih"><When /></Safe>
          {show.program !== false && <Safe name="program"><Program /></Safe>}
          <Safe name="mekan"><Venue onCopy={handleCopy} /></Safe>
        </div>
        {show.rsvp !== false && <Safe name="lcv"><Rsvp guest={guest} onGuest={setGuest} notify={notify} /></Safe>}
        {show.faq !== false && <Safe name="sss"><Faq /></Safe>}
        {show.gold !== false && <Safe name="altin"><Gold onCopy={handleCopy} /></Safe>}
        {show.wishes !== false && <Safe name="dilek"><Wishes notify={notify} admin={admin} /></Safe>}
        {show.memories !== false && <Safe name="anilar"><Memories notify={notify} admin={admin} /></Safe>}
        <Outro onCopy={handleCopy} notify={notify} isAdmin={Boolean(admin)} onAdmin={() => setLoginOpen(true)} />
      </main>
      <nav className={`dock ${docked && !editing ? 'dock--show' : ''}`}>
        {show.rsvp !== false && <a href="#lcv" className="dock__rsvp">{t('Katılım', 'RSVP')}</a>}
        <a href="#tarih">{t('Tarih', 'Date')}</a>
        <a href="#konum">{t('Konum', 'Venue')}</a>
        {show.memories !== false && <a href="#anilar">{t('Anılar', 'Memories')}</a>}
        {show.gold !== false && <a href="#altin" className="dock__gold">{t('Altın', 'Gold')}</a>}
      </nav>

      {admin && linkCode() && guest && !editing && (
        <GateBar guest={guest} adminKey={admin} onGuest={setGuest} notify={notify} />
      )}
      {admin && !editing && (
        <button type="button" className="admin-fab" onClick={() => setEditing(true)}>
          ✎ Düzenle
        </button>
      )}
      {admin && editing && (
        <>
          <Safe name="panel" fallback={<div className="ap-crash"><p>Panelde bir sorun çıktı 😕 Sayfayı yenileyip tekrar dene.</p><button type="button" className="abtn" onClick={() => window.location.reload()}>Sayfayı yenile</button></div>}>
          <AdminPanel site={site} adminKey={admin} notify={notify} dirty={Boolean(draft) && JSON.stringify(toSaved(draft)) !== JSON.stringify(toSaved(mergeSite(saved)))}
            saving={saving} onChange={setDraft} onSave={save} onCancel={cancel} onLogout={logout} onClose={closePanel} />
          </Safe>
        </>
      )}

      {loginOpen && !admin && (
        <Login
          onClose={() => {
            setLoginOpen(false)
            if (isLoginPath()) window.history.replaceState(null, '', '/')
          }}
          onSuccess={(token) => {
            setAdmin(token)
            setLoginOpen(false)
            setEditing(true)
            if (isLoginPath()) window.history.replaceState(null, '', '/')
            notify('Hoş geldin! Düzenlemeye başlayabilirsin ✓')
          }} />
      )}

      <div className={`toast ${toast ? 'toast--show' : ''}`} role="status">{toast}</div>
    </SiteContext.Provider>
  )
}
