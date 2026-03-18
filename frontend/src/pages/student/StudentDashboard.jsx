import { useContext, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import {
  BookOpen,
  FileText,
  CheckCircle2,
  Clock,
  Calendar,
  ArrowRight,
} from "lucide-react";
import axiosInstance from "../../api/axiosInstance";
import submissionService from "../../modules/submission/services/submissionService";
import { getStudentDashboard } from "../../services/studentDashboardService";
import { AuthContext } from "../../context/AuthContext";

function getGreeting() {
  const hour = new Date().getHours();
  if (hour < 12) return "Good morning";
  if (hour < 17) return "Good afternoon";
  return "Good evening";
}

function getFirstNameFromEmail(email) {
  const localPart = String(email || "Student").split("@")[0] || "Student";
  if (!localPart) return "Student";
  return localPart.charAt(0).toUpperCase() + localPart.slice(1);
}

function getDaysUntil(dateString) {
  if (!dateString) return null;
  const today = new Date();
  const dueDate = new Date(dateString);
  const diffMs = dueDate.getTime() - today.getTime();
  return Math.ceil(diffMs / (1000 * 60 * 60 * 24));
}

function scoreBadgeClass(score) {
  if (score >= 60) {
    return "border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-500/40 dark:bg-emerald-950/30 dark:text-emerald-300";
  }
  if (score >= 40) {
    return "border-amber-200 bg-amber-50 text-amber-700 dark:border-amber-500/40 dark:bg-amber-950/30 dark:text-amber-300";
  }
  return "border-red-200 bg-red-50 text-red-700 dark:border-red-500/40 dark:bg-red-950/30 dark:text-red-300";
}

function StudentDashboard() {
  const navigate = useNavigate();
  const { user } = useContext(AuthContext);
  const firstName = getFirstNameFromEmail(user?.email);

  const {
    data: dashboardData,
    isLoading: isLoadingDashboard,
    isError: isDashboardError,
  } = useQuery({
    queryKey: ["student-dashboard"],
    queryFn: getStudentDashboard,
  });

  const {
    data: submissionsPage,
    isLoading: isLoadingSubmissions,
  } = useQuery({
    queryKey: ["student-submissions"],
    queryFn: () => submissionService.getMySubmissions({ page: 0, size: 100 }),
  });

  const {
    data: casesPage,
    isLoading: isLoadingCases,
  } = useQuery({
    queryKey: ["cases"],
    queryFn: async () => {
      const response = await axiosInstance.get("/cases", { params: { page: 0, size: 200 } });
      return response.data?.data ?? response.data ?? { content: [] };
    },
  });

  const dashboard = {
    availableCases: dashboardData?.totalCases ?? 0,
    mySubmissions: dashboardData?.mySubmissions ?? 0,
    evaluated: (dashboardData?.mySubmissions ?? 0) - (dashboardData?.pendingReview ?? 0),
    pending: Math.max((dashboardData?.mySubmissions ?? 0) - ((dashboardData?.mySubmissions ?? 0) - (dashboardData?.pendingReview ?? 0)), 0),
  };
  const greeting = getGreeting();
  const availableCases = dashboard.availableCases;
  const pendingCount = dashboard.pending;

  const submissions = Array.isArray(submissionsPage?.content) ? submissionsPage.content : null;
  const allCases = Array.isArray(casesPage?.content) ? casesPage.content : null;

  const progress = useMemo(() => {
    const total = Math.max(dashboard.availableCases, 0);
    const submitted = Math.max(dashboard.mySubmissions, 0);
    if (total <= 0) {
      return { percent: 0, submitted, total };
    }
    const percent = Math.min(Math.round((submitted / total) * 100), 100);
    return { percent, submitted, total };
  }, [dashboard.availableCases, dashboard.mySubmissions]);

  const recentEvaluated = useMemo(() => {
    const list = submissions ?? [];
    return list
      .filter((item) => item?.status === "EVALUATED")
      .sort((a, b) => new Date(b.evaluatedAt || b.submittedAt || 0) - new Date(a.evaluatedAt || a.submittedAt || 0))
      .slice(0, 3);
  }, [submissions]);

  const upcomingDeadlines = useMemo(() => {
    const submissionList = submissions ?? [];
    const caseList = allCases ?? [];
    const submittedCaseIds = new Set(submissionList.map((s) => s?.caseId).filter(Boolean));
    return caseList
      .filter((item) => item?.status === "PUBLISHED")
      .filter((item) => item?.id && !submittedCaseIds.has(item.id))
      .filter((item) => {
        const days = getDaysUntil(item?.dueDate);
        return days == null ? false : days >= 0;
      })
      .sort((a, b) => new Date(a.dueDate || 0) - new Date(b.dueDate || 0))
      .slice(0, 3);
  }, [allCases, submissions]);

  const kpis = [
    {
      key: "available",
      label: "Available Cases",
      value: dashboard.availableCases,
      description: "Open for submission",
      icon: <BookOpen className="h-5 w-5 text-blue-600 dark:text-blue-300" />,
      iconBox: "bg-blue-50 dark:bg-blue-950/30",
      to: "/cases",
    },
    {
      key: "submitted",
      label: "My Submissions",
      value: dashboard.mySubmissions,
      description: "Solutions submitted",
      icon: <FileText className="h-5 w-5 text-violet-600 dark:text-violet-300" />,
      iconBox: "bg-violet-50 dark:bg-violet-950/30",
      to: "/student/submissions",
    },
    {
      key: "evaluated",
      label: "Evaluated",
      value: dashboard.evaluated,
      description: "Results available",
      icon: <CheckCircle2 className="h-5 w-5 text-emerald-600 dark:text-emerald-300" />,
      iconBox: "bg-emerald-50 dark:bg-emerald-950/30",
      to: "/student/submissions",
    },
    {
      key: "pending",
      label: "Pending",
      value: dashboard.pending,
      description: "Awaiting evaluation",
      icon: <Clock className="h-5 w-5 text-amber-600 dark:text-amber-300" />,
      iconBox: "bg-amber-50 dark:bg-amber-950/30",
      to: "/student/submissions",
    },
  ];

  return (
    <div className="space-y-8">
      <div className="relative overflow-hidden rounded-xl bg-gradient-to-r from-slate-900 to-slate-700 p-6 text-white shadow-sm">
        <div className="absolute right-0 top-0 h-full w-64 opacity-10">
          <div className="absolute right-8 top-8 h-32 w-32 rounded-full bg-white" />
          <div className="absolute right-24 top-16 h-16 w-16 rounded-full bg-white" />
        </div>

        <div className="relative flex items-start justify-between">
          <div>
            <h1 className="text-2xl font-bold text-white">
              {greeting}, {firstName}
            </h1>
            <p className="mt-1 text-sm text-slate-300">
              You have {availableCases} cases available and {pendingCount} pending submissions.
            </p>
          </div>
          <span className="rounded-full border border-white/20 bg-white/10 px-3 py-1 text-xs font-medium text-white">
            STUDENT
          </span>
        </div>
      </div>

      {isDashboardError && (
        <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700 dark:border-red-500/30 dark:bg-red-950/30 dark:text-red-300">
          Unable to load student dashboard metrics.
        </div>
      )}

      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {isLoadingDashboard
          ? Array.from({ length: 4 }).map((_, index) => (
              <div
                key={index}
                className="h-36 animate-pulse rounded-xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900"
              />
            ))
          : kpis.map((item) => (
              <button
                key={item.key}
                type="button"
                onClick={() => navigate(item.to)}
                className="rounded-xl border border-slate-200 bg-white p-5 text-left shadow-sm transition-all hover:shadow-md hover:border-slate-300 dark:border-slate-800 dark:bg-slate-900 dark:hover:border-slate-600"
              >
                <div className="mb-3 flex items-center justify-between">
                  <div className={`flex h-10 w-10 items-center justify-center rounded-lg ${item.iconBox}`}>
                    {item.icon}
                  </div>
                  <p className="text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">
                    {item.label}
                  </p>
                </div>
                <p className="text-3xl font-bold text-slate-900 dark:text-slate-100">{item.value}</p>
                <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">{item.description}</p>
              </button>
            ))}
      </section>

      <section className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900">
        <h2 className="text-sm font-semibold text-slate-800 dark:text-slate-100">Your Submission Progress</h2>
        <div className="mt-4 h-2 w-full rounded-full bg-slate-200 dark:bg-slate-700">
          <div
            className="h-2 rounded-full bg-emerald-500 transition-all"
            style={{ width: `${progress.percent}%` }}
          />
        </div>
        <p className="mt-3 text-sm text-slate-600 dark:text-slate-300">
          {progress.percent}% - {progress.submitted} of {progress.total} available cases submitted
        </p>
        {progress.percent >= 100 && (
          <p className="mt-2 text-sm font-medium text-emerald-600 dark:text-emerald-300">
            🎉 All available cases submitted!
          </p>
        )}
      </section>

      <section className="grid gap-6 lg:grid-cols-2">
        <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900">
          <div className="mb-4 flex items-center gap-2">
            <CheckCircle2 className="h-4 w-4 text-emerald-600 dark:text-emerald-300" />
            <h2 className="text-sm font-semibold text-slate-800 dark:text-slate-100">Recent Results</h2>
          </div>

          {isLoadingSubmissions ? (
            <div className="space-y-3">
              {Array.from({ length: 3 }).map((_, index) => (
                <div key={index} className="h-14 animate-pulse rounded bg-slate-200 dark:bg-slate-800" />
              ))}
            </div>
          ) : recentEvaluated.length === 0 ? (
            <p className="text-sm text-slate-500 dark:text-slate-400">No evaluated submissions yet</p>
          ) : (
            <div className="space-y-3">
              {recentEvaluated.map((item) => (
                <div
                  key={item.id}
                  className="rounded-lg border border-slate-200 px-3 py-3 dark:border-slate-700"
                >
                  <div className="flex items-center justify-between gap-3">
                    <p className="truncate text-sm font-medium text-slate-800 dark:text-slate-100">
                      {item.caseTitle || `Case #${item.caseId}`}
                    </p>
                    <span
                      className={`inline-flex shrink-0 items-center rounded-full border px-2.5 py-1 text-xs font-semibold ${scoreBadgeClass(
                        Number(item.marksAwarded ?? 0)
                      )}`}
                    >
                      {item.marksAwarded ?? 0}
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={() => navigate("/student/submissions")}
                    className="mt-2 inline-flex items-center gap-1 text-xs font-medium text-slate-600 hover:text-slate-900 dark:text-slate-300 dark:hover:text-slate-100"
                  >
                    <span>View feedback</span>
                    <ArrowRight className="h-3.5 w-3.5" />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900">
          <div className="mb-4 flex items-center gap-2">
            <Calendar className="h-4 w-4 text-slate-600 dark:text-slate-300" />
            <h2 className="text-sm font-semibold text-slate-800 dark:text-slate-100">Upcoming Deadlines</h2>
          </div>

          {isLoadingCases ? (
            <div className="space-y-3">
              {Array.from({ length: 3 }).map((_, index) => (
                <div key={index} className="h-14 animate-pulse rounded bg-slate-200 dark:bg-slate-800" />
              ))}
            </div>
          ) : upcomingDeadlines.length === 0 ? (
            <p className="text-sm text-slate-500 dark:text-slate-400">No upcoming deadlines 🎉</p>
          ) : (
            <div className="space-y-3">
              {upcomingDeadlines.map((item) => {
                const days = getDaysUntil(item.dueDate);
                const dueSoon = days != null && days <= 3;
                const thisWeek = days != null && days > 3 && days <= 7;
                return (
                  <div
                    key={item.id}
                    className="rounded-lg border border-slate-200 px-3 py-3 dark:border-slate-700"
                  >
                    <div className="flex items-center justify-between gap-3">
                      <p className="truncate text-sm font-medium text-slate-800 dark:text-slate-100">
                        {item.title}
                      </p>
                      {dueSoon && (
                        <span className="rounded-full bg-red-100 px-2 py-0.5 text-[11px] font-semibold text-red-700 dark:bg-red-950/40 dark:text-red-300">
                          Due Soon!
                        </span>
                      )}
                      {!dueSoon && thisWeek && (
                        <span className="rounded-full bg-amber-100 px-2 py-0.5 text-[11px] font-semibold text-amber-700 dark:bg-amber-950/40 dark:text-amber-300">
                          This Week
                        </span>
                      )}
                    </div>
                    <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                      {days === 0 ? "Due today" : `Due in ${days} days`}
                    </p>
                    <button
                      type="button"
                      onClick={() => navigate(`/cases/${item.id}`)}
                      className="mt-2 inline-flex items-center gap-1 text-xs font-medium text-slate-600 hover:text-slate-900 dark:text-slate-300 dark:hover:text-slate-100"
                    >
                      <span>Submit</span>
                      <ArrowRight className="h-3.5 w-3.5" />
                    </button>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </section>

      <section className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-emerald-200 bg-emerald-50 p-4 dark:border-emerald-500/30 dark:bg-emerald-950/30">
        <div>
          <p className="text-sm font-semibold text-emerald-800 dark:text-emerald-200">
            📊 Check your CO Attainment Report
          </p>
          <p className="mt-1 text-xs text-emerald-700 dark:text-emerald-300">
            See how your submissions map to course outcomes
          </p>
        </div>
        <button
          type="button"
          onClick={() => navigate("/student/co-attainment")}
          className="inline-flex items-center gap-1 rounded-md bg-emerald-600 px-3 py-1.5 text-xs font-semibold text-white transition hover:bg-emerald-700"
        >
          <span>View Report</span>
          <ArrowRight className="h-3.5 w-3.5" />
        </button>
      </section>
    </div>
  );
}

export default StudentDashboard;
