-- =====================================================
-- RLS Policy Fix - Profile Creation
-- =====================================================
-- Bu script'i Supabase Dashboard'da SQL Editor'de çalıştırın

-- Drop existing profile policies
DROP POLICY IF EXISTS "Public profiles are viewable by everyone" ON profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON profiles;
DROP POLICY IF EXISTS "Users can insert own profile" ON profiles;

-- Recreate policies with correct permissions
CREATE POLICY "Public profiles are viewable by everyone" 
  ON profiles FOR SELECT 
  USING (true);

CREATE POLICY "Users can insert own profile" 
  ON profiles FOR INSERT 
  WITH CHECK (auth.uid() = id);

CREATE POLICY "Users can update own profile" 
  ON profiles FOR UPDATE 
  USING (auth.uid() = id);

CREATE POLICY "Users can delete own profile" 
  ON profiles FOR DELETE 
  USING (auth.uid() = id);

-- Also make sure the table allows inserts
GRANT ALL ON profiles TO authenticated;
GRANT ALL ON profiles TO service_role;

-- =====================================================
-- Add trigger to auto-create profile on signup
-- =====================================================
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
BEGIN
  INSERT INTO public.profiles (id, username, full_name, total_points, level)
  VALUES (
    new.id,
    COALESCE(new.raw_user_meta_data->>'username', 'user_' || substr(new.id::text, 1, 8)),
    COALESCE(new.raw_user_meta_data->>'full_name', 'User'),
    0,
    'Bronze'
  );
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Drop trigger if exists
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

-- Create trigger
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- =====================================================
-- Fix user_points_history policies
-- =====================================================
DROP POLICY IF EXISTS "Users can view own points history" ON user_points_history;
DROP POLICY IF EXISTS "Users can insert points" ON user_points_history;

CREATE POLICY "Users can view own points history" 
  ON user_points_history FOR SELECT 
  USING (auth.uid() = user_id);

CREATE POLICY "System can insert points" 
  ON user_points_history FOR INSERT 
  WITH CHECK (true);

GRANT ALL ON user_points_history TO authenticated;
GRANT ALL ON user_points_history TO service_role;