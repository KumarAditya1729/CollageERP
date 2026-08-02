-- Fix Infinite Recursion in RLS Policies

-- 1. Fix Profiles Policy
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

-- 2. Fix Tenant Members Policy
DROP POLICY IF EXISTS tenant_members_select ON public.tenant_members;
CREATE POLICY tenant_members_select ON public.tenant_members FOR SELECT TO authenticated
  USING (
    user_id = auth.uid() 
    OR tenant_id IN (SELECT public.user_tenant_ids())
    OR public.is_platform_admin()
  );

-- 3. Fix Student Guardians Policy (Break circular dependency with students)
-- Students policy allows guardians to see students.
-- Guardians policy shouldn't query students back to avoid loop.
DROP POLICY IF EXISTS guardians_select ON public.student_guardians;
CREATE POLICY guardians_select ON public.student_guardians FOR SELECT TO authenticated
  USING (
    user_id = auth.uid() 
    OR public.has_permission('student.view', tenant_id)
  );

-- 4. Re-create helper functions without relying on RLS policies to be flawless, just in case
CREATE OR REPLACE FUNCTION public.is_platform_admin(_user_id uuid DEFAULT auth.uid())
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (SELECT 1 FROM public.profiles p WHERE p.id = _user_id AND p.is_platform_admin = true);
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
