import { compressImage, generateThumbnail } from './imageCompression';
import { uploadToR2 } from './uploadToR2';

export interface UploadedMedia {
  url: string;
  type: 'image' | 'video';
  thumbnailUrl?: string;
}

export const uploadMediaToStorage = async (
  file: File,
  _userId: string, // Kept for backward compatibility but not used
  onProgress?: (progress: number) => void
): Promise<UploadedMedia> => {
  const isVideo = file.type.startsWith('video/');

  let fileToUpload = file;

  // Compress image if it's an image
  if (!isVideo) {
    try {
      fileToUpload = await compressImage(file, {
        maxWidth: 1920,
        maxHeight: 1920,
        quality: 0.85,
      });
      if (onProgress) onProgress(30); // 30% after compression
    } catch (error) {
      console.error('Image compression failed, using original:', error);
    }
  }

  // Upload to Cloudflare R2
  const folder = isVideo ? 'videos' : 'posts';
  const uploadResult = await uploadToR2(fileToUpload, folder);
  
  if (!uploadResult) {
    throw new Error('Upload to R2 failed');
  }

  if (onProgress) onProgress(70); // 70% after upload

  const result: UploadedMedia = {
    url: uploadResult.url,
    type: isVideo ? 'video' : 'image',
  };

  // Generate and upload thumbnail for videos
  if (isVideo) {
    try {
      const thumbnailFile = await generateThumbnail(file);
      const thumbResult = await uploadToR2(thumbnailFile, 'videos');
      
      if (thumbResult) {
        result.thumbnailUrl = thumbResult.url;
      }
      
      if (onProgress) onProgress(100); // 100% after thumbnail
    } catch (error) {
      console.error('Thumbnail generation failed:', error);
      if (onProgress) onProgress(100); // Still mark as complete even if thumbnail fails
    }
  } else {
    // For images, mark as complete
    if (onProgress) onProgress(100);
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
