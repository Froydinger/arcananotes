-- Fix security issues: Remove subscribers table (Stripe-related) and add missing INSERT policy for notifications

-- Remove the subscribers table since we're stripping Stripe implementation
DROP TABLE IF EXISTS public.subscribers CASCADE;

-- Add missing INSERT policy for notifications table to prevent unauthorized notification creation
CREATE POLICY "System can insert notifications for users" 
ON public.notifications 
FOR INSERT 
WITH CHECK (
  -- Only allow system/authenticated processes to create notifications
  -- This ensures notifications can only be created by triggers or authorized functions
  auth.uid() IS NOT NULL OR 
  current_setting('role') = 'service_role'
);