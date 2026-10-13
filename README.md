# Muhammed İsmet & Tuğçe · Düğün Davetiyesi

Canlı site: **https://muhammed-tugce.vercel.app**

Vite + React ile yazılmış, Vercel'de çalışan dijital düğün davetiyesi ve misafir yönetim paneli.

## Misafirin gördükleri

- 3D zarf açılışı (mühür kırılır, kart çıkar), 3D altın alyanslı kapak
- Hikâyemiz, takvim + geri sayım, günün programı (düğün günü "canlı akış"), mekân ve yol tarifi (Google Haritalar, Waze)
- Kişiye özel link ile katılım bildirimi (LCV), giriş kartı + QR, salondaki masasını gösteren harita, DJ'e şarkı isteği
- Düğüne 15 gün kala hava tahmini, sıkça sorulanlar, altın köşesi / IBAN
- İyi dilekler duvarı, Anı Duvarı (fotoğraf + 1 dakikaya kadar video, beğeni, yorum)
- Instagram hikâyesi görseli, ana ekrana eklenebilir uygulama, internetsiz açılma
- Güçsüz cihazlarda kendiliğinden hafif mod (`?hafif` ile zorlanabilir)

## Yönetim paneli

Sitenin en altındaki "Yönetici girişi" ya da `/yonetici` adresi. Panelde **"Nasıl kullanılır?"** bölümü davetten düğün gününe adım adım anlatır.

- Özet ve hazırlık listesi, davetliler (Excel'den toplu ekleme, rehberden seçme, sırayla WhatsApp daveti / hatırlatma)
- Masalar (3D salon, otomatik oturtma, yazdırılabilir masa ve isim kartları), kapı girişi (QR ile)
- Bütün metinler, fotoğraflar, renkler, müzik ve bölümler
- QR kodlar ve düğün gecesi dev ekranı (`?ekran`)
- Anı Duvarı fotoğraf/video ve dileklerini ZIP olarak indirme, depolama göstergesi

## Teknik

| | |
|---|---|
| Ön yüz | Vite, React 18, düz CSS (`src/styles.css`), Three.js (3D) |
| Sunucu | Vercel Functions (`/api`), Upstash Redis (veri), Vercel Blob (dosyalar) |
| Ortam değişkenleri | `.env.local` (git'e girmez): Redis ve Blob anahtarları, `ADMIN_USERNAME`, `ADMIN_PASSWORD` |

```bash
npm install
vercel dev                                   # canlı veriyle yerel çalıştırma
DATA_PREFIX=test: vercel dev --listen 3001   # canlı veriye dokunmadan deneme
vercel deploy --prod                         # yayınlama
```

Varsayılan bilgiler (isimler, tarih, program, IBAN…) `src/config.js` dosyasındadır; panelden yapılan değişiklikler bunların üzerine yazılır. Yayına alma GitHub'daki `main` dalından Vercel projesine bağlıdır; otomatik yayın gecikirse `vercel deploy --prod` kullanılır.

`DATA_PREFIX=test:` ile çalışırken site ayarları, davetliler, dilekler ve Anı Duvarı ayrı anahtarlarda tutulur; canlı veri değişmez. Yüklenen dosyalar yine aynı Blob deposuna gider, denemeden sonra silinmelidir.
