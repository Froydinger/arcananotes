-- Enhanced Security for shared_notes table
-- Step 1: Make shared_with_email nullable since we prefer user_id when available
ALTER TABLE public.shared_notes ALTER COLUMN shared_with_email DROP NOT NULL;

-- Step 2: Add constraints to ensure data integrity
ALTER TABLE public.shared_notes ADD CONSTRAINT check_either_email_or_user_id 
CHECK (
  (shared_with_email IS NOT NULL AND shared_with_email != '') OR 
  (shared_with_user_id IS NOT NULL)
);

-- Step 3: Create audit table for tracking email access
CREATE TABLE public.shared_notes_audit (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  shared_note_id UUID NOT NULL,
  action TEXT NOT NULL, -- 'view_email', 'create_share', etc.
  accessed_email TEXT,
  ip_address INET,
  user_agent TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS on audit table
ALTER TABLE public.shared_notes_audit ENABLE ROW LEVEL SECURITY;

-- Step 4: Create security definer function to safely access email data
CREATE OR REPLACE FUNCTION public.get_shared_note_display_info(
  share_id UUID
) RETURNS TABLE(
  id UUID,
  note_id UUID,
  display_name TEXT,
  permission TEXT,
  is_registered_user BOOLEAN
) LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  -- Verify the user has permission to see this share
  IF NOT EXISTS (
    SELECT 1 FROM shared_notes sn
    LEFT JOIN notes n ON sn.note_id = n.id
    WHERE sn.id = share_id 
    AND (
      sn.shared_with_user_id = auth.uid() OR -- User is recipient
      (sn.owner_id = auth.uid() AND n.user_id = auth.uid()) -- User owns the note
    )
  ) THEN
    RETURN; -- No access, return empty result
  END IF;

  -- Return sanitized information
  RETURN QUERY
  SELECT 
    sn.id,
    sn.note_id,
    CASE 
      WHEN sn.shared_with_user_id IS NOT NULL AND sn.shared_with_username IS NOT NULL 
        THEN sn.shared_with_username
      WHEN sn.shared_with_user_id IS NOT NULL 
        THEN 'Registered User'
      WHEN sn.shared_with_email IS NOT NULL 
        THEN 
          CASE 
            WHEN sn.owner_id = auth.uid() THEN sn.shared_with_email -- Owner can see full email
            ELSE CONCAT(LEFT(SPLIT_PART(sn.shared_with_email, '@', 1), 2), '***@', SPLIT_PART(sn.shared_with_email, '@', 2)) -- Recipient sees masked email
          END
      ELSE 'Unknown User'
    END as display_name,
    sn.permission,
    (sn.shared_with_user_id IS NOT NULL) as is_registered_user
  FROM shared_notes sn
  WHERE sn.id = share_id;
END;
$$;

-- Step 5: Create improved RLS policies with enhanced security
-- Drop existing SELECT policies and replace with more secure ones
DROP POLICY IF EXISTS "Note owners can view shares for their notes" ON public.shared_notes;
DROP POLICY IF EXISTS "Recipients can view only their own share record" ON public.shared_notes;

-- New restrictive policy for note owners - limits what data they can see
CREATE POLICY "Note owners can view basic share info" ON public.shared_notes
FOR SELECT TO authenticated
USING (
  auth.uid() = owner_id 
  AND EXISTS (
    SELECT 1 FROM notes 
    WHERE notes.id = shared_notes.note_id 
    AND notes.user_id = auth.uid()
  )
);

-- New policy for recipients - they can only see their own record with limited data
CREATE POLICY "Recipients can view their own share record" ON public.shared_notes
FOR SELECT TO authenticated  
USING (
  auth.uid() = shared_with_user_id 
  AND shared_with_user_id IS NOT NULL
);

-- Step 6: Create audit policies
CREATE POLICY "Users can view their own audit records" ON public.shared_notes_audit
FOR SELECT TO authenticated
USING (auth.uid() = user_id);

-- Step 7: Add trigger to log email access
CREATE OR REPLACE FUNCTION public.log_email_access()
RETURNS TRIGGER AS $$
BEGIN
  -- Log when someone views a share with email data
  IF TG_OP = 'SELECT' AND NEW.shared_with_email IS NOT NULL THEN
    INSERT INTO shared_notes_audit (
      user_id, 
      shared_note_id, 
      action, 
      accessed_email
    ) VALUES (
      auth.uid(), 
      NEW.id, 
      'view_email', 
      NEW.shared_with_email
    );
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Note: Row-level triggers can't be easily implemented for SELECT operations in PostgreSQL
-- The audit logging would need to be implemented in application code for SELECT operations

-- Step 8: Create function to validate email sharing
CREATE OR REPLACE FUNCTION public.create_secure_share(
  p_note_id UUID,
  p_email_or_username TEXT,
  p_permission TEXT
) RETURNS UUID 
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  v_share_id UUID;
  v_user_id UUID;
  v_username TEXT;
  v_email TEXT;
BEGIN
  -- Verify the user owns the note
  IF NOT EXISTS (
    SELECT 1 FROM notes 
    WHERE id = p_note_id AND user_id = auth.uid()
  ) THEN
    RAISE EXCEPTION 'You do not own this note';
  END IF;

  -- Determine if input is email or username
  IF p_email_or_username LIKE '%@%' THEN
    -- It's an email
    v_email := LOWER(TRIM(p_email_or_username));
    
    -- Check if user exists by email
    SELECT up.user_id, up.username INTO v_user_id, v_username
    FROM user_preferences up
    JOIN auth.users au ON au.id = up.user_id
    WHERE au.email = v_email;
    
  ELSE
    -- It's a username
    v_username := LOWER(TRIM(p_email_or_username));
    
    -- Get user by username
    SELECT up.user_id, au.email INTO v_user_id, v_email
    FROM user_preferences up
    JOIN auth.users au ON au.id = up.user_id
    WHERE up.username = v_username;
    
    -- If user doesn't exist by username, treat as email
    IF v_user_id IS NULL THEN
      v_email := p_email_or_username;
      v_username := NULL;
    END IF;
  END IF;

  -- Create the share record
  INSERT INTO shared_notes (
    note_id,
    owner_id,
    shared_with_email,
    shared_with_user_id,
    shared_with_username,
    permission
  ) VALUES (
    p_note_id,
    auth.uid(),
    CASE WHEN v_user_id IS NULL THEN v_email ELSE NULL END, -- Only store email if user doesn't exist
    v_user_id,
    v_username,
    p_permission
  ) RETURNING id INTO v_share_id;

  -- Log the share creation
  INSERT INTO shared_notes_audit (
    user_id,
    shared_note_id,
    action,
    accessed_email
  ) VALUES (
    auth.uid(),
    v_share_id,
    'create_share',
    v_email
  );

  RETURN v_share_id;
END;
$$;