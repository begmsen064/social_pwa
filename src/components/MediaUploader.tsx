import { useState, useRef } from 'react';
import { validateMediaFile } from '../utils/imageCompression';

interface MediaFile {
  file: File;
  preview: string;
  type: 'image' | 'video';
}

interface MediaUploaderProps {
  onMediaChange: (files: File[]) => void;
  maxFiles?: number;
}

const MediaUploader = ({ onMediaChange, maxFiles = 10 }: MediaUploaderProps) => {
  const [mediaFiles, setMediaFiles] = useState<MediaFile[]>([]);
  const [dragActive, setDragActive] = useState(false);
  const [error, setError] = useState<string>('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFiles = (files: FileList | null) => {
    if (!files) return;

    setError('');
    const newFiles: MediaFile[] = [];
    const filesArray = Array.from(files);

    // Check max files limit
    if (mediaFiles.length + filesArray.length > maxFiles) {
      setError(`Maksimum ${maxFiles} dosya yükleyebilirsiniz`);
      return;
    }

    filesArray.forEach((file) => {
      // Validate file
      const validation = validateMediaFile(file);
      if (!validation.valid) {
        setError(validation.error || 'Geçersiz dosya');
        return;
      }

      // Create preview
      const preview = URL.createObjectURL(file);
      const type = file.type.startsWith('video/') ? 'video' : 'image';

      newFiles.push({ file, preview, type });
    });

    const updatedFiles = [...mediaFiles, ...newFiles];
    setMediaFiles(updatedFiles);
    onMediaChange(updatedFiles.map((m) => m.file));
  };

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFiles(e.dataTransfer.files);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      handleFiles(e.target.files);
    }
  };

  const removeMedia = (index: number) => {
    const updatedFiles = mediaFiles.filter((_, i) => i !== index);
    setMediaFiles(updatedFiles);
    onMediaChange(updatedFiles.map((m) => m.file));
    
    // Revoke object URL
    URL.revokeObjectURL(mediaFiles[index].preview);
  };

  const openFilePicker = () => {
    fileInputRef.current?.click();
  };

  return (
    <div className="w-full">
      {/* Upload Area */}
      <div
        className={`relative border-2 border-dashed rounded-xl p-8 transition-all ${
          dragActive
            ? 'border-primary bg-primary/5'
            : 'border-gray-300 dark:border-gray-700 hover:border-primary'
        }`}
        onDragEnter={handleDrag}
        onDragLeave={handleDrag}
        onDragOver={handleDrag}
        onDrop={handleDrop}
        onClick={openFilePicker}
      >
        <input
          ref={fileInputRef}
          type="file"
          multiple
          accept="image/*,video/*"
          onChange={handleChange}
          className="hidden"
        />

        <div className="flex flex-col items-center justify-center text-center">
          <svg
            className="w-16 h-16 text-gray-400 dark:text-gray-600 mb-4"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth="2"
              d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"
            />
          </svg>

          <p className="text-lg font-semibold text-gray-700 dark:text-gray-300 mb-2">
            Resim veya video yükleyin
          </p>
          <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">
            Sürükle & bırak veya tıklayın
          </p>
          <p className="text-xs text-gray-400 dark:text-gray-500">
            PNG, JPG, GIF, MP4, MOV veya WEBM (max {maxFiles} dosya)
          </p>
          <p className="text-xs text-orange-500 dark:text-orange-400 mt-1">
            ⚠️ Videolar maksimum 4MB olmalıdır
          </p>
        </div>
      </div>

      {/* Error Message */}
      {error && (
        <div className="mt-4 p-3 bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 rounded-lg text-sm">
          {error}
        </div>
      )}

      {/* Preview Grid */}
      {mediaFiles.length > 0 && (
        <div className="mt-6 grid grid-cols-2 md:grid-cols-3 gap-4">
          {mediaFiles.map((media, index) => (
            <div key={index} className="relative group aspect-square rounded-lg overflow-hidden bg-gray-100 dark:bg-gray-800">
              {media.type === 'image' ? (
                <img
                  src={media.preview}
                  alt={`Preview ${index + 1}`}
                  className="w-full h-full object-cover"
                />
              ) : (
                <video
                  src={media.preview}
                  className="w-full h-full object-cover"
                  muted
                />
              )}

              {/* Remove Button */}
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  removeMedia(index);
                }}
                className="absolute top-2 right-2 w-8 h-8 bg-red-500 hover:bg-red-600 text-white rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    d="M6 18L18 6M6 6l12 12"
                  />
                </svg>
              </button>

              {/* Video Icon Overlay */}
              {media.type === 'video' && (
                <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                  <div className="w-12 h-12 bg-black/50 rounded-full flex items-center justify-center">
                    <svg className="w-6 h-6 text-white" fill="currentColor" viewBox="0 0 20 20">
                      <path d="M6.3 2.841A1.5 1.5 0 004 4.11V15.89a1.5 1.5 0 002.3 1.269l9.344-5.89a1.5 1.5 0 000-2.538L6.3 2.84z" />
                    </svg>
                  </div>
                </div>
              )}

              {/* Index Badge */}
              <div className="absolute bottom-2 left-2 w-6 h-6 bg-black/70 text-white text-xs rounded-full flex items-center justify-center font-semibold">
                {index + 1}
              </div>
            </div>
          ))}

          {/* Add More Button */}
          {mediaFiles.length < maxFiles && (
            <button
              onClick={openFilePicker}
              className="aspect-square rounded-lg border-2 border-dashed border-gray-300 dark:border-gray-700 hover:border-primary hover:bg-primary/5 transition-all flex items-center justify-center"
            >
              <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d="M12 4v16m8-8H4"
                />
              </svg>
            </button>
          )}
        </div>
      )}

      {/* File Counter */}
      {mediaFiles.length > 0 && (
        <p className="mt-4 text-sm text-gray-500 dark:text-gray-400 text-center">
          {mediaFiles.length} / {maxFiles} dosya seçildi
        </p>
      )}
    </div>
  );
};

export default MediaUploader;