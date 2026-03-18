import React, { useState, useRef, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { ImagePlus } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { toast } from '@/components/ui/sonner';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import ReactCrop, { Crop, PixelCrop, centerCrop, makeAspectCrop } from 'react-image-crop';
import 'react-image-crop/dist/ReactCrop.css';
import { isValidImageUrl } from "@/lib/sanitization";

interface FeaturedImageUploadProps {
  noteId: string;
  onImageSet: (url: string) => void;
  hasImage: boolean;
}

export function FeaturedImageUpload({ noteId, onImageSet, hasImage }: FeaturedImageUploadProps) {
  const { user } = useAuth();
  const [isUploading, setIsUploading] = useState(false);
  const [showCrop, setShowCrop] = useState(false);
  const [imageSrc, setImageSrc] = useState<string>('');
  const [crop, setCrop] = useState<Crop>();
  const [completedCrop, setCompletedCrop] = useState<PixelCrop>();
  const imgRef = useRef<HTMLImageElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      toast.error("Invalid file", { description: "Please select an image file." });
      return;
    }

    // File size validation (10MB limit)
    const maxSize = 10 * 1024 * 1024; // 10MB
    if (file.size > maxSize) {
      toast.error("File too large", { description: "Image size must be less than 10MB." });
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      setImageSrc(reader.result as string);
      setShowCrop(true);
    };
    reader.readAsDataURL(file);
    
    // Reset input
    e.target.value = '';
  }, [toast]);

  const onImageLoad = useCallback((e: React.SyntheticEvent<HTMLImageElement>) => {
    const { width, height } = e.currentTarget;
    const crop = centerCrop(
      makeAspectCrop(
        {
          unit: '%',
          width: 90,
        },
        16 / 10, // 16:10 aspect ratio for featured images
        width,
        height,
      ),
      width,
      height,
    );
    setCrop(crop);
  }, []);

  const getCroppedImg = useCallback(async (
    image: HTMLImageElement,
    crop: PixelCrop,
  ): Promise<Blob> => {
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');

    if (!ctx) {
      throw new Error('No 2d context');
    }

    const scaleX = image.naturalWidth / image.width;
    const scaleY = image.naturalHeight / image.height;

    // Calculate the actual crop dimensions in the source image
    const sourceCropWidth = crop.width * scaleX;
    const sourceCropHeight = crop.height * scaleY;

    // Cap output dimensions to save storage while maintaining quality
    const maxOutputWidth = 1200;
    const aspectRatio = sourceCropWidth / sourceCropHeight;
    
    let outputWidth = Math.min(maxOutputWidth, sourceCropWidth);
    let outputHeight = outputWidth / aspectRatio;

    canvas.width = outputWidth;
    canvas.height = outputHeight;

    // Enable high-quality image rendering
    ctx.imageSmoothingEnabled = true;
    ctx.imageSmoothingQuality = 'high';

    ctx.drawImage(
      image,
      crop.x * scaleX,
      crop.y * scaleY,
      sourceCropWidth,
      sourceCropHeight,
      0,
      0,
      outputWidth,
      outputHeight,
    );

    return new Promise((resolve) => {
      // Use JPEG with 85% quality for good balance of quality and size
      canvas.toBlob((blob) => {
        if (!blob) {
          throw new Error('Failed to crop image');
        }
        resolve(blob);
      }, 'image/jpeg', 0.85);
    });
  }, []);

  const handleCropComplete = useCallback(async () => {
    if (!completedCrop || !imgRef.current) return;

    try {
      setIsUploading(true);

      const croppedBlob = await getCroppedImg(imgRef.current, completedCrop);
      
      if (!user) {
        toast.error("Authentication required", { description: "Please sign in to upload images." });
        return;
      }

      const fileName = `${user.id}/${noteId}-featured-${Date.now()}.jpg`;
      
      const { error: uploadError } = await supabase.storage
        .from('note-images')
        .upload(fileName, croppedBlob, {
          contentType: 'image/jpeg',
          upsert: true,
          cacheControl: '3600'
        });

      if (uploadError) {
        throw uploadError;
      }

      // Create signed URL (valid for 1 year) since bucket is private
      const { data: signedUrlData, error: signedUrlError } = await supabase.storage
        .from('note-images')
        .createSignedUrl(fileName, 60 * 60 * 24 * 365); // 1 year expiry

      if (signedUrlError || !signedUrlData?.signedUrl) {
        toast.error("URL generation failed", { description: "Could not generate image URL." });
        return;
      }

      const imageUrl = signedUrlData.signedUrl;

      // Validate the generated URL before using it
      if (!isValidImageUrl(imageUrl)) {
        toast.error("Invalid URL", { description: "Generated image URL is not valid." });
        return;
      }

      onImageSet(imageUrl);
      setShowCrop(false);
      setImageSrc('');

      toast.success("Featured image set");

    } catch (error) {
      console.error('Upload error:', error);
      toast.error("Upload failed", { description: "Failed to upload image. Please try again." });
    } finally {
      setIsUploading(false);
    }
  }, [completedCrop, user, noteId, onImageSet, getCroppedImg]);

  return (
    <>
      <Button
        variant="ghost"
        size="sm"
        onClick={() => fileInputRef.current?.click()}
        className="h-10 w-10 p-0 bg-background/60 backdrop-blur-md border border-border/30 rounded-full hover:bg-secondary/80 hover:border-border/50 transition-all duration-200 shadow-sm glass-shimmer"
        title={hasImage ? "Change featured image" : "Add featured image"}
      >
        <ImagePlus className="h-5 w-5" />
      </Button>

      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        onChange={handleFileSelect}
        className="hidden"
      />

      <Dialog open={showCrop} onOpenChange={setShowCrop}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Crop Featured Image</DialogTitle>
          </DialogHeader>
          
          <div className="space-y-4">
            {imageSrc && (
              <div className="flex justify-center">
                <ReactCrop
                  crop={crop}
                  onChange={(_, percentCrop) => setCrop(percentCrop)}
                  onComplete={(c) => setCompletedCrop(c)}
                  aspect={16 / 10}
                  className="max-h-96"
                >
                  <img
                    ref={imgRef}
                    alt="Crop preview"
                    src={imageSrc}
                    onLoad={onImageLoad}
                    className="max-h-96 w-auto"
                  />
                </ReactCrop>
              </div>
            )}
            
            <div className="flex justify-end gap-2">
              <Button
                variant="outline"
                onClick={() => {
                  setShowCrop(false);
                  setImageSrc('');
                }}
              >
                Cancel
              </Button>
              <Button
                onClick={handleCropComplete}
                disabled={!completedCrop || isUploading}
              >
                {isUploading ? 'Uploading...' : 'Set Featured Image'}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}