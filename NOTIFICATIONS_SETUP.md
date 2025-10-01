# Bildirimler Kurulumu 🔔

Bildirimler sayfası başarıyla oluşturuldu! Ancak çalışması için Supabase'de birkaç SQL scripti çalıştırmanız gerekiyor.

## 📋 Adımlar

### 1. Supabase Dashboard'a Git
1. https://supabase.com adresine giriş yapın
2. Projenizi seçin
3. Sol menüden **SQL Editor** seçeneğine tıklayın

### 2. RLS Politikalarını Düzelt
**Dosya:** `fix-notifications-rls.sql`

Bu script, bildirimlerin oluşturulması ve silinmesi için gerekli politikaları ekler.

```sql
-- Dosyanın içeriğini kopyalayıp SQL Editor'e yapıştırın ve çalıştırın
```

### 3. Bildirim Trigger'larını Oluştur
**Dosya:** `create-notification-triggers.sql`

Bu script, otomatik bildirim oluşturma mekanizmasını kurar:
- ❤️ Birisi postunu beğendiğinde bildirim
- 💬 Birisi postuna yorum yaptığında bildirim
- 👥 Birisi seni takip ettiğinde bildirim

```sql
-- Dosyanın içeriğini kopyalayıp SQL Editor'e yapıştırın ve çalıştırın
```

## ✨ Özellikler

### 📱 Bildirim Tipleri
- **Like (Beğeni)**: Kırmızı kalp ikonu ile
- **Comment (Yorum)**: Mavi mesaj balonu ikonu ile
- **Follow (Takip)**: Yeşil kullanıcı ikonu ile

### 🎯 Fonksiyonlar
- ✅ Gerçek zamanlı bildirim güncellemeleri (Supabase Realtime)
- ✅ Okundu/Okunmadı durumu
- ✅ "Tümünü okundu işaretle" özelliği
- ✅ Filtreleme (Tümü / Okunmamış)
- ✅ Bildirim silme
- ✅ Post thumbnail'i ile görsel önizleme
- ✅ Avatar desteği
- ✅ Zaman gösterimi (örn: "5 dakika önce")
- ✅ Tıklama ile ilgili sayfaya yönlendirme

### 🎨 UI Özellikleri
- Modern ve temiz tasarım
- Dark mode desteği
- Okunmamış bildirimler için mavi arka plan
- Hover efekti ile silme butonu
- Smooth animations
- Sticky header

## 🧪 Test Etme

Bildirimleri test etmek için:

1. **Like Bildirimi**: Başka bir kullanıcının postunu beğen
2. **Comment Bildirimi**: Başka bir kullanıcının postuna yorum yap
3. **Follow Bildirimi**: Başka bir kullanıcıyı takip et

## 🔒 Güvenlik

- Row Level Security (RLS) etkin
- Kullanıcılar sadece kendi bildirimlerini görebilir
- Kullanıcılar sadece kendi bildirimlerini silebilir
- Otomatik cleanup: Unlike/Unfollow yapıldığında bildirim silinir

## 📊 Performans

- İndeksleme ile hızlı sorgular
- Realtime subscription ile anlık güncellemeler
- 50 bildiririmle sınırlı (değiştirilebilir)
- Optimize edilmiş Supabase query'leri

## 🎉 Tamamlandı!

SQL scriptlerini çalıştırdıktan sonra bildirimler sayfası tamamen çalışır durumda olacak!