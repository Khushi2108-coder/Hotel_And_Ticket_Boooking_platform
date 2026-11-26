/**
 * StayEase — Universal Status Badge for Booking & Entity states
 */
export default function StatusBadge({ status }) {
  const normalized = (status || "").toLowerCase();

  let styles = "bg-[#edf3ec] text-[#244b38] border-[#cbe0ce] dark:bg-[#1b3425] dark:text-[#34d399] dark:border-[#274f37]";

  if (["confirmed", "active", "approved", "completed"].includes(normalized)) {
    styles = "bg-[#edf3ec] text-[#244b38] border-[#cbe0ce] dark:bg-[#1b3425] dark:text-[#34d399] dark:border-[#274f37]";
  } else if (["checked-in", "scheduled"].includes(normalized)) {
    styles = "bg-[#eaf4fc] text-[#0284c7] border-[#bee3f8] dark:bg-[#0c2942] dark:text-[#38bdf8] dark:border-[#15466e]";
  } else if (["pending", "draft", "under review"].includes(normalized)) {
    styles = "bg-[#fef9ee] text-[#b45309] border-[#fde68a] dark:bg-[#2e1d08] dark:text-[#fbbf24] dark:border-[#4d320d]";
  } else if (["cancelled", "suspended", "rejected", "blocked"].includes(normalized)) {
    styles = "bg-[#fdf2f2] text-[#c53030] border-[#fed7d7] dark:bg-[#341212] dark:text-[#f87171] dark:border-[#5c1d1d]";
  } else if (["checked-out", "archived"].includes(normalized)) {
    styles = "bg-[#f4f3ef] text-[#636b63] border-[#dedcd2] dark:bg-[#202922] dark:text-[#9aa59d] dark:border-[#2f3d32]";
  }

  return (
    <span
      className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-semibold border ${styles}`}
    >
      <span className="h-1.5 w-1.5 rounded-full bg-current opacity-80" />
      <span>{status}</span>
    </span>
  );
}

