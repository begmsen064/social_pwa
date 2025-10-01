-- Create a secure function to update user points
-- This function runs with SECURITY DEFINER, bypassing RLS

CREATE OR REPLACE FUNCTION update_user_points(
  target_user_id UUID,
  points_to_add INTEGER
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER -- This allows the function to bypass RLS
SET search_path = public
AS $$
BEGIN
  -- Update the user's total points
  UPDATE profiles
  SET total_points = COALESCE(total_points, 0) + points_to_add
  WHERE id = target_user_id;
END;
$$;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION update_user_points(UUID, INTEGER) TO authenticated;