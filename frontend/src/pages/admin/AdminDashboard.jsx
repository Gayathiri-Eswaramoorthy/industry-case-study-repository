import { useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import {
  Users,
  Clock,
  FileEdit,
  BookOpen,
  BarChart3,
  ClipboardList,
  PlusCircle,
  CheckCircle2,
  UserPlus,
  FileText,
  Activity,
  ArrowRight,
} from "lucide-react";
import analyticsService from "../../modules/analytics/services/analyticsService";
import activityService from "../../modules/analytics/services/activityService";

function getGreeting() {
  const hour = new Date().getHours();
  if (hour < 12) return "Good morning";
  if (hour < 17) return "Good afternoon";
  return "Good evening";
}

function formatDate(date = new Date()) {
  return date.toLocaleDateString("en-US", {
    weekday: "long",
    month: "long",
    day: "numeric",
    year: "numeric",
  });
}

function formatRelativeTime(timestamp) {
  if (!timestamp) return "";
  const now = new Date();
  const then = new Date(timestamp);
  const diffMs = now.getTime() - then.getTime();
  const diffSec = Math.floor(diffMs / 1000);
  const diffMin = Math.floor(diffSec / 60);
  const diffHour = Math.floor(diffMin / 60);
  const diffDay = Math.floor(diffHour / 24);

  if (diffSec < 60) return "Just now";
  if (diffMin < 60) return `${diffMin} min${diffMin === 1 ? "" : "s"} ago`;
  if (diffHour < 24) return `${diffHour} hour${diffHour === 1 ? "" : "s"} ago`;
  return `${diffDay} day${diffDay === 1 ? "" : "s"} ago`;
}

function getActivityIcon(message) {
  const normalizedMessage = String(message || "").toLowerCase();

  if (normalizedMessage.includes("created")) {
    return <PlusCircle className="h-4 w-4 text-blue-500" />;
  }
  if (normalizedMessage.includes("published")) {
    return <CheckCircle2 className="h-4 w-4 text-emerald-500" />;
  }
  if (normalizedMessage.includes("registered")) {
    return <UserPlus className="h-4 w-4 text-violet-500" />;
  }
  if (normalizedMessage.includes("submission")) {
    return <FileText className="h-4 w-4 text-amber-500" />;
  }

  return <Activity className="h-4 w-4 text-slate-400" />;
}

function AdminDashboard() {
  const navigate = useNavigate();

  const {
    data: dashboardData,
    isLoading: isLoadingDashboard,
    isError: dashboardError,
  } = useQuery({
    queryKey: ["admin-dashboard-metrics"],
    queryFn: () => analyticsService.getDashboardStats(),
  });

  const {
    data: userAnalytics,
    isLoading: isLoadingUsers,
    isError: userError,
  } = useQuery({
    queryKey: ["admin-user-analytics"],
    queryFn: () => analyticsService.getUserAnalytics(),
  });

  const {
    data: submissionAnalytics,
    isLoading: isLoadingSubmissions,
    isError: submissionError,
  } = useQuery({
    queryKey: ["admin-submission-analytics"],
    queryFn: () => analyticsService.getSubmissionAnalytics(),
  });

  const {
    data: caseAnalytics,
    isLoading: isLoadingCaseAnalytics,
    isError: caseError,
  } = useQuery({
    queryKey: ["admin-case-analytics"],
    queryFn: () => analyticsService.getCaseAnalytics(),
  });

  const {
    data: activities = [],
    isLoading: isLoadingActivities,
    isError: activityError,
  } = useQuery({
    queryKey: ["activity-feed", "ADMIN", null, 6],
    queryFn: () => activityService.getAdminActivity(6),
    staleTime: 60 * 1000,
  });

  const isLoading =
    isLoadingDashboard || isLoadingUsers || isLoadingSubmissions || isLoadingCaseAnalytics;
  const isError = dashboardError || userError || submissionError || caseError;

  const metrics = {
    totalUsers: dashboardData?.totalUsers ?? userAnalytics?.totalUsers ?? 0,
    totalCases: dashboardData?.totalCases ?? 0,
    draftCases: Number(caseAnalytics?.draftCases ?? 0),
    pendingReviews: dashboardData?.pendingReviews ?? 0,
    totalSubmissions:
      dashboardData?.totalSubmissions ?? submissionAnalytics?.totalSubmissions ?? 0,
  };

  const kpiCards = [
    {
      key: "users",
      label: "Total Users",
      value: metrics.totalUsers,
      subtitle: "Manage platform members",
      icon: <Users className="h-5 w-5 text-blue-600 dark:text-blue-300" />,
      iconBox: "bg-blue-50 dark:bg-blue-950/40",
      to: "/users",
    },
    {
      key: "reviews",
      label: "Pending Reviews",
      value: metrics.pendingReviews,
      subtitle: "Submissions awaiting evaluation",
      icon: <Clock className="h-5 w-5 text-amber-600 dark:text-amber-300" />,
      iconBox: "bg-amber-50 dark:bg-amber-950/40",
      to: "/faculty/submissions",
    },
    {
      key: "drafts",
      label: "Draft Cases",
      value: metrics.draftCases,
      subtitle: "Cases pending publication",
      icon: <FileEdit className="h-5 w-5 text-violet-600 dark:text-violet-300" />,
      iconBox: "bg-violet-50 dark:bg-violet-950/40",
      to: "/cases",
    },
  ];

  const attentionItems = useMemo(() => {
    const items = [];

    if (metrics.pendingReviews > 0) {
      items.push({
        key: "pending-reviews",
        text: `${metrics.pendingReviews} submissions pending evaluation`,
        to: "/faculty/submissions",
        linkText: "Review Now",
        style:
          "border-amber-200 border-l-4 border-l-amber-400 bg-amber-50 text-amber-800 dark:border-amber-500/40 dark:border-l-amber-400 dark:bg-amber-950/30 dark:text-amber-200",
      });
    }

    if (metrics.draftCases > 0) {
      items.push({
        key: "draft-cases",
        text: `${metrics.draftCases} cases in DRAFT waiting to publish`,
        to: "/cases",
        linkText: "View Cases",
        style:
          "border-blue-200 border-l-4 border-l-blue-400 bg-blue-50 text-blue-800 dark:border-blue-500/40 dark:border-l-blue-400 dark:bg-blue-950/30 dark:text-blue-200",
      });
    }

    return items;
  }, [metrics.draftCases, metrics.pendingReviews]);

  const quickActions = [
    {
      key: "manage-users",
      title: "Manage Users",
      description: "Create and manage roles",
      to: "/users",
      icon: <Users className="h-4 w-4 text-blue-600 dark:text-blue-300" />,
      iconBox: "bg-blue-50 dark:bg-blue-950/40",
    },
    {
      key: "publish-cases",
      title: "Publish Cases",
      description: "Review and publish drafts",
      to: "/cases",
      icon: <BookOpen className="h-4 w-4 text-emerald-600 dark:text-emerald-300" />,
      iconBox: "bg-emerald-50 dark:bg-emerald-950/40",
    },
    {
      key: "view-analytics",
      title: "View Analytics",
      description: "Inspect platform trends",
      to: "/analytics",
      icon: <BarChart3 className="h-4 w-4 text-violet-600 dark:text-violet-300" />,
      iconBox: "bg-violet-50 dark:bg-violet-950/40",
    },
    {
      key: "review-submissions",
      title: "Review Submissions",
      description: "Open evaluation queue",
      to: "/faculty/submissions",
      icon: <ClipboardList className="h-4 w-4 text-amber-600 dark:text-amber-300" />,
      iconBox: "bg-amber-50 dark:bg-amber-950/40",
    },
  ];

  return (
    <div className="space-y-8">
      <section className="rounded-xl bg-gradient-to-r from-slate-50 to-white p-6 md:p-8 dark:from-slate-900 dark:to-slate-900/70">
        <h1 className="text-3xl font-bold tracking-tight text-slate-900 dark:text-slate-100">
          {getGreeting()}, Admin
        </h1>
        <p className="mt-2 text-sm text-slate-600 dark:text-slate-300">
          Here&apos;s what needs your attention today. - {formatDate()}
        </p>
      </section>

      {isError && (
        <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700 dark:border-red-500/30 dark:bg-red-950/30 dark:text-red-300">
          Unable to load dashboard metrics. Please try again.
        </div>
      )}

      <section className="grid gap-4 md:grid-cols-3">
        {isLoading
          ? Array.from({ length: 3 }).map((_, index) => (
              <div
                key={index}
                className="h-40 animate-pulse rounded-xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900"
              />
            ))
          : kpiCards.map((card) => (
              <button
                key={card.key}
                type="button"
                onClick={() => navigate(card.to)}
                className="cursor-pointer rounded-xl border border-slate-200 bg-white p-5 text-left shadow-sm transition-all hover:border-slate-300 hover:shadow-md dark:border-slate-800 dark:bg-slate-900 dark:hover:border-slate-600"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className={`flex h-10 w-10 items-center justify-center rounded-lg ${card.iconBox}`}>
                    {card.icon}
                  </div>
                  <p className="text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">
                    {card.label}
                  </p>
                </div>
                <p className="mt-4 text-3xl font-bold text-slate-900 dark:text-slate-100">{card.value}</p>
                <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">{card.subtitle}</p>
                <p className="mt-4 inline-flex items-center gap-1 text-xs font-medium text-slate-600 dark:text-slate-300">
                  <span>View all</span>
                  <ArrowRight className="h-3.5 w-3.5" />
                </p>
              </button>
            ))}
      </section>

      <section className="space-y-3">
        <h2 className="text-sm font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">
          Needs Attention
        </h2>
        {attentionItems.length === 0 ? (
          <div className="rounded-lg border border-emerald-200 border-l-4 border-l-emerald-400 bg-emerald-50 px-4 py-3 text-sm text-emerald-800 dark:border-emerald-500/40 dark:border-l-emerald-400 dark:bg-emerald-950/30 dark:text-emerald-200">
            ✓ Everything is up to date
          </div>
        ) : (
          <div className="space-y-2">
            {attentionItems.map((item) => (
              <div
                key={item.key}
                className={`flex items-center justify-between rounded-lg px-4 py-3 text-sm ${item.style}`}
              >
                <span>{item.text}</span>
                <button
                  type="button"
                  onClick={() => navigate(item.to)}
                  className="inline-flex items-center gap-1 text-xs font-semibold"
                >
                  <span>{item.linkText}</span>
                  <ArrowRight className="h-3.5 w-3.5" />
                </button>
              </div>
            ))}
          </div>
        )}
      </section>

      <section className="grid gap-6 lg:grid-cols-2">
        <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-sm font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">
              Recent Activity
            </h2>
            <button
              type="button"
              onClick={() => navigate("/analytics")}
              className="text-xs font-medium text-slate-600 hover:text-slate-900 dark:text-slate-300 dark:hover:text-slate-100"
            >
              View all →
            </button>
          </div>

          {isLoadingActivities && (
            <div className="space-y-3">
              {Array.from({ length: 3 }).map((_, index) => (
                <div key={index} className="h-12 animate-pulse rounded bg-slate-200 dark:bg-slate-800" />
              ))}
            </div>
          )}

          {!isLoadingActivities && activityError && (
            <p className="text-sm text-red-600 dark:text-red-400">Unable to load recent activity.</p>
          )}

          {!isLoadingActivities && !activityError && activities.length === 0 && (
            <p className="text-sm text-slate-500 dark:text-slate-400">No recent activity yet.</p>
          )}

          {!isLoadingActivities && !activityError && activities.length > 0 && (
            <div className="divide-y divide-slate-100 dark:divide-slate-800">
              {activities.slice(0, 6).map((item) => (
                <div key={item.id} className="flex items-start gap-3 py-3">
                  <span className="mt-0.5">{getActivityIcon(item.message)}</span>
                  <div className="min-w-0 flex-1">
                    <p className="text-sm text-slate-700 dark:text-slate-200">{item.message}</p>
                    <p className="mt-0.5 text-xs text-slate-400 dark:text-slate-500">
                      {formatRelativeTime(item.timestamp)}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900">
          <h2 className="mb-4 text-sm font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">
            Quick Actions
          </h2>
          <div className="grid gap-3 sm:grid-cols-2">
            {quickActions.map((action) => (
              <button
                key={action.key}
                type="button"
                onClick={() => navigate(action.to)}
                className="cursor-pointer rounded-xl border border-slate-200 bg-white p-4 text-left transition-all hover:bg-slate-50 hover:shadow-sm dark:border-slate-700 dark:bg-slate-900 dark:hover:bg-slate-800"
              >
                <div className={`mb-3 inline-flex h-8 w-8 items-center justify-center rounded-full ${action.iconBox}`}>
                  {action.icon}
                </div>
                <p className="text-sm font-semibold text-slate-900 dark:text-slate-100">{action.title}</p>
                <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">{action.description}</p>
              </button>
            ))}
          </div>
        </div>
      </section>

      <section className="grid gap-4 md:grid-cols-3">
        <div className="rounded-xl bg-slate-900 p-4 text-white shadow-sm dark:bg-slate-800">
          <p className="text-2xl font-bold">{metrics.totalCases}</p>
          <p className="mt-1 text-xs uppercase tracking-wide text-slate-300">Case Studies</p>
        </div>
        <div className="rounded-xl bg-slate-900 p-4 text-white shadow-sm dark:bg-slate-800">
          <p className="text-2xl font-bold">{metrics.totalSubmissions}</p>
          <p className="mt-1 text-xs uppercase tracking-wide text-slate-300">Submissions</p>
        </div>
        <div className="rounded-xl bg-slate-900 p-4 text-white shadow-sm dark:bg-slate-800">
          <p className="text-2xl font-bold">{metrics.totalUsers}</p>
          <p className="mt-1 text-xs uppercase tracking-wide text-slate-300">Registered Users</p>
        </div>
      </section>
    </div>
  );
}

export default AdminDashboard;
