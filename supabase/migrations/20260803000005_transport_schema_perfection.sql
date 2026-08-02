-- ==============================================================================
-- Transport Management Schema Perfection & Relational Integrity
-- ==============================================================================

-- 1. Add vehicle_id and driver_id to trn_routes to enable relational joins with trn_vehicles and trn_drivers
ALTER TABLE public.trn_routes ADD COLUMN IF NOT EXISTS vehicle_id uuid REFERENCES public.trn_vehicles(id) ON DELETE SET NULL;
ALTER TABLE public.trn_routes ADD COLUMN IF NOT EXISTS driver_id uuid REFERENCES public.trn_drivers(id) ON DELETE SET NULL;
ALTER TABLE public.trn_routes ADD COLUMN IF NOT EXISTS deleted_at timestamptz DEFAULT NULL;

-- 2. Add route_id and driver_id to trn_incidents
ALTER TABLE public.trn_incidents ADD COLUMN IF NOT EXISTS route_id uuid REFERENCES public.trn_routes(id) ON DELETE SET NULL;
ALTER TABLE public.trn_incidents ADD COLUMN IF NOT EXISTS driver_id uuid REFERENCES public.trn_drivers(id) ON DELETE SET NULL;
ALTER TABLE public.trn_incidents ADD COLUMN IF NOT EXISTS deleted_at timestamptz DEFAULT NULL;

-- 3. Create trn_attendance table to harmonize attendance tracking across routes and buses
CREATE TABLE IF NOT EXISTS public.trn_attendance (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  route_id uuid REFERENCES public.trn_routes(id) ON DELETE CASCADE,
  student_id uuid REFERENCES public.students(id) ON DELETE SET NULL,
  staff_id uuid REFERENCES public.staff(id) ON DELETE SET NULL,
  driver_id uuid REFERENCES public.trn_drivers(id) ON DELETE SET NULL,
  attendance_date date NOT NULL DEFAULT CURRENT_DATE,
  date date NOT NULL DEFAULT CURRENT_DATE,
  status text NOT NULL DEFAULT 'present',
  shift text DEFAULT 'morning',
  remarks text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  deleted_at timestamptz DEFAULT NULL
);

-- 4. Create trn_maintenance table for comprehensive bus service & maintenance tracking
CREATE TABLE IF NOT EXISTS public.trn_maintenance (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  vehicle_id uuid NOT NULL REFERENCES public.trn_vehicles(id) ON DELETE CASCADE,
  maintenance_date date NOT NULL DEFAULT CURRENT_DATE,
  description text,
  service_type text DEFAULT 'preventive',
  cost numeric DEFAULT 0,
  odometer_reading numeric,
  status text NOT NULL DEFAULT 'pending',
  vendor text,
  invoice_url text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  deleted_at timestamptz DEFAULT NULL
);

-- 5. Create trn_documents table for fleet regulatory document compliance (insurance, PUC, permits)
CREATE TABLE IF NOT EXISTS public.trn_documents (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  vehicle_id uuid REFERENCES public.trn_vehicles(id) ON DELETE CASCADE,
  driver_id uuid REFERENCES public.trn_drivers(id) ON DELETE CASCADE,
  document_type text NOT NULL,
  document_url text,
  document_number text,
  issue_date date,
  expiry_date date,
  status text DEFAULT 'active',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  deleted_at timestamptz DEFAULT NULL
);

-- 6. Migrate existing legacy schedules and document records into the unified tables
INSERT INTO public.trn_maintenance (tenant_id, vehicle_id, maintenance_date, description, service_type, status, created_at)
SELECT tenant_id, vehicle_id, COALESCE(due_date, CURRENT_DATE), service_type || ' scheduled service', service_type, COALESCE(status, 'pending'), created_at
FROM public.trn_service_schedule
ON CONFLICT DO NOTHING;

INSERT INTO public.trn_documents (tenant_id, vehicle_id, document_type, document_url, issue_date, expiry_date, created_at)
SELECT tenant_id, vehicle_id, document_type, document_url, issue_date, expiry_date, created_at
FROM public.trn_vehicle_documents
ON CONFLICT DO NOTHING;

-- 7. Enable RLS and establish secure tenant isolation policies
ALTER TABLE public.trn_attendance ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.trn_maintenance ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.trn_documents ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  CREATE POLICY "Tenant isolation for trn_attendance" ON public.trn_attendance FOR ALL USING (tenant_id = (SELECT tenant_id FROM public.profiles WHERE id = auth.uid() LIMIT 1));
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE POLICY "Tenant isolation for trn_maintenance" ON public.trn_maintenance FOR ALL USING (tenant_id = (SELECT tenant_id FROM public.profiles WHERE id = auth.uid() LIMIT 1));
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE POLICY "Tenant isolation for trn_documents" ON public.trn_documents FOR ALL USING (tenant_id = (SELECT tenant_id FROM public.profiles WHERE id = auth.uid() LIMIT 1));
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- 8. Optimize queries with strategic indexes
CREATE INDEX IF NOT EXISTS idx_trn_routes_vehicle_id ON public.trn_routes(vehicle_id);
CREATE INDEX IF NOT EXISTS idx_trn_attendance_tenant_route ON public.trn_attendance(tenant_id, route_id);
CREATE INDEX IF NOT EXISTS idx_trn_maintenance_tenant_vehicle ON public.trn_maintenance(tenant_id, vehicle_id);
CREATE INDEX IF NOT EXISTS idx_trn_documents_tenant_vehicle ON public.trn_documents(tenant_id, vehicle_id);
