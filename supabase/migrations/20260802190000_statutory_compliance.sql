-- Statutory and Financial Compliance Migration

DO $$ BEGIN
    CREATE TYPE statutory_report_type AS ENUM ('naac', 'ugc', 'aicte', 'gst', 'pf', 'esic', 'audit', 'other');
EXCEPTION WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE compliance_status AS ENUM ('pending', 'under_review', 'submitted', 'archived');
EXCEPTION WHEN duplicate_object THEN null;
END $$;

CREATE TABLE IF NOT EXISTS statutory_reports (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    campus_id UUID REFERENCES campuses(id) ON DELETE SET NULL,
    title TEXT NOT NULL,
    report_type statutory_report_type NOT NULL DEFAULT 'other',
    period_start DATE,
    period_end DATE,
    status compliance_status NOT NULL DEFAULT 'pending',
    document_url TEXT,
    notes TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    deleted_at TIMESTAMPTZ
);

-- Triggers for updated_at
DROP TRIGGER IF EXISTS set_updated_at_statutory_reports ON statutory_reports;
CREATE TRIGGER set_updated_at_statutory_reports BEFORE UPDATE ON statutory_reports FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- RLS
ALTER TABLE statutory_reports ENABLE ROW LEVEL SECURITY;

CREATE POLICY "tenant_isolation_statutory_reports" ON statutory_reports
    FOR ALL TO authenticated
    USING (tenant_id IN (SELECT public.user_tenant_ids()))
    WITH CHECK (tenant_id IN (SELECT public.user_tenant_ids()));
