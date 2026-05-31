GRANT SELECT, INSERT, UPDATE, DELETE ON public.briefs TO anon, authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.channels TO anon, authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.videos TO anon, authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.scores TO anon, authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.my_channels TO anon, authenticated;

DROP POLICY IF EXISTS "shared read channels" ON public.channels;
DROP POLICY IF EXISTS "shared write channels" ON public.channels;
DROP POLICY IF EXISTS "shared update channels" ON public.channels;
DROP POLICY IF EXISTS "shared delete channels" ON public.channels;

CREATE POLICY "shared read channels" ON public.channels FOR SELECT USING (true);
CREATE POLICY "shared write channels" ON public.channels FOR INSERT WITH CHECK (true);
CREATE POLICY "shared update channels" ON public.channels FOR UPDATE USING (true);
CREATE POLICY "shared delete channels" ON public.channels FOR DELETE USING (true);

DROP POLICY IF EXISTS "shared read videos" ON public.videos;
DROP POLICY IF EXISTS "shared write videos" ON public.videos;
DROP POLICY IF EXISTS "shared update videos" ON public.videos;
DROP POLICY IF EXISTS "shared delete videos" ON public.videos;

CREATE POLICY "shared read videos" ON public.videos FOR SELECT USING (true);
CREATE POLICY "shared write videos" ON public.videos FOR INSERT WITH CHECK (true);
CREATE POLICY "shared update videos" ON public.videos FOR UPDATE USING (true);
CREATE POLICY "shared delete videos" ON public.videos FOR DELETE USING (true);

DROP POLICY IF EXISTS "shared read scores" ON public.scores;
DROP POLICY IF EXISTS "shared write scores" ON public.scores;
DROP POLICY IF EXISTS "shared update scores" ON public.scores;
DROP POLICY IF EXISTS "shared delete scores" ON public.scores;

CREATE POLICY "shared read scores" ON public.scores FOR SELECT USING (true);
CREATE POLICY "shared write scores" ON public.scores FOR INSERT WITH CHECK (true);
CREATE POLICY "shared update scores" ON public.scores FOR UPDATE USING (true);
CREATE POLICY "shared delete scores" ON public.scores FOR DELETE USING (true);

DROP POLICY IF EXISTS "shared read briefs" ON public.briefs;
DROP POLICY IF EXISTS "shared write briefs" ON public.briefs;
DROP POLICY IF EXISTS "shared update briefs" ON public.briefs;
DROP POLICY IF EXISTS "shared delete briefs" ON public.briefs;

CREATE POLICY "shared read briefs" ON public.briefs FOR SELECT USING (true);
CREATE POLICY "shared write briefs" ON public.briefs FOR INSERT WITH CHECK (true);
CREATE POLICY "shared update briefs" ON public.briefs FOR UPDATE USING (true);
CREATE POLICY "shared delete briefs" ON public.briefs FOR DELETE USING (true);

DROP POLICY IF EXISTS "shared read my_channels" ON public.my_channels;
DROP POLICY IF EXISTS "shared write my_channels" ON public.my_channels;
DROP POLICY IF EXISTS "shared update my_channels" ON public.my_channels;
DROP POLICY IF EXISTS "shared delete my_channels" ON public.my_channels;

CREATE POLICY "shared read my_channels" ON public.my_channels FOR SELECT USING (true);
CREATE POLICY "shared write my_channels" ON public.my_channels FOR INSERT WITH CHECK (true);
CREATE POLICY "shared update my_channels" ON public.my_channels FOR UPDATE USING (true);
CREATE POLICY "shared delete my_channels" ON public.my_channels FOR DELETE USING (true);