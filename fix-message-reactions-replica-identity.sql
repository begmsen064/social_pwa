-- =====================================================
-- Fix Message Reactions Replica Identity
-- =====================================================
-- This ensures DELETE events include all column data in realtime subscriptions
-- Run this in Supabase Dashboard > SQL Editor

-- Set replica identity to FULL for message_reactions table
-- This will include all columns in DELETE event payloads
ALTER TABLE message_reactions REPLICA IDENTITY FULL;

-- Verify the change
SELECT 
  schemaname, 
  tablename, 
  CASE 
    WHEN relreplident = 'd' THEN 'default (primary key)'
    WHEN relreplident = 'n' THEN 'nothing'
    WHEN relreplident = 'f' THEN 'full (all columns)'
    WHEN relreplident = 'i' THEN 'index'
  END as replica_identity
FROM pg_class c
JOIN pg_namespace n ON n.oid = c.relnamespace
JOIN pg_tables t ON t.tablename = c.relname AND t.schemaname = n.nspname
WHERE t.tablename = 'message_reactions';