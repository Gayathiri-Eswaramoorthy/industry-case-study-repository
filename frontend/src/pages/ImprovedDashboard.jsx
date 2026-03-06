import { useContext } from "react";
import { AuthContext } from "../context/AuthContext";
import { useNavigate } from "react-router-dom";
import { getUserFromToken } from "../utils/tokenUtils";
import ImprovedKpiCard from "../components/ImprovedKpiCard";
import {
  BookOpen,
  Users,
  TrendingUp,
  Clock,
  Plus,
  Eye,
  Edit,
} from "lucide-react";

function ImprovedDashboard() {
  const { role } = useContext(AuthContext);
  const navigate = useNavigate();
  const user = getUserFromToken();

  // Mock data - replace with actual API calls
  const kpiData = [
    {
      title: "Total Cases",
      value: "24",
      icon: BookOpen,
      trend: { value: 12, isPositive: true },
      description: "3 added this week",
    },
    {
      title: "Active Students",
      value: "156",
      icon: Users,
      trend: { value: 8, isPositive: true },
      description: "12 new this month",
    },
    {
      title: "Pending Submissions",
      value: "8",
      icon: Clock,
      trend: { value: 5, isPositive: false },
      description: "Need review",
    },
    {
      title: "Completion Rate",
      value: "87%",
      icon: TrendingUp,
      trend: { value: 3, isPositive: true },
      description: "Above target",
    },
  ];

  const recentActivity = [
    {
      id: 1,
      type: "submission",
      title: "New submission for 'Marketing Strategy Case'",
      user: "John Doe",
      time: "2 hours ago",
      status: "pending",
    },
    {
      id: 2,
      type: "case",
      title: "New case study created",
      user: "Dr. Smith",
      time: "4 hours ago",
      status: "published",
    },
    {
      id: 3,
      type: "evaluation",
      title: "Evaluation completed for 'Data Analysis Case'",
      user: "Prof. Johnson",
      time: "6 hours ago",
      status: "completed",
    },
  ];

  const quickActions = [
    {
      title: "Create New Case",
      description: "Add a new case study for students",
      icon: Plus,
      action: () => navigate("/cases/new"),
      color: "blue",
    },
    {
      title: "View All Cases",
      description: "Browse and manage existing cases",
      icon: Eye,
      action: () => navigate("/cases"),
      color: "green",
    },
    {
      title: "Edit Profile",
      description: "Update your account information",
      icon: Edit,
      action: () => navigate("/profile"),
      color: "purple",
    },
  ];

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-slate-900">
            Welcome back, {user?.sub || "User"} 👋
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            Here's what's happening with your case studies today.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <span className="px-3 py-1 text-xs font-medium text-slate-600 bg-slate-100 rounded-full">
            {role?.toLowerCase() || "guest"}
          </span>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
        {kpiData.map((kpi, index) => (
          <ImprovedKpiCard
            key={index}
            title={kpi.title}
            value={kpi.value}
            icon={kpi.icon}
            trend={kpi.trend}
            description={kpi.description}
          />
        ))}
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Quick Actions */}
        <div className="lg:col-span-1">
          <div className="bg-white rounded-xl border border-slate-200 p-6">
            <h2 className="text-lg font-semibold text-slate-900 mb-4">
              Quick Actions
            </h2>
            <div className="space-y-3">
              {quickActions.map((action, index) => {
                const Icon = action.icon;
                return (
                  <button
                    key={index}
                    onClick={action.action}
                    className="w-full flex items-center gap-3 p-3 rounded-lg border border-slate-200 hover:bg-slate-50 transition-colors text-left"
                  >
                    <div
                      className={`flex h-10 w-10 items-center justify-center rounded-lg bg-${action.color}-50 text-${action.color}-600`}
                    >
                      <Icon className="h-5 w-5" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="text-sm font-medium text-slate-900">
                        {action.title}
                      </div>
                      <div className="text-xs text-slate-500">
                        {action.description}
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {/* Recent Activity */}
        <div className="lg:col-span-2">
          <div className="bg-white rounded-xl border border-slate-200 p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-slate-900">
                Recent Activity
              </h2>
              <button className="text-sm text-blue-600 hover:text-blue-700 font-medium">
                View all
              </button>
            </div>

            <div className="space-y-4">
              {recentActivity.map((activity) => (
                <div
                  key={activity.id}
                  className="flex items-start gap-4 p-4 rounded-lg border border-slate-100 hover:bg-slate-50 transition-colors"
                >
                  <div className="flex h-8 w-8 items-center justify-center rounded-full bg-slate-100 flex-shrink-0">
                    <div className="h-2 w-2 rounded-full bg-blue-600"></div>
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-medium text-slate-900">
                      {activity.title}
                    </div>
                    <div className="text-xs text-slate-500 mt-1">
                      {activity.user} • {activity.time}
                    </div>
                  </div>
                  <span
                    className={`px-2 py-1 text-xs font-medium rounded-full ${
                      activity.status === "pending"
                        ? "bg-amber-100 text-amber-700"
                        : activity.status === "completed"
                          ? "bg-emerald-100 text-emerald-700"
                          : "bg-blue-100 text-blue-700"
                    }`}
                  >
                    {activity.status}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Role-specific content */}
      {role === "ADMIN" && (
        <div className="bg-blue-50 border border-blue-200 rounded-xl p-6">
          <h3 className="text-lg font-semibold text-blue-900 mb-2">
            Admin Dashboard
          </h3>
          <p className="text-sm text-blue-700 mb-4">
            You have admin privileges. Manage users and platform settings.
          </p>
          <button
            onClick={() => navigate("/users")}
            className="px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 transition-colors"
          >
            Manage Users
          </button>
        </div>
      )}

      {role === "FACULTY" && (
        <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-6">
          <h3 className="text-lg font-semibold text-emerald-900 mb-2">
            Faculty Dashboard
          </h3>
          <p className="text-sm text-emerald-700 mb-4">
            Create and manage case studies, evaluate student submissions.
          </p>
          <div className="flex gap-3">
            <button
              onClick={() => navigate("/cases/new")}
              className="px-4 py-2 bg-emerald-600 text-white text-sm font-medium rounded-lg hover:bg-emerald-700 transition-colors"
            >
              Create Case
            </button>
            <button
              onClick={() => navigate("/analytics")}
              className="px-4 py-2 bg-emerald-100 text-emerald-700 text-sm font-medium rounded-lg hover:bg-emerald-200 transition-colors"
            >
              View Analytics
            </button>
          </div>
        </div>
      )}

      {role === "STUDENT" && (
        <div className="bg-purple-50 border border-purple-200 rounded-xl p-6">
          <h3 className="text-lg font-semibold text-purple-900 mb-2">
            Student Dashboard
          </h3>
          <p className="text-sm text-purple-700 mb-4">
            Browse case studies and submit your solutions.
          </p>
          <button
            onClick={() => navigate("/cases")}
            className="px-4 py-2 bg-purple-600 text-white text-sm font-medium rounded-lg hover:bg-purple-700 transition-colors"
          >
            View Case Studies
          </button>
        </div>
      )}
    </div>
  );
}

export default ImprovedDashboard;
