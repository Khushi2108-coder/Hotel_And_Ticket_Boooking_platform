/**
 * StayEase — Metric / KPI Card for Owner & Admin Dashboards
 */
export default function DashboardStatsCard({
  title,
  value,
  change,
  isPositive = true,
  icon = "✦",
  caption,
  prefix = "",
  suffix = "",
}) {
  return (
    <div className="group relative overflow-hidden rounded-2xl border border-[#e9e5dc] bg-white p-5 shadow-xs transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md dark:border-[#2a3c30] dark:bg-[#152019]">
      <div className="flex items-center justify-between">
        <p className="text-xs font-medium uppercase tracking-wider text-[#757b72] dark:text-[#9aa59d]">
          {title}
        </p>
        <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#edf3ec] text-sm text-[#244b38] dark:bg-[#1e3426] dark:text-[#34d399]">
          {icon}
        </span>
      </div>

      <div className="mt-3 flex items-baseline gap-1">
        {prefix && (
          <span className="font-serif text-xl font-medium text-[#244b38] dark:text-[#34d399]">
            {prefix}
          </span>
        )}
        <h2 className="font-serif text-2xl font-bold sm:text-3xl text-[#244b38] dark:text-[#f0f4f0]">
          {value}
        </h2>
        {suffix && (
          <span className="text-xs text-[#757b72] dark:text-[#9aa59d] ml-1">
            {suffix}
          </span>
        )}
      </div>

      {(change || caption) && (
        <div className="mt-2.5 flex items-center gap-1.5 text-[11px]">
          {change && (
            <span
              className={`font-semibold ${
                isPositive
                  ? "text-[#287a4c] dark:text-[#34d399]"
                  : "text-[#c53030] dark:text-[#f87171]"
              }`}
            >
              {isPositive ? "↑" : "↓"} {change}
            </span>
          )}
          {caption && (
            <span className="text-[#858f87] dark:text-[#7f8e83]">
              {caption}
            </span>
          )}
        </div>
      )}
    </div>
  );
}

