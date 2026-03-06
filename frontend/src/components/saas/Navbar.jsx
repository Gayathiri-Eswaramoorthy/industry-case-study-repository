import { useContext, useState } from "react";
import { AuthContext } from "../../context/AuthContext";
import { 
  Search, 
  Bell, 
  User, 
  Settings,
  HelpCircle,
  LogOut
} from "lucide-react";

function Navbar() {
  const { role, logout } = useContext(AuthContext);
  const [searchQuery, setSearchQuery] = useState("");
  const [showNotifications, setShowNotifications] = useState(false);
  const [showUserMenu, setShowUserMenu] = useState(false);

  const handleSearch = (e) => {
    e.preventDefault();
    console.log("Searching for:", searchQuery);
    // Implement search functionality
  };

  const handleLogout = () => {
    logout();
    // Navigation will be handled by AuthContext
  };

  // Mock notifications
  const notifications = [
    { id: 1, title: "New case submission", time: "5 min ago", read: false },
    { id: 2, title: "Review completed", time: "1 hour ago", read: false },
    { id: 3, title: "System update", time: "2 hours ago", read: true },
  ];

  const unreadCount = notifications.filter(n => !n.read).length;

  return (
    <div className="flex w-full items-center justify-between">
      {/* Left Section - Page Title (can be dynamic) */}
      <div className="flex-1">
        <h1 className="text-lg font-semibold text-slate-900">
          Industry Case Study Repository
        </h1>
        <p className="text-sm text-slate-500">
          Academic Learning Platform
        </p>
      </div>

      {/* Right Section - Search, Notifications, User */}
      <div className="flex items-center gap-4">
        {/* Global Search Bar */}
        <form onSubmit={handleSearch} className="relative">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Search cases, users, or content..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-80 rounded-lg border border-slate-200 bg-white pl-10 pr-4 py-2 text-sm text-slate-900 placeholder-slate-400 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20 transition-all"
          />
        </form>

        {/* Notifications */}
        <div className="relative">
          <button
            onClick={() => {
              setShowNotifications(!showNotifications);
              setShowUserMenu(false);
            }}
            className="relative flex h-10 w-10 items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-600 transition-colors hover:bg-slate-50 hover:text-slate-900"
          >
            <Bell className="h-5 w-5" />
            {unreadCount > 0 && (
              <span className="absolute -top-1 -right-1 h-5 w-5 rounded-full bg-red-500 text-white text-xs flex items-center justify-center border-2 border-white">
                {unreadCount}
              </span>
            )}
          </button>

          {/* Notifications Dropdown */}
          {showNotifications && (
            <div className="absolute right-0 mt-2 w-80 bg-white rounded-lg border border-slate-200 shadow-lg z-50">
              <div className="p-4 border-b border-slate-200">
                <h3 className="text-sm font-semibold text-slate-900">Notifications</h3>
              </div>
              <div className="max-h-96 overflow-y-auto">
                {notifications.map((notification) => (
                  <div
                    key={notification.id}
                    className={`p-4 border-b border-slate-100 hover:bg-slate-50 cursor-pointer ${
                      !notification.read ? 'bg-blue-50' : ''
                    }`}
                  >
                    <div className="flex items-start gap-3">
                      <div className={`h-2 w-2 rounded-full mt-2 flex-shrink-0 ${
                        !notification.read ? 'bg-blue-600' : 'bg-transparent'
                      }`} />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm text-slate-900">{notification.title}</p>
                        <p className="text-xs text-slate-500 mt-1">{notification.time}</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
              <div className="p-3 border-t border-slate-200">
                <button className="text-sm text-blue-600 hover:text-blue-700 font-medium">
                  View all notifications
                </button>
              </div>
            </div>
          )}
        </div>

        {/* User Profile */}
        <div className="relative">
          <button
            onClick={() => {
              setShowUserMenu(!showUserMenu);
              setShowNotifications(false);
            }}
            className="flex items-center gap-3 rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700 transition-colors hover:bg-slate-50"
          >
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-slate-100">
              <User className="h-4 w-4 text-slate-600" />
            </div>
            <div className="text-left">
              <div className="text-sm font-medium text-slate-900 capitalize">
                {role || 'Guest'}
              </div>
              <div className="text-xs text-slate-500">
                {role ? `${role.toLowerCase()}@portal.edu` : 'Not signed in'}
              </div>
            </div>
          </button>

          {/* User Menu Dropdown */}
          {showUserMenu && (
            <div className="absolute right-0 mt-2 w-56 bg-white rounded-lg border border-slate-200 shadow-lg z-50">
              <div className="p-3 border-b border-slate-200">
                <p className="text-sm font-medium text-slate-900 capitalize">
                  {role || 'Guest User'}
                </p>
                <p className="text-xs text-slate-500">
                  {role ? `${role.toLowerCase()}@portal.edu` : 'guest@portal.edu'}
                </p>
              </div>
              <div className="py-2">
                <button className="flex w-full items-center gap-3 px-3 py-2 text-sm text-slate-700 hover:bg-slate-50 transition-colors">
                  <User className="h-4 w-4" />
                  <span>Profile</span>
                </button>
                <button className="flex w-full items-center gap-3 px-3 py-2 text-sm text-slate-700 hover:bg-slate-50 transition-colors">
                  <Settings className="h-4 w-4" />
                  <span>Settings</span>
                </button>
                <button className="flex w-full items-center gap-3 px-3 py-2 text-sm text-slate-700 hover:bg-slate-50 transition-colors">
                  <HelpCircle className="h-4 w-4" />
                  <span>Help & Support</span>
                </button>
              </div>
              <div className="border-t border-slate-200 py-2">
                <button
                  onClick={handleLogout}
                  className="flex w-full items-center gap-3 px-3 py-2 text-sm text-red-600 hover:bg-red-50 transition-colors"
                >
                  <LogOut className="h-4 w-4" />
                  <span>Sign out</span>
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default Navbar;
