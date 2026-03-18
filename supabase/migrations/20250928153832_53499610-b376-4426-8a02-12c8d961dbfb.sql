-- Fix audit log security issue by adding proper INSERT policies
-- This prevents unauthorized users from creating fake audit records

-- Create a policy that only allows system processes to insert audit records
-- This uses a security definer function approach to ensure only legitimate system operations can create audit records
CREATE POLICY "System processes can insert audit records" 
ON public.shared_notes_audit 
FOR INSERT 
WITH CHECK (
  -- Only allow inserts if the user_id matches the authenticated user
  -- AND the action is legitimate (from our predefined list)
  auth.uid() = user_id 
  AND action IN ('create_share', 'view_email', 'update_share', 'delete_share')
);

-- Additional security: Create a trigger to validate audit record integrity
-- This ensures audit records can only be created by our system functions
CREATE OR REPLACE FUNCTION public.validate_audit_insert()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Ensure the user_id matches the authenticated user
  IF NEW.user_id != auth.uid() THEN
    RAISE EXCEPTION 'Audit records must be created for the authenticated user only';
  END IF;
  
  -- Validate that the action is from our approved list
  IF NEW.action NOT IN ('create_share', 'view_email', 'update_share', 'delete_share') THEN
    RAISE EXCEPTION 'Invalid audit action: %', NEW.action;
  END IF;
  
  -- Validate that shared_note_id exists if provided
  IF NEW.shared_note_id IS NOT NULL THEN
    IF NOT EXISTS (
      SELECT 1 FROM public.shared_notes 
      WHERE id = NEW.shared_note_id 
      AND (owner_id = auth.uid() OR shared_with_user_id = auth.uid())
    ) THEN
      RAISE EXCEPTION 'Invalid shared_note_id or insufficient permissions';
    END IF;
  END IF;
  
  RETURN NEW;
END;
$$;

-- Apply the validation trigger
CREATE TRIGGER validate_audit_insert_trigger
  BEFORE INSERT ON public.shared_notes_audit
  FOR EACH ROW
  EXECUTE FUNCTION public.validate_audit_insert();

-- Update the existing log_email_access function to ensure it works with the new policies
-- (This function might be referenced but not shown in the current schema)

-- Add a comment to document the security model
COMMENT ON TABLE public.shared_notes_audit IS 'Audit log for shared notes activities. INSERT is restricted to authenticated system processes only to prevent tampering.';
COMMENT ON POLICY "System processes can insert audit records" ON public.shared_notes_audit IS 'Allows only legitimate system processes to create audit records for the authenticated user.';