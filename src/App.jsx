import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { copyText } from './hooks'
import { SiteContext, mergeSite, applyTheme } from './site'
import { getAdminKey, verifyAdmin, forgetAdmin } from './admin'
import Intro from './components/Intro'
import Music from './components/Music'
import Hero from './components/Hero'
import Story from './components/Story'
import Gold from './components/Gold'
import Memories from './components/Memories'
import AdminPanel from './components/AdminPanel'
import { Invite, When, Program, Venue, Outro } from './components/Sections'

// Kaydedilecek veriden türetilmiş alanları çıkar
const toSaved = ({ initials, ...rest }) => rest

export default function App() {
  const [saved, setSaved] = useState(null)
  const [draft, setDraft] = useState(null)
  const [admin, setAdmin] = useState(null)
  const [editing, setEditing] = useState(false)
  const [saving, setSaving] = useState(false)
  const [opened, setOpened] = useState(false)
  const [toast, setToast] = useState(null)
  const [docked, setDocked] = useState(false)
  const timer = useRef()
  const music = useRef(null)

  // Kaydedilmiş site ayarlarını yükle
  useEffect(() => {
    const fallback = setTimeout(() => setSaved((s) => s ?? {}), 3000)
    fetch('/api/config')
      .then((r) => (r.ok ? r.json() : { config: {} }))
      .then((d) => setSaved(d.config || {}))
      .catch(() => setSaved({}))
      .finally(() => clearTimeout(fallback))
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
    setToast(message)
    clearTimeout(timer.current)
    timer.current = setTimeout(() => setToast(null), 2600)
  }, [])

  const handleCopy = useCallback(async (text, message) => {
    const ok = await copyText(text)
    notify(ok ? message : 'Kopyalanamadı, elle seçip kopyalayabilirsiniz')
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
    forgetAdmin()
    setAdmin(null)
    setDraft(null)
    setEditing(false)
  }

  // Ayarlar yüklenene kadar varsayılan bilgilerin bir anlığına görünmesini engelle
  if (saved === null) return <div className="boot" />

  const show = site.sections

  return (
    <SiteContext.Provider value={site}>
      <Intro onOpen={(fromTap) => { setOpened(true); if (fromTap) music.current?.play() }} />
      <Music key={site.music} ref={music} />
      <main className={`page ${opened ? 'page--opened' : ''}`}>
        <Hero />
        <Invite />
        {show.story !== false && site.story?.length > 0 && <Story />}
        <When />
        {show.program !== false && <Program />}
        <Venue onCopy={handleCopy} />
        {show.gold !== false && <Gold onCopy={handleCopy} />}
        {show.memories !== false && <Memories notify={notify} admin={admin} />}
        <Outro onCopy={handleCopy} />
      </main>
      <nav className={`dock ${docked && !editing ? 'dock--show' : ''}`}>
        <a href="#tarih">Tarih</a>
        <a href="#konum">Konum</a>
        {show.memories !== false && <a href="#anilar">Anılar</a>}
        {show.gold !== false && <a href="#altin" className="dock__gold">Altın</a>}
      </nav>

      {admin && !editing && (
        <button type="button" className="admin-fab" onClick={() => { setEditing(true); setDraft((d) => d ?? site) }}>
          ✎ Düzenle
        </button>
      )}
      {admin && editing && (
        <>
          <AdminPanel site={site} adminKey={admin} notify={notify} dirty={Boolean(draft) && JSON.stringify(toSaved(draft)) !== JSON.stringify(toSaved(mergeSite(saved)))}
            saving={saving} onChange={setDraft} onSave={save} onCancel={cancel} onLogout={logout} onClose={closePanel} />
        </>
      )}

      <div className={`toast ${toast ? 'toast--show' : ''}`} role="status">{toast}</div>
    </SiteContext.Provider>
  )
}
