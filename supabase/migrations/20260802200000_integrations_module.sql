-- Deep Integrations Migration (WhatsApp, Payment Gateways, Biometric Hardware)

CREATE TYPE integration_category AS ENUM ('payment', 'communication', 'biometrics', 'lms', 'meeting');
CREATE TYPE integration_status AS ENUM ('connected', 'error', 'disconnected', 'pending');

CREATE TABLE tenant_integrations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    campus_id UUID REFERENCES campuses(id) ON DELETE SET NULL,
    category integration_category NOT NULL,
    provider_name TEXT NOT NULL,
    display_name TEXT NOT NULL,
    config JSONB NOT NULL DEFAULT '{}'::jsonb,
    is_enabled BOOLEAN NOT NULL DEFAULT false,
    status integration_status NOT NULL DEFAULT 'disconnected',
    last_sync_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    deleted_at TIMESTAMPTZ
);

CREATE TABLE integration_webhooks (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    integration_id UUID NOT NULL REFERENCES tenant_integrations(id) ON DELETE CASCADE,
    event_type TEXT NOT NULL,
    endpoint_url TEXT NOT NULL,
    secret_key TEXT,
    is_active BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Triggers for updated_at
CREATE TRIGGER set_updated_at_tenant_integrations BEFORE UPDATE ON tenant_integrations FOR EACH ROW EXECUTE FUNCTION public.set_current_timestamp_updated_at();

-- RLS
ALTER TABLE tenant_integrations ENABLE ROW LEVEL SECURITY;
ALTER TABLE integration_webhooks ENABLE ROW LEVEL SECURITY;

CREATE POLICY "tenant_isolation_tenant_integrations" ON tenant_integrations
    FOR ALL TO authenticated
    USING (tenant_id IN (SELECT public.user_tenant_ids()))
    WITH CHECK (tenant_id IN (SELECT public.user_tenant_ids()));

CREATE POLICY "tenant_isolation_integration_webhooks" ON integration_webhooks
    FOR ALL TO authenticated
    USING (tenant_id IN (SELECT public.user_tenant_ids()))
    WITH CHECK (tenant_id IN (SELECT public.user_tenant_ids()));
