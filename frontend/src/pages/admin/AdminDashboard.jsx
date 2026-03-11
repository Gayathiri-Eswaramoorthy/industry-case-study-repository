import { useQuery } from "@tanstack/react-query";
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  PieChart,
  Pie,
  Cell,
  Legend,
} from "recharts";
import {
  BarChart3,
  ClipboardCheck,
  FileText,
  TrendingUp,
  Users,
} from "lucide-react";
import analyticsService from "../../modules/analytics/services/analyticsService";
import ActivityFeed from "../../components/ActivityFeed";

function MetricCardSkeleton() {
  return (
    <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900">
      <div className="mb-3 h-5 w-32 animate-pulse rounded bg-slate-200 dark:bg-slate-700" />
      <div className="h-8 w-20 animate-pulse rounded bg-slate-200 dark:bg-slate-700" />
      <div className="mt-3 h-4 w-24 animate-pulse rounded bg-slate-200 dark:bg-slate-700" />
    </div>
  );
}

function MetricCard({ title, value, icon, trend }) {
  return (
    <div className="group rounded-xl border border-slate-200 bg-white p-5 shadow-sm transition duration-200 hover:-translate-y-0.5 hover:shadow-md dark:border-slate-800 dark:bg-slate-900">
      <div className="mb-3 flex items-center gap-2 text-slate-700 dark:text-slate-200">
        <span className="rounded-md bg-slate-100 p-2 text-slate-600 transition group-hover:bg-blue-100 group-hover:text-blue-600 dark:bg-slate-800 dark:text-slate-300 dark:group-hover:bg-blue-950/60 dark:group-hover:text-blue-300">
          {icon}
        </span>
        <h2 className="font-medium">{title}</h2>
      </div>
      <p className="text-3xl font-semibold text-slate-800 dark:text-slate-100">
        {value}
      </p>
      <p className="mt-2 inline-flex items-center gap-1 text-xs text-emerald-600 dark:text-emerald-400">
        <TrendingUp className="h-3.5 w-3.5" />
        {trend}
      </p>
    </div>
  );
}

function renderPieLabel({
  cx,
  cy,
  midAngle,
  innerRadius,
  outerRadius,
  name,
  value,
}) {
  const RADIAN = Math.PI / 180;
  const radius = outerRadius + 24;
  const x = cx + radius * Math.cos(-midAngle * RADIAN);
  const y = cy + radius * Math.sin(-midAngle * RADIAN);

  return (
    <text
      x={x}
      y={y}
      fill="#64748b"
      textAnchor={x > cx ? "start" : "end"}
      dominantBaseline="central"
      fontSize={12}
    >
      {`${name}: ${value}`}
    </text>
  );
}

function AdminDashboard() {
  const {
    data: dashboardData,
    isLoading: isLoadingDashboard,
    isError: dashboardError,
  } = useQuery({
    queryKey: ["admin-dashboard-metrics"],
    queryFn: () => analyticsService.getDashboardStats(),
  });

  const {
    data: userAnalytics,
    isLoading: isLoadingUsers,
    isError: userError,
  } = useQuery({
    queryKey: ["admin-user-analytics"],
    queryFn: () => analyticsService.getUserAnalytics(),
  });

  const {
    data: submissionAnalytics,
    isLoading: isLoadingSubmissions,
    isError: submissionError,
  } = useQuery({
    queryKey: ["admin-submission-analytics"],
    queryFn: () => analyticsService.getSubmissionAnalytics(),
  });

  const isLoading = isLoadingDashboard || isLoadingUsers || isLoadingSubmissions;
  const isError = dashboardError || userError || submissionError;

  const metrics = {
    totalUsers: dashboardData?.totalUsers ?? 0,
    totalCases: dashboardData?.totalCases ?? 0,
    totalSubmissions: dashboardData?.totalSubmissions ?? 0,
    pendingReviews: dashboardData?.pendingReviews ?? 0,
  };

  const caseActivityData = [
    { name: "Cases", value: metrics.totalCases },
    { name: "Submissions", value: metrics.totalSubmissions },
    { name: "Evaluations", value: submissionAnalytics?.evaluated ?? 0 },
  ];

  const userDistributionData = [
    { name: "Students", value: userAnalytics?.students ?? 0 },
    { name: "Faculty", value: userAnalytics?.activeFaculty ?? 0 },
    { name: "Admins", value: userAnalytics?.admins ?? 0 },
  ];

  const PIE_COLORS = ["#0EA5E9", "#10B981", "#6366F1"];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-slate-900 dark:text-slate-100">
          Admin Dashboard
        </h1>
        <p className="text-sm text-slate-500 dark:text-slate-400">
          Manage users and monitor platform-wide activity.
        </p>
      </div>

      {isError && (
        <div className="rounded-md border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700 dark:border-red-900 dark:bg-red-950/30 dark:text-red-300">
          Unable to load dashboard metrics. Please try again.
        </div>
      )}

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {isLoading ? (
          <>
            <MetricCardSkeleton />
            <MetricCardSkeleton />
            <MetricCardSkeleton />
            <MetricCardSkeleton />
          </>
        ) : (
          <>
            <MetricCard
              title="Total Users"
              value={metrics.totalUsers}
              icon={<Users className="h-5 w-5" />}
              trend="+2 this week"
            />
            <MetricCard
              title="Total Case Studies"
              value={metrics.totalCases}
              icon={<BarChart3 className="h-5 w-5" />}
              trend="+1 this week"
            />
            <MetricCard
              title="Total Submissions"
              value={metrics.totalSubmissions}
              icon={<FileText className="h-5 w-5" />}
              trend="+5 this week"
            />
            <MetricCard
              title="Pending Reviews"
              value={metrics.pendingReviews}
              icon={<ClipboardCheck className="h-5 w-5" />}
              trend="+1 this week"
            />
          </>
        )}
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900">
          <h2 className="mb-4 text-sm font-semibold text-slate-800 dark:text-slate-100">
            Case Activity
          </h2>
          {isLoading ? (
            <div className="h-72 animate-pulse rounded bg-slate-200 dark:bg-slate-800" />
          ) : (
            <div className="h-72">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={caseActivityData}>
                  <XAxis dataKey="name" />
                  <YAxis allowDecimals={false} />
                  <Tooltip />
                  <Bar dataKey="value" radius={[6, 6, 0, 0]} fill="#3B82F6" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}
        </div>

        <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900">
          <h2 className="mb-4 text-sm font-semibold text-slate-800 dark:text-slate-100">
            User Distribution
          </h2>
          {isLoading ? (
            <div className="h-72 animate-pulse rounded bg-slate-200 dark:bg-slate-800" />
          ) : (
            <div className="h-72">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={userDistributionData}
                    dataKey="value"
                    nameKey="name"
                    cx="50%"
                    cy="50%"
                    outerRadius={90}
                    label={renderPieLabel}
                  >
                    {userDistributionData.map((entry, index) => (
                      <Cell
                        key={entry.name}
                        fill={PIE_COLORS[index % PIE_COLORS.length]}
                      />
                    ))}
                  </Pie>
                  <Tooltip />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            </div>
          )}
        </div>
      </div>

      <ActivityFeed maxItems={6} />
    </div>
  );
}

export default AdminDashboard;
