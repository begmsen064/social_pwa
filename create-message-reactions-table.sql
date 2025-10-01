-- =====================================================
-- Message Reactions System - Multiple Users
-- =====================================================
-- Run this in Supabase Dashboard > SQL Editor

-- Drop old reaction column from messages
ALTER TABLE messages DROP COLUMN IF EXISTS reaction;

-- Create message_reactions table
CREATE TABLE IF NOT EXISTS message_reactions (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  message_id UUID REFERENCES messages(id) ON DELETE CASCADE NOT NULL,
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  reaction TEXT NOT NULL DEFAULT 'heart',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(message_id, user_id) -- Each user can only react once per message
);

-- Add indexes
CREATE INDEX IF NOT EXISTS idx_message_reactions_message_id ON message_reactions(message_id);
CREATE INDEX IF NOT EXISTS idx_message_reactions_user_id ON message_reactions(user_id);

-- Enable RLS
ALTER TABLE message_reactions ENABLE ROW LEVEL SECURITY;

-- RLS Policies
DROP POLICY IF EXISTS "Users can view reactions" ON message_reactions;
CREATE POLICY "Users can view reactions" ON message_reactions
  FOR SELECT USING (true);

DROP POLICY IF EXISTS "Users can add reactions" ON message_reactions;
CREATE POLICY "Users can add reactions" ON message_reactions
  FOR INSERT WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can remove own reactions" ON message_reactions;
CREATE POLICY "Users can remove own reactions" ON message_reactions
  FOR DELETE USING (auth.uid() = user_id);

-- Enable realtime
ALTER PUBLICATION supabase_realtime ADD TABLE message_reactions;