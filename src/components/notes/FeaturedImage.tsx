import React, { useState } from 'react';
import { X } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface FeaturedImageProps {
  imageUrl: string;
  alt?: string;
  onDelete?: () => void;
}

export function FeaturedImage({ imageUrl, alt = "Featured image", onDelete }: FeaturedImageProps) {
  const [showDelete, setShowDelete] = useState(false);

  const handleImageClick = () => {
    if (onDelete) {
      setShowDelete(!showDelete);
    }
  };

  return (
    <div className="relative w-full mb-6 rounded-lg overflow-hidden">
      <img
        src={imageUrl}
        alt={alt}
        className="w-full h-auto object-cover cursor-pointer"
        style={{ aspectRatio: '16/10' }}
        onClick={handleImageClick}
      />
      {onDelete && showDelete && (
        <div className="absolute top-2 right-2 animate-scale-in">
          <Button
            variant="destructive"
            size="sm"
            onClick={onDelete}
            className="bg-destructive/90 hover:bg-destructive backdrop-blur-sm shadow-lg rounded-full"
            title="Remove featured image"
          >
            <X className="h-4 w-4" />
          </Button>
        </div>
      )}
    </div>
  );
}