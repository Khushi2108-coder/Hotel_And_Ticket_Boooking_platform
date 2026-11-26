import { useState } from "react";
import OwnerSidebar from "../../components/dashboard/OwnerSidebar";
import DashboardHeader from "../../components/dashboard/DashboardHeader";
import StatusBadge from "../../components/dashboard/StatusBadge";
import ConfirmActionModal from "../../components/dashboard/ConfirmActionModal";
import { mockPricingRules, mockOwnerProperties } from "../../data/mockDashboardData";

/**
 * StayEase — Dynamic Pricing & Rate Strategy Rules (/owner/pricing)
 *
 * Features:
 * - Base pricing strategy
 * - Weekend surge toggles (+15%, +20%)
 * - Seasonal multiplier rule creation
 * - Length-of-stay discount rules (e.g. 10% off for 4+ nights)
 * - Rule activation / deactivation
 */
export default function PricingManagement({ onNotify }) {
  const [rules, setRules] = useState(mockPricingRules);
  const [weekendSurgeEnabled, setWeekendSurgeEnabled] = useState(true);
  const [weekendPercentage, setWeekendPercentage] = useState(15);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState(null);

  const [form, setForm] = useState({
    propertyId: mockOwnerProperties[0].id,
    name: "",
    type: "Seasonal",
    multiplier: "1.25",
    startDate: "2026-12-20",
    endDate: "2027-01-05",
    description: "",
  });

  const handleCreateRule = (e) => {
    e.preventDefault();
    if (!form.name.trim() || !form.multiplier) {
      if (onNotify) {
        onNotify({
          type: "warning",
          title: "Required Fields",
          message: "Please enter rule name and rate multiplier.",
        });
      }
      return;
    }

    const prop = mockOwnerProperties.find((p) => p.id === form.propertyId) || mockOwnerProperties[0];
    const newRule = {
      id: `pr-${Date.now()}`,
      propertyId: form.propertyId,
      propertyName: prop.name,
      name: form.name,
      type: form.type,
      multiplier: Number(form.multiplier),
      startDate: form.startDate,
      endDate: form.endDate,
      status: "Active",
      description: form.description || `${form.multiplier}x rate adjustment rule.`,
    };

    setRules((prev) => [newRule, ...prev]);
    if (onNotify) {
      onNotify({
        type: "success",
        title: "Pricing Rule Created 🏷️",
        message: `${form.name} is now active.`,
      });
    }
    setIsModalOpen(false);
  };

  const handleToggleRule = (id) => {
    setRules((prev) =>
      prev.map((r) =>
        r.id === id ? { ...r, status: r.status === "Active" ? "Paused" : "Active" } : r
      )
    );
    if (onNotify) {
      onNotify({
        type: "info",
        title: "Rule Status Changed",
        message: "Pricing strategy rule state updated.",
      });
    }
  };

  const handleDeleteRule = () => {
    if (!deleteTarget) return;
    setRules((prev) => prev.filter((r) => r.id !== deleteTarget.id));
    if (onNotify) {
      onNotify({
        type: "info",
        title: "Rule Removed",
        message: `${deleteTarget.name} has been deleted.`,
      });
    }
    setDeleteTarget(null);
  };

  return (
    <div className="flex min-h-screen bg-[#fcfbf8] text-[#26382d] transition-colors duration-300 dark:bg-[#0c120e] dark:text-[#f0f4f0]">
      <OwnerSidebar />

      <main className="flex-1 overflow-y-auto px-5 py-8 sm:px-8 lg:px-12">
        <DashboardHeader
          title="Dynamic Pricing & Rate Management"
          subtitle="Configure automatic weekend surges, seasonal peaks, and length-of-stay loyalty discounts."
          eyebrow="Pricing Strategy Engine"
          actionText="+ New Pricing Rule"
          onActionClick={() => setIsModalOpen(true)}
        />

        {/* Global Weekend Surge Control Card */}
        <div className="mb-8 rounded-3xl border border-[#e9e5dc] bg-white p-6 shadow-xs dark:border-[#2a3c30] dark:bg-[#152019]">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <div className="flex items-center gap-2">
                <span className="text-lg">⚡</span>
                <h3 className="font-serif text-lg font-bold text-[#244b38] dark:text-[#f0f4f0]">
                  Automated Weekend Peak Surge
                </h3>
                <span className="rounded-full bg-[#edf3ec] px-2.5 py-0.5 text-[10px] font-bold text-[#244b38] dark:bg-[#1f3427] dark:text-[#34d399]">
                  Smart Dynamic Rate
                </span>
              </div>
              <p className="mt-1 text-xs text-[#757b72] dark:text-[#9aa59d]">
                Automatically apply a weekend adjustment for reservations touching Friday and Saturday nights.
              </p>
            </div>

            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2 text-xs">
                <span className="text-[#757b72]">Surge:</span>
                <select
                  disabled={!weekendSurgeEnabled}
                  value={weekendPercentage}
                  onChange={(e) => setWeekendPercentage(Number(e.target.value))}
                  className="rounded-xl border border-[#dedbd2] bg-[#fbf9f4] px-2.5 py-1.5 font-bold dark:border-[#2d3d32] dark:bg-[#111914]"
                >
                  <option value={10}>+10%</option>
                  <option value={15}>+15%</option>
                  <option value={20}>+20%</option>
                  <option value={25}>+25%</option>
                </select>
              </div>

              <button
                type="button"
                onClick={() => setWeekendSurgeEnabled(!weekendSurgeEnabled)}
                className={`rounded-xl px-4 py-2 text-xs font-semibold transition ${
                  weekendSurgeEnabled
                    ? "bg-[#244b38] text-white dark:bg-[#34d399] dark:text-[#0b120e]"
                    : "border border-[#dedbd2] text-[#757b72] hover:bg-[#f6f4ed]"
                }`}
              >
                {weekendSurgeEnabled ? "Active (Enabled)" : "Disabled"}
              </button>
            </div>
          </div>
        </div>

        {/* Pricing Rules Listing */}
        <div className="space-y-4">
          <h3 className="font-serif text-xl font-medium text-[#244b38] dark:text-[#f0f4f0]">
            Active Dynamic Rate Rules ({rules.length})
          </h3>

          <div className="grid gap-4 md:grid-cols-2">
            {rules.map((rule) => {
              const isDiscount = rule.multiplier < 1;
              const percent = Math.round(Math.abs(rule.multiplier - 1) * 100);

              return (
                <div
                  key={rule.id}
                  className="rounded-3xl border border-[#e9e5dc] bg-white p-5 shadow-xs transition hover:shadow-md dark:border-[#2a3c30] dark:bg-[#152019] flex flex-col justify-between"
                >
                  <div>
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <span className="text-[10px] font-semibold uppercase tracking-wider text-[#b18a57] dark:text-[#fbbf24]">
                          {rule.propertyName}
                        </span>
                        <h4 className="font-serif text-base font-bold text-[#244b38] dark:text-[#f0f4f0]">
                          {rule.name}
                        </h4>
                      </div>
                      <StatusBadge status={rule.status} />
                    </div>

                    <p className="mt-2 text-xs text-[#757b72] dark:text-[#9aa59d]">
                      {rule.description}
                    </p>

                    <div className="mt-4 flex items-center gap-3 text-xs border-t border-[#eeece6] pt-3 dark:border-[#243329]">
                      <div className="rounded-xl bg-[#fbf9f4] px-3 py-1.5 dark:bg-[#17231b]">
                        <span className="text-[10px] text-[#757b72] block">Adjustment</span>
                        <strong
                          className={
                            isDiscount
                              ? "text-[#287a4c] dark:text-[#34d399]"
                              : "text-[#c53030] dark:text-[#f87171]"
                          }
                        >
                          {isDiscount ? `-${percent}% Discount` : `+${percent}% Surge`}
                        </strong>
                      </div>

                      <div className="rounded-xl bg-[#fbf9f4] px-3 py-1.5 dark:bg-[#17231b]">
                        <span className="text-[10px] text-[#757b72] block">Rule Type</span>
                        <strong>{rule.type}</strong>
                      </div>
                    </div>
                  </div>

                  <div className="mt-5 flex items-center justify-end gap-2 border-t border-[#eeece6] pt-3 dark:border-[#243329]">
                    <button
                      type="button"
                      onClick={() => handleToggleRule(rule.id)}
                      className="rounded-xl border border-[#dedbd2] px-3 py-1.5 text-xs font-semibold hover:bg-[#f6f4ed] dark:border-[#2d3d32] dark:hover:bg-[#1f2d23]"
                    >
                      {rule.status === "Active" ? "Pause Rule" : "Activate Rule"}
                    </button>
                    <button
                      type="button"
                      onClick={() => setDeleteTarget(rule)}
                      className="rounded-xl border border-[#dedbd2] px-3 py-1.5 text-xs font-semibold text-[#c53030] hover:bg-[#fff5f5] dark:border-[#2d3d32]"
                    >
                      Delete
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Create Rule Modal */}
        {isModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
            <div className="w-full max-w-md rounded-3xl border border-[#e9e5dc] bg-white p-6 shadow-2xl dark:border-[#2a3c30] dark:bg-[#152019]">
              <div className="flex items-center justify-between pb-3 border-b border-[#eeece6] dark:border-[#243329]">
                <h3 className="font-serif text-xl font-medium text-[#244b38] dark:text-[#f0f4f0]">
                  Create Dynamic Rate Rule
                </h3>
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="text-base text-[#858f87]"
                >
                  ✕
                </button>
              </div>

              <form onSubmit={handleCreateRule} className="mt-4 space-y-4 text-xs">
                <div>
                  <label className="block font-semibold mb-1">Target Property *</label>
                  <select
                    value={form.propertyId}
                    onChange={(e) => setForm({ ...form, propertyId: e.target.value })}
                    className="w-full rounded-xl border border-[#dedbd2] bg-[#fbf9f4] p-2.5 outline-none dark:border-[#2d3d32] dark:bg-[#111914]"
                  >
                    {mockOwnerProperties.map((p) => (
                      <option key={p.id} value={p.id}>
                        {p.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block font-semibold mb-1">Rule Name *</label>
                  <input
                    type="text"
                    required
                    value={form.name}
                    onChange={(e) => setForm({ ...form, name: e.target.value })}
                    placeholder="e.g. Christmas Peak Holiday"
                    className="w-full rounded-xl border border-[#dedbd2] bg-[#fbf9f4] p-2.5 outline-none dark:border-[#2d3d32] dark:bg-[#111914]"
                  />
                </div>

                <div className="grid gap-3 sm:grid-cols-2">
                  <div>
                    <label className="block font-semibold mb-1">Rule Type</label>
                    <select
                      value={form.type}
                      onChange={(e) => setForm({ ...form, type: e.target.value })}
                      className="w-full rounded-xl border border-[#dedbd2] bg-[#fbf9f4] p-2.5 outline-none dark:border-[#2d3d32] dark:bg-[#111914]"
                    >
                      <option>Seasonal</option>
                      <option>Weekend</option>
                      <option>Length of Stay</option>
                      <option>Last-Minute Saver</option>
                    </select>
                  </div>
                  <div>
                    <label className="block font-semibold mb-1">Multiplier (e.g. 1.2 = +20%) *</label>
                    <input
                      type="number"
                      step="0.05"
                      min="0.5"
                      max="3.0"
                      required
                      value={form.multiplier}
                      onChange={(e) => setForm({ ...form, multiplier: e.target.value })}
                      className="w-full rounded-xl border border-[#dedbd2] bg-[#fbf9f4] p-2.5 outline-none dark:border-[#2d3d32] dark:bg-[#111914]"
                    />
                  </div>
                </div>

                <div>
                  <label className="block font-semibold mb-1">Description</label>
                  <input
                    type="text"
                    value={form.description}
                    onChange={(e) => setForm({ ...form, description: e.target.value })}
                    placeholder="e.g. 20% surcharge on holiday dates"
                    className="w-full rounded-xl border border-[#dedbd2] bg-[#fbf9f4] p-2.5 outline-none dark:border-[#2d3d32] dark:bg-[#111914]"
                  />
                </div>

                <div className="flex justify-end gap-2 pt-3 border-t border-[#eeece6] dark:border-[#243329]">
                  <button
                    type="button"
                    onClick={() => setIsModalOpen(false)}
                    className="rounded-xl border border-[#dedbd2] px-4 py-2 font-semibold"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="rounded-xl bg-[#244b38] px-5 py-2 font-semibold text-white hover:bg-[#193829] dark:bg-[#34d399] dark:text-[#0b120e]"
                  >
                    Save Rule
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        <ConfirmActionModal
          isOpen={!!deleteTarget}
          title="Delete Pricing Rule?"
          message={`Are you sure you want to remove the rate rule "${deleteTarget?.name}"?`}
          confirmText="Delete Rule"
          onConfirm={handleDeleteRule}
          onCancel={() => setDeleteTarget(null)}
        />
      </main>
    </div>
  );
}

