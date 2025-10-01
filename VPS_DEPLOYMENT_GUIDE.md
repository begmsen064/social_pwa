# 🖥️ VPS Deployment Guide - Detaylı Sunucu Kurulum Rehberi

## 🎯 **VPS NEDİR ve NEDEN KULLANILIR?**

**VPS (Virtual Private Server)** = Kendi sanal sunucunuz
- ✅ Tam kontrol (root erişimi)
- ✅ İstediğiniz her şeyi kurabilirsiniz
- ✅ Backend + Frontend birlikte
- ✅ Database yönetimi
- ✅ Unlimited bandwidth (çoğu sağlayıcıda)
- ✅ Özel domain + SSL
- ⚠️ Biraz teknik bilgi gerekir
- ⚠️ Aylık $3-10 arası maliyet

---

## 💰 **VPS SAĞLAYICILAR (Fiyat Karşılaştırması)**

### 🔥 **ÖNERİLEN (Ucuz + İyi)**

| Sağlayıcı | Fiyat | RAM | Disk | CPU | Bant | Lokasyon |
|-----------|-------|-----|------|-----|------|----------|
| **Contabo** | €3.99/ay | 4GB | 50GB | 2 vCPU | 32TB | Almanya/ABD |
| **Hetzner** | €4.51/ay | 4GB | 40GB | 2 vCPU | 20TB | Almanya/Finlandiya |
| **DigitalOcean** | $6/ay | 1GB | 25GB | 1 vCPU | 1TB | Global |
| **Vultr** | $6/ay | 1GB | 25GB | 1 vCPU | 1TB | Global |
| **Linode (Akamai)** | $5/ay | 1GB | 25GB | 1 vCPU | 1TB | Global |
| **OVH** | €3.50/ay | 2GB | 20GB | 1 vCPU | Sınırsız | Fransa |

### 🇹🇷 **TÜRK SAĞLAYICILAR**

| Sağlayıcı | Fiyat | RAM | Disk | Lokasyon |
|-----------|-------|-----|------|----------|
| **Turhost** | ₺200/ay | 2GB | 50GB | İstanbul |
| **Veridyen** | ₺150/ay | 2GB | 40GB | İstanbul |
| **Natro** | ₺180/ay | 2GB | 50GB | İstanbul |
| **Radore** | ₺250/ay | 2GB | 50GB | İstanbul |

**Tavsiyem:** 
- 🥇 **Contabo** (en ucuz + güçlü)
- 🥈 **Hetzner** (hızlı + güvenilir)
- 🥉 **DigitalOcean** (kolay kullanım + döküman bol)

---

## 🚀 **ADIM ADIM VPS KURULUMU**

### 📋 **İhtiyaç Listeniz:**
- [ ] VPS sunucu (Ubuntu 22.04 LTS)
- [ ] Domain (opsiyonel, IP ile de çalışır)
- [ ] SSH client (Windows için: PuTTY veya Windows Terminal)
- [ ] FileZilla veya WinSCP (dosya yükleme için)

---

## 1️⃣ **VPS SATIN ALMA (Contabo Örneği)**

### Adım 1: Contabo'ya Git
```
https://contabo.com/en/vps/
```

### Adım 2: VPS Seç
**Cloud VPS S** (€3.99/ay):
- 4 vCPU
- 6GB RAM
- 50GB NVMe SSD
- 32TB Traffic
→ Çoğu proje için fazlasıyla yeterli!

### Adım 3: İşletim Sistemi Seç
```
Ubuntu 22.04 LTS (64-bit)
```

### Adım 4: Lokasyon
- Avrupa → **Nürnberg, Almanya** (Türkiye'ye yakın)
- ABD → **New York** veya **Seattle**

### Adım 5: Satın Al
- Ödeme yap
- 5-30 dakika içinde email gelir
- Email'de: **IP adresi**, **root şifresi**

---

## 2️⃣ **VPS'E BAĞLANMA (SSH)**

### Windows PowerShell ile:
```powershell
# SSH bağlantısı
ssh root@YOUR_IP_ADDRESS

# Şifre sor, enter'a bas
# (Email'den aldığın root şifresini yapıştır)
```

### İlk Giriş Şifre Değiştirme:
```bash
# Yeni şifre oluştur
passwd

# Güçlü şifre seç: büyük+küçük+rakam+sembol
# Örnek: MyP@ssw0rd2025!
```

---

## 3️⃣ **SUNUCU HAZIRLIĞI (Ubuntu)**

### 1. Sistem Güncelleme
```bash
apt update && apt upgrade -y
```

### 2. Gerekli Paketler
```bash
# Temel araçlar
apt install -y curl wget git nano ufw

# Build tools
apt install -y build-essential
```

### 3. Firewall Kurulumu
```bash
# UFW firewall aktif et
ufw allow OpenSSH
ufw allow 80/tcp    # HTTP
ufw allow 443/tcp   # HTTPS
ufw enable
ufw status
```

---

## 4️⃣ **NODE.JS KURULUMU**

### Node.js 20 LTS (Önerilen):
```bash
# NodeSource repository ekle
curl -fsSL https://deb.nodesource.com/setup_20.x | bash -

# Node.js kur
apt install -y nodejs

# Kontrol et
node --version   # v20.x.x
npm --version    # 10.x.x
```

### Alternatif: NVM ile (Daha esnek)
```bash
# NVM kur
curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.5/install.sh | bash

# Terminal'i yeniden başlat veya:
source ~/.bashrc

# Node.js 20 kur
nvm install 20
nvm use 20
nvm alias default 20
```

---

## 5️⃣ **NGINX KURULUMU (Web Server)**

### Kurulum:
```bash
apt install -y nginx
systemctl start nginx
systemctl enable nginx
systemctl status nginx
```

### Test:
```
http://YOUR_IP_ADDRESS
```
→ Nginx hoş geldin sayfası görülmeli ✅

---

## 6️⃣ **PROJENİZİ SUNUCUYA YÜKLEME**

### Yöntem 1: Git ile (Önerilen)

#### GitHub'a Yükle (Local'de):
```powershell
# Eğer henüz GitHub'a yüklemediysen
cd C:\Users\root\Desktop\social-pwa

git init
git add .
git commit -m "Initial commit"

# GitHub'da repo oluştur, sonra:
git remote add origin https://github.com/USERNAME/social-pwa.git
git branch -M main
git push -u origin main
```

#### Sunucuda Çek:
```bash
# /var/www dizinine git
cd /var/www

# Git clone
git clone https://github.com/USERNAME/social-pwa.git
cd social-pwa

# Bağımlılıkları yükle
npm install

# Build oluştur
npm run build
```

---

### Yöntem 2: FileZilla/WinSCP ile (Manuel)

**1. FileZilla İndir:**
```
https://filezilla-project.org/
```

**2. Bağlantı Ayarları:**
```
Protocol: SFTP
Host: YOUR_IP_ADDRESS
Port: 22
User: root
Password: your_password
```

**3. Upload:**
- Sol panel: `C:\Users\root\Desktop\social-pwa`
- Sağ panel: `/var/www/social-pwa`
- Tüm dosyaları sürükle bırak

**4. Sunucuda Build:**
```bash
cd /var/www/social-pwa
npm install
npm run build
```

---

## 7️⃣ **ENVIRONMENT VARIABLES (.env)**

### Sunucuda .env Oluştur:
```bash
cd /var/www/social-pwa
nano .env
```

### İçeriği Yapıştır:
```env
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

### Kaydet ve Çık:
```
CTRL + O (kaydet)
ENTER
CTRL + X (çık)
```

### Rebuild:
```bash
npm run build
```

---

## 8️⃣ **NGINX YAPILANDIRMASI**

### Config Dosyası Oluştur:
```bash
nano /etc/nginx/sites-available/social-pwa
```

### İçerik (IP ile):
```nginx
server {
    listen 80;
    server_name YOUR_IP_ADDRESS;

    root /var/www/social-pwa/dist;
    index index.html;

    # SPA routing için
    location / {
        try_files $uri $uri/ /index.html;
    }

    # Gzip compression
    gzip on;
    gzip_vary on;
    gzip_min_length 1024;
    gzip_types text/plain text/css text/xml text/javascript 
               application/x-javascript application/xml+rss 
               application/json application/javascript;

    # Cache static assets
    location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg|woff|woff2|ttf|eot)$ {
        expires 1y;
        add_header Cache-Control "public, immutable";
        access_log off;
    }

    # Security headers
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header X-XSS-Protection "1; mode=block" always;
}
```

### Config'i Aktif Et:
```bash
# Symlink oluştur
ln -s /etc/nginx/sites-available/social-pwa /etc/nginx/sites-enabled/

# Default config'i kaldır (opsiyonel)
rm /etc/nginx/sites-enabled/default

# Syntax kontrol
nginx -t

# Nginx restart
systemctl restart nginx
```

### Test:
```
http://YOUR_IP_ADDRESS
```
→ Social PWA siteniz çalışıyor! 🎉

---

## 9️⃣ **DOMAIN BAĞLAMA (Opsiyonel)**

### Domain Satın Al:
- **Namecheap** (ucuz, güvenilir)
- **GoDaddy**
- **Google Domains**
- **Türk:** Natro, Turhost

### DNS Ayarları:

**A Record:**
```
Type: A
Name: @
Value: YOUR_VPS_IP
TTL: Automatic
```

**WWW için:**
```
Type: A
Name: www
Value: YOUR_VPS_IP
TTL: Automatic
```

### Nginx Config Güncelle:
```bash
nano /etc/nginx/sites-available/social-pwa
```

```nginx
server {
    listen 80;
    server_name yourdomain.com www.yourdomain.com;
    
    # ... geri kalan aynı
}
```

```bash
nginx -t
systemctl restart nginx
```

### Test:
```
http://yourdomain.com
```

---

## 🔒 **SSL KURULUMU (HTTPS) - ÖNEMLİ!**

**PWA için HTTPS şart!**

### Let's Encrypt ile Ücretsiz SSL:

```bash
# Certbot kur
apt install -y certbot python3-certbot-nginx

# SSL sertifikası al (otomatik nginx config)
certbot --nginx -d yourdomain.com -d www.yourdomain.com

# Sorular:
# Email: your@email.com
# Terms: Agree (A)
# Redirect HTTP to HTTPS: Yes (2)
```

### Otomatik Yenileme:
```bash
# Test et
certbot renew --dry-run

# Otomatik yenileme zaten aktif (systemd timer)
systemctl status certbot.timer
```

### Sonuç:
```
https://yourdomain.com
```
→ Artık güvenli HTTPS! 🔒✅

---

## 🔄 **OTOMATİK DEPLOYMENT (Git Pull ile)**

### Deploy Script Oluştur:
```bash
nano /var/www/deploy.sh
```

### Script İçeriği:
```bash
#!/bin/bash

echo "🚀 Deployment başlıyor..."

cd /var/www/social-pwa

echo "📥 Git pull..."
git pull origin main

echo "📦 Dependencies kuruluyor..."
npm install

echo "🔨 Build oluşturuluyor..."
npm run build

echo "♻️ Nginx restart..."
systemctl restart nginx

echo "✅ Deployment tamamlandı!"
```

### Executable Yap:
```bash
chmod +x /var/www/deploy.sh
```

### Kullanım:
```bash
/var/www/deploy.sh
```

**Artık her güncelleme için:**
```bash
# Local'de
git add .
git commit -m "Update"
git push

# Sunucuda
ssh root@YOUR_IP
/var/www/deploy.sh
```

---

## 🔐 **GÜVENLİK İYİLEŞTİRMELERİ**

### 1. Root Yerine User Oluştur
```bash
# Yeni user
adduser social
usermod -aG sudo social

# SSH ile bu user'la gir
ssh social@YOUR_IP
```

### 2. SSH Key Authentication (Şifresiz giriş)

**Local'de (PowerShell):**
```powershell
# SSH key oluştur (eğer yoksa)
ssh-keygen -t ed25519

# Public key'i kopyala
cat ~/.ssh/id_ed25519.pub | clip
```

**Sunucuda:**
```bash
mkdir -p ~/.ssh
nano ~/.ssh/authorized_keys
# Public key'i yapıştır
chmod 700 ~/.ssh
chmod 600 ~/.ssh/authorized_keys
```

**Şifre girişini kapat:**
```bash
nano /etc/ssh/sshd_config

# Değiştir:
PasswordAuthentication no

# Restart
systemctl restart sshd
```

### 3. Fail2Ban (Brute force koruması)
```bash
apt install -y fail2ban
systemctl enable fail2ban
systemctl start fail2ban
```

### 4. Automatic Security Updates
```bash
apt install -y unattended-upgrades
dpkg-reconfigure -plow unattended-upgrades
```

---

## 📊 **MONİTORİNG & LOGS**

### Nginx Logs:
```bash
# Access log
tail -f /var/log/nginx/access.log

# Error log
tail -f /var/log/nginx/error.log
```

### System Resources:
```bash
# RAM kullanımı
free -h

# Disk kullanımı
df -h

# CPU & processes
htop  # (apt install htop)
```

### Disk Temizliği:
```bash
# Node modules temizle (gerekirse)
cd /var/www/social-pwa
rm -rf node_modules
npm install --production

# Apt cache temizle
apt clean
apt autoremove -y
```

---

## 🚀 **PERFORMANS OPTİMİZASYONU**

### 1. Nginx Cache
```nginx
# /etc/nginx/sites-available/social-pwa'ya ekle

# Cache tanımla
proxy_cache_path /var/cache/nginx levels=1:2 keys_zone=my_cache:10m max_size=1g inactive=60m;

server {
    # ... mevcut config
    
    # Cache kullan
    location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg)$ {
        expires 1y;
        add_header Cache-Control "public, immutable";
        proxy_cache my_cache;
        proxy_cache_valid 200 1y;
    }
}
```

### 2. PM2 (Node.js Process Manager)
```bash
# PM2 kur (eğer backend varsa)
npm install -g pm2

# Uygulamayı çalıştır
pm2 start npm --name "social-pwa" -- run dev

# Auto-start on reboot
pm2 startup
pm2 save
```

### 3. Swap Memory (RAM yetersizse)
```bash
# 2GB swap oluştur
fallocate -l 2G /swapfile
chmod 600 /swapfile
mkswap /swapfile
swapon /swapfile

# Kalıcı yap
echo '/swapfile none swap sw 0 0' >> /etc/fstab
```

---

## 🔄 **BACKUP STRATEJISI**

### Otomatik Backup Script:
```bash
nano /root/backup.sh
```

```bash
#!/bin/bash

BACKUP_DIR="/root/backups"
DATE=$(date +%Y%m%d_%H%M%S)
BACKUP_FILE="$BACKUP_DIR/social-pwa_$DATE.tar.gz"

mkdir -p $BACKUP_DIR

# Projeyi arşivle
tar -czf $BACKUP_FILE /var/www/social-pwa

# 7 günden eski backupları sil
find $BACKUP_DIR -name "*.tar.gz" -mtime +7 -delete

echo "Backup completed: $BACKUP_FILE"
```

### Executable Yap:
```bash
chmod +x /root/backup.sh
```

### Cron Job (Otomatik günlük backup):
```bash
crontab -e

# Her gün saat 02:00'da backup
0 2 * * * /root/backup.sh
```

---

## 🛠️ **TROUBLESHOOTING**

### Build Hatası:
```bash
cd /var/www/social-pwa
rm -rf node_modules package-lock.json
npm install
npm run build
```

### Nginx 502 Bad Gateway:
```bash
# Nginx restart
systemctl restart nginx

# Log kontrol
tail -f /var/log/nginx/error.log
```

### Disk Dolu:
```bash
# Disk kullanımı
df -h

# En büyük dosyaları bul
du -ah / | sort -rh | head -n 20

# node_modules temizle
cd /var/www/social-pwa
rm -rf node_modules
npm install --production
```

### Port 80/443 Kullanımda:
```bash
# Ne kullanıyor?
lsof -i :80
lsof -i :443

# Nginx'ten başka bir şey varsa kapat
systemctl stop apache2  # Eğer varsa
```

---

## 📈 **CLOUDFLARE ENTEGRASYONU (Bonus)**

**Neden Cloudflare?**
- ✅ Ücretsiz CDN
- ✅ DDoS koruması
- ✅ SSL
- ✅ Caching
- ✅ Analytics

### Kurulum:
1. https://cloudflare.com → Hesap aç
2. Domain ekle
3. Nameserver'ları güncelle (domain sağlayıcısında)
4. SSL/TLS → Full (strict)
5. Speed → Optimization → On

**Cloudflare Nameservers örnek:**
```
ns1.cloudflare.com
ns2.cloudflare.com
```

---

## 💰 **MALIYET HESAPLAMA**

### Aylık Toplam:
```
VPS (Contabo): €3.99
Domain (.com): ~$12/yıl = $1/ay
SSL: Ücretsiz (Let's Encrypt)
--------------------------------
TOPLAM: ~€5/ay (~₺200/ay)
```

**Karşılaştırma:**
- Vercel/Netlify: Ücretsiz ✅ (ama sınırlı)
- VPS: €5/ay (ama sınırsız + tam kontrol)

---

## 📋 **DEPLOYMENT CHECKLIST**

### Deployment Öncesi:
- [ ] `.env` dosyası `.gitignore`'da
- [ ] Supabase RLS aktif
- [ ] Local'de build test edildi (`npm run build`)
- [ ] Git repo hazır

### VPS Setup:
- [ ] VPS satın alındı
- [ ] SSH bağlantısı kuruldu
- [ ] Firewall yapılandırıldı
- [ ] Node.js kuruldu
- [ ] Nginx kuruldu
- [ ] Proje yüklendi
- [ ] Environment variables ayarlandı
- [ ] Build oluşturuldu
- [ ] Nginx config ayarlandı

### Production:
- [ ] Site çalışıyor (HTTP)
- [ ] Domain bağlandı (opsiyonel)
- [ ] SSL kuruldu (HTTPS)
- [ ] PWA çalışıyor
- [ ] Backup script kuruldu
- [ ] Monitoring aktif

---

## 🎉 **TAMAMLANDI!**

Artık siteniz VPS'te canlı!

**Erişim:**
- HTTP: `http://YOUR_IP` veya `http://yourdomain.com`
- HTTPS: `https://yourdomain.com` (SSL kurulduysa)

**PWA Test:**
1. Chrome'da siteyi aç
2. Adres çubuğunda "Install" ikonu
3. Telefonuna indir
4. Home screen'den aç

---

## 🆘 **YARDIM GEREKİRSE**

Ben buradayım! İster birlikte adım adım kuralım, ister sorun çözelim.

**Başarılar!** 🚀
