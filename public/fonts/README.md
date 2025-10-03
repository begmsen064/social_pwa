# Fonts Klasörü

Bu klasöre custom fontları ekleyebilirsin.

## Ackuma Lamuente Font Ekleme:

1. Fontu indir: https://www.fontspace.com/get/family/78og8
2. ZIP'i aç ve .ttf veya .otf dosyasını bu klasöre kopyala
3. Adını `AckumaLamuente.ttf` olarak değiştir
4. `src/index.css` dosyasına @font-face ekle

Örnek:
```css
@font-face {
  font-family: 'Ackuma Lamuente';
  src: url('/fonts/AckumaLamuente.ttf') format('truetype');
  font-weight: normal;
  font-style: normal;
}
```

5. Login.tsx ve Register.tsx'te fontFamily değerini değiştir:
```javascript
style={{ fontFamily: "'Ackuma Lamuente', system-ui" }}
```
