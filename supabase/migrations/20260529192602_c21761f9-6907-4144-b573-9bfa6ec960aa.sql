CREATE TABLE public.my_channels (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  channel_id text NOT NULL UNIQUE,
  title text NOT NULL,
  thumbnail_url text,
  subscriber_count bigint,
  videos_analyzed integer NOT NULL DEFAULT 0,
  style_profile jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.my_channels TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.my_channels TO authenticated;
GRANT ALL ON public.my_channels TO service_role;

ALTER TABLE public.my_channels ENABLE ROW LEVEL SECURITY;

CREATE POLICY "shared read my_channels" ON public.my_channels FOR SELECT USING (true);
CREATE POLICY "shared write my_channels" ON public.my_channels FOR INSERT WITH CHECK (true);
CREATE POLICY "shared update my_channels" ON public.my_channels FOR UPDATE USING (true);
CREATE POLICY "shared delete my_channels" ON public.my_channels FOR DELETE USING (true);