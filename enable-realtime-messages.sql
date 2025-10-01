-- =====================================================
-- Enable Realtime for Messages System
-- =====================================================
-- Run this in Supabase Dashboard > SQL Editor

-- Enable realtime for conversations table
ALTER PUBLICATION supabase_realtime ADD TABLE conversations;

-- Enable realtime for messages table
ALTER PUBLICATION supabase_realtime ADD TABLE messages;

-- Verify realtime is enabled
SELECT schemaname, tablename 
FROM pg_publication_tables 
WHERE pubname = 'supabase_realtime'
ORDER BY tablename;