import { useEffect, useRef, useState } from 'react';
import { ArrowLeft, Check, RefreshCw, Send, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { supabase } from '@/integrations/supabase/client';
import { sanitizeForDisplay } from '@/lib/sanitization';
import arcAiLogo from '@/assets/arc-ai-logo.png.asset.json';

type InlineAction = 'improve' | 'shorten' | 'lengthen' | 'fix' | 'rewrite';

const ACTIONS: { id: InlineAction; label: string }[] = [
  { id: 'improve', label: 'Improve' },
  { id: 'shorten', label: 'Shorten' },
  { id: 'lengthen', label: 'Make longer' },
  { id: 'fix', label: 'Fix writing' },
  { id: 'rewrite', label: 'Rewrite' },
];

interface ArcInlineEditorProps {
  selectedText: string;
  noteTitle: string;
  noteContext: string;
  onReplace: (replacement: string) => boolean;
  onClose: () => void;
}

const CHAT_URL = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/ai-assist`;

export function ArcInlineEditor({ selectedText, noteTitle, noteContext, onReplace, onClose }: ArcInlineEditorProps) {
  const [customMode, setCustomMode] = useState(false);
  const [instruction, setInstruction] = useState('');
  const [lastInstruction, setLastInstruction] = useState('');
  const [suggestion, setSuggestion] = useState('');
  const [status, setStatus] = useState<'choose' | 'loading' | 'preview' | 'error'>('choose');
  const [error, setError] = useState('');
  const inputRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    if (customMode) inputRef.current?.focus();
  }, [customMode]);

  useEffect(() => {
    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, [onClose]);

  const requestEdit = async (nextInstruction: string) => {
    if (!nextInstruction.trim() || status === 'loading') return;
    setLastInstruction(nextInstruction.trim());
    setStatus('loading');
    setError('');
    setSuggestion('');

    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.access_token) throw new Error('Please sign in to use Arc.');

      const response = await fetch(CHAT_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({
          inlineEdit: {
            instruction: nextInstruction.trim(),
            selectedText,
            noteTitle,
            noteContext: noteContext.slice(0, 6000),
          },
        }),
      });

      const data = await response.json().catch(() => null);
      if (!response.ok) {
        throw new Error(data?.error || data?.message || 'Arc could not edit this selection.');
      }

      const replacement = typeof data?.content === 'string' ? data.content.trim() : '';
      if (!replacement) throw new Error('Arc returned an empty suggestion.');
      setSuggestion(sanitizeForDisplay(replacement));
      setStatus('preview');
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : 'Arc could not edit this selection.');
      setStatus('error');
    }
  };

  const handleReplace = () => {
    if (onReplace(suggestion)) onClose();
    else {
      setError('The selected text changed. Select it again and retry.');
      setStatus('error');
    }
  };

  if (status === 'loading') {
    return (
      <div className="w-[min(21rem,calc(100vw-2rem))] p-4" aria-live="polite">
        <div className="flex items-center gap-3">
          <div className="relative h-9 w-9 shrink-0 rounded-full border border-accent/30 bg-accent/10 p-1.5">
            <img src={arcAiLogo.url} alt="" className="h-full w-full rounded-full object-contain animate-pulse-soft" />
            <span className="absolute inset-0 rounded-full border border-accent/40 animate-ping motion-reduce:animate-none" />
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-sm font-medium text-foreground">Arc is editing…</p>
            <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-muted">
              <div className="h-full w-1/2 animate-shimmer rounded-full bg-accent motion-reduce:animate-pulse" />
            </div>
          </div>
          <Button variant="ghost" size="icon" className="h-8 w-8" onClick={onClose} title="Cancel">
            <X className="h-4 w-4" />
          </Button>
        </div>
      </div>
    );
  }

  if (status === 'preview') {
    return (
      <div className="w-[min(23rem,calc(100vw-2rem))] p-3 animate-in fade-in zoom-in-95 duration-200">
        <div className="mb-2 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <img src={arcAiLogo.url} alt="Arc AI" className="h-6 w-6 rounded-full object-contain" />
            <span className="text-xs font-semibold text-foreground">Arc’s suggestion</span>
          </div>
          <Button variant="ghost" size="icon" className="h-7 w-7" onClick={onClose} title="Close">
            <X className="h-3.5 w-3.5" />
          </Button>
        </div>
        <div className="max-h-48 space-y-2 overflow-y-auto pr-1">
          <div className="rounded-md border border-border/40 bg-muted/35 p-2.5">
            <p className="mb-1 text-[10px] font-medium uppercase text-muted-foreground">Before</p>
            <p className="text-xs leading-relaxed text-muted-foreground line-through">{selectedText}</p>
          </div>
          <div className="rounded-md border border-accent/30 bg-accent/10 p-2.5">
            <p className="mb-1 text-[10px] font-medium uppercase text-accent">After</p>
            <div className="text-sm leading-relaxed text-foreground" dangerouslySetInnerHTML={{ __html: suggestion }} />
          </div>
        </div>
        <div className="mt-3 flex items-center justify-between gap-2">
          <Button variant="ghost" size="sm" onClick={() => requestEdit(lastInstruction)} className="h-8 px-2.5 text-xs">
            <RefreshCw className="h-3.5 w-3.5" /> Try again
          </Button>
          <Button size="sm" onClick={handleReplace} className="h-8 px-3 text-xs">
            <Check className="h-3.5 w-3.5" /> Replace
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="w-[min(21rem,calc(100vw-2rem))] p-3 animate-in fade-in zoom-in-95 duration-200">
      <div className="mb-2.5 flex items-center justify-between">
        <div className="flex items-center gap-2">
          {customMode && (
            <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => setCustomMode(false)} title="Back">
              <ArrowLeft className="h-3.5 w-3.5" />
            </Button>
          )}
          <img src={arcAiLogo.url} alt="Arc AI" className="h-6 w-6 rounded-full object-contain" />
          <span className="text-xs font-semibold text-foreground">Edit with Arc</span>
        </div>
        <Button variant="ghost" size="icon" className="h-7 w-7" onClick={onClose} title="Close">
          <X className="h-3.5 w-3.5" />
        </Button>
      </div>

      {status === 'error' && (
        <p className="mb-2 rounded-md border border-destructive/30 bg-destructive/10 px-2.5 py-2 text-xs text-destructive">{error}</p>
      )}

      {customMode ? (
        <form
          onSubmit={(event) => {
            event.preventDefault();
            requestEdit(instruction);
          }}
          className="space-y-2"
        >
          <textarea
            ref={inputRef}
            value={instruction}
            onChange={(event) => setInstruction(event.target.value)}
            onKeyDown={(event) => {
              if (event.key === 'Enter' && !event.shiftKey) {
                event.preventDefault();
                requestEdit(instruction);
              }
            }}
            placeholder="Tell Arc what to change…"
            rows={2}
            className="w-full resize-none rounded-md border border-border bg-background px-3 py-2 text-sm text-foreground outline-none transition-colors placeholder:text-muted-foreground focus:border-accent focus:ring-1 focus:ring-accent"
          />
          <div className="flex justify-end">
            <Button type="submit" size="icon" className="h-8 w-8" disabled={!instruction.trim()} title="Ask Arc">
              <Send className="h-3.5 w-3.5" />
            </Button>
          </div>
        </form>
      ) : (
        <div className="grid grid-cols-2 gap-1.5">
          {ACTIONS.map((action) => (
            <Button
              key={action.id}
              variant="secondary"
              size="sm"
              className="h-8 justify-start px-3 text-xs"
              onClick={() => requestEdit(action.id)}
            >
              {action.label}
            </Button>
          ))}
          <Button variant="outline" size="sm" className="h-8 justify-start px-3 text-xs" onClick={() => setCustomMode(true)}>
            Custom…
          </Button>
        </div>
      )}
    </div>
  );
}