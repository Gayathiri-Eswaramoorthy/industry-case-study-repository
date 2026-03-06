import { Outlet } from "react-router-dom";
import { Toaster } from "react-hot-toast";
import ImprovedSidebar from "./ImprovedSidebar";
import ImprovedNavbar from "./ImprovedNavbar";

function ImprovedLayout() {
  return (
    <div className="flex h-screen bg-slate-50">
      {/* Sidebar */}
      <aside className="w-64 flex-shrink-0 border-r border-slate-200 bg-white">
        <ImprovedSidebar />
      </aside>

      {/* Main Content */}
      <div className="flex flex-1 flex-col overflow-hidden">
        {/* Top Navigation */}
        <header className="flex h-16 flex-shrink-0 items-center justify-between border-b border-slate-200 bg-white px-6">
          <ImprovedNavbar />
        </header>

        {/* Page Content */}
        <main className="flex flex-1 overflow-hidden">
          <div className="flex flex-1 flex-col overflow-y-auto">
            <div className="flex-1 p-6">
              <Outlet />
            </div>
          </div>
        </main>
      </div>

      {/* Toast Container */}
      <Toaster 
        position="top-right"
        toastOptions={{
          className: 'bg-white border border-slate-200 text-slate-800',
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

export default ImprovedLayout;
