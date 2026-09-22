import { useEffect, useState, useRef } from "react";
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
type Anchor = { left: number; top: number; width: number; height: number };

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

const BUTTON_CLASSES = "h-11 w-11 rounded-full bg-background/60 backdrop-blur-md border border-border/30 hover:bg-secondary/80 hover:border-border/50 transition-colors duration-200 shadow-sm glass-shimmer flex items-center justify-center";

export function CreateNoteMenu({ onCreate, direction = "down", className }: CreateNoteMenuProps) {
  const [phase, setPhase] = useState<Phase>("closed");
  const open = phase === "open";
  const closing = phase === "closing";
  const buttonRef = useRef<HTMLButtonElement>(null);
  const [anchor, setAnchor] = useState<Anchor | null>(null);

  // Track the anchor button's on-screen rect so the menu visuals can live in a
  // body portal, above the blur overlay, even when the header creates its own
  // stacking context (backdrop-filter) that would otherwise trap z-index.
  useEffect(() => {
    if (phase === "closed") {
      setAnchor(null);
      return;
    }
    const update = () => {
      const r = buttonRef.current?.getBoundingClientRect();
      if (r) setAnchor({ left: r.left, top: r.top, width: r.width, height: r.height });
    };
    update();
    window.addEventListener("resize", update);
    window.addEventListener("scroll", update, true);
    return () => {
      window.removeEventListener("resize", update);
      window.removeEventListener("scroll", update, true);
    };
  }, [phase]);

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

  const toggle = () => {
    if (phase !== "closed") {
      setPhase("closing");
      return;
    }
    const r = buttonRef.current?.getBoundingClientRect();
    if (r) setAnchor({ left: r.left, top: r.top, width: r.width, height: r.height });
    setPhase("open");
  };

  const handleCreate = (type: NoteType) => {
    setPhase("closed");
    void onCreate(type);
  };

  const offsets = OFFSETS[direction];
  const centerX = anchor ? anchor.left + anchor.width / 2 : 0;
  const centerY = anchor ? anchor.top + anchor.height / 2 : 0;
  const menuVisible = phase !== "closed" && anchor !== null;

  return (
    <div className={cn("relative", phase !== "closed" && "z-[130]", className)}>
      <button
        ref={buttonRef}
        onClick={toggle}
        aria-label="Create new note"
        aria-expanded={open}
        className={cn(BUTTON_CLASSES, phase !== "closed" && "opacity-0 pointer-events-none")}
      >
        <Plus className={cn("h-6 w-6 text-accent create-plus-icon", open && "create-plus-open")} />
      </button>
      {menuVisible &&
        createPortal(
          <div
            className="fixed inset-0 z-[120] bg-background/50 backdrop-blur-md pointer-events-auto create-overlay-in"
            onClick={() => setPhase("closing")}
          />,
          document.body
        )}
      {menuVisible &&
        createPortal(
          <button
            onClick={() => setPhase("closing")}
            aria-label="Create new note"
            aria-expanded={open}
            className={cn(BUTTON_CLASSES, "fixed z-[140]")}
            style={{ left: `${anchor!.left}px`, top: `${anchor!.top}px` }}
          >
            <Plus className={cn("h-6 w-6 text-accent create-plus-icon", open && "create-plus-open")} />
          </button>,
          document.body
        )}
      {menuVisible && (
        <div className="fixed z-[130] pointer-events-none" style={{ left: `${centerX}px`, top: `${centerY}px` }}>
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
