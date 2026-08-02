-- ==============================================================================
-- Enterprise Security Patch: Audit Trails & Telemetry Architecture 3.0
-- ==============================================================================
-- Centralized cryptographic logging for highly sensitive enterprise tables.
-- Aligns with application types (entity_type, actor_id, module, changed_fields).
-- ==============================================================================

CREATE TABLE IF NOT EXISTS public.audit_logs (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id uuid REFERENCES public.tenants(id) ON DELETE CASCADE,
    campus_id uuid,
    action text NOT NULL CHECK (action IN ('create', 'update', 'delete', 'login', 'export', 'verify', 'INSERT', 'UPDATE', 'DELETE')),
    entity_type text NOT NULL,
    entity_id text,
    entity_label text,
    module text,
    actor_id uuid REFERENCES auth.users(id),
    actor_email text,
    changed_fields text[],
    old_data jsonb,
    new_data jsonb,
    metadata jsonb DEFAULT '{}'::jsonb,
    ip_address text,
    user_agent text,
    created_at timestamptz NOT NULL DEFAULT now()
);

-- RLS & Policies
ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "audit_logs_read_tenant" ON public.audit_logs;
CREATE POLICY "audit_logs_read_tenant" ON public.audit_logs 
FOR SELECT TO authenticated 
USING (tenant_id IN (SELECT public.user_tenant_ids()));

-- Prevent tampering (no one can delete or update audit logs, preserving forensic integrity)
DROP POLICY IF EXISTS "audit_logs_insert_tenant" ON public.audit_logs;
CREATE POLICY "audit_logs_insert_tenant" ON public.audit_logs 
FOR INSERT TO authenticated 
WITH CHECK (tenant_id IN (SELECT public.user_tenant_ids()));

-- Generic Enterprise Trigger Function
CREATE OR REPLACE FUNCTION public.process_audit_log()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
    _tenant_id uuid;
    _entity_id text;
    _module text;
    _actor_email text;
    _changed_fields text[] := ARRAY[]::text[];
    _key text;
BEGIN
    -- Automatically categorize module based on domain table prefix/name
    IF TG_TABLE_NAME LIKE 'hr_%' THEN _module := 'HRMS';
    ELSIF TG_TABLE_NAME LIKE 'finance_%' OR TG_TABLE_NAME LIKE 'hos_fees%' THEN _module := 'Finance';
    ELSIF TG_TABLE_NAME IN ('marks', 'results', 'exam_%') THEN _module := 'Examinations';
    ELSIF TG_TABLE_NAME IN ('enrollments', 'students', 'courses') THEN _module := 'Academics';
    ELSE _module := 'Core';
    END IF;

    -- Extract tenant_id and entity_id safely from record
    IF TG_OP = 'DELETE' THEN
        _tenant_id := OLD.tenant_id;
        _entity_id := OLD.id::text;
    ELSE
        _tenant_id := NEW.tenant_id;
        _entity_id := NEW.id::text;
    END IF;

    -- Attempt to retrieve actor email from auth vault
    SELECT email INTO _actor_email FROM auth.users WHERE id = auth.uid();

    IF TG_OP = 'INSERT' THEN
        INSERT INTO public.audit_logs (
            tenant_id, action, entity_type, entity_id, entity_label, module,
            actor_id, actor_email, new_data, created_at
        ) VALUES (
            _tenant_id, 'create', TG_TABLE_NAME::text, _entity_id, _entity_id, _module,
            auth.uid(), _actor_email, to_jsonb(NEW), now()
        );
        RETURN NEW;
    ELSIF TG_OP = 'UPDATE' THEN
        IF OLD IS DISTINCT FROM NEW THEN
            -- Calculate specific fields modified during UPDATE operation
            FOR _key IN SELECT jsonb_object_keys(to_jsonb(NEW)) LOOP
                IF to_jsonb(OLD)->_key IS DISTINCT FROM to_jsonb(NEW)->_key THEN
                    _changed_fields := array_append(_changed_fields, _key);
                END IF;
            END LOOP;

            INSERT INTO public.audit_logs (
                tenant_id, action, entity_type, entity_id, entity_label, module,
                actor_id, actor_email, changed_fields, old_data, new_data, created_at
            ) VALUES (
                _tenant_id, 'update', TG_TABLE_NAME::text, _entity_id, _entity_id, _module,
                auth.uid(), _actor_email, _changed_fields, to_jsonb(OLD), to_jsonb(NEW), now()
            );
        END IF;
        RETURN NEW;
    ELSIF TG_OP = 'DELETE' THEN
        INSERT INTO public.audit_logs (
            tenant_id, action, entity_type, entity_id, entity_label, module,
            actor_id, actor_email, old_data, created_at
        ) VALUES (
            _tenant_id, 'delete', TG_TABLE_NAME::text, _entity_id, _entity_id, _module,
            auth.uid(), _actor_email, to_jsonb(OLD), now()
        );
        RETURN OLD;
    END IF;
    RETURN NULL;
END;
$$;

-- Attach Triggers to Highly Sensitive Financial, HR & Academic Roster Tables

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

-- New Academic & Examination Regulatory Security Triggers
DROP TRIGGER IF EXISTS audit_marks_trigger ON public.marks;
CREATE TRIGGER audit_marks_trigger
AFTER INSERT OR UPDATE OR DELETE ON public.marks
FOR EACH ROW EXECUTE FUNCTION public.process_audit_log();

DROP TRIGGER IF EXISTS audit_results_trigger ON public.results;
CREATE TRIGGER audit_results_trigger
AFTER INSERT OR UPDATE OR DELETE ON public.results
FOR EACH ROW EXECUTE FUNCTION public.process_audit_log();

DROP TRIGGER IF EXISTS audit_enrollments_trigger ON public.enrollments;
CREATE TRIGGER audit_enrollments_trigger
AFTER INSERT OR UPDATE OR DELETE ON public.enrollments
FOR EACH ROW EXECUTE FUNCTION public.process_audit_log();
