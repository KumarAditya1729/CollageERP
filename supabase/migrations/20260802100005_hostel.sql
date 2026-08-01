-- ============================================================================
-- MODULE 5: HOSTEL MANAGEMENT (23 tables)
-- ============================================================================

CREATE TABLE public.hos_hostels (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  name text NOT NULL,
  type text NOT NULL, -- 'boys', 'girls', 'mixed'
  campus_id uuid REFERENCES public.campuses(id),
  address text,
  total_capacity integer DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE public.hos_floors (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  hostel_id uuid NOT NULL REFERENCES public.hos_hostels(id) ON DELETE CASCADE,
  floor_number text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE public.hos_rooms (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  floor_id uuid NOT NULL REFERENCES public.hos_floors(id) ON DELETE CASCADE,
  room_number text NOT NULL,
  room_type public.hos_room_type NOT NULL,
  capacity integer NOT NULL DEFAULT 1,
  has_ac boolean DEFAULT false,
  has_attached_bath boolean DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE public.hos_beds (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  room_id uuid NOT NULL REFERENCES public.hos_rooms(id) ON DELETE CASCADE,
  bed_number text NOT NULL,
  is_occupied boolean DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE public.hos_wardens (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  hostel_id uuid NOT NULL REFERENCES public.hos_hostels(id) ON DELETE CASCADE,
  staff_id uuid NOT NULL REFERENCES public.staff(id),
  role text DEFAULT 'warden',
  is_active boolean DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE public.hos_allocations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  student_id uuid NOT NULL REFERENCES public.students(id),
  bed_id uuid NOT NULL REFERENCES public.hos_beds(id),
  academic_year_id uuid REFERENCES public.academic_years(id),
  check_in_date date NOT NULL,
  expected_check_out_date date,
  actual_check_out_date date,
  status text NOT NULL DEFAULT 'active', -- active, vacated
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE public.hos_waiting_list (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  student_id uuid NOT NULL REFERENCES public.students(id),
  hostel_id uuid REFERENCES public.hos_hostels(id),
  preferred_room_type public.hos_room_type,
  application_date date NOT NULL DEFAULT CURRENT_DATE,
  status text NOT NULL DEFAULT 'waiting', -- waiting, allocated, cancelled
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE public.hos_mess_plans (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  name text NOT NULL,
  description text,
  cost_per_month numeric DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE public.hos_mess_enrollments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  student_id uuid NOT NULL REFERENCES public.students(id),
  mess_plan_id uuid NOT NULL REFERENCES public.hos_mess_plans(id),
  start_date date NOT NULL,
  end_date date,
  status text DEFAULT 'active',
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE public.hos_complaints (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  student_id uuid NOT NULL REFERENCES public.students(id),
  category text NOT NULL,
  description text NOT NULL,
  status text NOT NULL DEFAULT 'open', -- open, in_progress, resolved
  resolved_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE public.hos_fees (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  student_id uuid NOT NULL REFERENCES public.students(id),
  fee_type text NOT NULL, -- room_rent, mess_fee, fine
  amount numeric NOT NULL,
  due_date date NOT NULL,
  status text NOT NULL DEFAULT 'pending', -- pending, paid
  invoice_id uuid, -- link to finance_invoices later
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE public.hos_attendance (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  allocation_id uuid NOT NULL REFERENCES public.hos_allocations(id),
  attendance_date date NOT NULL,
  status text NOT NULL DEFAULT 'present', -- present, absent, on_leave
  marked_by uuid REFERENCES auth.users(id),
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(tenant_id, allocation_id, attendance_date)
);

CREATE TABLE public.hos_transfers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  allocation_id uuid NOT NULL REFERENCES public.hos_allocations(id),
  from_bed_id uuid NOT NULL REFERENCES public.hos_beds(id),
  to_bed_id uuid NOT NULL REFERENCES public.hos_beds(id),
  transfer_date date NOT NULL DEFAULT CURRENT_DATE,
  reason text,
  approved_by uuid REFERENCES auth.users(id),
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE public.hos_gate_passes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  student_id uuid NOT NULL REFERENCES public.students(id),
  pass_type text NOT NULL, -- local, outstation, emergency
  purpose text NOT NULL,
  out_time timestamptz NOT NULL,
  expected_in_time timestamptz NOT NULL,
  actual_in_time timestamptz,
  status text NOT NULL DEFAULT 'pending_approval', -- pending, approved, rejected, active, closed
  approved_by uuid REFERENCES auth.users(id),
  parent_approval_status text,
  qr_code text,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE public.hos_outpasses (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  student_id uuid NOT NULL REFERENCES public.students(id),
  reason text NOT NULL,
  leave_date date NOT NULL,
  return_date date NOT NULL,
  status text NOT NULL DEFAULT 'pending',
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE public.hos_disciplinary_actions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  student_id uuid NOT NULL REFERENCES public.students(id),
  incident_date date NOT NULL,
  description text NOT NULL,
  action_taken text,
  fine_amount numeric,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE public.hos_electricity_readings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  room_id uuid NOT NULL REFERENCES public.hos_rooms(id),
  reading_date date NOT NULL,
  reading_value numeric NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE public.hos_water_readings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  hostel_id uuid NOT NULL REFERENCES public.hos_hostels(id),
  reading_date date NOT NULL,
  reading_value numeric NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE public.hos_room_inspections (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  room_id uuid NOT NULL REFERENCES public.hos_rooms(id),
  inspection_date date NOT NULL,
  inspector_id uuid NOT NULL REFERENCES auth.users(id),
  cleanliness_score integer,
  damages_noted text,
  fire_safety_checklist jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE public.hos_inventory (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  room_id uuid NOT NULL REFERENCES public.hos_rooms(id),
  asset_id uuid NOT NULL REFERENCES public.inv_assets(id),
  status text DEFAULT 'good',
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE public.hos_settings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  key text NOT NULL,
  value jsonb NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(tenant_id, key)
);
