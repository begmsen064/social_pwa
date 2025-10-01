-- =====================================================
-- COMPLETE RLS POLICY FIX FOR ALL TABLES
-- =====================================================
-- Bu script'i Supabase Dashboard'da SQL Editor'de çalıştırın

-- =====================================================
-- 1. PROFILES TABLE
-- =====================================================
DROP POLICY IF EXISTS "Public profiles are viewable by everyone" ON profiles;
DROP POLICY IF EXISTS "Users can insert own profile" ON profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON profiles;
DROP POLICY IF EXISTS "Users can delete own profile" ON profiles;

CREATE POLICY "Public profiles are viewable by everyone" 
  ON profiles FOR SELECT USING (true);

CREATE POLICY "Users can insert own profile" 
  ON profiles FOR INSERT WITH CHECK (auth.uid() = id);

CREATE POLICY "Users can update own profile" 
  ON profiles FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "Users can delete own profile" 
  ON profiles FOR DELETE USING (auth.uid() = id);

-- =====================================================
-- 2. POSTS TABLE
-- =====================================================
DROP POLICY IF EXISTS "Posts are viewable by everyone" ON posts;
DROP POLICY IF EXISTS "Users can create posts" ON posts;
DROP POLICY IF EXISTS "Users can update own posts" ON posts;
DROP POLICY IF EXISTS "Users can delete own posts" ON posts;

CREATE POLICY "Posts are viewable by everyone" 
  ON posts FOR SELECT USING (true);

CREATE POLICY "Users can create posts" 
  ON posts FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own posts" 
  ON posts FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own posts" 
  ON posts FOR DELETE USING (auth.uid() = user_id);

-- =====================================================
-- 3. POST_MEDIA TABLE
-- =====================================================
DROP POLICY IF EXISTS "Post media viewable by everyone" ON post_media;
DROP POLICY IF EXISTS "Users can insert own post media" ON post_media;
DROP POLICY IF EXISTS "Users can delete own post media" ON post_media;

CREATE POLICY "Post media viewable by everyone" 
  ON post_media FOR SELECT USING (true);

CREATE POLICY "Users can insert post media" 
  ON post_media FOR INSERT 
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM posts 
      WHERE posts.id = post_media.post_id 
      AND posts.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can delete own post media" 
  ON post_media FOR DELETE 
  USING (
    EXISTS (
      SELECT 1 FROM posts 
      WHERE posts.id = post_media.post_id 
      AND posts.user_id = auth.uid()
    )
  );

-- =====================================================
-- 4. LIKES TABLE
-- =====================================================
DROP POLICY IF EXISTS "Likes are viewable by everyone" ON likes;
DROP POLICY IF EXISTS "Users can create likes" ON likes;
DROP POLICY IF EXISTS "Users can delete own likes" ON likes;

CREATE POLICY "Likes are viewable by everyone" 
  ON likes FOR SELECT USING (true);

CREATE POLICY "Users can create likes" 
  ON likes FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own likes" 
  ON likes FOR DELETE USING (auth.uid() = user_id);

-- =====================================================
-- 5. COMMENTS TABLE
-- =====================================================
DROP POLICY IF EXISTS "Comments are viewable by everyone" ON comments;
DROP POLICY IF EXISTS "Users can create comments" ON comments;
DROP POLICY IF EXISTS "Users can update own comments" ON comments;
DROP POLICY IF EXISTS "Users can delete own comments" ON comments;

CREATE POLICY "Comments are viewable by everyone" 
  ON comments FOR SELECT USING (true);

CREATE POLICY "Users can create comments" 
  ON comments FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own comments" 
  ON comments FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own comments" 
  ON comments FOR DELETE USING (auth.uid() = user_id);

-- =====================================================
-- 6. FOLLOWS TABLE
-- =====================================================
DROP POLICY IF EXISTS "Follows are viewable by everyone" ON follows;
DROP POLICY IF EXISTS "Users can follow others" ON follows;
DROP POLICY IF EXISTS "Users can unfollow" ON follows;

CREATE POLICY "Follows are viewable by everyone" 
  ON follows FOR SELECT USING (true);

CREATE POLICY "Users can follow others" 
  ON follows FOR INSERT WITH CHECK (auth.uid() = follower_id);

CREATE POLICY "Users can unfollow" 
  ON follows FOR DELETE USING (auth.uid() = follower_id);

-- =====================================================
-- 7. NOTIFICATIONS TABLE
-- =====================================================
DROP POLICY IF EXISTS "Users can view own notifications" ON notifications;
DROP POLICY IF EXISTS "Users can update own notifications" ON notifications;
DROP POLICY IF EXISTS "System can create notifications" ON notifications;

CREATE POLICY "Users can view own notifications" 
  ON notifications FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can update own notifications" 
  ON notifications FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "System can create notifications" 
  ON notifications FOR INSERT WITH CHECK (true);

-- =====================================================
-- 8. USER_POINTS_HISTORY TABLE
-- =====================================================
DROP POLICY IF EXISTS "Users can view own points history" ON user_points_history;
DROP POLICY IF EXISTS "System can insert points" ON user_points_history;

CREATE POLICY "Users can view own points history" 
  ON user_points_history FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "System can insert points" 
  ON user_points_history FOR INSERT WITH CHECK (true);

-- =====================================================
-- GRANT PERMISSIONS TO AUTHENTICATED USERS
-- =====================================================
GRANT ALL ON profiles TO authenticated, service_role;
GRANT ALL ON posts TO authenticated, service_role;
GRANT ALL ON post_media TO authenticated, service_role;
GRANT ALL ON likes TO authenticated, service_role;
GRANT ALL ON comments TO authenticated, service_role;
GRANT ALL ON follows TO authenticated, service_role;
GRANT ALL ON notifications TO authenticated, service_role;
GRANT ALL ON user_points_history TO authenticated, service_role;

-- =====================================================
-- SUCCESS MESSAGE
-- =====================================================
DO $$
BEGIN
  RAISE NOTICE '✅ Tüm RLS policy''ler başarıyla güncellendi!';
  RAISE NOTICE '✅ Artık post paylaşabilirsiniz.';
END $$;