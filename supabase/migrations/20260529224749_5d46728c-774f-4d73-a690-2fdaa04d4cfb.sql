-- ============================================================
-- 1. Wipe legacy rows (no users own them today)
-- ============================================================
DELETE FROM public.briefs;
DELETE FROM public.scores;
DELETE FROM public.videos;
DELETE FROM public.channels;
DELETE FROM public.my_channels;

-- ============================================================
-- 2. Drop existing permissive "shared *" policies
-- ============================================================
DROP POLICY IF EXISTS "shared read briefs"   ON public.briefs;
DROP POLICY IF EXISTS "shared write briefs"  ON public.briefs;
DROP POLICY IF EXISTS "shared update briefs" ON public.briefs;
DROP POLICY IF EXISTS "shared delete briefs" ON public.briefs;

DROP POLICY IF EXISTS "shared read scores"   ON public.scores;
DROP POLICY IF EXISTS "shared write scores"  ON public.scores;
DROP POLICY IF EXISTS "shared update scores" ON public.scores;
DROP POLICY IF EXISTS "shared delete scores" ON public.scores;

DROP POLICY IF EXISTS "shared read videos"   ON public.videos;
DROP POLICY IF EXISTS "shared write videos"  ON public.videos;
DROP POLICY IF EXISTS "shared update videos" ON public.videos;
DROP POLICY IF EXISTS "shared delete videos" ON public.videos;

DROP POLICY IF EXISTS "shared read channels"   ON public.channels;
DROP POLICY IF EXISTS "shared write channels"  ON public.channels;
DROP POLICY IF EXISTS "shared update channels" ON public.channels;
DROP POLICY IF EXISTS "shared delete channels" ON public.channels;

DROP POLICY IF EXISTS "shared read my_channels"   ON public.my_channels;
DROP POLICY IF EXISTS "shared write my_channels"  ON public.my_channels;
DROP POLICY IF EXISTS "shared update my_channels" ON public.my_channels;
DROP POLICY IF EXISTS "shared delete my_channels" ON public.my_channels;

-- ============================================================
-- 3. Shared update_updated_at_column helper (idempotent)
-- ============================================================
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

-- ============================================================
-- 4. profiles table (one row per auth.users)
-- ============================================================
CREATE TABLE public.profiles (
  user_id              UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name            TEXT,
  email                TEXT,
  onboarding_completed BOOLEAN NOT NULL DEFAULT false,
  onboarding_step      SMALLINT NOT NULL DEFAULT 0,
  brand_blueprint      JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at           TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at           TIMESTAMPTZ NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.profiles TO authenticated;
GRANT ALL ON public.profiles TO service_role;

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own profile"
  ON public.profiles FOR SELECT TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own profile"
  ON public.profiles FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own profile"
  ON public.profiles FOR UPDATE TO authenticated
  USING (auth.uid() = user_id);

CREATE TRIGGER update_profiles_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Auto-create profile on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (user_id, full_name, email)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.raw_user_meta_data->>'name', ''),
    NEW.email
  )
  ON CONFLICT (user_id) DO NOTHING;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- ============================================================
-- 5. user_competitors (join table user <-> channels)
-- ============================================================
CREATE TABLE public.user_competitors (
  user_id      UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  channel_uuid UUID NOT NULL REFERENCES public.channels(id) ON DELETE CASCADE,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT now(),
  PRIMARY KEY (user_id, channel_uuid)
);

CREATE INDEX idx_user_competitors_user ON public.user_competitors(user_id);
CREATE INDEX idx_user_competitors_channel ON public.user_competitors(channel_uuid);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.user_competitors TO authenticated;
GRANT ALL ON public.user_competitors TO service_role;

ALTER TABLE public.user_competitors ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own competitors"
  ON public.user_competitors FOR SELECT TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can add their own competitors"
  ON public.user_competitors FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can remove their own competitors"
  ON public.user_competitors FOR DELETE TO authenticated
  USING (auth.uid() = user_id);

-- ============================================================
-- 6. Add user_id to my_channels / scores / briefs (all wiped above)
-- ============================================================
ALTER TABLE public.my_channels
  ADD COLUMN user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE;

ALTER TABLE public.scores
  ADD COLUMN user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE;

ALTER TABLE public.briefs
  ADD COLUMN user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE;

-- Make per-user scoring/briefs unique per video
CREATE UNIQUE INDEX idx_scores_user_video ON public.scores(user_id, video_uuid);
CREATE UNIQUE INDEX idx_briefs_user_video ON public.briefs(user_id, video_uuid);
CREATE INDEX idx_my_channels_user ON public.my_channels(user_id);

-- ============================================================
-- 7. RLS for my_channels / scores / briefs (per-user CRUD)
-- ============================================================
CREATE POLICY "Users CRUD their my_channels - select"
  ON public.my_channels FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Users CRUD their my_channels - insert"
  ON public.my_channels FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users CRUD their my_channels - update"
  ON public.my_channels FOR UPDATE TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Users CRUD their my_channels - delete"
  ON public.my_channels FOR DELETE TO authenticated USING (auth.uid() = user_id);

CREATE POLICY "Users CRUD their scores - select"
  ON public.scores FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Users CRUD their scores - insert"
  ON public.scores FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users CRUD their scores - update"
  ON public.scores FOR UPDATE TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Users CRUD their scores - delete"
  ON public.scores FOR DELETE TO authenticated USING (auth.uid() = user_id);

CREATE POLICY "Users CRUD their briefs - select"
  ON public.briefs FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Users CRUD their briefs - insert"
  ON public.briefs FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users CRUD their briefs - update"
  ON public.briefs FOR UPDATE TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Users CRUD their briefs - delete"
  ON public.briefs FOR DELETE TO authenticated USING (auth.uid() = user_id);

-- ============================================================
-- 8. channels / videos shared cache RLS
--    Any signed-in user can read or upsert; no client deletes.
-- ============================================================
CREATE POLICY "Authenticated read channels"
  ON public.channels FOR SELECT TO authenticated USING (true);
CREATE POLICY "Authenticated insert channels"
  ON public.channels FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Authenticated update channels"
  ON public.channels FOR UPDATE TO authenticated USING (true);

CREATE POLICY "Authenticated read videos"
  ON public.videos FOR SELECT TO authenticated USING (true);
CREATE POLICY "Authenticated insert videos"
  ON public.videos FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Authenticated update videos"
  ON public.videos FOR UPDATE TO authenticated USING (true);

-- ============================================================
-- 9. Final grants (re-assert; anon explicitly NOT granted)
-- ============================================================
GRANT SELECT, INSERT, UPDATE ON public.channels TO authenticated;
GRANT ALL ON public.channels TO service_role;
GRANT SELECT, INSERT, UPDATE ON public.videos TO authenticated;
GRANT ALL ON public.videos TO service_role;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.my_channels TO authenticated;
GRANT ALL ON public.my_channels TO service_role;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.scores TO authenticated;
GRANT ALL ON public.scores TO service_role;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.briefs TO authenticated;
GRANT ALL ON public.briefs TO service_role;