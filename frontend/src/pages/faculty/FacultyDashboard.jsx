import { useContext, useMemo } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import {
  ArrowRight,
  BarChart3,
  ClipboardCheck,
  FolderKanban,
  Globe2,
  ListChecks,
  PlusCircle,
} from "lucide-react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import ActivityFeed from "../../components/ActivityFeed";
import StatusBadge from "../../components/StatusBadge";
import KpiCard from "../../components/KpiCard";
import { AuthContext } from "../../context/AuthContext";
import { getFacultyDashboard } from "../../services/facultyDashboardService";
import caseService from "../../modules/caseStudy/services/caseService";
import { getPendingStudents } from "../../api/userService";

function FacultyDashboard() {
  const navigate = useNavigate();
  const { user } = useContext(AuthContext);

  const { data, isLoading, isError } = useQuery({
    queryKey: ["faculty-dashboard", user?.id || user?.email || "faculty"],
    queryFn: getFacultyDashboard,
    enabled: !!user,
    refetchOnMount: "always",
  });

  const {
    data: caseData,
    isLoading: isLoadingCases,
    isError: isCasesError,
  } = useQuery({
    queryKey: ["faculty-cases-dashboard", user?.id || user?.email || "faculty"],
    queryFn: () => caseService.getAllCases({ page: 0, size: 5 }),
    enabled: !!user,
    refetchOnMount: "always",
  });

  const {
    data: pendingStudents = [],
    isError: isPendingStudentsError,
  } = useQuery({
    queryKey: ["pending-students", user?.id || user?.email || "faculty"],
    queryFn: getPendingStudents,
    enabled: !!user,
    staleTime: 30000,
    refetchOnMount: "always",
  });

  const pendingStudentsCount = Array.isArray(pendingStudents) ? pendingStudents.length : 0;

  const stats = {
    totalCases: data?.totalCases ?? 0,
    ownCases: data?.ownCases ?? 0,
    pendingReviews: data?.pendingReviews ?? 0,
    evaluatedSubmissions: data?.evaluatedSubmissions ?? 0,
  };

  const chartData = [
    { name: "Pending", value: stats.pendingReviews },
    { name: "Evaluated", value: stats.evaluatedSubmissions },
  ];

  const myCases = useMemo(() => {
    const items = caseData?.content || caseData || [];
    return items.slice(0, 5);
  }, [caseData]);

  if (isError) {
    return (
      <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700 dark:border-red-500/30 dark:bg-red-950/30 dark:text-red-300">
        Unable to load faculty dashboard metrics. Please try again.
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <section className="rounded-2xl bg-slate-100 px-6 py-10 dark:bg-slate-900/80 md:px-10">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <h1 className="text-4xl font-bold tracking-tight text-slate-900 dark:text-slate-100">
              Welcome, {user?.fullName || user?.name || "Faculty"}
            </h1>
            <p className="mt-2 text-sm text-slate-600 dark:text-slate-300 md:text-base">
              Track your cases, pending reviews, and evaluation progress.
            </p>
          </div>
          <span className="inline-flex items-center rounded-full border border-slate-300 bg-white px-4 py-1.5 text-xs font-semibold uppercase tracking-wide text-slate-700 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-200">
            FACULTY
          </span>
        </div>
      </section>

      {isPendingStudentsError && (
        <div className="rounded-xl border border-red-200 border-l-4 border-l-red-400 bg-red-50 px-4 py-3 text-sm text-red-800 dark:border-red-500/40 dark:border-l-red-400 dark:bg-red-950/30 dark:text-red-200">
          Unable to load student requests right now. Please refresh.
        </div>
      )}

      {pendingStudentsCount > 0 && (
        <div className="flex items-center justify-between rounded-xl border border-amber-200 border-l-4 border-l-amber-400 bg-amber-50 px-4 py-3 dark:border-amber-500/40 dark:border-l-amber-400 dark:bg-amber-950/30">
          <p className="text-sm text-amber-800 dark:text-amber-200">
            {pendingStudentsCount} student{pendingStudentsCount === 1 ? "" : "s"} waiting for your approval
          </p>
          <button
            onClick={() => navigate("/faculty/pending-students")}
            className="inline-flex items-center gap-1 text-xs font-semibold text-amber-800 hover:underline dark:text-amber-200"
          >
            Review Now <ArrowRight className="h-3.5 w-3.5" />
          </button>
        </div>
      )}

      <div className="grid grid-cols-1 gap-5 md:grid-cols-2 xl:grid-cols-4">
        {isLoading ? (
          <>
            <KpiCard title="Visible Cases" icon={<Globe2 className="h-5 w-5" />} loading />
            <KpiCard title="My Cases" icon={<FolderKanban className="h-5 w-5" />} loading />
            <KpiCard title="Pending Reviews" icon={<ClipboardCheck className="h-5 w-5" />} loading />
            <KpiCard title="Evaluated" icon={<BarChart3 className="h-5 w-5" />} loading />
          </>
        ) : (
          <>
            <KpiCard
              title="Visible Cases"
              value={stats.totalCases}
              icon={<Globe2 className="h-5 w-5" />}
              description="All published cases plus your drafts"
            />
            <KpiCard
              title="My Cases"
              value={stats.ownCases}
              icon={<FolderKanban className="h-5 w-5" />}
              description="Cases you have created"
            />
            <KpiCard
              title="Pending Reviews"
              value={stats.pendingReviews}
              icon={<ClipboardCheck className="h-5 w-5" />}
              description="Submissions to evaluate"
            />
            <KpiCard
              title="Evaluated"
              value={stats.evaluatedSubmissions}
              icon={<BarChart3 className="h-5 w-5" />}
              description="Completed evaluations"
            />
          </>
        )}
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <button
          onClick={() => navigate("/cases/new")}
          className="flex items-center gap-3 rounded-xl border border-slate-900 bg-slate-900 p-4 text-left text-white shadow-sm transition-all duration-300 hover:scale-[1.02] hover:shadow-xl dark:border-slate-200 dark:bg-slate-100 dark:text-slate-900"
        >
          <PlusCircle className="h-5 w-5" />
          <div>
            <div className="text-sm font-semibold">Create Case</div>
            <div className="text-xs text-slate-200 dark:text-slate-700">Start a new case study.</div>
          </div>
        </button>

        <button
          onClick={() => navigate("/faculty/submissions")}
          className="flex items-center gap-3 rounded-xl border border-slate-200 bg-white p-4 text-left shadow-sm transition-all duration-300 hover:scale-[1.02] hover:shadow-xl dark:border-slate-800 dark:bg-slate-900"
        >
          <ClipboardCheck className="h-5 w-5 text-emerald-600" />
          <div>
            <div className="text-sm font-semibold text-slate-800 dark:text-slate-100">Review Queue</div>
            <div className="text-xs text-slate-500 dark:text-slate-400">Evaluate pending submissions.</div>
          </div>
        </button>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900">
          <h2 className="mb-4 text-sm font-semibold text-slate-800 dark:text-slate-100">
            Submission Status
          </h2>
          {isLoading ? (
            <div className="h-72 animate-pulse rounded bg-slate-200 dark:bg-slate-800" />
          ) : (
            <div className="h-72 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgb(148 163 184 / 0.25)" />
                  <XAxis dataKey="name" stroke="#64748b" />
                  <YAxis allowDecimals={false} stroke="#64748b" />
                  <Tooltip />
                  <Bar dataKey="value" radius={[8, 8, 0, 0]} fill="#0f172a" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}
        </div>

        <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900">
          <h2 className="mb-4 text-sm font-semibold text-slate-800 dark:text-slate-100">Recent Activity</h2>
          <ActivityFeed maxItems={6} />
        </div>
      </div>

      <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900">
        <div className="mb-4 flex items-center justify-between gap-3">
          <h2 className="text-sm font-semibold text-slate-800 dark:text-slate-100">Visible Cases</h2>
          <Link to="/cases" className="text-xs font-semibold text-slate-700 hover:underline dark:text-slate-300">
            View All Cases
          </Link>
        </div>

        {isLoadingCases ? (
          <div className="space-y-3">
            {Array.from({ length: 4 }).map((_, index) => (
              <div key={index} className="h-16 animate-pulse rounded bg-slate-200 dark:bg-slate-800" />
            ))}
          </div>
        ) : isCasesError ? (
          <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-8 text-center text-sm text-red-700 dark:border-red-500/30 dark:bg-red-950/30 dark:text-red-300">
            Failed to load visible cases.
          </div>
        ) : myCases.length === 0 ? (
          <div className="rounded-xl border border-dashed border-slate-300 px-4 py-8 text-center text-sm text-slate-500 dark:border-slate-700 dark:text-slate-400">
            No visible cases yet.
          </div>
        ) : (
          <div className="space-y-3">
            {myCases.map((item) => (
              <div
                key={item.id}
                className="flex flex-col gap-3 rounded-xl border border-slate-200 bg-white p-4 shadow-sm transition-all duration-300 hover:scale-[1.02] hover:shadow-xl dark:border-slate-700 dark:bg-slate-950 md:flex-row md:items-center md:justify-between"
              >
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <p className="truncate text-sm font-semibold text-slate-800 dark:text-slate-100">{item.title}</p>
                    <StatusBadge status={item.status} />
                  </div>
                  <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                    {item.submissionCount} submission{item.submissionCount === 1 ? "" : "s"}
                  </p>
                </div>

                <div className="flex flex-wrap gap-2">
                  <Link
                    to={`/cases/${item.id}/edit`}
                    className="inline-flex items-center rounded-md border border-slate-300 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 transition hover:bg-slate-50 dark:border-slate-600 dark:bg-slate-900 dark:text-slate-200 dark:hover:bg-slate-800"
                  >
                    Edit
                  </Link>
                  <Link
                    to={`/cases/${item.id}/submissions`}
                    className="inline-flex items-center rounded-md bg-slate-900 px-3 py-1.5 text-xs font-semibold text-white transition hover:bg-slate-700 dark:bg-slate-100 dark:text-slate-900 dark:hover:bg-slate-300"
                  >
                    <ListChecks className="mr-1 h-3.5 w-3.5" />
                    View Submissions
                  </Link>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

    </div>
  );
}

export default FacultyDashboard;
