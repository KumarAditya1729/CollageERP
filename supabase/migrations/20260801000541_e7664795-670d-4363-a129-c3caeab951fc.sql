
-- ============ ENUMS ============
CREATE TYPE public.lms_node_kind AS ENUM ('module','chapter','lesson','topic');
CREATE TYPE public.lms_publish_status AS ENUM ('draft','pending_approval','scheduled','published','archived');
CREATE TYPE public.lms_content_kind AS ENUM ('page','note','pdf','ppt','doc','sheet','image','video','audio','zip','link','youtube','drive','other');
CREATE TYPE public.lms_plan_kind AS ENUM ('lesson','weekly','semester','teaching');
CREATE TYPE public.lms_assignment_mode AS ENUM ('individual','group');
CREATE TYPE public.lms_submission_channel AS ENUM ('online','offline','both');
CREATE TYPE public.lms_submission_status AS ENUM ('draft','submitted','late','returned','graded','resubmit');
CREATE TYPE public.lms_question_kind AS ENUM ('mcq','msq','subjective','numerical','coding');
CREATE TYPE public.lms_attempt_status AS ENUM ('in_progress','submitted','auto_submitted','evaluated');
CREATE TYPE public.lms_live_provider AS ENUM ('google_meet','zoom','teams','other');
CREATE TYPE public.lms_discussion_kind AS ENUM ('question','discussion','announcement');
CREATE TYPE public.lms_progress_state AS ENUM ('not_started','in_progress','completed');

-- ============ WORKSPACE ============
CREATE TABLE public.lms_workspaces (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  campus_id uuid REFERENCES public.campuses(id) ON DELETE SET NULL,
  course_id uuid NOT NULL REFERENCES public.courses(id) ON DELETE CASCADE,
  section_id uuid REFERENCES public.sections(id) ON DELETE SET NULL,
  academic_session_id uuid REFERENCES public.academic_sessions(id) ON DELETE SET NULL,
  semester_id uuid REFERENCES public.semesters(id) ON DELETE SET NULL,
  faculty_id uuid REFERENCES public.faculty(id) ON DELETE SET NULL,
  title text NOT NULL,
  summary text,
  overview text,
  banner_media_id uuid REFERENCES public.media_assets(id) ON DELETE SET NULL,
  status public.lms_publish_status NOT NULL DEFAULT 'draft',
  settings jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  created_by uuid, updated_by uuid, deleted_at timestamptz, deleted_by uuid
);
CREATE INDEX lms_workspaces_course_idx ON public.lms_workspaces(tenant_id, course_id);

CREATE TABLE public.lms_announcements (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  workspace_id uuid NOT NULL REFERENCES public.lms_workspaces(id) ON DELETE CASCADE,
  title text NOT NULL,
  body text NOT NULL,
  is_pinned boolean NOT NULL DEFAULT false,
  published_at timestamptz NOT NULL DEFAULT now(),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  created_by uuid, updated_by uuid, deleted_at timestamptz, deleted_by uuid
);

-- ============ CONTENT LIBRARY ============
CREATE TABLE public.lms_library_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  folder_id uuid REFERENCES public.media_folders(id) ON DELETE SET NULL,
  media_asset_id uuid REFERENCES public.media_assets(id) ON DELETE SET NULL,
  title text NOT NULL,
  description text,
  kind public.lms_content_kind NOT NULL DEFAULT 'page',
  category text,
  url text,
  body text,
  version integer NOT NULL DEFAULT 1,
  reuse_count integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  created_by uuid, updated_by uuid, deleted_at timestamptz, deleted_by uuid
);

-- ============ CONTENT TREE ============
CREATE TABLE public.lms_nodes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  workspace_id uuid NOT NULL REFERENCES public.lms_workspaces(id) ON DELETE CASCADE,
  parent_id uuid REFERENCES public.lms_nodes(id) ON DELETE CASCADE,
  kind public.lms_node_kind NOT NULL DEFAULT 'module',
  title text NOT NULL,
  description text,
  position integer NOT NULL DEFAULT 0,
  status public.lms_publish_status NOT NULL DEFAULT 'draft',
  scheduled_at timestamptz,
  published_at timestamptz,
  duration_minutes integer,
  course_outcome_id uuid REFERENCES public.course_outcomes(id) ON DELETE SET NULL,
  bloom_level public.bloom_level,
  is_mandatory boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  created_by uuid, updated_by uuid, deleted_at timestamptz, deleted_by uuid
);
CREATE INDEX lms_nodes_ws_idx ON public.lms_nodes(workspace_id, parent_id, position);

CREATE TABLE public.lms_content_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  workspace_id uuid NOT NULL REFERENCES public.lms_workspaces(id) ON DELETE CASCADE,
  node_id uuid REFERENCES public.lms_nodes(id) ON DELETE CASCADE,
  library_item_id uuid REFERENCES public.lms_library_items(id) ON DELETE SET NULL,
  media_asset_id uuid REFERENCES public.media_assets(id) ON DELETE SET NULL,
  kind public.lms_content_kind NOT NULL DEFAULT 'page',
  title text NOT NULL,
  body text,
  url text,
  file_name text,
  file_size bigint,
  mime_type text,
  duration_seconds numeric,
  position integer NOT NULL DEFAULT 0,
  version integer NOT NULL DEFAULT 1,
  status public.lms_publish_status NOT NULL DEFAULT 'draft',
  scheduled_at timestamptz,
  published_at timestamptz,
  is_downloadable boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  created_by uuid, updated_by uuid, deleted_at timestamptz, deleted_by uuid
);
CREATE INDEX lms_content_items_node_idx ON public.lms_content_items(workspace_id, node_id, position);

CREATE TABLE public.lms_content_versions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  content_item_id uuid NOT NULL REFERENCES public.lms_content_items(id) ON DELETE CASCADE,
  version integer NOT NULL,
  snapshot jsonb NOT NULL,
  note text,
  changed_by uuid,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (content_item_id, version)
);

-- ============ LESSON PLANS ============
CREATE TABLE public.lms_lesson_plans (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  workspace_id uuid REFERENCES public.lms_workspaces(id) ON DELETE CASCADE,
  course_id uuid NOT NULL REFERENCES public.courses(id) ON DELETE CASCADE,
  faculty_id uuid REFERENCES public.faculty(id) ON DELETE SET NULL,
  kind public.lms_plan_kind NOT NULL DEFAULT 'lesson',
  title text NOT NULL,
  week_number integer,
  planned_date date,
  planned_hours numeric,
  objectives text,
  activities text,
  resources text,
  assessment text,
  course_outcome_id uuid REFERENCES public.course_outcomes(id) ON DELETE SET NULL,
  program_outcome_id uuid REFERENCES public.program_outcomes(id) ON DELETE SET NULL,
  bloom_level public.bloom_level,
  status public.lms_publish_status NOT NULL DEFAULT 'draft',
  completed_at timestamptz,
  ai_generated boolean NOT NULL DEFAULT false,
  ai_prompt text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  created_by uuid, updated_by uuid, deleted_at timestamptz, deleted_by uuid
);

-- ============ ASSIGNMENTS ============
CREATE TABLE public.lms_assignments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  workspace_id uuid NOT NULL REFERENCES public.lms_workspaces(id) ON DELETE CASCADE,
  course_id uuid NOT NULL REFERENCES public.courses(id) ON DELETE CASCADE,
  node_id uuid REFERENCES public.lms_nodes(id) ON DELETE SET NULL,
  rubric_id uuid REFERENCES public.rubrics(id) ON DELETE SET NULL,
  title text NOT NULL,
  instructions text,
  mode public.lms_assignment_mode NOT NULL DEFAULT 'individual',
  channel public.lms_submission_channel NOT NULL DEFAULT 'online',
  max_marks numeric NOT NULL DEFAULT 100,
  weightage numeric NOT NULL DEFAULT 0,
  opens_at timestamptz,
  due_at timestamptz,
  closes_at timestamptz,
  allow_late boolean NOT NULL DEFAULT false,
  late_penalty_percent numeric NOT NULL DEFAULT 0,
  max_attempts integer NOT NULL DEFAULT 1,
  group_size integer,
  status public.lms_publish_status NOT NULL DEFAULT 'draft',
  published_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  created_by uuid, updated_by uuid, deleted_at timestamptz, deleted_by uuid
);

CREATE TABLE public.lms_assignment_groups (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  assignment_id uuid NOT NULL REFERENCES public.lms_assignments(id) ON DELETE CASCADE,
  name text NOT NULL,
  leader_student_id uuid REFERENCES public.students(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  created_by uuid, updated_by uuid, deleted_at timestamptz, deleted_by uuid
);

CREATE TABLE public.lms_assignment_group_members (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  group_id uuid NOT NULL REFERENCES public.lms_assignment_groups(id) ON DELETE CASCADE,
  student_id uuid NOT NULL REFERENCES public.students(id) ON DELETE CASCADE,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (group_id, student_id)
);

CREATE TABLE public.lms_submissions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  assignment_id uuid NOT NULL REFERENCES public.lms_assignments(id) ON DELETE CASCADE,
  student_id uuid NOT NULL REFERENCES public.students(id) ON DELETE CASCADE,
  group_id uuid REFERENCES public.lms_assignment_groups(id) ON DELETE SET NULL,
  attempt_no integer NOT NULL DEFAULT 1,
  status public.lms_submission_status NOT NULL DEFAULT 'draft',
  text_answer text,
  link_url text,
  submitted_at timestamptz,
  is_late boolean NOT NULL DEFAULT false,
  submitted_by uuid,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  created_by uuid, updated_by uuid, deleted_at timestamptz, deleted_by uuid,
  UNIQUE (assignment_id, student_id, attempt_no)
);

CREATE TABLE public.lms_submission_files (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  submission_id uuid NOT NULL REFERENCES public.lms_submissions(id) ON DELETE CASCADE,
  storage_bucket text NOT NULL DEFAULT 'documents',
  storage_path text NOT NULL,
  file_name text NOT NULL,
  file_size bigint,
  mime_type text,
  created_at timestamptz NOT NULL DEFAULT now(),
  created_by uuid
);

CREATE TABLE public.lms_grades (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  submission_id uuid NOT NULL REFERENCES public.lms_submissions(id) ON DELETE CASCADE,
  assignment_id uuid NOT NULL REFERENCES public.lms_assignments(id) ON DELETE CASCADE,
  marks numeric,
  grade text,
  feedback text,
  rubric_scores jsonb NOT NULL DEFAULT '{}'::jsonb,
  is_published boolean NOT NULL DEFAULT false,
  evaluated_by uuid,
  evaluated_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  created_by uuid, updated_by uuid, deleted_at timestamptz, deleted_by uuid,
  UNIQUE (submission_id)
);

-- ============ QUIZZES ============
CREATE TABLE public.lms_quizzes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  workspace_id uuid NOT NULL REFERENCES public.lms_workspaces(id) ON DELETE CASCADE,
  course_id uuid NOT NULL REFERENCES public.courses(id) ON DELETE CASCADE,
  node_id uuid REFERENCES public.lms_nodes(id) ON DELETE SET NULL,
  title text NOT NULL,
  instructions text,
  total_marks numeric NOT NULL DEFAULT 0,
  duration_minutes integer,
  negative_marking numeric NOT NULL DEFAULT 0,
  shuffle_questions boolean NOT NULL DEFAULT true,
  shuffle_options boolean NOT NULL DEFAULT true,
  pool_size integer,
  max_attempts integer NOT NULL DEFAULT 1,
  opens_at timestamptz,
  closes_at timestamptz,
  instant_result boolean NOT NULL DEFAULT true,
  pass_percent numeric NOT NULL DEFAULT 40,
  status public.lms_publish_status NOT NULL DEFAULT 'draft',
  published_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  created_by uuid, updated_by uuid, deleted_at timestamptz, deleted_by uuid
);

CREATE TABLE public.lms_quiz_questions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  quiz_id uuid NOT NULL REFERENCES public.lms_quizzes(id) ON DELETE CASCADE,
  question_id uuid REFERENCES public.questions(id) ON DELETE SET NULL,
  kind public.lms_question_kind NOT NULL DEFAULT 'mcq',
  body text NOT NULL,
  options jsonb NOT NULL DEFAULT '[]'::jsonb,
  answer_key jsonb NOT NULL DEFAULT '[]'::jsonb,
  explanation text,
  marks numeric NOT NULL DEFAULT 1,
  negative_marks numeric NOT NULL DEFAULT 0,
  pool_tag text,
  bloom_level public.bloom_level,
  difficulty public.question_difficulty,
  position integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  created_by uuid, updated_by uuid, deleted_at timestamptz, deleted_by uuid
);

CREATE TABLE public.lms_quiz_attempts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  quiz_id uuid NOT NULL REFERENCES public.lms_quizzes(id) ON DELETE CASCADE,
  student_id uuid NOT NULL REFERENCES public.students(id) ON DELETE CASCADE,
  attempt_no integer NOT NULL DEFAULT 1,
  status public.lms_attempt_status NOT NULL DEFAULT 'in_progress',
  question_order jsonb NOT NULL DEFAULT '[]'::jsonb,
  score numeric,
  percentage numeric,
  is_passed boolean,
  started_at timestamptz NOT NULL DEFAULT now(),
  submitted_at timestamptz,
  time_spent_seconds integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  created_by uuid, updated_by uuid, deleted_at timestamptz, deleted_by uuid,
  UNIQUE (quiz_id, student_id, attempt_no)
);

CREATE TABLE public.lms_quiz_responses (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  attempt_id uuid NOT NULL REFERENCES public.lms_quiz_attempts(id) ON DELETE CASCADE,
  quiz_question_id uuid NOT NULL REFERENCES public.lms_quiz_questions(id) ON DELETE CASCADE,
  response jsonb NOT NULL DEFAULT '[]'::jsonb,
  is_correct boolean,
  marks_awarded numeric NOT NULL DEFAULT 0,
  feedback text,
  evaluated_by uuid,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (attempt_id, quiz_question_id)
);

-- ============ DISCUSSIONS ============
CREATE TABLE public.lms_discussions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  workspace_id uuid NOT NULL REFERENCES public.lms_workspaces(id) ON DELETE CASCADE,
  kind public.lms_discussion_kind NOT NULL DEFAULT 'discussion',
  title text NOT NULL,
  body text,
  is_pinned boolean NOT NULL DEFAULT false,
  is_locked boolean NOT NULL DEFAULT false,
  is_resolved boolean NOT NULL DEFAULT false,
  resolved_post_id uuid,
  reply_count integer NOT NULL DEFAULT 0,
  last_activity_at timestamptz NOT NULL DEFAULT now(),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  created_by uuid, updated_by uuid, deleted_at timestamptz, deleted_by uuid
);

CREATE TABLE public.lms_discussion_posts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  discussion_id uuid NOT NULL REFERENCES public.lms_discussions(id) ON DELETE CASCADE,
  parent_id uuid REFERENCES public.lms_discussion_posts(id) ON DELETE CASCADE,
  body text NOT NULL,
  mentions uuid[] NOT NULL DEFAULT '{}',
  is_answer boolean NOT NULL DEFAULT false,
  is_hidden boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  created_by uuid, updated_by uuid, deleted_at timestamptz, deleted_by uuid
);

-- ============ LIVE CLASSES ============
CREATE TABLE public.lms_live_classes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  workspace_id uuid NOT NULL REFERENCES public.lms_workspaces(id) ON DELETE CASCADE,
  timetable_entry_id uuid REFERENCES public.timetable_entries(id) ON DELETE SET NULL,
  attendance_session_id uuid REFERENCES public.attendance_sessions(id) ON DELETE SET NULL,
  calendar_event_id uuid REFERENCES public.calendar_events(id) ON DELETE SET NULL,
  faculty_id uuid REFERENCES public.faculty(id) ON DELETE SET NULL,
  title text NOT NULL,
  agenda text,
  provider public.lms_live_provider NOT NULL DEFAULT 'google_meet',
  join_url text,
  recording_url text,
  scheduled_start timestamptz NOT NULL,
  scheduled_end timestamptz,
  status text NOT NULL DEFAULT 'scheduled',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  created_by uuid, updated_by uuid, deleted_at timestamptz, deleted_by uuid
);

-- ============ PROGRESS ============
CREATE TABLE public.lms_progress (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  workspace_id uuid NOT NULL REFERENCES public.lms_workspaces(id) ON DELETE CASCADE,
  node_id uuid REFERENCES public.lms_nodes(id) ON DELETE CASCADE,
  content_item_id uuid REFERENCES public.lms_content_items(id) ON DELETE CASCADE,
  student_id uuid NOT NULL REFERENCES public.students(id) ON DELETE CASCADE,
  state public.lms_progress_state NOT NULL DEFAULT 'not_started',
  progress_percent numeric NOT NULL DEFAULT 0,
  time_spent_seconds integer NOT NULL DEFAULT 0,
  last_accessed_at timestamptz NOT NULL DEFAULT now(),
  completed_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  created_by uuid, updated_by uuid
);
CREATE UNIQUE INDEX lms_progress_unique_idx ON public.lms_progress(student_id, workspace_id, COALESCE(content_item_id, node_id, workspace_id));

-- ============ GRANTS, RLS, POLICIES, TRIGGERS ============
DO $$
DECLARE
  t text;
  soft boolean;
  tables text[] := ARRAY[
    'lms_workspaces','lms_announcements','lms_library_items','lms_nodes','lms_content_items',
    'lms_content_versions','lms_lesson_plans','lms_assignments','lms_assignment_groups',
    'lms_assignment_group_members','lms_submissions','lms_submission_files','lms_grades',
    'lms_quizzes','lms_quiz_questions','lms_quiz_attempts','lms_quiz_responses',
    'lms_discussions','lms_discussion_posts','lms_live_classes','lms_progress'
  ];
BEGIN
  FOREACH t IN ARRAY tables LOOP
    EXECUTE format('GRANT SELECT, INSERT, UPDATE, DELETE ON public.%I TO authenticated', t);
    EXECUTE format('GRANT ALL ON public.%I TO service_role', t);
    EXECUTE format('ALTER TABLE public.%I ENABLE ROW LEVEL SECURITY', t);
    EXECUTE format(
      'CREATE POLICY %I ON public.%I FOR SELECT TO authenticated USING (public.is_tenant_member(tenant_id))',
      t || '_select', t);
    EXECUTE format(
      'CREATE POLICY %I ON public.%I FOR ALL TO authenticated USING (public.has_permission(''lms.update'', tenant_id)) WITH CHECK (public.has_permission(''lms.update'', tenant_id))',
      t || '_manage', t);

    -- shared triggers
    EXECUTE format('CREATE TRIGGER %I BEFORE INSERT ON public.%I FOR EACH ROW EXECUTE FUNCTION public.set_created_by()', t || '_created_by', t);
    IF EXISTS (SELECT 1 FROM information_schema.columns c WHERE c.table_schema='public' AND c.table_name=t AND c.column_name='updated_at') THEN
      EXECUTE format('CREATE TRIGGER %I BEFORE UPDATE ON public.%I FOR EACH ROW EXECUTE FUNCTION public.set_updated_at()', t || '_updated_at', t);
      EXECUTE format('CREATE TRIGGER %I AFTER INSERT OR UPDATE OR DELETE ON public.%I FOR EACH ROW EXECUTE FUNCTION public.audit_row_change()', t || '_audit', t);
    END IF;
  END LOOP;
END $$;

-- Student-owned write access
CREATE POLICY lms_submissions_own ON public.lms_submissions FOR ALL TO authenticated
  USING (student_id IN (SELECT s.id FROM public.students s WHERE s.user_id = auth.uid()))
  WITH CHECK (student_id IN (SELECT s.id FROM public.students s WHERE s.user_id = auth.uid()));

CREATE POLICY lms_submission_files_own ON public.lms_submission_files FOR ALL TO authenticated
  USING (submission_id IN (SELECT sub.id FROM public.lms_submissions sub JOIN public.students s ON s.id = sub.student_id WHERE s.user_id = auth.uid()))
  WITH CHECK (submission_id IN (SELECT sub.id FROM public.lms_submissions sub JOIN public.students s ON s.id = sub.student_id WHERE s.user_id = auth.uid()));

CREATE POLICY lms_quiz_attempts_own ON public.lms_quiz_attempts FOR ALL TO authenticated
  USING (student_id IN (SELECT s.id FROM public.students s WHERE s.user_id = auth.uid()))
  WITH CHECK (student_id IN (SELECT s.id FROM public.students s WHERE s.user_id = auth.uid()));

CREATE POLICY lms_quiz_responses_own ON public.lms_quiz_responses FOR ALL TO authenticated
  USING (attempt_id IN (SELECT a.id FROM public.lms_quiz_attempts a JOIN public.students s ON s.id = a.student_id WHERE s.user_id = auth.uid()))
  WITH CHECK (attempt_id IN (SELECT a.id FROM public.lms_quiz_attempts a JOIN public.students s ON s.id = a.student_id WHERE s.user_id = auth.uid()));

CREATE POLICY lms_discussion_posts_own ON public.lms_discussion_posts FOR ALL TO authenticated
  USING (created_by = auth.uid()) WITH CHECK (created_by = auth.uid() OR created_by IS NULL);

CREATE POLICY lms_discussions_own ON public.lms_discussions FOR INSERT TO authenticated
  WITH CHECK (public.is_tenant_member(tenant_id));

CREATE POLICY lms_progress_own ON public.lms_progress FOR ALL TO authenticated
  USING (student_id IN (SELECT s.id FROM public.students s WHERE s.user_id = auth.uid()))
  WITH CHECK (student_id IN (SELECT s.id FROM public.students s WHERE s.user_id = auth.uid()));

-- ============ PERMISSIONS ============
INSERT INTO public.permissions (key, module, resource, action, name, description, is_system) VALUES
  ('lms.read','lms','lms','read','View learning content','Read course workspaces, content, assignments and quizzes', true),
  ('lms.create','lms','lms','create','Create learning content','Create LMS records', true),
  ('lms.update','lms','lms','update','Manage learning content','Create, edit and publish LMS records', true),
  ('lms.delete','lms','lms','delete','Delete learning content','Remove LMS records', true),
  ('assignment.manage','lms','assignment','manage','Manage assignments','Create, publish and evaluate assignments', true),
  ('quiz.manage','lms','quiz','manage','Manage quizzes','Create, publish and evaluate quizzes', true),
  ('content.manage','lms','content','manage','Manage course content','Manage modules, lessons and content library', true),
  ('lesson.manage','lms','lesson','manage','Manage lesson plans','Create and approve lesson plans', true),
  ('discussion.manage','lms','discussion','manage','Moderate discussions','Pin, lock, resolve and moderate forum threads', true),
  ('analytics.view','lms','analytics','view','View learning analytics','Access LMS analytics and reports', true)
ON CONFLICT (key) DO NOTHING;

INSERT INTO public.role_permissions (role_id, permission_id)
SELECT r.id, p.id FROM public.roles r CROSS JOIN public.permissions p
WHERE p.key IN ('lms.read','lms.create','lms.update','lms.delete','assignment.manage','quiz.manage','content.manage','lesson.manage','discussion.manage','analytics.view')
  AND r.key IN ('super_admin','college_admin','principal','registrar','dean','hod','faculty')
ON CONFLICT DO NOTHING;

INSERT INTO public.role_permissions (role_id, permission_id)
SELECT r.id, p.id FROM public.roles r CROSS JOIN public.permissions p
WHERE p.key = 'lms.read' AND r.key IN ('student','parent')
ON CONFLICT DO NOTHING;
