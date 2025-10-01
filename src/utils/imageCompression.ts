export interface CompressOptions {
  maxWidth?: number;
  maxHeight?: number;
  quality?: number;
}

export const compressImage = async (
  file: File,
  options: CompressOptions = {}
): Promise<File> => {
  const { maxWidth = 1920, maxHeight = 1920, quality = 0.8 } = options;

  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    
    reader.onload = (event) => {
      const img = new Image();
      img.src = event.target?.result as string;
      
      img.onload = () => {
        const canvas = document.createElement('canvas');
        let width = img.width;
        let height = img.height;

        // Calculate new dimensions
        if (width > height) {
          if (width > maxWidth) {
            height *= maxWidth / width;
            width = maxWidth;
          }
        } else {
          if (height > maxHeight) {
            width *= maxHeight / height;
            height = maxHeight;
          }
        }

        canvas.width = width;
        canvas.height = height;

        const ctx = canvas.getContext('2d');
        ctx?.drawImage(img, 0, 0, width, height);

        canvas.toBlob(
          (blob) => {
            if (!blob) {
              reject(new Error('Canvas to Blob conversion failed'));
              return;
            }
            const compressedFile = new File([blob], file.name, {
              type: 'image/jpeg',
              lastModified: Date.now(),
            });
            resolve(compressedFile);
          },
          'image/jpeg',
          quality
        );
      };

      img.onerror = () => {
        reject(new Error('Image load error'));
      };
    };

    reader.onerror = () => {
      reject(new Error('FileReader error'));
    };
  });
};

export const validateMediaFile = (file: File): { valid: boolean; error?: string } => {
  const maxSize = 50 * 1024 * 1024; // 50MB
  const allowedImageTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/gif'];
  const allowedVideoTypes = ['video/mp4', 'video/quicktime', 'video/webm'];
  const allowedTypes = [...allowedImageTypes, ...allowedVideoTypes];

  if (!allowedTypes.includes(file.type)) {
    return {
      valid: false,
      error: 'Desteklenmeyen dosya formatı. JPG, PNG, GIF, MP4, MOV veya WEBM yükleyin.',
    };
  }

  if (file.size > maxSize) {
    return {
      valid: false,
      error: 'Dosya boyutu çok büyük. Maksimum 50MB yükleyebilirsiniz.',
    };
  }

  return { valid: true };
};

export const generateThumbnail = async (videoFile: File): Promise<File> => {
  return new Promise((resolve, reject) => {
    const video = document.createElement('video');
    video.preload = 'metadata';
    video.muted = true;

    video.onloadedmetadata = () => {
      video.currentTime = 1; // Get frame at 1 second
    };

    video.onseeked = () => {
      const canvas = document.createElement('canvas');
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;

      const ctx = canvas.getContext('2d');
      ctx?.drawImage(video, 0, 0, canvas.width, canvas.height);

      canvas.toBlob((blob) => {
        if (!blob) {
          reject(new Error('Thumbnail generation failed'));
          return;
        }
        const thumbnailFile = new File([blob], `${videoFile.name}_thumb.jpg`, {
          type: 'image/jpeg',
          lastModified: Date.now(),
        });
        resolve(thumbnailFile);
      }, 'image/jpeg', 0.7);
    };

    video.onerror = () => {
      reject(new Error('Video load error'));
    };

    video.src = URL.createObjectURL(videoFile);
  });
};