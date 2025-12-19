import { useEffect, useMemo, useRef, useState } from "react";
import type { CanvasElement } from "@/types/editor";
import { api, parseApiError } from "@/lib/api";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Textarea } from "@/components/ui/textarea";

type AnimationSuggestion = {
  id: string;
  title: string;
  description: string;
  prompt: string;
};

type AnalyzeResponse = {
  imageId: string;
  sceneDescription?: string;
  suggestions?: Array<{ id?: string; description: string; prompt: string }>;
};

type AnimationDialogProps = {
  open: boolean;
  element: CanvasElement | null;
  onOpenChange: (open: boolean) => void;
  onSavePrompt: (elementId: string, prompt: string) => Promise<void> | void;
};

const MAX_PROMPT_LENGTH = 200;
const DEFAULT_SUGGESTIONS: AnimationSuggestion[] = [
  {
    id: "suggestion-1",
    title: "Dancing a slow waltz together",
    description: "Add a gentle sway with subtle movement in the background.",
    prompt: "Animate the couple gently waltzing together with soft, nostalgic motion.",
  },
  {
    id: "suggestion-2",
    title: "A warm breeze through the scene",
    description: "Introduce soft motion in hair, clothing, and background light.",
    prompt: "Create a calm breeze that moves hair and fabric with warm afternoon light.",
  },
  {
    id: "suggestion-3",
    title: "Cinematic slow zoom",
    description: "Add a subtle camera push-in with a touch of film grain.",
    prompt: "Apply a slow cinematic zoom with faint film grain for a timeless feel.",
  },
];

export function AnimationDialog({
  open,
  element,
  onOpenChange,
  onSavePrompt,
}: AnimationDialogProps) {
  const [sceneDescription, setSceneDescription] = useState<string | null>(null);
  const [suggestions, setSuggestions] = useState<AnimationSuggestion[]>(DEFAULT_SUGGESTIONS);
  const [promptText, setPromptText] = useState("");
  const [selectedSuggestionId, setSelectedSuggestionId] = useState<string>(
    DEFAULT_SUGGESTIONS[0]?.id ?? ""
  );
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const seededPromptRef = useRef(false);

  const imageUrl = element?.imageUrl ?? null;
  const hasElement = Boolean(element?.id);
  const promptCount = promptText.length;
  const canSave = hasElement && promptText.trim().length > 0 && !isSaving;

  useEffect(() => {
    if (!open) {
      setSceneDescription(null);
      setSuggestions(DEFAULT_SUGGESTIONS);
      setPromptText("");
      setSelectedSuggestionId(DEFAULT_SUGGESTIONS[0]?.id ?? "");
      setIsLoading(false);
      setIsSaving(false);
      setErrorMessage(null);
      seededPromptRef.current = false;
      return;
    }

    setErrorMessage(null);
    setPromptText(element?.animationPrompt ?? "");
    setSelectedSuggestionId(DEFAULT_SUGGESTIONS[0]?.id ?? "");
    seededPromptRef.current = false;
  }, [open, element?.id, element?.animationPrompt]);

  useEffect(() => {
    if (!open) return;

    const imageId = element?.imageId;
    if (!imageId) {
      setIsLoading(false);
      setErrorMessage("This image is not ready for analysis yet.");
      setSceneDescription(null);
      setSuggestions(DEFAULT_SUGGESTIONS);
      return;
    }

    let cancelled = false;
    const fetchSuggestions = async () => {
      setIsLoading(true);
      setErrorMessage(null);
      try {
        const data = await api.post(`images/${imageId}/analyze`).json<AnalyzeResponse>();
        if (cancelled) return;
        const mappedSuggestions = (data.suggestions ?? []).slice(0, 3).map((item, index) => ({
          id: item.id ?? `api-${index}`,
          title: item.description,
          description: item.prompt,
          prompt: item.prompt,
        }));
        const nextSuggestions =
          mappedSuggestions.length > 0 ? mappedSuggestions : DEFAULT_SUGGESTIONS;
        setSceneDescription(data.sceneDescription ?? null);
        setSuggestions(nextSuggestions);
        if (!seededPromptRef.current) {
          const existing = element?.animationPrompt?.trim();
          if (existing) {
            setPromptText(existing);
            const match = nextSuggestions.find((item) => item.prompt === existing);
            setSelectedSuggestionId(match?.id ?? nextSuggestions[0]?.id ?? "");
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
        setSceneDescription(null);
        setSuggestions(DEFAULT_SUGGESTIONS);
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

  const handleSelectSuggestion = (value: string) => {
    setSelectedSuggestionId(value);
    const suggestion = suggestions.find((item) => item.id === value);
    if (suggestion) {
      setPromptText(suggestion.prompt);
    }
  };

  const handleSave = async () => {
    if (!canSave || !element?.id) return;
    setIsSaving(true);
    setErrorMessage(null);
    try {
      await onSavePrompt(element.id, promptText.trim());
      onOpenChange(false);
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : "Unable to save prompt.");
    } finally {
      setIsSaving(false);
    }
  };

  const selectedSuggestion = useMemo(
    () => suggestions.find((item) => item.id === selectedSuggestionId) ?? null,
    [suggestions, selectedSuggestionId]
  );

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-[700px] rounded-[8px] border-sepia/30 bg-parchment shadow-2xl">
        <DialogHeader className="space-y-1">
          <DialogTitle>Animation Suggestions</DialogTitle>
        </DialogHeader>

        <div className="grid gap-6 md:grid-cols-[220px_1fr]">
          <div className="space-y-4">
            <div className="h-[300px] w-[200px] overflow-hidden rounded-[8px] border border-sepia/20 bg-cream/70 shadow-sm">
              {imageUrl ? (
                <img
                  src={imageUrl}
                  alt="Selected"
                  className="h-full w-full object-cover sepia-vintage"
                />
              ) : (
                <div className="flex h-full items-center justify-center text-xs text-muted">
                  No image available
                </div>
              )}
            </div>
          </div>

          <div className="space-y-5">
            <div className="space-y-2 rounded-[8px] border border-sepia/20 bg-cream/70 p-4">
              <div className="flex items-center gap-2 text-sm font-semibold text-ink">
                <span aria-hidden="true">🔍</span>
                AI Analysis
              </div>
              {isLoading ? (
                <div className="space-y-2">
                  <div className="h-3 w-3/4 rounded-sm bg-sepia/20" />
                  <div className="h-3 w-full rounded-sm bg-sepia/10" />
                  <div className="h-3 w-2/3 rounded-sm bg-sepia/10" />
                </div>
              ) : sceneDescription ? (
                <p className="text-sm text-ink">{sceneDescription}</p>
              ) : (
                <p className="text-sm text-muted">
                  {errorMessage
                    ? "We could not analyze this image yet."
                    : "Upload an image to receive AI analysis."}
                </p>
              )}
            </div>

            <div className="space-y-3">
              <div className="text-sm font-semibold text-ink">Suggestions</div>
              <RadioGroup value={selectedSuggestionId} onValueChange={handleSelectSuggestion}>
                <div className="space-y-3">
                  {suggestions.map((suggestion) => {
                    const isSelected = suggestion.id === selectedSuggestionId;
                    return (
                      <label
                        key={suggestion.id}
                        htmlFor={suggestion.id}
                        className={cn(
                          "flex cursor-pointer gap-3 rounded-[8px] border border-sepia/20 bg-cream/60 p-3 transition",
                          isSelected && "border-gold bg-parchment"
                        )}
                      >
                        <RadioGroupItem id={suggestion.id} value={suggestion.id} />
                        <div className="space-y-1">
                          <div className="text-sm font-semibold text-ink">{suggestion.title}</div>
                          <p className="text-xs text-muted">{suggestion.description}</p>
                        </div>
                      </label>
                    );
                  })}
                </div>
              </RadioGroup>
              {selectedSuggestion ? (
                <p className="text-xs text-muted">
                  {selectedSuggestion.description || selectedSuggestion.prompt}
                </p>
              ) : null}
            </div>

            <div className="space-y-2 rounded-[8px] border border-sepia/20 bg-cream/70 p-4">
              <Label htmlFor="custom-prompt" className="text-sm font-semibold text-ink">
                Or write your own:
              </Label>
              <Textarea
                id="custom-prompt"
                rows={4}
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
                className="bg-parchment/80"
              />
              <div className="flex items-center justify-between text-xs text-muted">
                <span>Edit freely or paste your own animation idea.</span>
                <span>
                  {promptCount}/{MAX_PROMPT_LENGTH}
                </span>
              </div>
            </div>

            {errorMessage ? (
              <div className="rounded-[8px] border border-aged-red/40 bg-white/60 p-3 text-xs text-aged-red">
                {errorMessage}
              </div>
            ) : null}
          </div>
        </div>

        <DialogFooter className="sm:justify-between">
          <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button
            type="button"
            onClick={handleSave}
            disabled={!canSave}
            className="bg-gold text-ink hover:bg-gold/90"
          >
            {isSaving ? "Saving..." : "Save & Continue"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
