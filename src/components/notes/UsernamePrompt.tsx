import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Users, ArrowRight } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

interface UsernamePromptProps {
  onDismiss?: () => void;
}

export function UsernamePrompt({ onDismiss }: UsernamePromptProps) {
  const navigate = useNavigate();

  const handleCreateUsername = () => {
    navigate('/settings?section=username');
    onDismiss?.();
  };

  return (
    <Card className="bg-gradient-to-br from-primary/5 to-primary/10 border-primary/20">
      <CardContent className="p-4">
        <div className="flex items-start gap-3">
          <div className="flex-shrink-0 p-2 bg-primary/10 rounded-lg">
            <Users className="h-5 w-5 text-primary" />
          </div>
          <div className="flex-1 min-w-0">
            <h3 className="font-medium text-sm mb-1">Make sharing easier and more secure!</h3>
            <p className="text-sm text-muted-foreground mb-3">
              Set a username so others can share notes with you using @username instead of your email address. This keeps your email private and makes sharing easier.
            </p>
            <div className="flex items-center gap-2">
              <Button 
                size="sm" 
                onClick={handleCreateUsername}
                className="text-xs"
              >
                Create Username
                <ArrowRight className="h-3 w-3 ml-1" />
              </Button>
              {onDismiss && (
                <Button 
                  variant="ghost" 
                  size="sm" 
                  onClick={onDismiss}
                  className="text-xs"
                >
                  Not now
                </Button>
              )}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}