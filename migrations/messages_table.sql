-- Messages Table Setup
-- Bu tablo zaten varsa bu SQL'i çalıştırmanıza gerek yok

-- Messages table oluştur (eğer yoksa)
CREATE TABLE IF NOT EXISTS messages (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  sender_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  receiver_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  is_read BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_messages_sender_id ON messages(sender_id);
CREATE INDEX IF NOT EXISTS idx_messages_receiver_id ON messages(receiver_id);
CREATE INDEX IF NOT EXISTS idx_messages_is_read ON messages(is_read);
CREATE INDEX IF NOT EXISTS idx_messages_created_at ON messages(created_at);

-- RLS Policies
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;

-- Kullanıcılar kendi gönderdikleri mesajları görebilir
CREATE POLICY "Users can view sent messages"
  ON messages FOR SELECT
  USING (auth.uid() = sender_id);

-- Kullanıcılar kendilerine gelen mesajları görebilir
CREATE POLICY "Users can view received messages"
  ON messages FOR SELECT
  USING (auth.uid() = receiver_id);

-- Kullanıcılar mesaj gönderebilir
CREATE POLICY "Users can send messages"
  ON messages FOR INSERT
  WITH CHECK (auth.uid() = sender_id);

-- Kullanıcılar kendi aldıkları mesajları okundu olarak işaretleyebilir
CREATE POLICY "Users can mark their messages as read"
  ON messages FOR UPDATE
  USING (auth.uid() = receiver_id)
  WITH CHECK (auth.uid() = receiver_id);

-- Kullanıcılar kendi gönderdikleri veya aldıkları mesajları silebilir
CREATE POLICY "Users can delete their messages"
  ON messages FOR DELETE
  USING (auth.uid() = sender_id OR auth.uid() = receiver_id);

COMMENT ON TABLE messages IS 'Kullanıcılar arası direkt mesajlaşma tablosu';
COMMENT ON COLUMN messages.is_read IS 'Mesaj okundu mu?';

-- Success message
SELECT 'Messages table başarıyla oluşturuldu! ✅' as message;
