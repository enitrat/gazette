import { useState, useEffect } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import type { ViewProjectResponse } from '@gazette/shared';
import { CANVAS_WIDTH, CANVAS_HEIGHT } from '@/lib/constants';
import { images } from '@/lib/api';
import { ChevronLeft, ChevronRight } from 'lucide-react';

interface GazetteViewerProps {
  data: ViewProjectResponse;
}

export function GazetteViewer({ data }: GazetteViewerProps) {
  const [currentPageIndex, setCurrentPageIndex] = useState(0);
  const [direction, setDirection] = useState(0);
  const [imageLoadStates, setImageLoadStates] = useState<Record<string, boolean>>({});

  const currentPage = data.pages[currentPageIndex];
  const totalPages = data.pages.length;

  const goToNextPage = () => {
    if (currentPageIndex < totalPages - 1) {
      setDirection(1);
      setCurrentPageIndex((prev) => prev + 1);
    }
  };

  const goToPreviousPage = () => {
    if (currentPageIndex > 0) {
      setDirection(-1);
      setCurrentPageIndex((prev) => prev - 1);
    }
  };

  // Keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'ArrowLeft') goToPreviousPage();
      if (e.key === 'ArrowRight') goToNextPage();
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [currentPageIndex, totalPages]);

  // Page transition variants
  const pageVariants = {
    enter: (direction: number) => ({
      x: direction > 0 ? 1000 : -1000,
      opacity: 0,
      scale: 0.95,
      rotateY: direction > 0 ? 15 : -15,
    }),
    center: {
      x: 0,
      opacity: 1,
      scale: 1,
      rotateY: 0,
    },
    exit: (direction: number) => ({
      x: direction < 0 ? 1000 : -1000,
      opacity: 0,
      scale: 0.95,
      rotateY: direction < 0 ? 15 : -15,
    }),
  };

  return (
    <div className="relative min-h-screen w-full overflow-hidden bg-gradient-to-br from-[#f5f1e8] via-[#faf8f3] to-[#f0e9d8]">
      {/* Decorative background pattern */}
      <div
        className="pointer-events-none absolute inset-0 opacity-[0.015]"
        style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23000000' fill-opacity='1'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
        }}
      />

      {/* Vignette effect */}
      <div
        className="pointer-events-none absolute inset-0"
        style={{
          background: 'radial-gradient(ellipse at center, transparent 0%, rgba(0,0,0,0.05) 100%)',
        }}
      />

      {/* Header - Masthead */}
      <header className="relative z-10 border-b-4 border-[#8b7355]/30 bg-gradient-to-b from-white/95 to-white/90 shadow-lg backdrop-blur-sm">
        <div className="container mx-auto px-6 py-8">
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
            className="text-center"
          >
            <div className="mb-2 flex items-center justify-center gap-4">
              <div className="h-px flex-1 bg-gradient-to-r from-transparent via-[#8b7355] to-transparent" />
              <svg className="h-4 w-4 text-[#8b7355]" viewBox="0 0 20 20" fill="currentColor">
                <path d="M10 2 L12 6 L17 7 L13.5 10.5 L14.5 16 L10 13.5 L5.5 16 L6.5 10.5 L3 7 L8 6 Z" />
              </svg>
              <div className="h-px flex-1 bg-gradient-to-r from-transparent via-[#8b7355] to-transparent" />
            </div>

            <h1 className="font-display text-5xl font-black tracking-tight text-[#2C2416] drop-shadow-sm">
              {data.project.name}
            </h1>

            <div className="mt-2 flex items-center justify-center gap-4">
              <div className="h-px flex-1 bg-gradient-to-r from-transparent via-[#8b7355] to-transparent" />
              <svg className="h-4 w-4 text-[#8b7355]" viewBox="0 0 20 20" fill="currentColor">
                <path d="M10 2 L12 6 L17 7 L13.5 10.5 L14.5 16 L10 13.5 L5.5 16 L6.5 10.5 L3 7 L8 6 Z" />
              </svg>
              <div className="h-px flex-1 bg-gradient-to-r from-transparent via-[#8b7355] to-transparent" />
            </div>
          </motion.div>
        </div>
      </header>

      {/* Main content */}
      <main className="relative flex min-h-[calc(100vh-200px)] items-center justify-center px-4 py-16">
        <AnimatePresence initial={false} custom={direction} mode="wait">
          <motion.div
            key={currentPageIndex}
            custom={direction}
            variants={pageVariants}
            initial="enter"
            animate="center"
            exit="exit"
            transition={{
              x: { type: 'spring', stiffness: 300, damping: 40 },
              opacity: { duration: 0.4 },
              scale: { duration: 0.4 },
              rotateY: { duration: 0.4 },
            }}
            className="relative w-full max-w-5xl"
            style={{ perspective: '2000px' }}
          >
            {/* Page container with shadow and texture */}
            <div className="relative mx-auto" style={{ width: CANVAS_WIDTH, height: CANVAS_HEIGHT }}>
              {/* Multiple shadow layers for depth */}
              <div className="absolute inset-0 -translate-x-2 translate-y-2 rounded-sm bg-[#8b7355]/5 blur-xl" />
              <div className="absolute inset-0 translate-x-2 translate-y-3 rounded-sm bg-[#8b7355]/10 blur-2xl" />

              {/* Page content */}
              <div
                className="relative overflow-hidden rounded-sm border-2 border-[#8b7355]/30 bg-[#fefdfb] shadow-2xl"
                style={{
                  backgroundImage: `
                    linear-gradient(to bottom, rgba(251,248,240,0) 0%, rgba(251,248,240,0.3) 100%),
                    url("data:image/svg+xml,%3Csvg viewBox='0 0 400 400' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)' opacity='0.015'/%3E%3C/svg%3E")
                  `,
                  backgroundSize: 'cover',
                }}
              >
                {/* Page header */}
                <div className="border-b border-[#8b7355]/20 bg-gradient-to-b from-[#faf8f3] to-transparent p-8 pb-6">
                  <h2 className="font-display text-4xl font-bold leading-tight text-[#2C2416]">
                    {currentPage.title}
                  </h2>
                  {currentPage.subtitle && (
                    <p className="mt-2 font-serif text-lg italic text-[#5C4033]">
                      {currentPage.subtitle}
                    </p>
                  )}
                </div>

                {/* Elements rendering */}
                <div className="relative p-8" style={{ height: CANVAS_HEIGHT - 140 }}>
                  {currentPage.elements.map((element) => {
                    const { position } = element;

                    if (element.type === 'image') {
                      const hasVideo = element.videoUrl && element.videoStatus === 'complete';
                      const imageUrl = element.imageId ? images.getUrl(element.imageId) : null;

                      return (
                        <motion.div
                          key={element.id}
                          initial={{ opacity: 0, scale: 0.95 }}
                          animate={{ opacity: 1, scale: 1 }}
                          transition={{ delay: 0.2, duration: 0.5 }}
                          className="absolute overflow-hidden rounded-sm border border-[#8b7355]/20 shadow-md"
                          style={{
                            left: position.x,
                            top: position.y,
                            width: position.width,
                            height: position.height,
                          }}
                        >
                          {hasVideo ? (
                            <video
                              src={element.videoUrl!}
                              autoPlay
                              loop
                              muted
                              playsInline
                              className="h-full w-full object-cover"
                              onError={(e) => {
                                // Fallback to image if video fails
                                const target = e.target as HTMLVideoElement;
                                target.style.display = 'none';
                              }}
                            />
                          ) : null}

                          {imageUrl && (
                            <img
                              src={imageUrl}
                              alt=""
                              className="h-full w-full object-cover"
                              style={{
                                display: hasVideo && imageLoadStates[element.id] ? 'none' : 'block',
                                transform: element.cropData
                                  ? `scale(${element.cropData.zoom}) translate(${-element.cropData.x}px, ${-element.cropData.y}px)`
                                  : undefined,
                                transformOrigin: 'top left',
                              }}
                              onLoad={() => {
                                setImageLoadStates(prev => ({ ...prev, [element.id]: true }));
                              }}
                            />
                          )}
                        </motion.div>
                      );
                    }

                    if (element.type === 'headline') {
                      return (
                        <motion.div
                          key={element.id}
                          initial={{ opacity: 0, y: 20 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ delay: 0.3, duration: 0.5 }}
                          className="absolute"
                          style={{
                            left: position.x,
                            top: position.y,
                            width: position.width,
                            height: position.height,
                          }}
                        >
                          <h3 className="font-display text-3xl font-bold leading-tight text-[#2C2416]">
                            {element.content}
                          </h3>
                        </motion.div>
                      );
                    }

                    if (element.type === 'subheading') {
                      return (
                        <motion.div
                          key={element.id}
                          initial={{ opacity: 0, y: 20 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ delay: 0.35, duration: 0.5 }}
                          className="absolute"
                          style={{
                            left: position.x,
                            top: position.y,
                            width: position.width,
                            height: position.height,
                          }}
                        >
                          <h4 className="font-display text-xl font-semibold leading-snug text-[#5C4033]">
                            {element.content}
                          </h4>
                        </motion.div>
                      );
                    }

                    if (element.type === 'caption') {
                      return (
                        <motion.div
                          key={element.id}
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1 }}
                          transition={{ delay: 0.4, duration: 0.5 }}
                          className="absolute"
                          style={{
                            left: position.x,
                            top: position.y,
                            width: position.width,
                            height: position.height,
                          }}
                        >
                          <p className="font-serif text-base leading-relaxed text-[#2C2416]">
                            {element.content}
                          </p>
                        </motion.div>
                      );
                    }

                    return null;
                  })}
                </div>

                {/* Decorative corner flourishes */}
                <div className="pointer-events-none absolute left-4 top-4 h-8 w-8 border-l-2 border-t-2 border-[#8b7355]/20" />
                <div className="pointer-events-none absolute right-4 top-4 h-8 w-8 border-r-2 border-t-2 border-[#8b7355]/20" />
                <div className="pointer-events-none absolute bottom-4 left-4 h-8 w-8 border-b-2 border-l-2 border-[#8b7355]/20" />
                <div className="pointer-events-none absolute bottom-4 right-4 h-8 w-8 border-b-2 border-r-2 border-[#8b7355]/20" />
              </div>
            </div>
          </motion.div>
        </AnimatePresence>
      </main>

      {/* Footer navigation */}
      <footer className="fixed bottom-0 left-0 right-0 z-20 border-t-2 border-[#8b7355]/30 bg-gradient-to-t from-white/95 to-white/90 backdrop-blur-sm">
        <div className="container mx-auto px-6 py-6">
          <div className="flex items-center justify-between">
            {/* Previous button */}
            <motion.button
              whileHover={{ scale: 1.05, x: -5 }}
              whileTap={{ scale: 0.95 }}
              onClick={goToPreviousPage}
              disabled={currentPageIndex === 0}
              className="group flex items-center gap-2 rounded-sm border border-[#8b7355]/30 bg-gradient-to-br from-[#faf8f3] to-[#f4e4bc] px-6 py-3 font-serif text-sm font-medium text-[#2C2416] shadow-md transition-all hover:border-[#8b7355]/50 hover:shadow-lg disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:scale-100"
            >
              <ChevronLeft className="h-4 w-4 transition-transform group-hover:-translate-x-1" />
              <span>Page précédente</span>
            </motion.button>

            {/* Page indicator */}
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2">
                {data.pages.map((_, index) => (
                  <motion.button
                    key={index}
                    onClick={() => {
                      setDirection(index > currentPageIndex ? 1 : -1);
                      setCurrentPageIndex(index);
                    }}
                    className="group relative h-2 w-2"
                    whileHover={{ scale: 1.5 }}
                    whileTap={{ scale: 0.9 }}
                  >
                    <div
                      className={`h-full w-full rounded-full transition-all ${
                        index === currentPageIndex
                          ? 'bg-[#C9A227] shadow-md'
                          : 'bg-[#8b7355]/30 group-hover:bg-[#8b7355]/50'
                      }`}
                    />
                    {index === currentPageIndex && (
                      <motion.div
                        layoutId="activePageIndicator"
                        className="absolute inset-0 -m-1 rounded-full border-2 border-[#C9A227]"
                        transition={{ type: 'spring', stiffness: 400, damping: 30 }}
                      />
                    )}
                  </motion.button>
                ))}
              </div>

              <div className="font-display text-sm font-medium text-[#5C4033]">
                Page <span className="text-lg font-bold text-[#C9A227]">{currentPageIndex + 1}</span> sur {totalPages}
              </div>
            </div>

            {/* Next button */}
            <motion.button
              whileHover={{ scale: 1.05, x: 5 }}
              whileTap={{ scale: 0.95 }}
              onClick={goToNextPage}
              disabled={currentPageIndex === totalPages - 1}
              className="group flex items-center gap-2 rounded-sm border border-[#8b7355]/30 bg-gradient-to-br from-[#faf8f3] to-[#f4e4bc] px-6 py-3 font-serif text-sm font-medium text-[#2C2416] shadow-md transition-all hover:border-[#8b7355]/50 hover:shadow-lg disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:scale-100"
            >
              <span>Page suivante</span>
              <ChevronRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
            </motion.button>
          </div>
        </div>
      </footer>
    </div>
  );
}
