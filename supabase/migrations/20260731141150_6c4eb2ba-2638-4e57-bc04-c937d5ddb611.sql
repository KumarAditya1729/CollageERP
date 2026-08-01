ALTER TABLE public.tenant_settings
  ADD CONSTRAINT tenant_settings_unique_key
  UNIQUE NULLS NOT DISTINCT (tenant_id, campus_id, scope, key);