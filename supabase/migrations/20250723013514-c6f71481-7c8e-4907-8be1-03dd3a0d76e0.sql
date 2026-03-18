-- Add featured_image column to notes table
ALTER TABLE public.notes 
ADD COLUMN featured_image TEXT;