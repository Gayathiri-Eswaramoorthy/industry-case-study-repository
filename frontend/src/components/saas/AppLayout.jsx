import { Outlet } from "react-router-dom";
import { Toaster } from "react-hot-toast";
import Sidebar from "./Sidebar";
import Navbar from "./Navbar";

function AppLayout() {
  return (
    <div className="flex h-screen bg-slate-50">
      {/* Sidebar - Fixed Left Navigation */}
      <aside className="w-[260px] flex-shrink-0 border-r border-slate-200 bg-white">
        <Sidebar />
      </aside>

      {/* Main Content Area */}
      <div className="flex flex-1 flex-col overflow-hidden">
        {/* Top Navbar */}
        <header className="flex h-16 flex-shrink-0 items-center justify-between border-b border-slate-200 bg-white px-6">
          <Navbar />
        </header>

        {/* Main Dashboard Content */}
        <main className="flex flex-1 overflow-hidden">
          <div className="flex flex-1 flex-col overflow-y-auto">
            <div className="flex-1 px-6 py-6">
              <Outlet />
            </div>
          </div>
        </main>
      </div>

      {/* Toast Notifications */}
      <Toaster 
        position="top-right"
        toastOptions={{
          className: 'bg-white border border-slate-200 text-slate-800 rounded-lg shadow-lg',
          success: {
            iconTheme: {
              primary: '#10B981',
              secondary: '#FFFFFF',
            },
          },
          error: {
            iconTheme: {
              primary: '#EF4444',
              secondary: '#FFFFFF',
            },
          },
        }}
      />
    </div>
  );
}

export default AppLayout;
