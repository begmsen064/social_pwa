-- =============================================
-- FIX SECURITY ISSUES - SET search_path FOR FUNCTIONS
-- Run this in Supabase SQL Editor
-- =============================================

-- This fixes the "role mutable search_path" security warnings
-- by explicitly setting search_path for each function

-- 1. increment_likes_count
ALTER FUNCTION public.increment_likes_count() SET search_path TO 'public';

-- 2. decrement_likes_count
ALTER FUNCTION public.decrement_likes_count() SET search_path TO 'public';

-- 3. purchase_post
ALTER FUNCTION public.purchase_post(uuid, uuid, uuid, integer) SET search_path TO 'public';

-- 4. update_updated_at_column
ALTER FUNCTION public.update_updated_at_column() SET search_path TO 'public';

-- 5. handle_new_user
ALTER FUNCTION public.handle_new_user() SET search_path TO 'public';

-- 6. update_comments_count
ALTER FUNCTION public.update_comments_count() SET search_path TO 'public';

-- 7. create_like_notification
ALTER FUNCTION public.create_like_notification() SET search_path TO 'public';

-- 8. create_comment_notification
ALTER FUNCTION public.create_comment_notification() SET search_path TO 'public';

-- 9. create_follow_notification
ALTER FUNCTION public.create_follow_notification() SET search_path TO 'public';

-- 10. delete_like_notification
ALTER FUNCTION public.delete_like_notification() SET search_path TO 'public';

-- 11. delete_follow_notification
ALTER FUNCTION public.delete_follow_notification() SET search_path TO 'public';

-- 12. update_conversation_last_message
ALTER FUNCTION public.update_conversation_last_message() SET search_path TO 'public';

-- 13. get_or_create_conversation
ALTER FUNCTION public.get_or_create_conversation(uuid, uuid) SET search_path TO 'public';

-- =============================================
-- COMPLETED!
-- All function security issues resolved
-- =============================================

-- NOTE: The last warning about "HaveIBeenPwned" is not fixable via SQL
-- You need to enable it manually in Supabase Dashboard:
-- Settings → Authentication → Enable "Breach password protection"
