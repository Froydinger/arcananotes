-- Create storage bucket for note images
INSERT INTO storage.buckets (id, name, public) VALUES ('note-images', 'note-images', true);

-- Create policies for note images
CREATE POLICY "Users can upload their own note images" 
ON storage.objects 
FOR INSERT 
WITH CHECK (bucket_id = 'note-images' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users can view their own note images" 
ON storage.objects 
FOR SELECT 
USING (bucket_id = 'note-images' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users can update their own note images" 
ON storage.objects 
FOR UPDATE 
USING (bucket_id = 'note-images' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users can delete their own note images" 
ON storage.objects 
FOR DELETE 
USING (bucket_id = 'note-images' AND auth.uid()::text = (storage.foldername(name))[1]);