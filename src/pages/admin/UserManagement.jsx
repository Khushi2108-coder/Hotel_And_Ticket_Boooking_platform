import { useState } from "react";
import AdminSidebar from "../../components/dashboard/AdminSidebar";
import DashboardHeader from "../../components/dashboard/DashboardHeader";
import StatusBadge from "../../components/dashboard/StatusBadge";
import DataTable from "../../components/dashboard/DataTable";
import ConfirmActionModal from "../../components/dashboard/ConfirmActionModal";
import { mockAdminUsers } from "../../data/mockDashboardData";

/**
 * StayEase — Admin User Management (/admin/users)
 *
 * Features:
 * - List all registered guests, hotel partners, and admins
 * - Filter by role (User, Owner, Admin)
 * - Suspend / Activate user accounts
 * - Role elevation
 */
export default function UserManagement({ onNotify }) {
  const [users, setUsers] = useState(mockAdminUsers);
  const [roleFilter, setRoleFilter] = useState("all");
  const [statusTarget, setStatusTarget] = useState(null);

  const filteredUsers = users.filter((u) => {
    if (roleFilter === "all") return true;
    return u.role.toLowerCase() === roleFilter.toLowerCase();
  });

  const handleToggleStatus = () => {
    if (!statusTarget) return;
    const newStatus = statusTarget.status === "Active" ? "Suspended" : "Active";
    setUsers((prev) =>
      prev.map((u) => (u.id === statusTarget.id ? { ...u, status: newStatus } : u))
    );
    if (onNotify) {
      onNotify({
        type: "info",
        title: "Account Status Changed",
        message: `${statusTarget.name} has been marked as ${newStatus}.`,
      });
    }
    setStatusTarget(null);
  };

  const handleRoleChange = (userId, newRole) => {
    setUsers((prev) =>
      prev.map((u) => (u.id === userId ? { ...u, role: newRole } : u))
    );
    if (onNotify) {
      onNotify({
        type: "success",
        title: "Role Updated",
        message: `User permissions updated to ${newRole}.`,
      });
    }
  };

  const columns = [
    {
      header: "User Details",
      accessor: "name",
      cell: (row) => (
        <div>
          <strong className="block text-xs font-semibold text-[#244b38] dark:text-[#f0f4f0]">
            {row.name}
          </strong>
          <span className="text-[10px] text-[#757b72]">{row.email}</span>
        </div>
      ),
    },
    {
      header: "Platform Role",
      accessor: "role",
      cell: (row) => (
        <select
          value={row.role}
          onChange={(e) => handleRoleChange(row.id, e.target.value)}
          className="rounded-lg border border-[#dedbd2] bg-[#fbf9f4] px-2.5 py-1 text-xs font-semibold dark:border-[#2d3d32] dark:bg-[#111914]"
        >
          <option value="User">Guest User</option>
          <option value="Owner">Property Owner</option>
          <option value="Admin">Administrator</option>
        </select>
      ),
    },
    {
      header: "Loyalty Tier",
      accessor: "tier",
      cell: (row) => (
        <span className="text-xs font-medium text-[#b18a57] dark:text-[#fbbf24]">
          ✦ {row.tier}
        </span>
      ),
    },
    {
      header: "Member Since",
      accessor: "joinedDate",
      cell: (row) => (
        <span className="text-xs text-[#757b72]">{row.joinedDate}</span>
      ),
    },
    {
      header: "Status",
      accessor: "status",
      cell: (row) => <StatusBadge status={row.status} />,
    },
    {
      header: "Action",
      accessor: "actions",
      cell: (row) => (
        <button
          type="button"
          onClick={() => setStatusTarget(row)}
          className={`rounded-lg px-3 py-1 text-xs font-semibold transition ${
            row.status === "Active"
              ? "border border-[#fed7d7] text-[#c53030] hover:bg-[#fff5f5] dark:border-[#4d1d1d]"
              : "border border-[#cbe0ce] text-[#244b38] hover:bg-[#edf3ec] dark:text-[#34d399]"
          }`}
        >
          {row.status === "Active" ? "Suspend" : "Activate"}
        </button>
      ),
    },
  ];

  return (
    <div className="flex min-h-screen bg-[#fcfbf8] text-[#26382d] transition-colors duration-300 dark:bg-[#0c120e] dark:text-[#f0f4f0]">
      <AdminSidebar />

      <main className="flex-1 overflow-y-auto px-5 py-8 sm:px-8 lg:px-12">
        <DashboardHeader
          title="User Account Directory & Moderation"
          subtitle="Manage member profiles, partner accounts, privileges, and platform suspensions."
          eyebrow="Identity Control"
        />

        {/* Role Filters */}
        <div className="flex items-center gap-2 mb-6 border-b border-[#e9e5dc] pb-3 text-xs dark:border-[#2a3c30]">
          {["all", "user", "owner"].map((r) => (
            <button
              key={r}
              type="button"
              onClick={() => setRoleFilter(r)}
              className={`rounded-xl px-3.5 py-1.5 font-semibold capitalize transition ${
                roleFilter === r
                  ? "bg-[#244b38] text-white dark:bg-[#34d399] dark:text-[#0a120e]"
                  : "text-[#757b72] hover:bg-[#edf3ec] dark:hover:bg-[#1f3025]"
              }`}
            >
              {r === "all" ? "All Accounts" : `${r}s`}
            </button>
          ))}
        </div>

        <DataTable
          columns={columns}
          data={filteredUsers}
          searchPlaceholder="Search by user name or email..."
          searchKey="name"
        />

        <ConfirmActionModal
          isOpen={!!statusTarget}
          title={statusTarget?.status === "Active" ? "Suspend User Account?" : "Reactivate User Account?"}
          message={`Are you sure you want to change the active state for ${statusTarget?.name} (${statusTarget?.email})?`}
          confirmText={statusTarget?.status === "Active" ? "Suspend Account" : "Activate Account"}
          onConfirm={handleToggleStatus}
          onCancel={() => setStatusTarget(null)}
        />
      </main>
    </div>
  );
}

