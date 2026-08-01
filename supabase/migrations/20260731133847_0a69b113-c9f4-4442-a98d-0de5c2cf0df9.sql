
-- ============================================================
-- CampusOS Foundation : Part 3
-- Notifications, Documents, Media, Attachments, Comments,
-- Tags, Activity Feed, Search, Calendar
-- ============================================================

CREATE TYPE public.notification_channel AS ENUM ('in_app','email','sms','push','whatsapp');
CREATE TYPE public.notification_status AS ENUM ('pending','queued','sent','delivered','failed','read','cancelled');
CREATE TYPE public.notification_priority AS ENUM ('low','normal','high','urgent');
CREATE TYPE public.document_status AS ENUM ('draft','pending','verified','rejected','expired','archived');
CREATE TYPE public.calendar_event_type AS ENUM ('academic','exam','holiday','event','meeting','deadline','personal','other');

-- ---------- NOTIFICATIONS ----------
CREATE TABLE public.notification_templates (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid REFERENCES public.tenants(id) ON DELETE CASCADE,
  key text NOT NULL,
  name text NOT NULL,
  event_key text,
  channel public.notification_channel NOT NULL DEFAULT 'in_app',
  subject text,
  body text NOT NULL,
  variables jsonb NOT NULL DEFAULT '[]'::jsonb,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  created_by uuid, updated_by uuid, deleted_at timestamptz, deleted_by uuid
);
CREATE UNIQUE INDEX idx_notif_templates_unique ON public.notification_templates(COALESCE(tenant_id,'00000000-0000-0000-0000-000000000000'::uuid), key, channel);

CREATE TABLE public.notification_preferences (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid REFERENCES public.tenants(id) ON DELETE CASCADE,
  user_id uuid NOT NULL,
  event_key text NOT NULL,
  channel public.notification_channel NOT NULL,
  enabled boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id, event_key, channel)
);
CREATE INDEX idx_notif_prefs_user ON public.notification_preferences(user_id);

CREATE TABLE public.notifications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid REFERENCES public.tenants(id) ON DELETE CASCADE,
  recipient_id uuid NOT NULL,
  actor_id uuid,
  event_key text,
  title text NOT NULL,
  body text,
  priority public.notification_priority NOT NULL DEFAULT 'normal',
  entity_type text,
  entity_id uuid,
  action_url text,
  icon text,
  data jsonb NOT NULL DEFAULT '{}'::jsonb,
  read_at timestamptz,
  archived_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX idx_notifications_recipient ON public.notifications(recipient_id, created_at DESC);
CREATE INDEX idx_notifications_unread ON public.notifications(recipient_id) WHERE read_at IS NULL;

CREATE TABLE public.notification_deliveries (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid REFERENCES public.tenants(id) ON DELETE CASCADE,
  notification_id uuid REFERENCES public.notifications(id) ON DELETE CASCADE,
  template_id uuid REFERENCES public.notification_templates(id) ON DELETE SET NULL,
  recipient_id uuid,
  channel public.notification_channel NOT NULL,
  destination text,
  status public.notification_status NOT NULL DEFAULT 'pending',
  attempts int NOT NULL DEFAULT 0,
  provider text,
  provider_message_id text,
  error text,
  payload jsonb NOT NULL DEFAULT '{}'::jsonb,
  scheduled_at timestamptz,
  sent_at timestamptz,
  delivered_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX idx_notif_deliveries_status ON public.notification_deliveries(status, scheduled_at);
CREATE INDEX idx_notif_deliveries_tenant ON public.notification_deliveries(tenant_id);

-- ---------- DOCUMENTS / MEDIA / ATTACHMENTS ----------
CREATE TABLE public.document_types (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid REFERENCES public.tenants(id) ON DELETE CASCADE,
  key text NOT NULL,
  name text NOT NULL,
  category text,
  requires_verification boolean NOT NULL DEFAULT false,
  allowed_mime_types text[] NOT NULL DEFAULT ARRAY['application/pdf','image/jpeg','image/png'],
  max_size_mb int NOT NULL DEFAULT 10,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE UNIQUE INDEX idx_document_types_unique ON public.document_types(COALESCE(tenant_id,'00000000-0000-0000-0000-000000000000'::uuid), key);

CREATE TABLE public.documents (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  campus_id uuid REFERENCES public.campuses(id) ON DELETE SET NULL,
  document_type_id uuid REFERENCES public.document_types(id) ON DELETE SET NULL,
  entity_type text NOT NULL,
  entity_id uuid,
  title text NOT NULL,
  description text,
  storage_bucket text NOT NULL DEFAULT 'documents',
  storage_path text NOT NULL,
  mime_type text,
  file_size bigint,
  checksum text,
  status public.document_status NOT NULL DEFAULT 'draft',
  is_confidential boolean NOT NULL DEFAULT false,
  issued_on date,
  expires_on date,
  verified_by uuid,
  verified_at timestamptz,
  rejection_reason text,
  current_version int NOT NULL DEFAULT 1,
  metadata jsonb NOT NULL DEFAULT '{}'::jsonb,
  owner_id uuid,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  created_by uuid, updated_by uuid, deleted_at timestamptz, deleted_by uuid
);
CREATE INDEX idx_documents_tenant ON public.documents(tenant_id);
CREATE INDEX idx_documents_entity ON public.documents(entity_type, entity_id);
CREATE INDEX idx_documents_owner ON public.documents(owner_id);

CREATE TABLE public.document_versions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  document_id uuid NOT NULL REFERENCES public.documents(id) ON DELETE CASCADE,
  version int NOT NULL,
  storage_path text NOT NULL,
  file_size bigint,
  mime_type text,
  notes text,
  created_at timestamptz NOT NULL DEFAULT now(),
  created_by uuid,
  UNIQUE (document_id, version)
);

CREATE TABLE public.media_folders (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  parent_id uuid REFERENCES public.media_folders(id) ON DELETE CASCADE,
  name text NOT NULL,
  path text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  created_by uuid, updated_by uuid, deleted_at timestamptz, deleted_by uuid
);
CREATE INDEX idx_media_folders_tenant ON public.media_folders(tenant_id);

CREATE TABLE public.media_assets (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  folder_id uuid REFERENCES public.media_folders(id) ON DELETE SET NULL,
  name text NOT NULL,
  alt_text text,
  caption text,
  storage_bucket text NOT NULL DEFAULT 'media',
  storage_path text NOT NULL,
  mime_type text,
  file_size bigint,
  width int,
  height int,
  duration_seconds numeric(10,2),
  is_public boolean NOT NULL DEFAULT false,
  metadata jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  created_by uuid, updated_by uuid, deleted_at timestamptz, deleted_by uuid
);
CREATE INDEX idx_media_assets_tenant ON public.media_assets(tenant_id);

CREATE TABLE public.attachments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  entity_type text NOT NULL,
  entity_id uuid NOT NULL,
  document_id uuid REFERENCES public.documents(id) ON DELETE CASCADE,
  media_asset_id uuid REFERENCES public.media_assets(id) ON DELETE CASCADE,
  storage_bucket text,
  storage_path text,
  file_name text,
  mime_type text,
  file_size bigint,
  created_at timestamptz NOT NULL DEFAULT now(),
  created_by uuid,
  deleted_at timestamptz, deleted_by uuid
);
CREATE INDEX idx_attachments_entity ON public.attachments(entity_type, entity_id);
CREATE INDEX idx_attachments_tenant ON public.attachments(tenant_id);

-- ---------- COMMENTS / NOTES / TAGS ----------
CREATE TABLE public.comments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  entity_type text NOT NULL,
  entity_id uuid NOT NULL,
  parent_id uuid REFERENCES public.comments(id) ON DELETE CASCADE,
  author_id uuid NOT NULL,
  body text NOT NULL,
  mentions uuid[] NOT NULL DEFAULT '{}',
  is_internal boolean NOT NULL DEFAULT false,
  edited_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  created_by uuid, updated_by uuid, deleted_at timestamptz, deleted_by uuid
);
CREATE INDEX idx_comments_entity ON public.comments(entity_type, entity_id);
CREATE INDEX idx_comments_tenant ON public.comments(tenant_id);

CREATE TABLE public.notes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  entity_type text NOT NULL,
  entity_id uuid NOT NULL,
  author_id uuid NOT NULL,
  title text,
  body text NOT NULL,
  is_private boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  created_by uuid, updated_by uuid, deleted_at timestamptz, deleted_by uuid
);
CREATE INDEX idx_notes_entity ON public.notes(entity_type, entity_id);

CREATE TABLE public.tags (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  name text NOT NULL,
  slug text NOT NULL,
  color text,
  description text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  created_by uuid, updated_by uuid, deleted_at timestamptz, deleted_by uuid,
  UNIQUE (tenant_id, slug)
);

CREATE TABLE public.taggables (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  tag_id uuid NOT NULL REFERENCES public.tags(id) ON DELETE CASCADE,
  entity_type text NOT NULL,
  entity_id uuid NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  created_by uuid,
  UNIQUE (tag_id, entity_type, entity_id)
);
CREATE INDEX idx_taggables_entity ON public.taggables(entity_type, entity_id);

-- ---------- ACTIVITY FEED ----------
CREATE TABLE public.activity_feed (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  campus_id uuid REFERENCES public.campuses(id) ON DELETE SET NULL,
  actor_id uuid,
  verb text NOT NULL,
  summary text NOT NULL,
  entity_type text,
  entity_id uuid,
  module text,
  audience_roles text[] NOT NULL DEFAULT '{}',
  audience_users uuid[] NOT NULL DEFAULT '{}',
  is_public boolean NOT NULL DEFAULT true,
  data jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX idx_activity_tenant_time ON public.activity_feed(tenant_id, created_at DESC);

-- ---------- GLOBAL SEARCH ----------
CREATE TABLE public.search_index (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  entity_type text NOT NULL,
  entity_id uuid NOT NULL,
  title text NOT NULL,
  subtitle text,
  body text,
  module text,
  url text,
  required_permission text,
  keywords text,
  search_vector tsvector,
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (entity_type, entity_id)
);
CREATE INDEX idx_search_vector ON public.search_index USING gin(search_vector);
CREATE INDEX idx_search_tenant ON public.search_index(tenant_id);

CREATE OR REPLACE FUNCTION public.search_index_vector_update()
RETURNS TRIGGER LANGUAGE plpgsql SET search_path = public AS $$
BEGIN
  NEW.search_vector :=
    setweight(to_tsvector('simple', COALESCE(NEW.title,'')), 'A') ||
    setweight(to_tsvector('simple', COALESCE(NEW.subtitle,'')), 'B') ||
    setweight(to_tsvector('simple', COALESCE(NEW.keywords,'')), 'B') ||
    setweight(to_tsvector('simple', COALESCE(NEW.body,'')), 'C');
  NEW.updated_at := now();
  RETURN NEW;
END;
$$;
CREATE TRIGGER trg_search_index_vector BEFORE INSERT OR UPDATE ON public.search_index
FOR EACH ROW EXECUTE FUNCTION public.search_index_vector_update();

-- ---------- CALENDAR ----------
CREATE TABLE public.calendars (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  campus_id uuid REFERENCES public.campuses(id) ON DELETE CASCADE,
  name text NOT NULL,
  description text,
  color text,
  owner_id uuid,
  is_default boolean NOT NULL DEFAULT false,
  visibility text NOT NULL DEFAULT 'tenant',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  created_by uuid, updated_by uuid, deleted_at timestamptz, deleted_by uuid
);
CREATE INDEX idx_calendars_tenant ON public.calendars(tenant_id);

CREATE TABLE public.calendar_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  calendar_id uuid REFERENCES public.calendars(id) ON DELETE CASCADE,
  campus_id uuid REFERENCES public.campuses(id) ON DELETE SET NULL,
  title text NOT NULL,
  description text,
  event_type public.calendar_event_type NOT NULL DEFAULT 'event',
  location text,
  starts_at timestamptz NOT NULL,
  ends_at timestamptz NOT NULL,
  all_day boolean NOT NULL DEFAULT false,
  recurrence_rule text,
  entity_type text,
  entity_id uuid,
  color text,
  is_public boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  created_by uuid, updated_by uuid, deleted_at timestamptz, deleted_by uuid
);
CREATE INDEX idx_calendar_events_tenant_time ON public.calendar_events(tenant_id, starts_at);

CREATE TABLE public.calendar_event_participants (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  event_id uuid NOT NULL REFERENCES public.calendar_events(id) ON DELETE CASCADE,
  user_id uuid,
  role text NOT NULL DEFAULT 'attendee',
  response text NOT NULL DEFAULT 'pending',
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (event_id, user_id)
);

CREATE TABLE public.calendar_event_reminders (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  event_id uuid NOT NULL REFERENCES public.calendar_events(id) ON DELETE CASCADE,
  user_id uuid,
  channel public.notification_channel NOT NULL DEFAULT 'in_app',
  minutes_before int NOT NULL DEFAULT 30,
  sent_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- ---------- TRIGGERS ----------
CREATE TRIGGER trg_notif_templates_updated BEFORE UPDATE ON public.notification_templates FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
CREATE TRIGGER trg_documents_updated BEFORE UPDATE ON public.documents FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
CREATE TRIGGER trg_media_assets_updated BEFORE UPDATE ON public.media_assets FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
CREATE TRIGGER trg_media_folders_updated BEFORE UPDATE ON public.media_folders FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
CREATE TRIGGER trg_comments_updated BEFORE UPDATE ON public.comments FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
CREATE TRIGGER trg_notes_updated BEFORE UPDATE ON public.notes FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
CREATE TRIGGER trg_tags_updated BEFORE UPDATE ON public.tags FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
CREATE TRIGGER trg_calendars_updated BEFORE UPDATE ON public.calendars FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
CREATE TRIGGER trg_calendar_events_updated BEFORE UPDATE ON public.calendar_events FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
CREATE TRIGGER trg_documents_audit AFTER INSERT OR UPDATE OR DELETE ON public.documents FOR EACH ROW EXECUTE FUNCTION public.audit_row_change();

-- ---------- GRANTS ----------
GRANT SELECT, INSERT, UPDATE, DELETE ON
  public.notification_templates, public.notification_preferences, public.notifications, public.notification_deliveries,
  public.document_types, public.documents, public.document_versions, public.media_folders, public.media_assets,
  public.attachments, public.comments, public.notes, public.tags, public.taggables, public.activity_feed,
  public.search_index, public.calendars, public.calendar_events, public.calendar_event_participants,
  public.calendar_event_reminders TO authenticated;
GRANT ALL ON
  public.notification_templates, public.notification_preferences, public.notifications, public.notification_deliveries,
  public.document_types, public.documents, public.document_versions, public.media_folders, public.media_assets,
  public.attachments, public.comments, public.notes, public.tags, public.taggables, public.activity_feed,
  public.search_index, public.calendars, public.calendar_events, public.calendar_event_participants,
  public.calendar_event_reminders TO service_role;

-- ---------- RLS ----------
ALTER TABLE public.notification_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notification_preferences ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notification_deliveries ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.document_types ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.document_versions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.media_folders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.media_assets ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.attachments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.comments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tags ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.taggables ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.activity_feed ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.search_index ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.calendars ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.calendar_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.calendar_event_participants ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.calendar_event_reminders ENABLE ROW LEVEL SECURITY;

CREATE POLICY notif_templates_select ON public.notification_templates FOR SELECT TO authenticated
  USING (tenant_id IS NULL OR public.is_tenant_member(tenant_id));
CREATE POLICY notif_templates_write ON public.notification_templates FOR ALL TO authenticated
  USING (public.has_permission('notification.manage', tenant_id)) WITH CHECK (public.has_permission('notification.manage', tenant_id));

CREATE POLICY notif_prefs_all ON public.notification_preferences FOR ALL TO authenticated
  USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());

CREATE POLICY notifications_select ON public.notifications FOR SELECT TO authenticated
  USING (recipient_id = auth.uid() OR public.has_permission('notification.manage', tenant_id));
CREATE POLICY notifications_update ON public.notifications FOR UPDATE TO authenticated
  USING (recipient_id = auth.uid()) WITH CHECK (recipient_id = auth.uid());
CREATE POLICY notifications_insert ON public.notifications FOR INSERT TO authenticated
  WITH CHECK (public.is_tenant_member(tenant_id));

CREATE POLICY notif_deliveries_select ON public.notification_deliveries FOR SELECT TO authenticated
  USING (recipient_id = auth.uid() OR public.has_permission('notification.manage', tenant_id));
CREATE POLICY notif_deliveries_write ON public.notification_deliveries FOR ALL TO authenticated
  USING (public.has_permission('notification.manage', tenant_id)) WITH CHECK (public.has_permission('notification.manage', tenant_id));

CREATE POLICY document_types_select ON public.document_types FOR SELECT TO authenticated
  USING (tenant_id IS NULL OR public.is_tenant_member(tenant_id));
CREATE POLICY document_types_write ON public.document_types FOR ALL TO authenticated
  USING (public.has_permission('document.manage', tenant_id)) WITH CHECK (public.has_permission('document.manage', tenant_id));

CREATE POLICY documents_select ON public.documents FOR SELECT TO authenticated
  USING (owner_id = auth.uid() OR created_by = auth.uid() OR public.has_permission('document.view', tenant_id));
CREATE POLICY documents_insert ON public.documents FOR INSERT TO authenticated
  WITH CHECK (public.is_tenant_member(tenant_id));
CREATE POLICY documents_update ON public.documents FOR UPDATE TO authenticated
  USING (owner_id = auth.uid() OR created_by = auth.uid() OR public.has_permission('document.manage', tenant_id))
  WITH CHECK (owner_id = auth.uid() OR created_by = auth.uid() OR public.has_permission('document.manage', tenant_id));
CREATE POLICY documents_delete ON public.documents FOR DELETE TO authenticated
  USING (public.has_permission('document.manage', tenant_id));

CREATE POLICY document_versions_select ON public.document_versions FOR SELECT TO authenticated
  USING (public.is_tenant_member(tenant_id));
CREATE POLICY document_versions_insert ON public.document_versions FOR INSERT TO authenticated
  WITH CHECK (public.is_tenant_member(tenant_id));

CREATE POLICY media_folders_select ON public.media_folders FOR SELECT TO authenticated USING (public.is_tenant_member(tenant_id));
CREATE POLICY media_folders_write ON public.media_folders FOR ALL TO authenticated
  USING (public.has_permission('media.manage', tenant_id)) WITH CHECK (public.has_permission('media.manage', tenant_id));

CREATE POLICY media_assets_select ON public.media_assets FOR SELECT TO authenticated USING (public.is_tenant_member(tenant_id));
CREATE POLICY media_assets_write ON public.media_assets FOR ALL TO authenticated
  USING (public.has_permission('media.manage', tenant_id) OR created_by = auth.uid())
  WITH CHECK (public.has_permission('media.manage', tenant_id) OR created_by = auth.uid());

CREATE POLICY attachments_select ON public.attachments FOR SELECT TO authenticated USING (public.is_tenant_member(tenant_id));
CREATE POLICY attachments_insert ON public.attachments FOR INSERT TO authenticated WITH CHECK (public.is_tenant_member(tenant_id));
CREATE POLICY attachments_update ON public.attachments FOR UPDATE TO authenticated
  USING (created_by = auth.uid() OR public.has_permission('document.manage', tenant_id))
  WITH CHECK (created_by = auth.uid() OR public.has_permission('document.manage', tenant_id));
CREATE POLICY attachments_delete ON public.attachments FOR DELETE TO authenticated
  USING (created_by = auth.uid() OR public.has_permission('document.manage', tenant_id));

CREATE POLICY comments_select ON public.comments FOR SELECT TO authenticated USING (public.is_tenant_member(tenant_id));
CREATE POLICY comments_insert ON public.comments FOR INSERT TO authenticated
  WITH CHECK (author_id = auth.uid() AND public.is_tenant_member(tenant_id));
CREATE POLICY comments_update ON public.comments FOR UPDATE TO authenticated
  USING (author_id = auth.uid()) WITH CHECK (author_id = auth.uid());
CREATE POLICY comments_delete ON public.comments FOR DELETE TO authenticated
  USING (author_id = auth.uid() OR public.has_permission('comment.moderate', tenant_id));

CREATE POLICY notes_select ON public.notes FOR SELECT TO authenticated
  USING (author_id = auth.uid() OR (is_private = false AND public.is_tenant_member(tenant_id)));
CREATE POLICY notes_insert ON public.notes FOR INSERT TO authenticated
  WITH CHECK (author_id = auth.uid() AND public.is_tenant_member(tenant_id));
CREATE POLICY notes_update ON public.notes FOR UPDATE TO authenticated
  USING (author_id = auth.uid()) WITH CHECK (author_id = auth.uid());
CREATE POLICY notes_delete ON public.notes FOR DELETE TO authenticated USING (author_id = auth.uid());

CREATE POLICY tags_select ON public.tags FOR SELECT TO authenticated USING (public.is_tenant_member(tenant_id));
CREATE POLICY tags_write ON public.tags FOR ALL TO authenticated
  USING (public.is_tenant_member(tenant_id)) WITH CHECK (public.is_tenant_member(tenant_id));
CREATE POLICY taggables_select ON public.taggables FOR SELECT TO authenticated USING (public.is_tenant_member(tenant_id));
CREATE POLICY taggables_write ON public.taggables FOR ALL TO authenticated
  USING (public.is_tenant_member(tenant_id)) WITH CHECK (public.is_tenant_member(tenant_id));

CREATE POLICY activity_select ON public.activity_feed FOR SELECT TO authenticated USING (public.is_tenant_member(tenant_id));
CREATE POLICY activity_insert ON public.activity_feed FOR INSERT TO authenticated WITH CHECK (public.is_tenant_member(tenant_id));

CREATE POLICY search_select ON public.search_index FOR SELECT TO authenticated USING (public.is_tenant_member(tenant_id));
CREATE POLICY search_write ON public.search_index FOR ALL TO authenticated
  USING (public.is_tenant_member(tenant_id)) WITH CHECK (public.is_tenant_member(tenant_id));

CREATE POLICY calendars_select ON public.calendars FOR SELECT TO authenticated USING (public.is_tenant_member(tenant_id));
CREATE POLICY calendars_write ON public.calendars FOR ALL TO authenticated
  USING (owner_id = auth.uid() OR public.has_permission('calendar.manage', tenant_id))
  WITH CHECK (owner_id = auth.uid() OR public.has_permission('calendar.manage', tenant_id));

CREATE POLICY calendar_events_select ON public.calendar_events FOR SELECT TO authenticated USING (public.is_tenant_member(tenant_id));
CREATE POLICY calendar_events_write ON public.calendar_events FOR ALL TO authenticated
  USING (created_by = auth.uid() OR public.has_permission('calendar.manage', tenant_id))
  WITH CHECK (created_by = auth.uid() OR public.has_permission('calendar.manage', tenant_id));

CREATE POLICY calendar_participants_select ON public.calendar_event_participants FOR SELECT TO authenticated USING (public.is_tenant_member(tenant_id));
CREATE POLICY calendar_participants_write ON public.calendar_event_participants FOR ALL TO authenticated
  USING (user_id = auth.uid() OR public.has_permission('calendar.manage', tenant_id))
  WITH CHECK (user_id = auth.uid() OR public.has_permission('calendar.manage', tenant_id));

CREATE POLICY calendar_reminders_all ON public.calendar_event_reminders FOR ALL TO authenticated
  USING (user_id = auth.uid() OR public.has_permission('calendar.manage', tenant_id))
  WITH CHECK (user_id = auth.uid() OR public.has_permission('calendar.manage', tenant_id));

ALTER PUBLICATION supabase_realtime ADD TABLE public.notifications;
ALTER PUBLICATION supabase_realtime ADD TABLE public.activity_feed;
