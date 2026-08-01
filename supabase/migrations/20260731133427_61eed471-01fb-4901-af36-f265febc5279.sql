
-- ============================================================
-- CampusOS Platform Foundation : Part 1
-- Tenancy, Identity, Dynamic RBAC, Feature Flags, Audit, Versions
-- ============================================================

CREATE EXTENSION IF NOT EXISTS "pgcrypto";
CREATE EXTENSION IF NOT EXISTS "pg_trgm";

-- ---------- ENUMS ----------
CREATE TYPE public.tenant_status AS ENUM ('trial','active','suspended','cancelled');
CREATE TYPE public.member_status AS ENUM ('invited','active','suspended','left');
CREATE TYPE public.assignment_scope AS ENUM ('global','tenant','campus','department');
CREATE TYPE public.permission_effect AS ENUM ('allow','deny');
CREATE TYPE public.audit_action AS ENUM ('create','update','delete','restore','login','logout','export','import','view','approve','reject','assign','custom');
CREATE TYPE public.gender AS ENUM ('male','female','other','undisclosed');

-- ---------- SHARED TRIGGER FUNCTIONS ----------
CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS TRIGGER LANGUAGE plpgsql SET search_path = public AS $$
BEGIN
  NEW.updated_at = now();
  NEW.updated_by = COALESCE(auth.uid(), NEW.updated_by);
  RETURN NEW;
END;
$$;

CREATE OR REPLACE FUNCTION public.set_created_by()
RETURNS TRIGGER LANGUAGE plpgsql SET search_path = public AS $$
BEGIN
  NEW.created_by = COALESCE(NEW.created_by, auth.uid());
  RETURN NEW;
END;
$$;

-- ---------- TENANTS ----------
CREATE TABLE public.tenants (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  slug text NOT NULL UNIQUE,
  name text NOT NULL,
  legal_name text,
  code text,
  status public.tenant_status NOT NULL DEFAULT 'trial',
  logo_url text,
  primary_color text,
  contact_email text,
  contact_phone text,
  website text,
  timezone text NOT NULL DEFAULT 'Asia/Kolkata',
  locale text NOT NULL DEFAULT 'en',
  currency text NOT NULL DEFAULT 'INR',
  established_year int,
  affiliation text,
  accreditation text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  created_by uuid,
  updated_by uuid,
  deleted_at timestamptz,
  deleted_by uuid
);
CREATE INDEX idx_tenants_status ON public.tenants(status) WHERE deleted_at IS NULL;

CREATE TABLE public.campuses (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  name text NOT NULL,
  code text NOT NULL,
  is_primary boolean NOT NULL DEFAULT false,
  address_line1 text,
  address_line2 text,
  city text,
  state text,
  country text,
  postal_code text,
  latitude numeric(10,7),
  longitude numeric(10,7),
  phone text,
  email text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  created_by uuid,
  updated_by uuid,
  deleted_at timestamptz,
  deleted_by uuid,
  UNIQUE (tenant_id, code)
);
CREATE INDEX idx_campuses_tenant ON public.campuses(tenant_id);

CREATE TABLE public.buildings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  campus_id uuid NOT NULL REFERENCES public.campuses(id) ON DELETE CASCADE,
  name text NOT NULL,
  code text NOT NULL,
  floors int NOT NULL DEFAULT 1,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  created_by uuid,
  updated_by uuid,
  deleted_at timestamptz,
  deleted_by uuid,
  UNIQUE (campus_id, code)
);
CREATE INDEX idx_buildings_tenant ON public.buildings(tenant_id);
CREATE INDEX idx_buildings_campus ON public.buildings(campus_id);

-- ---------- PROFILES ----------
CREATE TABLE public.profiles (
  id uuid PRIMARY KEY,
  email text,
  full_name text,
  display_name text,
  avatar_url text,
  phone text,
  gender public.gender,
  date_of_birth date,
  is_platform_admin boolean NOT NULL DEFAULT false,
  last_active_tenant_id uuid REFERENCES public.tenants(id) ON DELETE SET NULL,
  locale text NOT NULL DEFAULT 'en',
  timezone text NOT NULL DEFAULT 'Asia/Kolkata',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  created_by uuid,
  updated_by uuid,
  deleted_at timestamptz,
  deleted_by uuid
);
CREATE INDEX idx_profiles_email ON public.profiles(lower(email));

CREATE TABLE public.tenant_members (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  user_id uuid NOT NULL,
  campus_id uuid REFERENCES public.campuses(id) ON DELETE SET NULL,
  employee_code text,
  status public.member_status NOT NULL DEFAULT 'active',
  joined_at timestamptz NOT NULL DEFAULT now(),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  created_by uuid,
  updated_by uuid,
  deleted_at timestamptz,
  deleted_by uuid,
  UNIQUE (tenant_id, user_id)
);
CREATE INDEX idx_tenant_members_user ON public.tenant_members(user_id);
CREATE INDEX idx_tenant_members_tenant ON public.tenant_members(tenant_id);

-- ---------- DYNAMIC RBAC ----------
CREATE TABLE public.permissions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  key text NOT NULL UNIQUE,
  module text NOT NULL,
  resource text NOT NULL,
  action text NOT NULL,
  name text NOT NULL,
  description text,
  is_system boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX idx_permissions_module ON public.permissions(module);

CREATE TABLE public.permission_groups (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid REFERENCES public.tenants(id) ON DELETE CASCADE,
  key text NOT NULL,
  name text NOT NULL,
  description text,
  is_system boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  created_by uuid,
  updated_by uuid,
  deleted_at timestamptz,
  deleted_by uuid
);
CREATE UNIQUE INDEX idx_permission_groups_key ON public.permission_groups(COALESCE(tenant_id,'00000000-0000-0000-0000-000000000000'::uuid), key);

CREATE TABLE public.permission_group_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  group_id uuid NOT NULL REFERENCES public.permission_groups(id) ON DELETE CASCADE,
  permission_id uuid NOT NULL REFERENCES public.permissions(id) ON DELETE CASCADE,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (group_id, permission_id)
);

CREATE TABLE public.roles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid REFERENCES public.tenants(id) ON DELETE CASCADE,
  key text NOT NULL,
  name text NOT NULL,
  description text,
  level int NOT NULL DEFAULT 100,
  is_system boolean NOT NULL DEFAULT false,
  is_assignable boolean NOT NULL DEFAULT true,
  default_route text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  created_by uuid,
  updated_by uuid,
  deleted_at timestamptz,
  deleted_by uuid
);
CREATE UNIQUE INDEX idx_roles_key ON public.roles(COALESCE(tenant_id,'00000000-0000-0000-0000-000000000000'::uuid), key);
CREATE INDEX idx_roles_tenant ON public.roles(tenant_id);

CREATE TABLE public.role_permissions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  role_id uuid NOT NULL REFERENCES public.roles(id) ON DELETE CASCADE,
  permission_id uuid NOT NULL REFERENCES public.permissions(id) ON DELETE CASCADE,
  created_at timestamptz NOT NULL DEFAULT now(),
  created_by uuid,
  UNIQUE (role_id, permission_id)
);
CREATE INDEX idx_role_permissions_role ON public.role_permissions(role_id);

CREATE TABLE public.user_roles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  role_id uuid NOT NULL REFERENCES public.roles(id) ON DELETE CASCADE,
  tenant_id uuid REFERENCES public.tenants(id) ON DELETE CASCADE,
  campus_id uuid REFERENCES public.campuses(id) ON DELETE CASCADE,
  department_id uuid,
  scope public.assignment_scope NOT NULL DEFAULT 'tenant',
  valid_from timestamptz NOT NULL DEFAULT now(),
  valid_until timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  created_by uuid,
  updated_by uuid,
  deleted_at timestamptz,
  deleted_by uuid
);
CREATE UNIQUE INDEX idx_user_roles_unique ON public.user_roles(
  user_id, role_id,
  COALESCE(tenant_id,'00000000-0000-0000-0000-000000000000'::uuid),
  COALESCE(campus_id,'00000000-0000-0000-0000-000000000000'::uuid),
  COALESCE(department_id,'00000000-0000-0000-0000-000000000000'::uuid)
);
CREATE INDEX idx_user_roles_user ON public.user_roles(user_id);
CREATE INDEX idx_user_roles_tenant ON public.user_roles(tenant_id);

CREATE TABLE public.user_permission_overrides (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  tenant_id uuid REFERENCES public.tenants(id) ON DELETE CASCADE,
  permission_id uuid NOT NULL REFERENCES public.permissions(id) ON DELETE CASCADE,
  effect public.permission_effect NOT NULL DEFAULT 'allow',
  reason text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  created_by uuid,
  updated_by uuid
);
CREATE UNIQUE INDEX idx_user_perm_override_unique ON public.user_permission_overrides(
  user_id, permission_id, COALESCE(tenant_id,'00000000-0000-0000-0000-000000000000'::uuid));

-- ---------- FEATURE FLAGS ----------
CREATE TABLE public.features (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  key text NOT NULL UNIQUE,
  name text NOT NULL,
  module text NOT NULL,
  description text,
  is_beta boolean NOT NULL DEFAULT false,
  default_enabled boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE public.tenant_features (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  feature_id uuid NOT NULL REFERENCES public.features(id) ON DELETE CASCADE,
  campus_id uuid REFERENCES public.campuses(id) ON DELETE CASCADE,
  enabled boolean NOT NULL DEFAULT true,
  config jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  created_by uuid,
  updated_by uuid
);
CREATE UNIQUE INDEX idx_tenant_features_unique ON public.tenant_features(
  tenant_id, feature_id, COALESCE(campus_id,'00000000-0000-0000-0000-000000000000'::uuid));

-- ---------- AUDIT + VERSIONS ----------
CREATE TABLE public.audit_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid,
  campus_id uuid,
  actor_id uuid,
  actor_email text,
  action public.audit_action NOT NULL,
  entity_type text NOT NULL,
  entity_id uuid,
  entity_label text,
  module text,
  old_data jsonb,
  new_data jsonb,
  changed_fields text[],
  ip_address inet,
  user_agent text,
  metadata jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX idx_audit_logs_tenant_time ON public.audit_logs(tenant_id, created_at DESC);
CREATE INDEX idx_audit_logs_entity ON public.audit_logs(entity_type, entity_id);
CREATE INDEX idx_audit_logs_actor ON public.audit_logs(actor_id);

CREATE TABLE public.record_versions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid,
  entity_type text NOT NULL,
  entity_id uuid NOT NULL,
  version int NOT NULL,
  snapshot jsonb NOT NULL,
  changed_by uuid,
  reason text,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (entity_type, entity_id, version)
);
CREATE INDEX idx_record_versions_entity ON public.record_versions(entity_type, entity_id);

-- ---------- SECURITY DEFINER HELPERS ----------
CREATE OR REPLACE FUNCTION public.is_platform_admin(_user_id uuid DEFAULT auth.uid())
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (SELECT 1 FROM public.profiles p WHERE p.id = _user_id AND p.is_platform_admin = true);
$$;

CREATE OR REPLACE FUNCTION public.is_tenant_member(_tenant_id uuid, _user_id uuid DEFAULT auth.uid())
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT public.is_platform_admin(_user_id) OR EXISTS (
    SELECT 1 FROM public.tenant_members m
    WHERE m.tenant_id = _tenant_id AND m.user_id = _user_id
      AND m.status = 'active' AND m.deleted_at IS NULL
  );
$$;

CREATE OR REPLACE FUNCTION public.user_tenant_ids(_user_id uuid DEFAULT auth.uid())
RETURNS SETOF uuid LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT m.tenant_id FROM public.tenant_members m
  WHERE m.user_id = _user_id AND m.status = 'active' AND m.deleted_at IS NULL;
$$;

CREATE OR REPLACE FUNCTION public.has_permission(_permission_key text, _tenant_id uuid DEFAULT NULL, _user_id uuid DEFAULT auth.uid())
RETURNS boolean LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path = public AS $$
DECLARE
  _perm_id uuid;
  _denied boolean;
  _allowed boolean;
BEGIN
  IF _user_id IS NULL THEN RETURN false; END IF;
  IF public.is_platform_admin(_user_id) THEN RETURN true; END IF;

  SELECT id INTO _perm_id FROM public.permissions WHERE key = _permission_key;
  IF _perm_id IS NULL THEN RETURN false; END IF;

  SELECT EXISTS (
    SELECT 1 FROM public.user_permission_overrides o
    WHERE o.user_id = _user_id AND o.permission_id = _perm_id
      AND o.effect = 'deny'
      AND (_tenant_id IS NULL OR o.tenant_id IS NULL OR o.tenant_id = _tenant_id)
  ) INTO _denied;
  IF _denied THEN RETURN false; END IF;

  SELECT EXISTS (
    SELECT 1 FROM public.user_permission_overrides o
    WHERE o.user_id = _user_id AND o.permission_id = _perm_id
      AND o.effect = 'allow'
      AND (_tenant_id IS NULL OR o.tenant_id IS NULL OR o.tenant_id = _tenant_id)
  ) INTO _allowed;
  IF _allowed THEN RETURN true; END IF;

  RETURN EXISTS (
    SELECT 1
    FROM public.user_roles ur
    JOIN public.role_permissions rp ON rp.role_id = ur.role_id
    WHERE ur.user_id = _user_id
      AND rp.permission_id = _perm_id
      AND ur.deleted_at IS NULL
      AND (ur.valid_until IS NULL OR ur.valid_until > now())
      AND (_tenant_id IS NULL OR ur.tenant_id IS NULL OR ur.tenant_id = _tenant_id)
  );
END;
$$;

CREATE OR REPLACE FUNCTION public.has_role(_role_key text, _tenant_id uuid DEFAULT NULL, _user_id uuid DEFAULT auth.uid())
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles ur
    JOIN public.roles r ON r.id = ur.role_id
    WHERE ur.user_id = _user_id AND r.key = _role_key
      AND ur.deleted_at IS NULL
      AND (_tenant_id IS NULL OR ur.tenant_id IS NULL OR ur.tenant_id = _tenant_id)
  );
$$;

-- Generic audit trigger usable on any table with a tenant_id column
CREATE OR REPLACE FUNCTION public.audit_row_change()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  _old jsonb;
  _new jsonb;
  _tenant uuid;
  _action public.audit_action;
  _changed text[];
BEGIN
  IF TG_OP = 'INSERT' THEN
    _action := 'create'; _new := to_jsonb(NEW); _old := NULL;
  ELSIF TG_OP = 'UPDATE' THEN
    _new := to_jsonb(NEW); _old := to_jsonb(OLD);
    IF (_old->>'deleted_at') IS NULL AND (_new->>'deleted_at') IS NOT NULL THEN
      _action := 'delete';
    ELSIF (_old->>'deleted_at') IS NOT NULL AND (_new->>'deleted_at') IS NULL THEN
      _action := 'restore';
    ELSE
      _action := 'update';
    END IF;
    SELECT array_agg(key) INTO _changed
    FROM jsonb_each(_new) n
    WHERE n.value IS DISTINCT FROM (_old -> n.key);
  ELSE
    _action := 'delete'; _old := to_jsonb(OLD); _new := NULL;
  END IF;

  _tenant := NULLIF(COALESCE(_new->>'tenant_id', _old->>'tenant_id'), '')::uuid;

  INSERT INTO public.audit_logs (tenant_id, actor_id, action, entity_type, entity_id, old_data, new_data, changed_fields)
  VALUES (
    _tenant, auth.uid(), _action, TG_TABLE_NAME,
    NULLIF(COALESCE(_new->>'id', _old->>'id'), '')::uuid,
    _old, _new, _changed
  );
  RETURN COALESCE(NEW, OLD);
END;
$$;

CREATE OR REPLACE FUNCTION public.version_row_change()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  _next int;
BEGIN
  SELECT COALESCE(MAX(version), 0) + 1 INTO _next
  FROM public.record_versions
  WHERE entity_type = TG_TABLE_NAME AND entity_id = NEW.id;

  INSERT INTO public.record_versions (tenant_id, entity_type, entity_id, version, snapshot, changed_by)
  VALUES (NULLIF(to_jsonb(NEW)->>'tenant_id','')::uuid, TG_TABLE_NAME, NEW.id, _next, to_jsonb(NEW), auth.uid());
  RETURN NEW;
END;
$$;

-- Auto-create profile on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  INSERT INTO public.profiles (id, email, full_name, avatar_url)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.raw_user_meta_data->>'name', split_part(NEW.email,'@',1)),
    NEW.raw_user_meta_data->>'avatar_url'
  )
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$;

CREATE TRIGGER on_auth_user_created
AFTER INSERT ON auth.users
FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- ---------- updated_at triggers ----------
CREATE TRIGGER trg_tenants_updated BEFORE UPDATE ON public.tenants FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
CREATE TRIGGER trg_campuses_updated BEFORE UPDATE ON public.campuses FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
CREATE TRIGGER trg_buildings_updated BEFORE UPDATE ON public.buildings FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
CREATE TRIGGER trg_profiles_updated BEFORE UPDATE ON public.profiles FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
CREATE TRIGGER trg_tenant_members_updated BEFORE UPDATE ON public.tenant_members FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
CREATE TRIGGER trg_roles_updated BEFORE UPDATE ON public.roles FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
CREATE TRIGGER trg_permission_groups_updated BEFORE UPDATE ON public.permission_groups FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
CREATE TRIGGER trg_user_roles_updated BEFORE UPDATE ON public.user_roles FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
CREATE TRIGGER trg_tenant_features_updated BEFORE UPDATE ON public.tenant_features FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- ---------- audit triggers ----------
CREATE TRIGGER trg_tenants_audit AFTER INSERT OR UPDATE OR DELETE ON public.tenants FOR EACH ROW EXECUTE FUNCTION public.audit_row_change();
CREATE TRIGGER trg_campuses_audit AFTER INSERT OR UPDATE OR DELETE ON public.campuses FOR EACH ROW EXECUTE FUNCTION public.audit_row_change();
CREATE TRIGGER trg_tenant_members_audit AFTER INSERT OR UPDATE OR DELETE ON public.tenant_members FOR EACH ROW EXECUTE FUNCTION public.audit_row_change();
CREATE TRIGGER trg_user_roles_audit AFTER INSERT OR UPDATE OR DELETE ON public.user_roles FOR EACH ROW EXECUTE FUNCTION public.audit_row_change();
CREATE TRIGGER trg_roles_audit AFTER INSERT OR UPDATE OR DELETE ON public.roles FOR EACH ROW EXECUTE FUNCTION public.audit_row_change();
CREATE TRIGGER trg_role_permissions_audit AFTER INSERT OR DELETE ON public.role_permissions FOR EACH ROW EXECUTE FUNCTION public.audit_row_change();

-- ---------- GRANTS ----------
GRANT SELECT, INSERT, UPDATE, DELETE ON public.tenants, public.campuses, public.buildings,
  public.profiles, public.tenant_members, public.permissions, public.permission_groups,
  public.permission_group_items, public.roles, public.role_permissions, public.user_roles,
  public.user_permission_overrides, public.features, public.tenant_features,
  public.audit_logs, public.record_versions TO authenticated;
GRANT ALL ON public.tenants, public.campuses, public.buildings, public.profiles,
  public.tenant_members, public.permissions, public.permission_groups, public.permission_group_items,
  public.roles, public.role_permissions, public.user_roles, public.user_permission_overrides,
  public.features, public.tenant_features, public.audit_logs, public.record_versions TO service_role;

-- ---------- RLS ----------
ALTER TABLE public.tenants ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.campuses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.buildings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tenant_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.permissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.permission_groups ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.permission_group_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.role_permissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_permission_overrides ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.features ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tenant_features ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.record_versions ENABLE ROW LEVEL SECURITY;

CREATE POLICY tenants_select ON public.tenants FOR SELECT TO authenticated
  USING (public.is_tenant_member(id));
CREATE POLICY tenants_insert ON public.tenants FOR INSERT TO authenticated
  WITH CHECK (public.is_platform_admin());
CREATE POLICY tenants_update ON public.tenants FOR UPDATE TO authenticated
  USING (public.has_permission('tenant.update', id)) WITH CHECK (public.has_permission('tenant.update', id));

CREATE POLICY campuses_select ON public.campuses FOR SELECT TO authenticated
  USING (public.is_tenant_member(tenant_id));
CREATE POLICY campuses_write ON public.campuses FOR ALL TO authenticated
  USING (public.has_permission('campus.manage', tenant_id))
  WITH CHECK (public.has_permission('campus.manage', tenant_id));

CREATE POLICY buildings_select ON public.buildings FOR SELECT TO authenticated
  USING (public.is_tenant_member(tenant_id));
CREATE POLICY buildings_write ON public.buildings FOR ALL TO authenticated
  USING (public.has_permission('campus.manage', tenant_id))
  WITH CHECK (public.has_permission('campus.manage', tenant_id));

CREATE POLICY profiles_select_self ON public.profiles FOR SELECT TO authenticated
  USING (
    id = auth.uid()
    OR public.is_platform_admin()
    OR EXISTS (
      SELECT 1 FROM public.tenant_members m
      WHERE m.user_id = profiles.id AND m.tenant_id IN (SELECT public.user_tenant_ids())
    )
  );
CREATE POLICY profiles_update_self ON public.profiles FOR UPDATE TO authenticated
  USING (id = auth.uid() OR public.is_platform_admin())
  WITH CHECK (id = auth.uid() OR public.is_platform_admin());
CREATE POLICY profiles_insert_self ON public.profiles FOR INSERT TO authenticated
  WITH CHECK (id = auth.uid() OR public.is_platform_admin());

CREATE POLICY tenant_members_select ON public.tenant_members FOR SELECT TO authenticated
  USING (user_id = auth.uid() OR public.is_tenant_member(tenant_id));
CREATE POLICY tenant_members_write ON public.tenant_members FOR ALL TO authenticated
  USING (public.has_permission('user.manage', tenant_id))
  WITH CHECK (public.has_permission('user.manage', tenant_id));

CREATE POLICY permissions_select ON public.permissions FOR SELECT TO authenticated USING (true);
CREATE POLICY permissions_write ON public.permissions FOR ALL TO authenticated
  USING (public.is_platform_admin()) WITH CHECK (public.is_platform_admin());

CREATE POLICY permission_groups_select ON public.permission_groups FOR SELECT TO authenticated
  USING (tenant_id IS NULL OR public.is_tenant_member(tenant_id));
CREATE POLICY permission_groups_write ON public.permission_groups FOR ALL TO authenticated
  USING (public.has_permission('role.manage', tenant_id))
  WITH CHECK (public.has_permission('role.manage', tenant_id));

CREATE POLICY permission_group_items_select ON public.permission_group_items FOR SELECT TO authenticated USING (true);
CREATE POLICY permission_group_items_write ON public.permission_group_items FOR ALL TO authenticated
  USING (public.has_permission('role.manage')) WITH CHECK (public.has_permission('role.manage'));

CREATE POLICY roles_select ON public.roles FOR SELECT TO authenticated
  USING (tenant_id IS NULL OR public.is_tenant_member(tenant_id));
CREATE POLICY roles_write ON public.roles FOR ALL TO authenticated
  USING (public.has_permission('role.manage', tenant_id))
  WITH CHECK (public.has_permission('role.manage', tenant_id));

CREATE POLICY role_permissions_select ON public.role_permissions FOR SELECT TO authenticated
  USING (EXISTS (SELECT 1 FROM public.roles r WHERE r.id = role_id AND (r.tenant_id IS NULL OR public.is_tenant_member(r.tenant_id))));
CREATE POLICY role_permissions_write ON public.role_permissions FOR ALL TO authenticated
  USING (EXISTS (SELECT 1 FROM public.roles r WHERE r.id = role_id AND public.has_permission('role.manage', r.tenant_id)))
  WITH CHECK (EXISTS (SELECT 1 FROM public.roles r WHERE r.id = role_id AND public.has_permission('role.manage', r.tenant_id)));

CREATE POLICY user_roles_select ON public.user_roles FOR SELECT TO authenticated
  USING (user_id = auth.uid() OR (tenant_id IS NOT NULL AND public.is_tenant_member(tenant_id)) OR public.is_platform_admin());
CREATE POLICY user_roles_write ON public.user_roles FOR ALL TO authenticated
  USING (public.has_permission('role.assign', tenant_id))
  WITH CHECK (public.has_permission('role.assign', tenant_id));

CREATE POLICY user_perm_overrides_select ON public.user_permission_overrides FOR SELECT TO authenticated
  USING (user_id = auth.uid() OR public.has_permission('role.assign', tenant_id));
CREATE POLICY user_perm_overrides_write ON public.user_permission_overrides FOR ALL TO authenticated
  USING (public.has_permission('role.assign', tenant_id))
  WITH CHECK (public.has_permission('role.assign', tenant_id));

CREATE POLICY features_select ON public.features FOR SELECT TO authenticated USING (true);
CREATE POLICY features_write ON public.features FOR ALL TO authenticated
  USING (public.is_platform_admin()) WITH CHECK (public.is_platform_admin());

CREATE POLICY tenant_features_select ON public.tenant_features FOR SELECT TO authenticated
  USING (public.is_tenant_member(tenant_id));
CREATE POLICY tenant_features_write ON public.tenant_features FOR ALL TO authenticated
  USING (public.has_permission('settings.manage', tenant_id))
  WITH CHECK (public.has_permission('settings.manage', tenant_id));

CREATE POLICY audit_logs_select ON public.audit_logs FOR SELECT TO authenticated
  USING (public.has_permission('audit.view', tenant_id) OR actor_id = auth.uid());
CREATE POLICY audit_logs_insert ON public.audit_logs FOR INSERT TO authenticated WITH CHECK (true);

CREATE POLICY record_versions_select ON public.record_versions FOR SELECT TO authenticated
  USING (tenant_id IS NULL OR public.is_tenant_member(tenant_id));
CREATE POLICY record_versions_insert ON public.record_versions FOR INSERT TO authenticated WITH CHECK (true);
