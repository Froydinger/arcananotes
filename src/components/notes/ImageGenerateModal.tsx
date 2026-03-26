import { useState, useMemo } from "react";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Sparkles, X, Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface ImageGenerateModalProps {
  isOpen: boolean;
  onClose: () => void;
  onImageGenerated: (imageUrl: string) => void;
}

const MAX_CHARS = 300;

const STYLE_CHIPS = [
  "Photorealistic",
  "Watercolor painting",
  "Digital illustration",
  "Pencil sketch",
  "Oil painting",
  "Minimalist flat",
  "Cinematic lighting",
  "Dreamy & ethereal",
  "Dark & moody",
  "Vibrant pop art",
];

export function ImageGenerateModal({ isOpen, onClose, onImageGenerated }: ImageGenerateModalProps) {
  const [prompt, setPrompt] = useState("");
  const [activeChips, setActiveChips] = useState<string[]>([]);
  const [isGenerating, setIsGenerating] = useState(false);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);

  const charsLeft = useMemo(() => Math.max(0, MAX_CHARS - prompt.length), [prompt]);

  const toggleChip = (chip: string) => {
    setActiveChips(prev =>
      prev.includes(chip) ? prev.filter(c => c !== chip) : [...prev, chip]
    );
  };

  const buildPrompt = () => {
    const parts = [prompt.trim()];
    const chips = activeChips.filter(c => !prompt.toLowerCase().includes(c.toLowerCase()));
    if (chips.length) parts.push(chips.join(", "));
    return parts.filter(Boolean).join(". ").slice(0, MAX_CHARS);
  };

  const handleGenerate = async () => {
    const fullPrompt = buildPrompt();
    if (!fullPrompt) {
      toast.error("Describe what image you'd like to create");
      return;
    }

    setIsGenerating(true);
    setPreviewUrl(null);

    try {
      const { data, error } = await supabase.functions.invoke("generate-image", {
        body: { prompt: fullPrompt },
      });

      if (error) throw error;
      if (data?.pro_required) {
        toast.error("Image generation requires a Pro subscription");
        return;
      }
      if (data?.error) throw new Error(data.error);
      if (data?.image_url) {
        setPreviewUrl(data.image_url);
      }
    } catch (err: any) {
      console.error("Image generation failed:", err);
      toast.error(err.message || "Failed to generate image");
    } finally {
      setIsGenerating(false);
    }
  };

  const handleInsert = () => {
    if (previewUrl) {
      onImageGenerated(previewUrl);
      handleReset();
      onClose();
    }
  };

  const handleReset = () => {
    setPrompt("");
    setActiveChips([]);
    setPreviewUrl(null);
  };

  const handleClose = () => {
    handleReset();
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="w-[95vw] max-w-lg p-0 gap-0 overflow-hidden border-border/50 mx-auto [&>button]:hidden">
        <div className="flex flex-col max-h-[85vh] overflow-hidden">
          {/* Header */}
          <div className="relative px-5 pt-5 pb-3 border-b border-border/30">
            <button
              onClick={handleClose}
              className="absolute right-3 top-3 rounded-full p-2 hover:bg-muted/50 transition-colors"
            >
              <X className="h-4 w-4" />
            </button>

            <div className="flex items-center gap-3 mb-1">
              <div className="p-2 rounded-full bg-primary/10">
                <Sparkles className="h-4 w-4 text-primary" />
              </div>
              <h2 className="text-lg font-semibold">Generate Image</h2>
            </div>
            <p className="text-xs text-muted-foreground">
              Describe what you'd like — AI will create it for your note
            </p>
          </div>

          {/* Body */}
          <div className="flex-1 overflow-y-auto p-5 space-y-4">
            {/* Preview */}
            {previewUrl && (
              <div className="rounded-xl overflow-hidden border border-border/50 bg-muted/20">
                <img
                  src={previewUrl}
                  alt="Generated preview"
                  className="w-full h-auto max-h-[300px] object-contain"
                />
              </div>
            )}

            {/* Generating placeholder */}
            {isGenerating && (
              <div className="rounded-xl border border-border/50 bg-muted/20 flex items-center justify-center py-16">
                <div className="flex flex-col items-center gap-3">
                  <Loader2 className="h-8 w-8 animate-spin text-primary" />
                  <p className="text-sm text-muted-foreground">Creating your image…</p>
                </div>
              </div>
            )}

            {/* Style chips */}
            {!previewUrl && (
              <div>
                <label className="text-xs font-medium text-muted-foreground mb-2 block">Style</label>
                <div className="flex flex-wrap gap-1.5">
                  {STYLE_CHIPS.map(chip => {
                    const active = activeChips.includes(chip);
                    return (
                      <button
                        key={chip}
                        type="button"
                        onClick={() => toggleChip(chip)}
                        disabled={isGenerating}
                        className={`px-2.5 py-1 rounded-full text-xs font-medium transition-all ${
                          active
                            ? "bg-primary text-primary-foreground shadow-sm"
                            : "bg-muted/80 hover:bg-muted text-foreground/70 hover:text-foreground"
                        }`}
                      >
                        {chip}
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Prompt input */}
            {!previewUrl && (
              <div>
                <label className="text-xs font-medium text-muted-foreground mb-2 block">Describe your image</label>
                <Textarea
                  value={prompt}
                  onChange={e => setPrompt(e.target.value.slice(0, MAX_CHARS))}
                  onKeyDown={e => {
                    if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) {
                      e.preventDefault();
                      handleGenerate();
                    }
                  }}
                  placeholder="e.g., A cozy cabin in a snowy forest at dusk with warm light glowing from the windows…"
                  className="min-h-[80px] resize-none text-[16px] bg-background border-border/50 focus-visible:ring-primary/50"
                  style={{ fontSize: "16px" }}
                  disabled={isGenerating}
                />
                <div className="mt-1.5 flex items-center justify-between text-xs text-muted-foreground">
                  <span>⌘↵ to generate</span>
                  <span className={charsLeft < 30 ? "text-destructive" : ""}>{charsLeft} left</span>
                </div>
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="px-5 py-3 border-t border-border/30 bg-muted/10">
            <div className="flex items-center justify-end gap-2">
              {previewUrl ? (
                <>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      setPreviewUrl(null);
                    }}
                    disabled={isGenerating}
                  >
                    Try again
                  </Button>
                  <Button size="sm" onClick={handleInsert} className="bg-primary hover:bg-primary/90">
                    Insert into note
                  </Button>
                </>
              ) : (
                <>
                  <Button variant="outline" size="sm" onClick={handleClose} disabled={isGenerating}>
                    Cancel
                  </Button>
                  <Button
                    size="sm"
                    onClick={handleGenerate}
                    disabled={isGenerating || (!prompt.trim() && activeChips.length === 0)}
                    className="bg-primary hover:bg-primary/90"
                  >
                    {isGenerating ? (
                      <>
                        <Loader2 className="h-4 w-4 mr-1.5 animate-spin" />
                        Generating…
                      </>
                    ) : (
                      <>
                        <Sparkles className="h-4 w-4 mr-1.5" />
                        Generate
                      </>
                    )}
                  </Button>
                </>
              )}
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
