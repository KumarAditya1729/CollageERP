-- ==============================================================================
-- Add first_name and last_name to public.profiles and sync with full_name
-- ==============================================================================

ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS first_name text;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS last_name text;

-- Backfill existing profile rows where first_name is empty or null
UPDATE public.profiles
SET 
  first_name = COALESCE(
    first_name, 
    NULLIF(split_part(full_name, ' ', 1), ''), 
    NULLIF(split_part(display_name, ' ', 1), ''), 
    NULLIF(split_part(email, '@', 1), ''), 
    'User'
  ),
  last_name = COALESCE(
    last_name, 
    CASE WHEN strpos(full_name, ' ') > 0 THEN substring(full_name from strpos(full_name, ' ') + 1) ELSE '' END
  )
WHERE first_name IS NULL OR last_name IS NULL;

-- Automated trigger to keep first_name, last_name, and full_name synchronized
CREATE OR REPLACE FUNCTION public.sync_profile_names()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.first_name IS NULL OR NEW.first_name = '' THEN
    IF NEW.full_name IS NOT NULL AND NEW.full_name != '' THEN
      NEW.first_name := split_part(NEW.full_name, ' ', 1);
      NEW.last_name := CASE WHEN strpos(NEW.full_name, ' ') > 0 THEN substring(NEW.full_name from strpos(NEW.full_name, ' ') + 1) ELSE '' END;
    ELSIF NEW.email IS NOT NULL THEN
      NEW.first_name := split_part(NEW.email, '@', 1);
    ELSE
      NEW.first_name := 'User';
    END IF;
  END IF;

  IF NEW.full_name IS NULL OR NEW.full_name = '' THEN
    NEW.full_name := trim(concat(NEW.first_name, ' ', COALESCE(NEW.last_name, '')));
  END IF;

  IF NEW.display_name IS NULL OR NEW.display_name = '' THEN
    NEW.display_name := NEW.full_name;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS trg_sync_profile_names ON public.profiles;
CREATE TRIGGER trg_sync_profile_names
BEFORE INSERT OR UPDATE ON public.profiles
FOR EACH ROW
EXECUTE FUNCTION public.sync_profile_names();
