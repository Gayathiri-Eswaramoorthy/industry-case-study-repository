import { useContext } from "react";
import { NavLink, useLocation, useNavigate } from "react-router-dom";
import { AuthContext } from "../../context/AuthContext";
import {
  LayoutDashboard,
  ClipboardList,
  BookOpen,
  BarChart3,
  Users,
  LogOut,
} from "lucide-react";

function Sidebar() {
  const { role, logout } = useContext(AuthContext);
  const location = useLocation();
  const navigate = useNavigate();
  // const [isCollapsed, setIsCollapsed] = useState(false); // Future: Add collapse functionality

  const navigation = [
    {
      name: "Dashboard",
      href: "/dashboard",
      icon: LayoutDashboard,
      description: "Overview and stats",
    },
    {
      name: "Review Workflow",
      href: "/review-workflow",
      icon: ClipboardList,
      description: "Pending reviews",
    },
    {
      name: "Case Library",
      href: "/cases",
      icon: BookOpen,
      description: "Browse cases",
    },
    {
      name: "Analytics",
      href: "/analytics",
      icon: BarChart3,
      description: "Insights and reports",
    },
    {
      name: "User Management",
      href: "/users",
      icon: Users,
      description: "Manage users",
      roles: ["ADMIN"],
    },
  ];

  const handleLogout = () => {
    logout();
    navigate("/");
  };

  const filteredNavigation = navigation.filter(
    (item) => !item.roles || item.roles.includes(role),
  );

  return (
    <div className="flex h-full flex-col">
      {/* Logo Section */}
      <div className="flex h-16 flex-shrink-0 items-center border-b border-slate-200 px-6">
        <div className="flex items-center gap-3">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-600">
            <BookOpen className="h-5 w-5 text-white" />
          </div>
          <div>
            <h1 className="text-sm font-semibold text-slate-900">
              Case Portal
            </h1>
            <p className="text-xs text-slate-500">Academic Platform</p>
          </div>
        </div>
      </div>

      {/* Navigation Menu */}
      <nav className="flex flex-1 flex-col px-4 py-6">
        <div className="mb-6">
          <h2 className="text-xs font-semibold uppercase tracking-wide text-slate-500">
            Main Menu
          </h2>
        </div>

        <div className="space-y-1">
          {filteredNavigation.map((item) => {
            const Icon = item.icon;
            const isActive = location.pathname === item.href;

            return (
              <NavLink
                key={item.name}
                to={item.href}
                className={({ isActive }) =>
                  `group flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-all duration-200 ${
                    isActive
                      ? "bg-blue-50 text-blue-700 border-l-2 border-blue-600"
                      : "text-slate-600 hover:bg-slate-50 hover:text-slate-900"
                  }`
                }
              >
                <Icon
                  className={`h-5 w-5 flex-shrink-0 ${
                    isActive
                      ? "text-blue-600"
                      : "text-slate-400 group-hover:text-slate-600"
                  }`}
                />
                <div className="flex-1">
                  <div className="font-medium">{item.name}</div>
                  <div className="text-xs text-slate-500">
                    {item.description}
                  </div>
                </div>
              </NavLink>
            );
          })}
        </div>
      </nav>

      {/* Logout Section */}
      <div className="border-t border-slate-200 p-4">
        <div className="mb-3 rounded-lg bg-slate-50 p-3">
          <div className="flex items-center gap-3">
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-slate-200">
              <span className="text-xs font-medium text-slate-600">
                {role?.charAt(0) || "U"}
              </span>
            </div>
            <div className="flex-1 min-w-0">
              <div className="text-sm font-medium text-slate-900 truncate">
                {role || "Guest"}
              </div>
              <div className="text-xs text-slate-500 capitalize">
                {role?.toLowerCase() || "Not signed in"}
              </div>
            </div>
          </div>
        </div>

        <button
          onClick={handleLogout}
          className="flex w-full items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium text-slate-600 transition-colors hover:bg-slate-50 hover:text-slate-900"
        >
          <LogOut className="h-4 w-4" />
          <span>Logout</span>
        </button>
      </div>
    </div>
  );
}

export default Sidebar;
