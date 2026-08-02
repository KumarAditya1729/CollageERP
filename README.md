# CampusOS 3.0 Enterprise — Interdisciplinary & Multi-Tenant College ERP Platform

<div align="center">
  <img src="https://img.shields.io/badge/Framework-TanStack%20Start%20%7C%20React%2019-3B82F6?style=for-the-badge&logo=react" alt="TanStack Start" />
  <img src="https://img.shields.io/badge/Database-Supabase%20%7C%20PostgreSQL%2015-3ECF8E?style=for-the-badge&logo=supabase" alt="Supabase PostgreSQL" />
  <img src="https://img.shields.io/badge/Styling-Tailwind%20CSS%20v4-38BDF8?style=for-the-badge&logo=tailwindcss" alt="Tailwind CSS v4" />
  <img src="https://img.shields.io/badge/Architecture-Multi--Tenant%20%7C%20RBAC-8B5CF6?style=for-the-badge&logo=amazon-iam" alt="Multi-Tenant RBAC" />
  <img src="https://img.shields.io/badge/Security-RLS%20Hardened%20%7C%20Audit%20Verified-E11D48?style=for-the-badge&logo=shield" alt="Enterprise Security" />
</div>

---

## 🌟 Executive Summary & Vision

**CampusOS 3.0 Enterprise** is a next-generation, cloud-native, multi-tenant Enterprise Resource Planning (ERP) platform designed specifically for modern universities, autonomous colleges, and interconnected educational group institutions. 

Built on top of cutting-edge server-side rendered (SSR) React via **TanStack Start**, strict end-to-end type-safe routing, and a hardened **Supabase PostgreSQL** database, CampusOS bridges administrative efficiency, academic governance, student self-service, financial integrity, and campus operations into a single, unified, interdisciplinary software ecosystem.

Every high-density interactive dashboard, ledger, and schedule is built from the ground up to support responsive desktop views as well as mobile-first stacked interfaces, complete with real-time bidirectional WebSocket synchronizations, regulatory forensic auditing, and offline operational capabilities.

---

## 🏛️ Comprehensive Architecture & Security Matrix

### 🔐 1. Multi-Tenant & Multi-Campus Data Isolation (RLS Hardened)
- **Zero Cross-Tenant Leakage**: All database tables across all 18+ enterprise suites strictly implement PostgreSQL Row-Level Security (RLS). Access logic is governed by an automated, hardened security layer utilizing `user_tenant_ids()` and `is_tenant_member()`.
- **High-Speed B-Tree Indexing**: Automated migration sweeps guarantee that every tenant table contains optimized B-tree indexes (`idx_<tablename>_tenant_id`), completely eliminating expensive database sequential scans during high-traffic academic registration or examination periods.
- **Hierarchical Scaffolding**: Single server instances cleanly manage multiple universities, autonomous campus branches, and subsidiary departments under distinct workspaces with dedicated custom configurations.

### ⚖️ 2. Forensic Audit Engine & Regulatory Compliance
- **Real-time Regulatory Triggers**: Sensitive modules such as **Student Grades**, **Examination Results**, and **Admissions** feature automated defensive triggers at the database root level (`process_audit_log`).
- **Complete Audit Trails**: Captures actor identities (`actor_email`), timestamps, operation types (`INSERT`, `UPDATE`, `DELETE`), and immutable before/after diff payloads in JSONB format, ensuring absolute compliance with NAAC, UGC, AICTE, and financial auditing guidelines.

### 🛡️ 3. Role-Based Access Control (RBAC) & Dynamic Permissions
- **Granular Privilege Matrix**: Custom hierarchical roles (Super Admin, Registrar, Dean, Finance Officer, Controller of Examinations, HOD, Faculty, Librarian, Transport Manager, Medical Officer, Student, Guardian) dictate interface visibility and read/write capabilities down to field-level precision.
- **Defensive Frontend Stability**: Complete application tree protected against malformed storage states and unpredictable API data payloads via isolated error boundaries and strict `try/catch` JSON parsers.

---

## 🧩 The 18+ Interdisciplinary Module Suites

```
┌────────────────────────────────────────────────────────────────────────────────────────┐
│                          CAMPUSOS 3.0 ENTERPRISE ECOSYSTEM                            │
├───────────────┬───────────────┬─────────────────┬──────────────────┬──────────────────┤
│ ACADEMIC &    │ ENTERPRISE    │ CAMPUS & FLEET  │ ASSET & LIBRARY  │ COMMUNICATION &  │
│ EVALUATION    │ FINANCE & HR  │ OPERATIONS      │ LOGISTICS        │ ENGAGEMENT       │
├───────────────┼───────────────┼─────────────────┼──────────────────┼──────────────────┤
│ • Admissions  │ • Gen Ledger  │ • Transport     │ • Library RFID   │ • CRM & Leads    │
│ • Students    │ • Payments    │ • Hostel Matrix │ • Fixed Assets   │ • WhatsApp/SMS   │
│ • Timetables  │ • Procurement │ • Visitors QR   │ • Inventory      │ • Design Studio  │
│ • Attendance  │ • HRMS & Mng. │ • Security Log  │ • Maintenance    │ • Deep Webhooks  │
│ • Exams & LMS │ • Payroll     │ • Infirmary Med │ • Procurement    │ • Statutory Rep. │
└───────────────┴───────────────┴─────────────────┴──────────────────┴──────────────────┘
```

### 🎓 1. Student Lifecycle & Admissions Suite
- **Omnichannel Admission Portal**: Manage applicant funnels from initial lead capture through document verification (KYC), qualification screening, and digital onboarding.
- **Student Master Register (`/students`)**: Deep digital dossiers featuring academic lineage, attendance statistics, fee balances, disciplinary records, medical history, and verified guardian contacts.
- **Section & Batch Re-shuffle**: Bulk automated assignment of students into programs, semesters, branches, and specific academic sections.
- **Alumni & Credentials**: Complete transition from active academic enrollment to verified alumni registers with permanent verifiable credentials.

### 📚 2. Academics & Dynamic Timetable Engine
- **Curriculum Builder (`/academics/curriculum`)**: Design degree programs, elective offerings, choice-based credit system (CBCS) structures, course weights, and prerequisites.
- **Interactive Timetable & Calendar (`/academics/timetable`)**: Visual matrix scheduling for classrooms, labs, and lecture theatres.
- **🤖 Automated Clash Prevention**: Real-time database trigger verification (`check_timetable_conflict`) that instantly blocks overlapping room occupancy or duplicate faculty allocations across different courses.
- **Faculty Lesson Planning**: Track course completion velocity against syllabus timelines.

### ⏱️ 3. Attendance & Smart Circulation
- **Session & Biometric Capturing (`/attendance`)**: Record lectures via instant classroom head-count, RFID card taps, or biometric hardware integrations.
- **Shortage & Policy Alerts**: Automatic computation of attendance percentage against university academic rules (e.g., compulsory 75% threshold), triggering automated notices to students and guardians.
- **Correction & Leave Workflows**: Integrated formal student leave requests and faculty attendance correction pipelines with multi-tier approvals.
- **Offline Resiliency**: Equipped with offline queue state storage (`useAttendance`), enabling attendance recording during internet outages with automatic synchronization upon connectivity restoration.

### 📝 4. Examinations & Academic Evaluation Matrix (Wave 4 Hardened)
- **Exam Center & Scheduling (`/exams`)**: Configure midterm, final, practical, and supplementary examinations with custom date sheets and grade scaling rules.
- **🪑 Seating Arrangement & Room Matrix (`/exams/seating`)**: Automated exam hall desk allocations matching classroom seating capacity against registered student counts to eliminate maldistribution.
- **Hall Ticket Generator (`/exams/hall-tickets`)**: Dynamic issuance of QR-verified hall tickets featuring automatic **Fee Hold Overrides** (blocking ticket generation for fee delinquents).
- **Marks Entry & Grading Engine (`/exams/results`)**: Normalized gradebook processing supporting absolute marks, grading points, GPA/CGPA conversions, and revaluation processing.
- **Digital Signature & Freeze**: Immutable publication of grade cards protected by database audit logging and cryptographic verification codes.

### 💻 5. LMS (Learning Management System)
- **Digital Learning Hub (`/lms`)**: Seamless repository for faculty course materials, interactive lesson modules, reference textbooks, and video lectures.
- **Assignments & Assessments**: Create scheduled homework deliverables with file attachment uploads, grading rubrics, and plagiarism verifications.
- **Interactive Quizzes**: Auto-grading multiple-choice, true/false, and analytical quiz engines with timed attempt limits.
- **Academic Discussion Forums**: Collaborative course thread spaces for peer-to-peer inquiry and professorial moderation.

### 💰 6. Enterprise Finance & Procurement Suite (Wave 2 Hardened)
- **Interactive General Ledger (`/finance/ledger`)**: Complete double-entry accounting trail tracking debit/credit vouchers, journal adjustments, and financial trial balances.
- **Dynamic Fee Structures (`/finance/fee-structures`)**: Customizable student tuition tiering, scholarship deductions, installment schedules, and hostel/mess surcharges.
- **Payment Gateway & Receivables (`/finance/payments`)**: Instant fee receipt generation (`RCT-xxxx`) across Net Banking, UPI, Cards, and cash deposits with real-time student ledger updates.
- **Procurement & Vendor Management (`/finance/procurement`)**: Complete cycle from departmental Purchase Requests (PR) to formalized Purchase Orders (PO), Vendor Documents, and Goods Receipt tracking.
- **Accounts Payable & Invoices (`/finance/invoices`)**: Automated processing of vendor billing, tax deductions, and deferred payment scheduling.
- **Fixed Asset Accounting (`/finance/assets`)**: Institutional capital assets register tracking historical purchasing valuations, real-time fiscal depreciation schedules, and maintenance repairs.
- **Bank Reconciliations (`/finance/bank-accounts`)**: Multi-account statement reconciliation matching internal financial transactions against external institutional banking records.
- **Departmental Budget Allocations (`/finance/budgets`)**: Enforce fiscal spending limits across scientific laboratories, events, departments, and administrative bodies.

### 👥 7. HRMS & Payroll Automation Suite (Wave 5 Hardened)
- **Staff Master & Document Vault (`/hrms`)**: Centralized repository of teaching and administrative personnel, appointment letters, educational degrees, contract renewals, and promotion histories.
- **Recruitment Engine (`/hrms/recruitment`)**: Job position vacancy postings, resume collection funnels, interview stage evaluations, and automated offer letter generation.
- **Leave & Self-Service Portals (`/hrms/self-service`)**: Staff check-in/check-out time logs, compensatory leave filings, pay slip downloads, and tax declarations.
- **Performance Appraisals (`/hrms/performance`)**: Track academic research output, student teaching feedback scores, institutional goals, and departmental appraisals.
- **Payroll Generation Run (`/hrms/payroll`)**: Single-click automated payroll calculation factoring in basic pay, grade pay, HRA, dear allowances, EPF contributions, ESI deductions, and professional tax.

### 🚌 8. Fleet & Transport Administration (Wave 5 Hardened)
- **Vehicle Telematics & Register (`/transport`)**: Track university coaches, minivans, and ambulances including registration certificates, insurance policy expiry dates, pollution certificates (PUC), and odometer usage.
- **Route Matrix & Stop Tiers**: Configure dynamic bus routing paths with specific pickup/drop-off landmarks and zoned transport fare calculations.
- **Passenger Allocation & Waiting Lists**: Manage active bus pass subscriber rosters with built-in **Capacity Overflow Protection** that automatically migrates excess applicants to an intelligent `trn_waiting_list` queue.

### 🏨 9. Hostel & Dormitory Management (Wave 5 Hardened)
- **Residential Building Matrix (`/hostel`)**: Organize boys and girls dormitories across distinct floors, wing sectors, and living room layouts.
- **Bed Allocation & Occupancy Dashboard**: Visual grid display of vacant, occupied, and maintenance-hold beds with immediate check-in/check-out assignment procedures.
- **Hostel Visitors & Out-passes**: Monitor late-night student curfew gate exits, parent overnight approvals, and mess dietary enrollments.

### 🏛️ 10. Library & RFID Resource Catalog
- **Central Reservoir (`/library`)**: Organize textbooks, academic thesis dissertations, technical journals, and e-book reserves with ISBN and Dewey Decimal classifications.
- **Copy Accessioning & Circulation (`/library/circulation`)**: Barcode and RFID card-based barcode scanning for rapid book checkouts, renewals, and returns.
- **Fine & Overdue Engine (`/library/fines`)**: Automatic daily fine computation for late deliveries, damaged dust jacket replacements, and lost library card recovery fees.

### 📦 11. Inventory, Central Stores & Maintenance
- **Central Stock Register (`/inventory`)**: Track departmental supplies, lab reagents, sports equipment, and administrative office stationery.
- **Inflow/Outflow Movement Audience**: Precise stock audit tracking capturing vendor consignments, departmental requisitions, and inventory depreciation discards.
- **Facility Maintenance & Repairs (`/campus-maintenance`)**: Digital ticketing system for plumbing, electrical, IT infrastructure, and carpentry fault reports with assigned technician repair progress tracking.

### 🛡️ 12. Security, Visitors & Medical Records
- **Visitor QR Check-in (`/visitors`)**: Generate time-limited QR access passes for guest lecturers, parent visits, and maintenance contractors.
- **Blacklisting & Security Audits (`/security`)**: Real-time identification of banned individuals, vehicle license number entry/exit logging, and campus security patrol emergency reporting.
- **Campus Health Infirmary (`/medical`)**: Confidential student and staff outpatient infirmary visit logs, administered medication dosages, allergies registration, and ambulance emergency evacuations.

### 🤝 13. CRM, Leads & Omnichannel Communications
- **Admission CRM & Funnel (`/crm`)**: Track walk-in inquiries, career fair prospects, website contact forms, and social media advertising conversion pipelines.
- **Institutional Broadcast Engine (`/communications`)**: Dispatch urgent emergency announcements, fee due notifications, holiday circulars, and newsletter bulletins via email, SMS, and messaging channels.

### 🎨 14. Design Studio & Template Builder
- **Dynamic Template Composer (`/design-studio`)**: Interactive graphical layout creator for institutional identity documents, merit awards, employee ID badges, and leaving certificates.
- **Automated Mail-Merge & Printing**: Overlay database student variables, profile photos, and cryptographic QR verification hashes directly onto PDF document generation batches.

### 🔗 15. Integrations & Hardware Telematics
- **Deep Biometric Sync (`/integrations`)**: Plug-and-play webhook pipelines engineered for real-time synchronization with Anviz, Matrix, and ZKTeco biometric turnstile gate controllers and fingerprint scanners.
- **Payment Gateways**: API bindings tailored for Razorpay, Stripe, and bank automated NEFT/RTGS statement parsers.
- **Statutory & Accreditation Compliance (`/statutory-compliance`)**: Pre-formatted data aggregation tools generating standardized reporting deliverables tailored for NAAC, UGC, AICTE, GST, and labor department compliance audits.

---

## 💻 Technology Stack & Architectural Specifications

| Component | Engineering Choice | Rationale |
| :--- | :--- | :--- |
| **Full-Stack Framework** | [TanStack Start](https://tanstack.com/start) | Modern server-side rendering (SSR), streaming hydration, zero-bundle overhead APIs, and absolute compatibility with React 19. |
| **Application Router** | [TanStack Router](https://tanstack.com/router) | Completely type-safe file-based route definitions, parallel data loader fetching, and Search Parameter validation via Zod. |
| **Database & Auth Engine** | [Supabase (PostgreSQL 15+)](https://supabase.com) | Relational SQL transactional rigor, real-time WebSocket subscriptions, secure Auth JWT claims, and Edge Storage capabilities. |
| **State & Mutation Caching**| [TanStack Query v5](https://tanstack.com/query) | Automated server state revalidation, optimistic UI updates, persistent cache purging, and retry fallback resilience. |
| **Design & UI System** | [Tailwind CSS v4 + Radix UI](https://tailwindcss.com) | Highly accessible composable unstyled atomic primitive components, HSL tailored variables, dark modes, and responsive grid structures. |
| **Data Verification & Forms** | [React Hook Form + Zod](https://zod.dev) | Zero-re-render high-performance form bindings coupled with strictly enforced runtime interface boundary validation schemas. |

---

## 🚀 Getting Started & Local Development

### 1. Prerequisites
Ensure your local development workstation has the following installed:
* **Node.js** (v20.0.0 or later)
* **npm** (v10.0.0 or later) or **pnpm** / **bun**
* **Git** and **Supabase CLI** (optional, for local database container hosting)

### 2. Repository Setup & Installation
Clone the enterprise repository and install required project dependancies:

```bash
git clone https://github.com/KumarAditya1729/CollageERP.git
cd CollageERP
npm install
```

### 3. Environment Configuration
Create an `.env` (or `.env.local`) configuration file in the project root containing your Supabase project parameters:

```ini
# Supabase Project Connectivity
VITE_SUPABASE_URL="https://your-supabase-tenant.supabase.co"
VITE_SUPABASE_ANON_KEY="your-supabase-public-anon-key"

# Optional: Server-side administration (Do NOT expose to client bundles)
SUPABASE_SERVICE_ROLE_KEY="your-supabase-service-role-key"
```

### 4. Database Schema Provisioning
To instantiate the required multi-tenant PostgreSQL schema, RLS policies, functional procedures, triggers, and performance indexes, deploy the database migrations located in `supabase/migrations`:

```bash
# Push schema directly to your connected remote Supabase instance
npx supabase db push

# OR: Initialize a Dockerized local PostgreSQL development database
npx supabase start
```
*Note: The master migration file `20260803000000_master_security_rls_and_indexes_audit.sql` will automatically execute last, guaranteeing 100% table RLS coverage and indexing.*

### 5. Launch Development Server
Start the hot-reloading Vite dev engine:

```bash
npm run dev
```
Navigate your browser to `http://localhost:3000` to access the CampusOS 3.0 workspace interface.

---

## 🛠️ Production Build & Verification

CampusOS features automated verification checking and production bundling utilizing **Nitro** under TanStack Start:

```bash
# Execute full type-checking and build production bundle
npm run build

# Preview optimized production server locally
npm start
# (or execute: npx vite preview)
```
The typical enterprise compile cycle finishes in **under 1,500ms** with zero TypeScript or dependency tree resolution defects.

---

## 📁 Repository Structure & Routing Hierarchy

```
├── .output/                    # Optimized server/client production bundles
├── .vscode/                    # IDE editor workspace rules & settings
├── src/
│   ├── components/
│   │   ├── common/             # Reusable UI primitives (DataTable, RecordFormDialog, StatCard)
│   │   ├── design/             # Interactive studios (TemplateBuilder)
│   │   └── layout/             # Responsive shells (AppSidebar, Navbar, MobileNav)
│   ├── hooks/                  # Custom business logic (useAttendance, useLocalList, useLMS)
│   ├── integrations/
│   │   └── supabase/           # Strongly typed database interface generators (types.ts)
│   ├── lib/                    # Core utilities (integrationService.ts, export utilities)
│   ├── routes/                 # TanStack file-based route definitions
│   │   ├── _authenticated/     # Protected enterprise modules (finance, hrms, exams, students...)
│   │   └── index.tsx           # Entry authentication portals
│   └── server.ts               # Server-side hydration routing endpoints
├── supabase/
│   ├── migrations/             # Chronological enterprise SQL schema, RBAC, & RLS scripts
│   └── config.toml             # Supabase cloud tenant configuration
├── package.json                # Dependency manifest & npm script commands
└── tsconfig.json               # TypeScript strict compiler configuration
```

---

## 🧪 Testing & Proactive Audit Verification

This codebase undergoes rigorous, continuous architectural and forensic bug-hunting inspections. Key verified reliability checkpoints include:
* **No Unprotected `JSON.parse`**: All localStorage reads and payload parsing operations are wrapped in safe fallback exception handling blocks to prevent UI tree mounting failures.
* **Date & Numerical Defensive Guarding**: Financial asset calculations and academic calendars incorporate ternary fallback zeroing (`|| 0` and null-date checkers), eliminating visual `NaN` and `Invalid Date` anomalies.
* **Idempotent Migration Verification**: Database structural modifications leverage PostgreSQL conditional block execution (`DO $$ ... IF NOT EXISTS`), enabling seamless repetitive migration replays during CI/CD deployments.

---

## 📄 License & Legal Notice

**© 2026 CampusOS Enterprise.** All rights reserved. 
This software and associated architectural designs are intellectual property engineered for scalable institutional deployment. Unlicensed commercial distribution or reverse engineering is strictly prohibited unless explicitly authorized under custom enterprise subscription agreements.

---
<div align="center">
  <b>Engineered with cutting-edge artificial intelligence, architectural precision, and uncompromising security.</b>
  <br/>
  <i>Empowering educational excellence through modern automation.</i>
</div>
