function KpiCard({
  title,
  value,
  icon: Icon,
  trend,
  description,
  loading = false,
}) {
  if (loading) {
    return (
      <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm animate-pulse">
        <div className="flex items-center justify-between gap-4">
          <div className="flex-1">
            <div className="mb-3 h-4 w-24 rounded bg-slate-200"></div>
            <div className="h-8 w-32 rounded bg-slate-200"></div>
          </div>
          <div className="h-12 w-12 rounded-lg bg-slate-200"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="group rounded-xl border border-slate-200 bg-white p-6 shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md">
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0 flex-1">
          <div className="mb-2">
            <h3 className="text-sm font-medium uppercase tracking-wide text-slate-600">
              {title}
            </h3>
          </div>

          <p className="mb-1 text-2xl font-semibold text-slate-900">{value}</p>

          {description && <p className="text-sm text-slate-500">{description}</p>}

          {trend && (
            <div className="mt-3">
              <span
                className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${
                  trend.isPositive
                    ? "bg-emerald-100 text-emerald-700"
                    : "bg-red-100 text-red-700"
                }`}
              >
                {trend.isPositive ? "\u2191" : "\u2193"} {Math.abs(trend.value)}% vs last week
              </span>
            </div>
          )}
        </div>

        {Icon && (
          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-lg bg-blue-50 text-blue-600 transition-colors group-hover:bg-blue-100">
            <Icon size={24} className="h-6 w-6" />
          </div>
        )}
      </div>
    </div>
  );
}

export default KpiCard;
