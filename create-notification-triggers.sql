-- =====================================================
-- Notification Triggers
-- =====================================================
-- Run this in Supabase Dashboard > SQL Editor

-- Function to create notification for likes
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
$$ LANGUAGE plpgsql;

-- Function to create notification for comments
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
$$ LANGUAGE plpgsql;

-- Function to create notification for follows
CREATE OR REPLACE FUNCTION create_follow_notification()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO notifications (user_id, actor_id, type)
  VALUES (
    NEW.following_id,
    NEW.follower_id,
    'follow'
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create triggers
DROP TRIGGER IF EXISTS trigger_like_notification ON likes;
CREATE TRIGGER trigger_like_notification
  AFTER INSERT ON likes
  FOR EACH ROW
  WHEN (NEW.type = 'like')
  EXECUTE FUNCTION create_like_notification();

DROP TRIGGER IF EXISTS trigger_comment_notification ON comments;
CREATE TRIGGER trigger_comment_notification
  AFTER INSERT ON comments
  FOR EACH ROW
  EXECUTE FUNCTION create_comment_notification();

DROP TRIGGER IF EXISTS trigger_follow_notification ON follows;
CREATE TRIGGER trigger_follow_notification
  AFTER INSERT ON follows
  FOR EACH ROW
  EXECUTE FUNCTION create_follow_notification();

-- =====================================================
-- Cleanup old notifications
-- =====================================================
-- Function to delete notifications when actions are undone
CREATE OR REPLACE FUNCTION delete_like_notification()
RETURNS TRIGGER AS $$
BEGIN
  DELETE FROM notifications
  WHERE actor_id = OLD.user_id
    AND post_id = OLD.post_id
    AND type = 'like';
  RETURN OLD;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION delete_follow_notification()
RETURNS TRIGGER AS $$
BEGIN
  DELETE FROM notifications
  WHERE actor_id = OLD.follower_id
    AND user_id = OLD.following_id
    AND type = 'follow';
  RETURN OLD;
END;
$$ LANGUAGE plpgsql;

-- Cleanup triggers
DROP TRIGGER IF EXISTS trigger_unlike_notification ON likes;
CREATE TRIGGER trigger_unlike_notification
  AFTER DELETE ON likes
  FOR EACH ROW
  WHEN (OLD.type = 'like')
  EXECUTE FUNCTION delete_like_notification();

DROP TRIGGER IF EXISTS trigger_unfollow_notification ON follows;
CREATE TRIGGER trigger_unfollow_notification
  AFTER DELETE ON follows
  FOR EACH ROW
  EXECUTE FUNCTION delete_follow_notification();