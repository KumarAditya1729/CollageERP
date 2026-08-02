-- ==============================================================================
-- Transport Faculty Allocations & Relational Joins Perfection
-- ==============================================================================
-- Guarantees pickup_stop_id and drop_stop_id exist on trn_faculty_allocations
-- and connects explicit foreign keys to trn_stops for PostgREST relational joins.
-- ==============================================================================

ALTER TABLE public.trn_faculty_allocations ALTER COLUMN stop_id DROP NOT NULL;
ALTER TABLE public.trn_faculty_allocations ADD COLUMN IF NOT EXISTS pickup_stop_id uuid REFERENCES public.trn_stops(id) ON DELETE SET NULL;
ALTER TABLE public.trn_faculty_allocations ADD COLUMN IF NOT EXISTS drop_stop_id uuid REFERENCES public.trn_stops(id) ON DELETE SET NULL;

-- Backfill pickup_stop_id and drop_stop_id from existing stop_id if available
UPDATE public.trn_faculty_allocations 
SET 
  pickup_stop_id = COALESCE(pickup_stop_id, stop_id),
  drop_stop_id = COALESCE(drop_stop_id, stop_id)
WHERE pickup_stop_id IS NULL OR drop_stop_id IS NULL;

CREATE INDEX IF NOT EXISTS idx_trn_faculty_alloc_pickup ON public.trn_faculty_allocations(pickup_stop_id);
CREATE INDEX IF NOT EXISTS idx_trn_faculty_alloc_drop ON public.trn_faculty_allocations(drop_stop_id);

-- Force schema reload across PostgREST cloud API nodes
NOTIFY pgrst, 'reload schema';
