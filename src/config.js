// Davetiyenin varsayılan bilgileri. Yönetici panelinden yapılan değişiklikler bunların üzerine yazılır.
export const defaults = {
  groom: { first: 'Muhammed İsmet', last: 'Sekmen' },
  bride: { first: 'Tuğçe', last: 'Üspolat' },
  eventType: 'Düğün',

  inviteText: 'Bir akvaryumun önünde başlayan hikâyemiz, şimdi en güzel bölümüne geliyor. Hayatımızı birleştirdiğimiz bu özel günde sizi de yanımızda görmek en büyük mutluluğumuz olacak.',
  hashtag: '#MuhammedİsmetVeTuğçe',

  theme: 'inci',

  // Bölümleri gizlemek/göstermek için
  sections: { story: true, program: true, rsvp: true, gold: true, memories: true },

  // Katılım bildirimi için son tarih (ör. "1 Kasım"); boşsa yazılmaz
  rsvpDeadline: '',

  // ⚠️ TARİHİ GÜNCELLEYİN — yerel saat (Türkiye, +03:00)
  start: '2026-11-21T19:00:00+03:00',
  end: '2026-11-21T23:30:00+03:00',

  venue: {
    name: 'Beytepe Garden',
    address: 'Beytepe, Çankaya / Ankara',
    mapsQuery: 'Beytepe Garden, Çankaya, Ankara',
  },

  // Arka plan müziği: public/ klasöründeki ses dosyası
  music: '/muzik.m4a',

  heroPhoto: '/soz.jpg',
  outroPhoto: '/yuzuk.jpg',

  story: [
    { no: '01', title: 'Teklif', photo: '/teklif.jpg', pos: '35% 50%',
      text: 'Su altında, bir dalgıç ve tek bir soru. Cevap tahmin edilebilir: Evet! 🐠' },
    { no: '02', title: 'Söz', photo: '/soz.jpg', pos: '50% 60%',
      text: 'Better together. Neon tabela da onayladı, artık resmî.' },
    { no: '03', title: 'Nişan', photo: '/nisan.jpg', pos: '60% 40%',
      text: 'Yedi katlı pasta, bir pembe prenses ve kurdeleler kesildi.' },
  ],

  program: [
    { time: '19:00', title: 'Karşılama', note: 'Sarılmalar, tokalaşmalar, "ne kadar büyümüşsün"ler' },
    { time: '20:00', title: 'Nikâh', note: '"Evet" anı. Bu sefer su üstünde 😄' },
    { time: '20:30', title: 'Takı Merasimi', note: 'Altınlar boyuna, kurdeleler omuza' },
    { time: '21:00', title: 'Yemek & Eğlence', note: 'Halay başı kapışılır, dikkat' },
  ],

  // ⚠️ IBAN'I GÜNCELLEYİN
  gift: {
    holder: 'Muhammed İsmet Sekmen',
    bank: 'Banka Adı',
    iban: 'TR00 0000 0000 0000 0000 0000 00',
  },
}
