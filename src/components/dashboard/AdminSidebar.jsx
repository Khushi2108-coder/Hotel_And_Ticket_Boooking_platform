import { useState } from "react";
import { Link, NavLink } from "react-router-dom";

/**
 * StayEase — Admin Dashboard Left Navigation Sidebar
 */
export default function AdminSidebar() {
  const [mobileOpen, setMobileOpen] = useState(false);

  const links = [
    { to: "/admin", label: "Platform Overview", icon: "⚡" },
    { to: "/admin/users", label: "User Management", icon: "👥" },
    { to: "/admin/properties", label: "Property Approvals", icon: "🛡️" },
    { to: "/admin/bookings", label: "Master Bookings", icon: "📑" },
  ];

  const navLinkClass = ({ isActive }) =>
    `flex items-center gap-3 px-3.5 py-2.5 rounded-2xl text-xs font-medium transition-all ${
      isActive
        ? "bg-[#244b38] text-white shadow-sm font-semibold dark:bg-[#34d399] dark:text-[#0b120e]"
        : "text-[#5a645c] hover:bg-[#edf3ec] hover:text-[#244b38] dark:text-[#9bb0a2] dark:hover:bg-[#1a2b20] dark:hover:text-[#e4ede6]"
    }`;

  const sidebarContent = (
    <div className="flex h-full flex-col justify-between p-4">
      <div>
        {/* Brand Header */}
        <div className="flex items-center gap-3 px-2 py-3 mb-4 border-b border-[#e9e5dc] dark:border-[#2a3c30]">
          <span className="flex h-10 w-10 items-center justify-center rounded-2xl bg-[#b18a57] font-serif text-xl font-bold text-white shadow-sm dark:bg-[#fbbf24] dark:text-[#0a120e]">
            A
          </span>
          <div>
            <span className="block font-serif text-lg font-bold leading-none text-[#24402f] dark:text-[#f0f4f0]">
              StayEase<span className="text-[#b18a57] dark:text-[#34d399]">.</span>
            </span>
            <span className="mt-1 block text-[9px] uppercase tracking-[1.8px] text-[#b18a57] dark:text-[#fbbf24]">
              Admin Control
            </span>
          </div>
        </div>

        {/* Navigation Links */}
        <nav className="space-y-1">
          {links.map((link) => (
            <NavLink
              key={link.to}
              to={link.to}
              end={link.to === "/admin"}
              onClick={() => setMobileOpen(false)}
              className={navLinkClass}
            >
              <span className="text-sm">{link.icon}</span>
              <span>{link.label}</span>
            </NavLink>
          ))}
        </nav>
      </div>

      {/* Footer Return Action */}
      <div className="pt-4 border-t border-[#e9e5dc] dark:border-[#2a3c30]">
        <Link
          to="/"
          className="flex items-center justify-center gap-2 rounded-xl border border-[#dedbd2] bg-white py-2.5 text-xs font-semibold text-[#26382d] shadow-2xs transition hover:bg-[#f6f4ed] dark:border-[#2f4035] dark:bg-[#16211a] dark:text-[#e4ede6] dark:hover:bg-[#1f2d23]"
        >
          <span>←</span>
          <span>Guest View / Home</span>
        </Link>
      </div>
    </div>
  );

  return (
    <>
      {/* Mobile Toggle Button */}
      <div className="sticky top-0 z-30 flex items-center justify-between border-b border-[#e9e5dc] bg-white px-4 py-3 lg:hidden dark:border-[#2a3c30] dark:bg-[#121915]">
        <div className="flex items-center gap-2">
          <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-[#b18a57] font-serif text-sm font-bold text-white dark:bg-[#fbbf24] dark:text-[#0a120e]">
            A
          </span>
          <span className="font-serif text-base font-semibold text-[#244b38] dark:text-[#f0f4f0]">
            Admin Control
          </span>
        </div>
        <button
          type="button"
          onClick={() => setMobileOpen(!mobileOpen)}
          className="rounded-xl border border-[#dedbd2] p-2 text-sm dark:border-[#2a3c30]"
        >
          {mobileOpen ? "✕" : "☰"}
        </button>
      </div>

      {/* Mobile Backdrop & Drawer */}
      {mobileOpen && (
        <div
          onClick={() => setMobileOpen(false)}
          className="fixed inset-0 z-40 bg-black/50 lg:hidden backdrop-blur-2xs"
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="h-full w-64 border-r border-[#e9e5dc] bg-[#fcfbf8] dark:border-[#2a3c30] dark:bg-[#121915]"
          >
            {sidebarContent}
          </div>
        </div>
      )}

      {/* Desktop Persistent Sidebar */}
      <aside className="hidden w-64 shrink-0 border-r border-[#e9e5dc] bg-[#fcfbf8] lg:block dark:border-[#2a3c30] dark:bg-[#121915]">
        <div className="sticky top-0 h-screen">{sidebarContent}</div>
      </aside>
    </>
  );
}

