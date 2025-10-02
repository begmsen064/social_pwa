import { supabase } from '../lib/supabase';
import { compressImage, generateThumbnail } from './imageCompression';

export interface UploadedMedia {
  url: string;
  type: 'image' | 'video';
  thumbnailUrl?: string;
}

export const uploadMediaToStorage = async (
  file: File,
  userId: string,
  onProgress?: (progress: number) => void
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

  // For large videos (>10MB), use chunked upload
  const isLargeFile = fileToUpload.size > 10 * 1024 * 1024;
  let uploadData;
  let uploadError;

  if (isLargeFile && isVideo) {
    // Chunked upload for large videos
    const chunkSize = 2 * 1024 * 1024; // 2MB chunks
    const chunks = Math.ceil(fileToUpload.size / chunkSize);
    
    try {
      for (let i = 0; i < chunks; i++) {
        const start = i * chunkSize;
        const end = Math.min(start + chunkSize, fileToUpload.size);
        const chunk = fileToUpload.slice(start, end);
        
        const { data, error } = await supabase.storage
          .from('posts')
          .upload(fileName, chunk, {
            contentType: file.type,
            cacheControl: '3600',
            upsert: i > 0, // First chunk creates, others upsert
          });
        
        if (error) throw error;
        
        // Update progress for this chunk
        if (onProgress) {
          const chunkProgress = ((i + 1) / chunks) * 50; // First 50% is upload
          onProgress(chunkProgress);
        }
        
        if (i === chunks - 1) {
          uploadData = data;
        }
      }
    } catch (error: any) {
      uploadError = error;
    }
  } else {
    // Regular upload for small files
    const result = await supabase.storage
      .from('posts')
      .upload(fileName, fileToUpload, {
        contentType: file.type,
        cacheControl: '3600',
        upsert: false,
      });
    
    uploadData = result.data;
    uploadError = result.error;
    
    if (onProgress) {
      onProgress(50); // 50% after upload completes
    }
  }

  if (uploadError || !uploadData) {
    throw new Error(`Upload failed: ${uploadError?.message || 'Unknown error'}`);
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
      
      if (onProgress) {
        onProgress(100); // 100% after thumbnail
      }
    } catch (error) {
      console.error('Thumbnail generation failed:', error);
      if (onProgress) {
        onProgress(100); // Still mark as complete even if thumbnail fails
      }
    }
  } else {
    // For images, mark as complete
    if (onProgress) {
      onProgress(100);
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
      // Individual file progress callback
      const fileProgress = (filePercent: number) => {
        if (onProgress) {
          // Calculate overall progress: previous files + current file progress
          const previousFilesProgress = (i / total) * 100;
          const currentFileProgress = (filePercent / 100) * (100 / total);
          onProgress(previousFilesProgress + currentFileProgress);
        }
      };
      
      const uploaded = await uploadMediaToStorage(file, userId, fileProgress);
      results.push(uploaded);
    } catch (error) {
      console.error(`Failed to upload ${file.name}:`, error);
      throw error;
    }
  }

  return results;
};
