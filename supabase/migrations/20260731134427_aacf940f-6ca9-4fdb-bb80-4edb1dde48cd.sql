
-- ============================================================
-- CampusOS Foundation : Part 5 — Catalogue + Seed Data
-- ============================================================

-- ---------- PERMISSION CATALOGUE ----------
INSERT INTO public.permissions (key, module, resource, action, name) VALUES
('tenant.update','core','tenant','update','Update college settings'),
('campus.manage','core','campus','manage','Manage campuses'),
('user.manage','core','user','manage','Manage users'),
('user.invite','core','user','invite','Invite users'),
('role.manage','core','role','manage','Manage roles'),
('role.assign','core','role','assign','Assign roles'),
('settings.manage','core','settings','manage','Manage settings'),
('audit.view','core','audit','view','View audit logs'),
('master_data.manage','core','master_data','manage','Manage master data'),
('department.manage','academics','department','manage','Manage departments'),
('academic.manage','academics','academic_year','manage','Manage academic years and sessions'),
('program.manage','academics','program','manage','Manage programs'),
('course.manage','academics','course','manage','Manage courses'),
('faculty.view','people','faculty','view','View faculty'),
('faculty.manage','people','faculty','manage','Manage faculty'),
('staff.view','people','staff','view','View staff'),
('staff.manage','people','staff','manage','Manage staff'),
('student.view','people','student','view','View students'),
('student.manage','people','student','manage','Manage students'),
('enrollment.view','academics','enrollment','view','View enrollments'),
('enrollment.manage','academics','enrollment','manage','Manage enrollments'),
('admission.view','admissions','admission','view','View admissions'),
('admission.manage','admissions','admission','manage','Manage admissions'),
('attendance.view','attendance','attendance','view','View attendance'),
('attendance.manage','attendance','attendance','manage','Manage attendance'),
('timetable.view','timetable','timetable','view','View timetable'),
('timetable.manage','timetable','timetable','manage','Manage timetable'),
('exam.view','examination','exam','view','View examinations'),
('exam.manage','examination','exam','manage','Manage examinations'),
('assignment.view','assignments','assignment','view','View assignments'),
('assignment.manage','assignments','assignment','manage','Manage assignments'),
('fee.view','finance','fee','view','View fees'),
('fee.manage','finance','fee','manage','Manage fees'),
('finance.view','finance','finance','view','View finance'),
('finance.manage','finance','finance','manage','Manage finance'),
('payroll.manage','hr','payroll','manage','Manage payroll'),
('hr.manage','hr','hr','manage','Manage HR'),
('library.view','library','library','view','View library'),
('library.manage','library','library','manage','Manage library'),
('hostel.view','hostel','hostel','view','View hostel'),
('hostel.manage','hostel','hostel','manage','Manage hostel'),
('transport.view','transport','transport','view','View transport'),
('transport.manage','transport','transport','manage','Manage transport'),
('inventory.manage','inventory','inventory','manage','Manage inventory and assets'),
('placement.view','placement','placement','view','View placements'),
('placement.manage','placement','placement','manage','Manage placements'),
('alumni.manage','alumni','alumni','manage','Manage alumni'),
('certificate.issue','certificates','certificate','issue','Issue certificates'),
('notice.manage','communication','notice','manage','Manage notices'),
('notification.manage','communication','notification','manage','Manage notifications'),
('document.view','documents','document','view','View documents'),
('document.manage','documents','document','manage','Manage documents'),
('media.manage','documents','media','manage','Manage media library'),
('comment.moderate','core','comment','moderate','Moderate comments'),
('calendar.manage','calendar','calendar','manage','Manage calendars and events'),
('workflow.view','workflow','workflow','view','View workflows'),
('workflow.manage','workflow','workflow','manage','Manage workflows'),
('workflow.act','workflow','workflow','act','Approve or reject workflow steps'),
('form.manage','forms','form','manage','Manage forms'),
('form.view_submissions','forms','form','view_submissions','View form submissions'),
('data.import','data','import','execute','Import data'),
('data.export','data','export','execute','Export data'),
('system.jobs','system','job','manage','Manage background jobs'),
('api.manage','system','api','manage','Manage API clients and webhooks'),
('dashboard.manage','core','dashboard','manage','Manage dashboards'),
('analytics.view','analytics','analytics','view','View analytics'),
('report.view','reports','report','view','View reports'),
('report.generate','reports','report','generate','Generate compliance reports'),
('ai.manage','ai','ai','manage','Manage AI configuration'),
('ai.insights.view','ai','insight','view','View AI insights'),
('ai.assistant.use','ai','assistant','use','Use the AI assistant');

-- ---------- SYSTEM ROLES ----------
INSERT INTO public.roles (id, tenant_id, key, name, description, level, is_system, default_route) VALUES
('11111111-0000-4000-8000-000000000001', NULL, 'super_admin','Super Admin','Platform-wide administrator',0,true,'/admin'),
('11111111-0000-4000-8000-000000000002', NULL, 'college_admin','College Admin','Full administrative access within the college',10,true,'/dashboard'),
('11111111-0000-4000-8000-000000000003', NULL, 'principal','Principal','Head of the institution',20,true,'/dashboard'),
('11111111-0000-4000-8000-000000000004', NULL, 'registrar','Registrar','Academic records and admissions',30,true,'/dashboard'),
('11111111-0000-4000-8000-000000000005', NULL, 'dean','Dean','Faculty-level academic leadership',30,true,'/dashboard'),
('11111111-0000-4000-8000-000000000006', NULL, 'hod','Head of Department','Departmental leadership',40,true,'/dashboard'),
('11111111-0000-4000-8000-000000000007', NULL, 'faculty','Faculty','Teaching staff',50,true,'/faculty'),
('11111111-0000-4000-8000-000000000008', NULL, 'accountant','Accountant','Finance and fees',50,true,'/dashboard'),
('11111111-0000-4000-8000-000000000009', NULL, 'placement_officer','Placement Officer','Placement cell',50,true,'/dashboard'),
('11111111-0000-4000-8000-00000000000a', NULL, 'librarian','Librarian','Library management',50,true,'/dashboard'),
('11111111-0000-4000-8000-00000000000b', NULL, 'hostel_warden','Hostel Warden','Hostel management',50,true,'/dashboard'),
('11111111-0000-4000-8000-00000000000c', NULL, 'transport_manager','Transport Manager','Transport management',50,true,'/dashboard'),
('11111111-0000-4000-8000-00000000000d', NULL, 'student','Student','Enrolled student',80,true,'/student'),
('11111111-0000-4000-8000-00000000000e', NULL, 'parent','Parent','Parent or guardian',80,true,'/parent'),
('11111111-0000-4000-8000-00000000000f', NULL, 'alumni','Alumni','Former student',90,true,'/alumni');

-- ---------- ROLE -> PERMISSION MAPPING ----------
-- Super admin & college admin: everything
INSERT INTO public.role_permissions (role_id, permission_id)
SELECT r.id, p.id FROM public.roles r CROSS JOIN public.permissions p
WHERE r.key IN ('super_admin','college_admin');

-- Principal: everything except system/API internals
INSERT INTO public.role_permissions (role_id, permission_id)
SELECT r.id, p.id FROM public.roles r CROSS JOIN public.permissions p
WHERE r.key = 'principal' AND p.module NOT IN ('system');

INSERT INTO public.role_permissions (role_id, permission_id)
SELECT r.id, p.id FROM public.roles r JOIN public.permissions p ON p.key = ANY(ARRAY[
  'student.view','student.manage','admission.view','admission.manage','enrollment.view','enrollment.manage',
  'program.manage','course.manage','academic.manage','department.manage','exam.view','exam.manage',
  'certificate.issue','document.view','document.manage','report.view','report.generate','analytics.view',
  'data.import','data.export','workflow.view','workflow.act','form.view_submissions','faculty.view',
  'calendar.manage','notice.manage','ai.assistant.use','ai.insights.view'])
WHERE r.key = 'registrar';

INSERT INTO public.role_permissions (role_id, permission_id)
SELECT r.id, p.id FROM public.roles r JOIN public.permissions p ON p.key = ANY(ARRAY[
  'student.view','faculty.view','faculty.manage','department.manage','program.manage','course.manage',
  'enrollment.view','exam.view','attendance.view','analytics.view','report.view','report.generate',
  'workflow.view','workflow.act','document.view','calendar.manage','ai.assistant.use','ai.insights.view'])
WHERE r.key IN ('dean','hod');

INSERT INTO public.role_permissions (role_id, permission_id)
SELECT r.id, p.id FROM public.roles r JOIN public.permissions p ON p.key = ANY(ARRAY[
  'student.view','enrollment.view','attendance.view','attendance.manage','assignment.view','assignment.manage',
  'exam.view','timetable.view','course.manage','document.view','analytics.view','calendar.manage',
  'ai.assistant.use','ai.insights.view','data.export'])
WHERE r.key = 'faculty';

INSERT INTO public.role_permissions (role_id, permission_id)
SELECT r.id, p.id FROM public.roles r JOIN public.permissions p ON p.key = ANY(ARRAY[
  'fee.view','fee.manage','finance.view','finance.manage','payroll.manage','student.view','report.view',
  'analytics.view','data.export','workflow.view','workflow.act','document.view','ai.assistant.use'])
WHERE r.key = 'accountant';

INSERT INTO public.role_permissions (role_id, permission_id)
SELECT r.id, p.id FROM public.roles r JOIN public.permissions p ON p.key = ANY(ARRAY[
  'placement.view','placement.manage','student.view','alumni.manage','analytics.view','report.view',
  'data.export','document.view','ai.assistant.use'])
WHERE r.key = 'placement_officer';

INSERT INTO public.role_permissions (role_id, permission_id)
SELECT r.id, p.id FROM public.roles r JOIN public.permissions p ON p.key = ANY(ARRAY[
  'library.view','library.manage','student.view','report.view','data.export','ai.assistant.use'])
WHERE r.key = 'librarian';

INSERT INTO public.role_permissions (role_id, permission_id)
SELECT r.id, p.id FROM public.roles r JOIN public.permissions p ON p.key = ANY(ARRAY[
  'hostel.view','hostel.manage','student.view','report.view','data.export','ai.assistant.use'])
WHERE r.key = 'hostel_warden';

INSERT INTO public.role_permissions (role_id, permission_id)
SELECT r.id, p.id FROM public.roles r JOIN public.permissions p ON p.key = ANY(ARRAY[
  'transport.view','transport.manage','student.view','report.view','data.export','ai.assistant.use'])
WHERE r.key = 'transport_manager';

INSERT INTO public.role_permissions (role_id, permission_id)
SELECT r.id, p.id FROM public.roles r JOIN public.permissions p ON p.key = ANY(ARRAY[
  'attendance.view','assignment.view','exam.view','timetable.view','fee.view','library.view','hostel.view',
  'transport.view','placement.view','document.view','ai.assistant.use'])
WHERE r.key IN ('student','parent');

INSERT INTO public.role_permissions (role_id, permission_id)
SELECT r.id, p.id FROM public.roles r JOIN public.permissions p ON p.key = ANY(ARRAY[
  'placement.view','document.view','ai.assistant.use'])
WHERE r.key = 'alumni';

-- ---------- FEATURES ----------
INSERT INTO public.features (key, name, module, default_enabled) VALUES
('admissions','Admissions','admissions',true),
('sis','Student Information System','people',true),
('academics','Academic Management','academics',true),
('attendance','Attendance','attendance',true),
('timetable','Timetable','timetable',true),
('examination','Examination','examination',true),
('assignments','Assignments','assignments',true),
('lms','Learning Management','lms',false),
('fees','Fees','finance',true),
('scholarships','Scholarships','finance',false),
('finance','Finance','finance',true),
('payroll','Payroll','hr',false),
('hr','Human Resources','hr',true),
('library','Library','library',true),
('hostel','Hostel','hostel',true),
('transport','Transport','transport',true),
('inventory','Inventory & Assets','inventory',false),
('complaints','Complaint Management','communication',false),
('notices','Notice Board','communication',true),
('events','Events','calendar',true),
('placement','Placement Cell','placement',true),
('alumni','Alumni','alumni',false),
('certificates','Certificates','certificates',true),
('documents','Digital Documents','documents',true),
('communication','Communication Center','communication',true),
('ai_assistant','AI Assistant','ai',true),
('ai_predictions','AI Predictions','ai',true),
('analytics','Analytics','analytics',true),
('reports','Compliance Reports','reports',true),
('audit','Audit Logs','core',true),
('public_api','Public API','system',false),
('webhooks','Webhooks','system',false);

-- ---------- DASHBOARD WIDGETS ----------
INSERT INTO public.widgets (key, name, category, module, required_permission, default_width, default_height) VALUES
('stat_students','Total Students','stats','people','student.view',3,1),
('stat_faculty','Total Faculty','stats','people','faculty.view',3,1),
('stat_programs','Programs','stats','academics',NULL,3,1),
('stat_courses','Courses','stats','academics',NULL,3,1),
('chart_enrollment_trend','Enrollment Trend','charts','academics','student.view',6,3),
('chart_department_split','Students by Department','charts','academics','student.view',6,3),
('list_recent_activity','Recent Activity','lists','core',NULL,6,3),
('list_pending_approvals','Pending Approvals','lists','workflow','workflow.view',6,3),
('list_upcoming_events','Upcoming Events','lists','calendar',NULL,6,3),
('ai_insights_panel','AI Insights','ai','ai','ai.insights.view',6,3);

-- ---------- MASTER DATA ----------
INSERT INTO public.countries (iso2, iso3, name, phone_code, currency) VALUES
('IN','IND','India','+91','INR'),
('US','USA','United States','+1','USD'),
('GB','GBR','United Kingdom','+44','GBP'),
('AE','ARE','United Arab Emirates','+971','AED'),
('AU','AUS','Australia','+61','AUD'),
('CA','CAN','Canada','+1','CAD'),
('SG','SGP','Singapore','+65','SGD'),
('DE','DEU','Germany','+49','EUR');

INSERT INTO public.states (country_id, code, name)
SELECT c.id, s.code, s.name FROM public.countries c,
(VALUES ('AP','Andhra Pradesh'),('AS','Assam'),('BR','Bihar'),('CH','Chandigarh'),('DL','Delhi'),
        ('GA','Goa'),('GJ','Gujarat'),('HR','Haryana'),('HP','Himachal Pradesh'),('JH','Jharkhand'),
        ('KA','Karnataka'),('KL','Kerala'),('MP','Madhya Pradesh'),('MH','Maharashtra'),('OD','Odisha'),
        ('PB','Punjab'),('RJ','Rajasthan'),('TN','Tamil Nadu'),('TS','Telangana'),('UP','Uttar Pradesh'),
        ('UK','Uttarakhand'),('WB','West Bengal')) AS s(code,name)
WHERE c.iso2 = 'IN';

INSERT INTO public.cities (state_id, name)
SELECT st.id, c.name FROM public.states st,
(VALUES ('Bengaluru','KA'),('Mysuru','KA'),('Mangaluru','KA'),('Chennai','TN'),('Coimbatore','TN'),
        ('Mumbai','MH'),('Pune','MH'),('Nagpur','MH'),('Hyderabad','TS'),('New Delhi','DL'),
        ('Ahmedabad','GJ'),('Jaipur','RJ'),('Kolkata','WB'),('Lucknow','UP'),('Kochi','KL')) AS c(name,state_code)
WHERE st.code = c.state_code;

INSERT INTO public.master_data_types (key, name) VALUES
('blood_group','Blood Groups'),
('religion','Religions'),
('caste','Castes'),
('category','Categories'),
('reservation_category','Reservation Categories'),
('nationality','Nationalities'),
('language','Languages'),
('designation','Designations'),
('document_category','Document Categories');

INSERT INTO public.master_data_items (type_id, code, label, sort_order)
SELECT t.id, v.code, v.label, v.ord FROM public.master_data_types t,
(VALUES ('A_POS','A+',1),('A_NEG','A-',2),('B_POS','B+',3),('B_NEG','B-',4),
        ('AB_POS','AB+',5),('AB_NEG','AB-',6),('O_POS','O+',7),('O_NEG','O-',8)) AS v(code,label,ord)
WHERE t.key = 'blood_group';

INSERT INTO public.master_data_items (type_id, code, label, sort_order)
SELECT t.id, v.code, v.label, v.ord FROM public.master_data_types t,
(VALUES ('HINDU','Hindu',1),('MUSLIM','Muslim',2),('CHRISTIAN','Christian',3),('SIKH','Sikh',4),
        ('BUDDHIST','Buddhist',5),('JAIN','Jain',6),('PARSI','Parsi',7),('OTHER','Other',8),
        ('NOT_DISCLOSED','Not disclosed',9)) AS v(code,label,ord)
WHERE t.key = 'religion';

INSERT INTO public.master_data_items (type_id, code, label, sort_order)
SELECT t.id, v.code, v.label, v.ord FROM public.master_data_types t,
(VALUES ('GEN','General',1),('OBC','Other Backward Class',2),('SC','Scheduled Caste',3),
        ('ST','Scheduled Tribe',4),('EWS','Economically Weaker Section',5)) AS v(code,label,ord)
WHERE t.key IN ('category','reservation_category');

INSERT INTO public.master_data_items (type_id, code, label, sort_order)
SELECT t.id, v.code, v.label, v.ord FROM public.master_data_types t,
(VALUES ('BRAHMIN','Brahmin',1),('KSHATRIYA','Kshatriya',2),('VAISHYA','Vaishya',3),
        ('OTHER','Other',4),('NOT_APPLICABLE','Not applicable',5)) AS v(code,label,ord)
WHERE t.key = 'caste';

INSERT INTO public.master_data_items (type_id, code, label, sort_order)
SELECT t.id, v.code, v.label, v.ord FROM public.master_data_types t,
(VALUES ('INDIAN','Indian',1),('NRI','Non-Resident Indian',2),('FOREIGN','Foreign National',3)) AS v(code,label,ord)
WHERE t.key = 'nationality';

INSERT INTO public.master_data_items (type_id, code, label, sort_order)
SELECT t.id, v.code, v.label, v.ord FROM public.master_data_types t,
(VALUES ('EN','English',1),('HI','Hindi',2),('KN','Kannada',3),('TA','Tamil',4),('TE','Telugu',5),
        ('MR','Marathi',6),('BN','Bengali',7)) AS v(code,label,ord)
WHERE t.key = 'language';

-- ---------- SETTINGS DEFINITIONS ----------
INSERT INTO public.settings_definitions (key, scope, label, data_type, default_value, sort_order) VALUES
('institution.short_name','general','Short name','string','"CampusOS"',1),
('institution.motto','general','Motto','string','""',2),
('branding.primary_color','branding','Primary color','string','"#1a56db"',1),
('branding.logo_url','branding','Logo URL','string','""',2),
('branding.favicon_url','branding','Favicon URL','string','""',3),
('academic.grading_system','academic','Grading system','string','"cgpa_10"',1),
('academic.attendance_threshold','academic','Minimum attendance %','number','75',2),
('academic.week_start','academic','Week starts on','string','"monday"',3),
('academic.max_credits_per_semester','academic','Max credits per semester','number','28',4),
('finance.currency','finance','Currency','string','"INR"',1),
('finance.late_fee_percent','finance','Late fee percent','number','2',2),
('finance.invoice_prefix','finance','Invoice prefix','string','"INV"',3),
('finance.fiscal_year_start_month','finance','Fiscal year start month','number','4',4),
('notification.email_enabled','notification','Email notifications','boolean','true',1),
('notification.sms_enabled','notification','SMS notifications','boolean','false',2),
('notification.push_enabled','notification','Push notifications','boolean','false',3),
('notification.whatsapp_enabled','notification','WhatsApp notifications','boolean','false',4),
('security.session_timeout_minutes','security','Session timeout (minutes)','number','480',1),
('security.enforce_mfa','security','Enforce multi-factor auth','boolean','false',2);

-- ============================================================
-- DEMO COLLEGE
-- ============================================================
INSERT INTO public.tenants (id, slug, name, legal_name, code, status, contact_email, contact_phone, website, established_year, affiliation, accreditation)
VALUES ('22222222-0000-4000-8000-000000000001','northgate','Northgate Institute of Technology','Northgate Educational Trust','NIT','active','info@northgate.edu','+91 80 4000 1000','https://northgate.edu',1998,'Visvesvaraya Technological University','NAAC A+');

INSERT INTO public.campuses (id, tenant_id, name, code, is_primary, city, state, country, phone, email) VALUES
('33333333-0000-4000-8000-000000000001','22222222-0000-4000-8000-000000000001','Main Campus','MAIN',true,'Bengaluru','Karnataka','India','+91 80 4000 1000','main@northgate.edu'),
('33333333-0000-4000-8000-000000000002','22222222-0000-4000-8000-000000000001','City Campus','CITY',false,'Mysuru','Karnataka','India','+91 821 400 2000','city@northgate.edu');

INSERT INTO public.buildings (tenant_id, campus_id, name, code, floors) VALUES
('22222222-0000-4000-8000-000000000001','33333333-0000-4000-8000-000000000001','Academic Block A','ABA',4),
('22222222-0000-4000-8000-000000000001','33333333-0000-4000-8000-000000000001','Science Block','SCB',3),
('22222222-0000-4000-8000-000000000001','33333333-0000-4000-8000-000000000002','City Block','CTB',5);

INSERT INTO public.departments (id, tenant_id, campus_id, code, name, short_name, established_year) VALUES
('44444444-0000-4000-8000-000000000001','22222222-0000-4000-8000-000000000001','33333333-0000-4000-8000-000000000001','CSE','Computer Science & Engineering','CSE',1998),
('44444444-0000-4000-8000-000000000002','22222222-0000-4000-8000-000000000001','33333333-0000-4000-8000-000000000001','ECE','Electronics & Communication','ECE',1999),
('44444444-0000-4000-8000-000000000003','22222222-0000-4000-8000-000000000001','33333333-0000-4000-8000-000000000001','MEC','Mechanical Engineering','MECH',2000),
('44444444-0000-4000-8000-000000000004','22222222-0000-4000-8000-000000000001','33333333-0000-4000-8000-000000000001','CIV','Civil Engineering','CIVIL',2001),
('44444444-0000-4000-8000-000000000005','22222222-0000-4000-8000-000000000001','33333333-0000-4000-8000-000000000002','MBA','School of Management','MBA',2005),
('44444444-0000-4000-8000-000000000006','22222222-0000-4000-8000-000000000001','33333333-0000-4000-8000-000000000002','BSC','Basic Sciences','SCI',1998);

INSERT INTO public.academic_years (id, tenant_id, name, start_date, end_date, is_current) VALUES
('55555555-0000-4000-8000-000000000001','22222222-0000-4000-8000-000000000001','2024-2025','2024-07-01','2025-06-30',false),
('55555555-0000-4000-8000-000000000002','22222222-0000-4000-8000-000000000001','2025-2026','2025-07-01','2026-06-30',true);

INSERT INTO public.academic_sessions (tenant_id, academic_year_id, name, term_number, start_date, end_date, is_current) VALUES
('22222222-0000-4000-8000-000000000001','55555555-0000-4000-8000-000000000002','Odd Semester 2025',1,'2025-07-01','2025-12-15',false),
('22222222-0000-4000-8000-000000000001','55555555-0000-4000-8000-000000000002','Even Semester 2026',2,'2026-01-05','2026-06-30',true);

INSERT INTO public.programs (id, tenant_id, department_id, campus_id, code, name, level, duration_years, total_semesters, total_credits, intake_capacity) VALUES
('66666666-0000-4000-8000-000000000001','22222222-0000-4000-8000-000000000001','44444444-0000-4000-8000-000000000001','33333333-0000-4000-8000-000000000001','BTCS','B.Tech Computer Science & Engineering','undergraduate',4,8,160,180),
('66666666-0000-4000-8000-000000000002','22222222-0000-4000-8000-000000000001','44444444-0000-4000-8000-000000000002','33333333-0000-4000-8000-000000000001','BTEC','B.Tech Electronics & Communication','undergraduate',4,8,160,120),
('66666666-0000-4000-8000-000000000003','22222222-0000-4000-8000-000000000001','44444444-0000-4000-8000-000000000003','33333333-0000-4000-8000-000000000001','BTME','B.Tech Mechanical Engineering','undergraduate',4,8,160,90),
('66666666-0000-4000-8000-000000000004','22222222-0000-4000-8000-000000000001','44444444-0000-4000-8000-000000000004','33333333-0000-4000-8000-000000000001','BTCE','B.Tech Civil Engineering','undergraduate',4,8,160,60),
('66666666-0000-4000-8000-000000000005','22222222-0000-4000-8000-000000000001','44444444-0000-4000-8000-000000000005','33333333-0000-4000-8000-000000000002','MBA','Master of Business Administration','postgraduate',2,4,96,120),
('66666666-0000-4000-8000-000000000006','22222222-0000-4000-8000-000000000001','44444444-0000-4000-8000-000000000001','33333333-0000-4000-8000-000000000001','MTCS','M.Tech Computer Science','postgraduate',2,4,80,30);

INSERT INTO public.semesters (tenant_id, program_id, number, name, credits)
SELECT '22222222-0000-4000-8000-000000000001', p.id, g.n, 'Semester ' || g.n, 20
FROM public.programs p
CROSS JOIN LATERAL generate_series(1, p.total_semesters) AS g(n)
WHERE p.tenant_id = '22222222-0000-4000-8000-000000000001';

INSERT INTO public.courses (tenant_id, department_id, program_id, semester_id, code, title, type, credits, lecture_hours, tutorial_hours, practical_hours)
SELECT '22222222-0000-4000-8000-000000000001','44444444-0000-4000-8000-000000000001','66666666-0000-4000-8000-000000000001',
       s.id, c.code, c.title, c.ctype::public.course_type, c.credits, 3, 1, c.prac
FROM public.semesters s
JOIN (VALUES
  ('CS301','Data Structures and Algorithms','core',4,2,3),
  ('CS302','Database Management Systems','core',4,2,3),
  ('CS303','Operating Systems','core',4,0,3),
  ('CS304','Computer Networks','core',3,2,4),
  ('CS305','Software Engineering','core',3,0,4),
  ('CS306','Machine Learning','elective',3,2,5),
  ('CS307','Cloud Computing','elective',3,0,5),
  ('CS308','DBMS Laboratory','lab',2,4,3),
  ('CS401','Compiler Design','core',4,0,6),
  ('CS402','Artificial Intelligence','core',4,2,6),
  ('CS403','Cyber Security','elective',3,0,7),
  ('CS404','Major Project','project',6,0,8)
) AS c(code,title,ctype,credits,prac,sem) ON s.number = c.sem
WHERE s.program_id = '66666666-0000-4000-8000-000000000001';

INSERT INTO public.faculty (id, tenant_id, campus_id, department_id, employee_code, first_name, last_name, email, phone, gender, designation, qualification, specialization, experience_years, employment_type, date_of_joining) VALUES
('77777777-0000-4000-8000-000000000001','22222222-0000-4000-8000-000000000001','33333333-0000-4000-8000-000000000001','44444444-0000-4000-8000-000000000001','FAC001','Anitha','Rao','anitha.rao@northgate.edu','+91 98450 10001','female','Professor & HOD','Ph.D. Computer Science','Machine Learning',18.0,'full_time','2008-07-15'),
('77777777-0000-4000-8000-000000000002','22222222-0000-4000-8000-000000000001','33333333-0000-4000-8000-000000000001','44444444-0000-4000-8000-000000000001','FAC002','Rahul','Menon','rahul.menon@northgate.edu','+91 98450 10002','male','Associate Professor','Ph.D. Information Systems','Databases',12.0,'full_time','2014-06-01'),
('77777777-0000-4000-8000-000000000003','22222222-0000-4000-8000-000000000001','33333333-0000-4000-8000-000000000001','44444444-0000-4000-8000-000000000001','FAC003','Sneha','Kulkarni','sneha.kulkarni@northgate.edu','+91 98450 10003','female','Assistant Professor','M.Tech Computer Science','Networks',7.0,'full_time','2019-08-12'),
('77777777-0000-4000-8000-000000000004','22222222-0000-4000-8000-000000000001','33333333-0000-4000-8000-000000000001','44444444-0000-4000-8000-000000000002','FAC004','Vikram','Shetty','vikram.shetty@northgate.edu','+91 98450 10004','male','Professor','Ph.D. Electronics','VLSI Design',20.0,'full_time','2006-01-09'),
('77777777-0000-4000-8000-000000000005','22222222-0000-4000-8000-000000000001','33333333-0000-4000-8000-000000000001','44444444-0000-4000-8000-000000000003','FAC005','Priya','Nair','priya.nair@northgate.edu','+91 98450 10005','female','Associate Professor','Ph.D. Mechanical','Thermodynamics',14.0,'full_time','2012-07-02'),
('77777777-0000-4000-8000-000000000006','22222222-0000-4000-8000-000000000001','33333333-0000-4000-8000-000000000001','44444444-0000-4000-8000-000000000004','FAC006','Arjun','Desai','arjun.desai@northgate.edu','+91 98450 10006','male','Assistant Professor','M.Tech Structural','Structures',6.0,'full_time','2020-09-01'),
('77777777-0000-4000-8000-000000000007','22222222-0000-4000-8000-000000000001','33333333-0000-4000-8000-000000000002','44444444-0000-4000-8000-000000000005','FAC007','Meera','Iyer','meera.iyer@northgate.edu','+91 98450 10007','female','Professor & Dean','Ph.D. Management','Finance',22.0,'full_time','2005-04-18'),
('77777777-0000-4000-8000-000000000008','22222222-0000-4000-8000-000000000001','33333333-0000-4000-8000-000000000002','44444444-0000-4000-8000-000000000006','FAC008','Sanjay','Gupta','sanjay.gupta@northgate.edu','+91 98450 10008','male','Assistant Professor','M.Sc Mathematics','Applied Mathematics',9.0,'full_time','2017-07-24');

UPDATE public.departments SET hod_user_id = NULL WHERE tenant_id = '22222222-0000-4000-8000-000000000001';

INSERT INTO public.staff (tenant_id, campus_id, department_id, employee_code, first_name, last_name, email, phone, gender, designation, date_of_joining) VALUES
('22222222-0000-4000-8000-000000000001','33333333-0000-4000-8000-000000000001',NULL,'STF001','Latha','Prasad','latha.prasad@northgate.edu','+91 98450 20001','female','Registrar','2010-03-01'),
('22222222-0000-4000-8000-000000000001','33333333-0000-4000-8000-000000000001',NULL,'STF002','Mohan','Kumar','mohan.kumar@northgate.edu','+91 98450 20002','male','Chief Accountant','2013-05-20'),
('22222222-0000-4000-8000-000000000001','33333333-0000-4000-8000-000000000001',NULL,'STF003','Fatima','Sheikh','fatima.sheikh@northgate.edu','+91 98450 20003','female','Librarian','2015-08-10'),
('22222222-0000-4000-8000-000000000001','33333333-0000-4000-8000-000000000001',NULL,'STF004','Ganesh','Patil','ganesh.patil@northgate.edu','+91 98450 20004','male','Placement Officer','2016-11-15'),
('22222222-0000-4000-8000-000000000001','33333333-0000-4000-8000-000000000002',NULL,'STF005','Rekha','Joshi','rekha.joshi@northgate.edu','+91 98450 20005','female','Hostel Warden','2018-02-01');

-- Students (generated demo cohort)
INSERT INTO public.students (
  tenant_id, campus_id, department_id, program_id, academic_year_id,
  admission_number, roll_number, first_name, last_name, email, phone, gender,
  date_of_birth, status, admission_date, father_name, mother_name, guardian_phone,
  category_id, blood_group_id
)
SELECT
  '22222222-0000-4000-8000-000000000001',
  CASE WHEN n % 5 = 0 THEN '33333333-0000-4000-8000-000000000002'::uuid ELSE '33333333-0000-4000-8000-000000000001'::uuid END,
  d.id, p.id, '55555555-0000-4000-8000-000000000002',
  'NIT2025' || lpad(n::text, 4, '0'),
  d.code || '25' || lpad(n::text, 3, '0'),
  fn.name, ln.name,
  lower(fn.name) || '.' || lower(ln.name) || n || '@student.northgate.edu',
  '+91 90000 ' || lpad((10000 + n)::text, 5, '0'),
  (CASE WHEN n % 2 = 0 THEN 'female' ELSE 'male' END)::public.gender,
  DATE '2006-01-01' + (n * 7),
  'enrolled'::public.student_status,
  DATE '2025-07-15',
  'Mr. ' || ln.name, 'Mrs. ' || ln.name,
  '+91 90000 ' || lpad((20000 + n)::text, 5, '0'),
  (SELECT i.id FROM public.master_data_items i JOIN public.master_data_types t ON t.id = i.type_id
    WHERE t.key='category' ORDER BY i.sort_order OFFSET (n % 5) LIMIT 1),
  (SELECT i.id FROM public.master_data_items i JOIN public.master_data_types t ON t.id = i.type_id
    WHERE t.key='blood_group' ORDER BY i.sort_order OFFSET (n % 8) LIMIT 1)
FROM generate_series(1, 48) AS n
JOIN LATERAL (
  SELECT id, code FROM public.departments
  WHERE tenant_id = '22222222-0000-4000-8000-000000000001'
  ORDER BY code OFFSET (n % 6) LIMIT 1
) d ON true
JOIN LATERAL (
  SELECT id FROM public.programs
  WHERE tenant_id = '22222222-0000-4000-8000-000000000001' AND department_id = d.id
  LIMIT 1
) p ON true
JOIN LATERAL (
  SELECT (ARRAY['Aarav','Diya','Ishaan','Ananya','Vihaan','Saanvi','Kabir','Myra','Reyansh','Aditi','Arjun','Kavya'])[1 + (n % 12)] AS name
) fn ON true
JOIN LATERAL (
  SELECT (ARRAY['Sharma','Reddy','Nair','Patel','Iyer','Gowda','Verma','Khan','Das','Pillai'])[1 + (n % 10)] AS name
) ln ON true;

INSERT INTO public.student_guardians (tenant_id, student_id, full_name, relation, phone, email, occupation, is_primary)
SELECT s.tenant_id, s.id, s.father_name, 'father', s.guardian_phone,
       'parent.' || s.admission_number || '@example.com', 'Business', true
FROM public.students s WHERE s.tenant_id = '22222222-0000-4000-8000-000000000001';

INSERT INTO public.enrollments (tenant_id, student_id, course_id, semester_id, academic_session_id, faculty_id, status)
SELECT s.tenant_id, s.id, c.id, c.semester_id,
  (SELECT a.id FROM public.academic_sessions a WHERE a.tenant_id = s.tenant_id AND a.is_current LIMIT 1),
  '77777777-0000-4000-8000-000000000002', 'active'
FROM public.students s
JOIN public.courses c ON c.program_id = s.program_id
WHERE s.program_id = '66666666-0000-4000-8000-000000000001'
  AND c.code IN ('CS301','CS302','CS303','CS304','CS305');

-- Tenant feature activation
INSERT INTO public.tenant_features (tenant_id, feature_id, enabled)
SELECT '22222222-0000-4000-8000-000000000001', f.id, f.default_enabled FROM public.features f;

-- Tenant settings from definitions
INSERT INTO public.tenant_settings (tenant_id, key, scope, value)
SELECT '22222222-0000-4000-8000-000000000001', d.key, d.scope, d.default_value FROM public.settings_definitions d;

-- Default calendar
INSERT INTO public.calendars (tenant_id, name, description, color, is_default)
VALUES ('22222222-0000-4000-8000-000000000001','Academic Calendar','Institution-wide academic calendar','#1a56db',true);

-- Approval workflows
INSERT INTO public.workflows (tenant_id, key, name, module, entity_type, status) VALUES
('22222222-0000-4000-8000-000000000001','admission_approval','Admission Approval','admissions','admission_application','active'),
('22222222-0000-4000-8000-000000000001','leave_approval','Leave Approval','hr','leave_request','active'),
('22222222-0000-4000-8000-000000000001','fee_waiver','Fee Waiver Approval','finance','fee_waiver_request','active'),
('22222222-0000-4000-8000-000000000001','certificate_request','Certificate Request','certificates','certificate_request','active'),
('22222222-0000-4000-8000-000000000001','reimbursement','Expense Reimbursement','finance','reimbursement_request','active');

INSERT INTO public.workflow_steps (tenant_id, workflow_id, step_order, name, approver_permission, sla_hours)
SELECT w.tenant_id, w.id, s.ord, s.name, s.perm, s.sla
FROM public.workflows w
JOIN (VALUES (1,'Department Review','department.manage',48),(2,'Final Approval','tenant.update',72)) AS s(ord,name,perm,sla) ON true
WHERE w.tenant_id = '22222222-0000-4000-8000-000000000001';

-- AI prompt templates
INSERT INTO public.ai_prompts (tenant_id, key, name, kind, system_prompt, user_template) VALUES
(NULL,'assistant','Campus Assistant','chat','You are CampusOS Assistant, a helpful assistant for college staff, faculty, students and parents. Answer concisely and never invent data you were not given.','{{question}}'),
(NULL,'question_paper','Question Paper Generator','question_paper','You are an experienced university examiner. Generate balanced question papers with clear mark distribution and Bloom taxonomy coverage.','Generate a question paper for {{course}} covering {{topics}} for {{marks}} marks and {{duration}} minutes.'),
(NULL,'assignment','Assignment Generator','assignment','You design practical, gradeable university assignments.','Create an assignment for {{course}} on {{topic}} at {{difficulty}} difficulty.'),
(NULL,'lesson_plan','Lesson Planner','lesson_plan','You are an academic instructional designer.','Create a {{weeks}}-week lesson plan for {{course}} covering {{syllabus}}.'),
(NULL,'dropout_risk','Dropout Risk Analysis','prediction','You analyse student academic data and identify dropout risk with clear reasoning.','Analyse this student record and estimate dropout risk: {{record}}'),
(NULL,'parent_message','Parent Communication Generator','other','You write warm, professional messages from a college to a parent.','Write a message to the parent of {{student}} about {{topic}}.'),
(NULL,'report_writer','AI Report Writer','report','You write formal institutional reports suitable for accreditation bodies.','Write a {{report_type}} report section using this data: {{data}}');

-- ---------- Auto-onboard new users into the demo college ----------
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  _demo_tenant uuid := '22222222-0000-4000-8000-000000000001';
  _admin_role uuid := '11111111-0000-4000-8000-000000000002';
BEGIN
  INSERT INTO public.profiles (id, email, full_name, avatar_url, last_active_tenant_id)
  VALUES (
    NEW.id, NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.raw_user_meta_data->>'name', split_part(NEW.email,'@',1)),
    NEW.raw_user_meta_data->>'avatar_url',
    _demo_tenant
  )
  ON CONFLICT (id) DO NOTHING;

  INSERT INTO public.tenant_members (tenant_id, user_id, campus_id, status)
  VALUES (_demo_tenant, NEW.id, '33333333-0000-4000-8000-000000000001', 'active')
  ON CONFLICT (tenant_id, user_id) DO NOTHING;

  INSERT INTO public.user_roles (user_id, role_id, tenant_id, scope)
  VALUES (NEW.id, _admin_role, _demo_tenant, 'tenant')
  ON CONFLICT DO NOTHING;

  RETURN NEW;
END;
$$;

-- ---------- Lock down helper functions from anonymous callers ----------
REVOKE EXECUTE ON FUNCTION public.is_platform_admin(uuid) FROM anon, public;
REVOKE EXECUTE ON FUNCTION public.is_tenant_member(uuid, uuid) FROM anon, public;
REVOKE EXECUTE ON FUNCTION public.user_tenant_ids(uuid) FROM anon, public;
REVOKE EXECUTE ON FUNCTION public.has_permission(text, uuid, uuid) FROM anon, public;
REVOKE EXECUTE ON FUNCTION public.has_role(text, uuid, uuid) FROM anon, public;
GRANT EXECUTE ON FUNCTION public.is_platform_admin(uuid) TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.is_tenant_member(uuid, uuid) TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.user_tenant_ids(uuid) TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.has_permission(text, uuid, uuid) TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.has_role(text, uuid, uuid) TO authenticated, service_role;
