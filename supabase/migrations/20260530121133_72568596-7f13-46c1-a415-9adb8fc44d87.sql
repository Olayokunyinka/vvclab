ALTER TABLE public.profiles
ADD COLUMN theme text NOT NULL DEFAULT 'light';

ALTER TABLE public.profiles
ADD CONSTRAINT profiles_theme_check CHECK (theme IN ('light', 'dark'));