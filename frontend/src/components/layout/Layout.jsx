import { Outlet } from "react-router-dom";
import { Toaster } from "react-hot-toast";
import Sidebar from "./Sidebar";
import Navbar from "./Navbar";

function Layout() {
  return (
    <div className="flex h-screen bg-slate-50 dark:bg-slate-900">
      <aside className="w-64 border-r border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900">
        <Sidebar />
      </aside>

      <div className="flex flex-1 flex-col">
        <Toaster position="top-right" />
        <header className="border-b border-slate-200 bg-white px-6 py-3 dark:border-slate-800 dark:bg-slate-900">
          <Navbar />
        </header>

        <main className="flex-1 overflow-y-auto bg-slate-50 px-6 py-4 dark:bg-slate-950">
          <Outlet />
        </main>
      </div>
    </div>
  );
}

export default Layout;

