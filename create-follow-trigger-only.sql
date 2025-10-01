-- =====================================================
-- Create ONLY Follow Notification Trigger
-- =====================================================
-- Run this in Supabase Dashboard > SQL Editor

-- Drop existing trigger if exists
DROP TRIGGER IF EXISTS trigger_follow_notification ON follows;

-- Drop existing function if exists
DROP FUNCTION IF EXISTS create_follow_notification();

-- Create the function
CREATE OR REPLACE FUNCTION create_follow_notification()
RETURNS TRIGGER AS $$
BEGIN
  -- Insert notification for the followed user
  INSERT INTO notifications (user_id, actor_id, type)
  VALUES (
    NEW.following_id,  -- The user being followed gets the notification
    NEW.follower_id,   -- The user who followed is the actor
    'follow'
  );
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create the trigger
CREATE TRIGGER trigger_follow_notification
  AFTER INSERT ON follows
  FOR EACH ROW
  EXECUTE FUNCTION create_follow_notification();

-- Test: Try to follow someone and check if notification is created
-- You can verify by running: SELECT * FROM notifications WHERE type = 'follow' ORDER BY created_at DESC LIMIT 5;