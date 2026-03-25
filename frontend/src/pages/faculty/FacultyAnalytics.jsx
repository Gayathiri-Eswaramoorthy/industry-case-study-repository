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
import { getAssignedStudents, getFacultyAnalytics } from "../../services/facultyService";
import KpiCard from "../../components/KpiCard";

export default function FacultyAnalytics() {
  const { data, isLoading, isError } = useQuery({
    queryKey: ["faculty-analytics"],
    queryFn: getFacultyAnalytics,
  });
  const {
    data: assignedStudents = [],
    isLoading: isLoadingStudents,
    isError: isStudentsError,
  } = useQuery({
    queryKey: ["faculty-assigned-students"],
    queryFn: getAssignedStudents,
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
  const approvedStudents = assignedStudents.filter((s) => s?.status === "APPROVED");
  const pendingStudents = assignedStudents.filter(
    (s) => s?.status === "PENDING" || s?.status === "PENDING_FACULTY_APPROVAL"
  );
  const rejectedStudents = assignedStudents.filter((s) => s?.status === "REJECTED");

  const statusBadgeClass = (status) => {
    if (status === "APPROVED") {
      return "border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-500/40 dark:bg-emerald-950/30 dark:text-emerald-300";
    }
    if (status === "REJECTED") {
      return "border-red-200 bg-red-50 text-red-700 dark:border-red-500/40 dark:bg-red-950/30 dark:text-red-300";
    }
    return "border-amber-200 bg-amber-50 text-amber-700 dark:border-amber-500/40 dark:bg-amber-950/30 dark:text-amber-300";
  };

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

      <section className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900">
        <h2 className="mb-2 text-sm font-semibold text-slate-800 dark:text-slate-100">
          Assigned Students
        </h2>
        <p className="mb-4 text-xs text-slate-500 dark:text-slate-400">
          Students mapped to you, grouped by approval status.
        </p>

        {isStudentsError && (
          <div className="mb-4 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-xs text-red-700 dark:border-red-500/30 dark:bg-red-950/30 dark:text-red-300">
            Unable to load assigned students.
          </div>
        )}

        <div className="mb-4 flex flex-wrap gap-2">
          <span className="rounded-full border border-slate-200 bg-slate-50 px-2.5 py-1 text-xs font-semibold text-slate-700 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200">
            Total: {assignedStudents.length}
          </span>
          <span className="rounded-full border border-emerald-200 bg-emerald-50 px-2.5 py-1 text-xs font-semibold text-emerald-700 dark:border-emerald-500/40 dark:bg-emerald-950/30 dark:text-emerald-300">
            Approved: {approvedStudents.length}
          </span>
          <span className="rounded-full border border-amber-200 bg-amber-50 px-2.5 py-1 text-xs font-semibold text-amber-700 dark:border-amber-500/40 dark:bg-amber-950/30 dark:text-amber-300">
            Pending: {pendingStudents.length}
          </span>
          <span className="rounded-full border border-red-200 bg-red-50 px-2.5 py-1 text-xs font-semibold text-red-700 dark:border-red-500/40 dark:bg-red-950/30 dark:text-red-300">
            Rejected: {rejectedStudents.length}
          </span>
        </div>

        {isLoadingStudents ? (
          <div className="space-y-2">
            {Array.from({ length: 5 }).map((_, idx) => (
              <div key={idx} className="h-10 animate-pulse rounded bg-slate-200 dark:bg-slate-800" />
            ))}
          </div>
        ) : assignedStudents.length === 0 ? (
          <div className="rounded-lg border border-dashed border-slate-300 px-4 py-5 text-sm text-slate-500 dark:border-slate-700 dark:text-slate-400">
            No students are assigned to you yet.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full text-sm">
              <thead className="bg-slate-50 dark:bg-slate-800/50">
                <tr>
                  <th className="px-3 py-2 text-left text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">
                    Student
                  </th>
                  <th className="px-3 py-2 text-left text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">
                    Email
                  </th>
                  <th className="px-3 py-2 text-left text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">
                    Status
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {assignedStudents.map((student) => (
                  <tr key={student.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/40">
                    <td className="px-3 py-2 font-medium text-slate-800 dark:text-slate-100">{student.fullName}</td>
                    <td className="px-3 py-2 text-slate-600 dark:text-slate-300">{student.email}</td>
                    <td className="px-3 py-2">
                      <span className={`inline-flex rounded-full border px-2.5 py-1 text-xs font-semibold ${statusBadgeClass(student.status)}`}>
                        {student.status === "PENDING_FACULTY_APPROVAL" ? "PENDING" : student.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

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
