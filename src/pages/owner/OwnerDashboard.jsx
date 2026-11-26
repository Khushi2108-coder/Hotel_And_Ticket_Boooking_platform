import { useState } from "react";
import { Link } from "react-router-dom";
import OwnerSidebar from "../../components/dashboard/OwnerSidebar";
import DashboardHeader from "../../components/dashboard/DashboardHeader";
import DashboardStatsCard from "../../components/dashboard/DashboardStatsCard";
import StatusBadge from "../../components/dashboard/StatusBadge";
import {
  mockOwnerStats,
  mockRevenueChartData,
  mockOwnerBookings,
} from "../../data/mockDashboardData";
import { useCurrency } from "../../context/CurrencyContext";

/**
 * StayEase — Owner Dashboard Overview (/owner/dashboard)
 */
export default function OwnerDashboard() {
  const { formatPrice } = useCurrency();
  const [stats] = useState(mockOwnerStats);
  const [recentBookings] = useState(mockOwnerBookings.slice(0, 4));

  return (
    <div className="flex min-h-screen bg-[#fcfbf8] text-[#26382d] transition-colors duration-300 dark:bg-[#0c120e] dark:text-[#f0f4f0]">
      <OwnerSidebar />

      <main className="flex-1 overflow-y-auto px-5 py-8 sm:px-8 lg:px-12">
        <DashboardHeader
          title="Owner Executive Dashboard"
          subtitle="Real-time portfolio metrics, booking velocity, and occupancy tracking."
          eyebrow="StayEase Property Partner"
          badge="Partner Verified"
          actionText="Add New Property"
          actionLink="/owner/properties"
        />

        {/* Top Metric Cards Grid */}
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
          <DashboardStatsCard
            title="Properties"
            value={stats.totalProperties}
            icon="🏨"
            caption="Active in portfolio"
          />
          <DashboardStatsCard
            title="Total Bookings"
            value={stats.totalBookings}
            change="14%"
            isPositive={true}
            icon="📋"
            caption="vs last month"
          />
          <DashboardStatsCard
            title="Gross Revenue"
            value={formatPrice(stats.totalRevenue)}
            change="18.2%"
            isPositive={true}
            icon="💰"
            caption="YTD total"
          />
          <DashboardStatsCard
            title="Occupancy Rate"
            value={`${stats.occupancyRate}%`}
            change="4.1%"
            isPositive={true}
            icon="📊"
            caption="Peak season high"
          />
          <DashboardStatsCard
            title="ADR"
            value={formatPrice(stats.adr)}
            icon="🏷️"
            caption="Avg. Daily Rate"
          />
          <DashboardStatsCard
            title="RevPAR"
            value={formatPrice(stats.revPar)}
            icon="📈"
            caption="Rev. Per Avail. Room"
          />
        </div>

        {/* Charts & Quick Action Row */}
        <div className="mt-8 grid gap-8 lg:grid-cols-[1.4fr_1fr]">
          {/* Revenue & Occupancy Bar Chart Visualizer */}
          <div className="rounded-3xl border border-[#e9e5dc] bg-white p-6 shadow-xs dark:border-[#2a3c30] dark:bg-[#152019]">
            <div className="flex items-center justify-between pb-4 border-b border-[#eeece6] dark:border-[#243329]">
              <div>
                <h3 className="font-serif text-lg font-medium text-[#244b38] dark:text-[#f0f4f0]">
                  Revenue & Occupancy Performance
                </h3>
                <p className="text-[11px] text-[#757b72] dark:text-[#9aa59d]">
                  Last 6 months performance trajectory
                </p>
              </div>
              <span className="rounded-full bg-[#edf3ec] px-3 py-1 text-[11px] font-semibold text-[#244b38] dark:bg-[#1c3325] dark:text-[#34d399]">
                2026 Season
              </span>
            </div>

            {/* Custom SVG / HTML Bar Representation */}
            <div className="mt-6 flex h-52 items-end justify-between gap-3 px-2">
              {mockRevenueChartData.map((item) => {
                const heightPercent = Math.round((item.revenue / 950000) * 100);
                return (
                  <div key={item.month} className="flex flex-1 flex-col items-center gap-2 h-full justify-end group">
                    <div className="relative w-full flex justify-center">
                      <span className="absolute -top-7 hidden group-hover:block rounded-md bg-[#244b38] px-2 py-0.5 text-[10px] text-white z-10 whitespace-nowrap shadow-md">
                        {formatPrice(item.revenue)} · {item.occupancy}%
                      </span>
                    </div>
                    <div
                      style={{ height: `${heightPercent}%` }}
                      className="w-full max-w-[42px] rounded-t-xl bg-[#244b38] opacity-85 transition-all group-hover:opacity-100 group-hover:bg-[#193829] dark:bg-[#34d399] dark:group-hover:bg-[#4ade80]"
                    />
                    <span className="text-[11px] font-medium text-[#757b72] dark:text-[#88998d]">
                      {item.month}
                    </span>
                  </div>
                );
              })}
            </div>

            <div className="mt-4 flex items-center justify-center gap-6 border-t border-[#eeece6] pt-3 text-[11px] text-[#757b72] dark:border-[#243329]">
              <span className="flex items-center gap-1.5">
                <span className="h-2.5 w-2.5 rounded-full bg-[#244b38] dark:bg-[#34d399]" />
                Monthly Realized Revenue
              </span>
              <span className="flex items-center gap-1.5">
                <span className="h-2.5 w-2.5 rounded-full bg-[#b18a57] dark:bg-[#fbbf24]" />
                Portfolio Occupancy Rate
              </span>
            </div>
          </div>

          {/* Quick Actions Panel */}
          <div className="flex flex-col justify-between rounded-3xl border border-[#e9e5dc] bg-white p-6 shadow-xs dark:border-[#2a3c30] dark:bg-[#152019]">
            <div>
              <h3 className="font-serif text-lg font-medium text-[#244b38] dark:text-[#f0f4f0]">
                Quick Operations
              </h3>
              <p className="text-[11px] text-[#757b72] dark:text-[#9aa59d]">
                Frequent partner controls & inventory actions
              </p>

              <div className="mt-5 space-y-2.5">
                <Link
                  to="/owner/calendar"
                  className="flex items-center justify-between rounded-2xl border border-[#e8e4db] p-3.5 transition hover:bg-[#faf8f4] dark:border-[#2a3c30] dark:hover:bg-[#1b2720]"
                >
                  <div className="flex items-center gap-3">
                    <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#edf3ec] text-sm text-[#244b38] dark:bg-[#1f3427] dark:text-[#34d399]">
                      📅
                    </span>
                    <div>
                      <strong className="block text-xs font-semibold">
                        Block / Unblock Dates
                      </strong>
                      <span className="text-[11px] text-[#757b72]">
                        Update daily inventory & rates
                      </span>
                    </div>
                  </div>
                  <span className="text-xs">→</span>
                </Link>

                <Link
                  to="/owner/pricing"
                  className="flex items-center justify-between rounded-2xl border border-[#e8e4db] p-3.5 transition hover:bg-[#faf8f4] dark:border-[#2a3c30] dark:hover:bg-[#1b2720]"
                >
                  <div className="flex items-center gap-3">
                    <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#edf3ec] text-sm text-[#244b38] dark:bg-[#1f3427] dark:text-[#34d399]">
                      🏷️
                    </span>
                    <div>
                      <strong className="block text-xs font-semibold">
                        Set Weekend Surge
                      </strong>
                      <span className="text-[11px] text-[#757b72]">
                        Automatic Friday & Saturday rules
                      </span>
                    </div>
                  </div>
                  <span className="text-xs">→</span>
                </Link>

                <Link
                  to="/owner/rooms"
                  className="flex items-center justify-between rounded-2xl border border-[#e8e4db] p-3.5 transition hover:bg-[#faf8f4] dark:border-[#2a3c30] dark:hover:bg-[#1b2720]"
                >
                  <div className="flex items-center gap-3">
                    <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#edf3ec] text-sm text-[#244b38] dark:bg-[#1f3427] dark:text-[#34d399]">
                      🚪
                    </span>
                    <div>
                      <strong className="block text-xs font-semibold">
                        Add New Room Type
                      </strong>
                      <span className="text-[11px] text-[#757b72]">
                        Configure capacities & beds
                      </span>
                    </div>
                  </div>
                  <span className="text-xs">→</span>
                </Link>
              </div>
            </div>

            <div className="mt-6 rounded-2xl bg-[#fbf9f4] p-4 text-xs dark:bg-[#131d17]">
              <span className="font-semibold block text-[#244b38] dark:text-[#34d399]">
                💡 Tip for Higher Bookings
              </span>
              <p className="mt-1 text-[11px] text-[#757b72] dark:text-[#9aa59d]">
                Properties with flexible cancellation policies and length-of-stay discounts receive 28% more reservations.
              </p>
            </div>
          </div>
        </div>

        {/* Recent Bookings Table Preview */}
        <div className="mt-8 rounded-3xl border border-[#e9e5dc] bg-white p-6 shadow-xs dark:border-[#2a3c30] dark:bg-[#152019]">
          <div className="flex items-center justify-between pb-4 border-b border-[#eeece6] dark:border-[#243329]">
            <div>
              <h3 className="font-serif text-lg font-medium text-[#244b38] dark:text-[#f0f4f0]">
                Recent Guest Reservations
              </h3>
              <p className="text-[11px] text-[#757b72] dark:text-[#9aa59d]">
                Latest customer reservations across all your listed properties
              </p>
            </div>
            <Link
              to="/owner/bookings"
              className="text-xs font-semibold text-[#244b38] hover:underline dark:text-[#34d399]"
            >
              View All ({mockOwnerBookings.length}) →
            </Link>
          </div>

          <div className="overflow-x-auto mt-4">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-[#eeece6] text-[10px] font-semibold uppercase tracking-wider text-[#858f87] dark:border-[#243329]">
                  <th className="pb-3 pr-4">Reference</th>
                  <th className="pb-3 pr-4">Guest</th>
                  <th className="pb-3 pr-4">Property & Room</th>
                  <th className="pb-3 pr-4">Stay Dates</th>
                  <th className="pb-3 pr-4">Total</th>
                  <th className="pb-3">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#f2efe8] dark:divide-[#1d2b22]">
                {recentBookings.map((b) => (
                  <tr key={b.id} className="hover:bg-[#faf8f4] dark:hover:bg-[#19261e]">
                    <td className="py-3.5 pr-4 font-mono font-semibold text-[#244b38] dark:text-[#34d399]">
                      {b.reference}
                    </td>
                    <td className="py-3.5 pr-4">
                      <strong>{b.guestName}</strong>
                      <span className="block text-[10px] text-[#757b72]">{b.guestPhone}</span>
                    </td>
                    <td className="py-3.5 pr-4">
                      <span>{b.propertyName}</span>
                      <span className="block text-[10px] text-[#b18a57]">{b.roomName}</span>
                    </td>
                    <td className="py-3.5 pr-4">
                      <span>{b.checkIn} → {b.checkOut}</span>
                      <span className="block text-[10px] text-[#757b72]">{b.nights} nights</span>
                    </td>
                    <td className="py-3.5 pr-4 font-semibold">
                      {formatPrice(b.totalAmount)}
                    </td>
                    <td className="py-3.5">
                      <StatusBadge status={b.status} />
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
