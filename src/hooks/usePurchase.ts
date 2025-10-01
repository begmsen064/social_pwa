import { useState } from 'react';
import { supabase } from '../lib/supabase';
import { useAuthStore } from '../store/authStore';

interface PurchaseResult {
  success: boolean;
  error?: string;
  message?: string;
}

export const usePurchase = () => {
  const { user, refreshUser } = useAuthStore();
  const [isPurchasing, setIsPurchasing] = useState(false);

  const purchasePost = async (
    postId: string,
    sellerId: string,
    price: number
  ): Promise<PurchaseResult> => {
    if (!user) {
      return { success: false, error: 'Lütfen giriş yapın' };
    }

    if (user.id === sellerId) {
      return { success: false, error: 'Kendi içeriğinizi satın alamazsınız' };
    }

    setIsPurchasing(true);

    try {
      // RPC fonksiyonunu çağır (transaction-safe)
      const { data, error } = await supabase.rpc('purchase_post', {
        p_post_id: postId,
        p_buyer_id: user.id,
        p_seller_id: sellerId,
        p_price: price,
      });

      if (error) {
        console.error('Purchase error:', error);
        return { success: false, error: error.message };
      }

      // RPC response'u parse et
      const result = data as PurchaseResult;

      if (result.success) {
        // Kullanıcı bilgilerini güncelle (puan değişti)
        await refreshUser();
      }

      return result;
    } catch (error: any) {
      console.error('Purchase exception:', error);
      return { success: false, error: error.message || 'Bir hata oluştu' };
    } finally {
      setIsPurchasing(false);
    }
  };

  return {
    purchasePost,
    isPurchasing,
  };
};
