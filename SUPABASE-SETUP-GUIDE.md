# 🔧 Supabase Kurulum Rehberi

## ⚠️ RLS (Row Level Security) Hatası Çözümü

Eğer kayıt olurken şu hatayı alıyorsanız:
```
new row violates row-level security policy for table "profiles"
```

Bu normal bir durumdur ve aşağıdaki adımları izleyerek çözebilirsiniz.

## 📝 Adım Adım Kurulum

### 1. Supabase Projesi Oluştur
1. https://supabase.com adresine git
2. "New Project" butonuna tıkla
3. Proje adı, database şifresi belirle
4. Region seç (yakın olan)
5. "Create Project" butonuna tıkla
6. Proje hazır olana kadar bekle (~2 dakika)

### 2. Veritabanı Tablolarını Oluştur
1. Supabase Dashboard > **SQL Editor**
2. **"New Query"** butonuna tıkla
3. `supabase-setup.sql` dosyasındaki tüm SQL kodunu yapıştır
4. **"Run"** butonuna tıkla (Ctrl + Enter)
5. ✅ "Success" mesajını gör

### 3. RLS Policies'i Düzelt
1. Supabase Dashboard > **SQL Editor**
2. **"New Query"** butonuna tıkla
3. `fix-rls-policies.sql` dosyasındaki tüm SQL kodunu yapıştır
4. **"Run"** butonuna tıkla
5. ✅ "Success" mesajını gör

### 4. Storage Buckets Oluştur
1. Supabase Dashboard > **Storage**
2. **"New bucket"** butonuna tıkla
3. Bucket adı: `avatars`
   - Public bucket: ✅ İşaretle
   - "Save" butonuna tıkla
4. Tekrar **"New bucket"** butonuna tıkla
5. Bucket adı: `posts`
   - Public bucket: ✅ İşaretle
   - "Save" butonuna tıkla

### 5. API Keys'i Kopyala
1. Supabase Dashboard > **Settings** > **API**
2. **Project URL**'i kopyala
3. **anon/public** key'i kopyala (üstteki, kısa olan DEĞİL)

### 6. .env Dosyasını Güncelle
Proje klasöründeki `.env` dosyasını aç ve şu bilgileri yapıştır:

```env
VITE_SUPABASE_URL=https://your-project-ref.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

**ÖNEMLİ:** 
- URL'de `your-project-ref` kısmı senin proje referans kodu olacak
- Anon key çok uzun bir JWT token'dır (200+ karakter)

### 7. Dev Server'ı Yeniden Başlat
```bash
# Terminal'de Ctrl+C ile mevcut server'ı durdur
npm run dev
```

## ✅ Test Et

1. Tarayıcıda http://localhost:5173 adresine git
2. **"Kayıt Ol"** butonuna tıkla
3. Formu doldur:
   - Ad Soyad: Test User
   - Kullanıcı Adı: testuser
   - Email: test@example.com
   - Şifre: 123456
4. **"Kayıt Ol"** butonuna tıkla
5. ✅ Ana sayfaya yönlendirilmelisin

## 🐛 Hata Çözümleri

### Hata: "Missing Supabase environment variables"
**Çözüm:** `.env` dosyasını kontrol et, doğru konumda olduğundan emin ol

### Hata: "Invalid API key"
**Çözüm:** Anon key'in doğru kopyalandığından emin ol (tüm token'ı kopyala)

### Hata: "Username already exists"
**Çözüm:** Farklı bir kullanıcı adı dene

### Hata: "Network error"
**Çözüm:** 
1. İnternet bağlantını kontrol et
2. Supabase projesinin aktif olduğundan emin ol
3. Supabase Dashboard'da "API" bölümünde URL'in doğru olduğunu kontrol et

### Hala RLS Hatası Alıyorsan
1. Supabase Dashboard > **Database** > **Tables** > **profiles**
2. Sağ üstte **"RLS"** toggle'ına tıkla
3. **"View policies"** butonuna tıkla
4. Bu policy'lerin olduğundan emin ol:
   - ✅ Public profiles are viewable by everyone (SELECT)
   - ✅ Users can insert own profile (INSERT)
   - ✅ Users can update own profile (UPDATE)
   - ✅ Users can delete own profile (DELETE)

## 📊 Supabase Dashboard'da Kontrol

### Kayıt olduktan sonra:
1. **Authentication > Users** - Kullanıcının göründüğünü kontrol et
2. **Table Editor > profiles** - Profilin oluştuğunu kontrol et
3. **Table Editor > user_points_history** - 10 puanlık bonusun eklendiğini kontrol et

## 🎯 Özet Checklist

- [ ] Supabase projesi oluşturuldu
- [ ] `supabase-setup.sql` çalıştırıldı
- [ ] `fix-rls-policies.sql` çalıştırıldı
- [ ] `avatars` bucket oluşturuldu (public)
- [ ] `posts` bucket oluşturuldu (public)
- [ ] `.env` dosyası güncellendi
- [ ] Dev server yeniden başlatıldı
- [ ] Test kaydı başarılı oldu

## 🚀 Başarılı Setup Sonrası

Kayıt başarılı olduktan sonra şunları görebilirsin:
- ✅ Hoş geldin mesajı
- ✅ Toplam puan: 10 🏆
- ✅ Bottom navigation (5 menü)
- ✅ Dark/Light mode toggle
- ✅ Profil sayfasında kullanıcı bilgileri

## 📞 Yardım

Sorun yaşıyorsan:
1. Browser console'u aç (F12) ve hataları kontrol et
2. Supabase Dashboard > **Logs** bölümünden database loglarını kontrol et
3. `.env` dosyasının doğru konumda olduğundan emin ol (proje root'unda)