-- =====================================================
-- COMPLETE MESSAGING SYSTEM SETUP
-- =====================================================
-- Run this in Supabase Dashboard > SQL Editor

-- =====================================================
-- 1. CONVERSATIONS TABLE (Chat rooms between two users)
-- =====================================================
CREATE TABLE IF NOT EXISTS conversations (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user1_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  user2_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  last_message TEXT,
  last_message_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user1_id, user2_id),
  CHECK (user1_id != user2_id),
  CHECK (user1_id < user2_id) -- Ensures consistent ordering
);

-- =====================================================
-- 2. MESSAGES TABLE
-- =====================================================
CREATE TABLE IF NOT EXISTS messages (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  conversation_id UUID REFERENCES conversations(id) ON DELETE CASCADE NOT NULL,
  sender_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  receiver_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  content TEXT NOT NULL,
  is_read BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =====================================================
-- 3. INDEXES FOR PERFORMANCE
-- =====================================================
CREATE INDEX IF NOT EXISTS idx_conversations_user1 ON conversations(user1_id);
CREATE INDEX IF NOT EXISTS idx_conversations_user2 ON conversations(user2_id);
CREATE INDEX IF NOT EXISTS idx_conversations_last_message ON conversations(last_message_at DESC);
CREATE INDEX IF NOT EXISTS idx_messages_conversation ON messages(conversation_id);
CREATE INDEX IF NOT EXISTS idx_messages_sender ON messages(sender_id);
CREATE INDEX IF NOT EXISTS idx_messages_receiver ON messages(receiver_id);
CREATE INDEX IF NOT EXISTS idx_messages_created ON messages(created_at DESC);

-- =====================================================
-- 4. RLS POLICIES
-- =====================================================

-- Enable RLS
ALTER TABLE conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;

-- CONVERSATIONS POLICIES
DROP POLICY IF EXISTS "Users can view own conversations" ON conversations;
CREATE POLICY "Users can view own conversations" ON conversations
  FOR SELECT USING (auth.uid() = user1_id OR auth.uid() = user2_id);

DROP POLICY IF EXISTS "Users can create conversations" ON conversations;
CREATE POLICY "Users can create conversations" ON conversations
  FOR INSERT WITH CHECK (auth.uid() = user1_id OR auth.uid() = user2_id);

DROP POLICY IF EXISTS "Users can update own conversations" ON conversations;
CREATE POLICY "Users can update own conversations" ON conversations
  FOR UPDATE USING (auth.uid() = user1_id OR auth.uid() = user2_id);

-- MESSAGES POLICIES
DROP POLICY IF EXISTS "Users can view own messages" ON messages;
CREATE POLICY "Users can view own messages" ON messages
  FOR SELECT USING (auth.uid() = sender_id OR auth.uid() = receiver_id);

DROP POLICY IF EXISTS "Users can send messages" ON messages;
CREATE POLICY "Users can send messages" ON messages
  FOR INSERT WITH CHECK (auth.uid() = sender_id);

DROP POLICY IF EXISTS "Users can update own received messages" ON messages;
CREATE POLICY "Users can update own received messages" ON messages
  FOR UPDATE USING (auth.uid() = receiver_id);

DROP POLICY IF EXISTS "Users can delete own sent messages" ON messages;
CREATE POLICY "Users can delete own sent messages" ON messages
  FOR DELETE USING (auth.uid() = sender_id);

-- =====================================================
-- 5. FUNCTIONS & TRIGGERS
-- =====================================================

-- Function: Update conversation last message
DROP FUNCTION IF EXISTS update_conversation_last_message() CASCADE;
CREATE OR REPLACE FUNCTION update_conversation_last_message()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE conversations
  SET 
    last_message = NEW.content,
    last_message_at = NEW.created_at
  WHERE id = NEW.conversation_id;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger: Update conversation on new message
DROP TRIGGER IF EXISTS trigger_update_conversation ON messages;
CREATE TRIGGER trigger_update_conversation
  AFTER INSERT ON messages
  FOR EACH ROW
  EXECUTE FUNCTION update_conversation_last_message();

-- Function: Update updated_at timestamp
DROP TRIGGER IF EXISTS update_messages_updated_at ON messages;
CREATE TRIGGER update_messages_updated_at BEFORE UPDATE ON messages
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- =====================================================
-- 6. HELPER FUNCTION: Get or Create Conversation
-- =====================================================
DROP FUNCTION IF EXISTS get_or_create_conversation(UUID, UUID);
CREATE OR REPLACE FUNCTION get_or_create_conversation(
  p_user1_id UUID,
  p_user2_id UUID
)
RETURNS UUID AS $$
DECLARE
  v_conversation_id UUID;
  v_smaller_id UUID;
  v_larger_id UUID;
BEGIN
  -- Ensure consistent ordering (smaller ID first)
  IF p_user1_id < p_user2_id THEN
    v_smaller_id := p_user1_id;
    v_larger_id := p_user2_id;
  ELSE
    v_smaller_id := p_user2_id;
    v_larger_id := p_user1_id;
  END IF;

  -- Try to get existing conversation
  SELECT id INTO v_conversation_id
  FROM conversations
  WHERE user1_id = v_smaller_id AND user2_id = v_larger_id;

  -- If not found, create new conversation
  IF v_conversation_id IS NULL THEN
    INSERT INTO conversations (user1_id, user2_id)
    VALUES (v_smaller_id, v_larger_id)
    RETURNING id INTO v_conversation_id;
  END IF;

  RETURN v_conversation_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =====================================================
-- DONE! ✅
-- =====================================================
-- Test with:
-- SELECT get_or_create_conversation('user1-uuid', 'user2-uuid');
-- SELECT * FROM conversations;
-- SELECT * FROM messages ORDER BY created_at DESC;