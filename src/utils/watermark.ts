/**
 * Add watermark to image using canvas
 */
export const addWatermarkToImage = async (
  file: File,
  username: string
): Promise<File> => {
  return new Promise((resolve, reject) => {
    const img = new Image();
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');

    if (!ctx) {
      reject(new Error('Canvas context not available'));
      return;
    }

    img.onload = () => {
      // Set canvas size to image size
      canvas.width = img.width;
      canvas.height = img.height;

      // Draw original image
      ctx.drawImage(img, 0, 0);

      // Calculate font size based on image size
      const fontSize = Math.max(Math.floor(img.width / 20), 24);
      ctx.font = `${fontSize}px Arial, sans-serif`;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';

      // Watermark text
      const line1 = 'kunduz.vip';
      const line2 = `@${username}`;

      // Calculate center position
      const centerX = canvas.width / 2;
      const centerY = canvas.height / 2;
      const lineHeight = fontSize * 1.5;

      // Draw watermark text with shadow for better visibility
      ctx.shadowColor = 'rgba(0, 0, 0, 0.8)';
      ctx.shadowBlur = 8;
      ctx.shadowOffsetX = 3;
      ctx.shadowOffsetY = 3;

      // Draw first line (kunduz.vip) - more transparent
      ctx.fillStyle = 'rgba(255, 255, 255, 0.4)';
      ctx.fillText(line1, centerX, centerY - lineHeight / 2);

      // Draw second line (@username) - more transparent
      ctx.fillText(line2, centerX, centerY + lineHeight / 2);

      // Convert canvas to blob
      canvas.toBlob(
        (blob) => {
          if (!blob) {
            reject(new Error('Failed to create blob'));
            return;
          }

          // Create new file with watermark
          const watermarkedFile = new File(
            [blob],
            file.name,
            {
              type: file.type,
              lastModified: Date.now(),
            }
          );

          resolve(watermarkedFile);
        },
        file.type,
        0.95 // Quality (0.95 = high quality)
      );
    };

    img.onerror = () => {
      reject(new Error('Failed to load image'));
    };

    // Load image from file
    const reader = new FileReader();
    reader.onload = (e) => {
      img.src = e.target?.result as string;
    };
    reader.onerror = () => {
      reject(new Error('Failed to read file'));
    };
    reader.readAsDataURL(file);
  });
};

/**
 * Add watermark to video (creates a thumbnail with watermark)
 * For actual video watermark, you'd need server-side processing
 */
export const addWatermarkToVideo = async (
  file: File,
  username: string
): Promise<File> => {
  // For videos, we return the original file
  // Video watermarking requires server-side processing (ffmpeg)
  // But we can add a note that watermark will be added
  console.log(`Video watermark placeholder for @${username}`);
  return file;
};

/**
 * Add watermark to media file (image or video)
 */
export const addWatermarkToMedia = async (
  file: File,
  username: string
): Promise<File> => {
  const isVideo = file.type.startsWith('video/');
  
  if (isVideo) {
    // For videos, just return original for now
    // In production, you'd process this server-side
    return addWatermarkToVideo(file, username);
  } else {
    // For images, add watermark using canvas
    return addWatermarkToImage(file, username);
  }
};
