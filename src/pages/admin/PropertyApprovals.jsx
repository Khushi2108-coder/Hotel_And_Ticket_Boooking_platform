import { useState } from "react";
import AdminSidebar from "../../components/dashboard/AdminSidebar";
import DashboardHeader from "../../components/dashboard/DashboardHeader";
import StatusBadge from "../../components/dashboard/StatusBadge";
import ConfirmActionModal from "../../components/dashboard/ConfirmActionModal";
import { mockPendingApprovals } from "../../data/mockDashboardData";
import { useCurrency } from "../../context/CurrencyContext";

/**
 * StayEase — Admin Property Licensing & Approvals (/admin/properties)
 *
 * Features:
 * - Review newly submitted property listings
 * - Inspect owner documents, photo quality, pricing, and amenities
 * - Approve or Reject with constructive revision feedback
 */
export default function PropertyApprovals({ onNotify }) {
  const { formatPrice } = useCurrency();
  const [approvals, setApprovals] = useState(mockPendingApprovals);
  const [decisionTarget, setDecisionTarget] = useState(null); // { item, type: 'approve' | 'reject' }

  const handleExecuteDecision = () => {
    if (!decisionTarget) return;

    setApprovals((prev) => prev.filter((a) => a.id !== decisionTarget.item.id));

    if (onNotify) {
      onNotify({
        type: decisionTarget.type === "approve" ? "success" : "info",
        title: decisionTarget.type === "approve" ? "Property Approved! 🛡️" : "Revision Requested",
        message: `${decisionTarget.item.propertyName} has been ${decisionTarget.type === "approve" ? "approved for public search" : "returned for revision"}.`,
      });
    }

    setDecisionTarget(null);
  };

  return (
    <div className="flex min-h-screen bg-[#fcfbf8] text-[#26382d] transition-colors duration-300 dark:bg-[#0c120e] dark:text-[#f0f4f0]">
      <AdminSidebar />

      <main className="flex-1 overflow-y-auto px-5 py-8 sm:px-8 lg:px-12">
        <DashboardHeader
          title="Property Verification & Licensing Queue"
          subtitle="Audit owner credentials, business licensing, photos, and compliance before publication."
          eyebrow="Compliance & Quality"
          badge={`${approvals.length} Pending`}
        />

        {approvals.length === 0 ? (
          <div className="rounded-3xl border border-[#e9e5dc] bg-white p-12 text-center shadow-xs dark:border-[#2a3c30] dark:bg-[#152019]">
            <span className="text-3xl block">✓</span>
            <h3 className="font-serif text-xl font-medium mt-2 text-[#244b38] dark:text-[#34d399]">
              Queue Clear!
            </h3>
            <p className="text-xs text-[#757b72] mt-1">
              All submitted properties have been reviewed and published.
            </p>
          </div>
        ) : (
          <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
            {approvals.map((appr) => (
              <div
                key={appr.id}
                className="overflow-hidden rounded-3xl border border-[#e9e5dc] bg-white shadow-xs dark:border-[#2a3c30] dark:bg-[#152019] flex flex-col justify-between"
              >
                <div>
                  <div className="relative aspect-[16/9] w-full overflow-hidden bg-[#eee]">
                    <img
                      src={appr.image}
                      alt={appr.propertyName}
                      className="h-full w-full object-cover"
                    />
                    <div className="absolute top-3 left-3">
                      <StatusBadge status={appr.documentsStatus} />
                    </div>
                  </div>

                  <div className="p-5">
                    <span className="text-[10px] uppercase tracking-wider font-semibold text-[#b18a57] dark:text-[#fbbf24]">
                      Submitted on {appr.submittedDate}
                    </span>
                    <h3 className="mt-1 font-serif text-lg font-bold text-[#244b38] dark:text-[#f0f4f0]">
                      {appr.propertyName}
                    </h3>
                    <p className="text-xs text-[#757b72] dark:text-[#9aa59d]">
                      📍 {appr.city}
                    </p>

                    <p className="mt-3 text-xs leading-5 text-[#59635a] line-clamp-2 dark:text-[#a0b0a3]">
                      {appr.description}
                    </p>

                    <div className="mt-4 grid grid-cols-2 gap-2 border-y border-[#eeece6] py-3 text-xs dark:border-[#243329]">
                      <div>
                        <span className="text-[10px] text-[#757b72] block">Owner</span>
                        <strong>{appr.ownerName}</strong>
                        <span className="block text-[10px] text-[#858f87]">{appr.ownerEmail}</span>
                      </div>
                      <div className="text-right">
                        <span className="text-[10px] text-[#757b72] block">Proposed Rate</span>
                        <strong className="text-[#244b38] dark:text-[#34d399]">
                          {formatPrice(appr.basePrice)}
                        </strong>
                        <span className="block text-[10px] text-[#858f87]">{appr.roomsCount} Rooms</span>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="p-5 pt-0 flex gap-2">
                  <button
                    type="button"
                    onClick={() => setDecisionTarget({ item: appr, type: "reject" })}
                    className="flex-1 rounded-xl border border-[#fed7d7] py-2 text-xs font-semibold text-[#c53030] hover:bg-[#fff5f5] dark:border-[#4d1d1d]"
                  >
                    Request Revision
                  </button>
                  <button
                    type="button"
                    onClick={() => setDecisionTarget({ item: appr, type: "approve" })}
                    className="flex-1 rounded-xl bg-[#244b38] py-2 text-xs font-semibold text-white hover:bg-[#193829] dark:bg-[#34d399] dark:text-[#0b120e]"
                  >
                    Approve Property
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Action Confirmation Modal */}
        <ConfirmActionModal
          isOpen={!!decisionTarget}
          title={decisionTarget?.type === "approve" ? "Approve & Publish Property?" : "Request Revisions from Owner?"}
          message={
            decisionTarget?.type === "approve"
              ? `Are you sure you want to approve "${decisionTarget?.item.propertyName}"? It will instantly become discoverable to all guests.`
              : `Specify required revisions for "${decisionTarget?.item.propertyName}". Owner will receive notification.`
          }
          confirmText={decisionTarget?.type === "approve" ? "Approve Listing" : "Send Revision Request"}
          confirmVariant={decisionTarget?.type === "approve" ? "primary" : "danger"}
          onConfirm={handleExecuteDecision}
          onCancel={() => setDecisionTarget(null)}
        />
      </main>
    </div>
  );
}
