import React from "react";
import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Heading1, Pilcrow, Type } from "lucide-react";

export type BlockType = "p" | "h1";

interface BlockHandleProps {
  visible: boolean;
  currentType: BlockType;
  onSelect: (type: BlockType) => void;
}

export const BlockHandle: React.FC<BlockHandleProps> = ({ visible, currentType, onSelect }) => {
  if (!visible) return null;
  
  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button 
          variant="ghost" 
          size="sm" 
          className="btn-accessible p-2"
          aria-label="Change block type"
          title="Text formatting"
        >
          <Type className="h-4 w-4" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-40 p-2" align="end">
        <div className="flex flex-col gap-1">
          <Button
            variant={currentType === "h1" ? "default" : "ghost"}
            className="justify-start"
            onClick={() => onSelect("h1")}
          >
            <Heading1 className="h-4 w-4 mr-2" /> Header
          </Button>
          <Button
            variant={currentType === "p" ? "default" : "ghost"}
            className="justify-start"
            onClick={() => onSelect("p")}
          >
            <Pilcrow className="h-4 w-4 mr-2" /> Body
          </Button>
        </div>
      </PopoverContent>
    </Popover>
  );
};
