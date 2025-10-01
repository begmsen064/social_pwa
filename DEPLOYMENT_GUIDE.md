# 🚀 Deployment Guide - Siteyi Canlıya Alma Rehberi

## 📋 İÇİNDEKİLER
1. [Vercel (ÖNERİLEN)](#vercel)
2. [Netlify](#netlify)
3. [GitHub Pages](#github-pages)
4. [Railway](#railway)
5. [Render](#render)
6. [AWS Amplify](#aws-amplify)
7. [Firebase Hosting](#firebase-hosting)
8. [Kendi Sunucunuz (VPS)](#vps)

---

## 1️⃣ VERCEL (ÖNERİLEN) ⭐⭐⭐⭐⭐

### ✅ Avantajlar
- Tamamen ücretsiz (hobby plan)
- Vite/React için optimize
- Otomatik HTTPS + CDN
- Her commit'te otomatik deploy
- PWA desteği mükemmel
- Domain bağlama ücretsiz

### 📦 Kurulum

#### Yöntem 1: Web UI (En Kolay)

**1. Hesap Oluştur**
```
https://vercel.com/signup
```
- GitHub ile giriş yap (önerilen)

**2. Projeyi GitHub'a Yükle** (eğer henüz yüklemediysen)
```powershell
# Git başlat (eğer yoksa)
git init

# .gitignore kontrol et (node_modules, .env dahil olmalı)
# Sonra commit
git add .
git commit -m "Initial commit"

# GitHub'da yeni repo oluştur (web'den)
# Sonra push
git remote add origin https://github.com/KULLANICI_ADIN/REPO_ADIN.git
git branch -M main
git push -u origin main
```

**3. Vercel'de Import Et**
- Vercel dashboard → "Add New" → "Project"
- GitHub repo'nu seç
- "Import" bas

**4. Ayarları Yapılandır**
```
Framework Preset: Vite
Build Command: npm run build
Output Directory: dist
Install Command: npm install
```

**5. Environment Variables (ÖNEMLİ!)**
```
VITE_SUPABASE_URL=your_supabase_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
```

**6. Deploy!**
- "Deploy" butonuna bas
- 1-2 dakika bekle
- Site canlı! 🎉

**Sonuç:**
```
https://your-project.vercel.app
```

---

#### Yöntem 2: Vercel CLI (Terminal)

```powershell
# Vercel CLI kur
npm install -g vercel

# Projen dizininde
cd C:\Users\root\Desktop\social-pwa

# Login
vercel login

# Deploy
vercel

# Production deploy
vercel --prod
```

**Environment Variables Ekle (CLI):**
```powershell
vercel env add VITE_SUPABASE_URL
vercel env add VITE_SUPABASE_ANON_KEY
```

---

### 🔄 Otomatik Deploy

Her commit'te otomatik deploy:
```powershell
git add .
git commit -m "New feature"
git push
```
→ Vercel otomatik deploy eder!

---

### 🌐 Custom Domain Bağlama

**1. Vercel Dashboard'da:**
- Project Settings → Domains
- Domain adını gir: `mysocialapp.com`

**2. DNS Ayarları (domain sağlayıcında):**
```
Type: A
Name: @
Value: 76.76.21.21

Type: CNAME
Name: www
Value: cname.vercel-dns.com
```

**3. SSL Otomatik!**
Vercel otomatik HTTPS sertifikası ekler.

---

## 2️⃣ NETLIFY ⭐⭐⭐⭐⭐

### ✅ Avantajlar
- Ücretsiz
- Drag & drop deploy
- Form handling (bonus)
- Serverless functions
- Split testing

### 📦 Kurulum

**1. Build Oluştur**
```powershell
npm run build
```
→ `dist` klasörü oluşur

**2. Netlify'a Git**
```
https://app.netlify.com
```

**3. Drag & Drop**
- "Sites" → "Add new site" → "Deploy manually"
- `dist` klasörünü sürükle bırak
- Deploy! 🎉

**Veya GitHub Entegrasyonu:**
- "Import from Git" → GitHub repo seç
- Build settings:
```
Build command: npm run build
Publish directory: dist
```

**4. Environment Variables**
- Site settings → Build & deploy → Environment
```
VITE_SUPABASE_URL=...
VITE_SUPABASE_ANON_KEY=...
```

**Sonuç:**
```
https://your-app.netlify.app
```

---

### 📝 netlify.toml (Opsiyonel)

Proje root'una ekle:
```toml
[build]
  command = "npm run build"
  publish = "dist"

[[redirects]]
  from = "/*"
  to = "/index.html"
  status = 200

[build.environment]
  NODE_VERSION = "18"
```

---

## 3️⃣ GITHUB PAGES ⭐⭐⭐

### ✅ Avantajlar
- Tamamen ücretsiz
- GitHub entegrasyonu
- Kolay

### ⚠️ Dezavantajlar
- Sadece static site
- Environment variables yok (client-side hardcode gerekir)

### 📦 Kurulum

**1. GitHub Pages Deploy Package**
```powershell
npm install --save-dev gh-pages
```

**2. package.json Düzenle**
```json
{
  "homepage": "https://KULLANICI_ADIN.github.io/REPO_ADIN",
  "scripts": {
    "predeploy": "npm run build",
    "deploy": "gh-pages -d dist"
  }
}
```

**3. vite.config.ts Düzenle**
```typescript
export default defineConfig({
  base: '/REPO_ADIN/',
  // ... diğer ayarlar
})
```

**4. Deploy**
```powershell
npm run deploy
```

**Sonuç:**
```
https://KULLANICI_ADIN.github.io/REPO_ADIN
```

---

## 4️⃣ RAILWAY ⭐⭐⭐⭐

### ✅ Avantajlar
- Ücretsiz tier (aylık $5 kredi)
- Full-stack support
- Database hosting
- Docker support

### 📦 Kurulum

**1. Railway'e Git**
```
https://railway.app
```

**2. "Deploy from GitHub"**
- Repo seç
- Otomatik detect eder

**3. Environment Variables**
```
VITE_SUPABASE_URL=...
VITE_SUPABASE_ANON_KEY=...
```

**4. Deploy!**

---

## 5️⃣ RENDER ⭐⭐⭐⭐

### ✅ Avantajlar
- Ücretsiz static site hosting
- Auto HTTPS
- Global CDN
- Custom domains

### 📦 Kurulum

**1. Render'a Git**
```
https://render.com
```

**2. New Static Site**
- GitHub repo bağla
- Build Command: `npm run build`
- Publish Directory: `dist`

**3. Environment Variables**
```
VITE_SUPABASE_URL=...
VITE_SUPABASE_ANON_KEY=...
```

---

## 6️⃣ AWS AMPLIFY ⭐⭐⭐

### ✅ Avantajlar
- AWS güvenilirliği
- Global CDN (CloudFront)
- CI/CD built-in

### 📦 Kurulum

**1. AWS Console**
```
https://console.aws.amazon.com/amplify
```

**2. "Host your web app"**
- GitHub bağla
- Build settings:
```yaml
version: 1
frontend:
  phases:
    preBuild:
      commands:
        - npm ci
    build:
      commands:
        - npm run build
  artifacts:
    baseDirectory: dist
    files:
      - '**/*'
  cache:
    paths:
      - node_modules/**/*
```

**3. Environment Variables**
```
VITE_SUPABASE_URL=...
VITE_SUPABASE_ANON_KEY=...
```

---

## 7️⃣ FIREBASE HOSTING ⭐⭐⭐⭐

### ✅ Avantajlar
- Google'ın CDN'i
- Ücretsiz SSL
- Güçlü

### 📦 Kurulum

**1. Firebase CLI Kur**
```powershell
npm install -g firebase-tools
```

**2. Login**
```powershell
firebase login
```

**3. Proje Başlat**
```powershell
firebase init hosting
```

**Ayarlar:**
```
Public directory: dist
Single-page app: Yes
GitHub actions: No (şimdilik)
```

**4. Build & Deploy**
```powershell
npm run build
firebase deploy
```

**Sonuç:**
```
https://your-project.web.app
```

---

## 8️⃣ KENDİ SUNUCUNUZ (VPS) ⭐⭐⭐

### ✅ Ne Zaman Kullanılır?
- Tam kontrol istiyorsanız
- Backend'iniz varsa
- Özel domain + full customization

### 🖥️ Sağlayıcılar
- DigitalOcean ($4/ay)
- Linode ($5/ay)
- Vultr ($3.5/ay)
- Hetzner (€3/ay)

### 📦 Kurulum (Ubuntu + Nginx)

**1. VPS'e Bağlan**
```bash
ssh root@YOUR_IP
```

**2. Node.js Kur**
```bash
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt-get install -y nodejs
```

**3. Nginx Kur**
```bash
sudo apt update
sudo apt install nginx
```

**4. Projeyi Yükle**
```bash
cd /var/www
git clone https://github.com/USER/REPO.git social-pwa
cd social-pwa
npm install
npm run build
```

**5. Nginx Ayarla**
```bash
sudo nano /etc/nginx/sites-available/social-pwa
```

```nginx
server {
    listen 80;
    server_name your-domain.com www.your-domain.com;

    root /var/www/social-pwa/dist;
    index index.html;

    location / {
        try_files $uri $uri/ /index.html;
    }

    # Gzip compression
    gzip on;
    gzip_types text/plain text/css application/json application/javascript text/xml application/xml application/xml+rss text/javascript;

    # Cache static assets
    location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg|woff|woff2|ttf|eot)$ {
        expires 1y;
        add_header Cache-Control "public, immutable";
    }
}
```

**6. Aktif Et**
```bash
sudo ln -s /etc/nginx/sites-available/social-pwa /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl restart nginx
```

**7. SSL (Let's Encrypt)**
```bash
sudo apt install certbot python3-certbot-nginx
sudo certbot --nginx -d your-domain.com -d www.your-domain.com
```

**8. Auto-Renewal**
```bash
sudo systemctl enable certbot.timer
```

---

## 🔐 GÜVENLİK KONTROL LİSTESİ

### ✅ Deployment Öncesi

- [ ] `.env` dosyası `.gitignore`'da
- [ ] Supabase RLS (Row Level Security) aktif
- [ ] API keys sadece environment variables'da
- [ ] HTTPS aktif (SSL)
- [ ] CORS ayarları doğru
- [ ] Rate limiting aktif (Supabase tarafında)

### 🔒 Environment Variables

**ÖNEMLİ:** Asla kodda hard-code etmeyin!

**❌ YANLIŞ:**
```typescript
const supabase = createClient(
  'https://xxx.supabase.co',
  'eyJhbGc...'
)
```

**✅ DOĞRU:**
```typescript
const supabase = createClient(
  import.meta.env.VITE_SUPABASE_URL,
  import.meta.env.VITE_SUPABASE_ANON_KEY
)
```

---

## 📊 KARŞILAŞTIRMA TABLOSU

| Platform | Ücretsiz Plan | Kolay Kurulum | PWA Desteği | Custom Domain | Auto Deploy | SSL |
|----------|---------------|---------------|-------------|---------------|-------------|-----|
| **Vercel** | ✅ Sınırsız | ⭐⭐⭐⭐⭐ | ✅ Mükemmel | ✅ Ücretsiz | ✅ | ✅ |
| **Netlify** | ✅ 100GB/ay | ⭐⭐⭐⭐⭐ | ✅ Mükemmel | ✅ Ücretsiz | ✅ | ✅ |
| **GitHub Pages** | ✅ Sınırsız | ⭐⭐⭐⭐ | ⚠️ İyi | ✅ Ücretsiz | ✅ | ✅ |
| **Railway** | ⚠️ $5/ay kredi | ⭐⭐⭐⭐ | ✅ | ✅ Ücretsiz | ✅ | ✅ |
| **Render** | ✅ 100GB/ay | ⭐⭐⭐⭐ | ✅ | ✅ Ücretsiz | ✅ | ✅ |
| **AWS Amplify** | ⚠️ 12 ay ücretsiz | ⭐⭐⭐ | ✅ | ✅ Ücretli | ✅ | ✅ |
| **Firebase** | ✅ 10GB/ay | ⭐⭐⭐⭐ | ✅ Mükemmel | ✅ Ücretsiz | ⚠️ | ✅ |
| **VPS** | ❌ $3-5/ay | ⭐⭐ | ✅ | ✅ | ❌ Manuel | ⚠️ Manuel |

---

## 🎯 TAVSİYEM

### Senin Projen İçin En İyi Seçim:

**🥇 1. VERCEL** (en kolay + en iyi)
- GitHub'a push → otomatik deploy
- PWA mükemmel çalışır
- Supabase ile süper uyumlu
- Ücretsiz custom domain

**🥈 2. NETLIFY** (alternatif)
- Vercel'e çok benzer
- Biraz daha fazla özellik
- Form handling varsa bonus

**🥉 3. FIREBASE HOSTING** (Google seviyorsan)
- Google'ın CDN'i
- Güvenilir
- Biraz daha karmaşık

---

## 🚀 HIZLI BAŞLANGIÇ (5 DAKİKA)

**EN HIZLI YÖNTEM:**

1. GitHub'a push:
```powershell
git init
git add .
git commit -m "Initial commit"
git remote add origin https://github.com/USERNAME/social-pwa.git
git push -u origin main
```

2. Vercel'e git: https://vercel.com
3. "New Project" → GitHub repo seç
4. Environment Variables ekle
5. Deploy!

**BITTI!** 🎉

---

## 🐛 SORUN GİDERME

### Build Hatası
```powershell
# Local'de test et
npm run build
npm run preview
```

### Environment Variables Çalışmıyor
- Vercel/Netlify'da tekrar ekle
- Redeploy yap
- `VITE_` prefix'i olmalı

### 404 Hatası
- SPA routing için `_redirects` veya config gerekli
- Vercel otomatik halleder
- Netlify için `_redirects` dosyası:
```
/* /index.html 200
```

### PWA Çalışmıyor
- HTTPS olmalı (localhost hariç)
- `manifest.json` doğru path'te mi?
- Service worker register oldu mu?

---

## 📞 YARDIM

Herhangi bir sorun yaşarsan, deployment loglarına bak:
- Vercel: Dashboard → Deployments → Log
- Netlify: Deploys → Deploy log

---

## 🎉 TEBR İKLER!

Siteniz canlı olunca:
- [ ] PWA'yı telefonuna indir test et
- [ ] Lighthouse score kontrol et
- [ ] Social media'da paylaş
- [ ] Analytics ekle (Google Analytics, Plausible)

**Başarılar!** 🚀
