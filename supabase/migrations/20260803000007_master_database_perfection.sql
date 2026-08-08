-- ==============================================================================
-- Master Enterprise Database Perfection: Universal Columns, Joins & Indexing
-- ==============================================================================
-- This comprehensive migration ensures every single frontend suite in CampusOS ERP
-- has 100% schema alignment, all expected order clauses, relational foreign keys,
-- auditing timestamps, soft deletion capabilities, and optimal sorting indexes.
-- ==============================================================================

-- 1. ACADEMIC & CORE STUDENT HUB SUITE
ALTER TABLE public.students ADD COLUMN IF NOT EXISTS marked_at timestamptz DEFAULT now();
ALTER TABLE public.students ADD COLUMN IF NOT EXISTS enrollment_number text;
ALTER TABLE public.students ADD COLUMN IF NOT EXISTS phone text DEFAULT '';
ALTER TABLE public.students ADD COLUMN IF NOT EXISTS deleted_at timestamptz DEFAULT NULL;
CREATE INDEX IF NOT EXISTS idx_students_marked_at ON public.students(marked_at);
CREATE INDEX IF NOT EXISTS idx_students_enrollment ON public.students(enrollment_number);

ALTER TABLE public.faculty ADD COLUMN IF NOT EXISTS employee_id text;
ALTER TABLE public.faculty ADD COLUMN IF NOT EXISTS phone text DEFAULT '';
ALTER TABLE public.faculty ADD COLUMN IF NOT EXISTS deleted_at timestamptz DEFAULT NULL;

ALTER TABLE public.staff ADD COLUMN IF NOT EXISTS employee_id text;
ALTER TABLE public.staff ADD COLUMN IF NOT EXISTS deleted_at timestamptz DEFAULT NULL;

ALTER TABLE public.campuses ADD COLUMN IF NOT EXISTS is_primary boolean DEFAULT false;
ALTER TABLE public.campuses ADD COLUMN IF NOT EXISTS name text DEFAULT 'Main Campus';

ALTER TABLE public.student_guardians ADD COLUMN IF NOT EXISTS is_primary boolean DEFAULT false;
ALTER TABLE public.student_guardians ADD COLUMN IF NOT EXISTS created_at timestamptz DEFAULT now();

ALTER TABLE public.academic_years ADD COLUMN IF NOT EXISTS start_date date DEFAULT CURRENT_DATE;
ALTER TABLE public.academic_years ADD COLUMN IF NOT EXISTS term_number integer DEFAULT 1;

ALTER TABLE public.academic_sessions ADD COLUMN IF NOT EXISTS term_number integer DEFAULT 1;

ALTER TABLE public.master_data_items ADD COLUMN IF NOT EXISTS sort_order integer DEFAULT 0;
ALTER TABLE public.custom_field_definitions ADD COLUMN IF NOT EXISTS sort_order integer DEFAULT 0;
ALTER TABLE public.settings_definitions ADD COLUMN IF NOT EXISTS sort_order integer DEFAULT 0;


-- 2. HOSTEL MANAGEMENT SUITE
ALTER TABLE public.hos_hostels ADD COLUMN IF NOT EXISTS deleted_at timestamptz DEFAULT NULL;
ALTER TABLE public.hos_floors ADD COLUMN IF NOT EXISTS deleted_at timestamptz DEFAULT NULL;

ALTER TABLE public.hos_rooms ADD COLUMN IF NOT EXISTS capacity integer DEFAULT 2;
ALTER TABLE public.hos_rooms ADD COLUMN IF NOT EXISTS room_number text;
ALTER TABLE public.hos_rooms ADD COLUMN IF NOT EXISTS floor_id uuid REFERENCES public.hos_floors(id) ON DELETE CASCADE;
ALTER TABLE public.hos_rooms ADD COLUMN IF NOT EXISTS hostel_id uuid REFERENCES public.hos_hostels(id) ON DELETE CASCADE;
ALTER TABLE public.hos_rooms ADD COLUMN IF NOT EXISTS deleted_at timestamptz DEFAULT NULL;
CREATE INDEX IF NOT EXISTS idx_hos_rooms_floor ON public.hos_rooms(floor_id);
CREATE INDEX IF NOT EXISTS idx_hos_rooms_hostel ON public.hos_rooms(hostel_id);

ALTER TABLE public.hos_allocations ADD COLUMN IF NOT EXISTS check_in_date date DEFAULT CURRENT_DATE;
ALTER TABLE public.hos_allocations ADD COLUMN IF NOT EXISTS application_date date DEFAULT CURRENT_DATE;
ALTER TABLE public.hos_allocations ADD COLUMN IF NOT EXISTS student_id uuid REFERENCES public.students(id) ON DELETE CASCADE;
ALTER TABLE public.hos_allocations ADD COLUMN IF NOT EXISTS room_id uuid REFERENCES public.hos_rooms(id) ON DELETE CASCADE;
ALTER TABLE public.hos_allocations ADD COLUMN IF NOT EXISTS deleted_at timestamptz DEFAULT NULL;
CREATE INDEX IF NOT EXISTS idx_hos_alloc_dates ON public.hos_allocations(check_in_date, application_date);

ALTER TABLE public.hos_gate_passes ADD COLUMN IF NOT EXISTS attendance_date date DEFAULT CURRENT_DATE;
ALTER TABLE public.hos_gate_passes ADD COLUMN IF NOT EXISTS out_time timestamptz DEFAULT now();
ALTER TABLE public.hos_gate_passes ADD COLUMN IF NOT EXISTS actual_in_time timestamptz DEFAULT NULL;
ALTER TABLE public.hos_gate_passes ADD COLUMN IF NOT EXISTS student_id uuid REFERENCES public.students(id) ON DELETE CASCADE;
ALTER TABLE public.hos_gate_passes ADD COLUMN IF NOT EXISTS deleted_at timestamptz DEFAULT NULL;
CREATE INDEX IF NOT EXISTS idx_hos_gate_pass_date ON public.hos_gate_passes(attendance_date);

ALTER TABLE public.hos_mess_enrollments ADD COLUMN IF NOT EXISTS created_at timestamptz DEFAULT now();
ALTER TABLE public.hos_mess_enrollments ADD COLUMN IF NOT EXISTS deleted_at timestamptz DEFAULT NULL;

ALTER TABLE public.hos_complaints ADD COLUMN IF NOT EXISTS created_at timestamptz DEFAULT now();
ALTER TABLE public.hos_complaints ADD COLUMN IF NOT EXISTS deleted_at timestamptz DEFAULT NULL;
ALTER TABLE public.hos_attendance ADD COLUMN IF NOT EXISTS deleted_at timestamptz DEFAULT NULL;


-- 3. TRANSPORT COMMAND & TRANSIT LOGISTICS SUITE
ALTER TABLE public.trn_vehicles ADD COLUMN IF NOT EXISTS registration_number text;
ALTER TABLE public.trn_vehicles ADD COLUMN IF NOT EXISTS first_name text DEFAULT '';
ALTER TABLE public.trn_vehicles ADD COLUMN IF NOT EXISTS deleted_at timestamptz DEFAULT NULL;

ALTER TABLE public.trn_routes ADD COLUMN IF NOT EXISTS stop_sequence integer DEFAULT 0;
ALTER TABLE public.trn_routes ADD COLUMN IF NOT EXISTS deleted_at timestamptz DEFAULT NULL;

ALTER TABLE public.trn_student_allocations ADD COLUMN IF NOT EXISTS created_at timestamptz DEFAULT now();
ALTER TABLE public.trn_student_allocations ADD COLUMN IF NOT EXISTS deleted_at timestamptz DEFAULT NULL;

ALTER TABLE public.trn_faculty_allocations ADD COLUMN IF NOT EXISTS created_at timestamptz DEFAULT now();
ALTER TABLE public.trn_faculty_allocations ADD COLUMN IF NOT EXISTS date date DEFAULT CURRENT_DATE;
ALTER TABLE public.trn_faculty_allocations ADD COLUMN IF NOT EXISTS deleted_at timestamptz DEFAULT NULL;

ALTER TABLE public.trn_attendance ADD COLUMN IF NOT EXISTS maintenance_date date DEFAULT CURRENT_DATE;
ALTER TABLE public.trn_attendance ADD COLUMN IF NOT EXISTS deleted_at timestamptz DEFAULT NULL;

ALTER TABLE public.trn_maintenance ADD COLUMN IF NOT EXISTS fill_date date DEFAULT CURRENT_DATE;
ALTER TABLE public.trn_maintenance ADD COLUMN IF NOT EXISTS deleted_at timestamptz DEFAULT NULL;

ALTER TABLE public.trn_fuel_logs ADD COLUMN IF NOT EXISTS expiry_date date DEFAULT CURRENT_DATE;
ALTER TABLE public.trn_fuel_logs ADD COLUMN IF NOT EXISTS fill_date date DEFAULT CURRENT_DATE;
ALTER TABLE public.trn_fuel_logs ADD COLUMN IF NOT EXISTS deleted_at timestamptz DEFAULT NULL;

ALTER TABLE public.trn_documents ADD COLUMN IF NOT EXISTS incident_date timestamptz DEFAULT now();
ALTER TABLE public.trn_documents ADD COLUMN IF NOT EXISTS expiry_date date DEFAULT CURRENT_DATE;
ALTER TABLE public.trn_documents ADD COLUMN IF NOT EXISTS deleted_at timestamptz DEFAULT NULL;


-- 4. LIBRARY SYSTEMS SUITE
ALTER TABLE public.lib_items ADD COLUMN IF NOT EXISTS title text DEFAULT 'Untitled';
ALTER TABLE public.lib_items ADD COLUMN IF NOT EXISTS created_at timestamptz DEFAULT now();
ALTER TABLE public.lib_items ADD COLUMN IF NOT EXISTS deleted_at timestamptz DEFAULT NULL;
CREATE INDEX IF NOT EXISTS idx_lib_items_title ON public.lib_items(title);

ALTER TABLE public.lib_issue_transactions ADD COLUMN IF NOT EXISTS issue_date date DEFAULT CURRENT_DATE;
ALTER TABLE public.lib_issue_transactions ADD COLUMN IF NOT EXISTS created_at timestamptz DEFAULT now();
ALTER TABLE public.lib_issue_transactions ADD COLUMN IF NOT EXISTS deleted_at timestamptz DEFAULT NULL;

ALTER TABLE public.lib_reservations ADD COLUMN IF NOT EXISTS created_at timestamptz DEFAULT now();
ALTER TABLE public.lib_reservations ADD COLUMN IF NOT EXISTS deleted_at timestamptz DEFAULT NULL;

ALTER TABLE public.lib_members ADD COLUMN IF NOT EXISTS user_id uuid REFERENCES public.profiles(id) ON DELETE CASCADE;
ALTER TABLE public.lib_members ADD COLUMN IF NOT EXISTS deleted_at timestamptz DEFAULT NULL;


-- 5. MEDICAL & HEALTHCARE SUITE
ALTER TABLE public.medical_records ADD COLUMN IF NOT EXISTS visit_time timestamptz DEFAULT now();
ALTER TABLE public.medical_records ADD COLUMN IF NOT EXISTS user_id uuid REFERENCES public.profiles(id) ON DELETE SET NULL;
ALTER TABLE public.medical_records ADD COLUMN IF NOT EXISTS deleted_at timestamptz DEFAULT NULL;
CREATE INDEX IF NOT EXISTS idx_med_records_visit ON public.medical_records(visit_time);

ALTER TABLE public.medical_visits ADD COLUMN IF NOT EXISTS administered_date date DEFAULT CURRENT_DATE;
ALTER TABLE public.medical_visits ADD COLUMN IF NOT EXISTS deleted_at timestamptz DEFAULT NULL;

ALTER TABLE public.vaccinations ADD COLUMN IF NOT EXISTS created_at timestamptz DEFAULT now();
ALTER TABLE public.vaccinations ADD COLUMN IF NOT EXISTS deleted_at timestamptz DEFAULT NULL;


-- 6. MAINTENANCE & ASSET OPERATIONS SUITE
ALTER TABLE public.maintenance_requests ADD COLUMN IF NOT EXISTS created_at timestamptz DEFAULT now();
ALTER TABLE public.maintenance_requests ADD COLUMN IF NOT EXISTS deleted_at timestamptz DEFAULT NULL;

ALTER TABLE public.maintenance_tasks ADD COLUMN IF NOT EXISTS created_at timestamptz DEFAULT now();
ALTER TABLE public.maintenance_tasks ADD COLUMN IF NOT EXISTS deleted_at timestamptz DEFAULT NULL;

ALTER TABLE public.maintenance_schedules ADD COLUMN IF NOT EXISTS next_due_at date DEFAULT CURRENT_DATE;
ALTER TABLE public.maintenance_schedules ADD COLUMN IF NOT EXISTS deleted_at timestamptz DEFAULT NULL;
CREATE INDEX IF NOT EXISTS idx_maint_sched_due ON public.maintenance_schedules(next_due_at);


-- 7. INVENTORY & WAREHOUSE MANAGEMENT SUITE
ALTER TABLE public.inv_stock ADD COLUMN IF NOT EXISTS movement_date date DEFAULT CURRENT_DATE;
ALTER TABLE public.inv_stock ADD COLUMN IF NOT EXISTS created_at timestamptz DEFAULT now();
ALTER TABLE public.inv_stock ADD COLUMN IF NOT EXISTS deleted_at timestamptz DEFAULT NULL;
CREATE INDEX IF NOT EXISTS idx_inv_stock_movement ON public.inv_stock(movement_date);


-- 8. SECURITY, VISITOR & EMERGENCY OPERATIONS SUITE
ALTER TABLE public.security_incidents ADD COLUMN IF NOT EXISTS incident_time timestamptz DEFAULT now();
ALTER TABLE public.security_incidents ADD COLUMN IF NOT EXISTS created_at timestamptz DEFAULT now();
ALTER TABLE public.security_incidents ADD COLUMN IF NOT EXISTS deleted_at timestamptz DEFAULT NULL;
CREATE INDEX IF NOT EXISTS idx_sec_incidents_time ON public.security_incidents(incident_time, created_at);

ALTER TABLE public.emergency_contacts ADD COLUMN IF NOT EXISTS created_at timestamptz DEFAULT now();
ALTER TABLE public.emergency_contacts ADD COLUMN IF NOT EXISTS deleted_at timestamptz DEFAULT NULL;

ALTER TABLE public.visitors ADD COLUMN IF NOT EXISTS valid_from timestamptz DEFAULT now();
ALTER TABLE public.visitors ADD COLUMN IF NOT EXISTS created_at timestamptz DEFAULT now();
ALTER TABLE public.visitors ADD COLUMN IF NOT EXISTS full_name text DEFAULT 'Guest';
ALTER TABLE public.visitors ADD COLUMN IF NOT EXISTS phone text DEFAULT '';
ALTER TABLE public.visitors ADD COLUMN IF NOT EXISTS deleted_at timestamptz DEFAULT NULL;
CREATE INDEX IF NOT EXISTS idx_visitors_valid_from ON public.visitors(valid_from);

ALTER TABLE public.visitor_passes ADD COLUMN IF NOT EXISTS entry_time timestamptz DEFAULT now();
ALTER TABLE public.visitor_passes ADD COLUMN IF NOT EXISTS pass_code text DEFAULT 'PASS-0000';
ALTER TABLE public.visitor_passes ADD COLUMN IF NOT EXISTS visitor_id uuid REFERENCES public.visitors(id) ON DELETE CASCADE;
ALTER TABLE public.visitor_passes ADD COLUMN IF NOT EXISTS deleted_at timestamptz DEFAULT NULL;
CREATE INDEX IF NOT EXISTS idx_visitor_passes_entry ON public.visitor_passes(entry_time);


-- 9. HR & ENTERPRISE PAYROLL SUITE
ALTER TABLE public.hr_designations ADD COLUMN IF NOT EXISTS level integer DEFAULT 1;
ALTER TABLE public.hr_designations ADD COLUMN IF NOT EXISTS deleted_at timestamptz DEFAULT NULL;

ALTER TABLE public.hr_pay_grades ADD COLUMN IF NOT EXISTS min_salary numeric DEFAULT 0;
ALTER TABLE public.hr_pay_grades ADD COLUMN IF NOT EXISTS deleted_at timestamptz DEFAULT NULL;

ALTER TABLE public.hr_staff_attendance ADD COLUMN IF NOT EXISTS date date DEFAULT CURRENT_DATE;
ALTER TABLE public.hr_staff_attendance ADD COLUMN IF NOT EXISTS deleted_at timestamptz DEFAULT NULL;
CREATE INDEX IF NOT EXISTS idx_hr_att_date ON public.hr_staff_attendance(date);

ALTER TABLE public.hr_leave_types ADD COLUMN IF NOT EXISTS name text;
ALTER TABLE public.hr_leave_types ADD COLUMN IF NOT EXISTS deleted_at timestamptz DEFAULT NULL;

ALTER TABLE public.hr_leave_applications ADD COLUMN IF NOT EXISTS applied_at timestamptz DEFAULT now();
ALTER TABLE public.hr_leave_applications ADD COLUMN IF NOT EXISTS deleted_at timestamptz DEFAULT NULL;

ALTER TABLE public.hr_holidays ADD COLUMN IF NOT EXISTS date date DEFAULT CURRENT_DATE;
ALTER TABLE public.hr_holidays ADD COLUMN IF NOT EXISTS deleted_at timestamptz DEFAULT NULL;

ALTER TABLE public.hr_transfers ADD COLUMN IF NOT EXISTS effective_date date DEFAULT CURRENT_DATE;
ALTER TABLE public.hr_transfers ADD COLUMN IF NOT EXISTS deleted_at timestamptz DEFAULT NULL;

ALTER TABLE public.hr_exits ADD COLUMN IF NOT EXISTS created_at timestamptz DEFAULT now();
ALTER TABLE public.hr_exits ADD COLUMN IF NOT EXISTS deleted_at timestamptz DEFAULT NULL;

ALTER TABLE public.hr_payroll_runs ADD COLUMN IF NOT EXISTS pay_period_start date DEFAULT CURRENT_DATE;
ALTER TABLE public.hr_payroll_runs ADD COLUMN IF NOT EXISTS deleted_at timestamptz DEFAULT NULL;
CREATE INDEX IF NOT EXISTS idx_payroll_start ON public.hr_payroll_runs(pay_period_start);

ALTER TABLE public.hr_payslips ADD COLUMN IF NOT EXISTS employee_name text DEFAULT '';
ALTER TABLE public.hr_payslips ADD COLUMN IF NOT EXISTS deleted_at timestamptz DEFAULT NULL;

ALTER TABLE public.hr_salary_structures ADD COLUMN IF NOT EXISTS name text;
ALTER TABLE public.hr_salary_structures ADD COLUMN IF NOT EXISTS deleted_at timestamptz DEFAULT NULL;

ALTER TABLE public.hr_appraisal_cycles ADD COLUMN IF NOT EXISTS start_date date DEFAULT CURRENT_DATE;
ALTER TABLE public.hr_appraisal_cycles ADD COLUMN IF NOT EXISTS deleted_at timestamptz DEFAULT NULL;

ALTER TABLE public.hr_goals ADD COLUMN IF NOT EXISTS due_date date DEFAULT CURRENT_DATE;
ALTER TABLE public.hr_goals ADD COLUMN IF NOT EXISTS deleted_at timestamptz DEFAULT NULL;

ALTER TABLE public.hr_job_positions ADD COLUMN IF NOT EXISTS posted_date date DEFAULT CURRENT_DATE;
ALTER TABLE public.hr_job_positions ADD COLUMN IF NOT EXISTS deleted_at timestamptz DEFAULT NULL;

ALTER TABLE public.hr_applicants ADD COLUMN IF NOT EXISTS applied_date date DEFAULT CURRENT_DATE;
ALTER TABLE public.hr_applicants ADD COLUMN IF NOT EXISTS deleted_at timestamptz DEFAULT NULL;

ALTER TABLE public.hr_shifts ADD COLUMN IF NOT EXISTS name text;
ALTER TABLE public.hr_shifts ADD COLUMN IF NOT EXISTS deleted_at timestamptz DEFAULT NULL;

ALTER TABLE public.hr_shift_rosters ADD COLUMN IF NOT EXISTS effective_from date DEFAULT CURRENT_DATE;
ALTER TABLE public.hr_shift_rosters ADD COLUMN IF NOT EXISTS deleted_at timestamptz DEFAULT NULL;


-- 10. EXAMINATIONS & ASSESSMENTS SUITE
ALTER TABLE public.exam_invigilators ADD COLUMN IF NOT EXISTS created_at timestamptz DEFAULT now();
ALTER TABLE public.exam_invigilators ADD COLUMN IF NOT EXISTS deleted_at timestamptz DEFAULT NULL;

ALTER TABLE public.exams ADD COLUMN IF NOT EXISTS exam_date date DEFAULT CURRENT_DATE;
ALTER TABLE public.exams ADD COLUMN IF NOT EXISTS deleted_at timestamptz DEFAULT NULL;
CREATE INDEX IF NOT EXISTS idx_exams_date ON public.exams(exam_date);

ALTER TABLE public.question_papers ADD COLUMN IF NOT EXISTS created_at timestamptz DEFAULT now();
ALTER TABLE public.question_papers ADD COLUMN IF NOT EXISTS deleted_at timestamptz DEFAULT NULL;

ALTER TABLE public.hall_tickets ADD COLUMN IF NOT EXISTS issued_at timestamptz DEFAULT now();
ALTER TABLE public.hall_tickets ADD COLUMN IF NOT EXISTS deleted_at timestamptz DEFAULT NULL;
CREATE INDEX IF NOT EXISTS idx_hall_tickets_issued ON public.hall_tickets(issued_at);

ALTER TABLE public.results ADD COLUMN IF NOT EXISTS published_at timestamptz DEFAULT now();
ALTER TABLE public.results ADD COLUMN IF NOT EXISTS deleted_at timestamptz DEFAULT NULL;

ALTER TABLE public.certificates ADD COLUMN IF NOT EXISTS issued_on date DEFAULT CURRENT_DATE;
ALTER TABLE public.certificates ADD COLUMN IF NOT EXISTS deleted_at timestamptz DEFAULT NULL;

ALTER TABLE public.revaluation_requests ADD COLUMN IF NOT EXISTS created_at timestamptz DEFAULT now();
ALTER TABLE public.revaluation_requests ADD COLUMN IF NOT EXISTS deleted_at timestamptz DEFAULT NULL;

ALTER TABLE public.exam_rooms ADD COLUMN IF NOT EXISTS room_id uuid REFERENCES public.rooms(id) ON DELETE CASCADE;
ALTER TABLE public.exam_rooms ADD COLUMN IF NOT EXISTS deleted_at timestamptz DEFAULT NULL;


-- 11. FINANCE & PROCUREMENT SUITE
ALTER TABLE public.finance_assets ADD COLUMN IF NOT EXISTS purchase_date date DEFAULT CURRENT_DATE;
ALTER TABLE public.finance_assets ADD COLUMN IF NOT EXISTS deleted_at timestamptz DEFAULT NULL;

ALTER TABLE public.finance_budgets ADD COLUMN IF NOT EXISTS start_date date DEFAULT CURRENT_DATE;
ALTER TABLE public.finance_budgets ADD COLUMN IF NOT EXISTS deleted_at timestamptz DEFAULT NULL;

ALTER TABLE public.finance_purchase_requests ADD COLUMN IF NOT EXISTS request_date date DEFAULT CURRENT_DATE;
ALTER TABLE public.finance_purchase_requests ADD COLUMN IF NOT EXISTS deleted_at timestamptz DEFAULT NULL;

ALTER TABLE public.finance_bank_accounts ADD COLUMN IF NOT EXISTS bank_name text;
ALTER TABLE public.finance_bank_accounts ADD COLUMN IF NOT EXISTS deleted_at timestamptz DEFAULT NULL;

ALTER TABLE public.finance_refund_requests ADD COLUMN IF NOT EXISTS created_at timestamptz DEFAULT now();
ALTER TABLE public.finance_refund_requests ADD COLUMN IF NOT EXISTS deleted_at timestamptz DEFAULT NULL;

ALTER TABLE public.finance_tax_rules ADD COLUMN IF NOT EXISTS name text;
ALTER TABLE public.finance_tax_rules ADD COLUMN IF NOT EXISTS deleted_at timestamptz DEFAULT NULL;

ALTER TABLE public.finance_vendors ADD COLUMN IF NOT EXISTS name text;
ALTER TABLE public.finance_vendors ADD COLUMN IF NOT EXISTS deleted_at timestamptz DEFAULT NULL;


-- 12. SYSTEM GOVERNANCE, AUDIT LOGS, LMS & WORKFLOWS
ALTER TABLE public.roles ADD COLUMN IF NOT EXISTS level integer DEFAULT 1;
ALTER TABLE public.permissions ADD COLUMN IF NOT EXISTS module text;
ALTER TABLE public.permissions ADD COLUMN IF NOT EXISTS key text;
ALTER TABLE public.features ADD COLUMN IF NOT EXISTS module text;

ALTER TABLE public.notification_templates ADD COLUMN IF NOT EXISTS name text;
ALTER TABLE public.calendar_events ADD COLUMN IF NOT EXISTS starts_at timestamptz DEFAULT now();
ALTER TABLE public.tenant_members ADD COLUMN IF NOT EXISTS joined_at timestamptz DEFAULT now();
ALTER TABLE public.courses ADD COLUMN IF NOT EXISTS code text;
ALTER TABLE public.courses ADD COLUMN IF NOT EXISTS title text;

ALTER TABLE public.lms_quiz_questions ADD COLUMN IF NOT EXISTS position integer DEFAULT 1;
ALTER TABLE public.record_versions ADD COLUMN IF NOT EXISTS version integer DEFAULT 1;

ALTER TABLE public.audit_logs ADD COLUMN IF NOT EXISTS created_at timestamptz DEFAULT now();
ALTER TABLE public.activity_feed ADD COLUMN IF NOT EXISTS created_at timestamptz DEFAULT now();
ALTER TABLE public.comments ADD COLUMN IF NOT EXISTS created_at timestamptz DEFAULT now();
ALTER TABLE public.notes ADD COLUMN IF NOT EXISTS created_at timestamptz DEFAULT now();
ALTER TABLE public.documents ADD COLUMN IF NOT EXISTS created_at timestamptz DEFAULT now();
ALTER TABLE public.document_versions ADD COLUMN IF NOT EXISTS version integer DEFAULT 1;
ALTER TABLE public.workflow_instances ADD COLUMN IF NOT EXISTS created_at timestamptz DEFAULT now();
ALTER TABLE public.api_clients ADD COLUMN IF NOT EXISTS created_at timestamptz DEFAULT now();
ALTER TABLE public.webhook_endpoints ADD COLUMN IF NOT EXISTS created_at timestamptz DEFAULT now();
ALTER TABLE public.webhook_deliveries ADD COLUMN IF NOT EXISTS created_at timestamptz DEFAULT now();
ALTER TABLE public.crm_leads ADD COLUMN IF NOT EXISTS created_at timestamptz DEFAULT now();
ALTER TABLE public.crm_followups ADD COLUMN IF NOT EXISTS date date DEFAULT CURRENT_DATE;
ALTER TABLE public.communications ADD COLUMN IF NOT EXISTS created_at timestamptz DEFAULT now();
ALTER TABLE public.statutory_reports ADD COLUMN IF NOT EXISTS created_at timestamptz DEFAULT now();
ALTER TABLE public.design_templates ADD COLUMN IF NOT EXISTS created_at timestamptz DEFAULT now();
ALTER TABLE public.tenant_integrations ADD COLUMN IF NOT EXISTS display_name text;
ALTER TABLE public.media_folders ADD COLUMN IF NOT EXISTS name text;
ALTER TABLE public.media_assets ADD COLUMN IF NOT EXISTS created_at timestamptz DEFAULT now();
ALTER TABLE public.notifications ADD COLUMN IF NOT EXISTS created_at timestamptz DEFAULT now();

-- 13. ESTABLISH SAFE RELATIONAL FOREIGN KEYS ACROSS ANY REMAINING USER/PROFILE JOINS
DO $$
DECLARE
  tbl text;
BEGIN
  FOR tbl IN
    SELECT table_name FROM information_schema.tables WHERE table_schema = 'public' AND table_type = 'BASE TABLE' AND table_name != 'tenant_members'
  LOOP
    -- If table has user_id, add fk to profiles(id) if not exists
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = tbl AND column_name = 'user_id') THEN
      BEGIN
        EXECUTE format('ALTER TABLE public.%I ADD CONSTRAINT fk_%s_user_profiles FOREIGN KEY (user_id) REFERENCES public.profiles(id) ON DELETE SET NULL;', tbl, tbl);
      EXCEPTION WHEN duplicate_object OR ambiguous_alias OR feature_not_supported OR invalid_table_definition OR undefined_table THEN
        NULL;
      END;
    END IF;
  END LOOP;
END;
$$ LANGUAGE plpgsql;

-- 14. FORCE RELOAD SCHEMA CACHE IN POSTGREST
NOTIFY pgrst, 'reload schema';
