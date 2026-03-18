-- Update storage bucket to be properly public
UPDATE storage.buckets 
SET public = true 
WHERE id = 'note-images';

-- Drop existing restrictive policies
DROP POLICY IF EXISTS "Users can view their own note images" ON storage.objects;

-- Create a public read policy for note images
CREATE POLICY "Anyone can view note images" 
ON storage.objects 
FOR SELECT 
USING (bucket_id = 'note-images');

-- Keep upload/update/delete restricted to owners
CREATE POLICY "Users can view all note images publicly" 
ON storage.objects 
FOR SELECT 
USING (bucket_id = 'note-images');