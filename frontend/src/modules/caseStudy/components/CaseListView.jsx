import { FileText } from "lucide-react";
import { Link } from "react-router-dom";
import StatusBadge from "../../../components/StatusBadge";

function highlightText(text, query) {
  if (!query || !query.trim() || !text) {
    return text;
  }

  const safeQuery = query.trim().replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const regex = new RegExp(`(${safeQuery})`, "ig");
  const parts = String(text).split(regex);

  return parts.map((part, index) =>
    part.toLowerCase() === query.trim().toLowerCase() ? (
      <mark
        key={`${part}-${index}`}
        className="rounded bg-amber-100 px-0.5 text-slate-900 dark:bg-amber-400/30 dark:text-slate-100"
      >
        {part}
      </mark>
    ) : (
      <span key={`${part}-${index}`}>{part}</span>
    )
  );
}

function CaseListView({ cases, query, normalizeCategory, categoryLabels }) {
  return (
    <div className="space-y-3">
      {cases.map((item) => {
        const tags = Array.isArray(item.tags) ? item.tags : [];
        const previewTags = tags.slice(0, 3);
        const remainingTagCount = Math.max(tags.length - previewTags.length, 0);

        return (
          <article
            key={item.id}
            className="rounded-xl border border-slate-200 bg-white px-4 py-4 shadow-sm transition hover:border-slate-300 dark:border-slate-800 dark:bg-slate-950 dark:hover:border-slate-700"
          >
            <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
              <div className="min-w-0 space-y-2">
                <Link
                  to={`/cases/${item.id}`}
                  className="block truncate text-base font-semibold text-slate-900 hover:underline dark:text-slate-100"
                >
                  {highlightText(item.title, query)}
                </Link>

                <div className="flex flex-wrap items-center gap-2 text-xs text-slate-600 dark:text-slate-300">
                  {item.companyName && (
                    <span className="rounded-full bg-slate-100 px-2.5 py-1 dark:bg-slate-800">
                      {item.companyName}
                    </span>
                  )}
                  {item.industry && (
                    <span className="rounded-full bg-slate-100 px-2.5 py-1 dark:bg-slate-800">
                      {item.industry}
                    </span>
                  )}
                  {item.category && (
                    <span className="rounded-full border border-blue-200 bg-blue-50 px-2.5 py-1 font-semibold uppercase tracking-wide text-blue-700 dark:border-blue-500/30 dark:bg-blue-950/40 dark:text-blue-200">
                      {categoryLabels[normalizeCategory(item.category)] || item.category}
                    </span>
                  )}
                  {item.difficulty && (
                    <span className="rounded-full border border-slate-300 bg-white px-2.5 py-1 font-semibold uppercase tracking-wide text-slate-700 dark:border-slate-600 dark:bg-slate-900 dark:text-slate-300">
                      {String(item.difficulty).replaceAll("_", " ")}
                    </span>
                  )}
                </div>

                {previewTags.length > 0 && (
                  <div className="flex flex-wrap items-center gap-1.5">
                    {previewTags.map((tag) => (
                      <span
                        key={`${item.id}-${tag}`}
                        className="rounded-full bg-slate-100 px-2 py-1 text-[11px] font-medium text-slate-600 dark:bg-slate-800 dark:text-slate-300"
                      >
                        #{tag}
                      </span>
                    ))}
                    {remainingTagCount > 0 && (
                      <span className="rounded-full bg-slate-200 px-2 py-1 text-[11px] font-medium text-slate-600 dark:bg-slate-700 dark:text-slate-300">
                        +{remainingTagCount}
                      </span>
                    )}
                  </div>
                )}
              </div>

              <div className="grid grid-cols-2 gap-x-5 gap-y-2 text-xs text-slate-600 dark:text-slate-300 sm:grid-cols-4 lg:w-[540px]">
                <div>
                  <p className="text-[10px] uppercase tracking-wide text-slate-400">Submissions</p>
                  <p className="mt-1 inline-flex items-center gap-1 text-sm font-semibold text-slate-800 dark:text-slate-100">
                    <FileText className="h-3.5 w-3.5" />
                    {item.submissionCount ?? 0}
                  </p>
                </div>
                <div>
                  <p className="text-[10px] uppercase tracking-wide text-slate-400">Due Date</p>
                  <p className="mt-1 text-sm font-semibold text-slate-800 dark:text-slate-100">
                    {item.dueDate ? new Date(item.dueDate).toLocaleDateString() : "N/A"}
                  </p>
                </div>
                <div>
                  <p className="text-[10px] uppercase tracking-wide text-slate-400">Status</p>
                  <div className="mt-1">
                    <StatusBadge status={item.status} />
                  </div>
                </div>
                <div className="flex items-end justify-start sm:justify-end">
                  <Link
                    to={`/cases/${item.id}`}
                    className="inline-flex items-center rounded-md border border-slate-300 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 transition hover:bg-slate-50 dark:border-slate-600 dark:bg-slate-900 dark:text-slate-200 dark:hover:bg-slate-800"
                  >
                    View
                  </Link>
                </div>
              </div>
            </div>
          </article>
        );
      })}
    </div>
  );
}

export default CaseListView;
