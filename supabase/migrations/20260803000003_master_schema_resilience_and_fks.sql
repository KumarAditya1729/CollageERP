-- ==============================================================================
-- Master Schema Resilience, Universal Auditing Fields, and Profile Relationships
-- ==============================================================================

DO $$
DECLARE
  rec RECORD;
  fk_name TEXT;
BEGIN
  -- 1. Ensure all domain tables in public schema have deleted_at, created_at, and updated_at for enterprise auditing & soft deletion resilience
  FOR rec IN 
    SELECT table_name 
    FROM information_schema.tables 
    WHERE table_schema = 'public' 
      AND table_type = 'BASE TABLE' 
      AND table_name NOT IN ('tenant_members', 'schema_migrations')
  LOOP
    BEGIN
      EXECUTE format('ALTER TABLE public.%I ADD COLUMN IF NOT EXISTS deleted_at timestamptz DEFAULT NULL;', rec.table_name);
      EXECUTE format('ALTER TABLE public.%I ADD COLUMN IF NOT EXISTS created_at timestamptz DEFAULT now();', rec.table_name);
      EXECUTE format('ALTER TABLE public.%I ADD COLUMN IF NOT EXISTS updated_at timestamptz DEFAULT now();', rec.table_name);
    EXCEPTION WHEN OTHERS THEN
      RAISE NOTICE 'Notice adding columns to %: %', rec.table_name, SQLERRM;
    END;
  END LOOP;

  -- 2. Automatically link any user_id column in public domain tables to public.profiles(id) if not already linked
  FOR rec IN
    SELECT c.table_name, c.column_name
    FROM information_schema.columns c
    JOIN information_schema.tables t ON c.table_name = t.table_name AND t.table_schema = 'public' AND t.table_type = 'BASE TABLE'
    WHERE c.table_schema = 'public' 
      AND c.column_name = 'user_id' 
      AND c.table_name NOT IN ('profiles', 'tenant_members')
  LOOP
    fk_name := format('fk_%s_user_to_profiles', left(rec.table_name, 25));
    IF NOT EXISTS (
      SELECT 1 FROM information_schema.table_constraints tc
      JOIN information_schema.key_column_usage kcu ON tc.constraint_name = kcu.constraint_name AND tc.table_schema = kcu.table_schema
      WHERE tc.table_schema = 'public' 
        AND tc.table_name = rec.table_name 
        AND tc.constraint_type = 'FOREIGN KEY' 
        AND kcu.column_name = rec.column_name
        AND (tc.constraint_name ILIKE '%profile%' OR tc.constraint_name = fk_name)
    ) THEN
      BEGIN
        EXECUTE format('ALTER TABLE public.%I ADD CONSTRAINT %I FOREIGN KEY (%I) REFERENCES public.profiles(id) ON DELETE CASCADE NOT VALID;', rec.table_name, fk_name, rec.column_name);
        RAISE NOTICE 'Created profiles relational link % on table %', fk_name, rec.table_name;
      EXCEPTION WHEN OTHERS THEN
        RAISE NOTICE 'Notice while linking constraint % on table %: %', fk_name, rec.table_name, SQLERRM;
      END;
    END IF;
  END LOOP;

  -- 3. Also check secondary user reference columns (issued_by, received_by, reported_by, assigned_to, sender_id, author_id)
  FOR rec IN
    SELECT c.table_name, c.column_name
    FROM information_schema.columns c
    JOIN information_schema.tables t ON c.table_name = t.table_name AND t.table_schema = 'public' AND t.table_type = 'BASE TABLE'
    WHERE c.table_schema = 'public' 
      AND c.column_name IN ('issued_by', 'received_by', 'reported_by', 'assigned_to', 'performed_by', 'conducted_by', 'adjusted_by', 'requested_by', 'approved_by', 'consumed_by', 'reviewer_id', 'dispatched_by', 'author_id')
      AND c.table_name NOT IN ('profiles', 'tenant_members')
  LOOP
    fk_name := format('fk_%s_%s_profiles', left(rec.table_name, 20), left(rec.column_name, 10));
    IF NOT EXISTS (
      SELECT 1 FROM information_schema.table_constraints tc
      JOIN information_schema.key_column_usage kcu ON tc.constraint_name = kcu.constraint_name AND tc.table_schema = kcu.table_schema
      WHERE tc.table_schema = 'public' 
        AND tc.table_name = rec.table_name 
        AND tc.constraint_type = 'FOREIGN KEY' 
        AND kcu.column_name = rec.column_name
        AND (tc.constraint_name ILIKE '%profile%' OR tc.constraint_name = fk_name)
    ) THEN
      BEGIN
        EXECUTE format('ALTER TABLE public.%I ADD CONSTRAINT %I FOREIGN KEY (%I) REFERENCES public.profiles(id) ON DELETE SET NULL NOT VALID;', rec.table_name, fk_name, rec.column_name);
        RAISE NOTICE 'Created secondary profiles link % on table %', fk_name, rec.table_name;
      EXCEPTION WHEN OTHERS THEN
        RAISE NOTICE 'Notice while linking constraint % on table %: %', fk_name, rec.table_name, SQLERRM;
      END;
    END IF;
  END LOOP;

END;
$$ LANGUAGE plpgsql;
