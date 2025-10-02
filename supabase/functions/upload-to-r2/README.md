# Upload to R2 Edge Function

## Deployment

### 1. Supabase Dashboard'a Git
https://supabase.com/dashboard/project/YOUR_PROJECT/functions

### 2. New Edge Function Oluştur
- Function name: `upload-to-r2`
- `index.ts` içeriğini kopyala yapıştır

### 3. Environment Variables Ekle
Dashboard → Edge Functions → upload-to-r2 → Secrets

```
R2_ACCOUNT_ID=f6ddf56c73901d288618cd19bba65fb1
R2_ACCESS_KEY_ID=6a04d81383a0851787f8fb246576f0bc
R2_SECRET_ACCESS_KEY=76297d8f74d6193343d847a79e276a24175db323146414af6e7a3b4318dcecc3
R2_BUCKET_NAME=social-pwa-storage
```

### 4. Deploy Et
Save → Deploy

## Kullanım

```typescript
const { data, error } = await supabase.functions.invoke('upload-to-r2', {
  body: {
    file: base64String, // "data:image/jpeg;base64,..."
    fileName: 'photo.jpg',
    fileType: 'image/jpeg',
    folder: 'avatars' // or 'posts', 'videos'
  }
});

// Response:
// {
//   success: true,
//   url: "https://pub-xxx.r2.dev/avatars/123-abc.jpg",
//   fileName: "avatars/123-abc.jpg"
// }
```
