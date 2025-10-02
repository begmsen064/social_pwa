-- =============================================
-- FIX RLS PERFORMANCE ISSUES
-- Run this in Supabase SQL Editor
-- =============================================

-- 1. PROFILES TABLE
-- Drop existing policies
DROP POLICY IF EXISTS "Users can insert own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can delete own profile" ON public.profiles;

-- Create optimized policies
CREATE POLICY "Users can insert own profile" ON public.profiles
  FOR INSERT WITH CHECK (auth.uid() = id);

CREATE POLICY "Users can update own profile" ON public.profiles
  FOR UPDATE USING ((SELECT auth.uid()) = id);

CREATE POLICY "Users can delete own profile" ON public.profiles
  FOR DELETE USING ((SELECT auth.uid()) = id);


-- 2. POSTS TABLE
-- Drop existing policies
DROP POLICY IF EXISTS "Users can create posts" ON public.posts;
DROP POLICY IF EXISTS "Users can update own posts" ON public.posts;
DROP POLICY IF EXISTS "Users can delete own posts" ON public.posts;

-- Create optimized policies
CREATE POLICY "Users can create posts" ON public.posts
  FOR INSERT WITH CHECK ((SELECT auth.uid()) = user_id);

CREATE POLICY "Users can update own posts" ON public.posts
  FOR UPDATE USING ((SELECT auth.uid()) = user_id);

CREATE POLICY "Users can delete own posts" ON public.posts
  FOR DELETE USING ((SELECT auth.uid()) = user_id);


-- 3. POST_MEDIA TABLE
-- Drop existing policies
DROP POLICY IF EXISTS "Users can insert post media" ON public.post_media;
DROP POLICY IF EXISTS "Users can delete own post media" ON public.post_media;

-- Create optimized policies
CREATE POLICY "Users can insert post media" ON public.post_media
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.posts
      WHERE posts.id = post_media.post_id
      AND posts.user_id = (SELECT auth.uid())
    )
  );

CREATE POLICY "Users can delete own post media" ON public.post_media
  FOR DELETE USING (
    EXISTS (
      SELECT 1 FROM public.posts
      WHERE posts.id = post_media.post_id
      AND posts.user_id = (SELECT auth.uid())
    )
  );


-- 4. LIKES TABLE
-- Drop existing policies
DROP POLICY IF EXISTS "Users can create likes" ON public.likes;
DROP POLICY IF EXISTS "Users can delete own likes" ON public.likes;

-- Create optimized policies
CREATE POLICY "Users can create likes" ON public.likes
  FOR INSERT WITH CHECK ((SELECT auth.uid()) = user_id);

CREATE POLICY "Users can delete own likes" ON public.likes
  FOR DELETE USING ((SELECT auth.uid()) = user_id);


-- 5. COMMENTS TABLE
-- Drop existing policies
DROP POLICY IF EXISTS "Users can create comments" ON public.comments;
DROP POLICY IF EXISTS "Users can update own comments" ON public.comments;
DROP POLICY IF EXISTS "Users can delete own comments" ON public.comments;

-- Create optimized policies
CREATE POLICY "Users can create comments" ON public.comments
  FOR INSERT WITH CHECK ((SELECT auth.uid()) = user_id);

CREATE POLICY "Users can update own comments" ON public.comments
  FOR UPDATE USING ((SELECT auth.uid()) = user_id);

CREATE POLICY "Users can delete own comments" ON public.comments
  FOR DELETE USING ((SELECT auth.uid()) = user_id);


-- 6. POST_PURCHASES TABLE
-- Drop existing policies
DROP POLICY IF EXISTS "Sellers can view their sales" ON public.post_purchases;
DROP POLICY IF EXISTS "Users can purchase posts" ON public.post_purchases;
DROP POLICY IF EXISTS "Users can view their own purchases" ON public.post_purchases;

-- Create optimized policies (merged to avoid duplicate)
CREATE POLICY "Users can view purchases and sales" ON public.post_purchases
  FOR SELECT USING (
    (SELECT auth.uid()) = buyer_id OR (SELECT auth.uid()) = seller_id
  );

CREATE POLICY "Users can purchase posts" ON public.post_purchases
  FOR INSERT WITH CHECK ((SELECT auth.uid()) = buyer_id);


-- 7. USER_POINTS_HISTORY TABLE
-- Drop existing policies
DROP POLICY IF EXISTS "Users can view own points history" ON public.user_points_history;

-- Create optimized policy
CREATE POLICY "Users can view own points history" ON public.user_points_history
  FOR SELECT USING ((SELECT auth.uid()) = user_id);


-- 8. FOLLOWS TABLE
-- Drop existing policies
DROP POLICY IF EXISTS "Users can follow others" ON public.follows;
DROP POLICY IF EXISTS "Users can unfollow" ON public.follows;

-- Create optimized policies
CREATE POLICY "Users can follow others" ON public.follows
  FOR INSERT WITH CHECK ((SELECT auth.uid()) = follower_id);

CREATE POLICY "Users can unfollow" ON public.follows
  FOR DELETE USING ((SELECT auth.uid()) = follower_id);


-- 9. NOTIFICATIONS TABLE
-- Drop existing policies
DROP POLICY IF EXISTS "Users can view own notifications" ON public.notifications;
DROP POLICY IF EXISTS "Users can update own notifications" ON public.notifications;
DROP POLICY IF EXISTS "Users can delete own notifications" ON public.notifications;

-- Create optimized policies
CREATE POLICY "Users can view own notifications" ON public.notifications
  FOR SELECT USING ((SELECT auth.uid()) = user_id);

CREATE POLICY "Users can update own notifications" ON public.notifications
  FOR UPDATE USING ((SELECT auth.uid()) = user_id);

CREATE POLICY "Users can delete own notifications" ON public.notifications
  FOR DELETE USING ((SELECT auth.uid()) = user_id);


-- 10. CONVERSATIONS TABLE
-- Drop existing policies
DROP POLICY IF EXISTS "Users can view own conversations" ON public.conversations;
DROP POLICY IF EXISTS "Users can create conversations" ON public.conversations;
DROP POLICY IF EXISTS "Users can update own conversations" ON public.conversations;

-- Create optimized policies
CREATE POLICY "Users can view own conversations" ON public.conversations
  FOR SELECT USING (
    (SELECT auth.uid()) = user1_id OR (SELECT auth.uid()) = user2_id
  );

CREATE POLICY "Users can create conversations" ON public.conversations
  FOR INSERT WITH CHECK (
    (SELECT auth.uid()) = user1_id OR (SELECT auth.uid()) = user2_id
  );

CREATE POLICY "Users can update own conversations" ON public.conversations
  FOR UPDATE USING (
    (SELECT auth.uid()) = user1_id OR (SELECT auth.uid()) = user2_id
  );


-- 11. MESSAGES TABLE
-- Drop existing policies
DROP POLICY IF EXISTS "Users can view own messages" ON public.messages;
DROP POLICY IF EXISTS "Users can send messages" ON public.messages;
DROP POLICY IF EXISTS "Users can update own received messages" ON public.messages;
DROP POLICY IF EXISTS "Users can delete own sent messages" ON public.messages;

-- Create optimized policies
CREATE POLICY "Users can view own messages" ON public.messages
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.conversations
      WHERE conversations.id = messages.conversation_id
      AND ((SELECT auth.uid()) = conversations.user1_id OR (SELECT auth.uid()) = conversations.user2_id)
    )
  );

CREATE POLICY "Users can send messages" ON public.messages
  FOR INSERT WITH CHECK ((SELECT auth.uid()) = sender_id);

CREATE POLICY "Users can update own received messages" ON public.messages
  FOR UPDATE USING ((SELECT auth.uid()) = receiver_id);

CREATE POLICY "Users can delete own sent messages" ON public.messages
  FOR DELETE USING ((SELECT auth.uid()) = sender_id);


-- 12. MESSAGE_REACTIONS TABLE
-- Drop existing policies
DROP POLICY IF EXISTS "Users can add reactions" ON public.message_reactions;
DROP POLICY IF EXISTS "Users can remove own reactions" ON public.message_reactions;

-- Create optimized policies
CREATE POLICY "Users can add reactions" ON public.message_reactions
  FOR INSERT WITH CHECK ((SELECT auth.uid()) = user_id);

CREATE POLICY "Users can remove own reactions" ON public.message_reactions
  FOR DELETE USING ((SELECT auth.uid()) = user_id);


-- 13. FIX DUPLICATE INDEX
-- Drop duplicate index
DROP INDEX IF EXISTS public.idx_posts_created_at_desc;

-- =============================================
-- COMPLETED!
-- All RLS policies optimized for performance
-- Duplicate policies merged
-- Duplicate index removed
-- =============================================
