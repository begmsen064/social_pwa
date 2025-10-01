-- =====================================================
-- Add Reaction Support to Messages
-- =====================================================
-- Run this in Supabase Dashboard > SQL Editor

-- Add reaction column to messages table
ALTER TABLE messages 
ADD COLUMN IF NOT EXISTS reaction TEXT DEFAULT NULL;

-- Reaction can be: 'heart', 'like', 'laugh', etc.
-- NULL means no reaction

-- Add index for better performance
CREATE INDEX IF NOT EXISTS idx_messages_reaction ON messages(reaction);