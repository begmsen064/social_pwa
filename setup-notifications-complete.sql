-- =====================================================
-- COMPLETE NOTIFICATION SYSTEM SETUP - ALL IN ONE
-- =====================================================
-- Run this ONCE in Supabase Dashboard > SQL Editor
-- This will setup everything for notifications to work

-- =====================================================
-- 1. RLS POLICIES FOR NOTIFICATIONS
-- =====================================================

-- Users can view their own notifications
DROP POLICY IF EXISTS "Users can view own notifications" ON notifications;
CREATE POLICY "Users can view own notifications" ON notifications
  FOR SELECT USING (auth.uid() = user_id);

-- Users can update their own notifications (mark as read)
DROP POLICY IF EXISTS "Users can update own notifications" ON notifications;
CREATE POLICY "Users can update own notifications" ON notifications
  FOR UPDATE USING (auth.uid() = user_id);

-- System can create notifications for any user
DROP POLICY IF EXISTS "System can create notifications" ON notifications;
CREATE POLICY "System can create notifications" ON notifications
  FOR INSERT WITH CHECK (true);

-- Users can delete their own notifications
DROP POLICY IF EXISTS "Users can delete own notifications" ON notifications;
CREATE POLICY "Users can delete own notifications" ON notifications
  FOR DELETE USING (auth.uid() = user_id);

-- =====================================================
-- 2. NOTIFICATION FUNCTIONS
-- =====================================================

-- Function: Create notification for LIKES
DROP FUNCTION IF EXISTS create_like_notification() CASCADE;
CREATE OR REPLACE FUNCTION create_like_notification()
RETURNS TRIGGER AS $$
BEGIN
  -- Don't create notification if user likes their own post
  IF NEW.user_id != (SELECT user_id FROM posts WHERE id = NEW.post_id) THEN
    INSERT INTO notifications (user_id, actor_id, type, post_id)
    VALUES (
      (SELECT user_id FROM posts WHERE id = NEW.post_id),
      NEW.user_id,
      'like',
      NEW.post_id
    );
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function: Create notification for COMMENTS
DROP FUNCTION IF EXISTS create_comment_notification() CASCADE;
CREATE OR REPLACE FUNCTION create_comment_notification()
RETURNS TRIGGER AS $$
BEGIN
  -- Don't create notification if user comments on their own post
  IF NEW.user_id != (SELECT user_id FROM posts WHERE id = NEW.post_id) THEN
    INSERT INTO notifications (user_id, actor_id, type, post_id, comment_id)
    VALUES (
      (SELECT user_id FROM posts WHERE id = NEW.post_id),
      NEW.user_id,
      'comment',
      NEW.post_id,
      NEW.id
    );
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function: Create notification for FOLLOWS
DROP FUNCTION IF EXISTS create_follow_notification() CASCADE;
CREATE OR REPLACE FUNCTION create_follow_notification()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO notifications (user_id, actor_id, type)
  VALUES (
    NEW.following_id,  -- User being followed gets the notification
    NEW.follower_id,   -- User who followed is the actor
    'follow'
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function: Delete notification when UNLIKE
DROP FUNCTION IF EXISTS delete_like_notification() CASCADE;
CREATE OR REPLACE FUNCTION delete_like_notification()
RETURNS TRIGGER AS $$
BEGIN
  DELETE FROM notifications
  WHERE actor_id = OLD.user_id
    AND post_id = OLD.post_id
    AND type = 'like';
  RETURN OLD;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function: Delete notification when UNFOLLOW
DROP FUNCTION IF EXISTS delete_follow_notification() CASCADE;
CREATE OR REPLACE FUNCTION delete_follow_notification()
RETURNS TRIGGER AS $$
BEGIN
  DELETE FROM notifications
  WHERE actor_id = OLD.follower_id
    AND user_id = OLD.following_id
    AND type = 'follow';
  RETURN OLD;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =====================================================
-- 3. TRIGGERS
-- =====================================================

-- Trigger: LIKE notification
DROP TRIGGER IF EXISTS trigger_like_notification ON likes;
CREATE TRIGGER trigger_like_notification
  AFTER INSERT ON likes
  FOR EACH ROW
  WHEN (NEW.type = 'like')
  EXECUTE FUNCTION create_like_notification();

-- Trigger: COMMENT notification
DROP TRIGGER IF EXISTS trigger_comment_notification ON comments;
CREATE TRIGGER trigger_comment_notification
  AFTER INSERT ON comments
  FOR EACH ROW
  EXECUTE FUNCTION create_comment_notification();

-- Trigger: FOLLOW notification
DROP TRIGGER IF EXISTS trigger_follow_notification ON follows;
CREATE TRIGGER trigger_follow_notification
  AFTER INSERT ON follows
  FOR EACH ROW
  EXECUTE FUNCTION create_follow_notification();

-- Trigger: UNLIKE cleanup
DROP TRIGGER IF EXISTS trigger_unlike_notification ON likes;
CREATE TRIGGER trigger_unlike_notification
  AFTER DELETE ON likes
  FOR EACH ROW
  WHEN (OLD.type = 'like')
  EXECUTE FUNCTION delete_like_notification();

-- Trigger: UNFOLLOW cleanup
DROP TRIGGER IF EXISTS trigger_unfollow_notification ON follows;
CREATE TRIGGER trigger_unfollow_notification
  AFTER DELETE ON follows
  FOR EACH ROW
  EXECUTE FUNCTION delete_follow_notification();

-- =====================================================
-- DONE! ✅
-- =====================================================
-- Now test by:
-- 1. Like a post → Check notifications
-- 2. Comment on a post → Check notifications
-- 3. Follow someone → Check notifications
--
-- Verify with: SELECT * FROM notifications ORDER BY created_at DESC LIMIT 10;