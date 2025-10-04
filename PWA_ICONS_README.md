# PWA İkonları Eksik

PWA'nın düzgün çalışması için şu ikonlar eklenmeli:

## Gerekli İkonlar

1. **pwa-192x192.png** - 192x192 piksel
2. **pwa-512x512.png** - 512x512 piksel
3. **apple-touch-icon.png** - 180x180 piksel (iOS için)
4. **favicon.ico** - 32x32 piksel

## İkon Oluşturma

Bu ikonları oluşturmak için:

1. https://realfavicongenerator.net/ adresine git
2. Bir logo/ikon yükle (tercihen kırmızı tonlarında KUNDUZ logosu)
3. PWA ikonlarını oluştur
4. İndirilen dosyaları `public/` klasörüne kopyala

## Geçici Çözüm

Şu anda ikonlar olmadan da PWA çalışıyor ama:
- Ana ekrana ekle butonu çalışıyor
- Offline cache çalışıyor
- InstallPrompt görünüyor

Sadece ikonlar eksik, bu da kullanıcı deneyimini etkilemiyor.

## Mevcut Durum

- ✅ Manifest dosyası: Düzgün
- ✅ Service Worker: Çalışıyor
- ✅ InstallPrompt: Home sayfasında
- ❌ İkonlar: Eksik (görsel deneyim için gerekli)
