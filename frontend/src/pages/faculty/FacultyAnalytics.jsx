import { useQuery } from "@tanstack/react-query";
import {
  Bar,
  BarChart,
  Cell,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import {
  CheckCircle2,
  ClipboardList,
  Clock3,
  Percent,
} from "lucide-react";
import { getFacultyAnalytics } from "../../services/facultyService";
import KpiCard from "../../components/KpiCard";

export default function FacultyAnalytics() {
  const { data, isLoading, isError } = useQuery({
    queryKey: ["faculty-analytics"],
    queryFn: getFacultyAnalytics,
  });

  const safeData = {
    totalSubmissions: data?.totalSubmissions ?? 0,
    evaluatedSubmissions: data?.evaluatedSubmissions ?? 0,
    pendingSubmissions: data?.pendingSubmissions ?? 0,
    evaluationCompletionRate: data?.evaluationCompletionRate ?? 0,
    submissionsPerCase: Array.isArray(data?.submissionsPerCase)
      ? data.submissionsPerCase
      : [],
  };

  const statusPieData = [
    { name: "Evaluated", value: safeData.evaluatedSubmissions },
    { name: "Pending", value: safeData.pendingSubmissions },
  ];

  const pieColors = ["#10b981", "#f59e0b"];

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold tracking-tight text-slate-800 dark:text-slate-100">
          Faculty Analytics
        </h1>
        <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
          Submission and evaluation insights across your cases.
        </p>
      </div>

      {isError && (
        <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700 dark:border-red-500/30 dark:bg-red-950/30 dark:text-red-300">
          Unable to load faculty analytics.
        </div>
      )}

      <div className="grid grid-cols-1 gap-5 md:grid-cols-2 xl:grid-cols-4">
        {isLoading ? (
          Array.from({ length: 4 }).map((_, index) => (
            <KpiCard
              key={index}
              title={
                index === 0
                  ? "Total Submissions"
                  : index === 1
                  ? "Evaluated"
                  : index === 2
                  ? "Pending"
                  : "Completion Rate"
              }
              icon={
                index === 0 ? (
                  <ClipboardList className="h-5 w-5" />
                ) : index === 1 ? (
                  <CheckCircle2 className="h-5 w-5" />
                ) : index === 2 ? (
                  <Clock3 className="h-5 w-5" />
                ) : (
                  <Percent className="h-5 w-5" />
                )
              }
              loading
            />
          ))
        ) : (
          <>
            <KpiCard
              title="Total Submissions"
              value={safeData.totalSubmissions}
              icon={<ClipboardList className="h-5 w-5" />}
              description="Across all your cases"
            />
            <KpiCard
              title="Evaluated"
              value={safeData.evaluatedSubmissions}
              icon={<CheckCircle2 className="h-5 w-5" />}
              description="Marked complete"
            />
            <KpiCard
              title="Pending"
              value={safeData.pendingSubmissions}
              icon={<Clock3 className="h-5 w-5" />}
              description="Awaiting your review"
            />
            <KpiCard
              title="Completion Rate"
              value={`${safeData.evaluationCompletionRate.toFixed(1)}%`}
              icon={<Percent className="h-5 w-5" />}
              description="Evaluation progress"
            />
          </>
        )}
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900">
          <h2 className="mb-2 text-sm font-semibold text-slate-800 dark:text-slate-100">
            Submissions per Case
          </h2>
          <p className="mb-4 text-xs text-slate-500 dark:text-slate-400">Case-level submission volume.</p>
          <div className="h-[300px] w-full">
            {isLoading ? (
              <div className="h-full animate-pulse rounded bg-slate-200 dark:bg-slate-800" />
            ) : (
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={safeData.submissionsPerCase}>
                  <XAxis dataKey="caseTitle" stroke="#64748b" />
                  <YAxis allowDecimals={false} stroke="#64748b" />
                  <Tooltip />
                  <Bar dataKey="count" fill="#0f172a" radius={[8, 8, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>

        <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900">
          <h2 className="mb-2 text-sm font-semibold text-slate-800 dark:text-slate-100">
            Evaluation Completion
          </h2>
          <p className="mb-4 text-xs text-slate-500 dark:text-slate-400">Evaluated vs pending distribution.</p>
          <div className="h-[300px] w-full">
            {isLoading ? (
              <div className="h-full animate-pulse rounded bg-slate-200 dark:bg-slate-800" />
            ) : (
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie data={statusPieData} dataKey="value" outerRadius={100} label>
                    {statusPieData.map((entry, index) => (
                      <Cell key={entry.name} fill={pieColors[index % pieColors.length]} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
