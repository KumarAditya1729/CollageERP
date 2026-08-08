-- ====================================================================================================
-- PHASE 2 MODULES: Placements, Library, LMS, Compliance, Communications
-- ====================================================================================================

-- 1. PLACEMENTS & CRC
CREATE TABLE public.placement_companies (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  name text NOT NULL,
  industry text,
  hr_contact_name text,
  hr_contact_email text,
  hr_contact_phone text,
  website_url text,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now()
);
CREATE INDEX idx_placement_companies_tenant ON public.placement_companies(tenant_id);

CREATE TABLE public.placement_drives (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  company_id uuid NOT NULL REFERENCES public.placement_companies(id) ON DELETE CASCADE,
  job_role text NOT NULL,
  ctc_lpa numeric(10,2),
  min_cgpa numeric(3,2),
  drive_date date,
  location text,
  status text DEFAULT 'upcoming', -- upcoming, active, completed, cancelled
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now()
);
CREATE INDEX idx_placement_drives_tenant ON public.placement_drives(tenant_id);
CREATE INDEX idx_placement_drives_company ON public.placement_drives(company_id);

CREATE TABLE public.placement_applications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  drive_id uuid NOT NULL REFERENCES public.placement_drives(id) ON DELETE CASCADE,
  student_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  status text DEFAULT 'applied', -- applied, shortlisted, interviewed, offered, rejected
  resume_url text,
  applied_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  UNIQUE(drive_id, student_id)
);
CREATE INDEX idx_placement_applications_tenant ON public.placement_applications(tenant_id);

-- 2. LIBRARY MANAGEMENT SYSTEM
CREATE TABLE public.library_books (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  isbn text,
  title text NOT NULL,
  author text,
  publisher text,
  category text,
  total_copies integer DEFAULT 1,
  available_copies integer DEFAULT 1,
  rack_number text,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now()
);
CREATE INDEX idx_library_books_tenant ON public.library_books(tenant_id);

CREATE TABLE public.library_issues (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  book_id uuid NOT NULL REFERENCES public.library_books(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  issued_at timestamp with time zone DEFAULT now(),
  due_date date NOT NULL,
  returned_at timestamp with time zone,
  fine_amount numeric(10,2) DEFAULT 0.00,
  status text DEFAULT 'issued', -- issued, returned, lost
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now()
);
CREATE INDEX idx_library_issues_tenant ON public.library_issues(tenant_id);
CREATE INDEX idx_library_issues_user ON public.library_issues(user_id);

-- 3. LEARNING MANAGEMENT SYSTEM (LMS)
CREATE TABLE public.lms_materials (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  course_id uuid NOT NULL REFERENCES public.courses(id) ON DELETE CASCADE,
  faculty_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  title text NOT NULL,
  description text,
  material_type text NOT NULL, -- pdf, video, link, document
  file_url text NOT NULL,
  is_published boolean DEFAULT true,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now()
);
CREATE INDEX idx_lms_materials_tenant ON public.lms_materials(tenant_id);
CREATE INDEX idx_lms_materials_course ON public.lms_materials(course_id);

CREATE TABLE public.lms_assignments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  course_id uuid NOT NULL REFERENCES public.courses(id) ON DELETE CASCADE,
  faculty_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  title text NOT NULL,
  description text,
  due_date timestamp with time zone NOT NULL,
  max_marks numeric(5,2),
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now()
);
CREATE INDEX idx_lms_assignments_tenant ON public.lms_assignments(tenant_id);

CREATE TABLE public.lms_submissions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  assignment_id uuid NOT NULL REFERENCES public.lms_assignments(id) ON DELETE CASCADE,
  student_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  submission_url text,
  student_comments text,
  marks_obtained numeric(5,2),
  faculty_feedback text,
  submitted_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  UNIQUE(assignment_id, student_id)
);
CREATE INDEX idx_lms_submissions_tenant ON public.lms_submissions(tenant_id);

-- 4. COMPLIANCE REPORTING
CREATE TABLE public.compliance_reports (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  report_type text NOT NULL, -- NAAC, AICTE, NBA, UGC
  academic_session_id uuid REFERENCES public.academic_sessions(id) ON DELETE SET NULL,
  report_data jsonb,
  generated_by uuid REFERENCES public.profiles(id) ON DELETE SET NULL,
  generated_at timestamp with time zone DEFAULT now(),
  download_url text
);
CREATE INDEX idx_compliance_reports_tenant ON public.compliance_reports(tenant_id);

-- 5. COMMUNICATION ENGINE
CREATE TABLE public.communication_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  channel text NOT NULL, -- sms, email, whatsapp
  recipient_id uuid REFERENCES public.profiles(id) ON DELETE SET NULL,
  recipient_contact text NOT NULL,
  subject text,
  message_body text NOT NULL,
  status text DEFAULT 'pending', -- pending, sent, failed
  sent_at timestamp with time zone,
  error_message text,
  created_at timestamp with time zone DEFAULT now()
);
CREATE INDEX idx_communication_logs_tenant ON public.communication_logs(tenant_id);


-- ====================================================================================================
-- ENABLE ROW LEVEL SECURITY
-- ====================================================================================================

ALTER TABLE public.placement_companies ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.placement_drives ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.placement_applications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.library_books ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.library_issues ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.lms_materials ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.lms_assignments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.lms_submissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.compliance_reports ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.communication_logs ENABLE ROW LEVEL SECURITY;

-- ====================================================================================================
-- RLS POLICIES (Tenant Isolation)
-- ====================================================================================================

-- placement_companies
CREATE POLICY tenant_isolation_placement_companies_select ON public.placement_companies FOR SELECT USING (tenant_id = (SELECT auth.jwt() ->> 'tenant_id')::uuid);
CREATE POLICY tenant_isolation_placement_companies_insert ON public.placement_companies FOR INSERT WITH CHECK (tenant_id = (SELECT auth.jwt() ->> 'tenant_id')::uuid);
CREATE POLICY tenant_isolation_placement_companies_update ON public.placement_companies FOR UPDATE USING (tenant_id = (SELECT auth.jwt() ->> 'tenant_id')::uuid);
CREATE POLICY tenant_isolation_placement_companies_delete ON public.placement_companies FOR DELETE USING (tenant_id = (SELECT auth.jwt() ->> 'tenant_id')::uuid);

-- placement_drives
CREATE POLICY tenant_isolation_placement_drives_select ON public.placement_drives FOR SELECT USING (tenant_id = (SELECT auth.jwt() ->> 'tenant_id')::uuid);
CREATE POLICY tenant_isolation_placement_drives_insert ON public.placement_drives FOR INSERT WITH CHECK (tenant_id = (SELECT auth.jwt() ->> 'tenant_id')::uuid);
CREATE POLICY tenant_isolation_placement_drives_update ON public.placement_drives FOR UPDATE USING (tenant_id = (SELECT auth.jwt() ->> 'tenant_id')::uuid);
CREATE POLICY tenant_isolation_placement_drives_delete ON public.placement_drives FOR DELETE USING (tenant_id = (SELECT auth.jwt() ->> 'tenant_id')::uuid);

-- placement_applications
CREATE POLICY tenant_isolation_placement_applications_select ON public.placement_applications FOR SELECT USING (tenant_id = (SELECT auth.jwt() ->> 'tenant_id')::uuid);
CREATE POLICY tenant_isolation_placement_applications_insert ON public.placement_applications FOR INSERT WITH CHECK (tenant_id = (SELECT auth.jwt() ->> 'tenant_id')::uuid);
CREATE POLICY tenant_isolation_placement_applications_update ON public.placement_applications FOR UPDATE USING (tenant_id = (SELECT auth.jwt() ->> 'tenant_id')::uuid);
CREATE POLICY tenant_isolation_placement_applications_delete ON public.placement_applications FOR DELETE USING (tenant_id = (SELECT auth.jwt() ->> 'tenant_id')::uuid);

-- library_books
CREATE POLICY tenant_isolation_library_books_select ON public.library_books FOR SELECT USING (tenant_id = (SELECT auth.jwt() ->> 'tenant_id')::uuid);
CREATE POLICY tenant_isolation_library_books_insert ON public.library_books FOR INSERT WITH CHECK (tenant_id = (SELECT auth.jwt() ->> 'tenant_id')::uuid);
CREATE POLICY tenant_isolation_library_books_update ON public.library_books FOR UPDATE USING (tenant_id = (SELECT auth.jwt() ->> 'tenant_id')::uuid);
CREATE POLICY tenant_isolation_library_books_delete ON public.library_books FOR DELETE USING (tenant_id = (SELECT auth.jwt() ->> 'tenant_id')::uuid);

-- library_issues
CREATE POLICY tenant_isolation_library_issues_select ON public.library_issues FOR SELECT USING (tenant_id = (SELECT auth.jwt() ->> 'tenant_id')::uuid);
CREATE POLICY tenant_isolation_library_issues_insert ON public.library_issues FOR INSERT WITH CHECK (tenant_id = (SELECT auth.jwt() ->> 'tenant_id')::uuid);
CREATE POLICY tenant_isolation_library_issues_update ON public.library_issues FOR UPDATE USING (tenant_id = (SELECT auth.jwt() ->> 'tenant_id')::uuid);
CREATE POLICY tenant_isolation_library_issues_delete ON public.library_issues FOR DELETE USING (tenant_id = (SELECT auth.jwt() ->> 'tenant_id')::uuid);

-- lms_materials
CREATE POLICY tenant_isolation_lms_materials_select ON public.lms_materials FOR SELECT USING (tenant_id = (SELECT auth.jwt() ->> 'tenant_id')::uuid);
CREATE POLICY tenant_isolation_lms_materials_insert ON public.lms_materials FOR INSERT WITH CHECK (tenant_id = (SELECT auth.jwt() ->> 'tenant_id')::uuid);
CREATE POLICY tenant_isolation_lms_materials_update ON public.lms_materials FOR UPDATE USING (tenant_id = (SELECT auth.jwt() ->> 'tenant_id')::uuid);
CREATE POLICY tenant_isolation_lms_materials_delete ON public.lms_materials FOR DELETE USING (tenant_id = (SELECT auth.jwt() ->> 'tenant_id')::uuid);

-- lms_assignments
CREATE POLICY tenant_isolation_lms_assignments_select ON public.lms_assignments FOR SELECT USING (tenant_id = (SELECT auth.jwt() ->> 'tenant_id')::uuid);
CREATE POLICY tenant_isolation_lms_assignments_insert ON public.lms_assignments FOR INSERT WITH CHECK (tenant_id = (SELECT auth.jwt() ->> 'tenant_id')::uuid);
CREATE POLICY tenant_isolation_lms_assignments_update ON public.lms_assignments FOR UPDATE USING (tenant_id = (SELECT auth.jwt() ->> 'tenant_id')::uuid);
CREATE POLICY tenant_isolation_lms_assignments_delete ON public.lms_assignments FOR DELETE USING (tenant_id = (SELECT auth.jwt() ->> 'tenant_id')::uuid);

-- lms_submissions
CREATE POLICY tenant_isolation_lms_submissions_select ON public.lms_submissions FOR SELECT USING (tenant_id = (SELECT auth.jwt() ->> 'tenant_id')::uuid);
CREATE POLICY tenant_isolation_lms_submissions_insert ON public.lms_submissions FOR INSERT WITH CHECK (tenant_id = (SELECT auth.jwt() ->> 'tenant_id')::uuid);
CREATE POLICY tenant_isolation_lms_submissions_update ON public.lms_submissions FOR UPDATE USING (tenant_id = (SELECT auth.jwt() ->> 'tenant_id')::uuid);
CREATE POLICY tenant_isolation_lms_submissions_delete ON public.lms_submissions FOR DELETE USING (tenant_id = (SELECT auth.jwt() ->> 'tenant_id')::uuid);

-- compliance_reports
CREATE POLICY tenant_isolation_compliance_reports_select ON public.compliance_reports FOR SELECT USING (tenant_id = (SELECT auth.jwt() ->> 'tenant_id')::uuid);
CREATE POLICY tenant_isolation_compliance_reports_insert ON public.compliance_reports FOR INSERT WITH CHECK (tenant_id = (SELECT auth.jwt() ->> 'tenant_id')::uuid);
CREATE POLICY tenant_isolation_compliance_reports_update ON public.compliance_reports FOR UPDATE USING (tenant_id = (SELECT auth.jwt() ->> 'tenant_id')::uuid);
CREATE POLICY tenant_isolation_compliance_reports_delete ON public.compliance_reports FOR DELETE USING (tenant_id = (SELECT auth.jwt() ->> 'tenant_id')::uuid);

-- communication_logs
CREATE POLICY tenant_isolation_communication_logs_select ON public.communication_logs FOR SELECT USING (tenant_id = (SELECT auth.jwt() ->> 'tenant_id')::uuid);
CREATE POLICY tenant_isolation_communication_logs_insert ON public.communication_logs FOR INSERT WITH CHECK (tenant_id = (SELECT auth.jwt() ->> 'tenant_id')::uuid);
CREATE POLICY tenant_isolation_communication_logs_update ON public.communication_logs FOR UPDATE USING (tenant_id = (SELECT auth.jwt() ->> 'tenant_id')::uuid);
CREATE POLICY tenant_isolation_communication_logs_delete ON public.communication_logs FOR DELETE USING (tenant_id = (SELECT auth.jwt() ->> 'tenant_id')::uuid);


-- ====================================================================================================
-- REALTIME REPLICATION
-- ====================================================================================================

-- Add tables to the supabase_realtime publication
ALTER PUBLICATION supabase_realtime ADD TABLE public.placement_companies;
ALTER PUBLICATION supabase_realtime ADD TABLE public.placement_drives;
ALTER PUBLICATION supabase_realtime ADD TABLE public.placement_applications;
ALTER PUBLICATION supabase_realtime ADD TABLE public.library_books;
ALTER PUBLICATION supabase_realtime ADD TABLE public.library_issues;
ALTER PUBLICATION supabase_realtime ADD TABLE public.lms_materials;
ALTER PUBLICATION supabase_realtime ADD TABLE public.lms_assignments;
ALTER PUBLICATION supabase_realtime ADD TABLE public.lms_submissions;
ALTER PUBLICATION supabase_realtime ADD TABLE public.communication_logs;
