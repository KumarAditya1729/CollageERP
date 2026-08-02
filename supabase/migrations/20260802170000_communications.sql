-- Communications Module Migration

DO $$ BEGIN
    CREATE TYPE communication_type AS ENUM ('circular', 'email', 'sms');
EXCEPTION WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE communication_status AS ENUM ('draft', 'sent', 'scheduled');
EXCEPTION WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE recipient_status AS ENUM ('pending', 'delivered', 'failed');
EXCEPTION WHEN duplicate_object THEN null;
END $$;

CREATE TABLE IF NOT EXISTS communications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    campus_id UUID REFERENCES campuses(id) ON DELETE SET NULL,
    title TEXT NOT NULL,
    content TEXT,
    type communication_type DEFAULT 'circular',
    status communication_status DEFAULT 'draft',
    sent_by UUID REFERENCES profiles(id) ON DELETE SET NULL,
    sent_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    deleted_at TIMESTAMPTZ
);

CREATE TABLE IF NOT EXISTS communication_recipients (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    communication_id UUID NOT NULL REFERENCES communications(id) ON DELETE CASCADE,
    recipient_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    read_at TIMESTAMPTZ,
    status recipient_status DEFAULT 'pending',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Triggers for updated_at
DROP TRIGGER IF EXISTS set_updated_at_communications ON communications;
CREATE TRIGGER set_updated_at_communications BEFORE UPDATE ON communications FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
DROP TRIGGER IF EXISTS set_updated_at_communication_recipients ON communication_recipients;
CREATE TRIGGER set_updated_at_communication_recipients BEFORE UPDATE ON communication_recipients FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- RLS
ALTER TABLE communications ENABLE ROW LEVEL SECURITY;
ALTER TABLE communication_recipients ENABLE ROW LEVEL SECURITY;

CREATE POLICY "tenant_isolation_communications" ON communications
    FOR ALL TO authenticated
    USING (tenant_id IN (SELECT public.user_tenant_ids()))
    WITH CHECK (tenant_id IN (SELECT public.user_tenant_ids()));

CREATE POLICY "tenant_isolation_communication_recipients" ON communication_recipients
    FOR ALL TO authenticated
    USING (tenant_id IN (SELECT public.user_tenant_ids()))
    WITH CHECK (tenant_id IN (SELECT public.user_tenant_ids()));
