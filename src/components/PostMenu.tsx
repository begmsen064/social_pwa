import { useRef, useEffect } from 'react';
import { Trash2, Edit3, Flag, X } from 'lucide-react';

interface PostMenuProps {
  isOpen: boolean;
  onClose: () => void;
  isOwner: boolean;
  onDelete: () => void;
  onEdit: () => void;
  onReport: () => void;
}

export const PostMenu = ({ isOpen, onClose, isOwner, onDelete, onEdit, onReport }: PostMenuProps) => {
  const menuRef = useRef<HTMLDivElement>(null);

  // Close menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <>
      {/* Backdrop */}
      <div 
        className="fixed inset-0 z-40 bg-black/20" 
        onClick={onClose}
      />

      {/* Menu */}
      <div
        ref={menuRef}
        className="absolute right-0 top-12 z-50 w-56 bg-white dark:bg-gray-800 rounded-lg shadow-xl border border-gray-200 dark:border-gray-700 overflow-hidden"
      >
        {isOwner ? (
          <>
            {/* Edit Button */}
            <button
              onClick={() => {
                onEdit();
                onClose();
              }}
              className="w-full flex items-center gap-3 px-4 py-3 text-left hover:bg-gray-50 dark:hover:bg-gray-700 transition"
            >
              <Edit3 className="w-5 h-5 text-blue-500" />
              <span className="text-sm font-medium text-gray-900 dark:text-white">
                Düzenle
              </span>
            </button>

            {/* Delete Button */}
            <button
              onClick={() => {
                onDelete();
                onClose();
              }}
              className="w-full flex items-center gap-3 px-4 py-3 text-left hover:bg-red-50 dark:hover:bg-red-900/20 transition"
            >
              <Trash2 className="w-5 h-5 text-red-500" />
              <span className="text-sm font-medium text-red-600 dark:text-red-400">
                Sil
              </span>
            </button>
          </>
        ) : (
          <>
            {/* Report Button */}
            <button
              onClick={() => {
                onReport();
                onClose();
              }}
              className="w-full flex items-center gap-3 px-4 py-3 text-left hover:bg-gray-50 dark:hover:bg-gray-700 transition"
            >
              <Flag className="w-5 h-5 text-orange-500" />
              <span className="text-sm font-medium text-gray-900 dark:text-white">
                Rapor Et
              </span>
            </button>
          </>
        )}

        {/* Cancel Button */}
        <button
          onClick={onClose}
          className="w-full flex items-center gap-3 px-4 py-3 text-left border-t border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700 transition"
        >
          <X className="w-5 h-5 text-gray-500" />
          <span className="text-sm font-medium text-gray-600 dark:text-gray-400">
            İptal
          </span>
        </button>
      </div>
    </>
  );
};