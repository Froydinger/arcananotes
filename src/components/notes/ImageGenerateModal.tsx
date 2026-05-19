import { useState, useMemo, useRef, useEffect } from "react";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Sparkles, X, Loader2, Wand2, Check, RotateCcw, Pencil } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface ImageGenerateModalProps {
  isOpen: boolean;
  onClose: () => void;
  onImageGenerated: (imageUrl: string) => void;
  initialPrompt?: string;
}

const MAX_CHARS = 300;

const STYLE_CHIPS = [
  "Photorealistic",
  "Watercolor",
  "Digital art",
  "Pencil sketch",
  "Oil painting",
  "Minimalist",
  "Cinematic",
  "Dreamy",
  "Dark & moody",
  "Pop art",
];

const ASPECT_RATIOS: { label: string; value: string }[] = [
  { label: "Square", value: "1:1" },
  { label: "Landscape", value: "16:9" },
  { label: "Portrait", value: "9:16" },
  { label: "4:3", value: "4:3" },
  { label: "3:2", value: "3:2" },
];

type ModalPhase = "prompt" | "generating" | "preview" | "editing" | "editing-generating";

export function ImageGenerateModal({ isOpen, onClose, onImageGenerated, initialPrompt = "" }: ImageGenerateModalProps) {
  const [prompt, setPrompt] = useState("");
  const [activeChips, setActiveChips] = useState<string[]>([]);
  const [aspectRatio, setAspectRatio] = useState<string>("1:1");
  const [phase, setPhase] = useState<ModalPhase>("prompt");
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [editInstruction, setEditInstruction] = useState("");
  const [shimmer, setShimmer] = useState(false);
  const editInputRef = useRef<HTMLInputElement>(null);

  // Seed prompt from initialPrompt when modal opens
  useEffect(() => {
    if (isOpen && initialPrompt) {
      setPrompt(initialPrompt);
    }
  }, [isOpen, initialPrompt]);

  const charsLeft = useMemo(() => Math.max(0, MAX_CHARS - prompt.length), [prompt]);

  // Focus edit input when entering edit mode
  useEffect(() => {
    if (phase === "editing") {
      setTimeout(() => editInputRef.current?.focus(), 200);
    }
  }, [phase]);

  // Shimmer effect on new image
  useEffect(() => {
    if (phase === "preview") {
      setShimmer(true);
      const t = setTimeout(() => setShimmer(false), 1200);
      return () => clearTimeout(t);
    }
  }, [phase, previewUrl]);

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
    setPhase("generating");

    try {
      const { data, error } = await supabase.functions.invoke("generate-image", {
        body: { prompt: fullPrompt, aspect_ratio: aspectRatio },
      });
      if (error) throw error;
      if (data?.error) { toast.error(data.error); setPhase("prompt"); return; }
      if (data?.image_url) {
        setPreviewUrl(data.image_url);
        setPhase("preview");
      }
    } catch (err: any) {
      console.error("Image generation failed:", err);
      toast.error(err.message || "Failed to generate image");
      setPhase("prompt");
    }
  };

  const handleEdit = async () => {
    if (!editInstruction.trim() || !previewUrl) return;
    setPhase("editing-generating");

    try {
      const { data, error } = await supabase.functions.invoke("generate-image", {
        body: {
          prompt: editInstruction.trim(),
          edit_instruction: editInstruction.trim(),
          source_image_url: previewUrl,
          aspect_ratio: aspectRatio,
        },
      });
      if (error) throw error;
      if (data?.error) throw new Error(data.error);
      if (data?.image_url) {
        setPreviewUrl(data.image_url);
        setEditInstruction("");
        setPhase("preview");
      }
    } catch (err: any) {
      console.error("Image edit failed:", err);
      toast.error(err.message || "Failed to edit image");
      setPhase("editing");
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
    setEditInstruction("");
    setPhase("prompt");
  };

  const handleClose = () => {
    handleReset();
    onClose();
  };

  const isGenerating = phase === "generating" || phase === "editing-generating";

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="w-[95vw] max-w-md p-0 gap-0 overflow-hidden border-border/40 mx-auto [&>button]:hidden bg-background/95 backdrop-blur-xl">
        <div className="flex flex-col max-h-[85vh] overflow-hidden">
          {/* Header with animated gradient line */}
          <div className="relative">
            <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-transparent via-accent to-transparent opacity-60 animate-pulse" />
            <div className="px-5 pt-5 pb-3">
              <button
                onClick={handleClose}
                className="absolute right-3 top-3 rounded-full p-2 hover:bg-accent/15 hover:text-accent transition-all duration-200 z-10"
              >
                <X className="h-4 w-4" />
              </button>

              <div className="flex items-center gap-3 mb-1">
                <div className="relative p-2.5 rounded-xl bg-accent/10 border border-accent/20">
                  <Sparkles className="h-4 w-4 text-accent" />
                  <div className="absolute inset-0 rounded-xl bg-accent/5 animate-pulse" />
                </div>
                <div>
                  <h2 className="text-base font-semibold text-foreground">
                    {phase === "editing" || phase === "editing-generating" ? "Edit Image" : "Generate Image"}
                  </h2>
                  <p className="text-[11px] text-muted-foreground">
                    {phase === "editing" || phase === "editing-generating"
                      ? "Describe what to change"
                      : "AI-powered image creation"}
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Body */}
          <div className="flex-1 overflow-y-auto px-5 pb-4 space-y-4">
            {/* Image preview area */}
            {(phase === "preview" || phase === "editing" || phase === "editing-generating") && previewUrl && (
              <div
                className={`relative rounded-xl overflow-hidden border border-border/40 transition-all duration-700 ${
                  shimmer ? "shadow-[0_0_30px_-5px_hsl(var(--accent)/0.3)]" : "shadow-sm"
                }`}
              >
                <img
                  src={previewUrl}
                  alt="Generated"
                  className={`w-full h-auto max-h-[280px] object-contain transition-all duration-700 ${
                    shimmer ? "scale-[1.02]" : "scale-100"
                  }`}
                />
                {/* Shimmer overlay */}
                {shimmer && (
                  <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent animate-[shimmer_1.2s_ease-in-out]" />
                )}
                {/* Editing overlay */}
                {phase === "editing-generating" && (
                  <div className="absolute inset-0 bg-background/60 backdrop-blur-sm flex items-center justify-center">
                    <div className="flex flex-col items-center gap-3">
                      <div className="relative">
                        <Wand2 className="h-7 w-7 text-accent animate-pulse" />
                        <div className="absolute inset-0 animate-spin" style={{ animationDuration: '3s' }}>
                          <Sparkles className="h-3 w-3 text-accent/50 absolute -top-1 -right-1" />
                        </div>
                      </div>
                      <p className="text-xs text-muted-foreground">Applying edits…</p>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Generating state */}
            {phase === "generating" && (
              <div className="rounded-xl border border-accent/20 bg-accent/5 flex items-center justify-center py-20">
                <div className="flex flex-col items-center gap-4">
                  <div className="relative">
                    <div className="h-12 w-12 rounded-full border-2 border-accent/30 border-t-accent animate-spin" />
                    <Sparkles className="h-5 w-5 text-accent absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2" />
                  </div>
                  <div className="text-center">
                    <p className="text-sm font-medium text-foreground">Creating your image</p>
                    <p className="text-xs text-muted-foreground mt-1">This may take a few seconds…</p>
                  </div>
                </div>
              </div>
            )}

            {/* Edit input */}
            {(phase === "editing" || phase === "editing-generating") && (
              <div className="flex gap-2">
                <Input
                  ref={editInputRef}
                  value={editInstruction}
                  onChange={e => setEditInstruction(e.target.value)}
                  onKeyDown={e => {
                    if (e.key === "Enter" && !e.shiftKey) {
                      e.preventDefault();
                      handleEdit();
                    }
                    if (e.key === "Escape") setPhase("preview");
                  }}
                  placeholder="e.g., Make the sky more dramatic…"
                  disabled={phase === "editing-generating"}
                  className="flex-1 rounded-lg text-sm bg-muted/30 border-border/40 focus-visible:ring-accent/50"
                />
                <Button
                  size="sm"
                  onClick={handleEdit}
                  disabled={!editInstruction.trim() || phase === "editing-generating"}
                  className="bg-accent hover:bg-accent/90 rounded-lg px-3 shrink-0"
                >
                  {phase === "editing-generating" ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Wand2 className="h-4 w-4" />
                  )}
                </Button>
              </div>
            )}

            {/* Style chips - prompt phase only */}
            {phase === "prompt" && (
              <div>
                <label className="text-[11px] font-medium text-muted-foreground mb-2 block uppercase tracking-wider">Style</label>
                <div className="flex flex-wrap gap-1.5">
                  {STYLE_CHIPS.map(chip => {
                    const active = activeChips.includes(chip);
                    return (
                      <button
                        key={chip}
                        type="button"
                        onClick={() => toggleChip(chip)}
                        className={`px-2.5 py-1 rounded-full text-xs font-medium transition-all duration-200 ${
                          active
                            ? "bg-accent text-accent-foreground shadow-[0_0_12px_-3px_hsl(var(--accent)/0.5)]"
                            : "bg-muted/60 hover:bg-muted text-muted-foreground hover:text-foreground"
                        }`}
                      >
                        {chip}
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Aspect ratio - prompt phase only */}
            {phase === "prompt" && (
              <div>
                <label className="text-[11px] font-medium text-muted-foreground mb-2 block uppercase tracking-wider">Aspect ratio</label>
                <div className="flex flex-wrap gap-1.5">
                  {ASPECT_RATIOS.map(r => {
                    const active = aspectRatio === r.value;
                    return (
                      <button
                        key={r.value}
                        type="button"
                        onClick={() => setAspectRatio(r.value)}
                        className={`px-2.5 py-1 rounded-full text-xs font-medium transition-all duration-200 ${
                          active
                            ? "bg-accent text-accent-foreground shadow-[0_0_12px_-3px_hsl(var(--accent)/0.5)]"
                            : "bg-muted/60 hover:bg-muted text-muted-foreground hover:text-foreground"
                        }`}
                      >
                        {r.label} <span className="opacity-60">{r.value}</span>
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Prompt input - prompt phase only */}
            {phase === "prompt" && (
              <div>
                <label className="text-[11px] font-medium text-muted-foreground mb-2 block uppercase tracking-wider">Describe your image</label>
                <Textarea
                  value={prompt}
                  onChange={e => setPrompt(e.target.value.slice(0, MAX_CHARS))}
                  onKeyDown={e => {
                    if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) {
                      e.preventDefault();
                      handleGenerate();
                    }
                  }}
                  placeholder="A cozy cabin in a snowy forest at dusk with warm light from the windows…"
                  className="min-h-[80px] resize-none text-[16px] bg-muted/20 border-border/40 focus-visible:ring-accent/50 rounded-xl"
                  style={{ fontSize: "16px" }}
                />
                <div className="mt-1.5 flex items-center justify-between text-[11px] text-muted-foreground">
                  <span className="opacity-60">⌘↵ to generate</span>
                  <span className={charsLeft < 30 ? "text-destructive" : "opacity-60"}>{charsLeft}</span>
                </div>
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="px-5 py-3 border-t border-border/30">
            <div className="flex items-center justify-end gap-2">
              {(phase === "preview") && (
                <>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => { setPreviewUrl(null); setPhase("prompt"); }}
                    className="text-muted-foreground hover:text-foreground hover:bg-muted/50 rounded-lg gap-1.5"
                  >
                    <RotateCcw className="h-3.5 w-3.5" />
                    Start over
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setPhase("editing")}
                    className="border-accent/30 text-accent hover:bg-accent/10 hover:text-accent rounded-lg gap-1.5"
                  >
                    <Pencil className="h-3.5 w-3.5" />
                    Edit
                  </Button>
                  <Button
                    size="sm"
                    onClick={handleInsert}
                    className="bg-accent hover:bg-accent/90 rounded-lg gap-1.5 shadow-[0_0_15px_-3px_hsl(var(--accent)/0.4)]"
                  >
                    <Check className="h-3.5 w-3.5" />
                    Insert
                  </Button>
                </>
              )}
              {phase === "editing" && (
                <>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setPhase("preview")}
                    className="text-muted-foreground hover:text-foreground rounded-lg"
                  >
                    Back
                  </Button>
                  <Button
                    size="sm"
                    onClick={handleInsert}
                    className="bg-accent hover:bg-accent/90 rounded-lg gap-1.5"
                  >
                    <Check className="h-3.5 w-3.5" />
                    Insert as-is
                  </Button>
                </>
              )}
              {phase === "prompt" && (
                <>
                  <Button variant="ghost" size="sm" onClick={handleClose} className="text-muted-foreground hover:text-foreground rounded-lg">
                    Cancel
                  </Button>
                  <Button
                    size="sm"
                    onClick={handleGenerate}
                    disabled={!prompt.trim() && activeChips.length === 0}
                    className="bg-accent hover:bg-accent/90 rounded-lg gap-1.5 shadow-[0_0_15px_-3px_hsl(var(--accent)/0.4)] disabled:shadow-none"
                  >
                    <Sparkles className="h-3.5 w-3.5" />
                    Generate
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
