import { supabase } from '../lib/supabase';

/**
 * Upload a file to Cloudflare R2 using presigned URL for large files
 * or base64 for small files
 */
export async function uploadToR2(
  file: File,
  folder: 'avatars' | 'posts' | 'videos' = 'posts'
): Promise<{ url: string; fileName: string } | null> {
  try {
    // Check file size limit (50MB)
    const maxSizeBytes = 50 * 1024 * 1024; // 50MB
    if (file.size > maxSizeBytes) {
      const sizeMB = (file.size / (1024 * 1024)).toFixed(2);
      throw new Error(`Dosya \u00e7ok b\u00fcy\u00fck (${sizeMB}MB). Maksimum 50MB olmal\u0131.`);
    }

    // Use presigned URL for files larger than 4MB
    const usePresignedUrl = file.size > 4 * 1024 * 1024;

    if (usePresignedUrl) {
      return await uploadWithPresignedUrl(file, folder);
    }

    // Convert file to base64 for small files
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
      // Provide better error message
      if (error.message?.includes('fetch')) {
        throw new Error('Ağ hatası. İnternet bağlantınızı kontrol edin.');
      } else if (error.message?.includes('timeout')) {
        throw new Error('Yükleme zaman aşımına uğradı. Tekrar deneyin.');
      }
      throw new Error('R2 yükleme hatası: ' + error.message);
    }

    if (!data.success) {
      throw new Error(data.error || 'Yükleme başarısız oldu');
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
 * Upload large file using presigned URL (direct to R2)
 */
async function uploadWithPresignedUrl(
  file: File,
  folder: 'avatars' | 'posts' | 'videos'
): Promise<{ url: string; fileName: string } | null> {
  try {
    // Step 1: Get presigned URL from Edge Function
    const { data, error } = await supabase.functions.invoke('r2-presigned-url', {
      body: {
        fileName: file.name,
        fileType: file.type,
        folder: folder,
      },
    });

    if (error || !data.success) {
      throw new Error(data?.error || 'Failed to get presigned URL');
    }

    const { presignedUrl, publicUrl, fileName } = data;

    // Step 2: Upload file directly to R2 using presigned URL
    const uploadResponse = await fetch(presignedUrl, {
      method: 'PUT',
      body: file,
      headers: {
        'Content-Type': file.type,
      },
    });

    if (!uploadResponse.ok) {
      throw new Error(`Upload failed: ${uploadResponse.statusText}`);
    }

    return {
      url: publicUrl,
      fileName: fileName,
    };
  } catch (error) {
    console.error('Presigned URL upload error:', error);
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
