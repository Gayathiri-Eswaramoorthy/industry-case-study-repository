import { BookOpen, Clock, Eye, TrendingUp } from "lucide-react";
import KpiCard from "../../components/saas/KpiCard";
import { useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
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
      title: "Total Cases",
      value: String(dashboard.totalCases),
      icon: BookOpen,
      trend: { value: 0, isPositive: true },
      description: "Available to you",
    },
    {
      title: "My Submissions",
      value: String(dashboard.mySubmissions),
      icon: Clock,
      trend: { value: 0, isPositive: true },
      description: "This semester",
    },
    {
      title: "Completion Rate",
      value: `${dashboard.completionRate}%`,
      icon: TrendingUp,
      trend: { value: 0, isPositive: true },
      description: "Above average",
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

      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {isLoading
          ? Array.from({ length: 3 }).map((_, index) => (
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

      <div className="grid gap-6 lg:grid-cols-2">
        <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900">
          <h2 className="mb-4 text-lg font-semibold text-slate-900 dark:text-slate-100">
            Quick Actions
          </h2>
          <div className="space-y-3">
            <button
              onClick={() => navigate("/cases")}
              className="w-full rounded-lg border border-slate-200 p-3 text-left transition-colors hover:bg-slate-50 dark:border-slate-700 dark:hover:bg-slate-800"
            >
              <div className="flex items-center gap-3">
                <Eye className="h-5 w-5 text-blue-600" />
                <div>
                  <div className="text-sm font-medium text-slate-900 dark:text-slate-100">
                    View Cases
                  </div>
                  <div className="text-xs text-slate-500 dark:text-slate-400">
                    Browse available case studies
                  </div>
                </div>
              </div>
            </button>

            <button
              onClick={() => navigate("/cases")}
              className="w-full rounded-lg border border-slate-200 p-3 text-left transition-colors hover:bg-slate-50 dark:border-slate-700 dark:hover:bg-slate-800"
            >
              <div className="flex items-center gap-3">
                <BookOpen className="h-5 w-5 text-emerald-600" />
                <div>
                  <div className="text-sm font-medium text-slate-900 dark:text-slate-100">
                    Submit Solutions
                  </div>
                  <div className="text-xs text-slate-500 dark:text-slate-400">
                    Open a case and submit your work
                  </div>
                </div>
              </div>
            </button>
          </div>
        </div>

        <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900">
          <h2 className="mb-4 text-lg font-semibold text-slate-900 dark:text-slate-100">
            Student Summary
          </h2>
          {isLoading ? (
            <div className="space-y-3 text-sm">
              {Array.from({ length: 3 }).map((_, index) => (
                <div key={index} className="flex justify-between">
                  <div className="h-4 w-24 animate-pulse rounded bg-slate-200 dark:bg-slate-700" />
                  <div className="h-4 w-10 animate-pulse rounded bg-slate-200 dark:bg-slate-700" />
                </div>
              ))}
            </div>
          ) : (
            <div className="space-y-3 text-sm">
              <div className="flex justify-between">
                <span className="text-slate-600 dark:text-slate-400">
                  Active Cases
                </span>
                <span className="font-medium text-slate-900 dark:text-slate-100">
                  {dashboard.activeCases}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-600 dark:text-slate-400">
                  Submitted
                </span>
                <span className="font-medium text-slate-900 dark:text-slate-100">
                  {dashboard.submitted}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-600 dark:text-slate-400">
                  Pending Review
                </span>
                <span className="font-medium text-slate-900 dark:text-slate-100">
                  {dashboard.pendingReview}
                </span>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default StudentDashboard;
