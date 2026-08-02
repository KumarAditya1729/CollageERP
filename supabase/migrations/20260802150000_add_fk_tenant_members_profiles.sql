-- Add foreign key relationship from tenant_members to profiles for postgrest joins safely
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints
        WHERE constraint_name = 'tenant_members_user_id_fkey'
          AND table_name = 'tenant_members'
          AND table_schema = 'public'
    ) THEN
        ALTER TABLE public.tenant_members
        ADD CONSTRAINT tenant_members_user_id_fkey
        FOREIGN KEY (user_id) REFERENCES public.profiles(id)
        ON DELETE CASCADE;
    END IF;
END $$;
