// Misafir tarafı için iki dil. Varsayılan Türkçe; ?lang=en, dil düğmesi ya da
// İngilizce davet linkiyle İngilizce açılır ve seçim hatırlanır.
const KEY = 'davetiye:lang'

function initial() {
  try {
    const q = new URLSearchParams(window.location.search).get('lang')
    if (q === 'en' || q === 'tr') {
      localStorage.setItem(KEY, q)
      return q
    }
    return localStorage.getItem(KEY) === 'en' ? 'en' : 'tr'
  } catch {
    return 'tr'
  }
}

let lang = initial()
if (typeof document !== 'undefined') document.documentElement.lang = lang

export const getLang = () => lang
export const locale = () => (lang === 'en' ? 'en-GB' : 'tr-TR')

export function setLang(next) {
  lang = next === 'en' ? 'en' : 'tr'
  document.documentElement.lang = lang
  try { localStorage.setItem(KEY, lang) } catch { /* gizli sekme */ }
}

// t('Türkçe', 'English'): o anki dile göre metin
export const t = (tr, en) => (lang === 'en' && en != null ? en : tr)

// Kullanıcının yazdığı içerik: İngilizcesi girildiyse o, yoksa Türkçesi
export const tx = (obj, field) => (lang === 'en' && obj?.[`${field}En`]) || obj?.[field] || ''
