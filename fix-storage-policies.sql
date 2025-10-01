-- =====================================================
-- STORAGE BUCKET POLICIES FIX
-- =====================================================
-- Bu script'i Supabase Dashboard'da SQL Editor'de çalıştırın

-- =====================================================
-- POSTS BUCKET POLICIES
-- =====================================================

-- Allow authenticated users to upload to posts bucket
INSERT INTO storage.buckets (id, name, public)
VALUES ('posts', 'posts', true)
ON CONFLICT (id) DO UPDATE SET public = true;

-- Drop existing policies if any
DROP POLICY IF EXISTS "Allow authenticated uploads to posts" ON storage.objects;
DROP POLICY IF EXISTS "Allow public reads from posts" ON storage.objects;
DROP POLICY IF EXISTS "Allow users to delete own posts files" ON storage.objects;

-- Create new policies for posts bucket
CREATE POLICY "Allow authenticated uploads to posts"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'posts');

CREATE POLICY "Allow public reads from posts"
ON storage.objects FOR SELECT
TO public
USING (bucket_id = 'posts');

CREATE POLICY "Allow users to delete own posts files"
ON storage.objects FOR DELETE
TO authenticated
USING (bucket_id = 'posts' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Allow users to update own posts files"
ON storage.objects FOR UPDATE
TO authenticated
USING (bucket_id = 'posts' AND auth.uid()::text = (storage.foldername(name))[1]);

-- =====================================================
-- AVATARS BUCKET POLICIES
-- =====================================================

-- Allow authenticated users to upload to avatars bucket
INSERT INTO storage.buckets (id, name, public)
VALUES ('avatars', 'avatars', true)
ON CONFLICT (id) DO UPDATE SET public = true;

-- Drop existing policies if any
DROP POLICY IF EXISTS "Allow authenticated uploads to avatars" ON storage.objects;
DROP POLICY IF EXISTS "Allow public reads from avatars" ON storage.objects;
DROP POLICY IF EXISTS "Allow users to delete own avatar files" ON storage.objects;

-- Create new policies for avatars bucket
CREATE POLICY "Allow authenticated uploads to avatars"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'avatars');

CREATE POLICY "Allow public reads from avatars"
ON storage.objects FOR SELECT
TO public
USING (bucket_id = 'avatars');

CREATE POLICY "Allow users to delete own avatar files"
ON storage.objects FOR DELETE
TO authenticated
USING (bucket_id = 'avatars' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Allow users to update own avatar files"
ON storage.objects FOR UPDATE
TO authenticated
USING (bucket_id = 'avatars' AND auth.uid()::text = (storage.foldername(name))[1]);

-- =====================================================
-- SUCCESS MESSAGE
-- =====================================================
DO $$
BEGIN
  RAISE NOTICE '✅ Storage bucket policies başarıyla oluşturuldu!';
  RAISE NOTICE '✅ Artık dosya yükleyebilirsiniz.';
END $$;