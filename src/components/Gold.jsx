import { useState } from 'react'
import { useSite } from '../site'
import Section from './Section'
import { Particles, useTilt } from '../fx'
import { t } from '../i18n'

// Türk düğünlerinde takılan altınlar; İngilizcesi yabancı misafir için kısa açıklamalı
const OPTIONS = () => [
  { key: 'gram', label: t('Gram', '1 gram'), msg: t('Gram da altındır, ayıp değil! Biz seni zaten çok seviyoruz 🥹', 'A gram of gold is still gold! We already love you 🥹') },
  { key: 'ceyrek', label: t('Çeyrek', 'Quarter'), msg: t('Klasik ve şık bir tercih. Damat şu an uzaktan sana göz kırpıyor 😉', 'A classic, elegant choice. The groom is winking at you from across the room 😉') },
  { key: 'yarim', label: t('Yarım', 'Half'), msg: t('Ooo! Masanıza ekstra baklava yönlendiriliyor 🍰', 'Ooh! Extra baklava is heading to your table 🍰') },
  { key: 'tam', label: t('Tam', 'Full'), msg: t('Sen bu gecenin VIP\'sisin. Halay başı senin, mendil senin 💃', 'You are tonight\'s VIP. You lead the dance floor 💃') },
  { key: 'cumhuriyet', label: t('Cumhuriyet', 'Republic coin'), msg: t('Ayağa kalkıp alkışlıyoruz. İlk çocuğun ismini beraber düşünebiliriz 👶', 'Standing ovation! We might let you name our first child 👶') },
  { key: 'sevgi', label: t('Sadece sevgi', 'Just love'), msg: t('Sevgin başımızın tacı… ama IBAN\'a sevgi gönderilemiyor maalesef 🥲', 'Your love means the world… sadly banks don\'t accept it yet 🥲') },
]

export default function Gold({ onCopy }) {
  const config = useSite()
  const [pick, setPick] = useState(null)
  const tilt = useTilt(14)
  const options = OPTIONS()
  const current = options.find((o) => o.key === pick)
  const rawIban = config.gift.iban.replace(/\s/g, '')

  return (
    <Section id="altin" className="gold">
      <Particles kind="coin" count={12} />
      <p className="kicker kicker--gold">{t('Takı Merasimi · Dijital Şube', 'Gold ceremony · Digital branch')}</p>
      <h2 className="heading heading--light">{t(<>Altın <em>köşesi</em></>, <>The gold <em>corner</em></>)}</h2>
      <p className="gold__text">
        {t(<>
          Altın fiyatlarını biz de gördük, korkmayın 😅 Takı kuyruğunda beklemek istemeyenler,
          çeyreğini evde unutanlar ya da <em>“ben zaten EFT'ciyim”</em> diyenler için IBAN'ımızı
          buraya bırakıyoruz. Gönlünüzden ne koparsa… ama gönlünüz
          <strong> Cumhuriyet altını kadar geniş olsun</strong> 🙏
        </>, <>
          At Turkish weddings guests traditionally pin gold coins on the couple 🪙 Don't worry, we've seen
          the gold prices too 😅 If you'd rather skip the queue, forgot your coin at home or are simply
          <em> “more of a bank transfer person”</em>, here is our IBAN. Whatever your heart says…
          <strong> as long as it's as big as a Republic coin</strong> 🙏
        </>)}
      </p>

      <div className="picker">
        <p className="picker__q">{t('Peki sen ne takmayı düşünüyorsun?', 'So, what are you thinking of gifting?')}</p>
        <div className="picker__options">
          {options.map((o) => (
            <button key={o.key} type="button" className={`chip ${pick === o.key ? 'chip--active' : ''}`}
              onClick={() => setPick(o.key)}>{o.label}</button>
          ))}
        </div>
        <p className="picker__msg" key={pick} aria-live="polite">
          {current ? current.msg : t('Bir seçim yap, sana özel bir mesajımız var 👀', 'Pick one, we have a special message for you 👀')}
        </p>
      </div>

      <div className="card-wrap" ref={tilt}>
      <div className="card">
        <div className="card__top">
          <span className="card__chip" />
          <span className="card__bank">{config.gift.bank}</span>
        </div>
        <p className="card__label">IBAN</p>
        <p className="card__iban">{config.gift.iban}</p>
        <div className="card__bottom">
          <div>
            <p className="card__label">{t('Alıcı', 'Recipient')}</p>
            <p className="card__holder">{config.gift.holder}</p>
          </div>
          <span className="card__logo">{config.initials[0]}&amp;{config.initials[1]}</span>
        </div>
      </div>
      </div>

      <button className="btn btn--gold" type="button"
        onClick={() => onCopy(rawIban, t('IBAN kopyalandı! Bankacılık uygulaması seni bekliyor 💸', 'IBAN copied! Your banking app awaits 💸'))}>
        {t('IBAN\'ı Kopyala', 'Copy IBAN')}
      </button>
      <p className="gold__note">
        {t(<>
          Açıklamaya <strong>“{current ? current.label : 'Çeyrek'} niyetine 🪙”</strong> yazarsanız
          kimin ne taktığını unutmayız. (Unutmayız. Asla. 👀)
        </>, <>
          Write <strong>“{current ? current.label : 'Quarter'} 🪙”</strong> in the description
          so we remember who gave what. (We will remember. Forever. 👀)
        </>)}
      </p>
    </Section>
  )
}
