import { Fragment, useContext, useState } from "react";
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
import { ChevronDown, ChevronRight } from "lucide-react";
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

function approvalRateBadgeClass(rate) {
  if (rate >= 80) {
    return "border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-500/40 dark:bg-emerald-950/30 dark:text-emerald-300";
  }
  if (rate >= 50) {
    return "border-amber-200 bg-amber-50 text-amber-700 dark:border-amber-500/40 dark:bg-amber-950/30 dark:text-amber-300";
  }
  return "border-red-200 bg-red-50 text-red-700 dark:border-red-500/40 dark:bg-red-950/30 dark:text-red-300";
}

function coBarColor(score) {
  if (score >= 60) return "#10b981";
  if (score >= 40) return "#f59e0b";
  return "#ef4444";
}

function hasValidFacultyId(value) {
  if (value === null || value === undefined || value === "") {
    return false;
  }
  return Number.isFinite(Number(value));
}

function DashboardPage() {
  const { role } = useContext(AuthContext);
  const [expandedFacultyId, setExpandedFacultyId] = useState(null);

  const {
    data: overallStats,
    isError: dashboardError,
  } = useQuery({
    queryKey: ["admin-overall-stats"],
    queryFn: () => analyticsService.getOverallStats(),
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
    data: facultyPerformance = [],
    isLoading: isLoadingFacultyPerformance,
    isError: isFacultyPerformanceError,
  } = useQuery({
    queryKey: ["admin-faculty-performance"],
    queryFn: () => analyticsService.getFacultyPerformance(),
    enabled: role === "ADMIN",
  });

  const {
    data: facultyStudentsBreakdown,
    isLoading: isLoadingFacultyStudentsBreakdown,
    isError: isFacultyStudentsBreakdownError,
  } = useQuery({
    queryKey: ["admin-faculty-students-breakdown", expandedFacultyId],
    queryFn: () => analyticsService.getFacultyStudentsBreakdown(expandedFacultyId),
    enabled: role === "ADMIN" && hasValidFacultyId(expandedFacultyId),
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
      ["Dashboard", "Total Users", overallStats?.totalUsers ?? 0],
      ["Dashboard", "Total Faculty", overallStats?.totalFaculty ?? 0],
      ["Dashboard", "Total Students", overallStats?.totalStudents ?? 0],
      ["Dashboard", "Total Cases", overallStats?.totalCases ?? 0],
      ["Dashboard", "Total Submissions", overallStats?.totalSubmissions ?? 0],
      ["Dashboard", "Approved Students", overallStats?.approvedStudents ?? 0],
      ["Dashboard", "Pending Students", overallStats?.pendingStudents ?? 0],
      ["Dashboard", "Rejected Students", overallStats?.rejectedStudents ?? 0],
      ["Dashboard", "Overall Approval Rate", `${overallStats?.overallApprovalRate ?? 0}%`],
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

    rows.push(["Faculty Performance", "Faculty", "Approval Rate"]);
    facultyPerformance.forEach((item) => {
      rows.push(["Faculty Performance", item.facultyName, item.totalSubmissions ?? 0]);
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
        <h2 className="mb-4 text-sm font-semibold text-slate-800 dark:text-slate-100">Faculty-wise Submission Performance</h2>
        {isLoadingFacultyPerformance ? (
          <div className="space-y-2">
            {Array.from({ length: 5 }).map((_, idx) => (
              <div key={idx} className="h-10 animate-pulse rounded bg-slate-200 dark:bg-slate-800" />
            ))}
          </div>
        ) : isFacultyPerformanceError ? (
          <div className="rounded border border-dashed border-red-300 px-4 py-5 text-sm text-red-600 dark:border-red-500/40 dark:text-red-300">
            Unable to load faculty performance analytics
          </div>
        ) : facultyPerformance.length === 0 ? (
          <div className="rounded border border-dashed border-slate-300 px-4 py-5 text-sm text-slate-500 dark:border-slate-700 dark:text-slate-400">
            No faculty-student mappings found
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full text-sm">
              <thead className="bg-slate-50 dark:bg-slate-800/50">
                <tr>
                  <th className="px-3 py-2 text-left text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">
                    Faculty
                  </th>
                  <th className="px-3 py-2 text-left text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">
                    Total Students
                  </th>
                  <th className="px-3 py-2 text-left text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">
                    Total Submissions
                  </th>
                  <th className="px-3 py-2 text-left text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">
                    Submitted
                  </th>
                  <th className="px-3 py-2 text-left text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">
                    Under Review
                  </th>
                  <th className="px-3 py-2 text-left text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">
                    Re-eval
                  </th>
                  <th className="px-3 py-2 text-left text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">
                    Evaluated
                  </th>
                  <th className="px-3 py-2 text-left text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">
                    Approval Rate
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {facultyPerformance.map((item, index) => {
                  const isExpanded = expandedFacultyId === item.facultyId;
                  return (
                    <Fragment key={item.facultyId}>
                      <tr
                        className="cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-800/40"
                        onClick={() => setExpandedFacultyId(isExpanded ? null : item.facultyId)}
                      >
                        <td className="px-3 py-2 font-medium text-slate-800 dark:text-slate-100">
                          <div className="flex items-center gap-2">
                            <ChevronRight
                              className={`h-4 w-4 transition ${isExpanded ? "rotate-90" : ""}`}
                            />
                            <span>{item.facultyName || `Faculty #${item.facultyId}`}</span>
                            {index === 0 && (
                              <span className="rounded-full border border-emerald-200 bg-emerald-50 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-emerald-700 dark:border-emerald-500/40 dark:bg-emerald-950/30 dark:text-emerald-300">
                                Top
                              </span>
                            )}
                          </div>
                        </td>
                        <td className="px-3 py-2 text-slate-600 dark:text-slate-300">{item.totalStudents}</td>
                        <td className="px-3 py-2 font-medium text-slate-700 dark:text-slate-200">{item.totalSubmissions ?? 0}</td>
                        <td className="px-3 py-2 text-blue-700 dark:text-blue-300">{item.submitted ?? 0}</td>
                        <td className="px-3 py-2 text-amber-700 dark:text-amber-300">{item.underReview ?? 0}</td>
                        <td className="px-3 py-2 text-violet-700 dark:text-violet-300">{item.reevalRequested ?? 0}</td>
                        <td className="px-3 py-2 text-emerald-700 dark:text-emerald-300">{item.evaluated ?? 0}</td>
                        <td className="px-3 py-2">
                          <span
                            className={`inline-flex items-center rounded-full border px-2.5 py-1 text-xs font-semibold ${approvalRateBadgeClass(
                              Number(item.approvalRate ?? 0)
                            )}`}
                          >
                            {Number(item.approvalRate ?? 0).toFixed(2)}%
                          </span>
                        </td>
                      </tr>
                      {isExpanded && (
                        <tr>
                          <td colSpan={8} className="bg-slate-50 px-4 py-3 dark:bg-slate-900/40">
                            {isLoadingFacultyStudentsBreakdown ? (
                              <div className="text-sm text-slate-500 dark:text-slate-400">Loading students...</div>
                            ) : isFacultyStudentsBreakdownError ? (
                              <div className="text-sm text-red-600 dark:text-red-300">Unable to load student breakdown.</div>
                            ) : (
                              <div className="grid gap-3 md:grid-cols-3">
                                {[
                                  {
                                    key: "approved",
                                    title: "Approved",
                                    color: "text-emerald-700 dark:text-emerald-300",
                                    items: facultyStudentsBreakdown?.approvedStudents ?? [],
                                  },
                                  {
                                    key: "pending",
                                    title: "Pending",
                                    color: "text-amber-700 dark:text-amber-300",
                                    items: facultyStudentsBreakdown?.pendingStudents ?? [],
                                  },
                                  {
                                    key: "rejected",
                                    title: "Rejected",
                                    color: "text-red-700 dark:text-red-300",
                                    items: facultyStudentsBreakdown?.rejectedStudents ?? [],
                                  },
                                ].map((group) => (
                                  <div key={group.key} className="rounded-lg border border-slate-200 bg-white p-3 dark:border-slate-700 dark:bg-slate-900">
                                    <div className={`mb-2 text-xs font-semibold uppercase tracking-wide ${group.color}`}>
                                      {group.title} ({group.items.length})
                                    </div>
                                    {group.items.length === 0 ? (
                                      <div className="text-xs text-slate-500 dark:text-slate-400">No students</div>
                                    ) : (
                                      <div className="space-y-2">
                                        {group.items.map((student) => (
                                          <div key={student.studentId} className="rounded border border-slate-100 p-2 text-xs dark:border-slate-800">
                                            <div className="font-medium text-slate-700 dark:text-slate-200">{student.studentName}</div>
                                            <div className="mt-1 text-slate-500 dark:text-slate-400">
                                              Total: {student.totalSubmissions} | S:{student.submitted} UR:{student.underReview} RQ:{student.reevalRequested} E:{student.evaluated}
                                            </div>
                                          </div>
                                        ))}
                                      </div>
                                    )}
                                  </div>
                                ))}
                              </div>
                            )}
                          </td>
                        </tr>
                      )}
                    </Fragment>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  );
}

export default DashboardPage;
