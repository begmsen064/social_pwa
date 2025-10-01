-- Function to increment comment count on posts
CREATE OR REPLACE FUNCTION increment_comment_count(post_id UUID)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  UPDATE posts
  SET comments_count = COALESCE(comments_count, 0) + 1
  WHERE id = post_id;
END;
$$;

-- Function to update user points
CREATE OR REPLACE FUNCTION update_user_points(user_id UUID, points_change INTEGER)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  UPDATE profiles
  SET points = COALESCE(points, 0) + points_change
  WHERE id = user_id;
END;
$$;

-- Grant execute permissions
GRANT EXECUTE ON FUNCTION increment_comment_count(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION update_user_points(UUID, INTEGER) TO authenticated;