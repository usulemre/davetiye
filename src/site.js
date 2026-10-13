import { createContext, useContext } from 'react'
import { defaults } from './config'

export const THEMES = {
  inci: { label: 'İnci & Cam (3D)', ink: '#2d2830', paper: '#f8f5f2', ivory: '#efe9e3', champagne: '#b38d58', champagneHi: '#ecdcc4' },
  romantik: { label: 'Romantik Pudra & Altın', ink: '#4b3a3a', paper: '#fffaf7', ivory: '#f9eeea', champagne: '#bf9a6a', champagneHi: '#efd5cb' },
  siyah: { label: 'Siyah & Şampanya', ink: '#141414', paper: '#fbf9f6', ivory: '#f6f2ec', champagne: '#b8976a', champagneHi: '#e6d1ab' },
  lacivert: { label: 'Gece Mavisi & Altın', ink: '#14203a', paper: '#f9f8f5', ivory: '#eef0f4', champagne: '#b08d4f', champagneHi: '#e3c992' },
  zumrut: { label: 'Zümrüt & Altın', ink: '#123227', paper: '#faf9f4', ivory: '#eef2ec', champagne: '#a8894e', champagneHi: '#e2cc97' },
  bordo: { label: 'Bordo & Altın', ink: '#3a1420', paper: '#fbf8f6', ivory: '#f5ecec', champagne: '#b38a5a', champagneHi: '#ead0aa' },
  pudra: { label: 'Pudra & Gül', ink: '#3b2a2c', paper: '#fdf9f8', ivory: '#f7ebe8', champagne: '#c08a7d', champagneHi: '#f0cfc6' },
  lavanta: { label: 'Lavanta & Gümüş', ink: '#2a2638', paper: '#fbfafc', ivory: '#f0edf5', champagne: '#8f86a8', champagneHi: '#d9d2ea' },
}

const HEX = /^#[0-9a-f]{6}$/i

export function themeColors(site) {
  const base = THEMES[site.theme] || THEMES.inci
  const custom = site.customTheme || {}
  const pick = (k) => (HEX.test(custom[k] || '') ? custom[k] : base[k])
  return { ink: pick('ink'), paper: pick('paper'), ivory: pick('ivory'), champagne: pick('champagne'), champagneHi: pick('champagneHi') }
}

export function applyTheme(site) {
  const c = themeColors(site)
  const root = document.documentElement.style
  root.setProperty('--ink', c.ink)
  root.setProperty('--paper', c.paper)
  root.setProperty('--ivory', c.ivory)
  root.setProperty('--champagne', c.champagne)
  root.setProperty('--champagne-hi', c.champagneHi)
  document.querySelector('meta[name="theme-color"]')?.setAttribute('content', c.ink)
}

// Kaydedilmiş metin varsayılanla aynıysa, varsayılanın hazır İngilizcesini kullan
function borrowEn(list, base, fields) {
  if (!Array.isArray(list)) return list
  return list.map((item) => {
    const out = { ...item }
    for (const f of fields) {
      if (out[`${f}En`]) continue
      const match = base.find((b) => b[f] && b[f].trim() === String(item[f] || '').trim() && b[`${f}En`])
      if (match) out[`${f}En`] = match[`${f}En`]
    }
    return out
  })
}

// Kaydedilmiş ayarları varsayılanlarla birleştir
export function mergeSite(saved = {}) {
  const obj = (k) => ({ ...defaults[k], ...(saved[k] || {}) })
  const site = {
    ...defaults,
    ...saved,
    groom: obj('groom'),
    bride: obj('bride'),
    venue: obj('venue'),
    gift: obj('gift'),
    sections: obj('sections'),
  }
  site.story = borrowEn(site.story, defaults.story, ['title', 'text'])
  site.program = borrowEn(site.program, defaults.program, ['title', 'note'])
  site.faq = borrowEn(site.faq, defaults.faq, ['q', 'a'])
  if (!site.inviteTextEn && site.inviteText === defaults.inviteText) site.inviteTextEn = defaults.inviteTextEn
  site.initials = [site.groom.first.charAt(0) || '·', site.bride.first.charAt(0) || '·']
  return site
}

export const SiteContext = createContext(mergeSite())
export const useSite = () => useContext(SiteContext)
