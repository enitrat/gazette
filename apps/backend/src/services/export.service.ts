import { Buffer } from "node:buffer";
import { join } from "node:path";
import { fileURLToPath } from "node:url";
import { tmpdir } from "node:os";
import { mkdir, rm, writeFile } from "node:fs/promises";
import { spawn } from "node:child_process";
import { randomUUID } from "node:crypto";
import JSZip from "jszip";
import puppeteer from "puppeteer";
import { eq, inArray } from "drizzle-orm";
import { db, schema } from "../db";
import {
  DEFAULTS,
  ELEMENT_TYPES,
  CANVAS_FRAME,
  GAZETTE_COLORS,
  getImageCropCss,
  getMergedTextStyle,
  textStyleToCss,
  type TextElementTypeKey,
  type PartialTextStyle,
} from "@gazette/shared";

// Go up from src/services/ to apps/backend/
const appRoot = fileURLToPath(new URL("../..", import.meta.url));

// Use shared canvas dimensions
const CANVAS_WIDTH = CANVAS_FRAME.width;
const CANVAS_HEIGHT = CANVAS_FRAME.height;
const GOOGLE_FONTS_URL =
  "https://fonts.googleapis.com/css2?family=Playfair+Display:ital,wght@0,400;0,500;0,600;0,700;0,800;0,900;1,400;1,500;1,600;1,700;1,800;1,900&family=Old+Standard+TT:ital,wght@0,400;0,700;1,400&family=Libre+Baskerville:ital,wght@0,400;0,700;1,400&family=EB+Garamond:ital,wght@0,400;0,500;0,600;0,700;0,800;1,400;1,500;1,600;1,700;1,800&family=Inter:wght@100;200;300;400;500;600;700;800;900&display=swap";

type ExportPosition = {
  x: number;
  y: number;
  width: number;
  height: number;
};

type ExportElement = {
  id: string;
  pageId: string;
  type: string;
  position: ExportPosition;
  content?: string | null;
  style?: PartialTextStyle | null;
  imageId?: string | null;
  cropData?: { x: number; y: number; zoom: number } | null;
  videoUrl?: string | null;
  videoStatus?: string | null;
  animationPrompt?: string | null;
};

type ExportPage = {
  id: string;
  order: number;
  templateId: string;
  title: string | null;
  subtitle: string | null;
};

type ExportProject = {
  id: string;
  name: string;
  slug: string;
};

type BaseExportPayload = {
  project: ExportProject;
  pages: ExportPage[];
  elementsByPage: Map<string, ExportElement[]>;
};

type HtmlExportPayload = {
  project: ExportProject;
  pages: ExportPage[];
  elementsByPage: Map<string, ExportElement[]>;
  imageDataById: Map<string, { dataUri: string; filename: string }>;
};

let cachedFontCss: string | null = null;
let pendingFontCss: Promise<string> | null = null;
const FONT_FETCH_TIMEOUT_MS = 5000;

const sanitizeFilename = (value: string, fallback = "export") => {
  const sanitized = value.trim().replace(/[^a-z0-9._-]+/gi, "_");
  const normalized = sanitized.replace(/^_+|_+$/g, "");
  return normalized || fallback;
};

const escapeHtml = (value: string) =>
  value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");

const formatText = (value: string | null | undefined) => {
  if (!value) return "";
  return escapeHtml(value).replace(/\n/g, "<br/>");
};

/**
 * Get CSS string for a text element, merging default styles with custom overrides.
 * Uses the shared getMergedTextStyle and textStyleToCss helpers for consistency with editor.
 */
const getElementTextStyleCss = (
  elementType: TextElementTypeKey,
  customStyle?: PartialTextStyle | null
): string => {
  const mergedStyle = getMergedTextStyle(elementType, customStyle);
  return textStyleToCss(mergedStyle);
};

const extractVideoId = (value: string | null | undefined) => {
  if (!value) return null;
  const match = value.match(/\/api\/videos\/([^/]+)\/file/);
  return match?.[1] ?? null;
};

const getVideoFilePath = async (videoId: string): Promise<string | null> => {
  const video = await db
    .select({ storagePath: schema.videos.storagePath })
    .from(schema.videos)
    .where(eq(schema.videos.id, videoId))
    .get();

  if (!video) return null;

  const normalizedPath = video.storagePath.startsWith("/")
    ? video.storagePath.slice(1)
    : video.storagePath;

  return join(appRoot, normalizedPath);
};

const readImageDataUri = async (image: typeof schema.images.$inferSelect) => {
  const normalizedPath = image.storagePath.startsWith("/")
    ? image.storagePath.slice(1)
    : image.storagePath;
  const filePath = join(appRoot, normalizedPath);
  const file = Bun.file(filePath);
  if (!(await file.exists())) {
    return null;
  }
  const buffer = Buffer.from(await file.arrayBuffer());
  const dataUri = `data:${image.mimeType};base64,${buffer.toString("base64")}`;
  return dataUri;
};

const fetchWithTimeout = async (url: string, timeoutMs = FONT_FETCH_TIMEOUT_MS) => {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    return await fetch(url, { signal: controller.signal });
  } finally {
    clearTimeout(timer);
  }
};

const inlineExternalUrls = async (css: string) => {
  const matches = Array.from(css.matchAll(/url\(([^)]+)\)/g));
  const urls = new Set<string>();
  for (const match of matches) {
    const raw = match[1]?.trim() ?? "";
    const url = raw.replace(/^['"]|['"]$/g, "");
    if (url.startsWith("http")) {
      urls.add(url);
    }
  }

  const results = await Promise.all(
    Array.from(urls).map(async (url) => {
      try {
        const response = await fetchWithTimeout(url);
        if (!response.ok) return null;
        const mime = response.headers.get("content-type") ?? "application/octet-stream";
        const buffer = Buffer.from(await response.arrayBuffer());
        const dataUri = `data:${mime};base64,${buffer.toString("base64")}`;
        return { url, dataUri };
      } catch {
        return null;
      }
    })
  );

  let output = css;
  for (const result of results) {
    if (!result) continue;
    output = output.replaceAll(result.url, result.dataUri);
  }

  return output;
};

const getInlineFontCss = async () => {
  if (cachedFontCss) return cachedFontCss;
  if (pendingFontCss) return pendingFontCss;

  pendingFontCss = (async () => {
    try {
      const response = await fetchWithTimeout(GOOGLE_FONTS_URL);
      if (!response.ok) {
        return "";
      }
      const css = await response.text();
      const inlined = await inlineExternalUrls(css);
      cachedFontCss = inlined;
      return inlined;
    } catch {
      return "";
    } finally {
      pendingFontCss = null;
    }
  })();

  return pendingFontCss;
};

const buildBaseCss = () => `
:root {
  --color-parchment: ${GAZETTE_COLORS.parchment};
  --color-ink: ${GAZETTE_COLORS.ink};
  --color-muted: ${GAZETTE_COLORS.muted};
  --color-cream: ${GAZETTE_COLORS.cream};
}

*,
*::before,
*::after {
  box-sizing: border-box;
}

body {
  margin: 0;
  min-height: 100vh;
  font-family: "EB Garamond", Garamond, serif;
  background-color: var(--color-cream);
  color: var(--color-ink);
  line-height: 1.6;
}

a {
  color: var(--color-ink);
  text-decoration: none;
  border-bottom: 1px solid rgba(44, 24, 16, 0.4);
}

a:hover {
  color: var(--color-muted);
}

.export-nav {
  position: sticky;
  top: 0;
  z-index: 5;
  background: rgba(253, 248, 232, 0.95);
  border-bottom: 1px solid rgba(139, 115, 85, 0.2);
  padding: 12px 24px;
  display: flex;
  flex-wrap: wrap;
  gap: 12px 24px;
  align-items: center;
  backdrop-filter: blur(6px);
}

.nav-title {
  font-family: "Playfair Display", Georgia, serif;
  font-size: 20px;
  font-weight: 700;
}

.nav-links {
  display: flex;
  flex-wrap: wrap;
  gap: 8px 16px;
  font-family: "Inter", system-ui, sans-serif;
  font-size: 14px;
}

main {
  padding: 24px 16px 60px;
}

.page-section {
  padding-bottom: 32px;
  margin-bottom: 32px;
  border-bottom: 1px dashed rgba(139, 115, 85, 0.25);
}

.page-frame {
  width: 100%;
  display: flex;
  justify-content: center;
  align-items: flex-start;
}

.page-canvas {
  position: relative;
  width: ${CANVAS_WIDTH}px;
  height: ${CANVAS_HEIGHT}px;
  transform-origin: top left;
}

.gazette-page {
  position: relative;
  width: ${CANVAS_WIDTH}px;
  height: ${CANVAS_HEIGHT}px;
  background-color: ${CANVAS_FRAME.backgroundColor};
  box-shadow: ${CANVAS_FRAME.shadow};
  overflow: hidden;
}

/* Vignette effect */
.gazette-page::before {
  content: "";
  position: absolute;
  inset: 0;
  background: radial-gradient(ellipse at center, transparent 0%, transparent 50%, rgba(139, 115, 85, 0.12) 100%);
  pointer-events: none;
}

.page-rule {
  position: absolute;
  pointer-events: none;
}

.page-rule.outer {
  inset: ${CANVAS_FRAME.outerInset}px;
  border: ${CANVAS_FRAME.outerBorderWidth}px solid ${CANVAS_FRAME.ruleColor};
}

.page-rule.inner {
  inset: ${CANVAS_FRAME.innerInset}px;
  border: ${CANVAS_FRAME.innerBorderWidth}px solid ${CANVAS_FRAME.borderColor};
}

.element {
  position: absolute;
  overflow: hidden;
}

.element.text-element {
  padding: 8px;
  word-wrap: break-word;
  overflow-wrap: break-word;
}

.element.image {
  padding: 0;
  border-radius: 2px;
}

.media {
  width: 100%;
  height: 100%;
  display: block;
  object-fit: cover;
  object-position: center;
}

.missing-media {
  width: 100%;
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-family: "Inter", system-ui, sans-serif;
  font-size: 14px;
  color: var(--color-muted);
  background: linear-gradient(135deg, #e8dcc0, #d4c4a0);
  border: 1px dashed rgba(139, 115, 85, 0.3);
}

.page-nav {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin: 12px auto 0;
  max-width: ${CANVAS_WIDTH}px;
  font-family: "Inter", system-ui, sans-serif;
  font-size: 14px;
  color: var(--color-muted);
}

@media print {
  .export-nav,
  .page-nav {
    display: none;
  }

  body {
    background: white;
    color: black;
  }

  .page-section {
    page-break-after: always;
    border: none;
    margin-bottom: 0;
    padding-bottom: 0;
  }

  .gazette-page {
    box-shadow: none;
  }
}
`;

const buildHtml = async (payload: HtmlExportPayload, videoAssetMap: Map<string, string>) => {
  const fontCss = await getInlineFontCss();
  const baseCss = buildBaseCss();

  const pagesMarkup = payload.pages.map((page, pageIndex) => {
    const elements = payload.elementsByPage.get(page.id) ?? [];
    const pageLabel = page.title?.trim() || `Page ${pageIndex + 1}`;
    const subtitle = page.subtitle?.trim() ?? "";

    const elementsMarkup = elements
      .map((element) => {
        const style = `left:${element.position.x}px;top:${element.position.y}px;width:${element.position.width}px;height:${element.position.height}px;`;

        if (element.type === ELEMENT_TYPES.IMAGE) {
          const imageData = element.imageId ? payload.imageDataById.get(element.imageId) : null;
          const videoAsset = videoAssetMap.get(element.id);
          const poster = imageData ? ` poster="${imageData.dataUri}"` : "";
          const label = imageData?.filename ? escapeHtml(imageData.filename) : "Image";
          const cropStyle = getImageCropCss(element.cropData);

          if (videoAsset) {
            return `
              <div class="element image" style="${style}">
                <video class="media" src="${videoAsset}"${poster} loop autoplay muted playsinline controls preload="metadata" style="${cropStyle}"></video>
              </div>
            `;
          }

          if (imageData) {
            return `
              <div class="element image" style="${style}">
                <img class="media" src="${imageData.dataUri}" alt="${label}" loading="lazy" style="${cropStyle}" />
              </div>
            `;
          }

          return `
            <div class="element image" style="${style}">
              <div class="missing-media">Missing image</div>
            </div>
          `;
        }

        const text = formatText(element.content ?? "");
        const textType = element.type as TextElementTypeKey;
        const textStyleCss = getElementTextStyleCss(textType, element.style);
        return `
          <div class="element text-element" style="${style} ${textStyleCss}">${text}</div>
        `;
      })
      .join("");

    const prevLink = pageIndex > 0 ? `#page-${pageIndex}` : "#top";
    const nextLink = pageIndex < payload.pages.length - 1 ? `#page-${pageIndex + 2}` : "#top";

    return `
      <section id="page-${pageIndex + 1}" class="page-section">
        <div class="page-meta">
          <h2>${escapeHtml(pageLabel)}</h2>
          ${subtitle ? `<p>${escapeHtml(subtitle)}</p>` : ""}
        </div>
        <div class="page-frame">
          <div class="page-canvas gazette-page paper-texture" data-page>
            ${elementsMarkup}
            <div class="page-rule outer"></div>
            <div class="page-rule inner"></div>
          </div>
        </div>
        <div class="page-nav">
          <a href="${prevLink}">Previous page</a>
          <span>Page ${pageIndex + 1} of ${payload.pages.length}</span>
          <a href="${nextLink}">Next page</a>
        </div>
      </section>
    `;
  });

  const navLinks = payload.pages
    .map((page, index) => {
      const label = page.title?.trim() || `Page ${index + 1}`;
      return `<a href="#page-${index + 1}">${escapeHtml(label)}</a>`;
    })
    .join("");

  return `<!doctype html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>${escapeHtml(payload.project.name)} — Gazette Export</title>
    <style>
${fontCss}
${baseCss}
    </style>
  </head>
  <body>
    <a id="top"></a>
    <nav class="export-nav">
      <div class="nav-title">${escapeHtml(payload.project.name)}</div>
      <div class="nav-links">${navLinks}</div>
    </nav>
    <main>
      ${pagesMarkup.join("")}
    </main>
    <script>
      (function () {
        const CANVAS_WIDTH = ${CANVAS_WIDTH};
        const CANVAS_HEIGHT = ${CANVAS_HEIGHT};
        const pages = Array.from(document.querySelectorAll("[data-page]"));

        const updateScale = () => {
          pages.forEach((page) => {
            const wrapper = page.parentElement;
            if (!wrapper) return;
            const maxWidth = Math.min(wrapper.clientWidth, CANVAS_WIDTH);
            const scale = maxWidth / CANVAS_WIDTH;
            page.style.transform = "scale(" + scale.toFixed(4) + ")";
            wrapper.style.height = (CANVAS_HEIGHT * scale).toFixed(2) + "px";
          });
        };

        window.addEventListener("resize", updateScale);
        updateScale();
      })();
    </script>
  </body>
</html>`;
};

const fetchBaseExportData = async (projectId: string): Promise<BaseExportPayload | null> => {
  const project = await db
    .select({ id: schema.projects.id, name: schema.projects.name, slug: schema.projects.slug })
    .from(schema.projects)
    .where(eq(schema.projects.id, projectId))
    .get();

  if (!project) return null;

  const pages = await db
    .select({
      id: schema.pages.id,
      order: schema.pages.order,
      templateId: schema.pages.templateId,
      title: schema.pages.title,
      subtitle: schema.pages.subtitle,
    })
    .from(schema.pages)
    .where(eq(schema.pages.projectId, projectId))
    .orderBy(schema.pages.order);

  const pageIds = pages.map((page) => page.id);
  const elementRecords =
    pageIds.length > 0
      ? await db
          .select()
          .from(schema.elements)
          .where(inArray(schema.elements.pageId, pageIds))
          .orderBy(schema.elements.createdAt)
      : [];

  const elementsByPage = new Map<string, ExportElement[]>();

  for (const record of elementRecords) {
    const position = {
      x: record.positionX,
      y: record.positionY,
      width: record.positionWidth,
      height: record.positionHeight,
    };

    if (record.type === ELEMENT_TYPES.IMAGE) {
      const hasCropData =
        record.cropX !== null || record.cropY !== null || record.cropZoom !== null;
      const cropData = hasCropData
        ? {
            x: record.cropX ?? DEFAULTS.CROP_X,
            y: record.cropY ?? DEFAULTS.CROP_Y,
            zoom: record.cropZoom ?? DEFAULTS.CROP_ZOOM,
          }
        : null;

      const element: ExportElement = {
        id: record.id,
        pageId: record.pageId,
        type: record.type,
        position,
        imageId: record.imageId ?? null,
        cropData,
        videoUrl: record.videoUrl ?? null,
        videoStatus: record.videoStatus ?? "none",
        animationPrompt: record.animationPrompt ?? null,
      };

      const list = elementsByPage.get(record.pageId) ?? [];
      list.push(element);
      elementsByPage.set(record.pageId, list);
      continue;
    }

    // Parse the style JSON if present
    let parsedStyle: PartialTextStyle | null = null;
    if (record.style) {
      try {
        parsedStyle = JSON.parse(record.style) as PartialTextStyle;
      } catch {
        // Invalid JSON, use defaults
      }
    }

    const element: ExportElement = {
      id: record.id,
      pageId: record.pageId,
      type: record.type,
      position,
      content: record.content ?? "",
      style: parsedStyle,
    };

    const list = elementsByPage.get(record.pageId) ?? [];
    list.push(element);
    elementsByPage.set(record.pageId, list);
  }

  return {
    project,
    pages,
    elementsByPage,
  };
};

const fetchHtmlExportData = async (projectId: string): Promise<HtmlExportPayload | null> => {
  const base = await fetchBaseExportData(projectId);
  if (!base) return null;

  const imageIds = new Set<string>();
  for (const elements of base.elementsByPage.values()) {
    for (const element of elements) {
      if (element.imageId) {
        imageIds.add(element.imageId);
      }
    }
  }

  const imageRecords =
    imageIds.size > 0
      ? await db
          .select()
          .from(schema.images)
          .where(inArray(schema.images.id, Array.from(imageIds)))
      : [];

  const imageDataById = new Map<string, { dataUri: string; filename: string }>();
  for (const image of imageRecords) {
    const dataUri = await readImageDataUri(image);
    if (dataUri) {
      imageDataById.set(image.id, {
        dataUri,
        filename: image.originalFilename,
      });
    }
  }

  return {
    ...base,
    imageDataById,
  };
};

export const buildHtmlExportZip = async (projectId: string) => {
  const payload = await fetchHtmlExportData(projectId);
  if (!payload) return null;

  const zip = new JSZip();
  const videoAssetMap = new Map<string, string>();

  for (const [pageIndex, page] of payload.pages.entries()) {
    const elements = payload.elementsByPage.get(page.id) ?? [];
    for (const [elementIndex, element] of elements.entries()) {
      if (element.type !== ELEMENT_TYPES.IMAGE) continue;
      if (!element.videoUrl) continue;
      if (element.videoStatus && element.videoStatus !== "complete") continue;
      const videoId = extractVideoId(element.videoUrl);
      if (!videoId) continue;
      const filePath = await getVideoFilePath(videoId);
      if (!filePath) continue;
      const file = Bun.file(filePath);
      if (!(await file.exists())) continue;
      const filename = `assets/videos/page-${pageIndex + 1}-element-${elementIndex + 1}.mp4`;
      videoAssetMap.set(element.id, filename);
      zip.file(filename, await file.arrayBuffer());
    }
  }

  const html = await buildHtml(payload, videoAssetMap);
  zip.file("index.html", html);

  const buffer = await zip.generateAsync({ type: "uint8array" });
  const safeSlug = sanitizeFilename(payload.project.slug, "export");
  const rawName = `gazette-${safeSlug}.html.zip`;

  return { buffer, filename: rawName };
};

type VideoExportMetadata = {
  page: { id: string; order: number; title: string | null; subtitle: string | null };
  element: { id: string; index: number; imageId: string | null };
  prompt: string | null;
  videoUrl: string | null;
  file: string | null;
  missing: boolean;
  missingReason: string | null;
};

export const buildVideoExportZip = async (projectId: string) => {
  const payload = await fetchBaseExportData(projectId);
  if (!payload) return null;

  const zip = new JSZip();
  const metadata: VideoExportMetadata[] = [];
  let videoCounter = 0;

  for (const [pageIndex, page] of payload.pages.entries()) {
    const elements = payload.elementsByPage.get(page.id) ?? [];
    for (const [elementIndex, element] of elements.entries()) {
      if (element.type !== ELEMENT_TYPES.IMAGE) continue;
      if (!element.videoUrl) continue;
      if (element.videoStatus && element.videoStatus !== "complete") continue;

      const videoId = extractVideoId(element.videoUrl);
      const safeBase = sanitizeFilename(
        `page-${page.order + 1}-element-${elementIndex + 1}`,
        `video-${pageIndex + 1}-${elementIndex + 1}`
      );
      const zipPath = `videos/${safeBase}.mp4`;

      if (!videoId) {
        metadata.push({
          page,
          element: { id: element.id, index: elementIndex + 1, imageId: element.imageId ?? null },
          prompt: element.animationPrompt ?? null,
          videoUrl: element.videoUrl ?? null,
          file: null,
          missing: true,
          missingReason: "missing_video_id",
        });
        continue;
      }

      const filePath = await getVideoFilePath(videoId);
      if (!filePath) {
        metadata.push({
          page,
          element: { id: element.id, index: elementIndex + 1, imageId: element.imageId ?? null },
          prompt: element.animationPrompt ?? null,
          videoUrl: element.videoUrl ?? null,
          file: null,
          missing: true,
          missingReason: "video_not_in_db",
        });
        continue;
      }

      const file = Bun.file(filePath);
      if (!(await file.exists())) {
        metadata.push({
          page,
          element: { id: element.id, index: elementIndex + 1, imageId: element.imageId ?? null },
          prompt: element.animationPrompt ?? null,
          videoUrl: element.videoUrl ?? null,
          file: null,
          missing: true,
          missingReason: "missing_file",
        });
        continue;
      }

      zip.file(zipPath, await file.arrayBuffer());
      metadata.push({
        page,
        element: { id: element.id, index: elementIndex + 1, imageId: element.imageId ?? null },
        prompt: element.animationPrompt ?? null,
        videoUrl: element.videoUrl ?? null,
        file: zipPath,
        missing: false,
        missingReason: null,
      });
      videoCounter += 1;
    }
  }

  const metadataPayload = {
    project: payload.project,
    generatedAt: new Date().toISOString(),
    totalVideos: videoCounter,
    videos: metadata,
  };
  zip.file("metadata.json", JSON.stringify(metadataPayload, null, 2));

  const buffer = await zip.generateAsync({ type: "uint8array" });
  const safeSlug = sanitizeFilename(payload.project.slug, "export");
  const rawName = `gazette-${safeSlug}.videos.zip`;

  return { buffer, filename: rawName };
};

const buildPdfHtml = async (payload: HtmlExportPayload) => {
  const fontCss = await getInlineFontCss();
  const baseCss = buildBaseCss();

  const pagesMarkup = payload.pages.map((page) => {
    const elements = payload.elementsByPage.get(page.id) ?? [];

    const elementsMarkup = elements
      .map((element) => {
        const style = `left:${element.position.x}px;top:${element.position.y}px;width:${element.position.width}px;height:${element.position.height}px;`;

        if (element.type === ELEMENT_TYPES.IMAGE) {
          const imageData = element.imageId ? payload.imageDataById.get(element.imageId) : null;
          const label = imageData?.filename ? escapeHtml(imageData.filename) : "Image";
          const cropStyle = getImageCropCss(element.cropData);

          if (imageData) {
            return `
              <div class="element image" style="${style}">
                <img class="media" src="${imageData.dataUri}" alt="${label}" style="${cropStyle}" />
              </div>
            `;
          }

          return `
            <div class="element image" style="${style}">
              <div class="missing-media">Missing image</div>
            </div>
          `;
        }

        const text = formatText(element.content ?? "");
        const textType = element.type as TextElementTypeKey;
        const textStyleCss = getElementTextStyleCss(textType, element.style);
        return `
          <div class="element text-element" style="${style} ${textStyleCss}">${text}</div>
        `;
      })
      .join("");

    return `
      <section class="pdf-page">
        <div class="gazette-page">
          ${elementsMarkup}
          <div class="page-rule outer"></div>
          <div class="page-rule inner"></div>
        </div>
      </section>
    `;
  });

  return `<!doctype html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <title>${escapeHtml(payload.project.name)} — Gazette PDF</title>
    <style>
${fontCss}
${baseCss}

@page {
  size: ${CANVAS_WIDTH}px ${CANVAS_HEIGHT}px;
  margin: 0;
}

body {
  margin: 0;
  padding: 0;
  background: white;
}

.pdf-page {
  width: ${CANVAS_WIDTH}px;
  height: ${CANVAS_HEIGHT}px;
  page-break-after: always;
  background: white;
}

.pdf-page:last-child {
  page-break-after: avoid;
}
    </style>
  </head>
  <body>
    ${pagesMarkup.join("")}
  </body>
</html>`;
};

export const buildPdfExport = async (projectId: string) => {
  const payload = await fetchHtmlExportData(projectId);
  if (!payload) return null;

  const html = await buildPdfHtml(payload);

  const browser = await puppeteer.launch({
    headless: true,
    args: ["--no-sandbox", "--disable-setuid-sandbox"],
  });

  try {
    const page = await browser.newPage();
    page.setDefaultNavigationTimeout(60000);
    await page.setContent(html, { waitUntil: "domcontentloaded", timeout: 60000 });
    await page.evaluate(() => {
      return new Promise<void>((resolve) => {
        const doc = (globalThis as { document?: { fonts?: { ready?: Promise<unknown> } } })
          .document;
        if (!doc?.fonts?.ready) {
          resolve();
          return;
        }

        let settled = false;
        const finish = () => {
          if (settled) return;
          settled = true;
          resolve();
        };

        doc.fonts.ready.then(finish).catch(finish);
        setTimeout(finish, 3000);
      });
    });

    const pdfBuffer = await page.pdf({
      width: `${CANVAS_WIDTH}px`,
      height: `${CANVAS_HEIGHT}px`,
      printBackground: true,
      preferCSSPageSize: true,
    });

    const safeSlug = sanitizeFilename(payload.project.slug, "export");
    const filename = `gazette-${safeSlug}.pdf`;

    return { buffer: new Uint8Array(pdfBuffer), filename };
  } finally {
    await browser.close();
  }
};

const SLIDESHOW_SECONDS_PER_PAGE = 15;

const buildSlideshowPageHtml = (
  payload: HtmlExportPayload,
  pageIndex: number,
  videoAssetMap: Map<string, string>
) => {
  const fontCss = cachedFontCss || "";
  const baseCss = buildBaseCss();
  const page = payload.pages[pageIndex];
  if (!page) return null;

  const elements = payload.elementsByPage.get(page.id) ?? [];

  const elementsMarkup = elements
    .map((element) => {
      const style = `left:${element.position.x}px;top:${element.position.y}px;width:${element.position.width}px;height:${element.position.height}px;`;

      if (element.type === ELEMENT_TYPES.IMAGE) {
        const imageData = element.imageId ? payload.imageDataById.get(element.imageId) : null;
        const videoAsset = videoAssetMap.get(element.id);
        const poster = imageData ? ` poster="${imageData.dataUri}"` : "";
        const label = imageData?.filename ? escapeHtml(imageData.filename) : "Image";
        const cropStyle = getImageCropCss(element.cropData);

        if (videoAsset) {
          return `
            <div class="element image" style="${style}">
              <video class="media" src="${videoAsset}"${poster} loop autoplay muted playsinline preload="auto" style="${cropStyle}"></video>
            </div>
          `;
        }

        if (imageData) {
          return `
            <div class="element image" style="${style}">
              <img class="media" src="${imageData.dataUri}" alt="${label}" style="${cropStyle}" />
            </div>
          `;
        }

        return `
          <div class="element image" style="${style}">
            <div class="missing-media">Missing image</div>
          </div>
        `;
      }

      const text = formatText(element.content ?? "");
      const textType = element.type as TextElementTypeKey;
      const textStyleCss = getElementTextStyleCss(textType, element.style);
      return `
        <div class="element text-element" style="${style} ${textStyleCss}">${text}</div>
      `;
    })
    .join("");

  return `<!doctype html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <style>
${fontCss}
${baseCss}
body {
  margin: 0;
  padding: 0;
  background: var(--color-parchment);
  display: flex;
  justify-content: center;
  align-items: center;
  min-height: 100vh;
}
.page-canvas {
  width: ${CANVAS_WIDTH}px;
  height: ${CANVAS_HEIGHT}px;
}
    </style>
  </head>
  <body>
    <div class="page-canvas gazette-page paper-texture">
      ${elementsMarkup}
      <div class="page-rule outer"></div>
      <div class="page-rule inner"></div>
    </div>
  </body>
</html>`;
};

const runFFmpeg = (args: string[]): Promise<void> => {
  return new Promise((resolve, reject) => {
    const proc = spawn("ffmpeg", args, { stdio: "pipe" });
    let stderr = "";
    proc.stderr?.on("data", (chunk) => {
      stderr += chunk.toString();
    });
    proc.on("close", (code) => {
      if (code === 0) {
        resolve();
      } else {
        reject(new Error(`FFmpeg exited with code ${code}: ${stderr}`));
      }
    });
    proc.on("error", reject);
  });
};

export const buildVideoSlideshowExport = async (projectId: string) => {
  const payload = await fetchHtmlExportData(projectId);
  if (!payload) return null;

  // Pre-fetch fonts for slideshow
  await getInlineFontCss();

  // Build video asset map for pages with videos
  const videoAssetMap = new Map<string, string>();
  for (const page of payload.pages) {
    const elements = payload.elementsByPage.get(page.id) ?? [];
    for (const element of elements) {
      if (element.type !== ELEMENT_TYPES.IMAGE) continue;
      if (!element.videoUrl) continue;
      if (element.videoStatus && element.videoStatus !== "complete") continue;
      const videoId = extractVideoId(element.videoUrl);
      if (!videoId) continue;
      const filePath = await getVideoFilePath(videoId);
      if (!filePath) continue;
      const file = Bun.file(filePath);
      if (await file.exists()) {
        // Use file:// URL for local video files
        videoAssetMap.set(element.id, `file://${filePath}`);
      }
    }
  }

  const workDir = join(tmpdir(), `gazette-slideshow-${randomUUID()}`);
  await mkdir(workDir, { recursive: true });

  const browser = await puppeteer.launch({
    headless: true,
    args: [
      "--no-sandbox",
      "--disable-setuid-sandbox",
      "--autoplay-policy=no-user-gesture-required",
    ],
  });

  try {
    const page = await browser.newPage();
    await page.setViewport({ width: CANVAS_WIDTH, height: CANVAS_HEIGHT });

    const imageFiles: string[] = [];

    // Screenshot each page
    for (let i = 0; i < payload.pages.length; i++) {
      const html = buildSlideshowPageHtml(payload, i, videoAssetMap);
      if (!html) continue;

      await page.setContent(html, { waitUntil: "networkidle0" });

      // Wait a bit for videos to start playing (if any)
      await page.evaluate(() => new Promise((resolve) => setTimeout(resolve, 500)));

      const imagePath = join(workDir, `page-${String(i + 1).padStart(3, "0")}.png`);
      await page.screenshot({ path: imagePath, type: "png" });
      imageFiles.push(imagePath);
    }

    await browser.close();

    if (imageFiles.length === 0) {
      await rm(workDir, { recursive: true, force: true });
      return null;
    }

    // Create a concat file for FFmpeg
    const concatPath = join(workDir, "concat.txt");
    const concatContent = imageFiles
      .map((file) => `file '${file}'\nduration ${SLIDESHOW_SECONDS_PER_PAGE}`)
      .join("\n");
    await writeFile(concatPath, concatContent + `\nfile '${imageFiles[imageFiles.length - 1]}'`);

    // Generate video with FFmpeg
    const outputPath = join(workDir, "slideshow.mp4");
    await runFFmpeg([
      "-y",
      "-f",
      "concat",
      "-safe",
      "0",
      "-i",
      concatPath,
      "-vf",
      `scale=${CANVAS_WIDTH}:${CANVAS_HEIGHT}:force_original_aspect_ratio=decrease,pad=${CANVAS_WIDTH}:${CANVAS_HEIGHT}:(ow-iw)/2:(oh-ih)/2`,
      "-c:v",
      "libx264",
      "-pix_fmt",
      "yuv420p",
      "-preset",
      "medium",
      "-crf",
      "23",
      "-movflags",
      "+faststart",
      outputPath,
    ]);

    // Read the output video
    const videoBuffer = await Bun.file(outputPath).arrayBuffer();

    // Cleanup
    await rm(workDir, { recursive: true, force: true });

    const safeSlug = sanitizeFilename(payload.project.slug, "export");
    const filename = `gazette-${safeSlug}-slideshow.mp4`;

    return { buffer: new Uint8Array(videoBuffer), filename };
  } catch (error) {
    await browser.close().catch(() => {});
    await rm(workDir, { recursive: true, force: true }).catch(() => {});
    throw error;
  }
};
