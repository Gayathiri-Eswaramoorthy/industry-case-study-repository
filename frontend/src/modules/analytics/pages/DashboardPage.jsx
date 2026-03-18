import { useContext } from "react";
import { useQuery } from "@tanstack/react-query";
import { Navigate } from "react-router-dom";
import {
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Tooltip,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
} from "recharts";
import { ChevronDown } from "lucide-react";
import analyticsService from "../services/analyticsService";
import { AuthContext } from "../../../context/AuthContext";
import { exportCsv } from "../../../utils/exportCsv";

const CASE_COLORS = {
  publishedCases: "#10b981",
  draftCases: "#f59e0b",
  archivedCases: "#64748b",
};

const USER_COLORS = {
  students: "#6366f1",
  activeFaculty: "#10b981",
  admins: "#f59e0b",
};

const SUBMISSION_COLORS = {
  submitted: "#3b82f6",
  underReview: "#f59e0b",
  evaluated: "#10b981",
};

function chartTooltipStyle() {
  return {
    borderRadius: 10,
    border: "1px solid #cbd5e1",
    backgroundColor: "#ffffff",
    color: "#0f172a",
  };
}

function averageBadgeClass(score) {
  if (score >= 60) {
    return "border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-500/40 dark:bg-emerald-950/30 dark:text-emerald-300";
  }
  if (score >= 40) {
    return "border-amber-200 bg-amber-50 text-amber-700 dark:border-amber-500/40 dark:bg-amber-950/30 dark:text-amber-300";
  }
  return "border-red-200 bg-red-50 text-red-700 dark:border-red-500/40 dark:bg-red-950/30 dark:text-red-300";
}

function coBarColor(score) {
  if (score >= 60) return "#10b981";
  if (score >= 40) return "#f59e0b";
  return "#ef4444";
}

function DashboardPage() {
  const { role } = useContext(AuthContext);

  const {
    data: dashboardStats,
    isError: dashboardError,
  } = useQuery({
    queryKey: ["analytics-dashboard"],
    queryFn: () => analyticsService.getDashboardStats(),
    enabled: role === "ADMIN",
  });

  const {
    data: caseAnalytics,
    isLoading: isLoadingCases,
    isError: isCasesError,
  } = useQuery({
    queryKey: ["admin-case-analytics"],
    queryFn: () => analyticsService.getCaseAnalytics(),
    enabled: role === "ADMIN",
  });

  const {
    data: userAnalytics,
    isLoading: isLoadingUsers,
    isError: isUsersError,
  } = useQuery({
    queryKey: ["admin-user-analytics"],
    queryFn: () => analyticsService.getUserAnalytics(),
    enabled: role === "ADMIN",
  });

  const {
    data: submissionAnalytics,
    isLoading: isLoadingSubmissions,
    isError: isSubmissionsError,
  } = useQuery({
    queryKey: ["admin-submission-analytics"],
    queryFn: () => analyticsService.getSubmissionAnalytics(),
    enabled: role === "ADMIN",
  });

  const {
    data: coSummary = [],
    isLoading: isLoadingCoSummary,
    isError: isCoSummaryError,
  } = useQuery({
    queryKey: ["admin-co-attainment-summary"],
    queryFn: () => analyticsService.getCoAttainmentSummary(),
    enabled: role === "ADMIN",
  });

  const {
    data: topCases = [],
    isLoading: isLoadingTopCases,
    isError: isTopCasesError,
  } = useQuery({
    queryKey: ["admin-top-cases"],
    queryFn: () => analyticsService.getTopCases(),
    enabled: role === "ADMIN",
  });

  if (role !== "ADMIN") {
    return <Navigate to="/dashboard" replace />;
  }

  const lastUpdated = new Date().toLocaleTimeString();

  const caseStatusData = [
    {
      key: "publishedCases",
      label: "Published",
      value: Number(caseAnalytics?.publishedCases ?? 0),
      fill: CASE_COLORS.publishedCases,
    },
    {
      key: "draftCases",
      label: "Draft",
      value: Number(caseAnalytics?.draftCases ?? 0),
      fill: CASE_COLORS.draftCases,
    },
    {
      key: "archivedCases",
      label: "Archived",
      value: Number(caseAnalytics?.archivedCases ?? 0),
      fill: CASE_COLORS.archivedCases,
    },
  ];
  const caseTotal = caseStatusData.reduce((sum, item) => sum + item.value, 0);

  const userCompositionData = [
    { name: "Students", value: Number(userAnalytics?.students ?? 0), fill: USER_COLORS.students },
    { name: "Faculty", value: Number(userAnalytics?.activeFaculty ?? 0), fill: USER_COLORS.activeFaculty },
    { name: "Admins", value: Number(userAnalytics?.admins ?? 0), fill: USER_COLORS.admins },
  ];

  const submissionData = [
    { name: "Submitted", value: Number(submissionAnalytics?.submitted ?? 0), fill: SUBMISSION_COLORS.submitted },
    { name: "Under Review", value: Number(submissionAnalytics?.underReview ?? 0), fill: SUBMISSION_COLORS.underReview },
    { name: "Evaluated", value: Number(submissionAnalytics?.evaluated ?? 0), fill: SUBMISSION_COLORS.evaluated },
  ];

  const coChartData = coSummary.map((item) => ({
    coCode: item.coCode,
    averageScore: Number(item.averageScore ?? 0),
    attainedCount: Number(item.attainedCount ?? 0),
    totalCount: Number(item.totalCount ?? 0),
  }));

  const handleExport = () => {
    const rows = [
      ["Dataset", "Metric", "Value"],
      ["Dashboard", "Total Users", dashboardStats?.totalUsers ?? 0],
      ["Dashboard", "Total Cases", dashboardStats?.totalCases ?? 0],
      ["Dashboard", "Total Submissions", dashboardStats?.totalSubmissions ?? 0],
      ["Dashboard", "Active Cases", dashboardStats?.activeCases ?? 0],
      ["Dashboard", "Pending Reviews", dashboardStats?.pendingReviews ?? 0],
      ["Dashboard", "Active Faculty", dashboardStats?.activeFaculty ?? 0],
      ["Cases", "Published", caseAnalytics?.publishedCases ?? 0],
      ["Cases", "Draft", caseAnalytics?.draftCases ?? 0],
      ["Cases", "Archived", caseAnalytics?.archivedCases ?? 0],
      ["Users", "Students", userAnalytics?.students ?? 0],
      ["Users", "Faculty", userAnalytics?.activeFaculty ?? 0],
      ["Users", "Admins", userAnalytics?.admins ?? 0],
      ["Submissions", "Submitted", submissionAnalytics?.submitted ?? 0],
      ["Submissions", "Under Review", submissionAnalytics?.underReview ?? 0],
      ["Submissions", "Evaluated", submissionAnalytics?.evaluated ?? 0],
      ["CO Summary", "CO", "Average Score"],
    ];

    coSummary.forEach((co) => {
      rows.push(["CO Summary", co.coCode, co.averageScore]);
    });

    rows.push(["Top Cases", "Case Title", "Average Score"]);
    topCases.forEach((c) => {
      rows.push(["Top Cases", c.caseTitle, c.averageScore]);
    });

    exportCsv("platform-analytics-report.csv", rows);
  };

  const hasTopLevelError = dashboardError || isCasesError || isUsersError || isSubmissionsError;

  return (
    <div className="space-y-8">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-slate-900 dark:text-slate-100">Platform Analytics</h1>
          <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">Data insights and performance trends</p>
          <p className="mt-2 text-xs text-slate-400 dark:text-slate-500">Last updated: {lastUpdated}</p>
        </div>
        <button
          type="button"
          onClick={handleExport}
          className="inline-flex items-center gap-2 rounded-lg bg-slate-900 px-4 py-2 text-sm font-medium text-white transition hover:bg-slate-700 dark:bg-slate-100 dark:text-slate-900 dark:hover:bg-slate-300"
        >
          Export CSV
          <ChevronDown className="h-4 w-4" />
        </button>
      </div>

      {hasTopLevelError && (
        <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700 dark:border-red-500/30 dark:bg-red-950/30 dark:text-red-300">
          Some analytics data could not be loaded.
        </div>
      )}

      <section className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900">
          <h2 className="mb-4 text-sm font-semibold text-slate-800 dark:text-slate-100">Case Status Breakdown</h2>
          {isLoadingCases ? (
            <div className="h-[250px] animate-pulse rounded bg-slate-200 dark:bg-slate-800" />
          ) : caseTotal === 0 ? (
            <div className="flex h-[250px] items-center justify-center rounded border border-dashed border-slate-300 text-sm text-slate-500 dark:border-slate-700 dark:text-slate-400">
              No case data yet
            </div>
          ) : (
            <>
              <div className="h-[250px]">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={caseStatusData}
                      dataKey="value"
                      nameKey="label"
                      innerRadius={60}
                      outerRadius={90}
                      paddingAngle={3}
                    >
                      {caseStatusData.map((item) => (
                        <Cell key={item.key} fill={item.fill} />
                      ))}
                    </Pie>
                    <Tooltip contentStyle={chartTooltipStyle()} />
                  </PieChart>
                </ResponsiveContainer>
              </div>
              <div className="mt-3 space-y-2">
                {caseStatusData.map((item) => (
                  <div key={item.key} className="flex items-center justify-between text-xs">
                    <span className="inline-flex items-center gap-2 text-slate-600 dark:text-slate-300">
                      <span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: item.fill }} />
                      {item.label}
                    </span>
                    <span className="font-semibold text-slate-800 dark:text-slate-100">{item.value}</span>
                  </div>
                ))}
              </div>
            </>
          )}
        </div>

        <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900">
          <h2 className="mb-4 text-sm font-semibold text-slate-800 dark:text-slate-100">User Composition</h2>
          {isLoadingUsers ? (
            <div className="h-[250px] animate-pulse rounded bg-slate-200 dark:bg-slate-800" />
          ) : (
            <div className="h-[250px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={userCompositionData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                  <XAxis dataKey="name" tick={{ fill: "#64748b", fontSize: 12 }} axisLine={false} tickLine={false} />
                  <YAxis allowDecimals={false} tick={{ fill: "#64748b", fontSize: 12 }} axisLine={false} tickLine={false} />
                  <Tooltip contentStyle={chartTooltipStyle()} />
                  <Bar dataKey="value" radius={[6, 6, 0, 0]}>
                    {userCompositionData.map((entry) => (
                      <Cell key={entry.name} fill={entry.fill} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}
        </div>

        <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900">
          <h2 className="mb-4 text-sm font-semibold text-slate-800 dark:text-slate-100">Submission Pipeline</h2>
          {isLoadingSubmissions ? (
            <div className="h-[250px] animate-pulse rounded bg-slate-200 dark:bg-slate-800" />
          ) : (
            <div className="h-[250px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={submissionData} layout="vertical">
                  <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                  <XAxis type="number" allowDecimals={false} tick={{ fill: "#64748b", fontSize: 12 }} axisLine={false} tickLine={false} />
                  <YAxis type="category" dataKey="name" tick={{ fill: "#64748b", fontSize: 12 }} axisLine={false} tickLine={false} />
                  <Tooltip contentStyle={chartTooltipStyle()} />
                  <Bar dataKey="value" radius={[0, 6, 6, 0]}>
                    {submissionData.map((entry) => (
                      <Cell key={entry.name} fill={entry.fill} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}
        </div>
      </section>

      <section className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900">
        <h2 className="mb-4 text-sm font-semibold text-slate-800 dark:text-slate-100">
          CO Attainment Platform Overview
        </h2>
        {isLoadingCoSummary ? (
          <div className="h-[250px] animate-pulse rounded bg-slate-200 dark:bg-slate-800" />
        ) : isCoSummaryError ? (
          <div className="flex h-[250px] items-center justify-center rounded border border-dashed border-red-300 text-sm text-red-600 dark:border-red-500/40 dark:text-red-300">
            Unable to load CO attainment summary
          </div>
        ) : coChartData.length === 0 ? (
          <div className="flex h-[250px] items-center justify-center rounded border border-dashed border-slate-300 text-sm text-slate-500 dark:border-slate-700 dark:text-slate-400">
            No evaluated submissions yet
          </div>
        ) : (
          <div className="h-[250px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={coChartData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                <XAxis dataKey="coCode" tick={{ fill: "#64748b", fontSize: 12 }} axisLine={false} tickLine={false} />
                <YAxis allowDecimals={false} tick={{ fill: "#64748b", fontSize: 12 }} axisLine={false} tickLine={false} />
                <Tooltip
                  contentStyle={chartTooltipStyle()}
                  formatter={(value) => [`${value}%`, "Average Score"]}
                />
                <Bar dataKey="averageScore" radius={[6, 6, 0, 0]}>
                  {coChartData.map((entry) => (
                    <Cell key={entry.coCode} fill={coBarColor(entry.averageScore)} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        )}
      </section>

      <section className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900">
        <h2 className="mb-4 text-sm font-semibold text-slate-800 dark:text-slate-100">Top Performing Cases</h2>
        {isLoadingTopCases ? (
          <div className="space-y-2">
            {Array.from({ length: 5 }).map((_, idx) => (
              <div key={idx} className="h-10 animate-pulse rounded bg-slate-200 dark:bg-slate-800" />
            ))}
          </div>
        ) : isTopCasesError ? (
          <div className="rounded border border-dashed border-red-300 px-4 py-5 text-sm text-red-600 dark:border-red-500/40 dark:text-red-300">
            Unable to load top case analytics
          </div>
        ) : topCases.length === 0 ? (
          <div className="rounded border border-dashed border-slate-300 px-4 py-5 text-sm text-slate-500 dark:border-slate-700 dark:text-slate-400">
            No evaluated submissions yet
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full text-sm">
              <thead className="bg-slate-50 dark:bg-slate-800/50">
                <tr>
                  <th className="px-3 py-2 text-left text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">
                    Case Title
                  </th>
                  <th className="px-3 py-2 text-left text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">
                    Submissions
                  </th>
                  <th className="px-3 py-2 text-left text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">
                    Avg Score
                  </th>
                  <th className="px-3 py-2 text-left text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">
                    Top Score
                  </th>
                  <th className="px-3 py-2 text-left text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">
                    Attainment
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {topCases.map((item) => (
                  <tr key={item.caseId} className="hover:bg-slate-50 dark:hover:bg-slate-800/40">
                    <td className="px-3 py-2 font-medium text-slate-800 dark:text-slate-100">{item.caseTitle}</td>
                    <td className="px-3 py-2 text-slate-600 dark:text-slate-300">{item.submissionCount}</td>
                    <td className="px-3 py-2 text-slate-600 dark:text-slate-300">{item.averageScore}</td>
                    <td className="px-3 py-2 text-slate-600 dark:text-slate-300">{item.topScore}</td>
                    <td className="px-3 py-2">
                      <span
                        className={`inline-flex items-center rounded-full border px-2.5 py-1 text-xs font-semibold ${averageBadgeClass(
                          Number(item.averageScore ?? 0)
                        )}`}
                      >
                        {Number(item.averageScore ?? 0) >= 60
                          ? "High"
                          : Number(item.averageScore ?? 0) >= 40
                            ? "Moderate"
                            : "Low"}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  );
}

export default DashboardPage;
