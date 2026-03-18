import { useState, useCallback, useRef } from 'react';

interface UndoRedoSnapshot {
  title: string;
  content: string;
}

/**
 * Simple undo/redo hook that tracks note state snapshots.
 * Call `pushSnapshot` each time the note auto-saves to capture a state.
 * Call `undo`/`redo` to navigate through the history.
 */
export function useUndoRedo(initialTitle: string, initialContent: string) {
  // History stacks stored as refs to avoid re-render loops
  const undoStackRef = useRef<UndoRedoSnapshot[]>([{ title: initialTitle, content: initialContent }]);
  const redoStackRef = useRef<UndoRedoSnapshot[]>([]);
  const currentIndexRef = useRef(0);
  const isRestoringRef = useRef(false);
  const [, forceUpdate] = useState(0);

  const pushSnapshot = useCallback((title: string, content: string) => {
    // Don't push if we're currently restoring from undo/redo
    if (isRestoringRef.current) return;

    const stack = undoStackRef.current;
    const currentIdx = currentIndexRef.current;

    // Don't push duplicate states
    if (stack.length > 0) {
      const current = stack[currentIdx];
      if (current && current.title === title && current.content === content) return;
    }

    // If we're not at the end of the stack (user undid then typed), trim future
    if (currentIdx < stack.length - 1) {
      undoStackRef.current = stack.slice(0, currentIdx + 1);
    }

    undoStackRef.current.push({ title, content });
    currentIndexRef.current = undoStackRef.current.length - 1;
    redoStackRef.current = [];

    // Keep stack reasonable size (max 50 snapshots)
    if (undoStackRef.current.length > 50) {
      undoStackRef.current = undoStackRef.current.slice(-50);
      currentIndexRef.current = undoStackRef.current.length - 1;
    }

    forceUpdate(n => n + 1);
  }, []);

  const undo = useCallback((): UndoRedoSnapshot | null => {
    const stack = undoStackRef.current;
    const currentIdx = currentIndexRef.current;

    if (currentIdx <= 0) return null;

    // Move back one step
    const previousState = stack[currentIdx - 1];
    redoStackRef.current.push(stack[currentIdx]);
    currentIndexRef.current = currentIdx - 1;
    isRestoringRef.current = true;

    // Reset restoring flag after a tick to allow the save to complete
    setTimeout(() => { isRestoringRef.current = false; }, 1000);

    forceUpdate(n => n + 1);
    return previousState;
  }, []);

  const redo = useCallback((): UndoRedoSnapshot | null => {
    const redoStack = redoStackRef.current;

    if (redoStack.length === 0) return null;

    const nextState = redoStack.pop()!;
    currentIndexRef.current += 1;
    isRestoringRef.current = true;

    setTimeout(() => { isRestoringRef.current = false; }, 1000);

    forceUpdate(n => n + 1);
    return nextState;
  }, []);

  const canUndo = currentIndexRef.current > 0;
  const canRedo = redoStackRef.current.length > 0;

  const clearHistory = useCallback(() => {
    undoStackRef.current = [];
    redoStackRef.current = [];
    currentIndexRef.current = 0;
    forceUpdate(n => n + 1);
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
