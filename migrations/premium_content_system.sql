-- Premium Content System Migration
-- Bu sistem kullanıcıların puanla satın alabilecekleri premium içerik paylaşmalarına olanak sağlar

-- 0. Notification type'a purchase ekle (eğer enum kullanıyorsanız)
-- Not: Eğer notifications.type bir text alanıysa bu adımı atlayabilirsiniz
-- DO $$ 
-- BEGIN
--   IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'notification_type') THEN
--     CREATE TYPE notification_type AS ENUM ('like', 'comment', 'follow', 'mention', 'purchase');
--   ELSE
--     ALTER TYPE notification_type ADD VALUE IF NOT EXISTS 'purchase';
--   END IF;
-- END $$;

-- 1. posts tablosuna price alanı ekle
ALTER TABLE posts 
ADD COLUMN IF NOT EXISTS price INTEGER DEFAULT 0;

COMMENT ON COLUMN posts.price IS 'İçeriği görüntülemek için gereken puan (0 = ücretsiz, 10/20/30/40 = ücretli)';

-- 2. post_purchases tablosu oluştur (Satın alınan postları takip et)
CREATE TABLE IF NOT EXISTS post_purchases (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  post_id UUID NOT NULL REFERENCES posts(id) ON DELETE CASCADE,
  buyer_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  seller_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  price INTEGER NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  
  -- Bir kullanıcı aynı postu birden fazla kez satın alamaz
  UNIQUE(post_id, buyer_id)
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_post_purchases_post_id ON post_purchases(post_id);
CREATE INDEX IF NOT EXISTS idx_post_purchases_buyer_id ON post_purchases(buyer_id);
CREATE INDEX IF NOT EXISTS idx_post_purchases_seller_id ON post_purchases(seller_id);

-- RLS Policies
ALTER TABLE post_purchases ENABLE ROW LEVEL SECURITY;

-- Herkes kendi satın aldıklarını görebilir
CREATE POLICY "Users can view their own purchases"
  ON post_purchases FOR SELECT
  USING (auth.uid() = buyer_id);

-- Satıcılar kendi postlarının satışlarını görebilir
CREATE POLICY "Sellers can view their sales"
  ON post_purchases FOR SELECT
  USING (auth.uid() = seller_id);

-- Satın alma işlemini sadece kullanıcı kendisi yapabilir
CREATE POLICY "Users can purchase posts"
  ON post_purchases FOR INSERT
  WITH CHECK (auth.uid() = buyer_id);

-- 3. RPC Function: Satın alma işlemi (Transaction içinde)
CREATE OR REPLACE FUNCTION purchase_post(
  p_post_id UUID,
  p_buyer_id UUID,
  p_seller_id UUID,
  p_price INTEGER
)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_buyer_points INTEGER;
  v_result JSON;
BEGIN
  -- 1. Alıcının yeterli puanı var mı kontrol et
  SELECT total_points INTO v_buyer_points
  FROM profiles
  WHERE id = p_buyer_id;
  
  IF v_buyer_points < p_price THEN
    RETURN json_build_object(
      'success', false,
      'error', 'Yetersiz puan! Gerekli: ' || p_price || ', Mevcut: ' || v_buyer_points
    );
  END IF;
  
  -- 2. Daha önce satın alınmış mı kontrol et
  IF EXISTS (
    SELECT 1 FROM post_purchases 
    WHERE post_id = p_post_id AND buyer_id = p_buyer_id
  ) THEN
    RETURN json_build_object(
      'success', false,
      'error', 'Bu içeriği zaten satın aldınız!'
    );
  END IF;
  
  -- 3. Alıcıdan puan düş
  UPDATE profiles
  SET total_points = total_points - p_price
  WHERE id = p_buyer_id;
  
  -- 4. Satıcıya puan ekle
  UPDATE profiles
  SET total_points = total_points + p_price
  WHERE id = p_seller_id;
  
  -- 5. Satın alma kaydı oluştur
  INSERT INTO post_purchases (post_id, buyer_id, seller_id, price)
  VALUES (p_post_id, p_buyer_id, p_seller_id, p_price);
  
  -- 6. Puan geçmişi kayıtları
  INSERT INTO user_points_history (user_id, points, action_type, reference_id)
  VALUES 
    (p_buyer_id, -p_price, 'post', p_post_id),
    (p_seller_id, p_price, 'post', p_post_id);
  
  -- 7. Satıcıya bildirim gönder (Premium içerik satın alındı)
  INSERT INTO notifications (user_id, actor_id, type, post_id, is_read)
  VALUES (p_seller_id, p_buyer_id, 'purchase', p_post_id, false);
  
  RETURN json_build_object(
    'success', true,
    'message', 'İçerik başarıyla satın alındı!'
  );
  
EXCEPTION
  WHEN OTHERS THEN
    RETURN json_build_object(
      'success', false,
      'error', 'Bir hata oluştu: ' || SQLERRM
    );
END;
$$;

-- Grant execute permission
GRANT EXECUTE ON FUNCTION purchase_post TO authenticated;

COMMENT ON FUNCTION purchase_post IS 'Kullanıcının puanla post satın almasını sağlar (transaction-safe)';
