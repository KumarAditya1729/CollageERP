-- ============================================================================
-- SEED PERMISSIONS FOR CAMPUS OPS
-- ============================================================================

INSERT INTO public.permissions (id, key, name, description, module, action, resource)
VALUES
  -- Inventory
  (gen_random_uuid(), 'inventory.read', 'Read Inventory', 'View inventory', 'inventory', 'read', 'inventory'),
  (gen_random_uuid(), 'inventory.manage', 'Manage Inventory', 'Full access to inventory', 'inventory', 'manage', 'inventory'),
  -- Maintenance
  (gen_random_uuid(), 'maintenance.read', 'Read Maintenance', 'View maintenance', 'maintenance', 'read', 'maintenance'),
  (gen_random_uuid(), 'maintenance.manage', 'Manage Maintenance', 'Full access to maintenance', 'maintenance', 'manage', 'maintenance'),
  -- Visitor
  (gen_random_uuid(), 'visitor.read', 'Read Visitors', 'View visitors', 'visitor', 'read', 'visitor'),
  (gen_random_uuid(), 'visitor.manage', 'Manage Visitors', 'Full access to visitors', 'visitor', 'manage', 'visitor'),
  -- Security
  (gen_random_uuid(), 'security.read', 'Read Security', 'View security', 'security', 'read', 'security'),
  (gen_random_uuid(), 'security.manage', 'Manage Security', 'Full access to security', 'security', 'manage', 'security'),
  -- Medical
  (gen_random_uuid(), 'medical.read', 'Read Medical', 'View medical', 'medical', 'read', 'medical'),
  (gen_random_uuid(), 'medical.manage', 'Manage Medical', 'Full access to medical', 'medical', 'manage', 'medical'),
  -- Hostel
  (gen_random_uuid(), 'hostel.read', 'Read Hostel', 'View hostel', 'hostel', 'read', 'hostel'),
  (gen_random_uuid(), 'hostel.manage', 'Manage Hostel', 'Full access to hostel', 'hostel', 'manage', 'hostel'),
  -- Transport
  (gen_random_uuid(), 'transport.read', 'Read Transport', 'View transport', 'transport', 'read', 'transport'),
  (gen_random_uuid(), 'transport.manage', 'Manage Transport', 'Full access to transport', 'transport', 'manage', 'transport'),
  -- Library
  (gen_random_uuid(), 'library.read', 'Read Library', 'View library', 'library', 'read', 'library'),
  (gen_random_uuid(), 'library.manage', 'Manage Library', 'Full access to library', 'library', 'manage', 'library'),
  -- SDK
  (gen_random_uuid(), 'sdk.manage', 'Manage SDK', 'Full access to extensions', 'sdk', 'manage', 'sdk')
ON CONFLICT (key) DO NOTHING;
