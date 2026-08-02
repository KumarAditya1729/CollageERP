-- ==============================================================================
-- CampusOS Master Enterprise Audit Fix: Security, RLS & Performance Indexing
-- ==============================================================================
-- This final enforcement migration guarantees that ALL tables across all enterprise
-- modules (including modules created after the initial security patch) have:
-- 1. Row Level Security (RLS) explicitly enabled.
-- 2. Standardized tenant isolation RLS policies applied (USING + WITH CHECK).
-- 3. B-Tree Indexes automatically constructed on 'tenant_id' columns to prevent
--    sequential scans during RLS verification, dramatically improving query speed.
-- ==============================================================================

DO $$
DECLARE
    r RECORD;
    has_rls BOOLEAN;
    has_tenant_id BOOLEAN;
    policy_name TEXT;
    index_name TEXT;
    sql_stmt TEXT;
BEGIN
    FOR r IN
        SELECT tablename 
        FROM pg_tables 
        WHERE schemaname = 'public'
    LOOP
        -- 1. Enforce Row Level Security (RLS)
        SELECT relrowsecurity INTO has_rls FROM pg_class WHERE relname = r.tablename AND relnamespace = 'public'::regnamespace;
        IF NOT has_rls THEN
            sql_stmt := format('ALTER TABLE public.%I ENABLE ROW LEVEL SECURITY;', r.tablename);
            EXECUTE sql_stmt;
            RAISE NOTICE 'Enabled RLS on table: %', r.tablename;
        END IF;

        -- 2. Check for presence of 'tenant_id' column
        SELECT EXISTS (
            SELECT 1 
            FROM information_schema.columns 
            WHERE table_schema = 'public' 
              AND table_name = r.tablename 
              AND column_name = 'tenant_id'
        ) INTO has_tenant_id;

        -- 3. Apply Tenant Indexing & RLS Policies
        IF has_tenant_id THEN
            -- 3a. Performance Optimization: Automatically Index tenant_id for high-speed RLS joins
            index_name := 'idx_' || r.tablename || '_tenant_id';
            IF NOT EXISTS (
                SELECT 1 FROM pg_class c
                JOIN pg_namespace n ON n.oid = c.relnamespace
                WHERE n.nspname = 'public' AND c.relname = index_name AND c.relkind = 'i'
            ) THEN
                sql_stmt := format('CREATE INDEX IF NOT EXISTS %I ON public.%I(tenant_id);', index_name, r.tablename);
                EXECUTE sql_stmt;
                RAISE NOTICE 'Created tenant_id performance index on table: %', r.tablename;
            END IF;

            -- 3b. Security Optimization: Ensure standard tenant isolation policy exists
            policy_name := r.tablename || '_tenant_isolation_policy';
            IF NOT EXISTS (
                SELECT 1 FROM pg_policies 
                WHERE schemaname = 'public' AND tablename = r.tablename AND policyname = policy_name
            ) AND NOT EXISTS (
                SELECT 1 FROM pg_policies 
                WHERE schemaname = 'public' AND tablename = r.tablename AND policyname LIKE '%tenant%'
            ) THEN
                sql_stmt := format(
                    'CREATE POLICY %I ON public.%I FOR ALL TO authenticated USING (tenant_id IN (SELECT public.user_tenant_ids())) WITH CHECK (tenant_id IN (SELECT public.user_tenant_ids()));',
                    policy_name,
                    r.tablename
                );
                EXECUTE sql_stmt;
                RAISE NOTICE 'Created standard tenant isolation RLS policy for: %', r.tablename;
            END IF;
        ELSE
            -- 4. For global reference/lookup tables without tenant_id, ensure global authenticated read policy
            policy_name := r.tablename || '_global_read_policy';
            IF NOT EXISTS (
                SELECT 1 FROM pg_policies 
                WHERE schemaname = 'public' AND tablename = r.tablename AND policyname = policy_name
            ) AND NOT EXISTS (
                SELECT 1 FROM pg_policies 
                WHERE schemaname = 'public' AND tablename = r.tablename
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

-- Lock down helper functions to prevent unauthorized public execution
REVOKE EXECUTE ON FUNCTION public.user_tenant_ids(uuid) FROM anon, public;
GRANT EXECUTE ON FUNCTION public.user_tenant_ids(uuid) TO authenticated, service_role;
