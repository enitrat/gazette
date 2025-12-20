import type { SerializedElement } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import {
  ArrowUp,
  ArrowDown,
  ChevronsUp,
  ChevronsDown,
  Sparkles
} from 'lucide-react';

interface AdvancedTabProps {
  element: SerializedElement;
  onUpdate: (updates: Partial<SerializedElement>) => void;
  onLayerChange?: (elementId: string, direction: 'front' | 'forward' | 'backward' | 'back') => void;
  onGenerateVideo?: (elementId: string) => void;
}

const VIDEO_STATUS_CONFIG = {
  none: { label: 'Not Generated', variant: 'outline' as const, color: 'text-[#92764C]' },
  pending: { label: 'Queued', variant: 'secondary' as const, color: 'text-[#D4AF37]' },
  processing: { label: 'Processing', variant: 'default' as const, color: 'text-blue-600' },
  complete: { label: 'Complete', variant: 'default' as const, color: 'text-green-600' },
  failed: { label: 'Failed', variant: 'destructive' as const, color: 'text-red-600' },
};

export function AdvancedTab({
  element,
  onUpdate,
  onLayerChange,
  onGenerateVideo,
}: AdvancedTabProps) {
  const isImage = element.type === 'image';
  const animationPrompt = isImage ? element.animationPrompt || '' : '';
  const videoStatus = isImage ? element.videoStatus : 'none';
  const statusConfig = VIDEO_STATUS_CONFIG[videoStatus];

  const handlePromptChange = (value: string) => {
    if (isImage && value.length <= 500) {
      onUpdate({
        ...element,
        animationPrompt: value,
      });
    }
  };

  return (
    <div className="p-4 space-y-6">
      {/* Header */}
      <div className="text-center relative pb-3">
        <h4 className="text-sm font-serif text-[#3D3327] tracking-wide">
          Advanced Controls
        </h4>
        <div className="absolute bottom-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-[#D4AF37] to-transparent" />
      </div>

      {/* Layer Controls */}
      <div className="space-y-3">
        <div className="flex items-center gap-2">
          <div className="h-px flex-1 bg-gradient-to-r from-transparent to-[#92764C]/30" />
          <span className="text-xs font-serif text-[#92764C] uppercase tracking-wider">
            Layer Order
          </span>
          <div className="h-px flex-1 bg-gradient-to-l from-transparent to-[#92764C]/30" />
        </div>

        <div className="grid grid-cols-2 gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => onLayerChange?.(element.id, 'front')}
            className="border-[#92764C]/30 bg-[#F4F1E8]/50 text-[#3D3327] hover:bg-[#D4AF37]/10 hover:border-[#D4AF37] transition-all duration-200"
          >
            <ChevronsUp className="h-4 w-4 mr-1" />
            <span className="text-xs font-serif">To Front</span>
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => onLayerChange?.(element.id, 'forward')}
            className="border-[#92764C]/30 bg-[#F4F1E8]/50 text-[#3D3327] hover:bg-[#D4AF37]/10 hover:border-[#D4AF37] transition-all duration-200"
          >
            <ArrowUp className="h-4 w-4 mr-1" />
            <span className="text-xs font-serif">Forward</span>
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => onLayerChange?.(element.id, 'backward')}
            className="border-[#92764C]/30 bg-[#F4F1E8]/50 text-[#3D3327] hover:bg-[#D4AF37]/10 hover:border-[#D4AF37] transition-all duration-200"
          >
            <ArrowDown className="h-4 w-4 mr-1" />
            <span className="text-xs font-serif">Backward</span>
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => onLayerChange?.(element.id, 'back')}
            className="border-[#92764C]/30 bg-[#F4F1E8]/50 text-[#3D3327] hover:bg-[#D4AF37]/10 hover:border-[#D4AF37] transition-all duration-200"
          >
            <ChevronsDown className="h-4 w-4 mr-1" />
            <span className="text-xs font-serif">To Back</span>
          </Button>
        </div>
      </div>

      {/* Image Animation Section (only for images) */}
      {isImage && (
        <>
          {/* Ornamental Divider */}
          <div className="relative h-px bg-gradient-to-r from-transparent via-[#92764C]/30 to-transparent">
            <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-2 h-2 rotate-45 bg-[#F4F1E8] border border-[#92764C]/30" />
          </div>

          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <div className="h-px flex-1 bg-gradient-to-r from-transparent to-[#92764C]/30" />
              <span className="text-xs font-serif text-[#92764C] uppercase tracking-wider">
                Motion Picture
              </span>
              <div className="h-px flex-1 bg-gradient-to-l from-transparent to-[#92764C]/30" />
            </div>

            {/* Video Status Badge */}
            <div className="flex items-center justify-between p-3 rounded border border-[#92764C]/20 bg-[#F4F1E8]/30">
              <span className="text-xs font-serif text-[#92764C] uppercase tracking-wider">
                Status
              </span>
              <Badge
                variant={statusConfig.variant}
                className={`${statusConfig.color} font-mono text-xs border-[#92764C]/30`}
              >
                {statusConfig.label}
              </Badge>
            </div>

            {/* Animation Prompt */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label className="text-xs font-serif text-[#92764C] uppercase tracking-wider">
                  Animation Instructions
                </Label>
                <span className="text-xs font-mono text-[#92764C]/50">
                  {animationPrompt.length}/500
                </span>
              </div>
              <Textarea
                value={animationPrompt}
                onChange={(e) => handlePromptChange(e.target.value)}
                placeholder="Describe the desired motion... (e.g., 'gentle swaying curtains', 'steam rising from teacup')"
                maxLength={500}
                rows={4}
                className="resize-none border-[#92764C]/30 bg-[#F4F1E8]/50 text-[#3D3327] placeholder:text-[#92764C]/40 font-serif text-sm focus-visible:ring-[#D4AF37] hover:border-[#D4AF37] transition-all duration-200"
              />
            </div>

            {/* Generate Button */}
            <Button
              onClick={() => onGenerateVideo?.(element.id)}
              disabled={!animationPrompt.trim() || videoStatus === 'processing' || videoStatus === 'pending'}
              className="w-full bg-gradient-to-r from-[#D4AF37] to-[#B8941F] text-white hover:from-[#B8941F] hover:to-[#D4AF37] shadow-md hover:shadow-lg transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Sparkles className="h-4 w-4 mr-2" />
              <span className="font-serif">Generate Motion Picture</span>
            </Button>

            {/* Video URL Display (if complete) */}
            {videoStatus === 'complete' && element.videoUrl && (
              <div className="p-3 rounded border border-[#D4AF37]/30 bg-[#D4AF37]/5">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-serif text-[#3D3327] uppercase tracking-wider">
                    Production Complete
                  </span>
                  <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
                </div>
                <a
                  href={element.videoUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-xs font-mono text-[#D4AF37] hover:text-[#B8941F] underline break-all"
                >
                  View Generated Motion Picture
                </a>
              </div>
            )}

            {/* Processing Message */}
            {(videoStatus === 'processing' || videoStatus === 'pending') && (
              <div className="p-3 rounded border border-[#92764C]/20 bg-[#F4F1E8]/30">
                <p className="text-xs text-[#92764C]/70 text-center italic font-serif leading-relaxed">
                  {videoStatus === 'pending'
                    ? 'Your motion picture is queued for production...'
                    : 'Cinematographic processing in progress...'}
                </p>
              </div>
            )}

            {/* Error Message */}
            {videoStatus === 'failed' && (
              <div className="p-3 rounded border border-red-300 bg-red-50">
                <p className="text-xs text-red-700 text-center font-serif leading-relaxed">
                  Production failed. Please revise instructions and try again.
                </p>
              </div>
            )}
          </div>
        </>
      )}

      {/* Compositor's Note */}
      {!isImage && (
        <div className="pt-2">
          <p className="text-xs text-[#92764C]/70 text-center italic font-serif leading-relaxed">
            Motion picture generation is available for photographic plates only.
          </p>
        </div>
      )}
    </div>
  );
}
