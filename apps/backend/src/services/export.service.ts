import { Buffer } from "node:buffer";
import { join } from "node:path";
import { fileURLToPath } from "node:url";
import JSZip from "jszip";
import { eq, inArray } from "drizzle-orm";
import { db, schema } from "../db";
import { DEFAULTS, ELEMENT_TYPES } from "@gazette/shared";

const RAW_UPLOAD_DIR = process.env.UPLOAD_DIR || "uploads";
const UPLOAD_DIR = RAW_UPLOAD_DIR.replace(/^\.\//, "").replace(/\/$/, "");
const VIDEO_SUBDIR = "videos";

const appRoot = fileURLToPath(new URL("..", import.meta.url));
const videoRoot = join(appRoot, UPLOAD_DIR, VIDEO_SUBDIR);

const CANVAS_WIDTH = 1200;
const CANVAS_HEIGHT = 1600;
const GOOGLE_FONTS_URL =
  "https://fonts.googleapis.com/css2?family=Playfair+Display:wght@700&family=Old+Standard+TT:wght@700&family=Libre+Baskerville:ital@1&family=EB+Garamond:wght@400;500&family=Inter:wght@400;500;600&display=swap";

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
  imageId?: string | null;
  cropData?: { x: number; y: number; zoom: number } | null;
  videoUrl?: string | null;
  videoStatus?: string | null;
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

type HtmlExportPayload = {
  project: ExportProject;
  pages: ExportPage[];
  elementsByPage: Map<string, ExportElement[]>;
  imageDataById: Map<string, { dataUri: string; filename: string }>;
};

let cachedFontCss: string | null = null;
let pendingFontCss: Promise<string> | null = null;

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

const extractVideoJobId = (value: string | null | undefined) => {
  if (!value) return null;
  const match = value.match(/\/api\/videos\/([^/]+)\/file/);
  return match?.[1] ?? null;
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

  let output = css;
  for (const url of urls) {
    try {
      const response = await fetch(url);
      if (!response.ok) continue;
      const mime = response.headers.get("content-type") ?? "application/octet-stream";
      const buffer = Buffer.from(await response.arrayBuffer());
      const dataUri = `data:${mime};base64,${buffer.toString("base64")}`;
      output = output.replaceAll(url, dataUri);
    } catch {
      // Ignore failed font fetches and fall back to system fonts.
    }
  }

  return output;
};

const getInlineFontCss = async () => {
  if (cachedFontCss) return cachedFontCss;
  if (pendingFontCss) return pendingFontCss;

  pendingFontCss = (async () => {
    try {
      const response = await fetch(GOOGLE_FONTS_URL);
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
  --color-parchment: #f4e4bc;
  --color-sepia: #5c4033;
  --color-gold: #c9a227;
  --color-ink: #2c2416;
  --color-muted: #8b7355;
  --color-cream: #fdf8e8;
  --color-aged-red: #8b4513;
  --color-forest-green: #355e3b;
  --font-masthead: "Playfair Display", Georgia, serif;
  --font-headline: "Old Standard TT", "Times New Roman", serif;
  --font-subheading: "Libre Baskerville", Georgia, serif;
  --font-body: "EB Garamond", Garamond, serif;
  --font-ui: "Inter", system-ui, sans-serif;
}

*,
*::before,
*::after {
  box-sizing: border-box;
}

body {
  margin: 0;
  min-height: 100vh;
  font-family: var(--font-body);
  background-color: var(--color-cream);
  color: var(--color-ink);
  line-height: 1.6;
}

a {
  color: var(--color-sepia);
  text-decoration: none;
  border-bottom: 1px solid rgba(92, 64, 51, 0.4);
}

a:hover {
  color: var(--color-gold);
  border-color: rgba(201, 162, 39, 0.6);
}

.export-nav {
  position: sticky;
  top: 0;
  z-index: 5;
  background: rgba(253, 248, 232, 0.95);
  border-bottom: 1px solid rgba(92, 64, 51, 0.2);
  padding: 12px 24px;
  display: flex;
  flex-wrap: wrap;
  gap: 12px 24px;
  align-items: center;
  backdrop-filter: blur(6px);
}

.nav-title {
  font-family: var(--font-masthead);
  font-size: 20px;
  font-weight: 700;
}

.nav-links {
  display: flex;
  flex-wrap: wrap;
  gap: 8px 16px;
  font-family: var(--font-ui);
  font-size: 14px;
}

main {
  padding: 24px 16px 60px;
}

.page-section {
  padding-bottom: 32px;
  margin-bottom: 32px;
  border-bottom: 1px dashed rgba(92, 64, 51, 0.25);
}

.page-meta {
  text-align: center;
  margin-bottom: 16px;
}

.page-meta h2 {
  margin: 0;
  font-family: var(--font-headline);
  font-size: 28px;
}

.page-meta p {
  margin: 4px 0 0;
  font-family: var(--font-subheading);
  font-style: italic;
  color: var(--color-muted);
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
  background: radial-gradient(
      ellipse at center,
      transparent 60%,
      rgba(92, 64, 51, 0.15) 100%
    ),
    var(--color-parchment);
  border: 1px solid rgba(92, 64, 51, 0.3);
  box-shadow:
    inset 0 0 30px rgba(92, 64, 51, 0.05),
    0 4px 20px rgba(0, 0, 0, 0.1);
  overflow: hidden;
}

.paper-texture::after {
  content: "";
  position: absolute;
  inset: 0;
  pointer-events: none;
  opacity: 0.06;
  mix-blend-mode: multiply;
  background-image: url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)'/%3E%3C/svg%3E");
  background-repeat: repeat;
}

.element {
  position: absolute;
  padding: 6px;
  overflow: hidden;
  color: var(--color-ink);
}

.element.headline {
  font-family: var(--font-headline);
  font-size: 48px;
  letter-spacing: 0.5px;
  text-transform: uppercase;
  line-height: 1.1;
}

.element.subheading {
  font-family: var(--font-subheading);
  font-size: 26px;
  font-style: italic;
  line-height: 1.2;
}

.element.caption {
  font-family: var(--font-body);
  font-size: 20px;
  line-height: 1.4;
}

.element.image {
  padding: 0;
}

.media {
  width: 100%;
  height: 100%;
  display: block;
  object-fit: cover;
}

.missing-media {
  width: 100%;
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-family: var(--font-ui);
  font-size: 14px;
  color: var(--color-muted);
  background: rgba(253, 248, 232, 0.9);
  border: 1px dashed rgba(92, 64, 51, 0.3);
}

.page-nav {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin: 12px auto 0;
  max-width: ${CANVAS_WIDTH}px;
  font-family: var(--font-ui);
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

  .page-canvas {
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

          if (videoAsset) {
            return `
              <div class="element image" style="${style}">
                <video class="media" src="${videoAsset}"${poster} loop autoplay muted playsinline controls preload="metadata"></video>
              </div>
            `;
          }

          if (imageData) {
            return `
              <div class="element image" style="${style}">
                <img class="media" src="${imageData.dataUri}" alt="${label}" loading="lazy" />
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
        return `
          <div class="element ${element.type}" style="${style}">${text}</div>
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

const fetchExportData = async (projectId: string): Promise<HtmlExportPayload | null> => {
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
  const imageIds = new Set<string>();

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
      };

      if (record.imageId) {
        imageIds.add(record.imageId);
      }

      const list = elementsByPage.get(record.pageId) ?? [];
      list.push(element);
      elementsByPage.set(record.pageId, list);
      continue;
    }

    const element: ExportElement = {
      id: record.id,
      pageId: record.pageId,
      type: record.type,
      position,
      content: record.content ?? "",
    };

    const list = elementsByPage.get(record.pageId) ?? [];
    list.push(element);
    elementsByPage.set(record.pageId, list);
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
    project,
    pages,
    elementsByPage,
    imageDataById,
  };
};

export const buildHtmlExportZip = async (projectId: string) => {
  const payload = await fetchExportData(projectId);
  if (!payload) return null;

  const zip = new JSZip();
  const videoAssetMap = new Map<string, string>();

  for (const [pageIndex, page] of payload.pages.entries()) {
    const elements = payload.elementsByPage.get(page.id) ?? [];
    for (const [elementIndex, element] of elements.entries()) {
      if (element.type !== ELEMENT_TYPES.IMAGE) continue;
      if (!element.videoUrl) continue;
      if (element.videoStatus && element.videoStatus !== "complete") continue;
      const jobId = extractVideoJobId(element.videoUrl);
      if (!jobId) continue;
      const filePath = join(videoRoot, `${jobId}.mp4`);
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
  const safeSlug = payload.project.slug.replace(/[^a-z0-9._-]/gi, "_");
  const rawName = `gazette-${safeSlug || "export"}.html.zip`;

  return { buffer, filename: rawName };
};
