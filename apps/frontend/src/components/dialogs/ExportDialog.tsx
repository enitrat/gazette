import { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { useUIStore } from '@/stores/ui-store';
import { useAuthStore } from '@/stores/auth-store';
import { exports } from '@/lib/api';
import { Download, FileText, Video, Loader2, CheckCircle2, AlertCircle, FileType, Film } from 'lucide-react';

type ExportType = 'html' | 'videos' | 'pdf' | 'slideshow' | null;

export function ExportDialog() {
  const { activeDialog, closeDialog } = useUIStore();
  const { currentProject } = useAuthStore();
  const [loading, setLoading] = useState<ExportType>(null);
  const [success, setSuccess] = useState<ExportType>(null);
  const [error, setError] = useState<string | null>(null);

  const handleExport = async (type: 'html' | 'videos' | 'pdf' | 'slideshow') => {
    if (!currentProject) {
      setError('No project selected');
      return;
    }

    try {
      setLoading(type);
      setError(null);
      setSuccess(null);

      let blob: Blob;
      let filename: string;

      if (type === 'html') {
        blob = await exports.html(currentProject.id);
        filename = `${currentProject.name}-html.zip`;
      } else if (type === 'pdf') {
        blob = await exports.pdf(currentProject.id);
        filename = `${currentProject.name}.pdf`;
      } else if (type === 'slideshow') {
        blob = await exports.slideshow(currentProject.id);
        filename = `${currentProject.name}-slideshow.mp4`;
      } else {
        blob = await exports.videos(currentProject.id);
        filename = `${currentProject.name}-videos.zip`;
      }

      // Create download link
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);

      setSuccess(type);
      setTimeout(() => setSuccess(null), 3000);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Export failed');
    } finally {
      setLoading(null);
    }
  };

  return (
    <Dialog
      open={activeDialog === 'export'}
      onOpenChange={(open) => {
        if (!open) {
          setError(null);
          setSuccess(null);
          closeDialog();
        }
      }}
    >
      <DialogContent className="sm:max-w-[500px] bg-[#f4f1e8] border-4 border-[#2c2416] shadow-2xl">
        {/* Ornamental corners */}
        <div className="absolute top-0 left-0 w-10 h-10 border-t-2 border-l-2 border-[#d4af37]" />
        <div className="absolute top-0 right-0 w-10 h-10 border-t-2 border-r-2 border-[#d4af37]" />
        <div className="absolute bottom-0 left-0 w-10 h-10 border-b-2 border-l-2 border-[#d4af37]" />
        <div className="absolute bottom-0 right-0 w-10 h-10 border-b-2 border-r-2 border-[#d4af37]" />

        <DialogHeader className="space-y-4 pt-2">
          <DialogTitle className="text-3xl font-serif text-center text-[#2c2416] tracking-wide border-b-2 border-[#2c2416] pb-3">
            <span className="inline-block relative">
              <Download className="inline-block w-6 h-6 mr-2 mb-1" />
              EXPORT ARCHIVES
              <div className="absolute -bottom-1 left-0 right-0 h-px bg-[#d4af37]" />
            </span>
          </DialogTitle>
          <DialogDescription className="text-center text-[#2c2416]/70 text-sm italic font-serif">
            Download your publication in various formats
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-6">
          {/* HTML Export */}
          <button
            onClick={() => handleExport('html')}
            disabled={loading !== null}
            className="w-full group relative overflow-hidden"
          >
            <div
              className={`
              p-6 border-3 rounded-sm transition-all duration-300
              ${
                success === 'html'
                  ? 'border-[#2e7d32] bg-[#2e7d32]/10'
                  : 'border-[#2c2416]/30 hover:border-[#d4af37] hover:bg-[#d4af37]/5 hover:shadow-lg'
              }
            `}
              style={{
                backgroundImage:
                  'repeating-linear-gradient(45deg, transparent, transparent 10px, #2c2416 10px, #2c2416 11px)',
                backgroundSize: '100% 100%, 20px 20px',
                backgroundBlendMode: 'multiply',
              } as React.CSSProperties}
            >
              <div className="flex items-start gap-4">
                {/* Icon */}
                <div
                  className={`
                  p-3 rounded-sm border-2 transition-all duration-300
                  ${
                    loading === 'html'
                      ? 'border-[#d4af37] bg-[#d4af37]/20 animate-pulse'
                      : success === 'html'
                        ? 'border-[#2e7d32] bg-[#2e7d32]/20'
                        : 'border-[#2c2416]/30 bg-[#2c2416]/5 group-hover:border-[#d4af37] group-hover:bg-[#d4af37]/10'
                  }
                `}
                >
                  {loading === 'html' ? (
                    <Loader2 className="w-7 h-7 text-[#d4af37] animate-spin" />
                  ) : success === 'html' ? (
                    <CheckCircle2 className="w-7 h-7 text-[#2e7d32]" />
                  ) : (
                    <FileText className="w-7 h-7 text-[#2c2416]" />
                  )}
                </div>

                {/* Content */}
                <div className="flex-1 text-left">
                  <h3 className="text-lg font-serif font-semibold text-[#2c2416] tracking-wide mb-1">
                    Download HTML Archive
                  </h3>
                  <p className="text-sm font-serif text-[#2c2416]/70 mb-3">
                    Export your gazette as a standalone HTML package, ready for web hosting and
                    distribution
                  </p>
                  {success === 'html' && (
                    <div className="flex items-center gap-2 text-sm font-serif text-[#2e7d32] animate-in fade-in-50">
                      <CheckCircle2 className="w-4 h-4" />
                      <span>Successfully exported!</span>
                    </div>
                  )}
                  {loading === 'html' && (
                    <div className="flex items-center gap-2 text-sm font-serif text-[#d4af37] animate-in fade-in-50">
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>Preparing archive...</span>
                    </div>
                  )}
                </div>

                {/* Arrow indicator */}
                {!loading && !success && (
                  <div className="text-[#2c2416]/30 group-hover:text-[#d4af37] transition-all duration-300 group-hover:translate-x-1">
                    <Download className="w-5 h-5" />
                  </div>
                )}
              </div>
            </div>
          </button>

          {/* PDF Export */}
          <button
            onClick={() => handleExport('pdf')}
            disabled={loading !== null}
            className="w-full group relative overflow-hidden"
          >
            <div
              className={`
              p-6 border-3 rounded-sm transition-all duration-300
              ${
                success === 'pdf'
                  ? 'border-[#2e7d32] bg-[#2e7d32]/10'
                  : 'border-[#2c2416]/30 hover:border-[#d4af37] hover:bg-[#d4af37]/5 hover:shadow-lg'
              }
            `}
              style={{
                backgroundImage:
                  'repeating-linear-gradient(45deg, transparent, transparent 10px, #2c2416 10px, #2c2416 11px)',
                backgroundSize: '100% 100%, 20px 20px',
                backgroundBlendMode: 'multiply',
              } as React.CSSProperties}
            >
              <div className="flex items-start gap-4">
                {/* Icon */}
                <div
                  className={`
                  p-3 rounded-sm border-2 transition-all duration-300
                  ${
                    loading === 'pdf'
                      ? 'border-[#d4af37] bg-[#d4af37]/20 animate-pulse'
                      : success === 'pdf'
                        ? 'border-[#2e7d32] bg-[#2e7d32]/20'
                        : 'border-[#2c2416]/30 bg-[#2c2416]/5 group-hover:border-[#d4af37] group-hover:bg-[#d4af37]/10'
                  }
                `}
                >
                  {loading === 'pdf' ? (
                    <Loader2 className="w-7 h-7 text-[#d4af37] animate-spin" />
                  ) : success === 'pdf' ? (
                    <CheckCircle2 className="w-7 h-7 text-[#2e7d32]" />
                  ) : (
                    <FileType className="w-7 h-7 text-[#2c2416]" />
                  )}
                </div>

                {/* Content */}
                <div className="flex-1 text-left">
                  <h3 className="text-lg font-serif font-semibold text-[#2c2416] tracking-wide mb-1">
                    Download PDF
                  </h3>
                  <p className="text-sm font-serif text-[#2c2416]/70 mb-3">
                    Export as a printable PDF document with static images (videos shown as still frames)
                  </p>
                  {success === 'pdf' && (
                    <div className="flex items-center gap-2 text-sm font-serif text-[#2e7d32] animate-in fade-in-50">
                      <CheckCircle2 className="w-4 h-4" />
                      <span>Successfully exported!</span>
                    </div>
                  )}
                  {loading === 'pdf' && (
                    <div className="flex items-center gap-2 text-sm font-serif text-[#d4af37] animate-in fade-in-50">
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>Generating PDF...</span>
                    </div>
                  )}
                </div>

                {/* Arrow indicator */}
                {!loading && !success && (
                  <div className="text-[#2c2416]/30 group-hover:text-[#d4af37] transition-all duration-300 group-hover:translate-x-1">
                    <Download className="w-5 h-5" />
                  </div>
                )}
              </div>
            </div>
          </button>

          {/* Slideshow Video Export */}
          <button
            onClick={() => handleExport('slideshow')}
            disabled={loading !== null}
            className="w-full group relative overflow-hidden"
          >
            <div
              className={`
              p-6 border-3 rounded-sm transition-all duration-300
              ${
                success === 'slideshow'
                  ? 'border-[#2e7d32] bg-[#2e7d32]/10'
                  : 'border-[#2c2416]/30 hover:border-[#d4af37] hover:bg-[#d4af37]/5 hover:shadow-lg'
              }
            `}
              style={{
                backgroundImage:
                  'repeating-linear-gradient(45deg, transparent, transparent 10px, #2c2416 10px, #2c2416 11px)',
                backgroundSize: '100% 100%, 20px 20px',
                backgroundBlendMode: 'multiply',
              } as React.CSSProperties}
            >
              <div className="flex items-start gap-4">
                {/* Icon */}
                <div
                  className={`
                  p-3 rounded-sm border-2 transition-all duration-300
                  ${
                    loading === 'slideshow'
                      ? 'border-[#d4af37] bg-[#d4af37]/20 animate-pulse'
                      : success === 'slideshow'
                        ? 'border-[#2e7d32] bg-[#2e7d32]/20'
                        : 'border-[#2c2416]/30 bg-[#2c2416]/5 group-hover:border-[#d4af37] group-hover:bg-[#d4af37]/10'
                  }
                `}
                >
                  {loading === 'slideshow' ? (
                    <Loader2 className="w-7 h-7 text-[#d4af37] animate-spin" />
                  ) : success === 'slideshow' ? (
                    <CheckCircle2 className="w-7 h-7 text-[#2e7d32]" />
                  ) : (
                    <Film className="w-7 h-7 text-[#2c2416]" />
                  )}
                </div>

                {/* Content */}
                <div className="flex-1 text-left">
                  <h3 className="text-lg font-serif font-semibold text-[#2c2416] tracking-wide mb-1">
                    Download as Video
                  </h3>
                  <p className="text-sm font-serif text-[#2c2416]/70 mb-3">
                    Export as a single MP4 video slideshow (15 seconds per page)
                  </p>
                  {success === 'slideshow' && (
                    <div className="flex items-center gap-2 text-sm font-serif text-[#2e7d32] animate-in fade-in-50">
                      <CheckCircle2 className="w-4 h-4" />
                      <span>Successfully exported!</span>
                    </div>
                  )}
                  {loading === 'slideshow' && (
                    <div className="flex items-center gap-2 text-sm font-serif text-[#d4af37] animate-in fade-in-50">
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>Rendering video (this may take a while)...</span>
                    </div>
                  )}
                </div>

                {/* Arrow indicator */}
                {!loading && !success && (
                  <div className="text-[#2c2416]/30 group-hover:text-[#d4af37] transition-all duration-300 group-hover:translate-x-1">
                    <Download className="w-5 h-5" />
                  </div>
                )}
              </div>
            </div>
          </button>

          {/* Videos Export */}
          <button
            onClick={() => handleExport('videos')}
            disabled={loading !== null}
            className="w-full group relative overflow-hidden"
          >
            <div
              className={`
              p-6 border-3 rounded-sm transition-all duration-300
              ${
                success === 'videos'
                  ? 'border-[#2e7d32] bg-[#2e7d32]/10'
                  : 'border-[#2c2416]/30 hover:border-[#d4af37] hover:bg-[#d4af37]/5 hover:shadow-lg'
              }
            `}
              style={{
                backgroundImage:
                  'repeating-linear-gradient(45deg, transparent, transparent 10px, #2c2416 10px, #2c2416 11px)',
                backgroundSize: '100% 100%, 20px 20px',
                backgroundBlendMode: 'multiply',
              } as React.CSSProperties}
            >
              <div className="flex items-start gap-4">
                {/* Icon */}
                <div
                  className={`
                  p-3 rounded-sm border-2 transition-all duration-300
                  ${
                    loading === 'videos'
                      ? 'border-[#d4af37] bg-[#d4af37]/20 animate-pulse'
                      : success === 'videos'
                        ? 'border-[#2e7d32] bg-[#2e7d32]/20'
                        : 'border-[#2c2416]/30 bg-[#2c2416]/5 group-hover:border-[#d4af37] group-hover:bg-[#d4af37]/10'
                  }
                `}
                >
                  {loading === 'videos' ? (
                    <Loader2 className="w-7 h-7 text-[#d4af37] animate-spin" />
                  ) : success === 'videos' ? (
                    <CheckCircle2 className="w-7 h-7 text-[#2e7d32]" />
                  ) : (
                    <Video className="w-7 h-7 text-[#2c2416]" />
                  )}
                </div>

                {/* Content */}
                <div className="flex-1 text-left">
                  <h3 className="text-lg font-serif font-semibold text-[#2c2416] tracking-wide mb-1">
                    Download Video Files
                  </h3>
                  <p className="text-sm font-serif text-[#2c2416]/70 mb-3">
                    Export all generated animation videos as individual MP4 files
                  </p>
                  {success === 'videos' && (
                    <div className="flex items-center gap-2 text-sm font-serif text-[#2e7d32] animate-in fade-in-50">
                      <CheckCircle2 className="w-4 h-4" />
                      <span>Successfully exported!</span>
                    </div>
                  )}
                  {loading === 'videos' && (
                    <div className="flex items-center gap-2 text-sm font-serif text-[#d4af37] animate-in fade-in-50">
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>Preparing archive...</span>
                    </div>
                  )}
                </div>

                {/* Arrow indicator */}
                {!loading && !success && (
                  <div className="text-[#2c2416]/30 group-hover:text-[#d4af37] transition-all duration-300 group-hover:translate-x-1">
                    <Download className="w-5 h-5" />
                  </div>
                )}
              </div>
            </div>
          </button>

          {/* Error message */}
          {error && (
            <div className="flex items-start gap-3 p-4 border-2 border-[#8b4513] bg-[#8b4513]/10 rounded-sm animate-in fade-in-50">
              <AlertCircle className="w-5 h-5 text-[#8b4513] flex-shrink-0 mt-0.5" />
              <div className="flex-1">
                <p className="text-sm font-serif font-semibold text-[#8b4513]">Export Failed</p>
                <p className="text-xs font-serif text-[#8b4513]/80 mt-1">{error}</p>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="border-t-2 border-[#2c2416]/20 pt-4">
          <Button
            onClick={() => {
              setError(null);
              setSuccess(null);
              closeDialog();
            }}
            disabled={loading !== null}
            className="w-full bg-[#2c2416] hover:bg-[#8b4513] text-[#f4f1e8] font-serif text-sm tracking-wider transition-all duration-300 shadow-md hover:shadow-lg border-2 border-[#2c2416] hover:border-[#d4af37]"
          >
            CLOSE
          </Button>
        </div>

        {/* Decorative stamp */}
        <div className="absolute -bottom-3 -left-3 opacity-20 pointer-events-none -rotate-12">
          <div className="w-20 h-20 border-4 border-[#8b4513] rounded-full flex items-center justify-center">
            <span className="text-[#8b4513] font-serif text-xs font-bold">EXPORT</span>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
