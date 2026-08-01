
CREATE OR REPLACE FUNCTION public.my_access()
RETURNS jsonb
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT jsonb_build_object(
    'user_id', auth.uid(),
    'is_platform_admin', public.is_platform_admin(auth.uid()),
    'tenants', COALESCE((
      SELECT jsonb_agg(jsonb_build_object(
        'id', t.id, 'name', t.name, 'slug', t.slug, 'code', t.code,
        'logo_url', t.logo_url, 'status', t.status
      ) ORDER BY t.name)
      FROM public.tenant_members tm
      JOIN public.tenants t ON t.id = tm.tenant_id
      WHERE tm.user_id = auth.uid() AND tm.status = 'active' AND tm.deleted_at IS NULL
    ), '[]'::jsonb),
    'roles', COALESCE((
      SELECT jsonb_agg(DISTINCT jsonb_build_object(
        'tenant_id', ur.tenant_id, 'key', r.key, 'name', r.name,
        'level', r.level, 'default_route', r.default_route
      ))
      FROM public.user_roles ur
      JOIN public.roles r ON r.id = ur.role_id
      WHERE ur.user_id = auth.uid()
        AND ur.deleted_at IS NULL
        AND (ur.valid_until IS NULL OR ur.valid_until > now())
    ), '[]'::jsonb),
    'permissions', COALESCE((
      SELECT jsonb_object_agg(x.tenant_key, x.keys)
      FROM (
        SELECT COALESCE(ur.tenant_id::text, 'global') AS tenant_key,
               jsonb_agg(DISTINCT p.key) AS keys
        FROM public.user_roles ur
        JOIN public.role_permissions rp ON rp.role_id = ur.role_id
        JOIN public.permissions p ON p.id = rp.permission_id
        WHERE ur.user_id = auth.uid()
          AND ur.deleted_at IS NULL
          AND (ur.valid_until IS NULL OR ur.valid_until > now())
        GROUP BY 1
      ) x
    ), '{}'::jsonb)
  );
$$;

REVOKE EXECUTE ON FUNCTION public.my_access() FROM anon, public;
GRANT EXECUTE ON FUNCTION public.my_access() TO authenticated, service_role;

-- ---------- Storage security ----------
DROP POLICY IF EXISTS "documents_read_tenant" ON storage.objects;
CREATE POLICY "documents_read_tenant" ON storage.objects FOR SELECT TO authenticated
USING (bucket_id = 'documents' AND public.is_tenant_member(((storage.foldername(name))[1])::uuid));

DROP POLICY IF EXISTS "documents_insert_tenant" ON storage.objects;
CREATE POLICY "documents_insert_tenant" ON storage.objects FOR INSERT TO authenticated
WITH CHECK (bucket_id = 'documents' AND public.is_tenant_member(((storage.foldername(name))[1])::uuid) AND owner = auth.uid());

DROP POLICY IF EXISTS "documents_update_tenant" ON storage.objects;
CREATE POLICY "documents_update_tenant" ON storage.objects FOR UPDATE TO authenticated
USING (bucket_id = 'documents' AND public.is_tenant_member(((storage.foldername(name))[1])::uuid)
       AND (owner = auth.uid() OR public.has_permission('document.manage', ((storage.foldername(name))[1])::uuid)))
WITH CHECK (bucket_id = 'documents' AND public.is_tenant_member(((storage.foldername(name))[1])::uuid));

DROP POLICY IF EXISTS "documents_delete_tenant" ON storage.objects;
CREATE POLICY "documents_delete_tenant" ON storage.objects FOR DELETE TO authenticated
USING (bucket_id = 'documents' AND public.is_tenant_member(((storage.foldername(name))[1])::uuid)
       AND (owner = auth.uid() OR public.has_permission('document.manage', ((storage.foldername(name))[1])::uuid)));

DROP POLICY IF EXISTS "media_read_tenant" ON storage.objects;
CREATE POLICY "media_read_tenant" ON storage.objects FOR SELECT TO authenticated
USING (bucket_id = 'media' AND public.is_tenant_member(((storage.foldername(name))[1])::uuid));

DROP POLICY IF EXISTS "media_insert_tenant" ON storage.objects;
CREATE POLICY "media_insert_tenant" ON storage.objects FOR INSERT TO authenticated
WITH CHECK (bucket_id = 'media' AND public.is_tenant_member(((storage.foldername(name))[1])::uuid) AND owner = auth.uid());

DROP POLICY IF EXISTS "media_update_tenant" ON storage.objects;
CREATE POLICY "media_update_tenant" ON storage.objects FOR UPDATE TO authenticated
USING (bucket_id = 'media' AND public.has_permission('media.manage', ((storage.foldername(name))[1])::uuid))
WITH CHECK (bucket_id = 'media' AND public.is_tenant_member(((storage.foldername(name))[1])::uuid));

DROP POLICY IF EXISTS "media_delete_tenant" ON storage.objects;
CREATE POLICY "media_delete_tenant" ON storage.objects FOR DELETE TO authenticated
USING (bucket_id = 'media' AND public.has_permission('media.manage', ((storage.foldername(name))[1])::uuid));

DROP POLICY IF EXISTS "avatars_read_authenticated" ON storage.objects;
CREATE POLICY "avatars_read_authenticated" ON storage.objects FOR SELECT TO authenticated
USING (bucket_id = 'avatars');

DROP POLICY IF EXISTS "avatars_insert_own" ON storage.objects;
CREATE POLICY "avatars_insert_own" ON storage.objects FOR INSERT TO authenticated
WITH CHECK (bucket_id = 'avatars' AND (storage.foldername(name))[1] = auth.uid()::text);

DROP POLICY IF EXISTS "avatars_update_own" ON storage.objects;
CREATE POLICY "avatars_update_own" ON storage.objects FOR UPDATE TO authenticated
USING (bucket_id = 'avatars' AND (storage.foldername(name))[1] = auth.uid()::text)
WITH CHECK (bucket_id = 'avatars' AND (storage.foldername(name))[1] = auth.uid()::text);

DROP POLICY IF EXISTS "avatars_delete_own" ON storage.objects;
CREATE POLICY "avatars_delete_own" ON storage.objects FOR DELETE TO authenticated
USING (bucket_id = 'avatars' AND (storage.foldername(name))[1] = auth.uid()::text);
