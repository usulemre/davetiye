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

// Sunucudan gelen Türkçe uyarıların İngilizcesi (İngilizce misafir için)
const SERVER = {
  'Davet bulunamadı': 'Invitation not found',
  'Lütfen katılım durumunu seçin': 'Please choose whether you can come',
  'Lütfen adınızı ve soyadınızı yazın': 'Please enter your full name',
  'Çok fazla deneme yapıldı, biraz sonra tekrar deneyin': 'Too many attempts, please try again a little later',
  'Şu an bildirim alınamıyor': 'Replies cannot be received right now',
  'Çok fazla istek': 'Too many requests',
  'Lütfen adınızı ve dileğinizi yazın': 'Please add your name and wish',
  'Dileklere bağlantı (link) eklenemiyor': 'Links cannot be added to wishes',
  'Yorumlara bağlantı (link) eklenemiyor': 'Links cannot be added to comments',
  'Nota bağlantı (link) eklenemiyor': 'Links cannot be added to notes',
  'Çok hızlı gönderiyorsunuz, biraz bekleyin 😄': 'You are sending too fast, please wait a moment 😄',
  'Çok hızlı yorum yapıyorsunuz, biraz bekleyin 😄': 'You are commenting too fast, please wait a moment 😄',
  'Çok fazla paylaşım yaptınız, biraz sonra tekrar deneyin.': 'You have shared a lot, please try again a little later.',
  'Çok fazla fotoğraf yüklendi, biraz sonra tekrar deneyin.': 'Too many photos uploaded, please try again a little later.',
  'Bir saatte en fazla 8 video paylaşılabilir, biraz sonra tekrar deneyin.': 'Up to 8 videos can be shared per hour, please try again later.',
  'Depolama alanı dolmak üzere, şu an video yüklenemiyor. Fotoğraf paylaşabilirsiniz 📸': 'Storage is almost full, videos cannot be uploaded right now. You can still share photos 📸',
  'Depolama alanı doldu, şu an yükleme yapılamıyor.': 'Storage is full, uploads are paused.',
  'Eksik bilgi': 'Missing information',
  'Bulunamadı': 'Not found',
  'Yavaş 😄': 'Slow down 😄',
  'Bir şeyler ters gitti': 'Something went wrong',
}
export const serverMsg = (msg) => (lang === 'en' && SERVER[msg]) || msg
