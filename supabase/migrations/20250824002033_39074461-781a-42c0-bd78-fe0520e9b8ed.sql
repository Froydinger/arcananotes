-- Remove the automatic notification trigger since we'll handle this with client-side tracking
DROP TRIGGER IF EXISTS trigger_notify_note_updated ON public.notes;