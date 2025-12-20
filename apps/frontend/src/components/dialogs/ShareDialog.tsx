import { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useUIStore } from '@/stores/ui-store';
import { useAuthStore } from '@/stores/auth-store';
import { QRCodeCanvas } from 'qrcode.react';
import { Copy, Check, Share2, Facebook, Twitter, Linkedin, Mail } from 'lucide-react';

export function ShareDialog() {
  const { activeDialog, closeDialog } = useUIStore();
  const { currentProject } = useAuthStore();
  const [copied, setCopied] = useState(false);
  const [showQR, setShowQR] = useState(false);

  // Generate share URL (adjust based on your deployment)
  const shareUrl = currentProject
    ? `${window.location.origin}/view/${currentProject.slug || currentProject.id}`
    : '';

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(shareUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy:', err);
    }
  };

  const socialLinks = [
    {
      name: 'Facebook',
      icon: <Facebook className="w-5 h-5" />,
      url: `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(shareUrl)}`,
      color: 'hover:bg-[#1877f2]/10 hover:border-[#1877f2]',
    },
    {
      name: 'Twitter',
      icon: <Twitter className="w-5 h-5" />,
      url: `https://twitter.com/intent/tweet?url=${encodeURIComponent(shareUrl)}&text=${encodeURIComponent('Check out this gazette!')}`,
      color: 'hover:bg-[#1da1f2]/10 hover:border-[#1da1f2]',
    },
    {
      name: 'LinkedIn',
      icon: <Linkedin className="w-5 h-5" />,
      url: `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(shareUrl)}`,
      color: 'hover:bg-[#0077b5]/10 hover:border-[#0077b5]',
    },
    {
      name: 'Email',
      icon: <Mail className="w-5 h-5" />,
      url: `mailto:?subject=${encodeURIComponent('La Gazette de la Vie')}&body=${encodeURIComponent(shareUrl)}`,
      color: 'hover:bg-[#8b4513]/10 hover:border-[#8b4513]',
    },
  ];

  return (
    <Dialog open={activeDialog === 'share'} onOpenChange={closeDialog}>
      <DialogContent className="sm:max-w-[550px] bg-[#f4f1e8] border-4 border-[#2c2416] shadow-2xl">
        {/* Ornamental corner flourishes */}
        <div className="absolute top-0 left-0 w-12 h-12 border-t-2 border-l-2 border-[#d4af37] opacity-60" />
        <div className="absolute top-0 right-0 w-12 h-12 border-t-2 border-r-2 border-[#d4af37] opacity-60" />
        <div className="absolute bottom-0 left-0 w-12 h-12 border-b-2 border-l-2 border-[#d4af37] opacity-60" />
        <div className="absolute bottom-0 right-0 w-12 h-12 border-b-2 border-r-2 border-[#d4af37] opacity-60" />

        <DialogHeader className="space-y-4 pt-2">
          <DialogTitle className="text-3xl font-serif text-center text-[#2c2416] tracking-wide border-b-2 border-[#2c2416] pb-3">
            <span className="inline-block relative">
              <Share2 className="inline-block w-6 h-6 mr-2 mb-1" />
              SHARE PUBLICATION
              <div className="absolute -bottom-1 left-0 right-0 h-px bg-[#d4af37]" />
            </span>
          </DialogTitle>
          <DialogDescription className="text-center text-[#2c2416]/70 text-sm italic font-serif">
            Distribute your editorial work to the masses
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-6">
          {/* Share URL Input */}
          <div className="space-y-3">
            <Label className="text-sm font-serif font-semibold text-[#2c2416] tracking-wide">
              PUBLICATION ADDRESS
            </Label>
            <div className="flex gap-2">
              <div className="relative flex-1">
                <Input
                  value={shareUrl}
                  readOnly
                  className="pr-10 bg-white/50 border-2 border-[#2c2416]/30 font-mono text-sm text-[#2c2416] focus-visible:ring-[#d4af37] focus-visible:border-[#d4af37]"
                />
              </div>
              <Button
                onClick={handleCopy}
                className="bg-[#2c2416] hover:bg-[#8b4513] text-[#f4f1e8] px-6 font-serif tracking-wide transition-all duration-300 border-2 border-[#2c2416] hover:border-[#d4af37]"
              >
                {copied ? (
                  <>
                    <Check className="w-4 h-4 mr-2" />
                    COPIED
                  </>
                ) : (
                  <>
                    <Copy className="w-4 h-4 mr-2" />
                    COPY
                  </>
                )}
              </Button>
            </div>
          </div>

          {/* Password reminder */}
          {currentProject?.hasPassword && (
            <div className="p-4 border-2 border-[#d4af37]/40 bg-[#d4af37]/5 rounded-sm">
              <div className="flex items-start gap-3">
                <div className="w-1.5 h-1.5 bg-[#d4af37] rounded-full mt-2" />
                <div className="flex-1">
                  <p className="text-sm font-serif font-semibold text-[#2c2416]">
                    Password Protected
                  </p>
                  <p className="text-xs font-serif text-[#2c2416]/70 mt-1">
                    Readers will need the project password to access this publication
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* QR Code Section */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <Label className="text-sm font-serif font-semibold text-[#2c2416] tracking-wide">
                TELEGRAPH CODE
              </Label>
              <Button
                onClick={() => setShowQR(!showQR)}
                variant="ghost"
                size="sm"
                className="text-xs font-serif text-[#8b4513] hover:text-[#d4af37] hover:bg-[#d4af37]/10"
              >
                {showQR ? 'HIDE' : 'SHOW QR CODE'}
              </Button>
            </div>

            {showQR && (
              <div className="flex justify-center p-6 bg-white border-2 border-[#2c2416]/30 rounded-sm animate-in fade-in-50 slide-in-from-top-5">
                <div className="p-4 bg-white shadow-lg">
                  <QRCodeCanvas
                    value={shareUrl}
                    size={200}
                    level="H"
                    includeMargin={true}
                    fgColor="#2c2416"
                    bgColor="#f4f1e8"
                  />
                </div>
              </div>
            )}
          </div>

          {/* Social Share */}
          <div className="space-y-3">
            <Label className="text-sm font-serif font-semibold text-[#2c2416] tracking-wide">
              DISTRIBUTION CHANNELS
            </Label>
            <div className="grid grid-cols-4 gap-3">
              {socialLinks.map((social) => (
                <a
                  key={social.name}
                  href={social.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className={`
                    flex flex-col items-center justify-center p-4 border-2 border-[#2c2416]/20 rounded-sm
                    transition-all duration-300 hover:scale-105 hover:shadow-md
                    ${social.color}
                  `}
                  style={{
                    backgroundImage:
                      'repeating-linear-gradient(45deg, transparent, transparent 6px, #2c2416 6px, #2c2416 7px)',
                    backgroundSize: '100% 100%, 12px 12px',
                    backgroundBlendMode: 'multiply',
                  } as React.CSSProperties}
                >
                  <div className="text-[#2c2416] mb-2">{social.icon}</div>
                  <span className="text-xs font-serif font-semibold text-[#2c2416]">
                    {social.name}
                  </span>
                </a>
              ))}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="border-t-2 border-[#2c2416]/20 pt-4">
          <Button
            onClick={closeDialog}
            className="w-full bg-[#2c2416] hover:bg-[#8b4513] text-[#f4f1e8] font-serif text-sm tracking-wider transition-all duration-300 shadow-md hover:shadow-lg border-2 border-[#2c2416] hover:border-[#d4af37]"
          >
            CLOSE
          </Button>
        </div>

        {/* Decorative postal stamp */}
        <div
          className="absolute -top-4 -right-4 w-16 h-16 opacity-30 pointer-events-none rotate-12"
          style={{
            background:
              'repeating-linear-gradient(90deg, #8b4513 0px, #8b4513 2px, transparent 2px, transparent 6px)',
            clipPath: 'polygon(10% 0%, 90% 0%, 100% 10%, 100% 90%, 90% 100%, 10% 100%, 0% 90%, 0% 10%)',
          }}
        >
          <div className="w-full h-full flex items-center justify-center">
            <span className="text-[#8b4513] font-serif text-xs font-bold">SHARE</span>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
