## CampusOS — Multi-Tenant College ERP

Full scope (30+ modules, 14 roles, compliance packs, AI) is too large for one pass. Phase 1 builds the complete enterprise **platform foundation** — database, security, and core primitives — so nothing structural has to be retrofitted later. Feature modules then plug into it phase by phase.

### Phase 1 — Platform Foundation

**1. Tenancy & org structure**
- `tenants` (colleges) → `campuses` → `buildings`/`blocks`
- `departments`, `programs`, `courses`, `academic_years`, `academic_sessions`, `semesters`
- Every tenant-scoped table carries `tenant_id` + optional `campus_id`
- `students`, `faculty`, `staff`, `enrollments`, `profiles`

**2. Dynamic RBAC (no hardcoded permissions)**
- `roles` (system + tenant-defined), `permissions` (resource + action), `permission_groups`, `role_permissions`, `user_roles`, `user_permission_overrides`
- Scope column on assignments: global / tenant / campus / department
- Security-definer functions `has_permission(user, resource, action, scope)`, `current_tenant_id()`, `user_campus_ids()` — used by all RLS policies
- Roles never stored on `profiles` (privilege-escalation safe)

**3. Feature flags & toggles**
- `features`, `tenant_features` (per-tenant on/off + config JSON), `feature_overrides` per campus/role

**4. Audit trail**
- `audit_logs`: actor, tenant, campus, entity type/id, action (create/update/delete/login/logout/export/view/approve/custom), before/after JSONB diff, IP, user agent, timestamp
- Generic trigger function attached to every business table
- `login_events`, `export_events` recorded through the same pipeline

**5. Version history**
- `record_versions`: entity type/id, version number, full snapshot JSONB, changed_by, reason — trigger-driven on important tables

**6. Soft delete**
- `deleted_at`, `deleted_by` on every table; RLS + views filter deleted rows by default

**7. Notification engine**
- `notification_templates` (channel-aware, variable placeholders), `notification_channels` (email/sms/push/whatsapp/in_app), `notification_preferences` (per user per channel per event), `notifications`, `notification_deliveries` (status, attempts, provider ids, error)

**8. Document management + media library + attachments**
- `documents` (polymorphic: entity_type + entity_id), `document_types`, `document_versions`
- `media_assets` + `media_folders` for the reusable media library
- `attachments` join table so any record in any module can carry files
- Storage buckets: `avatars` (public), `documents` (private), `media` (private), `exports` (private) with RLS on `storage.objects`

**9. Workflow engine**
- `workflows`, `workflow_versions`, `workflow_steps` (approver by role/permission/user, order, parallel/serial, SLA), `workflow_instances` (polymorphic subject), `workflow_step_instances`, `workflow_actions` (approve/reject/return/comment)
- Drives admissions, leave, fee waivers, certificates, reimbursements

**10. Form builder**
- `forms`, `form_versions`, `form_fields` (type, validation JSON, conditional logic), `form_submissions`, `form_submission_values`

**11. Custom fields**
- `custom_field_definitions` (entity type, data type, options, validation, scope), `custom_field_values` (polymorphic) — for students, faculty, staff and any future entity

**12. Settings engine**
- `settings_definitions` + `tenant_settings` (namespaced: tenant / academic / finance / notification / branding), campus-level overrides, typed values with defaults

**13. Master data**
- `countries`, `states`, `cities`, `blood_groups`, `religions`, `castes`, `categories`, `reservation_categories`, `nationalities`, `languages`, plus generic `master_data_types` / `master_data_items` for tenant-defined lists
- Seeded with real reference data

**14. Import / export framework**
- `import_jobs`, `import_mappings`, `import_errors`, `export_jobs` (CSV / Excel / PDF), progress + result file in storage

**15. Background jobs**
- `jobs` queue table (type, payload, status, attempts, run_at, locked_by, result), `job_schedules` for recurring work; used by imports, exports, notifications, AI tasks

**16. Webhooks & public API**
- `api_clients` (hashed keys, scopes), `api_request_logs`, `webhook_endpoints`, `webhook_events`, `webhook_deliveries` (signed payloads, retry state)
- REST-ready resource naming and a generated `/api/public/docs` surface

**17. Search, tagging, comments, activity feed, calendar**
- `search_index` (tenant-scoped, entity_type, title, body, tsvector + GIN index) kept fresh by triggers
- `tags` + polymorphic `taggables`
- `comments` (polymorphic, threaded, mentions) and `notes`
- `activity_feed` (actor, verb, object, audience scoping)
- `calendars`, `calendar_events`, `event_participants`, `event_reminders`

**18. Dashboard widget engine**
- `widgets` (catalog with required permission), `dashboard_layouts` per user/role, `dashboard_widgets` (position, size, config)

**19. AI-ready architecture**
- `ai_conversations`, `ai_messages`, `ai_prompts` (versioned templates), `ai_jobs`, `ai_insights` (entity-linked predictions with score + explanation), `embeddings` table with pgvector for semantic search — schema only in Phase 1

**Conventions applied everywhere**
UUID primary keys, normalized 3NF schema, foreign keys with explicit `ON DELETE` behaviour, enums for fixed domains, indexes on every FK + tenant_id + common filters, `created_at/updated_at/created_by/updated_by/deleted_at/deleted_by`, RLS enabled with explicit GRANTs on every single table.

**Also in Phase 1 (application layer)**
- Auth: email/password, Google sign-in, forgot + `/reset-password`, user invites, session management, `_authenticated` route gate
- Design system: enterprise light/dark theme, no gradients, generous whitespace, rounded cards, semantic tokens
- App shell: role-filtered collapsible sidebar, header with global search + notifications, breadcrumbs
- Reusable primitives: `DataTable` (sort/filter/paginate/CSV export), `PageHeader`, `StatCard`, `EmptyState`, Zod-backed form components, permission-gated rendering (`<Can permission="...">`)
- Working screens: Admin dashboard, Users & Roles & Permissions management, Departments/Programs/Courses CRUD, Student Information System, Student and Faculty dashboards
- Seed data: demo college with two campuses, departments, programs, courses, roles/permissions matrix, sample students and faculty

### Later phases
2. Attendance, Timetable, Assignments, Examination/Results
3. Fees, Scholarships, Finance, Payroll, HR
4. Library, Hostel, Transport, Inventory, Assets
5. Placement, Alumni, Certificates, Notices, Events, Complaints, Communication Center
6. AI features on the Phase 1 AI schema (chatbot, question paper / assignment / lesson generators, performance & dropout prediction, report writer)
7. Compliance reports (NAAC, NBA, AICTE, UGC, NEP, ABC, NIRF), analytics, PDF export, audit log viewer, public API docs UI

### Technical notes
- All privileged reads/writes go through TanStack Start server functions; RLS enforced as the signed-in user.
- Tenant and campus isolation enforced in RLS, never in client-side filters.
- Zod validation on both client and server boundaries.
- Background work uses the `jobs` table plus server routes under `/api/public/*` with signature verification, not in-memory state.
