import { useContext } from "react";
import { AuthContext } from "../../context/AuthContext";
import { Bell, Search, HelpCircle, Settings } from "lucide-react";
import ThemeToggle from "../ThemeToggle";

function ImprovedNavbar() {
  const { role } = useContext(AuthContext);

  return (
    <div className="flex w-full items-center justify-between">
      {/* Left Section - Page Title */}
      <div className="flex-1">
        <h1 className="text-lg font-semibold text-slate-900">
          Industry Case Study Portal
        </h1>
        <p className="text-sm text-slate-500">
          {role ? `Signed in as ${role.toLowerCase()}` : "Not signed in"}
        </p>
      </div>

      {/* Right Section - Actions */}
      <div className="flex items-center gap-3">
        {/* Search */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Quick search..."
            className="w-64 rounded-lg border border-slate-200 bg-white pl-10 pr-4 py-2 text-sm text-slate-900 placeholder-slate-400 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
          />
        </div>

        {/* Notifications */}
        <button className="relative flex h-10 w-10 items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-600 transition-colors hover:bg-slate-50 hover:text-slate-900">
          <Bell className="h-5 w-5" />
          <span className="absolute -top-1 -right-1 h-3 w-3 rounded-full bg-red-500 border-2 border-white"></span>
        </button>

        {/* Help */}
        <button className="flex h-10 w-10 items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-600 transition-colors hover:bg-slate-50 hover:text-slate-900">
          <HelpCircle className="h-5 w-5" />
        </button>

        {/* Settings */}
        <button className="flex h-10 w-10 items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-600 transition-colors hover:bg-slate-50 hover:text-slate-900">
          <Settings className="h-5 w-5" />
        </button>

        {/* Theme Toggle */}
        <ThemeToggle />
      </div>
    </div>
  );
}

export default ImprovedNavbar;
