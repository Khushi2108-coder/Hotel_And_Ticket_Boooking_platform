import { useState } from "react";
import { Link } from "react-router-dom";
import AdminSidebar from "../../components/dashboard/AdminSidebar";
import DashboardHeader from "../../components/dashboard/DashboardHeader";
import DashboardStatsCard from "../../components/dashboard/DashboardStatsCard";
import StatusBadge from "../../components/dashboard/StatusBadge";
import {
  mockAdminStats,
  mockPendingApprovals,
  mockAdminUsers,
} from "../../data/mockDashboardData";
import { useCurrency } from "../../context/CurrencyContext";

/**
 * StayEase — Admin Master Dashboard (/admin)
 */
export default function AdminDashboard() {
  const { formatPrice } = useCurrency();
  const [stats] = useState(mockAdminStats);
  const [approvals] = useState(mockPendingApprovals);

  return (
    <div className="flex min-h-screen bg-[#fcfbf8] text-[#26382d] transition-colors duration-300 dark:bg-[#0c120e] dark:text-[#f0f4f0]">
      <AdminSidebar />

      <main className="flex-1 overflow-y-auto px-5 py-8 sm:px-8 lg:px-12">
        <DashboardHeader
          title="StayEase Central Administration"
          subtitle="Platform telemetry, user moderation, property licensing approvals, and transaction oversight."
          eyebrow="Super Admin Portal"
          badge="Admin Root"
        />

        {/* Top Platform KPI Metrics */}
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
          <DashboardStatsCard
            title="Total Guests"
            value={stats.totalUsers}
            icon="👥"
            caption="Registered travellers"
          />
          <DashboardStatsCard
            title="Partners"
            value={stats.totalOwners}
            icon="🤝"
            caption="Verified hotel owners"
          />
          <DashboardStatsCard
            title="Properties"
            value={stats.totalProperties}
            icon="🏨"
            caption="Across 24 cities"
          />
          <DashboardStatsCard
            title="Reservations"
            value={stats.totalBookings}
            icon="📑"
            caption="Lifetime platform bookings"
          />
          <DashboardStatsCard
            title="Platform GMV"
            value={formatPrice(stats.grossRevenue)}
            icon="💎"
            caption="Gross Merch. Value"
          />
          <DashboardStatsCard
            title="Take Rate"
            value={formatPrice(stats.platformCommission)}
            icon="💰"
            caption="10% Net platform fee"
          />
        </div>

        {/* Priority Approvals Queue */}
        <div className="mt-8 rounded-3xl border border-[#e9e5dc] bg-white p-6 shadow-xs dark:border-[#2a3c30] dark:bg-[#152019]">
          <div className="flex items-center justify-between pb-4 border-b border-[#eeece6] dark:border-[#243329]">
            <div>
              <div className="flex items-center gap-2">
                <span className="flex h-2.5 w-2.5 rounded-full bg-[#e53e3e] animate-pulse" />
                <h3 className="font-serif text-lg font-medium text-[#244b38] dark:text-[#f0f4f0]">
                  Pending Property Listing Approvals ({approvals.length})
                </h3>
              </div>
              <p className="text-[11px] text-[#757b72] dark:text-[#9aa59d]">
                Newly submitted partner properties awaiting quality and license verification
              </p>
            </div>

            <Link
              to="/admin/properties"
              className="text-xs font-semibold text-[#244b38] hover:underline dark:text-[#34d399]"
            >
              Review All Approvals →
            </Link>
          </div>

          <div className="mt-4 grid gap-4 md:grid-cols-3">
            {approvals.map((appr) => (
              <div
                key={appr.id}
                className="overflow-hidden rounded-2xl border border-[#eeece6] bg-[#fbf9f4] p-4 text-xs dark:border-[#203025] dark:bg-[#131d17]"
              >
                <div className="relative aspect-[16/9] w-full rounded-xl overflow-hidden mb-3">
                  <img
                    src={appr.image}
                    alt={appr.propertyName}
                    className="h-full w-full object-cover"
                  />
                  <div className="absolute top-2 right-2">
                    <StatusBadge status={appr.documentsStatus} />
                  </div>
                </div>

                <h4 className="font-serif text-sm font-bold text-[#244b38] dark:text-[#f0f4f0]">
                  {appr.propertyName}
                </h4>
                <p className="text-[11px] text-[#757b72]">
                  📍 {appr.city} · {appr.roomsCount} Rooms
                </p>

                <div className="mt-2 text-[11px] text-[#757b72] border-t border-[#e8e4db] pt-2 dark:border-[#243329]">
                  <span>Owner: <strong>{appr.ownerName}</strong></span>
                </div>

                <div className="mt-3 flex gap-2">
                  <Link
                    to="/admin/properties"
                    className="flex-1 text-center rounded-lg bg-[#244b38] py-1.5 text-xs font-semibold text-white dark:bg-[#34d399] dark:text-[#0b120e]"
                  >
                    Inspect & Verify
                  </Link>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Quick Admin User Moderation */}
        <div className="mt-8 rounded-3xl border border-[#e9e5dc] bg-white p-6 shadow-xs dark:border-[#2a3c30] dark:bg-[#152019]">
          <div className="flex items-center justify-between pb-4 border-b border-[#eeece6] dark:border-[#243329]">
            <div>
              <h3 className="font-serif text-lg font-medium text-[#244b38] dark:text-[#f0f4f0]">
                User & Partner Accounts
              </h3>
              <p className="text-[11px] text-[#757b72] dark:text-[#9aa59d]">
                Overview of recent accounts across guest and hotel partner roles
              </p>
            </div>
            <Link
              to="/admin/users"
              className="text-xs font-semibold text-[#244b38] hover:underline dark:text-[#34d399]"
            >
              Full User Directory →
            </Link>
          </div>

          <div className="overflow-x-auto mt-4">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-[#eeece6] text-[10px] font-semibold uppercase tracking-wider text-[#858f87] dark:border-[#243329]">
                  <th className="pb-3 pr-4">User</th>
                  <th className="pb-3 pr-4">Email</th>
                  <th className="pb-3 pr-4">System Role</th>
                  <th className="pb-3 pr-4">Loyalty Tier</th>
                  <th className="pb-3">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#f2efe8] dark:divide-[#1d2b22]">
                {mockAdminUsers.map((u) => (
                  <tr key={u.id} className="hover:bg-[#faf8f4] dark:hover:bg-[#19261e]">
                    <td className="py-3 pr-4 font-semibold">{u.name}</td>
                    <td className="py-3 pr-4 text-[#757b72]">{u.email}</td>
                    <td className="py-3 pr-4">
                      <span className="font-bold text-[#244b38] dark:text-[#34d399]">
                        {u.role}
                      </span>
                    </td>
                    <td className="py-3 pr-4 text-[#b18a57] dark:text-[#fbbf24]">
                      {u.tier}
                    </td>
                    <td className="py-3">
                      <StatusBadge status={u.status} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </main>
    </div>
  );
}
