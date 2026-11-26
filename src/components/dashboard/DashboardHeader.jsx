import { Link } from "react-router-dom";

/**
 * StayEase — Reusable Dashboard Header with breadcrumbs, action button, and title
 */
export default function DashboardHeader({
  title,
  subtitle,
  eyebrow = "StayEase Portal",
  actionText,
  actionLink,
  onActionClick,
  actionIcon = "+",
  badge,
}) {
  return (
    <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between mb-8 pb-6 border-b border-[#e9e5dc] dark:border-[#2a3c30]">
      <div>
        <div className="flex items-center gap-2 mb-1.5">
          <span className="text-[10px] font-semibold uppercase tracking-[2px] text-[#b18a57] dark:text-[#fbbf24]">
            {eyebrow}
          </span>
          {badge && (
            <span className="rounded-full bg-[#edf3ec] px-2.5 py-0.5 text-[10px] font-bold text-[#244b38] dark:bg-[#1d3326] dark:text-[#34d399]">
              {badge}
            </span>
          )}
        </div>
        <h1 className="font-serif text-2xl font-medium sm:text-3xl text-[#244b38] dark:text-[#f0f4f0]">
          {title}
        </h1>
        {subtitle && (
          <p className="mt-1 text-xs text-[#757b72] sm:text-sm dark:text-[#9aa59d]">
            {subtitle}
          </p>
        )}
      </div>

      {(actionText || onActionClick) && (
        <div className="flex items-center gap-3">
          {actionLink ? (
            <Link
              to={actionLink}
              className="inline-flex items-center gap-2 rounded-xl bg-[#244b38] px-4 py-2.5 text-xs font-semibold text-white shadow-sm transition hover:bg-[#193829] active:scale-98 dark:bg-[#34d399] dark:text-[#0a120e] dark:hover:bg-[#28b881]"
            >
              <span>{actionIcon}</span>
              <span>{actionText}</span>
            </Link>
          ) : (
            <button
              type="button"
              onClick={onActionClick}
              className="inline-flex items-center gap-2 rounded-xl bg-[#244b38] px-4 py-2.5 text-xs font-semibold text-white shadow-sm transition hover:bg-[#193829] active:scale-98 dark:bg-[#34d399] dark:text-[#0a120e] dark:hover:bg-[#28b881]"
            >
              <span>{actionIcon}</span>
              <span>{actionText}</span>
            </button>
          )}
        </div>
      )}
    </div>
  );
}

