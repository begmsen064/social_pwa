import { useState, useEffect } from 'react';
import { X, Flag } from 'lucide-react';

interface ReportModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (reason: string, description: string) => Promise<void>;
}

const REPORT_REASONS = [
  'Spam veya yanıltıcı içerik',
  'Nefret söylemi veya şiddet',
  'Uygunsuz içerik',
  'Telif hakkı ihlali',
  'Sahte bilgi',
  'Diğer',
];

export const ReportModal = ({ isOpen, onClose, onSubmit }: ReportModalProps) => {
  const [selectedReason, setSelectedReason] = useState('');
  const [description, setDescription] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Prevent body scroll when modal is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isOpen]);

  const handleSubmit = async () => {
    if (!selectedReason) return;

    setIsSubmitting(true);
    try {
      await onSubmit(selectedReason, description);
      setSelectedReason('');
      setDescription('');
      onClose();
    } catch (error) {
      console.error('Error submitting report:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="relative bg-white dark:bg-gray-900 rounded-2xl p-6 max-w-lg w-full shadow-2xl max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-orange-100 dark:bg-orange-900/30 rounded-full flex items-center justify-center">
              <Flag className="w-5 h-5 text-orange-600 dark:text-orange-400" />
            </div>
            <h3 className="text-xl font-bold text-gray-900 dark:text-white">
              Rapor Et
            </h3>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-full transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
          Bu postu neden raporluyorsunuz?
        </p>

        {/* Reasons */}
        <div className="space-y-2 mb-4">
          {REPORT_REASONS.map((reason) => (
            <button
              key={reason}
              onClick={() => setSelectedReason(reason)}
              className={`w-full text-left px-4 py-3 rounded-lg border transition ${
                selectedReason === reason
                  ? 'border-orange-500 bg-orange-50 dark:bg-orange-900/20 text-orange-900 dark:text-orange-200'
                  : 'border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800'
              }`}
            >
              <span className="text-sm font-medium">{reason}</span>
            </button>
          ))}
        </div>

        {/* Description */}
        {selectedReason && (
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Açıklama (İsteğe bağlı)
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={3}
              maxLength={500}
              placeholder="Daha fazla detay ekleyin..."
              className="w-full px-4 py-3 border border-gray-300 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-orange-500 resize-none"
            />
            <p className="text-xs text-gray-500 dark:text-gray-400 text-right mt-1">
              {description.length}/500
            </p>
          </div>
        )}

        {/* Buttons */}
        <div className="flex gap-3">
          <button
            onClick={onClose}
            disabled={isSubmitting}
            className="flex-1 px-4 py-3 border border-gray-300 dark:border-gray-700 rounded-lg font-semibold hover:bg-gray-50 dark:hover:bg-gray-800 transition disabled:opacity-50"
          >
            İptal
          </button>
          <button
            onClick={handleSubmit}
            disabled={!selectedReason || isSubmitting}
            className="flex-1 px-4 py-3 bg-orange-600 hover:bg-orange-700 text-white rounded-lg font-semibold transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            {isSubmitting ? (
              <>
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                Gönderiliyor...
              </>
            ) : (
              'Gönder'
            )}
          </button>
        </div>
      </div>
    </div>
  );
};