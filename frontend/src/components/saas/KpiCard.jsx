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
            <div className="h-4 w-24 bg-slate-200 rounded mb-3"></div>
            <div className="h-8 w-32 bg-slate-200 rounded"></div>
          </div>
          <div className="h-12 w-12 bg-slate-200 rounded-lg"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="group bg-white rounded-xl border border-slate-200 p-6 shadow-sm transition-all duration-200 hover:shadow-md hover:-translate-y-0.5">
      <div className="flex items-start justify-between gap-4">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-2">
            <h3 className="text-sm font-medium text-slate-600 uppercase tracking-wide">
              {title}
            </h3>
            {trend && (
              <span
                className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${
                  trend.isPositive
                    ? "bg-emerald-100 text-emerald-700"
                    : "bg-red-100 text-red-700"
                }`}
              >
                {trend.isPositive ? "↑" : "↓"} {Math.abs(trend.value)}%
              </span>
            )}
          </div>

          <p className="text-2xl font-semibold text-slate-900 mb-1">{value}</p>

          {description && (
            <p className="text-sm text-slate-500">{description}</p>
          )}
        </div>

        {Icon && (
          <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-blue-50 text-blue-600 group-hover:bg-blue-100 transition-colors">
            <Icon size={24} className="h-6 w-6" />
          </div>
        )}
      </div>
    </div>
  );
}

export default KpiCard;
