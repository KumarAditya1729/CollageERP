-- ==============================================================================
-- Add enrollment_number to students and employee_id to staff/faculty with auto-sync triggers
-- ==============================================================================

-- 1. Add enrollment_number to students table and backfill
ALTER TABLE public.students ADD COLUMN IF NOT EXISTS enrollment_number text;

UPDATE public.students
SET enrollment_number = COALESCE(
  enrollment_number,
  admission_number,
  roll_number,
  registration_number,
  'ENR-' || substr(id::text, 1, 8)
)
WHERE enrollment_number IS NULL OR enrollment_number = '';

-- 2. Create sync trigger function for students table
CREATE OR REPLACE FUNCTION public.sync_student_identifiers()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.enrollment_number IS NULL OR NEW.enrollment_number = '' THEN
    NEW.enrollment_number := COALESCE(NEW.admission_number, NEW.roll_number, NEW.registration_number, 'ENR-' || substr(NEW.id::text, 1, 8));
  END IF;
  IF NEW.admission_number IS NULL OR NEW.admission_number = '' THEN
    NEW.admission_number := COALESCE(NEW.enrollment_number, NEW.roll_number, 'ADM-' || substr(NEW.id::text, 1, 8));
  END IF;
  IF NEW.roll_number IS NULL OR NEW.roll_number = '' THEN
    NEW.roll_number := COALESCE(NEW.enrollment_number, NEW.admission_number, substr(NEW.id::text, 1, 8));
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS trg_sync_student_identifiers ON public.students;
CREATE TRIGGER trg_sync_student_identifiers
  BEFORE INSERT OR UPDATE ON public.students
  FOR EACH ROW
  EXECUTE FUNCTION public.sync_student_identifiers();

-- 3. Add employee_id column to staff and faculty tables and backfill
ALTER TABLE public.staff ADD COLUMN IF NOT EXISTS employee_id text;
UPDATE public.staff
SET employee_id = COALESCE(employee_id, employee_code, 'EMP-' || substr(id::text, 1, 8))
WHERE employee_id IS NULL OR employee_id = '';

ALTER TABLE public.faculty ADD COLUMN IF NOT EXISTS employee_id text;
UPDATE public.faculty
SET employee_id = COALESCE(employee_id, employee_code, 'FAC-' || substr(id::text, 1, 8))
WHERE employee_id IS NULL OR employee_id = '';

-- 4. Create sync trigger function for staff and faculty
CREATE OR REPLACE FUNCTION public.sync_employee_identifiers()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.employee_id IS NULL OR NEW.employee_id = '' THEN
    NEW.employee_id := COALESCE(NEW.employee_code, 'EMP-' || substr(NEW.id::text, 1, 8));
  END IF;
  IF NEW.employee_code IS NULL OR NEW.employee_code = '' THEN
    NEW.employee_code := COALESCE(NEW.employee_id, 'CODE-' || substr(NEW.id::text, 1, 8));
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS trg_sync_staff_identifiers ON public.staff;
CREATE TRIGGER trg_sync_staff_identifiers
  BEFORE INSERT OR UPDATE ON public.staff
  FOR EACH ROW
  EXECUTE FUNCTION public.sync_employee_identifiers();

DROP TRIGGER IF EXISTS trg_sync_faculty_identifiers ON public.faculty;
CREATE TRIGGER trg_sync_faculty_identifiers
  BEFORE INSERT OR UPDATE ON public.faculty
  FOR EACH ROW
  EXECUTE FUNCTION public.sync_employee_identifiers();

-- 5. Ensure indexes exist for faster lookups on enrollment_number and employee_id
CREATE INDEX IF NOT EXISTS idx_students_enrollment_number ON public.students(enrollment_number);
CREATE INDEX IF NOT EXISTS idx_staff_employee_id ON public.staff(employee_id);
CREATE INDEX IF NOT EXISTS idx_faculty_employee_id ON public.faculty(employee_id);
