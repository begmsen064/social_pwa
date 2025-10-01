import { supabase } from '../lib/supabase';
import { compressImage, generateThumbnail } from './imageCompression';

export interface UploadedMedia {
  url: string;
  type: 'image' | 'video';
  thumbnailUrl?: string;
}

export const uploadMediaToStorage = async (
  file: File,
  userId: string
): Promise<UploadedMedia> => {
  const isVideo = file.type.startsWith('video/');
  const timestamp = Date.now();
  const randomId = Math.random().toString(36).substring(7);
  const fileExt = file.name.split('.').pop();
  const fileName = `${userId}/${timestamp}_${randomId}.${fileExt}`;

  let fileToUpload = file;

  // Compress image if it's an image
  if (!isVideo) {
    try {
      fileToUpload = await compressImage(file, {
        maxWidth: 1920,
        maxHeight: 1920,
        quality: 0.85,
      });
    } catch (error) {
      console.error('Image compression failed, using original:', error);
    }
  }

  // Upload main file
  const { data: uploadData, error: uploadError } = await supabase.storage
    .from('posts')
    .upload(fileName, fileToUpload, {
      contentType: file.type,
      cacheControl: '3600',
      upsert: false,
    });

  if (uploadError) {
    throw new Error(`Upload failed: ${uploadError.message}`);
  }

  // Get public URL
  const { data: urlData } = supabase.storage
    .from('posts')
    .getPublicUrl(uploadData.path);

  const result: UploadedMedia = {
    url: urlData.publicUrl,
    type: isVideo ? 'video' : 'image',
  };

  // Generate and upload thumbnail for videos
  if (isVideo) {
    try {
      const thumbnailFile = await generateThumbnail(file);
      const thumbnailFileName = `${userId}/${timestamp}_${randomId}_thumb.jpg`;

      const { data: thumbData, error: thumbError } = await supabase.storage
        .from('posts')
        .upload(thumbnailFileName, thumbnailFile, {
          contentType: 'image/jpeg',
          cacheControl: '3600',
          upsert: false,
        });

      if (!thumbError && thumbData) {
        const { data: thumbUrlData } = supabase.storage
          .from('posts')
          .getPublicUrl(thumbData.path);

        result.thumbnailUrl = thumbUrlData.publicUrl;
      }
    } catch (error) {
      console.error('Thumbnail generation failed:', error);
    }
  }

  return result;
};

export const uploadMultipleMedia = async (
  files: File[],
  userId: string,
  onProgress?: (progress: number) => void
): Promise<UploadedMedia[]> => {
  const results: UploadedMedia[] = [];
  const total = files.length;

  for (let i = 0; i < files.length; i++) {
    const file = files[i];
    try {
      const uploaded = await uploadMediaToStorage(file, userId);
      results.push(uploaded);
      
      if (onProgress) {
        onProgress(((i + 1) / total) * 100);
      }
    } catch (error) {
      console.error(`Failed to upload ${file.name}:`, error);
      throw error;
    }
  }

  return results;
};