
-- ============================================================
-- CampusOS Foundation : Part 4
-- Workflows, Forms, Import/Export, Jobs, API/Webhooks, Widgets, AI
-- ============================================================

CREATE TYPE public.workflow_status AS ENUM ('draft','active','archived');
CREATE TYPE public.workflow_instance_status AS ENUM ('pending','in_progress','approved','rejected','returned','cancelled','expired');
CREATE TYPE public.workflow_step_mode AS ENUM ('serial','parallel','any');
CREATE TYPE public.workflow_action_type AS ENUM ('approve','reject','return','comment','reassign','cancel');
CREATE TYPE public.job_status AS ENUM ('queued','running','succeeded','failed','cancelled','retrying');
CREATE TYPE public.io_job_status AS ENUM ('pending','validating','processing','completed','failed','partial','cancelled');
CREATE TYPE public.export_format AS ENUM ('csv','xlsx','pdf','json');
CREATE TYPE public.ai_job_kind AS ENUM ('chat','question_paper','assignment','lesson_plan','report','prediction','summary','embedding','other');

-- ---------- WORKFLOW ENGINE ----------
CREATE TABLE public.workflows (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  key text NOT NULL,
  name text NOT NULL,
  description text,
  module text NOT NULL,
  entity_type text NOT NULL,
  status public.workflow_status NOT NULL DEFAULT 'draft',
  current_version int NOT NULL DEFAULT 1,
  auto_start boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  created_by uuid, updated_by uuid, deleted_at timestamptz, deleted_by uuid,
  UNIQUE (tenant_id, key)
);
CREATE INDEX idx_workflows_tenant ON public.workflows(tenant_id);

CREATE TABLE public.workflow_versions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  workflow_id uuid NOT NULL REFERENCES public.workflows(id) ON DELETE CASCADE,
  version int NOT NULL,
  definition jsonb NOT NULL DEFAULT '{}'::jsonb,
  is_published boolean NOT NULL DEFAULT false,
  published_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  created_by uuid,
  UNIQUE (workflow_id, version)
);

CREATE TABLE public.workflow_steps (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  workflow_id uuid NOT NULL REFERENCES public.workflows(id) ON DELETE CASCADE,
  version int NOT NULL DEFAULT 1,
  step_order int NOT NULL,
  name text NOT NULL,
  mode public.workflow_step_mode NOT NULL DEFAULT 'serial',
  approver_role_id uuid REFERENCES public.roles(id) ON DELETE SET NULL,
  approver_permission text,
  approver_user_id uuid,
  approver_department_id uuid REFERENCES public.departments(id) ON DELETE SET NULL,
  sla_hours int,
  allow_delegate boolean NOT NULL DEFAULT true,
  conditions jsonb NOT NULL DEFAULT '{}'::jsonb,
  on_approve jsonb NOT NULL DEFAULT '{}'::jsonb,
  on_reject jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (workflow_id, version, step_order)
);
CREATE INDEX idx_workflow_steps_tenant ON public.workflow_steps(tenant_id);

CREATE TABLE public.workflow_instances (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  campus_id uuid REFERENCES public.campuses(id) ON DELETE SET NULL,
  workflow_id uuid NOT NULL REFERENCES public.workflows(id) ON DELETE CASCADE,
  version int NOT NULL DEFAULT 1,
  entity_type text NOT NULL,
  entity_id uuid NOT NULL,
  subject text,
  status public.workflow_instance_status NOT NULL DEFAULT 'pending',
  current_step_order int NOT NULL DEFAULT 1,
  requested_by uuid,
  payload jsonb NOT NULL DEFAULT '{}'::jsonb,
  due_at timestamptz,
  completed_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  created_by uuid, updated_by uuid, deleted_at timestamptz, deleted_by uuid
);
CREATE INDEX idx_wf_instances_tenant ON public.workflow_instances(tenant_id, status);
CREATE INDEX idx_wf_instances_entity ON public.workflow_instances(entity_type, entity_id);

CREATE TABLE public.workflow_step_instances (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  instance_id uuid NOT NULL REFERENCES public.workflow_instances(id) ON DELETE CASCADE,
  step_id uuid REFERENCES public.workflow_steps(id) ON DELETE SET NULL,
  step_order int NOT NULL,
  name text NOT NULL,
  status public.workflow_instance_status NOT NULL DEFAULT 'pending',
  assigned_user_id uuid,
  assigned_role_id uuid REFERENCES public.roles(id) ON DELETE SET NULL,
  due_at timestamptz,
  completed_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX idx_wf_step_instances_instance ON public.workflow_step_instances(instance_id);
CREATE INDEX idx_wf_step_instances_assignee ON public.workflow_step_instances(assigned_user_id, status);

CREATE TABLE public.workflow_actions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  instance_id uuid NOT NULL REFERENCES public.workflow_instances(id) ON DELETE CASCADE,
  step_instance_id uuid REFERENCES public.workflow_step_instances(id) ON DELETE CASCADE,
  actor_id uuid,
  action public.workflow_action_type NOT NULL,
  comment text,
  metadata jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX idx_wf_actions_instance ON public.workflow_actions(instance_id);

-- ---------- FORM BUILDER ----------
CREATE TABLE public.forms (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  key text NOT NULL,
  name text NOT NULL,
  description text,
  module text,
  entity_type text,
  is_public boolean NOT NULL DEFAULT false,
  is_active boolean NOT NULL DEFAULT true,
  current_version int NOT NULL DEFAULT 1,
  workflow_id uuid REFERENCES public.workflows(id) ON DELETE SET NULL,
  settings jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  created_by uuid, updated_by uuid, deleted_at timestamptz, deleted_by uuid,
  UNIQUE (tenant_id, key)
);

CREATE TABLE public.form_versions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  form_id uuid NOT NULL REFERENCES public.forms(id) ON DELETE CASCADE,
  version int NOT NULL,
  schema jsonb NOT NULL DEFAULT '{}'::jsonb,
  is_published boolean NOT NULL DEFAULT false,
  published_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  created_by uuid,
  UNIQUE (form_id, version)
);

CREATE TABLE public.form_fields (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  form_id uuid NOT NULL REFERENCES public.forms(id) ON DELETE CASCADE,
  version int NOT NULL DEFAULT 1,
  key text NOT NULL,
  label text NOT NULL,
  field_type public.custom_field_type NOT NULL DEFAULT 'text',
  placeholder text,
  help_text text,
  section text,
  options jsonb NOT NULL DEFAULT '[]'::jsonb,
  validation jsonb NOT NULL DEFAULT '{}'::jsonb,
  conditional_logic jsonb NOT NULL DEFAULT '{}'::jsonb,
  default_value jsonb,
  is_required boolean NOT NULL DEFAULT false,
  sort_order int NOT NULL DEFAULT 0,
  width text NOT NULL DEFAULT 'full',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (form_id, version, key)
);
CREATE INDEX idx_form_fields_form ON public.form_fields(form_id);

CREATE TABLE public.form_submissions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  form_id uuid NOT NULL REFERENCES public.forms(id) ON DELETE CASCADE,
  version int NOT NULL DEFAULT 1,
  submitted_by uuid,
  entity_type text,
  entity_id uuid,
  data jsonb NOT NULL DEFAULT '{}'::jsonb,
  status text NOT NULL DEFAULT 'submitted',
  workflow_instance_id uuid REFERENCES public.workflow_instances(id) ON DELETE SET NULL,
  submitted_at timestamptz NOT NULL DEFAULT now(),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  deleted_at timestamptz, deleted_by uuid
);
CREATE INDEX idx_form_submissions_form ON public.form_submissions(form_id);
CREATE INDEX idx_form_submissions_tenant ON public.form_submissions(tenant_id);

CREATE TABLE public.form_submission_values (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  submission_id uuid NOT NULL REFERENCES public.form_submissions(id) ON DELETE CASCADE,
  field_key text NOT NULL,
  value jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (submission_id, field_key)
);

-- ---------- IMPORT / EXPORT ----------
CREATE TABLE public.import_mappings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  name text NOT NULL,
  entity_type text NOT NULL,
  mapping jsonb NOT NULL DEFAULT '{}'::jsonb,
  is_default boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  created_by uuid
);

CREATE TABLE public.import_jobs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  entity_type text NOT NULL,
  mapping_id uuid REFERENCES public.import_mappings(id) ON DELETE SET NULL,
  file_name text,
  storage_path text,
  status public.io_job_status NOT NULL DEFAULT 'pending',
  total_rows int NOT NULL DEFAULT 0,
  processed_rows int NOT NULL DEFAULT 0,
  success_rows int NOT NULL DEFAULT 0,
  error_rows int NOT NULL DEFAULT 0,
  options jsonb NOT NULL DEFAULT '{}'::jsonb,
  error text,
  started_at timestamptz,
  finished_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  created_by uuid
);
CREATE INDEX idx_import_jobs_tenant ON public.import_jobs(tenant_id, status);

CREATE TABLE public.import_errors (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  import_job_id uuid NOT NULL REFERENCES public.import_jobs(id) ON DELETE CASCADE,
  row_number int NOT NULL,
  column_name text,
  message text NOT NULL,
  raw_row jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX idx_import_errors_job ON public.import_errors(import_job_id);

CREATE TABLE public.export_jobs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  entity_type text NOT NULL,
  format public.export_format NOT NULL DEFAULT 'csv',
  filters jsonb NOT NULL DEFAULT '{}'::jsonb,
  columns jsonb NOT NULL DEFAULT '[]'::jsonb,
  status public.io_job_status NOT NULL DEFAULT 'pending',
  row_count int NOT NULL DEFAULT 0,
  storage_path text,
  error text,
  expires_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  created_by uuid
);
CREATE INDEX idx_export_jobs_tenant ON public.export_jobs(tenant_id, status);

-- ---------- BACKGROUND JOBS ----------
CREATE TABLE public.jobs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid REFERENCES public.tenants(id) ON DELETE CASCADE,
  type text NOT NULL,
  payload jsonb NOT NULL DEFAULT '{}'::jsonb,
  status public.job_status NOT NULL DEFAULT 'queued',
  priority int NOT NULL DEFAULT 5,
  attempts int NOT NULL DEFAULT 0,
  max_attempts int NOT NULL DEFAULT 3,
  run_at timestamptz NOT NULL DEFAULT now(),
  locked_at timestamptz,
  locked_by text,
  result jsonb,
  error text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  created_by uuid
);
CREATE INDEX idx_jobs_queue ON public.jobs(status, run_at);
CREATE INDEX idx_jobs_tenant ON public.jobs(tenant_id);

CREATE TABLE public.job_schedules (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid REFERENCES public.tenants(id) ON DELETE CASCADE,
  name text NOT NULL,
  job_type text NOT NULL,
  cron_expression text NOT NULL,
  payload jsonb NOT NULL DEFAULT '{}'::jsonb,
  is_active boolean NOT NULL DEFAULT true,
  last_run_at timestamptz,
  next_run_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  created_by uuid
);

-- ---------- API CLIENTS + WEBHOOKS ----------
CREATE TABLE public.api_clients (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  name text NOT NULL,
  description text,
  key_prefix text NOT NULL,
  key_hash text NOT NULL,
  scopes text[] NOT NULL DEFAULT '{}',
  rate_limit_per_minute int NOT NULL DEFAULT 60,
  is_active boolean NOT NULL DEFAULT true,
  last_used_at timestamptz,
  expires_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  created_by uuid, updated_by uuid, deleted_at timestamptz, deleted_by uuid,
  UNIQUE (key_prefix)
);
CREATE INDEX idx_api_clients_tenant ON public.api_clients(tenant_id);

CREATE TABLE public.api_request_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid REFERENCES public.tenants(id) ON DELETE CASCADE,
  api_client_id uuid REFERENCES public.api_clients(id) ON DELETE SET NULL,
  method text NOT NULL,
  path text NOT NULL,
  status_code int,
  duration_ms int,
  ip_address inet,
  user_agent text,
  error text,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX idx_api_logs_tenant_time ON public.api_request_logs(tenant_id, created_at DESC);

CREATE TABLE public.webhook_endpoints (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  name text NOT NULL,
  url text NOT NULL,
  secret_hash text,
  events text[] NOT NULL DEFAULT '{}',
  is_active boolean NOT NULL DEFAULT true,
  max_retries int NOT NULL DEFAULT 5,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  created_by uuid, updated_by uuid, deleted_at timestamptz, deleted_by uuid
);

CREATE TABLE public.webhook_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  event_key text NOT NULL,
  entity_type text,
  entity_id uuid,
  payload jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX idx_webhook_events_tenant ON public.webhook_events(tenant_id, created_at DESC);

CREATE TABLE public.webhook_deliveries (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  endpoint_id uuid NOT NULL REFERENCES public.webhook_endpoints(id) ON DELETE CASCADE,
  event_id uuid NOT NULL REFERENCES public.webhook_events(id) ON DELETE CASCADE,
  status public.job_status NOT NULL DEFAULT 'queued',
  attempts int NOT NULL DEFAULT 0,
  response_status int,
  response_body text,
  error text,
  next_retry_at timestamptz,
  delivered_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX idx_webhook_deliveries_status ON public.webhook_deliveries(status, next_retry_at);

-- ---------- DASHBOARD WIDGETS ----------
CREATE TABLE public.widgets (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  key text NOT NULL UNIQUE,
  name text NOT NULL,
  description text,
  category text,
  module text,
  required_permission text,
  default_width int NOT NULL DEFAULT 4,
  default_height int NOT NULL DEFAULT 2,
  config_schema jsonb NOT NULL DEFAULT '{}'::jsonb,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE public.dashboard_layouts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  user_id uuid,
  role_id uuid REFERENCES public.roles(id) ON DELETE CASCADE,
  name text NOT NULL DEFAULT 'Default',
  is_default boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX idx_dashboard_layouts_tenant ON public.dashboard_layouts(tenant_id);

CREATE TABLE public.dashboard_widgets (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  layout_id uuid NOT NULL REFERENCES public.dashboard_layouts(id) ON DELETE CASCADE,
  widget_id uuid NOT NULL REFERENCES public.widgets(id) ON DELETE CASCADE,
  position_x int NOT NULL DEFAULT 0,
  position_y int NOT NULL DEFAULT 0,
  width int NOT NULL DEFAULT 4,
  height int NOT NULL DEFAULT 2,
  config jsonb NOT NULL DEFAULT '{}'::jsonb,
  is_visible boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX idx_dashboard_widgets_layout ON public.dashboard_widgets(layout_id);

-- ---------- AI FOUNDATION ----------
CREATE TABLE public.ai_prompts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid REFERENCES public.tenants(id) ON DELETE CASCADE,
  key text NOT NULL,
  name text NOT NULL,
  kind public.ai_job_kind NOT NULL DEFAULT 'other',
  version int NOT NULL DEFAULT 1,
  system_prompt text,
  user_template text,
  model text,
  temperature numeric(3,2) NOT NULL DEFAULT 0.7,
  variables jsonb NOT NULL DEFAULT '[]'::jsonb,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  created_by uuid
);
CREATE UNIQUE INDEX idx_ai_prompts_unique ON public.ai_prompts(COALESCE(tenant_id,'00000000-0000-0000-0000-000000000000'::uuid), key, version);

CREATE TABLE public.ai_conversations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  user_id uuid NOT NULL,
  title text NOT NULL DEFAULT 'New conversation',
  context_type text,
  context_id uuid,
  model text,
  is_archived boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  deleted_at timestamptz, deleted_by uuid
);
CREATE INDEX idx_ai_conversations_user ON public.ai_conversations(user_id, updated_at DESC);

CREATE TABLE public.ai_messages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  conversation_id uuid NOT NULL REFERENCES public.ai_conversations(id) ON DELETE CASCADE,
  role text NOT NULL,
  content text NOT NULL,
  parts jsonb,
  tokens_used int,
  model text,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX idx_ai_messages_conversation ON public.ai_messages(conversation_id, created_at);

CREATE TABLE public.ai_jobs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  kind public.ai_job_kind NOT NULL,
  prompt_id uuid REFERENCES public.ai_prompts(id) ON DELETE SET NULL,
  requested_by uuid,
  input jsonb NOT NULL DEFAULT '{}'::jsonb,
  output jsonb,
  status public.job_status NOT NULL DEFAULT 'queued',
  model text,
  tokens_used int,
  error text,
  started_at timestamptz,
  finished_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX idx_ai_jobs_tenant ON public.ai_jobs(tenant_id, status);

CREATE TABLE public.ai_insights (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  entity_type text NOT NULL,
  entity_id uuid NOT NULL,
  insight_type text NOT NULL,
  title text NOT NULL,
  summary text,
  score numeric(6,3),
  confidence numeric(4,3),
  severity text,
  explanation jsonb NOT NULL DEFAULT '{}'::jsonb,
  recommended_actions jsonb NOT NULL DEFAULT '[]'::jsonb,
  model text,
  valid_until timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX idx_ai_insights_entity ON public.ai_insights(entity_type, entity_id);
CREATE INDEX idx_ai_insights_tenant ON public.ai_insights(tenant_id, insight_type);

-- ---------- TRIGGERS ----------
CREATE TRIGGER trg_workflows_updated BEFORE UPDATE ON public.workflows FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
CREATE TRIGGER trg_wf_instances_updated BEFORE UPDATE ON public.workflow_instances FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
CREATE TRIGGER trg_forms_updated BEFORE UPDATE ON public.forms FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
CREATE TRIGGER trg_wf_instances_audit AFTER INSERT OR UPDATE OR DELETE ON public.workflow_instances FOR EACH ROW EXECUTE FUNCTION public.audit_row_change();
CREATE TRIGGER trg_api_clients_audit AFTER INSERT OR UPDATE OR DELETE ON public.api_clients FOR EACH ROW EXECUTE FUNCTION public.audit_row_change();

-- ---------- GRANTS ----------
GRANT SELECT, INSERT, UPDATE, DELETE ON
  public.workflows, public.workflow_versions, public.workflow_steps, public.workflow_instances,
  public.workflow_step_instances, public.workflow_actions, public.forms, public.form_versions,
  public.form_fields, public.form_submissions, public.form_submission_values, public.import_mappings,
  public.import_jobs, public.import_errors, public.export_jobs, public.jobs, public.job_schedules,
  public.api_clients, public.api_request_logs, public.webhook_endpoints, public.webhook_events,
  public.webhook_deliveries, public.widgets, public.dashboard_layouts, public.dashboard_widgets,
  public.ai_prompts, public.ai_conversations, public.ai_messages, public.ai_jobs, public.ai_insights
  TO authenticated;
GRANT ALL ON
  public.workflows, public.workflow_versions, public.workflow_steps, public.workflow_instances,
  public.workflow_step_instances, public.workflow_actions, public.forms, public.form_versions,
  public.form_fields, public.form_submissions, public.form_submission_values, public.import_mappings,
  public.import_jobs, public.import_errors, public.export_jobs, public.jobs, public.job_schedules,
  public.api_clients, public.api_request_logs, public.webhook_endpoints, public.webhook_events,
  public.webhook_deliveries, public.widgets, public.dashboard_layouts, public.dashboard_widgets,
  public.ai_prompts, public.ai_conversations, public.ai_messages, public.ai_jobs, public.ai_insights
  TO service_role;

-- ---------- RLS ----------
ALTER TABLE public.workflows ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.workflow_versions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.workflow_steps ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.workflow_instances ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.workflow_step_instances ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.workflow_actions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.forms ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.form_versions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.form_fields ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.form_submissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.form_submission_values ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.import_mappings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.import_jobs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.import_errors ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.export_jobs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.jobs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.job_schedules ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.api_clients ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.api_request_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.webhook_endpoints ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.webhook_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.webhook_deliveries ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.widgets ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.dashboard_layouts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.dashboard_widgets ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ai_prompts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ai_conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ai_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ai_jobs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ai_insights ENABLE ROW LEVEL SECURITY;

CREATE POLICY workflows_select ON public.workflows FOR SELECT TO authenticated USING (public.is_tenant_member(tenant_id));
CREATE POLICY workflows_write ON public.workflows FOR ALL TO authenticated
  USING (public.has_permission('workflow.manage', tenant_id)) WITH CHECK (public.has_permission('workflow.manage', tenant_id));
CREATE POLICY wf_versions_select ON public.workflow_versions FOR SELECT TO authenticated USING (public.is_tenant_member(tenant_id));
CREATE POLICY wf_versions_write ON public.workflow_versions FOR ALL TO authenticated
  USING (public.has_permission('workflow.manage', tenant_id)) WITH CHECK (public.has_permission('workflow.manage', tenant_id));
CREATE POLICY wf_steps_select ON public.workflow_steps FOR SELECT TO authenticated USING (public.is_tenant_member(tenant_id));
CREATE POLICY wf_steps_write ON public.workflow_steps FOR ALL TO authenticated
  USING (public.has_permission('workflow.manage', tenant_id)) WITH CHECK (public.has_permission('workflow.manage', tenant_id));

CREATE POLICY wf_instances_select ON public.workflow_instances FOR SELECT TO authenticated
  USING (requested_by = auth.uid() OR public.has_permission('workflow.view', tenant_id)
    OR EXISTS (SELECT 1 FROM public.workflow_step_instances si WHERE si.instance_id = workflow_instances.id AND si.assigned_user_id = auth.uid()));
CREATE POLICY wf_instances_insert ON public.workflow_instances FOR INSERT TO authenticated
  WITH CHECK (public.is_tenant_member(tenant_id));
CREATE POLICY wf_instances_update ON public.workflow_instances FOR UPDATE TO authenticated
  USING (public.has_permission('workflow.act', tenant_id) OR requested_by = auth.uid())
  WITH CHECK (public.has_permission('workflow.act', tenant_id) OR requested_by = auth.uid());

CREATE POLICY wf_step_instances_select ON public.workflow_step_instances FOR SELECT TO authenticated
  USING (assigned_user_id = auth.uid() OR public.has_permission('workflow.view', tenant_id));
CREATE POLICY wf_step_instances_write ON public.workflow_step_instances FOR ALL TO authenticated
  USING (assigned_user_id = auth.uid() OR public.has_permission('workflow.act', tenant_id))
  WITH CHECK (assigned_user_id = auth.uid() OR public.has_permission('workflow.act', tenant_id));

CREATE POLICY wf_actions_select ON public.workflow_actions FOR SELECT TO authenticated USING (public.is_tenant_member(tenant_id));
CREATE POLICY wf_actions_insert ON public.workflow_actions FOR INSERT TO authenticated
  WITH CHECK (actor_id = auth.uid() AND public.is_tenant_member(tenant_id));

CREATE POLICY forms_select ON public.forms FOR SELECT TO authenticated USING (public.is_tenant_member(tenant_id));
CREATE POLICY forms_write ON public.forms FOR ALL TO authenticated
  USING (public.has_permission('form.manage', tenant_id)) WITH CHECK (public.has_permission('form.manage', tenant_id));
CREATE POLICY form_versions_select ON public.form_versions FOR SELECT TO authenticated USING (public.is_tenant_member(tenant_id));
CREATE POLICY form_versions_write ON public.form_versions FOR ALL TO authenticated
  USING (public.has_permission('form.manage', tenant_id)) WITH CHECK (public.has_permission('form.manage', tenant_id));
CREATE POLICY form_fields_select ON public.form_fields FOR SELECT TO authenticated USING (public.is_tenant_member(tenant_id));
CREATE POLICY form_fields_write ON public.form_fields FOR ALL TO authenticated
  USING (public.has_permission('form.manage', tenant_id)) WITH CHECK (public.has_permission('form.manage', tenant_id));

CREATE POLICY form_submissions_select ON public.form_submissions FOR SELECT TO authenticated
  USING (submitted_by = auth.uid() OR public.has_permission('form.view_submissions', tenant_id));
CREATE POLICY form_submissions_insert ON public.form_submissions FOR INSERT TO authenticated
  WITH CHECK (public.is_tenant_member(tenant_id));
CREATE POLICY form_submissions_update ON public.form_submissions FOR UPDATE TO authenticated
  USING (submitted_by = auth.uid() OR public.has_permission('form.manage', tenant_id))
  WITH CHECK (submitted_by = auth.uid() OR public.has_permission('form.manage', tenant_id));

CREATE POLICY form_values_select ON public.form_submission_values FOR SELECT TO authenticated USING (public.is_tenant_member(tenant_id));
CREATE POLICY form_values_write ON public.form_submission_values FOR ALL TO authenticated
  USING (public.is_tenant_member(tenant_id)) WITH CHECK (public.is_tenant_member(tenant_id));

CREATE POLICY import_mappings_all ON public.import_mappings FOR ALL TO authenticated
  USING (public.has_permission('data.import', tenant_id)) WITH CHECK (public.has_permission('data.import', tenant_id));
CREATE POLICY import_jobs_all ON public.import_jobs FOR ALL TO authenticated
  USING (public.has_permission('data.import', tenant_id) OR created_by = auth.uid())
  WITH CHECK (public.has_permission('data.import', tenant_id));
CREATE POLICY import_errors_select ON public.import_errors FOR SELECT TO authenticated
  USING (public.has_permission('data.import', tenant_id));
CREATE POLICY import_errors_insert ON public.import_errors FOR INSERT TO authenticated
  WITH CHECK (public.has_permission('data.import', tenant_id));
CREATE POLICY export_jobs_all ON public.export_jobs FOR ALL TO authenticated
  USING (created_by = auth.uid() OR public.has_permission('data.export', tenant_id))
  WITH CHECK (public.has_permission('data.export', tenant_id));

CREATE POLICY jobs_select ON public.jobs FOR SELECT TO authenticated
  USING (public.has_permission('system.jobs', tenant_id));
CREATE POLICY jobs_write ON public.jobs FOR ALL TO authenticated
  USING (public.has_permission('system.jobs', tenant_id)) WITH CHECK (public.has_permission('system.jobs', tenant_id));
CREATE POLICY job_schedules_all ON public.job_schedules FOR ALL TO authenticated
  USING (public.has_permission('system.jobs', tenant_id)) WITH CHECK (public.has_permission('system.jobs', tenant_id));

CREATE POLICY api_clients_all ON public.api_clients FOR ALL TO authenticated
  USING (public.has_permission('api.manage', tenant_id)) WITH CHECK (public.has_permission('api.manage', tenant_id));
CREATE POLICY api_logs_select ON public.api_request_logs FOR SELECT TO authenticated
  USING (public.has_permission('api.manage', tenant_id));
CREATE POLICY webhook_endpoints_all ON public.webhook_endpoints FOR ALL TO authenticated
  USING (public.has_permission('api.manage', tenant_id)) WITH CHECK (public.has_permission('api.manage', tenant_id));
CREATE POLICY webhook_events_select ON public.webhook_events FOR SELECT TO authenticated
  USING (public.has_permission('api.manage', tenant_id));
CREATE POLICY webhook_deliveries_select ON public.webhook_deliveries FOR SELECT TO authenticated
  USING (public.has_permission('api.manage', tenant_id));

CREATE POLICY widgets_select ON public.widgets FOR SELECT TO authenticated USING (true);
CREATE POLICY widgets_write ON public.widgets FOR ALL TO authenticated
  USING (public.is_platform_admin()) WITH CHECK (public.is_platform_admin());
CREATE POLICY dashboard_layouts_all ON public.dashboard_layouts FOR ALL TO authenticated
  USING (user_id = auth.uid() OR public.has_permission('dashboard.manage', tenant_id))
  WITH CHECK (user_id = auth.uid() OR public.has_permission('dashboard.manage', tenant_id));
CREATE POLICY dashboard_widgets_all ON public.dashboard_widgets FOR ALL TO authenticated
  USING (EXISTS (SELECT 1 FROM public.dashboard_layouts l WHERE l.id = layout_id AND (l.user_id = auth.uid() OR public.has_permission('dashboard.manage', l.tenant_id))))
  WITH CHECK (EXISTS (SELECT 1 FROM public.dashboard_layouts l WHERE l.id = layout_id AND (l.user_id = auth.uid() OR public.has_permission('dashboard.manage', l.tenant_id))));

CREATE POLICY ai_prompts_select ON public.ai_prompts FOR SELECT TO authenticated
  USING (tenant_id IS NULL OR public.is_tenant_member(tenant_id));
CREATE POLICY ai_prompts_write ON public.ai_prompts FOR ALL TO authenticated
  USING (public.has_permission('ai.manage', tenant_id)) WITH CHECK (public.has_permission('ai.manage', tenant_id));
CREATE POLICY ai_conversations_all ON public.ai_conversations FOR ALL TO authenticated
  USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid() AND public.is_tenant_member(tenant_id));
CREATE POLICY ai_messages_all ON public.ai_messages FOR ALL TO authenticated
  USING (EXISTS (SELECT 1 FROM public.ai_conversations c WHERE c.id = conversation_id AND c.user_id = auth.uid()))
  WITH CHECK (EXISTS (SELECT 1 FROM public.ai_conversations c WHERE c.id = conversation_id AND c.user_id = auth.uid()));
CREATE POLICY ai_jobs_select ON public.ai_jobs FOR SELECT TO authenticated
  USING (requested_by = auth.uid() OR public.has_permission('ai.manage', tenant_id));
CREATE POLICY ai_jobs_insert ON public.ai_jobs FOR INSERT TO authenticated
  WITH CHECK (requested_by = auth.uid() AND public.is_tenant_member(tenant_id));
CREATE POLICY ai_insights_select ON public.ai_insights FOR SELECT TO authenticated
  USING (public.has_permission('ai.insights.view', tenant_id));
CREATE POLICY ai_insights_write ON public.ai_insights FOR ALL TO authenticated
  USING (public.has_permission('ai.manage', tenant_id)) WITH CHECK (public.has_permission('ai.manage', tenant_id));
