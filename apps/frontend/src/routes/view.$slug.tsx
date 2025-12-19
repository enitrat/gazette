import { createFileRoute } from "@tanstack/react-router";
import ky from "ky";
import { useEffect, useMemo, useState, type FormEvent } from "react";
import type { CanvasElement, CanvasPage } from "@/components/Canvas";
import { GazetteViewer } from "@/components/viewer/GazetteViewer";
import { parseApiError } from "@/lib/api";

const VIEW_TOKEN_PREFIX = "gazette.view.token";

const getApiBaseUrl = () =>
  (
    import.meta.env.VITE_API_URL ??
    import.meta.env.VITE_API_BASE_URL ??
    "http://localhost:3000/api"
  ).replace(/\/+$/, "");

const viewerApi = ky.create({ prefixUrl: getApiBaseUrl() });

type ViewerProject = {
  id?: string;
  name: string;
  slug: string;
  shareUrl?: string | null;
  createdAt?: string | null;
};

type ViewerPage = CanvasPage & {
  order: number;
  templateId: string;
  title?: string | null;
  subtitle?: string | null;
  elements: CanvasElement[];
};

type ViewerResponse = {
  project: ViewerProject;
  pages: ViewerPage[];
};

export const Route = createFileRoute("/view/$slug")({
  component: ViewerRoute,
});

const loadViewToken = (slug: string) => {
  if (typeof window === "undefined") return null;
  return localStorage.getItem(`${VIEW_TOKEN_PREFIX}.${slug}`);
};

const storeViewToken = (slug: string, token: string) => {
  if (typeof window === "undefined") return;
  localStorage.setItem(`${VIEW_TOKEN_PREFIX}.${slug}`, token);
};

const clearViewToken = (slug: string) => {
  if (typeof window === "undefined") return;
  localStorage.removeItem(`${VIEW_TOKEN_PREFIX}.${slug}`);
};

function ViewerRoute() {
  const { slug } = Route.useParams();
  const [viewToken, setViewToken] = useState<string | null>(() => loadViewToken(slug));
  const [viewerData, setViewerData] = useState<ViewerResponse | null>(null);
  const [activeIndex, setActiveIndex] = useState(0);
  const [password, setPassword] = useState("");
  const [statusMessage, setStatusMessage] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isAuthenticating, setIsAuthenticating] = useState(false);
  const [shareStatus, setShareStatus] = useState<string | null>(null);

  useEffect(() => {
    setViewToken(loadViewToken(slug));
    setViewerData(null);
    setActiveIndex(0);
    setStatusMessage(null);
  }, [slug]);

  useEffect(() => {
    if (!viewToken) return;

    const fetchView = async () => {
      setIsLoading(true);
      setStatusMessage(null);
      try {
        const data = await viewerApi
          .get(`view/${slug}`, {
            headers: {
              Authorization: `Bearer ${viewToken}`,
            },
          })
          .json<ViewerResponse>();
        setViewerData(data);
      } catch (error) {
        const parsed = await parseApiError(error);
        setStatusMessage(parsed.message);
        setViewerData(null);
        clearViewToken(slug);
        setViewToken(null);
      } finally {
        setIsLoading(false);
      }
    };

    void fetchView();
  }, [slug, viewToken]);

  const pages = useMemo(() => {
    if (!viewerData?.pages) return [] as ViewerPage[];
    return [...viewerData.pages].sort((a, b) => a.order - b.order);
  }, [viewerData?.pages]);

  useEffect(() => {
    if (activeIndex >= pages.length) {
      setActiveIndex(0);
    }
  }, [activeIndex, pages.length]);

  const handlePasswordSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!password.trim()) {
      setStatusMessage("Enter the password to continue.");
      return;
    }

    setIsAuthenticating(true);
    setStatusMessage(null);

    try {
      const data = await viewerApi
        .post(`view/${slug}/access`, {
          json: { password },
        })
        .json<{ viewToken: string }>();
      storeViewToken(slug, data.viewToken);
      setViewToken(data.viewToken);
      setPassword("");
    } catch (error) {
      const parsed = await parseApiError(error);
      setStatusMessage(parsed.message);
    } finally {
      setIsAuthenticating(false);
    }
  };

  const shareUrl =
    viewerData?.project.shareUrl ?? (typeof window !== "undefined" ? window.location.href : "");

  const handleShare = async () => {
    if (!shareUrl) return;
    try {
      if (navigator.clipboard?.writeText) {
        await navigator.clipboard.writeText(shareUrl);
      } else {
        const textarea = document.createElement("textarea");
        textarea.value = shareUrl;
        textarea.style.position = "fixed";
        textarea.style.left = "-9999px";
        document.body.appendChild(textarea);
        textarea.select();
        document.execCommand("copy");
        document.body.removeChild(textarea);
      }
      setShareStatus("Link copied");
    } catch {
      setShareStatus("Copy failed");
    }

    window.setTimeout(() => setShareStatus(null), 2000);
  };

  if (!viewToken) {
    return (
      <div className="min-h-[calc(100vh-57px)] bg-cream/70 px-4 py-12 sm:px-8">
        <div className="mx-auto w-full max-w-md rounded-md border border-sepia/30 bg-parchment p-6 shadow-sm">
          <h1 className="font-masthead text-2xl text-ink-effect">La Gazette de la Vie</h1>
          <p className="mt-2 text-sm text-muted">
            This gazette is password protected. Enter the password to view it.
          </p>
          <form className="mt-6 space-y-4" onSubmit={handlePasswordSubmit}>
            <label className="block text-xs font-ui uppercase tracking-[0.2em] text-muted">
              Password
              <input
                type="password"
                className="mt-2 w-full rounded-sm border border-sepia/30 bg-cream px-3 py-2 text-sm text-ink focus:border-gold focus:outline-none"
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                autoComplete="current-password"
              />
            </label>
            {statusMessage ? (
              <div className="rounded-sm border border-aged-red/40 bg-aged-red/10 px-3 py-2 text-xs text-aged-red">
                {statusMessage}
              </div>
            ) : null}
            <button
              type="submit"
              disabled={isAuthenticating}
              className="w-full rounded-sm bg-gold px-4 py-2 text-xs font-ui font-semibold text-ink transition-colors hover:bg-gold/90 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {isAuthenticating ? "Checking..." : "Unlock Gazette"}
            </button>
          </form>
        </div>
      </div>
    );
  }

  if (isLoading && !viewerData) {
    return (
      <div className="min-h-[calc(100vh-57px)] bg-cream/70 px-4 py-12 sm:px-8">
        <div className="mx-auto max-w-md text-center text-sm text-muted">Loading gazette...</div>
      </div>
    );
  }

  if (!viewerData) {
    return (
      <div className="min-h-[calc(100vh-57px)] bg-cream/70 px-4 py-12 sm:px-8">
        <div className="mx-auto max-w-md text-center text-sm text-aged-red">
          {statusMessage ?? "Unable to load gazette."}
        </div>
      </div>
    );
  }

  return (
    <GazetteViewer
      projectName={viewerData.project.name}
      slug={viewerData.project.slug}
      shareUrl={shareUrl}
      pages={pages}
      activeIndex={activeIndex}
      onNavigate={setActiveIndex}
      onShare={handleShare}
      shareStatus={shareStatus}
    />
  );
}
