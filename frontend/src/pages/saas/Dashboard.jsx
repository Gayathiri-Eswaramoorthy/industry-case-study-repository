import { useContext } from "react";
import { AuthContext } from "../../context/AuthContext";
import KpiCard from "../../components/saas/KpiCard";
import RepositoryTable from "../../components/saas/RepositoryTable";
import AnalyticsSection from "../../components/saas/AnalyticsSection";
import { 
  BookOpen, 
  Users, 
  Clock, 
  TrendingUp,
  Plus,
  Filter,
  Download
} from "lucide-react";

function Dashboard() {
  const { role } = useContext(AuthContext);

  // Mock KPI data
  const kpiData = [
    {
      title: "Total Case Studies",
      value: "156",
      icon: BookOpen,
      trend: { value: 12, isPositive: true },
      description: "3 added this week"
    },
    {
      title: "Pending Reviews",
      value: "23",
      icon: Clock,
      trend: { value: 8, isPositive: false },
      description: "Need attention"
    },
    {
      title: "Active Faculty",
      value: "48",
      icon: Users,
      trend: { value: 15, isPositive: true },
      description: "6 new this month"
    },
    {
      title: "Library Engagement",
      value: "87%",
      icon: TrendingUp,
      trend: { value: 5, isPositive: true },
      description: "Above target"
    }
  ];

  // Mock repository data
  const repositoryData = [
    {
      id: 1001,
      title: "Digital Marketing Strategy Case Study",
      author: "Dr. Sarah Johnson",
      category: "Business",
      uploadDate: "2024-01-15",
      status: "published"
    },
    {
      id: 1002,
      title: "Machine Learning in Healthcare",
      author: "Prof. Michael Chen",
      category: "Technology",
      uploadDate: "2024-01-14",
      status: "review"
    },
    {
      id: 1003,
      title: "Supply Chain Optimization",
      author: "Dr. Emily Davis",
      category: "Business",
      uploadDate: "2024-01-13",
      status: "published"
    },
    {
      id: 1004,
      title: "Renewable Energy Implementation",
      author: "Prof. James Wilson",
      category: "Technology",
      uploadDate: "2024-01-12",
      status: "draft"
    },
    {
      id: 1005,
      title: "Patient Care Management System",
      author: "Dr. Lisa Anderson",
      category: "Healthcare",
      uploadDate: "2024-01-11",
      status: "published"
    }
  ];

  const handleViewCase = (item) => {
    console.log("View case:", item);
    // Navigate to case details
  };

  const handleEditCase = (item) => {
    console.log("Edit case:", item);
    // Navigate to edit page
  };

  const handleDeleteCase = (item) => {
    console.log("Delete case:", item);
    // Show confirmation dialog
  };

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-slate-900">
            Dashboard Overview
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            Welcome back! Here's what's happening with your case studies today.
          </p>
        </div>
        
        <div className="flex items-center gap-3">
          <button className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-slate-700 bg-white border border-slate-300 rounded-lg hover:bg-slate-50 transition-colors">
            <Filter className="h-4 w-4" />
            Filter
          </button>
          <button className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 transition-colors">
            <Plus className="h-4 w-4" />
            New Case Study
          </button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
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

      {/* Repository Management Section */}
      <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-lg font-semibold text-slate-900">
              Repository Management
            </h2>
            <p className="text-sm text-slate-500">
              Manage your case study library and review submissions
            </p>
          </div>
          <div className="flex items-center gap-3">
            <button className="flex items-center gap-2 px-3 py-1.5 text-sm font-medium text-slate-700 bg-white border border-slate-300 rounded-lg hover:bg-slate-50 transition-colors">
              <Download className="h-4 w-4" />
              Export
            </button>
          </div>
        </div>
        
        <RepositoryTable
          data={repositoryData}
          onView={handleViewCase}
          onEdit={handleEditCase}
          onDelete={handleDeleteCase}
        />
      </div>

      {/* Analytics Section */}
      <AnalyticsSection />

      {/* Role-specific Content */}
      {role === "ADMIN" && (
        <div className="bg-blue-50 border border-blue-200 rounded-xl p-6">
          <h3 className="text-lg font-semibold text-blue-900 mb-2">
            Admin Dashboard
          </h3>
          <p className="text-sm text-blue-700 mb-4">
            You have administrative privileges. Manage users, system settings, and platform analytics.
          </p>
          <div className="flex gap-3">
            <button className="px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 transition-colors">
              Manage Users
            </button>
            <button className="px-4 py-2 bg-blue-100 text-blue-700 text-sm font-medium rounded-lg hover:bg-blue-200 transition-colors">
              System Settings
            </button>
          </div>
        </div>
      )}

      {role === "FACULTY" && (
        <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-6">
          <h3 className="text-lg font-semibold text-emerald-900 mb-2">
            Faculty Dashboard
          </h3>
          <p className="text-sm text-emerald-700 mb-4">
            Create and manage case studies, evaluate student submissions, and track progress.
          </p>
          <div className="flex gap-3">
            <button className="px-4 py-2 bg-emerald-600 text-white text-sm font-medium rounded-lg hover:bg-emerald-700 transition-colors">
              Create Case Study
            </button>
            <button className="px-4 py-2 bg-emerald-100 text-emerald-700 text-sm font-medium rounded-lg hover:bg-emerald-200 transition-colors">
              Review Submissions
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
            Browse case studies, submit solutions, and track your learning progress.
          </p>
          <div className="flex gap-3">
            <button className="px-4 py-2 bg-purple-600 text-white text-sm font-medium rounded-lg hover:bg-purple-700 transition-colors">
              Browse Case Studies
            </button>
            <button className="px-4 py-2 bg-purple-100 text-purple-700 text-sm font-medium rounded-lg hover:bg-purple-200 transition-colors">
              My Submissions
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

export default Dashboard;
