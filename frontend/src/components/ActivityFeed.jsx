import { useContext } from "react";
import { useQuery } from "@tanstack/react-query";
import activityService from "../modules/analytics/services/activityService";
import { AuthContext } from "../context/AuthContext";

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

function ActivityFeed({ maxItems = 8, courseId }) {
  const { role } = useContext(AuthContext);

  const {
    data: activities = [],
    isLoading: loading,
    isError: error,
  } = useQuery({
    queryKey: ["activity-feed", role, courseId, maxItems],
    enabled: Boolean(role),
    queryFn: async () => {
      if (role === "STUDENT") {
        return activityService.getStudentActivity(maxItems);
      }

      if (role === "FACULTY") {
        return activityService.getFacultyActivity(maxItems, courseId);
      }

      if (role === "ADMIN") {
        return activityService.getAdminActivity(maxItems);
      }

      return [];
    },
    staleTime: 60 * 1000,
  });

  const renderDot = (type) => {
    let color = "bg-slate-300";
    if (type === "submission") color = "bg-sky-500";
    if (type === "review") color = "bg-amber-500";
    if (type === "publish") color = "bg-emerald-500";
    if (type === "grade") color = "bg-violet-500";
    if (type === "user") color = "bg-indigo-500";
    if (type === "case") color = "bg-emerald-600";

    return (
      <span
        className={`mt-1 inline-flex h-2.5 w-2.5 flex-shrink-0 rounded-full ${color}`}
      />
    );
  };

  return (
    <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-700 dark:bg-slate-800">
      <h2 className="mb-4 text-sm font-semibold text-slate-800 dark:text-slate-100">
        Recent Activity
      </h2>

      {loading && (
        <div className="space-y-3">
          {Array.from({ length: 3 }).map((_, index) => (
            <div key={index} className="flex items-center gap-3">
              <span className="inline-flex h-2.5 w-2.5 flex-shrink-0 rounded-full bg-slate-300" />
              <div className="flex-1 space-y-2">
                <div className="h-3 w-3/4 animate-pulse rounded bg-slate-200" />
                <div className="h-3 w-1/3 animate-pulse rounded bg-slate-200" />
              </div>
            </div>
          ))}
        </div>
      )}

      {!loading && error && (
        <div className="rounded-xl border border-dashed border-slate-300 bg-slate-50 px-4 py-4 text-center text-xs text-slate-600 dark:border-slate-600 dark:bg-slate-900 dark:text-slate-300">
          Unable to load dashboard data
        </div>
      )}

      {!loading && !error && activities.length === 0 && (
        <div className="rounded-xl border border-dashed border-slate-300 bg-slate-50 px-4 py-4 text-center text-xs text-slate-600 dark:border-slate-600 dark:bg-slate-900 dark:text-slate-300">
          No recent activity yet.
        </div>
      )}

      {!loading && !error && activities.length > 0 && (
        <div className="divide-y divide-slate-100 dark:divide-slate-700">
          {activities.map((activity) => (
            <div
              key={activity.id}
              className="flex items-start gap-3 py-3 text-sm text-slate-700 dark:text-slate-100"
            >
              {renderDot(activity.type)}
              <div className="flex-1">
                <p className="text-sm">{activity.message}</p>
                <p className="mt-0.5 text-xs text-slate-500 dark:text-slate-400">
                  {formatRelativeTime(activity.timestamp)}
                </p>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default ActivityFeed;
