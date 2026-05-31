
-- Lock writes to service role only; revoke public write grants
-- Tables: briefs, channels, my_channels, scores, videos

-- Drop permissive write policies
DROP POLICY IF EXISTS "shared write briefs" ON public.briefs;
DROP POLICY IF EXISTS "shared update briefs" ON public.briefs;
DROP POLICY IF EXISTS "shared delete briefs" ON public.briefs;

DROP POLICY IF EXISTS "shared write channels" ON public.channels;
DROP POLICY IF EXISTS "shared update channels" ON public.channels;
DROP POLICY IF EXISTS "shared delete channels" ON public.channels;

DROP POLICY IF EXISTS "shared write videos" ON public.videos;
DROP POLICY IF EXISTS "shared update videos" ON public.videos;
DROP POLICY IF EXISTS "shared delete videos" ON public.videos;

DROP POLICY IF EXISTS "shared write scores" ON public.scores;
DROP POLICY IF EXISTS "shared update scores" ON public.scores;
DROP POLICY IF EXISTS "shared delete scores" ON public.scores;

-- my_channels: also drop public read
DROP POLICY IF EXISTS "shared read my_channels" ON public.my_channels;
DROP POLICY IF EXISTS "shared write my_channels" ON public.my_channels;
DROP POLICY IF EXISTS "shared update my_channels" ON public.my_channels;
DROP POLICY IF EXISTS "shared delete my_channels" ON public.my_channels;

-- Revoke write privileges from anon/authenticated on all tables
REVOKE INSERT, UPDATE, DELETE ON public.briefs FROM anon, authenticated;
REVOKE INSERT, UPDATE, DELETE ON public.channels FROM anon, authenticated;
REVOKE INSERT, UPDATE, DELETE ON public.videos FROM anon, authenticated;
REVOKE INSERT, UPDATE, DELETE ON public.scores FROM anon, authenticated;
REVOKE SELECT, INSERT, UPDATE, DELETE ON public.my_channels FROM anon, authenticated;

-- Ensure service_role has full access (bypasses RLS, but grant for clarity)
GRANT ALL ON public.briefs TO service_role;
GRANT ALL ON public.channels TO service_role;
GRANT ALL ON public.videos TO service_role;
GRANT ALL ON public.scores TO service_role;
GRANT ALL ON public.my_channels TO service_role;
