-- Remove public SELECT policies that were left behind
DROP POLICY IF EXISTS "Anyone can view note images" ON storage.objects;
DROP POLICY IF EXISTS "Users can view all note images publicly" ON storage.objects;

-- Ensure owner-only SELECT policy exists
DROP POLICY IF EXISTS "Users can view their own note images" ON storage.objects;
CREATE POLICY "Users can view their own note images"
ON storage.objects
FOR SELECT
USING (bucket_id = 'note-images' AND auth.uid()::text = (storage.foldername(name))[1]);