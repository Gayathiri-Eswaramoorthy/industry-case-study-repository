import { useContext, useMemo } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import {
  BarChart3,
  BarChartBig,
  ClipboardCheck,
  FolderKanban,
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
import KpiCard from "../../components/KpiCard";
import ActivityFeed from "../../components/ActivityFeed";
import StatusBadge from "../../components/StatusBadge";
import { AuthContext } from "../../context/AuthContext";
import { getFacultyDashboard } from "../../services/facultyDashboardService";
import caseService from "../../modules/caseStudy/services/caseService";
import facultySubmissionService from "../../services/facultySubmissionService";

function FacultyDashboard() {
  const navigate = useNavigate();
  const { user } = useContext(AuthContext);

  const { data, isLoading, isError } = useQuery({
    queryKey: ["faculty-dashboard"],
    queryFn: getFacultyDashboard,
  });

  const { data: caseData = [], isLoading: isLoadingCases } = useQuery({
    queryKey: ["faculty-cases-dashboard"],
    queryFn: () => caseService.getAllCases({ courseId: 1 }),
  });

  const { data: submissions = [] } = useQuery({
    queryKey: ["faculty-submissions"],
    queryFn: () => facultySubmissionService.getFacultySubmissions(),
  });

  const stats = {
    totalCases: data?.totalCases ?? 0,
    pendingReviews: data?.pendingReviews ?? 0,
    evaluatedSubmissions: data?.evaluatedSubmissions ?? 0,
    activeCases: data?.activeCases ?? 0,
  };

  const chartData = [
    { name: "Pending", value: stats.pendingReviews },
    { name: "Evaluated", value: stats.evaluatedSubmissions },
  ];

  const myCases = useMemo(() => {
    const items = Array.isArray(caseData) ? caseData : [];
    const facultyId = user?.id;

    const filtered = facultyId
      ? items.filter((item) => item?.createdBy === facultyId)
      : items;

    const submissionCounts = (Array.isArray(submissions) ? submissions : []).reduce(
      (accumulator, submission) => {
        if (submission?.caseId == null) {
          return accumulator;
        }
        accumulator[submission.caseId] = (accumulator[submission.caseId] ?? 0) + 1;
        return accumulator;
      },
      {}
    );

    return filtered.slice(0, 5).map((item) => ({
      ...item,
      submissionCount: submissionCounts[item.id] ?? 0,
    }));
  }, [caseData, submissions, user?.id]);

  if (isError) {
    return (
      <div className="bg-red-900 text-red-300 p-4 rounded">
        Unable to load faculty dashboard metrics. Please try again.
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-slate-900 dark:text-slate-100">
          Faculty Dashboard
        </h1>
        <p className="text-sm text-slate-500 dark:text-slate-400">
          Track your case studies and evaluate student submissions.
        </p>
      </div>

      <div className="grid grid-cols-1 gap-6 md:grid-cols-2 xl:grid-cols-4">
        {isLoading ? (
          <>
            <KpiCard loading />
            <KpiCard loading />
            <KpiCard loading />
            <KpiCard loading />
          </>
        ) : (
          <>
            <KpiCard
              title="Total Cases Created"
              value={stats.totalCases}
              icon={<FolderKanban className="h-5 w-5" />}
            />
            <KpiCard
              title="Pending Reviews"
              value={stats.pendingReviews}
              icon={<ClipboardCheck className="h-5 w-5" />}
            />
            <KpiCard
              title="Evaluated Submissions"
              value={stats.evaluatedSubmissions}
              icon={<BarChart3 className="h-5 w-5" />}
            />
            <KpiCard
              title="Active Cases"
              value={stats.activeCases}
              icon={<BarChartBig className="h-5 w-5" />}
            />
          </>
        )}
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <button
          onClick={() => navigate("/cases/new")}
          className="flex items-center gap-3 rounded-xl border border-slate-200 bg-white p-4 text-left shadow-sm transition hover:border-blue-300 hover:shadow-md dark:border-slate-800 dark:bg-slate-900"
        >
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-50 text-blue-600">
            <PlusCircle className="h-5 w-5" />
          </div>
          <div className="text-sm font-semibold text-slate-800 dark:text-slate-100">
            Create New Case
          </div>
        </button>

        <button
          onClick={() => navigate("/faculty/submissions")}
          className="flex items-center gap-3 rounded-xl border border-slate-200 bg-white p-4 text-left shadow-sm transition hover:border-emerald-300 hover:shadow-md dark:border-slate-800 dark:bg-slate-900"
        >
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-emerald-50 text-emerald-600">
            <ClipboardCheck className="h-5 w-5" />
          </div>
          <div className="text-sm font-semibold text-slate-800 dark:text-slate-100">
            Review Submissions
          </div>
        </button>

        <button
          onClick={() => navigate("/faculty/analytics")}
          className="flex items-center gap-3 rounded-xl border border-slate-200 bg-white p-4 text-left shadow-sm transition hover:border-violet-300 hover:shadow-md dark:border-slate-800 dark:bg-slate-900"
        >
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-violet-50 text-violet-600">
            <BarChart3 className="h-5 w-5" />
          </div>
          <div className="text-sm font-semibold text-slate-800 dark:text-slate-100">
            View Analytics
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
            <div className="w-full h-80">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={chartData}>
                  <CartesianGrid
                    strokeDasharray="3 3"
                    stroke="rgb(148 163 184 / 0.25)"
                  />
                  <XAxis dataKey="name" stroke="#94a3b8" />
                  <YAxis allowDecimals={false} stroke="#94a3b8" />
                  <Tooltip />
                  <Bar dataKey="value" radius={[8, 8, 0, 0]} fill="#38bdf8" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}
        </div>

        <div>
          <ActivityFeed maxItems={6} />
        </div>
      </div>

      <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900">
        <div className="mb-4 flex items-center justify-between gap-3">
          <h2 className="text-sm font-semibold text-slate-800 dark:text-slate-100">
            My Cases
          </h2>
          <Link
            to="/cases"
            className="text-xs font-medium text-blue-600 hover:underline"
          >
            View All Cases
          </Link>
        </div>

        {isLoadingCases ? (
          <div className="space-y-3">
            {Array.from({ length: 4 }).map((_, index) => (
              <div
                key={index}
                className="h-14 animate-pulse rounded bg-slate-100 dark:bg-slate-800"
              />
            ))}
          </div>
        ) : myCases.length === 0 ? (
          <div className="rounded-lg border border-dashed border-slate-300 px-4 py-6 text-center text-xs text-slate-500 dark:border-slate-700 dark:text-slate-400">
            No cases created yet.
          </div>
        ) : (
          <div className="space-y-3">
            {myCases.map((item) => (
              <div
                key={item.id}
                className="flex flex-col gap-3 rounded-lg border border-slate-200 bg-slate-50 p-4 dark:border-slate-700 dark:bg-slate-900/60 md:flex-row md:items-center md:justify-between"
              >
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <p className="truncate text-sm font-semibold text-slate-800 dark:text-slate-100">
                      {item.title}
                    </p>
                    <StatusBadge status={item.status} />
                  </div>
                  <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                    {item.submissionCount} submission{item.submissionCount === 1 ? "" : "s"}
                  </p>
                </div>

                <div className="flex flex-wrap gap-2">
                  <Link
                    to={`/cases/${item.id}/edit`}
                    className="inline-flex items-center rounded-md border border-slate-300 bg-white px-3 py-1.5 text-xs font-medium text-slate-700 shadow-sm transition hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100"
                  >
                    Edit
                  </Link>
                  <Link
                    to={`/cases/${item.id}/submissions`}
                    className="inline-flex items-center rounded-md bg-blue-600 px-3 py-1.5 text-xs font-medium text-white shadow-sm transition hover:bg-blue-700"
                  >
                    View Submissions
                  </Link>
                </div>
              </div>
            ))}

            <div className="pt-1">
              <Link
                to="/cases"
                className="inline-flex items-center gap-1 text-xs font-medium text-blue-600 hover:underline"
              >
                <ListChecks className="h-3.5 w-3.5" />
                View All Cases
              </Link>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default FacultyDashboard;
