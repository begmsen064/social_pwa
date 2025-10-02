import { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Camera, X } from 'lucide-react';
import { useAuthStore } from '../store/authStore';
import { supabase } from '../lib/supabase';
import { uploadToR2 } from '../utils/uploadToR2';

const EditProfile = () => {
  const navigate = useNavigate();
  const { user, setUser } = useAuthStore();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [bio, setBio] = useState(user?.bio || '');
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState('');

  const getAvatarUrl = (avatarUrl: string | null | undefined) => {
    if (!avatarUrl) return null;
    // R2 URLs already include full path
    return avatarUrl;
  };

  const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith('image/')) {
      setError('Sadece resim dosyaları yüklenebilir');
      return;
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      setError('Dosya boyutu 5MB\'dan küçük olmalıdır');
      return;
    }

    setAvatarFile(file);
    setAvatarPreview(URL.createObjectURL(file));
    setError('');
  };

  const removeAvatar = () => {
    setAvatarFile(null);
    setAvatarPreview(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleSave = async () => {
    if (!user) return;

    try {
      setIsSaving(true);
      setError('');

      let avatarUrl = user.avatar_url;

      // Upload avatar if changed
      if (avatarFile) {
        // Upload to Cloudflare R2
        const uploadResult = await uploadToR2(avatarFile, 'avatars');
        
        if (!uploadResult) {
          throw new Error('Avatar yüklenemedi');
        }
        
        avatarUrl = uploadResult.url;
      }

      // Update profile
      const { error: updateError } = await supabase
        .from('profiles')
        .update({
          bio: bio.trim() || undefined,
          avatar_url: avatarUrl,
          updated_at: new Date().toISOString(),
        })
        .eq('id', user.id);

      if (updateError) throw updateError;

      // Update local user state
      setUser({
        ...user,
        bio: bio.trim() || undefined,
        avatar_url: avatarUrl,
      });

      navigate('/profile');
    } catch (err) {
      console.error('Error updating profile:', err);
      setError('Profil güncellenirken bir hata oluştu');
    } finally {
      setIsSaving(false);
    }
  };

  if (!user) return null;

  const currentAvatar = avatarPreview || getAvatarUrl(user.avatar_url);

  return (
    <div className="min-h-screen pb-20 bg-gray-50 dark:bg-black">
      {/* Header */}
      <div className="sticky top-0 z-10 bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-800 px-4 py-3">
        <div className="flex items-center justify-between max-w-2xl mx-auto">
          <button
            onClick={() => navigate(-1)}
            disabled={isSaving}
            className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-full transition disabled:opacity-50"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <h1 className="text-lg font-semibold">Edit Profile</h1>
          <button
            onClick={handleSave}
            disabled={isSaving}
            className="px-4 py-1.5 bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold rounded-lg transition disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isSaving ? 'Saving...' : 'Save'}
          </button>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-2xl mx-auto px-4 py-6">
        {/* Error Message */}
        {error && (
          <div className="mb-4 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
            <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
          </div>
        )}

        {/* Avatar */}
        <div className="bg-white dark:bg-gray-900 rounded-xl p-6 mb-4">
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-4">
            Profile Picture
          </label>
          <div className="flex items-center gap-6">
            {/* Avatar Preview */}
            <div className="relative">
              {currentAvatar ? (
                <img
                  src={currentAvatar}
                  alt="Avatar"
                  className="w-24 h-24 rounded-full object-cover"
                />
              ) : (
                <div className="w-24 h-24 rounded-full bg-gradient-to-br from-primary to-secondary flex items-center justify-center text-white text-3xl font-bold">
                  {user.username[0]?.toUpperCase() || '?'}
                </div>
              )}
              {avatarPreview && (
                <button
                  onClick={removeAvatar}
                  className="absolute -top-2 -right-2 p-1 bg-red-500 hover:bg-red-600 text-white rounded-full transition"
                >
                  <X className="w-4 h-4" />
                </button>
              )}
            </div>

            {/* Upload Button */}
            <div>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleAvatarChange}
                className="hidden"
              />
              <button
                onClick={() => fileInputRef.current?.click()}
                className="px-4 py-2 border border-gray-300 dark:border-gray-700 rounded-lg font-medium hover:bg-gray-50 dark:hover:bg-gray-800 transition flex items-center gap-2"
              >
                <Camera className="w-4 h-4" />
                Change Photo
              </button>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">
                JPG, PNG or GIF. Max 5MB.
              </p>
            </div>
          </div>
        </div>

        {/* Username (Read-only) */}
        <div className="bg-white dark:bg-gray-900 rounded-xl p-6 mb-4">
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Username
          </label>
          <input
            type="text"
            value={user.username}
            disabled
            className="w-full px-4 py-3 border border-gray-300 dark:border-gray-700 rounded-lg bg-gray-100 dark:bg-gray-800 text-gray-500 dark:text-gray-400 cursor-not-allowed"
          />
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
            Username cannot be changed
          </p>
        </div>

        {/* Bio */}
        <div className="bg-white dark:bg-gray-900 rounded-xl p-6">
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Bio
          </label>
          <textarea
            value={bio}
            onChange={(e) => setBio(e.target.value)}
            rows={4}
            maxLength={150}
            placeholder="Tell us about yourself..."
            className="w-full px-4 py-3 border border-gray-300 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
          />
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-1 text-right">
            {bio.length}/150
          </p>
        </div>
      </div>
    </div>
  );
};

export default EditProfile;