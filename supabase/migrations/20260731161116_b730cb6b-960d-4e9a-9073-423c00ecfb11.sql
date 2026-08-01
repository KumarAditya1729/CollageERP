-- ============ ENUMS ============
CREATE TYPE public.assessment_category AS ENUM ('internal','mid_semester','end_semester','quiz','assignment','project','practical','lab','seminar','presentation','viva','continuous','custom');
CREATE TYPE public.exam_status AS ENUM ('planned','scheduled','registration_open','in_progress','evaluation','completed','published','cancelled');
CREATE TYPE public.exam_registration_status AS ENUM ('pending','eligible','ineligible','registered','withheld','cancelled');
CREATE TYPE public.question_difficulty AS ENUM ('easy','moderate','difficult');
CREATE TYPE public.bloom_level AS ENUM ('remember','understand','apply','analyze','evaluate','create');
CREATE TYPE public.question_paper_status AS ENUM ('draft','pending_approval','approved','rejected','locked','released');
CREATE TYPE public.mark_status AS ENUM ('draft','submitted','under_moderation','approved','published','rejected');
CREATE TYPE public.evaluation_kind AS ENUM ('first','second','third','moderation','revaluation','challenge');
CREATE TYPE public.revaluation_kind AS ENUM ('revaluation','challenge','retotal','photocopy');
CREATE TYPE public.result_status AS ENUM ('draft','provisional','pending_approval','approved','published','withheld');
CREATE TYPE public.exam_duty_role AS ENUM ('invigilator','observer','squad','coordinator','relief');
CREATE TYPE public.certificate_kind AS ENUM ('marksheet','grade_card','transcript','provisional','migration','bonafide');

-- ============ FRAMEWORK ============
CREATE TABLE public.assessment_types (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  key text NOT NULL,
  name text NOT NULL,
  category public.assessment_category NOT NULL DEFAULT 'internal',
  description text,
  default_max_marks numeric(6,2) NOT NULL DEFAULT 100,
  default_weightage numeric(5,2) NOT NULL DEFAULT 100,
  passing_percentage numeric(5,2) NOT NULL DEFAULT 40,
  is_internal boolean NOT NULL DEFAULT true,
  is_credit_linked boolean NOT NULL DEFAULT true,
  requires_approval boolean NOT NULL DEFAULT false,
  allows_grace boolean NOT NULL DEFAULT false,
  is_active boolean NOT NULL DEFAULT true,
  sort_order integer NOT NULL DEFAULT 0,
  metadata jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  created_by uuid, updated_by uuid, deleted_at timestamptz, deleted_by uuid,
  UNIQUE (tenant_id, key)
);

CREATE TABLE public.grading_scales (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  program_id uuid REFERENCES public.programs(id) ON DELETE CASCADE,
  name text NOT NULL,
  code text NOT NULL,
  description text,
  max_grade_point numeric(4,2) NOT NULL DEFAULT 10,
  passing_grade_point numeric(4,2) NOT NULL DEFAULT 4,
  is_default boolean NOT NULL DEFAULT false,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  created_by uuid, updated_by uuid, deleted_at timestamptz, deleted_by uuid,
  UNIQUE (tenant_id, code)
);

CREATE TABLE public.grade_bands (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  grading_scale_id uuid NOT NULL REFERENCES public.grading_scales(id) ON DELETE CASCADE,
  grade text NOT NULL,
  min_percentage numeric(5,2) NOT NULL,
  max_percentage numeric(5,2) NOT NULL,
  grade_point numeric(4,2) NOT NULL,
  is_pass boolean NOT NULL DEFAULT true,
  remark text,
  sort_order integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  created_by uuid, updated_by uuid, deleted_at timestamptz, deleted_by uuid,
  UNIQUE (grading_scale_id, grade)
);

CREATE TABLE public.assessments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  campus_id uuid REFERENCES public.campuses(id) ON DELETE SET NULL,
  academic_session_id uuid REFERENCES public.academic_sessions(id) ON DELETE SET NULL,
  semester_id uuid REFERENCES public.semesters(id) ON DELETE SET NULL,
  course_id uuid REFERENCES public.courses(id) ON DELETE CASCADE,
  section_id uuid REFERENCES public.sections(id) ON DELETE SET NULL,
  assessment_type_id uuid REFERENCES public.assessment_types(id) ON DELETE SET NULL,
  faculty_id uuid REFERENCES public.faculty(id) ON DELETE SET NULL,
  rubric_id uuid,
  title text NOT NULL,
  description text,
  max_marks numeric(6,2) NOT NULL DEFAULT 100,
  weightage numeric(5,2) NOT NULL DEFAULT 100,
  passing_marks numeric(6,2),
  scheduled_on date,
  due_on date,
  status public.mark_status NOT NULL DEFAULT 'draft',
  is_published boolean NOT NULL DEFAULT false,
  metadata jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  created_by uuid, updated_by uuid, deleted_at timestamptz, deleted_by uuid
);

CREATE TABLE public.rubrics (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  course_id uuid REFERENCES public.courses(id) ON DELETE CASCADE,
  name text NOT NULL,
  description text,
  total_points numeric(6,2) NOT NULL DEFAULT 100,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  created_by uuid, updated_by uuid, deleted_at timestamptz, deleted_by uuid
);

CREATE TABLE public.rubric_criteria (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  rubric_id uuid NOT NULL REFERENCES public.rubrics(id) ON DELETE CASCADE,
  course_outcome_id uuid REFERENCES public.course_outcomes(id) ON DELETE SET NULL,
  title text NOT NULL,
  description text,
  max_points numeric(6,2) NOT NULL DEFAULT 10,
  levels jsonb NOT NULL DEFAULT '[]'::jsonb,
  sort_order integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  created_by uuid, updated_by uuid, deleted_at timestamptz, deleted_by uuid
);

ALTER TABLE public.assessments ADD CONSTRAINT assessments_rubric_id_fkey FOREIGN KEY (rubric_id) REFERENCES public.rubrics(id) ON DELETE SET NULL;

-- ============ PLANNING ============
CREATE TABLE public.exam_sessions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  campus_id uuid REFERENCES public.campuses(id) ON DELETE SET NULL,
  academic_session_id uuid REFERENCES public.academic_sessions(id) ON DELETE SET NULL,
  semester_id uuid REFERENCES public.semesters(id) ON DELETE SET NULL,
  name text NOT NULL,
  code text NOT NULL,
  category public.assessment_category NOT NULL DEFAULT 'end_semester',
  starts_on date NOT NULL,
  ends_on date NOT NULL,
  registration_opens_on date,
  registration_closes_on date,
  hall_ticket_release_on date,
  result_expected_on date,
  status public.exam_status NOT NULL DEFAULT 'planned',
  instructions text,
  metadata jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  created_by uuid, updated_by uuid, deleted_at timestamptz, deleted_by uuid,
  UNIQUE (tenant_id, code)
);

CREATE TABLE public.exams (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  campus_id uuid REFERENCES public.campuses(id) ON DELETE SET NULL,
  exam_session_id uuid NOT NULL REFERENCES public.exam_sessions(id) ON DELETE CASCADE,
  course_id uuid REFERENCES public.courses(id) ON DELETE CASCADE,
  program_id uuid REFERENCES public.programs(id) ON DELETE SET NULL,
  semester_id uuid REFERENCES public.semesters(id) ON DELETE SET NULL,
  section_id uuid REFERENCES public.sections(id) ON DELETE SET NULL,
  assessment_type_id uuid REFERENCES public.assessment_types(id) ON DELETE SET NULL,
  grading_scale_id uuid REFERENCES public.grading_scales(id) ON DELETE SET NULL,
  title text NOT NULL,
  exam_date date,
  starts_at time,
  ends_at time,
  duration_minutes integer,
  max_marks numeric(6,2) NOT NULL DEFAULT 100,
  passing_marks numeric(6,2) NOT NULL DEFAULT 40,
  internal_weightage numeric(5,2) NOT NULL DEFAULT 40,
  external_weightage numeric(5,2) NOT NULL DEFAULT 60,
  min_attendance_percentage numeric(5,2),
  status public.exam_status NOT NULL DEFAULT 'planned',
  instructions text,
  metadata jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  created_by uuid, updated_by uuid, deleted_at timestamptz, deleted_by uuid
);
CREATE INDEX idx_exams_session ON public.exams(exam_session_id);
CREATE INDEX idx_exams_course ON public.exams(course_id);

CREATE TABLE public.exam_registrations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  exam_id uuid NOT NULL REFERENCES public.exams(id) ON DELETE CASCADE,
  student_id uuid NOT NULL REFERENCES public.students(id) ON DELETE CASCADE,
  enrollment_id uuid REFERENCES public.enrollments(id) ON DELETE SET NULL,
  status public.exam_registration_status NOT NULL DEFAULT 'pending',
  attempt_number integer NOT NULL DEFAULT 1,
  is_backlog boolean NOT NULL DEFAULT false,
  attendance_percentage numeric(5,2),
  eligibility_reason text,
  registered_at timestamptz,
  metadata jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  created_by uuid, updated_by uuid, deleted_at timestamptz, deleted_by uuid,
  UNIQUE (exam_id, student_id, attempt_number)
);
CREATE INDEX idx_exam_reg_student ON public.exam_registrations(student_id);

CREATE TABLE public.exam_rooms (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  exam_id uuid NOT NULL REFERENCES public.exams(id) ON DELETE CASCADE,
  room_id uuid REFERENCES public.rooms(id) ON DELETE SET NULL,
  building_id uuid REFERENCES public.buildings(id) ON DELETE SET NULL,
  seat_capacity integer NOT NULL DEFAULT 30,
  seats_allocated integer NOT NULL DEFAULT 0,
  seat_prefix text,
  notes text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  created_by uuid, updated_by uuid, deleted_at timestamptz, deleted_by uuid,
  UNIQUE (exam_id, room_id)
);

CREATE TABLE public.exam_seats (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  exam_room_id uuid NOT NULL REFERENCES public.exam_rooms(id) ON DELETE CASCADE,
  exam_id uuid NOT NULL REFERENCES public.exams(id) ON DELETE CASCADE,
  student_id uuid NOT NULL REFERENCES public.students(id) ON DELETE CASCADE,
  seat_number text NOT NULL,
  row_label text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  created_by uuid, updated_by uuid, deleted_at timestamptz, deleted_by uuid,
  UNIQUE (exam_id, student_id)
);

CREATE TABLE public.exam_invigilators (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  exam_id uuid NOT NULL REFERENCES public.exams(id) ON DELETE CASCADE,
  exam_room_id uuid REFERENCES public.exam_rooms(id) ON DELETE CASCADE,
  faculty_id uuid REFERENCES public.faculty(id) ON DELETE CASCADE,
  staff_id uuid REFERENCES public.staff(id) ON DELETE CASCADE,
  duty_role public.exam_duty_role NOT NULL DEFAULT 'invigilator',
  reported_at timestamptz,
  notes text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  created_by uuid, updated_by uuid, deleted_at timestamptz, deleted_by uuid
);

-- ============ QUESTION PAPERS ============
CREATE TABLE public.questions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  course_id uuid REFERENCES public.courses(id) ON DELETE CASCADE,
  course_outcome_id uuid REFERENCES public.course_outcomes(id) ON DELETE SET NULL,
  program_outcome_id uuid REFERENCES public.program_outcomes(id) ON DELETE SET NULL,
  unit text,
  topic text,
  body text NOT NULL,
  answer_key text,
  options jsonb NOT NULL DEFAULT '[]'::jsonb,
  marks numeric(5,2) NOT NULL DEFAULT 1,
  difficulty public.question_difficulty NOT NULL DEFAULT 'moderate',
  bloom public.bloom_level NOT NULL DEFAULT 'understand',
  question_type text NOT NULL DEFAULT 'descriptive',
  usage_count integer NOT NULL DEFAULT 0,
  is_active boolean NOT NULL DEFAULT true,
  metadata jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  created_by uuid, updated_by uuid, deleted_at timestamptz, deleted_by uuid
);
CREATE INDEX idx_questions_course ON public.questions(course_id);

CREATE TABLE public.question_papers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  exam_id uuid REFERENCES public.exams(id) ON DELETE CASCADE,
  course_id uuid REFERENCES public.courses(id) ON DELETE CASCADE,
  title text NOT NULL,
  code text,
  version integer NOT NULL DEFAULT 1,
  set_label text NOT NULL DEFAULT 'A',
  status public.question_paper_status NOT NULL DEFAULT 'draft',
  total_marks numeric(6,2) NOT NULL DEFAULT 100,
  duration_minutes integer NOT NULL DEFAULT 180,
  blueprint jsonb NOT NULL DEFAULT '{}'::jsonb,
  instructions text,
  is_encrypted boolean NOT NULL DEFAULT false,
  setter_id uuid REFERENCES public.faculty(id) ON DELETE SET NULL,
  approver_id uuid,
  approved_at timestamptz,
  rejection_reason text,
  metadata jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  created_by uuid, updated_by uuid, deleted_at timestamptz, deleted_by uuid
);

CREATE TABLE public.question_paper_questions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  question_paper_id uuid NOT NULL REFERENCES public.question_papers(id) ON DELETE CASCADE,
  question_id uuid NOT NULL REFERENCES public.questions(id) ON DELETE CASCADE,
  section_label text NOT NULL DEFAULT 'A',
  question_number text,
  marks numeric(5,2) NOT NULL DEFAULT 1,
  is_optional boolean NOT NULL DEFAULT false,
  sort_order integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  created_by uuid, updated_by uuid, deleted_at timestamptz, deleted_by uuid,
  UNIQUE (question_paper_id, question_id)
);

-- ============ MARKS & EVALUATION ============
CREATE TABLE public.marks (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  exam_id uuid REFERENCES public.exams(id) ON DELETE CASCADE,
  assessment_id uuid REFERENCES public.assessments(id) ON DELETE CASCADE,
  student_id uuid NOT NULL REFERENCES public.students(id) ON DELETE CASCADE,
  course_id uuid REFERENCES public.courses(id) ON DELETE SET NULL,
  component text NOT NULL DEFAULT 'external',
  max_marks numeric(6,2) NOT NULL DEFAULT 100,
  marks_obtained numeric(6,2),
  grace_marks numeric(5,2) NOT NULL DEFAULT 0,
  moderation_delta numeric(5,2) NOT NULL DEFAULT 0,
  final_marks numeric(6,2) GENERATED ALWAYS AS (COALESCE(marks_obtained,0) + grace_marks + moderation_delta) STORED,
  is_absent boolean NOT NULL DEFAULT false,
  is_malpractice boolean NOT NULL DEFAULT false,
  status public.mark_status NOT NULL DEFAULT 'draft',
  rubric_scores jsonb NOT NULL DEFAULT '{}'::jsonb,
  remarks text,
  entered_by uuid,
  approved_by uuid,
  approved_at timestamptz,
  published_at timestamptz,
  metadata jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  created_by uuid, updated_by uuid, deleted_at timestamptz, deleted_by uuid
);
CREATE UNIQUE INDEX idx_marks_exam_student ON public.marks(exam_id, student_id, component) WHERE exam_id IS NOT NULL;
CREATE UNIQUE INDEX idx_marks_assessment_student ON public.marks(assessment_id, student_id) WHERE assessment_id IS NOT NULL;
CREATE INDEX idx_marks_student ON public.marks(student_id);

CREATE TABLE public.mark_evaluations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  mark_id uuid NOT NULL REFERENCES public.marks(id) ON DELETE CASCADE,
  evaluator_id uuid REFERENCES public.faculty(id) ON DELETE SET NULL,
  kind public.evaluation_kind NOT NULL DEFAULT 'first',
  round integer NOT NULL DEFAULT 1,
  marks_awarded numeric(6,2),
  is_blind boolean NOT NULL DEFAULT false,
  remarks text,
  evaluated_at timestamptz NOT NULL DEFAULT now(),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  created_by uuid, updated_by uuid, deleted_at timestamptz, deleted_by uuid,
  UNIQUE (mark_id, kind, round)
);

CREATE TABLE public.revaluation_requests (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  exam_id uuid NOT NULL REFERENCES public.exams(id) ON DELETE CASCADE,
  student_id uuid NOT NULL REFERENCES public.students(id) ON DELETE CASCADE,
  mark_id uuid REFERENCES public.marks(id) ON DELETE SET NULL,
  kind public.revaluation_kind NOT NULL DEFAULT 'revaluation',
  reason text NOT NULL,
  status public.approval_state NOT NULL DEFAULT 'pending',
  fee_amount numeric(10,2) NOT NULL DEFAULT 0,
  original_marks numeric(6,2),
  revised_marks numeric(6,2),
  reviewer_id uuid,
  reviewed_at timestamptz,
  review_notes text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  created_by uuid, updated_by uuid, deleted_at timestamptz, deleted_by uuid
);

-- ============ RESULTS ============
CREATE TABLE public.results (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  exam_session_id uuid REFERENCES public.exam_sessions(id) ON DELETE CASCADE,
  student_id uuid NOT NULL REFERENCES public.students(id) ON DELETE CASCADE,
  program_id uuid REFERENCES public.programs(id) ON DELETE SET NULL,
  semester_id uuid REFERENCES public.semesters(id) ON DELETE SET NULL,
  grading_scale_id uuid REFERENCES public.grading_scales(id) ON DELETE SET NULL,
  credits_registered numeric(6,2) NOT NULL DEFAULT 0,
  credits_earned numeric(6,2) NOT NULL DEFAULT 0,
  total_marks numeric(8,2) NOT NULL DEFAULT 0,
  max_marks numeric(8,2) NOT NULL DEFAULT 0,
  percentage numeric(5,2),
  sgpa numeric(4,2),
  cgpa numeric(4,2),
  backlog_count integer NOT NULL DEFAULT 0,
  rank integer,
  class_awarded text,
  is_pass boolean NOT NULL DEFAULT false,
  status public.result_status NOT NULL DEFAULT 'draft',
  published_at timestamptz,
  approved_by uuid,
  approved_at timestamptz,
  remarks text,
  metadata jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  created_by uuid, updated_by uuid, deleted_at timestamptz, deleted_by uuid,
  UNIQUE (exam_session_id, student_id)
);
CREATE INDEX idx_results_student ON public.results(student_id);

CREATE TABLE public.result_courses (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  result_id uuid NOT NULL REFERENCES public.results(id) ON DELETE CASCADE,
  course_id uuid REFERENCES public.courses(id) ON DELETE SET NULL,
  exam_id uuid REFERENCES public.exams(id) ON DELETE SET NULL,
  credits numeric(4,2) NOT NULL DEFAULT 0,
  internal_marks numeric(6,2) NOT NULL DEFAULT 0,
  external_marks numeric(6,2) NOT NULL DEFAULT 0,
  total_marks numeric(6,2) NOT NULL DEFAULT 0,
  max_marks numeric(6,2) NOT NULL DEFAULT 100,
  grade text,
  grade_point numeric(4,2),
  is_pass boolean NOT NULL DEFAULT false,
  attempt_number integer NOT NULL DEFAULT 1,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  created_by uuid, updated_by uuid, deleted_at timestamptz, deleted_by uuid,
  UNIQUE (result_id, course_id)
);

-- ============ HALL TICKETS & CERTIFICATES ============
CREATE TABLE public.hall_tickets (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  exam_session_id uuid NOT NULL REFERENCES public.exam_sessions(id) ON DELETE CASCADE,
  student_id uuid NOT NULL REFERENCES public.students(id) ON DELETE CASCADE,
  ticket_number text NOT NULL,
  verification_code text NOT NULL,
  issued_at timestamptz NOT NULL DEFAULT now(),
  valid_until date,
  is_revoked boolean NOT NULL DEFAULT false,
  revoked_reason text,
  payload jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  created_by uuid, updated_by uuid, deleted_at timestamptz, deleted_by uuid,
  UNIQUE (tenant_id, ticket_number),
  UNIQUE (exam_session_id, student_id)
);

CREATE TABLE public.certificates (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  student_id uuid NOT NULL REFERENCES public.students(id) ON DELETE CASCADE,
  result_id uuid REFERENCES public.results(id) ON DELETE SET NULL,
  exam_session_id uuid REFERENCES public.exam_sessions(id) ON DELETE SET NULL,
  kind public.certificate_kind NOT NULL DEFAULT 'grade_card',
  certificate_number text NOT NULL,
  verification_code text NOT NULL,
  issued_on date NOT NULL DEFAULT CURRENT_DATE,
  signed_by uuid,
  signature_ref text,
  is_revoked boolean NOT NULL DEFAULT false,
  payload jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  created_by uuid, updated_by uuid, deleted_at timestamptz, deleted_by uuid,
  UNIQUE (tenant_id, certificate_number)
);

-- ============ GRANTS, RLS, POLICIES, TRIGGERS ============
DO $$
DECLARE
  t text;
  own_tables text[] := ARRAY['marks','results','result_courses','hall_tickets','certificates','revaluation_requests','exam_registrations','exam_seats'];
  write_perm text;
  tbls text[] := ARRAY['assessment_types','grading_scales','grade_bands','assessments','rubrics','rubric_criteria','exam_sessions','exams','exam_registrations','exam_rooms','exam_seats','exam_invigilators','questions','question_papers','question_paper_questions','marks','mark_evaluations','revaluation_requests','results','result_courses','hall_tickets','certificates'];
  student_link text;
BEGIN
  FOREACH t IN ARRAY tbls LOOP
    EXECUTE format('GRANT SELECT, INSERT, UPDATE, DELETE ON public.%I TO authenticated', t);
    EXECUTE format('GRANT ALL ON public.%I TO service_role', t);
    EXECUTE format('ALTER TABLE public.%I ENABLE ROW LEVEL SECURITY', t);

    write_perm := CASE
      WHEN t IN ('marks','mark_evaluations') THEN 'marks.entry'
      WHEN t IN ('results','result_courses') THEN 'results.publish'
      WHEN t = 'hall_tickets' THEN 'hallticket.generate'
      WHEN t IN ('questions','question_papers','question_paper_questions') THEN 'questionpaper.manage'
      WHEN t = 'certificates' THEN 'certificate.issue'
      ELSE 'exam.manage'
    END;

    IF t = ANY(own_tables) THEN
      student_link := CASE
        WHEN t = 'result_courses' THEN 'EXISTS (SELECT 1 FROM public.results r JOIN public.students s ON s.id = r.student_id WHERE r.id = result_id AND (s.user_id = auth.uid() OR EXISTS (SELECT 1 FROM public.student_guardians g WHERE g.student_id = s.id AND g.user_id = auth.uid())))'
        ELSE 'EXISTS (SELECT 1 FROM public.students s WHERE s.id = student_id AND (s.user_id = auth.uid() OR EXISTS (SELECT 1 FROM public.student_guardians g WHERE g.student_id = s.id AND g.user_id = auth.uid())))'
      END;
      EXECUTE format(
        'CREATE POLICY %I ON public.%I FOR SELECT TO authenticated USING (is_tenant_member(tenant_id) AND (has_permission(''exam.view'', tenant_id) OR has_permission(''exam.read'', tenant_id) OR %s))',
        t || '_select', t, student_link);
    ELSE
      EXECUTE format('CREATE POLICY %I ON public.%I FOR SELECT TO authenticated USING (is_tenant_member(tenant_id))', t || '_select', t);
    END IF;

    EXECUTE format(
      'CREATE POLICY %I ON public.%I FOR ALL TO authenticated USING (is_tenant_member(tenant_id) AND (has_permission(%L, tenant_id) OR has_permission(''exam.manage'', tenant_id))) WITH CHECK (is_tenant_member(tenant_id) AND (has_permission(%L, tenant_id) OR has_permission(''exam.manage'', tenant_id)))',
      t || '_write', t, write_perm, write_perm);

    EXECUTE format('CREATE TRIGGER %I BEFORE INSERT ON public.%I FOR EACH ROW EXECUTE FUNCTION public.set_created_by()', 'set_created_by_' || t, t);
    EXECUTE format('CREATE TRIGGER %I BEFORE UPDATE ON public.%I FOR EACH ROW EXECUTE FUNCTION public.set_updated_at()', 'set_updated_at_' || t, t);
    EXECUTE format('CREATE TRIGGER %I AFTER INSERT OR UPDATE OR DELETE ON public.%I FOR EACH ROW EXECUTE FUNCTION public.audit_row_change()', 'audit_' || t, t);
  END LOOP;
END $$;

-- students may raise their own revaluation requests
CREATE POLICY revaluation_requests_student_insert ON public.revaluation_requests
  FOR INSERT TO authenticated
  WITH CHECK (is_tenant_member(tenant_id) AND EXISTS (SELECT 1 FROM public.students s WHERE s.id = student_id AND s.user_id = auth.uid()));

-- ============ PERMISSIONS ============
INSERT INTO public.permissions (key, module, resource, action, name, description) VALUES
  ('exam.read','examination','exam','read','Read examinations','View exam sessions, timetables and registrations'),
  ('exam.create','examination','exam','create','Create examinations','Create exam sessions and exams'),
  ('exam.update','examination','exam','update','Update examinations','Edit exam planning data'),
  ('exam.approve','examination','exam','approve','Approve examinations','Approve exam plans, papers and moderation'),
  ('marks.entry','examination','marks','entry','Enter marks','Enter and submit internal/external marks'),
  ('results.publish','examination','results','publish','Publish results','Compute, approve and publish results'),
  ('hallticket.generate','examination','hall_ticket','generate','Generate hall tickets','Issue and revoke hall tickets'),
  ('questionpaper.manage','examination','question_paper','manage','Manage question papers','Manage question bank and papers')
ON CONFLICT (key) DO NOTHING;

INSERT INTO public.role_permissions (role_id, permission_id)
SELECT r.id, p.id FROM public.roles r CROSS JOIN public.permissions p
WHERE p.key IN ('exam.read','exam.create','exam.update','exam.approve','marks.entry','results.publish','hallticket.generate','questionpaper.manage')
  AND r.key IN ('super_admin','college_admin','principal','registrar','dean')
ON CONFLICT DO NOTHING;

INSERT INTO public.role_permissions (role_id, permission_id)
SELECT r.id, p.id FROM public.roles r CROSS JOIN public.permissions p
WHERE p.key IN ('exam.read','exam.create','exam.update','marks.entry','questionpaper.manage')
  AND r.key IN ('hod')
ON CONFLICT DO NOTHING;

INSERT INTO public.role_permissions (role_id, permission_id)
SELECT r.id, p.id FROM public.roles r CROSS JOIN public.permissions p
WHERE p.key IN ('exam.read','marks.entry','questionpaper.manage')
  AND r.key IN ('faculty')
ON CONFLICT DO NOTHING;

INSERT INTO public.role_permissions (role_id, permission_id)
SELECT r.id, p.id FROM public.roles r CROSS JOIN public.permissions p
WHERE p.key IN ('exam.read') AND r.key IN ('student','parent')
ON CONFLICT DO NOTHING;