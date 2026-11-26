import { useState, useMemo } from "react";

/**
 * StayEase — Reusable Responsive Data Table Component
 */
export default function DataTable({
  columns = [],
  data = [],
  searchPlaceholder = "Search records...",
  searchKey = "",
  pageSize = 6,
  emptyMessage = "No records found.",
  actions = null,
}) {
  const [query, setQuery] = useState("");
  const [currentPage, setCurrentPage] = useState(1);

  const filteredData = useMemo(() => {
    if (!query.trim()) return data;
    const q = query.toLowerCase();

    return data.filter((item) => {
      if (searchKey && item[searchKey]) {
        return String(item[searchKey]).toLowerCase().includes(q);
      }
      return Object.values(item).some(
        (val) => typeof val === "string" && val.toLowerCase().includes(q)
      );
    });
  }, [data, query, searchKey]);

  const totalPages = Math.max(1, Math.ceil(filteredData.length / pageSize));
  const pageIndex = Math.min(currentPage, totalPages);
  const paginatedData = filteredData.slice(
    (pageIndex - 1) * pageSize,
    pageIndex * pageSize
  );

  return (
    <div className="rounded-3xl border border-[#e9e5dc] bg-white p-5 shadow-xs dark:border-[#2a3c30] dark:bg-[#152019]">
      {/* Top Search & Actions Bar */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between mb-4 pb-3 border-b border-[#eeece6] dark:border-[#243329]">
        <div className="relative w-full max-w-sm">
          <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-xs text-[#858f87]">
            🔍
          </span>
          <input
            type="text"
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
              setCurrentPage(1);
            }}
            placeholder={searchPlaceholder}
            className="w-full rounded-xl border border-[#dedbd2] bg-[#fbf9f4] py-2 pl-9 pr-3 text-xs outline-none transition focus:border-[#244b38] dark:border-[#2d3d32] dark:bg-[#111914] dark:text-[#f0f4f0] dark:focus:border-[#34d399]"
          />
        </div>

        <div className="flex items-center gap-2">
          {actions}
          <span className="text-[11px] text-[#757b72] dark:text-[#9aa59d]">
            Total: <strong>{filteredData.length}</strong>
          </span>
        </div>
      </div>

      {/* Table Container */}
      <div className="overflow-x-auto">
        <table className="w-full text-left text-xs">
          <thead>
            <tr className="border-b border-[#eeece6] text-[10px] font-semibold uppercase tracking-wider text-[#858f87] dark:border-[#243329] dark:text-[#7f8f83]">
              {columns.map((col, idx) => (
                <th key={idx} className="pb-3 pr-4 font-semibold">
                  {col.header}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-[#f2efe8] dark:divide-[#1d2b22]">
            {paginatedData.length === 0 ? (
              <tr>
                <td
                  colSpan={columns.length}
                  className="py-12 text-center text-xs text-[#858f87] dark:text-[#88998d]"
                >
                  {emptyMessage}
                </td>
              </tr>
            ) : (
              paginatedData.map((row, rIdx) => (
                <tr
                  key={row.id || rIdx}
                  className="transition hover:bg-[#faf8f2] dark:hover:bg-[#19261e]"
                >
                  {columns.map((col, cIdx) => (
                    <td key={cIdx} className="py-3.5 pr-4 align-middle">
                      {col.cell
                        ? col.cell(row)
                        : typeof col.accessor === "function"
                        ? col.accessor(row)
                        : row[col.accessor]}
                    </td>
                  ))}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination Footer */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between border-t border-[#eeece6] pt-4 mt-3 text-xs dark:border-[#243329]">
          <span className="text-[11px] text-[#757b72] dark:text-[#9aa59d]">
            Page {pageIndex} of {totalPages}
          </span>
          <div className="flex items-center gap-1.5">
            <button
              type="button"
              disabled={pageIndex <= 1}
              onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
              className="rounded-lg border border-[#dedbd2] px-3 py-1.5 text-xs font-semibold disabled:opacity-40 transition hover:bg-[#f6f4ed] dark:border-[#2d3d32] dark:hover:bg-[#1f2d23]"
            >
              Previous
            </button>
            <button
              type="button"
              disabled={pageIndex >= totalPages}
              onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
              className="rounded-lg border border-[#dedbd2] px-3 py-1.5 text-xs font-semibold disabled:opacity-40 transition hover:bg-[#f6f4ed] dark:border-[#2d3d32] dark:hover:bg-[#1f2d23]"
            >
              Next
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

