import { useState } from 'react';
import { usePurchase } from '../hooks/usePurchase';
import { useAuthStore } from '../store/authStore';

interface PurchaseModalProps {
  isOpen: boolean;
  onClose: () => void;
  postId: string;
  sellerId: string;
  sellerName: string;
  price: number;
  onPurchaseSuccess: () => void;
}

export const PurchaseModal = ({
  isOpen,
  onClose,
  postId,
  sellerId,
  sellerName,
  price,
  onPurchaseSuccess,
}: PurchaseModalProps) => {
  const { user } = useAuthStore();
  const { purchasePost, isPurchasing } = usePurchase();
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  if (!isOpen) return null;

  const handlePurchase = async () => {
    setError('');
    setSuccess(false);

    const result = await purchasePost(postId, sellerId, price);

    if (result.success) {
      setSuccess(true);
      setTimeout(() => {
        onPurchaseSuccess();
        onClose();
      }, 1500);
    } else {
      setError(result.error || 'Satın alma başarısız');
    }
  };

  const hasEnoughPoints = user && user.total_points >= price;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black bg-opacity-50 backdrop-blur-sm"
        onClick={onClose}
      ></div>

      {/* Modal */}
      <div className="relative bg-white dark:bg-gray-900 rounded-2xl shadow-2xl max-w-md w-full p-6 border border-gray-200 dark:border-gray-800">
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800 transition"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth="2"
              d="M6 18L18 6M6 6l12 12"
            />
          </svg>
        </button>

        {success ? (
          // Success State
          <div className="text-center py-8">
            <div className="text-6xl mb-4 animate-bounce">✅</div>
            <h3 className="text-2xl font-bold text-green-600 dark:text-green-400 mb-2">
              Başarılı!
            </h3>
            <p className="text-gray-600 dark:text-gray-400">
              İçerik kilidini açtın! 🎉
            </p>
          </div>
        ) : (
          <>
            {/* Icon */}
            <div className="flex justify-center mb-4">
              <div className="w-16 h-16 bg-gradient-to-br from-primary to-secondary rounded-full flex items-center justify-center">
                <span className="text-3xl">💎</span>
              </div>
            </div>

            {/* Title */}
            <h3 className="text-xl font-bold text-center mb-2">
              Premium İçerik
            </h3>
            <p className="text-center text-gray-600 dark:text-gray-400 text-sm mb-6">
              <span className="font-semibold">{sellerName}</span> tarafından paylaşıldı
            </p>

            {/* Price Info */}
            <div className="bg-gradient-to-r from-primary/10 to-secondary/10 dark:from-primary/20 dark:to-secondary/20 rounded-xl p-4 mb-6">
              <div className="flex items-center justify-between mb-3">
                <span className="text-sm text-gray-600 dark:text-gray-400">İçerik Fiyatı</span>
                <span className="text-2xl font-bold bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
                  {price} Puan
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600 dark:text-gray-400">Mevcut Puanın</span>
                <span className={`text-lg font-bold ${hasEnoughPoints ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>
                  {user?.total_points || 0} Puan
                </span>
              </div>
            </div>

            {/* Error Message */}
            {error && (
              <div className="mb-4 p-3 bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 rounded-lg text-sm">
                {error}
              </div>
            )}

            {/* Warning for insufficient points */}
            {!hasEnoughPoints && (
              <div className="mb-4 p-3 bg-yellow-50 dark:bg-yellow-900/20 text-yellow-700 dark:text-yellow-400 rounded-lg text-sm flex items-start gap-2">
                <svg className="w-5 h-5 flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                  <path
                    fillRule="evenodd"
                    d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z"
                    clipRule="evenodd"
                  />
                </svg>
                <div>
                  <p className="font-semibold">Yetersiz Puan!</p>
                  <p className="text-xs mt-1">
                    Daha fazla puan kazanmak için post paylaş, yorum yap veya takipçi kazan!
                  </p>
                </div>
              </div>
            )}

            {/* Action Buttons */}
            <div className="flex gap-3">
              <button
                onClick={onClose}
                className="flex-1 px-4 py-3 border-2 border-gray-300 dark:border-gray-700 rounded-lg font-semibold hover:bg-gray-50 dark:hover:bg-gray-800 transition"
              >
                İptal
              </button>
              <button
                onClick={handlePurchase}
                disabled={isPurchasing || !hasEnoughPoints}
                className="flex-1 px-4 py-3 bg-gradient-to-r from-primary to-secondary text-white rounded-lg font-semibold hover:shadow-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isPurchasing ? 'Satın Alınıyor...' : 'Satın Al'}
              </button>
            </div>

            {/* Info */}
            <p className="text-xs text-gray-500 dark:text-gray-400 text-center mt-4">
              💡 Satın aldıktan sonra içeriği her zaman görüntüleyebilirsin
            </p>
          </>
        )}
      </div>
    </div>
  );
};
