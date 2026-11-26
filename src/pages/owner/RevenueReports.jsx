import { useState } from "react";
import OwnerSidebar from "../../components/dashboard/OwnerSidebar";
import DashboardHeader from "../../components/dashboard/DashboardHeader";
import DashboardStatsCard from "../../components/dashboard/DashboardStatsCard";
import { mockRevenueChartData } from "../../data/mockDashboardData";
import { useCurrency } from "../../context/CurrencyContext";

/**
 * StayEase — Owner Revenue & Financial Performance Reports (/owner/revenue)
 *
 * Features:
 * - Date range filter (Last 30 Days, Last Quarter, Year to Date)
 * - Gross revenue, net payout, and ADR breakdown
 * - Visual monthly revenue & booking volume trend chart
 * - Property-wise revenue contribution table
 */
export default function RevenueReports({ onNotify }) {
  const { formatPrice } = useCurrency();
  const [timeRange, setTimeRange] = useState("ytd");

  const propertyContributions = [
    {
      id: "prop-01",
      name: "Coastal Palm Retreat",
      city: "Goa",
      bookingsCount: 68,
      grossRevenue: 428000,
      share: 47.8,
      avgStay: 3.2,
    },
    {
      id: "prop-02",
      name: "Lakeview Heritage Palace",
      city: "Udaipur",
      bookingsCount: 44,
      grossRevenue: 316800,
      share: 35.4,
      avgStay: 2.8,
    },
    {
      id: "prop-03",
      name: "Pine Valley Escape",
      city: "Manali",
      bookingsCount: 30,
      grossRevenue: 149700,
      share: 16.8,
      avgStay: 3.4,
    },
  ];

  const handleExportCSV = () => {
    if (onNotify) {
      onNotify({
        type: "success",
        title: "Financial Statement Exported",
        message: "CSV statement for FY26 has been generated.",
      });
    }
  };

  return (
    <div className="flex min-h-screen bg-[#fcfbf8] text-[#26382d] transition-colors duration-300 dark:bg-[#0c120e] dark:text-[#f0f4f0]">
      <OwnerSidebar />

      <main className="flex-1 overflow-y-auto px-5 py-8 sm:px-8 lg:px-12">
        <DashboardHeader
          title="Revenue & Performance Analytics"
          subtitle="Financial settlements, property contribution breakdowns, and occupancy performance."
          eyebrow="Financial Intelligence"
          actionText="Export CSV Statement"
          actionIcon="📥"
          onActionClick={handleExportCSV}
        />

        {/* Time Filter Pill Selector */}
        <div className="flex items-center gap-2 mb-6 border-b border-[#e9e5dc] pb-3 text-xs dark:border-[#2a3c30]">
          <span className="text-[#757b72] font-semibold mr-2">Reporting Period:</span>
          {[
            { id: "30d", label: "Last 30 Days" },
            { id: "quarter", label: "Last Quarter" },
            { id: "ytd", label: "Year to Date (2026)" },
          ].map((item) => (
            <button
              key={item.id}
              type="button"
              onClick={() => setTimeRange(item.id)}
              className={`rounded-xl px-3.5 py-1.5 font-semibold transition ${
                timeRange === item.id
                  ? "bg-[#244b38] text-white dark:bg-[#34d399] dark:text-[#0b120e]"
                  : "text-[#757b72] hover:bg-[#edf3ec] dark:hover:bg-[#1f3025]"
              }`}
            >
              {item.label}
            </button>
          ))}
        </div>

        {/* Revenue Key Metric Cards */}
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <DashboardStatsCard
            title="Total Realized Revenue"
            value={formatPrice(894500)}
            change="18.2%"
            isPositive={true}
            icon="💰"
            caption="across all 3 properties"
          />
          <DashboardStatsCard
            title="Estimated Net Payout"
            value={formatPrice(805050)}
            change="17.9%"
            isPositive={true}
            icon="🏦"
            caption="after 10% platform commission"
          />
          <DashboardStatsCard
            title="Avg. Stay Value"
            value={formatPrice(6300)}
            change="5.4%"
            isPositive={true}
            icon="💳"
            caption="per confirmed booking"
          />
          <DashboardStatsCard
            title="Cancellation Rate"
            value="3.5%"
            change="1.2%"
            isPositive={true}
            icon="📉"
            caption="lower than market average"
          />
        </div>

        {/* Visual Monthly Performance Graph */}
        <div className="mt-8 rounded-3xl border border-[#e9e5dc] bg-white p-6 shadow-xs dark:border-[#2a3c30] dark:bg-[#152019]">
          <div className="flex items-center justify-between pb-4 border-b border-[#eeece6] dark:border-[#243329]">
            <div>
              <h3 className="font-serif text-lg font-medium text-[#244b38] dark:text-[#f0f4f0]">
                Monthly Payout & Volume Velocity
              </h3>
              <p className="text-[11px] text-[#757b72] dark:text-[#9aa59d]">
                Comparison between gross revenue and total reservation count
              </p>
            </div>
            <span className="text-xs font-semibold text-[#b18a57] dark:text-[#fbbf24]">
              FY 2026-27
            </span>
          </div>

          <div className="mt-6 flex h-60 items-end justify-between gap-4 px-3">
            {mockRevenueChartData.map((d) => {
              const heightPct = Math.round((d.revenue / 950000) * 100);
              return (
                <div key={d.month} className="flex flex-1 flex-col items-center gap-2 h-full justify-end group">
                  <div className="relative w-full flex justify-center">
                    <span className="absolute -top-8 hidden group-hover:block rounded-md bg-[#244b38] px-2.5 py-1 text-[11px] text-white z-10 whitespace-nowrap shadow-lg">
                      {formatPrice(d.revenue)} ({d.bookings} stays)
                    </span>
                  </div>

                  <div
                    style={{ height: `${heightPct}%` }}
                    className="w-full max-w-[48px] rounded-t-xl bg-gradient-to-t from-[#244b38] to-[#347856] opacity-90 transition-all group-hover:opacity-100 dark:from-[#1b432e] dark:to-[#34d399]"
                  />
                  <span className="text-xs font-medium text-[#757b72] dark:text-[#88998d]">
                    {d.month}
                  </span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Property Revenue Contribution Breakdown */}
        <div className="mt-8 rounded-3xl border border-[#e9e5dc] bg-white p-6 shadow-xs dark:border-[#2a3c30] dark:bg-[#152019]">
          <h3 className="font-serif text-lg font-medium text-[#244b38] dark:text-[#f0f4f0] mb-4">
            Property-Wise Revenue Distribution
          </h3>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-[#eeece6] text-[10px] font-semibold uppercase tracking-wider text-[#858f87] dark:border-[#243329]">
                  <th className="pb-3 pr-4">Property</th>
                  <th className="pb-3 pr-4">Total Reservations</th>
                  <th className="pb-3 pr-4">Avg. Stay Length</th>
                  <th className="pb-3 pr-4">Gross Revenue</th>
                  <th className="pb-3 pr-4">Portfolio Share</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#f2efe8] dark:divide-[#1d2b22]">
                {propertyContributions.map((p) => (
                  <tr key={p.id} className="hover:bg-[#faf8f4] dark:hover:bg-[#19261e]">
                    <td className="py-3.5 pr-4 font-semibold text-[#244b38] dark:text-[#f0f4f0]">
                      {p.name}
                      <span className="block text-[10px] font-normal text-[#757b72]">{p.city}</span>
                    </td>
                    <td className="py-3.5 pr-4">
                      {p.bookingsCount} completed stays
                    </td>
                    <td className="py-3.5 pr-4">
                      {p.avgStay} nights
                    </td>
                    <td className="py-3.5 pr-4 font-bold text-sm text-[#244b38] dark:text-[#34d399]">
                      {formatPrice(p.grossRevenue)}
                    </td>
                    <td className="py-3.5 pr-4">
                      <div className="flex items-center gap-2">
                        <div className="h-2 w-24 rounded-full bg-[#eeece6] overflow-hidden dark:bg-[#203025]">
                          <div
                            style={{ width: `${p.share}%` }}
                            className="h-full bg-[#244b38] dark:bg-[#34d399]"
                          />
                        </div>
                        <span className="font-semibold text-[11px]">{p.share}%</span>
                      </div>
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
