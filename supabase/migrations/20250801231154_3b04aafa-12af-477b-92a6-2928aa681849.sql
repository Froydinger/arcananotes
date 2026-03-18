-- Enable real-time for shared_notes table to ensure proper synchronization
ALTER TABLE public.shared_notes REPLICA IDENTITY FULL;

-- Add the shared_notes table to real-time publication
ALTER PUBLICATION supabase_realtime ADD TABLE public.shared_notes;

-- Create a function to notify clients when share access is removed
CREATE OR REPLACE FUNCTION public.notify_share_removed()
RETURNS TRIGGER AS $$
BEGIN
  -- This trigger will fire on DELETE operations on shared_notes
  -- The real-time system will automatically notify connected clients
  RETURN OLD;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = '';

-- Create trigger for share removal notifications
CREATE TRIGGER on_share_removed
  AFTER DELETE ON public.shared_notes
  FOR EACH ROW EXECUTE FUNCTION public.notify_share_removed();