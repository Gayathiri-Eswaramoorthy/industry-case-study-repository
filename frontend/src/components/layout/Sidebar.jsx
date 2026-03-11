import { useContext, useMemo } from "react";
import { NavLink } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { AuthContext } from "../../context/AuthContext";
import { getFacultyDashboard } from "../../services/facultyDashboardService";

function Sidebar() {
  const { role } = useContext(AuthContext);
  const { data: facultyDashboard } = useQuery({
    queryKey: ["faculty-dashboard"],
    queryFn: getFacultyDashboard,
    enabled: false,
  });

  const pendingReviews = facultyDashboard?.pendingReviews ?? 0;

  const dashboardPath =
    role === "ADMIN"
      ? "/admin/dashboard"
      : role === "FACULTY"
        ? "/faculty/dashboard"
        : "/student/dashboard";

  const links = useMemo(() => {
    const items = [
      { to: dashboardPath, label: "Dashboard" },
      { to: "/cases", label: "Case Studies" },
    ];

    if (role === "FACULTY") {
      items.push({ to: "/faculty/analytics", label: "Analytics" });
    }

    if (role === "ADMIN") {
      items.push({ to: "/analytics", label: "Analytics" });
    }

    if (role === "FACULTY") {
      items.push({
        to: "/faculty/submissions",
        label: "Review Queue",
        badge: pendingReviews,
      });
    }

    if (role === "FACULTY" || role === "ADMIN") {
      items.push({ to: "/cases/new", label: "Create Case" });
    }

    if (role === "ADMIN") {
      items.push({ to: "/users", label: "Users" });
    }

    return items;
  }, [dashboardPath, pendingReviews, role]);

  return (
    <div className="flex h-full flex-col px-4 py-6">
      <div className="mb-6 text-sm font-semibold uppercase tracking-wide text-slate-500">
        Navigation
      </div>

      <nav className="space-y-1 text-sm">
        {links.map((link) => (
          <NavLink
            key={link.to}
            to={link.to}
            className={({ isActive }) =>
              [
                "flex items-center rounded-md px-3 py-2 transition-colors",
                isActive
                  ? "bg-slate-900 text-white"
                  : "text-slate-700 hover:bg-slate-100 hover:text-slate-900",
              ].join(" ")
            }
          >
            {link.label}
            {role === "FACULTY" && link.badge > 0 && (
              <span className="ml-2 rounded-full bg-red-500 px-1.5 py-0.5 text-[10px] font-bold text-white">
                {link.badge}
              </span>
            )}
          </NavLink>
        ))}
      </nav>
    </div>
  );
}

export default Sidebar;

