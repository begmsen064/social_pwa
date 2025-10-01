-- =====================================================
-- Check if Follow Notification Trigger Exists
-- =====================================================
-- Run this in Supabase Dashboard > SQL Editor

-- Check if trigger exists
SELECT 
    trigger_name,
    event_manipulation,
    event_object_table,
    action_statement
FROM information_schema.triggers
WHERE event_object_table = 'follows'
ORDER BY trigger_name;

-- Check if function exists
SELECT 
    proname as function_name,
    prosrc as function_body
FROM pg_proc
WHERE proname LIKE '%follow%notification%';