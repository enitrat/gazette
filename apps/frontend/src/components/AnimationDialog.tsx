import { useEffect, useMemo, useRef, useState } from "react";
import { Loader2, Sparkles } from "lucide-react";
import type { CanvasElement } from "@/types/editor";
import { api, parseApiError } from "@/lib/api";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Card, CardContent } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

type AnimationSuggestion = {
  id: string;
  description: string;
  prompt: string;
};

type AnalyzeResponse = {
  imageId: string;
  sceneDescription?: string;
  suggestions?: AnimationSuggestion[];
};

type AnimationDialogProps = {
  open: boolean;
  element: CanvasElement | null;
  onOpenChange: (open: boolean) => void;
  onSavePrompt: (elementId: string, prompt: string) => Promise<void> | void;
};

const MAX_PROMPT_LENGTH = 200;
const SKELETON_CARDS = Array.from({ length: 3 });

export function AnimationDialog({
  open,
  element,
  onOpenChange,
  onSavePrompt,
}: AnimationDialogProps) {
  const [sceneDescription, setSceneDescription] = useState<string | null>(null);
  const [suggestions, setSuggestions] = useState<AnimationSuggestion[]>([]);
  const [promptText, setPromptText] = useState("");
  const [selectedSuggestionId, setSelectedSuggestionId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const seededPromptRef = useRef(false);

  const imageUrl = element?.imageUrl ?? null;
  const hasElement = Boolean(element?.id);

  const promptCount = promptText.length;
  const canSave = hasElement && promptText.trim().length > 0 && !isSaving;

  const selectedSuggestion = useMemo(
    () => suggestions.find((item) => item.id === selectedSuggestionId) ?? null,
    [suggestions, selectedSuggestionId]
  );

  useEffect(() => {
    if (!open) {
      setSceneDescription(null);
      setSuggestions([]);
      setPromptText("");
      setSelectedSuggestionId(null);
      setIsLoading(false);
      setIsSaving(false);
      setErrorMessage(null);
      seededPromptRef.current = false;
      return;
    }

    setErrorMessage(null);
    setPromptText(element?.animationPrompt ?? "");
    setSelectedSuggestionId(null);
    seededPromptRef.current = false;
  }, [open, element?.id, element?.animationPrompt]);

  useEffect(() => {
    if (!open) return;

    const imageId = element?.imageId;
    if (!imageId) {
      setIsLoading(false);
      setErrorMessage("This image is not ready for analysis yet.");
      setSuggestions([]);
      setSceneDescription(null);
      return;
    }

    let cancelled = false;
    const fetchSuggestions = async () => {
      setIsLoading(true);
      setErrorMessage(null);
      try {
        const data = await api.post(`images/${imageId}/analyze`).json<AnalyzeResponse>();
        if (cancelled) return;
        const nextSuggestions = Array.isArray(data.suggestions) ? data.suggestions : [];
        setSceneDescription(data.sceneDescription ?? null);
        setSuggestions(nextSuggestions);
        if (!seededPromptRef.current) {
          const existing = element?.animationPrompt?.trim();
          if (existing) {
            setPromptText(existing);
            const match = nextSuggestions.find((item) => item.prompt === existing);
            setSelectedSuggestionId(match?.id ?? null);
          } else if (nextSuggestions[0]?.prompt) {
            setPromptText(nextSuggestions[0].prompt);
            setSelectedSuggestionId(nextSuggestions[0].id);
          }
          seededPromptRef.current = true;
        }
      } catch (error) {
        if (cancelled) return;
        const parsed = await parseApiError(error);
        setErrorMessage(parsed.message);
        setSuggestions([]);
        setSceneDescription(null);
      } finally {
        if (!cancelled) {
          setIsLoading(false);
        }
      }
    };

    void fetchSuggestions();
    return () => {
      cancelled = true;
    };
  }, [open, element?.imageId, element?.animationPrompt]);

  const handleSelectSuggestion = (suggestion: AnimationSuggestion) => {
    setSelectedSuggestionId(suggestion.id);
    setPromptText(suggestion.prompt);
  };

  const applyPrompt = async (prompt: string) => {
    if (!element?.id) return;
    setIsSaving(true);
    setErrorMessage(null);
    try {
      await onSavePrompt(element.id, prompt.trim());
      onOpenChange(false);
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : "Unable to save prompt.");
    } finally {
      setIsSaving(false);
    }
  };

  const handleSave = async () => {
    if (!canSave) return;
    await applyPrompt(promptText);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-5xl border-sepia/30 bg-parchment">
        <DialogHeader className="space-y-2">
          <DialogTitle className="text-ink-effect">Animation Suggestions</DialogTitle>
          <DialogDescription>
            Pick an AI suggestion or craft a custom prompt to guide the animation.
          </DialogDescription>
        </DialogHeader>

        <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.2fr)]">
          <div className="space-y-4">
            <Card className="border-sepia/30 bg-cream/70">
              <CardContent className="space-y-3 p-4">
                <div className="text-xs font-ui uppercase tracking-[0.2em] text-muted">
                  AI analysis
                </div>
                <div className="grid gap-3 sm:grid-cols-[140px_1fr]">
                  <div className="aspect-square w-full overflow-hidden rounded-sm border border-sepia/30 bg-parchment">
                    {imageUrl ? (
                      <img
                        src={imageUrl}
                        alt="Selected"
                        className="h-full w-full object-cover sepia-vintage"
                      />
                    ) : (
                      <div className="flex h-full items-center justify-center text-xs text-muted">
                        No image
                      </div>
                    )}
                  </div>
                  <div className="space-y-2 text-sm text-ink">
                    {isLoading ? (
                      <div className="space-y-2">
                        <div className="h-3 w-3/4 rounded-sm bg-sepia/20" />
                        <div className="h-3 w-full rounded-sm bg-sepia/10" />
                        <div className="h-3 w-2/3 rounded-sm bg-sepia/10" />
                      </div>
                    ) : sceneDescription ? (
                      <p className="font-body text-sm text-ink">{sceneDescription}</p>
                    ) : (
                      <p className="text-sm text-muted">
                        {errorMessage
                          ? "We could not analyze this image yet."
                          : "Upload an image to receive suggestions."}
                      </p>
                    )}
                  </div>
                </div>
                {errorMessage ? (
                  <div className="rounded-sm border border-aged-red/40 bg-white/70 p-3 text-xs text-aged-red">
                    {errorMessage}
                  </div>
                ) : null}
              </CardContent>
            </Card>
          </div>

          <div className="space-y-4">
            <div className="space-y-2">
              <div className="flex items-center gap-2 text-sm font-semibold text-ink">
                <Sparkles className="h-4 w-4 text-gold" />
                Choose an animation style
              </div>
              <p className="text-xs text-muted">
                Select a suggestion to populate the prompt, then adjust as needed.
              </p>
            </div>

            <div className="space-y-3">
              {isLoading
                ? SKELETON_CARDS.map((_, index) => (
                    <Card
                      key={`skeleton-${index}`}
                      className="border-sepia/20 bg-cream/60 shadow-none"
                    >
                      <CardContent className="space-y-2 p-4">
                        <div className="h-3 w-2/3 rounded-sm bg-sepia/20" />
                        <div className="h-3 w-full rounded-sm bg-sepia/10" />
                        <div className="h-3 w-4/5 rounded-sm bg-sepia/10" />
                      </CardContent>
                    </Card>
                  ))
                : suggestions.map((suggestion) => {
                    const isSelected = selectedSuggestionId === suggestion.id;
                    return (
                      <Card
                        key={suggestion.id}
                        className={cn(
                          "cursor-pointer border-sepia/20 bg-cream/60 shadow-none transition hover:border-gold/60 hover:bg-parchment/80",
                          isSelected && "border-gold ring-2 ring-gold/30"
                        )}
                        onClick={() => handleSelectSuggestion(suggestion)}
                      >
                        <CardContent className="space-y-2 p-4">
                          <div className="flex flex-wrap items-center justify-between gap-2">
                            <div className="text-sm font-semibold text-ink">
                              {suggestion.description}
                            </div>
                            <Button
                              type="button"
                              size="sm"
                              variant="outline"
                              onClick={(event) => {
                                event.stopPropagation();
                                void applyPrompt(suggestion.prompt);
                              }}
                            >
                              Use this
                            </Button>
                          </div>
                          <p className="text-xs text-muted">{suggestion.prompt}</p>
                        </CardContent>
                      </Card>
                    );
                  })}

              {!isLoading && suggestions.length === 0 ? (
                <div className="rounded-sm border border-sepia/20 bg-cream/70 p-4 text-xs text-muted">
                  No AI suggestions were returned. Write a custom prompt below to continue.
                </div>
              ) : null}
            </div>

            <div className="space-y-2 rounded-sm border border-sepia/20 bg-cream/70 p-4">
              <Label htmlFor="animation-prompt" className="text-sm font-semibold text-ink">
                Animation prompt
              </Label>
              <Textarea
                id="animation-prompt"
                value={promptText}
                placeholder={
                  selectedSuggestion
                    ? selectedSuggestion.prompt
                    : "Describe the motion you want to see in this image..."
                }
                onChange={(event) => {
                  const nextValue = event.target.value.slice(0, MAX_PROMPT_LENGTH);
                  setPromptText(nextValue);
                }}
                className="min-h-[110px] bg-parchment/80"
              />
              <div className="flex items-center justify-between text-xs text-muted">
                <span>Edit freely or paste your own animation idea.</span>
                <span>
                  {promptCount}/{MAX_PROMPT_LENGTH}
                </span>
              </div>
            </div>
          </div>
        </div>

        <DialogFooter className="sm:justify-between">
          <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button type="button" onClick={handleSave} disabled={!canSave}>
            {isSaving ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Saving...
              </>
            ) : (
              "Save prompt"
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
