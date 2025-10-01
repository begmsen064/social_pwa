-- Create trigger to automatically update comments_count when a comment is added or deleted
-- This is more secure than allowing manual updates from the client

-- Function to update comments count
CREATE OR REPLACE FUNCTION update_comments_count()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    -- Increment comments_count when a comment is added
    UPDATE posts
    SET comments_count = COALESCE(comments_count, 0) + 1
    WHERE id = NEW.post_id;
    RETURN NEW;
  ELSIF TG_OP = 'DELETE' THEN
    -- Decrement comments_count when a comment is deleted
    UPDATE posts
    SET comments_count = GREATEST(COALESCE(comments_count, 0) - 1, 0)
    WHERE id = OLD.post_id;
    RETURN OLD;
  END IF;
  RETURN NULL;
END;
$$;

-- Drop trigger if exists
DROP TRIGGER IF EXISTS comments_count_trigger ON comments;

-- Create trigger on comments table
CREATE TRIGGER comments_count_trigger
AFTER INSERT OR DELETE ON comments
FOR EACH ROW
EXECUTE FUNCTION update_comments_count();