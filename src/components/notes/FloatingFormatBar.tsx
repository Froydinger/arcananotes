import React, { useEffect, useState, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Heading1, Type, Bold, Italic, Quote, Paintbrush, GripHorizontal } from 'lucide-react';
import arcAiLogo from '@/assets/arc-ai-logo.png.asset.json';
import { ArcInlineEditor } from './ArcInlineEditor';

export type FormatType = 'p' | 'h1' | 'bold' | 'italic' | 'quote';

interface FloatingFormatBarProps {
  visible: boolean;
  onFormat: (type: FormatType) => void;
  editorRef: React.RefObject<HTMLDivElement>;
  onGenerateImage?: () => void;
  isSubscribed?: boolean;
  arcSelection?: { text: string; noteTitle: string; noteContext: string } | null;
  onOpenArc?: () => void;
  onReplaceArc?: (replacement: string) => boolean;
  onCloseArc?: () => void;
}

// Check if device is mobile/tablet
const isMobileDevice = () => {
  return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent) || window.innerWidth < 768;
};

export const FloatingFormatBar: React.FC<FloatingFormatBarProps> = ({
  visible,
  onFormat,
  editorRef,
  onGenerateImage,
  isSubscribed,
  arcSelection,
  onOpenArc,
  onReplaceArc,
  onCloseArc,
}) => {
  const [position, setPosition] = useState({ top: 0, left: 0 });
  const [currentFormats, setCurrentFormats] = useState<Set<FormatType>>(new Set());
  const [isMobile, setIsMobile] = useState(isMobileDevice());
  const barRef = useRef<HTMLDivElement>(null);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
  const dragOffsetRef = useRef({ x: 0, y: 0 });
  const dragState = useRef<{ pointerId: number; startX: number; startY: number; baseX: number; baseY: number } | null>(null);
  // Anchor of the Arc panel, captured once when it opens (editor-relative coords)
  const arcAnchorRef = useRef<{ below: number; above: number } | null>(null);
  const arcSessionKey = arcSelection ? arcSelection.text : null;

  const applyTransform = (x: number, y: number) => {
    if (barRef.current) {
      barRef.current.style.transform = `translateX(-50%) translate(${x}px, ${y}px)`;
    }
  };

  // Reset manual drag position whenever a new Arc session opens/closes
  useEffect(() => {
    dragState.current = null;
    dragOffsetRef.current = { x: 0, y: 0 };
    setDragOffset({ x: 0, y: 0 });
    applyTransform(0, 0);
    arcAnchorRef.current = null;
  }, [arcSessionKey]);

  const startDrag = (event: React.PointerEvent<HTMLDivElement>) => {
    if (!arcSelection) return;
    event.preventDefault();
    event.stopPropagation();
    dragState.current = {
      pointerId: event.pointerId,
      startX: event.clientX,
      startY: event.clientY,
      baseX: dragOffsetRef.current.x,
      baseY: dragOffsetRef.current.y,
    };
    try {
      event.currentTarget.setPointerCapture(event.pointerId);
    } catch {
      /* capture is best-effort */
    }
  };

  const onDragMove = (event: React.PointerEvent<HTMLDivElement>) => {
    const drag = dragState.current;
    if (!drag || drag.pointerId !== event.pointerId) return;
    event.preventDefault();

    const bar = barRef.current;
    const width = bar?.offsetWidth ?? 320;
    const height = bar?.offsetHeight ?? 200;
    const editorRect = editorRef.current?.getBoundingClientRect();
    if (!editorRect) return;

    const nextX = drag.baseX + (event.clientX - drag.startX);
    const nextY = drag.baseY + (event.clientY - drag.startY);

    // Absolute position of the panel's left/top if we applied this offset
    const absCenterX = editorRect.left + position.left + nextX;
    const absTop = editorRect.top + position.top + nextY;

    const minCenterX = width / 2 + 8;
    const maxCenterX = window.innerWidth - width / 2 - 8;
    const minTop = 8;
    const maxTop = Math.max(8, window.innerHeight - height - 8);

    const clampedCenterX = Math.min(Math.max(absCenterX, minCenterX), maxCenterX);
    const clampedTop = Math.min(Math.max(absTop, minTop), maxTop);

    const offset = {
      x: clampedCenterX - editorRect.left - position.left,
      y: clampedTop - editorRect.top - position.top,
    };
    dragOffsetRef.current = offset;
    // Write straight to the DOM while dragging so it stays smooth
    applyTransform(offset.x, offset.y);
  };

  const endDrag = (event: React.PointerEvent<HTMLDivElement>) => {
    if (dragState.current?.pointerId !== event.pointerId) return;
    dragState.current = null;
    try {
      event.currentTarget.releasePointerCapture(event.pointerId);
    } catch {
      /* ignore */
    }
    setDragOffset(dragOffsetRef.current);
  };

  useEffect(() => {
    const handleResize = () => setIsMobile(isMobileDevice());
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // --- Arc panel positioning: anchor captured once, never chases the caret ---
  useEffect(() => {
    if (!visible || !arcSelection || !editorRef.current) return;

    const captureAnchor = () => {
      if (arcAnchorRef.current) return true;
      const selection = window.getSelection();
      if (!selection || selection.rangeCount === 0) return false;
      const range = selection.getRangeAt(0);
      if (!editorRef.current?.contains(range.commonAncestorContainer)) return false;
      const rects = range.getClientRects();
      if (rects.length === 0) return false;
      const editorRect = editorRef.current.getBoundingClientRect();
      arcAnchorRef.current = {
        below: rects[rects.length - 1].bottom - editorRect.top,
        above: rects[0].top - editorRect.top,
      };
      return true;
    };

    const place = () => {
      if (!captureAnchor()) return;
      const anchor = arcAnchorRef.current!;
      const editorRect = editorRef.current?.getBoundingClientRect();
      if (!editorRect) return;

      const viewportWidth = window.innerWidth;
      const viewportHeight = window.innerHeight;
      const panelWidth = Math.min(368, viewportWidth - 32);
      const panelHeight = barRef.current?.offsetHeight ?? 320;
      const lineGap = 10;

      let top = anchor.below + lineGap;
      if (editorRect.top + top + panelHeight > viewportHeight - 8) {
        top = anchor.above - panelHeight - lineGap;
      }
      if (editorRect.top + top < 8) {
        top = 8 - editorRect.top;
      }

      let left = editorRect.width / 2;
      const absCenter = editorRect.left + left;
      const minCenter = panelWidth / 2 + 8;
      const maxCenter = viewportWidth - panelWidth / 2 - 8;
      if (absCenter < minCenter) left = minCenter - editorRect.left;
      else if (absCenter > maxCenter) left = maxCenter - editorRect.left;

      setPosition((prev) => (prev.top === top && prev.left === left ? prev : { top, left }));
    };

    place();
    window.addEventListener('resize', place);
    return () => window.removeEventListener('resize', place);
  }, [visible, editorRef, arcSelection]);

  // --- Format bar positioning (follows the selection) ---
  useEffect(() => {
    if (!visible || arcSelection || !editorRef.current) return;

    const updatePosition = () => {
      const selection = window.getSelection();
      if (!selection || selection.rangeCount === 0) return;

      const range = selection.getRangeAt(0);
      const rects = range.getClientRects();

      if (rects.length === 0) return;

      // Get the first rect (where selection starts)
      const rect = rects[0];
      const editorRect = editorRef.current?.getBoundingClientRect();

      if (!editorRect) return;

      // Calculate bar dimensions (approx 288px wide, 48px tall)
      const barWidth = 288;
      const barHeight = 48;
      const viewportWidth = window.innerWidth;
      const viewportHeight = window.innerHeight;

      // On mobile, position below selection to avoid native menu
      // On desktop, position above selection
      const offset = isMobile ? 50 : -55;
      let top = rect.top - editorRect.top + (isMobile ? rect.height : 0) + offset;
      let left = rect.left - editorRect.left + (rect.width / 2);

      // Ensure toolbar stays within horizontal viewport bounds
      // Use editorRect.left as the effective left edge (accounts for sidebar)
      const absoluteLeft = editorRect.left + left;
      const minLeft = Math.max(editorRect.left, barWidth / 2) + 16;
      const maxLeft = viewportWidth - barWidth / 2 - 16;

      if (absoluteLeft < minLeft) {
        left = minLeft - editorRect.left;
      } else if (absoluteLeft > maxLeft) {
        left = maxLeft - editorRect.left;
      }

      // Ensure toolbar stays within vertical viewport bounds
      const absoluteTop = editorRect.top + top;

      // If toolbar would be above viewport, position below selection instead
      if (absoluteTop < barHeight + 16) {
        top = rect.top - editorRect.top + rect.height + 12;
      }

      // If toolbar would be below viewport, position above selection
      if (absoluteTop + barHeight > viewportHeight - 16) {
        top = rect.top - editorRect.top - barHeight - 12;
      }

      setPosition({ top, left });

      // Detect current formatting
      const formats = new Set<FormatType>();

      // Check if we're in an H1
      let element = range.commonAncestorContainer;
      if (element.nodeType === Node.TEXT_NODE) {
        element = element.parentElement!;
      }

      const h1 = (element as Element).closest('h1');
      const quote = (element as Element).closest('blockquote');
      if (quote) {
        formats.add('quote');
      } else if (h1) {
        formats.add('h1');
      } else {
        formats.add('p');
      }

      // Check bold and italic using queryCommandState
      if (document.queryCommandState('bold')) {
        formats.add('bold');
      }
      if (document.queryCommandState('italic')) {
        formats.add('italic');
      }

      setCurrentFormats(formats);
    };

    updatePosition();

    // Update position on scroll or resize
    const handleUpdate = () => updatePosition();
    window.addEventListener('resize', handleUpdate);
    document.addEventListener('selectionchange', handleUpdate);

    return () => {
      window.removeEventListener('resize', handleUpdate);
      document.removeEventListener('selectionchange', handleUpdate);
    };
  }, [visible, editorRef, isMobile, arcSelection]);


  useEffect(() => {
    if (!arcSelection || !onCloseArc) return;
    const closeOutside = (event: MouseEvent) => {
      const target = event.target as Node | null;
      // Ignore clicks on nodes that were removed while the panel opened
      if (!target || !target.isConnected) return;
      if (!barRef.current?.contains(target)) onCloseArc();
    };
    const timer = window.setTimeout(() => document.addEventListener('mousedown', closeOutside), 0);
    return () => {
      window.clearTimeout(timer);
      document.removeEventListener('mousedown', closeOutside);
    };
  }, [arcSelection, onCloseArc]);

  if (!visible) return null;

  return (
    <div
      ref={barRef}
      className="absolute z-50 bg-card/95 backdrop-blur-xl border border-border/50 rounded-lg shadow-elevated flex gap-1 animate-in fade-in slide-in-from-bottom-2 duration-200"
      style={{
        top: `${position.top}px`,
        left: `${position.left}px`,
        transform: `translateX(-50%) translate(${dragOffset.x}px, ${dragOffset.y}px)`,
      }}
    >
      {arcSelection && onReplaceArc && onCloseArc ? (
        <div>
          <div
            onPointerDown={startDrag}
            onPointerMove={onDragMove}
            onPointerUp={endDrag}
            onPointerCancel={endDrag}
            className="flex h-5 cursor-grab touch-none select-none items-center justify-center rounded-t-lg text-muted-foreground/60 transition-colors hover:text-muted-foreground active:cursor-grabbing"
            title="Drag to move"
            aria-label="Drag to move Arc panel"
          >
            <GripHorizontal className="h-3.5 w-3.5" />
          </div>
          <ArcInlineEditor
            selectedText={arcSelection.text}
            noteTitle={arcSelection.noteTitle}
            noteContext={arcSelection.noteContext}
            onReplace={onReplaceArc}
            onClose={onCloseArc}
          />
        </div>
      ) : <div className="flex items-center gap-1 p-1.5">
      <Button
        variant={currentFormats.has('p') ? 'default' : 'ghost'}
        size="sm"
        className="h-9 w-9 p-0 rounded-full"
        onMouseDown={(e) => {
          e.preventDefault(); // Prevent focus loss
          onFormat('p');
        }}
        title="Paragraph"
      >
        <Type className="h-4 w-4" />
      </Button>

      <Button
        variant={currentFormats.has('h1') ? 'default' : 'ghost'}
        size="sm"
        className="h-9 w-9 p-0 rounded-full"
        onMouseDown={(e) => {
          e.preventDefault(); // Prevent focus loss
          onFormat('h1');
        }}
        title="Title"
      >
        <Heading1 className="h-4 w-4" />
      </Button>

      {onOpenArc && (
        <>
          <div className="w-px h-6 bg-border/50 mx-0.5" />
          <Button variant="ghost" size="sm" className="h-9 w-9 p-0 rounded-full" onMouseDown={(e) => { e.preventDefault(); onOpenArc(); }} title="Edit with Arc">
            <img src={arcAiLogo.url} alt="Arc AI" className="h-5 w-5 rounded-full object-contain" />
          </Button>
        </>
      )}

      <div className="w-px h-6 bg-border/50 mx-0.5" />

      <Button
        variant={currentFormats.has('bold') ? 'default' : 'ghost'}
        size="sm"
        className="h-9 w-9 p-0 rounded-full"
        onMouseDown={(e) => {
          e.preventDefault(); // Prevent focus loss
          onFormat('bold');
        }}
        title="Bold (⌘B)"
      >
        <Bold className="h-4 w-4" />
      </Button>

      <Button
        variant={currentFormats.has('italic') ? 'default' : 'ghost'}
        size="sm"
        className="h-9 w-9 p-0 rounded-full"
        onMouseDown={(e) => {
          e.preventDefault(); // Prevent focus loss
          onFormat('italic');
        }}
        title="Italic (⌘I)"
      >
      <Italic className="h-4 w-4" />
      </Button>

      <Button
        variant={currentFormats.has('quote') ? 'default' : 'ghost'}
        size="sm"
        className="h-9 w-9 p-0 rounded-full"
        onMouseDown={(e) => {
          e.preventDefault(); // Prevent focus loss
          onFormat('quote');
        }}
        title="Pull quote"
      >
        <Quote className="h-4 w-4" />
      </Button>

      {onGenerateImage && (
        <>
          <div className="w-px h-6 bg-border/50 mx-0.5" />
          <Button
            variant="ghost"
            size="sm"
            className="h-9 w-9 p-0 rounded-full"
            onMouseDown={(e) => {
              e.preventDefault();
              onGenerateImage();
            }}
            title="Generate image from selected text"
          >
            <Paintbrush className="h-4 w-4" />
          </Button>
        </>
      )}
      </div>}
    </div>
  );
};
