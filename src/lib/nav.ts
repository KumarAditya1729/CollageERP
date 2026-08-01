import {
  Activity,
  BarChart3,
  IdCard,
  UserPlus,
  BookOpen,
  Building2,
  CalendarClock,
  CalendarRange,
  Repeat,
  ClipboardCheck,
  ScanLine,
  ShieldAlert,
  PlaneTakeoff,
  Wrench,
  UserCheck,
  CalendarDays,
  ClipboardList,
  DoorOpen,
  Layers,
  CheckSquare,
  Gauge,
  Calculator,
  UploadCloud,
  TrendingUp,
  FileText,
  GraduationCap,
  Image,
  LayoutDashboard,
  LayoutGrid,
  Library,
  Bell,
  Presentation,
  Settings,
  ShieldCheck,
  UserCog,
  Users,
  UsersRound,
  // Campus Operations
  DollarSign,
  Briefcase,
  BookMarked,
  Home,
  Bus,
  Package,
  Hammer,
  Users2,
  ShieldOff,
  Heart,
  Syringe,
  type LucideIcon,
} from "lucide-react";

export interface NavItem {
  title: string;
  to: string;
  icon: LucideIcon;
  permission?: string;
  anyPermission?: string[];
  description?: string;
}

export interface NavGroup {
  label: string;
  items: NavItem[];
}

export const navGroups: NavGroup[] = [
  {
    label: "Overview",
    items: [
      {
        title: "Dashboard",
        to: "/dashboard",
        icon: LayoutDashboard,
        description: "Institution overview",
      },
      { title: "My studies", to: "/student", icon: GraduationCap, description: "Student portal" },
      { title: "My teaching", to: "/teaching", icon: Presentation, description: "Faculty portal" },
    ],
  },
  {
    label: "People",
    items: [
      { title: "Students", to: "/students", icon: Users, permission: "student.view" },
      {
        title: "Admissions",
        to: "/students/admissions",
        icon: UserPlus,
        permission: "student.view",
      },
      {
        title: "Student reports",
        to: "/students/reports",
        icon: BarChart3,
        permission: "student.view",
      },
      { title: "ID cards", to: "/students/id-cards", icon: IdCard, permission: "student.view" },
      { title: "Faculty", to: "/faculty", icon: UsersRound, permission: "faculty.view" },
      { title: "Staff", to: "/staff", icon: UserCog, permission: "staff.view" },
    ],
  },
  {
    label: "Academics",
    items: [
      { title: "Academic overview", to: "/academics", icon: GraduationCap },
      {
        title: "Structure",
        to: "/academics/structure",
        icon: Layers,
        permission: "section.manage",
      },
      {
        title: "Departments",
        to: "/departments",
        icon: Building2,
        permission: "department.manage",
      },
      { title: "Programs", to: "/programs", icon: Library, permission: "program.manage" },
      {
        title: "Curriculum",
        to: "/academics/curriculum",
        icon: ClipboardList,
        permission: "curriculum.manage",
      },
      { title: "Subjects", to: "/academics/subjects", icon: BookOpen, permission: "course.manage" },
      {
        title: "Faculty allocation",
        to: "/academics/allocations",
        icon: CalendarClock,
        permission: "faculty.assign",
      },
      {
        title: "Enrolment",
        to: "/academics/enrollment",
        icon: CheckSquare,
        permission: "student.view",
      },
      { title: "Academic calendar", to: "/academics/calendar", icon: CalendarDays },
      {
        title: "Infrastructure",
        to: "/academics/infrastructure",
        icon: DoorOpen,
        permission: "room.manage",
      },
      {
        title: "Faculty workload",
        to: "/academics/workload",
        icon: Gauge,
        permission: "faculty.assign",
      },
      {
        title: "Credit engine",
        to: "/academics/credits",
        icon: Calculator,
        permission: "curriculum.manage",
      },
      {
        title: "Bulk operations",
        to: "/academics/bulk",
        icon: UploadCloud,
        permission: "course.manage",
      },
      {
        title: "Academic analytics",
        to: "/academics/analytics",
        icon: TrendingUp,
        permission: "program.manage",
      },
      {
        title: "Academic reports",
        to: "/academics/reports",
        icon: BarChart3,
        permission: "program.manage",
      },
    ],
  },
  {
    label: "Attendance & Timetable",
    items: [
      {
        title: "Attendance",
        to: "/attendance",
        icon: ClipboardCheck,
        permission: "attendance.view",
      },
      {
        title: "Take attendance",
        to: "/attendance/mark",
        icon: ScanLine,
        permission: "attendance.manage",
      },
      {
        title: "Sessions",
        to: "/attendance/sessions",
        icon: CalendarRange,
        permission: "attendance.view",
      },
      { title: "Timetable", to: "/timetable", icon: CalendarClock, permission: "timetable.view" },
      {
        title: "Substitutions",
        to: "/timetable/substitutions",
        icon: Repeat,
        permission: "timetable.view",
      },
      { title: "Leave", to: "/attendance/leave", icon: PlaneTakeoff, permission: "leave.manage" },
      {
        title: "Corrections",
        to: "/attendance/corrections",
        icon: Wrench,
        permission: "attendance.correct",
      },
      {
        title: "Attendance policies",
        to: "/attendance/policies",
        icon: ShieldAlert,
        permission: "attendance.policy",
      },
      {
        title: "Attendance analytics",
        to: "/attendance/analytics",
        icon: TrendingUp,
        permission: "attendance.view",
      },
      {
        title: "Attendance reports",
        to: "/attendance/reports",
        icon: BarChart3,
        permission: "attendance.view",
      },
      { title: "My attendance", to: "/attendance/my", icon: UserCheck },
    ],
  },
  {
    label: "Examinations",
    items: [
      { title: "Exam overview", to: "/exams", icon: GraduationCap, permission: "exam.read" },
      {
        title: "Assessment framework",
        to: "/exams/framework",
        icon: Calculator,
        permission: "exam.read",
      },
      {
        title: "Exam sessions",
        to: "/exams/sessions",
        icon: CalendarRange,
        permission: "exam.read",
      },
      {
        title: "Exam timetable",
        to: "/exams/planning",
        icon: CalendarClock,
        permission: "exam.read",
      },
      {
        title: "Registrations",
        to: "/exams/registrations",
        icon: CheckSquare,
        permission: "exam.read",
      },
      {
        title: "Question bank",
        to: "/exams/question-bank",
        icon: Library,
        permission: "questionpaper.manage",
      },
      {
        title: "Question papers",
        to: "/exams/papers",
        icon: FileText,
        permission: "questionpaper.manage",
      },
      { title: "Seating plan", to: "/exams/seating", icon: LayoutGrid, permission: "exam.manage" },
      {
        title: "Invigilation",
        to: "/exams/invigilation",
        icon: UserCheck,
        permission: "exam.manage",
      },
      {
        title: "Hall tickets",
        to: "/exams/hall-tickets",
        icon: CheckSquare,
        permission: "exam.manage",
      },
      { title: "Marks entry", to: "/exams/marks", icon: Calculator, permission: "marks.entry" },
      {
        title: "Evaluation",
        to: "/exams/evaluation",
        icon: ShieldAlert,
        permission: "marks.moderate",
      },
      { title: "Revaluation", to: "/exams/revaluation", icon: FileText, permission: "exam.manage" },
      { title: "Results", to: "/exams/results", icon: TrendingUp, permission: "result.read" },
      {
        title: "Certificates",
        to: "/exams/certificates",
        icon: GraduationCap,
        permission: "result.read",
      },
      {
        title: "Exam analytics",
        to: "/exams/analytics",
        icon: TrendingUp,
        permission: "exam.read",
      },
      { title: "Exam reports", to: "/exams/reports", icon: BarChart3, permission: "exam.read" },
    ],
  },
  {
    label: "Learning",
    items: [{ title: "Learning overview", to: "/lms", icon: BookOpen, permission: "lms.read" }],
  },
  {
    label: "Content",
    items: [
      { title: "Documents", to: "/documents", icon: FileText, permission: "document.view" },
      { title: "Media library", to: "/media", icon: Image, permission: "media.manage" },
    ],
  },
  {
    label: "Operations",
    items: [
      { title: "Approvals", to: "/approvals", icon: CheckSquare, permission: "workflow.view" },
      { title: "Notifications", to: "/notifications", icon: Bell },
      { title: "Activity", to: "/activity", icon: Activity, permission: "audit.view" },
    ],
  },
  {
    label: "Finance",
    items: [
      { title: "Finance Overview", to: "/finance", icon: DollarSign, permission: "finance.view" },
      {
        title: "Fee Structures",
        to: "/finance/fee-structures",
        icon: Layers,
        permission: "finance.manage",
      },
      { title: "Invoices", to: "/finance/invoices", icon: FileText, permission: "finance.view" },
      { title: "Payments", to: "/finance/payments", icon: CheckSquare, permission: "finance.view" },
      { title: "Ledger", to: "/finance/ledger", icon: BarChart3, permission: "finance.view" },
      {
        title: "Scholarships",
        to: "/finance/scholarships",
        icon: GraduationCap,
        permission: "finance.manage",
      },
      { title: "Budgets", to: "/finance/budgets", icon: Calculator, permission: "finance.manage" },
      {
        title: "Financial Reports",
        to: "/finance/reports",
        icon: BarChart3,
        permission: "finance.view",
      },
    ],
  },
  {
    label: "HRMS",
    items: [
      { title: "HR Overview", to: "/hrms", icon: Briefcase, permission: "hrms.view" },
      { title: "Employees", to: "/hrms/employees", icon: Users, permission: "hrms.view" },
      { title: "Payroll", to: "/hrms/payroll", icon: DollarSign, permission: "hrms.payroll" },
      { title: "Leave", to: "/hrms/leave", icon: PlaneTakeoff, permission: "hrms.view" },
      {
        title: "Attendance",
        to: "/hrms/attendance",
        icon: ClipboardCheck,
        permission: "hrms.view",
      },
      {
        title: "Performance",
        to: "/hrms/performance",
        icon: TrendingUp,
        permission: "hrms.manage",
      },
      { title: "Recruitment", to: "/hrms/recruitment", icon: UserPlus, permission: "hrms.manage" },
      { title: "HR Reports", to: "/hrms/reports", icon: BarChart3, permission: "hrms.view" },
    ],
  },
  {
    label: "Library",
    items: [
      {
        title: "Library Overview",
        to: "/library",
        icon: BookMarked,
        anyPermission: ["library.view", "library.manage"],
      },
      {
        title: "Catalog",
        to: "/library/catalog",
        icon: BookOpen,
        anyPermission: ["library.view", "library.manage"],
      },
      {
        title: "Circulation",
        to: "/library/circulation",
        icon: Repeat,
        permission: "library.manage",
      },
      { title: "Members", to: "/library/members", icon: Users, permission: "library.manage" },
      { title: "Fines", to: "/library/fines", icon: DollarSign, permission: "library.manage" },
    ],
  },
  {
    label: "Hostel",
    items: [
      { title: "Hostel Overview", to: "/hostel", icon: Home, permission: "hostel.view" },
      { title: "Buildings", to: "/hostel/buildings", icon: Building2, permission: "hostel.manage" },
      { title: "Rooms", to: "/hostel/rooms", icon: DoorOpen, permission: "hostel.manage" },
      {
        title: "Allocations",
        to: "/hostel/allocations",
        icon: UserCheck,
        permission: "hostel.manage",
      },
      { title: "Mess", to: "/hostel/mess", icon: Layers, permission: "hostel.manage" },
      {
        title: "Waiting List",
        to: "/hostel/waiting-list",
        icon: ClipboardList,
        permission: "hostel.manage",
      },
      {
        title: "Complaints",
        to: "/hostel/complaints",
        icon: ShieldAlert,
        permission: "hostel.view",
      },
      { title: "Gate Pass", to: "/hostel/gate-pass", icon: DoorOpen, permission: "hostel.manage" },
      {
        title: "Hostel Reports",
        to: "/hostel/reports",
        icon: BarChart3,
        permission: "hostel.view",
      },
    ],
  },
  {
    label: "Transport",
    items: [
      { title: "Transport Overview", to: "/transport", icon: Bus, permission: "transport.view" },
      { title: "Vehicles", to: "/transport/vehicles", icon: Bus, permission: "transport.manage" },
      { title: "Routes", to: "/transport/routes", icon: ScanLine, permission: "transport.manage" },
      {
        title: "Allocations",
        to: "/transport/allocations",
        icon: UserCheck,
        permission: "transport.manage",
      },
      { title: "Drivers", to: "/transport/drivers", icon: UserCog, permission: "transport.manage" },
      {
        title: "Attendance",
        to: "/transport/attendance",
        icon: ClipboardCheck,
        permission: "transport.view",
      },
      {
        title: "Incidents",
        to: "/transport/incidents",
        icon: ShieldAlert,
        permission: "transport.view",
      },
      {
        title: "Transport Reports",
        to: "/transport/reports",
        icon: BarChart3,
        permission: "transport.view",
      },
    ],
  },
  {
    label: "Campus Operations",
    items: [
      { title: "Inventory", to: "/inventory", icon: Package, permission: "inventory.view" },
      {
        title: "Inventory Items",
        to: "/inventory/items",
        icon: Layers,
        permission: "inventory.view",
      },
      {
        title: "Inventory Movements",
        to: "/inventory/transactions",
        icon: TrendingUp,
        permission: "inventory.view",
      },
      {
        title: "Maintenance",
        to: "/campus-maintenance",
        icon: Hammer,
        permission: "maintenance.view",
      },
      { title: "Visitors", to: "/visitors", icon: Users2, permission: "visitor.view" },
      { title: "Security", to: "/security", icon: ShieldOff, permission: "security.view" },
      { title: "Medical", to: "/medical", icon: Heart, permission: "medical.view" },
    ],
  },
  {
    label: "Administration",
    items: [
      { title: "Users", to: "/users", icon: Users, permission: "user.manage" },
      { title: "Roles & permissions", to: "/roles", icon: ShieldCheck, permission: "role.manage" },
      { title: "Settings", to: "/settings/general", icon: Settings, permission: "settings.manage" },
    ],
  },
];

export const allNavItems: NavItem[] = navGroups.flatMap((group) => group.items);

export function findNavItem(pathname: string) {
  return allNavItems.find((item) => item.to === pathname);
}
