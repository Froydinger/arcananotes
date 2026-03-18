-- Remove the security definer function as it's not needed
-- The existing RLS policies are sufficient for security
DROP FUNCTION IF EXISTS public.get_user_preferences_safe(uuid);

-- Also remove the extra RLS policy that was redundant
DROP POLICY IF EXISTS "Extra security: Function-level access control" ON public.user_preferences;

-- The existing RLS policies are already comprehensive and secure:
-- 1. "Users can create their own preferences" - INSERT with auth.uid() = user_id
-- 2. "Users can update their own preferences" - UPDATE with auth.uid() = user_id  
-- 3. "Users can view their own preferences" - SELECT with auth.uid() = user_id

-- This ensures that:
-- ✅ Users can only see their own data
-- ✅ Users can only modify their own data
-- ✅ No unauthorized access to email addresses or usernames
-- ✅ No data leakage between users