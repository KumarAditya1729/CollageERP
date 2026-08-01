-- ============================================================================
-- MODULE 7: LIBRARY MANAGEMENT (32 tables)
-- ============================================================================

CREATE TABLE public.lib_categories (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  name text NOT NULL,
  parent_id uuid REFERENCES public.lib_categories(id),
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE public.lib_publishers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  name text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE public.lib_authors (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  name text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE public.lib_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  title text NOT NULL,
  isbn text,
  item_type text NOT NULL, -- book, ebook, journal, magazine
  category_id uuid REFERENCES public.lib_categories(id),
  publisher_id uuid REFERENCES public.lib_publishers(id),
  author_id uuid REFERENCES public.lib_authors(id),
  edition text,
  language text,
  price numeric,
  cover_url text,
  description text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE public.lib_item_copies (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  item_id uuid NOT NULL REFERENCES public.lib_items(id) ON DELETE CASCADE,
  accession_number text NOT NULL,
  barcode text,
  rfid_tag text,
  status public.lib_item_status NOT NULL DEFAULT 'available',
  condition text DEFAULT 'good',
  location text, -- shelf mapping
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(tenant_id, accession_number)
);

CREATE TABLE public.lib_fine_rules (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  member_type text NOT NULL, -- student, faculty
  item_type text NOT NULL, -- book, magazine
  max_days integer NOT NULL,
  fine_per_day numeric NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE public.lib_members (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES auth.users(id),
  member_number text NOT NULL,
  member_type text NOT NULL,
  status text DEFAULT 'active',
  joined_date date NOT NULL DEFAULT CURRENT_DATE,
  expiry_date date,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(tenant_id, user_id),
  UNIQUE(tenant_id, member_number)
);

CREATE TABLE public.lib_issue_transactions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  member_id uuid NOT NULL REFERENCES public.lib_members(id),
  copy_id uuid NOT NULL REFERENCES public.lib_item_copies(id),
  issue_date timestamptz NOT NULL DEFAULT now(),
  due_date timestamptz NOT NULL,
  return_date timestamptz,
  status text NOT NULL DEFAULT 'issued', -- issued, returned, lost
  issued_by uuid REFERENCES auth.users(id),
  received_by uuid REFERENCES auth.users(id),
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE public.lib_renewals (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  transaction_id uuid NOT NULL REFERENCES public.lib_issue_transactions(id) ON DELETE CASCADE,
  renewal_date timestamptz NOT NULL DEFAULT now(),
  new_due_date timestamptz NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE public.lib_reservations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  member_id uuid NOT NULL REFERENCES public.lib_members(id),
  item_id uuid NOT NULL REFERENCES public.lib_items(id),
  reservation_date timestamptz NOT NULL DEFAULT now(),
  status text NOT NULL DEFAULT 'active', -- active, fulfilled, cancelled, expired
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE public.lib_fines (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  member_id uuid NOT NULL REFERENCES public.lib_members(id),
  transaction_id uuid REFERENCES public.lib_issue_transactions(id),
  amount numeric NOT NULL,
  reason text NOT NULL,
  status text NOT NULL DEFAULT 'unpaid',
  invoice_id uuid, -- link to finance later
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE public.lib_lost_reports (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  copy_id uuid NOT NULL REFERENCES public.lib_item_copies(id),
  member_id uuid REFERENCES public.lib_members(id),
  report_date timestamptz NOT NULL DEFAULT now(),
  penalty_amount numeric,
  status text DEFAULT 'pending',
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE public.lib_damaged_reports (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  copy_id uuid NOT NULL REFERENCES public.lib_item_copies(id),
  member_id uuid REFERENCES public.lib_members(id),
  description text NOT NULL,
  report_date timestamptz NOT NULL DEFAULT now(),
  fine_amount numeric,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE public.lib_digital_resources (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  item_id uuid NOT NULL REFERENCES public.lib_items(id) ON DELETE CASCADE,
  file_url text NOT NULL,
  format text NOT NULL, -- pdf, epub
  size_bytes bigint,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE public.lib_reading_history (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  member_id uuid NOT NULL REFERENCES public.lib_members(id),
  item_id uuid NOT NULL REFERENCES public.lib_items(id),
  last_accessed timestamptz NOT NULL DEFAULT now(),
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE public.lib_stock_verifications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  title text NOT NULL,
  start_date timestamptz NOT NULL,
  end_date timestamptz,
  status text NOT NULL DEFAULT 'in_progress',
  conducted_by uuid REFERENCES auth.users(id),
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE public.lib_stock_verification_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  verification_id uuid NOT NULL REFERENCES public.lib_stock_verifications(id) ON DELETE CASCADE,
  copy_id uuid NOT NULL REFERENCES public.lib_item_copies(id),
  is_found boolean DEFAULT false,
  scanned_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE public.lib_inventory_adjustments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  copy_id uuid NOT NULL REFERENCES public.lib_item_copies(id),
  adjustment_type text NOT NULL, -- added, removed, lost
  reason text,
  adjusted_by uuid REFERENCES auth.users(id),
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE public.lib_vendors (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  name text NOT NULL,
  contact_info text,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE public.lib_purchase_requests (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  requested_by uuid NOT NULL REFERENCES auth.users(id),
  title text NOT NULL,
  author text,
  publisher text,
  isbn text,
  reason text,
  status text DEFAULT 'pending',
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE public.lib_acquisitions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  vendor_id uuid REFERENCES public.lib_vendors(id),
  order_date date NOT NULL,
  total_amount numeric,
  status text DEFAULT 'ordered',
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE public.lib_accession_batches (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  acquisition_id uuid REFERENCES public.lib_acquisitions(id),
  batch_number text NOT NULL,
  received_date date NOT NULL,
  total_items integer NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE public.lib_weeding (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  copy_id uuid NOT NULL REFERENCES public.lib_item_copies(id),
  reason text NOT NULL,
  weeding_date date NOT NULL,
  approved_by uuid REFERENCES auth.users(id),
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE public.lib_inter_library_loans (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  member_id uuid NOT NULL REFERENCES public.lib_members(id),
  partner_library_name text NOT NULL,
  item_details text NOT NULL,
  request_date date NOT NULL,
  status text DEFAULT 'requested',
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE public.lib_book_reviews (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  item_id uuid NOT NULL REFERENCES public.lib_items(id) ON DELETE CASCADE,
  member_id uuid NOT NULL REFERENCES public.lib_members(id),
  rating integer NOT NULL CHECK(rating >= 1 AND rating <= 5),
  review_text text,
  is_approved boolean DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE public.lib_bookmarks (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  member_id uuid NOT NULL REFERENCES public.lib_members(id),
  item_id uuid NOT NULL REFERENCES public.lib_items(id) ON DELETE CASCADE,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE public.lib_notifications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  member_id uuid NOT NULL REFERENCES public.lib_members(id),
  title text NOT NULL,
  message text NOT NULL,
  is_read boolean DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE public.lib_settings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  key text NOT NULL,
  value jsonb NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(tenant_id, key)
);
