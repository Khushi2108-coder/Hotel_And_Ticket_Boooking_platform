import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import AvailabilityCalendar from "../components/AvailabilityCalendar";

/**
 * StayEase — Standalone Availability Calendar Page (/availability)
 */
export default function AvailabilityCalendarPage({ onNotify }) {
  const navigate = useNavigate();
  const [checkIn, setCheckIn] = useState("");
  const [checkOut, setCheckOut] = useState("");

  const handleSelectRange = (start, end) => {
    setCheckIn(start);
    setCheckOut(end);
  };

  const handleProceed = () => {
    if (!checkIn || !checkOut) {
      if (onNotify) {
        onNotify({
          type: "warning",
          title: "Select Dates",
          message: "Please choose both check-in and check-out dates.",
        });
      }
      return;
    }

    navigate(`/search?checkIn=${checkIn}&checkOut=${checkOut}`);
  };

  return (
    <main className="min-h-screen bg-[#fcfbf8] pb-24 text-[#26382d] transition-colors duration-300 dark:bg-[#0c120e] dark:text-[#f0f4f0]">
      <div className="mx-auto max-w-[900px] px-5 pt-8 sm:px-8">
        <nav className="flex items-center gap-2 text-xs text-[#85877f] dark:text-[#9ea8a1]">
          <Link to="/" className="hover:text-[#244b38] dark:hover:text-[#34d399]">
            Home
          </Link>
          <span>/</span>
          <span className="text-[#244b38] dark:text-[#34d399]">
            Availability Calendar
          </span>
        </nav>

        <div className="mt-4 text-center max-w-xl mx-auto">
          <span className="text-[10px] font-semibold uppercase tracking-[2px] text-[#b18a57] dark:text-[#fbbf24]">
            StayEase Availability Engine
          </span>
          <h1 className="mt-2 font-serif text-3xl font-medium sm:text-4xl text-[#244b38] dark:text-[#f0f4f0]">
            Check Stay Availability
          </h1>
          <p className="mt-2 text-xs text-[#757b72] sm:text-sm dark:text-[#9aa59d]">
            Select your desired travel dates to inspect real-time retreat availability across our collection.
          </p>
        </div>

        <div className="mt-8 max-w-lg mx-auto">
          <AvailabilityCalendar
            selectedCheckIn={checkIn}
            selectedCheckOut={checkOut}
            onSelectRange={handleSelectRange}
          />

          <div className="mt-6 flex items-center justify-between gap-4">
            <Link
              to="/search"
              className="rounded-xl border border-[#dedbd2] px-5 py-3 text-xs font-semibold text-[#26382d] transition hover:bg-[#f6f4ed] dark:border-[#2f4035] dark:text-[#e4ede6]"
            >
              ← Browse All Stays
            </Link>

            <button
              type="button"
              onClick={handleProceed}
              disabled={!checkIn || !checkOut}
              className="rounded-xl bg-[#244b38] px-6 py-3 text-xs font-semibold text-white shadow-sm transition hover:bg-[#183728] disabled:opacity-40 active:scale-98 dark:bg-[#34d399] dark:text-[#0b120e]"
            >
              Search for Stays on Selected Dates →
            </button>
          </div>
        </div>
      </div>
    </main>
  );
}

