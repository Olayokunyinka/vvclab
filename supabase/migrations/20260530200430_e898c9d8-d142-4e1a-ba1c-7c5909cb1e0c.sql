-- Admin users (RLS disabled — service-role only)
CREATE TABLE public.admin_users (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  email text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id)
);
GRANT ALL ON public.admin_users TO service_role;
ALTER TABLE public.admin_users DISABLE ROW LEVEL SECURITY;
CREATE INDEX idx_admin_users_user_id ON public.admin_users(user_id);

-- Admin activity log (RLS disabled — service-role only)
CREATE TABLE public.admin_activity_log (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  admin_user_id uuid REFERENCES public.admin_users(id) ON DELETE SET NULL,
  action text NOT NULL,
  target_user_id uuid,
  details jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT ALL ON public.admin_activity_log TO service_role;
ALTER TABLE public.admin_activity_log DISABLE ROW LEVEL SECURITY;
CREATE INDEX idx_admin_activity_log_created_at ON public.admin_activity_log(created_at DESC);

-- AI call log (RLS disabled — service-role only)
CREATE TABLE public.ai_call_log (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  call_type text NOT NULL CHECK (call_type IN ('blueprint','channel_analysis','script','linkedin_posts','linkedin_image','pattern_analysis')),
  status text NOT NULL CHECK (status IN ('success','rate_limited','credits_exhausted','error')),
  model text,
  tokens_used integer NOT NULL DEFAULT 0,
  error_message text,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT ALL ON public.ai_call_log TO service_role;
ALTER TABLE public.ai_call_log DISABLE ROW LEVEL SECURITY;
CREATE INDEX idx_ai_call_log_created_at ON public.ai_call_log(created_at DESC);
CREATE INDEX idx_ai_call_log_call_type_created ON public.ai_call_log(call_type, created_at DESC);
CREATE INDEX idx_ai_call_log_user_id ON public.ai_call_log(user_id);

-- Add suspension columns to profiles
ALTER TABLE public.profiles
  ADD COLUMN is_suspended boolean NOT NULL DEFAULT false,
  ADD COLUMN suspension_reason text;

-- Seed initial admin
INSERT INTO public.admin_users (user_id, email)
SELECT id, email FROM auth.users WHERE email = 'mrolayokun@gmail.com'
ON CONFLICT (user_id) DO NOTHING;