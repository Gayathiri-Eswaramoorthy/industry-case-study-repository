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

  if (isLoading) {
    return (
      <div className="text-sm text-slate-600 dark:text-slate-300">
        Loading analytics...
      </div>
    );
  }

  if (isError) {
    return (
      <div className="rounded-md border border-red-200 bg-red-50 p-4 text-sm text-red-700 dark:border-red-900 dark:bg-red-950/30 dark:text-red-300">
        Unable to load faculty analytics.
      </div>
    );
  }

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
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100">
          Faculty Analytics
        </h1>
        <p className="text-sm text-slate-500 dark:text-slate-400">
          Submission and evaluation insights across your cases.
        </p>
      </div>

      <div className="grid grid-cols-1 gap-6 md:grid-cols-2 xl:grid-cols-4">
        <KpiCard
          title="Total Submissions"
          value={safeData.totalSubmissions}
          icon={<ClipboardList className="h-5 w-5" />}
        />
        <KpiCard
          title="Evaluated Submissions"
          value={safeData.evaluatedSubmissions}
          icon={<CheckCircle2 className="h-5 w-5" />}
        />
        <KpiCard
          title="Pending Submissions"
          value={safeData.pendingSubmissions}
          icon={<Clock3 className="h-5 w-5" />}
        />
        <KpiCard
          title="Evaluation Completion Rate"
          value={`${safeData.evaluationCompletionRate.toFixed(1)}%`}
          icon={<Percent className="h-5 w-5" />}
        />
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900">
          <h2 className="mb-2 text-sm font-semibold text-slate-800 dark:text-slate-100">
            Submissions per Case Chart
          </h2>
          <div className="h-[300px] w-full">
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={safeData.submissionsPerCase}>
                <XAxis dataKey="caseTitle" />
                <YAxis allowDecimals={false} />
                <Tooltip />
                <Bar dataKey="count" fill="#3b82f6" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900">
          <h2 className="mb-2 text-sm font-semibold text-slate-800 dark:text-slate-100">
            Evaluation Completion Rate
          </h2>
          <div className="h-[300px] w-full">
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie data={statusPieData} dataKey="value" outerRadius={100} label>
                  {statusPieData.map((entry, index) => (
                    <Cell
                      key={entry.name}
                      fill={pieColors[index % pieColors.length]}
                    />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </div>
  );
}
