import { useContext, useEffect, useState } from "react";
import {
  PieChart,
  Pie,
  Cell,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import { useQuery } from "@tanstack/react-query";
import { Navigate } from "react-router-dom";
import analyticsService from "../services/analyticsService";
import KpiCard from "../../../components/KpiCard";
import ActivityFeed from "../../../components/ActivityFeed";
import { AuthContext } from "../../../context/AuthContext";
import { exportCsv } from "../../../utils/exportCsv";

const CASE_COLORS = ["#10B981", "#F59E0B"];
const USER_COLORS = ["#6366F1", "#0EA5E9"];

function DashboardPage() {
  const { role } = useContext(AuthContext);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (role !== "ADMIN") {
    return <Navigate to="/dashboard" replace />;
  }

  const {
    data: stats,
    isLoading: loading,
    error,
  } = useQuery({
    queryKey: ["analytics-dashboard"],
    queryFn: () => analyticsService.getDashboardStats(),
  });

  const safeStats = {
    totalUsers: stats?.totalUsers ?? 0,
    totalCases: stats?.totalCases ?? 0,
    activeCases: stats?.activeCases ?? 0,
    pendingReviews: stats?.pendingReviews ?? 0,
    activeFaculty: stats?.activeFaculty ?? 0,
  };

  const caseChartData =
    safeStats.activeCases > 0 || safeStats.pendingReviews > 0
      ? [
          { name: "Active Cases", value: safeStats.activeCases },
          { name: "Pending Reviews", value: safeStats.pendingReviews },
        ]
      : [];

  const userChartData =
    safeStats.totalUsers > 0 || safeStats.activeFaculty > 0
      ? [
          { name: "Active Faculty", value: safeStats.activeFaculty },
          {
            name: "Other Users",
            value: Math.max(safeStats.totalUsers - safeStats.activeFaculty, 0),
          },
        ]
      : [];

  const handleExport = () => {
    const rows = [
      ["Metric", "Value"],
      ["Total Users", safeStats.totalUsers],
      ["Total Cases", safeStats.totalCases],
      ["Active Cases", safeStats.activeCases],
      ["Pending Reviews", safeStats.pendingReviews],
      ["Active Faculty", safeStats.activeFaculty],
    ];

    exportCsv("dashboard-report.csv", rows);
  };

  return (
    <div className="space-y-6">
      <div className="mb-2 flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold text-slate-800">Analytics</h1>
          <p className="text-sm text-slate-500">
            Overview of platform-wide dashboard metrics.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <button
            type="button"
            onClick={handleExport}
            className="rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white shadow-sm transition hover:bg-blue-700 hover:shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
          >
            Export CSV
          </button>
        </div>
      </div>

      {loading && (
        <div className="space-y-6">
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-5">
            {Array.from({ length: 5 }).map((_, index) => (
              <KpiCard key={index} loading />
            ))}
          </div>

          <div className="grid gap-6 lg:grid-cols-2">
            {Array.from({ length: 2 }).map((_, index) => (
              <div
                key={index}
                className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm"
              >
                <div className="mb-4 h-4 w-32 animate-pulse rounded bg-slate-200" />
                <div className="h-40 animate-pulse rounded bg-slate-200" />
              </div>
            ))}
          </div>
        </div>
      )}

      {!loading && error && (
        <div className="rounded-xl border border-dashed border-slate-300 bg-slate-50 px-8 py-8 text-center dark:border-slate-600 dark:bg-slate-900">
          <h2 className="mb-2 text-sm font-semibold text-slate-700 dark:text-slate-100">
            Unable to load dashboard data
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Please try again later or contact an administrator if the issue
            persists.
          </p>
        </div>
      )}

      {!loading && !error && (
        <>
          <div>
            <h2 className="mb-3 text-sm font-semibold text-slate-700">
              Analytics Overview
            </h2>
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-5">
              <KpiCard title="Total Users" value={safeStats.totalUsers} icon="U" />
              <KpiCard title="Total Cases" value={safeStats.totalCases} icon="C" />
              <KpiCard title="Active Cases" value={safeStats.activeCases} icon="A" />
              <KpiCard
                title="Pending Reviews"
                value={safeStats.pendingReviews}
                icon="P"
              />
              <KpiCard
                title="Active Faculty"
                value={safeStats.activeFaculty}
                icon="F"
              />
            </div>
          </div>

          <div>
            <h2 className="mb-3 text-sm font-semibold text-slate-700">
              Analytics Charts
            </h2>
            <div className="grid gap-6 lg:grid-cols-2">
              <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-700 dark:bg-slate-800">
                <h2 className="mb-4 text-sm font-semibold text-slate-800 dark:text-slate-100">
                  Cases and Reviews
                </h2>
                {!stats ? (
                  <div className="h-80 w-full animate-pulse rounded bg-slate-200 dark:bg-slate-700" />
                ) : caseChartData.length === 0 ? (
                  <div className="rounded-xl border border-dashed border-slate-300 bg-slate-50 px-4 py-6 text-center text-xs text-slate-500 dark:border-slate-600 dark:bg-slate-900 dark:text-slate-300">
                    No case or review analytics available yet.
                  </div>
                ) : !mounted ? (
                  <div className="h-80 w-full animate-pulse rounded bg-slate-200 dark:bg-slate-700" />
                ) : (
                  <div className="h-80 w-full">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={caseChartData}
                          dataKey="value"
                          nameKey="name"
                          innerRadius={50}
                          outerRadius={80}
                          paddingAngle={4}
                        >
                          {caseChartData.map((entry, index) => (
                            <Cell
                              key={entry.name}
                              fill={CASE_COLORS[index % CASE_COLORS.length]}
                            />
                          ))}
                        </Pie>
                        <Tooltip />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                )}
              </div>

              <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-700 dark:bg-slate-800">
                <h2 className="mb-4 text-sm font-semibold text-slate-800 dark:text-slate-100">
                  User Composition
                </h2>
                {!stats ? (
                  <div className="h-80 w-full animate-pulse rounded bg-slate-200 dark:bg-slate-700" />
                ) : userChartData.length === 0 ? (
                  <div className="rounded-xl border border-dashed border-slate-300 bg-slate-50 px-4 py-6 text-center text-xs text-slate-500 dark:border-slate-600 dark:bg-slate-900 dark:text-slate-300">
                    No user analytics available yet.
                  </div>
                ) : !mounted ? (
                  <div className="h-80 w-full animate-pulse rounded bg-slate-200 dark:bg-slate-700" />
                ) : (
                  <div className="h-80 w-full">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={userChartData}>
                        <XAxis dataKey="name" />
                        <YAxis allowDecimals={false} />
                        <Tooltip />
                        <Bar dataKey="value" radius={[4, 4, 0, 0]}>
                          {userChartData.map((entry, index) => (
                            <Cell
                              key={entry.name}
                              fill={USER_COLORS[index % USER_COLORS.length]}
                            />
                          ))}
                        </Bar>
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                )}
              </div>
            </div>
          </div>

          <div>
            <h2 className="mb-3 text-sm font-semibold text-slate-700">
              Recent Activity
            </h2>
            <ActivityFeed />
          </div>
        </>
      )}
    </div>
  );
}

export default DashboardPage;
