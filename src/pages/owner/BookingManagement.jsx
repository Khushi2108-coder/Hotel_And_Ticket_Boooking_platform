import { useState } from "react";
import OwnerSidebar from "../../components/dashboard/OwnerSidebar";
import DashboardHeader from "../../components/dashboard/DashboardHeader";
import StatusBadge from "../../components/dashboard/StatusBadge";
import DataTable from "../../components/dashboard/DataTable";
import ConfirmActionModal from "../../components/dashboard/ConfirmActionModal";
import { mockOwnerBookings } from "../../data/mockDashboardData";
import { useCurrency } from "../../context/CurrencyContext";

/**
 * StayEase — Owner Booking Management (/owner/bookings)
 *
 * Features:
 * - Guest details, stay dates, and room breakdown
 * - Filter by status: All, Confirmed, Checked-In, Checked-Out, Cancelled
 * - Operational actions: Mark Checked-In, Mark Checked-Out, Cancel
 * - Guest special requests view modal
 */
export default function BookingManagement({ onNotify }) {
  const { formatPrice } = useCurrency();
  const [bookings, setBookings] = useState(mockOwnerBookings);
  const [statusFilter, setStatusFilter] = useState("all");
  const [activeBookingModal, setActiveBookingModal] = useState(null);
  const [cancelTarget, setCancelTarget] = useState(null);

  const filteredBookings = bookings.filter((b) => {
    if (statusFilter === "all") return true;
    return b.status.toLowerCase() === statusFilter.toLowerCase();
  });

  const handleUpdateStatus = (id, newStatus) => {
    setBookings((prev) =>
      prev.map((b) => (b.id === id ? { ...b, status: newStatus } : b))
    );
    if (onNotify) {
      onNotify({
        type: "success",
        title: "Status Updated",
        message: `Booking has been marked as ${newStatus}.`,
      });
    }
  };

  const handleConfirmCancel = () => {
    if (!cancelTarget) return;
    setBookings((prev) =>
      prev.map((b) =>
        b.id === cancelTarget.id
          ? { ...b, status: "Cancelled", paymentStatus: "Refund Pending Phase 2" }
          : b
      )
    );
    if (onNotify) {
      onNotify({
        type: "info",
        title: "Reservation Cancelled",
        message: `Booking ${cancelTarget.reference} was cancelled.`,
      });
    }
    setCancelTarget(null);
  };

  const columns = [
    {
      header: "Reference",
      accessor: "reference",
      cell: (row) => (
        <div>
          <span className="font-mono font-bold text-[#244b38] dark:text-[#34d399]">
            {row.reference}
          </span>
          <span className="block text-[10px] text-[#757b72]">{row.createdAt}</span>
        </div>
      ),
    },
    {
      header: "Guest Information",
      accessor: "guestName",
      cell: (row) => (
        <div>
          <strong className="block text-xs">{row.guestName}</strong>
          <span className="block text-[10px] text-[#757b72]">{row.guestEmail}</span>
          <span className="block text-[10px] text-[#757b72]">{row.guestPhone}</span>
        </div>
      ),
    },
    {
      header: "Property & Room",
      accessor: "propertyName",
      cell: (row) => (
        <div>
          <span className="font-medium block">{row.propertyName}</span>
          <span className="text-[10px] text-[#b18a57] dark:text-[#fbbf24] block">
            {row.roomName}
          </span>
          <span className="text-[10px] text-[#858f87]">
            {row.guests} guests · {row.rooms} room
          </span>
        </div>
      ),
    },
    {
      header: "Stay Schedule",
      accessor: "checkIn",
      cell: (row) => (
        <div>
          <span className="block font-medium">
            {row.checkIn} → {row.checkOut}
          </span>
          <span className="text-[10px] text-[#757b72]">{row.nights} nights</span>
        </div>
      ),
    },
    {
      header: "Total Value",
      accessor: "totalAmount",
      cell: (row) => (
        <div>
          <strong className="block text-sm text-[#244b38] dark:text-[#34d399]">
            {formatPrice(row.totalAmount)}
          </strong>
          <span className="text-[9px] text-[#858f87] block">{row.paymentStatus}</span>
        </div>
      ),
    },
    {
      header: "Status",
      accessor: "status",
      cell: (row) => <StatusBadge status={row.status} />,
    },
    {
      header: "Actions",
      accessor: "actions",
      cell: (row) => (
        <div className="flex items-center gap-1.5">
          {row.status === "Confirmed" && (
            <button
              type="button"
              onClick={() => handleUpdateStatus(row.id, "Checked-In")}
              className="rounded-lg bg-[#edf3ec] px-2.5 py-1 text-[11px] font-semibold text-[#244b38] hover:bg-[#dfeade] dark:bg-[#1b2f23] dark:text-[#34d399]"
            >
              Check-In
            </button>
          )}

          {row.status === "Checked-In" && (
            <button
              type="button"
              onClick={() => handleUpdateStatus(row.id, "Checked-Out")}
              className="rounded-lg bg-[#eaf4fc] px-2.5 py-1 text-[11px] font-semibold text-[#0284c7] hover:bg-[#d6eaf8] dark:bg-[#102b42] dark:text-[#38bdf8]"
            >
              Check-Out
            </button>
          )}

          <button
            type="button"
            onClick={() => setActiveBookingModal(row)}
            className="rounded-lg border border-[#dedbd2] px-2 py-1 text-[11px] font-semibold hover:bg-[#f6f4ed] dark:border-[#2d3d32]"
            title="Inspect Details"
          >
            👁️
          </button>

          {row.status !== "Cancelled" && row.status !== "Checked-Out" && (
            <button
              type="button"
              onClick={() => setCancelTarget(row)}
              className="rounded-lg border border-[#dedbd2] px-2 py-1 text-[11px] font-semibold text-[#c53030] hover:bg-[#fff5f5] dark:border-[#2d3d32]"
              title="Cancel Booking"
            >
              ✕
            </button>
          )}
        </div>
      ),
    },
  ];

  return (
    <div className="flex min-h-screen bg-[#fcfbf8] text-[#26382d] transition-colors duration-300 dark:bg-[#0c120e] dark:text-[#f0f4f0]">
      <OwnerSidebar />

      <main className="flex-1 overflow-y-auto px-5 py-8 sm:px-8 lg:px-12">
        <DashboardHeader
          title="Guest Reservations & Stay Management"
          subtitle="Real-time guest manifest, arrival check-ins, departures, and stay cancellations."
          eyebrow="Booking Operations"
        />

        {/* Filter Tabs */}
        <div className="flex items-center gap-2 mb-6 border-b border-[#e9e5dc] pb-3 text-xs dark:border-[#2a3c30]">
          {["all", "confirmed", "checked-in", "checked-out", "cancelled"].map((st) => (
            <button
              key={st}
              type="button"
              onClick={() => setStatusFilter(st)}
              className={`rounded-xl px-3.5 py-1.5 font-semibold capitalize transition ${
                statusFilter === st
                  ? "bg-[#244b38] text-white dark:bg-[#34d399] dark:text-[#0a120e]"
                  : "text-[#757b72] hover:bg-[#edf3ec] dark:hover:bg-[#1f3025]"
              }`}
            >
              {st}
            </button>
          ))}
        </div>

        {/* Master Table */}
        <DataTable
          columns={columns}
          data={filteredBookings}
          searchPlaceholder="Search by guest name, reference, property..."
          searchKey="guestName"
        />

        {/* Guest Details Inspector Modal */}
        {activeBookingModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
            <div className="w-full max-w-md rounded-3xl border border-[#e9e5dc] bg-white p-6 shadow-2xl dark:border-[#2a3c30] dark:bg-[#152019]">
              <div className="flex items-center justify-between pb-3 border-b border-[#eeece6] dark:border-[#243329]">
                <div>
                  <span className="font-mono text-xs font-bold text-[#244b38] dark:text-[#34d399]">
                    {activeBookingModal.reference}
                  </span>
                  <h3 className="font-serif text-lg font-medium text-[#244b38] dark:text-[#f0f4f0]">
                    Guest Stay Voucher
                  </h3>
                </div>
                <button
                  type="button"
                  onClick={() => setActiveBookingModal(null)}
                  className="text-base text-[#858f87]"
                >
                  ✕
                </button>
              </div>

              <div className="mt-4 space-y-3 text-xs">
                <div className="flex justify-between border-b border-[#eeece6] pb-2 dark:border-[#243329]">
                  <span className="text-[#757b72]">Guest Name:</span>
                  <strong>{activeBookingModal.guestName}</strong>
                </div>
                <div className="flex justify-between border-b border-[#eeece6] pb-2 dark:border-[#243329]">
                  <span className="text-[#757b72]">Contact:</span>
                  <strong>{activeBookingModal.guestEmail} · {activeBookingModal.guestPhone}</strong>
                </div>
                <div className="flex justify-between border-b border-[#eeece6] pb-2 dark:border-[#243329]">
                  <span className="text-[#757b72]">Property:</span>
                  <strong>{activeBookingModal.propertyName}</strong>
                </div>
                <div className="flex justify-between border-b border-[#eeece6] pb-2 dark:border-[#243329]">
                  <span className="text-[#757b72]">Room Type:</span>
                  <strong>{activeBookingModal.roomName}</strong>
                </div>
                <div className="flex justify-between border-b border-[#eeece6] pb-2 dark:border-[#243329]">
                  <span className="text-[#757b72]">Stay Duration:</span>
                  <strong>{activeBookingModal.checkIn} to {activeBookingModal.checkOut} ({activeBookingModal.nights}N)</strong>
                </div>
                <div className="flex justify-between border-b border-[#eeece6] pb-2 dark:border-[#243329]">
                  <span className="text-[#757b72]">Total Amount:</span>
                  <strong className="text-sm text-[#244b38] dark:text-[#34d399]">
                    {formatPrice(activeBookingModal.totalAmount)}
                  </strong>
                </div>
                <div className="flex justify-between pt-1">
                  <span className="text-[#757b72]">Current Status:</span>
                  <StatusBadge status={activeBookingModal.status} />
                </div>
              </div>

              <div className="mt-6 flex justify-end">
                <button
                  type="button"
                  onClick={() => setActiveBookingModal(null)}
                  className="rounded-xl bg-[#244b38] px-5 py-2 font-semibold text-white dark:bg-[#34d399] dark:text-[#0b120e]"
                >
                  Close Summary
                </button>
              </div>
            </div>
          </div>
        )}

        <ConfirmActionModal
          isOpen={!!cancelTarget}
          title="Cancel Guest Booking?"
          message={`Are you sure you want to cancel reservation ${cancelTarget?.reference} for ${cancelTarget?.guestName}? In Phase 2, this will trigger the automatic partial refund engine.`}
          confirmText="Confirm Cancellation"
          onConfirm={handleConfirmCancel}
          onCancel={() => setCancelTarget(null)}
        />
      </main>
    </div>
  );
}

