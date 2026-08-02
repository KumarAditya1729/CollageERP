-- ==============================================================================
-- Transport Drivers, Attendants, and Incidents Schema Perfection
-- ==============================================================================

-- 1. Add first_name, last_name, email, and phone to trn_drivers and make staff_id optional
ALTER TABLE public.trn_drivers ALTER COLUMN staff_id DROP NOT NULL;
ALTER TABLE public.trn_drivers ADD COLUMN IF NOT EXISTS first_name text DEFAULT '';
ALTER TABLE public.trn_drivers ADD COLUMN IF NOT EXISTS last_name text DEFAULT '';
ALTER TABLE public.trn_drivers ADD COLUMN IF NOT EXISTS email text DEFAULT '';
ALTER TABLE public.trn_drivers ADD COLUMN IF NOT EXISTS phone text DEFAULT '';
ALTER TABLE public.trn_drivers ADD COLUMN IF NOT EXISTS deleted_at timestamptz DEFAULT NULL;
ALTER TABLE public.trn_drivers ADD COLUMN IF NOT EXISTS updated_at timestamptz DEFAULT now();

-- 2. Add first_name, last_name, email, and phone to trn_attendants and make staff_id optional
ALTER TABLE public.trn_attendants ALTER COLUMN staff_id DROP NOT NULL;
ALTER TABLE public.trn_attendants ADD COLUMN IF NOT EXISTS first_name text DEFAULT '';
ALTER TABLE public.trn_attendants ADD COLUMN IF NOT EXISTS last_name text DEFAULT '';
ALTER TABLE public.trn_attendants ADD COLUMN IF NOT EXISTS email text DEFAULT '';
ALTER TABLE public.trn_attendants ADD COLUMN IF NOT EXISTS phone text DEFAULT '';
ALTER TABLE public.trn_attendants ADD COLUMN IF NOT EXISTS deleted_at timestamptz DEFAULT NULL;
ALTER TABLE public.trn_attendants ADD COLUMN IF NOT EXISTS updated_at timestamptz DEFAULT now();

-- 3. Backfill any existing trn_drivers and trn_attendants from public.staff where staff_id is present
UPDATE public.trn_drivers d
SET 
  first_name = COALESCE(NULLIF(d.first_name, ''), s.first_name, 'Driver'),
  last_name = COALESCE(NULLIF(d.last_name, ''), s.last_name, ''),
  email = COALESCE(NULLIF(d.email, ''), s.email, ''),
  phone = COALESCE(NULLIF(d.phone, ''), s.phone, '')
FROM public.staff s
WHERE d.staff_id = s.id;

UPDATE public.trn_attendants a
SET 
  first_name = COALESCE(NULLIF(a.first_name, ''), s.first_name, 'Attendant'),
  last_name = COALESCE(NULLIF(a.last_name, ''), s.last_name, ''),
  email = COALESCE(NULLIF(a.email, ''), s.email, ''),
  phone = COALESCE(NULLIF(a.phone, ''), s.phone, '')
FROM public.staff s
WHERE a.staff_id = s.id;

-- 4. Create trigger function to automatically populate driver/attendant names from staff if left blank on insertion
CREATE OR REPLACE FUNCTION public.sync_transport_personnel_names()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.staff_id IS NOT NULL AND (NEW.first_name IS NULL OR NEW.first_name = '') THEN
    SELECT COALESCE(first_name, 'Unknown'), COALESCE(last_name, ''), COALESCE(email, ''), COALESCE(phone, '')
    INTO NEW.first_name, NEW.last_name, NEW.email, NEW.phone
    FROM public.staff
    WHERE id = NEW.staff_id;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_sync_driver_names ON public.trn_drivers;
CREATE TRIGGER trg_sync_driver_names
  BEFORE INSERT OR UPDATE ON public.trn_drivers
  FOR EACH ROW
  EXECUTE FUNCTION public.sync_transport_personnel_names();

DROP TRIGGER IF EXISTS trg_sync_attendant_names ON public.trn_attendants;
CREATE TRIGGER trg_sync_attendant_names
  BEFORE INSERT OR UPDATE ON public.trn_attendants
  FOR EACH ROW
  EXECUTE FUNCTION public.sync_transport_personnel_names();

-- 5. Add incident_date to trn_incidents to align with frontend queries and backfill from timestamp/created_at
ALTER TABLE public.trn_incidents ADD COLUMN IF NOT EXISTS incident_date timestamptz DEFAULT now();
UPDATE public.trn_incidents SET incident_date = COALESCE(timestamp, created_at, now()) WHERE incident_date IS NULL;
CREATE INDEX IF NOT EXISTS idx_trn_incidents_date ON public.trn_incidents(incident_date);

-- 6. Add indexes on first_name and last_name for optimal sorting performance
CREATE INDEX IF NOT EXISTS idx_trn_drivers_name ON public.trn_drivers(first_name, last_name);
CREATE INDEX IF NOT EXISTS idx_trn_attendants_name ON public.trn_attendants(first_name, last_name);
