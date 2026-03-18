import { useContext, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import {
  Bar,
  BarChart,
  Cell,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { AuthContext } from "../../context/AuthContext";
import { getStudentPoAttainment } from "../../services/studentAttainmentService";

const STATUS_STYLES = {
  ATTAINED: {
    label: "Attained",
    badge: "bg-emerald-100 text-emerald-700 ring-emerald-200 dark:bg-emerald-500/10 dark:text-emerald-300 dark:ring-emerald-500/30",
    color: "#10b981",
  },
  PARTIAL: {
    label: "Partial",
    badge: "bg-amber-100 text-amber-700 ring-amber-200 dark:bg-amber-500/10 dark:text-amber-300 dark:ring-amber-500/30",
    color: "#f59e0b",
  },
  NOT_ATTAINED: {
    label: "Not Attained",
    badge: "bg-rose-100 text-rose-700 ring-rose-200 dark:bg-rose-500/10 dark:text-rose-300 dark:ring-rose-500/30",
    color: "#ef4444",
  },
};

function PoAttainment() {
  const { user } = useContext(AuthContext);
  const studentId = user?.id;

  const {
    data: rows = [],
    isLoading,
    isError,
  } = useQuery({
    queryKey: ["student-po-attainment", studentId],
    queryFn: () => getStudentPoAttainment(studentId),
    enabled: Boolean(studentId),
  });

  const chartData = useMemo(
    () =>
      rows.map((row) => ({
        code: row.programOutcomeCode,
        score: row.averageScore,
        color: STATUS_STYLES[row.attainmentStatus]?.color ?? STATUS_STYLES.NOT_ATTAINED.color,
      })),
    [rows],
  );

  if (!studentId) {
    return (
      <div className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800 dark:border-amber-500/30 dark:bg-amber-500/10 dark:text-amber-200">
        Your session does not include a student id. Sign out and sign back in to refresh the authentication token.
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-slate-900 dark:text-slate-100">
          PO Attainment Report
        </h1>
        <p className="text-sm text-slate-500 dark:text-slate-400">
          Track your program-outcome attainment based on evaluated submissions.
        </p>
      </div>

      <div className="grid gap-6 lg:grid-cols-[1.5fr_1fr]">
        <section className="rounded-2xl border border-slate-200 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900">
          <div className="border-b border-slate-200 px-6 py-4 dark:border-slate-800">
            <h2 className="text-sm font-semibold text-slate-900 dark:text-slate-100">
              Program Outcome Details
            </h2>
          </div>

          <div className="p-6">
            {isLoading ? (
              <div className="space-y-3">
                {Array.from({ length: 5 }).map((_, index) => (
                  <div key={index} className="h-14 animate-pulse rounded-xl bg-slate-100 dark:bg-slate-800" />
                ))}
              </div>
            ) : isError ? (
              <div className="rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700 dark:border-rose-500/30 dark:bg-rose-500/10 dark:text-rose-200">
                Failed to load the PO attainment report.
              </div>
            ) : rows.length === 0 ? (
              <div className="rounded-xl border border-dashed border-slate-300 px-6 py-10 text-center text-sm text-slate-500 dark:border-slate-700 dark:text-slate-400">
                No PO attainment data available yet.
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-slate-200 dark:divide-slate-800">
                  <thead>
                    <tr>
                      <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">
                        PO Code
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">
                        Description
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">
                        Average Score
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">
                        Attainment
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                    {rows.map((row) => {
                      const style = STATUS_STYLES[row.attainmentStatus] ?? STATUS_STYLES.NOT_ATTAINED;

                      return (
                        <tr key={row.programOutcomeId} className="hover:bg-slate-50 dark:hover:bg-slate-800/40">
                          <td className="px-4 py-4 text-sm font-semibold text-slate-900 dark:text-slate-100">
                            {row.programOutcomeCode}
                          </td>
                          <td className="px-4 py-4 text-sm text-slate-600 dark:text-slate-300">
                            {row.programOutcomeDescription}
                          </td>
                          <td className="px-4 py-4 text-sm font-medium text-slate-900 dark:text-slate-100">
                            {row.averageScore}
                          </td>
                          <td className="px-4 py-4">
                            <span className={`inline-flex rounded-full px-2.5 py-1 text-xs font-semibold ring-1 ring-inset ${style.badge}`}>
                              {style.label}
                            </span>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </section>

        <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900">
          <h2 className="text-sm font-semibold text-slate-900 dark:text-slate-100">
            Attainment by PO
          </h2>
          <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
            Average attainment score grouped by program outcome.
          </p>

          <div className="mt-6 h-80">
            {isLoading ? (
              <div className="h-full animate-pulse rounded-2xl bg-slate-100 dark:bg-slate-800" />
            ) : rows.length === 0 ? (
              <div className="flex h-full items-center justify-center rounded-2xl border border-dashed border-slate-300 text-sm text-slate-500 dark:border-slate-700 dark:text-slate-400">
                No chart data available
              </div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={chartData}>
                  <XAxis dataKey="code" stroke="#94a3b8" />
                  <YAxis domain={[0, 100]} stroke="#94a3b8" />
                  <Tooltip />
                  <Bar dataKey="score" radius={[8, 8, 0, 0]}>
                    {chartData.map((entry) => (
                      <Cell key={entry.code} fill={entry.color} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            )}
          </div>
        </section>
      </div>
    </div>
  );
}

export default PoAttainment;
