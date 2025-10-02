import { supabase } from '../lib/supabase';

/**
 * Upload a file to Cloudflare R2 via Supabase Edge Function
 */
export async function uploadToR2(
  file: File,
  folder: 'avatars' | 'posts' | 'videos' = 'posts'
): Promise<{ url: string; fileName: string } | null> {
  try {
    // Convert file to base64
    const base64 = await fileToBase64(file);

    // Call Edge Function
    const { data, error } = await supabase.functions.invoke('upload-to-r2', {
      body: {
        file: base64,
        fileName: file.name,
        fileType: file.type,
        folder: folder,
      },
    });

    if (error) {
      console.error('R2 upload error:', error);
      throw error;
    }

    if (!data.success) {
      throw new Error(data.error || 'Upload failed');
    }

    return {
      url: data.url,
      fileName: data.fileName,
    };
  } catch (error) {
    console.error('Error uploading to R2:', error);
    return null;
  }
}

/**
 * Convert File to base64 string
 */
function fileToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = (error) => reject(error);
  });
}

/**
 * Upload multiple files to R2
 */
export async function uploadMultipleToR2(
  files: File[],
  folder: 'avatars' | 'posts' | 'videos' = 'posts'
): Promise<Array<{ url: string; fileName: string; type: string }>> {
  const uploadPromises = files.map(async (file) => {
    const result = await uploadToR2(file, folder);
    if (!result) {
      throw new Error(`Failed to upload ${file.name}`);
    }
    return {
      url: result.url,
      fileName: result.fileName,
      type: file.type.startsWith('video') ? 'video' : 'image',
    };
  });

  return Promise.all(uploadPromises);
}
