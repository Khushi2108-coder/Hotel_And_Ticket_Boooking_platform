import { useState } from "react";

/**
 * StayEase — Interactive Availability & Date Range Calendar Component
 *
 * Features:
 * - Monthly calendar grid with day-of-week headers
 * - Previous/Next month navigation
 * - Check-in and check-out interactive range selection
 * - Disables past dates automatically
 * - Highlights start date, in-between span, and end date
 * - Shows total nights calculated
 * - Clear date selection action
 * - Fully responsive and compatible with all StayEase themes & dark mode
 */
export default function AvailabilityCalendar({
  selectedCheckIn = "",
  selectedCheckOut = "",
  onSelectRange,
  blockedDates = [],
  pricePerDay = null,
  className = "",
}) {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const [currentMonth, setCurrentMonth] = useState(() => {
    if (selectedCheckIn) {
      const d = new Date(selectedCheckIn);
      return new Date(d.getFullYear(), d.getMonth(), 1);
    }
    return new Date(today.getFullYear(), today.getMonth(), 1);
  });

  const [checkIn, setCheckIn] = useState(selectedCheckIn || "");
  const [checkOut, setCheckOut] = useState(selectedCheckOut || "");
  const [hoverDate, setHoverDate] = useState("");

  const monthNames = [
    "January", "February", "March", "April", "May", "June",
    "July", "August", "September", "October", "November", "December",
  ];

  const daysOfWeek = ["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"];

  const year = currentMonth.getFullYear();
  const month = currentMonth.getMonth();

  // First day of current month (0-6)
  const firstDayIndex = new Date(year, month, 1).getDay();
  // Total days in current month
  const daysInMonth = new Date(year, month + 1, 0).getDate();

  const handlePrevMonth = () => {
    setCurrentMonth(new Date(year, month - 1, 1));
  };

  const handleNextMonth = () => {
    setCurrentMonth(new Date(year, month + 1, 1));
  };

  const toDateString = (d) => {
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, "0");
    const day = String(d.getDate()).padStart(2, "0");
    return `${y}-${m}-${day}`;
  };

  const handleDateClick = (dateStr) => {
    const clickedDate = new Date(`${dateStr}T00:00:00`);
    if (clickedDate < today) return;
    if (blockedDates.includes(dateStr)) return;

    if (!checkIn || (checkIn && checkOut)) {
      // Starting new selection
      setCheckIn(dateStr);
      setCheckOut("");
      if (onSelectRange) onSelectRange(dateStr, "");
    } else if (checkIn && !checkOut) {
      if (dateStr <= checkIn) {
        // Reset check-in to newly clicked earlier date
        setCheckIn(dateStr);
        setCheckOut("");
        if (onSelectRange) onSelectRange(dateStr, "");
      } else {
        // Valid check-out date selected
        setCheckOut(dateStr);
        if (onSelectRange) onSelectRange(checkIn, dateStr);
      }
    }
  };

  const handleClear = () => {
    setCheckIn("");
    setCheckOut("");
    if (onSelectRange) onSelectRange("", "");
  };

  const calculateNights = () => {
    if (!checkIn || !checkOut) return 0;
    const start = new Date(`${checkIn}T00:00:00`);
    const end = new Date(`${checkOut}T00:00:00`);
    return Math.max(0, Math.round((end - start) / 86400000));
  };

  const nights = calculateNights();

  // Generate calendar grid array
  const calendarDays = [];
  for (let i = 0; i < firstDayIndex; i++) {
    calendarDays.push(null);
  }
  for (let d = 1; d <= daysInMonth; d++) {
    calendarDays.push(new Date(year, month, d));
  }

  return (
    <div
      className={`rounded-3xl border border-[#e9e5dc] bg-white p-5 shadow-sm sm:p-6 dark:border-[#2a3c30] dark:bg-[#152019] ${className}`}
    >
      {/* Header with Month / Year Navigation */}
      <div className="flex items-center justify-between pb-4">
        <div>
          <h3 className="font-serif text-lg font-medium text-[#244b38] sm:text-xl dark:text-[#f0f4f0]">
            {monthNames[month]} {year}
          </h3>
          <p className="text-[11px] text-[#757b72] dark:text-[#9aa59d]">
            Select your check-in and check-out dates
          </p>
        </div>

        <div className="flex items-center gap-1.5">
          <button
            type="button"
            onClick={handlePrevMonth}
            aria-label="Previous month"
            className="flex h-9 w-9 items-center justify-center rounded-xl border border-[#e5e1d8] bg-[#fbfaf6] text-sm text-[#26382d] transition hover:bg-[#ede9df] dark:border-[#2a3c30] dark:bg-[#18241c] dark:text-[#f0f4f0] dark:hover:bg-[#203025]"
          >
            ‹
          </button>
          <button
            type="button"
            onClick={handleNextMonth}
            aria-label="Next month"
            className="flex h-9 w-9 items-center justify-center rounded-xl border border-[#e5e1d8] bg-[#fbfaf6] text-sm text-[#26382d] transition hover:bg-[#ede9df] dark:border-[#2a3c30] dark:bg-[#18241c] dark:text-[#f0f4f0] dark:hover:bg-[#203025]"
          >
            ›
          </button>
        </div>
      </div>

      {/* Days of Week Header */}
      <div className="grid grid-cols-7 gap-1 text-center text-xs font-semibold text-[#8a9187] dark:text-[#7f8f83]">
        {daysOfWeek.map((day) => (
          <div key={day} className="py-1.5 uppercase tracking-wider text-[11px]">
            {day}
          </div>
        ))}
      </div>

      {/* Calendar Matrix */}
      <div className="mt-1 grid grid-cols-7 gap-1">
        {calendarDays.map((dateObj, idx) => {
          if (!dateObj) {
            return <div key={`empty-${idx}`} className="h-10 sm:h-11" />;
          }

          const dateStr = toDateString(dateObj);
          const isPast = dateObj < today;
          const isBlocked = blockedDates.includes(dateStr);
          const isCheckIn = dateStr === checkIn;
          const isCheckOut = dateStr === checkOut;
          const effectiveEnd = checkOut || (checkIn && hoverDate > checkIn ? hoverDate : "");
          const isInRange = checkIn && effectiveEnd && dateStr > checkIn && dateStr < effectiveEnd;

          let btnClass = "h-10 sm:h-11 w-full rounded-xl text-xs sm:text-sm font-medium transition-all relative flex flex-col items-center justify-center ";

          if (isPast || isBlocked) {
            btnClass += "text-[#c2c5bd] dark:text-[#45564c] cursor-not-allowed bg-transparent ";
          } else if (isCheckIn || isCheckOut) {
            btnClass += "bg-[#244b38] text-white font-bold shadow-md scale-102 z-10 dark:bg-[#34d399] dark:text-[#0b120e] ";
          } else if (isInRange) {
            btnClass += "bg-[#edf3ec] text-[#244b38] dark:bg-[#1d3225] dark:text-[#34d399] rounded-none ";
          } else {
            btnClass += "text-[#26382d] hover:bg-[#f3f0e8] dark:text-[#e4ede6] dark:hover:bg-[#1d2b21] ";
          }

          return (
            <button
              key={dateStr}
              type="button"
              disabled={isPast || isBlocked}
              onClick={() => handleDateClick(dateStr)}
              onMouseEnter={() => setHoverDate(dateStr)}
              className={btnClass}
              title={isBlocked ? "Date blocked / unavailable" : dateStr}
            >
              <span>{dateObj.getDate()}</span>
              {pricePerDay && !isPast && !isBlocked && (
                <span className="text-[9px] opacity-75 hidden sm:block">
                  ₹{pricePerDay}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* Bottom Bar: Selection Summary & Clear Action */}
      <div className="mt-5 flex flex-wrap items-center justify-between gap-3 border-t border-[#eeece6] pt-4 text-xs dark:border-[#2a3c30]">
        <div className="flex items-center gap-2">
          <div className="rounded-xl border border-[#dedbd2] bg-[#fbf9f4] px-3 py-1.5 dark:border-[#2f4035] dark:bg-[#18241c]">
            <span className="text-[#858f87] dark:text-[#88998d]">In: </span>
            <strong className="text-[#244b38] dark:text-[#34d399]">
              {checkIn || "Select date"}
            </strong>
          </div>
          <span className="text-[#858f87]">→</span>
          <div className="rounded-xl border border-[#dedbd2] bg-[#fbf9f4] px-3 py-1.5 dark:border-[#2f4035] dark:bg-[#18241c]">
            <span className="text-[#858f87] dark:text-[#88998d]">Out: </span>
            <strong className="text-[#244b38] dark:text-[#34d399]">
              {checkOut || "Select date"}
            </strong>
          </div>

          {nights > 0 && (
            <span className="rounded-full bg-[#edf3ec] px-2.5 py-1 text-[11px] font-semibold text-[#244b38] dark:bg-[#1e3426] dark:text-[#34d399]">
              {nights} {nights === 1 ? "night" : "nights"}
            </span>
          )}
        </div>

        {(checkIn || checkOut) && (
          <button
            type="button"
            onClick={handleClear}
            className="text-xs font-semibold text-[#c53030] hover:underline"
          >
            Clear selection
          </button>
        )}
      </div>
    </div>
  );
}
