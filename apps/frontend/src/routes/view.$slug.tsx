import { createFileRoute } from "@tanstack/react-router";
import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/components/ui/use-toast";
import { GazetteViewer } from "@/components/viewer/GazetteViewer";
import { viewer } from "@/lib/api";
import { useAuthStore } from "@/stores/auth-store";
import type { ViewProjectResponse } from "@gazette/shared";
import { KeyRound, Loader2 } from "lucide-react";

export const Route = createFileRoute("/view/$slug")({
  component: ViewComponent,
});

function ViewComponent() {
  const { slug } = Route.useParams();
  const { toast } = useToast();
  const [password, setPassword] = useState("");
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [gazetteData, setGazetteData] = useState<ViewProjectResponse | null>(null);
  const [needsPassword, setNeedsPassword] = useState(false);

  const handlePasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      // Try to access with password - this returns the viewToken
      const { viewToken } = await viewer.access(slug, password);

      // Store the viewToken in auth store so subsequent requests include it
      useAuthStore.getState().setToken(viewToken, {
        id: "", // We don't have project id in viewer context
        name: slug,
        slug: slug,
      });

      // Fetch gazette data (now with the viewToken in auth header)
      const data = await viewer.get(slug);

      setGazetteData(data);
      setIsAuthenticated(true);

      toast({
        title: "Accès accordé",
        description: "Bienvenue dans la gazette",
      });
    } catch (error: any) {
      toast({
        title: "Accès refusé",
        description: error?.message || "Mot de passe invalide",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Try to fetch without password on mount
  useEffect(() => {
    const fetchGazette = async () => {
      try {
        const data = await viewer.get(slug);
        setGazetteData(data);
        setIsAuthenticated(true);
      } catch (error: any) {
        // If 401 or 403, needs password (403 can occur with stale/invalid tokens)
        const status = error?.status || error?.response?.status;
        if (status === 401 || status === 403) {
          // Clear any stale auth token before showing password prompt
          useAuthStore.getState().logout();
          setNeedsPassword(true);
        } else {
          toast({
            title: "Erreur",
            description: "Impossible de charger la gazette",
            variant: "destructive",
          });
        }
      }
    };

    fetchGazette();
  }, [slug]);

  if (!isAuthenticated && needsPassword) {
    return (
      <div className="flex min-h-screen items-center justify-center overflow-hidden bg-gradient-to-br from-[#f5f1e8] via-[#faf8f3] to-[#f0e9d8]">
        {/* Animated background elements */}
        <div className="absolute inset-0 overflow-hidden">
          <motion.div
            animate={{
              rotate: [0, 360],
              scale: [1, 1.2, 1],
            }}
            transition={{
              duration: 20,
              repeat: Infinity,
              ease: "linear",
            }}
            className="absolute -left-20 -top-20 h-64 w-64 rounded-full bg-[#C9A227]/5 blur-3xl"
          />
          <motion.div
            animate={{
              rotate: [360, 0],
              scale: [1, 1.3, 1],
            }}
            transition={{
              duration: 25,
              repeat: Infinity,
              ease: "linear",
            }}
            className="absolute -bottom-20 -right-20 h-80 w-80 rounded-full bg-[#8b7355]/5 blur-3xl"
          />
        </div>

        <motion.div
          initial={{ opacity: 0, scale: 0.9, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
          className="relative z-10 w-full max-w-md px-4"
        >
          {/* Decorative header */}
          <div className="mb-8 text-center">
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="mb-4 flex justify-center"
            >
              <div className="relative">
                <div className="absolute inset-0 animate-pulse rounded-full bg-[#C9A227]/20 blur-xl" />
                <div className="relative rounded-full bg-gradient-to-br from-[#C9A227] to-[#8b7355] p-4 shadow-xl">
                  <KeyRound className="h-8 w-8 text-white" />
                </div>
              </div>
            </motion.div>

            <motion.h1
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className="font-display text-5xl font-black tracking-tight text-[#2C2416] drop-shadow-sm"
            >
              La Gazette de la Vie
            </motion.h1>

            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.4 }}
              className="mt-4 flex items-center justify-center gap-3"
            >
              <div className="h-px w-16 bg-gradient-to-r from-transparent to-[#8b7355]" />
              <svg className="h-3 w-3 text-[#8b7355]" viewBox="0 0 20 20" fill="currentColor">
                <path d="M10 2 L12 6 L17 7 L13.5 10.5 L14.5 16 L10 13.5 L5.5 16 L6.5 10.5 L3 7 L8 6 Z" />
              </svg>
              <div className="h-px w-16 bg-gradient-to-l from-transparent to-[#8b7355]" />
            </motion.div>

            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.5 }}
              className="mt-4 font-serif text-lg text-[#5C4033]"
            >
              {slug}
            </motion.p>
          </div>

          {/* Password form card */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.6 }}
            className="relative overflow-hidden rounded-lg border-2 border-[#8b7355]/30 bg-white/95 shadow-2xl backdrop-blur-sm"
          >
            {/* Decorative elements */}
            <div className="absolute left-0 top-0 h-1 w-full bg-gradient-to-r from-[#C9A227] via-[#8b7355] to-[#C9A227]" />

            <div className="p-8">
              <form onSubmit={handlePasswordSubmit} className="space-y-6">
                <div className="space-y-2">
                  <Label
                    htmlFor="password"
                    className="font-serif text-sm font-medium text-[#2C2416]"
                  >
                    Mot de passe
                  </Label>
                  <div className="relative">
                    <Input
                      id="password"
                      type="password"
                      placeholder="Entrez le mot de passe"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      required
                      disabled={isLoading}
                      className="border-[#8b7355]/30 bg-[#faf8f3] font-serif placeholder:text-[#8b7355]/40 focus:border-[#C9A227] focus:ring-[#C9A227]"
                    />
                  </div>
                </div>

                <Button
                  type="submit"
                  disabled={isLoading}
                  className="w-full bg-gradient-to-r from-[#C9A227] to-[#8b7355] font-serif text-base font-medium text-white shadow-md transition-all hover:shadow-xl disabled:opacity-50"
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Vérification...
                    </>
                  ) : (
                    "Accéder à la gazette"
                  )}
                </Button>
              </form>
            </div>

            {/* Bottom decorative border */}
            <div className="h-2 bg-gradient-to-r from-[#8b7355]/10 via-[#C9A227]/20 to-[#8b7355]/10" />
          </motion.div>

          {/* Footer text */}
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.8 }}
            className="mt-6 text-center font-serif text-sm text-[#8b7355]/70"
          >
            Cette gazette est protégée par mot de passe
          </motion.p>
        </motion.div>
      </div>
    );
  }

  if (!isAuthenticated && !needsPassword) {
    // Loading state
    return (
      <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-[#f5f1e8] via-[#faf8f3] to-[#f0e9d8]">
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-center">
          <Loader2 className="mx-auto h-12 w-12 animate-spin text-[#C9A227]" />
          <p className="mt-4 font-serif text-lg text-[#5C4033]">Chargement de la gazette...</p>
        </motion.div>
      </div>
    );
  }

  if (!gazetteData) {
    return null;
  }

  return (
    <AnimatePresence mode="wait">
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.5 }}
      >
        <GazetteViewer data={gazetteData} />
      </motion.div>
    </AnimatePresence>
  );
}
