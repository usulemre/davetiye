// Davetiyedeki tüm bilgiler burada. Değiştirmek için sadece bu dosyayı düzenleyin.
export const config = {
  groom: { first: 'Muhammed İsmet', last: 'Sekmen' },
  bride: { first: 'Tuğçe', last: 'Üspolat' },
  initials: ['M', 'T'],

  eventType: 'Düğün',

  // ⚠️ TARİHİ GÜNCELLEYİN — yerel saat (Türkiye, +03:00)
  start: '2026-11-21T19:00:00+03:00',
  end: '2026-11-21T23:30:00+03:00',

  venue: {
    name: 'Beytepe Garden',
    address: 'Beytepe, Çankaya / Ankara',
    mapsQuery: 'Beytepe Garden, Çankaya, Ankara',
  },

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
