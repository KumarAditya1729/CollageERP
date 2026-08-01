-- ============ ENUMS ============
CREATE TYPE public.class_session_type AS ENUM ('lecture','practical','lab','seminar','workshop','tutorial','exam','daily','hostel','transport','other');
CREATE TYPE public.attendance_mode AS ENUM ('manual','qr','barcode','rfid','biometric','nfc','gps','self_checkin','bulk','import');
CREATE TYPE public.attendance_status AS ENUM ('present','absent','late','excused','on_leave','on_duty','medical','holiday');
CREATE TYPE public.attendee_kind AS ENUM ('student','faculty','staff');
CREATE TYPE public.leave_kind AS ENUM ('casual','medical','duty','sports','maternity','bereavement','other');
CREATE TYPE public.approval_state AS ENUM ('pending','approved','rejected','cancelled');
CREATE TYPE public.timetable_kind AS ENUM ('recurring','temporary');

-- ============ TIMETABLE ENTRIES ============
CREATE TABLE public.timetable_entries (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  campus_id uuid REFERENCES public.campuses(id) ON DELETE SET NULL,
  academic_session_id uuid REFERENCES public.academic_sessions(id) ON DELETE SET NULL,
  semester_id uuid REFERENCES public.semesters(id) ON DELETE SET NULL,
  section_id uuid REFERENCES public.sections(id) ON DELETE CASCADE,
  course_id uuid REFERENCES public.courses(id) ON DELETE SET NULL,
  faculty_id uuid REFERENCES public.faculty(id) ON DELETE SET NULL,
  room_id uuid REFERENCES public.rooms(id) ON DELETE SET NULL,
  time_slot_id uuid REFERENCES public.time_slots(id) ON DELETE SET NULL,
  weekday smallint NOT NULL,
  starts_at time NOT NULL,
  ends_at time NOT NULL,
  session_type public.class_session_type NOT NULL DEFAULT 'lecture',
  kind public.timetable_kind NOT NULL DEFAULT 'recurring',
  effective_from date,
  effective_to date,
  override_date date,
  skip_on_holiday boolean NOT NULL DEFAULT true,
  is_cancelled boolean NOT NULL DEFAULT false,
  notes text,
  metadata jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  created_by uuid,
  updated_by uuid,
  deleted_at timestamptz
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.timetable_entries TO authenticated;
GRANT ALL ON public.timetable_entries TO service_role;
ALTER TABLE public.timetable_entries ENABLE ROW LEVEL SECURITY;
CREATE POLICY "tt_read" ON public.timetable_entries FOR SELECT TO authenticated USING (public.is_tenant_member(tenant_id));
CREATE POLICY "tt_write" ON public.timetable_entries FOR ALL TO authenticated
  USING (public.is_tenant_member(tenant_id) AND public.has_permission('timetable.manage', tenant_id))
  WITH CHECK (public.is_tenant_member(tenant_id) AND public.has_permission('timetable.manage', tenant_id));

-- ============ SUBSTITUTIONS ============
CREATE TABLE public.timetable_substitutions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  timetable_entry_id uuid NOT NULL REFERENCES public.timetable_entries(id) ON DELETE CASCADE,
  substitution_date date NOT NULL,
  original_faculty_id uuid REFERENCES public.faculty(id) ON DELETE SET NULL,
  substitute_faculty_id uuid REFERENCES public.faculty(id) ON DELETE SET NULL,
  room_id uuid REFERENCES public.rooms(id) ON DELETE SET NULL,
  reason text,
  is_emergency boolean NOT NULL DEFAULT false,
  status public.approval_state NOT NULL DEFAULT 'pending',
  approved_by uuid,
  approved_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  created_by uuid,
  updated_by uuid,
  deleted_at timestamptz,
  UNIQUE (timetable_entry_id, substitution_date)
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.timetable_substitutions TO authenticated;
GRANT ALL ON public.timetable_substitutions TO service_role;
ALTER TABLE public.timetable_substitutions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "sub_read" ON public.timetable_substitutions FOR SELECT TO authenticated USING (public.is_tenant_member(tenant_id));
CREATE POLICY "sub_write" ON public.timetable_substitutions FOR ALL TO authenticated
  USING (public.is_tenant_member(tenant_id) AND public.has_permission('substitution.manage', tenant_id))
  WITH CHECK (public.is_tenant_member(tenant_id) AND public.has_permission('substitution.manage', tenant_id));

-- ============ ATTENDANCE SESSIONS ============
CREATE TABLE public.attendance_sessions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  campus_id uuid REFERENCES public.campuses(id) ON DELETE SET NULL,
  timetable_entry_id uuid REFERENCES public.timetable_entries(id) ON DELETE SET NULL,
  academic_session_id uuid REFERENCES public.academic_sessions(id) ON DELETE SET NULL,
  semester_id uuid REFERENCES public.semesters(id) ON DELETE SET NULL,
  section_id uuid REFERENCES public.sections(id) ON DELETE SET NULL,
  course_id uuid REFERENCES public.courses(id) ON DELETE SET NULL,
  faculty_id uuid REFERENCES public.faculty(id) ON DELETE SET NULL,
  room_id uuid REFERENCES public.rooms(id) ON DELETE SET NULL,
  attendee_kind public.attendee_kind NOT NULL DEFAULT 'student',
  session_type public.class_session_type NOT NULL DEFAULT 'lecture',
  session_date date NOT NULL DEFAULT CURRENT_DATE,
  starts_at time,
  ends_at time,
  mode public.attendance_mode NOT NULL DEFAULT 'manual',
  qr_token text,
  qr_expires_at timestamptz,
  gps_latitude numeric(9,6),
  gps_longitude numeric(9,6),
  gps_radius_m integer,
  allow_self_checkin boolean NOT NULL DEFAULT false,
  is_locked boolean NOT NULL DEFAULT false,
  locked_at timestamptz,
  total_expected integer,
  notes text,
  metadata jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  created_by uuid,
  updated_by uuid,
  deleted_at timestamptz
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.attendance_sessions TO authenticated;
GRANT ALL ON public.attendance_sessions TO service_role;
ALTER TABLE public.attendance_sessions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "att_sess_read" ON public.attendance_sessions FOR SELECT TO authenticated USING (public.is_tenant_member(tenant_id));
CREATE POLICY "att_sess_write" ON public.attendance_sessions FOR ALL TO authenticated
  USING (public.is_tenant_member(tenant_id) AND public.has_permission('attendance.manage', tenant_id))
  WITH CHECK (public.is_tenant_member(tenant_id) AND public.has_permission('attendance.manage', tenant_id));

-- ============ ATTENDANCE RECORDS ============
CREATE TABLE public.attendance_records (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  attendance_session_id uuid NOT NULL REFERENCES public.attendance_sessions(id) ON DELETE CASCADE,
  attendee_kind public.attendee_kind NOT NULL DEFAULT 'student',
  student_id uuid REFERENCES public.students(id) ON DELETE CASCADE,
  faculty_id uuid REFERENCES public.faculty(id) ON DELETE CASCADE,
  staff_id uuid REFERENCES public.staff(id) ON DELETE CASCADE,
  user_id uuid,
  status public.attendance_status NOT NULL DEFAULT 'present',
  minutes_late integer NOT NULL DEFAULT 0,
  marked_via public.attendance_mode NOT NULL DEFAULT 'manual',
  marked_at timestamptz NOT NULL DEFAULT now(),
  marked_by uuid,
  gps_latitude numeric(9,6),
  gps_longitude numeric(9,6),
  device_info text,
  remarks text,
  is_corrected boolean NOT NULL DEFAULT false,
  corrected_at timestamptz,
  corrected_by uuid,
  leave_request_id uuid,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  created_by uuid,
  updated_by uuid,
  deleted_at timestamptz
);
CREATE UNIQUE INDEX attendance_records_session_student_idx ON public.attendance_records (attendance_session_id, student_id) WHERE student_id IS NOT NULL;
CREATE UNIQUE INDEX attendance_records_session_faculty_idx ON public.attendance_records (attendance_session_id, faculty_id) WHERE faculty_id IS NOT NULL;
CREATE UNIQUE INDEX attendance_records_session_staff_idx ON public.attendance_records (attendance_session_id, staff_id) WHERE staff_id IS NOT NULL;
CREATE INDEX attendance_records_student_idx ON public.attendance_records (student_id);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.attendance_records TO authenticated;
GRANT ALL ON public.attendance_records TO service_role;
ALTER TABLE public.attendance_records ENABLE ROW LEVEL SECURITY;
CREATE POLICY "att_rec_read" ON public.attendance_records FOR SELECT TO authenticated
  USING (public.is_tenant_member(tenant_id) OR user_id = auth.uid());
CREATE POLICY "att_rec_write" ON public.attendance_records FOR ALL TO authenticated
  USING (public.is_tenant_member(tenant_id) AND public.has_permission('attendance.manage', tenant_id))
  WITH CHECK (public.is_tenant_member(tenant_id) AND public.has_permission('attendance.manage', tenant_id));

-- ============ ATTENDANCE POLICIES ============
CREATE TABLE public.attendance_policies (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  name text NOT NULL,
  description text,
  department_id uuid REFERENCES public.departments(id) ON DELETE CASCADE,
  program_id uuid REFERENCES public.programs(id) ON DELETE CASCADE,
  attendee_kind public.attendee_kind NOT NULL DEFAULT 'student',
  minimum_percentage numeric(5,2) NOT NULL DEFAULT 75,
  warning_percentage numeric(5,2) NOT NULL DEFAULT 80,
  penalty_percentage numeric(5,2) NOT NULL DEFAULT 65,
  grace_minutes integer NOT NULL DEFAULT 5,
  late_after_minutes integer NOT NULL DEFAULT 10,
  late_counts_as_present boolean NOT NULL DEFAULT true,
  count_holidays boolean NOT NULL DEFAULT false,
  approved_leave_counts boolean NOT NULL DEFAULT true,
  medical_leave_counts boolean NOT NULL DEFAULT true,
  duty_leave_counts boolean NOT NULL DEFAULT true,
  corrections_need_approval boolean NOT NULL DEFAULT true,
  freeze_after_days integer,
  frozen_until date,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  created_by uuid,
  updated_by uuid,
  deleted_at timestamptz
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.attendance_policies TO authenticated;
GRANT ALL ON public.attendance_policies TO service_role;
ALTER TABLE public.attendance_policies ENABLE ROW LEVEL SECURITY;
CREATE POLICY "att_pol_read" ON public.attendance_policies FOR SELECT TO authenticated USING (public.is_tenant_member(tenant_id));
CREATE POLICY "att_pol_write" ON public.attendance_policies FOR ALL TO authenticated
  USING (public.is_tenant_member(tenant_id) AND public.has_permission('attendance.policy', tenant_id))
  WITH CHECK (public.is_tenant_member(tenant_id) AND public.has_permission('attendance.policy', tenant_id));

-- ============ LEAVE REQUESTS ============
CREATE TABLE public.leave_requests (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  attendee_kind public.attendee_kind NOT NULL DEFAULT 'student',
  student_id uuid REFERENCES public.students(id) ON DELETE CASCADE,
  faculty_id uuid REFERENCES public.faculty(id) ON DELETE CASCADE,
  staff_id uuid REFERENCES public.staff(id) ON DELETE CASCADE,
  requested_by uuid,
  leave_kind public.leave_kind NOT NULL DEFAULT 'casual',
  from_date date NOT NULL,
  to_date date NOT NULL,
  is_half_day boolean NOT NULL DEFAULT false,
  reason text,
  attachment_id uuid REFERENCES public.attachments(id) ON DELETE SET NULL,
  status public.approval_state NOT NULL DEFAULT 'pending',
  adjusts_attendance boolean NOT NULL DEFAULT true,
  reviewed_by uuid,
  reviewed_at timestamptz,
  review_notes text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  created_by uuid,
  updated_by uuid,
  deleted_at timestamptz
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.leave_requests TO authenticated;
GRANT ALL ON public.leave_requests TO service_role;
ALTER TABLE public.leave_requests ENABLE ROW LEVEL SECURITY;
CREATE POLICY "leave_read" ON public.leave_requests FOR SELECT TO authenticated
  USING (public.is_tenant_member(tenant_id) OR requested_by = auth.uid());
CREATE POLICY "leave_insert_own" ON public.leave_requests FOR INSERT TO authenticated
  WITH CHECK (public.is_tenant_member(tenant_id) AND requested_by = auth.uid());
CREATE POLICY "leave_manage" ON public.leave_requests FOR ALL TO authenticated
  USING (public.is_tenant_member(tenant_id) AND public.has_permission('leave.manage', tenant_id))
  WITH CHECK (public.is_tenant_member(tenant_id) AND public.has_permission('leave.manage', tenant_id));

ALTER TABLE public.attendance_records
  ADD CONSTRAINT attendance_records_leave_fk FOREIGN KEY (leave_request_id) REFERENCES public.leave_requests(id) ON DELETE SET NULL;

-- ============ ATTENDANCE CORRECTIONS ============
CREATE TABLE public.attendance_corrections (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  attendance_record_id uuid NOT NULL REFERENCES public.attendance_records(id) ON DELETE CASCADE,
  old_status public.attendance_status NOT NULL,
  new_status public.attendance_status NOT NULL,
  reason text,
  status public.approval_state NOT NULL DEFAULT 'pending',
  requested_by uuid,
  reviewed_by uuid,
  reviewed_at timestamptz,
  review_notes text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  created_by uuid,
  updated_by uuid,
  deleted_at timestamptz
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.attendance_corrections TO authenticated;
GRANT ALL ON public.attendance_corrections TO service_role;
ALTER TABLE public.attendance_corrections ENABLE ROW LEVEL SECURITY;
CREATE POLICY "att_corr_read" ON public.attendance_corrections FOR SELECT TO authenticated
  USING (public.is_tenant_member(tenant_id) OR requested_by = auth.uid());
CREATE POLICY "att_corr_insert" ON public.attendance_corrections FOR INSERT TO authenticated
  WITH CHECK (public.is_tenant_member(tenant_id) AND requested_by = auth.uid());
CREATE POLICY "att_corr_manage" ON public.attendance_corrections FOR ALL TO authenticated
  USING (public.is_tenant_member(tenant_id) AND public.has_permission('attendance.correct', tenant_id))
  WITH CHECK (public.is_tenant_member(tenant_id) AND public.has_permission('attendance.correct', tenant_id));

-- ============ TRIGGERS ============
DO $$
DECLARE t text;
BEGIN
  FOREACH t IN ARRAY ARRAY['timetable_entries','timetable_substitutions','attendance_sessions','attendance_records','attendance_policies','leave_requests','attendance_corrections']
  LOOP
    EXECUTE format('CREATE TRIGGER set_updated_at_%1$s BEFORE UPDATE ON public.%1$s FOR EACH ROW EXECUTE FUNCTION public.set_updated_at()', t);
    EXECUTE format('CREATE TRIGGER set_created_by_%1$s BEFORE INSERT ON public.%1$s FOR EACH ROW EXECUTE FUNCTION public.set_created_by()', t);
    EXECUTE format('CREATE TRIGGER audit_%1$s AFTER INSERT OR UPDATE OR DELETE ON public.%1$s FOR EACH ROW EXECUTE FUNCTION public.audit_row_change()', t);
  END LOOP;
END $$;

-- ============ PERMISSIONS CATALOGUE ============
INSERT INTO public.permissions (key, name, description, module, resource, action)
VALUES
  ('timetable.view','View timetable','View class schedules','timetable','timetable','view'),
  ('timetable.manage','Manage timetable','Create and edit class schedules','timetable','timetable','manage'),
  ('substitution.manage','Manage substitutions','Assign and approve substitute faculty','timetable','substitution','manage'),
  ('attendance.view','View attendance','View attendance records and dashboards','attendance','attendance','view'),
  ('attendance.manage','Manage attendance','Create sessions and mark attendance','attendance','attendance','manage'),
  ('attendance.policy','Manage attendance policies','Configure attendance rules and freezes','attendance','attendance','policy'),
  ('attendance.correct','Approve attendance corrections','Review and apply attendance corrections','attendance','attendance','correct'),
  ('leave.manage','Manage leave','Review and approve leave requests','attendance','leave','manage')
ON CONFLICT (key) DO NOTHING;

-- grant the new permissions to tenant admin-level roles
INSERT INTO public.role_permissions (role_id, permission_id)
SELECT r.id, p.id
FROM public.roles r
CROSS JOIN public.permissions p
WHERE p.key IN ('timetable.view','timetable.manage','substitution.manage','attendance.view','attendance.manage','attendance.policy','attendance.correct','leave.manage')
  AND r.key IN ('platform_admin','tenant_admin','principal','hod','registrar')
ON CONFLICT DO NOTHING;

INSERT INTO public.role_permissions (role_id, permission_id)
SELECT r.id, p.id
FROM public.roles r
CROSS JOIN public.permissions p
WHERE p.key IN ('timetable.view','attendance.view','attendance.manage')
  AND r.key IN ('faculty')
ON CONFLICT DO NOTHING;