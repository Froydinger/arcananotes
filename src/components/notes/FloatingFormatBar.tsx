import React, { useEffect, useState, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Heading1, Type, Bold, Italic } from 'lucide-react';

export type FormatType = 'p' | 'h1' | 'bold' | 'italic';

interface FloatingFormatBarProps {
  visible: boolean;
  onFormat: (type: FormatType) => void;
  editorRef: React.RefObject<HTMLDivElement>;
}

// Check if device is mobile/tablet
const isMobileDevice = () => {
  return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent) || window.innerWidth < 768;
};

export const FloatingFormatBar: React.FC<FloatingFormatBarProps> = ({
  visible,
  onFormat,
  editorRef
}) => {
  const [position, setPosition] = useState({ top: 0, left: 0 });
  const [currentFormats, setCurrentFormats] = useState<Set<FormatType>>(new Set());
  const [isMobile, setIsMobile] = useState(isMobileDevice());
  const barRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleResize = () => setIsMobile(isMobileDevice());
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  useEffect(() => {
    if (!visible || !editorRef.current) return;

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

      // Calculate bar dimensions (approx 200px wide with 4 buttons + divider, 40px tall)
      const barWidth = 200;
      const barHeight = 48;
      const viewportWidth = window.innerWidth;
      const viewportHeight = window.innerHeight;

      // On mobile, position below selection to avoid native menu
      // On desktop, position above selection
      const offset = isMobile ? 50 : -55;
      let top = rect.top - editorRect.top + (isMobile ? rect.height : 0) + offset;
      let left = rect.left - editorRect.left + (rect.width / 2);

      // Ensure toolbar stays within horizontal viewport bounds
      const absoluteLeft = editorRect.left + left;
      const minLeft = barWidth / 2 + 16; // 16px padding from edge
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
      if (h1) {
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
  }, [visible, editorRef, isMobile]);

  if (!visible) return null;

  return (
    <div
      ref={barRef}
      className="absolute z-50 bg-card/95 backdrop-blur-xl border border-border/50 rounded-xl shadow-elevated p-1.5 flex gap-1 animate-in fade-in slide-in-from-bottom-2 duration-200"
      style={{
        top: `${position.top}px`,
        left: `${position.left}px`,
        transform: 'translateX(-50%)',
      }}
    >
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
    </div>
  );
};
