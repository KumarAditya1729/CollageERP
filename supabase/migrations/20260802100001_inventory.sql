-- ============================================================================
-- CAMPUS OPERATIONS SUITE
-- Migration: 20260802100000_campus_ops.sql
-- Contains: Inventory, Maintenance, Visitor, Security, Medical, Hostel, Transport, Library, Plugin SDK
-- ============================================================================

-- ============================================================================
-- ENUMS
-- ============================================================================

CREATE TYPE public.inv_item_type AS ENUM ('consumable', 'asset', 'service');
CREATE TYPE public.inv_movement_type AS ENUM ('in', 'out', 'transfer', 'adjustment');
CREATE TYPE public.maintenance_priority AS ENUM ('low', 'medium', 'high', 'critical');
CREATE TYPE public.maintenance_status AS ENUM ('open', 'in_progress', 'on_hold', 'completed', 'cancelled');
CREATE TYPE public.visitor_purpose AS ENUM ('official', 'personal', 'interview', 'vendor', 'delivery', 'other');
CREATE TYPE public.security_incident_severity AS ENUM ('minor', 'moderate', 'major', 'critical');
CREATE TYPE public.medical_visit_type AS ENUM ('routine', 'emergency', 'follow_up');
CREATE TYPE public.hos_room_type AS ENUM ('single', 'double', 'triple', 'dormitory');
CREATE TYPE public.trn_vehicle_status AS ENUM ('active', 'maintenance', 'out_of_service');
CREATE TYPE public.lib_item_status AS ENUM ('available', 'issued', 'reserved', 'lost', 'damaged', 'weeding');

-- ============================================================================
-- MODULE 4: INVENTORY
-- ============================================================================

CREATE TABLE public.inv_categories (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  name text NOT NULL,
  description text,
  parent_id uuid REFERENCES public.inv_categories(id),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  created_by uuid, updated_by uuid, deleted_at timestamptz, deleted_by uuid
);

CREATE TABLE public.inv_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  category_id uuid NOT NULL REFERENCES public.inv_categories(id),
  name text NOT NULL,
  sku text,
  type public.inv_item_type NOT NULL DEFAULT 'consumable',
  unit_of_measure text NOT NULL,
  reorder_level numeric DEFAULT 0,
  is_active boolean DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  created_by uuid, updated_by uuid, deleted_at timestamptz, deleted_by uuid,
  UNIQUE(tenant_id, sku)
);

CREATE TABLE public.inv_locations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  name text NOT NULL,
  type text NOT NULL, -- e.g., 'warehouse', 'store', 'department'
  campus_id uuid REFERENCES public.campuses(id),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  created_by uuid, updated_by uuid, deleted_at timestamptz, deleted_by uuid
);

CREATE TABLE public.inv_stock (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  item_id uuid NOT NULL REFERENCES public.inv_items(id),
  location_id uuid NOT NULL REFERENCES public.inv_locations(id),
  quantity numeric NOT NULL DEFAULT 0,
  unit_value numeric DEFAULT 0,
  last_counted_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(tenant_id, item_id, location_id)
);

CREATE TABLE public.inv_movements (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  item_id uuid NOT NULL REFERENCES public.inv_items(id),
  movement_type public.inv_movement_type NOT NULL,
  quantity numeric NOT NULL,
  from_location_id uuid REFERENCES public.inv_locations(id),
  to_location_id uuid REFERENCES public.inv_locations(id),
  reference_type text, -- e.g., 'purchase_order', 'consumption', 'adjustment'
  reference_id uuid,
  remarks text,
  movement_date timestamptz NOT NULL DEFAULT now(),
  created_at timestamptz NOT NULL DEFAULT now(),
  created_by uuid NOT NULL REFERENCES auth.users(id)
);

CREATE TABLE public.inv_suppliers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  name text NOT NULL,
  contact_person text,
  email text,
  phone text,
  address text,
  gst_number text,
  is_active boolean DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  created_by uuid, updated_by uuid, deleted_at timestamptz, deleted_by uuid
);

CREATE TABLE public.inv_purchase_orders (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  supplier_id uuid NOT NULL REFERENCES public.inv_suppliers(id),
  po_number text NOT NULL,
  po_date date NOT NULL,
  expected_delivery_date date,
  status text NOT NULL DEFAULT 'draft',
  total_amount numeric NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  created_by uuid, updated_by uuid, deleted_at timestamptz, deleted_by uuid,
  UNIQUE(tenant_id, po_number)
);

CREATE TABLE public.inv_assets (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  item_id uuid NOT NULL REFERENCES public.inv_items(id),
  asset_tag text NOT NULL,
  serial_number text,
  location_id uuid REFERENCES public.inv_locations(id),
  status text NOT NULL DEFAULT 'active', -- active, maintenance, retired, lost
  purchase_cost numeric,
  purchase_date date,
  warranty_expiry date,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  created_by uuid, updated_by uuid, deleted_at timestamptz, deleted_by uuid,
  UNIQUE(tenant_id, asset_tag)
);

CREATE TABLE public.inv_consumption (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  item_id uuid NOT NULL REFERENCES public.inv_items(id),
  location_id uuid NOT NULL REFERENCES public.inv_locations(id),
  department_id uuid REFERENCES public.departments(id),
  consumed_by uuid REFERENCES auth.users(id),
  quantity numeric NOT NULL,
  consumption_date timestamptz NOT NULL DEFAULT now(),
  remarks text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  created_by uuid, updated_by uuid, deleted_at timestamptz, deleted_by uuid
);
