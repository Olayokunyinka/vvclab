
CREATE TABLE public.channels (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  channel_id TEXT NOT NULL UNIQUE,
  title TEXT NOT NULL,
  thumbnail_url TEXT,
  subscriber_count BIGINT,
  uploads_playlist_id TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.channels TO anon, authenticated;
GRANT ALL ON public.channels TO service_role;
ALTER TABLE public.channels ENABLE ROW LEVEL SECURITY;
CREATE POLICY "shared read channels" ON public.channels FOR SELECT USING (true);
CREATE POLICY "shared write channels" ON public.channels FOR INSERT WITH CHECK (true);
CREATE POLICY "shared update channels" ON public.channels FOR UPDATE USING (true);
CREATE POLICY "shared delete channels" ON public.channels FOR DELETE USING (true);

CREATE TABLE public.videos (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  channel_uuid UUID NOT NULL REFERENCES public.channels(id) ON DELETE CASCADE,
  video_id TEXT NOT NULL UNIQUE,
  title TEXT NOT NULL,
  description TEXT,
  thumbnail_url TEXT,
  published_at TIMESTAMPTZ,
  view_count BIGINT DEFAULT 0,
  like_count BIGINT DEFAULT 0,
  comment_count BIGINT DEFAULT 0,
  duration_seconds INT DEFAULT 0,
  tags TEXT[] DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.videos TO anon, authenticated;
GRANT ALL ON public.videos TO service_role;
ALTER TABLE public.videos ENABLE ROW LEVEL SECURITY;
CREATE POLICY "shared read videos" ON public.videos FOR SELECT USING (true);
CREATE POLICY "shared write videos" ON public.videos FOR INSERT WITH CHECK (true);
CREATE POLICY "shared update videos" ON public.videos FOR UPDATE USING (true);
CREATE POLICY "shared delete videos" ON public.videos FOR DELETE USING (true);
CREATE INDEX idx_videos_channel ON public.videos(channel_uuid);
CREATE INDEX idx_videos_published ON public.videos(published_at DESC);

CREATE TABLE public.scores (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  video_uuid UUID NOT NULL UNIQUE REFERENCES public.videos(id) ON DELETE CASCADE,
  criteria JSONB NOT NULL DEFAULT '{}'::jsonb,
  total INT NOT NULL DEFAULT 0,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.scores TO anon, authenticated;
GRANT ALL ON public.scores TO service_role;
ALTER TABLE public.scores ENABLE ROW LEVEL SECURITY;
CREATE POLICY "shared read scores" ON public.scores FOR SELECT USING (true);
CREATE POLICY "shared write scores" ON public.scores FOR INSERT WITH CHECK (true);
CREATE POLICY "shared update scores" ON public.scores FOR UPDATE USING (true);
CREATE POLICY "shared delete scores" ON public.scores FOR DELETE USING (true);

CREATE TABLE public.briefs (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  video_uuid UUID NOT NULL REFERENCES public.videos(id) ON DELETE CASCADE,
  content JSONB NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.briefs TO anon, authenticated;
GRANT ALL ON public.briefs TO service_role;
ALTER TABLE public.briefs ENABLE ROW LEVEL SECURITY;
CREATE POLICY "shared read briefs" ON public.briefs FOR SELECT USING (true);
CREATE POLICY "shared write briefs" ON public.briefs FOR INSERT WITH CHECK (true);
CREATE POLICY "shared update briefs" ON public.briefs FOR UPDATE USING (true);
CREATE POLICY "shared delete briefs" ON public.briefs FOR DELETE USING (true);
CREATE INDEX idx_briefs_video ON public.briefs(video_uuid);
