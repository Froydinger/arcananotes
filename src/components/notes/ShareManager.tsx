// This file is replaced by SimpleShareManager.tsx
// Keeping for compatibility but all functionality moved to SimpleShareManager

import React from 'react';
import { SimpleShareManager } from './SimpleShareManager';
import type { NoteWithSharing } from '@/types/sharing';

interface ShareManagerProps {
  isOpen: boolean;
  onClose: () => void;
  note: NoteWithSharing;
  onShareUpdate?: () => void;
}

export function ShareManager(props: ShareManagerProps) {
  return <SimpleShareManager {...props} />;
}