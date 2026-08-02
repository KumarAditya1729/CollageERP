-- ==============================================================================
-- Enterprise Security Patch: Dynamic RLS & Tenant Policies
-- ==============================================================================
-- This script sweeps the entire 'public' schema to find tables without RLS
-- and enables it. If the table has a 'tenant_id' column, it also creates a
-- standard tenant isolation policy to prevent cross-tenant data leaks.
-- ==============================================================================

DO $$
DECLARE
    r RECORD;
    has_tenant_id BOOLEAN;
    policy_name TEXT;
    sql_stmt TEXT;
BEGIN
    FOR r IN
        SELECT tablename 
        FROM pg_tables 
        WHERE schemaname = 'public'
    LOOP
        -- 1. Enable RLS if not already enabled
        SELECT relrowsecurity INTO has_tenant_id FROM pg_class WHERE relname = r.tablename AND relnamespace = 'public'::regnamespace;
        IF NOT has_tenant_id THEN
            sql_stmt := format('ALTER TABLE public.%I ENABLE ROW LEVEL SECURITY;', r.tablename);
            EXECUTE sql_stmt;
            RAISE NOTICE 'Enabled RLS on table: %', r.tablename;
        END IF;

        -- 2. Check if table has tenant_id column
        SELECT EXISTS (
            SELECT 1 
            FROM information_schema.columns 
            WHERE table_schema = 'public' 
              AND table_name = r.tablename 
              AND column_name = 'tenant_id'
        ) INTO has_tenant_id;

        -- 3. If it has tenant_id, apply the standard isolation policy
        IF has_tenant_id THEN
            policy_name := r.tablename || '_tenant_isolation_policy';
            
            -- Check if policy already exists
            IF NOT EXISTS (
                SELECT 1 FROM pg_policies 
                WHERE schemaname = 'public' AND tablename = r.tablename AND policyname = policy_name
            ) THEN
                sql_stmt := format(
                    'CREATE POLICY %I ON public.%I FOR ALL TO authenticated USING (tenant_id IN (SELECT public.user_tenant_ids())) WITH CHECK (tenant_id IN (SELECT public.user_tenant_ids()));',
                    policy_name,
                    r.tablename
                );
                EXECUTE sql_stmt;
                RAISE NOTICE 'Created tenant isolation policy for: %', r.tablename;
            END IF;
        ELSE
            -- 4. If it DOES NOT have tenant_id, it is likely a global lookup table (e.g., permissions, roles)
            -- We must grant global SELECT access so the application doesn't break, 
            -- but restrict mutations to superusers only.
            policy_name := r.tablename || '_global_read_policy';
            
            IF NOT EXISTS (
                SELECT 1 FROM pg_policies 
                WHERE schemaname = 'public' AND tablename = r.tablename AND policyname = policy_name
            ) THEN
                sql_stmt := format(
                    'CREATE POLICY %I ON public.%I FOR SELECT TO authenticated USING (true);',
                    policy_name,
                    r.tablename
                );
                EXECUTE sql_stmt;
                RAISE NOTICE 'Created global read policy for non-tenant table: %', r.tablename;
            END IF;
        END IF;

    END LOOP;
END $$;
