import { useState } from "react";
import { Outlet } from "react-router-dom";
import { Toaster } from "react-hot-toast";
import ImprovedSidebar from "./ImprovedSidebar";
import Navbar from "./Navbar";

function Layout() {
  const [isCollapsed, setIsCollapsed] = useState(() => {
    if (typeof window === "undefined") {
      return false;
    }
    return localStorage.getItem("sidebar-collapsed") === "true";
  });

  const handleToggleSidebar = () => {
    setIsCollapsed((prev) => {
      const next = !prev;
      localStorage.setItem("sidebar-collapsed", String(next));
      return next;
    });
  };

  return (
    <div className="flex h-screen overflow-x-hidden bg-slate-50 dark:bg-slate-900">
      <aside
        className={`${
          isCollapsed ? "w-16" : "w-60"
        } shrink-0 border-r border-slate-200 bg-white transition-all duration-300 ease-in-out dark:border-slate-800 dark:bg-slate-900`}
      >
        <ImprovedSidebar
          isCollapsed={isCollapsed}
          onToggleCollapse={handleToggleSidebar}
        />
      </aside>

      <div className="flex min-w-0 flex-1 flex-col overflow-x-hidden transition-all duration-300 ease-in-out">
        <Toaster position="top-right" />
        <header className="border-b border-slate-200 bg-white px-6 py-3 dark:border-slate-800 dark:bg-slate-900">
          <Navbar />
        </header>

        <main className="min-w-0 flex-1 overflow-x-hidden overflow-y-auto bg-slate-50 px-6 py-4 dark:bg-slate-950">
          <Outlet />
        </main>
      </div>
    </div>
  );
}

export default Layout;

