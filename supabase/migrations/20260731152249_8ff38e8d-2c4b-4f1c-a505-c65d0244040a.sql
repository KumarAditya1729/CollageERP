
-- ENUMS
CREATE TYPE public.curriculum_status AS ENUM ('draft','pending_approval','active','superseded','archived');
CREATE TYPE public.curriculum_category AS ENUM ('core','elective','open_elective','lab','project','internship','skill','value_added','audit','mandatory_non_credit');
CREATE TYPE public.room_type AS ENUM ('classroom','lab','seminar_hall','auditorium','library','office','other');
CREATE TYPE public.allocation_role AS ENUM ('lead','co_faculty','lab_instructor','tutor','guest');
CREATE TYPE public.specialization_kind AS ENUM ('major','minor','specialization','honours');

-- BATCHES
CREATE TABLE public.batches (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  campus_id uuid REFERENCES public.campuses(id) ON DELETE SET NULL,
  program_id uuid REFERENCES public.programs(id) ON DELETE SET NULL,
  academic_year_id uuid REFERENCES public.academic_years(id) ON DELETE SET NULL,
  name text NOT NULL,
  code text NOT NULL,
  entry_year integer,
  exit_year integer,
  capacity integer,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  created_by uuid, updated_by uuid,
  deleted_at timestamptz, deleted_by uuid,
  UNIQUE (tenant_id, code)
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.batches TO authenticated;
GRANT ALL ON public.batches TO service_role;
ALTER TABLE public.batches ENABLE ROW LEVEL SECURITY;
CREATE POLICY batches_select ON public.batches FOR SELECT TO authenticated USING (public.is_tenant_member(tenant_id));
CREATE POLICY batches_write ON public.batches FOR ALL TO authenticated USING (public.has_permission('section.manage', tenant_id)) WITH CHECK (public.has_permission('section.manage', tenant_id));

-- SECTIONS
CREATE TABLE public.sections (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  campus_id uuid REFERENCES public.campuses(id) ON DELETE SET NULL,
  program_id uuid REFERENCES public.programs(id) ON DELETE SET NULL,
  semester_id uuid REFERENCES public.semesters(id) ON DELETE SET NULL,
  batch_id uuid REFERENCES public.batches(id) ON DELETE SET NULL,
  advisor_faculty_id uuid REFERENCES public.faculty(id) ON DELETE SET NULL,
  name text NOT NULL,
  code text NOT NULL,
  capacity integer,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  created_by uuid, updated_by uuid,
  deleted_at timestamptz, deleted_by uuid,
  UNIQUE (tenant_id, code)
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.sections TO authenticated;
GRANT ALL ON public.sections TO service_role;
ALTER TABLE public.sections ENABLE ROW LEVEL SECURITY;
CREATE POLICY sections_select ON public.sections FOR SELECT TO authenticated USING (public.is_tenant_member(tenant_id));
CREATE POLICY sections_write ON public.sections FOR ALL TO authenticated USING (public.has_permission('section.manage', tenant_id)) WITH CHECK (public.has_permission('section.manage', tenant_id));

-- SPECIALIZATIONS
CREATE TABLE public.specializations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  program_id uuid REFERENCES public.programs(id) ON DELETE CASCADE,
  kind public.specialization_kind NOT NULL DEFAULT 'specialization',
  name text NOT NULL,
  code text NOT NULL,
  min_credits integer,
  description text,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  created_by uuid, updated_by uuid,
  deleted_at timestamptz, deleted_by uuid,
  UNIQUE (tenant_id, code)
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.specializations TO authenticated;
GRANT ALL ON public.specializations TO service_role;
ALTER TABLE public.specializations ENABLE ROW LEVEL SECURITY;
CREATE POLICY specializations_select ON public.specializations FOR SELECT TO authenticated USING (public.is_tenant_member(tenant_id));
CREATE POLICY specializations_write ON public.specializations FOR ALL TO authenticated USING (public.has_permission('program.manage', tenant_id)) WITH CHECK (public.has_permission('program.manage', tenant_id));

-- CURRICULA
CREATE TABLE public.curricula (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  program_id uuid NOT NULL REFERENCES public.programs(id) ON DELETE CASCADE,
  name text NOT NULL,
  version text NOT NULL,
  regulation text,
  status public.curriculum_status NOT NULL DEFAULT 'draft',
  effective_from date,
  effective_to date,
  total_credits integer,
  notes text,
  approved_by uuid,
  approved_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  created_by uuid, updated_by uuid,
  deleted_at timestamptz, deleted_by uuid,
  UNIQUE (tenant_id, program_id, version)
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.curricula TO authenticated;
GRANT ALL ON public.curricula TO service_role;
ALTER TABLE public.curricula ENABLE ROW LEVEL SECURITY;
CREATE POLICY curricula_select ON public.curricula FOR SELECT TO authenticated USING (public.is_tenant_member(tenant_id));
CREATE POLICY curricula_write ON public.curricula FOR ALL TO authenticated USING (public.has_permission('curriculum.manage', tenant_id)) WITH CHECK (public.has_permission('curriculum.manage', tenant_id));

-- CURRICULUM COURSES
CREATE TABLE public.curriculum_courses (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  curriculum_id uuid NOT NULL REFERENCES public.curricula(id) ON DELETE CASCADE,
  course_id uuid NOT NULL REFERENCES public.courses(id) ON DELETE CASCADE,
  semester_number integer NOT NULL DEFAULT 1,
  category public.curriculum_category NOT NULL DEFAULT 'core',
  credits numeric,
  is_mandatory boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  created_by uuid, updated_by uuid,
  deleted_at timestamptz, deleted_by uuid,
  UNIQUE (curriculum_id, course_id)
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.curriculum_courses TO authenticated;
GRANT ALL ON public.curriculum_courses TO service_role;
ALTER TABLE public.curriculum_courses ENABLE ROW LEVEL SECURITY;
CREATE POLICY curriculum_courses_select ON public.curriculum_courses FOR SELECT TO authenticated USING (public.is_tenant_member(tenant_id));
CREATE POLICY curriculum_courses_write ON public.curriculum_courses FOR ALL TO authenticated USING (public.has_permission('curriculum.manage', tenant_id)) WITH CHECK (public.has_permission('curriculum.manage', tenant_id));

-- PREREQUISITES
CREATE TABLE public.course_prerequisites (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  course_id uuid NOT NULL REFERENCES public.courses(id) ON DELETE CASCADE,
  prerequisite_course_id uuid NOT NULL REFERENCES public.courses(id) ON DELETE CASCADE,
  kind text NOT NULL DEFAULT 'prerequisite',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  created_by uuid, updated_by uuid,
  deleted_at timestamptz, deleted_by uuid,
  UNIQUE (course_id, prerequisite_course_id, kind)
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.course_prerequisites TO authenticated;
GRANT ALL ON public.course_prerequisites TO service_role;
ALTER TABLE public.course_prerequisites ENABLE ROW LEVEL SECURITY;
CREATE POLICY course_prerequisites_select ON public.course_prerequisites FOR SELECT TO authenticated USING (public.is_tenant_member(tenant_id));
CREATE POLICY course_prerequisites_write ON public.course_prerequisites FOR ALL TO authenticated USING (public.has_permission('course.manage', tenant_id)) WITH CHECK (public.has_permission('course.manage', tenant_id));

-- OUTCOMES
CREATE TABLE public.course_outcomes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  course_id uuid NOT NULL REFERENCES public.courses(id) ON DELETE CASCADE,
  code text NOT NULL,
  description text NOT NULL,
  bloom_level text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  created_by uuid, updated_by uuid,
  deleted_at timestamptz, deleted_by uuid,
  UNIQUE (course_id, code)
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.course_outcomes TO authenticated;
GRANT ALL ON public.course_outcomes TO service_role;
ALTER TABLE public.course_outcomes ENABLE ROW LEVEL SECURITY;
CREATE POLICY course_outcomes_select ON public.course_outcomes FOR SELECT TO authenticated USING (public.is_tenant_member(tenant_id));
CREATE POLICY course_outcomes_write ON public.course_outcomes FOR ALL TO authenticated USING (public.has_permission('course.manage', tenant_id)) WITH CHECK (public.has_permission('course.manage', tenant_id));

CREATE TABLE public.program_outcomes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  program_id uuid NOT NULL REFERENCES public.programs(id) ON DELETE CASCADE,
  code text NOT NULL,
  description text NOT NULL,
  is_pso boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  created_by uuid, updated_by uuid,
  deleted_at timestamptz, deleted_by uuid,
  UNIQUE (program_id, code)
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.program_outcomes TO authenticated;
GRANT ALL ON public.program_outcomes TO service_role;
ALTER TABLE public.program_outcomes ENABLE ROW LEVEL SECURITY;
CREATE POLICY program_outcomes_select ON public.program_outcomes FOR SELECT TO authenticated USING (public.is_tenant_member(tenant_id));
CREATE POLICY program_outcomes_write ON public.program_outcomes FOR ALL TO authenticated USING (public.has_permission('program.manage', tenant_id)) WITH CHECK (public.has_permission('program.manage', tenant_id));

CREATE TABLE public.co_po_mappings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  course_outcome_id uuid NOT NULL REFERENCES public.course_outcomes(id) ON DELETE CASCADE,
  program_outcome_id uuid NOT NULL REFERENCES public.program_outcomes(id) ON DELETE CASCADE,
  strength smallint NOT NULL DEFAULT 1,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  created_by uuid, updated_by uuid,
  deleted_at timestamptz, deleted_by uuid,
  UNIQUE (course_outcome_id, program_outcome_id)
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.co_po_mappings TO authenticated;
GRANT ALL ON public.co_po_mappings TO service_role;
ALTER TABLE public.co_po_mappings ENABLE ROW LEVEL SECURITY;
CREATE POLICY co_po_mappings_select ON public.co_po_mappings FOR SELECT TO authenticated USING (public.is_tenant_member(tenant_id));
CREATE POLICY co_po_mappings_write ON public.co_po_mappings FOR ALL TO authenticated USING (public.has_permission('course.manage', tenant_id)) WITH CHECK (public.has_permission('course.manage', tenant_id));

-- FACULTY ALLOCATIONS
CREATE TABLE public.faculty_allocations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  campus_id uuid REFERENCES public.campuses(id) ON DELETE SET NULL,
  faculty_id uuid NOT NULL REFERENCES public.faculty(id) ON DELETE CASCADE,
  course_id uuid NOT NULL REFERENCES public.courses(id) ON DELETE CASCADE,
  section_id uuid REFERENCES public.sections(id) ON DELETE SET NULL,
  semester_id uuid REFERENCES public.semesters(id) ON DELETE SET NULL,
  academic_session_id uuid REFERENCES public.academic_sessions(id) ON DELETE SET NULL,
  role public.allocation_role NOT NULL DEFAULT 'lead',
  hours_per_week numeric NOT NULL DEFAULT 0,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  created_by uuid, updated_by uuid,
  deleted_at timestamptz, deleted_by uuid
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.faculty_allocations TO authenticated;
GRANT ALL ON public.faculty_allocations TO service_role;
ALTER TABLE public.faculty_allocations ENABLE ROW LEVEL SECURITY;
CREATE POLICY faculty_allocations_select ON public.faculty_allocations FOR SELECT TO authenticated USING (public.is_tenant_member(tenant_id));
CREATE POLICY faculty_allocations_write ON public.faculty_allocations FOR ALL TO authenticated USING (public.has_permission('faculty.assign', tenant_id)) WITH CHECK (public.has_permission('faculty.assign', tenant_id));

-- ROOMS
CREATE TABLE public.rooms (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  campus_id uuid REFERENCES public.campuses(id) ON DELETE SET NULL,
  building_id uuid REFERENCES public.buildings(id) ON DELETE SET NULL,
  department_id uuid REFERENCES public.departments(id) ON DELETE SET NULL,
  name text NOT NULL,
  code text NOT NULL,
  room_type public.room_type NOT NULL DEFAULT 'classroom',
  floor integer NOT NULL DEFAULT 0,
  capacity integer,
  equipment text,
  is_available boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  created_by uuid, updated_by uuid,
  deleted_at timestamptz, deleted_by uuid,
  UNIQUE (tenant_id, code)
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.rooms TO authenticated;
GRANT ALL ON public.rooms TO service_role;
ALTER TABLE public.rooms ENABLE ROW LEVEL SECURITY;
CREATE POLICY rooms_select ON public.rooms FOR SELECT TO authenticated USING (public.is_tenant_member(tenant_id));
CREATE POLICY rooms_write ON public.rooms FOR ALL TO authenticated USING (public.has_permission('room.manage', tenant_id)) WITH CHECK (public.has_permission('room.manage', tenant_id));

-- TIME SLOTS
CREATE TABLE public.time_slots (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  campus_id uuid REFERENCES public.campuses(id) ON DELETE SET NULL,
  name text NOT NULL,
  day_of_week smallint NOT NULL DEFAULT 1,
  start_time time NOT NULL,
  end_time time NOT NULL,
  slot_order integer NOT NULL DEFAULT 1,
  is_break boolean NOT NULL DEFAULT false,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  created_by uuid, updated_by uuid,
  deleted_at timestamptz, deleted_by uuid
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.time_slots TO authenticated;
GRANT ALL ON public.time_slots TO service_role;
ALTER TABLE public.time_slots ENABLE ROW LEVEL SECURITY;
CREATE POLICY time_slots_select ON public.time_slots FOR SELECT TO authenticated USING (public.is_tenant_member(tenant_id));
CREATE POLICY time_slots_write ON public.time_slots FOR ALL TO authenticated USING (public.has_permission('timetable.manage', tenant_id)) WITH CHECK (public.has_permission('timetable.manage', tenant_id));

-- EXTEND EXISTING TABLES
ALTER TABLE public.departments ADD COLUMN IF NOT EXISTS vision text, ADD COLUMN IF NOT EXISTS mission text;
ALTER TABLE public.students ADD COLUMN IF NOT EXISTS batch_id uuid REFERENCES public.batches(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS section_id uuid REFERENCES public.sections(id) ON DELETE SET NULL;
ALTER TABLE public.enrollments ADD COLUMN IF NOT EXISTS section_id uuid REFERENCES public.sections(id) ON DELETE SET NULL;

-- INDEXES
CREATE INDEX idx_sections_program ON public.sections(tenant_id, program_id);
CREATE INDEX idx_batches_program ON public.batches(tenant_id, program_id);
CREATE INDEX idx_curricula_program ON public.curricula(tenant_id, program_id);
CREATE INDEX idx_curriculum_courses_curriculum ON public.curriculum_courses(curriculum_id);
CREATE INDEX idx_faculty_allocations_faculty ON public.faculty_allocations(tenant_id, faculty_id);
CREATE INDEX idx_faculty_allocations_course ON public.faculty_allocations(tenant_id, course_id);
CREATE INDEX idx_rooms_building ON public.rooms(tenant_id, building_id);
CREATE INDEX idx_time_slots_day ON public.time_slots(tenant_id, day_of_week, slot_order);
CREATE INDEX idx_students_section ON public.students(section_id);

-- TRIGGERS
DO $$
DECLARE t text;
BEGIN
  FOREACH t IN ARRAY ARRAY['batches','sections','specializations','curricula','curriculum_courses','course_prerequisites','course_outcomes','program_outcomes','co_po_mappings','faculty_allocations','rooms','time_slots']
  LOOP
    EXECUTE format('CREATE TRIGGER set_updated_at_%1$s BEFORE UPDATE ON public.%1$I FOR EACH ROW EXECUTE FUNCTION public.set_updated_at()', t);
    EXECUTE format('CREATE TRIGGER set_created_by_%1$s BEFORE INSERT ON public.%1$I FOR EACH ROW EXECUTE FUNCTION public.set_created_by()', t);
    EXECUTE format('CREATE TRIGGER audit_%1$s AFTER INSERT OR UPDATE OR DELETE ON public.%1$I FOR EACH ROW EXECUTE FUNCTION public.audit_row_change()', t);
  END LOOP;
END $$;

-- PERMISSIONS
INSERT INTO public.permissions (key, name, description, module, resource, action)
VALUES
  ('curriculum.manage','Manage curriculum','Create and approve curriculum versions','academics','curriculum','manage'),
  ('section.manage','Manage sections & batches','Create sections, batches and cohorts','academics','section','manage'),
  ('faculty.assign','Assign faculty','Allocate faculty to subjects and sections','academics','faculty','assign'),
  ('room.manage','Manage rooms','Manage buildings, rooms and labs','infrastructure','room','manage')
ON CONFLICT (key) DO NOTHING;

INSERT INTO public.role_permissions (role_id, permission_id)
SELECT rp.role_id, p.id
FROM public.permissions p
JOIN public.permissions cm ON cm.key = 'course.manage'
JOIN public.role_permissions rp ON rp.permission_id = cm.id
WHERE p.key IN ('curriculum.manage','section.manage','faculty.assign','room.manage')
ON CONFLICT DO NOTHING;
