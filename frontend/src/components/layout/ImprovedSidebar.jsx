import { useContext, useMemo } from "react";
import { NavLink } from "react-router-dom";
import {
  LayoutDashboard,
  BookOpen,
  BarChart3,
  Target,
  GitMerge,
  GraduationCap,
  Users,
  ClipboardList,
  FileText,
  RefreshCcw,
  TrendingUp,
  LogOut,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import { AuthContext } from "../../context/AuthContext";

function roleBadgeClass(role) {
  if (role === "ADMIN") {
    return "border-slate-300 bg-slate-900 text-white dark:border-slate-200 dark:bg-slate-100 dark:text-slate-900";
  }

  if (role === "FACULTY") {
    return "border-blue-200 bg-blue-50 text-blue-700 dark:border-blue-500/30 dark:bg-blue-950/40 dark:text-blue-200";
  }

  return "border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-500/30 dark:bg-emerald-950/40 dark:text-emerald-200";
}

function getInitialsFromEmail(email) {
  const safeEmail = String(email || "").trim();
  if (!safeEmail) return "US";

  const cleaned = safeEmail.replace(/[^a-zA-Z0-9]/g, "");
  return (cleaned.slice(0, 2) || "US").toUpperCase();
}

function ImprovedSidebar({ isCollapsed, onToggleCollapse }) {
  const { role, user, logout } = useContext(AuthContext);

  const navigation = useMemo(() => {
    if (role === "ADMIN") {
      return [
        { to: "/admin/dashboard", label: "Dashboard", icon: LayoutDashboard },
        { to: "/cases", label: "Case Studies", icon: BookOpen },
        { to: "/analytics", label: "Analytics", icon: BarChart3 },
        { to: "/admin/program-outcomes", label: "Program Outcomes", icon: Target },
        { to: "/admin/course-outcomes", label: "CO Mapping", icon: GitMerge },
        { to: "/admin/reeval-queue", label: "Re-eval Queue", icon: RefreshCcw },
        { to: "/users", label: "Users", icon: Users },
      ];
    }

    if (role === "FACULTY") {
      return [
        { to: "/faculty/dashboard", label: "Dashboard", icon: LayoutDashboard },
        { to: "/cases", label: "Case Studies", icon: BookOpen },
        { to: "/faculty/analytics", label: "Analytics", icon: BarChart3 },
        { to: "/faculty/submissions", label: "Review Queue", icon: ClipboardList },
        { to: "/faculty/course-outcomes", label: "Course Outcomes", icon: GraduationCap },
      ];
    }

    return [
      { to: "/student/dashboard", label: "Dashboard", icon: LayoutDashboard },
      { to: "/cases", label: "Case Studies", icon: BookOpen },
      { to: "/student/submissions", label: "My Submissions", icon: FileText },
      { to: "/student/co-attainment", label: "CO Attainment", icon: TrendingUp },
    ];
  }, [role]);

  const email = user?.email || "";
  const initials = getInitialsFromEmail(email);

  return (
    <div className="flex h-full flex-col">
      <div className="relative flex h-16 flex-shrink-0 items-center border-b border-slate-200 px-4 dark:border-slate-800">
        <button
          type="button"
          onClick={onToggleCollapse}
          className="absolute -right-3 top-5 z-10 flex h-6 w-6 items-center justify-center rounded-full border border-slate-200 bg-white text-slate-600 shadow-sm transition hover:text-slate-900 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-300 dark:hover:text-slate-100"
          aria-label={isCollapsed ? "Expand sidebar" : "Collapse sidebar"}
        >
          {isCollapsed ? (
            <ChevronRight className="h-3.5 w-3.5" />
          ) : (
            <ChevronLeft className="h-3.5 w-3.5" />
          )}
        </button>

        <div
          className={`flex w-full items-center ${
            isCollapsed ? "justify-center" : "gap-3"
          }`}
        >
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-slate-900 dark:bg-slate-100">
            <BookOpen className="h-5 w-5 text-white dark:text-slate-900" />
          </div>
          <div
            className={`overflow-hidden transition-opacity duration-200 ${
              isCollapsed ? "pointer-events-none w-0 opacity-0" : "w-auto opacity-100"
            }`}
          >
            <h1 className="whitespace-nowrap text-sm font-semibold text-slate-900 dark:text-slate-100">
              Case Portal
            </h1>
            <p className="whitespace-nowrap text-xs text-slate-500 dark:text-slate-400">
              Academic Platform
            </p>
          </div>
        </div>
      </div>

      <nav className="flex-1 px-4 py-6">
        <div className="space-y-1">
          {navigation.map((item) => {
            const Icon = item.icon;
            return (
              <NavLink
                key={item.to}
                to={item.to}
                title={isCollapsed ? item.label : undefined}
                className={({ isActive }) =>
                  `flex items-center rounded-lg px-3 py-2.5 text-sm font-medium transition ${
                    isCollapsed ? "justify-center" : "gap-3"
                  } ${
                    isActive
                      ? "bg-slate-900 text-white dark:bg-slate-100 dark:text-slate-900"
                      : "text-slate-600 hover:bg-slate-100 hover:text-slate-900 dark:text-slate-300 dark:hover:bg-slate-800 dark:hover:text-slate-100"
                  }`
                }
              >
                <Icon className="h-5 w-5 flex-shrink-0" />
                <span
                  className={`overflow-hidden whitespace-nowrap transition-opacity duration-200 ${
                    isCollapsed ? "pointer-events-none w-0 opacity-0" : "opacity-100"
                  }`}
                >
                  {item.label}
                </span>
              </NavLink>
            );
          })}
        </div>
      </nav>

      <div className="border-t border-slate-200 p-4 dark:border-slate-800">
        <div
          className={`mb-3 rounded-lg border border-slate-200 bg-slate-50 p-3 dark:border-slate-700 dark:bg-slate-800/60 ${
            isCollapsed ? "flex justify-center" : ""
          }`}
        >
          <div className={`flex items-center ${isCollapsed ? "justify-center" : "gap-3"}`}>
            <div
              className="flex h-9 w-9 items-center justify-center rounded-full bg-slate-900 text-xs font-bold text-white dark:bg-slate-100 dark:text-slate-900"
              title={isCollapsed ? email || "user@portal.com" : undefined}
            >
              {initials}
            </div>
            <div
              className={`min-w-0 flex-1 overflow-hidden transition-opacity duration-200 ${
                isCollapsed ? "pointer-events-none w-0 opacity-0" : "opacity-100"
              }`}
            >
              <p className="truncate text-sm font-medium text-slate-900 dark:text-slate-100">
                {email || "user@portal.com"}
              </p>
              <span
                className={`mt-1 inline-flex items-center rounded-full border px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide ${roleBadgeClass(
                  role
                )}`}
              >
                {role || "GUEST"}
              </span>
            </div>
          </div>
        </div>

        <button
          type="button"
          onClick={logout}
          title={isCollapsed ? "Logout" : undefined}
          className={`flex w-full items-center rounded-lg px-3 py-2.5 text-sm font-medium text-slate-600 transition hover:bg-slate-100 hover:text-slate-900 dark:text-slate-300 dark:hover:bg-slate-800 dark:hover:text-slate-100 ${
            isCollapsed ? "justify-center" : "gap-3"
          }`}
        >
          <LogOut className="h-4 w-4" />
          <span
            className={`overflow-hidden whitespace-nowrap transition-opacity duration-200 ${
              isCollapsed ? "pointer-events-none w-0 opacity-0" : "opacity-100"
            }`}
          >
            Logout
          </span>
        </button>
      </div>
    </div>
  );
}

export default ImprovedSidebar;
