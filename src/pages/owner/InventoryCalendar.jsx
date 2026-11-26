import { useState } from "react";
import OwnerSidebar from "../../components/dashboard/OwnerSidebar";
import DashboardHeader from "../../components/dashboard/DashboardHeader";
import { mockOwnerProperties, mockOwnerRooms } from "../../data/mockDashboardData";
import { useCurrency } from "../../context/CurrencyContext";

/**
 * StayEase — Owner Inventory Calendar (/owner/calendar)
 *
 * Features:
 * - Property and Room type selector
 * - Monthly view matrix
 * - Daily room availability counters
 * - Block / Unblock date actions
 * - Interactive date-rate editor modal
 */
export default function InventoryCalendar({ onNotify }) {
  const { formatPrice } = useCurrency();
  const [selectedPropertyId, setSelectedPropertyId] = useState(mockOwnerProperties[0].id);
  const [selectedRoomId, setSelectedRoomId] = useState(mockOwnerRooms[0].id);

  const [currentMonth, setCurrentMonth] = useState(new Date(2026, 10, 1)); // November 2026
  const [blockedDays, setBlockedDays] = useState(["2026-11-20", "2026-11-21"]);
  const [customRates, setCustomRates] = useState({
    "2026-11-27": 5800,
    "2026-11-28": 5800,
  });

  const [selectedDate, setSelectedDate] = useState(null);
  const [editPrice, setEditPrice] = useState("");
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);

  const monthNames = [
    "January", "February", "March", "April", "May", "June",
    "July", "August", "September", "October", "November", "December",
  ];
  const daysOfWeek = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

  const year = currentMonth.getFullYear();
  const month = currentMonth.getMonth();

  const firstDayIndex = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();

  const activeRoom = mockOwnerRooms.find((r) => r.id === selectedRoomId) || mockOwnerRooms[0];

  const handlePrevMonth = () => {
    setCurrentMonth(new Date(year, month - 1, 1));
  };

  const handleNextMonth = () => {
    setCurrentMonth(new Date(year, month + 1, 1));
  };

  const toDateStr = (d) => {
    const y = currentMonth.getFullYear();
    const m = String(currentMonth.getMonth() + 1).padStart(2, "0");
    const day = String(d).padStart(2, "0");
    return `${y}-${m}-${day}`;
  };

  const handleCellClick = (d) => {
    const dateStr = toDateStr(d);
    setSelectedDate(dateStr);
    setEditPrice(customRates[dateStr] || activeRoom.basePrice);
    setIsEditModalOpen(true);
  };

  const handleSaveCell = (e) => {
    e.preventDefault();
    if (!selectedDate) return;

    if (editPrice && Number(editPrice) !== activeRoom.basePrice) {
      setCustomRates((prev) => ({ ...prev, [selectedDate]: Number(editPrice) }));
    }

    if (onNotify) {
      onNotify({
        type: "success",
        title: "Inventory Updated",
        message: `Inventory and rate adjusted for ${selectedDate}.`,
      });
    }

    setIsEditModalOpen(false);
  };

  const toggleBlockDate = (dateStr) => {
    setBlockedDays((prev) =>
      prev.includes(dateStr) ? prev.filter((d) => d !== dateStr) : [...prev, dateStr]
    );
    if (onNotify) {
      onNotify({
        type: "info",
        title: "Availability Toggled",
        message: `Date ${dateStr} is now ${blockedDays.includes(dateStr) ? "Open" : "Blocked"}.`,
      });
    }
    setIsEditModalOpen(false);
  };

  // Calendar cells
  const gridCells = [];
  for (let i = 0; i < firstDayIndex; i++) {
    gridCells.push(null);
  }
  for (let d = 1; d <= daysInMonth; d++) {
    gridCells.push(d);
  }

  return (
    <div className="flex min-h-screen bg-[#fcfbf8] text-[#26382d] transition-colors duration-300 dark:bg-[#0c120e] dark:text-[#f0f4f0]">
      <OwnerSidebar />

      <main className="flex-1 overflow-y-auto px-5 py-8 sm:px-8 lg:px-12">
        <DashboardHeader
          title="Inventory Calendar & Rate Matrix"
          subtitle="Inspect date-by-date unit allotments, set custom rates, or block dates."
          eyebrow="Availability Engine"
        />

        {/* Filter Controls Row */}
        <div className="flex flex-wrap items-center justify-between gap-4 mb-6 rounded-2xl border border-[#e9e5dc] bg-white p-4 text-xs dark:border-[#2a3c30] dark:bg-[#152019]">
          <div className="flex flex-wrap items-center gap-3">
            <div>
              <label className="text-[10px] text-[#757b72] block font-semibold">Property</label>
              <select
                value={selectedPropertyId}
                onChange={(e) => setSelectedPropertyId(e.target.value)}
                className="rounded-xl border border-[#dedbd2] bg-[#fbf9f4] px-3 py-1.5 outline-none font-medium dark:border-[#2d3d32] dark:bg-[#111914]"
              >
                {mockOwnerProperties.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="text-[10px] text-[#757b72] block font-semibold">Room Category</label>
              <select
                value={selectedRoomId}
                onChange={(e) => setSelectedRoomId(e.target.value)}
                className="rounded-xl border border-[#dedbd2] bg-[#fbf9f4] px-3 py-1.5 outline-none font-medium dark:border-[#2d3d32] dark:bg-[#111914]"
              >
                {mockOwnerRooms
                  .filter((r) => r.propertyId === selectedPropertyId)
                  .map((r) => (
                    <option key={r.id} value={r.id}>
                      {r.name} ({r.totalUnits} units)
                    </option>
                  ))}
              </select>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handlePrevMonth}
              className="flex h-9 w-9 items-center justify-center rounded-xl border border-[#dedbd2] hover:bg-[#f6f4ed] dark:border-[#2a3c30]"
            >
              ‹
            </button>
            <span className="font-serif text-base font-bold min-w-32 text-center text-[#244b38] dark:text-[#f0f4f0]">
              {monthNames[month]} {year}
            </span>
            <button
              type="button"
              onClick={handleNextMonth}
              className="flex h-9 w-9 items-center justify-center rounded-xl border border-[#dedbd2] hover:bg-[#f6f4ed] dark:border-[#2a3c30]"
            >
              ›
            </button>
          </div>
        </div>

        {/* Legend */}
        <div className="flex items-center gap-5 text-[11px] mb-4 text-[#757b72] dark:text-[#9aa59d]">
          <span className="flex items-center gap-1.5">
            <span className="h-3 w-3 rounded-md bg-[#edf3ec] border border-[#cce3d1] dark:bg-[#1e3426]" />
            Available (Click to edit)
          </span>
          <span className="flex items-center gap-1.5">
            <span className="h-3 w-3 rounded-md bg-[#fee2e2] border border-[#fca5a5] dark:bg-[#381515]" />
            Blocked / Sold Out
          </span>
          <span className="flex items-center gap-1.5">
            <span className="h-3 w-3 rounded-md bg-[#fef3c7] border border-[#fde047] dark:bg-[#342409]" />
            Custom Surge Rate
          </span>
        </div>

        {/* Calendar Matrix Card */}
        <div className="rounded-3xl border border-[#e9e5dc] bg-white p-5 shadow-xs dark:border-[#2a3c30] dark:bg-[#152019]">
          <div className="grid grid-cols-7 gap-1.5 text-center text-[11px] font-bold uppercase tracking-wider text-[#858f87] pb-3 border-b border-[#eeece6] dark:border-[#243329]">
            {daysOfWeek.map((day) => (
              <div key={day}>{day}</div>
            ))}
          </div>

          <div className="grid grid-cols-7 gap-1.5 mt-2">
            {gridCells.map((d, idx) => {
              if (!d) {
                return <div key={`empty-${idx}`} className="h-24 rounded-2xl bg-transparent" />;
              }

              const dateStr = toDateStr(d);
              const isBlocked = blockedDays.includes(dateStr);
              const hasCustomRate = Boolean(customRates[dateStr]);
              const effectivePrice = customRates[dateStr] || activeRoom.basePrice;

              let cellClass =
                "h-24 rounded-2xl p-2.5 text-left transition-all border cursor-pointer flex flex-col justify-between hover:shadow-md ";

              if (isBlocked) {
                cellClass +=
                  "bg-[#fff5f5] border-[#fecaca] text-[#b91c1c] dark:bg-[#261212] dark:border-[#4d1f1f] dark:text-[#f87171]";
              } else if (hasCustomRate) {
                cellClass +=
                  "bg-[#fffbeb] border-[#fde68a] text-[#92400e] dark:bg-[#261c0d] dark:border-[#523b11] dark:text-[#fde047]";
              } else {
                cellClass +=
                  "bg-[#fdfcf9] border-[#eeece6] hover:border-[#244b38] text-[#26382d] dark:bg-[#131d17] dark:border-[#203025] dark:text-[#e4ede6]";
              }

              return (
                <div
                  key={dateStr}
                  onClick={() => handleCellClick(d)}
                  className={cellClass}
                  title={`Date: ${dateStr}. Click to edit`}
                >
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-xs">{d}</span>
                    <span className="text-[9px] font-semibold uppercase opacity-80">
                      {isBlocked ? "Blocked" : `${activeRoom.totalUnits} avail`}
                    </span>
                  </div>

                  <div>
                    <span className="text-[11px] font-bold block">
                      {formatPrice(effectivePrice)}
                    </span>
                    <span className="text-[9px] text-[#858f87] block">
                      {isBlocked ? "No check-ins" : "Instant book"}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Date Edit Modal */}
        {isEditModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
            <div className="w-full max-w-sm rounded-3xl border border-[#e9e5dc] bg-white p-6 shadow-2xl dark:border-[#2a3c30] dark:bg-[#152019]">
              <h3 className="font-serif text-lg font-medium text-[#244b38] dark:text-[#f0f4f0]">
                Adjust Rate & Allotment
              </h3>
              <p className="text-xs text-[#757b72] mt-1">
                Date: <strong>{selectedDate}</strong> ({activeRoom.name})
              </p>

              <form onSubmit={handleSaveCell} className="mt-4 space-y-4 text-xs">
                <div>
                  <label className="block font-semibold mb-1">Nightly Rate (INR)</label>
                  <input
                    type="number"
                    value={editPrice}
                    onChange={(e) => setEditPrice(e.target.value)}
                    className="w-full rounded-xl border border-[#dedbd2] bg-[#fbf9f4] p-2.5 outline-none font-semibold dark:border-[#2d3d32] dark:bg-[#111914]"
                  />
                </div>

                <div className="rounded-xl bg-[#f6f4ed] p-3 text-xs dark:bg-[#17231b]">
                  <span className="text-[#757b72] block">Current Status:</span>
                  <strong>{blockedDays.includes(selectedDate) ? "🔴 Blocked" : "🟢 Open for Bookings"}</strong>
                </div>

                <div className="pt-2 flex flex-col gap-2">
                  <button
                    type="button"
                    onClick={() => toggleBlockDate(selectedDate)}
                    className="w-full rounded-xl border border-[#dedbd2] py-2 font-semibold text-[#c53030] hover:bg-[#fff5f5] dark:border-[#2d3d32]"
                  >
                    {blockedDays.includes(selectedDate) ? "Unblock Date" : "Block this Date"}
                  </button>

                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={() => setIsEditModalOpen(false)}
                      className="flex-1 rounded-xl border border-[#dedbd2] py-2 font-semibold"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      className="flex-1 rounded-xl bg-[#244b38] py-2 font-semibold text-white hover:bg-[#193829] dark:bg-[#34d399] dark:text-[#0b120e]"
                    >
                      Save Rate
                    </button>
                  </div>
                </div>
              </form>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
