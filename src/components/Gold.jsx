import { useState } from 'react'
import { config } from '../config'
import Section from './Section'

const OPTIONS = [
  { key: 'gram', label: 'Gram', emoji: '🪙', msg: 'Gram da altındır, ayıp değil! Biz seni zaten çok seviyoruz 🥹' },
  { key: 'ceyrek', label: 'Çeyrek', emoji: '✨', msg: 'Klasik ve şık bir tercih. Damat şu an uzaktan sana göz kırpıyor 😉' },
  { key: 'yarim', label: 'Yarım', emoji: '💛', msg: 'Ooo! Masanıza ekstra baklava yönlendiriliyor 🍰' },
  { key: 'tam', label: 'Tam', emoji: '👑', msg: 'Sen bu gecenin VIP\'sisin. Halay başı senin, mendil senin 💃' },
  { key: 'cumhuriyet', label: 'Cumhuriyet', emoji: '🏆', msg: 'Ayağa kalkıp alkışlıyoruz. İlk çocuğun ismini beraber düşünebiliriz 👶' },
  { key: 'sevgi', label: 'Sadece sevgi', emoji: '🫶', msg: 'Sevgin başımızın tacı… ama IBAN\'a sevgi gönderilemiyor maalesef 🥲' },
]

export default function Gold({ onCopy }) {
  const [pick, setPick] = useState(null)
  const current = OPTIONS.find((o) => o.key === pick)
  const rawIban = config.gift.iban.replace(/\s/g, '')

  return (
    <Section id="altin" className="gold">
      <div className="coin" aria-hidden="true"><span>₺</span></div>
      <p className="eyebrow eyebrow--gold">Takı Merasimi · Dijital Şube</p>
      <h2 className="title title--light">Altın Köşesi</h2>
      <p className="gold__text">
        Altın fiyatlarını biz de gördük, korkmayın 😅 Takı kuyruğunda beklemek istemeyenler,
        çeyreğini evde unutanlar ya da <em>“ben zaten EFT'ciyim”</em> diyenler için
        IBAN'ımızı buraya bırakıyoruz. Gönlünüzden ne koparsa… ama gönlünüz
        <strong> Cumhuriyet altını kadar geniş olsun</strong> 🙏
      </p>

      <div className="picker">
        <p className="picker__q">Peki sen ne takmayı düşünüyorsun?</p>
        <div className="picker__options">
          {OPTIONS.map((o) => (
            <button key={o.key} type="button"
              className={`chip ${pick === o.key ? 'chip--active' : ''}`}
              onClick={() => setPick(o.key)}>
              <span>{o.emoji}</span> {o.label}
            </button>
          ))}
        </div>
        <p className="picker__msg" key={pick} aria-live="polite">
          {current ? current.msg : 'Bir seçim yap, sana özel bir mesajımız var 👀'}
        </p>
      </div>

      <div className="bank-card">
        <div className="bank-card__top">
          <span className="bank-card__chip" />
          <span className="bank-card__bank">{config.gift.bank}</span>
        </div>
        <p className="bank-card__label">IBAN</p>
        <p className="bank-card__iban">{config.gift.iban}</p>
        <div className="bank-card__bottom">
          <div>
            <p className="bank-card__label">Alıcı</p>
            <p className="bank-card__holder">{config.gift.holder}</p>
          </div>
          <span className="bank-card__logo">{config.initials[0]}&amp;{config.initials[1]}</span>
        </div>
      </div>

      <button className="btn btn--gold btn--wide" type="button"
        onClick={() => onCopy(rawIban, 'IBAN kopyalandı! Bankacılık uygulaması seni bekliyor 💸')}>
        IBAN'ı Kopyala
      </button>
      <p className="gold__note">
        Not: Açıklamaya <strong>“{current ? current.label : 'Çeyrek'} niyetine 🪙”</strong> yazarsanız
        kimin ne taktığını unutmayız. (Unutmayız. Asla. 👀)
      </p>
    </Section>
  )
}
