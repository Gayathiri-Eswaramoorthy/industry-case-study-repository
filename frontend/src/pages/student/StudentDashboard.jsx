import { BookOpen, Clock, FileText, TrendingUp } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import KpiCard from "../../components/saas/KpiCard";
import ActivityFeed from "../../components/ActivityFeed";
import { getStudentDashboard } from "../../services/studentDashboardService";

function StudentDashboard() {
  const navigate = useNavigate();
  const { data, isLoading } = useQuery({
    queryKey: ["student-dashboard"],
    queryFn: getStudentDashboard,
  });

  const dashboard = {
    totalCases: data?.totalCases ?? 0,
    mySubmissions: data?.mySubmissions ?? 0,
    completionRate: data?.completionRate ?? 0,
    activeCases: data?.activeCases ?? 0,
    submitted: data?.submitted ?? 0,
    pendingReview: data?.pendingReview ?? 0,
  };

  const kpiData = [
    {
      title: "Available Cases",
      value: String(dashboard.totalCases),
      icon: BookOpen,
      trend: { value: dashboard.activeCases, isPositive: true },
      description: `${dashboard.activeCases} still open for submission`,
    },
    {
      title: "My Submissions",
      value: String(dashboard.mySubmissions),
      icon: FileText,
      trend: { value: dashboard.pendingReview, isPositive: false },
      description: `${dashboard.pendingReview} awaiting review`,
    },
    {
      title: "Completion Rate",
      value: `${dashboard.completionRate}%`,
      icon: TrendingUp,
      trend: {
        value: dashboard.completionRate,
        isPositive: dashboard.completionRate >= 50,
      },
      description:
        dashboard.completionRate >= 50 ? "Good progress!" : "Keep going!",
    },
    {
      title: "Pending Review",
      value: String(dashboard.pendingReview),
      icon: Clock,
      trend: { value: 0, isPositive: true },
      description: "Submitted, awaiting faculty",
    },
  ];

  const breakdownItems = [
    {
      label: "Submitted",
      value: dashboard.submitted,
      color: "bg-sky-500",
      max: dashboard.mySubmissions,
    },
    {
      label: "Pending Review",
      value: dashboard.pendingReview,
      color: "bg-amber-500",
      max: dashboard.mySubmissions,
    },
    {
      label: "Evaluated",
      value: dashboard.mySubmissions - dashboard.pendingReview,
      color: "bg-emerald-500",
      max: dashboard.mySubmissions,
    },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-slate-900 dark:text-slate-100">
            Student Dashboard
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400">
            Browse cases and track your learning progress.
          </p>
        </div>
        <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-medium text-slate-600 dark:bg-slate-800 dark:text-slate-300">
          student
        </span>
      </div>

      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
        {isLoading
          ? Array.from({ length: 4 }).map((_, index) => (
              <div
                key={index}
                className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900"
              >
                <div className="mb-3 h-4 w-1/2 animate-pulse rounded bg-slate-200 dark:bg-slate-700" />
                <div className="mb-3 h-8 w-1/3 animate-pulse rounded bg-slate-200 dark:bg-slate-700" />
                <div className="h-3 w-2/3 animate-pulse rounded bg-slate-200 dark:bg-slate-700" />
              </div>
            ))
          : kpiData.map((kpi) => (
              <KpiCard
                key={kpi.title}
                title={kpi.title}
                value={kpi.value}
                icon={kpi.icon}
                trend={kpi.trend}
                description={kpi.description}
              />
            ))}
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        <button
          onClick={() => navigate("/cases")}
          className="flex items-center gap-4 rounded-xl border border-slate-200 bg-white p-4 shadow-sm transition hover:border-blue-300 hover:shadow-md dark:border-slate-800 dark:bg-slate-900"
        >
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-50 text-blue-600">
            <BookOpen className="h-5 w-5" />
          </div>
          <div className="text-left">
            <div className="text-sm font-semibold text-slate-800 dark:text-slate-100">
              Browse Cases
            </div>
            <div className="text-xs text-slate-500">
              {dashboard.totalCases} available
            </div>
          </div>
        </button>

        <button
          onClick={() => navigate("/student/submissions")}
          className="flex items-center gap-4 rounded-xl border border-slate-200 bg-white p-4 shadow-sm transition hover:border-emerald-300 hover:shadow-md dark:border-slate-800 dark:bg-slate-900"
        >
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-emerald-50 text-emerald-600">
            <FileText className="h-5 w-5" />
          </div>
          <div className="text-left">
            <div className="text-sm font-semibold text-slate-800 dark:text-slate-100">
              My Submissions
            </div>
            <div className="text-xs text-slate-500">
              {dashboard.mySubmissions} submitted
            </div>
          </div>
        </button>

        <button
          onClick={() => navigate("/cases")}
          className="flex items-center gap-4 rounded-xl border border-slate-200 bg-white p-4 shadow-sm transition hover:border-violet-300 hover:shadow-md dark:border-slate-800 dark:bg-slate-900"
        >
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-violet-50 text-violet-600">
            <TrendingUp className="h-5 w-5" />
          </div>
          <div className="text-left">
            <div className="text-sm font-semibold text-slate-800 dark:text-slate-100">
              Track Progress
            </div>
            <div className="text-xs text-slate-500">
              {dashboard.completionRate}% complete
            </div>
          </div>
        </button>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <ActivityFeed maxItems={6} />
        </div>

        <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900">
          <h2 className="mb-4 text-sm font-semibold text-slate-800 dark:text-slate-100">
            Submission Breakdown
          </h2>
          {isLoading ? (
            <div className="space-y-3">
              {[1, 2, 3].map((i) => (
                <div
                  key={i}
                  className="h-8 animate-pulse rounded bg-slate-100 dark:bg-slate-800"
                />
              ))}
            </div>
          ) : dashboard.mySubmissions === 0 ? (
            <div className="rounded-lg border border-dashed border-slate-300 py-6 text-center text-xs text-slate-500">
              No submissions yet. <br />
              <button
                onClick={() => navigate("/cases")}
                className="mt-2 text-blue-600 underline"
              >
                Browse cases to get started
              </button>
            </div>
          ) : (
            <div className="space-y-3">
              {breakdownItems.map(({ label, value, color, max }) => (
                <div key={label}>
                  <div className="mb-1 flex justify-between text-xs text-slate-600 dark:text-slate-400">
                    <span>{label}</span>
                    <span className="font-medium">{value}</span>
                  </div>
                  <div className="h-2 w-full rounded-full bg-slate-100 dark:bg-slate-800">
                    <div
                      className={`h-2 rounded-full ${color} transition-all duration-500`}
                      style={{ width: max > 0 ? `${(value / max) * 100}%` : "0%" }}
                    />
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default StudentDashboard;
