import React, { useRef } from 'react';
import { ImagePlus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';
import { isValidImageUrl } from "@/lib/sanitization";

interface ImageUploadButtonProps {
  onImageInsert: (url: string) => void;
}

export function ImageUploadButton({ onImageInsert }: ImageUploadButtonProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { user } = useAuth();


  // Compress image before upload
  const compressImage = async (file: File): Promise<Blob> => {
    return new Promise((resolve, reject) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        const maxWidth = 1600;
        const maxHeight = 1600;
        let { width, height } = img;
        
        if (width > maxWidth || height > maxHeight) {
          const ratio = Math.min(maxWidth / width, maxHeight / height);
          width *= ratio;
          height *= ratio;
        }
        
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        if (!ctx) { reject(new Error('No context')); return; }
        ctx.imageSmoothingEnabled = true;
        ctx.imageSmoothingQuality = 'high';
        ctx.drawImage(img, 0, 0, width, height);
        
        canvas.toBlob((blob) => {
          if (blob) resolve(blob);
          else reject(new Error('Compression failed'));
        }, 'image/jpeg', 0.85);
      };
      img.onerror = () => reject(new Error('Image load failed'));
      img.src = URL.createObjectURL(file);
    });
  };

  const handleUpload = async (file: File) => {
    console.log('Starting image upload process...', { 
      fileName: file.name, 
      fileSize: file.size, 
      fileType: file.type,
      userId: user?.id 
    });
    
    if (!user) {
      console.error('No user found when trying to upload');
      toast.error('Please sign in to upload images');
      return;
    }

    if (!file.type.startsWith('image/')) {
      console.error('Invalid file type:', file.type);
      toast.error('Please select an image file');
      return;
    }

    // File size validation (10MB limit)
    const maxSize = 10 * 1024 * 1024; // 10MB
    if (file.size > maxSize) {
      toast.error("Image size must be less than 10MB");
      return;
    }

    // Check for empty files
    if (file.size === 0) {
      console.error('File is empty (0 bytes)');
      toast.error('The selected file appears to be empty. Please try a different image.');
      return;
    }

    const fileName = `${Date.now()}-${Math.random().toString(36).substring(7)}.jpg`;
    const filePath = `${user.id}/${fileName}`;

    console.log('Compressing and uploading to path:', filePath);

    try {
      // Compress the image before upload
      const compressedBlob = await compressImage(file);
      console.log('Compressed from', file.size, 'to', compressedBlob.size, 'bytes');

      const { error: uploadError } = await supabase.storage
        .from('note-images')
        .upload(filePath, compressedBlob, { contentType: 'image/jpeg' });

      if (uploadError) {
        console.error('Upload error:', uploadError);
        throw uploadError;
      }

      console.log('Upload successful, getting signed URL...');

      // Create signed URL (valid for 1 year) since bucket is private
      const { data: signedUrlData, error: signedUrlError } = await supabase.storage
        .from('note-images')
        .createSignedUrl(filePath, 60 * 60 * 24 * 365); // 1 year expiry

      if (signedUrlError || !signedUrlData?.signedUrl) {
        console.error('Signed URL error:', signedUrlError);
        toast.error("Could not generate image URL");
        return;
      }

      const imageUrl = signedUrlData.signedUrl;
      
      // Validate the generated URL before using it
      if (!isValidImageUrl(imageUrl)) {
        toast.error("Generated image URL is not valid");
        return;
      }

      onImageInsert(imageUrl);
      toast.success('Image uploaded successfully');
    } catch (error) {
      console.error('Error uploading image:', error);
      toast.error(`Failed to upload image: ${error.message || 'Unknown error'}`);
    }
  };

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      handleUpload(file);
    }
    // Reset input
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  return (
    <>
      <Button
        size="sm"
        variant="outline"
        onClick={() => fileInputRef.current?.click()}
        className="fixed bottom-6 right-6 z-50 rounded-full w-12 h-12 p-0 shadow-lg hover:shadow-xl transition-shadow hidden"
        aria-label="Upload image"
      >
        <ImagePlus className="h-5 w-5" />
      </Button>
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        onChange={handleFileSelect}
        className="hidden"
        multiple={false}
      />
    </>
  );
}