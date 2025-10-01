-- Fix Notification Type Constraint
-- 'purchase' type'ını notifications tablosuna ekle

-- 1. Mevcut constraint'i kaldır
ALTER TABLE notifications 
DROP CONSTRAINT IF EXISTS notifications_type_check;

-- 2. Yeni constraint'i ekle (purchase dahil)
ALTER TABLE notifications 
ADD CONSTRAINT notifications_type_check 
CHECK (type IN ('like', 'comment', 'follow', 'mention', 'purchase'));

-- Başarılı! 🎉
SELECT 'Notification constraint güncellendi! purchase type eklendi.' as message;
