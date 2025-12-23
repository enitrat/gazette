import { useState, useEffect, useRef } from "react";
import { AnimatePresence, motion } from "framer-motion";
import type { ViewProjectResponse } from "@gazette/shared";
import {
  CANVAS_FRAME,
  GAZETTE_COLORS,
  getImageCropInlineStyle,
  getMergedTextStyle,
  getPageFrameInlineStyle,
  getPageRuleInlineStyle,
  textStyleToInlineStyle,
} from "@gazette/shared";
import { API_BASE_URL } from "@/lib/constants";
import { ChevronLeft, ChevronRight } from "lucide-react";

const CANVAS_WIDTH = CANVAS_FRAME.width;
const CANVAS_HEIGHT = CANVAS_FRAME.height;

interface GazetteViewerProps {
  data: ViewProjectResponse;
}

export function GazetteViewer({ data }: GazetteViewerProps) {
  const [currentPageIndex, setCurrentPageIndex] = useState(0);
  const [direction, setDirection] = useState(0);
  const [imageLoadStates, setImageLoadStates] = useState<Record<string, boolean>>({});
  const [scale, setScale] = useState(1);
  const containerRef = useRef<HTMLDivElement>(null);

  const currentPage = data.pages[currentPageIndex];
  const totalPages = data.pages.length;

  // Calculate scale based on container width for responsive layout
  useEffect(() => {
    const updateScale = () => {
      if (containerRef.current) {
        const containerWidth = containerRef.current.clientWidth;
        const padding = 32; // px-4 = 16px on each side
        const availableWidth = containerWidth - padding;

        // Also consider available height to avoid cutting off on short screens
        // Footer is approx 80px, plus some padding for top/bottom
        const availableHeight = window.innerHeight - 160;

        const scaleW = availableWidth / CANVAS_WIDTH;
        const scaleH = availableHeight / CANVAS_HEIGHT;

        const newScale = Math.min(1, scaleW, scaleH);
        setScale(newScale);
      }
    };

    updateScale();
    window.addEventListener("resize", updateScale);
    return () => window.removeEventListener("resize", updateScale);
  }, []);

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
      if (e.key === "ArrowLeft") goToPreviousPage();
      if (e.key === "ArrowRight") goToNextPage();
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
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
    <div
      className="relative min-h-screen w-full overflow-hidden"
      style={{ backgroundColor: GAZETTE_COLORS.canvas }}
    >
      {/* Subtle grid background */}
      <div
        className="pointer-events-none absolute inset-0 opacity-40"
        style={{
          backgroundImage: "radial-gradient(circle, rgba(0, 0, 0, 0.06) 1px, transparent 1px)",
          backgroundSize: "24px 24px",
        }}
      />

      {/* Main content */}
      <main
        ref={containerRef}
        className="relative flex min-h-screen items-center justify-center px-4 pb-20 pt-4 md:pb-24 md:pt-8"
      >
        <AnimatePresence initial={false} custom={direction} mode="wait">
          <motion.div
            key={currentPageIndex}
            custom={direction}
            variants={pageVariants}
            initial="enter"
            animate="center"
            exit="exit"
            transition={{
              x: { type: "spring", stiffness: 300, damping: 40 },
              opacity: { duration: 0.4 },
              scale: { duration: 0.4 },
              rotateY: { duration: 0.4 },
            }}
            style={{
              perspective: "2000px",
              height: CANVAS_HEIGHT * scale,
              width: CANVAS_WIDTH * scale,
            }}
          >
            {/* Page container - scales responsively from top-left, wrapper is centered by parent */}
            <div
              style={{
                ...getPageFrameInlineStyle(),
                transform: `scale(${scale})`,
                transformOrigin: "top left",
              }}
            >
              {/* Page content */}
              <div className="relative h-full">
                {/* Elements rendering */}
                <div className="relative" style={{ height: CANVAS_HEIGHT }}>
                  {currentPage.elements.map((element) => {
                    const { position } = element;

                    if (element.type === "image") {
                      const hasVideo = element.videoUrl && element.videoStatus === "complete";
                      // Use the imageUrl from the view API response (includes auth in the URL path)
                      // The URL is relative like /api/view/:slug/images/:id, prepend API base
                      const baseWithoutApi = API_BASE_URL.replace(/\/api$/, "");
                      const imageUrl = element.imageUrl
                        ? `${baseWithoutApi}${element.imageUrl}`
                        : null;
                      const videoUrl = element.videoUrl
                        ? `${baseWithoutApi}${element.videoUrl}`
                        : null;

                      return (
                        <motion.div
                          key={element.id}
                          initial={{ opacity: 0, scale: 0.95 }}
                          animate={{ opacity: 1, scale: 1 }}
                          transition={{ delay: 0.2, duration: 0.5 }}
                          className="absolute overflow-hidden"
                          style={{
                            left: position.x,
                            top: position.y,
                            width: position.width,
                            height: position.height,
                            border: `1px solid ${GAZETTE_COLORS.border}`,
                          }}
                        >
                          {hasVideo && videoUrl ? (
                            <video
                              src={videoUrl}
                              autoPlay
                              loop
                              muted
                              playsInline
                              className="h-full w-full object-cover"
                              onError={(e) => {
                                // Fallback to image if video fails
                                const target = e.target as HTMLVideoElement;
                                target.style.display = "none";
                              }}
                            />
                          ) : null}

                          {imageUrl && (
                            <img
                              src={imageUrl}
                              alt=""
                              className="h-full w-full object-cover"
                              style={{
                                display: hasVideo && imageLoadStates[element.id] ? "none" : "block",
                                ...getImageCropInlineStyle(element.cropData),
                              }}
                              onLoad={() => {
                                setImageLoadStates((prev) => ({ ...prev, [element.id]: true }));
                              }}
                            />
                          )}
                        </motion.div>
                      );
                    }

                    // Text elements (headline, subheading, caption)
                    if (
                      element.type === "headline" ||
                      element.type === "subheading" ||
                      element.type === "caption"
                    ) {
                      // Use shared text style helpers for consistency with editor and export
                      const mergedStyle = getMergedTextStyle(element.type, element.style);
                      const inlineStyle = textStyleToInlineStyle(mergedStyle);

                      return (
                        <motion.div
                          key={element.id}
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ delay: 0.3, duration: 0.5 }}
                          className="absolute"
                          style={{
                            left: position.x,
                            top: position.y,
                            width: position.width,
                            height: position.height,
                            ...inlineStyle,
                          }}
                        >
                          {element.content}
                        </motion.div>
                      );
                    }

                    return null;
                  })}
                </div>

                {/* Elegant newspaper border - thin rule */}
                <div
                  className="pointer-events-none absolute"
                  style={getPageRuleInlineStyle("outer")}
                />
                {/* Inner double-rule */}
                <div
                  className="pointer-events-none absolute"
                  style={getPageRuleInlineStyle("inner")}
                />
              </div>
            </div>
          </motion.div>
        </AnimatePresence>
      </main>

      {/* Footer navigation */}
      <footer
        className="fixed bottom-0 left-0 right-0 z-20 backdrop-blur-sm"
        style={{
          backgroundColor: `${GAZETTE_COLORS.paper}f0`,
          borderTop: `1px solid ${GAZETTE_COLORS.rule}`,
        }}
      >
        <div className="container mx-auto px-3 py-3 md:px-6 md:py-4">
          <div className="flex items-center justify-between gap-2">
            {/* Previous button */}
            <motion.button
              whileHover={{ scale: 1.02, x: -2 }}
              whileTap={{ scale: 0.98 }}
              onClick={goToPreviousPage}
              disabled={currentPageIndex === 0}
              className="group flex items-center gap-1 px-3 py-2 font-serif text-sm font-medium transition-all disabled:cursor-not-allowed disabled:opacity-40 md:gap-2 md:px-5 md:py-2.5"
              style={{
                backgroundColor: GAZETTE_COLORS.newsprint,
                color: GAZETTE_COLORS.ink,
                border: `1px solid ${GAZETTE_COLORS.border}`,
              }}
            >
              <ChevronLeft className="h-4 w-4 transition-transform group-hover:-translate-x-1" />
              <span className="hidden sm:inline">Page précédente</span>
            </motion.button>

            {/* Page indicator */}
            <div className="flex items-center gap-2 md:gap-4">
              <div className="flex items-center gap-1.5 md:gap-2">
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
                      className="h-full w-full rounded-full transition-all"
                      style={{
                        backgroundColor:
                          index === currentPageIndex ? GAZETTE_COLORS.ink : GAZETTE_COLORS.rule,
                      }}
                    />
                    {index === currentPageIndex && (
                      <motion.div
                        layoutId="activePageIndicator"
                        className="absolute inset-0 -m-1 rounded-full"
                        style={{ border: `2px solid ${GAZETTE_COLORS.ink}` }}
                        transition={{ type: "spring", stiffness: 400, damping: 30 }}
                      />
                    )}
                  </motion.button>
                ))}
              </div>

              <div
                className="whitespace-nowrap font-display text-xs font-medium md:text-sm"
                style={{ color: GAZETTE_COLORS.body }}
              >
                <span className="font-bold" style={{ color: GAZETTE_COLORS.ink }}>
                  {currentPageIndex + 1}
                </span>
                <span className="mx-1">/</span>
                {totalPages}
              </div>
            </div>

            {/* Next button */}
            <motion.button
              whileHover={{ scale: 1.02, x: 2 }}
              whileTap={{ scale: 0.98 }}
              onClick={goToNextPage}
              disabled={currentPageIndex === totalPages - 1}
              className="group flex items-center gap-1 px-3 py-2 font-serif text-sm font-medium transition-all disabled:cursor-not-allowed disabled:opacity-40 md:gap-2 md:px-5 md:py-2.5"
              style={{
                backgroundColor: GAZETTE_COLORS.newsprint,
                color: GAZETTE_COLORS.ink,
                border: `1px solid ${GAZETTE_COLORS.border}`,
              }}
            >
              <span className="hidden sm:inline">Page suivante</span>
              <ChevronRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
            </motion.button>
          </div>
        </div>
      </footer>
    </div>
  );
}
