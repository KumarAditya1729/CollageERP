
-- ============================================================
-- CampusOS Foundation : Part 2
-- Master data, academic structure, people, settings, custom fields
-- ============================================================

CREATE TYPE public.program_level AS ENUM ('certificate','diploma','undergraduate','postgraduate','doctorate','postdoctoral');
CREATE TYPE public.course_type AS ENUM ('core','elective','open_elective','lab','project','internship','audit');
CREATE TYPE public.student_status AS ENUM ('applicant','enrolled','on_leave','graduated','dropped','suspended','transferred');
CREATE TYPE public.employment_type AS ENUM ('full_time','part_time','contract','visiting','guest','intern');
CREATE TYPE public.employment_status AS ENUM ('active','probation','on_leave','resigned','terminated','retired');
CREATE TYPE public.enrollment_status AS ENUM ('registered','active','completed','withdrawn','failed');
CREATE TYPE public.setting_scope AS ENUM ('general','academic','finance','notification','branding','security','integration');
CREATE TYPE public.custom_field_type AS ENUM ('text','textarea','number','decimal','boolean','date','datetime','select','multiselect','email','phone','url','file','json');

-- ---------- MASTER DATA (global reference) ----------
CREATE TABLE public.countries (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  iso2 text NOT NULL UNIQUE,
  iso3 text,
  name text NOT NULL,
  phone_code text,
  currency text,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE public.states (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  country_id uuid NOT NULL REFERENCES public.countries(id) ON DELETE CASCADE,
  code text,
  name text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (country_id, name)
);
CREATE INDEX idx_states_country ON public.states(country_id);

CREATE TABLE public.cities (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  state_id uuid NOT NULL REFERENCES public.states(id) ON DELETE CASCADE,
  name text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (state_id, name)
);
CREATE INDEX idx_cities_state ON public.cities(state_id);

-- Generic tenant-extensible master lists (blood groups, religions, castes, categories...)
CREATE TABLE public.master_data_types (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  key text NOT NULL UNIQUE,
  name text NOT NULL,
  description text,
  is_system boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE public.master_data_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  type_id uuid NOT NULL REFERENCES public.master_data_types(id) ON DELETE CASCADE,
  tenant_id uuid REFERENCES public.tenants(id) ON DELETE CASCADE,
  code text NOT NULL,
  label text NOT NULL,
  parent_id uuid REFERENCES public.master_data_items(id) ON DELETE SET NULL,
  sort_order int NOT NULL DEFAULT 0,
  is_active boolean NOT NULL DEFAULT true,
  metadata jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  created_by uuid,
  updated_by uuid,
  deleted_at timestamptz,
  deleted_by uuid
);
CREATE UNIQUE INDEX idx_master_items_unique ON public.master_data_items(type_id, COALESCE(tenant_id,'00000000-0000-0000-0000-000000000000'::uuid), code);
CREATE INDEX idx_master_items_tenant ON public.master_data_items(tenant_id);

-- ---------- ACADEMIC STRUCTURE ----------
CREATE TABLE public.departments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  campus_id uuid REFERENCES public.campuses(id) ON DELETE SET NULL,
  code text NOT NULL,
  name text NOT NULL,
  short_name text,
  description text,
  hod_user_id uuid,
  email text,
  phone text,
  established_year int,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  created_by uuid, updated_by uuid, deleted_at timestamptz, deleted_by uuid,
  UNIQUE (tenant_id, code)
);
CREATE INDEX idx_departments_tenant ON public.departments(tenant_id);
CREATE INDEX idx_departments_campus ON public.departments(campus_id);

ALTER TABLE public.user_roles
  ADD CONSTRAINT user_roles_department_fk FOREIGN KEY (department_id) REFERENCES public.departments(id) ON DELETE CASCADE;

CREATE TABLE public.academic_years (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  name text NOT NULL,
  start_date date NOT NULL,
  end_date date NOT NULL,
  is_current boolean NOT NULL DEFAULT false,
  is_closed boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  created_by uuid, updated_by uuid, deleted_at timestamptz, deleted_by uuid,
  UNIQUE (tenant_id, name)
);
CREATE INDEX idx_academic_years_tenant ON public.academic_years(tenant_id);

CREATE TABLE public.academic_sessions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  academic_year_id uuid NOT NULL REFERENCES public.academic_years(id) ON DELETE CASCADE,
  name text NOT NULL,
  term_number int NOT NULL DEFAULT 1,
  start_date date NOT NULL,
  end_date date NOT NULL,
  is_current boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  created_by uuid, updated_by uuid, deleted_at timestamptz, deleted_by uuid,
  UNIQUE (academic_year_id, name)
);
CREATE INDEX idx_academic_sessions_tenant ON public.academic_sessions(tenant_id);

CREATE TABLE public.programs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  department_id uuid REFERENCES public.departments(id) ON DELETE SET NULL,
  campus_id uuid REFERENCES public.campuses(id) ON DELETE SET NULL,
  code text NOT NULL,
  name text NOT NULL,
  level public.program_level NOT NULL DEFAULT 'undergraduate',
  duration_years numeric(3,1) NOT NULL DEFAULT 4,
  total_semesters int NOT NULL DEFAULT 8,
  total_credits int,
  intake_capacity int,
  description text,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  created_by uuid, updated_by uuid, deleted_at timestamptz, deleted_by uuid,
  UNIQUE (tenant_id, code)
);
CREATE INDEX idx_programs_tenant ON public.programs(tenant_id);
CREATE INDEX idx_programs_department ON public.programs(department_id);

CREATE TABLE public.semesters (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  program_id uuid NOT NULL REFERENCES public.programs(id) ON DELETE CASCADE,
  number int NOT NULL,
  name text NOT NULL,
  credits int,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  created_by uuid, updated_by uuid, deleted_at timestamptz, deleted_by uuid,
  UNIQUE (program_id, number)
);
CREATE INDEX idx_semesters_tenant ON public.semesters(tenant_id);

CREATE TABLE public.courses (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  department_id uuid REFERENCES public.departments(id) ON DELETE SET NULL,
  program_id uuid REFERENCES public.programs(id) ON DELETE SET NULL,
  semester_id uuid REFERENCES public.semesters(id) ON DELETE SET NULL,
  code text NOT NULL,
  title text NOT NULL,
  type public.course_type NOT NULL DEFAULT 'core',
  credits numeric(4,1) NOT NULL DEFAULT 3,
  lecture_hours int NOT NULL DEFAULT 0,
  tutorial_hours int NOT NULL DEFAULT 0,
  practical_hours int NOT NULL DEFAULT 0,
  description text,
  syllabus_url text,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  created_by uuid, updated_by uuid, deleted_at timestamptz, deleted_by uuid,
  UNIQUE (tenant_id, code)
);
CREATE INDEX idx_courses_tenant ON public.courses(tenant_id);
CREATE INDEX idx_courses_program ON public.courses(program_id);
CREATE INDEX idx_courses_semester ON public.courses(semester_id);

-- ---------- PEOPLE ----------
CREATE TABLE public.faculty (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  campus_id uuid REFERENCES public.campuses(id) ON DELETE SET NULL,
  department_id uuid REFERENCES public.departments(id) ON DELETE SET NULL,
  user_id uuid,
  employee_code text NOT NULL,
  first_name text NOT NULL,
  last_name text,
  email text,
  phone text,
  gender public.gender,
  date_of_birth date,
  designation text,
  qualification text,
  specialization text,
  experience_years numeric(4,1),
  employment_type public.employment_type NOT NULL DEFAULT 'full_time',
  employment_status public.employment_status NOT NULL DEFAULT 'active',
  date_of_joining date,
  date_of_leaving date,
  photo_url text,
  address jsonb NOT NULL DEFAULT '{}'::jsonb,
  metadata jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  created_by uuid, updated_by uuid, deleted_at timestamptz, deleted_by uuid,
  UNIQUE (tenant_id, employee_code)
);
CREATE INDEX idx_faculty_tenant ON public.faculty(tenant_id);
CREATE INDEX idx_faculty_department ON public.faculty(department_id);
CREATE INDEX idx_faculty_user ON public.faculty(user_id);

CREATE TABLE public.staff (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  campus_id uuid REFERENCES public.campuses(id) ON DELETE SET NULL,
  department_id uuid REFERENCES public.departments(id) ON DELETE SET NULL,
  user_id uuid,
  employee_code text NOT NULL,
  first_name text NOT NULL,
  last_name text,
  email text,
  phone text,
  gender public.gender,
  date_of_birth date,
  designation text,
  employment_type public.employment_type NOT NULL DEFAULT 'full_time',
  employment_status public.employment_status NOT NULL DEFAULT 'active',
  date_of_joining date,
  date_of_leaving date,
  photo_url text,
  address jsonb NOT NULL DEFAULT '{}'::jsonb,
  metadata jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  created_by uuid, updated_by uuid, deleted_at timestamptz, deleted_by uuid,
  UNIQUE (tenant_id, employee_code)
);
CREATE INDEX idx_staff_tenant ON public.staff(tenant_id);

CREATE TABLE public.students (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  campus_id uuid REFERENCES public.campuses(id) ON DELETE SET NULL,
  department_id uuid REFERENCES public.departments(id) ON DELETE SET NULL,
  program_id uuid REFERENCES public.programs(id) ON DELETE SET NULL,
  current_semester_id uuid REFERENCES public.semesters(id) ON DELETE SET NULL,
  academic_year_id uuid REFERENCES public.academic_years(id) ON DELETE SET NULL,
  user_id uuid,
  admission_number text NOT NULL,
  roll_number text,
  registration_number text,
  abc_id text,
  first_name text NOT NULL,
  middle_name text,
  last_name text,
  email text,
  phone text,
  gender public.gender,
  date_of_birth date,
  blood_group_id uuid REFERENCES public.master_data_items(id) ON DELETE SET NULL,
  religion_id uuid REFERENCES public.master_data_items(id) ON DELETE SET NULL,
  caste_id uuid REFERENCES public.master_data_items(id) ON DELETE SET NULL,
  category_id uuid REFERENCES public.master_data_items(id) ON DELETE SET NULL,
  nationality_id uuid REFERENCES public.master_data_items(id) ON DELETE SET NULL,
  status public.student_status NOT NULL DEFAULT 'enrolled',
  admission_date date,
  graduation_date date,
  photo_url text,
  father_name text,
  mother_name text,
  guardian_name text,
  guardian_phone text,
  guardian_email text,
  emergency_contact text,
  address jsonb NOT NULL DEFAULT '{}'::jsonb,
  metadata jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  created_by uuid, updated_by uuid, deleted_at timestamptz, deleted_by uuid,
  UNIQUE (tenant_id, admission_number)
);
CREATE INDEX idx_students_tenant ON public.students(tenant_id);
CREATE INDEX idx_students_program ON public.students(program_id);
CREATE INDEX idx_students_department ON public.students(department_id);
CREATE INDEX idx_students_user ON public.students(user_id);
CREATE INDEX idx_students_status ON public.students(status);
CREATE INDEX idx_students_name_trgm ON public.students USING gin ((first_name || ' ' || COALESCE(last_name,'')) gin_trgm_ops);

CREATE TABLE public.student_guardians (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  student_id uuid NOT NULL REFERENCES public.students(id) ON DELETE CASCADE,
  user_id uuid,
  full_name text NOT NULL,
  relation text NOT NULL,
  email text,
  phone text,
  occupation text,
  annual_income numeric(14,2),
  is_primary boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  created_by uuid, updated_by uuid, deleted_at timestamptz, deleted_by uuid
);
CREATE INDEX idx_student_guardians_student ON public.student_guardians(student_id);
CREATE INDEX idx_student_guardians_tenant ON public.student_guardians(tenant_id);

CREATE TABLE public.enrollments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  student_id uuid NOT NULL REFERENCES public.students(id) ON DELETE CASCADE,
  course_id uuid NOT NULL REFERENCES public.courses(id) ON DELETE CASCADE,
  semester_id uuid REFERENCES public.semesters(id) ON DELETE SET NULL,
  academic_session_id uuid REFERENCES public.academic_sessions(id) ON DELETE SET NULL,
  faculty_id uuid REFERENCES public.faculty(id) ON DELETE SET NULL,
  status public.enrollment_status NOT NULL DEFAULT 'registered',
  grade text,
  grade_points numeric(4,2),
  enrolled_at timestamptz NOT NULL DEFAULT now(),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  created_by uuid, updated_by uuid, deleted_at timestamptz, deleted_by uuid,
  UNIQUE (student_id, course_id, academic_session_id)
);
CREATE INDEX idx_enrollments_tenant ON public.enrollments(tenant_id);
CREATE INDEX idx_enrollments_student ON public.enrollments(student_id);
CREATE INDEX idx_enrollments_course ON public.enrollments(course_id);

-- ---------- SETTINGS ENGINE ----------
CREATE TABLE public.settings_definitions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  key text NOT NULL UNIQUE,
  scope public.setting_scope NOT NULL DEFAULT 'general',
  label text NOT NULL,
  description text,
  data_type text NOT NULL DEFAULT 'string',
  default_value jsonb,
  options jsonb,
  is_secret boolean NOT NULL DEFAULT false,
  sort_order int NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE public.tenant_settings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  campus_id uuid REFERENCES public.campuses(id) ON DELETE CASCADE,
  key text NOT NULL,
  scope public.setting_scope NOT NULL DEFAULT 'general',
  value jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  created_by uuid, updated_by uuid
);
CREATE UNIQUE INDEX idx_tenant_settings_unique ON public.tenant_settings(tenant_id, COALESCE(campus_id,'00000000-0000-0000-0000-000000000000'::uuid), key);

-- ---------- CUSTOM FIELDS ----------
CREATE TABLE public.custom_field_definitions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  entity_type text NOT NULL,
  key text NOT NULL,
  label text NOT NULL,
  field_type public.custom_field_type NOT NULL DEFAULT 'text',
  help_text text,
  placeholder text,
  options jsonb NOT NULL DEFAULT '[]'::jsonb,
  validation jsonb NOT NULL DEFAULT '{}'::jsonb,
  default_value jsonb,
  is_required boolean NOT NULL DEFAULT false,
  is_searchable boolean NOT NULL DEFAULT false,
  is_active boolean NOT NULL DEFAULT true,
  section text,
  sort_order int NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  created_by uuid, updated_by uuid, deleted_at timestamptz, deleted_by uuid,
  UNIQUE (tenant_id, entity_type, key)
);
CREATE INDEX idx_cfd_tenant_entity ON public.custom_field_definitions(tenant_id, entity_type);

CREATE TABLE public.custom_field_values (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  definition_id uuid NOT NULL REFERENCES public.custom_field_definitions(id) ON DELETE CASCADE,
  entity_type text NOT NULL,
  entity_id uuid NOT NULL,
  value jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  created_by uuid, updated_by uuid,
  UNIQUE (definition_id, entity_id)
);
CREATE INDEX idx_cfv_entity ON public.custom_field_values(entity_type, entity_id);
CREATE INDEX idx_cfv_tenant ON public.custom_field_values(tenant_id);

-- ---------- TRIGGERS ----------
CREATE TRIGGER trg_master_items_updated BEFORE UPDATE ON public.master_data_items FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
CREATE TRIGGER trg_departments_updated BEFORE UPDATE ON public.departments FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
CREATE TRIGGER trg_academic_years_updated BEFORE UPDATE ON public.academic_years FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
CREATE TRIGGER trg_academic_sessions_updated BEFORE UPDATE ON public.academic_sessions FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
CREATE TRIGGER trg_programs_updated BEFORE UPDATE ON public.programs FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
CREATE TRIGGER trg_semesters_updated BEFORE UPDATE ON public.semesters FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
CREATE TRIGGER trg_courses_updated BEFORE UPDATE ON public.courses FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
CREATE TRIGGER trg_faculty_updated BEFORE UPDATE ON public.faculty FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
CREATE TRIGGER trg_staff_updated BEFORE UPDATE ON public.staff FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
CREATE TRIGGER trg_students_updated BEFORE UPDATE ON public.students FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
CREATE TRIGGER trg_student_guardians_updated BEFORE UPDATE ON public.student_guardians FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
CREATE TRIGGER trg_enrollments_updated BEFORE UPDATE ON public.enrollments FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
CREATE TRIGGER trg_tenant_settings_updated BEFORE UPDATE ON public.tenant_settings FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
CREATE TRIGGER trg_cfd_updated BEFORE UPDATE ON public.custom_field_definitions FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
CREATE TRIGGER trg_cfv_updated BEFORE UPDATE ON public.custom_field_values FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE TRIGGER trg_departments_audit AFTER INSERT OR UPDATE OR DELETE ON public.departments FOR EACH ROW EXECUTE FUNCTION public.audit_row_change();
CREATE TRIGGER trg_programs_audit AFTER INSERT OR UPDATE OR DELETE ON public.programs FOR EACH ROW EXECUTE FUNCTION public.audit_row_change();
CREATE TRIGGER trg_courses_audit AFTER INSERT OR UPDATE OR DELETE ON public.courses FOR EACH ROW EXECUTE FUNCTION public.audit_row_change();
CREATE TRIGGER trg_students_audit AFTER INSERT OR UPDATE OR DELETE ON public.students FOR EACH ROW EXECUTE FUNCTION public.audit_row_change();
CREATE TRIGGER trg_faculty_audit AFTER INSERT OR UPDATE OR DELETE ON public.faculty FOR EACH ROW EXECUTE FUNCTION public.audit_row_change();
CREATE TRIGGER trg_staff_audit AFTER INSERT OR UPDATE OR DELETE ON public.staff FOR EACH ROW EXECUTE FUNCTION public.audit_row_change();
CREATE TRIGGER trg_enrollments_audit AFTER INSERT OR UPDATE OR DELETE ON public.enrollments FOR EACH ROW EXECUTE FUNCTION public.audit_row_change();

CREATE TRIGGER trg_students_version AFTER INSERT OR UPDATE ON public.students FOR EACH ROW EXECUTE FUNCTION public.version_row_change();
CREATE TRIGGER trg_faculty_version AFTER INSERT OR UPDATE ON public.faculty FOR EACH ROW EXECUTE FUNCTION public.version_row_change();
CREATE TRIGGER trg_courses_version AFTER INSERT OR UPDATE ON public.courses FOR EACH ROW EXECUTE FUNCTION public.version_row_change();

-- ---------- GRANTS ----------
GRANT SELECT, INSERT, UPDATE, DELETE ON
  public.countries, public.states, public.cities, public.master_data_types, public.master_data_items,
  public.departments, public.academic_years, public.academic_sessions, public.programs, public.semesters,
  public.courses, public.faculty, public.staff, public.students, public.student_guardians, public.enrollments,
  public.settings_definitions, public.tenant_settings, public.custom_field_definitions, public.custom_field_values
  TO authenticated;
GRANT ALL ON
  public.countries, public.states, public.cities, public.master_data_types, public.master_data_items,
  public.departments, public.academic_years, public.academic_sessions, public.programs, public.semesters,
  public.courses, public.faculty, public.staff, public.students, public.student_guardians, public.enrollments,
  public.settings_definitions, public.tenant_settings, public.custom_field_definitions, public.custom_field_values
  TO service_role;

-- ---------- RLS ----------
ALTER TABLE public.countries ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.states ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.cities ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.master_data_types ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.master_data_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.departments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.academic_years ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.academic_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.programs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.semesters ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.courses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.faculty ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.staff ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.students ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.student_guardians ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.enrollments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.settings_definitions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tenant_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.custom_field_definitions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.custom_field_values ENABLE ROW LEVEL SECURITY;

CREATE POLICY countries_select ON public.countries FOR SELECT TO authenticated USING (true);
CREATE POLICY countries_write ON public.countries FOR ALL TO authenticated USING (public.is_platform_admin()) WITH CHECK (public.is_platform_admin());
CREATE POLICY states_select ON public.states FOR SELECT TO authenticated USING (true);
CREATE POLICY states_write ON public.states FOR ALL TO authenticated USING (public.is_platform_admin()) WITH CHECK (public.is_platform_admin());
CREATE POLICY cities_select ON public.cities FOR SELECT TO authenticated USING (true);
CREATE POLICY cities_write ON public.cities FOR ALL TO authenticated USING (public.is_platform_admin()) WITH CHECK (public.is_platform_admin());
CREATE POLICY mdt_select ON public.master_data_types FOR SELECT TO authenticated USING (true);
CREATE POLICY mdt_write ON public.master_data_types FOR ALL TO authenticated USING (public.is_platform_admin()) WITH CHECK (public.is_platform_admin());

CREATE POLICY mdi_select ON public.master_data_items FOR SELECT TO authenticated
  USING (tenant_id IS NULL OR public.is_tenant_member(tenant_id));
CREATE POLICY mdi_write ON public.master_data_items FOR ALL TO authenticated
  USING (public.has_permission('master_data.manage', tenant_id))
  WITH CHECK (public.has_permission('master_data.manage', tenant_id));

CREATE POLICY departments_select ON public.departments FOR SELECT TO authenticated USING (public.is_tenant_member(tenant_id));
CREATE POLICY departments_write ON public.departments FOR ALL TO authenticated
  USING (public.has_permission('department.manage', tenant_id)) WITH CHECK (public.has_permission('department.manage', tenant_id));

CREATE POLICY academic_years_select ON public.academic_years FOR SELECT TO authenticated USING (public.is_tenant_member(tenant_id));
CREATE POLICY academic_years_write ON public.academic_years FOR ALL TO authenticated
  USING (public.has_permission('academic.manage', tenant_id)) WITH CHECK (public.has_permission('academic.manage', tenant_id));

CREATE POLICY academic_sessions_select ON public.academic_sessions FOR SELECT TO authenticated USING (public.is_tenant_member(tenant_id));
CREATE POLICY academic_sessions_write ON public.academic_sessions FOR ALL TO authenticated
  USING (public.has_permission('academic.manage', tenant_id)) WITH CHECK (public.has_permission('academic.manage', tenant_id));

CREATE POLICY programs_select ON public.programs FOR SELECT TO authenticated USING (public.is_tenant_member(tenant_id));
CREATE POLICY programs_write ON public.programs FOR ALL TO authenticated
  USING (public.has_permission('program.manage', tenant_id)) WITH CHECK (public.has_permission('program.manage', tenant_id));

CREATE POLICY semesters_select ON public.semesters FOR SELECT TO authenticated USING (public.is_tenant_member(tenant_id));
CREATE POLICY semesters_write ON public.semesters FOR ALL TO authenticated
  USING (public.has_permission('program.manage', tenant_id)) WITH CHECK (public.has_permission('program.manage', tenant_id));

CREATE POLICY courses_select ON public.courses FOR SELECT TO authenticated USING (public.is_tenant_member(tenant_id));
CREATE POLICY courses_write ON public.courses FOR ALL TO authenticated
  USING (public.has_permission('course.manage', tenant_id)) WITH CHECK (public.has_permission('course.manage', tenant_id));

CREATE POLICY faculty_select ON public.faculty FOR SELECT TO authenticated
  USING (user_id = auth.uid() OR public.has_permission('faculty.view', tenant_id) OR public.is_tenant_member(tenant_id));
CREATE POLICY faculty_write ON public.faculty FOR ALL TO authenticated
  USING (public.has_permission('faculty.manage', tenant_id)) WITH CHECK (public.has_permission('faculty.manage', tenant_id));

CREATE POLICY staff_select ON public.staff FOR SELECT TO authenticated
  USING (user_id = auth.uid() OR public.has_permission('staff.view', tenant_id));
CREATE POLICY staff_write ON public.staff FOR ALL TO authenticated
  USING (public.has_permission('staff.manage', tenant_id)) WITH CHECK (public.has_permission('staff.manage', tenant_id));

CREATE POLICY students_select ON public.students FOR SELECT TO authenticated
  USING (
    user_id = auth.uid()
    OR public.has_permission('student.view', tenant_id)
    OR EXISTS (SELECT 1 FROM public.student_guardians g WHERE g.student_id = students.id AND g.user_id = auth.uid())
  );
CREATE POLICY students_write ON public.students FOR ALL TO authenticated
  USING (public.has_permission('student.manage', tenant_id)) WITH CHECK (public.has_permission('student.manage', tenant_id));

CREATE POLICY guardians_select ON public.student_guardians FOR SELECT TO authenticated
  USING (user_id = auth.uid() OR public.has_permission('student.view', tenant_id)
    OR EXISTS (SELECT 1 FROM public.students s WHERE s.id = student_id AND s.user_id = auth.uid()));
CREATE POLICY guardians_write ON public.student_guardians FOR ALL TO authenticated
  USING (public.has_permission('student.manage', tenant_id)) WITH CHECK (public.has_permission('student.manage', tenant_id));

CREATE POLICY enrollments_select ON public.enrollments FOR SELECT TO authenticated
  USING (
    public.has_permission('enrollment.view', tenant_id)
    OR EXISTS (SELECT 1 FROM public.students s WHERE s.id = student_id AND s.user_id = auth.uid())
    OR EXISTS (SELECT 1 FROM public.faculty f WHERE f.id = faculty_id AND f.user_id = auth.uid())
  );
CREATE POLICY enrollments_write ON public.enrollments FOR ALL TO authenticated
  USING (public.has_permission('enrollment.manage', tenant_id)) WITH CHECK (public.has_permission('enrollment.manage', tenant_id));

CREATE POLICY settings_defs_select ON public.settings_definitions FOR SELECT TO authenticated USING (true);
CREATE POLICY settings_defs_write ON public.settings_definitions FOR ALL TO authenticated
  USING (public.is_platform_admin()) WITH CHECK (public.is_platform_admin());

CREATE POLICY tenant_settings_select ON public.tenant_settings FOR SELECT TO authenticated USING (public.is_tenant_member(tenant_id));
CREATE POLICY tenant_settings_write ON public.tenant_settings FOR ALL TO authenticated
  USING (public.has_permission('settings.manage', tenant_id)) WITH CHECK (public.has_permission('settings.manage', tenant_id));

CREATE POLICY cfd_select ON public.custom_field_definitions FOR SELECT TO authenticated USING (public.is_tenant_member(tenant_id));
CREATE POLICY cfd_write ON public.custom_field_definitions FOR ALL TO authenticated
  USING (public.has_permission('settings.manage', tenant_id)) WITH CHECK (public.has_permission('settings.manage', tenant_id));

CREATE POLICY cfv_select ON public.custom_field_values FOR SELECT TO authenticated USING (public.is_tenant_member(tenant_id));
CREATE POLICY cfv_write ON public.custom_field_values FOR ALL TO authenticated
  USING (public.is_tenant_member(tenant_id)) WITH CHECK (public.is_tenant_member(tenant_id));
