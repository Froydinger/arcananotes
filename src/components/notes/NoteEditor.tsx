
import React, { useState, useEffect, useRef, useCallback, Component, ErrorInfo, ReactNode } from 'react';
import { useNotes, Note } from '@/contexts/NoteContext';
import DOMPurify from 'dompurify';
import { ImageUploadButton } from './ImageUploadButton';
import { FeaturedImage } from './FeaturedImage';
import { sanitizeContent, sanitizeForDisplay, sanitizeImageUrl, isValidImageUrl } from "@/lib/sanitization";
import { FloatingFormatBar, FormatType } from './FloatingFormatBar';
import { ImageGenerateModal } from './ImageGenerateModal';
import { usePageLeave } from '@/hooks/usePageLeave';
import { useTitleFont, useBodyFont } from '@/hooks/useTitleFont';
import { useSubscription } from '@/hooks/useSubscription';
import { supabase } from '@/integrations/supabase/client';
import { toast as sonnerToast } from 'sonner';

// Error boundary for the editor
class EditorErrorBoundary extends Component<
  { children: ReactNode; fallback?: ReactNode },
  { hasError: boolean; error?: Error }
> {
  constructor(props: { children: ReactNode; fallback?: ReactNode }) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error) {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('Editor error:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return this.props.fallback || (
        <div className="p-4 text-red-500">
          <p>Something went wrong with the editor.</p>
          <p className="text-sm mt-2">Try refreshing the page.</p>
        </div>
      );
    }

    return this.props.children;
  }
}

// Debounce utility
function debounce<T extends (...args: unknown[]) => unknown>(
  func: T,
  wait: number
): (...args: Parameters<T>) => void {
  let timeout: ReturnType<typeof setTimeout> | null = null;
  return (...args: Parameters<T>) => {
    if (timeout) clearTimeout(timeout);
    timeout = setTimeout(() => func(...args), wait);
  };
}

// Safe content getter - strips image controls before returning content
function getEditorContent(editor: HTMLDivElement | null): string {
  if (!editor) return '';
  const clone = editor.cloneNode(true) as HTMLDivElement;
  // Unwrap image wrappers back to plain images
  clone.querySelectorAll('.note-image-wrapper').forEach((wrapper) => {
    const img = wrapper.querySelector('img');
    if (img) {
      wrapper.replaceWith(img);
    } else {
      wrapper.remove();
    }
  });
  // Remove any stray control elements
  clone.querySelectorAll('.image-reorder-controls, .image-delete-btn').forEach(el => el.remove());
  return clone.innerHTML;
}

// Safe content setter - sanitizes before setting
function setEditorContent(editor: HTMLDivElement | null, content: string): void {
  if (!editor) return;
  const sanitized = sanitizeForDisplay(content);
  editor.innerHTML = sanitized;
}

interface NoteEditorProps {
  note: Note;
  onNoteSaved?: (title: string, content: string) => void;
  onAIContentReplace?: (replacementFunction: (newContent: string, isSelectionReplacement: boolean) => void) => void;
  aiEnabled?: boolean;
}

type ArcSelection = { text: string; noteTitle: string; noteContext: string };

export default function NoteEditor({ note, onNoteSaved, onAIContentReplace, aiEnabled = true }: NoteEditorProps) {
  const titleFont = useTitleFont();
  const bodyFont = useBodyFont();
  const { isSubscribed } = useSubscription();
  const { updateNote } = useNotes();

  // Core state
  const [title, setTitle] = useState(note.title);
  const [lastSavedContent, setLastSavedContent] = useState(note.content);

  // Notification tracking (consolidated)
  const lastNotifiedStateRef = useRef({
    content: note.content,
    title: note.title
  });

  // Previous state for undo (consolidated)
  const previousStateRef = useRef({
    content: note.content,
    title: note.title
  });

  // DOM refs
  const titleRef = useRef<HTMLTextAreaElement>(null);
  const contentRef = useRef<HTMLDivElement>(null);
  const savedRangeRef = useRef<Range | null>(null);
  const draggingWrapperRef = useRef<HTMLElement | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // UI state
  const [showFloatingBar, setShowFloatingBar] = useState(false);
  const [arcSelection, setArcSelection] = useState<ArcSelection | null>(null);
  const [showSlashMenu, setShowSlashMenu] = useState(false);
  const slashMenuRef = useRef<HTMLDivElement>(null);
  const [slashMenuIndex, setSlashMenuIndex] = useState(0);

  // Timers
  const inactivityTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const titleSaveTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  

  const isReadOnly = note.isSharedWithUser && note.userPermission === 'read';

  // Apply iOS zoom prevention on mount
  useEffect(() => {
    // Ensure title and content have proper font size to prevent zoom
    if (titleRef.current && parseFloat(getComputedStyle(titleRef.current).fontSize) < 16) {
      titleRef.current.style.fontSize = '16px';
    }
    if (contentRef.current && parseFloat(getComputedStyle(contentRef.current).fontSize) < 16) {
      contentRef.current.style.fontSize = '16px';
    }
  }, []);

  // Auto-resize title textarea
  useEffect(() => {
    if (titleRef.current) {
      titleRef.current.style.height = 'auto';
      titleRef.current.style.height = titleRef.current.scrollHeight + 'px';
    }
  }, [title]);

  // Update title and content when note changes (force update for undo/redo)
  useEffect(() => {
    // Always update title unless it's currently focused
    const titleHasFocus = document.activeElement === titleRef.current;
    if (!titleHasFocus && note.title !== title) {
      setTitle(note.title);
    }

    // Only update content if it's actually different AND user is not actively editing
    const currentContent = getEditorContent(contentRef.current);
    const sanitizedContent = sanitizeForDisplay(note.content);

    // Only skip the update while the user is actively typing in the editor.
    // A lingering text selection must not block external updates (undo/redo, AI applies),
    // otherwise those changes silently never reach the editor.
    const isTyping = !!contentRef.current && document.activeElement === contentRef.current;

    if (sanitizedContent !== currentContent && !isTyping) {
      setEditorContent(contentRef.current, sanitizedContent);
      contentRef.current?.dispatchEvent(new Event('input', { bubbles: true }));
    }
  }, [note.id, note.title, note.content, note.featured_image, title]);

  // Send notifications after 5 minutes of inactivity
  const sendInactivityNotification = useCallback(async () => {
    if (!note.isSharedWithUser && (!note.shares || note.shares.length === 0)) {
      return; // No one to notify
    }

    try {
      const { supabase } = await import('@/integrations/supabase/client');
      const currentContent = getEditorContent(contentRef.current);

      await supabase.functions.invoke('notify-note-update', {
        body: {
          noteId: note.id,
          originalContent: lastNotifiedStateRef.current.content,
          currentContent,
          originalTitle: lastNotifiedStateRef.current.title,
          currentTitle: title
        }
      });

      // Update our tracking state
      lastNotifiedStateRef.current = {
        content: currentContent,
        title
      };

      console.log('Inactivity notification sent for note:', note.id);
    } catch (error) {
      console.error('Failed to send inactivity notification:', error);
    }
  }, [note.id, note.isSharedWithUser, note.shares, title]);

  // Handle page leave - save with notification
  const handlePageLeave = useCallback(() => {
    const content = getEditorContent(contentRef.current);
    if (content) {
      const sanitizedContent = sanitizeContent(content);
      if (sanitizedContent !== lastSavedContent) {
        updateNote(note.id, { content: sanitizedContent }, false); // Non-silent save on page leave
      }
    }

    // Send final notification if there are unsent changes
    if (inactivityTimerRef.current) {
      clearTimeout(inactivityTimerRef.current);
      sendInactivityNotification();
    }
  }, [note.id, lastSavedContent, updateNote, sendInactivityNotification]);

  usePageLeave({ onPageLeave: handlePageLeave });

  // Handle content updates with debounce and inactivity tracking
  useEffect(() => {
    let timeout: ReturnType<typeof setTimeout>;
    let undoTimeout: ReturnType<typeof setTimeout>;

    const handleContentChange = (e?: Event) => {
      const content = getEditorContent(contentRef.current);
      if (!content && content !== '') return;

      // Clear any existing inactivity timer
      if (inactivityTimerRef.current) {
        clearTimeout(inactivityTimerRef.current);
      }

      // Start 5-minute inactivity timer
      inactivityTimerRef.current = setTimeout(() => {
        sendInactivityNotification();
      }, 5 * 60 * 1000); // 5 minutes

      clearTimeout(timeout);
      clearTimeout(undoTimeout);

      // Check if this is an AI update (has special data attribute)
      const isAIUpdate = e && (e as Event & { isAIUpdate?: boolean }).isAIUpdate;
      const delay = isAIUpdate ? 0 : 500; // Immediate save for AI updates, debounced for user typing

      timeout = setTimeout(() => {
        // Sanitize content before saving to database
        const sanitizedContent = sanitizeContent(content);

        // Force save for AI updates even if content seems unchanged
        if (isAIUpdate || sanitizedContent !== lastSavedContent) {
          updateNote(note.id, { content: sanitizedContent }, true); // Silent auto-save
          setLastSavedContent(sanitizedContent);
          // Notify parent of save for undo/redo snapshots
          onNoteSaved?.(title, sanitizedContent);
        }
      }, delay);
    };

    const currentRef = contentRef.current;

    if (currentRef) {
      currentRef.addEventListener('input', handleContentChange);
    }

    return () => {
      clearTimeout(timeout);
      clearTimeout(undoTimeout);
      if (inactivityTimerRef.current) {
        clearTimeout(inactivityTimerRef.current);
      }
      if (currentRef) {
        currentRef.removeEventListener('input', handleContentChange);
      }
    };
  }, [note.id, updateNote, lastSavedContent, onNoteSaved, sendInactivityNotification, title]);

  // Handle AI content replacement - both selection and full content
  const replaceContentFromAI = useCallback((newContent: string, isSelectionReplacement: boolean = false) => {
    if (!contentRef.current) return;

    try {
      if (isSelectionReplacement) {
        // Replace only selected text
        const selection = window.getSelection();
        if (selection && selection.rangeCount > 0) {
          const range = selection.getRangeAt(0);

          // Delete the selected content
          range.deleteContents();

          // Create a temporary div to parse the HTML (sanitize first)
          const sanitizedContent = sanitizeContent(newContent);
          const tempDiv = document.createElement('div');
          tempDiv.innerHTML = sanitizedContent;

          // Insert the new content preserving HTML structure and line breaks
          const fragment = document.createDocumentFragment();
          while (tempDiv.firstChild) {
            fragment.appendChild(tempDiv.firstChild);
          }

          range.insertNode(fragment);
          range.collapse(false);
          selection.removeAllRanges();
          selection.addRange(range);
        }
      } else {
        // Replace entire content
        setEditorContent(contentRef.current, newContent);
      }

      // Trigger content change to save
      const event = new Event('input', { bubbles: true }) as Event & { isAIUpdate?: boolean };
      event.isAIUpdate = true;
      contentRef.current.dispatchEvent(event);
    } catch (error) {
      console.error('Error replacing content from AI:', error);
      // Fallback to simple replacement
      setEditorContent(contentRef.current, newContent);
    }
  }, []);

  // Expose AI replacement function to parent
  useEffect(() => {
    if (onAIContentReplace) {
      onAIContentReplace(replaceContentFromAI);
    }
  }, [onAIContentReplace, replaceContentFromAI]);

  // Save current selection range if it lives inside the editor
  const saveSelectionRange = () => {
    const selection = window.getSelection();
    if (!selection || selection.rangeCount === 0) return;
    const range = selection.getRangeAt(0);
    if (contentRef.current && contentRef.current.contains(range.commonAncestorContainer)) {
      savedRangeRef.current = range.cloneRange();
    }
  };

  // Handle image insertion at cursor position with validation
  const insertImageAtCursor = (imageUrl: string) => {
    if (!contentRef.current) return;

    try {
      const { url: sanitizedUrl, alt } = sanitizeImageUrl(imageUrl, 'Uploaded image');

      const img = document.createElement('img');
      img.src = sanitizedUrl;
      img.alt = alt;
      img.className = 'note-image';
      img.setAttribute('data-image-id', Date.now().toString());

      // Prefer current live selection, fall back to the last saved range
      // (selection is typically lost when a modal/file picker steals focus)
      const selection = window.getSelection();
      let range: Range | null = null;
      if (
        selection &&
        selection.rangeCount > 0 &&
        contentRef.current.contains(selection.getRangeAt(0).commonAncestorContainer)
      ) {
        range = selection.getRangeAt(0);
      } else if (
        savedRangeRef.current &&
        contentRef.current.contains(savedRangeRef.current.commonAncestorContainer)
      ) {
        range = savedRangeRef.current;
      }

      const imgWrapper = document.createElement('p');
      imgWrapper.appendChild(img);
      const p = document.createElement('p');
      p.innerHTML = '<br>';

      if (range) {
        // Walk up to the direct child block of the editor
        let blockParent: HTMLElement | null = range.commonAncestorContainer as HTMLElement;
        if (blockParent.nodeType === Node.TEXT_NODE) {
          blockParent = blockParent.parentElement;
        }
        while (blockParent && blockParent.parentElement !== contentRef.current) {
          blockParent = blockParent.parentElement;
        }

        if (blockParent && contentRef.current.contains(blockParent)) {
          blockParent.after(imgWrapper);
          imgWrapper.after(p);
        } else {
          contentRef.current.appendChild(imgWrapper);
          contentRef.current.appendChild(p);
        }
      } else {
        contentRef.current.appendChild(imgWrapper);
        contentRef.current.appendChild(p);
      }

      // Move caret to the empty paragraph after the image
      const newRange = document.createRange();
      newRange.setStart(p, 0);
      newRange.collapse(true);
      const sel = window.getSelection();
      sel?.removeAllRanges();
      sel?.addRange(newRange);
      savedRangeRef.current = newRange.cloneRange();

      // Trigger content change to save
      contentRef.current.dispatchEvent(new Event('input', { bubbles: true }));
      setupImageControls();
    } catch (error) {
      console.error('Failed to insert image:', error);
    }
  };

  // Handle paste events with HTML formatting preservation
  const handlePaste = (e: React.ClipboardEvent) => {
    e.preventDefault();
    
    // Try to get HTML content first, then fallback to plain text
    const htmlData = e.clipboardData.getData('text/html');
    const textData = e.clipboardData.getData('text/plain');
    
    if (!htmlData && !textData) return;
    
    // Get current selection
    const selection = window.getSelection();
    if (!selection || selection.rangeCount === 0) return;
    
    const range = selection.getRangeAt(0);
    range.deleteContents();
    
    if (htmlData) {
      // Create a temporary div to parse HTML
      const tempDiv = document.createElement('div');
      tempDiv.innerHTML = htmlData;

      // Clean up the content and process it properly - preserving whitespace and blank lines
      const processElement = (element: Element): DocumentFragment => {
        const fragment = document.createDocumentFragment();

        // Process all child nodes
        for (const child of Array.from(element.childNodes)) {
          if (child.nodeType === Node.TEXT_NODE) {
            // Preserve text content including whitespace, only collapse multiple spaces
            const text = child.textContent || '';
            // Don't skip empty text nodes if they contain newlines - preserve structure
            if (text) {
              // Preserve newlines and convert them to proper line breaks
              const lines = text.split('\n');
              lines.forEach((line, lineIndex) => {
                // Only trim leading/trailing spaces, not the entire content
                const trimmedLine = line.replace(/^[ \t]+|[ \t]+$/g, '');
                if (trimmedLine) {
                  fragment.appendChild(document.createTextNode(trimmedLine));
                }
                // Add BR for each newline except the last
                if (lineIndex < lines.length - 1) {
                  fragment.appendChild(document.createElement('br'));
                }
              });
            }
          } else if (child.nodeType === Node.ELEMENT_NODE) {
            const childElement = child as Element;
            const tagName = childElement.tagName.toLowerCase();

            // Handle different element types
            if (['h1', 'h2', 'h3', 'h4', 'h5', 'h6'].includes(tagName)) {
              const heading = document.createElement(tagName);
              heading.textContent = childElement.textContent || '';
              fragment.appendChild(heading);
              // Only add line break if there's more content after this heading
              const nextSibling = child.nextSibling;
              if (nextSibling && nextSibling.textContent?.trim()) {
                fragment.appendChild(document.createElement('br'));
              }
            } else if (tagName === 'p') {
              const para = document.createElement('p');
              // Preserve content with internal formatting
              const content = childElement.textContent || '';
              para.textContent = content;
              fragment.appendChild(para);
            } else if (tagName === 'div') {
              // Process div content - divs typically represent line breaks/paragraphs
              const text = childElement.textContent || '';
              const trimmedText = text.trim();

              // Check if this div contains block-level content or just text
              const hasBlockElements = childElement.querySelector('h1, h2, h3, h4, h5, h6, p, div');
              if (hasBlockElements) {
                const divContent = processElement(childElement);
                fragment.appendChild(divContent);
              } else if (trimmedText) {
                // Just text content, treat as paragraph
                const para = document.createElement('p');
                para.textContent = trimmedText;
                fragment.appendChild(para);
              } else {
                // Empty div represents a blank line
                fragment.appendChild(document.createElement('br'));
                fragment.appendChild(document.createElement('br'));
              }
            } else if (['strong', 'b'].includes(tagName)) {
              const strong = document.createElement('strong');
              strong.textContent = childElement.textContent || '';
              fragment.appendChild(strong);
            } else if (['em', 'i'].includes(tagName)) {
              const em = document.createElement('em');
              em.textContent = childElement.textContent || '';
              fragment.appendChild(em);
            } else if (tagName === 'u') {
              const u = document.createElement('u');
              u.textContent = childElement.textContent || '';
              fragment.appendChild(u);
            } else if (tagName === 'br') {
              fragment.appendChild(document.createElement('br'));
            } else if (['ul', 'ol'].includes(tagName)) {
              // Handle lists - preserve list structure as line breaks
              const listItems = childElement.querySelectorAll('li');
              listItems.forEach((li, liIndex) => {
                const bullet = tagName === 'ul' ? '• ' : `${liIndex + 1}. `;
                fragment.appendChild(document.createTextNode(bullet + (li.textContent || '')));
                fragment.appendChild(document.createElement('br'));
              });
            } else if (tagName === 'li') {
              // Individual list item (shouldn't happen normally but handle it)
              fragment.appendChild(document.createTextNode('• ' + (childElement.textContent || '')));
              fragment.appendChild(document.createElement('br'));
            } else {
              // For other elements, preserve text content
              const text = childElement.textContent || '';
              if (text.trim()) {
                fragment.appendChild(document.createTextNode(text));
              }
            }
          }
        }

        return fragment;
      };
      
      const processedFragment = processElement(tempDiv);
      
      // If we got some content, use it
      if (processedFragment.childNodes.length > 0) {
        range.insertNode(processedFragment);
        range.collapse(false);
        selection.removeAllRanges();
        selection.addRange(range);
      } else {
        // Fallback to plain text if HTML parsing failed
        insertPlainText(textData, range, selection);
      }
    } else {
      // Handle plain text with line break normalization
      insertPlainText(textData, range, selection);
    }
    
    // Trigger content change to save
    if (contentRef.current) {
      contentRef.current.dispatchEvent(new Event('input', { bubbles: true }));
    }
  };
  
  // Helper function for plain text insertion - preserves ALL blank lines and spacing
  const insertPlainText = (text: string, range: Range, selection: Selection) => {
    // Normalize line breaks: only standardize Windows line endings, preserve all blank lines
    const normalizedText = text
      .replace(/\r\n/g, '\n')  // Normalize Windows line endings to \n
      .replace(/\r/g, '\n');   // Normalize old Mac line endings to \n

    // Split by line breaks (don't trim to preserve leading/trailing newlines)
    const lines = normalizedText.split('\n');

    lines.forEach((line, index) => {
      // Insert text node for each line - always create node even if empty
      // to preserve spacing and blank lines
      if (line.length > 0) {
        const textNode = document.createTextNode(line);
        range.insertNode(textNode);
        range.setStartAfter(textNode);
      }

      // Add line break for all lines except the last one
      // For blank lines, this creates the visual blank line
      if (index < lines.length - 1) {
        const br = document.createElement('br');
        range.insertNode(br);
        range.setStartAfter(br);

        // For consecutive blank lines, we need an additional BR
        // because a single BR after nothing doesn't create a visible blank line
        if (line.length === 0 && index < lines.length - 2 && lines[index + 1].length === 0) {
          // Don't add extra BR here - the next iteration will handle it
        } else if (line.length === 0) {
          // Add a second BR to make the blank line visible
          const extraBr = document.createElement('br');
          range.insertNode(extraBr);
          range.setStartAfter(extraBr);
        }
      }
    });

    // Collapse range to end
    range.collapse(false);
    selection.removeAllRanges();
    selection.addRange(range);
  };

  // Setup image reorder/delete controls
  const setupImageControls = useCallback(() => {
    if (!contentRef.current || isReadOnly) return;

    // Remove any existing wrappers first
    const existingWrappers = contentRef.current.querySelectorAll('.note-image-wrapper');
    existingWrappers.forEach((wrapper) => {
      const img = wrapper.querySelector('img');
      if (img) {
        wrapper.replaceWith(img);
      }
    });

    const images = contentRef.current.querySelectorAll('img.note-image');
    images.forEach((img) => {
      if (!img.hasAttribute('data-image-id')) {
        img.setAttribute('data-image-id', Date.now().toString());
      }

      // Create wrapper
      const wrapper = document.createElement('div');
      wrapper.className = 'note-image-wrapper';
      wrapper.contentEditable = 'false';
      wrapper.setAttribute('draggable', 'true');
      img.parentNode?.insertBefore(wrapper, img);
      wrapper.appendChild(img);

      // Drag to move the image block (not copy)
      wrapper.ondragstart = (e) => {
        if (!e.dataTransfer) return;
        draggingWrapperRef.current = wrapper;
        e.dataTransfer.effectAllowed = 'move';
        // Required for Firefox to initiate drag
        try { e.dataTransfer.setData('text/plain', 'note-image'); } catch {}
        wrapper.classList.add('is-dragging');
      };
      wrapper.ondragend = () => {
        wrapper.classList.remove('is-dragging');
        draggingWrapperRef.current = null;
        contentRef.current?.querySelectorAll('.drop-indicator-active').forEach(el => {
          el.classList.remove('drop-indicator-active', 'drop-before', 'drop-after');
        });
      };

      // Click/tap to toggle controls visibility
      wrapper.onclick = (e) => {
        e.stopPropagation();
        // Remove active class from all other wrappers
        contentRef.current?.querySelectorAll('.note-image-wrapper.controls-active').forEach(w => {
          if (w !== wrapper) w.classList.remove('controls-active');
        });
        wrapper.classList.toggle('controls-active');
      };

      // Create reorder controls
      const controls = document.createElement('div');
      controls.className = 'image-reorder-controls';

      const upBtn = document.createElement('button');
      upBtn.className = 'image-reorder-btn';
      upBtn.innerHTML = '↑';
      upBtn.title = 'Move up';
      upBtn.onmousedown = (e) => {
        e.preventDefault();
        e.stopPropagation();
        const prev = wrapper.previousElementSibling;
        if (prev) {
          wrapper.parentNode?.insertBefore(wrapper, prev);
          contentRef.current?.dispatchEvent(new Event('input', { bubbles: true }));
        }
      };

      const downBtn = document.createElement('button');
      downBtn.className = 'image-reorder-btn';
      downBtn.innerHTML = '↓';
      downBtn.title = 'Move down';
      downBtn.onmousedown = (e) => {
        e.preventDefault();
        e.stopPropagation();
        const next = wrapper.nextElementSibling;
        if (next) {
          next.after(wrapper);
          contentRef.current?.dispatchEvent(new Event('input', { bubbles: true }));
        }
      };

      controls.appendChild(upBtn);
      controls.appendChild(downBtn);
      wrapper.appendChild(controls);

      // Delete button
      const deleteBtn = document.createElement('button');
      deleteBtn.className = 'image-delete-btn';
      deleteBtn.innerHTML = '✕';
      deleteBtn.title = 'Remove image';
      deleteBtn.onmousedown = (e) => {
        e.preventDefault();
        e.stopPropagation();
        wrapper.remove();
        contentRef.current?.dispatchEvent(new Event('input', { bubbles: true }));
      };
      wrapper.appendChild(deleteBtn);
    });
  }, [isReadOnly]);

  // Handle existing images in loaded content
  useEffect(() => {
    if (!contentRef.current) return;
    
    const images = contentRef.current.querySelectorAll('img');
    images.forEach((img) => {
      if (!img.classList.contains('note-image')) {
        img.className = 'note-image';
      }
      if (!img.hasAttribute('data-image-id')) {
        img.setAttribute('data-image-id', Date.now().toString());
      }
    });

    // Small delay to let DOM settle then add controls
    setTimeout(() => setupImageControls(), 100);
  }, [note.id, setupImageControls]);

  // Re-setup image controls whenever content changes (e.g. after save round-trip strips wrappers)
  useEffect(() => {
    if (!contentRef.current || isReadOnly) return;

    const observer = new MutationObserver(() => {
      // Check if there are unwrapped images
      const unwrapped = contentRef.current?.querySelectorAll('img.note-image:not(.note-image-wrapper img)');
      if (unwrapped && unwrapped.length > 0) {
        setTimeout(() => setupImageControls(), 50);
      }
    });

    observer.observe(contentRef.current, { childList: true, subtree: true });
    return () => observer.disconnect();
  }, [note.id, setupImageControls, isReadOnly]);

  // Drag-and-drop: move image blocks within the editor (no copy)
  useEffect(() => {
    const editor = contentRef.current;
    if (!editor || isReadOnly) return;

    const clearIndicators = () => {
      editor.querySelectorAll('.drop-before, .drop-after').forEach(el => {
        el.classList.remove('drop-before', 'drop-after');
      });
    };

    // Find the direct child block of the editor at a given Y
    const findBlockAtY = (y: number): HTMLElement | null => {
      const children = Array.from(editor.children) as HTMLElement[];
      for (const child of children) {
        const rect = child.getBoundingClientRect();
        if (y >= rect.top && y <= rect.bottom) return child;
      }
      // Fallback to nearest
      let nearest: HTMLElement | null = null;
      let minDist = Infinity;
      for (const child of children) {
        const rect = child.getBoundingClientRect();
        const mid = (rect.top + rect.bottom) / 2;
        const d = Math.abs(y - mid);
        if (d < minDist) { minDist = d; nearest = child; }
      }
      return nearest;
    };

    const onDragOver = (e: DragEvent) => {
      if (!draggingWrapperRef.current) return;
      e.preventDefault();
      if (e.dataTransfer) e.dataTransfer.dropEffect = 'move';
      const target = findBlockAtY(e.clientY);
      clearIndicators();
      if (!target || target === draggingWrapperRef.current) return;
      const rect = target.getBoundingClientRect();
      const after = e.clientY > rect.top + rect.height / 2;
      target.classList.add(after ? 'drop-after' : 'drop-before');
    };

    const onDrop = (e: DragEvent) => {
      const wrapper = draggingWrapperRef.current;
      if (!wrapper) return;
      e.preventDefault();
      const target = findBlockAtY(e.clientY);
      clearIndicators();
      if (!target || target === wrapper) return;
      const rect = target.getBoundingClientRect();
      const after = e.clientY > rect.top + rect.height / 2;
      if (after) target.after(wrapper);
      else target.before(wrapper);
      editor.dispatchEvent(new Event('input', { bubbles: true }));
    };

    const onDragLeave = (e: DragEvent) => {
      if (e.target === editor) clearIndicators();
    };

    editor.addEventListener('dragover', onDragOver);
    editor.addEventListener('drop', onDrop);
    editor.addEventListener('dragleave', onDragLeave);
    return () => {
      editor.removeEventListener('dragover', onDragOver);
      editor.removeEventListener('drop', onDrop);
      editor.removeEventListener('dragleave', onDragLeave);
    };
  }, [note.id, isReadOnly]);

  // Continuously remember the caret position inside the editor so
  // modals/file pickers can insert at the right spot even after focus is stolen
  useEffect(() => {
    const onSelectionChange = () => {
      const sel = window.getSelection();
      if (!sel || sel.rangeCount === 0) return;
      const range = sel.getRangeAt(0);
      if (contentRef.current?.contains(range.commonAncestorContainer)) {
        savedRangeRef.current = range.cloneRange();
      }
    };
    document.addEventListener('selectionchange', onSelectionChange);
    return () => document.removeEventListener('selectionchange', onSelectionChange);
  }, []);

  // Dismiss image controls when clicking outside images
  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      if (!target.closest('.note-image-wrapper')) {
        contentRef.current?.querySelectorAll('.note-image-wrapper.controls-active').forEach(w => {
          w.classList.remove('controls-active');
        });
      }
    };
    document.addEventListener('click', handleClick);
    return () => document.removeEventListener('click', handleClick);
  }, []);

  // Track text selection for floating format bar
  useEffect(() => {
    if (isReadOnly) return;

    const handleSelectionChange = () => {
      const selection = window.getSelection();
      if (!selection || selection.rangeCount === 0) {
        setShowFloatingBar(false);
        return;
      }

      const range = selection.getRangeAt(0);
      const selectedText = range.toString().trim();

      // Show floating bar only if:
      // 1. There's selected text
      // 2. The selection is within the editor
      // 3. The editor has focus
      const isInEditor = contentRef.current?.contains(range.commonAncestorContainer);
      const hasSelection = selectedText.length > 0 && !range.collapsed;

      if (!arcSelection) setShowFloatingBar(isInEditor && hasSelection);

      // Close slash menu if selection changes (user clicked elsewhere)
      if (showSlashMenu && (!isInEditor || hasSelection)) {
        setShowSlashMenu(false);
      }
    };

    document.addEventListener('selectionchange', handleSelectionChange);

    return () => {
      document.removeEventListener('selectionchange', handleSelectionChange);
    };
  }, [isReadOnly, showSlashMenu, arcSelection]);

  const openArcInlineEditor = useCallback(() => {
    const selection = window.getSelection();
    if (!selection || selection.rangeCount === 0 || !contentRef.current) return;
    const range = selection.getRangeAt(0);
    const text = range.toString().trim();
    if (!text || !contentRef.current.contains(range.commonAncestorContainer)) return;
    savedRangeRef.current = range.cloneRange();
    setArcSelection({
      text,
      noteTitle: title,
      noteContext: contentRef.current.innerText,
    });
    setShowFloatingBar(true);
  }, [title]);

  const closeArcInlineEditor = useCallback(() => {
    setArcSelection(null);
    setShowFloatingBar(false);
  }, []);

  const replaceArcSelection = useCallback((replacement: string): boolean => {
    const editor = contentRef.current;
    const range = savedRangeRef.current;
    if (!editor || !range || !arcSelection || !editor.contains(range.commonAncestorContainer)) return false;
    if (range.toString().trim() !== arcSelection.text) return false;

    const before = getEditorContent(editor);
    onNoteSaved?.(title, sanitizeContent(before));

    const sanitized = sanitizeContent(replacement);
    const holder = document.createElement('div');
    holder.innerHTML = sanitized;
    const fragment = document.createDocumentFragment();
    let lastNode: ChildNode | null = null;
    while (holder.firstChild) {
      lastNode = holder.firstChild;
      fragment.appendChild(holder.firstChild);
    }

    range.deleteContents();
    range.insertNode(fragment);
    if (lastNode) range.setStartAfter(lastNode);
    range.collapse(true);

    editor.focus();
    const selection = window.getSelection();
    selection?.removeAllRanges();
    selection?.addRange(range);
    savedRangeRef.current = range.cloneRange();

    const event = new Event('input', { bubbles: true }) as Event & { isAIUpdate?: boolean };
    event.isAIUpdate = true;
    editor.dispatchEvent(event);
    return true;
  }, [arcSelection, onNoteSaved, title]);

  // Handle formatting from floating bar
  const handleFormat = useCallback((type: FormatType) => {
    if (!contentRef.current) return;

    try {
      const selection = window.getSelection();
      if (!selection || selection.rangeCount === 0) return;

      // Save the current selection range before any focus changes
      const savedRange = selection.getRangeAt(0).cloneRange();

      // Ensure editor has focus
      contentRef.current.focus();

      // Restore the selection after focus
      selection.removeAllRanges();
      selection.addRange(savedRange);

      switch (type) {
        case 'p':
          document.execCommand('formatBlock', false, 'p');
          break;
        case 'h1':
          document.execCommand('formatBlock', false, 'h1');
          break;
        case 'bold':
          // execCommand automatically toggles bold on/off
          document.execCommand('bold', false, undefined);
          break;
        case 'italic':
          // execCommand automatically toggles italic on/off
          document.execCommand('italic', false, undefined);
          break;
        case 'quote': {
          // Toggle a pull quote block on the current selection
          let node: Node | null = savedRange.commonAncestorContainer;
          if (node.nodeType === Node.TEXT_NODE) node = node.parentElement;
          const inQuote = (node as Element | null)?.closest('blockquote');
          document.execCommand('formatBlock', false, inQuote ? 'p' : 'blockquote');
          break;
        }
      }

      // Small delay before triggering save to let DOM update
      setTimeout(() => {
        if (contentRef.current) {
          contentRef.current.dispatchEvent(new Event('input', { bubbles: true }));
        }
      }, 50);
    } catch (error) {
      console.error('Error applying format:', error);
    }
  }, []);

  // Ref for hidden file input used by format bar image button
  const imageInputRef = useRef<HTMLInputElement>(null);

  const handleImageFileSelect = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    if (imageInputRef.current) imageInputRef.current.value = '';

    // Reuse the ImageUploadButton's upload logic inline
    try {
      const { supabase } = await import('@/integrations/supabase/client');
      const { default: { toast } } = await import('sonner').then(m => ({ default: m }));
      const user = (await supabase.auth.getUser()).data.user;
      if (!user) { toast.error('Please sign in to upload images'); return; }
      if (!file.type.startsWith('image/')) { toast.error('Please select an image file'); return; }
      if (file.size > 10 * 1024 * 1024) { toast.error('Image must be less than 10MB'); return; }

      // Compress
      const blob = await new Promise<Blob>((resolve, reject) => {
        const img = new Image();
        img.onload = () => {
          const canvas = document.createElement('canvas');
          let { width, height } = img;
          const max = 1600;
          if (width > max || height > max) {
            const r = Math.min(max / width, max / height);
            width *= r; height *= r;
          }
          canvas.width = width; canvas.height = height;
          const ctx = canvas.getContext('2d');
          if (!ctx) { reject(new Error('No context')); return; }
          ctx.imageSmoothingEnabled = true;
          ctx.imageSmoothingQuality = 'high';
          ctx.drawImage(img, 0, 0, width, height);
          canvas.toBlob(b => b ? resolve(b) : reject(new Error('Compress failed')), 'image/jpeg', 0.85);
        };
        img.onerror = () => reject(new Error('Load failed'));
        img.src = URL.createObjectURL(file);
      });

      const fileName = `${Date.now()}-${Math.random().toString(36).substring(7)}.jpg`;
      const filePath = `${user.id}/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from('note-images')
        .upload(filePath, blob, { contentType: 'image/jpeg' });
      if (uploadError) throw uploadError;

      const { data: signedUrlData, error: signedUrlError } = await supabase.storage
        .from('note-images')
        .createSignedUrl(filePath, 60 * 60 * 24 * 365);
      if (signedUrlError || !signedUrlData?.signedUrl) {
        toast.error('Could not generate image URL');
        return;
      }

      insertImageAtCursor(signedUrlData.signedUrl);
      toast.success('Image uploaded');
    } catch (error: any) {
      console.error('Image upload failed:', error);
      const { toast } = await import('sonner');
      toast.error(`Upload failed: ${error.message || 'Unknown error'}`);
    }
  };

  // Generate AI image from selected text
  const [isGeneratingImage, setIsGeneratingImage] = useState(false);
  const [showImageGenModal, setShowImageGenModal] = useState(false);
  const [imageGenInitialPrompt, setImageGenInitialPrompt] = useState("");

  const handleGenerateImage = async () => {
    const selection = window.getSelection();
    const selectedText = selection?.toString()?.trim();

    // Remember where the cursor is so we can insert the image there after the modal closes
    saveSelectionRange();

    // Always open the modal — pre-fill with selected text if any
    setImageGenInitialPrompt(selectedText || "");
    setShowImageGenModal(true);
  };



  return (
    <EditorErrorBoundary>
      <div className="w-full max-w-3xl mx-auto px-4 pt-8 pb-8">
        <div className="relative">
        <textarea
          data-title-input
          ref={titleRef}
          value={title}
          onChange={(e) => {
            if (isReadOnly) return;
            const newTitle = e.target.value;
            setTitle(newTitle);
            
            // Clear any existing save timeout
            if (titleSaveTimeoutRef.current) {
              clearTimeout(titleSaveTimeoutRef.current);
            }
            
            // Clear any existing inactivity timer
            if (inactivityTimerRef.current) {
              clearTimeout(inactivityTimerRef.current);
            }
            
            // Start 5-minute inactivity timer
            inactivityTimerRef.current = setTimeout(() => {
              sendInactivityNotification();
            }, 5 * 60 * 1000); // 5 minutes
            
            
            // Debounce title save (500ms delay) + notify parent for undo snapshots
            titleSaveTimeoutRef.current = setTimeout(() => {
              updateNote(note.id, { title: newTitle }, true);
              const currentContent = getEditorContent(contentRef.current);
              onNoteSaved?.(newTitle, currentContent);
            }, 500);
          }}
          placeholder="Untitled Note"
          className={`w-full text-3xl font-${titleFont} font-bold mb-3 bg-transparent border-none outline-none px-0 focus:ring-0 focus:outline-none resize-none overflow-hidden dynamic-title-font text-accent ${isReadOnly ? 'cursor-not-allowed opacity-70' : ''}`}
          readOnly={isReadOnly}
          style={{ 
            minHeight: 'auto',
            height: 'auto'
          }}
          rows={1}
          onInput={(e) => {
            const target = e.target as HTMLTextAreaElement;
            target.style.height = 'auto';
            target.style.height = target.scrollHeight + 'px';
          }}
          aria-label="Note title"
        />
        
        {note.featured_image && (
          <FeaturedImage 
            imageUrl={note.featured_image} 
            alt={note.title}
            onDelete={() => updateNote(note.id, { featured_image: null }, true)}
          />
        )}
        
        <div className="relative">
          <div
            ref={contentRef}
            contentEditable={!isReadOnly}
            className={`note-editor prose prose-sm md:prose-base max-w-none outline-none focus:outline-none pb-32 transition-colors duration-200 editor-anchor relative dynamic-body-font ${isReadOnly ? 'cursor-not-allowed opacity-70' : ''}`}
            data-placeholder={isReadOnly ? "This note is read-only" : "Just start typing…"}
            aria-label="Note content"
            onPaste={isReadOnly ? undefined : handlePaste}
            onKeyDown={isReadOnly ? undefined : (e) => {
              // Handle Cmd/Ctrl+B for bold
              if ((e.metaKey || e.ctrlKey) && e.key === 'b') {
                e.preventDefault();
                handleFormat('bold');
              }

              // Slash command menu
              if (e.key === '/' && !e.metaKey && !e.ctrlKey) {
                // Check if cursor is at the start of an empty block or line
                const selection = window.getSelection();
                if (selection && selection.rangeCount > 0) {
                  const range = selection.getRangeAt(0);
                  const node = range.startContainer;
                  const text = node.textContent || '';
                  const offset = range.startOffset;

                  // Show slash menu if at start of empty line/block or entire content is empty
                  const isEmptyBlock = text.trim() === '' || (offset === 0 && text.trim().length === 0);
                  const isStartOfLine = offset === 0;

                  if (isEmptyBlock || isStartOfLine) {
                    e.preventDefault();
                    setSlashMenuIndex(0);
                    setShowSlashMenu(true);
                    return;
                  }
                }
              }

              // Navigate slash menu with arrow keys
              if (showSlashMenu) {
                const menuItems = isSubscribed
                  ? ['h1', 'p', 'image', 'generate'] as const
                  : ['h1', 'p', 'image'] as const;
                if (e.key === 'ArrowDown') {
                  e.preventDefault();
                  setSlashMenuIndex((i) => (i + 1) % menuItems.length);
                } else if (e.key === 'ArrowUp') {
                  e.preventDefault();
                  setSlashMenuIndex((i) => (i - 1 + menuItems.length) % menuItems.length);
                } else if (e.key === 'Enter') {
                  e.preventDefault();
                  const selected = menuItems[slashMenuIndex];
                  setShowSlashMenu(false);
                  if (selected === 'image') {
                    saveSelectionRange();
                    imageInputRef.current?.click();
                  } else if (selected === 'generate') {
                    handleGenerateImage();
                  } else {
                    handleFormat(selected as FormatType);
                  }
                } else if (e.key === 'Escape' || e.key === 'Backspace') {
                  e.preventDefault();
                  setShowSlashMenu(false);
                }
              }
            }}
          />

          {/* Floating format bar - appears above selected text */}
          {!isReadOnly && (
            <>
              <FloatingFormatBar
                visible={showFloatingBar || !!arcSelection}
                onFormat={handleFormat}
                editorRef={contentRef}
                onGenerateImage={handleGenerateImage}
                isSubscribed={isSubscribed}
                arcSelection={arcSelection}
                onOpenArc={aiEnabled ? openArcInlineEditor : undefined}
                onReplaceArc={replaceArcSelection}
                onCloseArc={closeArcInlineEditor}
              />

              {/* Slash command menu - centered modal */}
              {showSlashMenu && (
                <div
                  className="fixed inset-0 z-[100] flex items-center justify-center bg-black/40 backdrop-blur-sm animate-in fade-in duration-150"
                  onMouseDown={(e) => {
                    if (e.target === e.currentTarget) {
                      e.preventDefault();
                      setShowSlashMenu(false);
                    }
                  }}
                >
                  <div
                    ref={slashMenuRef}
                    className="bg-card/95 backdrop-blur-xl border border-border/50 rounded-2xl shadow-elevated p-2 min-w-[240px] animate-in zoom-in-95 slide-in-from-bottom-4 duration-200"
                  >
                    <div className="px-3 py-2 text-xs font-medium text-muted-foreground uppercase tracking-wider">Insert block</div>
                    {[
                      { key: 'h1', label: 'Heading', icon: 'H', desc: 'Large section heading' },
                      { key: 'p', label: 'Paragraph', icon: '¶', desc: 'Plain text block' },
                      { key: 'quote', label: 'Pull quote', icon: '"', desc: 'Standout quote block' },
                      { key: 'image', label: 'Image', icon: '🖼', desc: 'Upload an image' },
                      { key: 'generate', label: 'Generate Image', icon: '🖌', desc: 'AI image from text' },
                    ].map((item, i) => (
                      <button
                        key={item.key}
                        className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-left text-sm transition-colors ${
                          i === slashMenuIndex ? 'bg-muted/80 text-foreground' : 'hover:bg-muted/50'
                        }`}
                        onMouseDown={(e) => {
                          e.preventDefault();
                          setShowSlashMenu(false);
                          if (item.key === 'image') {
                            saveSelectionRange();
                            imageInputRef.current?.click();
                          } else if (item.key === 'generate') {
                            handleGenerateImage();
                          } else {
                            handleFormat(item.key as FormatType);
                          }
                        }}
                        onMouseEnter={() => setSlashMenuIndex(i)}
                      >
                        <span className={`w-8 h-8 flex items-center justify-center rounded-lg font-semibold text-sm ${
                          i === slashMenuIndex ? 'bg-muted text-foreground' : 'bg-muted/60 text-muted-foreground'
                        }`}>
                          {item.icon}
                        </span>
                        <div>
                          <div className="font-medium">{item.label}</div>
                          <div className={`text-xs ${i === slashMenuIndex ? 'text-muted-foreground' : 'text-muted-foreground'}`}>{item.desc}</div>
                        </div>
                      </button>
                    ))}
                  </div>
                </div>
              )}

              <input
                ref={imageInputRef}
                type="file"
                accept="image/*"
                onChange={handleImageFileSelect}
                className="hidden"
                multiple={false}
              />
              <ImageGenerateModal
                isOpen={showImageGenModal}
                onClose={() => { setShowImageGenModal(false); setImageGenInitialPrompt(""); }}
                onImageGenerated={(url) => insertImageAtCursor(url)}
                initialPrompt={imageGenInitialPrompt}
              />
            </>
          )}
        </div>
        
      </div>
    </div>
    </EditorErrorBoundary>
  );
};
