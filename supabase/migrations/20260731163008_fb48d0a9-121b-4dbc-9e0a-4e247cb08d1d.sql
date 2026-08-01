ALTER TABLE public.exam_rooms
  ADD COLUMN IF NOT EXISTS floor integer,
  ADD COLUMN IF NOT EXISTS block_label text,
  ADD COLUMN IF NOT EXISTS is_special_needs boolean NOT NULL DEFAULT false;

ALTER TABLE public.exam_seats
  ADD COLUMN IF NOT EXISTS bench_number integer,
  ADD COLUMN IF NOT EXISTS is_special_needs boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS verification_code text;

ALTER TABLE public.exam_invigilators
  ADD COLUMN IF NOT EXISTS attendance_status text NOT NULL DEFAULT 'pending',
  ADD COLUMN IF NOT EXISTS departed_at timestamptz,
  ADD COLUMN IF NOT EXISTS swapped_from uuid REFERENCES public.exam_invigilators(id) ON DELETE SET NULL;

ALTER TABLE public.exam_registrations
  ADD COLUMN IF NOT EXISTS fee_hold boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS hold_reason text;

ALTER TABLE public.results
  ADD COLUMN IF NOT EXISTS is_frozen boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS is_locked boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS frozen_at timestamptz,
  ADD COLUMN IF NOT EXISTS locked_at timestamptz;

ALTER TABLE public.revaluation_requests
  ADD COLUMN IF NOT EXISTS payment_status text NOT NULL DEFAULT 'unpaid',
  ADD COLUMN IF NOT EXISTS payment_reference text,
  ADD COLUMN IF NOT EXISTS paid_at timestamptz;

ALTER TABLE public.question_papers
  ADD COLUMN IF NOT EXISTS release_at timestamptz;