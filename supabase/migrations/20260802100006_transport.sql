-- ============================================================================
-- MODULE 6: TRANSPORT MANAGEMENT (21 tables)
-- ============================================================================

CREATE TABLE public.trn_vehicles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  registration_number text NOT NULL,
  vehicle_type text NOT NULL, -- bus, van, car
  capacity integer NOT NULL,
  make text,
  model text,
  year integer,
  status public.trn_vehicle_status NOT NULL DEFAULT 'active',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(tenant_id, registration_number)
);

CREATE TABLE public.trn_drivers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  staff_id uuid NOT NULL REFERENCES public.staff(id),
  license_number text NOT NULL,
  license_expiry date NOT NULL,
  experience_years integer,
  is_active boolean DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE public.trn_attendants (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  staff_id uuid NOT NULL REFERENCES public.staff(id),
  is_active boolean DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE public.trn_driver_licenses (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  driver_id uuid NOT NULL REFERENCES public.trn_drivers(id) ON DELETE CASCADE,
  document_url text NOT NULL,
  issue_date date,
  expiry_date date NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE public.trn_routes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  name text NOT NULL,
  start_location text NOT NULL,
  end_location text NOT NULL,
  distance_km numeric,
  estimated_time_mins integer,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE public.trn_stops (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  route_id uuid NOT NULL REFERENCES public.trn_routes(id) ON DELETE CASCADE,
  name text NOT NULL,
  stop_sequence integer NOT NULL,
  landmark text,
  pickup_time time,
  drop_time time,
  latitude numeric,
  longitude numeric,
  distance_from_start numeric,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE public.trn_route_vehicles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  route_id uuid NOT NULL REFERENCES public.trn_routes(id) ON DELETE CASCADE,
  vehicle_id uuid NOT NULL REFERENCES public.trn_vehicles(id),
  driver_id uuid REFERENCES public.trn_drivers(id),
  attendant_id uuid REFERENCES public.trn_attendants(id),
  shift text, -- morning, evening
  is_active boolean DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE public.trn_student_allocations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  student_id uuid NOT NULL REFERENCES public.students(id),
  route_id uuid NOT NULL REFERENCES public.trn_routes(id),
  pickup_stop_id uuid NOT NULL REFERENCES public.trn_stops(id),
  drop_stop_id uuid NOT NULL REFERENCES public.trn_stops(id),
  academic_year_id uuid REFERENCES public.academic_years(id),
  status text NOT NULL DEFAULT 'active',
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE public.trn_faculty_allocations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  staff_id uuid NOT NULL REFERENCES public.staff(id),
  route_id uuid NOT NULL REFERENCES public.trn_routes(id),
  stop_id uuid NOT NULL REFERENCES public.trn_stops(id),
  status text NOT NULL DEFAULT 'active',
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE public.trn_pickup_attendance (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  route_vehicle_id uuid NOT NULL REFERENCES public.trn_route_vehicles(id),
  attendance_date date NOT NULL,
  student_id uuid REFERENCES public.students(id),
  staff_id uuid REFERENCES public.staff(id),
  status text NOT NULL DEFAULT 'present',
  marked_by uuid REFERENCES auth.users(id),
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE public.trn_fees (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  allocation_id uuid NOT NULL REFERENCES public.trn_student_allocations(id),
  amount numeric NOT NULL,
  due_date date NOT NULL,
  status text NOT NULL DEFAULT 'pending',
  invoice_id uuid,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE public.trn_fuel_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  vehicle_id uuid NOT NULL REFERENCES public.trn_vehicles(id),
  fill_date date NOT NULL,
  odometer_reading numeric NOT NULL,
  quantity_liters numeric NOT NULL,
  cost numeric NOT NULL,
  bill_url text,
  filled_by uuid REFERENCES public.trn_drivers(id),
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE public.trn_vehicle_documents (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  vehicle_id uuid NOT NULL REFERENCES public.trn_vehicles(id),
  document_type text NOT NULL, -- insurance, puc, permit
  document_url text NOT NULL,
  issue_date date,
  expiry_date date NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE public.trn_gps_devices (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  vehicle_id uuid NOT NULL REFERENCES public.trn_vehicles(id),
  device_id text NOT NULL,
  provider text NOT NULL,
  is_active boolean DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(tenant_id, device_id)
);

CREATE TABLE public.trn_trip_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  route_vehicle_id uuid NOT NULL REFERENCES public.trn_route_vehicles(id),
  trip_date date NOT NULL,
  start_time timestamptz,
  end_time timestamptz,
  status text DEFAULT 'scheduled', -- scheduled, in_progress, completed, cancelled
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE public.trn_trip_history (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  trip_id uuid NOT NULL REFERENCES public.trn_trip_logs(id),
  timestamp timestamptz NOT NULL DEFAULT now(),
  latitude numeric NOT NULL,
  longitude numeric NOT NULL,
  speed numeric DEFAULT 0
);

CREATE TABLE public.trn_incidents (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  vehicle_id uuid NOT NULL REFERENCES public.trn_vehicles(id),
  incident_type text NOT NULL, -- overspeeding, harsh_braking, deviation
  timestamp timestamptz NOT NULL DEFAULT now(),
  description text,
  latitude numeric,
  longitude numeric,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE public.trn_accidents (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  vehicle_id uuid NOT NULL REFERENCES public.trn_vehicles(id),
  accident_date timestamptz NOT NULL,
  driver_id uuid REFERENCES public.trn_drivers(id),
  description text NOT NULL,
  damage_details text,
  police_report_url text,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE public.trn_service_schedule (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  vehicle_id uuid NOT NULL REFERENCES public.trn_vehicles(id),
  service_type text NOT NULL,
  due_date date,
  due_odometer numeric,
  status text DEFAULT 'pending',
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE public.trn_settings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  key text NOT NULL,
  value jsonb NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(tenant_id, key)
);
