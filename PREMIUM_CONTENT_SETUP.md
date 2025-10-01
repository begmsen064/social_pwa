# 💎 Premium Content System - Kurulum Kılavuzu

## 🎯 Sistem Özeti

Bu sistem, kullanıcıların puanla satın alabilecekleri premium içerik paylaşmalarına olanak sağlar:

- **Post paylaşırken** 0, 10, 20, 30 veya 40 puan fiyat seçebilirsiniz
- **Fiyatlı postlar** feed'de blur ile gözükür
- **Kullanıcılar** puanlarıyla içeriği satın alabilir
- **Satın alınan içerik** açılır ve her zaman görülebilir
- **Puan transferi** alıcıdan satıcıya otomatik olarak gerçekleşir

---

## 📦 Kurulum Adımları

### 1️⃣ Database Migration'ı Çalıştır

Supabase Dashboard > SQL Editor'e git ve `migrations/premium_content_system.sql` dosyasındaki SQL'i çalıştır:

```bash
# SQL dosyasını aç
migrations/premium_content_system.sql
```

Bu SQL scripti şunları yapar:
- ✅ `posts` tablosuna `price` kolonu ekler
- ✅ `post_purchases` tablosu oluşturur
- ✅ RLS policies ekler
- ✅ `purchase_post()` RPC fonksiyonu oluşturur

### 2️⃣ Frontend Dependencies Kontrol

Tüm bağımlılıklar zaten mevcut olmalı:

```bash
npm install
```

### 3️⃣ Development Server'ı Başlat

```bash
npm run dev
```

---

## 🎨 Kullanıcı Deneyimi

### Post Paylaşma

1. **Yeni Post** sayfasına git
2. Medya yükle (resim/video)
3. **Premium İçerik Fiyatı** bölümünden bir fiyat seç:
   - 🆓 **Ücretsiz** - Herkes görebilir
   - 💎 **10 Puan** - Premium içerik
   - 💎 **20 Puan** - Premium içerik
   - 💎 **30 Puan** - Premium içerik
   - 💎 **40 Puan** - Premium içerik
4. Paylaş!

### Premium İçerik Görüntüleme

1. Feed'de **blurlu post** görürsünüz
2. Post'un üzerinde **"İçeriği Aç"** butonu vardır
3. Butona tıklayınca **Purchase Modal** açılır
4. Modal'da:
   - İçerik fiyatı gösterilir
   - Mevcut puanınız gösterilir
   - Yetersiz puan varsa uyarı verilir
5. **"Satın Al"** butonuna tıklayın
6. İçerik açılır ve artık her zaman görülebilir! ✅

---

## 💰 Puan Ekonomisi

### Puan Kazanma:
- 🎨 **Yeni post paylaş:** +10 puan
- ❤️ **Like al:** +2 puan
- 💬 **Yorum al:** +5 puan
- 👥 **Takipçi kazan:** +3 puan
- 🎁 **Kayıt bonusu:** +10 puan

### Puan Harcama:
- 💎 **Premium içerik satın al:** -10/-20/-30/-40 puan

### Puan Transfer:
- Satın alma anında puan **otomatik** olarak alıcıdan satıcıya transfer edilir
- Transaction-safe (atomik işlem)
- Rollback garantisi

---

## 🔒 Güvenlik

### Database Level:
- ✅ **Row Level Security (RLS)** policies
- ✅ **Transaction-safe** satın alma fonksiyonu
- ✅ Aynı post birden fazla kez satın alınamaz
- ✅ Kendi postunu satın alamazsın

### Frontend Level:
- ✅ Optimistic UI updates
- ✅ Error handling ve rollback
- ✅ Yetersiz puan kontrolü
- ✅ Loading states

---

## 🎭 Kullanıcı Senaryoları

### Senaryo 1: İçerik Üreticisi
```
1. Özel bir fotoğraf çek
2. Post oluştur, 30 puan fiyat seç
3. Paylaş
4. Kullanıcılar satın alsın
5. Puan kazan! 💰
```

### Senaryo 2: İçerik Tüketicisi
```
1. Feed'de ilginç bir blurlu post gör
2. "İçeriği Aç" butonuna tıkla
3. 20 puan öde
4. İçeriği görüntüle
5. Artık her zaman erişilebilir ✅
```

### Senaryo 3: Yetersiz Puan
```
1. Premium post gör (40 puan)
2. Puanın sadece 15
3. Uyarı mesajı al
4. Daha fazla aktivite yap
5. Puan kazan, sonra satın al
```

---

## 📊 Database Schema

### posts Tablosu
```sql
price INTEGER DEFAULT 0  -- 0 = ücretsiz, 10/20/30/40 = ücretli
```

### post_purchases Tablosu
```sql
id UUID PRIMARY KEY
post_id UUID → posts(id)
buyer_id UUID → profiles(id)
seller_id UUID → profiles(id)
price INTEGER
created_at TIMESTAMPTZ
UNIQUE(post_id, buyer_id)  -- Bir kullanıcı aynı postu bir kez alabilir
```

---

## 🔧 RPC Fonksiyonu

```sql
purchase_post(
  p_post_id UUID,
  p_buyer_id UUID,
  p_seller_id UUID,
  p_price INTEGER
) RETURNS JSON
```

Bu fonksiyon:
1. ✅ Alıcının puanını kontrol eder
2. ✅ Daha önce satın alınmış mı kontrol eder
3. ✅ Alıcıdan puan düşer
4. ✅ Satıcıya puan ekler
5. ✅ Satın alma kaydı oluşturur
6. ✅ Puan geçmişi kaydeder
7. ✅ Satıcıya bildirim gönderir

**ATOMIK:** Tüm işlemler başarılı olmazsa hiçbiri uygulanmaz!

---

## 🎨 UI Componentleri

### NewPost.tsx
- 5 seçenekli fiyat butonu grid'i
- Seçilen fiyata göre dinamik mesaj
- Emoji ile görsel feedback

### PostCard.tsx
- Blur efekti (CSS filter)
- Overlay ile lock göstergesi
- "İçeriği Aç" butonu
- Premium badge

### PurchaseModal.tsx
- Güzel animasyonlu modal
- Fiyat ve puan karşılaştırması
- Yetersiz puan uyarısı
- Success animasyonu
- Error handling

---

## 🐛 Troubleshooting

### "Yetersiz puan" hatası
```
Çözüm: Daha fazla aktivite yaparak puan kazan
- Post paylaş (+10)
- Like/yorum al (+2/+5)
- Takipçi kazan (+3)
```

### "Bu içeriği zaten satın aldınız" hatası
```
Çözüm: Normal, zaten erişimin var demektir
Blur kalkmış olmalı, sayfayı yenile
```

### RPC fonksiyonu bulunamadı hatası
```
Çözüm: SQL migration'ı çalıştırmayı unutmuşsun
migrations/premium_content_system.sql dosyasını çalıştır
```

### Blur efekti görünmüyor
```
Çözüm: Tailwind CSS'in JIT modu aktif olmalı
tailwind.config.js'de content paths doğru ayarlanmalı
```

---

## 🚀 Gelecek Geliştirmeler

- [ ] **Subscription sistemi:** Aylık abonelikle tüm premium içerik
- [ ] **Bundle satış:** Birden fazla postu paket olarak sat
- [ ] **İndirim kodları:** Promosyon kampanyaları
- [ ] **Gifting:** Başkasına içerik hediye et
- [ ] **Revenue analytics:** Kazanç istatistikleri
- [ ] **Preview:** İlk kareyi blur olmadan göster

---

## 📝 Notlar

- Kendi postlarını satın alamazsın (otomatik görünür)
- Aynı postu birden fazla kez satın alamazsın
- Satın alınan içerik kalıcıdır (süre sınırı yok)
- Puan transferi geri alınamaz
- Minimum puan 0'dır (negatife gidemez)

---

## 🎉 Tebrikler!

Premium content sistemi başarıyla kuruldu! 🎊

Artık platformunuz:
- 💎 Özel içerik ekonomisi
- 💰 Creator monetization
- 🎮 Gamification
- 🔒 Exclusive content

özelliklerine sahip!

**Farklılık tam da burada başlıyor!** 🚀
