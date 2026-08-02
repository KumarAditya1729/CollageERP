-- Design Studio Templates Migration

DO $$ BEGIN
    CREATE TYPE template_type AS ENUM ('certificate', 'id_card', 'document');
EXCEPTION WHEN duplicate_object THEN null;
END $$;

CREATE TABLE IF NOT EXISTS design_templates (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    campus_id UUID REFERENCES campuses(id) ON DELETE SET NULL,
    name TEXT NOT NULL,
    type template_type NOT NULL DEFAULT 'certificate',
    content JSONB NOT NULL DEFAULT '{}'::jsonb,
    is_active BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    deleted_at TIMESTAMPTZ
);

-- Triggers for updated_at
DROP TRIGGER IF EXISTS set_updated_at_design_templates ON design_templates;
CREATE TRIGGER set_updated_at_design_templates BEFORE UPDATE ON design_templates FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- RLS
ALTER TABLE design_templates ENABLE ROW LEVEL SECURITY;

CREATE POLICY "tenant_isolation_design_templates" ON design_templates
    FOR ALL TO authenticated
    USING (tenant_id IN (SELECT public.user_tenant_ids()))
    WITH CHECK (tenant_id IN (SELECT public.user_tenant_ids()));
