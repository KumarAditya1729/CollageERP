-- Add foreign key relationship from tenant_members to profiles for postgrest joins
ALTER TABLE public.tenant_members
ADD CONSTRAINT tenant_members_user_id_fkey
FOREIGN KEY (user_id) REFERENCES public.profiles(id)
ON DELETE CASCADE;
