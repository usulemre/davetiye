// Davetiyenin varsayılan bilgileri. Yönetici panelinden yapılan değişiklikler bunların üzerine yazılır.
export const defaults = {
  groom: { first: 'Muhammed İsmet', last: 'Sekmen' },
  bride: { first: 'Tuğçe', last: 'Üspolat' },
  eventType: 'Düğün',

  inviteText: 'Bir akvaryumun önünde başlayan hikâyemiz, şimdi en güzel bölümüne geliyor. Hayatımızı birleştirdiğimiz bu özel günde sizi de yanımızda görmek en büyük mutluluğumuz olacak.',
  inviteTextEn: 'Our story began in front of an aquarium, and now it reaches its most beautiful chapter. It would mean the world to us to have you by our side on the day we join our lives.',
  hashtag: '#MuhammedİsmetVeTuğçe',

  theme: 'inci',

  // Bölümleri gizlemek/göstermek için
  sections: { story: true, program: true, rsvp: true, faq: true, gold: true, wishes: true, album: true, memories: true },

  // Katılım bildirimi için son tarih (ör. "1 Kasım"); boşsa yazılmaz
  rsvpDeadline: '',

  // ⚠️ TARİHİ GÜNCELLEYİN — yerel saat (Türkiye, +03:00)
  start: '2026-11-21T19:00:00+03:00',
  end: '2026-11-21T23:30:00+03:00',

  venue: {
    name: 'Beytepe Garden',
    address: 'Beytepe, Çankaya / Ankara',
    mapsQuery: 'Beytepe Garden, Çankaya, Ankara',
    // hava durumu tahmini için konum
    lat: 39.8667,
    lon: 32.7345,
  },

  // Sıkça sorulanlar (panelden düzenlenebilir)
  faq: [
    { q: 'Çocuklarımızı da getirebilir miyiz?', a: 'Elbette! Minik misafirlerimizi de aramızda görmekten mutluluk duyarız 🧸',
      qEn: 'Can we bring our children?', aEn: 'Of course! We would love to have our little guests with us 🧸' },
    { q: 'Kıyafet kuralı var mı?', a: 'Şık ve rahat olmanız yeterli. Akşam serin olabileceği için yanınıza ince bir ceket almanızı öneririz.',
      qEn: 'Is there a dress code?', aEn: 'Smart and comfortable is perfect. The evening may get cool, so a light jacket is a good idea.' },
    { q: 'Mekâna nasıl gelebilirim?', a: 'Konum bölümündeki "Yol Tarifi Al" butonuna dokunursanız telefonunuzdaki harita size yolu gösterir.',
      qEn: 'How do I get to the venue?', aEn: 'Tap "Get Directions" in the venue section and your phone\'s map will guide you.' },
    { q: 'Düğünde çektiğim fotoğrafları nasıl paylaşırım?', a: 'Anı Duvarı\'na fotoğraf ekleyebilirsiniz. Masalardaki QR kodu okutmanız yeterli; fotoğraflarınız düğün gecesi dev ekranda da görünür.',
      qEn: 'How can I share my photos from the wedding?', aEn: 'Add them to the Memory Wall: just scan the QR code on your table. Your photos will also appear on the big screen that night.' },
  ],

  // Albüm: boşsa hikâye fotoğrafları gösterilir
  album: [],
  albumMemories: false,

  // Arka plan müziği: public/ klasöründeki ses dosyası
  music: '/muzik.m4a',

  heroPhoto: '/soz.jpg',
  outroPhoto: '/yuzuk.jpg',

  story: [
    { no: '01', title: 'Teklif', photo: '/teklif.jpg', pos: '35% 50%',
      text: 'Su altında, bir dalgıç ve tek bir soru. Cevap tahmin edilebilir: Evet! 🐠',
      titleEn: 'The proposal', textEn: 'Underwater, a diver and a single question. You can guess the answer: Yes! 🐠' },
    { no: '02', title: 'Söz', photo: '/soz.jpg', pos: '50% 60%',
      text: 'Better together. Neon tabela da onayladı, artık resmî.',
      titleEn: 'The promise', textEn: 'Better together. Even the neon sign agreed, it\'s official.' },
    { no: '03', title: 'Nişan', photo: '/nisan.jpg', pos: '60% 40%',
      text: 'Yedi katlı pasta, bir pembe prenses ve kurdeleler kesildi.',
      titleEn: 'The engagement', textEn: 'A seven-tier cake, a princess in pink and ribbons cut.' },
  ],

  program: [
    { time: '19:00', title: 'Karşılama', note: 'Sarılmalar, tokalaşmalar, "ne kadar büyümüşsün"ler', titleEn: 'Welcome', noteEn: 'Hugs, handshakes and "look how you\'ve grown"s' },
    { time: '20:00', title: 'Nikâh', note: '"Evet" anı. Bu sefer su üstünde 😄', titleEn: 'Ceremony', noteEn: 'The "I do" moment. Above water this time 😄' },
    { time: '20:30', title: 'Takı Merasimi', note: 'Altınlar boyuna, kurdeleler omuza', titleEn: 'Gold ceremony', noteEn: 'Guests pin gold coins on the couple, a Turkish tradition' },
    { time: '21:00', title: 'Yemek & Eğlence', note: 'Halay başı kapışılır, dikkat', titleEn: 'Dinner & party', noteEn: 'Everyone will want to lead the halay dance, be warned' },
  ],

  // ⚠️ IBAN'I GÜNCELLEYİN
  gift: {
    holder: 'Muhammed İsmet Sekmen',
    bank: 'Banka Adı',
    iban: 'TR00 0000 0000 0000 0000 0000 00',
  },
}
