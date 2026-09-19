import { useState, useCallback, useRef } from 'react';

interface UndoRedoSnapshot {
  title: string;
  content: string;
}

const MAX_HISTORY = 100;

/**
 * Index-based undo/redo history (single timeline + pointer), the standard model
 * used by editors. Every meaningful state change — typing auto-saves, AI applies,
 * image inserts — should call `pushSnapshot`. Undo/redo move the pointer along the
 * timeline instead of juggling two separate stacks.
 */
export function useUndoRedo(initialTitle: string, initialContent: string) {
  const stackRef = useRef<UndoRedoSnapshot[]>([{ title: initialTitle, content: initialContent }]);
  const indexRef = useRef(0);
  const isRestoringRef = useRef(false);
  const restoreTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [, forceUpdate] = useState(0);

  const pushSnapshot = useCallback((title: string, content: string) => {
    // Ignore snapshots produced by applying an undo/redo result
    if (isRestoringRef.current) return;

    const stack = stackRef.current;
    const current = stack[indexRef.current];
    if (current && current.title === title && current.content === content) return;

    // Drop any redo future once a new change lands
    const trimmed = stack.slice(0, indexRef.current + 1);
    trimmed.push({ title, content });

    // Cap history size, keeping the most recent states
    const overflow = Math.max(0, trimmed.length - MAX_HISTORY);
    stackRef.current = overflow ? trimmed.slice(overflow) : trimmed;
    indexRef.current = stackRef.current.length - 1;

    forceUpdate((n) => n + 1);
  }, []);

  const beginRestore = useCallback(() => {
    isRestoringRef.current = true;
    if (restoreTimerRef.current) clearTimeout(restoreTimerRef.current);
    restoreTimerRef.current = setTimeout(() => {
      isRestoringRef.current = false;
    }, 1200);
  }, []);

  const undo = useCallback((): UndoRedoSnapshot | null => {
    if (indexRef.current <= 0) return null;
    indexRef.current -= 1;
    beginRestore();
    forceUpdate((n) => n + 1);
    return stackRef.current[indexRef.current];
  }, [beginRestore]);

  const redo = useCallback((): UndoRedoSnapshot | null => {
    if (indexRef.current >= stackRef.current.length - 1) return null;
    indexRef.current += 1;
    beginRestore();
    forceUpdate((n) => n + 1);
    return stackRef.current[indexRef.current];
  }, [beginRestore]);

  const canUndo = indexRef.current > 0;
  const canRedo = indexRef.current < stackRef.current.length - 1;

  /** Reset the timeline, seeded with the state the note currently has. */
  const clearHistory = useCallback((title = '', content = '') => {
    stackRef.current = [{ title, content }];
    indexRef.current = 0;
    isRestoringRef.current = false;
    if (restoreTimerRef.current) clearTimeout(restoreTimerRef.current);
    forceUpdate((n) => n + 1);
  }, []);

  return {
    pushSnapshot,
    undo,
    redo,
    canUndo,
    canRedo,
    clearHistory,
  };
}
