import { useState, useEffect } from 'react';
import { Type, Heading1, Bold, Italic, TextQuote, Sparkles } from 'lucide-react';
import arcLogo from '@/assets/arc-logo.png';

const ORIGINAL_LINES = [
  "I started writing because I needed somewhere to put the noise in my head.",
  "Not for an audience. Not for engagement. Just for me.",
  "Somewhere along the way, the noise became music.",
];

const AI_REWRITE =
  "I didn't start writing for anyone else.\n\nThe thoughts were too loud to keep inside, so I poured them onto a page — messy, unfiltered, mine.\n\nNo strategy. No audience in mind. Just a quiet place to think out loud.";

const FakeNoteEditor = () => {
  const [showAI, setShowAI] = useState(false);
  const [aiText, setAiText] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [showFormatBar, setShowFormatBar] = useState(false);
  const [cycle, setCycle] = useState(0);

  useEffect(() => {
    const t1 = setTimeout(() => setShowFormatBar(true), 2200);
    const t2 = setTimeout(() => {
      setShowFormatBar(false);
      setShowAI(true);
      setIsTyping(true);
      setAiText('');
    }, 3800);
    return () => { clearTimeout(t1); clearTimeout(t2); };
  }, [cycle]);

  useEffect(() => {
    if (!isTyping) return;
    let i = 0;
    const iv = setInterval(() => {
      if (i < AI_REWRITE.length) {
        setAiText(AI_REWRITE.slice(0, i + 1));
        i++;
      } else {
        clearInterval(iv);
        setIsTyping(false);
        setTimeout(() => {
          setShowAI(false);
          setAiText('');
          setCycle(c => c + 1);
        }, 5000);
      }
    }, 22);
    return () => clearInterval(iv);
  }, [isTyping]);

  return (
    <div className="relative w-full max-w-3xl mx-auto">
      <div className="rounded-2xl overflow-hidden border border-border/60 bg-card/80 backdrop-blur-xl relative z-10 shadow-elevated-lg">
        {/* Title bar */}
        <div className="h-10 bg-muted/40 flex items-center px-4 border-b border-border/40">
          <div className="flex space-x-1.5">
            <div className="w-3 h-3 rounded-full bg-destructive/50" />
            <div className="w-3 h-3 rounded-full bg-accent/40" />
            <div className="w-3 h-3 rounded-full bg-accent/25" />
          </div>
          <div className="flex-1 text-center text-xs text-muted-foreground font-medium">
            Arcana Notes™
          </div>
          <div className="w-10" />
        </div>

        {/* Editor */}
        <div className="relative p-5 md:p-10 h-[380px] md:h-[420px] overflow-hidden" style={{ scrollbarWidth: 'none' }}>
          <div className="font-display text-2xl md:text-3xl text-foreground mb-4 leading-tight">
            The Noise Became Music
          </div>

          <div className="text-sm md:text-base text-foreground/70 leading-relaxed font-sans space-y-1 relative">
            {ORIGINAL_LINES.map((line, i) => (
              <p
                key={i}
                className={`transition-colors duration-300 rounded px-1 -mx-1 ${showFormatBar ? 'bg-accent/10' : ''}`}
              >
                {line}
              </p>
            ))}

            {/* Format bar */}
            <div
              className={`absolute -top-11 left-1/2 -translate-x-1/2 rounded-xl shadow-lg p-1.5 flex gap-1 z-20 bg-card/90 backdrop-blur-xl border border-border/50 transition-all duration-300 ${
                showFormatBar ? 'opacity-100 translate-y-0 scale-100' : 'opacity-0 translate-y-2 scale-95 pointer-events-none'
              }`}
            >
              {[Type, Heading1, TextQuote].map((Icon, i) => (
                <div key={i} className="h-8 w-8 rounded-full flex items-center justify-center text-muted-foreground/60">
                  <Icon className="h-3.5 w-3.5" />
                </div>
              ))}
              <div className="w-px h-5 bg-border/50 mx-0.5 self-center" />
              {[Bold, Italic].map((Icon, i) => (
                <div key={i} className="h-8 w-8 rounded-full flex items-center justify-center text-muted-foreground/60">
                  <Icon className="h-3.5 w-3.5" />
                </div>
              ))}
            </div>
          </div>

          {/* AI Rewrite */}
          <div
            className={`mt-5 rounded-xl border border-accent/25 p-4 md:p-5 bg-card/60 backdrop-blur-sm shadow-glow-sm transition-all duration-500 ${
              showAI ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-3 pointer-events-none'
            }`}
          >
            <div className="flex items-center gap-2 mb-3">
              <div className="w-6 h-6 rounded-full bg-accent/20 flex items-center justify-center">
                <Sparkles className="w-3.5 h-3.5 text-accent" />
              </div>
              <span className="text-xs font-medium text-accent">Arc AI Rewrite</span>
              {isTyping && (
                <span className="text-xs text-muted-foreground animate-pulse-soft">
                  writing...
                </span>
              )}
            </div>
            <div className="text-sm md:text-base text-foreground/85 leading-relaxed font-sans whitespace-pre-wrap">
              {aiText}
              {isTyping && (
                <span className="inline-block w-0.5 h-4 bg-accent ml-0.5 align-middle animate-pulse" />
              )}
            </div>
            {!isTyping && aiText && (
              <div className="flex gap-2 mt-4 animate-fade-in">
                <div className="px-3 py-1.5 rounded-full bg-accent/20 text-accent text-xs font-medium">Accept</div>
                <div className="px-3 py-1.5 rounded-full bg-muted/30 text-muted-foreground text-xs font-medium">Try again</div>
              </div>
            )}
          </div>

          {/* Arc AI badge */}
          <div
            className={`absolute top-4 right-4 md:top-5 md:right-5 flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-card/80 backdrop-blur-xl border border-accent/20 text-accent text-xs font-medium ${
              !showAI ? 'animate-gentle-bounce' : ''
            }`}
          >
            <img src={arcLogo} alt="Arc" className="w-3.5 h-3.5 rounded-full" />
            <span className="hidden sm:inline">Arc AI</span>
          </div>
          {/* Bottom fade */}
          <div className="absolute bottom-0 left-0 right-0 h-16 bg-gradient-to-t from-card/80 to-transparent pointer-events-none" />
        </div>
      </div>

      {/* Glow behind */}
      <div className="absolute -inset-4 bg-gradient-to-r from-accent/15 via-accent/8 to-accent/5 blur-3xl rounded-[3rem] -z-10 animate-pulse-soft" />
    </div>
  );
};

export default FakeNoteEditor;
