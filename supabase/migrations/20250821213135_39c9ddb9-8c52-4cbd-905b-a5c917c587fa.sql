-- Fix missing user_preferences records for existing users
INSERT INTO public.user_preferences (user_id, theme)
SELECT au.id, 'navy'
FROM auth.users au
LEFT JOIN public.user_preferences up ON au.id = up.user_id
WHERE up.user_id IS NULL;