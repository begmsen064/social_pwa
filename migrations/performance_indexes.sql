-- Performance Optimization - Database Indexes
-- Bu indexler sorgu performansını dramatik şekilde artırır

-- ==========================================
-- POSTS TABLE INDEXES
-- ==========================================

-- Ana feed için (created_at DESC sıralama)
CREATE INDEX IF NOT EXISTS idx_posts_created_at_desc 
ON posts(created_at DESC);

-- User'a göre postlar (profil sayfası)
CREATE INDEX IF NOT EXISTS idx_posts_user_created 
ON posts(user_id, created_at DESC);

-- Premium content filtreleme
CREATE INDEX IF NOT EXISTS idx_posts_price_created 
ON posts(price, created_at DESC) 
WHERE price > 0;

-- Following feed için (user_id IN sorguları)
CREATE INDEX IF NOT EXISTS idx_posts_user_id 
ON posts(user_id);

-- ==========================================
-- POST_PURCHASES TABLE INDEXES
-- ==========================================

-- Kullanıcının satın aldığı postlar
CREATE INDEX IF NOT EXISTS idx_purchases_buyer_post 
ON post_purchases(buyer_id, post_id);

-- Satıcının satışları
CREATE INDEX IF NOT EXISTS idx_purchases_seller 
ON post_purchases(seller_id, created_at DESC);

-- ==========================================
-- LIKES TABLE INDEXES
-- ==========================================

-- Post'un beğenileri
CREATE INDEX IF NOT EXISTS idx_likes_post_user 
ON likes(post_id, user_id);

-- User'ın beğendikleri
CREATE INDEX IF NOT EXISTS idx_likes_user_post 
ON likes(user_id, post_id);

-- ==========================================
-- COMMENTS TABLE INDEXES
-- ==========================================

-- Post yorumları (created_at ile sıralı)
CREATE INDEX IF NOT EXISTS idx_comments_post_created 
ON comments(post_id, created_at DESC);

-- Parent yorumlar (nested comments)
CREATE INDEX IF NOT EXISTS idx_comments_parent 
ON comments(parent_id, created_at ASC) 
WHERE parent_id IS NOT NULL;

-- User yorumları
CREATE INDEX IF NOT EXISTS idx_comments_user 
ON comments(user_id, created_at DESC);

-- ==========================================
-- FOLLOWS TABLE INDEXES
-- ==========================================

-- Takipçiler listesi
CREATE INDEX IF NOT EXISTS idx_follows_following 
ON follows(following_id, created_at DESC);

-- Takip edilenler listesi
CREATE INDEX IF NOT EXISTS idx_follows_follower 
ON follows(follower_id, created_at DESC);

-- Takip kontrolü (iki yönlü)
CREATE INDEX IF NOT EXISTS idx_follows_pair 
ON follows(follower_id, following_id);

-- ==========================================
-- NOTIFICATIONS TABLE INDEXES
-- ==========================================

-- Okunmamış bildirimler
CREATE INDEX IF NOT EXISTS idx_notifications_user_unread 
ON notifications(user_id, is_read, created_at DESC);

-- Tüm bildirimler
CREATE INDEX IF NOT EXISTS idx_notifications_user_created 
ON notifications(user_id, created_at DESC);

-- Tip bazlı filtreleme
CREATE INDEX IF NOT EXISTS idx_notifications_type 
ON notifications(user_id, type, created_at DESC);

-- ==========================================
-- MESSAGES TABLE INDEXES
-- ==========================================

-- Okunmamış mesajlar (unread badge için)
CREATE INDEX IF NOT EXISTS idx_messages_receiver_unread 
ON messages(receiver_id, is_read, created_at DESC);

-- Konuşma geçmişi
CREATE INDEX IF NOT EXISTS idx_messages_conversation 
ON messages(sender_id, receiver_id, created_at ASC);

-- Tüm mesajlar
CREATE INDEX IF NOT EXISTS idx_messages_receiver_created 
ON messages(receiver_id, created_at DESC);

-- ==========================================
-- PROFILES TABLE INDEXES
-- ==========================================

-- Username araması
CREATE INDEX IF NOT EXISTS idx_profiles_username 
ON profiles(username);

-- Leaderboard (puan sıralaması)
CREATE INDEX IF NOT EXISTS idx_profiles_points 
ON profiles(total_points DESC);

-- Search için (full_name + username)
CREATE INDEX IF NOT EXISTS idx_profiles_search 
ON profiles USING gin(to_tsvector('english', full_name || ' ' || username));

-- ==========================================
-- POST_MEDIA TABLE INDEXES
-- ==========================================

-- Post medyaları (sıralı)
CREATE INDEX IF NOT EXISTS idx_post_media_post_order 
ON post_media(post_id, order_index ASC);

-- ==========================================
-- USER_POINTS_HISTORY TABLE INDEXES
-- ==========================================

-- User puan geçmişi
CREATE INDEX IF NOT EXISTS idx_points_history_user 
ON user_points_history(user_id, created_at DESC);

-- Action type bazlı
CREATE INDEX IF NOT EXISTS idx_points_history_action 
ON user_points_history(user_id, action_type, created_at DESC);

-- ==========================================
-- ANALYZE TABLES (İstatistikleri güncelle)
-- ==========================================

ANALYZE posts;
ANALYZE post_purchases;
ANALYZE likes;
ANALYZE comments;
ANALYZE follows;
ANALYZE notifications;
ANALYZE messages;
ANALYZE profiles;
ANALYZE post_media;
ANALYZE user_points_history;

-- Success message
SELECT 'Performance indexes başarıyla oluşturuldu! 🚀' as message;
SELECT 'Tüm tablolar ANALYZE edildi. Sorgu planlayıcı güncel istatistiklere sahip.' as info;
