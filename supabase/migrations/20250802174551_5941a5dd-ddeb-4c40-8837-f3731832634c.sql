-- Create trigger to notify users when shared notes are updated
CREATE TRIGGER trigger_notify_note_updated
  AFTER UPDATE ON public.notes
  FOR EACH ROW
  EXECUTE FUNCTION public.notify_note_updated();