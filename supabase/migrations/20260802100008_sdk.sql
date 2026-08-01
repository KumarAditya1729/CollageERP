-- ============================================================================
-- MODULE 9: PLUGIN SDK / EXTENSIBILITY
-- ============================================================================

CREATE TABLE public.sdk_modules (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  name text NOT NULL,
  version text NOT NULL,
  author text,
  status text NOT NULL DEFAULT 'active',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(tenant_id, name)
);

CREATE TABLE public.sdk_plugins (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  module_id uuid NOT NULL REFERENCES public.sdk_modules(id) ON DELETE CASCADE,
  plugin_name text NOT NULL,
  entry_point text NOT NULL,
  is_active boolean DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE public.sdk_event_bus (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  event_name text NOT NULL,
  payload jsonb NOT NULL,
  dispatched_by uuid REFERENCES auth.users(id),
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE public.sdk_webhooks (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  name text NOT NULL,
  url text NOT NULL,
  event_pattern text NOT NULL,
  secret text,
  is_active boolean DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE public.sdk_custom_pages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  module_id uuid REFERENCES public.sdk_modules(id),
  route_path text NOT NULL,
  page_title text NOT NULL,
  component_config jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(tenant_id, route_path)
);

CREATE TABLE public.sdk_custom_reports (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  name text NOT NULL,
  sql_query text NOT NULL,
  parameters jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE public.sdk_custom_fields (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  target_table text NOT NULL,
  field_name text NOT NULL,
  field_type text NOT NULL,
  is_required boolean DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(tenant_id, target_table, field_name)
);

CREATE TABLE public.sdk_marketplace (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  app_id text NOT NULL UNIQUE,
  name text NOT NULL,
  description text,
  developer text NOT NULL,
  price numeric DEFAULT 0,
  is_verified boolean DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now()
);
