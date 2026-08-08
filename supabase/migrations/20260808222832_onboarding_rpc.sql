-- Migration: Onboarding RPC for creating a new tenant and assigning college_admin

CREATE OR REPLACE FUNCTION public.setup_new_college(
  p_college_name text,
  p_college_slug text,
  p_branches text[]
) RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_tenant_id uuid;
  v_role_id uuid;
  v_user_id uuid;
  v_branch text;
BEGIN
  v_user_id := auth.uid();
  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'Not authenticated';
  END IF;

  -- Create the new tenant
  INSERT INTO public.tenants (name, slug, code, status)
  VALUES (p_college_name, p_college_slug, upper(substring(p_college_slug from 1 for 4)), 'active')
  RETURNING id INTO v_tenant_id;

  -- Get the college_admin role id
  SELECT id INTO v_role_id 
  FROM public.roles 
  WHERE key = 'college_admin' AND tenant_id IS NULL 
  LIMIT 1;

  IF v_role_id IS NULL THEN
    RAISE EXCEPTION 'college_admin role not found';
  END IF;

  -- Assign the user as college_admin for this tenant
  INSERT INTO public.user_roles (user_id, role_id, tenant_id, scope)
  VALUES (v_user_id, v_role_id, v_tenant_id, 'tenant');

  -- Create default campus
  INSERT INTO public.campuses (tenant_id, name, code, is_primary)
  VALUES (v_tenant_id, 'Main Campus', 'MAIN', true);

  -- Create branches as departments
  FOREACH v_branch IN ARRAY p_branches
  LOOP
    INSERT INTO public.departments (tenant_id, name, code, short_name)
    VALUES (
      v_tenant_id, 
      v_branch, 
      upper(substring(regexp_replace(v_branch, '[^a-zA-Z]', '', 'g') from 1 for 4)), 
      substring(v_branch from 1 for 10)
    );
  END LOOP;

  RETURN v_tenant_id;
END;
$$;
