import { useState } from "react";
import AdminSidebar from "../../components/dashboard/AdminSidebar";
import DashboardHeader from "../../components/dashboard/DashboardHeader";
import StatusBadge from "../../components/dashboard/StatusBadge";
import DataTable from "../../components/dashboard/DataTable";
import { mockOwnerBookings } from "../../data/mockDashboardData";
import { useCurrency } from "../../context/CurrencyContext";

/**
 * StayEase — Admin Master Bookings Overview (/admin/bookings)
 *
 * Features:
 * - Cross-property platform booking audit trail
 * - Filter by status: All, Confirmed, Checked-In, Checked-Out, Cancelled
 * - Export audit CSV
 */
export default function BookingOverview({ onNotify }) {
  const { formatPrice } = useCurrency();
  const [bookings] = useState([
    ...mockOwnerBookings,
    {
      id: "bkg-9406",
      reference: "ST-7738291",
      guestName: "Meera Kapoor",
      guestEmail: "meera.k@example.com",
      guestPhone: "+91 98200 11992",
      propertyName: "Lakeview Heritage Palace",
      roomName: "Maharaja Presidential Suite",
      checkIn: "2026-12-01",
      checkOut: "2026-12-05",
      nights: 4,
      guests: 3,
      rooms: 1,
      totalAmount: 73920,
      status: "Confirmed",
      paymentStatus: "Pending Backend Phase 2",
      createdAt: "2026-11-22",
    },
  ]);

  const [statusFilter, setStatusFilter] = useState("all");

  const filteredBookings = bookings.filter((b) => {
    if (statusFilter === "all") return true;
    return b.status.toLowerCase() === statusFilter.toLowerCase();
  });

  const handleExportCSV = () => {
    if (onNotify) {
      onNotify({
        type: "success",
        title: "Export Generated",
        message: "Master reservation audit report downloaded.",
      });
    }
  };

  const columns = [
    {
      header: "Booking Ref",
      accessor: "reference",
      cell: (row) => (
        <span className="font-mono font-bold text-[#244b38] dark:text-[#34d399]">
          {row.reference}
        </span>
      ),
    },
    {
      header: "Guest Details",
      accessor: "guestName",
      cell: (row) => (
        <div>
          <strong className="block">{row.guestName}</strong>
          <span className="block text-[10px] text-[#757b72]">{row.guestEmail}</span>
        </div>
      ),
    },
    {
      header: "Property & Room",
      accessor: "propertyName",
      cell: (row) => (
        <div>
          <span className="font-medium block">{row.propertyName}</span>
          <span className="text-[10px] text-[#b18a57] block">{row.roomName}</span>
        </div>
      ),
    },
    {
      header: "Dates",
      accessor: "checkIn",
      cell: (row) => (
        <span className="text-xs">
          {row.checkIn} → {row.checkOut} ({row.nights}N)
        </span>
      ),
    },
    {
      header: "Gross Amount",
      accessor: "totalAmount",
      cell: (row) => (
        <strong className="text-[#244b38] dark:text-[#34d399]">
          {formatPrice(row.totalAmount)}
        </strong>
      ),
    },
    {
      header: "Status",
      accessor: "status",
      cell: (row) => <StatusBadge status={row.status} />,
    },
  ];

  return (
    <div className="flex min-h-screen bg-[#fcfbf8] text-[#26382d] transition-colors duration-300 dark:bg-[#0c120e] dark:text-[#f0f4f0]">
      <AdminSidebar />

      <main className="flex-1 overflow-y-auto px-5 py-8 sm:px-8 lg:px-12">
        <DashboardHeader
          title="Master Booking Audit Trail"
          subtitle="Cross-platform transaction manifest across all listed luxury properties."
          eyebrow="Platform Audit"
          actionText="Export CSV"
          actionIcon="📥"
          onActionClick={handleExportCSV}
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

        <DataTable
          columns={columns}
          data={filteredBookings}
          searchPlaceholder="Search master bookings..."
          searchKey="guestName"
        />
      </main>
    </div>
  );
}

