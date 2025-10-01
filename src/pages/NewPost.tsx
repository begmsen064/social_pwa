import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../store/authStore';
import { supabase } from '../lib/supabase';
import MediaUploader from '../components/MediaUploader';
import { uploadMultipleMedia } from '../utils/uploadMedia';

const NewPost = () => {
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [caption, setCaption] = useState('');
  const [location, setLocation] = useState('');
  const [price, setPrice] = useState<number>(0); // Premium content fiyatı
  const [loading, setLoading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [error, setError] = useState('');

  const handleMediaChange = (files: File[]) => {
    setSelectedFiles(files);
    setError('');
  };

  const createPost = async () => {
    if (!user) return;
    if (selectedFiles.length === 0) {
      setError('En az bir resim veya video seçmelisiniz');
      return;
    }

    setLoading(true);
    setError('');

    try {
      // 1. Upload media files
      const uploadedMedia = await uploadMultipleMedia(
        selectedFiles,
        user.id,
        (progress) => setUploadProgress(progress)
      );

      // 2. Create post in database
      const { data: postData, error: postError } = await supabase
        .from('posts')
        .insert({
          user_id: user.id,
          caption: caption.trim() || null,
          location: location.trim() || null,
          price: price, // Premium content fiyatı
          likes_count: 0,
          dislikes_count: 0,
          comments_count: 0,
        })
        .select()
        .single();

      if (postError) throw postError;

      // 3. Insert post media
      const mediaInserts = uploadedMedia.map((media, index) => ({
        post_id: postData.id,
        media_url: media.url,
        media_type: media.type,
        order_index: index,
        thumbnail_url: media.thumbnailUrl || null,
      }));

      const { error: mediaError } = await supabase
        .from('post_media')
        .insert(mediaInserts);

      if (mediaError) throw mediaError;

      // 4. Add points to user
      const { error: pointsError } = await supabase
        .from('user_points_history')
        .insert({
          user_id: user.id,
          points: 10,
          action_type: 'post',
          reference_id: postData.id,
        });

      if (pointsError) throw pointsError;

      // 5. Update user's total points
      const { error: updateError } = await supabase
        .from('profiles')
        .update({ total_points: (user.total_points || 0) + 10 })
        .eq('id', user.id);

      if (updateError) throw updateError;

      // Success! Navigate to home
      navigate('/home', { replace: true });
    } catch (err: any) {
      console.error('Post creation error:', err);
      setError(err.message || 'Post oluşturulurken bir hata oluştu');
      setLoading(false);
    }
  };

  const handleCancel = () => {
    if (selectedFiles.length > 0 || caption.trim()) {
      if (window.confirm('Değişiklikler kaydedilmeyecek. Emin misiniz?')) {
        navigate('/home');
      }
    } else {
      navigate('/home');
    }
  };

  return (
    <div className="min-h-screen px-4 py-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <button
          onClick={handleCancel}
          disabled={loading}
          className="flex items-center text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200 disabled:opacity-50"
        >
          <svg className="w-6 h-6 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth="2"
              d="M15 19l-7-7 7-7"
            />
          </svg>
          İptal
        </button>

        <h1 className="text-xl font-bold">Yeni Post</h1>

        <button
          onClick={createPost}
          disabled={loading || selectedFiles.length === 0}
          className="px-6 py-2 bg-gradient-to-r from-primary to-secondary text-white rounded-lg font-semibold hover:shadow-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {loading ? 'Paylaşılıyor...' : 'Paylaş'}
        </button>
      </div>

      {/* Error Message */}
      {error && (
        <div className="mb-4 p-4 bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 rounded-lg">
          {error}
        </div>
      )}

      {/* Upload Progress */}
      {loading && uploadProgress > 0 && uploadProgress < 100 && (
        <div className="mb-4 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-blue-600 dark:text-blue-400">
              Yükleniyor...
            </span>
            <span className="text-sm font-medium text-blue-600 dark:text-blue-400">
              {Math.round(uploadProgress)}%
            </span>
          </div>
          <div className="w-full bg-blue-200 dark:bg-blue-900 rounded-full h-2">
            <div
              className="bg-blue-600 h-2 rounded-full transition-all duration-300"
              style={{ width: `${uploadProgress}%` }}
            ></div>
          </div>
        </div>
      )}

      {/* Media Uploader */}
      <div className="mb-6">
        <MediaUploader onMediaChange={handleMediaChange} maxFiles={10} />
      </div>

      {/* Caption Input */}
      <div className="mb-4">
        <label htmlFor="caption" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
          Açıklama
        </label>
        <textarea
          id="caption"
          value={caption}
          onChange={(e) => setCaption(e.target.value)}
          placeholder="Bir şeyler yaz... #hashtag ekleyebilirsin"
          maxLength={2200}
          rows={4}
          disabled={loading}
          className="w-full px-4 py-3 rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-primary focus:border-transparent transition resize-none disabled:opacity-50"
        />
        <div className="mt-1 text-xs text-gray-500 dark:text-gray-400 text-right">
          {caption.length} / 2200 karakter
        </div>
      </div>

      {/* Location Input */}
      <div className="mb-6">
        <label htmlFor="location" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
          Konum (Opsiyonel)
        </label>
        <div className="relative">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"
              />
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"
              />
            </svg>
          </div>
          <input
            id="location"
            type="text"
            value={location}
            onChange={(e) => setLocation(e.target.value)}
            placeholder="İstanbul, Türkiye"
            maxLength={100}
            disabled={loading}
            className="w-full pl-10 pr-4 py-3 rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-primary focus:border-transparent transition disabled:opacity-50"
          />
        </div>
      </div>

      {/* Premium Content Pricing */}
      <div className="mb-6">
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
          💎 Premium İçerik Fiyatı
        </label>
        <div className="grid grid-cols-5 gap-2">
          {[0, 10, 20, 30, 40].map((priceOption) => (
            <button
              key={priceOption}
              type="button"
              onClick={() => setPrice(priceOption)}
              disabled={loading}
              className={`py-3 px-2 rounded-lg font-bold text-sm transition-all disabled:opacity-50 ${
                price === priceOption
                  ? 'bg-gradient-to-r from-primary to-secondary text-white shadow-lg scale-105'
                  : 'bg-white dark:bg-gray-800 border-2 border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-300 hover:border-primary hover:scale-105'
              }`}
            >
              {priceOption === 0 ? (
                <div>
                  <div className="text-lg">🆓</div>
                  <div className="text-xs mt-1">Ücretsiz</div>
                </div>
              ) : (
                <div>
                  <div className="text-lg">💎</div>
                  <div className="text-xs mt-1">{priceOption} Puan</div>
                </div>
              )}
            </button>
          ))}
        </div>
        <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">
          {price === 0
            ? '✨ İçeriğin herkese açık olacak'
            : `🔒 Kullanıcılar ${price} puan ödeyerek içeriğini görebilecek ve sen ${price} puan kazanacaksın!`}
        </p>
      </div>

      {/* Info Box */}
      <div className="bg-gradient-to-r from-primary/10 to-secondary/10 dark:from-primary/20 dark:to-secondary/20 rounded-lg p-4">
        <div className="flex items-start">
          <svg className="w-5 h-5 text-primary mt-0.5 mr-3 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
            <path
              fillRule="evenodd"
              d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z"
              clipRule="evenodd"
            />
          </svg>
          <div className="text-sm text-gray-700 dark:text-gray-300">
            <p className="font-semibold mb-1">Post paylaşarak puan kazan! 🏆</p>
            <p className="text-gray-600 dark:text-gray-400">
              Her post için <span className="font-bold text-primary">+10 puan</span> kazanırsın.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default NewPost;
