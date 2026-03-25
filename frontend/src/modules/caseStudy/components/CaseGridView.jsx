import { FileText } from "lucide-react";
import { Link } from "react-router-dom";
import StatusBadge from "../../../components/StatusBadge";

function CaseGridView({
  cases,
  role,
  user,
  onPublish,
  canEditCase,
  getCategoryTheme,
  normalizeCategory,
  normalizeStatus,
  categoryLabels,
}) {
  return (
    <div className="grid grid-cols-1 gap-5 md:grid-cols-2 xl:grid-cols-3">
      {cases.map((item) => {
        const theme = getCategoryTheme(item.category);

        return (
          <article
            key={item.id}
            className={`group flex h-full flex-col overflow-hidden rounded-2xl border border-slate-200 border-l-4 ${theme.cardAccent} ${theme.cardAccentHover} bg-white shadow-sm transition-all duration-300 hover:-translate-y-1 hover:shadow-xl dark:border-slate-800 dark:bg-slate-950`}
          >
            <div
              className={`h-32 bg-gradient-to-r ${theme.thumbnail} transition-all duration-300 group-hover:brightness-105`}
            />

            <div className="flex flex-1 flex-col p-5">
              <div className="mb-3 flex items-start justify-between gap-2">
                <h2 className="line-clamp-2 text-xl font-bold leading-tight text-slate-900 dark:text-slate-100">
                  {item.title}
                </h2>
                <div className="shrink-0">
                  <StatusBadge status={item.status} />
                </div>
              </div>

              <p className="mb-4 line-clamp-3 text-sm text-slate-600 dark:text-slate-300">
                {item.description}
              </p>

              <div className="mb-4 flex flex-wrap gap-2">
                {item.category && (
                  <span
                    className={`inline-flex items-center rounded-full border px-2.5 py-1 text-[11px] font-semibold uppercase tracking-wide ${theme.pill}`}
                  >
                    {categoryLabels[normalizeCategory(item.category)] || item.category}
                  </span>
                )}
                {item.difficulty && (
                  <span className="inline-flex items-center rounded-full border border-slate-300 bg-slate-100 px-2.5 py-1 text-[11px] font-semibold uppercase tracking-wide text-slate-700 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-300">
                    {String(item.difficulty).replaceAll("_", " ")}
                  </span>
                )}
                {item.submissionType && (
                  <span className="inline-flex items-center rounded-full border border-violet-200 bg-violet-50 px-2.5 py-1 text-[11px] font-semibold uppercase tracking-wide text-violet-700 dark:border-violet-500/40 dark:bg-violet-950/40 dark:text-violet-200">
                    {String(item.submissionType).replaceAll("_", " ")}
                  </span>
                )}
                {item.groupSubmissionEnabled && (
                  <span className="inline-flex items-center rounded-full border border-violet-200 bg-violet-50 px-2.5 py-1 text-[11px] font-semibold uppercase tracking-wide text-violet-700 dark:border-violet-500/40 dark:bg-violet-950/40 dark:text-violet-200">
                    Group
                  </span>
                )}
                {item.dueDate && (
                  <span className="inline-flex items-center rounded-full border border-slate-300 bg-white px-2.5 py-1 text-[11px] font-semibold uppercase tracking-wide text-slate-700 dark:border-slate-600 dark:bg-slate-900 dark:text-slate-300">
                    Due {new Date(item.dueDate).toLocaleDateString()}
                  </span>
                )}
                {item.submissionCount != null && item.submissionCount > 0 && (
                  <span className="inline-flex items-center gap-1 rounded-full border border-slate-300 bg-white px-2.5 py-1 text-[11px] font-semibold uppercase tracking-wide text-slate-700 dark:border-slate-600 dark:bg-slate-900 dark:text-slate-300">
                    <FileText className="h-3 w-3" />
                    {item.submissionCount} submission{item.submissionCount !== 1 ? "s" : ""}
                  </span>
                )}
              </div>

              <div className="mt-auto flex flex-wrap gap-2">
                <Link
                  to={`/cases/${item.id}`}
                  className="inline-flex items-center rounded-md bg-slate-900 px-3 py-1.5 text-xs font-semibold text-white transition hover:bg-slate-700 dark:bg-slate-100 dark:text-slate-900 dark:hover:bg-slate-300"
                >
                  View
                </Link>

                {canEditCase() && (
                  <Link
                    to={`/cases/${item.id}/edit`}
                    className="inline-flex items-center rounded-md border border-slate-300 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 transition hover:bg-slate-50 dark:border-slate-600 dark:bg-slate-900 dark:text-slate-200 dark:hover:bg-slate-800"
                  >
                    Edit
                  </Link>
                )}

                {(role === "ADMIN" || (role === "FACULTY" && item.createdBy === user?.id)) &&
                  normalizeStatus(item.status) === "DRAFT" && (
                    <button
                      onClick={() => onPublish(item.id)}
                      className="inline-flex items-center rounded-md bg-emerald-600 px-3 py-1.5 text-xs font-semibold text-white transition hover:bg-emerald-700"
                    >
                      Publish
                    </button>
                  )}
              </div>
            </div>
          </article>
        );
      })}
    </div>
  );
}

export default CaseGridView;
