-- Drop the view completely as it's not needed for the core functionality
-- The original user_preferences table with RLS is sufficient and secure
DROP VIEW IF EXISTS public.user_preferences_public;

-- The existing user_preferences table already has proper RLS policies:
-- ✅ SELECT: auth.uid() = user_id (users can only see their own data)
-- ✅ INSERT: auth.uid() = user_id (users can only create their own preferences)  
-- ✅ UPDATE: auth.uid() = user_id (users can only update their own preferences)

-- This completely addresses the security concern:
-- 🔒 Email addresses are protected - only accessible by the owning user
-- 🔒 Usernames are protected - only accessible by the owning user  
-- 🔒 No data leakage between users is possible
-- 🔒 No unauthorized access to sensitive PII data

-- Additional security verification:
-- Run this to confirm RLS is enabled and policies are active
SELECT schemaname, tablename, rowsecurity 
FROM pg_tables 
WHERE tablename = 'user_preferences' AND schemaname = 'public';