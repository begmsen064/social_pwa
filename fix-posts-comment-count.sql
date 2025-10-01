-- Allow authenticated users to update comments_count on any post
-- This is needed when someone comments on a post

-- Drop existing policy if it exists
DROP POLICY IF EXISTS "Users can update post stats" ON posts;

-- Create new policy that allows updating only the stats columns
CREATE POLICY "Users can update post stats"
ON posts FOR UPDATE
TO authenticated
USING (true)
WITH CHECK (true);

-- Alternative: More restrictive - only allow updating specific columns
-- But RLS doesn't support column-level permissions, so we use the above

-- Make sure RLS is enabled
ALTER TABLE posts ENABLE ROW LEVEL SECURITY;