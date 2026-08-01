-- ============================================================================
-- HRMS: Complete Enterprise Human Resource Management System
-- Migration: 20260801090000_hrms.sql
-- Extends: public.staff, public.faculty, public.departments, public.workflows
-- ============================================================================

-- ============================================================================
-- ENUMS
-- ============================================================================
CREATE TYPE public.hr_employment_category AS ENUM ('teaching', 'non_teaching', 'administrative', 'management', 'support');
CREATE TYPE public.hr_leave_status AS ENUM ('pending', 'approved', 'rejected', 'cancelled', 'withdrawn');
CREATE TYPE public.hr_leave_basis AS ENUM ('days', 'hours');
CREATE TYPE public.hr_payroll_run_status AS ENUM ('draft', 'processing', 'processed', 'approved', 'paid', 'cancelled');
CREATE TYPE public.hr_appraisal_status AS ENUM ('draft', 'self_review', 'manager_review', 'hr_review', 'completed', 'cancelled');
CREATE TYPE public.hr_recruitment_stage AS ENUM ('applied', 'screening', 'interview', 'offer', 'hired', 'rejected', 'withdrawn');
CREATE TYPE public.hr_loan_status AS ENUM ('pending', 'approved', 'active', 'closed', 'rejected');
CREATE TYPE public.hr_transfer_type AS ENUM ('department', 'campus', 'designation', 'reporting_manager');
CREATE TYPE public.hr_salary_component_type AS ENUM ('earning', 'deduction', 'statutory');

-- ============================================================================
-- 1. EMPLOYEE EXTENSIONS
-- ============================================================================

CREATE TABLE public.hr_designations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  name text NOT NULL,
  code text NOT NULL,
  category public.hr_employment_category NOT NULL DEFAULT 'non_teaching',
  level integer NOT NULL DEFAULT 1,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  created_by uuid, updated_by uuid, deleted_at timestamptz, deleted_by uuid,
  UNIQUE (tenant_id, code)
);

CREATE TABLE public.hr_pay_grades (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  name text NOT NULL,
  code text NOT NULL,
  min_salary numeric(12,2) NOT NULL DEFAULT 0,
  max_salary numeric(12,2) NOT NULL DEFAULT 0,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  created_by uuid, updated_by uuid, deleted_at timestamptz, deleted_by uuid,
  UNIQUE (tenant_id, code)
);

CREATE TABLE public.hr_employee_qualifications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  staff_id uuid REFERENCES public.staff(id) ON DELETE CASCADE,
  faculty_id uuid REFERENCES public.faculty(id) ON DELETE CASCADE,
  degree text NOT NULL,
  field_of_study text,
  institution text NOT NULL,
  year_of_passing integer,
  percentage numeric(5,2),
  is_verified boolean NOT NULL DEFAULT false,
  document_url text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  created_by uuid, updated_by uuid, deleted_at timestamptz, deleted_by uuid
);

CREATE TABLE public.hr_employee_experience (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  staff_id uuid REFERENCES public.staff(id) ON DELETE CASCADE,
  faculty_id uuid REFERENCES public.faculty(id) ON DELETE CASCADE,
  organization text NOT NULL,
  designation text,
  from_date date NOT NULL,
  to_date date,
  is_current boolean NOT NULL DEFAULT false,
  description text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  created_by uuid, updated_by uuid, deleted_at timestamptz, deleted_by uuid
);

CREATE TABLE public.hr_employee_skills (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  staff_id uuid REFERENCES public.staff(id) ON DELETE CASCADE,
  faculty_id uuid REFERENCES public.faculty(id) ON DELETE CASCADE,
  skill text NOT NULL,
  proficiency text NOT NULL DEFAULT 'intermediate', -- beginner/intermediate/expert
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  created_by uuid, updated_by uuid, deleted_at timestamptz, deleted_by uuid
);

CREATE TABLE public.hr_employee_extensions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  staff_id uuid REFERENCES public.staff(id) ON DELETE CASCADE,
  faculty_id uuid REFERENCES public.faculty(id) ON DELETE CASCADE,
  designation_id uuid REFERENCES public.hr_designations(id) ON DELETE SET NULL,
  pay_grade_id uuid REFERENCES public.hr_pay_grades(id) ON DELETE SET NULL,
  reporting_manager_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  confirmation_date date,
  probation_end_date date,
  notice_period_days integer NOT NULL DEFAULT 30,
  pan_number text,
  aadhaar_number text,
  uan_number text,
  pf_number text,
  esi_number text,
  bank_account_number text,
  bank_name text,
  bank_ifsc text,
  emergency_contact_name text,
  emergency_contact_phone text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  created_by uuid, updated_by uuid, deleted_at timestamptz, deleted_by uuid
);

-- ============================================================================
-- 2. RECRUITMENT
-- ============================================================================

CREATE TABLE public.hr_job_positions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  department_id uuid REFERENCES public.departments(id) ON DELETE CASCADE,
  designation_id uuid REFERENCES public.hr_designations(id) ON DELETE SET NULL,
  title text NOT NULL,
  description text,
  requirements text,
  openings integer NOT NULL DEFAULT 1,
  employment_type public.employment_type NOT NULL DEFAULT 'full_time',
  status text NOT NULL DEFAULT 'open', -- open/closed/on_hold
  posted_date date,
  closing_date date,
  salary_min numeric(12,2),
  salary_max numeric(12,2),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  created_by uuid, updated_by uuid, deleted_at timestamptz, deleted_by uuid
);

CREATE TABLE public.hr_applicants (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  job_position_id uuid NOT NULL REFERENCES public.hr_job_positions(id) ON DELETE CASCADE,
  first_name text NOT NULL,
  last_name text,
  email text NOT NULL,
  phone text,
  resume_url text,
  cover_letter text,
  stage public.hr_recruitment_stage NOT NULL DEFAULT 'applied',
  source text, -- 'linkedin', 'referral', 'direct', etc.
  applied_date date NOT NULL DEFAULT CURRENT_DATE,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  created_by uuid, updated_by uuid, deleted_at timestamptz, deleted_by uuid
);

CREATE TABLE public.hr_interviews (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  applicant_id uuid NOT NULL REFERENCES public.hr_applicants(id) ON DELETE CASCADE,
  round_number integer NOT NULL DEFAULT 1,
  interview_type text NOT NULL DEFAULT 'in_person', -- 'in_person'/'video'/'phone'
  scheduled_at timestamptz NOT NULL,
  duration_minutes integer NOT NULL DEFAULT 60,
  interviewer_ids uuid[] NOT NULL DEFAULT '{}',
  status text NOT NULL DEFAULT 'scheduled', -- scheduled/completed/cancelled/no_show
  feedback text,
  rating integer CHECK (rating >= 1 AND rating <= 5),
  recommendation text, -- 'proceed'/'reject'/'hold'
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  created_by uuid, updated_by uuid, deleted_at timestamptz, deleted_by uuid
);

CREATE TABLE public.hr_offer_letters (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  applicant_id uuid NOT NULL REFERENCES public.hr_applicants(id) ON DELETE CASCADE,
  job_position_id uuid NOT NULL REFERENCES public.hr_job_positions(id) ON DELETE CASCADE,
  offer_date date NOT NULL DEFAULT CURRENT_DATE,
  expiry_date date,
  offered_salary numeric(12,2) NOT NULL,
  joining_date date,
  status text NOT NULL DEFAULT 'draft', -- draft/sent/accepted/rejected/expired
  document_url text,
  workflow_instance_id uuid REFERENCES public.workflow_instances(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  created_by uuid, updated_by uuid, deleted_at timestamptz, deleted_by uuid
);

CREATE TABLE public.hr_onboarding_checklists (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  name text NOT NULL,
  description text,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  created_by uuid, updated_by uuid, deleted_at timestamptz, deleted_by uuid
);

CREATE TABLE public.hr_onboarding_tasks (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  checklist_id uuid NOT NULL REFERENCES public.hr_onboarding_checklists(id) ON DELETE CASCADE,
  staff_id uuid REFERENCES public.staff(id) ON DELETE CASCADE,
  task_title text NOT NULL,
  task_description text,
  assigned_to uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  due_days_from_joining integer NOT NULL DEFAULT 7,
  status text NOT NULL DEFAULT 'pending', -- pending/in_progress/completed
  completed_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  created_by uuid, updated_by uuid, deleted_at timestamptz, deleted_by uuid
);

-- ============================================================================
-- 3. EMPLOYEE LIFECYCLE
-- ============================================================================

CREATE TABLE public.hr_transfers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  staff_id uuid REFERENCES public.staff(id) ON DELETE CASCADE,
  faculty_id uuid REFERENCES public.faculty(id) ON DELETE CASCADE,
  transfer_type public.hr_transfer_type NOT NULL,
  from_department_id uuid REFERENCES public.departments(id) ON DELETE SET NULL,
  to_department_id uuid REFERENCES public.departments(id) ON DELETE SET NULL,
  from_campus_id uuid REFERENCES public.campuses(id) ON DELETE SET NULL,
  to_campus_id uuid REFERENCES public.campuses(id) ON DELETE SET NULL,
  from_designation_id uuid REFERENCES public.hr_designations(id) ON DELETE SET NULL,
  to_designation_id uuid REFERENCES public.hr_designations(id) ON DELETE SET NULL,
  effective_date date NOT NULL,
  reason text,
  status text NOT NULL DEFAULT 'pending', -- pending/approved/rejected
  workflow_instance_id uuid REFERENCES public.workflow_instances(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  created_by uuid, updated_by uuid, deleted_at timestamptz, deleted_by uuid
);

CREATE TABLE public.hr_promotions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  staff_id uuid REFERENCES public.staff(id) ON DELETE CASCADE,
  faculty_id uuid REFERENCES public.faculty(id) ON DELETE CASCADE,
  from_designation_id uuid REFERENCES public.hr_designations(id) ON DELETE SET NULL,
  to_designation_id uuid REFERENCES public.hr_designations(id) ON DELETE SET NULL,
  from_pay_grade_id uuid REFERENCES public.hr_pay_grades(id) ON DELETE SET NULL,
  to_pay_grade_id uuid REFERENCES public.hr_pay_grades(id) ON DELETE SET NULL,
  effective_date date NOT NULL,
  remarks text,
  status text NOT NULL DEFAULT 'pending',
  workflow_instance_id uuid REFERENCES public.workflow_instances(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  created_by uuid, updated_by uuid, deleted_at timestamptz, deleted_by uuid
);

CREATE TABLE public.hr_increments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  staff_id uuid REFERENCES public.staff(id) ON DELETE CASCADE,
  faculty_id uuid REFERENCES public.faculty(id) ON DELETE CASCADE,
  increment_type text NOT NULL DEFAULT 'annual', -- annual/merit/adhoc
  from_salary numeric(12,2) NOT NULL,
  to_salary numeric(12,2) NOT NULL,
  increment_percent numeric(5,2),
  effective_date date NOT NULL,
  remarks text,
  status text NOT NULL DEFAULT 'pending',
  workflow_instance_id uuid REFERENCES public.workflow_instances(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  created_by uuid, updated_by uuid, deleted_at timestamptz, deleted_by uuid
);

CREATE TABLE public.hr_exits (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  staff_id uuid REFERENCES public.staff(id) ON DELETE CASCADE,
  faculty_id uuid REFERENCES public.faculty(id) ON DELETE CASCADE,
  exit_type text NOT NULL, -- 'resignation'/'termination'/'retirement'/'absconding'
  resignation_date date,
  last_working_date date,
  reason text,
  exit_interview_date date,
  exit_interview_notes text,
  clearance_status jsonb NOT NULL DEFAULT '{}'::jsonb,
  relieving_letter_url text,
  experience_cert_url text,
  status text NOT NULL DEFAULT 'initiated',
  workflow_instance_id uuid REFERENCES public.workflow_instances(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  created_by uuid, updated_by uuid, deleted_at timestamptz, deleted_by uuid
);

-- ============================================================================
-- 4. LEAVE MANAGEMENT
-- ============================================================================

CREATE TABLE public.hr_leave_types (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  name text NOT NULL,
  code text NOT NULL,
  description text,
  is_paid boolean NOT NULL DEFAULT true,
  basis public.hr_leave_basis NOT NULL DEFAULT 'days',
  max_days_per_year integer NOT NULL DEFAULT 0,
  max_continuous_days integer,
  carry_forward boolean NOT NULL DEFAULT false,
  max_carry_forward_days integer,
  requires_approval boolean NOT NULL DEFAULT true,
  requires_document boolean NOT NULL DEFAULT false,
  applicable_genders text[] DEFAULT NULL, -- null = all, or ['female'] for maternity
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  created_by uuid, updated_by uuid, deleted_at timestamptz, deleted_by uuid,
  UNIQUE (tenant_id, code)
);

CREATE TABLE public.hr_holiday_calendars (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  name text NOT NULL,
  year integer NOT NULL,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  created_by uuid, updated_by uuid, deleted_at timestamptz, deleted_by uuid,
  UNIQUE (tenant_id, year, name)
);

CREATE TABLE public.hr_holidays (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  calendar_id uuid NOT NULL REFERENCES public.hr_holiday_calendars(id) ON DELETE CASCADE,
  name text NOT NULL,
  date date NOT NULL,
  holiday_type text NOT NULL DEFAULT 'national', -- national/optional/restricted
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  created_by uuid, updated_by uuid, deleted_at timestamptz, deleted_by uuid
);

CREATE TABLE public.hr_leave_balances (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  leave_type_id uuid NOT NULL REFERENCES public.hr_leave_types(id) ON DELETE CASCADE,
  staff_id uuid REFERENCES public.staff(id) ON DELETE CASCADE,
  faculty_id uuid REFERENCES public.faculty(id) ON DELETE CASCADE,
  year integer NOT NULL,
  entitled_days numeric(6,2) NOT NULL DEFAULT 0,
  taken_days numeric(6,2) NOT NULL DEFAULT 0,
  pending_days numeric(6,2) NOT NULL DEFAULT 0,
  carried_forward_days numeric(6,2) NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  created_by uuid, updated_by uuid, deleted_at timestamptz, deleted_by uuid
);

CREATE TABLE public.hr_leave_applications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  leave_type_id uuid NOT NULL REFERENCES public.hr_leave_types(id) ON DELETE CASCADE,
  staff_id uuid REFERENCES public.staff(id) ON DELETE CASCADE,
  faculty_id uuid REFERENCES public.faculty(id) ON DELETE CASCADE,
  from_date date NOT NULL,
  to_date date NOT NULL,
  days numeric(6,2) NOT NULL,
  is_half_day boolean NOT NULL DEFAULT false,
  half_day_period text, -- 'morning'/'afternoon'
  reason text,
  document_url text,
  status public.hr_leave_status NOT NULL DEFAULT 'pending',
  applied_at timestamptz NOT NULL DEFAULT now(),
  approved_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  approved_at timestamptz,
  rejection_reason text,
  workflow_instance_id uuid REFERENCES public.workflow_instances(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  created_by uuid, updated_by uuid, deleted_at timestamptz, deleted_by uuid
);

-- ============================================================================
-- 5. SHIFT & ATTENDANCE
-- ============================================================================

CREATE TABLE public.hr_shifts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  name text NOT NULL,
  code text NOT NULL,
  start_time time NOT NULL,
  end_time time NOT NULL,
  grace_minutes integer NOT NULL DEFAULT 15,
  is_night_shift boolean NOT NULL DEFAULT false,
  is_flexi boolean NOT NULL DEFAULT false,
  work_hours numeric(4,2) NOT NULL DEFAULT 8,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  created_by uuid, updated_by uuid, deleted_at timestamptz, deleted_by uuid,
  UNIQUE (tenant_id, code)
);

CREATE TABLE public.hr_shift_rosters (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  staff_id uuid REFERENCES public.staff(id) ON DELETE CASCADE,
  faculty_id uuid REFERENCES public.faculty(id) ON DELETE CASCADE,
  shift_id uuid NOT NULL REFERENCES public.hr_shifts(id) ON DELETE CASCADE,
  effective_from date NOT NULL,
  effective_to date,
  days_of_week integer[] NOT NULL DEFAULT '{1,2,3,4,5}', -- 0=Sun...6=Sat
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  created_by uuid, updated_by uuid, deleted_at timestamptz, deleted_by uuid
);

CREATE TABLE public.hr_staff_attendance (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  staff_id uuid REFERENCES public.staff(id) ON DELETE CASCADE,
  faculty_id uuid REFERENCES public.faculty(id) ON DELETE CASCADE,
  shift_id uuid REFERENCES public.hr_shifts(id) ON DELETE SET NULL,
  date date NOT NULL,
  check_in timestamptz,
  check_out timestamptz,
  status text NOT NULL DEFAULT 'present', -- present/absent/half_day/late/on_leave/holiday/weekend
  source text NOT NULL DEFAULT 'manual', -- manual/biometric/rfid/gps/app
  overtime_minutes integer NOT NULL DEFAULT 0,
  remarks text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  created_by uuid, updated_by uuid, deleted_at timestamptz, deleted_by uuid
);

-- ============================================================================
-- 6. PAYROLL
-- ============================================================================

CREATE TABLE public.hr_salary_components (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  name text NOT NULL,
  code text NOT NULL,
  component_type public.hr_salary_component_type NOT NULL DEFAULT 'earning',
  calculation_type text NOT NULL DEFAULT 'fixed', -- fixed/percentage/formula
  value numeric(12,2) NOT NULL DEFAULT 0,
  depends_on text, -- component code for percentage base
  is_taxable boolean NOT NULL DEFAULT true,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  created_by uuid, updated_by uuid, deleted_at timestamptz, deleted_by uuid,
  UNIQUE (tenant_id, code)
);

CREATE TABLE public.hr_salary_structures (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  name text NOT NULL,
  code text NOT NULL,
  description text,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  created_by uuid, updated_by uuid, deleted_at timestamptz, deleted_by uuid,
  UNIQUE (tenant_id, code)
);

CREATE TABLE public.hr_salary_structure_components (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  structure_id uuid NOT NULL REFERENCES public.hr_salary_structures(id) ON DELETE CASCADE,
  component_id uuid NOT NULL REFERENCES public.hr_salary_components(id) ON DELETE CASCADE,
  override_value numeric(12,2),
  sort_order integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  created_by uuid, updated_by uuid, deleted_at timestamptz, deleted_by uuid
);

CREATE TABLE public.hr_salary_assignments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  staff_id uuid REFERENCES public.staff(id) ON DELETE CASCADE,
  faculty_id uuid REFERENCES public.faculty(id) ON DELETE CASCADE,
  structure_id uuid NOT NULL REFERENCES public.hr_salary_structures(id) ON DELETE CASCADE,
  basic_salary numeric(12,2) NOT NULL,
  effective_from date NOT NULL,
  effective_to date,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  created_by uuid, updated_by uuid, deleted_at timestamptz, deleted_by uuid
);

CREATE TABLE public.hr_payroll_runs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  name text NOT NULL,
  pay_period_start date NOT NULL,
  pay_period_end date NOT NULL,
  payment_date date,
  status public.hr_payroll_run_status NOT NULL DEFAULT 'draft',
  total_gross numeric(14,2) NOT NULL DEFAULT 0,
  total_deductions numeric(14,2) NOT NULL DEFAULT 0,
  total_net numeric(14,2) NOT NULL DEFAULT 0,
  employee_count integer NOT NULL DEFAULT 0,
  processed_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  processed_at timestamptz,
  approved_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  approved_at timestamptz,
  finance_transaction_id uuid REFERENCES public.finance_transactions(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  created_by uuid, updated_by uuid, deleted_at timestamptz, deleted_by uuid
);

CREATE TABLE public.hr_payslips (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  payroll_run_id uuid NOT NULL REFERENCES public.hr_payroll_runs(id) ON DELETE CASCADE,
  staff_id uuid REFERENCES public.staff(id) ON DELETE CASCADE,
  faculty_id uuid REFERENCES public.faculty(id) ON DELETE CASCADE,
  employee_code text NOT NULL,
  employee_name text NOT NULL,
  pay_period_start date NOT NULL,
  pay_period_end date NOT NULL,
  working_days integer NOT NULL DEFAULT 0,
  present_days numeric(6,2) NOT NULL DEFAULT 0,
  leave_days numeric(6,2) NOT NULL DEFAULT 0,
  gross_salary numeric(12,2) NOT NULL DEFAULT 0,
  total_deductions numeric(12,2) NOT NULL DEFAULT 0,
  net_salary numeric(12,2) NOT NULL DEFAULT 0,
  earnings jsonb NOT NULL DEFAULT '{}'::jsonb,
  deductions jsonb NOT NULL DEFAULT '{}'::jsonb,
  pf_employer numeric(10,2) NOT NULL DEFAULT 0,
  esi_employer numeric(10,2) NOT NULL DEFAULT 0,
  payslip_url text,
  bank_transfer_status text NOT NULL DEFAULT 'pending',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  created_by uuid, updated_by uuid, deleted_at timestamptz, deleted_by uuid
);

CREATE TABLE public.hr_loans (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  staff_id uuid REFERENCES public.staff(id) ON DELETE CASCADE,
  faculty_id uuid REFERENCES public.faculty(id) ON DELETE CASCADE,
  loan_type text NOT NULL DEFAULT 'personal', -- personal/housing/vehicle/advance
  principal_amount numeric(12,2) NOT NULL,
  interest_rate numeric(5,2) NOT NULL DEFAULT 0,
  tenure_months integer NOT NULL,
  emi_amount numeric(12,2) NOT NULL,
  disbursement_date date,
  outstanding_amount numeric(12,2) NOT NULL DEFAULT 0,
  status public.hr_loan_status NOT NULL DEFAULT 'pending',
  workflow_instance_id uuid REFERENCES public.workflow_instances(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  created_by uuid, updated_by uuid, deleted_at timestamptz, deleted_by uuid
);

CREATE TABLE public.hr_statutory_config (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  component text NOT NULL, -- 'pf'/'esi'/'pt'/'tds'
  config jsonb NOT NULL DEFAULT '{}'::jsonb,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  created_by uuid, updated_by uuid, deleted_at timestamptz, deleted_by uuid,
  UNIQUE (tenant_id, component)
);

-- ============================================================================
-- 7. PERFORMANCE MANAGEMENT
-- ============================================================================

CREATE TABLE public.hr_appraisal_cycles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  name text NOT NULL,
  cycle_type text NOT NULL DEFAULT 'annual', -- annual/quarterly/monthly
  start_date date NOT NULL,
  end_date date NOT NULL,
  self_review_deadline date,
  manager_review_deadline date,
  status text NOT NULL DEFAULT 'draft', -- draft/active/completed
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  created_by uuid, updated_by uuid, deleted_at timestamptz, deleted_by uuid
);

CREATE TABLE public.hr_goals (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  staff_id uuid REFERENCES public.staff(id) ON DELETE CASCADE,
  faculty_id uuid REFERENCES public.faculty(id) ON DELETE CASCADE,
  appraisal_cycle_id uuid REFERENCES public.hr_appraisal_cycles(id) ON DELETE CASCADE,
  title text NOT NULL,
  description text,
  target_metric text,
  target_value numeric(12,2),
  achieved_value numeric(12,2),
  weightage numeric(5,2) NOT NULL DEFAULT 100,
  due_date date,
  status text NOT NULL DEFAULT 'active', -- active/completed/cancelled
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  created_by uuid, updated_by uuid, deleted_at timestamptz, deleted_by uuid
);

CREATE TABLE public.hr_appraisals (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  cycle_id uuid NOT NULL REFERENCES public.hr_appraisal_cycles(id) ON DELETE CASCADE,
  staff_id uuid REFERENCES public.staff(id) ON DELETE CASCADE,
  faculty_id uuid REFERENCES public.faculty(id) ON DELETE CASCADE,
  appraiser_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  self_rating numeric(4,2),
  manager_rating numeric(4,2),
  final_rating numeric(4,2),
  self_review_notes text,
  manager_review_notes text,
  hr_notes text,
  status public.hr_appraisal_status NOT NULL DEFAULT 'draft',
  promotion_recommended boolean NOT NULL DEFAULT false,
  increment_recommended boolean NOT NULL DEFAULT false,
  recommended_increment_percent numeric(5,2),
  workflow_instance_id uuid REFERENCES public.workflow_instances(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  created_by uuid, updated_by uuid, deleted_at timestamptz, deleted_by uuid
);

CREATE TABLE public.hr_360_feedback (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  appraisal_id uuid NOT NULL REFERENCES public.hr_appraisals(id) ON DELETE CASCADE,
  reviewer_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  relationship text NOT NULL, -- 'peer'/'subordinate'/'manager'/'self'
  rating numeric(4,2),
  feedback text,
  submitted_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  created_by uuid, updated_by uuid, deleted_at timestamptz, deleted_by uuid
);

-- ============================================================================
-- INDEXES
-- ============================================================================
CREATE INDEX idx_hr_designations_tenant ON public.hr_designations(tenant_id);
CREATE INDEX idx_hr_pay_grades_tenant ON public.hr_pay_grades(tenant_id);
CREATE INDEX idx_hr_emp_qualifications_staff ON public.hr_employee_qualifications(staff_id);
CREATE INDEX idx_hr_emp_qualifications_faculty ON public.hr_employee_qualifications(faculty_id);
CREATE INDEX idx_hr_emp_experience_staff ON public.hr_employee_experience(staff_id);
CREATE INDEX idx_hr_emp_skills_staff ON public.hr_employee_skills(staff_id);
CREATE INDEX idx_hr_emp_ext_staff ON public.hr_employee_extensions(staff_id);
CREATE INDEX idx_hr_emp_ext_faculty ON public.hr_employee_extensions(faculty_id);
CREATE INDEX idx_hr_job_positions_tenant ON public.hr_job_positions(tenant_id);
CREATE INDEX idx_hr_applicants_job ON public.hr_applicants(job_position_id);
CREATE INDEX idx_hr_applicants_stage ON public.hr_applicants(stage);
CREATE INDEX idx_hr_interviews_applicant ON public.hr_interviews(applicant_id);
CREATE INDEX idx_hr_leave_apps_staff ON public.hr_leave_applications(staff_id);
CREATE INDEX idx_hr_leave_apps_faculty ON public.hr_leave_applications(faculty_id);
CREATE INDEX idx_hr_leave_apps_status ON public.hr_leave_applications(status);
CREATE INDEX idx_hr_staff_attendance_date ON public.hr_staff_attendance(date);
CREATE INDEX idx_hr_staff_attendance_staff ON public.hr_staff_attendance(staff_id);
CREATE INDEX idx_hr_payslips_run ON public.hr_payslips(payroll_run_id);
CREATE INDEX idx_hr_payslips_staff ON public.hr_payslips(staff_id);
CREATE INDEX idx_hr_goals_staff ON public.hr_goals(staff_id);
CREATE INDEX idx_hr_appraisals_cycle ON public.hr_appraisals(cycle_id);

-- ============================================================================
-- ENABLE ROW LEVEL SECURITY
-- ============================================================================
ALTER TABLE public.hr_designations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.hr_pay_grades ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.hr_employee_qualifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.hr_employee_experience ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.hr_employee_skills ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.hr_employee_extensions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.hr_job_positions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.hr_applicants ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.hr_interviews ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.hr_offer_letters ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.hr_onboarding_checklists ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.hr_onboarding_tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.hr_transfers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.hr_promotions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.hr_increments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.hr_exits ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.hr_leave_types ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.hr_holiday_calendars ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.hr_holidays ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.hr_leave_balances ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.hr_leave_applications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.hr_shifts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.hr_shift_rosters ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.hr_staff_attendance ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.hr_salary_components ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.hr_salary_structures ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.hr_salary_structure_components ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.hr_salary_assignments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.hr_payroll_runs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.hr_payslips ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.hr_loans ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.hr_statutory_config ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.hr_appraisal_cycles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.hr_goals ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.hr_appraisals ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.hr_360_feedback ENABLE ROW LEVEL SECURITY;

-- RLS Policies (tenant isolation)
DO $$
DECLARE
  tbl text;
  tbls text[] := ARRAY[
    'hr_designations','hr_pay_grades','hr_employee_qualifications',
    'hr_employee_experience','hr_employee_skills','hr_employee_extensions',
    'hr_job_positions','hr_applicants','hr_interviews','hr_offer_letters',
    'hr_onboarding_checklists','hr_onboarding_tasks','hr_transfers',
    'hr_promotions','hr_increments','hr_exits','hr_leave_types',
    'hr_holiday_calendars','hr_holidays','hr_leave_balances',
    'hr_leave_applications','hr_shifts','hr_shift_rosters',
    'hr_staff_attendance','hr_salary_components','hr_salary_structures',
    'hr_salary_structure_components','hr_salary_assignments',
    'hr_payroll_runs','hr_payslips','hr_loans','hr_statutory_config',
    'hr_appraisal_cycles','hr_goals','hr_appraisals','hr_360_feedback'
  ];
BEGIN
  FOREACH tbl IN ARRAY tbls LOOP
    EXECUTE format(
      'CREATE POLICY "Tenant isolation" ON public.%I FOR ALL USING (tenant_id = (current_setting(''app.current_tenant_id'', true))::uuid)',
      tbl
    );
  END LOOP;
END $$;

-- ============================================================================
-- SEED HRMS PERMISSIONS
-- ============================================================================
INSERT INTO public.permissions (id, key, name, description, module, action, resource)
VALUES
  (gen_random_uuid(), 'hr.read',           'Read HR Data',         'View employee and HR records',     'hrms', 'read',   'hr'),
  (gen_random_uuid(), 'hr.create',         'Create HR Data',       'Create employees and HR records',  'hrms', 'create', 'hr'),
  (gen_random_uuid(), 'hr.update',         'Update HR Data',       'Modify employee records',          'hrms', 'update', 'hr'),
  (gen_random_uuid(), 'hr.delete',         'Delete HR Data',       'Remove HR records',                'hrms', 'delete', 'hr'),
  (gen_random_uuid(), 'payroll.manage',    'Manage Payroll',       'Process and approve payroll',      'hrms', 'manage', 'payroll'),
  (gen_random_uuid(), 'leave.manage',      'Manage Leave',         'Approve and manage leave',         'hrms', 'manage', 'leave'),
  (gen_random_uuid(), 'employee.manage',   'Manage Employees',     'Full employee lifecycle access',   'hrms', 'manage', 'employee'),
  (gen_random_uuid(), 'performance.manage','Manage Performance',   'Appraisals, goals, KPIs',          'hrms', 'manage', 'performance')
ON CONFLICT (key) DO NOTHING;
