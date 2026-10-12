// Davetiyedeki tüm bilgiler burada. Değiştirmek için sadece bu dosyayı düzenleyin.
export const config = {
  bride: { first: 'Tuğçe', last: 'Üspolat' },
  groom: { first: 'Muhammed İsmet', last: 'Sekmen' },
  initials: ['M', 'T'],

  // "Nişan", "Düğün", "Kına" ...
  eventType: 'Nişan',

  // ⚠️ TARİHİ GÜNCELLEYİN — yerel saat (Türkiye, +03:00)
  start: '2026-11-21T19:00:00+03:00',
  end: '2026-11-21T23:30:00+03:00',

  venue: {
    name: 'Beytepe Garden',
    address: 'Beytepe, Çankaya / Ankara',
    mapsQuery: 'Beytepe Garden, Çankaya, Ankara',
  },

  program: [
    { time: '19:00', title: 'Karşılama', note: 'Sarılmalar, tokalaşmalar, "ne kadar büyümüşsün"ler' },
    { time: '20:00', title: 'Tören', note: 'Mendiller hazır, duygusal anlar' },
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
