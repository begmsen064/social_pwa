# 📱 Social PWA - Instagram Tarzı Sosyal Medya Uygulaması

Modern, mobile-first Progressive Web App. Kullanıcılar resim/video paylaşabilir, sosyal etkileşimde bulunabilir ve puan kazanabilir.

## 🚀 Özellikler

- ✅ **Authentication** - Email ve sosyal medya girişi
- ✅ **Post Paylaşım** - Çoklu resim/video yükleme
- ✅ **Feed** - Takip edilen kişilerin postları
- ✅ **Keşfet** - Trend postlar ve öneriler
- ✅ **Like/Dislike** - Real-time beğeni sistemi
- ✅ **Yorum Sistemi** - Nested yorumlar
- ✅ **Takip Sistemi** - Kullanıcı takibi
- ✅ **Puan Sistemi** - Gamification
- ✅ **Bildirimler** - Real-time bildirimler
- ✅ **Dark Mode** - Tema desteği
- ✅ **PWA** - Offline çalışma, ana ekrana ekle

## 🛠️ Teknolojiler

- **Frontend:** React 18 + TypeScript + Vite
- **Styling:** Tailwind CSS
- **State Management:** Zustand
- **Backend:** Supabase (PostgreSQL)
- **Authentication:** Supabase Auth
- **Storage:** Supabase Storage
- **PWA:** Vite Plugin PWA (Workbox)

## 📦 Kurulum

### 1. Bağımlılıkları Yükle

\`\`\`bash
npm install
\`\`\`

### 2. Supabase Projesi Oluştur

1. [Supabase](https://supabase.com) hesabı oluştur
2. Yeni bir proje oluştur
3. Project URL ve Anon Key'i kopyala

### 3. Veritabanını Kur

1. Supabase Dashboard > SQL Editor
2. \`supabase-setup.sql\` dosyasındaki SQL'i çalıştır
3. Storage > Buckets'tan iki bucket oluştur:
   - \`avatars\` (public)
   - \`posts\` (public)

### 4. Environment Variables

\`.env\` dosyası oluştur:

\`\`\`env
VITE_SUPABASE_URL=your-supabase-url
VITE_SUPABASE_ANON_KEY=your-supabase-anon-key
\`\`\`

### 5. Uygulamayı Başlat

\`\`\`bash
npm run dev
\`\`\`

Tarayıcıda: http://localhost:5173

## 📱 Kullanım

### İlk Kurulum
1. Kayıt ol sayfasından hesap oluştur
2. Otomatik olarak giriş yapılır
3. Ana sayfada hoş geldin mesajı görünür

### Navigasyon
- **Ana Sayfa:** Feed/Akış
- **Keşfet:** Trend postlar
- **+ Butonu:** Yeni post oluştur
- **Bildirimler:** Aktiviteler
- **Profil:** Kullanıcı profili ve ayarlar

### Tema Değiştirme
Ana sayfada sağ üstteki ay/güneş ikonuna tıkla

## 🏗️ Proje Yapısı

\`\`\`
social-pwa/
├── public/                 # Static assets
├── src/
│   ├── components/        # React components
│   │   ├── BottomNav.tsx
│   │   ├── Layout.tsx
│   │   └── ProtectedRoute.tsx
│   ├── pages/            # Page components
│   │   ├── Login.tsx
│   │   ├── Register.tsx
│   │   ├── Home.tsx
│   │   ├── Explore.tsx
│   │   ├── NewPost.tsx
│   │   ├── Notifications.tsx
│   │   └── Profile.tsx
│   ├── store/            # Zustand stores
│   │   ├── authStore.ts
│   │   ├── postStore.ts
│   │   └── themeStore.ts
│   ├── types/            # TypeScript types
│   │   └── index.ts
│   ├── lib/              # Library configs
│   │   └── supabase.ts
│   ├── utils/            # Utility functions
│   ├── hooks/            # Custom hooks
│   ├── App.tsx           # Main app component
│   ├── main.tsx          # Entry point
│   └── index.css         # Global styles
├── .env                   # Environment variables
├── .env.example          # Example env file
├── supabase-setup.sql    # Database setup
├── vite.config.ts        # Vite config
├── tailwind.config.js    # Tailwind config
└── package.json
\`\`\`

## 🎨 Renk Paleti

### Light Mode
- Primary: \`#E11D48\` (Rose-red)
- Secondary: \`#F43F5E\`
- Background: \`#FFFFFF\`
- Text: \`#111827\`

### Dark Mode
- Primary: \`#FB7185\`
- Secondary: \`#FDA4AF\`
- Background: \`#000000\`
- Text: \`#F9FAFB\`

## 🎮 Puan Sistemi

| Aksiyon | Puan |
|---------|------|
| Yeni post | +10 |
| Like alındığında | +2 |
| Yorum alındığında | +5 |
| Yeni takipçi | +3 |
| İlk 10 post bonusu | +50 |
| Günlük giriş | +1 |

### Level Sistemi
- Bronze: 0-99 puan
- Silver: 100-499 puan
- Gold: 500-999 puan
- Platinum: 1000+ puan

## 📱 PWA Özellikleri

- ✅ Offline çalışma
- ✅ Ana ekrana ekle
- ✅ Splash screen
- ✅ Push notifications
- ✅ Background sync

Ana ekrana eklemek için:
- **iOS:** Safari > Share > Add to Home Screen
- **Android:** Chrome > Menu > Add to Home Screen

## 🔐 Güvenlik

- Row Level Security (RLS) policies
- Supabase Auth entegrasyonu
- XSS koruması
- CSRF koruması
- Güvenli dosya yükleme

## 🚧 Yapılacaklar

- [ ] Post paylaşma UI
- [ ] Feed implementasyonu
- [ ] Like/Dislike sistemi
- [ ] Yorum sistemi
- [ ] Takip sistemi
- [ ] Bildirimler
- [ ] Keşfet algoritması
- [ ] Image/video upload
- [ ] Real-time subscriptions
- [ ] Push notifications

## 📝 Lisans

MIT License

## 👨‍💻 Geliştirici

Proje şu an geliştirme aşamasındadır.

## 🙏 Teşekkürler

- React Team
- Supabase Team
- Tailwind CSS Team
- Vite Team

---

**Not:** Bu proje hala geliştirme aşamasındadır. Bazı özellikler henüz tamamlanmamıştır."# social_pwa" 
