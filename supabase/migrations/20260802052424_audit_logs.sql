-- ==============================================================================
-- Enterprise Security Patch: Audit Trails
-- ==============================================================================
-- Centralized logging for highly sensitive tables.
-- ==============================================================================

CREATE TABLE public.audit_logs (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id uuid REFERENCES public.tenants(id) ON DELETE CASCADE,
    table_name text NOT NULL,
    record_id text NOT NULL,
    action text NOT NULL CHECK (action IN ('INSERT', 'UPDATE', 'DELETE')),
    old_data jsonb,
    new_data jsonb,
    changed_by uuid REFERENCES auth.users(id),
    changed_at timestamptz NOT NULL DEFAULT now()
);

-- RLS & Policies
ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "audit_logs_read_tenant" ON public.audit_logs 
FOR SELECT TO authenticated 
USING (tenant_id IN (SELECT public.user_tenant_ids()));

-- Prevent tampering (no one can delete or update audit logs, not even admins)
CREATE POLICY "audit_logs_insert_tenant" ON public.audit_logs 
FOR INSERT TO authenticated 
WITH CHECK (tenant_id IN (SELECT public.user_tenant_ids()));

-- Generic Trigger Function
CREATE OR REPLACE FUNCTION public.process_audit_log()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
    _tenant_id uuid;
    _record_id text;
BEGIN
    -- Extract tenant_id from the modified row (assume all audited tables have tenant_id)
    IF TG_OP = 'DELETE' THEN
        _tenant_id := OLD.tenant_id;
        _record_id := OLD.id::text;
    ELSE
        _tenant_id := NEW.tenant_id;
        _record_id := NEW.id::text;
    END IF;

    IF TG_OP = 'INSERT' THEN
        INSERT INTO public.audit_logs (tenant_id, table_name, record_id, action, old_data, new_data, changed_by)
        VALUES (_tenant_id, TG_TABLE_NAME::text, _record_id, TG_OP, NULL, to_jsonb(NEW), auth.uid());
        RETURN NEW;
    ELSIF TG_OP = 'UPDATE' THEN
        -- Only log if something actually changed
        IF OLD IS DISTINCT FROM NEW THEN
            INSERT INTO public.audit_logs (tenant_id, table_name, record_id, action, old_data, new_data, changed_by)
            VALUES (_tenant_id, TG_TABLE_NAME::text, _record_id, TG_OP, to_jsonb(OLD), to_jsonb(NEW), auth.uid());
        END IF;
        RETURN NEW;
    ELSIF TG_OP = 'DELETE' THEN
        INSERT INTO public.audit_logs (tenant_id, table_name, record_id, action, old_data, new_data, changed_by)
        VALUES (_tenant_id, TG_TABLE_NAME::text, _record_id, TG_OP, to_jsonb(OLD), NULL, auth.uid());
        RETURN OLD;
    END IF;
    RETURN NULL;
END;
$$;

-- Attach Triggers to Highly Sensitive Tables

DROP TRIGGER IF EXISTS audit_hr_payslips_trigger ON public.hr_payslips;
CREATE TRIGGER audit_hr_payslips_trigger
AFTER INSERT OR UPDATE OR DELETE ON public.hr_payslips
FOR EACH ROW EXECUTE FUNCTION public.process_audit_log();

DROP TRIGGER IF EXISTS audit_hr_salary_assignments_trigger ON public.hr_salary_assignments;
CREATE TRIGGER audit_hr_salary_assignments_trigger
AFTER INSERT OR UPDATE OR DELETE ON public.hr_salary_assignments
FOR EACH ROW EXECUTE FUNCTION public.process_audit_log();

DROP TRIGGER IF EXISTS audit_finance_vendor_invoices_trigger ON public.finance_vendor_invoices;
CREATE TRIGGER audit_finance_vendor_invoices_trigger
AFTER INSERT OR UPDATE OR DELETE ON public.finance_vendor_invoices
FOR EACH ROW EXECUTE FUNCTION public.process_audit_log();

DROP TRIGGER IF EXISTS audit_hos_fees_trigger ON public.hos_fees;
CREATE TRIGGER audit_hos_fees_trigger
AFTER INSERT OR UPDATE OR DELETE ON public.hos_fees
FOR EACH ROW EXECUTE FUNCTION public.process_audit_log();
