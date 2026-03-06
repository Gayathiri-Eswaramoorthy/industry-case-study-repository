import { useContext, useEffect, useState } from "react";
import { AuthContext } from "../context/AuthContext";
import { useNavigate } from "react-router-dom";
import { getUserFromToken } from "../utils/tokenUtils";
import { getDashboardStats } from "../api/analyticsService";
import KpiCard from "../components/saas/KpiCard";
import {
  BookOpen,
  Users,
  Clock,
  TrendingUp,
  Settings,
  Eye,
  Plus,
} from "lucide-react";

function Dashboard() {
  const { logout, role } = useContext(AuthContext);
  const navigate = useNavigate();
  const user = getUserFromToken();
  const [stats, setStats] = useState(null);

  const handleLogout = () => {
    logout();
    navigate("/");
  };

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const data = await getDashboardStats();
        setStats(data);
      } catch (error) {
        console.error("Failed to load dashboard stats", error);
      }
    };

    fetchStats();
  }, []);

  if (stats === null) {
    return <div>Loading dashboard data...</div>;
  }

  // Mock KPI data - replace with actual API calls
  const kpiData = [
    {
      title: "Total Cases",
      value: role === "STUDENT" ? "12" : (stats?.totalCases ?? 0),
      icon: BookOpen,
      trend: { value: 12, isPositive: true },
      description:
        role === "STUDENT" ? "Available to you" : "3 added this week",
    },
    {
      title: role === "STUDENT" ? "My Submissions" : "Pending Reviews",
      value: role === "STUDENT" ? "5" : (stats?.pendingReviews ?? 0),
      icon: Clock,
      trend: {
        value: role === "STUDENT" ? 25 : 5,
        isPositive: role === "STUDENT",
      },
      description: role === "STUDENT" ? "This semester" : "Need attention",
    },
    {
      title: role === "STUDENT" ? "Completion Rate" : "Active Faculty",
      value: role === "STUDENT" ? "87%" : (stats?.activeFaculty ?? 0),
      icon: role === "STUDENT" ? TrendingUp : Users,
      trend: { value: 8, isPositive: true },
      description: role === "STUDENT" ? "Above average" : "6 new this month",
    },
  ];

  // Add admin-specific KPI
  if (role === "ADMIN") {
    kpiData.push({
      title: "Platform Users",
      value: stats?.totalUsers ?? 0,
      icon: Users,
      trend: { value: 15, isPositive: true },
      description: "12 new this month",
    });
  }

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-slate-900">
            Welcome back, {user?.sub || "User"} 👋
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            {role === "ADMIN" && "Manage your platform and monitor analytics"}
            {role === "FACULTY" &&
              "Create cases and review student submissions"}
            {role === "STUDENT" && "Browse cases and track your progress"}
          </p>
        </div>

        <div className="flex items-center gap-3">
          <span className="px-3 py-1 text-xs font-medium text-slate-600 bg-slate-100 rounded-full capitalize">
            {role?.toLowerCase() || "guest"}
          </span>
        </div>
      </div>

      {/* System Status Banner */}
      <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-4">
        <div className="flex items-center gap-3">
          <div className="h-8 w-8 rounded-full bg-emerald-100 flex items-center justify-center">
            <span className="text-sm">✓</span>
          </div>
          <div>
            <h3 className="text-sm font-medium text-emerald-900">
              System Status: All Operational
            </h3>
            <p className="text-xs text-emerald-700">
              Tailwind CSS is active and all services are running normally.
            </p>
          </div>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {kpiData.map((kpi, index) => (
          <KpiCard
            key={index}
            title={kpi.title}
            value={kpi.value}
            icon={kpi.icon}
            trend={kpi.trend}
            description={kpi.description}
          />
        ))}
      </div>

      {/* Role-specific Action Sections */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Quick Actions */}
        <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm">
          <h2 className="text-lg font-semibold text-slate-900 mb-4">
            Quick Actions
          </h2>
          <div className="space-y-3">
            {role === "ADMIN" && (
              <>
                <button
                  onClick={() => navigate("/users")}
                  className="w-full flex items-center gap-3 p-3 rounded-lg border border-slate-200 hover:bg-slate-50 transition-colors text-left"
                >
                  <Users className="h-5 w-5 text-blue-600" />
                  <div>
                    <div className="text-sm font-medium text-slate-900">
                      Manage Users
                    </div>
                    <div className="text-xs text-slate-500">
                      Add, edit, or remove user accounts
                    </div>
                  </div>
                </button>
                <button className="w-full flex items-center gap-3 p-3 rounded-lg border border-slate-200 hover:bg-slate-50 transition-colors text-left">
                  <Settings className="h-5 w-5 text-slate-600" />
                  <div>
                    <div className="text-sm font-medium text-slate-900">
                      System Settings
                    </div>
                    <div className="text-xs text-slate-500">
                      Configure platform preferences
                    </div>
                  </div>
                </button>
              </>
            )}

            {role === "FACULTY" && (
              <>
                <button
                  onClick={() => navigate("/cases/new")}
                  className="w-full flex items-center gap-3 p-3 rounded-lg border border-slate-200 hover:bg-slate-50 transition-colors text-left"
                >
                  <Plus className="h-5 w-5 text-emerald-600" />
                  <div>
                    <div className="text-sm font-medium text-slate-900">
                      Create New Case
                    </div>
                    <div className="text-xs text-slate-500">
                      Add a new case study for students
                    </div>
                  </div>
                </button>
                <button className="w-full flex items-center gap-3 p-3 rounded-lg border border-slate-200 hover:bg-slate-50 transition-colors text-left">
                  <Clock className="h-5 w-5 text-amber-600" />
                  <div>
                    <div className="text-sm font-medium text-slate-900">
                      Approval Dashboard
                    </div>
                    <div className="text-xs text-slate-500">
                      Review pending submissions
                    </div>
                  </div>
                </button>
              </>
            )}

            {role === "STUDENT" && (
              <>
                <button
                  onClick={() => navigate("/cases")}
                  className="w-full flex items-center gap-3 p-3 rounded-lg border border-slate-200 hover:bg-slate-50 transition-colors text-left"
                >
                  <Eye className="h-5 w-5 text-purple-600" />
                  <div>
                    <div className="text-sm font-medium text-slate-900">
                      View Case Studies
                    </div>
                    <div className="text-xs text-slate-500">
                      Browse available case studies
                    </div>
                  </div>
                </button>
                <button
                  onClick={() => navigate("/submissions")}
                  className="w-full flex items-center gap-3 p-3 rounded-lg border border-slate-200 hover:bg-slate-50 transition-colors text-left"
                >
                  <BookOpen className="h-5 w-5 text-blue-600" />
                  <div>
                    <div className="text-sm font-medium text-slate-900">
                      My Submissions
                    </div>
                    <div className="text-xs text-slate-500">
                      Track your submitted work
                    </div>
                  </div>
                </button>
              </>
            )}
          </div>
        </div>

        {/* Role-specific Information */}
        <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm">
          <h2 className="text-lg font-semibold text-slate-900 mb-4">
            {role === "ADMIN" && "Admin Overview"}
            {role === "FACULTY" && "Faculty Dashboard"}
            {role === "STUDENT" && "Student Portal"}
          </h2>

          <div className="space-y-4">
            <div className="p-4 rounded-lg bg-slate-50">
              <h3 className="text-sm font-medium text-slate-900 mb-2">
                Platform Statistics
              </h3>
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-slate-600">Total Users</span>
                  <span className="font-medium text-slate-900">
                    {stats?.totalUsers ?? 0}
                  </span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-slate-600">Active Cases</span>
                  <span className="font-medium text-slate-900">
                    {stats?.activeCases ?? 0}
                  </span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-slate-600">Pending Reviews</span>
                  <span className="font-medium text-slate-900">
                    {stats?.pendingReviews ?? 0}
                  </span>
                </div>
              </div>
            </div>

            <div className="p-4 rounded-lg bg-blue-50 border border-blue-200">
              <h3 className="text-sm font-medium text-blue-900 mb-2">
                Recent Activity
              </h3>
              <p className="text-xs text-blue-700">
                {role === "ADMIN" &&
                  "3 new user registrations pending approval"}
                {role === "FACULTY" && "5 new submissions ready for review"}
                {role === "STUDENT" && "2 new case studies available"}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Legacy Logout Button (for compatibility) */}
      <div className="text-center">
        <button
          onClick={handleLogout}
          className="px-4 py-2 text-sm text-slate-600 hover:text-slate-900 transition-colors"
        >
          Sign out
        </button>
      </div>
    </div>
  );
}

export default Dashboard;
