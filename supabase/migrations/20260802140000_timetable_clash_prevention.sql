CREATE OR REPLACE FUNCTION public.check_timetable_conflict()
RETURNS TRIGGER AS $$
DECLARE
  conflict_found BOOLEAN;
BEGIN
  -- Check for faculty conflict
  IF NEW.faculty_id IS NOT NULL THEN
    SELECT EXISTS (
      SELECT 1 FROM public.timetable_entries
      WHERE tenant_id = NEW.tenant_id
        AND weekday = NEW.weekday
        AND faculty_id = NEW.faculty_id
        AND id != COALESCE(NEW.id, '00000000-0000-0000-0000-000000000000'::uuid)
        AND starts_at < NEW.ends_at
        AND ends_at > NEW.starts_at
        AND is_cancelled = false
    ) INTO conflict_found;
    
    IF conflict_found THEN
      RAISE EXCEPTION 'Faculty conflict: The selected faculty is already scheduled during this time.';
    END IF;
  END IF;

  -- Check for room conflict
  IF NEW.room_id IS NOT NULL THEN
    SELECT EXISTS (
      SELECT 1 FROM public.timetable_entries
      WHERE tenant_id = NEW.tenant_id
        AND weekday = NEW.weekday
        AND room_id = NEW.room_id
        AND id != COALESCE(NEW.id, '00000000-0000-0000-0000-000000000000'::uuid)
        AND starts_at < NEW.ends_at
        AND ends_at > NEW.starts_at
        AND is_cancelled = false
    ) INTO conflict_found;
    
    IF conflict_found THEN
      RAISE EXCEPTION 'Room conflict: The selected room is already occupied during this time.';
    END IF;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_check_timetable_conflict ON public.timetable_entries;
CREATE TRIGGER trg_check_timetable_conflict
BEFORE INSERT OR UPDATE ON public.timetable_entries
FOR EACH ROW EXECUTE FUNCTION public.check_timetable_conflict();
