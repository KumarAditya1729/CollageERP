-- Phase 8: Enterprise Finance Platform

-- ============================================================================
-- ENUMS
-- ============================================================================

CREATE TYPE public.fee_frequency AS ENUM ('one_time', 'recurring', 'optional');
CREATE TYPE public.invoice_status AS ENUM ('draft', 'published', 'partial', 'paid', 'overdue', 'cancelled');
CREATE TYPE public.payment_mode AS ENUM ('cash', 'online', 'bank_transfer', 'demand_draft', 'cheque');
CREATE TYPE public.payment_status AS ENUM ('pending', 'successful', 'failed', 'refunded');
CREATE TYPE public.scholarship_type AS ENUM ('merit', 'need_based', 'sports', 'category');
CREATE TYPE public.discount_amount_type AS ENUM ('percentage', 'flat');
CREATE TYPE public.ledger_account_type AS ENUM ('asset', 'liability', 'equity', 'revenue', 'expense');

-- ============================================================================
-- 1. FEE STRUCTURE ENGINE
-- ============================================================================

CREATE TABLE public.finance_fee_categories (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  name text NOT NULL,
  description text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  created_by uuid,
  updated_by uuid,
  deleted_at timestamptz,
  deleted_by uuid
);

CREATE TABLE public.finance_fee_heads (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  name text NOT NULL,
  code text NOT NULL,
  description text,
  is_refundable boolean NOT NULL DEFAULT false,
  frequency public.fee_frequency NOT NULL DEFAULT 'one_time',
  tax_percent numeric(5, 2) NOT NULL DEFAULT 0.00,
  default_amount numeric(10, 2),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  created_by uuid,
  updated_by uuid,
  deleted_at timestamptz,
  deleted_by uuid
);

CREATE TABLE public.finance_fee_structures (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  program_id uuid NOT NULL REFERENCES public.programs(id) ON DELETE CASCADE,
  academic_year_id uuid NOT NULL REFERENCES public.academic_years(id) ON DELETE CASCADE,
  fee_category_id uuid REFERENCES public.finance_fee_categories(id) ON DELETE SET NULL,
  name text NOT NULL,
  total_amount numeric(12, 2) NOT NULL DEFAULT 0.00,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  created_by uuid,
  updated_by uuid,
  deleted_at timestamptz,
  deleted_by uuid
);

CREATE TABLE public.finance_fee_structure_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  fee_structure_id uuid NOT NULL REFERENCES public.finance_fee_structures(id) ON DELETE CASCADE,
  fee_head_id uuid NOT NULL REFERENCES public.finance_fee_heads(id) ON DELETE CASCADE,
  amount numeric(10, 2) NOT NULL,
  is_mandatory boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  created_by uuid,
  updated_by uuid,
  deleted_at timestamptz,
  deleted_by uuid
);

CREATE TABLE public.finance_installments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  fee_structure_id uuid NOT NULL REFERENCES public.finance_fee_structures(id) ON DELETE CASCADE,
  name text NOT NULL,
  due_date date NOT NULL,
  percentage numeric(5, 2) NOT NULL,
  late_fee_policy jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  created_by uuid,
  updated_by uuid,
  deleted_at timestamptz,
  deleted_by uuid
);

-- ============================================================================
-- 2. SCHOLARSHIPS & DISCOUNTS
-- ============================================================================

CREATE TABLE public.finance_scholarships (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  name text NOT NULL,
  code text NOT NULL,
  description text,
  type public.scholarship_type NOT NULL,
  amount_type public.discount_amount_type NOT NULL,
  amount_value numeric(10, 2) NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  created_by uuid,
  updated_by uuid,
  deleted_at timestamptz,
  deleted_by uuid
);

CREATE TABLE public.finance_student_scholarships (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  student_id uuid NOT NULL REFERENCES public.students(id) ON DELETE CASCADE,
  scholarship_id uuid NOT NULL REFERENCES public.finance_scholarships(id) ON DELETE CASCADE,
  academic_year_id uuid NOT NULL REFERENCES public.academic_years(id) ON DELETE CASCADE,
  status text NOT NULL DEFAULT 'active',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  created_by uuid,
  updated_by uuid,
  deleted_at timestamptz,
  deleted_by uuid
);

CREATE TABLE public.finance_discounts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  name text NOT NULL,
  description text,
  amount_type public.discount_amount_type NOT NULL,
  amount_value numeric(10, 2) NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  created_by uuid,
  updated_by uuid,
  deleted_at timestamptz,
  deleted_by uuid
);

-- ============================================================================
-- 3. STUDENT BILLING (INVOICES)
-- ============================================================================

CREATE TABLE public.finance_invoices (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  student_id uuid NOT NULL REFERENCES public.students(id) ON DELETE CASCADE,
  fee_structure_id uuid REFERENCES public.finance_fee_structures(id) ON DELETE SET NULL,
  installment_id uuid REFERENCES public.finance_installments(id) ON DELETE SET NULL,
  invoice_number text NOT NULL,
  invoice_date date NOT NULL,
  due_date date NOT NULL,
  subtotal numeric(12, 2) NOT NULL DEFAULT 0.00,
  tax_amount numeric(12, 2) NOT NULL DEFAULT 0.00,
  late_fee_amount numeric(10, 2) NOT NULL DEFAULT 0.00,
  discount_amount numeric(12, 2) NOT NULL DEFAULT 0.00,
  total_amount numeric(12, 2) NOT NULL DEFAULT 0.00,
  paid_amount numeric(12, 2) NOT NULL DEFAULT 0.00,
  balance_amount numeric(12, 2) NOT NULL DEFAULT 0.00,
  status public.invoice_status NOT NULL DEFAULT 'draft',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  created_by uuid,
  updated_by uuid,
  deleted_at timestamptz,
  deleted_by uuid
);

CREATE TABLE public.finance_invoice_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  invoice_id uuid NOT NULL REFERENCES public.finance_invoices(id) ON DELETE CASCADE,
  fee_head_id uuid NOT NULL REFERENCES public.finance_fee_heads(id) ON DELETE CASCADE,
  amount numeric(10, 2) NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  created_by uuid,
  updated_by uuid,
  deleted_at timestamptz,
  deleted_by uuid
);

-- ============================================================================
-- 4. PAYMENT ENGINE
-- ============================================================================

CREATE TABLE public.finance_payments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  student_id uuid NOT NULL REFERENCES public.students(id) ON DELETE CASCADE,
  receipt_number text NOT NULL,
  payment_date timestamptz NOT NULL DEFAULT now(),
  amount numeric(12, 2) NOT NULL,
  payment_mode public.payment_mode NOT NULL,
  reference_number text,
  gateway_response jsonb,
  status public.payment_status NOT NULL DEFAULT 'pending',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  created_by uuid,
  updated_by uuid,
  deleted_at timestamptz,
  deleted_by uuid
);

CREATE TABLE public.finance_payment_allocations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  payment_id uuid NOT NULL REFERENCES public.finance_payments(id) ON DELETE CASCADE,
  invoice_id uuid NOT NULL REFERENCES public.finance_invoices(id) ON DELETE CASCADE,
  amount numeric(10, 2) NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  created_by uuid,
  updated_by uuid,
  deleted_at timestamptz,
  deleted_by uuid
);

-- ============================================================================
-- 5. FINANCIAL LEDGER (DOUBLE-ENTRY)
-- ============================================================================

CREATE TABLE public.finance_ledgers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  parent_ledger_id uuid REFERENCES public.finance_ledgers(id) ON DELETE CASCADE,
  account_name text NOT NULL,
  account_code text NOT NULL,
  account_type public.ledger_account_type NOT NULL,
  is_group boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  created_by uuid,
  updated_by uuid,
  deleted_at timestamptz,
  deleted_by uuid
);

CREATE TABLE public.finance_transactions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  transaction_date date NOT NULL,
  reference_type text NOT NULL, -- 'invoice', 'payment', 'refund', 'journal'
  reference_id uuid, -- Can link to invoice_id or payment_id (no FK constraint to allow flexibility)
  description text,
  status text NOT NULL DEFAULT 'posted',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  created_by uuid,
  updated_by uuid,
  deleted_at timestamptz,
  deleted_by uuid
);

CREATE TABLE public.finance_transaction_entries (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  transaction_id uuid NOT NULL REFERENCES public.finance_transactions(id) ON DELETE CASCADE,
  ledger_id uuid NOT NULL REFERENCES public.finance_ledgers(id) ON DELETE CASCADE,
  debit_amount numeric(12, 2) NOT NULL DEFAULT 0.00,
  credit_amount numeric(12, 2) NOT NULL DEFAULT 0.00,
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

ALTER TABLE public.finance_fee_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.finance_fee_heads ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.finance_fee_structures ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.finance_fee_structure_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.finance_installments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.finance_scholarships ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.finance_student_scholarships ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.finance_discounts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.finance_invoices ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.finance_invoice_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.finance_payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.finance_payment_allocations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.finance_ledgers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.finance_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.finance_transaction_entries ENABLE ROW LEVEL SECURITY;

-- Base Tenant Policy
CREATE POLICY "Tenant isolation" ON public.finance_fee_categories FOR ALL USING (tenant_id = (current_setting('app.current_tenant_id', true))::uuid);
CREATE POLICY "Tenant isolation" ON public.finance_fee_heads FOR ALL USING (tenant_id = (current_setting('app.current_tenant_id', true))::uuid);
CREATE POLICY "Tenant isolation" ON public.finance_fee_structures FOR ALL USING (tenant_id = (current_setting('app.current_tenant_id', true))::uuid);
CREATE POLICY "Tenant isolation" ON public.finance_fee_structure_items FOR ALL USING (tenant_id = (current_setting('app.current_tenant_id', true))::uuid);
CREATE POLICY "Tenant isolation" ON public.finance_installments FOR ALL USING (tenant_id = (current_setting('app.current_tenant_id', true))::uuid);
CREATE POLICY "Tenant isolation" ON public.finance_scholarships FOR ALL USING (tenant_id = (current_setting('app.current_tenant_id', true))::uuid);
CREATE POLICY "Tenant isolation" ON public.finance_student_scholarships FOR ALL USING (tenant_id = (current_setting('app.current_tenant_id', true))::uuid);
CREATE POLICY "Tenant isolation" ON public.finance_discounts FOR ALL USING (tenant_id = (current_setting('app.current_tenant_id', true))::uuid);
CREATE POLICY "Tenant isolation" ON public.finance_invoices FOR ALL USING (tenant_id = (current_setting('app.current_tenant_id', true))::uuid);
CREATE POLICY "Tenant isolation" ON public.finance_invoice_items FOR ALL USING (tenant_id = (current_setting('app.current_tenant_id', true))::uuid);
CREATE POLICY "Tenant isolation" ON public.finance_payments FOR ALL USING (tenant_id = (current_setting('app.current_tenant_id', true))::uuid);
CREATE POLICY "Tenant isolation" ON public.finance_payment_allocations FOR ALL USING (tenant_id = (current_setting('app.current_tenant_id', true))::uuid);
CREATE POLICY "Tenant isolation" ON public.finance_ledgers FOR ALL USING (tenant_id = (current_setting('app.current_tenant_id', true))::uuid);
CREATE POLICY "Tenant isolation" ON public.finance_transactions FOR ALL USING (tenant_id = (current_setting('app.current_tenant_id', true))::uuid);
CREATE POLICY "Tenant isolation" ON public.finance_transaction_entries FOR ALL USING (tenant_id = (current_setting('app.current_tenant_id', true))::uuid);
