-- CRM Module Migration

CREATE TYPE crm_lead_source AS ENUM ('walk_in', 'website', 'referral', 'social_media', 'other');
CREATE TYPE crm_lead_status AS ENUM ('new', 'contacted', 'interested', 'applied', 'enrolled', 'closed_lost');
CREATE TYPE crm_followup_type AS ENUM ('call', 'email', 'meeting', 'whatsapp');

CREATE TABLE crm_leads (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    campus_id UUID REFERENCES campuses(id) ON DELETE SET NULL,
    first_name TEXT NOT NULL,
    last_name TEXT,
    email TEXT,
    phone TEXT,
    source crm_lead_source DEFAULT 'other',
    status crm_lead_status DEFAULT 'new',
    assigned_to UUID REFERENCES profiles(id) ON DELETE SET NULL,
    program_interest_id UUID REFERENCES programs(id) ON DELETE SET NULL,
    notes TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    deleted_at TIMESTAMPTZ
);

CREATE TABLE crm_followups (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    lead_id UUID NOT NULL REFERENCES crm_leads(id) ON DELETE CASCADE,
    date TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    type crm_followup_type NOT NULL,
    notes TEXT,
    next_followup_date TIMESTAMPTZ,
    logged_by UUID REFERENCES profiles(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Triggers for updated_at
CREATE TRIGGER set_updated_at_crm_leads BEFORE UPDATE ON crm_leads FOR EACH ROW EXECUTE FUNCTION public.set_current_timestamp_updated_at();
CREATE TRIGGER set_updated_at_crm_followups BEFORE UPDATE ON crm_followups FOR EACH ROW EXECUTE FUNCTION public.set_current_timestamp_updated_at();

-- RLS
ALTER TABLE crm_leads ENABLE ROW LEVEL SECURITY;
ALTER TABLE crm_followups ENABLE ROW LEVEL SECURITY;

CREATE POLICY "tenant_isolation_crm_leads" ON crm_leads
    FOR ALL TO authenticated
    USING (tenant_id IN (SELECT public.user_tenant_ids()))
    WITH CHECK (tenant_id IN (SELECT public.user_tenant_ids()));

CREATE POLICY "tenant_isolation_crm_followups" ON crm_followups
    FOR ALL TO authenticated
    USING (tenant_id IN (SELECT public.user_tenant_ids()))
    WITH CHECK (tenant_id IN (SELECT public.user_tenant_ids()));
