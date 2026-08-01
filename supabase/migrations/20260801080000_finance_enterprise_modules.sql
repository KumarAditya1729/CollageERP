-- Phase 8.1: Enterprise Finance Completion (Budgets, Procurement, Assets, etc.)

-- ============================================================================
-- ENUMS
-- ============================================================================
CREATE TYPE public.budget_type AS ENUM ('annual', 'department', 'program', 'project');
CREATE TYPE public.purchase_request_status AS ENUM ('draft', 'pending_approval', 'approved', 'rejected', 'po_created');
CREATE TYPE public.purchase_order_status AS ENUM ('draft', 'sent_to_vendor', 'partially_received', 'received', 'cancelled');
CREATE TYPE public.vendor_invoice_status AS ENUM ('draft', 'pending_approval', 'approved', 'paid', 'partially_paid');
CREATE TYPE public.asset_status AS ENUM ('active', 'maintenance', 'disposed', 'sold', 'lost');
CREATE TYPE public.bank_reconciliation_status AS ENUM ('pending', 'matched', 'unmatched', 'reconciled');
CREATE TYPE public.tax_type AS ENUM ('gst', 'tds', 'vat');

-- ============================================================================
-- 1. BUDGET MANAGEMENT
-- ============================================================================
CREATE TABLE public.finance_budgets (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  academic_year_id uuid NOT NULL REFERENCES public.academic_years(id) ON DELETE CASCADE,
  name text NOT NULL,
  type public.budget_type NOT NULL,
  department_id uuid REFERENCES public.departments(id) ON DELETE CASCADE,
  program_id uuid REFERENCES public.programs(id) ON DELETE CASCADE,
  total_amount numeric(14, 2) NOT NULL DEFAULT 0.00,
  start_date date NOT NULL,
  end_date date NOT NULL,
  status text NOT NULL DEFAULT 'draft',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  created_by uuid,
  updated_by uuid,
  deleted_at timestamptz,
  deleted_by uuid
);

CREATE TABLE public.finance_budget_allocations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  budget_id uuid NOT NULL REFERENCES public.finance_budgets(id) ON DELETE CASCADE,
  ledger_id uuid NOT NULL REFERENCES public.finance_ledgers(id) ON DELETE CASCADE,
  amount numeric(14, 2) NOT NULL DEFAULT 0.00,
  notes text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  created_by uuid,
  updated_by uuid,
  deleted_at timestamptz,
  deleted_by uuid
);

-- ============================================================================
-- 2. VENDOR MANAGEMENT
-- ============================================================================
CREATE TABLE public.finance_vendors (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  name text NOT NULL,
  contact_person text,
  email text,
  phone text,
  address text,
  tax_number text,
  bank_details jsonb,
  performance_rating numeric(3, 2),
  status text NOT NULL DEFAULT 'active',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  created_by uuid,
  updated_by uuid,
  deleted_at timestamptz,
  deleted_by uuid
);

CREATE TABLE public.finance_vendor_documents (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  vendor_id uuid NOT NULL REFERENCES public.finance_vendors(id) ON DELETE CASCADE,
  document_type text NOT NULL,
  document_url text NOT NULL,
  verified boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  created_by uuid,
  updated_by uuid,
  deleted_at timestamptz,
  deleted_by uuid
);

-- ============================================================================
-- 3. PROCUREMENT
-- ============================================================================
CREATE TABLE public.finance_purchase_requests (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  department_id uuid REFERENCES public.departments(id) ON DELETE CASCADE,
  requested_by uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  request_date date NOT NULL,
  required_by_date date NOT NULL,
  reason text,
  status public.purchase_request_status NOT NULL DEFAULT 'draft',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  created_by uuid,
  updated_by uuid,
  deleted_at timestamptz,
  deleted_by uuid
);

CREATE TABLE public.finance_purchase_request_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  pr_id uuid NOT NULL REFERENCES public.finance_purchase_requests(id) ON DELETE CASCADE,
  item_description text NOT NULL,
  quantity integer NOT NULL,
  estimated_unit_price numeric(12, 2) NOT NULL,
  total_estimated numeric(12, 2) NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  created_by uuid,
  updated_by uuid,
  deleted_at timestamptz,
  deleted_by uuid
);

CREATE TABLE public.finance_purchase_orders (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  pr_id uuid REFERENCES public.finance_purchase_requests(id) ON DELETE SET NULL,
  vendor_id uuid NOT NULL REFERENCES public.finance_vendors(id) ON DELETE CASCADE,
  po_number text NOT NULL,
  po_date date NOT NULL,
  delivery_date date,
  total_amount numeric(12, 2) NOT NULL DEFAULT 0.00,
  tax_amount numeric(12, 2) NOT NULL DEFAULT 0.00,
  status public.purchase_order_status NOT NULL DEFAULT 'draft',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  created_by uuid,
  updated_by uuid,
  deleted_at timestamptz,
  deleted_by uuid
);

CREATE TABLE public.finance_po_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  po_id uuid NOT NULL REFERENCES public.finance_purchase_orders(id) ON DELETE CASCADE,
  item_description text NOT NULL,
  quantity integer NOT NULL,
  unit_price numeric(12, 2) NOT NULL,
  tax_percent numeric(5, 2) NOT NULL DEFAULT 0.00,
  tax_amount numeric(12, 2) NOT NULL DEFAULT 0.00,
  total_amount numeric(12, 2) NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  created_by uuid,
  updated_by uuid,
  deleted_at timestamptz,
  deleted_by uuid
);

CREATE TABLE public.finance_goods_receipts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  po_id uuid NOT NULL REFERENCES public.finance_purchase_orders(id) ON DELETE CASCADE,
  grn_number text NOT NULL,
  receipt_date date NOT NULL,
  received_by uuid NOT NULL REFERENCES auth.users(id),
  notes text,
  status text NOT NULL DEFAULT 'completed',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  created_by uuid,
  updated_by uuid,
  deleted_at timestamptz,
  deleted_by uuid
);

CREATE TABLE public.finance_vendor_invoices (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  po_id uuid REFERENCES public.finance_purchase_orders(id) ON DELETE SET NULL,
  vendor_id uuid NOT NULL REFERENCES public.finance_vendors(id) ON DELETE CASCADE,
  invoice_number text NOT NULL,
  invoice_date date NOT NULL,
  due_date date NOT NULL,
  total_amount numeric(12, 2) NOT NULL,
  tax_amount numeric(12, 2) NOT NULL DEFAULT 0.00,
  status public.vendor_invoice_status NOT NULL DEFAULT 'draft',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  created_by uuid,
  updated_by uuid,
  deleted_at timestamptz,
  deleted_by uuid
);

-- ============================================================================
-- 4. FIXED ASSETS
-- ============================================================================
CREATE TABLE public.finance_assets (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  name text NOT NULL,
  description text,
  asset_code text NOT NULL,
  category text NOT NULL,
  purchase_date date NOT NULL,
  purchase_cost numeric(14, 2) NOT NULL,
  current_value numeric(14, 2) NOT NULL,
  vendor_id uuid REFERENCES public.finance_vendors(id) ON DELETE SET NULL,
  location text,
  depreciation_method text,
  depreciation_rate numeric(5, 2),
  status public.asset_status NOT NULL DEFAULT 'active',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  created_by uuid,
  updated_by uuid,
  deleted_at timestamptz,
  deleted_by uuid
);

CREATE TABLE public.finance_asset_depreciations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  asset_id uuid NOT NULL REFERENCES public.finance_assets(id) ON DELETE CASCADE,
  depreciation_date date NOT NULL,
  amount numeric(12, 2) NOT NULL,
  new_value numeric(14, 2) NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  created_by uuid,
  updated_by uuid,
  deleted_at timestamptz,
  deleted_by uuid
);

CREATE TABLE public.finance_asset_maintenance (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  asset_id uuid NOT NULL REFERENCES public.finance_assets(id) ON DELETE CASCADE,
  vendor_id uuid REFERENCES public.finance_vendors(id) ON DELETE SET NULL,
  maintenance_date date NOT NULL,
  cost numeric(12, 2) NOT NULL,
  description text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  created_by uuid,
  updated_by uuid,
  deleted_at timestamptz,
  deleted_by uuid
);

-- ============================================================================
-- 5. BANK RECONCILIATION
-- ============================================================================
CREATE TABLE public.finance_bank_accounts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  ledger_id uuid NOT NULL REFERENCES public.finance_ledgers(id) ON DELETE CASCADE,
  bank_name text NOT NULL,
  account_number text NOT NULL,
  ifsc_code text,
  branch text,
  current_balance numeric(14, 2) NOT NULL DEFAULT 0.00,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  created_by uuid,
  updated_by uuid,
  deleted_at timestamptz,
  deleted_by uuid
);

CREATE TABLE public.finance_bank_statements (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  bank_account_id uuid NOT NULL REFERENCES public.finance_bank_accounts(id) ON DELETE CASCADE,
  statement_date date NOT NULL,
  import_date timestamptz NOT NULL DEFAULT now(),
  file_url text,
  closing_balance numeric(14, 2) NOT NULL,
  status text NOT NULL DEFAULT 'imported',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  created_by uuid,
  updated_by uuid,
  deleted_at timestamptz,
  deleted_by uuid
);

CREATE TABLE public.finance_bank_reconciliations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  statement_id uuid NOT NULL REFERENCES public.finance_bank_statements(id) ON DELETE CASCADE,
  transaction_id uuid REFERENCES public.finance_transactions(id) ON DELETE SET NULL,
  bank_date date NOT NULL,
  bank_reference text,
  amount numeric(14, 2) NOT NULL,
  type text NOT NULL, -- 'credit' or 'debit'
  status public.bank_reconciliation_status NOT NULL DEFAULT 'pending',
  match_date timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  created_by uuid,
  updated_by uuid,
  deleted_at timestamptz,
  deleted_by uuid
);

-- ============================================================================
-- 6. TAXATION
-- ============================================================================
CREATE TABLE public.finance_tax_rules (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  name text NOT NULL,
  type public.tax_type NOT NULL,
  percentage numeric(5, 2) NOT NULL,
  ledger_id uuid NOT NULL REFERENCES public.finance_ledgers(id) ON DELETE CASCADE,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  created_by uuid,
  updated_by uuid,
  deleted_at timestamptz,
  deleted_by uuid
);

CREATE TABLE public.finance_tax_certificates (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  tax_rule_id uuid NOT NULL REFERENCES public.finance_tax_rules(id) ON DELETE CASCADE,
  vendor_id uuid REFERENCES public.finance_vendors(id) ON DELETE SET NULL,
  student_id uuid REFERENCES public.students(id) ON DELETE SET NULL,
  certificate_number text NOT NULL,
  issue_date date NOT NULL,
  amount numeric(12, 2) NOT NULL,
  document_url text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  created_by uuid,
  updated_by uuid,
  deleted_at timestamptz,
  deleted_by uuid
);

-- ============================================================================
-- 7. REFUNDS
-- ============================================================================
CREATE TABLE public.finance_refund_requests (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  student_id uuid NOT NULL REFERENCES public.students(id) ON DELETE CASCADE,
  invoice_id uuid REFERENCES public.finance_invoices(id) ON DELETE SET NULL,
  payment_id uuid REFERENCES public.finance_payments(id) ON DELETE SET NULL,
  amount numeric(12, 2) NOT NULL,
  reason text NOT NULL,
  status text NOT NULL DEFAULT 'pending_approval',
  approved_by uuid REFERENCES auth.users(id),
  refund_date date,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  created_by uuid,
  updated_by uuid,
  deleted_at timestamptz,
  deleted_by uuid
);

-- ============================================================================
-- ENABLE RLS
-- ============================================================================
ALTER TABLE public.finance_budgets ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.finance_budget_allocations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.finance_vendors ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.finance_vendor_documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.finance_purchase_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.finance_purchase_request_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.finance_purchase_orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.finance_po_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.finance_goods_receipts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.finance_vendor_invoices ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.finance_assets ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.finance_asset_depreciations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.finance_asset_maintenance ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.finance_bank_accounts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.finance_bank_statements ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.finance_bank_reconciliations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.finance_tax_rules ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.finance_tax_certificates ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.finance_refund_requests ENABLE ROW LEVEL SECURITY;

-- Base Tenant Policy
CREATE POLICY "Tenant isolation" ON public.finance_budgets FOR ALL USING (tenant_id = (current_setting('app.current_tenant_id', true))::uuid);
CREATE POLICY "Tenant isolation" ON public.finance_budget_allocations FOR ALL USING (tenant_id = (current_setting('app.current_tenant_id', true))::uuid);
CREATE POLICY "Tenant isolation" ON public.finance_vendors FOR ALL USING (tenant_id = (current_setting('app.current_tenant_id', true))::uuid);
CREATE POLICY "Tenant isolation" ON public.finance_vendor_documents FOR ALL USING (tenant_id = (current_setting('app.current_tenant_id', true))::uuid);
CREATE POLICY "Tenant isolation" ON public.finance_purchase_requests FOR ALL USING (tenant_id = (current_setting('app.current_tenant_id', true))::uuid);
CREATE POLICY "Tenant isolation" ON public.finance_purchase_request_items FOR ALL USING (tenant_id = (current_setting('app.current_tenant_id', true))::uuid);
CREATE POLICY "Tenant isolation" ON public.finance_purchase_orders FOR ALL USING (tenant_id = (current_setting('app.current_tenant_id', true))::uuid);
CREATE POLICY "Tenant isolation" ON public.finance_po_items FOR ALL USING (tenant_id = (current_setting('app.current_tenant_id', true))::uuid);
CREATE POLICY "Tenant isolation" ON public.finance_goods_receipts FOR ALL USING (tenant_id = (current_setting('app.current_tenant_id', true))::uuid);
CREATE POLICY "Tenant isolation" ON public.finance_vendor_invoices FOR ALL USING (tenant_id = (current_setting('app.current_tenant_id', true))::uuid);
CREATE POLICY "Tenant isolation" ON public.finance_assets FOR ALL USING (tenant_id = (current_setting('app.current_tenant_id', true))::uuid);
CREATE POLICY "Tenant isolation" ON public.finance_asset_depreciations FOR ALL USING (tenant_id = (current_setting('app.current_tenant_id', true))::uuid);
CREATE POLICY "Tenant isolation" ON public.finance_asset_maintenance FOR ALL USING (tenant_id = (current_setting('app.current_tenant_id', true))::uuid);
CREATE POLICY "Tenant isolation" ON public.finance_bank_accounts FOR ALL USING (tenant_id = (current_setting('app.current_tenant_id', true))::uuid);
CREATE POLICY "Tenant isolation" ON public.finance_bank_statements FOR ALL USING (tenant_id = (current_setting('app.current_tenant_id', true))::uuid);
CREATE POLICY "Tenant isolation" ON public.finance_bank_reconciliations FOR ALL USING (tenant_id = (current_setting('app.current_tenant_id', true))::uuid);
CREATE POLICY "Tenant isolation" ON public.finance_tax_rules FOR ALL USING (tenant_id = (current_setting('app.current_tenant_id', true))::uuid);
CREATE POLICY "Tenant isolation" ON public.finance_tax_certificates FOR ALL USING (tenant_id = (current_setting('app.current_tenant_id', true))::uuid);
CREATE POLICY "Tenant isolation" ON public.finance_refund_requests FOR ALL USING (tenant_id = (current_setting('app.current_tenant_id', true))::uuid);
