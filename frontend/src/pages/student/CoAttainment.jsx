import { useContext, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import {
  Cell,
  Legend,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
} from "recharts";
import { BarChart3, Target } from "lucide-react";
import { AuthContext } from "../../context/AuthContext";
import { getStudentCoAttainment } from "../../services/studentAttainmentService";
import { getUserFromToken } from "../../utils/tokenUtils";

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

function CoAttainment() {
  const navigate = useNavigate();
  const { user } = useContext(AuthContext);
  const tokenUser = getUserFromToken();
  const studentId = user?.id ?? tokenUser?.id ?? null;

  const {
    data: attainmentRows = [],
    isLoading,
    isError,
  } = useQuery({
    queryKey: ["student-co-attainment", studentId],
    queryFn: () => getStudentCoAttainment(studentId),
    enabled: Boolean(studentId),
  });

  const summaryData = useMemo(() => {
    const counts = attainmentRows.reduce(
      (accumulator, row) => {
        const status = row.attainmentStatus;
        if (status && accumulator[status] != null) {
          accumulator[status] += 1;
        }
        return accumulator;
      },
      {
        ATTAINED: 0,
        PARTIAL: 0,
        NOT_ATTAINED: 0,
      },
    );

    return Object.entries(counts).map(([status, value]) => ({
      name: STATUS_STYLES[status].label,
      value,
      color: STATUS_STYLES[status].color,
    }));
  }, [attainmentRows]);

  const hasRows = attainmentRows.length > 0;

  if (!studentId) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-semibold text-slate-900 dark:text-slate-100">
            CO Attainment Report
          </h1>
          <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
            Review your evaluated course outcome attainment.
          </p>
        </div>

        <div className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800 dark:border-amber-500/30 dark:bg-amber-500/10 dark:text-amber-200">
          Your session does not include a student id. Sign out and sign back in
          to refresh the authentication token.
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold text-slate-900 dark:text-slate-100">
            CO Attainment Report
          </h1>
          <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
            See how your evaluated case-study performance maps to course outcomes.
          </p>
        </div>
        <span className="inline-flex items-center gap-2 rounded-full bg-slate-100 px-3 py-1 text-xs font-medium text-slate-600 dark:bg-slate-800 dark:text-slate-300">
          <Target className="h-3.5 w-3.5" />
          Student View
        </span>
      </div>

      <div className="grid gap-6 lg:grid-cols-[1.6fr_1fr]">
        <section className="rounded-2xl border border-slate-200 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900">
          <div className="border-b border-slate-200 px-6 py-4 dark:border-slate-800">
            <h2 className="text-sm font-semibold text-slate-900 dark:text-slate-100">
              Outcome Details
            </h2>
          </div>

          <div className="p-6">
            {isLoading ? (
              <div className="space-y-3">
                {Array.from({ length: 5 }).map((_, index) => (
                  <div
                    key={index}
                    className="h-14 animate-pulse rounded-xl bg-slate-100 dark:bg-slate-800"
                  />
                ))}
              </div>
            ) : isError ? (
              <div className="rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700 dark:border-rose-500/30 dark:bg-rose-500/10 dark:text-rose-200">
                Failed to load the attainment report.
              </div>
            ) : !hasRows ? (
              <div className="rounded-xl border border-dashed border-slate-300 bg-slate-50 px-8 py-10 text-center dark:border-slate-700 dark:bg-slate-950/60">
                <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-slate-200 text-slate-500 dark:bg-slate-800 dark:text-slate-300">
                  <BarChart3 className="h-6 w-6" />
                </div>
                <h3 className="text-sm font-semibold text-slate-800 dark:text-slate-100">
                  No evaluated submissions yet
                </h3>
                <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">
                  Your CO attainment report will appear after faculty evaluate your
                  case submissions.
                </p>
                <button
                  onClick={() => navigate("/student/submissions")}
                  className="mt-4 rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-blue-700"
                >
                  View My Submissions
                </button>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-slate-200 dark:divide-slate-800">
                  <thead>
                    <tr className="text-left">
                      <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">
                        CO Code
                      </th>
                      <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">
                        Description
                      </th>
                      <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">
                        Score
                      </th>
                      <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">
                        Attainment
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                    {attainmentRows.map((row, index) => {
                      const style = STATUS_STYLES[row.attainmentStatus] ?? STATUS_STYLES.NOT_ATTAINED;

                      return (
                        <tr
                          key={`${row.courseOutcomeId}-${index}`}
                          className="transition hover:bg-slate-50/80 dark:hover:bg-slate-800/40"
                        >
                          <td className="px-4 py-4 text-sm font-semibold text-slate-900 dark:text-slate-100">
                            {row.courseOutcomeCode}
                          </td>
                          <td className="px-4 py-4 text-sm text-slate-600 dark:text-slate-300">
                            {row.courseOutcomeDescription}
                          </td>
                          <td className="px-4 py-4 text-sm font-medium text-slate-900 dark:text-slate-100">
                            {row.score}
                          </td>
                          <td className="px-4 py-4">
                            <span
                              className={`inline-flex rounded-full px-2.5 py-1 text-xs font-semibold ring-1 ring-inset ${style.badge}`}
                            >
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
            Attainment Summary
          </h2>
          <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
            Distribution across evaluated CO mappings.
          </p>

          <div className="mt-6 h-72">
            {isLoading ? (
              <div className="h-full animate-pulse rounded-2xl bg-slate-100 dark:bg-slate-800" />
            ) : !hasRows ? (
              <div className="flex h-full items-center justify-center rounded-2xl border border-dashed border-slate-300 text-sm text-slate-500 dark:border-slate-700 dark:text-slate-400">
                No chart data available
              </div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={summaryData}
                    dataKey="value"
                    nameKey="name"
                    innerRadius={58}
                    outerRadius={88}
                    paddingAngle={4}
                  >
                    {summaryData.map((entry) => (
                      <Cell key={entry.name} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip
                    formatter={(value, name) => [`${value}`, name]}
                    contentStyle={{
                      borderRadius: "12px",
                      border: "1px solid #cbd5e1",
                      backgroundColor: "#ffffff",
                    }}
                  />
                  <Legend verticalAlign="bottom" height={36} />
                </PieChart>
              </ResponsiveContainer>
            )}
          </div>

          <div className="mt-4 space-y-3">
            {summaryData.map((item) => (
              <div
                key={item.name}
                className="flex items-center justify-between rounded-xl bg-slate-50 px-4 py-3 dark:bg-slate-800/70"
              >
                <div className="flex items-center gap-3">
                  <span
                    className="h-3 w-3 rounded-full"
                    style={{ backgroundColor: item.color }}
                  />
                  <span className="text-sm text-slate-600 dark:text-slate-300">
                    {item.name}
                  </span>
                </div>
                <span className="text-sm font-semibold text-slate-900 dark:text-slate-100">
                  {item.value}
                </span>
              </div>
            ))}
          </div>
        </section>
      </div>
    </div>
  );
}

export default CoAttainment;
