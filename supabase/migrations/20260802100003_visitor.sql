-- ============================================================================
-- MODULE 6: VISITOR MANAGEMENT
-- ============================================================================

CREATE TABLE public.visitors (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  full_name text NOT NULL,
  phone text NOT NULL,
  email text,
  id_proof_type text,
  id_proof_number text,
  photo_url text,
  is_blacklisted boolean DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(tenant_id, phone)
);

CREATE TABLE public.visitor_passes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  visitor_id uuid NOT NULL REFERENCES public.visitors(id),
  purpose public.visitor_purpose NOT NULL,
  host_id uuid REFERENCES auth.users(id),
  valid_from timestamptz NOT NULL,
  valid_until timestamptz NOT NULL,
  status text NOT NULL DEFAULT 'active', -- active, expired, cancelled
  pass_code text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(tenant_id, pass_code)
);

CREATE TABLE public.visitor_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  pass_id uuid NOT NULL REFERENCES public.visitor_passes(id),
  entry_time timestamptz NOT NULL DEFAULT now(),
  exit_time timestamptz,
  gate_id text,
  recorded_by uuid REFERENCES auth.users(id),
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE public.visitor_vehicles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  visitor_id uuid NOT NULL REFERENCES public.visitors(id),
  vehicle_number text NOT NULL,
  vehicle_type text,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE public.visitor_qr (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  pass_id uuid NOT NULL REFERENCES public.visitor_passes(id) ON DELETE CASCADE,
  qr_code_url text NOT NULL,
  is_scanned boolean DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now()
);
