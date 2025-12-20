import { useState, useRef, useCallback } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { useUIStore } from '@/stores/ui-store';
import { images } from '@/lib/api';
import { Upload, FileImage, AlertCircle } from 'lucide-react';
import { useAuthStore } from '@/stores/auth-store';
import { useElementsStore } from '@/stores/elements-store';
import { usePagesStore } from '@/stores/pages-store';

const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB

export function ImageUploadDialog() {
  const { activeDialog, closeDialog, triggerMediaRefresh } = useUIStore();
  const { currentProject } = useAuthStore();
  const createElement = useElementsStore((state) => state.createElement);
  const currentPageId = usePagesStore((state) => state.currentPageId);
  const [isDragging, setIsDragging] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFile = useCallback(
    async (file: File) => {
      setError(null);

      // Validate file type
      if (!['image/jpeg', 'image/png', 'image/webp'].includes(file.type)) {
        setError('Please upload a JPEG, PNG, or WebP image');
        return;
      }

      // Validate file size
      if (file.size > MAX_FILE_SIZE) {
        setError('File size must be less than 10MB');
        return;
      }

      if (!currentProject) {
        setError('No project selected');
        return;
      }

      try {
        setUploading(true);
        setUploadProgress(0);

        // Simulate progress for better UX
        const progressInterval = setInterval(() => {
          setUploadProgress((prev) => Math.min(prev + 10, 90));
        }, 200);

        const uploadedImage = await images.upload(currentProject.id, file);

        clearInterval(progressInterval);
        setUploadProgress(100);

        // Create image element on canvas at center if we have a current page
        if (currentPageId) {
          // Calculate center position and size based on image aspect ratio
          const canvasWidth = 1200; // Default canvas width
          const canvasHeight = 800; // Default canvas height
          const maxWidth = 600;
          const maxHeight = 600;

          // Calculate dimensions maintaining aspect ratio
          let width = uploadedImage.width;
          let height = uploadedImage.height;

          if (width > maxWidth || height > maxHeight) {
            const aspectRatio = width / height;
            if (width > height) {
              width = maxWidth;
              height = maxWidth / aspectRatio;
            } else {
              height = maxHeight;
              width = maxHeight * aspectRatio;
            }
          }

          // Center the image on the canvas
          const x = (canvasWidth - width) / 2;
          const y = (canvasHeight - height) / 2;

          await createElement(currentPageId, {
            type: 'image',
            position: {
              x,
              y,
              width,
              height,
            },
            imageId: uploadedImage.id,
          });
        }

        // Trigger media library refresh
        triggerMediaRefresh();

        // Success - close dialog after brief delay
        setTimeout(() => {
          closeDialog();
          setUploading(false);
          setUploadProgress(0);
        }, 500);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Upload failed');
        setUploading(false);
        setUploadProgress(0);
      }
    },
    [currentProject, closeDialog, createElement, currentPageId, triggerMediaRefresh]
  );

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setIsDragging(false);

      const file = e.dataTransfer.files[0];
      if (file) {
        handleFile(file);
      }
    },
    [handleFile]
  );

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  }, []);

  const handleFileSelect = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (file) {
        handleFile(file);
      }
    },
    [handleFile]
  );

  const handleClick = () => {
    fileInputRef.current?.click();
  };

  return (
    <Dialog open={activeDialog === 'upload'} onOpenChange={closeDialog}>
      <DialogContent className="sm:max-w-[550px] bg-[#f4f1e8] border-4 border-[#2c2416] shadow-2xl">
        {/* Ornamental corner decorations */}
        <div className="absolute top-0 left-0 w-8 h-8 border-t-2 border-l-2 border-[#d4af37]" />
        <div className="absolute top-0 right-0 w-8 h-8 border-t-2 border-r-2 border-[#d4af37]" />
        <div className="absolute bottom-0 left-0 w-8 h-8 border-b-2 border-l-2 border-[#d4af37]" />
        <div className="absolute bottom-0 right-0 w-8 h-8 border-b-2 border-r-2 border-[#d4af37]" />

        <DialogHeader className="space-y-4 pt-2">
          <DialogTitle className="text-3xl font-serif text-center text-[#2c2416] tracking-wide border-b-2 border-[#2c2416] pb-3">
            <span className="inline-block relative">
              <Upload className="inline-block w-6 h-6 mr-2 mb-1" />
              UPLOAD PHOTOGRAPH
              <div className="absolute -bottom-1 left-0 right-0 h-px bg-[#d4af37]" />
            </span>
          </DialogTitle>
          <DialogDescription className="text-center text-[#2c2416]/70 text-sm italic font-serif">
            Add imagery to your editorial masterpiece
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* Drop zone */}
          <div
            onClick={handleClick}
            onDrop={handleDrop}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            className={`
              relative border-3 border-dashed rounded-sm p-12 cursor-pointer
              transition-all duration-300 group
              ${
                isDragging
                  ? 'border-[#d4af37] bg-[#d4af37]/10 shadow-lg'
                  : 'border-[#2c2416]/40 hover:border-[#8b4513] hover:bg-[#2c2416]/5'
              }
            `}
            style={{
              backgroundImage: isDragging
                ? 'none'
                : 'repeating-linear-gradient(45deg, transparent, transparent 10px, #2c2416 10px, #2c2416 11px)',
              backgroundSize: '100% 100%, 20px 20px',
              backgroundBlendMode: 'multiply',
            } as React.CSSProperties}
          >
            <input
              ref={fileInputRef}
              type="file"
              accept="image/jpeg,image/png,image/webp"
              onChange={handleFileSelect}
              className="hidden"
              disabled={uploading}
            />

            <div className="flex flex-col items-center justify-center text-center space-y-4">
              <div
                className={`
                p-4 rounded-full border-2 transition-all duration-300
                ${
                  isDragging
                    ? 'border-[#d4af37] bg-[#d4af37]/20 scale-110'
                    : 'border-[#2c2416]/30 bg-[#2c2416]/5 group-hover:border-[#d4af37] group-hover:bg-[#d4af37]/10 group-hover:scale-105'
                }
              `}
              >
                <FileImage className="w-10 h-10 text-[#2c2416]" />
              </div>

              <div className="space-y-2">
                <p className="text-lg font-serif text-[#2c2416] font-semibold">
                  {isDragging ? 'Release to upload' : 'Drop photograph here'}
                </p>
                <p className="text-sm text-[#2c2416]/60 font-serif italic">
                  or click to select from archives
                </p>
              </div>

              {!uploading && (
                <div className="pt-2 border-t border-[#2c2416]/20 w-full">
                  <p className="text-xs text-[#2c2416]/50 font-serif">
                    Accepted formats: JPEG, PNG, WebP • Maximum size: 10MB
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* Upload progress */}
          {uploading && (
            <div className="space-y-3 animate-in fade-in-50 slide-in-from-bottom-5">
              <div className="flex items-center justify-between text-sm font-serif">
                <span className="text-[#2c2416]/70">Developing photograph...</span>
                <span className="text-[#d4af37] font-semibold">{uploadProgress}%</span>
              </div>
              <Progress
                value={uploadProgress}
                className="h-2 bg-[#2c2416]/10"
                indicatorClassName="bg-gradient-to-r from-[#8b4513] to-[#d4af37]"
              />
            </div>
          )}

          {/* Error message */}
          {error && (
            <div className="flex items-start gap-3 p-4 border-2 border-[#8b4513] bg-[#8b4513]/10 rounded-sm animate-in fade-in-50">
              <AlertCircle className="w-5 h-5 text-[#8b4513] flex-shrink-0 mt-0.5" />
              <div className="flex-1">
                <p className="text-sm font-serif font-semibold text-[#8b4513]">
                  Publication Error
                </p>
                <p className="text-xs font-serif text-[#8b4513]/80 mt-1">{error}</p>
              </div>
            </div>
          )}
        </div>

        {/* Footer with vintage stamp effect */}
        <div className="border-t-2 border-[#2c2416]/20 pt-4 mt-2">
          <Button
            onClick={closeDialog}
            disabled={uploading}
            className="w-full bg-[#2c2416] hover:bg-[#8b4513] text-[#f4f1e8] font-serif text-sm tracking-wider transition-all duration-300 shadow-md hover:shadow-lg border-2 border-[#2c2416] hover:border-[#d4af37]"
          >
            {uploading ? 'PROCESSING...' : 'CANCEL'}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
