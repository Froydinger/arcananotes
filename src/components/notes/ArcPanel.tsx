import { useState, useRef, useEffect, useCallback, CSSProperties } from 'react';
import { X, ArrowRight, Plus, Trash2, MessageSquare, ChevronLeft } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import { toast } from '@/components/ui/sonner';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useLocation } from 'react-router-dom';
import { cn } from '@/lib/utils';
import arcLogo from '@/assets/arc-logo.png';

interface ArcPanelProps {
  noteId?: string;
  noteContent?: string;
  noteTitle?: string;
  onContentReplace?: (content: string) => void;
  onTitleReplace?: (title: string) => void;
  onCreateNote?: (content: string, title: string) => void;
  onCreateChecklist?: (title: string, items: { content: string; completed: boolean }[]) => void;
}

type Message = { role: 'user' | 'assistant'; content: string };

type Conversation = {
  id: string;
  title: string;
  messages: Message[];
  created_at: string;
  updated_at: string;
};

const SUGGEST_PROMPTS = [
  "Write me a completely fresh, original note I haven't seen before. Surprise me with the topic and angle. Give me just the note text, ready to use.",
  "Generate a unique note on an unexpected topic. Be creative and avoid common themes. Give me just the note text.",
  "Create a note with a fresh perspective — pick an unusual angle no one else is writing about. Give me just the note text.",
  "Write a note that would make someone stop and think. Pick a topic and take a bold stance. Give me just the note text.",
  "Craft an original note about something counterintuitive or surprising. Avoid clichés. Give me just the note text.",
];

const getRandomSuggestPrompt = () => SUGGEST_PROMPTS[Math.floor(Math.random() * SUGGEST_PROMPTS.length)];

const QUICK_PROMPTS = [
  { label: 'Suggest a Note', prompt: '' as string, dynamic: true },
  { label: 'Improve Writing', prompt: 'Improve this note to be more engaging and well-structured. Keep the original voice.', requiresContent: true },
  { label: 'Make it Shorter', prompt: 'Make this note more concise while keeping its core message.', requiresContent: true },
  { label: 'Fix Grammar', prompt: 'Fix any grammar, spelling, or punctuation errors in this text.', requiresContent: true },
];

const CHAT_URL = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/ai-assist`;

export function ArcPanel({ noteId, noteContent = '', noteTitle = '', onContentReplace, onTitleReplace, onCreateNote, onCreateChecklist }: ArcPanelProps) {
  const { user } = useAuth();
  const location = useLocation();
  const isNotePage = location.pathname.startsWith('/note/');
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [showHistory, setShowHistory] = useState(false);
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [activeConvoId, setActiveConvoId] = useState<string | null>(null);
  const [vpStyle, setVpStyle] = useState<CSSProperties>({});
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  useEffect(() => {
    if (inputRef.current) {
      inputRef.current.style.height = 'auto';
      inputRef.current.style.height = Math.min(inputRef.current.scrollHeight, 80) + 'px';
    }
  }, [input]);

  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => { document.body.style.overflow = ''; };
  }, [isOpen]);

  // Keep overlay anchored when mobile keyboard opens
  useEffect(() => {
    if (!isOpen || typeof window === 'undefined' || !window.visualViewport) return;
    const update = () => {
      const vp = window.visualViewport!;
      setVpStyle({ top: vp.offsetTop, height: vp.height });
    };
    update();
    window.visualViewport.addEventListener('resize', update);
    window.visualViewport.addEventListener('scroll', update);
    return () => {
      window.visualViewport!.removeEventListener('resize', update);
      window.visualViewport!.removeEventListener('scroll', update);
      setVpStyle({});
    };
  }, [isOpen]);

  // Reset chat when switching notes
  useEffect(() => {
    setMessages([]);
    setActiveConvoId(null);
    setShowHistory(false);
    if (isOpen && user) loadConversations();
  }, [noteId]);

  useEffect(() => {
    if (isOpen && user) loadConversations();
  }, [isOpen, user]);

  const loadConversations = async () => {
    if (!user) return;
    let query = supabase
      .from('arc_conversations')
      .select('*')
      .order('updated_at', { ascending: false });

    if (noteId) {
      query = query.eq('note_id', noteId);
    } else {
      query = query.is('note_id', null);
    }

    const { data } = await query;
    if (data) {
      setConversations(data.map(c => ({
        ...c,
        messages: (c.messages as any) as Message[],
      })));
    }
  };

  const saveConversation = useCallback(async (msgs: Message[], convoId: string | null) => {
    if (!user || msgs.length === 0) return;
    const firstUserMsg = msgs.find(m => m.role === 'user');
    const title = firstUserMsg
      ? firstUserMsg.content.substring(0, 60) + (firstUserMsg.content.length > 60 ? '...' : '')
      : 'New chat';

    if (convoId) {
      await supabase
        .from('arc_conversations')
        .update({ messages: msgs as any, title, updated_at: new Date().toISOString() })
        .eq('id', convoId);
    } else {
      const { data } = await supabase
        .from('arc_conversations')
        .insert({ user_id: user.id, messages: msgs as any, title, note_id: noteId || null })
        .select('id')
        .single();
      if (data) {
        setActiveConvoId(data.id);
        return data.id;
      }
    }
    return convoId;
  }, [user, noteId]);

  const handleNewChat = () => {
    setMessages([]);
    setInput('');
    setIsLoading(false);
    setActiveConvoId(null);
    setShowHistory(false);
  };

  const handleLoadConvo = (convo: Conversation) => {
    setMessages(convo.messages);
    setActiveConvoId(convo.id);
    setShowHistory(false);
  };

  const handleDeleteConvo = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    await supabase.from('arc_conversations').delete().eq('id', id);
    setConversations(prev => prev.filter(c => c.id !== id));
    if (activeConvoId === id) handleNewChat();
    toast.success('Chat deleted');
  };

  const streamChat = async (userMessage: string, includeContext = true) => {
    const userMsg: Message = { role: 'user', content: userMessage };

    let contextMessage = userMessage;
    if (includeContext && noteContent.trim()) {
      contextMessage = `${userMessage}\n\nCurrent note title: "${noteTitle}"\nCurrent note content: "${noteContent.replace(/<[^>]*>/g, '')}"`;
    }

    const newMessages = [...messages, userMsg];
    setMessages(newMessages);
    setIsLoading(true);

    let assistantContent = '';

    try {
      const apiMessages = newMessages.map((m, i) =>
        i === newMessages.length - 1 && m.role === 'user'
          ? { role: 'user' as const, content: contextMessage }
          : { role: m.role as 'user' | 'assistant', content: m.content }
      );

      const resp = await fetch(CHAT_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
        },
        body: JSON.stringify({ messages: apiMessages, stream: true }),
      });

      if (resp.status === 429) {
        const data = await resp.json().catch(() => null);
        if (data?.limit_reached) {
          toast.error('Daily AI limit reached (20/day). Upgrade to Arcana Notes Pro for unlimited!', { duration: 5000 });
        } else {
          toast.error('Rate limit reached. Try again in a moment.');
        }
        setIsLoading(false);
        return;
      }
      if (resp.status === 402) { toast.error('AI credits exhausted.'); setIsLoading(false); return; }

      if (!resp.ok) {
        const data = await resp.json().catch(() => null);
        if (data?.content) {
          const finalMsgs = [...newMessages, { role: 'assistant' as const, content: data.content }];
          setMessages(finalMsgs);
          setIsLoading(false);
          const id = await saveConversation(finalMsgs, activeConvoId);
          if (id) setActiveConvoId(id);
          loadConversations();
          return;
        }
        throw new Error('AI request failed');
      }

      const contentType = resp.headers.get('content-type') || '';
      if (contentType.includes('text/event-stream') && resp.body) {
        const reader = resp.body.getReader();
        const decoder = new TextDecoder();
        let textBuffer = '';
        let streamDone = false;

        setMessages(prev => [...prev, { role: 'assistant', content: '' }]);

        while (!streamDone) {
          const { done, value } = await reader.read();
          if (done) break;
          textBuffer += decoder.decode(value, { stream: true });

          let newlineIndex: number;
          while ((newlineIndex = textBuffer.indexOf('\n')) !== -1) {
            let line = textBuffer.slice(0, newlineIndex);
            textBuffer = textBuffer.slice(newlineIndex + 1);
            if (line.endsWith('\r')) line = line.slice(0, -1);
            if (line.startsWith(':') || line.trim() === '') continue;
            if (!line.startsWith('data: ')) continue;
            const jsonStr = line.slice(6).trim();
            if (jsonStr === '[DONE]') { streamDone = true; break; }
            try {
              const parsed = JSON.parse(jsonStr);
              const content = parsed.choices?.[0]?.delta?.content as string | undefined;
              if (content) {
                assistantContent += content;
                setMessages(prev => {
                  const updated = [...prev];
                  updated[updated.length - 1] = { role: 'assistant', content: assistantContent };
                  return updated;
                });
              }
            } catch {
              textBuffer = line + '\n' + textBuffer;
              break;
            }
          }
        }
        if (textBuffer.trim()) {
          const remainingLine = textBuffer.trim();
          if (remainingLine.startsWith('data: ') && remainingLine.slice(6).trim() !== '[DONE]') {
            try {
              const parsed = JSON.parse(remainingLine.slice(6).trim());
              const content = parsed.choices?.[0]?.delta?.content as string | undefined;
              if (content) {
                assistantContent += content;
                setMessages(prev => {
                  const updated = [...prev];
                  updated[updated.length - 1] = { role: 'assistant', content: assistantContent };
                  return updated;
                });
              }
            } catch { /* ignore */ }
          }
        }
        const finalMsgs = [...newMessages, { role: 'assistant' as const, content: assistantContent }];
        const id = await saveConversation(finalMsgs, activeConvoId);
        if (id) setActiveConvoId(id);
        loadConversations();
      } else {
        const data = await resp.json();
        const aiText = data.content || data.choices?.[0]?.message?.content || '';
        const finalMsgs = [...newMessages, { role: 'assistant' as const, content: aiText }];
        setMessages(finalMsgs);
        const id = await saveConversation(finalMsgs, activeConvoId);
        if (id) setActiveConvoId(id);
        loadConversations();
      }
    } catch (error) {
      console.error('Arc error:', error);
      setMessages(prev => [
        ...prev.filter(m => !(m.role === 'assistant' && m.content === '')),
        { role: 'assistant', content: 'Something went wrong. Please try again.' },
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || isLoading) return;
    streamChat(input.trim());
    setInput('');
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSubmit(e); }
  };

  const handleQuickPrompt = (prompt: typeof QUICK_PROMPTS[number]) => {
    const includeContext = prompt.requiresContent !== undefined;
    const text = (prompt as any).dynamic ? getRandomSuggestPrompt() : prompt.prompt;
    streamChat(text, includeContext);
  };

  const formatToHtml = (text: string): string => {
    const applyInline = (s: string) => s
      .replace(/\*\*\*(.+?)\*\*\*/g, '<b><i>$1</i></b>')
      .replace(/\*\*(.+?)\*\*/g, '<b>$1</b>')
      .replace(/\*(.+?)\*/g, '<i>$1</i>');
    const lines = text.split('\n');
    const blocks: string[] = [];
    let paraLines: string[] = [];
    const flushPara = () => {
      if (paraLines.length > 0) {
        blocks.push(`<p>${paraLines.join('<br>')}</p>`);
        paraLines = [];
      }
    };
    for (const line of lines) {
      if (line.trim() === '') {
        flushPara();
      } else if (/^#{1,3}\s/.test(line)) {
        flushPara();
        const tag = line.startsWith('### ') ? 'h3' : 'h2';
        blocks.push(`<${tag}>${applyInline(line.replace(/^#+\s/, '').trim())}</${tag}>`);
      } else if (line.startsWith('> ')) {
        flushPara();
        blocks.push(`<blockquote>${applyInline(line.slice(2).trim())}</blockquote>`);
      } else {
        paraLines.push(applyInline(line));
      }
    }
    flushPara();
    return blocks.join('');
  };

  const extractNoteContent = (content: string): string => {
    return content
      .replace(/^(here'?s?\s+(a|your|the)\s+.*?[:\n]|sure[!,.]?\s*.*?[:\n]|absolutely[!,.]?\s*.*?[:\n])/i, '')
      .replace(/\n*(remember,?\s+i'?m?\s+just\s+arc.*$)/i, '')
      .replace(/\n*(---\n*.*$)/s, '')
      .replace(/\n*(tips?:.*$)/is, '')
      .replace(/\n*(note:.*$)/is, '')
      .trim();
  };

  const isChecklistResponse = (text: string): boolean => {
    const lines = text.split('\n').filter(l => l.trim());
    const checklistLines = lines.filter(l => /^-\s*\[([ x])\]\s+/.test(l.trim()));
    return checklistLines.length >= 2;
  };

  const parseChecklist = (text: string): { title: string; items: { content: string; completed: boolean }[] } => {
    const lines = text.split('\n').filter(l => l.trim());
    let title = '';
    const items: { content: string; completed: boolean }[] = [];
    for (const line of lines) {
      const match = line.trim().match(/^-\s*\[([ x])\]\s+(.+)/);
      if (match) {
        items.push({ content: match[2].trim(), completed: match[1] === 'x' });
      } else if (!title && items.length === 0) {
        title = line.replace(/^#+\s*/, '').replace(/\*+/g, '').trim();
      }
    }
    return { title: title || 'Checklist', items };
  };

  const applyToNote = (content: string) => {
    const noteOnly = extractNoteContent(content);

    // Check if this is a checklist response
    if (isChecklistResponse(noteOnly) && onCreateChecklist) {
      const { title, items } = parseChecklist(noteOnly);
      onCreateChecklist(title, items);
      toast.success('Checklist created from Arc');
      return;
    }

    const html = formatToHtml(noteOnly);
    if (onContentReplace) {
      onContentReplace(html);
      toast.success('Applied to note');
    } else if (onCreateNote) {
      const firstLine = noteOnly.split('\n')[0].replace(/\*+/g, '').trim();
      const title = firstLine.length > 60 ? firstLine.substring(0, 57) + '...' : firstLine;
      onCreateNote(html, title);
      toast.success('Note created from Arc');
    }
  };

  const getApplyLabel = (content: string): string => {
    if (onContentReplace) return 'Apply to Note';
    const noteOnly = extractNoteContent(content);
    if (isChecklistResponse(noteOnly) && onCreateChecklist) return 'Create Checklist';
    return 'Create Note';
  };

  const mdComponents = {
    p: ({ children }: any) => <p className="mb-2 last:mb-0 leading-relaxed">{children}</p>,
    strong: ({ children }: any) => <strong className="font-semibold text-accent">{children}</strong>,
    em: ({ children }: any) => <em className="italic opacity-85">{children}</em>,
    ul: ({ children }: any) => <ul className="list-disc list-inside mb-2 space-y-1">{children}</ul>,
    ol: ({ children }: any) => <ol className="list-decimal list-inside mb-2 space-y-1">{children}</ol>,
    li: ({ children }: any) => <li className="opacity-90">{children}</li>,
    code: ({ children }: any) => (
      <code className="px-1.5 py-0.5 rounded text-xs font-mono bg-accent/10 text-accent">
        {children}
      </code>
    ),
    a: ({ href, children }: any) => (
      <a href={href} target="_blank" rel="noopener noreferrer" className="text-accent hover:underline">{children}</a>
    ),
    blockquote: ({ children }: any) => (
      <blockquote className="pl-3 italic my-2 opacity-80 border-l-2 border-accent">{children}</blockquote>
    ),
  };

  return (
    <>
      {/* FAB Button */}
      {!isOpen && (
        <button
          onClick={() => setIsOpen(true)}
          className="fixed right-5 bottom-5 z-[60] group"
          aria-label="Chat with Arc"
        >
          <div
            className="relative w-14 h-14 rounded-full flex items-center justify-center transition-all duration-300 group-hover:scale-110 bg-background/85 backdrop-blur-xl border border-accent/30"
            style={{
              boxShadow: '0 4px 24px hsla(var(--accent) / 0.15), 0 0 0 1px hsla(var(--accent) / 0.1)',
            }}
          >
            <img src={arcLogo} alt="Arc" className="h-8 w-8 rounded-full object-cover" />
            <div className="absolute inset-0 rounded-full animate-ping opacity-20 border border-accent" />
          </div>
        </button>
      )}

      {/* Overlay */}
      {isOpen && (
        <div
          className="fixed left-0 right-0 z-[9999] flex items-end justify-center bg-black/60 backdrop-blur-sm animate-in fade-in duration-200"
          style={{ top: vpStyle.top ?? 0, height: vpStyle.height ?? '100dvh' }}
          onClick={(e) => { if (e.target === e.currentTarget) setIsOpen(false); }}
        >
          <div
            className="w-full max-w-lg flex flex-col animate-in slide-in-from-bottom duration-300 rounded-t-[20px] bg-card border border-border/50 border-b-0"
            style={{
              height: 'min(70vh, 600px)',
              boxShadow: '0 -25px 60px rgba(0, 0, 0, 0.5)',
            }}
          >
            {/* Header */}
            <div className="flex items-center justify-between px-5 py-3.5 shrink-0 bg-muted/50 rounded-t-[20px] border-b border-border/30">
              <div className="flex items-center gap-2.5">
                {showHistory ? (
                  <button onClick={() => setShowHistory(false)} className="w-7 h-7 rounded-full flex items-center justify-center bg-muted text-muted-foreground">
                    <ChevronLeft className="h-3.5 w-3.5" />
                  </button>
                ) : (
                  <div className="relative">
                    <div className="w-7 h-7 rounded-full flex items-center justify-center bg-accent/10 border border-accent/20">
                      <img src={arcLogo} alt="Arc" className="h-5 w-5 rounded-full object-cover" />
                    </div>
                    <div className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 rounded-full border-2 border-card bg-green-500" />
                  </div>
                )}
                <div className="flex flex-col">
                  <span className="text-sm font-semibold tracking-tight text-foreground">
                    {showHistory ? 'Chat History' : <><span className="font-light">Arc</span> AI</>}
                  </span>
                  {!showHistory && (
                    <span className="text-[10px] leading-none text-muted-foreground">
                      Your writing assistant
                    </span>
                  )}
                </div>
              </div>
              <div className="flex items-center gap-1.5">
                {!showHistory && (
                  <button onClick={() => setShowHistory(true)} className="w-7 h-7 rounded-full flex items-center justify-center bg-muted/80 text-muted-foreground hover:scale-110 transition-all" title="Chat history">
                    <MessageSquare className="h-3.5 w-3.5" />
                  </button>
                )}
                {!showHistory && messages.length > 0 && (
                  <button onClick={handleNewChat} className="w-7 h-7 rounded-full flex items-center justify-center bg-muted/80 text-muted-foreground hover:scale-110 transition-all" title="New chat">
                    <Plus className="h-3.5 w-3.5" />
                  </button>
                )}
                <button onClick={() => setIsOpen(false)} className="w-7 h-7 rounded-full flex items-center justify-center bg-muted/80 text-muted-foreground hover:scale-110 transition-all">
                  <X className="h-3.5 w-3.5" />
                </button>
              </div>
            </div>

            {showHistory ? (
              <div className="flex-1 overflow-y-auto px-4 py-3 space-y-2" style={{ scrollbarWidth: 'thin' }}>
                {conversations.length === 0 ? (
                  <div className="flex flex-col items-center justify-center h-full text-center">
                    <MessageSquare className="h-8 w-8 mb-3 opacity-20 text-muted-foreground" />
                    <p className="text-xs text-muted-foreground">No chat history yet</p>
                  </div>
                ) : (
                  conversations.map(convo => (
                    <button
                      key={convo.id}
                      onClick={() => handleLoadConvo(convo)}
                      className="w-full text-left px-4 py-3 rounded-xl transition-all duration-200 hover:scale-[1.01] flex items-center gap-3 group bg-muted/40 border border-border/30 hover:border-accent/20"
                    >
                      <div className="flex-1 min-w-0">
                        <p className="text-[13px] font-medium truncate text-foreground">{convo.title || 'Untitled chat'}</p>
                        <p className="text-[10px] mt-0.5 text-muted-foreground">
                          {convo.messages.length} messages · {new Date(convo.updated_at).toLocaleDateString()}
                        </p>
                      </div>
                      <button
                        onClick={(e) => handleDeleteConvo(convo.id, e)}
                        className="opacity-0 group-hover:opacity-100 w-6 h-6 rounded-full flex items-center justify-center shrink-0 transition-all hover:scale-110 bg-destructive/15 text-destructive"
                        title="Delete chat"
                      >
                        <Trash2 className="h-3 w-3" />
                      </button>
                    </button>
                  ))
                )}
              </div>
            ) : (
              <>
                {/* Messages */}
                <div className="flex-1 overflow-y-auto px-4 py-3 space-y-3" style={{ scrollbarWidth: 'thin' }}>
                  {messages.length === 0 ? (
                    <div className="flex flex-col items-center justify-center h-full text-center px-4 gap-4">
                      <div className="w-16 h-16 rounded-2xl flex items-center justify-center bg-accent/10 border border-accent/15">
                        <img src={arcLogo} alt="Arc" className="h-10 w-10 rounded-full object-cover" />
                      </div>
                      <div>
                        <p className="text-sm font-medium mb-1 text-foreground">
                          Hey! I'm <span className="text-accent">Arc</span>.
                        </p>
                        <p className="text-xs leading-relaxed text-muted-foreground">
                          Your writing assistant. I'll help you brainstorm, edit, and craft great notes.
                        </p>
                      </div>
                      <div className="flex flex-wrap justify-center gap-1.5 mt-2">
                        {QUICK_PROMPTS.map((p) => (
                          <button
                            key={p.label}
                            onClick={() => handleQuickPrompt(p)}
                            disabled={isLoading || (p.requiresContent && !noteContent.trim())}
                            className="px-3 py-1.5 rounded-full text-[11px] font-medium transition-all duration-200 hover:scale-105 disabled:opacity-40 disabled:cursor-not-allowed bg-muted border border-border/50 text-muted-foreground hover:border-accent/30"
                          >
                            {p.label}
                          </button>
                        ))}
                      </div>
                    </div>
                  ) : (
                    messages.map((msg, i) => (
                      <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                        {msg.role === 'assistant' && (
                          <div className="w-6 h-6 rounded-full shrink-0 mr-2 mt-1 flex items-center justify-center bg-accent/10 border border-accent/20">
                            <img src={arcLogo} alt="Arc" className="h-4 w-4 rounded-full object-cover" />
                          </div>
                        )}
                        <div
                          className={`max-w-[80%] px-3.5 py-2.5 text-[13px] leading-relaxed ${
                            msg.role === 'user'
                              ? 'rounded-[18px] rounded-br-md bg-accent text-accent-foreground shadow-md'
                              : 'rounded-[18px] rounded-bl-md bg-muted text-foreground border border-border/30'
                          }`}
                        >
                          {msg.role === 'assistant' ? (
                            <>
                              <ReactMarkdown components={mdComponents}>{msg.content}</ReactMarkdown>
                              {!isLoading && msg.content && i === messages.length - 1 && (
                                <button
                                  onClick={() => applyToNote(msg.content)}
                                  className="mt-2 px-3 py-1 rounded-full text-[10px] font-medium transition-all hover:scale-105 bg-accent/15 border border-accent/25 text-accent"
                                >
                                  {getApplyLabel(msg.content)}
                                </button>
                              )}
                            </>
                          ) : (
                            msg.content
                          )}
                        </div>
                      </div>
                    ))
                  )}
                  {isLoading && messages[messages.length - 1]?.role === 'user' && (
                    <div className="flex justify-start">
                      <div className="w-6 h-6 rounded-full shrink-0 mr-2 mt-1 flex items-center justify-center bg-accent/10 border border-accent/20">
                        <img src={arcLogo} alt="Arc" className="h-4 w-4 rounded-full object-cover" />
                      </div>
                      <div className="px-3.5 py-2.5 rounded-[18px] rounded-bl-md bg-muted border border-border/30">
                        <div className="flex items-center gap-1.5">
                          <div className="flex gap-1">
                            <span className="w-1.5 h-1.5 rounded-full bg-accent animate-bounce" style={{ animationDelay: '0ms' }} />
                            <span className="w-1.5 h-1.5 rounded-full bg-accent animate-bounce" style={{ animationDelay: '150ms' }} />
                            <span className="w-1.5 h-1.5 rounded-full bg-accent animate-bounce" style={{ animationDelay: '300ms' }} />
                          </div>
                        </div>
                      </div>
                    </div>
                  )}
                  <div ref={messagesEndRef} />
                </div>

                {/* Input */}
                <form onSubmit={handleSubmit} className="px-3 pt-2 pb-[max(16px,env(safe-area-inset-bottom))] shrink-0">
                  <div className="flex items-end gap-2 rounded-full px-3 bg-background/85 backdrop-blur-xl border border-border/50 shadow-lg">
                    <textarea
                      ref={inputRef}
                      value={input}
                      onChange={(e) => setInput(e.target.value)}
                      onKeyDown={handleKeyDown}
                      placeholder="Message Arc..."
                      disabled={isLoading}
                      rows={1}
                      className="flex-1 bg-transparent border-none outline-none resize-none text-[16px] sm:text-[14px] py-2.5 leading-5 placeholder:opacity-40 text-foreground"
                      style={{ minHeight: '36px', maxHeight: '80px', scrollbarWidth: 'none' }}
                    />
                    <button
                      type="submit"
                      disabled={isLoading || !input.trim()}
                      className={`shrink-0 w-9 h-9 rounded-full flex items-center justify-center my-1 transition-all duration-200 ${
                        input.trim()
                          ? 'bg-accent text-accent-foreground shadow-md cursor-pointer'
                          : 'bg-muted text-muted-foreground cursor-not-allowed'
                      }`}
                    >
                      <ArrowRight className="h-4 w-4" />
                    </button>
                  </div>
                </form>
              </>
            )}
          </div>
        </div>
      )}
    </>
  );
}
