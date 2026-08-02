-- ==============================================================================
-- CampusOS Critical Bug Fix: Eliminate RLS Infinite Recursion on tenant_members
-- ==============================================================================
-- Problem: Earlier RLS policies for `tenant_members_select` and `profiles_select_self`
-- evaluated `tenant_id IN (SELECT tm.tenant_id FROM public.tenant_members tm ...)`.
-- Executing a direct SQL query against `public.tenant_members` inside its own RLS
-- policy causes PostgreSQL to re-evaluate the RLS policy endlessly, resulting in:
-- "Error: infinite recursion detected in policy for relation tenant_members".
--
-- Solution:
-- 1. Ensure `user_tenant_ids()` is strictly marked as SECURITY DEFINER so it executes
--    with superuser rights and cleanly bypasses RLS evaluation on `tenant_members`.
-- 2. Drop the recursive RLS policies on `tenant_members` and `profiles`.
-- 3. Replace them with non-recursive calls to `public.user_tenant_ids()`.
-- ==============================================================================

-- 1. Guarantee helper functions execute as SECURITY DEFINER to bypass RLS loops
CREATE OR REPLACE FUNCTION public.user_tenant_ids(_user_id uuid DEFAULT auth.uid())
RETURNS SETOF uuid LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT m.tenant_id FROM public.tenant_members m
  WHERE m.user_id = _user_id AND m.status = 'active' AND m.deleted_at IS NULL;
$$;

CREATE OR REPLACE FUNCTION public.is_tenant_member(_tenant_id uuid, _user_id uuid DEFAULT auth.uid())
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (SELECT 1 FROM public.profiles p WHERE p.id = _user_id AND p.is_platform_admin = true)
  OR EXISTS (
    SELECT 1 FROM public.tenant_members m
    WHERE m.tenant_id = _tenant_id AND m.user_id = _user_id
      AND m.status = 'active' AND m.deleted_at IS NULL
  );
$$;

-- 2. Correct Profiles Select Policy
DROP POLICY IF EXISTS profiles_select_self ON public.profiles;
CREATE POLICY profiles_select_self ON public.profiles FOR SELECT TO authenticated
  USING (
    id = auth.uid()
    OR public.is_platform_admin()
    OR EXISTS (
      SELECT 1 FROM public.tenant_members m
      WHERE m.user_id = profiles.id AND m.tenant_id IN (SELECT public.user_tenant_ids())
    )
  );

-- 3. Correct Tenant Members Select Policy (Removes infinite recursion)
DROP POLICY IF EXISTS tenant_members_select ON public.tenant_members;
CREATE POLICY tenant_members_select ON public.tenant_members FOR SELECT TO authenticated
  USING (
    user_id = auth.uid() 
    OR tenant_id IN (SELECT public.user_tenant_ids())
    OR public.is_platform_admin()
  );
