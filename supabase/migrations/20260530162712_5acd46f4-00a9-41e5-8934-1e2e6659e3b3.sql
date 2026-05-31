-- linkedin_post_runs
CREATE TABLE public.linkedin_post_runs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  video_id text NOT NULL,
  video_title text NOT NULL,
  video_thumbnail text,
  video_channel text,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX linkedin_post_runs_user_created_idx ON public.linkedin_post_runs (user_id, created_at DESC);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.linkedin_post_runs TO authenticated;
GRANT ALL ON public.linkedin_post_runs TO service_role;
ALTER TABLE public.linkedin_post_runs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users select own linkedin_post_runs" ON public.linkedin_post_runs FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Users insert own linkedin_post_runs" ON public.linkedin_post_runs FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users update own linkedin_post_runs" ON public.linkedin_post_runs FOR UPDATE TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Users delete own linkedin_post_runs" ON public.linkedin_post_runs FOR DELETE TO authenticated USING (auth.uid() = user_id);

-- linkedin_run_posts
CREATE TABLE public.linkedin_run_posts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  run_id uuid NOT NULL REFERENCES public.linkedin_post_runs(id) ON DELETE CASCADE,
  user_id uuid NOT NULL,
  idx int NOT NULL,
  type text NOT NULL,
  hook text NOT NULL,
  body text NOT NULL,
  cta text,
  image_prompt text,
  image_path text,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX linkedin_run_posts_run_idx ON public.linkedin_run_posts (run_id, idx);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.linkedin_run_posts TO authenticated;
GRANT ALL ON public.linkedin_run_posts TO service_role;
ALTER TABLE public.linkedin_run_posts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users select own linkedin_run_posts" ON public.linkedin_run_posts FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Users insert own linkedin_run_posts" ON public.linkedin_run_posts FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users update own linkedin_run_posts" ON public.linkedin_run_posts FOR UPDATE TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Users delete own linkedin_run_posts" ON public.linkedin_run_posts FOR DELETE TO authenticated USING (auth.uid() = user_id);

-- Storage bucket
INSERT INTO storage.buckets (id, name, public) VALUES ('linkedin-images', 'linkedin-images', false)
ON CONFLICT (id) DO NOTHING;

CREATE POLICY "Users read own linkedin-images" ON storage.objects FOR SELECT TO authenticated
USING (bucket_id = 'linkedin-images' AND (storage.foldername(name))[1] = auth.uid()::text);

CREATE POLICY "Users insert own linkedin-images" ON storage.objects FOR INSERT TO authenticated
WITH CHECK (bucket_id = 'linkedin-images' AND (storage.foldername(name))[1] = auth.uid()::text);

CREATE POLICY "Users update own linkedin-images" ON storage.objects FOR UPDATE TO authenticated
USING (bucket_id = 'linkedin-images' AND (storage.foldername(name))[1] = auth.uid()::text);

CREATE POLICY "Users delete own linkedin-images" ON storage.objects FOR DELETE TO authenticated
USING (bucket_id = 'linkedin-images' AND (storage.foldername(name))[1] = auth.uid()::text);