import { useContext, useMemo } from "react";
import { NavLink, useLocation } from "react-router-dom";
import { AuthContext } from "../../context/AuthContext";
import { 
  LayoutDashboard, 
  BookOpen, 
  PlusCircle, 
  BarChart3, 
  Users, 
  Settings,
  LogOut
} from "lucide-react";

function ImprovedSidebar() {
  const { role, logout } = useContext(AuthContext);
  const location = useLocation();

  const navigation = useMemo(() => {
    const items = [
      {
        to: "/dashboard",
        label: "Dashboard",
        icon: LayoutDashboard,
        description: "Overview and analytics"
      },
      {
        to: "/cases",
        label: "Case Studies",
        icon: BookOpen,
        description: "Browse and manage cases"
      },
    ];

    if (role === "FACULTY" || role === "ADMIN") {
      items.push({
        to: "/analytics",
        label: "Analytics",
        icon: BarChart3,
        description: "Detailed insights"
      });
    }

    if (role === "FACULTY" || role === "ADMIN") {
      items.push({
        to: "/cases/new",
        label: "Create Case",
        icon: PlusCircle,
        description: "Add new case study"
      });
    }

    if (role === "ADMIN") {
      items.push({
        to: "/users",
        label: "Users",
        icon: Users,
        description: "Manage users"
      });
    }

    return items;
  }, [role]);

  const handleLogout = () => {
    logout();
    // Navigation will be handled by AuthContext
  };

  return (
    <div className="flex h-full flex-col">
      {/* Logo Section */}
      <div className="flex h-16 flex-shrink-0 items-center border-b border-slate-200 px-6">
        <div className="flex items-center gap-3">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-600">
            <BookOpen className="h-5 w-5 text-white" />
          </div>
          <div>
            <h1 className="text-sm font-semibold text-slate-900">Case Portal</h1>
            <p className="text-xs text-slate-500">Academic Platform</p>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex flex-1 flex-col px-4 py-6">
        <div className="mb-6">
          <h2 className="text-xs font-semibold uppercase tracking-wide text-slate-500">
            Main Menu
          </h2>
        </div>
        
        <div className="space-y-1">
          {navigation.map((item) => {
            const Icon = item.icon;
            const isActive = location.pathname === item.to;
            
            return (
              <NavLink
                key={item.to}
                to={item.to}
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
                    isActive ? "text-blue-600" : "text-slate-400 group-hover:text-slate-600"
                  }`} 
                />
                <div className="flex-1">
                  <div className="font-medium">{item.label}</div>
                  <div className="text-xs text-slate-500">{item.description}</div>
                </div>
              </NavLink>
            );
          })}
        </div>
      </nav>

      {/* User Section */}
      <div className="border-t border-slate-200 p-4">
        <div className="mb-3 rounded-lg bg-slate-50 p-3">
          <div className="flex items-center gap-3">
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-slate-200">
              <span className="text-xs font-medium text-slate-600">
                {role?.charAt(0) || 'U'}
              </span>
            </div>
            <div className="flex-1 min-w-0">
              <div className="text-sm font-medium text-slate-900 truncate">
                {role || 'Guest'}
              </div>
              <div className="text-xs text-slate-500 capitalize">
                {role?.toLowerCase() || 'Not signed in'}
              </div>
            </div>
          </div>
        </div>
        
        <button
          onClick={handleLogout}
          className="flex w-full items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium text-slate-600 transition-colors hover:bg-slate-50 hover:text-slate-900"
        >
          <LogOut className="h-4 w-4" />
          <span>Sign out</span>
        </button>
      </div>
    </div>
  );
}

export default ImprovedSidebar;
