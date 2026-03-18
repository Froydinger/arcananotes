
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { WritingPrompt } from '@/contexts/NoteContext';

interface PromptCardProps {
  prompt: WritingPrompt;
  onUsePrompt: (prompt: WritingPrompt) => void;
}

export default function PromptCard({ prompt, onUsePrompt }: PromptCardProps) {
  return (
    <Card className="h-full flex flex-col">
      <CardContent className="p-6 flex flex-col flex-grow">
        <p className="text-lg font-serif mb-4">{prompt.text}</p>
        <div className="mt-auto pt-4">
          <Button 
            variant="outline" 
            onClick={() => onUsePrompt(prompt)}
            className="w-full rounded-full"
          >
            Write with this prompt
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
