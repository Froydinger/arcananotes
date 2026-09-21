import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import type { CSSProperties } from "react";
import { Plus, FileText, CheckSquare } from "lucide-react";
import { cn } from "@/lib/utils";
import { NoteType } from "@/types/sharing";

type CreateNoteMenuProps = {
  onCreate: (noteType: NoteType) => void | Promise<void>;
  /** "down" fans the bubbles out below the button (header), "right" fans them out beside it (left rail) */
  direction?: "down" | "right";
  className?: string;
};

type Phase = "closed" | "open" | "closing";

const BUBBLES: { type: NoteType; icon: typeof FileText; label: string }[] = [
  { type: "note", icon: FileText, label: "New note" },
  { type: "checklist", icon: CheckSquare, label: "New checklist" },
];

const OFFSETS: Record<"down" | "right", { x: string; y: string }[]> = {
  down: [
    { x: "-18px", y: "66px" },
    { x: "-54px", y: "38px" },
  ],
  right: [
    { x: "62px", y: "-30px" },
    { x: "52px", y: "34px" },
  ],
};

export function CreateNoteMenu({ onCreate, direction = "down", className }: CreateNoteMenuProps) {
  const [phase, setPhase] = useState<Phase>("closed");
  const open = phase === "open";
  const closing = phase === "closing";

  useEffect(() => {
    if (phase !== "closing") return;
    const t = window.setTimeout(() => setPhase("closed"), 210);
    return () => window.clearTimeout(t);
  }, [phase]);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setPhase("closing");
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open]);

  const handleCreate = (type: NoteType) => {
    setPhase("closed");
    void onCreate(type);
  };

  const offsets = OFFSETS[direction];

  return (
    <div className={cn("relative", phase !== "closed" && "z-[130]", className)}>
      {phase !== "closed" &&
        createPortal(
          <div
            className={cn(
              "fixed inset-0 z-[120] bg-background/50 backdrop-blur-md pointer-events-auto",
              closing ? "create-overlay-out" : "create-overlay-in"
            )}
            onClick={() => setPhase("closing")}
          />,
          document.body
        )}
      <button
        onClick={() => setPhase(open ? "closing" : "open")}
        aria-label="Create new note"
        aria-expanded={open}
        className="h-11 w-11 rounded-full bg-background/60 backdrop-blur-md border border-border/30 hover:bg-secondary/80 hover:border-border/50 transition-colors duration-200 shadow-sm glass-shimmer flex items-center justify-center"
      >
        <Plus className={cn("h-6 w-6 text-accent create-plus-icon", open && "create-plus-open")} />
      </button>
      {phase !== "closed" && (
        <div className="absolute left-1/2 top-1/2 z-[130] pointer-events-none">
          {BUBBLES.map((bubble, i) => {
            const offset = offsets[i];
            const Icon = bubble.icon;
            return (
              <button
                key={bubble.type}
                onClick={() => handleCreate(bubble.type)}
                aria-label={bubble.label}
                title={bubble.label}
                style={{
                  "--tx": offset.x,
                  "--ty": offset.y,
                  animationDelay: closing ? "0ms" : `${(BUBBLES.length - 1 - i) * 45}ms`,
                } as CSSProperties}
                className={cn(
                  "absolute -ml-6 -mt-6 flex h-12 w-12 items-center justify-center rounded-full bg-background/80 backdrop-blur-xl border border-border/40 shadow-elevated pointer-events-auto hover:bg-secondary/90 hover:border-border/60 transition-colors",
                  closing ? "create-bubble-out" : "create-bubble-in"
                )}
              >
                <Icon className="h-5 w-5 text-foreground" />
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
