CREATE TABLE public.trn_waiting_list (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  student_id uuid NOT NULL REFERENCES public.students(id),
  pickup_location text,
  application_date date NOT NULL DEFAULT CURRENT_DATE,
  status text NOT NULL DEFAULT 'waiting', -- waiting, allocated, cancelled
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.trn_waiting_list ENABLE ROW LEVEL SECURITY;

CREATE POLICY waiting_list_select ON public.trn_waiting_list FOR SELECT TO authenticated
  USING (
    tenant_id IN (SELECT public.user_tenant_ids())
    AND (
      public.has_permission('transport.view', tenant_id)
      OR student_id IN (SELECT id FROM public.students WHERE user_id = auth.uid())
    )
  );

CREATE POLICY waiting_list_insert ON public.trn_waiting_list FOR INSERT TO authenticated
  WITH CHECK (
    tenant_id IN (SELECT public.user_tenant_ids())
    AND public.has_permission('transport.manage', tenant_id)
  );

CREATE POLICY waiting_list_update ON public.trn_waiting_list FOR UPDATE TO authenticated
  USING (
    tenant_id IN (SELECT public.user_tenant_ids())
    AND public.has_permission('transport.manage', tenant_id)
  );

CREATE POLICY waiting_list_delete ON public.trn_waiting_list FOR DELETE TO authenticated
  USING (
    tenant_id IN (SELECT public.user_tenant_ids())
    AND public.has_permission('transport.manage', tenant_id)
  );
