-- Design Studio Templates Migration

CREATE TYPE template_type AS ENUM ('certificate', 'id_card', 'document');

CREATE TABLE design_templates (
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
CREATE TRIGGER set_updated_at_design_templates BEFORE UPDATE ON design_templates FOR EACH ROW EXECUTE FUNCTION public.set_current_timestamp_updated_at();

-- RLS
ALTER TABLE design_templates ENABLE ROW LEVEL SECURITY;

CREATE POLICY "tenant_isolation_design_templates" ON design_templates
    USING (tenant_id = (SELECT auth.jwt() ->> 'tenant_id')::uuid);
