import { useQuery } from "@tanstack/react-query";
import {
  BarChart3,
  BarChartBig,
  ClipboardCheck,
  FolderKanban,
} from "lucide-react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import KpiCard from "../../components/KpiCard";
import ActivityFeed from "../../components/ActivityFeed";
import { getFacultyDashboard } from "../../services/facultyDashboardService";

function FacultyDashboard() {
  const { data, isLoading, isError } = useQuery({
    queryKey: ["faculty-dashboard"],
    queryFn: getFacultyDashboard,
  });

  const stats = {
    totalCases: data?.totalCases ?? 0,
    pendingReviews: data?.pendingReviews ?? 0,
    evaluatedSubmissions: data?.evaluatedSubmissions ?? 0,
    activeCases: data?.activeCases ?? 0,
  };

  const chartData = [
    { name: "Pending", value: stats.pendingReviews },
    { name: "Evaluated", value: stats.evaluatedSubmissions },
  ];

  if (isError) {
    return (
      <div className="bg-red-900 text-red-300 p-4 rounded">
        Unable to load faculty dashboard metrics. Please try again.
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-slate-900 dark:text-slate-100">
          Faculty Dashboard
        </h1>
        <p className="text-sm text-slate-500 dark:text-slate-400">
          Track your case studies and evaluate student submissions.
        </p>
      </div>

      <div className="grid grid-cols-1 gap-6 md:grid-cols-2 xl:grid-cols-4">
        {isLoading ? (
          <>
            <KpiCard loading />
            <KpiCard loading />
            <KpiCard loading />
            <KpiCard loading />
          </>
        ) : (
          <>
            <KpiCard
              title="Total Cases Created"
              value={stats.totalCases}
              icon={<FolderKanban className="h-5 w-5" />}
            />
            <KpiCard
              title="Pending Reviews"
              value={stats.pendingReviews}
              icon={<ClipboardCheck className="h-5 w-5" />}
            />
            <KpiCard
              title="Evaluated Submissions"
              value={stats.evaluatedSubmissions}
              icon={<BarChart3 className="h-5 w-5" />}
            />
            <KpiCard
              title="Active Cases"
              value={stats.activeCases}
              icon={<BarChartBig className="h-5 w-5" />}
            />
          </>
        )}
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900">
          <h2 className="mb-4 text-sm font-semibold text-slate-800 dark:text-slate-100">
            Submission Status
          </h2>
          {isLoading ? (
            <div className="h-72 animate-pulse rounded bg-slate-200 dark:bg-slate-800" />
          ) : (
            <div className="w-full h-80">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={chartData}>
                  <CartesianGrid
                    strokeDasharray="3 3"
                    stroke="rgb(148 163 184 / 0.25)"
                  />
                  <XAxis dataKey="name" stroke="#94a3b8" />
                  <YAxis allowDecimals={false} stroke="#94a3b8" />
                  <Tooltip />
                  <Bar dataKey="value" radius={[8, 8, 0, 0]} fill="#38bdf8" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}
        </div>

        <div>
          <ActivityFeed maxItems={6} />
        </div>
      </div>
    </div>
  );
}

export default FacultyDashboard;
