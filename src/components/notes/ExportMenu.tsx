import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Download, Share, Loader2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { exportNoteToPDF, type NoteForExport } from '@/lib/pdfExport';
import { useAuth } from '@/contexts/AuthContext';
import type { NoteWithSharing } from '@/types/sharing';

interface ExportMenuProps {
  note: NoteWithSharing;
  onShare: () => void;
  onShareUpdate?: () => void;
}

export function ExportMenu({ note, onShare, onShareUpdate }: ExportMenuProps) {
  const { toast } = useToast();
  const [isExporting, setIsExporting] = useState(false);

  const handlePDFExport = async () => {
    if (isExporting) return;
    
    setIsExporting(true);
    try {
      await exportNoteToPDF(note);
      toast({
        title: "PDF exported",
        description: "Your note has been saved as a PDF.",
      });
    } catch (error) {
      console.error('PDF export failed:', error);
      toast({
        title: "Export failed",
        description: "Failed to export PDF. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <>
      
      {/* Share dropdown */}
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            variant="ghost"
            size="sm"
            className="h-10 w-10 p-0 bg-background/60 backdrop-blur-md border border-border/30 rounded-full hover:bg-secondary/80 hover:border-border/50 transition-all duration-200 shadow-sm glass-shimmer"
            title="Share note"
          >
            <Share className="h-5 w-5" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="z-50 bg-popover border shadow-lg">
          <DropdownMenuItem onClick={onShare}>
            <Share className="h-4 w-4 mr-2" />
            Copy & Share
          </DropdownMenuItem>
          <DropdownMenuItem onClick={handlePDFExport} disabled={isExporting}>
            {isExporting ? (
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
            ) : (
              <Download className="h-4 w-4 mr-2" />
            )}
            Export as PDF
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

    </>
  );
}