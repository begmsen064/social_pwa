-- =====================================================
-- Fix Notifications RLS Policies
-- =====================================================
-- Run this in Supabase Dashboard > SQL Editor

-- Add missing INSERT policy for notifications
-- System can insert notifications for any user
CREATE POLICY "System can create notifications" ON notifications
  FOR INSERT WITH CHECK (true);

-- Add DELETE policy so users can delete their own notifications
CREATE POLICY "Users can delete own notifications" ON notifications
  FOR DELETE USING (auth.uid() = user_id);