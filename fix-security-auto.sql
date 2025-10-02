-- =============================================
-- FIX SECURITY ISSUES - AUTOMATIC VERSION
-- Run this in Supabase SQL Editor
-- =============================================

-- This query will automatically fix ALL functions with search_path issues
DO $$
DECLARE
    func_record RECORD;
    func_signature TEXT;
BEGIN
    FOR func_record IN 
        SELECT 
            n.nspname as schema_name,
            p.proname as function_name,
            pg_get_function_identity_arguments(p.oid) as args
        FROM pg_proc p
        JOIN pg_namespace n ON p.pronamespace = n.oid
        WHERE n.nspname = 'public'
        AND p.proname IN (
            'increment_likes_count',
            'decrement_likes_count',
            'purchase_post',
            'update_updated_at_column',
            'handle_new_user',
            'update_comments_count',
            'create_like_notification',
            'create_comment_notification',
            'create_follow_notification',
            'delete_like_notification',
            'delete_follow_notification',
            'update_conversation_last_message',
            'get_or_create_conversation'
        )
    LOOP
        -- Build function signature
        func_signature := format('%I.%I(%s)', 
            func_record.schema_name, 
            func_record.function_name, 
            func_record.args
        );
        
        -- Execute ALTER FUNCTION
        EXECUTE format('ALTER FUNCTION %s SET search_path TO ''public''', func_signature);
        
        RAISE NOTICE 'Fixed: %', func_signature;
    END LOOP;
END $$;

-- =============================================
-- COMPLETED!
-- All functions automatically fixed
-- =============================================
